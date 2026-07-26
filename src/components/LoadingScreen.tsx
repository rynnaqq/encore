import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingScreenProps {
  onFinishLoading?: () => void;
}

interface IconItem {
  id: string;
  name: string;
  color: string;
  techSvg: React.ReactNode;
}

const LOGO_ITEMS: IconItem[] = [
  {
    id: 'html',
    name: 'HTML5',
    color: '#E34F26',
    techSvg: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path d="M1.5 0h21l-1.91 21.563L11.97 24l-8.564-2.438L1.5 0z" fill="#E34F26" />
        <path d="M11.97 22.078l7.26-2.067 1.63-18.361H11.97v20.428z" fill="#EF652A" />
        <path d="M11.97 8.203H7.558l-.234-2.633h4.646V3.033H4.431l.812 9.133h6.727v-3.963zM11.97 16.535l-.014.004-3.898-1.053-.25-2.793H5.275l.488 5.484 6.207 1.723.003-.001v-3.364z" fill="#ECECEC" />
        <path d="M11.97 8.203v3.963h4.225l-.398 4.372-3.827 1.033v3.364l6.203-1.723.824-9.245H11.97zM11.97 3.033v2.537h7.414l.225-2.537H11.97z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'css',
    name: 'CSS3',
    color: '#1572B6',
    techSvg: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path d="M1.5 0h21l-1.91 21.563L11.97 24l-8.564-2.438L1.5 0z" fill="#1572B6" />
        <path d="M11.97 22.078l7.26-2.067 1.63-18.361H11.97v20.428z" fill="#33A9DC" />
        <path d="M11.97 8.203H7.558l-.234-2.633h4.646V3.033H4.431l.812 9.133h6.727v-3.963zM11.97 16.535l-.014.004-3.898-1.053-.25-2.793H5.275l.488 5.484 6.207 1.723.003-.001v-3.364z" fill="#ECECEC" />
        <path d="M11.97 3.033v2.537h7.414l.225-2.537H11.97zm0 5.17v2.537h4.414l-.225 2.537H11.97v2.537h6.723l.637-7.148H11.97zm0 8.332l3.827-1.033.398-4.372h2.527l-.824 9.245-6.203 1.723v-3.364z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    color: '#F7DF1E',
    techSvg: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <rect width="24" height="24" rx="3" fill="#F7DF1E" />
        <path d="M22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.464.615-.646 1.201-.496.36.105.78.42 1.05.825l2.206-1.396c-.45-.736-1.006-1.29-1.636-1.59-.87-.42-2.116-.48-3.09-.135-.886.315-1.65 1.02-1.74 2.146-.12 1.275.525 2.19 2.026 2.82 1.485.63 1.92.93 1.92 1.575 0 .54-.375.87-1.125.87-.84 0-1.395-.36-1.89-1.08l-2.16 1.41c.735 1.26 1.83 1.89 3.66 1.89 1.875 0 3.255-.84 3.375-2.43.015-.09.015-.18 0-.27zM12.22 18.172c-.225.375-.54.66-.885.84-.51.27-1.245.33-1.89.09-.54-.195-.915-.6-1.02-1.23-.075-.42-.015-.795.165-1.155.33-.63 1.02-.99 1.935-1.035.705-.045 1.275.12 1.695.465v-.195c0-.465-.12-.81-.36-1.02-.33-.27-.87-.33-1.41-.18-.435.12-.825.39-1.095.735l-1.95-1.32c.57-.886 1.485-1.381 2.655-1.47 1.455-.105 2.625.285 3.315 1.11.495.585.705 1.395.705 2.475v4.545h-2.115v-.885z" fill="#000000" />
      </svg>
    ),
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    color: '#3178C6',
    techSvg: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <rect width="24" height="24" rx="3" fill="#3178C6" />
        <path d="M12.641 11.23h-2.734v8.283H6.883v-8.283H4.148V8.384h8.493v2.846zm9.324 5.597c0 2.213-1.63 3.192-3.79 3.192-1.971 0-3.418-.847-4.148-2.072l2.213-1.36c.454.757 1.06 1.151 1.877 1.151.817 0 1.332-.363 1.332-.938 0-.606-.484-.848-1.544-1.287l-.787-.333c-1.574-.666-2.513-1.544-2.513-3.134 0-2.043 1.635-3.133 3.633-3.133 1.74 0 3.013.681 3.754 1.831l-2.089 1.347c-.454-.621-.999-.923-1.665-.923-.621 0-1.105.318-1.105.817 0 .53.378.757 1.362 1.15l.787.333c1.847.788 2.68 1.62 2.68 3.239z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'react',
    name: 'React.js',
    color: '#00D8FF',
    techSvg: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <circle cx="12" cy="12" r="2.3" fill="#00D8FF" />
        <g stroke="#00D8FF" strokeWidth="1.5" fill="none">
          <ellipse cx="12" cy="12" rx="9.5" ry="3.8" />
          <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)" />
        </g>
      </svg>
    ),
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    color: '#06B6D4',
    techSvg: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" fill="#38BDF8" />
      </svg>
    ),
  },
  {
    id: 'vite',
    name: 'Vite',
    color: '#BD34FE',
    techSvg: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path d="M21.82 2.53a.75.75 0 0 0-.84-.11L12.5 6.42 4.02 2.42a.75.75 0 0 0-.95.93l8.03 17.85a.75.75 0 0 0 1.38 0L20.5 3.35a.75.75 0 0 0-.68-.82z" fill="#BD34FE" />
        <path d="M19.3 3.31L12.5 6.52 5.7 3.31l6.8 15.08 6.8-15.08z" fill="#945DD6" opacity="0.5" />
        <path d="M12.5 8.16l6.8-3.21-6.12 13.6-5.48-12.18 4.8 1.79z" fill="#FFC920" />
      </svg>
    ),
  },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinishLoading }) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const onFinishRef = useRef(onFinishLoading);
  useEffect(() => {
    onFinishRef.current = onFinishLoading;
  }, [onFinishLoading]);

  useEffect(() => {
    let isMounted = true;
    let targetProgress = 20;
    let currentDisplay = 0;

    // Preload Fonts
    if ('fonts' in document) {
      document.fonts.ready
        .then(() => {
          if (!isMounted) return;
          targetProgress = 100;
        })
        .catch(() => {
          if (!isMounted) return;
          targetProgress = 100;
        });
    } else {
      targetProgress = 100;
    }

    let animFrameId: number;
    let lastTime = performance.now();

    const updateProgress = (now: number) => {
      if (!isMounted) return;

      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (targetProgress < 100) {
        targetProgress = Math.min(targetProgress + delta * 50, 95);
      }

      if (currentDisplay < targetProgress) {
        const diff = targetProgress - currentDisplay;
        const step = Math.max(0.5, diff * (delta * 6));
        currentDisplay = Math.min(targetProgress, currentDisplay + step);
        setDisplayProgress(currentDisplay);
        animFrameId = requestAnimationFrame(updateProgress);
      } else if (currentDisplay >= 100) {
        setTimeout(() => {
          if (!isMounted) return;
          setIsCompleted(true);
          setTimeout(() => {
            onFinishRef.current?.();
          }, 300);
        }, 200);
      } else {
        animFrameId = requestAnimationFrame(updateProgress);
      }
    };

    animFrameId = requestAnimationFrame(updateProgress);

    const safetyTimeout = setTimeout(() => {
      if (!isMounted) return;
      targetProgress = 100;
    }, 1500);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animFrameId);
      clearTimeout(safetyTimeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isCompleted && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 overflow-hidden select-none bg-[#F2F9FF] text-slate-800"
        >
          {/* Subtle Ambient Backlight Halo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[140px] pointer-events-none bg-[#FFCCE1]/50" />

          {/* Main Horizontal Icons Container */}
          <div className="relative z-10 flex flex-col items-center max-w-2xl w-full space-y-10">
            {/* Horizontal Row of Tech Logos */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-8">
              {LOGO_ITEMS.map((item, index) => {
                const stepSize = 100 / LOGO_ITEMS.length;
                const startPercent = index * stepSize;
                const litRatio = Math.max(0, Math.min(1, (displayProgress - startPercent) / stepSize));
                const isLit = litRatio > 0.1;

                return (
                  <div key={item.id} className="relative flex flex-col items-center">
                    <motion.div
                      animate={{
                        scale: 0.92 + litRatio * 0.18,
                        opacity: 0.35 + litRatio * 0.65,
                        y: isLit ? [0, -10, 0] : 0,
                      }}
                      transition={{ 
                        duration: 0.4, 
                        ease: 'easeOut',
                        y: { repeat: Infinity, duration: 1.2, delay: index * 0.1 },
                      }}
                      className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 relative flex items-center justify-center p-1.5 sm:p-2 rounded-xl border-2 ${
                        isLit
                          ? 'bg-white border-[#FF00E5] shadow-lg'
                          : 'bg-[#FFF5D7] border-[#FFCCE1]'
                      }`}
                      style={{
                        borderColor: isLit ? item.color : undefined,
                        boxShadow: isLit
                          ? `0 4px 15px ${item.color}${Math.round(litRatio * 80).toString(16).padStart(2, '0')}`
                          : undefined,
                      }}
                    >
                      {item.techSvg}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

