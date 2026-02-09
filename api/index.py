from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
from bs4 import BeautifulSoup
import re
import base64
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PINDAH KE SUMBER BARU
BASE_URL = "https://animechina.my.id"

async def fetch_url(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Referer": BASE_URL
    }
    try:
        async with httpx.AsyncClient(http2=True, follow_redirects=True, timeout=20.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

# --- HELPER ---
def encode_slug(url_path):
    try:
        # Menghapus domain dan folder 'anime' atau 'episode' agar slug bersih
        clean = url_path.replace(BASE_URL, "").strip("/")
        return clean.replace("/", "__")
    except: return url_path

def decode_slug(safe_slug):
    return safe_slug.replace("__", "/")

# --- ENDPOINTS ---

@app.get("/api/home")
async def get_home():
    res = await fetch_url(BASE_URL)
    if not res: return {"status": "error", "message": "Gagal mengambil data dari AnimeChina"}
    
    soup = BeautifulSoup(res.text, 'html.parser')
    
    # 1. Slider / Featured (Biasanya ada di top)
    featured = []
    for item in soup.select('.desclatest')[:5]: # Selector umum untuk slider donghua
        featured.append({
            "title": item.select_one('h2').text.strip() if item.select_one('h2') else "No Title",
            "image": item.select_one('img')['src'] if item.select_one('img') else "",
            "slug": encode_slug(item.select_one('a')['href']) if item.select_one('a') else ""
        })

    # 2. Latest Updates (Donghua Terbaru)
    latest = []
    for item in soup.select('.listupd .bs'):
        latest.append({
            "title": item.select_one('.tt').text.strip() if item.select_one('.tt') else "No Title",
            "image": item.select_one('img')['src'] if item.select_one('img') else "",
            "episode": item.select_one('.epx').text.strip() if item.select_one('.epx') else "Full",
            "slug": encode_slug(item.select_one('a')['href'])
        })

    return {
        "status": "success",
        "featured": featured,
        "latest_release": latest
    }

@app.get("/api/search")
async def search(q: str):
    res = await fetch_url(f"{BASE_URL}/?s={q}")
    if not res: return {"status": "error"}
    
    soup = BeautifulSoup(res.text, 'html.parser')
    results = []
    for item in soup.select('.listupd .bs'):
        results.append({
            "title": item.select_one('.tt').text.strip(),
            "image": item.select_one('img')['src'] if item.select_one('img') else "",
            "slug": encode_slug(item.select_one('a')['href'])
        })
    return {"status": "success", "results": results}

@app.get("/api/donghua/{slug}")
async def get_detail(slug: str):
    real_path = decode_slug(slug)
    # Cek apakah path mengandung 'anime' atau 'donghua'
    url = f"{BASE_URL}/{real_path}"
    res = await fetch_url(url)
    if not res: return {"status": "error", "message": "Detail tidak ditemukan"}
    
    soup = BeautifulSoup(res.text, 'html.parser')
    
    # Metadata
    info = {}
    for entry in soup.select('.info-content .spe span'):
        text = entry.text.strip()
        if ":" in text:
            key, val = text.split(":", 1)
            info[key.strip().lower().replace(" ", "_")] = val.strip()

    # Episode List
    episodes = []
    for li in soup.select('.eplister ul li'):
        a_tag = li.select_one('a')
        ep_num = li.select_one('.epl-num').text.strip() if li.select_one('.epl-num') else ""
        if a_tag:
            episodes.append({
                "episode": f"Episode {ep_num}",
                "slug": encode_slug(a_tag['href'])
            })

    return {
        "status": "success",
        "data": {
            "title": soup.select_one('.entry-title').text.strip() if soup.select_one('.entry-title') else "Donghua",
            "image": soup.select_one('.thumb img')['src'] if soup.select_one('.thumb img') else "",
            "synopsis": soup.select_one('.entry-content p').text.strip() if soup.select_one('.entry-content p') else "",
            "info": info,
            "episodes": episodes # Biasanya sudah terurut dari terbaru
        }
    }

@app.get("/api/stream/{slug_episode}")
async def get_stream(slug_episode: str):
    real_path = decode_slug(slug_episode)
    res = await fetch_url(f"{BASE_URL}/{real_path}")
    if not res: return {"status": "error"}
    
    soup = BeautifulSoup(res.text, 'html.parser')
    
    # Mirror Extractor
    mirrors = []
    # Mencari opsi server di dropdown atau list
    for opt in soup.select('.mirroroption option'):
        val = opt.get('value')
        if val:
            # Di situs ini biasanya butuh decode atau ambil ID player
            mirrors.append({
                "server": opt.text.strip(),
                "id": val
            })

    # Jika tidak ada dropdown, cari iframe langsung
    iframe = soup.select_one('#embed_holder iframe') or soup.select_one('.video-content iframe')
    video_url = iframe['src'] if iframe else ""

    return {
        "status": "success",
        "data": {
            "video_url": video_url,
            "mirrors": mirrors
        }
    }