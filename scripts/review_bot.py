"""
WeebHQ Review Bot - Groq + Llama 3.3 70B
==========================================
Fetches anime data from Jikan (MyAnimeList API),
generates full SEO review articles using Groq API,
saves to content/reviews/<slug>.md

Env: GROQ_API_KEY_REVIEWS
"""
import os, re, json, time, random, requests, yaml, sys
from datetime import datetime, timezone

GROQ_BASE_URL   = "https://api.groq.com/openai/v1"
GROQ_MODELS = ["llama-3.3-70b-versatile","llama-3.1-70b-versatile","llama3-70b-8192","mixtral-8x7b-32768"]
GROQ_API_KEY    = os.environ.get("GROQ_API_KEY_REVIEWS", "")
CONTENT_DIR     = os.path.join("content", "reviews")
JIKAN_BASE      = "https://api.jikan.moe/v4"
MAX_REVIEWS     = 2
MIN_BODY_CHARS  = 1500
MAX_RETRY_WAIT  = 90

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
    if not os.path.exists(CONTENT_DIR): return set()
    return {f.replace(".md","") for f in os.listdir(CONTENT_DIR) if f.endswith(".md")}

def fetch_top_anime(limit=20):
    try:
        resp = requests.get(f"{JIKAN_BASE}/top/anime", params={"filter":"bypopularity","limit":limit}, timeout=15)
        if resp.status_code == 200:
            return resp.json().get("data", [])
    except Exception as e: log(f"Jikan error: {e}")
    return []

def fetch_anime_details(mal_id):
    try:
        time.sleep(0.5)
        resp = requests.get(f"{JIKAN_BASE}/anime/{mal_id}/full", timeout=15)
        if resp.status_code == 200: return resp.json().get("data", {})
    except Exception as e: log(f"Details error: {e}")
    return {}

SYSTEM_PROMPT = """\
You are a professional anime critic writing for WeebHQ.com.

Write a COMPLETE, DETAILED, SPOILER-FREE anime review based on the factual data provided.

RULES:
1. Write 700-1200 words minimum.
2. NO SPOILERS - discuss themes and strengths without revealing plot points.
3. Structure:
   - Introduction (why this anime matters)
   - ## Story & Premise (based on synopsis only)
   - ## Animation & Art Style
   - ## Characters
   - ## Soundtrack & Voice Acting
   - ## Why You Should Watch
   - ## Final Verdict
4. Base EVERY claim on the provided data. Do not invent.
5. Use engaging, fan-friendly language.
6. Return ONLY valid JSON:
{
  "title": "<review title, max 90 chars>",
  "slug": "<slug-review, lowercase hyphens, max 70 chars>",
  "description": "<meta description 120-160 chars>",
  "tags": ["tag1","tag2","tag3"],
  "article_body": "<full Markdown review with ## headings, 700+ words>"
}
"""

def build_prompt(anime):
    title    = anime.get("title_english") or anime.get("title","Unknown")
    score    = anime.get("score","N/A")
    rank     = anime.get("rank","N/A")
    pop      = anime.get("popularity","N/A")
    synopsis = anime.get("synopsis","No synopsis available.")[:3000]
    genres   = ", ".join(g["name"] for g in anime.get("genres",[]))
    themes   = ", ".join(t["name"] for t in anime.get("themes",[]))
    studios  = ", ".join(s["name"] for s in anime.get("studios",[]))
    episodes = anime.get("episodes","Unknown")
    season   = f"{anime.get('season','').title()} {anime.get('year','')}"
    rating   = anime.get("rating","Unknown")
    source   = anime.get("source","Unknown")

    return f"""=== ANIME DATA ===
Title:     {title}
MAL Score: {score}/10  |  Rank: #{rank}  |  Popularity: #{pop}
Episodes:  {episodes}  |  Season: {season}  |  Rating: {rating}
Genres:    {genres}
Themes:    {themes}
Studios:   {studios}
Source:    {source}

Synopsis:
{synopsis}

=== TASK ===
Write a professional, spoiler-free anime review for WeebHQ.com fans.
Use ONLY the data above. Be enthusiastic but critical and balanced.
Return ONLY the JSON object.
"""

def call_groq(prompt):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }
    last_error = None
    for try_model in GROQ_MODELS:
        log(f"Trying model: {try_model}")
        payload = {
            "model": try_model,
        "messages":    [{"role":"system","content":SYSTEM_PROMPT},{"role":"user","content":prompt}],
        "max_tokens":  3500,
        "temperature": 0.65,
    }
    resp = requests.post(f"{GROQ_BASE_URL}/chat/completions", headers=headers, json=payload, timeout=60)
    log(f"Groq status: {resp.status_code}")

    if resp.status_code in (400, 404):
            err_body = resp.text[:150].replace(GROQ_API_KEY,"***") if GROQ_API_KEY else resp.text[:150]
            log(f"Model {try_model} error {resp.status_code}. Trying next...")
            last_error = ValueError(f"HTTP {resp.status_code}")
            continue
        if resp.status_code == 429:
        ra_raw = resp.headers.get("Retry-After","")
        try:   ra = int(ra_raw)
        except: ra = None
        err = resp.text[:200].replace(GROQ_API_KEY,"***") if GROQ_API_KEY else resp.text[:200]
        log(f"Rate limit | Retry-After:{ra_raw!r} | {err}")
        raise RateLimitError("429", retry_after=ra)

    if resp.status_code in (500,502,503,504):
        raise requests.HTTPError(f"HTTP {resp.status_code}")

    resp.raise_for_status()
    data = resp.json()
    choices = data.get("choices",[])
    log(f"Choices: {len(choices)}")
    if not choices: raise ValueError("No choices")
    ch = choices[0]
    log(f"Finish: {ch.get('finish_reason')}")
    if ch.get("finish_reason") == "length":
        raise ValueError("Truncated at max_tokens")
    content = (ch.get("message") or {}).get("content") or ""
    log(f"Content: {len(content)} chars")
    if not content: raise ValueError("Empty content")
    return content

