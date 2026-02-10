import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { ArrowLeft, PlayCircle, Calendar, Tag, Share2, Info, Film, Loader2 } from 'lucide-react';

const HentaiDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`https://animein.vercel.appapi/detail/${slug}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Gagal mengambil detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#111111] text-white">
            <Loader2 size={40} className="animate-spin text-red-500 mb-4" />
            <p className="text-sm font-bold text-gray-500">Memuat info...</p>
        </div>
    );
  }

  if (!data) return null;

  return (
      <div className="min-h-screen bg-[#111111] text-white font-sans pb-10">
        
        {/* Header / Hero Section */}
        <div className="relative h-[300px] w-full overflow-hidden">
            {/* Background Blur */}
            <div 
                className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                style={{ backgroundImage: `url(${data.thumbnail})` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/60 to-transparent"></div>
            
            {/* Back Button */}
            <button 
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/10 transition-colors z-20"
            >
                <ArrowLeft size={20} />
            </button>
        </div>

        {/* Content Container */}
        <div className="px-4 -mt-32 relative z-10">
            <div className="flex flex-col items-center">
                {/* Poster */}
                <div className="w-40 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl shadow-red-500/20 border-2 border-white/10 mb-4">
                    <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover" />
                </div>

                {/* Title */}
                <h1 className="text-xl font-black text-center text-white leading-tight mb-2">
                    {data.title}
                </h1>

                {/* Genres */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {data.genres?.map((genre, idx) => (
                        <span key={idx} className="text-[10px] font-bold px-2 py-1 bg-white/5 border border-white/5 rounded-full text-gray-300">
                            {genre}
                        </span>
                    ))}
                </div>

                {/* Action Button */}
                <Link 
                    to={`/hentai/watch/${slug}`}
                    className="w-full max-w-sm bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all active:scale-95 mb-8"
                >
                    <PlayCircle size={20} fill="currentColor" />
                    <span>Nonton Sekarang</span>
                </Link>

                {/* Synopsis */}
                <div className="w-full bg-[#18181b] border border-white/5 rounded-2xl p-5 mb-6">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <Info size={16} className="text-red-500" />
                        Sinopsis
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed text-justify">
                        {data.synopsis}
                    </p>
                </div>

                {/* Episode List (Jika Ada) */}
                {data.episode_list && data.episode_list.length > 0 && (
                    <div className="w-full">
                        <h3 className="text-sm font-bold text-white mb-3 px-1 flex items-center gap-2">
                            <Film size={16} className="text-red-500" />
                            Episode Lainnya
                        </h3>
                        <div className="space-y-2">
                            {data.episode_list.map((ep, idx) => (
                                <Link 
                                    key={idx}
                                    to={`/hentai/watch/${ep.slug}`}
                                    className="flex items-center justify-between bg-[#18181b] border border-white/5 p-3 rounded-xl hover:bg-white/5 hover:border-red-500/30 transition-all group"
                                >
                                    <div className="flex-1 min-w-0 pr-3">
                                        <p className="text-xs font-bold text-gray-300 group-hover:text-red-400 transition-colors line-clamp-1">
                                            {ep.title}
                                        </p>
                                    </div>
                                    {ep.info && (
                                        <span className="text-[9px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 flex-shrink-0">
                                            {ep.info}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
      </div>
  );
};

export default HentaiDetail;
