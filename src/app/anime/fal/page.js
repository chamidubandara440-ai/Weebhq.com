export default function FAL() {
  return (
    <div className="main-wrapper">
      <div className="news-top-bar">
        <h2 className="news-section-title">Fantasy Anime League (FAL)</h2>
        <div className="breadcrumbs">
          Top &gt; Anime &gt; FAL
        </div>
      </div>
      <div style={{padding: '20px', lineHeight: '1.6'}}>
        <h3>Welcome to the Fantasy Anime League!</h3>
        <p>Pick your favorite airing anime each season and compete with the community. Points are awarded based on popularity, score, and viewer retention.</p>
        
        <div style={{backgroundColor: 'var(--mal-bg-darker)', padding: '15px', borderRadius: '4px', marginTop: '20px'}}>
          <h4 style={{marginBottom: '10px', color: 'var(--mal-blue)'}}>Current Season: Fall 2026</h4>
          <p>Registration is currently OPEN. Draft your 5 active anime before the season officially starts!</p>
        </div>
        
        <button className="btn-add" style={{marginTop: '20px', padding: '10px 20px', fontSize: '14px'}}>Draft Team</button>
      </div>
    </div>
  );
}
