export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

export default function RecommendationDetail({ params }) {
  return (
    <div className="main-wrapper rec-detail-page">
      <div className="news-top-bar">
        <h2 className="news-section-title">Anime Recommendations</h2>
        <div className="breadcrumbs">
          Top &gt; Anime Recommendations &gt; Anime A and Anime B
        </div>
      </div>

      <div className="rec-detail-container">
        
        <div className="rec-anime-compare">
          <div className="rec-anime-card">
            <a href="/anime/1"><img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="Anime A"/></a>
            <div className="rec-anime-info">
              <h3><a href="/anime/1">Sousou no Frieren</a></h3>
              <p>Type: TV - 28 eps</p>
              <p>Score: <strong>9.34</strong></p>
            </div>
          </div>
          
          <div className="rec-arrow-big">
            If you liked this...<br/>
            <span>&rarr;</span><br/>
            ...then you might like
          </div>

          <div className="rec-anime-card">
            <a href="/anime/1"><img src="https://cdn.myanimelist.net/images/anime/1171/141703l.jpg" alt="Anime B"/></a>
            <div className="rec-anime-info">
              <h3><a href="/anime/1">Solo Leveling</a></h3>
              <p>Type: TV - 12 eps</p>
              <p>Score: <strong>8.33</strong></p>
            </div>
          </div>
        </div>

        <div className="rec-explanation-list">
          <div className="rec-header-text">Users who recommend this pair say:</div>
          
          <div className="rec-user-text">
            <div className="rec-user-meta">
              <a href="#">user123</a> - Yesterday
            </div>
            <p>Both shows feature incredible fantasy worlds with deep lore. While Frieren focuses more on the journey after the demon king is defeated and the passage of time, Solo Leveling is purely about getting stronger and action. However, the animation quality in both is top-tier and they both give you that satisfying feeling when the main character shows off their true power.</p>
          </div>
          
          <div className="rec-user-text">
            <div className="rec-user-meta">
              <a href="#">animefan99</a> - Jan 14, 2026
            </div>
            <p>The pacing is different but if you enjoy fantasy settings with magic systems, both are great watches. Definitely recommend both if you haven't seen them.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
