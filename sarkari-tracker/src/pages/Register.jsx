import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, UserPlus, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CATEGORY_OPTIONS = [
  { id: 'SSC', label: 'SSC (CGL, CHSL, MTS)' },
  { id: 'Banking', label: 'Banking (IBPS, SBI, RBI)' },
  { id: 'Railway', label: 'Railways (RRB NTPC, ALP)' },
  { id: 'UPSC', label: 'UPSC (CSE, CDS, NDA)' },
  { id: 'PSU', label: 'PSU (ONGC, BHEL, NTPC)' },
  { id: 'State', label: 'State PSCs' },
];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [autoDetect, setAutoDetect] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState(['SSC', 'Banking', 'Railway']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleCategory = (catId) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(c => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
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
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        autoDetectApplications: autoDetect,
        targetCategories: selectedCategories
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 gradient-navy-light dark:gradient-navy relative overflow-hidden py-12">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-saffron-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-navy-500/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-saffron-500 to-navy-700 rounded-2xl shadow-xl shadow-saffron-500/20 text-2xl mb-3">
            🇮🇳
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-navy-700 via-saffron-600 to-navy-900 dark:from-navy-200 dark:via-saffron-400 dark:to-white tracking-tight">
            SarkariTracker
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            All Government Job Applications, Deadlines, Syllabus & Cutoffs in One Place
          </p>
        </div>

        <div className="glass-card rounded-3xl shadow-2xl overflow-hidden p-8 animate-fade-in border border-white/40 dark:border-gray-700/60">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">Create Candidate Profile</h2>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-6">
            Register with your email ID or mobile to track and sync all your government exam applications.
          </p>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-xl flex items-start">
              <AlertCircle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Full Name *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10 w-full text-sm"
                  placeholder="Rahul Sharma"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Email ID *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pl-10 w-full text-sm"
                    placeholder="candidate@govmail.in"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field pl-10 w-full text-sm"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field pl-10 w-full text-sm"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Confirm Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-field pl-10 w-full text-sm"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
            </div>

            {/* Smart Application Recognition Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-saffron-500/5 to-navy-500/10 border border-saffron-500/30 my-4">
              <div className="flex items-start gap-2.5 mb-2.5">
                <Sparkles className="w-5 h-5 text-saffron-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    Smart Job Portal Recognition
                    <span className="text-[10px] bg-saffron-500 text-white font-extrabold px-1.5 py-0.5 rounded">NEW</span>
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Automatically recognize your applied government exams, last date alerts, syllabus, PYQs & cutoff trackers.
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                  Select your target examination categories:
                </span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-xl font-medium border transition-all ${
                          isSelected
                            ? 'bg-saffron-500 text-white border-saffron-600 shadow-sm'
                            : 'bg-white dark:bg-navy-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {isSelected && '✓ '} {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center py-3 text-base shadow-lg shadow-saffron-500/25"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Setting up Portal & Syncing Exams...
                </div>
              ) : (
                <div className="flex items-center">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Register & Track My Exams
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-saffron-600 dark:text-saffron-400 hover:underline">
              Sign In
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

export default Register;
