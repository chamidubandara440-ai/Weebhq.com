import "./globals.css";
import MainHeader from "../components/MainHeader";
import Script from "next/script";

export const metadata = {
  metadataBase: new URL("https://weebhq.com"),
  title: {
    default: "WeebHQ — Ultimate Anime & Manga Database, Reviews & Community",
    template: "%s | WeebHQ",
  },
  description: "Explore top-rated anime, discover upcoming seasonal releases, watch high-definition trailers, read verified community reviews, and track your watchlists on WeebHQ.",
  keywords: [
    "anime",
    "manga",
    "anime database",
    "seasonal anime",
    "anime reviews",
    "anime trailers",
    "voice actors",
    "seiyuu",
    "top anime",
    "anime streaming",
    "WeebHQ"
  ],
  authors: [{ name: "WeebHQ Team", url: "https://weebhq.com" }],
  creator: "WeebHQ",
  publisher: "WeebHQ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://weebhq.com",
    siteName: "WeebHQ",
    title: "WeebHQ — Ultimate Anime & Manga Database, Reviews & Community",
    description: "Explore top-rated anime, discover upcoming seasonal releases, watch high-definition trailers, read verified community reviews, and track your watchlists on WeebHQ.",
    images: [
      {
        url: "https://weebhq.com/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "WeebHQ - The Anime Database",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WeebHQ — Ultimate Anime & Manga Database",
    description: "Explore top-rated anime, discover upcoming seasonal releases, watch trailers, and read community reviews on WeebHQ.",
    images: ["https://weebhq.com/og-default.jpg"],
    creator: "@weebhq",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "WeebHQ",
    url: "https://weebhq.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://weebhq.com/anime/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WeebHQ",
    url: "https://weebhq.com",
    logo: "https://weebhq.com/favicon.ico",
  };

  return (
    <html lang="en" data-theme="dark" className="dark" style={{ colorScheme: "dark", backgroundColor: "#0b0f19" }}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: 'try{document.documentElement.setAttribute("data-theme", "dark");document.documentElement.classList.add("dark");localStorage.setItem("theme", "dark");}catch(e){}',
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-T8M5N8X7FK"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-T8M5N8X7FK');
          `}
        </Script>
      </head>
      <body>
        <MainHeader />
        {children}
        
        {/* TMDB-Style WeebHQ Footer */}
        <footer className="whq-footer" role="contentinfo">
          <div className="whq-footer-container">
            {/* Brand & Join Column */}
            <div className="whq-footer-brand-col">
              <a href="/" className="whq-footer-logo" aria-label="WeebHQ Home">
                <div className="whq-footer-logo-box">
                  <span className="whq-footer-logo-t">THE</span>
                  <span className="whq-footer-logo-m">ANIME</span>
                  <span className="whq-footer-logo-b">DB</span>
                </div>
              </a>
              <a href="/anime/search" className="whq-footer-join-btn">
                JOIN THE COMMUNITY
              </a>
            </div>

            {/* Nav Columns */}
            <div className="whq-footer-nav-grid">
              <div className="whq-footer-nav-col">
                <h3 className="whq-footer-col-title">THE BASICS</h3>
                <ul className="whq-footer-links">
                  <li><a href="/anime/search">About WeebHQ</a></li>
                  <li><a href="/anime/search">Contact Us</a></li>
                  <li><a href="/coming-soon?feature=api-docs">API Documentation</a></li>
                  <li><a href="/coming-soon?feature=api-business">API for Business</a></li>
                  <li><a href="/coming-soon?feature=system-status">System Status</a></li>
                </ul>
              </div>

              <div className="whq-footer-nav-col">
                <h3 className="whq-footer-col-title">GET INVOLVED</h3>
                <ul className="whq-footer-links">
                  <li><a href="/coming-soon?feature=contribution-bible">Contribution Bible</a></li>
                  <li><a href="/coming-soon?feature=add-anime">Add New Anime</a></li>
                  <li><a href="/coming-soon?feature=add-manga">Add New Manga</a></li>
                </ul>
              </div>

              <div className="whq-footer-nav-col">
                <h3 className="whq-footer-col-title">COMMUNITY</h3>
                <ul className="whq-footer-links">
                  <li><a href="/anime/search">Guidelines</a></li>
                  <li><a href="/reviews">Discussions</a></li>
                  <li><a href="/#leaderboard-heading">Leaderboard</a></li>
                  <li><a href="/coming-soon?feature=support-forums">Support Forums</a></li>
                </ul>
              </div>

              <div className="whq-footer-nav-col">
                <h3 className="whq-footer-col-title">LEGAL</h3>
                <ul className="whq-footer-links">
                  <li><a href="/anime/search">Terms of Use</a></li>
                  <li><a href="/anime/search">API Terms of Use</a></li>
                  <li><a href="/anime/search">Privacy Policy</a></li>
                  <li><a href="/anime/search">DMCA Policy</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Bottom Bar */}
          <div className="whq-footer-bottom">
            <div className="whq-footer-bottom-container">
              <div className="whq-footer-privacy">
                <span className="whq-privacy-badge">✓</span>
                <a href="/anime/search">Your Privacy Choices</a>
              </div>
              <div className="whq-footer-lang-select">
                <span className="whq-lang-globe">🌐</span>
                <select aria-label="Language selector" defaultValue="en-US" className="whq-lang-dropdown">
                  <option value="en-US">English (en-US)</option>
                  <option value="ja-JP">日本語 (ja-JP)</option>
                </select>
              </div>
              <div className="whq-footer-build-tag">
                Build 2026.10 (WeebHQ Platform)
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
