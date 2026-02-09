from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
from bs4 import BeautifulSoup
import re

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
    Menggunakan ScraperAnt sebagai jembatan untuk menembus Cloudflare.
    """
    # Endpoint ScraperAnt dengan Token kamu
    api_endpoint = f"https://api.scraperant.com/v2/general?url={target_url}&x-api-key={ANT_TOKEN}"
    
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.get(api_endpoint)
            if response.status_code == 200:
                return response.text
            return None
    except Exception as e:
        print(f"Ant Error: {e}")
        return None

def make_safe_slug(url):
    try:
        clean = url.replace(BASE_TARGET, "").strip("/")
        return clean.replace("/", "__")
    except: return url

@app.get("/api/home")
async def get_home():
    html = await fetch_via_ant(BASE_TARGET)
    
    if not html:
        return {"status": "error", "message": "ScraperAnt gagal menembus target."}
    
    soup = BeautifulSoup(html, 'html.parser')
    latest = []
    
    # Menarik data dari listupd AnimeChina
    for item in soup.select('.listupd .bs'):
        title_el = item.select_one('.tt')
        link_el = item.select_one('a')
        img_el = item.select_one('img')
        
        if title_el and link_el:
            latest.append({
                "title": title_el.get_text(strip=True),
                "image": img_el['src'] if img_el else "",
                "slug": make_safe_slug(link_el['href'])
            })
            
    return {
        "status": "success",
        "method": "ScraperAnt Proxy",
        "data": latest
    }

@app.get("/api/donghua/{slug}")
async def get_detail(slug: str):
    real_path = slug.replace("__", "/")
    target = f"{BASE_TARGET}/{real_path}"
    
    html = await fetch_via_ant(target)
    if not html: return {"status": "error"}
    
    soup = BeautifulSoup(html, 'html.parser')
    
    episodes = []
    for li in soup.select('.eplister ul li'):
        a_tag = li.select_one('a')
        if a_tag:
            episodes.append({
                "episode": li.select_one('.epl-num').text.strip() if li.select_one('.epl-num') else "Ep",
                "slug": make_safe_slug(a_tag['href'])
            })
            
    return {
        "status": "success",
        "data": {
            "title": soup.select_one('.entry-title').text.strip() if soup.select_one('.entry-title') else "Donghua",
            "episodes": episodes
        }
    }