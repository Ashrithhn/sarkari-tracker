import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import JobTracker from './pages/JobTracker';
import ExamDetail from './pages/ExamDetail';
import Calendar from './pages/Calendar';
import Notifications from './pages/Notifications';
import StudyResources from './pages/StudyResources';
import AdminReview from './pages/AdminReview';
import AdminUpload from './pages/AdminUpload';
import Login from './pages/Login';
import Register from './pages/Register';
import Disclaimer from './pages/Disclaimer';
import SitePrivacy from './pages/SitePrivacy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';
import About from './pages/About';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-navy-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Loading SarkariTracker...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || !Boolean(user?.is_admin)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AppContent = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('sarkari_theme') === 'dark' || 
      (!('sarkari_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sarkari_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sarkari_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Main Application Layout with persistent Header, Sidebar & Trust Footer */}
        <Route path="/" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}>
          {/* Default / Home Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Candidate Application Tracker (Requires Authentication) */}
          <Route path="tracker" element={<ProtectedRoute><JobTracker /></ProtectedRoute>} />

          {/* Public Exam Directory, Syllabus, Calendar, Notifications & Study Resources */}
          <Route path="exams" element={<Dashboard />} />
          <Route path="exams/:id" element={<ExamDetail />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="resources" element={<StudyResources />} />

          {/* Private Administrative Verification Portal */}
          <Route path="admin" element={<AdminRoute><AdminUpload /></AdminRoute>} />
          <Route path="admin/review" element={<AdminRoute><AdminReview /></AdminRoute>} />

          {/* Public Legal, Transparency & Trust Pages */}
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="disclaimer" element={<Disclaimer />} />
          <Route path="privacy-policy" element={<SitePrivacy />} />
          <Route path="terms-of-service" element={<TermsOfService />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
