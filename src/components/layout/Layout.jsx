import React, { useState } from 'react';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import ChatButton from '../chat/ChatButton';

const Layout = ({ children, withBottomNav = true, fullWidth = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans selection:bg-brand-gold selection:text-black">
      <div className="w-full min-h-screen relative bg-dark-bg">
        <main className={fullWidth ? (withBottomNav ? 'pb-24 w-full' : 'w-full') : `${withBottomNav ? 'pb-24' : 'pb-6'} px-4 pt-4 md:px-6 lg:px-8 max-w-7xl mx-auto`}>
          {children}
        </main>
        
        {/* Sidebar Overlay */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {withBottomNav && (
          <>
            <ChatButton />
            <BottomNav onMenuClick={() => setIsSidebarOpen(true)} />
          </>
        )}
      </div>
    </div>
  );
};

export default Layout;
