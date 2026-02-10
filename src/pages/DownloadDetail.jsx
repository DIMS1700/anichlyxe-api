import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Download, ChevronDown, ChevronUp, FileVideo, HardDrive, ExternalLink, PlayCircle, X } from 'lucide-react';

// Komponen untuk menampilkan Link Download (Lazy Load)
const DownloadLinks = ({ type, id }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint = type === 'batch' 
          ? `https://animein.vercel.appanime/samehadaku/batch/${id}`
          : `https://animein.vercel.appanime/samehadaku/episode/${id}`;
          
        const res = await fetch(endpoint);
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError('Gagal memuat link.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, id]);

  if (loading) return <div className="p-4 text-center text-xs text-gray-500 animate-pulse">Memuat link download...</div>;
  if (error) return <div className="p-4 text-center text-xs text-red-500">{error}</div>;

  // Struktur data downloadList mungkin berbeda antara Episode dan Batch
  // Kita perlu menyesuaikan parsing-nya berdasarkan response API yang kita lihat tadi.
  // Asumsi: data.downloadList atau sejenisnya ada di root data.
  
  // Mencari array yang berisi format video (MP4/MKV/x265)
  const downloadData = data.downloadList || []; 

  if (!downloadData.length) return <div className="p-4 text-center text-xs text-gray-500">Tidak ada link download tersedia.</div>;

  return (
    <div className="space-y-4 p-4 bg-black/20 rounded-lg">
      {downloadData.map((format, idx) => (
        <div key={idx} className="space-y-2">
          <h4 className="text-sm font-bold text-blue-400 border-b border-white/10 pb-1 mb-2">
            {format.title}
          </h4>
          <div className="space-y-3">
            {format.qualities?.map((quality, qIdx) => (
              <div key={qIdx} className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-white bg-zinc-700 px-2 py-1 rounded min-w-[60px] text-center">
                  {quality.title}
                </span>
                <div className="flex flex-wrap gap-2">
                  {quality.urls?.map((link, lIdx) => (
                    <a 
                      key={lIdx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] flex items-center gap-1 bg-zinc-800 hover:bg-blue-600 text-gray-300 hover:text-white px-2 py-1 rounded transition-colors border border-white/5"
                    >
                      {link.title} <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const DownloadDetail = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('episode'); // 'episode' | 'batch'
  const [expandedItem, setExpandedItem] = useState(null); // ID item yang sedang dibuka link-nya

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`https://animein.vercel.appanime/samehadaku/anime/${id}`);
        const json = await res.json();
        setMovie(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <Layout>
         <div className="animate-pulse p-4 space-y-6">
             <div className="h-64 bg-zinc-800 rounded-xl w-full"></div>
             <div className="h-8 bg-zinc-800 rounded w-3/4"></div>
             <div className="space-y-2">
                 <div className="h-4 bg-zinc-800 rounded w-full"></div>
                 <div className="h-4 bg-zinc-800 rounded w-full"></div>
             </div>
         </div>
      </Layout>
    );
  }

  if (!movie) return <Layout><div className="p-10 text-center">Data tidak ditemukan</div></Layout>;

  return (
    <Layout>
      <div className="min-h-screen pb-24">
        {/* Hero Banner */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/80 to-[#0a0a0a] z-10"></div>
          <div 
             className="w-full h-[300px] bg-cover bg-center blur-sm opacity-50"
             style={{ backgroundImage: `url(${movie.poster})` }}
          ></div>
          
          <div className="absolute -bottom-10 left-0 right-0 z-20 px-5 flex items-end gap-4">
             <img 
               src={movie.poster} 
               alt={movie.title} 
               className="w-28 h-40 object-cover rounded-lg shadow-2xl border-2 border-zinc-800"
             />
             <div className="pb-2 flex-1">
                 <h1 className="text-xl font-bold text-white leading-tight line-clamp-2">{movie.title}</h1>
                 <div className="flex items-center gap-2 mt-2 text-xs text-gray-300">
                     <span className="bg-blue-600 px-2 py-0.5 rounded text-white">{movie.score?.value || 'N/A'}</span>
                     <span>{movie.status}</span>
                     <span>•</span>
                     <span>{movie.type}</span>
                 </div>
             </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-14 px-5">
           {/* Tabs */}
           <div className="flex items-center gap-4 border-b border-white/10 mb-6">
               <button 
                 onClick={() => setActiveTab('episode')}
                 className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'episode' ? 'text-blue-500' : 'text-gray-400'}`}
               >
                   Episode List
                   {activeTab === 'episode' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full"></div>}
               </button>
               <button 
                 onClick={() => setActiveTab('batch')}
                 className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'batch' ? 'text-blue-500' : 'text-gray-400'}`}
               >
                   Batch Download
                   {activeTab === 'batch' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full"></div>}
               </button>
           </div>

           {/* Episode List */}
           {activeTab === 'episode' && (
             <div className="space-y-3">
               {movie.episodeList?.length > 0 ? (
                 movie.episodeList.map((ep, idx) => (
                   <div key={idx} className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
                      <button 
                        onClick={() => setExpandedItem(expandedItem === ep.episodeId ? null : ep.episodeId)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                      >
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                 <PlayCircle size={16} />
                             </div>
                             <span className="text-sm font-medium text-white">Episode {ep.title}</span>
                         </div>
                         {expandedItem === ep.episodeId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      {expandedItem === ep.episodeId && (
                         <div className="border-t border-white/5">
                            <DownloadLinks type="episode" id={ep.episodeId} />
                         </div>
                      )}
                   </div>
                 ))
               ) : (
                 <div className="text-center text-gray-500 py-10">Belum ada episode.</div>
               )}
             </div>
           )}

           {/* Batch List */}
           {activeTab === 'batch' && (
             <div className="space-y-3">
               {movie.batchList?.length > 0 ? (
                 movie.batchList.map((batch, idx) => (
                    <div key={idx} className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
                      <button 
                        onClick={() => setExpandedItem(expandedItem === batch.batchId ? null : batch.batchId)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                      >
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500">
                                 <HardDrive size={16} />
                             </div>
                             <span className="text-sm font-medium text-white text-left line-clamp-1">{batch.title}</span>
                         </div>
                         {expandedItem === batch.batchId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      {expandedItem === batch.batchId && (
                         <div className="border-t border-white/5">
                            <DownloadLinks type="batch" id={batch.batchId} />
                         </div>
                      )}
                   </div>
                 ))
               ) : (
                 <div className="text-center text-gray-500 py-10 flex flex-col items-center gap-2">
                     <HardDrive size={32} className="opacity-20" />
                     <p>Batch belum tersedia.</p>
                     <p className="text-xs">Biasanya tersedia setelah anime tamat.</p>
                 </div>
               )}
             </div>
           )}
        </div>
      </div>
    </Layout>
  );
};

export default DownloadDetail;