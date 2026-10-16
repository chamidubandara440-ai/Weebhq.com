"use client";

import { useState, useMemo } from "react";

const GENRES_DATA = [
  {
    id: "action",
    name: "Action",
    emoji: "⚔️",
    color: "#ef4444",
    desc: "High-octane battles, intense martial arts, adrenaline-fueled fights, and epic conflicts.",
    notable: ["Attack on Titan", "Demon Slayer", "Jujutsu Kaisen", "Solo Leveling"],
    count: "4,250+"
  },
  {
    id: "adventure",
    name: "Adventure",
    emoji: "🗺️",
    color: "#f59e0b",
    desc: "Epic journeys, exploration of vast uncharted fantasy worlds, quests, and treasures.",
    notable: ["One Piece", "Hunter x Hunter", "Frieren", "Made in Abyss"],
    count: "3,890+"
  },
  {
    id: "fantasy",
    name: "Fantasy",
    emoji: "🧙‍♂️",
    color: "#8b5cf6",
    desc: "Magic systems, mythical creatures, dragons, ancient lore, kingdoms, and sorcery.",
    notable: ["Mushoku Tensei", "Re:Zero", "Fullmetal Alchemist", "Black Clover"],
    count: "3,420+"
  },
  {
    id: "comedy",
    name: "Comedy",
    emoji: "🤣",
    color: "#10b981",
    desc: "Hilarious gags, witty banter, absurd parodies, lighthearted humor, and chaotic fun.",
    notable: ["KonoSuba", "Gintama", "Bocchi the Rock!", "Saiki K."],
    count: "3,110+"
  },
  {
    id: "drama",
    name: "Drama",
    emoji: "🎭",
    color: "#ec4899",
    desc: "Deep emotional narratives, complex human relationships, tragedy, and character growth.",
    notable: ["A Silent Voice", "Your Lie in April", "Clannad", "Oshi no Ko"],
    count: "2,980+"
  },
  {
    id: "scifi",
    name: "Sci-Fi",
    emoji: "🚀",
    color: "#06b6d4",
    desc: "Futuristic technology, space exploration, artificial intelligence, time travel, and cybernetics.",
    notable: ["Steins;Gate", "Cyberpunk: Edgerunners", "Cowboy Bebop", "Psycho-Pass"],
    count: "2,450+"
  },
  {
    id: "romance",
    name: "Romance",
    emoji: "💖",
    color: "#f43f5e",
    desc: "Heartwarming love stories, emotional confessions, school crushes, and relationship drama.",
    notable: ["Kaguya-sama", "Horimiya", "Toradora!", "My Dress-Up Darling"],
    count: "2,670+"
  },
  {
    id: "supernatural",
    name: "Supernatural",
    emoji: "👻",
    color: "#a855f7",
    desc: "Ghosts, spirits, deities, occult phenomena, curses, and beings beyond human comprehension.",
    notable: ["Bleach", "Mob Psycho 100", "Noragami", "Death Note"],
    count: "2,380+"
  },
  {
    id: "mystery",
    name: "Mystery",
    emoji: "🔍",
    color: "#3b82f6",
    desc: "Detective investigations, mind-bending puzzles, whodunits, conspiracies, and secret truths.",
    notable: ["Monster", "Detective Conan", "The Promised Neverland", "Erased"],
    count: "1,720+"
  },
  {
    id: "psychological",
    name: "Psychological",
    emoji: "🧠",
    color: "#6366f1",
    desc: "Mind games, moral dilemmas, psychological warfare, mental manipulation, and existential depth.",
    notable: ["Death Note", "Code Geass", "Classroom of the Elite", "Neon Genesis Evangelion"],
    count: "1,450+"
  },
  {
    id: "slice_of_life",
    name: "Slice of Life",
    emoji: "☕",
    color: "#14b8a6",
    desc: "Cozy daily life experiences, relaxing atmospheres, school clubs, friendship, and wholesome moments.",
    notable: ["Laid-Back Camp", "K-On!", "Barakamon", "Non Non Biyori"],
    count: "2,190+"
  },
  {
    id: "sports",
    name: "Sports",
    emoji: "⚽",
    color: "#eab308",
    desc: "High-stakes athletic tournaments, teamwork, passionate rivalries, and training arcs.",
    notable: ["Haikyuu!!", "Blue Lock", "Kuroko's Basketball", "Hajime no Ippo"],
    count: "940+"
  },
  {
    id: "horror",
    name: "Horror",
    emoji: "🩸",
    color: "#dc2626",
    desc: "Chilling dread, psychological terror, gore, monsters, survival fear, and eerie atmosphere.",
    notable: ["Another", "Tokyo Ghoul", "Parasyte", "Higurashi"],
    count: "870+"
  },
  {
    id: "thriller",
    name: "Thriller",
    emoji: "⚡",
    color: "#ea580c",
    desc: "Fast-paced tension, dangerous countdowns, high stakes, cliffhangers, and sudden twists.",
    notable: ["Summertime Render", "Link Click", "Banana Fish", "Zankyou no Terror"],
    count: "920+"
  },
  {
    id: "isekai",
    name: "Isekai",
    emoji: "🌀",
    color: "#0284c7",
    desc: "Reincarnation or transportation into alternate fantasy video-game worlds with overpowered abilities.",
    notable: ["That Time I Got Reincarnated as a Slime", "Overlord", "Eminence in Shadow", "No Game No Life"],
    count: "1,150+"
  },
  {
    id: "mecha",
    name: "Mecha",
    emoji: "🤖",
    color: "#64748b",
    desc: "Giant piloted combat robots, planetary warfare, futuristic militarism, and space combat.",
    notable: ["Gundam: Iron-Blooded Orphans", "Gurren Lagann", "Code Geass", "86 Eighty-Six"],
    count: "1,310+"
  },
  {
    id: "music",
    name: "Music",
    emoji: "🎵",
    color: "#d946ef",
    desc: "Idol performances, classical orchestras, rock bands, passion for instruments, and stage presence.",
    notable: ["Your Lie in April", "Bocchi the Rock!", "Beck: Mongolian Chop Squad", "Given"],
    count: "780+"
  },
  {
    id: "historical",
    name: "Historical",
    emoji: "🏯",
    color: "#78350f",
    desc: "Feudal Japan, ancient empires, samurai codes, historical wars, and authentic period eras.",
    notable: ["Vinland Saga", "Dororo", "Kingdom", "Rurouni Kenshin"],
    count: "1,080+"
  }
];

