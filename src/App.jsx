import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Watch from './pages/Watch';

// --- PERBAIKAN IMPORT DI SINI ---
import SearchPage from './pages/Search'; 

import Schedule from './pages/Schedule';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Premium from './pages/Premium';
import Admin from './pages/Admin';
import AdminUsers from './pages/AdminUsers';
import Donasi from './pages/Donasi';
import InfoPage from './pages/Info';
import Leaderboard from './pages/Leaderboard';
import Manga from './pages/Manga';
import MangaDetail from './pages/MangaDetail';
import MangaRead from './pages/MangaRead';
import MangaGenre from './pages/MangaGenre';
import MangaSearch from './pages/MangaSearch'; // 🔥 Added MangaSearch Import
import GenreDetail from './pages/GenreDetail';
import ChatRoom from './pages/ChatRoom';
import Dracin from './pages/Dracin';
import DracinDetail from './pages/DracinDetail';
import DracinWatch from './pages/DracinWatch';
import DracinSearch from './pages/DracinSearch';
import Download from './pages/Download';
import DownloadDetail from './pages/DownloadDetail';
import BatchDetail from './pages/BatchDetail';
import Hentai from './pages/Hentai';
import HentaiDetail from './pages/HentaiDetail';
import HentaiWatch from './pages/HentaiWatch';
import Restricted from './pages/Restricted';
import PremiumGuard from './components/PremiumGuard';

// IMPORT DONGHUA PAGES
import Donghua from './pages/Donghua';
import DonghuaDetail from './pages/DonghuaDetail';
import DonghuaWatch from './pages/DonghuaWatch';
import DonghuaSearch from './pages/DonghuaSearch'; 

import History from './pages/History';
import Bookmarks from './pages/Bookmarks';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        
        {/* --- ROUTE SEARCH UTAMA --- */}
        <Route path="/search" element={<SearchPage />} />
        {/* --------------------------- */}

        <Route path="/schedule" element={<Schedule />} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/watch/:id" element={<Watch />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/restricted" element={<Restricted />} />
        
        {/* Donghua Routes */}
        <Route path="/donghua" element={<Donghua />} />
        <Route path="/donghua/search" element={<DonghuaSearch />} />
        <Route path="/donghua/:slug" element={<DonghuaDetail />} />
        <Route path="/donghua/watch/:slug" element={<DonghuaWatch />} />

        {/* Feature Routes */}
        <Route path="/hentai" element={
          <PremiumGuard>
            <Hentai />
          </PremiumGuard>
        } />
        <Route path="/hentai/detail/:slug" element={
          <PremiumGuard>
            <HentaiDetail />
          </PremiumGuard>
        } />
        <Route path="/hentai/watch/:slug" element={
          <PremiumGuard>
            <HentaiWatch />
          </PremiumGuard>
        } />
        <Route path="/chat" element={<ChatRoom />} />
        <Route path="/dracin" element={<Dracin />} />
        <Route path="/dracin/search" element={<DracinSearch />} />
        <Route path="/dracin/:slug" element={<DracinDetail />} />
        <Route path="/dracin/watch/:slug/:index" element={<DracinWatch />} />
        
        {/* Download Routes */}
        <Route path="/download" element={<Download />} />
        <Route path="/download/:id" element={<DownloadDetail />} />
        <Route path="/download/batch/:id" element={<BatchDetail />} />

        {/* Manga Routes */}
        <Route path="/manga" element={<Manga />} />
        <Route path="/manga/search" element={<MangaSearch />} /> {/* 🔥 Added Manga Search Route */}
        <Route path="/manga/:slug" element={<MangaDetail />} />
        <Route path="/manga/read/:slug" element={<MangaRead />} />
        <Route path="/manga/genre/:slug" element={<MangaGenre />} />
        
        <Route path="/genre/:id" element={<GenreDetail />} />
        <Route path="/donasi" element={<Donasi />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        
        {/* Admin Route */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/users" element={<AdminUsers />} />

        {/* Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;