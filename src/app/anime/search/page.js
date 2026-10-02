export default function AnimeSearch() {
  const genres = [
    "Action (5,032)", "Adventure (4,628)", "Avant Garde (1,140)", "Award Winning (258)", "Boys Love (208)",
    "Comedy (8,032)", "Drama (3,188)", "Fantasy (6,300)", "Girls Love (129)", "Gourmet (269)",
    "Horror (613)", "Mystery (1,040)", "Romance (2,319)", "Sci-Fi (3,606)", "Slice of Life (1,302)",
    "Sports (842)", "Supernatural (1,604)", "Suspense (485)"
  ];
  const explicit = ["Ecchi (828)", "Erotica (91)", "Hentai (1,646)"];
  const themes = ["Adult Cast (808)", "Anthropomorphic (1,405)", "CGDCT (264)", "Childcare (80)", "Combat Sports (104)"];

  return (
    <div className="main-wrapper top-anime-page">
      <div className="news-top-bar">
        <h2 className="news-section-title">Anime Search</h2>
        <div className="breadcrumbs">Top &gt; Anime</div>
        <div className="search-letters">
          Upcoming Just Added # A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
        </div>
      </div>

      <div className="search-box-container">
        <input type="text" placeholder="Search Anime..." className="search-input-big" />
        <div className="advanced-search-link"><a href="#">+ Advanced Search</a></div>
      </div>

      <div className="search-category-section">
        <h3>Genres</h3>
        <div className="search-grid">
          {genres.map(g => <div key={g} className="search-grid-item">&gt; <a href="#">{g}</a></div>)}
        </div>
      </div>

      <div className="search-category-section">
        <h3>Explicit Genres</h3>
        <div className="search-grid">
          {explicit.map(g => <div key={g} className="search-grid-item">&gt; <a href="#">{g}</a></div>)}
        </div>
      </div>

      <div className="search-category-section">
        <h3>Themes</h3>
        <div className="search-grid">
          {themes.map(g => <div key={g} className="search-grid-item">&gt; <a href="#">{g}</a></div>)}
        </div>
      </div>
    </div>
  );
}
