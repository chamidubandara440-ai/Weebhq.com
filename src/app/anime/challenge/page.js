export default function AnimeChallenge() {
  return (
    <div className="main-wrapper">
      <div className="news-top-bar">
        <h2 className="news-section-title">2026 Anime Watching Challenge</h2>
        <div className="breadcrumbs">
          Top &gt; Anime &gt; 2026 Challenge
        </div>
      </div>
      <div style={{padding: '20px', lineHeight: '1.6'}}>
        <h3>Join the Ultimate Anime Challenge for 2026!</h3>
        <p>Challenge yourself to watch a diverse range of anime this year. Complete all blocks to earn a special profile badge!</p>
        
        <div style={{backgroundColor: 'var(--mal-bg-darker)', padding: '15px', borderRadius: '4px', marginTop: '20px'}}>
          <h4 style={{marginBottom: '10px', color: 'var(--mal-blue)'}}>Rules:</h4>
          <ul style={{listStylePosition: 'inside'}}>
            <li>Watch an anime that aired in the 1980s.</li>
            <li>Watch a movie that won an award.</li>
            <li>Watch an anime with fewer than 13 episodes.</li>
            <li>Watch a sports anime.</li>
            <li>Watch an anime recommended by a friend on WeebHQ.</li>
          </ul>
        </div>
        
        <button className="btn-add" style={{marginTop: '20px', padding: '10px 20px', fontSize: '14px'}}>Join Challenge</button>
      </div>
    </div>
  );
}
