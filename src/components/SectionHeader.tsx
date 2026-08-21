import React from 'react';
import { motion } from 'framer-motion';

interface SectionHeaderProps {
  icon?: React.ReactNode;
  badgeText?: string;
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  badgeText = 'Overview',
  title,
  subtitle,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center text-center mb-10 sm:mb-12 ${className}`}
    >
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E195AB]/10 text-[#E195AB] border border-[#E195AB]/25 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest mb-3">
        {icon}
        <span>{badgeText}</span>
      </div>
      <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
        {title}
      </h2>

      {subtitle && (
        <p className="font-sans text-xs sm:text-sm max-w-md mt-2.5 leading-relaxed text-slate-600 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};


