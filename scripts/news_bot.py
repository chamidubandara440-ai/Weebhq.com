"""
WeebHQ News Bot - Groq + Llama 3.3 70B
========================================
Each run: picks ONLY the #1 most trending/viral anime news
that hasn't been published yet, and writes it as a full article.

Trending score based on:
  - Recency (published within last few hours = high score)
  - Viral keywords in title (season 2, movie, confirmed, trailer...)
  - Cross-feed mentions (same story on multiple feeds = more viral)
  - MAL trending boost (if anime appears in MAL trending)

Env: GROQ_API_KEY
"""
import os, re, json, time, random, feedparser, requests, yaml, urllib.request, sys
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
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

# Keywords that signal trending/viral anime news
VIRAL_KEYWORDS = [
    # High virality (+3 each)
    ("season 2", 3), ("season 3", 3), ("season 4", 3),
    ("confirmed", 3), ("announcement", 3), ("announced", 3),
    ("movie", 3), ("film", 3), ("anime adaptation", 3),
    ("trailer", 3), ("release date", 3), ("premiere", 3),
    ("cancelled", 3), ("canceled", 3), ("returns", 3),
    ("final season", 3), ("end date", 3), ("renewal", 3),
    # Medium virality (+2 each)
    ("new anime", 2), ("adaptation", 2), ("episode", 2),
    ("streaming", 2), ("crunchyroll", 2), ("netflix", 2),
    ("studio", 2), ("staff", 2), ("cast", 2), ("voice actor", 2),
    ("manga", 2), ("light novel", 2), ("game", 2),
    ("record", 2), ("breaks", 2), ("sold", 2), ("million", 2),
    # Franchise boosts (+1 each)
    ("one piece", 1), ("naruto", 1), ("demon slayer", 1),
    ("attack on titan", 1), ("jujutsu kaisen", 1), ("my hero academia", 1),
    ("dragon ball", 1), ("bleach", 1), ("hunter x hunter", 1),
    ("chainsaw man", 1), ("spy x family", 1), ("vinland saga", 1),
    ("oshi no ko", 1), ("frieren", 1), ("dungeon meshi", 1),
]

GROQ_BASE_URL  = "https://api.groq.com/openai/v1"
# Model fallback chain - tries each until one works
GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama3-70b-8192",
    "mixtral-8x7b-32768",
]
GROQ_API_KEY   = os.environ.get("GROQ_API_KEY", "")
CONTENT_DIR    = os.path.join("content", "news")
MAX_AI_ATTEMPTS = 3
MIN_BODY_CHARS  = 1500
MAX_RETRY_WAIT  = 90

# ---------------------------------------------------------------------------
class RateLimitError(Exception):
    def __init__(self, msg, retry_after=None):
        super().__init__(msg)
        self.retry_after = retry_after

def log(msg): print(f"[News Bot] {msg}", flush=True)

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text[:80].strip("-")

def existing_slugs():
    if not os.path.exists(CONTENT_DIR): return set()
    return {f.replace(".md","") for f in os.listdir(CONTENT_DIR) if f.endswith(".md")}

