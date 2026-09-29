import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getJobs, 
  applyToExam, 
  updateJob, 
  deleteJob, 
  getExams, 
  toggleChecklistItem, 
  addChecklistItem,
  exportJobsCsv,
  analyzeJobKeywords,
  scanJobAi,
  adoptJobAiDates,
  triggerDailyExamChecks
} from '../utils/api';
import { EXAM_CATEGORIES, APPLICATION_STATUSES, KARNATAKA_CATEGORIES } from '../utils/constants';
import { EXAM_SUGGESTIONS } from '../data/examSuggestions';
import { 
  Search, Filter, Plus, Grid, List, AlertCircle, X, 
  Download, FileCheck, CheckSquare, Square, Building2, 
  Calendar, CheckCircle2, Trash2, Edit, Sparkles, Globe, ExternalLink, RefreshCw, Zap
} from 'lucide-react';
import JobCard from '../components/JobCard';
import DailyIntelligenceModal from '../components/DailyIntelligenceModal';
import CandidateResourcesModal from '../components/CandidateResourcesModal';
import GoogleAiOverviewCard from '../components/GoogleAiOverviewCard';

const MODAL_EXAM_CATEGORIES = [
  { id: 'All', label: 'All Exams (160+)' },
  { id: 'Karnataka', label: 'Karnataka (KEA / KPSC / Police)' },
  { id: 'Banking', label: 'Banking (IBPS / SBI)' },
  { id: 'UPSC', label: 'UPSC' },
  { id: 'SSC', label: 'SSC' },
  { id: 'Railway', label: 'Railways' },
  { id: 'Defence', label: 'Defence' },
  { id: 'PSU', label: 'PSUs' },
  { id: 'Science', label: 'Science / Tech' }
];

