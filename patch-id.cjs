const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

const oldId = `const [localPlayerId] = useState(() => \`p-\${Math.random().toString(36).substr(2, 9)}\`);`;
const newId = `const [localPlayerId] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('uno_player_id');
      if (saved) return saved;
      const newId = \`p-\${Math.random().toString(36).substr(2, 9)}\`;
      sessionStorage.setItem('uno_player_id', newId);
      return newId;
    }
    return \`p-\${Math.random().toString(36).substr(2, 9)}\`;
  });`;

code = code.replace(oldId, newId);
fs.writeFileSync('src/components/UnoGameSection.tsx', code);
