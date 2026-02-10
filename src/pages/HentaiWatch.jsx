import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, AlertCircle, Share2 } from 'lucide-react';
import Layout from '../components/layout/Layout';

const DonghuaWatch = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatch = async () => {
      try {
        setLoading(true);
        const res = await fetch(`https://anichlyxe-api.vercel.app/api/watch/${slug}`);
        const result = await res.json();
        if (result.status) setData(result.data);
      } catch (err) {
        console.error("Watch fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWatch();
  }, [slug]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#020617] text-white">
        {/* Header Bar */}
        <div className="p-4 flex items-center gap-4 border-b border-white/5 bg-[#020617]/90 backdrop-blur-xl sticky top-0 z-50">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded-full"><ArrowLeft /></button>
          <div className="flex-1 min-w-0">
             <h1 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sekarang Menonton</h1>
             <p className="text-sm font-bold truncate text-cyan-400">{slug.replace(/-/g, ' ')}</p>
          </div>
        </div>

        {/* Video Player Section */}
        <div className="aspect-video w-full bg-black shadow-2xl relative group">
          {loading ? (
             <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 animate-pulse">
                <PlayCircle size={48} className="text-white/20" />
             </div>
          ) : data?.stream_url ? (
            <iframe 
                src={data.stream_url} 
                className="w-full h-full" 
                allowFullScreen 
                title="Donghua Player"
                scrolling="no"
                frameBorder="0"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2 p-6 text-center">
                <AlertCircle size={40} className="text-red-500" />
                <p className="text-sm font-bold">Link Streaming Gagal Dimuat</p>
            </div>
          )}
        </div>

        {/* Info & Controls */}
        <div className="p-6">
           <div className="flex justify-between items-start mb-6">
               <h2 className="text-lg font-black italic tracking-tight">Kualitas Streaming HD</h2>
               <button className="flex items-center gap-2 text-xs bg-white/5 px-4 py-2 rounded-full border border-white/10">
                   <Share2 size={14} /> Bagikan
               </button>
           </div>
           
           <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl">
                <p className="text-xs text-cyan-200 leading-relaxed">
                    <span className="font-bold">Tips:</span> Gunakan server alternatif jika video lambat atau gunakan mode Premium untuk kecepatan maksimal tanpa gangguan.
                </p>
           </div>
        </div>
      </div>
    </Layout>
  );
};

export default DonghuaWatch;