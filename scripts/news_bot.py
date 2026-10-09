"""
WeebHQ News Bot - with 429 Retry-After handling
"""
import os, re, json, time, random, feedparser, requests, yaml, urllib.request, sys
from datetime import datetime, timezone
from bs4 import BeautifulSoup

RSS_FEEDS            = ["https://www.animenewsnetwork.com/news/rss.xml"]
OPENROUTER_BASE_URL  = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL     = "google/gemma-4-31b-it:free"
OPENROUTER_API_KEY   = os.environ.get("OPENROUTER_API_KEY", "")
CONTENT_DIR          = os.path.join("content", "news")
MAX_ARTICLES_PER_RUN = 2
MAX_AI_ATTEMPTS      = 3
MIN_ARTICLE_CHARS    = 1500
REQUEST_DELAY        = 5.0
INTER_REQUEST_DELAY  = 8.0
MAX_RETRY_WAIT       = 120

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
    slugs = set()
    if not os.path.exists(CONTENT_DIR): return slugs
    for f in os.listdir(CONTENT_DIR):
        if f.endswith(".md"): slugs.add(f.replace(".md",""))
    return slugs

def get_og_image(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"})
        html = urllib.request.urlopen(req, timeout=10).read()
        soup = BeautifulSoup(html, "html.parser")
        tag = soup.find("meta", property="og:image")
        if tag and tag.get("content"): return tag["content"]
    except: pass
    return ""

def clean_html(raw):
    return " ".join(BeautifulSoup(raw,"html.parser").get_text(separator=" ").split()).strip()

def fetch_full_article_text(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"})
        html = urllib.request.urlopen(req, timeout=12).read()
        soup = BeautifulSoup(html, "html.parser")
        for sel in ["#content-zone",".meat","article",".news-body"]:
            el = soup.select_one(sel)
            if el:
                text = " ".join(el.get_text(separator=" ").split())
                if len(text)>200: return text[:4000]
        paragraphs = soup.find_all("p")
        text = " ".join(p.get_text() for p in paragraphs).strip()
        if len(text)>200: return " ".join(text.split())[:4000]
    except Exception as e: log(f"Full article fetch failed: {e}")
    return ""

SYSTEM_PROMPT = """\
You are a professional anime journalist writing for WeebHQ.com.

Write a COMPLETE, FULL-LENGTH anime news article based ONLY on the source material supplied.

MANDATORY RULES:
1. Write approximately 600-1000 words when the source contains enough information.
2. Do NOT return only the source description.
3. Do NOT summarize in one sentence.
4. Do NOT invent any facts not present in the source material.
5. Do NOT fabricate quotes, release dates, or character/plot details.
6. Use a proper journalistic structure:
   - An engaging introduction paragraph
   - Multiple body paragraphs with ## headings where appropriate
   - A clear conclusion paragraph
7. Every factual statement MUST be supported by the supplied source material.
8. Write in clean, professional English.

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
    title  = getattr(entry,"title","").strip()
    summary = clean_html(getattr(entry,"summary",getattr(entry,"description","")))
    link   = getattr(entry,"link","")
    pub    = getattr(entry,"published","")
    source_body = full_text if full_text and len(full_text)>len(summary) else summary
    return f"""=== SOURCE INFORMATION ===
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

def _single_openrouter_call(user_prompt):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://weebhq.com",
        "X-Title":       "WeebHQ",
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role":"system","content":SYSTEM_PROMPT},
            {"role":"user","content":user_prompt},
        ],
        "max_tokens": 2048,
        "temperature": 0.5,
    }
    resp = requests.post(f"{OPENROUTER_BASE_URL}/chat/completions",
                         headers=headers, json=payload, timeout=60)
    log(f"OpenRouter status: {resp.status_code}")

    if resp.status_code == 429:
        retry_after_raw = resp.headers.get("Retry-After","")
        try:   retry_after = int(retry_after_raw)
        except: retry_after = None
        try:
            err_body = resp.text[:300]
            if OPENROUTER_API_KEY and OPENROUTER_API_KEY in err_body:
                err_body = err_body.replace(OPENROUTER_API_KEY,"***")
        except: err_body = "<unreadable>"
        log(f"Rate-limit details | Retry-After: {retry_after_raw!r} | body: {err_body}")
        raise RateLimitError("HTTP 429", retry_after=retry_after)

    if resp.status_code in (500,502,503,504):
        try:   err_body = resp.text[:300]
        except: err_body = "<unreadable>"
        log(f"Server error {resp.status_code} | body: {err_body}")
        raise requests.HTTPError(f"Retryable HTTP {resp.status_code}")

    resp.raise_for_status()

    try:   resp_json = resp.json()
    except Exception as e: raise ValueError(f"JSON parse failed: {e}")

    choices = resp_json.get("choices",[])
    log(f"Choices count: {len(choices)}")
    if not choices:
        err = resp_json.get("error",{})
        log(f"No choices. Error field: {str(err)[:200]}")
        raise ValueError("No choices in response")

    choice = choices[0]
    log(f"Finish reason: {choice.get('finish_reason','unknown')}")
    content = choice.get("message",{}).get("content","")
    log(f"AI content length: {len(content)}")
    if not content: raise ValueError("Empty content")
    return content

