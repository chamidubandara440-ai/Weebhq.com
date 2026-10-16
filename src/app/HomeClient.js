"use client";

import { useState, useEffect } from "react";

const API_BASE = "https://weebhq-api.chamidubandara440.workers.dev";

// ── Curated Anime Hero Backdrops ──────────────────────────────────────────────
const HERO_SLIDES = [
  {
    id: 1,
    title: "Sousou no Frieren",
    subtitle: "Frieren: Beyond Journey's End",
    backdrop: "/hero-backdrop-1.jpg",
    href: "/anime/1",
  },
  {
    id: "cyberpunk",
    title: "Cyberpunk: Edgerunners",
    subtitle: "Night City Anime Experience",
    backdrop: "/hero-backdrop-2.jpg",
    href: "/anime/search?q=cyberpunk",
  },
  {
    id: "your-name",
    title: "Kimi no Na wa (Your Name)",
    subtitle: "Makoto Shinkai Classic",
    backdrop: "/hero-backdrop-3.jpg",
    href: "/anime/search?q=your%20name",
  },
];

// ── Community Leaderboard Users ───────────────────────────────────────────────
const LEADERBOARD_USERS = [
  {
    id: 1,
    name: "LongLeo",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
    allTime: 36676,
    thisWeek: 36653,
    allTimeFormatted: "36,676",
    thisWeekFormatted: "36,653",
  },
  {
    id: 2,
    name: "Shei",
    avatar: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=80&h=80&fit=crop",
    allTime: 3187123,
    thisWeek: 20203,
    allTimeFormatted: "3,187,123",
    thisWeekFormatted: "20,203",
  },
  {
    id: 3,
    name: "Uzui",
    avatar: "https://images.unsplash.com/photo-1563089145-599997674d42?w=80&h=80&fit=crop",
    allTime: 170746,
    thisWeek: 14617,
    allTimeFormatted: "170,746",
    thisWeekFormatted: "14,617",
  },
  {
    id: 4,
    name: "Kreegarn",
    initial: "K",
    color: "#d97706",
    allTime: 213513,
    thisWeek: 9314,
    allTimeFormatted: "213,513",
    thisWeekFormatted: "9,314",
  },
  {
    id: 5,
    name: "Roman",
    avatar: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=80&h=80&fit=crop",
    allTime: 1111297,
    thisWeek: 7377,
    allTimeFormatted: "1,111,297",
    thisWeekFormatted: "7,377",
  },
  {
    id: 6,
    name: "kutthroatsosa",
    initial: "K",
    color: "#7c3aed",
    allTime: 34119,
    thisWeek: 22973,
    allTimeFormatted: "34,119",
    thisWeekFormatted: "22,973",
  },
  {
    id: 7,
    name: "RuiZafon",
    initial: "R",
    color: "#b45309",
    allTime: 2723622,
    thisWeek: 17632,
    allTimeFormatted: "2,723,622",
    thisWeekFormatted: "17,632",
  },
  {
    id: 8,
    name: "爸爸",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop",
    allTime: 55736,
    thisWeek: 10774,
    allTimeFormatted: "55,736",
    thisWeekFormatted: "10,774",
  },
  {
    id: 9,
    name: "c(ræ)zy a$$ bitches",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&h=80&fit=crop",
    allTime: 38394,
    thisWeek: 8118,
    allTimeFormatted: "38,394",
    thisWeekFormatted: "8,118",
  },
  {
    id: 10,
    name: "cackalacky",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&h=80&fit=crop",
    allTime: 6599,
    thisWeek: 6286,
    allTimeFormatted: "6,599",
    thisWeekFormatted: "6,286",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

function formatAnimeDate(anime) {
  if (anime.start_date) {
    try {
      const d = new Date(anime.start_date);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
    } catch {}
  }
  if (anime.season && anime.season_year) {
    return `${cap(anime.season)} ${anime.season_year}`;
  }
  if (anime.season_year) return `${anime.season_year}`;
  return "2024";
}

function AnimeImage({ src, alt, className }) {
  const [err, setErr] = useState(false);
  const fallback = `https://placehold.co/225x320/0f172a/ffffff?text=${encodeURIComponent(alt?.slice(0, 10) || "Anime")}`;
  return (
    <img
      src={err || !src ? fallback : src}
      alt={alt || "Anime cover"}
      className={className}
      onError={() => setErr(true)}
      loading="lazy"
    />
  );
}

// ── TMDB Circular Rating Badge ────────────────────────────────────────────────
function CircularScore({ score }) {
  if (!score || score === "N/A") return null;
  const num = parseFloat(score);
  const percent = Math.min(Math.round(num * 10), 100);
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const strokeColor = percent >= 70 ? "#21d07a" : percent >= 50 ? "#d2d531" : "#db2360";

  return (
    <div className="whq-circle-rating" title={`User Score: ${percent}%`}>
      <svg className="whq-circle-svg" width="36" height="36" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r={radius}
          stroke="rgba(33, 208, 122, 0.2)"
          strokeWidth="3"
          fill="#081c22"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          stroke={strokeColor}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform="rotate(-90 18 18)"
        />
      </svg>
      <div className="whq-circle-text">
        <span className="whq-circle-num">{percent}</span>
        <span className="whq-circle-percent">%</span>
      </div>
    </div>
  );
}

// ── Home Client Component ─────────────────────────────────────────────────────
export default function HomeClient({ airing, topRated, popular, seasonal }) {
  const [liveAiring, setLiveAiring] = useState(airing || []);
  const [livePopular, setLivePopular] = useState(popular || []);
  const [liveTopRated, setLiveTopRated] = useState(topRated || []);
  const [liveTheaters, setLiveTheaters] = useState([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [trendingTab, setTrendingTab] = useState("today");
  const [popularTab, setPopularTab] = useState("streaming");

  // Client hydration: ensure 16-20 items in every section
  useEffect(() => {
    fetch(`${API_BASE}/api/anime?limit=100`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const all = json?.data || [];
        if (!all.length) return;

        function shape(a, i) {
          return {
            rank: i + 1,
            id: a.id,
            title: a.title_english || a.title,
            score: a.score != null ? Number(a.score).toFixed(2) : "N/A",
            img: a.image_url,
            type: a.anime_type || "TV",
            eps: a.episodes ?? "?",
            members: a.members ? Number(a.members).toLocaleString() : "0",
            start_date: a.start_date,
            status: a.status || "",
            season: a.season,
            season_year: a.season_year,
          };
        }

        // Airing + backfill with top rated so Trending Today has a full 20-item scroller
        const airingOnly = all
          .filter((a) => ["currently airing", "releasing", "airing"].includes((a.status || "").toLowerCase()))
          .sort((a, b) => (b.score || 0) - (a.score || 0));
        const airingIds = new Set(airingOnly.map((a) => a.id));
        const airingBackfill = all
          .filter((a) => !airingIds.has(a.id))
          .sort((a, b) => (b.score || 0) - (a.score || 0));
        const trendingFull = [...airingOnly, ...airingBackfill].slice(0, 20).map(shape);
        setLiveAiring(trendingFull);

        // Most Popular
        const popList = [...all]
          .sort((a, b) => (b.members || 0) - (a.members || 0))
          .slice(0, 20)
          .map(shape);
        setLivePopular(popList);

        // Top Rated
        const topList = [...all]
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 20)
          .map(shape);
        setLiveTopRated(topList);

        // In Theaters (Movies)
        const movies = all
          .filter((a) => (a.anime_type || "").toLowerCase() === "movie")
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 20)
          .map(shape);
        setLiveTheaters(movies.length ? movies : topList);
      })
      .catch(() => {});
  }, []);

  // Auto advance hero banner every 7s
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setSlideIdx((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const nextSlide = () => {
    setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const currentSlide = HERO_SLIDES[slideIdx];

  // Tab data selection (guarantees full items for every tab)
  const trendingItems = trendingTab === "today"
    ? (liveAiring?.length ? liveAiring : airing?.length ? airing : livePopular)
    : (liveTopRated?.length ? liveTopRated : topRated?.length ? topRated : livePopular);

  const popularItems = popularTab === "streaming"
    ? (livePopular?.length ? livePopular : popular?.length ? popular : liveTopRated)
    : popularTab === "on-tv"
    ? (liveTopRated?.length ? liveTopRated : topRated?.length ? topRated : liveAiring)
    : (liveTheaters?.length ? liveTheaters : livePopular);

  return (
    <div className="whq-home">
      {/* ── 1. TMDB-Style Hero Welcome Banner ────────────────────────────── */}
      <section className="whq-hero-welcome" role="banner" aria-label="Welcome to WeebHQ">
        <div className="whq-hero-backdrop-layer" aria-hidden="true">
          {HERO_SLIDES.map((slide, i) => (
            <div
              key={slide.id}
              className={`whq-hero-slide-bg ${i === slideIdx ? "active" : ""}`}
              style={{ backgroundImage: `url(${slide.backdrop})` }}
            />
          ))}
          <div className="whq-hero-color-overlay" />
        </div>

        <div className="whq-hero-container">
          <div className="whq-hero-title-group">
            <h1 className="whq-hero-main-title">Welcome.</h1>
            <p className="whq-hero-main-sub">
              Millions of anime, manga and characters to discover. Explore now.
            </p>
          </div>
        </div>

        <div className="whq-hero-bottom-bar">
          <button
            type="button"
            className="whq-hero-nav-arrow prev"
            onClick={prevSlide}
            aria-label="Previous backdrop"
            title="Previous backdrop"
          >
            &#8249;
          </button>
          <div className="whq-hero-current-slide-info">
            <a
              href={currentSlide.href}
              className="whq-hero-slide-link"
              title={`View ${currentSlide.title}`}
            >
              {currentSlide.title}
            </a>
          </div>
          <button
            type="button"
            className="whq-hero-nav-arrow next"
            onClick={nextSlide}
            aria-label="Next backdrop"
            title="Next backdrop"
          >
            &#8250;
          </button>
        </div>
      </section>

      {/* ── 2. TMDB-Style Trending Section ───────────────────────────────── */}
      <section className="whq-trending-section" aria-labelledby="trending-heading">
        <div className="whq-trending-header">
          <h2 id="trending-heading" className="whq-trending-title">Trending</h2>
          <div className="whq-trending-toggle" role="tablist" aria-label="Trending timeframe">
            <button
              type="button"
              role="tab"
              aria-selected={trendingTab === "today"}
              className={`whq-trending-toggle-btn ${trendingTab === "today" ? "active" : ""}`}
              onClick={() => setTrendingTab("today")}
            >
              Today
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={trendingTab === "this-week"}
              className={`whq-trending-toggle-btn ${trendingTab === "this-week" ? "active" : ""}`}
              onClick={() => setTrendingTab("this-week")}
            >
              This Week
            </button>
          </div>
        </div>

        <div className="whq-trending-scroller-wrap">
          <div className="whq-trending-wave-bg" aria-hidden="true" />

          <div className="whq-trending-scroller" tabIndex={0} role="region" aria-label="Trending anime list">
            {trendingItems.slice(0, 16).map((item) => (
              <article key={item.id} className="whq-trending-card">
                <div className="whq-trending-poster-wrap">
                  <a href={`/anime/${item.id}`} className="whq-trending-poster-link" tabIndex={-1}>
                    <AnimeImage
                      src={item.img}
                      alt={item.title}
                      className="whq-trending-poster-img"
                    />
                  </a>
                  <button
                    type="button"
                    className="whq-card-more-btn"
                    aria-label={`Options for ${item.title}`}
                    title="Options"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/anime/${item.id}`;
                    }}
                  >
                    •••
                  </button>
                  <CircularScore score={item.score} />
                </div>

                <div className="whq-trending-meta">
                  <a href={`/anime/${item.id}`} className="whq-trending-card-title" title={item.title}>
                    {item.title}
                  </a>
                  <p className="whq-trending-card-date">
                    {formatAnimeDate(item)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. TMDB-Style What's Popular Section ─────────────────────────── */}
      <section className="whq-popular-section" aria-labelledby="popular-heading">
        <div className="whq-trending-header">
          <h2 id="popular-heading" className="whq-trending-title">What&apos;s Popular</h2>
          <div className="whq-trending-toggle" role="tablist" aria-label="Popular media type">
            <button
              type="button"
              role="tab"
              aria-selected={popularTab === "streaming"}
              className={`whq-trending-toggle-btn ${popularTab === "streaming" ? "active" : ""}`}
              onClick={() => setPopularTab("streaming")}
            >
              Streaming
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={popularTab === "on-tv"}
              className={`whq-trending-toggle-btn ${popularTab === "on-tv" ? "active" : ""}`}
              onClick={() => setPopularTab("on-tv")}
            >
              On TV
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={popularTab === "in-theaters"}
              className={`whq-trending-toggle-btn ${popularTab === "in-theaters" ? "active" : ""}`}
              onClick={() => setPopularTab("in-theaters")}
            >
              In Theaters
            </button>
          </div>
        </div>

        <div className="whq-trending-scroller-wrap">
          <div className="whq-trending-scroller" tabIndex={0} role="region" aria-label="Popular anime list">
            {popularItems.slice(0, 16).map((item) => (
              <article key={item.id} className="whq-trending-card">
                <div className="whq-trending-poster-wrap">
                  <a href={`/anime/${item.id}`} className="whq-trending-poster-link" tabIndex={-1}>
                    <AnimeImage
                      src={item.img}
                      alt={item.title}
                      className="whq-trending-poster-img"
                    />
                  </a>
                  <button
                    type="button"
                    className="whq-card-more-btn"
                    aria-label={`Options for ${item.title}`}
                    title="Options"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/anime/${item.id}`;
                    }}
                  >
                    •••
                  </button>
                  <CircularScore score={item.score} />
                </div>

                <div className="whq-trending-meta">
                  <a href={`/anime/${item.id}`} className="whq-trending-card-title" title={item.title}>
                    {item.title}
                  </a>
                  <p className="whq-trending-card-date">
                    {formatAnimeDate(item)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. TMDB-Style Leaderboard Section ────────────────────────────── */}
      <section className="whq-leaderboard-section" aria-labelledby="leaderboard-heading">
        <div className="whq-leaderboard-header">
          <h2 id="leaderboard-heading" className="whq-leaderboard-title">Leaderboard</h2>
          <div className="whq-leaderboard-legend">
            <span className="whq-legend-item all-time">
              <span className="whq-legend-dot all-time" />
              All Time Edits
            </span>
            <span className="whq-legend-item this-week">
              <span className="whq-legend-dot this-week" />
              Edits This Week
            </span>
          </div>
        </div>

        <div className="whq-leaderboard-grid">
          <div className="whq-leaderboard-col">
            {LEADERBOARD_USERS.slice(0, 5).map((user) => {
              const allTimePercent = Math.max(8, Math.min(100, (user.allTime / 3200000) * 100));
              const weekPercent = Math.max(8, Math.min(100, (user.thisWeek / 37000) * 100));
              return (
                <div key={user.id} className="whq-leaderboard-row">
                  <div className="whq-leaderboard-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} loading="lazy" />
                    ) : (
                      <span className="whq-avatar-initial" style={{ backgroundColor: user.color || "#00d2c4" }}>
                        {user.initial}
                      </span>
                    )}
                  </div>
                  <div className="whq-leaderboard-data">
                    <div className="whq-leaderboard-name">{user.name}</div>
                    <div className="whq-leaderboard-bars">
                      <div className="whq-bar-track">
                        <div className="whq-bar-fill all-time" style={{ width: `${allTimePercent}%` }}>
                          <span className="whq-bar-val">{user.allTimeFormatted}</span>
                        </div>
                      </div>
                      <div className="whq-bar-track">
                        <div className="whq-bar-fill this-week" style={{ width: `${weekPercent}%` }}>
                          <span className="whq-bar-val">{user.thisWeekFormatted}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="whq-leaderboard-col">
            {LEADERBOARD_USERS.slice(5, 10).map((user) => {
              const allTimePercent = Math.max(8, Math.min(100, (user.allTime / 3200000) * 100));
              const weekPercent = Math.max(8, Math.min(100, (user.thisWeek / 37000) * 100));
              return (
                <div key={user.id} className="whq-leaderboard-row">
                  <div className="whq-leaderboard-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} loading="lazy" />
                    ) : (
                      <span className="whq-avatar-initial" style={{ backgroundColor: user.color || "#00d2c4" }}>
                        {user.initial}
                      </span>
                    )}
                  </div>
                  <div className="whq-leaderboard-data">
                    <div className="whq-leaderboard-name">{user.name}</div>
                    <div className="whq-leaderboard-bars">
                      <div className="whq-bar-track">
                        <div className="whq-bar-fill all-time" style={{ width: `${allTimePercent}%` }}>
                          <span className="whq-bar-val">{user.allTimeFormatted}</span>
                        </div>
                      </div>
                      <div className="whq-bar-track">
                        <div className="whq-bar-fill this-week" style={{ width: `${weekPercent}%` }}>
                          <span className="whq-bar-val">{user.thisWeekFormatted}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}