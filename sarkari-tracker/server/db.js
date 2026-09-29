import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'sarkari.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    conducting_body TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'central', -- 'central' | 'state' | 'psu'
    state TEXT DEFAULT NULL,              -- e.g. 'Karnataka', or NULL for central
    category TEXT NOT NULL,               -- 'Banking', 'SSC', 'UPSC', 'Railway', 'Defence', 'Science', 'PSU', 'Karnataka', 'Central'
    official_site TEXT NOT NULL,
    careers_url TEXT,
    notification_url TEXT,
    results_url TEXT,
    admit_card_url TEXT,
    syllabus_source_url TEXT,
    frequency TEXT DEFAULT 'annual',      -- 'annual' | 'irregular'
    scrape_frequency INTEGER DEFAULT 360,
    adapter_type TEXT DEFAULT 'generic',
    is_active BOOLEAN DEFAULT 1,
    data_status TEXT DEFAULT 'empty',     -- 'empty' | 'pending_review' | 'verified'
    last_verified_at TEXT,
    verified_by TEXT,
    slug TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exam_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    content_type TEXT NOT NULL, -- 'notification', 'dates', 'vacancies', 'eligibility', 'syllabus', 'cutoff', 'pyq', 'admit_card', 'result'
    title TEXT,
    payload TEXT,               -- JSON structure
    file_url TEXT,              -- uploaded photo or PDF file
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    source_url TEXT NOT NULL,   -- required official source URL
    status TEXT DEFAULT 'draft', -- 'draft' | 'published'
    uploaded_by TEXT NOT NULL,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    published_at TEXT,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    exam_id INTEGER,
    custom_exam_name TEXT,
    post_name TEXT,
    registration_number TEXT,
    applied_date TEXT DEFAULT (date('now')),
    category TEXT, -- UR, EWS, OBC, SC, ST, PwBD, GM, 2A, 2B, 3A, 3B, Cat-1
    state TEXT,
    fee_paid BOOLEAN DEFAULT 0,
    fee_receipt_file TEXT,
    status TEXT DEFAULT 'Applied', -- 'Applied', 'Admit Card Downloaded', 'Appeared', 'Result Awaited', 'Selected', 'Not Selected'
    notes TEXT,
    official_portal_link TEXT,
    -- Personal dates (Priority 1: wins over everything)
    user_last_date TEXT,
    user_admit_card_date TEXT,
    user_exam_date TEXT,
    user_result_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS application_checklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    item_name TEXT NOT NULL, -- 'Photo', 'Signature', 'Marks Cards', 'Degree Certificate', 'Caste/Category Certificate', 'Fee Receipt', 'Admit Card'
    is_checked BOOLEAN DEFAULT 0,
    document_file TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS exam_cutoffs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    cycle_year INTEGER NOT NULL,
    stage_name TEXT NOT NULL,
    region_or_state TEXT DEFAULT 'All India',
    category TEXT NOT NULL,
    marks REAL NOT NULL,
    out_of REAL DEFAULT 100.0,
    source_url TEXT NOT NULL,
    source_doc_file TEXT,
    is_verified BOOLEAN DEFAULT 1,
    status TEXT DEFAULT 'published',
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS exam_pyqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    cycle_year INTEGER NOT NULL,
    stage_name TEXT NOT NULL,
    shift TEXT,
    exam_date TEXT,
    subject TEXT NOT NULL,
    question_paper_url TEXT NOT NULL,
    answer_key_url TEXT,
    solution_url TEXT,
    attribution TEXT,
    is_verified BOOLEAN DEFAULT 1,
    downloads_count INTEGER DEFAULT 0,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    ip_address TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_urgent BOOLEAN DEFAULT 0,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    notification_id INTEGER NOT NULL,
    read BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    UNIQUE(user_id, notification_id)
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    application_id INTEGER,
    exam_id INTEGER,
    title TEXT NOT NULL,
    reminder_date TEXT NOT NULL,
    type TEXT,
    completed BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS review_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'WEB_INTELLIGENCE_DISCOVERY',
    raw_extracted_data TEXT,
    proposed_changes TEXT,
    diff_summary TEXT,
    confidence REAL DEFAULT 0.85,
    failure_reason TEXT DEFAULT 'AWAITING_ADMIN_VERIFICATION',
    source_pdf_url TEXT,
    status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS web_discoveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    source_title TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_domain TEXT,
    pub_date TEXT,
    snippet TEXT,
    expected_exam_date TEXT,
    expected_apply_start TEXT,
    expected_apply_end TEXT,
    expected_fee TEXT,
    expected_vacancies TEXT,
    expected_eligibility TEXT,
    confidence TEXT DEFAULT 'Tentative / Reported Online',
    status TEXT DEFAULT 'pending_admin_confirmation', -- 'pending_admin_confirmation' | 'confirmed_by_admin' | 'rejected'
    confirmed_by TEXT,
    confirmed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'SarkariTracker Editorial Desk',
    category TEXT DEFAULT 'Exam Preparation',
    published_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT 1,
    meta_title TEXT,
    meta_description TEXT,
    keywords TEXT,
    reading_time_minutes INTEGER DEFAULT 5,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exam_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_key TEXT UNIQUE NOT NULL,
    question_text TEXT NOT NULL,
    category TEXT DEFAULT 'all', -- 'all' | 'karnataka'
    notify_condition TEXT,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS exam_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER,
    custom_exam_name TEXT,
    question_key TEXT NOT NULL,
    status TEXT NOT NULL, -- 'yes' | 'no' | 'not_found'
    value TEXT,
    date TEXT,
    details TEXT,
    source_url TEXT,
    quote TEXT,
    trust_label TEXT DEFAULT 'AI-found, unverified',
    fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    exam_id INTEGER,
    custom_exam_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    UNIQUE(user_id, exam_id)
  );
