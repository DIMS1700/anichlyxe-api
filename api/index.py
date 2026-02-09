from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
import re
import json
import base64

app = FastAPI()

# --- KONFIGURASI SERVER ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = "https://anichin.cafe"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "Referer": BASE_URL
}

# --- HELPER FUNCTIONS ---

def smart_decode(raw_string):
    """
    Decoder Pintar:
    1. Cek apakah ini Base64? Jika ya, decode.
    2. Setelah decode, cek apakah ada tag <iframe>? Jika ya, ambil src-nya.
    3. Jika tidak, kembalikan string aslinya.
    """
    try:
        # Jika sudah berupa link HTTP, langsung return
        if raw_string.startswith("http"):
            return raw_string

        # Coba Decode Base64
        decoded_bytes = base64.b64decode(raw_string)
        decoded_str = decoded_bytes.decode('utf-8')
        
        # Cek apakah hasil decode mengandung HTML iframe?
        # Contoh: <iframe src="https://anichin.stream/..." ...>
        match = re.search(r'src="([^"]+)"', decoded_str)
        if match:
            return match.group(1) # Ambil link dalam src
        
        return decoded_str # Kembalikan hasil decode apa adanya
    except:
        return raw_string # Jika gagal, kembalikan aslinya

def clean_title(text):
    text = text.split('\t')[0]
    text = re.sub(r'(?i)Subtitle Indonesia', '', text)
    return text.strip()

def parse_anime_card(element):
    try:
        title_elem = element.select_one('.tt h2') or element.select_one('.tt')
        raw_title = title_elem.text if title_elem else element.select_one('.entry-title').text
        title = clean_title(raw_title)

        link = element.select_one('a')['href']
        img = element.select_one('img')['src']
        slug = list(filter(None, link.split('/')))[-1]
        
        data = { "title": title, "image": img, "slug": slug, "link_url": link }
        ep_elem = element.select_one('.epx') or element.select_one('.ep')
        if ep_elem: data['episode'] = ep_elem.text.strip()
        type_elem = element.select_one('.typez')
        if type_elem: data['type'] = type_elem.text.strip()
        status_elem = element.select_one('.sb') or element.select_one('.status')
        if status_elem: data['status'] = status_elem.text.strip()
        return data
    except AttributeError:
        return None

def extract_direct_video(iframe_url):
    qualities = []
    try:
        # Request ke dalam iframe (WAJIB pakai Referer)
        response = requests.get(iframe_url, headers={"Referer": BASE_URL, "User-Agent": HEADERS["User-Agent"]})
        content = response.text
        
        # Pola 1: Mencari JSON Sources (JWPlayer)
        pattern_json = re.search(r'sources:\s*(\[\{.*?\}\])', content)
        if pattern_json:
            json_str = pattern_json.group(1).replace("'", '"')
            try:
                sources = json.loads(json_str)
                for src in sources:
                    qualities.append({
                        "quality": src.get("label", "HD"),
                        "url": src.get("file"),
                        "type": "mp4"
                    })
            except: pass
        
        # Pola 2: Regex Manual (.mp4 / .m3u8)
        if not qualities:
            matches = re.findall(r'file":"(https?://[^"]+(?:mp4|m3u8))".*?label":"(\d+p)"', content)
            for url, label in matches:
                qualities.append({"quality": label, "url": url, "type": "mp4"})

    except Exception as e:
        print(f"Extraction error: {e}")
        
    return qualities

# ==========================================
# 1. API HOME
# ==========================================

@app.get("/api/home")
def home_dashboard():
    try:
        response = requests.get(BASE_URL, headers=HEADERS)
        soup = BeautifulSoup(response.text, 'html.parser')
        result = { "status": "success", "popular_today": [], "latest_release": [], "new_movies": [] }

        all_sections = soup.select('.bixbox')
        for section in all_sections:
            header_text = section.text.lower()
            if "popular today" in header_text:
                items = section.select('.listupd .bs')
                for item in items:
                    data = parse_anime_card(item)
                    if data: result['popular_today'].append(data)
            elif "movie" in header_text and "new" in header_text:
                items = section.select('.listupd .bs')
                for item in items:
                    data = parse_anime_card(item)
                    if data: result['new_movies'].append(data)

        if not result['latest_release']:
            latest_items = soup.select('.postbody .listupd .bs')
            for item in latest_items[:12]:
                data = parse_anime_card(item)
                if data: result['latest_release'].append(data)

        if not result['popular_today']:
            pop_items = soup.select('div.hhot .listupd .bs')
            for item in pop_items:
                data = parse_anime_card(item)
                if data: result['popular_today'].append(data)

        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/latest")
