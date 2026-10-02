import Link from 'next/link';
import ClientAnimeLoader from './ClientAnimeLoader';

const fetchJikan = async (endpoint, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const url = `https://api.jikan.moe/v4${endpoint}`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
      if (res.status === 429) {
        console.warn(`[fetchJikan] 429 Rate Limit for ${endpoint}, retrying... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 1500 * (i + 1)));
        continue;
      }
      console.error(`[fetchJikan] Error ${res.status} for ${endpoint}`);
      return null;
    } catch (e) {
      console.error(`[fetchJikan] Exception for ${endpoint}:`, e);
      if (i === retries - 1) return null;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return null;
};

export async function generateStaticParams() {
  const topAiringRes = await fetchJikan('/top/anime?filter=airing&page=1&limit=5');
  const topUpcomingRes = await fetchJikan('/top/anime?filter=upcoming&page=1&limit=5');
  const seasonalRes = await fetchJikan('/seasons/now?page=1&limit=6');

  const ids = [];
  if (topAiringRes?.data) topAiringRes.data.forEach(a => ids.push(a.mal_id));
  if (topUpcomingRes?.data) topUpcomingRes.data.forEach(a => ids.push(a.mal_id));
  if (seasonalRes?.data) seasonalRes.data.forEach(a => ids.push(a.mal_id));

  ids.push('1'); // Fallback

  return [...new Set(ids)].map((id) => ({ id: id.toString() }));
}

export default async function AnimeDetail({ params }) {
  const { id } = await params;
  
  const animeRes = await fetchJikan(`/anime/${id}/full`);
  const anime = animeRes?.data;

  if (!anime) return <ClientAnimeLoader id={id} />;

  const title = anime.title;
  const enTitle = anime.title_english || title;
  const jpTitle = anime.title_japanese || title;
  const synopsis = anime.synopsis || "No synopsis available.";
  const img = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || "https://via.placeholder.com/225x320?text=No+Image";
  const score = anime.score ? anime.score.toFixed(2) : "N/A";
  const popularity = anime.popularity || "N/A";
  const members = anime.members ? anime.members.toLocaleString() : "N/A";
  const type = anime.type || "TV";
  const status = anime.status;
  const episodes = anime.episodes || "Unknown";
  const startDate = anime.aired?.from ? new Date(anime.aired.from).toLocaleDateString() : "?";
  const endDate = anime.aired?.to ? new Date(anime.aired.to).toLocaleDateString() : "?";

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

      <div style={{display: "flex", flexDirection: "column", '@media(minWidth: 768px)': {flexDirection: "row"}}}>
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
          <p className="synopsis-text" style={{whiteSpace: 'pre-wrap'}}>
            {synopsis}
          </p>

        </div>
      </div>
    </div>
  );
}
