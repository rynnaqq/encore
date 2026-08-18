import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Chess, Square } from 'chess.js';
import { io, Socket } from 'socket.io-client';
import {
  RotateCcw,
  
  User,
  Users,
  Zap,
  Award,
  Volume2,
  VolumeX,
  FlipHorizontal,
  Lightbulb,
  Crown,
  Trophy,
  History,
  Clock,
  Play,
  Pause,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Globe,
  Flag,
  Handshake,
  FlagTriangleRight,
  LogOut,
} from 'lucide-react';
import { PieceSVG } from './ChessPieceSet';
import { OnlineMultiplayerLobby, RoomState, PlayerInfo, ChatMessage } from './OnlineMultiplayerLobby';
import { COUNTRIES } from '../data/countries';
import { subscribeSupabaseChessRoom, SupabaseRoomHandler, generateRoomCode, publishRoomToGlobalLobby } from '../lib/supabaseChess';
import { getSupabaseCredentials } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { AdminBadge, isAdminName, DeveloperBadge, isDeveloperName } from './AdminBadge';
import { VictoryModal } from './VictoryModal';

type GameMode = 'pass' | 'online';
type PlayerColor = 'w' | 'b';

interface MoveHistoryItem {
  san: string;
  from: Square;
  to: Square;
  piece: string;
  color: 'w' | 'b';
  captured?: string;
}

// Piece values for evaluation
const PIECE_VALUES: Record<string, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 1000,
};

