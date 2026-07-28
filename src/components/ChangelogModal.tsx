import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Megaphone, FileText, Gift, Bug, Rocket, ChevronRight } from 'lucide-react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const changelogs = [
    {
      version: 'v1.2.3',
      date: 'July 27, 2026',
      type: 'update',
      title: 'Snake & Ladders Logic Fixed',
      items: [
        'Updated Snakes and Ladders board logic to perfectly match the custom board image.',
        'Fixed board design issue where edges were cut off on some devices.',
      ],
      icon: Sparkles,
      color: 'text-amber-500',
      bg: 'bg-amber-100',
      border: 'border-amber-200'
    },
    {
      version: 'v1.2.2',
      date: 'July 27, 2026',
      type: 'update',
      title: 'Snake & Ladders Visual Redesign',
      items: [
        'Updated Snakes and Ladders board design and graphics.',
        'Matched the underlying game logic (snakes & ladders positions) to the new custom board layout.',
        'Removed all pink dots from the game board.',
      ],
      icon: Sparkles,
      color: 'text-amber-500',
      bg: 'bg-amber-100',
      border: 'border-amber-200'
    },
    {
      version: 'v1.2.1',
      date: 'July 27, 2026',
      type: 'update',
      title: 'Snake & Ladders Visual Overhaul',
      items: [
        'Improved visuals for snakes and ladders on the board.',
        'Removed pink dotted background for better clarity.',
        'Optimized animations for low-end devices.'
      ],
      icon: Sparkles,
      color: 'text-pink-500',
      bg: 'bg-pink-100',
      border: 'border-pink-200'
    },
    {
      version: 'v1.2.0',
      date: 'July 27, 2026',
      type: 'feature',
      title: 'Global Multiplayer for Snakes & Ladders',
      items: [
        'Added real-time online multiplayer to Snakes & Ladders using WebSockets.',
        'Play with up to 4 players globally in private rooms.',
        'Live dice rolling animations and turn synchronization.',
        'Added Game Setup screen to easily create or join rooms.'
      ],
      icon: Rocket,
      color: 'text-indigo-500',
      bg: 'bg-indigo-100',
      border: 'border-indigo-200'
    },
    {
      version: 'v1.1.0',
      date: 'July 20, 2026',
      type: 'feature',
      title: 'Global Multiplayer Chess',
      items: [
        'Added global multiplayer chess with Socket.io backend.',
        'Play in real-time, spectate games, and use emojis/chat in rooms.',
        'Draw offer and rematch mechanics included.',
        'Responsive board design and move history.'
      ],
      icon: Gift,
      color: 'text-emerald-500',
      bg: 'bg-emerald-100',
      border: 'border-emerald-200'
    },
    {
      version: 'v1.0.1',
      date: 'July 15, 2026',
      type: 'fix',
      title: 'UI & UX Improvements',
      items: [
        'Enhanced modal animations and hover states across the application.',
        'Fixed minor layout shifts on mobile devices.',
        'Optimized bundle size for faster initial load.'
      ],
      icon: Bug,
      color: 'text-amber-500',
      bg: 'bg-amber-100',
      border: 'border-amber-200'
    },
    {
      version: 'v1.0.0',
      date: 'July 1, 2026',
      type: 'launch',
      title: 'Initial Release',
      items: [
        'Launched the interactive portfolio website.',
        'Included functional Fishing Game, local Chess, and Snakes & Ladders.',
        'Added floating background and cybernetic loading screen.'
      ],
      icon: Sparkles,
      color: 'text-[#E195AB]',
      bg: 'bg-[#FFCCE1]/40',
      border: 'border-[#FFCCE1]'
    }
  ];

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
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
            className="relative w-full max-w-xl max-h-[90vh] bg-white border-2 border-[#FFCCE1] rounded-3xl shadow-2xl overflow-hidden z-[100000] my-auto text-slate-800 flex flex-col gpu-smooth transform-gpu"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Decorative Banner */}
            <div className="bg-gradient-to-r from-[#FFF5D7] via-[#FFCCE1] to-[#E195AB] relative p-5 sm:p-6 pb-6 shrink-0 border-b border-[#FFCCE1]">
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute top-2 left-12 text-white/40 pointer-events-none"
              >
                <Megaphone className="w-16 h-16" />
              </motion.div>
              
              <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="bg-white/95 backdrop-blur-sm text-slate-800 text-[10px] sm:text-xs font-mono font-bold px-2.5 sm:px-3 py-1 rounded-full border border-white flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <span className="w-2 h-2 rounded-full bg-[#E195AB] animate-pulse" />
                  <span>What's New</span>
                </motion.div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 text-slate-700 hover:text-rose-500 hover:bg-white flex items-center justify-center border border-[#FFCCE1] shadow-md transition-transform hover:rotate-90 active:scale-90 cursor-pointer shrink-0"
                  aria-label="Close Pop Up"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="relative z-10 flex items-center gap-4 mt-2">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0 border border-[#FFCCE1]">
                  <FileText className="w-6 h-6 text-[#E195AB]" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Changelog</h2>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700/80">Stay up to date with the latest updates.</p>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 space-y-6">
              {changelogs.slice(0, 1).map((log, index) => {
                const Icon = log.icon;
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={log.version}
                    className="relative pl-6 sm:pl-8 border-l-2 border-[#FFCCE1]/50 last:border-transparent pb-2 last:pb-0"
                  >
                    <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-white border-2 border-[#FFCCE1] flex items-center justify-center shadow-sm`}>
                      <Icon className={`w-4 h-4 ${log.color}`} />
                    </div>
                    
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-[#FFCCE1] transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${log.bg} ${log.color} border ${log.border}`}>
                            {log.version}
                          </span>
                          <span className="text-sm font-black text-slate-800">{log.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{log.date}</span>
                      </div>
                      
                      <ul className="space-y-2">
                        {log.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-[#FFCCE1]/60 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">Version {changelogs[0].version}</span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-all shadow-md cursor-pointer"
                >
                  Awesome, thanks!
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
