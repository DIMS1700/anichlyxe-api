import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../lib/firebase';
import Layout from '../components/layout/Layout';
import { Calendar, User, ArrowLeft, Share2, PlayCircle, Bookmark, Check, Star, ChevronDown, Loader, Info, List } from 'lucide-react';

const MangaDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const db = getFirestore();
  
  const [detail, setDetail] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const API_BASE = "https://komikdebe.vercel.app";

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/series/${slug}`);
        const result = await response.json();
        
        if (result.status && result.data) {
            setDetail(result.data);
            setChapters(result.data.chapters || []);
            
            if (result.data.pagination) {
                setHasNextPage(result.data.pagination.nextPage !== null);
                setCurrentPage(result.data.pagination.currentPage);
            }
        } else {
            throw new Error("Data tidak ditemukan");
        }
      } catch (err) {
        console.error("Error:", err);
        setError("Gagal memuat detail komik.");
      } finally {
        setLoading(false);
      }
    };
    if (slug && slug !== '#') fetchDetail();
  }, [slug]);

  const handleLoadMoreChapters = async () => {
      if (!hasNextPage || loadingMore) return;
      setLoadingMore(true);
      const nextPage = currentPage + 1;

      try {
          const response = await fetch(`${API_BASE}/series/${slug}?page=${nextPage}`);
          const result = await response.json();

          if (result.status && result.data && result.data.chapters) {
              setChapters(prev => [...prev, ...result.data.chapters]);
              
              if (result.data.pagination) {
                  setHasNextPage(result.data.pagination.nextPage !== null);
                  setCurrentPage(result.data.pagination.currentPage);
              } else {
                  setHasNextPage(false);
              }
          }
      } catch (err) {
          console.error("Gagal memuat chapter tambahan:", err);
      } finally {
          setLoadingMore(false);
      }
  };

  // Firebase Logic
  const [user, setUser] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && slug) checkBookmark(currentUser.uid, slug);
    });
    return () => unsubscribe();
  }, [slug]);

  const checkBookmark = async (uid, mangaSlug) => {
      try {
          const docRef = doc(db, "users", uid, "manga_bookmarks", mangaSlug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) setIsBookmarked(true);
      } catch (err) { console.error(err); }
  };

  const handleBookmark = async () => {
      if (!user) { navigate('/login'); return; }
      setBookmarkLoading(true);
      const docRef = doc(db, "users", user.uid, "manga_bookmarks", slug);
      try {
          if (isBookmarked) {
              await deleteDoc(docRef);
              setIsBookmarked(false);
          } else {
              await setDoc(docRef, {
                  mangaId: slug,
                  title: detail.title,
                  image: detail.image,
                  type: 'Manga',
                  createdAt: serverTimestamp(),
                  lastChapter: chapters?.[0]?.title || '-',
                  status: detail.info?.status === 1 ? 'Ongoing' : 'Completed'
              });
              setIsBookmarked(true);
          }
      } catch (err) { alert("Error: " + err.message); } 
      finally { setBookmarkLoading(false); }
  };

  if (loading) return (
      <Layout withBottomNav={false}>
          <div className="bg-[#0a0a0a] min-h-screen pt-20 px-4 max-w-6xl mx-auto animate-pulse">
              <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-1/3 h-[400px] bg-white/5 rounded-xl"></div>
                  <div className="w-full md:w-2/3 space-y-4">
                      <div className="h-8 bg-white/5 rounded w-3/4"></div>
                      <div className="h-4 bg-white/5 rounded w-full"></div>
                      <div className="h-4 bg-white/5 rounded w-1/2"></div>
                  </div>
              </div>
          </div>
      </Layout>
  );

  if (error || !detail) return <Layout><div className="text-white text-center pt-20">Data Error atau Tidak Ditemukan</div></Layout>;

  const firstChapterAvailable = chapters.length > 0 ? chapters[chapters.length - 1] : null;

  return (
    <Layout withBottomNav={false}>
      {/* Background Blur untuk efek visual */}
      <div className="fixed inset-0 z-0">
          <img src={detail.image} className="w-full h-full object-cover opacity-10 blur-[80px]" alt="bg" />
          <div className="absolute inset-0 bg-[#0a0a0a]/80"></div>
      </div>

      <div className="relative z-10 min-h-screen pb-20 text-white">
        
        {/* Navbar Custom */}
        <div className="sticky top-0 z-50 px-4 py-3 flex justify-between items-center bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
            <button onClick={() => navigate('/manga')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft size={20}/></button>
            <h1 className="text-sm font-bold truncate max-w-[60%] opacity-0 md:opacity-100 transition-opacity">{detail.title}</h1>
            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><Share2 size={20}/></button>
        </div>

        {/* Main Content Container (BOXED LAYOUT) */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
            
            <div className="flex flex-col md:flex-row gap-8">
                
                {/* KOLOM KIRI: Cover & Info Utama */}
                <div className="w-full md:w-[300px] flex-shrink-0 flex flex-col gap-4">
                    <div className="aspect-[3/4.5] rounded-xl overflow-hidden shadow-2xl border border-white/10 relative group">
                        <img src={detail.image} alt={detail.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2">
                             <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${detail.info?.status === 1 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                {detail.info?.status === 1 ? 'ONGOING' : 'COMPLETED'}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {firstChapterAvailable && (
                        <Link to={`/manga/read/${firstChapterAvailable.id}?manga=${slug}`} className="flex-1 py-3 bg-white text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
                            <PlayCircle size={18} fill="currentColor" /> Baca
                        </Link>
                        )}
                        <button onClick={handleBookmark} disabled={bookmarkLoading} className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${isBookmarked ? 'bg-green-900/50 text-green-400 border-green-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                            {isBookmarked ? <Check size={18}/> : <Bookmark size={18}/>}
                        </button>
                    </div>

                    {/* Info Table Kecil */}
                    <div className="bg-white/5 rounded-xl p-4 space-y-3 text-sm border border-white/5">
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                            <span className="text-gray-400 flex items-center gap-2"><Star size={14} className="text-yellow-500"/> Rating</span>
                            <span className="font-bold text-yellow-500">{detail.info?.rating || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                            <span className="text-gray-400 flex items-center gap-2"><User size={14}/> Author</span>
                            <span className="font-medium truncate max-w-[120px]">{detail.author || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 flex items-center gap-2"><Calendar size={14}/> Rilis</span>
                            <span className="font-medium">{detail.release || detail.year || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* KOLOM KANAN: Detail & Chapter */}
                <div className="flex-1">
                    {/* Judul & Genre */}
                    <div className="mb-6">
                        <h1 className="text-2xl md:text-4xl font-black leading-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                            {detail.title}
                        </h1>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {detail.genres && detail.genres.map((genre, idx) => (
                                <span key={idx} className="px-3 py-1 bg-white/10 border border-white/10 rounded-full text-xs font-medium text-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors cursor-default">
                                    {genre}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Sinopsis */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-2 text-white"><Info size={18} className="text-orange-500"/> Sinopsis</h3>
                        <div className={`text-sm text-gray-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 ${!isDescExpanded ? 'line-clamp-4' : ''}`} onClick={() => setIsDescExpanded(!isDescExpanded)}>
                            {detail.synopsis || 'Tidak ada sinopsis tersedia.'}
                        </div>
                        <button onClick={() => setIsDescExpanded(!isDescExpanded)} className="text-xs font-bold text-orange-500 mt-2 hover:underline">
                            {isDescExpanded ? 'Sembunyikan' : 'Baca Selengkapnya'}
                        </button>
                    </div>

                    {/* Chapter List */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2"><List size={18} className="text-orange-500"/> Daftar Chapter</h3>
                            <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">{chapters.length} Chapter</span>
                        </div>
                        
                        {/* Grid Chapter (2 Kolom di Desktop biar rapi) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {chapters.map((chap, idx) => (
                                <Link key={`${chap.id}-${idx}`} to={`/manga/read/${chap.id}?manga=${slug}`} className="group p-3 bg-[#151515] border border-white/5 rounded-xl flex justify-between items-center hover:bg-white/10 hover:border-orange-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                            #
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-200 group-hover:text-orange-400 transition-colors line-clamp-1">{chap.title}</h4>
                                            <p className="text-[10px] text-gray-500">{chap.time}</p>
                                        </div>
                                    </div>
                                    <PlayCircle size={16} className="text-gray-600 group-hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110"/>
                                </Link>
                            ))}
                        </div>

                        {/* Load More Button */}
                        {hasNextPage && (
                            <button 
                                onClick={handleLoadMoreChapters} 
                                disabled={loadingMore}
                                className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/10 flex items-center justify-center gap-2 transition-all"
                            >
                                {loadingMore ? (
                                    <><Loader size={16} className="animate-spin" /> Sedang memuat...</>
                                ) : (
                                    <><ChevronDown size={16} /> Muat Lebih Banyak Chapter</>
                                )}
                            </button>
                        )}
                        
                        {!hasNextPage && chapters.length > 0 && (
                            <div className="mt-6 p-4 bg-white/5 rounded-xl text-center">
                                <p className="text-xs text-gray-500">Anda sudah mencapai chapter awal.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default MangaDetail;