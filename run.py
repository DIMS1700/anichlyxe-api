import uvicorn
import asyncio
import sys
from api.index import app  # Import app dari folder api

if __name__ == "__main__":
    # SOLUSI WINDOWS:
    # Memaksa Windows menggunakan ProactorEventLoop supaya Playwright jalan
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    # Jalankan server lewat script ini
    print("🚀 MENJALANKAN SERVER DENGAN FIX WINDOWS LOOP...")
    uvicorn.run(app, host="127.0.0.1", port=8000)