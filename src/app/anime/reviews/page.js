import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default function AnimeReviews() {
  const dirPath = path.join(process.cwd(), 'content', 'reviews');
  let reviewsList = [];
  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      reviewsList = files.map(filename => {
        const fileContents = fs.readFileSync(path.join(dirPath, filename), 'utf8');
        const { data } = matter(fileContents);
        return {
          id: filename.replace('.md', ''),
          timestamp: data.id || "0",
          title: data.title || "Anime Title",
          date: data.date || "Today",
          snippet: data.snippet || "A great review.",
          img: data.img || "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx154587-2q1q2Q9X2X2z.png",
          score: data.score || 9,
          user: data.author || "WeebHQ_User"
        };
      });
      reviewsList.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    }
  } catch(e) {
    console.error("Failed to read reviews", e);
  }

    // Show only real articles - no duplication
  if (reviewsList.length === 0) {
      reviewsList = [];
  }


  return (
    <div className="main-wrapper">
      <div className="left-col" style={{ width: '700px', flex: 'none' }}>
        <div className="news-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="news-section-title">Anime Reviews</h2>
            <div className="breadcrumbs">Top &gt; Anime &gt; Reviews</div>
          </div>
          <button className="submit-news-btn">+ Write Review</button>
        </div>
        
        <div className="mal-news-tabs">
          <span className="active">All Reviews</span>
          <span>Anime Reviews</span>
          <span>Manga Reviews</span>
          <span>Best Reviews</span>
        </div>

        <div className="mal-review-page-list" style={{ marginTop: '10px' }}>
          {reviewsList.map(item => (
            <div key={item.id} className="mal-review-item" style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'var(--mal-bg-darker)', border: '1px solid var(--mal-border)' }}>
              <a href={`/reviews/${item.id}`}>
                <img src={item.img} alt={item.title} className="mal-review-img" style={{ width: '80px', height: '115px' }} />
              </a>
              <div className="mal-review-content" style={{ flex: 1 }}>
                <div className="mal-review-header" style={{ borderBottom: '1px solid var(--mal-border)', paddingBottom: '5px', marginBottom: '5px' }}>
                  <div className="mal-review-title">
                    <a href={`/reviews/${item.id}`} style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.title}</a>
                    <span className="mal-review-add" style={{ marginLeft: '10px' }}>add</span>
                  </div>
                  <div className="mal-review-score">Overall Rating: <strong>{item.score}</strong></div>
                </div>
                <div className="mal-review-body" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  {item.snippet} <a href="#" style={{ color: 'var(--mal-link)' }}>read more</a>
                </div>
                <div className="mal-review-footer" style={{ marginTop: '10px', fontSize: '11px' }}>
                  {item.date} by <a href="#" style={{ color: 'var(--mal-link)' }}>{item.user}</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
            <div className="right-col" style={{ flex: 1, minWidth: '300px' }}>
        <div className="side-header">Search Reviews</div>
        <div className="sidebar-search">
          <input type="text" placeholder="Search Reviews..." style={{ width: '100%', padding: '5px', backgroundColor: 'var(--mal-bg-darker)', border: '1px solid var(--mal-border)', color: 'var(--mal-text)' }} />
        </div>

        <div className="side-header" style={{marginTop: '20px'}}>
          <span>Community Features</span>
        </div>
        <div style={{ padding: '20px', backgroundColor: 'var(--mal-bg-darker)', border: '1px solid var(--mal-border)', textAlign: 'center', borderRadius: '4px' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>🚧</div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--mal-text)', marginBottom: '6px' }}>Coming Soon</div>
          <div style={{ fontSize: '11px', color: 'var(--mal-text-muted, #888)', lineHeight: '1.5' }}>
            Community reviews, top reviewers, and user rankings are coming soon to WeebHQ.
          </div>
        </div>
      </div>
    </div>
  );
}

