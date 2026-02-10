import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, AlertTriangle, Play, Shield, ShieldAlert } from 'lucide-react';
import Layout from '../components/layout/Layout';

const DonghuaWatch = () => {
  const { slug } = useParams(); 
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // STATE: Pengatur Anti-Iklan (Default: Aktif)
  const [antiAdMode, setAntiAdMode] = useState(true); 

  // --- KONFIGURASI API ---
  // Ganti ke URL Vercel nanti saat sudah deploy: https://nama-app.vercel.app
  const API_BASE_URL = "http://127.0.0.1:8000"; 

  useEffect(() => {
    const fetchStream = async () => {
      try {
        setLoading(true);
        setError(null);
        setAntiAdMode(true); // Reset mode setiap ganti episode
        
        console.log("Mencoba fetch slug:", slug);

        // Panggil API Python Localhost
        const response = await fetch(`${API_BASE_URL}/api/stream/${slug}`);
        
        if (!response.ok) {
            throw new Error(`Gagal mengambil data (Status: ${response.status})`);
        }

        const result = await response.json();
        console.log("Hasil API:", result);

        if (result.status === "success" && result.data) {
          setData(result.data);
        } else {
          throw new Error(result.message || "Video tidak ditemukan.");
        }
      } catch (err) {
        console.error("Error fetching stream:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchStream();
    window.scrollTo(0, 0);
  }, [slug]);

  // Helper: Cek apakah sumber video aman (Dropbox/Daily/Youtube)
  // Jika aman, kita tidak perlu Sandbox ketat agar video tidak error.
  const isSafeSource = (url) => {
      if (!url) return false;
      return url.includes("dropbox") || url.includes("dailymotion") || url.includes("youtube") || url.includes("google");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#0a0a0a] text-white pb-10">
        
        {/* Header Sticky */}
        <div className="px-4 py-3 flex items-center gap-4 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-50 border-b border-white/5 shadow-md">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col overflow-hidden">
             <h1 className="text-sm font-bold truncate text-gray-100 pr-4">
               {loading ? "Memuat Video..." : error ? "Error" : data?.title}
             </h1>
             {!loading && !error && (
               <div className="flex items-center gap-2 text-[10px] font-medium">
                 {antiAdMode ? (
                   <span className="text-green-400 flex items-center gap-1"><Shield size={10}/> ANTI-IKLAN AKTIF</span>
                 ) : (
                   <span className="text-yellow-400 flex items-center gap-1"><ShieldAlert size={10}/> MODE KOMPATIBEL</span>
                 )}
               </div>
             )}
          </div>
        </div>

        {/* Player Area */}
        <div className="w-full aspect-video bg-black relative flex items-center justify-center border-b border-white/10 shadow-2xl shadow-orange-900/10">
          
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-orange-500" size={40} />
              <p className="text-xs text-gray-500 animate-pulse">Sedang menyiapkan video...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 text-red-400 p-6 text-center max-w-sm">
              <AlertTriangle size={48} />
              <h3 className="text-lg font-bold">Gagal Memuat Video</h3>
              <p className="text-sm text-gray-400">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-all">
                Coba Refresh
              </button>
            </div>
          ) : data?.qualities && data.qualities.length > 0 ? (
            <>
              {/* LOGIKA PLAYER CERDAS */}
              {data.qualities[0].url.includes(".mp4") && !data.qualities[0].url.includes("dropbox") ? (
                 // Player Native untuk MP4 murni
                 <video 
                    controls 
                    autoPlay 
                    className="w-full h-full"
                    src={data.qualities[0].url}
                 >
                    Browser Anda tidak mendukung tag video.
                 </video>
              ) : (
                 // Iframe Player (Dropbox, Dailymotion, Embeds)
                 <iframe
                    key={antiAdMode ? "safe" : "unsafe"} 
                    src={data.qualities[0].url} 
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    // LOGIKA SANDBOX:
                    // 1. Jika sumber aman (Dropbox/Daily), matikan sandbox agar script player jalan.
                    // 2. Jika sumber asing & Anti-Ad Aktif, nyalakan sandbox untuk blokir popup.
                    sandbox={
                        isSafeSource(data.qualities[0].url) 
                        ? undefined 
                        : (antiAdMode ? "allow-scripts allow-same-origin allow-presentation" : undefined)
                    }
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title="Video Player"
                 ></iframe>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500">Link video tidak tersedia dari sumber.</div>
          )}
        </div>

        {/* CONTROL PANEL */}
        {!loading && !error && data && (
          <div className="bg-[#111] border-b border-white/5 p-3 mb-4">
             <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div className="text-xs text-gray-400">
                  <p className="font-bold text-gray-200">Video Error / Layar Hitam?</p>
                  <p>Klik tombol di samping ini.</p>
                </div>
                <button 
                  onClick={() => setAntiAdMode(!antiAdMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    antiAdMode 
                    ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20" 
                    : "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                  }`}
                >
                  {antiAdMode ? (
                     <><ShieldAlert size={14}/> Matikan Anti-Iklan (Fix Error)</>
                  ) : (
                     <><Shield size={14}/> Nyalakan Anti-Iklan</>
                  )}
                </button>
             </div>
          </div>
        )}

        {/* Info & Navigasi */}
        {!loading && !error && data && (
          <div className="max-w-4xl mx-auto px-4">
            
            <div className="mb-6">
               <h2 className="text-lg md:text-xl font-bold text-white leading-tight mb-2">{data.title}</h2>
               <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded text-orange-300 border border-orange-500/20">
                    <Play size={10} fill="currentColor"/> Streaming
                  </span>
                  <span>{data.server_used || "Server VIP"}</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {data.nav?.prev_slug ? (
                <Link to={`/donghua/watch/${data.nav.prev_slug}`} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1e1e] border border-white/5 rounded-xl text-sm font-bold hover:bg-orange-600 transition-all">
                  <ChevronLeft size={18}/> Episode Lalu
                </Link>
              ) : <button disabled className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 rounded-xl text-sm font-bold opacity-50"><ChevronLeft size={18}/> Episode Lalu</button>}

              {data.nav?.next_slug ? (
                <Link to={`/donghua/watch/${data.nav.next_slug}`} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1e1e] border border-white/5 rounded-xl text-sm font-bold hover:bg-orange-600 transition-all">
                  Episode Lanjut <ChevronRight size={18}/>
                </Link>
              ) : <button disabled className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 rounded-xl text-sm font-bold opacity-50">Episode Lanjut <ChevronRight size={18}/></button>}
            </div>

            <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-center">
               <p className="text-xs text-yellow-200/70">
                 <span className="font-bold text-yellow-400">Tips:</span> Jika player meminta verifikasi atau loading lama, coba refresh halaman atau klik tombol "Matikan Anti-Iklan".
               </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DonghuaWatch;