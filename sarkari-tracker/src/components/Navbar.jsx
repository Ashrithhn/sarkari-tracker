import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sun, Moon, Menu, User, LogOut, Settings } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ darkMode, toggleDarkMode, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 z-30 glass-card rounded-none border-b border-white/20 dark:border-navy-700/50 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-saffron-500 via-white to-green-600 drop-shadow-sm">
            🇮🇳 SarkariTracker
          </span>
        </Link>
      </div>

      <div className="flex-1 max-w-xl px-4 hidden md:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-saffron-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search exams, updates, notifications..." 
            className="input-field pl-10 py-2 rounded-full w-full bg-slate-100/50 dark:bg-navy-900/50 border-slate-200 dark:border-navy-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="w-5 h-5 text-saffron-400" /> : <Moon className="w-5 h-5 text-navy-600" />}
        </button>

        <NotificationBell />

        {user ? (
          <div className="relative">
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-white font-semibold text-xs">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 glass-card border border-slate-200 dark:border-navy-700 rounded-xl shadow-lg py-1 animate-slide-up origin-top-right bg-white dark:bg-slate-900 z-50">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-navy-700/50">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{user?.name || 'Candidate'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || ''}</p>
                  {Boolean(user?.is_admin) && (
                    <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Admin Access
                    </span>
                  )}
                </div>
                <div className="py-1">
                  <Link 
                    to="/tracker" 
                    onClick={() => setProfileOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" /> My Applications
                  </Link>
                  {Boolean(user?.is_admin) && (
                    <Link 
                      to="/admin" 
                      onClick={() => setProfileOpen(false)}
                      className="w-full px-4 py-2 text-left text-xs text-saffron-600 dark:text-saffron-400 font-semibold hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5" /> Admin Verification Portal
                    </Link>
                  )}
                </div>
                <div className="py-1 border-t border-slate-100 dark:border-navy-700/50">
                  <button 
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link 
              to="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/register"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white transition-colors shadow-xs"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
