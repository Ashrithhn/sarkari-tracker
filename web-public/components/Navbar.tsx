import Link from 'next/link';
import { ShieldCheck, BookOpen, LogIn, ExternalLink } from 'lucide-react';
import { REACT_APP_URL } from '@/lib/api';

export default function Navbar() {
  return (
    <header className="w-full bg-transparent pb-4 border-b border-slate-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5" style={{ fontFamily: 'Sora, sans-serif' }}>
            <span>🇮🇳</span>
            <span>Sarkari<span className="text-saffron-500">Tracker</span></span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Verified Portal
          </span>
        </Link>

        {/* Center Nav with Pill Segments */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 text-xs font-bold text-slate-600">
          <Link href="/" className="px-4 py-1.5 rounded-full hover:text-slate-900 transition-colors">
            All Exams
          </Link>
          <Link href="/blog" className="px-4 py-1.5 rounded-full hover:text-slate-900 transition-colors flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-saffron-500" /> Prep Strategy
          </Link>
          <a 
            href={`${REACT_APP_URL}/calendar`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-1.5 rounded-full hover:text-slate-900 transition-colors flex items-center gap-1 text-slate-500"
          >
            Exam Calendar <ExternalLink className="w-3 h-3" />
          </a>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <a
            href={`${REACT_APP_URL}/login`}
            className="rounded-full bg-navy-950 hover:bg-navy-900 text-white font-bold text-xs sm:text-sm py-2 sm:py-2.5 px-5 sm:px-6 shadow-sm transition-all flex items-center gap-1.5 active:scale-98"
          >
            <LogIn className="w-4 h-4" />
            <span>Candidate Login</span>
          </a>
        </div>
      </div>
    </header>
  );
}
