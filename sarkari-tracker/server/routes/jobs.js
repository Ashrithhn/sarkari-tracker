import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Standard application checklist templates
const DEFAULT_CHECKLIST_ITEMS = [
  'Passport Size Photograph',
  'Signature Scan',
  '10th / SSLC Marks Card',
  'Graduation / Degree Certificate',
  'Category / Caste Certificate',
  'Application Fee Receipt',
  'Printed Admit Card'
];

/**
 * Format an application record with prioritized dates:
 * Priority a) user-entered date (wins over everything)
 * Priority b) admin-verified exam date (if linked to official exam)
 * Priority c) null -> "Will be updated soon"
 */
function formatApplication(app) {
  if (!app) return null;

  // Retrieve checklist items
  const checklist = db.prepare(`
    SELECT id, item_name, is_checked, document_file, updated_at
    FROM application_checklist
    WHERE application_id = ?
    ORDER BY id ASC
  `).all(app.id);

  // Retrieve admin verified dates if linked to an exam
  let adminDates = {};
  if (app.exam_id) {
    const datesContent = db.prepare(`
      SELECT payload FROM exam_content 
      WHERE exam_id = ? AND content_type = 'dates' AND status = 'published'
      ORDER BY id DESC LIMIT 1
    `).get(app.exam_id);

    if (datesContent && datesContent.payload) {
      try {
        adminDates = JSON.parse(datesContent.payload);
      } catch (e) {}
    }
  }

  // Calculate effective dates according to Rule
  const effectiveLastDate = app.user_last_date || adminDates.apply_end || null;
  const effectiveAdmitCardDate = app.user_admit_card_date || adminDates.admit_card || null;
  const effectiveExamDate = app.user_exam_date || adminDates.exam_date || null;
  const effectiveResultDate = app.user_result_date || adminDates.result || null;

  // Compute nearest upcoming deadline
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const candidateDates = [
    { label: 'Application Deadline', date: effectiveLastDate },
    { label: 'Admit Card Release', date: effectiveAdmitCardDate },
    { label: 'Examination Date', date: effectiveExamDate },
    { label: 'Result Date', date: effectiveResultDate }
  ].filter(d => d.date && new Date(d.date) >= today)
   .sort((a, b) => new Date(a.date) - new Date(b.date));

  const nextMilestone = candidateDates.length > 0 ? candidateDates[0] : null;

  return {
    id: app.id,
    user_id: app.user_id,
    exam_id: app.exam_id,
    name: app.exam_name || app.custom_exam_name || 'Government Exam',
    short_name: app.exam_short_name || app.custom_exam_name || 'Exam',
    post_name: app.post_name || 'Candidate Post',
    conducting_body: app.conducting_body || 'Official Board',
    level: app.level || 'central',
    state: app.state || null,
    category: app.category || 'UR',
    registration_number: app.registration_number || null,
    applied_date: app.applied_date,
    fee_paid: Boolean(app.fee_paid),
    fee_receipt_file: app.fee_receipt_file || null,
    status: app.status || 'Applied',
    notes: app.notes || '',
    official_portal_link: app.official_portal_link || app.official_site || null,
    
    // Dates priority result
    effectiveLastDate,
    effectiveExamDate,
    effectiveAdmitCardDate,
    effectiveResultDate,
    user_last_date: app.user_last_date,
    user_exam_date: app.user_exam_date,
    user_admit_card_date: app.user_admit_card_date,
    user_result_date: app.user_result_date,
    custom_exam_name: app.custom_exam_name,

    dates: {
      last_date: effectiveLastDate,
      last_date_source: app.user_last_date ? 'User Entered' : (adminDates.apply_end ? 'Official Verified' : null),
      admit_card_date: effectiveAdmitCardDate,
      admit_card_date_source: app.user_admit_card_date ? 'User Entered' : (adminDates.admit_card ? 'Official Verified' : null),
      exam_date: effectiveExamDate,
      exam_date_source: app.user_exam_date ? 'User Entered' : (adminDates.exam_date ? 'Official Verified' : null),
      result_date: effectiveResultDate,
      result_date_source: app.user_result_date ? 'User Entered' : (adminDates.result ? 'Official Verified' : null)
    },
    
    user_dates: {
      last_date: app.user_last_date,
      admit_card_date: app.user_admit_card_date,
      exam_date: app.user_exam_date,
      result_date: app.user_result_date
    },

    nextMilestone,
    checklist: checklist.map(c => ({
      ...c,
      item_title: c.item_name,
      is_completed: c.is_checked
    })),
    web_analysis: (() => {
      if (!app.web_analysis) return null;
      try { return JSON.parse(app.web_analysis); } catch (e) { return null; }
    })(),
    created_at: app.created_at
  };
}

