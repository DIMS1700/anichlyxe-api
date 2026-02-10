import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Download as DownloadIcon, Star, Tv, CheckCircle, Search, AlertCircle, ChevronLeft, ChevronRight, Server, Info } from 'lucide-react';

const Download = () => {
  const [data, setData] = useState([]);
  const [source, setSource] = useState('samehadaku'); // 'samehadaku' | 'kusonime'
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State untuk pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSearch, setTempSearch] = useState(''); // Untuk input text

  // Reset page dan search saat ganti source
  useEffect(() => {
    setPage(1);
    setSearchQuery('');
    setTempSearch('');
  }, [source]);

  // Handle Search
  const handleSearch = (e) => {
      e.preventDefault();
      setSearchQuery(tempSearch);
      setPage(1); // Reset ke halaman 1 saat mencari
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = '';
        
        if (source === 'samehadaku') {
            url = `https://animein.vercel.appanime/samehadaku/batch?page=${page}`;
        } else {
            // Kusonime Logic
            if (searchQuery) {
                url = `https://animein.vercel.appanime/kusonime/search/${searchQuery}?page=${page}`;
            } else {
                url = `https://animein.vercel.appanime/kusonime/latest?page=${page}`;
            }
        }
            
        const response = await fetch(url);
        if (!response.ok) throw new Error('Gagal mengambil data');
        
        const result = await response.json();
        
        // Normalisasi data agar seragam
        if (source === 'samehadaku') {
            setData(result.data.batchList || []);
        } else {
            // Kusonime (Search returns same structure as latest: anime_list)
            setData(result.anime_list || []);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    fetchData();
  }, [page, source, searchQuery]);

  const handleNextPage = () => setPage(prev => prev + 1);
  const handlePrevPage = () => { if (page > 1) setPage(prev => prev - 1); };

  return (
    <Layout>
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="mb-6">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <DownloadIcon className="text-blue-500" size={24} />
              Batch Anime
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Download paket lengkap anime subtitle Indonesia
            </p>
        </div>

        {/* Source Selector */}
        <div className="mb-4 flex p-1 bg-zinc-900 rounded-lg w-full max-w-sm border border-zinc-800">
            <button 
                onClick={() => setSource('samehadaku')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${
                    source === 'samehadaku' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
            >
                <Server size={14} /> Samehadaku
            </button>
            <button 
                onClick={() => setSource('kusonime')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${
                    source === 'kusonime' 
                    ? 'bg-orange-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
            >
                <Server size={14} /> Kusonime
            </button>
        </div>

        {/* Catatan Info */}
        <div className="mb-4 bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 flex gap-3 items-start">
            <Info className="text-blue-400 shrink-0 mt-0.5" size={16} />
            <div className="text-xs text-blue-200">
                <p className="font-bold mb-0.5">Catatan Penting:</p>
                <p className="opacity-80">Fitur pencarian batch saat ini <span className="text-white font-bold underline">hanya tersedia untuk server Kusonime</span>. Untuk Samehadaku, silakan cari manual di daftar terbaru.</p>
            </div>
        </div>

        {/* Search Bar (Kusonime Only) */}
        {source === 'kusonime' && (
            <div className="mb-6">
                <form onSubmit={handleSearch} className="relative">
                    <input 
                        type="text" 
                        value={tempSearch}
                        onChange={(e) => setTempSearch(e.target.value)}
                        placeholder="Cari anime di Kusonime..." 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <button 
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-800 hover:bg-orange-600 text-white p-1.5 rounded-lg transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </form>
            </div>
        )}

        {/* Content */}
        {loading ? (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                 <div className="aspect-[3/4] bg-zinc-800 rounded-xl animate-pulse"></div>
                 <div className="h-4 bg-zinc-800 rounded w-3/4 animate-pulse"></div>
                 <div className="h-3 bg-zinc-800 rounded w-1/2 animate-pulse"></div>
              </div>
            ))}
           </div>
        ) : error ? (
           <div className="min-h-[40vh] flex flex-col items-center justify-center text-center text-gray-400">
             <AlertCircle size={48} className="mb-4 text-red-500" />
             <p className="mb-4">Gagal memuat data.</p>
             <button 
               onClick={() => window.location.reload()}
               className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700"
             >
               Coba Lagi
             </button>
           </div>
        ) : (
           <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {data.length > 0 ? (
                    data.map((item, index) => {
                        // Normalisasi field berdasarkan source
                        const isSamehadaku = source === 'samehadaku';
                        const id = isSamehadaku ? item.batchId : item.slug;
                        const title = item.title.replace(' [BATCH]', '').replace(' Subtitle Indonesia', '');
                        const poster = item.poster;
                        const score = isSamehadaku ? item.score : null;
                        const status = isSamehadaku ? item.status : 'Batch';
                        const type = isSamehadaku ? item.type : 'TV';
                        
                        const detailLink = `/download/batch/${id}${!isSamehadaku ? '?source=kusonime' : ''}`;

                        return (
                            <Link 
                                key={index}
                                to={detailLink}
                                className="group relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800/50 hover:border-blue-500/50 transition-all flex flex-col"
                            >
                                <div className="aspect-[3/4] overflow-hidden relative">
                                    <img 
                                        src={poster} 
                                        alt={title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                                    
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-600/90 backdrop-blur-sm rounded text-[10px] font-bold text-white shadow-lg flex items-center gap-1">
                                        <CheckCircle size={10} />
                                        {status}
                                    </div>

                                    {score && (
                                        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-yellow-400 font-bold">
                                            <Star size={10} fill="currentColor" />
                                            <span>{score}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors mb-1">
                                            {title}
                                        </h3>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(isSamehadaku ? item.genreList : item.genres)?.slice(0, 2).map((g, i) => (
                                                <span key={i} className="text-[9px] text-gray-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                                                    {isSamehadaku ? g.title : g.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                                        <span className="flex items-center gap-1"><Tv size={10} /> {type}</span>
                                        <span className={`px-1.5 py-0.5 rounded font-medium ${isSamehadaku ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                            {isSamehadaku ? 'SMH' : 'KSO'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        Tidak ada hasil ditemukan.
                    </div>
                )}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-center gap-4">
                 <button 
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${
                        page === 1 
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                        : 'bg-zinc-800 text-white hover:bg-blue-600'
                    }`}
                 >
                     <ChevronLeft size={18} /> Prev
                 </button>

                 <span className="text-sm font-bold text-gray-400">
                     Halaman {page}
                 </span>

                 <button 
                    onClick={handleNextPage}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-full font-bold hover:bg-blue-600 transition-all"
                 >
                     Next <ChevronRight size={18} />
                 </button>
              </div>
           </>
        )}
      </div>
    </Layout>
  );
};

export default Download;