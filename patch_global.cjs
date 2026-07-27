const fs = require('fs');
const file = 'src/lib/supabaseChess.ts';
let content = fs.readFileSync(file, 'utf8');

const oldGlobal = `        presences.forEach((p: any) => {
          if (p.roomSummary && p.roomSummary.roomId) {
            roomsMap.set(p.roomSummary.roomId, p.roomSummary);
          }
        });`;

const newGlobal = `        presences.forEach((p: any) => {
          if (p.roomSummary && p.roomSummary.roomId && p.roomSummary.isPublic !== false) {
            roomsMap.set(p.roomSummary.roomId, p.roomSummary);
          }
        });`;

content = content.replace(oldGlobal, newGlobal);
fs.writeFileSync(file, content);
