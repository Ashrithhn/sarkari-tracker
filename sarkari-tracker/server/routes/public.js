import express from 'express';
import db from '../db.js';

const router = express.Router();

/**
 * Helper to structure exam dates with explicit verification status labels:
 * - 'confirmed': Published with official gazette / commission source
 * - 'expected': Extracted from confirmed web reports / tentative schedule
 * - 'not_announced': Date not announced yet -> "Will be updated soon"
 */
function formatExamDates(exam, contentDates, webDates) {
  const dates = {
    notification_date: { value: null, status: 'not_announced', label: 'Not announced yet' },
    apply_start: { value: null, status: 'not_announced', label: 'Not announced yet' },
    apply_end: { value: null, status: 'not_announced', label: 'Not announced yet' },
    admit_card_date: { value: null, status: 'not_announced', label: 'Not announced yet' },
    exam_date: { value: null, status: 'not_announced', label: 'Not announced yet' },
    result_date: { value: null, status: 'not_announced', label: 'Not announced yet' },
  };

  // 1. Check official published content dates first (Highest Priority / Confirmed)
  if (contentDates && typeof contentDates === 'object') {
    for (const key of Object.keys(dates)) {
      if (contentDates[key]) {
        dates[key] = {
          value: contentDates[key],
          status: 'confirmed',
          label: 'Confirmed Official Date'
        };
      }
    }
  }

  // 2. Fall back to confirmed web discoveries if official date is still empty (Expected)
  if (webDates && typeof webDates === 'object') {
    if (dates.exam_date.status === 'not_announced' && webDates.expected_exam_date) {
      dates.exam_date = {
        value: webDates.expected_exam_date,
        status: 'expected',
        label: 'Expected / Tentative Date'
      };
    }
    if (dates.apply_start.status === 'not_announced' && webDates.expected_apply_start) {
      dates.apply_start = {
        value: webDates.expected_apply_start,
        status: 'expected',
        label: 'Expected Start Date'
      };
    }
    if (dates.apply_end.status === 'not_announced' && webDates.expected_apply_end) {
      dates.apply_end = {
        value: webDates.expected_apply_end,
        status: 'expected',
        label: 'Expected Last Date'
      };
    }
  }

  return dates;
}

/**
 * GET /api/public/exams
 * List published exams with search & category filtering
 */
router.get('/exams', (req, res) => {
  try {
    const { search, category, level, limit = 50, page = 1 } = req.query;
    let query = "SELECT * FROM exams WHERE is_active = 1 AND data_status = 'verified'";
    const params = [];

    if (category && category !== 'All') {
      if (category === 'Karnataka') {
        query += " AND (category = 'Karnataka' OR level = 'state' OR state = 'Karnataka')";
      } else {
        query += ' AND category = ?';
        params.push(category);
      }
    }

    if (level) {
      query += ' AND level = ?';
      params.push(level);
    }

    if (search) {
      query += ' AND (name LIKE ? OR short_name LIKE ? OR conducting_body LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += " ORDER BY CASE WHEN category = 'Karnataka' THEN 1 WHEN category = 'UPSC' THEN 2 WHEN category = 'SSC' THEN 3 ELSE 4 END, name ASC";

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), offset);

    const exams = db.prepare(query).all(...params);

    // Attach latest dates for each exam
    const results = exams.map(ex => {
      // Get published dates content if any
      const datesContent = db.prepare(`
        SELECT payload FROM exam_content 
        WHERE exam_id = ? AND content_type = 'dates' AND status = 'published'
        ORDER BY id DESC LIMIT 1
      `).get(ex.id);

      let parsedDates = null;
      if (datesContent?.payload) {
        try { parsedDates = JSON.parse(datesContent.payload); } catch (e) {}
      }

      // Get latest web discovery dates
      const webDiscovery = db.prepare(`
        SELECT expected_exam_date, expected_apply_start, expected_apply_end 
        FROM web_discoveries 
        WHERE exam_id = ? AND status != 'rejected'
        ORDER BY id DESC LIMIT 1
      `).get(ex.id);

      const formattedDates = formatExamDates(ex, parsedDates, webDiscovery);

      return {
        id: ex.id,
        slug: ex.slug,
        name: ex.name,
        short_name: ex.short_name,
        conducting_body: ex.conducting_body,
        level: ex.level,
        state: ex.state,
        category: ex.category,
        official_site: ex.official_site,
        careers_url: ex.careers_url,
        notification_url: ex.notification_url,
        results_url: ex.results_url,
        admit_card_url: ex.admit_card_url,
        data_status: ex.data_status,
        last_verified_at: ex.last_verified_at,
        dates: formattedDates,
        disclaimer: 'Always confirm on the official website.'
      };
    });

    const totalCount = db.prepare("SELECT COUNT(*) as count FROM exams WHERE is_active = 1 AND data_status = 'verified'").get().count;

    res.json({
      success: true,
      data: results,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching public exams:', error);
    res.status(500).json({ error: 'Failed to retrieve published exams' });
  }
});

/**
 * GET /api/public/exams/:slug
 * Retrieve detailed published information for a single exam by slug
 */
router.get('/exams/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const exam = db.prepare('SELECT * FROM exams WHERE (slug = ? OR id = ?) AND is_active = 1').get(slug, slug);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found or unpublished' });
    }

    // Fetch published contents
    const contents = db.prepare(`
      SELECT content_type, title, payload, file_url, source_url, published_at, uploaded_at
      FROM exam_content
      WHERE exam_id = ? AND status = 'published'
      ORDER BY id ASC
    `).all(exam.id);

    const contentMap = {};
    for (const item of contents) {
      let parsed = item.payload;
      try { parsed = JSON.parse(item.payload); } catch (e) {}
      contentMap[item.content_type] = {
        title: item.title,
        data: parsed,
        file_url: item.file_url,
        source_url: item.source_url,
        published_at: item.published_at || item.uploaded_at
      };
    }

    // Fetch confirmed web discoveries
    const webDiscoveries = db.prepare(`
      SELECT source_title, source_url, source_domain, pub_date, snippet,
             expected_exam_date, expected_apply_start, expected_apply_end,
             expected_fee, expected_vacancies, expected_eligibility, confidence, status
      FROM web_discoveries
      WHERE exam_id = ? AND status != 'rejected'
      ORDER BY id DESC LIMIT 5
    `).all(exam.id);

    const latestWeb = webDiscoveries[0] || null;
    const formattedDates = formatExamDates(exam, contentMap.dates?.data, latestWeb);

    // Fetch published cutoffs
    const cutoffs = db.prepare(`
      SELECT cycle_year, stage_name, region_or_state, category, marks, out_of, source_url, is_verified
      FROM exam_cutoffs
      WHERE exam_id = ? AND status = 'published'
      ORDER BY cycle_year DESC, stage_name ASC, marks DESC
    `).all(exam.id);

    // Fetch verified PYQs
    const pyqs = db.prepare(`
      SELECT cycle_year, stage_name, shift, exam_date, subject, question_paper_url, answer_key_url, solution_url, attribution, downloads_count
      FROM exam_pyqs
      WHERE exam_id = ? AND is_verified = 1
      ORDER BY cycle_year DESC, stage_name ASC
    `).all(exam.id);

    res.json({
      success: true,
      data: {
        id: exam.id,
        slug: exam.slug,
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
        data_status: exam.data_status,
        last_verified_at: exam.last_verified_at,
        verified_by: exam.verified_by,
        dates: formattedDates,
        content: contentMap,
        web_discoveries: webDiscoveries,
        cutoffs: cutoffs,
        pyqs: pyqs,
        disclaimer: 'Always confirm on the official website. SarkariTracker is an independent educational portal.'
      }
    });
  } catch (error) {
    console.error('Error fetching single public exam:', error);
    res.status(500).json({ error: 'Failed to retrieve exam details' });
  }
});

