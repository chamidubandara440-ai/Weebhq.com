import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const reviewDir = path.join(process.cwd(), 'content', 'reviews');
  const filePath = path.join(reviewDir, `${id}.md`);

  try {
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);
      return {
        title: data.title ? `${data.title} | WeebHQ Reviews` : 'Anime Review | WeebHQ',
        description: data.snippet || 'Read the full anime review on WeebHQ.',
        openGraph: {
          title: data.title || 'Anime Review | WeebHQ',
          description: data.snippet || '',
          images: data.img ? [{ url: data.img }] : [],
        },
      };
    }
  } catch (_) {}

  return {
    title: 'Anime Review | WeebHQ',
    description: 'Read the full anime review on WeebHQ.',
  };
}

export function generateStaticParams() {
  const reviewDir = path.join(process.cwd(), 'content', 'reviews');
  let ids = [];
  try {
    if (fs.existsSync(reviewDir)) {
      const files = fs.readdirSync(reviewDir).filter(f => f.endsWith('.md'));
      ids = files.map(filename => ({ id: filename.replace('.md', '') }));
    }
  } catch (_) {}

  // Fallback so the build never fails with zero params
  if (ids.length === 0) ids.push({ id: 'not-found' });
  return ids;
}

export default async function ReviewDetail({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const reviewDir = path.join(process.cwd(), 'content', 'reviews');
  const filePath = path.join(reviewDir, `${id}.md`);

  let article = null;
  let htmlContent = '';

  try {
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);
      htmlContent = marked.parse(content);

      article = {
        title:   data.title   || 'Untitled Review',
        date:    data.date    || '',
        img:     data.img     || null,
        score:   data.score   != null ? data.score : null,
        author:  data.author  || 'WeebHQ',
        snippet: data.snippet || '',
        tags:    Array.isArray(data.tags) ? data.tags : [],
        fullText: htmlContent,
      };
    }
  } catch (e) {
    console.error('Failed to read review markdown file', e);
  }

  // No file found → proper 404
  if (!article) notFound();

  return (
    <div className="main-wrapper news-detail-page">

      {/* Breadcrumb bar */}
      <div className="news-top-bar">
        <h2 className="news-section-title">Anime Reviews</h2>
        <div className="breadcrumbs">
          <a href="/">Top</a> &gt; <a href="/anime/reviews">Reviews</a> &gt; {article.title}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

        {/* ── Main content column ─────────────────────────────────── */}
        <div className="news-main-col" style={{ flex: '1 1 600px', minWidth: 0 }}>

          <h1 className="news-headline">{article.title}</h1>

          {/* Meta bar */}
          <div className="news-meta-bar">
            <div className="news-author-info">
              by <a href="#">{article.author}</a><br />
              <span>{article.date}</span>
            </div>
            {article.score != null && (
              <div style={{
                backgroundColor: 'var(--mal-blue, #2e51a2)',
                color: '#fff',
                padding: '6px 16px',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                lineHeight: 1.2,
              }}>
                <span style={{ fontSize: '10px', fontWeight: 'normal', letterSpacing: '1px' }}>SCORE</span>
                {Number(article.score).toFixed(1)}
              </div>
            )}
            <div className="news-socials">
              <a href="#">F</a> <a href="#">X</a> <a href="#">R</a> <a href="#">T</a>
            </div>
          </div>

          {/* Article body */}
          <div className="news-content-body">
            {article.img && (
              <img src={article.img} alt={article.title} className="news-float-img" />
            )}
            <div
              style={{ fontSize: '14px', lineHeight: '1.7' }}
              dangerouslySetInnerHTML={{ __html: article.fullText }}
            />
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="news-tags">
              {article.tags.map((tag, i) => (
                <a key={i} href="#" className="tag-pill">{tag}</a>
              ))}
            </div>
          )}

          {/* Comments placeholder */}
          <div className="news-comments-section">
            <div className="comments-header">
              <h3>Recent Comments</h3>
              <a href="#">0 Comments</a>
            </div>
            <p style={{ padding: '10px', fontSize: '11px', color: '#666' }}>
              Be the first to comment on this review!
            </p>
          </div>

        </div>

        {/* ── Right sidebar ────────────────────────────────────────── */}
        <div style={{ flex: '0 0 240px', minWidth: '200px' }}>

          {/* Score card */}
          {article.score != null && (
            <>
              <div className="side-header">Overall Score</div>
              <div style={{
                backgroundColor: 'var(--mal-bg-darker, #1a1a2e)',
                border: '1px solid var(--mal-border, #2a2a3e)',
                padding: '15px',
                textAlign: 'center',
                marginBottom: '15px',
              }}>
                <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'var(--mal-blue, #2e51a2)' }}>
                  {Number(article.score).toFixed(1)}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>out of 10</div>
              </div>
            </>
          )}

          {/* Tags sidebar */}
          {article.tags.length > 0 && (
            <>
              <div className="side-header">Tags</div>
              <div className="trending-tags" style={{ marginBottom: '15px' }}>
                {article.tags.map((tag, i) => (
                  <span key={i} className="mal-tag">{tag}</span>
                ))}
              </div>
            </>
          )}

          {/* Back link */}
          <div className="side-header">Browse</div>
          <div style={{
            backgroundColor: 'var(--mal-bg-darker, #1a1a2e)',
            border: '1px solid var(--mal-border, #2a2a3e)',
            padding: '10px',
            fontSize: '12px',
          }}>
            <div style={{ marginBottom: '6px' }}>
              <a href="/anime/reviews" style={{ color: 'var(--mal-link, #4e7ac7)' }}>
                &laquo; All Anime Reviews
              </a>
            </div>
            <div>
              <a href="/" style={{ color: 'var(--mal-link, #4e7ac7)' }}>
                &laquo; Back to Home
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
