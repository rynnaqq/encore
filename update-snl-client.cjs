const fs = require('fs');
let code = fs.readFileSync('src/components/SnakeAndLaddersSection.tsx', 'utf8');

// replace local state logic with socket logic
const imports = `import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, User, Bot, RotateCcw, Trophy, Users, Plus, X, ChevronLeft, Settings, Copy, Check, UsersRound, Send } from 'lucide-react';
import { createPortal } from 'react-dom';
import { io, Socket } from 'socket.io-client';`;

code = code.replace(/import React.*?from 'react';\nimport \{ motion.*?from 'motion\/react';\nimport \{ Dices.*?from 'lucide-react';\nimport \{ createPortal \} from 'react-dom';/, imports);

// Define types and component logic
const typesStr = `
// Socket types
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
`;

const stateMatch = /export const SnakeAndLaddersSection: React\.FC = \(\) => \{(.|\n)*?const addLog = \(msg: string\) => \{/m;

const stateReplacement = `
${typesStr}

export const SnakeAndLaddersSection: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<SNLRoomState | null>(null);
  
  // Setup state
  const availableColors = ['#E195AB', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
  const [playerName, setPlayerName] = useState('Player ' + Math.floor(Math.random() * 100));
  const [playerColor, setPlayerColor] = useState(availableColors[0]);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [setupMode, setSetupMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [copied, setCopied] = useState(false);
  
  // Game state
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io({
      transports: ['websocket', 'polling'],
      reconnectionDelayMax: 10000,
    });
    setSocket(newSocket);

    newSocket.on('snl_room_created', (newRoom: SNLRoomState) => {
      setRoom(newRoom);
      setSetupMode('create');
    });

    newSocket.on('snl_room_updated', (updatedRoom: SNLRoomState) => {
      setRoom(updatedRoom);
    });

    newSocket.on('snl_dice_rolled', (data: { roll: number, playerId: string }) => {
      handleRemoteRoll(data.roll, data.playerId);
    });

    newSocket.on('snl_error', (msg: string) => {
      alert(msg);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleCreateRoom = () => {
    if (socket) {
      socket.emit('snl_create_room', { name: playerName, color: playerColor });
    }
  };

  const handleJoinRoom = () => {
    if (socket && joinRoomId) {
      socket.emit('snl_join_room', { roomId: joinRoomId, name: playerName, color: playerColor });
    }
  };

  const handleStartGame = () => {
    if (socket && room && room.hostId === socket.id) {
      socket.emit('snl_start_game');
    }
  };

  const handleResetGame = () => {
    if (socket && room && room.hostId === socket.id) {
      socket.emit('snl_reset_game');
    }
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('snl_leave_room');
      setRoom(null);
      setSetupMode('menu');
    }
  };

  const nextTurn = () => {
    // Only handled by server
  };

  const handleRoll = () => {
    if (isRolling || !room || room.winnerId) return;
    const currentPlayer = room.players[room.currentPlayerIndex];
    if (currentPlayer.id !== socket?.id) return; // Not my turn
    
    setIsRolling(true);
    socket?.emit('snl_roll_dice');
  };

  const handleRemoteRoll = (roll: number, rollingPlayerId: string) => {
    setIsRolling(true);
    setDiceValue(null);
    
    // Fake roll animation
    let rolls = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls >= 10) {
        clearInterval(rollInterval);
        setDiceValue(roll);
        setTimeout(() => {
          if (socket && socket.id === rollingPlayerId) {
            processMyTurn(roll); // Only the rolling player calculates and sends the result to prevent race conditions
          }
          setIsRolling(false);
        }, 500);
      }
    }, 100);
  };

  const processMyTurn = (roll: number) => {
    if (!room) return;
    const currentPlayer = room.players[room.currentPlayerIndex];
    let newPos = currentPlayer.position + roll;
    let logMessage = '';
    
    if (newPos > TOTAL_CELLS) {
      newPos = TOTAL_CELLS - (newPos - TOTAL_CELLS); // Bounce back
      logMessage = \`\${currentPlayer.name} rolled \${roll} but bounced back to \${newPos}\`;
    } else {
      logMessage = \`\${currentPlayer.name} rolled \${roll} and moved to \${newPos}\`;
    }

    // Check ladders and snakes
    if (SNAKES_AND_LADDERS[newPos]) {
      const isLadder = SNAKES_AND_LADDERS[newPos] > newPos;
      setTimeout(() => {
        const dest = SNAKES_AND_LADDERS[newPos];
        const destMsg = \`\${currentPlayer.name} hit a \${isLadder ? 'ladder' : 'snake'}! Moved to \${dest}\`;
        
        socket?.emit('snl_turn_processed', { newPosition: dest, logMessage: destMsg, isWinner: dest === TOTAL_CELLS });
      }, 800);
    } else {
      socket?.emit('snl_turn_processed', { newPosition: newPos, logMessage, isWinner: newPos === TOTAL_CELLS });
    }
  };

  const copyRoomId = () => {
    if (room) {
      navigator.clipboard.writeText(room.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const addLog = (msg: string) => {`;
code = code.replace(stateMatch, stateReplacement);

// Fix JSX mapping to use room data
// We need to replace all players[...] with room.players
const replaceAllPlayers = () => {
    code = code.replace(/const updatePlayerPos(.|\n)*?\};\n\n/m, '');
    code = code.replace(/useEffect\(\(\) => \{((.|\n)*?)Bot is thinking/g, 'Bot is thinking'); // remove bot logic later
};
replaceAllPlayers();
fs.writeFileSync('src/components/SnakeAndLaddersSection.tsx', code);
