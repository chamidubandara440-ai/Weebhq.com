import os
import re
import time
import json
import feedparser
import requests
import urllib.request
from datetime import datetime
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS

# ==========================================
# Weeb - The Autonomous Anime Agent
# ==========================================

RSS_FEEDS = {
    "news": "https://www.animenewsnetwork.com/news/rss.xml",
    "reviews": "https://www.animenewsnetwork.com/review/rss.xml",
    "recommendations": "https://www.animenewsnetwork.com/feature/rss.xml"
}

ddgs = DDGS()

# ==========================================
# NEWS: Free direct parsing - NO AI, NO outbound links
# ==========================================
def create_raw_article(title, summary, link, img_url):
    timestamp = int(time.time())
    date_str = datetime.now().strftime('%b %d, %Y')

    # Strip all HTML tags cleanly
    clean_text = BeautifulSoup(summary, "html.parser").get_text(separator=" ").strip()
    clean_text = " ".join(clean_text.split())

    snippet = clean_text[:150] + ("..." if len(clean_text) > 150 else "")
    title_safe = title.replace('"', "'")
    snippet_safe = snippet.replace('"', "'")

    # Full article body - NO external link, all traffic stays on WeebHQ
    return f"""---
id: "{timestamp}"
title: "{title_safe}"
date: "{date_str}"
snippet: "{snippet_safe}"
img: "{img_url}"
score: 8.5
author: "WeebHQ News"
---

{clean_text}
"""

# ==========================================
# REVIEWS / RECOMMENDATIONS: Free AI rewrite - NO outbound links
# ==========================================
def rewrite_with_ai(title, summary, link, category, img_url):
    timestamp = int(time.time())
    date_str = datetime.now().strftime('%b %d, %Y')

    clean_text = BeautifulSoup(summary, "html.parser").get_text(separator=" ").strip()
    clean_text = " ".join(clean_text.split())

    prompt = f"""You are an expert anime journalist writing for WeebHQ.
Rewrite the following anime {category} article in English into a full, engaging article.
CRITICAL RULES:
1. DO NOT invent ANY facts. Only use the information provided.
2. Do NOT include any links or references to external websites.
3. Write enough content to fill a complete article (at least 3 paragraphs).

Original Title: {title}
Original Text: {clean_text}

Respond with ONLY raw Markdown. No codeblocks. Use this exact format:

---
id: "{timestamp}"
title: "catchy rewritten title here"
date: "{date_str}"
snippet: "one sentence summary here"
img: "{img_url}"
score: 8.5
author: "WeebHQ AI"
---

Write the full article here. Minimum 3 paragraphs. No external links.
"""

    try:
        print(f"[*] Using Free DuckDuckGo AI for {category}...")
        result = ddgs.chat(prompt, model='gpt-4o-mini')
        text = result.replace("```markdown", "").replace("```", "").strip()
        # Remove any external links that AI might have added
        text = re.sub(r'\[([^\]]+)\]\(https?://[^\)]+\)', r'\1', text)
        return text
    except Exception as e:
        print(f"[!] Free AI Error on {category}: {e}")
        title_safe = title.replace('"', "'")
        snippet = clean_text[:150].replace('"', "'")
        return f"""---
id: "{timestamp}"
title: "{title_safe}"
date: "{date_str}"
snippet: "{snippet}"
img: "{img_url}"
score: 8.0
author: "WeebHQ AI"
---

{clean_text}
"""

# ==========================================
# Image Extractor
# ==========================================
def get_og_image(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        html = urllib.request.urlopen(req, timeout=10).read()
        soup = BeautifulSoup(html, "html.parser")
        og_img = soup.find("meta", property="og:image")
        if og_img and og_img.get("content"):
            return og_img["content"]
    except Exception as e:
        print(f"Image scrape error: {e}")
    return None

# ==========================================
# Feed Processor
# ==========================================
def process_feed(category, feed_url):
    print(f"[*] Weeb is reading {category} feed: {feed_url}")
    feed = feedparser.parse(feed_url)

    for entry in feed.entries[:2]:
        title = entry.title
        link = entry.link
        summary = entry.get("summary", entry.get("description", ""))

        img_url = get_og_image(link)
        if not img_url:
            if hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
                img_url = entry.media_thumbnail[0]["url"]
            else:
                img_match = re.search(r'<img[^>]+src="([^">]+)"', summary)
                img_url = img_match.group(1) if img_match else f"https://placehold.co/400x600/1a1a24/ffffff?text={category.capitalize()}"

        safe_title = "".join([c for c in title if c.isalnum() or c == " "]).rstrip()
        filename = safe_title.replace(" ", "-").lower()[:50] + ".md"
        filepath = os.path.join("content", category, filename)

        if os.path.exists(filepath):
            print(f"[-] Already written: {title}")
            continue

        print(f"[+] New {category}: {title}")

        if category == "news":
            markdown_content = create_raw_article(title, summary, link, img_url)
        else:
            markdown_content = rewrite_with_ai(title, summary, link, category, img_url)

        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(markdown_content)

        print(f"[SUCCESS] Published: {filename}")

# ==========================================
# Main
# ==========================================
def main():
    print("==========================================")
    print("Weeb Agent is waking up...")
    print("==========================================")

    for category, url in RSS_FEEDS.items():
        try:
            process_feed(category, url)
        except Exception as e:
            print(f"[ERROR] in {category}: {e}")

    print("==========================================")
    print("Weeb Agent done. Zzz...")
    print("==========================================")

if __name__ == "__main__":
    main()