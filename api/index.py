from fastapi import FastAPI, Response, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cloudscraper
from bs4 import BeautifulSoup
import re
import requests
from urllib.parse import unquote, quote
import urllib3

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
# 🛠️ CONFIG & HELPERS
# ==========================================
# Domain bisa berubah sewaktu-waktu, kita gunakan yang paling stabil
BASE_DOMAIN = "https://komiku.org" 
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

# Inisialisasi Scraper satu kali agar session terjaga
scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'windows', 'desktop': True})

def get_base_url(request: Request):
    """Mendapatkan base URL dari server saat ini untuk proxy"""
    return str(request.base_url).rstrip("/")

def make_proxy_url(target_url: str, request: Request):
    """Membungkus URL gambar asli ke dalam Proxy API lokal"""
    if not target_url or "placeholder" in target_url:
        return "https://via.placeholder.com/300x400?text=No+Image"
    
    # Jika URL sudah localhost/proxy, jangan di-wrap lagi
    base_url = get_base_url(request)
    if base_url in target_url:
        return target_url
    
    # Fix URL relatif (misal: /wp-content/...)
    if target_url.startswith("/"):
        target_url = f"{BASE_DOMAIN}{target_url}"
        
    encoded_url = quote(target_url)
    return f"{base_url}/api/image?url={encoded_url}"

def fetch_smart(path: str):
    """
    Fungsi fetch yang lebih pintar menangani redirect dan variasi URL
    """
    headers = {
        'User-Agent': USER_AGENT, 
        'Referer': BASE_DOMAIN,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8'
    }

    # Pastikan path dimulai dengan slash jika belum ada domain
    if not path.startswith("http"):
        url = f"{BASE_DOMAIN}{path if path.startswith('/') else '/' + path}"
    else:
        url = path

    try:
        print(f"🔄 Fetching: {url}")
        resp = scraper.get(url, headers=headers, timeout=25)
        
        # Handle 404
        if resp.status_code == 404:
            print(f"❌ 404 Not Found: {url}")
            return None
            
        if resp.status_code == 200:
            return BeautifulSoup(resp.text, "html.parser")
            
    except Exception as e:
        print(f"❌ Error Fetching: {e}")
    return None

def clean_title(text):
    if not text: return ""
    text = re.sub(r'(Komik|Manga|Manhwa|Manhua|Bahasa Indonesia|Indo|\n)', '', text, flags=re.IGNORECASE)
    return text.strip()

# ==========================================
# 🚀 ENDPOINTS
# ==========================================

@app.get("/")
async def root():
    return {"status": "API Komiku V2 FIXED", "maintainer": "Gemini AI"}

@app.get("/api/home")
async def get_home(request: Request):
    # Fetch halaman utama
    soup = fetch_smart("/")
    data = []
    seen = set()
    
    if soup:
        # PENTING: Update Selector untuk Home
        # Mencoba berbagai kemungkinan class yang dipakai Komiku
        items = soup.select('.bge') or soup.select('.daftar .item') or soup.select('.kan .perapih') or soup.select('div.ls4w')
        
        for item in items:
            try:
                link = item.find('a')
                if not link: continue
                
                href = link.get('href')
                slug = href.strip('/').split('/')[-1]
                
                # Filter slug yang bukan komik
                if slug in seen or slug in ['manga', 'genre', 'populer', 'other']: continue
                
                # Extract Image (Cari data-src dulu, baru src)
                img_tag = item.find('img')
                raw_img = ""
                if img_tag:
                    raw_img = img_tag.get('data-src') or img_tag.get('src') or img_tag.get('data-lazy-src')
                
                # Extract Title
                h3 = item.find('h3') or item.find('h4')
                title = clean_title(h3.text if h3 else link.get('title', slug))
                
                # Extract Type (Manga/Manhwa/etc) & Latest Chapter
                type_tag = item.find('span', class_='tpe1_inf') or item.find('div', class_='type')
                type_str = type_tag.text.strip() if type_tag else "Manga"
                
                # Mencari indikator chapter terbaru
                up_tag = item.find('div', class_='new') or item.find('span', class_='ups') or item.find('div', class_='ep')
                latest = up_tag.text.strip() if up_tag else "Update"

                seen.add(slug)
                data.append({
                    "title": title,
                    "slug": slug,
                    "image": make_proxy_url(raw_img, request),
                    "latest": latest,
                    "type": type_str
                })
            except Exception as e:
                print(f"Error parse item: {e}")
                continue

    # Jika kosong, return dummy data agar frontend tidak crash
    if not data:
        return [{"title": "Gagal Memuat / Maintenance", "slug": "error", "image": "", "latest": "-", "type": "-"}]

    return data

