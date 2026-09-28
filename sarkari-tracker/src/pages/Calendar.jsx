import React, { useState, useEffect, useMemo } from 'react';
import { getJobs } from '../utils/api';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertCircle, Plus } from 'lucide-react';
import { EXAM_CATEGORIES, formatDate } from '../utils/constants';
import { Link } from 'react-router-dom';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [jobs, setJobs] = useState([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const jobsData = await getJobs().catch(() => []);
      setJobs(jobsData || []);
    } catch (error) {
      console.error('Failed to load tracked jobs for calendar:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Build events solely from user tracked applications (ZERO FAKE DATA)
  const events = useMemo(() => {
    const list = [];
    jobs.forEach(job => {
      const examName = job.custom_exam_name || job.name || job.short_name || 'Application';
      const cat = job.category || 'General';

      // Application Last Date
      const lastDate = job.effectiveLastDate || job.user_last_date;
      if (lastDate) {
        list.push({
          id: `last_${job.id}`,
          title: `${examName} - Last Date to Apply`,
          date: lastDate.split('T')[0],
          type: 'deadline',
          category: cat,
          jobId: job.id
        });
      }

      // Examination Date
      const examDate = job.effectiveExamDate || job.user_exam_date;
      if (examDate) {
        list.push({
          id: `exam_${job.id}`,
          title: `${examName} - Examination Day`,
          date: examDate.split('T')[0],
          type: 'exam',
          category: cat,
          jobId: job.id
        });
      }

      // Admit Card Date
      const admitDate = job.effectiveAdmitCardDate || job.user_admit_card_date;
      if (admitDate) {
        list.push({
          id: `admit_${job.id}`,
          title: `${examName} - Admit Card Release`,
          date: admitDate.split('T')[0],
          type: 'admit_card',
          category: cat,
          jobId: job.id
        });
      }

      // Result Date
      const resultDate = job.effectiveResultDate || job.user_result_date;
      if (resultDate) {
        list.push({
          id: `result_${job.id}`,
          title: `${examName} - Result / Merit List`,
          date: resultDate.split('T')[0],
          type: 'result',
          category: cat,
          jobId: job.id
        });
      }
    });

    return list;
  }, [jobs]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const filteredEvents = events.filter(e => filterCategory === 'All' || e.category === filterCategory);

  const renderCells = () => {
    const cells = [];
    const today = new Date();
    
    // Empty cells for padding
    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <div key={`empty-${i}`} className="h-24 md:h-32 border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40"></div>
      );
    }

    // Month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = filteredEvents.filter(e => e.date === dateStr);
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      
      cells.push(
        <div 
          key={d} 
          onClick={() => setSelectedDateEvents(dayEvents.length > 0 ? { date: dateStr, events: dayEvents } : null)}
          className={`h-24 md:h-32 border border-slate-100 dark:border-slate-800 p-2 relative cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
            isToday ? 'bg-saffron-50/50 dark:bg-saffron-950/20' : 'bg-white dark:bg-slate-900'
          }`}
        >
          <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${
            isToday ? 'bg-saffron-500 text-white' : 'text-slate-700 dark:text-slate-300'
          }`}>
            {d}
          </span>
          
          <div className="mt-1 space-y-1 overflow-hidden">
            {dayEvents.slice(0, 2).map((ev, i) => (
              <div 
                key={i} 
                className={`text-[10px] truncate px-1.5 py-0.5 rounded font-semibold ${
                  ev.type === 'deadline' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
                  ev.type === 'exam' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                  ev.type === 'admit_card' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {ev.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <span className="text-[9px] text-slate-400 font-bold block pl-1">
                +{dayEvents.length - 2} more
              </span>
            )}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 pt-20 text-slate-800 dark:text-slate-200">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 dark:text-white">
              Application & Exam Calendar
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Your personalized examination schedule, shift dates, and application deadlines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field text-xs py-2 font-semibold"
            >
              <option value="All">All Categories</option>
              {EXAM_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Link to="/tracker" className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 shrink-0">
              <Plus className="w-3.5 h-3.5" /> Add Date
            </Link>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold px-2 text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Apply Deadline
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span> Exam Day
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span> Admit Card
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Result
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* Calendar Controls */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {monthNames[month]} {year}
              </h2>
              <button 
                onClick={goToday}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={prevMonth} 
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={nextMonth} 
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center text-xs font-bold text-slate-500 py-2.5">
            {days.map(d => <div key={d}>{d}</div>)}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7">
            {renderCells()}
          </div>
        </div>

        {/* Empty State Banner if user has no dates */}
        {events.length === 0 && !loading && (
          <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800/40 text-center space-y-2 border border-slate-200 dark:border-slate-800">
            <CalendarIcon className="w-8 h-8 mx-auto text-slate-400" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No scheduled events for this month</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Track an official exam or add your personal shift / application dates in My Applications to populate your timeline.
            </p>
            <Link to="/tracker" className="btn-primary inline-flex text-xs mt-2">
              <Plus className="w-4 h-4 mr-1.5" /> Track Application
            </Link>
          </div>
        )}

      </div>

      {/* Selected Date Modal */}
      {selectedDateEvents && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Events for {formatDate(selectedDateEvents.date)}
              </h3>
              <button 
                onClick={() => setSelectedDateEvents(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedDateEvents.events.map((ev, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    ev.type === 'deadline' ? 'border-red-200 bg-red-50/60 dark:bg-red-950/20 text-red-900 dark:text-red-300' :
                    ev.type === 'exam' ? 'border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300' :
                    ev.type === 'admit_card' ? 'border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300' :
                    'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300'
                  }`}
                >
                  <div className="font-bold">{ev.title}</div>
                  <div className="text-[11px] opacity-80 uppercase tracking-wider font-semibold">{ev.category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Calendar;
