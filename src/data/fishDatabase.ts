import { RODS_DATABASE, BAITS_DATABASE } from './equipmentDatabase.ts';

export type TimeOfDay = 'pagi' | 'siang' | 'senja' | 'malam';
export type WeatherType = 'cerah' | 'berawan' | 'hujan' | 'badai' | 'kabut_mistis';

export interface AdminOddsConfig {
  enabled: boolean;
  mythic: number; // 0 - 1.0 (e.g. 0.5 for 50%)
  legendary: number;
  epic: number;
  rare: number;
  common: number;
}

export interface FishType {
  id: string;
  name: string;
  rarity: 'Biasa' | 'Langka' | 'Sangat Langka' | 'Legendaris' | 'Mitos';
  color: string;
  secondaryColor: string;
  badgeBg: string;
  difficulty: number;
  minWeight: number;
  maxWeight: number;
  points: number;
  coins: number;
  description: string;
}

export const FISH_DATABASE: FishType[] = [
  // Biasa (Common)
  { id: 'shoe', name: 'Sepatu Boots Tua', rarity: 'Biasa', color: '#a8a29e', secondaryColor: '#57534e', badgeBg: '#e7e5e4', difficulty: 0.45, minWeight: 0.3, maxWeight: 0.9, points: 10, coins: 3, description: 'Boot tua basah yang tersangkut di dasar sungai.' },
  { id: 'kaleng', name: 'Kaleng Bekas', rarity: 'Biasa', color: '#94a3b8', secondaryColor: '#475569', badgeBg: '#f8fafc', difficulty: 0.35, minWeight: 0.1, maxWeight: 0.5, points: 8, coins: 2, description: 'Sampah yang terbuang. Jagalah kebersihan lingkungan!' },
  { id: 'ranting', name: 'Ranting Pohon', rarity: 'Biasa', color: '#78350f', secondaryColor: '#451a03', badgeBg: '#fffbeb', difficulty: 0.3, minWeight: 0.5, maxWeight: 2.0, points: 5, coins: 2, description: 'Hanya sepotong kayu yang tersangkut.' },
  { id: 'keong', name: 'Keong Emas Sawah', rarity: 'Biasa', color: '#f59e0b', secondaryColor: '#b45309', badgeBg: '#fffbeb', difficulty: 0.45, minWeight: 0.1, maxWeight: 0.4, points: 15, coins: 5, description: 'Cangkang keong kuning mengkilap di dasar lumpur.' },
  { id: 'sepat', name: 'Ikan Sepat Rawa', rarity: 'Biasa', color: '#9ca3af', secondaryColor: '#4b5563', badgeBg: '#f3f4f6', difficulty: 0.6, minWeight: 0.1, maxWeight: 0.3, points: 20, coins: 7, description: 'Suka bersembunyi di balik tanaman air.' },
  { id: 'wader', name: 'Ikan Wader Pari', rarity: 'Biasa', color: '#cbd5e1', secondaryColor: '#94a3b8', badgeBg: '#f8fafc', difficulty: 0.55, minWeight: 0.05, maxWeight: 0.2, points: 25, coins: 9, description: 'Ikan kecil perak yang hidup bergerombol di perairan dangkal.' },
  { id: 'teri', name: 'Ikan Teri Neon', rarity: 'Biasa', color: '#38bdf8', secondaryColor: '#0284c7', badgeBg: '#e0f2fe', difficulty: 0.65, minWeight: 0.1, maxWeight: 0.4, points: 30, coins: 11, description: 'Ikan hias mungil berkilau biru neon saat terkena cahaya.' },
  { id: 'mujair', name: 'Ikan Mujair Bintik', rarity: 'Biasa', color: '#64748b', secondaryColor: '#334155', badgeBg: '#f1f5f9', difficulty: 0.8, minWeight: 0.5, maxWeight: 1.5, points: 40, coins: 14, description: 'Ikan air tawar yang tangguh dan mudah berkembang biak.' },
  { id: 'betik', name: 'Ikan Betik', rarity: 'Biasa', color: '#65a30d', secondaryColor: '#3f6212', badgeBg: '#f7fee7', difficulty: 0.75, minWeight: 0.2, maxWeight: 0.6, points: 35, coins: 13, description: 'Ikan kuat yang bisa hidup di air keruh.' },
  { id: 'nila', name: 'Ikan Nila Emas', rarity: 'Biasa', color: '#facc15', secondaryColor: '#ca8a04', badgeBg: '#fef9c3', difficulty: 0.95, minWeight: 0.8, maxWeight: 2.8, points: 55, coins: 18, description: 'Sisiknya kuning berkilau seperti emas murni.' },
  { id: 'kepiting', name: 'Kepiting Kecil', rarity: 'Biasa', color: '#f87171', secondaryColor: '#b91c1c', badgeBg: '#fef2f2', difficulty: 0.9, minWeight: 0.2, maxWeight: 0.8, points: 48, coins: 16, description: 'Suka mencapit umpanmu dengan capitnya yang kecil.' },
  { id: 'guppy', name: 'Ikan Guppy Pelangi', rarity: 'Biasa', color: '#f472b6', secondaryColor: '#ec4899', badgeBg: '#fdf2f8', difficulty: 0.7, minWeight: 0.05, maxWeight: 0.2, points: 50, coins: 18, description: 'Ekornya mekar indah seperti kipas beraneka warna.' },
  
  // Langka (Rare)
  { id: 'patin', name: 'Ikan Patin Sungai', rarity: 'Langka', color: '#cbd5e1', secondaryColor: '#64748b', badgeBg: '#f8fafc', difficulty: 1.7, minWeight: 2.0, maxWeight: 10.0, points: 150, coins: 75, description: 'Dagingnya tebal dan tarikannya cukup kuat.' },
  { id: 'gurame', name: 'Gurame Padang', rarity: 'Langka', color: '#fb923c', secondaryColor: '#c2410c', badgeBg: '#fff7ed', difficulty: 1.6, minWeight: 2.5, maxWeight: 5.0, points: 170, coins: 85, description: 'Pipih, lezat, dan memiliki warna cerah memikat.' },
  { id: 'bawal', name: 'Ikan Bawal Bintang', rarity: 'Langka', color: '#94a3b8', secondaryColor: '#334155', badgeBg: '#f8fafc', difficulty: 1.8, minWeight: 1.2, maxWeight: 3.8, points: 190, coins: 95, description: 'Ikan berbadan lebar dan bertenaga besar saat melawan kail.' },
  { id: 'lele', name: 'Ikan Lele Raksasa', rarity: 'Langka', color: '#475569', secondaryColor: '#0f172a', badgeBg: '#f1f5f9', difficulty: 2.1, minWeight: 3.5, maxWeight: 8.5, points: 230, coins: 120, description: 'Kumisnya panjang dan perlawanannya sangat sengit!' },
  { id: 'gabus', name: 'Ikan Gabus Loreng', rarity: 'Langka', color: '#4d7c0f', secondaryColor: '#14532d', badgeBg: '#f0fdf4', difficulty: 2.2, minWeight: 2.0, maxWeight: 6.5, points: 250, coins: 135, description: 'Predator air tawar dengan gigi tajam dan corak loreng.' },
  { id: 'kura', name: 'Kura-kura Sungai', rarity: 'Langka', color: '#166534', secondaryColor: '#064e3b', badgeBg: '#f0fdf4', difficulty: 2.3, minWeight: 1.5, maxWeight: 4.0, points: 270, coins: 145, description: 'Tempurungnya keras, sangat berat saat ditarik.' },
  { id: 'belut', name: 'Belut Listrik', rarity: 'Langka', color: '#eab308', secondaryColor: '#854d0e', badgeBg: '#fefce8', difficulty: 2.5, minWeight: 1.0, maxWeight: 3.5, points: 300, coins: 165, description: 'Hati-hati! Ikan ini bisa memberikan sengatan kecil.' },
  { id: 'udang', name: 'Udang Galah Raksasa', rarity: 'Langka', color: '#f97316', secondaryColor: '#c2410c', badgeBg: '#fff7ed', difficulty: 2.1, minWeight: 0.5, maxWeight: 1.5, points: 260, coins: 140, description: 'Capitnya panjang berwarna biru, rasanya pasti lezat.' },
  { id: 'channa', name: 'Ikan Channa Maru', rarity: 'Langka', color: '#f59e0b', secondaryColor: '#b45309', badgeBg: '#fef3c7', difficulty: 2.6, minWeight: 1.8, maxWeight: 5.5, points: 350, coins: 195, description: 'Channa berkepala ular dengan motif bunga kuning keemasan.' },
  { id: 'lobster', name: 'Lobster Biru Samudra', rarity: 'Langka', color: '#0284c7', secondaryColor: '#0369a1', badgeBg: '#e0f2fe', difficulty: 2.7, minWeight: 0.8, maxWeight: 2.2, points: 380, coins: 220, description: 'Warna birunya sangat mencolok dan langka di alam liar.' },
  
  // Sangat Langka (Epic)
  { id: 'koi', name: 'Ikan Mas Koi Royal', rarity: 'Sangat Langka', color: '#f87171', secondaryColor: '#fef2f2', badgeBg: '#fee2e2', difficulty: 2.9, minWeight: 2.5, maxWeight: 6.0, points: 550, coins: 380, description: 'Simbol keberuntungan bertotol merah putih indah.' },
  { id: 'belida', name: 'Ikan Belida Lopis', rarity: 'Sangat Langka', color: '#9ca3af', secondaryColor: '#374151', badgeBg: '#f3f4f6', difficulty: 3.1, minWeight: 3.0, maxWeight: 7.0, points: 620, coins: 440, description: 'Bentuknya unik seperti pisau, sangat langka di alam liar.' },
  { id: 'pari', name: 'Pari Air Tawar', rarity: 'Sangat Langka', color: '#d6d3d1', secondaryColor: '#78716c', badgeBg: '#fafaf9', difficulty: 3.3, minWeight: 5.0, maxWeight: 15.0, points: 700, coins: 510, description: 'Bentuknya pipih melebar, sangat jarang terlihat.' },
  { id: 'piranha', name: 'Piranha Merah', rarity: 'Sangat Langka', color: '#ef4444', secondaryColor: '#991b1b', badgeBg: '#fef2f2', difficulty: 3.5, minWeight: 0.8, maxWeight: 2.5, points: 760, coins: 580, description: 'Ikan predator buas dengan gigi setajam silet.' },
  { id: 'peacock', name: 'Ikan Peacock Bass', rarity: 'Sangat Langka', color: '#10b981', secondaryColor: '#f59e0b', badgeBg: '#ecfdf5', difficulty: 3.4, minWeight: 2.0, maxWeight: 6.0, points: 740, coins: 560, description: 'Corak ekornya menyerupai mata merak dengan kilau hijau zamrud.' },
  { id: 'arwana', name: 'Arwana Super Red', rarity: 'Sangat Langka', color: '#dc2626', secondaryColor: '#7f1d1d', badgeBg: '#fef2f2', difficulty: 3.8, minWeight: 1.5, maxWeight: 4.5, points: 900, coins: 750, description: 'Raja akuarium dengan sisik merah merona yang mahal harganya.' },
  { id: 'pesut', name: 'Pesut Mahakam', rarity: 'Sangat Langka', color: '#bfdbfe', secondaryColor: '#60a5fa', badgeBg: '#eff6ff', difficulty: 4.0, minWeight: 10.0, maxWeight: 30.0, points: 1000, coins: 850, description: 'Mamalia air tawar yang cerdas dan bersahabat.' },
  { id: 'aligator', name: 'Ikan Aligator Gar', rarity: 'Sangat Langka', color: '#334155', secondaryColor: '#0f172a', badgeBg: '#f1f5f9', difficulty: 4.2, minWeight: 8.0, maxWeight: 25.0, points: 1150, coins: 980, description: 'Moncongnya panjang mirip buaya dengan deretan taring tajam.' },
  { id: 'arapaima', name: 'Ikan Arapaima Gigas', rarity: 'Sangat Langka', color: '#b91c1c', secondaryColor: '#1e293b', badgeBg: '#fee2e2', difficulty: 4.5, minWeight: 20.0, maxWeight: 75.0, points: 1350, coins: 1250, description: 'Raksasa sungai Amazon berlidah tulang dan bersisik merah.' },
  
  // Legendaris (Legendary)
  { id: 'kraken', name: 'Bayi Kraken', rarity: 'Legendaris', color: '#a855f7', secondaryColor: '#581c87', badgeBg: '#faf5ff', difficulty: 4.8, minWeight: 15.0, maxWeight: 45.0, points: 2500, coins: 2500, description: 'Makhluk mitologi berwujud gurita raksasa berukuran kecil.' },
  { id: 'cumi', name: 'Cumi-cumi Raksasa', rarity: 'Legendaris', color: '#f43f5e', secondaryColor: '#9f1239', badgeBg: '#fff1f2', difficulty: 5.0, minWeight: 30.0, maxWeight: 70.0, points: 2900, coins: 3000, description: 'Tentakelnya sangat kuat, bisa menyemburkan tinta hitam.' },
  { id: 'megalodon', name: 'Hiu Megalodon Purba', rarity: 'Legendaris', color: '#38bdf8', secondaryColor: '#f1f5f9', badgeBg: '#bae6fd', difficulty: 5.3, minWeight: 30.0, maxWeight: 80.0, points: 3400, coins: 3600, description: 'Predator samudra purba yang legendaris! Sangat langka.' },
  { id: 'hiuhantu', name: 'Hiu Hantu Tembus Pandang', rarity: 'Legendaris', color: '#f8fafc', secondaryColor: '#cbd5e1', badgeBg: '#f1f5f9', difficulty: 5.4, minWeight: 10.0, maxWeight: 25.0, points: 3800, coins: 4000, description: 'Tubuhnya transparan, hanya terlihat matanya yang bersinar.' },
  { id: 'oarfish', name: 'Ikan Naga Oarfish Samudra', rarity: 'Legendaris', color: '#e2e8f0', secondaryColor: '#ef4444', badgeBg: '#f8fafc', difficulty: 5.6, minWeight: 35.0, maxWeight: 90.0, points: 4300, coins: 4600, description: 'Ikan pita raksasa penjelajah palung laut terdalam dengan mahkota merah.' },
  { id: 'naga', name: 'Naga Air Zamrud', rarity: 'Legendaris', color: '#10b981', secondaryColor: '#047857', badgeBg: '#ecfdf5', difficulty: 6.0, minWeight: 25.0, maxWeight: 80.0, points: 5000, coins: 5400, description: 'Naga gaib penunggu kedalaman, memancarkan aura magis hijau.' },
  { id: 'leviathan', name: 'Leviathan Air Tawar', rarity: 'Legendaris', color: '#1e3a8a', secondaryColor: '#172554', badgeBg: '#eff6ff', difficulty: 6.3, minWeight: 50.0, maxWeight: 150.0, points: 6000, coins: 6500, description: 'Raksasa mitologi yang menguasai perairan dalam.' },
  { id: 'duyung', name: 'Putri Duyung Emas', rarity: 'Legendaris', color: '#fcd34d', secondaryColor: '#b45309', badgeBg: '#fffbeb', difficulty: 6.6, minWeight: 40.0, maxWeight: 65.0, points: 7500, coins: 8000, description: 'Sosok mitos cantik yang membawa keberuntungan tiada tara.' },

  // Mitos / Dewa (Mythic)
  { id: 'phoenix', name: 'Phoenix Abadi Samudra', rarity: 'Mitos', color: '#06b6d4', secondaryColor: '#0891b2', badgeBg: '#cffafe', difficulty: 7.0, minWeight: 80.0, maxWeight: 280.0, points: 12000, coins: 15000, description: 'Burung mitos bersayap air es abadi yang terlahir dari tetesan embun samudra.' },
  { id: 'atlantis', name: 'Dewa Penjaga Atlantis', rarity: 'Mitos', color: '#14b8a6', secondaryColor: '#0f766e', badgeBg: '#ccfbf1', difficulty: 7.4, minWeight: 120.0, maxWeight: 450.0, points: 16000, coins: 20000, description: 'Penguasa samudra kuno berzirah emas dan bertrisula keramat.' },
  { id: 'shenlong', name: 'Naga Emas Shenlong', rarity: 'Mitos', color: '#facc15', secondaryColor: '#854d0e', badgeBg: '#fef08a', difficulty: 7.8, minWeight: 100.0, maxWeight: 350.0, points: 20000, coins: 25000, description: 'Naga langit suci pembawa berkah kekayaan tiada tara, bermahkota mustika naga.' },
  { id: 'cosmic', name: 'Ikan Bintang Galaksi', rarity: 'Mitos', color: '#6366f1', secondaryColor: '#4338ca', badgeBg: '#e0e7ff', difficulty: 8.2, minWeight: 150.0, maxWeight: 600.0, points: 25000, coins: 32000, description: 'Makhluk kosmik yang tercipta dari gugusan bintang galaksi dan nebula alam semesta.' }
];