@app.get("/api/detail/{slug}")
async def detail(slug: str, request: Request):
    # Coba variasi URL untuk detail
    soup = fetch_smart(f"/manga/{slug}/")
    if not soup:
        soup = fetch_smart(f"/komik/{slug}/")

    if not soup:
        return {"error": "Komik tidak ditemukan", "title": slug, "chapters": []}

    try:
        # Header Info
        info_container = soup.select_one('#Informasi') or soup.select_one('.infor')
        
        # Judul
        h1 = soup.select_one('h1[itemprop="name"]') or soup.select_one('h1')
        title = clean_title(h1.text) if h1 else slug.replace('-', ' ').title()

        # Gambar
        img_tag = soup.select_one('.sd-img img') or soup.select_one('.ims img') or soup.select_one('div.img img')
        raw_img = img_tag.get('src') or img_tag.get('data-src') if img_tag else ""
        image = make_proxy_url(raw_img, request)

        # Sinopsis
        desc = soup.select_one('#Sinopsis') or soup.select_one('.desc') or soup.select_one('p[itemprop="description"]')
        synopsis = desc.get_text(strip=True) if desc else "Sinopsis tidak tersedia."

        # Info Table
        info = {}
        tables = soup.select('.inftable tr') or soup.select('table.inf tr')
        for row in tables:
            cols = row.find_all('td')
            if len(cols) >= 2:
                key = cols[0].get_text(strip=True).replace(':', '')
                val = cols[1].get_text(strip=True)
                info[key] = val

        # Chapter List
        chapters = []
        # Cari table chapter atau list div
        ch_items = soup.select('#Daftar_Chapter td.judulseries') or soup.select('ul.chapter-list li') or soup.select('div.pop-per td.judulseries') or soup.select('table.chapter tbody tr')
        
        for item in ch_items:
            a_tag = item.find('a')
            if not a_tag: continue
            
            ch_href = a_tag.get('href')
            ch_slug = ch_href.strip('/').split('/')[-1]
            ch_title = a_tag.get_text(strip=True)
            
            # Cari tanggal
            date_tag = item.find_next_sibling('td', class_='tanggalseries') or item.find('span', class_='date')
            ch_date = date_tag.get_text(strip=True) if date_tag else "-"

            chapters.append({
                "title": ch_title,
                "slug": ch_slug,
                "date": ch_date
            })

        return {
            "title": title,
            "image": image,
            "synopsis": synopsis,
            "info": info,
            "chapters": chapters
        }
    except Exception as e:
        print(f"Detail Error: {e}")
        return {"error": str(e), "title": slug, "chapters": []}

@app.get("/api/read/{slug}")
async def read(slug: str, request: Request):
    """
    PERBAIKAN UTAMA: Logika pengambilan gambar chapter
    """
    soup = None
    
    # URL Strategy 1: Langsung Slug (paling umum di Komiku sekarang)
    # Contoh: https://komiku.org/kimetsu-no-yaiba-chapter-1-indo/
    print(f"📖 Mencoba Strategy 1 (Langsung): /{slug}/")
    soup = fetch_smart(f"/{slug}/")
    
    # URL Strategy 2: Pakai /ch/ atau /c/ (Legacy)
    if not soup or "404" in soup.text:
         print(f"📖 Mencoba Strategy 2 (Legacy): /ch/{slug}/")
         soup = fetch_smart(f"/ch/{slug}/")

    # URL Strategy 3: Pakai /manga/ (Kadang chapter ada di subfolder manga meski jarang)
    if not soup or "404" in soup.text:
         soup = fetch_smart(f"/manga/{slug}/")

    images = []
    
    if soup:
        # Container gambar: #Baca_Komik adalah standar lama, tapi kadang berubah
        container = soup.select_one('#Baca_Komik') or soup.select_one('.baca-komik') or soup.select_one('#chimg-auh') or soup.select_one('.main-reading-area')
        
        # Jika container spesifik tidak ketemu, cari SEMUA gambar di halaman yg relevan
        # Ini adalah "Fail-safe" mechanism
        img_candidates = []
        if container:
            img_candidates = container.find_all('img')
        else:
            # Cari div yang punya banyak gambar (heuristic)
            print("⚠️ Container utama tidak ketemu, mencari semua gambar di content...")
            article = soup.select_one('article') or soup.select_one('.entry-content') or soup.find('body')
            if article:
                img_candidates = article.find_all('img')

        for img in img_candidates:
            # Ambil src dari atribut yang mungkin
            src = img.get('data-src') or img.get('src') or img.get('data-aload')
            
            if src and "http" in src:
                src = src.strip()
                # Filter iklan/sampah
                blacklist = ['facebook', 'twitter', 'iklan', 'ads', 'google', 'disqus', 'logo', 'icon', 'gif']
                if any(x in src.lower() for x in blacklist):
                    continue
                    
                images.append(make_proxy_url(src, request))
    
    if not images:
        return {"error": "Gagal mengambil gambar. Chapter mungkin dihapus atau proteksi cloudflare aktif.", "images": []}
        
    return {"images": images}

@app.get("/api/image")
async def image_proxy(url: str):
    """
    Proxy Image dengan header Referer yang benar
    """
    if not url: return Response(status_code=404)
    
    try:
        target_url = unquote(url)
        
        # Headers penting: Seolah-olah browser yang minta gambar dari dalam website mereka sendiri
        headers = {
            'User-Agent': USER_AGENT,
            'Referer': BASE_DOMAIN + '/', # Referer harus domain asal
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
        }
        
        # Gunakan requests biasa untuk gambar (lebih cepat drpd cloudscraper untuk binary)
        # Verify=False jika ada masalah SSL di server gambar
        resp = requests.get(target_url, headers=headers, stream=True, timeout=15, verify=False)
        
        if resp.status_code == 200:
            return Response(content=resp.content, media_type=resp.headers.get('content-type', 'image/jpeg'))
        else:
            print(f"Image Proxy Fail {resp.status_code}: {target_url}")
            return Response(status_code=404)
            
    except Exception as e:
        print(f"Proxy Exception: {e}")
        return Response(status_code=500)

@app.get("/api/search")
async def search(query: str, request: Request):
    soup = fetch_smart(f"/?post_type=manga&s={query.replace(' ', '+')}")
    data = []
    if soup:
        items = soup.select('.bge') or soup.select('.daftar .item')
        for item in items:
            try:
                link = item.find('a')
                img_tag = item.find('img')
                raw_img = img_tag.get('src') or img_tag.get('data-src') if img_tag else ""
                
                data.append({
                    "title": clean_title(item.find('h3').text if item.find('h3') else link.text),
                    "slug": link.get('href').strip('/').split('/')[-1],
                    "image": make_proxy_url(raw_img, request),
                    "type": "Manga",
                    "latest": ""
                })
            except: continue
    return data