"""
WeebHQ News Bot
===============
Fetches fresh anime news from AnimeNewsNetwork RSS,
generates a high-quality article using OpenRouter (google/gemma-4-31b-it:free),
and saves it to: content/news/<slug>.md

The frontmatter is fully compatible with src/app/news/page.js which reads:
  id, title, date, snippet, img, author

Environment variables:
  OPENROUTER_API_KEY  - required for AI generation
"""

import os
import re
import json
import time
import hashlib
import feedparser
import requests
import yaml
import urllib.request
from datetime import datetime, timezone
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
RSS_FEEDS = [
    "https://www.animenewsnetwork.com/news/rss.xml",
]

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL    = "google/gemma-4-31b-it:free"
OPENROUTER_API_KEY  = os.environ.get("OPENROUTER_API_KEY", "")

# Must match what src/app/news/page.js reads from
CONTENT_DIR = os.path.join("content", "news")

MAX_ARTICLES_PER_RUN = 2
REQUEST_DELAY        = 2.0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def log(msg):
    print(f"[News Bot] {msg}", flush=True)


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text[:80].strip("-")


def existing_slugs():
    slugs = set()
    if not os.path.exists(CONTENT_DIR):
        return slugs
    for fname in os.listdir(CONTENT_DIR):
        if fname.endswith(".md"):
            slugs.add(fname.replace(".md", ""))
    return slugs


def get_og_image(url):
    try:
        req = urllib.request.Request(
            url, headers={"User-Agent": "Mozilla/5.0 (WeebHQ News Bot)"}
        )
        html = urllib.request.urlopen(req, timeout=10).read()
        soup = BeautifulSoup(html, "html.parser")
        tag = soup.find("meta", property="og:image")
        if tag and tag.get("content"):
            return tag["content"]
    except Exception as e:
        log(f"OG image fetch failed: {e}")
    return ""


def clean_html(raw):
    return BeautifulSoup(raw, "html.parser").get_text(separator=" ").strip()


# ---------------------------------------------------------------------------
# OpenRouter call with retry
# ---------------------------------------------------------------------------
def call_openrouter(system_prompt, user_prompt, max_retries=3):
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY not set")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://weebhq.com",
        "X-Title":       "WeebHQ",
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        "max_tokens": 1200,
        "temperature": 0.4,
    }

    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
                timeout=45,
            )
            if resp.status_code in (429, 500, 502, 503, 504):
                wait = 2 ** attempt
                log(f"OpenRouter {resp.status_code} – retrying in {wait}s")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
        except (requests.RequestException, KeyError, IndexError) as e:
            if attempt == max_retries:
                raise
            log(f"OpenRouter error (attempt {attempt}): {e}")
            time.sleep(2 ** attempt)

    raise RuntimeError("OpenRouter max retries exceeded")


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """\
You are a professional anime journalist writing for WeebHQ.com.
Produce a factual, engaging anime news article.

Rules:
1. Base the article ONLY on the source information provided. Do NOT invent facts.
2. Do NOT fabricate quotes, release dates, or details not in the source.
3. Write in clean English.
4. Return ONLY a valid JSON object. No extra text, no markdown code fences.

JSON schema:
{
  "title": "<SEO-friendly article title (max 90 chars)>",
  "slug": "<url-safe slug, lowercase, hyphens only, max 70 chars>",
  "description": "<meta description, 120-160 chars>",
  "tags": ["<tag1>", "<tag2>"],
  "article_body": "<full Markdown article body with ## headings, min 3 paragraphs>"
}
"""


def build_user_prompt(entry):
    title   = getattr(entry, "title", "")
    summary = clean_html(getattr(entry, "summary", getattr(entry, "description", "")))
    link    = getattr(entry, "link", "")
    pub     = getattr(entry, "published", "")

    return f"""\
Source Information
==================
Title:     {title}
Published: {pub}
Summary:
{summary}

Task
====
Write a complete anime news article for WeebHQ based solely on the source above.
Return only the JSON object.
"""


# ---------------------------------------------------------------------------
# Deterministic fallback (when AI is unavailable)
# ---------------------------------------------------------------------------
def deterministic_fallback(entry):
    title   = getattr(entry, "title", "").strip()
    summary = clean_html(getattr(entry, "summary", getattr(entry, "description", "")))

    if not title or len(summary) < 40:
        return None

    return {
        "title":        title[:90],
        "slug":         slugify(title),
        "description":  summary[:155] + ("..." if len(summary) > 155 else ""),
        "tags":         ["Anime News"],
        "article_body": f"## News\n\n{summary}\n",
    }