`);

try {
  db.exec('ALTER TABLE applications ADD COLUMN web_analysis TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE applications ADD COLUMN notification_file TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE applications ADD COLUMN syllabus_file TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE applications ADD COLUMN admit_card_file TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE applications ADD COLUMN application_form_file TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE applications ADD COLUMN fee_receipt_file TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE applications ADD COLUMN ai_overview TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE exams ADD COLUMN ai_overview TEXT');
} catch (e) {}

try {
  db.prepare("UPDATE users SET is_admin = 0 WHERE email = 'ashrith.sringeri@gmail.com'").run();
} catch (e) {}

try {
  db.exec('ALTER TABLE exams ADD COLUMN slug TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE notifications ADD COLUMN dedup_key TEXT');
} catch (e) {}

try {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup_key ON notifications(dedup_key)');
} catch (e) {}

try {
  db.exec('ALTER TABLE notifications ADD COLUMN custom_exam_name TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE notifications ADD COLUMN source_url TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE notifications ADD COLUMN trust_label TEXT DEFAULT "AI-found, unverified"');
} catch (e) {}

// Helper to generate URL-safe slugs
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Seed questions into exam_questions if empty
try {
  const qCount = db.prepare('SELECT COUNT(*) as count FROM exam_questions').get().count;
  if (qCount === 0) {
    const insertQ = db.prepare(`
      INSERT OR IGNORE INTO exam_questions (question_key, question_text, category, notify_condition, display_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    const standardQuestions = [
      ['notification_released', 'Has the official notification/advertisement been released? Give release date and official portal link.', 'all', 'Changes from No to Yes', 1],
      ['apply_start', 'When does online application start? Give application opening date.', 'all', 'Date appears or changes', 2],
      ['last_date', 'What is the last date to apply online? Give deadline date.', 'all', 'Date changes', 3],
      ['last_date_extended', 'Was the last date to apply extended? State whether extended and give the new extended date.', 'all', 'Becomes true', 4],
      ['fee_last_date', 'What is the last date for fee payment?', 'all', 'Date changes', 5],
      ['correction_window', 'Is the application edit/correction window open? Dates?', 'all', 'Opens or changes', 6],
      ['corrigendum', 'Has any corrigendum, addendum or revised notice been issued? Title, date, link.', 'all', 'New one found', 7],
      ['vacancy_change', 'Has the number of vacancies increased or decreased? Old and new count.', 'all', 'Count changes', 8],
      ['eligibility_change', 'Any change in age limit, qualification, or reservation/relaxation criteria?', 'all', 'Any change', 9],
      ['exam_date', 'What are the examination dates for each stage (prelims, mains)?', 'all', 'Date announced or changes', 10],
      ['postponed_rescheduled', 'Has the exam been postponed, rescheduled, or cancelled? New date?', 'all', 'Becomes true', 11],
      ['exam_city_slip', 'Has the exam city intimation slip or advance city allotment been released?', 'all', 'Becomes true', 12],
      ['admit_card', 'Has the admit card / hall ticket been released? Direct link.', 'all', 'Becomes true', 13],
      ['answer_key', 'Is the provisional answer key out? Objection window dates?', 'all', 'Becomes true', 14],
      ['result', 'Has the written exam/prelims result been declared? Link.', 'all', 'Becomes true', 15],
      ['cutoff', 'Has the cutoff / marks list been published? Category-wise marks.', 'all', 'Becomes true', 16],
      ['final_result', 'Has the final selection list or rank merit list been published?', 'all', 'Becomes true', 17],
      ['other_notice', 'Any other important official commission notice in the last 7 days?', 'all', 'New one found', 18],
      // Karnataka State
      ['document_verification_schedule', 'Has the document verification (DV) schedule or eligible candidate list been released?', 'karnataka', 'Becomes true', 19],
      ['hyderabad_karnataka_quota_change', 'Has any notice regarding Article 371(J) / Kalyana Karnataka reservation eligibility or quota been issued?', 'karnataka', 'Any change', 20],
      ['provisional_selection_list', 'Has the provisional 1:1 or 1:2 selection / verification list been published?', 'karnataka', 'Becomes true', 21]
    ];

    const seedAllQ = db.transaction((rows) => {
      for (const row of rows) {
        insertQ.run(...row);
      }
    });
    seedAllQ(standardQuestions);
    console.log(`✓ Seeded ${standardQuestions.length} daily monitoring questions`);
  }
} catch (err) {
  console.error('Failed to seed exam_questions:', err.message);
}

