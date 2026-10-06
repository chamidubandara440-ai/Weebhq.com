import os
import re
import json
import time
import requests
from datetime import datetime, date

import google.generativeai as genai

# ============================================================
# WeebHQ Review Bot
# Auto-discovers eligible anime via Jikan, generates
# fact-based reviews with Gemini, saves to:
#   content/articles/latest-anime-reviews/<slug>.md
# ============================================================

GEMINI_API_KEY   = os.environ.get("WEEB_API_KEY", "")
CONTENT_DIR      = os.path.join("content", "articles", "latest-anime-reviews")
JIKAN_BASE       = "https://api.jikan.moe/v4"
MAX_REVIEWS      = 1          # max new reviews per run
JIKAN_DELAY      = 1.2        # seconds between Jikan calls (rate limit)

# ── Gemini setup ─────────────────────────────────────────────
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-2.0-flash")
else:
    gemini_model = None

# ── Helpers ───────────────────────────────────────────────────
def log(msg):
    print(f"[Review Bot] {msg}", flush=True)

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text[:80].strip("-")

def existing_review_slugs():
    """Return set of anime_id strings that already have a review file."""
    ids = set()
    slugs = set()
    if not os.path.exists(CONTENT_DIR):
        return ids, slugs
    for fname in os.listdir(CONTENT_DIR):
        if not fname.endswith(".md"):
            continue
        try:
            with open(os.path.join(CONTENT_DIR, fname), "r", encoding="utf-8") as f:
                content = f.read()
            # Extract anime_id from frontmatter
            m = re.search(r"^anime_id:\s*(\d+)", content, re.MULTILINE)
            if m:
                ids.add(m.group(1))
            slugs.add(fname.replace(".md", ""))
        except Exception:
            pass
    return ids, slugs

