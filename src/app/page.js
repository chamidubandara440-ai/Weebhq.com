import fs from "fs";
import path from "path";
import matter from "gray-matter";
import HomeClient from "./HomeClient";

const API_BASE = "https://weebhq-api.chamidubandara440.workers.dev";

// Helper: fetch with timeout
async function safeFetch(url, ms = 8000) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchAllAnime() {
  const [page1, page2, page3, page4] = await Promise.all([
    safeFetch(`${API_BASE}/api/anime?limit=50&offset=0`),
    safeFetch(`${API_BASE}/api/anime?limit=50&offset=50`),
    safeFetch(`${API_BASE}/api/anime?limit=50&offset=100`),
    safeFetch(`${API_BASE}/api/anime?limit=50&offset=150`),
  ]);
  const combined = [
    ...(page1?.data || []),
    ...(page2?.data || []),
    ...(page3?.data || []),
    ...(page4?.data || []),
  ];
  return combined;
}

function shapeAnime(a, rank) {
  return {
    rank,
    id: a.id,
    title: a.title_english || a.title,
    score: a.score != null ? Number(a.score).toFixed(2) : "N/A",
    img: a.image_url || null,
    type: a.anime_type || "TV",
    eps: a.episodes ?? "?",
    members: a.members ? Number(a.members).toLocaleString() : "0",
    status: a.status || "",
    season: a.season || "",
    season_year: a.season_year || null,
    studios: a.studios || "",
    synopsis: a.synopsis ? a.synopsis.slice(0, 120) + "..." : "",
  };
}

function readMarkdownDir(dirName, limit) {
  const dirPath = path.join(process.cwd(), "content", dirName);
  let items = [];
  try {
    if (fs.existsSync(dirPath)) {
      items = fs.readdirSync(dirPath)
        .filter((f) => f.endsWith(".md"))
        .map((filename) => {
          const raw = fs.readFileSync(path.join(dirPath, filename), "utf8");
          const { data } = matter(raw);
          return {
            id: filename.replace(".md", ""),
            timestamp: data.published_at || data.id || "1970-01-01",
            title: data.title || "",
            date: data.date || "",
            snippet: data.snippet || data.description?.slice(0, 120) || "",
            img: data.img || data.cover_image || null,
            score: data.score || null,
          };
        });
      items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      if (limit) items = items.slice(0, limit);
    }
  } catch (e) {
    console.error("readMarkdownDir error", e);
  }
  return items;
}

export const metadata = {
  title: "WeebHQ — Anime & Manga Database | Discover, Track, Explore",
  description:
    "WeebHQ is your ultimate anime and manga database. Discover top-rated anime, current-season picks, upcoming releases, in-depth reviews, and fan recommendations — all in one place.",
  alternates: { canonical: "https://weebhq.com/" },
  openGraph: {
    title: "WeebHQ — Anime & Manga Database",
    description:
      "Discover top anime, seasonal picks, upcoming releases, and community reviews on WeebHQ.",
    url: "https://weebhq.com/",
    siteName: "WeebHQ",
    type: "website",
    images: [
      {
        url: "https://weebhq.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "WeebHQ — Anime & Manga Database",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WeebHQ — Anime & Manga Database",
    description: "Discover top anime, seasonal picks, and more on WeebHQ.",
  },
};

export default async function Home() {
  const allAnime = await fetchAllAnime();
  const upcomingJson = await safeFetch(`${API_BASE}/api/anime/upcoming`);

  // ── Top Airing ────────────────────────────────────────────────────────────
  const airing = allAnime
    .filter((a) => {
      const s = (a.status || "").toLowerCase();
      return s === "currently airing" || s === "releasing" || s === "airing";
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 20)
    .map(shapeAnime);

  // ── Top Rated ────────────────────────────────────────────────────────────
  const topRated = [...allAnime]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 20)
    .map(shapeAnime);

  // ── Most Popular ─────────────────────────────────────────────────────────
  const popular = [...allAnime]
    .filter((a) => a.members != null)
    .sort((a, b) => (b.members || 0) - (a.members || 0))
    .slice(0, 20)
    .map(shapeAnime);

  // ── Current Season (Fall 2026) ────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const month = new Date().getMonth();
  const currentSeason =
    month < 3 ? "winter" : month < 6 ? "spring" : month < 9 ? "summer" : "fall";

  const seasonal = allAnime
    .filter(
      (a) =>
        a.season &&
        a.season.toLowerCase() === currentSeason &&
        a.season_year === currentYear
    )
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 20)
    .map(shapeAnime);

  // ── Upcoming ─────────────────────────────────────────────────────────────
  const upcoming = (upcomingJson?.data || [])
    .map((a, i) => ({
      rank: i + 1,
      id: a.id,
      title: a.title_english || a.title,
      score: a.score != null ? Number(a.score).toFixed(2) : "N/A",
      img: a.image_url || null,
      type: a.anime_type || "TV",
      eps: a.episodes ?? "?",
      members: a.members ? Number(a.members).toLocaleString() : "0",
      airedString: a.aired_string || null,
      status: a.status || "Not yet aired",
    }))
    .slice(0, 20);

  // ── Genres from DB data ───────────────────────────────────────────────────
  const genreSet = new Map();
  allAnime.forEach((a) => {
    if (!a.genres) return;
    const gs = Array.isArray(a.genres)
      ? a.genres
      : String(a.genres).split(",").map((g) => g.trim());
    gs.forEach((g) => {
      if (g) genreSet.set(g, (genreSet.get(g) || 0) + 1);
    });
  });
  const genres = [...genreSet.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([name]) => name);

  // ── Content ───────────────────────────────────────────────────────────────
  const news = readMarkdownDir("news", 6);
  const reviews = readMarkdownDir("reviews", 4);

  return (
    <HomeClient
      airing={airing}
      topRated={topRated}
      popular={popular}
      seasonal={seasonal}
      upcoming={upcoming}
      genres={genres}
      news={news}
      reviews={reviews}
      currentSeason={currentSeason}
      currentYear={currentYear}
    />
  );
}