def parse_ai_json(raw):
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*","",raw,flags=re.MULTILINE)
    raw = re.sub(r"\s*```$","",raw,flags=re.MULTILINE)
    raw = raw.strip()
    m = re.search(r"\{[\s\S]*\}",raw)
    if m: raw = m.group(0)
    data = json.loads(raw)
    log(f"JSON parse: success (keys: {list(data.keys())})")
    return data

def validate_ai_content(data, rss_summary):
    if not isinstance(data,dict): return False,"Not a dict"
    title = data.get("title","")
    if not title or len(title)<5: return False,"title missing or too short"
    body = data.get("article_body","")
    if not body: return False,"article_body missing"
    if len(body)<MIN_ARTICLE_CHARS:
        return False, f"article_body too short: {len(body)} chars (min {MIN_ARTICLE_CHARS})"
    rss_clean = rss_summary.strip().lower()
    body_clean = body.strip().lower()
    if rss_clean and len(rss_clean)>20:
        if body_clean.startswith(rss_clean[:80].lower()) and len(body)<len(rss_summary)+200:
            return False,"article_body is just the RSS description"
    if "\n" not in body and "##" not in body and len(body)<2000:
        return False,"article_body appears to be a single unstructured block"
    return True,"PASS"

def generate_article_with_ai(entry, full_text=""):
    rss_summary  = clean_html(getattr(entry,"summary",getattr(entry,"description","")))
    user_prompt  = build_user_prompt(entry, full_text)
    source_title = getattr(entry,"title","unknown")

    for attempt in range(1, MAX_AI_ATTEMPTS+1):
        log(f"AI attempt {attempt}/{MAX_AI_ATTEMPTS} for: {source_title}")

        if attempt > 1:
            pre = INTER_REQUEST_DELAY + random.uniform(0,3)
            log(f"Pre-request delay: {pre:.1f}s")
            time.sleep(pre)

        try:
            raw = _single_openrouter_call(user_prompt)
        except RateLimitError as e:
            if e.retry_after is not None:
                wait = min(float(e.retry_after)+random.uniform(1,5), MAX_RETRY_WAIT)
                log(f"Rate limit: honouring Retry-After={e.retry_after}s -> waiting {wait:.0f}s")
            else:
                wait = min(2**(attempt+3)+random.uniform(0,10), MAX_RETRY_WAIT)
                log(f"Rate limit: no Retry-After header -> backoff {wait:.0f}s")
            time.sleep(wait)
            continue
        except requests.HTTPError as e:
            wait = min(2**attempt+random.uniform(0,5), MAX_RETRY_WAIT)
            log(f"HTTP error: {e} -> backoff {wait:.0f}s")
            time.sleep(wait)
            continue
        except Exception as e:
            wait = min(2**attempt+random.uniform(0,3), MAX_RETRY_WAIT)
            log(f"Request error (attempt {attempt}): {e} -> waiting {wait:.0f}s")
            time.sleep(wait)
            continue

        try:   data = parse_ai_json(raw)
        except Exception as e:
            log(f"JSON parse failed (attempt {attempt}): {e}")
            time.sleep(2**attempt)
            continue

        ok, reason = validate_ai_content(data, rss_summary)
        log(f"Validation: {reason}")

        if ok:
            if not re.match(r"^[a-z0-9-]+$", data.get("slug","")):
                data["slug"] = slugify(getattr(entry,"title","article"))
            log(f"Final article length: {len(data.get('article_body',''))} chars")
            return data

        log(f"Content rejected (attempt {attempt}) - reason: {reason}")
        time.sleep(2**attempt)

    log(f"AI generation failed after {MAX_AI_ATTEMPTS} attempts. Skipping article.")
    return None

def build_markdown(data, img_url):
    now       = datetime.now(timezone.utc)
    ts        = str(int(now.timestamp()))
    date_h    = now.strftime("%b %d, %Y")
    date_iso  = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    desc      = data.get("description","")
    snippet   = desc[:150]+("..." if len(desc)>150 else "")
    fm = {
        "id": ts, "title": data["title"], "slug": data["slug"],
        "category": "Anime News", "date": date_h, "snippet": snippet,
        "img": img_url or "https://placehold.co/400x600/1a1a24/ffffff?text=News",
        "description": desc, "cover_image": img_url or "",
        "author": "WeebHQ News", "published_at": date_iso,
        "score": 8.5, "tags": data.get("tags",["Anime News"]), "status": "published",
    }
    fm_yaml = yaml.dump(fm,allow_unicode=True,default_flow_style=False,sort_keys=False).rstrip()
    return f"---\n{fm_yaml}\n---\n\n{data['article_body'].strip()}\n"

