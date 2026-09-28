import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateDailyRemindersForUser } from '../services/dailyReminders.js';

const router = express.Router();
router.use(authenticateToken);

// Notifications
router.get('/notifications', (req, res) => {
  try {
    // 1. Generate real-time daily countdown reminders for applied jobs
    try {
      generateDailyRemindersForUser(req.user.id);
    } catch (e) {
      console.warn('Daily reminder generation warning:', e.message);
    }

    // 2. Sync valid notifications for user's tracked exams OR verified official commission announcements
    db.prepare(`
      INSERT OR IGNORE INTO user_notifications (user_id, notification_id, read)
      SELECT ?, n.id, 0 FROM notifications n
      WHERE n.exam_id IN (SELECT exam_id FROM applications WHERE user_id = ? AND exam_id IS NOT NULL)
         OR n.is_urgent = 1
    `).run(req.user.id, req.user.id);

    const notifications = db.prepare(`
      SELECT un.id, 
             n.id as notification_id,
             n.title, 
             n.message, 
             n.type, 
             n.created_at, 
             n.is_urgent, 
             un.read,
             n.exam_id,
             coalesce(e.short_name, e.name) as exam_short_name,
             e.name as exam_name,
             e.conducting_body,
             e.official_site,
             e.data_status as exam_data_status
      FROM user_notifications un
      JOIN notifications n ON un.notification_id = n.id
      LEFT JOIN exams e ON n.exam_id = e.id
      WHERE un.user_id = ?
      ORDER BY un.read ASC, n.is_urgent DESC, n.created_at DESC
    `).all(req.user.id);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark single notification read
router.put('/notifications/:id/read', (req, res) => {
  try {
    const result = db.prepare('UPDATE user_notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Notification not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark ALL notifications read
router.put('/notifications/read-all', (req, res) => {
  try {
    db.prepare('UPDATE user_notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete / Dismiss a single notification
router.delete('/notifications/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM user_notifications WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Notification not found' });
    res.json({ success: true, message: 'Notification dismissed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all read notifications
router.delete('/notifications/clear-read', (req, res) => {
  try {
    db.prepare('DELETE FROM user_notifications WHERE user_id = ? AND read = 1').run(req.user.id);
    res.json({ success: true, message: 'All read notifications cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear ALL notifications for user
router.delete('/notifications/clear-all', (req, res) => {
  try {
    db.prepare('DELETE FROM user_notifications WHERE user_id = ?').run(req.user.id);
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/notifications/unread-count', (req, res) => {
  try {
    try {
      generateDailyRemindersForUser(req.user.id);
    } catch (e) {}

    const row = db.prepare('SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND read = 0').get(req.user.id);
    res.json({ count: row ? row.count : 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reminders
router.get('/reminders', (req, res) => {
  try {
    const reminders = db.prepare('SELECT * FROM reminders WHERE user_id = ? ORDER BY reminder_date ASC').all(req.user.id);
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reminders', (req, res) => {
  try {
    const { exam_id, title, reminder_date, type = 'general' } = req.body;
    if (!title || !reminder_date) return res.status(400).json({ error: 'Title and reminder_date are required' });
    
    const insert = db.prepare('INSERT INTO reminders (user_id, exam_id, title, reminder_date, type) VALUES (?, ?, ?, ?, ?)');
    const info = insert.run(req.user.id, exam_id || null, title, reminder_date, type);
    
    const newReminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newReminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/reminders/:id', (req, res) => {
  try {
    const { title, reminder_date, type, completed } = req.body;
    
    const update = db.prepare(`
      UPDATE reminders 
      SET title = coalesce(?, title),
          reminder_date = coalesce(?, reminder_date),
          type = coalesce(?, type),
          completed = coalesce(?, completed)
      WHERE id = ? AND user_id = ?
    `);
    
    const result = update.run(title, reminder_date, type, completed !== undefined ? (completed ? 1 : 0) : null, req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Reminder not found' });
    
    const updated = db.prepare('SELECT * FROM reminders WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
