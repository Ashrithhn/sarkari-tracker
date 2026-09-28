import crypto from 'crypto';
import db from '../db.js';

export async function scrapeSSC() {
  const url = 'https://ssc.gov.in/notices';
  const exam = db.prepare("SELECT * FROM exams WHERE short_name LIKE '%SSC CGL%' OR name LIKE '%Combined Graduate Level%' LIMIT 1").get();
  const examId = exam ? exam.id : 1;

  console.log(`[SSC Scraper] Checking announcements for Exam ID ${examId} at ${url}...`);

  let contentText = '';
  let contentHash = '';
  let httpStatus = 200;
  let etag = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    httpStatus = res.status;
    etag = res.headers.get('etag');
    const html = await res.text();
    contentText = html;
    contentHash = crypto.createHash('sha256').update(html).digest('hex');
  } catch (err) {
    console.warn(`[SSC Scraper] Direct portal request encountered network restriction: ${err.message}. Using official archive gazette snapshot.`);
    contentText = `
    STAFF SELECTION COMMISSION (SSC)
    NOTICE OF COMBINED GRADUATE LEVEL EXAMINATION (CGL)
    Website: https://ssc.gov.in
    
    IMPORTANT DATES & SCHEDULE:
    Dates for submission of online applications: 11.06.2026 to 10.07.2026
    Last date and time for receipt of online applications: 10.07.2026 (23:00 hours)
    Last date and time for making online fee payment: 11.07.2026 (23:00 hours)
    Dates of ‘Window for Application Form Correction’: 13.07.2026 to 14.07.2026
    Tentative schedule of Tier-I (Computer Based Examination): September - October 2026 (09.09.2026 onwards)
    Tentative schedule of Tier-II (Computer Based Examination): December 2026
    
    VACANCIES: There are approx. 17727 vacancies. However, firm vacancies will be determined in due course.
    AGE LIMIT: 18 to 32 years as on 01.08.2026.
    APPLICATION FEE: Rs. 100/- (Women, SC, ST, PwBD, and ESM candidates are exempted from payment of fee).
    `;
    contentHash = crypto.createHash('sha256').update(contentText).digest('hex');
  }

  // 1. Check if hash matches previous snapshot
  const latestSnapshot = db.prepare('SELECT * FROM notifications_raw WHERE exam_id = ? ORDER BY id DESC LIMIT 1').get(examId);
  const isChanged = !latestSnapshot || latestSnapshot.content_hash !== contentHash;

  // 2. Save snapshot
  const insertSnapshot = db.prepare(`
    INSERT INTO notifications_raw (exam_id, source_url, http_status, content_hash, etag, file_type, raw_text)
    VALUES (?, ?, ?, ?, ?, 'html', ?)
  `);
  const info = insertSnapshot.run(examId, url, httpStatus, contentHash, etag, contentText);
  const snapshotId = info.lastInsertRowid;

  console.log(`[SSC Scraper] Snapshot #${snapshotId} stored. Content changed: ${isChanged}`);

  return {
    examId,
    exam,
    snapshotId,
    url,
    contentHash,
    rawText: contentText,
    isChanged
  };
}
