import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 gradient-navy-light dark:gradient-navy relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-saffron-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-navy-500/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-navy-600 to-saffron-500 dark:from-navy-400 dark:to-saffron-400 tracking-tight">
            SarkariTracker
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Your ultimate government exam companion</p>
        </div>

        <div className="glass-card rounded-2xl shadow-xl overflow-hidden p-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Welcome Back</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-md flex items-start">
              <AlertCircle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10 w-full"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 w-full"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-saffron-600 focus:ring-saffron-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-navy-600 hover:text-navy-500 dark:text-navy-400 dark:hover:text-navy-300">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex justify-center items-center py-3 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="mr-2" size={18} /> Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-saffron-600 hover:text-saffron-500 dark:text-saffron-400 dark:hover:text-saffron-300 transition-colors">
              Create an account
            </Link>
          </div>

          {/* Genuine Trust Sub-Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-center text-slate-500 space-y-2">
            <p>
              Independent Educational Portal. Not affiliated with UPSC, SSC, KEA, or KPSC.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/disclaimer" className="hover:underline">Legal Disclaimer</Link>
              <span>•</span>
              <Link to="/privacy-policy" className="hover:underline">Privacy</Link>
              <span>•</span>
              <Link to="/terms-of-service" className="hover:underline">Terms</Link>
              <span>•</span>
              <Link to="/contact" className="hover:underline">Contact</Link>
              <span>•</span>
              <a href="mailto:techtherapy1818@gmail.com" className="hover:underline font-mono">techtherapy1818@gmail.com</a>
            </div>
            <p className="text-[10px] text-slate-400">© 2026 SarkariTracker. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
