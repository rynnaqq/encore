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

    case 'kraken':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Baby Kraken / Purple Mythic Octopus */}
          <circle cx="50" cy="40" r="24" fill="#A855F7" stroke="#6B21A8" strokeWidth="3" />
          <ellipse cx="40" cy="35" rx="5" ry="6" fill="#FFFFFF" />
          <circle cx="41" cy="35" r="3" fill="#1E1B4B" />
          <ellipse cx="60" cy="35" rx="5" ry="6" fill="#FFFFFF" />
          <circle cx="59" cy="35" r="3" fill="#1E1B4B" />
          {/* Glowing spots */}
          <circle cx="34" cy="28" r="2" fill="#E9D5FF" />
          <circle cx="50" cy="22" r="2.5" fill="#E9D5FF" />
          <circle cx="66" cy="28" r="2" fill="#E9D5FF" />
          {/* Tentacles */}
          <path d="M30 55 Q 15 70 25 88 Q 30 75 35 60" fill="#9333EA" stroke="#6B21A8" strokeWidth="2.5" />
          <path d="M40 60 Q 30 80 42 90 Q 46 78 45 62" fill="#A855F7" stroke="#6B21A8" strokeWidth="2.5" />
          <path d="M55 62 Q 54 80 65 90 Q 68 76 60 60" fill="#A855F7" stroke="#6B21A8" strokeWidth="2.5" />
          <path d="M65 58 Q 80 72 75 88 Q 70 75 68 55" fill="#9333EA" stroke="#6B21A8" strokeWidth="2.5" />
        </svg>
      );

    case 'arwana':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Super Red Arowana */}
          <path d="M25 50 L8 28 Q 18 50 8 72 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="2.5" />
          <path d="M22 50 Q 50 26 86 42 Q 90 52 78 62 Q 50 72 22 50 Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="3" />
          {/* Dragon Barbels / Whiskers */}
          <path d="M84 45 Q 96 38 98 28" stroke="#FDE047" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M82 48 Q 94 44 96 36" stroke="#FDE047" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Golden Red Scales */}
          <circle cx="44" cy="44" r="5" fill="#F87171" stroke="#FBBF24" strokeWidth="1" />
          <circle cx="56" cy="44" r="5" fill="#F87171" stroke="#FBBF24" strokeWidth="1" />
          <circle cx="68" cy="46" r="4.5" fill="#F87171" stroke="#FBBF24" strokeWidth="1" />
          {/* Fins */}
          <path d="M30 32 Q 50 20 62 34" fill="#B91C1C" />
          <path d="M30 68 Q 50 78 62 64" fill="#B91C1C" />
          {/* Eye */}
          <circle cx="78" cy="42" r="5" fill="#FEF08A" />
          <circle cx="79" cy="42" r="2.5" fill="#000000" />
        </svg>
      );

    case 'shenlong':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Mythic Golden Shenlong Dragon */}
          {/* Cosmic Golden Aura */}
          <circle cx="50" cy="50" r="44" fill="#FEF08A" opacity="0.25" className="animate-pulse" />
          {/* Serpentine Dragon Body */}
          <path d="M12 72 Q 28 30 52 50 Q 72 68 88 38" stroke="#EAB308" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M12 72 Q 28 30 52 50 Q 72 68 88 38" stroke="#FACC15" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M12 72 Q 28 30 52 50 Q 72 68 88 38" stroke="#FEF08A" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Dragon Horns & Whiskers */}
          <path d="M82 32 L94 18 M84 36 L98 28" stroke="#CA8A04" strokeWidth="3" strokeLinecap="round" />
          <path d="M88 42 Q 102 46 100 60" stroke="#FDE047" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Dragon Head */}
          <ellipse cx="84" cy="38" rx="10" ry="8" fill="#EAB308" stroke="#854D0E" strokeWidth="2" />
          {/* Glowing Ruby Eye */}
          <circle cx="85" cy="36" r="3" fill="#EF4444" />
          <circle cx="86" cy="35" r="1" fill="#FFFFFF" />
          {/* Sacred Dragon Pearl */}
          <circle cx="28" cy="28" r="8" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="28" cy="28" r="6" fill="#60A5FA" />
        </svg>
      );

    case 'phoenix':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ocean Aqua Phoenix */}
          {/* Flowing Water Wings */}
          <path d="M50 50 Q 20 15 10 35 Q 25 45 45 52" fill="#06B6D4" opacity="0.8" stroke="#0891B2" strokeWidth="2" />
          <path d="M50 50 Q 80 15 90 35 Q 75 45 55 52" fill="#06B6D4" opacity="0.8" stroke="#0891B2" strokeWidth="2" />
          {/* Tail Plumes */}
          <path d="M50 65 Q 40 85 30 95 Q 48 88 50 65" fill="#38BDF8" />
          <path d="M50 65 Q 50 88 50 98 Q 52 88 50 65" fill="#67E8F9" />
          <path d="M50 65 Q 60 85 70 95 Q 52 88 50 65" fill="#38BDF8" />
          {/* Bird/Fish Body */}
          <ellipse cx="50" cy="50" rx="14" ry="20" fill="#0EA5E9" stroke="#0369A1" strokeWidth="2.5" />
          {/* Crown Feathers */}
          <path d="M48 30 L50 16 L52 30" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
          {/* Eye */}
          <circle cx="46" cy="42" r="3" fill="#FACC15" />
          <circle cx="54" cy="42" r="3" fill="#FACC15" />
        </svg>
      );

    case 'cosmic':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Cosmic Galaxy Fish */}
          <circle cx="50" cy="50" r="42" fill="#1E1B4B" opacity="0.4" />
          {/* Tail */}
          <path d="M30 50 L10 25 Q 20 50 10 75 Z" fill="#818CF8" stroke="#6366F1" strokeWidth="2.5" />
          {/* Body */}
          <ellipse cx="55" cy="50" rx="30" ry="18" fill="#4338CA" stroke="#818CF8" strokeWidth="3" />
          {/* Starlight Constellations */}
          <circle cx="45" cy="44" r="2.5" fill="#FFFFFF" className="animate-ping" style={{ animationDuration: '2s' }} />
          <circle cx="56" cy="52" r="3" fill="#FDE047" />
          <circle cx="68" cy="46" r="2" fill="#FFFFFF" />
          <line x1="45" y1="44" x2="56" y2="52" stroke="#A5B4FC" strokeWidth="1.5" strokeDasharray="2 2" />
          <line x1="56" y1="52" x2="68" y2="46" stroke="#A5B4FC" strokeWidth="1.5" strokeDasharray="2 2" />
          {/* Galaxy Eye */}
          <circle cx="74" cy="44" r="5" fill="#F43F5E" />
          <circle cx="75" cy="43" r="2" fill="#FFFFFF" />
        </svg>
      );

    case 'atlantis':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Guardian of Atlantis */}
          {/* Gold & Aqua Armored Fish with Trident Horn */}
          <path d="M28 50 L8 25 L16 50 L8 75 Z" fill="#0D9488" stroke="#F59E0B" strokeWidth="3" />
          <ellipse cx="55" cy="50" rx="32" ry="22" fill="#14B8A6" stroke="#F59E0B" strokeWidth="4" />
          {/* Trident Horn on Head */}
          <path d="M78 40 L96 32 M90 26 L96 32 L92 40" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {/* Gold Scales Armor */}
          <path d="M40 38 Q 48 50 40 62" stroke="#F59E0B" strokeWidth="3" fill="none" />
          <path d="M52 35 Q 60 50 52 65" stroke="#F59E0B" strokeWidth="3" fill="none" />
          <path d="M64 38 Q 70 50 64 62" stroke="#F59E0B" strokeWidth="3" fill="none" />
          {/* Glowing Turquoise Eye */}
          <circle cx="74" cy="44" r="5" fill="#FEF08A" stroke="#0F766E" strokeWidth="2" />
          <circle cx="75" cy="44" r="2" fill="#0F766E" />
        </svg>
      );

    case 'channa':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Channa Maru Snakehead */}
          <path d="M26 50 L8 34 Q 16 50 8 66 Z" fill="#D97706" stroke="#78350F" strokeWidth="2.5" />
          <path d="M22 50 Q 52 30 84 45 Q 86 54 78 60 Q 52 68 22 50 Z" fill="#F59E0B" stroke="#78350F" strokeWidth="3" />
          {/* Distinct Maru Flower Spots */}
          <circle cx="40" cy="48" r="4.5" fill="#1E293B" stroke="#FDE047" strokeWidth="1.5" />
          <circle cx="54" cy="48" r="4.5" fill="#1E293B" stroke="#FDE047" strokeWidth="1.5" />
          <circle cx="68" cy="50" r="4" fill="#1E293B" stroke="#FDE047" strokeWidth="1.5" />
          {/* Dorsal Fin */}
          <path d="M30 35 Q 55 24 72 38" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />
          {/* Fierce Red Eye */}
          <circle cx="76" cy="44" r="4.5" fill="#DC2626" />
          <circle cx="77" cy="44" r="2" fill="#000000" />
        </svg>
      );

    case 'arapaima':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Giant Arapaima Gigas */}
          <path d="M25 50 L6 32 Q 14 50 6 68 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="2.5" />
          <path d="M22 50 Q 50 32 88 44 Q 90 52 82 58 Q 50 66 22 50 Z" fill="#475569" stroke="#1E293B" strokeWidth="3.5" />
          {/* Red Scale Gradient Tail End */}
          <path d="M24 50 Q 42 38 48 50 Q 42 62 24 50 Z" fill="#EF4444" opacity="0.9" />
          {/* Bony armored head */}
          <path d="M72 40 L88 44 L82 58 L70 56 Z" fill="#334155" />
          {/* Eye */}
          <circle cx="80" cy="44" r="4" fill="#FBBF24" />
          <circle cx="81" cy="44" r="2" fill="#000000" />
        </svg>
      );

    case 'oarfish':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Giant Deepsea Ribbon Oarfish */}
          {/* Long Ribbon Body */}
          <path d="M10 50 Q 30 38 55 50 Q 75 62 90 48" stroke="#E2E8F0" strokeWidth="12" strokeLinecap="round" fill="none" />
          {/* Crimson Red Dorsal Crest */}
          <path d="M12 44 Q 30 32 55 44 Q 75 56 90 42" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Crown Antennas */}
          <path d="M84 42 L88 18 M87 43 L96 22" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
          {/* Silver Scales Dots */}
          <circle cx="35" cy="46" r="2" fill="#38BDF8" />
          <circle cx="52" cy="50" r="2" fill="#38BDF8" />
          <circle cx="70" cy="54" r="2" fill="#38BDF8" />
          {/* Eye */}
          <circle cx="86" cy="46" r="4.5" fill="#0F172A" />
          <circle cx="87" cy="45" r="1.5" fill="#FFFFFF" />
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
