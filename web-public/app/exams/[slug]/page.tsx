import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  getPublishedExamBySlug, getPublishedExams, SITE_URL, REACT_APP_URL 
} from '@/lib/api';
import DateBadge, { formatDateDDMMYYYY } from '@/components/DateBadge';
import { 
  ShieldCheck, ExternalLink, Calendar, FileText, CheckSquare, 
  HelpCircle, ArrowLeft, BookOpen, AlertTriangle, Building2, CheckCircle2, Clock
} from 'lucide-react';

export const revalidate = 300; // ISR 300 seconds

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const exams = await getPublishedExams();
  return exams.map((ex) => ({
    slug: ex.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const exam = await getPublishedExamBySlug(params.slug);

  if (!exam) {
    return {
      title: 'Exam Not Found | SarkariTracker',
      description: 'The requested government exam could not be found.',
    };
  }

  const title = `${exam.name} 2026: Exam Date, Syllabus, Eligibility & Cutoff`;
  const description = `Official notifications and verified dates for ${exam.name} conducted by ${exam.conducting_body}. Verified application timeline, official portal link, and syllabus.`;
  const canonicalUrl = `${SITE_URL}/exams/${exam.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      siteName: 'SarkariTracker',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${exam.short_name} 2026 Official Details`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  };
}

function formatVacancies(v: any): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return v.toLocaleString('en-IN');
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    if (v.total !== undefined && v.total !== null) return String(v.total);
    if (v.count !== undefined && v.count !== null) return String(v.count);
    return Object.entries(v)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');
  }
  return String(v);
}

