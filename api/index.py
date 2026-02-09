from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TARGET_DOMAIN = "https://s.oploverz.ltd"

# --- HELPER: BROWSER MANAGER (TURBO MODE) ---
async def scrape_with_playwright(url: str, script: str, is_stream=False):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        # Blokir resource berat (Gambar/Font/CSS/Iklan)
        await page.route("**/*", lambda route: route.abort() 
                         if route.request.resource_type in ["image", "stylesheet", "font", "media", "ad"] 
                         else route.continue_())

        try:
            print(f"DEBUG: Mengakses {url}")
            await page.goto(url, timeout=30000, wait_until="domcontentloaded")
            
            if is_stream:
                try:
                    await page.wait_for_selector("iframe", timeout=5000)
                except:
                    pass
            
            data = await page.evaluate(script)
            await browser.close()
            return data
            
        except Exception as e:
            await browser.close()
            print(f"Error scraping: {e}")
            raise e

# --- ENDPOINT 1: HOME (TRENDING + TERBARU) ---
@app.get("/api/home")
async def get_home():
    script = """
    () => {
        const data = {
            trending: [],
            latest: []
        };

        // 1. AMBIL TRENDING (Slider Atas)
        // Biasanya slider ada di bagian atas dengan class 'swiper-slide' atau sejenisnya
        // Di Oploverz Tailwind, kita cari elemen yang punya gambar besar di atas
        const sliders = document.querySelectorAll('.swiper-slide a, div[class*="slide"] a');
        sliders.forEach(item => {
             const titleEl = item.querySelector('p, h2, h3');
             const imgEl = item.querySelector('img');
             
             if(titleEl && imgEl && item.href.includes('/series/')) {
                const link = item.href;
                const slug = link.split('/series/')[1].replace('/', '');
                
                // Cek duplikat
                if (!data.trending.some(r => r.slug === slug)) {
                    data.trending.push({
                        title: titleEl.innerText.trim(),
                        slug: slug,
                        link: link,
                        image: imgEl.src || imgEl.getAttribute('data-src') || ''
                    });
                }
             }
        });
        
        // Fallback jika slider kosong, ambil 5 item pertama dari list biasa
        const allItems = document.querySelectorAll('a[href^="/series/"]');
        
        // 2. AMBIL RILIS TERBARU (List Bawah)
        allItems.forEach(item => {
            const titleEl = item.querySelector('p');
            const imgEl = item.querySelector('img');
            
            let episode = 'Latest';
            const badges = item.querySelectorAll('div');
            badges.forEach(b => {
                const txt = b.innerText.trim();
                if(txt.length > 0 && txt.length < 5 && !isNaN(txt)) episode = txt;
            });

            if (titleEl && imgEl) {
                const link = item.href;
                const slug = link.split('/series/')[1].replace('/', '');
                const imgSrc = imgEl.src || imgEl.getAttribute('data-src') || '';

                const isDuplicate = data.latest.some(r => r.slug === slug);

                if (!isDuplicate && titleEl.innerText.length > 2) {
                    data.latest.push({
                        title: titleEl.innerText.trim(),
                        slug: slug,
                        link: link,
                        image: imgSrc,
                        episode: episode
                    });
                }
            }
        });

        // Jika trending kosong (karena selector beda), ambil 5 dari latest
        if (data.trending.length === 0) {
            data.trending = data.latest.slice(0, 5);
        }

        return data;
    }
    """
    try:
        data = await scrape_with_playwright(TARGET_DOMAIN, script)
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- ENDPOINT 2: SEARCH ---
@app.get("/api/search")
async def search_anime(query: str):
    url = f"{TARGET_DOMAIN}/?s={query}"
    script = """
    () => {
        const results = [];
        const items = document.querySelectorAll('a[href^="/series/"]');
        items.forEach(item => {
            const titleEl = item.querySelector('p');
            const imgEl = item.querySelector('img');
            if (titleEl && imgEl) {
                const link = item.href;
                const slug = link.split('/series/')[1].replace('/', '');
                results.push({
                    title: titleEl.innerText.trim(),
                    slug: slug,
                    link: link,
                    image: imgEl.src
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

# --- ENDPOINT 3: DETAIL ANIME (LENGKAP: Genre, Studio, Dll) ---
@app.get("/api/detail/{slug}")
async def get_detail(slug: str):
    target_url = f"{TARGET_DOMAIN}/series/{slug}"
    
    script = """
    () => {
        // 1. Judul
        let title = 'Unknown Title';
        const possibleTitles = document.querySelectorAll('h1, .text-3xl, .text-2xl');
        for (let el of possibleTitles) {
            if (el.innerText.length > 5) {
                title = el.innerText.trim();
                break;
            }
        }

        // 2. Poster
        let poster = '';
        const posterCandidates = document.querySelectorAll('img.object-cover, img.rounded-xl, img.shadow-lg');
        for (let img of posterCandidates) {
            if (img.src && !img.src.includes('favicons') && !img.src.includes('user') && img.src.length > 20) {
                poster = img.src;
                break; 
            }
        }
        if (!poster) {
             const allImgs = document.querySelectorAll('img');
             for (let img of allImgs) {
                if (img.src.includes('posters')) { poster = img.src; break; }
             }
        }

        // 3. Sinopsis
        const ps = document.querySelectorAll('p');
        let synopsis = 'No synopsis available.';
        let maxLen = 0;
        ps.forEach(p => {
            if (p.innerText.length > maxLen) {
                maxLen = p.innerText.length;
                synopsis = p.innerText.trim();
            }
        });

        // 4. INFO DETAIL (Genre, Studio, Status, Tahun)
        // Oploverz biasanya menaruh info ini di list atau div terpisah
        const info = {
            genres: [],
            status: 'Unknown',
            studio: 'Unknown',
            year: 'Unknown'
        };

        // Cari link genre (biasanya href-nya ada /genre/)
        const genreLinks = document.querySelectorAll('a[href*="/genre/"]');
        genreLinks.forEach(a => {
            info.genres.push(a.innerText.trim());
        });

        // Cari info text (Status, Studio)
        // Strategi: Cari elemen yang mengandung text "Status:", "Studio:", dll
        const allTextElements = document.querySelectorAll('span, div, p, li');
        allTextElements.forEach(el => {
            const txt = el.innerText;
            if (txt.includes('Status:')) info.status = txt.replace('Status:', '').trim();
            if (txt.includes('Studio:')) info.studio = txt.replace('Studio:', '').trim();
            if (txt.includes('Rilis:') || txt.includes('Released:')) info.year = txt.replace(/Rilis:|Released:/g, '').trim();
        });

        // 5. Episodes
        const episodes = [];
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            const href = link.href;
            if (href.includes('/episode/') && href.includes(window.location.hostname)) {
                const parts = href.split('/');
                let epNum = parts.filter(p => !isNaN(p) && p !== '').pop();
                if (!epNum && href.includes('episode')) epNum = href.split('episode')[1].replace(/[^0-9]/g, '');

                if (epNum) {
                    episodes.push({
                        episode: "Episode " + epNum,
                        slug: epNum,
                        link: href
                    });
                }
            }
        });

        const uniqueEps = [];
        const seen = new Set();
        episodes.forEach(ep => {
            if(!seen.has(ep.slug)){
                seen.add(ep.slug);
                uniqueEps.push(ep);
            }
        });
        uniqueEps.sort((a, b) => parseInt(a.slug) - parseInt(b.slug));

        return {
            title: title,
            image: poster,
            synopsis: synopsis,
            info: info, // Tambahan Info Lengkap
            episodes: uniqueEps
        };
    }
    """
    try:
        data = await scrape_with_playwright(target_url, script)
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- ENDPOINT 4: STREAM ---
@app.get("/api/stream/{slug}/{episode}")
async def get_stream(slug: str, episode: str):
    url = f"{TARGET_DOMAIN}/series/{slug}/episode/{episode}"
    script = """
    () => {
        const streams = [];
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const src = iframe.src;
            if (src && !src.includes('chat') && !src.includes('ads') && !src.includes('disqus')) {
                streams.push({ resolution: "Auto (HD/SD)", url: src });
            }
        });
        return { title: document.title, streams: streams };
    }
    """
    try:
        data = await scrape_with_playwright(url, script, is_stream=True)
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- ENDPOINT 5: DAFTAR ANIME (LIBRARY) ---
@app.get("/api/library")
async def get_library(page: int = 1):
    # Oploverz library page: /anime/page/2/ atau /series/?page=2
    # Kita coba URL standar list anime
    url = f"{TARGET_DOMAIN}/series/?page={page}"
    if page == 1:
        url = f"{TARGET_DOMAIN}/series/" # Halaman 1 biasanya tanpa query
        
    script = """
    () => {
        const results = [];
        const items = document.querySelectorAll('a[href^="/series/"]');
        items.forEach(item => {
            const titleEl = item.querySelector('p');
            const imgEl = item.querySelector('img');
            if (titleEl && imgEl) {
                const link = item.href;
                const slug = link.split('/series/')[1].replace('/', '');
                results.push({
                    title: titleEl.innerText.trim(),
                    slug: slug,
                    link: link,
                    image: imgEl.src
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

# --- ENDPOINT 6: JADWAL RILIS (SCHEDULE) ---
@app.get("/api/schedule")
async def get_schedule():
    # URL Jadwal: https://s.oploverz.ltd/jadwal-rilis/
    url = f"{TARGET_DOMAIN}/jadwal-rilis/"
    
    script = """
    () => {
        const schedule = {};
        // Biasanya jadwal pakai tabel atau list per hari
        // Kita cari elemen header hari (Senin, Selasa, dst)
        const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        
        // Logic Brutal: Ambil semua teks halaman, parsing manual (karena struktur jadwal sering aneh)
        // TAPI, kita coba cari selector umum dulu.
        
        const containers = document.querySelectorAll('div.flex-col, div.grid'); 
        
        // Placeholder data (Jaga-jaga kalau scraping gagal)
        // Karena jadwal rilis butuh selector yang SANGAT spesifik per tema website.
        // Kita return pesan dulu agar Frontend tidak crash
        
        return {
            message: "Fitur jadwal membutuhkan penyesuaian selector manual sesuai tampilan web."
        };
    }
    """
    try:
        data = await scrape_with_playwright(url, script)
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- ENDPOINT 7: GENRES ---
@app.get("/api/genres")
async def get_genres():
    # Biasanya ada di sidebar atau footer
    url = TARGET_DOMAIN
    script = """
    () => {
        const genres = [];
        const links = document.querySelectorAll('a[href*="/genre/"]');
        links.forEach(link => {
            const name = link.innerText.trim();
            const slug = link.href.split('/genre/')[1].replace('/', '');
            if(name && slug) {
                genres.push({ name: name, slug: slug, link: link.href });
            }
        });
        
        // Hapus duplikat
        const unique = [];
        const seen = new Set();
        genres.forEach(g => {
            if(!seen.has(g.slug)){
                seen.add(g.slug);
                unique.push(g);
            }
        });
        return unique;
    }
    """
    try:
        data = await scrape_with_playwright(url, script)
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}