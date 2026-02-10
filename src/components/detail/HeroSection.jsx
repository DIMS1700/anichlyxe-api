import React from 'react';
import { Star, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = ({ movie }) => {
  if (!movie) return null;

  const bgImage = movie.image_poster || movie.image || 'https://placehold.co/600x400';
  const bannerImage = movie.image_banner || bgImage;

  return (
    <div className="relative w-full h-[450px] overflow-hidden shadow-2xl group">
      {/* 1. BACK BUTTON (Hardcoded to Home - FORCE RELOAD) */}
      <a 
        href="/" 
        className="absolute top-4 left-4 z-50 p-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-black/60 transition-colors active:scale-95"
      >
        <ArrowLeft size={24} />
      </a>

      {/* 2. BACKGROUND (Blurred Banner) */}
      <div className="absolute inset-0">
        <img 
          src={bannerImage} 
          alt="Background" 
          className="w-full h-full object-cover blur-sm opacity-50 scale-110" 
        />
        {/* Gradient Overlay dari Atas (untuk back button) dan Bawah (untuk konten) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0a0a0a]"></div>
      </div>

      {/* 3. CONTENT (Poster + Info) */}
      <div className="absolute bottom-0 left-0 w-full p-5 z-10 flex items-end gap-5">
        
        {/* POSTER VERTIKAL (Yang Anda cari) */}
        <div className="w-32 md:w-40 aspect-[2/3] rounded-lg overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/20 flex-shrink-0 relative mb-2">
            <img 
                src={bgImage} 
                alt={movie.title} 
                className="w-full h-full object-cover"
            />
        </div>

        {/* INFO TEXT */}
        <div className="flex-1 min-w-0 pb-2">
            {/* Chips */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-black tracking-widest uppercase rounded">
                    {movie.type || 'ANIME'}
                </span>
                {movie.score && (
                    <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                        <Star size={12} fill="currentColor" />
                        <span>{movie.score}</span>
                    </div>
                )}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 drop-shadow-md line-clamp-3 font-sans">
                {movie.title}
            </h1>

            {/* Genre Logic Update */}
            <div className="flex flex-wrap gap-1.5 opacity-90">
                {(() => {
                    // 1. Coba ambil dari movie.genres (Array) atau movie.genre (String)
                    let genreData = movie.genres || movie.genre;
                    let genreList = [];

                    // 2. Normalisasi ke Array
                    if (Array.isArray(genreData)) {
                        genreList = genreData;
                    } else if (typeof genreData === 'string') {
                        // Kalau string "Action,Comedy", kita split jadi array
                        genreList = genreData.split(',').map(g => g.trim());
                    }

                    // 3. Render max 5
                    return genreList.slice(0, 5).map((genre, idx) => {
                        const genreName = typeof genre === 'object' ? genre.name : genre;
                        return (
                            <span key={idx} className="text-[10px] font-bold text-gray-200 border border-white/10 px-2 py-0.5 rounded-md bg-white/5 backdrop-blur-sm">
                                {genreName}
                            </span>
                        );
                    });
                })()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;