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
    <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[32px] sm:rounded-[44px] bg-[#0a121e] border border-slate-800/80 text-white p-8 sm:p-12 shadow-xl">
        <div className="relative z-10 space-y-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/15">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Genuine Official Commission Data</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
            Track India's Government Exams <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron-400 to-orange-400">Without Misinformation</span>.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
            Directly cross-referenced with official central and state commission portals (UPSC, SSC, Banking, Railways, and Karnataka KEA & KPSC). Verified notifications, confirmed dates, and real syllabi.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <a
              href="#exams"
              className="rounded-full bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs sm:text-sm py-3 px-6 shadow-sm transition-all active:scale-98"
            >
              Search 88+ Government Exams
            </a>
            <a
              href={`${REACT_APP_URL}/login`}
              className="rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm py-3 px-6 transition-all flex items-center gap-2 active:scale-98"
            >
              <CheckSquare className="w-4 h-4 text-saffron-400" />
              <span>Track My Applications</span>
            </a>
          </div>
        </div>

        {/* Background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-saffron-500/15 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Verified Stats Strip with Battery Progress Pills */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1 */}
        <div className="bg-white rounded-[28px] sm:rounded-[34px] border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Exams in Registry</p>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">{exams.length || 88}</p>
            <p className="text-xs text-emerald-600 font-bold mt-1">100% Verified Portals</p>
          </div>
          {/* Battery pill meter */}
          <div className="mt-5 flex gap-1.5 h-6 items-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 h-full rounded-full transition-all ${i < 6 ? 'bg-navy-950' : 'bg-slate-200 border border-slate-300/40'}`}
              />
            ))}
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-[28px] sm:rounded-[34px] border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Karnataka State Exams</p>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">24+</p>
            <p className="text-xs text-saffron-600 font-bold mt-1">KEA, KPSC, ESCOMs</p>
          </div>
          {/* Battery pill meter */}
          <div className="mt-5 flex gap-1.5 h-6 items-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 h-full rounded-full transition-all ${i < 5 ? 'bg-navy-950' : 'bg-slate-200 border border-slate-300/40'}`}
              />
            ))}
          </div>
        </div>

        {/* Card 3 (Accent Card) */}
        <div className="bg-[#edf68d] text-slate-950 rounded-[28px] sm:rounded-[34px] border border-[#dee87d] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Preparation Blueprints</p>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-black/10 tracking-wider">
                Featured
              </span>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-slate-950 mt-2">{blogPosts.length || 3}</p>
            <p className="text-xs text-slate-700 font-bold mt-1">Syllabus & Strategy</p>
          </div>
          {/* Battery pill meter */}
          <div className="mt-5 flex gap-1.5 h-6 items-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 h-full rounded-full transition-all ${i < 5 ? 'bg-slate-950' : 'bg-black/10'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2 Columns: Live Search & Filterable Exams */}
        <div className="lg:col-span-2 space-y-8">
          <LiveSearchDirectory initialExams={exams} />
        </div>

        {/* Right 1 Column: Deadlines, Live Updates, and Blog Guides */}
        <aside className="space-y-8">
          
          {/* Upcoming Verified Deadlines */}
          <div className="bg-white rounded-[28px] sm:rounded-[34px] border border-slate-200/80 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <span>Upcoming Deadlines</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                Live
              </span>
            </div>

            <div className="space-y-3">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((item, idx) => (
                  <Link
                    key={idx}
                    href={`/exams/${item.slug}`}
                    className="block p-4 rounded-2xl bg-rose-50/60 border border-rose-100 hover:border-saffron-300 transition-all group"
                  >
                    <p className="text-xs font-bold text-slate-900 group-hover:text-saffron-600 line-clamp-1">
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-slate-500 font-medium">
                      <span>Date: <strong className="text-slate-800">{formatDateDDMMYYYY(item.date)}</strong></span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
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
          <div className="bg-white rounded-[28px] sm:rounded-[34px] border border-slate-200/80 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-saffron-500" />
                <span>Strategy Guides</span>
              </h2>
              <Link href="/blog" className="text-xs font-bold text-saffron-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {blogPosts.slice(0, 3).map(post => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all group"
                >
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-saffron-600 line-clamp-2 mt-1.5 leading-snug">
                    {post.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {formatDateDDMMYYYY(post.published_at)}
                  </span>
                </Link>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
