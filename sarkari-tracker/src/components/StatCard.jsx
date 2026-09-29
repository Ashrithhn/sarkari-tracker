import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, subtitle, maxValue = 10, accent = false }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
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
    up: 'text-emerald-500 dark:text-emerald-400',
    down: 'text-rose-500 dark:text-rose-400',
    neutral: 'text-slate-400 dark:text-neutral-500'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // Calculate battery progress pills (8 segments like in reference design)
  const numPills = 8;
  const numValue = typeof value === 'number' ? value : parseInt(value, 10) || 0;
  const safeMaxValue = maxValue > 0 ? maxValue : 10;
  const proportion = Math.min(Math.max(numValue / safeMaxValue, 0), 1);
  const filledPillsCount = Math.round(proportion * numPills);

  const cardBgClasses = accent 
    ? 'bg-[#edf68d] dark:bg-[#181a10] border border-[#dee87d] dark:border-[#2f3318] text-slate-900 dark:text-[#f3ffb8] shadow-xs' 
    : 'bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-neutral-800 shadow-xs text-slate-900 dark:text-white';

  return (
    <div className={`${cardBgClasses} rounded-[26px] sm:rounded-[32px] p-5 sm:p-6 flex flex-col justify-between h-full transition-all duration-300`}>
      <div className="flex flex-col">
        {/* Title and Icon */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon className={`w-4 h-4 ${accent ? 'text-slate-700 dark:text-[#d3eb74]' : 'text-slate-400 dark:text-neutral-500'}`} />
            )}
            <p className={`text-xs font-bold uppercase tracking-wider truncate ${accent ? 'text-slate-700 dark:text-[#d3eb74]' : 'text-slate-500 dark:text-neutral-400'}`}>
              {title}
            </p>
          </div>
          {accent && (
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 tracking-wider">
              Featured
            </span>
          )}
        </div>

        {/* Big Bold Number */}
        <h3 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${accent ? 'text-slate-950 dark:text-[#f3ffb8]' : 'text-slate-900 dark:text-white'}`}>
          {displayValue}
        </h3>
        
        {/* Trend / Subtitle */}
        {(trend || subtitle) && (
          <div className="flex items-center text-xs mt-2 min-w-0 font-medium">
            {trend && (
              <span className={`flex items-center font-bold mr-1.5 shrink-0 ${trendColors[trend] || trendColors.neutral}`}>
                <TrendIcon size={14} className="mr-0.5" />
                {trendValue}
              </span>
            )}
            {subtitle && (
              <span className={`truncate text-xs ${accent ? 'text-slate-700 dark:text-[#cfe776]' : 'text-slate-500 dark:text-neutral-400'}`}>
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Battery-Style Pill Progress Meter (Hidden on mobile as requested) */}
      <div className="mt-4 sm:mt-5 hidden sm:flex gap-1.5 h-6 sm:h-7 items-center">
        {Array.from({ length: numPills }).map((_, i) => {
          const isFilled = i < (accent ? 5 : filledPillsCount);
          let pillColor = '';
          if (accent) {
            pillColor = isFilled ? 'bg-slate-950 dark:bg-[#f3ffb8]' : 'bg-black/10 dark:bg-white/10';
          } else {
            pillColor = isFilled 
              ? 'bg-neutral-950 dark:bg-white shadow-xs' 
              : 'bg-slate-200/90 dark:bg-[#202020] border border-slate-300/40 dark:border-neutral-700/60';
          }

          return (
            <div 
              key={i} 
              className={`flex-1 h-full rounded-full transition-all duration-300 ${pillColor}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default StatCard;
