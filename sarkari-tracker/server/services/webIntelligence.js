import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import db from '../db.js';

// Month mapping for parsing text dates
const MONTHS = {
  january: '01', jan: '01',
  february: '02', feb: '02',
  march: '03', mar: '03',
  april: '04', apr: '04',
  may: '05',
  june: '06', jun: '06',
  july: '07', jul: '07',
  august: '08', aug: '08',
  september: '09', sep: '09', sept: '09',
  october: '10', oct: '10',
  november: '11', nov: '11',
  december: '12', dec: '12'
};

/**
 * Normalizes extracted date strings into YYYY-MM-DD format
 */
function normalizeDate(raw) {
  if (!raw) return null;
  const clean = raw.trim().replace(/,/g, '');

  // Format: 2026-11-28
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // Format: 28/11/2026 or 28-11-2026 or 28.11.2026
  const slashMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Format: 28 November 2026 or 28th Nov 2026
  const textMatch = clean.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})$/i);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const monthStr = textMatch[2].toLowerCase();
    const month = MONTHS[monthStr];
    const year = textMatch[3];
    if (month) return `${year}-${month}-${day}`;
  }

  return clean;
}

export function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^"+|"+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts dates, fees, vacancies, and snippets from text
 */
function extractExamDetailsFromText(title, description = '') {
  const cleanTitle = cleanHtml(title);
  const cleanDesc = cleanHtml(description);
  const combined = `${cleanTitle} ${cleanDesc}`;

  // Vacancy extraction
  let expectedVacancies = null;
  const vacMatch = combined.match(/(\d{1,3}(?:,\d{3})+|\d{3,6})\s*(?:vacanc|posts|seats|openings)/i);
  if (vacMatch) {
    expectedVacancies = vacMatch[1].replace(/,/g, '');
  }

  // Fee extraction
  let expectedFee = null;
  const feeMatch = combined.match(/(?:₹|Rs\.?|INR|fee(?: of)?)\s*(\d{2,4})/i);
  if (feeMatch) {
    expectedFee = `₹${feeMatch[1]}`;
  }

  // Dates extraction (Exam date & last date)
  const fullDateRegex = /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+202[5-7]|\d{4}-\d{2}-\d{2}|\d{1,2}[-/.]\d{1,2}[-/.]202[5-7])\b/gi;
  const matchedDates = [...combined.matchAll(fullDateRegex)].map(m => normalizeDate(m[1]));

  let expectedExamDate = null;
  let expectedApplyEnd = null;
  let expectedApplyStart = null;

  // Contextual clues
  if (combined.match(/exam\s+date|examination|written\s+test/i) && matchedDates.length > 0) {
    expectedExamDate = matchedDates[matchedDates.length - 1]; // usually later date
  }
  if (combined.match(/last\s+date|apply\s+online\s+till|deadline/i) && matchedDates.length > 0) {
    expectedApplyEnd = matchedDates[0];
  }
  if (combined.match(/start(?:s|ing)?|from/i) && matchedDates.length > 1) {
    expectedApplyStart = matchedDates[0];
  }

  // Fallback to assign dates if available
  if (!expectedExamDate && matchedDates.length === 1) {
    expectedExamDate = matchedDates[0];
  } else if (!expectedExamDate && matchedDates.length > 1) {
    expectedExamDate = matchedDates[matchedDates.length - 1];
    expectedApplyEnd = matchedDates[0];
  }

  // Eligibility snippets
  let expectedEligibility = null;
  const eligMatch = combined.match(/(?:eligibility|qualification)[:\s]+([^.]+)/i) ||
                    combined.match(/([A-Za-z\s]+(?:Degree|Graduation|B\.Ed|10th|12th|Diploma|B\.Tech|BE|Graduate)[^.]+)/i);
  if (eligMatch) {
    expectedEligibility = eligMatch[1].trim().slice(0, 100);
  }

  // Snippet
  const snippet = cleanDesc.length > cleanTitle.length ? cleanDesc.slice(0, 260) : cleanTitle;

  return {
    expectedVacancies,
    expectedFee,
    expectedExamDate,
    expectedApplyStart,
    expectedApplyEnd,
    expectedEligibility,
    snippet
  };
}

