const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

const oldLogs = `{/* Sidebar / Logs */}
          <div className="w-full lg:w-80 bg-slate-950 border-l border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white">Game Logs</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {gameState.logs.map((log, i) => (
                <div key={i} className="text-sm bg-slate-900 border border-slate-800 p-3 rounded-lg text-slate-300">
                  {log}
                </div>
              ))}
              <div id="logs-end" />
            </div>
            
            {/* Players List Sidebar */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Players</h4>
              <div className="space-y-2">
                {gameState.players.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className={\`w-2 h-2 rounded-full \${gameState.currentTurn === i && gameState.status === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}\`}></div>
                      <span className={\`font-bold text-sm \${p.id === localPlayerId ? 'text-indigo-400' : 'text-slate-300'}\`}>{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">{p.hand.length} 🃏</span>
                  </div>
                ))}
              </div>
            </div>
          </div>`;

const newLogs = `{/* Sidebar */}
          <div className="w-full lg:w-80 bg-slate-950 border-l border-slate-800 flex flex-col">
            {/* Players List Sidebar */}
            <div className="p-4 flex-1 overflow-y-auto bg-slate-900/50">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Players</h4>
              <div className="space-y-2">
                {gameState.players.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className={\`w-2 h-2 rounded-full \${gameState.currentTurn === i && gameState.status === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}\`}></div>
                      <span className={\`font-bold text-sm \${p.id === localPlayerId ? 'text-indigo-400' : 'text-slate-300'}\`}>{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">{p.hand.length} 🃏</span>
                  </div>
                ))}
              </div>
            </div>
          </div>`;

code = code.replace(oldLogs, newLogs);
fs.writeFileSync('src/components/UnoGameSection.tsx', code);
