import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../lib/firebase';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Trophy, Crown, User, Star, Shield, Lock, LogIn } from 'lucide-react';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchLeaderboard();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(10));
      const snapshot = await getDocs(q);
      const topUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(topUsers);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown size={24} className="text-yellow-500 fill-yellow-500 animate-pulse" />;
    if (index === 1) return <Trophy size={20} className="text-gray-300 fill-gray-300" />;
    if (index === 2) return <Trophy size={20} className="text-amber-700 fill-amber-700" />;
    return <span className="text-lg font-bold text-gray-500 font-mono w-6 text-center">#{index + 1}</span>;
  };

  const getRankStyle = (index) => {
      if (index === 0) return "bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/30 shadow-lg shadow-yellow-500/10";
      if (index === 1) return "bg-gradient-to-r from-gray-300/10 to-gray-300/5 border-gray-300/20";
      if (index === 2) return "bg-gradient-to-r from-amber-700/10 to-amber-700/5 border-amber-700/20";
      return "bg-[#18181b] border-white/5";
  };

  const getUserBadge = (user) => {
    if (user.role === 'admin') {
        return (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                <Shield size={10} fill="currentColor" /> Admin
            </span>
        );
    }
    if (user.isPremium) {
        return (
                          <span className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                            <Crown size={10} fill="currentColor" /> Miku Prime
                          </span>
        );
    }
    return (
                          <span className="text-[10px] text-gray-500 font-bold bg-zinc-800 px-2 py-0.5 rounded border border-white/5">
                            Miku Rookie
                          </span>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen pb-10 pt-4">
        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-yellow-500/20">
                <Trophy size={32} className="text-yellow-500" />
            </div>
            <h1 className="text-2xl font-black text-white mb-1">Top Ranking</h1>
            <p className="text-xs text-gray-400">10 Sultan XP Teratas di LyxeNime</p>
        </div>

        {/* List */}
        <div className="space-y-3 px-1">
            {!currentUser && !loading ? (
                // Guest View
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-[#18181b] rounded-2xl border border-white/5 border-dashed">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <Lock size={32} className="text-gray-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Akses Terbatas</h3>
                    <p className="text-sm text-gray-400 mb-6 max-w-xs">
                        Silakan login terlebih dahulu untuk melihat daftar Top 10 Ranking Wibu.
                    </p>
                    <Link 
                        to="/login" 
                        className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                        <LogIn size={18} />
                        Login Sekarang
                    </Link>
                </div>
            ) : loading ? (
                // Skeleton Loading
                [...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse"></div>
                ))
            ) : (
                // Logged In User View
                users.map((user, index) => {
                    const level = Math.floor((user.xp || 0) / 10) + 1;
                    return (
                        <div 
                            key={user.id} 
                            className={`rounded-2xl p-4 flex items-center gap-4 border transition-all hover:scale-[1.02] ${getRankStyle(index)}`}
                        >
                            {/* Rank Number/Icon */}
                            <div className="w-8 flex-shrink-0 flex items-center justify-center">
                                {getRankIcon(index)}
                            </div>

                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} className="text-gray-500" />
                                    )}
                                </div>
                                {index === 0 && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-bold px-1.5 rounded-full border border-[#111]">
                                        KING
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-white truncate mb-1">
                                    {user.displayName || user.username || 'User Tanpa Nama'}
                                </h3>
                                <div className="flex items-center gap-2 mb-1">
                                    {getUserBadge(user)}
                                </div>
                                <p className="text-[10px] text-gray-500 font-mono">Level {level}</p>
                            </div>

                            {/* XP Badge */}
                            <div className="text-right">
                                <div className="text-sm font-black text-orange-500 font-mono">
                                    {user.xp || 0} XP
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {!loading && currentUser && users.length === 0 && (
                <div className="text-center text-gray-500 py-10">
                    Belum ada user yang memiliki XP. Jadilah yang pertama!
                </div>
            )}
        </div>
      </div>
    </Layout>
  );
};

export default Leaderboard;
