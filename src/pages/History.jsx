import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, orderBy, getDocs, limit, deleteDoc, doc } from "firebase/firestore";
import { auth } from '../lib/firebase';
import Layout from '../components/layout/Layout';
import { ChevronLeft, PlayCircle, Clock, Trash2, BookOpen } from 'lucide-react';

const History = () => {
  const navigate = useNavigate();
  const db = getFirestore();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'anime', 'manga'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchHistory(currentUser.uid);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchHistory = async (uid) => {
    setLoading(true);
    try {
      // 1. Fetch Anime History
      const animeRef = collection(db, "users", uid, "history");
      const animeQuery = query(animeRef, orderBy("lastWatched", "desc"), limit(50));
      
      // 2. Fetch Manga History
      const mangaRef = collection(db, "users", uid, "manga_history");
      const mangaQuery = query(mangaRef, orderBy("lastRead", "desc"), limit(50));

      const [animeSnap, mangaSnap] = await Promise.all([
          getDocs(animeQuery),
          getDocs(mangaQuery)
      ]);
      
      // 3. Map Anime Data
      const animeList = animeSnap.docs.map(doc => {
          const data = doc.data();
          return { 
              id: doc.id, 
              ...data, 
              type: 'anime',
              displayTitle: data.animeTitle || data.title || 'Anime Tanpa Judul',
              timestamp: data.lastWatched
          };
      });

      // 4. Map Manga Data
      const mangaList = mangaSnap.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              ...data,
              type: 'manga',
              displayTitle: data.mangaTitle || data.title || 'Manga Tanpa Judul',
              timestamp: data.lastRead,
              episodeNumber: data.chapterId?.split('chapter-')[1] || '?' // Get chapter number
          };
      });
      
      // 5. Merge and Sort by Newest
      const combined = [...animeList, ...mangaList].sort((a, b) => {
          const timeA = a.timestamp?.seconds || 0;
          const timeB = b.timestamp?.seconds || 0;
          return timeB - timeA;
      });

      setHistory(combined);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, item) => {
      e.preventDefault(); 
      e.stopPropagation();
      
      if (!confirm("Hapus dari riwayat?")) return;

      setDeletingId(item.id);
      try {
          const collectionName = item.type === 'manga' ? 'manga_history' : 'history';
          await deleteDoc(doc(db, "users", user.uid, collectionName, item.id));
          
          setHistory(prev => prev.filter(h => h.id !== item.id));
          
          if (item.type === 'anime' && item.episodeId) {
             localStorage.removeItem(`vid_pct_${item.episodeId}`);
          }
      } catch (err) {
          console.error("Gagal menghapus:", err);
          alert("Gagal menghapus riwayat");
      } finally {
          setDeletingId(null);
      }
  };

  const filteredHistory = history.filter(item => {
      if (filter === 'all') return true;
      return item.type === filter;
  });

  return (
    <Layout>
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#121212]/90 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center h-16 px-4 max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-white ml-2">Riwayat</h1>
        </div>
        
        {/* Filter Pills */}
        <div className="px-4 pb-3 flex gap-2 max-w-md mx-auto">
            <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'all' ? 'bg-white text-black' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'}`}
            >
                Semua
            </button>
            <button 
                onClick={() => setFilter('anime')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'anime' ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'}`}
            >
                Anime
            </button>
            <button 
                onClick={() => setFilter('manga')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'manga' ? 'bg-green-500 text-white' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'}`}
            >
                Manga
            </button>
        </div>
      </div>

      <div className="pt-32 px-0 pb-24 min-h-screen">
        {loading ? (
           <div className="space-y-0">
               {[1,2,3,4,5].map(i => (
                   <div key={i} className="flex gap-4 px-4 py-3 border-b border-white/5 animate-pulse">
                       <div className="w-32 h-20 bg-zinc-900 rounded-lg"></div>
                       <div className="flex-1 space-y-2 py-1">
                           <div className="h-4 w-3/4 bg-zinc-900 rounded"></div>
                           <div className="h-3 w-1/2 bg-zinc-900 rounded"></div>
                       </div>
                   </div>
               ))}
           </div>
        ) : filteredHistory.length > 0 ? (
           <div className="space-y-0">
               {filteredHistory.map((item) => (
                   <Link 
                      to={item.type === 'manga' ? `/manga/read/${item.chapterId}?manga=${item.mangaId}` : `/watch/${item.episodeId}`} 
                      key={item.id} 
                      className={`flex gap-3 px-4 py-3 border-b border-white/5 active:bg-white/5 transition-colors group relative ${deletingId === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                   >
                       
                       {/* Thumbnail */}
                       <div className="w-32 h-[72px] bg-zinc-900 rounded-lg overflow-hidden flex-shrink-0 relative">
                           {item.image ? (
                               <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                                   {item.type === 'manga' ? <BookOpen size={24} /> : <PlayCircle size={24} />}
                               </div>
                           )}
                           
                           {/* Label Overlay */}
                           <div className={`absolute top-1 left-1 px-1.5 py-0.5 backdrop-blur-sm rounded text-[9px] font-bold tracking-wider text-white ${item.type === 'manga' ? 'bg-green-600/80' : 'bg-violet-600/80'}`}>
                                {item.type === 'manga' ? 'CH ' + (item.episodeNumber) : 'EP ' + item.episodeNumber}
                           </div>
                           
                           {/* Progress Bar (Anime Only) */}
                           {item.type === 'anime' && (() => {
                               const savedPct = localStorage.getItem(`vid_pct_${item.episodeId}`);
                               const progress = savedPct ? parseInt(savedPct) : 0;
                               return progress > 0 && (
                                   <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-10">
                                       <div className="h-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" style={{ width: `${progress}%` }}></div>
                                   </div>
                               );
                           })()}
                       </div>

                       {/* Info */}
                       <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                           <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors pr-8">
                               {item.displayTitle}
                           </h3>
                           <div className="flex items-center justify-between text-[11px] text-gray-500">
                               <span className="flex items-center gap-1">
                                   <Clock size={11} /> 
                                   {item.timestamp?.toDate ? new Date(item.timestamp.toDate()).toLocaleDateString() : 'Baru saja'}
                               </span>
                               {item.type === 'anime' && (() => {
                                   const savedPct = localStorage.getItem(`vid_pct_${item.episodeId}`);
                                   const progress = savedPct ? parseInt(savedPct) : 0;
                                   return progress > 90 ? (
                                       <span className="text-green-500 font-medium text-[10px]">Selesai</span>
                                   ) : (
                                       <span className="text-gray-600 text-[10px]">{progress}%</span>
                                   );
                               })()}
                           </div>
                       </div>

                       {/* Delete Button */}
                       <button 
                           onClick={(e) => handleDelete(e, item)}
                           className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-gray-600 hover:text-red-500 transition-colors z-20"
                           title="Hapus riwayat ini"
                       >
                           <Trash2 size={18} />
                       </button>
                   </Link>
               ))}
               
               <div className="text-center py-8">
                   <p className="text-xs text-gray-600">Menampilkan 50 riwayat terakhir</p>
               </div>
           </div>
        ) : (
           <div className="flex flex-col items-center justify-center py-20 text-gray-500">
               <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                    <PlayCircle size={40} className="opacity-50" />
               </div>
               <h3 className="text-lg font-bold text-white mb-2">Belum Ada Riwayat</h3>
               <p className="text-sm text-center max-w-[200px] mb-6">
                   {filter === 'anime' ? "Tonton anime" : filter === 'manga' ? "Baca manga" : "Tonton anime atau baca manga"} favoritmu dan riwayatnya akan muncul di sini.
               </p>
               <Link to={filter === 'manga' ? "/manga" : "/"} className="px-6 py-3 bg-violet-600 rounded-full text-white text-sm font-bold hover:bg-violet-700 transition-colors">
                   Mulai {filter === 'manga' ? "Membaca" : "Nonton"}
               </Link>
           </div>
        )}
      </div>
    </Layout>
  );
};

export default History;