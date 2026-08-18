import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Terminal, Code, Cpu, CheckCircle2, Sparkles, Award, Heart, Mail, ExternalLink, Zap } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'highlights'>('overview');
  const [imgSrc, setImgSrc] = useState<string>('/favicon.png');
  const [hasImgError, setHasImgError] = useState<boolean>(false);

  const highlights = [
    { title: 'Clean & Scalable Architecture', desc: 'Modular components built with TypeScript and strict type safety.' },
    { title: 'Pixel-Perfect Responsive UI', desc: 'Adaptive layouts optimized seamlessly for mobile, tablet, and ultra-wide screens.' },
    { title: 'Modern React 18+ Ecosystem', desc: 'Utilizing Vite, Tailwind CSS, Motion animations, and custom state engines.' },
    { title: 'Lightning Fast Load Times', desc: 'Performance-focused code splitting, lazy asset loading, and tight bundles.' },
  ];

  const skillCategories = [
    {
      title: 'Frontend Development',
      icon: Code,
      skills: [
        { name: 'React.js', level: 95, color: '#38bdf8' },
        { name: 'TypeScript', level: 90, color: '#60a5fa' },
        { name: 'Tailwind CSS', level: 98, color: '#38bdf8' },
        { name: 'HTML5 / Modern CSS', level: 95, color: '#f97316' },
      ],
    },
    {
      title: 'Engineering & Tools',
      icon: Cpu,
      skills: [
        { name: 'Vite & Webpack', level: 88, color: '#a855f7' },
        { name: 'Framer Motion / Motion', level: 92, color: '#ec4899' },
        { name: 'Git & Version Control', level: 90, color: '#ef4444' },
        { name: 'REST APIs & Async State', level: 85, color: '#10b981' },
      ],
    },
  ];

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'linear' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer transform-gpu z-[99999]"
          />

          {/* Pop-Up Modal Container */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl max-h-[90dvh] bg-white dark:bg-slate-900 border-2 border-[#FFCCE1] dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-[100000] my-auto text-slate-800 dark:text-slate-100 flex flex-col gpu-smooth transform-gpu"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Decorative Banner */}
            <div className="bg-gradient-to-r from-[#FFCCE1] via-[#E195AB] to-[#FFF5D7] dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 relative p-4 sm:p-6 pb-5 sm:pb-6 shrink-0 border-b border-[#FFCCE1] dark:border-slate-800 transition-colors">
              {/* Floating Animated Stars in Header */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute top-2 right-12 text-white/40 dark:text-slate-700/50 pointer-events-none"
              >
                <Sparkles className="w-16 h-16" />
              </motion.div>

              {/* Top Header Controls Row */}
              <div className="flex items-center justify-end gap-2 mb-3 sm:mb-4 relative z-10">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center border border-[#FFCCE1] dark:border-slate-700 shadow-md transition-all hover:rotate-90 active:scale-90 cursor-pointer shrink-0"
                  aria-label="Close Pop Up"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Avatar & Profile Title Header */}
              <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                <motion.div
                  initial={{ scale: 0.88, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-[#FFF5D7] dark:bg-slate-800 border-3 sm:border-4 border-white dark:border-slate-700 shadow-xl flex items-center justify-center text-[#E195AB] dark:text-[#FFCCE1] shrink-0 relative overflow-hidden"
                >
                  {!hasImgError ? (
                    <img
                      src={imgSrc}
                      alt="Encore Profile"
                      className="w-full h-full object-cover object-center"
                      onError={() => {
                        if (imgSrc === '/favicon.png') {
                          setImgSrc('/assets/images/favicon.png');
                        } else {
                          setHasImgError(true);
                        }
                      }}
                    />
                  ) : (
                    <User className="w-8 h-8 sm:w-12 sm:h-12 text-[#E195AB] dark:text-[#FFCCE1]" />
                  )}
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span>Encore</span>
                    <span className="text-[10px] sm:text-xs bg-[#E195AB] dark:bg-[#d68097] text-white font-mono px-2 py-0.5 rounded-full shadow-sm font-bold">Dev</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-mono font-medium truncate mt-0.5">
                    Frontend Developer & Craftsman
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-[#FFCCE1]/60 dark:border-slate-800/60 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar bg-white dark:bg-slate-900 shrink-0">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'skills', label: 'Tech Stack', icon: Terminal },
                { id: 'highlights', label: 'Highlights', icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`relative px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      isActive ? 'text-white font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-[#E195AB] dark:hover:text-[#FFCCE1] hover:bg-[#FFF5D7] dark:hover:bg-slate-800'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeAboutPopUpTab"
                        className="absolute inset-0 bg-[#E195AB] rounded-xl shadow-md shadow-pink-300/40 dark:shadow-none"
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content Area */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-2xl bg-[#FFF5D7] dark:bg-slate-800/70 border border-[#FFCCE1] dark:border-slate-700/80 space-y-2.5">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#E195AB] dark:text-[#FFCCE1]" />
                        Crafting Web Magic
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                        Hello! I'm <strong>Encore</strong>, a dedicated frontend developer with a passion for designing polished, interactive digital experiences. I believe code should be as clean and elegant as the interfaces it powers.
                      </p>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                        Specializing in React, TypeScript, and modern styling architectures, I build applications that prioritize accessibility, smooth motion design, and responsive perfection.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl border border-[#FFCCE1] dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#FFCCE1]/50 dark:bg-slate-700 flex items-center justify-center text-[#E195AB] dark:text-[#FFCCE1] shrink-0">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Fast Performance</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">Optimized React Code</div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-[#FFCCE1] dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#FFCCE1]/50 dark:bg-slate-700 flex items-center justify-center text-[#E195AB] dark:text-[#FFCCE1] shrink-0">
                          <Heart className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">User Focused</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">Delightful Interactions</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'skills' && (
                  <motion.div
                    key="skills"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-5"
                  >
                    {skillCategories.map((cat, idx) => {
                      const Icon = cat.icon;
                      return (
                        <div key={idx} className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                            <Icon className="w-4 h-4 text-[#E195AB] dark:text-[#FFCCE1]" />
                            {cat.title}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {cat.skills.map((skill, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-3 rounded-xl border border-[#FFCCE1] dark:border-slate-800 bg-[#FFF5D7]/50 dark:bg-slate-800/50 space-y-1.5"
                              >
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  <span>{skill.name}</span>
                                  <span className="font-mono text-[10px] text-[#E195AB] dark:text-[#FFCCE1] font-bold">{skill.level}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-white dark:bg-slate-950 border border-[#FFCCE1] dark:border-slate-700 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${skill.level}%` }}
                                    transition={{ duration: 0.8, delay: sIdx * 0.1, ease: 'easeOut' }}
                                    className="h-full bg-[#E195AB] rounded-full"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {activeTab === 'highlights' && (
                  <motion.div
                    key="highlights"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-3"
                  >
                    {highlights.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="p-3.5 rounded-xl border border-[#FFCCE1] dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-[#E195AB] dark:hover:border-slate-700 hover:bg-[#FFF5D7]/40 dark:hover:bg-slate-800 transition-all flex items-start gap-3"
                      >
                        <CheckCircle2 className="w-5 h-5 text-[#E195AB] dark:text-[#FFCCE1] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-[#FFCCE1]/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">Designed by Encore</span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-[#FFCCE1] dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-white dark:bg-slate-900 transition-colors cursor-pointer"
                >
                  Close
                </motion.button>
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  href="mailto:contact@encore.dev"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-[#E195AB] text-white text-xs font-bold hover:bg-[#d68097] dark:hover:bg-[#E195AB]/90 transition-all flex items-center gap-1.5 shadow-md shadow-pink-200/50 dark:shadow-none cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Contact Me
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
