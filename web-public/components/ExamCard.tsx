import Link from 'next/link';
import { ExamSummary, REACT_APP_URL } from '@/lib/api';
import { ShieldCheck, ExternalLink, ArrowRight, CheckSquare, Clock } from 'lucide-react';
import DateBadge from './DateBadge';

interface ExamCardProps {
  exam: ExamSummary;
}

export default function ExamCard({ exam }: ExamCardProps) {
  const applyLink = `${REACT_APP_URL}/login?redirect=${encodeURIComponent(`/exams/${exam.id}`)}`;

  return (
    <article className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col justify-between hover:border-saffron-400 hover:shadow-md transition-all duration-200">
      <div className="space-y-3">
        {/* Header tags */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-saffron-100 text-saffron-800 border border-saffron-200">
            {exam.category} {exam.state ? `• ${exam.state}` : ''}
          </span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Verified Source
          </span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-2 leading-snug">
            <Link href={`/exams/${exam.slug}`} className="hover:text-saffron-600 transition-colors">
              {exam.name}
            </Link>
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
            {exam.conducting_body}
          </p>
        </div>

        {/* Dates preview */}
        <div className="space-y-1.5 pt-1">
          <DateBadge label="Last Date" field={exam.dates?.apply_end} />
          <DateBadge label="Exam Date" field={exam.dates?.exam_date} />
        </div>
      </div>

      {/* Actions */}
      <div className="pt-5 mt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <Link
          href={`/exams/${exam.slug}`}
          className="btn-primary text-xs py-2 px-3 flex-1 text-center justify-center flex items-center gap-1"
        >
          <span>View Details & Syllabus</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        {/* "I applied" CTA linking to React App */}
        <a
          href={applyLink}
          className="btn-secondary text-xs py-2 px-3 text-center justify-center flex items-center gap-1 text-saffron-700 border-saffron-300 hover:bg-saffron-50 shrink-0"
          title="Log in to add this exam to your personal SarkariTracker checklist"
        >
          <CheckSquare className="w-3.5 h-3.5 text-saffron-600" />
          <span>I Applied</span>
        </a>

        {exam.official_site && (
          <a
            href={exam.official_site}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center"
            title="Open official government commission portal"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </article>
  );
}
