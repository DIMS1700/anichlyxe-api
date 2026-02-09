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

# DATA TOKEN KAMU
ANT_TOKEN = "007a4bf116c740fea9f1c2457e599b8f"
TARGET_URL = "https://animechina.my.id"

@app.get("/api/home")
async def get_home():
    # Gunakan ScraperAnt tanpa &browser=true dulu agar CEPAT (menghindari Error 500)
    # Tapi kita tambahkan &proxy_type=residential agar tetap kuat tembus Cloudflare
    api_url = f"https://api.scraperant.com/v2/general?url={TARGET_URL}&x-api-key={ANT_TOKEN}&proxy_type=residential"
    
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.get(api_url)
            
            if response.status_code != 200:
                return {
                    "status": "error", 
                    "message": f"ScraperAnt menolak dengan kode {response.status_code}. Cek kuota/token."
                }
            
            soup = BeautifulSoup(response.text, 'html.parser')
            latest = []
            
            # Ambil data sederhana: Judul dan Gambar
            for item in soup.select('.listupd .bs')[:12]:
                title = item.select_one('.tt').get_text(strip=True) if item.select_one('.tt') else "No Title"
                img = item.select_one('img')['src'] if item.select_one('img') else ""
                latest.append({"title": title, "image": img})
            
            return {
                "status": "success",
                "total": len(latest),
                "data": latest
            }
            
    except Exception as e:
        return {"status": "error", "message": f"Timeout atau Error: {str(e)}"}