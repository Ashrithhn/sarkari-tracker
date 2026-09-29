import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, X } from 'lucide-react';
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
        setError(err.message || 'Failed to sign in. Please verify your credentials.');
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
        setError('Please enter a valid email address (e.g. name@example.com)');
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
    <div className="min-h-screen bg-[#0a1929] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle gradient glow effect at bottom */}
      <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-[420px] bg-gray-900/90 backdrop-blur-xl rounded-[32px] border border-gray-800/80 p-6 sm:p-8 relative z-10 shadow-2xl">
        {/* Close Button */}
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Pill Toggle */}
        <div className="flex justify-center mb-8 mt-2">
          <div className="inline-flex bg-gray-800/60 rounded-full p-1">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); }}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
                mode === 'signin' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">
            {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-900/30 border border-red-800/40 flex items-start gap-2.5 text-sm text-red-300">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border-none text-white placeholder-gray-500 focus:ring-2 focus:ring-white/20 outline-none text-sm"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border-none text-white placeholder-gray-500 focus:ring-2 focus:ring-white/20 outline-none text-sm"
                />
              </div>
            </div>
          )}

          <div className="relative">
            <Mail className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              name="email"
              required
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-800 border-none text-white placeholder-gray-500 focus:ring-2 focus:ring-white/20 outline-none text-sm"
            />
          </div>

          {mode === 'signup' && (
            <div className="relative flex">
              <div className="flex items-center justify-center pl-4 pr-3 py-3.5 bg-gray-800 rounded-l-xl border-r border-gray-700/50">
                 <span className="text-base">🇮🇳</span>
                 <span className="text-gray-400 ml-1 text-sm">+91</span>
              </div>
              <input
                type="tel"
                name="phone"
                placeholder="Mobile number (optional)"
                value={formData.phone}
                onChange={handleChange}
                className="flex-1 px-4 py-3.5 rounded-r-xl bg-gray-800 border-none text-white placeholder-gray-500 focus:ring-2 focus:ring-white/20 outline-none text-sm"
              />
            </div>
          )}

          <div className="relative">
            <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-gray-800 border-none text-white placeholder-gray-500 focus:ring-2 focus:ring-white/20 outline-none text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {mode === 'signup' && (
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-800 border-none text-white placeholder-gray-500 focus:ring-2 focus:ring-white/20 outline-none text-sm"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-gray-900 font-bold rounded-xl py-3.5 mt-2 hover:bg-gray-100 transition-colors disabled:opacity-70 flex justify-center items-center text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-800"></div>
          <span className="text-[11px] font-medium text-gray-500 tracking-wider">
            OR {mode === 'signin' ? 'SIGN IN' : 'SIGN UP'} WITH
          </span>
          <div className="flex-1 h-px bg-gray-800"></div>
        </div>

        <div className="mt-6 flex gap-4">
          <button type="button" className="flex-1 bg-gray-800 hover:bg-gray-700/80 transition-colors py-2.5 rounded-xl flex justify-center items-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </button>
          <button type="button" className="flex-1 bg-gray-800 hover:bg-gray-700/80 transition-colors py-2.5 rounded-xl flex justify-center items-center text-white">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.72.845-1.391 2.285-1.221 3.654 1.35.104 2.662-.623 3.508-1.642z"/>
            </svg>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
