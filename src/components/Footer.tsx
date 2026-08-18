import React from 'react';
import { useLocation } from 'react-router-dom';

export const Footer: React.FC = () => {
  const location = useLocation();

  if (location.pathname === '/fishing') {
    return null;
  }

  return (
    <footer className="border-t py-8 transition-colors bg-[#F2F9FF] dark:bg-slate-950 border-[#FFCCE1] dark:border-slate-800 text-slate-600 dark:text-slate-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-1 text-xs">
        <p className="font-mono">
          © {new Date().getFullYear()} <span className="text-slate-800 dark:text-slate-200 font-semibold">Encore Dev Studio</span>. All rights reserved.
        </p>
        <p className="text-[11px] font-sans text-slate-500 dark:text-slate-500">
          Built with React, TypeScript & Tailwind CSS.
        </p>
      </div>
    </footer>
  );
};

