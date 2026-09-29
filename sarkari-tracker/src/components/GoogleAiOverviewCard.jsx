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
      <div className="rounded-2xl border border-dashed border-blue-300 dark:border-blue-900/60 bg-blue-50/40 dark:bg-slate-900/40 p-5 text-center space-y-2">
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
    <div className="rounded-2xl sm:rounded-3xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 p-5 sm:p-6 shadow-sm space-y-4 relative overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 via-saffron-400/10 to-transparent rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-blue-100/80 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 tracking-tight">
                <span>AI Overview</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Tentative / Reported Online</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Live Google Search Grounding for {examTitle || 'Government Exam'}
            </p>
          </div>
        </div>

        {onRefreshAi && (
          <button
            onClick={onRefreshAi}
            disabled={isRefreshing}
            className="text-xs px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Scanning Google...' : 'Re-Check Google'}</span>
          </button>
        )}
      </div>

      {/* Prominent Application Status Banner (Closed vs Open compared with current date) */}
      {activeDeadline && (
        <div className="relative z-10">
          {isClosed ? (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                    Application Status
                  </span>
                  <strong className="text-xs sm:text-sm font-extrabold text-rose-950 dark:text-rose-100">
                    🔴 Application Closed on {formatDate(activeDeadline)}
                  </strong>
                </div>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200 rounded-full shrink-0">
                Concluded
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                    Application Status
                  </span>
                  <strong className="text-xs sm:text-sm font-extrabold text-emerald-950 dark:text-emerald-100">
                    🟢 Applications Open till {formatDate(activeDeadline)}
                  </strong>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${
                deadlineStatus.isUrgent 
                  ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 animate-pulse' 
                  : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
              }`}>
                {deadlineStatus.daysLeft !== null ? `${deadlineStatus.daysLeft}d Left` : 'Active'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* AI Overview Summary (Google Style) */}
      <div className="relative z-10 space-y-3">
        {overview.overview_summary ? (
          <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal bg-white/60 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-blue-100/60 dark:border-slate-700/60">
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
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 block">
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
                <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 shadow-xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Extended Deadline {overview.fee_deadline ? '(With Late Fee)' : ''}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200 rounded">
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
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 block">
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
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 block">
                      Fee Payment Deadline
                    </span>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatDate(overview.fee_deadline)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Prelims Exam Date */}
              {overview.prelims_exam_date && (
                <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/90 dark:border-blue-900/60 shadow-xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 block">
                      Prelims / Written Exam Date
                    </span>
                    <strong className="text-xs sm:text-sm font-extrabold text-blue-950 dark:text-blue-100">
                      {formatDate(overview.prelims_exam_date)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Mains Exam Date */}
              {overview.mains_exam_date && (
                <div className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/90 dark:border-purple-900/60 shadow-xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300 block">
                      Mains Exam Date
                    </span>
                    <strong className="text-xs font-bold text-purple-950 dark:text-purple-100">
                      {formatDate(overview.mains_exam_date)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Admit Card Release */}
              {overview.admit_card_date && (
                <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-900/60 shadow-xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block">
                      Admit Card Release
                    </span>
                    <strong className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                      {formatDate(overview.admit_card_date)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Vacancies */}
              {overview.vacancies && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 block">
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
              <div className="mt-3 p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700/70 shadow-2xs space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Important Details</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
                  {overview.important_details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0 mt-0.5">•</span>
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
          <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Sources:</span>
            {overview.source_links.map((src, idx) => (
              <a 
                key={idx}
                href={src.url || src.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
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
        <div className="relative z-10 pt-3 border-t border-blue-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            💡 Adopt these web-discovered dates into your personal tracker for instant countdowns & reminders.
          </div>

          <button
            onClick={handleAdopt}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
              adopted
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white'
            }`}
          >
            {adopted ? (
              <>
                <Check className="w-4 h-4" />
                <span>Adopted to My Tracker!</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>⚡ Use as My Target Dates</span>
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};

export default GoogleAiOverviewCard;
