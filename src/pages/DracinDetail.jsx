import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, Share2, Info, Star, Calendar, Hash, LayoutGrid, List, Bookmark, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';

const DracinDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://animein.vercel.appanime/drachin/detail/${slug}`);
        const result = await response.json();
        if (result.status === 'success') {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching Dracin detail:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <Layout withBottomNav={false}>
         <div className="min-h-screen bg-[#0a0a0a] animate-pulse">
            <div className="w-full h-[50vh] bg-zinc-900/50"></div>
            <div className="px-5 -mt-20 relative z-10 space-y-4">
               <div className="flex gap-4 items-end">
                   <div className="w-28 h-40 bg-zinc-800 rounded-xl shadow-lg shrink-0"></div>
                   <div className="space-y-2 w-full">
                       <div className="w-3/4 h-6 bg-zinc-800 rounded"></div>
                       <div className="w-1/2 h-4 bg-zinc-800 rounded"></div>
                   </div>
               </div>
               <div className="w-full h-12 bg-zinc-800 rounded-xl mt-4"></div>
            </div>
         </div>
      </Layout>
    );
  }

  if (!data) return null;

  return (
    <Layout withBottomNav={false} fullWidth>
      <div className="min-h-screen bg-[#0a0a0a] font-sans overflow-hidden">
        
        {/* Navigation Bar */}
        <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4 flex justify-between items-center">
           <button 
             onClick={() => navigate(-1)} 
             className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-red-600 hover:border-red-500 transition-all active:scale-95"
           >
             <ChevronLeft size={22} />
           </button>
           <button 
             className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-red-600 hover:border-red-500 transition-all active:scale-95"
           >
             <Share2 size={18} />
           </button>
        </div>

        {/* Cinematic Hero Section */}
        <div className="relative w-full h-[550px]">
          {/* Blurry Background */}
          <div className="absolute inset-0">
             <img src={data.poster} alt="" className="w-full h-full object-cover opacity-60 blur-3xl scale-110" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-black/30"></div>
             <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent"></div>
          </div>

          {/* Main Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-8 z-20 flex flex-col items-center text-center">
             
             {/* Floating Poster */}
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               transition={{ duration: 0.5 }}
               className="mb-6 relative group"
             >
                <div className="w-[160px] aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.7)] border border-white/10 relative z-10">
                   <img src={data.poster} alt={data.title} className="w-full h-full object-cover" />
                </div>
                {/* Glow Effect behind poster */}
                <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20 -z-10 group-hover:opacity-40 transition-opacity duration-500"></div>
             </motion.div>

             {/* Title & Metadata */}
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="w-full max-w-lg"
             >
                <h1 className="text-2xl md:text-3xl font-black text-white leading-snug mb-3 drop-shadow-xl">
                  {data.title.replace(/ EP \d+$/, '')}
                </h1>
                
                <div className="flex flex-wrap justify-center gap-3 text-xs font-medium text-gray-300 mb-6">
                   <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                      <LayoutGrid size={13} className="text-red-500" />
                      <span>{data.total_episodes || '?'} Episode</span>
                   </div>
                   <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                      <Star size={13} className="text-yellow-500 fill-yellow-500" />
                      <span>4.8 Rating</span>
                   </div>
                   <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                      <span className="text-red-400 font-bold">HD</span>
                   </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {data.tags && data.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 w-full">
                    <Link 
                      to={`/dracin/watch/${data.episodes[0]?.slug}/1`}
                      className="flex-1 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 active:scale-95 transition-all"
                    >
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <Play size={12} fill="black" className="text-black ml-0.5" />
                      </div>
                      Mulai Nonton
                    </Link>
                    
                    <button 
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:bg-white/10 hover:text-red-500 hover:border-red-500/30 transition-all active:scale-95"
                    >
                      <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} className={isBookmarked ? "text-red-500" : ""} />
                    </button>
                </div>
             </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-10 px-5 pb-10 max-w-3xl mx-auto -mt-2">
            
            {/* Synopsis */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="mb-8 p-4 rounded-2xl bg-[#121212] border border-white/5 shadow-inner"
            >
               <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
                 <Info size={14} className="text-red-500" /> Sinopsis Cerita
               </h3>
               <div className={`relative overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[500px]' : 'max-h-20'}`}>
                  <p className="text-sm leading-relaxed text-gray-300 font-light">
                    {data.synopsis}
                  </p>
                  {!isExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#121212] to-transparent"></div>
                  )}
               </div>
               <button 
                 onClick={() => setIsExpanded(!isExpanded)}
                 className="mt-3 text-[11px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 mx-auto"
               >
                 {isExpanded ? 'Tutup Sinopsis' : 'Baca Selengkapnya'}
               </button>
            </motion.div>

            {/* Episode Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-10"
            >
              <div className="flex items-center justify-between mb-4 px-1">
                 <h3 className="text-base font-bold text-white flex items-center gap-2">
                   Episode
                 </h3>
                 <span className="text-[10px] text-gray-500 font-medium border border-white/10 px-2 py-1 rounded-full">
                    Total {data.episodes.length}
                 </span>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                 {data.episodes.map((ep, i) => (
                   <Link 
                     key={ep.index}
                     to={`/dracin/watch/${ep.slug}/${ep.index}`}
                     className="relative aspect-square rounded-lg bg-[#1a1a1a] border border-white/5 flex flex-col items-center justify-center group overflow-hidden hover:border-red-500/50 transition-all active:scale-95"
                   >
                     {/* Hover Glow */}
                     <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/10 transition-colors duration-300"></div>
                     
                     <span className="text-xs font-bold text-gray-400 group-hover:text-white z-10 transition-colors">
                        {ep.index}
                     </span>
                   </Link>
                 ))}
              </div>
            </motion.div>

            {/* Recommendations */}
            {data.recommendations && data.recommendations.length > 0 && (
              <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.4 }}
                 className="pt-6 border-t border-white/5"
              >
                 <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest pl-1">
                   Rekomendasi Serupa
                 </h3>
                 <div className="flex overflow-x-auto gap-4 pb-4 -mx-5 px-5 no-scrollbar">
                    {data.recommendations.map((item, idx) => (
                       <Link 
                         key={idx} 
                         to={`/dracin/${item.slug}`}
                         className="min-w-[140px] w-[140px] group relative"
                       >
                         <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#1a1a1a] mb-3 relative shadow-lg">
                            <img 
                              src={item.poster} 
                              alt={item.title} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-600/90 backdrop-blur rounded-md text-[9px] text-white font-bold shadow-lg">
                               {item.episode_info.split(' ')[0]} Ep
                            </div>
                         </div>
                         <h4 className="text-xs font-bold text-gray-300 line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">
                           {item.title}
                         </h4>
                       </Link>
                    ))}
                 </div>
              </motion.div>
            )}
        </div>

      </div>
    </Layout>
  );
};

export default DracinDetail;
