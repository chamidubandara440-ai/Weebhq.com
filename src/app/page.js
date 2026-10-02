import fs from 'fs';
import path from 'path';

const fetchKitsu = async (endpoint) => {
  try {
    const res = await fetch(`https://kitsu.io/api/edge${endpoint}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
};

export default async function Home() {
  const topAiringRes = await fetchKitsu('/anime?filter[status]=current&sort=-userCount&page[limit]=5');
  const topUpcomingRes = await fetchKitsu('/anime?filter[status]=upcoming&sort=-userCount&page[limit]=5');
  const seasonalRes = await fetchKitsu('/anime?filter[season]=spring&filter[seasonYear]=2024&sort=-userCount&page[limit]=6');

  const fallbackTopAiring = [
    { rank: 1, title: "Frieren: Beyond Journey's End", score: "9.38", img: "https://cdn.myanimelist.net/images/anime/1015/138006l.jpg", id: 1 },
    { rank: 2, title: "Jujutsu Kaisen Season 2", score: "8.87", img: "https://cdn.myanimelist.net/images/anime/1792/138022l.jpg", id: 2 },
    { rank: 3, title: "Solo Leveling", score: "8.35", img: "https://cdn.myanimelist.net/images/anime/1171/141703l.jpg", id: 3 },
    { rank: 4, title: "Oshi no Ko", score: "8.71", img: "https://cdn.myanimelist.net/images/anime/1812/134736l.jpg", id: 4 },
    { rank: 5, title: "Demon Slayer", score: "8.55", img: "https://cdn.myanimelist.net/images/anime/1054/142323l.jpg", id: 5 }
  ];

  const fallbackTopUpcoming = [
    { rank: 1, title: "Re:Zero Season 3", score: "N/A", img: "https://cdn.myanimelist.net/images/anime/1435/141753l.jpg", id: 6 },
    { rank: 2, title: "One Punch Man 3", score: "N/A", img: "https://cdn.myanimelist.net/images/anime/1208/126938l.jpg", id: 7 },
    { rank: 3, title: "Bleach: Thousand-Year Blood War", score: "N/A", img: "https://cdn.myanimelist.net/images/anime/1908/135335l.jpg", id: 8 },
    { rank: 4, title: "Fire Force Season 3", score: "N/A", img: "https://cdn.myanimelist.net/images/anime/1769/127393l.jpg", id: 9 },
    { rank: 5, title: "Blue Lock Season 2", score: "N/A", img: "https://cdn.myanimelist.net/images/anime/1091/128387l.jpg", id: 10 },
  ];

  const fallbackSeasonal = [
    { id: 11, title: "My Hero Academia Season 7", img: "https://cdn.myanimelist.net/images/anime/1023/142518l.jpg", type: "TV", eps: "? eps", score: "N/A", members: "100K", snippet: "" },
    { id: 12, title: "Kaiju No. 8", img: "https://cdn.myanimelist.net/images/anime/1376/141208l.jpg", type: "TV", eps: "12 eps", score: "N/A", members: "100K", snippet: "" },
    { id: 13, title: "Mushoku Tensei Season 2", img: "https://cdn.myanimelist.net/images/anime/1162/142410l.jpg", type: "TV", eps: "12 eps", score: "N/A", members: "100K", snippet: "" },
    { id: 14, title: "KonoSuba Season 3", img: "https://cdn.myanimelist.net/images/anime/1567/141151l.jpg", type: "TV", eps: "11 eps", score: "N/A", members: "100K", snippet: "" },
    { id: 15, title: "That Time I Got Reincarnated", img: "https://cdn.myanimelist.net/images/anime/1376/141175l.jpg", type: "TV", eps: "24 eps", score: "N/A", members: "100K", snippet: "" },
    { id: 16, title: "Wind Breaker", img: "https://cdn.myanimelist.net/images/anime/1126/141697l.jpg", type: "TV", eps: "13 eps", score: "N/A", members: "100K", snippet: "" },
  ];

  const topAiring = topAiringRes?.data ? topAiringRes.data.map((anime, index) => ({
    rank: index + 1,
    title: anime.attributes.canonicalTitle,
    score: anime.attributes.averageRating ? (anime.attributes.averageRating / 10).toFixed(2) : "N/A",
    img: anime.attributes.posterImage.large,
    id: anime.id
  })) : fallbackTopAiring;

  const topUpcoming = topUpcomingRes?.data ? topUpcomingRes.data.map((anime, index) => ({
    rank: index + 1,
    title: anime.attributes.canonicalTitle,
    score: anime.attributes.averageRating ? (anime.attributes.averageRating / 10).toFixed(2) : "N/A",
    img: anime.attributes.posterImage.large,
    id: anime.id
  })) : fallbackTopUpcoming;

  const seasonal = seasonalRes?.data ? seasonalRes.data.map((anime) => ({
    id: anime.id,
    title: anime.attributes.canonicalTitle,
    img: anime.attributes.posterImage.large,
    type: anime.attributes.subtype || "TV",
    eps: anime.attributes.episodeCount ? `${anime.attributes.episodeCount} eps` : "? eps",
    score: anime.attributes.averageRating ? (anime.attributes.averageRating / 10).toFixed(2) : "N/A",
    members: anime.attributes.userCount ? (anime.attributes.userCount / 1000).toFixed(0) + 'K' : '0K',
    snippet: anime.attributes.synopsis ? anime.attributes.synopsis.substring(0, 100) + '...' : ''
  })) : fallbackSeasonal;

  // Read mock/AI generated data from local DB
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  let dbData = { reviews: [], news: [], articles: [], recommendations: [] };
  try {
    dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch(e) {
    console.error("Failed to read db.json");
  }

  const reviews = dbData.reviews;
  const news = dbData.news;
  const articles = dbData.articles;
  const recommendations = dbData.recommendations;

  return (
    <div className="main-wrapper">
      <div className="left-col">
        {/* Top Airing */}
        <div className="side-header">Top Airing Anime</div>
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
        <div className="view-more"><a href="#">More</a></div>

        {/* Top Upcoming */}
        <div className="side-header" style={{marginTop: "20px"}}>Top Upcoming Anime</div>
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
            {seasonal.map((anime) => (
              <div key={anime.id} className="anime-box">
                <div className="anime-box-title"><a href={`/anime/${anime.id}`}>{anime.title}</a></div>
                <a href={`/anime/${anime.id}`}><img src={anime.img} alt={anime.title} className="anime-box-img" /></a>
                <div className="anime-box-meta">
                  {anime.type} - {anime.eps}
                </div>
              </div>
            ))}
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
