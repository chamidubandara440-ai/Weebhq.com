import Link from 'next/link';
import ClientAnimeLoader from './ClientAnimeLoader';

const fetchAnilist = async (query, variables = {}) => {
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (e) {
    return null;
  }
};

export async function generateStaticParams() {
  const query = `
  query {
    airing: Page(page: 1, perPage: 5) { media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) { id } }
    upcoming: Page(page: 1, perPage: 5) { media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) { id } }
    seasonal: Page(page: 1, perPage: 6) { media(type: ANIME, season: FALL, seasonYear: 2026, sort: POPULARITY_DESC) { id } }
  }`;

  const data = await fetchAnilist(query);
  const ids = [];

  if (data?.airing?.media) data.airing.media.forEach(a => ids.push(a.id));
  if (data?.upcoming?.media) data.upcoming.media.forEach(a => ids.push(a.id));
  if (data?.seasonal?.media) data.seasonal.media.forEach(a => ids.push(a.id));

  ids.push('1'); // Fallback

  return [...new Set(ids)].map((id) => ({ id: id.toString() }));
}

export default async function AnimeDetail({ params }) {
  const { id } = await params;
  
  const query = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id title { romaji english native } description(asHtml: false)
      coverImage { extraLarge large } averageScore popularity format status episodes
      startDate { year month day } endDate { year month day }
    }
  }`;

  const data = await fetchAnilist(query, { id: parseInt(id) });
  const anime = data?.Media;

  if (!anime) return <ClientAnimeLoader id={id} />;

  const title = anime.title.english || anime.title.romaji;
  const enTitle = anime.title.english || anime.title.romaji;
  const jpTitle = anime.title.native || anime.title.romaji;
  const synopsis = anime.description || "No synopsis available.";
  const img = anime.coverImage.extraLarge || anime.coverImage.large;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(2) : "N/A";
  const popularity = anime.popularity || "N/A";
  const members = "N/A"; // AniList doesn't expose member count directly in this lightweight query, or it's called 'favourites' / 'stats'
  const type = anime.format || "TV";
  const status = anime.status;
  const episodes = anime.episodes || "Unknown";
  const startDate = anime.startDate?.year ? `${anime.startDate.year}-${anime.startDate.month}-${anime.startDate.day}` : "?";
  const endDate = anime.endDate?.year ? `${anime.endDate.year}-${anime.endDate.month}-${anime.endDate.day}` : "?";

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
