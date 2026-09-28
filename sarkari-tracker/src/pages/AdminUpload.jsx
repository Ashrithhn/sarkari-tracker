import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall, uploadFile, getExams } from '../utils/api';
import { EXAM_CATEGORIES, KARNATAKA_BOARDS, KARNATAKA_CATEGORIES } from '../utils/constants';
import { 
  ShieldCheck, Upload, Plus, Copy, FileText, Image as ImageIcon, 
  Calendar, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, 
  BookOpen, Table, History, Search, Filter 
} from 'lucide-react';

const AdminUpload = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('registry');
  const [exams, setExams] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Selected exam for content upload
  const [selectedExamId, setSelectedExamId] = useState('');
  const [examSearch, setExamSearch] = useState('');

  // New Exam Form State
  const [newExam, setNewExam] = useState({
    name: '',
    short_name: '',
    conducting_body: '',
    level: 'central',
    state: '',
    category: 'SSC',
    official_site: '',
    careers_url: '',
    notification_url: ''
  });

  // Content Upload Form State
  const [contentType, setContentType] = useState('notification');
  const [contentTitle, setContentTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [publishStatus, setPublishStatus] = useState('published');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileMeta, setUploadedFileMeta] = useState(null);

  // Dates Form State
  const [datesPayload, setDatesPayload] = useState({
    notification_date: '',
    apply_start: '',
    apply_end: '',
    fee_last_date: '',
    admit_card_date: '',
    exam_date: '',
    result_date: ''
  });

  // Cutoffs Form State
  const [cutoffPhotoFile, setCutoffPhotoFile] = useState(null);
  const [cutoffRows, setCutoffRows] = useState([
    { cycle_year: new Date().getFullYear(), stage_name: 'Prelims', region_or_state: 'All India', category: 'UR', marks: '', out_of: '100' },
    { cycle_year: new Date().getFullYear(), stage_name: 'Prelims', region_or_state: 'All India', category: 'OBC', marks: '', out_of: '100' },
    { cycle_year: new Date().getFullYear(), stage_name: 'Prelims', region_or_state: 'All India', category: 'EWS', marks: '', out_of: '100' },
    { cycle_year: new Date().getFullYear(), stage_name: 'Prelims', region_or_state: 'All India', category: 'SC', marks: '', out_of: '100' },
    { cycle_year: new Date().getFullYear(), stage_name: 'Prelims', region_or_state: 'All India', category: 'ST', marks: '', out_of: '100' }
  ]);

  // PYQ Form State
  const [pyqData, setPyqData] = useState({
    cycle_year: new Date().getFullYear() - 1,
    stage_name: 'Prelims',
    shift: 'Shift 1',
    exam_date: '',
    subject: 'General Studies / Aptitude',
    question_paper_url: '',
    answer_key_url: '',
    attribution: 'Official Commission Portal'
  });

  useEffect(() => {
    fetchExams();
    fetchAuditLogs();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/admin/exams');
      setExams(data || []);
      if (data && data.length > 0 && !selectedExamId) {
        setSelectedExamId(data[0].id);
      }
    } catch (err) {
      setMsg({ text: err.message || 'Failed to load exams', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await apiCall('/api/admin/audit-logs');
      setAuditLogs(data || []);
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadingFile(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await uploadFile(file);
      setUploadedFileMeta(res);
      setMsg({ text: `File uploaded successfully: ${res.file_name}`, type: 'success' });
    } catch (err) {
      setMsg({ text: err.message || 'File upload failed', type: 'error' });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/api/admin/exams', {
        method: 'POST',
        body: JSON.stringify(newExam)
      });
      setMsg({ text: `Exam '${newExam.name}' created in registry.`, type: 'success' });
      setNewExam({
        name: '',
        short_name: '',
        conducting_body: '',
        level: 'central',
        state: '',
        category: 'SSC',
        official_site: '',
        careers_url: '',
        notification_url: ''
      });
      fetchExams();
      fetchAuditLogs();
    } catch (err) {
      setMsg({ text: err.message || 'Failed to create exam', type: 'error' });
    }
  };

  const handleDuplicateExam = async (examId) => {
    try {
      const res = await apiCall(`/api/admin/exams/${examId}/duplicate`, { method: 'POST' });
      setMsg({ text: res.message || 'Exam duplicated for new cycle with reset dates.', type: 'success' });
      fetchExams();
      fetchAuditLogs();
    } catch (err) {
      setMsg({ text: err.message || 'Failed to duplicate exam', type: 'error' });
    }
  };

  const handleSaveDates = async (e) => {
    e.preventDefault();
    if (!selectedExamId) {
      setMsg({ text: 'Please select an exam first', type: 'error' });
      return;
    }
    if (!sourceUrl) {
      setMsg({ text: 'Official Source URL is strictly required for verification', type: 'error' });
      return;
    }

    try {
      await apiCall(`/api/admin/exams/${selectedExamId}/content`, {
        method: 'POST',
        body: JSON.stringify({
          content_type: 'dates',
          title: 'Official Examination & Application Schedule',
          payload: datesPayload,
          source_url: sourceUrl,
          status: publishStatus
        })
      });
      setMsg({ text: 'Official dates published and sync alerts triggered to candidates!', type: 'success' });
      fetchExams();
      fetchAuditLogs();
    } catch (err) {
      setMsg({ text: err.message || 'Failed to save dates', type: 'error' });
    }
  };

  const handleSaveNotification = async (e) => {
    e.preventDefault();
    if (!selectedExamId || !sourceUrl) {
      setMsg({ text: 'Select an exam and provide official source URL', type: 'error' });
      return;
    }

    try {
      await apiCall(`/api/admin/exams/${selectedExamId}/content`, {
        method: 'POST',
        body: JSON.stringify({
          content_type: 'notification',
          title: contentTitle || 'Official Recruitment Notification',
          file_url: uploadedFileMeta?.file_url || null,
          file_name: uploadedFileMeta?.file_name || null,
          file_size: uploadedFileMeta?.file_size || null,
          mime_type: uploadedFileMeta?.mime_type || null,
          source_url: sourceUrl,
          status: publishStatus
        })
      });
      setMsg({ text: 'Official notification published!', type: 'success' });
      fetchExams();
      fetchAuditLogs();
    } catch (err) {
      setMsg({ text: err.message || 'Failed to publish notification', type: 'error' });
    }
  };

  const handleSaveCutoffs = async (e) => {
    e.preventDefault();
    if (!selectedExamId) return;

    try {
      // 1. If photo was uploaded, save cutoff_photo content module
      if (uploadedFileMeta?.file_url) {
        await apiCall(`/api/admin/exams/${selectedExamId}/content`, {
          method: 'POST',
          body: JSON.stringify({
            content_type: 'cutoff_photo',
            title: 'Official Cutoff Scorecard Document/Photo',
            file_url: uploadedFileMeta.file_url,
            file_name: uploadedFileMeta.file_name,
            file_size: uploadedFileMeta.file_size,
            mime_type: uploadedFileMeta.mime_type,
            source_url: sourceUrl || 'https://official.gov.in',
            status: 'published'
          })
        });
      }

      // 2. Save table rows
      const validRows = cutoffRows.filter(r => r.marks !== '');
      if (validRows.length > 0) {
        await apiCall(`/api/admin/exams/${selectedExamId}/cutoffs/bulk`, {
          method: 'POST',
          body: JSON.stringify({ rows: validRows })
        });
      }

      setMsg({ text: 'Official cutoffs and/or photo published successfully!', type: 'success' });
      fetchExams();
      fetchAuditLogs();
    } catch (err) {
      setMsg({ text: err.message || 'Failed to save cutoffs', type: 'error' });
    }
  };

  const handleSavePYQ = async (e) => {
    e.preventDefault();
    if (!selectedExamId || !pyqData.question_paper_url) {
      setMsg({ text: 'Question paper URL is required', type: 'error' });
      return;
    }

    try {
      await apiCall(`/api/admin/exams/${selectedExamId}/pyqs`, {
        method: 'POST',
        body: JSON.stringify(pyqData)
      });
      setMsg({ text: 'Previous Year Question paper added!', type: 'success' });
      setPyqData({
        ...pyqData,
        question_paper_url: '',
        answer_key_url: ''
      });
      fetchExams();
      fetchAuditLogs();
    } catch (err) {
      setMsg({ text: err.message || 'Failed to add PYQ', type: 'error' });
    }
  };

  const filteredExams = exams.filter(e => 
    e.name.toLowerCase().includes(examSearch.toLowerCase()) ||
    e.short_name.toLowerCase().includes(examSearch.toLowerCase()) ||
    e.conducting_body.toLowerCase().includes(examSearch.toLowerCase()) ||
    e.category.toLowerCase().includes(examSearch.toLowerCase())
  );

  const selectedExam = exams.find(e => String(e.id) === String(selectedExamId));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-saffron-500/10 text-saffron-500">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              Sarkari Official Content Management & Verification
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manual upload and verification portal. Adheres strictly to <strong>Official Verification Standards (No Dummy Data)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-full border border-emerald-300 dark:border-emerald-700/50">
            Admin Verified Session
          </span>
        </div>
      </div>

      {/* Alert Banner */}
      {msg.text && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm ${
          msg.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg({ text: '', type: '' })} className="font-bold ml-4">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('registry')}
          className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'registry'
              ? 'bg-navy-900 text-white dark:bg-saffron-500 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Exam Registry ({exams.length})
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'upload'
              ? 'bg-navy-900 text-white dark:bg-saffron-500 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" /> Upload Content / Dates
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'create'
              ? 'bg-navy-900 text-white dark:bg-saffron-500 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Plus className="w-4 h-4" /> Add New Exam
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'audit'
              ? 'bg-navy-900 text-white dark:bg-saffron-500 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" /> Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: REGISTRY VIEWER */}
      {activeTab === 'registry' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 w-full sm:w-96 shadow-sm">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search registry by exam or body..."
                value={examSearch}
                onChange={e => setExamSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-slate-800 dark:text-slate-200"
              />
            </div>
            <button onClick={fetchExams} className="btn-secondary text-xs flex items-center gap-1.5 self-end sm:self-auto">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Registry
            </button>
          </div>

          <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">Exam Name</th>
                    <th className="p-3.5">Body</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Content Modules</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredExams.map(ex => (
                    <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-slate-400 font-mono text-xs">{ex.id}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{ex.short_name}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{ex.name}</div>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 text-xs">{ex.conducting_body}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {ex.category} {ex.state ? `(${ex.state})` : ''}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {ex.data_status === 'verified' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            Empty / Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-slate-500">
                        {ex.content_count || 0} modules • {ex.cutoffs_count || 0} cutoffs • {ex.pyqs_count || 0} PYQs
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedExamId(ex.id);
                            setActiveTab('upload');
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-saffron-600 hover:bg-saffron-50 dark:hover:bg-saffron-950/50 rounded-lg transition-colors border border-saffron-300 dark:border-saffron-700"
                        >
                          Upload Data
                        </button>
                        <button
                          onClick={() => handleDuplicateExam(ex.id)}
                          title="Duplicate Exam for Next Cycle (Resets Dates)"
                          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5 inline mr-1" /> Duplicate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD CONTENT / DATES */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Exam Selector Panel */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-saffron-500" /> Target Official Exam
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">Choose from Registry</label>
              <select
                value={selectedExamId}
                onChange={e => setSelectedExamId(e.target.value)}
                className="input-field text-sm font-semibold"
              >
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.short_name} — {ex.conducting_body}
                  </option>
                ))}
              </select>
            </div>

            {selectedExam && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{selectedExam.name}</div>
                <div className="text-slate-500">Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedExam.category}</span></div>
                <div className="text-slate-500">Official URL: <a href={selectedExam.official_site} target="_blank" rel="noreferrer" className="text-saffron-600 underline font-medium break-all">{selectedExam.official_site}</a></div>
                <div className="text-slate-500">Current Status: <span className="font-bold uppercase text-amber-600">{selectedExam.data_status}</span></div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-500">Content Module Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'notification', label: 'PDF Notification', icon: FileText },
                  { id: 'dates', label: 'Verified Dates', icon: Calendar },
                  { id: 'cutoffs', label: 'Cutoff Photo/Table', icon: Table },
                  { id: 'pyqs', label: 'PYQ Master Papers', icon: BookOpen }
                ].map(mod => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => setContentType(mod.id)}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        contentType === mod.id
                          ? 'border-saffron-500 bg-saffron-50 dark:bg-saffron-950/40 text-saffron-600 dark:text-saffron-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Module Editor Panel */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* SUB-FORM 1: NOTIFICATION PDF */}
            {contentType === 'notification' && (
              <form onSubmit={handleSaveNotification} className="space-y-5">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-saffron-500" /> Upload Official Notification PDF / Document
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notification Document (PDF or Photo)</label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-saffron-400 transition-colors">
                    <input
                      type="file"
                      id="notif_file"
                      accept=".pdf,image/*"
                      onChange={e => {
                        const file = e.target.files[0];
                        setFileToUpload(file);
                        handleFileUpload(file);
                      }}
                      className="hidden"
                    />
                    <label htmlFor="notif_file" className="cursor-pointer space-y-2 block">
                      <Upload className="w-8 h-8 mx-auto text-saffron-500" />
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {uploadingFile ? 'Uploading file...' : fileToUpload ? fileToUpload.name : 'Click to select official PDF or image'}
                      </div>
                      <div className="text-xs text-slate-400">PDF, PNG, JPG up to 25MB</div>
                    </label>
                  </div>
                </div>

                {uploadedFileMeta && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
                    <span>✓ Uploaded: {uploadedFileMeta.file_name}</span>
                    <a href={uploadedFileMeta.file_url} target="_blank" rel="noreferrer" className="underline font-bold">Preview File</a>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Document Title</label>
                  <input
                    type="text"
                    value={contentTitle}
                    onChange={e => setContentTitle(e.target.value)}
                    placeholder="e.g. Detailed Central Recruitment Notification 2026-27"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Official Source URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={sourceUrl}
                    onChange={e => setSourceUrl(e.target.value)}
                    placeholder="https://commission.gov.in/notifications/2026.pdf"
                    className="input-field"
                  />
                  <p className="text-[11px] text-slate-500">Every published document requires a direct official domain link.</p>
                </div>

                <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Publish Notification Document
                </button>
              </form>
            )}

            {/* SUB-FORM 2: VERIFIED DATES */}
            {contentType === 'dates' && (
              <form onSubmit={handleSaveDates} className="space-y-5">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-saffron-500" /> Enter Verified Examination & Application Dates
                </h3>

                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40">
                  ⚠️ <strong>Verification Standard Reminder:</strong> Enter dates ONLY if explicitly stated in the official notification/advertisement. Leave unannounced dates empty (they will display "Will be updated soon").
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notification Issued Date</label>
                    <input
                      type="date"
                      value={datesPayload.notification_date}
                      onChange={e => setDatesPayload({ ...datesPayload, notification_date: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Application Start Date</label>
                    <input
                      type="date"
                      value={datesPayload.apply_start}
                      onChange={e => setDatesPayload({ ...datesPayload, apply_start: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-red-600 dark:text-red-400">Application LAST DATE (Crucial)</label>
                    <input
                      type="date"
                      value={datesPayload.apply_end}
                      onChange={e => setDatesPayload({ ...datesPayload, apply_end: e.target.value })}
                      className="input-field border-red-300 dark:border-red-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Fee Payment Last Date</label>
                    <input
                      type="date"
                      value={datesPayload.fee_last_date}
                      onChange={e => setDatesPayload({ ...datesPayload, fee_last_date: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Admit Card Release Date</label>
                    <input
                      type="date"
                      value={datesPayload.admit_card_date}
                      onChange={e => setDatesPayload({ ...datesPayload, admit_card_date: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Examination Date(s)</label>
                    <input
                      type="date"
                      value={datesPayload.exam_date}
                      onChange={e => setDatesPayload({ ...datesPayload, exam_date: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Result / Merit List Date</label>
                    <input
                      type="date"
                      value={datesPayload.result_date}
                      onChange={e => setDatesPayload({ ...datesPayload, result_date: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Official Source URL for Schedule <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={sourceUrl}
                    onChange={e => setSourceUrl(e.target.value)}
                    placeholder="https://commission.gov.in/exam-calendar"
                    className="input-field"
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Save Verified Dates & Trigger Candidate Sync
                </button>
              </form>
            )}

            {/* SUB-FORM 3: CUTOFFS */}
            {contentType === 'cutoffs' && (
              <form onSubmit={handleSaveCutoffs} className="space-y-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Table className="w-5 h-5 text-saffron-500" /> Upload Cutoff Photo / Enter Historical Marks
                </h3>

                {/* Option A: Upload Cutoff Scorecard Photo */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 space-y-3">
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-saffron-500" /> Option A: Upload Official Cutoff Photo / Document Snapshot
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      setCutoffPhotoFile(file);
                      handleFileUpload(file);
                    }}
                    className="text-xs text-slate-500"
                  />
                  {uploadedFileMeta && (
                    <p className="text-xs text-emerald-600 font-medium">✓ Uploaded: {uploadedFileMeta.file_name}</p>
                  )}
                </div>

                {/* Option B: Cutoff Rows Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Option B: Category-wise Cutoff Records
                    </label>
                    <button
                      type="button"
                      onClick={() => setCutoffRows([...cutoffRows, { cycle_year: new Date().getFullYear(), stage_name: 'Prelims', region_or_state: 'All India', category: 'UR', marks: '', out_of: '100' }])}
                      className="text-xs font-bold text-saffron-600 hover:underline"
                    >
                      + Add Row
                    </button>
                  </div>

                  <div className="space-y-2">
                    {cutoffRows.map((r, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-2 items-center text-xs">
                        <input
                          type="number"
                          placeholder="Year"
                          value={r.cycle_year}
                          onChange={e => {
                            const newR = [...cutoffRows];
                            newR[idx].cycle_year = e.target.value;
                            setCutoffRows(newR);
                          }}
                          className="input-field p-2"
                        />
                        <input
                          type="text"
                          placeholder="Stage (Prelims/Mains)"
                          value={r.stage_name}
                          onChange={e => {
                            const newR = [...cutoffRows];
                            newR[idx].stage_name = e.target.value;
                            setCutoffRows(newR);
                          }}
                          className="input-field p-2"
                        />
                        <select
                          value={r.category}
                          onChange={e => {
                            const newR = [...cutoffRows];
                            newR[idx].category = e.target.value;
                            setCutoffRows(newR);
                          }}
                          className="input-field p-2"
                        >
                          <option value="UR">UR</option>
                          <option value="OBC">OBC</option>
                          <option value="EWS">EWS</option>
                          <option value="SC">SC</option>
                          <option value="ST">ST</option>
                          <option value="GM">GM (Karnataka)</option>
                          <option value="2A">2A (Karnataka)</option>
                          <option value="2B">2B (Karnataka)</option>
                          <option value="3A">3A (Karnataka)</option>
                          <option value="3B">3B (Karnataka)</option>
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Marks"
                          value={r.marks}
                          onChange={e => {
                            const newR = [...cutoffRows];
                            newR[idx].marks = e.target.value;
                            setCutoffRows(newR);
                          }}
                          className="input-field p-2 font-bold"
                        />
                        <input
                          type="number"
                          placeholder="Out of"
                          value={r.out_of}
                          onChange={e => {
                            const newR = [...cutoffRows];
                            newR[idx].out_of = e.target.value;
                            setCutoffRows(newR);
                          }}
                          className="input-field p-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Official Cutoff Source URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={sourceUrl}
                    onChange={e => setSourceUrl(e.target.value)}
                    placeholder="https://commission.gov.in/cutoffs/2025"
                    className="input-field"
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Save Official Cutoffs & Photos
                </button>
              </form>
            )}

            {/* SUB-FORM 4: PYQS */}
            {contentType === 'pyqs' && (
              <form onSubmit={handleSavePYQ} className="space-y-5">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-saffron-500" /> Link Master PYQ Question Paper & Answer Key
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cycle Year</label>
                    <input
                      type="number"
                      required
                      value={pyqData.cycle_year}
                      onChange={e => setPyqData({ ...pyqData, cycle_year: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Stage</label>
                    <input
                      type="text"
                      value={pyqData.stage_name}
                      onChange={e => setPyqData({ ...pyqData, stage_name: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Shift / Paper</label>
                    <input
                      type="text"
                      value={pyqData.shift}
                      onChange={e => setPyqData({ ...pyqData, shift: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Paper Subject</label>
                  <input
                    type="text"
                    required
                    value={pyqData.subject}
                    onChange={e => setPyqData({ ...pyqData, subject: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Official Question Paper PDF URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={pyqData.question_paper_url}
                    onChange={e => setPyqData({ ...pyqData, question_paper_url: e.target.value })}
                    placeholder="https://commission.gov.in/pyq/2024_tier1.pdf"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Official Answer Key PDF URL (Optional)</label>
                  <input
                    type="url"
                    value={pyqData.answer_key_url}
                    onChange={e => setPyqData({ ...pyqData, answer_key_url: e.target.value })}
                    placeholder="https://commission.gov.in/pyq/2024_answerkey.pdf"
                    className="input-field"
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Add Previous Year Question Paper
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ADD NEW EXAM */}
      {activeTab === 'create' && (
        <div className="max-w-3xl mx-auto glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-saffron-500" /> Register New Official Examination / Commission
          </h2>
          <form onSubmit={handleCreateExam} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Exam Short Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KEA FDA 2026 or BHEL ET"
                  value={newExam.short_name}
                  onChange={e => setNewExam({ ...newExam, short_name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category <span className="text-red-500">*</span></label>
                <select
                  value={newExam.category}
                  onChange={e => setNewExam({ ...newExam, category: e.target.value })}
                  className="input-field"
                >
                  {EXAM_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Official Examination Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Karnataka Examinations Authority - First Division Assistant Recruitment"
                value={newExam.name}
                onChange={e => setNewExam({ ...newExam, name: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Conducting Body <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KEA or SSC"
                  value={newExam.conducting_body}
                  onChange={e => setNewExam({ ...newExam, conducting_body: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Level</label>
                <select
                  value={newExam.level}
                  onChange={e => setNewExam({ ...newExam, level: e.target.value })}
                  className="input-field"
                >
                  <option value="central">Central Govt</option>
                  <option value="state">State Govt</option>
                  <option value="psu">PSU / Autonomous</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">State (if state exam)</label>
                <input
                  type="text"
                  placeholder="e.g. Karnataka"
                  value={newExam.state}
                  onChange={e => setNewExam({ ...newExam, state: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Official Commission Website URL <span className="text-red-500">*</span></label>
              <input
                type="url"
                required
                placeholder="https://cetonline.karnataka.gov.in/kea"
                value={newExam.official_site}
                onChange={e => setNewExam({ ...newExam, official_site: e.target.value })}
                className="input-field"
              />
            </div>

            <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" /> Add Exam to Official Registry
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-100 dark:bg-slate-800/80 font-bold text-sm text-slate-800 dark:text-slate-200">
            Immutable Audit Trail of Manual Uploads & Changes
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{log.user_email || log.user_name || 'Admin'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{log.entity_type} #{log.entity_id}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="p-3 text-slate-400 font-mono">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUpload;
