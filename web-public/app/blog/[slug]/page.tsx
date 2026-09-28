import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublishedBlogPostBySlug, getPublishedBlogPosts, SITE_URL, REACT_APP_URL } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/components/DateBadge';
import { Clock, User, Calendar, ArrowLeft, CheckSquare, Share2, BookOpen } from 'lucide-react';

export const revalidate = 300; // ISR 300s

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const posts = await getPublishedBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPublishedBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Article Not Found | SarkariTracker',
      description: 'The requested preparation guide could not be found.',
    };
  }

  const title = post.meta_title || `${post.title} | SarkariTracker`;
  const description = post.meta_description || post.excerpt;
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;

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
      publishedTime: post.published_at,
      authors: [post.author],
      siteName: 'SarkariTracker',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: post.title,
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

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPublishedBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  // JSON-LD Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SarkariTracker',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-saffron-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Strategy Guides</span>
          </Link>
        </div>

        {/* Article Header */}
        <header className="glass-card p-6 sm:p-10 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {post.category}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {post.reading_time_minutes} min read
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {post.title}
          </h1>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <User className="w-3.5 h-3.5 text-saffron-500" />
                {post.author}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDateDDMMYYYY(post.published_at)}
              </span>
            </div>

            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
              Verified Preparation Guide
            </span>
          </div>
        </header>

        {/* Article Content */}
        <div className="glass-card p-6 sm:p-10 rounded-3xl space-y-6">
          <div className="text-sm sm:text-base text-slate-800 leading-relaxed space-y-4 whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {/* Candidate Tracker Callout */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-navy-900 to-navy-800 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-saffron-400" />
              <span>Applying for this Recruitment Cycle?</span>
            </h3>
            <p className="text-xs text-navy-200">
              Track deadlines, upload certificate checklists, and receive SMS/calendar shift alerts in the app.
            </p>
          </div>

          <a
            href={`${REACT_APP_URL}/login`}
            className="btn-primary text-xs sm:text-sm py-2.5 px-5 shrink-0"
          >
            Open Candidate Tracker →
          </a>
        </div>
      </article>
    </>
  );
}
