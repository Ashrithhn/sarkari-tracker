import express from 'express';
import db from '../db.js';

const router = express.Router();

/**
 * Format an exam record with only published official data.
 * Zero placeholder numbers or synthetic dates.
 */
function formatExamRecord(exam) {
  if (!exam) return null;

  // Retrieve published content modules
  const contentRows = db.prepare(`
    SELECT content_type, title, payload, file_url, file_name, file_size, mime_type, source_url, published_at
    FROM exam_content
    WHERE exam_id = ? AND status = 'published'
  `).all(exam.id);

  const modules = {};
  for (const row of contentRows) {
    let parsedPayload = null;
    if (row.payload) {
      try {
        parsedPayload = JSON.parse(row.payload);
      } catch (e) {
        parsedPayload = row.payload;
      }
    }
    modules[row.content_type] = {
      title: row.title,
      payload: parsedPayload,
      file_url: row.file_url,
      file_name: row.file_name,
      file_size: row.file_size,
      mime_type: row.mime_type,
      source_url: row.source_url,
      published_at: row.published_at
    };
  }

  // Retrieve published cutoffs table rows
  const cutoffs = db.prepare(`
    SELECT * FROM exam_cutoffs
    WHERE exam_id = ? AND status = 'published'
    ORDER BY cycle_year DESC, stage_name ASC, marks DESC
  `).all(exam.id);

  // Retrieve published PYQs
  const pyqs = db.prepare(`
    SELECT * FROM exam_pyqs
    WHERE exam_id = ? AND is_verified = 1
    ORDER BY cycle_year DESC, stage_name ASC
  `).all(exam.id);

  // Dates timeline from published dates module
  const publishedDates = modules['dates']?.payload || null;

  // AI Overview parsed
  let parsedAiOverview = null;
  if (exam.ai_overview) {
    try {
      parsedAiOverview = JSON.parse(exam.ai_overview);
    } catch (e) {}
  }

  return {
    id: exam.id,
    name: exam.name,
    short_name: exam.short_name,
    conducting_body: exam.conducting_body,
    level: exam.level,
    state: exam.state,
    category: exam.category,
    official_site: exam.official_site,
    careers_url: exam.careers_url,
    notification_url: exam.notification_url,
    results_url: exam.results_url,
    admit_card_url: exam.admit_card_url,
    syllabus_source_url: exam.syllabus_source_url,
    frequency: exam.frequency,
    data_status: exam.data_status || 'empty',
    last_verified_at: exam.last_verified_at,
    verified_by: exam.verified_by,
    disclaimer: 'Always confirm on the official website.',
    ai_overview: parsedAiOverview,
    
    // Published official modules (null if not yet published)
    dates: publishedDates,
    timeline: publishedDates,
    notification: modules['notification'] || null,
    notification_pdf: modules['notification'] || null,
    vacancies: modules['vacancies'] || null,
    eligibility: modules['eligibility'] || null,
    fee: modules['fee'] || null,
    syllabus: modules['syllabus']?.payload || null,
    cutoff_photo: modules['cutoff'] || modules['cutoff_photo'] || null,
    cutoffs_rows: cutoffs,
    historicalCutoffs: cutoffs,
    pyqs: pyqs
  };
}

// 1. List all exams with search & filters
router.get('/', (req, res) => {
  try {
    const { category, level, state, search } = req.query;
    let sql = 'SELECT * FROM exams WHERE is_active = 1';
    const params = [];

    if (category && category !== 'All') {
      if (category.toLowerCase() === 'karnataka') {
        sql += " AND (LOWER(category) = 'karnataka' OR LOWER(state) = 'karnataka')";
      } else {
        sql += ' AND LOWER(category) = LOWER(?)';
        params.push(category);
      }
    }
    if (level && level !== 'All') {
      sql += ' AND LOWER(level) = LOWER(?)';
      params.push(level);
    }
    if (state && state !== 'All') {
      sql += ' AND LOWER(state) = LOWER(?)';
      params.push(state);
    }
    if (search && search.trim()) {
      const tokens = search.trim().split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        sql += ' AND (name LIKE ? OR short_name LIKE ? OR conducting_body LIKE ? OR category LIKE ? OR (state IS NOT NULL AND state LIKE ?))';
        const term = `%${token}%`;
        params.push(term, term, term, term, term);
      }
    }

    sql += ' ORDER BY level DESC, state DESC, category ASC, name ASC';

    const exams = db.prepare(sql).all(...params);
    res.json(exams.map(formatExamRecord));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Distinct categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT DISTINCT category FROM exams WHERE is_active = 1 ORDER BY category').all().map(r => r.category);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Single exam detail
router.get('/:id', (req, res) => {
  try {
    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json(formatExamRecord(exam));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get Web Discoveries & Expected details for an exam
router.get('/:id/web-discoveries', async (req, res) => {
  try {
    const examId = req.params.id;
    const { getWebDiscoveries, scanWebForExam, generateExamAiOverview } = await import('../services/webIntelligence.js');
    let discoveries = getWebDiscoveries(examId);

    // If zero discoveries, trigger on-demand initial scan
    if (!discoveries || discoveries.length === 0) {
      try {
        discoveries = await scanWebForExam(examId);
      } catch (scanErr) {
        console.warn('Initial web scan error:', scanErr.message);
      }
    }

    // Get cached AI overview or generate if missing or empty
    let examRow = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
    let aiOverview = null;
    if (examRow?.ai_overview) {
      try { aiOverview = JSON.parse(examRow.ai_overview); } catch (e) {}
    }

    const isAiEmpty = !aiOverview || (!aiOverview.prelims_exam_date && !aiOverview.apply_last_date && !aiOverview.active_last_date && !aiOverview.extended_last_date);

    if (isAiEmpty && examRow) {
      try {
        aiOverview = await generateExamAiOverview({
          examId,
          examName: examRow.short_name || examRow.name,
          conductingBody: examRow.conducting_body,
          existingDiscoveries: discoveries
        });
      } catch (e) {}
    }

    res.json({
      discoveries: discoveries || [],
      ai_overview: aiOverview
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Trigger live on-demand web scan
router.post('/:id/scan-web', async (req, res) => {
  try {
    const examId = req.params.id;
    const { scanWebForExam, generateExamAiOverview } = await import('../services/webIntelligence.js');
    const discoveries = await scanWebForExam(examId);

    const examRow = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
    let aiOverview = null;
    try {
      aiOverview = await generateExamAiOverview({
        examId,
        examName: examRow?.short_name || examRow?.name,
        conductingBody: examRow?.conducting_body,
        existingDiscoveries: discoveries
      });
    } catch (e) {}

    res.json({
      success: true,
      message: `Scanned web: found ${discoveries.length} online reports/updates`,
      discoveries,
      ai_overview: aiOverview
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. On-demand AI Overview generation
router.post('/:id/scan-ai', async (req, res) => {
  try {
    const examId = req.params.id;
    const examRow = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
    if (!examRow) return res.status(404).json({ error: 'Exam not found' });

    const { generateExamAiOverview, getWebDiscoveries } = await import('../services/webIntelligence.js');
    const existing = getWebDiscoveries(examId);
    const aiOverview = await generateExamAiOverview({
      examId,
      examName: examRow.short_name || examRow.name,
      conductingBody: examRow.conducting_body,
      existingDiscoveries: existing
    });

    res.json({ success: true, ai_overview: aiOverview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
