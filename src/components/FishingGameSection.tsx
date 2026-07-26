import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fish, AlertCircle, ArrowLeft, Trophy, Sparkles, Volume2, VolumeX, Sun, Moon, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FishGraphic } from './FishGraphic';

type GameState = 'idle' | 'preparing' | 'casting' | 'waiting' | 'biting' | 'reeling' | 'caught' | 'escaped';
type TimeOfDay = 'pagi' | 'senja' | 'malam';

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

interface FishType {
  id: string;
  name: string;
  rarity: 'Biasa' | 'Langka' | 'Sangat Langka' | 'Legendaris';
  color: string;
  secondaryColor: string;
  badgeBg: string;
  difficulty: number;
  minWeight: number;
  maxWeight: number;
  points: number;
  description: string;
}

const FISH_DATABASE: FishType[] = [
  { id: 'shoe', name: 'Sepatu Boots Tua', rarity: 'Biasa', color: '#a8a29e', secondaryColor: '#57534e', badgeBg: '#e7e5e4', difficulty: 0.35, minWeight: 0.3, maxWeight: 0.9, points: 25, description: 'Boot tua basah yang tersangkut di dasar sungai.' },
  { id: 'teri', name: 'Ikan Teri Neon', rarity: 'Biasa', color: '#38bdf8', secondaryColor: '#0284c7', badgeBg: '#e0f2fe', difficulty: 0.6, minWeight: 0.1, maxWeight: 0.4, points: 50, description: 'Ikan hias mungil berkilau biru neon saat terkena cahaya.' },
  { id: 'nila', name: 'Ikan Nila Emas', rarity: 'Biasa', color: '#facc15', secondaryColor: '#ca8a04', badgeBg: '#fef9c3', difficulty: 1.0, minWeight: 0.8, maxWeight: 2.8, points: 100, description: 'Sisiknya kuning berkilau seperti emas murni.' },
  { id: 'lele', name: 'Ikan Lele Raksasa', rarity: 'Langka', color: '#475569', secondaryColor: '#0f172a', badgeBg: '#f1f5f9', difficulty: 1.6, minWeight: 3.5, maxWeight: 8.5, points: 250, description: 'Kumisnya panjang dan perlawanannya sangat sengit!' },
  { id: 'koi', name: 'Ikan Mas Koi Royal', rarity: 'Sangat Langka', color: '#f87171', secondaryColor: '#fef2f2', badgeBg: '#fee2e2', difficulty: 2.3, minWeight: 2.5, maxWeight: 6.0, points: 500, description: 'Simbol keberuntungan bertotol merah putih indah.' },
  { id: 'megalodon', name: 'Hiu Megalodon Purba', rarity: 'Legendaris', color: '#38bdf8', secondaryColor: '#f1f5f9', badgeBg: '#bae6fd', difficulty: 3.2, minWeight: 20.0, maxWeight: 60.0, points: 1200, description: 'Predator samudra purba yang legendaris! Sangat langka.' },
];

const getRandomFish = (): FishType => {
  const rand = Math.random();
  if (rand < 0.48) {
    const biasa = FISH_DATABASE.filter(f => f.rarity === 'Biasa');
    return biasa[Math.floor(Math.random() * biasa.length)];
  } else if (rand < 0.78) {
    const langka = FISH_DATABASE.filter(f => f.rarity === 'Langka');
    return langka[Math.floor(Math.random() * langka.length)];
  } else if (rand < 0.93) {
    const sgtLangka = FISH_DATABASE.filter(f => f.rarity === 'Sangat Langka');
    return sgtLangka[Math.floor(Math.random() * sgtLangka.length)];
  } else {
    const legendaris = FISH_DATABASE.filter(f => f.rarity === 'Legendaris');
    return legendaris[Math.floor(Math.random() * legendaris.length)];
  }
};

