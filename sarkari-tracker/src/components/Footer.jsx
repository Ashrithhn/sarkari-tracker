import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, ExternalLink, AlertTriangle, FileText, Lock, HelpCircle, Heart, CheckCircle2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-slate-600 dark:text-slate-400">
      {/* Top Advisory Banner */}
      <div className="bg-amber-500/10 dark:bg-amber-950/30 border-b border-amber-500/20 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <p>
            <strong>Official Cross-Verification Advisory:</strong> SarkariTracker provides informational tracking and web intelligence. Always cross-verify exam dates, eligibility criteria, and fee structures from respective official commission notifications (KEA, KPSC, SSC, UPSC, IBPS, RRB).
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Col 1 & 2: Branding & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                🇮🇳 Sarkari<span className="text-saffron-500">Tracker</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Verified Portal
              </span>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed pr-4">
              India's authentic government exam tracking portal with strict zero dummy data enforcement. Tracking 85+ verified central and state commissions including Karnataka KEA, KPSC, KREIS, banking, railways, and PSUs.
            </p>

            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <Mail className="w-4 h-4 text-saffron-500 shrink-0" />
                <span>Contact & Grievances:</span>
                <a 
                  href="mailto:techtherapy1818@gmail.com" 
                  className="font-semibold text-saffron-600 dark:text-saffron-400 hover:underline"
                >
                  techtherapy1818@gmail.com
                </a>
              </div>
              <p className="text-[11px] text-slate-400 pl-6">
                Support response within 24-48 business hours.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Genuine Sources
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                <Lock className="w-3.5 h-3.5" /> SSL Encrypted
              </span>
            </div>
          </div>

          {/* Col 3: Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Aspirant Hub
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/tracker" className="hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                  My Applications
                </Link>
              </li>
              <li>
                <Link to="/calendar" className="hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                  Exam Calendar
                </Link>
              </li>
              <li>
                <Link to="/notifications" className="hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                  Official Notifications & Alerts
                </Link>
              </li>
              <li>
                <Link to="/resources" className="hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                  Syllabus & Study Resources
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                  About Our Mission
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Top State & Central Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Official Commission Links
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="https://cetonline.karnataka.gov.in/kea/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                  <span>KEA Official Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://kpsc.kar.nic.in" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                  <span>KPSC Karnataka</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://ssc.gov.in" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                  <span>Staff Selection Commission (SSC)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://upsc.gov.in" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                  <span>UPSC Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://ibps.in" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                  <span>IBPS Banking</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Legal & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Legal & Trust
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/disclaimer" className="font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                  Full Legal Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                  Contact Us & Grievances
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                  Transparency Statement
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Detailed Mandatory Non-Affiliation Disclaimer Block */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
          <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-saffron-500" /> Non-Government Organization (NGO) & Informational Disclaimer
          </p>
          <p>
            SarkariTracker (<strong>sarkaritracker.in</strong>) is an independent private informational portal and productivity application designed to assist Indian job aspirants in tracking application milestones. <strong>SarkariTracker is NOT affiliated, associated, authorized, endorsed by, or in any way officially connected with the Government of India, any State Government, or any of their statutory recruitment commissions</strong> (including but not limited to UPSC, SSC, KEA, KPSC, Railway Recruitment Boards, or State Education Departments).
          </p>
          <p>
            All registered trademarks, commission names, acronyms, and recruitment symbols referenced on this website belong to their respective government bodies. Use of them does not imply any affiliation with or endorsement by them. Although we strive to verify all information against official circulars and notices, candidates must check the official websites for definitive rules, syllabi, and official schedules.
          </p>
        </div>

        {/* Bottom Copyright & Rights Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} <strong>SarkariTracker</strong>. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <Link to="/disclaimer" className="hover:underline">Disclaimer</Link>
            <span>•</span>
            <Link to="/privacy-policy" className="hover:underline">Privacy</Link>
            <span>•</span>
            <Link to="/terms-of-service" className="hover:underline">Terms</Link>
            <span>•</span>
            <Link to="/contact" className="hover:underline">Help</Link>
            <span>•</span>
            <a href="mailto:techtherapy1818@gmail.com" className="hover:underline font-mono">techtherapy1818@gmail.com</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
