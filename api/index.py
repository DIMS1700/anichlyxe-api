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

# --- TARGET: DONGHUAFILM ---
BASE_URL = "https://donghuafilm.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": BASE_URL,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
}

# --- HELPER FUNCTIONS ---

def smart_decode(raw_string):
    """Mendecode Base64 dan mencari link asli di dalam iframe src"""
    try:
        if not raw_string: return ""
        if raw_string.startswith("http"): return raw_string
        try:
            decoded_bytes = base64.b64decode(raw_string)
            decoded_str = decoded_bytes.decode('utf-8')
        except:
            return raw_string 
        
        match = re.search(r'src="([^"]+)"', decoded_str)
        if match: return match.group(1)
        return decoded_str
    except:
        return raw_string

def clean_text(text):
    if not text: return ""
    return text.replace('\n', ' ').strip()

def fetch_url(url, timeout=10):
    try:
        response = requests.get(url, headers=HEADERS, timeout=timeout)
        if response.status_code == 404: return None
        return response
    except:
        return None

def parse_card(element):
    try:
        title_elem = element.select_one('.tt h2') or element.select_one('.tt') or element.select_one('h2')
        if not title_elem: return None
        title = clean_text(title_elem.text)

        link_elem = element.select_one('a')
        if not link_elem: return None
        link = link_elem['href']
        slug = list(filter(None, link.split('/')))[-1]

        img_elem = element.select_one('img')
        img = img_elem['src'] if img_elem else ""
        
        data = { "title": title, "image": img, "slug": slug, "link_url": link }
        
        ep_elem = element.select_one('.epx') or element.select_one('.ep')
        if ep_elem: data['episode'] = clean_text(ep_elem.text)
        
        type_elem = element.select_one('.typez')
        if type_elem: data['type'] = clean_text(type_elem.text)
        
        return data
    except:
        return None

def extract_iframe_src(iframe_url):
    qualities = []
    if not iframe_url: return []
    
    # 1. Fast Path: Embed populer (Auto 1080p usually supported by player)
    if any(x in iframe_url for x in ["dailymotion", "youtube", "bilibili", "ok.ru", "dropbox", "google", "blogger"]):
         return [{"quality": "Embed (Fast)", "url": iframe_url, "type": "iframe"}]

    try:
        # 2. Slow Path: Coba ekstrak file asli
        res = requests.get(iframe_url, headers=HEADERS, timeout=3)
        
        # Cari file m3u8 atau mp4
        sources = re.findall(r'file\s*:\s*["\'](https?://[^"\']+)["\']', res.text)
        for src in sources:
            label = "HD"
            if ".m3u8" in src: label = "Auto"
            qualities.append({"quality": label, "url": src, "type": "stream"})
            
        # Cari label 1080p di JSON source (JWPlayer style)
        if "1080" in res.text:
             sources_json = re.findall(r'sources\s*:\s*(\[\{.*?\}\])', res.text)
             if sources_json:
                 data = json.loads(sources_json[0].replace("'", '"'))
                 for item in data:
                     if "1080" in item.get("label", ""):
                         qualities.insert(0, {"quality": "1080p", "url": item.get("file"), "type": "mp4"})

    except Exception as e:
        print(f"[Warn] Gagal ekstrak iframe: {e}")
        
    if not qualities:
        qualities.append({"quality": "Embed", "url": iframe_url, "type": "iframe"})
    
    return qualities

# ==========================================
# 1. API HOME
# ==========================================

@app.get("/api/home")
def home_dashboard():
    result = { 
        "status": "success", 
        "slider": [], 
        "popular_today": [], 
        "latest_release": [] 
    }
    
    response = fetch_url(BASE_URL)
    if not response: return {"status": "error", "message": "Gagal mengambil data"}

    soup = BeautifulSoup(response.text, 'html.parser')

    # Slider
    slider_items = soup.select('.deslide-item') or soup.select('.big-slider .item')
    for item in slider_items:
        try:
            title_elem = item.select_one('.desa-title') or item.select_one('.tt')
            link_elem = item.select_one('a')
            img_elem = item.select_one('img')
            
            if title_elem and link_elem:
                title = clean_text(title_elem.text)
                slug = list(filter(None, link_elem['href'].split('/')))[-1]
                img = img_elem['src'] if img_elem else ""
                desc = ""
                desc_elem = item.select_one('.desa-ci') or item.select_one('.desc')
                if desc_elem: desc = clean_text(desc_elem.text)

                result['slider'].append({
                    "title": title, "image": img, "slug": slug, "synopsis": desc
                })
        except: pass

    # Latest
    latest_items = soup.select('.postbody .listupd article')
    if not latest_items: latest_items = soup.select('.listupd .bs')
    for item in latest_items[:12]:
        data = parse_card(item)
        if data: result['latest_release'].append(data)

    # Popular
    pop_items = soup.select('.hhot .listupd article')
    if not pop_items: pop_items = soup.select('.pop-con .bs')
    for item in pop_items:
        data = parse_card(item)
        if data: result['popular_today'].append(data)

    if not result['popular_today']:
        result['popular_today'] = result['latest_release'][:5]

    return result

