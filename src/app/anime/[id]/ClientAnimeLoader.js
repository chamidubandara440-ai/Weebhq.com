'use client';
import { useEffect, useState } from 'react';

export default function ClientAnimeLoader({ id }) {
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('https://weebhq-api.chamidubandara440.workers.dev/api/anime/' + id)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(json => {
        if (json && !json.error) {
          setAnime(json);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="main-wrapper" style={{padding: '20px'}}>Loading Anime Data...</div>;
  if (error || !anime) return <div className="main-wrapper" style={{padding: '20px'}}>Anime not found</div>;

  const title = anime.title_english || anime.title;
  const enTitle = anime.title_english || anime.title;
  const jpTitle = anime.title_japanese || anime.title;
  const synopsis = anime.synopsis || "No synopsis available.";
  const img = anime.image_url;
  const score = anime.score != null ? anime.score.toFixed(2) : "N/A";
  const popularity = anime.popularity || "N/A";
  const members = anime.members ? anime.members.toLocaleString() : "N/A";
  const type = anime.anime_type || "TV";
  const status = anime.status || "Unknown";
  const episodes = anime.episodes || "Unknown";
  const startDate = anime.start_date || "?";
  const endDate = anime.end_date || "?";

  return (
    <div className="main-wrapper anime-detail-page">
      <h1 className="anime-title-h1">
        <strong>{title}</strong>
        <span style={{fontSize: "12px", color: "#888", fontWeight: "normal", display: "block", marginTop: "2px"}}>{enTitle}</span>
      </h1>
      
      <div className="anime-tabs">
        <a href="#" className="active">Details</a>
        <a href="#">Characters & Staff</a>
        <a href="#">Episodes</a>
        <a href="#">Videos</a>
        <a href="#">Stats</a>
        <a href="#">Reviews</a>
        <a href="#">Recommendations</a>
        <a href="#">News</a>
      </div>

      <div className="anime-detail-container">
        {/* Left Sidebar */}
        <div className="anime-left-col">
          <img src={img} alt="Poster" className="anime-poster" />
          <button className="add-list-btn notify-btn" style={{backgroundColor: "#2e51a2", borderColor: "#1d439b", marginBottom: "5px"}}>Notify me when it starts!</button>
          
          <div className="left-actions">
            <a href="#">Add to My List</a>
            <a href="#">Add to Favorites</a>
          </div>
          
          <div className="anime-info-block">
            <h2>Alternative Titles</h2>
            <div className="info-item"><span className="dark-label">English:</span> {enTitle}</div>
            <div className="info-item"><span className="dark-label">Japanese:</span> {jpTitle}</div>
            
            <h2>Information</h2>
            <div className="info-item"><span className="dark-label">Type:</span> <a href="#">{type}</a></div>
            <div className="info-item"><span className="dark-label">Episodes:</span> {episodes}</div>
            <div className="info-item"><span className="dark-label">Status:</span> {status}</div>
            <div className="info-item"><span className="dark-label">Aired:</span> {startDate} to {endDate}</div>
            
            <h2>Statistics</h2>
            <div className="info-item"><span className="dark-label">Score:</span> {score}</div>
            <div className="info-item"><span className="dark-label">Popularity:</span> #{popularity}</div>
            <div className="info-item"><span className="dark-label">Members:</span> {members}</div>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="anime-right-col">
          <div className="stats-banner">
            <div className="score-box">
              <div className="score-label">SCORE</div>
              <div className="score-value">{score}</div>
              <div className="score-users">{members} users</div>
            </div>
            <div className="other-stats">
              <div className="stat-row">
                <span className="stat-item">Popularity <strong>#{popularity}</strong></span>
                <span className="stat-item">Members <strong>{members}</strong></span>
              </div>
              <div className="stat-subrow">
                <span>{type}</span>
              </div>
            </div>
          </div>
          
          <h2>Synopsis</h2>
          <div className="synopsis-text" style={{whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{ __html: synopsis }} />

        </div>
      </div>
    </div>
  );
}