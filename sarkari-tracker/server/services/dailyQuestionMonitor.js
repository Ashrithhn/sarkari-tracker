import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import db from '../db.js';
import { DAILY_QUESTIONS, KARNATAKA_QUESTIONS, isOfficialDomain } from '../data/dailyQuestions.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Models in order of availability / speed / capacity
const PRIMARY_MODELS = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-flash-latest'];

/**
 * Perform a single structured Gemini call for an exam asking all questions
 */
export async function askDaily(exam) {
  const isKarnataka = (exam.category || '').toLowerCase().includes('karnataka') ||
                      (exam.state || '').toLowerCase().includes('karnataka') ||
                      (exam.conducting_body || '').toLowerCase().includes('kea') ||
                      (exam.conducting_body || '').toLowerCase().includes('kpsc');

  // Build the question dictionary to send
  const questionsObj = { ...DAILY_QUESTIONS };
  if (isKarnataka) {
    Object.assign(questionsObj, KARNATAKA_QUESTIONS);
  }

  const promptQuestions = {};
  for (const [k, v] of Object.entries(questionsObj)) {
    promptQuestions[k] = v.question;
  }

  const prompt = `
Exam Name: ${exam.name || exam.short_name || exam.custom_exam_name}
Conducting Body: ${exam.conducting_body || 'Official Government Commission'}
Official Site: ${exam.official_site || 'Official portal'}
Current Date: ${new Date().toDateString()}

You are India's Official Government Examination Intelligence Auditor.
Answer each of the following keys using the latest verified official commission gazettes, circulars, or notifications.
Rules:
- NEVER fabricate, invent or guess. If unannounced or not found, status MUST be "not_found".
- Status must be one of: "yes", "no", or "not_found".
- Format all dates strictly as YYYY-MM-DD.
- Provide source_url (prefer official portal .gov.in, .nic.in, .ac.in, .org.in).
- Provide a short quote (under 15 words) directly from the official notification or verified announcement.

Questions to answer:
${JSON.stringify(promptQuestions, null, 2)}

Return ONLY a valid JSON object matching this exact schema:
{
  "answers": {
    "<key>": {
      "status": "yes|no|not_found",
      "value": "Concise summary value or text",
      "date": "YYYY-MM-DD or empty string",
      "details": "Specific verified details",
      "source_url": "URL of official notice or commission portal",
      "quote": "Short exact quote under 15 words"
    }
  }
}
`;

  let responseText = null;
  let lastError = null;

  for (const model of PRIMARY_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      if (res && res.text) {
        responseText = res.text;
        break;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[DailyQuestionMonitor] Model ${model} failed:`, err.message);
    }
  }

  if (!responseText) {
    throw new Error(`All Gemini models failed: ${lastError?.message || 'No response'}`);
  }

  // Parse structured response
  let json = null;
  try {
    const clean = responseText.replace(/```json|```/g, '').trim();
    json = JSON.parse(clean);
  } catch (err) {
    throw new Error(`Failed to parse Gemini JSON: ${err.message}. Raw: ${responseText.slice(0, 150)}`);
  }

  const rawAnswers = json.answers || json;
  const processedAnswers = {};

  // Validate and assign trust labels
  for (const [key, ans] of Object.entries(rawAnswers)) {
    if (!ans || typeof ans !== 'object') continue;
    const isOfficial = isOfficialDomain(ans.source_url);
    const trustLabel = isOfficial ? 'Official source found' : 'AI-found, unverified';

    processedAnswers[key] = {
      status: ans.status || 'not_found',
      value: ans.value || '',
      date: ans.date || '',
      details: ans.details || '',
      source_url: ans.source_url || exam.official_site || '',
      quote: ans.quote || '',
      trust_label: trustLabel
    };
  }

  return processedAnswers;
}

/**
 * Diff yesterday's answers with today's answers
 */
export function diffAnswers(prevMap, currMap) {
  const changes = [];
  for (const [key, curr] of Object.entries(currMap)) {
    if (!curr || curr.status === 'not_found') continue; // Never notify on "not found"
    
    const prev = prevMap ? prevMap[key] : null;
    
    // Check if new or changed
    const isBrandNew = !prev && (curr.status === 'yes' || Boolean(curr.date) || Boolean(curr.value));
    const statusChanged = prev && prev.status !== curr.status;
    const dateChanged = prev && curr.date && prev.date !== curr.date;
    const valueChanged = prev && curr.value && prev.value !== curr.value;

    if (isBrandNew || statusChanged || dateChanged || valueChanged) {
      changes.push({
        key,
        from: prev || null,
        to: curr,
        isBrandNew
      });
    }
  }
  return changes;
}

/**
 * Save answers to SQLite exam_answers table
 */
export function saveAnswersToDb(exam, answers) {
  const examId = exam.exam_id || null;
  const customExamName = exam.custom_exam_name || exam.name || null;

  const insert = db.prepare(`
    INSERT INTO exam_answers (
      exam_id, custom_exam_name, question_key, status, value, date, details, source_url, quote, trust_label
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const saveTx = db.transaction((entries) => {
    for (const [key, a] of entries) {
      insert.run(
        examId,
        customExamName,
        key,
        a.status,
        a.value,
        a.date,
        a.details,
        a.source_url,
        a.quote,
        a.trust_label
      );
    }
  });

  saveTx(Object.entries(answers));
}

/**
 * Retrieve the latest answers for an exam
 */
export function getLatestAnswersForExam(examId, customExamName) {
  let rows = [];
  if (examId) {
    rows = db.prepare(`
      SELECT * FROM exam_answers 
      WHERE exam_id = ? 
      ORDER BY id DESC
    `).all(examId);
  } else if (customExamName) {
    rows = db.prepare(`
      SELECT * FROM exam_answers 
      WHERE custom_exam_name = ? 
      ORDER BY id DESC
    `).all(customExamName);
  }

  // Deduplicate by question_key taking newest
  const latest = {};
  for (const r of rows) {
    if (!latest[r.question_key]) {
      latest[r.question_key] = r;
    }
  }
  return latest;
}

/**
 * Main Daily Exam Runner:
 * Only processes exams currently tracked or followed by users.
 * 1 exam = 1 Gemini call.
 */
export async function runDailyExamChecks() {
  const startTime = Date.now();
  console.log(`[DailyQuestionMonitor] Starting daily exam intelligence checks at ${new Date().toISOString()}`);

  // Query only distinct exams tracked by users in applications OR followed
  const trackedExams = db.prepare(`
    SELECT DISTINCT 
      COALESCE(e.id, 0) as exam_id,
      COALESCE(e.name, a.custom_exam_name) as name,
      COALESCE(e.short_name, a.custom_exam_name) as short_name,
      COALESCE(e.conducting_body, 'Official Commission') as conducting_body,
      COALESCE(e.official_site, a.official_portal_link, '') as official_site,
      COALESCE(e.category, a.category, 'General') as category,
      COALESCE(e.state, a.state, '') as state,
      a.custom_exam_name
    FROM applications a
    LEFT JOIN exams e ON a.exam_id = e.id
    WHERE a.status NOT IN ('Selected', 'Not Selected', 'Cancelled')
    UNION
    SELECT DISTINCT
      e.id as exam_id,
      e.name,
      e.short_name,
      e.conducting_body,
      e.official_site,
      e.category,
      e.state,
      NULL as custom_exam_name
    FROM follows f
    JOIN exams e ON f.exam_id = e.id
  `).all().filter(e => Boolean(e.name || e.custom_exam_name));

  if (trackedExams.length === 0) {
    console.log('[DailyQuestionMonitor] No active applications or followed exams found. 0 Gemini calls required.');
    return {
      success: true,
      trackedExamsCount: 0,
      notificationsCreated: 0,
      message: 'No candidate applications currently tracked. 0 API calls made.'
    };
  }

  console.log(`[DailyQuestionMonitor] Found ${trackedExams.length} unique active exams followed/applied by candidates.`);
  let totalChanges = 0;
  let notificationsCreated = 0;
  const executionLogs = [];

  const insertNotif = db.prepare(`
    INSERT INTO notifications (
      exam_id, custom_exam_name, title, message, type, is_urgent, dedup_key, source_url, trust_label
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertUserNotif = db.prepare(`
    INSERT OR IGNORE INTO user_notifications (user_id, notification_id, read)
    VALUES (?, ?, 0)
  `);

  for (const exam of trackedExams) {
    const examName = exam.short_name || exam.name || exam.custom_exam_name;
    try {
      console.log(`[DailyQuestionMonitor] Checking: "${examName}" (${exam.conducting_body || 'Commission'})`);
      
      // 1. Get previous answers from database
      const prevAnswers = getLatestAnswersForExam(exam.exam_id, exam.custom_exam_name);

      // 2. Ask Gemini all questions in 1 single call
      const currentAnswers = await askDaily(exam);

      // 3. Save today's answers to history
      saveAnswersToDb(exam, currentAnswers);

      // 4. Compute differences
      const changes = diffAnswers(prevAnswers, currentAnswers);
      totalChanges += changes.length;

      // 5. Generate notifications for verified changes
      for (const ch of changes) {
        const qConfig = DAILY_QUESTIONS[ch.key] || KARNATAKA_QUESTIONS[ch.key];
        const formattedMsg = qConfig ? qConfig.formatMessage(examName, ch.to) : `${examName}: Update for ${ch.key}: ${ch.to.value || ch.to.details}`;
        const title = `${examName}: ${ch.key.replace(/_/g, ' ').toUpperCase()}`;
        const isUrgent = qConfig?.isUrgent ? 1 : (ch.to.trust_label === 'Official source found' ? 1 : 0);

        // Deduplication key guarantees alert only fires once per unique event
        const dedupKey = `${exam.exam_id || exam.custom_exam_name}_${ch.key}_${ch.to.date || ch.to.value || ch.to.status}`;

        try {
          const info = insertNotif.run(
            exam.exam_id || null,
            exam.custom_exam_name || null,
            title,
            formattedMsg,
            ch.key,
            isUrgent,
            dedupKey,
            ch.to.source_url || exam.official_site,
            ch.to.trust_label
          );

          const notifId = info.lastInsertRowid;
          notificationsCreated++;

          // Find all users who tracked or follow this exam
          const candidateUsers = db.prepare(`
            SELECT DISTINCT user_id FROM applications 
            WHERE (exam_id IS NOT NULL AND exam_id = ?) 
               OR (custom_exam_name IS NOT NULL AND LOWER(custom_exam_name) = LOWER(?))
            UNION
            SELECT DISTINCT user_id FROM follows
            WHERE (exam_id IS NOT NULL AND exam_id = ?)
               OR (custom_exam_name IS NOT NULL AND LOWER(custom_exam_name) = LOWER(?))
          `).all(exam.exam_id, exam.custom_exam_name, exam.exam_id, exam.custom_exam_name);

          for (const u of candidateUsers) {
            insertUserNotif.run(u.user_id, notifId);
          }

          executionLogs.push({
            exam: examName,
            key: ch.key,
            trust: ch.to.trust_label,
            notification: formattedMsg
          });
        } catch (dbErr) {
          if (dbErr.message.includes('UNIQUE constraint failed')) {
            // Already notified for this exact date/value - skipping duplicate
          } else {
            console.error('[DailyQuestionMonitor] Notification insertion failed:', dbErr.message);
          }
        }
      }

      // Add a polite 2-second pause between exams to honor quota limits
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`[DailyQuestionMonitor] Error processing "${examName}":`, err.message);
      executionLogs.push({ exam: examName, error: err.message });
    }
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`[DailyQuestionMonitor] Completed daily check in ${durationSec}s. Tracked exams: ${trackedExams.length}, Changes: ${totalChanges}, New notifications: ${notificationsCreated}`);

  return {
    success: true,
    trackedExamsCount: trackedExams.length,
    totalChanges,
    notificationsCreated,
    durationSec,
    logs: executionLogs
  };
}
