const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add isPublic to RoomState interface
content = content.replace(/export interface RoomState \{/, 'export interface RoomState {\n  isPublic?: boolean;');

// 2. Add isPublic to create_room payload
content = content.replace(/preferredSide\?: 'w' \| 'b' \| 'random';/, "preferredSide?: 'w' | 'b' | 'random';\n        isPublic?: boolean;");

// 3. Set isPublic in newRoom
const newRoomInitial = `          spectators: [],
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',`;
const newRoomPatched = `          spectators: [],
          isPublic: payload.isPublic !== false,
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',`;
content = content.replace(newRoomInitial, newRoomPatched);

// 4. Filter in get_lobby_rooms
const oldFilter = '.filter((r) => !r.isGameOver)';
const newFilter = '.filter((r) => !r.isGameOver && r.isPublic !== false)';
content = content.replace(oldFilter, newFilter);

fs.writeFileSync(file, content);
