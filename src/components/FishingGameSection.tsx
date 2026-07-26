import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fish, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type GameState = 'idle' | 'preparing' | 'waiting' | 'biting' | 'reeling' | 'caught' | 'escaped';

interface FishType {
  name: string;
  rarity: 'Biasa' | 'Langka' | 'Sangat Langka' | 'Legendaris';
  color: string;
  difficulty: number;
}

const FISH_DATABASE: FishType[] = [
  { name: 'Sepatu Bekas', rarity: 'Biasa', color: '#78716c', difficulty: 0.5 },
  { name: 'Ikan Teri', rarity: 'Biasa', color: '#94a3b8', difficulty: 1.2 },
  { name: 'Ikan Nila', rarity: 'Biasa', color: '#38bdf8', difficulty: 1.5 },
  { name: 'Ikan Lele', rarity: 'Langka', color: '#334155', difficulty: 2.0 },
  { name: 'Ikan Mas Koi', rarity: 'Sangat Langka', color: '#f87171', difficulty: 2.5 },
  { name: 'Hiu Megalodon', rarity: 'Legendaris', color: '#0f172a', difficulty: 3.2 },
];

const getRandomFish = () => {
   const rand = Math.random();
   if (rand < 0.55) {
       const biasa = FISH_DATABASE.filter(f => f.rarity === 'Biasa');
       return biasa[Math.floor(Math.random() * biasa.length)];
   } else if (rand < 0.85) {
       const langka = FISH_DATABASE.filter(f => f.rarity === 'Langka');
       return langka[Math.floor(Math.random() * langka.length)];
   } else if (rand < 0.96) {
       const sgtLangka = FISH_DATABASE.filter(f => f.rarity === 'Sangat Langka');
       return sgtLangka[Math.floor(Math.random() * sgtLangka.length)];
   } else {
       const legendaris = FISH_DATABASE.filter(f => f.rarity === 'Legendaris');
       return legendaris[Math.floor(Math.random() * legendaris.length)];
   }
}

