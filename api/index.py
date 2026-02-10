from fastapi import FastAPI, Response, Request
from fastapi.middleware.cors import CORSMiddleware
import cloudscraper
from bs4 import BeautifulSoup
import re
import requests
from urllib.parse import unquote, quote
import urllib3
import random

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 🛠️ CONFIG
# ==========================================
BASE_DOMAIN = "https://komiku.org" 
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
]

scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'windows', 'desktop': True})

# ==========================================
# 🛠️ HELPERS
# ==========================================

def get_base_url(request: Request):
    return str(request.base_url).rstrip("/")

def make_proxy_url(target_url: str, request: Request):
    if not target_url or "placeholder" in target_url or "asset" in target_url:
        return "https://placehold.co/300x450/1a1a1a/666?text=No+Image"
    
    base_url = get_base_url(request)
    if target_url.startswith("/"):
        target_url = f"{BASE_DOMAIN}{target_url}"
    
    encoded_url = quote(target_url)
    return f"{base_url}/api/image?url={encoded_url}"

def fetch_smart(path: str):
    headers = {'User-Agent': random.choice(USER_AGENTS), 'Referer': BASE_DOMAIN}
    url = path if path.startswith("http") else f"{BASE_DOMAIN}{path if path.startswith('/') else '/' + path}"
    try:
        print(f"🔄 Fetching: {url}")
        resp = scraper.get(url, headers=headers, timeout=25)
        if resp.status_code == 200:
            return BeautifulSoup(resp.text, "html.parser")
    except: pass
    return None

def clean_title(text):
    if not text: return ""
    # Regex pembantai kata sampah
    garbage = [
        r'\bBahasa Indonesia\b', r'\bIndonesia\b', r'\bIndo\b', r'\bSub Indo\b', 
        r'\bKomik\b', r'\bManga\b', r'\bManhwa\b', r'\bManhua\b', 
        r'\bBaca\b', r'\bOnline\b', r'\bRead\b', r'\bProject\b', r'\bUpdate\b'
    ]
    cleaned = text
    for g in garbage:
        cleaned = re.sub(g, '', cleaned, flags=re.IGNORECASE)
    
    # Hapus karakter non-huruf di awal/akhir
    cleaned = re.sub(r'^[\-\:\s]+|[\-\:\s]+$', '', cleaned)
    
    # Deteksi jika judul masih mengandung query parameter aneh
    if "?" in cleaned or "=" in cleaned: return None
    
    return cleaned.strip()

def format_slug_to_title(slug):
    if not slug: return "Unknown"
    if "?" in slug or "=" in slug: return None # Filter query
    raw = slug.replace('-', ' ').title()
    return clean_title(raw)

# ==========================================
# 🧩 LOGIKA EKSTRAKSI (V13 SMART FILTER)
# ==========================================
def extract_comics_smart(soup, request):
    data = []
    seen = set()
    
    # BLACKLIST KATA KUNCI (Judul/Slug)
    BLACKLIST = [
        'populer', 'peringkat', 'tamat', 'genre', 'project', 'iklan', 'dmca', 'lapor', 
        'beranda', 'daftar-komik', 'pustaka', 'halaman', 'orderby', 'sorttime', 'filter'
    ]

    # Ambil semua item yang punya potensi komik
    # Prioritas: Class spesifik (.bge, .kan) lalu div umum
    candidates = soup.select('.bge') + soup.select('.ls4w') + soup.select('.kan')
    if not candidates: candidates = soup.find_all('div')

    for item in candidates:
        try:
            link = item.find('a')
            img = item.find('img')
            
            if not link: continue # Wajib ada link
            
            href = link.get('href')
            if not href or len(href) < 3: continue
            
            # 🔥 FILTER QUERY PARAMETER (Penyebab Judul Aneh)
            # Buang link yang ada '?' atau '=' (contoh: ?orderby=...)
            if '?' in href or '=' in href: continue
            
            # Validasi Link Komik (Harus mengandung 'manga' atau 'komik' atau slug bersih)
            if 'manga' not in href and 'komik' not in href: 
                # Cek apakah slug-nya valid (bukan file php/html)
                if '.' in href.split('/')[-1]: continue

            slug = href.strip('/').split('/')[-1]
            if not slug or slug in seen: continue
            
            # Cek Blacklist Slug
            if any(b in slug.lower() for b in BLACKLIST): continue

            # --- JUDUL ---
            h_tag = item.find(['h3', 'h4'])
            raw_title = h_tag.get_text(strip=True) if h_tag else link.get('title', '')
            
            # Bersihkan & Format
            title = clean_title(raw_title)
            if not title or len(title) < 3:
                title = format_slug_to_title(slug)
            
            if not title: continue # Skip jika judul kosong/rusak

            # --- GAMBAR ---
            raw_img = ""
            if img:
                raw_img = img.get('data-src') or img.get('src') or img.get('data-lazy-src') or ""
            
            if "asset" in raw_img or "icon" in raw_img: continue # Skip icon layout

            # --- LATEST ---
            latest = "Update"
            for span in item.find_all(['span', 'div', 'b']):
                txt = span.get_text(strip=True)
                if any(x in txt for x in ['Ch.', 'Vol.', 'Up ']):
                    latest = txt
                    break
            if len(latest) > 15: latest = "Update"

            # --- TIPE ---
            type_str = "Manga"
            if "manhwa" in title.lower(): type_str = "Manhwa"
            elif "manhua" in title.lower(): type_str = "Manhua"
            else:
                t_label = item.find(class_='type') or item.find(class_='tpe1_inf')
                if t_label: type_str = t_label.get_text(strip=True)

            seen.add(slug)
            data.append({
                "title": title,
                "slug": slug,
                "image": make_proxy_url(raw_img, request),
                "latest": latest,
                "type": type_str
            })
        except: continue
    
    return data

