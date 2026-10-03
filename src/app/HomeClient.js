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
            id title { romaji english } coverImage { large } averageScore
          }
        }
        upcoming: Page(page: 1, perPage: 5) {
          media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
            id title { romaji english } coverImage { large } averageScore
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
            id: anime.id
          })));
        }

        if (!initialTopUpcoming && data?.upcoming?.media) {
          setTopUpcoming(data.upcoming.media.map((anime, index) => ({
            rank: index + 1,
            title: anime.title.english || anime.title.romaji,
            score: anime.averageScore ? (anime.averageScore / 10).toFixed(2) : "N/A",
            img: anime.coverImage.large,
            id: anime.id
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
        <div className="side-header">Top Airing Anime</div>
        {topAiring ? (
          <ul className="ranking-list">
            {topAiring.map((anime) => (
              <li key={anime.rank} className="ranking-item">
                <div className="ranking-rank">{anime.rank}</div>
                <img src={anime.img} alt={anime.title} className="ranking-img" />
                <div className="ranking-info">
                  <h4><a href={`/anime/${anime.id}`}>{anime.title}</a></h4>
                  <div className="ranking-score">Scored {anime.score}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : loadingPlaceholder}
        <div className="view-more"><a href="#">More</a></div>

        {/* Top Upcoming */}
        <div className="side-header" style={{marginTop: "20px"}}>Top Upcoming Anime</div>
        {topUpcoming ? (
          <ul className="ranking-list">
            {topUpcoming.map((anime) => (
              <li key={anime.rank} className="ranking-item">
                <div className="ranking-rank">{anime.rank}</div>
                <img src={anime.img} alt={anime.title} className="ranking-img" />
                <div className="ranking-info">
                  <h4><a href={`/anime/${anime.id}`}>{anime.title}</a></h4>
                  <div className="ranking-score">Scored {anime.score}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : loadingPlaceholder}
        <div className="view-more"><a href="#">More</a></div>
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
            <a href="#" className="view-more-link">View More Reviews</a>
          </div>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-item">
                <a href="/anime/1#reviews"><img src={review.img} alt={review.title} className="review-img" /></a>
                <div className="review-info">
                  <div className="review-header">
                    <h4><a href="/anime/1#reviews">{review.title}</a></h4>
                    <span className="review-score">Score: <strong>{review.score}</strong></span>
                  </div>
                  <div className="review-meta">By <a href="#">{review.user}</a></div>
                  <p className="review-excerpt">{review.excerpt} <a href="/anime/1#reviews">read more</a></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anime & Manga News */}
        <div className="content-section">
          <div className="seasonal-header">
            <span>Anime & Manga News</span>
            <a href="#" className="view-more-link">More</a>
          </div>
          <div className="news-list">
            {news.map((item) => (
              <div key={item.id} className="news-item">
                <a href={`/news/${item.id}`}><img src={item.img} alt={item.title} className="news-img" /></a>
                <div className="news-info">
                  <h4><a href={`/news/${item.id}`}>{item.title}</a></h4>
                  <div className="news-date">{item.date}</div>
                  <p className="news-snippet">{item.snippet}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Anime Recommendations */}
        <div className="content-section">
          <div className="seasonal-header">
            <span>Latest Anime Recommendations</span>
            <a href="#" className="view-more-link">More</a>
          </div>
          <div className="rec-list">
            {recommendations.map((rec) => (
              <a href="/recommendations/1" key={rec.id} className="rec-item" style={{display:"block", color:"inherit", textDecoration:"none"}}>
                <div className="rec-images">
                  <div className="rec-img-box">
                    <img src={rec.sourceImg} alt={rec.sourceTitle} />
                    <div className="rec-title">{rec.sourceTitle}</div>
                  </div>
                  <div className="rec-arrow">then<br/>you might like</div>
                  <div className="rec-img-box">
                    <img src={rec.recImg} alt={rec.recTitle} />
                    <div className="rec-title">{rec.recTitle}</div>
                  </div>
                </div>
                <div className="rec-text">
                  <p>{rec.text}</p>
                  <div className="rec-meta">Anime recommendation by <span style={{color:"var(--mal-link)"}}>{rec.user}</span></div>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
