import React, { useState } from 'react';
import { 
  Sparkles, Calendar, Clock, Award, Users, ExternalLink, 
  RefreshCw, CheckCircle2, ArrowRight, ShieldAlert, Zap, 
  HelpCircle, ChevronRight, Check
} from 'lucide-react';
import { formatDate, getDeadlineStatus } from '../utils/constants';

const OFFICIAL_DOMAINS = [
  'gov.in', 'nic.in', 'ibps.in', 'nta.ac.in', 'sbi.co.in', 'rbi.org.in',
  'karnataka.gov.in', 'upsc.gov.in', 'ssc.gov.in', 'rrbcdg.gov.in', 'kea.kar.nic.in', 'kpsc.kar.nic.in'
];

export const detectOfficialDomain = (overview) => {
  if (overview?.official_source_domain) return overview.official_source_domain;
  const links = overview?.source_links || [];
  for (const s of links) {
    const u = typeof s === 'string' ? s : s?.url;
    if (!u) continue;
    try {
      const host = new URL(u).hostname.toLowerCase().replace(/^www\./, '');
      if (OFFICIAL_DOMAINS.some(d => host === d || host.endsWith('.' + d))) {
        return host;
      }
    } catch (e) {}
  }
  return null;
};

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
      <div className="rounded-2xl border border-white/[0.08] bg-[#14171D] p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00E599] to-[#7C5CFF] text-[#0B0D10] mx-auto flex items-center justify-center font-black shadow-lg shadow-[#00E599]/20">
          <Sparkles className="w-5 h-5 fill-[#0B0D10]" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">
            AI Overview Not Generated Yet
          </h4>
          <p className="text-xs text-[#A0A6B1] mt-1 max-w-md mx-auto leading-relaxed">
            Synthesize real-time Tavily search results, official circulars, and tentative exam dates into a verified overview.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefreshAi}
          className="px-5 py-2.5 bg-[#00E599] hover:bg-[#00c985] text-[#0B0D10] text-xs font-bold rounded-xl shadow-lg shadow-[#00E599]/20 transition-all inline-flex items-center gap-1.5 cursor-pointer mt-2"
        >
          <Sparkles className="w-3.5 h-3.5 fill-[#0B0D10]" />
          <span>✨ Generate AI Overview</span>
        </button>
      </div>
    );
  }

  const overview = aiOverview || {};
  const hasDates = overview.apply_last_date || overview.prelims_exam_date || overview.mains_exam_date || overview.apply_start_date;
  const activeDeadline = overview.extended_last_date || overview.active_last_date || overview.apply_last_date;
  const deadlineStatus = getDeadlineStatus(activeDeadline);
  const isClosed = overview.is_closed ?? deadlineStatus.isClosed;
  const officialSource = detectOfficialDomain(overview);
  const isOfficial = Boolean(officialSource);

  const handleAdopt = () => {
    if (onAdoptDates && officialSource) {
      onAdoptDates({
        last_date: formatDate(overview.extended_last_date || overview.active_last_date || overview.apply_last_date) || null,
        exam_date: formatDate(overview.prelims_exam_date || overview.mains_exam_date) || null,
        admit_card_date: formatDate(overview.admit_card_date) || null,
        source_domain: officialSource
      });
      setAdopted(true);
      setTimeout(() => setAdopted(false), 3000);
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#14171D] p-5 sm:p-7 shadow-xl shadow-black/40 space-y-5 relative overflow-hidden text-white">
      
      {/* Decorative Tavily Green + Purple background glow */}
      <div 
        className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-30"
        style={{ background: 'linear-gradient(135deg, #00E599, #7C5CFF)' }}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00E599] to-[#7C5CFF] text-[#0B0D10] flex items-center justify-center shadow-lg shadow-[#00E599]/20 shrink-0">
            <Sparkles className="w-5 h-5 fill-[#0B0D10]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-1.5 tracking-tight">
                <span>AI Overview</span>
              </h3>
              
              {overview.cross_verification?.verifier ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#00E599]" />
                  <span>{overview.cross_verification.verifier}</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>{overview.confidence || 'Tentative / Reported Online'}</span>
                </span>
              )}

              {overview.is_cached && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7C5CFF]/15 text-[#7C5CFF] border border-[#7C5CFF]/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#7C5CFF]" />
                  <span>24h Verified Cache ({overview.cache_age_hours ?? 0}h ago)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#A0A6B1] mt-0.5">
              Live Web Grounding for {examTitle || 'Government Exam'}
            </p>
          </div>
        </div>

        {onRefreshAi && (
          <button
            onClick={onRefreshAi}
            disabled={isRefreshing}
            className="text-xs px-3.5 py-2 rounded-xl bg-[#1F1E1E] hover:bg-[#282727] border border-white/[0.08] text-[#A0A6B1] hover:text-white font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#00E599] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Scanning Tavily...' : 'Re-Check Live'}</span>
          </button>
        )}
      </div>

      {/* Prominent Application Status Banner */}
      {activeDeadline && (
        <div className="relative z-10">
          {isClosed ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block">
                    Application Status
                  </span>
                  <strong className="text-sm font-extrabold text-white">
                    🔴 Application Closed on {formatDate(activeDeadline)}
                  </strong>
                </div>
              </div>
              <span className="text-[10px] font-bold px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full shrink-0">
                Concluded
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#00E599]/10 border border-[#00E599]/30 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00E599] text-[#0B0D10] flex items-center justify-center shrink-0 font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#00E599] block">
                    Application Status
                  </span>
                  <strong className="text-sm font-extrabold text-white">
                    🟢 Applications Open till {formatDate(activeDeadline)}
                  </strong>
                </div>
              </div>
              <span className="text-[10px] font-bold px-3 py-1 bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40 rounded-full shrink-0">
                {deadlineStatus.daysLeft !== null ? `${deadlineStatus.daysLeft}d Left` : 'Active'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* AI Overview Summary */}
      <div className="relative z-10 space-y-4">
        {overview.overview_summary ? (
          <div className="text-xs sm:text-sm text-[#FFFFFF] leading-relaxed font-normal bg-[#1F1E1E] p-4 rounded-xl border border-white/[0.08]">
            {overview.overview_summary}
          </div>
        ) : (
          <p className="text-xs text-[#A0A6B1] italic">
            Scanning latest official recruitment announcements and education media circulars...
          </p>
        )}

        {/* Schedule Overview Key Dates */}
        {hasDates && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0A6B1]">
              Overview of Important Exam Dates (DD/MM/YYYY)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              
              {/* Application Start */}
              {overview.apply_start_date && (
                <div className="p-3.5 rounded-xl bg-[#1F1E1E] border border-white/[0.08] flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] text-[#A0A6B1] flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#A0A6B1] block">
                      Application Start Date
                    </span>
                    <strong className="text-xs sm:text-sm font-bold text-white">
                      {formatDate(overview.apply_start_date)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Extended Deadline */}
              {(overview.extended_last_date || (overview.is_extended && (overview.active_last_date || overview.apply_last_date))) && (
                <div className="p-3.5 rounded-xl bg-[#1F1E1E] border border-amber-400/30 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-amber-300 block">
                      Extended Deadline {overview.fee_deadline ? '(With Late Fee)' : ''}
                    </span>
                    <strong className="text-xs sm:text-sm font-black text-white">
                      {formatDate(overview.extended_last_date || overview.active_last_date || overview.apply_last_date)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Regular Application Last Date */}
              {overview.apply_last_date && (!overview.is_extended || (overview.extended_last_date && overview.extended_last_date !== overview.apply_last_date)) && (
                <div className="p-3.5 rounded-xl bg-[#1F1E1E] border border-white/[0.08] flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] text-[#A0A6B1] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#A0A6B1] block">
                      {overview.is_extended ? 'Regular Last Date' : 'Last Date to Apply'}
                    </span>
                    <strong className="text-xs sm:text-sm font-bold text-white">
                      {formatDate(overview.apply_last_date)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Prelims Exam Date in Tavily Mint Green */}
              {overview.prelims_exam_date && 
               overview.prelims_exam_date !== activeDeadline && 
               formatDate(overview.prelims_exam_date) !== formatDate(activeDeadline) && (
                <div className="p-3.5 rounded-xl bg-[#1F1E1E] border border-[#00E599]/30 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#00E599]/20 text-[#00E599] flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#00E599] block uppercase tracking-wider">
                      Prelims / Written Exam Date
                    </span>
                    <strong className="text-xs sm:text-sm font-black text-[#00E599]">
                      {formatDate(overview.prelims_exam_date)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Mains Exam Date in Tavily Purple */}
              {overview.mains_exam_date && (
                <div className="p-3.5 rounded-xl bg-[#1F1E1E] border border-[#7C5CFF]/30 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#7C5CFF]/20 text-[#7C5CFF] flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#7C5CFF] block uppercase tracking-wider">
                      Mains Exam Date
                    </span>
                    <strong className="text-xs sm:text-sm font-black text-[#7C5CFF]">
                      {formatDate(overview.mains_exam_date)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Vacancies in Bold Numbers */}
              {overview.vacancies && (
                <div className="p-3.5 rounded-xl bg-[#1F1E1E] border border-white/[0.08] flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] text-[#00E599] flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#A0A6B1] block">
                      Total Vacancies
                    </span>
                    <strong className="text-xs sm:text-sm font-extrabold text-[#00E599]">
                      {overview.vacancies}
                    </strong>
                  </div>
                </div>
              )}

              {/* Fee Payment Deadline */}
              {overview.fee_deadline && (
                <div className="p-3.5 rounded-xl bg-[#1F1E1E] border border-white/[0.08] flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] text-[#A0A6B1] flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#A0A6B1] block">
                      Fee Payment Deadline
                    </span>
                    <strong className="text-xs sm:text-sm font-bold text-white">
                      {formatDate(overview.fee_deadline)}
                    </strong>
                  </div>
                </div>
              )}

            </div>

            {/* Important Details List */}
            {overview.important_details && overview.important_details.length > 0 && (
              <div className="mt-3 p-4 rounded-xl bg-[#1F1E1E] border border-white/[0.08] space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#A0A6B1] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00E599]" />
                  <span>Important Updates</span>
                </div>
                <ul className="space-y-1.5 text-xs text-white font-medium">
                  {overview.important_details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#00E599] font-bold shrink-0 mt-0.5">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Source References (Tavily / Authority links) */}
        {overview.source_links && overview.source_links.length > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#A0A6B1]">
            <span>Sources:</span>
            {overview.source_links.map((src, idx) => (
              <a 
                key={idx}
                href={src.url || src.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#1F1E1E] border border-white/[0.08] hover:border-[#00E599]/40 text-[#A0A6B1] hover:text-white transition-colors"
              >
                <span className="truncate max-w-[150px]">{src.source || src.title}</span>
                <ExternalLink className="w-3 h-3 text-[#A0A6B1]" />
              </a>
            ))}
          </div>
        )}

      </div>

      {/* Action Footer: 1-Click Adopt Target Dates with Official Source Trust Verification */}
      {showAdoptButton && hasDates && onAdoptDates && (
        <div className="relative z-10 pt-4 border-t border-white/[0.08]">
          {isOfficial ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-[#A0A6B1]">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#00E599]/15 text-[#00E599] font-bold text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00E599]" />
                  <span>Official Commission Source: {officialSource}</span>
                </div>
                <p className="text-[11px] text-[#A0A6B1]">
                  Adopting will record these dates as &quot;Adopted from AI (Source: {officialSource})&quot;.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAdopt}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shrink-0 ${
                  adopted
                    ? 'bg-emerald-500 text-[#0B0D10]'
                    : 'bg-[#00E599] hover:bg-[#00c985] text-[#0B0D10] shadow-[#00E599]/20'
                }`}
              >
                {adopted ? (
                  <>
                    <Check className="w-4 h-4 text-[#0B0D10]" />
                    <span>Adopted ({officialSource})!</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-[#0B0D10]" />
                    <span>⚡ Adopt AI Dates ({officialSource})</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/25 p-3.5 rounded-xl">
              <div className="flex items-start gap-2.5 text-xs text-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-amber-300">
                    AI found these dates, but the source is unverified.
                  </strong>
                  <span className="text-[11px] text-amber-200/80">
                    1-Click adoption is locked until an official (.gov.in, .nic.in, or commission portal) notification is confirmed. Wait for official confirmation.
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0 self-start sm:self-center">
                Unverified Source
              </span>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default GoogleAiOverviewCard;
