import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onFinishLoading?: () => void;
}

const PRELOAD_IMAGES = [
  '/assets/images/favicon.png',
  '/board.jpg',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinishLoading }) => {
  const [displayProgress, setDisplayProgress] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const onFinishRef = useRef(onFinishLoading);

  useEffect(() => {
    onFinishRef.current = onFinishLoading;
  }, [onFinishLoading]);

  // Preloading & smooth 60fps interpolation
  useEffect(() => {
    let isMounted = true;
    let targetProgress = 20;
    let currentVal = 0;

    // 1. Check fonts
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        if (isMounted) targetProgress = Math.max(targetProgress, 50);
      }).catch(() => {});
    }

    // 2. Preload images
    const imagePromises = PRELOAD_IMAGES.map((src) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      });
    });

    // 3. Document ready state
    const docReadyPromise = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', () => resolve(), { once: true });
      }
    });

    Promise.all([...imagePromises, docReadyPromise]).then(() => {
      if (isMounted) targetProgress = 100;
    });

    // Smooth animation loop
    let animFrameId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      if (!isMounted) return;

      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Gradually increase target progress smoothly
      if (targetProgress < 100) {
        targetProgress = Math.min(targetProgress + delta * 45, 96);
      }

      // Smooth dampening / lerp
      const diff = targetProgress - currentVal;
      const step = Math.max(0.3, diff * (delta * 6));
      currentVal = Math.min(targetProgress, currentVal + step);
      setDisplayProgress(currentVal);

      if (currentVal >= 99.8 && targetProgress >= 100) {
        setDisplayProgress(100);
        setTimeout(() => {
          if (!isMounted) return;
          setIsCompleted(true);
          setTimeout(() => {
            onFinishRef.current?.();
          }, 400);
        }, 180);
      } else {
        animFrameId = requestAnimationFrame(animate);
      }
    };

    animFrameId = requestAnimationFrame(animate);

    // Fallback safety timeout
    const safetyTimer = setTimeout(() => {
      if (isMounted) targetProgress = 100;
    }, 2000);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animFrameId);
      clearTimeout(safetyTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isCompleted && (
        <motion.div
          key="loading-screen-overlay"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 0.98,
            filter: 'blur(8px)',
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 select-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute w-80 sm:w-96 h-80 sm:h-96 rounded-full blur-[120px] pointer-events-none bg-[#E195AB]/15 dark:bg-[#E195AB]/10" />

          {/* Central Minimalist Container */}
          <div className="relative z-10 flex flex-col items-center max-w-xs w-full text-center">
            
            {/* Logo with Smooth Pulse */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 relative"
            >
              <div className="flex items-center gap-0.5">
                <span className="font-sans text-4xl sm:text-5xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                  Encore
                </span>
                <span className="text-[#E195AB] font-black text-5xl leading-none">
                  .
                </span>
              </div>
            </motion.div>

            {/* Smooth Progress Bar */}
            <div className="w-full space-y-2.5">
              <div className="relative w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#E195AB]"
                  style={{ width: `${displayProgress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.1 }}
                />
              </div>

              {/* Progress Percentage & Status */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 px-0.5">
                <span className="font-medium tracking-wide">Loading...</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {Math.round(displayProgress)}%
                </span>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
