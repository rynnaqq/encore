const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const snlTypes = `
// Snakes & Ladders Types
interface SNLPlayerInfo {
  id: string; // socket id
  name: string;
  color: string;
  position: number;
}
interface SNLRoomState {
  roomId: string;
  hostId: string;
  players: SNLPlayerInfo[];
  isStarted: boolean;
  currentPlayerIndex: number;
  winnerId: string | null;
  logs: string[];
}
const snlRooms: Map<string, SNLRoomState> = new Map();

function generateSNLRoomId(): string {
  let id = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return snlRooms.has(id) ? generateSNLRoomId() : id;
}
`;

code = code.replace(/const rooms: Map<string, RoomState> = new Map\(\);/, snlTypes + '\nconst rooms: Map<string, RoomState> = new Map();');

const snlSocketLogic = `
    // --- Snakes & Ladders Logic ---
    let currentSNLRoomId: string | null = null;
    let snlPlayerId: string | null = null;

    socket.on('snl_create_room', (payload: { name: string; color: string }) => {
      const roomId = generateSNLRoomId();
      currentSNLRoomId = roomId;
      snlPlayerId = socket.id;
      
      const newRoom: SNLRoomState = {
        roomId,
        hostId: socket.id,
        players: [{ id: socket.id, name: payload.name.trim() || 'Player', color: payload.color, position: 1 }],
        isStarted: false,
        currentPlayerIndex: 0,
        winnerId: null,
        logs: ['Room created. Waiting for players...']
      };
      
      snlRooms.set(roomId, newRoom);
      socket.join(roomId);
      socket.emit('snl_room_created', newRoom);
    });

    socket.on('snl_join_room', (payload: { roomId: string; name: string; color: string }) => {
      const room = snlRooms.get(payload.roomId.toUpperCase());
      if (!room) {
        socket.emit('snl_error', 'Room not found');
        return;
      }
      if (room.isStarted) {
        socket.emit('snl_error', 'Game already started');
        return;
      }
      if (room.players.length >= 4) {
        socket.emit('snl_error', 'Room is full (max 4 players)');
        return;
      }
      if (room.players.some(p => p.id === socket.id)) {
         // Rejoining?
      } else {
         room.players.push({ id: socket.id, name: payload.name.trim() || 'Player', color: payload.color, position: 1 });
      }
      
      currentSNLRoomId = room.roomId;
      snlPlayerId = socket.id;
      socket.join(room.roomId);
      room.logs.push(\`\${payload.name.trim() || 'Player'} joined the room.\`);
      io.to(room.roomId).emit('snl_room_updated', room);
    });

    socket.on('snl_start_game', () => {
      if (!currentSNLRoomId) return;
      const room = snlRooms.get(currentSNLRoomId);
      if (!room || room.hostId !== socket.id || room.players.length < 2) return;
      
      room.isStarted = true;
      room.currentPlayerIndex = 0;
      room.logs.push('Game started!');
      io.to(room.roomId).emit('snl_room_updated', room);
    });

    socket.on('snl_roll_dice', () => {
      if (!currentSNLRoomId) return;
      const room = snlRooms.get(currentSNLRoomId);
      if (!room || !room.isStarted || room.winnerId) return;
      
      const currentPlayer = room.players[room.currentPlayerIndex];
      if (currentPlayer.id !== socket.id) return; // not this player's turn

      const roll = Math.floor(Math.random() * 6) + 1;
      
      io.to(room.roomId).emit('snl_dice_rolled', { roll, playerId: socket.id });
    });

    socket.on('snl_turn_processed', (payload: { newPosition: number, logMessage: string, isWinner: boolean }) => {
      if (!currentSNLRoomId) return;
      const room = snlRooms.get(currentSNLRoomId);
      if (!room || !room.isStarted || room.winnerId) return;
      
      const currentPlayer = room.players[room.currentPlayerIndex];
      if (currentPlayer.id !== socket.id) return; // not this player's turn

      currentPlayer.position = payload.newPosition;
      if (payload.logMessage) {
        room.logs.push(payload.logMessage);
      }
      
      if (payload.isWinner) {
        room.winnerId = socket.id;
        room.logs.push(\`\${currentPlayer.name} wins!\`);
      } else {
        room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
      }
      
      io.to(room.roomId).emit('snl_room_updated', room);
    });

    socket.on('snl_reset_game', () => {
      if (!currentSNLRoomId) return;
      const room = snlRooms.get(currentSNLRoomId);
      if (!room || room.hostId !== socket.id) return;
      
      room.isStarted = false;
      room.winnerId = null;
      room.currentPlayerIndex = 0;
      room.players.forEach(p => p.position = 1);
      room.logs = ['Game reset by host. Ready to start again.'];
      
      io.to(room.roomId).emit('snl_room_updated', room);
    });

    const handleSNLLeave = () => {
      if (!currentSNLRoomId) return;
      const room = snlRooms.get(currentSNLRoomId);
      if (!room) return;

      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const p = room.players.splice(playerIndex, 1)[0];
        room.logs.push(\`\${p.name} left the room.\`);
        
        if (room.players.length === 0) {
          snlRooms.delete(currentSNLRoomId);
        } else {
          if (room.hostId === socket.id) {
            room.hostId = room.players[0].id; // transfer host
            room.logs.push(\`\${room.players[0].name} is now the host.\`);
          }
          if (room.isStarted && room.currentPlayerIndex >= room.players.length) {
             room.currentPlayerIndex = 0;
          }
          io.to(currentSNLRoomId).emit('snl_room_updated', room);
        }
      }
      socket.leave(currentSNLRoomId);
      currentSNLRoomId = null;
      snlPlayerId = null;
    };
    
    socket.on('snl_leave_room', handleSNLLeave);
    socket.on('disconnect', handleSNLLeave);
`;

code = code.replace(/socket\.on\('disconnect', handleLeave\);\n  \}\);/, `socket.on('disconnect', handleLeave);\n\n${snlSocketLogic}\n  });`);

fs.writeFileSync('server.ts', code);