const STUDIOS_DATA = [
  {
    id: "mappa",
    name: "MAPPA",
    founded: "2011",
    hq: "Suginami, Tokyo",
    color: "#ef4444",
    desc: "Renowned for ground-breaking, cinematic action animation, intense fight choreography, and top-tier modern visual spectacles.",
    masterpieces: ["Jujutsu Kaisen", "Chainsaw Man", "Attack on Titan: The Final Season", "Vinland Saga Season 2"],
    icon: "MAPPA"
  },
  {
    id: "ufotable",
    name: "Ufotable",
    founded: "2000",
    hq: "Suginami, Tokyo",
    color: "#8b5cf6",
    desc: "The pinnacle of hybrid 2D and 3D digital effects, breathtaking particle lighting, and god-tier sword combat animation.",
    masterpieces: ["Demon Slayer: Kimetsu no Yaiba", "Fate/stay night: Heaven's Feel", "Fate/Zero", "Kara no Kyoukai"],
    icon: "ufotable"
  },
  {
    id: "kyoto-animation",
    name: "Kyoto Animation",
    founded: "1981",
    hq: "Uji, Kyoto",
    color: "#38bdf8",
    desc: "Celebrated worldwide for exquisite character acting, tear-jerking emotional depth, and unrivaled visual attention to detail.",
    masterpieces: ["Violet Evergarden", "A Silent Voice", "Hyouka", "Sound! Euphonium"],
    icon: "KyoAni"
  },
  {
    id: "madhouse",
    name: "Madhouse",
    founded: "1972",
    hq: "Nakano, Tokyo",
    color: "#10b981",
    desc: "A legendary powerhouse responsible for shaping anime history with some of the greatest critically acclaimed masterpieces of all time.",
    masterpieces: ["Frieren: Beyond Journey's End", "Hunter x Hunter (2011)", "Death Note", "One Punch Man (Season 1)"],
    icon: "MADHOUSE"
  },
  {
    id: "bones",
    name: "Bones",
    founded: "1998",
    hq: "Suginami, Tokyo",
    color: "#f59e0b",
    desc: "Master of fluid, hand-drawn sakuga combat, dynamic superpowers, and thrilling superhero shounen adaptations.",
    masterpieces: ["Fullmetal Alchemist: Brotherhood", "Mob Psycho 100", "My Hero Academia", "Bungo Stray Dogs"],
    icon: "BONES"
  },
  {
    id: "wit-studio",
    name: "Wit Studio",
    founded: "2012",
    hq: "Musashino, Tokyo",
    color: "#ec4899",
    desc: "Famous for high-speed ODM-gear action, lush artistic backgrounds, and groundbreaking narrative direction.",
    masterpieces: ["Attack on Titan (Seasons 1-3)", "Spy x Family", "Vinland Saga (Season 1)", "Ranking of Kings"],
    icon: "WIT"
  },
  {
    id: "a1-pictures",
    name: "A-1 Pictures",
    founded: "2005",
    hq: "Suginami, Tokyo",
    color: "#06b6d4",
    desc: "An industry titan with diverse productions ranging from blockbuster gaming adaptations to critically adored romance and sci-fi.",
    masterpieces: ["Solo Leveling", "Kaguya-sama: Love Is War", "86 Eighty-Six", "Sword Art Online"],
    icon: "A-1"
  },
  {
    id: "cloverworks",
    name: "CloverWorks",
    founded: "2018",
    hq: "Suginami, Tokyo",
    color: "#f43f5e",
    desc: "Masters of modern aesthetic direction, vibrant slice-of-life charm, expressively animated comedy, and rom-com hits.",
    masterpieces: ["Bocchi the Rock!", "My Dress-Up Darling", "Horimiya", "The Promised Neverland"],
    icon: "CLOVER"
  },
  {
    id: "trigger",
    name: "Studio Trigger",
    founded: "2011",
    hq: "Suginami, Tokyo",
    color: "#fbbf24",
    desc: "Wildly energetic, exaggerated animation styles with neon color palettes, frenetic action, and boundless creative passion.",
    masterpieces: ["Cyberpunk: Edgerunners", "Kill la Kill", "Delicious in Dungeon", "Little Witch Academia"],
    icon: "TRIGGER"
  },
  {
    id: "toei-animation",
    name: "Toei Animation",
    founded: "1948",
    hq: "Nerima, Tokyo",
    color: "#eab308",
    desc: "The historic titan of anime, bringing the world's most recognizable cultural franchises to life for generations.",
    masterpieces: ["One Piece (Wano / Egghead)", "Dragon Ball Super: Broly", "Sailor Moon", "Slam Dunk"],
    icon: "TOEI"
  },
  {
    id: "ghibli",
    name: "Studio Ghibli",
    founded: "1985",
    hq: "Koganei, Tokyo",
    color: "#14b8a6",
    desc: "Oscar-winning visionary cinema by Hayao Miyazaki and Isao Takahata, celebrated globally for wonder, nature, and hand-painted art.",
    masterpieces: ["Spirited Away", "Princess Mononoke", "Howl's Moving Castle", "The Boy and the Heron"],
    icon: "GHIBLI"
  },
  {
    id: "david-production",
    name: "David Production",
    founded: "2007",
    hq: "Kodaira, Tokyo",
    color: "#6366f1",
    desc: "Unmatched stylistic adaptation with iconic sound effects, vibrant color shifting, and explosive combat choreography.",
    masterpieces: ["JoJo's Bizarre Adventure", "Fire Force", "Undead Unluck", "Cells at Work!"],
    icon: "DAVID"
  }
];

