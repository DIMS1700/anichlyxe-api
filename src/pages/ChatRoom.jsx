import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth'; // Import listener auth
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { 
  ArrowLeft, Send, ShieldCheck, CheckCircle2, 
  Pin, Volume2, VolumeX, X, Smile, MoreVertical 
} from 'lucide-react';

const ChatRoom = () => {
  const roomId = 'live_global';
  const navigate = useNavigate();
  
  // State
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true); // Fix: Add loading state
  const [newMessage, setNewMessage] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Fix 1: Auth Loading State
  const [userData, setUserData] = useState(null);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isPinnedMode, setIsPinnedMode] = useState(false);
  const [onlineCount, setOnlineCount] = useState('-');
  
  const dummyDiv = useRef(null);

  // 1. Fix Auth Redirect (Refresh Issue)
  useEffect(() => {
    // TANDAI SUDAH BACA: Update timestamp saat masuk room
    localStorage.setItem('miku_chat_last_read', new Date().toISOString());

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User logged in, fetch detail profile
        try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
                setUserData({ ...currentUser, ...userDoc.data() });
            } else {
                setUserData(currentUser);
            }
        } catch (error) {
            setUserData(currentUser);
        }
        setIsAuthLoading(false);
      } else {
        // User not logged in
        setIsAuthLoading(false);
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // 2. Realtime Chat Listener
  useEffect(() => {
    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse();
      
      setMessages(msgs);
      setLoading(false); // Fix: Turn off loading when data arrives
      
      // Auto scroll cuma kalau user ada di bawah atau baru load
      // setTimeout biar render selesai dulu
      setTimeout(() => {
        dummyDiv.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, []);

  // 3. Online Count
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const res = await fetch('/api/analytics');
        const data = await res.json();
        if (data.success && data.data) {
          setOnlineCount(data.data.activeUsers);
        }
      } catch (error) {}
    };
    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    if (!userData) return;

    const { uid, displayName, photoURL, email, xp = 0 } = userData;
    const isAdmin = email === 'EMAIL_ADMIN_KAMU@gmail.com';
    const isPremium = userData.isPremium || false;
    
    // Logic Level & Title
    const level = Math.floor(xp / 10) + 1;
    const roleTitle = isPremium ? 'Miku Prime' : 'Miku Rookie';

    const messageType = (isAdmin && isPinnedMode) ? 'pinned_announcement' : 'normal';

    try {
      await addDoc(collection(db, "rooms", roomId, "messages"), {
        text: newMessage,
        type: messageType,
        createdAt: serverTimestamp(),
        uid,
        displayName: displayName || 'Wibu Misterius',
        photoURL: photoURL || `https://ui-avatars.com/api/?name=${displayName || 'User'}&background=random`,
        isAdmin,
        isPremium,
        level,
        roleTitle,
        tags: ['ID']
      });
      setNewMessage('');
      setIsPinnedMode(false);
      dummyDiv.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error("Gagal kirim:", error);
    }
  };

  const renderBadge = (type) => {
    if (type === 'admin') return <ShieldCheck size={14} className="text-white fill-red-500" />;
    if (type === 'verified') return <CheckCircle2 size={14} className="text-white fill-[#14b8a6]" />;
    return null;
  };

  // 4. Custom Puzzle Loader Component
  const PuzzleLoader = () => (
    <div className="fixed inset-0 bg-[#0e101f] flex flex-col items-center justify-center z-[100]">
      {/* Puzzle Grid Animation */}
      <div className="relative w-16 h-16 grid grid-cols-2 gap-2 mb-6 transform rotate-45">
        <div className="bg-brand-gold w-full h-full rounded-sm animate-[pulse_1s_ease-in-out_infinite]"></div>
        <div className="bg-brand-gold w-full h-full rounded-sm animate-[pulse_1s_ease-in-out_0.2s_infinite] opacity-80"></div>
        <div className="bg-brand-gold w-full h-full rounded-sm animate-[pulse_1s_ease-in-out_0.4s_infinite] opacity-60"></div>
        <div className="bg-brand-gold w-full h-full rounded-sm animate-[pulse_1s_ease-in-out_0.6s_infinite] opacity-40"></div>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-brand-gold/20 blur-xl rounded-full animate-pulse"></div>
      </div>

      {/* Text Animation */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black tracking-[0.3em] text-white">
          MIKU<span className="text-brand-gold">NIME</span>
        </h2>
        <div className="flex items-center justify-center gap-2">
           <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
           <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest animate-pulse">
             Connecting to Server...
           </p>
        </div>
      </div>
    </div>
  );

  // Tampilkan Loader saat Auth Loading ATAU saat Fetch Pesan Pertama kali
  if (isAuthLoading || loading) {
    return <PuzzleLoader />;
  }

  // Fix 3: Structure for Keyboard Handling (Fixed Header & Input, Scrollable Body)
  return (
    <div className="fixed inset-0 flex flex-col font-sans" style={{ backgroundColor: '#0e101f' }}>
      
      {/* --- HEADER (Fixed Top) --- */}
      <div className="flex-none flex items-center justify-between px-4 py-3 shadow-lg z-50" style={{ backgroundColor: '#5865f2' }}>
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-white text-lg">Live Chat</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="text-white/80 hover:text-white transition-colors">
            <Pin size={20} />
          </button>
          
          <button 
            onClick={() => setIsSoundOn(!isSoundOn)}
            className="text-white/80 hover:text-white transition-colors"
          >
            {isSoundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          {/* <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-xs font-medium text-white">{onlineCount} Online</span>
          </div> */}

          <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white ml-2">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* --- MESSAGE LIST (Scrollable Middle) --- */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-5 overscroll-contain">
        {messages.map((msg) => {
          const isPinned = msg.type === 'pinned_announcement';
          
          return (
            <div 
              key={msg.id} 
              className={`flex gap-3 relative group ${isPinned ? 'p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl' : ''}`}
            >
              <div className="flex-shrink-0">
                <img 
                  src={msg.photoURL} 
                  alt="avatar" 
                  className={`w-10 h-10 rounded-full object-cover border-2 ${isPinned ? 'border-[#facc15]' : 'border-[#15172b]'}`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`font-bold text-sm ${isPinned ? 'text-[#facc15]' : 'text-gray-200'}`}>
                    {msg.displayName}
                  </span>
                  
                  <div className="flex gap-1">
                    {msg.isAdmin && renderBadge('admin')}
                    {(msg.isPremium || isPinned) && renderBadge('verified')}
                  </div>

                  <span className="text-[10px] text-gray-500 ml-1">
                    {isPinned 
                      ? '• Official Announcement' 
                      : `• Lvl ${msg.level || 1} • ${msg.roleTitle || (msg.isPremium ? 'Miku Prime' : 'Miku Rookie')}`
                    }
                  </span>
                </div>

                <div className="relative">
                    {isPinned && (
                        <div className="mb-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#facc15] text-black uppercase tracking-wide">
                            Pinned
                        </div>
                    )}
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isPinned ? 'text-white font-medium' : 'text-gray-300'}`}>
                        {msg.text}
                    </p>
                </div>
                
                <div className="flex gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">ID</span>
                </div>
              </div>

              <button className="absolute top-0 right-0 p-1 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={16} />
              </button>
            </div>
          );
        })}
        {/* Dummy div buat scroll target */}
        <div ref={dummyDiv} className="h-1" />
      </div>

      {/* --- INPUT AREA (Fixed Bottom) --- */}
      {/* pb-[env(safe-area-inset-bottom)] untuk handle gesture bar HP */}
      <div className="flex-none p-4 z-50 bg-[#0e101f] pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-[#15172b]">
        
        {userData?.email === 'EMAIL_ADMIN_KAMU@gmail.com' && (
            <div className="flex items-center gap-2 mb-2 px-1">
                <input 
                    type="checkbox" 
                    id="pinMode" 
                    checked={isPinnedMode} 
                    onChange={(e) => setIsPinnedMode(e.target.checked)}
                    className="accent-yellow-500 w-4 h-4"
                />
                <label htmlFor="pinMode" className="text-xs text-yellow-500 font-bold cursor-pointer">
                    Kirim sebagai Pinned Message
                </label>
            </div>
        )}

        <form 
            onSubmit={handleSendMessage}
            className="flex items-center gap-3 p-1.5 rounded-full border transition-colors focus-within:border-[#5865f2]"
            style={{ backgroundColor: '#15172b', borderColor: '#2d304e' }}
        >
          <button type="button" className="p-2.5 text-gray-400 hover:text-[#5865f2] transition-colors rounded-full hover:bg-white/5 ml-1">
            <Smile size={20} />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-gray-500 font-medium min-w-0"
          />

          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="p-2.5 rounded-full text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all active:scale-95 mr-1 flex-shrink-0"
            style={{ backgroundColor: '#5865f2' }}
          >
            <Send size={18} fill="white" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;