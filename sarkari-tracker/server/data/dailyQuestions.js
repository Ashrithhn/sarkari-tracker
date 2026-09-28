/**
 * Daily Question Set for Official Exam Monitoring
 * Answers are queried via Gemini with Google Search grounding once a day
 * ONLY for exams that active users have applied for or followed.
 */

export const OFFICIAL_DOMAINS = [
  'upsc.gov.in',
  'upsconline.nic.in',
  'ssc.gov.in',
  'ssc.nic.in',
  'ibps.in',
  'rrbcdg.gov.in',
  'indianrailways.gov.in',
  'kea.kar.nic.in',
  'cetonline.karnataka.gov.in',
  'kpsc.kar.nic.in',
  'ksp-recruitment.in',
  'ksp.karnataka.gov.in',
  'sbi.co.in',
  'rbi.org.in',
  'nta.ac.in',
  'gov.in',
  'nic.in',
  'ac.in',
  'org.in'
];

export const DAILY_QUESTIONS = {
  notification_released: {
    key: 'notification_released',
    question: 'Has the official notification/advertisement been released? Give release date and official portal link.',
    notifyCondition: 'Changes from No to Yes',
    isUrgent: false,
    formatMessage: (examName, a) => `${examName}: Official notification released! Application details now live.`
  },
  apply_start: {
    key: 'apply_start',
    question: 'When does online application start? Give application opening date.',
    notifyCondition: 'Date appears or changes',
    isUrgent: false,
    formatMessage: (examName, a) => `${examName}: Online registration begins on ${a.date || a.value || 'scheduled date'}.`
  },
  last_date: {
    key: 'last_date',
    question: 'What is the last date to apply online? Give deadline date.',
    notifyCondition: 'Date changes',
    isUrgent: false,
    formatMessage: (examName, a) => `${examName}: Application last date confirmed as ${a.date || a.value}.`
  },
  last_date_extended: {
    key: 'last_date_extended',
    question: 'Was the last date to apply extended? State whether extended and give the new extended date.',
    notifyCondition: 'Becomes true',
    isUrgent: true,
    formatMessage: (examName, a) => `🚨 ${examName}: Last date extended to ${a.date || a.value}! Check official portal.`
  },
  fee_last_date: {
    key: 'fee_last_date',
    question: 'What is the last date for fee payment?',
    notifyCondition: 'Date changes',
    isUrgent: false,
    formatMessage: (examName, a) => `${examName}: Fee payment deadline is ${a.date || a.value}.`
  },
  correction_window: {
    key: 'correction_window',
    question: 'Is the application edit/correction window open? Dates?',
    notifyCondition: 'Opens or changes',
    isUrgent: false,
    formatMessage: (examName, a) => `${examName}: Application correction/edit window open${a.date ? ` until ${a.date}` : ''}.`
  },
  corrigendum: {
    key: 'corrigendum',
    question: 'Has any corrigendum, addendum or revised notice been issued? Title, date, link.',
    notifyCondition: 'New one found',
    isUrgent: true,
    formatMessage: (examName, a) => `📢 ${examName}: Official Corrigendum/Addendum notice published: ${a.quote || a.details || 'Check details'}.`
  },
  vacancy_change: {
    key: 'vacancy_change',
    question: 'Has the number of vacancies increased or decreased? Old and new count.',
    notifyCondition: 'Count changes',
    isUrgent: true,
    formatMessage: (examName, a) => `📊 ${examName}: Total vacancies revised to ${a.value || a.details}.`
  },
  eligibility_change: {
    key: 'eligibility_change',
    question: 'Any change in age limit, qualification, or reservation/relaxation criteria?',
    notifyCondition: 'Any change',
    isUrgent: false,
    formatMessage: (examName, a) => `⚠️ ${examName}: Eligibility / criteria update notice issued: ${a.quote || a.details}.`
  },
  exam_date: {
    key: 'exam_date',
    question: 'What are the examination dates for each stage (prelims, mains)?',
    notifyCondition: 'Date announced or changes',
    isUrgent: true,
    formatMessage: (examName, a) => `🗓️ ${examName}: Examination date confirmed for ${a.date || a.value}.`
  },
  postponed_rescheduled: {
    key: 'postponed_rescheduled',
    question: 'Has the exam been postponed, rescheduled, or cancelled? New date?',
    notifyCondition: 'Becomes true',
    isUrgent: true,
    formatMessage: (examName, a) => `🚨 URGENT: ${examName} has been postponed/rescheduled! New date: ${a.date || a.value || 'To be notified'}.`
  },
  exam_city_slip: {
    key: 'exam_city_slip',
    question: 'Has the exam city intimation slip or advance city allotment been released?',
    notifyCondition: 'Becomes true',
    isUrgent: false,
    formatMessage: (examName, a) => `📍 ${examName}: Exam city intimation slip is now available for download.`
  },
  admit_card: {
    key: 'admit_card',
    question: 'Has the admit card / hall ticket been released? Direct link.',
    notifyCondition: 'Becomes true',
    isUrgent: true,
    formatMessage: (examName, a) => `🎫 ${examName}: Admit Card / Hall Ticket released! Download on official portal.`
  },
  answer_key: {
    key: 'answer_key',
    question: 'Is the provisional answer key out? Objection window dates?',
    notifyCondition: 'Becomes true',
    isUrgent: false,
    formatMessage: (examName, a) => `📝 ${examName}: Provisional Answer Key & Objection portal released.`
  },
  result: {
    key: 'result',
    question: 'Has the written exam/prelims result been declared? Link.',
    notifyCondition: 'Becomes true',
    isUrgent: true,
    formatMessage: (examName, a) => `🏆 ${examName}: Results declared! Scorecard & merit lists published.`
  },
  cutoff: {
    key: 'cutoff',
    question: 'Has the cutoff / marks list been published? Category-wise marks.',
    notifyCondition: 'Becomes true',
    isUrgent: false,
    formatMessage: (examName, a) => `📈 ${examName}: Official qualifying cutoff marks released.`
  },
  final_result: {
    key: 'final_result',
    question: 'Has the final selection list or rank merit list been published?',
    notifyCondition: 'Becomes true',
    isUrgent: true,
    formatMessage: (examName, a) => `🎉 ${examName}: Final selection merit list published!`
  },
  other_notice: {
    key: 'other_notice',
    question: 'Any other important official commission notice in the last 7 days?',
    notifyCondition: 'New one found',
    isUrgent: false,
    formatMessage: (examName, a) => `📌 ${examName}: New commission update notice published.`
  }
};

