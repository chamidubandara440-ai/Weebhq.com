export default async function SeasonalAnime() {
  const query = `
  query {
    seasonal: Page(page: 1, perPage: 20) {
      media(type: ANIME, season: FALL, seasonYear: 2026, sort: POPULARITY_DESC) {
        id title { romaji english } coverImage { large } format episodes averageScore popularity description(asHtml: false)
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

  return (
    <div className="main-wrapper">
      <div className="news-top-bar">
        <h2 className="news-section-title">Fall 2026 Anime</h2>
        <div className="breadcrumbs">
          Top &gt; Anime &gt; Seasonal Anime
        </div>
      </div>
      <div style={{padding: '20px'}}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {seasonal.map(anime => (
            <div key={anime.id} className="ta-row" style={{flexDirection: 'column', padding: '10px', height: '100%'}}>
              <a href={`/anime/${anime.id}`}>
                <img src={anime.coverImage.large} alt={anime.title.english || anime.title.romaji} style={{width: '100%', height: '250px', objectFit: 'cover', borderRadius: '4px'}} />
              </a>
              <div style={{marginTop: '10px'}}>
                <h3 style={{fontSize: '14px', marginBottom: '5px'}}><a href={`/anime/${anime.id}`}>{anime.title.english || anime.title.romaji}</a></h3>
                <div style={{fontSize: '12px', color: '#666'}}>
                  {anime.format || 'TV'} • {anime.episodes ? `${anime.episodes} eps` : '? eps'} • Score: {anime.averageScore ? (anime.averageScore/10).toFixed(2) : 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
