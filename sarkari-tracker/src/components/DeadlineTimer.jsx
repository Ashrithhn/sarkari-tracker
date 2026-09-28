import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const DeadlineTimer = ({ targetDate, label, size = 'medium' }) => {
  const [timeLeft, setTimeLeft] = useState({});
  const [isExpired, setIsExpired] = useState(false);
  const [urgency, setUrgency] = useState('normal'); // normal, warning, critical

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!targetDate) {
        setIsExpired(false);
        setTimeLeft({});
        setUrgency('normal');
        return;
      }

      const parsed = new Date(targetDate);
      if (isNaN(parsed.getTime())) {
        setIsExpired(false);
        setTimeLeft({});
        setUrgency('normal');
        return;
      }

      const difference = parsed.getTime() - Date.now();
      
      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({});
        setUrgency('expired');
        return;
      }

      setIsExpired(false);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      
      if (days < 3) setUrgency('critical');
      else if (days <= 7) setUrgency('warning');
      else setUrgency('normal');

      setTimeLeft({
        days,
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const sizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base font-semibold'
  };

  const urgencyClasses = {
    normal: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    critical: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 animate-pulse',
    expired: 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
  };

  if (!targetDate || isNaN(new Date(targetDate).getTime())) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ${sizeClasses[size]}`}>
        <Clock size={size === 'small' ? 12 : 16} className="mr-1.5 text-slate-400" />
        <span className="font-medium">{label ? `${label}: ` : ''}{targetDate || 'Notice Awaited'}</span>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-md border ${urgencyClasses.expired} ${sizeClasses[size]}`}>
        <Clock size={size === 'small' ? 12 : 16} className="mr-1.5" />
        <span className="font-medium">{label ? `${label}: ` : ''}Expired</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center px-2.5 py-1.5 rounded-md border ${urgencyClasses[urgency]} ${sizeClasses[size]}`}>
      <Clock size={size === 'small' ? 12 : 16} className="mr-1.5" />
      <div className="flex space-x-1 font-medium font-mono">
        {label && <span className="mr-1 font-sans">{label}:</span>}
        {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
        <span>{String(timeLeft.hours || 0).padStart(2, '0')}h</span>
        <span>{String(timeLeft.minutes || 0).padStart(2, '0')}m</span>
        {size !== 'small' && <span>{String(timeLeft.seconds || 0).padStart(2, '0')}s</span>}
      </div>
    </div>
  );
};

export default DeadlineTimer;
