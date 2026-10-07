const TITLE_GENRE_MAP = [
  { keywords: ["shingeki","chainsaw","bleach","naruto","one piece","dragon ball","demon slayer","kimetsu","jujutsu","hunter x hunter","black clover","kingdom","steel ball","jojo"], genres: ["Action","Battle","Shonen"] },
  { keywords: ["clannad","violet evergarden","3-gatsu","fruits basket","koe no katachi"], genres: ["Drama","Slice of Life"] },
  { keywords: ["gintama","konosuba","mob psycho","one punch"], genres: ["Comedy","Parody"] },
  { keywords: ["kaguya","tonikawa","horimiya","toradora"], genres: ["Romance","Comedy"] },
  { keywords: ["frieren","re:zero","rezero","sword art","overlord","konosuba","tanya"], genres: ["Fantasy","Isekai"] },
  { keywords: ["steins","gate","code geass","monster","death note","psycho-pass"], genres: ["Sci-Fi","Thriller","Mystery"] },
  { keywords: ["haikyuu","hajime no ippo","slam dunk","ippo"], genres: ["Sports"] },
  { keywords: ["vinland saga","kingdom","ashita no joe","ginga eiyuu"], genres: ["Historical","Action"] },
  { keywords: ["bang dream","love live"], genres: ["Music","Idol"] },
  { keywords: ["kimi no na wa","spirited away","sen to chihiro","kizumonogatari"], genres: ["Movie","Drama"] },
  { keywords: ["kusuriya","apothecary","monogatari"], genres: ["Mystery","Drama"] },
];

export function inferGenres(anime) {
  const t = ((anime.title || "") + " " + (anime.title_english || "")).toLowerCase();
  const g = new Set();
  for (const {keywords, genres} of TITLE_GENRE_MAP)
    if (keywords.some(k => t.includes(k))) genres.forEach(x => g.add(x));
  return [...g];
}

export function similarity(a, b) {
  if (a.id === b.id) return -1;
  let s = 0;
  if (a.anime_type && b.anime_type && a.anime_type === b.anime_type) s += 20;
  if (a.season && b.season && a.season === b.season) s += 10;
  if (a.season_year && b.season_year && a.season_year === b.season_year) s += 8;
  if (a.studios && b.studios) {
    const aS = (a.studios || "").toLowerCase(), bS = (b.studios || "").toLowerCase();
    if (aS && bS && aS.split(",").some(x => x.trim() && bS.includes(x.trim()))) s += 15;
  }
  const aG = inferGenres(a), bG = inferGenres(b);
  s += aG.filter(g => bG.includes(g)).length * 12;
  if (a.score != null && b.score != null) {
    const d = Math.abs(a.score - b.score);
    s += d <= 0.3 ? 10 : d <= 0.6 ? 5 : d <= 1.0 ? 2 : 0;
  }
  if (a.popularity != null && b.popularity != null) {
    const d = Math.abs(a.popularity - b.popularity);
    s += d <= 50 ? 5 : d <= 200 ? 2 : 0;
  }
  return s;
}

export function buildReason(source, rec) {
  const shared = inferGenres(source).filter(g => inferGenres(rec).includes(g));
  const parts = [];
  if (shared.length > 0) parts.push("shares " + shared.slice(0, 2).join(" and ") + " themes");
  if (source.anime_type && rec.anime_type && source.anime_type === rec.anime_type)
    parts.push("both are " + source.anime_type + " series");
  if (source.studios && rec.studios) {
    const aS = source.studios.split(",")[0].trim(), bS = rec.studios.split(",")[0].trim();
    if (aS && bS && aS.toLowerCase() === bS.toLowerCase())
      parts.push("produced by the same studio (" + aS + ")");
  }
  if (source.season && rec.season && source.season === rec.season)
    parts.push("both aired in the " + source.season + " season");
  if (source.score != null && rec.score != null && Math.abs(source.score - rec.score) <= 0.5)
    parts.push("similarly highly rated (" + rec.score + "/10)");
  return parts.length === 0
    ? "Recommended based on overall quality and audience appeal."
    : "Recommended because it " + parts.join(", and ") + ".";
}

export function generateRecommendations(animeList, count = 5) {
  if (!animeList || animeList.length < 2) return [];
  const sorted = [...animeList].sort((a, b) => (b.score || 0) - (a.score || 0));
  const sources = sorted.slice(0, Math.min(20, sorted.length));
  const recs = [], used = new Set();
  for (const src of sources) {
    if (recs.length >= count) break;
    let best = null, bestSim = -1;
    for (const c of animeList) {
      if (c.id === src.id) continue;
      const pk = [Math.min(src.id, c.id), Math.max(src.id, c.id)].join("-");
      if (used.has(pk)) continue;
      const sim = similarity(src, c);
      if (sim > bestSim) { bestSim = sim; best = c; }
    }
    if (best && bestSim > 0) {
      const pk = [Math.min(src.id, best.id), Math.max(src.id, best.id)].join("-");
      used.add(pk);
      recs.push({
        id: src.id + "-" + best.id,
        sourceAnime: { id: src.id, title: src.title_english || src.title, image_url: src.image_url || "" },
        recommendedAnime: { id: best.id, title: best.title_english || best.title, image_url: best.image_url || "" },
        reason: buildReason(src, best),
        similarityScore: bestSim,
      });
    }
  }
  return recs;
}

export async function fetchAnimeForRecommendations() {
  const PH = "https://placehold.co/100x140/1a1a2e/ffffff?text=Anime";
  try {
    const [r1, r2] = await Promise.all([
      fetch("https://weebhq-api.chamidubandara440.workers.dev/api/anime?limit=50", { next: { revalidate: 3600 } }),
      fetch("https://weebhq-api.chamidubandara440.workers.dev/api/anime?limit=50&offset=50", { next: { revalidate: 3600 } }),
    ]);
    let anime = [];
    if (r1.ok) { const j = await r1.json(); anime.push(...(j.data || [])); }
    if (r2.ok) { const j = await r2.json(); anime.push(...(j.data || [])); }
    return anime.map(a => ({ ...a, image_url: a.image_url || PH }));
  } catch (e) { return []; }
}