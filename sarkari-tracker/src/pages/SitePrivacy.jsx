import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ShieldCheck, Mail, FileText, CheckCircle2, UserCheck } from 'lucide-react';

const SitePrivacy = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs font-bold mb-3 border border-blue-200 dark:border-blue-900/50">
          <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Aspirant Data Privacy Guarantee</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Last Updated: September 2026 | We respect your privacy and protect candidate records with zero commercial monetization.
        </p>
      </div>

      {/* Main Policy Content */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        
        {/* Section 1: Overview */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">1</span>
            Our Privacy Commitment
          </h2>
          <p>
            At <strong>SarkariTracker</strong> (accessible at sarkaritracker.in), one of our fundamental priorities is the privacy and dignity of government job aspirants. This Privacy Policy document describes the types of personal information that is collected and recorded by SarkariTracker and how we handle it.
          </p>
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-xs font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Strict Zero-Monetization Pledge: We NEVER sell, rent, or trade candidate contact information or application records to private coaching institutes, spam telemarketers, or third-party advertisers.</span>
          </div>
        </section>

        {/* Section 2: Information We Collect */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">2</span>
            Information We Collect
          </h2>
          <p>When you register and use SarkariTracker, we collect:</p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <li><strong>Account Identification:</strong> Full name, email address, optional contact number, and encrypted password credentials.</li>
            <li><strong>Personal Application Tracking Data:</strong> The official or custom exams you add to your tracker, registration numbers, roll numbers (if recorded by you for personal convenience), candidate category (UR, OBC, SC, ST, 2A, 2B, etc.), and fee payment checkboxes.</li>
            <li><strong>Personal Dates & Milestones:</strong> Any custom exam target dates, shift dates, or personal notes you enter to override commission estimates.</li>
            <li><strong>Document Checklists:</strong> Checkboxes representing document readiness (e.g. Photo, Signature, Degree Certificate, Caste Certificate).</li>
          </ul>
        </section>

        {/* Section 3: How We Use Your Information */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">3</span>
            How Your Information is Used
          </h2>
          <p>Your data is used solely to provide and improve your application tracking experience, including:</p>
          <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <li>Calculating accurate countdown timers (T-7, T-3, T-1 day application deadlines).</li>
            <li>Generating your personal monthly exam calendar.</li>
            <li>Delivering in-app notifications when official commission notifications or schedules are confirmed.</li>
            <li>Enabling keyword intelligence analysis for unlisted custom jobs.</li>
          </ul>
        </section>

        {/* Section 4: Security & Passwords */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">4</span>
            Data Security & Cryptography
          </h2>
          <p>
            We implement industry-standard technical safeguards to protect your personal data. All user passwords are irreversibly hashed using <strong>bcrypt with 10 salt rounds</strong> before storage. Sessions are authenticated using cryptographically signed JSON Web Tokens (JWT).
          </p>
        </section>

        {/* Section 5: Cookies & Local Storage */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">5</span>
            Cookies & Local Storage
          </h2>
          <p>
            SarkariTracker does not use third-party behavioral tracking cookies or invasive surveillance pixels. We use browser Local Storage strictly for essential functions:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <li><code>sarkari_token</code>: Your active encrypted authentication session.</li>
            <li><code>sarkari_theme</code>: Persisting your selected dark or light mode preference.</li>
          </ul>
        </section>

        {/* Section 6: Candidate Rights & Data Erasure */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">6</span>
            Candidate Rights & Account Deletion
          </h2>
          <p>
            You have full sovereignty over your data. You may delete any tracked job, clear your checklist items, or request complete account erasure at any time by contacting our privacy desk.
          </p>
        </section>

        {/* Section 7: Grievance Officer Contact */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">7</span>
            Grievance Officer & Privacy Inquiries
          </h2>
          <p>
            For any queries, concerns, or data erasure requests in compliance with Information Technology (Reasonable security practices and procedures and sensitive personal data or information) Rules, please reach out to our designated Grievance Officer:
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
            <p className="font-bold text-slate-900 dark:text-white">Grievance & Privacy Desk — SarkariTracker</p>
            <p className="text-slate-500 dark:text-slate-400">Support & Legal Inquiries: <a href="mailto:techtherapy1818@gmail.com" className="font-semibold text-saffron-600 dark:text-saffron-400 hover:underline">techtherapy1818@gmail.com</a></p>
            <p className="text-slate-400">Response turnaround: Within 48 business hours.</p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default SitePrivacy;