export const FishingGameSection: React.FC = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>('idle');
  const [power, setPower] = useState(0);
  const [reelProgress, setReelProgress] = useState(0);
  const [fish, setFish] = useState<FishType | null>(null);
  const [fishStats, setFishStats] = useState<{ weight: string; length: string } | null>(null);
  const [bobberPos, setBobberPos] = useState({ x: 400, y: 380 });
  const [castProgress, setCastProgress] = useState(0);
  const [escapeReason, setEscapeReason] = useState<'early' | 'missed' | 'failed' | null>(null);
  const [scale, setScale] = useState(1);
  const [score, setScore] = useState(0);
  const [caughtCount, setCaughtCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('pagi');
  const [isPerfectCast, setIsPerfectCast] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [splashes, setSplashes] = useState<{ id: number; x: number; y: number }[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  const triggerFloatingText = (text: string, x: number, y: number, color = '#facc15') => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, text, x, y, color }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(item => item.id !== id));
    }, 1200);
  };

  // Refs for animations & intervals
  const containerRef = useRef<HTMLElement>(null);
  const gameCanvasRef = useRef<HTMLDivElement>(null);
  const rodTipRef = useRef<HTMLDivElement>(null);
  const [rodTipPos, setRodTipPos] = useState({ x: 330, y: 310 });

  const powerRef = useRef(0);
  const powerDirRef = useRef(1);
  const reqRef = useRef<number>(0);
  const reelProgressRef = useRef(0);
  const targetBobberXRef = useRef(400);

  const biteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const escapeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync real-time 2D position of the rod tip with the 800x600 canvas coordinate space
  useEffect(() => {
    let animId: number;
    const updateRodTipPos = () => {
      if (rodTipRef.current && gameCanvasRef.current) {
        const tipRect = rodTipRef.current.getBoundingClientRect();
        const canvasRect = gameCanvasRef.current.getBoundingClientRect();
        if (canvasRect.width > 0) {
          const currentScale = canvasRect.width / 800;
          const tipCenterX = (tipRect.left + tipRect.right) / 2;
          const tipCenterY = (tipRect.top + tipRect.bottom) / 2;
          const x = (tipCenterX - canvasRect.left) / currentScale;
          const y = (tipCenterY - canvasRect.top) / currentScale;
          setRodTipPos({ x, y });
        }
      }
      animId = requestAnimationFrame(updateRodTipPos);
    };
    animId = requestAnimationFrame(updateRodTipPos);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Audio synthesis for retro sound effects
  const playSound = (type: 'cast' | 'splash' | 'bite' | 'tap' | 'caught' | 'escape') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'cast') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'splash') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'bite') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'tap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'caught') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(450, now + 0.1);
        osc.frequency.setValueAtTime(600, now + 0.2);
        osc.frequency.setValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'escape') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // Audio fallback silent
    }
  };

  // Screen scale calculator
  useEffect(() => {
    const handleResize = () => {
      const padding = 12;
      const availableWidth = Math.max(280, window.innerWidth - padding);
      const availableHeight = Math.max(200, window.innerHeight - padding);
      const sw = availableWidth / 800;
      const sh = availableHeight / 600;
      setScale(Math.min(sw, sh));
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanups
  useEffect(() => {
    return () => {
      if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);
      if (escapeTimeoutRef.current) clearTimeout(escapeTimeoutRef.current);
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, []);

  const triggerSplash = (x: number, y: number) => {
    const id = Date.now();
    setSplashes(s => [...s, { id, x, y }]);
    setTimeout(() => {
      setSplashes(s => s.filter(p => p.id !== id));
    }, 600);
  };

  const startPreparing = () => {
    setGameState('preparing');
    setPower(0);
    powerRef.current = 0;
    powerDirRef.current = 1;
    setReelProgress(0);
    reelProgressRef.current = 0;
    setFish(null);
    setFishStats(null);
    setEscapeReason(null);

    const animatePower = () => {
      powerRef.current += 2.2 * powerDirRef.current;
      if (powerRef.current >= 100) {
        powerRef.current = 100;
        powerDirRef.current = -1;
      } else if (powerRef.current <= 0) {
        powerRef.current = 0;
        powerDirRef.current = 1;
      }
      setPower(powerRef.current);
      reqRef.current = requestAnimationFrame(animatePower);
    };
    reqRef.current = requestAnimationFrame(animatePower);
  };

  const castLine = () => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);

    playSound('cast');

    // Perfect cast sweet spot (80% - 95%)
    const perfect = power >= 80 && power <= 95;
    setIsPerfectCast(perfect);

    // Target position calculation: X = 350 to 730
    const targetX = 350 + (power / 100) * 380;
    targetBobberXRef.current = targetX;

    setGameState('casting');
    let progress = 0;

    const startX = rodTipPos.x || 330;
    const startY = rodTipPos.y || 310;

    const animateCast = () => {
      progress += 0.045;
      setCastProgress(progress);

      const currentX = startX + (targetX - startX) * progress;
      const peakY = Math.min(startY - 80, 120);
      const currentY = (1 - progress) * (1 - progress) * startY + 2 * (1 - progress) * progress * peakY + progress * progress * 380;

      setBobberPos({ x: currentX, y: currentY });

      if (progress < 1) {
        reqRef.current = requestAnimationFrame(animateCast);
      } else {
        setBobberPos({ x: targetX, y: 380 });
        playSound('splash');
        triggerSplash(targetX, 380);

        if (perfect) {
          triggerFloatingText('PERFECT CAST! ⭐', targetX, 340, '#facc15');
        }

        setGameState('waiting');

        const waitTime = Math.random() * 2500 + 1200;
        biteTimeoutRef.current = setTimeout(() => {
          setGameState(prev => {
            if (prev === 'waiting') {
              playSound('bite');
              triggerSplash(targetX, 380);

              escapeTimeoutRef.current = setTimeout(() => {
                setGameState(curr => {
                  if (curr === 'biting') {
                    playSound('escape');
                    setEscapeReason('missed');
                    setCombo(0);
                    return 'escaped';
                  }
                  return curr;
                });
              }, 1200);
              return 'biting';
            }
            return prev;
          });
        }, waitTime);
      }
    };

    reqRef.current = requestAnimationFrame(animateCast);
  };

  const handlePointerDown = () => {
    if (gameState === 'idle') {
      startPreparing();
    } else if (gameState === 'waiting') {
      if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);
      if (escapeTimeoutRef.current) clearTimeout(escapeTimeoutRef.current);
      playSound('escape');
      setEscapeReason('early');
      setCombo(0);
      setGameState('escaped');
    } else if (gameState === 'biting') {
      if (escapeTimeoutRef.current) clearTimeout(escapeTimeoutRef.current);
      playSound('tap');
      const randomFish = getRandomFish();
      const weightVal = (Math.random() * (randomFish.maxWeight - randomFish.minWeight) + randomFish.minWeight).toFixed(2);
      const lengthVal = (parseFloat(weightVal) * 11 + Math.random() * 6 + 6).toFixed(1);

      setFish(randomFish);
      setFishStats({ weight: weightVal, length: lengthVal });
      setGameState('reeling');
      reelProgressRef.current = 35;
      setReelProgress(35);
    } else if (gameState === 'reeling') {
      playSound('tap');
      triggerSplash(bobberPos.x, bobberPos.y);
      reelProgressRef.current += 15;
      if (reelProgressRef.current >= 100) {
        reelProgressRef.current = 100;
        playSound('caught');
        const basePts = fish?.points || 100;
        const comboBonus = combo * 25;
        const perfectBonus = isPerfectCast ? 50 : 0;
        const totalPts = basePts + comboBonus + perfectBonus;

        setScore(s => s + totalPts);
        setCaughtCount(c => c + 1);
        setCombo(c => c + 1);
        triggerFloatingText(`+${totalPts} PTS!`, bobberPos.x, 320, '#34d399');
        setGameState('caught');
      }
      setReelProgress(reelProgressRef.current);

      const targetX = targetBobberXRef.current;
      const newBobberX = targetX - (reelProgressRef.current / 100) * (targetX - 250);
      setBobberPos({ x: Math.max(250, newBobberX), y: 380 });
    }
  };

  const handlePointerUp = () => {
    if (gameState === 'preparing') {
      castLine();
    }
  };

  // Reeling decay interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === 'reeling' && fish) {
      interval = setInterval(() => {
        reelProgressRef.current -= fish.difficulty * 1.05;
        if (reelProgressRef.current <= 0) {
          reelProgressRef.current = 0;
          playSound('escape');
          setEscapeReason('failed');
          setGameState('escaped');
        }
        setReelProgress(reelProgressRef.current);

        const targetX = targetBobberXRef.current;
        const newBobberX = targetX - (reelProgressRef.current / 100) * (targetX - 250);
        setBobberPos({ x: Math.max(250, newBobberX), y: 380 });
      }, 40);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState, fish]);

  // Fishing rod bending angle calculation
  let rodAngleDeg = -12;
  if (gameState === 'idle') rodAngleDeg = -15;
  else if (gameState === 'preparing') rodAngleDeg = -62;
  else if (gameState === 'casting') rodAngleDeg = -20 + castProgress * 40;
  else if (gameState === 'biting') rodAngleDeg = -5;
  else if (gameState === 'reeling') rodAngleDeg = -30;
  else rodAngleDeg = -22;

  return (
    <section
      id="fishing"
      className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center select-none touch-none font-mono"
      style={{
        fontFamily: '"Press Start 2P", monospace',
        imageRendering: 'pixelated',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
      ref={containerRef}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

          #fishing, #fishing * {
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            user-select: none !important;
            -webkit-user-drag: none !important;
          }

          @keyframes waterWave {
            0% { transform: translateX(0); }
            100% { transform: translateX(-32px); }
          }

          @keyframes kelpSway {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(7deg); }
          }

          @keyframes floatBubble {
            0% { transform: translateY(0) scale(0.8); opacity: 0.8; }
            100% { transform: translateY(-130px) scale(1.3); opacity: 0; }
          }

          @keyframes fishSwimLeft {
            0% { transform: translateX(820px) scaleX(1); }
            100% { transform: translateX(-100px) scaleX(1); }
          }

          @keyframes fishSwimRight {
            0% { transform: translateX(-100px) scaleX(-1); }
            100% { transform: translateX(820px) scaleX(-1); }
          }

          @keyframes rayRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes rodVibrate {
            0%, 100% { transform: rotate(-30deg); }
            50% { transform: rotate(-26deg); }
          }

          @keyframes bobberGentleFloat {
            0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
            50% { transform: translate(-50%, -50%) translateY(4px); }
          }

          .animate-water {
            animation: waterWave 1.8s linear infinite;
          }
          .animate-kelp {
            animation: kelpSway 3.2s ease-in-out infinite;
            transform-origin: bottom center;
          }
          .animate-rod-vibrate {
            animation: rodVibrate 0.08s infinite;
          }
          .animate-bobber-float {
            animation: bobberGentleFloat 1.8s ease-in-out infinite;
          }
        `}
      </style>

      {/* Top Header Navigation & Stats */}
      <div className="absolute top-4 left-4 right-4 z-[200] flex items-center justify-between pointer-events-none">
        <button
          onClick={() => navigate('/')}
          className="pointer-events-auto bg-amber-100 text-slate-900 border-[4px] border-black px-4 py-2 hover:bg-amber-200 flex items-center gap-2 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] transition-transform active:translate-y-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] font-bold mt-0.5">BACK</span>
        </button>

        {/* Time of Day Switcher & Stats */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* Time Selector */}
          <div className="bg-amber-100 border-[4px] border-black p-1 flex items-center gap-1 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <button
              onClick={() => setTimeOfDay('pagi')}
              className={`p-1.5 text-[9px] font-bold flex items-center gap-1 cursor-pointer ${timeOfDay === 'pagi' ? 'bg-amber-400 border border-black' : 'hover:bg-amber-200'}`}
              title="Pagi (Day)"
            >
              <Sun className="w-3.5 h-3.5 text-amber-700" />
            </button>
            <button
              onClick={() => setTimeOfDay('senja')}
              className={`p-1.5 text-[9px] font-bold flex items-center gap-1 cursor-pointer ${timeOfDay === 'senja' ? 'bg-orange-400 text-white border border-black' : 'hover:bg-amber-200'}`}
              title="Senja (Sunset)"
            >
              <Flame className="w-3.5 h-3.5 text-orange-800" />
            </button>
            <button
              onClick={() => setTimeOfDay('malam')}
              className={`p-1.5 text-[9px] font-bold flex items-center gap-1 cursor-pointer ${timeOfDay === 'malam' ? 'bg-indigo-900 text-amber-300 border border-black' : 'hover:bg-amber-200'}`}
              title="Malam (Night)"
            >
              <Moon className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="bg-amber-100 text-slate-900 border-[4px] border-black p-2 hover:bg-amber-200 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-600" />}
          </button>

          <div className="bg-amber-100 text-slate-900 border-[4px] border-black px-3.5 py-2 flex items-center gap-2.5 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-bold">PTS: <span className="text-blue-600">{score}</span></span>
            <span className="text-slate-400">|</span>
            <span className="text-[10px] font-bold">FISH: <span className="text-emerald-700">{caughtCount}</span></span>
            {combo > 1 && (
              <>
                <span className="text-slate-400">|</span>
                <span className="text-[10px] font-black text-rose-600 animate-pulse flex items-center gap-0.5">
                  🔥 x{combo}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main 800x600 Scaled Retro Game Canvas */}
      <div
        ref={gameCanvasRef}
        style={{
          width: 800,
          height: 600,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
        className="relative overflow-hidden shadow-[0_0_0_6px_#000,0_0_0_12px_#38bdf8] shrink-0 bg-sky-300"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* ================= SKY & CELESTIAL BODY ================= */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Sky Gradient Bands according to Time of Day */}
          {timeOfDay === 'pagi' && (
            <>
              <div className="absolute top-0 inset-x-0 h-[65px] bg-[#0284c7]" />
              <div className="absolute top-[65px] inset-x-0 h-[70px] bg-[#38bdf8]" />
              <div className="absolute top-[135px] inset-x-0 h-[75px] bg-[#7dd3fc]" />
              <div className="absolute top-[210px] inset-x-0 h-[75px] bg-[#bae6fd]" />
              <div className="absolute top-[285px] inset-x-0 h-[65px] bg-[#e0f2fe]" />
            </>
          )}

          {timeOfDay === 'senja' && (
            <>
              <div className="absolute top-0 inset-x-0 h-[65px] bg-[#431407]" />
              <div className="absolute top-[65px] inset-x-0 h-[70px] bg-[#7c2d12]" />
              <div className="absolute top-[135px] inset-x-0 h-[75px] bg-[#c2410c]" />
              <div className="absolute top-[210px] inset-x-0 h-[75px] bg-[#f97316]" />
              <div className="absolute top-[285px] inset-x-0 h-[65px] bg-[#fdba74]" />
            </>
          )}

          {timeOfDay === 'malam' && (
            <>
              <div className="absolute top-0 inset-x-0 h-[65px] bg-[#020617]" />
              <div className="absolute top-[65px] inset-x-0 h-[70px] bg-[#0f172a]" />
              <div className="absolute top-[135px] inset-x-0 h-[75px] bg-[#1e1b4b]" />
              <div className="absolute top-[210px] inset-x-0 h-[75px] bg-[#312e81]" />
              <div className="absolute top-[285px] inset-x-0 h-[65px] bg-[#4338ca]" />

              {/* Twinkling Stars */}
              <div className="absolute top-8 left-12 w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              <div className="absolute top-16 left-64 w-2 h-2 bg-amber-200 rounded-full animate-pulse" />
              <div className="absolute top-10 right-96 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDelay: '1s' }} />
              <div className="absolute top-20 right-48 w-2 h-2 bg-amber-100 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            </>
          )}

          {/* Sun / Moon Graphic */}
          <div className="absolute top-[30px] right-[70px]">
            {timeOfDay === 'malam' ? (
              <div className="relative">
                <div className="w-[52px] h-[52px] bg-[#FEF08A] rounded-full border-[4px] border-[#FDE047] shadow-[0_0_30px_rgba(254,240,138,0.8)]" />
                <div className="absolute top-2 left-2 w-3 h-3 bg-amber-200/50 rounded-full" />
                <div className="absolute bottom-3 right-3 w-4 h-4 bg-amber-200/40 rounded-full" />
              </div>
            ) : (
              <div className="relative">
                <div className={`w-[52px] h-[52px] border-[4px] ${timeOfDay === 'senja' ? 'bg-[#FF7E47] border-[#EA580C] shadow-[0_0_30px_rgba(234,88,12,0.8)]' : 'bg-[#FEF08A] border-[#FACC15] shadow-[0_0_30px_rgba(253,224,71,0.8)]'}`} />
                <div className="absolute -top-3 left-3 w-[28px] h-[6px] bg-[#FDE047]" />
                <div className="absolute -bottom-3 left-3 w-[28px] h-[6px] bg-[#FDE047]" />
                <div className="absolute top-3 -left-3 w-[6px] h-[28px] bg-[#FDE047]" />
                <div className="absolute top-3 -right-3 w-[6px] h-[28px] bg-[#FDE047]" />
              </div>
            )}
          </div>

          {/* Multi-layered Drifting Parallax Pixel Clouds */}
          <motion.div
            animate={{ x: [-140, 880] }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            className="absolute top-[30px] left-0 opacity-90"
          >
            <div className="relative">
              <div className="w-[75px] h-[16px] bg-white absolute top-0 left-[20px]" />
              <div className="w-[120px] h-[20px] bg-white absolute top-[16px] left-[0px]" />
              <div className="w-[95px] h-[8px] bg-sky-100 absolute top-[36px] left-[10px]" />
            </div>
          </motion.div>

          <motion.div
            animate={{ x: [-160, 860] }}
            transition={{ duration: 42, repeat: Infinity, ease: 'linear', delay: 10 }}
            className="absolute top-[85px] left-0 opacity-80"
          >
            <div className="relative">
              <div className="w-[55px] h-[14px] bg-white absolute top-0 left-[15px]" />
              <div className="w-[85px] h-[16px] bg-white absolute top-[14px] left-[0px]" />
              <div className="w-[65px] h-[6px] bg-sky-100 absolute top-[30px] left-[10px]" />
            </div>
          </motion.div>

          {/* Flying Pixel Birds */}
          <motion.div
            animate={{ x: [-60, 860], y: [0, -12, 0] }}
            transition={{ x: { duration: 20, repeat: Infinity, ease: 'linear' }, y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
            className="absolute top-[75px] left-0 text-slate-700 text-[10px] font-bold"
          >
            v v
          </motion.div>

          {/* ================= MOUNTAINS & LANDSCAPE ================= */}
          <div className="absolute bottom-[230px] left-0 w-full h-[140px]">
            <svg width="800" height="140" className="absolute bottom-0 inset-x-0" shapeRendering="crispEdges">
              {/* Far Mountain 1 */}
              <polygon points="30,140 120,35 210,140" fill="#475569" />
              <polygon points="105,35 120,35 135,35 120,55" fill="#f8fafc" />

              {/* Far Mountain 2 */}
              <polygon points="170,140 295,15 420,140" fill="#334155" />
              <polygon points="275,15 295,15 315,15 295,40" fill="#f8fafc" />

              {/* Far Mountain 3 */}
              <polygon points="440,140 550,45 660,140" fill="#475569" />
              <polygon points="535,45 550,45 565,45 550,65" fill="#f8fafc" />

              {/* Far Mountain 4 */}
              <polygon points="620,140 715,55 810,140" fill="#334155" />
            </svg>

            {/* Midground Hills & Pine Tree Silhouettes */}
            <div className="absolute bottom-0 inset-x-0 h-[40px] bg-[#166534] flex items-end justify-between px-6">
              <div className="w-[110px] h-[22px] bg-[#15803d] rounded-t-lg" />
              <div className="w-[190px] h-[32px] bg-[#15803d] rounded-t-lg" />
              <div className="w-[150px] h-[26px] bg-[#15803d] rounded-t-lg" />
            </div>
          </div>

          {/* Pier Grass Slope (Left side) */}
          <div className="absolute bottom-[220px] left-0 w-[220px] h-[65px] bg-[#15803d] border-b-[6px] border-[#166534]">
            <div className="absolute top-0 inset-x-0 h-[8px] bg-[#22c55e]" />
            <div className="absolute top-[35px] inset-x-0 bottom-0 bg-[#78350f] border-t-[4px] border-[#92400e]" />
            <div className="absolute top-[4px] left-[35px] w-[6px] h-[6px] bg-yellow-300" />
            <div className="absolute top-[2px] left-[90px] w-[6px] h-[6px] bg-rose-400" />
            <div className="absolute top-[5px] left-[150px] w-[6px] h-[6px] bg-amber-300" />
          </div>

          {/* ================= WATER & UNDERWATER ================= */}
          <div className="absolute bottom-0 left-0 w-full h-[230px] bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#0f172a] overflow-hidden">
            {/* Animated Waves Layer */}
            <div className="absolute top-0 inset-x-0 h-[10px] bg-[#38bdf8]/90 flex overflow-hidden">
              <div className="w-[832px] h-full flex animate-water">
                {Array.from({ length: 26 }).map((_, i) => (
                  <div key={i} className="w-[32px] h-full flex">
                    <div className="w-[16px] h-full bg-[#7dd3fc]" />
                    <div className="w-[16px] h-full bg-[#0284c7]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Shimmer Lines */}
            <div className="absolute top-[20px] left-[220px] w-[70px] h-[4px] bg-sky-200/60" />
            <div className="absolute top-[38px] left-[460px] w-[100px] h-[4px] bg-sky-200/50" />
            <div className="absolute top-[22px] left-[690px] w-[60px] h-[4px] bg-sky-200/60" />

            {/* Underwater Light Shafts (Caustics) */}
            <div className="absolute top-0 left-[300px] w-[80px] h-full bg-gradient-to-b from-sky-200/15 to-transparent -rotate-12 pointer-events-none" />
            <div className="absolute top-0 left-[520px] w-[100px] h-full bg-gradient-to-b from-sky-200/15 to-transparent -rotate-12 pointer-events-none" />

            {/* Submerged Wooden Support Pillars */}
            <div className="absolute top-0 left-[35px] w-[22px] h-[190px] bg-[#451a03] border-r-[3px] border-[#78350f]">
              <div className="absolute bottom-[20px] inset-x-0 h-[30px] bg-emerald-900/80" />
            </div>
            <div className="absolute top-0 left-[115px] w-[22px] h-[210px] bg-[#451a03] border-r-[3px] border-[#78350f]">
              <div className="absolute bottom-[25px] inset-x-0 h-[35px] bg-emerald-900/80" />
            </div>
            <div className="absolute top-0 left-[185px] w-[22px] h-[180px] bg-[#451a03] border-r-[3px] border-[#78350f]">
              <div className="absolute bottom-[10px] inset-x-0 h-[25px] bg-emerald-900/80" />
            </div>

            {/* Seabed Layer */}
            <div className="absolute bottom-0 inset-x-0 h-[30px] bg-[#d97706] border-t-[4px] border-[#b45309]">
              <div className="absolute top-[6px] left-[260px] w-[16px] h-[8px] bg-[#78350f] rounded-t-sm" />
              <div className="absolute top-[10px] left-[430px] w-[20px] h-[10px] bg-[#92400e] rounded-t-sm" />
              <div className="absolute top-[8px] left-[620px] w-[14px] h-[6px] bg-[#fef08a]" />
              {/* Starfish */}
              <div className="absolute top-[12px] left-[500px] w-[10px] h-[10px] bg-rose-500 rotate-12" />
            </div>

            {/* Swaying Underwater Seaweed */}
            <div className="absolute bottom-[26px] left-[270px] w-[10px] h-[65px] bg-emerald-600 animate-kelp rounded-t-full" />
            <div className="absolute bottom-[26px] left-[282px] w-[8px] h-[90px] bg-emerald-500 animate-kelp rounded-t-full" style={{ animationDelay: '0.8s' }} />
            <div className="absolute bottom-[26px] left-[560px] w-[12px] h-[75px] bg-emerald-600 animate-kelp rounded-t-full" style={{ animationDelay: '1.4s' }} />

            {/* Animated Bubbles */}
            <div className="absolute bottom-[30px] left-[310px] w-[6px] h-[6px] rounded-full border border-white/60" style={{ animation: 'floatBubble 4s infinite linear' }} />
            <div className="absolute bottom-[30px] left-[590px] w-[8px] h-[8px] rounded-full border border-white/60" style={{ animation: 'floatBubble 5s infinite linear', animationDelay: '2s' }} />

            {/* Ambient Animated Fish Swimming Underwater */}
            <div
              className="absolute top-[70px] opacity-70 flex items-center gap-1"
              style={{ animation: 'fishSwimLeft 14s linear infinite' }}
            >
              <div className="w-[20px] h-[10px] bg-yellow-400 rounded-full border border-amber-600" />
              <div className="w-[6px] h-[8px] bg-amber-500 clip-triangle" />
            </div>

            <div
              className="absolute top-[130px] opacity-60 flex items-center gap-1"
              style={{ animation: 'fishSwimRight 18s linear infinite' }}
            >
              <div className="w-[26px] h-[12px] bg-sky-300 rounded-full border border-sky-600" />
              <div className="w-[8px] h-[10px] bg-sky-500 clip-triangle" />
            </div>
          </div>

          {/* ================= PIER & FISHERMAN ================= */}
          <div className="absolute bottom-[200px] left-0 w-[230px] h-[32px] bg-[#78350f] border-y-[4px] border-[#451a03] shadow-[0_6px_0_rgba(0,0,0,0.4)]">
            <div className="absolute top-0 bottom-0 left-[45px] w-[3px] bg-[#451a03]" />
            <div className="absolute top-0 bottom-0 left-[90px] w-[3px] bg-[#451a03]" />
            <div className="absolute top-0 bottom-0 left-[135px] w-[3px] bg-[#451a03]" />
            <div className="absolute top-0 bottom-0 left-[180px] w-[3px] bg-[#451a03]" />

            {/* Tackle Bucket */}
            <div className="absolute -top-[24px] left-[32px] w-[20px] h-[24px] bg-slate-700 border-[2px] border-black rounded-b-sm">
              <div className="absolute top-[2px] inset-x-[2px] h-[6px] bg-sky-300" />
            </div>
            {/* Tackle Box */}
            <div className="absolute -top-[16px] left-[68px] w-[22px] h-[16px] bg-red-600 border-[2px] border-black">
              <div className="absolute top-[2px] left-[6px] w-[10px] h-[3px] bg-yellow-400" />
            </div>

            {/* Glowing Pier Lantern */}
            <div className="absolute -top-[32px] left-[180px] z-20">
              <div className="w-[12px] h-[4px] bg-amber-900 border border-black mx-auto" />
              <div className="w-[16px] h-[18px] bg-amber-300 border-[2px] border-black relative overflow-hidden shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-pulse">
                <div className="absolute inset-0 bg-yellow-100 opacity-80" />
                <div className="absolute top-1 left-1.5 w-1 h-2 bg-white rounded-full" />
              </div>
              <div className="w-[20px] h-[4px] bg-amber-950 border border-black mx-auto" />
              {/* Light beam glow cone */}
              <div className="absolute top-full -left-6 w-16 h-12 bg-gradient-to-b from-amber-300/30 to-transparent pointer-events-none rounded-b-full" />
            </div>
          </div>

          {/* Fisherman Character */}
          <div className="absolute bottom-[225px] left-[105px] z-10">
            {/* Wooden Stool */}
            <div className="absolute bottom-[0px] left-[10px] w-[28px] h-[18px] bg-[#451a03] border-[2px] border-black">
              <div className="absolute top-[18px] left-[2px] w-[4px] h-[20px] bg-[#451a03]" />
              <div className="absolute top-[18px] right-[2px] w-[4px] h-[20px] bg-[#451a03]" />
            </div>

            {/* Character Body */}
            <div className="absolute bottom-[16px] left-[12px] w-[20px] h-[22px] bg-blue-800 border-[2px] border-black" />
            <div className="absolute bottom-[36px] left-[8px] w-[26px] h-[32px] bg-amber-400 border-[2px] border-black rounded-t-sm">
              <div className="absolute top-[4px] left-[11px] w-[4px] h-[24px] bg-amber-600" />
            </div>

            {/* Head & Cap */}
            <div className="absolute bottom-[66px] left-[10px] w-[22px] h-[20px] bg-amber-200 border-[2px] border-black">
              <div className="absolute top-[6px] right-[4px] w-[3px] h-[3px] bg-black" />
              <div className="absolute bottom-0 inset-x-0 h-[6px] bg-amber-800" />
            </div>
            <div className="absolute bottom-[84px] left-[6px] w-[30px] h-[10px] bg-amber-500 border-[2px] border-black rounded-t-md">
              <div className="absolute bottom-0 right-[-6px] w-[14px] h-[4px] bg-amber-600" />
            </div>

            {/* Reeling Sweat */}
            {gameState === 'reeling' && (
              <div className="absolute -top-[95px] left-[30px] text-sky-400 font-bold text-xs animate-bounce">
                💦
              </div>
            )}

            {/* Fisherman Arm & Fishing Rod */}
            <div
              className={`absolute bottom-[48px] left-[20px] origin-[4px_16px] transition-transform duration-200 ${gameState === 'reeling' ? 'animate-rod-vibrate' : ''}`}
              style={{ transform: `rotate(${rodAngleDeg}deg)` }}
            >
              <div className="w-[20px] h-[8px] bg-amber-400 border-[2px] border-black" />
              <div className="absolute top-0 left-[18px] w-[8px] h-[8px] bg-amber-200 border-[2px] border-black" />
              <div className="absolute top-[-4px] left-[16px] w-[28px] h-[8px] bg-amber-900 border-[2px] border-black" />
              <div className="absolute top-[-8px] left-[26px] w-[10px] h-[10px] bg-slate-300 border-[2px] border-black rounded-full" />

              {/* Flexible Curved Rod */}
              <div className="absolute top-[-3px] left-[42px] w-[165px] h-[4px] bg-slate-900 border-t border-slate-600" />
              <div className="absolute top-[-3px] left-[205px] w-[10px] h-[4px] bg-red-600">
                <div ref={rodTipRef} className="absolute top-[2px] right-0 w-[1px] h-[1px] opacity-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ================= FISHING LINE ================= */}
          {(gameState === 'casting' || gameState === 'waiting' || gameState === 'biting' || gameState === 'reeling') && (
            <svg width="800" height="600" className="absolute inset-0 pointer-events-none z-15" shapeRendering="geometricPrecision">
              <path
                d={
                  gameState === 'reeling'
                    ? `M ${rodTipPos.x} ${rodTipPos.y} Q ${(rodTipPos.x + bobberPos.x) / 2} ${Math.min(rodTipPos.y, bobberPos.y) - 20} ${bobberPos.x} ${bobberPos.y}`
                    : gameState === 'casting'
                    ? `M ${rodTipPos.x} ${rodTipPos.y} Q ${(rodTipPos.x + bobberPos.x) / 2} ${Math.min(rodTipPos.y, bobberPos.y) - 35} ${bobberPos.x} ${bobberPos.y}`
                    : `M ${rodTipPos.x} ${rodTipPos.y} Q ${(rodTipPos.x + bobberPos.x) / 2} ${Math.max(rodTipPos.y, bobberPos.y) + 25} ${bobberPos.x} ${bobberPos.y}`
                }
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeDasharray={gameState === 'reeling' ? '4 3' : 'none'}
                className={gameState === 'biting' ? 'animate-pulse' : ''}
              />
            </svg>
          )}

          {/* ================= BOBBER & SPLASH PARTICLES ================= */}
          {(gameState === 'casting' || gameState === 'waiting' || gameState === 'biting' || gameState === 'reeling') && (
            <div
              className={`absolute z-20 flex flex-col items-center justify-center ${gameState === 'waiting' ? 'animate-bobber-float' : ''}`}
              style={{ left: bobberPos.x, top: bobberPos.y, transform: 'translate(-50%, -50%)' }}
            >
              <div className={`relative ${gameState === 'biting' ? 'animate-bounce' : gameState === 'reeling' ? 'animate-[shake_0.15s_infinite]' : ''}`}>
                {/* Water Ripples */}
                {(gameState === 'waiting' || gameState === 'biting') && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38px] h-[10px] border-[2px] border-sky-200 rounded-full animate-ping opacity-75" />
                )}

                {/* Bobber Float Graphic */}
                <div className="w-[10px] h-[4px] bg-yellow-400 mx-auto" />
                <div className="w-[14px] h-[10px] bg-red-600 border-x border-black" />
                <div className="w-[14px] h-[10px] bg-white border-x border-b border-black" />

                {/* Biting Alert Overlay */}
                <AnimatePresence>
                  {gameState === 'biting' && (
                    <motion.div
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1.25, y: -20 }}
                      exit={{ scale: 0 }}
                      className="absolute bottom-[35px] left-1/2 -translate-x-1/2 flex flex-col items-center z-30"
                    >
                      <div className="bg-red-600 text-yellow-300 font-black text-[28px] px-3 py-1 border-[3px] border-black drop-shadow-[4px_4px_0_rgba(0,0,0,1)] animate-pulse">
                        !
                      </div>
                      <div className="text-[9px] font-bold text-white bg-black px-2 py-0.5 mt-1 border border-white whitespace-nowrap">
                        TAP NOW!
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Dynamic Splashes */}
          {splashes.map(sp => (
            <div
              key={sp.id}
              className="absolute pointer-events-none z-30 flex items-center justify-center"
              style={{ left: sp.x, top: sp.y, transform: 'translate(-50%, -50%)' }}
            >
              <div className="w-[40px] h-[12px] border-[2px] border-white rounded-full animate-ping" />
              <div className="absolute -top-4 -left-3 w-[6px] h-[6px] bg-sky-200 rounded-full animate-bounce" />
              <div className="absolute -top-5 right-[-10px] w-[5px] h-[5px] bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            </div>
          ))}

          {/* Floating Points & Text Pops */}
          <AnimatePresence>
            {floatingTexts.map(ft => (
              <motion.div
                key={ft.id}
                initial={{ opacity: 0, y: 0, scale: 0.6 }}
                animate={{ opacity: 1, y: -40, scale: 1.1 }}
                exit={{ opacity: 0, y: -70 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute pointer-events-none z-40 text-xs font-black drop-shadow-[2px_2px_0_#000] border border-black bg-black/80 px-2.5 py-1 rounded-sm"
                style={{ left: ft.x, top: ft.y, color: ft.color, transform: 'translate(-50%, -50%)' }}
              >
                {ft.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ================= INTERACTIVE OVERLAYS & MODALS ================= */}
        <AnimatePresence>
          {/* Start Screen Modal */}
          {gameState === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 z-40 p-4"
            >
              <div className="bg-amber-100 border-[6px] border-black p-6 sm:p-8 shadow-[10px_10px_0_0_rgba(0,0,0,1)] text-center max-w-[520px] w-full relative">
                <div className="bg-blue-600 text-white border-[4px] border-black py-2.5 px-6 -mt-10 mx-auto inline-block shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <h1 className="text-[18px] sm:text-[22px] font-black tracking-wider text-yellow-300 drop-shadow-[2px_2px_0_#000]">
                    PIXEL FISHING PRO
                  </h1>
                </div>

                <div className="mt-6 space-y-3 text-[10px] font-bold text-slate-800 text-left bg-amber-50 p-4 border-[3px] border-black leading-relaxed">
                  <p className="flex items-center gap-2">
                    <span className="bg-amber-800 text-white px-2 py-0.5 text-[9px]">1</span>
                    <span>Tahan layar untuk mengisi Power lemparan.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-amber-800 text-white px-2 py-0.5 text-[9px]">2</span>
                    <span>Lepas layar untuk melempar umpan kail.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-amber-800 text-white px-2 py-0.5 text-[9px]">3</span>
                    <span>Tunggu tanda (<span className="text-red-600 font-black text-sm">!</span>) muncul di air.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-amber-800 text-white px-2 py-0.5 text-[9px]">4</span>
                    <span>Segera TAP saat ikan menggigit!</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="bg-amber-800 text-white px-2 py-0.5 text-[9px]">5</span>
                    <span>TAP cepat berulang kali untuk menarik ikan.</span>
                  </p>
                </div>

                <div className="mt-6 bg-blue-600 text-white font-bold text-xs py-3.5 border-[4px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] animate-pulse cursor-pointer">
                  TAP LAYAR UNTUK MULAI
                </div>
              </div>
            </motion.div>
          )}

          {/* Power Meter Overlay */}
          {gameState === 'preparing' && (
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              className="absolute top-[40px] left-1/2 -translate-x-1/2 bg-amber-100 p-4 border-[4px] border-black w-[420px] shadow-[6px_6px_0_0_rgba(0,0,0,1)] z-40 pointer-events-none"
            >
              <div className="flex justify-between items-center mb-2 font-black text-xs text-slate-900">
                <span>POWER LEMPARAN</span>
                <span className="text-red-600 font-extrabold">{Math.round(power)}%</span>
              </div>
              <div className="w-full h-[26px] bg-slate-900 border-[3px] border-black p-1 relative overflow-hidden">
                {/* Perfect Cast Sweet Spot Marker (80% - 95%) */}
                <div className="absolute top-0 bottom-0 left-[80%] w-[15%] bg-yellow-300/30 border-x border-yellow-400 z-10 flex items-center justify-center">
                  <span className="text-[8px] font-black text-yellow-300 tracking-tighter">PERFECT</span>
                </div>
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-600 transition-all duration-75 ease-linear"
                  style={{ width: `${power}%` }}
                />
              </div>
              <p className="text-[9px] font-bold text-slate-600 text-center mt-2">LEPAS LAYAR UNTUK MELEMPAR KAIL</p>
            </motion.div>
          )}

          {/* Reeling Meter Overlay */}
          {gameState === 'reeling' && (
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              className="absolute top-[40px] left-1/2 -translate-x-1/2 bg-amber-100 p-4 border-[4px] border-black w-[420px] shadow-[6px_6px_0_0_rgba(0,0,0,1)] z-40 pointer-events-none"
            >
              <div className="flex justify-between items-center mb-2 font-black text-xs text-blue-700 animate-pulse">
                <span>TARIK! TAP FAST!</span>
                <span>{Math.round(reelProgress)}%</span>
              </div>
              <div className="w-full h-[26px] bg-slate-900 border-[3px] border-black p-1 relative">
                <div
                  className="h-full bg-blue-500 transition-all duration-75 ease-linear"
                  style={{ width: `${reelProgress}%` }}
                />
              </div>
            </motion.div>
          )}

          {/* Catch Result Modal */}
          {gameState === 'caught' && fish && fishStats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-50 p-4"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="bg-amber-100 border-[6px] border-black p-6 w-full max-w-[420px] text-slate-900 shadow-[10px_10px_0_0_rgba(0,0,0,1)] text-center relative overflow-hidden">
                {/* Rotating Rays */}
                <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                  <div className="w-[600px] h-[600px] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 animate-[rayRotate_12s_linear_infinite]" />
                </div>

                <div className="relative z-10">
                  <div className="bg-emerald-600 text-white border-[4px] border-black py-2 px-4 mb-4 inline-block shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    <h2 className="text-[18px] font-black text-yellow-300 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" /> TERTANGKAP!
                    </h2>
                  </div>

                  <div className="flex justify-center my-4">
                    <div
                      className="w-[130px] h-[130px] border-[4px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex items-center justify-center p-2 relative bg-gradient-to-b from-sky-100 to-amber-100 overflow-hidden"
                    >
                      <motion.div
                        animate={{ y: [-3, 3, -3], rotate: [-2, 2, -2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <FishGraphic id={fish.id} size={110} />
                      </motion.div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <h3 className="text-[16px] font-black text-slate-900">{fish.name}</h3>
                    <div className="inline-block px-3 py-1 text-slate-900 border-[2px] border-black text-[10px] font-bold uppercase" style={{ backgroundColor: fish.badgeBg }}>
                      RARITY: {fish.rarity}
                    </div>
                    <p className="text-[10px] text-slate-700 italic px-2 mt-2 leading-snug">{fish.description}</p>

                    <div className="flex justify-center gap-4 mt-3 text-[10px] font-bold bg-amber-200/80 p-2 border-[2px] border-black">
                      <span>BERAT: <strong className="text-blue-700">{fishStats.weight} kg</strong></span>
                      <span>PANJANG: <strong className="text-blue-700">{fishStats.length} cm</strong></span>
                    </div>

                    <div className="mt-2 text-[10px] font-black text-emerald-800">
                      + {fish.points} SCORE PTS!
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGameState('idle');
                    }}
                    className="w-full py-3.5 bg-amber-400 text-slate-900 border-[4px] border-black font-black text-xs hover:bg-amber-300 transition-colors shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-1 cursor-pointer"
                  >
                    LEMPAR KAIL LAGI
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Escape Result Modal */}
          {gameState === 'escaped' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-50 p-4"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="bg-red-700 border-[6px] border-black p-6 w-full max-w-[420px] text-white shadow-[10px_10px_0_0_rgba(0,0,0,1)] text-center relative">
                <h2 className="text-[20px] font-black mb-4 text-yellow-300 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  IKAN LEPAS...
                </h2>

                <div className="flex justify-center my-4">
                  <div className="w-[90px] h-[90px] border-[4px] border-black bg-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    <AlertCircle className="w-[50px] h-[50px] text-amber-400" />
                  </div>
                </div>

                <div className="text-[10px] font-bold bg-red-900/80 p-3 border-[2px] border-black mb-6 leading-relaxed">
                  {escapeReason === 'early' && 'Terlalu Cepat! Kamu menarik kail sebelum ikan menggigit.'}
                  {escapeReason === 'missed' && 'Terlalu Lambat! Ikan keburu kabur memakan umpan.'}
                  {escapeReason === 'failed' && 'Tenaga Ikan Terlalu Kuat! Tarikanmu kalah kencang.'}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGameState('idle');
                  }}
                  className="w-full py-3.5 bg-white text-slate-900 border-[4px] border-black font-black text-xs hover:bg-slate-200 transition-colors shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-1 cursor-pointer"
                >
                  COBA LAGI
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
