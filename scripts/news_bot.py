"""
WeebHQ News Bot - Groq + Llama 3.3 70B
========================================
Fetches trending anime/manga news from multiple RSS feeds,
rewrites them as full SEO articles using Groq API (Llama 3.3 70B),
validates quality, and saves to: content/news/<slug>.md

RULES:
- Never publish RSS description as article body.
- Skip article if AI fails all attempts.
- article_body must be >= 1500 characters.
- Never log the API key.
- Respect rate limits with exponential backoff.

Env vars:
  GROQ_API_KEY   - required (get free at console.groq.com)
"""

import os, re, json, time, random, feedparser, requests, yaml, urllib.request, sys
from datetime import datetime, timezone
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
RSS_FEEDS = [
    "https://www.animenewsnetwork.com/all/rss.xml?ann-edition=us",
    "https://www.animenewsnetwork.com/news/rss.xml",
    "https://crunchyroll.com/news/rss",
    "https://myanimelist.net/rss/news.xml",
]

GROQ_BASE_URL        = "https://api.groq.com/openai/v1"
GROQ_MODEL           = "llama-3.3-70b-versatile"
GROQ_API_KEY         = os.environ.get("GROQ_API_KEY", "")

CONTENT_DIR          = os.path.join("content", "news")
MAX_ARTICLES_PER_RUN = 3
MAX_AI_ATTEMPTS      = 3
MIN_ARTICLE_CHARS    = 1500
REQUEST_DELAY        = 3.0
INTER_REQUEST_DELAY  = 5.0
MAX_RETRY_WAIT       = 90

# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------
class RateLimitError(Exception):
    def __init__(self, msg, retry_after=None):
        super().__init__(msg)
        self.retry_after = retry_after

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def log(msg): print(f"[News Bot] {msg}", flush=True)

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text[:80].strip("-")

def existing_slugs():
    slugs = set()
    if not os.path.exists(CONTENT_DIR): return slugs
    for f in os.listdir(CONTENT_DIR):
        if f.endswith(".md"): slugs.add(f.replace(".md", ""))
    return slugs

def get_og_image(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (WeebHQ)"})
        html = urllib.request.urlopen(req, timeout=10).read()
        soup = BeautifulSoup(html, "html.parser")
        tag = soup.find("meta", property="og:image")
        if tag and tag.get("content"): return tag["content"]
    except: pass
    return ""

def clean_html(raw):
    return " ".join(BeautifulSoup(raw, "html.parser").get_text(separator=" ").split()).strip()

def fetch_article_text(url):
    """Scrape full article text from the source URL."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (WeebHQ)"})
        html = urllib.request.urlopen(req, timeout=12).read()
        soup = BeautifulSoup(html, "html.parser")
        for sel in ["article", ".article-body", "#content-zone", ".meat", ".news-body",
                    ".entry-content", "main", ".post-content"]:
            el = soup.select_one(sel)
            if el:
                text = " ".join(el.get_text(separator=" ").split())
                if len(text) > 300: return text[:5000]
        paragraphs = soup.find_all("p")
        text = " ".join(p.get_text() for p in paragraphs).strip()
        if len(text) > 300: return " ".join(text.split())[:5000]
    except Exception as e:
        log(f"Article fetch failed for {url}: {e}")
    return ""

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """\
You are a professional anime journalist writing for WeebHQ.com, a popular \
anime and manga community website.

Your task: Write a COMPLETE, FULL-LENGTH anime news article based ONLY on the \
source material supplied. Do NOT invent facts.

MANDATORY RULES:
1. Write 600-1000 words minimum.
2. Do NOT just repeat the source description — expand, contextualize, analyze.
3. Do NOT invent quotes, release dates, or plot details not in the source.
4. Use journalistic structure:
   - Engaging introduction paragraph (hook the reader)
   - 3-5 body paragraphs with ## subheadings
   - Context/background paragraph about the anime/franchise
   - Concluding paragraph with community reaction angle
5. Use proper Markdown formatting with ## headings.
6. Write in engaging, modern English for anime fans.
7. Every fact MUST come from the source material only.

OUTPUT FORMAT — return ONLY valid JSON, no markdown fences, no extra text:
{
  "title": "<compelling SEO title, max 90 chars>",
  "slug": "<url-safe slug, lowercase hyphens only, max 70 chars>",
  "description": "<meta description, 120-160 chars, enticing>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"],
  "article_body": "<FULL Markdown article with ## headings, 600+ words>"
}
"""

def build_prompt(entry, full_text=""):
    title   = getattr(entry, "title", "").strip()
    summary = clean_html(getattr(entry, "summary", getattr(entry, "description", "")))
    link    = getattr(entry, "link", "")
    pub     = getattr(entry, "published", "")
    body    = full_text if full_text and len(full_text) > len(summary) else summary

    return f"""=== SOURCE NEWS ===
