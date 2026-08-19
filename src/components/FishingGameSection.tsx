import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle, ArrowLeft, Trophy, Sparkles, Volume2, VolumeX,
  Sun, Moon, Flame, Maximize2, Minimize2, BookOpen, X, Coins,
  ShoppingBag, BarChart3, CloudRain, Zap, Check, Shield, Crown,
  Sliders, Cloud, RefreshCw, Compass, HelpCircle, ChevronLeft, ChevronRight,
  Fish, Award, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdminName, AdminBadge } from './AdminBadge';
import { FishGraphic } from './FishGraphic';
import { playFishingSound, unlockAudio, FishingSoundType } from '../lib/fishingAudio';

type GameState = 'idle' | 'preparing' | 'casting' | 'waiting' | 'biting' | 'reeling' | 'caught' | 'escaped';
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

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
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

  let mythicChance = 0.005 + rod.luckBonus * 0.006 + bait.mythicBonus * 0.012 + weatherMythicBonus;
  let legendaryChance = 0.035 + rod.luckBonus * 0.025 + bait.rareBonus * 0.03 + weatherRareBonus;
  let epicChance = 0.11 + rod.luckBonus * 0.04 + bait.rareBonus * 0.05 + (weather === 'hujan' ? 0.03 : 0);
  let rareChance = 0.25 + rod.luckBonus * 0.05 + bait.rareBonus * 0.07;

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

const getRandomFish = (
  rodId: string,
  baitId: string,
  weather?: WeatherType,
  adminOdds?: AdminOddsConfig
): FishType => {
  const rates = calculateRarityRates(rodId, baitId, weather, adminOdds);
  const rand = Math.random();

  if (rand < rates.mythic) {
    const mythic = FISH_DATABASE.filter((f) => f.rarity === 'Mitos');
    return mythic[Math.floor(Math.random() * mythic.length)];
  } else if (rand < rates.mythic + rates.legendary) {
    const legendaris = FISH_DATABASE.filter((f) => f.rarity === 'Legendaris');
    return legendaris[Math.floor(Math.random() * legendaris.length)];
  } else if (rand < rates.mythic + rates.legendary + rates.epic) {
    const sgtLangka = FISH_DATABASE.filter((f) => f.rarity === 'Sangat Langka');
    return sgtLangka[Math.floor(Math.random() * sgtLangka.length)];
  } else if (rand < rates.mythic + rates.legendary + rates.epic + rates.rare) {
    const langka = FISH_DATABASE.filter((f) => f.rarity === 'Langka');
    return langka[Math.floor(Math.random() * langka.length)];
  } else {
    const biasa = FISH_DATABASE.filter((f) => f.rarity === 'Biasa');
    return biasa[Math.floor(Math.random() * biasa.length)];
  }
};

/* =========================================================================
   COMPONENTS: FISHING JOURNAL (SPECIES LOG & STATS)
   ========================================================================= */