# ---------------------------------------------------------------------------
# Markdown builder - compatible with src/app/news/page.js frontmatter schema
# ---------------------------------------------------------------------------
def build_markdown(data, img_url):
    now        = datetime.now(timezone.utc)
    timestamp  = str(int(now.timestamp()))
    date_human = now.strftime("%b %d, %Y")
    date_iso   = now.strftime("%Y-%m-%dT%H:%M:%SZ")

    description = data.get("description", "")
    snippet = description[:150] + ("..." if len(description) > 150 else "")

    # Frontmatter compatible with news/page.js reader
    fm = {
        "id":           timestamp,
        "title":        data["title"],
        "slug":         data["slug"],
        "category":     "Anime News",
        "date":         date_human,
        "snippet":      snippet,
        "img":          img_url if img_url else "https://placehold.co/400x600/1a1a24/ffffff?text=News",
        "description":  description,
        "cover_image":  img_url if img_url else "",
        "author":       "WeebHQ News",
        "published_at": date_iso,
        "score":        8.5,
        "tags":         data.get("tags", ["Anime News"]),
        "status":       "published",
    }

    fm_yaml = yaml.dump(
        fm,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
    ).rstrip()

    return f"---\n{fm_yaml}\n---\n\n{data['article_body'].strip()}\n"


def validate_markdown(md):
    try:
        if not md.startswith("---"):
            return False, "Missing opening ---"
        end = md.index("\n---", 3)
        parsed = yaml.safe_load(md[3:end].strip())
        if not isinstance(parsed, dict):
            return False, "Frontmatter is not a dict"
        for key in ("id", "title", "slug", "date", "snippet", "img"):
            if key not in parsed:
                return False, f"Missing required key: {key}"
        return True, ""
    except Exception as e:
        return False, str(e)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    log("=" * 50)
    log("News Bot waking up...")
    log("=" * 50)

    os.makedirs(CONTENT_DIR, exist_ok=True)
    known_slugs = existing_slugs()
    log(f"Existing articles in content/news: {len(known_slugs)}")

    published = 0

    for feed_url in RSS_FEEDS:
        if published >= MAX_ARTICLES_PER_RUN:
            break

        log(f"Fetching feed: {feed_url}")
        feed = feedparser.parse(feed_url)

        for entry in feed.entries[:5]:
            if published >= MAX_ARTICLES_PER_RUN:
                break

            title = getattr(entry, "title", "").strip()
            if not title:
                continue

            candidate_slug = slugify(title)
            if candidate_slug in known_slugs:
                log(f"Already published: {title}")
                continue

            log(f"Processing: {title}")
            link    = getattr(entry, "link", "")
            img_url = get_og_image(link) if link else ""

            # AI generation
            data = None
            if OPENROUTER_API_KEY:
                try:
                    raw = call_openrouter(SYSTEM_PROMPT, build_user_prompt(entry))
                    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
                    raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
                    data = json.loads(raw.strip())
                    if not re.match(r"^[a-z0-9-]+$", data.get("slug", "")):
                        data["slug"] = candidate_slug
                    log("AI generation succeeded")
                except Exception as e:
                    log(f"AI failed: {e} – using deterministic fallback")
                    data = None
            else:
                log("No OPENROUTER_API_KEY – using deterministic fallback")

            if not data:
                data = deterministic_fallback(entry)
                if not data:
                    log(f"Insufficient data to publish: {title}. Skipping.")
                    continue
                log("Using deterministic fallback")

            slug = data.get("slug", candidate_slug) or candidate_slug
            if slug in known_slugs:
                log(f"Slug collision: {slug}. Skipping.")
                continue

            md = build_markdown(data, img_url)
            ok, err = validate_markdown(md)
            if not ok:
                log(f"Frontmatter validation failed: {err}. Skipping.")
                continue

            filepath = os.path.join(CONTENT_DIR, slug + ".md")
            if os.path.exists(filepath):
                log(f"File exists: {filepath}. Skipping.")
                continue

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(md)

            log(f"Published: {filepath}")
            known_slugs.add(slug)
            published += 1
            time.sleep(REQUEST_DELAY)

    if published == 0:
        log("No new articles published this run.")

    log("=" * 50)
    log("News Bot done. Zzz...")
    log("=" * 50)


if __name__ == "__main__":
    main()