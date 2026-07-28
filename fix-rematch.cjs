const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex1 = /room\.rematchRequests\.add\(socket\.id\);/g;
const replacement1 = `const reqId = playerProfile?.id || socket.id;
      room.rematchRequests.add(reqId);`;

const regex2 = /room\.whitePlayer\?\.id === socket\.id/g;
const replacement2 = `(room.whitePlayer?.id === socket.id || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id))`;

const regex3 = /room\.blackPlayer\?\.id === socket\.id/g;
const replacement3 = `(room.blackPlayer?.id === socket.id || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id))`;

code = code.replace(regex1, replacement1);
code = code.replace(regex2, replacement2);
code = code.replace(regex3, replacement3);

fs.writeFileSync('server.ts', code);
