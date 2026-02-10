import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { ArrowLeft, ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react';

const MangaRead = () => {
  const { slug } = useParams(); // Ini adalah ID Chapter (UUID)
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mangaSlug = queryParams.get('manga'); // ID Series

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUI, setShowUI] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const lastScrollY = useRef(0);

  const API_BASE = "https://komikdebe.vercel.app";

  useEffect(() => {
    const fetchChapter = async () => {
      if (!slug) return;
      setLoading(true); setError(null); setData(null);
      
      try {
        // Fetch ke endpoint chapter dengan ID
        const response = await fetch(`${API_BASE}/chapter/${slug}`);
        const result = await response.json();
        
        // Sesuai JSON pertama: result.data berisi images array
        if (result.status && result.data) {
            setData(result.data);
        } else {
            throw new Error("Gagal memuat gambar");
        }
      } catch (err) {
        console.error(err);
        setError("Gagal memuat gambar chapter.");
      } finally {
        setLoading(false);
      }
    };
    fetchChapter();
    window.scrollTo(0, 0);
  }, [slug]);

  // Handle Scroll UI
  useEffect(() => {
    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY < lastScrollY.current || currentScrollY < 100) {
            setShowUI(true);
        } else {
            setShowUI(false);
        }
        setShowScrollTop(currentScrollY > 500);
        lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Navigasi Next/Prev menggunakan ID langsung dari JSON
  const handleNext = () => {
      if (data?.next_chapter) {
          navigate(`/manga/read/${data.next_chapter}?manga=${mangaSlug}`);
      }
  };

  const handlePrev = () => {
      if (data?.prev_chapter) {
          navigate(`/manga/read/${data.prev_chapter}?manga=${mangaSlug}`);
      }
  };

  if (loading) return <div className="min-h-screen bg-[#111] flex items-center justify-center text-white"><div className="animate-spin w-8 h-8 border-4 border-orange-500 rounded-full border-t-transparent"></div></div>;
  if (error) return <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center text-gray-400 gap-4"><p>{error}</p><button onClick={() => navigate(-1)} className="text-orange-500">Kembali</button></div>;

  // Sesuai JSON: images adalah array of strings di dalam data
  const images = data?.images || [];

  return (
    <Layout withBottomNav={false}>
      <div className="bg-[#111] min-h-screen relative">
        
        {/* Top Header */}
        <div className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${showUI ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="bg-black/90 backdrop-blur-md border-b border-white/5 px-4 h-14 flex items-center justify-between shadow-xl">
                <button onClick={() => navigate(`/manga/${mangaSlug}`)} className="p-2 bg-white/5 rounded-full text-white"><ArrowLeft size={20} /></button>
                <h1 className="text-xs font-bold text-white truncate max-w-[60%]">{data.title}</h1>
                <div className="w-9"></div> 
            </div>
        </div>

        {/* Image Renderer */}
        <div className="w-full flex flex-col min-h-screen pt-0 pb-20 bg-[#111]" onClick={() => setShowUI(!showUI)}>
            {images.map((imgUrl, idx) => (
                <img 
                    key={idx} 
                    src={imgUrl} 
                    alt={`Page ${idx + 1}`} 
                    className="w-full h-auto block max-w-4xl mx-auto" 
                    loading="lazy" 
                    onError={(e) => { e.target.style.display='none'; }} 
                />
            ))}
        </div>

        {/* Scroll Top Button */}
        <button onClick={scrollToTop} className={`fixed bottom-24 right-4 z-40 p-3 bg-orange-600 text-white rounded-full shadow-lg transition-all ${showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}><ArrowUp size={20} /></button>

        {/* Bottom Navigation */}
        <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${showUI ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="bg-black/90 backdrop-blur-md border-t border-white/5 p-4 pb-safe flex gap-4 justify-center">
                <button 
                    onClick={handlePrev} 
                    // Tombol Prev disabled jika prev_chapter null/kosong
                    disabled={!data.prev_chapter} 
                    className={`flex-1 py-3 rounded-xl font-bold text-xs flex justify-center items-center gap-2 ${!data.prev_chapter ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    <ChevronLeft size={16}/> Prev
                </button>
                
                <button 
                    onClick={handleNext} 
                    // Tombol Next disabled jika next_chapter null/kosong
                    disabled={!data.next_chapter} 
                    className={`flex-1 py-3 rounded-xl font-bold text-xs flex justify-center items-center gap-2 ${!data.next_chapter ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
                >
                    Next <ChevronRight size={16}/>
                </button>
            </div>
        </div>

      </div>
    </Layout>
  );
};

export default MangaRead;