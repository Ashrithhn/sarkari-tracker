import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, subtitle }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Simple count-up animation
    const target = typeof value === 'number' ? value : parseInt(value, 10);
    if (isNaN(target)) {
      setDisplayValue(value);
      return;
    }

    const duration = 1000;
    const steps = 30;
    const stepTime = duration / steps;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayValue(target);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-400'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={`bg-white/90 dark:bg-[#14171D] border border-gray-200 dark:border-white/[0.08] p-4 sm:p-6 rounded-2xl flex flex-col justify-between h-full animate-fade-in`}>
      <div className="flex justify-between items-start gap-2 mb-2 sm:mb-4">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-[#A0A6B1] mb-0.5 sm:mb-1 truncate">{title}</p>
          <h3 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-[#00E599] tracking-tight">{displayValue}</h3>
        </div>
        <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${color || 'bg-[#00E599]/15 text-[#00E599]'}`}>
          {Icon && <Icon className="w-5 h-5 sm:w-6 sm:h-6" />}
        </div>
      </div>
      {(trend || subtitle) && (
        <div className="flex items-center text-[10px] sm:text-xs mt-1 sm:mt-2 min-w-0">
          {trend && (
            <span className={`flex items-center font-medium mr-1.5 shrink-0 ${trendColors[trend] || trendColors.neutral}`}>
              <TrendIcon size={14} className="mr-0.5" />
              {trendValue}
            </span>
          )}
          {subtitle && <span className="text-gray-500 dark:text-gray-400 truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
