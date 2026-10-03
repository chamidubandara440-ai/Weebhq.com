export default async function SeasonalAnime() {
  const query = `
  query {
    seasonal: Page(page: 1, perPage: 20) {
      media(type: ANIME, season: FALL, seasonYear: 2026, sort: POPULARITY_DESC) {
        id title { romaji english } coverImage { large } format episodes averageScore popularity description(asHtml: false) genres startDate { year month day } studios(isMain: true) { nodes { name } }
      }
    }
  }`;

  let seasonal = [];
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 }
    });
    if (res.ok) {
      const json = await res.json();
      seasonal = json.data.seasonal.media;
    }
  } catch (e) {
    console.error("Failed to fetch seasonal anime", e);
  }

  const formatMembers = (num) => {
    if (!num) return "0";
    if (num >= 1000) return (num / 1000).toFixed(0) + "K";
    return num.toString();
  };

  const getMonthName = (m) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return m ? months[m-1] : "??";
  };

  return (
    <div className="main-wrapper" style={{ display: 'block' }}>
      <div className="news-top-bar" style={{marginBottom: 0, paddingBottom: "10px"}}>
        <h2 className="news-section-title">Seasonal Anime</h2>
        <div className="breadcrumbs">Top &gt; Anime &gt; Seasonal Anime</div>
      </div>
      
      <div className="mal-season-nav">
        <a href="#">...</a>
        <a href="#">Summer 2026</a>
        <a href="#" className="active">Fall 2026</a>
        <a href="#">Winter 2027</a>
        <a href="#">Spring 2027</a>
        <a href="#">Later</a>
        <a href="#">Schedule</a>
        <a href="#">Archive</a>
      </div>
      <div className="mal-season-filter">
        <div className="mal-season-filter-types">
          <span className="active">All</span>
          <span>TV</span>
          <span>ONA</span>
          <span>OVA</span>
          <span>Movie</span>
          <span>Special</span>
        </div>
      </div>

      <div className="mal-season-header">TV (New)</div>
      
      <div className="mal-season-grid">
        {seasonal.map(anime => {
          const title = anime.title.english || anime.title.romaji;
          const subTitle = anime.title.english ? anime.title.romaji : "";
          const score = anime.averageScore ? (anime.averageScore/10).toFixed(2) : 'N/A';
          const members = formatMembers(anime.popularity);
          const dateStr = anime.startDate && anime.startDate.year ? `${getMonthName(anime.startDate.month)} ${anime.startDate.day || '?'}, ${anime.startDate.year}` : 'TBA';
          const epsStr = anime.episodes ? `${anime.episodes} eps` : '? eps';
          const studio = anime.studios?.nodes?.[0]?.name || "Unknown";
          
          return (
            <div key={anime.id} className="mal-season-card">
              <div className="mal-season-card-title">
                <a href={`/anime/${anime.id}`}>{title}</a>
                {subTitle && <div className="mal-season-card-subtitle">{subTitle}</div>}
              </div>
              
              <div className="mal-season-card-meta">
                <span className="pv-btn">PV</span>
                <span className="date-text">{dateStr}</span>
                <span className="eps-text">{epsStr}, 24 min</span>
              </div>
              
              <div className="mal-season-card-genres">
                {(anime.genres || []).slice(0, 3).map(g => <span key={g}>{g}</span>)}
              </div>
              
              <div className="mal-season-card-body">
                <a href={`/anime/${anime.id}`}>
                  <img src={anime.coverImage.large} alt={title} className="mal-season-card-img" />
                </a>
                <div className="mal-season-card-desc-box">
                  <p className="mal-season-card-desc">{anime.description ? anime.description.substring(0, 120) + "..." : "No description available."}</p>
                  <div className="mal-season-card-studio">Studio: <span>{studio}</span></div>
                </div>
              </div>
              
              <div className="mal-season-card-footer">
                <div className="mal-season-stats">
                  <span>⭐ {score}</span>
                  <span>👤 {members}</span>
                </div>
                <button className="mal-season-add-btn">Add to My List</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
