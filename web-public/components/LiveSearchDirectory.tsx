'use client';

import { useState, useMemo } from 'react';
import { ExamSummary } from '@/lib/api';
import ExamCard from './ExamCard';
import { Search, Building2, X } from 'lucide-react';

interface LiveSearchDirectoryProps {
  initialExams: ExamSummary[];
}

const CATEGORIES = [
  'All',
  'Karnataka',
  'Banking',
  'SSC',
  'UPSC',
  'Railway',
  'PSU',
  'Defence',
  'Science'
];

export default function LiveSearchDirectory({ initialExams }: LiveSearchDirectoryProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredExams = useMemo(() => {
    return initialExams.filter(exam => {
      const q = search.toLowerCase();
      const matchesSearch = !search ||
        exam.name.toLowerCase().includes(q) ||
        exam.short_name.toLowerCase().includes(q) ||
        exam.conducting_body.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'All' ||
        exam.category === selectedCategory ||
        (selectedCategory === 'Karnataka' && (exam.category === 'Karnataka' || exam.level === 'state' || exam.state === 'Karnataka'));

      return matchesSearch && matchesCat;
    });
  }, [initialExams, search, selectedCategory]);

  return (
    <section id="exams" className="space-y-6">
      {/* Search & Filter Header with Large Rounded Corners */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 bg-white rounded-[28px] sm:rounded-[34px] border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
            <Building2 className="w-6 h-6 text-saffron-500" />
            <span>Official Government Exam Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Showing {filteredExams.length} of {initialExams.length} verified recruitment programs
          </p>
        </div>

        {/* Pill Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search UPSC, KEA, SSC, Bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-9 py-2.5 text-xs sm:text-sm rounded-full bg-slate-100 border-none focus:outline-none focus:ring-2 focus:ring-saffron-500 text-slate-900 placeholder-slate-400 transition-all shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Pill Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-navy-950 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {filteredExams.map(exam => (
          <ExamCard key={exam.id} exam={exam} />
        ))}
      </div>
    </section>
  );
}
