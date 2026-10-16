"use client";

import { useState, useEffect, useMemo } from "react";

const API_BASE = "https://weebhq-api.chamidubandara440.workers.dev";

// TMDB Circular Score Meter
function CardScoreMeter({ score }) {
  if (!score || score === "N/A") return null;
  const num = parseFloat(score);
  const percent = Math.min(Math.round(num * 10), 100);
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const strokeColor = percent >= 70 ? "#21d07a" : percent >= 50 ? "#d2d531" : "#db2360";

  return (
    <div className="whq-card-score-wrap" title={`User Score: ${percent}%`}>
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={radius} stroke="rgba(33, 208, 122, 0.2)" strokeWidth="3.5" fill="#081c22" />
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform="rotate(-90 20 20)"
        />
      </svg>
      <div className="whq-card-score-text">
        <span>{percent}</span>
        <span className="whq-card-score-pct">%</span>
      </div>
    </div>
  );
}

// Available genres matching TMDB screenshot
const ALL_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Family", "Fantasy", "History", "Horror", "Music",
  "Mystery", "Romance", "Science Fiction", "TV Movie", "Thriller", "War", "Western"
];

// Quick Pill Categories
const CATEGORY_PILLS = [
  { id: "popular", label: "Popular", dotColor: "#01b4e4" },
  { id: "theatres", label: "In Theatres", dotColor: "#f59e0b" },
  { id: "coming_soon", label: "Coming Soon", dotColor: "#10b981" },
  { id: "for_rent", label: "For Rent", dotColor: "#ef4444" },
  { id: "streaming", label: "New on Streaming", dotColor: "#3b82f6" },
  { id: "airing_tonight", label: "Airing Tonight", dotColor: "#8b5cf6" },
  { id: "new_series", label: "New Series", dotColor: "#ec4899" },
  { id: "returning", label: "Returning This Week", dotColor: "#6366f1" },
  { id: "currently_airing", label: "Currently Airing", dotColor: "#14b8a6" },
  { id: "free_to_watch", label: "Free to Watch", dotColor: "#84cc16" },
  { id: "top_rated", label: "Top Rated", dotColor: "#eab308" },
  { id: "hidden_gems", label: "Hidden Gems", dotColor: "#f97316" },
  { id: "critically_acclaimed", label: "Critically Acclaimed", dotColor: "#a855f7" },
];

