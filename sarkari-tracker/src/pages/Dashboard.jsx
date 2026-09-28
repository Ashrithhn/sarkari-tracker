import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Calendar, Bell, Plus, Award, CheckCircle, 
  Clock, ShieldCheck, ExternalLink, ArrowRight, Search,
  Building2, LogIn, UserPlus, CheckCircle2, AlertCircle, Sparkles, Filter
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getJobStats, getNotifications, getJobs, getExams } from '../utils/api';
import { EXAM_CATEGORIES, formatDate } from '../utils/constants';
import StatCard from '../components/StatCard';
import DeadlineTimer from '../components/DeadlineTimer';
import JobCard from '../components/JobCard';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Exam Search & Filter on Dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Always fetch public exams & official notifications
        const [examsData, notifsData] = await Promise.all([
          getExams().catch(() => []),
          getNotifications().catch(() => [])
        ]);
        setExams(examsData || []);
        setNotifications((notifsData || []).slice(0, 6));

        // If authenticated, also fetch user's personal tracking records
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

  // Compute upcoming deadlines: ONLY from user's tracked applications if logged in; from registry if guest
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const list = [];

    // 1. Authenticated User: ONLY show deadlines for currently tracked applications
    if (isAuthenticated) {
      if (jobs && jobs.length > 0) {
        jobs.forEach(job => {
          const examName = job.custom_exam_name || job.name || job.short_name || 'Exam';
          const lastDate = job.effectiveLastDate || job.user_last_date;
          if (lastDate && new Date(lastDate) >= now && (job.status === 'Applied' || job.status === 'applied')) {
            list.push({
              id: `last_${job.id}`,
              title: `${examName} - Application Deadline`,
              targetDate: lastDate,
              type: 'deadline',
              isUserJob: true
            });
          }

          const examDate = job.effectiveExamDate || job.user_exam_date;
          if (examDate && new Date(examDate) >= now) {
            list.push({
              id: `exam_${job.id}`,
              title: `${examName} - Exam Date`,
              targetDate: examDate,
              type: 'exam',
              isUserJob: true
            });
          }
        });
      }
      // If user has 0 tracked applications or no upcoming dates, return empty list (do NOT fall back to public exams)
      return list.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate)).slice(0, 4);
    }

    // 2. Guest User (Not logged in): pull upcoming deadlines from public verified registry
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

  // Status distribution for PieChart
  const statusDistributionData = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];
    const counts = {};
    jobs.forEach(j => {
      const s = j.status || 'applied';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value
    }));
  }, [jobs]);

  const pieColors = ['#F97316', '#3B82F6', '#10B981', '#6366F1', '#8B5CF6', '#EF4444'];

  // Filtered public exams
  const filteredExams = useMemo(() => {
    return exams.filter(ex => {
      const matchesSearch = !searchTerm || 
        ex.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.short_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.conducting_body?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCat = selectedCategory === 'All' || 
        ex.category === selectedCategory ||
        (selectedCategory === 'Karnataka' && (ex.category === 'Karnataka' || ex.level === 'state'));

      return matchesSearch && matchesCat;
    });
  }, [exams, searchTerm, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Welcome / Mission Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-navy-800 via-navy-900 to-saffron-950 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-saffron-400" /> 
              <span>100% Genuine Commission Data</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              {isAuthenticated ? `Welcome back, ${user?.name || 'Aspirant'}! 👋` : 'India\'s Official Exam Tracker 🇮🇳'}
            </h1>
            <p className="text-navy-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Track deadlines, official commission notifications, syllabus, cutoffs, and document checklists across UPSC, SSC, Banking, Railways, KEA, and Karnataka State exams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <>
                <Link to="/tracker" className="btn-primary text-xs sm:text-sm flex items-center gap-1.5 shadow-lg">
                  <Plus size={16} /> Add Application
                </Link>
                {Boolean(user?.is_admin) && (
                  <Link to="/admin" className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-all border border-white/15">
                    Admin Portal
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="btn-primary text-xs sm:text-sm flex items-center gap-1.5 shadow-lg">
                  <LogIn size={16} /> Sign In to Track
                </Link>
                <Link to="/register" className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-all border border-white/15 flex items-center gap-1.5">
                  <UserPlus size={16} /> Register Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StatCard 
          title="My Applications" 
          value={isAuthenticated ? jobs.length : 0} 
          icon={FileText} 
          color="bg-saffron-100 text-saffron-600 dark:bg-saffron-900/30 dark:text-saffron-400"
          subtitle={isAuthenticated ? `${jobs.length} active application${jobs.length === 1 ? '' : 's'}` : "Sign in to track your jobs"}
        />
        <StatCard 
          title="Upcoming Test Dates" 
          value={isAuthenticated 
            ? jobs.filter(j => {
                const d = j.effectiveExamDate || j.user_exam_date;
                return d && !isNaN(new Date(d).getTime()) && new Date(d) >= new Date();
              }).length
            : upcomingDeadlines.length} 
          icon={Calendar} 
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          subtitle={isAuthenticated ? "From your tracked applications" : "Scheduled commission tests"}
        />
      </div>

      {/* Main Grid: Left 2 Cols (Applications / Directory), Right 1 Col (Deadlines & Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* If user is logged in: Show personal active applications */}
          {isAuthenticated && (
            <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-saffron-500" /> My Applications
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Your personal government recruitment pipeline.</p>
                </div>
                <Link to="/tracker" className="text-xs font-bold text-saffron-600 hover:text-saffron-700 dark:text-saffron-400 flex items-center gap-1">
                  Manage All ({jobs.length}) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              
              {jobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.slice(0, 4).map(job => (
                    <JobCard key={job.id} application={job} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                  <FileText className="w-10 h-10 mx-auto text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Applications Added Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Pick any exam from the directory below or add a custom job post to track dates and checklists.
                  </p>
                  <Link to="/tracker" className="btn-primary inline-flex text-xs py-2 px-4">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add First Application
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Public Exam Directory & Registry */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-saffron-500" /> Official Exam Registry
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Verified Indian government recruitment schedules.</p>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Search exam or commission..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar text-xs">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-saffron-500 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All Exams ({exams.length})
              </button>
              {EXAM_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-saffron-500 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Exam Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExams.slice(0, 8).map(exam => (
                <div 
                  key={exam.id}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-saffron-400 dark:hover:border-saffron-600 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300">
                        {exam.category || 'Central'}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Official
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {exam.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {exam.conducting_body}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Apply Deadline:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {exam.dates?.apply_end || exam.apply_end || 'Notice Awaited'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Exam Date:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {exam.dates?.exam_date || exam.exam_date || 'Will be updated soon'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Link
                      to={`/exams/${exam.id}`}
                      className="btn-primary text-xs py-1.5 px-3 flex-1 text-center"
                    >
                      View Details & Syllabus
                    </Link>
                    {exam.official_site && (
                      <a
                        href={exam.official_site}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Open Official Commission Portal"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredExams.length > 8 && (
              <div className="text-center pt-2">
                <Link to="/resources" className="text-xs font-bold text-saffron-600 dark:text-saffron-400 hover:underline">
                  Explore full syllabus, PYQs, and details for all {filteredExams.length} exams →
                </Link>
              </div>
            )}
          </div>

          {/* Quick Guide & Transparency Card */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> SarkariTracker Authenticity Commitment
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              We never fabricate dates, cutoffs, or vacancies. Every field is verified against official state or central commission notices, with direct links to commission portals (cetonline.karnataka.gov.in, ssc.gov.in, upsc.gov.in).
            </p>
          </div>
        </div>

        {/* Right Column: Deadlines & Notifications */}
        <div className="space-y-8">
          
          {/* Upcoming Deadlines (Countdown Timers) */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" /> Upcoming Deadlines
            </h2>
            
            <div className="space-y-3">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map(item => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{item.title}</h4>
                      {item.isUserJob && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 shrink-0">
                          My Application
                        </span>
                      )}
                    </div>
                    <DeadlineTimer targetDate={item.targetDate} size="small" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-500 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="font-medium text-slate-700 dark:text-slate-300">No Upcoming Deadlines</p>
                  <p className="text-[11px] text-slate-400">
                    {isAuthenticated 
                      ? "You currently have no pending deadlines for your tracked applications."
                      : "No immediate commission deadlines found."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Official Commission Notifications & Alerts */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-saffron-500" /> Important Updates
              </h2>
              <Link to="/notifications" className="text-xs font-semibold text-saffron-600 dark:text-saffron-400 hover:underline">
                View All
              </Link>
            </div>
            
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{notif.title}</span>
                      {notif.is_urgent === 1 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 line-clamp-2 text-[11px] leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      {formatDate(notif.created_at || notif.date || Date.now())}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No new commission notifications.</p>
              )}
            </div>
          </div>

          {/* Quick Support & Grievances */}
          <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs space-y-2">
            <h4 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" /> Candidate Advisory Desk
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Found a changed date or missed notification? Report immediately to:
            </p>
            <a 
              href="mailto:techtherapy1818@gmail.com" 
              className="font-mono font-bold text-saffron-600 dark:text-saffron-400 hover:underline block text-[11px]"
            >
              techtherapy1818@gmail.com
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
