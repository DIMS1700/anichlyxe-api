from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
import cloudscraper
from bs4 import BeautifulSoup
import re
import random
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# KONFIGURASI DOMAIN
DOMAINS = [
    "https://api.komiku.org",  # Prioritas 1
    "https://komiku.org"       # Prioritas 2
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
                # Cek tanda kehidupan (konten komik)
                if soup.select('.bge') or soup.select('#Baca_Komik') or soup.select('#Daftar_Chapter') or soup.find('a', href=re.compile(r'/(manga|manhua|manhwa)/')):
                    print(f"✅ Sukses di: {domain}")
                    return soup
            print(f"⚠️ Kosong di: {domain}")
        except Exception as e:
            print(f"❌ Error {domain}: {e}")
    return None

# ==========================================
# 🖼️ IMAGE PROXY (WAJIB)
# ==========================================
@app.get("/api/image")
async def image_proxy(url: str):
    if not url or "placeholder" in url: return Response(status_code=404)
    try:
        headers = {
            "Referer": "https://komiku.org/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        # Tambahkan verifikasi SSL False jika perlu, tapi default aman
        resp = requests.get(url, headers=headers, stream=True, timeout=10)
        if resp.status_code == 200:
            return Response(content=resp.content, media_type="image/jpeg")
        return Response(status_code=404)
    except:
        return Response(status_code=500)

# ==========================================
# 🛠️ HELPER: PARSING ITEM (LIST/HOME)
# ==========================================
def parse_manga_item(item):
    try:
        # 1. Link
        link = item if item.name == 'a' else item.find('a')
        if not link: return None
        href = link.get('href')
        if not href or len(href) < 5: return None
        slug = href.strip('/').split('/')[-1]
        
        # Filter halaman sampah
        if slug in ['manga', 'manhua', 'manhwa', 'genre', 'other', 'hot', 'populer']: return None

        # 2. Gambar (LOGIKA V16: LEBIH AGRESIF CARI DATA-SRC)
        img = item.find('img')
        if not img and item.name == 'a': img = item.parent.find('img')

        image = ""
        if img:
            # Prioritaskan data-src, lalu src
            # Filter gambar placeholder transparan/kecil
            candidates = [img.get('data-src'), img.get('src')]
            for c in candidates:
                if c and "placeholder" not in c and "data:image" not in c:
                    image = c
                    break
            
            if image:
                image = image.split('?')[0]
                if image.startswith("//"): image = "https:" + image

        # Fallback jika gambar masih kosong
        if not image: image = "https://via.placeholder.com/150?text=No+Image"

        # 3. Judul
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

        # 4. Latest Chapter
        latest = ""
        latest_tag = item.find(lambda tag: tag.name in ['div', 'span'] and ('new' in str(tag.get('class','')) or 'judul2' in str(tag.get('class',''))))
        if latest_tag: latest = latest_tag.get_text(strip=True)
        else:
            txt = item.get_text(" ", strip=True)
            match = re.search(r'(Ch\.|Chapter)\s?\d+', txt)
            if match: latest = match.group(0)

        # 5. Type
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
async def root(): return {"status": "API V16 (Fix Detail & Chapter)", "docs": "/docs"}

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
    url_target = f"{base_url}?{query}" if params else base_url
    
    soup = fetch_html(url_target)
    # Fallback Genre path
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

# ==========================================
# 📖 DETAIL (V16 - FIX CHAPTER)
# ==========================================
@app.get("/api/detail/{slug}")
async def detail(slug: str):
    soup = fetch_smart(f"/manga/{slug}/")
    if not soup: return {"error": "Not Found"}
    
    try:
        # Judul
        h1 = soup.find('h1')
        title = h1.text.strip() if h1 else slug
        title = re.sub(r'(Baca|Komik|Manga|Manhwa|Manhua)\s?', '', title, flags=re.IGNORECASE).strip()
        
        # Gambar Detail
        image = ""
        img_tag = soup.select_one('.sd-img img')
        if img_tag:
            image = img_tag.get('src') or img_tag.get('data-src')
            if image: image = image.split('?')[0]
        
        # Sinopsis
        desc = soup.select_one('.desc, .sinopsis, #Sinopsis')
        synopsis = desc.get_text(strip=True) if desc else ""
        
        # Info Tambahan
        info = {}
        for row in soup.select('.inftable tr'):
            cols = row.find_all('td')
            if len(cols) == 2: info[cols[0].text.replace(':', '').strip()] = cols[1].text.strip()

        # Chapter List (V16 FIX: Logika Baru)
        chapters = []
        seen_ch = set()
        
        # Mencari tabel daftar chapter secara spesifik
        chapter_table = soup.find('table', id='Daftar_Chapter')
        if chapter_table:
            # Ambil dari baris tabel
            rows = chapter_table.find_all('tr')
            for row in rows:
                # Cari kolom judul series/chapter
                td = row.find('td', class_='judulseries')
                if td:
                    link = td.find('a')
                    if link:
                        href = link.get('href')
                        ch_slug = href.strip('/').split('/')[-1]
                        if ch_slug not in seen_ch:
                            seen_ch.add(ch_slug)
                            chapters.append({
                                "title": link.text.strip(),
                                "slug": ch_slug,
                                "date": "-" # Tanggal bisa diambil dari kolom lain jika perlu
                            })
        else:
            # Fallback metode lama jika tabel tidak ketemu
            links = soup.find_all('a', href=re.compile(r'/(ch|chapter)/'))
            for link in links:
                href = link.get('href')
                ch_slug = href.strip('/').split('/')[-1]
                if ch_slug == slug or ch_slug in seen_ch: continue
                seen_ch.add(ch_slug)
                chapters.append({"title": link.text.strip(), "slug": ch_slug, "date": "-"})

        return {
            "title": title,
            "image": image,
            "synopsis": synopsis,
            "info": info,
            "chapters": chapters
        }
    except Exception as e: return {"error": str(e)}

@app.get("/api/read/{slug}")
async def read(slug: str):
    soup = fetch_smart(f"/ch/{slug}/")
    if not soup: return {"error": "Not Found"}
    
    images = []
    container = soup.select_one('#Baca_Komik')
    if container:
        for img in container.find_all('img'):
            src = img.get('src') or img.get('data-src') or img.get('onerror')
            if src and "this.src" in src: src = src.split("'")[1]
            
            if src and src.startswith('http') and "komiku" not in src: # Filter icon sampah
                images.append(src)
                
    return {"images": images}

@app.get("/api/menu-options")
async def menu_options():
    return {
        "genres": [{"label": g.title(), "value": g} for g in ["action", "adventure", "comedy", "drama", "fantasy", "isekai", "romance", "slice-of-life"]],
        "statuses": [{"label": "Semua", "value": ""}, {"label": "Ongoing", "value": "ongoing"}, {"label": "Completed", "value": "completed"}],
        "types": [{"label": "Semua", "value": ""}, {"label": "Manga", "value": "manga"}, {"label": "Manhwa", "value": "manhwa"}, {"label": "Manhua", "value": "manhua"}],
        "orders": [{"label": "Update", "value": "update"}, {"label": "Populer", "value": "popular"}, {"label": "Baru", "value": "date"}, {"label": "Acak", "value": "acak"}]
    }