import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ArrowLeft, Trophy, Sparkles, Volume2, VolumeX, Sun, Moon, Flame, Maximize2, Minimize2, BookOpen, X, Coins, ShoppingBag, BarChart3, CloudRain, Zap, Check, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FishGraphic } from './FishGraphic';
import { playFishingSound, unlockAudio, FishingSoundType } from '../lib/fishingAudio';

type GameState = 'idle' | 'preparing' | 'casting' | 'waiting' | 'biting' | 'reeling' | 'caught' | 'escaped';
type TimeOfDay = 'pagi' | 'senja' | 'malam' | 'badai';

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
  { id: 'bamboo', name: 'Joran Bambu Klasik', price: 0, icon: '🎋', description: 'Joran tradisional dari bambu petung pilihan.', reelSpeedBonus: 0, strengthBonus: 0, luckBonus: 0, color: '#eab308' },
  { id: 'carbon', name: 'Joran Serat Karbon Pro', price: 500, icon: '🎣', description: 'Ringan & lentur, kecepatan tarik +25% & ketahanan +20%.', reelSpeedBonus: 0.25, strengthBonus: 0.20, luckBonus: 0.15, color: '#38bdf8' },
  { id: 'gold', name: 'Joran Naga Emas Hoki', price: 1500, icon: '🔱', description: 'Berlapis emas murni, peluang ikan Langka & Koin +50%.', reelSpeedBonus: 0.40, strengthBonus: 0.35, luckBonus: 0.40, color: '#facc15' },
  { id: 'poseidon', name: 'Trisula Poseidon Atlantis', price: 4000, icon: '⚡', description: 'Pusaka dewa samudra, peluang Mitos +150% & Auto-Reel Burst!', reelSpeedBonus: 0.65, strengthBonus: 0.50, luckBonus: 0.90, color: '#a855f7' }
];

export const BAITS_DATABASE: BaitItem[] = [
  { id: 'worm', name: 'Cacing Tanah', price: 0, icon: '🪱', description: 'Umpan dasar tak terbatas.', biteSpeedBonus: 0, rareBonus: 0, mythicBonus: 0 },
  { id: 'pellet', name: 'Pelet Aroma Master', price: 30, icon: '🧆', description: 'Ikan menyambar 50% lebih cepat.', biteSpeedBonus: 0.5, rareBonus: 0.15, mythicBonus: 0 },
  { id: 'shrimp', name: 'Udang Laut Fosfor', price: 80, icon: '🦐', description: 'Peluang ikan Langka & Sangat Langka meningkat drastis.', biteSpeedBonus: 0.35, rareBonus: 0.45, mythicBonus: 0.15 },
  { id: 'star', name: 'Umpan Bintang Mitos', price: 200, icon: '⭐', description: 'Memikat ikan Legendaris & Mitos Purba dari kedalaman.', biteSpeedBonus: 0.45, rareBonus: 0.70, mythicBonus: 0.85 }
];

export const FISH_DATABASE: FishType[] = [
  // Biasa (Common)
  { id: 'shoe', name: 'Sepatu Boots Tua', rarity: 'Biasa', color: '#a8a29e', secondaryColor: '#57534e', badgeBg: '#e7e5e4', difficulty: 0.35, minWeight: 0.3, maxWeight: 0.9, points: 25, coins: 12, description: 'Boot tua basah yang tersangkut di dasar sungai.' },
  { id: 'teri', name: 'Ikan Teri Neon', rarity: 'Biasa', color: '#38bdf8', secondaryColor: '#0284c7', badgeBg: '#e0f2fe', difficulty: 0.6, minWeight: 0.1, maxWeight: 0.4, points: 50, coins: 25, description: 'Ikan hias mungil berkilau biru neon saat terkena cahaya.' },
  { id: 'nila', name: 'Ikan Nila Emas', rarity: 'Biasa', color: '#facc15', secondaryColor: '#ca8a04', badgeBg: '#fef9c3', difficulty: 1.0, minWeight: 0.8, maxWeight: 2.8, points: 100, coins: 50, description: 'Sisiknya kuning berkilau seperti emas murni.' },
  { id: 'mujair', name: 'Ikan Mujair Bintik', rarity: 'Biasa', color: '#64748b', secondaryColor: '#334155', badgeBg: '#f1f5f9', difficulty: 0.8, minWeight: 0.5, maxWeight: 1.5, points: 80, coins: 40, description: 'Ikan air tawar yang tangguh dan mudah berkembang biak.' },
  { id: 'wader', name: 'Ikan Wader Pari', rarity: 'Biasa', color: '#cbd5e1', secondaryColor: '#94a3b8', badgeBg: '#f8fafc', difficulty: 0.5, minWeight: 0.05, maxWeight: 0.2, points: 40, coins: 20, description: 'Ikan kecil perak yang hidup bergerombol di perairan dangkal.' },
  { id: 'sepat', name: 'Ikan Sepat Rawa', rarity: 'Biasa', color: '#9ca3af', secondaryColor: '#4b5563', badgeBg: '#f3f4f6', difficulty: 0.65, minWeight: 0.1, maxWeight: 0.3, points: 35, coins: 18, description: 'Suka bersembunyi di balik tanaman air.' },
  { id: 'kepiting', name: 'Kepiting Kecil', rarity: 'Biasa', color: '#f87171', secondaryColor: '#b91c1c', badgeBg: '#fef2f2', difficulty: 0.9, minWeight: 0.2, maxWeight: 0.8, points: 60, coins: 30, description: 'Suka mencapit umpanmu dengan capitnya yang kecil.' },
  { id: 'ranting', name: 'Ranting Pohon', rarity: 'Biasa', color: '#78350f', secondaryColor: '#451a03', badgeBg: '#fffbeb', difficulty: 0.2, minWeight: 0.5, maxWeight: 2.0, points: 10, coins: 5, description: 'Hanya sepotong kayu yang tersangkut.' },
  { id: 'kaleng', name: 'Kaleng Bekas', rarity: 'Biasa', color: '#94a3b8', secondaryColor: '#475569', badgeBg: '#f8fafc', difficulty: 0.3, minWeight: 0.1, maxWeight: 0.5, points: 15, coins: 8, description: 'Sampah yang terbuang. Jagalah kebersihan lingkungan!' },
  { id: 'betik', name: 'Ikan Betik', rarity: 'Biasa', color: '#65a30d', secondaryColor: '#3f6212', badgeBg: '#f7fee7', difficulty: 0.7, minWeight: 0.2, maxWeight: 0.6, points: 55, coins: 28, description: 'Ikan kuat yang bisa hidup di air keruh.' },
  { id: 'guppy', name: 'Ikan Guppy Pelangi', rarity: 'Biasa', color: '#f472b6', secondaryColor: '#ec4899', badgeBg: '#fdf2f8', difficulty: 0.55, minWeight: 0.05, maxWeight: 0.2, points: 65, coins: 32, description: 'Ekornya mekar indah seperti kipas beraneka warna.' },
  { id: 'keong', name: 'Keong Emas Sawah', rarity: 'Biasa', color: '#f59e0b', secondaryColor: '#b45309', badgeBg: '#fffbeb', difficulty: 0.25, minWeight: 0.1, maxWeight: 0.4, points: 30, coins: 15, description: 'Cangkang keong kuning mengkilap di dasar lumpur.' },
  
  // Langka (Rare)
  { id: 'lele', name: 'Ikan Lele Raksasa', rarity: 'Langka', color: '#475569', secondaryColor: '#0f172a', badgeBg: '#f1f5f9', difficulty: 1.6, minWeight: 3.5, maxWeight: 8.5, points: 250, coins: 120, description: 'Kumisnya panjang dan perlawanannya sangat sengit!' },
  { id: 'gabus', name: 'Ikan Gabus Loreng', rarity: 'Langka', color: '#4d7c0f', secondaryColor: '#14532d', badgeBg: '#f0fdf4', difficulty: 1.8, minWeight: 2.0, maxWeight: 6.5, points: 300, coins: 150, description: 'Predator air tawar dengan gigi tajam dan corak loreng.' },
  { id: 'gurame', name: 'Gurame Padang', rarity: 'Langka', color: '#fb923c', secondaryColor: '#c2410c', badgeBg: '#fff7ed', difficulty: 1.4, minWeight: 2.5, maxWeight: 5.0, points: 280, coins: 140, description: 'Pipih, lezat, dan memiliki warna cerah memikat.' },
  { id: 'patin', name: 'Ikan Patin Sungai', rarity: 'Langka', color: '#cbd5e1', secondaryColor: '#64748b', badgeBg: '#f8fafc', difficulty: 1.5, minWeight: 2.0, maxWeight: 10.0, points: 260, coins: 130, description: 'Dagingnya tebal dan tarikannya cukup kuat.' },
  { id: 'kura', name: 'Kura-kura Sungai', rarity: 'Langka', color: '#166534', secondaryColor: '#064e3b', badgeBg: '#f0fdf4', difficulty: 1.9, minWeight: 1.5, maxWeight: 4.0, points: 320, coins: 160, description: 'Tempurungnya keras, sangat berat saat ditarik.' },
  { id: 'belut', name: 'Belut Listrik', rarity: 'Langka', color: '#eab308', secondaryColor: '#854d0e', badgeBg: '#fefce8', difficulty: 2.0, minWeight: 1.0, maxWeight: 3.5, points: 350, coins: 180, description: 'Hati-hati! Ikan ini bisa memberikan sengatan kecil.' },
  { id: 'udang', name: 'Udang Galah Raksasa', rarity: 'Langka', color: '#f97316', secondaryColor: '#c2410c', badgeBg: '#fff7ed', difficulty: 1.7, minWeight: 0.5, maxWeight: 1.5, points: 290, coins: 145, description: 'Capitnya panjang berwarna biru, rasanya pasti lezat.' },
  { id: 'channa', name: 'Ikan Channa Maru', rarity: 'Langka', color: '#f59e0b', secondaryColor: '#b45309', badgeBg: '#fef3c7', difficulty: 2.1, minWeight: 1.8, maxWeight: 5.5, points: 380, coins: 195, description: 'Channa berkepala ular dengan motif bunga kuning keemasan.' },
  { id: 'bawal', name: 'Ikan Bawal Bintang', rarity: 'Langka', color: '#94a3b8', secondaryColor: '#334155', badgeBg: '#f8fafc', difficulty: 1.75, minWeight: 1.2, maxWeight: 3.8, points: 310, coins: 155, description: 'Ikan berbadan lebar dan bertenaga besar saat melawan kail.' },
  { id: 'lobster', name: 'Lobster Biru Samudra', rarity: 'Langka', color: '#0284c7', secondaryColor: '#0369a1', badgeBg: '#e0f2fe', difficulty: 2.2, minWeight: 0.8, maxWeight: 2.2, points: 400, coins: 210, description: 'Warna birunya sangat mencolok dan langka di alam liar.' },
  
  // Sangat Langka (Epic)
  { id: 'koi', name: 'Ikan Mas Koi Royal', rarity: 'Sangat Langka', color: '#f87171', secondaryColor: '#fef2f2', badgeBg: '#fee2e2', difficulty: 2.3, minWeight: 2.5, maxWeight: 6.0, points: 500, coins: 280, description: 'Simbol keberuntungan bertotol merah putih indah.' },
  { id: 'arwana', name: 'Arwana Super Red', rarity: 'Sangat Langka', color: '#dc2626', secondaryColor: '#7f1d1d', badgeBg: '#fef2f2', difficulty: 2.6, minWeight: 1.5, maxWeight: 4.5, points: 650, coins: 380, description: 'Raja akuarium dengan sisik merah merona yang mahal harganya.' },
  { id: 'belida', name: 'Ikan Belida Lopis', rarity: 'Sangat Langka', color: '#9ca3af', secondaryColor: '#374151', badgeBg: '#f3f4f6', difficulty: 2.4, minWeight: 3.0, maxWeight: 7.0, points: 600, coins: 340, description: 'Bentuknya unik seperti pisau, sangat langka di alam liar.' },
  { id: 'pari', name: 'Pari Air Tawar', rarity: 'Sangat Langka', color: '#d6d3d1', secondaryColor: '#78716c', badgeBg: '#fafaf9', difficulty: 2.5, minWeight: 5.0, maxWeight: 15.0, points: 550, coins: 310, description: 'Bentuknya pipih melebar, sangat jarang terlihat.' },
  { id: 'pesut', name: 'Pesut Mahakam', rarity: 'Sangat Langka', color: '#bfdbfe', secondaryColor: '#60a5fa', badgeBg: '#eff6ff', difficulty: 2.8, minWeight: 10.0, maxWeight: 30.0, points: 700, coins: 420, description: 'Mamalia air tawar yang cerdas dan bersahabat.' },
  { id: 'piranha', name: 'Piranha Merah', rarity: 'Sangat Langka', color: '#ef4444', secondaryColor: '#991b1b', badgeBg: '#fef2f2', difficulty: 2.7, minWeight: 0.8, maxWeight: 2.5, points: 680, coins: 400, description: 'Ikan predator buas dengan gigi setajam silet.' },
  { id: 'arapaima', name: 'Ikan Arapaima Gigas', rarity: 'Sangat Langka', color: '#b91c1c', secondaryColor: '#1e293b', badgeBg: '#fee2e2', difficulty: 2.9, minWeight: 20.0, maxWeight: 75.0, points: 800, coins: 480, description: 'Raksasa sungai Amazon berlidah tulang dan bersisik merah.' },
  { id: 'aligator', name: 'Ikan Aligator Gar', rarity: 'Sangat Langka', color: '#334155', secondaryColor: '#0f172a', badgeBg: '#f1f5f9', difficulty: 2.85, minWeight: 8.0, maxWeight: 25.0, points: 720, coins: 430, description: 'Moncongnya panjang mirip buaya dengan deretan taring tajam.' },
  { id: 'peacock', name: 'Ikan Peacock Bass', rarity: 'Sangat Langka', color: '#10b981', secondaryColor: '#f59e0b', badgeBg: '#ecfdf5', difficulty: 2.65, minWeight: 2.0, maxWeight: 6.0, points: 640, coins: 370, description: 'Corak ekornya menyerupai mata merak dengan kilau hijau zamrud.' },
  
  // Legendaris (Legendary)
  { id: 'megalodon', name: 'Hiu Megalodon Purba', rarity: 'Legendaris', color: '#38bdf8', secondaryColor: '#f1f5f9', badgeBg: '#bae6fd', difficulty: 3.4, minWeight: 30.0, maxWeight: 80.0, points: 1400, coins: 900, description: 'Predator samudra purba yang legendaris! Sangat langka.' },
  { id: 'kraken', name: 'Bayi Kraken', rarity: 'Legendaris', color: '#a855f7', secondaryColor: '#581c87', badgeBg: '#faf5ff', difficulty: 3.6, minWeight: 15.0, maxWeight: 45.0, points: 1600, coins: 1100, description: 'Makhluk mitologi berwujud gurita raksasa berukuran kecil.' },
  { id: 'naga', name: 'Naga Air Zamrud', rarity: 'Legendaris', color: '#10b981', secondaryColor: '#047857', badgeBg: '#ecfdf5', difficulty: 3.8, minWeight: 25.0, maxWeight: 80.0, points: 2000, coins: 1400, description: 'Naga gaib penunggu kedalaman, memancarkan aura magis hijau.' },
  { id: 'leviathan', name: 'Leviathan Air Tawar', rarity: 'Legendaris', color: '#1e3a8a', secondaryColor: '#172554', badgeBg: '#eff6ff', difficulty: 4.0, minWeight: 50.0, maxWeight: 150.0, points: 2500, coins: 1800, description: 'Raksasa mitologi yang menguasai perairan dalam.' },
  { id: 'cumi', name: 'Cumi-cumi Raksasa', rarity: 'Legendaris', color: '#f43f5e', secondaryColor: '#9f1239', badgeBg: '#fff1f2', difficulty: 3.7, minWeight: 30.0, maxWeight: 70.0, points: 1800, coins: 1250, description: 'Tentakelnya sangat kuat, bisa menyemburkan tinta hitam.' },
  { id: 'hiuhantu', name: 'Hiu Hantu Tembus Pandang', rarity: 'Legendaris', color: '#f8fafc', secondaryColor: '#cbd5e1', badgeBg: '#f1f5f9', difficulty: 3.75, minWeight: 10.0, maxWeight: 25.0, points: 1900, coins: 1300, description: 'Tubuhnya transparan, hanya terlihat matanya yang bersinar.' },
  { id: 'duyung', name: 'Putri Duyung Emas', rarity: 'Legendaris', color: '#fcd34d', secondaryColor: '#b45309', badgeBg: '#fffbeb', difficulty: 4.1, minWeight: 40.0, maxWeight: 65.0, points: 3000, coins: 2200, description: 'Sosok mitos cantik yang membawa keberuntungan tiada tara.' },
  { id: 'oarfish', name: 'Ikan Naga Oarfish Samudra', rarity: 'Legendaris', color: '#e2e8f0', secondaryColor: '#ef4444', badgeBg: '#f8fafc', difficulty: 3.85, minWeight: 35.0, maxWeight: 90.0, points: 2200, coins: 1600, description: 'Ikan pita raksasa penjelajah palung laut terdalam dengan mahkota merah.' },

  // Mitos / Dewa (Mythic - Ultra Rare 1%)
  { id: 'shenlong', name: 'Naga Emas Shenlong', rarity: 'Mitos', color: '#facc15', secondaryColor: '#854d0e', badgeBg: '#fef08a', difficulty: 4.8, minWeight: 100.0, maxWeight: 350.0, points: 6000, coins: 5000, description: 'Naga langit suci pembawa berkah kekayaan tiada tara, bermahkota mustika naga.' },
  { id: 'phoenix', name: 'Phoenix Abadi Samudra', rarity: 'Mitos', color: '#06b6d4', secondaryColor: '#0891b2', badgeBg: '#cffafe', difficulty: 4.6, minWeight: 80.0, maxWeight: 280.0, points: 5500, coins: 4500, description: 'Burung mitos bersayap air es abadi yang terlahir dari tetesan embun samudra.' },
  { id: 'atlantis', name: 'Dewa Penjaga Atlantis', rarity: 'Mitos', color: '#14b8a6', secondaryColor: '#0f766e', badgeBg: '#ccfbf1', difficulty: 5.0, minWeight: 120.0, maxWeight: 450.0, points: 7000, coins: 6000, description: 'Penguasa samudra kuno berzirah emas dan bertrisula keramat.' },
  { id: 'cosmic', name: 'Ikan Bintang Galaksi', rarity: 'Mitos', color: '#6366f1', secondaryColor: '#4338ca', badgeBg: '#e0e7ff', difficulty: 5.2, minWeight: 150.0, maxWeight: 600.0, points: 8000, coins: 7500, description: 'Makhluk kosmik yang tercipta dari gugusan bintang galaksi dan nebula alam semesta.' }
];

