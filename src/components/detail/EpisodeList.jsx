import React, { useState } from 'react';
import { ArrowDownUp, Search, Play } from 'lucide-react';

const EpisodeList = ({ episodes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isReverse, setIsReverse] = useState(false);
  const [progressMap, setProgressMap] = useState({});

  if (!episodes || episodes.length === 0) return null;

  // Filter & Sort Logic
  const filteredEpisodes = episodes.filter(ep => 
    ep.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedEpisodes = isReverse ? [...filteredEpisodes].reverse() : filteredEpisodes;

  // Load progress
  React.useEffect(() => {
      const newProgressMap = {};
      sortedEpisodes.forEach(ep => {
          const savedPct = localStorage.getItem(`vid_pct_${ep.id}`);
          if (savedPct) newProgressMap[ep.id] = parseInt(savedPct);
      });
      setProgressMap(newProgressMap);
  }, [sortedEpisodes]);

  // NUCLEAR NAVIGATION
  const handleNavigate = (url) => {
      window.location.assign(url);
  };

  return (
    <div id="episode-list" className="bg-[#0a0a0a] min-h-[500px] mt-2 pb-24 border-t border-white/5">
      
      {/* Sticky Header Flat */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-md px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Episodes ({episodes.length})</h2>
            <button 
                onClick={() => setIsReverse(!isReverse)}
                className="flex items-center gap-1 text-xs font-bold text-gray-400 bg-white/5 px-3 py-1.5 rounded-full hover:bg-white/10"
            >
                <ArrowDownUp size={14} /> Sortir
            </button>
        </div>

        <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
                type="text" 
                placeholder="Cari episode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#161618] border-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:ring-1 focus:ring-violet-500"
            />
        </div>
      </div>

      {/* Flat List */}
      <div className="flex flex-col">
        {sortedEpisodes.map((ep, idx) => {
            const progress = progressMap[ep.id] || 0;
            const isFinished = progress > 90;

            return (
              <div 
                key={ep.id}
                onClick={() => handleNavigate(`/watch/${ep.id}`)}
                className="flex items-center gap-4 px-5 py-4 border-b border-white/5 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
              >
                 {/* Index */}
                 <span className="text-sm font-bold text-gray-600 w-6 text-center">
                    {isReverse ? episodes.length - idx : idx + 1}
                 </span>

                 {/* Thumbnail Wide */}
                 <div className="relative w-32 aspect-video bg-zinc-900 rounded overflow-hidden flex-shrink-0">
                     <img 
                        src={ep.image?.startsWith('http') ? ep.image : `https://xyz-api.animein.net${ep.image}`}
                        alt={ep.title}
                        className="w-full h-full object-cover opacity-80"
                        loading="lazy"
                     />
                     {/* Overlay Play */}
                     <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center border border-white/20">
                            <Play size={12} fill="white" className="text-white ml-0.5" />
                         </div>
                     </div>
                     {/* Progress Bar */}
                     {progress > 0 && (
                         <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-800">
                             <div 
                                className={`h-full ${isFinished ? 'bg-green-500' : 'bg-red-600'}`} 
                                style={{ width: `${progress}%` }}
                             />
                         </div>
                     )}
                 </div>

                 {/* Info */}
                 <div className="flex-1 min-w-0">
                     <h3 className={`text-sm font-bold leading-tight mb-1 line-clamp-2 ${isFinished ? 'text-gray-500' : 'text-gray-200'}`}>
                        {ep.title}
                     </h3>
                     <p className="text-xs text-gray-500">
                        {ep.key_time || 'Baru Rilis'}
                     </p>
                 </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default EpisodeList;