import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Menu, User, LogOut, Settings, X, Building2, Zap, ArrowRight } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { EXAM_SUGGESTIONS } from '../data/examSuggestions';

const Navbar = ({ darkMode, toggleDarkMode, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchDropdownRef = useRef(null);

  // Filter 160+ exams in real-time for navbar suggestions
  const searchSuggestions = React.useMemo(() => {
    const term = navSearch.trim().toLowerCase();
    if (term.length < 1) return [];
    const tokens = term.split(/\s+/).filter(Boolean);
    return EXAM_SUGGESTIONS.filter(ex => {
      const text = `${ex.name || ''} ${ex.short_name || ''} ${ex.conducting_body || ''} ${ex.category || ''} ${ex.state || ''}`.toLowerCase();
      return tokens.every(tok => text.includes(tok));
    }).slice(0, 6);
  }, [navSearch]);

  // Click outside listener to dismiss search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (exam) => {
    setIsSearchFocused(false);
    setNavSearch('');
    navigate(`/tracker?add=1&exam=${encodeURIComponent(exam.short_name)}`);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 sm:h-16 z-30 glass-card rounded-none border-b border-white/20 dark:border-navy-700/50 flex items-center justify-between px-3 sm:px-4 lg:px-6">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <Link to="/" className="flex items-center gap-1.5 min-w-0">
          <span className="text-base sm:text-xl lg:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-saffron-500 via-slate-800 to-green-600 dark:via-white drop-shadow-xs truncate">
            🇮🇳 Sarkari<span className="text-saffron-500">Tracker</span>
          </span>
        </Link>
      </div>

      <div ref={searchDropdownRef} className="flex-1 max-w-xl px-4 hidden md:block relative">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (navSearch.trim()) {
              setIsSearchFocused(false);
              navigate(`/?search=${encodeURIComponent(navSearch.trim())}`);
            }
          }}
        >
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-saffron-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search 160+ exams (KEA, KPSC, Police, UPSC, SSC, Banking, Railway)..." 
              value={navSearch}
              onChange={(e) => {
                setNavSearch(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              className="input-field pl-10 pr-8 py-2 rounded-full w-full bg-slate-100/50 dark:bg-navy-900/50 border-slate-200 dark:border-navy-700 text-xs"
            />
            {navSearch && (
              <button 
                type="button" 
                onClick={() => { setNavSearch(''); setIsSearchFocused(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Live Search Autocomplete Dropdown */}
        {isSearchFocused && navSearch.trim().length > 0 && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-fade-in divide-y divide-slate-100 dark:divide-slate-800">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center">
              <span>Matching Government Examinations ({searchSuggestions.length})</span>
              <span className="text-saffron-600 dark:text-saffron-400 font-semibold">Click to Track</span>
            </div>

            {searchSuggestions.length > 0 ? (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
                {searchSuggestions.map((exam) => {
                  const isKarnataka = exam.category === 'Karnataka' || exam.state === 'Karnataka' || exam.level === 'state';
                  return (
                    <div
                      key={exam.id || exam.short_name}
                      onClick={() => handleSelectSuggestion(exam)}
                      className="p-3 hover:bg-saffron-50/80 dark:hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-saffron-600 transition-colors">
                            {exam.short_name}
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                            isKarnataka 
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300' 
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}>
                            {isKarnataka ? 'Karnataka' : (exam.category || 'Central')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {exam.name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          {exam.conducting_body}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSuggestion(exam);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-saffron-500 hover:bg-saffron-600 text-white shrink-0 shadow-2xs flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" /> Track
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs">
                No official exams found matching "{navSearch}".
              </div>
            )}

            <div className="p-2 bg-slate-50 dark:bg-slate-800/40 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSearchFocused(false);
                  navigate(`/?search=${encodeURIComponent(navSearch.trim())}`);
                }}
                className="text-xs font-semibold text-saffron-600 dark:text-saffron-400 hover:underline flex items-center justify-center gap-1 w-full"
              >
                <span>View all search results on Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button 
          onClick={toggleDarkMode}
          className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-saffron-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-navy-600" />}
        </button>

        <NotificationBell />

        {user ? (
          <div className="relative">
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-white font-semibold text-xs">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 glass-card border border-slate-200 dark:border-navy-700 rounded-xl shadow-lg py-1 animate-slide-up origin-top-right bg-white dark:bg-slate-900 z-50">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-navy-700/50">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{user?.name || 'Candidate'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || ''}</p>
                </div>
                <div className="py-1">
                  <Link 
                    to="/tracker" 
                    onClick={() => setProfileOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" /> My Applications
                  </Link>
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link 
              to="/login"
              className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white transition-colors shadow-xs"
            >
              Sign In
            </Link>
            <Link 
              to="/register"
              className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
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
