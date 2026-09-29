import React, { useState } from 'react';
import { 
  Sparkles, Calendar, Clock, Award, Users, ExternalLink, 
  RefreshCw, CheckCircle2, ArrowRight, ShieldAlert, Zap, 
  HelpCircle, ChevronRight, Check
} from 'lucide-react';
import { formatDate, getDeadlineStatus } from '../utils/constants';

const GoogleAiOverviewCard = ({ 
  aiOverview, 
  examTitle,
  onAdoptDates,
  onRefreshAi,
  isRefreshing = false,
  showAdoptButton = true
}) => {
  const [adopted, setAdopted] = useState(false);

  if (!aiOverview && !isRefreshing) {
    if (!onRefreshAi) return null;
    return (
      <div className="rounded-2xl border border-dashed border-blue-300 dark:border-blue-900/60 bg-blue-50/40 dark:bg-[#121212] p-5 text-center space-y-2">
        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Google AI Overview Not Generated Yet
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm mx-auto">
            Synthesize real-time Google search results, circulars, and tentative exam dates into a structured overview.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefreshAi}
          className="btn-primary text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5 cursor-pointer mt-1"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>✨ Generate Google AI Overview</span>
        </button>
      </div>
    );
  }

  const overview = aiOverview || {};
  const hasDates = overview.apply_last_date || overview.prelims_exam_date || overview.mains_exam_date || overview.apply_start_date;
  const activeDeadline = overview.extended_last_date || overview.active_last_date || overview.apply_last_date;
  const deadlineStatus = getDeadlineStatus(activeDeadline);
  const isClosed = overview.is_closed ?? deadlineStatus.isClosed;

  const handleAdopt = () => {
    if (onAdoptDates) {
      onAdoptDates({
        last_date: formatDate(overview.extended_last_date || overview.active_last_date || overview.apply_last_date) || null,
        exam_date: formatDate(overview.prelims_exam_date || overview.mains_exam_date) || null,
        admit_card_date: formatDate(overview.admit_card_date) || null
      });
      setAdopted(true);
      setTimeout(() => setAdopted(false), 3000);
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5 sm:p-6 shadow-2xs space-y-4 relative overflow-hidden">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-slate-100 dark:border-neutral-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                <span>AI Overview</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-[#1c1912] dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Verified Online Grounding</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              Live Google Search Grounding for {examTitle || 'Government Exam'}
            </p>
          </div>
        </div>

        {onRefreshAi && (
          <button
            onClick={onRefreshAi}
            disabled={isRefreshing}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#1a1a1a] dark:hover:bg-[#222222] border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 dark:text-neutral-300 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Scanning Google...' : 'Re-Check Google'}</span>
          </button>
        )}
      </div>

      {/* Prominent Application Status Banner */}
      {activeDeadline && (
        <div className="relative z-10">
          {isClosed ? (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                    Application Status
                  </span>
                  <strong className="text-xs sm:text-sm font-extrabold text-rose-950 dark:text-rose-100">
                    Application Closed on {formatDate(activeDeadline)}
                  </strong>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-rose-100 text-rose-900 dark:bg-rose-900/80 dark:text-rose-200 rounded-full shrink-0">
                Concluded
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                    Application Status
                  </span>
                  <strong className="text-xs sm:text-sm font-extrabold text-emerald-950 dark:text-emerald-100">
                    Applications Open till {formatDate(activeDeadline)}
                  </strong>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                deadlineStatus.isUrgent 
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200 animate-pulse' 
                  : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-200'
              }`}>
                {deadlineStatus.daysLeft !== null ? `${deadlineStatus.daysLeft}d Left` : 'Active'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* AI Overview Summary */}
      <div className="relative z-10 space-y-3">
        {overview.overview_summary ? (
          <div className="text-xs sm:text-sm text-slate-700 dark:text-neutral-200 leading-relaxed font-normal bg-slate-50 dark:bg-[#161616] p-4 rounded-2xl border border-slate-200/80 dark:border-neutral-800">
            {overview.overview_summary}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Scanning latest official recruitment announcements and education media circulars...
          </p>
        )}

        {/* Schedule Overview Key Dates */}
        {hasDates && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Overview of Important Exam Dates (DD/MM/YYYY)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              
              {/* Application Start */}
              {overview.apply_start_date && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#161616] border border-slate-200/80 dark:border-neutral-800 shadow-2xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-[#222222] text-slate-700 dark:text-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 block">
                      Application Start Date
                    </span>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatDate(overview.apply_start_date)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Extended Deadline (Highlighted if active) */}
              {(overview.extended_last_date || (overview.is_extended && (overview.active_last_date || overview.apply_last_date))) && (
                <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-[#1c1912] border border-amber-300 dark:border-amber-800/60 shadow-2xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Extended Deadline {overview.fee_deadline ? '(With Late Fee)' : ''}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200 rounded-full">
                        Active
                      </span>
                    </div>
                    <strong className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100">
                      {formatDate(overview.extended_last_date || overview.active_last_date || overview.apply_last_date)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Regular Application Last Date (Without Late Fee) */}
              {overview.apply_last_date && (!overview.is_extended || (overview.extended_last_date && overview.extended_last_date !== overview.apply_last_date)) && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#161616] border border-slate-200/80 dark:border-neutral-800 shadow-2xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-[#222222] text-slate-700 dark:text-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 block">
                      {overview.is_extended ? 'Regular Last Date (Without Late Fee)' : 'Last Date to Apply'}
                    </span>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatDate(overview.apply_last_date)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Fee Payment Deadline */}
              {overview.fee_deadline && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#161616] border border-slate-200/80 dark:border-neutral-800 shadow-2xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 block">
                      Fee Payment Deadline
                    </span>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatDate(overview.fee_deadline)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Prelims Exam Date */}
              {overview.prelims_exam_date && 
               overview.prelims_exam_date !== activeDeadline && 
               formatDate(overview.prelims_exam_date) !== formatDate(activeDeadline) && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#161616] border border-slate-200/80 dark:border-neutral-800 shadow-2xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-neutral-400 block">
                      Prelims / Written Exam Date
                    </span>
                    <strong className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatDate(overview.prelims_exam_date)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Mains Exam Date */}
              {overview.mains_exam_date && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#161616] border border-slate-200/80 dark:border-neutral-800 shadow-2xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-neutral-400 block">
                      Mains Exam Date
                    </span>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatDate(overview.mains_exam_date)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Admit Card Release */}
              {overview.admit_card_date && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#161616] border border-slate-200/80 dark:border-neutral-800 shadow-2xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-neutral-400 block">
                      Admit Card Release
                    </span>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatDate(overview.admit_card_date)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Vacancies */}
              {overview.vacancies && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#161616] border border-slate-200/80 dark:border-neutral-800 shadow-2xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-[#222222] text-slate-700 dark:text-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 block">
                      Total Vacancies
                    </span>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white">
                      {overview.vacancies}
                    </strong>
                  </div>
                </div>
              )}

            </div>

            {/* Google AI Overview Style Important Details List */}
            {overview.important_details && overview.important_details.length > 0 && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#161616] border border-slate-200/80 dark:border-neutral-800 shadow-2xs space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Important Details</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-neutral-200 font-medium">
                  {overview.important_details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Source References */}
        {overview.source_links && overview.source_links.length > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-neutral-400">
            <span>Sources:</span>
            {overview.source_links.map((src, idx) => (
              <a 
                key={idx}
                href={src.url || src.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#1a1a1a] border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 text-slate-700 dark:text-neutral-300 transition-colors shadow-2xs"
              >
                <span className="truncate max-w-[140px]">{src.source || src.title}</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            ))}
          </div>
        )}

      </div>

      {/* Action Footer: 1-Click Adopt Target Dates */}
      {showAdoptButton && hasDates && onAdoptDates && (
        <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400">
            💡 Adopt these web-discovered dates into your personal tracker for instant countdowns & reminders.
          </div>

          <button
            onClick={handleAdopt}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
              adopted
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-950 hover:bg-neutral-900 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black'
            }`}
          >
            {adopted ? (
              <>
                <Check className="w-4 h-4" />
                <span>Adopted to My Tracker!</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Use as My Target Dates</span>
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};

export default GoogleAiOverviewCard;
