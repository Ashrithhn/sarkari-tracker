import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, Calendar, CheckCircle, Clock, ExternalLink, 
  Trash2, Edit, CheckSquare, Square, ChevronRight, FileCheck, 
  AlertCircle, ShieldCheck, UserCheck, Sparkles, Globe, FolderArchive 
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

  if (effectiveLastDate && new Date(effectiveLastDate) >= now && statusKey === 'applied') {
    nextDate = effectiveLastDate;
    nextDateLabel = 'Apply Last Date';
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
    { key: 'applied', next: 'admit_card', label: 'Mark Admit Card' },
    { key: 'admit_card', next: 'appeared', label: 'Mark Appeared' },
    { key: 'appeared', next: 'result', label: 'Result Declared' },
    { key: 'result', next: 'selected', label: 'Selected! 🎉' }
  ];
  const nextStep = statusFlow.find(s => s.key === statusKey);

  const officialPortal = app.official_portal_link || examDetails.official_site || examDetails.careers_url;

  return (
    <div className="p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all bg-white dark:bg-[#121c2d] shadow-2xs hover:shadow-md relative">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <CategoryBadge category={category} />
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusObj.badgeClass || 'bg-slate-100 text-slate-800'}`}>
              {statusObj.label}
            </span>
            {app.ai_overview && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 flex items-center gap-1 border border-violet-200 dark:border-violet-800">
                <Sparkles className="w-3 h-3 text-violet-600 dark:text-violet-400" /> AI Synced
              </span>
            )}
            {isCustomJob ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                Custom Job
              </span>
            ) : examDetails.data_status === 'verified' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                Notice Awaited
              </span>
            )}
          </div>

          {app.fee_paid ? (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
              ✓ Fee Paid
            </span>
          ) : (
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
              Fee Pending
            </span>
          )}
        </div>

        {/* Exam Title & Post */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
          {examName}
        </h3>
        {postName && (
          <p className="text-xs font-semibold text-saffron-600 dark:text-saffron-400 mb-1">
            Post: {postName}
          </p>
        )}

        {/* Conducting Body */}
        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1.5 mb-3">
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
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] space-y-0.5 mb-3">
            {app.registration_number && (
              <div className="flex justify-between">
                <span className="text-slate-400">Reg No:</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{app.registration_number}</span>
              </div>
            )}
            {app.roll_number && (
              <div className="flex justify-between">
                <span className="text-slate-400">Roll No:</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{app.roll_number}</span>
              </div>
            )}
          </div>
        )}

        {/* Important Date Countdown */}
        {nextDate ? (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500 font-medium">
                {nextDateLabel}
              </span>
              {examDetails.data_status === 'verified' && !isUserSpecificDate ? (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  🟢 Confirmed Official
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                  🟡 Expected (Google/Target)
                </span>
              )}
            </div>
            <DeadlineTimer targetDate={nextDate} size="small" />
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400 mb-3 text-center">
            Official dates notice awaited (Will be updated soon)
          </div>
        )}

        {/* Gemini AI Overview summary snippet if available */}
        {app.ai_overview?.overview_summary && (
          <div className="p-2.5 rounded-xl bg-violet-50/80 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-900/40 text-[11px] text-violet-950 dark:text-violet-200 mb-3 flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2"><strong className="font-semibold text-violet-800 dark:text-violet-300">Live AI Update:</strong> {app.ai_overview.overview_summary}</span>
          </div>
        )}

        {/* Candidate Google / News Notes if provided */}
        {app.notes && (
          <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 mb-3 flex items-start gap-1.5">
            <span className="text-xs">📝</span>
            <span className="line-clamp-2"><strong className="font-semibold">Candidate Note:</strong> {app.notes}</span>
          </div>
        )}

        {/* Candidate Personal Exam Resources (Notification, Syllabus, Admit Card, Application Slip, Fee Receipt) */}
        <button
          type="button"
          onClick={() => onOpenResources && onOpenResources(app)}
          className="w-full p-2.5 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/60 dark:hover:to-indigo-900/60 transition-all border border-blue-200/80 dark:border-blue-800/80 text-xs flex items-center justify-between mb-3 text-blue-950 dark:text-blue-200 shadow-xs group"
        >
          <span className="flex items-center gap-1.5 font-bold">
            <FolderArchive className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            <span>My Exam Resources</span>
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            [app.notification_file, app.syllabus_file, app.admit_card_file, app.application_form_file, app.fee_receipt_file].filter(Boolean).length > 0 
              ? 'bg-blue-200/90 dark:bg-blue-800/90 text-blue-900 dark:text-blue-100' 
              : 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300'
          }`}>
            {[app.notification_file, app.syllabus_file, app.admit_card_file, app.application_form_file, app.fee_receipt_file].filter(Boolean).length > 0 
              ? `${[app.notification_file, app.syllabus_file, app.admit_card_file, app.application_form_file, app.fee_receipt_file].filter(Boolean).length}/5 Docs Saved →` 
              : '+ Upload Docs →'}
          </span>
        </button>

        {/* Document Checklist Quick Bar */}
        {totalChecklistCount > 0 && (
          <button
            onClick={() => onOpenChecklist && onOpenChecklist(app)}
            className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-700/60 text-xs flex items-center justify-between mb-3 text-slate-700 dark:text-slate-300"
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <FileCheck className="w-3.5 h-3.5 text-saffron-500" /> Document Checklist
            </span>
            <span className={`font-bold ${completedChecklistCount === totalChecklistCount ? 'text-emerald-600' : 'text-slate-500'}`}>
              {completedChecklistCount}/{totalChecklistCount} Done
            </span>
          </button>
        )}

        {/* Daily 21-Question Intelligence Monitor */}
        <button
          type="button"
          onClick={() => onOpenIntelligence && onOpenIntelligence(app)}
          className="w-full p-2.5 rounded-xl bg-gradient-to-r from-saffron-50 to-amber-50 dark:from-saffron-950/40 dark:to-amber-950/40 hover:from-saffron-100 hover:to-amber-100 dark:hover:from-saffron-900/60 dark:hover:to-amber-900/60 transition-all border border-saffron-200/80 dark:border-saffron-800/80 text-xs flex items-center justify-between mb-3 text-saffron-950 dark:text-saffron-200 shadow-xs group"
        >
          <span className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-saffron-600 dark:text-saffron-400 group-hover:rotate-12 transition-transform" />
            <span>AI Gazette & Date Monitor</span>
          </span>
          <span className="text-[10px] bg-saffron-200/80 dark:bg-saffron-800/80 text-saffron-900 dark:text-saffron-100 px-2 py-0.5 rounded-full font-bold">
            Daily Questions →
          </span>
        </button>

        {/* Real-time AI Overview & Keyword Intelligence */}
        {(app.ai_overview || app.web_analysis) ? (
          <button
            type="button"
            onClick={() => onOpenAnalysis && onOpenAnalysis(app)}
            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/60 dark:hover:to-indigo-900/60 transition-all border border-purple-200/80 dark:border-purple-800/80 text-xs flex items-center justify-between mb-3 text-purple-900 dark:text-purple-200 shadow-xs group"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 group-hover:rotate-12 transition-transform" />
              <span>Real-Time AI Overview</span>
            </span>
            <span className="text-[10px] bg-purple-200/80 dark:bg-purple-800/80 text-purple-800 dark:text-purple-100 px-2 py-0.5 rounded-full font-bold">
              Live Dates & Details →
            </span>
          </button>
        ) : isCustomJob ? (
          <button
            type="button"
            onClick={() => onAnalyzeJob && onAnalyzeJob(app.id)}
            disabled={isAnalyzing}
            className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-dashed border-slate-300 dark:border-slate-700 text-xs flex items-center justify-center gap-1.5 mb-3 text-slate-600 dark:text-slate-300 font-semibold"
          >
            <Globe className={`w-3.5 h-3.5 text-saffron-500 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Scanning Web...' : 'Auto-Search Web for Keywords'}</span>
          </button>
        ) : null}
      </div>

      {/* Bottom Actions & Status Flow */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
        {/* One-Tap Status Progression */}
        {nextStep && (
          <button
            onClick={() => onStatusChange && onStatusChange(app.id, nextStep.next)}
            className="w-full py-2 px-3 rounded-xl bg-navy-900 hover:bg-navy-800 dark:bg-saffron-500 dark:hover:bg-saffron-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>{nextStep.label}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{app.applied_date ? formatDate(app.applied_date) : 'Applied'}</span>
          </div>

          <div className="flex items-center gap-1">
            {app.exam_id && (
              <Link
                to={`/exams/${app.exam_id}`}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-navy-600 dark:text-navy-400 rounded-lg transition-colors"
                title="View Full Exam Syllabus, Cutoffs & PYQs"
              >
                <CheckCircle className="w-4 h-4" />
              </Link>
            )}

            {onEdit && (
              <button
                onClick={() => onEdit(app)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-saffron-600 dark:text-saffron-400 rounded-lg transition-colors"
                title="Edit Personal Dates & Notes"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(app.id)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 rounded-lg transition-colors"
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
