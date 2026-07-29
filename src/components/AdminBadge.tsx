import React from 'react';
import { Shield } from 'lucide-react';

export const isAdminName = (name?: string | null): boolean => {
  if (!name) return false;
  const clean = name.trim().toLowerCase();
  return clean === 'adminkawaaii' || clean === 'admin';
};

export const AdminBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 shadow-sm border border-amber-300/80 uppercase tracking-wider shrink-0 ${className}`}>
      <Shield className="w-3 h-3 text-slate-950 fill-slate-950 shrink-0" />
      <span>Admin</span>
    </span>
  );
};
