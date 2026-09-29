import React from 'react';
import { Briefcase } from 'lucide-react';
import { EXAM_CATEGORIES } from '../utils/constants';

const CategoryBadge = ({ category }) => {
  // Find category config or provide default
  const categoryConfig = EXAM_CATEGORIES?.find(c => c.id === category) || {
    name: category,
    icon: Briefcase,
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-[#1e1e1e] dark:text-neutral-300 border-slate-200 dark:border-neutral-700'
  };

  const Icon = categoryConfig.icon || Briefcase;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryConfig.badgeClass}`}>
      <Icon size={12} className="mr-1.5" />
      {categoryConfig.name}
    </span>
  );
};

export default CategoryBadge;
