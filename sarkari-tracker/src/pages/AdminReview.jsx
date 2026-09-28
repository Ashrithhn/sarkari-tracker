import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, RefreshCw, FileText, AlertTriangle, ShieldCheck, ExternalLink, Calendar, Users, Clock } from 'lucide-react';
import { apiCall } from '../utils/api';
import { formatDate } from '../utils/constants';

const AdminReview = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [exams, setExams] = useState([]);
  const [selectedScanExamId, setSelectedScanExamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviewQueue();
    fetchExamsList();
  }, []);

  const fetchExamsList = async () => {
    try {
      const data = await apiCall('/api/admin/exams');
      setExams(data || []);
      if (data && data.length > 0) {
        setSelectedScanExamId(data[0].id);
      }
    } catch (e) {
      console.warn('Could not load exams list for scanner:', e);
    }
  };

  const fetchReviewQueue = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/api/admin/review');
      setItems(data || []);
      if (data && data.length > 0 && !selectedItem) {
        setSelectedItem(data[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScrape = async () => {
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await apiCall('/api/admin/scrape/trigger', { 
        method: 'POST',
        body: JSON.stringify({ exam_id: selectedScanExamId ? Number(selectedScanExamId) : undefined })
      });
      setMessage(res.message || 'Web scanned and queued for review!');
      await fetchReviewQueue();
    } catch (err) {
      setError(err.message || 'Scrape trigger failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      const res = await apiCall(`/api/admin/review/${id}/approve`, { method: 'POST' });
      setMessage(res.message || 'Approved & Published!');
      await fetchReviewQueue();
    } catch (err) {
      setError(err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(true);
    try {
      await apiCall(`/api/admin/review/${id}/reject`, { method: 'POST' });
      setMessage('Item rejected');
      await fetchReviewQueue();
    } catch (err) {
      setError(err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingItems = items.filter(i => i.status === 'pending');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-saffron-500/10 text-saffron-500">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              Admin Human-in-the-Loop Review Queue
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Verify official announcements and verbatim quotes before auto-publishing to candidate dashboards.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            value={selectedScanExamId}
            onChange={(e) => setSelectedScanExamId(e.target.value)}
            className="input-field text-xs py-2 px-3 max-w-xs"
          >
            {exams.map(ex => (
              <option key={ex.id} value={ex.id}>
                {ex.short_name || ex.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleTriggerScrape}
            disabled={actionLoading}
            className="btn-primary flex items-center justify-center gap-2 text-xs shrink-0 py-2 px-4 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
            Scan Web & Queue for Review
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-semibold">{message}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-500/30 text-red-800 dark:text-red-300 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Queue Items List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-1">
            <span>Pending Approvals ({pendingItems.length})</span>
            <span>Total Logged: {items.length}</span>
          </div>

          {items.length === 0 ? (
            <div className="glass-card p-8 text-center rounded-2xl text-gray-500">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">Queue is clear!</p>
              <p className="text-xs mt-1">Click "Run Live Scraper Now" to ingest official notices.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {items.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-saffron-500 bg-saffron-50/50 dark:bg-saffron-950/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-800 glass-card hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                        {item.short_name || item.exam_name}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          item.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : item.status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 animate-pulse'
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                      {item.diff_summary}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                      <span>#{item.id} • {formatDate(item.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Side-by-Side Verification Workbench */}
        <div className="lg:col-span-8">
          {selectedItem ? (
            <div className="glass-card rounded-3xl p-6 border border-gray-200 dark:border-gray-800 space-y-6">
              {/* Item Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">
                    {selectedItem.exam_name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>Event: <strong>{selectedItem.event_type}</strong></span>
                    <span>•</span>
                    <a
                      href={selectedItem.source_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-saffron-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" /> Official Source Link
                    </a>
                  </div>
                </div>

                {selectedItem.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(selectedItem.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/40 dark:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <button
                      onClick={() => handleApprove(selectedItem.id)}
                      disabled={actionLoading}
                      className="btn-primary text-xs font-bold flex items-center gap-1.5 py-2 px-5 shadow-md shadow-saffron-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4" /> 1-Click Approve & Publish
                    </button>
                  </div>
                )}
              </div>

              {/* Side-by-Side Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: Source Text & Verbatim Proof */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Source Notice (Raw Snapshot)
                  </h4>
                  <div className="p-4 bg-gray-50 dark:bg-navy-950 rounded-2xl border border-gray-200 dark:border-gray-800 text-xs font-mono text-gray-700 dark:text-gray-300 max-h-96 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                    {selectedItem.raw_extracted_data?.raw_text_preview || 'No preview captured.'}
                  </div>
                </div>

                {/* Right: Extracted Structured JSON */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Extracted Fields (Grounded)
                  </h4>

                  <div className="p-4 bg-white dark:bg-navy-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500">Apply Start:</span>
                      <strong className="text-gray-900 dark:text-white font-mono">
                        {selectedItem.proposed_changes?.apply_start || 'N/A'}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500">Last Date to Apply:</span>
                      <strong className="text-saffron-600 dark:text-saffron-400 font-mono font-bold">
                        {selectedItem.proposed_changes?.apply_end || 'N/A'}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500">Preliminary Exam Date:</span>
                      <strong className="text-gray-900 dark:text-white font-mono">
                        {selectedItem.proposed_changes?.exam_date || 'N/A'}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500">Main Examination:</span>
                      <strong className="text-gray-900 dark:text-white font-mono">
                        {selectedItem.proposed_changes?.mains_exam_date || 'N/A'}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500">Total Vacancies:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        {selectedItem.proposed_changes?.vacancies ? `${Number(selectedItem.proposed_changes.vacancies).toLocaleString()} Posts` : 'N/A'}
                      </strong>
                    </div>

                    {selectedItem.proposed_changes?.fee && (
                      <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-gray-500">Expected Application Fee:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          {selectedItem.proposed_changes.fee}
                        </strong>
                      </div>
                    )}

                    {selectedItem.raw_extracted_data?.snippet && (
                      <div className="p-3 bg-sky-50 dark:bg-navy-950 rounded-xl border border-sky-100 dark:border-gray-800 text-xs text-sky-900 dark:text-sky-300">
                        <strong className="block text-[11px] mb-1">📰 Media Quote / Headline:</strong>
                        <p className="leading-relaxed font-sans">"{selectedItem.raw_extracted_data.snippet}"</p>
                      </div>
                    )}

                    {/* Verbatim Quotes Highlight */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1.5">
                        ✓ Verbatim Quote Matches Found in PDF:
                      </span>
                      <div className="space-y-1 text-[11px] text-gray-600 dark:text-gray-400">
                        {selectedItem.proposed_changes?.verbatim_evidence &&
                          Object.entries(selectedItem.proposed_changes.verbatim_evidence).map(([key, val]) => (
                            val && (
                              <div key={key} className="bg-gray-50 dark:bg-navy-950 p-1.5 rounded-lg border border-gray-100 dark:border-gray-800">
                                <code>"{val}"</code>
                              </div>
                            )
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-16 text-center border border-gray-200 dark:border-gray-800 text-gray-500">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                Select an Item from the Queue
              </h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Compare the official notice text on the left with extracted data on the right before publishing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReview;
