import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chess, Square } from 'chess.js';
import { io, Socket } from 'socket.io-client';
import {
  RotateCcw,
  Bot,
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
} from 'lucide-react';
import { PieceSVG } from './ChessPieceSet';
import { OnlineMultiplayerLobby, RoomState, PlayerInfo } from './OnlineMultiplayerLobby';
import { COUNTRIES } from '../data/countries';

type GameMode = 'ai' | 'pass' | 'online';
type AIDifficulty = 'easy' | 'medium' | 'hard';
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
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
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
  const [yourSide, setYourSide] = useState<'w' | 'b' | 'spectator' | null>(null);

  // Stored Player Profile
  const [playerProfile, setPlayerProfile] = useState<PlayerInfo>(() => {
    try {
      const saved = localStorage.getItem('chess_player_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    const defaultCountry = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    return {
      name: `Grandmaster #${Math.floor(1000 + Math.random() * 9000)}`,
      country: defaultCountry.code,
      flag: defaultCountry.flag,
      rating: 1200,
    };
  });

  const handleUpdateProfile = useCallback((p: PlayerInfo) => {
    setPlayerProfile(p);
    try {
      localStorage.setItem('chess_player_profile', JSON.stringify(p));
    } catch {}
    if (socket && isConnected) {
      socket.emit('update_profile', p);
    }
  }, [socket, isConnected]);

  // Promotion state
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);

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

  // Auto-detect room query param on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setGameMode('online');
    }
  }, []);

  // Handle board orientation automatically when changing side
  useEffect(() => {
    if (gameMode === 'ai') {
      setIsFlipped(playerColor === 'b');
    }
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

      const historyItems: MoveHistoryItem[] = data.room.moveHistory.map((m) => ({
        san: m.san,
        from: m.from as Square,
        to: m.to as Square,
        piece: 'p',
        color: m.color,
      }));
      setMoveHistory(historyItems);
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

    newSocket.on('game_over', (data: { room: RoomState; gameResult: string }) => {
      setActiveRoom(data.room);
      setGameResult(data.gameResult);
      playAudioEffect('gameover');
    });

    newSocket.on('error_message', (msg: string) => {
      alert(msg);
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

  // Evaluate position score for AI
  const evaluateBoard = (currentBoard: ReturnType<Chess['board']>) => {
    let totalEvaluation = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currentBoard[r][c];
        if (piece) {
          const val = PIECE_VALUES[piece.type] || 0;
          let tableVal = 0;
          const row = piece.color === 'w' ? 7 - r : r;
          const col = c;

          if (piece.type === 'p') tableVal = PAWN_TABLE[row][col];
          else if (piece.type === 'n') tableVal = KNIGHT_TABLE[row][col];
          else if (piece.type === 'b') tableVal = BISHOP_TABLE[row][col];
          else if (piece.type === 'r') tableVal = ROOK_TABLE[row][col];
          else if (piece.type === 'q') tableVal = QUEEN_TABLE[row][col];

          const score = val + tableVal;
          totalEvaluation += piece.color === 'w' ? score : -score;
        }
      }
    }
    return totalEvaluation;
  };

  // Minimax evaluation for Hard AI
  const minimax = (
    chessGame: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number => {
    if (depth === 0 || chessGame.isGameOver()) {
      return evaluateBoard(chessGame.board());
    }

    const moves = chessGame.moves({ verbose: true });
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        chessGame.move(move);
        const evalScore = minimax(chessGame, depth - 1, alpha, beta, false);
        chessGame.undo();
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        chessGame.move(move);
        const evalScore = minimax(chessGame, depth - 1, alpha, beta, true);
        chessGame.undo();
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  // Get AI Move according to difficulty
  const getAIMove = useCallback(() => {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    if (difficulty === 'easy') {
      // Pick random move, but prefer capture 40% of the time
      const captures = moves.filter((m) => m.captured);
      if (captures.length > 0 && Math.random() < 0.4) {
        return captures[Math.floor(Math.random() * captures.length)];
      }
      return moves[Math.floor(Math.random() * moves.length)];
    }

    if (difficulty === 'medium') {
      // 1-ply evaluation lookahead
      let bestMove = moves[0];
      let bestScore = game.turn() === 'w' ? -Infinity : Infinity;

      for (const move of moves) {
        game.move(move);
        const score = evaluateBoard(game.board());
        game.undo();

        if (game.turn() === 'w') {
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        } else {
          if (score < bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
      }
      return bestMove;
    }

    // Hard difficulty: Minimax with alpha-beta depth 2 or 3
    let bestMove = moves[0];
    const isMax = game.turn() === 'w';
    let bestScore = isMax ? -Infinity : Infinity;

    for (const move of moves) {
      game.move(move);
      const score = minimax(game, 2, -Infinity, Infinity, !isMax);
      game.undo();

      if (isMax) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    return bestMove;
  }, [game, difficulty]);

  // Execute a move on the chess instance
  const makeMove = useCallback(
    (from: Square, to: Square, promotionPiece = 'q') => {
      // If in online mode, delegate move to socket server
      if (gameMode === 'online') {
        if (!socket || !activeRoom) return false;
        if (yourSide !== activeRoom.turn) return false;

        socket.emit('make_move', {
          roomId: activeRoom.roomId,
          move: { from, to, promotion: promotionPiece },
        });

        setSelectedSquare(null);
        setPossibleMoves([]);
        return true;
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

  // Trigger AI Turn when turn matches AI
  useEffect(() => {
    if (
      gameMode === 'ai' &&
      !game.isGameOver() &&
      !gameResult &&
      game.turn() !== playerColor
    ) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const aiMove = getAIMove();
        if (aiMove) {
          makeMove(aiMove.from as Square, aiMove.to as Square, aiMove.promotion || 'q');
        }
        setIsThinking(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [game, gameMode, playerColor, gameResult, getAIMove, makeMove]);

  // Square Selection / Click handler
  const handleSquareClick = (square: Square) => {
    if (game.isGameOver() || gameResult || isThinking) return;

    // Is AI turn?
    if (gameMode === 'ai' && game.turn() !== playerColor) return;

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
  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setGameResult(null);
    setHintSquare(null);
    setIsThinking(false);
    setWhiteTime(timeControl);
    setBlackTime(timeControl);
    setIsTimerActive(false);
  };

  // Undo Move
  const undoMove = () => {
    if (isThinking || gameResult) return;
    if (gameMode === 'ai') {
      // Undo both AI move and Player move
      game.undo();
      game.undo();
    } else {
      game.undo();
    }
    const newGame = new Chess(game.fen());
    setGame(newGame);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setMoveHistory((prev) => (gameMode === 'ai' ? prev.slice(0, -2) : prev.slice(0, -1)));
    setGameResult(null);
  };

  // Hint Generator
  const showHint = () => {
    if (isThinking || game.isGameOver()) return;
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return;

    // Pick top evaluation move
    let bestMove = moves[0];
    let bestScore = game.turn() === 'w' ? -Infinity : Infinity;

    for (const move of moves) {
      game.move(move);
      const score = evaluateBoard(game.board());
      game.undo();

      if (game.turn() === 'w') {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    if (bestMove) {
      setHintSquare({ from: bestMove.from as Square, to: bestMove.to as Square });
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
        className={`relative aspect-square flex items-center justify-center cursor-pointer select-none transition-colors ${
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
          <motion.div
            key={`${squareName}-${piece.type}-${piece.color}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="w-[85%] h-[85%] z-10"
          >
            <PieceSVG type={piece.type} color={piece.color} />
          </motion.div>
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
    <section className="py-12 sm:py-16 min-h-screen flex flex-col justify-center relative overflow-hidden">
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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tight">
            Play Chess <span className="text-[#E195AB]">Interactive</span>
          </h1>
        </motion.div>

        {/* Main Controls & Multiplayer Options Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 p-4 rounded-2xl bg-white/80 backdrop-blur-xl border-2 border-[#FFCCE1] shadow-lg flex flex-wrap items-center justify-between gap-4"
        >
          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setGameMode('ai');
                resetGame();
              }}
              className={`px-3 py-1.5 rounded-xl font-sans text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                gameMode === 'ai'
                  ? 'bg-[#E195AB] text-white shadow-md'
                  : 'bg-[#FFF5D7] text-[#E195AB] hover:bg-[#FFCCE1]'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>VS Bot</span>
            </button>
            <button
              onClick={() => {
                setGameMode('pass');
                resetGame();
              }}
              className={`px-3 py-1.5 rounded-xl font-sans text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                gameMode === 'pass'
                  ? 'bg-[#E195AB] text-white shadow-md'
                  : 'bg-[#FFF5D7] text-[#E195AB] hover:bg-[#FFCCE1]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pass & Play</span>
            </button>
            <button
              onClick={() => {
                setGameMode('online');
              }}
              className={`px-3 py-1.5 rounded-xl font-sans text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                gameMode === 'online'
                  ? 'bg-[#E195AB] text-white shadow-md'
                  : 'bg-[#FFF5D7] text-[#E195AB] hover:bg-[#FFCCE1]'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Online Multiplayer</span>
            </button>
          </div>

          {/* Bot Level (If VS Bot) */}
          {gameMode === 'ai' && (
            <div className="flex items-center gap-1.5 bg-[#FFF5D7] p-1 rounded-xl border border-[#FFCCE1]">
              <span className="text-[11px] font-mono text-slate-500 font-bold px-1.5">Bot Level:</span>
              {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                    difficulty === d
                      ? 'bg-[#E195AB] text-white shadow-sm'
                      : 'text-[#E195AB] hover:bg-[#FFCCE1]/50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {/* Side Selector (If VS Bot) */}
          {gameMode === 'ai' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-500 font-bold">Play as:</span>
              <button
                onClick={() => {
                  setPlayerColor('w');
                  resetGame();
                }}
                className={`px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer ${
                  playerColor === 'w'
                    ? 'bg-white border-[#E195AB] text-slate-800 shadow-sm'
                    : 'bg-[#FFF5D7] border-[#FFCCE1] text-slate-500'
                }`}
              >
                ♔ White
              </button>
              <button
                onClick={() => {
                  setPlayerColor('b');
                  resetGame();
                }}
                className={`px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer ${
                  playerColor === 'b'
                    ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                    : 'bg-[#FFF5D7] border-[#FFCCE1] text-slate-500'
                }`}
              >
                ♚ Black
              </button>
            </div>
          )}

          {/* Time Control Selector */}
          <div className="flex items-center gap-1.5 bg-[#FFF5D7] p-1 rounded-xl border border-[#FFCCE1]">
            <Clock className="w-3.5 h-3.5 text-[#E195AB] ml-1" />
            <span className="text-[11px] font-mono text-slate-500 font-bold pr-1">Timer:</span>
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
                    : 'text-slate-600 hover:bg-[#FFCCE1]/50'
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
                    : 'bg-[#FFF5D7] text-[#E195AB] border-[#FFCCE1]'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoFlip ? 'animate-spin-slow' : ''}`} />
                <span>Auto-Flip: {autoFlip ? 'ON' : 'OFF'}</span>
              </button>
            )}
            <button
              onClick={showHint}
              title="Get Hint"
              className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              title="Flip Board"
              className="p-2 rounded-xl bg-[#FFF5D7] text-[#E195AB] border border-[#FFCCE1] hover:bg-[#FFCCE1] transition-colors cursor-pointer"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title="Toggle Audio"
              className="p-2 rounded-xl bg-[#FFF5D7] text-[#E195AB] border border-[#FFCCE1] hover:bg-[#FFCCE1] transition-colors cursor-pointer"
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
            onCreateRoom={(opts) => socket?.emit('create_room', { player: playerProfile, ...opts })}
            onJoinRoom={(code) => socket?.emit('join_room', { roomId: code, player: playerProfile })}
            onQuickMatch={() => socket?.emit('quick_match', { player: playerProfile })}
            onLeaveRoom={() => {
              if (activeRoom) {
                socket?.emit('leave_room', { roomId: activeRoom.roomId });
              }
              setActiveRoom(null);
              setYourSide(null);
            }}
            onSendChat={(text) => {
              if (activeRoom) {
                socket?.emit('send_chat', { roomId: activeRoom.roomId, text });
              }
            }}
          />
        )}

        {/* Turn Indicator Banner */}
        <div className="w-full max-w-[560px] mx-auto mb-3 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-[#FFCCE1] shadow-sm flex items-center justify-between text-xs font-bold text-slate-800">
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
                : game.turn() === playerColor
                ? ' (You)'
                : ' (Bot)'}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            {gameMode === 'pass' ? (
              <span className="px-2 py-0.5 rounded-md bg-[#FFF5D7] text-[#E195AB] font-bold">
                Local Pass & Play
              </span>
            ) : gameMode === 'online' ? (
              <span className="px-2 py-0.5 rounded-md bg-[#FFF5D7] text-[#E195AB] font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Global Online
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-[#FFF5D7] text-[#E195AB] font-bold">
                VS Bot ({difficulty})
              </span>
            )}
          </div>
        </div>

        {/* Main Chess Layout (Board + Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Board & Player Info */}
          <div className="lg:col-span-8 flex flex-col items-center">
            
            {/* Top Player Card (Black or Opponent) */}
            <div className="w-full max-w-[560px] mb-3 p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-[#FFCCE1] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {gameMode === 'online' && activeRoom ? (
                    <span className="text-base">
                      {isFlipped
                        ? activeRoom.whitePlayer?.flag || '⚪'
                        : activeRoom.blackPlayer?.flag || '⚫'}
                    </span>
                  ) : gameMode === 'ai' ? (
                    playerColor === 'w' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>
                      {gameMode === 'online' && activeRoom
                        ? isFlipped
                          ? activeRoom.whitePlayer?.name || 'Waiting for White...'
                          : activeRoom.blackPlayer?.name || 'Waiting for Black...'
                        : gameMode === 'ai'
                        ? playerColor === 'w'
                          ? `Bot (${difficulty})`
                          : 'You'
                        : isFlipped
                        ? 'Player 1 (White)'
                        : 'Player 2 (Black)'}
                    </span>
                    {game.turn() === (isFlipped ? 'w' : 'b') && !game.isGameOver() && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </div>
                  {/* Captured pieces */}
                  <div className="flex items-center gap-1 mt-0.5 min-h-[16px]">
                    {(isFlipped ? capturedByWhite : capturedByBlack).map((t, idx) => (
                      <span key={idx} className="w-4 h-4 opacity-90 inline-block">
                        <PieceSVG type={t} color={isFlipped ? 'b' : 'w'} />
                      </span>
                    ))}
                    {(isFlipped ? whiteAdvantage : blackAdvantage) > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 ml-1">
                        +{(isFlipped ? whiteAdvantage : blackAdvantage)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Player Timer */}
              {timeControl > 0 && (
                <div
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 ${
                    game.turn() === (isFlipped ? 'w' : 'b') && (isTimerActive || gameMode === 'online')
                      ? 'bg-rose-500 text-white shadow-md animate-pulse'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(isFlipped ? whiteTime : blackTime)}</span>
                </div>
              )}
            </div>

            {/* Chess Board Frame */}
            <div className="relative w-full max-w-[560px] aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-[#FFCCE1] bg-white gpu-smooth">
              <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
                {Array.from({ length: 8 }).map((_, r) =>
                  Array.from({ length: 8 }).map((_, c) => renderSquare(r, c))
                )}
              </div>

              {/* Thinking Overlay */}
              <AnimatePresence>
                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] flex items-center justify-center z-30"
                  >
                    <div className="px-5 py-2.5 rounded-2xl bg-white/90 border border-[#FFCCE1] shadow-2xl flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-[#E195AB] border-t-transparent rounded-full animate-spin" />
                      <span className="font-sans font-bold text-xs text-slate-800">
                        Bot is thinking...
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Player Card (White or You) */}
            <div className="w-full max-w-[560px] mt-3 p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-[#FFCCE1] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFF5D7] border border-[#FFCCE1] text-[#E195AB] flex items-center justify-center font-bold text-sm shadow-sm">
                  {gameMode === 'online' && activeRoom ? (
                    <span className="text-base">
                      {isFlipped
                        ? activeRoom.blackPlayer?.flag || '⚫'
                        : activeRoom.whitePlayer?.flag || '⚪'}
                    </span>
                  ) : gameMode === 'ai' ? (
                    playerColor === 'w' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>
                      {gameMode === 'online' && activeRoom
                        ? isFlipped
                          ? activeRoom.blackPlayer?.name || 'Waiting for Black...'
                          : activeRoom.whitePlayer?.name || 'Waiting for White...'
                        : gameMode === 'ai'
                        ? playerColor === 'w'
                          ? 'You'
                          : `Bot (${difficulty})`
                        : isFlipped
                        ? 'Player 2 (Black)'
                        : 'Player 1 (White)'}
                    </span>
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
                      <span className="text-[10px] font-mono font-bold text-emerald-600 ml-1">
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
                      : 'bg-slate-100 text-slate-700'
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
            <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border-2 border-[#FFCCE1] shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#FFCCE1]">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#E195AB]" />
                  <span className="font-bold text-xs uppercase tracking-wide text-slate-800">
                    Game Status
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                    game.inCheck()
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-[#FFF5D7] text-[#E195AB]'
                  }`}
                >
                  {game.inCheck()
                    ? 'CHECK!'
                    : `${game.turn() === 'w' ? 'White' : 'Black'}'s Turn`}
                </span>
              </div>

              {/* Buttons Cluster */}
              {gameMode === 'online' ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      if (activeRoom) {
                        socket?.emit('resign_game', { roomId: activeRoom.roomId });
                      }
                    }}
                    disabled={!activeRoom || game.isGameOver()}
                    className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Resign</span>
                  </button>

                  <button
                    onClick={() => {
                      if (activeRoom) {
                        socket?.emit('offer_draw', { roomId: activeRoom.roomId });
                      }
                    }}
                    disabled={!activeRoom || game.isGameOver()}
                    className="px-3 py-2 rounded-xl bg-[#FFF5D7] border border-[#FFCCE1] text-[#E195AB] text-xs font-bold hover:bg-[#FFCCE1] disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Handshake className="w-3.5 h-3.5" />
                    <span>Offer Draw</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={undoMove}
                    disabled={moveHistory.length === 0 || isThinking}
                    className="px-3 py-2 rounded-xl border border-[#FFCCE1] bg-[#FFF5D7] text-[#E195AB] text-xs font-bold hover:bg-[#FFCCE1] disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>
                  <button
                    onClick={resetGame}
                    className="px-3 py-2 rounded-xl bg-[#E195AB] text-white text-xs font-bold hover:bg-[#FFCCE1] hover:text-[#E195AB] transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>New Game</span>
                  </button>
                </div>
              )}
            </div>

            {/* Move History Log Panel */}
            <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border-2 border-[#FFCCE1] shadow-lg flex flex-col h-[280px]">
              <div className="flex items-center justify-between pb-3 border-b border-[#FFCCE1] mb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#E195AB]" />
                  <span className="font-bold text-xs uppercase tracking-wide text-slate-800">
                    Move Log ({moveHistory.length})
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 font-mono text-xs">
                {moveHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 italic text-[11px]">
                    No moves played yet.
                  </div>
                ) : (
                  Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, idx) => {
                    const whiteMove = moveHistory[idx * 2];
                    const blackMove = moveHistory[idx * 2 + 1];
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-7 items-center p-1.5 rounded-lg bg-[#FFF5D7]/60 border border-[#FFCCE1]/50 text-slate-700"
                      >
                        <span className="col-span-1 text-slate-400 font-bold">{idx + 1}.</span>
                        <span className="col-span-3 font-semibold text-slate-800">
                          {whiteMove ? whiteMove.san : ''}
                        </span>
                        <span className="col-span-3 font-semibold text-slate-600">
                          {blackMove ? blackMove.san : ''}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Promotion Dialog Modal */}
        <AnimatePresence>
          {promotionPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl border-2 border-[#FFCCE1] p-6 shadow-2xl max-w-sm w-full text-center space-y-4"
              >
                <h3 className="font-sans font-bold text-lg text-slate-800">
                  Promote Pawn
                </h3>
                <p className="text-xs text-slate-500">
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
                      className="p-3 rounded-2xl bg-[#FFF5D7] border border-[#FFCCE1] hover:border-[#E195AB] hover:bg-[#FFCCE1] transition-all flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <div className="w-8 h-8">
                        <PieceSVG type={item.type} color={game.turn()} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">{item.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Result Modal */}
        <AnimatePresence>
          {gameResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl border-2 border-[#FFCCE1] p-6 sm:p-8 shadow-2xl max-w-md w-full text-center space-y-5"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF5D7] border-2 border-[#FFCCE1] flex items-center justify-center text-[#E195AB]">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-sans font-extrabold text-2xl text-slate-800">
                    Game Over
                  </h3>
                  <p className="text-base font-bold text-[#E195AB]">
                    {gameResult}
                  </p>
                </div>
                <div className="pt-3 flex gap-3">
                  <button
                    onClick={resetGame}
                    className="w-full py-3 rounded-2xl bg-[#E195AB] text-white font-bold text-sm hover:bg-[#FFCCE1] hover:text-[#E195AB] transition-all shadow-md cursor-pointer"
                  >
                    Play Again
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
};
