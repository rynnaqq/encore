import React from 'react';

interface FishGraphicProps {
  id: string;
  size?: number;
  color?: string;
  className?: string;
}

export const FishGraphic: React.FC<FishGraphicProps> = ({ id, size = 80, color, className = '' }) => {
  switch (id) {
    // ==========================================
    // BIASA (COMMON)
    // ==========================================
    case 'shoe':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Soggy Old Boot */}
          <path d="M20 30 H45 V55 H65 L80 70 V85 H15 V75 L20 60 Z" fill="#57534E" stroke="#1C1917" strokeWidth="4" />
          <path d="M15 75 H85 V85 H15 Z" fill="#292524" stroke="#1C1917" strokeWidth="3" />
          <circle cx="30" cy="40" r="3" fill="#A8A29E" />
          <circle cx="30" cy="50" r="3" fill="#A8A29E" />
          <path d="M50 70 Q 55 60 50 50" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M52 50 Q 48 40 55 35" stroke="#15803D" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="75" cy="90" r="2" fill="#38BDF8" />
          <circle cx="40" cy="92" r="2.5" fill="#38BDF8" />
        </svg>
      );

    case 'kaleng':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Crushed Soda Can */}
          <rect x="25" y="30" width="50" height="42" rx="6" fill="#94A3B8" stroke="#475569" strokeWidth="3" />
          <ellipse cx="50" cy="30" rx="25" ry="6" fill="#CBD5E1" stroke="#475569" strokeWidth="2.5" />
          <ellipse cx="50" cy="72" rx="25" ry="6" fill="#64748B" stroke="#475569" strokeWidth="2.5" />
          {/* Dent / Crush Line */}
          <path d="M25 50 Q 45 42 75 52" stroke="#475569" strokeWidth="3" fill="none" />
          {/* Cola Stripe */}
          <rect x="25" y="44" width="50" height="14" fill="#EF4444" opacity="0.85" />
          {/* Pull Tab */}
          <ellipse cx="50" cy="30" rx="6" ry="3" fill="#334155" />
          <circle cx="50" cy="28" r="2" fill="#F8FAFC" />
          {/* Bubbles */}
          <circle cx="78" cy="24" r="3" fill="#38BDF8" opacity="0.8" />
          <circle cx="84" cy="16" r="2" fill="#38BDF8" opacity="0.8" />
        </svg>
      );

    case 'ranting':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Old Mossy Branch */}
          <path d="M15 78 Q 45 55 85 30" stroke="#78350F" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M45 56 Q 60 40 55 24" stroke="#78350F" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M30 68 Q 22 55 18 45" stroke="#78350F" strokeWidth="5" strokeLinecap="round" fill="none" />
          {/* Green Moss Patches */}
          <ellipse cx="50" cy="52" rx="8" ry="4" fill="#16A34A" />
          <ellipse cx="70" cy="38" rx="6" ry="3" fill="#22C55E" />
          <circle cx="56" cy="25" r="3" fill="#4ADE80" />
          {/* Water Drops */}
          <circle cx="20" cy="85" r="2.5" fill="#38BDF8" />
          <circle cx="86" cy="38" r="2" fill="#38BDF8" />
        </svg>
      );

    case 'keong':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Golden Snail */}
          {/* Body Foot */}
          <path d="M20 72 Q 50 65 78 72 Q 85 74 88 68 Q 85 60 70 65 L28 65 Q 16 66 20 72 Z" fill="#FDE68A" stroke="#D97706" strokeWidth="2.5" />
          {/* Big Golden Swirl Shell */}
          <circle cx="48" cy="46" r="24" fill="#F59E0B" stroke="#B45309" strokeWidth="3.5" />
          <path d="M48 46 m -15 0 a 15 15 0 1 0 30 0 a 15 15 0 1 0 -30 0" stroke="#D97706" strokeWidth="3" fill="none" />
          <circle cx="48" cy="46" r="6" fill="#B45309" />
          {/* Tentacles & Eye */}
          <path d="M80 62 L90 50 M84 64 L95 56" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="90" cy="49" r="2" fill="#78350F" />
          <circle cx="95" cy="55" r="2" fill="#78350F" />
        </svg>
      );

    case 'sepat':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ikan Sepat Rawa */}
          {/* Tail */}
          <path d="M30 50 L10 32 Q 18 50 10 68 Z" fill="#9CA3AF" stroke="#4B5563" strokeWidth="2" />
          {/* Flat Oval Body */}
          <ellipse cx="55" cy="50" rx="30" ry="20" fill="#9CA3AF" stroke="#4B5563" strokeWidth="3" />
          {/* Swamp Striping Pattern */}
          <path d="M44 34 Q 48 50 44 66" stroke="#4B5563" strokeWidth="2.5" fill="none" />
          <path d="M54 31 Q 58 50 54 69" stroke="#4B5563" strokeWidth="2.5" fill="none" />
          <path d="M64 35 Q 67 50 64 65" stroke="#4B5563" strokeWidth="2.5" fill="none" />
          {/* Trailing Feelers */}
          <path d="M60 68 Q 50 88 40 92" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Eye */}
          <circle cx="74" cy="45" r="4.5" fill="#FEF08A" />
          <circle cx="75" cy="45" r="2.5" fill="#1F2937" />
        </svg>
      );

    case 'wader':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ikan Wader Pari (Slender Minnow) */}
          {/* Yellowish Tail */}
          <path d="M32 50 L10 35 L16 50 L10 65 Z" fill="#FDE047" stroke="#CA8A04" strokeWidth="2" />
          {/* Streamlined Body */}
          <ellipse cx="56" cy="50" rx="32" ry="14" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2.5" />
          {/* Dark Lateral Line */}
          <path d="M35 50 Q 58 48 80 50" stroke="#64748B" strokeWidth="2" strokeDasharray="3 2" fill="none" />
          {/* Translucent Dorsal & Ventral Fin */}
          <path d="M50 36 L58 24 L64 36 Z" fill="#FEF08A" opacity="0.8" />
          <path d="M52 64 L60 74 L65 64 Z" fill="#FEF08A" opacity="0.8" />
          {/* Eye */}
          <circle cx="76" cy="46" r="4.5" fill="#FFFFFF" />
          <circle cx="77" cy="46" r="2.5" fill="#0F172A" />
        </svg>
      );

    case 'teri':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Neon Tetra */}
          <path d="M30 50 L10 35 V65 Z" fill="#38BDF8" stroke="#0284C7" strokeWidth="2" />
          <ellipse cx="55" cy="50" rx="30" ry="16" fill="#0284C7" stroke="#0369A1" strokeWidth="3" />
          <path d="M35 48 Q 55 42 78 50" stroke="#38BDF8" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M35 52 Q 55 58 75 52" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="72" cy="45" r="5" fill="#FFFFFF" />
          <circle cx="73" cy="45" r="2.5" fill="#0284C7" />
          <path d="M50 34 L60 22 L65 34 Z" fill="#7DD3FC" opacity="0.8" />
          <path d="M50 66 L58 76 L65 66 Z" fill="#7DD3FC" opacity="0.8" />
        </svg>
      );

    case 'mujair':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ikan Mujair Bintik */}
          <path d="M28 50 L8 28 Q 16 50 8 72 Z" fill="#64748B" stroke="#334155" strokeWidth="2.5" />
          <ellipse cx="55" cy="50" rx="30" ry="20" fill="#64748B" stroke="#334155" strokeWidth="3" />
          {/* Spiky Tilapia Dorsal Fin */}
          <path d="M35 32 L40 18 L48 30 L55 16 L62 30 L70 20 L76 34 Z" fill="#475569" stroke="#1E293B" strokeWidth="2" />
          {/* Dark Vertical Bars */}
          <path d="M42 36 V64 M52 32 V68 M62 36 V64" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
          <circle cx="74" cy="44" r="5" fill="#FDE047" />
          <circle cx="75" cy="44" r="2.5" fill="#0F172A" />
        </svg>
      );

    case 'betik':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ikan Betik / Climbing Perch */}
          <path d="M30 50 L10 34 Q 16 50 10 66 Z" fill="#65A30D" stroke="#3F6212" strokeWidth="2.5" />
          <ellipse cx="56" cy="50" rx="30" ry="18" fill="#65A30D" stroke="#3F6212" strokeWidth="3" />
          {/* Spiny Dorsal */}
          <path d="M36 34 L45 22 L52 32 L60 22 L68 32 L74 24 L78 36 Z" fill="#4D7C0F" />
          {/* Distinct Black Spot near Gill and Tail */}
          <circle cx="70" cy="54" r="3.5" fill="#1E293B" />
          <circle cx="34" cy="50" r="3" fill="#1E293B" />
          {/* Eye */}
          <circle cx="76" cy="44" r="5" fill="#FACC15" />
          <circle cx="77" cy="44" r="2.5" fill="#000000" />
        </svg>
      );

    case 'nila':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Golden Nila */}
          <path d="M30 50 L10 30 Q 18 50 10 70 Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="3" />
          <ellipse cx="55" cy="50" rx="32" ry="22" fill="#FACC15" stroke="#CA8A04" strokeWidth="3" />
          <path d="M42 35 C 48 45 48 55 42 65" stroke="#EAB308" strokeWidth="2.5" fill="none" />
          <path d="M54 32 C 60 45 60 55 54 68" stroke="#EAB308" strokeWidth="2.5" fill="none" />
          <path d="M66 36 C 70 45 70 55 66 64" stroke="#EAB308" strokeWidth="2.5" fill="none" />
          <path d="M35 30 Q 55 12 75 32 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
          <circle cx="74" cy="44" r="6" fill="#FFFFFF" />
          <circle cx="75" cy="44" r="3" fill="#1E293B" />
          <circle cx="76" cy="43" r="1" fill="#FFFFFF" />
          <path d="M66 40 Q 62 50 66 60" stroke="#CA8A04" strokeWidth="2.5" fill="none" />
        </svg>
      );

    case 'kepiting':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Little Red Crab */}
          {/* Legs */}
          <path d="M25 60 L10 65 L8 75 M25 65 L12 75 L10 85 M75 60 L90 65 L92 75 M75 65 L88 75 L90 85" stroke="#B91C1C" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Main Oval Shell */}
          <ellipse cx="50" cy="56" rx="26" ry="18" fill="#F87171" stroke="#B91C1C" strokeWidth="3" />
          {/* Big Claws / Pincers */}
          <path d="M32 45 Q 18 35 15 22 Q 28 20 32 35 Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="2.5" />
          <path d="M68 45 Q 82 35 85 22 Q 72 20 68 35 Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="2.5" />
          {/* Stalk Eyes */}
          <circle cx="42" cy="38" r="5" fill="#FFFFFF" stroke="#B91C1C" strokeWidth="2" />
          <circle cx="42" cy="38" r="2.5" fill="#000000" />
          <circle cx="58" cy="38" r="5" fill="#FFFFFF" stroke="#B91C1C" strokeWidth="2" />
          <circle cx="58" cy="38" r="2.5" fill="#000000" />
        </svg>
      );

    case 'guppy':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Rainbow Guppy with huge fan tail */}
          {/* Magnificent Tail */}
          <path d="M42 50 Q 15 15 5 35 Q 22 50 5 65 Q 15 85 42 50 Z" fill="#F472B6" stroke="#EC4899" strokeWidth="2.5" />
          <path d="M38 50 Q 20 28 12 40 Q 25 50 12 60 Q 20 72 38 50 Z" fill="#38BDF8" opacity="0.8" />
          <path d="M34 50 Q 24 38 18 45 Q 28 50 18 55 Q 24 62 34 50 Z" fill="#FACC15" opacity="0.8" />
          {/* Slender Guppy Body */}
          <ellipse cx="64" cy="50" rx="22" ry="12" fill="#F472B6" stroke="#DB2777" strokeWidth="2.5" />
          <circle cx="76" cy="46" r="4.5" fill="#0F172A" />
          <circle cx="77" cy="45" r="1.5" fill="#FFFFFF" />
          <path d="M60 40 Q 66 30 72 40" fill="#FDE047" opacity="0.85" />
        </svg>
      );

    // ==========================================
    // LANGKA (RARE)
    // ==========================================
    case 'patin':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ikan Patin Sungai (Sleek Silver Catfish) */}
          <path d="M26 50 L6 30 Q 15 50 6 70 Z" fill="#64748B" stroke="#334155" strokeWidth="2.5" />
          <path d="M22 50 Q 52 26 84 46 Q 88 54 78 60 Q 52 68 22 50 Z" fill="#CBD5E1" stroke="#475569" strokeWidth="3" />
          {/* Iridescent Blue/Grey Back */}
          <path d="M26 48 Q 54 30 80 44 Q 54 40 26 48 Z" fill="#64748B" />
          {/* Dorsal Fin & Barbels */}
          <path d="M50 32 L56 16 L64 34 Z" fill="#475569" />
          <path d="M80 50 Q 94 46 98 40" stroke="#475569" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="76" cy="44" r="4.5" fill="#1E293B" />
          <circle cx="77" cy="43" r="1.5" fill="#FFFFFF" />
        </svg>
      );

    case 'gurame':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Gurame Padang (Vibrant Orange Gourami) */}
          <path d="M28 50 L8 25 Q 18 50 8 75 Z" fill="#EA580C" stroke="#9A3412" strokeWidth="3" />
          <ellipse cx="55" cy="50" rx="30" ry="24" fill="#FB923C" stroke="#C2410C" strokeWidth="3.5" />
          {/* Long Thread Feelers */}
          <path d="M60 70 Q 40 95 20 90" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Dorsal Crest */}
          <path d="M34 28 Q 55 10 74 30" fill="#F97316" stroke="#9A3412" strokeWidth="2" />
          <circle cx="74" cy="42" r="5.5" fill="#FEF08A" />
          <circle cx="75" cy="42" r="2.5" fill="#7C2D12" />
        </svg>
      );

    case 'bawal':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ikan Bawal Bintang (Silver Pomfret with Red Throat) */}
          <path d="M28 50 L6 26 L14 50 L6 74 Z" fill="#64748B" stroke="#334155" strokeWidth="2.5" />
          {/* Round Diamond Body */}
          <ellipse cx="55" cy="50" rx="28" ry="24" fill="#94A3B8" stroke="#334155" strokeWidth="3" />
          {/* Red-Orange Belly Glow */}
          <path d="M42 58 Q 55 72 72 62 Q 58 75 42 58 Z" fill="#EF4444" opacity="0.9" />
          {/* Glittering Sparkles */}
          <circle cx="50" cy="44" r="2" fill="#FFFFFF" />
          <circle cx="62" cy="48" r="1.5" fill="#FFFFFF" />
          <circle cx="72" cy="42" r="5" fill="#FFFFFF" />
          <circle cx="73" cy="42" r="2.5" fill="#0F172A" />
        </svg>
      );

    case 'lele':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Giant Catfish */}
          <path d="M28 50 L8 32 Q 16 50 8 68 Z" fill="#334155" stroke="#0F172A" strokeWidth="3" />
          <path d="M25 50 Q 50 28 82 45 Q 85 55 75 62 Q 50 68 25 50 Z" fill="#475569" stroke="#0F172A" strokeWidth="3.5" />
          <path d="M32 55 Q 55 66 72 60" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M78 52 Q 95 40 100 32" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M78 56 Q 96 64 98 75" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M74 58 Q 88 72 86 82" stroke="#334155" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="75" cy="42" r="4.5" fill="#FACC15" />
          <circle cx="76" cy="42" r="2.5" fill="#0F172A" />
          <path d="M40 36 Q 52 20 62 38 Z" fill="#1E293B" />
        </svg>
      );

    case 'gabus':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ikan Gabus Loreng (Camouflaged Snakehead) */}
          <path d="M26 50 L8 34 Q 16 50 8 66 Z" fill="#14532D" stroke="#052E16" strokeWidth="2.5" />
          <path d="M24 50 Q 50 30 85 44 Q 88 52 80 58 Q 50 68 24 50 Z" fill="#4D7C0F" stroke="#14532D" strokeWidth="3" />
          {/* Camo Stripes */}
          <path d="M40 38 L46 60 M52 35 L58 63 M64 38 L70 60" stroke="#14532D" strokeWidth="4" strokeLinecap="round" />
          <path d="M30 34 Q 55 22 75 36" stroke="#14532D" strokeWidth="3" fill="none" />
          <circle cx="78" cy="44" r="4.5" fill="#FDE047" />
          <circle cx="79" cy="44" r="2" fill="#052E16" />
        </svg>
      );

    case 'kura':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Kura-kura Sungai */}
          {/* Flippers */}
          <path d="M30 35 L18 20 M30 65 L18 80 M68 35 L80 20 M68 65 L80 80" stroke="#15803D" strokeWidth="6" strokeLinecap="round" />
          {/* Head */}
          <ellipse cx="84" cy="50" rx="8" ry="6" fill="#16A34A" stroke="#14532D" strokeWidth="2" />
          <circle cx="86" cy="48" r="1.5" fill="#000000" />
          {/* Shell */}
          <ellipse cx="50" cy="50" rx="26" ry="20" fill="#166534" stroke="#052E16" strokeWidth="3" />
          {/* Hex Shell Patterns */}
          <circle cx="50" cy="50" r="8" fill="#15803D" stroke="#052E16" strokeWidth="2" />
          <circle cx="36" cy="50" r="6" fill="#15803D" stroke="#052E16" strokeWidth="1.5" />
          <circle cx="64" cy="50" r="6" fill="#15803D" stroke="#052E16" strokeWidth="1.5" />
        </svg>
      );

    case 'belut':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Belut Listrik (Electric Eel with Lightning) */}
          {/* S-curve Body */}
          <path d="M12 70 Q 30 25 55 55 Q 75 80 90 45" stroke="#EAB308" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M12 70 Q 30 25 55 55 Q 75 80 90 45" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Lightning Bolts */}
          <path d="M35 25 L40 32 L36 35 L42 42" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M68 65 L74 72 L70 75 L76 82" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Glowing Eye */}
          <circle cx="88" cy="43" r="3.5" fill="#38BDF8" />
          <circle cx="89" cy="43" r="1.5" fill="#FFFFFF" />
        </svg>
      );

    case 'udang':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Udang Galah Raksasa (Giant Blue-claw Prawn) */}
          {/* Long Blue Claws */}
          <path d="M65 42 Q 85 25 96 15 M65 58 Q 85 75 96 85" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          {/* Segmented Curved Body */}
          <path d="M65 50 Q 45 32 25 45 Q 12 55 10 70" stroke="#F97316" strokeWidth="12" strokeLinecap="round" fill="none" />
          <path d="M65 50 Q 45 32 25 45 Q 12 55 10 70" stroke="#EA580C" strokeWidth="2" strokeDasharray="4 6" fill="none" />
          {/* Fan Tail */}
          <path d="M10 70 L2 80 M10 70 L6 84" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
          {/* Head & Eyes */}
          <ellipse cx="68" cy="50" rx="10" ry="8" fill="#F97316" stroke="#EA580C" strokeWidth="2" />
          <circle cx="72" cy="46" r="3" fill="#0F172A" />
        </svg>
      );

    case 'channa':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Channa Maru Snakehead */}
          <path d="M26 50 L8 34 Q 16 50 8 66 Z" fill="#D97706" stroke="#78350F" strokeWidth="2.5" />
          <path d="M22 50 Q 52 30 84 45 Q 86 54 78 60 Q 52 68 22 50 Z" fill="#F59E0B" stroke="#78350F" strokeWidth="3" />
          <circle cx="40" cy="48" r="4.5" fill="#1E293B" stroke="#FDE047" strokeWidth="1.5" />
          <circle cx="54" cy="48" r="4.5" fill="#1E293B" stroke="#FDE047" strokeWidth="1.5" />
          <circle cx="68" cy="50" r="4" fill="#1E293B" stroke="#FDE047" strokeWidth="1.5" />
          <path d="M30 35 Q 55 24 72 38" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />
          <circle cx="76" cy="44" r="4.5" fill="#DC2626" />
          <circle cx="77" cy="44" r="2" fill="#000000" />
        </svg>
      );

    case 'lobster':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Lobster Biru Samudra (Electric Blue Spiny Lobster) */}
          <path d="M60 40 Q 82 20 95 12 M60 60 Q 82 80 95 88" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M60 50 Q 42 35 24 45 Q 12 55 10 68" stroke="#0284C7" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M60 50 Q 42 35 24 45 Q 12 55 10 68" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Spines */}
          <circle cx="65" cy="50" r="9" fill="#0369A1" />
          <circle cx="70" cy="46" r="3" fill="#FFFFFF" />
          <circle cx="71" cy="46" r="1.5" fill="#000000" />
        </svg>
      );

    // ==========================================
    // SANGAT LANGKA (EPIC)
    // ==========================================
    case 'koi':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Royal Koi */}
          <path d="M28 50 Q 10 20 5 35 Q 18 50 5 65 Q 10 80 28 50 Z" fill="#F87171" stroke="#DC2626" strokeWidth="2.5" />
          <ellipse cx="56" cy="50" rx="30" ry="18" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />
          <path d="M42 36 Q 52 32 58 42 Q 48 52 40 46 Z" fill="#EF4444" />
          <path d="M60 40 Q 72 38 70 52 Q 62 58 58 48 Z" fill="#EF4444" />
          <path d="M34 50 Q 44 54 38 62 Q 30 58 34 50 Z" fill="#F97316" />
          <path d="M62 58 Q 50 72 42 66 Q 52 58 62 58 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
          <circle cx="76" cy="44" r="5" fill="#0F172A" />
          <circle cx="77" cy="43" r="1.5" fill="#FFFFFF" />
          <path d="M80 52 Q 88 56 86 62" stroke="#EF4444" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'belida':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ikan Belida Lopis (Featherback Knife Fish) */}
          {/* Humped Knife Shape */}
          <path d="M12 55 Q 30 65 60 62 Q 85 58 88 46 Q 78 30 50 32 Q 25 38 12 55 Z" fill="#9CA3AF" stroke="#374151" strokeWidth="3" />
          {/* Row of Distinct Ring Spots */}
          <circle cx="30" cy="54" r="3.5" fill="#1F2937" stroke="#E5E7EB" strokeWidth="1" />
          <circle cx="42" cy="56" r="3.5" fill="#1F2937" stroke="#E5E7EB" strokeWidth="1" />
          <circle cx="54" cy="56" r="3.5" fill="#1F2937" stroke="#E5E7EB" strokeWidth="1" />
          <circle cx="66" cy="54" r="3.5" fill="#1F2937" stroke="#E5E7EB" strokeWidth="1" />
          <circle cx="78" cy="44" r="4.5" fill="#FDE047" />
          <circle cx="79" cy="44" r="2" fill="#000000" />
        </svg>
      );

    case 'pari':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Pari Air Tawar (Freshwater Stingray) */}
          {/* Long Whip Tail */}
          <path d="M28 50 Q 8 45 4 60" stroke="#78716C" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Round Disc Body */}
          <ellipse cx="56" cy="50" rx="30" ry="26" fill="#D6D3D1" stroke="#78716C" strokeWidth="3.5" />
          {/* Spotted Texture */}
          <circle cx="44" cy="40" r="3" fill="#78716C" />
          <circle cx="56" cy="36" r="3.5" fill="#78716C" />
          <circle cx="68" cy="42" r="3" fill="#78716C" />
          <circle cx="48" cy="58" r="3" fill="#78716C" />
          <circle cx="62" cy="58" r="3.5" fill="#78716C" />
          {/* Eyes on top */}
          <circle cx="74" cy="46" r="3" fill="#1C1917" />
          <circle cx="74" cy="54" r="3" fill="#1C1917" />
        </svg>
      );

    case 'piranha':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Red-bellied Piranha */}
          <path d="M28 50 L8 28 L14 50 L8 72 Z" fill="#991B1B" stroke="#7F1D1D" strokeWidth="2.5" />
          <ellipse cx="55" cy="50" rx="28" ry="22" fill="#475569" stroke="#1E293B" strokeWidth="3" />
          {/* Blood Red Belly & Throat */}
          <path d="M40 54 Q 60 72 75 58 Q 58 75 40 54 Z" fill="#EF4444" />
          {/* Razor Sharp Teeth */}
          <path d="M80 50 L75 53 L78 55 L74 58" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Intense Menacing Eye */}
          <circle cx="72" cy="42" r="5" fill="#EF4444" />
          <circle cx="73" cy="42" r="2.5" fill="#000000" />
        </svg>
      );

    case 'peacock':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ikan Peacock Bass */}
          <path d="M28 50 L8 32 Q 16 50 8 68 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2.5" />
          <ellipse cx="55" cy="50" rx="30" ry="18" fill="#10B981" stroke="#047857" strokeWidth="3" />
          {/* 3 Dark Tiger Stripes */}
          <path d="M44 34 V66 M54 32 V68 M64 34 V66" stroke="#064E3B" strokeWidth="3.5" strokeLinecap="round" />
          {/* Iconic Peacock Tail Ocellus (Eye-spot) */}
          <circle cx="34" cy="50" r="5" fill="#000000" stroke="#FDE047" strokeWidth="2" />
          {/* Eye */}
          <circle cx="75" cy="44" r="5" fill="#DC2626" />
          <circle cx="76" cy="44" r="2.5" fill="#000000" />
        </svg>
      );

    case 'arwana':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Super Red Arowana */}
          <path d="M25 50 L8 28 Q 18 50 8 72 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="2.5" />
          <path d="M22 50 Q 50 26 86 42 Q 90 52 78 62 Q 50 72 22 50 Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="3" />
          <path d="M84 45 Q 96 38 98 28" stroke="#FDE047" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M82 48 Q 94 44 96 36" stroke="#FDE047" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="44" cy="44" r="5" fill="#F87171" stroke="#FBBF24" strokeWidth="1" />
          <circle cx="56" cy="44" r="5" fill="#F87171" stroke="#FBBF24" strokeWidth="1" />
          <circle cx="68" cy="46" r="4.5" fill="#F87171" stroke="#FBBF24" strokeWidth="1" />
          <path d="M30 32 Q 50 20 62 34" fill="#B91C1C" />
          <path d="M30 68 Q 50 78 62 64" fill="#B91C1C" />
          <circle cx="78" cy="42" r="5" fill="#FEF08A" />
          <circle cx="79" cy="42" r="2.5" fill="#000000" />
        </svg>
      );

    case 'pesut':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Pesut Mahakam (Freshwater Dolphin) */}
          {/* Flukes */}
          <path d="M24 50 L6 36 L12 50 L6 64 Z" fill="#60A5FA" stroke="#2563EB" strokeWidth="2.5" />
          {/* Rounded Melon Body */}
          <path d="M22 50 Q 50 28 82 38 Q 92 45 88 56 Q 60 72 22 50 Z" fill="#93C5FD" stroke="#3B82F6" strokeWidth="3" />
          {/* Small Dorsal Fin */}
          <path d="M48 33 Q 54 22 62 34" fill="#3B82F6" />
          {/* Friendly Smile & Eye */}
          <path d="M84 52 Q 80 56 74 54" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="78" cy="42" r="4" fill="#1E293B" />
          <circle cx="79" cy="41" r="1.5" fill="#FFFFFF" />
        </svg>
      );

    case 'aligator':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ikan Aligator Gar */}
          <path d="M24 50 L6 30 Q 14 50 6 70 Z" fill="#334155" stroke="#0F172A" strokeWidth="2.5" />
          <path d="M22 50 Q 45 34 70 42 L94 45 L72 56 Q 45 66 22 50 Z" fill="#475569" stroke="#0F172A" strokeWidth="3" />
          {/* Sharp Gar Teeth on Long Snout */}
          <path d="M74 46 L78 49 L82 46 L86 49 L90 46" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
          {/* Armored Ganoid Scales */}
          <path d="M38 42 L42 56 M48 40 L52 58 M58 42 L62 56" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="68" cy="42" r="4" fill="#FDE047" />
          <circle cx="69" cy="42" r="2" fill="#000000" />
        </svg>
      );

    case 'arapaima':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Giant Arapaima Gigas */}
          <path d="M25 50 L6 32 Q 14 50 6 68 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="2.5" />
          <path d="M22 50 Q 50 32 88 44 Q 90 52 82 58 Q 50 66 22 50 Z" fill="#475569" stroke="#1E293B" strokeWidth="3.5" />
          <path d="M24 50 Q 42 38 48 50 Q 42 62 24 50 Z" fill="#EF4444" opacity="0.9" />
          <path d="M72 40 L88 44 L82 58 L70 56 Z" fill="#334155" />
          <circle cx="80" cy="44" r="4" fill="#FBBF24" />
          <circle cx="81" cy="44" r="2" fill="#000000" />
        </svg>
      );

    // ==========================================
    // LEGENDARIS (LEGENDARY)
    // ==========================================
    case 'kraken':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Baby Kraken */}
          <circle cx="50" cy="40" r="24" fill="#A855F7" stroke="#6B21A8" strokeWidth="3" />
          <ellipse cx="40" cy="35" rx="5" ry="6" fill="#FFFFFF" />
          <circle cx="41" cy="35" r="3" fill="#1E1B4B" />
          <ellipse cx="60" cy="35" rx="5" ry="6" fill="#FFFFFF" />
          <circle cx="59" cy="35" r="3" fill="#1E1B4B" />
          <circle cx="34" cy="28" r="2" fill="#E9D5FF" />
          <circle cx="50" cy="22" r="2.5" fill="#E9D5FF" />
          <circle cx="66" cy="28" r="2" fill="#E9D5FF" />
          <path d="M30 55 Q 15 70 25 88 Q 30 75 35 60" fill="#9333EA" stroke="#6B21A8" strokeWidth="2.5" />
          <path d="M40 60 Q 30 80 42 90 Q 46 78 45 62" fill="#A855F7" stroke="#6B21A8" strokeWidth="2.5" />
          <path d="M55 62 Q 54 80 65 90 Q 68 76 60 60" fill="#A855F7" stroke="#6B21A8" strokeWidth="2.5" />
          <path d="M65 58 Q 80 72 75 88 Q 70 75 68 55" fill="#9333EA" stroke="#6B21A8" strokeWidth="2.5" />
        </svg>
      );

    case 'cumi':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Cumi-cumi Raksasa (Colossal Squid) */}
          {/* Arrow Mantle Fin */}
          <path d="M15 50 L35 28 L40 50 L35 72 Z" fill="#9F1239" stroke="#881337" strokeWidth="2.5" />
          {/* Main Squid Torpedo Head */}
          <ellipse cx="50" cy="50" rx="24" ry="16" fill="#F43F5E" stroke="#BE123C" strokeWidth="3" />
          {/* Massive Predatory Tentacles */}
          <path d="M68 45 Q 85 30 96 35 M68 55 Q 85 70 96 65 M70 50 L98 50" stroke="#E11D48" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          {/* Luminous Eye */}
          <circle cx="62" cy="46" r="6" fill="#FEF08A" stroke="#881337" strokeWidth="1.5" />
          <circle cx="63" cy="46" r="3" fill="#1E1B4B" />
        </svg>
      );

    case 'megalodon':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ancient Megalodon */}
          <path d="M25 50 L5 15 Q 18 45 10 50 Q 18 55 5 85 Z" fill="#0284C7" stroke="#0369A1" strokeWidth="3" />
          <path d="M22 50 Q 48 20 88 42 Q 95 50 82 62 Q 48 75 22 50 Z" fill="#38BDF8" stroke="#0284C7" strokeWidth="4" />
          <path d="M32 54 Q 55 70 80 60 Q 60 74 32 54 Z" fill="#F8FAFC" />
          <path d="M42 33 L58 5 L68 31 Z" fill="#0284C7" stroke="#0369A1" strokeWidth="3" />
          <path d="M80 54 L76 58 L73 54 L70 58 L67 54" stroke="#DC2626" strokeWidth="2.5" fill="#FFFFFF" />
          <circle cx="76" cy="38" r="5" fill="#0F172A" />
          <circle cx="77" cy="37" r="2" fill="#EF4444" />
          <path d="M50 42 L58 48 M54 40 L62 46" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
          <path d="M62 42 V54 M58 44 V52 M54 45 V50" stroke="#0369A1" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'hiuhantu':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ghost Shark (Translucent Phantom) */}
          <circle cx="50" cy="50" r="44" fill="#38BDF8" opacity="0.15" />
          <path d="M24 50 L6 20 Q 16 50 8 80 Z" fill="#CBD5E1" opacity="0.6" stroke="#94A3B8" strokeWidth="2" />
          <path d="M22 50 Q 48 26 86 42 Q 92 50 80 58 Q 48 72 22 50 Z" fill="#F8FAFC" opacity="0.75" stroke="#94A3B8" strokeWidth="2.5" />
          <path d="M45 32 L56 12 L64 32 Z" fill="#E2E8F0" opacity="0.7" stroke="#94A3B8" strokeWidth="2" />
          {/* Glowing Phantom Cyan Eye */}
          <circle cx="74" cy="42" r="5.5" fill="#22D3EE" />
          <circle cx="75" cy="42" r="2" fill="#FFFFFF" />
          {/* Spectral Rib Outline */}
          <path d="M42 42 V56 M50 40 V58 M58 42 V56" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </svg>
      );

    case 'oarfish':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Giant Deepsea Ribbon Oarfish */}
          <path d="M10 50 Q 30 38 55 50 Q 75 62 90 48" stroke="#E2E8F0" strokeWidth="12" strokeLinecap="round" fill="none" />
          <path d="M12 44 Q 30 32 55 44 Q 75 56 90 42" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M84 42 L88 18 M87 43 L96 22" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="35" cy="46" r="2" fill="#38BDF8" />
          <circle cx="52" cy="50" r="2" fill="#38BDF8" />
          <circle cx="70" cy="54" r="2" fill="#38BDF8" />
          <circle cx="86" cy="46" r="4.5" fill="#0F172A" />
          <circle cx="87" cy="45" r="1.5" fill="#FFFFFF" />
        </svg>
      );

    case 'naga':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Naga Air Zamrud (Emerald Dragon) */}
          <circle cx="50" cy="50" r="44" fill="#A7F3D0" opacity="0.2" />
          {/* Serpentine Emerald Body */}
          <path d="M14 68 Q 30 28 54 48 Q 74 66 88 38" stroke="#047857" strokeWidth="12" strokeLinecap="round" fill="none" />
          <path d="M14 68 Q 30 28 54 48 Q 74 66 88 38" stroke="#10B981" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M14 68 Q 30 28 54 48 Q 74 66 88 38" stroke="#6EE7B7" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Jade Horns */}
          <path d="M82 32 L92 16 M85 36 L96 26" stroke="#065F46" strokeWidth="3" strokeLinecap="round" />
          <circle cx="86" cy="36" r="3.5" fill="#FDE047" />
          <circle cx="87" cy="35" r="1.5" fill="#DC2626" />
        </svg>
      );

    case 'leviathan':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Leviathan Air Tawar (Colossal Abyssal Sea Monster) */}
          <circle cx="50" cy="50" r="45" fill="#1E3A8A" opacity="0.3" />
          <path d="M15 50 Q 45 20 85 45 Q 88 56 75 66 Q 45 78 15 50 Z" fill="#1E3A8A" stroke="#172554" strokeWidth="4" />
          {/* Bioluminescent Blue Spikes */}
          <path d="M35 30 L40 16 L46 32 M52 28 L58 14 L64 30 M70 32 L75 20 L80 36" stroke="#38BDF8" strokeWidth="3" fill="#0284C7" />
          {/* Glowing Rune Lines */}
          <path d="M35 50 Q 55 45 75 50" stroke="#60A5FA" strokeWidth="3" strokeDasharray="4 3" fill="none" />
          {/* Piercing Sapphire Eye */}
          <circle cx="76" cy="42" r="5" fill="#38BDF8" />
          <circle cx="77" cy="42" r="2" fill="#FFFFFF" />
        </svg>
      );

    case 'duyung':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Putri Duyung Emas (Golden Mermaid) */}
          <circle cx="50" cy="50" r="44" fill="#FEF08A" opacity="0.25" />
          {/* Golden Mermaid Tail */}
          <path d="M12 65 Q 25 35 48 50 Q 60 58 68 50" stroke="#F59E0B" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M14 65 L6 75 Q 16 85 24 75 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
          {/* Upper Body & Flowing Hair */}
          <circle cx="74" cy="38" r="8" fill="#FDE68A" />
          <path d="M68 34 Q 60 45 64 55 Q 75 52 74 38" fill="#F59E0B" />
          {/* Golden Crown & Sparkles */}
          <path d="M72 30 L74 24 L76 30" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="76" cy="38" r="1.5" fill="#B45309" />
          <circle cx="35" cy="30" r="2.5" fill="#FFFFFF" />
          <circle cx="55" cy="26" r="3" fill="#FFFFFF" />
        </svg>
      );

    // ==========================================
    // MITOS / DEWA (MYTHIC)
    // ==========================================
    case 'phoenix':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ocean Aqua Phoenix */}
          <circle cx="50" cy="50" r="45" fill="#CFFAFE" opacity="0.3" />
          <path d="M50 50 Q 20 15 10 35 Q 25 45 45 52" fill="#06B6D4" opacity="0.85" stroke="#0891B2" strokeWidth="2" />
          <path d="M50 50 Q 80 15 90 35 Q 75 45 55 52" fill="#06B6D4" opacity="0.85" stroke="#0891B2" strokeWidth="2" />
          <path d="M50 65 Q 40 85 30 95 Q 48 88 50 65" fill="#38BDF8" />
          <path d="M50 65 Q 50 88 50 98 Q 52 88 50 65" fill="#67E8F9" />
          <path d="M50 65 Q 60 85 70 95 Q 52 88 50 65" fill="#38BDF8" />
          <ellipse cx="50" cy="50" rx="14" ry="20" fill="#0EA5E9" stroke="#0369A1" strokeWidth="2.5" />
          <path d="M48 30 L50 16 L52 30" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
          <circle cx="46" cy="42" r="3" fill="#FACC15" />
          <circle cx="54" cy="42" r="3" fill="#FACC15" />
        </svg>
      );

    case 'atlantis':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Dewa Penjaga Atlantis */}
          <circle cx="50" cy="50" r="45" fill="#CCFBF1" opacity="0.3" />
          <path d="M28 50 L8 25 L16 50 L8 75 Z" fill="#0D9488" stroke="#F59E0B" strokeWidth="3" />
          <ellipse cx="55" cy="50" rx="32" ry="22" fill="#14B8A6" stroke="#F59E0B" strokeWidth="4" />
          <path d="M78 40 L96 32 M90 26 L96 32 L92 40" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M40 38 Q 48 50 40 62" stroke="#F59E0B" strokeWidth="3" fill="none" />
          <path d="M52 35 Q 60 50 52 65" stroke="#F59E0B" strokeWidth="3" fill="none" />
          <path d="M64 38 Q 70 50 64 62" stroke="#F59E0B" strokeWidth="3" fill="none" />
          <circle cx="74" cy="44" r="5" fill="#FEF08A" stroke="#0F766E" strokeWidth="2" />
          <circle cx="75" cy="44" r="2" fill="#0F766E" />
        </svg>
      );

    case 'shenlong':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Naga Emas Shenlong */}
          <circle cx="50" cy="50" r="44" fill="#FEF08A" opacity="0.3" />
          <path d="M12 72 Q 28 30 52 50 Q 72 68 88 38" stroke="#EAB308" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M12 72 Q 28 30 52 50 Q 72 68 88 38" stroke="#FACC15" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M12 72 Q 28 30 52 50 Q 72 68 88 38" stroke="#FEF08A" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M82 32 L94 18 M84 36 L98 28" stroke="#CA8A04" strokeWidth="3" strokeLinecap="round" />
          <path d="M88 42 Q 102 46 100 60" stroke="#FDE047" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <ellipse cx="84" cy="38" rx="10" ry="8" fill="#EAB308" stroke="#854D0E" strokeWidth="2" />
          <circle cx="85" cy="36" r="3" fill="#EF4444" />
          <circle cx="86" cy="35" r="1" fill="#FFFFFF" />
          <circle cx="28" cy="28" r="8" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="28" cy="28" r="6" fill="#60A5FA" />
        </svg>
      );

    case 'cosmic':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Ikan Bintang Galaksi */}
          <circle cx="50" cy="50" r="44" fill="#1E1B4B" opacity="0.5" />
          <path d="M30 50 L10 25 Q 20 50 10 75 Z" fill="#818CF8" stroke="#6366F1" strokeWidth="2.5" />
          <ellipse cx="55" cy="50" rx="30" ry="18" fill="#4338CA" stroke="#818CF8" strokeWidth="3" />
          <circle cx="45" cy="44" r="2.5" fill="#FFFFFF" />
          <circle cx="56" cy="52" r="3" fill="#FDE047" />
          <circle cx="68" cy="46" r="2" fill="#FFFFFF" />
          <line x1="45" y1="44" x2="56" y2="52" stroke="#A5B4FC" strokeWidth="1.5" strokeDasharray="2 2" />
          <line x1="56" y1="52" x2="68" y2="46" stroke="#A5B4FC" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="74" cy="44" r="5" fill="#F43F5E" />
          <circle cx="75" cy="43" r="2" fill="#FFFFFF" />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
          {/* Fallback Clean Stylized Fish */}
          <path d="M25 50 L8 30 Q 16 50 8 70 Z" fill={color || '#F59E0B'} stroke="#B45309" strokeWidth="2" />
          <ellipse cx="54" cy="50" rx="28" ry="18" fill={color || '#F59E0B'} stroke="#B45309" strokeWidth="2.5" />
          <circle cx="70" cy="45" r="4.5" fill="#FFFFFF" />
          <circle cx="71" cy="45" r="2" fill="#000000" />
        </svg>
      );
  }
};
