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
    <article className="bg-white p-5 sm:p-6 rounded-[26px] sm:rounded-[30px] border border-slate-200/80 flex flex-col justify-between hover:border-saffron-400 hover:shadow-md transition-all duration-200 shadow-2xs">
      <div className="space-y-3">
        {/* Header tags */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-saffron-50 text-saffron-800 border border-saffron-200/60">
            {exam.category} {exam.state ? `• ${exam.state}` : ''}
          </span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Verified Source
          </span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 line-clamp-2 leading-snug">
            <Link href={`/exams/${exam.slug}`} className="hover:text-saffron-600 transition-colors">
              {exam.name}
            </Link>
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">
            {exam.conducting_body}
          </p>
        </div>

        {/* Dates preview */}
        <div className="space-y-1.5 pt-1">
          <DateBadge label="Last Date" field={exam.dates?.apply_end} />
          <DateBadge label="Exam Date" field={exam.dates?.exam_date} />
        </div>
      </div>

      {/* Actions with Rounded-Full Pills */}
      <div className="pt-5 mt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <Link
          href={`/exams/${exam.slug}`}
          className="rounded-full bg-navy-950 hover:bg-navy-900 text-white font-bold text-xs py-2.5 px-4 text-center justify-center flex items-center gap-1 shadow-2xs transition-all active:scale-98 flex-1"
        >
          <span>View Details & Syllabus</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        {/* "I applied" CTA linking to React App */}
        <a
          href={applyLink}
          className="rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs py-2.5 px-4 text-center justify-center flex items-center gap-1 transition-all active:scale-98 shrink-0"
          title="Log in to add this exam to your personal SarkariTracker checklist"
        >
          <CheckSquare className="w-3.5 h-3.5 text-saffron-500" />
          <span>Track</span>
        </a>
      </div>
    </article>
  );
}
