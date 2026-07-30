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
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative max-w-md w-full bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl text-center overflow-hidden flex flex-col items-center z-10"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Trophy Visual Badge */}
          <div className="relative mb-5">
            <motion.div
              animate={{ y: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-b from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-slate-950" />
              </div>
            </motion.div>

            {/* Crown icon on top */}
            <motion.div
              initial={{ scale: 0, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.15, type: 'spring' }}
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 bg-amber-400 p-1.5 rounded-full shadow-md border-2 border-slate-900 text-slate-950"
            >
              <Crown className="w-5 h-5 fill-slate-950" />
            </motion.div>
          </div>

          {/* Game Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Medal className="w-3.5 h-3.5" />
            <span>{gameTitle}</span>
          </div>

          {/* Main Victory Title */}
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
            KEMENANGAN!
          </h2>

          {/* Winner Name Box */}
          <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 my-2 flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pemenang Juara</span>
            <div 
              className="text-2xl sm:text-3xl font-black tracking-wide flex items-center justify-center gap-2"
              style={{ color: winnerColor || '#f59e0b' }}
            >
              <span>{winnerName}</span>
              <Crown className="w-6 h-6 inline-block" />
            </div>
          </div>

          {/* Subtitle / Details */}
          {subtitle && (
            <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1 mb-5 max-w-xs leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2 pt-4 border-t border-slate-800/80">
            {isHost && onPlayAgain && (
              <button
                onClick={onPlayAgain}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{playAgainText}</span>
              </button>
            )}

            {onLeave && (
              <button
                onClick={onLeave}
                className={`w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-sm border border-slate-700/60 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  !isHost || !onPlayAgain ? 'col-span-full' : ''
                }`}
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
