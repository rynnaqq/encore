import React from 'react';
import { motion } from 'framer-motion';
import { Star, Circle, Triangle } from 'lucide-react';

export const FloatingBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Floating Plus Accent */}
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [0, 45, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] left-[8%] text-[#E195AB] opacity-25 dark:opacity-10 transform-gpu"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </motion.div>

      {/* Floating Circle Accent */}
      <motion.div
        animate={{ y: [0, 16, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[38%] right-[12%] text-amber-400 opacity-25 dark:opacity-10 transform-gpu"
      >
        <Circle size={38} strokeWidth={1.5} />
      </motion.div>

      {/* Floating Triangle Accent */}
      <motion.div
        animate={{ y: [0, -14, 0], rotate: [0, -25, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[28%] left-[16%] text-[#E195AB] opacity-25 dark:opacity-10 transform-gpu"
      >
        <Triangle size={30} strokeWidth={1.5} />
      </motion.div>

      {/* Floating Star Accent */}
      <motion.div
        animate={{ y: [0, 12, 0], rotate: [0, 15, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute top-[68%] right-[20%] text-rose-400 opacity-25 dark:opacity-10 transform-gpu"
      >
        <Star size={34} strokeWidth={1.5} />
      </motion.div>
      
      {/* Ambient Mesh Orbs - Light Mode */}
      <div
        className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-gradient-to-br from-rose-100/40 via-pink-100/30 to-sky-100/30 rounded-full blur-3xl opacity-70 pointer-events-none dark:hidden"
      />
      <div
        className="absolute -bottom-[20%] -left-[10%] w-[700px] h-[700px] bg-gradient-to-tr from-sky-100/40 via-rose-100/20 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none dark:hidden"
      />

      {/* Ambient Mesh Orbs - Dark Mode */}
      <div
        className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-gradient-to-br from-slate-900/60 via-purple-950/20 to-slate-950 rounded-full blur-3xl opacity-40 pointer-events-none hidden dark:block"
      />
      <div
        className="absolute -bottom-[20%] -left-[10%] w-[700px] h-[700px] bg-gradient-to-tr from-slate-900/60 via-rose-950/15 to-transparent rounded-full blur-3xl opacity-40 pointer-events-none hidden dark:block"
      />
    </div>
  );
};