def latest_updates(page: int = 1):
    url = f"{BASE_URL}/page/{page}/"
    try:
        response = requests.get(url, headers=HEADERS)
        soup = BeautifulSoup(response.text, 'html.parser')
        data = []
        articles = soup.select('div.listupd article')
        for item in articles:
            parsed = parse_anime_card(item)
            if parsed: data.append(parsed)
        return {"status": "success", "page": page, "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ==========================================
# 2. API STREAM (FIX DECODE & NAV)
# ==========================================

@app.get("/api/stream/{slug_episode}")
def stream_vip(slug_episode: str):
    url = f"{BASE_URL}/{slug_episode}/"
    try:
        response = requests.get(url, headers=HEADERS)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        raw_title = soup.select_one('.entry-title').text.strip()
        title = clean_title(raw_title)

        # --- FIX NAVIGASI (NEXT/PREV) ---
        prev_slug = None
        next_slug = None
        # Mencari semua link di area navigasi
        nav_area = soup.select('.nvs .nav-links a') or soup.select('.nvs a') 
        
        for a in nav_area:
            href = a.get('href', '')
            txt = a.text.lower()
            if not href: continue
            
            slug = list(filter(None, href.split('/')))[-1]
            
            # Cek teks atau class icon
            icon_class = str(a.select_one('i')['class']) if a.select_one('i') else ""
            
            if "prev" in txt or "prev" in icon_class or "left" in icon_class:
                prev_slug = slug
            elif "next" in txt or "next" in icon_class or "right" in icon_class:
                next_slug = slug

        # --- CARI SERVER TERBAIK ---
        target_url = None
        
        # Prioritas 1: Cek Dropdown Mirror
        select_mirror = soup.select_one('select.mirror')
        if select_mirror:
            options = select_mirror.select('option')
            for opt in options:
                val = opt.get('value')
                if not val: continue
                
                # DECODE VALUE (FIX: Pakai smart_decode)
                decoded_url = smart_decode(val)
                
                # Filter Server Sampah
                bad = ['dood', 'tape', 'mixdrop', 'pahe', 'acefile', 'berkas']
                if not any(b in decoded_url for b in bad):
                    target_url = decoded_url
                    break 
        
        # Prioritas 2: Iframe Default
        if not target_url:
            iframe = soup.select_one('.player-embed iframe')
            if iframe: 
                target_url = iframe.get('src')
                # Cek lagi siapa tahu src-nya base64
                target_url = smart_decode(target_url)

        # --- EKSTRAK LINK ASLI (MP4) ---
        video_sources = []
        if target_url:
            video_sources = extract_direct_video(target_url)

        # Jika ekstraksi gagal, kembalikan URL iframe yang SUDAH DIDECODE (Bukan Base64 lagi)
        if not video_sources and target_url:
            video_sources.append({
                "quality": "Embed/Iframe", 
                "url": target_url, # Ini sekarang link bersih (https://...)
                "type": "iframe"
            })

        return {
            "status": "success",
            "data": {
                "title": title,
                "nav": {"prev_slug": prev_slug, "next_slug": next_slug},
                "qualities": video_sources
            }
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

# ==========================================
# 3. ENDPOINT TAMBAHAN
# ==========================================

@app.get("/api/search")
def search(q: str):
    url = f"{BASE_URL}/?s={q}"
    try:
        response = requests.get(url, headers=HEADERS)
        soup = BeautifulSoup(response.text, 'html.parser')
        data = []
        articles = soup.select('div.listupd article')
        for item in articles:
            parsed = parse_anime_card(item)
            if parsed: data.append(parsed)
        return {"status": "success", "results": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/donghua/{slug}")
def detail_donghua(slug: str):
    url = f"{BASE_URL}/anime/{slug}/"
    try:
        response = requests.get(url, headers=HEADERS)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        raw_title = soup.select_one('.entry-title').text
        title = clean_title(raw_title)
        img = soup.select_one('.thumb img')['src']
        synopsis = soup.select_one('.entry-content p').text.strip() if soup.select_one('.entry-content p') else "-"
        
        info = {}
        for line in soup.select('.infox .spe span'):
            if ":" in line.text:
                k, v = line.text.split(":", 1)
                info[k.strip().lower().replace(" ", "_")] = v.strip()

        episodes = []
        for li in soup.select('.eplister ul li'):
            ep_num = li.select_one('.epl-num').text.strip()
            a = li.select_one('a')
            episodes.append({
                "episode": ep_num,
                "slug": list(filter(None, a['href'].split('/')))[-1],
                "url": a['href']
            })

        return {
            "status": "success", 
            "data": {
                "title": title, "image": img, "synopsis": synopsis, "info": info, "episodes": episodes
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}