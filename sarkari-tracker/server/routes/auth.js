import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345';

router.post('/register', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      password 
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address (e.g. name@example.com)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const checkUser = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail);
    if (checkUser) {
      return res.status(400).json({ error: 'An account with this email already exists. Please Sign In.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insert = db.prepare('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)');
    const info = insert.run(cleanName, cleanEmail, phone ? String(phone).trim() : '', hashedPassword);
    const userId = info.lastInsertRowid;

    // Persist to server/data/persisted_users.json so account survives Render free tier container restarts
    try {
      const persistedDir = path.join(__dirname, '../data');
      if (!fs.existsSync(persistedDir)) fs.mkdirSync(persistedDir, { recursive: true });
      const persistedPath = path.join(persistedDir, 'persisted_users.json');
      let existingList = [];
      if (fs.existsSync(persistedPath)) {
        try { existingList = JSON.parse(fs.readFileSync(persistedPath, 'utf8')) || []; } catch (e) {}
      }
      if (!existingList.some(u => u.email.toLowerCase() === cleanEmail)) {
        existingList.push({
          name: cleanName,
          email: cleanEmail,
          phone: phone ? String(phone).trim() : '',
          password: hashedPassword,
          is_admin: 0,
          created_at: new Date().toISOString()
        });
        fs.writeFileSync(persistedPath, JSON.stringify(existingList, null, 2));
      }
    } catch (e) {
      console.warn('Failed to persist user to file backup:', e.message);
    }

    const token = jwt.sign({ id: userId, email: cleanEmail }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      token, 
      user: { id: userId, name: cleanName, email: cleanEmail, phone: phone ? String(phone).trim() : '' }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail);
    if (!user) {
      return res.status(400).json({ error: 'No account found with this email. Please check your spelling or Register.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Incorrect password. Please verify and try again.' });
    }

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
