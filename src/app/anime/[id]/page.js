export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }];
}

export default function AnimeDetail({ params }) {
  return (
    <div className="main-wrapper anime-detail-page">
      <h1 className="anime-title-h1">
        <strong>Steel Ball Run: JoJo no Kimyou na Bouken</strong>
        <span style={{fontSize: "12px", color: "#888", fontWeight: "normal", display: "block", marginTop: "2px"}}>Steel Ball Run: JoJo's Bizarre Adventure</span>
      </h1>
      
      <div className="anime-tabs">
        <a href="#" className="active">Details</a>
        <a href="#">Characters & Staff</a>
        <a href="#">Episodes</a>
        <a href="#">Videos</a>
        <a href="#">Stats</a>
        <a href="#">Reviews</a>
        <a href="#">Recommendations</a>
        <a href="#">Interest Stacks</a>
        <a href="#">News</a>
        <a href="#">Forum</a>
        <a href="#">Clubs</a>
        <a href="#">Pictures</a>
      </div>

      <div style={{display: "flex"}}>
        {/* Left Sidebar */}
        <div className="anime-left-col">
          <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="Poster" className="anime-poster" />
          <button className="add-list-btn notify-btn" style={{backgroundColor: "#2e51a2", borderColor: "#1d439b", marginBottom: "5px"}}>Notify me when it starts!</button>
          <button className="add-list-btn">Watch Episodes</button>
          
          <div className="left-actions">
            <a href="#">Add to My List</a>
            <a href="#">Add to Favorites</a>
          </div>
          
          <div className="left-socials">
            <a href="#">F</a> <a href="#">X</a> <a href="#">R</a> <a href="#">T</a>
          </div>

          <div className="anime-info-block">
            <h2>Alternative Titles</h2>
            <div className="info-item"><span className="dark-label">English:</span> JoJo's Bizarre Adventure Part 7: Steel Ball Run</div>
            <div className="info-item"><span className="dark-label">Japanese:</span> スティール・ボール・ラン</div>
            
            <h2>Information</h2>
            <div className="info-item"><span className="dark-label">Type:</span> <a href="#">ONA</a></div>
            <div className="info-item"><span className="dark-label">Episodes:</span> Unknown</div>
            <div className="info-item"><span className="dark-label">Status:</span> Currently Airing</div>
            <div className="info-item"><span className="dark-label">Aired:</span> Mar 09, 2026 to ?</div>
            <div className="info-item"><span className="dark-label">Producers:</span> <a href="#">Warner Bros. Japan</a></div>
            <div className="info-item"><span className="dark-label">Studios:</span> <a href="#">David Production</a></div>
            <div className="info-item"><span className="dark-label">Source:</span> Manga</div>
            <div className="info-item"><span className="dark-label">Genres:</span> Action, Adventure, Mystery, Supernatural</div>
            
            <h2>Statistics</h2>
            <div className="info-item"><span className="dark-label">Score:</span> 9.06</div>
            <div className="info-item"><span className="dark-label">Ranked:</span> #5</div>
            <div className="info-item"><span className="dark-label">Popularity:</span> #1212</div>
            <div className="info-item"><span className="dark-label">Members:</span> 240,243</div>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="anime-right-col">
          <div className="stats-banner">
            <div className="score-box">
              <div className="score-label">SCORE</div>
              <div className="score-value">N/A</div>
              <div className="score-users">- users</div>
            </div>
            <div className="other-stats">
              <div className="stat-row">
                <span className="stat-item">Ranked <strong>N/A</strong></span>
                <span className="stat-item">Popularity <strong>#1212</strong></span>
                <span className="stat-item">Members <strong>240,243</strong></span>
              </div>
              <div className="stat-subrow">
                <span>ONA</span> | <span>David Production</span>
              </div>
            </div>
            <div className="anime-trailer">
                <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" style={{width: "140px", height: "80px", objectFit: "cover", border: "1px solid #333"}} />
            </div>
          </div>
          
          <h2>Synopsis</h2>
          <p className="synopsis-text">
            In the American Old West, the world's greatest race is about to begin. Thousands line up in San Diego to travel over six thousand kilometers for a chance to win the grand prize of fifty million dollars. With the era of the horse reaching its end, contestants are allowed to use any kind of vehicle they wish. Competitors will have to endure grueling conditions, traveling up to a hundred kilometers a day through uncharted wastelands. The Steel Ball Run is truly a one-of-a-kind event.
            <br/><br/>
            The youthful Johnny Joestar, a crippled former horse racer, has come to San Diego to watch the start of the race. There he encounters Gyro Zeppeli, a racer with two steel balls at his waist instead of a gun. Johnny witnesses Gyro using one of his steel balls to unleash a fantastical power, compelling a man to fire his gun at himself during a duel. In the midst of the action, Johnny happens to touch the steel ball and feels a power surging through his legs, allowing him to stand up for the first time in two years. Vowing to find the secret of the steel balls, Johnny decides to compete in the race, and so begins his bizarre adventure across America on the Steel Ball Run.
          </p>

          <h2>Characters & Voice Actors</h2>
          <div className="character-grid">
            {/* Character Item 1 */}
            <div className="char-item">
              <div className="char-left">
                <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="Gyro" />
                <div className="char-info">
                  <a href="#">Zeppeli, Gyro</a>
                  <span>Main</span>
                </div>
              </div>
              <div className="char-right">
                <div className="va-info">
                  <a href="#">Amami, Yuuki</a>
                  <span>Japanese</span>
                </div>
                <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="VA" />
              </div>
            </div>
            {/* Character Item 2 */}
            <div className="char-item">
              <div className="char-left">
                <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="Johnny" />
                <div className="char-info">
                  <a href="#">Joestar, Johnny</a>
                  <span>Main</span>
                </div>
              </div>
              <div className="char-right">
                <div className="va-info">
                  <a href="#">Kaji, Yuki</a>
                  <span>Japanese</span>
                </div>
                <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="VA" />
              </div>
            </div>
          </div>

          <h2 id="reviews">Reviews</h2>
          <div className="review-block">
            <div className="review-header-bar">
              <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" className="reviewer-avatar" alt="Reviewer" />
              <div className="reviewer-info">
                <a href="#">Lawliet</a>
                <span className="review-tag recommended">Recommended</span>
              </div>
            </div>
            <div className="review-body">
              I am from the future (episode 2) I am sorry to say but we still have the trash CGI.<br/><br/>
              This review needs more information!<br/>
              Here are a few ideas of what you may want to include:<br/><br/>
              Is the story unique? If it was predictable, did you enjoy it anyway because you like this genre/set up?<br/>
              Do you think the art style is fitting for the story?<br/>
              Were the characters well rounded? Did they have flaws and strengths, or were they unusually strong/smart/stupid?
            </div>
          </div>

          {/* Additional Sections for Seasonal / Full Page */}
          <h2>Interest Stacks</h2>
          <div className="interest-stacks-grid">
            <div className="stack-card">
              <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="Stack" />
              <div className="stack-info">
                <a href="#">Worthwhile Fall 2026 Anime</a>
                <div className="stack-meta">by AnimeWolf<br/>30 Entries · 2 Restacks</div>
              </div>
            </div>
            <div className="stack-card">
              <img src="https://cdn.myanimelist.net/images/anime/1792/138022l.jpg" alt="Stack" />
              <div className="stack-info">
                <a href="#">Masterpieces of Anime</a>
                <div className="stack-meta">by Azu222<br/>50 Entries · 200 Restacks</div>
              </div>
            </div>
          </div>

          <h2>Recommendations</h2>
          <div className="recommendations-grid">
            <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="Rec 1" />
            <img src="https://cdn.myanimelist.net/images/anime/1792/138022l.jpg" alt="Rec 2" />
            <img src="https://cdn.myanimelist.net/images/anime/1435/141753l.jpg" alt="Rec 3" />
            <img src="https://cdn.myanimelist.net/images/anime/1171/141703l.jpg" alt="Rec 4" />
            <img src="https://cdn.myanimelist.net/images/anime/1812/134736l.jpg" alt="Rec 5" />
            <img src="https://cdn.myanimelist.net/images/anime/1054/142323l.jpg" alt="Rec 6" />
          </div>

          <h2>Recent News</h2>
          <div className="recent-news-list">
            <div className="news-row">
              <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="News" />
              <div className="news-content">
                <a href="#" className="news-title">Fall 2026 Simulcast List</a>
                <p>In this thread, you'll find a comprehensive list of television anime acquired for simulcast release during the Fall 2026 season...</p>
                <div className="news-meta">Yesterday, 10:50 AM by Snow | Discuss (5 comments)</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
