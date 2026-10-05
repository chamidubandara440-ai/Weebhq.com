import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { notFound } from "next/navigation";

const CATEGORY_SLUG = "latest-anime-reviews";
const CATEGORY_LABEL = "Latest Anime Reviews";
const BASE_URL = "https://weebhq.com";
const CONTENT_DIR = path.join(process.cwd(), "content", "articles", CATEGORY_SLUG);

// ── Helpers ──────────────────────────────────────────────────────────────────
function getAllArticles() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf8");
      const { data } = matter(raw);
      return { ...data, _filename: filename.replace(".md", "") };
    })
    .filter((a) => a.status === "published");
}

function readArticle(slug) {
  const filePath = path.join(CONTENT_DIR, slug + ".md");
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    return { ...data, htmlContent: marked.parse(content) };
  } catch (e) {
    console.error("Failed to read article:", slug, e);
    return null;
  }
}

// ── SEO Metadata ─────────────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = readArticle(slug);
  if (!article) return { title: "Article Not Found | WeebHQ" };

  const canonicalUrl = `${BASE_URL}/articles/${CATEGORY_SLUG}/${slug}`;
  return {
    title: `${article.title} | WeebHQ`,
    description: article.description || article.title,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: article.title,
      description: article.description || article.title,
      url: canonicalUrl,
      type: "article",
      publishedTime: article.published_at,
      modifiedTime: article.updated_at,
      images: article.cover_image ? [{ url: article.cover_image, width: 400, height: 600 }] : [],
      tags: Array.isArray(article.tags) ? article.tags : [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description || article.title,
      images: article.cover_image ? [article.cover_image] : [],
    },
  };
}

// ── Static Params ─────────────────────────────────────────────────────────────
export function generateStaticParams() {
  if (!fs.existsSync(CONTENT_DIR)) return [{ slug: "placeholder" }];
  try {
    const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
    const params = files.map((f) => ({ slug: f.replace(".md", "") }));
    return params.length > 0 ? params : [{ slug: "placeholder" }];
  } catch {
    return [{ slug: "placeholder" }];
  }
}

// ── Rating colour helper ──────────────────────────────────────────────────────
function ratingColor(r) {
  if (!r) return "var(--mal-blue, #2e51a2)";
  if (r >= 8.5) return "#1a9e50";
  if (r >= 7) return "#2e51a2";
  if (r >= 5) return "#c77c00";
  return "#b02020";
}

