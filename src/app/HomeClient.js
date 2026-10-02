'use client';
import { useEffect, useState } from 'react';

export default function HomeClient({ initialTopAiring, initialTopUpcoming, initialSeasonal, reviews, news, recommendations }) {
  const [topAiring, setTopAiring] = useState(initialTopAiring);
  const [topUpcoming, setTopUpcoming] = useState(initialTopUpcoming);
  const [seasonal, setSeasonal] = useState(initialSeasonal);

  useEffect(() => {
    const fetchKitsu = async (endpoint) => {
      try {
        const url = `https://kitsu.io/api/edge${endpoint}${endpoint.includes('?') ? '&' : '?'}cb=20261002`;
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        return null;
      }
    };

    if (!initialTopAiring) {
      fetchKitsu('/anime?filter[status]=current&sort=-userCount&page[limit]=5').then(res => {
        if (res?.data) {
          setTopAiring(res.data.map((anime, index) => ({
            rank: index + 1,
            title: anime.attributes.canonicalTitle,
            score: anime.attributes.averageRating ? (anime.attributes.averageRating / 10).toFixed(2) : "N/A",
            img: anime.attributes.posterImage.large,
            id: anime.id
          })));
        }
      });
    }

    if (!initialTopUpcoming) {
      fetchKitsu('/anime?filter[status]=upcoming&sort=-userCount&page[limit]=5').then(res => {
        if (res?.data) {
          setTopUpcoming(res.data.map((anime, index) => ({
            rank: index + 1,
            title: anime.attributes.canonicalTitle,
            score: anime.attributes.averageRating ? (anime.attributes.averageRating / 10).toFixed(2) : "N/A",
            img: anime.attributes.posterImage.large,
            id: anime.id
          })));
        }
      });
    }

    if (!initialSeasonal) {
      fetchKitsu('/anime?filter[season]=spring&filter[seasonYear]=2024&sort=-userCount&page[limit]=6').then(res => {
        if (res?.data) {
          setSeasonal(res.data.map((anime) => ({
            id: anime.id,
            title: anime.attributes.canonicalTitle,
            img: anime.attributes.posterImage.large,
            type: anime.attributes.subtype || "TV",
            eps: anime.attributes.episodeCount ? `${anime.attributes.episodeCount} eps` : "? eps",
            score: anime.attributes.averageRating ? (anime.attributes.averageRating / 10).toFixed(2) : "N/A",
            members: anime.attributes.userCount ? (anime.attributes.userCount / 1000).toFixed(0) + 'K' : '0K',
            snippet: anime.attributes.synopsis ? anime.attributes.synopsis.substring(0, 100) + '...' : ''
          })));
        }
      });
    }
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
            <span>Spring 2026 Anime</span>
            <a href="#" className="view-more-link">View More Seasonal Anime</a>
          </div>
          <div className="seasonal-grid">
            {seasonal ? seasonal.map((anime) => (
              <div key={anime.id} className="anime-box">
                <div className="anime-box-title"><a href={`/anime/${anime.id}`}>{anime.title}</a></div>
                <a href={`/anime/${anime.id}`}><img src={anime.img} alt={anime.title} className="anime-box-img" /></a>
                <div className="anime-box-meta">
                  {anime.type} - {anime.eps}
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