/**
 * Searches Google News RSS for real-time exam news and announcements
 */
async function searchGoogleNews(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const items = xml.split('<item>').slice(1).map(chunk => {
      const title = cleanHtml(chunk.match(/<title>(.*?)<\/title>/)?.[1] || '');
      const link = (chunk.match(/<link>(.*?)<\/link>/)?.[1] || '').trim();
      const pubDate = (chunk.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '').trim();
      const description = cleanHtml(chunk.match(/<description>(.*?)<\/description>/)?.[1] || '');
      const source = cleanHtml(chunk.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || 'Web News');
      const sourceUrl = chunk.match(/<source url="(.*?)"/)?.[1] || '';
      return { title, link, pubDate, description, source, sourceUrl };
    });

    return items;
  } catch (err) {
    return [];
  }
}

/**
 * Searches Bing News RSS for real-time announcements with rich textual descriptions
 */
async function searchBingNews(query) {
  const url = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const items = xml.split('<item>').slice(1).map(chunk => {
      const title = cleanHtml(chunk.match(/<title>(.*?)<\/title>/)?.[1] || '');
      const link = (chunk.match(/<link>(.*?)<\/link>/)?.[1] || '').trim();
      const pubDate = (chunk.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '').trim();
      const description = cleanHtml(chunk.match(/<description>(.*?)<\/description>/)?.[1] || '');
      return { title, link, pubDate, description, source: 'Bing News', sourceUrl: link };
    });

    return items;
  } catch (err) {
    return [];
  }
}

// Keep backward compatibility
const searchExamNews = searchGoogleNews;

/**
 * Filters and ranks articles by relevance, prioritizing deadline extension notices and rich descriptions
 */
function filterAndRankArticles(articles, examName) {
  const keywords = (examName || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  // Keep only relevant articles containing keywords
  const relevant = articles.filter(a => {
    const text = `${a.title} ${a.description || a.snippet || ''}`.toLowerCase();
    return keywords.length === 0 || keywords.some(k => text.includes(k));
  });

  // Deduplicate keeping the version with the longest snippet/description
  const map = new Map();
  for (const item of relevant) {
    const key = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 35);
    const existing = map.get(key);
    const itemDesc = item.description || item.snippet || '';
    const existDesc = existing?.description || existing?.snippet || '';
    if (!existing || itemDesc.length > existDesc.length) {
      map.set(key, item);
    }
  }

  const uniqueList = Array.from(map.values());

  const extensionArticles = [];
  const deadlineArticles = [];
  const scheduleArticles = [];
  const otherArticles = [];

  for (const item of uniqueList) {
    const fullText = `${item.title} ${item.description || item.snippet || ''}`.toLowerCase();

    if (/extended|extension|corrigendum|postponed|revised|late fee/i.test(fullText)) {
      extensionArticles.push(item);
    } else if (/last date|apply|deadline|registration/i.test(fullText)) {
      deadlineArticles.push(item);
    } else if (/exam date|admit card|schedule|prelims|mains|written test/i.test(fullText)) {
      scheduleArticles.push(item);
    } else {
      otherArticles.push(item);
    }
  }

  return [
    ...extensionArticles.slice(0, 6),
    ...deadlineArticles.slice(0, 4),
    ...scheduleArticles.slice(0, 4),
    ...otherArticles.slice(0, 2)
  ].slice(0, 14);
}

/**
 * Scan web for an exam, parse details, store in web_discoveries, and queue for admin
 */
