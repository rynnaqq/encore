const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

code = code.replace(
  `setGameState(state);\n    broadcastState(state);`,
  `setGameState(state);\n    stateRef.current = state;\n    broadcastState(state);`
);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
