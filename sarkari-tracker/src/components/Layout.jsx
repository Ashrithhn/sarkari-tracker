import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ darkMode, toggleDarkMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef(null);

  // Automatically scroll viewport to top whenever navigating to any page (e.g. Disclaimer, Privacy, etc.)
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 transition-colors duration-300 flex flex-col font-sans text-slate-800 dark:text-slate-200">
      <Navbar 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <div className="flex flex-1 overflow-hidden pt-14 sm:pt-16">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <main ref={mainRef} className="flex-1 overflow-y-auto w-full flex flex-col justify-between">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 flex-1">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Layout;
