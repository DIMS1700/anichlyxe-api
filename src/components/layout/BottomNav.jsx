import React from 'react';
import { Home, Calendar, User, Menu as MenuIcon, Crown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link, useLocation } from 'react-router-dom';

const NavItem = ({ icon: Icon, label, isActive, to = "/" }) => (
  <Link to={to} className="flex flex-col items-center justify-center gap-1 w-full h-full text-center group">
    <Icon 
      size={24} 
      className={cn(
        "transition-colors duration-200", 
        isActive ? "text-violet-500 fill-violet-500/20" : "text-gray-500 group-hover:text-white"
      )} 
      strokeWidth={isActive ? 2.5 : 2}
    />
    <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-violet-500" : "text-gray-500")}>
      {label}
    </span>
  </Link>
);

const BottomNav = ({ onMenuClick }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-xl border-t border-white/5 h-16 pb-safe">
      <div className="grid grid-cols-5 h-full max-w-7xl mx-auto relative">
        <NavItem icon={Home} label="Home" isActive={isActive('/')} to="/" />
        <NavItem icon={Calendar} label="Jadwal" isActive={isActive('/schedule')} to="/schedule" />
        
        {/* Special Menu Button */}
        <div className="flex items-center justify-center relative">
          <button 
            onClick={onMenuClick}
            className="absolute -top-6 flex flex-col items-center justify-center bg-violet-500 rounded-full w-14 h-14 shadow-lg shadow-violet-500/20 border-4 border-[#111111] hover:scale-105 active:scale-95 transition-all duration-200 group"
          >
            <MenuIcon className="text-white" size={24} strokeWidth={2.5} />
          </button>
          <span className="absolute bottom-2 text-[10px] font-medium text-gray-500 mt-8">Menu</span>
        </div>

        <NavItem icon={Crown} label="Premium" isActive={isActive('/premium')} to="/premium" />
        <NavItem icon={User} label="Profil" isActive={isActive('/profile')} to="/profile" />
      </div>
    </div>
  );
};

export default BottomNav;
