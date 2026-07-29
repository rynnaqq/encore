const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

const oldCenter = `{/* Center Deck & Top Card */}
                <div className="flex items-center justify-center gap-12 my-auto relative">
                  
                  {/* Current Color Indicator (For Wilds) */}
                  <div className={\`absolute top-0 transform -translate-y-16 px-6 py-2 rounded-full font-black text-white text-lg tracking-wider uppercase border-2 border-white/20 shadow-xl \${
                    gameState.currentColor === 'Red' ? 'bg-red-500' :
                    gameState.currentColor === 'Blue' ? 'bg-blue-500' :
                    gameState.currentColor === 'Green' ? 'bg-green-500' :
                    gameState.currentColor === 'Yellow' ? 'bg-yellow-500' : 'hidden'
                  }\`}>
                    {gameState.currentColor}
                  </div>

                  {/* Draw Pile */}
                  <div 
                    onClick={isMyTurn ? handleDrawCard : undefined}
                    className={\`w-24 h-36 bg-slate-800 border-4 border-slate-700 rounded-xl shadow-2xl flex items-center justify-center \${isMyTurn ? 'cursor-pointer hover:border-indigo-400 hover:-translate-y-2 transition-all' : 'opacity-50'}\`}
                  >
                    <span className="text-slate-600 font-black text-2xl -rotate-12">UNO</span>
                  </div>

                  {/* Top Card */}
                  {gameState.topCard && (
                    <div className="transform scale-110">
                      {renderCard(gameState.topCard)}
                    </div>
                  )}

                  {/* Turn Indicator */}
                  <div className="absolute right-0 flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700">
                    <span className="text-slate-300 font-bold text-sm">Direction:</span>
                    <ArrowRight className={\`w-5 h-5 text-indigo-400 transform transition-transform duration-500 \${gameState.direction === -1 ? 'rotate-180' : ''}\`} />
                  </div>
                </div>`;

const newCenter = `{/* Center Deck & Top Card */}
                <div className="flex flex-col items-center justify-center gap-4 my-auto py-4">
                  {/* Current Color Indicator (For Wilds) */}
                  <div className={\`px-6 py-2 rounded-full font-black text-white text-lg tracking-wider uppercase border-2 border-white/20 shadow-xl \${
                    gameState.currentColor === 'Red' ? 'bg-red-500' :
                    gameState.currentColor === 'Blue' ? 'bg-blue-500' :
                    gameState.currentColor === 'Green' ? 'bg-green-500' :
                    gameState.currentColor === 'Yellow' ? 'bg-yellow-500' : 'opacity-0'
                  }\`}>
                    {gameState.currentColor || 'None'}
                  </div>

                  <div className="flex items-center justify-center gap-4 lg:gap-12 w-full max-w-sm relative">
                    {/* Draw Pile */}
                    <div 
                      onClick={isMyTurn ? handleDrawCard : undefined}
                      className={\`w-20 h-32 md:w-24 md:h-36 bg-slate-800 border-4 border-slate-700 rounded-xl shadow-2xl flex items-center justify-center \${isMyTurn ? 'cursor-pointer hover:border-indigo-400 hover:-translate-y-2 transition-all' : 'opacity-50'}\`}
                    >
                      <span className="text-slate-600 font-black text-xl md:text-2xl -rotate-12">UNO</span>
                    </div>

                    {/* Top Card */}
                    {gameState.topCard && (
                      <div className="transform scale-100 lg:scale-110">
                        {renderCard(gameState.topCard)}
                      </div>
                    )}
                  </div>
                  
                  {/* Turn Indicator */}
                  <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700">
                    <span className="text-slate-300 font-bold text-sm">Direction:</span>
                    <ArrowRight className={\`w-5 h-5 text-indigo-400 transform transition-transform duration-500 \${gameState.direction === -1 ? 'rotate-180' : ''}\`} />
                  </div>
                </div>`;

code = code.replace(oldCenter, newCenter);
fs.writeFileSync('src/components/UnoGameSection.tsx', code);
