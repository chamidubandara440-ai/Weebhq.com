"use client";
import { useState, useEffect, useCallback } from "react";

const API_BASE = "https://weebhq-api.chamidubandara440.workers.dev";

// ── Utility ──────────────────────────────────────────────────────────────────
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }

function AnimeImage({ src, alt, className }) {
  const [err, setErr] = useState(false);
  const fallback = `https://placehold.co/225x320/1a1a2e/ffffff?text=${encodeURIComponent(alt?.slice(0,10)||"Anime")}`;
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

// ── Skeleton loaders ──────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="hq-card hq-skeleton">
      <div className="hq-card-img hq-skel-block" />
      <div className="hq-card-body">
        <div className="hq-skel-line hq-skel-line--wide" />
        <div className="hq-skel-line" />
      </div>
    </div>
  );
}

function RankSkeleton() {
  return (
    <div className="hq-rank-item hq-skeleton">
      <div className="hq-rank-num hq-skel-block" style={{width:28,height:28}} />
      <div className="hq-skel-block" style={{width:42,height:58,borderRadius:4}} />
      <div style={{flex:1}}>
        <div className="hq-skel-line hq-skel-line--wide" />
        <div className="hq-skel-line" />
      </div>
    </div>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────────
function SearchBar() {
  const [q, setQ] = useState("");

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (q.trim()) {
      window.location.href = `/anime/search?q=${encodeURIComponent(q.trim())}`;
    }
  }, [q]);

  return (
    <form className="hq-search-form" onSubmit={handleSearch} role="search" aria-label="Search anime">
      <div className="hq-search-inner">
        <svg className="hq-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          id="homepage-search"
          type="search"
          className="hq-search-input"
          placeholder="Search anime, manga, studios..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search anime"
          autoComplete="off"
        />
        <button type="submit" className="hq-search-btn" aria-label="Submit search">
          Search
        </button>
      </div>
    </form>
  );
}

// ── Anime Card ────────────────────────────────────────────────────────────────
function AnimeCard({ anime }) {
  return (
    <a href={`/anime/${anime.id}`} className="hq-card" aria-label={`View ${anime.title}`}>
      <div className="hq-card-img-wrap">
        <AnimeImage src={anime.img} alt={anime.title} className="hq-card-img" />
        {anime.score && anime.score !== "N/A" && (
          <span className="hq-card-score">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="#ffc107" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            {anime.score}
          </span>
        )}
        {anime.type && <span className="hq-card-type">{anime.type}</span>}
      </div>
      <div className="hq-card-body">
        <p className="hq-card-title">{anime.title}</p>
        <p className="hq-card-meta">
          {[anime.type, anime.eps !== "?" ? `${anime.eps} eps` : null].filter(Boolean).join(" · ")}
        </p>
      </div>
    </a>
  );
}

// ── Rank Row ──────────────────────────────────────────────────────────────────
function RankRow({ anime, showAired }) {
  return (
    <a href={`/anime/${anime.id}`} className="hq-rank-item" aria-label={`${anime.rank}. ${anime.title}`}>
      <span className="hq-rank-num">{anime.rank}</span>
      <AnimeImage src={anime.img} alt={anime.title} className="hq-rank-img" />
      <div className="hq-rank-info">
        <span className="hq-rank-title">{anime.title}</span>
        <span className="hq-rank-meta">
          {showAired && anime.airedString
            ? anime.airedString
            : `${anime.type || "TV"} · ${anime.eps !== "?" ? `${anime.eps} eps` : "? eps"}`}
          {!showAired && anime.score !== "N/A" && (
            <span className="hq-rank-score"> · ★ {anime.score}</span>
          )}
        </span>
      </div>
    </a>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, href, linkLabel, children, id }) {
  return (
    <section className="hq-section" aria-labelledby={id} id={id}>
      <div className="hq-section-head">
        <h2 className="hq-section-title" id={id}>{title}</h2>
        {href && (
          <a href={href} className="hq-section-more" aria-label={`${linkLabel || "View more"} ${title}`}>
            {linkLabel || "View All"} →
          </a>
        )}
      </div>
      {children}
    </section>
  );
}

