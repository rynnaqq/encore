const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

// Change the main container height for mobile
code = code.replace(
  `<div id="uno" className="max-w-7xl mx-auto p-4 pt-28 pb-8">`,
  `<div id="uno" className="max-w-7xl mx-auto p-2 md:p-4 pt-24 md:pt-28 pb-4 md:pb-8 flex flex-col h-[100dvh]">`
);

code = code.replace(
  `<div className="bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-800">`,
  `<div className="bg-slate-900 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col flex-1">`
);

code = code.replace(
  `<div className="flex flex-col lg:flex-row min-h-[600px] h-[calc(100vh-150px)] lg:h-[calc(100vh-100px)] overflow-hidden">`,
  `<div className="flex flex-col lg:flex-row flex-1 overflow-hidden">`
);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
