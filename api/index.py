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
    """Mendecode Base64 dan mencari link asli di dalam iframe src"""
    try:
        if not raw_string: return ""
        if raw_string.startswith("http"):
            return raw_string

        decoded_bytes = base64.b64decode(raw_string)
        decoded_str = decoded_bytes.decode('utf-8')
        
        match = re.search(r'src="([^"]+)"', decoded_str)
        if match:
            return match.group(1)
        return decoded_str
    except:
        return raw_string

def clean_title(text):
    if not text: return ""
    text = text.split('\t')[0]
    text = re.sub(r'(?i)Subtitle Indonesia', '', text)
    return text.strip()

def parse_anime_card(element):
    try:
        title_elem = element.select_one('.tt h2') or element.select_one('.tt')
        raw_title = title_elem.text if title_elem else element.select_one('.entry-title').text
        title = clean_title(raw_title)

        link_elem = element.select_one('a')
        if not link_elem: return None
        link = link_elem['href']
        
        img_elem = element.select_one('img')
        img = img_elem['src'] if img_elem else ""
        
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
    """
    Ekstrak link mp4/m3u8 dari iframe. 
    Mencoba mencari resolusi tertinggi.
    """
    qualities = []
    if not iframe_url: return []

    try:
        # Timeout dipercepat agar tidak loading lama
        response = requests.get(iframe_url, headers={"Referer": BASE_URL, "User-Agent": HEADERS["User-Agent"]}, timeout=5)
        content = response.text
        
        # 1. Cek JSON Sources (JWPlayer Style)
        pattern_json = re.search(r'sources:\s*(\[\{.*?\}\])', content)
        if pattern_json:
            json_str = pattern_json.group(1).replace("'", '"')
            try:
                sources = json.loads(json_str)
                for src in sources:
                    label = src.get("label", "HD")
                    file_url = src.get("file")
                    
                    vid_type = "m3u8" if ".m3u8" in file_url else "mp4"
                    if vid_type == "m3u8" and label == "0": 
                        label = "Auto (Multi-Quality)"

                    qualities.append({
                        "quality": label,
                        "url": file_url,
                        "type": vid_type
                    })
            except: pass
        
        # 2. Cek Regex Manual jika JSON gagal
        if not qualities:
            matches = re.findall(r'file":"(https?://[^"]+(?:mp4|m3u8))".*?label":"(\d+p?)"', content)
            for url, label in matches:
                qualities.append({"quality": label, "url": url, "type": "mp4"})

    except Exception as e:
        print(f"Extraction error for {iframe_url}: {e}")
        
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
# 2. API STREAM (HIGH QUALITY & ANTI-AD SCANNER)
# ==========================================

