import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, X, Sliders, Shield, Crown, Sparkles, Zap,
  TrendingUp, RefreshCw, Layers, Lock, Flame, Activity
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { isAdminName } from "../AdminBadge";
import {
  WeatherType,
  AdminOddsConfig,
  calculateRarityRates
} from "../../data/fishDatabase";
import { RODS_DATABASE, BAITS_DATABASE } from "../../data/equipmentDatabase";

export const FishingOddsModal: React.FC<{
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl z-[600] p-2 sm:p-4 font-sans select-none overflow-hidden touch-auto overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          playFishingSound('click', soundEnabled);
          onClose();
        }
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onPointerDown={(e) => e.stopPropagation()}
        className="bg-slate-900/95 border border-slate-700/80 rounded-2xl sm:rounded-3xl w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden text-slate-100 touch-auto"
      >

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black tracking-tight text-white font-sans">
                  Telemetri Probabilitas
                </h2>
                {adminOdds.enabled && (
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> GOD MODE
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium hidden sm:block mt-0.5">
                Peluang tangkapan berbasis kalkulasi joran, umpan, & cuaca
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              playFishingSound('click', soundEnabled);
              onClose();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/40 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
            aria-label="Tutup Odds"
          >
            <X className="w-5 h-5" />
          </button>
        </div>



        {/* Tab Switcher (For Admins) */}
        {isAdmin && (
          <div className="px-5 pt-3 pb-1 bg-slate-950/40 border-b border-slate-800/80 flex gap-2.5 shrink-0">
            <button
              onClick={() => {
                playFishingSound('click', soundEnabled);
                setActiveTab('odds');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'odds'
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Status Probabilitas</span>
            </button>
            <button
              onClick={() => {
                playFishingSound('click', soundEnabled);
                setActiveTab('admin');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Admin God Mode</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {activeTab === 'odds' ? (
            <>
              {/* Active Buffs & Synergies Card */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="font-mono font-bold text-slate-300 text-xs sm:text-sm flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="flex items-center gap-2 text-white">
                    <Activity className="w-4 h-4 text-[#E195AB]" />
                    FAKTOR SINERGI AKTIF
                  </span>
                  <span className="text-cyan-300 uppercase font-mono font-bold">
                    Cuaca: {weather === 'badai' ? '⛈️ Badai' : weather === 'kabut_mistis' ? '🌫️ Kabut Mistis' : weather === 'hujan' ? '🌧️ Hujan' : weather === 'berawan' ? '⛅ Berawan' : '☀️ Cerah'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm font-mono pt-1">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{currentRod.icon}</span>
                      <span className="text-slate-200 font-sans font-semibold truncate">{currentRod.name}</span>
                    </div>
                    <span className="text-emerald-400 font-bold shrink-0">+{Math.round(currentRod.luckBonus * 100)}% Hoki</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{currentBait.icon}</span>
                      <span className="text-slate-200 font-sans font-semibold truncate">{currentBait.name}</span>
                    </div>
                    <span className="text-purple-400 font-bold shrink-0">+{Math.round(currentBait.mythicBonus * 100)}% Mitos</span>
                  </div>
                </div>

                {/* Weather Synergy Hint */}
                <div className="text-xs sm:text-sm text-slate-300 font-sans bg-slate-900/50 rounded-xl p-2.5 border border-slate-800/80 leading-relaxed">
                  {weather === 'badai' && '⚡ Cuaca Badai memicu peningkatan +35% pada peluang Ikan Legendaris & Mitos!'}
                  {weather === 'kabut_mistis' && '🌌 Kabut Mistis memancarkan aura kosmik: +120% peluang Ikan Mitos Purba!'}
                  {weather === 'hujan' && '🌧️ Cuaca Hujan merangsang Ikan Epic (Sangat Langka) naik ke permukaan.'}
                  {weather === 'berawan' && '⛅ Cuaca Berawan seimbang untuk semua jenis spesies air.'}
                  {weather === 'cerah' && '☀️ Cuaca Cerah memberikan visibilitas tinggi & tarikan joran optimal.'}
                </div>
              </div>

              {/* Rarity Tier Gauges */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm font-mono font-bold text-slate-300">
                  <span>Distribusi Probabilitas Tangkapan:</span>
                  <span className="text-slate-400">Total: 100%</span>
                </div>

                {[
                  {
                    label: 'BIASA (Common)',
                    rate: rates.common,
                    gradient: 'from-slate-500 to-slate-400',
                    border: 'border-slate-700',
                    badge: 'bg-slate-800 text-slate-200',
                  },
                  {
                    label: 'LANGKA (Rare)',
                    rate: rates.rare,
                    gradient: 'from-sky-500 to-blue-500',
                    border: 'border-sky-500/40',
                    badge: 'bg-sky-500/20 text-sky-300',
                  },
                  {
                    label: 'EPIC (Sangat Langka)',
                    rate: rates.epic,
                    gradient: 'from-purple-500 to-indigo-500',
                    border: 'border-purple-500/40',
                    badge: 'bg-purple-500/20 text-purple-300',
                  },
                  {
                    label: '👑 LEGENDARIS',
                    rate: rates.legendary,
                    gradient: 'from-amber-400 to-yellow-500',
                    border: 'border-amber-500/40',
                    badge: 'bg-amber-500/20 text-amber-300',
                  },
                  {
                    label: '⭐ MITOS / DEWA',
                    rate: rates.mythic,
                    gradient: 'from-rose-500 via-pink-500 to-purple-500',
                    border: 'border-pink-500/40',
                    badge: 'bg-gradient-to-r from-rose-500/20 to-purple-500/20 text-pink-300 animate-pulse',
                  },
                ].map((tier, idx) => (
                  <div
                    key={idx}
                    className={`bg-slate-950/70 border ${tier.border} rounded-2xl p-3.5 flex flex-col gap-2 shadow-sm`}
                  >
                    <div className="flex justify-between items-center text-xs sm:text-sm font-mono font-bold">
                      <span className={`px-2.5 py-1 rounded-lg ${tier.badge}`}>{tier.label}</span>
                      <span className="text-white text-sm sm:text-base font-black">{(tier.rate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-3 rounded-full border border-slate-800 overflow-hidden p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, tier.rate * 100)}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full bg-gradient-to-r ${tier.gradient} rounded-full shadow-xs`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Catch Projections */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-xs sm:text-sm font-mono text-slate-200 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-2 text-slate-400 font-bold">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Estimasi per 100 lemparan:</span>
                </div>
                <div className="flex items-center gap-2.5 font-bold">
                  <span className="text-slate-400">~{Math.round(rates.common * 100)} Biasa</span>
                  <span className="text-sky-400">~{Math.round(rates.rare * 100)} Langka</span>
                  <span className="text-purple-400">~{Math.round(rates.epic * 100)} Epic</span>
                  <span className="text-amber-400">~{(rates.legendary * 100).toFixed(1)} Leg</span>
                  <span className="text-pink-400">~{(rates.mythic * 100).toFixed(1)} Mitos</span>
                </div>
              </div>
            </>
          ) : (
            /* Admin God Mode Console */
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-amber-500/5">
                <div>
                  <div className="flex items-center gap-2 text-base font-black text-amber-300 font-sans">
                    <Crown className="w-5 h-5 fill-amber-300" />
                    <span>Master Switch: God Mode Admin</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 font-mono">
                    {adminOdds.enabled
                      ? 'Status: Kustom Probabilitas AKTIF (Bypass standar)'
                      : 'Status: Probabilitas Standar Berjalan'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    playFishingSound('upgrade', soundEnabled);
                    setAdminOdds((prev) => ({ ...prev, enabled: !prev.enabled }));
                  }}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-xl border transition-all cursor-pointer active:scale-95 ${
                    adminOdds.enabled
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {adminOdds.enabled ? '✓ AKTIF' : 'NONAKTIF'}
                </button>
              </div>

              {/* Presets */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="text-xs sm:text-sm font-mono font-bold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>PRESET ODDS INSTAN:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs sm:text-sm font-mono">
                  <button
                    onClick={() => applyPreset('god100')}
                    className="p-3 rounded-xl bg-gradient-to-tr from-purple-900/60 to-pink-900/60 hover:from-purple-800 hover:to-pink-800 text-pink-200 border border-pink-500/40 transition-all font-bold cursor-pointer text-center"
                  >
                    🌌 100% MITOS
                  </button>
                  <button
                    onClick={() => applyPreset('mythic50')}
                    className="p-3 rounded-xl bg-gradient-to-tr from-rose-900/60 to-amber-900/60 hover:from-rose-800 hover:to-amber-800 text-amber-200 border border-amber-500/40 transition-all font-bold cursor-pointer text-center"
                  >
                    ⚡ 50% MITOS
                  </button>
                  <button
                    onClick={() => applyPreset('allLegend')}
                    className="p-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 transition-all font-bold cursor-pointer text-center"
                  >
                    👑 ALL-LEGEND
                  </button>
                  <button
                    onClick={() => applyPreset('normal')}
                    className="p-3 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-500/30 transition-all font-bold cursor-pointer text-center"
                  >
                    🎲 NORMAL
                  </button>
                  <button
                    onClick={() => applyPreset('hardcore')}
                    className="p-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition-all font-bold cursor-pointer text-center"
                  >
                    💀 HARDCORE
                  </button>
                  {setCoins && (
                    <button
                      onClick={() => {
                        playFishingSound('upgrade', soundEnabled);
                        setCoins((c) => c + 10000);
                      }}
                      className="p-3 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 transition-all font-bold cursor-pointer text-center"
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
    </motion.div>
  );

};