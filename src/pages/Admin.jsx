import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, getDoc, doc, orderBy, limit, query, where, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { auth } from '../lib/firebase';
import { dbToken } from '../lib/firebaseToken'; // Import Database Token Baru
import Layout from '../components/layout/Layout';
import { Users, Eye, ArrowLeft, Activity, RefreshCw, Copy, Plus, Ticket, Clock, CheckCircle, XCircle, Trash2, Database, AlertTriangle, Zap } from 'lucide-react';

const Admin = () => {
  const navigate = useNavigate();
  const db = getFirestore(); // Database Utama (Users, Analytics)
  // dbToken -> Database Khusus Token (Tokens)
  
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Level Up State
  const [lvlIdentifier, setLvlIdentifier] = useState('');
  const [lvlAmount, setLvlAmount] = useState('');
  const [lvlLoading, setLvlLoading] = useState(false);

  // Token State
  const [genLoading, setGenLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(null);
  const [tokenHistory, setTokenHistory] = useState([]);
  const [expiredTokens, setExpiredTokens] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  
  // DB Switcher
  const [activeTab, setActiveTab] = useState('new'); // 'new' (dbToken) or 'old' (db)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || user.email !== 'EMAIL_ADMIN_KAMU@gmail.com') {
        navigate('/'); // Redirect non-admin
      } else {
        fetchAnalytics();
        fetchTokenHistory(activeTab); // Fetch based on active tab
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
      fetchTokenHistory(activeTab);
  }, [activeTab]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError(data.error || 'Gagal mengambil data analytics');
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddLevel = async (e) => {
      e.preventDefault();
      if (!lvlIdentifier || !lvlAmount) return alert("Isi semua data!");
      
      setLvlLoading(true);
      try {
          const usersRef = collection(db, "users");
          let q = query(usersRef, where("email", "==", lvlIdentifier), limit(1));
          let snapshot = await getDocs(q);
          
          if (snapshot.empty) {
              q = query(usersRef, where("displayName", "==", lvlIdentifier), limit(1)); // Coba cari username
              snapshot = await getDocs(q);
          }

          if (snapshot.empty) {
              alert("User tidak ditemukan (Cek Email/Username)");
              setLvlLoading(false);
              return;
          }

          const targetDoc = snapshot.docs[0];
          const userData = targetDoc.data();
          
          const levelsToAdd = parseInt(lvlAmount);
          const xpPerLevel = 10; // 1 Level = 10 XP (Sesuai rumus di Profile)
          const xpToAdd = levelsToAdd * xpPerLevel;

          await updateDoc(doc(db, "users", targetDoc.id), {
              xp: increment(xpToAdd)
          });

          const userName = userData.displayName || userData.email || 'User';
          // Estimasi level baru untuk alert saja
          const currentXP = userData.xp || 0;
          const newXP = currentXP + xpToAdd;
          const newLevelEst = Math.floor(newXP / 10) + 1;

          alert(`Sukses! ${userName} ditambah ${xpToAdd} XP (Setara +${levelsToAdd} Level).\nEstimasi Level Sekarang: ${newLevelEst}`);
          setLvlIdentifier('');
          setLvlAmount('');

      } catch (err) {
          console.error("Gagal add level:", err);
          alert("Error: " + err.message);
      } finally {
          setLvlLoading(false);
      }
  };
  
  const fetchTokenHistory = async (source) => {
      setLoadingHistory(true);
      try {
          const targetDB = source === 'new' ? dbToken : db;
          
          const q = query(collection(targetDB, "tokens"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          
          const expiringTokens = []; // Temporary array for expired/expiring tokens

          const tokens = await Promise.all(snapshot.docs.map(async (tokenDoc) => {
              const data = tokenDoc.data();
              let userData = null;
              
              if (data.is_used && data.used_by) {
                  try {
                      const userSnap = await getDoc(doc(db, "users", data.used_by));
                      if (userSnap.exists()) {
                          userData = userSnap.data();
                      }
                  } catch (e) {
                      console.error("User fetch error", e);
                  }
              }
              
              let tokenExpiredDate = null; // Inisialisasi null
              let tokenRemainingDays = null; // Inisialisasi null
              const daysInt = parseInt(data.days); 
              
              if (data.used_at && !isNaN(daysInt)) { 
                  const d = data.used_at.toDate();
                  d.setDate(d.getDate() + daysInt);
                  tokenExpiredDate = d;

                  const now = new Date();
                  const diffTime = tokenExpiredDate.getTime() - now.getTime();
                  tokenRemainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (data.is_used && tokenRemainingDays <= 1) { 
                      expiringTokens.push({
                          id: tokenDoc.id,
                          ...data,
                          redeemerName: userData?.username || userData?.email || 'Unknown User',
                          redeemerEmail: userData?.email || '-',
                          expiredDate: tokenExpiredDate,
                          remainingDays: tokenRemainingDays
                      });
                  }
              }

              return {
                  id: tokenDoc.id,
                  ...data,
                  redeemerName: userData?.username || userData?.email || 'Unknown User',
                  redeemerEmail: userData?.email || '-',
                  expiredDate: tokenExpiredDate, // Pastikan pakai yang sudah dihitung
                  remainingDays: tokenRemainingDays
              };
          }));

          setTokenHistory(tokens);
          setExpiredTokens(expiringTokens); // Set the new state here

      } catch (err) {
          console.error("Gagal fetch history token", err);
      } finally {
          setLoadingHistory(false);
      }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
    fetchTokenHistory(activeTab);
  };

  const handleGenerateToken = async (days, label) => {
      // Selalu generate di DB Baru
      setGenLoading(true);
      setGeneratedToken(null);
      try {
          const randomStr = () => Math.random().toString(36).substring(2, 6).toUpperCase();
          const code = `MIKU-${randomStr()}-${randomStr()}`;

          await addDoc(collection(dbToken, "tokens"), {
              code: code,
              days: days,
              label: label,
              is_used: false,
              createdAt: serverTimestamp(),
              createdBy: 'admin'
          });

          setGeneratedToken({ code, label });
          // Auto switch to NEW tab if not active
          if (activeTab !== 'new') setActiveTab('new'); 
          else fetchTokenHistory('new');
          
      } catch (err) {
          console.error("Gagal generate token:", err);
          alert("Error generating token");
      } finally {
          setGenLoading(false);
      }
  };

  const openDeleteConfirm = (id) => {
      setDeleteTargetId(id);
      setShowConfirmDeleteModal(true);
  };
  
  const confirmDeleteToken = async () => {
      if (!deleteTargetId) return; // Guard
      setShowConfirmDeleteModal(false); // Close modal
      
      const idToDelete = deleteTargetId;
      const dbName = activeTab === 'new' ? 'DB BARU' : 'DB LAMA';
      
      try {
          const targetDB = activeTab === 'new' ? dbToken : db;
          const tokenRef = doc(targetDB, "tokens", idToDelete);
          const tokenSnap = await getDoc(tokenRef);
          
          if (tokenSnap.exists()) {
              const data = tokenSnap.data();
              
              if (data.is_used && data.used_by) {
                  const userRef = doc(db, "users", data.used_by);
                  await updateDoc(userRef, {
                      role: 'user',
                      isPremium: false,
                      premiumUntil: null
                  });
                  console.log(`Akses premium dicabut dari user ${data.used_by}`);
              }
              
              await deleteDoc(tokenRef);
              setTokenHistory(prev => prev.filter(item => item.id !== idToDelete));
              setExpiredTokens(prev => prev.filter(item => item.id !== idToDelete)); // Also remove from expired list
              alert("Token dihapus."); // Keep alert for success
          }
      } catch (err) {
          console.error("Gagal hapus token:", err);
          alert("Gagal menghapus token: " + err.message);
      } finally {
          setDeleteTargetId(null);
      }
  };

  const copyToken = (code) => {
      navigator.clipboard.writeText(code);
      alert("Token disalin: " + code);
  };

  if (loading && !refreshing && !analytics) {
    return (
      <Layout withBottomNav={false}>
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout withBottomNav={false}>
      <div className="min-h-screen pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-xs text-gray-400">Monitoring Performa Web</p>
            </div>
            <button 
                onClick={handleRefresh} 
                disabled={refreshing}
                className={`ml-auto p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            >
                <RefreshCw size={20} />
            </button>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                Error: {error}
            </div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Realtime Users */}
            <div className="col-span-2 bg-gradient-to-br from-indigo-600/20 to-indigo-900/20 border border-indigo-500/30 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Activity size={64} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Sedang Online</span>
                </div>
                <h2 className="text-4xl font-black text-white mb-1">
                    {analytics?.activeUsers || 0}
                </h2>
                <p className="text-xs text-gray-400">User aktif dalam 30 menit terakhir</p>
            </div>

            {/* Total Views */}
            <div className="bg-[#18181b] border border-white/5 p-4 rounded-2xl">
                <div className="p-2 bg-violet-500/10 rounded-lg w-fit mb-3 text-violet-500">
                    <Eye size={20} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                    {parseInt(analytics?.totalViews || 0).toLocaleString()}
                </h3>
                <p className="text-xs text-gray-400">Total Views</p>
            </div>

            {/* Total Users */}
            <div className="bg-[#18181b] border border-white/5 p-4 rounded-2xl">
                <div className="p-2 bg-green-500/10 rounded-lg w-fit mb-3 text-green-500">
                    <Users size={20} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                    {parseInt(analytics?.totalUsers || 0).toLocaleString()}
                </h3>
                <p className="text-xs text-gray-400">Total User</p>
            </div>
        </div>

        {/* User Management Shortcut */}
        <button 
            onClick={() => navigate('/admin/users')}
            className="w-full bg-gradient-to-r from-blue-600/20 to-blue-900/20 border border-blue-500/30 p-4 rounded-2xl mb-6 flex items-center justify-between group hover:border-blue-500/50 transition-all"
        >
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Users size={24} />
                </div>
                <div className="text-left">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Kelola Pengguna</h3>
                    <p className="text-xs text-gray-400">Lihat daftar user, level, dan status premium</p>
                </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <ArrowLeft size={20} className="rotate-180" />
            </div>
        </button>

        {/* Expired Token Warnings */}
        {expiredTokens.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl mb-6 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-400">Peringatan Expired Token!</h3>
                        <p className="text-xs text-red-300">Token premium berikut sudah atau akan segera kedaluwarsa.</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {expiredTokens.map((token) => (
                        <div key={token.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-red-500/20">
                            <div>
                                <p className="font-bold text-white">{token.redeemerName || 'N/A'}</p>
                                <p className="text-xs text-gray-400">{token.redeemerEmail || 'N/A'}</p>
                                <p className="text-[10px] text-red-300 mt-1">
                                    {token.remainingDays <= 0 
                                        ? `Sudah kedaluwarsa ${Math.abs(token.remainingDays)} hari lalu.`
                                        : `Kedaluwarsa dalam ${token.remainingDays} hari.`
                                    }
                                </p>
                            </div>
                            <button 
                                onClick={() => openDeleteConfirm(token.id)}
                                className="p-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold"
                            >
                                <Trash2 size={14} /> Hapus Token
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- LEVEL UP MANUAL SECTION --- */}
        <div className="bg-[#18181b] border border-white/5 p-6 rounded-2xl mb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500">
                    <Zap size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Manual Level Up</h3>
                    <p className="text-xs text-gray-400">Boost level user instan</p>
                </div>
            </div>
            
            <form onSubmit={handleAddLevel} className="flex flex-col md:flex-row gap-3">
                <input 
                    type="text" 
                    placeholder="Email atau Username User..." 
                    value={lvlIdentifier}
                    onChange={(e) => setLvlIdentifier(e.target.value)}
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
                <input 
                    type="number" 
                    placeholder="Jml Level (e.g. 5)" 
                    value={lvlAmount}
                    onChange={(e) => setLvlAmount(e.target.value)}
                    className="w-full md:w-32 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button 
                    type="submit"
                    disabled={lvlLoading}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {lvlLoading ? <Activity size={18} className="animate-spin"/> : <Plus size={18} />}
                    <span className="md:hidden">Naikkan Level</span>
                </button>
            </form>
        </div>

        {/* GENERATE TOKEN SECTION */}
        <div className="bg-[#18181b] border border-white/5 p-6 rounded-2xl mb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                    <Ticket size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Buat Token Premium</h3>
                    <p className="text-xs text-gray-400">Generate kode untuk user</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <button 
                    onClick={() => handleGenerateToken(7, 'Mingguan')}
                    disabled={genLoading}
                    className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white transition-colors border border-white/5"
                >
                    7 Hari
                </button>
                <button 
                    onClick={() => handleGenerateToken(30, '1 Bulan')}
                    disabled={genLoading}
                    className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white transition-colors border border-white/5"
                >
                    1 Bulan
                </button>
                <button 
                    onClick={() => handleGenerateToken(60, '2 Bulan')}
                    disabled={genLoading}
                    className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white transition-colors border border-white/5"
                >
                    2 Bulan
                </button>
                <button 
                    onClick={() => handleGenerateToken(90, '3 Bulan')}
                    disabled={genLoading}
                    className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white transition-colors border border-white/5"
                >
                    3 Bulan
                </button>
                <button 
                    onClick={() => handleGenerateToken(120, '4 Bulan')}
                    disabled={genLoading}
                    className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white transition-colors border border-white/5"
                >
                    4 Bulan
                </button>
                <button 
                    onClick={() => handleGenerateToken(150, '5 Bulan')}
                    disabled={genLoading}
                    className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white transition-colors border border-white/5"
                >
                    5 Bulan
                </button>
                <button 
                    onClick={() => handleGenerateToken(365, '1 Tahun')}
                    disabled={genLoading}
                    className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white transition-colors border border-white/5 col-span-2 md:col-span-2"
                >
                    1 Tahun
                </button>
            </div>

            {generatedToken && (
                <div className="bg-black/30 border border-yellow-500/30 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs text-gray-500 mb-1">Token {generatedToken.label} Berhasil Dibuat!</p>
                    <div className="flex items-center justify-between gap-2">
                        <code className="text-xl font-mono font-bold text-yellow-500 tracking-wider">
                            {generatedToken.code}
                        </code>
                        <button onClick={() => copyToken(generatedToken.code)} className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition-colors">
                            <Copy size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* TOKEN HISTORY TABLE */}
        <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
             {/* DB SWITCHER TABS */}
             <div className="flex border-b border-white/5">
                 <button 
                    onClick={() => setActiveTab('new')}
                    className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'new' ? 'bg-white/5 text-white border-b-2 border-violet-500' : 'text-gray-500 hover:text-white'}`}
                 >
                     <Database size={14} className="text-green-500" /> Database Baru
                 </button>
                 <button 
                    onClick={() => setActiveTab('old')}
                    className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'old' ? 'bg-white/5 text-white border-b-2 border-red-500' : 'text-gray-500 hover:text-white'}`}
                 >
                     <Database size={14} className="text-red-500" /> Database Lama (Arsip)
                 </button>
             </div>

             <div className="p-4 border-b border-white/5 flex justify-between items-center">
                 <h3 className="text-sm font-bold text-white">Riwayat Token {activeTab === 'new' ? '(Aktif)' : '(Legacy)'}</h3>
                 <span className="text-[10px] text-gray-500">Menampilkan semua data</span>
             </div>
             
             {loadingHistory ? (
                 <div className="p-8 text-center text-xs text-gray-500 animate-pulse">Memuat riwayat...</div>
             ) : (
                 <div className="overflow-x-auto">
                     <table className="w-full text-left text-xs">
                         <thead className="bg-white/5 text-gray-400 uppercase font-bold tracking-wider">
                             <tr>
                                 <th className="px-4 py-3">Kode</th>
                                 <th className="px-4 py-3">Paket</th>
                                 <th className="px-4 py-3">Status</th>
                                 <th className="px-4 py-3">User</th>
                                 <th className="px-4 py-3">Expired</th>
                                 <th className="px-4 py-3 text-right">Aksi</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                             {tokenHistory.map((item) => (
                                 <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                     <td className="px-4 py-3 font-mono text-gray-300">
                                         <button onClick={() => copyToken(item.code)} className="hover:text-white flex items-center gap-1">
                                            {item.code} <Copy size={10} />
                                         </button>
                                     </td>
                                     <td className="px-4 py-3 text-gray-300">{item.label}</td>
                                     <td className="px-4 py-3">
                                         {item.is_used ? (
                                             <span className="flex items-center gap-1 text-green-500 font-bold">
                                                 <CheckCircle size={12} /> Used
                                             </span>
                                         ) : (
                                             <span className="flex items-center gap-1 text-gray-500">
                                                 <Clock size={12} /> Active
                                             </span>
                                         )}
                                     </td>
                                     <td className="px-4 py-3">
                                         {item.is_used ? (
                                             <div>
                                                 <p className="font-bold text-white">{item.redeemerName}</p>
                                                 <p className="text-[10px] text-gray-500">{item.redeemerEmail}</p>
                                             </div>
                                         ) : (
                                             <span className="text-gray-600">-</span>
                                         )}
                                     </td>
                                     <td className="px-4 py-3 text-gray-400">
                                         {item.expiredDate ? item.expiredDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : '-'}
                                     </td>
                                     <td className="px-4 py-3 text-right">
                                         <button 
                                            onClick={() => openDeleteConfirm(item.id)}
                                            className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                            title="Hapus Token"
                                         >
                                             <Trash2 size={14} />
                                         </button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                     {tokenHistory.length === 0 && (
                         <div className="p-8 text-center text-xs text-gray-500">
                             Belum ada token di {activeTab === 'new' ? 'Database Baru' : 'Database Lama'}.
                         </div>
                     )}
                 </div>
             )}
        </div>

        <div className="text-center text-xs text-gray-500 mt-10">
            LyxeNime Admin Panel v1.0
        </div>

        {/* Delete Confirmation Modal */}
        {showConfirmDeleteModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
                <div className="w-full max-w-xs bg-[#18181b] border border-white/10 rounded-2xl p-6 text-center shadow-2xl animate-in zoom-in-95">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Hapus Token Ini?</h3>
                    <p className="text-xs text-gray-400 mb-6">Token akan dihapus permanen. Jika token sudah digunakan, akses premium user juga akan dicabut.</p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowConfirmDeleteModal(false)}
                            className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-sm font-bold text-gray-300 hover:text-white"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={confirmDeleteToken}
                            className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700"
                        >
                            Hapus
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default Admin;