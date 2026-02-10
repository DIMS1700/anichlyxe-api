from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
import cloudscraper
from bs4 import BeautifulSoup
import re
import random
import requests
from urllib.parse import unquote
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

# MOCK DATA (Fallback)
MOCK_DATA = [
    {"title": "One Piece", "slug": "one-piece", "image": "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg", "latest": "Ch. 1100", "type": "Manga"},
    {"title": "Solo Leveling", "slug": "solo-leveling", "image": "https://upload.wikimedia.org/wikipedia/en/9/95/Solo_Leveling_Webtoon_01.jpg", "latest": "End", "type": "Manhwa"},
    {"title": "Jujutsu Kaisen", "slug": "jujutsu-kaisen", "image": "https://upload.wikimedia.org/wikipedia/en/4/46/Jujutsu_Kaisen_cover.jpg", "latest": "Ch. 240", "type": "Manga"},
]

DOMAINS = ["https://komiku.org", "https://api.komiku.org"]
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

# ==========================================
# 🛠️ HELPER FUNCTIONS
# ==========================================
def fix_url(url):
    if not url: return ""
    url = url.strip()
    url = url.split('?')[0]
    if url.startswith("//"): return f"https:{url}"
    if url.startswith("/") and not url.startswith("//"): return f"https://komiku.org{url}"
    return url

def validate_soup(soup):
    if soup.select('.bge'): return True
    if soup.select('.daftar'): return True
    if soup.find('a', href=re.compile(r'/(manga|manhua|manhwa)/')): return True
    if soup.select('#Baca_Komik'): return True
    if soup.select('.sd-img'): return True
    return False

def fetch_smart(path: str, params: str = ""):
    scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'windows', 'desktop': True})
    headers = {'User-Agent': USER_AGENT, 'Referer': 'https://komiku.org/'}

    for domain in DOMAINS:
        url = f"{domain}{path}{params}"
        try:
            print(f"\n🔄 Connecting: {url}")
            resp = scraper.get(url, headers=headers, timeout=20)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                if validate_soup(soup):
                    print(f"✅ SUCCESS: {domain}")
                    return soup
        except Exception as e:
            print(f"❌ Failed: {e}")
    return None

def parse_manga_item(item):
    try:
        link = item if item.name == 'a' else item.find('a')
        if not link: return None
        href = link.get('href')
        slug = href.strip('/').split('/')[-1]
        if slug in ['manga', 'manhua', 'manhwa', 'genre', 'other', 'hot', 'populer']: return None

        img = item.find('img')
        if not img and item.name == 'a': img = item.parent.find('img')
        image = "https://via.placeholder.com/150?text=No+Image"
        if img:
            raw = img.get('data-src') or img.get('src')
            if raw: image = fix_url(raw)

        title = ""
        h3 = item.find(['h3', 'h4'])
        if h3: title = h3.get_text(strip=True)
        if not title and img: title = img.get('title') or img.get('alt')
        if not title: title = link.get_text(" ", strip=True)
        
        title = re.sub(r'(Manga|Manhwa|Manhua|Komik|Isekai|Fantasi)\s?', '', title, flags=re.IGNORECASE)
        title = re.sub(r'^(Komik|Baca|Manga|Manhwa|Manhua)\s+', '', title, flags=re.IGNORECASE)
        title = re.sub(r'(Up\s?\d+|Baru|Warna|Hot)\s*$', '', title, flags=re.IGNORECASE).strip()
        if not title: title = slug.replace('-', ' ').title()

        latest = "New"
        latest_tag = item.find(lambda tag: tag.name in ['div', 'span'] and ('new' in str(tag.get('class','')) or 'judul2' in str(tag.get('class',''))))
        if latest_tag: latest = latest_tag.get_text(strip=True)

        type_str = "Manga"
        if 'manhwa' in href: type_str = "Manhwa"
        elif 'manhua' in href: type_str = "Manhua"

        return {"title": title, "slug": slug, "image": image, "latest": latest, "type": type_str}
    except: return None

# ==========================================
# ENDPOINTS
# ==========================================
@app.get("/")
async def root(): return {"status": "API V30 (Detail Image Fix)", "docs": "/docs"}

@app.get("/api/home")
async def get_home():
    soup = fetch_smart("/")
    data, seen = [], set()
    if soup:
        # PERBAIKAN DI SINI (HAPUS TITIK DUA)
        items = soup.select('.bge') or soup.select('.daftar .item') or soup.find_all('a', href=re.compile(r'/(manga|manhua|manhwa)/'))
        for item in items:
            manga = parse_manga_item(item)
            if manga and manga['slug'] not in seen:
                seen.add(manga['slug'])
                data.append(manga)
    if not data: return MOCK_DATA
    return data

@app.get("/api/popular")
async def get_popular():
    soup = fetch_smart("/daftar-komik/", "?orderby=popular")
    data, seen = [], set()
    if soup:
        items = soup.select('.bge') or soup.select('.daftar .item')
        for item in items:
            manga = parse_manga_item(item)
            if manga and manga['slug'] not in seen:
                seen.add(manga['slug'])
                data.append(manga)
    
    if not data:
        home_data = await get_home()
        if home_data and home_data != MOCK_DATA:
            data = random.sample(home_data, min(len(home_data), 10))
        else:
            data = MOCK_DATA
    return data

