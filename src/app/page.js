import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import HomeClient from './HomeClient';

const fetchApi = async () => {
  try {
    const [res1, res2] = await Promise.all([
      fetch('https://weebhq-api.chamidubandara440.workers.dev/api/anime?limit=50', { cache: 'no-store' }),
      fetch('https://weebhq-api.chamidubandara440.workers.dev/api/anime?limit=50&offset=50', { cache: 'no-store' })
    ]);
    let combinedData = [];
    if (res1.ok) {
      const j1 = await res1.json();
      if (j1.data) combinedData.push(...j1.data);
    }
    if (res2.ok) {
      const j2 = await res2.json();
      if (j2.data) combinedData.push(...j2.data);
    }
    return combinedData;
  } catch (e) {
    return [];
  }
};

export default async function Home() {
  const rawData = await fetchApi();
  let topAiring = null;
  let topUpcoming = null;
  let seasonal = null;

  if (rawData && rawData.length > 0) {
    const airingFiltered = rawData.filter(a => a.status && (a.status.toLowerCase() === 'currently airing' || a.status === 'releasing'));
    if (airingFiltered.length > 0) {
      topAiring = airingFiltered.slice(0, 5).map((anime, index) => ({
        rank: index + 1,
        title: anime.title_english || anime.title,
        score: anime.score != null ? anime.score.toFixed(2) : 'N/A',
        img: anime.image_url,
        id: anime.id
      }));
    }
    // "Not yet aired" is the exact Tenrai status string for upcoming anime.
    // Fall back to top-scored currently-airing if none exist yet in the database.
    const upcomingStatuses = ['not yet aired', 'not yet released', 'not_yet_released', 'upcoming'];
    let upcomingFiltered = rawData.filter(a => a.status && upcomingStatuses.some(s => a.status.toLowerCase().includes(s)));
    if (upcomingFiltered.length === 0) {
      // No upcoming records in DB yet — show top currently-airing as a safe fallback
      upcomingFiltered = rawData.filter(a => a.status && (a.status.toLowerCase() === 'currently airing' || a.status === 'releasing')).slice(0, 5);
    }
    // Always set to an array (even empty) so the section never gets stuck on "Loading data..."
    topUpcoming = upcomingFiltered.slice(0, 5).map((anime, index) => ({
      rank: index + 1,
      title: anime.title_english || anime.title,
      score: anime.score != null ? anime.score.toFixed(2) : 'N/A',
      img: anime.image_url,
      id: anime.id
    }));
    const seasonalFiltered = rawData.filter(a => a.season && a.season.toLowerCase() === 'fall' && a.season_year === 2026);
    if (seasonalFiltered.length > 0) {
      seasonal = seasonalFiltered.slice(0, 6).map((anime) => ({
        id: anime.id,
        title: anime.title_english || anime.title,
        img: anime.image_url,
        type: anime.anime_type || 'TV',
        eps: anime.episodes ? anime.episodes + ' eps' : '? eps',
        score: anime.score != null ? anime.score.toFixed(2) : 'N/A',
        snippet: anime.synopsis ? anime.synopsis.substring(0, 100) + '...' : ''
      }));
    }
  }

  const readMarkdownDir = (dirName, limit) => {
    const dirPath = path.join(process.cwd(), 'content', dirName);
    let items = [];
    try {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
        items = files.map(filename => {
          const fileContents = fs.readFileSync(path.join(dirPath, filename), 'utf8');
          const { data } = matter(fileContents);
          return {
            id: filename.replace('.md', ''),
            timestamp: data.id || "0",
            title: data.title,
            date: data.date,
            snippet: data.snippet,
            img: data.img
          };
        });
        items.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
        if (limit) items = items.slice(0, limit);
      }
    } catch(e) {
      console.error(`Failed to read markdown files from ${dirName}`, e);
    }
    return items;
  };

  const reviews = readMarkdownDir('reviews', 5);
  const news = readMarkdownDir('news', 5);
  const recommendations = readMarkdownDir('recommendations', 5);
  const articles = readMarkdownDir('articles', 5);

  return (
    <HomeClient 
      initialTopAiring={topAiring} 
      initialTopUpcoming={topUpcoming} 
      initialSeasonal={seasonal} 
      reviews={reviews} 
      news={news} 
      recommendations={recommendations} 
    />
  );
}