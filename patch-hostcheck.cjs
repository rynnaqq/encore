const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

code = code.replace(
  `if (stateRef.current && stateRef.current.hostId === localPlayerId) {`,
  `if (stateRef.current && stateRef.current.players.find(p => p.isHost)?.id === localPlayerId) {`
);

// Also remove logs display from UI if it exists or just make sure it's correct
fs.writeFileSync('src/components/UnoGameSection.tsx', code);
