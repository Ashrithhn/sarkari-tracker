import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import db from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n======================================================');
console.log('🚨 SARKARI TRACKER: PURGING ALL DUMMY / FAKE DATA 🚨');
console.log('======================================================\n');

// 1. Drop all tables to completely obliterate legacy dummy schemas
db.exec(`
  PRAGMA foreign_keys = OFF;
  DROP TABLE IF EXISTS reminders;
  DROP TABLE IF EXISTS user_notifications;
  DROP TABLE IF EXISTS notifications;
  DROP TABLE IF EXISTS application_checklist;
  DROP TABLE IF EXISTS applications;
  DROP TABLE IF EXISTS user_applications;
  DROP TABLE IF EXISTS exam_content;
  DROP TABLE IF EXISTS exam_cutoffs;
  DROP TABLE IF EXISTS exam_pyqs;
  DROP TABLE IF EXISTS audit_logs;
  DROP TABLE IF EXISTS review_queue;
  DROP TABLE IF EXISTS notifications_raw;
  DROP TABLE IF EXISTS exams;
  PRAGMA foreign_keys = ON;
`);

console.log('✓ Dropped all legacy and seeded tables.');

// 2. Re-create pristine schema
db.exec(`
  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    conducting_body TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'central',
    state TEXT DEFAULT NULL,
    category TEXT NOT NULL,
    official_site TEXT NOT NULL,
    careers_url TEXT,
    notification_url TEXT,
    results_url TEXT,
    admit_card_url TEXT,
    syllabus_source_url TEXT,
    frequency TEXT DEFAULT 'annual',
    scrape_frequency INTEGER DEFAULT 360,
    adapter_type TEXT DEFAULT 'generic',
    is_active BOOLEAN DEFAULT 1,
    data_status TEXT DEFAULT 'empty',
    last_verified_at TEXT,
    verified_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exam_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    title TEXT,
    payload TEXT,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    source_url TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
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
    category TEXT,
    state TEXT,
    fee_paid BOOLEAN DEFAULT 0,
    fee_receipt_file TEXT,
    status TEXT DEFAULT 'Applied',
    notes TEXT,
    official_portal_link TEXT,
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
    item_name TEXT NOT NULL,
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
`);

console.log('✓ Pristine schema created.');

// 3. Seed Clean Admin & Student Accounts
const hashedPasswordAdmin = bcrypt.hashSync('admin123', 10);
const hashedPasswordUser = bcrypt.hashSync('student123', 10);

const insertUser = db.prepare(`
  INSERT INTO users (name, email, phone, password, is_admin)
  VALUES (?, ?, ?, ?, ?)
`);

db.exec('DELETE FROM users');
try {
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'users'");
} catch (e) {}

insertUser.run('Sarkari Admin', 'admin@sarkari.in', '9999999999', hashedPasswordAdmin, 1);
insertUser.run('Candidate Aspirant', 'student@sarkari.in', '9888888888', hashedPasswordUser, 0);

console.log('\n✓ Seeded clean authentication credentials:');
console.log('  - Admin:   admin@sarkari.in / admin123 (is_admin: 1)');
console.log('  - Student: student@sarkari.in / student123 (is_admin: 0)');

// 4. Seed Official Exam Registry
const registryPath = path.join(__dirname, '../data/examRegistry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const insertExam = db.prepare(`
  INSERT INTO exams (
    name, short_name, conducting_body, level, state, category,
    official_site, careers_url, notification_url, results_url,
    admit_card_url, syllabus_source_url, frequency, scrape_frequency,
    adapter_type, is_active, data_status
  ) VALUES (
    @name, @short_name, @conducting_body, @level, @state, @category,
    @official_site, @careers_url, @notification_url, @results_url,
    @admit_card_url, @syllabus_source_url, @frequency, @scrape_frequency,
    @adapter_type, @active, 'empty'
  )
`);

const insertAllExams = db.transaction((exams) => {
  for (const e of exams) insertExam.run(e);
});

insertAllExams(registry);
console.log(`✓ Loaded ${registry.length} official exams into registry with data_status = 'empty' (Zero fake dates)`);

// 5. Verification Audit
console.log('\n------------------------------------------------------');
console.log('FINAL DATABASE VERIFICATION AUDIT:');
console.log('------------------------------------------------------');

const checkTables = [
  'users',
  'exams',
  'applications',
  'application_checklist',
  'exam_content',
  'exam_cutoffs',
  'exam_pyqs',
  'notifications',
  'reminders'
];

for (const t of checkTables) {
  const row = db.prepare(`SELECT COUNT(*) as count FROM ${t}`).get();
  console.log(` - ${t.padEnd(24)}: ${row.count} rows`);
}

console.log('\n======================================================');
console.log('ALL DUMMY DATA PURGED SUCCESSFULLY! Database is pure.');
console.log('======================================================\n');