export async function scanWebForExam(examId) {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  if (!exam) throw new Error('Exam not found');

  console.log(`[WebIntelligence] Scanning web for Exam #${examId} (${exam.short_name || exam.name})...`);

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const examLabel = exam.short_name || exam.name;

  const queries = [
    `${examLabel} registration last date extended till late fee`,
    `${examLabel} last date to apply without late fee ${currentYear} ${nextYear}`,
    `${examLabel} exam date schedule prelims ${currentYear} ${nextYear}`
  ];

  const searchPromises = [];
  for (const q of queries) {
    searchPromises.push(searchBingNews(q));
    searchPromises.push(searchGoogleNews(q));
  }

  const allItems = (await Promise.all(searchPromises)).flat();
  const uniqueItems = filterAndRankArticles(allItems, examLabel);

  const insertDiscovery = db.prepare(`
    INSERT INTO web_discoveries (
      exam_id, source_title, source_url, source_domain, pub_date, snippet,
      expected_exam_date, expected_apply_start, expected_apply_end,
      expected_fee, expected_vacancies, expected_eligibility, confidence, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_admin_confirmation')
  `);

  const updateDiscovery = db.prepare(`
    UPDATE web_discoveries SET
      snippet = ?, expected_exam_date = COALESCE(?, expected_exam_date),
      expected_apply_end = COALESCE(?, expected_apply_end),
      expected_fee = COALESCE(?, expected_fee),
      expected_vacancies = COALESCE(?, expected_vacancies),
      pub_date = ?
    WHERE id = ?
  `);

  const newDiscoveries = [];

  for (const item of uniqueItems.slice(0, 8)) {
    const details = extractExamDetailsFromText(item.title, item.description);
    
    // Check if URL already recorded for this exam
    const existing = db.prepare(`
      SELECT id FROM web_discoveries WHERE exam_id = ? AND source_url = ?
    `).get(examId, item.link);

    if (existing) {
      updateDiscovery.run(
        details.snippet,
        details.expectedExamDate,
        details.expectedApplyEnd,
        details.expectedFee,
        details.expectedVacancies,
        item.pubDate,
        existing.id
      );
    } else {
      const info = insertDiscovery.run(
        examId,
        item.title,
        item.link,
        item.source || 'News Source',
        item.pubDate,
        details.snippet,
        details.expectedExamDate,
        details.expectedApplyStart,
        details.expectedApplyEnd,
        details.expectedFee,
        details.expectedVacancies,
        details.expectedEligibility,
        'Tentative / Online Media Report'
      );
      newDiscoveries.push(info.lastInsertRowid);
    }
  }

  // If discoveries exist and no pending review item exists, create entry in review_queue
  const bestDiscovery = db.prepare(`
    SELECT * FROM web_discoveries 
    WHERE exam_id = ? AND status = 'pending_admin_confirmation'
    ORDER BY (expected_exam_date IS NOT NULL) DESC, (expected_vacancies IS NOT NULL) DESC, id DESC 
    LIMIT 1
  `).get(examId);

  if (bestDiscovery) {
    const existingQueue = db.prepare(`
      SELECT id FROM review_queue WHERE exam_id = ? AND status = 'pending'
    `).get(examId);

    if (!existingQueue) {
      const proposed = {
        exam_date: bestDiscovery.expected_exam_date,
        apply_end: bestDiscovery.expected_apply_end,
        fee: bestDiscovery.expected_fee,
        vacancies: bestDiscovery.expected_vacancies,
        source_url: bestDiscovery.source_url,
        source_title: bestDiscovery.source_title
      };

      const diffSummary = `Web Discovered: ${bestDiscovery.source_title.slice(0, 90)} | Exam Date: ${bestDiscovery.expected_exam_date || 'Awaited'} | Fee: ${bestDiscovery.expected_fee || 'Awaited'} | Vacancies: ${bestDiscovery.expected_vacancies || 'Awaited'} (Source: ${bestDiscovery.source_domain})`;

      db.prepare(`
        INSERT INTO review_queue (
          exam_id, event_type, raw_extracted_data, proposed_changes, 
          diff_summary, confidence, failure_reason, source_pdf_url, status
        ) VALUES (?, 'WEB_INTELLIGENCE_DISCOVERY', ?, ?, ?, 0.85, 'AWAITING_ADMIN_VERIFICATION', ?, 'pending')
      `).run(
        examId,
        JSON.stringify(bestDiscovery),
        JSON.stringify(proposed),
        diffSummary,
        bestDiscovery.source_url
      );
      console.log(`[WebIntelligence] Pushed web discovery to Admin Review Queue for Exam #${examId}`);
    }
  }

  // Also generate and cache Google AI Overview for this exam
  try {
    await generateExamAiOverview({
      examId,
      examName: exam.short_name || exam.name,
      conductingBody: exam.conducting_body,
      existingDiscoveries: uniqueItems
    });
  } catch (err) {
    console.warn(`[WebIntelligence] AI Overview generation error for #${examId}:`, err.message);
  }

  return getWebDiscoveries(examId);
}