// ── JSON-LD structured data ───────────────────────────────────────────────────
function ArticleJsonLd({ article, slug }) {
  const canonicalUrl = `${BASE_URL}/articles/${CATEGORY_SLUG}/${slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": canonicalUrl,
        headline: article.title,
        description: article.description || article.title,
        image: article.cover_image || undefined,
        datePublished: article.published_at,
        dateModified: article.updated_at || article.published_at,
        author: { "@type": "Organization", name: article.author || "WeebHQ" },
        publisher: {
          "@type": "Organization",
          name: "WeebHQ",
          url: BASE_URL,
        },
        url: canonicalUrl,
        keywords: Array.isArray(article.tags) ? article.tags.join(", ") : "",
        articleSection: CATEGORY_LABEL,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Articles", item: `${BASE_URL}/articles` },
          {
            "@type": "ListItem",
            position: 3,
            name: CATEGORY_LABEL,
            item: `${BASE_URL}/articles/${CATEGORY_SLUG}`,
          },
          { "@type": "ListItem", position: 4, name: article.title, item: canonicalUrl },
        ],
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── Page Component ────────────────────────────────────────────────────────────
export default async function ArticleDetail({ params }) {
  const { slug } = await params;
  const article = readArticle(slug);
  if (!article || article.status !== "published") notFound();

  const related = getAllArticles()
    .filter((a) => a._filename !== slug)
    .slice(0, 4);

  const tags = Array.isArray(article.tags) ? article.tags : [];
  const rating = typeof article.rating === "number" ? article.rating : null;
  const rColor = ratingColor(rating);

  return (
    <>
      <ArticleJsonLd article={article} slug={slug} />

      <div className="main-wrapper news-detail-page">

        {/* ── Breadcrumb bar ────────────────────────────── */}
        <div className="news-top-bar">
          <h2 className="news-section-title">{CATEGORY_LABEL}</h2>
          <div className="breadcrumbs">
            <a href="/">Home</a> &gt;{" "}
            <a href={`/articles/${CATEGORY_SLUG}`}>{CATEGORY_LABEL}</a> &gt;{" "}
            {article.anime_title || article.title}
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>

          {/* ── Main content column ───────────────────── */}
          <div className="news-main-col" style={{ flex: "1 1 600px", minWidth: 0 }}>

            {/* Hero block: cover + title + meta */}
            <div style={{ display: "flex", gap: "18px", marginBottom: "20px", flexWrap: "wrap" }}>

              {article.cover_image && (
                <div style={{ flexShrink: 0 }}>
                  <img
                    src={article.cover_image}
                    alt={article.anime_title || article.title}
                    style={{
                      width: "140px",
                      borderRadius: "4px",
                      border: "1px solid var(--mal-border)",
                      display: "block",
                    }}
                  />
                  {/* Rating badge under cover */}
                  {rating != null && (
                    <div style={{
                      marginTop: "8px",
                      backgroundColor: rColor,
                      color: "#fff",
                      textAlign: "center",
                      padding: "6px 0",
                      borderRadius: "3px",
                      fontWeight: "bold",
                      fontSize: "20px",
                      letterSpacing: "0.5px",
                    }}>
                      <div style={{ fontSize: "9px", fontWeight: "normal", letterSpacing: "1px" }}>SCORE</div>
                      {rating.toFixed(1)}
                    </div>
                  )}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <h1
                  className="news-headline"
                  style={{ marginTop: "4px", marginBottom: "8px", fontSize: "18px", lineHeight: 1.3 }}
                >
                  {article.title}
                </h1>

                {/* Anime meta info */}
                <table style={{ fontSize: "12px", borderCollapse: "collapse", marginBottom: "10px" }}>
                  <tbody>
                    {article.anime_title && (
                      <tr>
                        <td style={{ color: "#888", paddingRight: "10px", whiteSpace: "nowrap" }}>Anime</td>
                        <td>
                          {article.anime_id
                            ? <a href={`/anime/${article.anime_id}`} style={{ color: "var(--mal-link)" }}>{article.anime_title}</a>
                            : article.anime_title}
                        </td>
                      </tr>
                    )}
                    {article.season && (
                      <tr>
                        <td style={{ color: "#888", paddingRight: "10px" }}>Season</td>
                        <td>{article.season}</td>
                      </tr>
                    )}
                    {article.release_date && (
                      <tr>
                        <td style={{ color: "#888", paddingRight: "10px" }}>Released</td>
                        <td>{article.release_date}</td>
                      </tr>
                    )}
                    {article.published_at && (
                      <tr>
                        <td style={{ color: "#888", paddingRight: "10px" }}>Reviewed</td>
                        <td>{article.published_at}{article.author ? ` by ${article.author}` : ""}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="news-tags" style={{ marginBottom: "0" }}>
                    {tags.map((tag, i) => (
                      <span key={i} className="mal-tag" style={{ marginRight: "4px" }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description / intro */}
            {article.description && (
              <div style={{
                padding: "10px 14px",
                backgroundColor: "var(--mal-bg-darker, #1a1a2e)",
                border: "1px solid var(--mal-border)",
                borderLeft: `3px solid ${rColor}`,
                fontSize: "13px",
                fontStyle: "italic",
                color: "#bbb",
                marginBottom: "18px",
                borderRadius: "2px",
              }}>
                {article.description}
              </div>
            )}

            {/* Markdown article body */}
            <div
              className="news-content-body"
              style={{ fontSize: "14px", lineHeight: "1.75" }}
              dangerouslySetInnerHTML={{ __html: article.htmlContent }}
            />

            {/* Tags footer */}
            {tags.length > 0 && (
              <div className="news-tags" style={{ marginTop: "20px" }}>
                {tags.map((tag, i) => (
                  <a key={i} href="#" className="tag-pill">{tag}</a>
                ))}
              </div>
            )}

            {/* Comments placeholder */}
            <div className="news-comments-section" style={{ marginTop: "24px" }}>
              <div className="comments-header">
                <h3>Comments</h3>
                <a href="#">0 Comments</a>
              </div>
              <p style={{ padding: "10px", fontSize: "11px", color: "#666" }}>
                Be the first to comment on this review!
              </p>
            </div>

          </div>{/* end main col */}

          {/* ── Right sidebar ─────────────────────────── */}
          <div style={{ flex: "0 0 220px", minWidth: "180px" }}>

            {/* Score card */}
            {rating != null && (
              <>
                <div className="side-header">Review Score</div>
                <div style={{
                  backgroundColor: "var(--mal-bg-darker, #1a1a2e)",
                  border: "1px solid var(--mal-border)",
                  padding: "16px",
                  textAlign: "center",
                  marginBottom: "14px",
                }}>
                  <div style={{ fontSize: "44px", fontWeight: "bold", color: rColor, lineHeight: 1 }}>
                    {rating.toFixed(1)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>out of 10</div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>by {article.author || "WeebHQ"}</div>
                </div>
              </>
            )}

            {/* Anime quick link */}
            {article.anime_id && (
              <>
                <div className="side-header">Anime Info</div>
                <div style={{
                  backgroundColor: "var(--mal-bg-darker, #1a1a2e)",
                  border: "1px solid var(--mal-border)",
                  padding: "10px",
                  marginBottom: "14px",
                  fontSize: "12px",
                }}>
                  <a href={`/anime/${article.anime_id}`} style={{ color: "var(--mal-link)" }}>
                    → View {article.anime_title} on WeebHQ
                  </a>
                </div>
              </>
            )}

            {/* Tags sidebar */}
            {tags.length > 0 && (
              <>
                <div className="side-header">Tags</div>
                <div className="trending-tags" style={{ marginBottom: "14px" }}>
                  {tags.map((tag, i) => (
                    <span key={i} className="mal-tag">{tag}</span>
                  ))}
                </div>
              </>
            )}

            {/* Related articles */}
            {related.length > 0 && (
              <>
                <div className="side-header">More Reviews</div>
                <div style={{
                  backgroundColor: "var(--mal-bg-darker, #1a1a2e)",
                  border: "1px solid var(--mal-border)",
                  padding: "8px",
                  marginBottom: "14px",
                }}>
                  {related.map((rel, i) => (
                    <div key={i} style={{
                      marginBottom: "8px",
                      paddingBottom: "8px",
                      borderBottom: i < related.length - 1 ? "1px solid var(--mal-border)" : "none",
                      display: "flex",
                      gap: "8px",
                    }}>
                      {rel.cover_image && (
                        <img src={rel.cover_image} alt={rel.anime_title || rel.title}
                          style={{ width: "40px", height: "58px", objectFit: "cover", borderRadius: "2px", flexShrink: 0 }} />
                      )}
                      <div style={{ fontSize: "11px", minWidth: 0 }}>
                        <a href={`/articles/${CATEGORY_SLUG}/${rel._filename}`}
                          style={{ color: "var(--mal-link)", display: "block", marginBottom: "3px", lineHeight: 1.3 }}>
                          {rel.title}
                        </a>
                        {typeof rel.rating === "number" && (
                          <span style={{ color: "#888" }}>Score: <strong style={{ color: ratingColor(rel.rating) }}>{rel.rating.toFixed(1)}</strong></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Browse link */}
            <div className="side-header">Browse</div>
            <div style={{
              backgroundColor: "var(--mal-bg-darker, #1a1a2e)",
              border: "1px solid var(--mal-border)",
              padding: "10px",
              fontSize: "12px",
            }}>
              <div style={{ marginBottom: "5px" }}>
                <a href={`/articles/${CATEGORY_SLUG}`} style={{ color: "var(--mal-link)" }}>&laquo; All {CATEGORY_LABEL}</a>
              </div>
              <div>
                <a href="/" style={{ color: "var(--mal-link)" }}>&laquo; Back to Home</a>
              </div>
            </div>

          </div>{/* end sidebar */}
        </div>
      </div>
    </>
  );
}
