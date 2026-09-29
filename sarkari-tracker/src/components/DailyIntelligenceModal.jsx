import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, ShieldCheck, AlertTriangle, ExternalLink, 
  Calendar, Clock, CheckCircle2, XCircle, HelpCircle, RefreshCw, FileText 
} from 'lucide-react';
import { getExamAnswers, triggerDailyExamChecks } from '../utils/api';

const QUESTION_LABELS = {
  notification_released: 'Official Notification',
  apply_start: 'Application Start Date',
  last_date: 'Last Date to Apply',
  last_date_extended: 'Last Date Extension',
  fee_last_date: 'Fee Payment Deadline',
  correction_window: 'Correction Window',
  corrigendum: 'Corrigendum & Addendum Notices',
  vacancy_change: 'Vacancy Revisions',
  eligibility_change: 'Eligibility Criteria Update',
  exam_date: 'Examination Schedule',
  postponed_rescheduled: 'Postponement / Reschedule',
  exam_city_slip: 'City Intimation Slip',
  admit_card: 'Admit Card / Hall Ticket',
  answer_key: 'Provisional Answer Key',
  result: 'Results Declared',
  cutoff: 'Cutoff Marks Published',
  final_result: 'Final Selection List',
  other_notice: 'Other Commission Notices',
  document_verification_schedule: 'Document Verification (DV)',
  hyderabad_karnataka_quota_change: 'Kalyana Karnataka (371J)',
  provisional_selection_list: 'Provisional 1:1 List'
};

const DailyIntelligenceModal = ({ isOpen, onClose, application }) => {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const examId = application?.exam_id;
  const customExamName = application?.custom_exam_name || application?.name || application?.short_name;

  const fetchAnswers = async () => {
    if (!application) return;
    setLoading(true);
    try {
      const res = await getExamAnswers(examId, customExamName);
      setAnswers(res.answers || {});
    } catch (err) {
      console.error('Failed to load answers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnswers();
    }
  }, [isOpen, application]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await triggerDailyExamChecks();
      await fetchAnswers();
    } catch (err) {
      alert('Monitor refresh in progress. Please check again shortly.');
    } finally {
      setRefreshing(false);
    }
  };

  if (!isOpen || !application) return null;

  const answerEntries = Object.entries(answers);
  const filteredEntries = answerEntries.filter(([key, a]) => {
    if (filter === 'found') return a.status === 'yes' || Boolean(a.date) || Boolean(a.value);
    if (filter === 'deadlines') return ['apply_start', 'last_date', 'last_date_extended', 'exam_date', 'admit_card'].includes(key);
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#121212] w-full max-w-3xl rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/80 dark:bg-[#181818] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-saffron-100 dark:bg-saffron-950/60 text-saffron-800 dark:text-saffron-300 text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Daily AI Commission Monitor</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white line-clamp-1">
              {customExamName}
            </h2>
            <p className="text-xs text-slate-500">
              {application.conducting_body || 'Official Board'} • 18 Verified Daily Question Audits
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl border border-slate-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-[#1e1e1e] text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Re-check Latest Answers"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1e1e1e] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-neutral-800 bg-white dark:bg-[#121212] flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-xl font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-[#181818] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Questions ({answerEntries.length})
          </button>
          <button
            onClick={() => setFilter('found')}
            className={`px-3 py-1 rounded-xl font-semibold transition-colors ${
              filter === 'found'
                ? 'bg-saffron-500 text-white'
                : 'bg-slate-100 dark:bg-[#181818] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Confirmed & Active Updates
          </button>
          <button
            onClick={() => setFilter('deadlines')}
            className={`px-3 py-1 rounded-xl font-semibold transition-colors ${
              filter === 'deadlines'
                ? 'bg-red-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Critical Deadlines
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-7 h-7 border-3 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-medium">Fetching verified daily questions & gazette answers...</p>
            </div>
          ) : filteredEntries.length > 0 ? (
            filteredEntries.map(([key, a]) => {
              const label = QUESTION_LABELS[key] || key.replace(/_/g, ' ');
              const isFound = a.status === 'yes' || Boolean(a.date) || (Boolean(a.value) && a.status !== 'not_found');
              const isOfficial = a.trust_label === 'Official source found';

              return (
                <div 
                  key={key}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isFound 
                      ? 'bg-slate-50/80 dark:bg-[#181818] border-slate-200 dark:border-neutral-800' 
                      : 'bg-slate-50/40 dark:bg-[#141414] border-slate-100 dark:border-neutral-800 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {label}
                        </span>
                        
                        {/* Status Badge */}
                        {isFound ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Confirmed
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#222] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" /> Not Announced
                          </span>
                        )}

                        {/* Trust Badge */}
                        {isFound && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isOfficial 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' 
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {isOfficial ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {a.trust_label}
                          </span>
                        )}
                      </div>

                      {/* Details / Answer Body */}
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">
                        {a.value || a.details || (isFound ? 'Confirmed by official source' : 'No notification issued yet by commission.')}
                      </p>

                      {/* Date if any */}
                      {a.date && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 dark:text-red-400 pt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>Key Date: {a.date}</span>
                        </div>
                      )}

                      {/* Quote snippet if any */}
                      {a.quote && (
                        <p className="text-[11px] text-slate-500 italic border-l-2 border-slate-300 dark:border-neutral-600 pl-2 mt-1">
                          "{a.quote}"
                        </p>
                      )}
                    </div>

                    {/* Source Link */}
                    {a.source_url && (
                      <a
                        href={a.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 hover:bg-slate-200 dark:hover:bg-[#222] text-slate-500 dark:text-slate-300 transition-colors shrink-0"
                        title="View Official Source"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 space-y-2">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No question responses recorded yet
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Click "Refresh" above to execute the daily Gemini intelligence scan for this examination.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#181818] text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI queries cross-reference official state/central gazettes daily.</span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-[#252525] hover:bg-slate-300 dark:hover:bg-[#333] text-slate-800 dark:text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default DailyIntelligenceModal;
