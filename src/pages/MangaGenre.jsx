import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Layers } from 'lucide-react';
import Layout from '../components/layout/Layout';

const MangaGenre = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [mangaList, setMangaList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const genreName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Genre';
  const API_BASE = "https://komikdebe.vercel.app";

  useEffect(() => {
    setMangaList([]); setLoading(true);
    fetchManga();
  }, [slug]);

  const fetchManga = async () => {
    try {
      // Menggunakan endpoint search untuk mencari berdasarkan genre/keyword
      const response = await fetch(`${API_BASE}/search?q=${slug}`);
      
      if (response.ok) {
        const result = await response.json();
        
        // Cek struktur array
        const list = Array.isArray(result) ? result : (result.data || []);
        setMangaList(list);
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const getSlug = (urlOrEndpoint) => {
    if (!urlOrEndpoint) return '#';
    const parts = urlOrEndpoint.split('/');
    return parts[parts.length - 1] || parts[parts.length - 2];
  };

  const getTypeColor = (type) => {
    if (!type) return 'bg-orange-500';
    if (type.toLowerCase().includes('manhwa')) return 'bg-orange-600';
    return 'bg-orange-500';
  };

  const handleImageError = (e) => {
    e.target.src = "https://placehold.co/300x450/1a1a1a/666?text=No+Image";
  };

  return (
    <Layout withBottomNav={true}>
      <div className="min-h-screen bg-[#0a0a0a] pb-24 px-4 pt-4 text-white">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowLeft size={20} /></button>
            <div>
                <h1 className="text-xl font-bold flex items-center gap-2"><Layers size={20} className="text-orange-500" /> {genreName}</h1>
                <p className="text-xs text-gray-400">Hasil pencarian: {genreName}</p>
            </div>
        </div>

        {loading ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                 {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[3/4.5] bg-[#1a1a1a] rounded-xl animate-pulse"></div>)}
             </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {mangaList.length > 0 ? (
                    mangaList.map((item, index) => (
                        <Link to={`/manga/${getSlug(item.endpoint)}`} key={index} className="group relative block rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/5 hover:border-orange-500/50 transition-all">
                            <div className="aspect-[3/4.5] overflow-hidden relative bg-gray-800">
                                <img 
                                    src={item.thumbnail || item.image}
                                    alt={item.title} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                    loading="lazy" 
                                    onError={handleImageError}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                <span className={`absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded text-white ${getTypeColor(item.type)}`}>{item.type || 'Manga'}</span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                <h3 className="text-xs font-bold line-clamp-2 text-white group-hover:text-orange-400 transition-colors">{item.title}</h3>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        Tidak ditemukan komik untuk genre ini.
                    </div>
                )}
            </div>
        )}
      </div>
    </Layout>
  );
};

export default MangaGenre;