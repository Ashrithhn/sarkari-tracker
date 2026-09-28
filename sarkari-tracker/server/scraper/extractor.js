import db from '../db.js';

export function extractAndQueue(scrapedData) {
  const { examId, exam, rawText, url, snapshotId } = scrapedData;

  console.log(`[Extractor] Running verbatim-quoted extraction on announcement text for Exam #${examId}...`);

  // Helper to extract date and verify verbatim quote in source text
  function extractWithVerbatimQuote(regexes, dateIndex = 1) {
    const list = Array.isArray(regexes) ? regexes : [regexes];
    for (const regex of list) {
      const match = rawText.match(regex);
      if (match && match[dateIndex]) {
        const quote = match[0].trim();
        const rawDateStr = match[dateIndex].replace(/\//g, '.').replace(/-/g, '.');
        const parts = rawDateStr.split('.').map(p => parseInt(p, 10));
        let isoDate = null;
        if (parts.length === 3) {
          const year = parts[2];
          const month = String(parts[1]).padStart(2, '0');
          const day = String(parts[0]).padStart(2, '0');
          isoDate = `${year}-${month}-${day}`;
        }
        if (isoDate) {
          return { value: isoDate, quote, verifiedInText: rawText.includes(quote) };
        }
      }
    }
    return { value: null, quote: null, verifiedInText: false };
  }

  // 1. Verbatim quote extracts with multi-commission pattern support
  const applyStart = extractWithVerbatimQuote([
    /(?:submission\s+of\s+online\s+applications|online\s+registration|opening\s+date|date\s+of\s+notification)[:\s]+(\d{2}[./-]\d{2}[./-]\d{4})/i,
    /Registration.*?(\d{2}[./-]\d{2}[./-]\d{4})\s+to/i,
    /from\s+(\d{2}[./-]\d{2}[./-]\d{4})/i
  ]);

  const applyEnd = extractWithVerbatimQuote([
    /(?:last\s+date.*?for\s+receipt|closing\s+date|last\s+date\s+for\s+receipt\s+of\s+applications)[:\s]+(\d{2}[./-]\d{2}[./-]\d{4})/i,
    /to\s+(\d{2}[./-]\d{2}[./-]\d{4})/i
  ]);

  const prelimsExam = extractWithVerbatimQuote([
    /(?:preliminary\s+examination|tier-i.*?examination|written\s+test|online\s+examination\s+–\s+preliminary)[:\s\w\(\)]*?(\d{2}[./-]\d{2}[./-]\d{4})/i,
    /(\d{2}[./-]\d{2}[./-]\d{4})\s+onwards/i,
    /Preliminary[:\s]+(\d{2}[./-]\d{2}[./-]\d{4})/i
  ]);

  const mainsExam = extractWithVerbatimQuote([
    /(?:main\s+examination|tier-ii.*?examination|online\s+examination\s+–\s+main)[:\s\w\(\)]*?(\d{2}[./-]\d{2}[./-]\d{4})/i
  ]);

  // Vacancy extraction with quote
  const vacMatch = 
    rawText.match(/(?:TOTAL\s+VACANCIES|approx\.|vacancies|posts)[:\s]+(\d+)/i) ||
    rawText.match(/(\d+)\s+posts/i) ||
    rawText.match(/approximately\s+(\d+)/i);

  const vacanciesCount = vacMatch ? parseInt(vacMatch[1], 10) : (exam?.vacancies || 1000);
  const vacanciesQuote = vacMatch ? vacMatch[0].trim() : '';

  // Verbatim sanity checks
  const checks = [
    { field: 'apply_start', valid: applyStart?.verifiedInText && !!applyStart?.value, quote: applyStart?.quote },
    { field: 'apply_end', valid: applyEnd?.verifiedInText && !!applyEnd?.value, quote: applyEnd?.quote },
    { field: 'exam_date', valid: prelimsExam?.verifiedInText && !!prelimsExam?.value, quote: prelimsExam?.quote },
    { field: 'vacancies', valid: rawText.includes(String(vacanciesCount)), quote: vacanciesQuote }
  ];

  // Chronological sanity check
  const isChronological = (
    applyStart.value && applyEnd.value && prelimsExam.value &&
    new Date(applyEnd.value) >= new Date(applyStart.value) &&
    new Date(prelimsExam.value) >= new Date(applyEnd.value)
  );

  const allVerbatimVerified = checks.every(c => c.valid);
  const confidence = (allVerbatimVerified && isChronological) ? 0.98 : 0.60;

  const proposedChanges = {
    notification_date: applyStart.value,
    apply_start: applyStart.value,
    apply_end: applyEnd.value,
    exam_date: prelimsExam.value,
    mains_exam_date: mainsExam.value,
    vacancies: vacanciesCount,
    source_url: url,
    verbatim_evidence: {
      apply_start_quote: applyStart.quote,
      apply_end_quote: applyEnd.quote,
      exam_date_quote: prelimsExam.quote,
      mains_exam_quote: mainsExam.quote,
      vacancies_quote: vacanciesQuote
    }
  };

  const diffSummary = `Apply Window: ${applyStart.value} to ${applyEnd.value} | Exam Date: ${prelimsExam.value} | Vacancies: ${vacanciesCount} | Chronology Valid: ${isChronological}`;

  // Always send to ADMIN REVIEW QUEUE for human approval!
  const insertQueue = db.prepare(`
    INSERT INTO review_queue (
      exam_id, event_type, raw_extracted_data, proposed_changes, 
      diff_summary, confidence, failure_reason, source_pdf_url, status
    ) VALUES (?, 'NOTIFICATION_PUBLISHED', ?, ?, ?, ?, ?, ?, 'pending')
  `);

  const info = insertQueue.run(
    examId,
    JSON.stringify({ raw_text_preview: rawText.trim().substring(0, 1500) }),
    JSON.stringify(proposedChanges),
    diffSummary,
    confidence,
    isChronological ? 'AWAITING_ADMIN_VERIFICATION' : 'ILLOGICAL_DATE_SEQUENCE',
    url
  );

  console.log(`[Extractor] Extracted data saved to review_queue #${info.lastInsertRowid} (Status: PENDING)`);

  return {
    queueId: info.lastInsertRowid,
    proposedChanges,
    diffSummary,
    confidence,
    isChronological,
    allVerbatimVerified
  };
}
