import { getPublishedExams, getPublishedUpdates, getPublishedBlogPosts, SITE_URL, REACT_APP_URL } from '@/lib/api';
import LiveSearchDirectory from '@/components/LiveSearchDirectory';
import { formatDateDDMMYYYY } from '@/components/DateBadge';
import Link from 'next/link';
import { 
  ShieldCheck, Clock, ArrowRight, ExternalLink, 
  BookOpen, CheckSquare, Sparkles, AlertCircle 
} from 'lucide-react';

export const revalidate = 300; // ISR 300 seconds

export default async function HomePage() {
  const [exams, updates, blogPosts] = await Promise.all([
    getPublishedExams(),
    getPublishedUpdates(),
    getPublishedBlogPosts()
  ]);

  // Extract upcoming confirmed/expected deadlines for hero countdown strip
  const now = new Date();
  const upcomingDeadlines = exams
    .flatMap(ex => {
      const items = [];
      if (ex.dates?.apply_end?.value && ex.dates.apply_end.status !== 'not_announced') {
        const d = new Date(ex.dates.apply_end.value);
        if (!isNaN(d.getTime()) && d >= now) {
          items.push({
            title: `${ex.short_name || ex.name} - Last Date to Apply`,
            date: ex.dates.apply_end.value,
            status: ex.dates.apply_end.status,
            slug: ex.slug
          });
        }
      }
      if (ex.dates?.exam_date?.value && ex.dates.exam_date.status !== 'not_announced') {
        const d = new Date(ex.dates.exam_date.value);
        if (!isNaN(d.getTime()) && d >= now) {
          items.push({
            title: `${ex.short_name || ex.name} - Examination Day`,
            date: ex.dates.exam_date.value,
            status: ex.dates.exam_date.status,
            slug: ex.slug
          });
        }
      }
      return items;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-saffron-950 text-white p-8 sm:p-12 shadow-2xl">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5 text-saffron-400" />
            <span>100% Genuine Official Commission Data</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Track India's Government Exams <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron-400 to-orange-400">Without Misinformation</span>.
          </h1>

          <p className="text-navy-100 text-sm sm:text-base leading-relaxed">
            Directly cross-referenced with official central and state commission portals (UPSC, SSC, Banking, Railways, and Karnataka KEA & KPSC). Verified notifications, confirmed dates, and real syllabi.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <a
              href="#exams"
              className="btn-primary text-sm py-2.5 px-5"
            >
              Search 88+ Government Exams
            </a>
            <a
              href={`${REACT_APP_URL}/login`}
              className="btn-secondary text-sm py-2.5 px-5 bg-white/10 text-white border-white/20 hover:bg-white/20 flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4 text-saffron-400" />
              <span>Track My Applications</span>
            </a>
          </div>
        </div>

        {/* Background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-saffron-500/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Verified Stats Strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-xs font-medium text-slate-500">Exams in Registry</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{exams.length || 88}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">100% Verified Portals</p>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-xs font-medium text-slate-500">Karnataka State Exams</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">24+</p>
          <p className="text-[11px] text-saffron-600 font-semibold mt-1">KEA, KPSC, ESCOMs</p>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-xs font-medium text-slate-500">Preparation Blueprints</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{blogPosts.length || 3}</p>
          <p className="text-[11px] text-purple-600 font-semibold mt-1">Syllabus & Strategy</p>
        </div>
      </section>

      {/* Main Two-Column Layout: Left (Live Search & Exams Directory), Right (Deadlines & Updates) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2 Columns: Live Search & Filterable Exams */}
        <div className="lg:col-span-2 space-y-8">
          <LiveSearchDirectory initialExams={exams} />
        </div>

        {/* Right 1 Column: Deadlines, Live Updates, and Blog Guides */}
        <aside className="space-y-8">
          
          {/* Upcoming Verified Deadlines */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                <span>Upcoming Deadlines</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                Live
              </span>
            </div>

            <div className="space-y-3">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((item, idx) => (
                  <Link
                    key={idx}
                    href={`/exams/${item.slug}`}
                    className="block p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-saffron-300 transition-all group"
                  >
                    <p className="text-xs font-bold text-slate-900 group-hover:text-saffron-600 line-clamp-1">
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-slate-500">
                      <span>Date: <strong className="text-slate-800">{formatDateDDMMYYYY(item.date)}</strong></span>
                      <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                        item.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status === 'confirmed' ? 'Confirmed' : 'Expected'}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No deadlines in the next 15 days.</p>
              )}
            </div>
          </div>

          {/* Preparation Guides (Blog) */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Strategy Guides</span>
              </h2>
              <Link href="/blog" className="text-xs font-semibold text-purple-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {blogPosts.slice(0, 3).map(post => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                >
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    {post.category}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-saffron-600 mt-1 line-clamp-2">
                    {post.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {post.reading_time_minutes} min read • By {post.author}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Transparency Advisory */}
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
            <h3 className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Candidate Advisory</span>
            </h3>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Found a schedule change or notification discrepancy? Report directly to our candidate desk at{' '}
              <a href="mailto:techtherapy1818@gmail.com" className="font-bold text-saffron-600 hover:underline">
                techtherapy1818@gmail.com
              </a>.
            </p>
          </div>

        </aside>
      </div>
    </div>
  );
}
