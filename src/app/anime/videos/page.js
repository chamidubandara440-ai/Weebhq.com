export default function AnimeVideos() {
  const trailers = [
    { title: "Yamato yo, Towa ni: Rebel 3199", eps: "Episode 22", vid: "7J0J_0n1T_Y", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx143076-oR17Q3eOofmZ.jpg" },
    { title: "Jibaku Shounen Hanako-kun 2", eps: "Episode 3", vid: "z9lX5o0iYEE", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx159322-N9533X0BOnZf.jpg" },
    { title: "Yami Shibai 16", eps: "Episode 13", vid: "Vj6_P3z3NHE", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx159322-N9533X0BOnZf.jpg" },
    { title: "Sousou no Frieren 2nd Season", eps: "Episode 1", vid: "M6_xG_s8uNw", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx162670-6E2j1Wc57D2C.jpg" },
    { title: "InuYasha: Kanketsu-hen", eps: "Episode 26", vid: "x3OZb7nK-H4", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx6811-Q8d2uE0N9qF4.jpg" },
    { title: "InuYasha", eps: "Episode 167", vid: "2h09YlCq420", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx249-qHEnuAivlF5R.jpg" }
  ];

  return (
    <div className="main-wrapper" style={{ display: 'block' }}>
      <div className="news-top-bar" style={{marginBottom: 0}}>
        <h2 className="news-section-title">Episode Videos</h2>
        <div className="breadcrumbs">Top &gt; Watch</div>
      </div>
      
      <div className="mal-videos-tabs">
        <span className="active">Episodes</span>
        <span>Trailers</span>
      </div>
      <div className="mal-videos-subtabs">
        <span className="active">Just Added</span>
        <span>Most Popular</span>
        <span className="hide-blocked"><input type="checkbox"/> Hide blocked videos</span>
      </div>

      <div className="mal-videos-grid">
        {trailers.map((t, i) => (
          <div key={i} className="mal-video-card">
            <div className="mal-video-thumb">
              <img src={t.img} alt={t.title} />
              <div className="mal-video-overlay">
                <div className="mal-video-icon">▶</div>
                <div className="mal-video-not-avail">Not Available<br/>in Your Country</div>
                <div className="mal-video-eps-labels">
                  <div>{t.eps} <span style={{color: "gold"}}>👑</span></div>
                  <div>{t.eps.replace(/\d+/, m => parseInt(m)-1)} <span style={{color: "gold"}}>👑</span></div>
                </div>
              </div>
            </div>
            <div className="mal-video-title-row">
              <div className="mal-video-title">{t.title}</div>
              <div className="mal-review-add">add</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