export default function AnimeGenresStudiosHub() {
  const [activeTab, setActiveTab] = useState("genres"); // 'genres' | 'studios'
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGenres = useMemo(() => {
    if (!searchQuery.trim()) return GENRES_DATA;
    const q = searchQuery.toLowerCase();
    return GENRES_DATA.filter(
      (g) => g.name.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredStudios = useMemo(() => {
    if (!searchQuery.trim()) return STUDIOS_DATA;
    const q = searchQuery.toLowerCase();
    return STUDIOS_DATA.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.masterpieces.some((m) => m.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  return (
    <div className="whq-browse-page">
      {/* ── 1. Hero Banner ─────────────────────────────────────────── */}
      <div className="whq-browse-hero">
        <div className="whq-browse-hero-inner">
          <div className="whq-browse-hero-content">
            <span className="whq-browse-pill">✨ WEEBHQ DIRECTORY</span>
            <h1 className="whq-browse-title">Anime Genres &amp; Studios Directory</h1>
            <p className="whq-browse-sub">
              Explore thousands of anime categorized by thematic genres, or discover legendary Japanese animation studios and their signature masterworks.
            </p>
          </div>

          <div className="whq-directory-hero-controls">
            {/* Tab Switcher */}
            <div className="whq-directory-tabs">
              <button
                type="button"
                className={`whq-directory-tab ${activeTab === "genres" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("genres");
                  setSearchQuery("");
                }}
              >
                🎭 Anime Genres ({GENRES_DATA.length})
              </button>
              <button
                type="button"
                className={`whq-directory-tab ${activeTab === "studios" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("studios");
                  setSearchQuery("");
                }}
              >
                🏢 Animation Studios ({STUDIOS_DATA.length})
              </button>
            </div>

            {/* Quick Filter Search */}
            <div className="whq-directory-search-wrap">
              <span className="whq-dir-search-icon">🔍</span>
              <input
                type="text"
                placeholder={
                  activeTab === "genres"
                    ? "Filter genres (e.g. Action, Isekai, Romance)..."
                    : "Filter studios (e.g. MAPPA, Ufotable, Bones)..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="whq-directory-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="whq-dir-search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Directory Content Container ──────────────────────────── */}
      <div className="whq-directory-container">
        {/* GENRES VIEW */}
        {activeTab === "genres" && (
          <div className="whq-genres-grid">
            {filteredGenres.map((g) => (
              <div key={g.id} className="whq-genre-card" style={{ "--genre-accent": g.color }}>
                <div className="whq-genre-top-row">
                  <div className="whq-genre-emoji-badge" style={{ background: `${g.color}20`, borderColor: g.color }}>
                    <span>{g.emoji}</span>
                  </div>
                  <span className="whq-genre-count-chip">{g.count} Anime</span>
                </div>

                <h3 className="whq-genre-name">{g.name}</h3>
                <p className="whq-genre-desc">{g.desc}</p>

                <div className="whq-genre-notable-box">
                  <span className="whq-genre-notable-title">Notable Masterpieces:</span>
                  <div className="whq-genre-tags-row">
                    {g.notable.map((n, i) => (
                      <span key={i} className="whq-genre-anime-tag">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>

                <a
                  href={`/anime/catalog?genre=${encodeURIComponent(g.name)}`}
                  className="whq-genre-explore-btn"
                  style={{ "--btn-accent": g.color }}
                >
                  Explore {g.name} Anime ↗
                </a>
              </div>
            ))}
          </div>
        )}

        {/* STUDIOS VIEW */}
        {activeTab === "studios" && (
          <div className="whq-studios-grid">
            {filteredStudios.map((s) => (
              <div key={s.id} className="whq-studio-card" style={{ "--studio-accent": s.color }}>
                <div className="whq-studio-top-row">
                  <div className="whq-studio-monogram" style={{ background: `${s.color}15`, borderColor: `${s.color}50`, color: s.color }}>
                    {s.icon}
                  </div>
                  <div className="whq-studio-meta-pill">
                    <span>Est. {s.founded}</span>
                    <span className="whq-studio-bullet">•</span>
                    <span>{s.hq}</span>
                  </div>
                </div>

                <h3 className="whq-studio-name">{s.name}</h3>
                <p className="whq-studio-desc">{s.desc}</p>

                <div className="whq-studio-works-box">
                  <span className="whq-studio-works-title">Signature Works:</span>
                  <ul className="whq-studio-works-list">
                    {s.masterpieces.map((m, i) => (
                      <li key={i}>
                        <span className="whq-studio-work-dot" style={{ background: s.color }} />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={`/anime/catalog?search=${encodeURIComponent(s.name)}`}
                  className="whq-studio-explore-btn"
                  style={{ "--btn-accent": s.color }}
                >
                  Browse {s.name} Anime ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
