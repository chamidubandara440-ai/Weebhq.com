import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default function AnimeRecommendations() {
  const dirPath = path.join(process.cwd(), 'content', 'recommendations');
  let recommendations = [];
  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      recommendations = files.map(filename => {
        const fileContents = fs.readFileSync(path.join(dirPath, filename), 'utf8');
        const { data } = matter(fileContents);
        return {
          id: filename.replace('.md', ''),
          timestamp: data.id || "0",
          sourceTitle: data.title.split(" & ")[0] || data.title,
          sourceImg: data.img,
          sourceId: 1,
          recTitle: data.title.split(" & ")[1] || "Recommended Anime",
          recImg: data.img,
          recId: 2,
          text: data.snippet,
          user: "anonymous",
          date: data.date
        };
      });
      recommendations.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    }
  } catch(e) {
    console.error("Failed to read recommendations", e);
  }

  if (recommendations.length === 0) {
    recommendations = [
      { id: 1, sourceTitle: "Yondemasu yo, Azazel-san. (TV)", sourceImg: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx10216-O1y8q69Z3z2D.jpg", recTitle: "Yani Neko", recImg: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx164987-a2k6s9z2B7dO.jpg", text: "Relentless satire deterring normies and hypocrites.", user: "naverar", date: "1 hour ago" },
      { id: 2, sourceTitle: "Sousou no Frieren", sourceImg: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx154587-2q1q2Q9X2X2z.png", recTitle: "Kimi ga Shinu made Koi wo Shitai", recImg: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx101689-1Y0K1y5lZ8D6.png", text: "Both stories are about long-living creature discovering feeling", user: "PlanetXX2", date: "2 hours ago" },
      { id: 3, sourceTitle: "Re:Zero kara Hajimeru Isekai Seikatsu", sourceImg: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx21355-6X4Z9z3R8a7c.jpg", recTitle: "Summertime Render", recImg: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx129201-1K1a4e1w1F7a.jpg", text: "similar synopsis", user: "whitenigger522", date: "3 hours ago" }
    ];
  }

  return (
    <div className="main-wrapper" style={{ display: 'block' }}>
      <div className="news-top-bar" style={{marginBottom: 0}}>
        <h2 className="news-section-title">Anime Recommendations</h2>
        <div className="breadcrumbs">Top &gt; Anime &gt; Anime Recommendations</div>
      </div>
      
      <div className="mal-videos-tabs">
        <span className="active">Anime Recommendations</span>
        <span>Manga Recommendations</span>
        <span>User Recs</span>
      </div>

      <div className="mal-rec-list" style={{paddingTop: "10px"}}>
        {recommendations.map(rec => (
          <div key={rec.id} className="mal-rec-item">
            <div className="mal-rec-top">
              
              <div className="mal-rec-half">
                <a href={`/anime/${rec.sourceId || 1}`}>
                  <img src={rec.sourceImg} alt={rec.sourceTitle} className="mal-rec-img" />
                </a>
                <div className="mal-rec-info">
                  <div className="mal-rec-label">If you liked</div>
                  <div className="mal-rec-title"><a href={`/anime/${rec.sourceId || 1}`}>{rec.sourceTitle}</a></div>
                  <span className="mal-review-add">add</span>
                </div>
              </div>

              <div className="mal-rec-half">
                <a href={`/anime/${rec.recId || 1}`}>
                  <img src={rec.recImg} alt={rec.recTitle} className="mal-rec-img" />
                </a>
                <div className="mal-rec-info">
                  <div className="mal-rec-label">...then you might like</div>
                  <div className="mal-rec-title"><a href={`/anime/${rec.recId || 1}`}>{rec.recTitle}</a></div>
                  <span className="mal-review-add">add</span>
                </div>
              </div>

            </div>
            
            <div className="mal-rec-bottom" style={{display: "flex", justifyContent: "space-between"}}>
              <div>
                <div className="mal-rec-text">{rec.text}</div>
                <div className="mal-rec-footer">
                  Anime rec by <a href="#">{rec.user || 'anonymous'}</a> - {rec.date || '3 hours ago'}
                </div>
              </div>
              <a href="#" style={{fontSize: "11px", color: "var(--mal-link)"}}>report</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
