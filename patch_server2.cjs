const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('isPublic?: boolean')) {
  content = content.replace(/interface RoomState \{/, 'interface RoomState {\n  isPublic?: boolean;');
  fs.writeFileSync(file, content);
}
