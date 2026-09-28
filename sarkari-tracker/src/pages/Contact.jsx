import React, { useState } from 'react';
import { Mail, Clock, Send, ShieldCheck, HelpCircle, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Exam Date Discrepancy / Notification Update',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill out all required fields.');
      return;
    }
    // Form action simulation / mailto trigger
    window.location.href = `mailto:techtherapy1818@gmail.com?subject=${encodeURIComponent(`[SarkariTracker ${formData.subject}] from ${formData.name}`)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\nTopic: ${formData.subject}\n\nMessage:\n${formData.message}`)}`;
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10 animate-fade-in">
      {/* Top Banner */}
      <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-center max-w-2xl mx-auto space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-saffron-50 dark:bg-saffron-950/40 text-saffron-600 dark:text-saffron-400 mx-auto flex items-center justify-center">
          <Mail className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Contact & Aspirant Support
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Have a question, feedback, or noticed a newly published notification schedule? Our editorial and technical support team is here to assist.
        </p>
      </div>

      {/* Main Grid: Form + Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Direct Info Cards */}
        <div className="space-y-4">
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-saffron-500" /> Direct Communication
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium block">Official Email:</span>
                <a 
                  href="mailto:techtherapy1818@gmail.com" 
                  className="font-bold text-sm text-saffron-600 dark:text-saffron-400 hover:underline break-all"
                >
                  techtherapy1818@gmail.com
                </a>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Working Hours:
                </span>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Monday – Saturday: 9:00 AM – 6:00 PM IST
                </p>
                <p className="text-[11px] text-slate-400">
                  Typical email turnaround: 24 to 48 hours.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300 space-y-1">
                <span className="font-bold flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Editorial Integrity
                </span>
                <p className="text-[11px] leading-relaxed">
                  Corrections regarding official examination dates are audited against official commission notifications and updated within 6 hours.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-saffron-500" /> Send a Message
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Fill out the details below. This will launch your email client with our verified support desk pre-addressed.
            </p>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  Draft Dispatched to techtherapy1818@gmail.com
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Thank you! If your email client didn't open automatically, you can directly email us at <strong className="font-mono">techtherapy1818@gmail.com</strong>.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn-secondary text-xs mt-3 py-1.5 px-4"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Your Full Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="input-field text-xs sm:text-sm py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address *
                    </label>
                    <input 
                      type="email" 
                      required
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="input-field text-xs sm:text-sm py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Subject / Category
                  </label>
                  <select
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="input-field text-xs sm:text-sm py-2"
                  >
                    <option value="Exam Date Discrepancy / Notification Update">Exam Date Discrepancy / Notification Update</option>
                    <option value="Request to Add New Government Exam">Request to Add New Government Exam</option>
                    <option value="Bug Report or Technical Issue">Bug Report or Technical Issue</option>
                    <option value="Account or Data Erasure Request">Account or Data Erasure Request</option>
                    <option value="General Feedback">General Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Message / Description *
                  </label>
                  <textarea 
                    rows="5"
                    required
                    placeholder="Provide details, official notification links, or exam names..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="input-field text-xs sm:text-sm py-2 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary text-xs sm:text-sm py-2.5 px-6 flex items-center justify-center gap-2 w-full sm:w-auto shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message to techtherapy1818@gmail.com</span>
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* Frequently Asked Questions */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-saffron-500" /> Frequently Asked Questions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              Q: Is SarkariTracker free for all students?
            </h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Yes, our tracking dashboard, deadline timers, document checklists, and verified notifications are 100% free for all aspirants across India.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              Q: Can SarkariTracker submit my application or pay fees?
            </h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              No. We are not an official government portal. You must always submit your actual forms and fees on the official commission websites linked in each exam card.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              Q: What is the difference between Confirmed and Expected dates?
            </h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Confirmed dates (green badge) are verified from official government circulars or commission notices. Expected dates (amber badge) are reported by reputable news media and remain tentative until official notification.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              Q: How do I report a schedule change?
            </h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Email us at <a href="mailto:techtherapy1818@gmail.com" className="text-saffron-600 font-bold hover:underline">techtherapy1818@gmail.com</a> with the official PDF notification link, and our editorial desk will review and publish it within hours.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Contact;
