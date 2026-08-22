import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, ArrowLeft, Trophy, Sparkles, Volume2, VolumeX,
  Sun, Moon, Flame, Maximize2, Minimize2, BookOpen, X, Coins,
  ShoppingBag, BarChart3, CloudRain, Zap, Check, Shield, Crown,
  Sliders, Cloud, RefreshCw, Compass, HelpCircle, ChevronLeft, ChevronRight,
  Fish, Award, Info, Search, Lock, Star, Eye, Filter, CheckCircle2,
  TrendingUp, Activity, Layers, Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdminName, AdminBadge } from './AdminBadge';
import { FishGraphic } from './FishGraphic';
import { playFishingSound, unlockAudio, FishingSoundType } from '../lib/fishingAudio';

import {
  TimeOfDay,
  WeatherType,
  AdminOddsConfig,
  FishType,
  FISH_DATABASE,
  calculateRarityRates,
  getRandomFish
} from '../data/fishDatabase';
import {
  RodItem,
  BaitItem,
  RODS_DATABASE,
  BAITS_DATABASE
} from '../data/equipmentDatabase';

export type { TimeOfDay, WeatherType, AdminOddsConfig, FishType, RodItem, BaitItem };
export { FISH_DATABASE, calculateRarityRates, RODS_DATABASE, BAITS_DATABASE };

type GameState = 'idle' | 'preparing' | 'casting' | 'waiting' | 'biting' | 'reeling' | 'caught' | 'escaped';

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}


import { FishingJournal } from "./fishing/FishingJournalModal";
import { FishingOddsModal } from "./fishing/FishingOddsModal";
import { FishingShopModal } from "./fishing/FishingShopModal";

/* =========================================================================
   JAKARTA TIME FORMATTER HELPER
   ========================================================================= */
const getJakartaTimeInfo = () => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '12', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const second = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10);
    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

    const naturalTimeOfDay: TimeOfDay =
      hour >= 5 && hour < 11
        ? 'pagi'
        : hour >= 11 && hour < 15
        ? 'siang'
        : hour >= 15 && hour < 18
        ? 'senja'
        : 'malam';

    return { hour, minute, second, timeString, naturalTimeOfDay };
  } catch (e) {
    const now = new Date();
    const jktHour = (now.getUTCHours() + 7) % 24;
    const naturalTimeOfDay: TimeOfDay =
      jktHour >= 5 && jktHour < 11
        ? 'pagi'
        : jktHour >= 11 && jktHour < 15
        ? 'siang'
        : jktHour >= 15 && jktHour < 18
        ? 'senja'
        : 'malam';
    return {
      hour: jktHour,
      minute: now.getUTCMinutes(),
      second: now.getUTCSeconds(),
      timeString: `${String(jktHour).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`,
      naturalTimeOfDay,
    };
  }
};

/* =========================================================================
   MAIN COMPONENT: FISHING GAME SECTION
   ========================================================================= */
