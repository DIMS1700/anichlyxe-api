import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, PlayCircle, Layers, Info, Loader2 } from 'lucide-react';
import Layout from '../components/layout/Layout';

const DonghuaDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDetail = async () => {
      try {
        setLoading(true);
        // Panggil API Detail
        const res = await fetch(`https://anichlyxe-api.vercel.app/api/donghua/${slug}`);
        const result = await res.json();
        
        if (result.status === "success" && result.data) {
          setData(result.data);
        }
      } catch (err) {
        console.error("Detail Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  if (loading) return (
    <Layout>
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-500" size={40}/>
      </div>
    </Layout>
  );

  if (!data) return (
    <Layout>
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        Data Tidak Ditemukan
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
        {/* Banner */}
        <div className="relative h-[40vh] w-full overflow-hidden">
          <img src={data.image} className="w-full h-full object-cover opacity-30 blur-sm" alt="bg" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]" />
          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-50 p-2 bg-black/40 rounded-full border border-white/10">
            <ArrowLeft size={20}/>
          </button>
        </div>
        
        {/* Info Area */}
        <div className="px-4 -mt-32 relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
          <div className="w-40 md:w-56 mx-auto md:mx-0 shrink-0">
             <img src={data.image} className="w-full rounded-xl shadow-2xl shadow-violet-900/20 border border-white/10" alt={data.title} />
          </div>

          <div className="flex-1 text-center md:text-left mt-4">
            <h1 className="text-2xl font-black mb-2 leading-tight">{data.title}</h1>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-2 text-xs text-gray-400 mb-6">
               <span className="bg-white/10 px-2 py-1 rounded border border-white/5">{data.info?.status || "Unknown"}</span>
               <span className="bg-white/10 px-2 py-1 rounded border border-white/5">{data.info?.type || "Donghua"}</span>
               <span className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20">
                 <Star size={12} fill="currentColor"/> {data.rating || "N/A"}
               </span>
            </div>

            {/* TOMBOL NONTON UTAMA (Fixed Path) */}
             <div className="mb-6 flex justify-center md:justify-start">
                {data.episodes && data.episodes.length > 0 ? (
                  <Link 
                    // PERBAIKAN PENTING: Sesuai App.js => /donghua/watch/:slug
                    to={`/donghua/watch/${data.episodes[0].slug}`} 
                    className="inline-flex items-center gap-2 bg-violet-600 text-white px-8 py-3 rounded-full font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/30 hover:scale-105"
                  >
                    <PlayCircle size={20} fill="currentColor" /> Tonton Episode {data.episodes[0].episode}
                  </Link>
                ) : (
                  <span className="text-red-500 text-sm italic border border-red-500/20 bg-red-500/10 px-4 py-2 rounded-lg">
                    Episode belum tersedia
                  </span>
                )}
             </div>

             <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-left backdrop-blur-sm">
                <h3 className="text-xs font-bold text-violet-300 mb-2 flex items-center gap-2">
                  <Info size={14}/> SINOPSIS
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed text-justify opacity-90">
                  {data.synopsis}
                </p>
             </div>
             
             {/* Genre */}
             <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
               {data.genres && data.genres.map((genre, idx) => (
                 <span key={idx} className="text-[10px] px-3 py-1 bg-violet-500/10 text-violet-300 rounded-full border border-violet-500/20 hover:bg-violet-500/20 transition cursor-default">
                   {genre}
                 </span>
               ))}
             </div>
          </div>
        </div>

        {/* LIST EPISODE (Fixed Path) */}
        <div className="px-4 mt-12 max-w-5xl mx-auto">
           <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white border-l-4 border-violet-500 pl-3">
             <Layers size={20} className="text-violet-500"/> Daftar Episode
           </h3>
           <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {data.episodes?.map((ep, i) => (
                 <Link 
                   key={i} 
                   // PERBAIKAN PENTING: Sesuai App.js => /donghua/watch/:slug
                   to={`/donghua/watch/${ep.slug}`} 
                   className="bg-[#151515] hover:bg-violet-600 border border-white/5 hover:border-violet-500 p-3 rounded-xl flex flex-col items-center justify-center transition-all group hover:-translate-y-1 shadow-lg"
                 >
                    <span className="text-[10px] text-gray-500 group-hover:text-white/80 mb-1">Episode</span>
                    <span className="text-sm font-bold group-hover:text-white">{ep.episode}</span>
                 </Link>
              ))}
           </div>
        </div>
      </div>
    </Layout>
  );
};

export default DonghuaDetail;