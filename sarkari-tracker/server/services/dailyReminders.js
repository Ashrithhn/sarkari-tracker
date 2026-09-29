import db from '../db.js';

/**
 * Format date to DD/MM/YYYY for user-friendly notifications
 */
function formatNotificationDate(dateStr) {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return str;
}

/**
 * Generate daily applied job reminder notifications for a specific user or all users.
 * Checks deadlines, exam dates, admit cards, and generates exact "X Days Remaining" notifications.
 */
export function generateDailyRemindersForUser(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Fetch user's active tracked applications
    const apps = db.prepare(`
      SELECT a.*, 
             coalesce(e.short_name, e.name, a.custom_exam_name) as exam_short_name,
             coalesce(e.name, a.custom_exam_name) as exam_name,
             e.conducting_body,
             e.official_site
      FROM applications a
      LEFT JOIN exams e ON a.exam_id = e.id
      WHERE a.user_id = ?
        AND lower(a.status) NOT IN ('selected', 'not selected', 'rejected')
    `).all(userId);

    if (!apps || apps.length === 0) return [];

    const generatedNotifications = [];

    for (const app of apps) {
      const examName = app.exam_short_name || app.exam_name || 'Applied Exam';

      // Fetch admin verified dates from exam_content if linked to an official exam
      let adminDates = {};
      if (app.exam_id) {
        const datesContent = db.prepare(`
          SELECT payload FROM exam_content 
          WHERE exam_id = ? AND content_type = 'dates' AND status = 'published'
          ORDER BY id DESC LIMIT 1
        `).get(app.exam_id);

        if (datesContent && datesContent.payload) {
          try { adminDates = JSON.parse(datesContent.payload); } catch (e) {}
        }
      }

      // Priority: User candidate overrides take precedence over general admin dates
      const effectiveLastDate = app.user_last_date || adminDates.apply_end || null;
      const effectiveExamDate = app.user_exam_date || adminDates.exam_date || null;
      const effectiveAdmitCardDate = app.user_admit_card_date || adminDates.admit_card || null;

      // 1. Check Application Last Date (Deadline Countdown)
      if (effectiveLastDate) {
        const targetDate = new Date(effectiveLastDate);
        targetDate.setHours(0, 0, 0, 0);
        const diffMs = targetDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysLeft >= 0 && daysLeft <= 30) {
          let title = '';
          let message = '';
          let isUrgent = 0;

          if (daysLeft === 0) {
            title = `🚨 TODAY: ${examName} Application Deadline Closes!`;
            message = `Today is the final deadline to submit your online application and fee for ${examName}. Complete it immediately on the official portal!`;
            isUrgent = 1;
          } else if (daysLeft === 1) {
            title = `⚠️ 1 Day Remaining: ${examName} Application Deadline!`;
            message = `Urgent reminder: Only 1 day left before the application window closes for ${examName} on ${formatNotificationDate(effectiveLastDate)}. Verify your payment status.`;
            isUrgent = 1;
          } else if (daysLeft <= 3) {
            title = `⏳ ${daysLeft} Days Remaining: ${examName} Application Deadline`;
            message = `Hurry! You have only ${daysLeft} days remaining to apply for ${examName} (Last date: ${formatNotificationDate(effectiveLastDate)}).`;
            isUrgent = 1;
          } else {
            title = `⏳ ${daysLeft} Days Remaining: ${examName} Application Window`;
            message = `Daily reminder for your tracked job ${examName}. Application deadline is on ${formatNotificationDate(effectiveLastDate)} (${daysLeft} days remaining).`;
            isUrgent = 0;
          }

          createUniqueDailyNotification(userId, app.exam_id, title, message, 'deadline', isUrgent, todayStr);
          generatedNotifications.push({ title, message, daysLeft, type: 'deadline' });
        }
      }

      // 2. Check Examination Date (Exam Countdown)
      if (effectiveExamDate) {
        const targetDate = new Date(effectiveExamDate);
        targetDate.setHours(0, 0, 0, 0);
        const diffMs = targetDate.getTime() - today.getTime();
        const daysToExam = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysToExam >= 0 && daysToExam <= 60) {
          let title = '';
          let message = '';
          let isUrgent = 0;

          if (daysToExam === 0) {
            title = `🎯 EXAM TODAY: ${examName}`;
            message = `Best of luck for your ${examName} examination today! Carry your printed admit card, 2 passport photos, and original Photo ID proof.`;
            isUrgent = 1;
          } else if (daysToExam === 1) {
            title = `🔥 1 Day to Exam: ${examName} Tomorrow!`;
            message = `Your ${examName} exam is tomorrow (${formatNotificationDate(effectiveExamDate)}). Keep your hall ticket, original ID, and stationery ready tonight.`;
            isUrgent = 1;
          } else if (daysToExam <= 7) {
            title = `🎯 ${daysToExam} Days to Exam: ${examName}`;
            message = `Final sprint! Only ${daysToExam} days remaining for ${examName} exam on ${formatNotificationDate(effectiveExamDate)}. Focus on revision and previous year questions.`;
            isUrgent = daysToExam <= 3 ? 1 : 0;
          } else {
            title = `📅 ${daysToExam} Days to Exam: ${examName}`;
            message = `Daily preparation reminder: You have ${daysToExam} days remaining until your ${examName} examination on ${formatNotificationDate(effectiveExamDate)}. Keep practicing!`;
            isUrgent = 0;
          }

          createUniqueDailyNotification(userId, app.exam_id, title, message, 'exam', isUrgent, todayStr);
          generatedNotifications.push({ title, message, daysLeft: daysToExam, type: 'exam' });
        }
      }

      // 3. Check Admit Card Date
      if (effectiveAdmitCardDate) {
        const targetDate = new Date(effectiveAdmitCardDate);
        targetDate.setHours(0, 0, 0, 0);
        const diffMs = targetDate.getTime() - today.getTime();
        const daysToAdmit = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysToAdmit === 0) {
          const title = `🎫 Admit Card Expected Today: ${examName}`;
          const message = `Official commission hall tickets / admit cards for ${examName} are scheduled for release today. Check the official portal to download.`;
          createUniqueDailyNotification(userId, app.exam_id, title, message, 'admit_card', 1, todayStr);
          generatedNotifications.push({ title, message, daysLeft: 0, type: 'admit_card' });
        }
      }
    }

    return generatedNotifications;
  } catch (err) {
    console.error('Error generating daily reminders for user:', err.message);
    return [];
  }
}

