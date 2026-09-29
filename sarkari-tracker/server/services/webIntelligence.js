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
 * Universal date normalizer guaranteeing date/month/year (DD/MM/YYYY) format
 */
export function toDDMMYYYY(raw) {
  if (!raw) return null;
  const clean = String(raw).trim().replace(/,/g, '');

  // Format: 28/11/2026 or 28-11-2026 or 28.11.2026
  const slashMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${day}/${month}/${year}`;
  }

  // Format: 2026-11-28
  const ymdMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const day = ymdMatch[3].padStart(2, '0');
    const month = ymdMatch[2].padStart(2, '0');
    const year = ymdMatch[1];
    return `${day}/${month}/${year}`;
  }

  // Format: 28 November 2026 or 28th Nov 2026 or November 28, 2026
  const textMatch = clean.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})$/i) ||
                    clean.match(/^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})$/i);
  if (textMatch) {
    let day, monthStr, year;
    if (isNaN(textMatch[1])) {
      monthStr = textMatch[1].toLowerCase();
      day = textMatch[2].padStart(2, '0');
      year = textMatch[3];
    } else {
      day = textMatch[1].padStart(2, '0');
      monthStr = textMatch[2].toLowerCase();
      year = textMatch[3];
    }
    const month = MONTHS[monthStr] || MONTHS[monthStr.slice(0, 3)];
    if (month) return `${day}/${month}/${year}`;
  }

  return clean;
}

/**
 * Normalizes extracted date strings into DD/MM/YYYY format
 */
function normalizeDate(raw) {
  return toDDMMYYYY(raw);
}

/**
 * Compares an application deadline with current date (2026-09-29)
 * Returns { isClosed, statusText, badgeText, daysLeft }
 */
export function checkDeadlineStatus(dateVal) {
  if (!dateVal) return { isClosed: false, statusText: 'Awaited', badgeText: 'Notice Awaited', daysLeft: null };
  const dmy = toDDMMYYYY(dateVal);
  if (!dmy) return { isClosed: false, statusText: 'Awaited', badgeText: 'Notice Awaited', daysLeft: null };

  const parts = dmy.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (parts) {
    const target = new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]));
    target.setHours(23, 59, 59, 999);
    const today = new Date();
    const diffMs = target.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return {
        isClosed: true,
        statusText: `Closed on ${dmy}`,
        badgeText: 'Application Closed',
        daysLeft
      };
    } else if (daysLeft === 0) {
      return {
        isClosed: false,
        statusText: `Closes Today (${dmy})`,
        badgeText: 'Closes Today',
        daysLeft: 0
      };
    } else {
      return {
        isClosed: false,
        statusText: `Open till ${dmy} (${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left)`,
        badgeText: `${daysLeft}d Left`,
        daysLeft
      };
    }
  }
  return { isClosed: false, statusText: dateVal, badgeText: 'Active', daysLeft: null };
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

  // Dates extraction (Exam date & last date for active/upcoming cycle 2026-2027)
  const fullDateRegex = /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+202[6-7]|\d{4}-\d{2}-\d{2}|\d{1,2}[-/.]\d{1,2}[-/.]202[6-7])\b/gi;
  const matchedDates = [...combined.matchAll(fullDateRegex)].map(m => normalizeDate(m[1]));

  let expectedExamDate = null;
  let expectedApplyEnd = null;
  let expectedApplyStart = null;

  // Contextual clues
  const hasExamDateClue = /exam\s+date|examination\s+(?:on|date|schedule)|written\s+test|prelims\s+date|cbt\s+date/i.test(combined);
  const hasDeadlineClue = /last\s+date|apply\s+online\s+till|deadline|registration\s+(?:closes|ends|last)/i.test(combined);

  if (hasDeadlineClue && matchedDates.length > 0) {
    expectedApplyEnd = matchedDates[0];
  }

  if (hasExamDateClue && matchedDates.length > 0) {
    const candidateExamDate = matchedDates[matchedDates.length - 1];
    if (candidateExamDate !== expectedApplyEnd) {
      expectedExamDate = candidateExamDate;
    }
  }

  if (combined.match(/start(?:s|ing)?|from/i) && matchedDates.length > 1) {
    expectedApplyStart = matchedDates[0];
  }

  // Fallback ONLY when there are multiple distinct dates and no exam date assigned yet
  if (!expectedExamDate && matchedDates.length > 1) {
    const latestDate = matchedDates[matchedDates.length - 1];
    if (latestDate !== expectedApplyEnd) {
      expectedExamDate = latestDate;
    }
  }

  // Strict collision check: Exam date CANNOT be the same as the application deadline!
  if (expectedExamDate && expectedApplyEnd && expectedExamDate === expectedApplyEnd) {
    expectedExamDate = null;
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
  const currentYear = new Date().getFullYear();
  const pastYear1 = currentYear - 1;
  const pastYear2 = currentYear - 2;
  const futureYear = currentYear + 1;

  const keywords = (examName || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  // Keep only relevant articles containing keywords and drop old 2024/2025 cycles
  const relevant = articles.filter(a => {
    const title = (a.title || '').toLowerCase();
    const desc = (a.description || a.snippet || '').toLowerCase();
    const text = `${title} ${desc}`;

    // Keyword match
    const matchesKeyword = keywords.length === 0 || keywords.some(k => text.includes(k));
    if (!matchesKeyword) return false;

    // Filter out old past years:
    const mentionsCurrentOrUpcoming = text.includes(String(currentYear)) || text.includes(String(futureYear));
    const mentionsOldYear = text.includes(String(pastYear1)) || text.includes(String(pastYear2));

    // If title specifically mentions old year (e.g. 2024, 2025) and not current/upcoming, drop it
    if ((title.includes(String(pastYear1)) || title.includes(String(pastYear2))) && !mentionsCurrentOrUpcoming) {
      return false;
    }

    // If text only mentions old year without any reference to current/next year
    if (mentionsOldYear && !mentionsCurrentOrUpcoming) {
      return false;
    }

    return true;
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
  const todayObj = new Date();
  const todayFormatted = `${String(todayObj.getDate()).padStart(2, '0')}/${String(todayObj.getMonth() + 1).padStart(2, '0')}/${todayObj.getFullYear()}`;

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are a fast, accurate date extraction engine for Indian government recruitment examinations.
Target Exam: "${examName}"
Conducting Body: "${conductingBody || 'Official Commission / Examination Authority'}"
TODAY'S CURRENT DATE: ${todayFormatted} (${todayObj.toDateString()})
CURRENT ACTIVE RECRUITMENT CYCLE: ${currentYear} - ${nextYear}

CRAWLED REAL-TIME ANNOUNCEMENTS & MEDIA HEADLINES:
${JSON.stringify(cleanedArticles.slice(0, 8), null, 2)}

TASK:
Extract the EXACT dates and categorize them clearly with NO EXTRA UNNECESSARY FLUFF.
Follow these rules strictly:
1. STRICT DATE FORMAT:
   ALL dates in your output MUST be in DD/MM/YYYY format (e.g. "12/10/2026", "27/09/2026").
2. REJECT OBSOLETE PAST YEARS:
   Focus ONLY on active 2026-2027 cycle. Ignore 2024/2025.
3. EXTENDED DATES PRIORITY (CRITICAL OVERRIDE RULE):
   - "apply_last_date": Regular deadline (without late fee) in DD/MM/YYYY or null.
   - "extended_last_date": Extended deadline (with or without late fee) in DD/MM/YYYY or null. Set "is_extended": true if extended.
   - "active_last_date": Final active application closing deadline in DD/MM/YYYY or null.
4. EXAM DATE vs APPLICATION DEADLINE (CRITICAL DISTINCTION):
   - "prelims_exam_date": Date when the written / prelims / computer-based examination is held in DD/MM/YYYY (or null).
   - An EXAM DATE is NEVER the application deadline! If articles only discuss application deadlines or registration dates, set "prelims_exam_date": null. NEVER set prelims_exam_date to the same date as active_last_date or apply_last_date.
5. COMPARE WITH TODAY'S DATE (${todayFormatted}):
   - If active_last_date is before ${todayFormatted}: "application_status": "closed", "is_closed": true.
   - If active_last_date is on or after ${todayFormatted}: "application_status": "open", "is_closed": false.
6. "overview_summary": Maximum 2 clear, direct sentences stating the application status and the exam date if announced.

Return ONLY valid JSON matching this schema:
{
  "overview_summary": "...",
  "application_status": "open" | "closed",
  "is_closed": true | false,
  "apply_start_date": "DD/MM/YYYY or null",
  "apply_last_date": "DD/MM/YYYY or null",
  "extended_last_date": "DD/MM/YYYY or null",
  "is_extended": true,
  "active_last_date": "DD/MM/YYYY or null",
  "prelims_exam_date": "DD/MM/YYYY or null",
  "mains_exam_date": "DD/MM/YYYY or null",
  "admit_card_date": "DD/MM/YYYY or null",
  "vacancies": "...",
  "fee_deadline": "DD/MM/YYYY or null",
  "important_details": ["...", "..."],
  "source_links": [...],
  "confidence": "Tentative / Reported Online"
}
`;

    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3-flash-preview',
      'gemini-3.8-flash'
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
      if (!bestApplyEnd && details.expectedApplyEnd) bestApplyEnd = toDDMMYYYY(details.expectedApplyEnd);
      if (!bestExamDate && details.expectedExamDate && details.expectedExamDate !== details.expectedApplyEnd) {
        bestExamDate = toDDMMYYYY(details.expectedExamDate);
      }
      if (!bestVacancies && details.expectedVacancies) bestVacancies = details.expectedVacancies;
    }

    // Safety check: Exam date can never be the same as application deadline
    if (bestExamDate && bestApplyEnd && bestExamDate === bestApplyEnd) {
      bestExamDate = null;
    }

    const status = checkDeadlineStatus(bestApplyEnd);

    const sentences = [
      `Overview for ${examName}:`,
      bestApplyEnd 
        ? (status.isClosed ? `Application closed on ${bestApplyEnd}.` : `The last date to apply online is ${bestApplyEnd} (${status.statusText}).`)
        : 'Application dates are awaited from the official commission.',
      bestExamDate ? `The examination is tentatively scheduled for ${bestExamDate} according to educational media reports.` : 'Exam schedule will be announced soon.'
    ];

    aiData = {
      overview_summary: sentences.join(' '),
      application_status: status.isClosed ? 'closed' : 'open',
      is_closed: status.isClosed,
      status_text: status.statusText,
      badge_text: status.badgeText,
      days_left: status.daysLeft,
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
        bestApplyEnd ? (status.isClosed ? `Application Status: Closed on ${bestApplyEnd}` : `Application Deadline: ${bestApplyEnd}`) : null,
        bestExamDate ? `Tentative Exam Date: ${bestExamDate}` : null
      ].filter(Boolean),
      source_links: cleanedArticles.slice(0, 3).map(a => ({ title: a.title, url: a.url, source: a.source })),
      confidence: 'Tentative / Reported Online'
    };
  }

  // 4. Post-process and normalize all dates to strict DD/MM/YYYY and compute freshness status
  if (aiData) {
    if (aiData.apply_start_date) aiData.apply_start_date = toDDMMYYYY(aiData.apply_start_date);
    if (aiData.apply_last_date) aiData.apply_last_date = toDDMMYYYY(aiData.apply_last_date);
    if (aiData.extended_last_date) aiData.extended_last_date = toDDMMYYYY(aiData.extended_last_date);
    if (aiData.active_last_date) aiData.active_last_date = toDDMMYYYY(aiData.active_last_date);
    if (aiData.fee_deadline) aiData.fee_deadline = toDDMMYYYY(aiData.fee_deadline);
    if (aiData.admit_card_date && /^\d/.test(aiData.admit_card_date)) {
      aiData.admit_card_date = toDDMMYYYY(aiData.admit_card_date);
    }
    if (aiData.prelims_exam_date && /^\d/.test(aiData.prelims_exam_date)) {
      aiData.prelims_exam_date = toDDMMYYYY(aiData.prelims_exam_date);
    }
    if (aiData.mains_exam_date && /^\d/.test(aiData.mains_exam_date)) {
      aiData.mains_exam_date = toDDMMYYYY(aiData.mains_exam_date);
    }

    const effectiveLastDate = aiData.extended_last_date || aiData.active_last_date || aiData.apply_last_date;

    // CRITICAL COLLISION GUARD: Exam date can NEVER be the same as the application deadline!
    if (aiData.prelims_exam_date && effectiveLastDate && (
      aiData.prelims_exam_date === effectiveLastDate ||
      aiData.prelims_exam_date === aiData.apply_last_date ||
      aiData.prelims_exam_date === aiData.extended_last_date ||
      aiData.prelims_exam_date === aiData.active_last_date
    )) {
      aiData.prelims_exam_date = null;
    }

    const status = checkDeadlineStatus(effectiveLastDate);
    aiData.is_closed = status.isClosed;
    aiData.application_status = status.isClosed ? 'closed' : 'open';
    aiData.status_text = status.statusText;
    aiData.badge_text = status.badgeText;
    aiData.days_left = status.daysLeft;

    if (effectiveLastDate && !aiData.active_last_date) {
      aiData.active_last_date = effectiveLastDate;
    }
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

  // 5. Save to database if examId given
  if (examId) {
    try {
      db.prepare('UPDATE exams SET ai_overview = ? WHERE id = ?').run(JSON.stringify(aiData), examId);
    } catch (e) {}
  }

  return aiData;
}

