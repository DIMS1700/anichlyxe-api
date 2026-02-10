// Watch Component Fixed - No Ads Version
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, setDoc, getFirestore, serverTimestamp, collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, runTransaction, getDoc, increment, deleteField, updateDoc } from "firebase/firestore";
import { auth } from '../lib/firebase';
import { 
  BookOpen,
  Settings2, 
  Download, 
  Send, 
  Trash2, 
  User, 
  AlertTriangle, 
  ThumbsUp, 
  ThumbsDown,
  Clock,
  Crown,
  Shield
} from 'lucide-react';
import VideoPlayer from '../components/watch/VideoPlayer';
import EpisodeList from '../components/detail/EpisodeList';
import { useStreamData } from '../hooks/useStreamData';

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, dataId } = useStreamData(id);
  const [activeFilter, setActiveFilter] = useState("Populer");
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);
  const [animeTitle, setAnimeTitle] = useState("");
  const [animePoster, setAnimePoster] = useState("");
  
  // Ad State - DIMATIKAN SECARA PAKSA
  const [adTimer, setAdTimer] = useState(0); // Set awal 0
  const [showAd, setShowAd] = useState(false); // Set awal false
  const [isAuthReady, setIsAuthReady] = useState(true); 

  // Player State
  const [currentServer, setCurrentServer] = useState(null);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const serverInitRef = useRef(null); 
  const episodeListRef = useRef(null); 

  // Comment & Interaction State
  const [likesData, setLikesData] = useState({ likes: 0, dislikes: 0 });
  const [userVote, setUserVote] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, commentId: null });
  const [currentUser, setCurrentUser] = useState(null);
  
  const db = getFirestore();

  // Scroll to top on mount/change & RESET AD TIMER
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // LOGIKA IKLAN DIMATIKAN TOTAL DI SINI
    setAdTimer(0);
    setShowAd(false);

  }, [id]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      setIsAuthReady(true); 
    });
    return () => unsubscribe();
  }, []);

  // Save History Logic
  useEffect(() => {
    if (!currentUser || !data?.episode || !animeTitle) return;

    const saveHistory = async () => {
        try {
            const historyRef = doc(db, "users", currentUser.uid, "history", data.episode.id_movie);
            await setDoc(historyRef, {
                episodeId: id,
                movieId: data.episode.id_movie,
                title: data.episode.title, 
                animeTitle: animeTitle, 
                image: animePoster || (data.episode.image?.startsWith('http') ? data.episode.image : `https://animein.vercel.app${data.episode.image}`),
                lastWatched: serverTimestamp(),
                episodeNumber: data.episode.title?.match(/\d+/)?.[0] || '?'
            }, { merge: true });
        } catch (err) {
            console.error("Failed to save history:", err);
        }
    };

    saveHistory();
  }, [currentUser, data, id, animeTitle, animePoster]);

  // XP Accumulator Logic
  useEffect(() => {
      if (!currentUser) return; // XP tetap jalan walau tanpa iklan

      let timerId;
      
      const addXP = async () => {
          try {
              const userRef = doc(db, "users", currentUser.uid);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                  const userData = userSnap.data();
                  
                  await updateDoc(userRef, {
                      xp: increment(1)
                  });
                  
                  const now = new Date();
                  const expiredDate = userData.premiumUntil ? userData.premiumUntil.toDate() : null;
                  
                  // Logic Premium tetap ada untuk kecepatan XP
                  const isPremium = (currentUser.email === 'EMAIL_ADMIN_KAMU@gmail.com') || 
                                    ((userData.role === 'premium' || userData.isPremium === true) && (expiredDate && expiredDate > now));
                  
                  const nextInterval = isPremium ? 120000 : 180000;
                  timerId = setTimeout(addXP, nextInterval);
              }
          } catch (err) {
              console.error("Failed to update XP:", err);
              timerId = setTimeout(addXP, 180000); 
          }
      };

      const startLoop = async () => {
          try {
             const userSnap = await getDoc(doc(db, "users", currentUser.uid));
             const userData = userSnap.exists() ? userSnap.data() : {};
             const now = new Date();
             const expiredDate = userData.premiumUntil ? userData.premiumUntil.toDate() : null;
             const isPremium = (currentUser.email === 'EMAIL_ADMIN_KAMU@gmail.com') || 
                               ((userData.role === 'premium' || userData.isPremium === true) && (expiredDate && expiredDate > now));
             
             const initialDelay = isPremium ? 120000 : 180000;
             timerId = setTimeout(addXP, initialDelay);
          } catch (e) {
             timerId = setTimeout(addXP, 180000);
          }
      };

      startLoop();
      return () => clearTimeout(timerId);
  }, [currentUser]);

  // Fetch Likes & User Vote
  useEffect(() => {
    if (!id) return;
    const likesRef = doc(db, "likes", id);
    const unsubscribeLikes = onSnapshot(likesRef, (docSnap) => {
      if (docSnap.exists()) {
        setLikesData(docSnap.data());
      } else {
        setLikesData({ likes: 0, dislikes: 0 });
      }
    });

    let unsubscribeVote = () => {};
    if (currentUser) {
       const voteRef = doc(db, "likes", id, "votes", currentUser.uid);
       unsubscribeVote = onSnapshot(voteRef, (docSnap) => {
         if (docSnap.exists()) {
           setUserVote(docSnap.data().type);
         } else {
           setUserVote(null);
         }
       });
    }

    return () => {
      unsubscribeLikes();
      unsubscribeVote();
    };
  }, [id, currentUser]);

  // Fetch Comments
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "comments"), 
      where("episodeId", "==", id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      comms.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

      setComments(comms);
    }, (error) => {
      console.error("Error fetching comments:", error);
    });
    
    return () => unsubscribe();
  }, [id]);

  // Handle Vote
  const handleVote = async (type) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const likesRef = doc(db, "likes", id);
    const voteRef = doc(db, "likes", id, "votes", currentUser.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const voteSnap = await transaction.get(voteRef);
        const likeSnap = await transaction.get(likesRef);
        
        if (!likeSnap.exists()) {
          transaction.set(likesRef, { likes: 0, dislikes: 0 });
        }

        const currentData = likeSnap.exists() ? likeSnap.data() : { likes: 0, dislikes: 0 };
        const oldVote = voteSnap.exists() ? voteSnap.data().type : null;

        let newLikes = currentData.likes || 0;
        let newDislikes = currentData.dislikes || 0;

        if (oldVote === type) {
          transaction.delete(voteRef);
          if (type === 'like') newLikes--;
          else newDislikes--;
        } else {
          transaction.set(voteRef, { type });
          if (oldVote === 'like') newLikes--;
          if (oldVote === 'dislike') newDislikes--;
          
          if (type === 'like') newLikes++;
          else newDislikes++;
        }
        
        transaction.update(likesRef, { 
          likes: Math.max(0, newLikes), 
          dislikes: Math.max(0, newDislikes) 
        });
      });
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  // Handle Post Comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    
    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      
      const userXp = userData.xp || 0;
      const isPremium = userData.role === 'premium' || userData.isPremium === true;

      await addDoc(collection(db, "comments"), {
        episodeId: id,
        userId: currentUser.uid,
        username: currentUser.displayName || "User",
        avatar: currentUser.photoURL,
        text: newComment,
        timestamp: serverTimestamp(),
        userXp: userXp,
        isPremium: isPremium,
        isAdmin: currentUser.email === 'EMAIL_ADMIN_KAMU@gmail.com'
      });
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Comment
  const openDeleteModal = (commentId) => {
    setDeleteModal({ show: true, commentId });
  };

  const confirmDelete = async () => {
    if (!deleteModal.commentId) return;
    try {
      await deleteDoc(doc(db, "comments", deleteModal.commentId));
      setDeleteModal({ show: false, commentId: null });
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  // Initialize server
  useEffect(() => {
      if (!data || !data.server || data.server.length === 0) return;
      if (dataId !== id) return;
      if (serverInitRef.current === id) return;

      const servers = data.server;
      const preferred = servers.find(s => s.quality === '720p') || 
                        servers.find(s => s.quality === '480p') || 
                        servers[0];
      
      setCurrentServer(preferred);
      serverInitRef.current = id; 
  }, [data, id, dataId]); 

  // Auto-scroll to active episode
  useEffect(() => {
    if (episodeListRef.current && episodes.length > 0) {
      const activeEpisodeElement = episodeListRef.current.querySelector('.active-episode');
      if (activeEpisodeElement) {
        activeEpisodeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      }
    }
  }, [episodes, id]);

  const getQualityLabel = (quality) => {
      if (['360p', '480p'].includes(quality)) return 'SD';
      if (['720p', '1080p'].includes(quality)) return 'HD';
      if (quality === 'FHD') return 'Full HD';
      return quality;
  };

  // Fetch episodes & detail
  useEffect(() => {
    const movieId = data?.episode?.id_movie;
    if (!movieId) return;
    
    const fetchInfo = async () => {
        setLoadingEpisodes(true);
        try {
            const [episodesRes, detailRes] = await Promise.all([
                fetch(`https://animein.vercel.app/api/anime/${movieId}/episodes`),
                fetch(`https://animein.vercel.app/api/anime/${movieId}`)
            ]);
            
            if (episodesRes.ok) {
                const result = await episodesRes.json();
                const episodesData = result.episodes || result;
                if (Array.isArray(episodesData)) {
                    const sortedEpisodes = [...episodesData].sort((a, b) => {
                        const numA = parseInt(a.title?.match(/\d+/)?.[0] || a.index || 0);
                        const numB = parseInt(b.title?.match(/\d+/)?.[0] || b.index || 0);
                        return numA - numB;
                    });
                    setEpisodes(sortedEpisodes);
                }
            }

            if (detailRes.ok) {
                const detailData = await detailRes.json();
                const realTitle = detailData.movie?.title || detailData.title || detailData.name;
                const realPoster = detailData.movie?.image_poster || detailData.image_poster;

                if (realTitle) setAnimeTitle(realTitle);
                if (realPoster) setAnimePoster(realPoster);
            }
        } catch (err) {
            console.error("Failed to fetch info", err);
        } finally {
            setLoadingEpisodes(false);
        }
    };

    fetchInfo();
  }, [data?.episode?.id_movie]);

  if (loading || (dataId !== id && !error)) {
    return (
      <div className="min-h-screen bg-[#111111] animate-pulse">
        <div className="w-full aspect-video bg-white/5"></div>
        <div className="p-4 space-y-3">
          <div className="h-6 bg-white/5 w-3/4 rounded"></div>
          <div className="h-4 bg-white/5 w-1/2 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
     return (
       <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-4">
         <p className="text-red-400 mb-4">Gagal memuat video: {error}</p>
         <button onClick={() => window.location.reload()} className="px-4 py-2 bg-zinc-800 text-white rounded-full">
           Coba Lagi
         </button>
       </div>
     );
  }

  const copyToClipboard = async () => {
      try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      } catch (err) {
          console.error("Failed to copy", err);
      }
  };

  const { episode, server } = data;
  const currentIndex = episodes.findIndex(ep => ep.id === id);
  const prevEp = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEp = currentIndex !== -1 && currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  const handlePrev = () => prevEp && navigate(`/watch/${prevEp.id}`);
  const handleNext = () => nextEp && navigate(`/watch/${nextEp.id}`);
  
  const actions = [
    { 
        icon: ThumbsUp, 
        label: (likesData?.likes || 0).toString(), 
        action: () => handleVote('like'),
        active: userVote === 'like',
        activeColor: "text-green-500"
    },
    { 
        icon: ThumbsDown, 
        label: (likesData?.dislikes || 0).toString(), 
        action: () => handleVote('dislike'),
        active: userVote === 'dislike',
        activeColor: "text-red-500"
    },
    { 
        icon: BookOpen, 
        label: "Back for detail anime", 
        action: () => {
        if (data?.episode?.id_movie) navigate(`/detail/${data.episode.id_movie}`, { state: { fromWatch: true } });
    }
    },
    { 
        icon: Settings2, 
        label: currentServer ? getQualityLabel(currentServer.quality) : "Kualitas",
        action: () => setShowServerMenu(true)
    }
  ];

  if (!episode) return null;

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans pb-20 relative">
      {/* Section 1: Video Player */}
      <div className="sticky top-0 z-50 bg-black">
        <div className="relative aspect-video bg-black">
            <VideoPlayer 
                activeServer={currentServer}
                onServerChange={setCurrentServer}
                servers={data?.server || []}
                poster={episode.image?.startsWith('http') ? episode.image : `https://animein.vercel.app${episode.image}`} 
                storageKey={episode.id}
                animeTitle={animeTitle || episode.title}
                onNext={nextEp ? handleNext : null}
                onPrev={prevEp ? handlePrev : null}
            />
        </div>
      </div>

      <div className="max-w-screen-lg mx-auto">
        {/* Section 2: Video Info */}
        <div className="p-4">
          {loadingEpisodes || !animeTitle ? (
              <div className="h-7 w-3/4 bg-white/10 rounded mb-2 animate-pulse"></div>
          ) : (
              <h2 className="text-xl font-black text-white truncate leading-tight mb-1">
                  {animeTitle}
              </h2>
          )}
          <h1 className="text-sm font-bold text-gray-300 leading-snug mb-1">
            {episode.title}
          </h1>
          <p className="text-xs text-gray-400 font-medium">
             {episode.key_time || 'Unknown Date'}
          </p>
        </div>

        {/* Section 3: Action Buttons */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
            {actions.map((action, index) => (
              <button 
                key={index}
                onClick={action.action}
                className={`flex items-center gap-2 bg-[#27272a] hover:bg-[#3f3f46] px-4 py-2 rounded-full flex-shrink-0 transition-colors ${action.active ? 'bg-[#3f3f46] ring-1 ring-white/20' : ''}`}
              >
                <action.icon size={18} className={action.active ? action.activeColor : "text-white"} />
                <span className={`text-sm font-medium ${action.active ? action.activeColor : "text-white"}`}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Server Selection Modal */}
        {showServerMenu && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80" onClick={() => setShowServerMenu(false)}>
                <div className="w-full max-w-md bg-[#18181b] rounded-t-2xl p-4 animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                        <h3 className="text-white font-bold text-lg">Pilih Kualitas</h3>
                        <button onClick={() => setShowServerMenu(false)} className="text-gray-400 hover:text-white">Tutup</button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {server.map((s, idx) => (
                            <button
                                key={`${s.quality}-${idx}`}
                                onClick={() => {
                                    setCurrentServer(s);
                                    setShowServerMenu(false);
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                                    currentServer?.quality === s.quality 
                                    ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50' 
                                    : 'bg-[#27272a] text-white hover:bg-[#3f3f46]'
                                }`}
                            >
                                <span className="font-medium">{getQualityLabel(s.quality)}</span>
                                <span className="text-xs opacity-60 bg-black/20 px-2 py-1 rounded">{s.quality}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        <div className="h-[1px] bg-white/5 mx-4 my-2"></div>

        {/* Section 4: Episode List Horizontal (Tabs Style) */}
        <div className="p-4 pt-2">
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-white font-bold text-base">Episode</h3>
             <span className="text-xs text-gray-500">{episodes.length} Episode</span>
           </div>
           
           {loadingEpisodes ? (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex-shrink-0 w-12 h-10 bg-white/5 rounded animate-pulse"></div>
                  ))}
              </div>
           ) : (Array.isArray(episodes) && episodes.length > 0) ? (
              <div ref={episodeListRef} className="flex gap-2 overflow-x-auto no-scrollbar snap-x pb-2">
                  {episodes.map((ep) => {
                      const epNumber = ep.title?.match(/(\d+)$/)?.[0] || ep.index || ep.title;
                      const isActive = ep.id === id;
                      return (
                      <Link 
                        key={ep.id}
                        to={`/watch/${ep.id}`}
                        className={`flex-shrink-0 flex items-center justify-center min-w-[3rem] h-10 px-3 rounded-lg text-sm font-bold transition-all snap-start ${
                            isActive 
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105 active-episode' 
                            : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46] hover:text-white'
                        }`}
                      >
                          {epNumber}
                      </Link>
                  )})}
              </div>
           ) : (
               <div className="text-gray-500 text-sm text-center py-4">Tidak ada episode lainnya.</div>
           )}
        </div>

        <div className="h-[1px] bg-white/5 mx-4 my-2"></div>

        {/* Section 5: Comments (REAL-TIME) */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
             <h3 className="text-white font-bold">Komentar</h3>
             <span className="text-gray-400 text-sm">{comments.length}</span>
          </div>

          {/* Input Area */}
          <div className="flex items-center gap-3 mb-6">
             {currentUser ? (
                 <>
                     <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                         {currentUser.photoURL ? (
                             <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                         ) : (
                             <span className="text-xs font-bold text-white">{currentUser.displayName?.charAt(0) || 'U'}</span>
                         )}
                     </div>
                     <form onSubmit={handlePostComment} className="flex-1 relative">
                        <input 
                           type="text" 
                           value={newComment}
                           onChange={(e) => setNewComment(e.target.value)}
                           disabled={isSubmitting}
                           placeholder="Tulis komentar..." 
                           className="w-full bg-[#27272a] text-white text-sm rounded-full py-2.5 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                        />
                        <button type="submit" disabled={isSubmitting} className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-400 disabled:opacity-50">
                           <Send size={16} />
                        </button>
                     </form>
                 </>
             ) : (
                 <div className="w-full bg-[#27272a] p-3 rounded-xl flex items-center justify-between">
                     <span className="text-sm text-gray-400">Login untuk berkomentar</span>
                     <Link to="/login" className="px-4 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700">Login</Link>
                 </div>
             )}
          </div>

          {/* Comment List */}
          <div className="space-y-6">
             {comments.length > 0 ? comments.map((comment) => {
                 const level = Math.floor((comment.userXp || 0) / 10) + 1;
                 const isPrem = comment.isPremium === true;

                 return (
                 <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border-2 ${isPrem ? 'border-orange-500 shadow-lg shadow-orange-500/20' : 'border-transparent bg-zinc-800'}`}>
                         {comment.avatar ? (
                             <img src={comment.avatar} alt={comment.username} className="w-full h-full object-cover" />
                         ) : (
                             <User size={18} className={isPrem ? "text-orange-500" : "text-gray-500"} />
                         )}
                     </div>

                     <div className="flex-1 min-w-0">
                         <div className="flex flex-wrap items-center gap-2 mb-1">
                             <span className={`text-sm font-bold ${isPrem ? 'text-orange-500' : 'text-gray-200'}`}>
                                 {comment.username}
                             </span>
                             
                             <div className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-[10px] font-mono font-bold text-gray-400">
                                 Lvl.{level}
                             </div>

                             {comment.isAdmin ? (
                                 <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-indigo-600 to-orange-600 text-[10px] font-bold text-white shadow-sm shadow-indigo-500/20">
                                     <div className="bg-white/20 rounded-full p-0.5"><Shield size={8} fill="currentColor" /></div>
                                     <span>ADMIN</span>
                                 </div>
                             ) : isPrem ? (
                                 <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-orange-500 to-yellow-500 text-[10px] font-bold text-black shadow-sm shadow-orange-500/20">
                                     <Crown size={10} fill="black" />
                                     <span>Miku Prime</span>
                                 </div>
                             ) : (
                                 <span className="bg-zinc-700 text-gray-300 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                     Miku Rookie
                                 </span>
                             )}

                             <span className="text-[10px] text-gray-600 ml-auto">
                                 {comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleDateString('id-ID') : 'Baru saja'}
                             </span>
                         </div>
                         
                         <p className="text-sm text-gray-300 leading-relaxed break-words font-light">
                             {comment.text}
                         </p>

                         {(currentUser && (currentUser.uid === comment.userId || currentUser.email === 'EMAIL_ADMIN_KAMU@gmail.com')) && (
                             <button onClick={() => openDeleteModal(comment.id)} className="text-[10px] text-red-500/50 hover:text-red-500 flex items-center gap-1 mt-2 transition-colors">
                                 <Trash2 size={10} /> Hapus
                             </button>
                         )}
                     </div>
                 </div>
             )}) : (
                 <div className="text-center text-gray-500 text-sm py-4">Belum ada komentar. Jadilah yang pertama!</div>
             )}
          </div>
        </div>

        {/* DELETE MODAL */}
        {deleteModal.show && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
                <div className="w-full max-w-xs bg-[#18181b] border border-white/10 rounded-2xl p-5 text-center">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Hapus Komentar?</h3>
                    <p className="text-xs text-gray-400 mb-6">Komentar yang dihapus tidak dapat dikembalikan lagi.</p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setDeleteModal({ show: false, commentId: null })}
                            className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-sm font-bold text-gray-300 hover:text-white"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700"
                        >
                            Hapus
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* SHARE MODAL CUSTOM */}
        {showShareModal && (
            <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 animate-in fade-in" onClick={() => setShowShareModal(false)}>
                <div className="w-full max-w-md bg-[#18181b] rounded-t-2xl p-5 animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-white font-bold text-lg">Bagikan ke...</h3>
                        <button onClick={() => setShowShareModal(false)} className="bg-[#27272a] px-3 py-1 rounded-full text-xs font-bold text-gray-400 hover:text-white">
                            Tutup
                        </button>
                    </div>
                    
                    <div className="relative">
                        <input 
                            readOnly 
                            value={window.location.href} 
                            className="w-full bg-[#27272a] text-gray-400 text-sm rounded-xl py-3 pl-4 pr-20 focus:outline-none border border-transparent focus:border-white/10"
                        />
                        <button 
                            onClick={copyToClipboard}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white/10 rounded-lg text-xs font-bold text-white hover:bg-white/20 transition-colors"
                        >
                            {copied ? "Disalin" : "Salin"}
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Watch;