// Ensure foundational users and persisted candidate accounts always exist (survives any ephemeral redeployment)
try {
  const insertOrIgnore = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, phone, password, is_admin)
    VALUES (?, ?, ?, ?, ?)
  `);

  const hashedPasswordAdmin = bcrypt.hashSync('admin123', 10);
  const hashedPasswordUser = bcrypt.hashSync('student123', 10);

  insertOrIgnore.run('Sarkari Admin', 'admin@sarkari.in', '9999999999', hashedPasswordAdmin, 1);
  insertOrIgnore.run('Candidate Aspirant', 'student@sarkari.in', '9888888888', hashedPasswordUser, 0);
  // Permanent user account for Ashrith H N with verified hash
  insertOrIgnore.run('Ashrith H N', 'ashrith.sringeri@gmail.com', '9888888888', '$2a$10$CGpoVlTxY7TT99pFE/TwQuEMipf8RTYIOKzXSPx9jxXTyAm5Yfyzu', 0);

  // Load any persisted users from backup json
  const persistedPath = path.join(__dirname, 'data', 'persisted_users.json');
  if (fs.existsSync(persistedPath)) {
    try {
      const persistedUsers = JSON.parse(fs.readFileSync(persistedPath, 'utf8'));
      if (Array.isArray(persistedUsers)) {
        for (const u of persistedUsers) {
          if (u.email && u.password) {
            insertOrIgnore.run(u.name || 'Candidate', u.email.toLowerCase().trim(), u.phone || '', u.password, u.is_admin ? 1 : 0);
          }
        }
      }
    } catch (e) {
      console.warn('Could not parse persisted_users.json:', e.message);
    }
  }
  console.log('✓ Ensured core accounts and persisted candidate users exist');
} catch (err) {
  console.error('User ensure failed:', err.message);
}

// Auto-seed and sync official exams from registry
try {
  const registryPath = path.join(__dirname, 'data/examRegistry.json');
  if (fs.existsSync(registryPath)) {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const existingExams = db.prepare('SELECT id, short_name, name FROM exams').all();
    const existingSet = new Set(existingExams.map(e => (e.short_name || e.name).toLowerCase().trim()));

    const insertExam = db.prepare(`
      INSERT INTO exams (
        name, short_name, conducting_body, level, state, category,
        official_site, careers_url, notification_url, results_url,
        admit_card_url, syllabus_source_url, frequency, scrape_frequency,
        adapter_type, is_active, data_status, slug
      ) VALUES (
        @name, @short_name, @conducting_body, @level, @state, @category,
        @official_site, @careers_url, @notification_url, @results_url,
        @admit_card_url, @syllabus_source_url, @frequency, @scrape_frequency,
        @adapter_type, @active, 'empty', @slug
      )
    `);

    const missing = registry.filter(e => !existingSet.has((e.short_name || e.name).toLowerCase().trim()));
    if (missing.length > 0) {
      const insertMissing = db.transaction((examsToInsert) => {
        for (const e of examsToInsert) {
          const shortName = e.short_name || e.name || 'Exam';
          const slug = slugify(shortName);
          insertExam.run({
            name: e.name || '',
            short_name: shortName,
            conducting_body: e.conducting_body || '',
            level: e.level || 'central',
            state: e.state || null,
            category: e.category || 'Central',
            official_site: e.official_site || '',
            careers_url: e.careers_url || null,
            notification_url: e.notification_url || null,
            results_url: e.results_url || null,
            admit_card_url: e.admit_card_url || null,
            syllabus_source_url: e.syllabus_source_url || null,
            frequency: e.frequency || 'annual',
            scrape_frequency: e.scrape_frequency || 360,
            adapter_type: e.adapter_type || 'generic',
            active: e.active !== undefined ? e.active : (e.is_active !== undefined ? e.is_active : 1),
            slug: slug
          });
        }
      });
      insertMissing(missing);
      console.log(`✓ Synchronized ${missing.length} official exams catalog into SQLite (Total now: ${existingExams.length + missing.length})`);
    }
  }
} catch (err) {
  console.error('Exam sync failed:', err.message);
}

// Backfill missing slugs for all exams
const examsWithoutSlug = db.prepare("SELECT id, name, short_name FROM exams WHERE slug IS NULL OR slug = ''").all();
if (examsWithoutSlug.length > 0) {
  const updateSlug = db.prepare('UPDATE exams SET slug = ? WHERE id = ?');
  const usedSlugs = new Set(db.prepare("SELECT slug FROM exams WHERE slug IS NOT NULL AND slug != ''").all().map(r => r.slug));

  for (const ex of examsWithoutSlug) {
    let baseSlug = slugify(ex.short_name || ex.name);
    let finalSlug = baseSlug;
    let counter = 1;
    while (usedSlugs.has(finalSlug)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    usedSlugs.add(finalSlug);
    updateSlug.run(finalSlug, ex.id);
  }
}

// Seed initial SEO blog posts if table is empty
const blogCount = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get().count;
if (blogCount === 0) {
  const insertPost = db.prepare(`
    INSERT INTO blog_posts (title, slug, excerpt, content, author, category, is_published, meta_title, meta_description, keywords, reading_time_minutes)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
  `);

  insertPost.run(
    'UPSC Civil Services 2026: Strategy, Prelims & Mains Syllabus, Cutoff Analysis',
    'upsc-cse-2026-complete-strategy-syllabus-cutoffs',
    'A comprehensive roadmap for UPSC CSE 2026 aspirants covering booklists, phase-wise revision plans, official Prelims cutoffs, and answer writing methodologies.',
    `# UPSC Civil Services Examination 2026: Complete Strategy Guide

