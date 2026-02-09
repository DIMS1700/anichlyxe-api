from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright
import asyncio
import re

app = FastAPI()

# ==========================================
# 🛠️ KONFIGURASI CORS (PENTING UNTUK MIKUNIME)
# ==========================================
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
        browser = await p.chromium.launch(headless=True)
        
        # Konfigurasi Anti-Deteksi & Blokir Iklan Agresif
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            permissions=[], 
            geolocation=None,
            ignore_https_errors=True,
            viewport={'width': 1280, 'height': 720} 
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
                
                # 1. AMBIL DARI AREA DOWNLOAD
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
                        btn = page.locator(f"a:has-text('{q}'), button:has-text('{q}'), span:has-text('{q}')").first
                        
                        if await btn.count() > 0:
                            print(f"   Ditemukan! Mencoba klik {q}...")
                            
                            try:
                                await btn.evaluate("node => node.click()") 
                            except:
                                await btn.click(force=True) 
                            
                            await asyncio.sleep(2.5)
                            
                            iframe_src = await page.evaluate("document.querySelector('iframe') ? document.querySelector('iframe').src : null")
                            
                            if iframe_src:
                                print(f"   ✅ Sukses! URL: {iframe_src[:40]}...")
                                found_streams.append({
                                    "quality": q,
                                    "url": iframe_src,
                                    "type": "iframe"
                                })
                    except Exception as e:
                        print(f"   ⚠️ Error di {q}: {e}")

                # 3. IFRAME DEFAULT
                default_src = await page.evaluate("document.querySelector('iframe') ? document.querySelector('iframe').src : null")
                if default_src:
                    exists = any(s['url'] == default_src for s in found_streams)
                    if not exists:
                        found_streams.append({"quality": "360p/Auto", "url": default_src, "type": "iframe"})

                # Cleanup & Sort Data
                unique_streams = []
                seen = set()
                for s in found_streams:
                    if s['url'] not in seen:
                        seen.add(s['url'])
                        unique_streams.append(s)
                
                prio = {'1080p': 4, '720p': 3, '480p': 2, '360p': 1, '360p/Auto': 0, 'SD': 0}
                unique_streams.sort(key=lambda x: prio.get(x['quality'], 0), reverse=True)

                await browser.close()
                # ⚡ MikuNime butuh objek stream langsung tanpa pembungkus 'data'
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
# 📡 ENDPOINTS (OPTIMIZED FOR MIKUNIME)
# ==========================================

@app.get("/api/home")
async def get_home():
    script = """
    () => {
        const latest = [];
        document.querySelectorAll('a[href^="/series/"]').forEach(item => {
            const title = item.querySelector('p')?.innerText;
            const img = item.querySelector('img')?.getAttribute('data-src') || item.querySelector('img')?.src;
            if (title && img) {
                latest.push({ 
                    title: title.trim(), 
                    slug: item.href.split('/series/')[1].replace('/', ''), 
                    image: img,
                    type: 'Anime'
                });
            }
        });
        return latest; 
    }
    """
    # ⚡ Menghilangkan status:success agar MikuNime bisa memetakan Array langsung
    return await scrape_with_playwright(TARGET_DOMAIN, script)

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
                    image: img
                });
            }
        });
        return results;
    }
    """
    return await scrape_with_playwright(url, script)

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
        
        const episodes = [];
        document.querySelectorAll('a').forEach(a => {
            if(a.href.includes('/episode/')) {
                 const slug = a.href.split('/').filter(Boolean).pop();
                 episodes.push({ episode: a.innerText.trim(), slug: slug });
            }
        });
        
        return { title, image, synopsis, info, episodes };
    }
    """
    return await scrape_with_playwright(url, script)

@app.get("/api/stream/{slug}/{episode}")
async def get_stream(slug: str, episode: str):
    url = f"{TARGET_DOMAIN}/series/{slug}/episode/{episode}"
    return await scrape_with_playwright(url, is_stream=True)

@app.get("/api/genres")
async def get_genres():
    url = TARGET_DOMAIN
    script = """
    () => {
        const genres = [];
        document.querySelectorAll('a[href*="/genre/"]').forEach(link => {
            genres.push({ name: link.innerText.trim(), slug: link.href.split('/genre/')[1].replace('/', '') });
        });
        return genres;
    }
    """
    return await scrape_with_playwright(url, script)

# Endpoint tambahan tetap dipertahankan untuk kompatibilitas
@app.get("/api/schedule")
async def get_schedule():
    return { "message": "Jadwal dikelola oleh Frontend" }

@app.get("/api/library")
async def get_library(page: int = 1):
    url = f"{TARGET_DOMAIN}/series/?page={page}"
    script = "() => { return []; }" 
    return await scrape_with_playwright(url, script)