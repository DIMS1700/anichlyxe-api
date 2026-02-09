from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import cloudscraper
from bs4 import BeautifulSoup
import re
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# KONFIGURASI DOMAIN
MAIN_DOMAIN = "https://komiku.org"
API_DOMAIN = "https://api.komiku.org"

# ==========================================
# 🚀 SETUP SCRAPER
# ==========================================
def get_scraper():
    scraper = cloudscraper.create_scraper(
        browser={'browser': 'chrome', 'platform': 'windows', 'mobile': False}
    )
    scraper.headers.update({
        'Referer': MAIN_DOMAIN,
        'Origin': MAIN_DOMAIN,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Authority': 'api.komiku.org'
    })
    return scraper

scraper = get_scraper()

def fetch_html(url: str):
    try:
        domain = "api.komiku.org" if "api.komiku" in url else "komiku.org"
        scraper.headers.update({'Authority': domain})
        
        print(f"🔄 Fetching: {url}")
        response = scraper.get(url, timeout=30)
        
        if response.status_code == 200:
            return BeautifulSoup(response.text, "html.parser")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

# ==========================================
# 🛠️ HELPER: PARSING (ANTI-TITLE KOSONG)
# ==========================================
def parse_manga_item(item):
    try:
        # 1. Cari Link
        link = item if item.name == 'a' else item.find('a')
        if not link: return None
        
        href = link.get('href')
        if not href or len(href) < 5: return None
        
        slug = href.strip('/').split('/')[-1]
        if slug in ['manga', 'manhua', 'manhwa', 'genre', 'other', 'hot', 'populer']: return None

        # 2. Cari Gambar
        img = item.find('img')
        if not img and item.name == 'a': 
            img = item.parent.find('img')

        image = "https://via.placeholder.com/150?text=No+Image"
        if img:
            image = img.get('src') or img.get('data-src')
            if '?' in image: image = image.split('?')[0]

        # 3. LOGIKA JUDUL (DISEMPURNAKAN)
        title = ""
        
        # Prioritas A: Cari heading (h3/h4)
        h3 = item.find(['h3', 'h4'])
        if h3:
            title = h3.get_text(strip=True)
        
        # Prioritas B: Title dari gambar
        if not title and img:
            title = img.get('title') or img.get('alt')
            
        # Prioritas C: Text link (dibersihkan)
        if not title:
            raw_text = link.get_text(" ", strip=True)
            # Hapus label genre/tipe yang nempel
            title = re.sub(r'(Manga|Manhwa|Manhua|Komik|Isekai|Fantasi|Aksi)\s?', '', raw_text, flags=re.IGNORECASE).strip()

        # 4. FINAL CLEANUP
        title = re.sub(r'^(Komik|Baca|Manga|Manhwa|Manhua)\s+', '', title, flags=re.IGNORECASE)
        title = re.sub(r'(Up\s?\d+|Baru|Warna|Hot)\s*$', '', title, flags=re.IGNORECASE)
        title = title.replace('\n', ' ').strip()

        # 🔥 PENGAMAN TERAKHIR (FORCE SLUG) 🔥
        # Jika judul kosong, gunakan slug yang dirapikan
        if not title or len(title) < 2:
            title = slug.replace('-', ' ').title()

        # 5. Info Tambahan
        latest = ""
        latest_tag = item.find(lambda tag: tag.name in ['div', 'span'] and ('new' in str(tag.get('class','')) or 'judul2' in str(tag.get('class',''))))
        if latest_tag:
            latest = latest_tag.get_text(strip=True)
        else:
            txt = item.get_text(" ", strip=True)
            match = re.search(r'(Ch\.|Chapter)\s?\d+(\.\d+)?', txt)
            if match: latest = match.group(0)

        type_str = "Manga"
        if 'manhwa' in href: type_str = "Manhwa"
        elif 'manhua' in href: type_str = "Manhua"

        return {
            "title": title,
            "slug": slug,
            "image": image,
            "latest": latest,
            "type": type_str
        }
    except:
        return None

@app.get("/")
async def root():
    return {"status": "API V11 (Anti-Empty Title)", "docs": "/docs"}

# ==========================================
# 🏠 HOME
# ==========================================
@app.get("/api/home")
async def get_home():
    soup = fetch_html(MAIN_DOMAIN)
    if not soup: return []
    
    data = []
    seen = set()
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

# ==========================================
# 🔥 POPULER
# ==========================================
@app.get("/api/popular")
async def get_popular():
    url = f"{API_DOMAIN}/other/hot/"
    soup = fetch_html(url)
    
    data = []
    seen = set()
    if soup:
        items = soup.select('.bge')
        for item in items:
            manga = parse_manga_item(item)
            if manga and manga['slug'] not in seen:
                manga['title'] = re.sub(r'^#\d+\s+', '', manga['title'])
                seen.add(manga['slug'])
                data.append(manga)
    return data