export const calculateRarityRates = (rodId: string, baitId: string) => {
  const rod = RODS_DATABASE.find(r => r.id === rodId) || RODS_DATABASE[0];
  const bait = BAITS_DATABASE.find(b => b.id === baitId) || BAITS_DATABASE[0];

  let mythicChance = 0.01 + rod.luckBonus * 0.008 + bait.mythicBonus * 0.015;
  let legendaryChance = 0.05 + rod.luckBonus * 0.03 + bait.rareBonus * 0.035;
  let epicChance = 0.14 + rod.luckBonus * 0.05 + bait.rareBonus * 0.06;
  let rareChance = 0.30 + rod.luckBonus * 0.05 + bait.rareBonus * 0.08;
  
  const totalSpecial = mythicChance + legendaryChance + epicChance + rareChance;
  const commonChance = Math.max(0.08, 1 - totalSpecial);

  return {
    common: commonChance,
    rare: rareChance,
    epic: epicChance,
    legendary: legendaryChance,
    mythic: mythicChance,
  };
};

const getRandomFish = (rodId: string, baitId: string): FishType => {
  const rates = calculateRarityRates(rodId, baitId);
  const rand = Math.random();

  if (rand < rates.mythic) {
    const mythic = FISH_DATABASE.filter(f => f.rarity === 'Mitos');
    return mythic[Math.floor(Math.random() * mythic.length)];
  } else if (rand < rates.mythic + rates.legendary) {
    const legendaris = FISH_DATABASE.filter(f => f.rarity === 'Legendaris');
    return legendaris[Math.floor(Math.random() * legendaris.length)];
  } else if (rand < rates.mythic + rates.legendary + rates.epic) {
    const sgtLangka = FISH_DATABASE.filter(f => f.rarity === 'Sangat Langka');
    return sgtLangka[Math.floor(Math.random() * sgtLangka.length)];
  } else if (rand < rates.mythic + rates.legendary + rates.epic + rates.rare) {
    const langka = FISH_DATABASE.filter(f => f.rarity === 'Langka');
    return langka[Math.floor(Math.random() * langka.length)];
  } else {
    const biasa = FISH_DATABASE.filter(f => f.rarity === 'Biasa');
    return biasa[Math.floor(Math.random() * biasa.length)];
  }
};

