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

# KONFIGURASI
ANT_TOKEN = "007a4bf116c740fea9f1c2457e599b8f"
TARGET_URL = "https://animechina.my.id"

@app.get("/api/home")
async def get_home():
    # KUNCI: wait_for_selector memastikan data sudah muncul sebelum di-scrape
    # Kita juga set browser=true agar Cloudflare menganggap ini Chrome asli
    api_url = (
        f"https://api.scraperant.com/v2/general?"
        f"url={TARGET_URL}&"
        f"x-api-key={ANT_TOKEN}&"
        f"browser=true&"
        f"wait_for_selector=.listupd"
    )
    
    try:
        # Vercel Hobby punya limit timeout 10 detik, jadi kita harus gerak cepat
        # Jika Timeout, coba kurangi limit data yang di-scrape
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(api_url)
            
            if response.status_code != 200:
                return {
                    "status": "error", 
                    "message": f"ScraperAnt Error (Code: {response.status_code}). Cek kredit Anda."
                }
            
            soup = BeautifulSoup(response.text, 'html.parser')
            latest = []
            
            # Ambil 10 data saja agar proses parsing cepat
            items = soup.select('.listupd .bs')
            for item in items[:10]:
                title_el = item.select_one('.tt')
                img_el = item.select_one('img')
                link_el = item.select_one('a')
                
                if title_el:
                    latest.append({
                        "title": title_el.get_text(strip=True),
                        "image": img_el['src'] if img_el else "",
                        "slug": link_el['href'].replace(TARGET_URL, "").strip("/").replace("/", "__") if link_el else ""
                    })
            
            return {
                "status": "success",
                "engine": "ScraperAnt-Sniper",
                "data": latest
            }
            
    except Exception as e:
        # Jika kena timeout Vercel, kita berikan pesan yang jelas
        return {
            "status": "error", 
            "message": "Vercel Timeout. Coba refresh halaman ini dalam 5 detik."
        }