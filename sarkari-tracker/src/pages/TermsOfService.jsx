import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ShieldCheck, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 text-xs font-bold mb-3 border border-purple-200 dark:border-purple-900/50">
          <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>Terms & Conditions Agreement</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Last Updated: September 2026 | Please read these Terms carefully before using SarkariTracker.
        </p>
      </div>

      {/* Main Content */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        
        {/* Section 1: Acceptance */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">1</span>
            Acceptance of Terms
          </h2>
          <p>
            By creating an account, browsing, or utilizing any features of <strong>SarkariTracker</strong> (accessible at sarkaritracker.in), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Disclaimer and Privacy Policy. If you do not agree with any part of these terms, you must refrain from using the platform.
          </p>
        </section>

        {/* Section 2: Platform Purpose & Scope */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">2</span>
            Nature of the Service
          </h2>
          <p>
            SarkariTracker is strictly an <strong>educational planning, milestone tracking, and public informational aid</strong> for competitive exam aspirants.
          </p>
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /> Important Distinction:
            </p>
            <p>
              SarkariTracker is <strong>NOT an official application submission portal</strong>. We do not collect government application fees on behalf of commissions, nor do we issue official admit cards or declare examination results. Candidates are solely responsible for completing actual application submissions and fee payments on the respective commission websites (e.g. <code>cetonline.karnataka.gov.in</code>, <code>ssc.gov.in</code>, <code>upsc.gov.in</code>).
            </p>
          </div>
        </section>

        {/* Section 3: User Accounts & Acceptable Use */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">3</span>
            User Accounts & Acceptable Use
          </h2>
          <p>
            You agree to provide true and accurate information during registration. You are responsible for safeguarding your login credentials. You agree NOT to:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <li>Deploy automated scrapers, denial-of-service bots, or malicious scripts against our servers.</li>
            <li>Use the platform for any fraudulent or unlawful recruitment activity.</li>
            <li>Misrepresent yourself as a government official, commission representative, or recruiting officer.</li>
          </ul>
        </section>

        {/* Section 4: Limitation of Liability */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">4</span>
            Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable Indian law, SarkariTracker and its developers shall not be liable for any direct, indirect, incidental, consequential, or punitive damages resulting from:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <li>Any rescheduling, postponement, cancellation, or amendment of examination dates by any government authority.</li>
            <li>Technical downtime, server interruptions, or network latency affecting notifications or reminders.</li>
            <li>A candidate's failure to independently cross-verify last dates, resulting in missed recruitment opportunities.</li>
          </ul>
        </section>

        {/* Section 5: Governing Law & Contact */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">5</span>
            Governing Law & Legal Inquiries
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in India.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
            <Mail className="w-4 h-4 text-saffron-500" />
            <span>Legal Desk:</span>
            <a href="mailto:techtherapy1818@gmail.com" className="text-saffron-600 dark:text-saffron-400 hover:underline">
              techtherapy1818@gmail.com
            </a>
          </div>
        </section>

      </div>
    </div>
  );
};

export default TermsOfService;
