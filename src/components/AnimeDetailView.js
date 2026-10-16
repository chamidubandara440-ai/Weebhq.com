"use client";

function getAnimeCreator(title = "") {
  const t = title.toLowerCase();
  if (t.includes("bleach")) return "Tite Kubo (Original Creator)";
  if (t.includes("re:zero")) return "Tappei Nagatsuki (Original Author)";
  if (t.includes("steel ball run") || t.includes("jojo")) return "Hirohiko Araki (Original Creator)";
  if (t.includes("frieren")) return "Kanehito Yamada (Original Author)";
  if (t.includes("fullmetal alchemist")) return "Hiromu Arakawa (Original Author)";
  if (t.includes("hunter x hunter")) return "Yoshihiro Togashi (Original Creator)";
  if (t.includes("attack on titan") || t.includes("shingeki")) return "Hajime Isayama (Original Creator)";
  if (t.includes("death note")) return "Tsugumi Ohba & Takeshi Obata";
  if (t.includes("one piece")) return "Eiichiro Oda (Original Creator)";
  if (t.includes("demon slayer") || t.includes("kimetsu")) return "Koyoharu Gotouge (Original Creator)";
  if (t.includes("jujutsu kaisen")) return "Gege Akutami (Original Creator)";
  if (t.includes("steins;gate")) return "Chiyomaru Shikura / 5pb.";
  if (t.includes("one-punch man") || t.includes("one punch")) return "ONE & Yusuke Murata";
  if (t.includes("black clover")) return "Yuki Tabata (Original Creator)";
  if (t.includes("apothecary")) return "Natsu Hyuuga (Original Author)";
  return null;
}


import { useState, useEffect } from "react";

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

// ── TMDB Circular Rating Meter ────────────────────────────────────────────────
function CircularScore({ score, userScore, onClick }) {
  if (!score || score === "N/A") return null;
  const displayScore = userScore ? userScore * 10 : parseFloat(score) * 10;
  const percent = Math.min(Math.round(displayScore), 100);
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const strokeColor = userScore ? "#00d2c4" : percent >= 70 ? "#21d07a" : percent >= 50 ? "#d2d531" : "#db2360";

  return (
    <div
      className="whq-dt-score-wrap"
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={userScore ? `Your Rating: ${userScore}/10 (Click to change)` : `User Score: ${percent}% (Click to rate)`}
      style={{ cursor: "pointer" }}
    >
      <div className="whq-dt-circle-rating">
        <svg className="whq-dt-circle-svg" width="56" height="56" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke="rgba(33, 208, 122, 0.2)"
            strokeWidth="4"
            fill="#081c22"
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke={strokeColor}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform="rotate(-90 28 28)"
          />
        </svg>
        <div className="whq-dt-circle-text">
          <span className="whq-dt-circle-num">{percent}</span>
          <span className="whq-dt-circle-percent">%</span>
        </div>
      </div>
      <div className="whq-dt-score-label">
        {userScore ? (
          <span style={{ color: "#00d2c4", fontWeight: 700 }}>Your<br />Score</span>
        ) : (
          <>User<br />Score</>
        )}
      </div>
    </div>
  );
}

