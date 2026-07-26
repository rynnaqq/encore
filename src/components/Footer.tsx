import React from 'react';

interface FooterProps {
  isDarkMode: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isDarkMode }) => {
  return (
    <footer className={`border-t py-8 transition-colors bg-[#F2F9FF] border-[#FFCCE1] text-slate-600`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-1 text-xs">
        <p className="font-mono">
          © {new Date().getFullYear()} <span className={'text-slate-800 font-semibold'}>Ryan Dev Studio</span>. All rights reserved.
        </p>
        <p className={`text-[11px] font-sans text-slate-500`}>
          Built with React, TypeScript & Tailwind CSS.
        </p>
      </div>
    </footer>
  );
};
