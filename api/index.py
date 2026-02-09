from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
from bs4 import BeautifulSoup
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

async def fetch_url(url):
    # Teknik 1: Gunakan Web Proxy Service (sebagai jembatan)
    # Kita coba akses lewat 'allorigins' atau 'cors-anywhere' versi publik
    proxy_url = f"https://api.allorigins.win/get?url={url}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Kita nembak ke Proxy, bukan langsung ke webnya
            res = await client.get(proxy_url, headers=headers)
            
            if res.status_code == 200:
                # AllOrigins membungkus hasilnya dalam JSON field 'contents'
                html_content = res.json().get('contents')
                return html_content
            return None
    except Exception as e:
        print(f"Proxy Error: {e}")
        return None

@app.get("/api/home")
async def get_home():
    html = await fetch_url("https://animechina.my.id")
    
    if not html:
        return {"status": "error", "message": "Semua jalur (Direct & Proxy) diblokir."}
    
    soup = BeautifulSoup(html, 'html.parser')
    latest = []
    
    for item in soup.select('.listupd .bs')[:15]:
        title_el = item.select_one('.tt')
        if title_el:
            latest.append({
                "title": title_el.get_text(strip=True),
                "slug": item.select_one('a')['href'].replace("https://animechina.my.id/", "").strip("/") if item.select_one('a') else ""
            })
            
    return {
        "status": "success",
        "method": "Proxy Tunnel",
        "data": latest
    }