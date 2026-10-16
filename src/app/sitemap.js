import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const revalidate = 86400;

const BASE_URL = 'https://weebhq.com';

function getMarkdownSlugs(dir) {
  try {
    const fullDir = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullDir)) return [];
    return fs.readdirSync(fullDir)
      .filter(f => f.endsWith('.md'))
      .map(f => {
        try {
          const raw = fs.readFileSync(path.join(fullDir, f), 'utf8');
          const { data } = matter(raw);
          return {
            slug: f.replace('.md', ''),
            lastmod: data.published_at || data.date || new Date().toISOString().split('T')[0],
          };
        } catch {
          return {
            slug: f.replace('.md', ''),
            lastmod: new Date().toISOString().split('T')[0],
          };
        }
      });
  } catch {
    return [];
  }
}

async function fetchDynamicAnimePages() {
  const animePages = [];
  try {
    const res = await fetch('https://weebhq-api.chamidubandara440.workers.dev/api/anime?limit=150', {
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || [];
      const today = new Date().toISOString().split('T')[0];

      list.forEach(anime => {
        if (!anime || !anime.id) return;
        const lastMod = anime.updated_at
          ? anime.updated_at.split('T')[0]
          : anime.created_at
          ? anime.created_at.split('T')[0]
          : today;

        animePages.push({
          url: `${BASE_URL}/anime/${anime.id}`,
          lastModified: lastMod,
          changeFrequency: 'weekly',
          priority: 0.85,
        });
      });
    }
  } catch (e) {
    console.error('Failed to fetch anime entries for sitemap:', e);
  }
  return animePages;
}

export default async function sitemap() {
  const today = new Date().toISOString().split('T')[0];

  const corePages = [
    { url: `${BASE_URL}/`,                      lastModified: today, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/anime/catalog`,         lastModified: today, changeFrequency: 'daily',   priority: 0.95 },
    { url: `${BASE_URL}/anime/top`,             lastModified: today, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/anime/popular`,         lastModified: today, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/anime/upcoming`,        lastModified: today, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/anime/now-playing`,     lastModified: today, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/anime/seasonal`,        lastModified: today, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/anime/calendar`,        lastModified: today, changeFrequency: 'daily',   priority: 0.85 },
    { url: `${BASE_URL}/anime/genres`,          lastModified: today, changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE_URL}/anime/videos`,          lastModified: today, changeFrequency: 'daily',   priority: 0.85 },
    { url: `${BASE_URL}/anime/search`,          lastModified: today, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/anime/reviews`,         lastModified: today, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/anime/recommendations`, lastModified: today, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/community/discussions`, lastModified: today, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/news`,                  lastModified: today, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE_URL}/coming-soon`,           lastModified: today, changeFrequency: 'monthly', priority: 0.3 },
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
    priority: 0.7,
  }));

  const dynamicAnimePages = await fetchDynamicAnimePages();

  return [...corePages, ...newsPages, ...reviewPages, ...recPages, ...dynamicAnimePages];
}
