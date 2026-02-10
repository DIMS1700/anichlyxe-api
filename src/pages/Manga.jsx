import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import TopBar from '../components/home/TopBar'; // Pakai TopBar Anime (Ungu)
import { BookOpen, Search, Flame, Clock, Crown, Star, Play, TrendingUp, ChevronRight, ChevronLeft } from 'lucide-react';

const Manga = () => {
  const [popularList, setPopularList] = useState([]);
  const [latestList, setLatestList] = useState([]);
  const [recommendedList, setRecommendedList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Carousel/Slider
  const [currentSlide, setCurrentSlide] = useState(0);

  const API_BASE = "https://komikdebe.vercel.app";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [popularRes, latestRes, recommendedRes] = await Promise.all([
            fetch(`${API_BASE}/popular`),
            fetch(`${API_BASE}/latest`),
            fetch(`${API_BASE}/recommended`),
        ]);

        const popularData = await popularRes.json();
        const latestData = await latestRes.json();
        const recommendedData = await recommendedRes.json();
        
        setPopularList(Array.isArray(popularData) ? popularData : (popularData.data || []));
        setLatestList(Array.isArray(latestData) ? latestData : (latestData.data || []));
        setRecommendedList(Array.isArray(recommendedData) ? recommendedData : (recommendedData.data || []));

      } catch (err) {
        console.error("Gagal ambil data manga:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- LOGIKA AUTO SLIDER (CAROUSEL) ---
  // Ambil 5 Manga teratas untuk dijadikan slide
  const heroSlides = popularList.slice(0, 5);

  useEffect(() => {
    if (heroSlides.length === 0) return;
    // Ganti slide setiap 5 detik
    const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    }, 5000); 

    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };
  // -------------------------------------

  const getSlug = (item) => {
      if (!item) return '#';
      if (item.slug) return item.slug;
      const url = item.endpoint || item.link || item.url;
      if (!url) return '#';
      try {
          const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
          const parts = cleanUrl.split('/');
          return parts[parts.length - 1];
      } catch (e) { return '#'; }
  };

  const handleImageError = (e) => {
    e.target.src = "https://placehold.co/300x450/1a1a1a/666?text=No+Image";
  };

  const getTypeColor = (type) => {
      if (!type) return 'bg-orange-500';
      const t = type.toLowerCase();
      if (t.includes('manhwa')) return 'bg-orange-600';
      if (t.includes('manhua')) return 'bg-green-600';
      return 'bg-orange-500';
  };

  if (loading) {
    return (
      <Layout>
        <div className="px-4 pt-4">
            <TopBar />
            <div className="animate-pulse space-y-6 mt-4">
               {/* Skeleton Tinggi */}
               <div className="w-full h-[500px] bg-white/5 rounded-3xl"></div>
               <div className="flex gap-4 overflow-hidden">
                 {[1,2,3,4].map(i => <div key={i} className="w-[140px] h-[200px] bg-white/5 rounded-xl"></div>)}
               </div>
            </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pb-24 bg-[#121212] min-h-screen text-white font-sans selection:bg-orange-500/30">
        
        <div className="px-4 pt-4">
            
            {/* 1. TOP BAR */}
            <TopBar />

            {/* 2. HERO BANNER CAROUSEL (EXTRA TINGGI & AUTO SLIDE) */}
            {heroSlides.length > 0 && (
                // UPDATE HEIGHT: h-[500px] (Mobile) sampai md:h-[650px] (Desktop)
                <div className="relative w-full h-[500px] md:h-[650px] rounded-3xl overflow-hidden mb-10 mt-4 border border-white/5 shadow-2xl shadow-orange-500/5 group">
                    
                    {/* Render Semua Slide (Tapi hanya 1 yang opacity-100) */}
                    {heroSlides.map((manga, index) => (
                        <div 
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        >
                            <Link to={`/manga/${getSlug(manga)}`}>
                                <div className="absolute inset-0">
                                    <img 
                                        src={manga.thumbnail || manga.image} 
                                        className="w-full h-full object-cover object-top" // object-top agar wajah karakter terlihat
                                        alt={manga.title}
                                    />
                                    {/* Gradient Overlay Gelap agar teks terbaca */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent"></div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/60 to-transparent"></div>
                                </div>
                                
                                <div className="absolute bottom-0 left-0 p-6 sm:p-10 w-full md:w-3/4">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-600 text-white text-[10px] sm:text-xs font-bold uppercase rounded-full mb-3 shadow-lg shadow-orange-500/20 backdrop-blur-sm animate-in slide-in-from-left-5 duration-700">
                                        <Flame size={12} fill="currentColor"/> Trending #{index + 1}
                                    </span>
                                    
                                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-4 drop-shadow-2xl line-clamp-2 animate-in slide-in-from-bottom-5 duration-700 delay-100">
                                        {manga.title}
                                    </h2>
                                    
                                    <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-200 font-medium animate-in slide-in-from-bottom-5 duration-700 delay-200">
                                        <span className={`px-3 py-1 rounded-lg ${getTypeColor(manga.type)} text-white shadow-md`}>
                                            {manga.type || 'Manga'}
                                        </span>
                                        <span className="flex items-center gap-1 text-yellow-400">
                                            <Star size={14} fill="currentColor"/> {manga.rating || '4.9'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14}/> {manga.chapter || 'New'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}

                    {/* Navigation Buttons (Panah Kiri Kanan) - Muncul saat Hover */}
                    <button onClick={(e) => {e.preventDefault(); prevSlide()}} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-orange-600 transition-all opacity-0 group-hover:opacity-100">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={(e) => {e.preventDefault(); nextSlide()}} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-orange-600 transition-all opacity-0 group-hover:opacity-100">
                        <ChevronRight size={24} />
                    </button>

                    {/* Indicators (Titik-titik di bawah) */}
                    <div className="absolute bottom-6 right-6 z-20 flex gap-2">
                        {heroSlides.map((_, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-orange-500' : 'w-2 bg-white/50 hover:bg-white'}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 3. SEARCH BAR */}
            <div className="relative mb-10">
                <Link to="/manga/search" className="block w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-gray-400 flex items-center gap-3 hover:bg-white/10 transition-colors shadow-lg">
                    <Search size={20} />
                    <span>Cari Manga, Manhwa, atau Manhua...</span>
                </Link>
            </div>

            {/* 4. SEDANG HYPE */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp size={24} className="text-orange-500" /> Sedang Hype
                    </h2>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
                    {popularList.map((manga, idx) => (
                        <Link key={idx} to={`/manga/${getSlug(manga)}`} className="snap-start flex-shrink-0 w-[140px] group">
                            <div className="relative aspect-[3/4.5] rounded-xl overflow-hidden mb-3 shadow-lg">
                                <img 
                                    src={manga.thumbnail || manga.image} 
                                    alt={manga.title} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    loading="lazy"
                                    onError={handleImageError}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">
                                    #{idx + 1}
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-gray-200 line-clamp-2 leading-tight group-hover:text-orange-500 transition-colors">
                                {manga.title}
                            </h3>
                            <p className="text-[10px] text-gray-500 mt-1">{manga.chapter}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* 5. BARU RILIS */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Clock size={24} className="text-blue-500" /> Baru Rilis
                    </h2>
                    <Link to="/manga/latest" className="text-xs text-orange-500 font-bold hover:text-white transition-colors">Lihat Semua</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
                    {latestList.map((manga, idx) => (
                        <Link key={idx} to={`/manga/${getSlug(manga)}`} className="snap-start flex-shrink-0 w-[140px] group">
                            <div className="relative aspect-[3/4.5] rounded-xl overflow-hidden mb-3 shadow-lg">
                                <img 
                                    src={manga.thumbnail || manga.image} 
                                    alt={manga.title} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    loading="lazy"
                                    onError={handleImageError}
                                />
                                <div className="absolute top-2 left-2">
                                     <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded text-white shadow-sm ${getTypeColor(manga.type)}`}>
                                        {manga.type || 'MANGA'}
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-gray-200 line-clamp-2 leading-tight group-hover:text-orange-500 transition-colors">
                                {manga.title}
                            </h3>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] text-gray-500">{manga.chapter}</span>
                                <span className="text-[10px] text-orange-500 font-medium">{manga.time || 'New'}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* 6. REKOMENDASI */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Crown size={24} className="text-yellow-500" /> Rekomendasi
                    </h2>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
                    {recommendedList.map((manga, idx) => (
                        <Link key={idx} to={`/manga/${getSlug(manga)}`} className="snap-start flex-shrink-0 w-[140px] group">
                            <div className="relative aspect-[3/4.5] rounded-xl overflow-hidden mb-3 shadow-lg">
                                <img 
                                    src={manga.thumbnail || manga.image} 
                                    alt={manga.title} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    loading="lazy"
                                    onError={handleImageError}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                     <div className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold">
                                        <Star size={10} fill="currentColor"/> {manga.rating || '4.8'}
                                     </div>
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-gray-200 line-clamp-2 leading-tight group-hover:text-orange-500 transition-colors">
                                {manga.title}
                            </h3>
                            <p className="text-[10px] text-gray-500 mt-1">{manga.type || 'Manga'}</p>
                        </Link>
                    ))}
                </div>
            </div>

        </div>
        
        <div className="h-8"></div>
      </div>
    </Layout>
  );
};

export default Manga;