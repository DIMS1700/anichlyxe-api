import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { auth } from '../lib/firebase';
import Layout from '../components/layout/Layout';
import { ArrowLeft, Search, User, Crown, Shield, Trash2, Mail, Award, CheckCircle, XCircle } from 'lucide-react';

const AdminUsers = () => {
  const navigate = useNavigate();
  const db = getFirestore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || user.email !== 'EMAIL_ADMIN_KAMU@gmail.com') {
        navigate('/'); // Redirect non-admin
      } else {
        fetchUsers();
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Fallback createdAt if missing
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
      }));
      setUsers(userList);
    } catch (err) {
      console.error("Error fetching users:", err);
      // Fallback if orderBy fails (requires index)
      try {
          const snapshot = await getDocs(collection(db, "users"));
          const userList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
             createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
          }));
          setUsers(userList);
      } catch (e) {
          console.error("Fatal error fetching users", e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePremium = async (userId, currentStatus) => {
      if (!window.confirm(`Ubah status premium user ini?`)) return;
      
      try {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
              isPremium: !currentStatus,
              premiumUntil: !currentStatus ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null // Default 30 days if enabling
          });
          // Update local state
          setUsers(users.map(u => u.id === userId ? {...u, isPremium: !currentStatus} : u));
      } catch (err) {
          console.error("Gagal update user:", err);
          alert("Gagal update user");
      }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout withBottomNav={false}>
      <div className="min-h-screen pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 sticky top-0 bg-[#111111] z-10 py-4 border-b border-white/5">
            <button onClick={() => navigate('/admin')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-xl font-bold text-white">Daftar User</h1>
                <p className="text-xs text-gray-400">Total: {users.length} Pengguna</p>
            </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
                type="text" 
                placeholder="Cari email atau username..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#18181b] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
        </div>

        {/* User List */}
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-gray-500">Memuat data user...</p>
            </div>
        ) : (
            <div className="space-y-3">
                {filteredUsers.map(user => (
                    <div key={user.id} className="bg-[#18181b] border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/5 flex-shrink-0">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                                <User size={20} className="text-gray-500" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="text-sm font-bold text-white truncate">
                                    {user.username || user.displayName || 'No Name'}
                                </h3>
                                {user.isPremium && (
                                    <Crown size={12} className="text-yellow-500 fill-yellow-500" />
                                )}
                                {user.role === 'admin' && (
                                    <Shield size={12} className="text-blue-500 fill-blue-500" />
                                )}
                            </div>
                            <p className="text-xs text-gray-500 truncate mb-1">{user.email}</p>
                            
                            {/* Stats */}
                            <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Award size={10} className="text-orange-500" />
                                    Lvl {Math.floor((user.xp || 0) / 10) + 1}
                                </span>
                                <span className="flex items-center gap-1">
                                    XP: {user.xp || 0}
                                </span>
                                <span className="text-zinc-600">•</span>
                                <span>Joined: {user.createdAt.toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-col items-end gap-2">
                           <button 
                                onClick={() => handleTogglePremium(user.id, user.isPremium)}
                                className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                                    user.isPremium 
                                    ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20' 
                                    : 'bg-zinc-800 text-gray-400 border-white/5 hover:bg-zinc-700'
                                }`}
                           >
                                {user.isPremium ? 'Prime' : 'Rookie'}
                           </button>
                        </div>
                    </div>
                ))}

                {filteredUsers.length === 0 && (
                    <div className="text-center py-10 text-gray-500 text-sm">
                        Tidak ada user ditemukan.
                    </div>
                )}
            </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminUsers;
