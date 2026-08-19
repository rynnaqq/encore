import React from 'react';
import { useLocation } from 'react-router-dom';

export const Footer: React.FC = () => {
  const location = useLocation();

  if (location.pathname === '/fishing') {
    return null;
  }

  return (
    <footer className="border-t py-10 transition-colors bg-white/50 dark:bg-slate-950/80 border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-1.5 text-xs">
        <p className="font-mono tracking-tight">
          © {new Date().getFullYear()} <span className="text-slate-800 dark:text-slate-200 font-bold">Encore Dev Studio</span>. All rights reserved.
        </p>
        <p className="text-[11px] font-sans text-slate-400 dark:text-slate-500">
          Crafted with React 19, TypeScript & Tailwind CSS.
        </p>
      </div>
    </footer>
  );
};


