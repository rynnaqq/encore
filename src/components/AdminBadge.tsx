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

export const registerDeveloperUsername = (username?: string | null) => {
  if (username) {
    developerUsernamesSet.add(username.trim().toLowerCase());
  }
};

export const registerDeveloperUsernames = (usernames: string[]) => {
  usernames.forEach((u) => registerDeveloperUsername(u));
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
      className={`inline-flex items-center gap-1 font-mono font-bold uppercase tracking-wider rounded-full shrink-0 select-none transition-all duration-200
      bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300
      border border-amber-500/30 dark:border-amber-400/30
      hover:bg-amber-500/20 dark:hover:bg-amber-400/20
      ${isSm ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'}
      ${className}`}
      title="Verified Administrator"
    >
      <Crown className={`${isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-amber-600 dark:text-amber-400 shrink-0 stroke-[2]`} />
      <span className="leading-none">Admin</span>
      <Sparkles className={`${isSm ? 'w-2 h-2' : 'w-2.5 h-2.5'} text-amber-500/70 shrink-0`} />
    </span>
  );
};

export const GuestBadge: React.FC<{ className?: string; size?: 'sm' | 'md' }> = ({ className = '', size = 'sm' }) => {
  const isSm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-semibold uppercase tracking-wider rounded-full shrink-0 select-none transition-all duration-200
      bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400
      border border-slate-200 dark:border-slate-700
      hover:bg-slate-200/80 dark:hover:bg-slate-700/80
      ${isSm ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'}
      ${className}`}
      title="Guest Visitor"
    >
      <Compass className={`${isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-slate-500 dark:text-slate-400 shrink-0 stroke-[2]`} />
      <span className="leading-none">Guest</span>
    </span>
  );
};

export const DeveloperBadge: React.FC<{ className?: string; size?: 'sm' | 'md' }> = ({ className = '', size = 'sm' }) => {
  const isSm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold uppercase tracking-wider rounded-full shrink-0 select-none transition-all duration-200
      bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300
      border border-emerald-500/30 dark:border-emerald-400/30
      hover:bg-emerald-500/20 dark:hover:bg-emerald-400/20
      ${isSm ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'}
      ${className}`}
      title="Lead Developer"
    >
      <Code2 className={`${isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]`} />
      <span className="leading-none">Dev</span>
      <span className="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0 animate-pulse" />
    </span>
  );
};


