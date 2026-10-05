import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CATEGORY_SLUG = "latest-anime-reviews";
const CATEGORY_LABEL = "Latest Anime Reviews";
const CONTENT_DIR = path.join(process.cwd(), "content", "articles", CATEGORY_SLUG);

export const metadata = {
  title: "Latest Anime Reviews | WeebHQ",
  description: "Read the latest in-depth anime reviews on WeebHQ. Ratings, analysis, and spoiler-free verdicts for the newest anime seasons.",
  alternates: { canonical: "https://weebhq.com/articles/latest-anime-reviews" },
};

function ratingColor(r) {
  if (!r) return "var(--mal-blue, #2e51a2)";
  if (r >= 8.5) return "#1a9e50";
  if (r >= 7)   return "#2e51a2";
  if (r >= 5)   return "#c77c00";
  return "#b02020";
}

export default function LatestAnimeReviews() {
  let articles = [];
  try {
    if (fs.existsSync(CONTENT_DIR)) {
      const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
      articles = files.map((filename) => {
        const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf8");
        const { data } = matter(raw);
        return {
          slug:       filename.replace(".md", ""),
          title:      data.title      || "Untitled",
          anime_title:data.anime_title|| null,
          anime_id:   data.anime_id   || null,
          season:     data.season     || null,
          author:     data.author     || "WeebHQ",
          published_at: data.published_at || "",
          cover_image: data.cover_image || null,
          rating:     typeof data.rating === "number" ? data.rating : null,
          tags:       Array.isArray(data.tags) ? data.tags : [],
          description:data.description || "",
          featured:   data.featured   || false,
          status:     data.status     || "published",
        };
      })
      .filter((a) => a.status === "published")
      .sort((a, b) => (b.published_at > a.published_at ? 1 : -1));
    }
  } catch (e) {
    console.error("Failed to read articles", e);
  }

  const featured = articles.filter((a) => a.featured);
  const rest     = articles.filter((a) => !a.featured);

  return (
    <div className="main-wrapper">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="left-col" style={{ width: "700px", flex: "none" }}>
        <div className="news-top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className="news-section-title">{CATEGORY_LABEL}</h1>
            <div className="breadcrumbs">
              <a href="/">Home</a> &gt; <a href="/articles">Articles</a> &gt; {CATEGORY_LABEL}
            </div>
          </div>
        </div>

        <div className="mal-news-tabs">
          <span className="active">All Reviews</span>
          <span>Featured</span>
          <span>Top Rated</span>
        </div>

        {articles.length === 0 && (
          <div style={{ padding: "20px", color: "#888", fontSize: "13px", marginTop: "10px",
            backgroundColor: "var(--mal-bg-darker)", border: "1px solid var(--mal-border)" }}>
            No reviews published yet. Check back soon!
          </div>
        )}

        {/* Featured articles */}
        {featured.map((article) => (
          <div key={article.slug} style={{
            display: "flex", gap: "14px", marginTop: "14px", padding: "14px",
            backgroundColor: "var(--mal-bg-darker)", border: "1px solid var(--mal-border)",
            borderLeft: "3px solid #1a9e50",
          }}>
            {article.cover_image && (
              <a href={`/articles/${CATEGORY_SLUG}/${article.slug}`} style={{ flexShrink: 0 }}>
                <img src={article.cover_image} alt={article.anime_title || article.title}
                  style={{ width: "90px", height: "130px", objectFit: "cover", borderRadius: "3px", display: "block" }} />
              </a>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "10px", color: "#1a9e50", fontWeight: "bold", marginBottom: "4px", letterSpacing: "1px" }}>
                ★ FEATURED REVIEW
              </div>
              <a href={`/articles/${CATEGORY_SLUG}/${article.slug}`}
                style={{ fontSize: "15px", fontWeight: "bold", color: "var(--mal-link)", display: "block", marginBottom: "6px", lineHeight: 1.3 }}>
                {article.title}
              </a>
              <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px" }}>
                {article.anime_title && <span>{article.anime_title}</span>}
                {article.season && <span> · {article.season}</span>}
              </div>
              {article.description && (
                <div style={{ fontSize: "12px", color: "#bbb", lineHeight: 1.5, marginBottom: "8px" }}>
                  {article.description}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                <div style={{ fontSize: "11px", color: "#666" }}>
                  {article.published_at} by <a href="#" style={{ color: "var(--mal-link)" }}>{article.author}</a>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {article.rating != null && (
                    <span style={{ backgroundColor: ratingColor(article.rating), color: "#fff",
                      padding: "3px 10px", borderRadius: "3px", fontWeight: "bold", fontSize: "14px" }}>
                      {article.rating.toFixed(1)}
                    </span>
                  )}
                  <a href={`/articles/${CATEGORY_SLUG}/${article.slug}`}
                    style={{ fontSize: "11px", color: "var(--mal-link)", border: "1px solid var(--mal-border)", padding: "2px 8px", borderRadius: "2px" }}>
                    Read Review »
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* All other articles */}
        <div style={{ marginTop: "10px" }}>
          {rest.map((article) => (
            <div key={article.slug} style={{
              display: "flex", gap: "12px", marginBottom: "10px", padding: "12px",
              backgroundColor: "var(--mal-bg-darker)", border: "1px solid var(--mal-border)",
            }}>
              {article.cover_image ? (
                <a href={`/articles/${CATEGORY_SLUG}/${article.slug}`} style={{ flexShrink: 0 }}>
                  <img src={article.cover_image} alt={article.anime_title || article.title}
                    style={{ width: "70px", height: "100px", objectFit: "cover", borderRadius: "3px", display: "block" }} />
                </a>
              ) : (
                <div style={{ width: "70px", height: "100px", flexShrink: 0,
                  backgroundColor: "var(--mal-bg-card, #111)", border: "1px solid var(--mal-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "9px", color: "#555", textAlign: "center", borderRadius: "3px" }}>
                  No Image
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px",
                  borderBottom: "1px solid var(--mal-border)", paddingBottom: "6px", marginBottom: "6px" }}>
                  <div>
                    <a href={`/articles/${CATEGORY_SLUG}/${article.slug}`}
                      style={{ fontSize: "13px", fontWeight: "bold", color: "var(--mal-link)" }}>
                      {article.title}
                    </a>
                    {article.tags.slice(0, 2).map((t, i) => (
                      <span key={i} className="mal-tag" style={{ marginLeft: "5px" }}>{t}</span>
                    ))}
                  </div>
                  {article.rating != null && (
                    <span style={{ flexShrink: 0, backgroundColor: ratingColor(article.rating), color: "#fff",
                      padding: "3px 10px", borderRadius: "3px", fontWeight: "bold", fontSize: "14px" }}>
                      {article.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                {article.description && (
                  <div style={{ fontSize: "12px", color: "#bbb", lineHeight: 1.5, marginBottom: "6px" }}>
                    {article.description}{" "}
                    <a href={`/articles/${CATEGORY_SLUG}/${article.slug}`} style={{ color: "var(--mal-link)" }}>read more</a>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                  <span style={{ color: "#666" }}>
                    {article.published_at}{article.author ? " by " : ""}
                    {article.author && <a href="#" style={{ color: "var(--mal-link)" }}>{article.author}</a>}
                  </span>
                  <a href={`/articles/${CATEGORY_SLUG}/${article.slug}`}
                    style={{ color: "var(--mal-link)", border: "1px solid var(--mal-border)", padding: "2px 8px", borderRadius: "2px", fontSize: "11px" }}>
                    Read Review »
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>{/* end left-col */}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <div className="right-col" style={{ flex: 1, minWidth: "220px" }}>

        <div className="side-header">Search Reviews</div>
        <div className="sidebar-search">
          <input type="text" placeholder="Search reviews..."
            style={{ width: "100%", padding: "5px", backgroundColor: "var(--mal-bg-darker)",
              border: "1px solid var(--mal-border)", color: "var(--mal-text)" }} />
        </div>

        {articles.length > 0 && (
          <>
            <div className="side-header" style={{ marginTop: "16px" }}>Top Rated</div>
            <div style={{ backgroundColor: "var(--mal-bg-darker)", border: "1px solid var(--mal-border)", padding: "8px" }}>
              {[...articles].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5).map((a, i) => (
                <div key={i} style={{ marginBottom: "8px", paddingBottom: "8px", fontSize: "12px",
                  borderBottom: i < 4 ? "1px solid var(--mal-border)" : "none" }}>
                  <a href={`/articles/${CATEGORY_SLUG}/${a.slug}`} style={{ color: "var(--mal-link)" }}>{a.title}</a>
                  {a.rating != null && (
                    <span style={{ float: "right", fontWeight: "bold", color: ratingColor(a.rating) }}>
                      {a.rating.toFixed(1)}
                    </span>
                  )}
                  <div style={{ color: "#666", fontSize: "10px", marginTop: "2px", clear: "both" }}>{a.published_at}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="side-header" style={{ marginTop: "16px" }}>Tags</div>
        <div className="trending-tags">
          <span className="mal-tag">Anime Review</span>
          <span className="mal-tag">Fall 2026</span>
          <span className="mal-tag">Summer 2026</span>
          <span className="mal-tag">Action</span>
          <span className="mal-tag">Comedy</span>
          <span className="mal-tag">Drama</span>
        </div>

        <div className="side-header" style={{ marginTop: "16px" }}>Article Categories</div>
        <div style={{ backgroundColor: "var(--mal-bg-darker)", border: "1px solid var(--mal-border)", padding: "10px", fontSize: "12px" }}>
          <div style={{ marginBottom: "6px" }}>
            <a href="/articles/latest-anime-reviews" style={{ color: "var(--mal-link)", fontWeight: "bold" }}>Latest Anime Reviews</a>
          </div>
          <div style={{ marginBottom: "6px" }}>
            <a href="/articles/anime-news" style={{ color: "var(--mal-link)" }}>Anime &amp; Manga News</a>
          </div>
          <div>
            <a href="/articles/recommendations" style={{ color: "var(--mal-link)" }}>Recommendations</a>
          </div>
        </div>

      </div>
    </div>
  );
}
