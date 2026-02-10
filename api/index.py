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
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
]

scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'windows', 'desktop': True})

# ==========================================
# 🛠️ HELPERS
# ==========================================

def get_base_url(request: Request):
    return str(request.base_url).rstrip("/")

def make_proxy_url(target_url: str, request: Request):
    if not target_url or "placeholder" in target_url:
        return "https://via.placeholder.com/300x400?text=No+Image"
    
    base_url = get_base_url(request)
    if target_url.startswith("/"):
        target_url = f"{BASE_DOMAIN}{target_url}"
        
    encoded_url = quote(target_url)
    return f"{base_url}/api/image?url={encoded_url}"

def fetch_smart(path: str):
    headers = {
        'User-Agent': random.choice(USER_AGENTS),
        'Referer': BASE_DOMAIN,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
    }

    url = path if path.startswith("http") else f"{BASE_DOMAIN}{path if path.startswith('/') else '/' + path}"

    try:
        print(f"🔄 Fetching: {url}")
        resp = scraper.get(url, headers=headers, timeout=20)
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
# 🧩 LOGIKA EKSTRAKSI (UNIVERSAL)
# ==========================================
def extract_comics_from_soup(soup, request, limit=60):
    data = []
    seen = set()
    
    all_divs = soup.find_all('div')
    
    for div in all_divs:
        try:
            link = div.find('a')
            img = div.find('img')
            title_tag = div.find(['h3', 'h4', 'h2'])
            
            if not link or not img: continue
            
            href = link.get('href')
            if not href or ('manga' not in href and 'komik' not in href): continue

            slug = href.strip('/').split('/')[-1]
            if slug in seen: continue
            
            raw_title = title_tag.text if title_tag else link.get('title', slug)
            title = clean_title(raw_title)
            
            raw_img = img.get('data-src') or img.get('src') or img.get('data-lazy-src') or ""
            
            latest = "Update"
            for span in div.find_all(['span', 'div', 'b']):
                txt = span.get_text(strip=True)
                if 'Ch' in txt or 'Vol' in txt or 'Up' in txt:
                    latest = txt
                    break
            
            type_str = "Manga"
            lower_title = title.lower()
            if "manhwa" in lower_title or "toptoon" in raw_img: type_str = "Manhwa"
            elif "manhua" in lower_title or "ac.qq" in raw_img: type_str = "Manhua"

            seen.add(slug)
            data.append({
                "title": title,
                "slug": slug,
                "image": make_proxy_url(raw_img, request),
                "latest": latest,
                "type": type_str
            })
            if len(data) >= limit: break
        except: continue
    return data

# ==========================================
# 🚀 ENDPOINTS
# ==========================================

@app.get("/")
async def root():
    return {"status": "API Komiku V7 (Search Added)", "maintainer": "Gemini AI"}

@app.get("/api/home")
async def get_home(request: Request, page: int = 1):
    """
    Support Pagination: /api/home?page=2
    """
    data = []
    
    # Logic Pagination
    if page == 1:
        # Halaman 1: Ambil dari Home Utama + Backup
        soup = fetch_smart("/")
        if soup: data = extract_comics_from_soup(soup, request)
        
        if len(data) < 5:
            soup_list = fetch_smart("/daftar-komik/")
            if soup_list: data.extend(extract_comics_from_soup(soup_list, request))
    else:
        # Halaman 2+: Langsung tembak endpoint halaman komik
        # Format Komiku: /daftar-komik/page/2/
        target = f"/daftar-komik/page/{page}/"
        soup = fetch_smart(target)
        if soup: data = extract_comics_from_soup(soup, request)

    if not data:
        return [{"title": "End of List", "slug": "#", "image": "", "latest": "-", "type": "-"}]
        
    return data[:60]

