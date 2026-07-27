import express from 'express';
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

  app.use(express.json());

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
            io.to(roomId).emit('game_over', sanitizeRoomForClient(room));
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
            io.to(roomId).emit('game_over', sanitizeRoomForClient(room));
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

  // Socket.IO event handlers
  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let playerProfile: PlayerInfo | null = null;

    // Helper to get valid player profile
    const getSafePlayer = (p?: Partial<PlayerInfo>): PlayerInfo => {
      const pId = p?.id || playerProfile?.id || `usr_${socket.id}`;
      return {
        id: pId,
        name: p?.name || playerProfile?.name || 'Player 1',
        country: p?.country || playerProfile?.country || 'US',
        flag: p?.flag || playerProfile?.flag || '🇺🇸',
        rating: p?.rating || playerProfile?.rating || 1200,
      };
    };

    // Update profile listener
    socket.on('update_profile', (profile: PlayerInfo) => {
      if (profile && profile.name) {
        playerProfile = profile;
        if (currentRoomId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            if (room.whitePlayer?.id === profile.id || room.whitePlayer?.id === socket.id) {
              room.whitePlayer = { ...profile };
            } else if (room.blackPlayer?.id === profile.id || room.blackPlayer?.id === socket.id) {
              room.blackPlayer = { ...profile };
            }
            io.to(currentRoomId).emit('room_updated', sanitizeRoomForClient(room));
            io.emit('lobby_room_updated');
          }
        }
      }
    });

    // Send active rooms list on connection request
    socket.on('get_lobby_rooms', () => {
      const lobbyRooms = Array.from(rooms.values()).map((r) => ({
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
      if (!room) {
        socket.emit('error_message', `Room code "${cleanRoomId}" not found. Please verify the 6-digit room code.`);
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

      io.to(payload.roomId).emit('room_updated', sanitizeRoomForClient(room));
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
        const isWhite = room.whitePlayer?.id === socket.id || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id);
        const isBlack = room.blackPlayer?.id === socket.id || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id);

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

      const isWhite = room.whitePlayer?.id === socket.id;
      const isBlack = room.blackPlayer?.id === socket.id;

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

      const isWhite = room.whitePlayer?.id === socket.id;
      const isBlack = room.blackPlayer?.id === socket.id;
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

      if (room.whitePlayer?.id === socket.id) {
        senderSide = 'w';
        senderName = room.whitePlayer.name;
      } else if (room.blackPlayer?.id === socket.id) {
        senderSide = 'b';
        senderName = room.blackPlayer.name;
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

      room.rematchRequests.add(socket.id);

      const requesterName =
        room.whitePlayer?.id === socket.id
          ? room.whitePlayer.name
          : room.blackPlayer?.id === socket.id
          ? room.blackPlayer.name
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

      const isWhite = room.whitePlayer?.id === socket.id || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id);
      const isBlack = room.blackPlayer?.id === socket.id || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id);

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

      // Cleanup empty room after 10 mins or if no players left
      if (!room.whitePlayer && !room.blackPlayer && room.spectators.length === 0) {
        rooms.delete(currentRoomId);
      } else {
        io.to(currentRoomId).emit('room_updated', sanitizeRoomForClient(room));
      }

      io.emit('lobby_room_updated');
    };

    socket.on('leave_room', handleLeave);
    socket.on('disconnect', handleLeave);
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
