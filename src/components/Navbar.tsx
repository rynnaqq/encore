import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowUpRight, User as UserIcon, Shield, LogOut, LogIn, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ProfileModal } from './ProfileModal';

interface NavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onOpenAboutModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  setActiveSection,
  onOpenAboutModal,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const { currentUser, logout, openLoginModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'about', label: 'About', path: '/' },
    { id: 'fishing', label: 'Fishing Game', path: '/fishing' },
    { id: 'chess', label: 'Chess Game', path: '/chess' },
    { id: 'snake', label: 'Snake & Ladders', path: '/snake-ladders' },
    { id: 'uno', label: 'UNO Game', path: '/uno' },
  ];

  if (currentUser?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Page', path: '/admin' });
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id: string, path: string) => {
    setHamburgerOpen(false);
    
    if (id === 'about' && onOpenAboutModal) {
      onOpenAboutModal();
      return;
    }

    // Require login before entering Snake & Ladders or UNO Game
    const isProtectedGame = id === 'snake' || id === 'uno' || path === '/snake-ladders' || path === '/uno';
    if (isProtectedGame && !currentUser) {
      openLoginModal(() => {
        navigate(path);
      });
      return;
    }

    if (path !== '/') {
      navigate(path);
    } else {
      if (location.pathname !== '/') {
        navigate('/');
        // Small delay to let the page render before scrolling
        setTimeout(() => {
          setActiveSection(id);
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  if (location.pathname === '/fishing') {
    return null;
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 pt-3 sm:pt-4 md:pt-6 px-3 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          <nav
            className={`flex items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3.5 rounded-2xl border transition-all duration-300 backdrop-blur-xl ${
              isScrolled
                ? 'bg-white/90 dark:bg-slate-900/90 border-[#FFCCE1] dark:border-slate-800 shadow-xl shadow-pink-200/40 dark:shadow-none'
                : 'bg-white/60 dark:bg-slate-900/60 border-[#FFCCE1]/50 dark:border-slate-800/50'
            }`}
          >
            {/* Brand Logo (Left) */}
            <button
              onClick={() => handleNavClick('home', '/')}
              className="flex items-center gap-1 cursor-pointer group focus:outline-none shrink-0"
              id="nav-logo-btn"
            >
              <span className={`font-sans text-lg xs:text-xl sm:text-2xl font-extrabold tracking-tight transition-colors text-slate-800 dark:text-slate-100 group-hover:text-[#E195AB]`}>
                Encore
              </span>
              <span className="text-[#E195AB] font-black text-xl sm:text-2xl leading-none">.</span>
            </button>

            {/* Right Action Cluster */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Theme Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                id="theme-toggle-btn"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 sm:px-3 sm:py-2 rounded-xl border flex items-center gap-1.5 transition-colors duration-300 cursor-pointer bg-white/80 dark:bg-slate-800/80 border-[#FFCCE1] dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#FFF5D7] dark:hover:bg-slate-700/80 shadow-sm overflow-hidden shrink-0"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {theme === 'dark' ? (
                    <motion.div
                      key="dark-sun-icon"
                      initial={{ rotate: -90, scale: 0, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      exit={{ rotate: 90, scale: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="flex items-center justify-center"
                    >
                      <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="light-moon-icon"
                      initial={{ rotate: 90, scale: 0, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      exit={{ rotate: -90, scale: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="flex items-center justify-center"
                    >
                      <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E195AB] shrink-0" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <span className="hidden md:inline text-xs font-mono font-bold">
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </span>
              </motion.button>

              {/* User Account Button */}
              {currentUser ? (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <button
                    onClick={() => {
                      setIsProfileModalOpen(true);
                    }}
                    className={`px-2 sm:px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-black flex items-center gap-1 sm:gap-1.5 transition-all max-w-[80px] xs:max-w-[120px] sm:max-w-[150px] ${
                      currentUser.role === 'admin'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-700/50 hover:bg-amber-200 dark:hover:bg-amber-900/50 cursor-pointer'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer'
                    }`}
                  >
                    {currentUser.role === 'admin' ? (
                      <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
                    ) : (
                      <UserIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#E195AB] shrink-0" />
                    )}
                    <span className="truncate">{currentUser.username}</span>
                  </button>
                  <button
                    onClick={logout}
                    title="Logout"
                    className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
                  >
                    <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={openLoginModal}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#E195AB] to-[#d68097] text-white text-[11px] sm:text-xs font-extrabold flex items-center gap-1 sm:gap-1.5 shadow-md shadow-pink-200 dark:shadow-none hover:opacity-95 transition-all cursor-pointer shrink-0"
                >
                  <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Login</span>
                </button>
              )}

              {/* Hamburger Toggle */}
              <button
                onClick={() => setHamburgerOpen(!hamburgerOpen)}
                id="mobile-menu-toggle"
                aria-label="Toggle Navigation Menu"
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border font-mono text-[11px] sm:text-xs font-semibold tracking-wide flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer bg-[#E195AB] border-[#E195AB] text-white hover:bg-[#FFCCE1] hover:text-[#E195AB] hover:border-[#FFCCE1] shrink-0"
              >
                <span>Menu</span>
                {hamburgerOpen ? <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Minimal Hamburger Menu Full Overlay Drawer */}
      <AnimatePresence>
        {hamburgerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border p-5 sm:p-6 relative shadow-2xl space-y-4 sm:space-y-5 bg-white dark:bg-slate-900 border-[#FFCCE1] dark:border-slate-800 text-slate-800 dark:text-slate-100`}
            >
              {/* Header inside Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-[#FFCCE1]/40 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">Navigation</span>
                </div>
                <button
                  onClick={() => setHamburgerOpen(false)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer bg-[#FFF5D7] dark:bg-slate-800 border-[#FFCCE1] dark:border-slate-700 text-[#E195AB] dark:text-slate-400 dark:hover:text-slate-100`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Theme Switch Row in Drawer */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                    {theme === 'dark' ? (
                      <Moon className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {theme === 'dark' ? 'Tampilan gelap aktif' : 'Tampilan terang aktif'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-[#E195AB] text-white hover:bg-[#d68097] transition-colors cursor-pointer"
                >
                  Ubah Mode
                </button>
              </div>

              {/* Navigation Items (Without numbers) */}
              <div className="space-y-2 font-sans">
                {navItems.map((item, idx) => {
                  const isActive = location.pathname === item.path && (item.path !== '/' || activeSection === item.id);
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ scale: 1.02, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNavClick(item.id, item.path)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-[#E195AB] dark:bg-slate-700 border-[#E195AB] dark:border-slate-600 text-white font-semibold'
                          : 'bg-[#FFF5D7] dark:bg-slate-800/50 border-[#FFCCE1] dark:border-slate-700 text-[#E195AB] dark:text-slate-300 hover:text-white dark:hover:text-white hover:bg-[#E195AB] dark:hover:bg-slate-700 hover:border-[#E195AB] dark:hover:border-slate-600'
                      }`}
                    >
                      <span className="text-base font-medium">
                        {item.label}
                      </span>
                      <ArrowUpRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                        isActive ? 'text-white' : 'text-[#E195AB]'
                      }`} />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </>
  );
};
