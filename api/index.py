from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
import cloudscraper
from bs4 import BeautifulSoup
import re
import random
import requests
from urllib.parse import urljoin # Import penting untuk fix link gambar

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DOMAINS = [
    "https://api.komiku.org",
    "https://komiku.org"
]

# ==========================================
# 🚀 SETUP SCRAPER
# ==========================================
def get_scraper():
    scraper = cloudscraper.create_scraper(
        browser={'browser': 'chrome', 'platform': 'windows', 'mobile': False}
    )
    scraper.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://komiku.org/',
        'Origin': 'https://komiku.org'
    })
    return scraper

scraper = get_scraper()

# ==========================================
# 🛠️ HELPER: FIX URL GAMBAR (V17)
# ==========================================
def fix_url(url, base="https://komiku.org"):
    if not url: return ""
    # Hapus spasi dan newline
    url = url.strip()
    # Jika url relatif (misal: /uploads/...), sambungkan dengan domain
    if url.startswith("/"):
        return f"{base}{url}"
    # Jika url protocol-relative (misal: //komiku.org/...), tambah https:
    if url.startswith("//"):
        return f"https:{url}"
    return url

# ==========================================
# 🛠️ SMART FETCH
# ==========================================
def fetch_smart(path: str, params: str = ""):
    for domain in DOMAINS:
        url = f"{domain}{path}{params}"
        try:
            host = domain.replace("https://", "")
            scraper.headers.update({'Authority': host})
            print(f"🔄 Mencoba: {url}")
            response = scraper.get(url, timeout=20)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                # Validasi konten
                if soup.select('.bge') or soup.select('#Baca_Komik') or soup.select('#Daftar_Chapter') or soup.find('a', href=re.compile(r'/(manga|manhua|manhwa)/')):
                    print(f"✅ Sukses di: {domain}")
                    return soup
        except Exception as e:
            print(f"❌ Error {domain}: {e}")
    return None

