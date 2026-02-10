import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Search, ArrowLeft, BookOpen } from 'lucide-react';

const MangaSearch = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState(query || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = "https://komikdebe.vercel.app";

  useEffect(() => {
    if (query) {
      setSearchTerm(query);
      handleSearch(query);
    }
  }, [query]);

  const handleSearch = async (keyword) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/search?q=${keyword}`);
      const data = await response.json();
      setResults(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/manga/search?q=${searchTerm}`);
    }
  };

  const getSlug = (url) => {
      if (!url) return '#';
      try {
          const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
          return cleanUrl.split('/').pop();
      } catch (e) { return '#'; }
  };

  return (
    <Layout withBottomNav={true}>
      <div className="min-h-screen bg-[#121212] pb-24 text-white">
        
        {/* Header Search */}
        <div className="sticky top-0 z-50 bg-[#121212]/95 backdrop-blur-md border-b border-white/5 p-4">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/manga')} className="p-2 -ml-2 rounded-full hover:bg-white/10">
                    <ArrowLeft size={20} />
                </button>
                <form onSubmit={onSearchSubmit} className="flex-1 relative">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari judul komik..."
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                        autoFocus
                    />
                    <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                </form>
            </div>
        </div>

        {/* Content */}
        <div className="p-4">
            {loading ? (
                <div className="grid grid-cols-3 gap-3 animate-pulse">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[3/4.5] bg-white/5 rounded-xl"></div>)}
                </div>
            ) : results.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {results.map((manga, idx) => (
                        <Link key={idx} to={`/manga/${getSlug(manga.endpoint || manga.link)}`} className="group">
                            <div className="aspect-[3/4.5] rounded-xl overflow-hidden relative mb-2">
                                <img 
                                    src={manga.thumbnail || manga.image} 
                                    alt={manga.title} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => e.target.src = "https://placehold.co/300x450/222/666?text=No+Image"}
                                />
                                <div className="absolute top-2 left-2 bg-orange-600 text-[8px] font-bold px-1.5 py-0.5 rounded text-white">
                                    {manga.type || 'MANGA'}
                                </div>
                            </div>
                            <h3 className="text-xs font-bold line-clamp-2 group-hover:text-orange-500 transition-colors">
                                {manga.title}
                            </h3>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center pt-20 text-gray-500">
                    <BookOpen size={40} className="mb-2 opacity-50" />
                    <p className="text-sm">Tidak ada hasil ditemukan.</p>
                </div>
            )}
        </div>

      </div>
    </Layout>
  );
};

export default MangaSearch;