import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const dbPath = path.join(process.cwd(), 'data', 'db.json');

async function runAutomation() {
  console.log("Starting WeebHQ AI Agent...");
  if (!process.env.GEMINI_API_KEY) {
    console.error("No API Key found! Please add GEMINI_API_KEY to .env file");
    return;
  }

  // 1. Fetch Trending Anime from AniList API
  console.log("Fetching trending anime from AniList...");
  const query = `
  query {
    Page(page: 1, perPage: 10) {
      media(type: ANIME, status: RELEASING, sort: TRENDING_DESC) {
        id
        title { romaji english }
        coverImage { large }
      }
    }
  }`;

  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  const responseData = await res.json();
  const trendingAnimeList = responseData.data.Page.media;
  
  // Pick a random anime from the top 10 trending
  const randomIndex = Math.floor(Math.random() * trendingAnimeList.length);
  const topAnime = trendingAnimeList[randomIndex];
  const animeTitle = topAnime.title.english || topAnime.title.romaji;
  const animeImg = topAnime.coverImage.large;

  console.log(`Writing article about: ${animeTitle}`);

  // 2. Generate News Article with Gemini
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
  const prompt = `You are a breaking news reporter for an anime website. 
Write a news update about the anime '${animeTitle}'.
Return ONLY a valid JSON object with exactly two keys:
1. "snippet": A short 15-word summary for the homepage.
2. "fullText": A detailed 3-paragraph news article. Use HTML tags (<p>, <strong>, etc) for formatting. Do not include the title in the fullText.`;
  
  let aiData = null;
  let retries = 3;
  
  while (retries > 0) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const jsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      aiData = JSON.parse(jsonStr);
      break; // Success, exit loop
    } catch (e) {
      console.warn(`[Gemini API] Request failed. Retries left: ${retries - 1}. Error: ${e.message}`);
      retries--;
      if (retries === 0) {
        console.error("Failed to generate content after retries.");
        return; // Exit if all retries fail
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    }
  }

  // 3. Save to Database
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  const newArticle = {
    id: Date.now(),
    title: `Trending Now: ${animeTitle}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    snippet: aiData.snippet.trim(),
    fullText: aiData.fullText.trim(),
    img: animeImg
  };

  dbData.news.unshift(newArticle); // Add to top
  
  // Keep only latest 5 news
  if (dbData.news.length > 5) {
    dbData.news.pop();
  }

  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  console.log("Database updated successfully!");
}

runAutomation();