# ==========================================
# 🖼️ IMAGE PROXY (V17 - LEBIH KUAT)
# ==========================================
@app.get("/api/image")
async def image_proxy(url: str):
    if not url or "placeholder" in url: return Response(status_code=404)
    try:
        # Perbaiki URL sebelum request jika masih relatif
        if not url.startswith("http"):
            url = fix_url(url)

        headers = {
            "Referer": "https://komiku.org/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
        resp = requests.get(url, headers=headers, stream=True, timeout=15)
        if resp.status_code == 200:
            return Response(content=resp.content, media_type="image/jpeg")
        return Response(status_code=404)
    except:
        return Response(status_code=500)

# ==========================================
# 🛠️ HELPER: PARSING DATA
# ==========================================
def parse_manga_item(item):
    try:
        link = item if item.name == 'a' else item.find('a')
        if not link: return None
        href = link.get('href')
        if not href or len(href) < 5: return None
        slug = href.strip('/').split('/')[-1]
        if slug in ['manga', 'manhua', 'manhwa', 'genre', 'other', 'hot', 'populer']: return None

        # GAMBAR (V17 FIX)
        img = item.find('img')
        if not img and item.name == 'a': img = item.parent.find('img')
        image = "https://via.placeholder.com/150?text=No+Image"
        if img:
            raw = img.get('data-src') or img.get('src')
            if raw: image = fix_url(raw.split('?')[0])

        # JUDUL
        title = ""
        h3 = item.find(['h3', 'h4'])
        if h3: title = h3.get_text(strip=True)
        if not title and img: title = img.get('title') or img.get('alt')
        if not title:
            raw = link.get_text(" ", strip=True)
            title = re.sub(r'(Manga|Manhwa|Manhua|Komik|Isekai|Fantasi)\s?', '', raw, flags=re.IGNORECASE).strip()

        title = re.sub(r'^(Komik|Baca|Manga|Manhwa|Manhua)\s+', '', title, flags=re.IGNORECASE)
        title = re.sub(r'(Up\s?\d+|Baru|Warna|Hot)\s*$', '', title, flags=re.IGNORECASE).strip()
        if not title: title = slug.replace('-', ' ').title()

        # LATEST
        latest = ""
        latest_tag = item.find(lambda tag: tag.name in ['div', 'span'] and ('new' in str(tag.get('class','')) or 'judul2' in str(tag.get('class',''))))
        if latest_tag: latest = latest_tag.get_text(strip=True)
        else:
            txt = item.get_text(" ", strip=True)
            match = re.search(r'(Ch\.|Chapter)\s?\d+', txt)
            if match: latest = match.group(0)

        type_str = "Manga"
        if 'manhwa' in href: type_str = "Manhwa"
        elif 'manhua' in href: type_str = "Manhua"

        return {"title": title, "slug": slug, "image": image, "latest": latest, "type": type_str}
    except:
        return None

# ==========================================
# ENDPOINTS
# ==========================================
@app.get("/")
async def root(): return {"status": "API V17 (Final Image Fix)", "docs": "/docs"}

@app.get("/api/home")
async def get_home():
    soup = fetch_smart("/")
    if not soup: return []
    data, seen = [], set()
    items = soup.select('.bge') or soup.find_all('a', href=re.compile(r'/(manga|manhua|manhwa)/'))
    for item in items:
        if item.text.strip().startswith('#'): continue
        manga = parse_manga_item(item)
        if manga and manga['slug'] not in seen:
            if "placeholder" not in manga['image']: 
                seen.add(manga['slug'])
                data.append(manga)
        if len(data) >= 40: break
    return data

@app.get("/api/popular")
async def get_popular():
    soup = fetch_smart("/other/hot/")
    if not soup or not soup.select('.bge'): soup = fetch_smart("/daftar-komik/", "?orderby=popular")
    data, seen = [], set()
    if soup:
        items = soup.select('.bge')
        for item in items:
            manga = parse_manga_item(item)
            if manga and manga['slug'] not in seen:
                seen.add(manga['slug'])
                data.append(manga)
    return data

@app.get("/api/search")
async def search(query: str):
    clean_query = query.replace(" ", "+")
    soup = fetch_smart("/", f"?post_type=manga&s={clean_query}")
    data, seen = [], set()
    if soup:
        items = soup.select('.bge') or soup.find_all('a', href=re.compile(r'/(manga|manhua|manhwa)/'))
        for item in items:
            manga = parse_manga_item(item)
            if manga and manga['slug'] not in seen:
                seen.add(manga['slug'])
                data.append(manga)
    return data

@app.get("/api/list")
async def get_list(page: int = 1, genre: str = None, status: str = None, type: str = None, order: str = None):
    is_random = (order == "acak")
    if is_random: order = "update"
    base_url = f"{API_DOMAIN}/daftar-komik/"
    if page > 1: base_url += f"page/{page}/"
    params = []
    if genre: params.append(f"genre={genre}")
    if status: params.append(f"status={'end' if status == 'completed' else status}")
    if type: params.append(f"tipe={type}")
    if order: params.append(f"orderby={order}")
    query = "&".join(params)
    soup = fetch_html(f"{base_url}?{query}" if params else base_url)
    if (not soup or not soup.select('.bge')) and genre:
        soup = fetch_html(f"{API_DOMAIN}/genre/{genre}/page/{page}/")
    data, seen = [], set()
    if soup:
        candidates = soup.select('.bge, .kan, .daftar .item') or soup.find_all('a', href=re.compile(r'/(manga|manhua|manhwa)/'))
        for item in candidates:
            manga = parse_manga_item(item)
            if manga and manga['slug'] not in seen:
                seen.add(manga['slug'])
                data.append(manga)
    if is_random: random.shuffle(data)
    return data

@app.get("/api/detail/{slug}")
async def detail(slug: str):
    soup = fetch_smart(f"/manga/{slug}/")
    if not soup: return {"error": "Not Found"}
    try:
        h1 = soup.find('h1')
        title = h1.text.strip() if h1 else slug
        title = re.sub(r'(Baca|Komik|Manga|Manhwa|Manhua)\s?', '', title, flags=re.IGNORECASE).strip()
        
        # Gambar Detail (V17 FIX)
        image = ""
        img_tag = soup.select_one('.sd-img img')
        if img_tag:
            raw = img_tag.get('src') or img_tag.get('data-src')
            if raw: image = fix_url(raw.split('?')[0])
        
        desc = soup.select_one('.desc, .sinopsis, #Sinopsis')
        synopsis = desc.get_text(strip=True) if desc else ""
        info = {}
        for row in soup.select('.inftable tr'):
            cols = row.find_all('td')
            if len(cols) == 2: info[cols[0].text.replace(':', '').strip()] = cols[1].text.strip()

        # Chapter List
        chapters = []
        seen_ch = set()
        # Cari tabel daftar chapter
        chapter_table = soup.find('table', id='Daftar_Chapter')
        if chapter_table:
            for row in chapter_table.find_all('tr'):
                td = row.find('td', class_='judulseries')
                if td:
                    link = td.find('a')
                    if link:
                        href = link.get('href')
                        ch_slug = href.strip('/').split('/')[-1]
                        if ch_slug not in seen_ch:
                            seen_ch.add(ch_slug)
                            chapters.append({"title": link.text.strip(), "slug": ch_slug, "date": "-"})
        else:
            # Fallback
            for link in soup.find_all('a', href=re.compile(r'/(ch|chapter)/')):
                ch_slug = link.get('href').strip('/').split('/')[-1]
                if ch_slug == slug or ch_slug in seen_ch: continue
                seen_ch.add(ch_slug)
                chapters.append({"title": link.text.strip(), "slug": ch_slug, "date": "-"})

        return {"title": title, "image": image, "synopsis": synopsis, "info": info, "chapters": chapters}
    except Exception as e: return {"error": str(e)}

@app.get("/api/read/{slug}")
async def read(slug: str):
    # Baca Manga (V17 FIX: Filter lebih cerdas)
    soup = fetch_smart(f"/ch/{slug}/")
    if not soup: return {"error": "Not Found"}
    
    images = []
    container = soup.select_one('#Baca_Komik')
    if container:
        for img in container.find_all('img'):
            # Ambil semua kemungkinan src
            src = img.get('src') or img.get('data-src') or img.get('onerror')
            
            # Bersihkan hack onerror
            if src and "this.src" in src: src = src.split("'")[1]
            
            # V17 FIX: Fix URL relatif & filter sampah
            if src:
                full_url = fix_url(src)
                # Filter gambar kecil/icon/logo
                if "komiku.org" in full_url or "googleusercontent" in full_url or "cdn" in full_url:
                    if "facebook" not in full_url and "twitter" not in full_url and "logo" not in full_url:
                        images.append(full_url)
                
    return {"images": images}

@app.get("/api/menu-options")
async def menu_options():
    return {
        "genres": [{"label": g.title(), "value": g} for g in ["action", "adventure", "comedy", "drama", "fantasy", "isekai", "romance", "slice-of-life"]],
        "statuses": [{"label": "Semua", "value": ""}, {"label": "Ongoing", "value": "ongoing"}, {"label": "Completed", "value": "completed"}],
        "types": [{"label": "Semua", "value": ""}, {"label": "Manga", "value": "manga"}, {"label": "Manhwa", "value": "manhwa"}, {"label": "Manhua", "value": "manhua"}],
        "orders": [{"label": "Update", "value": "update"}, {"label": "Populer", "value": "popular"}, {"label": "Baru", "value": "date"}, {"label": "Acak", "value": "acak"}]
    }