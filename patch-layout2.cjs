const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

code = code.replace(
  `<div className="flex flex-col lg:flex-row min-h-[700px]">`,
  `<div className="flex flex-col lg:flex-row h-[850px] lg:h-[700px] overflow-hidden">`
);

code = code.replace(
  `{/* Main Board */}`,
  `{/* Main Board */}`
);

code = code.replace(
  `<div className="flex-1 p-6 flex flex-col relative bg-emerald-900/40">`,
  `<div className="flex-1 p-4 flex flex-col relative bg-emerald-900/40 overflow-y-auto overflow-x-hidden">`
);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
