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
          title: data.title,
          date: data.date,
          snippet: data.snippet,
          img: data.img
        };
      });
      recommendations.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    }
  } catch(e) {
    console.error("Failed to read recommendations", e);
  }

  return (
    <div className="main-wrapper">
      <div className="news-top-bar">
        <h2 className="news-section-title">Anime Recommendations</h2>
        <div className="breadcrumbs">
          Top &gt; Anime &gt; Recommendations
        </div>
      </div>
      <div style={{padding: '20px'}}>
        {recommendations.length > 0 ? recommendations.map(r => (
          <div key={r.id} className="news-card">
            <img src={r.img} alt={r.title} className="news-card-img" />
            <div className="news-card-info">
              <div className="news-card-time">{r.date}</div>
              <h3 className="news-card-title"><a href={`/recommendations/${r.id}`}>{r.title}</a></h3>
              <p className="news-card-desc">{r.snippet}</p>
            </div>
          </div>
        )) : <p>No recommendations found.</p>}
      </div>
    </div>
  );
}
