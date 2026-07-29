const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

code = code.replace(/state\.logs\.push\([^)]+\);/g, '');

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