// Simple Positional Evaluation Tables
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [ 5,  5, 10, 25, 25, 10,  5,  5],
  [ 0,  0,  0, 20, 20,  0,  0,  0],
  [ 5, -5,-10,  0,  0,-10, -5,  5],
  [ 5, 10, 10,-20,-20, 10, 10,  5],
  [ 0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_TABLE = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [ 0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [ -5,  0,  5,  5,  5,  5,  0, -5],
  [  0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

export const ChessGameSection: React.FC = () => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [moveHistory, setMoveHistory] = useState<MoveHistoryItem[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('pass');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [hintSquare, setHintSquare] = useState<{ from: Square; to: Square } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoFlip, setAutoFlip] = useState<boolean>(true); // Auto-flip board in 2-Player Pass & Play mode
  
  // Timer state
  const [timeControl, setTimeControl] = useState<number>(300); // 5 min default
  const [whiteTime, setWhiteTime] = useState<number>(300);
  const [blackTime, setBlackTime] = useState<number>(300);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // Socket & Online Multiplayer State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeRoom, setActiveRoom] = useState<RoomState | null>(null);
  // Publish active room to global lobby for Supabase Serverless
  useEffect(() => {
    const supaCreds = getSupabaseCredentials();
    if (!supaCreds.isConfigured) return;

    if (activeRoom && !activeRoom.isGameOver) {
      publishRoomToGlobalLobby({
        roomId: activeRoom.roomId,
        roomName: activeRoom.roomName,
        timeControl: activeRoom.timeControl,
        isPublic: activeRoom.isPublic !== false,
        playersCount: (activeRoom.whitePlayer ? 1 : 0) + (activeRoom.blackPlayer ? 1 : 0),
        spectatorsCount: activeRoom.spectators?.length || 0,
        isStarted: activeRoom.isStarted,
        isGameOver: activeRoom.isGameOver,
        whitePlayer: activeRoom.whitePlayer ? { name: activeRoom.whitePlayer.name, country: activeRoom.whitePlayer.country, flag: activeRoom.whitePlayer.flag } : null,
        blackPlayer: activeRoom.blackPlayer ? { name: activeRoom.blackPlayer.name, country: activeRoom.blackPlayer.country, flag: activeRoom.blackPlayer.flag } : null,
      });
    } else {
      publishRoomToGlobalLobby(null);
    }
  }, [activeRoom]);

  const { currentUser, openLoginModal } = useAuth();
  const [yourSide, setYourSide] = useState<'w' | 'b' | 'spectator' | null>(null);

  // Stored Player Profile
  const [playerProfile, setPlayerProfile] = useState<PlayerInfo>(() => {
    try {
      const saved = localStorage.getItem('chess_player_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name && !parsed.name.includes('Grandmaster')) {
          return parsed;
        }
      }
    } catch {}
    const defaultCountry = COUNTRIES[0];
    return {
      name: currentUser ? currentUser.username : 'Player 1',
      country: defaultCountry.code,
      flag: defaultCountry.flag,
      rating: 1200,
    };
  });

  // Sync profile when currentUser changes
  useEffect(() => {
    if (currentUser?.username && playerProfile.name !== currentUser.username) {
      setPlayerProfile(prev => ({ ...prev, name: currentUser.username }));
    }
  }, [currentUser]);

  const handleUpdateProfile = useCallback((name: string, country: string) => {
    const flag = COUNTRIES.find(c => c.code === country)?.flag || COUNTRIES[0].flag;
    const p: PlayerInfo = { ...playerProfile, name, country, flag };
    setPlayerProfile(p);
    try {
      localStorage.setItem('chess_player_profile', JSON.stringify(p));
    } catch {}
    if (socket && isConnected) {
      socket.emit('update_profile', p);
    }
  }, [playerProfile, socket, isConnected]);

  // Supabase Realtime Handler Ref
  const supabaseHandlerRef = useRef<SupabaseRoomHandler | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Game over modal
  const [gameResult, setGameResult] = useState<string | null>(null);



  // Audio effect triggers using Web Audio API for zero external dependency lag
  const playAudioEffect = useCallback((type: 'move' | 'capture' | 'check' | 'gameover') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'move') {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'capture') {
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'check') {
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'gameover') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.15);
        osc.frequency.setValueAtTime(783.99, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch {
      // Audio context ignored if user hasn't interacted
    }
  }, [soundEnabled]);

  // Helper to sync room updates from Supabase Realtime
  const handleSupabaseRoomUpdate = useCallback((room: RoomState) => {
    if (room.isGameOver && room.gameResult) {
      playAudioEffect('gameover');
      alert(room.gameResult);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('chess_active_session');
      }
      if (supabaseHandlerRef.current) {
        supabaseHandlerRef.current.leaveRoom();
        supabaseHandlerRef.current = null;
      }
      setActiveRoom(null);
      setYourSide(null);
      return;
    }
    setActiveRoom(room);
    const newChess = new Chess(room.fen);
    setGame(newChess);
    setWhiteTime(room.whiteTime);
    setBlackTime(room.blackTime);
    if (room.gameResult) setGameResult(room.gameResult);

    const historyItems: MoveHistoryItem[] = room.moveHistory.map((m) => ({
      san: m.san,
      from: m.from as Square,
      to: m.to as Square,
      piece: 'p',
      color: m.color,
    }));
    setMoveHistory(historyItems);
    if (historyItems.length > 0) {
      const last = historyItems[historyItems.length - 1];
      setLastMove({ from: last.from, to: last.to });
    } else {
      setLastMove(null);
    }
  }, [playAudioEffect]);

  const handleSupabaseChatMessage = useCallback((msg: ChatMessage) => {
    // Message already appended to activeRoom.messages in supabaseChess handler
  }, []);

  // Join or host room via Supabase Realtime
  const handleJoinSupabaseRoom = useCallback(
    (code: string, isJoining: boolean = false, opts?: { roomName: string; timeControl: number; isPublic: boolean }) => {
      const supaCreds = getSupabaseCredentials();
      if (!supaCreds.isConfigured) return;

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('chess_active_session', JSON.stringify({ roomId: code, isJoining, opts }));
      }

      if (supabaseHandlerRef.current) {
        supabaseHandlerRef.current.leaveRoom();
        supabaseHandlerRef.current = null;
      }

      const handler = subscribeSupabaseChessRoom({
        roomId: code,
        playerProfile,
        opts,
        onRoomUpdate: handleSupabaseRoomUpdate,
        onChatMessage: handleSupabaseChatMessage,
        onYourSideAssigned: (side) => {
          setYourSide(side);
          if (side === 'b') setIsFlipped(true);
          else if (side === 'w') setIsFlipped(false);
        },
        onError: (err) => {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('chess_active_session');
          }
          alert(err);
          if (window.location.search.includes('room=')) {
            const url = new URL(window.location.href);
            url.searchParams.delete('room');
            window.history.replaceState({}, '', url.pathname);
          }
        },
        isJoining,
      });

      if (handler) {
        supabaseHandlerRef.current = handler;
      }
    },
    [playerProfile, handleSupabaseRoomUpdate, handleSupabaseChatMessage]
  );

  // Promotion state
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);

  // Auto-reconnect on mount if active session or query param exists
  const chessReconnectRef = useRef(false);
  useEffect(() => {
    if (chessReconnectRef.current) return;
    chessReconnectRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setGameMode('online');
      handleJoinSupabaseRoom(roomParam, true);
      return;
    }

    if (typeof window !== 'undefined') {
      const savedSessionStr = sessionStorage.getItem('chess_active_session');
      if (savedSessionStr) {
        try {
          const session = JSON.parse(savedSessionStr);
          if (session && session.roomId) {
            setGameMode('online');
            handleJoinSupabaseRoom(session.roomId, session.isJoining, session.opts);
          }
        } catch (e) {
          console.error('Failed to restore Chess session', e);
        }
      }
    }
  }, [handleJoinSupabaseRoom]);

  // Handle board orientation automatically when changing side
  useEffect(() => {
    // Flipped state can be updated based on other modes here if needed
  }, [playerColor, gameMode]);

  // Socket lifecycle and event handlers for online multiplayer
  useEffect(() => {
    if (gameMode !== 'online') {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setActiveRoom(null);
        setYourSide(null);
      }
      return;
    }

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('update_profile', playerProfile);

      // Auto join if room query param exists
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam && !activeRoom) {
        newSocket.emit('join_room', { roomId: roomParam, player: playerProfile });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('room_joined', (data: { room: RoomState; yourSide: 'w' | 'b' | 'spectator' }) => {
      setActiveRoom(data.room);
      setYourSide(data.yourSide);
      if (data.yourSide === 'b') {
        setIsFlipped(true);
      } else {
        setIsFlipped(false);
      }
      const newChess = new Chess(data.room.fen);
      setGame(newChess);
      setWhiteTime(data.room.whiteTime);
      setBlackTime(data.room.blackTime);
      if (data.room.gameResult) setGameResult(data.room.gameResult);

      const supaCreds = getSupabaseCredentials();
      if (supaCreds.isConfigured && !supabaseHandlerRef.current) {
        handleJoinSupabaseRoom(data.room.roomId);
      }

      const historyItems: MoveHistoryItem[] = data.room.moveHistory.map((m) => ({
        san: m.san,
        from: m.from as Square,
        to: m.to as Square,
        piece: 'p',
        color: m.color,
      }));
      setMoveHistory(historyItems);
      if (historyItems.length > 0) {
        const last = historyItems[historyItems.length - 1];
        setLastMove({ from: last.from, to: last.to });
      } else {
        setLastMove(null);
      }
    });

    newSocket.on('room_updated', (room: RoomState) => {
      setActiveRoom(room);
      const newChess = new Chess(room.fen);
      setGame(newChess);
      setWhiteTime(room.whiteTime);
      setBlackTime(room.blackTime);
      if (room.gameResult) setGameResult(room.gameResult);

      const historyItems: MoveHistoryItem[] = room.moveHistory.map((m) => ({
        san: m.san,
        from: m.from as Square,
        to: m.to as Square,
        piece: 'p',
        color: m.color,
      }));
      setMoveHistory(historyItems);
      if (historyItems.length > 0) {
        const last = historyItems[historyItems.length - 1];
        setLastMove({ from: last.from, to: last.to });
      } else {
        setLastMove(null);
      }
    });

    newSocket.on('move_made', (data: { room: RoomState; lastMove: { from: Square; to: Square; san: string } }) => {
      setActiveRoom(data.room);
      const newChess = new Chess(data.room.fen);
      setGame(newChess);
      setLastMove({ from: data.lastMove.from as Square, to: data.lastMove.to as Square });
      setWhiteTime(data.room.whiteTime);
      setBlackTime(data.room.blackTime);

      const historyItems: MoveHistoryItem[] = data.room.moveHistory.map((m) => ({
        san: m.san,
        from: m.from as Square,
        to: m.to as Square,
        piece: 'p',
        color: m.color,
      }));
      setMoveHistory(historyItems);

      if (newChess.isCheckmate()) {
        playAudioEffect('gameover');
      } else if (newChess.inCheck()) {
        playAudioEffect('check');
      } else {
        playAudioEffect('move');
      }

      if (data.room.gameResult) {
        setGameResult(data.room.gameResult);
      }
    });

    newSocket.on('timer_tick', (data: { whiteTime: number; blackTime: number }) => {
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);
    });

    newSocket.on('game_over', (data: { room: RoomState; gameResult?: string }) => {
      playAudioEffect('gameover');
      const resultMsg = data.gameResult || data.room?.gameResult || 'Game Over!';
      alert(resultMsg);

      if (supabaseHandlerRef.current) {
        supabaseHandlerRef.current.leaveRoom();
        supabaseHandlerRef.current = null;
      }
      if (data.room?.roomId) {
        newSocket.emit('leave_room', { roomId: data.room.roomId });
      }
      setActiveRoom(null);
      setYourSide(null);
    });

    newSocket.on('error_message', (msg: string) => {
      alert(msg);
      if (window.location.search.includes('room=')) {
        const url = new URL(window.location.href);
        url.searchParams.delete('room');
        window.history.replaceState({}, '', url.pathname);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [gameMode, playAudioEffect, playerProfile]);

  // Timers countdown for local modes
  useEffect(() => {
    if (gameMode === 'online') return; // Online timer managed by server
    if (!isTimerActive || timeControl === 0 || gameResult || game.isGameOver()) return;

    const interval = setInterval(() => {
      const turn = game.turn();
      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            setGameResult('Black wins on time!');
            playAudioEffect('gameover');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            setGameResult('White wins on time!');
            playAudioEffect('gameover');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, game, timeControl, gameResult, playAudioEffect]);


  // Execute a move on the chess instance
  const makeMove = useCallback(
    (from: Square, to: Square, promotionPiece = 'q') => {
      // If in online mode, delegate move to Supabase or Socket server
      if (gameMode === 'online') {
        if (!activeRoom) return false;
        if (yourSide !== activeRoom.turn) return false;

        // If Supabase Realtime Handler is active
        if (supabaseHandlerRef.current) {
          try {
            const moveResult = game.move({ from, to, promotion: promotionPiece });
            if (moveResult) {
              const newGame = new Chess(game.fen());
              setGame(newGame);
              setSelectedSquare(null);
              setPossibleMoves([]);
              setLastMove({ from, to });
              setHintSquare(null);

              setMoveHistory((prev) => [
                ...prev,
                {
                  san: moveResult.san,
                  from,
                  to,
                  piece: moveResult.piece,
                  color: moveResult.color,
                  captured: moveResult.captured,
                },
              ]);

              if (newGame.isCheckmate()) {
                playAudioEffect('gameover');
              } else if (newGame.inCheck()) {
                playAudioEffect('check');
              } else if (moveResult.captured) {
                playAudioEffect('capture');
              } else {
                playAudioEffect('move');
              }

              supabaseHandlerRef.current.makeMove({
                from,
                to,
                promotion: promotionPiece,
                fen: newGame.fen(),
                san: moveResult.san,
                color: moveResult.color,
              });

              if (socket) {
                socket.emit('make_move', {
                  roomId: activeRoom.roomId,
                  move: { from, to, promotion: promotionPiece },
                });
              }
              return true;
            }
          } catch {
            return false;
          }
        }

        // Socket.IO fallback
        if (socket) {
          socket.emit('make_move', {
            roomId: activeRoom.roomId,
            move: { from, to, promotion: promotionPiece },
          });
          setSelectedSquare(null);
          setPossibleMoves([]);
          return true;
        }

        return false;
      }

      try {
        const moveResult = game.move({
          from,
          to,
          promotion: promotionPiece,
        });

        if (moveResult) {
          const newGame = new Chess(game.fen());
          setGame(newGame);
          setSelectedSquare(null);
          setPossibleMoves([]);
          setLastMove({ from, to });
          setHintSquare(null);

          // Update move log
          setMoveHistory((prev) => [
            ...prev,
            {
              san: moveResult.san,
              from,
              to,
              piece: moveResult.piece,
              color: moveResult.color,
              captured: moveResult.captured,
            },
          ]);

          // Play audio
          if (newGame.isCheckmate()) {
            playAudioEffect('gameover');
            setGameResult(newGame.turn() === 'w' ? 'Black wins by Checkmate!' : 'White wins by Checkmate!');
          } else if (newGame.inCheck()) {
            playAudioEffect('check');
          } else if (moveResult.captured) {
            playAudioEffect('capture');
          } else {
            playAudioEffect('move');
          }

          if (newGame.isDraw()) {
            playAudioEffect('gameover');
            if (newGame.isStalemate()) setGameResult('Draw by Stalemate!');
            else if (newGame.isThreefoldRepetition()) setGameResult('Draw by Threefold Repetition!');
            else if (newGame.isInsufficientMaterial()) setGameResult('Draw by Insufficient Material!');
            else setGameResult('Draw!');
          }

          // Auto-flip board in 2-Player Pass & Play mode if autoFlip is active
          if (gameMode === 'pass' && autoFlip) {
            setIsFlipped(newGame.turn() === 'b');
          }

          if (!isTimerActive && timeControl > 0) {
            setIsTimerActive(true);
          }

          return true;
        }
      } catch {
        return false;
      }
      return false;
    },
    [game, isTimerActive, timeControl, playAudioEffect, gameMode, autoFlip, socket, activeRoom, yourSide]
  );

  // Square Selection / Click handler
  const handleSquareClick = (square: Square) => {
    if (game.isGameOver() || gameResult ) return;

    // Is Online turn?
    if (gameMode === 'online') {
      if (!activeRoom || yourSide === 'spectator' || yourSide !== game.turn()) return;
    }

    // If square selected, try to move
    if (selectedSquare) {
      if (selectedSquare === square) {
        // Deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }

      // Check if clicked square is valid destination
      if (possibleMoves.includes(square)) {
        // Check for promotion
        const piece = game.get(selectedSquare);
        if (
          piece &&
          piece.type === 'p' &&
          ((piece.color === 'w' && square[1] === '8') || (piece.color === 'b' && square[1] === '1'))
        ) {
          setPromotionPending({ from: selectedSquare, to: square });
          return;
        }

        makeMove(selectedSquare, square);
        return;
      }
    }

    // Select piece
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setPossibleMoves(moves.map((m) => m.to as Square));
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  // Handle Pawn Promotion Choice
  const handlePromotionChoice = (promotionPiece: string) => {
    if (promotionPending) {
      makeMove(promotionPending.from, promotionPending.to, promotionPiece);
      setPromotionPending(null);
    }
  };

  // Reset Game
  const resetGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setGameResult(null);
    setHintSquare(null);
    setWhiteTime(timeControl);
    setBlackTime(timeControl);
    setIsTimerActive(false);
  }, [timeControl]);

  useEffect(() => {
    if (gameResult) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (activeRoom?.drawOffer && activeRoom.drawOffer !== yourSide) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [gameResult, activeRoom?.drawOffer, yourSide]);

  // Automatically reset chess board to starting position when exiting activeRoom or changing mode
  useEffect(() => {
    if (!activeRoom || gameMode !== 'online') {
      resetGame();
    }
  }, [activeRoom, gameMode, resetGame]);

  // Undo Move
  const undoMove = () => {
    if (gameResult) return;
    game.undo();
    const newGame = new Chess(game.fen());
    setGame(newGame);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setMoveHistory((prev) => prev.slice(0, -1));
    setGameResult(null);
  };

  // Hint Generator
  const showHint = () => {
    if (game.isGameOver()) return;
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return;

    // Pick a random move for the hint
    const randomIndex = Math.floor(Math.random() * moves.length);
    const randomMove = moves[randomIndex];

    if (randomMove) {
      setHintSquare({ from: randomMove.from as Square, to: randomMove.to as Square });
    }
  };

  // Calculate Captured Material Balance
  const calculateCaptured = () => {
    const initialCounts: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const currentCountsWhite: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    const currentCountsBlack: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };

    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type !== 'k') {
          if (piece.color === 'w') currentCountsWhite[piece.type]++;
          else currentCountsBlack[piece.type]++;
        }
      }
    }

    const capturedByWhite: string[] = []; // Black pieces taken
    const capturedByBlack: string[] = []; // White pieces taken

    Object.keys(initialCounts).forEach((type) => {
      const missingBlack = initialCounts[type] - currentCountsBlack[type];
      for (let i = 0; i < missingBlack; i++) capturedByWhite.push(type);

      const missingWhite = initialCounts[type] - currentCountsWhite[type];
      for (let i = 0; i < missingWhite; i++) capturedByBlack.push(type);
    });

    let whiteScore = 0;
    capturedByWhite.forEach((t) => (whiteScore += PIECE_VALUES[t] / 10));

    let blackScore = 0;
    capturedByBlack.forEach((t) => (blackScore += PIECE_VALUES[t] / 10));

    return {
      capturedByWhite,
      capturedByBlack,
      whiteAdvantage: whiteScore - blackScore,
      blackAdvantage: blackScore - whiteScore,
    };
  };

  const { capturedByWhite, capturedByBlack, whiteAdvantage, blackAdvantage } = calculateCaptured();

  // Format Time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Square theme (Standard Chess.com Tournament Green & Light Cream)
  const sqTheme = {
    dark: 'bg-[#769656]',
    light: 'bg-[#EEEED2]',
    labelDark: 'text-white/80',
    labelLight: 'text-[#769656]',
    selected: '!bg-[#F7C04A]',
    lastMove: '!bg-[#BACA44]/80',
  };

  // Render Square
  const renderSquare = (r: number, c: number) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const actualRow = isFlipped ? 7 - r : r;
    const actualCol = isFlipped ? 7 - c : c;

    const squareName = `${files[actualCol]}${ranks[actualRow]}` as Square;
    const isDark = (actualRow + actualCol) % 2 === 1;

    const piece = game.get(squareName);
    const isSelected = selectedSquare === squareName;
    const isPossible = possibleMoves.includes(squareName);
    const isLastMoveFrom = lastMove?.from === squareName;
    const isLastMoveTo = lastMove?.to === squareName;
    const isHintFrom = hintSquare?.from === squareName;
    const isHintTo = hintSquare?.to === squareName;

    // Check indicator on King
    const isKingInCheck =
      game.inCheck() &&
      piece &&
      piece.type === 'k' &&
      piece.color === game.turn();

    return (
      <div
        key={squareName}
        onClick={() => handleSquareClick(squareName)}
        className={`relative aspect-square flex items-center justify-center cursor-pointer select-none transition-[background-color] duration-75 ${
          isDark ? sqTheme.dark : sqTheme.light
        } ${isSelected ? sqTheme.selected : ''} ${
          isLastMoveFrom || isLastMoveTo ? sqTheme.lastMove : ''
        } ${isHintFrom || isHintTo ? '!bg-emerald-300' : ''} ${
          isKingInCheck ? '!bg-rose-500 animate-pulse' : ''
        }`}
      >
        {/* Rank & File Labels */}
        {c === 0 && (
          <span
            className={`absolute top-0.5 left-1 text-[9px] font-mono font-bold ${
              isDark ? sqTheme.labelDark : sqTheme.labelLight
            }`}
          >
            {ranks[actualRow]}
          </span>
        )}
        {r === 7 && (
          <span
            className={`absolute bottom-0.5 right-1 text-[9px] font-mono font-bold ${
              isDark ? sqTheme.labelDark : sqTheme.labelLight
            }`}
          >
            {files[actualCol]}
          </span>
        )}

        {/* Piece Icon */}
        {piece && (
          <div
            key={`${squareName}-${piece.type}-${piece.color}`}
            className="w-[85%] h-[85%] z-10 flex items-center justify-center select-none"
          >
            <PieceSVG type={piece.type} color={piece.color} />
          </div>
        )}

        {/* Possible Move Indicator */}
        {isPossible && (
          <div
            className={`absolute z-20 rounded-full ${
              piece
                ? 'w-full h-full border-4 border-amber-400/90'
                : 'w-3.5 h-3.5 bg-amber-500/80 shadow-md'
            }`}
          />
        )}
      </div>
    );
  };

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 min-h-screen flex flex-col justify-center relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        
        {/* Header Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFCCE1] text-[#E195AB] font-mono text-xs sm:text-sm font-bold tracking-wide mb-3 shadow-sm">
            <Crown className="w-4 h-4 text-[#E195AB]" />
            <span>GRANDMASTER CHESS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Play Chess <span className="text-[#E195AB]">Interactive</span>
          </h1>
        </motion.div>

        {/* Main Controls & Multiplayer Options Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-[#FFCCE1] dark:border-slate-800 shadow-lg flex flex-wrap items-center justify-between gap-4"
        >
          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setGameMode('pass');
                resetGame();
              }}
              className={`px-3 py-1.5 rounded-xl font-sans text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                gameMode === 'pass'
                  ? 'bg-[#E195AB] text-white shadow-md'
                  : 'bg-[#FFF5D7] dark:bg-slate-800 text-[#E195AB] dark:text-[#FFCCE1] hover:bg-[#FFCCE1] dark:hover:bg-slate-700 border border-[#FFCCE1]/50 dark:border-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pass & Play</span>
            </button>
            <button
              onClick={() => {
                if (!currentUser) {
                  openLoginModal();
                  return;
                }
                setGameMode('online');
              }}
              className={`px-3 py-1.5 rounded-xl font-sans text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                gameMode === 'online'
                  ? 'bg-[#E195AB] text-white shadow-md'
                  : 'bg-[#FFF5D7] dark:bg-slate-800 text-[#E195AB] dark:text-[#FFCCE1] hover:bg-[#FFCCE1] dark:hover:bg-slate-700 border border-[#FFCCE1]/50 dark:border-slate-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Online Multiplayer</span>
            </button>
          </div>


          {/* Time Control Selector */}
          <div className="flex items-center gap-1.5 bg-[#FFF5D7] dark:bg-slate-800 p-1 rounded-xl border border-[#FFCCE1] dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-[#E195AB] dark:text-[#FFCCE1] ml-1" />
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-bold pr-1">Timer:</span>
            {[
              { time: 0, label: '∞' },
              { time: 180, label: '3m' },
              { time: 300, label: '5m' },
              { time: 600, label: '10m' },
            ].map((item) => (
              <button
                key={item.time}
                onClick={() => {
                  setTimeControl(item.time);
                  setWhiteTime(item.time);
                  setBlackTime(item.time);
                  setIsTimerActive(false);
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeControl === item.time
                    ? 'bg-[#E195AB] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-[#FFCCE1]/50 dark:hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Quick Actions & Auto Flip Toggle */}
          <div className="flex items-center gap-2">
            {gameMode === 'pass' && (
              <button
                onClick={() => setAutoFlip(!autoFlip)}
                title="Auto Flip Board on Turn"
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                  autoFlip
                    ? 'bg-[#E195AB] text-white border-[#E195AB] shadow-sm'
                    : 'bg-[#FFF5D7] dark:bg-slate-800 text-[#E195AB] dark:text-[#FFCCE1] border-[#FFCCE1] dark:border-slate-700 hover:bg-[#FFCCE1] dark:hover:bg-slate-700'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoFlip ? 'animate-spin-slow' : ''}`} />
                <span>Auto-Flip: {autoFlip ? 'ON' : 'OFF'}</span>
              </button>
            )}
            <button
              onClick={showHint}
              title="Get Hint"
              className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors cursor-pointer"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              title="Flip Board"
              className="p-2 rounded-xl bg-[#FFF5D7] dark:bg-slate-800 text-[#E195AB] dark:text-[#FFCCE1] border border-[#FFCCE1] dark:border-slate-700 hover:bg-[#FFCCE1] dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title="Toggle Audio"
              className="p-2 rounded-xl bg-[#FFF5D7] dark:bg-slate-800 text-[#E195AB] dark:text-[#FFCCE1] border border-[#FFCCE1] dark:border-slate-700 hover:bg-[#FFCCE1] dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>

        {/* Online Multiplayer Lobby Component */}
        {gameMode === 'online' && (
          <OnlineMultiplayerLobby
            socket={socket}
            isConnected={isConnected}
            activeRoom={activeRoom}
            yourSide={yourSide}
            playerProfile={playerProfile}
            onUpdateProfile={handleUpdateProfile}
            onCreateRoom={(opts) => {
              const code = generateRoomCode();
              const supaCreds = getSupabaseCredentials();
              if (supaCreds.isConfigured) {
                handleJoinSupabaseRoom(code, false, opts);
              }
              if (socket) {
                socket.emit('create_room', { roomId: code, player: playerProfile, ...opts });
              }
            }}
            onJoinRoom={(code) => {
              if (socket && isConnected) {
                socket.emit('join_room', { roomId: code, player: playerProfile });
              } else {
                const supaCreds = getSupabaseCredentials();
                if (supaCreds.isConfigured) {
                  handleJoinSupabaseRoom(code, true);
                } else {
                  alert('Kode room tidak ditemukan');
                }
              }
            }}
            onQuickMatch={() => {
              if (socket && isConnected) {
                socket.emit('quick_match', { player: playerProfile });
              } else {
                const supaCreds = getSupabaseCredentials();
                if (supaCreds.isConfigured) {
                  const code = '123456';
                  handleJoinSupabaseRoom(code);
                }
              }
            }}
            onLeaveRoom={() => {
              if (supabaseHandlerRef.current) {
                supabaseHandlerRef.current.leaveRoom();
                supabaseHandlerRef.current = null;
              }
              if (socket && activeRoom) {
                socket.emit('leave_room', { roomId: activeRoom.roomId });
              }
              setActiveRoom(null);
              setYourSide(null);
              resetGame();
            }}
            onSendChat={(text) => {
              if (supabaseHandlerRef.current) {
                supabaseHandlerRef.current.sendChat(text);
              }
              if (socket && activeRoom) {
                socket.emit('send_chat', { roomId: activeRoom.roomId, text });
              }
            }}

          />
        )}

        {/* Turn Indicator Banner */}
        <div className="w-full max-w-[560px] mx-auto mb-3 px-4 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-[#FFCCE1] dark:border-slate-800 shadow-sm flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                game.turn() === 'w' ? 'bg-white border-2 border-slate-800' : 'bg-slate-800'
              } ${!game.isGameOver() ? 'animate-pulse' : ''}`}
            />
            <span className="font-mono text-xs uppercase tracking-wider">
              {game.turn() === 'w' ? 'White' : 'Black'}'s Turn
              {gameMode === 'pass'
                ? game.turn() === 'w'
                  ? ' (Player 1)'
                  : ' (Player 2)'
                : gameMode === 'online'
                ? yourSide === game.turn()
                  ? ' (Your Turn!)'
                  : ' (Opponent)'
                : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
            {gameMode === 'pass' ? (
              <span className="px-2 py-0.5 rounded-md bg-[#FFF5D7] dark:bg-slate-800 text-[#E195AB] dark:text-[#FFCCE1] border border-[#FFCCE1]/50 dark:border-slate-700 font-bold">
                Local Pass & Play
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-[#FFF5D7] dark:bg-slate-800 text-[#E195AB] dark:text-[#FFCCE1] border border-[#FFCCE1]/50 dark:border-slate-700 font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Online Multiplayer
              </span>
            )}
          </div>
        </div>

        {/* Main Chess Layout (Board + Sidebar) */}
        {(!activeRoom || activeRoom.isStarted) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Board & Player Info */}
          <div className="lg:col-span-8 flex flex-col items-center">
            
            {/* Top Player Card (Black or Opponent) */}
            <div className="w-full max-w-[560px] mb-2.5 sm:mb-3 p-2.5 sm:p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-[#FFCCE1] dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 dark:bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm shrink-0">
                  {gameMode === 'online' && activeRoom ? (
                    <span className="text-sm sm:text-base">
                      {isFlipped
                        ? activeRoom.whitePlayer?.flag || '⚪'
                        : activeRoom.blackPlayer?.flag || '⚫'}
                    </span>
                  ) : (
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
                    <span className="truncate">
                      {gameMode === 'online' && activeRoom
                        ? isFlipped
                          ? activeRoom.whitePlayer?.name || 'Waiting for Player 1...'
                          : activeRoom.blackPlayer?.name || 'Waiting for Player 2...'
                        : isFlipped
                        ? 'Player 1 (White)'
                        : 'Player 2 (Black)'}
                    </span>
                    {isDeveloperName(
                      gameMode === 'online' && activeRoom
                        ? isFlipped
                          ? activeRoom.whitePlayer?.name
                          : activeRoom.blackPlayer?.name
                        : null
                    ) && <DeveloperBadge />}
                    {!isDeveloperName(
                      gameMode === 'online' && activeRoom
                        ? isFlipped
                          ? activeRoom.whitePlayer?.name
                          : activeRoom.blackPlayer?.name
                        : null
                    ) && isAdminName(
                      gameMode === 'online' && activeRoom
                        ? isFlipped
                          ? activeRoom.whitePlayer?.name
                          : activeRoom.blackPlayer?.name
                        : null
                    ) && <AdminBadge />}
                    {game.turn() === (isFlipped ? 'w' : 'b') && !game.isGameOver() && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    )}
                  </div>
                  {/* Captured pieces */}
                  <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5 min-h-[16px] overflow-x-auto">
                    {(isFlipped ? capturedByWhite : capturedByBlack).map((t, idx) => (
                      <span key={idx} className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-90 inline-block shrink-0">
                        <PieceSVG type={t} color={isFlipped ? 'b' : 'w'} />
                      </span>
                    ))}
                    {(isFlipped ? whiteAdvantage : blackAdvantage) > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 ml-1">
                        +{(isFlipped ? whiteAdvantage : blackAdvantage)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Player Timer */}
              {timeControl > 0 && (
                <div
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-mono text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 ml-2 ${
                    game.turn() === (isFlipped ? 'w' : 'b') && (isTimerActive || gameMode === 'online')
                      ? 'bg-rose-500 text-white shadow-md animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{formatTime(isFlipped ? whiteTime : blackTime)}</span>
                </div>
              )}
            </div>

            {/* Chess Board Frame */}
            <div className="relative w-full max-w-[min(100%,560px)] aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 sm:border-4 border-[#FFCCE1] dark:border-slate-800 bg-white dark:bg-slate-900 gpu-smooth">
              <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
                {Array.from({ length: 8 }).map((_, r) =>
                  Array.from({ length: 8 }).map((_, c) => renderSquare(r, c))
                )}
              </div>
            </div>

            {/* Bottom Player Card (White or You) */}
            <div className="w-full max-w-[560px] mt-2.5 sm:mt-3 p-2.5 sm:p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-[#FFCCE1] dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFF5D7] dark:bg-slate-800 border border-[#FFCCE1] dark:border-slate-700 text-[#E195AB] dark:text-[#FFCCE1] flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm shrink-0">
                  {gameMode === 'online' && activeRoom ? (
                    <span className="text-sm sm:text-base">
                      {isFlipped
                        ? activeRoom.blackPlayer?.flag || '⚫'
                        : activeRoom.whitePlayer?.flag || '⚪'}
                    </span>
                  ) : (
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
                    <span className="truncate">
                      {gameMode === 'online' && activeRoom
                        ? isFlipped
                          ? activeRoom.blackPlayer?.name || 'Waiting for Player 2...'
                          : activeRoom.whitePlayer?.name || 'Waiting for Player 1...'
                        : isFlipped
                        ? 'Player 2 (Black)'
                        : 'Player 1 (White)'}
                    </span>
                    {isDeveloperName(
                      gameMode === 'online' && activeRoom
                        ? isFlipped
                          ? activeRoom.blackPlayer?.name
                          : activeRoom.whitePlayer?.name
                        : null
                    ) && <DeveloperBadge />}
                    {!isDeveloperName(
                      gameMode === 'online' && activeRoom
                        ? isFlipped
                          ? activeRoom.blackPlayer?.name
                          : activeRoom.whitePlayer?.name
                        : null
                    ) && isAdminName(
                      gameMode === 'online' && activeRoom
                        ? isFlipped
                          ? activeRoom.blackPlayer?.name
                          : activeRoom.whitePlayer?.name
                        : null
                    ) && <AdminBadge />}
                    {game.turn() === (isFlipped ? 'b' : 'w') && !game.isGameOver() && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </div>
                  {/* Captured pieces */}
                  <div className="flex items-center gap-1 mt-0.5 min-h-[16px]">
                    {(isFlipped ? capturedByBlack : capturedByWhite).map((t, idx) => (
                      <span key={idx} className="w-4 h-4 opacity-90 inline-block">
                        <PieceSVG type={t} color={isFlipped ? 'w' : 'b'} />
                      </span>
                    ))}
                    {(isFlipped ? blackAdvantage : whiteAdvantage) > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 ml-1">
                        +{(isFlipped ? blackAdvantage : whiteAdvantage)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Player Timer */}
              {timeControl > 0 && (
                <div
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 ${
                    game.turn() === (isFlipped ? 'b' : 'w') && (isTimerActive || gameMode === 'online')
                      ? 'bg-rose-500 text-white shadow-md animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(isFlipped ? blackTime : whiteTime)}</span>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Game Info, History & Actions */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Status & Action Buttons */}
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-[#FFCCE1] dark:border-slate-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#FFCCE1] dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#E195AB] dark:text-[#FFCCE1]" />
                  <span className="font-bold text-xs uppercase tracking-wide text-slate-800 dark:text-slate-100">
                    Game Status
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                    game.inCheck()
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      : 'bg-[#FFF5D7] dark:bg-slate-800 text-[#E195AB] dark:text-[#FFCCE1] border border-[#FFCCE1]/50 dark:border-slate-700'
                  }`}
                >
                  {game.inCheck()
                    ? 'CHECK!'
                    : `${game.turn() === 'w' ? 'White' : 'Black'}'s Turn`}
                </span>
              </div>

              {/* Buttons Cluster */}
              {gameMode === 'online' ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      if (supabaseHandlerRef.current) {
                        supabaseHandlerRef.current.resignGame();
                      }
                      if (activeRoom && socket) {
                        socket.emit('resign_game', { roomId: activeRoom.roomId });
                      }
                    }}
                    disabled={!activeRoom || game.isGameOver()}
                    className="px-2.5 py-2 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[11px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/60 disabled:opacity-40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Resign</span>
                  </button>

                  <button
                    onClick={() => {
                      if (supabaseHandlerRef.current) {
                        supabaseHandlerRef.current.offerDraw(yourSide as "w" | "b");
                      }
                      if (activeRoom && socket) {
                        socket.emit('offer_draw', { roomId: activeRoom.roomId });
                      }
                    }}
                    disabled={!activeRoom || game.isGameOver()}
                    className="px-2.5 py-2 rounded-xl bg-[#FFF5D7] dark:bg-slate-800 border border-[#FFCCE1] dark:border-slate-700 text-[#E195AB] dark:text-[#FFCCE1] text-[11px] font-bold hover:bg-[#FFCCE1] dark:hover:bg-slate-700 disabled:opacity-40 transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Handshake className="w-3.5 h-3.5" />
                    <span>Draw</span>
                  </button>

                  <button
                    onClick={() => {
                      if (supabaseHandlerRef.current) {
                        supabaseHandlerRef.current.leaveRoom();
                        supabaseHandlerRef.current = null;
                      }
                      if (socket && activeRoom) {
                        socket.emit('leave_room', { roomId: activeRoom.roomId });
                      }
                      setActiveRoom(null);
                      setYourSide(null);
                    }}
                    className="px-2.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[11px] font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Leave</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={undoMove}
                    disabled={moveHistory.length === 0 }
                    className="px-3 py-2 rounded-xl border border-[#FFCCE1] dark:border-slate-700 bg-[#FFF5D7] dark:bg-slate-800 text-[#E195AB] dark:text-[#FFCCE1] text-xs font-bold hover:bg-[#FFCCE1] dark:hover:bg-slate-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>
                  <button
                    onClick={resetGame}
                    className="px-3 py-2 rounded-xl bg-[#E195AB] text-white text-xs font-bold hover:bg-[#d68097] transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>New Game</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
        )}

        {/* Promotion Dialog Modal */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {promotionPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-[#FFCCE1] dark:border-slate-800 p-6 shadow-2xl max-w-sm w-full text-center space-y-4"
                >
                  <h3 className="font-sans font-bold text-lg text-slate-800 dark:text-slate-100">
                    Promote Pawn
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select a piece to promote your pawn to:
                  </p>
                  <div className="grid grid-cols-4 gap-3 pt-2">
                    {[
                      { type: 'q', label: 'Queen' },
                      { type: 'r', label: 'Rook' },
                      { type: 'b', label: 'Bishop' },
                      { type: 'n', label: 'Knight' },
                    ].map((item) => (
                      <button
                        key={item.type}
                        onClick={() => handlePromotionChoice(item.type)}
                        className="p-3 rounded-2xl bg-[#FFF5D7] dark:bg-slate-800 border border-[#FFCCE1] dark:border-slate-700 hover:border-[#E195AB] hover:bg-[#FFCCE1] dark:hover:bg-slate-700 transition-all flex flex-col items-center gap-1 cursor-pointer"
                      >
                        <div className="w-8 h-8">
                          <PieceSVG type={item.type} color={game.turn()} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Draw Offer Pop-Up Modal */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {activeRoom?.drawOffer && activeRoom.drawOffer !== yourSide && !activeRoom.isGameOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-[#FFCCE1] dark:border-slate-800 p-6 sm:p-8 shadow-2xl max-w-md w-full text-center space-y-5"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF5D7] dark:bg-slate-800 border-2 border-[#FFCCE1] dark:border-slate-700 flex items-center justify-center text-[#E195AB] dark:text-[#FFCCE1]">
                    <Handshake className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-sans font-extrabold text-2xl text-slate-800 dark:text-slate-100">
                      🤝 Tawaran Remis!
                    </h3>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                      Lawan Anda (
                      <span className="font-bold text-[#E195AB]">
                        {activeRoom.drawOffer === 'w'
                          ? activeRoom.whitePlayer?.name || 'Pemain Putih'
                          : activeRoom.blackPlayer?.name || 'Pemain Hitam'}
                      </span>
                      ) menawarkan hasil remis. Apakah Anda menerima?
                    </p>
                  </div>
                  <div className="pt-2 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        if (supabaseHandlerRef.current) {
                          supabaseHandlerRef.current.declineDraw();
                        }
                        if (socket && activeRoom) {
                          socket.emit('respond_draw', { roomId: activeRoom.roomId, accept: false });
                        }
                      }}
                      className="py-3 rounded-2xl bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => {
                        if (supabaseHandlerRef.current) {
                          supabaseHandlerRef.current.acceptDraw();
                        }
                        if (socket && activeRoom) {
                          socket.emit('respond_draw', { roomId: activeRoom.roomId, accept: true });
                        }
                      }}
                      className="py-3 rounded-2xl bg-[#E195AB] text-white font-bold text-sm hover:bg-[#d88299] transition-all shadow-md cursor-pointer"
                    >
                      Terima Remis
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Game Result Modal */}
        {typeof document !== 'undefined' && createPortal(
          <VictoryModal
            isOpen={!!gameResult}
            winnerName={gameResult || 'Game Over'}
            winnerColor="#E195AB"
            subtitle="Pertandingan catur telah selesai!"
            gameTitle="Catur Multiplayer"
            isHost={true}
            onPlayAgain={() => {
              resetGame();
              if (gameMode === 'online') {
                if (supabaseHandlerRef.current) {
                  supabaseHandlerRef.current.requestRematch();
                }
                if (socket && activeRoom) {
                  socket.emit('request_rematch', { roomId: activeRoom.roomId });
                }
              }
            }}
            onLeave={() => {
              if (gameMode === 'online') {
                if (supabaseHandlerRef.current) {
                  supabaseHandlerRef.current.leaveRoom();
                  supabaseHandlerRef.current = null;
                }
                if (socket && activeRoom) {
                  socket.emit('leave_room', { roomId: activeRoom.roomId });
                }
                setActiveRoom(null);
                setYourSide(null);
              }
              resetGame();
              setGameResult(null);
            }}
            playAgainText="Main Lagi / Rematch"
            leaveText="Keluar ke Lobby"
          />,
          document.body
        )}
      </div>
    </section>
  );
};
