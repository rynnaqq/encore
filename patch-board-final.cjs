const fs = require('fs');
let code = fs.readFileSync('src/components/SnakeAndLaddersSection.tsx', 'utf8');

code = code.replace(/const SNAKES_AND_LADDERS: Record<number, number> = \{[\s\S]*?\};/,
`const SNAKES_AND_LADDERS: Record<number, number> = {
  // Ladders
  2: 38, 9: 31, 28: 84, 51: 67, 71: 91, 80: 100,
  // Snakes
  16: 6, 49: 11, 62: 19, 64: 60, 87: 24, 95: 75, 98: 78
};`);

code = code.replace(/className="aspect-square relative rounded-2xl overflow-hidden border-4 border-slate-800 bg-\[#FFF5D7\] bg-cover bg-center"/,
`className="aspect-square relative rounded-2xl overflow-hidden border-4 border-slate-800 bg-[#FFF5D7] bg-[length:100%_100%] bg-no-repeat"`);

fs.writeFileSync('src/components/SnakeAndLaddersSection.tsx', code);
