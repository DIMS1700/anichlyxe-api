import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  X, 
  Heart, 
  ChevronRight, 
  Info, 
  Home, 
  Calendar, 
  Trophy, 
  BookOpen // Icon baru untuk Komik
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <div className="fixed inset-0 z-[60] flex">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>

      {/* Sidebar Content */}
      <div className={`relative w-4/5 max-w-xs h-full bg-[#111111] border-r border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#111111] z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-violet-500">Lyxe</span>Nime
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-8 no-scrollbar pb-24">

          {/* Menu Utama */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Menu Utama</h3>
            <div className="space-y-2">
              
              {/* Beranda: VIOLET */}
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-violet-500/5 border border-violet-500/20 hover:border-violet-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500 text-white rounded-lg shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                    <Home size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Beranda</span>
                    <span className="text-[10px] text-gray-400">Halaman Utama</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-500 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
              </Link>

              {/* FITUR BARU: KOMIK MANGA (ORANGE) */}
              <Link
                to="/manga"
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-500/5 border border-orange-500/20 hover:border-orange-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 text-white rounded-lg shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Komik & Manga</span>
                    <span className="text-[10px] text-gray-400">Baca Manhwa/Manga</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-500 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
              </Link>

              {/* Jadwal: GREEN */}
              <Link
                to="/schedule"
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 hover:border-green-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 text-white rounded-lg shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Jadwal Rilis</span>
                    <span className="text-[10px] text-gray-400">Update Harian</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-500 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
              </Link>

              {/* Ranking: YELLOW */}
              <Link
                to="/leaderboard"
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 hover:border-yellow-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500 text-white rounded-lg shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Top Ranking</span>
                    <span className="text-[10px] text-gray-400">Leaderboard XP</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-500 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" />
              </Link>

            </div>
          </div>

          {/* Menu Lainnya */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Menu Lainnya</h3>
            <div className="space-y-2">
              
              {/* Donasi: PINK */}
              <Link
                to="/donasi"
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-pink-500/10 to-pink-500/5 border border-pink-500/20 hover:border-pink-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500 text-white rounded-lg shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform">
                    <Heart size={18} fill="currentColor" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Donasi & Support</span>
                    <span className="text-[10px] text-gray-400">Dukung Server</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-500 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
              </Link>

              {/* Informasi: BLUE */}
              <Link
                to="/info"
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <Info size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Informasi</span>
                    <span className="text-[10px] text-gray-400">ToS, Privacy, dll</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-500 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </Link>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 text-center bg-[#111111]">
          <p className="text-[10px] text-gray-600">
            &copy; 2026 LyxeNime. Made with <Heart size={10} className="inline text-red-500 fill-red-500 mx-1" /> by Dimas.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;