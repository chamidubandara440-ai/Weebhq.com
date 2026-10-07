import { fetchAnimeForRecommendations, generateRecommendations } from "../../../lib/recommendations";

export default async function AnimeRecommendations() {
  const animeList = await fetchAnimeForRecommendations();
  // Generate more recommendations for the dedicated page
  const recommendations = generateRecommendations(animeList, 20);

  return (
    <div className="main-wrapper" style={{ display: "block" }}>
      <div className="news-top-bar" style={{marginBottom: 0}}>
        <h2 className="news-section-title">Latest Anime Recommendations</h2>
        <div className="breadcrumbs">Top &gt; Anime &gt; Anime Recommendations</div>
      </div>
      
      <div className="mal-videos-tabs">
        <span className="active">Anime Recommendations</span>
        <span className="disabled-tab" style={{color: "#888", cursor: "not-allowed"}}>Manga Recommendations</span>
        <span className="disabled-tab" style={{color: "#888", cursor: "not-allowed"}}>User Recs</span>
      </div>

      <div className="mal-rec-list" style={{paddingTop: "10px"}}>
        {recommendations.length === 0 ? (
          <div style={{padding: "20px", color: "#888", fontSize: "13px"}}>No recommendations available yet.</div>
        ) : recommendations.map(rec => {
          const src = rec.sourceAnime || {};
          const sug = rec.recommendedAnime || {};
          return (
            <div key={rec.id} className="mal-rec-item">
              <div className="mal-rec-top">
                <div className="mal-rec-half">
                  <a href={`/anime/${src.id}`}>
                    <img src={src.image_url} alt={src.title} className="mal-rec-img" loading="lazy" />
                  </a>
                  <div className="mal-rec-info">
                    <div className="mal-rec-label">If you liked</div>
                    <div className="mal-rec-title"><a href={`/anime/${src.id}`}>{src.title}</a></div>
                  </div>
                </div>

                <div className="mal-rec-half">
                  <a href={`/anime/${sug.id}`}>
                    <img src={sug.image_url} alt={sug.title} className="mal-rec-img" loading="lazy" />
                  </a>
                  <div className="mal-rec-info">
                    <div className="mal-rec-label">You might like</div>
                    <div className="mal-rec-title"><a href={`/anime/${sug.id}`}>{sug.title}</a></div>
                  </div>
                </div>
              </div>
              
              <div className="mal-rec-bottom">
                <div className="mal-rec-text">{rec.reason || "Recommended based on similar themes and quality."}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}