const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

code = code.replace(
  `<div className="flex-1 p-4 flex flex-col relative bg-emerald-900/40 overflow-y-auto overflow-x-hidden">`,
  `<div className="flex-1 p-2 md:p-4 flex flex-col relative bg-emerald-900/40 overflow-hidden">`
);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