// Karnataka State (KEA / KPSC) specific questions
export const KARNATAKA_QUESTIONS = {
  document_verification_schedule: {
    key: 'document_verification_schedule',
    question: 'Has the document verification (DV) schedule or eligible candidate list been released?',
    notifyCondition: 'Becomes true',
    isUrgent: true,
    formatMessage: (examName, a) => `📜 ${examName}: Document verification (DV) schedule released.`
  },
  hyderabad_karnataka_quota_change: {
    key: 'hyderabad_karnataka_quota_change',
    question: 'Has any notice regarding Article 371(J) / Kalyana Karnataka reservation eligibility or quota been issued?',
    notifyCondition: 'Any change',
    isUrgent: false,
    formatMessage: (examName, a) => `🏛️ ${examName}: Kalyana Karnataka (Article 371J) quota notice published.`
  },
  provisional_selection_list: {
    key: 'provisional_selection_list',
    question: 'Has the provisional 1:1 or 1:2 selection / verification list been published?',
    notifyCondition: 'Becomes true',
    isUrgent: true,
    formatMessage: (examName, a) => `📋 ${examName}: Provisional selection / verification list published.`
  }
};

/**
 * Check if a source URL belongs to an official government / commission domain
 */
export function isOfficialDomain(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return OFFICIAL_DOMAINS.some(d => host === d || host.endsWith('.' + d));
  } catch (e) {
    return false;
  }
}
