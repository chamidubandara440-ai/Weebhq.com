import fs from 'fs';
import path from 'path';

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

  // Read mock/AI generated data from local DB
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  let dbData = { reviews: [], news: [], articles: [], recommendations: [] };
  try {
    dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch(e) {
    console.error("Failed to read db.json");
  }

  const reviews = dbData.reviews;
  const news = dbData.news;
  const recommendations = dbData.recommendations;

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
