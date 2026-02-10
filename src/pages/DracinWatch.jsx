import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, SkipBack, SkipForward, AlertTriangle } from 'lucide-react';
import Layout from '../components/layout/Layout';

const DracinWatch = () => {
  const { slug, index } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [availableRes, setAvailableRes] = useState([]);
  const [currentRes, setCurrentRes] = useState('');

  // Fetch Logic
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setVideoSrc(null);

      try {
        // Fetch API
        const response = await fetch(`https://animein.vercel.appanime/drachin/episode/${slug}?index=${index}`);
        const result = await response.json();
        
        if (!isMounted) return;

        if (result.status === 'success' && result.data) {
          setData(result.data);
          
          // AMBIL VIDEO PERTAMA YANG ADA (Anti-Blank)
          const videos = result.data.videos;
          if (videos) {
            // Setup Resolusi
            const resKeys = Object.keys(videos).reverse(); // Urutan: 1080p, 720p, 540p
            setAvailableRes(resKeys);

            // Prioritas: 720p -> Pertama yg ada
            const selectedRes = resKeys.includes('720p') ? '720p' : resKeys[0];
            const url = videos[selectedRes];

            if (url) {
              console.log("Video URL Found:", url); 
              setVideoSrc(url);
              setCurrentRes(selectedRes);
            } else {
              setError("URL Video tidak ditemukan dalam respon API.");
            }
          } else {
            setError("Data video kosong dari server.");
          }
        } else {
          setError('Gagal memuat data episode.');
        }
      } catch (err) {
        if (isMounted) setError(`Network Error: ${err.message}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [slug, index]);

  // Loading View
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Error View
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white p-4 z-50">
         <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
         <h2 className="text-lg font-bold mb-2">Terjadi Kesalahan</h2>
         <p className="text-gray-400 text-center mb-6">{error}</p>
         <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
         >
            Kembali
         </button>
      </div>
    );
  }

  return (
    <Layout withBottomNav={false} fullWidth>
      <div className="min-h-screen bg-black text-white flex flex-col">
        
        {/* --- HEADER SIMPLE --- */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-b from-black to-transparent absolute top-0 left-0 right-0 z-10 pointer-events-none">
           <button 
             onClick={() => navigate(-1)} 
             className="w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center pointer-events-auto active:scale-95"
           >
             <ChevronLeft size={24} />
           </button>
           <h1 className="text-sm font-bold text-white/90 truncate shadow-black drop-shadow-md">
             {data?.title}
           </h1>
        </div>

        {/* --- VIDEO PLAYER (NATIVE) --- */}
        <div className="w-full aspect-video bg-black mt-0 md:mt-10 relative">
           {videoSrc ? (
             <video
               key={videoSrc} // Force remount kalau URL ganti
               controls // PAKE NATIVE CONTROLS DULU BIAR STABIL
               autoPlay
               playsInline
               poster={data?.poster}
               className="w-full h-full object-contain"
               onError={(e) => setError("Browser gagal memutar video ini. Coba gunakan browser lain.")}
             >
                <source src={videoSrc} type="video/mp4" />
                Browser Anda tidak mendukung tag video.
             </video>
           ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-500">
                Menyiapkan Video...
             </div>
           )}
        </div>

        {/* --- CONTROLS & INFO --- */}
        <div className="p-4 flex-1 bg-[#0a0a0a]">
            {/* Episode Navigation */}
            <div className="flex items-center justify-between bg-[#151515] p-3 rounded-xl border border-white/5 mb-6">
                <button 
                  onClick={() => navigate(`/dracin/watch/${slug}/${parseInt(index) - 1}`)}
                  disabled={parseInt(index) <= 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-xs font-bold text-gray-300 disabled:opacity-30 border border-white/5"
                >
                   <SkipBack size={14} /> Prev Ep
                </button>
                
                <div className="text-sm font-black text-red-500">
                    EPISODE {index}
                </div>

                <button 
                  onClick={() => navigate(`/dracin/watch/${slug}/${parseInt(index) + 1}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-xs font-bold text-black border border-white hover:bg-gray-200"
                >
                   Next Ep <SkipForward size={14} />
                </button>
            </div>

            {/* Info */}
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-bold text-white">{data?.title}</h2>
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">Sumber: Sankavollerei API</p>
                        
                        {/* Resolution Switcher */}
                        <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-lg border border-white/5">
                            {availableRes.map((res) => (
                                <button
                                    key={res}
                                    onClick={() => {
                                        if (data?.videos[res]) {
                                            setVideoSrc(data.videos[res]);
                                            setCurrentRes(res);
                                        }
                                    }}
                                    className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${
                                        currentRes === res 
                                        ? 'bg-red-600 text-white shadow-lg' 
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {res}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </Layout>
  );
};

export default DracinWatch;