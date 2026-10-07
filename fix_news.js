const fs = require('fs');
let c = fs.readFileSync('scripts/weeb.py', 'utf8');

const rawArticleFunc = `def create_raw_article(title, summary, link, category, img_url):
    timestamp = int(time.time())
    date_str = datetime.now().strftime('%b %d, %Y')
    clean_snippet = BeautifulSoup(summary, "html.parser").get_text(separator=" ").strip()
    clean_snippet = " ".join(clean_snippet.split())[:150] + "..."
    
    # safe replace
    title_safe = title.replace('"', "'")
    snippet_safe = clean_snippet.replace('"', "'")
    
    return f"""---
id: "{timestamp}"
title: "{title_safe}"
date: "{date_str}"
snippet: "{snippet_safe}"
img: "{img_url}"
score: 8.5
author: "WeebHQ News"
---

{summary}

[Read the full original article here]({link})
"""

def rewrite_article_with_llm`;

c = c.replace("def rewrite_article_with_llm", rawArticleFunc);

c = c.replace(
  "        # Ask LLM to rewrite\n        markdown_content = rewrite_article_with_llm(title, summary, link, category, img_url)",
  "        # Use free raw fetch for news, LLM for others\n        if category == 'news':\n            markdown_content = create_raw_article(title, summary, link, category, img_url)\n        else:\n            markdown_content = rewrite_article_with_llm(title, summary, link, category, img_url)"
);

fs.writeFileSync('scripts/weeb.py', c, 'utf8');
console.log("Updated weeb.py to bypass Gemini for news category");