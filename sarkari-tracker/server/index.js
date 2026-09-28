import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import authRoutes from './routes/auth.js';
import jobsRoutes from './routes/jobs.js';
import examsRoutes from './routes/exams.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';
import candidateRoutes from './routes/candidate.js';
import { runDeadlineScanner } from './services/notificationDispatcher.js';
import { runDailyRemindersForAllUsers } from './services/dailyReminders.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Public health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// App API routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api', notificationRoutes); 

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploaded files
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Serve static frontend assets if built
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Single Page Application (SPA) fallback or API landing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.json({
    status: 'ok',
    message: '🇮🇳 SarkariTracker API is live and healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      exams: '/api/public/exams',
      blogs: '/api/public/blogs'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

import { runDailyExamChecks } from './services/dailyQuestionMonitor.js';

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🇮🇳 SarkariTracker Server running on port ${PORT}`);
  
  // Run initial deadline scan & daily applied job reminders
  try {
    runDeadlineScanner();
    runDailyRemindersForAllUsers();
  } catch (err) {
    console.error('Initial daily scanner failed:', err.message);
  }

  // Run initial AI exam intelligence monitor after 5 seconds delay
  setTimeout(() => {
    runDailyExamChecks().catch(err => {
      console.warn('Startup daily exam intelligence check:', err.message);
    });
  }, 5000);

  // Schedule background daily checks every 12 hours
  setInterval(() => {
    try {
      runDeadlineScanner();
      runDailyRemindersForAllUsers();
      runDailyExamChecks().catch(e => console.warn('Scheduled daily AI monitor check:', e.message));
    } catch (err) {
      console.error('Scheduled daily scanner failed:', err.message);
    }
  }, 12 * 60 * 60 * 1000);
});
