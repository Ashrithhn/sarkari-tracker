import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function getRelativeTime(timestamp) {
  if (!timestamp) return 'Recently';
  const now = new Date();
  const date = new Date(timestamp);
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      const count = list.filter(n => !n.read).length;
      setUnreadCount(count);
    } catch (e) {
      console.warn('Could not load notifications:', e.message);
    }
  };

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      loadNotifications();
    }
  };

  const handleMarkOneRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.warn(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleToggle}
        className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        title="Official Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-saffron-500 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-88 max-w-[calc(100vw-2rem)] glass-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 animate-fade-in-up origin-top-right z-50 bg-white dark:bg-slate-900">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-saffron-100 dark:bg-saffron-950/60 text-saffron-800 dark:text-saffron-300 px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-saffron-600 dark:text-saffron-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length > 0 ? (
              notifications.slice(0, 6).map((notif) => (
                <div 
                  key={notif.id} 
                  className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    !notif.read ? 'bg-saffron-50/40 dark:bg-saffron-950/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {notif.exam_short_name && (
                        <span className="text-[10px] font-bold bg-navy-100 text-navy-800 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded">
                          {notif.exam_short_name}
                        </span>
                      )}
                      {notif.is_urgent === 1 && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" /> Official Notification
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {getRelativeTime(notif.created_at)}
                    </span>
                  </div>

                  <p className={`text-xs ${!notif.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                    {notif.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1">
                    {notif.exam_id ? (
                      <Link
                        to={`/exams/${notif.exam_id}`}
                        onClick={() => setIsOpen(false)}
                        className="text-[11px] font-semibold text-saffron-600 dark:text-saffron-400 hover:underline"
                      >
                        View Official Details →
                      </Link>
                    ) : <span />}

                    {!notif.read && (
                      <button
                        onClick={(e) => handleMarkOneRead(notif.id, e)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Mark as read"
                      >
                        ✓ Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-400 text-xs space-y-1">
                <Bell className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No Notifications</p>
                <p className="text-[11px] text-slate-400">You're all caught up with official commission notices.</p>
              </div>
            )}
          </div>
          
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-800/40">
            <Link 
              to="/notifications" 
              className="text-xs font-bold text-saffron-600 dark:text-saffron-400 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Open Notification Center →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