@app.get("/api/stream/{slug_episode}")
def stream_vip(slug_episode: str):
    url = f"{BASE_URL}/{slug_episode}/"
    try:
        response = requests.get(url, headers=HEADERS)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Safety Check Title
        title_elem = soup.select_one('.entry-title')
        raw_title = title_elem.text.strip() if title_elem else slug_episode
        title = clean_title(raw_title)

        # --- NAVIGASI ---
        prev_slug = None
        next_slug = None
        nav_area = soup.select('.nvs .nav-links a') or soup.select('.nvs a') 
        for a in nav_area:
            href = a.get('href', '')
            txt = a.text.lower()
            if not href: continue
            slug = list(filter(None, href.split('/')))[-1]
            icon_class = str(a.select_one('i')['class']) if a.select_one('i') else ""
            if "prev" in txt or "prev" in icon_class or "left" in icon_class: prev_slug = slug
            elif "next" in txt or "next" in icon_class or "right" in icon_class: next_slug = slug

        # --- LOGIKA BARU: MULTI-SERVER SCANNING ---
        potential_servers = []

        # 1. Ambil semua opsi dari dropdown
        select_mirror = soup.select_one('select.mirror')
        if select_mirror:
            options = select_mirror.select('option')
            for opt in options:
                val = opt.get('value')
                if not val: continue
                
                server_name = opt.text.strip() # Contoh: "Anichin (1080p)" atau "VIP"
                decoded_url = smart_decode(val)
                
                # Filter server sampah (Iklan)
                bad_keywords = ['dood', 'tape', 'mixdrop', 'pahe', 'acefile', 'berkas', 'hydrax']
                if any(b in decoded_url for b in bad_keywords):
                    continue

                # Beri bobot skor agar kita mendahulukan 1080p/VIP
                score = 0
                name_lower = server_name.lower()
                
                if "1080" in name_lower: score += 100
                if "720" in name_lower: score += 50
                if "vip" in name_lower: score += 30
                if "anichin" in name_lower or "google" in decoded_url: score += 20
                if "480" in name_lower: score -= 10 

                potential_servers.append({
                    "name": server_name,
                    "url": decoded_url,
                    "score": score
                })
        
        # 2. Masukkan juga iframe default sebagai cadangan
        iframe_default = soup.select_one('.player-embed iframe')
        if iframe_default:
            src = smart_decode(iframe_default.get('src'))
            potential_servers.append({
                "name": "Default Embed",
                "url": src,
                "score": 10 
            })

        # 3. URUTKAN SERVER DARI SCORE TERTINGGI
        potential_servers.sort(key=lambda x: x['score'], reverse=True)

        # 4. MULAI EXTRAKSI (SCANNING)
        final_qualities = []
        final_server_used = ""

        # Kita coba max 3 server terbaik untuk mencari file MP4 asli
        for server in potential_servers[:3]:
            extracted = extract_direct_video(server['url'])
            
            if extracted:
                final_qualities = extracted
                final_server_used = server['name']
                
                # Jika dapat 1080p, langsung berhenti (dapat jackpot)
                if any("1080" in q['quality'] for q in extracted): 
                    break 
            
        # 5. FALLBACK: Jika semua scanning gagal dapat MP4, pakai iframe server terbaik
        if not final_qualities and potential_servers:
            best_server = potential_servers[0]
            final_qualities.append({
                "quality": "Embed/Iframe (Backup)", 
                "url": best_server['url'], 
                "type": "iframe"
            })
            final_server_used = best_server['name']

        # Sortir hasil kualitas (1080p paling atas)
        def sort_quality(q):
            lbl = q['quality']
            if "1080" in lbl: return 4
            if "720" in lbl: return 3
            if "480" in lbl: return 2
            return 1
            
        final_qualities.sort(key=sort_quality, reverse=True)

        return {
            "status": "success",
            "data": {
                "title": title,
                "server_used": final_server_used,
                "nav": {"prev_slug": prev_slug, "next_slug": next_slug},
                "qualities": final_qualities
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
        
        # PERBAIKAN: Cek 404
        if response.status_code != 200:
            return {"status": "error", "message": "Donghua not found (404)"}

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # PERBAIKAN: Safety Check untuk Title (Mencegah Crash NoneType)
        title_elem = soup.select_one('.entry-title')
        if not title_elem:
             return {"status": "error", "message": "Failed to parse content. Check Slug or Anichin Structure."}
        
        title = clean_title(title_elem.text)
        
        # PERBAIKAN: Safety Check untuk Image
        img_elem = soup.select_one('.thumb img')
        img = img_elem['src'] if img_elem else "https://via.placeholder.com/300?text=No+Image"
        
        # PERBAIKAN: Safety Check untuk Sinopsis
        syn_elem = soup.select_one('.entry-content p')
        synopsis = syn_elem.text.strip() if syn_elem else "Sinopsis belum tersedia."
        
        info = {}
        for line in soup.select('.infox .spe span'):
            parts = line.text.split(":", 1)
            if len(parts) == 2:
                k, v = parts
                info[k.strip().lower().replace(" ", "_")] = v.strip()
        
        # Tambahkan Genre
        genres = []
        for g in soup.select('.genxed a'):
            genres.append(g.text.strip())

        episodes = []
        for li in soup.select('.eplister ul li'):
            ep_num_elem = li.select_one('.epl-num')
            link_elem = li.select_one('a')
            
            # PERBAIKAN: Pastikan element ada
            if ep_num_elem and link_elem:
                href = link_elem['href']
                episodes.append({
                    "episode": ep_num_elem.text.strip(),
                    "slug": list(filter(None, href.split('/')))[-1],
                    "url": href
                })

        return {
            "status": "success", 
            "data": {
                "title": title, "image": img, "synopsis": synopsis, 
                "info": info, "genres": genres, "episodes": episodes
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}