# ==========================================
# 🚀 ENDPOINTS
# ==========================================

@app.get("/")
async def root():
    return {"status": "API Komiku V13 (Smart Anti-Query)", "maintainer": "Gemini AI"}

@app.get("/api/home")
async def get_home(request: Request, page: int = 1):
    data = []
    # Strategi V13: Pustaka Only (Paling Stabil)
    if page == 1:
        soup = fetch_smart("/pustaka/")
        if soup: data = extract_comics_smart(soup, request)
        if len(data) < 10:
            soup_bk = fetch_smart("/daftar-komik/")
            if soup_bk: data.extend(extract_comics_smart(soup_bk, request))
    else:
        soup = fetch_smart(f"/pustaka/page/{page}/")
        if soup: data = extract_comics_smart(soup, request)

    if not data: return [{"title": "Maintenance", "slug": "#", "image": "", "latest": "-", "type": "-"}]
    return data[:60]

@app.get("/api/popular")
async def get_popular(request: Request, page: int = 1):
    target = f"/pustaka/page/{page}/?orderby=meta_value_num&meta_key=views&order=desc" if page > 1 else "/pustaka/?orderby=meta_value_num&meta_key=views&order=desc"
    soup = fetch_smart(target)
    return extract_comics_smart(soup, request) if soup else []

@app.get("/api/search")
async def search(query: str, request: Request):
    if not query: return []
    target = f"/?post_type=manga&s={query.replace(' ', '+')}"
    soup = fetch_smart(target)
    return extract_comics_smart(soup, request) if soup else []

@app.get("/api/detail/{slug}")
async def detail(slug: str, request: Request):
    soup = fetch_smart(f"/manga/{slug}/")
    if not soup: soup = fetch_smart(f"/komik/{slug}/")
    if not soup: return {"error": "Not Found", "chapters": []}

    try:
        h1 = soup.find('h1')
        title = clean_title(h1.text) if h1 else format_slug_to_title(slug)
        img_tag = soup.select_one('.sd-img img') or soup.find('img')
        raw_img = img_tag.get('src') if img_tag else ""
        desc = soup.select_one('#Sinopsis')
        synopsis = desc.get_text(strip=True) if desc else ""
        
        info = {}
        for row in soup.select('table.inftable tr'):
            cols = row.find_all('td')
            if len(cols) >= 2: info[cols[0].text.strip().replace(':','')] = cols[1].text.strip()
            
        chapters = []
        for item in soup.select('#Daftar_Chapter tr'):
            a = item.find('a')
            if not a: continue
            chapters.append({
                "title": a.text.strip(),
                "slug": a.get('href').strip('/').split('/')[-1],
                "date": ""
            })
            
        return {
            "title": title,
            "image": make_proxy_url(raw_img, request),
            "synopsis": synopsis,
            "info": info,
            "chapters": chapters
        }
    except Exception as e: return {"error": str(e), "title": slug}

@app.get("/api/read/{slug}")
async def read(slug: str, request: Request):
    soup = fetch_smart(f"/{slug}/")
    if not soup: soup = fetch_smart(f"/ch/{slug}/")
    images = []
    if soup:
        container = soup.select_one('#Baca_Komik') or soup
        for img in container.find_all('img'):
            src = img.get('src') or img.get('data-src')
            if src and 'http' in src and not any(x in src for x in ['iklan', 'ads']):
                images.append(make_proxy_url(src, request))
    return {"images": images}

@app.get("/api/image")
async def image_proxy(url: str):
    try:
        resp = requests.get(unquote(url), headers={'User-Agent': random.choice(USER_AGENTS), 'Referer': BASE_DOMAIN}, timeout=20, verify=False, stream=True)
        return Response(content=resp.content, media_type="image/jpeg")
    except: return Response(status_code=404)