# ==========================================
# 2. API SCHEDULE (IMPROVED SCANNER)
# ==========================================

@app.get("/api/schedule")
def get_schedule():
    response = fetch_url(BASE_URL)
    if not response: return {"status": "success", "message": "Sumber tidak dapat diakses", "data": []}
    
    soup = BeautifulSoup(response.text, 'html.parser')
    schedule_data = []
    
    # LOGIKA BARU: Cari container jadwal berdasarkan nama hari
    # Kita cari elemen yang berisi "Senin", "Selasa", dst.
    days_map = {
        "Senin": [], "Selasa": [], "Rabu": [], "Kamis": [], 
        "Jumat": [], "Sabtu": [], "Minggu": []
    }
    
    # Cari semua widget box
    all_widgets = soup.select('.bixbox')
    
    for widget in all_widgets:
        text_content = widget.text.lower()
        # Jika widget ini mengandung kata "jadwal" atau nama hari
        if "jadwal" in text_content or "senin" in text_content:
            # Coba ambil tabs atau list di dalamnya
            day_elements = widget.select('.kls-item') # Struktur umum 1
            if not day_elements: day_elements = widget.select('.schedule-content') # Struktur umum 2
            
            # Jika tidak ada class khusus, cari berdasarkan text header
            if not day_elements:
                # Coba manual scan li/div
                pass

    # FALLBACK KUAT: Ambil dari Latest Release tapi dikelompokkan (Simulasi Jadwal)
    # Karena DonghuaFilm tidak konsisten menampilkan widget jadwal
    if not schedule_data:
        latest = soup.select('.listupd article')
        # Kita ambil 10 anime terbaru dan masukkan ke "Hari Ini" (Update Terbaru)
        today_animes = []
        for item in latest[:10]:
            title = item.select_one('.tt').text.strip() if item.select_one('.tt') else "Anime"
            link = item.select_one('a')['href']
            slug = list(filter(None, link.split('/')))[-1]
            today_animes.append({"title": title, "slug": slug})
            
        schedule_data.append({"day": "Update Terbaru", "animes": today_animes})

    return {"status": "success", "data": schedule_data}

@app.get("/api/genres")
def get_genres():
    response = fetch_url(BASE_URL)
    if not response: return {"status": "error"}
    soup = BeautifulSoup(response.text, 'html.parser')
    genres = []
    for a in soup.select('a[href*="/genres/"]'):
        name = clean_text(a.text)
        if name:
            slug = list(filter(None, a['href'].split('/')))[-1]
            genres.append({"title": name, "slug": slug})
    
    unique_genres = {v['slug']:v for v in genres}.values()
    return {"status": "success", "data": list(unique_genres)}

@app.get("/api/azlist")
def get_az_list():
    return {"status": "success", "data": []}

# ==========================================
# 3. API SEARCH & LATEST
# ==========================================

@app.get("/api/latest")
def latest_updates(page: int = 1):
    url = f"{BASE_URL}/page/{page}/"
    response = fetch_url(url)
    if not response: return {"status": "error", "message": "Gagal mengambil data"}
    soup = BeautifulSoup(response.text, 'html.parser')
    data = []
    items = soup.select('.listupd article')
    if not items: items = soup.select('.listupd .bs')
    for item in items:
        parsed = parse_card(item)
        if parsed: data.append(parsed)
    return {"status": "success", "page": page, "data": data}

@app.get("/api/search")
def search(q: str):
    url = f"{BASE_URL}/?s={q}"
    response = fetch_url(url)
    if not response: return {"status": "error", "message": "Search Gagal"}
    soup = BeautifulSoup(response.text, 'html.parser')
    data = []
    items = soup.select('.listupd article')
    if not items: items = soup.select('.listupd .bs')
    for item in items:
        parsed = parse_card(item)
        if parsed: data.append(parsed)
    return {"status": "success", "results": data}

