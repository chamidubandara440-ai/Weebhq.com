import os
import json
import time
import requests
import yaml
import google.generativeai as genai
from datetime import datetime

# 1. Similarity Engine (Port of the JS logic)
TITLE_GENRE_MAP = [
    {"keywords": ['shingeki','attack on titan','chainsaw','bleach','naruto','one piece','dragon ball','demon slayer','kimetsu','jujutsu','hunter x hunter','black clover','kingdom','steel ball','jojo'], "genres": ['Action','Battle','Shonen']},
    {"keywords": ['clannad','violet evergarden','3-gatsu','lion','fruits basket','koe no katachi','march comes'], "genres": ['Drama','Slice of Life','Emotional']},
    {"keywords": ['gintama','konosuba','spy x family','mob psycho','one punch'], "genres": ['Comedy','Parody']},
    {"keywords": ['kaguya','tonikawa','horimiya','toradora'], "genres": ['Romance','Comedy']},
    {"keywords": ['frieren','re:zero','rezero','sword art','overlord','konosuba','tanya','youjo senki'], "genres": ['Fantasy','Isekai']},
    {"keywords": ['steins','gate','code geass','monster','death note','psycho-pass'], "genres": ['Sci-Fi','Thriller','Mystery']},
    {"keywords": ['haikyuu','hajime no ippo','slam dunk','pingpong','ippo'], "genres": ['Sports']},
    {"keywords": ['vinland saga','kingdom','ashita no joe','ginga eiyuu'], "genres": ['Historical','Action']},
    {"keywords": ['chainsaw','monster','berserk','elfen'], "genres": ['Dark','Seinen']},
    {"keywords": ['bang dream','love live','uta no prince'], "genres": ['Music','Idol']},
    {"keywords": ['kimi no na wa','spirited away','your name','sen to chihiro','kizumonogatari','koe no katachi'], "genres": ['Movie','Drama']},
    {"keywords": ['kusuriya','apothecary','monogatari','bakemonogatari','owarimonogatari'], "genres": ['Mystery','Drama']},
    {"keywords": ['mob psycho','one punch man','my hero academia','boku no hero'], "genres": ['Superhero','Action','Comedy']},
]

def infer_genres(anime):
    title = f"{anime.get('title', '')} {anime.get('title_english', '')}".lower()
    genres = set()
    for mapping in TITLE_GENRE_MAP:
        if any(k in title for k in mapping["keywords"]):
            genres.update(mapping["genres"])
    return list(genres)

def compute_similarity(a, b):
    if a.get('id') == b.get('id'):
        return -1
    
    score = 0
    if a.get('anime_type') and b.get('anime_type') and a['anime_type'] == b['anime_type']:
        score += 20
    if a.get('season') and b.get('season') and a['season'] == b['season']:
        score += 10
    if a.get('season_year') and b.get('season_year') and a['season_year'] == b['season_year']:
        score += 8
    
    a_studios = (a.get('studios') or '').lower()
    b_studios = (b.get('studios') or '').lower()
    if a_studios and b_studios:
        for s in a_studios.split(','):
            if s.strip() and s.strip() in b_studios:
                score += 15
                break

    a_genres = infer_genres(a)
    b_genres = infer_genres(b)
    overlap = len(set(a_genres) & set(b_genres))
    score += overlap * 12

    if a.get('score') is not None and b.get('score') is not None:
        diff = abs(a['score'] - b['score'])
        if diff <= 0.3: score += 10
        elif diff <= 0.6: score += 5
        elif diff <= 1.0: score += 2

    return score

# 2. Main Bot Logic
def fetch_anime():
    url1 = "https://weebhq-api.chamidubandara440.workers.dev/api/anime?limit=50"
    url2 = "https://weebhq-api.chamidubandara440.workers.dev/api/anime?limit=50&offset=50"
    anime = []
    try:
        res1 = requests.get(url1)
        if res1.status_code == 200: anime.extend(res1.json().get('data', []))
        res2 = requests.get(url2)
        if res2.status_code == 200: anime.extend(res2.json().get('data', []))
    except Exception as e:
        print(f"Error fetching anime: {e}")
    return anime

