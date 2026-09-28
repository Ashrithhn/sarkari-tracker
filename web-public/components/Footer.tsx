import Link from 'next/link';
import { ShieldCheck, Mail, AlertTriangle, ExternalLink } from 'lucide-react';
import { REACT_APP_URL } from '@/lib/api';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white text-slate-600 text-xs">
      {/* Top Advisory Strip */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-2.5 text-xs text-amber-900 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <p>
            <strong>Official Cross-Verification Advisory:</strong> SarkariTracker provides informational tracking and web intelligence. Always cross-verify exam dates, eligibility criteria, and fee structures from respective official commission notifications (KEA, KPSC, SSC, UPSC, IBPS, RRB).
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <span className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>🇮🇳</span>
              <span>Sarkari<span className="text-saffron-500">Tracker</span></span>
            </span>
            <p className="text-slate-500 leading-relaxed text-xs max-w-md">
              India's authentic government exam tracking portal with verified commission dates and zero fake data. Comprehensive coverage across Karnataka State (KEA, KPSC, KREIS), Banking, SSC, UPSC, and Central PSUs.
            </p>
            <div className="flex items-center gap-2 pt-1 font-medium text-slate-700">
              <Mail className="w-4 h-4 text-saffron-500 shrink-0" />
              <span>Contact:</span>
              <a href="mailto:techtherapy1818@gmail.com" className="font-semibold text-saffron-600 hover:underline">
                techtherapy1818@gmail.com
              </a>
            </div>
          </div>

          {/* Useful Navigation */}
          <div>
            <h4 className="font-bold uppercase tracking-wider text-slate-900 mb-3 text-xs">
              Portal Directory
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-saffron-600 transition-colors">
                  All 88+ Government Exams
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-saffron-600 transition-colors">
                  Syllabus & Preparation Guides
                </Link>
              </li>
              <li>
                <a href={`${REACT_APP_URL}/calendar`} className="hover:text-saffron-600 transition-colors flex items-center gap-1">
                  Exam Calendar <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a href={`${REACT_APP_URL}/tracker`} className="hover:text-saffron-600 transition-colors flex items-center gap-1">
                  Candidate Application Tracker <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold uppercase tracking-wider text-slate-900 mb-3 text-xs">
              Transparency & Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <a href={`${REACT_APP_URL}/disclaimer`} className="hover:text-saffron-600 font-semibold text-amber-700">
                  Full Legal Disclaimer
                </a>
              </li>
              <li>
                <a href={`${REACT_APP_URL}/privacy-policy`} className="hover:text-saffron-600">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href={`${REACT_APP_URL}/terms-of-service`} className="hover:text-saffron-600">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href={`${REACT_APP_URL}/contact`} className="hover:text-saffron-600">
                  Grievances & Advisory Desk
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Detailed Non-Affiliation Block */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
          <p className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-saffron-500" /> Non-Affiliation Notice
          </p>
          <p>
            SarkariTracker is an independent educational platform and is NOT affiliated with, authorized, or endorsed by the Government of India, State Governments, UPSC, SSC, KEA, or KPSC. All trademarks and commission titles belong to their respective owners.
          </p>
        </div>

        {/* Copyright */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
          <p>© {new Date().getFullYear()} SarkariTracker. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Link href="/sitemap.xml" className="hover:underline">Sitemap</Link>
            <span>•</span>
            <Link href="/robots.txt" className="hover:underline">Robots.txt</Link>
            <span>•</span>
            <a href="mailto:techtherapy1818@gmail.com" className="hover:underline">techtherapy1818@gmail.com</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
