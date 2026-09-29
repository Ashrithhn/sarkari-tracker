import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, Calendar, CheckCircle, Clock, ExternalLink, 
  Trash2, Edit, CheckSquare, Square, ChevronRight, FileCheck, 
  AlertCircle, ShieldCheck, UserCheck, Sparkles, Globe, FolderArchive,
  ArrowRight 
} from 'lucide-react';
import { APPLICATION_STATUSES, formatDate } from '../utils/constants';
import CategoryBadge from './CategoryBadge';
import DeadlineTimer from './DeadlineTimer';

const JobCard = ({ 
  application, 
  job, 
  onStatusChange, 
  onOpenChecklist, 
  onOpenResources,
  onEdit, 
  onDelete,
  onOpenAnalysis,
  onAnalyzeJob,
  onOpenIntelligence,
  isAnalyzing = false
}) => {
  const app = application || job;
  if (!app) return null;

  const examDetails = app.examDetails || app.exam || {};
  const isCustomJob = !app.exam_id && !!app.custom_exam_name;
  
  const examName = isCustomJob 
    ? app.custom_exam_name 
    : (examDetails.short_name || examDetails.name || app.name || 'Government Exam');
  
  const postName = app.post_name || '';
  const conductingBody = isCustomJob 
    ? (app.custom_conducting_body || 'Direct Recruitment') 
    : (examDetails.conducting_body || app.conducting_body || 'Commission Portal');

  const category = app.category || examDetails.category || 'General';
  const statusKey = app.status || 'applied';
  const statusObj = APPLICATION_STATUSES[statusKey] || { label: statusKey, badgeClass: 'bg-blue-100 text-blue-800' };

  // Date hierarchy: candidate's user date wins, otherwise fallback to admin date
  const effectiveLastDate = app.effectiveLastDate || app.user_last_date || examDetails.apply_end || null;
  const effectiveExamDate = app.effectiveExamDate || app.user_exam_date || examDetails.exam_date || null;
  const effectiveAdmitCardDate = app.effectiveAdmitCardDate || app.user_admit_card_date || examDetails.admit_card_date || null;
  
  // Decide next important date to display
  let nextDate = null;
  let nextDateLabel = '';
  const now = new Date();
  const isNeedToApply = statusKey === 'Need to Apply' || statusKey === 'need_to_apply';

  if (effectiveLastDate && new Date(effectiveLastDate) >= now && (statusKey === 'applied' || statusKey === 'Applied' || isNeedToApply)) {
    nextDate = effectiveLastDate;
    nextDateLabel = isNeedToApply ? 'Last Date to Apply (Action Needed)' : 'Apply Last Date';
  } else if (effectiveAdmitCardDate && new Date(effectiveAdmitCardDate) >= now && statusKey !== 'appeared') {
    nextDate = effectiveAdmitCardDate;
    nextDateLabel = 'Admit Card Expected';
  } else if (effectiveExamDate && new Date(effectiveExamDate) >= now) {
    nextDate = effectiveExamDate;
    nextDateLabel = 'Examination Date';
  } else if (effectiveExamDate) {
    nextDate = effectiveExamDate;
    nextDateLabel = 'Exam Date';
  }

  const isUserSpecificDate = !!(app.user_last_date || app.user_exam_date);
  const checklistItems = app.checklist || [];
  const completedChecklistCount = checklistItems.filter(item => item.is_completed).length;
  const totalChecklistCount = checklistItems.length;

  // Next status in flow
  const statusFlow = [
    { key: 'Need to Apply', next: 'Applied', label: 'Mark as Applied ✓' },
    { key: 'need_to_apply', next: 'applied', label: 'Mark as Applied ✓' },
    { key: 'applied', next: 'admit_card', label: 'Mark Admit Card' },
    { key: 'Applied', next: 'Admit Card Downloaded', label: 'Mark Admit Card Ready' },
    { key: 'Admit Card Downloaded', next: 'Appeared', label: 'Mark Appeared' },
    { key: 'admit_card', next: 'appeared', label: 'Mark Appeared' },
    { key: 'appeared', next: 'result', label: 'Result Declared' },
    { key: 'Appeared', next: 'Result Awaited', label: 'Result Awaited' },
    { key: 'Result Awaited', next: 'Selected', label: 'Selected! 🎉' },
    { key: 'result', next: 'selected', label: 'Selected! 🎉' }
  ];
  const nextStep = statusFlow.find(s => s.key === statusKey);

  const officialPortal = app.official_portal_link || examDetails.official_site || examDetails.careers_url;

  return (
    <div className="p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-slate-200/80 dark:border-neutral-800 flex flex-col justify-between transition-all bg-white dark:bg-[#121212] shadow-2xs hover:shadow-md relative">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <CategoryBadge category={category} />
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusObj.badgeClass || 'bg-slate-100 text-slate-800 dark:bg-[#1e1e1e] dark:text-neutral-200'}`}>
              {statusObj.label}
            </span>
            {app.ai_overview && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-[#1c1c1c] dark:text-violet-300 flex items-center gap-1 border border-violet-200/60 dark:border-neutral-700">
                <Sparkles className="w-3 h-3 text-violet-600 dark:text-violet-400" /> AI Synced
              </span>
            )}
            {isCustomJob ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-[#1c1c1c] dark:text-purple-300 border border-purple-200/60 dark:border-neutral-700">
                Custom Job
              </span>
            ) : examDetails.data_status === 'verified' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-[#1c1c1c] dark:text-emerald-400 border border-emerald-200/60 dark:border-neutral-700 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-[#1c1c1c] dark:text-neutral-400 border border-slate-200/60 dark:border-neutral-700">
                Notice Awaited
              </span>
            )}
          </div>

          {app.fee_paid ? (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-[#181818] border border-emerald-200/60 dark:border-neutral-800 px-2 py-0.5 rounded-full">
              ✓ Fee Paid
            </span>
          ) : (
            <span className="text-[10px] font-medium text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-[#181818] border border-slate-200/60 dark:border-neutral-800 px-2 py-0.5 rounded-full">
              Fee Pending
            </span>
          )}
        </div>

        {/* Exam Title & Post */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-1" style={{ fontFamily: 'Sora, sans-serif' }}>
          {examName}
        </h3>
        {postName && (
          <p className="text-xs font-semibold text-saffron-600 dark:text-saffron-400 mb-1">
            Post: {postName}
          </p>
        )}

        {/* Conducting Body */}
        <div className="flex items-center text-xs text-slate-500 dark:text-neutral-400 gap-1.5 mb-3">
          <Building2 className="w-3.5 h-3.5 text-saffron-500 shrink-0" />
          <span className="truncate">{conductingBody}</span>
          {officialPortal && (
            <a 
              href={officialPortal} 
              target="_blank" 
              rel="noreferrer" 
              className="text-saffron-600 dark:text-saffron-400 hover:underline inline-flex items-center ml-1"
              title="Open Official Commission Portal"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Registration / Roll Number if available */}
        {(app.registration_number || app.roll_number) && (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#161616] border border-slate-100 dark:border-neutral-800 text-[11px] space-y-0.5 mb-3">
            {app.registration_number && (
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-neutral-500">Reg No:</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-neutral-200">{app.registration_number}</span>
              </div>
            )}
            {app.roll_number && (
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-neutral-500">Roll No:</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-neutral-200">{app.roll_number}</span>
              </div>
            )}
          </div>
        )}

        {/* Important Date Countdown */}
        {nextDate ? (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500 dark:text-neutral-400 font-medium">
                {nextDateLabel}
              </span>
              {examDetails.data_status === 'verified' && !isUserSpecificDate ? (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-[#181818] px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-neutral-800 flex items-center gap-1">
                  🟢 Confirmed Official
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-[#181818] px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-neutral-800 flex items-center gap-1">
                  🟡 Expected
                </span>
              )}
            </div>
            <DeadlineTimer targetDate={nextDate} size="small" />
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#161616] border border-slate-100 dark:border-neutral-800 text-xs text-slate-500 dark:text-neutral-400 mb-3 text-center">
            Official dates notice awaited (Will be updated soon)
          </div>
        )}

        {/* Single Notable Action / Link (Keep details inside as requested) */}
        {app.exam_id ? (
          <Link
            to={`/exams/${app.exam_id}`}
            className="w-full py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#181818] dark:hover:bg-[#202020] border border-slate-200/80 dark:border-neutral-800 text-xs font-bold text-slate-800 dark:text-neutral-200 transition-all flex items-center justify-between mb-3 shadow-2xs group"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-saffron-500 shrink-0" />
              <span className="truncate">View Syllabus, Resources & Updates</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onOpenResources && onOpenResources(app)}
            className="w-full py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#181818] dark:hover:bg-[#202020] border border-slate-200/80 dark:border-neutral-800 text-xs font-bold text-slate-800 dark:text-neutral-200 transition-all flex items-center justify-between mb-3 shadow-2xs group"
          >
            <span className="flex items-center gap-2">
              <FolderArchive className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>My Uploaded Documents</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        )}
      </div>

      {/* Bottom Actions & Status Flow */}
      <div className="pt-3 border-t border-slate-100 dark:border-neutral-800 space-y-2.5">
        {/* One-Tap Status Progression */}
        {nextStep && (
          <button
            onClick={() => onStatusChange && onStatusChange(app.id, nextStep.next)}
            className="w-full py-2.5 px-4 rounded-full bg-neutral-950 hover:bg-neutral-900 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
          >
            <span>{nextStep.label}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{app.applied_date ? formatDate(app.applied_date) : 'Applied'}</span>
          </div>

          <div className="flex items-center gap-1">
            {app.exam_id && (
              <Link
                to={`/exams/${app.exam_id}`}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors"
                title="View Full Exam Syllabus, Cutoffs & PYQs"
              >
                <CheckCircle className="w-4 h-4" />
              </Link>
            )}

            {onEdit && (
              <button
                onClick={() => onEdit(app)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400 hover:text-saffron-600 dark:hover:text-saffron-400 rounded-lg transition-colors"
                title="Edit Personal Dates & Notes"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(app.id)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 text-rose-500 rounded-lg transition-colors"
                title="Delete Application"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