export const FishingGameSection: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = currentUser ? (currentUser.role === 'admin' || isAdminName(currentUser.username)) : false;

  const [gameState, setGameState] = useState<GameState>('idle');
  const [power, setPower] = useState(0);
  const [reelProgress, setReelProgress] = useState(0);
  const [fish, setFish] = useState<FishType | null>(null);
  const currentFishRef = useRef<FishType | null>(null);
  const [fishStats, setFishStats] = useState<{ weight: string; length: string } | null>(null);
  const [bobberPos, setBobberPos] = useState({ x: 400, y: 380 });
  const [castProgress, setCastProgress] = useState(0);
  const [escapeReason, setEscapeReason] = useState<'early' | 'missed' | 'failed' | null>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(50);
  const [caughtCount, setCaughtCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isPerfectCast, setIsPerfectCast] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [splashes, setSplashes] = useState<{ id: string; x: number; y: number }[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [discoveredSpecies, setDiscoveredSpecies] = useState<string[]>([]);
  
  // Mutually Exclusive Modal System (Prevents stacked/overlapping modals)
  type FishingModalType = 'journal' | 'shop' | 'odds' | null;
  const [activeModal, setActiveModal] = useState<FishingModalType>(null);
  const isJournalOpen = activeModal === 'journal';
  const isOddsOpen = activeModal === 'odds';
  const isShopOpen = activeModal === 'shop';

  const toggleModal = (modal: 'journal' | 'shop' | 'odds') => {
    setActiveModal((prev) => (prev === modal ? null : modal));
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // Keyboard shortcut: Escape to close whichever modal is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [caughtActionUnlocked, setCaughtActionUnlocked] = useState(false);
  const [sellConfirmation, setSellConfirmation] = useState(false);
  const [flashScreen, setFlashScreen] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<{ id: number; emoji: string; x: number; y: number; delay: number; speed: number; scale: number }[]>([]);

  // Realtime Jakarta (WIB - UTC+7) & Dynamic Weather Engine
  const [jakartaClock, setJakartaClock] = useState(() => getJakartaTimeInfo());
  const [isRealtimeJakarta, setIsRealtimeJakarta] = useState<boolean>(true);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => getJakartaTimeInfo().naturalTimeOfDay);
  const [weather, setWeather] = useState<WeatherType>('cerah');
  const [isAutoWeather, setIsAutoWeather] = useState<boolean>(true);

  // Admin Custom Odds configuration
  const [adminOdds, setAdminOdds] = useState<AdminOddsConfig>(() => {
    try {
      const saved = localStorage.getItem('admin_fishing_odds_override');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { enabled: false, mythic: 0.005, legendary: 0.035, epic: 0.11, rare: 0.25, common: 0.60 };
  });

  // Save admin odds override
  useEffect(() => {
    try {
      localStorage.setItem('admin_fishing_odds_override', JSON.stringify(adminOdds));
    } catch (e) {}
  }, [adminOdds]);

  // Realtime Jakarta Clock interval (1s)
  useEffect(() => {
    const timer = setInterval(() => {
      const info = getJakartaTimeInfo();
      setJakartaClock(info);
      if (isRealtimeJakarta) {
        setTimeOfDay(info.naturalTimeOfDay);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isRealtimeJakarta]);

  // Dynamic Weather Engine cycle
  useEffect(() => {
    if (!isAutoWeather) return;

    const pickRandomWeather = (): WeatherType => {
      const r = Math.random();
      if (r < 0.38) return 'cerah';
      if (r < 0.62) return 'berawan';
      if (r < 0.78) return 'hujan';
      if (r < 0.90) return 'badai';
      return 'kabut_mistis';
    };

    const interval = setInterval(() => {
      const nextW = pickRandomWeather();
      setWeather(nextW);
      if (nextW === 'badai') {
        playFishingSound('bite', soundEnabled);
        triggerFloatingText('⚡ BADAI PETIR! (+25% LANGKA/MITOS)', 400, 260, '#38bdf8');
      } else if (nextW === 'kabut_mistis') {
        playFishingSound('perfect', soundEnabled);
        triggerFloatingText('🌫️ KABUT MISTIS! (+50% MITOS DEWA)', 400, 260, '#c084fc');
      } else if (nextW === 'hujan') {
        triggerFloatingText('🌧️ HUJAN TIBA! (+10% EPIC)', 400, 260, '#60a5fa');
      }
    }, 70000);

    return () => clearInterval(interval);
  }, [isAutoWeather, soundEnabled]);

  // Equipment & Inventory
  const [equippedRod, setEquippedRod] = useState('bamboo');
  const [ownedRods, setOwnedRods] = useState<string[]>(['bamboo']);
  const [equippedBait, setEquippedBait] = useState('worm');
  const [baitCounts, setBaitCounts] = useState<Record<string, number>>({ pellet: 5, shrimp: 2, star: 0, nectar: 0 });
  const [activeUser, setActiveUser] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    if (currentUser) {
      const savedData = localStorage.getItem(`fishing_data_${currentUser.username}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setScore(parsed.score || 0);
          setCoins(parsed.coins !== undefined ? parsed.coins : 50);
          setCaughtCount(parsed.caughtCount || 0);
          setDiscoveredSpecies(parsed.discoveredSpecies || []);
          setEquippedRod(parsed.equippedRod || 'bamboo');
          setOwnedRods(parsed.ownedRods || ['bamboo']);
          setEquippedBait(parsed.equippedBait || 'worm');
          setBaitCounts(parsed.baitCounts || { pellet: 5, shrimp: 2, star: 0, nectar: 0 });
        } catch (e) {
          console.error("Failed to parse fishing data", e);
        }
      } else {
        setScore(0);
        setCoins(50);
        setCaughtCount(0);
        setDiscoveredSpecies([]);
        setEquippedRod('bamboo');
        setOwnedRods(['bamboo']);
        setEquippedBait('worm');
        setBaitCounts({ pellet: 5, shrimp: 2, star: 0, nectar: 0 });
      }
      setActiveUser(currentUser.username);
    } else {
      setScore(0);
      setCoins(50);
      setCaughtCount(0);
      setDiscoveredSpecies([]);
      setEquippedRod('bamboo');
      setOwnedRods(['bamboo']);
      setEquippedBait('worm');
      setBaitCounts({ pellet: 5, shrimp: 2, star: 0, nectar: 0 });
      setActiveUser(null);
    }
  }, [currentUser]);

  // Save user data
  useEffect(() => {
    if (currentUser && activeUser === currentUser.username) {
      const dataToSave = {
        score,
        coins,
        caughtCount,
        discoveredSpecies,
        equippedRod,
        ownedRods,
        equippedBait,
        baitCounts,
      };
      localStorage.setItem(`fishing_data_${currentUser.username}`, JSON.stringify(dataToSave));
    }
  }, [score, coins, caughtCount, discoveredSpecies, equippedRod, ownedRods, equippedBait, baitCounts, currentUser, activeUser]);

  const waterHeight = Math.max(260, Math.floor(canvasHeight * 0.45));
  const waterSurfaceY = canvasHeight - waterHeight + 10;

  // Exact trigonometric calculation for rod tip position in 800xcanvasHeight coordinates
  const getRodTipPos = (angleDeg: number) => {
    const pivotX = 129;
    const pivotY = canvasHeight - waterHeight - 35;
    const radius = 211.6837;
    const baseAngleRad = -0.0804; // Math.atan2(-17, 211) ≈ -4.6067 deg
    const angleRad = (angleDeg * Math.PI) / 180 + baseAngleRad;
    return {
      x: pivotX + radius * Math.cos(angleRad),
      y: pivotY + radius * Math.sin(angleRad),
    };
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>;
    
    const calculateScale = () => {
      const padding = isFullscreen ? 0 : 12;
      const availableWidth = Math.max(280, window.innerWidth - padding);
      const availableHeight = Math.max(200, window.innerHeight - padding);
      const sw = availableWidth / 800;
      const sh = availableHeight / 600;
      const s = Math.min(sw, sh);

      setScale({ x: s, y: s });

      if (sw < sh) {
        setCanvasHeight(Math.max(600, availableHeight / sw));
      } else {
        setCanvasHeight(600);
      }
    };

    const handleResize = () => {
      clearTimeout(resizeTimer);
      // Debounce window resize to prevent cascading re-renders
      resizeTimer = setTimeout(calculateScale, 60);
    };

    window.addEventListener('resize', handleResize);
    calculateScale(); // Initial call
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen API failed', err);
    }
  };

  const triggerFloatingText = (text: string, x: number, y: number, color = '#facc15') => {
    const id = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    setFloatingTexts(prev => [...prev, { id, text, x, y, color }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(item => item.id !== id));
    }, 1200);
  };

  const containerRef = useRef<HTMLElement>(null);
  const gameCanvasRef = useRef<HTMLDivElement>(null);
  const rodTipRef = useRef<HTMLDivElement>(null);

  const powerRef = useRef(0);
  const powerDirRef = useRef(1);
  const reqRef = useRef<number>(0);
  const reelProgressRef = useRef(0);
  const targetBobberXRef = useRef(400);

  const biteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const escapeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playSound = (type: FishingSoundType) => {
    playFishingSound(type, soundEnabled);
  };

  useEffect(() => {
    return () => {
      if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);
      if (escapeTimeoutRef.current) clearTimeout(escapeTimeoutRef.current);
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, []);

  const triggerSplash = (x: number, y: number) => {
    const id = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    setSplashes(s => [...s, { id, x, y }]);
    setTimeout(() => {
      setSplashes(s => s.filter(p => p.id !== id));
    }, 600);
  };

  const startPreparing = () => {
    setActiveModal(null);
    setHasStarted(true);
    setGameState('preparing');
    setPower(0);
    powerRef.current = 0;
    powerDirRef.current = 1;
    setReelProgress(0);
    reelProgressRef.current = 0;
    setFish(null);
    setFishStats(null);
    setEscapeReason(null);

    let holdFrames = 0;

    const animatePower = () => {
      if (holdFrames > 0) {
        holdFrames--;
        reqRef.current = requestAnimationFrame(animatePower);
        return;
      }

      powerRef.current += 1.85 * powerDirRef.current;
      if (powerRef.current >= 100) {
        powerRef.current = 100;
        powerDirRef.current = -1;
        holdFrames = 7;
      } else if (powerRef.current <= 0) {
        powerRef.current = 0;
        powerDirRef.current = 1;
        holdFrames = 3;
      }
      setPower(powerRef.current);
      reqRef.current = requestAnimationFrame(animatePower);
    };
    reqRef.current = requestAnimationFrame(animatePower);
  };

  const castLine = () => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    playSound('cast');

    const currentPower = Math.max(0, Math.min(100, powerRef.current));
    const perfect = currentPower >= 80 && currentPower <= 95;
    setIsPerfectCast(perfect);

    const targetX = 350 + (currentPower / 100) * 380;
    targetBobberXRef.current = targetX;

    setGameState('casting');
    let progress = 0;

    const startPos = getRodTipPos(-20);
    const startX = startPos.x;
    const startY = startPos.y;

    const animateCast = () => {
      progress += 0.045;
      setCastProgress(progress);

      const currentX = startX + (targetX - startX) * progress;
      const peakY = Math.min(startY - 140, startY - (targetX - startX) * 0.4);
      const currentY = (1 - progress) * (1 - progress) * startY + 2 * (1 - progress) * progress * peakY + progress * progress * waterSurfaceY;

      setBobberPos({ x: currentX, y: currentY });

      if (progress < 1) {
        reqRef.current = requestAnimationFrame(animateCast);
      } else {
        setBobberPos({ x: targetX, y: waterSurfaceY });
        playSound('splash');
        triggerSplash(targetX, waterSurfaceY);

        if (perfect) {
          playSound('perfect');
          triggerFloatingText('PERFECT CAST! ⭐', targetX, waterSurfaceY - 40, '#facc15');
        }

        setGameState('waiting');

        const activeBait = BAITS_DATABASE.find(b => b.id === equippedBait) || BAITS_DATABASE[0];
        const baitWaitFactor = Math.max(0.35, 1 - activeBait.biteSpeedBonus * 0.55);
        const weatherWaitFactor = (weather === 'badai' || weather === 'kabut_mistis') ? 0.82 : weather === 'hujan' ? 0.90 : 1.0;
        const perfectCastFactor = perfect ? 0.78 : 1.0;

        const randomBaseWait = Math.random() * 4200 + 1200;
        const waitTime = randomBaseWait * baitWaitFactor * weatherWaitFactor * perfectCastFactor;

        biteTimeoutRef.current = setTimeout(() => {
          setGameState(prev => {
            if (prev === 'waiting') {
              playSound('bite');
              triggerSplash(targetX, waterSurfaceY);

              const reactionWindow = Math.floor(Math.random() * 550 + 950);

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
              }, reactionWindow);
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
    unlockAudio();
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

      const randomFish = getRandomFish(equippedRod, equippedBait, weather, adminOdds);
      currentFishRef.current = randomFish;

      if (equippedBait !== 'worm') {
        setBaitCounts(prev => {
          const nextCount = Math.max(0, (prev[equippedBait] || 0) - 1);
          if (nextCount === 0) {
            setEquippedBait('worm');
          }
          return { ...prev, [equippedBait]: nextCount };
        });
      }

      if (randomFish.rarity === 'Mitos' || randomFish.rarity === 'Legendaris') {
        setIsScreenShaking(true);
        setTimeout(() => setIsScreenShaking(false), 500);
      }

      const weightVal = (Math.random() * (randomFish.maxWeight - randomFish.minWeight) + randomFish.minWeight).toFixed(2);
      const lengthVal = (parseFloat(weightVal) * 11 + Math.random() * 6 + 6).toFixed(1);

      setFish(randomFish);
      setFishStats({ weight: weightVal, length: lengthVal });
      setGameState('reeling');
      reelProgressRef.current = 35;
      setReelProgress(35);
    } else if (gameState === 'reeling') {
      playSound('reeling');
      triggerSplash(bobberPos.x, bobberPos.y);

      const currentRod = RODS_DATABASE.find(r => r.id === equippedRod) || RODS_DATABASE[0];
      const tapVariance = 1 + (Math.random() * 0.40 - 0.15);
      const pullIncrement = 15 * (1 + currentRod.reelSpeedBonus) * tapVariance;
      reelProgressRef.current += pullIncrement;

      if (reelProgressRef.current >= 100) {
        reelProgressRef.current = 100;
        const caughtFish = currentFishRef.current;

        setFlashScreen(true);
        setTimeout(() => setFlashScreen(false), 250);

        setCaughtActionUnlocked(false);
        setSellConfirmation(false);

        const particleCount = caughtFish?.rarity === 'Mitos' ? 45 : caughtFish?.rarity === 'Legendaris' ? 30 : 18;
        const emojis = caughtFish?.rarity === 'Mitos'
          ? ['✨', '⭐', '💫', '💎', '👑', '🌟', '🔥', '⚡', '🎆']
          : caughtFish?.rarity === 'Legendaris'
          ? ['👑', '⭐', '✨', '🏆', '💎', '🌟']
          : ['✨', '⭐', '🎉', '🐟'];

        const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
          id: i,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
          x: Math.random() * 700 + 50,
          y: Math.random() * 500 + 50,
          delay: Math.random() * 0.4,
          speed: Math.random() * 1.5 + 1.2,
          scale: Math.random() * 0.8 + 0.8,
        }));
        setConfettiParticles(newParticles);

        if (caughtFish?.rarity === 'Mitos') {
          playSound('mythic_fanfare');
          setIsScreenShaking(true);
          setTimeout(() => setIsScreenShaking(false), 1400);
        } else if (caughtFish?.rarity === 'Legendaris') {
          playSound('legendary');
          setIsScreenShaking(true);
          setTimeout(() => setIsScreenShaking(false), 900);
        } else {
          playSound('caught');
        }

        const unlockDelay = caughtFish?.rarity === 'Mitos' ? 2000 : caughtFish?.rarity === 'Legendaris' ? 1400 : 800;
        setTimeout(() => {
          setCaughtActionUnlocked(true);
        }, unlockDelay);

        const basePts = caughtFish?.points || 100;
        const comboBonus = combo * 25;
        const perfectBonus = isPerfectCast ? 50 : 0;
        const totalPts = basePts + comboBonus + perfectBonus;

        const coinMultiplier = equippedRod === 'cosmic' ? 2.0 : equippedRod === 'gold' ? 1.5 : 1.0;
        const earnedCoins = Math.round((caughtFish?.coins || 20) * coinMultiplier);

        setScore(s => s + totalPts);
        setCoins(c => c + earnedCoins);
        setCaughtCount(c => c + 1);
        setCombo(c => c + 1);

        if (caughtFish) {
          setDiscoveredSpecies(prev => prev.includes(caughtFish.id) ? prev : [...prev, caughtFish.id]);
        }
        triggerFloatingText(`+${totalPts} PTS!`, bobberPos.x, bobberPos.y - 60, '#34d399');
        triggerFloatingText(`+${earnedCoins} 🪙`, bobberPos.x + 30, bobberPos.y - 40, '#facc15');
        setGameState('caught');
      }
      setReelProgress(reelProgressRef.current);

      const targetX = targetBobberXRef.current;
      const newBobberX = targetX - (reelProgressRef.current / 100) * (targetX - 250);
      setBobberPos({ x: Math.max(250, newBobberX), y: waterSurfaceY });
    }
  };

  const handlePointerUp = () => {
    if (gameState === 'preparing') {
      castLine();
    }
  };

  // Reeling decay physics
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === 'reeling' && fish) {
      const currentRod = RODS_DATABASE.find(r => r.id === equippedRod) || RODS_DATABASE[0];
      const rarityMultiplier = fish.rarity === 'Mitos' ? 1.55 : fish.rarity === 'Legendaris' ? 1.35 : fish.rarity === 'Sangat Langka' ? 1.20 : 1.0;

      interval = setInterval(() => {
        const timeVal = Date.now() / 320;
        const surgeFactor = 1 + Math.sin(timeVal) * 0.45 + (Math.random() * 0.35 - 0.15);
        const dynamicDecayRate = Math.max(0.40, (fish.difficulty * 1.30 * rarityMultiplier * surgeFactor) * (1 - currentRod.strengthBonus * 0.45));

        reelProgressRef.current -= dynamicDecayRate;
        if (reelProgressRef.current <= 0) {
          reelProgressRef.current = 0;
          playSound('escape');
          setEscapeReason('failed');
          setGameState('escaped');
        }
        setReelProgress(reelProgressRef.current);

        const targetX = targetBobberXRef.current;
        const newBobberX = targetX - (reelProgressRef.current / 100) * (targetX - 250);
        setBobberPos({ x: Math.max(250, newBobberX), y: waterSurfaceY });
      }, 42);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState, fish, equippedRod]);

  let rodAngleDeg = -12;
  if (gameState === 'idle') rodAngleDeg = -15;
  else if (gameState === 'preparing') rodAngleDeg = -62;
  else if (gameState === 'casting') rodAngleDeg = -20 + castProgress * 40;
  else if (gameState === 'biting') rodAngleDeg = -5;
  else if (gameState === 'reeling') rodAngleDeg = -30;
  else rodAngleDeg = -22;

  const rodTipPos = getRodTipPos(rodAngleDeg);

  const currentEquippedRodItem = React.useMemo(() => 
    RODS_DATABASE.find(r => r.id === equippedRod) || RODS_DATABASE[0], 
  [equippedRod]);
  
  const currentEquippedBaitItem = React.useMemo(() => 
    BAITS_DATABASE.find(b => b.id === equippedBait) || BAITS_DATABASE[0], 
  [equippedBait]);

  return (
    <section
      id="fishing"
      className="relative w-full h-[100dvh] z-[100] bg-slate-950 flex items-center justify-center select-none touch-none font-mono overflow-hidden"
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
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-32px, 0, 0); }
          }
          @keyframes kelpSway {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(7deg); }
          }
          @keyframes floatBubble {
            0% { transform: translate3d(0, 0, 0) scale(0.8); opacity: 0.8; }
            100% { transform: translate3d(0, -130px, 0) scale(1.3); opacity: 0; }
          }
          @keyframes fishSwimLeft {
            0% { transform: translate3d(820px, 0, 0) scaleX(1); }
            100% { transform: translate3d(-100px, 0, 0) scaleX(1); }
          }
          @keyframes rodVibrate {
            0%, 100% { transform: rotate(-30deg); }
            50% { transform: rotate(-26deg); }
          }
          @keyframes bobberGentleFloat {
            0%, 100% { transform: translate3d(-50%, -50%, 0) translateY(0px); }
            50% { transform: translate3d(-50%, -50%, 0) translateY(4px); }
          }
          @keyframes shake {
            0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
            20% { transform: translate3d(-4px, 4px, 0) rotate(-1deg); }
            40% { transform: translate3d(4px, -3px, 0) rotate(1deg); }
            60% { transform: translate3d(-3px, -2px, 0) rotate(-1deg); }
            80% { transform: translate3d(3px, 3px, 0) rotate(1deg); }
          }
          @keyframes rainFall {
            0% { transform: translate3d(0, -100px, 0); }
            100% { transform: translate3d(-150px, 700px, 0); }
          }
          @keyframes particleFloatUp {
            0% { transform: translate3d(0, 0, 0) scale(0.6); opacity: 0; }
            25% { opacity: 1; transform: translate3d(0, -30px, 0) scale(1.2); }
            100% { transform: translate3d(0, -160px, 0) scale(0.4); opacity: 0; }
          }
          @keyframes shockwaveExpand {
            0% { transform: scale(0.6) translateZ(0); opacity: 0.9; }
            100% { transform: scale(2.6) translateZ(0); opacity: 0; }
          }
          @keyframes reelSpin {
            0% { transform: rotate(0deg) translateZ(0); }
            100% { transform: rotate(360deg) translateZ(0); }
          }
          @keyframes divineRing {
            0% { transform: rotate(0deg) translateZ(0); }
            100% { transform: rotate(360deg) translateZ(0); }
          }
          @keyframes fireflyFloat {
            0% { transform: translate3d(0, 0, 0) scale(0.8); opacity: 0.2; }
            50% { transform: translate3d(12px, -30px, 0) scale(1.2); opacity: 0.95; }
            100% { transform: translate3d(-8px, -65px, 0) scale(0.6); opacity: 0; }
          }
          @keyframes reelCrankFast {
            0% { transform: rotate(0deg) translateZ(0); }
            100% { transform: rotate(360deg) translateZ(0); }
          }
          @keyframes foamSpread {
            0% { transform: scale(0.6) translateZ(0); opacity: 0.9; }
            50% { transform: scale(1.4) translateZ(0); opacity: 0.6; }
            100% { transform: scale(2.2) translateZ(0); opacity: 0; }
          }
          @keyframes fishFight {
            0%, 100% { transform: translate3d(0, 0, 0) rotate(-14deg) scaleX(1); }
            25% { transform: translate3d(8px, -5px, 0) rotate(12deg) scaleX(1); }
            50% { transform: translate3d(-10px, 6px, 0) rotate(-16deg) scaleX(-1); }
            75% { transform: translate3d(6px, 3px, 0) rotate(10deg) scaleX(1); }
          }
          @keyframes vineSway {
            0%, 100% { transform: rotate(-4deg); }
            50% { transform: rotate(4deg); }
          }
          @keyframes sunbeamPulse {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 0.75; }
          }

          .animate-water { animation: waterWave 1.8s linear infinite; will-change: transform; }
          .animate-kelp { animation: kelpSway 3.2s ease-in-out infinite; transform-origin: bottom center; will-change: transform; }
          .animate-rod-vibrate { animation: rodVibrate 0.08s infinite; will-change: transform; }
          .animate-bobber-float { animation: bobberGentleFloat 1.8s ease-in-out infinite; will-change: transform; }
          .animate-particle-float { animation: particleFloatUp 2s ease-out infinite; will-change: transform, opacity; }
          .animate-shockwave { animation: shockwaveExpand 1.6s ease-out infinite; will-change: transform, opacity; }
          .animate-reel-spin { animation: reelSpin 0.35s linear infinite; will-change: transform; }
          .animate-firefly { animation: fireflyFloat 3.5s ease-in-out infinite; will-change: transform, opacity; }
          .animate-reel-crank { animation: reelCrankFast 0.12s linear infinite; will-change: transform; }
          .animate-foam { animation: foamSpread 0.75s ease-out infinite; will-change: transform, opacity; }
          .animate-fish-fight { animation: fishFight 0.25s ease-in-out infinite; will-change: transform; }
          .animate-vine { animation: vineSway 4.5s ease-in-out infinite; transform-origin: top center; will-change: transform; }
          .animate-sunbeam { animation: sunbeamPulse 4s ease-in-out infinite; will-change: opacity; }

          @media (prefers-reduced-motion: reduce) {
            .animate-water, .animate-kelp, .animate-vine, .animate-sunbeam, .animate-firefly {
              animation: none !important;
            }
          }
        `}
      </style>

      {/* ================= TOP ARCADE HUD & CONTROL DECK ================= */}
      <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-[400] flex flex-col gap-2 pointer-events-none">
        {/* Row 1: Primary Navigation, Live Jakarta Time & Control Cluster */}
        <div className="flex justify-between items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Left: Home / Back & Live Jakarta Clock */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => {
                playSound('click');
                navigate('/');
              }}
              className="bg-slate-900/85 hover:bg-slate-800 text-slate-100 border border-slate-700/80 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer font-sans font-bold text-xs sm:text-sm"
              title="Kembali ke Portofolio Utama"
            >
              <ArrowLeft className="w-4 h-4 text-[#E195AB]" />
              <span>Beranda</span>
            </button>

            {/* Jakarta Live Clock Pill */}
            <button
              onClick={() => {
                playSound('click');
                setIsRealtimeJakarta(!isRealtimeJakarta);
                if (!isRealtimeJakarta) {
                  setTimeOfDay(jakartaClock.naturalTimeOfDay);
                  triggerFloatingText('📍 AUTO WAKTU JAKARTA AKTIF', 400, 200, '#38bdf8');
                } else {
                  triggerFloatingText('MANUAL WAKTU AKTIF', 400, 200, '#facc15');
                }
              }}
              className={`border backdrop-blur-xl px-3.5 py-1.5 rounded-2xl flex items-center gap-2.5 shadow-lg transition-all cursor-pointer ${
                isRealtimeJakarta
                  ? 'bg-sky-950/70 border-sky-500/50 text-sky-200'
                  : 'bg-slate-900/85 border-slate-700/80 text-slate-200 hover:bg-slate-800'
              }`}
              title="Toggle Auto Waktu Realtime Jakarta / Manual"
            >
              <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-xs sm:text-sm font-mono font-bold text-white">
                  {jakartaClock.timeString} <span className="text-[10px] text-cyan-400">WIB</span>
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono font-semibold uppercase">
                  {isRealtimeJakarta ? `AUTO • ${timeOfDay}` : `MANUAL • ${timeOfDay}`}
                </span>
              </div>
            </button>
          </div>

          {/* Right: Arcade Control Deck */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            {/* Coins Counter (Opens/Toggles Shop) */}
            <button
              onClick={() => {
                playSound('click');
                toggleModal('shop');
              }}
              className={`bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border backdrop-blur-xl px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer font-mono font-bold text-xs sm:text-sm ${
                activeModal === 'shop'
                  ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-amber-500/20'
                  : 'border-amber-400/40'
              }`}
              title="Buka / Tutup Toko Alat Pancing"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{coins.toLocaleString()}</span>
            </button>

            {/* Shop Button */}
            <button
              onClick={() => {
                playSound('click');
                toggleModal('shop');
              }}
              className={`border backdrop-blur-xl p-2.5 rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer ${
                activeModal === 'shop'
                  ? 'bg-amber-500/30 text-amber-300 border-amber-400 ring-2 ring-amber-400/50 shadow-amber-500/20'
                  : 'bg-slate-900/85 hover:bg-slate-800 text-amber-400 border-slate-700/80'
              }`}
              title="Toko Joran & Umpan"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>

            {/* Species Journal */}
            <button
              onClick={() => {
                playFishingSound('page', soundEnabled);
                toggleModal('journal');
              }}
              className={`border backdrop-blur-xl p-2.5 rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer relative ${
                activeModal === 'journal'
                  ? 'bg-blue-500/30 text-blue-300 border-blue-400 ring-2 ring-blue-400/50 shadow-blue-500/20'
                  : 'bg-slate-900/85 hover:bg-slate-800 text-blue-400 border-slate-700/80'
              }`}
              title="Jurnal Spesies Ikan"
            >
              <BookOpen className="w-4 h-4" />
              {discoveredSpecies.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border border-slate-900 shadow-sm">
                  {discoveredSpecies.length}
                </span>
              )}
            </button>

            {/* Odds Button */}
            <button
              onClick={() => {
                playSound('click');
                toggleModal('odds');
              }}
              className={`p-2.5 rounded-2xl backdrop-blur-xl border shadow-lg active:scale-95 transition-all cursor-pointer ${
                activeModal === 'odds'
                  ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400 ring-2 ring-cyan-400/50 shadow-cyan-500/20'
                  : adminOdds.enabled && isAdmin
                  ? 'bg-amber-400/30 text-amber-300 border-amber-400 ring-2 ring-amber-400/40 animate-pulse'
                  : 'bg-slate-900/85 hover:bg-slate-800 text-cyan-400 border-slate-700/80'
              }`}
              title="Peluang Ikan (Drop Rates & Odds)"
            >
              <BarChart3 className="w-4 h-4" />
            </button>

            {/* Weather Switcher */}
            <button
              onClick={() => {
                playSound('click');
                const weathers: WeatherType[] = ['cerah', 'berawan', 'hujan', 'badai', 'kabut_mistis'];
                const nextIdx = (weathers.indexOf(weather) + 1) % weathers.length;
                const nextW = weathers[nextIdx];
                setWeather(nextW);
                setIsAutoWeather(false);
                triggerFloatingText(`CUACA: ${nextW.toUpperCase()}`, 400, 200, '#38bdf8');
              }}
              className="bg-slate-900/85 hover:bg-slate-800 text-slate-100 border border-slate-700/80 backdrop-blur-xl px-3 py-2 rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer text-xs font-mono flex items-center gap-1.5"
              title="Ganti Cuaca Samudra"
            >
              <span>
                {weather === 'cerah' && '☀️'}
                {weather === 'berawan' && '⛅'}
                {weather === 'hujan' && '🌧️'}
                {weather === 'badai' && '⛈️'}
                {weather === 'kabut_mistis' && '🌫️'}
              </span>
              <span className="capitalize hidden md:inline text-xs text-slate-200 font-sans font-semibold">
                {weather === 'kabut_mistis' ? 'Mistis' : weather}
              </span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => {
                if (!soundEnabled) playFishingSound('click', true);
                setSoundEnabled(!soundEnabled);
              }}
              className="bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur-xl p-2.5 rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer"
              title="Toggle Suara Audio"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => {
                playSound('click');
                toggleFullscreen();
              }}
              className="bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur-xl p-2.5 rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer hidden sm:flex items-center justify-center"
              title={isFullscreen ? "Keluar Fullscreen" : "Layar Penuh"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Row 2: Live Telemetry Bar (Score, Fish, Rod & Bait, Combo) */}
        <div className="flex justify-end pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/70 rounded-2xl px-4 py-2 flex items-center gap-3 sm:gap-4 shadow-xl text-xs sm:text-sm font-mono font-bold text-slate-200 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>PTS: <strong className="text-amber-400">{score.toLocaleString()}</strong></span>
            </div>
            <span className="text-slate-600">|</span>
            <div>
              <span>IKAN: <strong className="text-emerald-400">{caughtCount}</strong></span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-slate-200">
              <span>{currentEquippedRodItem.icon}</span>
              <span className="hidden sm:inline font-sans">{currentEquippedRodItem.name.split(' ')[1]}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-purple-300">
              <span>{currentEquippedBaitItem.icon}</span>
              <span>{equippedBait !== 'worm' ? `(${baitCounts[equippedBait] || 0})` : '∞'}</span>
            </div>
            {combo > 1 && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-pink-400 animate-pulse flex items-center gap-1">
                  🔥 x{combo} Combo
                </span>
              </>
            )}
          </div>
        </div>

        {/* Meters / Dynamic Mini-Game HUD overlays */}
        <div className="w-full flex justify-center pointer-events-none mt-1">
          <AnimatePresence>
            {/* Power Meter */}
            {gameState === 'preparing' && (
              <motion.div
                key="power-meter"
                initial={{ y: -30, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -30, opacity: 0, scale: 0.95 }}
                className={`p-3 sm:p-4 border-[4px] border-black w-[94%] max-w-[460px] shadow-[6px_6px_0_0_#000] pointer-events-none transition-colors ${
                  power >= 80 && power <= 95
                    ? 'bg-amber-100 ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.7)]'
                    : 'bg-amber-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5 font-black text-xs sm:text-sm text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                    <span>TENAGA LEMPARAN</span>
                  </span>
                  <span className={`font-mono text-sm sm:text-base px-2.5 py-0.5 border-2 border-black rounded ${
                    power >= 80 && power <= 95
                      ? 'bg-yellow-400 text-slate-950 font-black shadow-xs animate-pulse'
                      : power > 95
                      ? 'bg-red-500 text-white font-black'
                      : 'bg-slate-900 text-yellow-300'
                  }`}>
                    {Math.round(power)}%
                  </span>
                </div>

                <div className="w-full h-[28px] sm:h-[32px] bg-slate-950 border-[3px] border-black p-0.5 relative overflow-hidden rounded-xs">
                  {/* Ticks */}
                  <div className="absolute inset-0 flex justify-between px-1.5 pointer-events-none opacity-25 z-0">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <div key={i} className="w-[1px] h-full bg-white" />
                    ))}
                  </div>

                  {/* Sweet Spot */}
                  <div className="absolute top-0 bottom-0 left-[80%] w-[15%] bg-yellow-400/50 border-x-2 border-yellow-300 z-10 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-pulse">
                    <span className="text-[10px] sm:text-xs font-black text-yellow-200 tracking-tighter drop-shadow-[1px_1px_0_#000]">PERFECT</span>
                  </div>

                  {/* Realtime Fill (No transition lag for 1:1 precision) */}
                  <div
                    className={`h-full relative rounded-xs ${
                      power >= 96
                        ? 'bg-gradient-to-r from-sky-400 via-amber-400 to-red-600'
                        : power >= 80
                        ? 'bg-gradient-to-r from-sky-400 via-teal-300 to-amber-300'
                        : 'bg-gradient-to-r from-sky-400 via-amber-400 to-rose-600'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, power))}%` }}
                  >
                    <div className="absolute top-0 bottom-0 right-0 w-[4px] bg-white shadow-[0_0_8px_#fff]" />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2 text-xs font-black">
                  <span className="text-slate-600">0%</span>
                  <span className={`px-2.5 py-0.5 rounded border border-black ${
                    power >= 80 && power <= 95
                      ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                      : 'bg-amber-200/80 text-slate-800'
                  }`}>
                    {power < 35 ? '💤 MENGISI TENAGA...' : power < 80 ? '⚡ TERUS ISI...' : power <= 95 ? '⭐ TARGET IDEAL! LEPAS SEKARANG! ⭐' : '🔥 MAX OVERPOWER!'}
                  </span>
                  <span className="text-rose-700 font-bold">100%</span>
                </div>
              </motion.div>
            )}

            {/* Reeling Tension Meter */}
            {gameState === 'reeling' && (
              <motion.div
                key="reeling-meter"
                initial={{ y: -30, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -30, opacity: 0, scale: 0.95 }}
                className={`p-3.5 sm:p-4 border-[4px] border-black w-[94%] max-w-[460px] shadow-[6px_6px_0_0_#000] pointer-events-none transition-colors ${
                  reelProgress < 28
                    ? 'bg-red-100 border-red-600 ring-4 ring-red-500 animate-pulse'
                    : reelProgress > 75
                    ? 'bg-emerald-100 border-emerald-700 ring-2 ring-emerald-400'
                    : 'bg-amber-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5 font-black text-xs sm:text-sm">
                  <span className={`flex items-center gap-2 ${
                    reelProgress < 28 ? 'text-red-700 animate-bounce' : reelProgress > 75 ? 'text-emerald-800' : 'text-blue-700'
                  }`}>
                    <div className="w-5 h-5 bg-slate-900 text-yellow-300 border-2 border-black rounded-full flex items-center justify-center text-xs animate-reel-spin shadow-xs">
                      ⚙️
                    </div>
                    <span className="text-xs sm:text-sm">
                      {reelProgress < 28 ? '⚠️ TEGANGAN KRITIS! IKAN MENARIK!' : reelProgress > 75 ? '✨ IKAN DEKAT! TAHAN!' : '⚡ TARIK! TAP CEPAT BERULANG KALI!'}
                    </span>
                  </span>
                  <span className="font-mono text-sm sm:text-base font-black px-2.5 py-0.5 bg-slate-900 text-yellow-300 border-2 border-black rounded">
                    {Math.round(Math.max(0, Math.min(100, reelProgress)))}%
                  </span>
                </div>

                <div className="w-full h-[28px] sm:h-[30px] bg-slate-950 border-[3px] border-black p-0.5 relative rounded-xs overflow-hidden">
                  {/* Progress Milestone Ticks */}
                  <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-20 z-0">
                    <div className="w-[1px] h-full bg-white" />
                    <div className="w-[1px] h-full bg-white" />
                    <div className="w-[1px] h-full bg-white" />
                    <div className="w-[1px] h-full bg-white" />
                  </div>

                  {/* Realtime Fill (No transition lag for 100% full precision) */}
                  <div
                    className={`h-full relative rounded-xs ${
                      reelProgress < 28
                        ? 'bg-gradient-to-r from-red-600 to-rose-500'
                        : reelProgress > 75
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300'
                        : 'bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-300'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, reelProgress))}%` }}
                  >
                    <div className="absolute top-0 bottom-0 right-0 w-[4px] bg-white shadow-[0_0_8px_#fff]" />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-1.5 text-xs font-black text-slate-800">
                  <span className="flex items-center gap-1">
                    <span>JARAK:</span>
                    <strong className="text-blue-800">{Math.max(0, Math.round((100 - reelProgress) * 0.4))}m</strong>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded border border-black text-xs ${
                    reelProgress < 28 ? 'bg-red-500 text-white animate-pulse' : reelProgress > 75 ? 'bg-emerald-600 text-white' : 'bg-amber-300 text-slate-900'
                  }`}>
                    {reelProgress < 28 ? '⚠️ RESISTENSI TINGGI' : reelProgress > 75 ? '🟢 TANGKAPAN AMAN' : '🔵 MENARIK KAIL'}
                  </span>
                  <span className="font-bold">TAP TAP TAP! 🔥</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ================= MAIN 800x600 SCALED CANVAS ================= */}
      <div
        ref={gameCanvasRef}
        style={{
          width: 800,
          height: canvasHeight,
          transform: `scale(${scale.x}, ${scale.y})`,
          transformOrigin: 'center',
        }}
        className={`relative overflow-hidden shadow-[0_0_0_6px_#000,0_0_0_12px_#38bdf8] shrink-0 bg-sky-300 ${
          isScreenShaking ? 'animate-[shake_0.2s_infinite]' : ''
        }`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* Sky & Atmospheric Bands */}
        <div className="absolute inset-0 pointer-events-none">
          {timeOfDay === 'pagi' && (
            <>
              <div className="absolute top-0 inset-x-0 bg-[#0284c7]" style={{ bottom: waterHeight + 285 }} />
              <div className="absolute inset-x-0 h-[70px] bg-[#38bdf8]" style={{ bottom: waterHeight + 215 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#7dd3fc]" style={{ bottom: waterHeight + 140 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#bae6fd]" style={{ bottom: waterHeight + 65 }} />
              <div className="absolute inset-x-0 h-[65px] bg-[#e0f2fe]" style={{ bottom: waterHeight }} />
            </>
          )}
          {timeOfDay === 'siang' && (
            <>
              <div className="absolute top-0 inset-x-0 bg-[#0284c7]" style={{ bottom: waterHeight + 285 }} />
              <div className="absolute inset-x-0 h-[70px] bg-[#0ea5e9]" style={{ bottom: waterHeight + 215 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#38bdf8]" style={{ bottom: waterHeight + 140 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#7dd3fc]" style={{ bottom: waterHeight + 65 }} />
              <div className="absolute inset-x-0 h-[65px] bg-[#bae6fd]" style={{ bottom: waterHeight }} />
            </>
          )}
          {timeOfDay === 'senja' && (
            <>
              <div className="absolute top-0 inset-x-0 bg-[#431407]" style={{ bottom: waterHeight + 285 }} />
              <div className="absolute inset-x-0 h-[70px] bg-[#7c2d12]" style={{ bottom: waterHeight + 215 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#c2410c]" style={{ bottom: waterHeight + 140 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#f97316]" style={{ bottom: waterHeight + 65 }} />
              <div className="absolute inset-x-0 h-[65px] bg-[#fdba74]" style={{ bottom: waterHeight }} />
            </>
          )}
          {timeOfDay === 'malam' && (
            <>
              <div className="absolute top-0 inset-x-0 bg-[#020617]" style={{ bottom: waterHeight + 285 }} />
              <div className="absolute inset-x-0 h-[70px] bg-[#0f172a]" style={{ bottom: waterHeight + 215 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#1e1b4b]" style={{ bottom: waterHeight + 140 }} />
              <div className="absolute inset-x-0 h-[75px] bg-[#312e81]" style={{ bottom: waterHeight + 65 }} />
              <div className="absolute inset-x-0 h-[65px] bg-[#4338ca]" style={{ bottom: waterHeight }} />

              <div className="absolute left-12 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ bottom: waterHeight + 230 }} />
              <div className="absolute left-64 w-2 h-2 bg-amber-200 rounded-full animate-pulse" style={{ bottom: waterHeight + 210 }} />
              <div className="absolute right-96 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDelay: '1s', bottom: waterHeight + 220 }} />
              <div className="absolute right-48 w-2 h-2 bg-amber-100 rounded-full animate-pulse" style={{ animationDelay: '0.5s', bottom: waterHeight + 170 }} />
            </>
          )}

          {/* Weather Effects */}
          {weather === 'hujan' && (
            <>
              {Array.from({ length: 30 }).map((_, idx) => (
                <div
                  key={idx}
                  className="absolute w-[2px] h-[22px] bg-sky-200/60"
                  style={{
                    left: `${(idx * 28) % 800}px`,
                    top: '-40px',
                    animation: `rainFall ${0.7 + (idx % 3) * 0.12}s linear infinite`,
                    animationDelay: `${idx * 0.05}s`,
                  }}
                />
              ))}
            </>
          )}

          {weather === 'badai' && (
            <>
              <div className="absolute top-0 inset-x-0 h-[90px] bg-slate-950/40 pointer-events-none" />
              {Array.from({ length: 45 }).map((_, idx) => (
                <div
                  key={idx}
                  className="absolute w-[2.5px] h-[34px] bg-sky-200/70"
                  style={{
                    left: `${(idx * 20) % 800}px`,
                    top: '-50px',
                    animation: `rainFall ${0.45 + (idx % 4) * 0.1}s linear infinite`,
                    animationDelay: `${idx * 0.06}s`,
                  }}
                />
              ))}
            </>
          )}

          {weather === 'kabut_mistis' && (
            <div className="absolute inset-x-0 h-[120px] bg-gradient-to-t from-purple-500/25 via-pink-400/15 to-transparent pointer-events-none animate-pulse" style={{ bottom: waterHeight }} />
          )}

          {/* Sun / Moon */}
          <div className="absolute right-[70px]" style={{ bottom: waterHeight + 170 }}>
            {timeOfDay === 'malam' ? (
              <div className="relative">
                <div className="w-[52px] h-[52px] bg-[#FEF08A] rounded-full border-[4px] border-[#FDE047] shadow-[0_0_30px_rgba(254,240,138,0.8)]" />
                <div className="absolute top-2 left-2 w-3 h-3 bg-amber-200/50 rounded-full" />
                <div className="absolute bottom-3 right-3 w-4 h-4 bg-amber-200/40 rounded-full" />
              </div>
            ) : weather === 'badai' ? (
              <div className="relative">
                <div className="w-[60px] h-[36px] bg-slate-700 rounded-full border-[3px] border-slate-900 shadow-md flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-400 animate-bounce" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className={`w-[52px] h-[52px] border-[4px] ${timeOfDay === 'senja' ? 'bg-[#FF7E47] border-[#EA580C] shadow-[0_0_30px_rgba(234,88,12,0.8)]' : timeOfDay === 'siang' ? 'bg-[#FFFBEB] border-[#FACC15] shadow-[0_0_40px_rgba(253,224,71,1)]' : 'bg-[#FEF08A] border-[#FACC15] shadow-[0_0_30px_rgba(253,224,71,0.8)]'}`} />
                <div className="absolute -top-3 left-3 w-[28px] h-[6px] bg-[#FDE047]" />
                <div className="absolute -bottom-3 left-3 w-[28px] h-[6px] bg-[#FDE047]" />
                <div className="absolute top-3 -left-3 w-[6px] h-[28px] bg-[#FDE047]" />
                <div className="absolute top-3 -right-3 w-[6px] h-[28px] bg-[#FDE047]" />
              </div>
            )}
          </div>

          {/* Drifting Clouds */}
          <motion.div
            animate={{ x: [-140, 880] }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 opacity-90"
            style={{ bottom: waterHeight + 190 }}
          >
            <div className="relative">
              <div className={`w-[75px] h-[16px] absolute top-0 left-[20px] ${weather === 'badai' || timeOfDay === 'malam' ? 'bg-slate-700' : 'bg-white'}`} />
              <div className={`w-[120px] h-[20px] absolute top-[16px] left-[0px] ${weather === 'badai' || timeOfDay === 'malam' ? 'bg-slate-800' : 'bg-white'}`} />
              <div className={`w-[95px] h-[8px] absolute top-[36px] left-[10px] ${weather === 'badai' || timeOfDay === 'malam' ? 'bg-slate-900' : 'bg-sky-100'}`} />
            </div>
          </motion.div>

          <motion.div
            animate={{ x: [-160, 860] }}
            transition={{ duration: 42, repeat: Infinity, ease: 'linear', delay: 10 }}
            className="absolute left-0 opacity-80"
            style={{ bottom: waterHeight + 140 }}
          >
            <div className="relative">
              <div className={`w-[55px] h-[14px] absolute top-0 left-[15px] ${weather === 'badai' || timeOfDay === 'malam' ? 'bg-slate-700' : 'bg-white'}`} />
              <div className={`w-[85px] h-[16px] absolute top-[14px] left-[0px] ${weather === 'badai' || timeOfDay === 'malam' ? 'bg-slate-800' : 'bg-white'}`} />
              <div className={`w-[65px] h-[6px] absolute top-[30px] left-[10px] ${weather === 'badai' || timeOfDay === 'malam' ? 'bg-slate-900' : 'bg-sky-100'}`} />
            </div>
          </motion.div>

          {/* Top Hanging Forest Canopy & Moss Vines */}
          <div className="absolute top-0 left-0 pointer-events-none z-10">
            <div className="flex gap-1.5">
              <div className="w-[140px] h-[36px] bg-[#064e3b] rounded-br-3xl border-b-2 border-[#059669]" />
              <div className="w-[90px] h-[26px] bg-[#047857] rounded-b-2xl" />
              <div className="w-[60px] h-[18px] bg-[#059669] rounded-b-xl" />
            </div>
            {/* Swaying hanging vines */}
            <div className="absolute top-[22px] left-[18px] w-[5px] h-[55px] bg-emerald-500 animate-vine rounded-b-full border-r border-emerald-800" />
            <div className="absolute top-[26px] left-[48px] w-[4px] h-[40px] bg-emerald-400 animate-vine rounded-b-full" style={{ animationDelay: '1.2s' }} />
            <div className="absolute top-[18px] left-[92px] w-[6px] h-[65px] bg-emerald-600 animate-vine rounded-b-full" style={{ animationDelay: '0.6s' }} />
            <div className="absolute top-[20px] left-[140px] w-[4px] h-[35px] bg-emerald-500 animate-vine rounded-b-full" style={{ animationDelay: '1.8s' }} />
          </div>

          <div className="absolute top-0 right-0 pointer-events-none z-10 flex flex-col items-end">
            <div className="flex gap-1.5">
              <div className="w-[70px] h-[22px] bg-[#059669] rounded-b-xl" />
              <div className="w-[120px] h-[32px] bg-[#064e3b] rounded-bl-3xl border-b-2 border-[#059669]" />
            </div>
            <div className="absolute top-[20px] right-[24px] w-[5px] h-[48px] bg-emerald-500 animate-vine rounded-b-full" style={{ animationDelay: '0.9s' }} />
            <div className="absolute top-[16px] right-[65px] w-[4px] h-[38px] bg-emerald-400 animate-vine rounded-b-full" style={{ animationDelay: '1.5s' }} />
          </div>

          {/* Lush Mountain & Evergreen Pine Forest Backdrop */}
          <div className="absolute left-0 w-full h-[155px]" style={{ bottom: waterHeight }}>
            <svg width="800" height="155" className="absolute bottom-0 inset-x-0" shapeRendering="crispEdges">
              {/* Distant Emerald Mountains */}
              <polygon points="10,155 120,40 230,155" fill="#064e3b" />
              <polygon points="100,40 120,40 140,40 120,60" fill="#a7f3d0" />

              <polygon points="160,155 300,20 440,155" fill="#065f46" />
              <polygon points="280,20 300,20 320,20 300,45" fill="#d1fae5" />

              <polygon points="410,155 540,50 670,155" fill="#047857" />
              <polygon points="520,50 540,50 560,50 540,70" fill="#a7f3d0" />

              <polygon points="600,155 710,35 820,155" fill="#064e3b" />
              <polygon points="690,35 710,35 730,35 710,60" fill="#d1fae5" />

              {/* Midground Dense Pine Forest Layer */}
              <polygon points="35,155 65,75 95,155" fill="#14532d" />
              <polygon points="80,155 110,85 140,155" fill="#166534" />
              <polygon points="125,155 155,70 185,155" fill="#14532d" />
              <polygon points="215,155 250,65 285,155" fill="#15803d" />
              <polygon points="335,155 375,60 415,155" fill="#14532d" />
              <polygon points="475,155 510,75 545,155" fill="#166534" />
              <polygon points="625,155 660,70 695,155" fill="#14532d" />
              <polygon points="725,155 760,80 795,155" fill="#15803d" />
            </svg>

            {/* Foreground Lush Grass Ridges */}
            <div className="absolute bottom-0 inset-x-0 h-[46px] bg-[#14532d] flex items-end justify-between px-3 border-t-2 border-[#22c55e]">
              <div className="w-[130px] h-[30px] bg-[#16a34a] rounded-t-xl" />
              <div className="w-[220px] h-[38px] bg-[#15803d] rounded-t-xl" />
              <div className="w-[180px] h-[32px] bg-[#16a34a] rounded-t-xl" />
              <div className="w-[150px] h-[26px] bg-[#22c55e] rounded-t-xl" />
            </div>
          </div>

          {/* Pier Grass Slope with Wildflowers & Moss */}
          <div className="absolute left-0 w-[220px] h-[65px] bg-[#15803d] border-b-[6px] border-[#14532d]" style={{ bottom: waterHeight - 10 }}>
            <div className="absolute top-0 inset-x-0 h-[10px] bg-[#22c55e] border-b border-[#16a34a]" />
            <div className="absolute top-[35px] inset-x-0 bottom-0 bg-[#78350f] border-t-[4px] border-[#92400e]">
              {/* Moss clumps on wood edge */}
              <div className="absolute -top-[4px] left-[15px] w-[14px] h-[5px] bg-[#15803d] rounded-full" />
              <div className="absolute -top-[4px] left-[75px] w-[20px] h-[5px] bg-[#22c55e] rounded-full" />
              <div className="absolute -top-[4px] left-[140px] w-[16px] h-[5px] bg-[#16a34a] rounded-full" />
            </div>
            {/* Wildflowers */}
            <div className="absolute top-[4px] left-[35px] w-[6px] h-[6px] bg-yellow-300 rounded-full shadow-[0_0_4px_#fde047]" />
            <div className="absolute top-[2px] left-[90px] w-[6px] h-[6px] bg-pink-400 rounded-full shadow-[0_0_4px_#f472b6]" />
            <div className="absolute top-[5px] left-[150px] w-[6px] h-[6px] bg-amber-300 rounded-full shadow-[0_0_4px_#fcd34d]" />
            <div className="absolute top-[3px] left-[185px] w-[5px] h-[5px] bg-white rounded-full shadow-[0_0_4px_#ffffff]" />
          </div>

          {/* Emerald Jade Water & Underwater Garden */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-b from-[#059669] via-[#047857] to-[#022c22] overflow-hidden" style={{ height: waterHeight }}>
            {/* Animated Emerald Surface Waves */}
            <div className="absolute top-0 inset-x-0 h-[12px] bg-[#34d399]/90 flex overflow-hidden border-b border-[#059669]">
              <div className="w-[832px] h-full flex animate-water">
                {Array.from({ length: 26 }).map((_, i) => (
                  <div key={i} className="w-[32px] h-full flex">
                    <div className="w-[16px] h-full bg-[#6ee7b7]" />
                    <div className="w-[16px] h-full bg-[#059669]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Water Lily Pads & Lotus Flowers */}
            <div className="absolute top-[-6px] left-[360px] pointer-events-none z-10 animate-bobber-float">
              <div className="w-[28px] h-[10px] bg-[#10b981] rounded-full border border-[#065f46] relative shadow-sm">
                <div className="absolute -top-[5px] left-[8px] w-[10px] h-[8px] bg-pink-300 rounded-full border border-pink-500">
                  <div className="w-[4px] h-[4px] bg-yellow-300 rounded-full mx-auto mt-0.5" />
                </div>
              </div>
            </div>

            <div className="absolute top-[-4px] left-[610px] pointer-events-none z-10 animate-bobber-float" style={{ animationDelay: '0.7s' }}>
              <div className="w-[34px] h-[12px] bg-[#059669] rounded-full border border-[#064e3b] relative shadow-sm">
                <div className="absolute -top-[6px] right-[6px] w-[11px] h-[9px] bg-white rounded-full border border-rose-300">
                  <div className="w-[4px] h-[4px] bg-yellow-400 rounded-full mx-auto mt-0.5" />
                </div>
              </div>
            </div>

            <div className="absolute top-[-5px] left-[485px] pointer-events-none z-10 animate-bobber-float" style={{ animationDelay: '1.3s' }}>
              <div className="w-[20px] h-[8px] bg-[#10b981] rounded-full border border-[#047857]" />
            </div>

            {/* Ambient Bioluminescent Fireflies / Forest Spores */}
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`firefly-${idx}`}
                className="absolute w-2 h-2 rounded-full bg-lime-300 shadow-[0_0_8px_#a3e635] animate-firefly pointer-events-none"
                style={{
                  left: `${180 + idx * 95}px`,
                  top: `${40 + (idx % 3) * 55}px`,
                  animationDelay: `${idx * 0.6}s`,
                }}
              />
            ))}

            {/* Shimmer Streaks */}
            <div className="absolute top-[22px] left-[220px] w-[70px] h-[3px] bg-emerald-200/50 rounded-full" />
            <div className="absolute top-[40px] left-[460px] w-[110px] h-[3px] bg-emerald-200/40 rounded-full" />
            <div className="absolute top-[24px] left-[680px] w-[75px] h-[3px] bg-emerald-200/50 rounded-full" />

            {/* Luminous Sunbeams (God Rays) Through Canopy */}
            <div className="absolute top-0 left-[290px] w-[90px] h-full bg-gradient-to-b from-lime-200/25 via-emerald-300/12 to-transparent -rotate-12 pointer-events-none animate-sunbeam" />
            <div className="absolute top-0 left-[510px] w-[110px] h-full bg-gradient-to-b from-lime-200/25 via-emerald-300/12 to-transparent -rotate-12 pointer-events-none animate-sunbeam" style={{ animationDelay: '2s' }} />

            {/* Wooden Pier Pillars with Overgrown Moss */}
            <div className="absolute top-0 left-[35px] w-[22px] h-[190px] bg-[#451a03] border-r-[3px] border-[#78350f]">
              <div className="absolute bottom-[20px] inset-x-0 h-[40px] bg-[#065f46]/90 border-t border-[#10b981]" />
              <div className="absolute top-[30px] left-0 w-[4px] h-[25px] bg-[#10b981]" />
            </div>
            <div className="absolute top-0 left-[115px] w-[22px] h-[210px] bg-[#451a03] border-r-[3px] border-[#78350f]">
              <div className="absolute bottom-[25px] inset-x-0 h-[45px] bg-[#065f46]/90 border-t border-[#10b981]" />
              <div className="absolute top-[45px] right-0 w-[4px] h-[30px] bg-[#10b981]" />
            </div>
            <div className="absolute top-0 left-[185px] w-[22px] h-[180px] bg-[#451a03] border-r-[3px] border-[#78350f]">
              <div className="absolute bottom-[10px] inset-x-0 h-[35px] bg-[#065f46]/90 border-t border-[#10b981]" />
            </div>

            {/* Mossy Riverbed */}
            <div className="absolute bottom-0 inset-x-0 h-[34px] bg-[#14532d] border-t-[4px] border-[#15803d]">
              <div className="absolute top-[6px] left-[260px] w-[18px] h-[10px] bg-[#064e3b] rounded-t-xs" />
              <div className="absolute top-[8px] left-[430px] w-[24px] h-[12px] bg-[#047857] rounded-t-xs" />
              <div className="absolute top-[8px] left-[620px] w-[16px] h-[8px] bg-[#22c55e]" />
              <div className="absolute top-[10px] left-[500px] w-[12px] h-[12px] bg-emerald-300 rotate-12 shadow-[0_0_6px_#6ee7b7]" />
            </div>

            {/* Multi-Layered Swaying Kelp & Aquatic Plants */}
            <div className="absolute bottom-[30px] left-[270px] w-[12px] h-[75px] bg-emerald-500 animate-kelp rounded-t-full" />
            <div className="absolute bottom-[30px] left-[284px] w-[10px] h-[105px] bg-emerald-400 animate-kelp rounded-t-full" style={{ animationDelay: '0.8s' }} />
            <div className="absolute bottom-[30px] left-[550px] w-[14px] h-[85px] bg-emerald-500 animate-kelp rounded-t-full" style={{ animationDelay: '1.4s' }} />
            <div className="absolute bottom-[30px] left-[566px] w-[10px] h-[65px] bg-teal-400 animate-kelp rounded-t-full" style={{ animationDelay: '0.4s' }} />
            <div className="absolute bottom-[30px] left-[710px] w-[12px] h-[95px] bg-emerald-400 animate-kelp rounded-t-full" style={{ animationDelay: '1.9s' }} />

            {/* Ambient Water Bubbles */}
            <div className="absolute bottom-[34px] left-[310px] w-[6px] h-[6px] rounded-full border border-white/70" style={{ animation: 'floatBubble 4s infinite linear' }} />
            <div className="absolute bottom-[34px] left-[590px] w-[8px] h-[8px] rounded-full border border-white/70" style={{ animation: 'floatBubble 5s infinite linear', animationDelay: '2s' }} />
            <div className="absolute bottom-[34px] left-[670px] w-[5px] h-[5px] rounded-full border border-emerald-200/80" style={{ animation: 'floatBubble 3.5s infinite linear', animationDelay: '1.2s' }} />

            {/* Ambient Swimming Fish */}
            <div
              className="absolute top-[70px] opacity-80 flex items-center gap-1"
              style={{ animation: 'fishSwimLeft 14s linear infinite' }}
            >
              <div className="w-[20px] h-[10px] bg-amber-400 rounded-full border border-amber-600 shadow-sm" />
              <div className="w-[6px] h-[8px] bg-amber-500 clip-triangle" />
            </div>
          </div>

          {/* Pier & Lantern */}
          <div className="absolute left-0 w-[230px] h-[32px] bg-[#78350f] border-y-[4px] border-[#451a03] shadow-[0_6px_0_rgba(0,0,0,0.4)]" style={{ bottom: waterHeight - 30 }}>
            <div className="absolute top-full left-[20px] w-[12px] h-[80px] bg-[#451a03] border-x-[2px] border-[#290f01] opacity-90" />
            <div className="absolute top-full left-[110px] w-[12px] h-[80px] bg-[#451a03] border-x-[2px] border-[#290f01] opacity-90" />
            <div className="absolute top-full left-[200px] w-[12px] h-[80px] bg-[#451a03] border-x-[2px] border-[#290f01] opacity-90" />

            <div className="absolute -top-[24px] left-[32px] w-[20px] h-[24px] bg-slate-700 border-[2px] border-black rounded-b-xs">
              <div className="absolute top-[2px] inset-x-[2px] h-[6px] bg-emerald-300" />
            </div>
            <div className="absolute -top-[16px] left-[68px] w-[22px] h-[16px] bg-red-600 border-[2px] border-black">
              <div className="absolute top-[2px] left-[6px] w-[10px] h-[3px] bg-yellow-400" />
            </div>

            {/* Lantern with Warm Luminous Aura */}
            <div className="absolute -top-[32px] left-[180px] z-20">
              <div className="w-[12px] h-[4px] bg-amber-900 border border-black mx-auto" />
              <div className="w-[16px] h-[18px] bg-amber-300 border-[2px] border-black relative overflow-hidden shadow-[0_0_18px_rgba(251,191,36,0.95)] animate-pulse">
                <div className="absolute inset-0 bg-yellow-100 opacity-85" />
                <div className="absolute top-1 left-1.5 w-1 h-2 bg-white rounded-full" />
              </div>
              <div className="w-[20px] h-[4px] bg-amber-950 border border-black mx-auto" />
              <div className="absolute top-full -left-6 w-16 h-12 bg-gradient-to-b from-amber-300/35 to-transparent pointer-events-none rounded-b-full" />
            </div>
          </div>

          {/* Fisherman */}
          <div className="absolute left-[105px] z-10" style={{ bottom: waterHeight - 5 }}>
            <div className="absolute bottom-[0px] left-[10px] w-[28px] h-[18px] bg-[#451a03] border-[2px] border-black">
              <div className="absolute top-[18px] left-[2px] w-[4px] h-[20px] bg-[#451a03]" />
              <div className="absolute top-[18px] right-[2px] w-[4px] h-[20px] bg-[#451a03]" />
            </div>

            <div className="absolute bottom-[16px] left-[12px] w-[20px] h-[22px] bg-blue-800 border-[2px] border-black" />
            <div className="absolute bottom-[36px] left-[8px] w-[26px] h-[32px] bg-amber-400 border-[2px] border-black rounded-t-xs">
              <div className="absolute top-[4px] left-[11px] w-[4px] h-[24px] bg-amber-600" />
            </div>

            <div className="absolute bottom-[66px] left-[10px] w-[22px] h-[20px] bg-amber-200 border-[2px] border-black">
              <div className="absolute top-[6px] right-[4px] w-[3px] h-[3px] bg-black" />
              <div className="absolute bottom-0 inset-x-0 h-[6px] bg-amber-800" />
            </div>
            <div className="absolute bottom-[84px] left-[6px] w-[30px] h-[10px] bg-amber-500 border-[2px] border-black rounded-t-xs">
              <div className="absolute bottom-0 right-[-6px] w-[14px] h-[4px] bg-amber-600" />
            </div>

            {/* Fisherman Sweat / Exertion during Reeling */}
            {gameState === 'reeling' && (
              <div className="absolute -top-[95px] left-[30px] text-sky-400 font-bold text-xs animate-bounce">
                💦
              </div>
            )}

            {/* Arm & Rod with Animated Spinning Mechanical Reel Spool */}
            <div
              className={`absolute bottom-[48px] left-[20px] origin-[4px_16px] ${gameState === 'reeling' ? 'animate-rod-vibrate' : ''}`}
              style={{ transform: `rotate(${rodAngleDeg}deg)` }}
            >
              <div className="w-[20px] h-[8px] bg-amber-400 border-[2px] border-black" />
              <div className="absolute top-0 left-[18px] w-[8px] h-[8px] bg-amber-200 border-[2px] border-black" />
              <div className="absolute top-[-4px] left-[16px] w-[28px] h-[8px] bg-amber-900 border-[2px] border-black" />

              {/* High-Detail Mechanical Reel Housing & Spinning Spool */}
              <div className="absolute top-[-11px] left-[24px] w-[15px] h-[15px] bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 border-[2px] border-black rounded-full shadow-[0_0_4px_rgba(0,0,0,0.8)] flex items-center justify-center">
                {/* Spool Center */}
                <div className={`w-[7px] h-[7px] rounded-full bg-slate-100 border border-slate-700 flex items-center justify-center ${(gameState === 'reeling' || gameState === 'casting') ? 'animate-reel-crank' : ''}`}>
                  <div className="w-[2px] h-[7px] bg-amber-900" />
                </div>
                {/* Spinning Crank Handle */}
                <div
                  className={`absolute -top-1 -right-1 w-[5px] h-[5px] bg-red-600 rounded-full border border-black ${(gameState === 'reeling' || gameState === 'casting') ? 'animate-reel-crank origin-[-3px_9px]' : ''}`}
                />
              </div>

              {/* Rod Carbon/Gold Shaft */}
              <div
                className="absolute top-[-3px] left-[42px] w-[165px] h-[4px] border-t border-black shadow-[0_0_4px_rgba(0,0,0,0.5)]"
                style={{ backgroundColor: currentEquippedRodItem.color || '#facc15' }}
              />
              <div className="absolute top-[-3px] left-[205px] w-[10px] h-[4px] bg-red-600">
                <div ref={rodTipRef} className="absolute top-[2px] right-0 w-[1px] h-[1px] opacity-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Fishing Line with Dynamic High-Tension Shimmer */}
          {(gameState === 'casting' || gameState === 'waiting' || gameState === 'biting' || gameState === 'reeling') && (
            <svg width="800" height={canvasHeight} className="absolute inset-0 pointer-events-none z-20">
              <defs>
                <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path
                d={
                  gameState === 'reeling'
                    ? `M ${rodTipPos.x} ${rodTipPos.y} Q ${(rodTipPos.x + bobberPos.x) / 2} ${Math.min(rodTipPos.y, bobberPos.y) - 35} ${bobberPos.x} ${bobberPos.y}`
                    : `M ${rodTipPos.x} ${rodTipPos.y} Q ${(rodTipPos.x + bobberPos.x) / 2} ${Math.max(rodTipPos.y, bobberPos.y) + 25} ${bobberPos.x} ${bobberPos.y}`
                }
                fill="none"
                stroke={gameState === 'reeling' ? '#ecfdf5' : '#ffffff'}
                strokeWidth={gameState === 'reeling' ? '2.5' : '2'}
                strokeDasharray={gameState === 'reeling' ? '4 3' : 'none'}
                filter={gameState === 'reeling' ? 'url(#lineGlow)' : 'none'}
                className={gameState === 'biting' ? 'animate-pulse' : ''}
              />
            </svg>
          )}

          {/* Bobber, Dynamic Foam Wake & Underwater Struggling Fish Silhouette */}
          {(gameState === 'casting' || gameState === 'waiting' || gameState === 'biting' || gameState === 'reeling') && (
            <div
              className={`absolute z-20 flex flex-col items-center justify-center ${gameState === 'waiting' ? 'animate-bobber-float' : ''}`}
              style={{ left: bobberPos.x, top: bobberPos.y, transform: 'translate(-50%, -50%)' }}
            >
              {/* Dynamic Water Foam Wake & Water Spray while Reeling */}
              {gameState === 'reeling' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                  <div className="w-[54px] h-[18px] border-2 border-emerald-200/90 rounded-full animate-foam" />
                  <div className="absolute w-[36px] h-[12px] border border-white/80 rounded-full animate-ping" />
                  {/* Water splash droplets spray */}
                  <div className="absolute -top-3 -left-3 text-xs animate-bounce">💦</div>
                  <div className="absolute -top-4 right-[-10px] text-xs animate-bounce" style={{ animationDelay: '0.1s' }}>💦</div>
                </div>
              )}

              {/* Underwater Struggling Fish Silhouette while Reeling */}
              {gameState === 'reeling' && (
                <div className="absolute top-[28px] left-1/2 -translate-x-1/2 pointer-events-none opacity-90 animate-fish-fight">
                  <div className="relative flex items-center">
                    <div className="w-[30px] h-[15px] bg-[#022c22] rounded-full border border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                    <div className="w-[10px] h-[12px] -ml-1 bg-emerald-600 clip-triangle" />
                    {/* Air bubbles generated from struggling fish */}
                    <div className="absolute -top-2 left-1 w-2 h-2 rounded-full border border-white/80 animate-ping" />
                    <div className="absolute -bottom-2 right-2 w-1.5 h-1.5 rounded-full border border-white/80 animate-ping" style={{ animationDelay: '0.15s' }} />
                  </div>
                </div>
              )}

              {/* The Bobber Float */}
              <div className={`relative ${gameState === 'biting' ? 'animate-bounce' : gameState === 'reeling' ? 'animate-[shake_0.15s_infinite]' : ''}`}>
                {(gameState === 'waiting' || gameState === 'biting') && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38px] h-[10px] border-[2px] border-emerald-200 rounded-full animate-ping opacity-75" />
                )}

                <div className="w-[10px] h-[4px] bg-yellow-400 mx-auto" />
                <div className="w-[14px] h-[10px] bg-red-600 border-x border-black" />
                <div className="w-[14px] h-[10px] bg-white border-x border-b border-black" />

                <AnimatePresence>
                  {gameState === 'biting' && (
                    <motion.div
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1.25, y: -20 }}
                      exit={{ scale: 0 }}
                      className="absolute bottom-[35px] left-1/2 -translate-x-1/2 flex flex-col items-center z-30"
                    >
                      <div className="bg-red-600 text-yellow-300 font-black text-3xl px-3.5 py-1 border-[3px] border-black shadow-[4px_4px_0_0_#000] animate-pulse leading-none">
                        !
                      </div>
                      <div className="text-xs font-black text-white bg-black px-2.5 py-1 mt-1.5 border border-white whitespace-nowrap shadow-md">
                        TAP SEKARANG!
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Splashes */}
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

          {/* Floating Pops */}
          <AnimatePresence>
            {floatingTexts.map(ft => (
              <motion.div
                key={ft.id}
                initial={{ opacity: 0, y: 0, scale: 0.6 }}
                animate={{ opacity: 1, y: -40, scale: 1.1 }}
                exit={{ opacity: 0, y: -70 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute pointer-events-none z-40 text-xs font-black drop-shadow-[2px_2px_0_#000] border border-black bg-black/85 px-2.5 py-1 rounded-xs"
                style={{ left: ft.x, top: ft.y, color: ft.color, transform: 'translate(-50%, -50%)' }}
              >
                {ft.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ================= MODALS & STATE OVERLAYS ================= */}
        <AnimatePresence>
          {isJournalOpen && (
            <FishingJournal
              key="journal-modal"
              score={score}
              caughtCount={caughtCount}
              discoveredSpecies={discoveredSpecies}
              soundEnabled={soundEnabled}
              onClose={closeModal}
            />
          )}

          {isOddsOpen && (
            <FishingOddsModal
              key="odds-modal"
              equippedRod={equippedRod}
              equippedBait={equippedBait}
              weather={weather}
              adminOdds={adminOdds}
              setAdminOdds={setAdminOdds}
              setCoins={setCoins}
              soundEnabled={soundEnabled}
              onClose={closeModal}
            />
          )}

          {isShopOpen && (
            <FishingShopModal
              key="shop-modal"
              coins={coins}
              setCoins={setCoins}
              equippedRod={equippedRod}
              setEquippedRod={setEquippedRod}
              ownedRods={ownedRods}
              setOwnedRods={setOwnedRods}
              equippedBait={equippedBait}
              setEquippedBait={setEquippedBait}
              baitCounts={baitCounts}
              setBaitCounts={setBaitCounts}
              soundEnabled={soundEnabled}
              onClose={closeModal}
            />
          )}

          {/* Start Screen */}
          {gameState === 'idle' && !hasStarted && (
            <motion.div
              key="start-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 z-40 p-4 select-none"
              onClick={() => {
                unlockAudio();
                playSound('click');
                startPreparing();
              }}
            >
              <div className="bg-amber-100 border-[6px] border-black p-6 sm:p-8 shadow-[10px_10px_0_0_#000] text-center max-w-[520px] w-full relative mt-4">
                <div className="bg-blue-600 text-white border-[4px] border-black py-3 px-6 -mt-11 mx-auto inline-block shadow-[4px_4px_0_0_#000]">
                  <h1 className="text-xl sm:text-2xl font-black tracking-wider text-yellow-300 drop-shadow-[2px_2px_0_#000]">
                    ENCORE FISHING PRO
                  </h1>
                </div>

                <div className="mt-5 space-y-2.5 text-xs sm:text-sm font-bold text-slate-800 text-left bg-amber-50 p-4 border-[3px] border-black leading-relaxed">
                  <p className="flex items-center gap-2.5">
                    <span className="bg-amber-800 text-white px-2.5 py-0.5 text-xs font-mono font-bold">1</span>
                    <span>Tahan layar untuk mengisi Tenaga lemparan kail.</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <span className="bg-amber-800 text-white px-2.5 py-0.5 text-xs font-mono font-bold">2</span>
                    <span>Lepas di zona <strong className="text-amber-800">PERFECT (80-95%)</strong> untuk strike cepat.</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <span className="bg-amber-800 text-white px-2.5 py-0.5 text-xs font-mono font-bold">3</span>
                    <span>Saat tanda seru (<span className="text-red-600 font-black text-base">!</span>) muncul, segera TAP layar!</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <span className="bg-amber-800 text-white px-2.5 py-0.5 text-xs font-mono font-bold">4</span>
                    <span>TAP cepat berulang kali untuk menarik ikan ke perahu.</span>
                  </p>
                </div>

                <div className="mt-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm sm:text-base py-3.5 border-[4px] border-black shadow-[4px_4px_0_0_#000] animate-pulse cursor-pointer">
                  KLIK / TAP UNTUK MEMULAI
                </div>
              </div>
            </motion.div>
          )}

          {/* Flash screen on catch */}
          {flashScreen && (
            <div className="absolute inset-0 bg-white z-[60] pointer-events-none animate-ping" />
          )}

          {/* Catch Result Celebration Modal */}
          {gameState === 'caught' && fish && fishStats && (
            <motion.div
              key="catch-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-50 p-3 sm:p-4 overflow-hidden select-none"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Aurora background */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                <div
                  className={`w-[520px] h-[520px] rounded-full blur-3xl opacity-60 animate-pulse ${
                    fish.rarity === 'Mitos'
                      ? 'bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-400'
                      : fish.rarity === 'Legendaris'
                      ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-500'
                      : 'bg-gradient-to-tr from-sky-500 to-emerald-400'
                  }`}
                />
                {(fish.rarity === 'Mitos' || fish.rarity === 'Legendaris') && (
                  <>
                    <div className="absolute w-[420px] h-[420px] rounded-full border border-amber-400/30 animate-[divineRing_24s_linear_infinite]" />
                    <div className="absolute w-[300px] h-[300px] rounded-full border-[3px] border-amber-300/40 animate-shockwave" />
                  </>
                )}
              </div>

              {/* Confetti particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {confettiParticles.map(p => (
                  <div
                    key={p.id}
                    className="absolute text-base select-none animate-particle-float"
                    style={{
                      left: `${p.x}px`,
                      top: `${p.y}px`,
                      animationDelay: `${p.delay}s`,
                      animationDuration: `${p.speed}s`,
                      transform: `scale(${p.scale})`,
                    }}
                  >
                    {p.emoji}
                  </div>
                ))}
              </div>

              {/* Trophy Card */}
              <motion.div
                initial={{ scale: 0.35, y: 35, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 190 }}
                className={`bg-amber-100 border-[6px] ${
                  fish.rarity === 'Mitos'
                    ? 'border-purple-600 shadow-[0_0_60px_rgba(168,85,247,0.9),10px_10px_0_0_#000]'
                    : fish.rarity === 'Legendaris'
                    ? 'border-amber-500 shadow-[0_0_50px_rgba(234,179,8,0.8),10px_10px_0_0_#000]'
                    : 'border-black shadow-[10px_10px_0_0_#000]'
                } p-5 sm:p-6 w-full max-w-[460px] text-slate-900 text-center relative z-10 flex flex-col max-h-[580px] overflow-hidden`}
              >
                <div className="relative z-10 flex-1 overflow-y-auto min-h-0 custom-scrollbar pb-1">
                  {/* Grand Banner */}
                  <div
                    className={`py-2 px-4 mb-2.5 inline-block shadow-[4px_4px_0_0_#000] border-[4px] border-black ${
                      fish.rarity === 'Mitos'
                        ? 'bg-gradient-to-r from-purple-800 via-pink-600 to-amber-500 text-white animate-pulse'
                        : fish.rarity === 'Legendaris'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    <h2 className="text-sm sm:text-base font-black text-yellow-300 flex items-center justify-center gap-1.5 tracking-wide font-sans">
                      {fish.rarity === 'Mitos' ? (
                        <>⭐ 👑 MAHA MITOS DEWA SAMUDRA! 👑 ⭐</>
                      ) : fish.rarity === 'Legendaris' ? (
                        <>👑 🏆 TANGKAPAN LEGENDARIS! 🏆 👑</>
                      ) : (
                        <><Sparkles className="w-4 h-4 text-yellow-300" /> TERTANGKAP!</>
                      )}
                    </h2>
                  </div>

                  {/* Showcase Pedestal */}
                  <div className="flex justify-center my-2">
                    <div
                      className={`w-[140px] h-[140px] border-[4px] ${
                        fish.rarity === 'Mitos'
                          ? 'border-purple-600 bg-gradient-to-tr from-slate-950 via-purple-950 to-indigo-950 shadow-[0_0_35px_rgba(168,85,247,0.9)]'
                          : fish.rarity === 'Legendaris'
                          ? 'border-amber-500 bg-gradient-to-tr from-amber-200 to-yellow-100 shadow-[0_0_25px_rgba(234,179,8,0.8)]'
                          : 'border-black bg-gradient-to-b from-sky-100 to-amber-100'
                      } shadow-[5px_5px_0_0_#000] flex items-center justify-center p-2 relative overflow-hidden`}
                    >
                      <motion.div
                        animate={{ y: [-5, 5, -5], rotate: [-4, 4, -4] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="relative z-10"
                      >
                        <FishGraphic id={fish.id} size={110} />
                      </motion.div>
                    </div>
                  </div>

                  {/* Stats & Details */}
                  <div className="space-y-2 mb-2.5">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 font-sans">{fish.name}</h3>
                    <div
                      className="inline-block px-3.5 py-0.5 text-slate-900 border-[2px] border-black text-xs font-black uppercase tracking-wider"
                      style={{ backgroundColor: fish.badgeBg }}
                    >
                      KELANGKAAN: {fish.rarity}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 font-medium px-2 mt-0.5 leading-snug">{fish.description}</p>

                    <div className="flex justify-center gap-4 mt-2 text-xs sm:text-sm font-bold bg-amber-200/80 p-2.5 border-[2px] border-black font-mono">
                      <span>BERAT: <strong className="text-blue-800">{fishStats.weight} kg</strong></span>
                      <span>PANJANG: <strong className="text-blue-800">{fishStats.length} cm</strong></span>
                    </div>

                    <div className="flex justify-center items-center gap-3 mt-2 text-xs sm:text-sm font-mono font-black">
                      <span className="text-emerald-900 bg-emerald-100 px-3 py-1 border border-emerald-800 shadow-xs">
                        + {fish.points} PTS
                      </span>
                      <span className="text-amber-950 bg-amber-200 px-3 py-1 border border-amber-800 shadow-xs">
                        🪙 +{Math.round(fish.coins * (equippedRod === 'cosmic' ? 2.0 : equippedRod === 'gold' ? 1.5 : 1))} KOIN
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {!caughtActionUnlocked ? (
                    <div className="mt-3 py-3 px-4 bg-slate-900 border-[3px] border-amber-400 text-yellow-300 text-xs sm:text-sm font-black tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                      <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                      <span className="animate-pulse">✨ MEMBUKA HASIL TANGKAPAN...</span>
                    </div>
                  ) : sellConfirmation ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-2 p-3.5 bg-red-950 border-[3px] border-red-500 text-white space-y-2.5 shadow-[0_0_25px_rgba(239,68,68,0.7)]"
                    >
                      <div className="flex items-center justify-center gap-1.5 text-red-300 text-xs sm:text-sm font-black">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>KONFIRMASI JUAL IKAN LANGKA</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-snug">
                        Ikan <strong>{fish.name}</strong> ({fish.rarity}) sangat bernilai. Yakin ingin menjualnya seharga <strong>+{Math.round(fish.coins * (equippedRod === 'cosmic' ? 2.0 : equippedRod === 'gold' ? 1.5 : 1))} 🪙</strong>?
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound('click');
                            setSellConfirmation(false);
                          }}
                          className="flex-1 py-2.5 bg-amber-400 text-slate-950 border-[2px] border-black font-black text-xs hover:bg-amber-300 shadow-[2px_2px_0_0_#000] cursor-pointer"
                        >
                          BATAL (SIMPAN)
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound('upgrade');
                            const extraCoins = Math.round(fish.coins * (equippedRod === 'cosmic' ? 2.0 : equippedRod === 'gold' ? 1.5 : 1));
                            setCoins(c => c + extraCoins);
                            triggerFloatingText(`+${extraCoins} 🪙 DIJUAL!`, bobberPos.x, bobberPos.y - 60, '#facc15');
                            setGameState('idle');
                          }}
                          className="flex-1 py-2.5 bg-red-600 text-white border-[2px] border-black font-black text-xs hover:bg-red-500 shadow-[2px_2px_0_0_#000] cursor-pointer"
                        >
                          TETAP JUAL
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2.5 mt-3"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playSound('click');
                          setGameState('idle');
                        }}
                        className="flex-1 py-3 px-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 border-[3px] border-black font-black text-xs sm:text-sm hover:brightness-110 shadow-[3px_3px_0_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4 text-emerald-800" />
                        <span>SIMPAN KE JURNAL</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fish.rarity === 'Mitos' || fish.rarity === 'Legendaris') {
                            playSound('click');
                            setSellConfirmation(true);
                          } else {
                            playSound('upgrade');
                            const extraCoins = Math.round(fish.coins * (equippedRod === 'cosmic' ? 2.0 : equippedRod === 'gold' ? 1.5 : 1));
                            setCoins(c => c + extraCoins);
                            triggerFloatingText(`+${extraCoins} 🪙 DIJUAL!`, bobberPos.x, bobberPos.y - 60, '#facc15');
                            setGameState('idle');
                          }
                        }}
                        className="py-3 px-3 sm:px-4 bg-emerald-600 text-white border-[3px] border-black font-black text-xs sm:text-sm hover:bg-emerald-500 shadow-[3px_3px_0_0_#000] active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                      >
                        <Coins className="w-4 h-4 text-yellow-300" />
                        <span>JUAL (+{Math.round(fish.coins * (equippedRod === 'cosmic' ? 2.0 : equippedRod === 'gold' ? 1.5 : 1))}🪙)</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Escaped Screen */}
          {gameState === 'escaped' && (
            <motion.div
              key="escape-modal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-50 p-4 select-none"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="bg-red-700 border-[5px] border-black p-5 sm:p-6 w-full max-w-[420px] text-white shadow-[8px_8px_0_0_#000] text-center relative">
                <h2 className="text-xl sm:text-2xl font-black mb-3 text-yellow-300 drop-shadow-[2px_2px_0_#000] font-sans">
                  IKAN LEPAS...
                </h2>

                <div className="flex justify-center my-3">
                  <div className="w-[85px] h-[85px] border-[3px] border-black bg-slate-900 flex items-center justify-center shadow-sm">
                    <AlertCircle className="w-[50px] h-[50px] text-amber-400" />
                  </div>
                </div>

                <div className="text-xs sm:text-sm font-bold bg-red-900/90 p-3 border-[2px] border-black mb-4 leading-relaxed font-sans">
                  {escapeReason === 'early' && 'Terlalu Cepat! Kamu menarik kail sebelum ikan menggigit.'}
                  {escapeReason === 'missed' && 'Terlalu Lambat! Ikan keburu kabur memakan umpan.'}
                  {escapeReason === 'failed' && 'Tenaga Ikan Terlalu Kuat! Tarikanmu kalah kencang.'}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSound('click');
                    setGameState('idle');
                  }}
                  className="w-full py-3.5 bg-white text-slate-900 border-[3px] border-black font-black text-sm hover:bg-slate-100 shadow-[3px_3px_0_0_#000] active:translate-y-0.5 cursor-pointer font-sans"
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
