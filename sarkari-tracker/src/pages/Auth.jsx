import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, User, Phone, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Auth = ({ initialMode = 'signin' }) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/tracker';

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, from]);

  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode]);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'signin') {
      const cleanEmail = formData.email.trim().toLowerCase();
      if (!cleanEmail || !formData.password) {
        setError('Please enter both your email address and password');
        return;
      }
      
      setLoading(true);
      try {
        await login(cleanEmail, formData.password);
        navigate(from, { replace: true });
      } catch (err) {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    } else {
      const cleanFirstName = formData.firstName.trim();
      const cleanLastName = formData.lastName.trim();
      const cleanName = `${cleanFirstName} ${cleanLastName}`.trim();
      const cleanEmail = formData.email.trim().toLowerCase();
      
      if (!cleanFirstName || !cleanEmail || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setError('Please enter a valid email address');
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      setLoading(true);
      try {
        await register({
          name: cleanName,
          email: cleanEmail,
          phone: formData.phone ? formData.phone.trim() : '',
          password: formData.password
        });
        navigate(from, { replace: true });
      } catch (err) {
        setError(err.message || 'Failed to create account. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#9bb0a4] dark:bg-[#070b12] p-2.5 sm:p-4 lg:p-6 flex items-center justify-center font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Outer Shell Rounded Container Matching Dashboard */}
      <div className="w-full max-w-4xl bg-white dark:bg-[#0d1522] rounded-[34px] sm:rounded-[48px] lg:rounded-[52px] overflow-hidden shadow-2xl border border-slate-300/60 dark:border-slate-800/90 p-4 sm:p-8 flex flex-col justify-between relative min-h-[640px]">
        
        {/* Top Navbar Strip */}
        <div className="flex items-center justify-between w-full pb-4 sm:pb-6 border-b border-slate-100 dark:border-slate-800/80">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-lg sm:text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-saffron-500 via-slate-800 to-emerald-600 dark:via-white truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
              🇮🇳 Sarkari<span className="text-saffron-500">Tracker</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Portal
            </span>
          </Link>

          <Link 
            to="/" 
            className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>

        {/* Centered Login / Register Card */}
        <div className="w-full max-w-[440px] mx-auto my-6 sm:my-8 bg-slate-50/70 dark:bg-[#121c2d] rounded-[30px] sm:rounded-[36px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Segmented Pill Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex bg-slate-200/80 dark:bg-[#090f1a] p-1.5 rounded-full border border-slate-300/50 dark:border-slate-800 shadow-2xs">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); }}
                className={`rounded-full px-6 py-2 text-xs sm:text-sm font-bold transition-all ${
                  mode === 'signin' 
                    ? 'bg-navy-950 dark:bg-white text-white dark:text-navy-950 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                className={`rounded-full px-6 py-2 text-xs sm:text-sm font-bold transition-all ${
                  mode === 'signup' 
                    ? 'bg-navy-950 dark:bg-white text-white dark:text-navy-950 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              {mode === 'signin' ? 'Candidate Sign In' : 'Create Candidate Account'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {mode === 'signin' 
                ? 'Access your tracked applications, admit cards & exam alerts'
                : 'Track 160+ official Indian & Karnataka government recruitment tests'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-fade-in font-medium">
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-white dark:bg-[#162235] border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-saffron-500 text-slate-900 dark:text-white placeholder-slate-400 shadow-2xs"
                    placeholder="Ashrith"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-white dark:bg-[#162235] border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-saffron-500 text-slate-900 dark:text-white placeholder-slate-400 shadow-2xs"
                    placeholder="H N"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-white dark:bg-[#162235] border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-saffron-500 text-slate-900 dark:text-white placeholder-slate-400 shadow-2xs"
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Mobile Number <span className="normal-case text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-white dark:bg-[#162235] border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-saffron-500 text-slate-900 dark:text-white placeholder-slate-400 shadow-2xs"
                    placeholder="9876543210"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Password * {mode === 'signup' && <span className="normal-case text-slate-400">(min 6 chars)</span>}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-2xl bg-white dark:bg-[#162235] border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-saffron-500 text-slate-900 dark:text-white placeholder-slate-400 shadow-2xs"
                  placeholder="••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-white dark:bg-[#162235] border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-saffron-500 text-slate-900 dark:text-white placeholder-slate-400 shadow-2xs"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-navy-950 dark:bg-white hover:bg-navy-900 dark:hover:bg-slate-100 text-white dark:text-navy-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{mode === 'signin' ? 'Sign In to Portal' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Footer switch note */}
          <div className="text-center pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {mode === 'signin' ? (
              <p>
                Don't have an account?{' '}
                <button 
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); }}
                  className="font-bold text-saffron-600 dark:text-saffron-400 hover:underline"
                >
                  Create one free
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={() => { setMode('signin'); setError(''); }}
                  className="font-bold text-saffron-600 dark:text-saffron-400 hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Bottom Trust Stamp */}
        <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800/80 font-medium">
          Official Government Exam Tracker • UPSC, SSC, Banking, Railways & Karnataka State
        </div>

      </div>
    </div>
  );
};

export default Auth;
