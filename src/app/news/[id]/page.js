export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }];
}

export default function NewsDetail({ params }) {
  return (
    <div className="main-wrapper news-detail-page">
      
      {/* Top Breadcrumb Bar */}
      <div className="news-top-bar">
        <h2 className="news-section-title">Anime & Manga News</h2>
        <div className="breadcrumbs">
          Top &gt; News &gt; Light Novel 'Maid nara Touzen desu...'
        </div>
      </div>

      <div style={{display: "flex"}}>
        
        {/* Left Main Content */}
        <div className="news-main-col">
          <h1 className="news-headline">Light Novel 'Maid nara Touzen desu. Nureginu wo Kiserareta Bannou Maid-san wa Tabi ni Deru Koto ni shimashita' Gets TV Anime</h1>
          
          <div className="news-meta-bar">
            <div className="news-author-info">
              by <a href="#">Syaronia</a><br/>
              <span>Yesterday, 8:43 PM | <a href="#">9 comments</a></span>
            </div>
            <div className="news-socials">
              <a href="#">F</a> <a href="#">X</a> <a href="#">R</a> <a href="#">T</a>
            </div>
          </div>
          
          <div className="news-content-body">
            <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="News Image" className="news-float-img" />
            <p>Publishing company Earth Star Entertainment announced a television anime adaptation of Oosaki Mihomi's <i>Maid nara Touzen desu. Nureginu wo Kiserareta Bannou Maid-san wa Tabi ni Deru Koto ni shimashita</i> light novel on Thursday, revealing an announcement promo.</p>
            
            <p>Mihomi began penning the fantasy adventure story on the Shousetsuka ni Narou website in September 2021. Earth Star Entertainment began publishing the light novel under its Earth Star Novel imprint in July 2022, featuring illustrations by Kinta.</p>
            
            <p><strong>Synopsis:</strong><br/>
            For plain little Nina, working as a maid in the house of Count Phitosset is her whole world—until a false accusation has her swept out on the streets. Jobless and with nowhere left to turn, Nina decides to set out on her very first solo journey. But Nina isn't just any maid—she's a supermaid! Her talents quickly prove indispensable to the people she meets during her travels...</p>
            
            <p><strong>Announcement:</strong></p>
            <div className="news-video-placeholder">
              <div className="play-btn-fake">▶ Watch on YouTube</div>
            </div>
            
            <p>Source: <a href="#">Official Site</a></p>
            <p>Maid nara Touzen desu. on <a href="#">MAL</a></p>
          </div>
          
          <div className="news-tags">
            <a href="#" className="tag-pill">Light Novels</a>
            <a href="#" className="tag-pill">New Anime</a>
          </div>

          <div className="news-comments-section">
            <div className="comments-header">
              <h3>Recent Comments</h3>
              <a href="#">9 Comments</a>
            </div>
            {/* Comment 1 */}
            <div className="comment-item">
              <div className="comment-text">
                <a href="#" className="comment-author">user1</a> Maybe they are making up with overall sales including non-domestic income.<br/>
                <br/>
                I do know lots of companies in japan do not care about foreigners, even when they open the market and multiply their income by 10...
              </div>
              <div className="comment-meta">5 hours ago by <a href="#">FattyChungus</a></div>
            </div>
            {/* Comment 2 */}
            <div className="comment-item">
              <div className="comment-text">
                <a href="#" className="comment-author">user2</a> Well this light novel is not published by Kadokawa so there's that...
              </div>
              <div className="comment-meta">6 hours ago by <a href="#">HoloFan</a></div>
            </div>
            {/* Comment 3 */}
            <div className="comment-item">
              <div className="comment-text">
                <a href="#" className="comment-author">user3</a> safe safe safe safe safe safe safe
              </div>
              <div className="comment-meta">Today, 8:14 AM by <a href="#">SafeMaster</a></div>
            </div>
          </div>
          
          <div className="news-socials-bottom">
              <a href="#">F</a> <a href="#">X</a> <a href="#">R</a> <a href="#">T</a>
          </div>

          <div className="related-db-entries">
            <h3>Related Database Entries</h3>
            <div className="db-entry-item">
              <strong>Anime:</strong> <a href="#">Maid nara Touzen desu.</a>
            </div>
            <div className="db-entry-item">
              <strong>Manga:</strong> <a href="#">Maid nara Touzen desu. Nureginu wo Kiserareta Bannou Maid-san wa Tabi ni Deru Koto ni shimashita</a>
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="news-sidebar">
          
          <div className="sidebar-section">
            <div className="sidebar-header">Search News</div>
            <input type="text" placeholder="Search..." className="sidebar-search" />
          </div>

          <div className="sidebar-section">
            <div className="sidebar-header">Related News</div>
            <div className="sidebar-news-item">
              <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="thumb"/>
              <div className="s-news-info">
                <a href="#">Light Novel 'Tensei shite Oshikake wa...' Gets TV Anime</a>
                <span>Mar 5, 2026 | 4 Comments</span>
              </div>
            </div>
            <div className="sidebar-news-item">
              <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="thumb"/>
              <div className="s-news-info">
                <a href="#">Light Novel 'Isekai de Mofumofu Nadenade suru Tame ni...' TV Anime Adaptation</a>
                <span>Mar 3, 2026 | 10 Comments</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-header">New Anime <a href="#" style={{float:"right", fontSize:"10px", fontWeight:"normal"}}>More</a></div>
            <div className="sidebar-news-item">
              <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="thumb"/>
              <div className="s-news-info">
                <a href="#">Light Novel 'Maid nara Touzen desu...' Gets TV Anime</a>
                <span>Yesterday | 9 Comments</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-header">Fall 2026 <a href="#" style={{float:"right", fontSize:"10px", fontWeight:"normal"}}>More</a></div>
            <div className="sidebar-news-item">
              <img src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="thumb"/>
              <div className="s-news-info">
                <a href="#">Fall 2026 Simulcast List</a>
                <span>Yesterday | 5 Comments</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-header">Trending Tags <a href="#" style={{float:"right", fontSize:"10px", fontWeight:"normal"}}>All Tags</a></div>
            <div className="trending-tags-container">
              <a href="#">Preview</a>
              <a href="#">New Anime</a>
              <a href="#">More Info</a>
              <a href="#">Light Novels</a>
              <a href="#">Fall 2026</a>
              <a href="#">Winter 2027</a>
              <a href="#">Spring 2027</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
