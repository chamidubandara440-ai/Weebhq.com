export default function AnimeVideos() {
  const trailers = [
    { title: "Solo Leveling Season 2 Trailer", vid: "7J0J_0n1T_Y" },
    { title: "Demon Slayer Infinity Castle Arc", vid: "z9lX5o0iYEE" },
    { title: "Re:Zero Season 3 Trailer", vid: "Vj6_P3z3NHE" },
    { title: "Bleach TYBW Part 3", vid: "M6_xG_s8uNw" },
    { title: "Dandadan Official Trailer", vid: "x3OZb7nK-H4" },
    { title: "Blue Lock Season 2", vid: "2h09YlCq420" }
  ];

  return (
    <div className="main-wrapper">
      <div className="news-top-bar">
        <h2 className="news-section-title">Latest Anime Videos & Trailers</h2>
        <div className="breadcrumbs">
          Top &gt; Anime &gt; Videos
        </div>
      </div>
      <div style={{padding: '20px'}}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {trailers.map((t, i) => (
            <div key={i} style={{backgroundColor: 'var(--mal-bg-darker)', padding: '10px', borderRadius: '4px'}}>
              <h3 style={{fontSize: '14px', marginBottom: '10px'}}>{t.title}</h3>
              <div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden'}}>
                <iframe 
                  style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
                  src={`https://www.youtube.com/embed/${t.vid}`} 
                  title={t.title} 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