def setup_gemini():
    api_key = os.environ.get("WEEB_API_KEY")
    if not api_key:
        print("Warning: WEEB_API_KEY not found. Will use deterministic fallback explanations.")
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash')

def get_explanation(model, source, rec):
    fallback = "Recommended because it shares similar themes, genres, and storytelling elements."
    if not model:
        return fallback
    
    prompt = f"""
    You are an expert anime critic for WeebHQ. Write a ONE SENTENCE explanation of why someone who likes "{source.get('title')}" would also enjoy "{rec.get('title')}".
    Focus on factual shared elements like genre, tone, setting, or character dynamics.
    Do NOT invent details. Do NOT mention studios or release dates unless strictly relevant.
    Start the sentence with "Recommended because".
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.strip().replace('"', '').replace('\n', ' ')
        if text.lower().startswith("recommended because"):
            return text
        return f"Recommended because {text}"
    except Exception as e:
        print(f"Gemini error: {e}")
        return fallback

def run_bot():
    print("Starting Recommendation Bot...")
    anime_list = fetch_anime()
    if not anime_list:
        print("No anime fetched. Exiting.")
        return

    # Filter to top scored anime as sources
    sorted_anime = sorted(anime_list, key=lambda x: x.get('score') or 0, reverse=True)
    sources = sorted_anime[:20]
    
    model = setup_gemini()
    
    # Check existing recommendations to prevent duplicates
    rec_dir = os.path.join(os.getcwd(), 'content', 'articles', 'latest-anime-recommendations')
    os.makedirs(rec_dir, exist_ok=True)
    existing_files = os.listdir(rec_dir)
    
    for source in sources:
        best_match = None
        best_score = -1
        
        for candidate in anime_list:
            if candidate['id'] == source['id']: continue
            sim = compute_similarity(source, candidate)
            if sim > best_score:
                best_score = sim
                best_match = candidate
                
        if best_match and best_score > 0:
            pair_id = f"{min(source['id'], best_match['id'])}-{max(source['id'], best_match['id'])}"
            slug = f"recommendation-{source['id']}-to-{best_match['id']}"
            filename = f"{slug}.md"
            
            if filename in existing_files:
                continue # Skip duplicate
            
            print(f"Generating recommendation: {source.get('title')} -> {best_match.get('title')}")
            reason = get_explanation(model, source, best_match)
            
            frontmatter = {
                "title": f"If you liked {source.get('title')}, watch {best_match.get('title')}!",
                "slug": slug,
                "category": "Latest Anime Recommendations",
                "source_anime": source.get('title'),
                "source_id": source.get('id'),
                "recommended_anime": best_match.get('title'),
                "recommended_id": best_match.get('id'),
                "reason": reason,
                "published_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
                "cover_image": source.get('image_url') or best_match.get('image_url') or "https://placehold.co/800x400/1a1a2e/ffffff?text=Recommendation",
                "tags": ["Recommendations", infer_genres(source)[0] if infer_genres(source) else "Anime"]
            }
            
            # YAML format the frontmatter properly without using external yaml library to avoid deps
            # Actually PyYAML is already in requirements, so let's use it
            try:
                fm_yaml = yaml.dump(frontmatter, sort_keys=False, allow_unicode=True)
            except Exception as e:
                print(f"YAML dump failed: {e}")
                continue
                
            markdown_content = f"---\n{fm_yaml}---\n\nIf you enjoyed **{source.get('title')}**, you should definitely check out **{best_match.get('title')}**.\n\n### Why We Recommend It\n{reason}\n\n### About {best_match.get('title')}\n{best_match.get('synopsis') or 'No synopsis available.'}\n"
            
            filepath = os.path.join(rec_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
                
            print(f"Successfully created: {filename}")
            break # Only create one recommendation per run

if __name__ == "__main__":
    run_bot()