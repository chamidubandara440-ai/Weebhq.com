import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export function generateStaticParams() {
  const dirPath = path.join(process.cwd(), 'content', 'articles', 'latest-anime-recommendations');
  if (!fs.existsSync(dirPath)) return [{ slug: 'placeholder' }];
  
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
  if (files.length === 0) return [{ slug: 'placeholder' }];
  
  return files.map(f => ({ slug: f.replace('.md', '') }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  if (slug === 'placeholder') return { title: 'Not Found' };
  
  const filePath = path.join(process.cwd(), 'content', 'articles', 'latest-anime-recommendations', `${slug}.md`);
  if (!fs.existsSync(filePath)) return { title: 'Not Found' };
  
  const content = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(content);
  return {
    title: `${data.title} - WeebHQ Recommendations`,
    description: data.reason || data.description,
  };
}

export default async function RecommendationArticle({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  if (slug === 'placeholder') return notFound();
  
  const filePath = path.join(process.cwd(), 'content', 'articles', 'latest-anime-recommendations', `${slug}.md`);
  if (!fs.existsSync(filePath)) return notFound();
  
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const htmlContent = marked.parse(content);
  
  return (
    <div className="main-wrapper" style={{ display: 'block' }}>
      <div className="news-top-bar" style={{ marginBottom: 0 }}>
        <h2 className="news-section-title">Latest Anime Recommendations</h2>
        <div className="breadcrumbs">
          <Link href="/">Top</Link> &gt; <Link href="/articles/latest-anime-recommendations">Recommendations</Link> &gt; {data.title}
        </div>
      </div>
      
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', background: '#1c1c24', borderRadius: '4px', marginTop: '20px' }}>
        <h1 style={{ marginBottom: '10px', fontSize: '24px' }}>{data.title}</h1>
        
        <div style={{ color: '#888', fontSize: '13px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
          By WeebHQ | Published on {new Date(data.published_at).toLocaleDateString()}
        </div>
        
        {data.cover_image && (
          <div style={{ marginBottom: '25px' }}>
            <img src={data.cover_image} alt={data.title} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '4px' }} />
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', background: '#252530', padding: '15px', borderRadius: '8px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>If you liked:</div>
            <Link href={`/anime/${data.source_id}`} style={{ fontWeight: 'bold', color: 'var(--mal-blue)', textDecoration: 'none' }}>
              {data.source_anime}
            </Link>
          </div>
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '20px' }}>→</span>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>You might like:</div>
            <Link href={`/anime/${data.recommended_id}`} style={{ fontWeight: 'bold', color: 'var(--mal-blue)', textDecoration: 'none' }}>
              {data.recommended_anime}
            </Link>
          </div>
        </div>
        
        <div className="markdown-content" dangerouslySetInnerHTML={{ __html: htmlContent }} style={{ lineHeight: '1.6', fontSize: '15px' }} />
        
        {data.tags && (
          <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #333' }}>
            <strong style={{ fontSize: '13px', color: '#aaa', marginRight: '10px' }}>Tags:</strong>
            {data.tags.map((tag, i) => (
              <span key={i} style={{ display: 'inline-block', padding: '4px 8px', background: '#333', borderRadius: '4px', fontSize: '12px', marginRight: '8px' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}