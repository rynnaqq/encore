import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { Server, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { Chess } from 'chess.js';

interface PlayerInfo {
  id: string;
  name: string;
  country: string;
  flag: string;
  rating: number;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderSide?: 'w' | 'b' | 'spectator';
  text: string;
  timestamp: number;
  isSystem?: boolean;
  country?: string;
}

interface RoomState {
  isPublic?: boolean;
  roomId: string;
  roomName: string;
  timeControl: number; // in seconds
  whitePlayer: PlayerInfo | null;
  blackPlayer: PlayerInfo | null;
  spectators: PlayerInfo[];
  fen: string;
  moveHistory: Array<{
    from: string;
    to: string;
    promotion?: string;
    san: string;
    color: 'w' | 'b';
    timeSpent?: number;
  }>;
  whiteTime: number;
  blackTime: number;
  lastMoveTimestamp: number | null;
  turn: 'w' | 'b';
  isStarted: boolean;
  isGameOver: boolean;
  gameResult: string | null; // e.g. "White wins by checkmate", "Draw by stalemate"
  winner: 'w' | 'b' | 'draw' | null;
  drawOffer: 'w' | 'b' | null;
  rematchRequests: Set<string>; // socket ids requesting rematch
  messages: ChatMessage[];
  createdAt: number;
}




const rooms: Map<string, RoomState> = new Map();

function generateRoomId(): string {
  let id = '';
  const chars = '0123456789';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(id) ? generateRoomId() : id;
}

function sanitizeRoomForClient(room: RoomState) {
  return {
    ...room,
    rematchRequests: Array.from(room.rematchRequests),
  };
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const PORT = 3000;

  // Protect against memory exhaustion DoS by limiting JSON payload size
  app.use(express.json({ limit: "2mb" }));

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  // Rooms overview API
  app.get('/api/rooms', (req, res) => {
    const publicRooms = Array.from(rooms.values()).map((r) => ({
      roomId: r.roomId,
      roomName: r.roomName,
      timeControl: r.timeControl,
      playersCount: (r.whitePlayer ? 1 : 0) + (r.blackPlayer ? 1 : 0),
      spectatorsCount: r.spectators.length,
      isStarted: r.isStarted,
      isGameOver: r.isGameOver,
      whitePlayer: r.whitePlayer ? { name: r.whitePlayer.name, country: r.whitePlayer.country, flag: r.whitePlayer.flag } : null,
      blackPlayer: r.blackPlayer ? { name: r.blackPlayer.name, country: r.blackPlayer.country, flag: r.blackPlayer.flag } : null,
    }));
    res.json(publicRooms);
  });

  // Timer interval for updating clocks
  setInterval(() => {
    const now = Date.now();
    rooms.forEach((room, roomId) => {
      if (!room.isStarted || room.isGameOver || room.timeControl === 0 || !room.lastMoveTimestamp) {
        return;
      }

      const elapsed = Math.floor((now - room.lastMoveTimestamp) / 1000);
      if (elapsed >= 1) {
        if (room.turn === 'w') {
          room.whiteTime = Math.max(0, room.whiteTime - 1);
          if (room.whiteTime <= 0) {
            room.isGameOver = true;
            room.winner = 'b';
            room.gameResult = 'Black wins on time!';
            room.messages.push({
              id: `sys-${Date.now()}`,
              senderName: 'System',
              text: '⏰ White ran out of time! Black wins!',
              timestamp: Date.now(),
              isSystem: true,
            });
            io.to(roomId).emit('game_over', { room: sanitizeRoomForClient(room), gameResult: room.gameResult });
          }
        } else {
          room.blackTime = Math.max(0, room.blackTime - 1);
          if (room.blackTime <= 0) {
            room.isGameOver = true;
            room.winner = 'w';
            room.gameResult = 'White wins on time!';
            room.messages.push({
              id: `sys-${Date.now()}`,
              senderName: 'System',
              text: '⏰ Black ran out of time! White wins!',
              timestamp: Date.now(),
              isSystem: true,
            });
            io.to(roomId).emit('game_over', { room: sanitizeRoomForClient(room), gameResult: room.gameResult });
          }
        }
        room.lastMoveTimestamp = now;
        io.to(roomId).emit('timer_tick', {
          whiteTime: room.whiteTime,
          blackTime: room.blackTime,
          turn: room.turn,
        });
      }
    });
  }, 1000);

  // Periodic room garbage collection & 5-minute lobby suspension check (every 30s)
  setInterval(() => {
    const now = Date.now();
    const MAX_LOBBY_INACTIVE_MS = 5 * 60 * 1000; // 5 minutes
    const MAX_GAME_INACTIVE_MS = 30 * 60 * 1000; // 30 minutes

    let roomsChanged = false;
    for (const [roomId, room] of rooms.entries()) {
      const isAbandoned = !room.whitePlayer && !room.blackPlayer && (!room.spectators || room.spectators.length === 0);
      const isLobbyExpired = !room.isStarted && (now - room.createdAt > MAX_LOBBY_INACTIVE_MS);
      const isGameExpired = now - room.createdAt > MAX_GAME_INACTIVE_MS;

      if (isLobbyExpired && !isAbandoned) {
        io.to(roomId).emit('error_message', 'Lobby ditutup karena tidak ada aktivitas selama 5 menit.');
        rooms.delete(roomId);
        roomsChanged = true;
      } else if (isAbandoned || (room.isGameOver && isGameExpired)) {
        rooms.delete(roomId);
        roomsChanged = true;
      }
    }

    if (roomsChanged) {
      io.emit('lobby_room_updated');
    }
  }, 30 * 1000);

  // Socket.IO event handlers
  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let playerProfile: PlayerInfo | null = null;

    // Helper to get valid player profile, strictly enforcing socket.id for connection security
    const getSafePlayer = (p?: Partial<PlayerInfo>): PlayerInfo => {
      const cleanName = typeof p?.name === 'string' ? sanitizeInput(p.name, 30) : (playerProfile?.name || 'Player 1');
      const cleanCountry = typeof p?.country === 'string' ? sanitizeInput(p.country, 4) : (playerProfile?.country || 'US');
      const cleanFlag = typeof p?.flag === 'string' ? sanitizeInput(p.flag, 8) : (playerProfile?.flag || '🇺🇸');
      const cleanRating = typeof p?.rating === 'number' && p.rating >= 0 && p.rating <= 4000 ? Math.floor(p.rating) : (playerProfile?.rating || 1200);

      return {
        id: socket.id, // Strictly bind to socket.id to prevent identity spoofing & session hijacking
        name: cleanName || 'Player 1',
        country: cleanCountry || 'US',
        flag: cleanFlag || '🇺🇸',
        rating: cleanRating,
      };
    };

    const isPlayerWhite = (room: RoomState): boolean => {
      return Boolean(room.whitePlayer && room.whitePlayer.id === socket.id);
    };

    const isPlayerBlack = (room: RoomState): boolean => {
      return Boolean(room.blackPlayer && room.blackPlayer.id === socket.id);
    };

    // Update profile listener
    socket.on('update_profile', (profile: Partial<PlayerInfo>) => {
      if (profile && typeof profile === 'object') {
        playerProfile = getSafePlayer(profile);
        if (currentRoomId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            if (isPlayerWhite(room)) {
              room.whitePlayer = { ...playerProfile };
            } else if (isPlayerBlack(room)) {
              room.blackPlayer = { ...playerProfile };
            }
            io.to(currentRoomId).emit('room_updated', sanitizeRoomForClient(room));
            io.emit('lobby_room_updated');
          }
        }
      }
    });

    // Send active rooms list on connection request
    socket.on('get_lobby_rooms', () => {
      const lobbyRooms = Array.from(rooms.values())
        .filter((r) => !r.isGameOver && r.isPublic !== false)
        .map((r) => ({
          roomId: r.roomId,
          roomName: r.roomName,
          timeControl: r.timeControl,
          playersCount: (r.whitePlayer ? 1 : 0) + (r.blackPlayer ? 1 : 0),
          spectatorsCount: r.spectators.length,
          isStarted: r.isStarted,
          isGameOver: r.isGameOver,
          whitePlayer: r.whitePlayer ? { name: r.whitePlayer.name, country: r.whitePlayer.country, flag: r.whitePlayer.flag } : null,
          blackPlayer: r.blackPlayer ? { name: r.blackPlayer.name, country: r.blackPlayer.country, flag: r.blackPlayer.flag } : null,
        }));
      socket.emit('lobby_rooms_list', lobbyRooms);
    });

    // Create Room
    socket.on(
      'create_room',
      (payload: {
        roomId?: string;
        player?: PlayerInfo;
        roomName?: string;
        timeControl?: number;
        preferredSide?: 'w' | 'b' | 'random';
        isPublic?: boolean;
      }) => {
        const safePlayer = getSafePlayer(payload?.player);
        playerProfile = safePlayer;

        const roomId =
          payload?.roomId && /^\d{6}$/.test(String(payload.roomId).trim())
            ? String(payload.roomId).trim()
            : generateRoomId();
        const preferred = payload?.preferredSide || 'random';
        let assignedSide: 'w' | 'b' = 'w';
        if (preferred === 'b') assignedSide = 'b';
        else if (preferred === 'random') assignedSide = Math.random() < 0.5 ? 'w' : 'b';

        const initialChess = new Chess();
        const timeControl = payload?.timeControl ?? 300;
        const newRoom: RoomState = {
          roomId,
          roomName: payload?.roomName || `${safePlayer.name}'s Match`,
          timeControl,
          whitePlayer: assignedSide === 'w' ? { ...safePlayer } : null,
          blackPlayer: assignedSide === 'b' ? { ...safePlayer } : null,
          spectators: [],
          isPublic: true,
          fen: initialChess.fen(),
          moveHistory: [],
          whiteTime: timeControl,
          blackTime: timeControl,
          lastMoveTimestamp: null,
          turn: 'w',
          isStarted: false,
          isGameOver: false,
          gameResult: null,
          winner: null,
          drawOffer: null,
          rematchRequests: new Set(),
          messages: [
            {
              id: `sys-${Date.now()}`,
              senderName: 'System',
              text: `Room created! Room Code: ${roomId}. Share code to invite opponent.`,
              timestamp: Date.now(),
              isSystem: true,
            },
          ],
          createdAt: Date.now(),
        };

        rooms.set(roomId, newRoom);
        currentRoomId = roomId;
        socket.join(roomId);

        socket.emit('room_joined', {
          room: sanitizeRoomForClient(newRoom),
          yourSide: assignedSide,
          role: 'player',
        });

        io.emit('lobby_room_updated');
      }
    );

    // Join Room
    socket.on('join_room', (payload: { roomId: string; player?: PlayerInfo }) => {
      const cleanRoomId = payload?.roomId ? String(payload.roomId).trim() : '';
      const room = rooms.get(cleanRoomId);
      if (!room || room.isGameOver) {
        socket.emit('error_message', 'Kode room tidak ditemukan');
        return;
      }

      const safePlayer = getSafePlayer(payload?.player);
      playerProfile = safePlayer;
      currentRoomId = cleanRoomId;
      socket.join(cleanRoomId);

      let role: 'player' | 'spectator' = 'spectator';
      let sideAssigned: 'w' | 'b' | 'spectator' = 'spectator';

      const playerId = safePlayer.id;

      // Reconnect/re-assign existing seat if same player ID or socket ID
      if (room.whitePlayer && (room.whitePlayer.id === playerId || room.whitePlayer.id === socket.id)) {
        room.whitePlayer = { ...safePlayer };
        role = 'player';
        sideAssigned = 'w';
      } else if (room.blackPlayer && (room.blackPlayer.id === playerId || room.blackPlayer.id === socket.id)) {
        room.blackPlayer = { ...safePlayer };
        role = 'player';
        sideAssigned = 'b';
      } else if (!room.whitePlayer) {
        room.whitePlayer = { ...safePlayer };
        role = 'player';
        sideAssigned = 'w';
      } else if (!room.blackPlayer) {
        room.blackPlayer = { ...safePlayer };
        role = 'player';
        sideAssigned = 'b';
      } else {
        // Spectator
        const existingIndex = room.spectators.findIndex((s) => s.id === playerId || s.id === socket.id);
        if (existingIndex !== -1) {
          room.spectators[existingIndex] = { ...safePlayer };
        } else {
          room.spectators.push({ ...safePlayer });
        }
        role = 'spectator';
        sideAssigned = 'spectator';
      }

      // Check if both players present -> start game
      if (room.whitePlayer && room.blackPlayer && !room.isStarted && !room.isGameOver) {
        room.isStarted = true;
        room.lastMoveTimestamp = Date.now();
        room.messages.push({
          id: `sys-${Date.now()}`,
          senderName: 'System',
          text: `🎮 Both players connected! ${room.whitePlayer.name} (${room.whitePlayer.flag}) vs ${room.blackPlayer.name} (${room.blackPlayer.flag}). Game started!`,
          timestamp: Date.now(),
          isSystem: true,
        });
      } else {
        room.messages.push({
          id: `sys-${Date.now()}`,
          senderName: 'System',
          text: `👋 ${safePlayer.name} (${safePlayer.flag}) joined as ${role}.`,
          timestamp: Date.now(),
          isSystem: true,
        });
      }

      socket.emit('room_joined', {
        room: sanitizeRoomForClient(room),
        yourSide: sideAssigned,
        role,
      });

      io.to(cleanRoomId).emit('room_updated', sanitizeRoomForClient(room));
      io.emit('lobby_room_updated');
    });

    // Quick Match
    socket.on('quick_match', (payload?: { player?: PlayerInfo }) => {
      const safePlayer = getSafePlayer(payload?.player);
      playerProfile = safePlayer;

      const openRoom = Array.from(rooms.values()).find(
        (r) =>
          (!r.whitePlayer || !r.blackPlayer) &&
          !r.isStarted &&
          !r.isGameOver &&
          r.whitePlayer?.id !== safePlayer.id &&
          r.blackPlayer?.id !== safePlayer.id
      );

      if (openRoom) {
        currentRoomId = openRoom.roomId;
        socket.join(openRoom.roomId);

        let sideAssigned: 'w' | 'b' = 'w';
        if (!openRoom.whitePlayer) {
          openRoom.whitePlayer = { ...safePlayer };
          sideAssigned = 'w';
        } else {
          openRoom.blackPlayer = { ...safePlayer };
          sideAssigned = 'b';
        }

        if (openRoom.whitePlayer && openRoom.blackPlayer) {
          openRoom.isStarted = true;
          openRoom.lastMoveTimestamp = Date.now();
          openRoom.messages.push({
            id: `sys-${Date.now()}`,
            senderName: 'System',
            text: `⚡ Quick Match found! ${openRoom.whitePlayer.name} (${openRoom.whitePlayer.flag}) vs ${openRoom.blackPlayer.name} (${openRoom.blackPlayer.flag}). Game started!`,
            timestamp: Date.now(),
            isSystem: true,
          });
        }

        socket.emit('room_joined', {
          room: sanitizeRoomForClient(openRoom),
          yourSide: sideAssigned,
          role: 'player',
        });

        io.to(openRoom.roomId).emit('room_updated', sanitizeRoomForClient(openRoom));
        io.emit('lobby_room_updated');
      } else {
        const roomId = generateRoomId();
        const initialChess = new Chess();
        const timeControl = 300;
        const newRoom: RoomState = {
          roomId,
          roomName: `Quick Match #${roomId}`,
          timeControl,
          whitePlayer: { ...safePlayer, id: socket.id },
          blackPlayer: null,
          spectators: [],
          isPublic: true,
          fen: initialChess.fen(),
          moveHistory: [],
          whiteTime: timeControl,
          blackTime: timeControl,
          lastMoveTimestamp: null,
          turn: 'w',
          isStarted: false,
          isGameOver: false,
          gameResult: null,
          winner: null,
          drawOffer: null,
          rematchRequests: new Set(),
          messages: [
            {
              id: `sys-${Date.now()}`,
              senderName: 'System',
              text: `Quick match hosted! Waiting for an opponent to join...`,
              timestamp: Date.now(),
              isSystem: true,
            },
          ],
          createdAt: Date.now(),
        };

        rooms.set(roomId, newRoom);
        currentRoomId = roomId;
        socket.join(roomId);

        socket.emit('room_joined', {
          room: sanitizeRoomForClient(newRoom),
          yourSide: 'w',
          role: 'player',
        });

        io.emit('lobby_room_updated');
      }
    });

    // Make Move
    socket.on(
      'make_move',
      (payload: { roomId: string; move: { from: string; to: string; promotion?: string } }) => {
        const room = rooms.get(payload.roomId);
        if (!room) return;

        if (!room.isStarted || room.isGameOver) {
          socket.emit('error_message', 'Game is not active.');
          return;
        }

        // Validate player turn
        const isWhite = isPlayerWhite(room);
        const isBlack = isPlayerBlack(room);

        if ((room.turn === 'w' && !isWhite) || (room.turn === 'b' && !isBlack)) {
          socket.emit('error_message', 'Not your turn!');
          return;
        }

        try {
          const chess = new Chess(room.fen);
          const moveResult = chess.move({
            from: payload.move.from,
            to: payload.move.to,
            promotion: payload.move.promotion || 'q',
          });

          if (!moveResult) {
            socket.emit('error_message', 'Invalid move.');
            return;
          }

          // Move is valid
          room.fen = chess.fen();
          room.turn = chess.turn();
          const now = Date.now();
          const timeSpent = room.lastMoveTimestamp ? Math.floor((now - room.lastMoveTimestamp) / 1000) : 0;
          room.lastMoveTimestamp = now;

          room.moveHistory.push({
            from: moveResult.from,
            to: moveResult.to,
            promotion: moveResult.promotion,
            san: moveResult.san,
            color: moveResult.color,
            timeSpent,
          });

          // Check for Game Over conditions
          if (chess.isGameOver()) {
            room.isGameOver = true;
            if (chess.isCheckmate()) {
              room.winner = moveResult.color;
              const winnerName = moveResult.color === 'w' ? room.whitePlayer?.name : room.blackPlayer?.name;
              room.gameResult = `Checkmate! ${winnerName} wins!`;
            } else if (chess.isDraw()) {
              room.winner = 'draw';
              if (chess.isStalemate()) room.gameResult = 'Draw by stalemate';
              else if (chess.isThreefoldRepetition()) room.gameResult = 'Draw by threefold repetition';
              else if (chess.isInsufficientMaterial()) room.gameResult = 'Draw by insufficient material';
              else room.gameResult = 'Draw';
            }

            room.messages.push({
              id: `sys-${Date.now()}`,
              senderName: 'System',
              text: `🏆 Game Over: ${room.gameResult}`,
              timestamp: Date.now(),
              isSystem: true,
            });

            io.to(payload.roomId).emit('game_over', {
              room: sanitizeRoomForClient(room),
              gameResult: room.gameResult,
            });
          }

          io.to(payload.roomId).emit('move_made', {
            room: sanitizeRoomForClient(room),
            lastMove: { from: moveResult.from, to: moveResult.to, san: moveResult.san },
          });
        } catch (err) {
          socket.emit('error_message', 'Error processing move.');
        }
      }
    );

    // Resign
    socket.on('resign_game', (payload: { roomId: string }) => {
      const room = rooms.get(payload.roomId);
      if (!room || room.isGameOver) return;

      const isWhite = isPlayerWhite(room);
      const isBlack = isPlayerBlack(room);

      if (!isWhite && !isBlack) return;

      room.isGameOver = true;
      room.winner = isWhite ? 'b' : 'w';
      const resignedPlayer = isWhite ? room.whitePlayer?.name : room.blackPlayer?.name;
      const winningPlayer = isWhite ? room.blackPlayer?.name : room.whitePlayer?.name;

      room.gameResult = `${resignedPlayer} resigned. ${winningPlayer} wins!`;
      room.messages.push({
        id: `sys-${Date.now()}`,
        senderName: 'System',
        text: `🏳️ ${resignedPlayer} resigned. ${winningPlayer} wins!`,
        timestamp: Date.now(),
        isSystem: true,
      });

      io.to(payload.roomId).emit('game_over', sanitizeRoomForClient(room));
    });

    // Draw Offer
    socket.on('offer_draw', (payload: { roomId: string }) => {
      const room = rooms.get(payload.roomId);
      if (!room || room.isGameOver) return;

      const isWhite = isPlayerWhite(room);
      const isBlack = isPlayerBlack(room);
      if (!isWhite && !isBlack) return;

      const offerSide = isWhite ? 'w' : 'b';
      room.drawOffer = offerSide;

      const offerName = isWhite ? room.whitePlayer?.name : room.blackPlayer?.name;
      room.messages.push({
        id: `sys-${Date.now()}`,
        senderName: 'System',
        text: `🤝 ${offerName} offered a draw.`,
        timestamp: Date.now(),
        isSystem: true,
      });

      io.to(payload.roomId).emit('draw_offered', {
        room: sanitizeRoomForClient(room),
        offeredBy: offerSide,
      });
    });

    socket.on('respond_draw', (payload: { roomId: string; accept: boolean }) => {
      const room = rooms.get(payload.roomId);
      if (!room || room.isGameOver || !room.drawOffer) return;

      if (payload.accept) {
        room.isGameOver = true;
        room.winner = 'draw';
        room.gameResult = 'Draw agreed by both players.';
        room.messages.push({
          id: `sys-${Date.now()}`,
          senderName: 'System',
          text: `🤝 Draw accepted! The game ends in a draw.`,
          timestamp: Date.now(),
          isSystem: true,
        });
        room.drawOffer = null;
        io.to(payload.roomId).emit('game_over', sanitizeRoomForClient(room));
      } else {
        const declinerName = room.drawOffer === 'w' ? room.blackPlayer?.name : room.whitePlayer?.name;
        room.drawOffer = null;
        room.messages.push({
          id: `sys-${Date.now()}`,
          senderName: 'System',
          text: `❌ ${declinerName} declined the draw offer.`,
          timestamp: Date.now(),
          isSystem: true,
        });
        io.to(payload.roomId).emit('room_updated', sanitizeRoomForClient(room));
      }
    });

    // Chat Message / Emoji Reaction
    socket.on('send_chat', (payload: { roomId: string; text: string }) => {
      const room = rooms.get(payload.roomId);
      if (!room || !payload.text.trim()) return;

      let senderSide: 'w' | 'b' | 'spectator' = 'spectator';
      let senderName = playerProfile?.name || 'Player';

      if (isPlayerWhite(room)) {
        senderSide = 'w';
        senderName = room.whitePlayer!.name;
      } else if (isPlayerBlack(room)) {
        senderSide = 'b';
        senderName = room.blackPlayer!.name;
      }

      const msg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderName,
        senderSide,
        text: payload.text.trim().substring(0, 200), // truncate long text
        timestamp: Date.now(),
        country: playerProfile?.country,
      };

      room.messages.push(msg);
      if (room.messages.length > 100) room.messages.shift();

      io.to(payload.roomId).emit('chat_received', msg);
    });

    // Rematch Request
    socket.on('request_rematch', (payload: { roomId: string }) => {
      const room = rooms.get(payload.roomId);
      if (!room || !room.isGameOver) return;

      const reqId = playerProfile?.id || socket.id;
      room.rematchRequests.add(reqId);

      const requesterName = isPlayerWhite(room)
        ? room.whitePlayer!.name
        : isPlayerBlack(room)
        ? room.blackPlayer!.name
        : 'Player';

      room.messages.push({
        id: `sys-${Date.now()}`,
        senderName: 'System',
        text: `🔄 ${requesterName} requested a rematch.`,
        timestamp: Date.now(),
        isSystem: true,
      });

      // If both players accepted rematch -> reset game & swap sides
      const whiteId = room.whitePlayer?.id;
      const blackId = room.blackPlayer?.id;

      if (whiteId && blackId && room.rematchRequests.has(whiteId) && room.rematchRequests.has(blackId)) {
        // Swap sides
        const prevWhite = room.whitePlayer;
        const prevBlack = room.blackPlayer;
        room.whitePlayer = prevBlack;
        room.blackPlayer = prevWhite;

        const initialChess = new Chess();
        room.fen = initialChess.fen();
        room.moveHistory = [];
        room.whiteTime = room.timeControl;
        room.blackTime = room.timeControl;
        room.lastMoveTimestamp = Date.now();
        room.turn = 'w';
        room.isStarted = true;
        room.isGameOver = false;
        room.gameResult = null;
        room.winner = null;
        room.drawOffer = null;
        room.rematchRequests.clear();

        room.messages.push({
          id: `sys-${Date.now()}`,
          senderName: 'System',
          text: `⚡ Rematch started! Colors swapped. ${room.whitePlayer?.name} is White, ${room.blackPlayer?.name} is Black.`,
          timestamp: Date.now(),
          isSystem: true,
        });

        io.to(payload.roomId).emit('rematch_started', sanitizeRoomForClient(room));
      } else {
        io.to(payload.roomId).emit('room_updated', sanitizeRoomForClient(room));
      }
    });

    // Leave / Disconnect
    const handleLeave = () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const isWhite = isPlayerWhite(room);
      const isBlack = isPlayerBlack(room);

      if (isWhite) {
        const leaverName = room.whitePlayer?.name || 'Player 1';
        const winnerName = room.blackPlayer?.name || 'Player 2';
        room.whitePlayer = null;
        if (room.isStarted && !room.isGameOver) {
          room.isGameOver = true;
          room.winner = 'b';
          const resultText = `🎉 ${leaverName} left the game! Congratulations to ${winnerName} on the victory!`;
          room.gameResult = resultText;
          room.messages.push({
            id: `sys-${Date.now()}`,
            senderName: 'System',
            text: `🏆 ${leaverName} left the room. Congratulations to ${winnerName}, you win!`,
            timestamp: Date.now(),
            isSystem: true,
          });
          io.to(currentRoomId).emit('game_over', { room: sanitizeRoomForClient(room), gameResult: resultText });
        }
      } else if (isBlack) {
        const leaverName = room.blackPlayer?.name || 'Player 2';
        const winnerName = room.whitePlayer?.name || 'Player 1';
        room.blackPlayer = null;
        if (room.isStarted && !room.isGameOver) {
          room.isGameOver = true;
          room.winner = 'w';
          const resultText = `🎉 ${leaverName} left the game! Congratulations to ${winnerName} on the victory!`;
          room.gameResult = resultText;
          room.messages.push({
            id: `sys-${Date.now()}`,
            senderName: 'System',
            text: `🏆 ${leaverName} left the room. Congratulations to ${winnerName}, you win!`,
            timestamp: Date.now(),
            isSystem: true,
          });
          io.to(currentRoomId).emit('game_over', { room: sanitizeRoomForClient(room), gameResult: resultText });
        }
      } else {
        room.spectators = room.spectators.filter((s) => s.id !== socket.id && s.id !== playerProfile?.id);
      }

      const leavingRoomId = currentRoomId;
      socket.leave(leavingRoomId);
      currentRoomId = null;

      // Cleanup empty room if no players left
      if (!room.whitePlayer && !room.blackPlayer && room.spectators.length === 0) {
        rooms.delete(leavingRoomId);
      } else {
        io.to(leavingRoomId).emit('room_updated', sanitizeRoomForClient(room));
      }

      io.emit('lobby_room_updated');
    };

    socket.on('leave_room', handleLeave);
    socket.on('disconnect', handleLeave);


  });

  

  // --- Comments API (Asynchronous, Mutex Locked & Sanitized) ---

  const COMMENTS_FILE = path.join(process.cwd(), 'comments.json');
  
  // In-memory Mutex to prevent TOCTOU file race conditions
  let commentsFileLock: Promise<any> = Promise.resolve();
  const withCommentsLock = <T>(action: () => Promise<T>): Promise<T> => {
    const nextLock = commentsFileLock.then(action, action);
    commentsFileLock = nextLock.then(() => {}, () => {});
    return nextLock;
  };

  const readComments = async (): Promise<any[]> => {
    try {
      if (fs.existsSync(COMMENTS_FILE)) {
        const data = await fs.promises.readFile(COMMENTS_FILE, 'utf8');
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error reading comments.json:', e);
    }
    return [];
  };

  const writeComments = async (comments: any[]): Promise<boolean> => {
    try {
      await fs.promises.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Error writing comments.json:', e);
      return false;
    }
  };

  // Strict HTML Entity Sanitizer to eliminate Stored XSS
  const sanitizeInput = (str: unknown, maxLen = 2000): string => {
    if (typeof str !== 'string') return '';
    return str
      .slice(0, maxLen)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .trim();
  };

  // Validate Base64 Image to prevent SVG script execution & memory exhaustion
  const isValidRasterImage = (base64: unknown): boolean => {
    if (typeof base64 !== 'string') return false;
    const allowedHeaders = [
      'data:image/png;base64,',
      'data:image/jpeg;base64,',
      'data:image/jpg;base64,',
      'data:image/webp;base64,',
      'data:image/gif;base64,'
    ];
    return allowedHeaders.some(h => base64.startsWith(h)) && base64.length <= 2 * 1024 * 1024;
  };

  app.get('/api/comments', async (req, res) => {
    try {
      const comments = await withCommentsLock(() => readComments());
      res.json(comments);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve comments' });
    }
  });

  app.post('/api/comments', async (req, res) => {
    try {
      const { username, text, photoBase64 } = req.body || {};
      const cleanUsername = sanitizeInput(username, 50);
      const cleanText = sanitizeInput(text, 2000);

      if (!cleanUsername || !cleanText) {
        return res.status(400).json({ error: 'Valid username and comment text are required' });
      }

      let safePhoto: string | null = null;
      if (typeof photoBase64 === 'string' && isValidRasterImage(photoBase64)) {
        safePhoto = photoBase64;
      }
      
      const newComment = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        username: cleanUsername,
        text: cleanText,
        photoBase64: safePhoto,
        timestamp: Date.now()
      };
      
      const result = await withCommentsLock(async () => {
        const comments = await readComments();
        comments.push(newComment);
        // Limit total stored comments to prevent uncontrolled disk growth
        if (comments.length > 500) {
          comments.splice(0, comments.length - 500);
        }
        await writeComments(comments);
        return newComment;
      });
      
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to post comment' });
    }
  });

  app.put('/api/comments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { text } = req.body || {};
      const cleanText = sanitizeInput(text, 2000);

      if (!cleanText) {
        return res.status(400).json({ error: 'Updated comment text cannot be empty' });
      }
      
      const updated = await withCommentsLock(async () => {
        const comments = await readComments();
        const commentIndex = comments.findIndex(c => c.id === id);
        
        if (commentIndex === -1) {
          return null;
        }
        
        comments[commentIndex].text = cleanText;
        comments[commentIndex].updatedAt = Date.now();
        await writeComments(comments);
        return comments[commentIndex];
      });

      if (!updated) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update comment' });
    }
  });

  app.delete('/api/comments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await withCommentsLock(async () => {
        let comments = await readComments();
        const initialLength = comments.length;
        comments = comments.filter(c => c.id !== id);
        
        if (comments.length === initialLength) {
          return false;
        }

        await writeComments(comments);
        return true;
      });

      if (!deleted) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  });

  // Vite middleware in dev mode

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Global Multiplayer Chess server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
