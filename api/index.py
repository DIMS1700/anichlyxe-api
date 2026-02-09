from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
from bs4 import BeautifulSoup

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TOKEN MILIK KAMU
ANT_TOKEN = "007a4bf116c740fea9f1c2457e599b8f"
BASE_TARGET = "https://animechina.my.id"

async def fetch_via_ant(target_url):
    """
    Menggunakan ScraperAnt dengan Browser Rendering (browser=true).
    Ini lebih lambat tapi jauh lebih ampuh tembus Cloudflare.
    """
    # Menambahkan &browser=true dan &proxy_type=residential (jalur VIP)
    api_endpoint = f"https://api.scraperant.com/v2/general?url={target_url}&x-api-key={ANT_TOKEN}&browser=true"
    
    try:
        # Timeout ditambah ke 60 detik karena render browser butuh waktu lama
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(api_endpoint)
            if response.status_code == 200:
                return response.text
            else:
                print(f"DEBUG: Status Code {response.status_code}")
                return None
    except Exception as e:
        print(f"DEBUG: Error {str(e)}")
        return None

@app.get("/api/home")
async def get_home():
    html = await fetch_via_ant(BASE_TARGET)
    
    if not html:
        return {
            "status": "error", 
            "message": "ScraperAnt gagal merender halaman. Cek apakah token sudah benar."
        }
    
    soup = BeautifulSoup(html, 'html.parser')
    latest = []
    
    # Mencari data Donghua terbaru
    for item in soup.select('.listupd .bs'):
        title_el = item.select_one('.tt')
        link_el = item.select_one('a')
        if title_el and link_el:
            latest.append({
                "title": title_el.get_text(strip=True),
                "image": item.select_one('img')['src'] if item.select_one('img') else "",
                "slug": link_el['href'].replace(BASE_TARGET, "").strip("/").replace("/", "__")
            })
            
    return {
        "status": "success",
        "info": "Data via ScraperAnt Browser",
        "data": latest
    }