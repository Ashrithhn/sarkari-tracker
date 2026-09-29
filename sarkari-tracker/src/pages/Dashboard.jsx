import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FileText, Calendar, Bell, Plus, Award, CheckCircle, 
  Clock, ShieldCheck, ExternalLink, ArrowRight, Search,
  Building2, LogIn, UserPlus, CheckCircle2, AlertCircle, Sparkles, Filter, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getJobStats, getNotifications, getJobs, getExams } from '../utils/api';
import { EXAM_CATEGORIES, formatDate } from '../utils/constants';
import { checkAndDispatchDailyReminders } from '../utils/browserNotifications';
import StatCard from '../components/StatCard';
import DeadlineTimer from '../components/DeadlineTimer';
import JobCard from '../components/JobCard';
import { EXAM_SUGGESTIONS } from '../data/examSuggestions';

const POPULAR_KARNATAKA_SUGGESTIONS = [
  { label: 'KEA Village Admin (VAO)', query: 'KEA Village Administrative Officer' },
  { label: 'KPSC KAS', query: 'KPSC KAS' },
  { label: 'Karnataka PSI', query: 'Karnataka Police Sub-Inspector' },
  { label: 'Police Constable', query: 'Karnataka Police Constable' },
  { label: 'KPTCL AE', query: 'KPTCL Assistant Engineer' },
  { label: 'BESCOM Assistant', query: 'BESCOM' },
  { label: 'High Court', query: 'Karnataka High Court' },
  { label: 'FDA / SDA', query: 'Karnataka FDA' }
];

const POPULAR_CENTRAL_SUGGESTIONS = [
  { label: 'UPSC CSE', query: 'UPSC Civil Services' },
  { label: 'SSC CGL', query: 'SSC CGL' },
  { label: 'SSC CHSL', query: 'SSC CHSL' },
  { label: 'IBPS PO', query: 'IBPS PO' },
  { label: 'SBI Clerk', query: 'SBI Clerk' },
  { label: 'RRB NTPC', query: 'RRB NTPC' },
  { label: 'UPSC CDS', query: 'UPSC CDS' },
  { label: 'ISRO / DRDO', query: 'ISRO' }
];

const Dashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [exams, setExams] = useState(EXAM_SUGGESTIONS);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState('Overview');

  // Exam Search & Filter on Dashboard
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'All');
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    const qSearch = searchParams.get('search');
    if (qSearch !== null) {
      setSearchTerm(qSearch);
      setActiveTab('Exam Directory');
    }
    const qCat = searchParams.get('category');
    if (qCat !== null) {
      setSelectedCategory(qCat);
      setActiveTab('Exam Directory');
    }
  }, [searchParams]);

  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [examsData, notifsData] = await Promise.all([
          getExams().catch(() => []),
          getNotifications().catch(() => [])
        ]);
        setExams(examsData || []);
        const notifList = Array.isArray(notifsData) ? notifsData : [];
        setNotifications(notifList.slice(0, 6));

        if (notifList.length > 0) {
          checkAndDispatchDailyReminders(notifList);
        }

        if (user) {
          const [statsData, jobsData] = await Promise.all([
            getJobStats().catch(() => ({ totalApplied: 0, upcomingExams: 0, admitCardsAvailable: 0, resultsPending: 0 })),
            getJobs().catch(() => [])
          ]);
          setStats(statsData);
          setJobs(jobsData || []);
        } else {
          setStats(null);
          setJobs([]);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Compute upcoming deadlines
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const list = [];

    if (isAuthenticated) {
      if (jobs && jobs.length > 0) {
        jobs.forEach(job => {
          const examName = job.custom_exam_name || job.name || job.short_name || 'Exam';
          const lastDate = job.effectiveLastDate || job.user_last_date;
          if (lastDate && new Date(lastDate) >= now && (job.status === 'Applied' || job.status === 'applied')) {
            const daysLeft = Math.ceil((new Date(lastDate) - now) / (1000 * 60 * 60 * 24));
            list.push({
              id: `last_${job.id}`,
              title: `${examName} - Deadline`,
              targetDate: lastDate,
              type: 'deadline',
              daysRemaining: daysLeft,
              isUserJob: true
            });
          }

          const examDate = job.effectiveExamDate || job.user_exam_date;
          if (examDate && new Date(examDate) >= now) {
            const daysToExam = Math.ceil((new Date(examDate) - now) / (1000 * 60 * 60 * 24));
            list.push({
              id: `exam_${job.id}`,
              title: `${examName} - Exam Date`,
              targetDate: examDate,
              type: 'exam',
              daysRemaining: daysToExam,
              isUserJob: true
            });
          }
        });
      }
      return list.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate)).slice(0, 4);
    }

    if (exams && exams.length > 0) {
      exams.forEach(ex => {
        const exName = ex.short_name || ex.name;
        const lastDate = ex.dates?.apply_end || ex.apply_end;
        if (lastDate && !isNaN(new Date(lastDate).getTime()) && new Date(lastDate) >= now) {
          list.push({
            id: `reg_last_${ex.id}`,
            title: `${exName} - Application Deadline`,
            targetDate: lastDate,
            type: 'deadline',
            examId: ex.id
          });
        }
        const examDate = ex.dates?.exam_date || ex.exam_date;
        if (examDate && !isNaN(new Date(examDate).getTime()) && new Date(examDate) >= now) {
          list.push({
            id: `reg_exam_${ex.id}`,
            title: `${exName} - Examination Date`,
            targetDate: examDate,
            type: 'exam',
            examId: ex.id
          });
        }
      });
    }

    return list.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate)).slice(0, 4);
  }, [jobs, exams, isAuthenticated]);

  const filteredExams = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const tokens = term ? term.split(/\s+/).filter(Boolean) : [];

    return exams.filter(ex => {
      const searchableText = `${ex.name || ''} ${ex.short_name || ''} ${ex.conducting_body || ''} ${ex.category || ''} ${ex.state || ''} ${ex.level || ''}`.toLowerCase();

      const matchesSearch = tokens.length === 0 || tokens.every(token => searchableText.includes(token));
      
      const matchesCat = selectedCategory === 'All' || 
        ex.category === selectedCategory ||
        (selectedCategory === 'Karnataka' && (ex.category === 'Karnataka' || ex.state === 'Karnataka' || ex.level === 'state'));

      return matchesSearch && matchesCat;
    });
  }, [exams, searchTerm, selectedCategory]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-3 border-saffron-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Loading portal data...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fade-in max-w-6xl mx-auto pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
            Managing Applications & Schedules
          </h1>
          <p className="text-slate-500 dark:text-neutral-400 mt-1 text-xs sm:text-sm font-medium">
            {isAuthenticated 
              ? `Welcome back, ${user?.name || 'Candidate'}! Real-time recruitment milestones.`
              : 'SarkariTracker 🇮🇳 — Verified commission exam tracking across India & Karnataka.'}
          </p>
        </div>
        
        {isAuthenticated ? (
          <Link 
            to="/tracker?add=1" 
            className="rounded-full bg-neutral-950 hover:bg-neutral-900 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black py-2.5 px-6 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all shrink-0 hover:scale-102 active:scale-98"
          >
            <Plus size={16} className="stroke-[2.5]" /> Add Application
          </Link>
        ) : (
          <Link 
            to="/login" 
            className="rounded-full bg-neutral-950 hover:bg-neutral-900 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black py-2.5 px-6 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all shrink-0 hover:scale-102 active:scale-98"
          >
            <LogIn size={16} /> Sign In
          </Link>
        )}
      </div>

      {/* Pill Tab Navigation */}
      <div className="pill-tab-track flex items-center gap-1.5 bg-slate-100/90 dark:bg-[#141414] p-1.5 rounded-full w-max border border-slate-200/80 dark:border-neutral-800 overflow-x-auto max-w-full shadow-2xs">
        {['Overview', 'Exam Directory'].concat(isAuthenticated ? ['My Applications'] : []).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'pill-tab-active bg-neutral-950 dark:bg-white text-white dark:text-black hover:text-white dark:hover:text-black shadow-sm' 
                : 'pill-tab text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'Overview' && (
        <div className="space-y-8">
          
          {/* Stats Row (Rounded [32px] with Prominent Battery Progress Bars) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <StatCard 
              title="My Applications" 
              value={isAuthenticated ? jobs.length : 0} 
              maxValue={10}
              icon={FileText} 
              subtitle={isAuthenticated ? `${jobs.length} active application${jobs.length === 1 ? '' : 's'}` : "Sign in to track jobs"}
            />
            <StatCard 
              title="Upcoming Test Dates" 
              value={isAuthenticated 
                ? jobs.filter(j => {
                    const d = j.effectiveExamDate || j.user_exam_date;
                    return d && !isNaN(new Date(d).getTime()) && new Date(d) >= new Date();
                  }).length
                : upcomingDeadlines.length} 
              maxValue={6}
              icon={Calendar} 
              subtitle="Scheduled commission tests"
            />
            <div className="sm:col-span-2 lg:col-span-1">
              <StatCard 
                title="AI Intelligence" 
                value={isAuthenticated ? "Real-time" : "Verified"}
                icon={Sparkles} 
                subtitle="Google AI Overview synced schedules."
                accent={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left: Quick Suggestions Sections */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Karnataka State Suggestions */}
              <div className="p-5 sm:p-6 rounded-[28px] sm:rounded-[34px] bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    Karnataka State Recruitment
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">65+ State Exams</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_KARNATAKA_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveTab('Exam Directory');
                        setSearchTerm(item.query);
                      }}
                      className="px-3.5 py-2 rounded-full text-xs font-semibold bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200/80 dark:border-neutral-800 hover:border-red-400 dark:hover:border-red-400 text-slate-700 dark:text-neutral-200 transition-all hover:scale-102"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* All-India Central Suggestions */}
              <div className="p-5 sm:p-6 rounded-[28px] sm:rounded-[34px] bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    All-India Recruitment
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">95+ Central Exams</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_CENTRAL_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveTab('Exam Directory');
                        setSearchTerm(item.query);
                      }}
                      className="px-3.5 py-2 rounded-full text-xs font-semibold bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200/80 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-blue-400 text-slate-700 dark:text-neutral-200 transition-all hover:scale-102"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Browse CTA Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-[26px] bg-slate-100/70 dark:bg-[#161616] border border-slate-200/80 dark:border-neutral-800 text-xs">
                <p className="text-slate-600 dark:text-neutral-300 text-center sm:text-left font-medium">
                  💡 <strong>Search or select any examination</strong> to inspect syllabus, official commission portals, or track application deadlines.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('Exam Directory');
                    setSearchTerm('');
                  }}
                  className="rounded-full bg-white dark:bg-[#202020] border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-[#262626] text-xs font-bold py-2.5 px-5 whitespace-nowrap shrink-0 transition-all shadow-2xs"
                >
                  Browse All 160+ Exams
                </button>
              </div>

            </div>

            {/* Right: Deadlines & Notifications */}
            <div className="space-y-6">
              
              {/* Upcoming Deadlines Card */}
              <div className="bg-white dark:bg-[#121212] rounded-[28px] sm:rounded-[34px] border border-slate-200/80 dark:border-neutral-800 p-5 sm:p-6 shadow-2xs">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-rose-500" /> Upcoming Deadlines
                </h2>
                <div className="space-y-3">
                  {upcomingDeadlines.length > 0 ? (
                    upcomingDeadlines.map(item => (
                      <div key={item.id} className="flex flex-col justify-between gap-2 p-3.5 rounded-2xl bg-rose-50/60 dark:bg-[#1a1114] border border-rose-100 dark:border-rose-950/60">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">{item.title}</h4>
                          {item.daysRemaining !== undefined && (
                            <span className={`shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              item.daysRemaining <= 3 
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                                : item.daysRemaining <= 7
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {item.daysRemaining === 0 ? 'Today!' : `${item.daysRemaining}d left`}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">{formatDate(item.targetDate)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6 font-medium">No immediate deadlines.</p>
                  )}
                </div>
              </div>

              {/* Important Updates Card */}
              <div className="bg-white dark:bg-[#121212] rounded-[28px] sm:rounded-[34px] border border-slate-200/80 dark:border-neutral-800 p-5 sm:p-6 shadow-2xs">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-saffron-500" /> Important Updates
                  </h2>
                  <Link to="/notifications" className="text-xs font-bold text-saffron-600 dark:text-saffron-400 hover:underline">
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div key={notif.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181818] border border-slate-100 dark:border-neutral-800 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{notif.title}</span>
                        </div>
                        <p className="text-slate-500 dark:text-neutral-400 line-clamp-2 text-[11px] leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 block pt-0.5">
                          {formatDate(notif.created_at || notif.date || Date.now())}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6 font-medium">No new commission updates.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- EXAM DIRECTORY TAB --- */}
      {activeTab === 'Exam Directory' && (
        <div className="space-y-6">
          {/* Hero Band with Deep Black & Large Rounded Corners */}
          <div className="bg-[#0a0a0a] dark:bg-[#080808] border border-neutral-800 rounded-[32px] sm:rounded-[42px] py-10 px-6 text-center relative mt-2 shadow-md">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              Search Government Examinations
            </h2>
            <p className="text-neutral-300 dark:text-neutral-400 text-xs sm:text-sm font-medium">160+ official Indian & Karnataka commission notifications</p>
          </div>
          
          {/* Overlapping Pill Search Bar */}
          <div className="max-w-2xl mx-auto -mt-10 relative z-10 px-4">
            <div className="relative group">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-saffron-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search exam or commission (KEA, KPSC, Police, UPSC)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 text-xs sm:text-sm rounded-full bg-white dark:bg-[#161616] shadow-xl border border-slate-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-saffron-500 text-slate-900 dark:text-white placeholder-slate-400"
              />
              {searchTerm && (
                <button 
                  type="button" 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 bg-slate-100 dark:bg-[#222222] rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-2 no-scrollbar text-xs sm:text-sm px-1">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full font-bold shrink-0 transition-all whitespace-nowrap ${
                selectedCategory === 'All'
                  ? 'bg-neutral-950 dark:bg-white text-white dark:text-black shadow-sm'
                  : 'bg-slate-100 dark:bg-[#141414] text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-[#202020]'
              }`}
            >
              All Exams ({exams.length})
            </button>
            {EXAM_CATEGORIES.map(cat => {
              const count = exams.filter(e => cat.id === 'Karnataka' ? (e.category === 'Karnataka' || e.state === 'Karnataka' || e.level === 'state') : e.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setVisibleCount(12); }}
                  className={`px-4 py-2 rounded-full font-bold shrink-0 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-neutral-950 dark:bg-white text-white dark:text-black shadow-sm'
                      : 'bg-slate-100 dark:bg-[#141414] text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-[#202020]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selectedCategory === cat.id ? 'bg-white/25 text-white dark:bg-black/20 dark:text-black' : 'bg-slate-200 dark:bg-[#262626] text-slate-600 dark:text-neutral-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 px-1 pt-1 font-medium">
            <span>
              Found <strong>{filteredExams.length}</strong> matching examinations
              {searchTerm.trim() ? ` for "${searchTerm.trim()}"` : ''}
              {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
            </span>
          </div>

          {/* Exam List Cards with High-Contrast Rounded Corners */}
          {filteredExams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredExams.slice(0, visibleCount).map(exam => {
                const isKarnataka = exam.category === 'Karnataka' || exam.state === 'Karnataka' || exam.level === 'state';
                return (
                  <div 
                    key={exam.id || exam.short_name}
                    className="bg-white dark:bg-[#121212] rounded-[26px] sm:rounded-[32px] border border-slate-200/80 dark:border-neutral-800 p-5 flex flex-col justify-between shadow-2xs hover:border-saffron-400 dark:hover:border-saffron-500 transition-all"
                  >
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isKarnataka 
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/40' 
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40'
                        }`}>
                          {isKarnataka ? 'Karnataka' : (exam.category || 'Central')}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Official
                        </span>
                      </div>
                      
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 mb-1">
                        {exam.short_name} - {exam.name}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-neutral-400 line-clamp-1 mb-4 font-medium">
                        {exam.conducting_body} {exam.state ? `• ${exam.state}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-neutral-800">
                      <Link
                        to={`/tracker?add=1&exam=${encodeURIComponent(exam.short_name)}`}
                        className="flex-1 text-center py-2 px-3 rounded-full bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Track
                      </Link>
                      <Link
                        to={`/exams/${exam.id}`}
                        className="px-4 py-2 rounded-full border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-[#1c1c1c] text-slate-700 dark:text-neutral-200 text-xs font-bold transition-colors"
                      >
                        Syllabus
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4 rounded-[28px] border border-dashed border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-[#121212] space-y-3">
              <Search className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {searchTerm ? `No exams found for "${searchTerm}"` : 'No exams found in this category'}
              </h4>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                className="mt-2 text-xs font-bold px-5 py-2 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 hover:bg-slate-300 transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}

          {filteredExams.length > visibleCount && (
            <div className="flex justify-center pt-4">
              <button 
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="px-6 py-2.5 rounded-full bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 text-xs font-bold transition-all shadow-xs"
              >
                Load More (+12 Exams)
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- MY APPLICATIONS TAB --- */}
      {activeTab === 'My Applications' && isAuthenticated && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-saffron-500" /> My Applications
            </h2>
            <Link to="/tracker" className="text-xs sm:text-sm font-bold text-saffron-600 dark:text-saffron-400 hover:underline flex items-center gap-1">
              Manage All ({jobs.length}) <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map(job => (
                <JobCard key={job.id} application={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 rounded-[32px] bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-neutral-800 space-y-4 shadow-sm">
              <FileText className="w-12 h-12 mx-auto text-slate-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Applications Tracked Yet</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                Pick any exam from the directory or add a custom job post to track dates and checklists.
              </p>
              <Link 
                to="/tracker?add=1" 
                className="rounded-full bg-neutral-950 dark:bg-white text-white dark:text-black text-xs font-bold py-2.5 px-6 inline-flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Application
              </Link>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Dashboard;
