import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag, X, Check, Zap, Sparkles, Coins, Package, Flame
} from "lucide-react";
import { RodItem, BaitItem, RODS_DATABASE, BAITS_DATABASE } from "../../data/equipmentDatabase";
import { playFishingSound } from "../../lib/fishingAudio";

export const FishingShopModal: React.FC<{
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
    setCoins((c) => c - rod.price);
    setOwnedRods((prev) => [...prev, rod.id]);
    setEquippedRod(rod.id);
  };

  const handleBuyBait = (bait: BaitItem, multiplier = 1) => {
    const cost = bait.price * multiplier;
    const amount = 5 * multiplier;
    if (coins < cost) return;
    playFishingSound('upgrade', soundEnabled);
    setCoins((c) => c - cost);
    setBaitCounts((prev) => ({
      ...prev,
      [bait.id]: (prev[bait.id] || 0) + amount,
    }));
    setEquippedBait(bait.id);
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
        className="bg-slate-900/95 border border-slate-700/80 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden text-slate-100 touch-auto"
      >

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black tracking-tight text-white font-sans">
                  Toko Alat Pancing
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/40">
                  Emporium
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium hidden sm:block mt-0.5">
                Tingkatkan joran & stok umpan sakral untuk memburu ikan purba
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Wallet Chip */}
            <div className="bg-amber-400/15 border border-amber-400/40 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 font-mono font-bold text-xs sm:text-sm text-amber-300 shadow-sm">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{coins.toLocaleString()}</span>
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
              aria-label="Tutup Toko"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>



        {/* Category Switcher Tabs */}
        <div className="px-5 pt-3 pb-1 bg-slate-950/40 border-b border-slate-800/80 flex gap-2.5 shrink-0">
          <button
            onClick={() => {
              playFishingSound('click', soundEnabled);
              setTab('rods');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
              tab === 'rods'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span>🎣</span> <span>JORAN PANCING (RODS)</span>
          </button>
          <button
            onClick={() => {
              playFishingSound('click', soundEnabled);
              setTab('baits');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
              tab === 'baits'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span>🪱</span> <span>UMPAN SPESIAL (BAITS)</span>
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
          {tab === 'rods' ? (
            RODS_DATABASE.map((rod) => {
              const isOwned = ownedRods.includes(rod.id);
              const isEquipped = equippedRod === rod.id;
              const canAfford = coins >= rod.price;

              return (
                <div
                  key={rod.id}
                  className={`bg-slate-950/70 border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all relative overflow-hidden ${
                    isEquipped
                      ? 'border-blue-500/60 bg-blue-950/20 ring-1 ring-blue-500/40 shadow-md'
                      : isOwned
                      ? 'border-slate-700/80 hover:border-slate-600'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl shrink-0 shadow-inner"
                      style={{
                        backgroundColor: rod.color + '20',
                        borderColor: rod.color + '60',
                      }}
                    >
                      {rod.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-base sm:text-lg font-black text-white font-sans tracking-tight">
                          {rod.name}
                        </h4>
                        {isEquipped && (
                          <span className="bg-blue-500/20 text-blue-300 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-blue-500/40">
                            DIGUNAKAN
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-relaxed font-sans">
                        {rod.description}
                      </p>

                      {/* Stat Meters */}
                      <div className="grid grid-cols-3 gap-2.5 mt-2.5 text-xs font-mono">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                          <span className="text-slate-400">Tarik</span>
                          <span className="text-cyan-400 font-bold">+{Math.round(rod.reelSpeedBonus * 100)}%</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                          <span className="text-slate-400">Kuat</span>
                          <span className="text-emerald-400 font-bold">+{Math.round(rod.strengthBonus * 100)}%</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                          <span className="text-slate-400">Hoki</span>
                          <span className="text-amber-400 font-bold">+{Math.round(rod.luckBonus * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 shrink-0 border-t sm:border-t-0 border-slate-800 pt-2.5 sm:pt-0">
                    {!isOwned && (
                      <span className="text-base font-mono font-black text-amber-400">
                        🪙 {rod.price.toLocaleString()}
                      </span>
                    )}

                    {isEquipped ? (
                      <button
                        disabled
                        className="bg-blue-600/30 text-blue-300 text-xs sm:text-sm font-mono font-bold px-4 py-2 rounded-xl border border-blue-500/40 cursor-default"
                      >
                        ✓ DIGUNAKAN
                      </button>
                    ) : isOwned ? (
                      <button
                        onClick={() => {
                          playFishingSound('click', soundEnabled);
                          setEquippedRod(rod.id);
                        }}
                        className="bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-300 text-xs sm:text-sm font-mono font-bold px-4 py-2 rounded-xl border border-slate-700 hover:border-sky-400 transition-all cursor-pointer active:scale-95"
                      >
                        GUNAKAN
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyRod(rod)}
                        disabled={!canAfford}
                        className={`text-xs sm:text-sm font-mono font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                          canAfford
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 shadow-md shadow-amber-500/10'
                            : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'BELI JORAN' : `Kurang ${rod.price - coins}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            BAITS_DATABASE.map((bait) => {
              const isEquipped = equippedBait === bait.id;
              const count = bait.id === 'worm' ? '∞' : baitCounts[bait.id] || 0;
              const canAfford5x = coins >= bait.price;
              const canAfford20x = coins >= bait.price * 4;

              return (
                <div
                  key={bait.id}
                  className={`bg-slate-950/70 border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all relative overflow-hidden ${
                    isEquipped
                      ? 'border-purple-500/60 bg-purple-950/20 ring-1 ring-purple-500/40 shadow-md'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                      {bait.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-base sm:text-lg font-black text-white font-sans tracking-tight">
                          {bait.name}
                        </h4>
                        {isEquipped && (
                          <span className="bg-purple-500/20 text-purple-300 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-purple-500/40">
                            AKTIF
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-relaxed font-sans">
                        {bait.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs font-mono">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300">
                          Tersisa: <strong className="text-white font-bold">{count}</strong> {bait.id !== 'worm' ? 'biji' : ''}
                        </div>
                        {bait.rareBonus > 0 && (
                          <div className="bg-sky-950/60 border border-sky-500/30 rounded-xl px-3 py-1.5 text-sky-300 font-bold">
                            +{Math.round(bait.rareBonus * 100)}% Langka
                          </div>
                        )}
                        {bait.mythicBonus > 0 && (
                          <div className="bg-pink-950/60 border border-pink-500/30 rounded-xl px-3 py-1.5 text-pink-300 font-bold">
                            +{Math.round(bait.mythicBonus * 100)}% Mitos
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 shrink-0 border-t sm:border-t-0 border-slate-800 pt-2.5 sm:pt-0">
                    {bait.price > 0 && (
                      <span className="text-sm font-mono font-black text-amber-400">
                        🪙 {bait.price} / 5x
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {bait.price > 0 && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleBuyBait(bait, 1)}
                            disabled={!canAfford5x}
                            className={`text-xs sm:text-sm font-mono font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                              canAfford5x
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300'
                                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                            }`}
                            title="Beli 5 Biji Umpan"
                          >
                            +5x
                          </button>
                          <button
                            onClick={() => handleBuyBait(bait, 4)}
                            disabled={!canAfford20x}
                            className={`text-xs sm:text-sm font-mono font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                              canAfford20x
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
                                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                            }`}
                            title="Beli 20 Biji Umpan (Grosir)"
                          >
                            +20x
                          </button>
                        </div>
                      )}

                      {!isEquipped ? (
                        <button
                          onClick={() => {
                            playFishingSound('click', soundEnabled);
                            setEquippedBait(bait.id);
                          }}
                          disabled={bait.id !== 'worm' && (baitCounts[bait.id] || 0) <= 0}
                          className="bg-slate-800 hover:bg-purple-500 hover:text-white disabled:bg-slate-800 disabled:text-slate-500 text-purple-300 text-xs sm:text-sm font-mono font-bold px-4 py-2 rounded-xl border border-slate-700 hover:border-purple-400 transition-all cursor-pointer active:scale-95"
                        >
                          PAKAI
                        </button>
                      ) : (
                        <button
                          disabled
                          className="bg-purple-600/30 text-purple-300 text-xs sm:text-sm font-mono font-bold px-4 py-2 rounded-xl border border-purple-500/40 cursor-default"
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
      </motion.div>
    </motion.div>

  );
};