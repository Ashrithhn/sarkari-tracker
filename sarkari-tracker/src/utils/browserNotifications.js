/**
 * Browser & Device Native Notification Helper for SarkariTracker
 * Enables daily countdown alerts on Android, iOS PWA, and desktop browsers.
 */

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
}

export function sendBrowserNotification(title, options = {}) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return null;

  try {
    const notif = new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      ...options
    });

    notif.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
    };

    return notif;
  } catch (err) {
    console.warn('Failed to dispatch native browser notification:', err);
    return null;
  }
}

/**
 * Dispatches native device reminders for unread daily applied job notifications
 * De-duplicates using localStorage so the user is only alerted once per notification per day.
 */
export function checkAndDispatchDailyReminders(notifications) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  if (!Array.isArray(notifications) || notifications.length === 0) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const storageKey = `sarkari_dispatched_notifs_${todayStr}`;
  let dispatched = [];
  try {
    dispatched = JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch (e) {
    dispatched = [];
  }

  // Look for daily reminders or urgent deadlines that are unread
  const urgentReminders = notifications.filter(n => 
    !n.read && 
    (n.type === 'daily_reminder' || n.type === 'deadline' || n.type === 'exam' || n.is_urgent === 1) &&
    !dispatched.includes(n.id)
  );

  urgentReminders.slice(0, 2).forEach(n => {
    sendBrowserNotification(n.title, {
      body: n.message,
      tag: `exam-${n.exam_id || n.id}`,
      url: n.exam_id ? `/exams/${n.exam_id}` : '/notifications'
    });
    dispatched.push(n.id);
  });

  try {
    localStorage.setItem(storageKey, JSON.stringify(dispatched));
  } catch (e) {}
}