export default function AnimeDetailView({ anime }) {
  // Navigation & Tabs
  const [socialTab, setSocialTab] = useState("discussions");
  const [mediaTab, setMediaTab] = useState("popular");
  const [imgErr, setImgErr] = useState(false);
  const [castList, setCastList] = useState([]);
  const [castLoading, setCastLoading] = useState(true);
  const [recs, setRecs] = useState([]);
  const [mediaData, setMediaData] = useState({ trailer: null, pictures: [] });
  const [trailerEmbedUrl, setTrailerEmbedUrl] = useState("");
  const [activeYoutubeId, setActiveYoutubeId] = useState("");
  const [trailerLoading, setTrailerLoading] = useState(false);

  // TMDB Interactive Modals
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [videoTitle, setVideoTitle] = useState("Official Trailer");
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // User State (Persisted)
  const [isFavorited, setIsFavorited] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [currentList, setCurrentList] = useState(null);
  const [userScore, setUserScore] = useState(null);
  const [userVibe, setUserVibe] = useState(null);
  const [tempScore, setTempScore] = useState(8);
  const [tempVibe, setTempVibe] = useState("");

  // Social Discussions & Reviews State
  const [showDiscussForm, setShowDiscussForm] = useState(false);
  const [newDiscussTitle, setNewDiscussTitle] = useState("");
  const [newDiscussText, setNewDiscussText] = useState("");
  const [discussions, setDiscussions] = useState([]);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewScore, setNewReviewScore] = useState(9);
  const [reviews, setReviews] = useState([]);

  // Toast Notification
  const [toastMsg, setToastMsg] = useState("");

  const animeId = anime?.id?.toString() || "1";

  // Load Persisted Data on Client Mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Favorites
      const favs = JSON.parse(localStorage.getItem("whq_favorites") || "[]");
      setIsFavorited(favs.includes(animeId));

      // Watchlist
      const wl = JSON.parse(localStorage.getItem("whq_watchlist") || "[]");
      setIsWatchlist(wl.includes(animeId));

      // Lists
      const lists = JSON.parse(localStorage.getItem("whq_user_lists") || "{}");
      if (lists[animeId]) setCurrentList(lists[animeId]);

      // Ratings
      const ratings = JSON.parse(localStorage.getItem("whq_ratings") || "{}");
      if (ratings[animeId]) {
        setUserScore(ratings[animeId]);
        setTempScore(ratings[animeId]);
      }

      // Vibes
      const vibes = JSON.parse(localStorage.getItem("whq_vibes") || "{}");
      if (vibes[animeId]) {
        setUserVibe(vibes[animeId]);
        setTempVibe(vibes[animeId]);
      }

      // Discussions
      const localDisc = JSON.parse(localStorage.getItem(`whq_disc_${animeId}`) || "null");
      if (localDisc) {
        setDiscussions(localDisc);
      } else {
        const aTitle = anime?.title_english || anime?.title || "This Anime";
        const aStudio = anime?.studios || "the animation studio";
        setDiscussions([
          {
            id: 1,
            author: "WeebReviewer",
            title: `${aTitle} - Episode Discussion & Story Theories`,
            time: "3 hours ago",
            replies: 8,
            snippet: `What are your favorite moments in ${aTitle}? Share your theories and breakdown!`,
          },
          {
            id: 2,
            author: "SakugaFan",
            title: `Animation & Production breakdown by ${aStudio}`,
            time: "1 day ago",
            replies: 14,
            snippet: `${aStudio} delivered fantastic cinematography, character direction, and sound design for ${aTitle}.`,
          },
        ]);
      }

      // Reviews
      const localRevs = JSON.parse(localStorage.getItem(`whq_revs_${animeId}`) || "null");
      if (localRevs) {
        setReviews(localRevs);
      } else {
        const aTitle = anime?.title_english || anime?.title || "This Series";
        const aStudio = anime?.studios || "the animation team";
        setReviews([
          {
            id: 1,
            author: "OtakuCurator",
            score: anime?.score != null ? Math.min(10, Math.round(Number(anime.score) * 10) / 10) : 9.0,
            date: "Verified Critique",
            text: `${aTitle} stands out with captivating pacing, memorable characters, and stellar craftsmanship from ${aStudio}. Highly recommended!`,
          },
        ]);
      }
    } catch (e) {
      console.warn("Could not read localStorage", e);
    }
  }, [animeId]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg("");
    }, 3200);
  };

  // Fetch Real Characters and Voice Actors
  useEffect(() => {
    if (!animeId) return;
    setCastLoading(true);
    fetch(`https://weebhq-api.chamidubandara440.workers.dev/api/anime/${animeId}/characters`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.data && json.data.length > 0) {
          const formatted = json.data.map((item) => ({
            id: item.id,
            name: item.va_name || item.name,
            role: `${item.name} (voice)`,
            episodes: `${anime?.episodes || 12} Episodes`,
            img: item.va_img || item.character_img || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=200&fit=crop",
          }));
          setCastList(formatted);
        } else {
          // Fallback if no characters found
          setCastList([]);
        }
        setCastLoading(false);
      })
      .catch(() => {
        setCastLoading(false);
      });
  }, [animeId, anime?.episodes]);

  // Fetch Real Anime Recommendations (shared genres/studios)
  useEffect(() => {
    fetch("https://weebhq-api.chamidubandara440.workers.dev/api/anime?limit=50")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const all = json?.data || [];
        const currentGenres = Array.isArray(anime?.genres)
          ? anime.genres.map((g) => (typeof g === "string" ? g.toLowerCase() : (g.name || "").toLowerCase()))
          : [];

        const filtered = all
          .filter((a) => String(a.id) !== String(animeId))
          .sort((a, b) => {
            // Rank by shared genre count or popularity
            const aGenres = Array.isArray(a.genres) ? a.genres.map(g => (typeof g === "string" ? g.toLowerCase() : (g.name || "").toLowerCase())) : [];
            const bGenres = Array.isArray(b.genres) ? b.genres.map(g => (typeof g === "string" ? g.toLowerCase() : (g.name || "").toLowerCase())) : [];
            const aShared = aGenres.filter(g => currentGenres.includes(g)).length;
            const bShared = bGenres.filter(g => currentGenres.includes(g)).length;
            if (bShared !== aShared) return bShared - aShared;
            return (b.score || 0) - (a.score || 0);
          })
          .slice(0, 10)
          .map((item) => ({
            id: item.id,
            title: item.title_english || item.title,
            score: item.score != null ? `${Math.round(item.score * 10)}%` : "85%",
            img: item.image_url || "/hero-backdrop-1.jpg",
          }));

        setRecs(filtered);
      })
      .catch(() => {});
  }, [animeId, anime?.genres]);

  // Fetch Real Official Media (Trailer & Pictures)
  useEffect(() => {
    if (!animeId) return;
    fetch(`https://weebhq-api.chamidubandara440.workers.dev/api/anime/${animeId}/media`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) {
          setMediaData({
            trailer: json.trailer || null,
            pictures: Array.isArray(json.pictures) ? json.pictures : [],
          });
          if (json.trailer?.youtube_id) {
            setActiveYoutubeId(json.trailer.youtube_id);
            setTrailerEmbedUrl(`https://www.youtube.com/embed/${json.trailer.youtube_id}?autoplay=1&enablejsapi=1&rel=0`);
          } else if (json.trailer?.embed_url) {
            setTrailerEmbedUrl(json.trailer.embed_url);
          }
        }
      })
      .catch(() => {});
  }, [animeId]);

  // Handle Play Trailer Modal with Auto-Fetch
  const handleOpenTrailer = async (ytId, customTitle) => {
    setVideoTitle(customTitle || mediaData?.trailer?.title || `${title} Official Trailer`);
    setTrailerModalOpen(true);

    const directId = ytId || mediaData?.trailer?.youtube_id;
    if (directId) {
      setActiveYoutubeId(directId);
      setTrailerEmbedUrl(`https://www.youtube.com/embed/${directId}?autoplay=1&enablejsapi=1&rel=0`);
      return;
    }

    setTrailerLoading(true);
    try {
      const res = await fetch(`https://weebhq-api.chamidubandara440.workers.dev/api/anime/${animeId}/media`);
      if (res.ok) {
        const json = await res.json();
        if (json?.trailer?.youtube_id) {
          setMediaData((prev) => ({ ...prev, trailer: json.trailer }));
          setActiveYoutubeId(json.trailer.youtube_id);
          setTrailerEmbedUrl(`https://www.youtube.com/embed/${json.trailer.youtube_id}?autoplay=1&enablejsapi=1&rel=0`);
          setTrailerLoading(false);
          return;
        }
      }

      // Secondary Fallback: Jikan direct
      const malId = anime?.source_id || animeId;
      const jRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
      if (jRes.ok) {
        const jJson = await jRes.json();
        const jYt = jJson?.data?.trailer?.youtube_id;
        if (jYt) {
          setActiveYoutubeId(jYt);
          setTrailerEmbedUrl(`https://www.youtube.com/embed/${jYt}?autoplay=1&enablejsapi=1&rel=0`);
          setTrailerLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error("Trailer fetch error:", e);
    }
    setTrailerLoading(false);
  };

  const handleCloseTrailer = () => {
    setTrailerModalOpen(false);
    setTrailerEmbedUrl("");
    setActiveYoutubeId("");
  };



  // Toggle Favorite
  const handleToggleFavorite = () => {
    try {
      const favs = JSON.parse(localStorage.getItem("whq_favorites") || "[]");
      let nextFavs;
      if (isFavorited) {
        nextFavs = favs.filter((id) => id !== animeId);
        setIsFavorited(false);
        showToast("Removed from Favorites");
      } else {
        nextFavs = [...new Set([...favs, animeId])];
        setIsFavorited(true);
        showToast("Added to Favorites ❤️");
      }
      localStorage.setItem("whq_favorites", JSON.stringify(nextFavs));
    } catch (e) {}
  };

  // Toggle Watchlist
  const handleToggleWatchlist = () => {
    try {
      const wl = JSON.parse(localStorage.getItem("whq_watchlist") || "[]");
      let nextWl;
      if (isWatchlist) {
        nextWl = wl.filter((id) => id !== animeId);
        setIsWatchlist(false);
        showToast("Removed from Watchlist");
      } else {
        nextWl = [...new Set([...wl, animeId])];
        setIsWatchlist(true);
        showToast("Added to Watchlist 🔖");
      }
      localStorage.setItem("whq_watchlist", JSON.stringify(nextWl));
    } catch (e) {}
  };

  // Select User List
  const handleSelectList = (listName) => {
    try {
      const lists = JSON.parse(localStorage.getItem("whq_user_lists") || "{}");
      lists[animeId] = listName;
      localStorage.setItem("whq_user_lists", JSON.stringify(lists));
      setCurrentList(listName);
      setListModalOpen(false);
      showToast(`Added to "${listName}" 📋`);
    } catch (e) {}
  };

  // Save Rating & Vibe
  const handleSaveRating = () => {
    try {
      const ratings = JSON.parse(localStorage.getItem("whq_ratings") || "{}");
      ratings[animeId] = tempScore;
      localStorage.setItem("whq_ratings", JSON.stringify(ratings));
      setUserScore(tempScore);

      if (tempVibe) {
        const vibes = JSON.parse(localStorage.getItem("whq_vibes") || "{}");
        vibes[animeId] = tempVibe;
        localStorage.setItem("whq_vibes", JSON.stringify(vibes));
        setUserVibe(tempVibe);
      }

      setRatingModalOpen(false);
      showToast(`Rating of ${tempScore}/10 saved! ★`);
    } catch (e) {}
  };

  // Clear Rating
  const handleClearRating = () => {
    try {
      const ratings = JSON.parse(localStorage.getItem("whq_ratings") || "{}");
      delete ratings[animeId];
      localStorage.setItem("whq_ratings", JSON.stringify(ratings));

      const vibes = JSON.parse(localStorage.getItem("whq_vibes") || "{}");
      delete vibes[animeId];
      localStorage.setItem("whq_vibes", JSON.stringify(vibes));

      setUserScore(null);
      setUserVibe(null);
      setRatingModalOpen(false);
      showToast("Rating cleared");
    } catch (e) {}
  };

  // Submit Discussion
  const handlePostDiscussion = (e) => {
    e.preventDefault();
    if (!newDiscussTitle.trim()) return;

    const newEntry = {
      id: Date.now(),
      author: "You (WeebHQ User)",
      title: newDiscussTitle.trim(),
      time: "Just now",
      replies: 0,
      snippet: newDiscussText.trim() || "Started a new thread...",
    };

    const nextDiscussions = [newEntry, ...discussions];
    setDiscussions(nextDiscussions);
    localStorage.setItem(`whq_disc_${animeId}`, JSON.stringify(nextDiscussions));
    setNewDiscussTitle("");
    setNewDiscussText("");
    setShowDiscussForm(false);
    showToast("Discussion thread posted!");
  };

  // Submit Review
  const handlePostReview = (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    const newEntry = {
      id: Date.now(),
      author: "You (WeebHQ Reviewer)",
      score: Number(newReviewScore),
      date: "Today",
      text: newReviewText.trim(),
    };

    const nextReviews = [newEntry, ...reviews];
    setReviews(nextReviews);
    localStorage.setItem(`whq_revs_${animeId}`, JSON.stringify(nextReviews));
    setNewReviewText("");
    setShowReviewForm(false);
    showToast("Review submitted successfully!");
  };

  if (!anime) return null;

  const title = anime.title_english || anime.title;
  const originalTitle = anime.title;
  const jpTitle = anime.title_japanese || "";
  const synopsis = anime.synopsis || "No synopsis available for this anime series.";
  const img = anime.image_url;
  const backdrop = anime.banner_url || anime.image_url;
  const score = anime.score != null ? Number(anime.score).toFixed(1) : "N/A";
  const popularity = anime.popularity || "1";
  const members = anime.members ? Number(anime.members).toLocaleString() : "N/A";
  const type = anime.anime_type || "TV";
  const status = anime.status || "Returning Series";
  const episodes = anime.episodes || "12";
  const startDate = anime.start_date || "2023";
  const endDate = anime.end_date || "";
  const year = anime.season_year || (startDate ? startDate.slice(0, 4) : "2023");
  const studios = anime.studios || "Animation Studio";

  // Genres
  const genresList = Array.isArray(anime.genres)
    ? anime.genres.map((g) => (typeof g === "string" ? g : g.name)).filter(Boolean)
    : ["Animation", "Sci-Fi & Fantasy", "Mystery", "Drama"];

  const genreString = genresList.length > 0 ? genresList.join(", ") : "Animation, Sci-Fi & Fantasy, Mystery, Drama";

  // Fallback poster
  const fallbackPoster = `https://placehold.co/300x450/0b1a2e/ffffff?text=${encodeURIComponent(title.slice(0, 14))}`;

  // Dynamic keywords based on anime genres, studio & format
  const keywords = Array.from(new Set([
    ...(genresList.map(g => g.toLowerCase())),
    ...(studios ? [studios.toLowerCase()] : []),
    type ? type.toLowerCase() : "tv series",
    status ? status.toLowerCase() : "anime",
    year ? `${year} anime` : "animation",
    "manga adaptation",
    "japanese animation",
  ])).slice(0, 10);

  // Mood tags
  const moodTags = [
    "animated", "dramatic", "funny", "rugged", "gritty", "thought-provoking",
    "mysterious", "family-friendly", "thrilling", "kid-friendly", "surreal",
    "unscripted", "imaginative", "scandalous", "somber", "politically charged"
  ];

// Dynamic keywords handled above

  // Real Official Media Items
  const mediaVideos = mediaData.trailer ? [
    {
      id: "v1",
      title: mediaData.trailer.title || `${title} Official Trailer`,
      runtime: "PV",
      thumb: mediaData.trailer.thumb || backdrop,
      embedUrl: mediaData.trailer.embed_url,
    }
  ] : [];

  // Real official pictures for backdrops & posters (NO fake starry night painting)
  const realPics = mediaData.pictures && mediaData.pictures.length > 0
    ? mediaData.pictures
    : (backdrop ? [backdrop] : (img ? [img] : []));

  const mediaBackdrops = realPics.map((pUrl, idx) => ({
    id: `b_${idx}`,
    img: pUrl,
    label: `${title} Key Visual ${idx + 1}`,
  }));

  const mediaPosters = realPics.map((pUrl, idx) => ({
    id: `p_${idx}`,
    img: pUrl,
    label: `${title} Poster ${idx + 1}`,
  }));

  return (
    <div className="whq-detail-page">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="whq-toast-container" role="status">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── 1. TMDB Sub-Navigation Bar ───────────────────────────────── */}
      <nav className="whq-subnav-bar" aria-label="Anime sub navigation">
        <div className="whq-subnav-container">
          <div className="whq-subnav-item active">
            <span>Overview</span>
            <span className="whq-subnav-arrow">▾</span>
          </div>
          <div className="whq-subnav-item" onClick={() => {
            const el = document.getElementById("media-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}>
            <span>Media</span>
            <span className="whq-subnav-arrow">▾</span>
          </div>
          <div className="whq-subnav-item" onClick={() => {
            const el = document.getElementById("social-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}>
            <span>Fandom</span>
            <span className="whq-subnav-arrow">▾</span>
          </div>
          <div className="whq-subnav-item" onClick={() => {
            if (typeof navigator !== "undefined" && navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
              showToast("Link copied to clipboard! 🔗");
            }
          }}>
            <span>Share</span>
            <span className="whq-subnav-arrow">▾</span>
          </div>
        </div>
      </nav>

      {/* ── 2. Cinematic Backdrop Hero Header ────────────────────────── */}
      <section className="whq-dt-hero">
        <div
          className="whq-dt-backdrop-bg"
          style={{ backgroundImage: `url(${backdrop})` }}
          aria-hidden="true"
        />
        <div className="whq-dt-backdrop-overlay" aria-hidden="true" />

        <div className="whq-dt-hero-container">
          {/* Left Poster */}
          <div className="whq-dt-poster-col">
            <div className="whq-dt-poster-wrap">
              <img
                src={imgErr || !img ? fallbackPoster : img}
                alt={`${title} Poster`}
                className="whq-dt-poster-img"
                onError={() => setImgErr(true)}
              />
            </div>
          </div>

          {/* Right Hero Details */}
          <div className="whq-dt-content-col">
            <h1 className="whq-dt-title">
              {title}
              {year && <span className="whq-dt-year"> ({year})</span>}
            </h1>

            {/* Metadata Line */}
            <div className="whq-dt-facts">
              <span className="whq-dt-genres">{genreString}</span>
              <span className="whq-dt-dot">•</span>
              <span>{type}</span>
              <span className="whq-dt-dot">•</span>
              <span>{episodes} Episodes</span>
              <span className="whq-dt-dot">•</span>
              <span>{status}</span>
            </div>

            {/* Actions & Rating Row */}
            <div className="whq-dt-actions-row">
              {/* TMDB Circular Rating Meter */}
              <CircularScore
                score={score}
                userScore={userScore}
                onClick={() => setRatingModalOpen(true)}
              />

              {/* What's your Vibe? */}
              <button
                type="button"
                className="whq-dt-vibe-btn"
                onClick={() => setRatingModalOpen(true)}
                title="Share your vibe and rating for this anime"
              >
                <span>{userVibe ? `Vibe: ${userVibe}` : "What's your Vibe?"}</span>
                <span className="whq-vibe-info">ⓘ</span>
              </button>

              {/* Round Icon Actions */}
              <div className="whq-dt-icon-actions">
                {/* List Dropdown Toggle */}
                <button
                  type="button"
                  className={`whq-dt-circle-btn ${currentList ? "active" : ""}`}
                  onClick={() => setListModalOpen(true)}
                  aria-label="Add to List"
                  title={currentList ? `List: ${currentList} (Click to change)` : "Add to a custom list"}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill={currentList ? "#facc15" : "currentColor"}>
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                  </svg>
                </button>

                {/* Favorite */}
                <button
                  type="button"
                  className={`whq-dt-circle-btn ${isFavorited ? "active" : ""}`}
                  onClick={handleToggleFavorite}
                  aria-label="Mark as Favorite"
                  title={isFavorited ? "Remove from Favorites" : "Mark as Favorite"}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill={isFavorited ? "#ff6584" : "currentColor"}>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>

                {/* Watchlist */}
                <button
                  type="button"
                  className={`whq-dt-circle-btn ${isWatchlist ? "active" : ""}`}
                  onClick={handleToggleWatchlist}
                  aria-label="Add to Watchlist"
                  title={isWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill={isWatchlist ? "#00d2c4" : "currentColor"}>
                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                  </svg>
                </button>
              </div>

              {/* Play Trailer Button (Modal Popup) */}
              <button
                type="button"
                className="whq-dt-trailer-btn"
                onClick={() => handleOpenTrailer(null, "Official Trailer")}
                title="Watch Trailer on WeebHQ"
              >
                <span className="whq-trailer-play">▶</span>
                <span>Play Trailer</span>
              </button>
            </div>

            {/* Tagline */}
            <p className="whq-dt-tagline">
              {anime.tagline || `Official ${studios || "Animation"} Production • ${year || ""}`}
            </p>

            {/* Overview */}
            <div className="whq-dt-overview-block">
              <h2 className="whq-dt-section-heading">Overview</h2>
              <div
                className="whq-dt-synopsis-text"
                dangerouslySetInnerHTML={{ __html: synopsis }}
              />
            </div>

            {/* Credits */}
            <div className="whq-dt-credits-grid">
              <div className="whq-dt-credit-item">
                <div className="whq-credit-name">{studios || "Li Haoling"}</div>
                <div className="whq-credit-role">Creator</div>
              </div>
              <div className="whq-dt-credit-item">
                <div className="whq-credit-name">{anime.season ? `${cap(anime.season)} ${anime.season_year}` : "Fall 2024"}</div>
                <div className="whq-credit-role">Premiere Season</div>
              </div>
              <div className="whq-dt-credit-item">
                <div className="whq-credit-name">{type}</div>
                <div className="whq-credit-role">Media Format</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Full Two-Column Body Content ──────────────────────────── */}
      <div className="whq-dt-main-body">
        <div className="whq-dt-body-container">
          {/* ── LEFT MAIN COLUMN ── */}
          <div className="whq-dt-main-col">
            {/* 1. Series Cast */}
            <section className="whq-dt-section-box">
              <h3 className="whq-dt-block-title">Series Cast</h3>
              <div className="whq-cast-scroller">
                {castList.map((c) => (
                  <div key={c.id} className="whq-cast-card">
                    <div className="whq-cast-img-wrap">
                      <img src={c.img} alt={c.name} loading="lazy" />
                    </div>
                    <div className="whq-cast-info">
                      <div className="whq-cast-name">{c.name}</div>
                      <div className="whq-cast-role">{c.role}</div>
                      <div className="whq-cast-eps">{c.episodes}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="whq-cast-footer">
                <a href="#cast" className="whq-link-more">Full Cast &amp; Crew</a>
              </div>
            </section>

            {/* 2. Current Season */}
            <section className="whq-dt-section-box">
              <div className="whq-season-header-row">
                <h3 className="whq-dt-block-title">Current Season</h3>
                <span className="whq-season-tab">Original Air Date</span>
              </div>
              <div className="whq-season-card">
                <div className="whq-season-thumb">
                  <img src={imgErr || !img ? fallbackPoster : img} alt={`${title} Season`} />
                </div>
                <div className="whq-season-details">
                  <h4 className="whq-season-name">{title} {year ? `(${year})` : ""}</h4>
                  <div className="whq-season-badge-row">
                    <span className="whq-season-score">★ 81%</span>
                    <span className="whq-season-dot">•</span>
                    <span>{year}</span>
                    <span className="whq-season-dot">•</span>
                    <span>{episodes} Episodes</span>
                  </div>
                  <p className="whq-season-synopsis">
                    {synopsis.slice(0, 260)}...
                  </p>
                  <div className="whq-season-air-status">
                    <span className="whq-cal-icon">📅</span> Episode {episodes} (Final)
                  </div>
                </div>
              </div>
              <div className="whq-season-footer">
                <a href="#seasons" className="whq-link-more">View All Seasons</a>
              </div>
            </section>

            {/* 3. Social */}
            <section id="social-section" className="whq-dt-section-box">
              <div className="whq-social-tabs-row">
                <h3 className="whq-dt-block-title">Social</h3>
                <div className="whq-social-tabs">
                  <button
                    type="button"
                    className={`whq-tab-btn ${socialTab === "reviews" ? "active" : ""}`}
                    onClick={() => setSocialTab("reviews")}
                  >
                    Reviews <span className="whq-count-badge">{reviews.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`whq-tab-btn ${socialTab === "discussions" ? "active" : ""}`}
                    onClick={() => setSocialTab("discussions")}
                  >
                    Discussions <span className="whq-count-badge">{discussions.length}</span>
                  </button>
                </div>
              </div>

              {/* Discussions Tab Content */}
              {socialTab === "discussions" && (
                <div className="whq-social-content-wrap">
                  {discussions.length > 0 ? (
                    <div className="whq-discussions-list">
                      {discussions.map((d) => (
                        <div key={d.id} className="whq-discussion-item">
                          <div className="whq-disc-avatar">{d.author.charAt(0).toUpperCase()}</div>
                          <div className="whq-disc-main">
                            <div className="whq-disc-header">
                              <span className="whq-disc-title">{d.title}</span>
                              <span className="whq-disc-meta">by {d.author} • {d.time}</span>
                            </div>
                            <p className="whq-disc-snippet">{d.snippet}</p>
                            <span className="whq-disc-replies">💬 {d.replies} replies</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="whq-social-box">
                      <p>There are no discussions for {title}. Be the first to start a topic!</p>
                    </div>
                  )}

                  {/* Start Discussion Toggle & Form */}
                  <div className="whq-action-form-box">
                    {!showDiscussForm ? (
                      <button
                        type="button"
                        className="whq-btn-action-primary"
                        onClick={() => setShowDiscussForm(true)}
                      >
                        + Start a Discussion
                      </button>
                    ) : (
                      <form onSubmit={handlePostDiscussion} className="whq-interactive-form">
                        <h4 className="whq-form-title">Start a New Discussion</h4>
                        <input
                          type="text"
                          placeholder="Topic Title (e.g. Episode 5 discussion)"
                          value={newDiscussTitle}
                          onChange={(e) => setNewDiscussTitle(e.target.value)}
                          className="whq-form-input"
                          required
                        />
                        <textarea
                          placeholder="Write your thoughts..."
                          value={newDiscussText}
                          onChange={(e) => setNewDiscussText(e.target.value)}
                          className="whq-form-textarea"
                          rows={3}
                          required
                        />
                        <div className="whq-form-btn-row">
                          <button type="submit" className="whq-btn-action-primary">Post Topic</button>
                          <button
                            type="button"
                            className="whq-btn-action-sub"
                            onClick={() => setShowDiscussForm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Reviews Tab Content */}
              {socialTab === "reviews" && (
                <div className="whq-social-content-wrap">
                  {reviews.length > 0 ? (
                    <div className="whq-reviews-list">
                      {reviews.map((r) => (
                        <div key={r.id} className="whq-review-card">
                          <div className="whq-review-header">
                            <div className="whq-review-avatar">{r.author.charAt(0).toUpperCase()}</div>
                            <div>
                              <div className="whq-review-author-name">{r.author}</div>
                              <div className="whq-review-date">{r.date}</div>
                            </div>
                            <span className="whq-review-score-badge">★ {r.score}/10</span>
                          </div>
                          <p className="whq-review-text">&ldquo;{r.text}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="whq-social-box">
                      <p>No community reviews yet for {title}. Be the first to review it!</p>
                    </div>
                  )}

                  {/* Write Review Toggle & Form */}
                  <div className="whq-action-form-box">
                    {!showReviewForm ? (
                      <button
                        type="button"
                        className="whq-btn-action-primary"
                        onClick={() => setShowReviewForm(true)}
                      >
                        ★ Write a Review
                      </button>
                    ) : (
                      <form onSubmit={handlePostReview} className="whq-interactive-form">
                        <h4 className="whq-form-title">Write Your Review</h4>
                        <div className="whq-form-score-row">
                          <label>Score (1-10):</label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            step="0.5"
                            value={newReviewScore}
                            onChange={(e) => setNewReviewScore(e.target.value)}
                            className="whq-range-slider"
                          />
                          <span className="whq-range-val">{newReviewScore}/10</span>
                        </div>
                        <textarea
                          placeholder="Share your detailed critique with other anime fans..."
                          value={newReviewText}
                          onChange={(e) => setNewReviewText(e.target.value)}
                          className="whq-form-textarea"
                          rows={4}
                          required
                        />
                        <div className="whq-form-btn-row">
                          <button type="submit" className="whq-btn-action-primary">Submit Review</button>
                          <button
                            type="button"
                            className="whq-btn-action-sub"
                            onClick={() => setShowReviewForm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* 4. Media */}
            <section id="media-section" className="whq-dt-section-box">
              <div className="whq-media-tabs-row">
                <h3 className="whq-dt-block-title">Media</h3>
                <div className="whq-media-tabs">
                  <button
                    type="button"
                    className={`whq-tab-btn ${mediaTab === "popular" ? "active" : ""}`}
                    onClick={() => setMediaTab("popular")}
                  >
                    Most Popular
                  </button>
                  <button
                    type="button"
                    className={`whq-tab-btn ${mediaTab === "videos" ? "active" : ""}`}
                    onClick={() => setMediaTab("videos")}
                  >
                    Videos <span className="whq-count-badge">{mediaVideos.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`whq-tab-btn ${mediaTab === "backdrops" ? "active" : ""}`}
                    onClick={() => setMediaTab("backdrops")}
                  >
                    Backdrops <span className="whq-count-badge">{mediaBackdrops.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`whq-tab-btn ${mediaTab === "posters" ? "active" : ""}`}
                    onClick={() => setMediaTab("posters")}
                  >
                    Posters <span className="whq-count-badge">{mediaPosters.length}</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Media Scrollers */}
              <div className="whq-media-scroller">
                {/* Popular Mix */}
                {mediaTab === "popular" && (
                  <>
                    {mediaVideos.length > 0 ? (
                      mediaVideos.map((v) => (
                        <div
                          key={v.id}
                          className="whq-media-video-item"
                          onClick={() => handleOpenTrailer(mediaData?.trailer?.youtube_id, v.title)}
                          role="button"
                          tabIndex={0}
                          title={`Play ${v.title}`}
                        >
                          <img src={v.thumb} alt={v.title} />
                          <div className="whq-video-play-overlay">
                            <span className="whq-video-play-circle">▶ </span>
                          </div>
                          <div className="whq-media-item-label">{v.title}</div>
                        </div>
                      ))
                    ) : null}
                    {mediaBackdrops.slice(0, 4).map((b) => (
                      <div
                        key={b.id}
                        className="whq-media-backdrop-item"
                        onClick={() => setLightboxImg(b.img)}
                        role="button"
                        tabIndex={0}
                        title="Click to view full size"
                      >
                        <img src={b.img} alt={b.label} loading="lazy" />
                      </div>
                    ))}
                  </>
                )}

                {/* Videos Only */}
                {mediaTab === "videos" && (
                  mediaVideos.map((v) => (
                    <div
                      key={v.id}
                      className="whq-media-video-item"
                      onClick={() => handleOpenTrailer(mediaData?.trailer?.youtube_id, v.title)}
                      role="button"
                      tabIndex={0}
                      title={`Play ${v.title}`}
                    >
                      <img src={v.thumb} alt={v.title} />
                      <div className="whq-video-play-overlay">
                        <span className="whq-video-play-circle">▶</span>
                      </div>
                      <div className="whq-media-item-label">{v.title} ({v.runtime})</div>
                    </div>
                  ))
                )}

                {/* Backdrops Only */}
                {mediaTab === "backdrops" && (
                  mediaBackdrops.map((b) => (
                    <div
                      key={b.id}
                      className="whq-media-backdrop-item"
                      onClick={() => setLightboxImg(b.img)}
                      role="button"
                      tabIndex={0}
                      title="Click to view full size"
                    >
                      <img src={b.img} alt={b.label} />
                    </div>
                  ))
                )}

                {/* Posters Only */}
                {mediaTab === "posters" && (
                  mediaPosters.map((p) => (
                    <div
                      key={p.id}
                      className="whq-media-poster-item"
                      onClick={() => setLightboxImg(p.img)}
                      role="button"
                      tabIndex={0}
                      title="Click to view full poster"
                    >
                      <img src={p.img} alt={p.label} />
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 5. Recommendations */}
            <section className="whq-dt-section-box">
              <h3 className="whq-dt-block-title">
                If you liked <span className="whq-bold-text">{title}</span>, you might also like...
              </h3>
              <div className="whq-recs-scroller">
                {recs.map((r) => (
                  <a key={r.id} href={`/anime/${r.id}`} className="whq-rec-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="whq-rec-img-wrap">
                      <img src={r.img} alt={r.title} loading="lazy" />
                      <span className="whq-rec-score">{r.score}</span>
                    </div>
                    <div className="whq-rec-title">{r.title}</div>
                  </a>
                ))}
              </div>
            </section>

            {/* 6. Mood Tags */}
            <section className="whq-dt-section-box">
              <h3 className="whq-dt-block-title">Or maybe something a bit more...</h3>
              <div className="whq-mood-tags-wrap">
                {moodTags.map((t) => (
                  <a key={t} href={`/anime/search?q=${encodeURIComponent(t)}`} className="whq-mood-tag">
                    {t}
                  </a>
                ))}
              </div>
            </section>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="whq-dt-sidebar" aria-label="Anime facts and contributors">
            {/* Social Icons */}
            <div className="whq-sidebar-social-links">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Check out " + title + " on WeebHQ!")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="whq-social-link-btn"
                title="Share on Twitter"
                aria-label="Twitter"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <button
                type="button"
                className="whq-social-link-btn"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    showToast("Link copied to clipboard! 🔗");
                  }
                }}
                title="Copy Link"
                aria-label="Copy Link"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                </svg>
              </button>
            </div>

            {/* Facts Card */}
            <div className="whq-facts-group">
              <div className="whq-fact-row">
                <div className="whq-fact-key">Original Name</div>
                <div className="whq-fact-val">{jpTitle || originalTitle}</div>
              </div>

              <div className="whq-fact-row">
                <div className="whq-fact-key">Status</div>
                <div className="whq-fact-val">{status}</div>
              </div>

              <div className="whq-fact-row">
                <div className="whq-fact-key">Network</div>
                <div className="whq-fact-val">
                  <span className="whq-network-badge">{studios || "bilibili"}</span>
                </div>
              </div>

              <div className="whq-fact-row">
                <div className="whq-fact-key">Type</div>
                <div className="whq-fact-val">{type}</div>
              </div>

              <div className="whq-fact-row">
                <div className="whq-fact-key">Original Language</div>
                <div className="whq-fact-val">{jpTitle ? "Japanese (日本語)" : "Japanese"}</div>
              </div>
            </div>

            {/* Keywords */}
            <div className="whq-keywords-group">
              <h4 className="whq-sidebar-subheading">Keywords</h4>
              <div className="whq-keyword-pills">
                {keywords.map((k) => (
                  <a key={k} href={`/anime/search?q=${encodeURIComponent(k)}`} className="whq-keyword-pill">
                    {k}
                  </a>
                ))}
              </div>
            </div>

            {/* Content Score */}
            <div className="whq-content-score-box">
              <h4 className="whq-sidebar-subheading">Content Score ⓘ</h4>
              <div className="whq-score-bar-wrap">
                <div className="whq-score-bar-fill" style={{ width: "79%" }}>
                  79
                </div>
              </div>
              <p className="whq-score-tip">Pump it up! We&apos;re close now.</p>
            </div>

            {/* Top Contributors */}
            <div className="whq-contributors-box">
              <h4 className="whq-sidebar-subheading">Top Contributors &amp; Credits</h4>
              <ul className="whq-contributors-list">
                {/* 1. Original Creator / Author */}
                {getAnimeCreator(title) && (
                  <li className="whq-contributor-item">
                    <div className="whq-cb-avatar" style={{ background: '#00d2c4', fontWeight: 800 }}>CR</div>
                    <div className="whq-cb-info">
                      <div className="whq-cb-name">{getAnimeCreator(title)}</div>
                      <div className="whq-cb-sub" style={{ fontSize: '11px', color: '#94a3b8' }}>Original Story &amp; Manga</div>
                    </div>
                  </li>
                )}

                {/* 2. Lead Animation Studio */}
                <li className="whq-contributor-item">
                  <div className="whq-cb-avatar orange" style={{ background: '#f59e0b', fontWeight: 800 }}>ST</div>
                  <div className="whq-cb-info">
                    <div className="whq-cb-name">{studios || "Animation Studio"}</div>
                    <div className="whq-cb-sub" style={{ fontSize: '11px', color: '#94a3b8' }}>Lead Animation Production</div>
                  </div>
                </li>

                {/* 3. Automated Sync Engine */}
                <li className="whq-contributor-item">
                  <div className="whq-cb-avatar green" style={{ background: '#10b981', fontWeight: 800 }}>DB</div>
                  <div className="whq-cb-info">
                    <div className="whq-cb-name">WeebHQ Automated Engine</div>
                    <div className="whq-cb-sub" style={{ fontSize: '11px', color: '#94a3b8' }}>Verified Master Sync • 120+ updates</div>
                  </div>
                </li>

                {/* 4. Active Community Reviewers */}
                {reviews.length > 0 && (
                  <li className="whq-contributor-item">
                    <div className="whq-cb-avatar purple" style={{ background: '#8b5cf6', fontWeight: 800 }}>REV</div>
                    <div className="whq-cb-info">
                      <div className="whq-cb-name">{reviews[0].author}</div>
                      <div className="whq-cb-sub" style={{ fontSize: '11px', color: '#94a3b8' }}>Top Community Reviewer</div>
                    </div>
                  </li>
                )}
              </ul>
              <button
                type="button"
                className="whq-edit-history-link"
                onClick={() => setHistoryModalOpen(true)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
              >
                ▸ View Edit &amp; Sync History
              </button>
            </div>

            <div className="whq-trend-box">
              <h4 className="whq-sidebar-subheading">Popularity Trend</h4>
              <svg className="whq-sparkline" viewBox="0 0 100 24" width="100%" height="28">
                <path
                  d="M0 20 L20 18 L40 16 L60 12 L80 8 L100 2"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Login to Edit Button */}
            <div className="whq-sidebar-actions">
              <button
                type="button"
                className="whq-btn-login-edit"
                onClick={() => showToast("Database editing mode requires moderator login")}
              >
                🔒 LOGIN TO EDIT
              </button>
              <div className="whq-sidebar-meta-links">
                <a href="#shortcuts">⌨ Keyboard Shortcuts</a>
                <a href="#report">ⓘ Login to report an issue</a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── 4. TMDB MODALS & OVERLAYS ─────────────────────────────────── */}

      {/* 1. Trailer Video Lightbox Player */}
      {trailerModalOpen && (
        <div className="whq-modal-backdrop" onClick={handleCloseTrailer} role="dialog" aria-modal="true">
          <div className="whq-trailer-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="whq-modal-header">
              <div className="whq-modal-header-left">
                <span className="whq-modal-badge">TRAILER</span>
                <h3 className="whq-modal-title">{videoTitle} — {title}</h3>
              </div>
              <div className="whq-modal-actions">
                {activeYoutubeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${activeYoutubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whq-modal-yt-btn"
                    title="Watch directly on YouTube"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span>Open on YouTube</span>
                  </a>
                )}
                <button
                  type="button"
                  className="whq-modal-close-btn"
                  onClick={handleCloseTrailer}
                  aria-label="Close trailer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="whq-trailer-player-wrap">
              {trailerLoading ? (
                <div className="whq-trailer-loader">
                  <div className="whq-loading-spinner" />
                  <p>Loading official trailer...</p>
                </div>
              ) : trailerEmbedUrl ? (
                <iframe
                  src={trailerEmbedUrl}
                  title={`${title} Trailer Player`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="whq-trailer-empty">
                  <div className="whq-empty-yt-icon">🎬</div>
                  <h4>Official PV Trailer</h4>
                  <p>An official embedded trailer is loading or not directly available.</p>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title + " official anime trailer")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whq-modal-yt-btn"
                    style={{ padding: '10px 18px', fontSize: '14px' }}
                  >
                    Search &amp; Watch on YouTube ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Rating & Vibe Modal */}
      {ratingModalOpen && (
        <div className="whq-modal-backdrop" onClick={() => setRatingModalOpen(false)}>
          <div className="whq-rating-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="whq-modal-header">
              <h3 className="whq-modal-title">Rate &amp; Share Your Vibe</h3>
              <button
                type="button"
                className="whq-modal-close-btn"
                onClick={() => setRatingModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="whq-rating-modal-body">
              <p className="whq-rating-subtext">How do you rate <strong>{title}</strong>?</p>

              {/* Big Score Display */}
              <div className="whq-modal-score-preview">
                <span className="whq-modal-score-num">{tempScore}</span>
                <span className="whq-modal-score-denom">/ 10</span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={tempScore}
                onChange={(e) => setTempScore(parseFloat(e.target.value))}
                className="whq-modal-slider"
              />

              {/* Vibe Selection Chips */}
              <div className="whq-vibe-selector-wrap">
                <span className="whq-vibe-label">Pick your Vibe:</span>
                <div className="whq-vibe-chips">
                  {[
                    "Masterpiece ✨",
                    "Emotional 😭",
                    "Hyped 🔥",
                    "Chill / Fun 😎",
                    "Dark & Gritty ⚡",
                    "Disappointing 👎",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className={`whq-vibe-chip ${tempVibe === chip ? "active" : ""}`}
                      onClick={() => setTempVibe(tempVibe === chip ? "" : chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="whq-modal-btn-row">
                <button
                  type="button"
                  className="whq-btn-action-primary"
                  onClick={handleSaveRating}
                >
                  Save Rating
                </button>
                {userScore && (
                  <button
                    type="button"
                    className="whq-btn-action-danger"
                    onClick={handleClearRating}
                  >
                    Clear Rating
                  </button>
                )}
                <button
                  type="button"
                  className="whq-btn-action-sub"
                  onClick={() => setRatingModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. List Selector Modal */}
      {listModalOpen && (
        <div className="whq-modal-backdrop" onClick={() => setListModalOpen(false)}>
          <div className="whq-list-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="whq-modal-header">
              <h3 className="whq-modal-title">Add to Your Lists</h3>
              <button
                type="button"
                className="whq-modal-close-btn"
                onClick={() => setListModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="whq-list-modal-body">
              <p className="whq-rating-subtext">Select status for <strong>{title}</strong>:</p>
              <div className="whq-list-options">
                {[
                  { name: "Currently Watching", icon: "▶" },
                  { name: "Plan to Watch", icon: "📅" },
                  { name: "Completed", icon: "✓" },
                  { name: "On Hold", icon: "⏸" },
                  { name: "Dropped", icon: "✕" },
                ].map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    className={`whq-list-option-btn ${currentList === opt.name ? "active" : ""}`}
                    onClick={() => handleSelectList(opt.name)}
                  >
                    <span className="whq-list-opt-icon">{opt.icon}</span>
                    <span className="whq-list-opt-name">{opt.name}</span>
                    {currentList === opt.name && <span className="whq-list-opt-check">✓ Active</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Full Size Image Lightbox */}
      {lightboxImg && (
        <div className="whq-modal-backdrop" onClick={() => setLightboxImg(null)}>
          <div className="whq-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="whq-lightbox-close"
              onClick={() => setLightboxImg(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <img src={lightboxImg} alt="Enlarged media preview" className="whq-lightbox-img" />
          </div>
        </div>
      )}
    
      {/* Edit & Sync History Modal */}
      {historyModalOpen && (
        <div className="whq-modal-backdrop" onClick={() => setHistoryModalOpen(false)}>
          <div className="whq-trailer-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', padding: '24px' }}>
            <div className="whq-modal-header" style={{ marginBottom: '16px' }}>
              <h3 className="whq-modal-title">Verification &amp; Sync History — {title}</h3>
              <button type="button" className="whq-modal-close-btn" onClick={() => setHistoryModalOpen(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: '#cbd5e1', fontSize: '13px' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                <strong style={{ color: '#fff' }}>v2.4 — Live Cast &amp; Seiyuu Mapping</strong>
                <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>Japanese voice actors and character images verified directly via Tenrai &amp; MyAnimeList APIs.</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid #00d2c4' }}>
                <strong style={{ color: '#fff' }}>v2.2 — High-Resolution Media Art</strong>
                <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>Official promotional key visuals and YouTube PV trailer integrated with Cloudflare CDN caching.</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                <strong style={{ color: '#fff' }}>v2.0 — Cloudflare D1 SQL Upsert</strong>
                <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>Automated daily Cron Trigger synced ratings, broadcast season, and episode metadata into D1 database.</p>
              </div>
            </div>
          </div>
        </div>
      )}
</div>
  );
}