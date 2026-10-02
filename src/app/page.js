import fs from 'fs';
import path from 'path';

import HomeClient from './HomeClient';

const fetchKitsu = async (endpoint) => {
  try {
    const url = `https://kitsu.io/api/edge${endpoint}${endpoint.includes('?') ? '&' : '?'}cb=20261002`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
};

export default async function Home() {
  const topAiringRes = await fetchKitsu('/anime?filter[status]=current&sort=-userCount&page[limit]=5');
  const topUpcomingRes = await fetchKitsu('/anime?filter[status]=upcoming&sort=-userCount&page[limit]=5');
  const seasonalRes = await fetchKitsu('/anime?filter[season]=spring&filter[seasonYear]=2024&sort=-userCount&page[limit]=6');

  const fallbackTopUpcoming = [
    { rank: 1, title: "Re:Zero Season 3", score: "N/A", img: "https://cdn.myanimelist.net/images/anime/1435/141753l.jpg", id: 6 },
    { rank: 2, title: "One Punch Man 3", score: "N/A", img: "https://cdn.myanimelist.net/images/anime/1208/126938l.jpg", id: 7 },
    { rank: 3, title: "Bleach: Thousand-Year Blood War", score: "N/A", img: "https://cdn.myanimelist.net/images/anime/1908/135335l.jpg", id: 8 },
    { rank: 4, title: "Fire Force Season 3", score: "N/A", img: "https://cdn.myanimelist.net/images/anime/1769/127393l.jpg", id: 9 },
    { rank: 5, title: "Blue Lock Season 2", score: "N/A", img: "https://cdn.myanimelist.net/images/anime/1091/128387l.jpg", id: 10 },
  ];

  const fallbackSeasonal = [
    { id: 11, title: "My Hero Academia Season 7", img: "https://cdn.myanimelist.net/images/anime/1023/142518l.jpg", type: "TV", eps: "? eps", score: "N/A", members: "100K", snippet: "" },
    { id: 12, title: "Kaiju No. 8", img: "https://cdn.myanimelist.net/images/anime/1376/141208l.jpg", type: "TV", eps: "12 eps", score: "N/A", members: "100K", snippet: "" },
    { id: 13, title: "Mushoku Tensei Season 2", img: "https://cdn.myanimelist.net/images/anime/1162/142410l.jpg", type: "TV", eps: "12 eps", score: "N/A", members: "100K", snippet: "" },
    { id: 14, title: "KonoSuba Season 3", img: "https://cdn.myanimelist.net/images/anime/1567/141151l.jpg", type: "TV", eps: "11 eps", score: "N/A", members: "100K", snippet: "" },
    { id: 15, title: "That Time I Got Reincarnated", img: "https://cdn.myanimelist.net/images/anime/1376/141175l.jpg", type: "TV", eps: "24 eps", score: "N/A", members: "100K", snippet: "" },
    { id: 16, title: "Wind Breaker", img: "https://cdn.myanimelist.net/images/anime/1126/141697l.jpg", type: "TV", eps: "13 eps", score: "N/A", members: "100K", snippet: "" },
  ];

  const topAiring = topAiringRes?.data ? topAiringRes.data.map((anime, index) => ({
    rank: index + 1,
    title: anime.attributes.canonicalTitle,
    score: anime.attributes.averageRating ? (anime.attributes.averageRating / 10).toFixed(2) : "N/A",
    img: anime.attributes.posterImage.large,
    id: anime.id
  })) : null;

  const topUpcoming = topUpcomingRes?.data ? topUpcomingRes.data.map((anime, index) => ({
    rank: index + 1,
    title: anime.attributes.canonicalTitle,
    score: anime.attributes.averageRating ? (anime.attributes.averageRating / 10).toFixed(2) : "N/A",
    img: anime.attributes.posterImage.large,
    id: anime.id
  })) : null;

  const seasonal = seasonalRes?.data ? seasonalRes.data.map((anime) => ({
    id: anime.id,
    title: anime.attributes.canonicalTitle,
    img: anime.attributes.posterImage.large,
    type: anime.attributes.subtype || "TV",
    eps: anime.attributes.episodeCount ? `${anime.attributes.episodeCount} eps` : "? eps",
    score: anime.attributes.averageRating ? (anime.attributes.averageRating / 10).toFixed(2) : "N/A",
    members: anime.attributes.userCount ? (anime.attributes.userCount / 1000).toFixed(0) + 'K' : '0K',
    snippet: anime.attributes.synopsis ? anime.attributes.synopsis.substring(0, 100) + '...' : ''
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
