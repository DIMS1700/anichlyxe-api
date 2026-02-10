import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ArrowLeft, X, Loader2, AlertTriangle } from 'lucide-react';
import Layout from '../components/layout/Layout';

const DonghuaSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // DEBUG: Cek apakah komponen ini benar-benar dipanggil
  console.log("Component DonghuaSearch LOADED");

  useEffect(() => {
    const doSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // --- INI KUNCINYA: TEMBAK KE API ANICHIN KAMU SENDIRI ---
        const apiUrl = `https://anichlyxe-api.vercel.app/api/search?q=${encodeURIComponent(query)}`;
        console.log("Fetching URL:", apiUrl); // Cek URL di Console (F12)

        const res = await fetch(apiUrl);
        const result = await res.json();
        
        console.log("Hasil Data API:", result); // Lihat data asli dari Anichin

        if (result.status === "success" && result.results) {
          setResults(result.results);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Search Error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (query) doSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
        
        {/* Header Search */}
        <div className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
              <ArrowLeft size={20}/>
            </button>
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Cari DONGHUA di Anichin..." 
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-full py-3 pl-12 pr-10 text-sm focus:border-orange-500 focus:outline-none text-white"
                autoFocus
              />
              <Search className="absolute left-4 top-3.5 text-gray-400" size={18}/>
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-2.5 text-gray-500 hover:text-white">
                  <X size={18}/>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="px-4 mt-6">
          <h2 className="text-xs font-bold text-orange-400 mb-4 px-2 border-l-2 border-orange-500">
             HASIL DARI SERVER ANICHIN (Donghua Only):
          </h2>

          {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={40}/></div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map((item, index) => (
                <Link 
                  key={index} 
                  to={`/donghua/${item.slug}`} 
                  className="group relative flex flex-col gap-2"
                >
                   <div className="relative aspect-[3/4.5] rounded-xl overflow-hidden bg-gray-900 border border-white/5 shadow-md">
                      <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.title} />
                      
                      {/* Badge Episode */}
                      {item.episode && (
                        <div className="absolute top-2 left-2 bg-orange-600 text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-lg">
                          {item.episode}
                        </div>
                      )}
                      
                      {/* Badge Tipe */}
                      {item.type && (
                         <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-[9px] font-bold px-2 py-0.5 rounded text-gray-200 border border-white/10">
                            {item.type}
                         </div>
                      )}
                   </div>
                   <h4 className="text-xs font-bold text-gray-200 line-clamp-2 group-hover:text-orange-400">{item.title}</h4>
                </Link>
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-20 flex flex-col items-center gap-2 text-gray-500">
               <AlertTriangle className="text-yellow-500 mb-2" size={32}/>
               <p>Tidak ada hasil untuk "{query}"</p>
               <p className="text-xs text-gray-600">Pastikan kamu mencari judul Donghua (China), bukan Anime Jepang.</p>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-600 text-sm">
               Ketik judul donghua untuk mencari...
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DonghuaSearch;