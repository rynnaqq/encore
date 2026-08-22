export interface RodItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  description: string;
  reelSpeedBonus: number;
  strengthBonus: number;
  luckBonus: number;
  color: string;
}

export interface BaitItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  description: string;
  biteSpeedBonus: number;
  rareBonus: number;
  mythicBonus: number;
}

export const RODS_DATABASE: RodItem[] = [
  { id: 'bamboo', name: 'Joran Bambu Klasik', price: 0, icon: '🎋', description: 'Joran tradisional bambu petung pilihan.', reelSpeedBonus: 0, strengthBonus: 0, luckBonus: 0, color: '#eab308' },
  { id: 'carbon', name: 'Joran Serat Karbon Pro', price: 1200, icon: '🎣', description: 'Ringan & lentur, kecepatan tarik +25% & ketahanan +20%.', reelSpeedBonus: 0.25, strengthBonus: 0.20, luckBonus: 0.15, color: '#38bdf8' },
  { id: 'gold', name: 'Joran Naga Emas Hoki', price: 4500, icon: '🔱', description: 'Berlapis emas murni, peluang ikan Langka & Koin +50%.', reelSpeedBonus: 0.40, strengthBonus: 0.35, luckBonus: 0.40, color: '#facc15' },
  { id: 'poseidon', name: 'Trisula Poseidon Atlantis', price: 15000, icon: '⚡', description: 'Pusaka dewa samudra, peluang Mitos +150% & Auto-Reel Burst!', reelSpeedBonus: 0.65, strengthBonus: 0.50, luckBonus: 0.90, color: '#a855f7' },
  { id: 'cosmic', name: 'Tongkat Bintang Shenlong', price: 50000, icon: '🌌', description: 'Artefak langit tak terbatas! Tarikan +80%, Koin x2 & Hoki Mitos Ekstrem!', reelSpeedBonus: 0.80, strengthBonus: 0.70, luckBonus: 1.60, color: '#ec4899' }
];

export const BAITS_DATABASE: BaitItem[] = [
  { id: 'worm', name: 'Cacing Tanah', price: 0, icon: '🪱', description: 'Umpan dasar tak terbatas.', biteSpeedBonus: 0, rareBonus: 0, mythicBonus: 0 },
  { id: 'pellet', name: 'Pelet Aroma Master', price: 80, icon: '🧆', description: 'Ikan menyambar 50% lebih cepat.', biteSpeedBonus: 0.5, rareBonus: 0.15, mythicBonus: 0 },
  { id: 'shrimp', name: 'Udang Laut Fosfor', price: 350, icon: '🦐', description: 'Peluang ikan Langka & Sangat Langka meningkat drastis.', biteSpeedBonus: 0.35, rareBonus: 0.45, mythicBonus: 0.15 },
  { id: 'star', name: 'Umpan Bintang Mitos', price: 1500, icon: '⭐', description: 'Memikat ikan Legendaris & Mitos Purba dari kedalaman.', biteSpeedBonus: 0.45, rareBonus: 0.70, mythicBonus: 0.85 },
  { id: 'nectar', name: 'Nektar Dewa Samudra', price: 5000, icon: '🍯', description: 'Aroma sakral penarik makhluk Mitos dan Dewa tertinggi.', biteSpeedBonus: 0.60, rareBonus: 1.10, mythicBonus: 2.00 }
];
