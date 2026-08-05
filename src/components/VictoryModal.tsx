import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, RotateCcw, LogOut, Medal } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  winnerName: string;
  winnerColor?: string;
  subtitle?: string;
  gameTitle?: string;
  isHost?: boolean;
  onPlayAgain?: () => void;
  onLeave?: () => void;
  playAgainText?: string;
  leaveText?: string;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  winnerName,
  winnerColor = '#E195AB',
  subtitle,
  gameTitle = 'Game Over',
  isHost = true,
  onPlayAgain,
  onLeave,
  playAgainText = 'Main Lagi',
  leaveText = 'Kembali ke Lobby',
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti bursts
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#E195AB', '#FFCCE1', '#FFF5D7', '#86efac', '#93c5fd']
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative max-w-sm w-full bg-white border-2 border-[#FFCCE1] p-6 sm:p-8 rounded-[2rem] shadow-xl text-center overflow-hidden flex flex-col items-center z-10"
        >
          {/* Trophy Visual Badge */}
          <div className="relative mb-5">
            <motion.div
              animate={{ y: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="w-20 h-20 sm:w-24 sm:h-24 bg-[#FFF5D7] rounded-2xl flex items-center justify-center shadow-sm border border-[#FFCCE1]"
            >
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-[#E195AB]" />
            </motion.div>
            {/* Crown icon on top */}
            <motion.div
              initial={{ scale: 0, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.15, type: 'spring' }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-white p-1 rounded-full shadow-sm border border-[#FFCCE1] text-[#E195AB]"
            >
              <Crown className="w-4 h-4" />
            </motion.div>
          </div>

          {/* Game Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5D7] text-[#E195AB] font-bold text-xs uppercase tracking-wider mb-2">
            <Medal className="w-3.5 h-3.5" />
            <span>{gameTitle}</span>
          </div>

          {/* Main Victory Title */}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 mb-2">
            KEMENANGAN!
          </h2>

          {/* Winner Name Box */}
          <div className="w-full bg-[#F2F9FF] border border-blue-100 rounded-2xl p-4 my-2 flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pemenang Juara</span>
            <div 
              className="text-xl sm:text-2xl font-black tracking-wide flex items-center justify-center gap-2"
              style={{ color: winnerColor === '#f59e0b' ? '#E195AB' : winnerColor }}
            >
              <span>{winnerName}</span>
            </div>
          </div>

          {/* Subtitle / Details */}
          {subtitle && (
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 mb-5 max-w-xs leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2 mt-2 pt-4 border-t border-slate-100">
            {isHost && onPlayAgain && (
              <button
                onClick={onPlayAgain}
                className="w-full py-3 px-4 rounded-xl bg-[#E195AB] hover:bg-[#D0849A] text-white font-black text-sm transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{playAgainText}</span>
              </button>
            )}
            {onLeave && (
              <button
                onClick={onLeave}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>{leaveText}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
