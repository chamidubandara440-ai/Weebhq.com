"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ThemeToggle from "./ThemeToggle";

const API_BASE = "https://weebhq-api.chamidubandara440.workers.dev";

export default function MainHeader() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Close dropdowns & suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
      if (!e.target.closest(".whq-nav-dropdown-wrapper")) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/anime?q=${encodeURIComponent(trimmed)}&limit=6`);
        if (!res.ok) throw new Error("Search request failed");
        const json = await res.json();
        const results = Array.isArray(json?.data) ? json.data : [];
        setSuggestions(results);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        console.warn("Search suggestions failed:", err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 240);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Submit search
  const handleSubmit = useCallback(
    (e) => {
      if (e) e.preventDefault();
      const q = query.trim();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        window.location.href = `/anime/${suggestions[activeIndex].id}`;
        return;
      }
      if (q) {
        window.location.href = `/anime/search?q=${encodeURIComponent(q)}`;
      } else {
        window.location.href = "/anime/search";
      }
    },
    [query, activeIndex, suggestions]
  );

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter") handleSubmit(e);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const focusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <header className="whq-header-root" role="banner">
      {/* ── 1. Primary Navigation Bar (Deep Navy) ────────────────────────── */}
      <div className="whq-navbar-primary">
        <div className="whq-navbar-container">
          {/* Brand Logo & Name */}
          <div className="whq-nav-left">
            <a href="/" className="whq-brand-link" aria-label="WeebHQ Home">
              <div className="whq-brand-icon" aria-hidden="true">
                <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
                  <path
                    d="M4 8L10 24L16 12L22 24L28 8"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="16" cy="7" r="2.5" fill="#00d2c4" />
                </svg>
              </div>
              <span className="whq-brand-text">
                WEEB<span className="whq-brand-accent">HQ</span>
              </span>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="whq-nav-links" aria-label="Primary Navigation">
              {/* Anime Dropdown */}
              <div className="whq-nav-dropdown-wrapper">
                <button
                  type="button"
                  className={`whq-nav-link whq-dropdown-btn ${openDropdown === "anime" ? "active" : ""}`}
                  onClick={() => toggleDropdown("anime")}
                  aria-expanded={openDropdown === "anime"}
                >
                  Anime
                  <svg className="whq-caret" viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
                    <path d="M3.2 5.5l4.8 5 4.8-5z" />
                  </svg>
                </button>
                {openDropdown === "anime" && (
                  <div className="whq-dropdown-menu">
                    <a href="/anime/popular" className="whq-dropdown-item" onClick={() => setOpenDropdown(null)}>
                      Popular
                    </a>
                    <a href="/anime/now-playing" className="whq-dropdown-item" onClick={() => setOpenDropdown(null)}>
                      Now Playing
                    </a>
                    <a href="/anime/upcoming" className="whq-dropdown-item" onClick={() => setOpenDropdown(null)}>
                      Upcoming
                    </a>
                    <a href="/anime/top" className="whq-dropdown-item" onClick={() => setOpenDropdown(null)}>
                      Top Rated
                    </a>
                  </div>
                )}
              </div>

              {/* Browse Dropdown */}
              <div className="whq-nav-dropdown-wrapper">
                <button
                  type="button"
                  className={`whq-nav-link whq-dropdown-btn ${openDropdown === "browse" ? "active" : ""}`}
                  onClick={() => toggleDropdown("browse")}
                  aria-expanded={openDropdown === "browse"}
                >
                  Browse
                  <svg className="whq-caret" viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
                    <path d="M3.2 5.5l4.8 5 4.8-5z" />
                  </svg>
                </button>
                {openDropdown === "browse" && (
                  <div className="whq-dropdown-menu">
                    <a href="/anime/catalog" className="whq-dropdown-item" onClick={() => setOpenDropdown(null)}>
                      All Anime Catalog
                    </a>
                    <a href="/anime/calendar" className="whq-dropdown-item" onClick={() => setOpenDropdown(null)}>
                      Release Calendar
                    </a>
                    <a href="/anime/genres" className="whq-dropdown-item" onClick={() => setOpenDropdown(null)}>
                      Genres &amp; Studios
                    </a>
                  </div>
                )}
              </div>

              {/* Community Dropdown */}
              <div className="whq-nav-dropdown-wrapper">
                <button
                  type="button"
                  className={`whq-nav-link whq-dropdown-btn ${openDropdown === "community" ? "active" : ""}`}
                  onClick={() => toggleDropdown("community")}
                  aria-expanded={openDropdown === "community"}
                >
                  Community
                  <svg className="whq-caret" viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
                    <path d="M3.2 5.5l4.8 5 4.8-5z" />
                  </svg>
                </button>
                {openDropdown === "community" && (
                  <div className="whq-dropdown-menu">
                    <a href="/community/discussions" className="whq-dropdown-item" onClick={() => setOpenDropdown(null)}>
                      Discussions
                    </a>
                    <a href="/#leaderboard-heading" className="whq-dropdown-item" onClick={() => setOpenDropdown(null)}>
                      Leaderboard
                    </a>
                    <a href="/anime/search" className="whq-dropdown-item" onClick={() => setOpenDropdown(null)}>
                      Guidelines &amp; Support
                    </a>
                  </div>
                )}
              </div>

              {/* Direct Links */}
              <a href="/anime/seasonal" className="whq-nav-link">
                Seasonal
              </a>
              <a href="/anime/top" className="whq-nav-link">
                Top Anime
              </a>
              <a
                href="/coming-soon?feature=api-docs"
                className="whq-nav-link whq-api-link"
                title="WeebHQ Developer API (v1 Coming Soon)"
              >
                API
                <span className="whq-api-badge">v1</span>
              </a>
            </nav>
          </div>

          {/* Right Controls */}
          <div className="whq-nav-right">
{/* Dark Mode Permanent */}

            {/* Auth Actions */}
            <a href="/anime/search" className="whq-auth-link" title="Log In">
              Login
            </a>
            <a href="/anime/search" className="whq-auth-btn" title="Sign Up">
              Sign Up
            </a>

            {/* Search Focus Icon */}
            <button
              type="button"
              className="whq-search-focus-btn"
              onClick={focusSearch}
              aria-label="Jump to search"
              title="Search anime"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="whq-mobile-hamburger"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Separate Search Bar Strip (White / Near-White) ─────────── */}
      <div className="whq-search-strip">
        <div className="whq-search-strip-container" ref={searchContainerRef}>
          <form className="whq-search-bar-form" onSubmit={handleSubmit} role="search" aria-label="Site anime search">
            <span className="whq-search-input-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </span>

            <input
              ref={searchInputRef}
              type="search"
              className="whq-search-strip-input"
              placeholder="Search for an anime, character, studio..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpen(true);
              }}
              aria-label="Search anime database"
              autoComplete="off"
              spellCheck="false"
            />

            {/* Loading Spinner */}
            {isLoading && (
              <span className="whq-search-spinner" aria-label="Searching...">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
              </span>
            )}

            {/* Clear Button */}
            {query && !isLoading && (
              <button
                type="button"
                className="whq-search-clear-btn"
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  setIsOpen(false);
                  if (searchInputRef.current) searchInputRef.current.focus();
                }}
                aria-label="Clear search input"
              >
                ✕
              </button>
            )}

            {/* Submit Button */}
            <button type="submit" className="whq-search-submit-btn" aria-label="Search">
              Search
            </button>
          </form>

          {/* ── Search Suggestions Dropdown ────────────────────────────── */}
          {isOpen && query.trim().length >= 2 && (
            <div className="whq-suggestions-dropdown" role="listbox">
              {suggestions.length > 0 ? (
                <>
                  <div className="whq-suggestions-header">Top Anime Matches</div>
                  <ul className="whq-suggestions-list">
                    {suggestions.map((item, idx) => {
                      const displayTitle = item.title_english || item.title;
                      const scoreStr = item.score ? Number(item.score).toFixed(1) : null;
                      const yearStr = item.season_year || (item.start_date ? item.start_date.slice(0, 4) : null);
                      const typeStr = item.anime_type || "TV";

                      return (
                        <li
                          key={item.id}
                          role="option"
                          aria-selected={activeIndex === idx}
                          className={`whq-suggestion-item ${activeIndex === idx ? "active" : ""}`}
                          onMouseEnter={() => setActiveIndex(idx)}
                        >
                          <a href={`/anime/${item.id}`} className="whq-suggestion-link">
                            <div className="whq-suggestion-thumb">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={displayTitle}
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className="whq-thumb-fallback">🎬</span>
                              )}
                            </div>
                            <div className="whq-suggestion-info">
                              <div className="whq-suggestion-title">{displayTitle}</div>
                              <div className="whq-suggestion-meta">
                                <span className="whq-meta-tag">{typeStr}</span>
                                {yearStr && <span className="whq-meta-dot">• {yearStr}</span>}
                                {scoreStr && <span className="whq-meta-score">⭐ {scoreStr}</span>}
                              </div>
                            </div>
                            <svg className="whq-suggestion-arrow" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                            </svg>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="whq-suggestions-footer">
                    <a href={`/anime/search?q=${encodeURIComponent(query.trim())}`} className="whq-view-all-link">
                      View all matching results for &ldquo;{query.trim()}&rdquo; →
                    </a>
                  </div>
                </>
              ) : (
                !isLoading && (
                  <div className="whq-suggestions-empty">
                    <p>No direct matches found for &ldquo;{query.trim()}&rdquo;</p>
                    <a href={`/anime/search?q=${encodeURIComponent(query.trim())}`} className="whq-empty-search-link">
                      Search full database for &ldquo;{query.trim()}&rdquo; →
                    </a>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Mobile Navigation Drawer ────────────────────────────────── */}
      {mobileOpen && (
        <div className="whq-mobile-drawer-overlay" onClick={() => setMobileOpen(false)}>
          <div
            className="whq-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div className="whq-drawer-header">
              <div className="whq-brand-text">
                WEEB<span className="whq-brand-accent">HQ</span>
              </div>
              <button
                type="button"
                className="whq-drawer-close"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="whq-drawer-nav">
              <div className="whq-drawer-section-title">Anime</div>
              <a href="/anime/popular" className="whq-drawer-link" onClick={() => setMobileOpen(false)}>
                🔥 Popular
              </a>
              <a href="/anime/now-playing" className="whq-drawer-link" onClick={() => setMobileOpen(false)}>
                🎬 Now Playing
              </a>
              <a href="/anime/upcoming" className="whq-drawer-link" onClick={() => setMobileOpen(false)}>
                ⏳ Upcoming
              </a>
              <a href="/anime/top" className="whq-drawer-link" onClick={() => setMobileOpen(false)}>
                ⭐ Top Rated
              </a>

              <div className="whq-drawer-section-title">Community</div>
              <a href="/community/discussions" className="whq-drawer-link" onClick={() => setMobileOpen(false)}>
                💬 Discussions
              </a>
              <a href="/#leaderboard-heading" className="whq-drawer-link" onClick={() => setMobileOpen(false)}>
                🏆 Leaderboard
              </a>
              <a href="/anime/calendar" className="whq-drawer-link" onClick={() => setMobileOpen(false)}>
                📅 Release Calendar
              </a>
              <a href="/anime/search" className="whq-drawer-link" onClick={() => setMobileOpen(false)}>
                📖 Guidelines &amp; Support
              </a>

              <div className="whq-drawer-section-title">Platform</div>
              <a
                href="https://weebhq-api.chamidubandara440.workers.dev/api/anime?limit=50"
                target="_blank"
                rel="noopener noreferrer"
                className="whq-drawer-link"
                onClick={() => setMobileOpen(false)}
              >
                ⚡ Worker API (D1 Database)
              </a>

              <div className="whq-drawer-auth">
                <a href="/anime/search" className="whq-drawer-btn-login" onClick={() => setMobileOpen(false)}>
                  Login
                </a>
                <a href="/anime/search" className="whq-drawer-btn-signup" onClick={() => setMobileOpen(false)}>
                  Sign Up
                </a>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}