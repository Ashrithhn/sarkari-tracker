import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar as CalendarIcon, 
  Bell, 
  BookOpen, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EXAM_CATEGORIES } from '../utils/constants';

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
      className={`fixed lg:static inset-y-0 left-0 z-20 w-64 bg-white/95 dark:bg-[#0B0D10]/95 backdrop-blur-xl border-r border-gray-200 dark:border-white/[0.08] transform transition-transform duration-300 ease-in-out lg:translate-x-0 pt-16 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        <nav className="space-y-1 mb-8">
          <p className="px-3 text-xs font-semibold text-slate-400 dark:text-[#A0A6B1] uppercase tracking-wider mb-2">Main Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={closeMobileSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 font-semibold'
                      : 'text-slate-600 dark:text-[#A0A6B1] hover:bg-slate-100 dark:hover:bg-[#14171D] hover:dark:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            );
          })}
        </nav>

        <div>
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Exam Categories</p>
          <div className="space-y-1">
            {EXAM_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <NavLink
                  key={cat.id}
                  to={`/?category=${cat.id}`}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-300 text-left`
                  }
                >
                  <Icon className={`w-4 h-4 ${cat.color} shrink-0`} />
                  <span className="text-xs font-medium truncate">{cat.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Legal & Trust Navigation in Sidebar */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-navy-700/60">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Legal & Advisory</p>
          <div className="space-y-0.5 text-xs">
            <NavLink
              to="/disclaimer"
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
                }`
              }
            >
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Legal Disclaimer</span>
            </NavLink>

            <NavLink
              to="/contact"
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-saffron-50 dark:bg-saffron-950/40 text-saffron-700 dark:text-saffron-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
                }`
              }
            >
              <Mail className="w-4 h-4 text-saffron-500 shrink-0" />
              <span>Contact & Help</span>
            </NavLink>

            <NavLink
              to="/about"
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
                }`
              }
            >
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              <span>About Mission</span>
            </NavLink>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-100 dark:border-navy-700/50">
        <div className="p-3 rounded-xl bg-gradient-to-br from-saffron-50 to-orange-50 dark:from-navy-800 dark:to-navy-900 border border-saffron-200/60 dark:border-navy-700 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-saffron-800 dark:text-saffron-300">
            <ShieldCheck className="w-3.5 h-3.5 text-saffron-500" />
            <span>Verified Portal</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
            100% verified commission dates. Unannounced dates show "Will be updated soon".
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