# ==========================================
# 🔍 SEARCH
# ==========================================
@app.get("/api/search")
async def search(query: str):
    clean_query = query.replace(" ", "+")
    url = f"{API_DOMAIN}/?post_type=manga&s={clean_query}"
    soup = fetch_html(url)
    data = []
    seen = set()
    
    if soup:
        items = soup.select('.bge') or soup.find_all('a', href=re.compile(r'/(manga|manhua|manhwa)/'))
        for item in items:
            manga = parse_manga_item(item)
            if manga and manga['slug'] not in seen:
                seen.add(manga['slug'])
                data.append(manga)
    return data

# ==========================================
# 📂 LIST / GENRE / FILTER
# ==========================================
@app.get("/api/list")
async def get_list(
    page: int = 1,
    genre: str = None,   
    status: str = None,  
    type: str = None,    
    order: str = None    
):
    is_random = False
    if order == "acak":
        order = "update"
        is_random = True

    base_url = f"{API_DOMAIN}/daftar-komik/"
    if page > 1: base_url += f"page/{page}/"
    
    params = []
    if genre: params.append(f"genre={genre}")
    if status: 
        val = "end" if status == "completed" else status
        params.append(f"status={val}")
    if type: params.append(f"tipe={type}")
    if order: params.append(f"orderby={order}")
    
    query = "&".join(params)
    url_target = f"{base_url}?{query}" if params else base_url
    
    soup = fetch_html(url_target)
    
    # Fallback Path Genre jika query gagal
    if (not soup or not soup.select('.bge')) and genre:
        path_url = f"{API_DOMAIN}/genre/{genre}/"
        if page > 1: path_url += f"page/{page}/"
        soup = fetch_html(path_url)

    data = []
    seen = set()
    
    if soup:
        candidates = soup.select('.bge, .kan, .daftar .item')
        if not candidates:
            candidates = soup.find_all('a', href=re.compile(r'/(manga|manhua|manhwa)/'))

        for item in candidates:
            manga = parse_manga_item(item)
            if manga and manga['slug'] not in seen:
                if manga['title'].startswith('#'): continue
                seen.add(manga['slug'])
                data.append(manga)
            
    if is_random:
        random.shuffle(data)
        
    return data

# ==========================================
# 📖 DETAIL
# ==========================================
@app.get("/api/detail/{slug}")
async def detail(slug: str):
    url = f"{MAIN_DOMAIN}/manga/{slug}/"
    soup = fetch_html(url)
    if not soup: return {"error": "Not Found"}

    try:
        h1 = soup.find('h1')
        title = h1.text.strip() if h1 else slug
        title = re.sub(r'(Baca|Komik|Manga|Manhwa|Manhua)\s?', '', title, flags=re.IGNORECASE).strip()
        
        img = soup.select_one('.sd-img img')
        image = img.get('src') if img else ""
        if '?' in image: image = image.split('?')[0]
        
        desc = soup.select_one('.desc, .sinopsis, #Sinopsis')
        synopsis = desc.get_text(strip=True) if desc else ""

        chapters = []
        seen_ch = set()
        
        links = soup.find_all('a', href=re.compile(r'/(ch|chapter)/'))
        for link in links:
            href = link.get('href')
            ch_slug = href.strip('/').split('/')[-1]
            if ch_slug == slug or ch_slug in seen_ch: continue
            
            seen_ch.add(ch_slug)
            chapters.append({
                "title": link.text.strip(),
                "slug": ch_slug,
                "date": "-"
            })

        return {
            "title": title,
            "image": image,
            "synopsis": synopsis,
            "chapters": chapters
        }
    except Exception as e:
        return {"error": str(e)}

# ==========================================
# 👁️ BACA
# ==========================================
@app.get("/api/read/{slug}")
async def read(slug: str):
    url = f"{MAIN_DOMAIN}/ch/{slug}/"
    soup = fetch_html(url)
    if not soup: return {"error": "Not Found"}

    images = []
    for img in soup.select('#Baca_Komik img'):
        src = img.get('src') or img.get('onerror')
        if src and "this.src" in src: src = src.split("'")[1]
        if src and src.startswith('http'): images.append(src)
    return {"images": images}

# ==========================================
# 🏷️ OPTIONS
# ==========================================
@app.get("/api/menu-options")
async def menu_options():
    return {
        "genres": [{"label": g.title(), "value": g} for g in ["action", "adventure", "comedy", "drama", "fantasy", "isekai", "romance", "slice-of-life"]],
        "statuses": [{"label": "Semua", "value": ""}, {"label": "Ongoing", "value": "ongoing"}, {"label": "Completed", "value": "completed"}],
        "types": [{"label": "Semua", "value": ""}, {"label": "Manga", "value": "manga"}, {"label": "Manhwa", "value": "manhwa"}, {"label": "Manhua", "value": "manhua"}],
        "orders": [{"label": "Update", "value": "update"}, {"label": "Populer", "value": "popular"}, {"label": "Baru", "value": "date"}, {"label": "Acak", "value": "acak"}]
    }