def get_og_image(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0 (WeebHQ)"})
        html = urllib.request.urlopen(req, timeout=10).read()
        soup = BeautifulSoup(html, "html.parser")
        tag = soup.find("meta", property="og:image")
        if tag and tag.get("content"): return tag["content"]
    except: pass
    return ""

def clean_html(raw):
    return " ".join(BeautifulSoup(raw, "html.parser").get_text(separator=" ").split()).strip()

def fetch_article_text(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0 (WeebHQ)"})
        html = urllib.request.urlopen(req, timeout=12).read()
        soup = BeautifulSoup(html, "html.parser")
        for sel in ["article",".article-body","#content-zone",".meat",".news-body",
                    ".entry-content","main",".post-content"]:
            el = soup.select_one(sel)
            if el:
                text = " ".join(el.get_text(separator=" ").split())
                if len(text) > 300: return text[:5000]
        paragraphs = soup.find_all("p")
        text = " ".join(p.get_text() for p in paragraphs).strip()
        if len(text) > 300: return " ".join(text.split())[:5000]
    except Exception as e:
        log(f"Fetch failed for {url}: {e}")
    return ""

def parse_pub_date(entry):
    """Parse publish date from RSS entry, return datetime (UTC)."""
    for attr in ("published", "updated", "created"):
        val = getattr(entry, attr, None)
        if val:
            try:
                return parsedate_to_datetime(val).astimezone(timezone.utc)
            except: pass
    return datetime.now(timezone.utc) - timedelta(hours=24)

# ---------------------------------------------------------------------------
# Trending Score
# ---------------------------------------------------------------------------
def trending_score(entry, mention_counts):
    """
    Score a news entry by its viral potential.
    Higher = more trending right now.
    """
    title   = (getattr(entry, "title", "") or "").lower()
    summary = (clean_html(getattr(entry, "summary", "") or "")).lower()
    combined = title + " " + summary

    score = 0

    # 1. Recency — fresher articles score higher
    pub = parse_pub_date(entry)
    now = datetime.now(timezone.utc)
    age_hours = (now - pub).total_seconds() / 3600
    if age_hours <= 1:
        score += 20   # Last hour = mega boost
    elif age_hours <= 3:
        score += 15
    elif age_hours <= 6:
        score += 10
    elif age_hours <= 12:
        score += 5
    elif age_hours <= 24:
        score += 2
    # Older than 24h gets 0 recency bonus

    # 2. Viral keywords
    for keyword, points in VIRAL_KEYWORDS:
        if keyword in combined:
            score += points

    # 3. Cross-feed mention boost (same title seen in multiple feeds)
    norm_title = re.sub(r"[^\w\s]","",title).strip()
    if norm_title in mention_counts:
        score += mention_counts[norm_title] * 5  # +5 per extra feed it appears in

    # 4. Title quality (longer, more specific titles tend to be more newsworthy)
    title_words = len(title.split())
    if title_words >= 8: score += 2
    if title_words >= 12: score += 1

    return score

# ---------------------------------------------------------------------------
# Collect + rank all new entries across all feeds
# ---------------------------------------------------------------------------
def collect_ranked_candidates(known_slugs):
    """
    Fetch all RSS feeds, deduplicate, score, and return sorted candidates.
    Returns list of (score, entry, feed_url) sorted by score descending.
    """
    all_entries = []          # (entry, feed_url)
    mention_counts = {}       # normalized_title -> count across feeds

    for feed_url in RSS_FEEDS:
        log(f"Fetching: {feed_url}")
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries[:15]:
                title = (getattr(entry,"title","") or "").lower()
                norm  = re.sub(r"[^\w\s]","",title).strip()
                if norm:
                    mention_counts[norm] = mention_counts.get(norm, 0) + 1
                all_entries.append((entry, feed_url))
        except Exception as e:
            log(f"Feed error {feed_url}: {e}")

    log(f"Total entries fetched: {len(all_entries)}")

    # Filter out already-published slugs
    candidates = []
    seen_norms = set()  # deduplicate same story from multiple feeds

    for entry, feed_url in all_entries:
        title = (getattr(entry,"title","") or "").strip()
        if not title: continue

        slug = slugify(title)
        if slug in known_slugs: continue

        # Deduplicate: skip if we already have this story from another feed
        norm = re.sub(r"[^\w\s]","",title.lower()).strip()
        if norm in seen_norms: continue
        seen_norms.add(norm)

        score = trending_score(entry, mention_counts)
        candidates.append((score, entry, feed_url))

    # Sort by score descending
    candidates.sort(key=lambda x: x[0], reverse=True)

    log(f"\nTop 5 trending candidates:")
    for i, (sc, e, f) in enumerate(candidates[:5]):
        pub = parse_pub_date(e)
        age = (datetime.now(timezone.utc) - pub).total_seconds() / 3600
        log(f"  #{i+1} [score={sc}] [{age:.1f}h ago] {getattr(e,'title','')}")

    return candidates

# ---------------------------------------------------------------------------
# Groq + prompt
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """\
You are a professional anime journalist writing for WeebHQ.com.

Write a COMPLETE, FULL-LENGTH trending anime news article based ONLY on the
source material supplied. This is a TRENDING story — make it feel urgent and exciting.

MANDATORY RULES:
1. Write 600-1000 words minimum.
2. Do NOT just repeat the source description — expand, contextualize, analyze.
3. Do NOT invent quotes, release dates, or plot details not in the source.
4. Structure:
   - Urgent, engaging opening paragraph (why this matters RIGHT NOW)
   - ## What We Know (key confirmed facts)
   - ## Why Fans Are Excited (reaction angle, community context)
   - ## Background (brief franchise/anime context)
   - ## What's Next (speculation grounded in facts only)
   - Closing paragraph
5. Use proper Markdown formatting with ## headings.
6. Write for anime fans who love depth and analysis.
7. Every fact MUST come from the source material only.

Return ONLY valid JSON, no markdown fences, no extra text:
{
  "title": "<compelling trending SEO title, max 90 chars>",
  "slug": "<url-safe slug, lowercase hyphens only, max 70 chars>",
  "description": "<meta description 120-160 chars>",
  "tags": ["<tag1>","<tag2>","<tag3>"],
  "article_body": "<FULL Markdown article with ## headings, 600+ words>"
}
"""

def build_prompt(entry, full_text=""):
    title   = getattr(entry,"title","").strip()
    summary = clean_html(getattr(entry,"summary", getattr(entry,"description","")))
    link    = getattr(entry,"link","")
    pub     = getattr(entry,"published","")
    body    = full_text if full_text and len(full_text) > len(summary) else summary
    age     = (datetime.now(timezone.utc) - parse_pub_date(entry)).total_seconds()/3600

    return f"""=== TRENDING NEWS ===
Title:      {title}
Published:  {pub} (approximately {age:.1f} hours ago)
Source URL: {link}

Source Content:
{body}

=== TASK ===
Write an urgent, engaging trending news article for WeebHQ.com.
This story is trending NOW. Make readers feel the excitement.
Base every fact on the source only. Return ONLY the JSON object.
"""

def call_groq(prompt, model=None):
    """Try GROQ_MODELS in order until one works (handles 404 per model)."""
    models_to_try = [model] if model else GROQ_MODELS
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }
    last_error = None
    for try_model in models_to_try:
        log(f"Trying model: {try_model}")
        payload = {
            "model":       try_model,
        "messages":    [{"role":"system","content":SYSTEM_PROMPT},{"role":"user","content":prompt}],
        "max_tokens":  3000,
        "temperature": 0.65,
    }
        resp = requests.post(f"{GROQ_BASE_URL}/chat/completions",headers=headers,json=payload,timeout=60)
        log(f"Groq status [{try_model}]: {resp.status_code}")

        if resp.status_code in (400, 404):
            err_body = resp.text[:150].replace(GROQ_API_KEY,"***") if GROQ_API_KEY else resp.text[:150]
            log(f"Model {try_model} error {resp.status_code}: {err_body}. Trying next model...")
            last_error = ValueError(f"Model {try_model} returned {resp.status_code}")
            continue  # try next model in chain

        if resp.status_code == 429:
            ra_raw = resp.headers.get("Retry-After","")
            try:   ra = int(ra_raw)
            except: ra = None
            err = resp.text[:200].replace(GROQ_API_KEY,"***") if GROQ_API_KEY else resp.text[:200]
            log(f"Rate limit | Retry-After:{ra_raw!r} | {err}")
            raise RateLimitError("429", retry_after=ra)

        if resp.status_code == 401:
            log("Authentication failed (401). Check GROQ_API_KEY secret.")
            raise ValueError("Invalid or missing GROQ_API_KEY")

        if resp.status_code in (500,502,503,504):
            log(f"Server error {resp.status_code}. Retrying model...")
            last_error = requests.HTTPError(f"HTTP {resp.status_code}")
            continue  # try next model

        resp.raise_for_status()
        choices = resp.json().get("choices",[])
        if not choices: raise ValueError("No choices")
        ch = choices[0]
        log(f"Finish: {ch.get('finish_reason')} | Model: {try_model}")
        if ch.get("finish_reason") == "length": raise ValueError("Truncated at max_tokens")
        content = (ch.get("message") or {}).get("content") or ""
        log(f"Content: {len(content)} chars")
        if not content: raise ValueError("Empty content")
        return content  # SUCCESS

    # All models failed
    raise last_error or ValueError("All Groq models failed")

def parse_json(raw):
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*","",raw,flags=re.MULTILINE)
    raw = re.sub(r"\s*```$","",raw,flags=re.MULTILINE)
    raw = raw.strip()
    m = re.search(r"\{[\s\S]*\}",raw)
    if m: raw = m.group(0)
    return json.loads(raw)

def build_md(data, img_url):
    now      = datetime.now(timezone.utc)
    ts       = str(int(now.timestamp()))
    date_h   = now.strftime("%b %d, %Y")
    date_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    desc     = data.get("description","")
    snippet  = desc[:150]+("..." if len(desc)>150 else "")
    fm = {
        "id":           ts,
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
        "tags":         data.get("tags",["Anime News"]),
        "status":       "published",
    }
    fm_yaml = yaml.dump(fm,allow_unicode=True,default_flow_style=False,sort_keys=False).rstrip()
    return f"---\n{fm_yaml}\n---\n\n{data['article_body'].strip()}\n"

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    log("="*60)
    log("WeebHQ News Bot — Trending-First Mode")
    log(f"Model: {GROQ_MODELS[0]}")
    log(f"API key: {'SET' if GROQ_API_KEY else 'MISSING'}")
    log("="*60)

    if not GROQ_API_KEY:
        log("GROQ_API_KEY not set. Exiting."); return

    os.makedirs(CONTENT_DIR, exist_ok=True)
    known_slugs = existing_slugs()
    log(f"Already published: {len(known_slugs)} articles")

    candidates = collect_ranked_candidates(known_slugs)

    if not candidates:
        log("No new trending articles found this run."); return

    # Try candidates in order of trending score until one succeeds
    for score, entry, feed_url in candidates:
        title = getattr(entry,"title","").strip()
        slug  = slugify(title)
        log(f"\n{'='*60}")
        log(f"Processing #1 trending: [{score} pts] {title}")

        link      = getattr(entry,"link","")
        img_url   = get_og_image(link) if link else ""
        full_text = fetch_article_text(link) if link else ""
        if full_text: log(f"Source text: {len(full_text)} chars")

        prompt = build_prompt(entry, full_text)
        data   = None

        for attempt in range(1, MAX_AI_ATTEMPTS+1):
            log(f"AI attempt {attempt}/{MAX_AI_ATTEMPTS}")
            if attempt > 1: time.sleep(8+random.uniform(0,3))
            try:
                raw  = call_groq(prompt)
                data = parse_json(raw)
                body = data.get("article_body","")
                if len(body) < MIN_BODY_CHARS:
                    log(f"Body too short ({len(body)}). Retry."); data=None; continue
                break
            except RateLimitError as e:
                wait = min((e.retry_after or 0)+random.uniform(5,15),MAX_RETRY_WAIT) if e.retry_after \
                       else min(2**(attempt+3)+random.uniform(0,10),MAX_RETRY_WAIT)
                log(f"Rate limit -> {wait:.0f}s"); time.sleep(wait)
            except Exception as e:
                wait = min(2**attempt+random.uniform(0,5),MAX_RETRY_WAIT)
                log(f"Error: {e} -> {wait:.0f}s"); time.sleep(wait)

        if data is None:
            log(f"Failed to generate article. Trying next candidate..."); continue

        final_slug = data.get("slug",slug) or slug
        if final_slug in known_slugs:
            log(f"Slug collision: {final_slug}. Trying next..."); continue

        md = build_md(data, img_url)
        fp = os.path.join(CONTENT_DIR, final_slug+".md")
        if os.path.exists(fp):
            log(f"File exists: {fp}. Trying next..."); continue

        with open(fp,"w",encoding="utf-8") as f: f.write(md)
        log(f"\n{'='*60}")
        log(f"Published trending article: {fp}")
        log(f"Title: {data['title']}")
        log(f"Length: {len(data['article_body'])} chars")
        log(f"Trending score: {score}")
        log(f"{'='*60}")
        return  # One article per run - done!

    log("All candidates exhausted. Nothing published this run.")

if __name__ == "__main__":
    main()