export const FishingGameSection: React.FC = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>('idle');
  const [power, setPower] = useState(0);
  const [reelProgress, setReelProgress] = useState(0);
  const [fish, setFish] = useState<FishType | null>(null);
  const [bobberPosition, setBobberPosition] = useState(400);
  const [escapeReason, setEscapeReason] = useState<'early' | 'missed' | 'failed' | null>(null);

  const [scale, setScale] = useState({ x: 1, y: 1 });
  const containerRef = useRef<HTMLElement>(null);

  const powerRef = useRef(0);
  const powerDirRef = useRef(1);
  const reqRef = useRef<number>(0);
  const reelProgressRef = useRef(0);
  
  const biteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const escapeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const sw = window.innerWidth / 800;
      const sh = window.innerHeight / 600;
      setScale({ x: sw, y: sh });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
        if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);
        if (escapeTimeoutRef.current) clearTimeout(escapeTimeoutRef.current);
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
    }
  }, []);

  const startPreparing = () => {
    setGameState('preparing');
    setPower(0);
    powerRef.current = 0;
    powerDirRef.current = 1;
    setReelProgress(0);
    reelProgressRef.current = 0;
    setFish(null);
    setEscapeReason(null);

    const animatePower = () => {
        powerRef.current += 1.5 * powerDirRef.current;
        if (powerRef.current >= 100) {
            powerRef.current = 100;
            powerDirRef.current = -1;
        } else if (powerRef.current <= 0) {
            powerRef.current = 0;
            powerDirRef.current = 1;
        }
        setPower(powerRef.current);
        reqRef.current = requestAnimationFrame(animatePower);
    }
    reqRef.current = requestAnimationFrame(animatePower);
  }

  const castLine = () => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    
    // min X = 350, max X = 750
    setBobberPosition(350 + (power / 100) * 400); 
    setGameState('waiting');
    
    const waitTime = Math.random() * 4000 + 1500;
    biteTimeoutRef.current = setTimeout(() => {
        setGameState(prev => {
            if (prev === 'waiting') {
                escapeTimeoutRef.current = setTimeout(() => {
                    setGameState(curr => {
                        if (curr === 'biting') {
                            setEscapeReason('missed');
                            return 'escaped';
                        }
                        return curr;
                    });
                }, 1000);
                return 'biting';
            }
            return prev;
        });
    }, waitTime);
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState === 'idle') {
        startPreparing();
    } else if (gameState === 'waiting') {
        if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);
        if (escapeTimeoutRef.current) clearTimeout(escapeTimeoutRef.current);
        setEscapeReason('early');
        setGameState('escaped');
    } else if (gameState === 'biting') {
        if (escapeTimeoutRef.current) clearTimeout(escapeTimeoutRef.current);
        const randomFish = getRandomFish();
        setFish(randomFish);
        setGameState('reeling');
        reelProgressRef.current = 25;
        setReelProgress(25);
    } else if (gameState === 'reeling') {
        reelProgressRef.current += 15;
        if (reelProgressRef.current >= 100) {
            reelProgressRef.current = 100;
            setGameState('caught');
        }
        setReelProgress(reelProgressRef.current);
    }
  }

  const handlePointerUp = () => {
    if (gameState === 'preparing') {
        castLine();
    }
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === 'reeling' && fish) {
        interval = setInterval(() => {
            reelProgressRef.current -= fish.difficulty;
            if (reelProgressRef.current <= 0) {
                reelProgressRef.current = 0;
                setEscapeReason('failed');
                setGameState('escaped');
            }
            setReelProgress(reelProgressRef.current);
        }, 50);
    }
    return () => {
        if (interval) clearInterval(interval);
    }
  }, [gameState, fish]);

  let rotation = -10;
  if (gameState === 'idle' || gameState === 'preparing') rotation = -60;
  else rotation = -35;

  const pivotX = 96;
  const pivotY = 356;
  const rodLength = 232.05;
  const rodAngle = rotation - 1.23;
  const ROD_TIP_X = pivotX + rodLength * Math.cos(rodAngle * Math.PI / 180);
  const ROD_TIP_Y = pivotY + rodLength * Math.sin(rodAngle * Math.PI / 180);
  
  const BOBBER_Y = 370;

  return (
    <section 
        id="fishing" 
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center select-none touch-none font-mono"
        style={{ 
            fontFamily: '"Press Start 2P", monospace', 
            imageRendering: 'pixelated',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            userSelect: 'none'
        }}
        onContextMenu={(e) => e.preventDefault()}
        ref={containerRef}
    >
        <style>
            {`
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            @keyframes shake {
                0% { transform: rotate(-40deg); }
                50% { transform: rotate(-35deg); }
                100% { transform: rotate(-40deg); }
            }
            .animate-shake {
                animation: shake 0.1s infinite;
            }
            `}
        </style>

        {/* Back Button */}
        <button 
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 z-[200] bg-white border-[4px] border-black p-3 text-black hover:bg-slate-200 flex items-center gap-2 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] transition-colors cursor-pointer"
        >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-bold mt-1">BACK</span>
        </button>

        <div 
            style={{ 
                width: 800, 
                height: 600, 
                transform: `scale(${scale.x}, ${scale.y})`, 
                transformOrigin: 'center' 
            }}
            className="relative bg-sky-300 overflow-hidden shadow-[0_0_0_4px_#000,0_0_0_8px_#fff]"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
        >
            <div className="absolute inset-0 bg-[#87CEEB] pointer-events-none">
                {/* Sun */}
                <div className="absolute top-[40px] right-[80px]">
                   <div className="w-[40px] h-[40px] bg-[#FFD700]" />
                   <div className="absolute top-[-10px] left-[10px] w-[20px] h-[60px] bg-[#FFD700]" />
                   <div className="absolute top-[10px] left-[-10px] w-[60px] h-[20px] bg-[#FFD700]" />
                </div>

                {/* Clouds */}
                <motion.div 
                    animate={{ x: [-100, 900] }}
                    transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-[60px] left-0 opacity-80"
                >
                    <div className="w-[60px] h-[20px] bg-white absolute top-0 left-[20px]" />
                    <div className="w-[100px] h-[20px] bg-white absolute top-[20px] left-0" />
                </motion.div>
                
                <motion.div 
                    animate={{ x: [-100, 900] }}
                    transition={{ duration: 55, repeat: Infinity, ease: 'linear', delay: 10 }}
                    className="absolute top-[120px] left-0 opacity-60 scale-75"
                >
                    <div className="w-[80px] h-[20px] bg-white absolute top-0 left-[20px]" />
                    <div className="w-[120px] h-[20px] bg-white absolute top-[20px] left-0" />
                </motion.div>

                {/* Mountains */}
                <div className="absolute bottom-[250px] left-0 w-full h-[150px]">
                    <div className="absolute bottom-0 left-[50px]">
                        <div className="w-[40px] h-[20px] bg-[#4682B4] mx-auto" />
                        <div className="w-[80px] h-[20px] bg-[#4682B4] mx-auto" />
                        <div className="w-[120px] h-[20px] bg-[#4682B4] mx-auto" />
                        <div className="w-[160px] h-[20px] bg-[#4682B4] mx-auto" />
                        <div className="w-[200px] h-[20px] bg-[#4682B4] mx-auto" />
                    </div>
                    <div className="absolute bottom-0 left-[250px]">
                        <div className="w-[60px] h-[20px] bg-[#5F9EA0] mx-auto" />
                        <div className="w-[120px] h-[20px] bg-[#5F9EA0] mx-auto" />
                        <div className="w-[180px] h-[20px] bg-[#5F9EA0] mx-auto" />
                        <div className="w-[240px] h-[20px] bg-[#5F9EA0] mx-auto" />
                        <div className="w-[300px] h-[20px] bg-[#5F9EA0] mx-auto" />
                        <div className="w-[360px] h-[20px] bg-[#5F9EA0] mx-auto" />
                    </div>
                     <div className="absolute bottom-0 left-[550px]">
                        <div className="w-[40px] h-[20px] bg-[#4682B4] mx-auto" />
                        <div className="w-[100px] h-[20px] bg-[#4682B4] mx-auto" />
                        <div className="w-[160px] h-[20px] bg-[#4682B4] mx-auto" />
                        <div className="w-[220px] h-[20px] bg-[#4682B4] mx-auto" />
                    </div>
                </div>

                {/* Land */}
                <div className="absolute bottom-[200px] left-0 w-[240px] h-[50px] bg-[#2E8B57]" />

                {/* Water */}
                <div className="absolute bottom-0 left-0 w-full h-[250px] bg-[#1E90FF]">
                    <div className="absolute top-[20px] left-[150px] w-[40px] h-[4px] bg-[#87CEFA]" />
                    <div className="absolute top-[60px] left-[450px] w-[60px] h-[4px] bg-[#87CEFA]" />
                    <div className="absolute top-[120px] left-[250px] w-[80px] h-[4px] bg-[#87CEFA]" />
                    <div className="absolute top-[180px] left-[650px] w-[40px] h-[4px] bg-[#87CEFA]" />
                </div>

                {/* Dock */}
                <div className="absolute bottom-[170px] left-0 w-[180px] h-[30px] bg-[#8B4513]">
                   <div className="absolute top-[10px] left-[20px] w-[140px] h-[4px] bg-[#A0522D]" />
                </div>
                <div className="absolute bottom-[20px] left-[30px] w-[16px] h-[150px] bg-[#5C4033]" />
                <div className="absolute bottom-0 left-[120px] w-[16px] h-[170px] bg-[#5C4033]" />

                {/* Player */}
                <div className="absolute bottom-[200px] left-[80px]">
                    <div className="absolute bottom-[60px] left-[10px] w-[24px] h-[24px] bg-[#FFC0CB]">
                        <div className="absolute top-[4px] right-[4px] w-[4px] h-[4px] bg-black" />
                    </div>
                    <div className="absolute bottom-[84px] left-[6px] w-[32px] h-[12px] bg-[#FF4500]" />
                    <div className="absolute bottom-[84px] left-[20px] w-[24px] h-[4px] bg-[#FF4500]" />
                    
                    <div className="absolute bottom-[20px] left-[12px] w-[20px] h-[40px] bg-[#32CD32]" />
                    <div className="absolute bottom-[12px] left-[12px] w-[30px] h-[12px] bg-[#0000CD]" />
                    <div className="absolute bottom-[0px] left-[30px] w-[12px] h-[12px] bg-[#0000CD]" />
                    
                    <div className={`absolute bottom-[40px] left-[16px] origin-[0_4px]`}
                         style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.1s' }}>
                        <div className="w-[20px] h-[8px] bg-[#32CD32]" />
                        <div className="absolute top-0 left-[20px] w-[8px] h-[8px] bg-[#FFC0CB]" />
                        <div className="absolute top-[-4px] left-[16px] w-[24px] h-[6px] bg-[#8B4513] rotate-[-20deg]" />
                        <div className="absolute top-[-2px] left-[32px] w-[200px] h-[2px] bg-slate-900" />
                    </div>
                </div>

                {/* Fishing Line */}
                {(gameState === 'waiting' || gameState === 'biting' || gameState === 'reeling') && (
                    <svg width="800" height="600" className="absolute inset-0 pointer-events-none" shapeRendering="crispEdges">
                        <line 
                            x1={ROD_TIP_X} 
                            y1={ROD_TIP_Y} 
                            x2={bobberPosition} 
                            y2={BOBBER_Y} 
                            stroke="white" 
                            strokeWidth="1.5" 
                            strokeDasharray={gameState === 'reeling' ? "4 4" : "none"}
                        />
                    </svg>
                )}

                {/* Bobber */}
                {(gameState === 'waiting' || gameState === 'biting' || gameState === 'reeling') && (
                    <div 
                        className="absolute z-20 flex flex-col items-center justify-center"
                        style={{ left: bobberPosition, top: BOBBER_Y, transform: 'translate(-50%, -50%)' }}
                    >
                        <div className={`relative ${gameState === 'biting' ? 'animate-bounce' : gameState === 'reeling' ? 'animate-[shake_0.2s_infinite]' : ''}`}>
                            {(gameState === 'waiting' || gameState === 'biting') && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32px] h-[8px] border-[2px] border-white/50 animate-ping" />
                            )}
                            {gameState === 'reeling' && (
                                <>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40px] h-[10px] border-[2px] border-white rounded-full animate-ping opacity-80" />
                                    <div className="absolute top-0 left-[-15px] w-[6px] h-[6px] bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="absolute top-[10px] right-[-15px] w-[4px] h-[4px] bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    <div className="absolute top-[-5px] right-[5px] w-[5px] h-[5px] bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                </>
                            )}
                            <div className="w-[12px] h-[12px] bg-red-500" />
                            <div className="w-[12px] h-[12px] bg-white" />
                            
                            <AnimatePresence>
                                {gameState === 'biting' && (
                                    <motion.div 
                                        initial={{ scale: 0, y: 10 }}
                                        animate={{ scale: 1, y: 0 }}
                                        exit={{ scale: 0 }}
                                        className="absolute bottom-[30px] left-1/2 -translate-x-1/2 text-red-600 text-[40px] font-black drop-shadow-[2px_2px_0_rgba(0,0,0,1)] z-30"
                                    >
                                        !
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>

            {/* UI Overlays */}
            <AnimatePresence>
                {gameState === 'idle' && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-40"
                    >
                        <div className="bg-white border-[4px] border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-center max-w-[500px] w-[90%]">
                            <h1 className="text-[24px] font-bold mb-8 text-blue-600 drop-shadow-[2px_2px_0_#000]">PIXEL FISHING</h1>
                            <div className="space-y-4 text-xs font-bold text-slate-700 text-left px-4 leading-loose">
                                <p>1. HOLD layar untuk power kail.</p>
                                <p>2. LEPAS untuk melempar.</p>
                                <p>3. Tunggu tanda seru (<span className="text-red-500 text-lg">!</span>) muncul.</p>
                                <p>4. Segera TAP saat digigit!</p>
                                <p>5. TAP CEPAT untuk menarik ikan.</p>
                            </div>
                            <p className="mt-8 text-xs animate-pulse text-slate-500">TAP LAYAR UNTUK MULAI</p>
                        </div>
                    </motion.div>
                )}

                {gameState === 'preparing' && (
                    <motion.div 
                        initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
                        className="absolute top-[40px] left-1/2 -translate-x-1/2 bg-white p-4 border-[4px] border-black w-[400px] shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-40 pointer-events-none"
                    >
                        <div className="text-center mb-4 font-black text-red-600 tracking-widest text-sm drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]">POWER</div>
                        <div className="w-full h-[24px] bg-slate-200 border-[2px] border-black p-1">
                            <div className="h-full bg-red-500 transition-all duration-75 ease-linear" style={{ width: `${power}%` }} />
                        </div>
                    </motion.div>
                )}

                {gameState === 'reeling' && (
                    <motion.div 
                        initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
                        className="absolute top-[40px] left-1/2 -translate-x-1/2 bg-white p-4 border-[4px] border-black w-[400px] shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-40 pointer-events-none"
                    >
                        <div className="text-center mb-4 font-black text-blue-600 tracking-widest text-sm animate-pulse drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]">TARIK! (TAP TAP)</div>
                        <div className="w-full h-[24px] bg-slate-200 border-[2px] border-black p-1">
                            <div className="h-full bg-blue-500 transition-all duration-75 ease-linear" style={{ width: `${reelProgress}%` }} />
                        </div>
                    </motion.div>
                )}

                {(gameState === 'caught' || gameState === 'escaped') && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 p-4"
                        onPointerDown={(e) => e.stopPropagation()} 
                    >
                        {gameState === 'caught' && fish ? (
                            <div className="bg-[#4682B4] border-[4px] border-white p-6 w-full max-w-[400px] text-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-center">
                                <h2 className="text-[24px] font-black mb-6 text-yellow-300 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">TERTANGKAP!</h2>
                                <div className="flex justify-center mb-6">
                                    <div className="w-[100px] h-[100px] border-[4px] border-white shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] flex items-center justify-center bg-white">
                                        <Fish className="w-[60px] h-[60px]" style={{ color: fish.color }} fill={fish.color} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[18px] font-bold drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">{fish.name}</p>
                                    <p className="text-[10px] font-bold bg-white/20 inline-block px-3 py-2 border-[2px] border-white">
                                        {fish.rarity}
                                    </p>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setGameState('idle'); }} 
                                    className="mt-8 px-6 py-3 bg-white text-black border-[4px] border-black font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                    COBA LAGI
                                </button>
                            </div>
                        ) : (
                            <div className="bg-red-700 border-[4px] border-white p-6 w-full max-w-[400px] text-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-center">
                                <h2 className="text-[24px] font-black mb-6 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">LEPAS...</h2>
                                <div className="flex justify-center mb-6">
                                    <div className="w-[80px] h-[80px] border-[4px] border-white bg-slate-800 flex items-center justify-center">
                                        <AlertCircle className="w-[50px] h-[50px] text-white" />
                                    </div>
                                </div>
                                <div className="text-[12px] font-bold leading-relaxed px-4 h-[40px]">
                                    {escapeReason === 'early' && "Terlalu Cepat! Ikan ketakutan."}
                                    {escapeReason === 'missed' && "Terlalu Lambat! Ikan kabur."}
                                    {escapeReason === 'failed' && "Tenagamu Habis! Ikan berontak."}
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setGameState('idle'); }} 
                                    className="mt-6 px-6 py-3 bg-white text-black border-[4px] border-black font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                    COBA LAGI
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </section>
  );
};
