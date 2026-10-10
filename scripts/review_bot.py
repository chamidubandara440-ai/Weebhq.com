"""
WeebHQ Review Bot - Groq + Active Models (Oct 2026)
=====================================================
Env: GROQ_API_KEY_REVIEWS
"""
import os, re, json, time, random, requests, yaml
from datetime import datetime, timezone

GROQ_BASE_URL  = "https://api.groq.com/openai/v1"
GROQ_MODELS = [
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "qwen/qwen3-32b",
    "llama-3.1-8b-instant",
]
GROQ_API_KEY   = os.environ.get("GROQ_API_KEY_REVIEWS", "")
CONTENT_DIR    = os.path.join("content", "reviews")
JIKAN_BASE     = "https://api.jikan.moe/v4"
MAX_REVIEWS    = 2
MIN_BODY_CHARS = 1500
MAX_RETRY_WAIT = 90

class RateLimitError(Exception):
    def __init__(self, msg, retry_after=None):
        super().__init__(msg)
        self.retry_after = retry_after

def log(msg): print(f"[Review Bot] {msg}", flush=True)

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return (text[:60] + "-review").strip("-")

def existing_slugs():
    if not os.path.exists(CONTENT_DIR):
        return set()
    return {f.replace(".md", "") for f in os.listdir(CONTENT_DIR) if f.endswith(".md")}

def fetch_top_anime(limit=20):
    try:
        resp = requests.get(f"{JIKAN_BASE}/top/anime",
            params={"filter": "bypopularity", "limit": limit}, timeout=15)
        if resp.status_code == 200:
            return resp.json().get("data", [])
    except Exception as e:
        log(f"Jikan error: {e}")
    return []

def fetch_anime_details(mal_id):
    try:
        time.sleep(0.5)
        resp = requests.get(f"{JIKAN_BASE}/anime/{mal_id}/full", timeout=15)
        if resp.status_code == 200:
            return resp.json().get("data", {})
    except Exception as e:
        log(f"Details error: {e}")
    return {}

SYSTEM_PROMPT = """\
You are a professional anime critic writing for WeebHQ.com.
Write a COMPLETE, DETAILED, SPOILER-FREE anime review based on the factual data provided.
RULES:
1. Write 700-1200 words minimum.
2. NO SPOILERS.
3. Structure: Introduction, ## Story & Premise, ## Animation & Art Style, ## Characters, ## Soundtrack & Voice Acting, ## Why You Should Watch, ## Final Verdict
4. Base EVERY claim on the provided data.
5. Return ONLY valid JSON:
{"title":"<review title max 90 chars>","slug":"<slug-review lowercase hyphens max 70 chars>","description":"<meta description 120-160 chars>","tags":["tag1","tag2","tag3"],"article_body":"<full Markdown review with ## headings 700+ words>"}
"""

def build_prompt(anime):
    title    = anime.get("title_english") or anime.get("title", "Unknown")
    score    = anime.get("score", "N/A")
    synopsis = (anime.get("synopsis") or "No synopsis.")[:3000]
    genres   = ", ".join(g["name"] for g in anime.get("genres", []))
    themes   = ", ".join(t["name"] for t in anime.get("themes", []))
    studios  = ", ".join(s["name"] for s in anime.get("studios", []))
    episodes = anime.get("episodes", "Unknown")
    season   = f"{str(anime.get('season','')).title()} {anime.get('year','')}".strip()
    return f"Title: {title}\nMAL Score: {score}/10\nEpisodes: {episodes} | Season: {season}\nGenres: {genres}\nThemes: {themes}\nStudios: {studios}\n\nSynopsis:\n{synopsis}\n\nWrite a professional spoiler-free review. Return ONLY the JSON."

def call_groq(prompt):
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    last_error = None
    for try_model in GROQ_MODELS:
        log(f"Trying model: {try_model}")
        payload = {
            "model": try_model,
            "messages": [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}],
            "max_tokens": 3500,
            "temperature": 0.65,
        }
        try:
            resp = requests.post(f"{GROQ_BASE_URL}/chat/completions", headers=headers, json=payload, timeout=60)
        except Exception as e:
            log(f"Request error ({try_model}): {e}")
            last_error = e
            continue

        log(f"Status [{try_model}]: {resp.status_code}")

        if resp.status_code in (400, 404):
            safe = resp.text[:150].replace(GROQ_API_KEY, "***") if GROQ_API_KEY else resp.text[:150]
            log(f"Model {try_model} unavailable ({resp.status_code}). Trying next...")
            last_error = ValueError(f"HTTP {resp.status_code}")
            continue

        if resp.status_code == 401:
            raise ValueError("Invalid GROQ_API_KEY_REVIEWS (401)")

        if resp.status_code == 429:
            ra_raw = resp.headers.get("Retry-After", "")
            try:   ra = int(ra_raw)
            except: ra = None
            log(f"Rate limit | Retry-After:{ra_raw!r}")
            raise RateLimitError("429", retry_after=ra)

        if resp.status_code in (500, 502, 503, 504):
            log(f"Server error {resp.status_code}. Trying next...")
            last_error = requests.HTTPError(f"HTTP {resp.status_code}")
            continue

        resp.raise_for_status()
        choices = resp.json().get("choices", [])
        if not choices:
            last_error = ValueError("No choices")
            continue

        ch = choices[0]
        log(f"Finish: {ch.get('finish_reason')} | Model: {try_model}")
        if ch.get("finish_reason") == "length":
            raise ValueError("Truncated")

        content = (ch.get("message") or {}).get("content") or ""
        log(f"Content: {len(content)} chars")
        if not content:
            last_error = ValueError("Empty content")
            continue

        return content

    raise last_error or ValueError("All Groq models failed")

