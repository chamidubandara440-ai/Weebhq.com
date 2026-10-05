export default async function SeasonalAnime() {
  let seasonal = [];
  try {
    let offset = 0;
    const limit = 50;
    let hasMore = true;
    let allRecords = [];

    while (hasMore && offset < 1000) {
      const res = await fetch(`https://weebhq-api.chamidubandara440.workers.dev/api/anime?limit=${limit}&offset=${offset}`, {
        next: { revalidate: 3600 }
      });
      if (!res.ok) break;
      const json = await res.json();
      const rawData = json.data || [];
      if (rawData.length === 0) {
        hasMore = false;
      } else {
        allRecords.push(...rawData);
        offset += limit;
        if (rawData.length < limit) {
          hasMore = false;
        }
      }
    }
    
    seasonal = allRecords.filter(a => a.season && a.season.toLowerCase() === 'fall' && a.season_year === 2026);
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
          const title = anime.title_english || anime.title;
          const subTitle = anime.title_english ? anime.title : "";
          const score = anime.score != null ? anime.score.toFixed(2) : 'N/A';
          const members = formatMembers(anime.members);
          let dateStr = 'TBA';
          if (anime.start_date) {
             const parts = anime.start_date.split('-');
             if (parts.length >= 3) {
                 dateStr = `${getMonthName(parseInt(parts[1]))} ${parts[2]}, ${parts[0]}`;
             } else {
                 dateStr = anime.start_date;
             }
          }
          const epsStr = anime.episodes ? `${anime.episodes} eps` : '? eps';
          const studio = anime.studios || "Unknown";
          
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
              </div>
              
              <div className="mal-season-card-body">
                <a href={`/anime/${anime.id}`}>
                  <img src={anime.image_url} alt={title} className="mal-season-card-img" />
                </a>
                <div className="mal-season-card-desc-box">
                  <p className="mal-season-card-desc">{anime.synopsis ? anime.synopsis.substring(0, 120) + "..." : "No description available."}</p>
                  <div className="mal-season-card-studio">Studio: <span>{studio}</span></div>
                </div>
              </div>
              
              <div className="mal-season-card-footer">
                <div className="mal-season-stats">
                  <span>★ {score}</span>
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