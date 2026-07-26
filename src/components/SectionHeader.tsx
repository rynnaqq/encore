import React from 'react';
import { motion } from 'motion/react';

interface SectionHeaderProps {
  icon?: React.ReactNode;
  badgeText?: string;
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
  isDarkMode?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  badgeText,
  title,
  subtitle,
  className = '',
  isDarkMode = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center text-center mb-10 sm:mb-12 ${className}`}
    >
      {badgeText && (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 font-mono text-xs font-semibold uppercase tracking-wider ${
          isDarkMode ? 'bg-[#18181b] border-[#27272a] text-[#e8590c]' : 'bg-[#f4f4f5] border-[#e4e4e7] text-[#e8590c]'
        }`}>
          {icon}
          <span>{badgeText}</span>
        </div>
      )}

      <h2 className={`font-sans text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight ${
        isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
      }`}>
        {title}
      </h2>

      {subtitle && (
        <p className={`font-sans text-xs sm:text-sm max-w-md mt-2.5 leading-relaxed ${
          isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
        }`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
