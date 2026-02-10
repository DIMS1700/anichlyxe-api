import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { auth } from '../lib/firebase';
import { Loader2, Lock } from 'lucide-react';

const PremiumGuard = ({ children }) => {
  const navigate = useNavigate();
  const db = getFirestore();
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Belum login, lempar ke login
        navigate('/login');
        return;
      }

      try {
        // Cek Admin by Email (Hardcoded sesuai Profile.jsx)
        if (user.email === 'EMAIL_ADMIN_KAMU@gmail.com') {
            setIsAllowed(true);
            setLoading(false);
            return;
        }

        // Cek Status Premium di Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            const isPremium = data.role === 'premium' || data.isPremium === true;
            
            if (isPremium) {
                setIsAllowed(true);
            } else {
                // Bukan Premium, lempar ke halaman peringatan
                navigate('/restricted');
            }
        } else {
            navigate('/restricted');
        }
      } catch (error) {
        console.error("Error checking premium status:", error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, db]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center text-white">
        <Loader2 size={40} className="animate-spin text-violet-500 mb-4" />
        <p className="text-sm font-bold text-gray-400">Memeriksa Status Premium...</p>
      </div>
    );
  }

  return isAllowed ? children : null;
};

export default PremiumGuard;
