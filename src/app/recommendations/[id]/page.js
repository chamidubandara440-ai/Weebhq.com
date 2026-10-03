import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

export function generateStaticParams() {
  const recDir = path.join(process.cwd(), 'content', 'recommendations');
  let ids = [];
  try {
    if (fs.existsSync(recDir)) {
      const files = fs.readdirSync(recDir).filter(f => f.endsWith('.md'));
      ids = files.map(filename => ({ id: filename.replace('.md', '') }));
    }
  } catch(e) {}
  
  if (ids.length === 0) ids.push({ id: '1' });
  return ids;
}

export default async function RecommendationDetail({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const recDir = path.join(process.cwd(), 'content', 'recommendations');
  const filePath = path.join(recDir, `${id}.md`);
  
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

  if (!article) {
    return <div className="main-wrapper" style={{padding: '20px'}}>Recommendation not found</div>;
  }

  return (
    <div className="main-wrapper rec-detail-page">
      <div className="news-top-bar">
        <h2 className="news-section-title">Anime Recommendations</h2>
        <div className="breadcrumbs">
          Top &gt; Anime Recommendations &gt; {article.title}
        </div>
      </div>

      <div className="rec-detail-container" style={{padding: '20px'}}>
        <h1 style={{marginBottom: '15px'}}>{article.title}</h1>
        <div style={{color: '#666', fontSize: '12px', marginBottom: '20px'}}>
          Published on {article.date}
        </div>
        
        <div className="news-tags" style={{marginBottom: '20px'}}>
          {article.tags && article.tags.map((tag, i) => (
            <a key={i} href="#" className="tag-pill">{tag}</a>
          ))}
        </div>

        <div className="markdown-content" style={{lineHeight: '1.6'}} dangerouslySetInnerHTML={{ __html: article.fullText }} />
      </div>
    </div>
  );
}
