import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Sun, Moon, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  setActiveSection,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setHamburgerOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 pt-4 md:pt-6 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          <nav
            className={`flex items-center justify-between px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl border transition-all duration-300 backdrop-blur-xl ${
              isDarkMode
                ? isScrolled
                  ? 'bg-[#121214]/90 border-[#27272a] shadow-xl shadow-black/40'
                  : 'bg-[#121214]/60 border-[#27272a]/50'
                : isScrolled
                  ? 'bg-white/90 border-[#e4e4e7] shadow-lg shadow-zinc-200/50'
                  : 'bg-white/60 border-[#e4e4e7]/60'
            }`}
          >
            {/* Brand Logo (Left) */}
            <button
              onClick={() => scrollTo('home')}
              className="flex items-center gap-1.5 cursor-pointer group focus:outline-none"
              id="nav-logo-btn"
            >
              <span className={`font-sans text-xl sm:text-2xl font-extrabold tracking-tight transition-colors ${
                isDarkMode ? 'text-zinc-100 group-hover:text-[#e8590c]' : 'text-zinc-900 group-hover:text-[#e8590c]'
              }`}>
                Ryan
              </span>
              <span className="text-[#e8590c] font-black text-2xl leading-none">.</span>
            </button>

            {/* Right Action Cluster: Theme Toggle + Hamburger Only */}
            <div className="flex items-center gap-2.5">
              {/* Dark / Light Mode Toggle */}
              <button
                onClick={onToggleDarkMode}
                id="theme-toggle-btn"
                aria-label="Toggle Dark / Light Mode"
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  isDarkMode
                    ? 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:text-white hover:border-[#3f3f46]'
                    : 'bg-[#f4f4f5] border-[#e4e4e7] text-zinc-700 hover:text-zinc-900 hover:border-[#d4d4d8]'
                }`}
                title={isDarkMode ? 'Switch to Light Minimal Mode' : 'Switch to Dark Minimal Mode'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-[#e8590c]" /> : <Moon className="w-4 h-4 text-[#e8590c]" />}
              </button>

              {/* Hamburger Toggle */}
              <button
                onClick={() => setHamburgerOpen(!hamburgerOpen)}
                id="mobile-menu-toggle"
                aria-label="Toggle Navigation Menu"
                className="px-3.5 py-2 rounded-xl border font-mono text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer bg-[#e8590c] border-[#e8590c] text-white hover:bg-[#d94e02]"
              >
                <span>Menu</span>
                {hamburgerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full max-w-md rounded-2xl border p-6 relative shadow-2xl space-y-6 ${
                isDarkMode
                  ? 'bg-[#121214] border-[#27272a] text-zinc-100'
                  : 'bg-white border-[#e4e4e7] text-zinc-900'
              }`}
            >
              {/* Header inside Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-[#27272a]/40">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">Navigation</span>
                </div>
                <button
                  onClick={() => setHamburgerOpen(false)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    isDarkMode ? 'bg-[#18181b] border-[#27272a] text-zinc-300' : 'bg-[#f4f4f5] border-[#e4e4e7] text-zinc-700'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items (Without numbers) */}
              <div className="space-y-2 font-sans">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-[#e8590c] border-[#e8590c] text-white font-semibold'
                          : isDarkMode
                            ? 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:text-white hover:border-[#3f3f46]'
                            : 'bg-[#f4f4f5] border-[#e4e4e7] text-zinc-700 hover:text-zinc-900 hover:border-[#d4d4d8]'
                      }`}
                    >
                      <span className="text-base font-medium">
                        {item.label}
                      </span>
                      <ArrowUpRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                        isActive ? 'text-white' : 'text-zinc-400'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
