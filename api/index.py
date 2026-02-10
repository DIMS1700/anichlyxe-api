from fastapi import FastAPI, Response, Request
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
BASE_DOMAIN = "https://komiku.org" 
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'windows', 'desktop': True})

def get_base_url(request: Request):
    return str(request.base_url).rstrip("/")

def make_proxy_url(target_url: str, request: Request):
    if not target_url or "placeholder" in target_url:
        return "https://via.placeholder.com/300x400?text=No+Image"
    
    base_url = get_base_url(request)
    if base_url in target_url:
        return target_url
    
    if target_url.startswith("/"):
        target_url = f"{BASE_DOMAIN}{target_url}"
        
    encoded_url = quote(target_url)
    return f"{base_url}/api/image?url={encoded_url}"

def fetch_smart(path: str):
    headers = {
        'User-Agent': USER_AGENT, 
        'Referer': BASE_DOMAIN,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8'
    }

    if not path.startswith("http"):
        url = f"{BASE_DOMAIN}{path if path.startswith('/') else '/' + path}"
    else:
        url = path

    try:
        print(f"🔄 Fetching: {url}")
        resp = scraper.get(url, headers=headers, timeout=25)
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
    return {"status": "API Komiku V3 FINAL (Full List Fixed)", "maintainer": "Gemini AI"}

@app.get("/api/home")
async def get_home(request: Request):
    """
    Mengambil data Home. Jika data di Home sedikit (karena struktur web berubah),
    otomatis fallback mengambil data dari Pustaka agar list penuh.
    """
    data = []
    seen = set()

    # --- TAHAP 1: Coba Ambil dari Home Utama ---
    soup = fetch_smart("/")
    
    if soup:
        # PERBAIKAN: Jangan pakai OR, tapi cari SEMUA elemen yang mungkin berisi komik
        # Kita cari container utama dulu
        containers = soup.select('.daftar .bge') + soup.select('.bge') + soup.select('div.ls4w')
        
        for item in containers:
            try:
                link = item.find('a')
                if not link: continue
                
                href = link.get('href')
                slug = href.strip('/').split('/')[-1]
                
                # Filter sampah
                if slug in seen or slug in ['manga', 'genre', 'populer', 'other', 'dmca']: continue
                
                # Gambar
                img_tag = item.find('img')
                raw_img = ""
                if img_tag:
                    raw_img = img_tag.get('data-src') or img_tag.get('src') or img_tag.get('data-lazy-src')
                
                # Judul
                h3 = item.find('h3') or item.find('h4')
                title = clean_title(h3.text if h3 else link.get('title', slug))
                
                # Info tambahan
                type_tag = item.find('span', class_='tpe1_inf') or item.find('div', class_='type')
                type_str = type_tag.text.strip() if type_tag else "Manga"
                
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
            except: continue

    # --- TAHAP 2: Fail-Safe (Jika Home cuma dapat < 5 item) ---
    # Ini yang memperbaiki masalah "Cuma ada satu"
    if len(data) < 5:
        print("⚠️ Data Home sedikit, mengambil backup dari Pustaka...")
        soup_pustaka = fetch_smart("/pustaka/") # Halaman ini isinya grid semua komik
        
        if soup_pustaka:
            items = soup_pustaka.select('.bge') or soup_pustaka.select('.daftar .item')
            for item in items:
                try:
                    link = item.find('a')
                    if not link: continue
                    slug = link.get('href').strip('/').split('/')[-1]
                    
                    if slug in seen: continue # Skip duplikat

                    img_tag = item.find('img')
                    raw_img = img_tag.get('data-src') or img_tag.get('src') if img_tag else ""
                    
                    h3 = item.find('h3')
                    title = clean_title(h3.text if h3 else slug)

                    seen.add(slug)
                    data.append({
                        "title": title,
                        "slug": slug,
                        "image": make_proxy_url(raw_img, request),
                        "latest": "Library",
                        "type": "Manga"
                    })
                except: continue

    if not data:
        return [{"title": "Maintenance / Error", "slug": "error", "image": "", "latest": "-", "type": "-"}]

    # Batasi agar tidak terlalu berat (opsional, misalnya 40 item)
    return data[:50]

