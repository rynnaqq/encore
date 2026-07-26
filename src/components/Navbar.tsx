import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  setActiveSection,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'about', label: 'About', path: '/' },
    { id: 'game', label: 'Calc Game', path: '/game' },
    { id: 'chess', label: 'Chess Game', path: '/chess' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id: string, path: string) => {
    setHamburgerOpen(false);
    
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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 pt-4 md:pt-6 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          <nav
            className={`flex items-center justify-between px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl border transition-all duration-300 backdrop-blur-xl ${
              isScrolled
                ? 'bg-white/90 border-[#FFCCE1] shadow-xl shadow-pink-200/40'
                : 'bg-white/60 border-[#FFCCE1]/50'
            }`}
          >
            {/* Brand Logo (Left) */}
            <button
              onClick={() => handleNavClick('home', '/')}
              className="flex items-center gap-1.5 cursor-pointer group focus:outline-none"
              id="nav-logo-btn"
            >
              <span className={`font-sans text-xl sm:text-2xl font-extrabold tracking-tight transition-colors text-slate-800 group-hover:text-[#E195AB]`}>
                Encore
              </span>
              <span className="text-[#E195AB] font-black text-2xl leading-none">.</span>
            </button>

            {/* Right Action Cluster: Hamburger Only */}
            <div className="flex items-center gap-2.5">
              {/* Hamburger Toggle */}
              <button
                onClick={() => setHamburgerOpen(!hamburgerOpen)}
                id="mobile-menu-toggle"
                aria-label="Toggle Navigation Menu"
                className="px-3.5 py-2 rounded-xl border font-mono text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer bg-[#E195AB] border-[#E195AB] text-white hover:bg-[#FFCCE1] hover:text-[#E195AB] hover:border-[#FFCCE1]"
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
              className={`w-full max-w-md rounded-2xl border p-6 relative shadow-2xl space-y-6 bg-white border-[#FFCCE1] text-slate-800`}
            >
              {/* Header inside Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-[#FFCCE1]/40">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">Navigation</span>
                </div>
                <button
                  onClick={() => setHamburgerOpen(false)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer bg-[#FFF5D7] border-[#FFCCE1] text-[#E195AB]`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items (Without numbers) */}
              <div className="space-y-2 font-sans">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path && (item.path !== '/' || activeSection === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id, item.path)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-[#E195AB] border-[#E195AB] text-white font-semibold'
                          : 'bg-[#FFF5D7] border-[#FFCCE1] text-[#E195AB] hover:text-white hover:bg-[#E195AB] hover:border-[#E195AB]'
                      }`}
                    >
                      <span className="text-base font-medium">
                        {item.label}
                      </span>
                      <ArrowUpRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                        isActive ? 'text-white' : 'text-[#E195AB]'
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