Title:     {title}
Published: {pub}
URL:       {link}

Source Content:
{body}

=== TASK ===
Write a complete, engaging anime news article for WeebHQ.com based ONLY on the source above.
- 600-1000 words
- Use ## headings to organize the article
- Add context about the franchise/anime for readers unfamiliar with it
- Write for anime fans who love depth and analysis
- Return ONLY the JSON object, no extra text
"""

# ---------------------------------------------------------------------------
# Groq API Call
# ---------------------------------------------------------------------------
def _call_groq(prompt):
    """
    Single HTTP call to Groq API.
    Raises: RateLimitError (429), requests.HTTPError (5xx), ValueError (bad response)
    """
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }
    payload = {
        "model":       GROQ_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": prompt},
        ],
        "max_tokens":  3000,
        "temperature": 0.6,
    }

    resp = requests.post(
        f"{GROQ_BASE_URL}/chat/completions",
        headers=headers, json=payload, timeout=60,
    )
    log(f"Groq status: {resp.status_code}")

    if resp.status_code == 429:
        retry_after_raw = resp.headers.get("Retry-After", "")
        try:   retry_after = int(retry_after_raw)
        except: retry_after = None
        try:
            err_body = resp.text[:300]
            if GROQ_API_KEY and GROQ_API_KEY in err_body:
                err_body = err_body.replace(GROQ_API_KEY, "***")
        except: err_body = "<unreadable>"
        log(f"Rate-limit | Retry-After: {retry_after_raw!r} | {err_body}")
        raise RateLimitError("HTTP 429", retry_after=retry_after)

    if resp.status_code in (500, 502, 503, 504):
        log(f"Server error {resp.status_code}: {resp.text[:200]}")
        raise requests.HTTPError(f"Retryable HTTP {resp.status_code}")

    resp.raise_for_status()

    try:   resp_json = resp.json()
    except Exception as e: raise ValueError(f"JSON parse failed: {e}")

    choices = resp_json.get("choices", [])
    log(f"Choices: {len(choices)}")
    if not choices:
        err = resp_json.get("error", {})
        log(f"No choices. Error: {str(err)[:200]}")
        raise ValueError("No choices in Groq response")

    choice = choices[0]
    finish = choice.get("finish_reason", "unknown")
    log(f"Finish reason: {finish}")

    if finish == "length":
        raise ValueError("finish_reason=length: response truncated at max_tokens")

    message = choice.get("message") or {}
    content = message.get("content") or ""
    log(f"Content length: {len(content)}")
    if not content: raise ValueError("Empty content from Groq")
    return content

# ---------------------------------------------------------------------------
# JSON parse + validate
# ---------------------------------------------------------------------------
def parse_json(raw):
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
    raw = raw.strip()
    m = re.search(r"\{[\s\S]*\}", raw)
    if m: raw = m.group(0)
    data = json.loads(raw)
    log(f"JSON parsed OK. Keys: {list(data.keys())}")
    return data

def validate(data, rss_summary):
    if not isinstance(data, dict): return False, "Not a dict"
    title = data.get("title", "")
    if not title or len(title) < 5: return False, "title too short"
    body = data.get("article_body", "")
    if not body: return False, "article_body missing"
    if len(body) < MIN_ARTICLE_CHARS:
        return False, f"article_body too short: {len(body)}/{MIN_ARTICLE_CHARS}"
    rss = rss_summary.strip().lower()
    if rss and len(rss) > 20:
        if body.strip().lower().startswith(rss[:80].lower()) and len(body) < len(rss_summary) + 200:
            return False, "article_body is just the RSS description"
    if "\n" not in body and "##" not in body and len(body) < 2000:
        return False, "article_body has no structure"
    return True, "PASS"

# ---------------------------------------------------------------------------
# Generation with retries
# ---------------------------------------------------------------------------
def generate(entry, full_text=""):
    rss_summary  = clean_html(getattr(entry, "summary", getattr(entry, "description", "")))
    prompt       = build_prompt(entry, full_text)
    source_title = getattr(entry, "title", "unknown")

    for attempt in range(1, MAX_AI_ATTEMPTS + 1):
        log(f"Attempt {attempt}/{MAX_AI_ATTEMPTS}: {source_title}")

        if attempt > 1:
            delay = INTER_REQUEST_DELAY + random.uniform(0, 3)
            log(f"Pre-request delay: {delay:.1f}s")
            time.sleep(delay)

        try:
            raw = _call_groq(prompt)
        except RateLimitError as e:
            wait = min((e.retry_after or 0) + random.uniform(5, 15), MAX_RETRY_WAIT) \
                   if e.retry_after else min(2**(attempt+3) + random.uniform(0,10), MAX_RETRY_WAIT)
            log(f"Rate limit -> waiting {wait:.0f}s")
            time.sleep(wait); continue
        except requests.HTTPError as e:
            wait = min(2**attempt + random.uniform(0, 5), MAX_RETRY_WAIT)
            log(f"HTTP error: {e} -> {wait:.0f}s"); time.sleep(wait); continue
        except Exception as e:
            wait = min(2**attempt + random.uniform(0, 3), MAX_RETRY_WAIT)
            log(f"Error (attempt {attempt}): {e} -> {wait:.0f}s"); time.sleep(wait); continue

        try:   data = parse_json(raw)
        except Exception as e:
            log(f"JSON parse failed: {e}"); time.sleep(2**attempt); continue

        ok, reason = validate(data, rss_summary)
        log(f"Validation: {reason}")
        if ok:
            if not re.match(r"^[a-z0-9-]+$", data.get("slug", "")):
                data["slug"] = slugify(getattr(entry, "title", "article"))
            log(f"Article length: {len(data['article_body'])} chars"); return data

        log(f"Rejected (attempt {attempt}): {reason}"); time.sleep(2**attempt)

    log(f"All attempts failed for: {source_title}. Skipping.")
    return None

# ---------------------------------------------------------------------------
# Markdown builder
# ---------------------------------------------------------------------------
def build_md(data, img_url):
    now        = datetime.now(timezone.utc)
    timestamp  = str(int(now.timestamp()))
    date_h     = now.strftime("%b %d, %Y")
    date_iso   = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    desc       = data.get("description", "")
    snippet    = desc[:150] + ("..." if len(desc) > 150 else "")

    fm = {
        "id":           timestamp,
        "title":        data["title"],
        "slug":         data["slug"],
        "category":     "Anime News",
        "date":         date_h,
        "snippet":      snippet,
        "img":          img_url or "https://placehold.co/400x600/1a1a24/ffffff?text=News",
        "description":  desc,
        "cover_image":  img_url or "",
        "author":       "WeebHQ News",
        "published_at": date_iso,
        "score":        8.5,
        "tags":         data.get("tags", ["Anime News"]),
        "status":       "published",
    }
    fm_yaml = yaml.dump(fm, allow_unicode=True, default_flow_style=False, sort_keys=False).rstrip()
    return f"---\n{fm_yaml}\n---\n\n{data['article_body'].strip()}\n"

def validate_fm(md):
    try:
        if not md.startswith("---"): return False, "Missing ---"
        end = md.index("\n---", 3)
        parsed = yaml.safe_load(md[3:end].strip())
        if not isinstance(parsed, dict): return False, "Not a dict"
        for k in ("id", "title", "slug", "date", "snippet", "img"):
            if k not in parsed: return False, f"Missing key: {k}"
        return True, ""
    except Exception as e: return False, str(e)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    log("=" * 55)
    log("WeebHQ News Bot (Groq + Llama 3.3 70B)")
    log(f"API key configured: {'YES' if GROQ_API_KEY else 'NO - skipping'}")
    log("=" * 55)

    os.makedirs(CONTENT_DIR, exist_ok=True)
    known_slugs = existing_slugs()
    log(f"Existing articles: {len(known_slugs)}")
    published = 0

    for feed_url in RSS_FEEDS:
        if published >= MAX_ARTICLES_PER_RUN: break
        log(f"\nFetching: {feed_url}")
        try:   feed = feedparser.parse(feed_url)
        except Exception as e: log(f"Feed error: {e}"); continue

        for entry in feed.entries[:8]:
            if published >= MAX_ARTICLES_PER_RUN: break
            title = getattr(entry, "title", "").strip()
            if not title: continue

            slug = slugify(title)
            if slug in known_slugs:
                log(f"Skip (exists): {title}"); continue

            log(f"\nProcessing: {title}")
            link      = getattr(entry, "link", "")
            img_url   = get_og_image(link) if link else ""
            full_text = fetch_article_text(link) if link else ""
            if full_text: log(f"Source text: {len(full_text)} chars")

            if not GROQ_API_KEY:
                log("GROQ_API_KEY not set. Skipping."); continue

            data = generate(entry, full_text)
            if data is None: continue

            final_slug = data.get("slug", slug) or slug
            if final_slug in known_slugs:
                log(f"Slug collision: {final_slug}. Skipping."); continue

            md = build_md(data, img_url)
            ok, err = validate_fm(md)
            if not ok: log(f"Frontmatter invalid: {err}. Skipping."); continue

            filepath = os.path.join(CONTENT_DIR, final_slug + ".md")
            if os.path.exists(filepath): log(f"File exists: {filepath}. Skip."); continue

            with open(filepath, "w", encoding="utf-8") as f: f.write(md)
            log(f"Published: {filepath} ({len(data['article_body'])} chars)")
            known_slugs.add(final_slug)
            published += 1
            time.sleep(REQUEST_DELAY)

    log("\n" + "=" * 55)
    log(f"Done. Published {published} article(s) this run.")
    log("=" * 55)

if __name__ == "__main__":
    main()