/**
 * Get all web discoveries for an exam
 */
export function getWebDiscoveries(examId) {
  return db.prepare(`
    SELECT * FROM web_discoveries 
    WHERE exam_id = ? 
    ORDER BY id DESC
  `).all(examId);
}

/**
 * Admin confirms a web discovery and publishes to official gazette
 */
export function confirmWebDiscovery(discoveryId, adminUser) {
  const discovery = db.prepare('SELECT * FROM web_discoveries WHERE id = ?').get(discoveryId);
  if (!discovery) throw new Error('Discovery not found');

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(discovery.exam_id);
  if (!exam) throw new Error('Exam not found');

  // Mark discovery as confirmed
  db.prepare(`
    UPDATE web_discoveries SET
      status = 'confirmed_by_admin',
      confirmed_by = ?,
      confirmed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(adminUser.email || adminUser.name || 'Admin', discoveryId);

  // Update review queue if linked
  db.prepare(`
    UPDATE review_queue SET status = 'approved' WHERE exam_id = ? AND status = 'pending'
  `).run(discovery.exam_id);

  // Build official date payload
  const datePayload = {
    exam_date: discovery.expected_exam_date || null,
    apply_end: discovery.expected_apply_end || null,
    apply_start: discovery.expected_apply_start || null,
    notes: `Confirmed by official portal verification (${discovery.source_domain})`
  };

  // Publish dates into exam_content
  const existingDates = db.prepare(`
    SELECT id FROM exam_content WHERE exam_id = ? AND content_type = 'dates'
  `).get(discovery.exam_id);

  if (existingDates) {
    db.prepare(`
      UPDATE exam_content SET
        payload = ?, source_url = ?, status = 'published',
        uploaded_by = ?, published_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      JSON.stringify(datePayload),
      discovery.source_url,
      adminUser.name || 'Admin',
      existingDates.id
    );
  } else {
    db.prepare(`
      INSERT INTO exam_content (
        exam_id, content_type, title, payload, source_url, status, uploaded_by, published_at
      ) VALUES (?, 'dates', 'Official Schedule', ?, ?, 'published', ?, CURRENT_TIMESTAMP)
    `).run(
      discovery.exam_id,
      JSON.stringify(datePayload),
      discovery.source_url,
      adminUser.name || 'Admin'
    );
  }

  // Update exam record
  db.prepare(`
    UPDATE exams SET
      data_status = 'verified',
      last_verified_at = CURRENT_TIMESTAMP,
      verified_by = ?
    WHERE id = ?
  `).run(adminUser.email || 'Admin', discovery.exam_id);

  // Send notification to all candidate trackers
  const trackers = db.prepare('SELECT user_id FROM applications WHERE exam_id = ?').all(discovery.exam_id);
  if (trackers.length > 0) {
    const notif = db.prepare(`
      INSERT INTO notifications (exam_id, title, message, type, is_urgent)
      VALUES (?, ?, ?, 'alert', 1)
    `).run(
      discovery.exam_id,
      `Official Schedule Confirmed: ${exam.short_name || exam.name}`,
      `Official gazette dates have been confirmed by admin from ${discovery.source_domain}. Check your dashboard.`
    );

    const linkStmt = db.prepare('INSERT OR IGNORE INTO user_notifications (user_id, notification_id, read) VALUES (?, ?, 0)');
    trackers.forEach(t => linkStmt.run(t.user_id, notif.lastInsertRowid));
  }

  return { success: true, message: `Exam #${discovery.exam_id} verified & published!` };
}

