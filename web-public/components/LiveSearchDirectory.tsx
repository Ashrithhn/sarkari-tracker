'use client';

import { useState, useMemo } from 'react';
import { ExamSummary } from '@/lib/api';
import ExamCard from './ExamCard';
import { Search, Filter, Building2 } from 'lucide-react';

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
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card rounded-3xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-saffron-500" />
            <span>Official Government Exam Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {filteredExams.length} of {initialExams.length} verified recruitment programs
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search UPSC, KEA, SSC, Bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-saffron-500 transition-all"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-saffron-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat} {cat === 'All' ? `(${initialExams.length})` : ''}
          </button>
        ))}
      </div>

      {/* Exam Grid */}
      {filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map(exam => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center glass-card rounded-3xl space-y-2">
          <p className="text-sm font-bold text-slate-700">No exams match your search criteria</p>
          <p className="text-xs text-slate-400">Try searching for generic terms like "Assistant", "Officer", "Karnataka", or "2026".</p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory('All'); }}
            className="btn-secondary text-xs mt-3"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}