const FishingJournal: React.FC<{
  score: number;
  caughtCount: number;
  discoveredSpecies: string[];
  soundEnabled?: boolean;
  onClose: () => void;
}> = ({ score, caughtCount, discoveredSpecies, soundEnabled = true, onClose }) => {
  const [spread, setSpread] = useState(0);
  const [flippingState, setFlippingState] = useState<{isFlipping: boolean, dir: number, prevSpread: number, nextSpread: number} | null>(null);

  const speciesPagesCount = Math.ceil(FISH_DATABASE.length / 6);
  const totalPages = 1 + speciesPagesCount;
  const totalSpreads = Math.ceil(totalPages / 2);

  const getPageContent = (pageIndex: number) => {
    if (pageIndex === 0) {
      return (
        <div key={`page-${pageIndex}`} className="flex-1 flex flex-col h-full relative" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, rgba(0,0,0,0.06) 24px)" }}>
          {/* Subtle watermarks/stamps */}
          <div className="absolute top-10 right-4 w-16 h-16 border-[3px] border-red-800/30 rounded-full flex items-center justify-center transform rotate-12 pointer-events-none">
            <div className="text-red-800/30 font-black text-[10px] tracking-widest text-center leading-tight mt-1">OFFICIAL<br/>RECORD</div>
          </div>

          <div className="flex items-center gap-2 text-slate-800 mb-6 border-b-[3px] border-slate-800/20 pb-3 pt-2 relative z-10">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-amber-900" /> 
            <h2 className="text-[18px] sm:text-[22px] font-black font-serif tracking-widest text-amber-950">MY JOURNAL</h2>
          </div>
          
          <div className="flex flex-col gap-4 sm:gap-6 mb-2 mt-4 px-2 relative z-10">
            <div className="bg-[#fefce8] border-[2px] border-slate-300 p-3 sm:p-4 text-center shadow-md transform -rotate-2 relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3 bg-white/50 border border-slate-200/50 shadow-sm" />
              <div className="text-xs sm:text-sm font-bold text-slate-500 mb-1 tracking-widest">TOTAL CATCHES</div>
              <div className="text-3xl sm:text-4xl font-black text-slate-800 font-serif">{caughtCount}</div>
            </div>
            
            <div className="bg-[#fefce8] border-[2px] border-slate-300 p-3 sm:p-4 text-center shadow-md transform rotate-1 relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3 bg-white/50 border border-slate-200/50 shadow-sm" />
              <div className="text-xs sm:text-sm font-bold text-slate-500 mb-1 tracking-widest">LIFETIME SCORE</div>
              <div className="text-3xl sm:text-4xl font-black text-slate-800 font-serif">{score}</div>
            </div>
          </div>
          
          <div className="mt-auto pt-2">
            <div className="text-xs font-bold text-slate-500/70 text-center font-serif">PAGE {pageIndex + 1}</div>
          </div>
        </div>
      );
    }

    const speciesStartIndex = (pageIndex - 1) * 6;
    if (speciesStartIndex >= FISH_DATABASE.length) {
      return (
        <div key={`page-${pageIndex}`} className="flex-1 flex flex-col h-full relative" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, rgba(0,0,0,0.06) 24px)" }}> 
           <div className="mt-auto pt-2 relative z-10">
            <div className="text-xs font-bold text-slate-500/70 text-center font-serif">PAGE {pageIndex + 1}</div>
          </div>
        </div>
      );
    }

    const pageSpecies = FISH_DATABASE.slice(speciesStartIndex, speciesStartIndex + 6);

    return (
      <div key={`page-${pageIndex}`} className="flex-1 flex flex-col h-full relative" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, rgba(0,0,0,0.06) 24px)" }}>
        {pageIndex === 1 && (
          <div className="text-xs sm:text-sm font-bold font-serif mb-3 flex justify-between items-center text-slate-800 border-b-[3px] border-slate-800/20 pb-2 pt-2 shrink-0 relative z-10 tracking-widest">
            <span>SPECIES LOG</span>
            <span className="bg-amber-800 text-[#f4ebd0] px-2 py-0.5 border border-amber-900 shadow-sm">{discoveredSpecies.length} / {FISH_DATABASE.length}</span>
          </div>
        )}
        
        <div className="flex-1 flex flex-col gap-3 relative z-10 pt-2">
          {pageSpecies.map((fish, index) => {
            const isDiscovered = discoveredSpecies.includes(fish.id);
            const isMythic = fish.rarity === 'Mitos';
            const isLegendary = fish.rarity === 'Legendaris';
            const rotation = index % 2 === 0 ? 'rotate-1' : '-rotate-1';
            return (
              <div key={fish.id} className={`relative bg-white border-[2px] ${isMythic && isDiscovered ? 'border-purple-600 ring-2 ring-amber-400' : isLegendary && isDiscovered ? 'border-amber-500' : 'border-slate-300'} p-1.5 sm:p-2 flex items-center gap-2 sm:gap-3 shadow-sm transform ${rotation} ${isDiscovered ? '' : 'grayscale opacity-60'}`}>
                {/* Tape */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-white/40 backdrop-blur-sm border border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.1)] transform -rotate-2" />
                
                <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 ${isMythic && isDiscovered ? 'bg-gradient-to-tr from-purple-100 to-amber-100' : 'bg-sky-50'} border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner`}>
                  {isDiscovered ? (
                    <FishGraphic id={fish.id} size={32} />
                  ) : (
                    <div className="text-slate-400 font-serif font-black text-lg">?</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-black truncate text-slate-800 mb-0.5 font-serif flex items-center gap-1">
                    {isDiscovered ? fish.name : 'Unknown'}
                    {isDiscovered && isMythic && <span className="text-amber-500 text-[10px]">⭐</span>}
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 inline-block border border-slate-800 text-slate-900 shadow-[1px_1px_0_0_rgba(0,0,0,0.5)] tracking-wider" style={{ backgroundColor: isDiscovered ? fish.badgeBg : '#e2e8f0' }}>
                    {isDiscovered ? fish.rarity : '???'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-auto pt-2 relative z-10">
          <div className="text-xs font-bold text-slate-500/70 text-center font-serif">PAGE {pageIndex + 1}</div>
        </div>
      </div>
    );
  };

  const pages = Array.from({ length: totalSpreads * 2 }).map((_, i) => getPageContent(i));

  const handleNext = () => {
    if (flippingState || spread >= totalSpreads - 1) return;
    playFishingSound('page', soundEnabled);
    setFlippingState({ isFlipping: true, dir: 1, prevSpread: spread, nextSpread: spread + 1 });
  };

  const handlePrev = () => {
    if (flippingState || spread <= 0) return;
    playFishingSound('page', soundEnabled);
    setFlippingState({ isFlipping: true, dir: -1, prevSpread: spread, nextSpread: spread - 1 });
  };

  const handleAnimationComplete = () => {
    if (flippingState) {
      setSpread(flippingState.nextSpread);
      setFlippingState(null);
    }
  };

  const currentLeft = pages[spread * 2];
  const currentRight = pages[spread * 2 + 1];

  let staticLeft = currentLeft;
  let staticRight = currentRight;

  if (flippingState) {
    if (flippingState.dir === 1) {
      staticLeft = pages[flippingState.prevSpread * 2];
      staticRight = pages[flippingState.nextSpread * 2 + 1];
    } else {
      staticLeft = pages[flippingState.nextSpread * 2];
      staticRight = pages[flippingState.prevSpread * 2 + 1];
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 flex items-center justify-center bg-slate-950/85 z-[300] p-2 sm:p-4 font-mono"
      style={{ perspective: '2000px' }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bg-[#4a2e1b] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#5c3a21] to-[#3a2010] border-[6px] border-black p-2 sm:p-4 w-full max-w-[800px] shadow-[12px_12px_0_0_rgba(0,0,0,1)] relative h-[88vh] max-h-[650px] flex flex-col rounded-sm rounded-r-2xl">
        {/* Golden borders for leather cover */}
        <div className="absolute inset-1.5 sm:inset-2.5 border-[2px] border-[#d4af37] opacity-50 pointer-events-none rounded-r-xl border-dashed" />
        <div className="absolute inset-2.5 sm:inset-4 border-[1px] border-[#d4af37] opacity-30 pointer-events-none rounded-r-lg" />

        {/* Paper edges for depth on the right */}
        <div className="absolute top-8 bottom-8 -right-[12px] w-[12px] bg-[#d1c395] border-y-[4px] border-r-[4px] border-black rounded-r-md z-[-1]" />
        <div className="absolute top-6 bottom-6 -right-[6px] w-[6px] bg-[#e5d9b1] border-y-[4px] border-r-[4px] border-black rounded-r-md z-[0]" />

        {/* Bookmark Ribbon */}
        <div className="absolute -top-1 right-[20%] w-6 sm:w-8 h-24 sm:h-32 bg-red-700 border-x-2 border-b-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] z-10 origin-top" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)' }} />

        <button
          onClick={() => {
            playFishingSound('click', soundEnabled);
            onClose();
          }}
          className="absolute -top-3 -right-3 sm:-top-5 sm:-right-5 bg-red-600 text-white border-[4px] border-black p-1.5 hover:bg-red-500 shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-[350] transition-transform active:scale-95 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 bg-black p-[4px] relative flex shadow-inner z-20 mt-4 sm:mt-2">
          <div className="flex-1 flex bg-[#fef3c7] relative" style={{ transformStyle: 'preserve-3d' }}>
            {/* Static Left Page */}
            <div className="w-1/2 h-full absolute left-0 bg-[#f4ebd0] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-amber-900/10 shadow-[inset_0_0_40px_rgba(139,115,85,0.15)] border-r-[2px] border-black/20 p-2 sm:p-5 overflow-hidden flex flex-col">
              {staticLeft}
            </div>

            {/* Static Right Page */}
            <div className="w-1/2 h-full absolute right-0 bg-[#f4ebd0] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-amber-900/10 shadow-[inset_0_0_40px_rgba(139,115,85,0.15)] border-l-[2px] border-black/20 p-2 sm:p-5 overflow-hidden flex flex-col">
              {staticRight}
            </div>

            {/* Flipping Page */}
            {flippingState && (
              <motion.div
                initial={{ rotateY: flippingState.dir === 1 ? 0 : -180 }}
                animate={{ rotateY: flippingState.dir === 1 ? -180 : 0 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                onAnimationComplete={handleAnimationComplete}
                className="absolute top-0 w-1/2 h-full right-0 z-20 origin-left shadow-[0_0_20px_rgba(0,0,0,0.4)]"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front Side */}
                <div 
                  className="absolute inset-0 bg-[#f4ebd0] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-amber-900/10 shadow-[inset_0_0_40px_rgba(139,115,85,0.15)] border-l-[2px] border-black/20 p-2 sm:p-5 overflow-hidden flex flex-col"
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                  {flippingState.dir === 1 ? pages[flippingState.prevSpread * 2 + 1] : pages[flippingState.nextSpread * 2 + 1]}
                </div>
                {/* Back Side */}
                <div 
                  className="absolute inset-0 bg-[#f4ebd0] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-amber-900/10 shadow-[inset_0_0_40px_rgba(139,115,85,0.15)] border-r-[2px] border-black/20 p-2 sm:p-5 overflow-hidden flex flex-col" 
                  style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                  {flippingState.dir === 1 ? pages[flippingState.nextSpread * 2] : pages[flippingState.prevSpread * 2]}
                </div>
              </motion.div>
            )}

            {/* Center Spine Shadow */}
            <div className="absolute top-0 bottom-0 left-1/2 w-[24px] bg-gradient-to-r from-transparent via-black/30 to-transparent -translate-x-1/2 z-30 pointer-events-none" />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="absolute bottom-4 inset-x-0 flex justify-between px-6 sm:px-10 z-[320] pointer-events-none">
          {spread > 0 ? (
            <button 
              onClick={handlePrev} 
              disabled={!!flippingState}
              className="pointer-events-auto bg-amber-400 text-slate-900 border-[3px] border-black px-3 py-1.5 text-[10px] sm:text-xs font-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-amber-300 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100 cursor-pointer"
            >
              &lt; PREV
            </button>
          ) : <div />}
          {spread < totalSpreads - 1 ? (
            <button 
              onClick={handleNext} 
              disabled={!!flippingState}
              className="pointer-events-auto bg-amber-400 text-slate-900 border-[3px] border-black px-3 py-1.5 text-[10px] sm:text-xs font-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-amber-300 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100 cursor-pointer"
            >
              NEXT &gt;
            </button>
          ) : <div />}
        </div>
      </div>
    </motion.div>
  );
};

const FishingOddsModal: React.FC<{
  equippedRod: string;
  equippedBait: string;
  onClose: () => void;
  soundEnabled?: boolean;
}> = ({ equippedRod, equippedBait, onClose, soundEnabled }) => {
  const currentRod = RODS_DATABASE.find(r => r.id === equippedRod) || RODS_DATABASE[0];
  const currentBait = BAITS_DATABASE.find(b => b.id === equippedBait) || BAITS_DATABASE[0];
  const rates = calculateRarityRates(equippedRod, equippedBait);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-[320] p-4 font-mono"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bg-amber-100 border-[6px] border-black p-5 sm:p-6 w-full max-w-[480px] shadow-[10px_10px_0_0_rgba(0,0,0,1)] relative flex flex-col max-h-[85vh] overflow-y-auto">
        <button
          onClick={() => {
            playFishingSound('click', soundEnabled);
            onClose();
          }}
          className="absolute top-3 right-3 bg-red-600 text-white border-[3px] border-black p-1 hover:bg-red-500 shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 border-b-[3px] border-black pb-2 mb-4 pr-6">
          <BarChart3 className="w-6 h-6 text-blue-700" />
          <h2 className="text-base sm:text-lg font-black text-slate-900">PELUANG IKAN (ODDS)</h2>
        </div>

        {/* Current Equip Buffs */}
        <div className="bg-white border-[3px] border-black p-3 mb-4 space-y-1.5 text-[10px]">
          <div className="font-black text-slate-700 text-[11px] mb-1">PERLENGKAPAN AKTIF:</div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-600">Joran: {currentRod.icon} {currentRod.name}</span>
            <span className="text-emerald-600 font-black">+{Math.round(currentRod.luckBonus * 100)}% Hoki</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-600">Umpan: {currentBait.icon} {currentBait.name}</span>
            <span className="text-purple-600 font-black">+{Math.round(currentBait.mythicBonus * 100)}% Mitos</span>
          </div>
        </div>

        {/* Rates Breakdown */}
        <div className="space-y-2.5 mb-4">
          <div className="bg-white border-[2px] border-black p-2.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400 border border-black" />
              <span className="text-xs font-black text-slate-800">BIASA (Common)</span>
            </div>
            <span className="text-xs font-black text-slate-700 font-mono">{(rates.common * 100).toFixed(1)}%</span>
          </div>

          <div className="bg-sky-50 border-[2px] border-blue-600 p-2.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 border border-black" />
              <span className="text-xs font-black text-blue-800">LANGKA (Rare)</span>
            </div>
            <span className="text-xs font-black text-blue-800 font-mono">{(rates.rare * 100).toFixed(1)}%</span>
          </div>

          <div className="bg-purple-50 border-[2px] border-purple-600 p-2.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500 border border-black" />
              <span className="text-xs font-black text-purple-800">SANGAT LANGKA (Epic)</span>
            </div>
            <span className="text-xs font-black text-purple-800 font-mono">{(rates.epic * 100).toFixed(1)}%</span>
          </div>

          <div className="bg-amber-50 border-[2px] border-amber-600 p-2.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-black animate-pulse" />
              <span className="text-xs font-black text-amber-900">👑 LEGENDARIS</span>
            </div>
            <span className="text-xs font-black text-amber-900 font-mono">{(rates.legendary * 100).toFixed(1)}%</span>
          </div>

          <div className="bg-gradient-to-r from-rose-100 via-amber-100 to-purple-100 border-[3px] border-purple-800 p-2.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 border border-black animate-ping" />
              <span className="text-xs font-black text-purple-950 flex items-center gap-1">
                ⭐ MITOS / DEWA
              </span>
            </div>
            <span className="text-xs font-black text-rose-700 font-mono">{(rates.mythic * 100).toFixed(1)}%</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-600 italic text-center">
          *Gunakan Joran Naga Emas / Trisula Poseidon dan Umpan Bintang Mitos untuk peluang tangkapan dewa tertinggi!
        </p>
      </div>
    </motion.div>
  );
};

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

  const handleEquipRod = (rodId: string) => {
    playFishingSound('click', soundEnabled);
    setEquippedRod(rodId);
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

  const handleEquipBait = (baitId: string) => {
    playFishingSound('click', soundEnabled);
    setEquippedBait(baitId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-[320] p-3 sm:p-4 font-mono"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bg-amber-100 border-[6px] border-black p-4 sm:p-6 w-full max-w-[560px] shadow-[10px_10px_0_0_rgba(0,0,0,1)] relative flex flex-col max-h-[88vh]">
        <button
          onClick={() => {
            playFishingSound('click', soundEnabled);
            onClose();
          }}
          className="absolute top-3 right-3 bg-red-600 text-white border-[3px] border-black p-1 hover:bg-red-500 shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:scale-95 z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between border-b-[3px] border-black pb-2 mb-3 pr-8">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-amber-800" />
            <h2 className="text-sm sm:text-base font-black text-slate-900">TOKO ALAT PANCING</h2>
          </div>
          <div className="bg-amber-200 border-[2px] border-black px-2.5 py-1 flex items-center gap-1 font-black text-xs text-amber-950 shadow-sm">
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
            className={`flex-1 py-2 text-xs font-black border-[3px] border-black transition-all cursor-pointer ${
              tab === 'rods' ? 'bg-amber-400 text-slate-900 shadow-[3px_3px_0_0_rgba(0,0,0,1)]' : 'bg-white text-slate-600 hover:bg-amber-50'
            }`}
          >
            🎣 JORAN PANCING
          </button>
          <button
            onClick={() => {
              playFishingSound('click', soundEnabled);
              setTab('baits');
            }}
            className={`flex-1 py-2 text-xs font-black border-[3px] border-black transition-all cursor-pointer ${
              tab === 'baits' ? 'bg-amber-400 text-slate-900 shadow-[3px_3px_0_0_rgba(0,0,0,1)]' : 'bg-white text-slate-600 hover:bg-amber-50'
            }`}
          >
            🪱 UMPAN IKAN
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0 custom-scrollbar">
          {tab === 'rods' ? (
            RODS_DATABASE.map(rod => {
              const isOwned = ownedRods.includes(rod.id);
              const isEquipped = equippedRod === rod.id;
              const canAfford = coins >= rod.price;

              return (
                <div
                  key={rod.id}
                  className={`bg-white border-[3px] border-black p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                    isEquipped ? 'ring-2 ring-blue-600 bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-50 border-[2px] border-black flex items-center justify-center text-2xl shrink-0">
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
                      <span className="text-xs font-black text-amber-700">🪙 {rod.price}</span>
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
                        onClick={() => handleEquipRod(rod.id)}
                        className="bg-sky-400 hover:bg-sky-300 text-slate-900 text-[10px] font-black px-3 py-1.5 border-[2px] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:scale-95 cursor-pointer"
                      >
                        GUNAKAN
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyRod(rod)}
                        disabled={!canAfford}
                        className={`text-[10px] font-black px-3 py-1.5 border-[2px] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:scale-95 cursor-pointer ${
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
                  className={`bg-white border-[3px] border-black p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                    isEquipped ? 'ring-2 ring-purple-600 bg-purple-50/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-50 border-[2px] border-black flex items-center justify-center text-2xl shrink-0">
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
                      <span className="text-xs font-black text-amber-700">🪙 {bait.price} / 5x</span>
                    )}

                    <div className="flex gap-1.5">
                      {bait.price > 0 && (
                        <button
                          onClick={() => handleBuyBait(bait)}
                          disabled={!canAfford}
                          className={`text-[10px] font-black px-2.5 py-1.5 border-[2px] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:scale-95 cursor-pointer ${
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
                          onClick={() => handleEquipBait(bait.id)}
                          disabled={bait.id !== 'worm' && (baitCounts[bait.id] || 0) <= 0}
                          className="bg-sky-400 hover:bg-sky-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-slate-900 text-[10px] font-black px-2.5 py-1.5 border-[2px] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:scale-95 cursor-pointer"
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

export const FishingGameSection: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
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
  const [coins, setCoins] = useState(150);
  const [caughtCount, setCaughtCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('pagi');
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

  // Equipment & Inventory
  const [equippedRod, setEquippedRod] = useState('bamboo');
  const [ownedRods, setOwnedRods] = useState<string[]>(['bamboo']);
  const [equippedBait, setEquippedBait] = useState('worm');
  const [baitCounts, setBaitCounts] = useState<Record<string, number>>({ pellet: 5, shrimp: 2, star: 0 });

  const [activeUser, setActiveUser] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    if (currentUser) {
      const savedData = localStorage.getItem(`fishing_data_${currentUser.username}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setScore(parsed.score || 0);
          setCoins(parsed.coins !== undefined ? parsed.coins : 150);
          setCaughtCount(parsed.caughtCount || 0);
          setDiscoveredSpecies(parsed.discoveredSpecies || []);
          setEquippedRod(parsed.equippedRod || 'bamboo');
          setOwnedRods(parsed.ownedRods || ['bamboo']);
          setEquippedBait(parsed.equippedBait || 'worm');
          setBaitCounts(parsed.baitCounts || { pellet: 5, shrimp: 2, star: 0 });
        } catch (e) {
          console.error("Failed to parse fishing data", e);
        }
      } else {
        setScore(0);
        setCoins(150);
        setCaughtCount(0);
        setDiscoveredSpecies([]);
        setEquippedRod('bamboo');
        setOwnedRods(['bamboo']);
        setEquippedBait('worm');
        setBaitCounts({ pellet: 5, shrimp: 2, star: 0 });
      }
      setActiveUser(currentUser.username);
    } else {
      setScore(0);
      setCoins(150);
      setCaughtCount(0);
      setDiscoveredSpecies([]);
      setEquippedRod('bamboo');
      setOwnedRods(['bamboo']);
      setEquippedBait('worm');
      setBaitCounts({ pellet: 5, shrimp: 2, star: 0 });
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleResize = () => {
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
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
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

  // Refs for animations & intervals
  const containerRef = useRef<HTMLElement>(null);
  const gameCanvasRef = useRef<HTMLDivElement>(null);
  const rodTipRef = useRef<HTMLDivElement>(null);
  const [rodTipPos, setRodTipPos] = useState({ x: 330, y: 310 });

  const powerRef = useRef(0);
  const powerDirRef = useRef(1);
  const reqRef = useRef<number>(0);
  const reelProgressRef = useRef(0);
  const targetBobberXRef = useRef(400);

  const biteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const escapeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync real-time 2D position of the rod tip with the 800x600 canvas coordinate space
  useEffect(() => {
    let animId: number;
    const updateRodTipPos = () => {
      if (rodTipRef.current && gameCanvasRef.current) {
        const tipRect = rodTipRef.current.getBoundingClientRect();
        const canvasRect = gameCanvasRef.current.getBoundingClientRect();
        if (canvasRect.width > 0) {
          const scaleX = canvasRect.width / 800;
          const scaleY = canvasRect.height / canvasHeight;
          const tipCenterX = (tipRect.left + tipRect.right) / 2;
          const tipCenterY = (tipRect.top + tipRect.bottom) / 2;
          const x = (tipCenterX - canvasRect.left) / scaleX;
          const y = (tipCenterY - canvasRect.top) / scaleY;
          setRodTipPos({ x, y });
        }
      }
      animId = requestAnimationFrame(updateRodTipPos);
    };
    animId = requestAnimationFrame(updateRodTipPos);
    return () => cancelAnimationFrame(animId);
  }, [canvasHeight]);

  // Audio synthesis for retro sound effects
  const playSound = (type: FishingSoundType) => {
    playFishingSound(type, soundEnabled);
  };

  // Cleanups
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

    const animatePower = () => {
      powerRef.current += 2.2 * powerDirRef.current;
      if (powerRef.current >= 100) {
        powerRef.current = 100;
        powerDirRef.current = -1;
      } else if (powerRef.current <= 0) {
        powerRef.current = 0;
        powerDirRef.current = 1;
      }
      setPower(powerRef.current);
      reqRef.current = requestAnimationFrame(animatePower);
    };
    reqRef.current = requestAnimationFrame(animatePower);
  };

  const castLine = () => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);

    playSound('cast');

    // Perfect cast sweet spot (80% - 95%)
    const perfect = power >= 80 && power <= 95;
    setIsPerfectCast(perfect);

    // Target position calculation: X = 350 to 730
    const targetX = 350 + (power / 100) * 380;
    targetBobberXRef.current = targetX;

    setGameState('casting');
    let progress = 0;

    const startX = rodTipPos.x || 330;
    const startY = rodTipPos.y || 310;

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

        // Bait bite wait factor
        const activeBait = BAITS_DATABASE.find(b => b.id === equippedBait) || BAITS_DATABASE[0];
        const biteWaitFactor = Math.max(0.4, 1 - activeBait.biteSpeedBonus * 0.5);
        const waitTime = (Math.random() * 2200 + 1000) * biteWaitFactor;

        biteTimeoutRef.current = setTimeout(() => {
          setGameState(prev => {
            if (prev === 'waiting') {
              playSound('bite');
              triggerSplash(targetX, waterSurfaceY);

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
              }, 1200);
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

      const randomFish = getRandomFish(equippedRod, equippedBait);
      currentFishRef.current = randomFish;

      // Consume 1 special bait
      if (equippedBait !== 'worm') {
        setBaitCounts(prev => {
          const nextCount = Math.max(0, (prev[equippedBait] || 0) - 1);
          if (nextCount === 0) {
            setEquippedBait('worm');
          }
          return { ...prev, [equippedBait]: nextCount };
        });
      }

      // Screen shake on rare/mythic hook
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
      const pullIncrement = 15 * (1 + currentRod.reelSpeedBonus);
      reelProgressRef.current += pullIncrement;

      if (reelProgressRef.current >= 100) {
        reelProgressRef.current = 100;
        const caughtFish = currentFishRef.current;

        setFlashScreen(true);
        setTimeout(() => setFlashScreen(false), 250);

        setCaughtActionUnlocked(false);
        setSellConfirmation(false);

        // Generate dynamic festive particles for celebration
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

        const unlockDelay = caughtFish?.rarity === 'Mitos' ? 2200 : caughtFish?.rarity === 'Legendaris' ? 1500 : 900;
        setTimeout(() => {
          setCaughtActionUnlocked(true);
        }, unlockDelay);

        const basePts = caughtFish?.points || 100;
        const comboBonus = combo * 25;
        const perfectBonus = isPerfectCast ? 50 : 0;
        const totalPts = basePts + comboBonus + perfectBonus;

        const coinMultiplier = equippedRod === 'gold' ? 1.5 : 1.0;
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

  // Reeling decay interval with rod strength bonus
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === 'reeling' && fish) {
      const currentRod = RODS_DATABASE.find(r => r.id === equippedRod) || RODS_DATABASE[0];
      const decayRate = Math.max(0.45, (fish.difficulty * 1.05) * (1 - currentRod.strengthBonus * 0.4));

      interval = setInterval(() => {
        reelProgressRef.current -= decayRate;
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
      }, 40);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState, fish, equippedRod]);

  // Fishing rod bending angle calculation
  let rodAngleDeg = -12;
  if (gameState === 'idle') rodAngleDeg = -15;
  else if (gameState === 'preparing') rodAngleDeg = -62;
  else if (gameState === 'casting') rodAngleDeg = -20 + castProgress * 40;
  else if (gameState === 'biting') rodAngleDeg = -5;
  else if (gameState === 'reeling') rodAngleDeg = -30;
  else rodAngleDeg = -22;

  return (
    <section
      id="fishing"
      className="relative w-full h-[100dvh] z-[100] bg-black flex items-center justify-center select-none touch-none font-mono overflow-hidden"
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

          @keyframes fishSwimRight {
            0% { transform: translateX(-100px) scaleX(-1); }
            100% { transform: translateX(820px) scaleX(-1); }
          }

          @keyframes rayRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
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

          @keyframes rainbowShift {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
          }

          @keyframes shockwaveExpand {
            0% { transform: scale(0.6); opacity: 0.9; }
            100% { transform: scale(2.6); opacity: 0; }
          }

          .animate-water {
            animation: waterWave 1.8s linear infinite;
          }
          .animate-kelp {
            animation: kelpSway 3.2s ease-in-out infinite;
            transform-origin: bottom center;
          }
          .animate-rod-vibrate {
            animation: rodVibrate 0.08s infinite;
          }
          .animate-bobber-float {
            animation: bobberGentleFloat 1.8s ease-in-out infinite;
          }
          .animate-particle-float {
            animation: particleFloatUp 2s ease-out infinite;
          }
          .animate-rainbow-shift {
            animation: rainbowShift 4s linear infinite;
          }
          .animate-shockwave {
            animation: shockwaveExpand 1.6s ease-out infinite;
          }
        `}
      </style>

      {/* Top Header Navigation & Stats */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {/* Top Row: Back Button & Controls */}
        <div className="flex justify-between items-start gap-2">
          <button
            onClick={() => {
              playSound('click');
              navigate('/');
            }}
            className="pointer-events-auto bg-amber-100 text-slate-900 border-[4px] border-black px-3 py-1.5 sm:px-4 sm:py-2 hover:bg-amber-200 flex items-center gap-1.5 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] transition-transform active:translate-y-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[9px] sm:text-[10px] font-bold mt-0.5">BACK</span>
          </button>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 pointer-events-auto">
            {/* Coins Button / Quick Shop */}
            <button
              onClick={() => {
                playSound('click');
                setIsShopOpen(true);
              }}
              className="bg-amber-200 hover:bg-amber-300 text-slate-900 border-[4px] border-black px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1.5 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] transition-transform active:translate-y-1 cursor-pointer"
              title="Buka Toko Alat Pancing"
            >
              <Coins className="w-3.5 h-3.5 text-amber-800" />
              <span className="text-[9px] sm:text-[10px] font-black text-amber-950">{coins}</span>
            </button>

            {/* Shop Button */}
            <button
              onClick={() => {
                playSound('click');
                setIsShopOpen(true);
              }}
              className="bg-amber-100 hover:bg-amber-200 text-slate-900 border-[4px] border-black p-1.5 sm:p-2 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] cursor-pointer"
              title="Toko Alat Pancing (Joran & Umpan)"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-900" />
            </button>

            {/* Odds / Drop Rates Button */}
            <button
              onClick={() => {
                playSound('click');
                setIsOddsOpen(true);
              }}
              className="bg-amber-100 hover:bg-amber-200 text-slate-900 border-[4px] border-black p-1.5 sm:p-2 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] cursor-pointer"
              title="Peluang & Rarity Ikan"
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700" />
            </button>

            {/* Time / Weather Selector */}
            <div className="bg-amber-100 border-[4px] border-black p-0.5 sm:p-1 flex items-center gap-0.5 sm:gap-1 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <button
                onClick={() => {
                  playSound('click');
                  setTimeOfDay('pagi');
                }}
                className={`p-1 sm:p-1.5 text-[9px] font-bold flex items-center gap-1 cursor-pointer ${timeOfDay === 'pagi' ? 'bg-amber-400 border border-black' : 'hover:bg-amber-200'}`}
                title="Pagi Cerah"
              >
                <Sun className="w-3.5 h-3.5 text-amber-700" />
              </button>
              <button
                onClick={() => {
                  playSound('click');
                  setTimeOfDay('senja');
                }}
                className={`p-1 sm:p-1.5 text-[9px] font-bold flex items-center gap-1 cursor-pointer ${timeOfDay === 'senja' ? 'bg-orange-400 text-white border border-black' : 'hover:bg-amber-200'}`}
                title="Senja Keemasan"
              >
                <Flame className="w-3.5 h-3.5 text-orange-800" />
              </button>
              <button
                onClick={() => {
                  playSound('click');
                  setTimeOfDay('malam');
                }}
                className={`p-1 sm:p-1.5 text-[9px] font-bold flex items-center gap-1 cursor-pointer ${timeOfDay === 'malam' ? 'bg-indigo-900 text-amber-300 border border-black' : 'hover:bg-amber-200'}`}
                title="Malam Berbintang"
              >
                <Moon className="w-3.5 h-3.5 text-amber-300" />
              </button>
              <button
                onClick={() => {
                  playSound('click');
                  setTimeOfDay('badai');
                }}
                className={`p-1 sm:p-1.5 text-[9px] font-bold flex items-center gap-1 cursor-pointer ${timeOfDay === 'badai' ? 'bg-slate-800 text-sky-300 border border-black' : 'hover:bg-amber-200'}`}
                title="Badai Petir Hujan"
              >
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
              </button>
            </div>

            <button
              onClick={() => {
                playSound('click');
                toggleFullscreen();
              }}
              className="bg-amber-100 text-slate-900 border-[4px] border-black p-1.5 sm:p-2 hover:bg-amber-200 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            <button
              onClick={() => {
                playSound('page');
                setIsJournalOpen(true);
              }}
              className="bg-amber-100 text-slate-900 border-[4px] border-black p-1.5 sm:p-2 hover:bg-amber-200 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] cursor-pointer"
              title="Jurnal Ikan"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700" />
            </button>

            <button
              onClick={() => {
                if (!soundEnabled) {
                  playFishingSound('click', true);
                }
                setSoundEnabled(!soundEnabled);
              }}
              className="bg-amber-100 text-slate-900 border-[4px] border-black p-1.5 sm:p-2 hover:bg-amber-200 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />}
            </button>
          </div>
        </div>

        {/* Bottom Row: Stats & Equipped Gear */}
        <div className="flex flex-wrap justify-end gap-2 pointer-events-none">
          <div className="bg-amber-100 text-slate-900 border-[4px] border-black px-2.5 py-1.5 sm:px-3.5 sm:py-2 flex items-center gap-1.5 sm:gap-2.5 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] pointer-events-auto">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
            <span className="text-[9px] sm:text-[10px] font-bold">PTS: <span className="text-blue-600">{score}</span></span>
            <span className="text-slate-400">|</span>
            <span className="text-[9px] sm:text-[10px] font-bold">FISH: <span className="text-emerald-700">{caughtCount}</span></span>
            <span className="text-slate-400">|</span>
            <span className="text-[9px] sm:text-[10px] font-bold">
              {RODS_DATABASE.find(r => r.id === equippedRod)?.icon} {RODS_DATABASE.find(r => r.id === equippedRod)?.name.split(' ')[1]}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-purple-700">
              {BAITS_DATABASE.find(b => b.id === equippedBait)?.icon} {equippedBait !== 'worm' ? `(${baitCounts[equippedBait] || 0})` : ''}
            </span>
            {combo > 1 && (
              <>
                <span className="text-slate-400">|</span>
                <span className="text-[9px] sm:text-[10px] font-black text-rose-600 animate-pulse flex items-center gap-0.5">
                  🔥 x{combo}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Meters */}
        <div className="w-full flex justify-center pointer-events-none mt-2">
          <AnimatePresence>
            {gameState === 'preparing' && (
              <motion.div
                key="power-meter"
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                className="bg-amber-100 p-4 border-[4px] border-black w-[90%] max-w-[420px] shadow-[6px_6px_0_0_rgba(0,0,0,1)] pointer-events-none"
              >
                <div className="flex justify-between items-center mb-2 font-black text-xs text-slate-900">
                  <span>POWER LEMPARAN</span>
                  <span className="text-red-600 font-extrabold">{Math.round(power)}%</span>
                </div>
                <div className="w-full h-[26px] bg-slate-900 border-[3px] border-black p-1 relative overflow-hidden">
                  {/* Perfect Cast Sweet Spot Marker (80% - 95%) */}
                  <div className="absolute top-0 bottom-0 left-[80%] w-[15%] bg-yellow-300/30 border-x border-yellow-400 z-10 flex items-center justify-center">
                    <span className="text-[8px] font-black text-yellow-300 tracking-tighter">PERFECT</span>
                  </div>
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-600"
                    style={{ width: `${Math.max(0, Math.min(100, power))}%` }}
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-600 text-center mt-2">LEPAS LAYAR UNTUK MELEMPAR KAIL</p>
              </motion.div>
            )}

            {gameState === 'reeling' && (
              <motion.div
                key="reeling-meter"
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                className="bg-amber-100 p-4 border-[4px] border-black w-[90%] max-w-[420px] shadow-[6px_6px_0_0_rgba(0,0,0,1)] pointer-events-none"
              >
                <div className="flex justify-between items-center mb-2 font-black text-xs text-blue-700 animate-pulse">
                  <span>TARIK! TAP FAST!</span>
                  <span>{Math.round(reelProgress)}%</span>
                </div>
                <div className="w-full h-[26px] bg-slate-900 border-[3px] border-black p-1 relative">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${Math.max(0, Math.min(100, reelProgress))}%` }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main 800x600 Scaled Retro Game Canvas */}
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
        {/* ================= SKY & CELESTIAL BODY ================= */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Sky Gradient Bands according to Time of Day */}
          {timeOfDay === 'pagi' && (
            <>
              <div className="absolute top-0 inset-x-0 bg-[#0284c7]" style={{ bottom: waterHeight + 285 }} />
              <div className="absolute inset-x-0 h-[70px] bg-[#38bdf8]" style={{ bottom: waterHeight + 215 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#7dd3fc]" style={{ bottom: waterHeight + 140 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#bae6fd]" style={{ bottom: waterHeight + 65 }} />
              <div className="absolute inset-x-0 h-[65px] bg-[#e0f2fe]" style={{ bottom: waterHeight }} />
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

              {/* Twinkling Stars */}
              <div className="absolute left-12 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ bottom: waterHeight + 230 }} />
              <div className="absolute left-64 w-2 h-2 bg-amber-200 rounded-full animate-pulse" style={{ bottom: waterHeight + 210 }} />
              <div className="absolute right-96 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDelay: '1s', bottom: waterHeight + 220 }} />
              <div className="absolute right-48 w-2 h-2 bg-amber-100 rounded-full animate-pulse" style={{ animationDelay: '0.5s', bottom: waterHeight + 170 }} />
            </>
          )}

          {timeOfDay === 'badai' && (
            <>
              <div className="absolute top-0 inset-x-0 bg-[#0f172a]" style={{ bottom: waterHeight + 285 }} />
              <div className="absolute inset-x-0 h-[70px] bg-[#1e293b]" style={{ bottom: waterHeight + 215 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#334155]" style={{ bottom: waterHeight + 140 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#475569]" style={{ bottom: waterHeight + 65 }} />
              <div className="absolute inset-x-0 h-[65px] bg-[#64748b]" style={{ bottom: waterHeight }} />

              {/* Storm Rain Streaks */}
              {Array.from({ length: 35 }).map((_, idx) => (
                <div
                  key={idx}
                  className="absolute w-[2px] h-[30px] bg-sky-200/50"
                  style={{
                    left: `${(idx * 24) % 800}px`,
                    top: '-50px',
                    animation: `rainFall ${0.6 + (idx % 4) * 0.15}s linear infinite`,
                    animationDelay: `${(idx * 0.08)}s`,
                  }}
                />
              ))}
            </>
          )}

          {/* Sun / Moon Graphic */}
          <div className="absolute right-[70px]" style={{ bottom: waterHeight + 170 }}>
            {timeOfDay === 'malam' ? (
              <div className="relative">
                <div className="w-[52px] h-[52px] bg-[#FEF08A] rounded-full border-[4px] border-[#FDE047] shadow-[0_0_30px_rgba(254,240,138,0.8)]" />
                <div className="absolute top-2 left-2 w-3 h-3 bg-amber-200/50 rounded-full" />
                <div className="absolute bottom-3 right-3 w-4 h-4 bg-amber-200/40 rounded-full" />
              </div>
            ) : timeOfDay === 'badai' ? (
              <div className="relative">
                <div className="w-[60px] h-[36px] bg-slate-700 rounded-full border-[3px] border-slate-900 shadow-md flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-400 animate-bounce" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className={`w-[52px] h-[52px] border-[4px] ${timeOfDay === 'senja' ? 'bg-[#FF7E47] border-[#EA580C] shadow-[0_0_30px_rgba(234,88,12,0.8)]' : 'bg-[#FEF08A] border-[#FACC15] shadow-[0_0_30px_rgba(253,224,71,0.8)]'}`} />
                <div className="absolute -top-3 left-3 w-[28px] h-[6px] bg-[#FDE047]" />
                <div className="absolute -bottom-3 left-3 w-[28px] h-[6px] bg-[#FDE047]" />
                <div className="absolute top-3 -left-3 w-[6px] h-[28px] bg-[#FDE047]" />
                <div className="absolute top-3 -right-3 w-[6px] h-[28px] bg-[#FDE047]" />
              </div>
            )}
          </div>

          {/* Multi-layered Drifting Parallax Pixel Clouds */}
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

          {/* Flying Pixel Birds */}
          <motion.div
            animate={{ x: [-60, 860], y: [0, -12, 0] }}
            transition={{ x: { duration: 20, repeat: Infinity, ease: 'linear' }, y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
            className="absolute left-0 text-slate-700 text-[10px] font-bold"
            style={{ bottom: waterHeight + 150 }}
          >
            v v
          </motion.div>

          {/* ================= MOUNTAINS & LANDSCAPE ================= */}
          <div className="absolute left-0 w-full h-[140px]" style={{ bottom: waterHeight }}>
            <svg width="800" height="140" className="absolute bottom-0 inset-x-0" shapeRendering="crispEdges">
              {/* Far Mountain 1 */}
              <polygon points="30,140 120,35 210,140" fill="#475569" />
              <polygon points="105,35 120,35 135,35 120,55" fill="#f8fafc" />

              {/* Far Mountain 2 */}
              <polygon points="170,140 295,15 420,140" fill="#334155" />
              <polygon points="275,15 295,15 315,15 295,40" fill="#f8fafc" />

              {/* Far Mountain 3 */}
              <polygon points="440,140 550,45 660,140" fill="#475569" />
              <polygon points="535,45 550,45 565,45 550,65" fill="#f8fafc" />

              {/* Far Mountain 4 */}
              <polygon points="620,140 715,55 810,140" fill="#334155" />
            </svg>

            {/* Midground Hills & Pine Tree Silhouettes */}
            <div className="absolute bottom-0 inset-x-0 h-[40px] bg-[#166534] flex items-end justify-between px-6">
              <div className="w-[110px] h-[22px] bg-[#15803d] rounded-t-lg" />
              <div className="w-[190px] h-[32px] bg-[#15803d] rounded-t-lg" />
              <div className="w-[150px] h-[26px] bg-[#15803d] rounded-t-lg" />
            </div>
          </div>

          {/* Pier Grass Slope (Left side) */}
          <div className="absolute left-0 w-[220px] h-[65px] bg-[#15803d] border-b-[6px] border-[#166534]" style={{ bottom: waterHeight - 10 }}>
            <div className="absolute top-0 inset-x-0 h-[8px] bg-[#22c55e]" />
            <div className="absolute top-[35px] inset-x-0 bottom-0 bg-[#78350f] border-t-[4px] border-[#92400e]" />
            <div className="absolute top-[4px] left-[35px] w-[6px] h-[6px] bg-yellow-300" />
            <div className="absolute top-[2px] left-[90px] w-[6px] h-[6px] bg-rose-400" />
            <div className="absolute top-[5px] left-[150px] w-[6px] h-[6px] bg-amber-300" />
          </div>

          {/* ================= WATER & UNDERWATER ================= */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#0f172a] overflow-hidden" style={{ height: waterHeight }}>
            {/* Animated Waves Layer */}
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

            {/* Shimmer Lines */}
            <div className="absolute top-[20px] left-[220px] w-[70px] h-[4px] bg-sky-200/60" />
            <div className="absolute top-[38px] left-[460px] w-[100px] h-[4px] bg-sky-200/50" />
            <div className="absolute top-[22px] left-[690px] w-[60px] h-[4px] bg-sky-200/60" />

            {/* Underwater Light Shafts (Caustics) */}
            <div className="absolute top-0 left-[300px] w-[80px] h-full bg-gradient-to-b from-sky-200/15 to-transparent -rotate-12 pointer-events-none" />
            <div className="absolute top-0 left-[520px] w-[100px] h-full bg-gradient-to-b from-sky-200/15 to-transparent -rotate-12 pointer-events-none" />

            {/* Submerged Wooden Support Pillars */}
            <div className="absolute top-0 left-[35px] w-[22px] h-[190px] bg-[#451a03] border-r-[3px] border-[#78350f]">
              <div className="absolute bottom-[20px] inset-x-0 h-[30px] bg-emerald-900/80" />
            </div>
            <div className="absolute top-0 left-[115px] w-[22px] h-[210px] bg-[#451a03] border-r-[3px] border-[#78350f]">
              <div className="absolute bottom-[25px] inset-x-0 h-[35px] bg-emerald-900/80" />
            </div>
            <div className="absolute top-0 left-[185px] w-[22px] h-[180px] bg-[#451a03] border-r-[3px] border-[#78350f]">
              <div className="absolute bottom-[10px] inset-x-0 h-[25px] bg-emerald-900/80" />
            </div>

            {/* Seabed Layer */}
            <div className="absolute bottom-0 inset-x-0 h-[30px] bg-[#d97706] border-t-[4px] border-[#b45309]">
              <div className="absolute top-[6px] left-[260px] w-[16px] h-[8px] bg-[#78350f] rounded-t-sm" />
              <div className="absolute top-[10px] left-[430px] w-[20px] h-[10px] bg-[#92400e] rounded-t-sm" />
              <div className="absolute top-[8px] left-[620px] w-[14px] h-[6px] bg-[#fef08a]" />
              {/* Starfish */}
              <div className="absolute top-[12px] left-[500px] w-[10px] h-[10px] bg-rose-500 rotate-12" />
            </div>

            {/* Swaying Underwater Seaweed */}
            <div className="absolute bottom-[26px] left-[270px] w-[10px] h-[65px] bg-emerald-600 animate-kelp rounded-t-full" />
            <div className="absolute bottom-[26px] left-[282px] w-[8px] h-[90px] bg-emerald-500 animate-kelp rounded-t-full" style={{ animationDelay: '0.8s' }} />
            <div className="absolute bottom-[26px] left-[560px] w-[12px] h-[75px] bg-emerald-600 animate-kelp rounded-t-full" style={{ animationDelay: '1.4s' }} />

            {/* Animated Bubbles */}
            <div className="absolute bottom-[30px] left-[310px] w-[6px] h-[6px] rounded-full border border-white/60" style={{ animation: 'floatBubble 4s infinite linear' }} />
            <div className="absolute bottom-[30px] left-[590px] w-[8px] h-[8px] rounded-full border border-white/60" style={{ animation: 'floatBubble 5s infinite linear', animationDelay: '2s' }} />

            {/* Ambient Animated Fish Swimming Underwater */}
            <div
              className="absolute top-[70px] opacity-70 flex items-center gap-1"
              style={{ animation: 'fishSwimLeft 14s linear infinite' }}
            >
              <div className="w-[20px] h-[10px] bg-yellow-400 rounded-full border border-amber-600" />
              <div className="w-[6px] h-[8px] bg-amber-500 clip-triangle" />
            </div>
          </div>

          {/* ================= PIER & FISHERMAN ================= */}
          <div className="absolute left-0 w-[230px] h-[32px] bg-[#78350f] border-y-[4px] border-[#451a03] shadow-[0_6px_0_rgba(0,0,0,0.4)]" style={{ bottom: waterHeight - 30 }}>
            {/* Pier vertical supports going into water */}
            <div className="absolute top-full left-[20px] w-[12px] h-[80px] bg-[#451a03] border-x-[2px] border-[#290f01] opacity-90" />
            <div className="absolute top-full left-[110px] w-[12px] h-[80px] bg-[#451a03] border-x-[2px] border-[#290f01] opacity-90" />
            <div className="absolute top-full left-[200px] w-[12px] h-[80px] bg-[#451a03] border-x-[2px] border-[#290f01] opacity-90" />
            
            <div className="absolute top-0 bottom-0 left-[45px] w-[3px] bg-[#451a03]" />
            <div className="absolute top-0 bottom-0 left-[90px] w-[3px] bg-[#451a03]" />
            <div className="absolute top-0 bottom-0 left-[135px] w-[3px] bg-[#451a03]" />
            <div className="absolute top-0 bottom-0 left-[180px] w-[3px] bg-[#451a03]" />

            {/* Tackle Bucket */}
            <div className="absolute -top-[24px] left-[32px] w-[20px] h-[24px] bg-slate-700 border-[2px] border-black rounded-b-sm">
              <div className="absolute top-[2px] inset-x-[2px] h-[6px] bg-sky-300" />
            </div>
            {/* Tackle Box */}
            <div className="absolute -top-[16px] left-[68px] w-[22px] h-[16px] bg-red-600 border-[2px] border-black">
              <div className="absolute top-[2px] left-[6px] w-[10px] h-[3px] bg-yellow-400" />
            </div>

            {/* Glowing Pier Lantern */}
            <div className="absolute -top-[32px] left-[180px] z-20">
              <div className="w-[12px] h-[4px] bg-amber-900 border border-black mx-auto" />
              <div className="w-[16px] h-[18px] bg-amber-300 border-[2px] border-black relative overflow-hidden shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-pulse">
                <div className="absolute inset-0 bg-yellow-100 opacity-80" />
                <div className="absolute top-1 left-1.5 w-1 h-2 bg-white rounded-full" />
              </div>
              <div className="w-[20px] h-[4px] bg-amber-950 border border-black mx-auto" />
              {/* Light beam glow cone */}
              <div className="absolute top-full -left-6 w-16 h-12 bg-gradient-to-b from-amber-300/30 to-transparent pointer-events-none rounded-b-full" />
            </div>
          </div>

          {/* Fisherman Character */}
          <div className="absolute left-[105px] z-10" style={{ bottom: waterHeight - 5 }}>
            {/* Wooden Stool */}
            <div className="absolute bottom-[0px] left-[10px] w-[28px] h-[18px] bg-[#451a03] border-[2px] border-black">
              <div className="absolute top-[18px] left-[2px] w-[4px] h-[20px] bg-[#451a03]" />
              <div className="absolute top-[18px] right-[2px] w-[4px] h-[20px] bg-[#451a03]" />
            </div>

            {/* Character Body */}
            <div className="absolute bottom-[16px] left-[12px] w-[20px] h-[22px] bg-blue-800 border-[2px] border-black" />
            <div className="absolute bottom-[36px] left-[8px] w-[26px] h-[32px] bg-amber-400 border-[2px] border-black rounded-t-sm">
              <div className="absolute top-[4px] left-[11px] w-[4px] h-[24px] bg-amber-600" />
            </div>

            {/* Head & Cap */}
            <div className="absolute bottom-[66px] left-[10px] w-[22px] h-[20px] bg-amber-200 border-[2px] border-black">
              <div className="absolute top-[6px] right-[4px] w-[3px] h-[3px] bg-black" />
              <div className="absolute bottom-0 inset-x-0 h-[6px] bg-amber-800" />
            </div>
            <div className="absolute bottom-[84px] left-[6px] w-[30px] h-[10px] bg-amber-500 border-[2px] border-black rounded-t-md">
              <div className="absolute bottom-0 right-[-6px] w-[14px] h-[4px] bg-amber-600" />
            </div>

            {/* Reeling Sweat */}
            {gameState === 'reeling' && (
              <div className="absolute -top-[95px] left-[30px] text-sky-400 font-bold text-xs animate-bounce">
                💦
              </div>
            )}

            {/* Fisherman Arm & Fishing Rod */}
            <div
              className={`absolute bottom-[48px] left-[20px] origin-[4px_16px] transition-transform duration-200 ${gameState === 'reeling' ? 'animate-rod-vibrate' : ''}`}
              style={{ transform: `rotate(${rodAngleDeg}deg)` }}
            >
              <div className="w-[20px] h-[8px] bg-amber-400 border-[2px] border-black" />
              <div className="absolute top-0 left-[18px] w-[8px] h-[8px] bg-amber-200 border-[2px] border-black" />
              <div className="absolute top-[-4px] left-[16px] w-[28px] h-[8px] bg-amber-900 border-[2px] border-black" />
              <div className="absolute top-[-8px] left-[26px] w-[10px] h-[10px] bg-slate-300 border-[2px] border-black rounded-full" />

              {/* Flexible Curved Rod with dynamic rod skin color */}
              <div
                className="absolute top-[-3px] left-[42px] w-[165px] h-[4px] border-t border-black shadow-[0_0_4px_rgba(0,0,0,0.5)]"
                style={{
                  backgroundColor: RODS_DATABASE.find(r => r.id === equippedRod)?.color || '#facc15',
                }}
              />
              <div className="absolute top-[-3px] left-[205px] w-[10px] h-[4px] bg-red-600">
                <div ref={rodTipRef} className="absolute top-[2px] right-0 w-[1px] h-[1px] opacity-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ================= REAL-TIME FISHING LINE ================= */}
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

          {/* ================= BOBBER & SPLASH PARTICLES ================= */}
          {(gameState === 'casting' || gameState === 'waiting' || gameState === 'biting' || gameState === 'reeling') && (
            <div
              className={`absolute z-20 flex flex-col items-center justify-center ${gameState === 'waiting' ? 'animate-bobber-float' : ''}`}
              style={{ left: bobberPos.x, top: bobberPos.y, transform: 'translate(-50%, -50%)' }}
            >
              <div className={`relative ${gameState === 'biting' ? 'animate-bounce' : gameState === 'reeling' ? 'animate-[shake_0.15s_infinite]' : ''}`}>
                {/* Water Ripples */}
                {(gameState === 'waiting' || gameState === 'biting') && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38px] h-[10px] border-[2px] border-sky-200 rounded-full animate-ping opacity-75" />
                )}

                {/* Bobber Float Graphic */}
                <div className="w-[10px] h-[4px] bg-yellow-400 mx-auto" />
                <div className="w-[14px] h-[10px] bg-red-600 border-x border-black" />
                <div className="w-[14px] h-[10px] bg-white border-x border-b border-black" />

                {/* Biting Alert Overlay */}
                <AnimatePresence>
                  {gameState === 'biting' && (
                    <motion.div
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1.25, y: -20 }}
                      exit={{ scale: 0 }}
                      className="absolute bottom-[35px] left-1/2 -translate-x-1/2 flex flex-col items-center z-30"
                    >
                      <div className="bg-red-600 text-yellow-300 font-black text-[28px] px-3 py-1 border-[3px] border-black drop-shadow-[4px_4px_0_rgba(0,0,0,1)] animate-pulse">
                        !
                      </div>
                      <div className="text-[9px] font-bold text-white bg-black px-2 py-0.5 mt-1 border border-white whitespace-nowrap">
                        TAP NOW!
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Dynamic Splashes */}
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

          {/* Floating Points & Text Pops */}
          <AnimatePresence>
            {floatingTexts.map(ft => (
              <motion.div
                key={ft.id}
                initial={{ opacity: 0, y: 0, scale: 0.6 }}
                animate={{ opacity: 1, y: -40, scale: 1.1 }}
                exit={{ opacity: 0, y: -70 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute pointer-events-none z-40 text-xs font-black drop-shadow-[2px_2px_0_#000] border border-black bg-black/80 px-2.5 py-1 rounded-sm"
                style={{ left: ft.x, top: ft.y, color: ft.color, transform: 'translate(-50%, -50%)' }}
              >
                {ft.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ================= INTERACTIVE OVERLAYS & MODALS ================= */}
        <AnimatePresence>
          {/* Fishing Journal Modal */}
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

          {/* Odds / Rates Modal */}
          {isOddsOpen && (
            <FishingOddsModal
              key="odds-modal"
              equippedRod={equippedRod}
              equippedBait={equippedBait}
              soundEnabled={soundEnabled}
              onClose={() => setIsOddsOpen(false)}
            />
          )}

          {/* Shop Modal */}
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

          {/* Start Screen Modal */}
          {gameState === 'idle' && !hasStarted && (
            <motion.div
              key="start-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 z-40 p-4"
              onClick={() => {
                unlockAudio();
                playSound('click');
                startPreparing();
              }}
            >
              <div className="bg-amber-100 border-[6px] border-black p-6 sm:p-8 shadow-[10px_10px_0_0_rgba(0,0,0,1)] text-center max-w-[520px] w-full relative mt-6">
                <div className="bg-blue-600 text-white border-[4px] border-black py-2.5 px-6 -mt-10 mx-auto inline-block shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <h1 className="text-[18px] sm:text-[22px] font-black tracking-wider text-yellow-300 drop-shadow-[2px_2px_0_#000]">
                    PIXEL FISHING PRO
                  </h1>
                </div>

                <div className="mt-6 space-y-3 text-[10px] font-bold text-slate-800 text-left bg-amber-50 p-4 border-[3px] border-black leading-relaxed">
                  <p className="flex items-center gap-2">
                    <span className="bg-amber-800 text-white px-2 py-0.5 text-[9px]">1</span>
                    <span>Tahan layar untuk mengisi Power lemparan.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-amber-800 text-white px-2 py-0.5 text-[9px]">2</span>
                    <span>Lepas layar untuk melempar umpan kail.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-amber-800 text-white px-2 py-0.5 text-[9px]">3</span>
                    <span>Tunggu tanda (<span className="text-red-600 font-black text-sm">!</span>) muncul di air.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-amber-800 text-white px-2 py-0.5 text-[9px]">4</span>
                    <span>Segera TAP saat ikan menggigit!</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-amber-800 text-white px-2 py-0.5 text-[9px]">5</span>
                    <span>TAP cepat berulang kali untuk menarik ikan.</span>
                  </p>
                </div>

                <div className="mt-6 bg-blue-600 text-white font-bold text-xs py-3.5 border-[4px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] animate-pulse cursor-pointer">
                  TAP LAYAR UNTUK MULAI
                </div>
              </div>
            </motion.div>
          )}

          {/* Fullscreen Celebration Screen Flash */}
          {flashScreen && (
            <div className="absolute inset-0 bg-white z-[60] pointer-events-none animate-ping" />
          )}

          {/* Catch Result Modal - Ultra Enhanced for High / Mythic / Legendary Rarity */}
          {gameState === 'caught' && fish && fishStats && (
            <motion.div
              key="catch-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-slate-950/92 z-50 p-3 sm:p-4 overflow-hidden"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Organic Celestial Aurora & Nebula Glows (No harsh rotating square) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                {/* Multi-layered soft atmospheric glow */}
                <div
                  className={`w-[520px] h-[520px] rounded-full blur-3xl opacity-60 animate-pulse ${
                    fish.rarity === 'Mitos'
                      ? 'bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-400'
                      : fish.rarity === 'Legendaris'
                      ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-500'
                      : 'bg-gradient-to-tr from-sky-500 to-emerald-400'
                  }`}
                />
                <div
                  className="w-[360px] h-[360px] rounded-full blur-2xl opacity-40 bg-cyan-400 animate-pulse"
                  style={{ animationDelay: '1.2s' }}
                />

                {/* Subtle Ethereal Halo Rings for Mythic/Legendary */}
                {(fish.rarity === 'Mitos' || fish.rarity === 'Legendaris') && (
                  <>
                    <div className="absolute w-[420px] h-[420px] rounded-full border border-amber-400/30 animate-[divineRing_24s_linear_infinite]" />
                    <div className="absolute w-[500px] h-[500px] rounded-full border border-purple-400/20 border-dashed animate-[divineRing_36s_linear_infinite_reverse]" />
                    <div className="absolute w-[300px] h-[300px] rounded-full border-[3px] border-amber-300/40 animate-shockwave" />
                  </>
                )}
              </div>

              {/* Fullscreen Celebration Confetti & Sparkles */}
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

              {/* Main Trophy Card */}
              <motion.div
                initial={{ scale: 0.35, y: 35, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 190 }}
                className={`bg-amber-100 border-[6px] ${
                  fish.rarity === 'Mitos'
                    ? 'border-purple-600 shadow-[0_0_60px_rgba(168,85,247,0.9),0_0_100px_rgba(234,179,8,0.6),10px_10px_0_0_#000]'
                    : fish.rarity === 'Legendaris'
                    ? 'border-amber-500 shadow-[0_0_50px_rgba(234,179,8,0.8),10px_10px_0_0_#000]'
                    : 'border-black shadow-[10px_10px_0_0_rgba(0,0,0,1)]'
                } p-5 sm:p-6 w-full max-w-[440px] text-slate-900 text-center relative z-10 flex flex-col max-h-[580px] overflow-hidden`}
              >
                <div className="relative z-10 flex-1 overflow-y-auto min-h-0 custom-scrollbar pb-2">
                  {/* Grand Banner */}
                  <div
                    className={`py-2.5 px-4 mb-2.5 inline-block shadow-[4px_4px_0_0_rgba(0,0,0,1)] border-[4px] border-black ${
                      fish.rarity === 'Mitos'
                        ? 'bg-gradient-to-r from-purple-800 via-pink-600 to-amber-500 text-white animate-pulse'
                        : fish.rarity === 'Legendaris'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    <h2 className="text-[13px] sm:text-[15px] font-black text-yellow-300 flex items-center justify-center gap-1.5 tracking-wide">
                      {fish.rarity === 'Mitos' ? (
                        <>⭐ 👑 SANG MAHA MITOS DEWA SAMUDRA! 👑 ⭐</>
                      ) : fish.rarity === 'Legendaris' ? (
                        <>👑 🏆 TANGKAPAN LEGENDARIS! 🏆 👑</>
                      ) : (
                        <><Sparkles className="w-5 h-5 text-yellow-300" /> TERTANGKAP!</>
                      )}
                    </h2>
                  </div>

                  {/* Mythic Lore Pill Tag */}
                  {fish.rarity === 'Mitos' && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-950 text-amber-300 border-[2px] border-amber-400 text-[8px] font-black tracking-widest shadow-sm">
                        ⚡ PUSAKA SAMUDRA PURBA (1% ODDS) ⚡
                      </span>
                    </div>
                  )}

                  {/* Fish Showcase Pedestal with Floating Animation */}
                  <div className="flex justify-center my-2">
                    <div
                      className={`w-[140px] h-[140px] border-[4px] ${
                        fish.rarity === 'Mitos'
                          ? 'border-purple-600 bg-gradient-to-tr from-slate-950 via-purple-950 to-indigo-950 shadow-[0_0_35px_rgba(168,85,247,0.9)]'
                          : fish.rarity === 'Legendaris'
                          ? 'border-amber-500 bg-gradient-to-tr from-amber-200 to-yellow-100 shadow-[0_0_25px_rgba(234,179,8,0.8)]'
                          : 'border-black bg-gradient-to-b from-sky-100 to-amber-100'
                      } shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex items-center justify-center p-2 relative overflow-hidden`}
                    >
                      {/* Ambient Caustic Ripples inside Pedestal for Mythic */}
                      {fish.rarity === 'Mitos' && (
                        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-300/30 via-purple-500/20 to-transparent" />
                      )}

                      <motion.div
                        animate={{ y: [-5, 5, -5], rotate: [-4, 4, -4] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="relative z-10"
                      >
                        <FishGraphic id={fish.id} size={115} />
                      </motion.div>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <h3 className="text-[15px] sm:text-[17px] font-black text-slate-900">{fish.name}</h3>
                    <div
                      className="inline-block px-3 py-1 text-slate-900 border-[2px] border-black text-[10px] font-black uppercase tracking-wider"
                      style={{ backgroundColor: fish.badgeBg }}
                    >
                      RARITY: {fish.rarity}
                    </div>
                    <p className="text-[10px] text-slate-700 italic px-2 mt-1 leading-snug">{fish.description}</p>

                    <div className="flex justify-center gap-3 mt-2 text-[10px] font-bold bg-amber-200/80 p-2 border-[2px] border-black">
                      <span>BERAT: <strong className="text-blue-700">{fishStats.weight} kg</strong></span>
                      <span>PANJANG: <strong className="text-blue-700">{fishStats.length} cm</strong></span>
                    </div>

                    <div className="flex justify-center items-center gap-3 mt-2 text-[10px] font-black">
                      <span className="text-emerald-800 bg-emerald-100 px-2.5 py-1 border border-emerald-800 shadow-sm">
                        + {fish.points} PTS
                      </span>
                      <span className="text-amber-900 bg-amber-200 px-2.5 py-1 border border-amber-800 shadow-sm">
                        🪙 +{Math.round(fish.coins * (equippedRod === 'gold' ? 1.5 : 1))} KOIN
                      </span>
                    </div>
                  </div>

                  {/* Accidental Click Protection & Action Area */}
                  {!caughtActionUnlocked ? (
                    <div className="mt-4 py-3 px-4 bg-slate-900 border-[3px] border-amber-400 text-yellow-300 text-[10px] font-black tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                      <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                      <span className="animate-pulse">✨ MEMBUKA KEAJAIBAN TANGKAPAN...</span>
                    </div>
                  ) : sellConfirmation ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3 p-3 bg-red-950/95 border-[3px] border-red-500 text-white space-y-2 shadow-[0_0_25px_rgba(239,68,68,0.7)]"
                    >
                      <div className="flex items-center justify-center gap-1.5 text-red-400 text-[11px] font-black">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>KONFIRMASI JUAL IKAN LANGKA</span>
                      </div>
                      <p className="text-[9px] text-slate-200 leading-snug">
                        Ikan <strong>{fish.name}</strong> ({fish.rarity}) sangat langka dan berharga. Yakin ingin menjualnya seharga <strong>+{Math.round(fish.coins * (equippedRod === 'gold' ? 1.5 : 1))} 🪙</strong>?
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound('click');
                            setSellConfirmation(false);
                          }}
                          className="flex-1 py-2.5 bg-amber-400 text-slate-950 border-[3px] border-black font-black text-[10px] hover:bg-amber-300 shadow-[3px_3px_0_0_#000] cursor-pointer active:translate-y-0.5"
                        >
                          BATAL (SIMPAN)
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound('upgrade');
                            const extraCoins = Math.round(fish.coins * (equippedRod === 'gold' ? 1.5 : 1));
                            setCoins(c => c + extraCoins);
                            triggerFloatingText(`+${extraCoins} 🪙 DIJUAL!`, bobberPos.x, bobberPos.y - 60, '#facc15');
                            setGameState('idle');
                          }}
                          className="flex-1 py-2.5 bg-red-600 text-white border-[3px] border-black font-black text-[10px] hover:bg-red-500 shadow-[3px_3px_0_0_#000] cursor-pointer active:translate-y-0.5"
                        >
                          YA, TETAP JUAL
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 mt-4"
                    >
                      {/* Main Primary Action: SIMPAN KE JURNAL (Gold Pulsating) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playSound('click');
                          setGameState('idle');
                        }}
                        className="flex-1 py-3.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 border-[4px] border-black font-black text-xs hover:brightness-110 transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-1 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4 text-emerald-800" />
                        <span>SIMPAN KE JURNAL</span>
                      </button>

                      {/* Secondary Action: JUAL */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fish.rarity === 'Mitos' || fish.rarity === 'Legendaris') {
                            playSound('click');
                            setSellConfirmation(true);
                          } else {
                            playSound('upgrade');
                            const extraCoins = Math.round(fish.coins * (equippedRod === 'gold' ? 1.5 : 1));
                            setCoins(c => c + extraCoins);
                            triggerFloatingText(`+${extraCoins} 🪙 DIJUAL!`, bobberPos.x, bobberPos.y - 60, '#facc15');
                            setGameState('idle');
                          }
                        }}
                        className="py-3.5 px-3 sm:px-4 bg-emerald-600 text-white border-[4px] border-black font-black text-xs hover:bg-emerald-500 transition-colors shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-1 cursor-pointer flex items-center gap-1"
                      >
                        <Coins className="w-3.5 h-3.5 text-yellow-300" />
                        <span>JUAL (+{Math.round(fish.coins * (equippedRod === 'gold' ? 1.5 : 1))}🪙)</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Escape Result Modal */}
          {gameState === 'escaped' && (
            <motion.div
              key="escape-modal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-50 p-4"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="bg-red-700 border-[6px] border-black p-6 w-full max-w-[420px] text-white shadow-[10px_10px_0_0_rgba(0,0,0,1)] text-center relative">
                <h2 className="text-[20px] font-black mb-4 text-yellow-300 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  IKAN LEPAS...
                </h2>

                <div className="flex justify-center my-4">
                  <div className="w-[90px] h-[90px] border-[4px] border-black bg-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    <AlertCircle className="w-[50px] h-[50px] text-amber-400" />
                  </div>
                </div>

                <div className="text-[10px] font-bold bg-red-900/80 p-3 border-[2px] border-black mb-6 leading-relaxed">
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
                  className="w-full py-3.5 bg-white text-slate-900 border-[4px] border-black font-black text-xs hover:bg-slate-200 transition-colors shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-1 cursor-pointer"
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
