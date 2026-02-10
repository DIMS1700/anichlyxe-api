import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Loader } from 'lucide-react';

const GenreList = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        // 🔥 UPDATE: Menggunakan endpoint yang benar
        const response = await fetch('https://animein.vercel.app/api/genres');
        
        if (!response.ok) {
          throw new Error('Gagal mengambil genre');
        }
        
        const data = await response.json();
        
        // Pastikan data berupa array
        // Kadang API membungkusnya dalam { data: [...] } atau langsung [...]
        const genreData = Array.isArray(data) ? data : (data.data || []);
        
        setGenres(genreData);
      } catch (error) {
        console.error("Gagal load genre:", error);
        // Jika error, biarkan kosong atau set default (opsional)
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  // Jika loading, tampilkan skeleton sederhana
  if (loading) {
    return (
      <div className="mb-8 w-full px-4 animate-pulse">
        <div className="h-6 w-32 bg-white/5 rounded mb-4"></div>
        <div className="flex flex-wrap gap-2">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-8 w-20 bg-white/5 rounded-full"></div>
          ))}
        </div>
      </div>
    );
  }

  // Jika tidak ada data, sembunyikan komponen
  if (genres.length === 0) return null;

  return (
    <div className="mb-8 w-full">
      <div className="flex items-center justify-between mb-4 px-4">
        <h3 className="text-[18px] font-bold text-white flex items-center gap-2">
           Genres
        </h3>
      </div>

      <div className="flex flex-wrap gap-2 px-4">
        {genres.map((genre, index) => {
          // Handle jika genre berupa object { endpoint: "...", title: "..." } atau string
          const genreName = genre.title || genre.name || genre;
          // Ambil slug dari endpoint jika ada, atau gunakan nama
          const genreSlug = genre.endpoint 
            ? genre.endpoint.split('/').filter(Boolean).pop() 
            : String(genreName).toLowerCase().replace(/\s+/g, '-');

          return (
            <Link 
              to={`/genre/${genreSlug}`}
              key={index} 
              className="group flex items-center justify-center px-4 py-2 rounded-full bg-[#1e1e1e] border border-white/5 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all duration-300"
            >
              <span className="text-sm font-medium text-gray-300 group-hover:text-violet-400 whitespace-nowrap transition-colors">
                  {genreName}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default GenreList;