import os
import time
import feedparser
from datetime import datetime
import google.generativeai as genai

# ==========================================
# Weeb - The Autonomous Anime Agent 🤖
# ==========================================

# 1. RSS Feeds to Monitor
RSS_FEEDS = {
    "news": "https://www.animenewsnetwork.com/news/rss.xml",
    # We can add more feeds for 'reviews' and 'recommendations' later
}

# Your Gemini API Key (Set this in Github Secrets later)
API_KEY = os.environ.get("WEEB_API_KEY", "")

if API_KEY:
    genai.configure(api_key=API_KEY)
    # Using the fast and lightweight flash model
    model = genai.GenerativeModel('gemini-3.5-flash')

def rewrite_article_with_llm(title, summary, link, category, img_url):
    """
    This function acts as Weeb's brain. 
    It will take the original article and rewrite it using Gemini API.
    """
    print(f"[*] Weeb's brain is processing: {title}")
    
    timestamp = int(time.time())
    date_str = datetime.now().strftime('%b %d, %Y')
    
    if not API_KEY:
        print("[!] No WEEB_API_KEY found! Using basic text.")
        return f"""---
id: "{timestamp}"
title: "{title}"
date: "{date_str}"
snippet: "This article was autonomously caught by Weeb!"
img: "{img_url}"
author: "Weeb"
---

Original News: {title}
Source: [Read Original]({link})

{summary}
"""

    prompt = f"""
    You are an expert anime journalist named Weeb. 
    Rewrite the following {category} article in English to make it engaging, SEO-friendly, and slightly longer. 
    Do NOT invent false facts, only use the details provided.
    
    Original Title: {title}
    Original Text: {summary}
    Source Link: {link}
    
    Your response MUST be ONLY raw markdown containing frontmatter and the content. Do not include ```markdown blocks.
    
    Format:
    ---
    id: "{timestamp}"
    title: "<A catchy rewritten title>"
    date: "{date_str}"
    snippet: "<A 1-sentence engaging summary>"
    img: "{img_url}"
    author: "Weeb"
    ---
    
    <Your rewritten markdown article here>
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.replace("```markdown", "").replace("```", "").strip()
        return text
    except Exception as e:
        print(f"[!] Weeb got a headache (API Error): {e}")
        # Fallback if API fails
        return f"""---
id: "{timestamp}"
title: "{title}"
date: "{date_str}"
snippet: "Weeb tried to rewrite this but got an API error."
img: "{img_url}"
author: "Weeb"
---

Original News: {title}
Source: [Read Original]({link})

{summary}

(Note: Weeb AI rewriting failed due to API limits/errors.)
"""

import re

def process_feed(category, feed_url):
    print(f"[*] Weeb is reading {category} feed: {feed_url}")
    feed = feedparser.parse(feed_url)
    
    # Weeb only looks at the first 2 latest news so we don't spam the site
    for entry in feed.entries[:2]:
        title = entry.title
        link = entry.link
        summary = entry.get('summary', entry.get('description', ''))
        
        # Extract Image
        img_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png"
        if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
            img_url = entry.media_thumbnail[0]['url']
        else:
            img_match = re.search(r'<img[^>]+src="([^">]+)"', summary)
            if img_match:
                img_url = img_match.group(1)
        
        # Make a safe filename from the title
        safe_title = "".join([c for c in title if c.isalnum() or c==' ']).rstrip()
        filename = safe_title.replace(" ", "-").lower()[:50] + ".md"
        filepath = os.path.join("content", category, filename)
        
        # If Weeb already wrote this, skip it
        if os.path.exists(filepath):
            print(f"[-] Weeb already wrote about this: {title}")
            continue
            
        print(f"[+] Weeb found new {category}: {title}")
        
        # Ask LLM to rewrite
        markdown_content = rewrite_article_with_llm(title, summary, link, category, img_url)
        
        # Save the new article to the site
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
            
        print(f"[SUCCESS] Weeb successfully published: {filename}")

def main():
    print("==========================================")
    print("🤖 Weeb Agent is waking up...")
    print("==========================================")
    
    for category, url in RSS_FEEDS.items():
        try:
            process_feed(category, url)
        except Exception as e:
            print(f"[ERROR] Weeb got confused in {category}: {e}")
            
    print("==========================================")
    print("🤖 Weeb Agent is going back to sleep. Zzz...")
    print("==========================================")

if __name__ == "__main__":
    main()