/**
 * Admin rejects a web discovery
 */
export function rejectWebDiscovery(discoveryId) {
  db.prepare(`
    UPDATE web_discoveries SET status = 'rejected' WHERE id = ?
  `).run(discoveryId);

  return { success: true, message: 'Web discovery marked as rejected' };
}

/**
 * Analyzes custom unlisted exam keywords entered by the candidate.
 * Extracts expected dates, fees, vacancies, eligibility and clean summary from the web.
 */
export async function analyzeCustomExamKeywords({ custom_exam_name, post_name, custom_conducting_body }) {
  const primaryKeyword = `${custom_exam_name || ''} ${post_name || ''}`.trim();
  if (!primaryKeyword) return null;

  console.log(`[WebIntelligence] Analyzing unlisted exam keywords: "${primaryKeyword}"...`);

  const queries = [
    `${primaryKeyword} recruitment 2026 notification exam date`,
    `${primaryKeyword} apply online last date fee vacancies`,
    `${custom_conducting_body || ''} ${primaryKeyword} 2026 announcement`
  ];

  let allItems = [];
  for (const q of queries) {
    if (q.trim()) {
      const items = await searchExamNews(q);
      allItems = [...allItems, ...items];
    }
  }

  // Deduplicate
  const seen = new Set();
  const uniqueItems = allItems.filter(item => {
    if (!item.title || seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });

  let bestExamDate = null;
  let bestApplyEnd = null;
  let bestApplyStart = null;
  let bestFee = null;
  let bestVacancies = null;
  let bestEligibility = null;
  const processedSources = [];

  for (const item of uniqueItems.slice(0, 6)) {
    const details = extractExamDetailsFromText(item.title, item.description);
    if (!bestExamDate && details.expectedExamDate) bestExamDate = details.expectedExamDate;
    if (!bestApplyEnd && details.expectedApplyEnd) bestApplyEnd = details.expectedApplyEnd;
    if (!bestApplyStart && details.expectedApplyStart) bestApplyStart = details.expectedApplyStart;
    if (!bestFee && details.expectedFee) bestFee = details.expectedFee;
    if (!bestVacancies && details.expectedVacancies) bestVacancies = details.expectedVacancies;
    if (!bestEligibility && details.expectedEligibility) bestEligibility = details.expectedEligibility;

    processedSources.push({
      title: item.title,
      link: item.link,
      domain: item.source || 'Online Media',
      pub_date: item.pubDate,
      snippet: details.snippet,
      detected_dates: {
        exam_date: details.expectedExamDate,
        last_date: details.expectedApplyEnd
      }
    });
  }

  // Build clean analysis summary
  const summaryParts = [];
  summaryParts.push(`Keyword Analysis for "${primaryKeyword}":`);
  if (bestVacancies) {
    summaryParts.push(`• Vacancies: Online reports suggest approx ${Number(bestVacancies).toLocaleString()} posts.`);
  }
  if (bestExamDate) {
    summaryParts.push(`• Expected Exam Date: Tentatively scheduled for ${bestExamDate} as per recent media updates.`);
  }
  if (bestApplyEnd) {
    summaryParts.push(`• Application Deadline: Last date expected around ${bestApplyEnd}.`);
  }
  if (bestFee) {
    summaryParts.push(`• Application Fee: ${bestFee} reported for candidates.`);
  }
  if (bestEligibility) {
    summaryParts.push(`• Eligibility: Minimum qualification required is ${bestEligibility}.`);
  }
  if (processedSources.length > 0) {
    summaryParts.push(`• Media Sources: Crawled ${processedSources.length} articles across ${[...new Set(processedSources.map(s => s.domain))].join(', ')}.`);
  } else {
    summaryParts.push('• Currently no formal public media announcements detected for these exact keywords.');
  }

  return {
    analyzed_at: new Date().toISOString(),
    keywords: primaryKeyword,
    post_name: post_name || null,
    conducting_body: custom_conducting_body || null,
    expected_exam_date: bestExamDate,
    expected_apply_start: bestApplyStart,
    expected_apply_end: bestApplyEnd,
    expected_fee: bestFee,
    expected_vacancies: bestVacancies,
    expected_eligibility: bestEligibility,
    summary: summaryParts.join('\n'),
    sources: processedSources
  };
}

/**
 * Generate Google AI Overview style structured dates and summary using Gemini
 */
export async function generateExamAiOverview({ examId = null, examName, conductingBody = '', existingDiscoveries = [] }) {
  if (!examName) return null;

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  // 1. Fetch live articles from both Bing News and Google News with targeted queries
  const queries = [
    `${examName} registration last date extended till late fee`,
    `${examName} last date to apply without late fee ${currentYear} ${nextYear}`,
    `${examName} exam date schedule prelims ${currentYear} ${nextYear}`
  ];

  const searchPromises = [];
  for (const q of queries) {
    searchPromises.push(searchBingNews(q));
    searchPromises.push(searchGoogleNews(q));
  }

  const fetchedResults = await Promise.all(searchPromises);
  const allArticles = [
    ...fetchedResults.flat(),
    ...(Array.isArray(existingDiscoveries) ? existingDiscoveries : [])
  ];

  const rankedArticles = filterAndRankArticles(allArticles, examName);

  const cleanedArticles = rankedArticles.map(a => ({
    title: cleanHtml(a.title || a.source_title || ''),
    snippet: cleanHtml(a.description || a.snippet || ''),
    source: a.source || a.source_domain || 'Online Media',
    url: a.link || a.source_url || a.url || '',
    date: a.pubDate || a.pub_date || ''
  }));

  // 2. Call Gemini
  let aiData = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are Google's AI Overview date extraction engine for Indian government recruitment & entrance examinations.
Target Exam: "${examName}"
Conducting Body: "${conductingBody || 'Official Commission / Examination Authority'}"

CRAWLED REAL-TIME ANNOUNCEMENTS & MEDIA HEADLINES:
${JSON.stringify(cleanedArticles, null, 2)}

TASK:
Extract the EXACT dates and categorize them clearly with NO EXTRA UNNECESSARY FLUFF.
Follow these rules strictly:
1. EXTENDED DATES PRIORITY (CRITICAL OVERRIDE RULE):
   Carefully inspect titles and snippets for phrases like "extended till", "extended to", "deadline extended", "with late fee", "without late fee", "corrigendum".
   - If an initial or regular deadline is stated (e.g. October 5, 2026 or September 21, 2026): set "apply_last_date".
   - If an extended deadline or deadline WITH LATE FEE is stated (e.g. October 12, 2026 or September 27, 2026):
     set "extended_last_date" and set "is_extended": true.
   - "active_last_date": MUST be the final extended / late fee deadline (e.g. October 12, 2026 or September 27, 2026).
2. "prelims_exam_date": Prelims / Tier-1 / Written exam date or date range (e.g. "February 2027" or "November 21-22, 2026") or null.
3. "mains_exam_date": Mains or Tier-2 date if applicable or null.
4. "admit_card_date": Expected or confirmed admit card date/window if present or null.
5. "vacancies": Total posts if mentioned (e.g. "13,745 Posts") or null.
6. "fee_deadline": Fee payment deadline if mentioned or null.
7. "important_details": Array of 2 to 4 crisp key bullet points in format:
   - "Regular Deadline (Without Late Fee): <Date>"
   - "Extended Deadline (With Late Fee): <Date>"
   - "Prelims Exam Date: <Date>"
   - "Fee Payment Deadline: <Date>"
8. "overview_summary": Maximum 2 clear, direct sentences stating the last date to apply (clarify if extended / with late fee) and the scheduled exam dates. NO conversational filler.

Return ONLY valid JSON matching this schema:
{
  "overview_summary": "...",
  "apply_start_date": "...",
  "apply_last_date": "...",
  "extended_last_date": "...",
  "is_extended": true,
  "active_last_date": "...",
  "prelims_exam_date": "...",
  "mains_exam_date": "...",
  "admit_card_date": "...",
  "vacancies": "...",
  "fee_deadline": "...",
  "important_details": ["...", "..."],
  "source_links": [...],
  "confidence": "Tentative / Reported Online"
}
`;

    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-2.5-pro',
      'gemini-3-flash-preview',
      'gemini-flash-latest'
    ];

    for (const model of candidateModels) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });
        if (res && res.text) {
          aiData = JSON.parse(res.text);
          break;
        }
      } catch (err) {
        if (err.status === 503) {
          await new Promise(r => setTimeout(r, 600));
        }
      }
    }
  }

  // 3. Fallback to rule-based synthesis if Gemini did not return JSON
  if (!aiData || !aiData.overview_summary) {
    let bestExamDate = null;
    let bestApplyEnd = null;
    let bestVacancies = null;

    for (const a of cleanedArticles) {
      const details = extractExamDetailsFromText(a.title, a.snippet);
      if (!bestExamDate && details.expectedExamDate) bestExamDate = details.expectedExamDate;
      if (!bestApplyEnd && details.expectedApplyEnd) bestApplyEnd = details.expectedApplyEnd;
      if (!bestVacancies && details.expectedVacancies) bestVacancies = details.expectedVacancies;
    }

    const sentences = [
      `Overview for ${examName}:`,
      bestApplyEnd ? `The expected last date to apply online is around ${bestApplyEnd}.` : 'Application dates are awaited from the official commission.',
      bestExamDate ? `The examination is tentatively scheduled for ${bestExamDate} according to educational media reports.` : 'Exam schedule will be announced soon.'
    ];

    aiData = {
      overview_summary: sentences.join(' '),
      apply_start_date: null,
      apply_last_date: bestApplyEnd,
      extended_last_date: null,
      is_extended: false,
      active_last_date: bestApplyEnd,
      prelims_exam_date: bestExamDate,
      mains_exam_date: null,
      admit_card_date: 'Expected 7-10 days before exam date',
      vacancies: bestVacancies ? `${bestVacancies} Posts` : null,
      fee_deadline: null,
      important_details: [
        bestApplyEnd ? `Expected Deadline: ${bestApplyEnd}` : null,
        bestExamDate ? `Tentative Exam Date: ${bestExamDate}` : null
      ].filter(Boolean),
      source_links: cleanedArticles.slice(0, 3).map(a => ({ title: a.title, url: a.url, source: a.source })),
      confidence: 'Tentative / Reported Online'
    };
  }

  // Ensure source links are populated
  if (!aiData.source_links || aiData.source_links.length === 0) {
    aiData.source_links = cleanedArticles.slice(0, 3).map(a => ({
      title: a.title,
      url: a.url,
      source: a.source
    }));
  }

  aiData.analyzed_at = new Date().toISOString();
  aiData.exam_name = examName;

  // 4. Save to database if examId given
  if (examId) {
    try {
      db.prepare('UPDATE exams SET ai_overview = ? WHERE id = ?').run(JSON.stringify(aiData), examId);
    } catch (e) {}
  }

  return aiData;
}

