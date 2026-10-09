import os
import re
import json
import time
import requests
import yaml                  # PyYAML - safe YAML serialization
from datetime import datetime, date

import google.generativeai as genai

# ============================================================
# WeebHQ Review Bot
# Auto-discovers eligible anime via our Tenrai API + D1 store,
# generates fact-based reviews with Gemini, saves to:
#   content/articles/latest-anime-reviews/<slug>.md
# ============================================================

GEMINI_API_KEY   = os.environ.get("WEEB_API_KEY", "")
CONTENT_DIR      = os.path.join("content", "reviews")

# Tenrai API (public, no key needed)
TENRAI_BASE      = "https://api.tenrai.org/v1"

# Our own Cloudflare Worker / D1 endpoint
WEEBHQ_API_BASE  = "https://weebhq-api.chamidubandara440.workers.dev"

MAX_REVIEWS      = 1          # max new reviews per run (safeguard)
REQUEST_DELAY    = 1.5        # seconds between API calls (rate-limit courtesy)

# ── Gemini setup ─────────────────────────────────────────────
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-3.6-flash")
else:
    gemini_model = None

# ── Exact headings the prompt requests (used for validation) ──
REQUIRED_HEADINGS = [
    "## Overview",
    "## Story / Plot",
    "## Characters",
    "## Animation & Visuals",
    "## Sound & Music",
    "## What Works",
    "## What Could Be Better",
    "## Final Verdict",
    "## Rating",
]


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
    """Return (set_of_anime_ids, set_of_slugs) already published."""
    ids   = set()
    slugs = set()
    if not os.path.exists(CONTENT_DIR):
        return ids, slugs
    for fname in os.listdir(CONTENT_DIR):
        if not fname.endswith(".md"):
            continue
        try:
            with open(os.path.join(CONTENT_DIR, fname), "r", encoding="utf-8") as f:
                content = f.read()
            m = re.search(r"^anime_id:\s*(\d+)", content, re.MULTILINE)
            if m:
                ids.add(m.group(1))
            slugs.add(fname.replace(".md", ""))
        except Exception:
            pass
    return ids, slugs


def tenrai_get(endpoint, params=None):
    """GET request to Tenrai public API."""
    time.sleep(REQUEST_DELAY)
    url = f"{TENRAI_BASE}{endpoint}"
    try:
        r = requests.get(url, params=params, timeout=15,
                         headers={"Accept": "application/json"})
        r.raise_for_status()
        return r.json()
    except Exception as e:
        log(f"Tenrai API error on {endpoint}: {e}")
        return None


def weebhq_get(endpoint, params=None):
    """GET request to our WeebHQ Worker/D1 API."""
    time.sleep(REQUEST_DELAY)
    url = f"{WEEBHQ_API_BASE}{endpoint}"
    try:
        r = requests.get(url, params=params, timeout=15,
                         headers={"Accept": "application/json"})
        r.raise_for_status()
        return r.json()
    except Exception as e:
        log(f"WeebHQ API error on {endpoint}: {e}")
        return None


# ── Candidate discovery ───────────────────────────────────────
def fetch_candidate_anime():
    """
    Priority order for candidate anime:
      1. Currently airing (from Tenrai top/anime)
      2. Upcoming (from our Worker /api/anime/upcoming)
      3. Stored anime in D1 (from our Worker /api/anime)
    All sources are deduplicated by MAL ID.
    """
    candidates = []
    seen = set()

    log("Fetching current season anime from Tenrai...")
    data = tenrai_get("/top/anime", {"page": 1, "limit": 20})
    if data and "data" in data:
        for item in data["data"]:
            mid = item.get("mal_id")
            if mid and mid not in seen:
                seen.add(mid)
                candidates.append(_normalise_tenrai(item))

    log("Fetching upcoming anime from WeebHQ API...")
    upcoming = weebhq_get("/api/anime/upcoming")
    if upcoming and "data" in upcoming:
        for item in upcoming["data"]:
            mid = item.get("id")
            if mid and mid not in seen:
                seen.add(mid)
                candidates.append(_normalise_worker(item))

    log("Fetching stored anime from WeebHQ D1...")
    stored = weebhq_get("/api/anime", {"limit": 30, "offset": 0})
    if stored and "data" in stored:
        for item in stored["data"]:
            mid = item.get("id")
            if mid and mid not in seen:
                seen.add(mid)
                candidates.append(_normalise_worker(item))

    log(f"Total candidates collected: {len(candidates)}")
    return candidates


