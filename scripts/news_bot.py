"""
WeebHQ News Bot
===============
Fetches anime news from AnimeNewsNetwork RSS, generates a full AI article
using OpenRouter (google/gemma-4-31b-it:free), validates quality,
and saves to: content/news/<slug>.md

CRITICAL RULES:
- Never publish RSS description as article body.
- Never publish if AI fails after all retries.
- article_body must be >= 1500 characters.
- Log safe diagnostics only. Never log the API key.

Environment variables:
  OPENROUTER_API_KEY  - required for AI generation
"""

import os
import re
import json
import time
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

OPENROUTER_BASE_URL   = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL      = "google/gemma-4-31b-it:free"
OPENROUTER_API_KEY    = os.environ.get("OPENROUTER_API_KEY", "")

CONTENT_DIR           = os.path.join("content", "news")

MAX_ARTICLES_PER_RUN  = 2
MAX_AI_ATTEMPTS       = 3
MIN_ARTICLE_CHARS     = 1500   # Reject AI response if article_body is shorter
REQUEST_DELAY         = 2.0


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
    text = BeautifulSoup(raw, "html.parser").get_text(separator=" ").strip()
    return " ".join(text.split())


def fetch_full_article_text(url):
    """Try to scrape more text from the article page itself."""
    try:
        req = urllib.request.Request(
            url, headers={"User-Agent": "Mozilla/5.0 (WeebHQ News Bot)"}
        )
        html = urllib.request.urlopen(req, timeout=12).read()
        soup = BeautifulSoup(html, "html.parser")
        # ANN article body is inside #content-zone or .meat div
        for sel in ["#content-zone", ".meat", "article", ".news-body"]:
            el = soup.select_one(sel)
            if el:
                text = el.get_text(separator=" ").strip()
                text = " ".join(text.split())
                if len(text) > 200:
                    return text[:4000]  # Cap to avoid token overload
        # Fallback: grab all <p> text
        paragraphs = soup.find_all("p")
        text = " ".join(p.get_text() for p in paragraphs).strip()
        if len(text) > 200:
            return " ".join(text.split())[:4000]
    except Exception as e:
        log(f"Full article fetch failed for {url}: {e}")
    return ""


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """\
You are a professional anime journalist writing for WeebHQ.com.

Your task: Write a COMPLETE, FULL-LENGTH anime news article based ONLY on the
source material supplied by the user.

MANDATORY RULES:
1. Write approximately 600-1000 words.
2. Do NOT return only the source description.
3. Do NOT summarize in one sentence.
4. Do NOT invent any facts not present in the source material.
5. Do NOT fabricate quotes, release dates, or character/plot details.
6. Use a proper journalistic structure:
   - An engaging introduction paragraph
   - Multiple body paragraphs with ## headings where appropriate
   - A closing/conclusion paragraph
7. Every factual statement MUST be supported by the supplied source material.
8. Write in clean, professional British/International English.

OUTPUT FORMAT:
Return ONLY a valid JSON object with NO extra text and NO markdown code fences.

JSON schema (all fields required):
{
  "title": "<SEO-friendly article title, max 90 chars>",
  "slug": "<url-safe slug, lowercase, hyphens only, max 70 chars>",
  "description": "<meta description, 120-160 chars, no invented facts>",
  "tags": ["<tag1>", "<tag2>"],
  "article_body": "<FULL Markdown article, minimum 600 words, with ## headings>"
}

CRITICAL: article_body MUST be a long, complete article - NOT just the source description.
"""


def build_user_prompt(entry, full_text=""):
    title   = getattr(entry, "title", "").strip()
    summary = clean_html(getattr(entry, "summary", getattr(entry, "description", "")))
    link    = getattr(entry, "link", "")
    pub     = getattr(entry, "published", "")

    source_body = full_text if full_text and len(full_text) > len(summary) else summary

    return f"""\
=== SOURCE INFORMATION ===
Title:      {title}
Published:  {pub}
Source URL: {link}

Source Content:
{source_body}

=== YOUR TASK ===
Write a complete anime news article for WeebHQ.com based ONLY on the source above.

Requirements:
- Write approximately 600-1000 words.
- Do NOT return only the source description.
- Do NOT summarize in one sentence.
- Do NOT invent any facts.
- Structure with introduction, multiple paragraphs, section headings, and conclusion.
- Return ONLY the JSON object described in the system prompt.
"""


