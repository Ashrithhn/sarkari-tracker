import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, ArrowLeft, CheckCircle2 } from 'lucide-react';

const StudyResources = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0c0c] p-6 pt-24 text-slate-800 dark:text-slate-200">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div>
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-saffron-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>

        {/* Coming Soon Hero Card */}
        <div className="glass-card p-8 sm:p-12 rounded-3xl text-center space-y-6 bg-white dark:bg-[#121212] border border-slate-200 dark:border-neutral-800 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-100 dark:bg-saffron-950/60 text-saffron-800 dark:text-saffron-300 text-xs font-bold border border-saffron-300 dark:border-saffron-800 mx-auto">
            <Clock className="w-3.5 h-3.5" />
            <span>Coming Soon</span>
          </div>

          <div className="max-w-xl mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-saffron-50 dark:bg-saffron-900/30 border border-saffron-200 dark:border-saffron-800 flex items-center justify-center mx-auto text-saffron-600">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-navy-900 dark:text-white tracking-tight">
              Study Resources & Notes
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Curated preparation materials, subject-wise book recommendations, topper notes, and official previous year question banks are currently being organized and will be available soon.
            </p>
          </div>

          {/* Planned Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto pt-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161616] border border-slate-200/80 dark:border-neutral-800 space-y-1.5">
              <span className="text-xs font-bold text-saffron-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Standard Books
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Recommended books and NCERT reading lists for UPSC, SSC, and Karnataka KEA/KPSC.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161616] border border-slate-200/80 dark:border-neutral-800 space-y-1.5">
              <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> PYQ Archives
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Downloadable PDF question papers and official answer keys for recent examination cycles.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161616] border border-slate-200/80 dark:border-neutral-800 space-y-1.5">
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Syllabus Breakdowns
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Detailed topic-by-topic weightage and high-yield subject checklists.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <Link to="/" className="btn-primary text-xs sm:text-sm py-2.5 px-6">
              Explore Active Exams
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudyResources;
