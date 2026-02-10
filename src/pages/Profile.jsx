import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged, signOut, updateProfile, deleteUser } from "firebase/auth";
import { doc, updateDoc, getFirestore, collection, query, orderBy, limit, getDocs, getDoc, where, runTransaction, serverTimestamp, deleteDoc, onSnapshot } from "firebase/firestore";
import { auth } from '../lib/firebase';
import { dbToken } from '../lib/firebaseToken'; // Import Database Token Baru
import Layout from '../components/layout/Layout';
import { User, LogOut, Mail, Shield, Crown, Camera, Edit2, Save, X, Loader2, PlayCircle, Bookmark, ChevronRight, Zap, Star, LayoutDashboard, Ticket, History, AlertTriangle } from 'lucide-react';

const UPLOAD_API_URL = 'https://api-yanz-upload.vercel.app/upload';

const Profile = () => {
  const navigate = useNavigate();
  const db = getFirestore(); // Database Utama (Users)
  // dbToken -> Database Khusus Token (Tokens)
  
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); 
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [history, setHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState('overview'); 
  const [isEditing, setIsEditing] = useState(false);
  
  // Redeem State
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState(null);
  
  // Edit Form State
  const [newName, setNewName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let unsubscribeProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setNewName(currentUser.displayName || '');
        
        // Setup Realtime Listener
        const userDocRef = doc(db, "users", currentUser.uid);
        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserProfile(docSnap.data());
            }
            setLoading(false);
            setLoadingData(false);
        });

      } else {
        navigate('/login');
        setLoading(false);
      }
    });

    return () => {
        unsubscribeAuth();
        unsubscribeProfile();
    };
  }, [navigate]);

  // fetchUserData sudah tidak dipakai lagi karena diganti onSnapshot
  
  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
        // 1. Hapus Data User di Firestore
        await deleteDoc(doc(db, "users", user.uid));
        
        // 2. Hapus Akun Authentication
        await deleteUser(user);
        
        // Redirect otomatis akan dihandle oleh onAuthStateChanged -> null
        navigate('/login');
    } catch (err) {
        console.error("Gagal hapus akun:", err);
        if (err.code === 'auth/requires-recent-login') {
            alert("Untuk keamanan, silakan Logout dan Login kembali sebelum menghapus akun.");
        } else {
            alert("Gagal menghapus akun: " + err.message);
        }
        setDeleteLoading(false);
        setShowDeleteModal(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setUploading(true);

    try {
      let photoURL = user.photoURL;

      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);

        const res = await fetch(UPLOAD_API_URL, {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        
        if (data.data && data.data.url) {
           photoURL = data.data.url;
        } else if (data.status === 200 && data.url) {
           photoURL = data.url;
        } else if (data.url) {
           photoURL = data.url;
        } else if (data.result?.url) {
           photoURL = data.result.url;
        }
      }

      await updateProfile(user, {
        displayName: newName,
        photoURL: photoURL
      });

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        username: newName,
        photoURL: photoURL, 
        updatedAt: new Date()
      });

      setUser({ ...user, displayName: newName, photoURL: photoURL });
      setIsEditing(false);
      setPhotoFile(null);
      setPreview(null);
      
    } catch (err) {
      console.error("Gagal update profil:", err);
      alert("Gagal update profil: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    
    setRedeemLoading(true);
    setRedeemMsg(null);

    try {
        // --- LOGIKA REDEEM MULTI-DATABASE ---

        // 1. Cari Token di DB TOKEN (Project Baru)
        const q = query(collection(dbToken, "tokens"), where("code", "==", tokenInput.trim()));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            throw new Error("Token tidak valid atau tidak ditemukan.");
        }

        const tokenDoc = snapshot.docs[0];
        const tokenData = tokenDoc.data();

        if (tokenData.is_used) {
            throw new Error("Token sudah digunakan.");
        }

        // 2. Eksekusi Update (Manual, tidak bisa Transaction lintas DB)
        
        // A. Update Token di DB TOKEN -> Used
        const tokenRef = doc(dbToken, "tokens", tokenDoc.id);
        await updateDoc(tokenRef, {
            is_used: true,
            used_by: user.uid,
            used_at: serverTimestamp()
        });

        // B. Update User di DB UTAMA -> Premium
        const userRef = doc(db, "users", user.uid);
        const expiredDate = new Date();
        expiredDate.setDate(expiredDate.getDate() + parseInt(tokenData.days));

        await updateDoc(userRef, {
            role: 'premium',
            isPremium: true,
            premiumSince: serverTimestamp(),
            premiumUntil: expiredDate
        });

        setRedeemMsg({ type: 'success', text: `Selamat! Paket ${tokenData.label} berhasil diaktifkan.` });
        setTokenInput('');
        // fetchUserData(user.uid); // Tidak perlu manual refresh, onSnapshot handle otomatis
        
        setTimeout(() => {
            setShowRedeemModal(false);
            setRedeemMsg(null);
        }, 3000);

    } catch (err) {
        console.error(err);
        setRedeemMsg({ type: 'error', text: err.message || err });
    } finally {
        setRedeemLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setNewName(user.displayName || '');
    setPhotoFile(null);
    setPreview(null);
  };

  // Leveling Logic
  const xp = userProfile?.xp || 0;
  // FIX: Level dihitung murni dari XP (1 Level = 10 XP)
  const level = Math.floor(xp / 10) + 1;
  const xpForNextLevel = 10;
  const currentLevelXp = xp % 10;
  const progressPercent = (currentLevelXp / xpForNextLevel) * 100;
  const isPremium = userProfile?.role === 'premium' || userProfile?.isPremium === true;

  if (loading) {
    return (
      <Layout>
      <div className="animate-pulse">
         <div className="h-40 bg-zinc-800/50 -mx-4 -mt-4 rounded-b-3xl"></div>
         <div className="px-4 -mt-16 mb-6">
             <div className="flex flex-col items-center">
                 <div className="w-28 h-28 rounded-full bg-zinc-800 border-4 border-[#111111]"></div>
                 <div className="h-6 w-32 bg-zinc-800 rounded mt-3 mb-2"></div>
                 <div className="h-4 w-40 bg-zinc-800 rounded"></div>
             </div>
         </div>
         <div className="px-4 space-y-3">
             <div className="h-24 bg-zinc-800/50 rounded-2xl"></div>
             <div className="h-14 bg-zinc-800/50 rounded-2xl"></div>
         </div>
      </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
    <div className="text-white font-sans">
       {/* Header Pattern */}
       <div className="h-40 bg-gradient-to-br from-orange-900/40 to-black relative overflow-hidden -mx-4 md:-mx-6 lg:-mx-8 -mt-4 rounded-b-[2.5rem] shadow-2xl">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
           {!isEditing && (
             <button 
                onClick={() => setIsEditing(true)}
                className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/10 transition-colors border border-white/10 z-10"
             >
                <Edit2 size={20} />
             </button>
           )}
       </div>

       <div className="px-2 -mt-16 mb-6 relative z-10">
           {/* Profile Card */}
           <div className="flex flex-col items-center">
               <div className="relative">
                   <div className="w-28 h-28 rounded-full border-4 border-[#111111] bg-zinc-800 overflow-hidden shadow-2xl relative group">
                       {preview || user.photoURL ? (
                           <img src={preview || user.photoURL} alt={newName} className="w-full h-full object-cover" />
                       ) : (
                           <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                               <User size={48} />
                           </div>
                       )}
                       {isEditing && (
                           <div 
                             onClick={() => fileInputRef.current?.click()}
                             className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                               <Camera size={24} className="text-white" />
                           </div>
                       )}
                   </div>
                   
                   {!isEditing && (
                       <button 
                         onClick={() => setIsEditing(true)}
                         className="absolute -bottom-1 -right-1 p-2.5 bg-orange-600 border-4 border-[#111111] rounded-full text-white hover:bg-orange-500 transition-colors shadow-lg z-20 group"
                         title="Ganti Foto Profil"
                       >
                           <Camera size={18} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                       </button>
                   )}
                   
                   <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                   />
               </div>
               
               {isEditing ? (
                   <div className="mt-4 flex flex-col items-center gap-3 w-full max-w-xs animate-in fade-in slide-in-from-bottom-2">
                       {/* Tutorial Hint */}
                       <div className="flex flex-col items-center gap-1 mb-2 text-center">
                           <p className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20">
                               <Camera size={10} className="inline mr-1" /> Ketuk foto di atas untuk ganti gambar
                           </p>
                           <p className="text-[10px] text-gray-500">
                               <Edit2 size={10} className="inline mr-1" /> Edit nama panggilan di kolom bawah
                           </p>
                       </div>

                       <input 
                          type="text" 
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full bg-[#27272a] border border-white/10 rounded-xl px-4 py-2 text-center text-white focus:outline-none focus:border-orange-500"
                          placeholder="Nama Pengguna"
                       />
                       <div className="flex gap-2 w-full">
                           <button onClick={cancelEdit} disabled={uploading} className="flex-1 py-2 bg-zinc-800 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-colors">Batal</button>
                           <button onClick={handleSaveProfile} disabled={uploading} className="flex-1 py-2 bg-orange-600 rounded-xl text-sm font-bold text-white hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">
                              {uploading ? <Loader2 className="animate-spin" size={16} /> : 'Simpan'}
                           </button>
                       </div>
                   </div>
               ) : (
                   <>
                       <div className="flex items-center gap-2 mt-3">
                           <h1 className="text-xl font-bold text-white">{user.displayName || 'Wibu User'}</h1>
                           {user.email === 'EMAIL_ADMIN_KAMU@gmail.com' ? (
                               <div className="bg-indigo-500/20 border border-indigo-500/50 rounded-full p-1" title="Administrator">
                                   <Shield size={14} className="text-indigo-400 fill-indigo-400/20" />
                               </div>
                           ) : (
                               isPremium && <Crown size={16} className="text-yellow-500 fill-yellow-500" />
                           )}
                       </div>
                       
                       <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 mb-4 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                           <Mail size={12} />
                           <span>{user.email}</span>
                       </div>

                       {/* LEVEL & XP SECTION */}
                       <div className="w-full max-w-xs bg-[#18181b] border border-white/10 rounded-2xl p-4 relative overflow-hidden group">
                           {/* Badge Label */}
                           <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider ${
                               user.email === 'EMAIL_ADMIN_KAMU@gmail.com'
                               ? 'bg-gradient-to-r from-indigo-600 to-orange-600 text-white shadow-lg shadow-indigo-500/20'
                               : isPremium 
                                 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black' 
                                 : 'bg-zinc-700 text-gray-300'
                           }`}>
                               {user.email === 'EMAIL_ADMIN_KAMU@gmail.com' ? 'ADMIN' : (isPremium ? 'Miku Prime' : 'Miku Rookie')}
                           </div>

                           <div className="flex items-center gap-3 mb-3">
                               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                   <Zap size={20} className="text-white fill-white" />
                               </div>
                               <div>
                                   <div className="text-xs text-gray-400 font-bold uppercase">Level Kamu</div>
                                   <div className="text-xl font-black italic text-white leading-none">LVL. {level}</div>
                               </div>
                           </div>

                           {/* XP Progress */}
                           <div className="space-y-1">
                               <div className="flex justify-between text-[10px] font-bold text-gray-400">
                                   <span>EXP {currentLevelXp}/{xpForNextLevel}</span>
                                   <span>Total {xp} XP</span>
                               </div>
                               <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                   <div 
                                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                                      style={{ width: `${progressPercent}%` }}
                                   ></div>
                               </div>
                           </div>

                           {/* Premium Expiration */}
                           {isPremium && userProfile?.premiumUntil && (() => {
                               const premiumEndDate = userProfile.premiumUntil.toDate();
                               const now = new Date();
                               const diffTime = premiumEndDate.getTime() - now.getTime();
                               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Calculate days remaining
                               
                               if (diffDays > 0) {
                                   return (
                                       <p className="text-[10px] text-gray-400 mt-4 text-center">
                                           Premium Anda akan kedaluwarsa dalam <span className="font-bold text-orange-400">{diffDays} hari lagi</span>
                                       </p>
                                   );
                               } else if (diffDays === 0) {
                                   return (
                                       <p className="text-[10px] text-red-400 mt-4 text-center font-bold">
                                           Premium Anda kedaluwarsa hari ini!
                                       </p>
                                   );
                               } else {
                                   // Already expired (diffDays < 0)
                                   return (
                                       <p className="text-[10px] text-red-400 mt-4 text-center">
                                           Premium Anda telah kedaluwarsa.
                                       </p>
                                   );
                               }
                           })()}
                       </div>
                   </>
               )}
           </div>
       </div>

       {!isEditing && (
           <>
               {/* TABS NAVIGATION */}
               <div className="px-2 mb-6">
                   <div className="flex bg-[#18181b] p-1 rounded-xl border border-white/5">
                       <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeTab === 'overview' ? 'bg-[#27272a] text-white shadow-lg border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}>
                           <User size={14} /> Overview
                       </button>
                       <button onClick={() => navigate('/history')} className="flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 text-gray-500 hover:text-gray-300 transition-all">
                           <History size={14} /> Riwayat
                       </button>
                       <button onClick={() => navigate('/bookmarks')} className="flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 text-gray-500 hover:text-gray-300 transition-all">
                           <Bookmark size={14} /> Simpan
                       </button>
                   </div>
               </div>

               {/* TAB CONTENT: OVERVIEW */}
               {activeTab === 'overview' && (
                   <div className="px-2 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                       <div className="bg-[#18181b] rounded-2xl overflow-hidden border border-white/5">
                           
                           {/* ADMIN MENU (Only for specific email) */}
                           {user.email === 'EMAIL_ADMIN_KAMU@gmail.com' && (
                               <Link to="/admin" className="p-4 flex items-center gap-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                                   <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                       <LayoutDashboard size={20} />
                                   </div>
                                   <div className="flex-1">
                                       <h3 className="text-sm font-bold text-indigo-400 group-hover:text-indigo-300">Admin Dashboard</h3>
                                       <p className="text-xs text-gray-500">Kelola web & analytics</p>
                                   </div>
                                   <ChevronRight size={16} className="text-gray-600" />
                               </Link>
                           )}

                           <div className="p-4 flex items-center gap-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                               <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><Crown size={20} /></div>
                               <div className="flex-1">
                                   <h3 className="text-sm font-bold">Premium</h3>
                                   <p className="text-xs text-gray-500">Beli token premium</p>
                               </div>
                           </div>
                           
                           {/* REDEEM TOKEN MENU (Replaces 18+) */}
                           <div 
                               onClick={() => setShowRedeemModal(true)}
                               className="p-4 flex items-center gap-3 hover:bg-white/5 transition-colors cursor-pointer"
                           >
                               <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><Ticket size={20} /></div>
                               <div className="flex-1">
                                   <h3 className="text-sm font-bold">Tukarkan Token</h3>
                                   <p className="text-xs text-gray-500">Masukkan kode voucher</p>
                               </div>
                           </div>
                       </div>

                       <button onClick={handleLogout} className="w-full bg-[#18181b] border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all active:scale-95 mb-4">
                           <LogOut size={20} />
                           <span className="font-bold text-sm">Keluar Akun</span>
                       </button>

                       <button 
                           onClick={() => setShowDeleteModal(true)}
                           className="w-full py-2 text-xs font-bold text-zinc-600 hover:text-red-500 transition-colors flex items-center justify-center gap-1"
                       >
                           <AlertTriangle size={12} /> Hapus Akun Permanen
                       </button>
                   </div>
               )}

               {/* TAB CONTENT: BOOKMARK */}
           </>
       )}

       {/* DELETE CONFIRMATION MODAL */}
       {showDeleteModal && (
           <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 animate-in fade-in backdrop-blur-sm">
               <div className="w-full max-w-sm bg-[#18181b] border border-red-500/30 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 relative overflow-hidden">
                   {/* Background Glow */}
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
                   
                   <div className="flex flex-col items-center text-center mb-6">
                       <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                           <AlertTriangle size={32} className="text-red-500" />
                       </div>
                       <h3 className="text-xl font-bold text-white mb-2">Hapus Akun Permanen?</h3>
                       <p className="text-sm text-gray-400 leading-relaxed">
                           Tindakan ini <span className="text-red-400 font-bold">tidak dapat dibatalkan</span>. 
                           Semua riwayat nonton, bookmark, dan level XP Anda akan hilang selamanya.
                       </p>
                   </div>

                   <div className="flex flex-col gap-3">
                       <button 
                           onClick={handleDeleteAccount} 
                           disabled={deleteLoading}
                           className="w-full py-3.5 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                       >
                           {deleteLoading ? <Loader2 size={18} className="animate-spin" /> : 'Ya, Hapus Semuanya'}
                       </button>
                       <button 
                           onClick={() => setShowDeleteModal(false)} 
                           disabled={deleteLoading}
                           className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold text-gray-300 hover:text-white transition-colors"
                       >
                           Batal
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* REDEEM MODAL */}
       {showRedeemModal && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
               <div className="w-full max-w-sm bg-[#18181b] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                   <div className="flex items-center justify-between mb-4">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">
                           <Ticket size={20} className="text-indigo-500" />
                           Tukarkan Token
                       </h3>
                       <button onClick={() => setShowRedeemModal(false)} className="text-gray-500 hover:text-white">
                           <X size={20} />
                       </button>
                   </div>

                   <form onSubmit={handleRedeem} className="space-y-4">
                       <div>
                           <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">Kode Token</label>
                           <input 
                               type="text" 
                               value={tokenInput}
                               onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                               placeholder="MIKU-XXXX-XXXX"
                               className="w-full bg-[#27272a] border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3 text-white font-mono text-center tracking-widest placeholder:tracking-normal placeholder:font-sans focus:outline-none transition-all uppercase"
                           />
                       </div>
                       
                       {redeemMsg && (
                           <div className={`p-3 rounded-xl text-xs font-medium text-center ${redeemMsg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                               {redeemMsg.text}
                           </div>
                       )}

                       <div className="flex gap-2 pt-2">
                           <button 
                               type="button" 
                               onClick={() => setShowRedeemModal(false)} 
                               disabled={redeemLoading}
                               className="flex-1 py-3 bg-zinc-800 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-colors"
                           >
                               Batal
                           </button>
                           <button 
                               type="submit" 
                               disabled={redeemLoading || !tokenInput}
                               className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
                           >
                               {redeemLoading ? <Loader2 size={18} className="animate-spin" /> : 'Tukarkan'}
                           </button>
                       </div>
                   </form>
               </div>
           </div>
       )}
    </div>
    </Layout>
  );
};

export default Profile;