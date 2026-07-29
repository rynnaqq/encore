const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

const oldHand = `<div className="mt-auto flex flex-col items-center">
                  <div className="mb-4">
                    <h4 className={\`font-black text-xl px-6 py-2 rounded-full shadow-lg border-2 \${isMyTurn ? 'bg-indigo-600 text-white border-indigo-400 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'}\`}>
                      {isMyTurn ? 'YOUR TURN!' : 'Wait for your turn...'}
                    </h4>
                  </div>
                  
                  <div className="flex flex-row justify-center max-w-full overflow-visible -space-x-6 md:-space-x-10 px-4 py-8">`;

const newHand = `<div className="mt-auto flex flex-col items-center w-full overflow-hidden">
                  <div className="mb-2 md:mb-4">
                    <h4 className={\`font-black text-lg md:text-xl px-6 py-2 rounded-full shadow-lg border-2 \${isMyTurn ? 'bg-indigo-600 text-white border-indigo-400 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'}\`}>
                      {isMyTurn ? 'YOUR TURN!' : 'Wait for your turn...'}
                    </h4>
                  </div>
                  
                  <div className="w-full max-w-full overflow-x-auto pb-10 pt-6 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="flex flex-row justify-start md:justify-center w-max min-w-full mx-auto -space-x-3 md:-space-x-8 px-4">`;

code = code.replace(oldHand, newHand);

// We need to add one more closing div since we wrapped the inner map in a second div. Wait! I replaced one div with two divs.
// I should add the closing div.
// Let's find the closing of that div.
const oldClose = `                          )}
                        </div>
                      );
                    })}
                  </div>`;
const newClose = `                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>`;

code = code.replace(oldClose, newClose);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
