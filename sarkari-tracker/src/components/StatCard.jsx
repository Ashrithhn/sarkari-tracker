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
    <div className={`glass-card p-6 flex flex-col justify-between h-full animate-fade-in`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{displayValue}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color || 'bg-saffron-100 text-saffron-600 dark:bg-saffron-900/30 dark:text-saffron-400'}`}>
          {Icon && <Icon size={24} />}
        </div>
      </div>
      {(trend || subtitle) && (
        <div className="flex items-center text-sm mt-2">
          {trend && (
            <span className={`flex items-center font-medium mr-2 ${trendColors[trend] || trendColors.neutral}`}>
              <TrendIcon size={16} className="mr-1" />
              {trendValue}
            </span>
          )}
          {subtitle && <span className="text-gray-500 dark:text-gray-400">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
