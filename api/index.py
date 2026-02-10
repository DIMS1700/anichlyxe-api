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
DOMAINS = ["https://komiku.org", "https://api.komiku.org"]
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

def get_base_url(request: Request):
    """Mendapatkan base URL dari server saat ini untuk proxy"""
    return str(request.base_url).rstrip("/")

def make_proxy_url(target_url: str, request: Request):
    """Membungkus URL gambar asli ke dalam Proxy API lokal"""
    if not target_url or "placeholder" in target_url:
        return target_url
    # Jika URL sudah localhost/proxy, jangan di-wrap lagi
    base_url = get_base_url(request)
    if base_url in target_url:
        return target_url
    
    encoded_url = quote(target_url)
    return f"{base_url}/api/image?url={encoded_url}"

def fetch_smart(path: str, params: str = ""):
    scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'windows', 'desktop': True})
    headers = {
        'User-Agent': USER_AGENT, 
        'Referer': 'https://komiku.org/',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8'
    }

    for domain in DOMAINS:
        url = f"{domain}{path}{params}"
        try:
            print(f"🔄 Fetching: {url}")
            resp = scraper.get(url, headers=headers, timeout=25)
            if resp.status_code == 200:
                return BeautifulSoup(resp.text, "html.parser")
        except Exception as e:
            print(f"❌ Error {domain}: {e}")
    return None

def clean_title(text):
    if not text: return ""
    text = re.sub(r'(Komik|Manga|Manhwa|Manhua|Bahasa Indonesia|Indo)', '', text, flags=re.IGNORECASE)
    return text.strip()

# ==========================================
# 🚀 ENDPOINTS
# ==========================================

@app.get("/")
async def root():
    return {"status": "API V30 FIXED (Auto-Proxy Images)", "docs": "/docs"}

@app.get("/api/home")
async def get_home(request: Request):
    soup = fetch_smart("/")
    data = []
    seen = set()
    
    if soup:
        # Prioritas selector yang lebih akurat
        items = soup.select('.bge') or soup.select('.daftar .item') or soup.find_all('div', class_='bge')
        
        for item in items:
            try:
                link = item.find('a')
                if not link: continue
                
                href = link.get('href')
                slug = href.strip('/').split('/')[-1]
                if slug in seen or slug in ['manga', 'genre', 'populer']: continue
                
                # Extract Image
                img_tag = item.find('img')
                raw_img = "https://via.placeholder.com/150"
                if img_tag:
                    raw_img = img_tag.get('src') or img_tag.get('data-src') or img_tag.get('data-src-img')
                
                # Wrap image dengan Proxy
                image = make_proxy_url(raw_img, request)

                # Extract Title
                title = clean_title(item.find('h3').text if item.find('h3') else link.get('title', slug))
                
                # Extract Type & Latest
                type_tag = item.find('span', class_='tpe1_inf')
                type_str = type_tag.text.strip() if type_tag else "Manga"
                
                up_tag = item.find('div', class_='new') or item.find('span', class_='ups')
                latest = up_tag.text.strip() if up_tag else "Update"

                seen.add(slug)
                data.append({
                    "title": title,
                    "slug": slug,
                    "image": image,
                    "latest": latest,
                    "type": type_str
                })
            except Exception as e:
                continue

    return data if data else [{"title": "Error/Maintenance", "slug": "error", "image": "", "latest": "-", "type": "-"}]

@app.get("/api/popular")
async def get_popular(request: Request):
    # Fallback ke home jika popular error, tapi coba fetch dulu
    soup = fetch_smart("/pustaka/", "?orderby=views") 
    data = []
    seen = set()
    
    if soup:
        items = soup.select('.bge') or soup.select('.daftar .item')
        for item in items:
            try:
                link = item.find('a')
                if not link: continue
                slug = link.get('href').strip('/').split('/')[-1]
                if slug in seen: continue
                
                img_tag = item.find('img')
                raw_img = img_tag.get('data-src') or img_tag.get('src') if img_tag else ""
                image = make_proxy_url(raw_img, request)
                
                title = clean_title(item.find('h3').text if item.find('h3') else slug)
                
                seen.add(slug)
                data.append({
                    "title": title,
                    "slug": slug,
                    "image": image,
                    "latest": "Hot",
                    "type": "Manga"
                })
            except: continue
            
    return data if data else await get_home(request)

