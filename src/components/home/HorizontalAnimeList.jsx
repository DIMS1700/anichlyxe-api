import React from 'react';
import { Star, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const HorizontalAnimeList = ({ title, items, seeAllLink = "#" }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <Link to={seeAllLink} className="text-xs text-brand-blue font-medium hover:text-blue-400 transition-colors">
          Lihat Semua
        </Link>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-4 px-1 no-scrollbar snap-x snap-mandatory">
        {items.map((anime) => (
          <Link 
            to={`/detail/${anime.id}`} 
            key={anime.id} 
            className="flex-none w-[140px] snap-start group"
          >
            {/* Card Image */}
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 bg-dark-card border border-white/5">
              <img 
                src={anime.image_poster || anime.image} 
                alt={anime.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Venom Style Badge (Sticky Top Left) */}
              {(anime.status === 'ONGOING' || (anime.time && anime.time.toLowerCase().includes('new'))) && (
                 <div className="absolute top-0 left-0 bg-brand-blue z-10 px-3 py-1.5 rounded-br-2xl shadow-lg">
                   <span className="text-white text-[10px] font-extrabold tracking-wide">
                     NEW
                   </span>
                 </div>
              )}
              
              {/* Rating Badge (Sticky Top Right - Optional style or standard) */}
              {anime.score && (
                 <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-md text-brand-gold px-1.5 py-0.5 rounded text-[10px] font-bold border border-white/10">
                   <Star size={8} fill="currentColor" /> {anime.score}
                 </div>
              )}

              {/* Ep/Type Badge */}
              {anime.type && (
                <div className="absolute bottom-0 right-0 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-tl-xl text-[10px] text-white font-bold border-t border-l border-white/10 uppercase">
                  {anime.type}
                </div>
              )}
            </div>

            {/* Title & Views */}
            <h4 className="text-white font-bold text-sm truncate pr-2 group-hover:text-brand-blue transition-colors">
              {anime.title}
            </h4>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                 {anime.views ? (
                   <>
                    <Eye size={10} />
                    <span>{parseInt(anime.views).toLocaleString('id-ID')}</span>
                   </>
                 ) : (
                   <span className="text-[10px]">{anime.day || anime.year}</span>
                 )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HorizontalAnimeList;