@app.get("/api/search")
async def search(query: str, request: Request):
    """
    Fitur Search: /api/search?query=naruto
    """
    if not query: return []
    
    # Format URL Search Komiku: /?post_type=manga&s=keyword
    target = f"/?post_type=manga&s={query.replace(' ', '+')}"
    soup = fetch_smart(target)
    
    if not soup: return []
    
    # Gunakan logika ekstraksi yang sama
    return extract_comics_from_soup(soup, request)

@app.get("/api/detail/{slug}")
async def detail(slug: str, request: Request):
    soup = fetch_smart(f"/manga/{slug}/")
    if not soup: soup = fetch_smart(f"/komik/{slug}/")
    
    if not soup: return {"error": "Komik tidak ditemukan", "chapters": []}

    try:
        h1 = soup.find('h1')
        title = clean_title(h1.text) if h1 else slug
        
        img_container = soup.select_one('.sd-img') or soup.select_one('.ims') or soup.select_one('div.img')
        img_tag = img_container.find('img') if img_container else soup.find('img')
        raw_img = img_tag.get('src') or img_tag.get('data-src') if img_tag else ""
        
        desc = soup.select_one('#Sinopsis') or soup.select_one('.desc') or soup.find('p', itemprop='description')
        synopsis = desc.get_text(strip=True) if desc else "Sinopsis belum tersedia."
        
        info = {}
        for table in soup.find_all('table'):
            for row in table.find_all('tr'):
                cols = row.find_all('td')
                if len(cols) >= 2:
                    info[cols[0].get_text(strip=True).replace(':', '')] = cols[1].get_text(strip=True)
                    
        chapters = []
        ch_container = soup.select_one('#Daftar_Chapter') or soup.select_one('table.chapter')
        
        if ch_container:
            for row in ch_container.find_all(['tr', 'li']):
                a = row.find('a')
                if not a: continue
                
                ch_title = a.get_text(strip=True)
                ch_slug = a.get('href').strip('/').split('/')[-1]
                
                date_elem = row.find(class_='tanggalseries') or row.find(class_='date')
                ch_date = date_elem.get_text(strip=True) if date_elem else ""
                
                chapters.append({
                    "title": ch_title,
                    "slug": ch_slug,
                    "date": ch_date
                })
        
        return {
            "title": title,
            "image": make_proxy_url(raw_img, request),
            "synopsis": synopsis,
            "info": info,
            "chapters": chapters
        }
    except Exception as e:
        return {"error": str(e), "title": slug}

@app.get("/api/read/{slug}")
async def read(slug: str, request: Request):
    print(f"📖 Reading: {slug}")
    soup = fetch_smart(f"/{slug}/")
    if not soup: soup = fetch_smart(f"/ch/{slug}/")
    if not soup: soup = fetch_smart(f"/manga/{slug}/")

    if not soup: return {"error": "Chapter not found", "images": []}

    images = []
    container = soup.select_one('#Baca_Komik') or soup.select_one('.baca-komik') or soup.select_one('#chimg-auh') or soup.select_one('.main-reading-area')
    
    img_candidates = container.find_all('img') if container else soup.find_all('img')

    for img in img_candidates:
        src = img.get('src') or img.get('data-src') or img.get('data-aload')
        if src and src.startswith('http'):
            src_lower = src.lower()
            if any(x in src_lower for x in ['facebook', 'twitter', 'iklan', 'ads', 'google', 'disqus', 'logo', 'icon']):
                continue
            if any(ext in src_lower for ext in ['.jpg', '.jpeg', '.png', '.webp', '.avif']):
                images.append(make_proxy_url(src, request))
    
    return {"images": images}

@app.get("/api/image")
async def image_proxy(url: str):
    if not url: return Response(status_code=404)
    try:
        target_url = unquote(url)
        headers = {
            'User-Agent': random.choice(USER_AGENTS),
            'Referer': BASE_DOMAIN + '/'
        }
        resp = requests.get(target_url, headers=headers, stream=True, timeout=20, verify=False)
        return Response(content=resp.content, media_type=resp.headers.get('content-type', 'image/jpeg'))
    except:
        return Response(status_code=500)