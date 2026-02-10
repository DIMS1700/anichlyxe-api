import React from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/home/TopBar';
import PremiumBanner from '../components/home/PremiumBanner';
import FeaturedCarousel from '../components/home/FeaturedCarousel';
import SearchBar from '../components/home/SearchBar';
import FloatingWidget from '../components/home/FloatingWidget';
import HorizontalAnimeList from '../components/home/HorizontalAnimeList';
import GenreList from '../components/home/GenreList'; // Import File Baru Tadi
import { useHomeData } from '../hooks/useHomeData';

const Home = () => {
  const { data, loading, error } = useHomeData();

  if (loading) {
    return (
      <Layout>
        <div className="px-4 pt-4">
            <TopBar />
            <div className="animate-pulse space-y-6 mt-4">
               <div className="w-full h-48 bg-white/5 rounded-2xl"></div>
               <div className="w-full h-12 bg-white/5 rounded-2xl"></div>
               <div className="flex gap-4 overflow-hidden">
                 {[1,2,3].map(i => <div key={i} className="w-[140px] h-[200px] bg-white/5 rounded-xl"></div>)}
               </div>
            </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <p className="text-red-400 mb-2">Gagal memuat data</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-orange-600 rounded-lg text-sm font-bold text-white">
            Coba Lagi
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 pt-4 pb-24 space-y-8 bg-[#121212] min-h-screen text-white font-sans">
          
          <TopBar />

          <PremiumBanner />
          
          <FeaturedCarousel data={data?.popular} />
          
          <SearchBar />
          
          <FloatingWidget />

          {/* LIST ANIME */}
          {data?.hot && <HorizontalAnimeList title="Sedang Hangat" items={data.hot} seeAllLink="/hot" />}
          {data?.schedule?.list && <HorizontalAnimeList title="Episode Baru" items={data.schedule.list} seeAllLink="/schedule" />}
          {data?.popular && <HorizontalAnimeList title="Paling Populer" items={data.popular} seeAllLink="/popular" />}
          {data?.waiting && <HorizontalAnimeList title="Segera Tayang" items={data.waiting} seeAllLink="/upcoming" />}
          {data?.just_for_you && <HorizontalAnimeList title="Rekomendasi Buat Kamu" items={data.just_for_you} seeAllLink="/recommended" />}

          {/* 🔥 GENRE LIST (PASTI MUNCUL SEKARANG) 🔥 */}
          <GenreList />

      </div>
    </Layout>
  );
};

export default Home;