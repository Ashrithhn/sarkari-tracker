import React, { useState, useEffect } from 'react';
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  deleteNotification, 
  clearReadNotifications,
  clearAllNotifications 
} from '../utils/api';
import { 
  Bell, CheckCircle2, AlertTriangle, Calendar, FileText, 
  Award, X, Circle, Trash2, ExternalLink, ShieldCheck, Building2, CheckCheck, Clock, Smartphone 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/constants';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  checkAndDispatchDailyReminders 
} from '../utils/browserNotifications';

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
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [devicePermission, setDevicePermission] = useState(() => getNotificationPermission());

  useEffect(() => {
    fetchNotifs();
  }, []);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      // Dispatch device native daily reminders
      checkAndDispatchDailyReminders(list);
    } catch (e) {
      console.warn('Failed to load notifications:', e);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableDeviceAlerts = async () => {
    const granted = await requestNotificationPermission();
    setDevicePermission(granted ? 'granted' : 'denied');
    if (granted && notifications.length > 0) {
      checkAndDispatchDailyReminders(notifications);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: 1 } : n));
    } catch (e) {
      console.warn('Failed to mark notification read', e);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    } catch (e) {
      console.warn('Failed to mark all read', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.warn('Failed to delete notification', e);
    }
  };

  const handleClearRead = async () => {
    if (!window.confirm('Clear all read notifications?')) return;
    try {
      await clearReadNotifications();
      setNotifications(prev => prev.filter(n => !n.read));
    } catch (e) {
      console.warn('Failed to clear read notifications', e);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications from your feed?')) return;
    try {
      await clearAllNotifications();
      setNotifications([]);
    } catch (e) {
      console.warn('Failed to clear all notifications', e);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'daily') return n.type === 'daily_reminder' || n.type === 'deadline' || n.type === 'exam';
    if (filter === 'official') return n.is_urgent === 1 || n.type === 'alert';
    if (filter === 'deadline') return n.type === 'deadline' || n.type === 'date_change';
    if (filter === 'admit_card') return n.type === 'admit_card' || n.type === 'result';
    return true;
  });

  const dailyCount = notifications.filter(n => n.type === 'daily_reminder' || n.type === 'deadline' || n.type === 'exam').length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.length - unreadCount;

  const getIcon = (type, isUrgent) => {
    if (type === 'daily_reminder' || type === 'deadline') {
      return <Clock className="w-5 h-5 text-saffron-500" />;
    }
    if (isUrgent) {
      return <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
    switch(type) {
      case 'date_change': 
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'admit_card': 
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'result': 
        return <Award className="w-5 h-5 text-purple-500" />;
      case 'alert':
        return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
      default: 
        return <Bell className="w-5 h-5 text-saffron-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 pt-24 text-slate-800 dark:text-slate-200">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        
        {/* Header Banner */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-saffron-50 dark:bg-saffron-950/40 text-saffron-700 dark:text-saffron-400 text-xs font-bold mb-2 border border-saffron-200 dark:border-saffron-900/40">
              <ShieldCheck className="w-3.5 h-3.5" /> Official Verified Alerts & Daily Countdown
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Bell className="w-7 h-7 text-saffron-500" /> Notifications & Daily Reminders
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Automated daily countdowns of your applied exams, deadline reminders, and official commission updates.
            </p>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead} 
                disabled={actionLoading}
                className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4"/>
                <span>Mark All Read ({unreadCount})</span>
              </button>
            )}

            {readCount > 0 && (
              <button 
                onClick={handleClearRead} 
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-slate-600 dark:text-slate-300"
                title="Remove already read notifications"
              >
                <Trash2 className="w-3.5 h-3.5"/>
                <span>Clear Read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button 
                onClick={handleClearAll} 
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Clear all notifications"
              >
                <Trash2 className="w-4 h-4"/>
              </button>
            )}
          </div>
        </div>

        {/* Daily Device Alerts Banner */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-saffron-200 dark:border-saffron-900/50 bg-gradient-to-r from-saffron-50/80 via-orange-50/40 to-white dark:from-saffron-950/20 dark:via-navy-900 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-saffron-500 text-white shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Daily Applied Job Reminders on Your Device
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Receive morning alerts on your mobile phone or browser showing days remaining for your applied exams.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {devicePermission === 'granted' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Daily Alerts Active
              </span>
            ) : (
              <button
                onClick={handleEnableDeviceAlerts}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Device Reminders</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'daily', label: `⏳ Daily Applied Reminders (${dailyCount})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'official', label: 'Official Notifications' },
            { id: 'deadline', label: 'Deadlines & Schedules' },
            { id: 'admit_card', label: 'Admit Cards & Results' }
          ].map(f => (
            <button 
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                filter === f.id 
                  ? 'bg-navy-900 text-white dark:bg-saffron-500 dark:text-white shadow-sm' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification Cards List */}
        <div className="space-y-3.5">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-16 space-y-3">
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-saffron-500"></div>
               <span className="text-xs text-slate-400">Loading verified notifications...</span>
             </div>
          ) : filteredNotifs.length > 0 ? (
            filteredNotifs.map(notif => (
              <div 
                key={notif.id} 
                className={`glass-card p-5 rounded-2xl transition-all duration-200 border ${
                  notif.read 
                    ? 'border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 opacity-80' 
                    : 'border-saffron-300 dark:border-saffron-800/80 bg-white dark:bg-slate-900 shadow-sm border-l-4 border-l-saffron-500'
                }`}
              >
                <div className="flex gap-4 items-start">
                  {/* Icon badge */}
                  <div className={`p-2.5 rounded-2xl shrink-0 ${
                    notif.is_urgent === 1 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' 
                      : notif.read 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' 
                        : 'bg-saffron-50 dark:bg-saffron-950/40 text-saffron-600'
                  }`}>
                    {getIcon(notif.type, notif.is_urgent === 1)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {notif.exam_short_name && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-navy-50 text-navy-800 dark:bg-slate-800 dark:text-slate-300 border border-navy-100 dark:border-slate-700">
                            {notif.exam_short_name}
                          </span>
                        )}

                        {notif.is_urgent === 1 && (
                          <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Official Notification
                          </span>
                        )}

                        {(notif.type === 'daily_reminder' || notif.type === 'deadline' || notif.type === 'exam') && (
                          <span className="bg-saffron-100 dark:bg-saffron-950/60 text-saffron-800 dark:text-saffron-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Daily Applied Reminder
                          </span>
                        )}

                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-saffron-500" title="Unread" />
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3"/> {getRelativeTime(notif.created_at)}
                        </span>
                        <button
                          onClick={() => handleDeleteNotif(notif.id)}
                          className="p-1 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors"
                          title="Dismiss notification"
                        >
                          <X className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>

                    <h3 className={`text-base font-bold mb-1 ${notif.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                      {notif.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                      {notif.message}
                    </p>

                    {/* Conducting Body if present */}
                    {notif.conducting_body && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
                        <Building2 className="w-3 h-3 text-saffron-500" />
                        <span>{notif.conducting_body}</span>
                      </div>
                    )}

                    {/* Bottom Action Links */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-3">
                        {notif.exam_id && (
                          <Link 
                            to={`/exams/${notif.exam_id}`} 
                            className="text-xs font-bold text-saffron-600 hover:text-saffron-700 dark:text-saffron-400 hover:underline flex items-center gap-1"
                          >
                            <span>View Full Syllabus & Dates</span>
                            <span>→</span>
                          </Link>
                        )}

                        {notif.official_site && (
                          <a
                            href={notif.official_site}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 inline-flex items-center gap-1 hover:underline"
                            title="Open Official Commission Portal"
                          >
                            <span>Official Portal</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {!notif.read && (
                        <button 
                          onClick={() => handleMarkRead(notif.id)} 
                          className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
                        >
                          <Circle className="w-3.5 h-3.5"/> Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card flex flex-col items-center justify-center p-16 rounded-3xl text-center border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="w-16 h-16 bg-saffron-50 dark:bg-saffron-950/40 rounded-full flex items-center justify-center mb-4 text-saffron-500">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white">
                {filter === 'unread' ? "You're all caught up!" : "No notifications match this category"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-5 leading-relaxed">
                {filter === 'unread' 
                  ? "There are no unread notifications. New official releases and application deadline countdowns will be posted here."
                  : "All official commission updates are verified. When dates are confirmed by KEA, KPSC, SSC, or UPSC, alerts will appear automatically."}
              </p>
              <Link to="/tracker" className="btn-primary text-xs">
                Check My Tracked Applications
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Notifications;
