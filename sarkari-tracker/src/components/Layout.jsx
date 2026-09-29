import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ darkMode, toggleDarkMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef(null);

  // Automatically scroll viewport to top whenever navigating to any page
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#9bb0a4] dark:bg-black p-2 sm:p-4 lg:p-6 flex font-sans text-slate-800 dark:text-neutral-100 transition-colors duration-300">
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Outer Shell Rounded Container */}
      <div className="flex-1 bg-white dark:bg-[#0a0a0a] rounded-[34px] sm:rounded-[48px] lg:rounded-[52px] overflow-hidden flex shadow-2xl border border-slate-300/60 dark:border-neutral-800 relative p-2 sm:p-3.5 gap-2 sm:gap-3.5">
        
        {/* Floating Capsule Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative rounded-[28px] sm:rounded-[38px] bg-slate-50/40 dark:bg-black border border-slate-100 dark:border-neutral-800/80">
          
          {/* Navbar inline at top */}
          <Navbar 
            darkMode={darkMode} 
            toggleDarkMode={toggleDarkMode} 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          />
          
          {/* Main scrollable content */}
          <main ref={mainRef} className="flex-1 overflow-y-auto w-full flex flex-col justify-between custom-scrollbar px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
            <div className="w-full max-w-7xl mx-auto flex-1">
              <Outlet />
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
