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

  // 1. Fetch Latest News from Kitsu API
  console.log("Fetching recent anime from Kitsu...");
  const res = await fetch('https://kitsu.io/api/edge/anime?filter[status]=current&sort=-userCount&page[limit]=1');
  const responseData = await res.json();
  const topAnime = responseData.data[0];

  console.log(`Writing article about: ${topAnime.attributes.canonicalTitle}`);

  // 2. Generate News Article with Gemini
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `You are a breaking news reporter for an anime website. 
Write a news update about the anime '${topAnime.attributes.canonicalTitle}'.
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
    title: `Trending Now: ${topAnime.attributes.canonicalTitle}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    snippet: aiData.snippet.trim(),
    fullText: aiData.fullText.trim(),
    img: topAnime.attributes.posterImage.large
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