export const calculateRarityRates = (
  rodId: string,
  baitId: string,
  weather?: WeatherType,
  adminOdds?: AdminOddsConfig
) => {
  if (adminOdds && adminOdds.enabled) {
    const mythic = Math.max(0, adminOdds.mythic);
    const legendary = Math.max(0, adminOdds.legendary);
    const epic = Math.max(0, adminOdds.epic);
    const rare = Math.max(0, adminOdds.rare);
    const common = Math.max(0, adminOdds.common);
    return { common, rare, epic, legendary, mythic };
  }

  const rod = RODS_DATABASE.find((r) => r.id === rodId) || RODS_DATABASE[0];
  const bait = BAITS_DATABASE.find((b) => b.id === baitId) || BAITS_DATABASE[0];

  let weatherMythicBonus = 0;
  let weatherRareBonus = 0;
  if (weather === 'badai') {
    weatherMythicBonus = 0.005;
    weatherRareBonus = 0.04;
  } else if (weather === 'kabut_mistis') {
    weatherMythicBonus = 0.012;
    weatherRareBonus = 0.06;
  } else if (weather === 'hujan') {
    weatherRareBonus = 0.025;
  }

  const mythicChance = 0.005 + rod.luckBonus * 0.006 + bait.mythicBonus * 0.012 + weatherMythicBonus;
  const legendaryChance = 0.035 + rod.luckBonus * 0.025 + bait.rareBonus * 0.03 + weatherRareBonus;
  const epicChance = 0.11 + rod.luckBonus * 0.04 + bait.rareBonus * 0.05 + (weather === 'hujan' ? 0.03 : 0);
  const rareChance = 0.25 + rod.luckBonus * 0.05 + bait.rareBonus * 0.07;

  const totalSpecial = mythicChance + legendaryChance + epicChance + rareChance;
  const commonChance = Math.max(0.05, 1 - totalSpecial);

  return {
    common: commonChance,
    rare: rareChance,
    epic: epicChance,
    legendary: legendaryChance,
    mythic: mythicChance,
  };
};

export const getRandomFish = (
  rodId: string,
  baitId: string,
  weather?: WeatherType,
  adminOdds?: AdminOddsConfig
): FishType => {
  const rates = calculateRarityRates(rodId, baitId, weather, adminOdds);
  const rand = Math.random();

  let targetRarity: FishType['rarity'] = 'Biasa';
  if (rand < rates.mythic) {
    targetRarity = 'Mitos';
  } else if (rand < rates.mythic + rates.legendary) {
    targetRarity = 'Legendaris';
  } else if (rand < rates.mythic + rates.legendary + rates.epic) {
    targetRarity = 'Sangat Langka';
  } else if (rand < rates.mythic + rates.legendary + rates.epic + rates.rare) {
    targetRarity = 'Langka';
  } else {
    targetRarity = 'Biasa';
  }

  const candidatePool = FISH_DATABASE.filter((f) => f.rarity === targetRarity);
  if (candidatePool.length === 0) return FISH_DATABASE[0];
  return candidatePool[Math.floor(Math.random() * candidatePool.length)];
};
