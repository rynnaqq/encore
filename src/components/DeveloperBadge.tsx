import React from 'react';
import { Code2 } from 'lucide-react';

const developerUsernamesSet = new Set<string>(['encore']);

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
  return developerUsernamesSet.has(clean) || clean === 'encore';
};

export const DeveloperBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-400 text-slate-950 shadow-sm border border-emerald-300/80 uppercase tracking-wider shrink-0 ${className}`}>
      <Code2 className="w-3 h-3 text-slate-950 shrink-0" />
      <span>Developer</span>
    </span>
  );
};
