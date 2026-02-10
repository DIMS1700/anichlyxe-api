import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, PlayCircle, Calendar, AlertTriangle } from 'lucide-react';
import Layout from '../components/layout/Layout';

const Donghua = () => {
  const [donghuaList, setDonghuaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- KONFIGURASI API ---
  // Gunakan Localhost (127.0.0.1:8000) untuk tes.
  // Nanti kalau sudah deploy python ke Vercel, ganti url ini.
  const API_BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    const fetchDonghua = async () => {
      try {
        setLoading(true);
        // Panggil endpoint /api/home dari Python Localhost
        const response = await fetch(`${API_BASE_URL}/api/home`);
        
        if (!response.ok) {
             throw new Error("Gagal menghubungkan ke Server API");
        }

        const result = await response.json();
        
        if (result.status === "success") {
          // Ambil data 'latest_release' dari API DonghuaFilm
          setDonghuaList(result.latest_release || []); 
        }
      } catch (error) {
        console.error("Gagal ambil data:", error);
        setError("Gagal memuat data terbaru. Pastikan server Python nyala.");
      } finally {
        setLoading(false);
      }
    };
    fetchDonghua();
  }, []);

  const SkeletonCard = () => (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="aspect-[3/4.5] bg-gray-800/50 rounded-xl w-full"></div>
      <div className="h-4 bg-gray-800/50 rounded w-3/4"></div>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-[#0a0a0a] to-black pb-24 text-white">
        
        {/* Header */}
        <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              DONGHUA<span className="text-orange-500">ZONE</span>
            </h1>
          </div>
          <Link 
            to="/search" 
            className="p-2.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full hover:bg-orange-500/20 transition-all"
          >
            <Search size={20} />
          </Link>
        </div>

        {/* Content */}
        <div className="px-4 mt-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-orange-600 rounded-lg shadow-lg shadow-orange-600/30">
              <Calendar size={16} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Update Episode Terbaru</h3>
          </div>

          {error && (
             <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center mb-6">
                <AlertTriangle className="inline-block mr-2" size={16}/> {error}
             </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
              {donghuaList.map((item, index) => (
                <Link 
                  // PENTING: Sesuaikan path ini dengan router kamu (biasanya /donghua/watch/slug)
                  to={`/donghua/watch/${item.slug}`} 
                  key={index} 
                  className="group relative flex flex-col gap-3"
                >
                  <div className="relative aspect-[3/4.5] rounded-xl overflow-hidden bg-gray-900 border border-white/5 shadow-lg group-hover:shadow-orange-900/20 transition-all">
                    <img 
                      src={item.image} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      alt={item.title} 
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-1 bg-orange-600 shadow-lg rounded-md text-[10px] font-bold text-white">
                      {item.episode || "Baru"}
                    </div>
                    {item.type && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[9px] font-bold text-gray-300 border border-white/10">
                            {item.type}
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                      <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                        <PlayCircle size={24} className="text-white fill-white" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-[13px] font-bold text-gray-100 line-clamp-2 leading-snug group-hover:text-orange-400 transition-colors">
                      {item.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Donghua;