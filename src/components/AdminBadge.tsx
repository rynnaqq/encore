import React from 'react';
import { Crown, Sparkles, Code2, Compass } from 'lucide-react';

const adminUsernamesSet = new Set<string>(['adminkawaaii']);
const developerUsernamesSet = new Set<string>(['encore', 'developer']);

export const registerAdminUsername = (username?: string | null) => {
  if (username) {
    adminUsernamesSet.add(username.trim().toLowerCase());
  }
};

export const registerAdminUsernames = (usernames: string[]) => {
  usernames.forEach((u) => registerAdminUsername(u));
};

export const isAdminName = (name?: string | null): boolean => {
  if (!name) return false;
  const clean = name.trim().toLowerCase();
  return adminUsernamesSet.has(clean) || clean === 'adminkawaaii';
};

export const isDeveloperName = (name?: string | null): boolean => {
  if (!name) return false;
  const clean = name.trim().toLowerCase();
  return developerUsernamesSet.has(clean) || clean === 'encore' || clean === 'developer';
};

export const AdminBadge: React.FC<{ className?: string; size?: 'sm' | 'md' }> = ({ className = '', size = 'sm' }) => {
  const isSm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1 font-black uppercase tracking-wider rounded-full shrink-0 select-none transition-all duration-300 relative overflow-hidden group
      bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950
      border border-amber-200/90 dark:border-amber-400/90
      shadow-[0_2px_10px_rgba(245,158,11,0.35)] dark:shadow-[0_2px_14px_rgba(245,158,11,0.25)]
      hover:shadow-[0_3px_14px_rgba(245,158,11,0.5)] hover:scale-[1.03] active:scale-[0.98]
      ${isSm ? 'px-2 py-0.5 text-[9.5px]' : 'px-2.5 py-1 text-[11px]'}
      ${className}`}
      title="Verified Administrator"
    >
      {/* Subtle shine reflection sweep */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
      <Crown className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-slate-950 fill-slate-950 shrink-0 drop-shadow-xs`} />
      <span className="font-extrabold tracking-widest leading-none">Admin</span>
      <Sparkles className={`${isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-amber-900/80 shrink-0 opacity-80`} />
    </span>
  );
};

export const GuestBadge: React.FC<{ className?: string; size?: 'sm' | 'md' }> = ({ className = '', size = 'sm' }) => {
  const isSm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-full shrink-0 select-none transition-all duration-200
      bg-gradient-to-r from-slate-100/90 via-sky-50/70 to-slate-200/80 dark:from-slate-800/90 dark:via-slate-800/60 dark:to-slate-900/90
      text-slate-600 dark:text-slate-300
      border border-slate-200/90 dark:border-slate-700/80
      shadow-[0_1px_4px_rgba(0,0,0,0.04)] dark:shadow-none
      hover:border-sky-300 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-100
      ${isSm ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'}
      ${className}`}
      title="Guest Visitor"
    >
      <Compass className={`${isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-sky-500 dark:text-sky-400 shrink-0 opacity-90`} />
      <span className="font-bold tracking-wider leading-none">Guest</span>
    </span>
  );
};

export const DeveloperBadge: React.FC<{ className?: string; size?: 'sm' | 'md' }> = ({ className = '', size = 'sm' }) => {
  const isSm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1 font-black uppercase tracking-wider rounded-full shrink-0 select-none transition-all duration-300 relative overflow-hidden group
      bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950
      border border-emerald-200/90 dark:border-emerald-400/90
      shadow-[0_2px_10px_rgba(16,185,129,0.35)] dark:shadow-[0_2px_14px_rgba(16,185,129,0.25)]
      hover:shadow-[0_3px_14px_rgba(16,185,129,0.5)] hover:scale-[1.03] active:scale-[0.98]
      ${isSm ? 'px-2 py-0.5 text-[9.5px]' : 'px-2.5 py-1 text-[11px]'}
      ${className}`}
      title="Lead Developer"
    >
      {/* Subtle shine reflection sweep */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
      <Code2 className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-slate-950 shrink-0 stroke-[2.5]`} />
      <span className="font-extrabold tracking-widest leading-none">Dev</span>
      <span className="w-1.5 h-1.5 rounded-full bg-slate-950/80 animate-pulse shrink-0" />
    </span>
  );
};

