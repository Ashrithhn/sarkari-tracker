import React from 'react';
import { Calendar, Users, Building2, ChevronRight, FileText } from 'lucide-react';
import CategoryBadge from './CategoryBadge';
import DeadlineTimer from './DeadlineTimer';
import { Link } from 'react-router-dom';

import { formatDate } from '../utils/constants';

const ExamCard = ({ exam, onApply }) => {
  if (!exam) return null;

  const conductingBody = exam.conductingBody || exam.conducting_body || 'Govt Department';
  const applyStartDate = exam.applyStartDate || exam.apply_start;
  const applyEndDate = exam.applyEndDate || exam.apply_end;
  const examDate = exam.examDate || exam.exam_date;
  const isPastDeadline = applyEndDate && new Date(applyEndDate) < new Date();

  return (
    <div className="glass-card-hover flex flex-col h-full rounded-2xl border border-gray-200 dark:border-gray-800 transition-all p-5">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <CategoryBadge category={exam.category} />
          {exam.data_status === 'verified' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-800">
              ✓ Official
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800" title="Dates are unverified seeded estimates. Always confirm on official portal.">
              ⚠️ Tentative
            </span>
          )}
        </div>
        {exam.vacancies && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            {Number(exam.vacancies).toLocaleString()} Posts
          </span>
        )}
      </div>

      <div className="mb-4 flex-grow">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {exam.name || exam.short_name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mb-1">
          <Building2 size={16} className="mr-2 flex-shrink-0 text-saffron-500" />
          <span className="truncate">{conductingBody}</span>
        </p>
        {exam.eligibility && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
            🎓 {exam.eligibility}
          </p>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 mb-4 text-xs space-y-2 border border-gray-100 dark:border-gray-700/50">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center">
            <Calendar size={13} className="mr-1.5 text-blue-500" /> Last Date:
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-200">
            {formatDate(applyEndDate)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center">
            <Calendar size={13} className="mr-1.5 text-saffron-500" /> Exam Date:
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-200">
            {formatDate(examDate)}
          </span>
        </div>
      </div>

      {applyEndDate && (
        <div className="mb-4 flex justify-center">
          <DeadlineTimer targetDate={applyEndDate} label="Registration Deadline" size="small" />
        </div>
      )}

      <div className="flex space-x-2 mt-auto pt-2">
        <Link 
          to={`/exams/${exam.id}`}
          className="flex-1 btn-secondary flex items-center justify-center text-xs py-2.5 font-medium"
        >
          <FileText size={15} className="mr-1" /> Syllabus & Info
        </Link>
        <button 
          onClick={() => onApply && onApply(exam.id)}
          disabled={exam.hasApplied || isPastDeadline}
          className={`flex-1 flex items-center justify-center text-xs py-2.5 rounded-xl font-semibold transition-all ${
            exam.hasApplied 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-not-allowed'
              : isPastDeadline
                ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed'
                : 'btn-primary'
          }`}
        >
          {exam.hasApplied ? '✓ Applied' : isPastDeadline ? 'Closed' : 'Track Application'}
          {!exam.hasApplied && !isPastDeadline && <ChevronRight size={15} className="ml-1" />}
        </button>
      </div>
    </div>
  );
};

export default ExamCard;
