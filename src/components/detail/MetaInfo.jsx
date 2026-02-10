import React, { useState, useEffect } from 'react';
import { Bookmark, Share2, Info, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp, getFirestore } from "firebase/firestore";
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

const MetaInfo = ({ movie }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [user, setUser] = useState(null); // Realtime User State
  const [loadingBookmark, setLoadingBookmark] = useState(false); // Loading State
  const navigate = useNavigate();
  
  const db = getFirestore(); // Manual Init

  // 1. Realtime Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // 2. Check Bookmark Status (Only when User & Movie Ready)
  useEffect(() => {
    if (!user || !movie) {
        setIsBookmarked(false);
        return;
    }

    const checkBookmark = async () => {
      try {
        const movieId = String(movie.id_movie || movie.id); // Force String ID
        // console.log("Checking bookmark for:", movieId, "User:", user.uid);

        if (!movieId || movieId === 'undefined') return;

        const docRef = doc(db, "users", user.uid, "bookmarks", movieId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            // console.log("Bookmark FOUND");
            setIsBookmarked(true);
        } else {
            // console.log("Bookmark NOT found");
            setIsBookmarked(false);
        }
      } catch (err) {
        console.error("Error checking bookmark:", err);
      }
    };
    checkBookmark();
  }, [user, movie]);

  const toggleBookmark = async () => {
    if (!user) {
       navigate('/login');
       return;
    }
    
    // Prevent double click
    if (loadingBookmark) return;
    setLoadingBookmark(true);

    const movieId = String(movie.id_movie || movie.id); // Force String ID
    // console.log("Toggling bookmark for:", movieId);

    if (!movieId || movieId === 'undefined') {
        alert("Gagal: ID Anime tidak valid");
        setLoadingBookmark(false);
        return;
    }

    const bookmarkRef = doc(db, "users", user.uid, "bookmarks", movieId);

    try {
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        // console.log("Bookmark DELETED");
        setIsBookmarked(false);
      } else {
        await setDoc(bookmarkRef, {
          movieId: movieId,
          title: movie.title,
          image: movie.image_poster || movie.image,
          type: 'anime',
          addedAt: serverTimestamp()
        });
        // console.log("Bookmark SAVED");
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
      alert("Gagal menyimpan bookmark: " + err.message);
    } finally {
        setLoadingBookmark(false);
    }
  };

  const handleShare = async () => {
    try {
        await navigator.share({
            title: movie.title,
            text: `Nonton ${movie.title} di LyxeNime!`,
            url: window.location.href
        });
    } catch (err) {
        console.log("Share cancelled");
    }
  };

  if (!movie) return null;

  return (
    <div className="px-5 pt-4 pb-2 bg-[#0a0a0a]">
      {/* Action Buttons Bar - FULL WIDTH LOOK */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 mb-6">
        <button 
          onClick={() => {
             const epList = document.getElementById('episode-list');
             if(epList) epList.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white text-black font-black py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition-transform"
        >
           <Play size={18} fill="currentColor" />
           NONTON SEKARANG
        </button>
        
        <button 
          onClick={toggleBookmark}
          disabled={loadingBookmark}
          className={`w-12 flex items-center justify-center rounded-lg border-2 transition-all active:scale-95 ${isBookmarked ? 'bg-orange-600 border-orange-600 text-white' : 'bg-transparent border-zinc-800 text-gray-400'}`}
        >
          {loadingBookmark ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
              <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
          )}
        </button>

        <button 
          onClick={handleShare}
          className="w-12 flex items-center justify-center rounded-lg bg-zinc-900 text-gray-400 active:scale-95 transition-transform"
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Synopsis Section */}
      <div className="mb-6">
         <div 
           className={`relative text-sm text-gray-400 leading-relaxed font-light ${showFullSynopsis ? '' : 'line-clamp-3'}`}
           onClick={() => setShowFullSynopsis(!showFullSynopsis)}
         >
            <p dangerouslySetInnerHTML={{ __html: movie.synopsis || "Tidak ada sinopsis." }} />
         </div>
         <button 
            onClick={() => setShowFullSynopsis(!showFullSynopsis)}
            className="text-xs font-bold text-orange-500 mt-1"
         >
            {showFullSynopsis ? 'Tutup' : 'Baca Selengkapnya'}
         </button>
      </div>

      {/* Stats Grid - Minimalis */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-4 border-t border-white/5">
         <div>
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-0.5">Studio</p>
            <p className="text-sm font-medium text-white truncate">{movie.studio || '-'}</p>
         </div>
         <div>
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-0.5">Status</p>
            <p className="text-sm font-medium text-white">{movie.status || '-'}</p>
         </div>
         <div>
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-0.5">Total Eps</p>
            <p className="text-sm font-medium text-white">{movie.total_episode || '?'}</p>
         </div>
         <div>
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-0.5">Durasi</p>
            <p className="text-sm font-medium text-white">{movie.duration || '-'}</p>
         </div>
      </div>
    </div>
  );
};

export default MetaInfo;