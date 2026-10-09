import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const metadata = {
  title: 'Latest Anime Reviews | WeebHQ',
  description: 'Read the latest anime reviews on WeebHQ. In-depth analysis, scores, and recommendations from our review team.',
};

export default function ReviewsIndex() {
  const dirPath = path.join(process.cwd(), 'content', 'reviews');
  let reviewsList = [];

  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      reviewsList = files.map(filename => {
        const fileContents = fs.readFileSync(path.join(dirPath, filename), 'utf8');
        const { data } = matter(fileContents);
        return {
          id:       filename.replace('.md', ''),
          timestamp: data.published_at || data.id || '1970-01-01',
          title:    data.title  || 'Untitled Review',
          date:     data.date   || '',
          snippet:  data.snippet || '',
          img:      data.img    || null,
          score:    data.score  != null ? data.score : null,
          author:   data.author || 'WeebHQ',
          tags:     Array.isArray(data.tags) ? data.tags : [],
        };
      });
      // Sort newest first using the numeric timestamp id
      reviewsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  } catch (e) {
    console.error('Failed to read reviews directory', e);
  }

  return (
    <div className="main-wrapper">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="left-col" style={{ width: '700px', flex: 'none' }}>
        <div className="news-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="news-section-title">Latest Anime Reviews</h1>
            <div className="breadcrumbs">
              <a href="/">Top</a> &gt; <a href="/anime/reviews">Anime</a> &gt; Reviews
            </div>
          </div>
          <a href="/anime/reviews" style={{ fontSize: '12px', color: 'var(--mal-link, #4e7ac7)' }}>
            Browse All Reviews
          </a>
        </div>

        {/* ── Filter tabs (decorative, matches existing style) ── */}
        <div className="mal-news-tabs">
          <span className="active">All Reviews</span>
          <span>Anime Reviews</span>
          <span>Manga Reviews</span>
          <span>Best Reviews</span>
        </div>

        {/* ── Review list ────────────────────────────────────── */}
        <div className="mal-review-page-list" style={{ marginTop: '10px' }}>
          {reviewsList.length === 0 && (
            <div style={{ padding: '20px', color: '#888', fontSize: '13px' }}>
              No reviews found. Check back soon!
            </div>
          )}

          {reviewsList.map(review => (
            <div
              key={review.id}
              className="mal-review-item"
              style={{
                marginBottom: '15px',
                padding: '12px',
                backgroundColor: 'var(--mal-bg-darker)',
                border: '1px solid var(--mal-border)',
                display: 'flex',
                gap: '12px',
              }}
            >
              {/* Cover image */}
              <a href={`/reviews/${review.id}`} style={{ flexShrink: 0 }}>
                {review.img ? (
                  <img
                    src={review.img}
                    alt={review.title}
                    className="mal-review-img"
                    style={{ width: '80px', height: '115px', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: '80px', height: '115px',
                    backgroundColor: 'var(--mal-bg-card, #1a1a2e)',
                    border: '1px solid var(--mal-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', color: '#666', textAlign: 'center',
                  }}>
                    No Image
                  </div>
                )}
              </a>

              {/* Review content */}
              <div className="mal-review-content" style={{ flex: 1, minWidth: 0 }}>

                {/* Header: title + score */}
                <div
                  className="mal-review-header"
                  style={{ borderBottom: '1px solid var(--mal-border)', paddingBottom: '6px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}
                >
                  <div>
                    <div className="mal-review-title">
                      <a href={`/reviews/${review.id}`} style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {review.title}
                      </a>
                    </div>
                    {review.tags.length > 0 && (
                      <div style={{ marginTop: '4px' }}>
                        {review.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="mal-tag" style={{ marginRight: '4px' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {review.score != null && (
                    <div className="mal-review-score" style={{
                      flexShrink: 0,
                      backgroundColor: 'var(--mal-blue, #2e51a2)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '3px',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      lineHeight: 1,
                    }}>
                      {Number(review.score).toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Snippet */}
                {review.snippet && (
                  <div className="mal-review-body" style={{ fontSize: '12px', lineHeight: '1.5', marginBottom: '8px' }}>
                    {review.snippet}{' '}
                    <a href={`/reviews/${review.id}`} style={{ color: 'var(--mal-link)' }}>read more</a>
                  </div>
                )}

                {/* Footer: date + author + read link */}
                <div
                  className="mal-review-footer"
                  style={{ marginTop: '6px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>
                    {review.date}{review.date && review.author ? ' by ' : ''}
                    {review.author && <a href="#" style={{ color: 'var(--mal-link)' }}>{review.author}</a>}
                  </span>
                  <a
                    href={`/reviews/${review.id}`}
                    style={{
                      color: 'var(--mal-link, #4e7ac7)',
                      border: '1px solid var(--mal-border)',
                      padding: '2px 8px',
                      fontSize: '11px',
                      borderRadius: '2px',
                    }}
                  >
                    Read Review &raquo;
                  </a>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right sidebar ───────────────────────────────────── */}
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