function formatEligibilityOrFee(val: any): string | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return Object.entries(val)
      .map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${v}`)
      .join('\n');
  }
  return String(val);
}

export default async function ExamDetailPage({ params }: PageProps) {
  const exam = await getPublishedExamBySlug(params.slug);

  if (!exam) {
    notFound();
  }

  const applyLink = `${REACT_APP_URL}/login?redirect=${encodeURIComponent(`/exams/${exam.id}`)}`;

  // JSON-LD Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: exam.name,
    serviceType: `${exam.category} Government Recruitment Examination`,
    provider: {
      '@type': 'GovernmentOrganization',
      name: exam.conducting_body,
      url: exam.official_site
    },
    url: `${SITE_URL}/exams/${exam.slug}`,
    description: `Official recruitment details, syllabus, cutoffs and schedule for ${exam.name}.`,
    dateModified: exam.last_verified_at || new Date().toISOString()
  };

  const formattedVacancies = formatVacancies(exam.content?.vacancies?.data);
  const formattedEligibility = formatEligibilityOrFee(exam.content?.eligibility?.data);
  const formattedFee = formatEligibilityOrFee(exam.content?.fee?.data);
  const syllabus = exam.content?.syllabus?.data;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Back breadcrumb */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-saffron-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Government Exams</span>
          </Link>
        </div>

        {/* Hero Header */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-saffron-100 text-saffron-800 border border-saffron-200">
                {exam.category} {exam.state ? `• ${exam.state}` : ''}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {exam.level.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified: {exam.last_verified_at ? formatDateDDMMYYYY(exam.last_verified_at) : 'Active Listing'}</span>
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {exam.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
              Conducted by: <strong className="text-slate-900">{exam.conducting_body}</strong>
            </p>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* "I applied" CTA linking to React App */}
              <a
                href={applyLink}
                className="btn-primary text-xs sm:text-sm py-2 px-4 flex items-center gap-1.5 shadow-md"
              >
                <CheckSquare className="w-4 h-4" />
                <span>I Applied (Track in App)</span>
              </a>

              {exam.official_site && (
                <a
                  href={exam.official_site}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs sm:text-sm py-2 px-4 flex items-center gap-1.5"
                >
                  <span>Official Commission Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              )}
            </div>

            {exam.careers_url && (
              <a
                href={exam.careers_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-saffron-600 hover:underline flex items-center gap-1"
              >
                <span>Recruitment Notices Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Timeline & Important Dates Grid */}
        <section className="glass-card p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-saffron-500" />
              <span>Verified Timeline & Schedule</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              Verified Data: Unknown dates labeled as "Not announced yet"
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <DateBadge label="Official Notification Release" field={exam.dates?.notification_date} />
            <DateBadge label="Online Application Start" field={exam.dates?.apply_start} />
            <DateBadge label="Application Deadline (Last Date)" field={exam.dates?.apply_end} />
            <DateBadge label="Admit Card Release" field={exam.dates?.admit_card_date} />
            <DateBadge label="Examination Date" field={exam.dates?.exam_date} />
            <DateBadge label="Final Results Announcement" field={exam.dates?.result_date} />
          </div>
        </section>

        {/* Quick Facts Grid: Vacancies, Eligibility, Fees */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Vacancies */}
          <div className="glass-card p-6 rounded-2xl space-y-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <span>Total Vacancies</span>
            </h3>
            {formattedVacancies ? (
              <p className="text-2xl font-black text-slate-900">{formattedVacancies}</p>
            ) : (
              <p className="text-xs font-medium text-slate-400 italic">Will be updated soon</p>
            )}
            <p className="text-[11px] text-slate-500">As notified in the latest official advertisement.</p>
          </div>

          {/* Eligibility */}
          <div className="glass-card p-6 rounded-2xl space-y-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <span>Eligibility & Age Limit</span>
            </h3>
            {formattedEligibility ? (
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {formattedEligibility}
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-400 italic">Will be updated soon</p>
            )}
            <p className="text-[11px] text-slate-500">Subject to commission relaxation rules.</p>
          </div>

          {/* Application Fee */}
          <div className="glass-card p-6 rounded-2xl space-y-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <span>Application Fee</span>
            </h3>
            {formattedFee ? (
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {formattedFee}
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-400 italic">Will be updated soon</p>
            )}
            <p className="text-[11px] text-slate-500">Payable online via commission payment gateway.</p>
          </div>
        </section>

        {/* Syllabus Section */}
        <section className="glass-card p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-saffron-500" />
              <span>Official Syllabus & Pattern</span>
            </h2>
            {exam.syllabus_source_url && (
              <a
                href={exam.syllabus_source_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-saffron-600 hover:underline flex items-center gap-1"
              >
                <span>Syllabus Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {syllabus ? (
            <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed">
              <pre className="p-4 rounded-xl bg-slate-50 text-slate-800 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                {typeof syllabus === 'string' ? syllabus : JSON.stringify(syllabus, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Will be updated soon</p>
              <p className="text-xs text-slate-400">
                Official syllabus PDF is verified against the latest commission advertisement prior to publishing.
              </p>
            </div>
          )}
        </section>

        {/* Previous Year Cutoffs Table */}
        <section className="glass-card p-6 sm:p-8 rounded-3xl space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Verified Cutoff Marks</span>
          </h2>

          {exam.cutoffs && exam.cutoffs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-xl">Year / Cycle</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Marks</th>
                    <th className="p-3">Max Marks</th>
                    <th className="p-3 rounded-r-xl">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exam.cutoffs.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{c.cycle_year}</td>
                      <td className="p-3 text-slate-600">{c.stage_name}</td>
                      <td className="p-3 font-semibold text-slate-800">{c.category}</td>
                      <td className="p-3 font-bold text-emerald-700">{c.marks}</td>
                      <td className="p-3 text-slate-500">{c.out_of}</td>
                      <td className="p-3">
                        <a href={c.source_url} target="_blank" rel="noreferrer" className="text-saffron-600 hover:underline">
                          Official PDF ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <p className="text-xs font-semibold text-slate-600">Will be updated soon</p>
              <p className="text-[11px] text-slate-400">
                Official category-wise cutoff marks will be loaded as commission scorecards are published.
              </p>
            </div>
          )}
        </section>

        {/* Previous Year Questions (PYQs) */}
        {exam.pyqs && exam.pyqs.length > 0 && (
          <section className="glass-card p-6 sm:p-8 rounded-3xl space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Official Previous Year Question Papers (PYQs)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exam.pyqs.map((pyq, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{pyq.cycle_year} • {pyq.stage_name}</p>
                    <p className="text-slate-500 text-[11px]">{pyq.subject}</p>
                  </div>
                  <a
                    href={pyq.question_paper_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-[11px] py-1.5 px-3 shrink-0"
                  >
                    Question Paper ↗
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Disclaimer Card */}
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Candidate Advisory: Always Confirm on Official Website</span>
          </p>
          <p className="text-[11px] text-slate-600">
            SarkariTracker does not host exams or accept fee payments. Verify all recruitment schedules directly from{' '}
            <a href={exam.official_site} target="_blank" rel="noreferrer" className="underline font-bold text-amber-800">
              {exam.conducting_body} ({exam.official_site})
            </a> before taking action.
          </p>
        </div>

      </div>
    </>
  );
}