def _normalise_tenrai(item):
    """Map a raw Tenrai API item to our internal candidate dict."""
    titles = item.get("titles") or []
    en = next((t["title"] for t in titles if t.get("type") == "English"),
               item.get("title_english") or "")
    jp = next((t["title"] for t in titles if t.get("type") == "Japanese"), "")

    genres  = [g["name"] for g in (item.get("genres")  or []) if g.get("name")]
    studios = [s["name"] for s in (item.get("studios") or []) if s.get("name")]
    themes  = [t["name"] for t in (item.get("themes")  or []) if t.get("name")]

    season = item.get("season", "") or ""
    year   = item.get("year", "")   or ""
    season_str = f"{season.capitalize()} {year}".strip() if (season or year) else ""

    aired    = item.get("aired") or {}
    prop     = aired.get("prop") or {}
    frm      = prop.get("from") or {}
    rd_parts = [str(frm.get(k,"")) for k in ("year","month","day") if frm.get(k)]
    release_date = "-".join(rd_parts) if rd_parts else ""

    img = (
        ((item.get("images") or {}).get("jpg") or {}).get("large_image_url")
        or ((item.get("images") or {}).get("jpg") or {}).get("image_url")
        or ""
    )

    return {
        "id":           str(item.get("mal_id", "")),
        "title":        item.get("title") or en or "Unknown",
        "title_english":en,
        "title_japanese": jp,
        "type":         item.get("type", ""),
        "status":       item.get("status", ""),
        "season":       season_str,
        "release_date": release_date,
        "episodes":     item.get("episodes"),
        "score":        item.get("score"),
        "popularity":   item.get("popularity"),
        "members":      item.get("members"),
        "genres":       genres,
        "studios":      studios,
        "themes":       themes,
        "synopsis":     (item.get("synopsis") or "").strip(),
        "image_url":    img,
        "_source":      "tenrai",
    }


def _normalise_worker(item):
    """Map a WeebHQ Worker/D1 item to our internal candidate dict."""
    studios_raw = item.get("studios") or ""
    try:
        studios = json.loads(studios_raw) if studios_raw.startswith("[") else [s.strip() for s in studios_raw.split(",") if s.strip()]
    except Exception:
        studios = [studios_raw] if studios_raw else []

    season_str = ""
    s = item.get("season") or ""
    y = item.get("season_year") or item.get("year") or ""
    if s or y:
        season_str = f"{str(s).capitalize()} {y}".strip()

    return {
        "id":           str(item.get("id", "")),
        "title":        item.get("title") or item.get("title_english") or "Unknown",
        "title_english":item.get("title_english") or "",
        "title_japanese": "",
        "type":         item.get("anime_type") or item.get("type") or "",
        "status":       item.get("status") or "",
        "season":       season_str,
        "release_date": item.get("start_date") or item.get("release_date") or "",
        "episodes":     item.get("episodes"),
        "score":        item.get("score"),
        "popularity":   item.get("popularity"),
        "members":      item.get("members"),
        "genres":       [],
        "studios":      studios,
        "themes":       [],
        "synopsis":     (item.get("synopsis") or "").strip(),
        "image_url":    item.get("image_url") or "",
        "_source":      "worker",
    }


def enrich_from_tenrai(anime_id):
    """Fetch full Tenrai data for a D1 candidate with missing synopsis."""
    time.sleep(REQUEST_DELAY)
    try:
        r = requests.get(
            f"{TENRAI_BASE}/anime/{anime_id}/full",
            timeout=15, headers={"Accept": "application/json"}
        )
        if r.status_code == 404:
            return None
        r.raise_for_status()
        data = r.json().get("data") or r.json()
        return _normalise_tenrai(data)
    except Exception as e:
        log(f"Tenrai enrichment failed for ID {anime_id}: {e}")
        return None


# ── Fact block for Gemini ─────────────────────────────────────
def build_fact_block(a):
    genres  = ", ".join(a["genres"])  or "N/A"
    studios = ", ".join(a["studios"]) or "N/A"
    themes  = ", ".join(a["themes"])  or "N/A"
    synopsis = (a.get("synopsis") or "No synopsis available.")[:1500]

    return f"""
FACTUAL ANIME DATA (use ONLY these facts for factual claims):
Title (main):    {a['title']}
Title (English): {a['title_english'] or 'N/A'}
Title (Japanese):{a['title_japanese'] or 'N/A'}
MAL / Anime ID:  {a['id']}
Type:            {a['type'] or 'Unknown'}
Status:          {a['status'] or 'Unknown'}
Season:          {a['season'] or 'Unknown'}
Release date:    {a['release_date'] or 'Unknown'}
Episodes:        {a['episodes'] or 'Unknown / Ongoing'}
Score (MAL):     {a['score'] or 'N/A'} / 10
Popularity rank: {a['popularity'] or 'N/A'}
Members:         {a['members'] or 'N/A'}
Genres:          {genres}
Themes:          {themes}
Studios:         {studios}
Synopsis:        {synopsis}
""".strip()


