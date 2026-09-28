import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer storage configuration for candidate uploads
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const cleanExt = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, cleanExt).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E6)}`;
    cb(null, `candidate_${cleanBase}-${uniqueSuffix}${cleanExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid format. Only PDF, JPEG, PNG, and WebP are supported.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
});

/**
 * On-demand ISR revalidation for Next.js
 */
async function triggerNextRevalidation(paths = []) {
  try {
    const NEXTJS_URL = process.env.NEXTJS_INTERNAL_URL || 'http://localhost:3000';
    const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'sarkari-revalidate-secret-token-2026';
    const pathList = Array.isArray(paths) ? paths : [paths];
    for (const p of pathList) {
      fetch(`${NEXTJS_URL}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: p, secret: REVALIDATE_SECRET })
      }).catch(() => {});
    }
  } catch (err) {
    // Non-blocking
  }
}

// 1. Candidate File Upload (PDF notification or cutoff screenshot)
router.post('/upload-file', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      file_url: fileUrl,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Candidate Exam Contribution (Direct publish: notification, cutoff, syllabus, dates)
router.post('/exams/:id/contribute', authenticateToken, (req, res) => {
  try {
    const examId = req.params.id;
    const {
      type: rawType,
      contribution_type,
      title,
      payload,
      file_url,
      file_name,
      file_size,
      mime_type,
      source_url,
      cutoffs: rawCutoffs,
      cutoff_rows
    } = req.body;

    let type = rawType || contribution_type || 'notification';
    if (type === 'cutoff') type = 'cutoffs';
    let cutoffs = rawCutoffs || cutoff_rows;
    if (!cutoffs && type === 'cutoffs' && payload) {
      if (Array.isArray(payload)) cutoffs = payload;
      else if (typeof payload === 'object') cutoffs = [payload];
    }

    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const contributorName = req.user?.name ? `${req.user.name} (Candidate)` : 'Candidate';

    // 1. Handle Cutoffs Submission
    if (type === 'cutoffs' && Array.isArray(cutoffs) && cutoffs.length > 0) {
      const insertCutoff = db.prepare(`
        INSERT INTO exam_cutoffs (exam_id, cycle_year, stage_name, region_or_state, category, marks, out_of, source_url, is_verified, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'published')
      `);

      const insertMany = db.transaction((rows) => {
        for (const r of rows) {
          insertCutoff.run(
            examId,
            r.cycle_year || new Date().getFullYear(),
            r.stage_name || 'Stage 1',
            r.region_or_state || exam.state || 'All India',
            r.category || 'General',
            Number(r.marks),
            r.out_of ? Number(r.out_of) : 100,
            source_url || exam.official_site
          );
        }
      });
      insertMany(cutoffs);
    } 
    // 2. Handle Dates Submission
    else if (type === 'dates') {
      const datePayload = typeof payload === 'object' ? payload : (payload ? JSON.parse(payload) : {});
      const existingDates = db.prepare("SELECT id FROM exam_content WHERE exam_id = ? AND content_type = 'dates'").get(examId);

      if (existingDates) {
        db.prepare(`
          UPDATE exam_content SET
            payload = ?, source_url = ?, status = 'published',
            uploaded_by = ?, published_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(JSON.stringify(datePayload), source_url || exam.official_site, contributorName, existingDates.id);
      } else {
        db.prepare(`
          INSERT INTO exam_content (exam_id, content_type, title, payload, source_url, status, uploaded_by, published_at)
          VALUES (?, 'dates', 'Exam Schedule (Candidate Contributed)', ?, ?, 'published', ?, CURRENT_TIMESTAMP)
        `).run(examId, JSON.stringify(datePayload), source_url || exam.official_site, contributorName);
      }

      // Mark exam as verified with candidate contribution
      db.prepare(`
        UPDATE exams SET
          data_status = 'verified',
          last_verified_at = CURRENT_TIMESTAMP,
          verified_by = ?
        WHERE id = ?
      `).run(contributorName, examId);
    } 
    // 3. Handle Notification or Syllabus Module
    else {
      const contentType = type === 'syllabus' ? 'syllabus' : 'notification';
      const existing = db.prepare('SELECT id FROM exam_content WHERE exam_id = ? AND content_type = ?').get(examId, contentType);

      if (existing) {
        db.prepare(`
          UPDATE exam_content SET
            title = ?, payload = ?, file_url = ?, file_name = ?, file_size = ?,
            mime_type = ?, source_url = ?, status = 'published', uploaded_by = ?,
            published_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          title || `${contentType.toUpperCase()} Document`,
          typeof payload === 'object' ? JSON.stringify(payload) : payload,
          file_url || null,
          file_name || null,
          file_size || null,
          mime_type || null,
          source_url || exam.official_site,
          contributorName,
          existing.id
        );
      } else {
        db.prepare(`
          INSERT INTO exam_content (
            exam_id, content_type, title, payload, file_url, file_name, file_size,
            mime_type, source_url, status, uploaded_by, published_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, CURRENT_TIMESTAMP)
        `).run(
          examId,
          contentType,
          title || `${contentType.toUpperCase()} Document`,
          typeof payload === 'object' ? JSON.stringify(payload) : payload,
          file_url || null,
          file_name || null,
          file_size || null,
          mime_type || null,
          source_url || exam.official_site,
          contributorName
        );
      }
    }

    // Trigger notification to other trackers
    try {
      const notif = db.prepare(`
        INSERT INTO notifications (exam_id, title, message, type, is_urgent)
        VALUES (?, ?, ?, 'alert', 1)
      `).run(
        examId,
        `New ${type} details updated for ${exam.short_name || exam.name}`,
        `Candidate verified ${type} has been shared directly with official portal links.`
      );
      const trackers = db.prepare('SELECT user_id FROM applications WHERE exam_id = ?').all(examId);
      const linkStmt = db.prepare('INSERT OR IGNORE INTO user_notifications (user_id, notification_id, read) VALUES (?, ?, 0)');
      trackers.forEach(t => linkStmt.run(t.user_id, notif.lastInsertRowid));
    } catch (e) {
      console.warn('Could not dispatch notifications:', e.message);
    }

    // Revalidate Next.js cache on-demand immediately
    if (exam.slug) {
      triggerNextRevalidation([`/exams/${exam.slug}`, '/', '/sitemap.xml']);
    } else {
      triggerNextRevalidation(['/', '/sitemap.xml']);
    }

    res.json({
      success: true,
      message: `Your ${type} details have been published immediately! Thank you for contributing.`
    });
  } catch (error) {
    console.error('Candidate contribution failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Get candidate contributions for an exam
router.get('/exams/:id/contributions', (req, res) => {
  try {
    const examId = req.params.id;
    const content = db.prepare(`
      SELECT id, content_type, title, file_url, file_name, source_url, uploaded_by, published_at
      FROM exam_content
      WHERE exam_id = ? AND uploaded_by LIKE '%Candidate%'
      ORDER BY id DESC
    `).all(examId);

    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
