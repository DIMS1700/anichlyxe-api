from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright
import asyncio
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TARGET_DOMAIN = "https://s.oploverz.ltd"

# ==========================================
# 🤖 HELPER: ROBOT PENGENDALI BROWSER
# ==========================================
async def scrape_with_playwright(url: str, script: str = None, is_stream=False):
    async with async_playwright() as p:
        # PENTING: Set headless=True untuk deploy.
        # Set headless=False kalau mau lihat browsernya (Debug).
        browser = await p.chromium.launch(headless=True)
        
        # Konfigurasi Anti-Deteksi & Blokir Iklan Agresif
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            permissions=[], 
            geolocation=None,
            ignore_https_errors=True,
            viewport={'width': 1280, 'height': 720} # Paksa ukuran layar desktop
        )
        
        # Paksa tolak notifikasi
        await context.grant_permissions([], origin=url)
        page = await context.new_page()
        
        # Blokir resource sampah biar cepat
        await page.route("**/*", lambda route: route.abort() 
                         if route.request.resource_type in ["image", "stylesheet", "font", "ad", "other"] 
                         else route.continue_())

        try:
            print(f"DEBUG: Mengakses {url}")
            await page.goto(url, timeout=90000, wait_until="domcontentloaded")
            
            # ---------------------------------------------------------
            # 🔥 LOGIKA STREAMING (GOD MODE CLICK)
            # ---------------------------------------------------------
            if is_stream:
                print("DEBUG: Mencari tombol kualitas...")
                
                # Scroll sedikit
                await page.evaluate("window.scrollBy(0, 400)")
                await asyncio.sleep(1)

                found_streams = []
                
                # 1. AMBIL DARI AREA DOWNLOAD (Jurus Paling Ampuh)
                # Oploverz biasanya taruh link Google Drive/Acefile di sini
                dl_links = await page.evaluate("""
                    () => {
                        const links = [];
                        document.querySelectorAll('.soradd-dl a').forEach(a => {
                            const txt = (a.innerText || a.textContent || '').trim();
                            const href = a.href;
                            
                            if(href && !href.includes('zippyshare') && !href.includes('javascript')) {
                                let q = 'SD';
                                if(txt.includes('1080')) q = '1080p';
                                else if(txt.includes('720')) q = '720p';
                                else if(txt.includes('480')) q = '480p';
                                
                                // Hanya ambil jika ada indikasi kualitas
                                if (txt.match(/1080|720|480/)) {
                                    links.push({ quality: q, url: href, type: 'download', label: txt });
                                }
                            }
                        });
                        return links;
                    }
                """)
                found_streams.extend(dl_links)

                # 2. KLIK TOMBOL PLAYER (Dengan Fallback JS Click)
                qualities = ["1080p", "720p", "480p", "360p"]
                
                for q in qualities:
                    try:
                        print(f"👉 Mencari tombol '{q}'...")
                        
                        # Selector yang lebih spesifik ke BUTTON atau A (Jangan Div sembarangan)
                        # Kita cari elemen yang mengandung teks kualitas
                        btn = page.locator(f"a:has-text('{q}'), button:has-text('{q}'), span:has-text('{q}')").first
                        
                        if await btn.count() > 0:
                            print(f"   Ditemukan! Mencoba klik {q}...")
                            
                            # JURUS TANGAN TUHAN: JS CLICK
                            # Ini bypass "Element is not visible" karena dia klik langsung di kode, bukan pake mouse virtual
                            try:
                                await btn.evaluate("node => node.click()") # <--- INI KUNCINYA
                            except:
                                await btn.click(force=True) # Fallback ke klik kasar
                            
                            # Tunggu reaksi player
                            await asyncio.sleep(2.5)
                            
                            # Curi URL Iframe
                            iframe_src = await page.evaluate("document.querySelector('iframe') ? document.querySelector('iframe').src : null")
                            
                            if iframe_src:
                                print(f"   ✅ Sukses! URL: {iframe_src[:40]}...")
                                found_streams.append({
                                    "quality": q,
                                    "url": iframe_src,
                                    "type": "iframe"
                                })
                        else:
                            pass # Tidak ketemu, skip
                            
                    except Exception as e:
                        print(f"   ⚠️ Error di {q}: {e}")

                # 3. IFRAME DEFAULT (Cadangan Mati)
                default_src = await page.evaluate("document.querySelector('iframe') ? document.querySelector('iframe').src : null")
                if default_src:
                    exists = any(s['url'] == default_src for s in found_streams)
                    if not exists:
                        found_streams.append({"quality": "360p/Auto", "url": default_src, "type": "iframe"})

                # Cleanup Data
                unique_streams = []
                seen = set()
                for s in found_streams:
                    if s['url'] not in seen:
                        seen.add(s['url'])
                        unique_streams.append(s)
                
                # Sortir Prioritas
                prio = {'1080p': 4, '720p': 3, '480p': 2, '360p': 1, '360p/Auto': 0, 'SD': 0}
                unique_streams.sort(key=lambda x: prio.get(x['quality'], 0), reverse=True)

                await browser.close()
                return { "title": "Stream Result", "streams": unique_streams }

            # ---------------------------------------------------------
            # LOGIKA NON-STREAM
            # ---------------------------------------------------------
            data = await page.evaluate(script)
            await browser.close()
            return data
            
        except Exception as e:
            await browser.close()
            print(f"Error scraping: {e}")
            raise e


# ==========================================
# 📡 ENDPOINTS
# ==========================================

