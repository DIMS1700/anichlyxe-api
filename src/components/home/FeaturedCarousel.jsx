import React, { useState, useEffect } from 'react';
import { Eye, Play, ChevronRight } from 'lucide-react';

const FeaturedCarousel = ({ data }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Ambil 5 anime teratas saja untuk banner
  const slides = data ? data.slice(0, 5) : [];

  useEffect(() => {
    if (slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000); // Ganti slide setiap 5 detik

    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) {
    // Skeleton Loading / Placeholder jika data belum ada
    return (
      <div className="mb-6 relative w-full aspect-video rounded-2xl overflow-hidden bg-dark-card animate-pulse shadow-xl shadow-black/50">
        <div className="absolute inset-0 bg-white/5"></div>
      </div>
    );
  }

  return (
    <div className="mb-6 relative w-full aspect-video rounded-2xl overflow-hidden group shadow-xl shadow-black/50 bg-dark-card">
      {/* Slides Container */}
      {slides.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <img
            src={item.image_cover || item.image_poster || item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-black/40 to-transparent opacity-90"></div>

          {/* Rank Badge (#1, #2...) */}
          <div className="absolute top-0 right-0 z-20">
             <div className={`
               px-4 py-2 rounded-bl-3xl font-black text-xl italic tracking-tighter shadow-lg
               ${index === 0 ? 'bg-brand-gold text-black' : 
                 index === 1 ? 'bg-gray-300 text-black' : 
                 index === 2 ? 'bg-violet-700 text-white' : 'bg-white/10 text-white backdrop-blur-md'}
             `}>
               #{index + 1}
             </div>
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 w-full p-5 z-20">
            {/* Top Badges */}
            <div className="flex items-center gap-2 mb-2 opacity-0 translate-y-4 animate-[slideUp_0.5s_ease-out_forwards]">
               <span className="px-2 py-0.5 bg-brand-blue/80 backdrop-blur-md text-white text-[10px] font-bold rounded uppercase tracking-wider">
                 {item.type || 'Series'}
               </span>
               {item.views && (
                <div className="flex items-center gap-1 text-white/80 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg">
                  <Eye size={10} />
                  <span className="text-[10px] font-medium">{parseInt(item.views).toLocaleString('id-ID')}</span>
                </div>
               )}
            </div>

            {/* Title */}
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-1 leading-tight drop-shadow-lg opacity-0 translate-y-4 animate-[slideUp_0.5s_ease-out_0.1s_forwards]">
              {item.title}
            </h2>
            
            {/* Synopsis */}
            {item.synopsis && (
              <p className="text-xs md:text-sm text-gray-200 line-clamp-2 mb-4 max-w-[90%] opacity-0 translate-y-4 animate-[slideUp_0.5s_ease-out_0.2s_forwards]">
                {item.synopsis}
              </p>
            )}

            {/* Action Button (Play) */}
            <button className="flex items-center gap-2 bg-brand-gold hover:bg-yellow-400 text-black px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-gold/20 opacity-0 translate-y-4 animate-[slideUp_0.5s_ease-out_0.3s_forwards]">
              <Play size={14} fill="black" />
              Tonton Sekarang
            </button>
          </div>
        </div>
      ))}

      {/* Pagination Indicators */}
      <div className="absolute bottom-5 right-5 z-30 flex gap-1.5">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-6 bg-brand-blue' : 'w-1.5 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
      
      {/* Custom Keyframes for Animation in JS since we use Tailwind v4 but inline simplifies here */}
      <style>{`
        @keyframes slideUp {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default FeaturedCarousel;
