import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345';

router.post('/register', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      password, 
      selectedExamIds = [], 
      autoDetectApplications = true,
      targetCategories = []
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const checkUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (checkUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insert = db.prepare('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)');
    const info = insert.run(name, email, phone || '', hashedPassword);
    const userId = info.lastInsertRowid;

    // Smart Application Recognition & Onboarding:
    // Automatically recognize applied/target exams and setup instant tracking
    let examsToEnroll = [];

    if (Array.isArray(selectedExamIds) && selectedExamIds.length > 0) {
      examsToEnroll = db.prepare(`SELECT * FROM exams WHERE id IN (${selectedExamIds.map(() => '?').join(',')})`)
        .all(...selectedExamIds);
    } else if (autoDetectApplications) {
      // Auto-detect top government exams (SSC, Banking, Railway, etc.)
      let query = "SELECT * FROM exams WHERE status = 'upcoming'";
      if (Array.isArray(targetCategories) && targetCategories.length > 0) {
        query += ` AND category IN (${targetCategories.map(() => '?').join(',')})`;
        examsToEnroll = db.prepare(query).all(...targetCategories);
      } else {
        examsToEnroll = db.prepare('SELECT * FROM exams ORDER BY id ASC LIMIT 3').all();
      }
    }

    const insertApp = db.prepare(`
      INSERT INTO applications (user_id, exam_id, applied_date, status, notes)
      VALUES (?, ?, date('now'), 'Applied', 'Candidate registered target exam')
    `);

    const insertChecklist = db.prepare(`
      INSERT INTO application_checklist (application_id, item_name, is_checked)
      VALUES (?, ?, 0)
    `);

    const insertReminder = db.prepare(`
      INSERT INTO reminders (user_id, application_id, exam_id, title, reminder_date, type, completed)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);

    for (const exam of examsToEnroll) {
      const appInfo = insertApp.run(userId, exam.id);
      const appId = appInfo.lastInsertRowid;

      for (const item of ['Photo with Date', 'Signature', 'ID Proof (Aadhaar)', 'Degree Certificate', 'Category/Caste Certificate']) {
        try { insertChecklist.run(appId, item); } catch (e) {}
      }

      // Link notifications
      const notifs = db.prepare('SELECT id FROM notifications WHERE exam_id = ?').all(exam.id);
      for (const n of notifs) {
        try {
          db.prepare('INSERT OR IGNORE INTO user_notifications (user_id, notification_id, read) VALUES (?, ?, 0)')
            .run(userId, n.id);
        } catch (e) {}
      }
    }

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      token, 
      user: { id: userId, name, email, phone },
      autoTrackedExamsCount: examsToEnroll.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    const { password: _, ...userData } = user;
    res.json({ token, user: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, phone, is_admin, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
