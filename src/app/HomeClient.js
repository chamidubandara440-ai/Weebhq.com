'use client';
import { useEffect, useState } from 'react';

export default function HomeClient({ initialTopAiring, initialTopUpcoming, initialSeasonal, reviews, news, recommendations }) {
  const [topAiring, setTopAiring] = useState(initialTopAiring);
  const [topUpcoming, setTopUpcoming] = useState(initialTopUpcoming);
  const [seasonal, setSeasonal] = useState(initialSeasonal);

  useEffect(() => {
    const fetchApi = async () => {
      // Skip full client fetch only when ALL sections already have server data.
      // We still need to fetch upcoming separately regardless.
      const needsAiring = !initialTopAiring;
      const needsUpcoming = !initialTopUpcoming;
      const needsSeasonal = !initialSeasonal;

      // ── Top Airing + Seasonal: from D1 via /api/anime ───────────────────
      if (needsAiring || needsSeasonal) {
        try {
          const [res1, res2] = await Promise.all([
            fetch('https://weebhq-api.chamidubandara440.workers.dev/api/anime?limit=50', { cache: 'no-store' }),
            fetch('https://weebhq-api.chamidubandara440.workers.dev/api/anime?limit=50&offset=50', { cache: 'no-store' })
          ]);
          let rawData = [];
          if (res1.ok) { const j1 = await res1.json(); if (j1.data) rawData.push(...j1.data); }
          if (res2.ok) { const j2 = await res2.json(); if (j2.data) rawData.push(...j2.data); }

          if (needsAiring) {
            const f = rawData.filter(a => a.status && (
              a.status.toLowerCase() === 'currently airing' || a.status === 'releasing'
            ));
            setTopAiring(f.slice(0, 5).map((a, i) => ({
              rank: i + 1, title: a.title_english || a.title,
              score: a.score != null ? a.score.toFixed(2) : 'N/A',
              img: a.image_url, id: a.id, type: a.anime_type || 'TV',
              eps: a.episodes || 0, members: a.members ? a.members.toLocaleString() : '0'
            })));
          }

          if (needsSeasonal) {
            const f = rawData.filter(a => a.season && a.season.toLowerCase() === 'fall' && a.season_year === 2026);
            setSeasonal(f.slice(0, 6).map((a) => ({
              id: a.id, title: a.title_english || a.title, img: a.image_url,
              type: a.anime_type || 'TV', eps: a.episodes ? a.episodes + ' eps' : '? eps',
              score: a.score != null ? a.score.toFixed(2) : 'N/A',
              snippet: a.synopsis ? a.synopsis.substring(0, 100) + '...' : ''
            })));
          }
        } catch (e) {
          console.error('D1 fetch failed', e);
          if (needsAiring) setTopAiring([]);
          if (needsSeasonal) setSeasonal([]);
        }
      }

      // ── Top Upcoming: from /api/anime/upcoming (live Tenrai, not D1) ─────
      if (needsUpcoming) {
        try {
          const upRes = await fetch(
            'https://weebhq-api.chamidubandara440.workers.dev/api/anime/upcoming'
          );
          if (upRes.ok) {
            const upJson = await upRes.json();
            const items = (upJson.data || []).map((a, i) => ({
              rank: i + 1,
              title: a.title_english || a.title,
              score: a.score != null ? Number(a.score).toFixed(2) : 'N/A',
              img: a.image_url,
              id: a.id,
              type: a.anime_type || 'TV',
              eps: a.episodes || '?',
              members: a.members ? Number(a.members).toLocaleString() : '0',
              airedString: a.aired_string || null,
            }));
            setTopUpcoming(items.length > 0 ? items : []);
          } else {
            setTopUpcoming([]);
          }
        } catch (_) {
          setTopUpcoming([]);
        }
      }
    };
    fetchApi();
  }, [initialTopAiring, initialTopUpcoming, initialSeasonal]);

  const loadingPlaceholder = <div style={{padding: '20px', color: '#888'}}>Loading data...</div>;
  const emptyPlaceholder = <div style={{padding: '20px', color: '#888'}}>No data available.</div>;

  const RankingList = ({ data, showAired }) => (
    <ul className="ranking-list">
      {data.map((anime) => (
        <li key={anime.rank} className="ranking-item">
          <div className="ranking-rank">{anime.rank}</div>
          <img src={anime.img} alt={anime.title} className="ranking-img" />
          <div className="ranking-info">
            <div className="ranking-title-row">
              <h4><a href={`/anime/${anime.id}`}>{anime.title}</a></h4>
              
            </div>
            <div className="ranking-meta">
              {anime.type}, {anime.eps} eps
              {showAired && anime.airedString ? <span style={{color:'#aaa'}}> · {anime.airedString}</span> : null}
              {!showAired ? <span>, scored {anime.score}</span> : null}
            </div>
            <div className="ranking-members">{anime.members} members</div>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="main-wrapper">
      <div className="left-col">
        <div className="side-header"><span>Top Airing Anime</span><a href="/anime/top">More</a></div>
        {topAiring === null ? loadingPlaceholder : topAiring.length === 0 ? emptyPlaceholder : <RankingList data={topAiring} showAired={false} />}

        <div className="side-header" style={{marginTop: "20px"}}><span>Top Upcoming Anime</span><a href="/anime/seasonal">More</a></div>
        {topUpcoming === null ? loadingPlaceholder : topUpcoming.length === 0 ? emptyPlaceholder : <RankingList data={topUpcoming} showAired={true} />}
      </div>

      <div className="right-col">
        <div className="content-section">
          <div className="seasonal-header"><span>Fall 2026 Anime</span><a href="/anime/seasonal" className="view-more-link">View More</a></div>
          <div className="seasonal-card-row">
            {seasonal === null ? loadingPlaceholder : seasonal.length === 0 ? emptyPlaceholder : seasonal.map((anime) => (
              <div key={anime.id} className="seasonal-card">
                <a href={`/anime/${anime.id}`}><img src={anime.img} alt={anime.title} /></a>
                <div className="seasonal-card-info"><a href={`/anime/${anime.id}`}>{anime.title}</a></div>
              </div>
            ))}
          </div>
        </div>

        <div className="content-section">
          <div className="seasonal-header"><span>Latest Anime Reviews</span><a href="/anime/reviews" className="view-more-link">View More Reviews</a></div>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="mal-review-item">
                <div className="mal-review-img-col"><a href={`/reviews/${review.id}`}><img src={review.img} alt={review.title} className="mal-review-img" /></a></div>
                <div className="mal-review-content">
                  <div className="mal-review-header">
                    <div className="mal-review-title"><a href={`/reviews/${review.id}`}>{review.title}</a></div>
                    <div className="mal-review-score">Overall Rating: {review.score || '9'}</div>
                  </div>
                  <div className="mal-review-body">{review.snippet} <a href={`/reviews/${review.id}`}>read more</a></div>
                  <div className="mal-review-footer">{review.date} by WeebHQ</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="content-section">
          <div className="seasonal-header"><span>Anime &amp; Manga News</span><a href="/news" className="view-more-link">More</a></div>
          <div className="news-list">
            {news.map((item) => (
              <div key={item.id} className="mal-news-item">
                <div className="mal-news-img-col"><a href={`/news/${item.id}`}><img src={item.img} alt={item.title} className="mal-news-img" /></a></div>
                <div className="mal-news-content">
                  <div className="mal-news-title"><a href={`/news/${item.id}`}>{item.title}</a></div>
                  <div className="mal-news-body">{item.snippet} <a href={`/news/${item.id}`}>read more</a></div>
                  <div className="mal-news-footer">{item.date} by WeebHQ</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="content-section">
          <div className="seasonal-header"><span>Latest Anime Recommendations</span><a href="/anime/recommendations" className="view-more-link">View More</a></div>
          <div className="mal-rec-list">
            {recommendations.length === 0 ? (
              <div style={{padding: "20px", color: "#888", fontSize: "13px"}}>No recommendations available yet.</div>
            ) : recommendations.map((rec) => {
              const src = rec.sourceAnime || {};
              const sug = rec.recommendedAnime || {};
              if (!src.title || !sug.title) return null;
              return (
                <div key={rec.id} className="mal-rec-item">
                  <div className="mal-rec-top">
                    <div className="mal-rec-half">
                      <a href={"/anime/" + src.id}>
                        <img src={src.image_url || "https://placehold.co/100x140/1a1a2e/ffffff?text=Anime"} alt={src.title} className="mal-rec-img" loading="lazy" />
                      </a>
                      <div className="mal-rec-info">
                        <div className="mal-rec-label">If you liked</div>
                        <div className="mal-rec-title"><a href={"/anime/" + src.id}>{src.title}</a></div>
                      </div>
                    </div>
                    <div className="mal-rec-half">
                      <a href={"/anime/" + sug.id}>
                        <img src={sug.image_url || "https://placehold.co/100x140/1a1a2e/ffffff?text=Anime"} alt={sug.title} className="mal-rec-img" loading="lazy" />
                      </a>
                      <div className="mal-rec-info">
                        <div className="mal-rec-label">You might like</div>
                        <div className="mal-rec-title"><a href={"/anime/" + sug.id}>{sug.title}</a></div>
                      </div>
                    </div>
                  </div>
                  <div className="mal-rec-bottom">
                    <div className="mal-rec-text">{rec.reason || "Recommended based on similar themes and quality."}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}