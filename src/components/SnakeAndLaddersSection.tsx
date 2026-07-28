import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, Trophy, Users, Plus, ChevronLeft, Settings, Copy, Check, UsersRound, Send, RotateCcw, User, ArrowRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const BOARD_SIZE = 10;
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

const SNAKES_AND_LADDERS: Record<number, number> = {
  // Ladders
  4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91,
  // Snakes
  17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78
};

const getCellCoords = (cell: number) => {
  const zeroBased = cell - 1;
  const row = Math.floor(zeroBased / BOARD_SIZE);
  const col = row % 2 === 0 ? zeroBased % BOARD_SIZE : (BOARD_SIZE - 1) - (zeroBased % BOARD_SIZE);
  return { row, col };
};

const getCellPercent = (cell: number) => {
  const { row, col } = getCellCoords(cell);
  const x = (col * 10) + 5;
  const y = 100 - ((row * 10) + 5);
  return { x, y };
};

interface SNLPlayerInfo {
  id: string; // generated uuid
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

export const SnakeAndLaddersSection: React.FC = () => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [room, setRoom] = useState<SNLRoomState | null>(null);
  
  // Setup state
  const availableColors = ['#E195AB', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
  const [myId] = useState(() => Math.random().toString(36).substring(2, 10)); // Unique ID for this client
  const [playerName, setPlayerName] = useState('Player ' + Math.floor(Math.random() * 100));
  const [playerColor, setPlayerColor] = useState(availableColors[0]);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [setupMode, setSetupMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isHost, setIsHost] = useState(false);
  
  // Game state
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  
  // References to handle host logic
  const roomRef = useRef<SNLRoomState | null>(null);
  roomRef.current = room;

  // Sync room state when we are host
  const broadcastState = (stateToBroadcast: SNLRoomState) => {
    if (channel && stateToBroadcast.hostId === myId) {
      channel.send({
        type: 'broadcast',
        event: 'sync_state',
        payload: stateToBroadcast,
      });
    }
  };

  const initChannel = (roomId: string, hosting: boolean) => {
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-supabase-project')) {
       setErrorMsg('Multiplayer credentials not configured in Settings.');
       return null;
    }

    const newChannel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { ack: false },
        presence: { key: myId }
      }
    });

    newChannel
      .on('broadcast', { event: 'sync_state' }, ({ payload }) => {
        setRoom(payload);
        if (payload.winnerId) setIsRolling(false);
      })
      .on('broadcast', { event: 'join_request' }, ({ payload }) => {
        if (hosting && roomRef.current) {
          const currentRoom = { ...roomRef.current };
          if (currentRoom.players.length < 4 && !currentRoom.isStarted && !currentRoom.players.find(p => p.id === payload.id)) {
            currentRoom.players.push(payload);
            currentRoom.logs.push(`${payload.name} joined the room.`);
            setRoom(currentRoom);
            // Must use new state for broadcast
            if (newChannel) {
              newChannel.send({ type: 'broadcast', event: 'sync_state', payload: currentRoom });
            }
          }
        }
      })
      .on('broadcast', { event: 'action_roll' }, ({ payload }) => {
        // Anyone can receive the roll animation
        handleRemoteRoll(payload.roll, payload.playerId, newChannel, hosting);
      })
      .on('broadcast', { event: 'leave_request' }, ({ payload }) => {
        if (hosting && roomRef.current) {
           const currentRoom = { ...roomRef.current };
           const idx = currentRoom.players.findIndex(p => p.id === payload.id);
           if (idx !== -1) {
             const leaver = currentRoom.players[idx];
             currentRoom.players.splice(idx, 1);
             currentRoom.logs.push(`${leaver.name} left the room.`);
             if (currentRoom.isStarted && currentRoom.currentPlayerIndex >= currentRoom.players.length) {
                currentRoom.currentPlayerIndex = 0;
             }
             setRoom(currentRoom);
             if (newChannel) newChannel.send({ type: 'broadcast', event: 'sync_state', payload: currentRoom });
           }
        }
      });

    newChannel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        if (hosting) {
          // Send initial state
          const initialState: SNLRoomState = {
            roomId,
            hostId: myId,
            players: [{ id: myId, name: playerName, color: playerColor, position: 1 }],
            isStarted: false,
            currentPlayerIndex: 0,
            winnerId: null,
            logs: ['Room created. Waiting for players...']
          };
          setRoom(initialState);
          // Wait a tick before broadcasting
          setTimeout(() => {
             newChannel.send({ type: 'broadcast', event: 'sync_state', payload: initialState });
          }, 500);
        } else {
          // Send join request
          newChannel.send({
            type: 'broadcast',
            event: 'join_request',
            payload: { id: myId, name: playerName, color: playerColor, position: 1 }
          });
          
          // Timeout if no response is received
          setTimeout(() => {
            if (!roomRef.current) {
              supabase.removeChannel(newChannel);
              setChannel(null);
              setSetupMode('menu');
              setErrorMsg('Room not found or invalid code.');
            }
          }, 3000);
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
        supabase.removeChannel(newChannel);
        setChannel(null);
        setSetupMode('menu');
        setErrorMsg('Failed to connect to room.');
      }
    });

    setChannel(newChannel);
    return newChannel;
  };

  const handleCreateRoom = () => {
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-supabase-project')) {
       setErrorMsg('Please configure Multiplayer Secrets first.');
       return;
    }
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setIsHost(true);
    setSetupMode('create');
    initChannel(newRoomId, true);
  };

  const handleJoinRoom = () => {
    if (!joinRoomId) return;
    setIsHost(false);
    initChannel(joinRoomId.toUpperCase(), false);
    setSetupMode('create'); // Go to lobby waiting
  };

  const handleStartGame = () => {
    if (isHost && room && channel && room.players.length > 1) {
      const newRoom = { ...room, isStarted: true, logs: [...room.logs, 'Game started!'] };
      setRoom(newRoom);
      broadcastState(newRoom);
    }
  };

  const handleResetGame = () => {
    if (isHost && room && channel) {
      const newRoom = { 
        ...room, 
        isStarted: false, 
        winnerId: null, 
        currentPlayerIndex: 0,
        players: room.players.map(p => ({ ...p, position: 1 })),
        logs: ['Game reset by host. Ready to start again.']
      };
      setRoom(newRoom);
      broadcastState(newRoom);
    }
  };

  const handleLeaveRoom = () => {
    if (channel) {
      if (!isHost) {
        channel.send({ type: 'broadcast', event: 'leave_request', payload: { id: myId } });
      }
      supabase.removeChannel(channel);
      setChannel(null);
    }
    setRoom(null);
    setSetupMode('menu');
    setIsHost(false);
    setErrorMsg('');
  };

  const handleRoll = () => {
    if (isRolling || !room || room.winnerId || !channel) return;
    const currentPlayer = room.players[room.currentPlayerIndex];
    if (currentPlayer.id !== myId) return; // Not my turn
    
    setIsRolling(true);
    const roll = Math.floor(Math.random() * 6) + 1;
    channel.send({
      type: 'broadcast',
      event: 'action_roll',
      payload: { roll, playerId: myId }
    });
    handleRemoteRoll(roll, myId, channel, isHost); // Apply locally as well
  };

  const handleRemoteRoll = (roll: number, rollingPlayerId: string, currentChannel: RealtimeChannel, hosting: boolean) => {
    setIsRolling(true);
    setDiceValue(null);
    
    let rolls = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls >= 10) {
        clearInterval(rollInterval);
        setDiceValue(roll);
        setTimeout(() => {
          if (hosting) {
            processTurnHost(roll, currentChannel); 
          }
          setIsRolling(false);
        }, 500);
      }
    }, 100);
  };

  const processTurnHost = (roll: number, currentChannel: RealtimeChannel) => {
    if (!roomRef.current) return;
    const currentRoom = { ...roomRef.current };
    const currentPlayer = currentRoom.players[currentRoom.currentPlayerIndex];
    let newPos = currentPlayer.position + roll;
    
    if (newPos > TOTAL_CELLS) {
      newPos = TOTAL_CELLS - (newPos - TOTAL_CELLS);
      currentRoom.logs.push(`${currentPlayer.name} rolled ${roll} but bounced back to ${newPos}`);
    } else {
      currentRoom.logs.push(`${currentPlayer.name} rolled ${roll} and moved to ${newPos}`);
    }

    if (SNAKES_AND_LADDERS[newPos]) {
      const dest = SNAKES_AND_LADDERS[newPos];
      const isLadder = dest > newPos;
      setTimeout(() => {
        if (!roomRef.current) return;
        const delayedRoom = { ...roomRef.current };
        delayedRoom.players[delayedRoom.currentPlayerIndex].position = dest;
        delayedRoom.logs.push(`${currentPlayer.name} hit a ${isLadder ? 'ladder' : 'snake'}! Moved to ${dest}`);
        
        if (dest === TOTAL_CELLS) {
          delayedRoom.winnerId = currentPlayer.id;
          delayedRoom.logs.push(`${currentPlayer.name} wins!`);
        } else {
          delayedRoom.currentPlayerIndex = (delayedRoom.currentPlayerIndex + 1) % delayedRoom.players.length;
        }
        setRoom(delayedRoom);
        currentChannel.send({ type: 'broadcast', event: 'sync_state', payload: delayedRoom });
      }, 800);
    } else {
      currentRoom.players[currentRoom.currentPlayerIndex].position = newPos;
      if (newPos === TOTAL_CELLS) {
        currentRoom.winnerId = currentPlayer.id;
        currentRoom.logs.push(`${currentPlayer.name} wins!`);
      } else {
        currentRoom.currentPlayerIndex = (currentRoom.currentPlayerIndex + 1) % currentRoom.players.length;
      }
    }
    
    setRoom(currentRoom);
    currentChannel.send({ type: 'broadcast', event: 'sync_state', payload: currentRoom });
  };

  const copyRoomId = () => {
    if (room) {
      navigator.clipboard.writeText(room.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate board cells
  const cells = [];
  for (let r = BOARD_SIZE - 1; r >= 0; r--) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cellNum = r % 2 === 0 ? (r * BOARD_SIZE) + c + 1 : (r * BOARD_SIZE) + (BOARD_SIZE - c);
      cells.push(cellNum);
    }
  }

  const renderLobbyMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-white rounded-3xl p-8 border-2 border-[#FFCCE1] shadow-xl relative"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#FFF5D7] rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-[#FFCCE1]">
          <UsersRound className="w-8 h-8 text-[#E195AB]" />
        </div>
        <h3 className="text-2xl font-black text-slate-800">Multiplayer Setup</h3>
        <p className="text-slate-500 font-medium mt-2">Play online with friends!</p>
      </div>
      
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-semibold text-center">
          {errorMsg}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
          <input
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#E195AB] focus:ring-4 focus:ring-[#E195AB]/20 outline-none transition-all font-bold text-slate-700"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Your Color</label>
          <div className="flex gap-2">
            {availableColors.map(c => (
              <button
                key={c}
                onClick={() => setPlayerColor(c)}
                className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${playerColor === c ? 'scale-110 shadow-md ring-2 ring-offset-2' : 'hover:scale-105'}`}
                style={{ backgroundColor: c, ringColor: c }}
              >
                {playerColor === c && <Check className="w-5 h-5 text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 grid grid-cols-2 gap-4">
          <button
            onClick={handleCreateRoom}
            className="px-4 py-3 rounded-xl bg-[#E195AB] text-white font-bold hover:bg-[#d88299] transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Create Room
          </button>
          <button
            onClick={() => setSetupMode('join')}
            className="px-4 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" /> Join Room
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderCreateRoom = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-md mx-auto bg-white rounded-3xl p-8 border-2 border-[#FFCCE1] shadow-xl"
    >
      <div className="flex items-center gap-4 mb-8">
        <h3 className="text-2xl font-black text-slate-800">Room Lobby</h3>
      </div>

      {!room ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#E195AB] rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-bold">Connecting to server...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 text-center">
            <p className="text-sm font-bold text-slate-500 mb-1">Room Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-black tracking-wider text-slate-800">{room.roomId}</span>
              <button
                onClick={copyRoomId}
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Players ({room.players.length}/4)</h4>
            <div className="space-y-2">
              {room.players.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border-2 border-slate-100">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: p.color }}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">{p.name} {p.id === myId && '(You)'}</div>
                    {p.id === room.hostId && <div className="text-xs font-bold text-[#E195AB]">Host</div>}
                  </div>
                </div>
              ))}
              {room.players.length < 4 && (
                <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                  <div className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="font-medium">Waiting for players...</div>
                </div>
              )}
            </div>
          </div>

          {isHost ? (
            <div className="pt-4 space-y-3">
              <button
                onClick={handleStartGame}
                disabled={room.players.length < 2}
                className="w-full py-4 rounded-xl bg-[#E195AB] text-white font-black text-lg hover:bg-[#d88299] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {room.players.length < 2 ? 'Need more players' : 'Start Game'}
              </button>
              <button
                onClick={handleLeaveRoom}
                className="w-full py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
              >
                Leave Room
              </button>
            </div>
          ) : (
            <div className="pt-4 text-center">
              <p className="text-slate-500 font-medium mb-4 animate-pulse">Waiting for host to start...</p>
              <button
                onClick={handleLeaveRoom}
                className="w-full py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
              >
                Leave Room
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );

  const renderJoinRoom = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-md mx-auto bg-white rounded-3xl p-8 border-2 border-[#FFCCE1] shadow-xl"
    >
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setSetupMode('menu')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-black text-slate-800">Join Room</h3>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Room Code</label>
          <input
            type="text"
            value={joinRoomId}
            onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#E195AB] focus:ring-4 focus:ring-[#E195AB]/20 outline-none transition-all font-bold text-slate-800 uppercase tracking-widest text-center text-xl"
            placeholder="XXXXXX"
            maxLength={6}
          />
        </div>

        <button
          onClick={handleJoinRoom}
          disabled={joinRoomId.length < 4}
          className="w-full py-4 rounded-xl bg-slate-800 text-white font-bold text-lg hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          Join Game <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );

  const getWinner = () => {
    if (!room || !room.winnerId) return null;
    return room.players.find(p => p.id === room.winnerId) || null;
  };

  const winner = getWinner();
  const currentPlayer = room?.players[room?.currentPlayerIndex ?? 0];
  const isMyTurn = currentPlayer?.id === myId;

  return (
    <section className="py-12 sm:py-16 min-h-screen flex flex-col justify-center relative overflow-hidden bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-[#FFF5D7] border border-[#FFCCE1] text-[#E195AB] font-bold text-sm mb-4">
            <Trophy className="w-4 h-4" /> Online Multiplayer
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
            Snakes & <span className="text-[#E195AB]">Ladders</span>
          </h2>
        </motion.div>
        
        {!room?.isStarted ? (
          setupMode === 'menu' ? renderLobbyMenu() : setupMode === 'create' ? renderCreateRoom() : renderJoinRoom()
        ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
          {/* Game Board */}
          <div className="xl:col-span-2 bg-white p-4 sm:p-8 rounded-[2.5rem] shadow-2xl border-4 border-[#FFCCE1] relative">
            <div 
              ref={boardRef}
              className="aspect-square relative rounded-2xl overflow-hidden border-4 border-slate-800 bg-[#FFF5D7]"
              style={{
                backgroundImage: 'radial-gradient(#FFCCE1 20%, transparent 20%)',
                backgroundSize: '20px 20px'
              }}
            >
              <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
                {cells.map((cellNum) => {
                  const { row, col } = getCellCoords(cellNum);
                  const isEven = (row + col) % 2 === 0;
                  return (
                    <div 
                      key={cellNum}
                      className={`relative flex items-center justify-center font-black text-lg sm:text-xl ${
                        isEven ? 'bg-white/40' : 'bg-[#E195AB]/10'
                      } border border-slate-800/10`}
                    >
                      <span className="absolute top-1 left-1.5 text-xs font-bold opacity-40">{cellNum}</span>
                    </div>
                  );
                })}
              </div>

              {/* Render Snakes & Ladders */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
                {Object.entries(SNAKES_AND_LADDERS).map(([start, end], idx) => {
                  const s = parseInt(start);
                  const startPos = getCellPercent(s);
                  const endPos = getCellPercent(end);
                  const isLadder = end > s;
                  
                  return (
                    <g key={idx}>
                      {/* Thicker background glow for better visibility */}
                      <line
                        x1={`${startPos.x}%`}
                        y1={`${startPos.y}%`}
                        x2={`${endPos.x}%`}
                        y2={`${endPos.y}%`}
                        stroke={isLadder ? "#10b981" : "#ef4444"}
                        strokeWidth={isLadder ? "14" : "10"}
                        strokeLinecap="round"
                        opacity="0.25"
                      />
                      {/* Foreground detailed line */}
                      <line
                        x1={`${startPos.x}%`}
                        y1={`${startPos.y}%`}
                        x2={`${endPos.x}%`}
                        y2={`${endPos.y}%`}
                        stroke={isLadder ? "#10b981" : "#ef4444"}
                        strokeWidth={isLadder ? "6" : "6"}
                        strokeDasharray={isLadder ? "12 8" : "none"}
                        strokeLinecap="round"
                        opacity="0.95"
                      />
                      <circle cx={`${startPos.x}%`} cy={`${startPos.y}%`} r="6" fill={isLadder ? "#10b981" : "#ef4444"} stroke="#ffffff" strokeWidth="2" opacity="1" />
                      <circle cx={`${endPos.x}%`} cy={`${endPos.y}%`} r="6" fill={isLadder ? "#10b981" : "#ef4444"} stroke="#ffffff" strokeWidth="2" opacity="1" />
                    </g>
                  );
                })}
              </svg>

              {/* Render Players */}
              {room.players.map((p, idx) => {
                const pos = getCellPercent(p.position);
                const offset = (idx * 4) - ((room.players.length * 4) / 2);
                
                return (
                  <motion.div
                    key={p.id}
                    className="absolute w-8 h-8 sm:w-10 sm:h-10 -ml-4 -mt-4 sm:-ml-5 sm:-mt-5 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white z-20"
                    style={{ backgroundColor: p.color }}
                    animate={{ 
                      left: `${pos.x}%`, 
                      top: `${pos.y}%`,
                      x: offset,
                      y: offset,
                      scale: idx === room.currentPlayerIndex ? 1.15 : 1
                    }}
                    transition={{ 
                      duration: 0.5, 
                      type: "spring"
                    }}
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Controls & Log */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#FFCCE1] shadow-xl relative overflow-hidden">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFF5D7] flex items-center justify-center mb-6 shadow-inner border-2 border-[#FFCCE1] relative">
                  {diceValue ? (
                    <motion.div
                      key={diceValue}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-4xl font-black text-[#E195AB]"
                    >
                      {diceValue}
                    </motion.div>
                  ) : (
                    <Dices className={`w-10 h-10 text-[#E195AB] ${isRolling ? 'animate-spin' : ''}`} />
                  )}
                </div>
                
                <button
                  onClick={handleRoll}
                  disabled={isRolling || winner !== null || !isMyTurn}
                  className="w-full py-4 rounded-xl bg-[#E195AB] text-white font-extrabold text-lg hover:bg-[#d88299] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all shadow-md relative overflow-hidden group"
                >
                  <span className="relative z-10">
                    {isRolling ? 'Rolling...' : isMyTurn ? 'Roll Dice!' : `Waiting for ${currentPlayer?.name}...`}
                  </span>
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Players</h4>
                {room.players.map((p, idx) => (
                  <div 
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                      idx === room.currentPlayerIndex 
                        ? 'border-[#E195AB] bg-[#FFF5D7]' 
                        : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: p.color }}>
                        <User className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-sm text-slate-800">{p.name} {p.id === myId && '(You)'}</div>
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-500">
                      Cell {p.position}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border-2 border-[#FFCCE1] shadow-xl">
               <div className="flex items-center justify-between mb-4">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Game Log</h4>
                 <div className="text-xs font-bold text-slate-400">Room: {room.roomId}</div>
               </div>
               <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                 <AnimatePresence>
                   {[...room.logs].reverse().map((log, i) => (
                     <motion.div
                       key={i + log}
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       className="text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                     >
                       {log}
                     </motion.div>
                   ))}
                 </AnimatePresence>
               </div>
            </div>
            
            <button
                onClick={handleLeaveRoom}
                className="w-full py-3 rounded-xl bg-white text-slate-600 font-bold hover:bg-slate-50 border-2 border-slate-200 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                Leave Game
            </button>
          </div>
        </div>
        )}
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/80"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-sm p-8 rounded-3xl bg-white shadow-2xl border-2 border-[#FFCCE1] text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-[#FFF5D7] flex items-center justify-center mb-6 border-4 border-[#E195AB] shadow-inner text-white" style={{ backgroundColor: winner.color }}>
                  <Trophy className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-slate-800 mb-2">Winner!</h3>
                <p className="text-lg font-bold text-slate-600 mb-8">
                  <span style={{ color: winner.color }}>{winner.name}</span> has reached cell 100!
                </p>
                {isHost && (
                  <button
                    onClick={handleResetGame}
                    className="w-full py-4 rounded-xl bg-[#E195AB] text-white font-extrabold text-lg hover:bg-[#d88299] hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 mb-3"
                  >
                    <RotateCcw className="w-5 h-5" /> Play Again
                  </button>
                )}
                <button
                  onClick={handleLeaveRoom}
                  className="w-full py-4 rounded-xl bg-white text-slate-700 font-bold text-lg hover:bg-slate-50 border-2 border-slate-200 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Settings className="w-5 h-5" /> Leave Room
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
};