def parse_json(raw):
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
    m = re.search(r"\{[\s\S]*\}", raw)
    if m: raw = m.group(0)
    return json.loads(raw)

def build_md(data, anime):
    now      = datetime.now(timezone.utc)
    ts       = str(int(now.timestamp()))
    date_h   = now.strftime("%b %d, %Y")
    date_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    cover    = anime.get("images", {}).get("jpg", {}).get("large_image_url", "")
    rating   = anime.get("score", 8.0)
    desc     = data.get("description", "")
    fm = {
        "id": ts, "title": data["title"], "slug": data["slug"],
        "category": "Latest Anime Reviews",
        "anime_title": anime.get("title_english") or anime.get("title", ""),
        "anime_id": anime.get("mal_id", ""),
        "season": f"{str(anime.get('season','')).title()} {anime.get('year','')}".strip(),
        "release_date": (anime.get("aired", {}).get("from") or "")[:10],
        "author": "WeebHQ", "published_at": date_iso, "updated_at": date_iso[:10],
        "cover_image": cover, "img": cover,
        "snippet": desc[:150] + ("..." if len(desc) > 150 else ""),
        "score": float(rating) if rating else 8.0,
        "date": date_h, "rating": float(rating) if rating else 8.0,
        "status": "published", "tags": data.get("tags", ["Anime Review"]),
        "description": desc, "featured": False,
    }
    fm_yaml = yaml.dump(fm, allow_unicode=True, default_flow_style=False, sort_keys=False).rstrip()
    return f"---\n{fm_yaml}\n---\n\n{data['article_body'].strip()}\n"

def main():
    log("=" * 55)
    log("WeebHQ Review Bot (Groq - Oct 2026 Models)")
    log(f"API key: {'SET' if GROQ_API_KEY else 'MISSING'}")
    log("=" * 55)
    if not GROQ_API_KEY:
        log("GROQ_API_KEY_REVIEWS not set. Exiting."); return

    os.makedirs(CONTENT_DIR, exist_ok=True)
    known = existing_slugs()
    log(f"Existing reviews: {len(known)}")
    anime_list = fetch_top_anime(30)
    if not anime_list: log("No anime from Jikan."); return

    published = 0
    for anime in anime_list:
        if published >= MAX_REVIEWS: break
        title = anime.get("title_english") or anime.get("title", "")
        slug  = slugify(title)
        if slug in known: log(f"Skip: {title}"); continue
        if not anime.get("synopsis"): continue

        log(f"\nReviewing: {title}")
        details = fetch_anime_details(anime.get("mal_id")) or anime
        prompt  = build_prompt(details)

        for attempt in range(1, 4):
            log(f"Attempt {attempt}/3")
            if attempt > 1: time.sleep(8 + random.uniform(0, 3))
            try:
                raw  = call_groq(prompt)
                data = parse_json(raw)
                body = data.get("article_body", "")
                if len(body) < MIN_BODY_CHARS:
                    log(f"Body too short ({len(body)}). Retry."); continue
                final_slug = data.get("slug", slug) or slug
                if final_slug in known: log("Slug collision. Skip."); break
                md = build_md(data, details)
                fp = os.path.join(CONTENT_DIR, final_slug + ".md")
                if os.path.exists(fp): log("File exists."); break
                with open(fp, "w", encoding="utf-8") as f: f.write(md)
                log(f"Published: {fp} ({len(body)} chars)")
                known.add(final_slug); published += 1; break
            except RateLimitError as e:
                wait = min((e.retry_after or 0) + random.uniform(5, 15), MAX_RETRY_WAIT) if e.retry_after \
                    else min(2 ** (attempt + 3) + random.uniform(0, 10), MAX_RETRY_WAIT)
                log(f"Rate limit -> {wait:.0f}s"); time.sleep(wait)
            except Exception as e:
                wait = min(2 ** attempt + random.uniform(0, 5), MAX_RETRY_WAIT)
                log(f"Error: {e} -> {wait:.0f}s"); time.sleep(wait)
        time.sleep(3)

    log(f"\nDone. Published {published} review(s).")

if __name__ == "__main__": main()