import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { AlertTriangle, PlayCircle, Loader2, Calendar, Flame, Search, X, Info, ShieldAlert, Copy, Check } from 'lucide-react';

const Hentai = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("episode"); // episode | series
  const [isSearching, setIsSearching] = useState(false);
  const [dnsCopied, setDnsCopied] = useState(false);

  const handleCopyDNS = () => {
    navigator.clipboard.writeText("dns.adguard.com");
    setDnsCopied(true);
    setTimeout(() => setDnsCopied(false), 2000);
  };
  
  // Genre State
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);

  // Initial Fetch (Home & Genres)
  const fetchHome = async () => {
    setLoading(true);

    const CACHE_KEY = 'hentai_home_cache';
    const CACHE_DURATION = 30 * 60 * 1000; // 30 menit

    // Cek Cache
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { timestamp, home, genres: cachedGenres } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_DURATION) {
        setVideos(home);
        setGenres(cachedGenres);
        setLoading(false);
        return; // Pakai cache, skip fetch
      }
    }

    try {
      const [homeRes, genreRes] = await Promise.all([
          fetch('https://animein.vercel.appapi/home'),
          fetch('https://animein.vercel.appapi/genres')
      ]);
      
      const homeData = await homeRes.json();
      const genreData = await genreRes.json();
      
      setVideos(homeData);
      setGenres(genreData);
      
      // Simpan ke Cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        home: homeData,
        genres: genreData
      }));

      setIsSearching(false);
      setSelectedGenre(null);
    } catch (error) {
      console.error("Gagal mengambil data hentai:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHome();
  }, []);

  // Search Handler
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setIsSearching(true);
    setSelectedGenre(null); // Reset genre if searching
    try {
        const response = await fetch(`https://animein.vercel.appapi/search?q=${searchQuery}&type=${searchType}`);
        const data = await response.json();
        setVideos(data);
    } catch (error) {
        console.error("Gagal mencari:", error);
    } finally {
        setLoading(false);
    }
  };

  // Genre Handler
  const handleGenreClick = async (slug) => {
      if (selectedGenre === slug) {
          // Deselect (Back to Home)
          handleClear();
          return;
      }

      setLoading(true);
      setSelectedGenre(slug);
      setIsSearching(false);
      setSearchQuery(""); // Reset search
      
      try {
          const response = await fetch(`https://animein.vercel.appapi/genres/${slug}`);
          const data = await response.json();
          setVideos(data);
      } catch (error) {
          console.error("Gagal mengambil genre:", error);
      } finally {
          setLoading(false);
      }
  };

  // Clear Handler
  const handleClear = () => {
      setSearchQuery("");
      setSelectedGenre(null);
      setIsSearching(false);
      
      // Re-fetch home ONLY if not already there (optimization optional, but simple logic here)
      setLoading(true);
      fetch('https://animein.vercel.appapi/home')
        .then(res => res.json())
        .then(data => setVideos(data))
        .finally(() => setLoading(false));
  };

  return (
    <Layout>
      <div className="pb-24 space-y-5">
        
        {/* Header Warning & Admin Note */}
        <div className="mx-2 mt-4 space-y-2">
            {/* 18+ Warning */}
            <div className="bg-red-900/10 border border-red-500/10 rounded-xl p-3 flex items-start gap-3">
                <div className="p-1.5 bg-red-500/10 rounded-full text-red-500 flex-shrink-0">
                    <AlertTriangle size={16} />
                </div>
                <div>
                    <h1 className="text-sm font-bold text-red-400">Area Dewasa 18+</h1>
                    <p className="text-[10px] text-red-200/60 leading-tight mt-0.5">
                        Khusus Premium 18+. Bijaklah dalam menonton.
                    </p>
                </div>
            </div>

            {/* DNS Instruction Block */}
            <div className="bg-yellow-900/10 border border-yellow-500/10 rounded-xl p-3">
                <h3 className="text-xs font-bold text-yellow-500 mb-2 flex items-center gap-2">
                    <ShieldAlert size={14} /> PENTING: Wajib Pakai DNS!
                </h3>
                <p className="text-[10px] text-gray-300 leading-relaxed mb-3 text-justify">
                    Sebelum nonton, <span className="text-yellow-200 font-bold">WAJIB</span> nyalain DNS Pribadi biar lancar. Caranya: Masuk Pengaturan HP &rarr; Cari "DNS Pribadi" &rarr; Pilih "Nama Host Penyedia" (tiap HP beda nama) &rarr; Masukan DNS di bawah ini:
                </p>
                
                <button 
                    onClick={handleCopyDNS}
                    className="w-full bg-black/40 border border-yellow-500/20 rounded-lg p-2 flex items-center justify-between group active:scale-95 transition-all mb-2"
                >
                    <code className="text-xs font-mono text-yellow-200">dns.adguard.com</code>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 rounded-md text-[10px] text-yellow-500 font-bold border border-yellow-500/20">
                       {dnsCopied ? <Check size={12} /> : <Copy size={12} />}
                       {dnsCopied ? "Disalin!" : "Salin"}
                    </div>
                </button>

                <p className="text-[10px] text-gray-400 italic">
                    *Kalo udah selesai nonton (atau udah crot muani), jangan lupa matiin lagi DNS-nya ya! 😹
                </p>
            </div>

            {/* Admin Note (Bilingual) */}
            <div className="bg-blue-900/10 border border-blue-500/10 rounded-xl p-3">
                <h3 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-2">
                    <Info size={14} /> Catatan Admin / Admin Note
                </h3>
                
                <div className="space-y-2">
                    {/* ID */}
                    <div className="pl-2 border-l-2 border-blue-500/30">
                        <p className="text-[10px] text-gray-300 leading-relaxed text-justify">
                            <span className="font-bold text-blue-300">ID:</span> Jika foto anime tidak muncul, jangan khawatir. Itu karena domain gambar sensitif terblokir provider, tapi video tetap bisa ditonton. Jika ada error, hubungi admin. 
                            <br/><span className="text-red-400 font-bold">*Note:</span> Fitur "Anime by Genre" & "Search Series" mungkin ada error karena Admin belum sempat fix (Admin butuh tidur 😴). Sekian terima kasih.
                        </p>
                    </div>

                    {/* EN */}
                    <div className="pl-2 border-l-2 border-blue-500/30">
                        <p className="text-[10px] text-gray-400 leading-relaxed text-justify italic">
                            <span className="font-bold text-blue-300">EN:</span> If thumbnails are broken, don't worry. It's due to sensitive domain blocking, but videos remain playable. Contact admin for errors.
                            <br/><span className="text-red-400 font-bold">*Note:</span> "Anime by Genre" & "Search Series" might be buggy as Admin needs sleep 😴. Thanks for understanding.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* SEARCH BAR & FILTER */}
        <div className="px-2 space-y-3">
            <form onSubmit={handleSearch} className="relative">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari asupan malam..." 
                    className="w-full bg-[#18181b] border border-white/5 text-white text-sm rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:border-red-500/50 transition-colors"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                
                {(isSearching || searchQuery || selectedGenre) ? (
                    <button 
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X size={14} className="text-white" />
                    </button>
                ) : null}
            </form>

            <div className="flex gap-2">
                <button 
                    onClick={() => setSearchType("episode")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        searchType === "episode" 
                        ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' 
                        : 'bg-[#18181b] border-white/10 text-gray-400 hover:text-white'
                    }`}
                >
                    Episode
                </button>
                <button 
                    onClick={() => setSearchType("series")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        searchType === "series" 
                        ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' 
                        : 'bg-[#18181b] border-white/10 text-gray-400 hover:text-white'
                    }`}
                >
                    Series (Batch)
                </button>
            </div>
        </div>

        {/* GENRE LIST (Horizontal Scroll) */}
        {genres.length > 0 && (
            <div className="px-2">
                <h3 className="text-xs font-bold text-gray-400 mb-2 ml-1">Jelajahi Genre</h3>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {genres.map((genre, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleGenreClick(genre.slug)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                selectedGenre === genre.slug
                                ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20 scale-105'
                                : 'bg-[#18181b] border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                            }`}
                        >
                            {genre.title}
                            <span className="ml-1.5 opacity-50 text-[8px] bg-black/20 px-1 rounded">{genre.count}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* SECTION: CONTENT GRID */}
        <div>
            <div className="flex items-center gap-2 mb-4 px-2">
                {isSearching ? (
                    <>
                        <Search size={18} className="text-white" />
                        <h2 className="text-lg font-bold text-white">Hasil: {searchType === 'series' ? 'Series' : 'Episode'}</h2>
                    </>
                ) : selectedGenre ? (
                    <>
                        <Flame size={18} className="text-red-500 fill-red-500" />
                        <h2 className="text-lg font-bold text-white">Genre: {genres.find(g => g.slug === selectedGenre)?.title || 'Selected'}</h2>
                    </>
                ) : (
                    <>
                        <Flame size={18} className="text-red-500 fill-red-500" />
                        <h2 className="text-lg font-bold text-white">Update Terbaru 🔥</h2>
                    </>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-3 gap-3 px-2">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="aspect-[3/4] bg-zinc-800 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : videos.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 px-2">
                    {videos.map((item, index) => {
                        const isSeries = item.type === "Series" || searchType === "series";
                        const showEpisode = !isSeries && item.episode && item.episode !== "Nill";

                        return (
                        <Link 
                            key={index}
                            to={`/hentai/detail/${item.slug}`}
                            className="relative rounded-xl overflow-hidden group shadow-lg shadow-black/50 aspect-[3/4] block"
                        >
                            <img 
                                src={item.thumbnail} 
                                alt={item.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                            />
                            
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90"></div>
                            
                            {/* Top Badges */}
                            <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                                {/* Badge Kiri: Episode atau Series */}
                                {showEpisode ? (
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded text-white bg-red-600 shadow-sm">
                                        {item.episode.replace('Ep. ', 'EP ')}
                                    </span>
                                ) : (
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded text-white bg-blue-600 shadow-sm">
                                        SERIES
                                    </span>
                                )}

                                {/* Badge Kanan: Tahun */}
                                {item.year && (
                                    <span className="bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-white border border-white/10 flex items-center gap-1">
                                        <Calendar size={8} /> {item.year}
                                    </span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                <h3 className="text-xs font-bold text-white line-clamp-2 leading-tight mb-1 group-hover:text-red-400 transition-colors drop-shadow-md">
                                    {item.title}
                                </h3>
                            </div>
                        </Link>
                    )})}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500">
                    <p className="text-sm">Tidak ditemukan.</p>
                </div>
            )}
        </div>

      </div>
    </Layout>
  );
};

export default Hentai;

