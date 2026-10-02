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

  // 1. Fetch Latest News from Jikan API
  console.log("Fetching recent anime from Jikan...");
  const res = await fetch('https://api.jikan.moe/v4/seasons/now?limit=1');
  const data = await res.json();
  const topAnime = data.data[0];

  console.log(`Writing article about: ${topAnime.title}`);

  // 2. Generate News Article with Gemini
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const prompt = `Write a short, engaging news snippet (30 words max) about the anime '${topAnime.title}'. Make it sound like a breaking anime news update.`;
  
  const result = await model.generateContent(prompt);
  const snippet = result.response.text();

  // 3. Save to Database
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  const newArticle = {
    id: Date.now(),
    title: `Trending Now: ${topAnime.title}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    snippet: snippet.trim(),
    img: topAnime.images.webp.large_image_url
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
