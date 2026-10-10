"""
WeebHQ Recommendation Bot - Groq + Llama 3.3 70B
==================================================
Picks trending anime from Jikan, generates AI recommendation
articles, saves to content/articles/latest-anime-recommendations/

Env: GROQ_API_KEY_RECS
"""
import os, re, json, time, random, requests, yaml
from datetime import datetime, timezone

GROQ_BASE_URL  = "https://api.groq.com/openai/v1"
GROQ_MODELS = ["llama-3.3-70b-versatile","llama-3.1-70b-versatile","llama3-70b-8192","mixtral-8x7b-32768"]
GROQ_API_KEY   = os.environ.get("GROQ_API_KEY_RECS", "")
CONTENT_DIR    = os.path.join("content","articles","latest-anime-recommendations")
JIKAN_BASE     = "https://api.jikan.moe/v4"
MAX_RECS       = 2
MIN_BODY_CHARS = 1200
MAX_RETRY_WAIT = 90

class RateLimitError(Exception):
    def __init__(self, msg, retry_after=None):
        super().__init__(msg)
        self.retry_after = retry_after

def log(msg): print(f"[Rec Bot] {msg}", flush=True)

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]","",text)
    text = re.sub(r"[\s_]+","-",text)
    text = re.sub(r"-+","-",text)
    return text[:70].strip("-")

def existing_slugs():
    if not os.path.exists(CONTENT_DIR): return set()
    return {f.replace(".md","") for f in os.listdir(CONTENT_DIR) if f.endswith(".md")}

def fetch_seasonal():
    try:
        resp = requests.get(f"{JIKAN_BASE}/seasons/now", params={"limit":20}, timeout=15)
        if resp.status_code == 200: return resp.json().get("data",[])
    except Exception as e: log(f"Jikan error: {e}")
    return []

SYSTEM_PROMPT = """\
You are an enthusiastic anime recommendation writer for WeebHQ.com.

Write a compelling "Should You Watch?" recommendation article for an anime.

RULES:
1. Write 500-900 words.
2. Structure:
   - Introduction (why this anime is being recommended RIGHT NOW)
   - ## What Is [Anime Name]?
   - ## Why You'll Love It (target audience, key appeal)
   - ## Who Is This For? (genre fans, newcomers, veterans)
   - ## Quick Stats (mention MAL score, episodes, studio)
   - ## Our Verdict
3. Base EVERY claim on the provided data.
4. Be enthusiastic and fan-focused.
5. Return ONLY valid JSON:
{
  "title": "<recommendation title, max 90 chars>",
  "slug": "<slug, lowercase hyphens, max 70 chars>",
  "description": "<meta description 120-160 chars>",
  "tags": ["tag1","tag2","tag3"],
  "article_body": "<full Markdown article with ## headings>"
}
"""

def build_prompt(anime):
    title    = anime.get("title_english") or anime.get("title","Unknown")
    score    = anime.get("score","N/A")
    episodes = anime.get("episodes","Unknown")
    synopsis = (anime.get("synopsis","") or "")[:2500]
    genres   = ", ".join(g["name"] for g in anime.get("genres",[]))
    themes   = ", ".join(t["name"] for t in anime.get("themes",[]))
    studios  = ", ".join(s["name"] for s in anime.get("studios",[]))
    season   = f"{str(anime.get('season','')).title()} {anime.get('year','')}".strip()

    return f"""=== ANIME INFO ===
Title:     {title}
MAL Score: {score}/10
Episodes:  {episodes} | Season: {season}
Genres:    {genres}
Themes:    {themes}
Studio:    {studios}

Synopsis:
{synopsis}

=== TASK ===
Write a compelling "Should You Watch?" recommendation for WeebHQ.com.
Make anime fans excited to watch this. Return ONLY the JSON object.
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
        "messages":   [{"role":"system","content":SYSTEM_PROMPT},{"role":"user","content":prompt}],
        "max_tokens": 2500,
        "temperature":0.7,
    }
    resp = requests.post(f"{GROQ_BASE_URL}/chat/completions",headers=headers,json=payload,timeout=60)
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
        raise RateLimitError("429",retry_after=ra)

    if resp.status_code in (500,502,503,504):
        raise requests.HTTPError(f"HTTP {resp.status_code}")

    resp.raise_for_status()
    choices = resp.json().get("choices",[])
    if not choices: raise ValueError("No choices")
    ch = choices[0]
    log(f"Finish: {ch.get('finish_reason')}")
    if ch.get("finish_reason")=="length": raise ValueError("Truncated")
    content = (ch.get("message") or {}).get("content") or ""
    log(f"Content: {len(content)} chars")
    if not content: raise ValueError("Empty")
        return content
    raise last_error or ValueError("All models failed")

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
    cover    = anime.get("images",{}).get("jpg",{}).get("large_image_url","")
    desc     = data.get("description","")
    snippet  = desc[:150]+("..." if len(desc)>150 else "")

    fm = {
        "id":           ts,
        "title":        data["title"],
        "slug":         data["slug"],
        "category":     "Latest Anime Recommendations",
        "anime_title":  anime.get("title_english") or anime.get("title",""),
        "anime_id":     anime.get("mal_id",""),
        "author":       "WeebHQ",
        "published_at": date_iso,
        "cover_image":  cover,
        "img":          cover,
        "snippet":      snippet,
        "score":        float(anime.get("score") or 8.0),
        "date":         date_h,
        "status":       "published",
        "tags":         data.get("tags",["Anime Recommendation"]),
        "description":  desc,
    }
    fm_yaml = yaml.dump(fm,allow_unicode=True,default_flow_style=False,sort_keys=False).rstrip()
    return f"---\n{fm_yaml}\n---\n\n{data['article_body'].strip()}\n"

def main():
    log("="*55)
    log("WeebHQ Rec Bot (Groq + Llama 3.3 70B)")
    log(f"API key: {'SET' if GROQ_API_KEY else 'MISSING'}")
    log("="*55)

    if not GROQ_API_KEY: log("GROQ_API_KEY_RECS not set."); return

    os.makedirs(CONTENT_DIR,exist_ok=True)
    known = existing_slugs()
    log(f"Existing recs: {len(known)}")

    anime_list = fetch_seasonal()
    if not anime_list: log("No seasonal anime."); return

    # Sort by score descending
    anime_list.sort(key=lambda a: float(a.get("score") or 0), reverse=True)

    published = 0
    for anime in anime_list:
        if published >= MAX_RECS: break
        title = anime.get("title_english") or anime.get("title","")
        slug  = "recommendation-" + slugify(title)
        if slug in known: log(f"Skip: {title}"); continue
        if not anime.get("synopsis"): continue

        log(f"\nGenerating rec for: {title}")
        prompt = build_prompt(anime)

        for attempt in range(1,4):
            log(f"Attempt {attempt}/3")
            if attempt > 1: time.sleep(7+random.uniform(0,3))
            try:
                raw  = call_groq(prompt)
                data = parse_json(raw)
                body = data.get("article_body","")
                if len(body) < MIN_BODY_CHARS:
                    log(f"Body too short ({len(body)}). Retry."); continue
                final_slug = data.get("slug",slug) or slug
                if final_slug in known: log(f"Slug collision. Skip."); break
                md = build_md(data,anime)
                fp = os.path.join(CONTENT_DIR,final_slug+".md")
                if os.path.exists(fp): log(f"File exists."); break
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

    log(f"\nDone. Published {published} rec(s).")

if __name__ == "__main__": main()