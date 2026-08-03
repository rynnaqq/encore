import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { Server, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { Chess } from 'chess.js';
import ytdl from '@distube/ytdl-core';

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

  app.use(express.json({ limit: "10mb" }));

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

  // Downloader API
  app.post('/api/download', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });

      if (ytdl.validateURL(url)) {
        const info = await ytdl.getInfo(url);
        
        // Group formats by quality
        const videoFormats = ytdl.filterFormats(info.formats, 'video');
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

        const bestVideo = ytdl.chooseFormat(videoFormats, { quality: 'highest' });
        const bestAudio = ytdl.chooseFormat(audioFormats, { quality: 'highestaudio' });

        const formats = [];
        if (bestVideo) {
          formats.push({
            url: bestVideo.url,
            qualityLabel: bestVideo.qualityLabel || 'High',
            extension: bestVideo.container || 'mp4',
            isAudio: false,
          });
        }
        if (bestAudio) {
          formats.push({
            url: bestAudio.url,
            qualityLabel: bestAudio.audioBitrate ? `${bestAudio.audioBitrate}kbps` : 'Audio',
            extension: bestAudio.container || 'mp3',
            isAudio: true,
          });
        }

        return res.json({
          title: info.videoDetails.title,
          author: info.videoDetails.author.name,
          thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url,
          formats,
        });
      }

      // If not YouTube, throw error so frontend falls back to redirect proxies
      throw new Error("Only YouTube is natively processed. Use fallback proxy.");
    } catch (err: any) {
      console.error("Downloader Error:", err.message);
      res.status(500).json({ error: 'Failed to extract video details' });
    }
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
            if (room.whitePlayer?.id === profile.id || (room.whitePlayer?.id === socket.id || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id))) {
              room.whitePlayer = { ...profile };
            } else if (room.blackPlayer?.id === profile.id || (room.blackPlayer?.id === socket.id || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id))) {
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
        const isWhite = (room.whitePlayer?.id === socket.id || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id)) || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id);
        const isBlack = (room.blackPlayer?.id === socket.id || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id)) || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id);

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

      const isWhite = (room.whitePlayer?.id === socket.id || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id)) || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id);
      const isBlack = (room.blackPlayer?.id === socket.id || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id)) || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id);

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

      const isWhite = (room.whitePlayer?.id === socket.id || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id)) || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id);
      const isBlack = (room.blackPlayer?.id === socket.id || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id)) || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id);
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

      if ((room.whitePlayer?.id === socket.id || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id))) {
        senderSide = 'w';
        senderName = room.whitePlayer.name;
      } else if ((room.blackPlayer?.id === socket.id || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id))) {
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

      const reqId = playerProfile?.id || socket.id;
      room.rematchRequests.add(reqId);

      const requesterName =
        (room.whitePlayer?.id === socket.id || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id))
          ? room.whitePlayer.name
          : (room.blackPlayer?.id === socket.id || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id))
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

      const isWhite = (room.whitePlayer?.id === socket.id || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id)) || (playerProfile?.id && room.whitePlayer?.id === playerProfile.id);
      const isBlack = (room.blackPlayer?.id === socket.id || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id)) || (playerProfile?.id && room.blackPlayer?.id === playerProfile.id);

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
      room.logs.push(`${payload.name.trim() || 'Player'} joined the room.`);
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
        room.logs.push(`${currentPlayer.name} wins!`);
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
        room.logs.push(`${p.name} left the room.`);
        
        if (room.players.length === 0) {
          snlRooms.delete(currentSNLRoomId);
        } else {
          if (room.hostId === socket.id) {
            room.hostId = room.players[0].id; // transfer host
            room.logs.push(`${room.players[0].name} is now the host.`);
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

  });

  

  // --- Comments API ---

  const COMMENTS_FILE = path.join(process.cwd(), 'comments.json');
  
  const readComments = () => {
    if (fs.existsSync(COMMENTS_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf8'));
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const writeComments = (comments) => {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
  };

  app.get('/api/comments', (req, res) => {
    res.json(readComments());
  });

  app.post('/api/comments', (req, res) => {
    const { username, text, photoBase64 } = req.body;
    if (!username || !text) {
      return res.status(400).json({ error: 'Username and text are required' });
    }
    
    const newComment = {
      id: Date.now().toString(),
      username,
      text,
      photoBase64: photoBase64 || null,
      timestamp: Date.now()
    };
    
    const comments = readComments();
    comments.push(newComment);
    writeComments(comments);
    
    res.status(201).json(newComment);
  });

  app.put('/api/comments/:id', (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    
    const comments = readComments();
    const commentIndex = comments.findIndex(c => c.id === id);
    
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    comments[commentIndex].text = text;
    writeComments(comments);
    
    res.json(comments[commentIndex]);
  });

  app.delete('/api/comments/:id', (req, res) => {
    const { id } = req.params;
    
    let comments = readComments();
    comments = comments.filter(c => c.id !== id);
    writeComments(comments);
    
    res.json({ success: true });
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
