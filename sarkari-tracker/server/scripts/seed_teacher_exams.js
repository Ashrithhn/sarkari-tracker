import db from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const newExams = [
  {
    name: "Karnataka Residential Educational Institutions Society (KREIS) Teaching & Principal Recruitment 2026",
    short_name: "KEA KREIS",
    conducting_body: "Karnataka Examinations Authority (KEA)",
    level: "state",
    state: "Karnataka",
    category: "Karnataka",
    official_site: "https://cetonline.karnataka.gov.in/kea/",
    careers_url: "https://cetonline.karnataka.gov.in/kea/",
    notification_url: "https://cetonline.karnataka.gov.in/kea/",
    results_url: "https://cetonline.karnataka.gov.in/kea/",
    admit_card_url: "https://cetonline.karnataka.gov.in/kea/",
    syllabus_source_url: "https://cetonline.karnataka.gov.in/kea/",
    frequency: "annual",
    scrape_frequency: 60,
    data_status: "verified",
    last_verified_at: "2026-09-28 12:00:00",
    verified_by: "KEA_OFFICIAL_CALENDAR_2026",
    dates: {
      notification_date: "2026-07-10",
      apply_start: "2026-07-15",
      apply_end: "2026-08-17",
      fee_last_date: "2026-08-18",
      exam_date: "2026-11-28",
      notes: "Kannada Language Exam held on 22 Aug 2026. Main Subject Examinations on 28 and 29 November 2026."
    },
    vacancies: "1,087 (767 RPC + 320 Kalyana Karnataka)",
    eligibility: "Bachelor's / Master's Degree in relevant discipline with B.Ed and qualified teacher certificate",
    source_url: "https://cetonline.karnataka.gov.in/kea/"
  },
  {
    name: "Karnataka Graduate Primary School Teachers Recruitment 2026 (Classes 6 to 8 / GPSTR)",
    short_name: "Karnataka GPSTR",
    conducting_body: "Department of School Education and Literacy, Karnataka",
    level: "state",
    state: "Karnataka",
    category: "Karnataka",
    official_site: "https://schooleducation.karnataka.gov.in/",
    careers_url: "https://schooleducation.karnataka.gov.in/",
    notification_url: "https://schooleducation.karnataka.gov.in/",
    results_url: "https://schooleducation.karnataka.gov.in/",
    admit_card_url: "https://schooleducation.karnataka.gov.in/",
    syllabus_source_url: "https://schooleducation.karnataka.gov.in/",
    frequency: "annual",
    scrape_frequency: 60,
    data_status: "verified",
    last_verified_at: "2026-09-28 12:00:00",
    verified_by: "EDUCATION_DEPT_GAZETTE_2026",
    dates: {
      notification_date: "2026-08-12",
      apply_start: "2026-08-18",
      apply_end: "2026-10-26",
      notes: "15,000 Teacher Vacancies across Karnataka. Official written test schedule to be announced by Department."
    },
    vacancies: "15,000 (8,033 Non-KK + 6,967 Kalyana Karnataka)",
    eligibility: "Graduation with at least 50% marks, B.Ed / D.El.Ed, and qualified KARTET / CTET Paper-II",
    source_url: "https://schooleducation.karnataka.gov.in/"
  },
  {
    name: "Karnataka High School Teachers Recruitment 2026 (Assistant Masters / Classes 9 & 10 / HSTR)",
    short_name: "Karnataka HSTR",
    conducting_body: "Department of School Education and Literacy, Karnataka",
    level: "state",
    state: "Karnataka",
    category: "Karnataka",
    official_site: "https://schooleducation.karnataka.gov.in/",
    careers_url: "https://schooleducation.karnataka.gov.in/",
    notification_url: "https://schooleducation.karnataka.gov.in/",
    results_url: "https://schooleducation.karnataka.gov.in/",
    admit_card_url: "https://schooleducation.karnataka.gov.in/",
    syllabus_source_url: "https://schooleducation.karnataka.gov.in/",
    frequency: "annual",
    scrape_frequency: 60,
    data_status: "empty",
    last_verified_at: null,
    verified_by: null,
    vacancies: "To be notified",
    eligibility: "Post Graduation / Bachelor's Degree in relevant school subject with B.Ed",
    source_url: "https://schooleducation.karnataka.gov.in/"
  }
];

console.log('Seeding Karnataka KREIS, GPSTR, and HSTR exams...');

const insertExam = db.prepare(`
  INSERT INTO exams (
    name, short_name, conducting_body, level, state, category,
    official_site, careers_url, notification_url, results_url,
    admit_card_url, syllabus_source_url, frequency, scrape_frequency,
    data_status, last_verified_at, verified_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertContent = db.prepare(`
  INSERT INTO exam_content (
    exam_id, content_type, title, payload, source_url, status, uploaded_by, published_at
  ) VALUES (?, ?, ?, ?, ?, 'published', 'Admin', CURRENT_TIMESTAMP)
`);

for (const ex of newExams) {
  const existing = db.prepare('SELECT id FROM exams WHERE short_name = ?').get(ex.short_name);
  let examId;
  if (existing) {
    examId = existing.id;
    db.prepare(`
      UPDATE exams SET
        name = ?, conducting_body = ?, official_site = ?, data_status = ?,
        last_verified_at = ?, verified_by = ?
      WHERE id = ?
    `).run(ex.name, ex.conducting_body, ex.official_site, ex.data_status, ex.last_verified_at, ex.verified_by, examId);
    console.log(`Updated existing exam '${ex.short_name}' (ID: ${examId})`);
  } else {
    const info = insertExam.run(
      ex.name, ex.short_name, ex.conducting_body, ex.level, ex.state, ex.category,
      ex.official_site, ex.careers_url, ex.notification_url, ex.results_url,
      ex.admit_card_url, ex.syllabus_source_url, ex.frequency, ex.scrape_frequency,
      ex.data_status, ex.last_verified_at, ex.verified_by
    );
    examId = info.lastInsertRowid;
    console.log(`Inserted new exam '${ex.short_name}' (ID: ${examId})`);
  }

  // Insert dates content if present
  if (ex.dates) {
    db.prepare('DELETE FROM exam_content WHERE exam_id = ? AND content_type = ?').run(examId, 'dates');
    insertContent.run(
      examId,
      'dates',
      'Official Examination & Application Schedule 2026',
      JSON.stringify(ex.dates),
      ex.source_url
    );
    console.log(`  ✓ Published verified dates for ${ex.short_name}`);
  }

  // Insert vacancies content
  if (ex.vacancies) {
    db.prepare('DELETE FROM exam_content WHERE exam_id = ? AND content_type = ?').run(examId, 'vacancies');
    insertContent.run(
      examId,
      'vacancies',
      'Official Vacancy Announcement',
      JSON.stringify({ total: ex.vacancies }),
      ex.source_url
    );
  }
}

// Update examRegistry.json
const registryPath = path.join(__dirname, '../data/examRegistry.json');
if (fs.existsSync(registryPath)) {
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  for (const ex of newExams) {
    const idx = registry.findIndex(r => r.short_name === ex.short_name);
    const item = {
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
      syllabus_source_url: ex.syllabus_source_url,
      frequency: ex.frequency,
      scrape_frequency: ex.scrape_frequency,
      active: 1
    };
    if (idx >= 0) {
      registry[idx] = item;
    } else {
      registry.push(item);
    }
  }
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');
  console.log(`Updated ${registryPath} with ${registry.length} exams.`);
}

console.log('✅ Seeding completed successfully!');
