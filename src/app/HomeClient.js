'use client';
import { useEffect, useState } from 'react';

export default function HomeClient({ initialTopAiring, initialTopUpcoming, initialSeasonal, reviews, news, recommendations }) {
  const [topAiring, setTopAiring] = useState(initialTopAiring);
  const [topUpcoming, setTopUpcoming] = useState(initialTopUpcoming);
  const [seasonal, setSeasonal] = useState(initialSeasonal);

  useEffect(() => {
    const fetchAnilist = async () => {
      if (initialTopAiring && initialTopUpcoming && initialSeasonal) return;

      const query = `
      query {
        airing: Page(page: 1, perPage: 5) {
          media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
            id title { romaji english } coverImage { large } averageScore format episodes popularity
          }
        }
        upcoming: Page(page: 1, perPage: 5) {
          media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
            id title { romaji english } coverImage { large } averageScore format episodes popularity
          }
        }
        seasonal: Page(page: 1, perPage: 6) {
          media(type: ANIME, season: FALL, seasonYear: 2026, sort: POPULARITY_DESC) {
            id title { romaji english } coverImage { large } format episodes averageScore popularity description(asHtml: false)
          }
        }
      }`;

      try {
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        
        if (!res.ok) return;
        const json = await res.json();
        const data = json.data;

        if (!initialTopAiring && data?.airing?.media) {
          setTopAiring(data.airing.media.map((anime, index) => ({
            rank: index + 1,
            title: anime.title.english || anime.title.romaji,
            score: anime.averageScore ? (anime.averageScore / 10).toFixed(2) : "N/A",
            img: anime.coverImage.large,
            id: anime.id,
            type: anime.format || "TV",
            eps: anime.episodes || 0,
            members: anime.popularity ? anime.popularity.toLocaleString() : "0"
          })));
        }

        if (!initialTopUpcoming && data?.upcoming?.media) {
          setTopUpcoming(data.upcoming.media.map((anime, index) => ({
            rank: index + 1,
            title: anime.title.english || anime.title.romaji,
            score: anime.averageScore ? (anime.averageScore / 10).toFixed(2) : "N/A",
            img: anime.coverImage.large,
            id: anime.id,
            type: anime.format || "TV",
            eps: anime.episodes || 0,
            members: anime.popularity ? anime.popularity.toLocaleString() : "0"
          })));
        }

        if (!initialSeasonal && data?.seasonal?.media) {
          setSeasonal(data.seasonal.media.map((anime) => ({
            id: anime.id,
            title: anime.title.english || anime.title.romaji,
            img: anime.coverImage.large,
            type: anime.format || "TV",
            eps: anime.episodes ? `${anime.episodes} eps` : "? eps",
            score: anime.averageScore ? (anime.averageScore / 10).toFixed(2) : "N/A",
            snippet: anime.description ? anime.description.substring(0, 100) + '...' : ''
          })));
        }
      } catch (e) {
        console.error("Anilist fetch failed", e);
      }
    };

    fetchAnilist();
  }, [initialTopAiring, initialTopUpcoming, initialSeasonal]);

  const loadingPlaceholder = (
    <div style={{padding: '20px', color: '#888'}}>Loading data...</div>
  );

  return (
    <div className="main-wrapper">
      <div className="left-col">
        {/* Top Airing */}
        <div className="side-header">
          <span>Top Airing Anime</span>
          <a href="/anime/top">More</a>
        </div>
        {topAiring ? (
          <ul className="ranking-list">
            {topAiring.map((anime) => (
              <li key={anime.rank} className="ranking-item">
                <div className="ranking-rank">{anime.rank}</div>
                <img src={anime.img} alt={anime.title} className="ranking-img" />
                <div className="ranking-info">
                  <div className="ranking-title-row">
                    <h4><a href={`/anime/${anime.id}`}>{anime.title}</a></h4>
                    <span className="mal-review-add">add</span>
                  </div>
                  <div className="ranking-meta">{anime.type}, {anime.eps} eps, scored {anime.score}</div>
                  <div className="ranking-members">{anime.members} members</div>
                </div>
              </li>
            ))}
          </ul>
        ) : loadingPlaceholder}

        {/* Top Upcoming */}
        <div className="side-header" style={{marginTop: "20px"}}>
          <span>Top Upcoming Anime</span>
          <a href="/anime/seasonal">More</a>
        </div>
        {topUpcoming ? (
          <ul className="ranking-list">
            {topUpcoming.map((anime) => (
              <li key={anime.rank} className="ranking-item">
                <div className="ranking-rank">{anime.rank}</div>
                <img src={anime.img} alt={anime.title} className="ranking-img" />
                <div className="ranking-info">
                  <div className="ranking-title-row">
                    <h4><a href={`/anime/${anime.id}`}>{anime.title}</a></h4>
                    <span className="mal-review-add">add</span>
                  </div>
                  <div className="ranking-meta">{anime.type}, {anime.eps} eps, scored {anime.score}</div>
                  <div className="ranking-members">{anime.members} members</div>
                </div>
              </li>
            ))}
          </ul>
        ) : loadingPlaceholder}
      </div>
      
      <div className="right-col">
        
        {/* Seasonal Anime */}
        <div className="content-section">
          <div className="seasonal-header">
            <span>Fall 2026 Anime</span>
            <a href="/anime/seasonal" className="view-more-link">View More</a>
          </div>
          <div className="seasonal-card-row">
            {seasonal ? seasonal.map((anime) => (
              <div key={anime.id} className="seasonal-card">
                <a href={`/anime/${anime.id}`}>
                  <img src={anime.img} alt={anime.title} />
                </a>
                <div className="seasonal-card-info">
                  <a href={`/anime/${anime.id}`}>{anime.title}</a>
                </div>
              </div>
            )) : loadingPlaceholder}
          </div>
        </div>

        {/* Latest Anime Reviews */}
        <div className="content-section">
          <div className="seasonal-header">
            <span>Latest Anime Reviews</span>
            <a href="/anime/reviews" className="view-more-link">View More Reviews</a>
          </div>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="mal-review-item">
                <div className="mal-review-img-col">
                  <a href={`/reviews/${review.id}`}>
                    <img src={review.img} alt={review.title} className="mal-review-img" />
                  </a>
                </div>
                <div className="mal-review-content">
                  <div className="mal-review-header">
                    <div className="mal-review-title">
                      <a href={`/reviews/${review.id}`}>{review.title}</a>
                      <span className="mal-review-add">add</span>
                    </div>
                    <div className="mal-review-score">Overall Rating: {review.score || '9'}</div>
                  </div>
                  <div className="mal-review-body">
                    {review.snippet} <a href={`/reviews/${review.id}`}>read more</a>
                  </div>
                  <div className="mal-review-footer">
                    {review.date} by <a href="#">{review.user || 'anonymous'}</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anime & Manga News */}
        <div className="content-section">
          <div className="seasonal-header">
            <span>Anime & Manga News</span>
            <a href="/news" className="view-more-link">More</a>
          </div>
          <div className="news-list">
            {news.map((item) => (
              <div key={item.id} className="mal-news-item">
                <div className="mal-news-img-col">
                  <a href={`/news/${item.id}`}>
                    <img src={item.img} alt={item.title} className="mal-news-img" />
                  </a>
                </div>
                <div className="mal-news-content">
                  <div className="mal-news-title">
                    <a href={`/news/${item.id}`}>{item.title}</a>
                  </div>
                  <div className="mal-news-body">
                    {item.snippet} <a href={`/news/${item.id}`}>read more</a>
                  </div>
                  <div className="mal-news-footer">
                    {item.date} by <a href="#">{item.user || 'WeebHQ_News'}</a> | <a href="#">Discuss (0 comments)</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Anime Recommendations */}
        <div className="content-section">
          <div className="seasonal-header">
            <span>Latest Anime Recommendations</span>
            <a href="/anime/recommendations" className="view-more-link">View More</a>
          </div>
          <div className="mal-rec-list">
            {recommendations.map((rec) => (
              <div key={rec.id} className="mal-rec-item">
                <div className="mal-rec-top">
                  
                  {/* Left Side (If you liked) */}
                  <div className="mal-rec-half">
                    <a href={`/anime/${rec.sourceId || 1}`}>
                      <img src={rec.sourceImg || rec.img || "https://placehold.co/400x600/1a1a24/ffffff?text=Anime1"} alt={rec.sourceTitle || rec.title} className="mal-rec-img" />
                    </a>
                    <div className="mal-rec-info">
                      <div className="mal-rec-label">If you liked</div>
                      <div className="mal-rec-title"><a href={`/anime/${rec.sourceId || 1}`}>{rec.sourceTitle || rec.title}</a></div>
                      <span className="mal-review-add">add</span>
                    </div>
                  </div>

                  {/* Right Side (...then you might like) */}
                  <div className="mal-rec-half">
                    <a href={`/anime/${rec.recId || 1}`}>
                      <img src={rec.recImg || rec.img || "https://placehold.co/400x600/1a1a24/ffffff?text=Anime2"} alt={rec.recTitle || "Recommendation"} className="mal-rec-img" />
                    </a>
                    <div className="mal-rec-info">
                      <div className="mal-rec-label">...then you might like</div>
                      <div className="mal-rec-title"><a href={`/anime/${rec.recId || 1}`}>{rec.recTitle || "This Anime"}</a></div>
                      <span className="mal-review-add">add</span>
                    </div>
                  </div>

                </div>
                
                <div className="mal-rec-bottom">
                  <div className="mal-rec-text">{rec.text || rec.snippet}</div>
                  <div className="mal-rec-footer">
                    Anime rec by <a href="#">{rec.user || 'anonymous'}</a> - {rec.date || '3 hours ago'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