# 1. HOME
@app.get("/api/home")
async def get_home():
    script = """
    () => {
        const data = { trending: [], latest: [] };
        document.querySelectorAll('.swiper-slide a, div[class*="slide"] a').forEach(item => {
             const title = item.querySelector('p, h2, h3')?.innerText;
             const img = item.querySelector('img')?.src || item.querySelector('img')?.getAttribute('data-src');
             if(title && img && item.href.includes('/series/')) {
                data.trending.push({ 
                    title: title.trim(), 
                    slug: item.href.split('/series/')[1].replace('/', ''), 
                    image: img 
                });
             }
        });
        document.querySelectorAll('a[href^="/series/"]').forEach(item => {
            const title = item.querySelector('p')?.innerText;
            const img = item.querySelector('img')?.src || item.querySelector('img')?.getAttribute('data-src');
            if (title && img) {
                data.latest.push({ 
                    title: title.trim(), 
                    slug: item.href.split('/series/')[1].replace('/', ''), 
                    image: img, 
                    episode: 'Latest' 
                });
            }
        });
        if(data.trending.length===0) data.trending = data.latest.slice(0,5);
        return data;
    }
    """
    try:
        data = await scrape_with_playwright(TARGET_DOMAIN, script)
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 2. SEARCH
@app.get("/api/search")
async def search_anime(query: str):
    url = f"{TARGET_DOMAIN}/?s={query}"
    script = """
    () => {
        const results = [];
        document.querySelectorAll('a[href^="/series/"]').forEach(item => {
            const title = item.querySelector('p')?.innerText;
            const img = item.querySelector('img')?.src;
            if (title && img) {
                results.push({
                    title: title.trim(),
                    slug: item.href.split('/series/')[1].replace('/', ''),
                    link: item.href,
                    image: img
                });
            }
        });
        return results;
    }
    """
    try:
        data = await scrape_with_playwright(url, script)
        return {"status": "success", "query": query, "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 3. DETAIL
@app.get("/api/detail/{slug}")
async def get_detail(slug: str):
    url = f"{TARGET_DOMAIN}/series/{slug}"
    script = """
    () => {
        const title = document.querySelector('h1')?.innerText.trim() || 'Unknown';
        const image = document.querySelector('img.object-cover, img.rounded-xl')?.src || '';
        const synopsis = document.querySelector('p')?.innerText || '';
        
        const info = { genres: [], status: '-', studio: '-', year: '-' };
        document.querySelectorAll('a[href*="/genre/"]').forEach(a => info.genres.push(a.innerText.trim()));
        
        const text = document.body.innerText;
        if(text.includes('Status:')) info.status = text.split('Status:')[1].split('\\n')[0].trim();
        if(text.includes('Studio:')) info.studio = text.split('Studio:')[1].split('\\n')[0].trim();
        
        const episodes = [];
        document.querySelectorAll('a').forEach(a => {
            if(a.href.includes('/episode/') && a.href.includes(window.location.hostname)) {
                 const slug = a.href.split('/').filter(p=>!isNaN(p)).pop() || a.href.split('episode')[1].replace(/[^0-9]/g, '');
                 episodes.push({ episode: a.innerText.trim(), slug: slug, link: a.href });
            }
        });
        
        const unique = [];
        const seen = new Set();
        episodes.forEach(e => {
            if(!seen.has(e.slug)) { seen.add(e.slug); unique.push(e); }
        });
        unique.sort((a,b) => parseInt(a.slug) - parseInt(b.slug));

        return { title, image, synopsis, info, episodes: unique };
    }
    """
    try:
        data = await scrape_with_playwright(url, script)
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 4. STREAM
@app.get("/api/stream/{slug}/{episode}")
async def get_stream(slug: str, episode: str):
    url = f"{TARGET_DOMAIN}/series/{slug}/episode/{episode}"
    try:
        data = await scrape_with_playwright(url, script=None, is_stream=True)
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 5. LIBRARY
@app.get("/api/library")
async def get_library(page: int = 1):
    url = f"{TARGET_DOMAIN}/series/?page={page}" if page > 1 else f"{TARGET_DOMAIN}/series/"
    script = """
    () => {
        const results = [];
        document.querySelectorAll('a[href^="/series/"]').forEach(item => {
            const title = item.querySelector('p')?.innerText;
            const img = item.querySelector('img')?.src;
            if (title && img) {
                results.push({
                    title: title.trim(),
                    slug: item.href.split('/series/')[1].replace('/', ''),
                    image: img
                });
            }
        });
        return results;
    }
    """
    try:
        data = await scrape_with_playwright(url, script)
        return {"status": "success", "page": page, "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 6. SCHEDULE
@app.get("/api/schedule")
async def get_schedule():
    url = f"{TARGET_DOMAIN}/jadwal-rilis/"
    script = """
    () => { return { message: "Jadwal diambil dari Frontend (AnimeIN)" }; }
    """
    try:
        data = await scrape_with_playwright(url, script)
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 7. GENRES
@app.get("/api/genres")
async def get_genres():
    url = TARGET_DOMAIN
    script = """
    () => {
        const genres = [];
        document.querySelectorAll('a[href*="/genre/"]').forEach(link => {
            genres.push({ name: link.innerText.trim(), slug: link.href.split('/genre/')[1].replace('/', ''), link: link.href });
        });
        const unique = [];
        const seen = new Set();
        genres.forEach(g => { if(!seen.has(g.slug)){ seen.add(g.slug); unique.push(g); } });
        return unique;
    }
    """
    try:
        data = await scrape_with_playwright(url, script)
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}