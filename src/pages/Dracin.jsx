import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Clock, TrendingUp, PlayCircle, Star, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';

const Dracin = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ slider: [], latest: [], popular: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('latest');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll Listener
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto Slider
  useEffect(() => {
    if (data.slider.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % data.slider.length);
      }, 6000); // 6 detik per slide
      return () => clearInterval(interval);
    }
  }, [data.slider]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      const CACHE_KEY = 'dracin_home_v3_cache';
      const CACHE_DURATION = 30 * 60 * 1000;

      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setData(cachedData);
            setLoading(false);
            return;
          }
        } catch (e) { localStorage.removeItem(CACHE_KEY); }
      }

      try {
        const response = await fetch('https://animein.vercel.appanime/drachin/home');
        const result = await response.json();
        if (result.status === 'success') {
          setData(result.data);
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: result.data,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeData = activeTab === 'latest' ? data.latest : data.popular;

  // Loading Skeleton
  if (loading) {
    return (
      <Layout fullWidth>
        <div className="min-h-screen bg-[#050505] animate-pulse">
           <div className="h-[55vh] bg-gray-900 w-full relative">
              <div className="absolute bottom-0 left-0 w-full p-6 space-y-3">
                 <div className="h-6 w-24 bg-gray-800 rounded"></div>
                 <div className="h-10 w-3/4 bg-gray-800 rounded"></div>
              </div>
           </div>
           <div className="p-4 grid grid-cols-3 gap-3">
             {[...Array(9)].map((_, i) => (
               <div key={i} className="aspect-[3/4] bg-gray-900 rounded-xl"></div>
             ))}
           </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullWidth>
      <div className="min-h-screen bg-[#050505] text-white pb-24 selection:bg-red-500/30">
        
        {/* --- HEADER --- */}
        <div 
          className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
            isScrolled 
              ? 'bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 py-3 shadow-2xl' 
              : 'bg-gradient-to-b from-black/80 to-transparent py-4'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-gray-200"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <h1 className="text-lg font-black tracking-tighter flex items-center gap-1">
              DRACIN<span className="text-red-600">ID</span>
            </h1>

            <Link to="/dracin/search" className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-gray-200">
              <Search className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* --- CINEMATIC HERO SLIDER --- */}
        {data.slider.length > 0 && (
          <div className="relative w-full h-[65vh] md:h-[75vh] overflow-hidden group">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <img 
                  src={data.slider[currentSlide].poster} 
                  alt="Hero"
                  className="w-full h-full object-cover"
                />
                
                {/* Advanced Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#050505]/80 opacity-60" />
              </motion.div>
            </AnimatePresence>

            {/* Hero Content */}
            <div className="absolute bottom-0 left-0 w-full p-6 pb-12 z-20 flex flex-col justify-end h-full">
              <div className="max-w-7xl mx-auto w-full">
                <motion.div
                  key={`info-${currentSlide}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                   {/* Badges */}
                   <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg shadow-red-900/50 uppercase tracking-wider">
                         {data.slider[currentSlide].episode_info || "TOP HITS"}
                      </span>
                      <span className="bg-white/10 backdrop-blur-md text-gray-200 text-[10px] font-bold px-2 py-1 rounded border border-white/10 flex items-center gap-1">
                         <Star size={10} className="text-yellow-400 fill-yellow-400" /> 4.9
                      </span>
                   </div>

                   {/* Title */}
                   <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.1] mb-4 drop-shadow-2xl line-clamp-2 max-w-2xl">
                     {data.slider[currentSlide].title}
                   </h2>

                   {/* Actions */}
                   <div className="flex items-center gap-3">
                      <Link 
                        to={`/dracin/${data.slider[currentSlide].slug}`}
                        className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
                      >
                         <PlayCircle size={18} fill="black" /> Tonton
                      </Link>
                      <button className="bg-white/10 backdrop-blur-md text-white px-4 py-3 rounded-xl font-bold text-sm border border-white/10 hover:bg-white/20 transition-colors active:scale-95">
                         <Info size={18} />
                      </button>
                   </div>
                </motion.div>
              </div>
            </div>

            {/* Slide Indicators */}
            <div className="absolute bottom-4 right-4 z-30 flex gap-1.5">
              {data.slider.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-6 bg-red-600' : 'w-2 bg-white/30'}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* --- MAIN CONTENT --- */}
        <div className="max-w-7xl mx-auto px-4 relative z-20 -mt-2">
          
          {/* Tabs Switcher */}
          <div className="flex items-center justify-between mb-6 sticky top-[60px] z-40 bg-[#050505]/80 backdrop-blur-lg py-3 -mx-4 px-4 border-b border-white/5">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Kategori</h3>
             
             <div className="flex p-1 bg-white/5 border border-white/5 rounded-xl relative w-full sm:w-auto">
               <motion.div 
                 layoutId="activeTab"
                 className={`absolute inset-y-1 ${activeTab === 'latest' ? 'left-1 w-[calc(50%-4px)]' : 'right-1 w-[calc(50%-4px)]'} bg-gradient-to-br from-red-600 to-red-800 rounded-lg shadow-lg shadow-red-900/30`}
                 transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
               />
               
               <button 
                 onClick={() => setActiveTab('latest')}
                 className={`relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'latest' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
               >
                 <Clock className="w-3.5 h-3.5" />
                 TERBARU
               </button>
               <button 
                 onClick={() => setActiveTab('popular')}
                 className={`relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'popular' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
               >
                 <TrendingUp className="w-3.5 h-3.5" />
                 POPULER
               </button>
            </div>
          </div>

          {/* Grid Layout */}
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-5"
          >
            {activeData.map((item, index) => (
              <Link key={index} to={`/dracin/${item.slug}`} className="group relative block">
                {/* Card Container */}
                <div className="relative aspect-[3/4.2] rounded-xl overflow-hidden bg-[#1a1a1a] shadow-lg ring-1 ring-white/5 group-hover:ring-red-500/50 transition-all duration-300">
                  <img 
                    src={item.poster} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                    loading="lazy"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  <div className="absolute top-2 right-2">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-sm group-hover:bg-red-600 group-hover:border-red-500 transition-colors">
                      {item.episode_info || "DRAMA"}
                    </div>
                  </div>

                  {/* Play Icon on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100">
                    <PlayCircle className="w-10 h-10 text-red-600 fill-black/50" />
                  </div>
                </div>

                {/* Title Info */}
                <div className="mt-3 px-1">
                  <h3 className="text-[11px] sm:text-xs font-bold text-gray-200 leading-tight line-clamp-2 group-hover:text-red-500 transition-colors">
                    {item.title}
                  </h3>
                </div>
              </Link>
            ))}
          </motion.div>
          
          {activeData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
               <Info className="w-12 h-12 mb-4 opacity-50" />
               <p className="text-sm font-medium">Tidak ada data.</p>
            </div>
          )}

          {/* Footer Simple */}
          <div className="mt-12 pt-8 border-t border-white/5 text-center pb-8">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
               DracinID &bull; LyxeNime Project
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dracin;