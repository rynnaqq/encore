import React from 'react';
import { Star, Circle, Triangle } from 'lucide-react';

export const FloatingBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Floating Plus */}
      <div
        className="absolute top-[15%] left-[10%] text-[#E195AB] opacity-40"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>

      {/* Floating Circle */}
      <div
        className="absolute top-[40%] right-[15%] text-[#FFDD00] opacity-50"
      >
        <Circle size={48} strokeWidth={2.5} />
      </div>

      {/* Floating Triangle */}
      <div
        className="absolute bottom-[30%] left-[20%] text-[#FF00E5] opacity-30"
      >
        <Triangle size={36} strokeWidth={3} />
      </div>

      {/* Floating Star */}
      <div
        className="absolute top-[70%] right-[25%] text-[#E195AB] opacity-40"
      >
        <Star size={42} strokeWidth={2.5} />
      </div>
      
      {/* Abstract Blob 1 */}
      <div
        className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-[#FFF5D7] to-[#FFCCE1] rounded-full blur-2xl opacity-25 -z-10 pointer-events-none"
      />
      
      {/* Abstract Blob 2 */}
      <div
        className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#F2F9FF] to-[#E195AB] rounded-full blur-2xl opacity-20 -z-10 pointer-events-none"
      />
    </div>
  );
};
