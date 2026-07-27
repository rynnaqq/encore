const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('isPublic?: boolean')) {
  // If it didn't patch, let's manually find it
  content = content.replace(/export interface RoomState \{/, 'export interface RoomState {\n  isPublic?: boolean;');
  fs.writeFileSync(file, content);
}
