import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getExam, 
  applyToExam, 
  updateJob,
  deleteJob,
  createReminder, 
  checkExamApplication,
  getWebDiscoveries,
  scanWebForExam,
  scanExamAi,
  candidateUploadFile,
  candidateContributeExam
} from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/constants';
import CategoryBadge from '../components/CategoryBadge';
import DeadlineTimer from '../components/DeadlineTimer';
import GoogleAiOverviewCard from '../components/GoogleAiOverviewCard';
import { 
  Calendar, Clock, BookOpen, Link as LinkIcon, Download, Star, 
  Briefcase, FileText, Youtube, CheckCircle, IndianRupee, 
  ShieldCheck, AlertTriangle, ExternalLink, Filter, TrendingUp,
  Image as ImageIcon, ZoomIn, X, Info, Award, Edit, Plus,
  Globe, RefreshCw, Users, CheckCircle2, Upload
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend 
} from 'recharts';

const ExamDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [application, setApplication] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [photoZoomModal, setPhotoZoomModal] = useState(false);
  
  // Candidate Expected Dates & Notes Modal State
  const [isExpectedDateModalOpen, setIsExpectedDateModalOpen] = useState(false);
  const [targetExamDate, setTargetExamDate] = useState('');
  const [targetLastDate, setTargetLastDate] = useState('');
  const [candidateNotes, setCandidateNotes] = useState('');

  // Candidate Self-Upload & Contribution Modal State (No need to wait for admin)
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [contribType, setContribType] = useState('notification');
  const [contribTitle, setContribTitle] = useState('');
  const [contribSourceUrl, setContribSourceUrl] = useState('');
  const [contribFile, setContribFile] = useState(null);
  const [contribText, setContribText] = useState('');
  const [contribSubmitting, setContribSubmitting] = useState(false);
  const [contribCutoffYear, setContribCutoffYear] = useState(new Date().getFullYear());
  const [contribCutoffStage, setContribCutoffStage] = useState('Stage 1 / Prelims');
  const [contribCutoffCategory, setContribCutoffCategory] = useState('General');
  const [contribCutoffMarks, setContribCutoffMarks] = useState('');
  const [contribCutoffOutOf, setContribCutoffOutOf] = useState('100');
  const [contribExamDate, setContribExamDate] = useState('');
  const [contribApplyEnd, setContribApplyEnd] = useState('');
  const [contribApplyStart, setContribApplyStart] = useState('');

  // Web Intelligence State
  const [webDiscoveries, setWebDiscoveries] = useState([]);
  const [aiOverview, setAiOverview] = useState(null);
  const [isScanningWeb, setIsScanningWeb] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  
  // Cutoffs filter state
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedState, setSelectedState] = useState('All India');

  // PYQ filter state
  const [selectedPyqYear, setSelectedPyqYear] = useState('All');
  const [selectedPyqStage, setSelectedPyqStage] = useState('All');

  useEffect(() => {
    fetchExamDetails();
    if (user) {
      checkApplicationStatus();
    }
  }, [id, user]);

  const fetchExamDetails = async () => {
    setLoading(true);
    try {
      const data = await getExam(id);
      setExam(data || null);
      if (data?.ai_overview) {
        setAiOverview(data.ai_overview);
      }

      // Load web intelligence discoveries
      getWebDiscoveries(id)
        .then(res => {
          if (Array.isArray(res)) {
            setWebDiscoveries(res || []);
          } else if (res && res.discoveries) {
            setWebDiscoveries(res.discoveries || []);
            if (res.ai_overview) setAiOverview(res.ai_overview);
          }
        })
        .catch(err => console.warn('Could not load web discoveries:', err));
    } catch (err) {
      console.error('Failed to load exam details:', err);
      setExam(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScanWeb = async () => {
    setIsScanningWeb(true);
    setScanMessage('');
    try {
      const res = await scanWebForExam(id);
      if (res && res.discoveries) {
        setWebDiscoveries(res.discoveries);
        if (res.ai_overview) setAiOverview(res.ai_overview);
        setScanMessage(res.message || 'Scanned web: updated with latest media reports & dates!');
      } else {
        const refreshed = await getWebDiscoveries(id);
        if (Array.isArray(refreshed)) {
          setWebDiscoveries(refreshed);
        } else if (refreshed?.discoveries) {
          setWebDiscoveries(refreshed.discoveries);
          if (refreshed.ai_overview) setAiOverview(refreshed.ai_overview);
        }
        setScanMessage('Web intelligence refreshed.');
      }
    } catch (err) {
      alert(err.message || 'Failed to scan web for updates');
    } finally {
      setIsScanningWeb(false);
    }
  };

  const handleRefreshAi = async () => {
    setIsScanningWeb(true);
    setScanMessage('');
    try {
      const res = await scanExamAi(id);
      if (res && res.ai_overview) {
        setAiOverview(res.ai_overview);
        setScanMessage('✨ AI Overview successfully refreshed from live Google search!');
      }
    } catch (err) {
      alert(err.message || 'Failed to refresh AI Overview');
    } finally {
      setIsScanningWeb(false);
    }
  };

  const handleAdoptAiDates = (dates) => {
    if (!user) {
      alert('Please log in to apply these expected dates to your personal tracker.');
      return;
    }
    if (dates.last_date) setTargetLastDate(dates.last_date);
    if (dates.exam_date) setTargetExamDate(dates.exam_date);
    setCandidateNotes(`[Adopted from Google AI Overview]: Last Date ${dates.last_date || 'Awaited'}, Exam Date ${dates.exam_date || 'Awaited'}`);
    setIsExpectedDateModalOpen(true);
  };

  const handleAdoptExpectedDate = (discovery) => {
    if (!user) {
      alert('Please log in to apply these expected dates to your personal tracker.');
      return;
    }
    setTargetExamDate(discovery.expected_exam_date || '');
    setTargetLastDate(discovery.expected_apply_end || '');
    const noteText = `[Web Sourced from ${discovery.source_domain}]: ${discovery.source_title}${discovery.expected_fee ? ` | Expected Fee: ${discovery.expected_fee}` : ''}${discovery.expected_vacancies ? ` | Vacancies: ${discovery.expected_vacancies}` : ''}`;
    setCandidateNotes(noteText);
    setIsExpectedDateModalOpen(true);
  };

  const checkApplicationStatus = async () => {
    try {
      const res = await checkExamApplication(id);
      if (res && res.applied) {
        setApplication(res.application);
      } else {
        setApplication(null);
      }
    } catch (err) {
      console.warn('Could not check application status:', err);
    }
  };

  const handleApply = async () => {
    if (!user) {
      alert('Please log in to track this exam application.');
      return;
    }
    setActionLoading(true);
    try {
      await applyToExam(exam.id);
      await checkApplicationStatus();
      // Also refresh discoveries after apply
      getWebDiscoveries(id).then(d => setWebDiscoveries(d || [])).catch(() => {});
      alert('Application tracked successfully! Reminders and notifications are now enabled.');
    } catch (e) {
      alert(e.message || 'Failed to apply');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenExpectedDateModal = () => {
    if (!user) {
      alert('Please log in to set target dates and notes.');
      return;
    }
    setTargetExamDate(application?.user_exam_date || application?.user_dates?.exam_date || '');
    setTargetLastDate(application?.user_last_date || application?.user_dates?.last_date || '');
    setCandidateNotes(application?.notes || '');
    setIsExpectedDateModalOpen(true);
  };

  const handleSaveExpectedDate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (application) {
        await updateJob(application.id, {
          user_exam_date: targetExamDate || null,
          user_last_date: targetLastDate || null,
          notes: candidateNotes
        });
      } else {
        await applyToExam(exam.id, {
          user_exam_date: targetExamDate || null,
          user_last_date: targetLastDate || null,
          notes: candidateNotes
        });
      }
      await checkApplicationStatus();
      setIsExpectedDateModalOpen(false);
      alert('Target/Expected date and candidate notes saved successfully!');
    } catch (err) {
      alert(err.message || 'Failed to save date');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearExpectedDate = async () => {
    if (!application) return;
    if (window.confirm('Clear your target exam date? Countdown will be removed.')) {
      setActionLoading(true);
      try {
        await updateJob(application.id, {
          user_exam_date: null,
          user_last_date: null
        });
        setTargetExamDate('');
        setTargetLastDate('');
        await checkApplicationStatus();
        setIsExpectedDateModalOpen(false);
        alert('Target date cleared successfully!');
      } catch (err) {
        alert(err.message || 'Failed to clear date');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleRemoveTracking = async () => {
    if (!application) return;
    if (window.confirm('Are you sure you want to stop tracking this exam? This will remove all personal dates, reminders, and countdowns.')) {
      setActionLoading(true);
      try {
        await deleteJob(application.id);
        setApplication(null);
        setTargetExamDate('');
        setTargetLastDate('');
        setCandidateNotes('');
        alert('Exam removed from your tracked applications.');
      } catch (err) {
        alert(err.message || 'Failed to remove application');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleRemind = async () => {
    if (!user) {
      alert('Please log in to set reminders.');
      return;
    }
    try {
      const targetDate = exam.timeline?.examDate || exam.timeline?.applyEnd;
      if (!targetDate) {
        alert('Official dates have not been announced yet. Set your personal shift date in My Applications.');
        return;
      }
      await createReminder({ 
        exam_id: exam.id, 
        examId: exam.id,
        type: 'exam_date', 
        reminder_date: targetDate,
        title: `Reminder: ${exam.short_name || exam.name}`
      });
      alert('Reminder set successfully!');
    } catch (e) {
      alert(e.message || 'Failed to set reminder');
    }
  };

  const handleSubmitContribution = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to upload and share exam details.');
      return;
    }
    setContribSubmitting(true);
    try {
      let file_url = null;
      let file_name = null;
      let file_size = null;
      let mime_type = null;

      if (contribFile) {
        const formData = new FormData();
        formData.append('file', contribFile);
        const uploadRes = await candidateUploadFile(formData);
        file_url = uploadRes.file_url;
        file_name = uploadRes.file_name;
        file_size = uploadRes.file_size;
        mime_type = uploadRes.mime_type;
      }

      let payload = null;
      let cutoffs = null;

      if (contribType === 'cutoffs') {
        if (!contribCutoffMarks) {
          throw new Error('Please enter the cutoff marks');
        }
        cutoffs = [{
          cycle_year: Number(contribCutoffYear),
          stage_name: contribCutoffStage,
          category: contribCutoffCategory,
          marks: Number(contribCutoffMarks),
          out_of: Number(contribCutoffOutOf)
        }];
      } else if (contribType === 'dates') {
        payload = {
          exam_date: contribExamDate || null,
          apply_end: contribApplyEnd || null,
          apply_start: contribApplyStart || null,
          notes: contribText || `Candidate verified from official portal (${contribSourceUrl || 'Official Website'})`
        };
      } else {
        payload = contribText;
      }

      const res = await candidateContributeExam(exam.id, {
        type: contribType,
        title: contribTitle || `${contribType.toUpperCase()} shared by candidate`,
        source_url: contribSourceUrl || exam.official_site,
        payload,
        file_url,
        file_name,
        file_size,
        mime_type,
        cutoffs
      });

      alert(res.message || 'Details published successfully!');
      setIsContributeModalOpen(false);
      setContribFile(null);
      setContribText('');
      setContribTitle('');
      fetchExamDetails();
    } catch (err) {
      alert(err.message || 'Failed to submit details');
    } finally {
      setContribSubmitting(false);
    }
  };

  // Process cutoffs for charts and display
  const cutoffsList = exam?.historicalCutoffs || [];
  
  const availableStages = useMemo(() => {
    const set = new Set(cutoffsList.map(c => c.stage_name));
    return Array.from(set);
  }, [cutoffsList]);

  const availableStates = useMemo(() => {
    const set = new Set(cutoffsList.map(c => c.region_or_state || c.state_or_zone));
    return Array.from(set).filter(Boolean);
  }, [cutoffsList]);

  useEffect(() => {
    if (availableStages.length > 0 && selectedStage === 'All') {
      setSelectedStage(availableStages[0]);
    }
  }, [availableStages]);

  const filteredCutoffs = useMemo(() => {
    return cutoffsList.filter(c => {
      const matchStage = selectedStage === 'All' || c.stage_name === selectedStage;
      const stateVal = c.region_or_state || c.state_or_zone;
      const matchState = selectedState === 'All India' || stateVal === selectedState;
      return matchStage && matchState;
    });
  }, [cutoffsList, selectedStage, selectedState]);

  // Transform cutoffs for Recharts
  const chartData = useMemo(() => {
    const yearMap = {};
    filteredCutoffs.forEach(c => {
      const year = c.cycle_year;
      if (!yearMap[year]) {
        yearMap[year] = { year: String(year) };
      }
      yearMap[year][c.category] = Number(c.marks);
    });
    return Object.values(yearMap).sort((a, b) => Number(a.year) - Number(b.year));
  }, [filteredCutoffs]);

  // Process PYQs
  const pyqsList = exam?.pyqs || [];
  const pyqYears = useMemo(() => {
    const set = new Set(pyqsList.map(p => p.cycle_year));
    return Array.from(set).sort((a, b) => b - a);
  }, [pyqsList]);

  const pyqStages = useMemo(() => {
    const set = new Set(pyqsList.map(p => p.stage_name));
    return Array.from(set);
  }, [pyqsList]);

  const filteredPyqs = useMemo(() => {
    return pyqsList.filter(p => {
      const matchYear = selectedPyqYear === 'All' || String(p.cycle_year) === selectedPyqYear;
      const matchStage = selectedPyqStage === 'All' || p.stage_name === selectedPyqStage;
      return matchYear && matchStage;
    });
  }, [pyqsList, selectedPyqYear, selectedPyqStage]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-saffron-500"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Examination Record Not Found</h2>
        <p className="text-slate-500 text-sm max-w-md">This exam might not be registered or has been moved.</p>
        <Link to="/tracker" className="btn-primary text-sm">Return to My Applications</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview & Dates' },
    { id: 'admit-card', label: 'Admit Card' },
    { id: 'pyqs', label: `PYQs (${pyqsList.length})` },
    { id: 'cutoffs', label: 'Cutoffs & Scorecards' },
    { id: 'syllabus', label: 'Syllabus' },
    { id: 'resources', label: 'Study Resources' },
  ];

  const officialPortal = exam.official_site || exam.official_url || 'https://india.gov.in';
  const cutoffPhotoUrl = exam.cutoff_photo?.file_url;
  const notificationPdfUrl = exam.notification_pdf?.file_url || exam.notification_url;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-16 pb-16 text-slate-800 dark:text-slate-200">
      
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white py-12 px-4 sm:px-6 border-b border-navy-700/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="space-y-3.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="bg-saffron-500 text-white text-xs font-bold px-3 py-1 rounded-md shadow-sm">
                {exam.category} {exam.state ? `• ${exam.state}` : ''}
              </span>
              <span className="bg-blue-500/20 text-blue-200 text-xs font-semibold px-2.5 py-1 rounded-md border border-blue-400/30 uppercase">
                {exam.level}
              </span>
              {exam.data_status === 'verified' ? (
                <span className="bg-emerald-600/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" /> Official Verified Schedule
                </span>
              ) : (
                <span className="bg-amber-600/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Clock className="w-3.5 h-3.5" /> Notice Awaited / Will be updated soon
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              {exam.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-navy-200 text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Briefcase className="w-4 h-4 text-saffron-400" /> {exam.conducting_body}
              </span>
              <a 
                href={officialPortal} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 text-saffron-400 hover:text-saffron-300 underline font-medium"
              >
                <LinkIcon className="w-3.5 h-3.5" /> Official Portal
              </a>
            </div>

            {/* CONFIRMED vs EXPECTED EXAM DATE HIGHLIGHT BANNER */}
            <div className="mt-3 p-4 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg bg-black/25">
              {exam.data_status === 'verified' && exam.dates?.exam_date ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-white flex items-center gap-1 shadow-sm">
                      🟢 CONFIRMED EXAM DATE
                    </span>
                    <span className="text-xs text-emerald-300 font-semibold">
                      Official Notification / Commission Schedule
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-white">
                    {formatDate(exam.dates.exam_date)}
                    {exam.dates.mains_exam_date && (
                      <span className="text-sm font-normal text-slate-300 block sm:inline sm:ml-2">
                        (RPC: {formatDate(exam.dates.exam_date)} • Kalyana Karnataka / KK: {formatDate(exam.dates.mains_exam_date)})
                      </span>
                    )}
                  </div>
                  {exam.dates.notes && (
                    <p className="text-xs text-slate-300">
                      📝 {exam.dates.notes}
                    </p>
                  )}
                </div>
              ) : application?.user_exam_date ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                      🟡 TENTATIVE / EXPECTED DATE
                    </span>
                    <span className="text-xs text-amber-300 font-semibold">
                      Candidate Target / Google News Info
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-amber-200">
                    {formatDate(application.user_exam_date)}
                  </div>
                  <p className="text-xs text-slate-300">
                    Official notification is awaited. Personal study countdown enabled.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-700 text-slate-300">
                      ⚪ NOTICE AWAITED
                    </span>
                    <span className="text-xs text-slate-300">
                      Expected dates found on Google / Media below
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Official exam schedule has not been published yet. Check the Web Intelligence Tracker below for tentative media reports.
                  </p>
                </div>
              )}

              {exam.dates?.exam_date && (
                <div className="shrink-0 w-full sm:w-auto">
                  <DeadlineTimer targetDate={exam.dates.exam_date} />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[220px] w-full md:w-auto">
            {application ? (
              <div className="bg-emerald-950/80 border border-emerald-500/50 p-4 rounded-2xl text-center space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-sm font-bold">
                  <CheckCircle className="w-4 h-4" /> Application Tracked
                </div>
                <div className="text-xs text-slate-300">
                  Status: <span className="font-semibold text-white uppercase">{application.status}</span>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 text-[11px]">
                  <Link to="/tracker" className="text-saffron-400 hover:underline">
                    Manage →
                  </Link>
                  <span className="text-slate-500">•</span>
                  <button 
                    onClick={handleRemoveTracking}
                    disabled={actionLoading}
                    className="text-red-400 hover:text-red-300 hover:underline font-medium"
                  >
                    Stop Tracking
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleApply} 
                disabled={actionLoading}
                className="bg-saffron-500 hover:bg-saffron-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-saffron-500/30 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> 
                {actionLoading ? 'Tracking...' : 'Track Application'}
              </button>
            )}

            <button 
              onClick={handleRemind} 
              className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-5 rounded-2xl backdrop-blur-sm transition-all flex items-center justify-center gap-2 text-sm border border-white/10"
            >
              <Clock className="w-4 h-4 text-saffron-400" /> Set Deadline Alert
            </button>

            <button 
              onClick={() => setIsContributeModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
              title="Candidates can upload notifications, cutoffs, syllabus directly"
            >
              <Upload className="w-4 h-4 text-emerald-200" /> Upload / Share Info
            </button>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6">
        <div className="glass-card rounded-2xl flex p-1.5 mb-8 overflow-x-auto shadow-md border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-navy-900 text-white shadow-sm dark:bg-saffron-500 dark:text-white font-bold' 
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* MAIN COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <>
                {/* Official Notification Quick Callout */}
                <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-saffron-600 dark:text-saffron-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Official Recruitment Notification
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {exam.short_name} Official PDF & Guidelines
                    </h3>
                  </div>

                  {notificationPdfUrl ? (
                    <a
                      href={notificationPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary text-xs flex items-center gap-1.5 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Notification PDF
                    </a>
                  ) : (
                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50 font-semibold shrink-0">
                      Will be updated soon
                    </div>
                  )}
                </div>

                {/* REAL-TIME WEB INTELLIGENCE & EXPECTED UPDATES */}
                <div className="glass-card p-6 rounded-2xl border border-sky-300 dark:border-sky-800/70 bg-gradient-to-br from-sky-50/40 via-white to-blue-50/20 dark:from-slate-900 dark:to-slate-800/90 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-sky-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-600 text-white flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" /> Web Intelligence Tracker
                        </span>
                        <span className="text-xs text-sky-700 dark:text-sky-300 font-medium">
                          {webDiscoveries.length} Online Reports / Sources
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Web-Reported Expected Dates, Fees & Media Updates
                      </h3>
                    </div>

                    <button
                      onClick={handleScanWeb}
                      disabled={isScanningWeb}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0 border-sky-200 dark:border-sky-900 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScanningWeb ? 'animate-spin' : ''}`} />
                      {isScanningWeb ? 'Scanning Web News...' : '🔄 Scan Web for Latest News'}
                    </button>
                  </div>

                  {scanMessage && (
                    <div className="p-2.5 rounded-xl bg-sky-100/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-xs text-sky-800 dark:text-sky-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>{scanMessage}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    📡 <strong>Multi-Source Media Crawler:</strong> Scans real-time education reports, national news, and state commission circulars. Data is labeled <em>"Tentative"</em> until confirmed by administrative verification against official commission PDFs.
                  </p>

                  {/* Google AI Overview Card with Highlighted Dates */}
                  <GoogleAiOverviewCard
                    aiOverview={aiOverview}
                    examTitle={exam.short_name || exam.name}
                    onAdoptDates={handleAdoptAiDates}
                    onRefreshAi={handleRefreshAi}
                    isRefreshing={isScanningWeb}
                    showAdoptButton={true}
                  />

                  {/* Discoveries List */}
                  {webDiscoveries.length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                      <Globe className="w-8 h-8 text-sky-400 mx-auto" />
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        No online media reports crawled yet for {exam.short_name || exam.name}.
                      </p>
                      <button
                        onClick={handleScanWeb}
                        disabled={isScanningWeb}
                        className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 mt-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isScanningWeb ? 'animate-spin' : ''}`} />
                        Scan Web for Expected Dates Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                      {webDiscoveries.map(disc => (
                        <div
                          key={disc.id}
                          className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-sky-700 transition-all space-y-2.5 shadow-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                📰 {disc.source_domain || 'News Portal'}
                              </span>
                              {disc.pub_date && (
                                <span className="text-[10px] text-slate-400">
                                  {formatDate(disc.pub_date)}
                                </span>
                              )}
                            </div>

                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              disc.status === 'confirmed_by_admin'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {disc.status === 'confirmed_by_admin' ? '✓ Admin Confirmed Official' : 'Tentative / Reported Online'}
                            </span>
                          </div>

                          <a
                            href={disc.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5"
                          >
                            <span>{disc.source_title}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </a>

                          {/* Highlights Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                            {disc.expected_exam_date && (
                              <div className="p-2 rounded-lg bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
                                <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-sky-500" /> Expected Exam:
                                </span>
                                <strong className="text-slate-800 dark:text-slate-200">
                                  {disc.expected_exam_date}
                                </strong>
                              </div>
                            )}

                            {disc.expected_apply_end && (
                              <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                                <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-500" /> Expected Last Date:
                                </span>
                                <strong className="text-slate-800 dark:text-slate-200">
                                  {disc.expected_apply_end}
                                </strong>
                              </div>
                            )}

                            {disc.expected_fee && (
                              <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                                <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                                  <IndianRupee className="w-3 h-3 text-emerald-500" /> Expected Fee:
                                </span>
                                <strong className="text-slate-800 dark:text-slate-200">
                                  {disc.expected_fee}
                                </strong>
                              </div>
                            )}

                            {disc.expected_vacancies && (
                              <div className="p-2 rounded-lg bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                                <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                                  <Users className="w-3 h-3 text-purple-500" /> Expected Vacancies:
                                </span>
                                <strong className="text-slate-800 dark:text-slate-200">
                                  {disc.expected_vacancies}
                                </strong>
                              </div>
                            )}
                          </div>

                          {disc.snippet && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                              "{disc.snippet.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/^"+|"+$/g, '').trim()}"
                            </p>
                          )}

                          {/* Quick Adopt CTA */}
                          <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-[11px]">
                            <span className="text-[10px] text-slate-400">
                              Source: <a href={disc.source_url} target="_blank" rel="noreferrer" className="underline hover:text-sky-500">{disc.source_domain}</a>
                            </span>
                            <button
                              onClick={() => handleAdoptExpectedDate(disc)}
                              className="text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              + Use as My Target Date →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Candidate Expected Schedule & Notes Card */}
                <div className="glass-card p-6 rounded-2xl border border-saffron-300 dark:border-saffron-800/80 bg-gradient-to-br from-saffron-50/50 via-white to-amber-50/30 dark:from-slate-900 dark:to-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-saffron-200/60 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-saffron-500 text-white">
                          Candidate Target Schedule
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Personal Reference & News Info</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        Your Target Dates & Google / News Notes
                      </h3>
                    </div>
                    <button
                      onClick={handleOpenExpectedDateModal}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {application?.user_exam_date || application?.notes ? 'Edit Target Date / Notes' : '+ Add Target Date / Notes'}
                    </button>
                  </div>

                  {application?.user_exam_date ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Target / Expected Exam Date: {formatDate(application.user_exam_date)}
                        </span>
                        <span className="text-[10px] text-saffron-600 font-bold bg-saffron-100 dark:bg-saffron-950 px-2 py-0.5 rounded">
                          Candidate Sourced
                        </span>
                      </div>
                      <DeadlineTimer targetDate={application.user_exam_date} />
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p>Found expected dates on Google, newspapers, or education minister statements? Add your target date here for personal countdowns and reminders.</p>
                      <button onClick={handleOpenExpectedDateModal} className="text-xs font-bold text-saffron-600 dark:text-saffron-400 hover:underline shrink-0">
                        + Set Target Date →
                      </button>
                    </div>
                  )}

                  {application?.notes && (
                    <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-saffron-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      <strong className="block text-[11px] text-saffron-700 dark:text-saffron-400 font-bold">Candidate Notes / Google Info:</strong>
                      <p className="leading-relaxed">{application.notes}</p>
                    </div>
                  )}
                </div>

                {/* Important Dates Timeline */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80">
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-navy-950 dark:text-white">
                      <Calendar className="w-5 h-5 text-saffron-500"/> Official Important Dates Timeline
                    </h2>
                    {exam.data_status === 'verified' ? (
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded">
                        ✓ Verified Schedule
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Notice Awaited
                      </span>
                    )}
                  </div>

                  {exam.timeline && Object.keys(exam.timeline).length > 0 ? (
                    <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-7 pb-2">
                      {Object.entries(exam.timeline).map(([key, date]) => {
                        if (!date) return null;
                        const isPast = new Date(date) < new Date();
                        return (
                          <div key={key} className="relative pl-8">
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                              isPast ? 'bg-emerald-500' : 'bg-saffron-500 ring-4 ring-saffron-100 dark:ring-saffron-900/40'
                            }`}></div>
                            <h4 className="font-bold text-sm capitalize text-slate-800 dark:text-slate-100">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                              {formatDate(date)}
                            </p>
                            {!isPast && (
                              <div className="mt-2.5 inline-block">
                                <DeadlineTimer targetDate={date} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                      <Clock className="w-8 h-8 mx-auto text-amber-500" />
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        Will be updated soon
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Official commission dates for this cycle have not been announced yet. Track this exam to be notified immediately when dates are verified, or enter your personal shift / Google news date.
                      </p>
                      <button
                        onClick={handleOpenExpectedDateModal}
                        className="btn-primary text-xs mx-auto flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {application ? 'Add Expected Date / Notes from Google' : 'Track & Add Expected Date from Google'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ADMIT CARD TAB */}
            {activeTab === 'admit-card' && (
              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-navy-950 dark:text-white">
                      <FileText className="w-5 h-5 text-saffron-500" /> Admit Card / Hall Ticket Status
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Direct release alerts and official commission login portal links.
                    </p>
                  </div>

                  <div>
                    {exam.admit_card_url ? (
                      <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Live / Released
                      </span>
                    ) : (
                      <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold text-xs">
                        Will be updated soon
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Commission Admit Card Download Server</h4>
                      <p className="text-xs text-slate-500">Log in with your candidate Registration ID and Password / DOB.</p>
                    </div>
                    <a
                      href={exam.admit_card_url || officialPortal}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary text-xs flex items-center gap-1.5 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Commission Portal
                    </a>
                  </div>
                </div>

                {/* Candidate Examination Day Checklist */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-saffron-500" /> Mandatory Examination Day Items
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                      <strong className="block text-blue-900 dark:text-blue-300 mb-1">1. Printed Copy of Admit Card</strong>
                      Clear printout with visible photograph, barcode, and roll number.
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                      <strong className="block text-blue-900 dark:text-blue-300 mb-1">2. Original Government Photo ID</strong>
                      Aadhaar Card, Voter ID, Passport, PAN Card, or Driving License.
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                      <strong className="block text-blue-900 dark:text-blue-300 mb-1">3. Two Passport Photos</strong>
                      Identical to the photograph uploaded during online registration.
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                      <strong className="block text-blue-900 dark:text-blue-300 mb-1">4. Shift Reporting Time</strong>
                      Entry gates close strictly 30-45 minutes before examination starts.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PYQS TAB */}
            {activeTab === 'pyqs' && (
              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-navy-950 dark:text-white">
                      <BookOpen className="w-5 h-5 text-saffron-500" /> Previous Year Question Papers (PYQs)
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Verified official master question papers and answer keys.
                    </p>
                  </div>

                  {pyqYears.length > 1 && (
                    <select
                      value={selectedPyqYear}
                      onChange={(e) => setSelectedPyqYear(e.target.value)}
                      className="input-field text-xs py-1.5"
                    >
                      <option value="All">All Years</option>
                      {pyqYears.map(yr => <option key={yr} value={String(yr)}>{yr}</option>)}
                    </select>
                  )}
                </div>

                {filteredPyqs.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPyqs.map(paper => (
                      <div key={paper.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold px-2 py-0.5 bg-navy-100 text-navy-800 dark:bg-navy-900 dark:text-saffron-300 rounded">
                              {paper.cycle_year}
                            </span>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              {paper.stage_name} {paper.shift ? `• ${paper.shift}` : ''}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{paper.subject}</h4>
                          <p className="text-[11px] text-slate-500">Source: {paper.attribution || 'Official Commission'}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={paper.question_paper_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
                          >
                            <Download className="w-3.5 h-3.5" /> Paper PDF
                          </a>
                          {paper.answer_key_url && (
                            <a
                              href={paper.answer_key_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Answer Key
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-1.5">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-400" />
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Will be updated soon</h4>
                    <p className="text-xs text-slate-500">Master question papers for this cycle are currently being verified.</p>
                  </div>
                )}
              </div>
            )}

            {/* CUTOFFS TAB */}
            {activeTab === 'cutoffs' && (
              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-navy-950 dark:text-white">
                      <TrendingUp className="w-5 h-5 text-saffron-500" /> Official Cutoffs & Scorecards
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Category-wise qualifying scores verified directly against commission announcements.
                    </p>
                  </div>

                  {availableStages.length > 1 && (
                    <select
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value)}
                      className="input-field text-xs py-1.5"
                    >
                      {availableStages.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  )}
                </div>

                {/* Sub-section 1: Official Cutoff Scorecard Photo (if uploaded by admin) */}
                {cutoffPhotoUrl && (
                  <div className="p-4 rounded-2xl border border-saffron-200 dark:border-saffron-900/40 bg-saffron-50/40 dark:bg-slate-900/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-saffron-800 dark:text-saffron-300 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" /> Official Cutoff Scorecard Document
                      </span>
                      <button 
                        onClick={() => setPhotoZoomModal(true)} 
                        className="text-xs font-bold text-saffron-600 dark:text-saffron-400 hover:underline flex items-center gap-1"
                      >
                        <ZoomIn className="w-3.5 h-3.5" /> Full Resolution
                      </button>
                    </div>

                    <div 
                      onClick={() => setPhotoZoomModal(true)}
                      className="cursor-pointer max-h-72 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group relative"
                    >
                      <img 
                        src={cutoffPhotoUrl} 
                        alt="Official Cutoff Document" 
                        className="w-full object-contain bg-white dark:bg-slate-950 group-hover:scale-[1.01] transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-3 py-1.5 bg-black/75 text-white text-xs font-bold rounded-lg backdrop-blur-sm">Click to Zoom</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-section 2: Cutoff Chart & Table */}
                {chartData.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-saffron-500" /> Multi-Year Category Trends
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="year" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <RechartsTooltip />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Bar dataKey="UR" fill="#f97316" radius={[4, 4, 0, 0]} name="UR" />
                          <Bar dataKey="OBC" fill="#3b82f6" radius={[4, 4, 0, 0]} name="OBC" />
                          <Bar dataKey="EWS" fill="#10b981" radius={[4, 4, 0, 0]} name="EWS" />
                          <Bar dataKey="SC" fill="#a855f7" radius={[4, 4, 0, 0]} name="SC" />
                          <Bar dataKey="ST" fill="#ec4899" radius={[4, 4, 0, 0]} name="ST" />
                          <Bar dataKey="GM" fill="#eab308" radius={[4, 4, 0, 0]} name="GM (Kar)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {filteredCutoffs.length > 0 ? (
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                          <th className="p-3 rounded-l-lg">Cycle Year</th>
                          <th className="p-3">Stage</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Cutoff Marks</th>
                          <th className="p-3">Out Of</th>
                          <th className="p-3 rounded-r-lg">Source Document</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredCutoffs.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">{item.cycle_year}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">{item.stage_name}</td>
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{item.category}</td>
                            <td className="p-3 font-bold text-saffron-600 dark:text-saffron-400">{item.marks}</td>
                            <td className="p-3 text-slate-500">{item.out_of}</td>
                            <td className="p-3 text-[11px] text-slate-500 italic">
                              <a href={item.source_url} target="_blank" rel="noreferrer" className="underline hover:text-saffron-600">
                                Official Source Link
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : !cutoffPhotoUrl ? (
                  <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-1.5">
                    <TrendingUp className="w-8 h-8 mx-auto text-slate-400" />
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Will be updated soon</h4>
                    <p className="text-xs text-slate-500">Official cutoffs for this recruitment cycle have not been published yet.</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* SYLLABUS TAB */}
            {activeTab === 'syllabus' && (
              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-navy-950 dark:text-white">
                    <BookOpen className="w-5 h-5 text-saffron-500"/> Official Exam Pattern & Syllabus
                  </h2>
                  {exam.syllabus_source_url && (
                    <a href={exam.syllabus_source_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-saffron-600 hover:underline">
                      Official Syllabus Source →
                    </a>
                  )}
                </div>

                {exam.syllabus && exam.syllabus.length > 0 ? (
                  <div className="space-y-4">
                    {exam.syllabus.map((subject, idx) => (
                      <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
                        <div className="bg-slate-100/70 dark:bg-slate-800 px-5 py-3 font-bold text-sm border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                          {subject.subject}
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {(subject.topics || []).map((topic, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-saffron-500 mt-1.5 shrink-0"></div>
                              <span className="text-slate-700 dark:text-slate-300">{topic}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-1.5">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-400" />
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Will be updated soon</h4>
                    <p className="text-xs text-slate-500">Official syllabus document will be uploaded with verified chapter topics.</p>
                  </div>
                )}
              </div>
            )}

            {/* STUDY RESOURCES TAB */}
            {activeTab === 'resources' && (
              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-navy-950 dark:text-white">
                  <BookOpen className="w-5 h-5 text-saffron-500"/> Recommended Study Resources
                </h2>
                <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-1.5">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-400" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Will be updated soon</h4>
                  <p className="text-xs text-slate-500">Standard reference book lists and verified lecture resources will be updated soon.</p>
                </div>
              </div>
            )}

          </div>

          {/* SIDEBAR COLUMN */}
          <div className="space-y-6">
            
            {/* Quick Links Card */}
            <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-saffron-500" /> Official Commission Portals
              </h3>
              
              <div className="space-y-2 text-xs font-medium">
                <a 
                  href={officialPortal} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors border border-slate-100 dark:border-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-saffron-500"/> Commission Website
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">gov.in</span>
                </a>

                {notificationPdfUrl && (
                  <a 
                    href={notificationPdfUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors border border-slate-100 dark:border-slate-800"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-saffron-500"/> Official Notification
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">PDF</span>
                  </a>
                )}
              </div>
            </div>

            {/* Official Data Trust Card */}
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs">
              <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" /> Official Data Trust
              </div>
              <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed text-[11px]">
                Every data point on this portal is verified against official government notifications. We never show synthetic or guessed dates.
              </p>
            </div>

          </div>

        </div>

        {/* FOOTER MANDATORY DISCLAIMER */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            ⚠️ Disclaimer: Always confirm on the official website.
          </p>
          <p className="text-[11px]">
            Source: <a href={officialPortal} target="_blank" rel="noreferrer" className="underline hover:text-saffron-600">{officialPortal}</a>
            {exam.last_verified_at && ` • Last verified: ${formatDate(exam.last_verified_at)}`}
          </p>
        </div>

      </div>

      {/* CANDIDATE EXPECTED DATES & NOTES MODAL */}
      {isExpectedDateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-saffron-100 dark:bg-saffron-950/60 text-saffron-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Candidate Target Schedule & Notes
                  </h3>
                  <p className="text-xs text-slate-500">
                    {exam?.short_name || exam?.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsExpectedDateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveExpectedDate} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-saffron-50/80 dark:bg-saffron-950/20 border border-saffron-200/60 dark:border-saffron-900/40 text-xs text-saffron-800 dark:text-saffron-300">
                <span className="font-bold block mb-1">💡 Candidate Sourced Info:</span>
                Until official commission notifications are issued, you can record expected dates and preparation notes from Google, newspapers, or official announcements for personal countdowns and study tracking.
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target / Expected Exam Date
                </label>
                <input
                  type="date"
                  value={targetExamDate}
                  onChange={(e) => setTargetExamDate(e.target.value)}
                  className="input-field text-xs w-full"
                />
                <p className="text-[10px] text-slate-400">
                  Used to generate your personal exam countdown timer.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target / Expected Last Date to Apply
                </label>
                <input
                  type="date"
                  value={targetLastDate}
                  onChange={(e) => setTargetLastDate(e.target.value)}
                  className="input-field text-xs w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Candidate Notes / Google / News Reference
                </label>
                <textarea
                  rows={3}
                  value={candidateNotes}
                  onChange={(e) => setCandidateNotes(e.target.value)}
                  placeholder="e.g. As per news report, KEA expected to conduct Kannada exam first, followed by Mains. Syllabus focused on B.Ed Kannada/Maths."
                  className="input-field text-xs w-full resize-none"
                />
                <p className="text-[10px] text-slate-400">
                  Keep track of news articles, coaching updates, or syllabus focus areas.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                {application?.user_exam_date ? (
                  <button
                    type="button"
                    onClick={handleClearExpectedDate}
                    disabled={actionLoading}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                  >
                    Clear Target Date
                  </button>
                ) : <span />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsExpectedDateModalOpen(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Save Target & Notes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL RESOLUTION ZOOM MODAL FOR CUTOFF PHOTO */}
      {photoZoomModal && cutoffPhotoUrl && (
        <div 
          onClick={() => setPhotoZoomModal(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-2xl">
            <button 
              onClick={() => setPhotoZoomModal(false)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={cutoffPhotoUrl} 
              alt="Official Cutoff Full Document" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* CANDIDATE SELF-UPLOAD & CONTRIBUTION MODAL (No need to wait for admin) */}
      {isContributeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  Direct Candidate Upload
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  Upload & Share Exam Details
                </h3>
              </div>
              <button 
                onClick={() => setIsContributeModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitContribution} className="p-6 space-y-4 overflow-y-auto">
              {/* Type Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select what you want to upload / share:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'notification', label: '📄 Notification' },
                    { id: 'cutoffs', label: '📊 Cutoff Marks' },
                    { id: 'syllabus', label: '📚 Syllabus' },
                    { id: 'dates', label: '📅 Exam Dates' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setContribType(t.id)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                        contribType === t.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Title / Subject:
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${exam?.short_name || 'Exam'} Official Notice 2026`}
                  value={contribTitle}
                  onChange={(e) => setContribTitle(e.target.value)}
                  className="input-field text-xs w-full"
                />
              </div>

              {/* Specific Fields for Cutoffs */}
              {contribType === 'cutoffs' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Cutoff Marks Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Cycle Year</label>
                      <input
                        type="number"
                        value={contribCutoffYear}
                        onChange={(e) => setContribCutoffYear(e.target.value)}
                        className="input-field text-xs w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Exam Stage</label>
                      <input
                        type="text"
                        value={contribCutoffStage}
                        onChange={(e) => setContribCutoffStage(e.target.value)}
                        className="input-field text-xs w-full"
                        placeholder="e.g. Prelims / Tier 1"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Category</label>
                      <select
                        value={contribCutoffCategory}
                        onChange={(e) => setContribCutoffCategory(e.target.value)}
                        className="input-field text-xs w-full"
                      >
                        <option value="General">General / UR / GM</option>
                        <option value="OBC">OBC</option>
                        <option value="EWS">EWS</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="2A">2A (Karnataka)</option>
                        <option value="2B">2B (Karnataka)</option>
                        <option value="3A">3A (Karnataka)</option>
                        <option value="3B">3B (Karnataka)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Cutoff Marks</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 132.5"
                        value={contribCutoffMarks}
                        onChange={(e) => setContribCutoffMarks(e.target.value)}
                        className="input-field text-xs w-full"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Specific Fields for Dates */}
              {contribType === 'dates' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Exam Schedule Dates</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Confirmed / Target Exam Date</label>
                      <input
                        type="date"
                        value={contribExamDate}
                        onChange={(e) => setContribExamDate(e.target.value)}
                        className="input-field text-xs w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Last Date to Apply</label>
                      <input
                        type="date"
                        value={contribApplyEnd}
                        onChange={(e) => setContribApplyEnd(e.target.value)}
                        className="input-field text-xs w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Document / Screenshot */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Official File / Screenshot (PDF, JPEG, PNG - Optional):
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => setContribFile(e.target.files[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              {/* Official Source URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Portal / Notification Source Link:
                </label>
                <input
                  type="url"
                  placeholder={exam?.official_site || 'https://commission.gov.in'}
                  value={contribSourceUrl}
                  onChange={(e) => setContribSourceUrl(e.target.value)}
                  className="input-field text-xs w-full"
                />
              </div>

              {/* Syllabus / Notes text */}
              {(contribType === 'syllabus' || contribType === 'notification') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Details / Topics / Summary:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter key topics, eligibility details, or notes..."
                    value={contribText}
                    onChange={(e) => setContribText(e.target.value)}
                    className="input-field text-xs w-full"
                  />
                </div>
              )}

              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Once submitted, your contribution is published immediately for all aspirants. No need to wait for admin approval!
              </p>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsContributeModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contribSubmitting}
                  className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700"
                >
                  {contribSubmitting ? 'Uploading & Publishing...' : 'Publish Immediately →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExamDetail;
