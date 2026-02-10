import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, orderBy, getDocs, limit, deleteDoc, doc } from "firebase/firestore";
import { auth } from '../lib/firebase';
import Layout from '../components/layout/Layout';
import { ChevronLeft, Bookmark, Trash2, AlertCircle, BookOpen } from 'lucide-react';

const Bookmarks = () => {
  const navigate = useNavigate();
  const db = getFirestore();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'anime', 'manga'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchBookmarks(currentUser.uid);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchBookmarks = async (uid) => {
    setLoading(true);
    try {
      // 1. Fetch Anime Bookmarks
      const animeRef = collection(db, "users", uid, "bookmarks");
      const animeQuery = query(animeRef, limit(100));
      
      // 2. Fetch Manga Bookmarks
      const mangaRef = collection(db, "users", uid, "manga_bookmarks");
      const mangaQuery = query(mangaRef, limit(100));

      const [animeSnap, mangaSnap] = await Promise.all([
          getDocs(animeQuery),
          getDocs(mangaQuery)
      ]);
      
      const animeList = animeSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'anime' }));
      const mangaList = mangaSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'manga' }));
      
      // Merge and Sort (Hybrid: Support both addedAt & createdAt)
      const combined = [...animeList, ...mangaList].sort((a, b) => {
          const timeA = a.addedAt?.seconds || a.createdAt?.seconds || 0;
          const timeB = b.addedAt?.seconds || b.createdAt?.seconds || 0;
          return timeB - timeA;
      });

      setBookmarks(combined);
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, item) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!confirm("Hapus dari daftar simpan?")) return;

      setDeletingId(item.id);
      try {
          const collectionName = item.type === 'manga' ? 'manga_bookmarks' : 'bookmarks';
          await deleteDoc(doc(db, "users", user.uid, collectionName, item.id));
          
          setBookmarks(prev => prev.filter(b => b.id !== item.id));
      } catch (err) {
          console.error("Gagal menghapus:", err);
          alert("Gagal menghapus bookmark");
      } finally {
          setDeletingId(null);
      }
  };

  const filteredBookmarks = bookmarks.filter(item => {
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
          <h1 className="text-lg font-bold text-white ml-2">Daftar Simpanan</h1>
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

      <div className="pt-32 px-4 pb-24 min-h-screen">
        {loading ? (
           <div className="grid grid-cols-3 gap-3">
               {[1,2,3,4,5,6].map(i => (
                   <div key={i} className="aspect-[3/4] bg-zinc-900 rounded-xl animate-pulse"></div>
               ))}
           </div>
        ) : filteredBookmarks.length > 0 ? (
           <div className="grid grid-cols-3 gap-3">
               {filteredBookmarks.map((item) => (
                   <Link 
                      to={item.type === 'manga' ? `/manga/${item.mangaId}` : `/detail/${item.movieId}`} 
                      key={item.id} 
                      className={`group block relative ${deletingId === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                   >
                       <div className="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 relative mb-2 shadow-lg border border-white/5">
                           <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           
                           {/* Type Badge */}
                           <div className={`absolute top-1 left-1 px-1.5 py-0.5 backdrop-blur-sm rounded text-[8px] font-bold uppercase tracking-wider text-white ${item.type === 'manga' ? 'bg-green-600/80' : 'bg-violet-600/80'}`}>
                               {item.type === 'manga' ? 'Manga' : item.type || 'TV'}
                           </div>

                           {/* Delete Button */}
                           <button 
                               onClick={(e) => handleDelete(e, item)}
                               className="absolute top-1 right-1 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                           >
                               <Trash2 size={12} />
                           </button>
                       </div>
                       <p className="text-xs font-medium text-gray-300 line-clamp-2 group-hover:text-violet-400 transition-colors leading-snug">
                           {item.title}
                       </p>
                   </Link>
               ))}
           </div>
        ) : (
           <div className="flex flex-col items-center justify-center py-20 text-gray-500">
               <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                    <Bookmark size={40} className="opacity-50" />
               </div>
               <h3 className="text-lg font-bold text-white mb-2">Belum Ada Simpanan</h3>
               <p className="text-sm text-center max-w-[200px] mb-6">
                   {filter === 'anime' ? "Tonton anime" : filter === 'manga' ? "Baca manga" : "Tonton anime atau baca manga"} favoritmu agar mudah dicari nanti.
               </p>
               <Link to={filter === 'manga' ? "/manga" : "/search"} className="px-6 py-3 bg-violet-600 rounded-full text-white text-sm font-bold hover:bg-violet-700 transition-colors">
                   Cari {filter === 'manga' ? "Manga" : "Anime"}
               </Link>
           </div>
        )}
      </div>
    </Layout>
  );
};

export default Bookmarks;