# ==========================================
# 4. API DETAIL
# ==========================================

@app.get("/api/donghua/{slug}")
def detail_donghua(slug: str):
    url = f"{BASE_URL}/donghua/{slug}/"
    response = fetch_url(url)
    if not response:
        url_alt = f"{BASE_URL}/{slug}/"
        response = fetch_url(url_alt)
        if not response:
             return {"status": "error", "message": "Donghua Tidak Ditemukan. Cek Slug!"}

    soup = BeautifulSoup(response.text, 'html.parser')
    title_elem = soup.select_one('.entry-title')
    if not title_elem: return {"status": "error", "message": "Gagal baca halaman"}
    title = clean_text(title_elem.text)
    img_elem = soup.select_one('.thumb img')
    img = img_elem['src'] if img_elem else ""
    syn_elem = soup.select_one('.entry-content p')
    synopsis = clean_text(syn_elem.text) if syn_elem else "-"
    info = {}
    for line in soup.select('.infox .spe span'):
        parts = line.text.split(":", 1)
        if len(parts) == 2:
            info[parts[0].strip().lower().replace(" ", "_")] = parts[1].strip()
    genres = [g.text.strip() for g in soup.select('.genxed a')]
    episodes = []
    for li in soup.select('.eplister ul li'):
        num = li.select_one('.epl-num')
        lnk = li.select_one('a')
        if num and lnk:
            href = lnk['href']
            ep_slug = list(filter(None, href.split('/')))[-1]
            episodes.append({"episode": clean_text(num.text), "slug": ep_slug, "url": href})

    return { "status": "success", "data": { "title": title, "image": img, "synopsis": synopsis, "info": info, "genres": genres, "episodes": episodes } }

# ==========================================
# 5. API STREAM (1080P PRIORITY)
# ==========================================

@app.get("/api/stream/{slug_episode}")
def stream_vip(slug_episode: str):
    url = f"{BASE_URL}/{slug_episode}/"
    response = fetch_url(url)
    if not response: return {"status": "error", "message": "Episode Tidak Ditemukan"}

    soup = BeautifulSoup(response.text, 'html.parser')
    title_elem = soup.select_one('.entry-title')
    title = clean_text(title_elem.text) if title_elem else slug_episode

    prev_slug, next_slug = None, None
    for a in soup.select('.nvs a'):
        href = a.get('href')
        if not href: continue
        slug = list(filter(None, href.split('/')))[-1]
        txt = a.text.lower()
        if "prev" in txt: prev_slug = slug
        elif "next" in txt: next_slug = slug

    potential_servers = []
    select = soup.select_one('select.mirror')
    if select:
        for opt in select.select('option'):
            val = opt.get('value')
            if not val: continue
            name = opt.text.strip()
            decoded = smart_decode(val)
            
            score = 0
            nl = name.lower()
            
            # --- SKOR PRIORITAS 1080P ---
            if "1080" in nl: score += 500  # Prioritas Utama
            if "720" in nl: score += 300
            
            # Prioritas Server Stabil
            if "daily" in nl: score += 200
            if "panda" in nl: score += 150
            if "dropbox" in nl: score += 150
            if "vip" in nl: score += 100
            
            # Kurangi skor resolusi rendah
            if "480" in nl: score -= 50
            if "360" in nl: score -= 100
            
            potential_servers.append({"name": name, "url": decoded, "score": score})

    iframe_def = soup.select_one('.player-embed iframe')
    if iframe_def:
        src = smart_decode(iframe_def.get('src'))
        potential_servers.append({"name": "Default", "url": src, "score": 10})

    # Urutkan: Score Tertinggi -> Duluan
    potential_servers.sort(key=lambda x: x['score'], reverse=True)

    final_qualities = []
    final_server = "None"

    if potential_servers:
        best = potential_servers[0]
        final_server = best['name']
        print(f"[DEBUG] Menggunakan Server: {final_server} (Score: {best['score']})")
        
        extracted = extract_iframe_src(best['url'])
        final_qualities.extend(extracted)

    return {
        "status": "success",
        "data": {
            "title": title, "server_used": final_server,
            "nav": {"prev_slug": prev_slug, "next_slug": next_slug},
            "qualities": final_qualities
        }
    }