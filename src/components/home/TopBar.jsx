import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Key, Bell, User, BookOpen } from 'lucide-react';
import { onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { auth } from '../../lib/firebase';

// Menerima props 'theme' untuk otomatis ganti warna
const TopBar = ({ theme = 'violet' }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotif, setShowNotif] = useState(true);
  const db = getFirestore();

  // Cek apakah mode Manga (Orange)
  const isManga = theme === 'orange';

  // --- KONFIGURASI WARNA DINAMIS ---
  const colors = {
    // Ikon & Teks
    iconColor: isManga ? 'text-orange-500' : 'text-violet-500', 
    xpText: isManga ? 'text-orange-500' : 'text-violet-500',
    
    // Background Bulat Ikon (Keys/Book)
    iconBg: isManga ? 'bg-orange-600' : 'bg-violet-500',
    
    // Hover Nama User
    userHover: isManga ? 'group-hover:text-orange-500' : 'group-hover:text-violet-500',
    
    // Tombol Download/Baca
    btnBg: isManga ? 'bg-orange-600 hover:bg-orange-500' : 'bg-violet-600 hover:bg-violet-500',
    
    // Efek Glow di Notifikasi
    glow: isManga ? 'bg-orange-500/20' : 'bg-violet-500/20',
    borderIcon: isManga ? 'border-orange-500/30' : 'border-violet-500/30',
    iconBoxBg: isManga ? 'bg-orange-500/10' : 'bg-violet-500/10',
  };

  useEffect(() => {
    let unsubscribeDoc = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) setUserData(docSnap.data());
        });
      } else { setUserData(null); }
    });
    return () => { unsubscribeAuth(); unsubscribeDoc(); };
  }, []);

  const xp = userData?.xp || 0;
  const level = Math.floor(xp / 10) + 1;
  const progressPercent = (xp % 10) * 10;
  const formatXP = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return val;
  };

  return (
    <div className="flex flex-col mb-6 pt-2">
      <div className="flex items-center justify-between">
        
        {/* KIRI: XP / KEYS */}
        <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 shadow-sm">
          <div className={`${colors.iconBg} p-1 rounded-full text-black`}>
            {isManga ? <BookOpen size={14} fill="currentColor" /> : <Key size={14} fill="currentColor" />}
          </div>
          <span className={`font-bold text-sm ${colors.xpText}`}>{formatXP(xp)} XP</span>
        </div>

        {/* KANAN: User Profile & Notif */}
        <div className="flex items-center gap-3">
          <Link to={user ? "/profile" : "/login"} className="flex items-center gap-3 group">
              {loading ? (
                  <div className="flex flex-col items-end gap-1">
                      <div className="h-4 w-20 bg-white/10 rounded animate-pulse"></div>
                      <div className="h-2 w-12 bg-white/10 rounded animate-pulse"></div>
                  </div>
              ) : (
                  <div className="flex flex-col items-end">
                    <span className={`text-sm font-bold leading-none text-white ${colors.userHover} transition-colors`}>
                        {user ? (user.displayName || 'User') : 'Tamu'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                      {user ? `Level ${level} (${progressPercent}%)` : 'Ketuk untuk Login'}
                    </span>
                  </div>
              )}
              
              {loading ? (
                  <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse border-2 border-transparent"></div>
              ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-[#1e1e1e] flex items-center justify-center overflow-hidden shadow-md">
                     {user && user.photoURL ? (
                         <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                         <User size={20} className="text-gray-400" />
                     )}
                  </div>
              )}
          </Link>

          <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
            <Bell size={20} className="text-white" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#111111]"></span>
          </button>
        </div>
      </div>

      {/* NOTIFIKASI (BAGIAN YANG DIPERBAIKI TRANSPARANSINYA) */}
      {showNotif && (
        <div className="w-full mt-4 animate-in slide-in-from-top-2 duration-300">
          {/* PERUBAHAN DISINI: 
             - Hapus bg-gradient-to-r from-[#1a1a1a]...
             - Ganti jadi bg-white/5 (Transparan)
          */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-xl p-4 relative overflow-hidden group shadow-lg">
            
            {/* Background Glow Halus di Pojok */}
            <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 rounded-full blur-3xl opacity-20 ${colors.iconBg} transition-colors`}></div>

            <button onClick={() => setShowNotif(false)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-gray-400 hover:text-white transition-colors z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <div className="flex items-start gap-4 relative z-0">
              {/* Kotak Ikon Kiri */}
              <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center border ${colors.iconBoxBg} ${colors.borderIcon}`}>
                {isManga ? <BookOpen className={colors.iconColor} size={24} /> : <Bell className={colors.iconColor} size={24} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white mb-1">
                    {isManga ? 'Manga Library Updated!' : 'Update LyxeNime V2 Coming Soon!'}
                </h3>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                  {isManga ? 'Baca chapter terbaru dengan tampilan fresh & cepat.' : 'Versi V2 akan segera hadir dengan fitur baru.'}
                </p>
                
                {/* Tombol Action */}
                <div className="flex flex-wrap gap-2">
                  <a href={isManga ? "/manga/latest" : "#"} className={`inline-flex items-center gap-2 px-3 py-2 ${colors.btnBg} text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-lg`}>
                    {isManga ? <BookOpen size={14} /> : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>}
                    {isManga ? 'Mulai Baca' : 'Download'}
                  </a>
                  
                  {!isManga && (
                      <a href="https://chat.whatsapp.com/BoRxAA8ox5GC7MD7EJfi31?mode=gi_t" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-green-900/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        Join WA
                      </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopBar;