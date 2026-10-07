import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

export default function RecommendationsCategory() {
  const dirPath = path.join(process.cwd(), 'content', 'articles', 'latest-anime-recommendations');
  let articles = [];

  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      articles = files.map(filename => {
        const content = fs.readFileSync(path.join(dirPath, filename), 'utf8');
        const { data } = matter(content);
        return { ...data, slug: data.slug || filename.replace('.md', '') };
      });
      articles.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
    }
  } catch (e) {
    console.error("Failed to load recommendation articles:", e);
  }

  return (
    <div className="main-wrapper" style={{ display: 'block' }}>
      <div className="news-top-bar" style={{ marginBottom: 0 }}>
        <h2 className="news-section-title">Latest Anime Recommendations</h2>
        <div className="breadcrumbs">
          <Link href="/">Top</Link> &gt; Latest Anime Recommendations
        </div>
      </div>

      <div className="mal-videos-tabs">
        <span className="active">Latest Articles</span>
      </div>

      <div className="mal-rec-list" style={{ paddingTop: '20px' }}>
        {articles.length === 0 ? (
          <div style={{ padding: '20px', color: '#888' }}>No recommendation articles found.</div>
        ) : (
          articles.map(article => (
            <div key={article.slug} className="mal-rec-item" style={{display: "block", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "20px"}}>
              <div style={{display: "flex", gap: "15px"}}>
                {article.cover_image && (
                  <Link href={`/articles/latest-anime-recommendations/${article.slug}`}>
                    <img src={article.cover_image} alt={article.title} style={{width: "150px", height: "auto", objectFit: "cover"}} />
                  </Link>
                )}
                <div style={{flex: 1}}>
                  <h3 style={{marginTop: 0, fontSize: "16px"}}>
                    <Link href={`/articles/latest-anime-recommendations/${article.slug}`} style={{color: "var(--mal-blue)", textDecoration: "none"}}>
                      {article.title}
                    </Link>
                  </h3>
                  <div style={{color: "#888", fontSize: "12px", marginBottom: "10px"}}>
                    {new Date(article.published_at).toLocaleDateString()}
                  </div>
                  <div style={{fontSize: "13px", color: "#ccc"}}>
                    {article.reason}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}