# ---------------------------------------------------------------------------
# OpenRouter call - HTTP level (1 attempt)
# ---------------------------------------------------------------------------
def _single_openrouter_call(user_prompt):
    """Make one HTTP call to OpenRouter. Returns raw content string."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://weebhq.com",
        "X-Title":       "WeebHQ",
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt},
        ],
        "max_tokens": 2048,
        "temperature": 0.5,
    }

    resp = requests.post(
        f"{OPENROUTER_BASE_URL}/chat/completions",
        headers=headers,
        json=payload,
        timeout=60,
    )

    # Safe diagnostics - never logs the key
    log(f"OpenRouter status: {resp.status_code}")

    if resp.status_code in (429, 500, 502, 503, 504):
        raise requests.HTTPError(f"Retryable HTTP {resp.status_code}")

    resp.raise_for_status()

    resp_json = resp.json()
    choices = resp_json.get("choices", [])
    log(f"Choices count: {len(choices)}")

    if not choices:
        raise ValueError("No choices in OpenRouter response")

    choice = choices[0]
    finish_reason = choice.get("finish_reason", "unknown")
    log(f"Finish reason: {finish_reason}")

    content = choice.get("message", {}).get("content", "")
    log(f"AI content length: {len(content)}")

    if not content:
        raise ValueError("Empty content from OpenRouter")

    return content


# ---------------------------------------------------------------------------
# JSON parsing with code fence stripping
# ---------------------------------------------------------------------------
def parse_ai_json(raw):
    """Strip code fences and parse JSON. Returns dict or raises."""
    # Strip leading/trailing whitespace
    raw = raw.strip()
    # Strip ```json ... ``` or ``` ... ``` fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
    raw = raw.strip()

    # Sometimes model returns extra text before/after JSON
    # Try to extract the JSON object
    json_match = re.search(r"\{[\s\S]*\}", raw)
    if json_match:
        raw = json_match.group(0)

    data = json.loads(raw)
    log(f"JSON parse: success (keys: {list(data.keys())})")
    return data


# ---------------------------------------------------------------------------
# Content validation
# ---------------------------------------------------------------------------
def validate_ai_content(data, rss_summary):
    """
    Validate the AI-generated article.
    Returns (ok: bool, reason: str)
    """
    if not isinstance(data, dict):
        return False, "Not a dict"

    title = data.get("title", "")
    if not title or len(title) < 5:
        return False, "title missing or too short"

    body = data.get("article_body", "")
    if not body:
        return False, "article_body missing"

    if len(body) < MIN_ARTICLE_CHARS:
        return False, f"article_body too short: {len(body)} chars (min {MIN_ARTICLE_CHARS})"

    # Reject if body is essentially the RSS description
    rss_clean = rss_summary.strip().lower()
    body_clean = body.strip().lower()
    if rss_clean and len(rss_clean) > 20:
        # If body starts with the RSS description and is barely longer
        if body_clean.startswith(rss_clean[:80].lower()) and len(body) < len(rss_summary) + 200:
            return False, "article_body is just the RSS description"

    # Reject if body is effectively one paragraph (no newlines, no headings)
    if "\n" not in body and "##" not in body and len(body) < 2000:
        return False, "article_body appears to be a single block with no structure"

    return True, "PASS"


# ---------------------------------------------------------------------------
# Full AI generation with retries (content-level retries)
# ---------------------------------------------------------------------------
def generate_article_with_ai(entry, full_text=""):
    """
    Attempt AI generation up to MAX_AI_ATTEMPTS times.
    Retries on HTTP errors AND on content validation failures.
    Returns data dict on success, None on all failures.
    """
    rss_summary = clean_html(getattr(entry, "summary", getattr(entry, "description", "")))
    user_prompt = build_user_prompt(entry, full_text)
    source_title = getattr(entry, "title", "unknown")

    for attempt in range(1, MAX_AI_ATTEMPTS + 1):
        log(f"AI attempt {attempt}/{MAX_AI_ATTEMPTS} for: {source_title}")

        try:
            raw = _single_openrouter_call(user_prompt)
        except requests.HTTPError as e:
            wait = 2 ** attempt
            log(f"HTTP error: {e} – waiting {wait}s before retry")
            time.sleep(wait)
            continue
        except Exception as e:
            wait = 2 ** attempt
            log(f"Request error (attempt {attempt}): {e} – waiting {wait}s")
            time.sleep(wait)
            continue

        # Parse JSON
        try:
            data = parse_ai_json(raw)
        except (json.JSONDecodeError, Exception) as e:
            log(f"JSON parse failed (attempt {attempt}): {e}")
            time.sleep(2 ** attempt)
            continue

        # Validate content
        ok, reason = validate_ai_content(data, rss_summary)
        log(f"Validation: {reason}")

        if ok:
            # Fix slug if needed
            if not re.match(r"^[a-z0-9-]+$", data.get("slug", "")):
                data["slug"] = slugify(getattr(entry, "title", "article"))
            article_len = len(data.get("article_body", ""))
            log(f"Final article length: {article_len} chars")
            return data
        else:
            log(f"Content rejected – retrying (reason: {reason})")
            time.sleep(2 ** attempt)
            continue

    # All attempts failed
    log(f"AI generation failed after {MAX_AI_ATTEMPTS} attempts. Skipping article.")
    return None


# ---------------------------------------------------------------------------
# Markdown builder — compatible with src/app/news/page.js
# ---------------------------------------------------------------------------
def build_markdown(data, img_url):
    now        = datetime.now(timezone.utc)
    timestamp  = str(int(now.timestamp()))
    date_human = now.strftime("%b %d, %Y")
    date_iso   = now.strftime("%Y-%m-%dT%H:%M:%SZ")

    description = data.get("description", "")
    snippet = description[:150] + ("..." if len(description) > 150 else "")

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


def validate_markdown_frontmatter(md):
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
    log(f"API key configured: {'YES' if OPENROUTER_API_KEY else 'NO - will skip AI generation'}")
    log("=" * 50)

    os.makedirs(CONTENT_DIR, exist_ok=True)
    known_slugs = existing_slugs()
    log(f"Existing articles: {len(known_slugs)}")

    published = 0

    for feed_url in RSS_FEEDS:
        if published >= MAX_ARTICLES_PER_RUN:
            break

        log(f"Fetching feed: {feed_url}")
        try:
            feed = feedparser.parse(feed_url)
        except Exception as e:
            log(f"Feed fetch failed: {e}")
            continue

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

            log(f"Source found: {title}")

            link    = getattr(entry, "link", "")
            img_url = get_og_image(link) if link else ""

            # Try to get more article text from the source page
            full_text = fetch_full_article_text(link) if link else ""
            if full_text:
                log(f"Full article text fetched: {len(full_text)} chars")

            # --- AI generation only — NO fallback publishing ---
            if not OPENROUTER_API_KEY:
                log("OPENROUTER_API_KEY not set. Skipping article (no fallback publishing).")
                continue

            data = generate_article_with_ai(entry, full_text)

            if data is None:
                # All AI attempts failed — DO NOT publish
                log(f"Skipping: {title} (AI generation failed)")
                continue

            slug = data.get("slug", candidate_slug) or candidate_slug
            if slug in known_slugs:
                log(f"Slug collision: {slug}. Skipping.")
                continue

            md = build_markdown(data, img_url)
            ok, err = validate_markdown_frontmatter(md)
            if not ok:
                log(f"Frontmatter validation failed: {err}. Skipping.")
                continue

            filepath = os.path.join(CONTENT_DIR, slug + ".md")
            if os.path.exists(filepath):
                log(f"File already exists: {filepath}. Skipping.")
                continue

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(md)

            log(f"Published: {filepath} ({len(data['article_body'])} chars)")
            known_slugs.add(slug)
            published += 1
            time.sleep(REQUEST_DELAY)

    log("=" * 50)
    if published == 0:
        log("No new articles published this run.")
    else:
        log(f"Published {published} article(s) this run.")
    log("News Bot done. Zzz...")
    log("=" * 50)


if __name__ == "__main__":
    main()