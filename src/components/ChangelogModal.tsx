import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
        'Game (Pixel Fishing Pro, Snake & Ladders, UNO) saat ini berada dalam tahap Early Access Beta.',
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
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer transform-gpu z-[99999]"
          />

          {/* Pop-Up Modal Container */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl max-h-[90dvh] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-[100000] my-auto text-slate-800 dark:text-slate-100 flex flex-col gpu-smooth transform-gpu"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Decorative Banner */}
            <div className="bg-gradient-to-r from-rose-100/80 via-pink-100/60 to-sky-100/60 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-900 relative p-5 sm:p-6 shrink-0 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
                <div className="bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#E195AB]" />
                  <span>Early Access Beta</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xs transition-transform active:scale-90 cursor-pointer shrink-0"
                  aria-label="Tutup Pop Up"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative z-10 flex items-center gap-3.5 mt-2">
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                  <Gamepad2 className="w-5 h-5 text-[#E195AB]" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    Game Masih Tahap Beta
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                    Pemberitahuan awal & panduan bermain di Encore.
                  </p>
                </div>
              </div>
            </div>

            {/* Content Area with Timeline Cards */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900 space-y-4">
              {betaItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                    key={item.badge}
                    className="relative pl-6 sm:pl-7 border-l-2 border-slate-200/80 dark:border-slate-800 last:border-transparent pb-1 last:pb-0"
                  >
                    <div className="absolute -left-[15px] top-0 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                      <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>

                    <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs relative overflow-hidden group hover:border-[#E195AB] dark:hover:border-slate-600 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2.5 gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${item.bg} dark:bg-slate-700 ${item.color} border ${item.border} dark:border-slate-600`}>
                            {item.badge}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            {item.title}
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-1.5">
                        {item.items.map((text, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                            <ChevronRight className="w-3.5 h-3.5 text-[#E195AB] shrink-0 mt-0.5" />
                            <span>{text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Status: Encore Early Access v1.3
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#E195AB] hover:bg-[#d68097] text-white text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
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


