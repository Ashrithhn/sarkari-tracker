import React, { useState, useRef } from 'react';
import { 
  X, FileText, BookOpen, Award, ClipboardCheck, Receipt, 
  Upload, ExternalLink, Trash2, CheckCircle2, AlertCircle, 
  Download, Loader2, Sparkles, FolderArchive, TrendingUp
} from 'lucide-react';
import { uploadJobDocument, deleteJobDocument } from '../utils/api';

const RESOURCE_TYPES = [
  {
    key: 'notification',
    fileKey: 'notification_file',
    title: 'Official Notification PDF',
    description: 'Official recruitment advertisement, eligibility rules, and vacancy breakdown.',
    icon: FileText,
    accent: 'from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400',
    badge: 'Official Notification'
  },
  {
    key: 'syllabus',
    fileKey: 'syllabus_file',
    title: 'Syllabus & Topic Notes',
    description: 'Detailed syllabus, topics, and exam pattern for your quick reference.',
    icon: BookOpen,
    accent: 'from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-900/60 text-purple-600 dark:text-purple-400',
    badge: 'Exam Syllabus'
  },
  {
    key: 'admit_card',
    fileKey: 'admit_card_file',
    title: 'Admit Card / Hall Ticket',
    description: 'Downloaded hall ticket with roll number, shift timing, and test center details.',
    icon: Award,
    accent: 'from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400',
    badge: 'Hall Ticket'
  },
  {
    key: 'application_form',
    fileKey: 'application_form_file',
    title: 'Submitted Application Form Slip',
    description: 'Registration print slip or submission summary page from the official portal.',
    icon: ClipboardCheck,
    accent: 'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400',
    badge: 'Application Slip'
  },
  {
    key: 'fee_receipt',
    fileKey: 'fee_receipt_file',
    title: 'Fee Payment Receipt',
    description: 'Bank Challan, payment gateway receipt, or transaction confirmation slip.',
    icon: Receipt,
    accent: 'from-cyan-500/10 to-sky-500/10 border-cyan-200 dark:border-cyan-900/60 text-cyan-600 dark:text-cyan-400',
    badge: 'Fee Receipt'
  },
  {
    key: 'cutoff',
    fileKey: 'cutoff_file',
    title: 'Cut-off Marks / Scorecard PDF',
    description: 'Scorecard, mark list, or category-wise cutoff PDF for your personal record.',
    icon: TrendingUp,
    accent: 'from-amber-500/10 to-yellow-500/10 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400',
    badge: 'Cut-off / Scorecard'
  }
];

const CandidateResourcesModal = ({ isOpen, onClose, application, onApplicationUpdated }) => {
  const [loadingKey, setLoadingKey] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRefs = useRef({});

  if (!isOpen || !application) return null;

  const examName = application.name || application.custom_exam_name || application.examDetails?.name || 'Exam';

  const handleFileChange = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset messages
    setErrorMsg('');
    setSuccessMsg('');
    setLoadingKey(docType);

    try {
      const res = await uploadJobDocument(application.id, file, docType);
      if (res.application && onApplicationUpdated) {
        onApplicationUpdated(res.application);
      }
      setSuccessMsg(`✓ ${file.name} uploaded successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload document');
    } finally {
      setLoadingKey(null);
      // Reset input value
      if (fileInputRefs.current[docType]) {
        fileInputRefs.current[docType].value = '';
      }
    }
  };

  const handleDelete = async (docType, title) => {
    if (!window.confirm(`Are you sure you want to remove your ${title}?`)) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoadingKey(docType);

    try {
      const res = await deleteJobDocument(application.id, docType);
      if (res.application && onApplicationUpdated) {
        onApplicationUpdated(res.application);
      }
      setSuccessMsg(`✓ ${title} removed.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete document');
    } finally {
      setLoadingKey(null);
    }
  };

  const getCleanFileName = (pathString) => {
    if (!pathString) return '';
    const name = pathString.split('/').pop() || '';
    // Format candidate-exam_name-timestamp.pdf to readable
    return decodeURIComponent(name).replace(/^candidate-/, '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/80">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-saffron-500/10 text-saffron-600 dark:text-saffron-400 flex items-center justify-center shrink-0 mt-0.5 border border-saffron-500/20">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  My Exam Resources
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950 dark:text-saffron-300">
                  {examName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload and store your official notification, syllabus, admit card, and slips handy in one secure place.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Alert Banner */}
        {errorMsg && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body: List of 5 Resource Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 custom-scrollbar">
          {RESOURCE_TYPES.map((resType) => {
            const Icon = resType.icon;
            const currentFileUrl = application[resType.fileKey];
            const hasFile = Boolean(currentFileUrl);
            const isProcessing = loadingKey === resType.key;

            return (
              <div 
                key={resType.key}
                className={`p-4 rounded-2xl border transition-all ${
                  hasFile 
                    ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 shadow-xs' 
                    : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-gradient-to-br border ${resType.accent}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {resType.title}
                        </h4>
                        {hasFile ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Uploaded
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                            Not Uploaded
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {resType.description}
                      </p>
                      {hasFile && (
                        <p className="text-[11px] font-mono text-saffron-600 dark:text-saffron-400 truncate mt-1 max-w-md">
                          📄 {getCleanFileName(currentFileUrl)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Hidden file input */}
                    <input 
                      type="file"
                      ref={el => fileInputRefs.current[resType.key] = el}
                      onChange={(e) => handleFileChange(e, resType.key)}
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                      className="hidden"
                    />

                    {hasFile ? (
                      <>
                        <a 
                          href={currentFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                          title="Open or Download File"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          <span>View / Open</span>
                        </a>

                        <button 
                          onClick={() => fileInputRefs.current[resType.key]?.click()}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          title="Replace File"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-saffron-500" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-saffron-500" />
                          )}
                          <span>Replace</span>
                        </button>

                        <button 
                          onClick={() => handleDelete(resType.key, resType.title)}
                          disabled={isProcessing}
                          className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                          title="Remove File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => fileInputRefs.current[resType.key]?.click()}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>Upload {resType.badge}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            🔒 Files are stored privately for your account and can be updated anytime.
          </p>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default CandidateResourcesModal;