const JobTracker = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [availableExams, setAvailableExams] = useState(EXAM_SUGGESTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & Search
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('date_applied');

  // Add Application Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState('registry'); // 'registry' or 'custom'
  const [examSearch, setExamSearch] = useState('');
  const [modalCategory, setModalCategory] = useState('All');
  const [selectedRegistryExam, setSelectedRegistryExam] = useState(null);
  const [customSuggestions, setCustomSuggestions] = useState([]);

  // Form Fields for Add/Apply
  const [formData, setFormData] = useState({
    // Custom job fields
    custom_exam_name: '',
    post_name: '',
    custom_conducting_body: '',
    official_portal_link: '',
    // Common personal fields
    category: 'General',
    registration_number: '',
    roll_number: '',
    fee_paid: false,
    user_last_date: '',
    user_exam_date: '',
    user_admit_card_date: '',
    user_result_date: '',
    notes: ''
  });

  // Edit Modal State
  const [editingJob, setEditingJob] = useState(null);

  // Checklist Drawer State
  const [activeChecklistJob, setActiveChecklistJob] = useState(null);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');

  // Web Keyword Intelligence Modal State
  const [activeAnalysisJob, setActiveAnalysisJob] = useState(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analyzingJobId, setAnalyzingJobId] = useState(null);
  const [scanningAiJobId, setScanningAiJobId] = useState(null);

  // Daily Question Intelligence Modal State
  const [activeIntelligenceJob, setActiveIntelligenceJob] = useState(null);
  const [isIntelligenceModalOpen, setIsIntelligenceModalOpen] = useState(false);
  const [isRunningDailyChecks, setIsRunningDailyChecks] = useState(false);

  // Candidate Personal Resources Modal State
  const [activeResourcesJob, setActiveResourcesJob] = useState(null);
  const [isResourcesModalOpen, setIsResourcesModalOpen] = useState(false);

  const handleOpenResources = (job) => {
    setActiveResourcesJob(job);
    setIsResourcesModalOpen(true);
  };

  const handleApplicationUpdated = (updatedApp) => {
    setJobs(prev => prev.map(j => j.id === updatedApp.id ? updatedApp : j));
    setActiveResourcesJob(updatedApp);
  };

  const handleOpenIntelligence = (job) => {
    setActiveIntelligenceJob(job);
    setIsIntelligenceModalOpen(true);
  };

  const handleRunDailyChecks = async () => {
    setIsRunningDailyChecks(true);
    try {
      const res = await triggerDailyExamChecks();
      alert(`AI Gazette Scan Complete!\nChecked ${res.examsChecked || 0} active exam(s).\nGenerated ${res.notificationsGenerated || 0} notification update(s).`);
      await fetchJobs();
    } catch (err) {
      alert(err.message || 'Failed to trigger daily checks');
    } finally {
      setIsRunningDailyChecks(false);
    }
  };

  const handleOpenAnalysis = (job) => {
    setActiveAnalysisJob(job);
    setIsAnalysisModalOpen(true);
  };

  const handleAnalyzeJob = async (jobId) => {
    setAnalyzingJobId(jobId);
    try {
      const res = await analyzeJobKeywords(jobId);
      if (res && res.application) {
        setJobs(prev => prev.map(j => j.id === jobId ? res.application : j));
        setActiveAnalysisJob(res.application);
      } else {
        await fetchJobs();
      }
      setIsAnalysisModalOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to analyze keywords');
    } finally {
      setAnalyzingJobId(null);
    }
  };

  const handleRefreshJobAi = async (jobId) => {
    setScanningAiJobId(jobId);
    try {
      const res = await scanJobAi(jobId);
      if (res && res.application) {
        setJobs(prev => prev.map(j => j.id === jobId ? res.application : j));
        if (activeAnalysisJob && activeAnalysisJob.id === jobId) {
          setActiveAnalysisJob(res.application);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to refresh AI Overview');
    } finally {
      setScanningAiJobId(null);
    }
  };

  const handleAdoptJobAiDates = async (jobId, dates) => {
    try {
      const res = await adoptJobAiDates(jobId, dates);
      if (res && res.application) {
        setJobs(prev => prev.map(j => j.id === jobId ? res.application : j));
        if (activeAnalysisJob && activeAnalysisJob.id === jobId) {
          setActiveAnalysisJob(res.application);
        }
        alert(res.message || 'Adopted dates successfully!');
      }
    } catch (err) {
      alert(err.message || 'Failed to adopt target dates');
    }
  };

  const handleApplyDiscoveredDates = async (job) => {
    if (!job || !job.web_analysis) return;
    const { expected_exam_date, expected_apply_end } = job.web_analysis;
    if (!expected_exam_date && !expected_apply_end) {
      alert('No specific dates were extracted from online reports.');
      return;
    }

    try {
      await updateJob(job.id, {
        user_exam_date: expected_exam_date || job.user_exam_date,
        user_last_date: expected_apply_end || job.user_last_date
      });
      setJobs(prev => prev.map(j => j.id === job.id ? { 
        ...j, 
        user_exam_date: expected_exam_date || j.user_exam_date, 
        user_last_date: expected_apply_end || j.user_last_date 
      } : j));
      if (activeAnalysisJob?.id === job.id) {
        setActiveAnalysisJob(prev => ({
          ...prev,
          user_exam_date: expected_exam_date || prev.user_exam_date,
          user_last_date: expected_apply_end || prev.user_last_date
        }));
      }
      alert('✓ Discovered dates applied to your personal tracker!');
    } catch (err) {
      alert(err.message || 'Failed to update personal dates');
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Listen to incoming search params (e.g. from Dashboard or Navbar "Track Application")
  useEffect(() => {
    const shouldAdd = searchParams.get('add');
    const examQuery = searchParams.get('exam');
    if (shouldAdd || examQuery) {
      let target = null;
      if (examQuery) {
        target = availableExams.find(e => 
          (e.short_name && e.short_name.toLowerCase().includes(examQuery.toLowerCase())) || 
          (e.name && e.name.toLowerCase().includes(examQuery.toLowerCase()))
        );
        if (target) {
          setExamSearch(target.short_name);
        } else {
          setExamSearch(examQuery);
        }
      }
      openAddModal(target);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getJobs();
      setJobs(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load tracked jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = async (preselectedExam = null) => {
    setIsAddModalOpen(true);
    setAddMode('registry');
    setSelectedRegistryExam(preselectedExam);
    setModalCategory(preselectedExam?.category || 'All');
    if (preselectedExam) {
      setExamSearch(preselectedExam.short_name || preselectedExam.name || '');
    }
    setFormData({
      custom_exam_name: preselectedExam ? preselectedExam.name : '',
      post_name: preselectedExam ? (preselectedExam.short_name || preselectedExam.name) : '',
      custom_conducting_body: preselectedExam ? preselectedExam.conducting_body : '',
      official_portal_link: preselectedExam ? (preselectedExam.official_site || preselectedExam.careers_url || '') : '',
      category: 'General',
      registration_number: '',
      roll_number: '',
      fee_paid: false,
      user_last_date: '',
      user_exam_date: '',
      user_admit_card_date: '',
      user_result_date: '',
      notes: ''
    });

    try {
      const exams = await getExams();
      if (exams && exams.length > 0) {
        setAvailableExams(exams);
        if (preselectedExam) {
          const match = exams.find(e => 
            e.id === preselectedExam.id || 
            (e.short_name && e.short_name.toLowerCase() === preselectedExam.short_name?.toLowerCase()) ||
            (e.name && e.name.toLowerCase() === preselectedExam.name?.toLowerCase())
          );
          if (match) setSelectedRegistryExam(match);
        }
      }
    } catch (err) {
      console.warn('Could not load exams registry from API, keeping instant suggestion catalog:', err);
    }
  };

  const handleApplyRegistry = async (e, directExam = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const targetExam = directExam || selectedRegistryExam;
    if (!targetExam) {
      alert('Please select an official exam from the suggestions list');
      return;
    }

    try {
      await applyToExam(targetExam.id || null, {
        custom_exam_name: targetExam.name,
        post_name: targetExam.short_name || targetExam.name,
        custom_conducting_body: targetExam.conducting_body,
        official_portal_link: targetExam.official_site || targetExam.careers_url || '',
        category: formData.category || 'General',
        state: targetExam.state || (targetExam.category === 'Karnataka' ? 'Karnataka' : null),
        registration_number: formData.registration_number,
        roll_number: formData.roll_number,
        fee_paid: formData.fee_paid ? 1 : 0,
        user_last_date: formData.user_last_date || null,
        user_exam_date: formData.user_exam_date || null,
        user_admit_card_date: formData.user_admit_card_date || null,
        user_result_date: formData.user_result_date || null,
        notes: formData.notes
      });
      setIsAddModalOpen(false);
      fetchJobs();
    } catch (err) {
      alert(err.message || 'Failed to apply');
    }
  };

  const handleCreateCustomJob = async (e) => {
    e.preventDefault();
    if (!formData.custom_exam_name) {
      alert('Examination name is required');
      return;
    }

    try {
      await applyToExam(null, {
        custom_exam_name: formData.custom_exam_name,
        post_name: formData.post_name,
        custom_conducting_body: formData.custom_conducting_body,
        official_portal_link: formData.official_portal_link,
        category: formData.category,
        registration_number: formData.registration_number,
        roll_number: formData.roll_number,
        fee_paid: formData.fee_paid ? 1 : 0,
        user_last_date: formData.user_last_date || null,
        user_exam_date: formData.user_exam_date || null,
        user_admit_card_date: formData.user_admit_card_date || null,
        user_result_date: formData.user_result_date || null,
        notes: formData.notes
      });
      setIsAddModalOpen(false);
      fetchJobs();
    } catch (err) {
      alert(err.message || 'Failed to create custom application');
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await updateJob(jobId, { status: newStatus });
      // Optimistic update
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    } catch (err) {
      alert(err.message || 'Failed to update status');
      fetchJobs();
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to stop tracking this job application?')) {
      try {
        await deleteJob(jobId);
        setJobs(prev => prev.filter(j => j.id !== jobId));
      } catch (err) {
        alert(err.message || 'Failed to delete application');
      }
    }
  };

  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setFormData({
      registration_number: job.registration_number || '',
      roll_number: job.roll_number || '',
      fee_paid: !!job.fee_paid,
      user_last_date: job.user_last_date || '',
      user_exam_date: job.user_exam_date || '',
      user_admit_card_date: job.user_admit_card_date || '',
      user_result_date: job.user_result_date || '',
      notes: job.notes || '',
      category: job.category || 'General',
      post_name: job.post_name || '',
      official_portal_link: job.official_portal_link || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingJob) return;

    try {
      await updateJob(editingJob.id, {
        registration_number: formData.registration_number,
        roll_number: formData.roll_number,
        fee_paid: formData.fee_paid ? 1 : 0,
        user_last_date: formData.user_last_date || null,
        user_exam_date: formData.user_exam_date || null,
        user_admit_card_date: formData.user_admit_card_date || null,
        user_result_date: formData.user_result_date || null,
        notes: formData.notes,
        category: formData.category,
        post_name: formData.post_name,
        official_portal_link: formData.official_portal_link
      });
      setEditingJob(null);
      fetchJobs();
    } catch (err) {
      alert(err.message || 'Failed to update application');
    }
  };

  const handleToggleChecklist = async (itemId, currentCompleted) => {
    if (!activeChecklistJob) return;
    const targetStatus = !currentCompleted;
    try {
      await toggleChecklistItem(activeChecklistJob.id, itemId, targetStatus);
      
      // Update active modal state
      const updatedChecklist = activeChecklistJob.checklist.map(item => 
        item.id === itemId ? { ...item, is_completed: targetStatus ? 1 : 0 } : item
      );
      setActiveChecklistJob({ ...activeChecklistJob, checklist: updatedChecklist });
      
      // Update main jobs list
      setJobs(prev => prev.map(j => 
        j.id === activeChecklistJob.id ? { ...j, checklist: updatedChecklist } : j
      ));
    } catch (err) {
      alert('Failed to toggle checklist item');
    }
  };

  const handleAddCustomChecklistItem = async (e) => {
    e.preventDefault();
    if (!newChecklistTitle || !activeChecklistJob) return;
    try {
      const res = await addChecklistItem(activeChecklistJob.id, newChecklistTitle);
      const newItem = { id: res.id, item_title: newChecklistTitle, is_completed: 0 };
      const updatedChecklist = [...(activeChecklistJob.checklist || []), newItem];
      setActiveChecklistJob({ ...activeChecklistJob, checklist: updatedChecklist });
      setJobs(prev => prev.map(j => 
        j.id === activeChecklistJob.id ? { ...j, checklist: updatedChecklist } : j
      ));
      setNewChecklistTitle('');
    } catch (err) {
      alert('Failed to add checklist item');
    }
  };

  // Filtered & Sorted Jobs
  const filteredJobs = jobs.filter(job => {
    const term = search.trim().toLowerCase();
    const tokens = term ? term.split(/\s+/).filter(Boolean) : [];
    const searchableText = `${job.custom_exam_name || ''} ${job.name || ''} ${job.short_name || ''} ${job.post_name || ''} ${job.conducting_body || ''} ${job.category || ''}`.toLowerCase();
    
    const matchSearch = tokens.length === 0 || tokens.every(t => searchableText.includes(t));
    const matchCat = filterCategory === 'All' || job.category === filterCategory || (filterCategory === 'Karnataka' && (job.category === 'Karnataka' || job.state === 'Karnataka'));
    const matchStatus = filterStatus === 'All' || job.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  }).sort((a, b) => {
    if (sortBy === 'date_applied') return new Date(b.applied_date) - new Date(a.applied_date);
    if (sortBy === 'exam_date') {
      const dateA = a.effectiveExamDate || a.user_exam_date || '9999-12-31';
      const dateB = b.effectiveExamDate || b.user_exam_date || '9999-12-31';
      return new Date(dateA) - new Date(dateB);
    }
    return a.status.localeCompare(b.status);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 pt-20 text-slate-800 dark:text-slate-200">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 dark:text-white">
              My Government Job Applications
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Personal application lifecycle tracker with official commission sync & document checklists.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={handleRunDailyChecks}
              disabled={isRunningDailyChecks || jobs.length === 0}
              className="btn-secondary text-xs sm:text-sm flex items-center gap-1.5 py-2.5 px-3.5 bg-gradient-to-r from-amber-50 to-saffron-50 dark:from-amber-950/30 dark:to-saffron-950/30 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 hover:border-amber-400"
              title="Audit official commission notices and Google Search for updates across all tracked exams"
            >
              <RefreshCw className={`w-4 h-4 text-saffron-600 dark:text-saffron-400 ${isRunningDailyChecks ? 'animate-spin' : ''}`} />
              <span>{isRunningDailyChecks ? 'Auditing...' : "Run Today's AI Check"}</span>
            </button>

            <button
              onClick={exportJobsCsv}
              className="btn-secondary text-xs sm:text-sm flex items-center gap-1.5 py-2.5 px-3.5"
              title="Download your tracked applications as a CSV spreadsheet"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>

            <button
              onClick={openAddModal}
              className="btn-primary text-xs sm:text-sm flex items-center gap-1.5 py-2.5 px-4"
            >
              <Plus className="w-4 h-4" /> Track New Application
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-card p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by exam, post, or commission..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field py-1.5 text-xs sm:text-sm flex-1"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select 
              className="input-field py-1.5 text-xs font-semibold" 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {EXAM_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select 
              className="input-field py-1.5 text-xs font-semibold" 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {Object.keys(APPLICATION_STATUSES).map(s => (
                <option key={s} value={s}>{APPLICATION_STATUSES[s].label}</option>
              ))}
            </select>

            <select 
              className="input-field py-1.5 text-xs font-semibold" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_applied">Sort: Applied Date</option>
              <option value="exam_date">Sort: Exam Date</option>
              <option value="status">Sort: Status</option>
            </select>

            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800">
              <button 
                onClick={() => setView('grid')} 
                className={`p-1.5 rounded ${view === 'grid' ? 'bg-white dark:bg-slate-700 text-saffron-600 shadow-xs' : 'text-slate-400'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4"/>
              </button>
              <button 
                onClick={() => setView('list')} 
                className={`p-1.5 rounded ${view === 'list' ? 'bg-white dark:bg-slate-700 text-saffron-600 shadow-xs' : 'text-slate-400'}`}
                title="List View"
              >
                <List className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center gap-2 border border-red-200 dark:border-red-900/50 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Applications List / Empty State */}
        {loading ? (
          <div className="flex justify-center p-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-500"></div>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
            {filteredJobs.map(job => (
              <JobCard 
                key={job.id} 
                application={job}
                onStatusChange={handleStatusChange}
                onOpenChecklist={setActiveChecklistJob}
                onOpenResources={handleOpenResources}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteJob}
                onOpenAnalysis={handleOpenAnalysis}
                onAnalyzeJob={handleAnalyzeJob}
                onOpenIntelligence={handleOpenIntelligence}
                isAnalyzing={analyzingJobId === job.id}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card flex flex-col items-center justify-center p-16 rounded-3xl text-center border border-dashed border-slate-300 dark:border-slate-800">
            <div className="w-20 h-20 bg-saffron-50 dark:bg-saffron-950/30 rounded-full flex items-center justify-center mb-4 text-saffron-500">
              <FileCheck className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">
              {jobs.length === 0 ? "You haven't tracked any applications yet" : "No applications match your filter"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
              Start tracking government job applications across Central SSC/UPSC, Banking, Railways, PSUs, and Karnataka State boards (KEA/KPSC).
            </p>
            <button onClick={openAddModal} className="btn-primary text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Track First Application
            </button>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD APPLICATION (REGISTRY OR CUSTOM JOB)         */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in-up border border-slate-200 dark:border-slate-800 my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Track Application</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select an official exam from registry or enter a custom post.</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-6 h-6"/>
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => setAddMode('registry')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  addMode === 'registry' 
                    ? 'bg-white dark:bg-slate-900 text-saffron-600 dark:text-saffron-400 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                1. Select from 160+ Official Exams (India & Karnataka)
              </button>
              <button
                type="button"
                onClick={() => setAddMode('custom')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  addMode === 'custom' 
                    ? 'bg-white dark:bg-slate-900 text-saffron-600 dark:text-saffron-400 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                2. Add Custom Job (PSU / State / Direct)
              </button>
            </div>

            {/* Content for Mode 1: Registry */}
            {addMode === 'registry' && (
              <form onSubmit={handleApplyRegistry} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-saffron-500" />
                      Search & Select Official Examination
                    </label>
                    <span className="text-[11px] text-slate-500">
                      160+ Central & Karnataka Exams
                    </span>
                  </div>

                  {/* Search Input Box */}
                  <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 focus-within:ring-2 focus-within:ring-saffron-500">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Type to search (e.g. KEA, KPSC, Police, UPSC, SSC, IBPS, KPTCL, BESCOM)..." 
                      value={examSearch}
                      onChange={(e) => setExamSearch(e.target.value)}
                      className="bg-transparent border-none outline-none flex-1 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                    />
                    {examSearch && (
                      <button 
                        type="button" 
                        onClick={() => setExamSearch('')}
                        className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Category Pills inside Modal */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                    {MODAL_EXAM_CATEGORIES.map(cat => {
                      const count = availableExams.filter(e => {
                        if (cat.id === 'All') return true;
                        if (cat.id === 'Karnataka') return e.category === 'Karnataka' || e.state === 'Karnataka' || e.level === 'state';
                        return e.category === cat.id;
                      }).length;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setModalCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-lg font-medium text-[11px] whitespace-nowrap transition-colors flex items-center gap-1 ${
                            modalCategory === cat.id 
                              ? 'bg-saffron-500 text-white font-bold' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          <span>{cat.label}</span>
                          <span className={`text-[9px] px-1 rounded-full ${modalCategory === cat.id ? 'bg-white/30 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Results Count & Suggestion List */}
                  {(() => {
                    const filtered = availableExams.filter(e => {
                      const matchCategory = modalCategory === 'All' || 
                        e.category === modalCategory || 
                        (modalCategory === 'Karnataka' && (e.category === 'Karnataka' || e.state === 'Karnataka' || e.level === 'state'));

                      const term = examSearch.trim().toLowerCase();
                      if (!term) return matchCategory;
                      const tokens = term.split(/\s+/).filter(Boolean);
                      const searchableText = `${e.name || ''} ${e.short_name || ''} ${e.conducting_body || ''} ${e.category || ''} ${e.state || ''}`.toLowerCase();
                      return matchCategory && tokens.every(token => searchableText.includes(token));
                    });

                    return (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
                          <span>Showing {filtered.length} examination(s)</span>
                          {selectedRegistryExam && (
                            <span className="text-saffron-600 dark:text-saffron-400 font-semibold">
                              ✓ {selectedRegistryExam.short_name} selected
                            </span>
                          )}
                        </div>

                        <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
                          {filtered.length > 0 ? (
                            filtered.map(exam => {
                              const isSelected = selectedRegistryExam?.id === exam.id || 
                                (selectedRegistryExam?.short_name && selectedRegistryExam.short_name === exam.short_name);
                              const isKarnataka = exam.category === 'Karnataka' || exam.state === 'Karnataka' || exam.level === 'state';

                              return (
                                <div 
                                  key={exam.id || exam.short_name} 
                                  onClick={() => setSelectedRegistryExam(exam)}
                                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                                    isSelected 
                                      ? 'bg-saffron-50 dark:bg-saffron-950/40 border-saffron-400 dark:border-saffron-600 shadow-xs' 
                                      : 'hover:bg-white dark:hover:bg-slate-800/80 border-slate-200/50 dark:border-slate-800/50'
                                  }`}
                                >
                                  <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{exam.short_name}</span>
                                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                                        isKarnataka 
                                          ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200/50' 
                                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/50'
                                      }`}>
                                        {isKarnataka ? 'Karnataka' : (exam.category || 'Central')}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                                      {exam.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">
                                      {exam.conducting_body} {exam.official_site ? `• ${exam.official_site.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}` : ''}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApplyRegistry(e, exam);
                                      }}
                                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-saffron-500 hover:bg-saffron-600 text-white transition-colors flex items-center gap-1 shadow-2xs"
                                      title="Fast track this application directly"
                                    >
                                      <Zap className="w-3 h-3" />
                                      <span>Track</span>
                                    </button>
                                    {isSelected ? (
                                      <CheckCircle2 className="w-5 h-5 text-saffron-600 shrink-0" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700" />
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-6 text-slate-400 space-y-1">
                              <p className="text-xs font-semibold">No official exams match "{examSearch}" in this category.</p>
                              <p className="text-[11px]">Switch to "All Exams" or use Mode 2 to enter any custom recruitment.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {selectedRegistryExam && (
                  <div className="p-3.5 bg-saffron-50/80 dark:bg-saffron-950/30 border border-saffron-300 dark:border-saffron-800/60 rounded-2xl text-xs space-y-1 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-saffron-900 dark:text-saffron-200">
                        Selected: {selectedRegistryExam.name}
                      </span>
                      {selectedRegistryExam.official_site && (
                        <a 
                          href={selectedRegistryExam.official_site} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[10px] text-saffron-700 dark:text-saffron-400 underline font-semibold flex items-center gap-1"
                        >
                          Official Portal <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Conducting Commission: <strong>{selectedRegistryExam.conducting_body}</strong> | Category: <strong>{selectedRegistryExam.category}</strong>
                    </p>
                  </div>
                )}

                {/* Personal Applicant Details (Optional Overrides) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Personal Candidate Details & Shift Overrides
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Reservation Category</label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="input-field text-xs"
                      >
                        <option value="General">General / UR</option>
                        <option value="OBC">OBC</option>
                        <option value="EWS">EWS</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="GM">GM (Karnataka)</option>
                        <option value="2A">2A (Karnataka)</option>
                        <option value="2B">2B (Karnataka)</option>
                        <option value="3A">3A (Karnataka)</option>
                        <option value="3B">3B (Karnataka)</option>
                        <option value="Cat-1">Cat-1 (Karnataka)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Registration Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 260193847"
                        value={formData.registration_number}
                        onChange={e => setFormData({ ...formData, registration_number: e.target.value })}
                        className="input-field text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Personal Shift / Exam Date</label>
                      <input
                        type="date"
                        value={formData.user_exam_date}
                        onChange={e => setFormData({ ...formData, user_exam_date: e.target.value })}
                        className="input-field text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Personal Application Last Date</label>
                      <input
                        type="date"
                        value={formData.user_last_date}
                        onChange={e => setFormData({ ...formData, user_last_date: e.target.value })}
                        className="input-field text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="reg_fee_paid"
                      checked={formData.fee_paid}
                      onChange={e => setFormData({ ...formData, fee_paid: e.target.checked })}
                      className="w-4 h-4 rounded text-saffron-600 focus:ring-saffron-500"
                    />
                    <label htmlFor="reg_fee_paid" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Application fee has been paid successfully
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary text-xs">
                    Cancel
                  </button>
                  <button type="submit" disabled={!selectedRegistryExam} className="btn-primary text-xs disabled:opacity-50">
                    Track Application
                  </button>
                </div>
              </form>
            )}

            {/* Content for Mode 2: Custom Job with Autocomplete Suggestions */}
            {addMode === 'custom' && (
              <form onSubmit={handleCreateCustomJob} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-1 relative">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Exam / Recruitment Notification Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Type name (e.g. BEL, KPTCL, High Court, ISRO, Police)..."
                    value={formData.custom_exam_name}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ ...formData, custom_exam_name: val });
                      if (val.trim().length >= 2) {
                        const term = val.trim().toLowerCase();
                        const tokens = term.split(/\s+/).filter(Boolean);
                        const matched = availableExams.filter(ex => {
                          const text = `${ex.name || ''} ${ex.short_name || ''} ${ex.conducting_body || ''}`.toLowerCase();
                          return tokens.every(tok => text.includes(tok));
                        }).slice(0, 5);
                        setCustomSuggestions(matched);
                      } else {
                        setCustomSuggestions([]);
                      }
                    }}
                    className="input-field text-xs"
                  />

                  {/* Autocomplete Dropdown */}
                  {customSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                      <div className="p-1.5 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Suggested Official Exams (Click to Autofill):
                      </div>
                      {customSuggestions.map(sug => (
                        <div
                          key={sug.id || sug.short_name}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              custom_exam_name: sug.name,
                              post_name: sug.short_name || sug.name,
                              custom_conducting_body: sug.conducting_body || '',
                              official_portal_link: sug.official_site || sug.careers_url || '',
                              category: formData.category || 'General'
                            });
                            setCustomSuggestions([]);
                          }}
                          className="p-2 hover:bg-saffron-50 dark:hover:bg-slate-700/70 cursor-pointer transition-colors"
                        >
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{sug.short_name}</div>
                          <div className="text-[11px] text-slate-500">{sug.conducting_body} • {sug.category}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Post Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Assistant Engineer (Civil)"
                      value={formData.post_name}
                      onChange={e => setFormData({ ...formData, post_name: e.target.value })}
                      className="input-field text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Conducting Body / PSU</label>
                    <input
                      type="text"
                      placeholder="e.g. Bharat Electronics Limited"
                      value={formData.custom_conducting_body}
                      onChange={e => setFormData({ ...formData, custom_conducting_body: e.target.value })}
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Official Portal Link</label>
                  <input
                    type="url"
                    placeholder="https://bel-india.in/careers"
                    value={formData.official_portal_link}
                    onChange={e => setFormData({ ...formData, official_portal_link: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>

                {/* Important Personal Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-red-600 dark:text-red-400">Apply Last Date</label>
                    <input
                      type="date"
                      value={formData.user_last_date}
                      onChange={e => setFormData({ ...formData, user_last_date: e.target.value })}
                      className="input-field text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Examination Date</label>
                    <input
                      type="date"
                      value={formData.user_exam_date}
                      onChange={e => setFormData({ ...formData, user_exam_date: e.target.value })}
                      className="input-field text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Admit Card Date</label>
                    <input
                      type="date"
                      value={formData.user_admit_card_date}
                      onChange={e => setFormData({ ...formData, user_admit_card_date: e.target.value })}
                      className="input-field text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Result Date</label>
                    <input
                      type="date"
                      value={formData.user_result_date}
                      onChange={e => setFormData({ ...formData, user_result_date: e.target.value })}
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                {/* Identifiers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="input-field text-xs"
                    >
                      <option value="General">General / UR</option>
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
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Registration No</label>
                    <input
                      type="text"
                      placeholder="Reg Number"
                      value={formData.registration_number}
                      onChange={e => setFormData({ ...formData, registration_number: e.target.value })}
                      className="input-field text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Roll No</label>
                    <input
                      type="text"
                      placeholder="Roll Number"
                      value={formData.roll_number}
                      onChange={e => setFormData({ ...formData, roll_number: e.target.value })}
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="custom_fee_paid"
                    checked={formData.fee_paid}
                    onChange={e => setFormData({ ...formData, fee_paid: e.target.checked })}
                    className="w-4 h-4 rounded text-saffron-600 focus:ring-saffron-500"
                  />
                  <label htmlFor="custom_fee_paid" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Application fee has been paid
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Personal Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Shift 2 reporting time 8:30 AM, center at Bangalore south"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary text-xs">
                    Save Custom Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT APPLICATION (PERSONAL DATES & DETAILS)      */}
      {/* ========================================================= */}
      {editingJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Application Details</h2>
              <button onClick={() => setEditingJob(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Personal Exam Date</label>
                  <input
                    type="date"
                    value={formData.user_exam_date}
                    onChange={e => setFormData({ ...formData, user_exam_date: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Personal Last Date</label>
                  <input
                    type="date"
                    value={formData.user_last_date}
                    onChange={e => setFormData({ ...formData, user_last_date: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Registration No</label>
                  <input
                    type="text"
                    value={formData.registration_number}
                    onChange={e => setFormData({ ...formData, registration_number: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Roll No</label>
                  <input
                    type="text"
                    value={formData.roll_number}
                    onChange={e => setFormData({ ...formData, roll_number: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit_fee_paid"
                  checked={formData.fee_paid}
                  onChange={e => setFormData({ ...formData, fee_paid: e.target.checked })}
                  className="w-4 h-4 rounded text-saffron-600"
                />
                <label htmlFor="edit_fee_paid" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fee paid successfully
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Personal Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingJob(null)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DOCUMENT CHECKLIST DRAWER                        */}
      {/* ========================================================= */}
      {activeChecklistJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up border border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-saffron-500" /> Document Checklist
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeChecklistJob.custom_exam_name || activeChecklistJob.name || activeChecklistJob.short_name}
                </p>
              </div>
              <button onClick={() => setActiveChecklistJob(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                {(activeChecklistJob.checklist || []).map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => handleToggleChecklist(item.id, item.is_completed)}
                    className="py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors"
                  >
                    {item.is_completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                    <span className={`text-sm ${item.is_completed ? 'line-through text-slate-400' : 'font-medium text-slate-800 dark:text-slate-200'}`}>
                      {item.item_title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Custom Item */}
              <form onSubmit={handleAddCustomChecklistItem} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Add document requirement..."
                  value={newChecklistTitle}
                  onChange={e => setNewChecklistTitle(e.target.value)}
                  className="input-field text-xs flex-1"
                />
                <button type="submit" className="btn-secondary text-xs px-3">
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: WEB KEYWORD INTELLIGENCE & ONLINE ANALYSIS MODAL */}
      {/* ========================================================= */}
      {isAnalysisModalOpen && activeAnalysisJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in-up border border-slate-200 dark:border-slate-800 my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50 dark:from-purple-950/40 dark:via-slate-900 dark:to-indigo-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 dark:bg-purple-500 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                      Web Keyword Intelligence
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      Live Search
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time web crawl analysis for unlisted custom recruitment keywords.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAnalysisModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-6 h-6"/>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Exam & Post Title banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeAnalysisJob.custom_exam_name || activeAnalysisJob.name}
                  </h4>
                  {activeAnalysisJob.post_name && (
                    <p className="text-xs font-semibold text-saffron-600 dark:text-saffron-400">
                      Post: {activeAnalysisJob.post_name}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Conducting Body: {activeAnalysisJob.custom_conducting_body || activeAnalysisJob.conducting_body || 'Direct Recruitment'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAnalyzeJob(activeAnalysisJob.id)}
                  disabled={analyzingJobId === activeAnalysisJob.id}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 self-start sm:self-center shrink-0"
                >
                  <Globe className={`w-3.5 h-3.5 ${analyzingJobId === activeAnalysisJob.id ? 'animate-spin text-saffron-500' : ''}`} />
                  <span>{analyzingJobId === activeAnalysisJob.id ? 'Re-scanning...' : 'Re-scan Web'}</span>
                </button>
              </div>

              {/* Google AI Overview Card */}
              <GoogleAiOverviewCard
                aiOverview={activeAnalysisJob.ai_overview}
                examTitle={activeAnalysisJob.custom_exam_name || activeAnalysisJob.name}
                onAdoptDates={(dates) => handleAdoptJobAiDates(activeAnalysisJob.id, dates)}
                onRefreshAi={() => handleRefreshJobAi(activeAnalysisJob.id)}
                isRefreshing={scanningAiJobId === activeAnalysisJob.id}
                showAdoptButton={true}
              />

              {activeAnalysisJob.web_analysis ? (
                <>
                  {/* Discovered Highlights Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40">
                      <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                        <span>📅</span> Expected Exam
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {activeAnalysisJob.web_analysis.expected_exam_date || 'Awaited'}
                      </div>
                      <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                        🟡 Media Reported
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40">
                      <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1">
                        <span>⏰</span> Expected Deadline
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {activeAnalysisJob.web_analysis.expected_apply_end || 'Awaited'}
                      </div>
                      <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400">
                        Online Window
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40">
                      <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
                        <span>💰</span> Application Fee
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {activeAnalysisJob.web_analysis.expected_fee || 'Varies'}
                      </div>
                      <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                        General / Category
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/40">
                      <div className="text-[11px] font-bold text-purple-700 dark:text-purple-400 mb-1 flex items-center gap-1">
                        <span>👥</span> Total Vacancies
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {activeAnalysisJob.web_analysis.expected_vacancies ? `${Number(activeAnalysisJob.web_analysis.expected_vacancies).toLocaleString()} posts` : 'Estimated'}
                      </div>
                      <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-400">
                        Public Openings
                      </span>
                    </div>
                  </div>

                  {/* Clean Structured Summary */}
                  {activeAnalysisJob.web_analysis.summary && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                        <span>📋</span> Keyword Intelligence Summary
                      </h4>
                      <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {activeAnalysisJob.web_analysis.summary}
                      </div>
                    </div>
                  )}

                  {/* Sources & Citations */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2.5 flex items-center justify-between uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-saffron-500" /> Web News & Media Articles ({activeAnalysisJob.web_analysis.sources?.length || 0})
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal lowercase">
                        crawled {new Date(activeAnalysisJob.web_analysis.analyzed_at || Date.now()).toLocaleTimeString()}
                      </span>
                    </h4>

                    {activeAnalysisJob.web_analysis.sources && activeAnalysisJob.web_analysis.sources.length > 0 ? (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {activeAnalysisJob.web_analysis.sources.map((src, idx) => (
                          <div 
                            key={idx} 
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                                {src.title}
                              </h5>
                              {src.link && (
                                <a 
                                  href={src.link} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 text-[11px] shrink-0 font-semibold"
                                >
                                  <span>{src.domain || 'View Article'}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            {src.snippet && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {src.snippet.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')}
                              </p>
                            )}
                            {(src.detected_dates?.exam_date || src.detected_dates?.last_date) && (
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 text-[10px]">
                                {src.detected_dates?.exam_date && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-100/70 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold">
                                    Exam: {src.detected_dates.exam_date}
                                  </span>
                                )}
                                {src.detected_dates?.last_date && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-semibold">
                                    Last Date: {src.detected_dates.last_date}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No specific media articles discovered yet.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No web analysis found yet for this custom job.</p>
                  <button 
                    onClick={() => handleAnalyzeJob(activeAnalysisJob.id)} 
                    className="btn-primary text-xs mt-3 inline-flex items-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5" /> Start First Web Search
                  </button>
                </div>
              )}

              {/* Transparency Notice */}
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Transparency:</strong> Online intelligence extracts tentatively reported dates from Google News and recruitment portals. They remain marked as 🟡 <em>Expected</em> until verified against the official notification PDF.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60">
              {activeAnalysisJob.web_analysis?.expected_exam_date || activeAnalysisJob.web_analysis?.expected_apply_end ? (
                <button
                  type="button"
                  onClick={() => handleApplyDiscoveredDates(activeAnalysisJob)}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply Discovered Dates to My Personal Tracker</span>
                </button>
              ) : (
                <span className="text-xs text-slate-400">Official dates will appear once detected.</span>
              )}

              <button
                type="button"
                onClick={() => setIsAnalysisModalOpen(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: 21-QUESTION DAILY INTELLIGENCE MONITOR MODAL     */}
      {/* ========================================================= */}
      <DailyIntelligenceModal 
        isOpen={isIntelligenceModalOpen}
        onClose={() => setIsIntelligenceModalOpen(false)}
        application={activeIntelligenceJob}
      />

      {/* ========================================================= */}
      {/* MODAL 6: CANDIDATE PERSONAL RESOURCES (PDFs & DOCS)       */}
      {/* ========================================================= */}
      <CandidateResourcesModal
        isOpen={isResourcesModalOpen}
        onClose={() => setIsResourcesModalOpen(false)}
        application={activeResourcesJob}
        onApplicationUpdated={handleApplicationUpdated}
      />

    </div>
  );
};

export default JobTracker;