// ── Genre badge ───────────────────────────────────────────────────────────────
const GENRE_ICONS = {
  Action:"⚔️", Adventure:"🗺️", Comedy:"😂", Drama:"🎭", Fantasy:"✨",
  Horror:"👻", Mystery:"🔍", Romance:"💕", "Sci-Fi":"🚀", "Slice of Life":"☕",
  Sports:"⚽", Supernatural:"👁️", Thriller:"😱", Mecha:"🤖", Music:"🎵",
  Psychological:"🧠", Ecchi:"🔞", Historical:"📜", Military:"🪖", School:"🏫",
};

function GenreBadge({ name }) {
  const icon = GENRE_ICONS[name] || "🎬";
  return (
    <a
      href={`/anime/search?q=${encodeURIComponent(name)}`}
      className="hq-genre-badge"
      aria-label={`Browse ${name} anime`}
    >
      <span aria-hidden="true">{icon}</span> {name}
    </a>
  );
}

// ── News card ─────────────────────────────────────────────────────────────────
function NewsCard({ item }) {
  return (
    <a href={`/news/${item.id}`} className="hq-news-card" aria-label={`Read: ${item.title}`}>
      {item.img && (
        <div className="hq-news-img-wrap">
          <img src={item.img} alt={item.title} className="hq-news-img" loading="lazy" />
        </div>
      )}
      <div className="hq-news-body">
        <p className="hq-news-title">{item.title}</p>
        {item.snippet && <p className="hq-news-snippet">{item.snippet}</p>}
        <span className="hq-news-date">{item.date}</span>
      </div>
    </a>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ item }) {
  return (
    <a href={`/reviews/${item.id}`} className="hq-review-card" aria-label={`Read review: ${item.title}`}>
      {item.img && (
        <div className="hq-review-img-wrap">
          <img src={item.img} alt={item.title} className="hq-review-img" loading="lazy" />
        </div>
      )}
      <div className="hq-review-body">
        <p className="hq-review-title">{item.title}</p>
        {item.snippet && <p className="hq-review-snippet">{item.snippet}</p>}
        <div className="hq-review-foot">
          {item.score && (
            <span className="hq-review-score">★ {typeof item.score === "number" ? item.score.toFixed(1) : item.score}</span>
          )}
          <span className="hq-review-date">{item.date}</span>
        </div>
      </div>
    </a>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HomeClient({
  airing, topRated, popular, seasonal, upcoming,
  genres, news, reviews, currentSeason, currentYear,
}) {
  const [liveAiring, setLiveAiring] = useState(airing);
  const [liveUpcoming, setLiveUpcoming] = useState(upcoming);
  const [liveSeasonal, setLiveSeasonal] = useState(seasonal);
  const [loading, setLoading] = useState(
    !airing?.length || !seasonal?.length
  );

  useEffect(() => {
    if (airing?.length && seasonal?.length) return; // server data sufficient
    setLoading(true);

    Promise.all([
      fetch(`${API_BASE}/api/anime?limit=50`, { cache: "no-store" }).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/api/anime?limit=50&offset=50`, { cache: "no-store" }).then(r => r.ok ? r.json() : null),
    ]).then(([p1, p2]) => {
      const all = [...(p1?.data || []), ...(p2?.data || [])];
      if (!airing?.length) {
        setLiveAiring(
          all.filter(a => ["currently airing","releasing","airing"].includes((a.status||"").toLowerCase()))
             .sort((a,b)=>(b.score||0)-(a.score||0))
             .slice(0,8)
             .map((a,i) => ({rank:i+1,id:a.id,title:a.title_english||a.title,score:a.score!=null?Number(a.score).toFixed(2):"N/A",img:a.image_url,type:a.anime_type||"TV",eps:a.episodes??"?",members:a.members?Number(a.members).toLocaleString():"0"}))
        );
      }
      if (!seasonal?.length) {
        const month = new Date().getMonth();
        const s = month<3?"winter":month<6?"spring":month<9?"summer":"fall";
        const y = new Date().getFullYear();
        setLiveSeasonal(
          all.filter(a=>a.season&&a.season.toLowerCase()===s&&a.season_year===y)
             .sort((a,b)=>(b.score||0)-(a.score||0))
             .slice(0,12)
             .map((a,i)=>({rank:i+1,id:a.id,title:a.title_english||a.title,score:a.score!=null?Number(a.score).toFixed(2):"N/A",img:a.image_url,type:a.anime_type||"TV",eps:a.episodes??"?"}))
        );
      }
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const seasonLabel = `${cap(currentSeason || "Fall")} ${currentYear || new Date().getFullYear()}`;

  return (
    <div className="hq-home">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <header className="hq-hero" role="banner">
        <div className="hq-hero-bg" aria-hidden="true" />
        <div className="hq-hero-content">
          <h1 className="hq-hero-title">
            Discover Your Next
            <span className="hq-hero-accent"> Anime Obsession</span>
          </h1>
          <p className="hq-hero-sub">
            Browse thousands of anime, explore seasonal picks, read fan reviews,
            and find your next favourite series.
          </p>
          <SearchBar />
          <nav className="hq-hero-links" aria-label="Quick navigation">
            <a href="/anime/top">🏆 Top Anime</a>
            <a href="/anime/seasonal">📅 Seasonal</a>
            <a href="/anime/search">🔍 Browse All</a>
            <a href="/anime/reviews">⭐ Reviews</a>
            <a href="/news">📰 News</a>
          </nav>
        </div>
      </header>

      <main className="hq-main" id="main-content">

        {/* ── Top two-column grid ────────────────────────────────────────── */}
        <div className="hq-layout">

          {/* LEFT: ranking sidebars */}
          <aside className="hq-sidebar" aria-label="Ranking sidebars">
            <Section title="Top Airing Anime" href="/anime/top" id="top-airing">
              {loading && !liveAiring?.length
                ? Array.from({length:5}).map((_,i)=><RankSkeleton key={i}/>)
                : liveAiring?.length
                  ? liveAiring.slice(0,8).map((a)=><RankRow key={a.id} anime={a} showAired={false}/>)
                  : <p className="hq-empty">No airing anime available right now.</p>
              }
            </Section>

            <Section title="Upcoming Anime" href="/anime/seasonal" id="upcoming">
              {liveUpcoming === null
                ? Array.from({length:5}).map((_,i)=><RankSkeleton key={i}/>)
                : liveUpcoming?.length
                  ? liveUpcoming.slice(0,8).map((a)=><RankRow key={a.id||a.rank} anime={a} showAired={true}/>)
                  : <p className="hq-empty">No upcoming anime data available.</p>
              }
            </Section>
          </aside>

          {/* RIGHT: main content area */}
          <div className="hq-content">

            {/* Seasonal anime */}
            <Section title={`${seasonLabel} Anime`} href="/anime/seasonal" id="seasonal">
              <div className="hq-card-grid">
                {loading && !liveSeasonal?.length
                  ? Array.from({length:6}).map((_,i)=><CardSkeleton key={i}/>)
                  : liveSeasonal?.length
                    ? liveSeasonal.map(a=><AnimeCard key={a.id} anime={a}/>)
                    : <p className="hq-empty">No {seasonLabel} anime found yet.</p>
                }
              </div>
            </Section>

            {/* Top Rated */}
            {topRated?.length > 0 && (
              <Section title="Top Rated All Time" href="/anime/top" id="top-rated">
                <div className="hq-card-grid">
                  {topRated.map(a=><AnimeCard key={a.id} anime={a}/>)}
                </div>
              </Section>
            )}

            {/* Most Popular */}
            {popular?.length > 0 && (
              <Section title="Most Popular" href="/anime/top" id="popular">
                <div className="hq-card-grid hq-card-grid--wide">
                  {popular.map(a=><AnimeCard key={a.id} anime={a}/>)}
                </div>
              </Section>
            )}
          </div>
        </div>

        {/* ── Genre Explorer ─────────────────────────────────────────────── */}
        {genres?.length > 0 && (
          <Section title="Browse by Genre" href="/anime/search" id="genres">
            <nav className="hq-genre-grid" aria-label="Genre browser">
              {genres.map(g=><GenreBadge key={g} name={g}/>)}
            </nav>
          </Section>
        )}

        {/* ── News & Reviews row ─────────────────────────────────────────── */}
        <div className="hq-bottom-row">
          {news?.length > 0 && (
            <Section title="Anime & Manga News" href="/news" id="news">
              <div className="hq-news-grid">
                {news.slice(0,6).map(item=><NewsCard key={item.id} item={item}/>)}
              </div>
            </Section>
          )}

          {reviews?.length > 0 && (
            <Section title="Latest Reviews" href="/anime/reviews" id="reviews">
              <div className="hq-review-list">
                {reviews.slice(0,4).map(item=><ReviewCard key={item.id} item={item}/>)}
              </div>
            </Section>
          )}
        </div>

      </main>
    </div>
  );
}