# ── Gemini prompt ─────────────────────────────────────────────
def build_prompt(fact_block, season_str, today_str):
    headings_list = "\n".join(REQUIRED_HEADINGS)
    return f"""
You are a professional anime critic writing for WeebHQ.com.

CRITICAL RULES - READ FIRST:
1. Only use the supplied FACTUAL ANIME DATA for any factual claims.
2. Do NOT invent episode events, character names, staff names, plot details, dates, or ratings not in the data.
3. Clearly distinguish analysis and opinion from stated facts.
4. If a section lacks sufficient data, write 1-2 honest sentences noting the limitation instead of fabricating.
5. Do not copy/paste the synopsis verbatim. Write original prose.
6. Do NOT include spoilers unless inside a section explicitly marked "Spoiler Warning".
7. Keep the tone engaging, natural, and SEO-friendly.
8. The review should be between 600 and 1000 words total.
9. Use these EXACT heading strings (spelling, spacing, symbols must match exactly):

{headings_list}

TODAY: {today_str}

{fact_block}

Return ONLY valid JSON - no markdown fences, no extra text outside the JSON.
Use this exact structure:
{{
  "title":        "Engaging article headline",
  "slug":         "anime-title-review",
  "anime_title":  "Anime title as shown on WeebHQ",
  "season":       "{season_str}",
  "release_date": "YYYY-MM-DD or approximate",
  "cover_image":  "",
  "rating":       7.5,
  "tags":         ["Anime Review", "<genre>", "<season>"],
  "description":  "One SEO sentence max 160 chars",
  "article_body": "Full Markdown text starting with ## Overview, then all required headings in order"
}}

Rules:
- rating: float between 1.0 and 10.0
- slug: lowercase a-z, 0-9, hyphens only, max 80 chars
- article_body must contain ALL 9 headings listed above, in order
- description: max 160 characters
""".strip()


# ── Gemini call ───────────────────────────────────────────────
def call_gemini(prompt):
    if not gemini_model:
        raise RuntimeError("Gemini API key not configured (WEEB_API_KEY secret missing)")
    response = gemini_model.generate_content(
        prompt,
        generation_config={"temperature": 0.7, "max_output_tokens": 4096},
    )
    text = response.text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


# ── Validation ────────────────────────────────────────────────
def validate_result(data, existing_ids, existing_slugs):
    errors = []
    if not data.get("title"):        errors.append("title missing")
    if not data.get("slug"):         errors.append("slug missing")
    if not data.get("anime_title"):  errors.append("anime_title missing")
    if not data.get("description"):  errors.append("description missing")
    if not data.get("article_body"): errors.append("article_body missing")

    rating = data.get("rating")
    if rating is None:
        errors.append("rating missing")
    else:
        try:
            if not (0 <= float(rating) <= 10):
                errors.append(f"rating out of range: {rating}")
        except (TypeError, ValueError):
            errors.append(f"rating not a number: {rating}")

    slug = data.get("slug", "")
    if not re.match(r"^[a-z0-9-]+$", slug):
        errors.append(f"unsafe slug: {slug!r}")
    if slug in existing_slugs:
        errors.append(f"slug already exists: {slug}")

    body = data.get("article_body", "")
    missing_h = [h for h in REQUIRED_HEADINGS if h not in body]
    if missing_h:
        errors.append(f"missing/mismatched headings: {missing_h}")

    return errors


def validate_markdown(md_text):
    """
    Parse the generated Markdown with PyYAML to catch any YAML errors
    BEFORE the file is written to disk.
    Returns (ok: bool, error_msg: str)
    """
    try:
        # Extract frontmatter block between first two --- delimiters
        if not md_text.startswith("---"):
            return False, "Markdown does not start with --- frontmatter"
        end = md_text.index("\n---", 3)
        fm_block = md_text[3:end].strip()
        parsed = yaml.safe_load(fm_block)
        if not isinstance(parsed, dict):
            return False, f"Frontmatter parsed to {type(parsed).__name__}, expected dict"
        # Check required keys
        for key in ("title", "slug", "anime_id", "rating"):
            if key not in parsed:
                return False, f"Required frontmatter key missing: {key}"
        return True, ""
    except yaml.YAMLError as e:
        return False, f"YAML parse error: {e}"
    except ValueError as e:
        return False, f"Could not find closing ---: {e}"
    except Exception as e:
        return False, f"Unexpected validation error: {e}"


