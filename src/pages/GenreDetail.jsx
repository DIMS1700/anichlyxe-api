import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { ArrowLeft, Play, Star, AlertCircle } from 'lucide-react';

const GenreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format Judul Genre
  const genreTitle = id.replace(/-/g, ' ').toUpperCase();

  // --- MAPPING ID GENRE (Sama seperti sebelumnya karena sudah berhasil) ---
  const getGenreId = (slug) => {
    const map = {
      "action": 14, "adventure": 16, "comedy": 25, "demons": 43, "drama": 20,
      "ecchi": 17, "fantasy": 13, "game": 37, "harem": 29, "historical": 18,
      "horror": 35, "josei": 12, "magic": 30, "martial-arts": 15, "mecha": 40,
      "military": 36, "music": 33, "mystery": 21, "parody": 44, "police": 21,
      "psychological": 23, "romance": 19, "samurai": 24, "school": 26,
      "sci-fi": 31, "seinen": 22, "shoujo": 38, "shoujo-ai": 49, "shounen": 32,
      "shounen-ai": 51, "slice-of-life": 27, "space": 33, "sports": 42,
      "super-power": 41, "supernatural": 24, "thriller": 34, "vampire": 38,
      "yaoi": 39, "yuri": 40, "tokusatsu": 128
    };
    return map[slug.toLowerCase()] || null;
  };

  useEffect(() => {
    const fetchGenreData = async () => {
      setLoading(true);
      setError(null);
      setAnimeList([]);

      const genreId = getGenreId(id);
      if (!genreId) {
        setError(`ID untuk genre "${id}" tidak ditemukan.`);
        setLoading(false);
        return;
      }

      try {
        // URL yang sudah terbukti berhasil
        const url = `https://animein.vercel.app/api/genres/${genreId}?page=1`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Server Error: ${response.status}`);
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.data || []);

        if (list.length > 0) {
          setAnimeList(list);
        } else {
          setError("Data kosong dari server.");
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Gagal memuat data. Coba refresh.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGenreData();
    }
  }, [id]);

  const handleImageError = (e) => {
    e.target.src = "https://placehold.co/300x450/222/666?text=No+Image";
  };

  return (
    <Layout withBottomNav={true}>
      <div className="min-h-screen bg-[#121212] pb-24 text-white font-sans">
        
        {/* HEADER (Warna orange) */}
        <div className="sticky top-0 z-50 bg-[#121212]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            <h1 className="text-lg font-bold text-white capitalize truncate">
              Genre: <span className="text-orange-500">{genreTitle}</span>
            </h1>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-4 max-w-7xl mx-auto">
          
          {/* LOADING SKELETON (Grid Disesuaikan) */}
          {loading && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4 animate-pulse mt-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[3/4.5] bg-white/5 rounded-xl"></div>
              ))}
            </div>
          )}

          {/* ERROR STATE */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center px-4">
              <AlertCircle size={48} className="mb-3 opacity-50 text-red-500" />
              <p className="mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/10 border border-white/10 rounded-full hover:bg-white/20 text-white text-sm transition-all">
                Coba Lagi
              </button>
            </div>
          )}

          {/* LIST ANIME (Grid Lebih Rapat & Warna orange) */}
          {!loading && animeList.length > 0 && (
            // UPDATE GRID: Menambahkan lg:grid-cols-6 dan memperkecil gap di mobile (gap-2)
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
              {animeList.map((anime, idx) => {
                 const slug = anime.id || '#';

                 return (
                    <Link 
                      key={idx} 
                      to={`/detail/${slug}`} 
                      className="group relative block"
                    >
                      <div className="relative aspect-[3/4.5] rounded-xl overflow-hidden mb-2 shadow-lg bg-[#1e1e1e]">
                        <img 
                          src={anime.image_poster || anime.image_cover || anime.thumb} 
                          alt={anime.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                          onError={handleImageError}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

                        {/* BADGES (Favorites & Type) - Warna orange */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                            {anime.favorites && (
                                <span className="flex items-center gap-1 bg-yellow-500/90 text-black text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm">
                                    <Star size={8} fill="currentColor" /> {anime.favorites}
                                </span>
                            )}
                            {anime.type && (
                                // Ubah bg-orange jadi bg-orange
                                <span className="bg-orange-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm">
                                    {anime.type}
                                </span>
                            )}
                        </div>

                        {/* HOVER PLAY BUTTON - Warna orange */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {/* Ubah bg-orange jadi bg-orange */}
                          <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                            <Play size={20} fill="currentColor" className="text-white ml-1" />
                          </div>
                        </div>
                      </div>

                      {/* JUDUL - Hover Warna orange */}
                      {/* Ubah hover:text-orange jadi hover:text-orange */}
                      <h3 className="text-xs sm:text-sm font-bold text-gray-200 line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors">
                        {anime.title}
                      </h3>
                    </Link>
                 );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default GenreDetail;