import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedBlogPosts, SITE_URL } from '@/lib/api';
import { BookOpen, Clock, User, ArrowRight, ArrowLeft } from 'lucide-react';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Government Exam Preparation Guides & Syllabus Blueprints',
  description: 'Verified syllabus breakdowns, study plans, booklists, and preparation strategies for UPSC, Karnataka KEA/KPSC, SSC CGL, and Banking recruitments.',
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: 'Government Exam Preparation Strategy & Blueprints | SarkariTracker',
    description: 'Expert exam strategies, official stage-wise breakdowns, and qualifying trends.',
    url: `${SITE_URL}/blog`,
    type: 'website',
  },
};

export default async function BlogIndexPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-saffron-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="glass-card p-8 rounded-3xl space-y-3">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 inline-block">
          SarkariTracker Editorial Desk
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Exam Blueprints & Preparation Guides
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Comprehensive, stage-wise roadmaps crafted without marketing fluff. Real booklists, official syllabus mapping, and previous year cutoff trends for central and state aspirants.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-saffron-400 hover:shadow-md transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                  {post.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {post.reading_time_minutes} min read
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 group-hover:text-saffron-600 transition-colors leading-snug">
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h2>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                {post.author}
              </span>

              <Link
                href={`/blog/${post.slug}`}
                className="font-bold text-saffron-600 group-hover:underline flex items-center gap-1"
              >
                <span>Read Strategy</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