# ── Safe YAML frontmatter builder ─────────────────────────────
def build_markdown(data, anime):
    """
    Build the full Markdown string with PyYAML-serialised frontmatter.
    This safely handles titles/descriptions with colons, quotes,
    apostrophes, brackets, hashes, and other YAML-special characters.
    """
    today        = date.today().isoformat()
    cover        = anime.get("image_url") or ""
    rating_val   = round(float(data.get("rating", 7.5)), 1)
    season_str   = data.get("season") or anime.get("season") or ""
    release_date = data.get("release_date") or anime.get("release_date") or today
    anime_id_str = anime.get("id") or ""

    # Build the frontmatter dict — PyYAML will safely quote/escape all values
    fm = {
        "title":        data["title"],
        "slug":         data["slug"],
        "category":     "Latest Anime Reviews",
        "anime_title":  data["anime_title"],
        "anime_id":     int(anime_id_str) if anime_id_str.isdigit() else anime_id_str,
        "season":       season_str,
        "release_date": release_date,
        "author":       "WeebHQ",
        "published_at": today,
        "updated_at":   today,
        "cover_image":  cover,
        "img":          cover,
        "snippet":      (data.get("description") or "")[:150],
        "score":        rating_val,
        "date":         today,
        "rating":       rating_val,
        "status":       "published",
        "tags":         data.get("tags") or ["Anime Review"],
        "description":  data["description"][:160],
        "featured":     False,
    }

    # Use PyYAML's safe dumper — handles all special chars automatically
    fm_yaml = yaml.dump(
        fm,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
    ).rstrip()

    return f"---\n{fm_yaml}\n---\n\n{data['article_body'].strip()}\n"


# ── Main ──────────────────────────────────────────────────────
def main():
    log("=" * 50)
    log("Review Bot waking up...")
    log("=" * 50)

    if not GEMINI_API_KEY:
        log("ERROR: WEEB_API_KEY secret not set. Aborting.")
        return

    os.makedirs(CONTENT_DIR, exist_ok=True)
    existing_ids, existing_slugs = existing_review_slugs()
    log(f"Existing reviews: {len(existing_slugs)}")

    log("Checking recent anime from Tenrai + WeebHQ APIs...")
    candidates = fetch_candidate_anime()
    log(f"Candidates found: {len(candidates)}")

    reviews_written = 0

    for anime in candidates:
        if reviews_written >= MAX_REVIEWS:
            log("Max reviews per run reached. Stopping.")
            break

        anime_id = anime.get("id", "")
        title    = anime.get("title", "Unknown")

        if not anime_id:
            log(f"Skipping (no ID): {title}")
            continue

        if anime_id in existing_ids:
            log(f"Review already exists: {title} (ID {anime_id}). Skipping.")
            continue

        log(f"Found eligible anime: {title} (ID {anime_id})")

        # Enrich from Tenrai if synopsis is missing
        synopsis = anime.get("synopsis", "")
        if len(synopsis) < 50 and anime.get("_source") == "worker":
            log(f"Synopsis short ({len(synopsis)} chars) — enriching from Tenrai...")
            enriched = enrich_from_tenrai(anime_id)
            if enriched and len(enriched.get("synopsis", "")) >= 50:
                anime = enriched
                synopsis = anime["synopsis"]
            else:
                log(f"Tenrai enrichment insufficient for {title}. Skipping.")
                continue

        if len(synopsis) < 50:
            log(f"Insufficient synopsis for {title} ({len(synopsis)} chars). Skipping.")
            continue

        season_str = anime.get("season", "")
        today_str  = date.today().isoformat()
        fact_block = build_fact_block(anime)

        log(f"Sending to Gemini: {title}")
        try:
            prompt = build_prompt(fact_block, season_str, today_str)
            raw    = call_gemini(prompt)
        except Exception as e:
            log(f"Gemini call failed for {title}: {e}. Skipping.")
            continue

        try:
            result = json.loads(raw)
        except json.JSONDecodeError as e:
            log(f"Gemini returned invalid JSON for {title}: {e}. Skipping.")
            continue

        errors = validate_result(result, existing_ids, existing_slugs)
        if errors:
            log(f"Validation failed for {title}: {errors}. Skipping.")
            continue

        log("Gemini generation successful")

        # Build the Markdown with safe PyYAML serialization
        md_content = build_markdown(result, anime)

        # ── Pre-write YAML validation ──────────────────────────────────
        ok, err = validate_markdown(md_content)
        if not ok:
            log(f"YAML validation failed for {title}: {err}. Skipping — no file written.")
            continue

        log("Frontmatter YAML validated successfully")

        slug       = result["slug"]
        filepath   = os.path.join(CONTENT_DIR, slug + ".md")

        if os.path.exists(filepath):
            log(f"File already exists: {filepath}. Skipping (safety check).")
            continue

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(md_content)

        log(f"Markdown article created: {filepath}")
        existing_ids.add(anime_id)
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