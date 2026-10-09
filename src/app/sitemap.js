import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const dynamic = 'force-static';

const BASE_URL = 'https://weebhq.com';

function getMarkdownSlugs(dir) {
  try {
    const fullDir = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullDir)) return [];
    return fs.readdirSync(fullDir)
      .filter(f => f.endsWith('.md'))
      .map(f => {
        const raw = fs.readFileSync(path.join(fullDir, f), 'utf8');
        const { data } = matter(raw);
        return {
          slug: f.replace('.md', ''),
          lastmod: data.published_at || data.date || new Date().toISOString().split('T')[0],
        };
      });
  } catch { return []; }
}

export default function sitemap() {
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: `${BASE_URL}/`,                      lastModified: today, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/anime/top`,             lastModified: today, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/anime/seasonal`,        lastModified: today, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/anime/search`,          lastModified: today, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/anime/reviews`,         lastModified: today, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/anime/recommendations`, lastModified: today, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/news`,                  lastModified: today, changeFrequency: 'hourly',  priority: 0.9 },
  ];

  const newsPages = getMarkdownSlugs('content/news').map(({ slug, lastmod }) => ({
    url: `${BASE_URL}/news/${slug}`,
    lastModified: lastmod,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const reviewPages = getMarkdownSlugs('content/reviews').map(({ slug, lastmod }) => ({
    url: `${BASE_URL}/reviews/${slug}`,
    lastModified: lastmod,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const recPages = getMarkdownSlugs('content/articles/latest-anime-recommendations').map(({ slug, lastmod }) => ({
    url: `${BASE_URL}/articles/latest-anime-recommendations/${slug}`,
    lastModified: lastmod,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...newsPages, ...reviewPages, ...recPages];
}