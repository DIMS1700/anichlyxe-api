from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
import cloudscraper
from bs4 import BeautifulSoup
import re
import random
import requests
from urllib.parse import quote, unquote

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# KONFIGURASI DOMAIN SHINIGAMI
# Kita pakai beberapa mirror untuk jaga-jaga
DOMAINS = [
    "https://shinigami.asia",      # Domain Utama (Biasanya redirect ke yang aktif)
    "https://09.shinigami.asia",   # Domain pilihanmu
    "https://id.shinigami.asia"    # Cadangan
]

# ==========================================
# 🚀 SETUP SCRAPER
# ==========================================
def get_scraper():
    scraper = cloudscraper.create_scraper(
        browser={'browser': 'chrome', 'platform': 'windows', 'mobile': False}
    )
    # Header yang mirip browser asli agar tidak diblokir Shinigami
    scraper.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://shinigami.asia/',
        'Origin': 'https://shinigami.asia'
    })
    return scraper

scraper = get_scraper()

# ==========================================
# 🛠️ HELPER: SMART FETCH
# ==========================================
def fetch_smart(path: str, params: str = ""):
    for domain in DOMAINS:
        url = f"{domain}{path}{params}"
        try:
            print(f"🔄 Mencoba: {url}")
            response = scraper.get(url, timeout=25)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                # Validasi: Apakah ini halaman Shinigami valid?
                if soup.select('.site-content') or soup.select('.page-item-detail') or soup.select('.reading-content'):
                    print(f"✅ Sukses di: {domain}")
                    return soup
            print(f"⚠️ Gagal/Kosong di: {domain}")
        except Exception as e:
            print(f"❌ Error {domain}: {e}")
    return None

