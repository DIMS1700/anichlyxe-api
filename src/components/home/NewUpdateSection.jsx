import React from 'react';
import { Star, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const updates = [
  {
    id: 1,
    title: "Arne no Jikenbo",
    rating: "4.8",
    ep: "12",
    views: "12k",
    isNew: true,
    color: "from-red-500 to-violet-500"
  },
  {
    id: 2,
    title: "Darwin Jihen",
    rating: "4.6",
    ep: "8",
    views: "9.2k",
    isNew: true,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: 3,
    title: "Yuusha Party",
    rating: "4.5",
    ep: "24",
    views: "34k",
    isNew: false,
    color: "from-violet-500 to-pink-500"
  },
  {
    id: 4,
    title: "Solo Leveling",
    rating: "4.9",
    ep: "12",
    views: "102k",
    isNew: false,
    color: "from-green-500 to-emerald-500"
  }
];

const NewUpdateSection = () => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-lg font-bold text-white">New Update Anime</h3>
        <button className="text-xs text-brand-blue font-medium">Lihat Semua</button>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 no-scrollbar snap-x snap-mandatory">
        {updates.map((anime) => (
          <Link 
            to="/detail" 
            key={anime.id} 
            className="flex-none w-[140px] snap-start group"
          >
            {/* Card Image */}
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 bg-dark-card border border-white/5">
              <div className={`absolute inset-0 bg-gradient-to-br ${anime.color} opacity-20`}></div>
              {/* Placeholder */}
              <div className="w-full h-full bg-[url('https://placehold.co/140x200/222/FFF?text=Anime')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500"></div>
              
              {/* Badges */}
              <div className="absolute top-2 left-2">
                 {anime.isNew ? (
                   <span className="bg-brand-blue text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">NEW</span>
                 ) : (
                   <div className="flex items-center gap-0.5 bg-brand-gold text-black px-1.5 py-0.5 rounded text-[10px] font-bold">
                     <Star size={8} fill="black" /> {anime.rating}
                   </div>
                 )}
              </div>

              {/* Ep Badge */}
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white font-medium border border-white/10">
                EP {anime.ep}
              </div>
            </div>

            {/* Title & Views */}
            <h4 className="text-white font-bold text-sm truncate pr-2 group-hover:text-brand-blue transition-colors">{anime.title}</h4>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
               <Eye size={10} />
               <span>{anime.views}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NewUpdateSection;
