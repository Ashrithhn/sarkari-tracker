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

// Middleware: Require Admin role
export function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.user.id);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Access denied: Admin credentials required' });
    }
    next();
  });
}

/**
 * Trigger Next.js on-demand ISR revalidation
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

// Multer storage configuration for uploads/
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
    cb(null, `${cleanBase}-${uniqueSuffix}${cleanExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, JPEG, PNG, and WebP are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max
  }
});

function logAudit(userId, action, entityType, entityId, details, req) {
  try {
    const ip = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, action, entityType, entityId, JSON.stringify(details), ip);
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

// Apply admin protection to all admin routes
router.use(requireAdmin);

// 1. Upload a file (PDF or Image)
router.post('/upload-file', upload.single('file'), (req, res) => {
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

// 2. Exam registry list (Admin view with module counts)
router.get('/exams', (req, res) => {
  try {
    const exams = db.prepare(`
      SELECT e.*, 
             (SELECT COUNT(*) FROM exam_content WHERE exam_id = e.id) as content_count,
             (SELECT COUNT(*) FROM exam_cutoffs WHERE exam_id = e.id) as cutoffs_count,
             (SELECT COUNT(*) FROM exam_pyqs WHERE exam_id = e.id) as pyqs_count,
             (SELECT COUNT(*) FROM applications WHERE exam_id = e.id) as trackers_count
      FROM exams e
      ORDER BY e.id DESC
    `).all();

    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Create new exam in registry
router.post('/exams', (req, res) => {
  try {
    const {
      name,
      short_name,
      conducting_body,
      level = 'central',
      state = null,
      category,
      official_site,
      careers_url,
      notification_url,
      results_url,
      admit_card_url,
      syllabus_source_url,
      frequency = 'annual',
      scrape_frequency = 360
    } = req.body;

    if (!name || !short_name || !conducting_body || !official_site || !category) {
      return res.status(400).json({ error: 'Required fields missing: name, short_name, conducting_body, category, official_site' });
    }

    const insert = db.prepare(`
      INSERT INTO exams (
        name, short_name, conducting_body, level, state, category,
        official_site, careers_url, notification_url, results_url,
        admit_card_url, syllabus_source_url, frequency, scrape_frequency,
        data_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'empty')
    `);

    const info = insert.run(
      name, short_name, conducting_body, level, state, category,
      official_site, careers_url || null, notification_url || null, results_url || null,
      admit_card_url || null, syllabus_source_url || null, frequency, scrape_frequency
    );

    logAudit(req.user.id, 'CREATE_EXAM', 'exam', info.lastInsertRowid, { name, short_name }, req);
    res.status(201).json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete exam from registry and clean up all associated records
router.delete('/exams/:id', (req, res) => {
  try {
    const examId = req.params.id;
    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    // Delete content, cutoffs, pyqs, applications, notifications
    db.prepare('DELETE FROM exam_content WHERE exam_id = ?').run(examId);
    db.prepare('DELETE FROM exam_cutoffs WHERE exam_id = ?').run(examId);
    db.prepare('DELETE FROM exam_pyqs WHERE exam_id = ?').run(examId);
    db.prepare('DELETE FROM applications WHERE exam_id = ?').run(examId);
    db.prepare('DELETE FROM notifications WHERE exam_id = ?').run(examId);
    db.prepare('DELETE FROM reminders WHERE exam_id = ?').run(examId);
    db.prepare('DELETE FROM exams WHERE id = ?').run(examId);

    logAudit(req.user.id, 'DELETE_EXAM', 'exam', examId, { name: exam.name }, req);

    // On-demand ISR revalidation for Next.js public site
    triggerNextRevalidation(['/', '/sitemap.xml']);

    res.json({ success: true, message: `Exam ${exam.name} and all associated dates deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Duplicate exam for new year cycle (Copies structure, RESETS all dates)
router.post('/exams/:id/duplicate', (req, res) => {
  try {
    const orig = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
    if (!orig) return res.status(404).json({ error: 'Original exam not found' });

    const newShortName = `${orig.short_name} (New Cycle)`;
    const newName = `${orig.name} (New Cycle)`;

    const insert = db.prepare(`
      INSERT INTO exams (
        name, short_name, conducting_body, level, state, category,
        official_site, careers_url, notification_url, results_url,
        admit_card_url, syllabus_source_url, frequency, scrape_frequency,
        data_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'empty')
    `);

    const info = insert.run(
      newName, newShortName, orig.conducting_body, orig.level, orig.state, orig.category,
      orig.official_site, orig.careers_url, orig.notification_url, orig.results_url,
      orig.admit_card_url, orig.syllabus_source_url, orig.frequency, orig.scrape_frequency
    );

    logAudit(req.user.id, 'DUPLICATE_EXAM', 'exam', info.lastInsertRowid, { original_id: orig.id }, req);
    res.status(201).json({ success: true, id: info.lastInsertRowid, message: 'Exam duplicated. Dates reset to empty.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get all content modules for an exam (both draft and published)
router.get('/exams/:id/content', (req, res) => {
  try {
    const content = db.prepare(`
      SELECT * FROM exam_content WHERE exam_id = ? ORDER BY id DESC
    `).all(req.params.id);

    const cutoffs = db.prepare('SELECT * FROM exam_cutoffs WHERE exam_id = ? ORDER BY cycle_year DESC').all(req.params.id);
    const pyqs = db.prepare('SELECT * FROM exam_pyqs WHERE exam_id = ? ORDER BY cycle_year DESC').all(req.params.id);

    res.json({ content, cutoffs, pyqs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Save or publish a content module (notification, dates, syllabus, cutoff_photo, etc.)
router.post('/exams/:id/content', (req, res) => {
  try {
    const {
      content_type,
      title,
      payload,
      file_url,
      file_name,
      file_size,
      mime_type,
      source_url,
      status = 'published'
    } = req.body;

    if (!content_type || !source_url) {
      return res.status(400).json({ error: 'content_type and official source_url are strictly required' });
    }

    const examId = req.params.id;
    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    // Check if module of this content_type already exists; if so, update, else insert
    const existing = db.prepare('SELECT id FROM exam_content WHERE exam_id = ? AND content_type = ?').get(examId, content_type);

    let contentId;
    if (existing) {
      db.prepare(`
        UPDATE exam_content SET
          title = ?, payload = ?, file_url = ?, file_name = ?, file_size = ?,
          mime_type = ?, source_url = ?, status = ?, uploaded_by = ?,
          published_at = CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE published_at END
        WHERE id = ?
      `).run(
        title || null,
        typeof payload === 'object' ? JSON.stringify(payload) : payload,
        file_url || null,
        file_name || null,
        file_size || null,
        mime_type || null,
        source_url,
        status,
        'Admin',
        status,
        existing.id
      );
      contentId = existing.id;
    } else {
      const insert = db.prepare(`
        INSERT INTO exam_content (
          exam_id, content_type, title, payload, file_url, file_name, file_size,
          mime_type, source_url, status, uploaded_by, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END)
      `);
      const info = insert.run(
        examId, content_type, title || null,
        typeof payload === 'object' ? JSON.stringify(payload) : payload,
        file_url || null, file_name || null, file_size || null,
        mime_type || null, source_url, status, 'Admin', status
      );
      contentId = info.lastInsertRowid;
    }

    // Update parent exam record to 'verified' with audit trail if publishing dates or notification
    if (status === 'published') {
      db.prepare(`
        UPDATE exams SET
          data_status = 'verified',
          last_verified_at = datetime('now'),
          verified_by = 'ADMIN_MANUAL_UPLOAD'
        WHERE id = ?
      `).run(examId);

      // Trigger alerts to all candidates who tracked or applied to this exam
      const trackers = db.prepare('SELECT user_id FROM applications WHERE exam_id = ?').all(examId);
      if (trackers.length > 0) {
        const notif = db.prepare(`
          INSERT INTO notifications (exam_id, title, message, type, is_urgent)
          VALUES (?, ?, ?, 'alert', 1)
        `).run(
          examId,
          `Official Update Published: ${exam.short_name}`,
          `New official ${content_type} published with source verification. Check portal for latest changes.`
        );

        const linkStmt = db.prepare('INSERT OR IGNORE INTO user_notifications (user_id, notification_id, read) VALUES (?, ?, 0)');
        trackers.forEach(t => linkStmt.run(t.user_id, notif.lastInsertRowid));
      }

      // Revalidate Next.js cache on-demand for this exam and homepage
      if (exam && exam.slug) {
        triggerNextRevalidation([`/exams/${exam.slug}`, '/', '/sitemap.xml']);
      } else {
        triggerNextRevalidation(['/', '/sitemap.xml']);
      }
    }

    logAudit(req.user.id, 'PUBLISH_CONTENT', 'exam_content', contentId, { examId, content_type, status }, req);
    res.json({ success: true, content_id: contentId, message: `Module '${content_type}' saved as ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Bulk import cutoff rows (from CSV or JSON)
router.post('/exams/:id/cutoffs/bulk', (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Array of cutoff rows required' });
    }

    const examId = req.params.id;
    const insertCutoff = db.prepare(`
      INSERT INTO exam_cutoffs (exam_id, cycle_year, stage_name, region_or_state, category, marks, out_of, source_url, is_verified, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'published')
    `);

    const insertMany = db.transaction((items) => {
      for (const r of items) {
        insertCutoff.run(
          examId,
          parseInt(r.cycle_year || r.year, 10),
          r.stage_name || r.stage || 'Prelims',
          r.region_or_state || r.state || 'All India',
          r.category || 'UR',
          parseFloat(r.marks),
          parseFloat(r.out_of || 100),
          r.source_url || 'https://official.gov.in'
        );
      }
    });

    insertMany(rows);
    logAudit(req.user.id, 'BULK_IMPORT_CUTOFFS', 'exam_cutoffs', examId, { count: rows.length }, req);
    res.json({ success: true, message: `Imported ${rows.length} cutoff rows successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Add PYQ entry
router.post('/exams/:id/pyqs', (req, res) => {
  try {
    const { cycle_year, stage_name, shift, exam_date, subject, question_paper_url, answer_key_url, attribution } = req.body;
    if (!cycle_year || !question_paper_url || !subject) {
      return res.status(400).json({ error: 'cycle_year, subject, and question_paper_url are required' });
    }

    const examId = req.params.id;
    const insert = db.prepare(`
      INSERT INTO exam_pyqs (exam_id, cycle_year, stage_name, shift, exam_date, subject, question_paper_url, answer_key_url, attribution, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const info = insert.run(
      examId,
      parseInt(cycle_year, 10),
      stage_name || 'Prelims',
      shift || null,
      exam_date || null,
      subject,
      question_paper_url,
      answer_key_url || null,
      attribution || 'Official Examination Portal'
    );

    logAudit(req.user.id, 'ADD_PYQ', 'exam_pyqs', info.lastInsertRowid, { examId, cycle_year, subject }, req);
    res.json({ success: true, pyq_id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Audit Logs
router.get('/audit-logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.id DESC
      LIMIT 100
    `).all();

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Review Queue (Human-in-the-Loop)
router.get('/review', (req, res) => {
  try {
    const queue = db.prepare(`
      SELECT r.*, e.name as exam_name, e.short_name, e.conducting_body, e.category, e.official_site
      FROM review_queue r
      JOIN exams e ON r.exam_id = e.id
      ORDER BY r.id DESC
    `).all();

    const formatted = queue.map(item => {
      let proposed = {};
      let raw = {};
      try { proposed = JSON.parse(item.proposed_changes || '{}'); } catch (e) {}
      try { raw = JSON.parse(item.raw_extracted_data || '{}'); } catch (e) {}
      return {
        ...item,
        proposed_changes: proposed,
        raw_extracted_data: raw
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Approve Review Item & Publish as Official Gazette
router.post('/review/:id/approve', (req, res) => {
  try {
    const reviewId = req.params.id;
    const item = db.prepare('SELECT * FROM review_queue WHERE id = ?').get(reviewId);
    if (!item) return res.status(404).json({ error: 'Review item not found' });

    let proposed = {};
    try { proposed = JSON.parse(item.proposed_changes || '{}'); } catch (e) {}

    // 1. Mark review item approved
    db.prepare("UPDATE review_queue SET status = 'approved' WHERE id = ?").run(reviewId);

    // 2. Publish dates into exam_content
    const datePayload = {
      exam_date: proposed.exam_date || null,
      apply_end: proposed.apply_end || null,
      apply_start: proposed.apply_start || null,
      notes: `Admin confirmed from official source (${item.source_pdf_url || 'Official Portal'})`
    };

    const existingDates = db.prepare("SELECT id FROM exam_content WHERE exam_id = ? AND content_type = 'dates'").get(item.exam_id);
    if (existingDates) {
      db.prepare(`
        UPDATE exam_content SET
          payload = ?, source_url = ?, status = 'published',
          uploaded_by = ?, published_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(JSON.stringify(datePayload), item.source_pdf_url || 'https://official.gov.in', 'Admin', existingDates.id);
    } else {
      db.prepare(`
        INSERT INTO exam_content (exam_id, content_type, title, payload, source_url, status, uploaded_by, published_at)
        VALUES (?, 'dates', 'Official Schedule', ?, ?, 'published', 'Admin', CURRENT_TIMESTAMP)
      `).run(item.exam_id, JSON.stringify(datePayload), item.source_pdf_url || 'https://official.gov.in');
    }

    // 3. Mark parent exam verified
    const adminUser = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.id);
    db.prepare(`
      UPDATE exams SET
        data_status = 'verified',
        last_verified_at = CURRENT_TIMESTAMP,
        verified_by = ?
      WHERE id = ?
    `).run(adminUser?.email || 'Admin', item.exam_id);

    // 4. Update web discoveries if linked
    db.prepare(`
      UPDATE web_discoveries SET
        status = 'confirmed_by_admin',
        confirmed_by = ?,
        confirmed_at = CURRENT_TIMESTAMP
      WHERE exam_id = ? AND status = 'pending_admin_confirmation'
    `).run(adminUser?.email || 'Admin', item.exam_id);

    // 5. Notify trackers
    const trackers = db.prepare('SELECT user_id FROM applications WHERE exam_id = ?').all(item.exam_id);
    const exam = db.prepare('SELECT name, short_name FROM exams WHERE id = ?').get(item.exam_id);
    if (trackers.length > 0) {
      const notif = db.prepare(`
        INSERT INTO notifications (exam_id, title, message, type, is_urgent)
        VALUES (?, ?, ?, 'alert', 1)
      `).run(
        item.exam_id,
        `Official Gazette Confirmed: ${exam?.short_name || exam?.name}`,
        `Admin has verified and officially published the schedule. Check timeline now.`
      );
      const linkStmt = db.prepare('INSERT OR IGNORE INTO user_notifications (user_id, notification_id, read) VALUES (?, ?, 0)');
      trackers.forEach(t => linkStmt.run(t.user_id, notif.lastInsertRowid));
    }

    // Revalidate Next.js cache on-demand for this exam and homepage
    const examRecord = db.prepare('SELECT slug FROM exams WHERE id = ?').get(item.exam_id);
    if (examRecord && examRecord.slug) {
      triggerNextRevalidation([`/exams/${examRecord.slug}`, '/', '/sitemap.xml']);
    } else {
      triggerNextRevalidation(['/', '/sitemap.xml']);
    }

    logAudit(req.user.id, 'APPROVE_REVIEW', 'review_queue', reviewId, { examId: item.exam_id, proposed }, req);
    res.json({ success: true, message: `Approved and published official schedule for Exam #${item.exam_id}!` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 12. Reject Review Item
router.post('/review/:id/reject', (req, res) => {
  try {
    const reviewId = req.params.id;
    db.prepare("UPDATE review_queue SET status = 'rejected' WHERE id = ?").run(reviewId);
    logAudit(req.user.id, 'REJECT_REVIEW', 'review_queue', reviewId, {}, req);
    res.json({ success: true, message: 'Review item rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 13. Trigger Live Web Scan for any exam (Admin endpoint)
router.post('/scrape/trigger', async (req, res) => {
  try {
    const { exam_id } = req.body;
    const targetId = exam_id || 86;
    const { scanWebForExam } = await import('../services/webIntelligence.js');
    const discoveries = await scanWebForExam(targetId);
    res.json({ success: true, message: `Scanned web: found ${discoveries.length} online reports/updates for Exam #${targetId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 14. Web Discoveries Admin List
router.get('/web-discoveries', (req, res) => {
  try {
    const discoveries = db.prepare(`
      SELECT w.*, e.name as exam_name, e.short_name, e.conducting_body, e.category
      FROM web_discoveries w
      JOIN exams e ON w.exam_id = e.id
      ORDER BY w.id DESC
      LIMIT 100
    `).all();
    res.json(discoveries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 15. Confirm Web Discovery Directly
router.post('/web-discoveries/:id/confirm', async (req, res) => {
  try {
    const adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const { confirmWebDiscovery } = await import('../services/webIntelligence.js');
    const result = confirmWebDiscovery(req.params.id, adminUser);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 16. Reject Web Discovery
router.post('/web-discoveries/:id/reject', async (req, res) => {
  try {
    const { rejectWebDiscovery } = await import('../services/webIntelligence.js');
    const result = rejectWebDiscovery(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
