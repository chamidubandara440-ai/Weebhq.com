export default function TopAnime() {
  const topList = [
    { rank: 1, img: "https://cdn.myanimelist.net/images/anime/1015/138006l.jpg", title: "Sousou no Frieren", info: "TV (28 eps)\nSep 2023 - Mar 2024\n1,523,937 members", score: "9.14" },
    { rank: 2, img: "https://cdn.myanimelist.net/images/anime/1171/141703l.jpg", title: "Fullmetal Alchemist: Brotherhood", info: "TV (64 eps)\nApr 2009 - Jul 2010\n3,741,365 members", score: "9.11" },
    { rank: 3, img: "https://cdn.myanimelist.net/images/anime/1935/127974l.jpg", title: "Steins;Gate", info: "TV (24 eps)\nApr 2011 - Sep 2011\n2,856,117 members", score: "9.07" },
  ];

  return (
    <div className="main-wrapper top-anime-page">
      <div className="news-top-bar">
        <h2 className="news-section-title">Top Anime</h2>
        <div className="breadcrumbs">Top &gt; Anime &gt; Top Anime</div>
      </div>

      <div className="top-anime-tabs">
        <a href="#" className="active">All Anime</a>
        <a href="#">Top Airing</a>
        <a href="#">Top Upcoming</a>
        <a href="#">Top TV Series</a>
        <a href="#">Top Movies</a>
        <a href="#">Top OVAs</a>
      </div>

      <div className="top-anime-header">
        <h3>Top Anime Series</h3>
      </div>

      <table className="top-anime-table">
        <thead>
          <tr>
            <th className="ta-rank">Rank</th>
            <th className="ta-title">Title</th>
            <th className="ta-score">Score</th>
            <th className="ta-your-score">Your Score</th>
            <th className="ta-status">Status</th>
          </tr>
        </thead>
        <tbody>
          {topList.map((anime) => (
            <tr key={anime.rank}>
              <td className="ta-rank-num">{anime.rank}</td>
              <td className="ta-title-col">
                <img src={anime.img} alt={anime.title} />
                <div className="ta-info">
                  <a href="/anime/1" className="ta-name">{anime.title}</a>
                  <p>{anime.info}</p>
                </div>
              </td>
              <td className="ta-score-col">⭐ {anime.score}</td>
              <td className="ta-your-score-col">⭐ N/A</td>
              <td className="ta-status-col"><button className="btn-add">Add to My List</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
