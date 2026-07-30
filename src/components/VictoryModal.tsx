import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Sparkles, RotateCcw, LogOut, Medal, Star } from 'lucide-react';

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
  winnerColor = '#f59e0b',
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
        origin: { y: 0.7 }
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });

      // Secondary delay fire
      const timer = setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-hidden">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
        />

        {/* Animated Background Rays / Spotlight Effect */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
            className="w-[800px] h-[800px] opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-300 via-amber-500/20 to-transparent blur-2xl"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(15,23,42,0.8)_80%)]" />
        </div>

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative max-w-lg w-full bg-slate-900/95 border-2 border-amber-500/40 p-6 sm:p-8 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.35)] text-center overflow-hidden flex flex-col items-center"
        >
          {/* Top glowing banner highlight */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Crown & Trophy Visual */}
          <div className="relative mb-6">
            <motion.div
              animate={{ y: [-4, 4, -4], rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 p-0.5 shadow-[0_0_40px_rgba(245,158,11,0.6)] flex items-center justify-center transform border-4 border-yellow-200"
            >
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent" />
                <Trophy className="w-14 h-14 sm:w-16 sm:h-16 text-yellow-400 drop-shadow-[0_4px_12px_rgba(250,204,21,0.8)]" />
              </div>
            </motion.div>

            {/* Crown icon on top */}
            <motion.div
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-yellow-300 to-amber-400 p-2 rounded-full shadow-lg border-2 border-white text-slate-950"
            >
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 fill-amber-950 stroke-amber-950" />
            </motion.div>

            {/* Sparkles side icons */}
            <motion.div
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute -left-6 top-1/2 text-yellow-300"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
            <motion.div
              animate={{ scale: [1.2, 0.8, 1.2], opacity: [1, 0.7, 1] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="absolute -right-6 top-1/3 text-amber-400"
            >
              <Star className="w-6 h-6 fill-amber-400" />
            </motion.div>
          </div>

          {/* Game Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xs uppercase tracking-widest mb-3">
            <Medal className="w-3.5 h-3.5" />
            <span>{gameTitle}</span>
          </div>

          {/* Main Victory Title */}
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)] mb-3">
            VICTORY!
          </h2>

          {/* Winner Name Box */}
          <div className="w-full bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 my-2 flex flex-col items-center shadow-inner">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pemenang Utama</span>
            <div 
              className="text-2xl sm:text-3xl font-black tracking-wide drop-shadow-md flex items-center justify-center gap-2"
              style={{ color: winnerColor || '#f59e0b' }}
            >
              <span>{winnerName}</span>
              <Crown className="w-6 h-6 inline-block" />
            </div>
          </div>

          {/* Subtitle / Details */}
          {subtitle && (
            <p className="text-slate-300 text-sm sm:text-base font-medium mt-2 mb-6 max-w-xs leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-2 border-t border-slate-800">
            {isHost && onPlayAgain && (
              <button
                onClick={onPlayAgain}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                <span>{playAgainText}</span>
              </button>
            )}

            {onLeave && (
              <button
                onClick={onLeave}
                className={`w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !isHost || !onPlayAgain ? 'col-span-full' : ''
                }`}
              >
                <LogOut className="w-5 h-5" />
                <span>{leaveText}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