# ==========================================
# 🖼️ IMAGE PROXY (WAJIB ADA)
# ==========================================
@app.get("/api/image")
async def image_proxy(url: str):
    if not url: return Response(status_code=404)
    try:
        # Dekode URL jika ter-encode
        target_url = unquote(url)
        
        headers = {
            "Referer": "https://shinigami.asia/", # Referer Shinigami agar tidak 403 Forbidden
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        resp = requests.get(target_url, headers=headers, stream=True, timeout=20)
        
        if resp.status_code == 200:
            return Response(content=resp.content, media_type="image/jpeg")
        return Response(status_code=404)
    except:
        return Response(status_code=500)

# ==========================================
# 🛠️ HELPER: PARSING ITEM (MADARA THEME)
# ==========================================
def parse_shinigami_item(item):
    try:
        # 1. Judul & Link
        title_tag = item.select_one('.post-title h3 a, .post-title h4 a, .h5 a')
        if not title_tag: return None
        
        title = title_tag.text.strip()
        href = title_tag.get('href')
        
        # Ambil slug dari URL (contoh: .../series/one-piece/ -> one-piece)
        slug = href.strip('/').split('/')[-1]
        
        # 2. Gambar
        img_tag = item.select_one('img')
        image = "https://via.placeholder.com/150?text=No+Image"
        
        if img_tag:
            # Madara theme sering pakai data-src atau srcset
            src = img_tag.get('data-src') or img_tag.get('src') or img_tag.get('srcset')
            if src:
                # Ambil URL pertama jika ada spasi (srcset)
                image = src.split(' ')[0]
                # Fix jika URL relatif
                if image.startswith("//"): image = "https:" + image

        # 3. Chapter Terbaru
        latest = "Chapter ?"
        chapter_tag = item.select_one('.list-chapter .chapter-item .btn-link, .chapter-item a')
        if chapter_tag:
            latest = chapter_tag.text.strip()

        # 4. Tipe (Manga/Manhwa/Manhua)
        # Shinigami kadang tidak menampilkan tipe di card, kita default ke Manga atau cek bendera jika ada
        type_str = "Manga" 
        if "manhwa" in slug.lower(): type_str = "Manhwa"
        elif "manhua" in slug.lower(): type_str = "Manhua"

        return {
            "title": title,
            "slug": slug,
            "image": image,
            "latest": latest,
            "type": type_str
        }
    except Exception as e:
        # print(f"Error parsing item: {e}")
        return None

# ==========================================
# ENDPOINTS
# ==========================================
@app.get("/")
async def root(): return {"status": "API Shinigami V18 (Madara Base)", "docs": "/docs"}

@app.get("/api/home")
async def get_home():
    # Home biasanya ada di section 'Latest Update'
    soup = fetch_smart("/")
    if not soup: return []
    
    data, seen = [], set()
    
    # Selector Madara Theme untuk item list
    items = soup.select('.page-item-detail, .c-tabs-item__content')
    
    for item in items:
        manga = parse_shinigami_item(item)
        if manga and manga['slug'] not in seen:
            seen.add(manga['slug'])
            data.append(manga)
            
    return data

@app.get("/api/popular")
async def get_popular():
    # Shinigami pakai filter sort=views atau trending
    soup = fetch_smart("/manga/?m_orderby=views")
    if not soup: return []

    data, seen = [], set()
    items = soup.select('.page-item-detail')
    
    for item in items:
        manga = parse_shinigami_item(item)
        if manga and manga['slug'] not in seen:
            seen.add(manga['slug'])
            data.append(manga)
    return data

@app.get("/api/search")
async def search(query: str):
    # Shinigami search url: /?s=query&post_type=wp-manga
    clean_query = query.replace(" ", "+")
    soup = fetch_smart(f"/?s={clean_query}&post_type=wp-manga")
    
    data, seen = [], set()
    if soup:
        # Hasil search Madara biasanya layoutnya .c-tabs-item__content
        items = soup.select('.c-tabs-item__content, .tab-content-wrap .c-tabs-item__content')
        for item in items:
            manga = parse_shinigami_item(item)
            if manga and manga['slug'] not in seen:
                seen.add(manga['slug'])
                data.append(manga)
    return data

@app.get("/api/list")
async def get_list(page: int = 1, genre: str = None, order: str = None):
    # Base URL List di Madara biasanya /manga/page/X/
    base_path = "/manga/"
    if page > 1: base_path += f"page/{page}/"
    
    params = []
    if order == "popular": params.append("m_orderby=views")
    elif order == "update": params.append("m_orderby=latest")
    elif order == "title": params.append("m_orderby=alphabet")
    else: params.append("m_orderby=latest") # Default
    
    # Kalau ada genre: /manga-genre/isekai/page/X/
    if genre:
        base_path = f"/manga-genre/{genre}/"
        if page > 1: base_path += f"page/{page}/"
    
    query = "?" + "&".join(params)
    soup = fetch_smart(base_path, query)
    
    data, seen = [], set()
    if soup:
        items = soup.select('.page-item-detail')
        for item in items:
            manga = parse_shinigami_item(item)
            if manga and manga['slug'] not in seen:
                seen.add(manga['slug'])
                data.append(manga)
    return data

@app.get("/api/detail/{slug}")
async def detail(slug: str):
    # URL Detail: /series/judul-manga/
    # Kadang /manga/judul-manga/
    # Kita coba Smart Fetch dengan path /series/ dulu
    soup = fetch_smart(f"/series/{slug}/")
    if not soup:
        soup = fetch_smart(f"/manga/{slug}/") # Coba path alternatif
        
    if not soup: return {"error": "Not Found"}
    
    try:
        # Judul
        title_elem = soup.select_one('.post-title h1')
        title = title_elem.text.strip() if title_elem else slug
        
        # Gambar
        img_elem = soup.select_one('.summary_image img')
        image = ""
        if img_elem:
            image = img_elem.get('data-src') or img_elem.get('src')
            if image: image = image.split(' ')[0] # Bersihkan srcset
            
        # Sinopsis
        desc_elem = soup.select_one('.summary__content, .manga-excerpt')
        synopsis = desc_elem.text.strip() if desc_elem else ""
        
        # Info Tambahan (Author, Status, dll)
        info = {}
        for row in soup.select('.post-content_item'):
            key = row.select_one('h5')
            val = row.select_one('.summary-content')
            if key and val:
                info[key.text.strip().replace(":", "")] = val.text.strip()

        # Chapter List
        chapters = []
        # Selector chapter list di Madara
        chap_list = soup.select('.wp-manga-chapter a') # Kadang urutannya terbalik
        
        seen_ch = set()
        for link in chap_list:
            ch_url = link.get('href')
            # Slug chapter biasanya bagian terakhir URL
            ch_slug = ch_url.strip('/').split('/')[-1]
            
            if ch_slug not in seen_ch:
                seen_ch.add(ch_slug)
                chapters.append({
                    "title": link.text.strip(),
                    "slug": ch_slug,
                    "date": "-" # Tanggal ada di elemen span sebelah 'a', optional
                })
        
        return {
            "title": title,
            "image": image,
            "synopsis": synopsis,
            "info": info,
            "chapters": chapters
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/read/{slug}")
async def read(slug: str):
    # URL Baca: /series/judul-manga/chapter-slug/ (Seringkali langsung /chapter-slug/ di root)
    # Shinigami sering pakai format: https://shinigami.asia/judul-chapter/
    
    # Kita coba fetch langsung ke root domain dengan slug chapter
    soup = fetch_smart(f"/{slug}/")
    
    if not soup: return {"error": "Not Found"}
    
    images = []
    # Selector gambar baca di Madara Theme
    img_container = soup.select('.reading-content img')
    
    for img in img_container:
        src = img.get('data-src') or img.get('src')
        if src:
            src = src.strip().split(' ')[0] # Ambil URL bersih
            if src.startswith("//"): src = "https:" + src
            images.append(src)
            
    return {"images": images}

@app.get("/api/menu-options")
async def menu_options():
    # Hardcoded genre Shinigami yang umum
    return {
        "genres": [
            {"label": "Action", "value": "action"},
            {"label": "Adventure", "value": "adventure"},
            {"label": "Comedy", "value": "comedy"},
            {"label": "Drama", "value": "drama"},
            {"label": "Fantasy", "value": "fantasy"},
            {"label": "Isekai", "value": "isekai"},
            {"label": "Romance", "value": "romance"},
            {"label": "Harem", "value": "harem"},
            {"label": "Martial Arts", "value": "martial-arts"},
            {"label": "Slice of Life", "value": "slice-of-life"}
        ],
        "orders": [
            {"label": "Terupdate", "value": "update"},
            {"label": "Populer", "value": "popular"},
            {"label": "Judul A-Z", "value": "title"}
        ]
    }