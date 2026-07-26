import React from 'react';

interface FishGraphicProps {
  id: string;
  size?: number;
  color?: string;
  className?: string;
}

export const FishGraphic: React.FC<FishGraphicProps> = ({ id, size = 80, color, className = '' }) => {
  switch (id) {
    case 'shoe':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Soggy Old Boot */}
          <path d="M20 30 H45 V55 H65 L80 70 V85 H15 V75 L20 60 Z" fill="#57534E" stroke="#1C1917" strokeWidth="4" />
          <path d="M15 75 H85 V85 H15 Z" fill="#292524" stroke="#1C1917" strokeWidth="3" />
          <circle cx="30" cy="40" r="3" fill="#A8A29E" />
          <circle cx="30" cy="50" r="3" fill="#A8A29E" />
          {/* Water drips & seaweed strand */}
          <path d="M50 70 Q 55 60 50 50" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M52 50 Q 48 40 55 35" stroke="#15803D" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="75" cy="90" r="2" fill="#38BDF8" />
          <circle cx="40" cy="92" r="2.5" fill="#38BDF8" />
        </svg>
      );

    case 'teri':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Neon Tetra */}
          {/* Tail */}
          <path d="M30 50 L10 35 V65 Z" fill="#38BDF8" stroke="#0284C7" strokeWidth="2" />
          {/* Body */}
          <ellipse cx="55" cy="50" rx="30" ry="16" fill="#0284C7" stroke="#0369A1" strokeWidth="3" />
          {/* Neon Stripe */}
          <path d="M35 48 Q 55 42 78 50" stroke="#38BDF8" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M35 52 Q 55 58 75 52" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Eye */}
          <circle cx="72" cy="45" r="5" fill="#FFFFFF" />
          <circle cx="73" cy="45" r="2.5" fill="#0284C7" />
          {/* Fins */}
          <path d="M50 34 L60 22 L65 34 Z" fill="#7DD3FC" opacity="0.8" />
          <path d="M50 66 L58 76 L65 66 Z" fill="#7DD3FC" opacity="0.8" />
        </svg>
      );

    case 'nila':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Golden Nila */}
          {/* Tail */}
          <path d="M30 50 L10 30 Q 18 50 10 70 Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="3" />
          {/* Body */}
          <ellipse cx="55" cy="50" rx="32" ry="22" fill="#FACC15" stroke="#CA8A04" strokeWidth="3" />
          {/* Golden Scale Stripes */}
          <path d="M42 35 C 48 45 48 55 42 65" stroke="#EAB308" strokeWidth="2.5" fill="none" />
          <path d="M54 32 C 60 45 60 55 54 68" stroke="#EAB308" strokeWidth="2.5" fill="none" />
          <path d="M66 36 C 70 45 70 55 66 64" stroke="#EAB308" strokeWidth="2.5" fill="none" />
          {/* Dorsal Fin */}
          <path d="M35 30 Q 55 12 75 32 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
          {/* Eye */}
          <circle cx="74" cy="44" r="6" fill="#FFFFFF" />
          <circle cx="75" cy="44" r="3" fill="#1E293B" />
          <circle cx="76" cy="43" r="1" fill="#FFFFFF" />
          {/* Gill */}
          <path d="M66 40 Q 62 50 66 60" stroke="#CA8A04" strokeWidth="2.5" fill="none" />
        </svg>
      );

    case 'lele':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Giant Catfish */}
          {/* Tail */}
          <path d="M28 50 L8 32 Q 16 50 8 68 Z" fill="#334155" stroke="#0F172A" strokeWidth="3" />
          {/* Main Body */}
          <path d="M25 50 Q 50 28 82 45 Q 85 55 75 62 Q 50 68 25 50 Z" fill="#475569" stroke="#0F172A" strokeWidth="3.5" />
          {/* Belly */}
          <path d="M32 55 Q 55 66 72 60" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Whiskers (Kumis) */}
          <path d="M78 52 Q 95 40 100 32" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M78 56 Q 96 64 98 75" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M74 58 Q 88 72 86 82" stroke="#334155" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Eye */}
          <circle cx="75" cy="42" r="4.5" fill="#FACC15" />
          <circle cx="76" cy="42" r="2.5" fill="#0F172A" />
          {/* Dorsal Fin */}
          <path d="M40 36 Q 52 20 62 38 Z" fill="#1E293B" />
        </svg>
      );

    case 'koi':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Royal Koi */}
          {/* Flowing Tail */}
          <path d="M28 50 Q 10 20 5 35 Q 18 50 5 65 Q 10 80 28 50 Z" fill="#F87171" stroke="#DC2626" strokeWidth="2.5" />
          {/* Body */}
          <ellipse cx="56" cy="50" rx="30" ry="18" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />
          {/* Red/Orange Patches */}
          <path d="M42 36 Q 52 32 58 42 Q 48 52 40 46 Z" fill="#EF4444" />
          <path d="M60 40 Q 72 38 70 52 Q 62 58 58 48 Z" fill="#EF4444" />
          <path d="M34 50 Q 44 54 38 62 Q 30 58 34 50 Z" fill="#F97316" />
          {/* Pectoral Fin */}
          <path d="M62 58 Q 50 72 42 66 Q 52 58 62 58 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
          {/* Eye */}
          <circle cx="76" cy="44" r="5" fill="#0F172A" />
          <circle cx="77" cy="43" r="1.5" fill="#FFFFFF" />
          {/* Whisker */}
          <path d="M80 52 Q 88 56 86 62" stroke="#EF4444" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'megalodon':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ancient Megalodon */}
          {/* Tail */}
          <path d="M25 50 L5 15 Q 18 45 10 50 Q 18 55 5 85 Z" fill="#0284C7" stroke="#0369A1" strokeWidth="3" />
          {/* Main Body */}
          <path d="M22 50 Q 48 20 88 42 Q 95 50 82 62 Q 48 75 22 50 Z" fill="#38BDF8" stroke="#0284C7" strokeWidth="4" />
          {/* White Belly */}
          <path d="M32 54 Q 55 70 80 60 Q 60 74 32 54 Z" fill="#F8FAFC" />
          {/* Iconic Huge Dorsal Fin */}
          <path d="M42 33 L58 5 L68 31 Z" fill="#0284C7" stroke="#0369A1" strokeWidth="3" />
          {/* Sharp Teeth */}
          <path d="M80 54 L76 58 L73 54 L70 58 L67 54" stroke="#DC2626" strokeWidth="2.5" fill="#FFFFFF" />
          {/* Eye */}
          <circle cx="76" cy="38" r="5" fill="#0F172A" />
          <circle cx="77" cy="37" r="2" fill="#EF4444" />
          {/* Battle Scar */}
          <path d="M50 42 L58 48" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M54 40 L62 46" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
          {/* Gill Slits */}
          <path d="M62 42 V54" stroke="#0369A1" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M58 44 V52" stroke="#0369A1" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M54 45 V50" stroke="#0369A1" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          <ellipse cx="50" cy="50" rx="30" ry="18" fill={color || '#F59E0B'} />
          <path d="M20 50 L5 30 V70 Z" fill={color || '#B45309'} />
          <circle cx="68" cy="44" r="4" fill="#FFFFFF" />
          <circle cx="69" cy="44" r="2" fill="#000000" />
        </svg>
      );
  }
};
