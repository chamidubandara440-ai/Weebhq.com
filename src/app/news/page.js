import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default function NewsIndex() {
  const dirPath = path.join(process.cwd(), 'content', 'news');
  let newsList = [];
  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      newsList = files.map(filename => {
        const fileContents = fs.readFileSync(path.join(dirPath, filename), 'utf8');
        const { data } = matter(fileContents);
        return {
          id: filename.replace('.md', ''),
          timestamp: data.published_at || data.id || "1970-01-01",
          title: data.title,
          date: data.date,
          snippet: data.snippet,
          img: data.img,
          author: "WeebHQ_News",
          comments: Math.floor(Math.random() * 20)
        };
      });
      newsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  } catch(e) {
    console.error("Failed to read news", e);
  }
  
  return (
    <div className="main-wrapper">
      <div className="left-col" style={{ width: '700px', flex: 'none' }}>
        <div className="news-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="news-section-title">Anime & Manga News</h2>
            <div className="breadcrumbs">Top &gt; News</div>
          </div>
          <button className="submit-news-btn">+ Submit news</button>
        </div>
        
        <div className="mal-news-tabs">
          <span className="active">All</span>
          <span>Anime</span>
          <span>Manga</span>
          <span>People</span>
          <span>Music</span>
          <span>Events</span>
          <span>Industry</span>
          <span className="all-tags-btn">All Tags</span>
        </div>

        <div className="mal-news-page-list">
          {newsList.map(news => (
            <div key={news.id} className="mal-news-page-item">
              <a href={`/news/${news.id}`}>
                <img src={news.img} alt={news.title} className="mal-news-page-img" />
              </a>
              <div className="mal-news-page-content">
                <div className="mal-news-page-title">
                  <a href={`/news/${news.id}`}>{news.title}</a>
                </div>
                <div className="mal-news-page-snippet">{news.snippet}</div>
                <div className="mal-news-page-footer">
                  {news.date} by <a href="#">{news.author}</a> | <a href="#">{news.comments} Comments</a>
                  <span className="mal-tag" style={{marginLeft: "10px"}}>Light Novels</span>
                  <span className="mal-tag-red">New Anime</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="right-col" style={{ flex: 1, minWidth: '300px' }}>
        <div className="side-header">Search News</div>
        <div className="sidebar-search">
          <input type="text" placeholder="Search News..." />
        </div>
        
        <div className="side-header" style={{marginTop: '20px'}}>
          <span>New Anime</span>
          <a href="#">More</a>
        </div>
        <div className="sidebar-news-list">
           {newsList.slice(0,4).map(news => (
             <div key={news.id} className="mal-news-item" style={{padding: '5px 0'}}>
                <img src={news.img} className="mal-news-img" style={{width:'40px', height:'40px'}}/>
                <div className="mal-news-content">
                  <div className="mal-news-title" style={{fontSize: '11px', marginBottom: '2px'}}><a href={`/news/${news.id}`}>{news.title}</a></div>
                  <div className="mal-news-footer" style={{fontSize: '9px'}}>{news.date} by <a href="#">{news.author}</a></div>
                </div>
             </div>
           ))}
        </div>
        
        <div className="side-header" style={{marginTop: '20px'}}>Trending Tags</div>
        <div className="trending-tags">
          <span className="mal-tag">New Anime</span>
          <span className="mal-tag">Review</span>
          <span className="mal-tag">Light Novels</span>
          <span className="mal-tag">Fall 2026</span>
          <span className="mal-tag">Summer 2026</span>
          <span className="mal-tag">Anime</span>
          <span className="mal-tag">Manga</span>
        </div>
      </div>
    </div>
  );
}
