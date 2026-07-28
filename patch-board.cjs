const fs = require('fs');
let code = fs.readFileSync('src/components/SnakeAndLaddersSection.tsx', 'utf8');

// Update logic to match the new board image
code = code.replace(/const SNAKES_AND_LADDERS: Record<number, number> = \{[\s\S]*?\};/,
`const SNAKES_AND_LADDERS: Record<number, number> = {
  // Ladders
  12: 29, 20: 81, 34: 67, 63: 78, 76: 85, 89: 92,
  // Snakes
  17: 8, 57: 38, 73: 32, 95: 71, 99: 19
};`);

// Update the board container to use the image background
code = code.replace(/<div\s+ref=\{boardRef\}\s+className="aspect-square relative rounded-2xl overflow-hidden border-4 border-slate-800 bg-\[#FFF5D7\]"\s+style=\{\{\}\}\s+>/,
`<div 
              ref={boardRef}
              className="aspect-square relative rounded-2xl overflow-hidden border-4 border-slate-800 bg-[#FFF5D7] bg-cover bg-center"
              style={{ backgroundImage: "url('/board.jpg')" }}
            >`);

// Make cells transparent and remove text numbers
code = code.replace(/className=\{\`relative flex items-center justify-center font-black text-lg sm:text-xl \$\{\n\s*isEven \? 'bg-white\/40' : 'bg-\[#E195AB\]\/10'\n\s*\} border border-slate-800\/10\`\}/g,
`className="relative flex items-center justify-center"`);

code = code.replace(/<span className="absolute top-1 left-1\.5 text-xs font-bold opacity-40">\{cellNum\}<\/span>/g, '');

// Remove SVG rendering for snakes and ladders completely
code = code.replace(/\{\/\* Render Snakes & Ladders \*\/\}\s+<svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">[\s\S]*?<\/svg>/, '');

fs.writeFileSync('src/components/SnakeAndLaddersSection.tsx', code);
