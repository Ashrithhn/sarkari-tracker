import { MetadataRoute } from 'next';
import { getSitemapData, SITE_URL } from '@/lib/api';

export const revalidate = 300; // 300s ISR

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { exams, blog } = await getSitemapData();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  const examRoutes: MetadataRoute.Sitemap = exams.map((item) => ({
    url: `${SITE_URL}${item.url}`,
    lastModified: new Date(item.lastModified || Date.now()),
    changeFrequency: 'hourly',
    priority: 0.9,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blog.map((item) => ({
    url: `${SITE_URL}${item.url}`,
    lastModified: new Date(item.lastModified || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...examRoutes, ...blogRoutes];
}
