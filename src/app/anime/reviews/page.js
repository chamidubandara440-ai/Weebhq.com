import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default function AnimeReviews() {
  const dirPath = path.join(process.cwd(), 'content', 'reviews');
  let reviews = [];
  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      reviews = files.map(filename => {
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
      reviews.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    }
  } catch(e) {
    console.error("Failed to read reviews", e);
  }

  return (
    <div className="main-wrapper">
      <div className="news-top-bar">
        <h2 className="news-section-title">Latest Anime Reviews</h2>
        <div className="breadcrumbs">
          Top &gt; Anime &gt; Reviews
        </div>
      </div>
      <div style={{padding: '20px'}}>
        {reviews.length > 0 ? reviews.map(r => (
          <div key={r.id} className="news-card">
            <img src={r.img} alt={r.title} className="news-card-img" />
            <div className="news-card-info">
              <div className="news-card-time">{r.date}</div>
              <h3 className="news-card-title"><a href={`/reviews/${r.id}`}>{r.title}</a></h3>
              <p className="news-card-desc">{r.snippet}</p>
            </div>
          </div>
        )) : <p>No reviews found.</p>}
      </div>
    </div>
  );
}
