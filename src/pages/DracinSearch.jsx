import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Search, X, Loader2, PlayCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';

const DracinSearch = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Auto focus input saat halaman dibuka
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        setHasSearched(true);
        try {
          const response = await fetch(`https://animein.vercel.appanime/drachin/search/${encodeURIComponent(query)}`);
          const json = await response.json();
          if (json.status === 'success') {
            setResults(json.data);
          } else {
            setResults([]);
          }
        } catch (error) {
          console.error("Search Error:", error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else if (query.trim().length === 0) {
        setResults([]);
        setHasSearched(false);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <Layout withBottomNav={false} fullWidth>
      <div className="min-h-screen bg-[#050505] text-white">
        
        {/* --- SEARCH HEADER --- */}
        <div className="sticky top-0 z-50 bg-[#050505] border-b border-white/5 p-4 flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-500 group-focus-within:text-red-500 transition-colors" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul drama..."
              className="w-full bg-[#151515] text-white text-sm font-medium rounded-xl py-3 pl-10 pr-10 border border-transparent focus:border-red-500/50 focus:bg-[#1a1a1a] focus:outline-none transition-all placeholder-gray-600"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="p-4">
          
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
              <p className="text-xs font-bold text-gray-500 tracking-widest uppercase">Mencari...</p>
            </div>
          )}

          {/* Empty State (Before Search) */}
          {!hasSearched && !loading && (
            <div className="flex flex-col items-center justify-center py-32 text-gray-600 opacity-50">
               <Search size={48} className="mb-4 stroke-1" />
               <p className="text-sm font-medium">Ketik judul drama di atas</p>
            </div>
          )}

          {/* No Results */}
          {hasSearched && !loading && results.length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <AlertCircle size={40} className="mb-3 text-red-900/50" />
                <p className="text-sm font-bold">Tidak ditemukan</p>
                <p className="text-xs mt-1">Coba kata kunci lain</p>
             </div>
          )}

          {/* Results Grid */}
          {!loading && results.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {results.map((item, index) => (
                <Link key={index} to={`/dracin/${item.slug}`} className="group relative block">
                   <div className="relative aspect-[3/4.2] rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/5 group-hover:border-red-500/50 transition-all">
                      <img 
                        src={item.poster} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                      
                      {/* Badge Info */}
                      <div className="absolute top-2 right-2">
                        <span className="bg-black/60 backdrop-blur text-[9px] font-bold text-white px-1.5 py-0.5 rounded border border-white/10">
                          {item.episode_info || "DRAMA"}
                        </span>
                      </div>

                      {/* Play Icon */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <PlayCircle className="w-8 h-8 text-red-500 fill-black/50" />
                      </div>
                   </div>
                   <div className="mt-2">
                      <h3 className="text-[11px] font-bold text-gray-300 line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">
                        {item.title}
                      </h3>
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

export default DracinSearch;