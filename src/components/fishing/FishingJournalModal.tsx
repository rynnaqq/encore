import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, X, Trophy, Sparkles, Filter, Search, CheckCircle2,
  ChevronLeft, ChevronRight, Eye, Star, Lock, Award, Fish, Coins
} from "lucide-react";
import { FishType, FISH_DATABASE } from "../../data/fishDatabase";
import { FishGraphic } from "../FishGraphic";
import { playFishingSound } from "../../lib/fishingAudio";

export const FishingJournal: React.FC<{
  score: number;
  caughtCount: number;
  discoveredSpecies: string[];
  soundEnabled?: boolean;
  onClose: () => void;
}> = ({ score, caughtCount, discoveredSpecies, soundEnabled = true, onClose }) => {
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'discovered' | 'locked'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFish, setSelectedFish] = useState<FishType | null>(null);

  const totalSpecies = FISH_DATABASE.length;
  const discoveredCount = discoveredSpecies.length;
  const completionPct = Math.round((discoveredCount / totalSpecies) * 100);

  // Rarity counters
  const rarityStats = {
    Biasa: {
      total: FISH_DATABASE.filter((f) => f.rarity === 'Biasa').length,
      discovered: FISH_DATABASE.filter((f) => f.rarity === 'Biasa' && discoveredSpecies.includes(f.id)).length,
      color: 'from-slate-500 to-slate-600',
      badgeBg: 'bg-slate-700/80 text-slate-200 border-slate-600',
    },
    Langka: {
      total: FISH_DATABASE.filter((f) => f.rarity === 'Langka').length,
      discovered: FISH_DATABASE.filter((f) => f.rarity === 'Langka' && discoveredSpecies.includes(f.id)).length,
      color: 'from-sky-500 to-blue-600',
      badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    },
    'Sangat Langka': {
      total: FISH_DATABASE.filter((f) => f.rarity === 'Sangat Langka').length,
      discovered: FISH_DATABASE.filter((f) => f.rarity === 'Sangat Langka' && discoveredSpecies.includes(f.id)).length,
      color: 'from-purple-500 to-indigo-600',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
    Legendaris: {
      total: FISH_DATABASE.filter((f) => f.rarity === 'Legendaris').length,
      discovered: FISH_DATABASE.filter((f) => f.rarity === 'Legendaris' && discoveredSpecies.includes(f.id)).length,
      color: 'from-amber-400 to-yellow-600',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    Mitos: {
      total: FISH_DATABASE.filter((f) => f.rarity === 'Mitos').length,
      discovered: FISH_DATABASE.filter((f) => f.rarity === 'Mitos' && discoveredSpecies.includes(f.id)).length,
      color: 'from-rose-500 via-pink-500 to-indigo-500',
      badgeBg: 'bg-gradient-to-r from-rose-500/20 to-purple-500/20 text-pink-300 border-pink-500/40',
    },
  };

  const filteredFish = FISH_DATABASE.filter((f) => {
    const isFound = discoveredSpecies.includes(f.id);
    if (filterRarity !== 'all' && f.rarity !== filterRarity) return false;
    if (statusFilter === 'discovered' && !isFound) return false;
    if (statusFilter === 'locked' && isFound) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = f.name.toLowerCase().includes(q);
      const matchRarity = f.rarity.toLowerCase().includes(q);
      const matchDesc = f.description.toLowerCase().includes(q);
      if (!matchName && !matchRarity && !matchDesc) return false;
    }
    return true;
  });

  // Discovered species list for navigation in inspector
  const discoveredList = FISH_DATABASE.filter((f) => discoveredSpecies.includes(f.id));

  const handleNextFish = () => {
    if (!selectedFish || discoveredList.length <= 1) return;
    const currentIndex = discoveredList.findIndex((f) => f.id === selectedFish.id);
    const nextIndex = (currentIndex + 1) % discoveredList.length;
    playFishingSound('page', soundEnabled);
    setSelectedFish(discoveredList[nextIndex]);
  };

  const handlePrevFish = () => {
    if (!selectedFish || discoveredList.length <= 1) return;
    const currentIndex = discoveredList.findIndex((f) => f.id === selectedFish.id);
    const prevIndex = (currentIndex - 1 + discoveredList.length) % discoveredList.length;
    playFishingSound('page', soundEnabled);
    setSelectedFish(discoveredList[prevIndex]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl z-[350] p-2.5 sm:p-4 pt-16 sm:pt-20 font-sans select-none overflow-y-auto"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          playFishingSound('click', soundEnabled);
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onPointerDown={(e) => e.stopPropagation()}
        className="bg-slate-900/95 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[85vh] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden text-slate-100 my-auto"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white font-sans">
                  Jurnal Spesies Samudra
                </h2>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/40">
                  v2.0 Ensiklopedia
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium hidden sm:block mt-0.5">
                Catatan tangkapan lengkap & koleksi fauna perairan Nusantara
              </p>
            </div>
          </div>

          {/* Search Box & Close Button */}
          <div className="flex items-center gap-2.5">
            <div className="relative hidden md:block w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama / kelangkaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#E195AB] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                playFishingSound('click', soundEnabled);
                onClose();
              }}
              className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/40 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
              aria-label="Tutup Jurnal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overview Stats & Telemetry Banner */}
        <div className="bg-slate-950/60 border-b border-slate-800/80 p-3.5 sm:p-5 shrink-0 space-y-3.5">
          {/* 3 Summary Badges & Progress Metric */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Fish className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wide block">Total Tangkapan</span>
                <span className="text-base sm:text-lg font-black text-white font-mono">{caughtCount} ekor</span>
              </div>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wide block">Skor Total</span>
                <span className="text-base sm:text-lg font-black text-amber-400 font-mono">{score.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wide block">Spesies Koleksi</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                  {discoveredCount} <span className="text-xs sm:text-sm text-slate-400 font-medium">/ {totalSpecies}</span>
                </span>
              </div>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-3 flex flex-col justify-center">
              <div className="flex justify-between items-center text-xs font-mono font-bold mb-1.5">
                <span className="text-slate-300 uppercase tracking-wide">Kelengkapan</span>
                <span className="text-pink-400 font-bold text-sm">{completionPct}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-[#E195AB] to-amber-400 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Rarity Tier Mini Progress Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
            {[
              { id: 'Biasa', label: '⚪ Biasa', ...rarityStats.Biasa },
              { id: 'Langka', label: '🔵 Langka', ...rarityStats.Langka },
              { id: 'Sangat Langka', label: '🟣 Epic', ...rarityStats['Sangat Langka'] },
              { id: 'Legendaris', label: '👑 Legend', ...rarityStats.Legendaris },
              { id: 'Mitos', label: '⭐ Mitos', ...rarityStats.Mitos },
            ].map((tier) => {
              const isSelected = filterRarity === tier.id;
              return (
                <button
                  key={tier.id}
                  onClick={() => {
                    playFishingSound('click', soundEnabled);
                    setFilterRarity(filterRarity === tier.id ? 'all' : tier.id);
                  }}
                  className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-[#E195AB] text-white shadow-sm ring-1 ring-[#E195AB]/50'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold">{tier.label}</span>
                  <span className={`font-mono font-bold text-xs ${tier.discovered === tier.total ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {tier.discovered}/{tier.total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Search Bar & Status Filter */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="relative block md:hidden flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama ikan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-8 py-1.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-mono">
            <span className="text-slate-400 mr-1 hidden sm:inline font-bold">Status:</span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'discovered', label: '✓ Ditemukan' },
              { id: 'locked', label: '🔒 Terkunci' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  playFishingSound('click', soundEnabled);
                  setStatusFilter(btn.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
                  statusFilter === btn.id
                    ? 'bg-[#E195AB] text-white border-[#E195AB] shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/80'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fish Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 min-h-[300px] custom-scrollbar">
          {filteredFish.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2.5">
              <Search className="w-10 h-10 text-slate-500 mb-1" />
              <p className="text-base font-bold text-slate-300">Tidak ada spesies yang cocok dengan filter.</p>
              <button
                onClick={() => {
                  setFilterRarity('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="text-sm text-[#E195AB] hover:underline font-mono mt-1 cursor-pointer font-bold"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredFish.map((fishItem) => {
                const isFound = discoveredSpecies.includes(fishItem.id);
                const isSelected = selectedFish?.id === fishItem.id;
                const isMythic = fishItem.rarity === 'Mitos';
                const isLegend = fishItem.rarity === 'Legendaris';
                const isEpic = fishItem.rarity === 'Sangat Langka';

                return (
                  <motion.button
                    key={fishItem.id}
                    whileHover={isFound ? { scale: 1.02, y: -2 } : {}}
                    whileTap={isFound ? { scale: 0.98 } : {}}
                    onClick={() => {
                      if (isFound) {
                        playFishingSound('page', soundEnabled);
                        setSelectedFish(fishItem);
                      }
                    }}
                    className={`text-left p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between overflow-hidden group ${
                      isFound
                        ? isSelected
                          ? 'border-[#E195AB] bg-slate-800/90 ring-2 ring-[#E195AB]/50 shadow-lg shadow-pink-500/10'
                          : isMythic
                          ? 'border-pink-500/60 bg-gradient-to-b from-slate-900 via-slate-800/80 to-pink-950/20 hover:border-pink-400 shadow-md shadow-pink-500/5'
                          : isLegend
                          ? 'border-amber-500/60 bg-gradient-to-b from-slate-900 via-slate-800/80 to-amber-950/20 hover:border-amber-400 shadow-md shadow-amber-500/5'
                          : isEpic
                          ? 'border-purple-500/50 bg-slate-850 hover:border-purple-400 shadow-sm'
                          : 'border-slate-700/80 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600'
                        : 'border-slate-800/60 bg-slate-950/40 opacity-55 cursor-not-allowed'
                    }`}
                  >
                    {/* Top Tier Tag & Sparkle */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider border ${
                          isFound
                            ? isMythic
                              ? 'bg-rose-500/20 text-pink-300 border-pink-500/40'
                              : isLegend
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : isEpic
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : fishItem.rarity === 'Langka'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : 'bg-slate-700/60 text-slate-200 border-slate-600'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {isFound ? fishItem.rarity : '???'}
                      </span>

                      {isFound ? (
                        <div className="flex items-center gap-1">
                          {isMythic && <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />}
                          {isLegend && <Crown className="w-4 h-4 text-amber-400" />}
                          <span className="text-xs font-mono font-bold text-amber-300">
                            🪙 {fishItem.coins}
                          </span>
                        </div>
                      ) : (
                        <Lock className="w-4 h-4 text-slate-500" />
                      )}
                    </div>

                    {/* Fish Graphic Viewport Pedestal */}
                    <div className={`h-22 rounded-xl flex items-center justify-center my-2 relative overflow-hidden transition-colors ${
                      isFound
                        ? isMythic
                          ? 'bg-gradient-to-b from-pink-950/30 to-purple-950/40 border border-pink-500/20'
                          : isLegend
                          ? 'bg-gradient-to-b from-amber-950/30 to-yellow-950/40 border border-amber-500/20'
                          : 'bg-slate-950/60 border border-slate-800/80'
                        : 'bg-slate-950/30 border border-slate-900'
                    }`}>
                      {isFound ? (
                        <div className="transform transition-transform group-hover:scale-110 duration-200">
                          <FishGraphic id={fishItem.id} size={52} />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-600">
                          <span className="text-2xl font-black font-mono">?</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata */}
                    <div className="mt-1">
                      <h4 className="text-sm sm:text-base font-bold text-white truncate font-sans tracking-tight">
                        {isFound ? fishItem.name : 'Spesies Rahasia'}
                      </h4>
                      <div className="flex items-center justify-between text-xs font-mono text-slate-300 mt-1">
                        <span>{isFound ? `+${fishItem.points} PTS` : 'Terkunci'}</span>
                        {isFound && (
                          <span className="text-[#E195AB] font-bold text-xs flex items-center gap-0.5">
                            Detail 🔍
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Expansive Specimen Dossier / Inspection Modal Drawer */}
        <AnimatePresence>
          {selectedFish && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-slate-950/95 border-t border-slate-700/80 p-4 sm:p-6 shrink-0 relative shadow-2xl backdrop-blur-xl z-20"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                {/* Left Pedestal Viewport */}
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 flex items-center justify-center shadow-inner shrink-0 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,149,171,0.15),transparent_70%)]" />
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="relative z-10"
                  >
                    <FishGraphic id={selectedFish.id} size={72} />
                  </motion.div>
                  <span className="absolute bottom-1.5 left-2.5 text-xs font-mono text-slate-400 font-bold">
                    #{selectedFish.id.toUpperCase()}
                  </span>
                </div>

                {/* Center / Right Specimen Metadata */}
                <div className="flex-1 min-w-0 text-left w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-tight font-sans">
                        {selectedFish.name}
                      </h3>
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                          selectedFish.rarity === 'Mitos'
                            ? 'bg-rose-500/20 text-pink-300 border-pink-500/40'
                            : selectedFish.rarity === 'Legendaris'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : selectedFish.rarity === 'Sangat Langka'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : selectedFish.rarity === 'Langka'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : 'bg-slate-800 text-slate-200 border-slate-700'
                        }`}
                      >
                        {selectedFish.rarity}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm font-mono font-bold">
                      <span className="text-amber-400">🪙 {selectedFish.coins} Koin</span>
                      <span className="text-blue-400">+{selectedFish.points} Poin</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mt-1 font-sans">
                    {selectedFish.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3 text-xs sm:text-sm font-mono">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="text-slate-400">Rentang Bobot</span>
                      <span className="text-white font-bold">{selectedFish.minWeight} - {selectedFish.maxWeight} kg</span>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="text-slate-400">Agilitas Ikan</span>
                      <span className="text-pink-400 font-bold">{selectedFish.difficulty}x Speed</span>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between col-span-2 sm:col-span-1">
                      <span className="text-slate-400">Kesulitan</span>
                      <span className="text-amber-300 font-bold text-sm tracking-wider">
                        {'★'.repeat(Math.min(5, Math.ceil(selectedFish.difficulty / 1.6)))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Navigation Deck */}
                <div className="flex sm:flex-col items-center justify-between gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedFish(null)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer self-end sm:self-auto"
                    title="Tutup Detail"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevFish}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors cursor-pointer active:scale-95"
                      title="Spesies Sebelumnya"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextFish}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors cursor-pointer active:scale-95"
                      title="Spesies Berikutnya"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};