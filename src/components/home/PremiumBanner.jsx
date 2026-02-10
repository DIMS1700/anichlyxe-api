import React from 'react';
import { Crown, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const PremiumBanner = () => {
  return (
    <a href="https://wa.me/6282216631335?text=Min%20minat%20beli%20SC%20Web%20Anime%20LyxeNime" target="_blank" rel="noopener noreferrer" className="block w-full">
      <div className="w-full bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-4 border border-white/5 mb-6 relative overflow-hidden group hover:border-violet-500/30 transition-all duration-300">
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-violet-500/20 transition-all duration-500"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex flex-col gap-1 pr-2">
            <h3 className="text-lg font-bold text-white leading-tight">
              Ingin Punya <br />
              <span className="text-violet-500">Web Anime?</span>
            </h3>
            <p className="text-[10px] text-gray-400 group-hover:text-gray-300 transition-colors max-w-[200px] leading-relaxed">
              Beli SC-nya di Dimas. <br/>
              <span className="text-violet-400 font-bold">Membeli = Paham cara pakainya.</span>
            </p>
          </div>
          
          <button className="flex items-center gap-2 bg-violet-500 group-hover:bg-violet-600 text-white px-3 py-2 rounded-xl font-bold text-xs transition-all shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 group-active:scale-95 whitespace-nowrap">
            <MessageCircle size={16} fill="currentColor" />
            Chat Admin
          </button>
        </div>
      </div>
    </a>
  );
};

export default PremiumBanner;