export default function AnimeBrowseCatalog({ initialCategory = "popular", pageTitle = "Popular Anime", initialViewMode = "list" }) {
  const [viewMode, setViewMode] = useState(initialViewMode); // 'list' | 'calendar'
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);

  // Accordion Expand States
  const [sortOpen, setSortOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Filter & Sort States
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [showMe, setShowMe] = useState("everything");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [minScore, setMinScore] = useState(0);
  const [minVotes, setMinVotes] = useState(0);
  const [keywordQuery, setKeywordQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");

  // Calendar State
  const [calMonthOffset, setCalMonthOffset] = useState(0);

  // Card Context Menu
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Fetch Anime Data
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/anime?limit=100`)
      .then((res) => res.json())
      .then((json) => {
        const data = json.data || (Array.isArray(json) ? json : []);
        setAnimeList(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load catalog anime", err);
        setLoading(false);
      });
  }, []);

  // Filter & Sort Logic
  const filteredAnime = useMemo(() => {
    let result = [...animeList];

    // Category Quick Filters
    if (activeCategory === "top_rated" || activeCategory === "critically_acclaimed") {
      result.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (activeCategory === "theatres") {
      result = result.filter((a) => a.anime_type === "Movie" || (a.title && a.title.toLowerCase().includes("movie")));
    } else if (activeCategory === "coming_soon") {
      result = result.filter((a) => a.status === "Not yet aired" || (a.season_year && a.season_year >= 2025));
    } else if (activeCategory === "currently_airing" || activeCategory === "airing_tonight") {
      result = result.filter((a) => a.status === "Currently Airing");
    }

    // Genre filter
    if (selectedGenres.length > 0) {
      result = result.filter((a) => {
        const itemGenres = Array.isArray(a.genres)
          ? a.genres.map((g) => (typeof g === "string" ? g : g.name).toLowerCase())
          : [];
        return selectedGenres.some((sg) => itemGenres.includes(sg.toLowerCase()));
      });
    }

    // Min Score
    if (minScore > 0) {
      result = result.filter((a) => (a.score || 0) >= minScore);
    }

    // Keyword filter
    if (keywordQuery.trim()) {
      const q = keywordQuery.toLowerCase();
      result = result.filter((a) =>
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.title_english && a.title_english.toLowerCase().includes(q))
      );
    }

    // Sort By
    if (sortBy === "popularity.desc") {
      result.sort((a, b) => (a.popularity || 99999) - (b.popularity || 99999));
    } else if (sortBy === "popularity.asc") {
      result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (sortBy === "vote_average.desc") {
      result.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortBy === "vote_average.asc") {
      result.sort((a, b) => (a.score || 0) - (b.score || 0));
    } else if (sortBy === "primary_release_date.desc") {
      result.sort((a, b) => (b.season_year || 0) - (a.season_year || 0));
    } else if (sortBy === "title.asc") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return result;
  }, [animeList, activeCategory, selectedGenres, minScore, keywordQuery, sortBy]);

  // Toggle Genre Chip
  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  // Calendar dates generation
  const calendarDays = useMemo(() => {
    const days = [];
    const baseDate = new Date(2026, 8 + calMonthOffset, 1); // e.g. Sep 2026
    const monthName = baseDate.toLocaleString("default", { month: "long" });
    const year = baseDate.getFullYear();

    // Generate 35 days (5 weeks)
    for (let i = 1; i <= 35; i++) {
      const dayNum = ((i - 1) % 30) + 1;
      const matching = animeList.filter((a) => {
        if (!a.start_date) return false;
        const d = new Date(a.start_date);
        return d.getDate() === dayNum;
      });
      days.push({ dayNumber: dayNum, items: matching.slice(0, 2) });
    }
    return { monthName, year, days };
  }, [animeList, calMonthOffset]);

  const displayedList = filteredAnime.slice(0, visibleCount);

  return (
    <div className="whq-browse-root">
      {/* Toast */}
      {toastMsg && (
        <div className="whq-toast-container">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── 1. Top Header Row ────────────────────────────────────────── */}
      <div className="whq-browse-header-row">
        <div className="whq-browse-title-dropdown">
          <h1 className="whq-browse-title">
            {activeCategory === "top_rated" ? "Top Rated Anime" :
             activeCategory === "theatres" ? "In Theatres" :
             activeCategory === "coming_soon" ? "Coming Soon" :
             pageTitle}
          </h1>
          <span className="whq-title-arrow">▾</span>
        </div>

        {/* List / Calendar View Toggle */}
        <div className="whq-view-toggle">
          <button
            type="button"
            className={`whq-view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            List
          </button>
          <button
            type="button"
            className={`whq-view-btn ${viewMode === "calendar" ? "active" : ""}`}
            onClick={() => setViewMode("calendar")}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* ── 2. Category Filter Pills Row ─────────────────────────────── */}
      <div className="whq-pills-scroller">
        {CATEGORY_PILLS.map((pill) => (
          <button
            key={pill.id}
            type="button"
            className={`whq-pill-btn ${activeCategory === pill.id ? "active" : ""}`}
            onClick={() => {
              setActiveCategory(pill.id);
              setVisibleCount(20);
            }}
          >
            <span className="whq-pill-dot" style={{ backgroundColor: pill.dotColor }} />
            <span>{pill.label}</span>
          </button>
        ))}
      </div>

      {/* ── 3. Main Two-Column Layout ────────────────────────────────── */}
      <div className="whq-browse-layout">
        {/* ── Left Sidebar (Sort & Filters) ── */}
        <aside className="whq-browse-sidebar" aria-label="Catalog filters">
          {/* Sort Accordion */}
          <div className="whq-filter-accordion">
            <button
              type="button"
              className="whq-accordion-header"
              onClick={() => setSortOpen(!sortOpen)}
            >
              <span>Sort</span>
              <span className={`whq-accordion-arrow ${sortOpen ? "open" : ""}`}>›</span>
            </button>
            {sortOpen && (
              <div className="whq-accordion-body">
                <label className="whq-input-label">Sort Results By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="whq-select-dropdown"
                >
                  <option value="popularity.desc">Popularity Descending</option>
                  <option value="popularity.asc">Popularity Ascending</option>
                  <option value="vote_average.desc">Rating Descending</option>
                  <option value="vote_average.asc">Rating Ascending</option>
                  <option value="primary_release_date.desc">Release Date Descending</option>
                  <option value="title.asc">Title (A-Z)</option>
                </select>
              </div>
            )}
          </div>

          {/* Filters Accordion */}
          <div className="whq-filter-accordion">
            <button
              type="button"
              className="whq-accordion-header"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <span>Filters</span>
              <span className={`whq-accordion-arrow ${filtersOpen ? "open" : ""}`}>›</span>
            </button>
            {filtersOpen && (
              <div className="whq-accordion-body">
                {/* Show Me Radio */}
                <div className="whq-filter-group">
                  <span className="whq-input-label">Show Me ⓘ</span>
                  <div className="whq-radio-list">
                    <label className="whq-radio-label">
                      <input
                        type="radio"
                        name="showMe"
                        value="everything"
                        checked={showMe === "everything"}
                        onChange={() => setShowMe("everything")}
                      />
                      <span>Everything</span>
                    </label>
                    <label className="whq-radio-label">
                      <input
                        type="radio"
                        name="showMe"
                        value="unseen"
                        checked={showMe === "unseen"}
                        onChange={() => setShowMe("unseen")}
                      />
                      <span>Anime I Haven&apos;t Seen</span>
                    </label>
                    <label className="whq-radio-label">
                      <input
                        type="radio"
                        name="showMe"
                        value="seen"
                        checked={showMe === "seen"}
                        onChange={() => setShowMe("seen")}
                      />
                      <span>Anime I Have Seen</span>
                    </label>
                  </div>
                </div>

                {/* Genres Multi-select Chips */}
                <div className="whq-filter-group">
                  <span className="whq-input-label">Genres</span>
                  <div className="whq-genre-chips">
                    {ALL_GENRES.map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`whq-genre-chip ${selectedGenres.includes(g) ? "active" : ""}`}
                        onClick={() => toggleGenre(g)}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* User Score Slider */}
                <div className="whq-filter-group">
                  <div className="whq-slider-header">
                    <span className="whq-input-label">User Score</span>
                    <span className="whq-slider-val">{minScore > 0 ? `${minScore}+ / 10` : "All"}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={minScore}
                    onChange={(e) => setMinScore(parseFloat(e.target.value))}
                    className="whq-browse-slider"
                  />
                  <div className="whq-slider-ticks">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>

                {/* Minimum User Votes Slider */}
                <div className="whq-filter-group">
                  <div className="whq-slider-header">
                    <span className="whq-input-label">Minimum User Votes</span>
                    <span className="whq-slider-val">{minVotes > 0 ? `${minVotes}+` : "0"}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="50"
                    value={minVotes}
                    onChange={(e) => setMinVotes(parseInt(e.target.value))}
                    className="whq-browse-slider"
                  />
                  <div className="whq-slider-ticks">
                    <span>0</span>
                    <span>250</span>
                    <span>500</span>
                  </div>
                </div>

                {/* Keywords Search */}
                <div className="whq-filter-group">
                  <span className="whq-input-label">Keywords</span>
                  <input
                    type="text"
                    placeholder="Filter by keywords..."
                    value={keywordQuery}
                    onChange={(e) => setKeywordQuery(e.target.value)}
                    className="whq-keyword-input"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="button"
                  className="whq-btn-sidebar-search"
                  onClick={() => showToast(`Applied filters (${filteredAnime.length} results)`)}
                >
                  Search
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Right Content Area ── */}
        <main className="whq-browse-main">
          {/* LIST VIEW (5-Column Poster Grid) */}
          {viewMode === "list" && (
            <>
              {loading ? (
                <div className="whq-browse-loading">
                  <div className="whq-loading-spinner" />
                  <p>Loading TMDB Anime Catalog...</p>
                </div>
              ) : filteredAnime.length === 0 ? (
                <div className="whq-browse-empty">
                  <h3>No Anime Found</h3>
                  <p>Try resetting some of your filter criteria.</p>
                  <button
                    type="button"
                    className="whq-btn-action-primary"
                    onClick={() => {
                      setSelectedGenres([]);
                      setMinScore(0);
                      setKeywordQuery("");
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="whq-poster-grid">
                  {displayedList.map((anime) => {
                    const poster = anime.image_url || `https://placehold.co/200x300/032541/ffffff?text=${encodeURIComponent(anime.title?.slice(0, 10))}`;
                    const releaseDate = anime.start_date || (anime.season_year ? `${anime.season_year}` : "2024");

                    return (
                      <div key={anime.id} className="whq-grid-card">
                        <div className="whq-card-poster-wrap">
                          <a href={`/anime/${anime.id}`}>
                            <img src={poster} alt={anime.title} loading="lazy" />
                          </a>

                          {/* Top-right '···' context menu */}
                          <button
                            type="button"
                            className="whq-card-menu-btn"
                            onClick={() => setActiveMenuId(activeMenuId === anime.id ? null : anime.id)}
                            aria-label="Options"
                          >
                            •••
                          </button>

                          {/* Context Dropdown */}
                          {activeMenuId === anime.id && (
                            <div className="whq-card-context-menu">
                              <button
                                type="button"
                                onClick={() => {
                                  showToast(`Added "${anime.title}" to Favorites ❤️`);
                                  setActiveMenuId(null);
                                }}
                              >
                                ❤️ Favorite
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  showToast(`Added "${anime.title}" to Watchlist 🔖`);
                                  setActiveMenuId(null);
                                }}
                              >
                                🔖 Watchlist
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/anime/${anime.id}`);
                                  showToast("Link copied to clipboard! 🔗");
                                  setActiveMenuId(null);
                                }}
                              >
                                🔗 Copy Link
                              </button>
                            </div>
                          )}

                          {/* Overlapping Circular Rating Meter */}
                          <div className="whq-card-meter-anchor">
                            <CardScoreMeter score={anime.score} />
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="whq-card-info">
                          <a href={`/anime/${anime.id}`} className="whq-card-title">
                            {anime.title_english || anime.title}
                          </a>
                          <div className="whq-card-date">{releaseDate}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Load More Button */}
              {filteredAnime.length > visibleCount && (
                <div className="whq-load-more-wrap">
                  <button
                    type="button"
                    className="whq-btn-load-more"
                    onClick={() => setVisibleCount((prev) => prev + 20)}
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}

          {/* CALENDAR VIEW (7-Column Monthly Schedule) */}
          {viewMode === "calendar" && (
            <div className="whq-calendar-wrap">
              {/* Calendar Navigation Header */}
              <div className="whq-cal-nav-header">
                <button
                  type="button"
                  className="whq-cal-nav-btn"
                  onClick={() => setCalMonthOffset((prev) => prev - 1)}
                  aria-label="Previous month"
                >
                  ◀
                </button>
                <h3 className="whq-cal-period-title">
                  {calendarDays.monthName} {calendarDays.year} Releases
                </h3>
                <button
                  type="button"
                  className="whq-cal-nav-btn"
                  onClick={() => setCalMonthOffset((prev) => prev + 1)}
                  aria-label="Next month"
                >
                  ▶
                </button>
              </div>

              {/* Day-of-week headers */}
              <div className="whq-cal-grid-header">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                  <div key={d} className="whq-cal-weekday">{d}</div>
                ))}
              </div>

              {/* Calendar Days Matrix */}
              <div className="whq-cal-matrix">
                {calendarDays.days.map((cell, idx) => (
                  <div key={idx} className="whq-cal-cell">
                    <span className="whq-cal-day-num">{cell.dayNumber}</span>
                    {cell.items.map((it) => (
                      <a key={it.id} href={`/anime/${it.id}`} className="whq-cal-item-card">
                        <img src={it.image_url} alt={it.title} />
                        <div className="whq-cal-item-info">
                          <span className="whq-cal-item-title">{it.title}</span>
                          <span className="whq-cal-item-badge">{it.anime_type || "ANIME"}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
