const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

code = code.replace(
  `setGameState(state);\n    broadcastState(state);\n  };\n\n  const handlePlayCard`,
  `setGameState(state);\n    stateRef.current = state;\n    broadcastState(state);\n  };\n\n  const handlePlayCard`
);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
