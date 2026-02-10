import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, X } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Live Search with Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
        // Update URL silently so if user refreshes, result is kept
        navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true });
      } else {
        setResults([]);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(delayDebounceFn);
  }, [query, navigate]);

  const performSearch = async (keyword) => {
    if (!keyword.trim()) return;

    setLoading(true);
    setResults([]);
    
    try {
        // --- PERBAIKAN URL DI SINI (Menambahkan / sebelum api) ---
        const response = await fetch(`https://animein.vercel.app/api/search?q=${encodeURIComponent(keyword)}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Debugging: Cek hasil di Console Browser (F12)
          console.log("API Response:", data);

          // Logika untuk menangani berbagai format respon API
          if (Array.isArray(data)) {
              setResults(data);
          } else if (data.data && Array.isArray(data.data)) {
              setResults(data.data);
          } else if (data.results && Array.isArray(data.results)) {
              setResults(data.results);
          } else {
              setResults([]);
          }
        } else {
          console.error("API Error Status:", response.status);
          setResults([]);
        }
    } catch (err) {
      console.error("Search error connection:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
      e.preventDefault();
      // Search is already handled by useEffect debounce
  };

  const handleClear = () => {
      setQuery('');
      setResults([]);
      navigate('/search');
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white pb-24 font-sans">
      
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-[#111111]/95 backdrop-blur-md border-b border-white/5 shadow-sm">
         <div className="max-w-7xl mx-auto p-4">
             <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
                 <button type="button" onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
                     <ArrowLeft size={24} />
                 </button>
                 <div className="flex-1 relative">
                     <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari anime..."
                        autoFocus
                        className="w-full bg-[#27272a] border-none rounded-xl py-2.5 pl-10 pr-10 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-violet-500 transition-all shadow-inner"
                     />
                     <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                     {query && (
                         <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                             <X size={16} />
                         </button>
                     )}
                 </div>
             </form>
         </div>
      </div>

      {/* Results Content */}
      <div className="max-w-7xl mx-auto p-4">
          {loading ? (
             // Skeleton Loading
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 {[1,2,3,4,5,6,7,8,9,10].map(i => (
                     <div key={i} className="aspect-[3/4.5] bg-zinc-800 rounded-xl animate-pulse"></div>
                 ))}
             </div>
          ) : results.length > 0 ? (
             // Result Grid
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {results.map((item, index) => (
                     <Link 
                        to={`/detail/${item.id || item.slug}`} // Fallback ID/Slug
                        key={item.id || index} 
                        className="group relative block rounded-xl overflow-hidden bg-[#18181b] border border-white/5 hover:border-violet-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10"
                     >
                         <div className="aspect-[3/4.5] overflow-hidden relative">
                             <img 
                                src={item.image_poster || item.thumb} // Fallback image key
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                             />
                             {/* Gradient Overlay */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90"></div>
                             
                             {/* Type Label */}
                             {item.type && (
                               <div className="absolute top-2 right-2 bg-violet-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm">
                                   {item.type}
                               </div>
                             )}

                             {/* Status Label */}
                             {item.status && (
                                 <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                                     {item.status}
                                 </div>
                             )}
                         </div>
                         
                         {/* Text Content */}
                         <div className="absolute bottom-0 left-0 right-0 p-3">
                             <h3 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-violet-400 transition-colors">
                                 {item.title}
                             </h3>
                             {item.rating && (
                                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                    <span className="text-yellow-500">⭐</span> {item.rating}
                                </p>
                             )}
                         </div>
                     </Link>
                 ))}
             </div>
          ) : query && !loading ? (
             <div className="flex flex-col items-center justify-center pt-20 text-gray-500">
                 <Search size={48} className="mb-4 opacity-20" />
                 <p className="text-sm font-medium">Tidak ditemukan anime untuk "{query}"</p>
                 <p className="text-xs mt-1 opacity-60">Coba kata kunci lain atau pastikan judul benar</p>
             </div>
          ) : (
             <div className="text-center pt-20">
                 <p className="text-gray-500 text-xs uppercase tracking-widest font-medium">Mulai mengetik untuk mencari...</p>
             </div>
          )}
      </div>

      <BottomNav />
    </div>
  );
};

export default SearchPage;