const FishingJournal: React.FC<{
  score: number;
  caughtCount: number;
  discoveredSpecies: string[];
  soundEnabled?: boolean;
  onClose: () => void;
}> = ({ score, caughtCount, discoveredSpecies, soundEnabled = true, onClose }) => {
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [selectedFish, setSelectedFish] = useState<FishType | null>(null);

  const filteredFish = FISH_DATABASE.filter(f => {
    if (filterRarity === 'all') return true;
    return f.rarity === filterRarity;
  });

  const completionPct = Math.round((discoveredSpecies.length / FISH_DATABASE.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 flex items-center justify-center bg-slate-950/85 z-[300] p-2 sm:p-4 font-mono select-none"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bg-[#fefce8] border-[5px] border-black p-4 sm:p-6 w-full max-w-[760px] shadow-[10px_10px_0_0_#000] relative max-h-[90vh] flex flex-col rounded-sm overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-3 pr-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-400 border-[2px] border-black flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-950 tracking-wider">JURNAL IKAN SAMUDRA</h2>
              <p className="text-[9px] text-slate-600 font-bold">Koleksi & Ensiklopedia Spesies Air</p>
            </div>
          </div>
          <button
            onClick={() => {
              playFishingSound('click', soundEnabled);
              onClose();
            }}
            className="absolute top-3 right-3 bg-red-600 text-white border-[3px] border-black p-1 hover:bg-red-500 shadow-[2px_2px_0_0_#000] active:translate-y-0.5 cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-3 gap-2 bg-amber-100/90 border-[3px] border-black p-2.5 mb-3 text-center shadow-xs">
          <div className="border-r-[2px] border-black/20 pr-1">
            <span className="text-[8px] text-slate-500 uppercase font-black block">Tangkapan</span>
            <span className="text-sm sm:text-base font-black text-slate-900">{caughtCount}</span>
          </div>
          <div className="border-r-[2px] border-black/20 pr-1">
            <span className="text-[8px] text-slate-500 uppercase font-black block">Skor Total</span>
            <span className="text-sm sm:text-base font-black text-blue-700">{score}</span>
          </div>
          <div>
            <span className="text-[8px] text-slate-500 uppercase font-black block">Koleksi ({completionPct}%)</span>
            <span className="text-sm sm:text-base font-black text-emerald-700">
              {discoveredSpecies.length}/{FISH_DATABASE.length}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 border-[2px] border-black h-3 mb-3 p-0.5 rounded-xs overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-yellow-300 transition-all duration-300 rounded-xs"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        {/* Rarity Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-2.5 custom-scrollbar text-[8.5px] font-black">
          {[
            { id: 'all', label: 'SEMUA' },
            { id: 'Biasa', label: 'BIASA' },
            { id: 'Langka', label: 'LANGKA' },
            { id: 'Sangat Langka', label: 'EPIC' },
            { id: 'Legendaris', label: 'LEGENDARIS' },
            { id: 'Mitos', label: 'MITOS' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                playFishingSound('click', soundEnabled);
                setFilterRarity(tab.id);
              }}
              className={`px-2.5 py-1 border-[2px] border-black shrink-0 transition-all cursor-pointer ${
                filterRarity === tab.id
                  ? 'bg-slate-950 text-yellow-300 shadow-[2px_2px_0_0_#000]'
                  : 'bg-white text-slate-700 hover:bg-amber-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Fish Cards Grid */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2 custom-scrollbar pb-2">
          {filteredFish.map((fishItem) => {
            const isFound = discoveredSpecies.includes(fishItem.id);
            const isSelected = selectedFish?.id === fishItem.id;
            return (
              <button
                key={fishItem.id}
                onClick={() => {
                  if (isFound) {
                    playFishingSound('click', soundEnabled);
                    setSelectedFish(isSelected ? null : fishItem);
                  }
                }}
                className={`text-left p-2 border-[2px] ${
                  isFound
                    ? isSelected
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500 shadow-md'
                      : fishItem.rarity === 'Mitos'
                      ? 'border-purple-600 bg-gradient-to-br from-purple-50 via-amber-50 to-white shadow-xs'
                      : fishItem.rarity === 'Legendaris'
                      ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                      : 'border-black bg-white shadow-xs'
                    : 'border-slate-300 bg-slate-100 opacity-60 cursor-not-allowed'
                } flex flex-col justify-between transition-transform active:scale-[0.98]`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[7.5px] font-black px-1.5 py-0.5 border border-black uppercase"
                    style={{ backgroundColor: isFound ? fishItem.badgeBg : '#cbd5e1' }}
                  >
                    {isFound ? fishItem.rarity : '???'}
                  </span>
                  {isFound && fishItem.rarity === 'Mitos' && (
                    <span className="text-[10px] animate-pulse">👑</span>
                  )}
                </div>

                <div className="h-16 flex items-center justify-center my-1 bg-amber-50/50 border border-black/10">
                  {isFound ? (
                    <FishGraphic id={fishItem.id} size={42} />
                  ) : (
                    <span className="text-xl text-slate-400 font-black">?</span>
                  )}
                </div>

                <div>
                  <h4 className="text-[10px] sm:text-[11px] font-black text-slate-900 truncate">
                    {isFound ? fishItem.name : 'Belum Ditemukan'}
                  </h4>
                  <div className="flex justify-between items-center text-[8px] text-slate-600 mt-0.5 font-bold">
                    <span>{isFound ? `+${fishItem.points} PTS` : '---'}</span>
                    <span>{isFound ? `🪙 ${fishItem.coins}` : '---'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Fish Inspector Drawer */}
        <AnimatePresence>
          {selectedFish && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-100 border-[3px] border-black p-2.5 mt-2 flex items-center gap-3 overflow-hidden shrink-0"
            >
              <div className="w-12 h-12 bg-white border-[2px] border-black flex items-center justify-center shrink-0">
                <FishGraphic id={selectedFish.id} size={36} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h5 className="text-[11px] font-black text-slate-950 truncate">{selectedFish.name}</h5>
                  <span
                    className="text-[7.5px] font-black px-1.5 py-0.2 border border-black"
                    style={{ backgroundColor: selectedFish.badgeBg }}
                  >
                    {selectedFish.rarity}
                  </span>
                </div>
                <p className="text-[8.5px] text-slate-700 leading-tight mt-0.5 line-clamp-2">{selectedFish.description}</p>
                <div className="flex gap-2 text-[8px] text-slate-600 font-bold mt-1">
                  <span>Bobot Alami: {selectedFish.minWeight}-{selectedFish.maxWeight} kg</span>
                  <span>|</span>
                  <span>Kesulitan: {selectedFish.difficulty}x</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFish(null)}
                className="bg-slate-300 hover:bg-slate-400 p-1 border border-black text-slate-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/* =========================================================================
   COMPONENTS: FISHING ODDS & PROBABILITY MODAL + ADMIN GOD MODE
   ========================================================================= */
const FishingOddsModal: React.FC<{
  equippedRod: string;
  equippedBait: string;
  weather: WeatherType;
  adminOdds: AdminOddsConfig;
  setAdminOdds: React.Dispatch<React.SetStateAction<AdminOddsConfig>>;
  setCoins?: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
  soundEnabled?: boolean;
}> = ({
  equippedRod,
  equippedBait,
  weather,
  adminOdds,
  setAdminOdds,
  setCoins,
  onClose,
  soundEnabled,
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser ? (currentUser.role === 'admin' || isAdminName(currentUser.username)) : false;
  const [activeTab, setActiveTab] = useState<'odds' | 'admin'>(isAdmin && adminOdds.enabled ? 'admin' : 'odds');

  const currentRod = RODS_DATABASE.find((r) => r.id === equippedRod) || RODS_DATABASE[0];
  const currentBait = BAITS_DATABASE.find((b) => b.id === equippedBait) || BAITS_DATABASE[0];
  const rates = calculateRarityRates(equippedRod, equippedBait, weather, adminOdds);

  const applyPreset = (preset: 'normal' | 'mythic50' | 'god100' | 'allLegend' | 'hardcore') => {
    playFishingSound('upgrade', soundEnabled);
    if (preset === 'normal') {
      setAdminOdds({ enabled: true, mythic: 0.005, legendary: 0.035, epic: 0.11, rare: 0.25, common: 0.60 });
    } else if (preset === 'mythic50') {
      setAdminOdds({ enabled: true, mythic: 0.50, legendary: 0.25, epic: 0.15, rare: 0.10, common: 0.00 });
    } else if (preset === 'god100') {
      setAdminOdds({ enabled: true, mythic: 1.00, legendary: 0.00, epic: 0.00, rare: 0.00, common: 0.00 });
    } else if (preset === 'allLegend') {
      setAdminOdds({ enabled: true, mythic: 0.20, legendary: 0.70, epic: 0.10, rare: 0.00, common: 0.00 });
    } else if (preset === 'hardcore') {
      setAdminOdds({ enabled: true, mythic: 0.001, legendary: 0.009, epic: 0.05, rare: 0.14, common: 0.80 });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-[320] p-3 sm:p-4 font-mono select-none"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bg-amber-100 border-[5px] border-black p-4 sm:p-6 w-full max-w-[520px] shadow-[10px_10px_0_0_#000] relative flex flex-col max-h-[88vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={() => {
            playFishingSound('click', soundEnabled);
            onClose();
          }}
          className="absolute top-3 right-3 bg-red-600 text-white border-[3px] border-black p-1 hover:bg-red-500 shadow-[2px_2px_0_0_#000] active:scale-95 cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between border-b-[3px] border-black pb-2.5 mb-3 pr-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 text-white border-[2px] border-black flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900">PROBABILITAS & ODDS</h2>
          </div>
          {adminOdds.enabled && (
            <span className="bg-amber-400 text-slate-950 text-[8.5px] font-black px-2 py-0.5 border border-black shadow-xs animate-pulse">
              👑 GOD MODE ON
            </span>
          )}
        </div>

        {/* Tab Switcher */}
        {isAdmin && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => {
                playFishingSound('click', soundEnabled);
                setActiveTab('odds');
              }}
              className={`flex-1 py-1.5 text-xs font-black border-[3px] border-black transition-all cursor-pointer ${
                activeTab === 'odds' ? 'bg-blue-600 text-white shadow-[2px_2px_0_0_#000]' : 'bg-white text-slate-700 hover:bg-amber-50'
              }`}
            >
              📊 STATUS SAAT INI
            </button>
            <button
              onClick={() => {
                playFishingSound('click', soundEnabled);
                setActiveTab('admin');
              }}
              className={`flex-1 py-1.5 text-xs font-black border-[3px] border-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'admin' ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-[2px_2px_0_0_#000]' : 'bg-amber-200 text-amber-950 hover:bg-amber-300'
              }`}
            >
              <Crown className="w-3.5 h-3.5 fill-slate-950" />
              <span>ADMIN GOD MODE</span>
            </button>
          </div>
        )}

        {activeTab === 'odds' ? (
          <>
            {/* Active Buffs */}
            <div className="bg-white border-[3px] border-black p-2.5 mb-3 space-y-1.5 text-[9.5px]">
              <div className="font-black text-slate-700 text-[10.5px] mb-1 flex items-center justify-between border-b border-black/10 pb-1">
                <span>BUFF & FAKTOR AKTIF:</span>
                <span className="text-slate-500 uppercase font-bold">Cuaca: {weather.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600">Joran: {currentRod.icon} {currentRod.name}</span>
                <span className="text-emerald-700 font-black">+{Math.round(currentRod.luckBonus * 100)}% Hoki</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600">Umpan: {currentBait.icon} {currentBait.name}</span>
                <span className="text-purple-700 font-black">+{Math.round(currentBait.mythicBonus * 100)}% Mitos</span>
              </div>
            </div>

            {/* Rates Visual Bars */}
            <div className="space-y-2 mb-3">
              {[
                { label: 'BIASA (Common)', rate: rates.common, color: 'bg-slate-400', border: 'border-black', text: 'text-slate-800' },
                { label: 'LANGKA (Rare)', rate: rates.rare, color: 'bg-blue-500', border: 'border-blue-700', text: 'text-blue-900' },
                { label: 'EPIC (Sangat Langka)', rate: rates.epic, color: 'bg-purple-500', border: 'border-purple-700', text: 'text-purple-900' },
                { label: '👑 LEGENDARIS', rate: rates.legendary, color: 'bg-amber-400', border: 'border-amber-600', text: 'text-amber-950' },
                { label: '⭐ MITOS / DEWA', rate: rates.mythic, color: 'bg-rose-500', border: 'border-rose-700', text: 'text-rose-950' },
              ].map((tier, idx) => (
                <div key={idx} className={`bg-white border-[2px] ${tier.border} p-2 flex flex-col gap-1 shadow-xs`}>
                  <div className="flex justify-between items-center text-[10px] font-black">
                    <span className={tier.text}>{tier.label}</span>
                    <span className="font-mono">{(tier.rate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-xs border border-black/20 overflow-hidden">
                    <div className={`h-full ${tier.color}`} style={{ width: `${Math.min(100, tier.rate * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[9px] text-slate-600 italic text-center">
              *Tingkatkan joran dan umpan di Toko untuk memperbesar peluang tangkapan dewa.
            </p>
          </>
        ) : (
          /* Admin God Mode */
          <div className="space-y-3">
            <div className="bg-slate-900 text-white border-[3px] border-amber-400 p-3 flex items-center justify-between shadow-md">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-yellow-300">
                  <Crown className="w-4 h-4 fill-yellow-300" />
                  <span>KONTROL ODDS KHUSUS ADMIN</span>
                </div>
                <p className="text-[9px] text-slate-300 mt-0.5">
                  {adminOdds.enabled ? 'Status: Kustom Odds AKTIF' : 'Status: Probabilitas Standar'}
                </p>
              </div>
              <button
                onClick={() => {
                  playFishingSound('click', soundEnabled);
                  setAdminOdds((prev) => ({ ...prev, enabled: !prev.enabled }));
                }}
                className={`px-3 py-1.5 text-xs font-black border-[2px] border-black transition-all cursor-pointer ${
                  adminOdds.enabled ? 'bg-emerald-500 text-slate-950 shadow-[2px_2px_0_0_#fff]' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {adminOdds.enabled ? '✓ AKTIF' : 'NONAKTIF'}
              </button>
            </div>

            {/* Presets */}
            <div className="bg-white border-[3px] border-black p-2.5 space-y-2">
              <div className="text-[10px] font-black text-slate-900 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>PRESET CEPAT:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[9px]">
                <button
                  onClick={() => applyPreset('god100')}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-black py-1.5 px-2 border-[2px] border-black cursor-pointer text-center"
                >
                  🌌 100% MITOS
                </button>
                <button
                  onClick={() => applyPreset('mythic50')}
                  className="bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black py-1.5 px-2 border-[2px] border-black cursor-pointer text-center"
                >
                  ⚡ 50% MITOS
                </button>
                <button
                  onClick={() => applyPreset('allLegend')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-1.5 px-2 border-[2px] border-black cursor-pointer text-center"
                >
                  👑 ALL-LEGEND
                </button>
                <button
                  onClick={() => applyPreset('normal')}
                  className="bg-sky-500 hover:bg-sky-400 text-white font-black py-1.5 px-2 border-[2px] border-black cursor-pointer text-center"
                >
                  🎲 NORMAL
                </button>
                <button
                  onClick={() => applyPreset('hardcore')}
                  className="bg-rose-900 hover:bg-rose-800 text-rose-100 font-black py-1.5 px-2 border-[2px] border-black cursor-pointer text-center"
                >
                  💀 HARDCORE
                </button>
                {setCoins && (
                  <button
                    onClick={() => {
                      playFishingSound('upgrade', soundEnabled);
                      setCoins((c) => c + 10000);
                    }}
                    className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-1.5 px-2 border-[2px] border-black cursor-pointer text-center"
                  >
                    🪙 +10K KOIN
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* =========================================================================
   COMPONENTS: FISHING SHOP MODAL (RODS & BAITS)
   ========================================================================= */
const FishingShopModal: React.FC<{
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  equippedRod: string;
  setEquippedRod: (id: string) => void;
  ownedRods: string[];
  setOwnedRods: React.Dispatch<React.SetStateAction<string[]>>;
  equippedBait: string;
  setEquippedBait: (id: string) => void;
  baitCounts: Record<string, number>;
  setBaitCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  soundEnabled?: boolean;
  onClose: () => void;
}> = ({
  coins,
  setCoins,
  equippedRod,
  setEquippedRod,
  ownedRods,
  setOwnedRods,
  equippedBait,
  setEquippedBait,
  baitCounts,
  setBaitCounts,
  soundEnabled,
  onClose,
}) => {
  const [tab, setTab] = useState<'rods' | 'baits'>('rods');

  const handleBuyRod = (rod: RodItem) => {
    if (coins < rod.price) return;
    playFishingSound('upgrade', soundEnabled);
    setCoins(c => c - rod.price);
    setOwnedRods(prev => [...prev, rod.id]);
    setEquippedRod(rod.id);
  };

  const handleBuyBait = (bait: BaitItem) => {
    if (coins < bait.price) return;
    playFishingSound('upgrade', soundEnabled);
    setCoins(c => c - bait.price);
    setBaitCounts(prev => ({
      ...prev,
      [bait.id]: (prev[bait.id] || 0) + 5,
    }));
    setEquippedBait(bait.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-[320] p-3 sm:p-4 font-mono select-none"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bg-amber-100 border-[5px] border-black p-4 sm:p-6 w-full max-w-[580px] shadow-[10px_10px_0_0_#000] relative flex flex-col max-h-[88vh]">
        <button
          onClick={() => {
            playFishingSound('click', soundEnabled);
            onClose();
          }}
          className="absolute top-3 right-3 bg-red-600 text-white border-[3px] border-black p-1 hover:bg-red-500 shadow-[2px_2px_0_0_#000] active:scale-95 z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between border-b-[3px] border-black pb-2.5 mb-3 pr-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-400 border-[2px] border-black flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-4 h-4 text-slate-950" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900">TOKO ALAT PANCING</h2>
          </div>
          <div className="bg-amber-300 border-[2px] border-black px-2.5 py-1 flex items-center gap-1 font-black text-xs text-amber-950 shadow-xs">
            <span>🪙 {coins}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => {
              playFishingSound('click', soundEnabled);
              setTab('rods');
            }}
            className={`flex-1 py-2 text-xs font-black border-[3px] border-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'rods' ? 'bg-amber-400 text-slate-900 shadow-[3px_3px_0_0_#000]' : 'bg-white text-slate-600 hover:bg-amber-50'
            }`}
          >
            <span>🎣</span> <span>JORAN PANCING</span>
          </button>
          <button
            onClick={() => {
              playFishingSound('click', soundEnabled);
              setTab('baits');
            }}
            className={`flex-1 py-2 text-xs font-black border-[3px] border-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'baits' ? 'bg-amber-400 text-slate-900 shadow-[3px_3px_0_0_#000]' : 'bg-white text-slate-600 hover:bg-amber-50'
            }`}
          >
            <span>🪱</span> <span>UMPAN IKAN</span>
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 custom-scrollbar">
          {tab === 'rods' ? (
            RODS_DATABASE.map(rod => {
              const isOwned = ownedRods.includes(rod.id);
              const isEquipped = equippedRod === rod.id;
              const canAfford = coins >= rod.price;

              return (
                <div
                  key={rod.id}
                  className={`bg-white border-[3px] border-black p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                    isEquipped ? 'ring-2 ring-blue-600 bg-blue-50/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 border-[2px] border-black flex items-center justify-center text-2xl shrink-0 shadow-xs"
                      style={{ backgroundColor: rod.color + '25' }}
                    >
                      {rod.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900">{rod.name}</h4>
                        {isEquipped && (
                          <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 border border-black">
                            DIPAKAI
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-slate-600 mt-0.5 leading-snug">{rod.description}</p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    {!isOwned && (
                      <span className="text-xs font-black text-amber-800">🪙 {rod.price}</span>
                    )}

                    {isEquipped ? (
                      <button
                        disabled
                        className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1.5 border-[2px] border-black opacity-90 cursor-default"
                      >
                        ✓ DIGUNAKAN
                      </button>
                    ) : isOwned ? (
                      <button
                        onClick={() => {
                          playFishingSound('click', soundEnabled);
                          setEquippedRod(rod.id);
                        }}
                        className="bg-sky-400 hover:bg-sky-300 text-slate-900 text-[10px] font-black px-3 py-1.5 border-[2px] border-black shadow-[2px_2px_0_0_#000] active:scale-95 cursor-pointer"
                      >
                        GUNAKAN
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyRod(rod)}
                        disabled={!canAfford}
                        className={`text-[10px] font-black px-3 py-1.5 border-[2px] border-black shadow-[2px_2px_0_0_#000] active:scale-95 cursor-pointer ${
                          canAfford
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        }`}
                      >
                        BELI
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            BAITS_DATABASE.map(bait => {
              const isEquipped = equippedBait === bait.id;
              const count = bait.id === 'worm' ? '∞' : (baitCounts[bait.id] || 0);
              const canAfford = coins >= bait.price;

              return (
                <div
                  key={bait.id}
                  className={`bg-white border-[3px] border-black p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                    isEquipped ? 'ring-2 ring-purple-600 bg-purple-50/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-50 border-[2px] border-black flex items-center justify-center text-2xl shrink-0 shadow-xs">
                      {bait.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900">{bait.name}</h4>
                        {isEquipped && (
                          <span className="bg-purple-600 text-white text-[8px] font-black px-1.5 py-0.5 border border-black">
                            AKTIF
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-slate-600 mt-0.5 leading-snug">{bait.description}</p>
                      <div className="text-[9px] font-bold text-slate-500 mt-1">
                        Stok: <span className="text-blue-700 font-black">{count}</span> {bait.id !== 'worm' ? 'biji' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    {bait.price > 0 && (
                      <span className="text-xs font-black text-amber-800">🪙 {bait.price} / 5x</span>
                    )}

                    <div className="flex gap-1.5">
                      {bait.price > 0 && (
                        <button
                          onClick={() => handleBuyBait(bait)}
                          disabled={!canAfford}
                          className={`text-[10px] font-black px-2.5 py-1.5 border-[2px] border-black shadow-[2px_2px_0_0_#000] active:scale-95 cursor-pointer ${
                            canAfford
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          }`}
                        >
                          BELI (5x)
                        </button>
                      )}

                      {!isEquipped ? (
                        <button
                          onClick={() => {
                            playFishingSound('click', soundEnabled);
                            setEquippedBait(bait.id);
                          }}
                          disabled={bait.id !== 'worm' && (baitCounts[bait.id] || 0) <= 0}
                          className="bg-sky-400 hover:bg-sky-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-slate-900 text-[10px] font-black px-2.5 py-1.5 border-[2px] border-black shadow-[2px_2px_0_0_#000] active:scale-95 cursor-pointer"
                        >
                          PAKAI
                        </button>
                      ) : (
                        <button
                          disabled
                          className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-1.5 border-[2px] border-black opacity-90 cursor-default"
                        >
                          ✓ AKTIF
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* =========================================================================
   JAKARTA TIME FORMATTER HELPER
   ========================================================================= */
const getJakartaTimeInfo = () => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '12', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const second = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10);
    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

    const naturalTimeOfDay: TimeOfDay =
      hour >= 5 && hour < 11
        ? 'pagi'
        : hour >= 11 && hour < 15
        ? 'siang'
        : hour >= 15 && hour < 18
        ? 'senja'
        : 'malam';

    return { hour, minute, second, timeString, naturalTimeOfDay };
  } catch (e) {
    const now = new Date();
    const jktHour = (now.getUTCHours() + 7) % 24;
    const naturalTimeOfDay: TimeOfDay =
      jktHour >= 5 && jktHour < 11
        ? 'pagi'
        : jktHour >= 11 && jktHour < 15
        ? 'siang'
        : jktHour >= 15 && jktHour < 18
        ? 'senja'
        : 'malam';
    return {
      hour: jktHour,
      minute: now.getUTCMinutes(),
      second: now.getUTCSeconds(),
      timeString: `${String(jktHour).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`,
      naturalTimeOfDay,
    };
  }
};

/* =========================================================================
   MAIN COMPONENT: FISHING GAME SECTION
   ========================================================================= */
export const FishingGameSection: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = currentUser ? (currentUser.role === 'admin' || isAdminName(currentUser.username)) : false;

  const [gameState, setGameState] = useState<GameState>('idle');
  const [power, setPower] = useState(0);
  const [reelProgress, setReelProgress] = useState(0);
  const [fish, setFish] = useState<FishType | null>(null);
  const currentFishRef = useRef<FishType | null>(null);
  const [fishStats, setFishStats] = useState<{ weight: string; length: string } | null>(null);
  const [bobberPos, setBobberPos] = useState({ x: 400, y: 380 });
  const [castProgress, setCastProgress] = useState(0);
  const [escapeReason, setEscapeReason] = useState<'early' | 'missed' | 'failed' | null>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(50);
  const [caughtCount, setCaughtCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isPerfectCast, setIsPerfectCast] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [splashes, setSplashes] = useState<{ id: string; x: number; y: number }[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [discoveredSpecies, setDiscoveredSpecies] = useState<string[]>([]);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isOddsOpen, setIsOddsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [caughtActionUnlocked, setCaughtActionUnlocked] = useState(false);
  const [sellConfirmation, setSellConfirmation] = useState(false);
  const [flashScreen, setFlashScreen] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<{ id: number; emoji: string; x: number; y: number; delay: number; speed: number; scale: number }[]>([]);

  // Realtime Jakarta (WIB - UTC+7) & Dynamic Weather Engine
  const [jakartaClock, setJakartaClock] = useState(() => getJakartaTimeInfo());
  const [isRealtimeJakarta, setIsRealtimeJakarta] = useState<boolean>(true);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => getJakartaTimeInfo().naturalTimeOfDay);
  const [weather, setWeather] = useState<WeatherType>('cerah');
  const [isAutoWeather, setIsAutoWeather] = useState<boolean>(true);

  // Admin Custom Odds configuration
  const [adminOdds, setAdminOdds] = useState<AdminOddsConfig>(() => {
    try {
      const saved = localStorage.getItem('admin_fishing_odds_override');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { enabled: false, mythic: 0.005, legendary: 0.035, epic: 0.11, rare: 0.25, common: 0.60 };
  });

  // Save admin odds override
  useEffect(() => {
    try {
      localStorage.setItem('admin_fishing_odds_override', JSON.stringify(adminOdds));
    } catch (e) {}
  }, [adminOdds]);

  // Realtime Jakarta Clock interval (1s)
  useEffect(() => {
    const timer = setInterval(() => {
      const info = getJakartaTimeInfo();
      setJakartaClock(info);
      if (isRealtimeJakarta) {
        setTimeOfDay(info.naturalTimeOfDay);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isRealtimeJakarta]);

  // Dynamic Weather Engine cycle
  useEffect(() => {
    if (!isAutoWeather) return;

    const pickRandomWeather = (): WeatherType => {
      const r = Math.random();
      if (r < 0.38) return 'cerah';
      if (r < 0.62) return 'berawan';
      if (r < 0.78) return 'hujan';
      if (r < 0.90) return 'badai';
      return 'kabut_mistis';
    };

    const interval = setInterval(() => {
      const nextW = pickRandomWeather();
      setWeather(nextW);
      if (nextW === 'badai') {
        playFishingSound('bite', soundEnabled);
        triggerFloatingText('⚡ BADAI PETIR! (+25% LANGKA/MITOS)', 400, 260, '#38bdf8');
      } else if (nextW === 'kabut_mistis') {
        playFishingSound('perfect', soundEnabled);
        triggerFloatingText('🌫️ KABUT MISTIS! (+50% MITOS DEWA)', 400, 260, '#c084fc');
      } else if (nextW === 'hujan') {
        triggerFloatingText('🌧️ HUJAN TIBA! (+10% EPIC)', 400, 260, '#60a5fa');
      }
    }, 70000);

    return () => clearInterval(interval);
  }, [isAutoWeather, soundEnabled]);

  // Equipment & Inventory
  const [equippedRod, setEquippedRod] = useState('bamboo');
  const [ownedRods, setOwnedRods] = useState<string[]>(['bamboo']);
  const [equippedBait, setEquippedBait] = useState('worm');
  const [baitCounts, setBaitCounts] = useState<Record<string, number>>({ pellet: 5, shrimp: 2, star: 0, nectar: 0 });
  const [activeUser, setActiveUser] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    if (currentUser) {
      const savedData = localStorage.getItem(`fishing_data_${currentUser.username}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setScore(parsed.score || 0);
          setCoins(parsed.coins !== undefined ? parsed.coins : 50);
          setCaughtCount(parsed.caughtCount || 0);
          setDiscoveredSpecies(parsed.discoveredSpecies || []);
          setEquippedRod(parsed.equippedRod || 'bamboo');
          setOwnedRods(parsed.ownedRods || ['bamboo']);
          setEquippedBait(parsed.equippedBait || 'worm');
          setBaitCounts(parsed.baitCounts || { pellet: 5, shrimp: 2, star: 0, nectar: 0 });
        } catch (e) {
          console.error("Failed to parse fishing data", e);
        }
      } else {
        setScore(0);
        setCoins(50);
        setCaughtCount(0);
        setDiscoveredSpecies([]);
        setEquippedRod('bamboo');
        setOwnedRods(['bamboo']);
        setEquippedBait('worm');
        setBaitCounts({ pellet: 5, shrimp: 2, star: 0, nectar: 0 });
      }
      setActiveUser(currentUser.username);
    } else {
      setScore(0);
      setCoins(50);
      setCaughtCount(0);
      setDiscoveredSpecies([]);
      setEquippedRod('bamboo');
      setOwnedRods(['bamboo']);
      setEquippedBait('worm');
      setBaitCounts({ pellet: 5, shrimp: 2, star: 0, nectar: 0 });
      setActiveUser(null);
    }
  }, [currentUser]);

  // Save user data
  useEffect(() => {
    if (currentUser && activeUser === currentUser.username) {
      const dataToSave = {
        score,
        coins,
        caughtCount,
        discoveredSpecies,
        equippedRod,
        ownedRods,
        equippedBait,
        baitCounts,
      };
      localStorage.setItem(`fishing_data_${currentUser.username}`, JSON.stringify(dataToSave));
    }
  }, [score, coins, caughtCount, discoveredSpecies, equippedRod, ownedRods, equippedBait, baitCounts, currentUser, activeUser]);

  const waterHeight = Math.max(260, Math.floor(canvasHeight * 0.45));
  const waterSurfaceY = canvasHeight - waterHeight + 10;

  // Exact trigonometric calculation for rod tip position in 800xcanvasHeight coordinates
  const getRodTipPos = (angleDeg: number) => {
    const pivotX = 129;
    const pivotY = canvasHeight - waterHeight - 35;
    const radius = 211.6837;
    const baseAngleRad = -0.0804; // Math.atan2(-17, 211) ≈ -4.6067 deg
    const angleRad = (angleDeg * Math.PI) / 180 + baseAngleRad;
    return {
      x: pivotX + radius * Math.cos(angleRad),
      y: pivotY + radius * Math.sin(angleRad),
    };
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>;
    
    const calculateScale = () => {
      const padding = isFullscreen ? 0 : 12;
      const availableWidth = Math.max(280, window.innerWidth - padding);
      const availableHeight = Math.max(200, window.innerHeight - padding);
      const sw = availableWidth / 800;
      const sh = availableHeight / 600;
      const s = Math.min(sw, sh);

      setScale({ x: s, y: s });

      if (sw < sh) {
        setCanvasHeight(Math.max(600, availableHeight / sw));
      } else {
        setCanvasHeight(600);
      }
    };

    const handleResize = () => {
      clearTimeout(resizeTimer);
      // Debounce window resize to prevent cascading re-renders
      resizeTimer = setTimeout(calculateScale, 60);
    };

    window.addEventListener('resize', handleResize);
    calculateScale(); // Initial call
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen API failed', err);
    }
  };

  const triggerFloatingText = (text: string, x: number, y: number, color = '#facc15') => {
    const id = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    setFloatingTexts(prev => [...prev, { id, text, x, y, color }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(item => item.id !== id));
    }, 1200);
  };

  const containerRef = useRef<HTMLElement>(null);
  const gameCanvasRef = useRef<HTMLDivElement>(null);
  const rodTipRef = useRef<HTMLDivElement>(null);

  const powerRef = useRef(0);
  const powerDirRef = useRef(1);
  const reqRef = useRef<number>(0);
  const reelProgressRef = useRef(0);
  const targetBobberXRef = useRef(400);

  const biteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const escapeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playSound = (type: FishingSoundType) => {
    playFishingSound(type, soundEnabled);
  };

  useEffect(() => {
    return () => {
      if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);
      if (escapeTimeoutRef.current) clearTimeout(escapeTimeoutRef.current);
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, []);

  const triggerSplash = (x: number, y: number) => {
    const id = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    setSplashes(s => [...s, { id, x, y }]);
    setTimeout(() => {
      setSplashes(s => s.filter(p => p.id !== id));
    }, 600);
  };

  const startPreparing = () => {
    setHasStarted(true);
    setGameState('preparing');
    setPower(0);
    powerRef.current = 0;
    powerDirRef.current = 1;
    setReelProgress(0);
    reelProgressRef.current = 0;
    setFish(null);
    setFishStats(null);
    setEscapeReason(null);

    let holdFrames = 0;

    const animatePower = () => {
      if (holdFrames > 0) {
        holdFrames--;
        reqRef.current = requestAnimationFrame(animatePower);
        return;
      }

      powerRef.current += 1.85 * powerDirRef.current;
      if (powerRef.current >= 100) {
        powerRef.current = 100;
        powerDirRef.current = -1;
        holdFrames = 7;
      } else if (powerRef.current <= 0) {
        powerRef.current = 0;
        powerDirRef.current = 1;
        holdFrames = 3;
      }
      setPower(powerRef.current);
      reqRef.current = requestAnimationFrame(animatePower);
    };
    reqRef.current = requestAnimationFrame(animatePower);
  };

  const castLine = () => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    playSound('cast');

    const perfect = power >= 80 && power <= 95;
    setIsPerfectCast(perfect);

    const targetX = 350 + (power / 100) * 380;
    targetBobberXRef.current = targetX;

    setGameState('casting');
    let progress = 0;

    const startPos = getRodTipPos(-20);
    const startX = startPos.x;
    const startY = startPos.y;

    const animateCast = () => {
      progress += 0.045;
      setCastProgress(progress);

      const currentX = startX + (targetX - startX) * progress;
      const peakY = Math.min(startY - 140, startY - (targetX - startX) * 0.4);
      const currentY = (1 - progress) * (1 - progress) * startY + 2 * (1 - progress) * progress * peakY + progress * progress * waterSurfaceY;

      setBobberPos({ x: currentX, y: currentY });

      if (progress < 1) {
        reqRef.current = requestAnimationFrame(animateCast);
      } else {
        setBobberPos({ x: targetX, y: waterSurfaceY });
        playSound('splash');
        triggerSplash(targetX, waterSurfaceY);

        if (perfect) {
          playSound('perfect');
          triggerFloatingText('PERFECT CAST! ⭐', targetX, waterSurfaceY - 40, '#facc15');
        }

        setGameState('waiting');

        const activeBait = BAITS_DATABASE.find(b => b.id === equippedBait) || BAITS_DATABASE[0];
        const baitWaitFactor = Math.max(0.35, 1 - activeBait.biteSpeedBonus * 0.55);
        const weatherWaitFactor = (weather === 'badai' || weather === 'kabut_mistis') ? 0.82 : weather === 'hujan' ? 0.90 : 1.0;
        const perfectCastFactor = perfect ? 0.78 : 1.0;

        const randomBaseWait = Math.random() * 4200 + 1200;
        const waitTime = randomBaseWait * baitWaitFactor * weatherWaitFactor * perfectCastFactor;

        biteTimeoutRef.current = setTimeout(() => {
          setGameState(prev => {
            if (prev === 'waiting') {
              playSound('bite');
              triggerSplash(targetX, waterSurfaceY);

              const reactionWindow = Math.floor(Math.random() * 550 + 950);

              escapeTimeoutRef.current = setTimeout(() => {
                setGameState(curr => {
                  if (curr === 'biting') {
                    playSound('escape');
                    setEscapeReason('missed');
                    setCombo(0);
                    return 'escaped';
                  }
                  return curr;
                });
              }, reactionWindow);
              return 'biting';
            }
            return prev;
          });
        }, waitTime);
      }
    };

    reqRef.current = requestAnimationFrame(animateCast);
  };

  const handlePointerDown = () => {
    unlockAudio();
    if (gameState === 'idle') {
      startPreparing();
    } else if (gameState === 'waiting') {
      if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);
      if (escapeTimeoutRef.current) clearTimeout(escapeTimeoutRef.current);
      playSound('escape');
      setEscapeReason('early');
      setCombo(0);
      setGameState('escaped');
    } else if (gameState === 'biting') {
      if (escapeTimeoutRef.current) clearTimeout(escapeTimeoutRef.current);
      playSound('tap');

      const randomFish = getRandomFish(equippedRod, equippedBait, weather, adminOdds);
      currentFishRef.current = randomFish;

      if (equippedBait !== 'worm') {
        setBaitCounts(prev => {
          const nextCount = Math.max(0, (prev[equippedBait] || 0) - 1);
          if (nextCount === 0) {
            setEquippedBait('worm');
          }
          return { ...prev, [equippedBait]: nextCount };
        });
      }

      if (randomFish.rarity === 'Mitos' || randomFish.rarity === 'Legendaris') {
        setIsScreenShaking(true);
        setTimeout(() => setIsScreenShaking(false), 500);
      }

      const weightVal = (Math.random() * (randomFish.maxWeight - randomFish.minWeight) + randomFish.minWeight).toFixed(2);
      const lengthVal = (parseFloat(weightVal) * 11 + Math.random() * 6 + 6).toFixed(1);

      setFish(randomFish);
      setFishStats({ weight: weightVal, length: lengthVal });
      setGameState('reeling');
      reelProgressRef.current = 35;
      setReelProgress(35);
    } else if (gameState === 'reeling') {
      playSound('reeling');
      triggerSplash(bobberPos.x, bobberPos.y);

      const currentRod = RODS_DATABASE.find(r => r.id === equippedRod) || RODS_DATABASE[0];
      const tapVariance = 1 + (Math.random() * 0.40 - 0.15);
      const pullIncrement = 15 * (1 + currentRod.reelSpeedBonus) * tapVariance;
      reelProgressRef.current += pullIncrement;

      if (reelProgressRef.current >= 100) {
        reelProgressRef.current = 100;
        const caughtFish = currentFishRef.current;

        setFlashScreen(true);
        setTimeout(() => setFlashScreen(false), 250);

        setCaughtActionUnlocked(false);
        setSellConfirmation(false);

        const particleCount = caughtFish?.rarity === 'Mitos' ? 45 : caughtFish?.rarity === 'Legendaris' ? 30 : 18;
        const emojis = caughtFish?.rarity === 'Mitos'
          ? ['✨', '⭐', '💫', '💎', '👑', '🌟', '🔥', '⚡', '🎆']
          : caughtFish?.rarity === 'Legendaris'
          ? ['👑', '⭐', '✨', '🏆', '💎', '🌟']
          : ['✨', '⭐', '🎉', '🐟'];

        const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
          id: i,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
          x: Math.random() * 700 + 50,
          y: Math.random() * 500 + 50,
          delay: Math.random() * 0.4,
          speed: Math.random() * 1.5 + 1.2,
          scale: Math.random() * 0.8 + 0.8,
        }));
        setConfettiParticles(newParticles);

        if (caughtFish?.rarity === 'Mitos') {
          playSound('mythic_fanfare');
          setIsScreenShaking(true);
          setTimeout(() => setIsScreenShaking(false), 1400);
        } else if (caughtFish?.rarity === 'Legendaris') {
          playSound('legendary');
          setIsScreenShaking(true);
          setTimeout(() => setIsScreenShaking(false), 900);
        } else {
          playSound('caught');
        }

        const unlockDelay = caughtFish?.rarity === 'Mitos' ? 2000 : caughtFish?.rarity === 'Legendaris' ? 1400 : 800;
        setTimeout(() => {
          setCaughtActionUnlocked(true);
        }, unlockDelay);

        const basePts = caughtFish?.points || 100;
        const comboBonus = combo * 25;
        const perfectBonus = isPerfectCast ? 50 : 0;
        const totalPts = basePts + comboBonus + perfectBonus;

        const coinMultiplier = equippedRod === 'cosmic' ? 2.0 : equippedRod === 'gold' ? 1.5 : 1.0;
        const earnedCoins = Math.round((caughtFish?.coins || 20) * coinMultiplier);

        setScore(s => s + totalPts);
        setCoins(c => c + earnedCoins);
        setCaughtCount(c => c + 1);
        setCombo(c => c + 1);

        if (caughtFish) {
          setDiscoveredSpecies(prev => prev.includes(caughtFish.id) ? prev : [...prev, caughtFish.id]);
        }
        triggerFloatingText(`+${totalPts} PTS!`, bobberPos.x, bobberPos.y - 60, '#34d399');
        triggerFloatingText(`+${earnedCoins} 🪙`, bobberPos.x + 30, bobberPos.y - 40, '#facc15');
        setGameState('caught');
      }
      setReelProgress(reelProgressRef.current);

      const targetX = targetBobberXRef.current;
      const newBobberX = targetX - (reelProgressRef.current / 100) * (targetX - 250);
      setBobberPos({ x: Math.max(250, newBobberX), y: waterSurfaceY });
    }
  };

  const handlePointerUp = () => {
    if (gameState === 'preparing') {
      castLine();
    }
  };

  // Reeling decay physics
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === 'reeling' && fish) {
      const currentRod = RODS_DATABASE.find(r => r.id === equippedRod) || RODS_DATABASE[0];
      const rarityMultiplier = fish.rarity === 'Mitos' ? 1.55 : fish.rarity === 'Legendaris' ? 1.35 : fish.rarity === 'Sangat Langka' ? 1.20 : 1.0;

      interval = setInterval(() => {
        const timeVal = Date.now() / 320;
        const surgeFactor = 1 + Math.sin(timeVal) * 0.45 + (Math.random() * 0.35 - 0.15);
        const dynamicDecayRate = Math.max(0.40, (fish.difficulty * 1.30 * rarityMultiplier * surgeFactor) * (1 - currentRod.strengthBonus * 0.45));

        reelProgressRef.current -= dynamicDecayRate;
        if (reelProgressRef.current <= 0) {
          reelProgressRef.current = 0;
          playSound('escape');
          setEscapeReason('failed');
          setGameState('escaped');
        }
        setReelProgress(reelProgressRef.current);

        const targetX = targetBobberXRef.current;
        const newBobberX = targetX - (reelProgressRef.current / 100) * (targetX - 250);
        setBobberPos({ x: Math.max(250, newBobberX), y: waterSurfaceY });
      }, 42);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState, fish, equippedRod]);

  let rodAngleDeg = -12;
  if (gameState === 'idle') rodAngleDeg = -15;
  else if (gameState === 'preparing') rodAngleDeg = -62;
  else if (gameState === 'casting') rodAngleDeg = -20 + castProgress * 40;
  else if (gameState === 'biting') rodAngleDeg = -5;
  else if (gameState === 'reeling') rodAngleDeg = -30;
  else rodAngleDeg = -22;

  const rodTipPos = getRodTipPos(rodAngleDeg);

  const currentEquippedRodItem = React.useMemo(() => 
    RODS_DATABASE.find(r => r.id === equippedRod) || RODS_DATABASE[0], 
  [equippedRod]);
  
  const currentEquippedBaitItem = React.useMemo(() => 
    BAITS_DATABASE.find(b => b.id === equippedBait) || BAITS_DATABASE[0], 
  [equippedBait]);

  return (
    <section
      id="fishing"
      className="relative w-full h-[100dvh] z-[100] bg-slate-950 flex items-center justify-center select-none touch-none font-mono overflow-hidden"
      style={{
        fontFamily: '"Press Start 2P", monospace',
        imageRendering: 'pixelated',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
      ref={containerRef}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

          #fishing, #fishing * {
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            user-select: none !important;
            -webkit-user-drag: none !important;
          }

          @keyframes waterWave {
            0% { transform: translateX(0); }
            100% { transform: translateX(-32px); }
          }
          @keyframes kelpSway {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(7deg); }
          }
          @keyframes floatBubble {
            0% { transform: translateY(0) scale(0.8); opacity: 0.8; }
            100% { transform: translateY(-130px) scale(1.3); opacity: 0; }
          }
          @keyframes fishSwimLeft {
            0% { transform: translateX(820px) scaleX(1); }
            100% { transform: translateX(-100px) scaleX(1); }
          }
          @keyframes rodVibrate {
            0%, 100% { transform: rotate(-30deg); }
            50% { transform: rotate(-26deg); }
          }
          @keyframes bobberGentleFloat {
            0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
            50% { transform: translate(-50%, -50%) translateY(4px); }
          }
          @keyframes shake {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            20% { transform: translate(-4px, 4px) rotate(-1deg); }
            40% { transform: translate(4px, -3px) rotate(1deg); }
            60% { transform: translate(-3px, -2px) rotate(-1deg); }
            80% { transform: translate(3px, 3px) rotate(1deg); }
          }
          @keyframes rainFall {
            0% { transform: translateY(-100px) translateX(0); }
            100% { transform: translateY(700px) translateX(-150px); }
          }
          @keyframes particleFloatUp {
            0% { transform: translateY(0) scale(0.6); opacity: 0; }
            25% { opacity: 1; transform: translateY(-30px) scale(1.2); }
            100% { transform: translateY(-160px) scale(0.4); opacity: 0; }
          }
          @keyframes shockwaveExpand {
            0% { transform: scale(0.6); opacity: 0.9; }
            100% { transform: scale(2.6); opacity: 0; }
          }
          @keyframes reelSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes divineRing {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .animate-water { animation: waterWave 1.8s linear infinite; }
          .animate-kelp { animation: kelpSway 3.2s ease-in-out infinite; transform-origin: bottom center; }
          .animate-rod-vibrate { animation: rodVibrate 0.08s infinite; }
          .animate-bobber-float { animation: bobberGentleFloat 1.8s ease-in-out infinite; }
          .animate-particle-float { animation: particleFloatUp 2s ease-out infinite; }
          .animate-shockwave { animation: shockwaveExpand 1.6s ease-out infinite; }
          .animate-reel-spin { animation: reelSpin 0.35s linear infinite; }
        `}
      </style>

      {/* ================= TOP ARCADE HUD & CONTROL DECK ================= */}
      <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {/* Row 1: Primary Navigation, Live Jakarta Time & Control Cluster */}
        <div className="flex justify-between items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Left: Home / Back & Live Jakarta Clock */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => {
                playSound('click');
                navigate('/');
              }}
              className="bg-amber-300 hover:bg-amber-200 text-slate-950 border-[3px] border-black px-3 py-1.5 flex items-center gap-1.5 shadow-[3px_3px_0_0_#000] active:translate-y-0.5 cursor-pointer font-black text-[9px] sm:text-[10px]"
              title="Kembali ke Portofolio Utama"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>HOME</span>
            </button>

            {/* Jakarta Live Clock Pill */}
            <button
              onClick={() => {
                playSound('click');
                setIsRealtimeJakarta(!isRealtimeJakarta);
                if (!isRealtimeJakarta) {
                  setTimeOfDay(jakartaClock.naturalTimeOfDay);
                  triggerFloatingText('📍 AUTO WAKTU JAKARTA AKTIF', 400, 200, '#38bdf8');
                } else {
                  triggerFloatingText('MANUAL WAKTU AKTIF', 400, 200, '#facc15');
                }
              }}
              className={`border-[3px] border-black px-2.5 py-1 flex items-center gap-1.5 shadow-[3px_3px_0_0_#000] transition-all cursor-pointer ${
                isRealtimeJakarta
                  ? 'bg-sky-200 text-slate-950'
                  : 'bg-amber-100 text-slate-700 hover:bg-amber-200'
              }`}
              title="Toggle Auto Waktu Realtime Jakarta / Manual"
            >
              <Compass className="w-3.5 h-3.5 text-blue-900 animate-spin" style={{ animationDuration: '12s' }} />
              <div className="flex flex-col text-left leading-none">
                <span className="text-[8.5px] sm:text-[9px] font-black text-slate-900">
                  {jakartaClock.timeString} <span className="text-[7.5px] text-blue-900">WIB</span>
                </span>
                <span className="text-[7px] text-slate-600 font-bold uppercase mt-0.5">
                  {isRealtimeJakarta ? `AUTO • ${timeOfDay}` : `MANUAL • ${timeOfDay}`}
                </span>
              </div>
            </button>
          </div>

          {/* Right: Arcade Control Deck */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            {/* Coins Counter */}
            <button
              onClick={() => {
                playSound('click');
                setIsShopOpen(true);
              }}
              className="bg-amber-300 hover:bg-amber-200 text-slate-950 border-[3px] border-black px-2.5 py-1.5 flex items-center gap-1 shadow-[3px_3px_0_0_#000] active:translate-y-0.5 cursor-pointer font-black text-[9px] sm:text-[10px]"
              title="Buka Toko Alat Pancing"
            >
              <Coins className="w-3.5 h-3.5 text-amber-900" />
              <span>{coins}</span>
            </button>

            {/* Shop Button */}
            <button
              onClick={() => {
                playSound('click');
                setIsShopOpen(true);
              }}
              className="bg-amber-100 hover:bg-amber-200 text-slate-950 border-[3px] border-black p-1.5 shadow-[3px_3px_0_0_#000] active:translate-y-0.5 cursor-pointer"
              title="Toko Joran & Umpan"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-900" />
            </button>

            {/* Species Journal */}
            <button
              onClick={() => {
                playFishingSound('page', soundEnabled);
                setIsJournalOpen(true);
              }}
              className="bg-amber-100 hover:bg-amber-200 text-slate-950 border-[3px] border-black p-1.5 shadow-[3px_3px_0_0_#000] active:translate-y-0.5 cursor-pointer relative"
              title="Jurnal Ikan"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-800" />
              {discoveredSpecies.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[7px] font-black px-1 rounded-full border border-black">
                  {discoveredSpecies.length}
                </span>
              )}
            </button>

            {/* Odds Button */}
            <button
              onClick={() => {
                playSound('click');
                setIsOddsOpen(true);
              }}
              className={`border-[3px] border-black p-1.5 shadow-[3px_3px_0_0_#000] active:translate-y-0.5 cursor-pointer ${
                adminOdds.enabled && isAdmin ? 'bg-amber-400 text-slate-950 ring-2 ring-yellow-400 animate-pulse' : 'bg-amber-100 hover:bg-amber-200 text-slate-950'
              }`}
              title="Peluang Ikan (Drop Rates)"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-700" />
            </button>

            {/* Weather Switcher */}
            <button
              onClick={() => {
                playSound('click');
                const weathers: WeatherType[] = ['cerah', 'berawan', 'hujan', 'badai', 'kabut_mistis'];
                const nextIdx = (weathers.indexOf(weather) + 1) % weathers.length;
                const nextW = weathers[nextIdx];
                setWeather(nextW);
                setIsAutoWeather(false);
                triggerFloatingText(`CUACA: ${nextW.toUpperCase()}`, 400, 200, '#38bdf8');
              }}
              className="bg-amber-100 hover:bg-amber-200 text-slate-950 border-[3px] border-black px-2 py-1.5 shadow-[3px_3px_0_0_#000] active:translate-y-0.5 cursor-pointer text-xs flex items-center gap-1"
              title="Ganti Cuaca Samudra"
            >
              <span>
                {weather === 'cerah' && '☀️'}
                {weather === 'berawan' && '⛅'}
                {weather === 'hujan' && '🌧️'}
                {weather === 'badai' && '⛈️'}
                {weather === 'kabut_mistis' && '🌫️'}
              </span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => {
                if (!soundEnabled) playFishingSound('click', true);
                setSoundEnabled(!soundEnabled);
              }}
              className="bg-amber-100 hover:bg-amber-200 text-slate-950 border-[3px] border-black p-1.5 shadow-[3px_3px_0_0_#000] active:translate-y-0.5 cursor-pointer"
              title="Toggle Suara"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-slate-900" /> : <VolumeX className="w-3.5 h-3.5 text-red-600" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => {
                playSound('click');
                toggleFullscreen();
              }}
              className="bg-amber-100 hover:bg-amber-200 text-slate-950 border-[3px] border-black p-1.5 shadow-[3px_3px_0_0_#000] active:translate-y-0.5 cursor-pointer hidden sm:block"
              title={isFullscreen ? "Keluar Fullscreen" : "Layar Penuh"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Row 2: Live Telemetry Bar (Score, Fish, Rod & Bait, Combo) */}
        <div className="flex justify-end pointer-events-auto">
          <div className="bg-amber-100 text-slate-950 border-[3px] border-black px-3 py-1.5 flex items-center gap-2 sm:gap-3 shadow-[3px_3px_0_0_#000] text-[8.5px] sm:text-[9.5px] font-black flex-wrap">
            <div className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>PTS: <strong className="text-blue-700">{score}</strong></span>
            </div>
            <span className="text-slate-400">|</span>
            <div>
              <span>IKAN: <strong className="text-emerald-700">{caughtCount}</strong></span>
            </div>
            <span className="text-slate-400">|</span>
            <div className="flex items-center gap-1 text-slate-800">
              <span>{currentEquippedRodItem.icon}</span>
              <span className="hidden sm:inline">{currentEquippedRodItem.name.split(' ')[1]}</span>
            </div>
            <span className="text-slate-400">|</span>
            <div className="flex items-center gap-1 text-purple-800">
              <span>{currentEquippedBaitItem.icon}</span>
              <span>{equippedBait !== 'worm' ? `(${baitCounts[equippedBait] || 0})` : '∞'}</span>
            </div>
            {combo > 1 && (
              <>
                <span className="text-slate-400">|</span>
                <span className="text-rose-600 animate-pulse flex items-center gap-0.5">
                  🔥 x{combo}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Meters / Dynamic Mini-Game HUD overlays */}
        <div className="w-full flex justify-center pointer-events-none mt-1">
          <AnimatePresence>
            {/* Power Meter */}
            {gameState === 'preparing' && (
              <motion.div
                key="power-meter"
                initial={{ y: -30, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -30, opacity: 0, scale: 0.95 }}
                className={`p-3 sm:p-4 border-[4px] border-black w-[94%] max-w-[460px] shadow-[6px_6px_0_0_#000] pointer-events-none transition-all ${
                  power >= 80 && power <= 95
                    ? 'bg-amber-100 ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.7)]'
                    : 'bg-amber-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5 font-black text-[11px] sm:text-xs text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                    <span>TENAGA LEMPARAN</span>
                  </span>
                  <span className={`font-mono text-xs sm:text-sm px-2 py-0.5 border-2 border-black rounded ${
                    power >= 80 && power <= 95
                      ? 'bg-yellow-400 text-slate-950 font-black shadow-xs animate-pulse'
                      : power > 95
                      ? 'bg-red-500 text-white font-black'
                      : 'bg-slate-900 text-yellow-300'
                  }`}>
                    {Math.round(power)}%
                  </span>
                </div>

                <div className="w-full h-[28px] sm:h-[32px] bg-slate-950 border-[3px] border-black p-0.5 relative overflow-hidden rounded-xs">
                  {/* Ticks */}
                  <div className="absolute inset-0 flex justify-between px-1.5 pointer-events-none opacity-25 z-0">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="w-[1px] h-full bg-white" />
                    ))}
                  </div>

                  {/* Sweet Spot */}
                  <div className="absolute top-0 bottom-0 left-[80%] w-[15%] bg-yellow-400/50 border-x-2 border-yellow-300 z-10 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-pulse">
                    <span className="text-[7.5px] font-black text-yellow-200 tracking-tighter drop-shadow-[1px_1px_0_#000]">PERFECT</span>
                  </div>

                  {/* Fill */}
                  <div
                    className={`h-full transition-all duration-75 relative rounded-xs ${
                      power >= 96
                        ? 'bg-gradient-to-r from-sky-400 via-amber-400 to-red-600'
                        : 'bg-gradient-to-r from-sky-400 via-amber-400 to-rose-600'
                    }`}
                    style={{ width: `${Math.max(1, Math.min(100, power))}%` }}
                  >
                    <div className="absolute top-0 bottom-0 right-0 w-[4px] bg-white shadow-[0_0_8px_#fff]" />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2 text-[8px] sm:text-[8.5px] font-black">
                  <span className="text-slate-600">0%</span>
                  <span className={`px-2 py-0.5 rounded border border-black ${
                    power >= 80 && power <= 95
                      ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                      : 'bg-amber-200/80 text-slate-800'
                  }`}>
                    {power < 35 ? '💤 MENGISI TENAGA...' : power < 80 ? '⚡ TERUS ISI...' : power <= 95 ? '⭐ TARGET IDEAL! LEPAS SEKARANG! ⭐' : '🔥 MAX OVERPOWER!'}
                  </span>
                  <span className="text-rose-700">100%</span>
                </div>
              </motion.div>
            )}

            {/* Reeling Tension Meter */}
            {gameState === 'reeling' && (
              <motion.div
                key="reeling-meter"
                initial={{ y: -30, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -30, opacity: 0, scale: 0.95 }}
                className={`p-3.5 sm:p-4 border-[4px] border-black w-[94%] max-w-[460px] shadow-[6px_6px_0_0_#000] pointer-events-none transition-all ${
                  reelProgress < 28
                    ? 'bg-red-100 border-red-600 ring-4 ring-red-500 animate-pulse'
                    : reelProgress > 75
                    ? 'bg-emerald-100 border-emerald-700 ring-2 ring-emerald-400'
                    : 'bg-amber-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5 font-black text-xs">
                  <span className={`flex items-center gap-2 ${
                    reelProgress < 28 ? 'text-red-700 animate-bounce' : reelProgress > 75 ? 'text-emerald-800' : 'text-blue-700'
                  }`}>
                    <div className="w-5 h-5 bg-slate-900 text-yellow-300 border-2 border-black rounded-full flex items-center justify-center text-xs animate-reel-spin shadow-xs">
                      ⚙️
                    </div>
                    <span className="text-[10px] sm:text-xs">
                      {reelProgress < 28 ? '⚠️ TEGANGAN KRITIS! IKAN MENARIK!' : reelProgress > 75 ? '✨ IKAN DEKAT! TAHAN!' : '⚡ TARIK! TAP CEPAT BERULANG KALI!'}
                    </span>
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-black px-2 py-0.5 bg-slate-900 text-yellow-300 border-2 border-black rounded">
                    {Math.round(reelProgress)}%
                  </span>
                </div>

                <div className="w-full h-[28px] sm:h-[30px] bg-slate-950 border-[3px] border-black p-1 relative rounded-xs overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 relative ${
                      reelProgress < 28
                        ? 'bg-gradient-to-r from-red-600 to-rose-500'
                        : reelProgress > 75
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300'
                        : 'bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-300'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, reelProgress))}%` }}
                  >
                    <div className="absolute top-0 bottom-0 right-0 w-[3px] bg-white shadow-[0_0_8px_#fff]" />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-1.5 text-[8px] sm:text-[8.5px] font-black text-slate-700">
                  <span className="flex items-center gap-1">
                    <span>JARAK:</span>
                    <strong className="text-blue-700">{Math.max(0, Math.round((100 - reelProgress) * 0.4))}m</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded border border-black text-[7.5px] sm:text-[8px] ${
                    reelProgress < 28 ? 'bg-red-500 text-white animate-pulse' : reelProgress > 75 ? 'bg-emerald-600 text-white' : 'bg-amber-300 text-slate-900'
                  }`}>
                    {reelProgress < 28 ? '⚠️ RESISTENSI TINGGI' : reelProgress > 75 ? '🟢 TANGKAPAN AMAN' : '🔵 MENARIK KAIL'}
                  </span>
                  <span>TAP TAP TAP! 🔥</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ================= MAIN 800x600 SCALED CANVAS ================= */}
      <div
        ref={gameCanvasRef}
        style={{
          width: 800,
          height: canvasHeight,
          transform: `scale(${scale.x}, ${scale.y})`,
          transformOrigin: 'center',
        }}
        className={`relative overflow-hidden shadow-[0_0_0_6px_#000,0_0_0_12px_#38bdf8] shrink-0 bg-sky-300 ${
          isScreenShaking ? 'animate-[shake_0.2s_infinite]' : ''
        }`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* Sky & Atmospheric Bands */}
        <div className="absolute inset-0 pointer-events-none">
          {timeOfDay === 'pagi' && (
            <>
              <div className="absolute top-0 inset-x-0 bg-[#0284c7]" style={{ bottom: waterHeight + 285 }} />
              <div className="absolute inset-x-0 h-[70px] bg-[#38bdf8]" style={{ bottom: waterHeight + 215 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#7dd3fc]" style={{ bottom: waterHeight + 140 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#bae6fd]" style={{ bottom: waterHeight + 65 }} />
              <div className="absolute inset-x-0 h-[65px] bg-[#e0f2fe]" style={{ bottom: waterHeight }} />
            </>
          )}
          {timeOfDay === 'siang' && (
            <>
              <div className="absolute top-0 inset-x-0 bg-[#0284c7]" style={{ bottom: waterHeight + 285 }} />
              <div className="absolute inset-x-0 h-[70px] bg-[#0ea5e9]" style={{ bottom: waterHeight + 215 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#38bdf8]" style={{ bottom: waterHeight + 140 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#7dd3fc]" style={{ bottom: waterHeight + 65 }} />
              <div className="absolute inset-x-0 h-[65px] bg-[#bae6fd]" style={{ bottom: waterHeight }} />
            </>
          )}
          {timeOfDay === 'senja' && (
            <>
              <div className="absolute top-0 inset-x-0 bg-[#431407]" style={{ bottom: waterHeight + 285 }} />
              <div className="absolute inset-x-0 h-[70px] bg-[#7c2d12]" style={{ bottom: waterHeight + 215 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#c2410c]" style={{ bottom: waterHeight + 140 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#f97316]" style={{ bottom: waterHeight + 65 }} />
              <div className="absolute inset-x-0 h-[65px] bg-[#fdba74]" style={{ bottom: waterHeight }} />
            </>
          )}
          {timeOfDay === 'malam' && (
            <>
              <div className="absolute top-0 inset-x-0 bg-[#020617]" style={{ bottom: waterHeight + 285 }} />
              <div className="absolute inset-x-0 h-[70px] bg-[#0f172a]" style={{ bottom: waterHeight + 215 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#1e1b4b]" style={{ bottom: waterHeight + 140 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#312e81]" style={{ bottom: waterHeight + 65 }} />
              <div className="absolute inset-x-0 h-[65px] bg-[#4338ca]" style={{ bottom: waterHeight }} />

              <div className="absolute left-12 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ bottom: waterHeight + 230 }} />
              <div className="absolute left-64 w-2 h-2 bg-amber-200 rounded-full animate-pulse" style={{ bottom: waterHeight + 210 }} />
              <div className="absolute right-96 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDelay: '1s', bottom: waterHeight + 220 }} />
              <div className="absolute right-48 w-2 h-2 bg-amber-100 rounded-full animate-pulse" style={{ animationDelay: '0.5s', bottom: waterHeight + 170 }} />
            </>
          )}

          {/* Weather Effects */}
          {weather === 'hujan' && (
            <>
              {Array.from({ length: 30 }).map((_, idx) => (
                <div
                  key={idx}
                  className="absolute w-[2px] h-[22px] bg-sky-200/60"
                  style={{
                    left: `${(idx * 28) % 800}px`,
                    top: '-40px',
                    animation: `rainFall ${0.7 + (idx % 3) * 0.12}s linear infinite`,
                    animationDelay: `${idx * 0.05}s`,
                  }}
                />
              ))}
            </>
          )}

          {weather === 'badai' && (
            <>
              <div className="absolute top-0 inset-x-0 h-[90px] bg-slate-950/40 pointer-events-none" />
              {Array.from({ length: 45 }).map((_, idx) => (
                <div
                  key={idx}
                  className="absolute w-[2.5px] h-[34px] bg-sky-200/70"
                  style={{
                    left: `${(idx * 20) % 800}px`,
                    top: '-50px',
                    animation: `rainFall ${0.45 + (idx % 4) * 0.1}s linear infinite`,
                    animationDelay: `${idx * 0.06}s`,
                  }}
                />
              ))}
            </>
          )}

          {weather === 'kabut_mistis' && (
            <div className="absolute inset-x-0 h-[120px] bg-gradient-to-t from-purple-500/25 via-pink-400/15 to-transparent pointer-events-none animate-pulse" style={{ bottom: waterHeight }} />
          )}

          {/* Sun / Moon */}
          <div className="absolute right-[70px]" style={{ bottom: waterHeight + 170 }}>
            {timeOfDay === 'malam' ? (
              <div className="relative">
                <div className="w-[52px] h-[52px] bg-[#FEF08A] rounded-full border-[4px] border-[#FDE047] shadow-[0_0_30px_rgba(254,240,138,0.8)]" />
                <div className="absolute top-2 left-2 w-3 h-3 bg-amber-200/50 rounded-full" />
                <div className="absolute bottom-3 right-3 w-4 h-4 bg-amber-200/40 rounded-full" />
              </div>
            ) : weather === 'badai' ? (
              <div className="relative">
                <div className="w-[60px] h-[36px] bg-slate-700 rounded-full border-[3px] border-slate-900 shadow-md flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-400 animate-bounce" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className={`w-[52px] h-[52px] border-[4px] ${timeOfDay === 'senja' ? 'bg-[#FF7E47] border-[#EA580C] shadow-[0_0_30px_rgba(234,88,12,0.8)]' : timeOfDay === 'siang' ? 'bg-[#FFFBEB] border-[#FACC15] shadow-[0_0_40px_rgba(253,224,71,1)]' : 'bg-[#FEF08A] border-[#FACC15] shadow-[0_0_30px_rgba(253,224,71,0.8)]'}`} />
                <div className="absolute -top-3 left-3 w-[28px] h-[6px] bg-[#FDE047]" />
                <div className="absolute -bottom-3 left-3 w-[28px] h-[6px] bg-[#FDE047]" />
                <div className="absolute top-3 -left-3 w-[6px] h-[28px] bg-[#FDE047]" />
                <div className="absolute top-3 -right-3 w-[6px] h-[28px] bg-[#FDE047]" />
              </div>
            )}
          </div>

          {/* Drifting Clouds */}
          <motion.div
            animate={{ x: [-140, 880] }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 opacity-90"
            style={{ bottom: waterHeight + 190 }}
          >
            <div className="relative">
              <div className={`w-[75px] h-[16px] absolute top-0 left-[20px] ${timeOfDay === 'badai' ? 'bg-slate-700' : 'bg-white'}`} />
              <div className={`w-[120px] h-[20px] absolute top-[16px] left-[0px] ${timeOfDay === 'badai' ? 'bg-slate-800' : 'bg-white'}`} />
              <div className={`w-[95px] h-[8px] absolute top-[36px] left-[10px] ${timeOfDay === 'badai' ? 'bg-slate-900' : 'bg-sky-100'}`} />
            </div>
          </motion.div>

          <motion.div
            animate={{ x: [-160, 860] }}
            transition={{ duration: 42, repeat: Infinity, ease: 'linear', delay: 10 }}
            className="absolute left-0 opacity-80"
            style={{ bottom: waterHeight + 140 }}
          >
            <div className="relative">
              <div className={`w-[55px] h-[14px] absolute top-0 left-[15px] ${timeOfDay === 'badai' ? 'bg-slate-700' : 'bg-white'}`} />
              <div className={`w-[85px] h-[16px] absolute top-[14px] left-[0px] ${timeOfDay === 'badai' ? 'bg-slate-800' : 'bg-white'}`} />
              <div className={`w-[65px] h-[6px] absolute top-[30px] left-[10px] ${timeOfDay === 'badai' ? 'bg-slate-900' : 'bg-sky-100'}`} />
            </div>
          </motion.div>

          {/* Mountains */}
          <div className="absolute left-0 w-full h-[140px]" style={{ bottom: waterHeight }}>
            <svg width="800" height="140" className="absolute bottom-0 inset-x-0" shapeRendering="crispEdges">
              <polygon points="30,140 120,35 210,140" fill="#475569" />
              <polygon points="105,35 120,35 135,35 120,55" fill="#f8fafc" />

              <polygon points="170,140 295,15 420,140" fill="#334155" />
              <polygon points="275,15 295,15 315,15 295,40" fill="#f8fafc" />

              <polygon points="440,140 550,45 660,140" fill="#475569" />
              <polygon points="535,45 550,45 565,45 550,65" fill="#f8fafc" />

              <polygon points="620,140 715,55 810,140" fill="#334155" />
            </svg>

            <div className="absolute bottom-0 inset-x-0 h-[40px] bg-[#166534] flex items-end justify-between px-6">
              <div className="w-[110px] h-[22px] bg-[#15803d] rounded-t-lg" />
              <div className="w-[190px] h-[32px] bg-[#15803d] rounded-t-lg" />
              <div className="w-[150px] h-[26px] bg-[#15803d] rounded-t-lg" />
            </div>
          </div>

          {/* Pier Grass Slope */}
          <div className="absolute left-0 w-[220px] h-[65px] bg-[#15803d] border-b-[6px] border-[#166534]" style={{ bottom: waterHeight - 10 }}>
            <div className="absolute top-0 inset-x-0 h-[8px] bg-[#22c55e]" />
            <div className="absolute top-[35px] inset-x-0 bottom-0 bg-[#78350f] border-t-[4px] border-[#92400e]" />
            <div className="absolute top-[4px] left-[35px] w-[6px] h-[6px] bg-yellow-300" />
            <div className="absolute top-[2px] left-[90px] w-[6px] h-[6px] bg-rose-400" />
            <div className="absolute top-[5px] left-[150px] w-[6px] h-[6px] bg-amber-300" />
          </div>

          {/* Water & Underwater */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#0f172a] overflow-hidden" style={{ height: waterHeight }}>
            {/* Animated Waves */}
            <div className="absolute top-0 inset-x-0 h-[10px] bg-[#38bdf8]/90 flex overflow-hidden">
              <div className="w-[832px] h-full flex animate-water">
                {Array.from({ length: 26 }).map((_, i) => (
                  <div key={i} className="w-[32px] h-full flex">
                    <div className="w-[16px] h-full bg-[#7dd3fc]" />
                    <div className="w-[16px] h-full bg-[#0284c7]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Shimmer */}
            <div className="absolute top-[20px] left-[220px] w-[70px] h-[4px] bg-sky-200/60" />
            <div className="absolute top-[38px] left-[460px] w-[100px] h-[4px] bg-sky-200/50" />
            <div className="absolute top-[22px] left-[690px] w-[60px] h-[4px] bg-sky-200/60" />

            {/* Light Shafts */}
            <div className="absolute top-0 left-[300px] w-[80px] h-full bg-gradient-to-b from-sky-200/15 to-transparent -rotate-12 pointer-events-none" />
            <div className="absolute top-0 left-[520px] w-[100px] h-full bg-gradient-to-b from-sky-200/15 to-transparent -rotate-12 pointer-events-none" />

            {/* Pillars */}
            <div className="absolute top-0 left-[35px] w-[22px] h-[190px] bg-[#451a03] border-r-[3px] border-[#78350f]">
              <div className="absolute bottom-[20px] inset-x-0 h-[30px] bg-emerald-900/80" />
            </div>
            <div className="absolute top-0 left-[115px] w-[22px] h-[210px] bg-[#451a03] border-r-[3px] border-[#78350f]">
              <div className="absolute bottom-[25px] inset-x-0 h-[35px] bg-emerald-900/80" />
            </div>
            <div className="absolute top-0 left-[185px] w-[22px] h-[180px] bg-[#451a03] border-r-[3px] border-[#78350f]">
              <div className="absolute bottom-[10px] inset-x-0 h-[25px] bg-emerald-900/80" />
            </div>

            {/* Seabed */}
            <div className="absolute bottom-0 inset-x-0 h-[30px] bg-[#d97706] border-t-[4px] border-[#b45309]">
              <div className="absolute top-[6px] left-[260px] w-[16px] h-[8px] bg-[#78350f] rounded-t-xs" />
              <div className="absolute top-[10px] left-[430px] w-[20px] h-[10px] bg-[#92400e] rounded-t-xs" />
              <div className="absolute top-[8px] left-[620px] w-[14px] h-[6px] bg-[#fef08a]" />
              <div className="absolute top-[12px] left-[500px] w-[10px] h-[10px] bg-rose-500 rotate-12" />
            </div>

            {/* Seaweed & Bubbles */}
            <div className="absolute bottom-[26px] left-[270px] w-[10px] h-[65px] bg-emerald-600 animate-kelp rounded-t-full" />
            <div className="absolute bottom-[26px] left-[282px] w-[8px] h-[90px] bg-emerald-500 animate-kelp rounded-t-full" style={{ animationDelay: '0.8s' }} />
            <div className="absolute bottom-[26px] left-[560px] w-[12px] h-[75px] bg-emerald-600 animate-kelp rounded-t-full" style={{ animationDelay: '1.4s' }} />

            <div className="absolute bottom-[30px] left-[310px] w-[6px] h-[6px] rounded-full border border-white/60" style={{ animation: 'floatBubble 4s infinite linear' }} />
            <div className="absolute bottom-[30px] left-[590px] w-[8px] h-[8px] rounded-full border border-white/60" style={{ animation: 'floatBubble 5s infinite linear', animationDelay: '2s' }} />

            <div
              className="absolute top-[70px] opacity-70 flex items-center gap-1"
              style={{ animation: 'fishSwimLeft 14s linear infinite' }}
            >
              <div className="w-[20px] h-[10px] bg-yellow-400 rounded-full border border-amber-600" />
              <div className="w-[6px] h-[8px] bg-amber-500 clip-triangle" />
            </div>
          </div>

          {/* Pier & Lantern */}
          <div className="absolute left-0 w-[230px] h-[32px] bg-[#78350f] border-y-[4px] border-[#451a03] shadow-[0_6px_0_rgba(0,0,0,0.4)]" style={{ bottom: waterHeight - 30 }}>
            <div className="absolute top-full left-[20px] w-[12px] h-[80px] bg-[#451a03] border-x-[2px] border-[#290f01] opacity-90" />
            <div className="absolute top-full left-[110px] w-[12px] h-[80px] bg-[#451a03] border-x-[2px] border-[#290f01] opacity-90" />
            <div className="absolute top-full left-[200px] w-[12px] h-[80px] bg-[#451a03] border-x-[2px] border-[#290f01] opacity-90" />

            <div className="absolute -top-[24px] left-[32px] w-[20px] h-[24px] bg-slate-700 border-[2px] border-black rounded-b-xs">
              <div className="absolute top-[2px] inset-x-[2px] h-[6px] bg-sky-300" />
            </div>
            <div className="absolute -top-[16px] left-[68px] w-[22px] h-[16px] bg-red-600 border-[2px] border-black">
              <div className="absolute top-[2px] left-[6px] w-[10px] h-[3px] bg-yellow-400" />
            </div>

            {/* Lantern */}
            <div className="absolute -top-[32px] left-[180px] z-20">
              <div className="w-[12px] h-[4px] bg-amber-900 border border-black mx-auto" />
              <div className="w-[16px] h-[18px] bg-amber-300 border-[2px] border-black relative overflow-hidden shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-pulse">
                <div className="absolute inset-0 bg-yellow-100 opacity-80" />
                <div className="absolute top-1 left-1.5 w-1 h-2 bg-white rounded-full" />
              </div>
              <div className="w-[20px] h-[4px] bg-amber-950 border border-black mx-auto" />
              <div className="absolute top-full -left-6 w-16 h-12 bg-gradient-to-b from-amber-300/30 to-transparent pointer-events-none rounded-b-full" />
            </div>
          </div>

          {/* Fisherman */}
          <div className="absolute left-[105px] z-10" style={{ bottom: waterHeight - 5 }}>
            <div className="absolute bottom-[0px] left-[10px] w-[28px] h-[18px] bg-[#451a03] border-[2px] border-black">
              <div className="absolute top-[18px] left-[2px] w-[4px] h-[20px] bg-[#451a03]" />
              <div className="absolute top-[18px] right-[2px] w-[4px] h-[20px] bg-[#451a03]" />
            </div>

            <div className="absolute bottom-[16px] left-[12px] w-[20px] h-[22px] bg-blue-800 border-[2px] border-black" />
            <div className="absolute bottom-[36px] left-[8px] w-[26px] h-[32px] bg-amber-400 border-[2px] border-black rounded-t-xs">
              <div className="absolute top-[4px] left-[11px] w-[4px] h-[24px] bg-amber-600" />
            </div>

            <div className="absolute bottom-[66px] left-[10px] w-[22px] h-[20px] bg-amber-200 border-[2px] border-black">
              <div className="absolute top-[6px] right-[4px] w-[3px] h-[3px] bg-black" />
              <div className="absolute bottom-0 inset-x-0 h-[6px] bg-amber-800" />
            </div>
            <div className="absolute bottom-[84px] left-[6px] w-[30px] h-[10px] bg-amber-500 border-[2px] border-black rounded-t-xs">
              <div className="absolute bottom-0 right-[-6px] w-[14px] h-[4px] bg-amber-600" />
            </div>

            {gameState === 'reeling' && (
              <div className="absolute -top-[95px] left-[30px] text-sky-400 font-bold text-xs animate-bounce">
                💦
              </div>
            )}

            {/* Arm & Rod */}
            <div
              className={`absolute bottom-[48px] left-[20px] origin-[4px_16px] ${gameState === 'reeling' ? 'animate-rod-vibrate' : ''}`}
              style={{ transform: `rotate(${rodAngleDeg}deg)` }}
            >
              <div className="w-[20px] h-[8px] bg-amber-400 border-[2px] border-black" />
              <div className="absolute top-0 left-[18px] w-[8px] h-[8px] bg-amber-200 border-[2px] border-black" />
              <div className="absolute top-[-4px] left-[16px] w-[28px] h-[8px] bg-amber-900 border-[2px] border-black" />
              <div className="absolute top-[-8px] left-[26px] w-[10px] h-[10px] bg-slate-300 border-[2px] border-black rounded-full" />

              <div
                className="absolute top-[-3px] left-[42px] w-[165px] h-[4px] border-t border-black shadow-[0_0_4px_rgba(0,0,0,0.5)]"
                style={{ backgroundColor: currentEquippedRodItem.color || '#facc15' }}
              />
              <div className="absolute top-[-3px] left-[205px] w-[10px] h-[4px] bg-red-600">
                <div ref={rodTipRef} className="absolute top-[2px] right-0 w-[1px] h-[1px] opacity-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Fishing Line */}
          {(gameState === 'casting' || gameState === 'waiting' || gameState === 'biting' || gameState === 'reeling') && (
            <svg width="800" height={canvasHeight} className="absolute inset-0 pointer-events-none z-20">
              <path
                d={
                  gameState === 'reeling'
                    ? `M ${rodTipPos.x} ${rodTipPos.y} Q ${(rodTipPos.x + bobberPos.x) / 2} ${Math.min(rodTipPos.y, bobberPos.y) - 35} ${bobberPos.x} ${bobberPos.y}`
                    : `M ${rodTipPos.x} ${rodTipPos.y} Q ${(rodTipPos.x + bobberPos.x) / 2} ${Math.max(rodTipPos.y, bobberPos.y) + 25} ${bobberPos.x} ${bobberPos.y}`
                }
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeDasharray={gameState === 'reeling' ? '4 3' : 'none'}
                className={gameState === 'biting' ? 'animate-pulse' : ''}
              />
            </svg>
          )}

          {/* Bobber & Alert */}
          {(gameState === 'casting' || gameState === 'waiting' || gameState === 'biting' || gameState === 'reeling') && (
            <div
              className={`absolute z-20 flex flex-col items-center justify-center ${gameState === 'waiting' ? 'animate-bobber-float' : ''}`}
              style={{ left: bobberPos.x, top: bobberPos.y, transform: 'translate(-50%, -50%)' }}
            >
              <div className={`relative ${gameState === 'biting' ? 'animate-bounce' : gameState === 'reeling' ? 'animate-[shake_0.15s_infinite]' : ''}`}>
                {(gameState === 'waiting' || gameState === 'biting') && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38px] h-[10px] border-[2px] border-sky-200 rounded-full animate-ping opacity-75" />
                )}

                <div className="w-[10px] h-[4px] bg-yellow-400 mx-auto" />
                <div className="w-[14px] h-[10px] bg-red-600 border-x border-black" />
                <div className="w-[14px] h-[10px] bg-white border-x border-b border-black" />

                <AnimatePresence>
                  {gameState === 'biting' && (
                    <motion.div
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1.25, y: -20 }}
                      exit={{ scale: 0 }}
                      className="absolute bottom-[35px] left-1/2 -translate-x-1/2 flex flex-col items-center z-30"
                    >
                      <div className="bg-red-600 text-yellow-300 font-black text-[28px] px-3 py-1 border-[3px] border-black shadow-[4px_4px_0_0_#000] animate-pulse">
                        !
                      </div>
                      <div className="text-[9px] font-bold text-white bg-black px-2 py-0.5 mt-1 border border-white whitespace-nowrap">
                        TAP SEKARANG!
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Splashes */}
          {splashes.map(sp => (
            <div
              key={sp.id}
              className="absolute pointer-events-none z-30 flex items-center justify-center"
              style={{ left: sp.x, top: sp.y, transform: 'translate(-50%, -50%)' }}
            >
              <div className="w-[40px] h-[12px] border-[2px] border-white rounded-full animate-ping" />
              <div className="absolute -top-4 -left-3 w-[6px] h-[6px] bg-sky-200 rounded-full animate-bounce" />
              <div className="absolute -top-5 right-[-10px] w-[5px] h-[5px] bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            </div>
          ))}

          {/* Floating Pops */}
          <AnimatePresence>
            {floatingTexts.map(ft => (
              <motion.div
                key={ft.id}
                initial={{ opacity: 0, y: 0, scale: 0.6 }}
                animate={{ opacity: 1, y: -40, scale: 1.1 }}
                exit={{ opacity: 0, y: -70 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute pointer-events-none z-40 text-xs font-black drop-shadow-[2px_2px_0_#000] border border-black bg-black/85 px-2.5 py-1 rounded-xs"
                style={{ left: ft.x, top: ft.y, color: ft.color, transform: 'translate(-50%, -50%)' }}
              >
                {ft.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ================= MODALS & STATE OVERLAYS ================= */}
        <AnimatePresence>
          {isJournalOpen && (
            <FishingJournal
              key="journal-modal"
              score={score}
              caughtCount={caughtCount}
              discoveredSpecies={discoveredSpecies}
              soundEnabled={soundEnabled}
              onClose={() => setIsJournalOpen(false)}
            />
          )}

          {isOddsOpen && (
            <FishingOddsModal
              key="odds-modal"
              equippedRod={equippedRod}
              equippedBait={equippedBait}
              weather={weather}
              adminOdds={adminOdds}
              setAdminOdds={setAdminOdds}
              setCoins={setCoins}
              soundEnabled={soundEnabled}
              onClose={() => setIsOddsOpen(false)}
            />
          )}

          {isShopOpen && (
            <FishingShopModal
              key="shop-modal"
              coins={coins}
              setCoins={setCoins}
              equippedRod={equippedRod}
              setEquippedRod={setEquippedRod}
              ownedRods={ownedRods}
              setOwnedRods={setOwnedRods}
              equippedBait={equippedBait}
              setEquippedBait={setEquippedBait}
              baitCounts={baitCounts}
              setBaitCounts={setBaitCounts}
              soundEnabled={soundEnabled}
              onClose={() => setIsShopOpen(false)}
            />
          )}

          {/* Start Screen */}
          {gameState === 'idle' && !hasStarted && (
            <motion.div
              key="start-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 z-40 p-4 select-none"
              onClick={() => {
                unlockAudio();
                playSound('click');
                startPreparing();
              }}
            >
              <div className="bg-amber-100 border-[6px] border-black p-6 sm:p-8 shadow-[10px_10px_0_0_#000] text-center max-w-[520px] w-full relative mt-4">
                <div className="bg-blue-600 text-white border-[4px] border-black py-2.5 px-6 -mt-11 mx-auto inline-block shadow-[4px_4px_0_0_#000]">
                  <h1 className="text-[18px] sm:text-[22px] font-black tracking-wider text-yellow-300 drop-shadow-[2px_2px_0_#000]">
                    ENCORE FISHING PRO
                  </h1>
                </div>

                <div className="mt-5 space-y-2 text-[9.5px] font-bold text-slate-800 text-left bg-amber-50 p-3.5 border-[3px] border-black leading-relaxed">
                  <p className="flex items-center gap-2">
                    <span className="bg-amber-800 text-white px-2 py-0.5 text-[8.5px]">1</span>
                    <span>Tahan layar untuk mengisi Tenaga lemparan.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-amber-800 text-white px-2 py-0.5 text-[8.5px]">2</span>
                    <span>Lepas di zona <strong className="text-amber-800">PERFECT (80-95%)</strong> untuk strike cepat.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-amber-800 text-white px-2 py-0.5 text-[8.5px]">3</span>
                    <span>Saat tanda (<span className="text-red-600 font-black text-sm">!</span>) muncul, segera TAP layar!</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-amber-800 text-white px-2 py-0.5 text-[8.5px]">4</span>
                    <span>TAP cepat berulang kali untuk menarik ikan ke perahu.</span>
                  </p>
                </div>

                <div className="mt-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs py-3 border-[4px] border-black shadow-[4px_4px_0_0_#000] animate-pulse cursor-pointer">
                  KLIK / TAP UNTUK MEMULAI
                </div>
              </div>
            </motion.div>
          )}

          {/* Flash screen on catch */}
          {flashScreen && (
            <div className="absolute inset-0 bg-white z-[60] pointer-events-none animate-ping" />
          )}

          {/* Catch Result Celebration Modal */}
          {gameState === 'caught' && fish && fishStats && (
            <motion.div
              key="catch-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-50 p-3 sm:p-4 overflow-hidden select-none"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Aurora background */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                <div
                  className={`w-[520px] h-[520px] rounded-full blur-3xl opacity-60 animate-pulse ${
                    fish.rarity === 'Mitos'
                      ? 'bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-400'
                      : fish.rarity === 'Legendaris'
                      ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-500'
                      : 'bg-gradient-to-tr from-sky-500 to-emerald-400'
                  }`}
                />
                {(fish.rarity === 'Mitos' || fish.rarity === 'Legendaris') && (
                  <>
                    <div className="absolute w-[420px] h-[420px] rounded-full border border-amber-400/30 animate-[divineRing_24s_linear_infinite]" />
                    <div className="absolute w-[300px] h-[300px] rounded-full border-[3px] border-amber-300/40 animate-shockwave" />
                  </>
                )}
              </div>

              {/* Confetti particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {confettiParticles.map(p => (
                  <div
                    key={p.id}
                    className="absolute text-base select-none animate-particle-float"
                    style={{
                      left: `${p.x}px`,
                      top: `${p.y}px`,
                      animationDelay: `${p.delay}s`,
                      animationDuration: `${p.speed}s`,
                      transform: `scale(${p.scale})`,
                    }}
                  >
                    {p.emoji}
                  </div>
                ))}
              </div>

              {/* Trophy Card */}
              <motion.div
                initial={{ scale: 0.35, y: 35, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 190 }}
                className={`bg-amber-100 border-[6px] ${
                  fish.rarity === 'Mitos'
                    ? 'border-purple-600 shadow-[0_0_60px_rgba(168,85,247,0.9),10px_10px_0_0_#000]'
                    : fish.rarity === 'Legendaris'
                    ? 'border-amber-500 shadow-[0_0_50px_rgba(234,179,8,0.8),10px_10px_0_0_#000]'
                    : 'border-black shadow-[10px_10px_0_0_#000]'
                } p-5 sm:p-6 w-full max-w-[440px] text-slate-900 text-center relative z-10 flex flex-col max-h-[580px] overflow-hidden`}
              >
                <div className="relative z-10 flex-1 overflow-y-auto min-h-0 custom-scrollbar pb-1">
                  {/* Grand Banner */}
                  <div
                    className={`py-2 px-4 mb-2.5 inline-block shadow-[4px_4px_0_0_#000] border-[4px] border-black ${
                      fish.rarity === 'Mitos'
                        ? 'bg-gradient-to-r from-purple-800 via-pink-600 to-amber-500 text-white animate-pulse'
                        : fish.rarity === 'Legendaris'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    <h2 className="text-[12px] sm:text-[14px] font-black text-yellow-300 flex items-center justify-center gap-1.5 tracking-wide">
                      {fish.rarity === 'Mitos' ? (
                        <>⭐ 👑 MAHA MITOS DEWA SAMUDRA! 👑 ⭐</>
                      ) : fish.rarity === 'Legendaris' ? (
                        <>👑 🏆 TANGKAPAN LEGENDARIS! 🏆 👑</>
                      ) : (
                        <><Sparkles className="w-4 h-4 text-yellow-300" /> TERTANGKAP!</>
                      )}
                    </h2>
                  </div>

                  {/* Showcase Pedestal */}
                  <div className="flex justify-center my-2">
                    <div
                      className={`w-[130px] h-[130px] border-[4px] ${
                        fish.rarity === 'Mitos'
                          ? 'border-purple-600 bg-gradient-to-tr from-slate-950 via-purple-950 to-indigo-950 shadow-[0_0_35px_rgba(168,85,247,0.9)]'
                          : fish.rarity === 'Legendaris'
                          ? 'border-amber-500 bg-gradient-to-tr from-amber-200 to-yellow-100 shadow-[0_0_25px_rgba(234,179,8,0.8)]'
                          : 'border-black bg-gradient-to-b from-sky-100 to-amber-100'
                      } shadow-[5px_5px_0_0_#000] flex items-center justify-center p-2 relative overflow-hidden`}
                    >
                      <motion.div
                        animate={{ y: [-5, 5, -5], rotate: [-4, 4, -4] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="relative z-10"
                      >
                        <FishGraphic id={fish.id} size={105} />
                      </motion.div>
                    </div>
                  </div>

                  {/* Stats & Details */}
                  <div className="space-y-1.5 mb-2.5">
                    <h3 className="text-[14px] sm:text-[16px] font-black text-slate-900">{fish.name}</h3>
                    <div
                      className="inline-block px-3 py-0.5 text-slate-900 border-[2px] border-black text-[9px] font-black uppercase tracking-wider"
                      style={{ backgroundColor: fish.badgeBg }}
                    >
                      RARITY: {fish.rarity}
                    </div>
                    <p className="text-[9.5px] text-slate-700 italic px-2 mt-0.5 leading-snug">{fish.description}</p>

                    <div className="flex justify-center gap-3 mt-2 text-[9.5px] font-bold bg-amber-200/80 p-2 border-[2px] border-black">
                      <span>BERAT: <strong className="text-blue-700">{fishStats.weight} kg</strong></span>
                      <span>PANJANG: <strong className="text-blue-700">{fishStats.length} cm</strong></span>
                    </div>

                    <div className="flex justify-center items-center gap-3 mt-2 text-[9.5px] font-black">
                      <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-800 shadow-xs">
                        + {fish.points} PTS
                      </span>
                      <span className="text-amber-900 bg-amber-200 px-2 py-0.5 border border-amber-800 shadow-xs">
                        🪙 +{Math.round(fish.coins * (equippedRod === 'cosmic' ? 2.0 : equippedRod === 'gold' ? 1.5 : 1))} KOIN
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {!caughtActionUnlocked ? (
                    <div className="mt-3 py-2.5 px-4 bg-slate-900 border-[3px] border-amber-400 text-yellow-300 text-[9.5px] font-black tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                      <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                      <span className="animate-pulse">✨ MEMBUKA HASIL TANGKAPAN...</span>
                    </div>
                  ) : sellConfirmation ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-2 p-3 bg-red-950 border-[3px] border-red-500 text-white space-y-2 shadow-[0_0_25px_rgba(239,68,68,0.7)]"
                    >
                      <div className="flex items-center justify-center gap-1.5 text-red-400 text-[10.5px] font-black">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>KONFIRMASI JUAL IKAN LANGKA</span>
                      </div>
                      <p className="text-[8.5px] text-slate-200 leading-snug">
                        Ikan <strong>{fish.name}</strong> ({fish.rarity}) sangat bernilai. Yakin ingin menjualnya seharga <strong>+{Math.round(fish.coins * (equippedRod === 'cosmic' ? 2.0 : equippedRod === 'gold' ? 1.5 : 1))} 🪙</strong>?
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound('click');
                            setSellConfirmation(false);
                          }}
                          className="flex-1 py-2 bg-amber-400 text-slate-950 border-[2px] border-black font-black text-[9px] hover:bg-amber-300 shadow-[2px_2px_0_0_#000] cursor-pointer"
                        >
                          BATAL (SIMPAN)
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound('upgrade');
                            const extraCoins = Math.round(fish.coins * (equippedRod === 'cosmic' ? 2.0 : equippedRod === 'gold' ? 1.5 : 1));
                            setCoins(c => c + extraCoins);
                            triggerFloatingText(`+${extraCoins} 🪙 DIJUAL!`, bobberPos.x, bobberPos.y - 60, '#facc15');
                            setGameState('idle');
                          }}
                          className="flex-1 py-2 bg-red-600 text-white border-[2px] border-black font-black text-[9px] hover:bg-red-500 shadow-[2px_2px_0_0_#000] cursor-pointer"
                        >
                          TETAP JUAL
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2.5 mt-3"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playSound('click');
                          setGameState('idle');
                        }}
                        className="flex-1 py-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 border-[3px] border-black font-black text-xs hover:brightness-110 shadow-[3px_3px_0_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4 text-emerald-800" />
                        <span>SIMPAN KE JURNAL</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fish.rarity === 'Mitos' || fish.rarity === 'Legendaris') {
                            playSound('click');
                            setSellConfirmation(true);
                          } else {
                            playSound('upgrade');
                            const extraCoins = Math.round(fish.coins * (equippedRod === 'cosmic' ? 2.0 : equippedRod === 'gold' ? 1.5 : 1));
                            setCoins(c => c + extraCoins);
                            triggerFloatingText(`+${extraCoins} 🪙 DIJUAL!`, bobberPos.x, bobberPos.y - 60, '#facc15');
                            setGameState('idle');
                          }
                        }}
                        className="py-3 px-3 sm:px-4 bg-emerald-600 text-white border-[3px] border-black font-black text-xs hover:bg-emerald-500 shadow-[3px_3px_0_0_#000] active:translate-y-0.5 cursor-pointer flex items-center gap-1"
                      >
                        <Coins className="w-3.5 h-3.5 text-yellow-300" />
                        <span>JUAL (+{Math.round(fish.coins * (equippedRod === 'cosmic' ? 2.0 : equippedRod === 'gold' ? 1.5 : 1))}🪙)</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Escaped Screen */}
          {gameState === 'escaped' && (
            <motion.div
              key="escape-modal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-50 p-4 select-none"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="bg-red-700 border-[5px] border-black p-5 sm:p-6 w-full max-w-[400px] text-white shadow-[8px_8px_0_0_#000] text-center relative">
                <h2 className="text-[18px] font-black mb-3 text-yellow-300 drop-shadow-[2px_2px_0_#000]">
                  IKAN LEPAS...
                </h2>

                <div className="flex justify-center my-3">
                  <div className="w-[80px] h-[80px] border-[3px] border-black bg-slate-900 flex items-center justify-center shadow-sm">
                    <AlertCircle className="w-[45px] h-[45px] text-amber-400" />
                  </div>
                </div>

                <div className="text-[9.5px] font-bold bg-red-900/90 p-2.5 border-[2px] border-black mb-4 leading-relaxed">
                  {escapeReason === 'early' && 'Terlalu Cepat! Kamu menarik kail sebelum ikan menggigit.'}
                  {escapeReason === 'missed' && 'Terlalu Lambat! Ikan keburu kabur memakan umpan.'}
                  {escapeReason === 'failed' && 'Tenaga Ikan Terlalu Kuat! Tarikanmu kalah kencang.'}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSound('click');
                    setGameState('idle');
                  }}
                  className="w-full py-3 bg-white text-slate-900 border-[3px] border-black font-black text-xs hover:bg-slate-100 shadow-[3px_3px_0_0_#000] active:translate-y-0.5 cursor-pointer"
                >
                  COBA LAGI
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