/**
 * Creates a unique daily notification so the candidate isn't spammed with duplicates on the same day
 */
function createUniqueDailyNotification(userId, examId, title, message, type, isUrgent, todayStr) {
  try {
    // 1. Check if user dismissed a notification with this title (permanently prevent resurrection)
    const dismissed = db.prepare(`
      SELECT ud.notification_id 
      FROM user_dismissed_notifications ud
      JOIN notifications n ON ud.notification_id = n.id
      WHERE ud.user_id = ?
        AND n.title = ?
    `).get(userId, title);

    if (dismissed) {
      return null;
    }

    // 2. Check if an active notification with this title already exists in user's notifications
    const existing = db.prepare(`
      SELECT n.id 
      FROM notifications n
      JOIN user_notifications un ON n.id = un.notification_id
      WHERE un.user_id = ?
        AND n.title = ?
    `).get(userId, title);

    if (existing) {
      return existing.id;
    }

    // Insert new notification
    const insertNotif = db.prepare(`
      INSERT INTO notifications (exam_id, title, message, type, is_urgent, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);
    const info = insertNotif.run(examId || null, title, message, type, isUrgent ? 1 : 0);
    const notifId = info.lastInsertRowid;

    // Link to user_notifications
    db.prepare(`
      INSERT OR IGNORE INTO user_notifications (user_id, notification_id, read)
      VALUES (?, ?, 0)
    `).run(userId, notifId);

    return notifId;
  } catch (err) {
    console.error('Failed to create daily notification:', err.message);
    return null;
  }
}

/**
 * Run daily reminders for all active users
 */
export function runDailyRemindersForAllUsers() {
  try {
    const users = db.prepare('SELECT id FROM users').all();
    let totalGenerated = 0;
    for (const u of users) {
      const reminders = generateDailyRemindersForUser(u.id);
      totalGenerated += reminders.length;
    }
    console.log(`[DailyReminders] Completed scan for ${users.length} users. Created ${totalGenerated} reminder notifications.`);
  } catch (err) {
    console.error('[DailyReminders] Scan failed:', err.message);
  }
}
