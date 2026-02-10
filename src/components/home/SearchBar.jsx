import React from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
  const navigate = useNavigate();

  return (
    <div className="relative mb-6" onClick={() => navigate('/search')}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        <Search size={20} />
      </div>
      <div 
        className="w-full bg-dark-card border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-gray-400 cursor-pointer hover:border-white/20 transition-all select-none"
      >
        Cari Anime Di Sini...
      </div>
    </div>
  );
};

export default SearchBar;