def jikan_get(endpoint, params=None):
    """Jikan GET with rate-limit delay."""
    time.sleep(JIKAN_DELAY)
    url = f"{JIKAN_BASE}{endpoint}"
    try:
        r = requests.get(url, params=params, timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        log(f"Jikan error on {endpoint}: {e}")
        return None

def fetch_candidate_anime():
    """
    Get a list of candidate anime to review.
    Strategy: current season airing + recently finished.
    Returns list of Jikan anime dicts, deduplicated and filtered.
    """
    candidates = []
    seen = set()

    # 1. Currently airing this season
    data = jikan_get("/seasons/now", {"limit": 20})
    if data and "data" in data:
        for a in data["data"]:
            if a.get("mal_id") and a["mal_id"] not in seen:
                seen.add(a["mal_id"])
                candidates.append(a)

    # 2. Recently finished (previous season, sorted by popularity)
    data = jikan_get("/anime", {"status": "complete", "order_by": "popularity",
                                "sort": "asc", "limit": 10, "sfw": True})
    if data and "data" in data:
        for a in data["data"]:
            if a.get("mal_id") and a["mal_id"] not in seen:
                seen.add(a["mal_id"])
                candidates.append(a)

    return candidates

def fetch_full_anime_data(mal_id):
    """Fetch detailed Jikan data for a single anime."""
    data = jikan_get(f"/anime/{mal_id}/full")
    if not data or "data" not in data:
        return None
    return data["data"]

def build_fact_block(a):
    """
    Convert Jikan full-anime dict into a structured fact block string.
    Only uses data that Jikan actually provides — no invention.
    """
    titles = a.get("titles", [])
    title_en  = next((t["title"] for t in titles if t["type"] == "English"),  a.get("title", ""))
    title_jp  = next((t["title"] for t in titles if t["type"] == "Japanese"), "")
    title_def = a.get("title", title_en or "Unknown")

    genres   = [g["name"] for g in (a.get("genres")   or [])]
    studios  = [s["name"] for s in (a.get("studios")  or [])]
    themes   = [t["name"] for t in (a.get("themes")   or [])]

    season   = a.get("season", "")
    year     = a.get("year", "")
    season_str = f"{season.capitalize()} {year}".strip() if season or year else "Unknown"

    aired    = a.get("aired", {})
    start    = (aired.get("prop", {}).get("from", {}) or {})
    start_str = f"{start.get('year', '')}-{str(start.get('month','') or '').zfill(2)}-{str(start.get('day','') or '').zfill(2)}"
    start_str = start_str.strip("-").strip("0").strip("-") if start else "Unknown"

    return f"""
FACTUAL ANIME DATA (use ONLY these facts for factual claims):
Title (default): {title_def}
Title (English): {title_en or 'N/A'}
Title (Japanese): {title_jp or 'N/A'}
MAL ID: {a.get('mal_id')}
Type: {a.get('type', 'Unknown')}
Status: {a.get('status', 'Unknown')}
Season: {season_str}
Episodes: {a.get('episodes') or 'Unknown / Ongoing'}
Start date: {start_str}
Score (MAL): {a.get('score') or 'N/A'} / 10
Popularity rank: {a.get('popularity') or 'N/A'}
Members: {a.get('members') or 'N/A'}
Genres: {', '.join(genres) or 'N/A'}
Themes: {', '.join(themes) or 'N/A'}
Studios: {', '.join(studios) or 'N/A'}
Rating (audience): {a.get('rating') or 'N/A'}
Synopsis: {(a.get('synopsis') or 'No synopsis available.')[:1500]}
""".strip()

def build_prompt(fact_block, title_str, season_str, today_str):
    return f"""
You are a professional anime critic writing for WeebHQ.com.

CRITICAL RULES — READ FIRST:
1. Only use the supplied FACTUAL ANIME DATA for any factual claims.
2. Do NOT invent episode events, character names, staff names, plot details, dates, or ratings not in the data.
3. Clearly distinguish analysis and opinion from stated facts.
4. If a section lacks sufficient data, write 1–2 honest sentences about the limitation instead of fabricating.
5. Do not copy/paste the synopsis. Write original prose.
6. Do NOT include spoilers unless inside a section explicitly marked "Spoiler Warning".
7. Keep the tone engaging, natural, and SEO-friendly.
8. The review should be between 600 and 1000 words.

TODAY: {today_str}

{fact_block}

Return ONLY valid JSON (no markdown fences) with this exact structure:
{{
  "title": "Exact article title string",
  "slug": "url-safe-slug-string",
  "anime_title": "Anime title used on WeebHQ",
  "season": "{season_str}",
  "release_date": "YYYY-MM-DD or approximate date",
  "cover_image": "Leave empty string — will be set separately",
  "rating": 7.5,
  "tags": ["Anime Review", "...genre...", "...season..."],
  "description": "One compelling SEO-friendly sentence describing this review (max 160 chars)",
  "article_body": "Full Markdown review text with headings:\\n## Overview\\n## Story / Plot\\n## Characters\\n## Animation & Visuals\\n## Sound & Music\\n## What Works\\n## What Could Be Better\\n## Final Verdict\\n## Rating"
}}

The rating must be a number between 1.0 and 10.0.
The slug must be lowercase, hyphens only, max 80 characters.
The article_body must include all 8 required headings in order.
""".strip()

def call_gemini(prompt):
    if not gemini_model:
        raise RuntimeError("Gemini API key not configured (WEEB_API_KEY secret missing)")
    response = gemini_model.generate_content(
        prompt,
        generation_config={"temperature": 0.7, "max_output_tokens": 4096},
    )
    text = response.text.strip()
    # Strip markdown fences if model wrapped in them
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()

def validate_result(data, existing_ids, existing_slugs):
    errors = []
    if not data.get("title"):           errors.append("title missing")
    if not data.get("slug"):            errors.append("slug missing")
    if not data.get("anime_title"):     errors.append("anime_title missing")
    if not data.get("description"):     errors.append("description missing")
    if not data.get("article_body"):    errors.append("article_body missing")
    rating = data.get("rating")
    if rating is None:                  errors.append("rating missing")
    elif not (0 <= float(rating) <= 10):errors.append(f"rating out of range: {rating}")
    slug = data.get("slug", "")
    if not re.match(r"^[a-z0-9-]+$", slug): errors.append(f"unsafe slug: {slug}")
    if slug in existing_slugs:          errors.append(f"slug already exists: {slug}")
    required_headings = ["## Overview", "## Story", "## Characters",
                         "## Animation", "## Sound", "## What Works",
                         "## What Could Be Better", "## Final Verdict", "## Rating"]
    body = data.get("article_body", "")
    missing_h = [h for h in required_headings if h not in body]
    if missing_h:                       errors.append(f"missing headings: {missing_h}")
    return errors

def build_markdown(data, anime):
    today = date.today().isoformat()
    tags_yaml = "\n".join(f"  - {t}" for t in (data.get("tags") or ["Anime Review"]))
    # Use Jikan cover image
    cover = (
        (anime.get("images", {}).get("jpg", {}) or {}).get("large_image_url")
        or (anime.get("images", {}).get("jpg", {}) or {}).get("image_url")
        or ""
    )
    rating_val = round(float(data.get("rating", 7.5)), 1)
    season_str  = data.get("season", "")
    release_date= data.get("release_date", today)

    frontmatter = f"""---
title: "{data['title'].replace('"', "'")}"
slug: "{data['slug']}"
category: "Latest Anime Reviews"
anime_title: "{data['anime_title'].replace('"', "'")}"
anime_id: {anime.get('mal_id')}
season: "{season_str}"
release_date: "{release_date}"
author: "WeebHQ"
published_at: "{today}"
updated_at: "{today}"
cover_image: "{cover}"
rating: {rating_val}
status: "published"
tags:
{tags_yaml}
description: "{data['description'][:160].replace('"', "'")}"
featured: false
---"""
    return frontmatter + "\n\n" + data["article_body"].strip() + "\n"

def main():
    log("=" * 50)
    log("Review Bot waking up...")
    log("=" * 50)

    if not GEMINI_API_KEY:
        log("ERROR: WEEB_API_KEY secret is not set. Aborting.")
        return

    os.makedirs(CONTENT_DIR, exist_ok=True)
    existing_ids, existing_slugs = existing_review_slugs()
    log(f"Existing reviews found: {len(existing_slugs)}")

    log("Checking recent anime from Jikan...")
    candidates = fetch_candidate_anime()
    log(f"Candidates found: {len(candidates)}")

    reviews_written = 0

    for anime in candidates:
        if reviews_written >= MAX_REVIEWS:
            log("Max reviews per run reached. Stopping.")
            break

        mal_id  = str(anime.get("mal_id", ""))
        title   = anime.get("title", "Unknown")

        if not mal_id:
            log(f"Skipping (no MAL ID): {title}")
            continue

        if mal_id in existing_ids:
            log(f"Review already exists for: {title} (ID {mal_id}). Skipping.")
            continue

        log(f"Found eligible anime: {title} (ID {mal_id})")

        # Fetch full data
        full = fetch_full_anime_data(mal_id)
        if not full:
            log(f"Failed to fetch full data for {title}. Skipping.")
            continue

        synopsis = full.get("synopsis") or ""
        if len(synopsis) < 50:
            log(f"Insufficient synopsis for {title} ({len(synopsis)} chars). Skipping.")
            continue

        season_str = ""
        s, y = full.get("season"), full.get("year")
        if s and y:
            season_str = f"{s.capitalize()} {y}"
        elif y:
            season_str = str(y)

        fact_block = build_fact_block(full)
        today_str  = date.today().isoformat()

        log(f"Sending to Gemini: {title}")
        try:
            prompt = build_prompt(fact_block, title, season_str, today_str)
            raw    = call_gemini(prompt)
        except Exception as e:
            log(f"Gemini call failed for {title}: {e}. Skipping.")
            continue

        # Parse JSON
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as e:
            log(f"Gemini returned invalid JSON for {title}: {e}. Skipping.")
            continue

        # Validate
        errors = validate_result(data, existing_ids, existing_slugs)
        if errors:
            log(f"Validation failed for {title}: {errors}. Skipping.")
            continue

        log("Gemini generation successful")

        # Build and write markdown
        md_content = build_markdown(data, full)
        slug       = data["slug"]
        filepath   = os.path.join(CONTENT_DIR, slug + ".md")

        if os.path.exists(filepath):
            log(f"File already exists: {filepath}. Skipping (safety check).")
            continue

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(md_content)

        log(f"Markdown article created: {filepath}")
        existing_ids.add(mal_id)
        existing_slugs.add(slug)
        reviews_written += 1
        log(f"Review published successfully: {title}")

    if reviews_written == 0:
        log("No new reviews published this run.")

    log("=" * 50)
    log("Review Bot going back to sleep. Zzz...")
    log("=" * 50)

if __name__ == "__main__":
    main()