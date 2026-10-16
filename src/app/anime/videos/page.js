"use client";

import { useState } from "react";

export default function AnimeVideos() {
  const [activeTab, setActiveTab] = useState("all");
  const [modalVideo, setModalVideo] = useState({ open: false, title: "", youtubeId: "" });

  const trailers = [
    {
      id: 1,
      title: "Sousou no Frieren",
      type: "pv",
      tag: "Official PV 5",
      vid: "ZEkwCGJ3o7M",
      img: "https://img.youtube.com/vi/ZEkwCGJ3o7M/hqdefault.jpg",
      animeUrl: "/anime/1",
    },
    {
      id: 2,
      title: "Re:ZERO -Starting Life in Another World- S4",
      type: "trailer",
      tag: "Official Trailer 2",
      vid: "jVl4bY81iIs",
      img: "https://img.youtube.com/vi/jVl4bY81iIs/hqdefault.jpg",
      animeUrl: "/anime/2",
    },
    {
      id: 9,
      title: "Chainsaw Man – The Movie: Reze Arc",
      type: "movie",
      tag: "Main Theatrical Trailer",
      vid: "pv8A7eubPQQ",
      img: "https://img.youtube.com/vi/pv8A7eubPQQ/hqdefault.jpg",
      animeUrl: "/anime/9",
    },
    {
      id: 7,
      title: "Attack on Titan: Final Season",
      type: "pv",
      tag: "Official Climax PV",
      vid: "hKHepjfj5Tw",
      img: "https://img.youtube.com/vi/hKHepjfj5Tw/hqdefault.jpg",
      animeUrl: "/anime/7",
    },
    {
      id: 5,
      title: "JoJo: Steel Ball Run",
      type: "pv",
      tag: "2nd Official Trailer",
      vid: "jXtG_lcR9P4",
      img: "https://img.youtube.com/vi/jXtG_lcR9P4/hqdefault.jpg",
      animeUrl: "/anime/5",
    },
    {
      id: 4,
      title: "Steins;Gate",
      type: "trailer",
      tag: "Broadcast Release PV",
      vid: "27OZc-ku6is",
      img: "https://img.youtube.com/vi/27OZc-ku6is/hqdefault.jpg",
      animeUrl: "/anime/4",
    },
    {
      id: 3,
      title: "Fullmetal Alchemist: Brotherhood",
      type: "trailer",
      tag: "Official Blu-ray Special PV",
      vid: "1ac3_YdSSy0",
      img: "https://img.youtube.com/vi/1ac3_YdSSy0/hqdefault.jpg",
      animeUrl: "/anime/3",
    },
    {
      id: 8,
      title: "Gintama: The Final",
      type: "movie",
      tag: "Official Movie Trailer",
      vid: "Zn1filVUyf8",
      img: "https://img.youtube.com/vi/Zn1filVUyf8/hqdefault.jpg",
      animeUrl: "/anime/8",
    },
    {
      id: 10,
      title: "Hunter x Hunter",
      type: "pv",
      tag: "Character Spotlight PV",
      vid: "D9iTQRB4XRk",
      img: "https://img.youtube.com/vi/D9iTQRB4XRk/hqdefault.jpg",
      animeUrl: "/anime/10",
    },
  ];

  const filtered = activeTab === "all" ? trailers : trailers.filter((t) => t.type === activeTab);

  return (
    <div className="main-wrapper" style={{ display: "block", maxWidth: "1240px", margin: "30px auto", padding: "0 20px" }}>
      <div className="news-top-bar" style={{ marginBottom: 15 }}>
        <h1 className="news-section-title" style={{ fontSize: "24px", color: "#ffffff", margin: 0 }}>Official Anime Trailers &amp; PVs</h1>
        <div className="breadcrumbs" style={{ color: "#94a3b8" }}>Top &gt; Watch Trailers</div>
      </div>

      <div className="mal-videos-tabs" style={{ display: "flex", gap: "10px", borderBottom: "1px solid #1e293b", paddingBottom: "10px", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          style={{
            background: activeTab === "all" ? "#01b4e4" : "#131b2e",
            color: activeTab === "all" ? "#032541" : "#cbd5e1",
            fontWeight: 700,
            border: "1px solid #1e293b",
            borderRadius: "20px",
            padding: "6px 18px",
            cursor: "pointer",
          }}
        >
          All Trailers ({trailers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pv")}
          style={{
            background: activeTab === "pv" ? "#01b4e4" : "#131b2e",
            color: activeTab === "pv" ? "#032541" : "#cbd5e1",
            fontWeight: 700,
            border: "1px solid #1e293b",
            borderRadius: "20px",
            padding: "6px 18px",
            cursor: "pointer",
          }}
        >
          Promotional Videos (PV)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("movie")}
          style={{
            background: activeTab === "movie" ? "#01b4e4" : "#131b2e",
            color: activeTab === "movie" ? "#032541" : "#cbd5e1",
            fontWeight: 700,
            border: "1px solid #1e293b",
            borderRadius: "20px",
            padding: "6px 18px",
            cursor: "pointer",
          }}
        >
          Movie Teasers
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {filtered.map((t) => (
          <div
            key={t.id + t.vid}
            onClick={() => setModalVideo({ open: true, title: `${t.tag} — ${t.title}`, youtubeId: t.vid })}
            role="button"
            tabIndex={0}
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              overflow: "hidden",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 210, 196, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", overflow: "hidden", background: "#0b1120" }}>
              <img
                src={t.img}
                alt={t.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  background: "rgba(3, 37, 65, 0.75)",
                  border: "2px solid #ffffff",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                }}
              >
                ▶
              </div>
              <span
                style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "8px",
                  background: "rgba(0,0,0,0.8)",
                  color: "#00d2c4",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                {t.tag}
              </span>
            </div>
            <div style={{ padding: "12px 14px" }}>
              <h3 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {t.title}
              </h3>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#94a3b8" }}>
                Official PV Trailer • HD
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Trailer Video Player Modal */}
      {modalVideo.open && (
        <div
          className="whq-modal-backdrop"
          onClick={() => setModalVideo({ open: false, title: "", youtubeId: "" })}
          role="dialog"
          aria-modal="true"
        >
          <div className="whq-trailer-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="whq-modal-header">
              <div className="whq-modal-header-left">
                <span className="whq-modal-badge">TRAILER</span>
                <h3 className="whq-modal-title">{modalVideo.title}</h3>
              </div>
              <div className="whq-modal-actions">
                <a
                  href={`https://www.youtube.com/watch?v=${modalVideo.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whq-modal-yt-btn"
                  title="Watch on YouTube"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>Open on YouTube</span>
                </a>
                <button
                  type="button"
                  className="whq-modal-close-btn"
                  onClick={() => setModalVideo({ open: false, title: "", youtubeId: "" })}
                  aria-label="Close trailer"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="whq-trailer-player-wrap">
              <iframe
                src={`https://www.youtube.com/embed/${modalVideo.youtubeId}?autoplay=1&enablejsapi=1&rel=0`}
                title={`${modalVideo.title} Player`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