@app.get("/api/detail/{slug}")
async def detail(slug: str, request: Request):
    soup = fetch_smart(f"/manga/{slug}/")
    if not soup:
        # Coba format URL lain jika gagal (kadang ada yang pakai /komik/)
        soup = fetch_smart(f"/komik/{slug}/")

    if not soup:
        return {"error": "Not Found", "title": slug, "chapters": []}

    try:
        # 1. Judul
        h1 = soup.select_one('h1[itemprop="name"]') or soup.select_one('h1')
        title = clean_title(h1.text) if h1 else slug.replace('-', ' ').title()

        # 2. Gambar Cover (Ambil dari Meta Tag agar Resolusi Tinggi & Pasti Ada)
        meta_img = soup.find("meta", property="og:image")
        if meta_img:
            raw_img = meta_img.get("content")
        else:
            img_tag = soup.select_one('.sd-img img') or soup.select_one('.ims img')
            raw_img = img_tag.get('src') or img_tag.get('data-src') if img_tag else ""
        
        image = make_proxy_url(raw_img, request)

        # 3. Sinopsis
        desc = soup.select_one('#Sinopsis') or soup.select_one('.desc') or soup.select_one('p[itemprop="description"]')
        synopsis = desc.get_text(strip=True) if desc else "Sinopsis tidak tersedia."

        # 4. Info Detail
        info = {}
        for row in soup.select('.inftable tr'):
            cols = row.find_all('td')
            if len(cols) >= 2:
                key = cols[0].get_text(strip=True).replace(':', '')
                val = cols[1].get_text(strip=True)
                info[key] = val

        # 5. Chapter List
        chapters = []
        # Cari table chapter atau div list
        ch_items = soup.select('#Daftar_Chapter td.judulseries') or soup.select('ul.chapter-list li') or soup.find_all('td', class_='judulseries')
        
        for item in ch_items:
            a_tag = item.find('a')
            if not a_tag: continue
            
            ch_href = a_tag.get('href')
            ch_slug = ch_href.strip('/').split('/')[-1]
            ch_title = a_tag.get_text(strip=True)
            
            # Cari tanggal jika ada
            date_tag = item.find_next_sibling('td', class_='tanggalseries')
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
    """
    Endpoint Baca Komik.
    Mengambil semua gambar dari chapter dan membungkusnya dengan Proxy URL.
    """
    # Coba variasi URL chapter (ch/ atau c/)
    soup = fetch_smart(f"/ch/{slug}/")
    if not soup or "404" in soup.text:
         soup = fetch_smart(f"/c/{slug}/")
    
    images = []
    
    if soup:
        # Container utama biasanya #Baca_Komik
        container = soup.select_one('#Baca_Komik')
        
        if container:
            img_tags = container.find_all('img')
            for img in img_tags:
                # Prioritas data-src karena src seringkali placeholder/loading gif
                src = img.get('data-src') or img.get('src') or img.get('data-aload')
                
                if src and "http" in src:
                    # Filter iklan/sampah
                    if any(x in src.lower() for x in ['facebook', 'twitter', 'iklan', 'ads', 'google']):
                        continue
                        
                    # Bungkus dengan Proxy agar frontend bisa buka
                    images.append(make_proxy_url(src, request))
    
    if not images:
        return {"error": "Gagal mengambil gambar. Kemungkinan proteksi Cloudflare tinggi atau Chapter tidak ditemukan.", "images": []}
        
    return {"images": images}

@app.get("/api/image")
async def image_proxy(url: str):
    """
    Proxy untuk mem-bypass Hotlink Protection.
    Frontend akan memanggil ini: /api/image?url=https://komiku.org/gambar.jpg
    """
    if not url: return Response(status_code=404)
    
    try:
        target_url = unquote(url)
        
        # Headers penting agar server target mengira request dari websitenya sendiri
        headers = {
            'User-Agent': USER_AGENT,
            'Referer': 'https://komiku.org/',
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site'
        }
        
        resp = requests.get(target_url, headers=headers, stream=True, timeout=20, verify=False)
        
        if resp.status_code == 200:
            return Response(content=resp.content, media_type="image/jpeg")
        else:
            return Response(status_code=404)
            
    except Exception as e:
        print(f"Proxy Error: {e}")
        return Response(status_code=500)

@app.get("/api/search")
async def search(query: str, request: Request):
    soup = fetch_smart("/", f"?post_type=manga&s={query.replace(' ', '+')}")
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