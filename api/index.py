from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
import re
import base64

app = FastAPI()

# --- CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = "https://v13.kuramanime.tel"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Referer": BASE_URL
}

# --- HELPER FUNCTIONS ---

def encode_slug(url_path):
    """Ubah /anime/123/judul menjadi 123__judul"""
    try:
        clean = url_path.replace(BASE_URL, "").replace("/anime/", "").strip("/")
        return clean.replace("/", "__")
    except: return url_path

def decode_slug(safe_slug):
    """Kembalikan 123__judul menjadi 123/judul"""
    return safe_slug.replace("__", "/")

def fetch_url(url):
    """Fungsi pengambil data dengan session"""
    try:
        session = requests.Session()
        response = session.get(url, headers=HEADERS, timeout=10)
        return response
    except: return None

def parse_anime_item(item):
    """Parser standar untuk card anime (Search, Popular, Latest)"""
    try:
        a_tag = item.select_one('h5 a')
        img_tag = item.select_one('.product__item__pic')
        ep_tag = item.select_one('.ep') or item.select_one('ul li')
        
        return {
            "title": a_tag.text.strip() if a_tag else "No Title",
            "slug": encode_slug(a_tag['href']) if a_tag else "",
            "image": img_tag['data-setbg'] if img_tag else "",
            "episode": ep_tag.text.strip() if ep_tag else "N/A"
        }
    except: return None

# --- ENDPOINTS ---

@app.get("/api/home")
def get_home():
    """Menu Utama: Slider, Popular, dan Rilis Terbaru"""
    res = fetch_url(BASE_URL)
    if not res: return {"status": "error", "message": "Source down"}
    
    soup = BeautifulSoup(res.text, 'html.parser')
    
    # 1. Slider (Hero Items)
    slider = []
    for item in soup.select('.hero__items'):
        title = item.select_one('h2').text.strip() if item.select_one('h2') else ""
        link = item.select_one('a')
        if link:
            slider.append({
                "title": title,
                "image": item['data-setbg'] if 'data-setbg' in item.attrs else "",
                "slug": encode_slug(link['href']),
                "desc": item.select_one('p').text.strip() if item.select_one('p') else ""
            })

    # 2. Popular Today
    popular = []
    for item in soup.select('.filter__gallery .product__item')[:6]:
        data = parse_anime_item(item)
        if data: popular.append(data)

    # 3. Latest Release (Ongoing)
    latest = []
    for item in soup.select('.product__item')[:12]:
        data = parse_anime_item(item)
        if data: latest.append(data)

    return {
        "status": "success",
        "slider": slider,
        "popular_today": popular if popular else latest[:5],
        "latest_release": latest
    }

@app.get("/api/search")
def search(q: str):
    """Menu Pencarian"""
    res = fetch_url(f"{BASE_URL}/anime?search={q}&order_by=latest")
    if not res: return {"status": "error"}
    
    soup = BeautifulSoup(res.text, 'html.parser')
    results = []
    for item in soup.select('.product__item'):
        data = parse_anime_item(item)
        if data: results.append(data)
    return {"status": "success", "results": results}

@app.get("/api/genres")
def get_genres():
    """Menu Daftar Genre"""
    res = fetch_url(f"{BASE_URL}/properties/genre")
    if not res: return {"status": "error"}
    
    soup = BeautifulSoup(res.text, 'html.parser')
    genres = []
    for a in soup.select('.genre__list a'):
        genres.append({
            "title": a.text.strip(),
            "slug": a['href'].split('/')[-1]
        })
    return {"status": "success", "data": genres}

@app.get("/api/donghua/{slug}")
def get_detail(slug: str):
    """Deep Detail: Metadata Lengkap, Synopsis, dan Episode Hunter"""
    real_path = decode_slug(slug)
    url = f"{BASE_URL}/anime/{real_path}"
    res = fetch_url(url)
    if not res: return {"status": "error"}
    
    soup = BeautifulSoup(res.text, 'html.parser')
    anime_id = real_path.split('/')[0]
    
    # 1. Deep Metadata Extraction
    info = {}
    genres = []
    for li in soup.select('.anime__details__widget ul li'):
        text = li.get_text(separator=":", strip=True)
        if "Genre" in text:
            genres = [g.text.strip() for g in li.select('a')]
        elif ":" in text:
            parts = text.split(":", 1)
            key = parts[0].strip().lower().replace(" ", "_")
            val = parts[1].strip()
            info[key] = val

    # 2. Regex Hunter untuk Episodes (Menembus Proteksi)
    episodes = []
    found_links = re.findall(r'href=["\']([^"\']+/episode/(\d+))["\']', res.text)
    
    seen = set()
    for link, ep_num in found_links:
        if anime_id in link and link not in seen:
            seen.add(link)
            clean_link = link.replace(BASE_URL, "").replace("/anime/", "").strip("/")
            episodes.append({
                "episode": f"Episode {ep_num}",
                "episode_number": ep_num,
                "slug": clean_link.replace("/", "__"),
            })

    # 3. Related Anime (Rekomendasi)
    related = []
    for item in soup.select('.anime__details__sidebar .product__item'):
        data = parse_anime_item(item)
        if data: related.append(data)

    return {
        "status": "success",
        "data": {
            "title": soup.select_one('.anime__details__title h3').text.strip() if soup.select_one('.anime__details__title h3') else "Anime",
            "japanese_title": soup.select_one('.anime__details__title span').text.strip() if soup.select_one('.anime__details__title span') else "",
            "image": soup.select_one('.anime__details__pic')['data-setbg'] if soup.select_one('.anime__details__pic') else "",
            "synopsis": soup.select_one('.anime__details__text p').get_text(strip=True) if soup.select_one('.anime__details__text p') else "",
            "genres": genres,
            "metadata": info,
            "episodes": sorted(episodes, key=lambda x: int(x['episode_number']), reverse=True),
            "related_anime": related
        }
    }

@app.get("/api/stream/{slug_episode}")
def get_stream(slug_episode: str):
    """Streaming: Pengambil Link Mirror Video"""
    real_path = decode_slug(slug_episode)
    url = f"{BASE_URL}/anime/{real_path}"
    res = fetch_url(url)
    if not res: return {"status": "error"}
    
    soup = BeautifulSoup(res.text, 'html.parser')
    qualities = []
    
    servers = soup.select('select#changeServer option')
    for opt in servers:
        val = opt.get('value')
        if val:
            try:
                # Decode base64 server links
                decoded = base64.b64decode(val).decode('utf-8')
                if "iframe" in decoded:
                    src = re.search(r'src="([^"]+)"', decoded).group(1)
                    qualities.append({"quality": opt.text.strip(), "url": src})
                else:
                    qualities.append({"quality": opt.text.strip(), "url": decoded})
            except:
                qualities.append({"quality": opt.text.strip(), "url": val})

    return {
        "status": "success",
        "data": {
            "title": "Playing Video",
            "qualities": qualities
        }
    }

@app.get("/api/schedule")
def get_schedule():
    """Jadwal Rilis (Simulasi dari Update Terbaru)"""
    res = fetch_url(f"{BASE_URL}/quick/ongoing")
    if not res: return {"status": "error"}
    soup = BeautifulSoup(res.text, 'html.parser')
    
    data = [{"day": "Update Hari Ini", "animes": []}]
    for item in soup.select('.product__item')[:15]:
        anime = parse_anime_item(item)
        if anime:
            data[0]["animes"].append(anime)
            
    return {"status": "success", "data": data}