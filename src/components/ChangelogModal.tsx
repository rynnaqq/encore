import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Gamepad2, AlertTriangle, Bug, ArrowRight, ShieldAlert } from 'lucide-react';

interface BetaNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BetaNoticeModal: React.FC<BetaNoticeModalProps> = ({ isOpen, onClose }) => {
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'linear' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md cursor-pointer transform-gpu z-[99999]"
          />

          {/* Pop-Up Modal Container */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden z-[100000] my-auto text-slate-800 dark:text-slate-100 flex flex-col gpu-smooth transform-gpu"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-amber-200 via-orange-200 to-rose-200 dark:from-amber-950/70 dark:via-slate-900 dark:to-slate-900 relative p-5 sm:p-6 pb-5 shrink-0 border-b border-amber-200 dark:border-slate-800 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                <div className="bg-amber-500 text-slate-950 text-[10px] sm:text-xs font-mono font-black px-3 py-1 rounded-full border border-amber-600 flex items-center gap-1.5 shadow-sm shrink-0">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  <span>EXPERIMENTAL BETA</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center border border-amber-300 dark:border-slate-700 shadow-md transition-all hover:rotate-90 active:scale-90 cursor-pointer shrink-0"
                  aria-label="Tutup Pop Up"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="relative z-10 flex items-center gap-3.5 mt-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/90 dark:bg-amber-500/20 shadow-md flex items-center justify-center shrink-0 border border-amber-500/40">
                  <Gamepad2 className="w-6 h-6 text-slate-950 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Game Masih Tahap Beta
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Pemberitahuan awal untuk pemain Encore
                  </p>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-900/90 space-y-3.5">
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700/50 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-slate-100 block font-bold text-xs mb-0.5">
                    Pengembangan & Uji Coba Aktif
                  </strong>
                  Game di platform Encore (Pixel Fishing Pro, Chess, Snake & Ladders, UNO) sedang dalam tahap uji coba aktif untuk peningkatan fitur & mekanik gameplay.
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0 border border-sky-300 dark:border-sky-700/50 mt-0.5">
                  <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-slate-100 block font-bold text-xs mb-0.5">
                    Penyesuaian Ekonomi & Balancing
                  </strong>
                  Odds kelangkaan, harga beli/jual item, kecepatan reel, dan siklus cuaca dapat disesuaikan sewaktu-waktu selama tahap penyeimbangan.
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-700/50 mt-0.5">
                  <Bug className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-slate-100 block font-bold text-xs mb-0.5">
                    Kritik & Saran Pemain
                  </strong>
                  Jika Anda menemukan bug atau memiliki ide perbaikan, tinggalkan pesan di kolom komentar komunitas pada halaman beranda!
                </div>
              </div>
            </div>

            {/* Footer / CTA */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                Status: Beta Preview v1.3
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-xs hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Mengerti & Mulai Main</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

// Export alias for backwards compatibility
export const ChangelogModal = BetaNoticeModal;

