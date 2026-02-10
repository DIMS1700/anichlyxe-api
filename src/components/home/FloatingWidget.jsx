import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, getFirestore } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../../lib/firebase';

const FloatingWidget = () => {
  const [lastWatched, setLastWatched] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchLastWatched(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchLastWatched = async (uid) => {
    try {
      const db = getFirestore();
      const historyRef = collection(db, "users", uid, "history");
      const q = query(historyRef, orderBy("lastWatched", "desc"), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setLastWatched(data);
        
        if (data.episodeId) {
            const savedPct = localStorage.getItem(`vid_pct_${data.episodeId}`);
            if (savedPct) setProgress(parseInt(savedPct));
        }
      }
    } catch (err) {
      console.error("Error fetching last watched:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
      <div className="mb-8 animate-pulse">
          <div className="h-4 w-32 bg-white/10 rounded mb-3"></div>
          <div className="h-24 bg-white/5 rounded-2xl"></div>
      </div>
  );

  if (!user || !lastWatched) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold text-white">Terakhir Ditonton</h3>
        <Link to="/profile" className="text-xs text-violet-500 font-medium hover:underline">Lihat Semua</Link>
      </div>

      <Link to={`/watch/${lastWatched.episodeId}`} className="block">
        <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center gap-4 hover:bg-zinc-800 transition-colors group">
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-xl bg-zinc-800 flex-shrink-0 overflow-hidden relative">
             <img 
                src={lastWatched.image || 'https://placehold.co/100x100/222/FFF?text=EP'} 
                alt={lastWatched.title}
                className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-6 h-6 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Play size={10} fill="white" className="text-white ml-0.5" />
                </div>
             </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-sm truncate group-hover:text-violet-500 transition-colors">
              {lastWatched.title || lastWatched.animeTitle || 'Anime'}
            </h4>
            <p className="text-xs text-gray-400 mt-1">
                Lanjut Episode {lastWatched.episodeNumber}
            </p>
            
            {/* Progress Bar (Dummy 75% for visual) */}
            <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          {/* Play Action */}
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
            <Play size={14} fill="white" className="text-white ml-0.5" />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default FloatingWidget;
