"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";

const FEATURE_CONFIG = {
  "api-docs": {
    badge: "DEVELOPER PLATFORM",
    title: "WeebHQ Public API Documentation",
    subtitle: "High-performance REST & GraphQL APIs to access our entire anime database, character voice actors, seasonal rankings, and Cloudflare D1 media metadata.",
    icon: "⚡",
    status: "Private Beta • v1.0",
    progress: 85,
    highlights: [
      "Sub-50ms Global Edge Latency via Cloudflare Workers",
      "Full Anime, Character, Studio & Media Endpoints",
      "OAuth2 Authentication & Rate-limited Public Tier",
      "Interactive Swagger & Postman Documentation",
    ],
  },
  "api-business": {
    badge: "ENTERPRISE SOLUTIONS",
    title: "API for Business & Commercial Partners",
    subtitle: "Dedicated infrastructure, high-throughput commercial access, tailored data feeds, and SLAs for streaming platforms, apps, and analytics providers.",
    icon: "💼",
    status: "In Development",
    progress: 70,
    highlights: [
      "Custom Rate Limits (100k+ RPM)",
      "Direct Cloudflare D1 Replica Feeds",
      "Dedicated 24/7 Priority Support",
      "Custom Webhooks for Daily Airing Updates",
    ],
  },
  "system-status": {
    badge: "OPERATIONAL HEALTH",
    title: "WeebHQ Platform Status & Uptime",
    subtitle: "Real-time metrics, automated health checks, incident logs, and latency monitoring across all global Cloudflare edge datacenters.",
    icon: "🟢",
    status: "Deploying Metrics Engine",
    progress: 90,
    highlights: [
      "99.99% Cloudflare Worker Edge Uptime",
      "Global CDN Cache Hit Ratio Tracking",
      "Automated Cron Trigger Sync Health",
      "Public Incident & Maintenance Logs",
    ],
  },
  "contribution-bible": {
    badge: "COMMUNITY STANDARDS",
    title: "WeebHQ Contribution Bible",
    subtitle: "The definitive guide and curation standards for submitting anime metadata, character relationships, localized titles, and high-resolution media visuals.",
    icon: "📖",
    status: "Drafting Editorial Guidelines",
    progress: 75,
    highlights: [
      "Official Romaji & Kanji Romanization Standards",
      "Image Aspect Ratio & High-Res Poster Guidelines",
      "Seiyuu & Production Staff Attribution Rules",
      "Community Moderator Peer Review Workflow",
    ],
  },
  "add-anime": {
    badge: "COMMUNITY SUBMISSION",
    title: "Add New Anime Entry",
    subtitle: "A collaborative, verified submission portal allowing fans and creators to submit missing anime series, OVAs, ONAs, and upcoming seasonal announcements.",
    icon: "🎬",
    status: "Form Schema in Testing",
    progress: 80,
    highlights: [
      "Instant Auto-Fill via Jikan & AniList IDs",
      "Drag-and-Drop Poster & Key Visual Uploads",
      "Staff, Studios & Genre Tagging System",
      "Earn Community Leaderboard Contributor Points",
    ],
  },
  "add-manga": {
    badge: "MANGA DATABASE",
    title: "Add New Manga & Light Novel Entry",
    subtitle: "Expand the WeebHQ manga library with localized volumes, serialization magazines, authors, illustrators, and publication dates.",
    icon: "📚",
    status: "Database Schema Preparation",
    progress: 65,
    highlights: [
      "Support for Manga, Light Novels, Webtoons & One-shots",
      "Chapter Count, Volume Tracking & Serialization Info",
      "Official English & Japanese Release Cross-referencing",
      "Integration with Global Manga Downloader Bot",
    ],
  },
  "support-forums": {
    badge: "COMMUNITY SUPPORT",
    title: "WeebHQ Support & Feedback Forums",
    subtitle: "A centralized hub to report bugs, suggest new platform features, connect with moderators, and vote on community roadmap priorities.",
    icon: "💬",
    status: "Community Engine in Progress",
    progress: 80,
    highlights: [
      "Direct Bug Report Ticketing with Developer Responses",
      "Community Feature Requests & Upvoting System",
      "Account, Watchlist & Favorites Troubleshooting",
      "Platform Update Changelogs & Roadmaps",
    ],
  },
};

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const featureKey = searchParams.get("feature") || "api-docs";
  const feature = FEATURE_CONFIG[featureKey] || FEATURE_CONFIG["api-docs"];

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubscribed(true);
  };

  return (
    <div className="whq-coming-soon-root">
      <div className="whq-cs-card">
        {/* Top Glow & Badge */}
        <div className="whq-cs-badge-row">
          <span className="whq-cs-badge">{feature.badge}</span>
          <span className="whq-cs-status-chip">
            <span className="whq-cs-pulse" />
            {feature.status}
          </span>
        </div>

        {/* Feature Icon */}
        <div className="whq-cs-icon-wrap">
          <span className="whq-cs-icon">{feature.icon}</span>
        </div>

        {/* Main Title & Subtitle */}
        <h1 className="whq-cs-title">{feature.title}</h1>
        <p className="whq-cs-subtitle">{feature.subtitle}</p>

        {/* Progress Bar */}
        <div className="whq-cs-progress-container">
          <div className="whq-cs-progress-header">
            <span>Development Progress</span>
            <span className="whq-cs-progress-num">{feature.progress}%</span>
          </div>
          <div className="whq-cs-progress-track">
            <div
              className="whq-cs-progress-fill"
              style={{ width: `${feature.progress}%` }}
            />
          </div>
        </div>

        {/* Highlights Grid */}
        <div className="whq-cs-highlights-grid">
          {feature.highlights.map((h, i) => (
            <div key={i} className="whq-cs-highlight-item">
              <span className="whq-cs-check">✓</span>
              <span>{h}</span>
            </div>
          ))}
        </div>

        {/* Notification Subscription */}
        <div className="whq-cs-action-box">
          {subscribed ? (
            <div className="whq-cs-success-msg">
              <span className="whq-cs-check-circle">✓</span>
              <div>
                <strong>You&apos;re on the early access list!</strong>
                <p>We&apos;ll notify you at <u>{email}</u> the moment this feature goes live.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="whq-cs-form">
              <label htmlFor="cs-email" className="whq-cs-form-label">
                Get notified when this feature launches:
              </label>
              <div className="whq-cs-input-group">
                <input
                  id="cs-email"
                  type="email"
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="whq-cs-input"
                  required
                />
                <button type="submit" className="whq-cs-submit-btn">
                  Notify Me 🚀
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="whq-cs-nav-row">
          <Link href="/" className="whq-cs-btn-secondary">
            ← Return to Home
          </Link>
          <Link href="/anime/top" className="whq-cs-btn-primary">
            Explore Top Anime →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense
      fallback={
        <div className="whq-coming-soon-root" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="whq-loading-spinner" />
        </div>
      }
    >
      <ComingSoonContent />
    </Suspense>
  );
}