// 1. Get all user applications
router.get('/', (req, res) => {
  try {
    const apps = db.prepare(`
      SELECT a.*, 
             e.name as exam_name, 
             e.short_name as exam_short_name, 
             e.conducting_body, 
             e.level, 
             e.official_site
      FROM applications a
      LEFT JOIN exams e ON a.exam_id = e.id
      WHERE a.user_id = ?
      ORDER BY a.id DESC
    `).all(req.user.id);

    res.json(apps.map(formatApplication));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Track new application (Pick from registry OR custom job)
router.post('/', (req, res) => {
  try {
    const {
      exam_id,
      custom_exam_name,
      post_name,
      registration_number,
      category = 'UR',
      state,
      fee_paid = false,
      status = 'Applied',
      notes = '',
      official_portal_link,
      user_last_date,
      user_admit_card_date,
      user_exam_date,
      user_result_date
    } = req.body;

    if (!exam_id && !custom_exam_name) {
      return res.status(400).json({ error: 'Please choose an official exam or enter a custom job name' });
    }

    // Check duplicate
    if (exam_id) {
      const existing = db.prepare('SELECT id FROM applications WHERE user_id = ? AND exam_id = ?').get(req.user.id, exam_id);
      if (existing) {
        return res.status(400).json({ error: 'You are already tracking this examination' });
      }
    }

    const insert = db.prepare(`
      INSERT INTO applications (
        user_id, exam_id, custom_exam_name, post_name, registration_number,
        category, state, fee_paid, status, notes, official_portal_link,
        user_last_date, user_admit_card_date, user_exam_date, user_result_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insert.run(
      req.user.id,
      exam_id || null,
      custom_exam_name || null,
      post_name || 'Candidate Post',
      registration_number || null,
      category,
      state || null,
      fee_paid ? 1 : 0,
      status,
      notes,
      official_portal_link || null,
      user_last_date || null,
      user_admit_card_date || null,
      user_exam_date || null,
      user_result_date || null
    );

    const applicationId = info.lastInsertRowid;

    // Seed default document checklist
    const insertChecklist = db.prepare(`
      INSERT INTO application_checklist (application_id, item_name, is_checked)
      VALUES (?, ?, 0)
    `);
    for (const item of DEFAULT_CHECKLIST_ITEMS) {
      insertChecklist.run(applicationId, item);
    }

    // Schedule personal reminders if dates entered
    const titleName = custom_exam_name || 'Tracked Application';
    if (user_last_date) {
      db.prepare(`
        INSERT INTO reminders (user_id, application_id, title, reminder_date, type)
        VALUES (?, ?, ?, ?, 'deadline')
      `).run(req.user.id, applicationId, `Application Deadline: ${titleName}`, user_last_date);
    }
    if (user_exam_date) {
      db.prepare(`
        INSERT INTO reminders (user_id, application_id, title, reminder_date, type)
        VALUES (?, ?, ?, ?, 'exam_date')
      `).run(req.user.id, applicationId, `Exam Date: ${titleName}`, user_exam_date);
    }

    const created = db.prepare(`
      SELECT a.*, e.name as exam_name, e.short_name as exam_short_name, e.conducting_body, e.level, e.official_site
      FROM applications a
      LEFT JOIN exams e ON a.exam_id = e.id
      WHERE a.id = ?
    `).get(applicationId);

    // Auto-search web for latest expected dates and news in the background when applied
    if (exam_id) {
      import('../services/webIntelligence.js')
        .then(m => m.scanWebForExam(exam_id))
        .catch(err => console.warn(`[WebIntelligence] Auto-scan background error for Exam #${exam_id}:`, err.message));
    } else if (custom_exam_name) {
      // Analyze unlisted / custom exam keywords from web
      import('../services/webIntelligence.js')
        .then(async (m) => {
          const analysis = await m.analyzeCustomExamKeywords({
            custom_exam_name,
            post_name,
            custom_conducting_body: null
          });
          if (analysis) {
            db.prepare('UPDATE applications SET web_analysis = ? WHERE id = ?')
              .run(JSON.stringify(analysis), applicationId);

            // If user did not supply custom dates, auto-apply discovered dates
            if (!user_exam_date && analysis.expected_exam_date) {
              db.prepare('UPDATE applications SET user_exam_date = ? WHERE id = ?')
                .run(analysis.expected_exam_date, applicationId);
            }
            if (!user_last_date && analysis.expected_apply_end) {
              db.prepare('UPDATE applications SET user_last_date = ? WHERE id = ?')
                .run(analysis.expected_apply_end, applicationId);
            }

            // Queue for admin verification as unlisted candidate-tracked job
            const diffSummary = `Unlisted Job Keywords: ${analysis.keywords} | Expected Exam: ${analysis.expected_exam_date || 'Awaited'} | Vacancies: ${analysis.expected_vacancies || 'Awaited'}`;
            db.prepare(`
              INSERT INTO review_queue (
                exam_id, event_type, raw_extracted_data, proposed_changes,
                diff_summary, confidence, failure_reason, source_pdf_url, status
              ) VALUES (0, 'UNLISTED_CUSTOM_JOB', ?, ?, ?, 0.70, 'UNLISTED_JOB_CANDIDATE_TRACKED', ?, 'pending')
            `).run(
              JSON.stringify(analysis),
              JSON.stringify({
                name: custom_exam_name,
                post_name,
                exam_date: analysis.expected_exam_date,
                apply_end: analysis.expected_apply_end,
                vacancies: analysis.expected_vacancies,
                fee: analysis.expected_fee
              }),
              diffSummary,
              analysis.sources[0]?.link || 'https://google.com'
            );
          }
        })
        .catch(err => console.warn(`[WebIntelligence] Custom job keyword analysis error for App #${applicationId}:`, err.message));
    }

    res.status(201).json(formatApplication(created));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// On-demand keyword re-analysis for any tracked application
router.post('/:id/analyze', async (req, res) => {
  try {
    const app = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const { analyzeCustomExamKeywords, scanWebForExam } = await import('../services/webIntelligence.js');
    let analysis = null;

    if (app.exam_id) {
      await scanWebForExam(app.exam_id);
    } else {
      analysis = await analyzeCustomExamKeywords({
        custom_exam_name: app.custom_exam_name,
        post_name: app.post_name,
        custom_conducting_body: null
      });
      if (analysis) {
        db.prepare('UPDATE applications SET web_analysis = ? WHERE id = ?')
          .run(JSON.stringify(analysis), app.id);
      }
    }

    const updated = db.prepare(`
      SELECT a.*, e.name as exam_name, e.short_name as exam_short_name, e.conducting_body, e.level, e.official_site
      FROM applications a
      LEFT JOIN exams e ON a.exam_id = e.id
      WHERE a.id = ?
    `).get(app.id);

    res.json({
      success: true,
      message: 'Keywords analyzed from web successfully!',
      application: formatApplication(updated),
      analysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Quick status update
router.put('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Applied', 'Admit Card Downloaded', 'Appeared', 'Result Awaited', 'Selected', 'Not Selected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const result = db.prepare(`
      UPDATE applications 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(status, req.params.id, req.user.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Application not found' });
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Update full application details
router.put('/:id', (req, res) => {
  try {
    const {
      post_name,
      registration_number,
      category,
      state,
      fee_paid,
      status,
      notes,
      official_portal_link,
      user_last_date,
      user_admit_card_date,
      user_exam_date,
      user_result_date
    } = req.body;

    const existing = db.prepare('SELECT id FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Application not found' });

    db.prepare(`
      UPDATE applications SET
        post_name = coalesce(?, post_name),
        registration_number = coalesce(?, registration_number),
        category = coalesce(?, category),
        state = coalesce(?, state),
        fee_paid = coalesce(?, fee_paid),
        status = coalesce(?, status),
        notes = coalesce(?, notes),
        official_portal_link = coalesce(?, official_portal_link),
        user_last_date = ?,
        user_admit_card_date = ?,
        user_exam_date = ?,
        user_result_date = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      post_name,
      registration_number,
      category,
      state,
      fee_paid !== undefined ? (fee_paid ? 1 : 0) : null,
      status,
      notes,
      official_portal_link,
      user_last_date || null,
      user_admit_card_date || null,
      user_exam_date || null,
      user_result_date || null,
      req.params.id,
      req.user.id
    );

    const updated = db.prepare(`
      SELECT a.*, e.name as exam_name, e.short_name as exam_short_name, e.conducting_body, e.level, e.official_site
      FROM applications a
      LEFT JOIN exams e ON a.exam_id = e.id
      WHERE a.id = ?
    `).get(req.params.id);

    res.json(formatApplication(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Toggle or update checklist item
router.put('/:id/checklist/:itemId', (req, res) => {
  try {
    const { is_checked, document_file } = req.body;
    const result = db.prepare(`
      UPDATE application_checklist
      SET is_checked = coalesce(?, is_checked),
          document_file = coalesce(?, document_file),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND application_id = (
        SELECT id FROM applications WHERE id = ? AND user_id = ?
      )
    `).run(
      is_checked !== undefined ? (is_checked ? 1 : 0) : null,
      document_file !== undefined ? document_file : null,
      req.params.itemId,
      req.params.id,
      req.user.id
    );

    if (result.changes === 0) return res.status(404).json({ error: 'Checklist item not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5b. Add custom checklist item
router.post('/:id/checklist', (req, res) => {
  try {
    const { item_title, item_name } = req.body;
    const name = item_title || item_name;
    if (!name) return res.status(400).json({ error: 'Item title is required' });

    const app = db.prepare('SELECT id FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const info = db.prepare(`
      INSERT INTO application_checklist (application_id, item_name, is_checked)
      VALUES (?, ?, 0)
    `).run(req.params.id, name);

    res.status(201).json({ success: true, id: info.lastInsertRowid, item_title: name, is_completed: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Delete application
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM applications WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Application not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Check if user applied to exam
router.get('/check/:examId', (req, res) => {
  try {
    const app = db.prepare(`
      SELECT a.*, e.name as exam_name, e.short_name as exam_short_name, e.conducting_body, e.level, e.official_site
      FROM applications a
      JOIN exams e ON a.exam_id = e.id
      WHERE a.user_id = ? AND a.exam_id = ?
    `).get(req.user.id, req.params.examId);

    res.json({ applied: !!app, application: app ? formatApplication(app) : null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Real Stats (No fake data!)
router.get('/stats', (req, res) => {
  try {
    const totalAppliedRow = db.prepare('SELECT COUNT(*) as count FROM applications WHERE user_id = ?').get(req.user.id);
    const totalApplied = totalAppliedRow ? totalAppliedRow.count : 0;

    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM applications 
      WHERE user_id = ? 
      GROUP BY status
    `).all(req.user.id);

    // Compute upcoming from candidate applications with valid dates
    const allApps = db.prepare('SELECT * FROM applications WHERE user_id = ?').all(req.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let upcomingExams = 0;
    let admitCardsReady = 0;
    let resultsAwaited = 0;

    for (const a of allApps) {
      if (a.status === 'Admit Card Downloaded') admitCardsReady++;
      if (a.status === 'Result Awaited' || a.status === 'Appeared') resultsAwaited++;
      if (a.user_exam_date && new Date(a.user_exam_date) >= today) upcomingExams++;
    }

    res.json({
      totalApplied,
      upcomingExams,
      admitCardsReady,
      admitCardsAvailable: admitCardsReady,
      resultsAwaited,
      resultsPending: resultsAwaited,
      statusCounts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Export Applications as CSV
router.get('/export/csv', (req, res) => {
  try {
    const apps = db.prepare(`
      SELECT a.*, coalesce(e.name, a.custom_exam_name) as exam_title
      FROM applications a
      LEFT JOIN exams e ON a.exam_id = e.id
      WHERE a.user_id = ?
      ORDER BY a.id DESC
    `).all(req.user.id);

    const headers = ['ID', 'Exam', 'Post', 'Reg No', 'Category', 'Status', 'Last Date', 'Exam Date', 'Applied Date'];
    const rows = apps.map(a => [
      a.id,
      `"${(a.exam_title || '').replace(/"/g, '""')}"`,
      `"${(a.post_name || '').replace(/"/g, '""')}"`,
      a.registration_number || '',
      a.category || 'UR',
      a.status || 'Applied',
      a.user_last_date || 'Will be updated soon',
      a.user_exam_date || 'Will be updated soon',
      a.applied_date || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sarkari_my_applications.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
