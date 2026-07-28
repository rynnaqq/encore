const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const isWhite = room\.whitePlayer\?\.id === socket\.id;\n\s*const isBlack = room\.blackPlayer\?\.id === socket\.id;/g;
const replacement = `const isWhite = room.whitePlayer?.id === socket.id || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id);
      const isBlack = room.blackPlayer?.id === socket.id || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id);`;

code = code.replace(regex, replacement);

fs.writeFileSync('server.ts', code);
