import { Building2, Landmark, Train, FileBadge, Factory, MapPin, Shield, Compass, Sparkles } from 'lucide-react';

export const EXAM_CATEGORIES = [
  { id: 'Karnataka', name: 'Karnataka (KEA/KPSC)', icon: MapPin, color: 'text-amber-500', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' },
  { id: 'Banking', name: 'Banking & Insurance', icon: Landmark, color: 'text-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' },
  { id: 'SSC', name: 'SSC', icon: Building2, color: 'text-blue-500', badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' },
  { id: 'UPSC', name: 'UPSC', icon: FileBadge, color: 'text-purple-500', badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200' },
  { id: 'Railway', name: 'Railway (RRB)', icon: Train, color: 'text-red-500', badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200' },
  { id: 'PSU', name: 'PSUs & GATE', icon: Factory, color: 'text-orange-500', badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200' },
  { id: 'Defence', name: 'Defence & Police', icon: Shield, color: 'text-yellow-600', badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200' },
  { id: 'Science', name: 'Science & Research', icon: Sparkles, color: 'text-cyan-500', badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200' },
  { id: 'Central', name: 'Other Central Govt', icon: Compass, color: 'text-indigo-500', badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200' },
];

export const APPLICATION_STATUS_FLOW = [
  'Need to Apply',
  'Applied',
  'Admit Card Downloaded',
  'Appeared',
  'Result Awaited',
  'Selected',
  'Not Selected'
];

export const APPLICATION_STATUSES = {
  'Need to Apply': { label: 'Need to Apply', color: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 font-semibold', icon: 'Clock' },
  'need_to_apply': { label: 'Need to Apply', color: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 font-semibold', icon: 'Clock' },
  'Applied': { label: 'Applied', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300', icon: 'FileText' },
  'applied': { label: 'Applied', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300', icon: 'FileText' },
  'Admit Card Downloaded': { label: 'Admit Card Ready', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300', icon: 'Ticket' },
  'admit_card': { label: 'Admit Card Ready', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300', icon: 'Ticket' },
  'Appeared': { label: 'Exam Appeared', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300', icon: 'CheckSquare' },
  'appeared': { label: 'Exam Appeared', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300', icon: 'CheckSquare' },
  'Result Awaited': { label: 'Result Awaited', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300', icon: 'Clock' },
  'result': { label: 'Result Awaited', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300', icon: 'Clock' },
  'Selected': { label: 'Selected / Qualified 🎉', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-400 font-bold', icon: 'Award' },
  'selected': { label: 'Selected / Qualified 🎉', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-400 font-bold', icon: 'Award' },
  'Not Selected': { label: 'Not Selected', color: 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-400 border-slate-300', icon: 'XCircle' },
  'not_selected': { label: 'Not Selected', color: 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-400 border-slate-300', icon: 'XCircle' }
};

export const CANDIDATE_CATEGORIES = [
  // All-India Central
  'UR',
  'EWS',
  'OBC',
  'SC',
  'ST',
  'PwBD',
  'ESM'
];

export const KARNATAKA_CATEGORIES = ['GM', '2A', '2B', '3A', '3B', 'Cat-1', 'SC', 'ST'];

export const KARNATAKA_BOARDS = [
  'KEA (Karnataka Examinations Authority)',
  'KPSC (Karnataka Public Service Commission)',
  'KSP (Karnataka State Police)',
  'KPTCL / ESCOMs (BESCOM, MESCOM, HESCOM, GESCOM, CESC)',
  'KSRTC / BMTC / NWKRTC / KKRTC',
  'Karnataka High Court & District Courts',
  'Karnataka Revenue Department (VAO/Village Accountant)',
  'Karnataka Forest Department',
  'Karnataka PWD & Irrigation Dept',
  'KPCL (Karnataka Power Corporation Ltd)'
];

export const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

export const getPublicPortalUrl = () => {
  if (typeof window === 'undefined') return 'https://sarkari-tracker-vpmt.vercel.app';
  if (import.meta.env.VITE_PUBLIC_PORTAL_URL) return import.meta.env.VITE_PUBLIC_PORTAL_URL;
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://sarkari-tracker-vpmt.vercel.app';
  }
  return 'http://localhost:3000';
};

/**
 * Universal date formatter guaranteeing date/month/year (DD/MM/YYYY) format across all views
 */
export function formatDate(val) {
  if (!val) return '';
  const str = String(val).trim();

  // Already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  // Format: YYYY-MM-DD
  const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) {
    const day = ymd[3].padStart(2, '0');
    const month = ymd[2].padStart(2, '0');
    const year = ymd[1];
    return `${day}/${month}/${year}`;
  }

  // Format: DD-MM-YYYY or DD.MM.YYYY
  const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${day}/${month}/${year}`;
  }

  // Format: 27 September 2026 or September 27, 2026
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return str;
}

/**
 * Compares an application deadline or exam date with today's date
 * Determines if application is CLOSED, CLOSING SOON, or OPEN
 */
export function getDeadlineStatus(lastDateStr) {
  if (!lastDateStr) {
    return { isClosed: false, isUrgent: false, statusLabel: 'Notice Awaited', daysLeft: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse date string (handles DD/MM/YYYY, YYYY-MM-DD, or text)
  let target = null;
  const dmy = String(lastDateStr).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    target = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  } else {
    target = new Date(lastDateStr);
  }

  if (!target || isNaN(target.getTime())) {
    return { isClosed: false, isUrgent: false, statusLabel: lastDateStr, daysLeft: null };
  }

  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const formattedDate = formatDate(lastDateStr);

  if (daysLeft < 0) {
    return {
      isClosed: true,
      isUrgent: false,
      statusLabel: `Application Closed on ${formattedDate}`,
      badgeText: '🔴 APPLICATION CLOSED',
      daysLeft: 0
    };
  } else if (daysLeft === 0) {
    return {
      isClosed: false,
      isUrgent: true,
      statusLabel: `Closing TODAY (${formattedDate})`,
      badgeText: '🚨 CLOSING TODAY',
      daysLeft: 0
    };
  } else if (daysLeft <= 3) {
    return {
      isClosed: false,
      isUrgent: true,
      statusLabel: `Closing in ${daysLeft} days (${formattedDate})`,
      badgeText: `⚠️ CLOSING IN ${daysLeft} DAYS`,
      daysLeft
    };
  } else {
    return {
      isClosed: false,
      isUrgent: false,
      statusLabel: `Open till ${formattedDate} (${daysLeft} days left)`,
      badgeText: '🟢 APPLICATIONS OPEN',
      daysLeft
    };
  }
}

export const NOTIFICATION_TYPES = {
  date_change: 'Date Change',
  admit_card: 'Admit Card Released',
  result: 'Result Declared',
  new_exam: 'New Exam Added',
  alert: 'Official Notice Published',
  general: 'General Announcement'
};
