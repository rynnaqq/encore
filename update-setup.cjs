const fs = require('fs');
let code = fs.readFileSync('src/components/SnakeAndLaddersSection.tsx', 'utf8');

// 1. imports
code = code.replace(/import \{ Dices, User, Bot, RotateCcw, Trophy \} from 'lucide-react';/, `import { Dices, User, Bot, RotateCcw, Trophy, Users, Plus, X, ChevronLeft, Settings } from 'lucide-react';`);

// 2. Add available colors and gameStarted state
const stateMatch = /const \[players, setPlayers\] = useState<Player\[\]>\(\[\n.*?\n.*?\]\);/ms;
const stateReplacement = `const [isGameStarted, setIsGameStarted] = useState(false);
  const availableColors = ['#E195AB', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
  const [setupPlayers, setSetupPlayers] = useState([
    { id: 'p1', name: 'Player 1', color: '#E195AB' },
    { id: 'p2', name: 'Player 2', color: '#3b82f6' }
  ]);
  const [players, setPlayers] = useState<Player[]>([]);`;
code = code.replace(stateMatch, stateReplacement);


// 3. Add handleAddPlayer, handleRemovePlayer, handleStartGame
const addLogMatch = /const addLog = \(msg: string\) => \{/;
const newMethods = `const handleAddPlayer = () => {
    if (setupPlayers.length < 4) {
      setSetupPlayers([...setupPlayers, { 
        id: \`p\${Date.now()}\`, 
        name: \`Player \${setupPlayers.length + 1}\`, 
        color: availableColors[setupPlayers.length % availableColors.length] 
      }]);
    }
  };

  const handleRemovePlayer = (id: string) => {
    if (setupPlayers.length > 2) {
      setSetupPlayers(setupPlayers.filter(p => p.id !== id));
    }
  };

  const handleStartGame = () => {
    setPlayers(setupPlayers.map(p => ({
      ...p,
      position: 1,
      isBot: false,
      icon: <User className="w-5 h-5" />
    })));
    setIsGameStarted(true);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setWinner(null);
    setGameLog(['Game started!']);
  };

  const resetToSetup = () => {
    setIsGameStarted(false);
    setWinner(null);
  };

  const addLog = (msg: string) => {`;
code = code.replace(addLogMatch, newMethods);

// 4. Update JSX Structure
const jsxMatch = /<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">(.|\n)*?{typeof document !== 'undefined'/m;
const jsxReplacement = `
        {!isGameStarted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl border-2 border-[#FFCCE1] p-6 sm:p-8 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-[#FFCCE1]/50 pb-4">
              <div className="w-12 h-12 rounded-xl bg-[#FFF5D7] flex items-center justify-center text-[#E195AB]">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">Game Setup</h3>
                <p className="text-slate-500 font-medium text-sm">Configure 2 to 4 players to start the game.</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              {setupPlayers.map((sp, idx) => (
                <div key={sp.id} className="flex flex-col sm:flex-row gap-4 items-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md" style={{ backgroundColor: sp.color }}>
                    <User className="w-5 h-5" />
                  </div>
                  <input 
                    type="text" 
                    value={sp.name}
                    onChange={(e) => setSetupPlayers(setupPlayers.map(p => p.id === sp.id ? { ...p, name: e.target.value } : p))}
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E195AB] focus:border-transparent font-bold text-slate-700 w-full"
                    placeholder={\`Player \${idx + 1}\`}
                    maxLength={15}
                  />
                  <div className="flex gap-2">
                    {availableColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSetupPlayers(setupPlayers.map(p => p.id === sp.id ? { ...p, color } : p))}
                        className={\`w-8 h-8 rounded-full border-2 transition-transform \${sp.color === color ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-110'}\`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  {setupPlayers.length > 2 && (
                    <button 
                      onClick={() => handleRemovePlayer(sp.id)}
                      className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              
              {setupPlayers.length < 4 && (
                <button 
                  onClick={handleAddPlayer}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-[#FFCCE1] text-[#E195AB] font-bold hover:bg-[#FFF5D7]/50 hover:border-[#E195AB] transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add Player
                </button>
              )}
            </div>
            
            <button
              onClick={handleStartGame}
              className="w-full py-4 rounded-xl bg-[#E195AB] text-white font-extrabold text-lg hover:bg-[#d88299] hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Dices className="w-5 h-5" /> Start Multiplayer Game
            </button>
          </motion.div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Board */}
          <div className="lg:col-span-8 flex justify-center">
            <div className="relative w-full max-w-[600px] aspect-square bg-white rounded-3xl border-4 border-[#FFCCE1] shadow-2xl p-2 md:p-4" ref={boardRef}>
              <div className="relative w-full h-full">
                <div className="grid grid-cols-10 grid-rows-10 w-full h-full relative z-10">
                  {cells.map((cellNum) => {
                    const colors = ['bg-rose-100', 'bg-blue-100', 'bg-emerald-100', 'bg-amber-100', 'bg-purple-100'];
                    const colorClass = colors[cellNum % colors.length];
                    return (
                      <div 
                        key={cellNum}
                        className={\`relative flex items-center justify-center border-2 border-white/50 rounded-lg md:rounded-xl m-[1px] md:m-0.5 \${colorClass} shadow-sm\`}
                      >
                        <span className="text-[10px] sm:text-xs font-black text-slate-700/50 absolute top-1 left-1.5">{cellNum}</span>
                      </div>
                    );
                  })}
                </div>

                {/* SVG Overlay for Snakes and Ladders */}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full z-20 pointer-events-none drop-shadow-lg">
                  {Object.entries(SNAKES_AND_LADDERS).map(([start, end], idx) => {
                    const s = parseInt(start);
                    const e = end;
                    const isLadder = e > s;
                    const startP = getCellPercent(s);
                    const endP = getCellPercent(e);
                    
                    const dx = endP.x - startP.x;
                    const dy = endP.y - startP.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                    if (isLadder) {
                      const numRungs = Math.max(3, Math.floor(length / 4));
                      const rungs = [];
                      for (let i = 1; i <= numRungs; i++) {
                        rungs.push((i / (numRungs + 1)) * length);
                      }
                      
                      return (
                        <g key={idx} transform={\`translate(\${startP.x}, \${startP.y}) rotate(\${angle})\`}>
                          {/* Wood rails */}
                          <line x1={0} y1={-2.2} x2={length} y2={-2.2} stroke="#a7683c" strokeWidth="1.2" strokeLinecap="round" />
                          <line x1={0} y1={2.2} x2={length} y2={2.2} stroke="#a7683c" strokeWidth="1.2" strokeLinecap="round" />
                          
                          {/* Inner rails highlight */}
                          <line x1={0} y1={-2.5} x2={length} y2={-2.5} stroke="#8a532d" strokeWidth="0.4" strokeLinecap="round" />
                          <line x1={0} y1={1.9} x2={length} y2={1.9} stroke="#8a532d" strokeWidth="0.4" strokeLinecap="round" />
                          
                          {/* Rungs */}
                          {rungs.map((r, i) => (
                            <line key={i} x1={r} y1={-2.2} x2={r} y2={2.2} stroke="#8a532d" strokeWidth="1" strokeLinecap="round" />
                          ))}
                        </g>
                      );
                    } else {
                      // Snake body waves
                      const numWaves = Math.max(1, Math.floor(length / 12));
                      const points = [];
                      for (let i = 0; i <= 30; i++) {
                        const t = i / 30;
                        const x = t * length;
                        const y = Math.sin(t * numWaves * Math.PI * 2) * 3 * Math.sin(t * Math.PI); // taper amplitude at ends
                        points.push(\`\${x},\${y}\`);
                      }
                      const pathD = \`M \${points.join(' L ')}\`;

                      return (
                        <g key={idx} transform={\`translate(\${startP.x}, \${startP.y}) rotate(\${angle})\`}>
                          {/* Body outline (border) */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#166534"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Body inner */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Pattern / scales */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#15803d"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="1 3"
                          />
                          
                          {/* Snake Head (at 0,0, facing -x) */}
                          <circle cx={-0.5} cy={0} r={2.5} fill="#22c55e" stroke="#166534" strokeWidth="0.4" />
                          
                          {/* Eyes */}
                          <circle cx={-1.5} cy={-1.2} r={0.7} fill="#fff" />
                          <circle cx={-1.5} cy={1.2} r={0.7} fill="#fff" />
                          <circle cx={-1.8} cy={-1.2} r={0.3} fill="#000" />
                          <circle cx={-1.8} cy={1.2} r={0.3} fill="#000" />
                          
                          {/* Tongue */}
                          <path d="M -2.5 0 L -4.5 0 M -4.5 0 L -5.5 -1 M -4.5 0 L -5.5 1" stroke="#ef4444" strokeWidth="0.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                      );
                    }
                  })}
                </svg>

                {/* Players Overlay */}
                <div className="absolute inset-0 z-30 pointer-events-none">
                  {players.map((player, idx) => {
                    const pos = getCellPercent(player.position);
                    // Slight offset if multiple players on same cell
                    const offset = idx * 10 - (players.length * 5) / 2;
                    
                    return (
                      <motion.div
                        key={player.id}
                        initial={false}
                        animate={{
                          left: \`calc(\${pos.x}% + \${offset}px)\`,
                          top: \`calc(\${pos.y}% + \${offset}px)\`,
                        }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                        className="absolute -ml-4 -mt-4 w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-white ring-2 ring-white"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.icon}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border-2 border-[#FFCCE1] shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Dices className="w-4 h-4 text-[#E195AB]" /> Dice Roll
                </h3>
                <button onClick={resetToSetup} className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
                  <Settings className="w-3.5 h-3.5" /> Setup
                </button>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-[#FFF5D7]/50 rounded-xl border border-[#FFCCE1]/50 mb-5">
                <div className={\`text-5xl font-black text-[#E195AB] mb-3 h-14 flex items-center justify-center \${isRolling ? 'animate-bounce' : ''}\`}>
                  {diceValue !== null ? diceValue : '?'}
                </div>
                
                <button
                  onClick={handleRoll}
                  disabled={isRolling || winner !== null || players[currentPlayerIndex]?.isBot}
                  className="w-full py-2.5 rounded-xl bg-[#E195AB] text-white font-extrabold text-sm hover:bg-[#d88299] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-sm flex items-center justify-center gap-2"
                >
                  <Dices className="w-4 h-4" /> 
                  {isRolling ? 'Rolling...' : players[currentPlayerIndex]?.isBot ? 'Bot is thinking...' : \`\${players[currentPlayerIndex]?.name}'s Turn\`}
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Players</h4>
                {players.map((p, idx) => (
                  <div 
                    key={p.id}
                    className={\`flex items-center justify-between p-3 rounded-xl border-2 transition-all \${
                      idx === currentPlayerIndex 
                        ? 'border-[#E195AB] bg-[#FFF5D7]' 
                        : 'border-slate-100 bg-white'
                    }\`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: p.color }}>
                        {p.icon}
                      </div>
                      <div className="font-bold text-sm text-slate-800">{p.name}</div>
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-500">
                      Cell {p.position}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border-2 border-[#FFCCE1] shadow-xl">
               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Game Log</h4>
               <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                 <AnimatePresence>
                   {gameLog.map((log, i) => (
                     <motion.div
                       key={i + log}
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       className="text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                     >
                       {log}
                     </motion.div>
                   ))}
                 </AnimatePresence>
               </div>
            </div>
          </div>
        </div>
        )}

        {typeof document !== 'undefined'`;

code = code.replace(jsxMatch, jsxReplacement);

// 5. Update winner reset buttons
code = code.replace(/<button\n\s*onClick=\{resetGame\}/, `<button\n                  onClick={handleStartGame}`);
code = code.replace(/Play Again/, `Play Again`);
code = code.replace(/<\/button>\n\s*<\/motion\.div>/, `</button>
                <button
                  onClick={resetToSetup}
                  className="w-full mt-3 py-4 rounded-xl bg-white text-slate-700 font-bold text-lg hover:bg-slate-50 border-2 border-slate-200 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Settings className="w-5 h-5" /> Setup Players
                </button>
              </motion.div>`);


fs.writeFileSync('src/components/SnakeAndLaddersSection.tsx', code);
