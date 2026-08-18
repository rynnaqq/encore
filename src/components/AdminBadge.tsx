import React from 'react';
import { Shield, Code2 } from 'lucide-react';

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

export const AdminBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 shadow-sm border border-amber-300/80 uppercase tracking-wider shrink-0 ${className}`}>
      <Shield className="w-3 h-3 text-slate-950 fill-slate-950 shrink-0" />
      <span>Admin</span>
    </span>
  );
};

export const DeveloperBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-400 text-slate-950 shadow-sm border border-emerald-300/80 uppercase tracking-wider shrink-0 ${className}`}>
      <Code2 className="w-3 h-3 text-slate-950 shrink-0" />
      <span>Developer</span>
    </span>
  );
};

