import Link from 'next/link';
import { ShieldCheck, Search, BookOpen, LogIn, ExternalLink } from 'lucide-react';
import { REACT_APP_URL } from '@/lib/api';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
            <span>🇮🇳</span>
            <span>Sarkari<span className="text-saffron-500">Tracker</span></span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Verified Portal
          </span>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <Link href="/" className="hover:text-saffron-600 transition-colors">
            All Exams
          </Link>
          <Link href="/blog" className="hover:text-saffron-600 transition-colors flex items-center gap-1">
            <BookOpen className="w-4 h-4 text-saffron-500" /> Prep Strategy
          </Link>
          <a 
            href={`${REACT_APP_URL}/calendar`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-saffron-600 transition-colors flex items-center gap-1 text-slate-500"
          >
            Exam Calendar <ExternalLink className="w-3 h-3" />
          </a>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <a
            href={`${REACT_APP_URL}/login`}
            className="btn-primary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5"
          >
            <LogIn className="w-4 h-4" />
            <span>Candidate Login</span>
          </a>
        </div>
      </div>
    </header>
  );
}
