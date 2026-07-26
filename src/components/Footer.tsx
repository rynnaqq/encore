import React from 'react';

interface FooterProps {
  isDarkMode: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isDarkMode }) => {
  return (
    <footer className={`border-t py-8 transition-colors ${
      isDarkMode
        ? 'bg-[#0f0f11] border-[#27272a]/60 text-zinc-400'
        : 'bg-[#fafafa] border-[#e4e4e7] text-zinc-600'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-1 text-xs">
        <p className="font-mono">
          © {new Date().getFullYear()} <span className={isDarkMode ? 'text-zinc-200 font-semibold' : 'text-zinc-800 font-semibold'}>Ryan Dev Studio</span>. All rights reserved.
        </p>
        <p className={`text-[11px] font-sans ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
          Built with React, TypeScript & Tailwind CSS.
        </p>
      </div>
    </footer>
  );
};
