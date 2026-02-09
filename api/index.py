from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
import re
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gunakan domain v13 atau ganti ke kuramanime.net jika masih error
BASE_URL = "https://v13.kuramanime.tel"

# Headers diperlengkap agar mirip browser asli 100%
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://www.google.com/",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
}

def fetch_url(url):
    """Mengambil data dengan penanganan error yang lebih kuat"""
    try:
        session = requests.Session()
        # Menggunakan timeout lebih lama dan allow_redirects
        response = session.get(url, headers=HEADERS, timeout=20, allow_redirects=True)
        
        if response.status_code == 200:
            return response
        
        # Jika kena blokir (403 atau 503), log akan muncul di Vercel
        print(f"Gagal akses: {url} - Status: {response.status_code}")
        return None
    except Exception as e:
        print(f"Error Koneksi: {e}")
        return None

# --- FUNGSI HELPER ---
def encode_slug(url_path):
    try:
        clean = url_path.replace(BASE_URL, "").replace("/anime/", "").strip("/")
        return clean.replace("/", "__")
    except: return url_path

def decode_slug(safe_slug):
    return safe_slug.replace("__", "/")

def parse_anime_item(item):
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
    res = fetch_url(BASE_URL)
    if not res: 
        return {"status": "error", "message": "Source down - Terblokir Cloudflare"}
    
    soup = BeautifulSoup(res.text, 'html.parser')
    slider = []
    for item in soup.select('.hero__items'):
        link = item.select_one('a')
        if link:
            slider.append({
                "title": item.select_one('h2').text.strip() if item.select_one('h2') else "",
                "image": item['data-setbg'] if 'data-setbg' in item.attrs else "",
                "slug": encode_slug(link['href'])
            })

    latest = []
    for item in soup.select('.product__item')[:12]:
        data = parse_anime_item(item)
        if data: latest.append(data)

    return {"status": "success", "slider": slider, "latest_release": latest}

@app.get("/api/search")
def search(q: str):
    res = fetch_url(f"{BASE_URL}/anime?search={q}&order_by=latest")
    if not res: return {"status": "error"}
    soup = BeautifulSoup(res.text, 'html.parser')
    results = []
    for item in soup.select('.product__item'):
        data = parse_anime_item(item)
        if data: results.append(data)
    return {"status": "success", "results": results}

@app.get("/api/donghua/{slug}")
def get_detail(slug: str):
    real_path = decode_slug(slug)
    url = f"{BASE_URL}/anime/{real_path}"
    res = fetch_url(url)
    if not res: return {"status": "error"}
    
    soup = BeautifulSoup(res.text, 'html.parser')
    anime_id = real_path.split('/')[0]
    
    info = {}
    for li in soup.select('.anime__details__widget ul li'):
        text = li.get_text(separator=":", strip=True)
        if ":" in text:
            parts = text.split(":", 1)
            info[parts[0].strip().lower().replace(" ", "_")] = parts[1].strip()

    episodes = []
    # Menggunakan Regex Hunter agar episode tidak kosong
    found_links = re.findall(r'href=["\']([^"\']+/episode/(\d+))["\']', res.text)
    seen = set()
    for link, ep_num in found_links:
        if anime_id in link and link not in seen:
            seen.add(link)
            clean_link = link.replace(BASE_URL, "").replace("/anime/", "").strip("/")
            episodes.append({
                "episode": f"Episode {ep_num}",
                "slug": clean_link.replace("/", "__"),
            })

    return {
        "status": "success",
        "data": {
            "title": soup.select_one('.anime__details__title h3').text.strip() if soup.select_one('.anime__details__title h3') else "Anime",
            "image": soup.select_one('.anime__details__pic')['data-setbg'] if soup.select_one('.anime__details__pic') else "",
            "synopsis": soup.select_one('.anime__details__text p').text.strip() if soup.select_one('.anime__details__text p') else "",
            "info": info,
            "episodes": sorted(episodes, key=lambda x: int(re.search(r'\d+', x['episode']).group()), reverse=True)
        }
    }

@app.get("/api/stream/{slug_episode}")
def get_stream(slug_episode: str):
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
                decoded = base64.b64decode(val).decode('utf-8')
                if "iframe" in decoded:
                    src = re.search(r'src="([^"]+)"', decoded).group(1)
                    qualities.append({"quality": opt.text.strip(), "url": src})
                else:
                    qualities.append({"quality": opt.text.strip(), "url": decoded})
            except:
                qualities.append({"quality": opt.text.strip(), "url": val})

    return {"status": "success", "data": {"qualities": qualities}}