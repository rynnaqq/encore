import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Gamepad2, AlertTriangle, Bug, ChevronRight, MessageSquareCode } from 'lucide-react';

interface BetaNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BetaNoticeModal: React.FC<BetaNoticeModalProps> = ({ isOpen, onClose }) => {
  const betaItems = [
    {
      badge: 'v1.3-BETA',
      type: 'game',
      title: 'Tahap Uji Coba & Pengembangan Aktif',
      items: [
        'Game (Pixel Fishing Pro, Chess, Snake & Ladders, UNO) saat ini berada dalam tahap Early Access Beta.',
        'Fitur multiplayer, leaderboard, dan sinkronisasi real-time sedang dalam pengujian berkala.',
        'Performa game dioptimalkan secara terus-menerus untuk semua jenis perangkat.',
      ],
      icon: Gamepad2,
      color: 'text-[#E195AB]',
      bg: 'bg-[#FFCCE1]/50',
      border: 'border-[#FFCCE1] dark:border-pink-900/50',
    },
    {
      badge: 'BALANCING',
      type: 'economy',
      title: 'Penyesuaian Nilai Ekonomi & Odds',
      items: [
        'Harga beli/jual joran dan umpan pancing disesuaikan untuk menghadirkan tantangan ekonomi yang seru.',
        'Odds kelangkaan ikan (termasuk buff cuaca & god mode admin) masih dalam tahap tuning.',
        'Data statistik permainan disimpan secara lokal di browser Anda.',
      ],
      icon: Sparkles,
      color: 'text-amber-500',
      bg: 'bg-amber-100',
      border: 'border-amber-200 dark:border-amber-900/50',
    },
    {
      badge: 'FEEDBACK',
      type: 'community',
      title: 'Kritik, Saran & Laporan Bug',
      items: [
        'Jika menemukan glitch, error, atau memiliki saran fitur baru, sampaikan di kolom komentar komunitas.',
        'Setiap masukan dari pemain sangat berharga untuk rilis versi stabil mendatang.',
      ],
      icon: MessageSquareCode,
      color: 'text-indigo-500',
      bg: 'bg-indigo-100',
      border: 'border-indigo-200 dark:border-indigo-900/50',
    },
  ];

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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer transform-gpu z-[99999]"
          />

          {/* Pop-Up Modal Container */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl max-h-[90dvh] bg-white dark:bg-slate-900 border-2 border-[#FFCCE1] dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-[100000] my-auto text-slate-800 dark:text-slate-100 flex flex-col gpu-smooth transform-gpu"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Decorative Banner */}
            <div className="bg-gradient-to-r from-[#FFF5D7] via-[#FFCCE1] to-[#E195AB] dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 relative p-4 sm:p-6 pb-5 sm:pb-6 shrink-0 border-b border-[#FFCCE1] dark:border-slate-800 transition-colors">
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                className="absolute top-2 left-12 text-white/40 dark:text-slate-700/50 pointer-events-none"
              >
                <Gamepad2 className="w-16 h-16" />
              </motion.div>

              <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm text-slate-800 dark:text-slate-100 text-[10px] sm:text-xs font-mono font-bold px-2.5 sm:px-3 py-1 rounded-full border border-white dark:border-slate-700 flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <span className="w-2 h-2 rounded-full bg-[#E195AB] animate-pulse" />
                  <span>Early Access Beta</span>
                </motion.div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center border border-[#FFCCE1] dark:border-slate-700 shadow-md transition-all hover:rotate-90 active:scale-90 cursor-pointer shrink-0"
                  aria-label="Tutup Pop Up"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="relative z-10 flex items-center gap-4 mt-2">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center shrink-0 border border-[#FFCCE1] dark:border-slate-700">
                  <Gamepad2 className="w-6 h-6 text-[#E195AB] dark:text-[#FFCCE1]" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    Game Masih Tahap Beta
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Pemberitahuan awal & panduan bermain di Encore.
                  </p>
                </div>
              </div>
            </div>

            {/* Content Area with Timeline Cards */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900 space-y-5 custom-scrollbar">
              {betaItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    key={item.badge}
                    className="relative pl-6 sm:pl-8 border-l-2 border-[#FFCCE1] dark:border-slate-800 last:border-transparent pb-1 last:pb-0"
                  >
                    <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-[#FFCCE1] dark:border-slate-700 flex items-center justify-center shadow-sm">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-[#FFCCE1] dark:hover:border-slate-600 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2.5 gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${item.bg} dark:bg-slate-700 ${item.color} border ${item.border} dark:border-slate-600`}>
                            {item.badge}
                          </span>
                          <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                            {item.title}
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-1.5">
                        {item.items.map((text, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                            <ChevronRight className="w-3.5 h-3.5 text-[#E195AB] dark:text-[#FFCCE1] shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-[#FFCCE1]/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                Status: Encore Early Access v1.3
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 dark:bg-[#E195AB] text-white text-xs font-bold hover:bg-slate-700 dark:hover:bg-[#d68097] transition-all shadow-md cursor-pointer text-center"
                >
                  Mengerti, Siap Main!
                </motion.button>
              </div>
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


