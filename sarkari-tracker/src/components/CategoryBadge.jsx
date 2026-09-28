import React from 'react';
import { Briefcase } from 'lucide-react';
import { EXAM_CATEGORIES } from '../utils/constants';

const CategoryBadge = ({ category }) => {
  // Find category config or provide default
  const categoryConfig = EXAM_CATEGORIES?.find(c => c.id === category) || {
    name: category,
    icon: Briefcase,
    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
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
