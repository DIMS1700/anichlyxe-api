from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
from bs4 import BeautifulSoup
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# TOKEN & TARGET
ANT_TOKEN = "007a4bf116c740fea9f1c2457e599b8f"
TARGET_URL = "https://animechina.my.id"

@app.get("/api/home")
async def get_home():
    # Jalur super cepat: No Browser, No Wait. Langsung sikat HTML-nya.
    api_url = f"https://api.scraperant.com/v2/general?url={TARGET_URL}&x-api-key={ANT_TOKEN}"
    
    try:
        # Menggunakan limit timeout yang lebih ketat agar tidak 'busy' di Vercel
        limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        async with httpx.AsyncClient(limits=limits, timeout=15.0) as client:
            response = await client.get(api_url)
            
            if response.status_code != 200:
                return {"status": "error", "message": f"Ant Status: {response.status_code}"}
            
            soup = BeautifulSoup(response.text, 'html.parser')
            latest = []
            
            # Ambil 10 data saja agar parsing ringan
            for item in soup.select('.listupd .bs')[:10]:
                title_el = item.select_one('.tt')
                if title_el:
                    latest.append({
                        "title": title_el.get_text(strip=True),
                        "image": item.select_one('img')['src'] if item.select_one('img') else ""
                    })
            
            return {
                "status": "success",
                "total": len(latest),
                "data": latest
            }
            
    except Exception as e:
        return {"status": "error", "message": f"System error: {str(e)}"}