The **Union Public Service Commission (UPSC)** Civil Services Examination remains India's premier gateway to prestigious administrative roles including IAS, IPS, IFS, and IRS.

## 1. Exam Structure & Stages
The examination consists of three consecutive stages:
1. **Preliminary Examination (Objective):** GS Paper I (100 questions, 200 marks) and CSAT Paper II (80 questions, 200 marks, qualifying with 33%).
2. **Main Examination (Written Descriptive):** 9 papers comprising Essay, General Studies I-IV, Optional Papers I & II, and qualifying language papers.
3. **Personality Test (Interview):** 275 marks assessing candidate suitability and administrative aptitude.

## 2. Rule Zero Verification & Official Calendar
According to the official UPSC Annual Calendar published on upsc.gov.in, notification release dates and preliminary test dates follow strict commission gazettes. Always confirm application deadlines directly on \`upsconline.nic.in\`.

## 3. Recommended Core Booklist
- **History & Heritage:** NCERT Class 11-12, Bipan Chandra, Spectrum Modern India.
- **Polity & Governance:** M. Laxmikanth (Indian Polity 7th Edition).
- **Economy:** Sanjiv Verma / Ramesh Singh + Economic Survey and Union Budget.
- **Environment & Ecology:** Shankar IAS Environment + PMF IAS notes.

## 4. Current Affairs Strategy
Limit your daily newspaper reading (The Hindu or Indian Express) to 60-75 minutes. Maintain concise issue-based notes categorized by GS syllabus topics.`,
    'SarkariTracker Editorial Desk',
    'UPSC',
    'UPSC CSE 2026 Strategy, Syllabus & Official Cutoffs | SarkariTracker',
    'Complete guide for UPSC Civil Services 2026 preparation. Covers stage-by-stage syllabus, NCERT reading list, and official qualifying trends.',
    'UPSC CSE 2026, IAS Exam, UPSC Syllabus, UPSC Cutoff, Civil Services Preparation',
    8
  );

  insertPost.run(
    'Karnataka KEA & KPSC Recruitment 2026: VAO, KAS, and Board Exam Calendar',
    'karnataka-kea-kpsc-recruitment-2026-calendar-guide',
    'Everything you need to know about upcoming Karnataka Examination Authority (KEA) and KPSC recruitment notices for Village Administrative Officers, FDA, SDA, and KAS.',
    `# Karnataka State Government Examinations (KEA & KPSC) 2026

The **Karnataka Examination Authority (KEA)** and **Karnataka Public Service Commission (KPSC)** conduct major recruitment drives for state departments, municipal corporations, and educational societies (KREIS).

## 1. Key Conducting Bodies
- **KEA (cetonline.karnataka.gov.in):** Conducts recruitment exams for VAO (Village Administrative Officer), ESCOMs (BESCOM, HESCOM), Board & Corporation recruitments, and Morarji Desai residential teachers.
- **KPSC (kpsc.kar.nic.in):** Conducts Karnataka Administrative Services (KAS), First Division Assistants (FDA), Second Division Assistants (SDA), and Departmental tests.

## 2. Karnataka Reservation & Quotas (Rural & Kannada Medium)
Karnataka candidates benefit from state-specific categories:
- **Category 1, 2A, 2B, 3A, 3B, SC, ST, GM**
- **Rural Quota (15%):** Requires continuous 1st to 10th standard education in rural recognized schools.
- **Kannada Medium Quota (5%):** Requires 1st to 10th education with Kannada as primary instruction medium.
- **Kalyana Karnataka (HK - Article 371J):** Special reservation certificates for Bidar, Kalaburagi, Yadgir, Raichur, Koppal, Ballari, and Vijayanagara.

## 3. Preparation Strategy for Kannada Language Test
All candidates who did not study Kannada in SSLC or higher must qualify the mandatory 150-mark Compulsory Kannada Language Examination conducted by KEA/KPSC.`,
    'Karnataka Recruitment Desk',
    'Karnataka',
    'Karnataka KEA & KPSC Recruitment 2026: Exam Calendar & Syllabus',
    'Official updates on Karnataka KEA VAO, KPSC KAS, FDA, SDA examinations. Quota details, syllabus in Kannada, and commission gazettes.',
    'KEA Recruitment 2026, KPSC KAS 2026, Karnataka VAO Exam, KEA Syllabus, 371J Quota',
    7
  );

  insertPost.run(
    'SSC CGL 2026: Tier 1 & Tier 2 Preparation Strategy, Vacancies & Cutoff Analysis',
    'ssc-cgl-2026-tier-1-tier-2-strategy-vacancies',
    'Comprehensive analysis of Staff Selection Commission Combined Graduate Level (SSC CGL) exam pattern, revised syllabus, and category-wise qualifying cutoffs.',
    `# SSC CGL 2026: Ultimate Preparation Blueprint

The **Staff Selection Commission (SSC)** Combined Graduate Level (CGL) examination recruits candidates for Group B and C posts across central ministries and departments.

## 1. Revised Exam Pattern
- **Tier 1 (Computer Based Test):** 100 questions (200 marks) across General Intelligence & Reasoning, General Awareness, Quantitative Aptitude, and English Comprehension. Qualifying in nature.
- **Tier 2 (Computer Based Test):** Paper I is mandatory for all posts:
  - Session 1 (2 hours 15 mins): Mathematical Abilities (30Q), Reasoning & General Intelligence (30Q), English Language & Comprehension (45Q), General Awareness (25Q), and Computer Knowledge Module (20Q).
  - Session 2 (15 mins): Data Entry Speed Test (DEST) typing assessment.

## 2. Official Portal & Notification
Always verify notices exclusively on \`ssc.gov.in\`. Beware of spurious coaching portals announcing premature cutoff predictions.

## 3. High-Scoring Focus Areas
- **Reasoning:** Syllogisms, Non-verbal series, Coding-Decoding, and Analogies.
- **Quantitative Aptitude:** Arithmetic topics (Percentages, Profit & Loss, SI/CI, Time & Work) carry high weightage. Advance Math (Geometry, Trigonometry, Mensuration) requires formula mastery.
- **English:** Reading comprehension, active/passive voice, direct/indirect speech, and idiom memory.`,
    'SarkariTracker Editorial Desk',
    'SSC',
    'SSC CGL 2026 Tier 1 & Tier 2 Blueprint: Strategy & Vacancies',
    'Master SSC CGL 2026 with verified syllabus breakdown, Tier 2 Computer & DEST typing requirements, and official commission updates.',
    'SSC CGL 2026, SSC Notification, SSC CGL Syllabus, Staff Selection Commission, SSC Cutoffs',
    6
  );
}

export default db;
