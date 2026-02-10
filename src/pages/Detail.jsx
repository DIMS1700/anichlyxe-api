import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import HeroSection from '../components/detail/HeroSection';
import MetaInfo from '../components/detail/MetaInfo';
import EpisodeList from '../components/detail/EpisodeList';
import { useAnimeDetail } from '../hooks/useAnimeDetail';

const Detail = () => {
  const { id } = useParams();
  const { movie, episodes, loading, error } = useAnimeDetail(id);

  // Always force scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <Layout withBottomNav={false}>
        <div className="min-h-screen bg-[#0a0a0a] animate-pulse overflow-hidden">
           {/* Skeleton Hero */}
           <div className="relative w-full h-[450px] bg-zinc-900">
              <div className="absolute bottom-5 left-5 right-5 flex items-end gap-5">
                  {/* Poster Skeleton */}
                  <div className="w-32 aspect-[2/3] bg-zinc-800 rounded-lg shrink-0"></div>
                  {/* Title Info Skeleton */}
                  <div className="flex-1 space-y-3 pb-2">
                      <div className="w-20 h-4 bg-zinc-800 rounded"></div>
                      <div className="w-3/4 h-8 bg-zinc-800 rounded"></div>
                      <div className="flex gap-2">
                          <div className="w-12 h-4 bg-zinc-800 rounded"></div>
                          <div className="w-12 h-4 bg-zinc-800 rounded"></div>
                      </div>
                  </div>
              </div>
           </div>

           {/* Skeleton Buttons */}
           <div className="px-5 pt-6 pb-2 grid grid-cols-[1fr_auto_auto] gap-3">
              <div className="h-12 bg-zinc-900 rounded-lg w-full"></div>
              <div className="h-12 w-12 bg-zinc-900 rounded-lg"></div>
              <div className="h-12 w-12 bg-zinc-900 rounded-lg"></div>
           </div>

           {/* Skeleton Synopsis & Stats */}
           <div className="px-5 mt-6 space-y-4">
               <div className="w-full h-20 bg-zinc-900 rounded-xl"></div>
               <div className="grid grid-cols-2 gap-4">
                   <div className="h-10 bg-zinc-900 rounded-lg"></div>
                   <div className="h-10 bg-zinc-900 rounded-lg"></div>
                   <div className="h-10 bg-zinc-900 rounded-lg"></div>
                   <div className="h-10 bg-zinc-900 rounded-lg"></div>
               </div>
           </div>
        </div>
      </Layout>
    );
  }

  if (error || !movie) {
    return (
      <Layout withBottomNav={false}>
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Gagal Memuat</h2>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-white text-black font-bold rounded-full"
          >
            Coba Lagi
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout withBottomNav={false}>
      {/* Container utama dibuat minus margin agar menabrak layout parent jika ada padding */}
      <div className="min-h-screen bg-[#0a0a0a] -mx-4 -mt-4 pb-20 md:mx-0 md:mt-0"> 
        <HeroSection movie={movie} />
        <MetaInfo movie={movie} />
        <EpisodeList episodes={episodes} />
      </div>
    </Layout>
  );
};

export default Detail;