@app.get("/api/search")
async def search(query: str):
    soup = fetch_smart("/", f"?post_type=manga&s={query.replace(' ', '+')}")
    data, seen = [], set()
    if soup:
        items = soup.select('.bge') or soup.select('.daftar .item') or soup.find_all('a', href=re.compile(r'/(manga|manhua|manhwa)/'))
        for item in items:
            manga = parse_manga_item(item)
            if manga and manga['slug'] not in seen:
                seen.add(manga['slug'])
                data.append(manga)
    if not data: return [m for m in MOCK_DATA if query.lower() in m['title'].lower()]
    return data

@app.get("/api/list")
async def get_list(page: int = 1, genre: str = None, order: str = None):
    base = "/daftar-komik/"
    params = []
    if page > 1: base += f"page/{page}/"
    if genre: params.append(f"genre={genre}")
    if order: params.append(f"orderby={order}")
    soup = fetch_smart(base, "?" + "&".join(params) if params else "")
    if (not soup or not soup.select('.bge')) and genre:
        soup = fetch_smart(f"/genre/{genre}/page/{page}/")
    data, seen = [], set()
    if soup:
        items = soup.select('.bge') or soup.select('.daftar .item') or soup.find_all('a', href=re.compile(r'/(manga|manhua|manhwa)/'))
        for item in items:
            manga = parse_manga_item(item)
            if manga and manga['slug'] not in seen:
                seen.add(manga['slug'])
                data.append(manga)
    if not data: return MOCK_DATA
    return data

@app.get("/api/detail/{slug}")
async def detail(slug: str):
    soup = fetch_smart(f"/manga/{slug}/")
    if not soup: 
        return {
            "title": slug.replace('-', ' ').title(),
            "image": "https://via.placeholder.com/300x400?text=No+Data",
            "synopsis": "Gagal terhubung ke server Komiku.",
            "info": {}, "chapters": []
        }
    try:
        h1 = soup.select_one('h1') or soup.select_one('#Judul h1')
        title = h1.text.strip() if h1 else slug.replace('-', ' ').title()
        
        image = "https://via.placeholder.com/300x400?text=No+Image"
        img = soup.select_one('.sd-img img')
        if img:
            raw = img.get('src') or img.get('data-src') or img.get('srcset')
            if raw: 
                image = fix_url(raw.split(' ')[0])
        
        desc = soup.select_one('.desc, .sinopsis, #Sinopsis')
        synopsis = desc.get_text(strip=True) if desc else ""
        
        info = {}
        for row in soup.select('.inftable tr'):
            cols = row.find_all('td')
            if len(cols) == 2: info[cols[0].text.replace(':', '').strip()] = cols[1].text.strip()
        
        chapters = []
        links = soup.select('#Daftar_Chapter td.judulseries a') or soup.find_all('a', href=re.compile(r'/(ch|chapter)/'))
        seen_ch = set()
        for link in links:
            href = link.get('href')
            ch_slug = href.strip('/').split('/')[-1]
            if ch_slug == slug or ch_slug in seen_ch: continue
            seen_ch.add(ch_slug)
            chapters.append({"title": link.text.strip(), "slug": ch_slug, "date": "-"})
        
        return {"title": title, "image": image, "synopsis": synopsis, "info": info, "chapters": chapters}
    except Exception as e: return {"error": str(e)}

@app.get("/api/read/{slug}")
async def read(slug: str):
    soup = fetch_smart(f"/ch/{slug}/")
    images = []
    if soup:
        container = soup.select_one('#Baca_Komik')
        if container:
            for img in container.find_all('img'):
                src = img.get('src') or img.get('onerror')
                if src and "this.src" in src: src = src.split("'")[1]
                if src:
                    full = fix_url(src)
                    if "facebook" not in full and "twitter" not in full and "logo" not in full:
                        images.append(full)
    if not images: images = ["https://via.placeholder.com/800x1200?text=Gagal+Memuat+Gambar"]
    return {"images": images}

@app.get("/api/image")
async def image_proxy(url: str):
    if not url: return Response(status_code=404)
    try:
        target_url = unquote(url)
        headers = {'User-Agent': USER_AGENT}
        if "komiku" in target_url: headers['Referer'] = 'https://komiku.org/'
            
        resp = requests.get(target_url, headers=headers, stream=True, timeout=15, verify=False)
        if resp.status_code == 200:
            return Response(content=resp.content, media_type="image/jpeg")
        return Response(status_code=404)
    except: return Response(status_code=500)

@app.get("/api/menu-options")
async def menu_options():
    return {
        "genres": [
            {"label": "Action", "value": "action"}, {"label": "Adventure", "value": "adventure"},
            {"label": "Comedy", "value": "comedy"}, {"label": "Drama", "value": "drama"},
            {"label": "Fantasy", "value": "fantasy"}, {"label": "Isekai", "value": "isekai"},
            {"label": "Romance", "value": "romance"}, {"label": "Slice of Life", "value": "slice-of-life"}
        ],
        "orders": [{"label": "Update", "value": "update"}, {"label": "Populer", "value": "popular"}]
    }