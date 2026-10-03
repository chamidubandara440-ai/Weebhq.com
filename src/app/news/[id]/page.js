import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

export function generateStaticParams() {
  const newsDir = path.join(process.cwd(), 'content', 'news');
  let ids = [];
  try {
    if (fs.existsSync(newsDir)) {
      const files = fs.readdirSync(newsDir).filter(f => f.endsWith('.md'));
      ids = files.map(filename => ({ id: filename.replace('.md', '') }));
    }
  } catch(e) {}
  
  if (ids.length === 0) ids.push({ id: '1' }); // Fallback to prevent build errors
  return ids;
}

export default async function NewsDetail({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const newsDir = path.join(process.cwd(), 'content', 'news');
  const filePath = path.join(newsDir, `${id}.md`);
  
  let article = null;
  let htmlContent = "";

  try {
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);
      htmlContent = marked.parse(content);
      
      article = {
        title: data.title,
        date: data.date,
        img: data.img,
        tags: data.tags || [],
        fullText: htmlContent
      };
    }
  } catch(e) {
    console.error("Failed to read markdown file", e);
  }

  // Temporary fallback if no markdown files exist yet
  if (!article) {
    article = {
      title: "Sample Anime News",
      date: "Oct 2026",
      img: "https://media.kitsu.app/anime/poster_images/12/large.jpg",
      tags: [],
      fullText: "<p>Check back later for exciting anime news!</p>"
    };
  }

  return (
    <div className="main-wrapper news-detail-page">
      
      {/* Top Breadcrumb Bar */}
      <div className="news-top-bar">
        <h2 className="news-section-title">Anime & Manga News</h2>
        <div className="breadcrumbs">
          Top &gt; News &gt; {article.title}
        </div>
      </div>

      <div style={{display: "flex", flexDirection: "column", '@media(minWidth: 768px)': {flexDirection: "row"}}}>
        
        {/* Left Main Content */}
        <div className="news-main-col" style={{width: '100%', flexGrow: 1}}>
          <h1 className="news-headline">{article.title}</h1>
          
          <div className="news-meta-bar">
            <div className="news-author-info">
              by <a href="#">WeebHQ AI</a><br/>
              <span>{article.date} | <a href="#">0 comments</a></span>
            </div>
            <div className="news-socials">
              <a href="#">F</a> <a href="#">X</a> <a href="#">R</a> <a href="#">T</a>
            </div>
          </div>
          
          <div className="news-content-body" style={{minHeight: '400px'}}>
            <img src={article.img} alt="News Image" className="news-float-img" />
            
            <div style={{fontSize: '14px', lineHeight: '1.6'}} dangerouslySetInnerHTML={{ __html: article.fullText || `<p>${article.snippet}</p>` }} />
          </div>
          
          <div className="news-tags">
            {article.tags && article.tags.map((tag, i) => (
              <a key={i} href="#" className="tag-pill">{tag}</a>
            ))}
          </div>

          <div className="news-comments-section">
            <div className="comments-header">
              <h3>Recent Comments</h3>
              <a href="#">0 Comments</a>
            </div>
            <p style={{padding: '10px', fontSize: '11px', color: '#666'}}>Be the first to comment on this news!</p>
          </div>

        </div>

      </div>
    </div>
  );
}
