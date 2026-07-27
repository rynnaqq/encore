import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';
import { PlayerInfo, RoomState, ChatMessage } from '../components/OnlineMultiplayerLobby';

export interface SupabaseRoomHandler {
  channel: RealtimeChannel;
  makeMove: (move: { from: string; to: string; promotion?: string; fen: string; san: string; color: 'w' | 'b' }) => void;
  sendChat: (text: string) => void;
  resignGame: () => void;
  offerDraw: () => void;
  acceptDraw: () => void;
  requestRematch: () => void;
  leaveRoom: () => void;
  syncState: (roomState: RoomState) => void;
}

export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function subscribeSupabaseChessRoom({
  roomId,
  playerProfile,
  onRoomUpdate,
  onChatMessage,
  onYourSideAssigned,
  onError,
}: {
  roomId: string;
  playerProfile: PlayerInfo;
  onRoomUpdate: (room: RoomState) => void;
  onChatMessage: (msg: ChatMessage) => void;
  onYourSideAssigned: (side: 'w' | 'b' | 'spectator') => void;
  onError: (msg: string) => void;
}): SupabaseRoomHandler | null {
  const supabase = getSupabaseClient();
  if (!supabase) {
    onError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to environment variables.');
    return null;
  }

  const channelName = `chess-room-${roomId.trim()}`;
  const channel = supabase.channel(channelName, {
    config: {
      presence: { key: playerProfile.id || playerProfile.name },
      broadcast: { self: true },
    },
  });

  let currentRoomState: RoomState = {
    roomId,
    roomName: `Match #${roomId}`,
    timeControl: 300,
    whitePlayer: null,
    blackPlayer: null,
    spectators: [],
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moveHistory: [],
    whiteTime: 300,
    blackTime: 300,
    turn: 'w',
    isStarted: false,
    isGameOver: false,
    gameResult: null,
    winner: null,
    drawOffer: null,
    rematchRequests: [],
    messages: [
      {
        id: `sys-${Date.now()}`,
        senderName: 'System',
        text: `⚡ Connected to Supabase Realtime Room #${roomId}`,
        timestamp: Date.now(),
        isSystem: true,
      },
    ],
  };

  // Helper to resolve player seats based on presence
  const updatePlayersFromPresence = (presenceState: Record<string, any[]>) => {
    const presentUsers: Array<PlayerInfo & { sidePreference?: string; joinedAt?: number }> = [];

    Object.values(presenceState).forEach((presences) => {
      presences.forEach((p) => {
        if (p.user) presentUsers.push(p.user);
      });
    });

    // Sort by join timestamp
    presentUsers.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

    let white: PlayerInfo | null = currentRoomState.whitePlayer;
    let black: PlayerInfo | null = currentRoomState.blackPlayer;
    const spectators: PlayerInfo[] = [];

    presentUsers.forEach((u) => {
      if (!white && u.id !== black?.id) {
        white = u;
      } else if (!black && u.id !== white?.id) {
        black = u;
      } else if (u.id !== white?.id && u.id !== black?.id) {
        spectators.push(u);
      }
    });

    currentRoomState.whitePlayer = white;
    currentRoomState.blackPlayer = black;
    currentRoomState.spectators = spectators;

    // Determine my side
    const myId = playerProfile.id || playerProfile.name;
    if (white && (white.id === myId || white.name === playerProfile.name)) {
      onYourSideAssigned('w');
    } else if (black && (black.id === myId || black.name === playerProfile.name)) {
      onYourSideAssigned('b');
    } else {
      onYourSideAssigned('spectator');
    }

    if (white && black && !currentRoomState.isStarted) {
      currentRoomState.isStarted = true;
      currentRoomState.messages.push({
        id: `sys-${Date.now()}`,
        senderName: 'System',
        text: `🎮 Both players connected! Game started: ${white.name} (White) vs ${black.name} (Black).`,
        timestamp: Date.now(),
        isSystem: true,
      });
    }

    onRoomUpdate({ ...currentRoomState });
  };

  // Channel Listeners
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      updatePlayersFromPresence(state);
    })
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      const state = channel.presenceState();
      updatePlayersFromPresence(state);
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      const state = channel.presenceState();
      updatePlayersFromPresence(state);
    })
    .on('broadcast', { event: 'SYNC_STATE' }, ({ payload }) => {
      if (payload && payload.fen) {
        currentRoomState = { ...payload };
        onRoomUpdate({ ...currentRoomState });
      }
    })
    .on('broadcast', { event: 'MAKE_MOVE' }, ({ payload }) => {
      if (payload) {
        currentRoomState.fen = payload.fen;
        currentRoomState.turn = payload.color === 'w' ? 'b' : 'w';
        currentRoomState.moveHistory.push({
          from: payload.from,
          to: payload.to,
          promotion: payload.promotion,
          san: payload.san,
          color: payload.color,
        });

        if (payload.isGameOver) {
          currentRoomState.isGameOver = true;
          currentRoomState.gameResult = payload.gameResult || 'Game Over';
          currentRoomState.winner = payload.winner || null;
        }

        onRoomUpdate({ ...currentRoomState });
      }
    })
    .on('broadcast', { event: 'SEND_CHAT' }, ({ payload }) => {
      if (payload) {
        const chatMsg: ChatMessage = {
          id: payload.id || `msg-${Date.now()}`,
          senderName: payload.senderName,
          text: payload.text,
          timestamp: payload.timestamp || Date.now(),
          country: payload.country,
        };
        currentRoomState.messages.push(chatMsg);
        onChatMessage(chatMsg);
        onRoomUpdate({ ...currentRoomState });
      }
    })
    .on('broadcast', { event: 'RESIGN' }, ({ payload }) => {
      if (payload) {
        currentRoomState.isGameOver = true;
        currentRoomState.winner = payload.resignerSide === 'w' ? 'b' : 'w';
        currentRoomState.gameResult = `Resignation - ${payload.resignerSide === 'w' ? 'Black' : 'White'} wins!`;
        currentRoomState.messages.push({
          id: `sys-${Date.now()}`,
          senderName: 'System',
          text: `🏳️ ${payload.resignerSide === 'w' ? 'White' : 'Black'} resigned.`,
          timestamp: Date.now(),
          isSystem: true,
        });
        onRoomUpdate({ ...currentRoomState });
      }
    })
    .on('broadcast', { event: 'OFFER_DRAW' }, ({ payload }) => {
      if (payload) {
        currentRoomState.drawOffer = payload.side;
        currentRoomState.messages.push({
          id: `sys-${Date.now()}`,
          senderName: 'System',
          text: `🤝 ${payload.side === 'w' ? 'White' : 'Black'} offered a draw.`,
          timestamp: Date.now(),
          isSystem: true,
        });
        onRoomUpdate({ ...currentRoomState });
      }
    })
    .on('broadcast', { event: 'ACCEPT_DRAW' }, () => {
      currentRoomState.isGameOver = true;
      currentRoomState.winner = 'draw';
      currentRoomState.gameResult = 'Draw agreed by mutual consent.';
      currentRoomState.drawOffer = null;
      currentRoomState.messages.push({
        id: `sys-${Date.now()}`,
        senderName: 'System',
        text: `🤝 Draw accepted. Game drawn!`,
        timestamp: Date.now(),
        isSystem: true,
      });
      onRoomUpdate({ ...currentRoomState });
    })
    .on('broadcast', { event: 'REMATCH' }, () => {
      currentRoomState.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      currentRoomState.moveHistory = [];
      currentRoomState.turn = 'w';
      currentRoomState.isGameOver = false;
      currentRoomState.gameResult = null;
      currentRoomState.winner = null;
      currentRoomState.drawOffer = null;
      currentRoomState.messages.push({
        id: `sys-${Date.now()}`,
        senderName: 'System',
        text: `🔄 Rematch started! Good luck!`,
        timestamp: Date.now(),
        isSystem: true,
      });
      onRoomUpdate({ ...currentRoomState });
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user: {
            ...playerProfile,
            id: playerProfile.id || playerProfile.name,
            joinedAt: Date.now(),
          },
        });
      } else if (status === 'CHANNEL_ERROR') {
        onError('Connection error subscribing to Supabase Realtime.');
      }
    });

  const handler: SupabaseRoomHandler = {
    channel,
    makeMove: (move) => {
      channel.send({
        type: 'broadcast',
        event: 'MAKE_MOVE',
        payload: move,
      });
    },
    sendChat: (text) => {
      const payload = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        senderName: playerProfile.name,
        country: playerProfile.country,
        text,
        timestamp: Date.now(),
      };
      channel.send({
        type: 'broadcast',
        event: 'SEND_CHAT',
        payload,
      });
    },
    resignGame: () => {
      const myId = playerProfile.id || playerProfile.name;
      const resignerSide = currentRoomState.whitePlayer?.id === myId ? 'w' : 'b';
      channel.send({
        type: 'broadcast',
        event: 'RESIGN',
        payload: { resignerSide },
      });
    },
    offerDraw: () => {
      const myId = playerProfile.id || playerProfile.name;
      const side = currentRoomState.whitePlayer?.id === myId ? 'w' : 'b';
      channel.send({
        type: 'broadcast',
        event: 'OFFER_DRAW',
        payload: { side },
      });
    },
    acceptDraw: () => {
      channel.send({
        type: 'broadcast',
        event: 'ACCEPT_DRAW',
        payload: {},
      });
    },
    requestRematch: () => {
      channel.send({
        type: 'broadcast',
        event: 'REMATCH',
        payload: {},
      });
    },
    leaveRoom: () => {
      channel.untrack();
      channel.unsubscribe();
    },
    syncState: (roomState) => {
      channel.send({
        type: 'broadcast',
        event: 'SYNC_STATE',
        payload: roomState,
      });
    },
  };

  return handler;
}
