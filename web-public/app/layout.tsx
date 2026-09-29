import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SITE_URL } from '@/lib/api';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SarkariTracker — India\'s Authentic Government Exam & Recruitment Tracker',
    template: '%s | SarkariTracker'
  },
  description: '100% genuine Indian government exam tracking portal with verified commission dates. Real-time updates for Karnataka KEA/KPSC, UPSC, SSC, Banking, Railways, and PSUs with zero fake data.',
  keywords: [
    'Government Exams 2026', 'Sarkari Exam', 'Karnataka KEA VAO', 'KPSC KAS', 'UPSC CSE 2026', 
    'SSC CGL 2026', 'IBPS PO Exam Date', 'RRB NTPC', 'Sarkari Result Verified'
  ],
  authors: [{ name: 'SarkariTracker Editorial Team' }],
  creator: 'SarkariTracker',
  publisher: 'SarkariTracker',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'SarkariTracker',
    title: 'SarkariTracker — Authentic Indian Government Exam Portal',
    description: 'Track official government exam notifications, syllabus, cutoffs, and exam dates across UPSC, SSC, Banking, and Karnataka State commissions.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SarkariTracker Government Exam Portal'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SarkariTracker — Verified Government Exam Portal',
    description: '100% verified commission dates for Indian government exams. Zero fake or dummy data.',
    creator: '@SarkariTracker',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SarkariTracker',
    url: SITE_URL,
    description: 'Official Indian Government Exam & Recruitment Notification Tracker.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?search={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-[#9bb0a4] p-2.5 sm:p-4 lg:p-6 flex flex-col font-sans text-slate-800`}>
        {/* Outer Rounded Container Frame */}
        <div className="flex-1 bg-white rounded-[34px] sm:rounded-[48px] lg:rounded-[52px] overflow-hidden shadow-2xl border border-slate-300/60 flex flex-col justify-between p-3 sm:p-6 lg:p-8">
          <Navbar />
          <main className="flex-1 py-4 sm:py-6">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
