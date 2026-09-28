import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Target, Heart, Award, CheckCircle2, AlertCircle, Mail, ExternalLink } from 'lucide-react';

const About = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10 animate-fade-in">
      {/* Hero */}
      <div className="glass-card p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-saffron-50 dark:bg-saffron-950/40 text-saffron-700 dark:text-saffron-300 text-xs font-bold border border-saffron-200 dark:border-saffron-900/50">
          <span>🇮🇳 Built for Indian Aspirants</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          About Sarkari<span className="text-saffron-500">Tracker</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          An honest, zero-compromise examination tracking platform created to protect competitive exam aspirants from misinformation, fake clickbait dates, and unverified recruitment rumors.
        </p>
      </div>

      {/* Why We Built This */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-saffron-500" /> The Problem We Are Solving
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Every year, millions of dedicated young students across India prepare tirelessly for government recruitments—from UPSC, SSC, and Banking to state boards like Karnataka KEA, KPSC, GPSTR, and police departments.
        </p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Yet, when they search online for exam schedules or last dates, they are flooded with predatory coaching websites displaying fabricated dates, clickbait headlines, and fake cutoffs just to farm advertisement impressions. When a student mistakes a fake "expected last date" for a real one, they miss the official application window and lose an entire year of their youth.
        </p>
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 font-medium">
          "We founded SarkariTracker on a single sacred rule: If a date is not officially announced in an official commission notification, we will NEVER invent or guess it. We write 'Notice Awaited' instead."
        </div>
      </div>

      {/* Core Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            100% Verified Authentic Data
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Every date on our platform is either verified with the official source URL and verification timestamp or explicitly marked as awaited.
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Strict Visual Transparency
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            We clearly separate 🟢 <strong>Confirmed Official Dates</strong> (official commission schedule) from 🟡 <strong>Tentative / Expected Dates</strong> (media reports) so you are never misled.
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Candidate Priority First
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your personal target dates and shift numbers always override general commission estimates in your personal countdown timers and calendars.
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Zero Commercial Exploitation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            No selling of candidate phone numbers to coaching institutions. Your preparation data belongs to you alone.
          </p>
        </div>
      </div>

      {/* Contact & Editorial Desk */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Mail className="w-5 h-5 text-saffron-500" /> Editorial Desk & Aspirant Support
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          SarkariTracker is maintained by an independent engineering team dedicated to public service technology. For press inquiries, notification corrections, or institutional suggestions:
        </p>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
          <Mail className="w-4 h-4 text-saffron-500" />
          <span>Email:</span>
          <a href="mailto:techtherapy1818@gmail.com" className="text-saffron-600 dark:text-saffron-400 hover:underline">
            techtherapy1818@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
