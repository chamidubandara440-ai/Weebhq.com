import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import HomeClient from './HomeClient';

const fetchAnilist = async () => {
  const query = `
  query {
    airing: Page(page: 1, perPage: 5) {
      media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
        id title { romaji english } coverImage { large } averageScore
      }
    }
    upcoming: Page(page: 1, perPage: 5) {
      media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
        id title { romaji english } coverImage { large } averageScore
      }
    }
    seasonal: Page(page: 1, perPage: 6) {
      media(type: ANIME, season: FALL, seasonYear: 2026, sort: POPULARITY_DESC) {
        id title { romaji english } coverImage { large } format episodes averageScore popularity description(asHtml: false)
      }
    }
  }`;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (e) {
    return null;
  }
};

export default async function Home() {
  const data = await fetchAnilist();

  const topAiring = data?.airing?.media ? data.airing.media.map((anime, index) => ({
    rank: index + 1,
    title: anime.title.english || anime.title.romaji,
    score: anime.averageScore ? (anime.averageScore / 10).toFixed(2) : "N/A",
    img: anime.coverImage.large,
    id: anime.id
  })) : null;

  const topUpcoming = data?.upcoming?.media ? data.upcoming.media.map((anime, index) => ({
    rank: index + 1,
    title: anime.title.english || anime.title.romaji,
    score: anime.averageScore ? (anime.averageScore / 10).toFixed(2) : "N/A",
    img: anime.coverImage.large,
    id: anime.id
  })) : null;

  const seasonal = data?.seasonal?.media ? data.seasonal.media.map((anime) => ({
    id: anime.id,
    title: anime.title.english || anime.title.romaji,
    img: anime.coverImage.large,
    type: anime.format || "TV",
    eps: anime.episodes ? `${anime.episodes} eps` : "? eps",
    score: anime.averageScore ? (anime.averageScore / 10).toFixed(2) : "N/A",
    snippet: anime.description ? anime.description.substring(0, 100) + '...' : ''
  })) : null;

  // Helper function to read markdown files from a directory
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
