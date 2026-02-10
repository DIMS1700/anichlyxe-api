import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Download, ExternalLink, Calendar, Star, Clock, Layers } from 'lucide-react';

const BatchDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'samehadaku';
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = source === 'kusonime' 
           ? `https://animein.vercel.appanime/kusonime/detail/${id}`
           : `https://animein.vercel.appanime/samehadaku/batch/${id}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Gagal mengambil data');
        const json = await res.json();
        
        if (source === 'kusonime') {
            setData(json.detail);
        } else {
            setData(json.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, source]);

  if (loading) {
    return (
      <Layout>
         <div className="animate-pulse p-4 space-y-6">
             <div className="h-64 bg-zinc-800 rounded-xl w-full"></div>
             <div className="h-8 bg-zinc-800 rounded w-3/4"></div>
         </div>
      </Layout>
    );
  }

  if (error || !data) {
      return (
          <Layout>
              <div className="p-10 text-center text-gray-500">Data tidak ditemukan atau terjadi kesalahan.</div>
          </Layout>
      )
  }

  // Normalisasi Data untuk Tampilan
  const isKusonime = source === 'kusonime';
  const title = isKusonime ? data.title : data.title.replace(' [BATCH]', '');
  const poster = data.poster;
  const score = isKusonime ? data.info?.score : data.score;
  const episodes = isKusonime ? data.info?.total_episode : data.episodes;
  const duration = isKusonime ? data.info?.duration : data.duration;
  const status = isKusonime ? data.info?.status : data.status;
  const season = isKusonime ? '-' : data.season; // Kusonime jarang ada info season eksplisit di root
  const releasedOn = isKusonime ? data.info?.released : data.releasedOn;
  const synopsis = isKusonime ? data.synopsis : data.synopsis?.paragraphs?.join('\n\n');

  return (
    <Layout>
      <div className="min-h-screen pb-24">
        {/* Header / Hero */}
        <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/90 to-[#0a0a0a] z-10"></div>
             <div 
                className="w-full h-[350px] bg-cover bg-center opacity-40 blur-sm"
                style={{ backgroundImage: `url(${poster})` }}
             ></div>
             
             <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-6 flex gap-5 items-end">
                 <img 
                   src={poster} 
                   alt={title} 
                   className="w-32 aspect-[2/3] object-cover rounded-lg shadow-2xl border border-zinc-700"
                 />
                 <div className="flex-1 pb-1">
                     <h1 className="text-lg font-bold text-white leading-tight mb-2">
                         {title}
                     </h1>
                     <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                         {score && (
                            <div className="flex items-center gap-1 text-yellow-400">
                                <Star size={12} fill="currentColor" />
                                <span className="font-bold">{score}</span>
                            </div>
                         )}
                         {episodes && (
                            <div className="flex items-center gap-1">
                                <Layers size={12} />
                                <span>{episodes}Eps</span>
                            </div>
                         )}
                         {duration && (
                            <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>{duration}</span>
                            </div>
                         )}
                     </div>
                 </div>
             </div>
        </div>

        {/* Content */}
        <div className="px-5 mt-4 space-y-6">
            
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-400 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                <div>
                    <span className="block text-gray-600 mb-1">Status</span>
                    <span className="text-white font-medium">{status || '-'}</span>
                </div>
                <div>
                    <span className="block text-gray-600 mb-1">Season</span>
                    <span className="text-white font-medium">{season || '-'}</span>
                </div>
                <div>
                    <span className="block text-gray-600 mb-1">Type</span>
                    <span className="text-white font-medium line-clamp-1">{isKusonime ? data.info?.type : data.type}</span>
                </div>
                <div>
                    <span className="block text-gray-600 mb-1">Rilis</span>
                    <span className="text-white font-medium">{releasedOn || '-'}</span>
                </div>
            </div>

            {/* Synopsis */}
            {synopsis && (
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white">Sinopsis</h3>
                    <div className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">
                        {synopsis}
                    </div>
                </div>
            )}

            {/* Download Links */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                    <Download size={16} className="text-blue-500" /> Link Download Batch
                </h3>
                
                {/* Logic Rendering Link Berbeda tiap Source */}
                {isKusonime ? (
                    // Kusonime Render Logic
                    data.download_links?.length > 0 ? (
                        <div className="space-y-4">
                            {data.download_links.map((group, idx) => (
                                <div key={idx} className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                                    <h4 className="text-sm font-bold text-violet-400 mb-3 line-clamp-2">{group.resolution}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {group.links?.map((link, lIdx) => (
                                            <a 
                                                key={lIdx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white rounded-lg text-[10px] font-medium transition-all border border-violet-600/20"
                                            >
                                                {link.host} <ExternalLink size={10} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 bg-zinc-900 rounded-lg text-center text-xs text-gray-500">Link download belum tersedia.</div>
                    )
                ) : (
                    // Samehadaku Render Logic
                    data.downloadUrl?.formats?.length > 0 ? (
                        <div className="space-y-6">
                            {data.downloadUrl.formats.map((format, idx) => (
                                <div key={idx} className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                                    <h4 className="text-sm font-bold text-blue-400 mb-4">{format.title}</h4>
                                    <div className="space-y-4">
                                        {format.qualities?.map((quality, qIdx) => (
                                            <div key={qIdx} className="flex flex-col gap-2 border-b border-white/5 last:border-0 pb-3 last:pb-0">
                                                <span className="text-xs font-semibold text-white bg-zinc-800 px-2 py-1 rounded w-fit">
                                                    {quality.title}
                                                </span>
                                                <div className="flex flex-wrap gap-2">
                                                    {quality.urls?.map((link, lIdx) => (
                                                        <a 
                                                          key={lIdx}
                                                          href={link.url}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-[10px] font-medium transition-all border border-blue-600/20"
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
                    ) : (
                        <div className="p-4 bg-zinc-900 rounded-lg text-center text-xs text-gray-500">Link download belum tersedia.</div>
                    )
                )}
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default BatchDetail;