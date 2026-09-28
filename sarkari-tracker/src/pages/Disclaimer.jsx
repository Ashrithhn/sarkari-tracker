import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldCheck, ExternalLink, Mail, CheckCircle2 } from 'lucide-react';

const Disclaimer = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3 border border-amber-200 dark:border-amber-900/50">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Legal Disclaimer & Non-Affiliation Notice</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Disclaimer & Official Advisory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Last Updated: September 2026 | Effective immediately for all visitors and registered candidates.
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        
        {/* Section 1: Non-Affiliation */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">1</span>
            Non-Affiliation with Government Bodies
          </h2>
          <p>
            <strong>SarkariTracker</strong> is an independent educational technology and personal productivity tracking platform. <strong>SarkariTracker is NOT a government entity, nor is it associated, authorized, endorsed by, or affiliated with the Government of India, State Governments, or any government commission or recruitment board</strong>, including but not limited to:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <li>Union Public Service Commission (UPSC)</li>
            <li>Staff Selection Commission (SSC)</li>
            <li>Karnataka Examination Authority (KEA)</li>
            <li>Karnataka Public Service Commission (KPSC)</li>
            <li>Railway Recruitment Boards (RRB)</li>
            <li>Institute of Banking Personnel Selection (IBPS)</li>
            <li>Public Sector Undertakings (PSUs: ONGC, BHEL, IOCL, GAIL, KPTCL)</li>
            <li>State Police, Education, and Revenue Departments</li>
          </ul>
          <p className="text-xs text-slate-500">
            The use of official commission logos, names, acronyms, and exam designations is strictly for descriptive, identification, and educational reference under the doctrine of fair use.
          </p>
        </section>

        {/* Section 2: Information Accuracy Policy */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">2</span>
            Accuracy of Information & Verification Policy
          </h2>
          <p>
            Our core operating principle is <strong>"No Dummy / Fake Data"</strong>. We enforce that:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> 🟢 Confirmed Official Dates
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Backed by published Official Commission notifications, Commission press notes, or verified PDFs with direct source links.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> 🟡 Expected / Tentative Dates
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Discovered via public web intelligence and news reports. Clearly marked as <em>Expected</em> so aspirants are never misled.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            Where dates have not been announced by the conducting body, we explicitly state <strong>"Will be updated soon / Notice Awaited"</strong> rather than inventing arbitrary estimates.
          </p>
        </section>

        {/* Section 3: Candidate Verification Obligation */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">3</span>
            Aspirant's Mandatory Verification Obligation
          </h2>
          <p>
            While our team exercises due diligence to cross-reference data from primary government portals, candidates are <strong>strictly advised to verify all critical details directly from official commission portals</strong> prior to taking any financial, legal, or procedural action (e.g. paying application fees, submitting certificates, or booking travel for exam dates).
          </p>
          <p className="text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            SarkariTracker shall not be held liable for any loss, damage, missed deadline, rejection of application, or inconvenience resulting from discrepancies, commission date alterations, or reliance on information provided on this platform.
          </p>
        </section>

        {/* Section 4: External Links & Third-Party Portals */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">4</span>
            External Links & Government Portals
          </h2>
          <p>
            Our service provides outbound hyperlinks to third-party commission portals (e.g., <code>cetonline.karnataka.gov.in</code>, <code>ssc.gov.in</code>). We have no editorial or technical control over the content, uptime, or privacy practices of external websites.
          </p>
        </section>

        {/* Section 5: Contact & Feedback */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-800 dark:bg-saffron-950/60 dark:text-saffron-300 text-xs flex items-center justify-center font-black">5</span>
            Reporting Discrepancies & Grievances
          </h2>
          <p>
            If you notice any schedule change, notification amendment, or factual discrepancy, please report it immediately to our editorial desk:
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <Mail className="w-4 h-4 text-saffron-500" />
            <span>Email:</span>
            <a href="mailto:techtherapy1818@gmail.com" className="text-saffron-600 dark:text-saffron-400 hover:underline">
              techtherapy1818@gmail.com
            </a>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Disclaimer;
