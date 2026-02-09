from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
from bs4 import BeautifulSoup

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# TOKEN AKTIF KAMU
ANT_TOKEN = "007a4bf116c740fea9f1c2457e599b8f"
TARGET_WEB = "https://animechina.my.id"

async def fetch_via_scraperant(url):
    """
    Menggunakan ScraperAnt untuk meminjam IP perumahan (Residential IP) 
    agar Cloudflare mengira kita adalah manusia asli.
    """
    # Endpoint resmi ScraperAnt dengan API Key Anda
    api_url = f"https://api.scraperant.com/v2/general?url={url}&x-api-key={ANT_TOKEN}"
    
    try:
        # Timeout ditambah menjadi 45 detik karena proxy butuh waktu untuk 'menyamar'
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.get(api_url)
            if response.status_code == 200:
                return response.text
            return None
    except Exception as e:
        print(f"Bypass Error: {e}")
        return None

@app.get("/api/home")
async def get_home():
    html = await fetch_scraperant(TARGET_WEB)
    
    if not html:
        return {"status": "error", "message": "ScraperAnt gagal menembus Cloudflare. Cek sisa kuota API Anda."}
    
    soup = BeautifulSoup(html, 'html.parser')
    latest = []
    
    # Menarik data list terbaru dari AnimeChina
    for item in soup.select('.listupd .bs'):
        title_el = item.select_one('.tt')
        link_el = item.select_one('a')
        if title_el and link_el:
            # Membuat slug aman tanpa domain
            slug = link_el['href'].replace(TARGET_WEB, "").strip("/").replace("/", "__")
            latest.append({
                "title": title_el.get_text(strip=True),
                "image": item.select_one('img')['src'] if item.select_one('img') else "",
                "slug": slug
            })
            
    return {
        "status": "success",
        "method": "VIP Proxy ScraperAnt",
        "data": latest
    }