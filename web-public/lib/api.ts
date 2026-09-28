export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sarkaritracker.in';
export const REACT_APP_URL = (process.env.NEXT_PUBLIC_REACT_APP_URL || 'https://sarkari-tracker-ashy.vercel.app').replace(/\/+$/, '');

export interface DateField {
  value: string | null;
  status: 'confirmed' | 'expected' | 'not_announced';
  label: string;
}

export interface ExamDates {
  notification_date: DateField;
  apply_start: DateField;
  apply_end: DateField;
  admit_card_date: DateField;
  exam_date: DateField;
  result_date: DateField;
}

export interface ExamSummary {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  conducting_body: string;
  level: string;
  state: string | null;
  category: string;
  official_site: string;
  careers_url?: string;
  notification_url?: string;
  results_url?: string;
  admit_card_url?: string;
  data_status: 'empty' | 'pending_review' | 'verified';
  last_verified_at: string | null;
  dates: ExamDates;
  disclaimer: string;
}

export interface ExamDetail extends ExamSummary {
  syllabus_source_url?: string;
  frequency?: string;
  verified_by?: string;
  content: Record<string, {
    title?: string;
    data?: any;
    file_url?: string;
    source_url: string;
    published_at: string;
  }>;
  web_discoveries: Array<{
    source_title: string;
    source_url: string;
    pub_date?: string;
    snippet?: string;
    expected_exam_date?: string;
    expected_apply_end?: string;
    confidence?: string;
    status: string;
  }>;
  cutoffs: Array<{
    cycle_year: number;
    stage_name: string;
    region_or_state: string;
    category: string;
    marks: number;
    out_of: number;
    source_url: string;
    is_verified: number;
  }>;
  pyqs: Array<{
    cycle_year: number;
    stage_name: string;
    shift?: string;
    subject: string;
    question_paper_url: string;
    answer_key_url?: string;
  }>;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  author: string;
  category: string;
  published_at: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  reading_time_minutes: number;
}

export interface GazetteUpdate {
  id: number;
  exam_id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_urgent: number;
  exam_name?: string;
  exam_short_name?: string;
  exam_slug?: string;
  official_site?: string;
}

// 300s ISR Fetch Helper
export async function getPublishedExams(params?: { category?: string; search?: string }): Promise<ExamSummary[]> {
  try {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE_URL}/api/public/exams?${query.toString()}`, {
      next: { revalidate: 300, tags: ['exams'] }
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching published exams:', error);
    return [];
  }
}

export async function getPublishedExamBySlug(slug: string): Promise<ExamDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/exams/${slug}`, {
      next: { revalidate: 300, tags: [`exam-${slug}`] }
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch (error) {
    console.error(`Error fetching exam by slug ${slug}:`, error);
    return null;
  }
}

export async function getPublishedUpdates(): Promise<GazetteUpdate[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/updates`, {
      next: { revalidate: 300, tags: ['updates'] }
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching published updates:', error);
    return [];
  }
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/blog`, {
      next: { revalidate: 300, tags: ['blog'] }
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/blog/${slug}`, {
      next: { revalidate: 300, tags: [`blog-${slug}`] }
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch (error) {
    console.error(`Error fetching blog post by slug ${slug}:`, error);
    return null;
  }
}

export async function getSitemapData(): Promise<{ exams: Array<{ url: string; lastModified: string }>; blog: Array<{ url: string; lastModified: string }> }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/sitemap-data`, {
      next: { revalidate: 300 }
    });

    if (!res.ok) return { exams: [], blog: [] };
    const data = await res.json();
    return { exams: data.exams || [], blog: data.blog || [] };
  } catch (error) {
    console.error('Error fetching sitemap data:', error);
    return { exams: [], blog: [] };
  }
}
