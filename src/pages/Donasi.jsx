import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Heart, Copy, Check, MessageCircle, Zap, Coffee, ExternalLink } from 'lucide-react';

const Donasi = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('085320544198');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="min-h-screen pb-10 pt-4">
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
            <Heart size={40} className="text-orange-500 fill-orange-500 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Dukung <span className="text-orange-500">Lyxe</span>Nime</h1>
          <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
            Bantu admin beli kopi & bayar server biar website tetap ngebut dan update setiap hari! 🚀
          </p>
        </div>

        {/* Donation Card */}
        <div className="bg-[#18181b] border border-white/5 rounded-3xl p-1 overflow-hidden max-w-md mx-auto mb-8 shadow-2xl relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100"></div>
          
          <div className="bg-[#111111] rounded-[20px] p-6 relative z-10">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                  <WalletIcon />
               </div>
               <div>
                 <h2 className="text-lg font-bold text-white">Transfer DANA</h2>
                 <p className="text-xs text-gray-500">Atas nama <span className="text-blue-400 font-bold">Dimas Baetul Rohman</span></p>
               </div>
            </div>

            <div className="bg-[#18181b] border border-white/5 rounded-xl p-4 mb-6 flex items-center justify-between group-hover:border-blue-500/30 transition-colors">
              <span className="font-mono text-xl font-bold text-white tracking-widest">082216631335</span>
              <button 
                onClick={handleCopy}
                className={`p-2 rounded-lg transition-all ${
                  copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>

            <p className="text-[10px] text-center text-gray-600 italic">
              "Sekecil apapun donasi kalian sangat berarti bagi kelangsungan website ini."
            </p>
          </div>
        </div>

        {/* Community Card */}
        <div className="max-w-md mx-auto mb-10">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <MessageCircle size={18} className="text-green-500" />
                Gabung Komunitas
            </h3>
            
            <a 
                href="https://chat.whatsapp.com/BoRxAA8ox5GC7MD7EJfi31?mode=gi_t"
                target="_blank"
                rel="noreferrer" 
                className="block bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-2xl p-6 relative overflow-hidden group hover:border-green-500/60 transition-all"
            >
                 <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                     <MessageCircle size={80} />
                 </div>
                 
                 <div className="relative z-10 flex items-center gap-4">
                     <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                         <MessageCircle size={24} className="text-white fill-white" />
                     </div>
                     <div>
                         <h4 className="font-bold text-white text-lg">Grup WhatsApp</h4>
                         <p className="text-xs text-green-200/80">Diskusi anime, request, & mabar.</p>
                     </div>
                     <div className="ml-auto">
                         <ExternalLink size={20} className="text-green-500" />
                     </div>
                 </div>
            </a>
        </div>

      </div>
    </Layout>
  );
};

// Simple Wallet Icon Component
const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
);

export default Donasi;
