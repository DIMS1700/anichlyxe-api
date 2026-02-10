import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const ChatButton = () => {
  const navigate = useNavigate();
  const [onlineCount, setOnlineCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Fetch Online Count (Analytics) - TEMPORARILY DISABLED TO SAVE QUOTA
  useEffect(() => {
    /* 
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
    const interval = setInterval(fetchOnlineUsers, 60000); 

    return () => clearInterval(interval);
    */
  }, []);

  // 2. Listen for Unread Messages
  useEffect(() => {
    // Ambil waktu terakhir baca dari storage (atau anggap sekarang jika user baru)
    const lastReadStr = localStorage.getItem('miku_chat_last_read');
    const lastReadTime = lastReadStr ? new Date(lastReadStr) : new Date();

    // Query 20 pesan terakhir
    const q = query(
      collection(db, "rooms", "live_global", "messages"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.createdAt) {
          // Firestore Timestamp to JS Date
          const msgDate = data.createdAt.toDate();
          if (msgDate > lastReadTime) {
            count++;
          }
        }
      });
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, []);

  return (
    <button
      onClick={() => {
        // Reset count saat diklik sebelum pindah halaman
        setUnreadCount(0);
        localStorage.setItem('miku_chat_last_read', new Date().toISOString());
        navigate('/chat');
      }}
      className="fixed bottom-24 right-4 z-50 flex items-center gap-3 pl-4 pr-5 py-3 bg-brand-gold rounded-full shadow-lg shadow-brand-gold/20 hover:scale-105 active:scale-95 transition-all duration-300 group"
    >
      {/* Icon Chat */}
      <div className="relative">
        <MessageCircle size={24} className="text-black fill-black" />
        
        {/* UNREAD BADGE */}
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 border-2 border-[#0e101f] text-[10px] font-bold text-white z-10 animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      {/* Text Info */}
      <div className="flex flex-col items-start leading-none">
        <span className="font-black text-sm text-black uppercase tracking-wide">Live Chat</span>
        
        {/* Online Count Indicator */}
        <div className="flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-black/70">
                {onlineCount > 0 ? `${onlineCount} Online` : 'Offline'}
            </span>
        </div>
      </div>
    </button>
  );
};

export default ChatButton;