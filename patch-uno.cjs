const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

// 1. Deep clone state in JOIN_REQUEST
code = code.replace(
  `const state = { ...stateRef.current };`,
  `const state = JSON.parse(JSON.stringify(stateRef.current));`
);

// 2. Deep clone state in processAction
code = code.replace(
  `let state = { ...stateRef.current! };`,
  `let state = JSON.parse(JSON.stringify(stateRef.current!));`
);

// 3. Deep clone state in handleStartGame
code = code.replace(
  `const state = { ...stateRef.current };`,
  `const state = JSON.parse(JSON.stringify(stateRef.current));`
);

// 4. Update the layout: remove fixed h-[700px], add padding to avoid navbar
code = code.replace(
  `<div id="uno" className="max-w-7xl mx-auto p-4 py-8">`,
  `<div id="uno" className="max-w-7xl mx-auto p-4 pt-28 pb-8">`
);

code = code.replace(
  `<div className="flex flex-col lg:flex-row h-[700px]">`,
  `<div className="flex flex-col lg:flex-row min-h-[700px]">`
);

// 5. Update localPlayer ID generating to use stable one?
// Wait, localPlayerId is generated with useState, so it won't change unless component remounts.
// It's fine for now, but let's make it a stable ref if needed. But let's keep it.

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