def parse_json(raw):
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*","",raw,flags=re.MULTILINE)
    raw = re.sub(r"\s*```$","",raw,flags=re.MULTILINE)
    raw = raw.strip()
    m = re.search(r"\{[\s\S]*\}",raw)
    if m: raw = m.group(0)
    return json.loads(raw)

def build_md(data, anime):
    now      = datetime.now(timezone.utc)
    ts       = str(int(now.timestamp()))
    date_h   = now.strftime("%b %d, %Y")
    date_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    title    = anime.get("title_english") or anime.get("title","")
    cover    = anime.get("images",{}).get("jpg",{}).get("large_image_url","")
    rating   = anime.get("score",8.0)
    desc     = data.get("description","")
    snippet  = desc[:150]+("..." if len(desc)>150 else "")

    fm = {
        "id":           ts,
        "title":        data["title"],
        "slug":         data["slug"],
        "category":     "Latest Anime Reviews",
        "anime_title":  title,
        "anime_id":     anime.get("mal_id",""),
        "season":       f"{str(anime.get('season','')).title()} {anime.get('year','')}".strip(),
        "release_date": anime.get("aired",{}).get("from","")[:10],
        "author":       "WeebHQ",
        "published_at": date_iso,
        "updated_at":   date_iso[:10],
        "cover_image":  cover,
        "img":          cover,
        "snippet":      snippet,
        "score":        float(rating) if rating else 8.0,
        "date":         date_h,
        "rating":       float(rating) if rating else 8.0,
        "status":       "published",
        "tags":         data.get("tags",["Anime Review"]),
        "description":  desc,
        "featured":     False,
    }
    fm_yaml = yaml.dump(fm,allow_unicode=True,default_flow_style=False,sort_keys=False).rstrip()
    return f"---\n{fm_yaml}\n---\n\n{data['article_body'].strip()}\n"

def main():
    log("="*55)
    log("WeebHQ Review Bot (Groq + Llama 3.3 70B)")
    log(f"API key: {'SET' if GROQ_API_KEY else 'MISSING - skipping'}")
    log("="*55)

    if not GROQ_API_KEY:
        log("GROQ_API_KEY_REVIEWS not set. Exiting."); return

    os.makedirs(CONTENT_DIR,exist_ok=True)
    known = existing_slugs()
    log(f"Existing reviews: {len(known)}")

    anime_list = fetch_top_anime(30)
    if not anime_list: log("No anime from Jikan."); return

    published = 0
    for anime in anime_list:
        if published >= MAX_REVIEWS: break
        mal_id = anime.get("mal_id")
        title  = anime.get("title_english") or anime.get("title","")
        slug   = slugify(title)

        if slug in known: log(f"Skip (exists): {title}"); continue
        if not anime.get("synopsis"): log(f"Skip (no synopsis): {title}"); continue

        log(f"\nReviewing: {title} (MAL #{mal_id})")
        details = fetch_anime_details(mal_id) or anime
        prompt  = build_prompt(details)

        for attempt in range(1,4):
            log(f"Attempt {attempt}/3")
            if attempt > 1: time.sleep(8+random.uniform(0,3))
            try:
                raw  = call_groq(prompt)
                data = parse_json(raw)
                body = data.get("article_body","")
                if len(body) < MIN_BODY_CHARS:
                    log(f"Body too short ({len(body)}). Retry."); continue
                final_slug = data.get("slug",slug) or slug
                if final_slug in known: log(f"Slug collision: {final_slug}. Skip."); break
                md = build_md(data,details)
                fp = os.path.join(CONTENT_DIR,final_slug+".md")
                if os.path.exists(fp): log(f"File exists. Skip."); break
                with open(fp,"w",encoding="utf-8") as f: f.write(md)
                log(f"Published: {fp} ({len(body)} chars)")
                known.add(final_slug); published += 1; break
            except RateLimitError as e:
                wait = min((e.retry_after or 0)+random.uniform(5,15),MAX_RETRY_WAIT) if e.retry_after \
                       else min(2**(attempt+3)+random.uniform(0,10),MAX_RETRY_WAIT)
                log(f"Rate limit -> {wait:.0f}s"); time.sleep(wait)
            except Exception as e:
                wait = min(2**attempt+random.uniform(0,5),MAX_RETRY_WAIT)
                log(f"Error: {e} -> {wait:.0f}s"); time.sleep(wait)

        time.sleep(3)

    log(f"\nDone. Published {published} review(s).")

if __name__ == "__main__": main()