/**
 * GET /api/public/updates
 * Return latest verified official gazette announcements
 */
router.get('/updates', (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT n.id, n.exam_id, n.title, n.message, n.type, n.created_at, n.is_urgent,
             e.name as exam_name, e.short_name as exam_short_name, e.slug as exam_slug, e.official_site
      FROM notifications n
      LEFT JOIN exams e ON n.exam_id = e.id
      ORDER BY n.is_urgent DESC, n.created_at DESC
      LIMIT 20
    `).all();

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching public updates:', error);
    res.status(500).json({ error: 'Failed to retrieve updates' });
  }
});

/**
 * GET /api/public/blog
 * Return published blog articles
 */
router.get('/blog', (req, res) => {
  try {
    const posts = db.prepare(`
      SELECT id, title, slug, excerpt, author, category, published_at, reading_time_minutes
      FROM blog_posts
      WHERE is_published = 1
      ORDER BY published_at DESC
    `).all();

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to retrieve blog posts' });
  }
});

/**
 * GET /api/public/blog/:slug
 * Return single published blog post by slug
 */
router.get('/blog/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const post = db.prepare(`
      SELECT id, title, slug, excerpt, content, author, category, published_at,
             meta_title, meta_description, keywords, reading_time_minutes
      FROM blog_posts
      WHERE slug = ? AND is_published = 1
    `).get(slug);

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching single blog post:', error);
    res.status(500).json({ error: 'Failed to retrieve blog post' });
  }
});

/**
 * GET /api/public/sitemap-data
 * Returns all published exams & blog posts for dynamic sitemap generation
 */
router.get('/sitemap-data', (req, res) => {
  try {
    const exams = db.prepare(`
      SELECT slug, last_verified_at, created_at 
      FROM exams 
      WHERE is_active = 1 AND slug IS NOT NULL AND slug != ''
      ORDER BY id ASC
    `).all();

    const posts = db.prepare(`
      SELECT slug, published_at 
      FROM blog_posts 
      WHERE is_published = 1 AND slug IS NOT NULL AND slug != ''
      ORDER BY id ASC
    `).all();

    res.json({
      success: true,
      exams: exams.map(e => ({
        url: `/exams/${e.slug}`,
        lastModified: e.last_verified_at || e.created_at || new Date().toISOString()
      })),
      blog: posts.map(p => ({
        url: `/blog/${p.slug}`,
        lastModified: p.published_at || new Date().toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching sitemap data:', error);
    res.status(500).json({ error: 'Failed to retrieve sitemap data' });
  }
});

/**
 * POST /api/public/revalidate-notify
 * Trigger Next.js on-demand ISR revalidation webhook
 */
router.post('/revalidate-notify', async (req, res) => {
  try {
    const { path: revalidatePath, secret } = req.body;
    const NEXTJS_URL = process.env.NEXTJS_INTERNAL_URL || 'http://localhost:3000';
    const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'sarkari-revalidate-secret-token-2026';

    if (secret !== REVALIDATE_SECRET) {
      return res.status(401).json({ error: 'Invalid revalidation secret' });
    }

    const nextResponse = await fetch(`${NEXTJS_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: revalidatePath, secret: REVALIDATE_SECRET })
    }).catch(err => {
      console.warn('Next.js on-demand revalidation trigger warning:', err.message);
      return null;
    });

    res.json({
      success: true,
      message: 'On-demand ISR revalidation dispatched',
      targetPath: revalidatePath,
      nextStatus: nextResponse ? nextResponse.status : 'offline'
    });
  } catch (err) {
    console.error('Revalidation error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
