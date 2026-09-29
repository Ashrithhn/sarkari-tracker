import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar as CalendarIcon, 
  Bell, 
  BookOpen, 
  Plus,
  User,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Applications', path: '/tracker', icon: Briefcase },
    { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Study Resources', path: '/resources', icon: BookOpen }
  ];

  const closeMobileSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <aside 
      className={`fixed lg:static inset-y-0 left-0 z-50 w-16 sm:w-18 bg-[#0a121e] dark:bg-[#060b13] rounded-[28px] sm:rounded-[36px] flex flex-col items-center py-5 shadow-lg border border-slate-800/80 transform transition-all duration-300 ease-in-out lg:translate-x-0 shrink-0 my-2 lg:my-0 ml-2 lg:ml-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Top App Icon / Plus Button */}
      <div className="mb-7 flex-shrink-0">
        <NavLink 
          to="/tracker" 
          title="Track New Exam"
          className="w-11 h-11 rounded-full bg-saffron-500 hover:bg-saffron-600 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </NavLink>
      </div>

      {/* Navigation Icons Stack */}
      <nav className="flex-1 flex flex-col gap-3.5 w-full px-2.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={closeMobileSidebar}
              title={item.name}
              className={({ isActive }) =>
                `w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 mx-auto ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon className="w-5 h-5" />
            </NavLink>
          );
        })}
      </nav>

      {/* User Avatar pinned to bottom */}
      <div className="mt-auto pt-4 flex-shrink-0">
        {user ? (
          <NavLink 
            to="/tracker" 
            className="w-11 h-11 rounded-full bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white/10 hover:ring-saffron-400 transition-all cursor-pointer"
            title={`${user.name} (${user.email})`}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </NavLink>
        ) : (
          <NavLink
            to="/login"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer ring-1 ring-white/10"
            title="Sign In / Register"
          >
            <User className="w-5 h-5" />
          </NavLink>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
