import db from '../db.js';

/**
 * Sarkari Tracker - Notification & Reminder Dispatcher Engine
 * Calculates T-7, T-3, T-1 day deadlines for tracked exams
 * and dispatches in-app, email, and webhook alerts.
 */

// Channels Configuration
const CHANNELS = {
  IN_APP: true,
  EMAIL: process.env.ENABLE_EMAIL === 'true',
  TELEGRAM: process.env.ENABLE_TELEGRAM === 'true',
  WEB_PUSH: process.env.ENABLE_WEB_PUSH === 'true'
};

/**
 * Dispatch an individual alert across configured channels
 */
export async function sendAlert({ userId, examId, title, message, type = 'deadline', isUrgent = false }) {
  const dispatchedChannels = [];

  // 1. In-App Notification
  if (CHANNELS.IN_APP) {
    try {
      const insertNotif = db.prepare(`
        INSERT INTO notifications (exam_id, title, message, type, is_urgent)
        VALUES (?, ?, ?, ?, ?)
      `);
      const notifInfo = insertNotif.run(examId, title, message, type, isUrgent ? 1 : 0);

      // Link to user if target specified
      if (userId) {
        db.prepare(`
          INSERT OR IGNORE INTO user_notifications (user_id, notification_id, read)
          VALUES (?, ?, 0)
        `).run(userId, notifInfo.lastInsertRowid);
      } else {
        // Broadcast to all users tracking this exam
        const trackers = db.prepare('SELECT user_id FROM applications WHERE exam_id = ?').all(examId);
        const linkStmt = db.prepare('INSERT OR IGNORE INTO user_notifications (user_id, notification_id, read) VALUES (?, ?, 0)');
        trackers.forEach(t => linkStmt.run(t.user_id, notifInfo.lastInsertRowid));
      }
      dispatchedChannels.push('in_app');
    } catch (err) {
      console.error('[NotificationDispatcher] In-App delivery failed:', err.message);
    }
  }

  // 2. Email Delivery Mock / Adapter
  if (CHANNELS.EMAIL && userId) {
    try {
      const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId);
      if (user && user.email) {
        console.log(`[Email Dispatcher] Mock sent to ${user.email}: "${title}"`);
        dispatchedChannels.push('email');
      }
    } catch (err) {
      console.error('[NotificationDispatcher] Email delivery failed:', err.message);
    }
  }

  // 3. Telegram Bot Mock / Adapter
  if (CHANNELS.TELEGRAM) {
    console.log(`[Telegram Dispatcher] Alert broadcast: "${title}" - "${message}"`);
    dispatchedChannels.push('telegram');
  }

  return { success: true, channels: dispatchedChannels };
}

/**
 * Scans active applications and schedules/dispatches T-7, T-3, T-1 deadline reminders
 */
export function runDeadlineScanner() {
  console.log('[NotificationDispatcher] Running daily deadline scanner...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all active applications from applications table
  const applications = db.prepare(`
    SELECT a.id, a.user_id, a.exam_id, a.status as application_status,
           a.user_last_date, a.user_exam_date, a.user_admit_card_date,
           coalesce(e.short_name, a.custom_exam_name, 'Tracked Application') as exam_name
    FROM applications a
    LEFT JOIN exams e ON a.exam_id = e.id
  `).all();

  let alertsTriggered = 0;

  for (const app of applications) {
    const examLabel = app.exam_name;
    const targetLastDate = app.user_last_date;
    const targetExamDate = app.user_exam_date;

    // Check Application Deadline (user_last_date)
    if (targetLastDate) {
      const applyEndDate = new Date(targetLastDate);
      applyEndDate.setHours(0, 0, 0, 0);
      const diffTime = applyEndDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 7 || diffDays === 3 || diffDays === 1) {
        const title = diffDays === 1 
          ? `🚨 FINAL DAY to Apply: ${examLabel}` 
          : `⚠️ ${diffDays} Days Left to Apply: ${examLabel}`;
        
        const message = `Application submission deadline for ${examLabel} closes on ${targetLastDate}. Ensure your fee and application are submitted.`;
        
        // Prevent duplicate notification today
        const existing = db.prepare(`
          SELECT id FROM notifications 
          WHERE exam_id = ? AND title = ? AND date(created_at) = date('now')
        `).get(app.exam_id, title);

        if (!existing) {
          sendAlert({
            userId: app.user_id,
            examId: app.exam_id,
            title,
            message,
            type: 'date_change',
            isUrgent: diffDays <= 3
          });
          alertsTriggered++;
        }
      }
    }

    // Check Examination Date (targetExamDate)
    if (targetExamDate) {
      const examDate = new Date(targetExamDate);
      examDate.setHours(0, 0, 0, 0);
      const diffTime = examDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 7 || diffDays === 3 || diffDays === 1) {
        const title = diffDays === 1 
          ? `🎯 Exam Tomorrow: ${examLabel}` 
          : `📅 Exam in ${diffDays} Days: ${examLabel}`;

        const message = `Your ${examLabel} examination is scheduled for ${targetExamDate}. Verify your exam center and print your admit card and ID proof.`;

        const existing = db.prepare(`
          SELECT id FROM notifications 
          WHERE exam_id = ? AND title = ? AND date(created_at) = date('now')
        `).get(app.exam_id, title);

        if (!existing) {
          sendAlert({
            userId: app.user_id,
            examId: app.exam_id,
            title,
            message,
            type: 'general',
            isUrgent: diffDays === 1
          });
          alertsTriggered++;
        }
      }
    }
  }

  console.log(`[NotificationDispatcher] Scan completed. Triggered ${alertsTriggered} deadline alerts.`);
  return { scannedApplications: applications.length, alertsTriggered };
}