@app.get("/api/detail/{slug}")
async def detail(slug: str, request: Request):
    # Coba variasi URL: /manga/slug atau /komik/slug
    soup = fetch_smart(f"/manga/{slug}/")
    if not soup:
        soup = fetch_smart(f"/komik/{slug}/")

    if not soup:
        return {"error": "Komik tidak ditemukan", "title": slug, "chapters": []}

    try:
        # Header Info
        h1 = soup.select_one('h1[itemprop="name"]') or soup.select_one('h1')
        title = clean_title(h1.text) if h1 else slug.replace('-', ' ').title()

        img_tag = soup.select_one('.sd-img img') or soup.select_one('.ims img') or soup.select_one('div.img img')
        raw_img = img_tag.get('src') or img_tag.get('data-src') if img_tag else ""
        image = make_proxy_url(raw_img, request)

        desc = soup.select_one('#Sinopsis') or soup.select_one('.desc') or soup.select_one('p[itemprop="description"]')
        synopsis = desc.get_text(strip=True) if desc else "Sinopsis tidak tersedia."

        info = {}
        tables = soup.select('.inftable tr') or soup.select('table.inf tr')
        for row in tables:
            cols = row.find_all('td')
            if len(cols) >= 2:
                key = cols[0].get_text(strip=True).replace(':', '')
                val = cols[1].get_text(strip=True)
                info[key] = val

        chapters = []
        ch_items = soup.select('#Daftar_Chapter td.judulseries') or soup.select('ul.chapter-list li') or soup.select('div.pop-per td.judulseries') or soup.select('table.chapter tbody tr')
        
        for item in ch_items:
            a_tag = item.find('a')
            if not a_tag: continue
            
            ch_href = a_tag.get('href')
            ch_slug = ch_href.strip('/').split('/')[-1]
            ch_title = a_tag.get_text(strip=True)
            
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
        return {"error": str(e), "title": slug, "chapters": []}

@app.get("/api/read/{slug}")
async def read(slug: str, request: Request):
    soup = fetch_smart(f"/{slug}/")
    if not soup or "404" in soup.text:
         soup = fetch_smart(f"/ch/{slug}/")
    if not soup or "404" in soup.text:
         soup = fetch_smart(f"/manga/{slug}/")

    images = []
    if soup:
        container = soup.select_one('#Baca_Komik') or soup.select_one('.baca-komik') or soup.select_one('#chimg-auh') or soup.select_one('.main-reading-area')
        
        img_candidates = []
        if container:
            img_candidates = container.find_all('img')
        else:
            article = soup.select_one('article') or soup.select_one('.entry-content') or soup.find('body')
            if article:
                img_candidates = article.find_all('img')

        for img in img_candidates:
            src = img.get('data-src') or img.get('src') or img.get('data-aload')
            if src and "http" in src:
                src = src.strip()
                if any(x in src.lower() for x in ['facebook', 'twitter', 'iklan', 'ads', 'google', 'disqus']):
                    continue
                images.append(make_proxy_url(src, request))
    
    if not images:
        return {"error": "Gagal load gambar", "images": []}
    return {"images": images}

@app.get("/api/image")
async def image_proxy(url: str):
    if not url: return Response(status_code=404)
    try:
        target_url = unquote(url)
        headers = {
            'User-Agent': USER_AGENT,
            'Referer': BASE_DOMAIN + '/',
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site'
        }
        resp = requests.get(target_url, headers=headers, stream=True, timeout=15, verify=False)
        if resp.status_code == 200:
            return Response(content=resp.content, media_type=resp.headers.get('content-type', 'image/jpeg'))
        else:
            return Response(status_code=404)
    except:
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