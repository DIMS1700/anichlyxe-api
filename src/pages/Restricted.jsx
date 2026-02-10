import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Lock, Crown, ChevronLeft, ShieldAlert } from 'lucide-react';

const Restricted = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-[#111111] text-white flex flex-col items-center justify-center p-6 text-center">
        
        {/* Icon Gembok Besar */}
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse border border-red-500/20">
            <Lock size={48} className="text-red-500" />
        </div>

        <h1 className="text-2xl font-black text-white mb-2">Akses Ditolak!</h1>
        <p className="text-sm text-gray-400 max-w-xs mb-8">
            Eits, tunggu dulu bosku! Halaman ini mengandung konten <span className="text-red-400 font-bold">VIP 18+</span> yang hanya bisa diakses oleh member Premium.
        </p>

        {/* Benefit Card */}
        <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6 w-full max-w-sm mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 bg-gradient-to-bl from-yellow-500/20 to-transparent rounded-bl-2xl">
                <Crown size={20} className="text-yellow-500" />
            </div>
            
            <h3 className="font-bold text-white mb-4 flex items-center justify-center gap-2">
                Kenapa harus Premium?
            </h3>
            
            <ul className="space-y-3 text-left text-sm text-gray-400">
                <li className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-green-500" /> 
                    <span>Buka akses menu 18+ tanpa batas</span>
                </li>
                <li className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-green-500" /> 
                    <span>Bebas iklan yang mengganggu</span>
                </li>
                <li className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-green-500" /> 
                    <span>Dukungan server prioritas</span>
                </li>
            </ul>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-3">
            <button 
                onClick={() => navigate('/premium')}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
                <Crown size={18} fill="currentColor" />
                Beli Premium Sekarang
            </button>
            
            <button 
                onClick={() => navigate('/')}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <ChevronLeft size={18} />
                Kembali ke Beranda
            </button>
        </div>

      </div>
    </Layout>
  );
};

export default Restricted;