def validate_markdown_frontmatter(md):
    try:
        if not md.startswith("---"): return False,"Missing opening ---"
        end = md.index("\n---",3)
        parsed = yaml.safe_load(md[3:end].strip())
        if not isinstance(parsed,dict): return False,"Not a dict"
        for k in ("id","title","slug","date","snippet","img"):
            if k not in parsed: return False,f"Missing key: {k}"
        return True,""
    except Exception as e: return False,str(e)

def dry_run_test():
    log("="*50)
    log("DRY-RUN TEST MODE - no articles will be published")
    log("="*50)
    if not OPENROUTER_API_KEY:
        log("OPENROUTER_API_KEY not set - cannot test.")
        return
    feed = feedparser.parse(RSS_FEEDS[0])
    if not feed.entries: log("No RSS entries."); return
    entry = feed.entries[0]
    title = getattr(entry,"title","")
    log(f"Source found: {title}")
    link      = getattr(entry,"link","")
    full_text = fetch_full_article_text(link) if link else ""
    if full_text: log(f"Full article text fetched: {len(full_text)} chars")
    rss_summary = clean_html(getattr(entry,"summary",getattr(entry,"description","")))
    user_prompt = build_user_prompt(entry, full_text)
    log("Calling OpenRouter (single attempt for dry-run)...")
    try:
        raw = _single_openrouter_call(user_prompt)
    except RateLimitError as e:
        log(f"DRY-RUN: Rate limited (429). retry_after={e.retry_after}"); return
    except Exception as e:
        log(f"DRY-RUN: Call failed: {e}"); return
    try:   data = parse_ai_json(raw)
    except Exception as e:
        log(f"DRY-RUN: JSON parse failed: {e}"); return
    ok, reason = validate_ai_content(data, rss_summary)
    log(f"Validation: {reason}")
    log(f"Final article length: {len(data.get('article_body',''))} chars")
    if ok: log("DRY-RUN RESULT: PASS - article would be published")
    else:  log(f"DRY-RUN RESULT: FAIL - article would be skipped ({reason})")
    log("="*50)
    log("DRY-RUN complete. No files written.")
    log("="*50)

def main():
    log("="*50)
    log("News Bot waking up...")
    log(f"API key configured: {'YES' if OPENROUTER_API_KEY else 'NO'}")
    log("="*50)
    os.makedirs(CONTENT_DIR, exist_ok=True)
    known_slugs = existing_slugs()
    log(f"Existing articles: {len(known_slugs)}")
    published = 0
    for feed_url in RSS_FEEDS:
        if published >= MAX_ARTICLES_PER_RUN: break
        log(f"Fetching feed: {feed_url}")
        try:   feed = feedparser.parse(feed_url)
        except Exception as e: log(f"Feed fetch failed: {e}"); continue
        for entry in feed.entries[:5]:
            if published >= MAX_ARTICLES_PER_RUN: break
            title = getattr(entry,"title","").strip()
            if not title: continue
            candidate_slug = slugify(title)
            if candidate_slug in known_slugs:
                log(f"Already published: {title}"); continue
            log(f"Source found: {title}")
            link      = getattr(entry,"link","")
            img_url   = get_og_image(link) if link else ""
            full_text = fetch_full_article_text(link) if link else ""
            if full_text: log(f"Full article text fetched: {len(full_text)} chars")
            if not OPENROUTER_API_KEY:
                log("OPENROUTER_API_KEY not set. Skipping."); continue
            data = generate_article_with_ai(entry, full_text)
            if data is None:
                log(f"Skipping: {title} (AI failed)"); continue
            slug = data.get("slug",candidate_slug) or candidate_slug
            if slug in known_slugs: log(f"Slug collision: {slug}. Skipping."); continue
            md = build_markdown(data, img_url)
            ok, err = validate_markdown_frontmatter(md)
            if not ok: log(f"Frontmatter invalid: {err}. Skipping."); continue
            filepath = os.path.join(CONTENT_DIR, slug+".md")
            if os.path.exists(filepath): log(f"File exists: {filepath}. Skipping."); continue
            with open(filepath,"w",encoding="utf-8") as f: f.write(md)
            log(f"Published: {filepath} ({len(data['article_body'])} chars)")
            known_slugs.add(slug)
            published += 1
            time.sleep(REQUEST_DELAY)
    log("="*50)
    log(f"No new articles published." if published==0 else f"Published {published} article(s).")
    log("News Bot done.")
    log("="*50)

if __name__ == "__main__":
    if "--dry-run" in sys.argv: dry_run_test()
    else: main()