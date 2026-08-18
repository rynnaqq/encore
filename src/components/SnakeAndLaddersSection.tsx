import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, Plus, ChevronLeft, Copy, Check, UsersRound, Send, User, ArrowRight, Sparkles } from 'lucide-react';
import { createPortal } from 'react-dom';
import { getSupabaseClient } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '../context/AuthContext';
import { AdminBadge, isAdminName, DeveloperBadge, isDeveloperName } from './AdminBadge';
import { VictoryModal } from './VictoryModal';

const BOARD_SIZE = 10;
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

const SNAKES_AND_LADDERS: Record<number, number> = {
  // Ladders
  3: 21, 7: 30, 28: 84, 58: 77, 75: 86, 80: 100, 90: 91,
  // Snakes
  17: 12, 62: 22, 57: 40, 88: 18, 52: 29, 95: 51, 97: 79
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
  const { currentUser, openLoginModal } = useAuth();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [room, setRoom] = useState<SNLRoomState | null>(null);
  
  // Setup state
  const availableColors = ['#E195AB', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
  const [myId] = useState(() => {
    return `snl_p_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  });
  const [playerName, setPlayerName] = useState(() => currentUser ? currentUser.username : 'Player ' + Math.floor(Math.random() * 100));

  useEffect(() => {
    if (currentUser?.username) {
      setPlayerName(currentUser.username);
    }
  }, [currentUser]);
  const [playerColor, setPlayerColor] = useState(availableColors[0]);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [setupMode, setSetupMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const effectiveIsHost = room ? room.hostId === myId : isHost;
  
  // Game state
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  
  // References to handle host logic
  const roomRef = useRef<SNLRoomState | null>(null);
  const leaveTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  roomRef.current = room;

  // Cache room state
  useEffect(() => {
    if (room && typeof window !== 'undefined') {
      sessionStorage.setItem('snl_saved_state_' + room.roomId, JSON.stringify(room));
    }
  }, [room]);

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

  const initChannel = (roomId: string, hosting: boolean, initialHostState?: SNLRoomState) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
       setErrorMsg('Multiplayer credentials not configured in Settings.');
       setIsConnecting(false);
       return null;
    }

    const newChannel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { ack: false, self: true },
        presence: { key: myId }
      }
    });

    newChannel
      .on('broadcast', { event: 'sync_state' }, ({ payload }) => {
        setIsConnecting(false);
        setRoom(payload);
        if (payload.winnerId) setIsRolling(false);
        if (payload.hostId === myId) setIsHost(true);
      })
      .on('broadcast', { event: 'join_request' }, ({ payload }) => {
        if (roomRef.current && (roomRef.current.hostId === myId || isHost)) {
          const currentRoom = { ...roomRef.current };
          const existingPlayer = currentRoom.players.find(p => p.id === payload.id);
          if (existingPlayer) {
            // Reconnecting player!
            existingPlayer.name = payload.name;
            existingPlayer.color = payload.color || existingPlayer.color;
            setRoom(currentRoom);
            if (newChannel) {
              newChannel.send({ type: 'broadcast', event: 'sync_state', payload: currentRoom });
            }
          } else if (currentRoom.players.length < 4 && !currentRoom.isStarted) {
            currentRoom.players.push(payload);
            currentRoom.logs.push(`${payload.name} joined the room.`);
            setRoom(currentRoom);
            if (newChannel) {
              newChannel.send({ type: 'broadcast', event: 'sync_state', payload: currentRoom });
            }
          } else {
            if (newChannel) {
              newChannel.send({ type: 'broadcast', event: 'sync_state', payload: currentRoom });
            }
          }
        }
      })
      .on('broadcast', { event: 'action_roll' }, ({ payload }) => {
        handleRemoteRoll(payload.roll, payload.playerId, newChannel, roomRef.current?.hostId === myId);
      })
      .on('broadcast', { event: 'leave_request' }, ({ payload }) => {
        if (payload && payload.id) {
          if (leaveTimersRef.current[payload.id]) {
            clearTimeout(leaveTimersRef.current[payload.id]);
            delete leaveTimersRef.current[payload.id];
          }
          handlePlayerLeave(payload.id, newChannel);
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((p: any) => {
          const leaverKey = p.key || p.id;
          if (leaverKey && leaverKey !== myId) {
            if (leaveTimersRef.current[leaverKey]) clearTimeout(leaveTimersRef.current[leaverKey]);
            leaveTimersRef.current[leaverKey] = setTimeout(() => {
              handlePlayerLeave(leaverKey, newChannel);
              delete leaveTimersRef.current[leaverKey];
            }, 10000);
          }
        });
      });

    const handlePresenceSync = () => {
      const currentRoom = roomRef.current;
      if (currentRoom && (currentRoom.hostId === myId || isHost) && !currentRoom.isStarted) {
        const pState = newChannel.presenceState();
        let stateChanged = false;
        const updatedRoom = { ...currentRoom, players: [...currentRoom.players] };
        Object.values(pState).forEach((presences: any) => {
          presences.forEach((p: any) => {
            const pId = p.id || p.key;
            const pName = p.name || 'Pemain';
            const pColor = p.color || availableColors[updatedRoom.players.length % availableColors.length];
            if (pId && !updatedRoom.players.some(pl => pl.id === pId) && updatedRoom.players.length < 4) {
              updatedRoom.players.push({
                id: pId,
                name: pName,
                color: pColor,
                position: 1
              });
              stateChanged = true;
            }
          });
        });
        if (stateChanged) {
          setRoom(updatedRoom);
          newChannel.send({ type: 'broadcast', event: 'sync_state', payload: updatedRoom });
        }
      }
    };

    newChannel.on('presence', { event: 'sync' }, handlePresenceSync);
    newChannel.on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach((p: any) => {
        const joinerKey = p.key || p.id;
        if (joinerKey && leaveTimersRef.current[joinerKey]) {
          clearTimeout(leaveTimersRef.current[joinerKey]);
          delete leaveTimersRef.current[joinerKey];
        }
      });
      handlePresenceSync();
    });

    newChannel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        newChannel.track({ key: myId, id: myId, name: playerName, color: playerColor });
        if (hosting) {
          const initialState: SNLRoomState = initialHostState || {
            roomId,
            hostId: myId,
            players: [{ id: myId, name: playerName, color: playerColor, position: 1 }],
            isStarted: false,
            currentPlayerIndex: 0,
            winnerId: null,
            logs: ['Room created. Waiting for players...']
          };
          setRoom(initialState);
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
          
          let retries = 0;
          const retryInterval = setInterval(() => {
            retries++;
            if (roomRef.current && roomRef.current.players.some(p => p.id === myId)) {
              clearInterval(retryInterval);
              setIsConnecting(false);
            } else if (retries >= 5) {
              clearInterval(retryInterval);
              if (!roomRef.current) {
                setIsConnecting(false);
                getSupabaseClient()?.removeChannel(newChannel);
                setChannel(null);
                setErrorMsg('Room tidak ditemukan atau Host sedang offline.');
              }
            } else {
              newChannel.send({
                type: 'broadcast',
                event: 'join_request',
                payload: { id: myId, name: playerName, color: playerColor, position: 1 }
              });
            }
          }, 800);
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
        setIsConnecting(false);
        getSupabaseClient()?.removeChannel(newChannel);
        setChannel(null);
        setErrorMsg('Gagal terhubung ke room.');
      }
    });

    setChannel(newChannel);
    return newChannel;
  };

  const handleCreateRoom = () => {
    if (!currentUser) {
      openLoginModal();
      return;
    }
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-supabase-project')) {
       setErrorMsg('Please configure Multiplayer Secrets first.');
       return;
    }
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setIsHost(true);
    setIsConnecting(false);
    setSetupMode('create');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('snl_active_session', JSON.stringify({ roomId: newRoomId, isHost: true }));
    }
    initChannel(newRoomId, true);
  };

  const handleJoinRoom = () => {
    if (!currentUser) {
      openLoginModal();
      return;
    }
    if (!joinRoomId.trim()) return;
    setIsHost(false);
    setIsConnecting(true);
    setErrorMsg('');
    const targetRoomId = joinRoomId.trim().toUpperCase();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('snl_active_session', JSON.stringify({ roomId: targetRoomId, isHost: false }));
    }
    initChannel(targetRoomId, false);
    setSetupMode('create'); // Go to lobby waiting
  };

  // Auto-reconnect on mount if session saved
  const snlReconnectRef = useRef(false);
  useEffect(() => {
    if (snlReconnectRef.current) return;
    snlReconnectRef.current = true;

    if (typeof window !== 'undefined') {
      const savedSessionStr = sessionStorage.getItem('snl_active_session');
      if (savedSessionStr) {
        try {
          const session = JSON.parse(savedSessionStr);
          if (session && session.roomId) {
            setIsHost(session.isHost);
            setSetupMode('create');
            let savedState: SNLRoomState | undefined = undefined;
            if (session.isHost) {
              const savedStateStr = sessionStorage.getItem('snl_saved_state_' + session.roomId);
              if (savedStateStr) {
                savedState = JSON.parse(savedStateStr);
                setRoom(savedState);
              }
            }
            initChannel(session.roomId, session.isHost, savedState);
          }
        } catch (e) {
          console.error("Failed to restore Snakes & Ladders session", e);
        }
      }
    }
  }, []);

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

  const handlePlayerLeave = (leaverId: string, activeChannel: RealtimeChannel | null) => {
    const currentRoom = roomRef.current;
    if (!currentRoom) return;

    const leaverIndex = currentRoom.players.findIndex(p => p.id === leaverId);
    if (leaverIndex === -1) return;

    const leaver = currentRoom.players[leaverIndex];
    const remainingPlayers = currentRoom.players.filter(p => p.id !== leaverId);

    let newTurnIndex = currentRoom.currentPlayerIndex;
    if (remainingPlayers.length > 0) {
      if (newTurnIndex === leaverIndex) {
        newTurnIndex = leaverIndex % remainingPlayers.length;
      } else if (newTurnIndex > leaverIndex) {
        newTurnIndex = newTurnIndex - 1;
      }
    } else {
      newTurnIndex = 0;
    }

    let winnerId = currentRoom.winnerId;
    if (currentRoom.isStarted && remainingPlayers.length === 1 && !winnerId) {
      winnerId = remainingPlayers[0].id;
    }

    let newHostId = currentRoom.hostId;
    if (currentRoom.hostId === leaverId && remainingPlayers.length > 0) {
      newHostId = remainingPlayers[0].id;
    }

    const updatedRoom: SNLRoomState = {
      ...currentRoom,
      hostId: newHostId,
      players: remainingPlayers,
      currentPlayerIndex: newTurnIndex,
      winnerId,
      logs: [...currentRoom.logs, `${leaver.name} left the room.`]
    };

    setRoom(updatedRoom);

    const amIHostNow = newHostId === myId;
    setIsHost(amIHostNow);

    if (amIHostNow && activeChannel) {
      activeChannel.send({
        type: 'broadcast',
        event: 'sync_state',
        payload: updatedRoom,
      });
    }
  };

  const handleLeaveRoom = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('snl_active_session');
      if (room) sessionStorage.removeItem('snl_saved_state_' + room.roomId);
    }
    if (channel) {
      if (!isHost) {
        channel.send({ type: 'broadcast', event: 'leave_request', payload: { id: myId } });
      }
      getSupabaseClient()?.removeChannel(channel);
      setChannel(null);
    }
    setRoom(null);
    setSetupMode('menu');
    setIsConnecting(false);
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
      className="max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border-2 border-[#FFCCE1] dark:border-slate-800 shadow-xl relative text-center"
    >
      {/* Game Badge */}
      <div className="w-20 h-20 bg-[#E195AB] rounded-2xl flex items-center justify-center mx-auto mb-5 transform -rotate-6 border-4 border-[#FFF5D7] dark:border-slate-800 shadow-lg">
        <Dices className="w-10 h-10 text-[#FFF5D7]" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">Snakes & Ladders Multiplayer</h2>
      <p className="text-slate-600 dark:text-slate-400 text-xs mb-6">Bermain ular tangga bersama teman secara real-time</p>
      
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Nama Pemain</label>
          <input
            type="text"
            value={playerName}
            disabled
            readOnly
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400 cursor-not-allowed outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Pilihan Warna Bidak</label>
          <div className="flex gap-2 justify-center py-1">
            {availableColors.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setPlayerColor(c)}
                className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer ${playerColor === c ? 'scale-110 shadow-md ring-2 ring-offset-2 ring-[#E195AB] dark:ring-offset-slate-900' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
              >
                {playerColor === c && <Check className="w-5 h-5 text-white" />}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreateRoom}
          className="w-full bg-[#E195AB] hover:bg-[#d88299] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md text-sm mt-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Buat Room Baru</span>
        </button>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 font-bold text-xs uppercase tracking-wider">atau</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Kode Room"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-slate-800 dark:text-slate-100 uppercase outline-none focus:border-[#E195AB] text-sm"
            maxLength={6}
          />
          <button
            onClick={handleJoinRoom}
            disabled={joinRoomId.length < 4}
            className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white font-bold px-6 rounded-xl transition-all cursor-pointer text-sm shadow-sm whitespace-nowrap"
          >
            Masuk
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderCreateRoom = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border-2 border-[#FFCCE1] dark:border-slate-800 shadow-2xl text-center"
    >
      <div className="w-16 h-16 bg-[#E195AB] rounded-2xl flex items-center justify-center mx-auto mb-3 transform -rotate-3 border-2 border-white shadow-sm">
        <Dices className="w-8 h-8 text-[#FFF5D7]" />
      </div>
      <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">Lobby Ular Tangga</h3>
      <p className="text-slate-600 dark:text-slate-400 text-xs mb-5 font-medium">Menunggu pemain lain untuk bergabung</p>

      {!room ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-[#E195AB] rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-bold text-xs">Menghubungkan ke room...</p>
          <button
            onClick={handleLeaveRoom}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            Batal
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-[#FFF5D7] dark:bg-slate-800 p-4 rounded-2xl border border-[#FFCCE1] dark:border-slate-700 text-center shadow-sm">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Kode Room</p>
            <div className="flex items-center justify-center gap-2.5">
              <span className="text-3xl font-mono font-black tracking-wider text-[#E195AB] dark:text-[#FFCCE1] select-all">{room.roomId}</span>
              <button
                onClick={copyRoomId}
                className="p-1.5 rounded-lg hover:bg-white/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                title="Salin Kode Room"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-left">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2.5 uppercase tracking-wider">
              Daftar Pemain ({room.players.length}/4)
            </h4>
            <div className="space-y-2">
              {room.players.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-[#FFCCE1]/60 dark:border-slate-800 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs" style={{ backgroundColor: p.color }}>
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
                      <span className="truncate">{p.name} {p.id === myId && '(Anda)'}</span>
                      {isDeveloperName(p.name) && <DeveloperBadge />}{!isDeveloperName(p.name) && isAdminName(p.name) && <AdminBadge />}
                    </div>
                  </div>
                  {p.id === room.hostId && (
                    <span className="text-[10px] font-mono font-bold text-[#E195AB] dark:text-[#FFCCE1] bg-[#FFF5D7] dark:bg-slate-800 border border-[#FFCCE1] dark:border-slate-700 px-2 py-0.5 rounded-md shrink-0">
                      Host
                    </span>
                  )}
                </div>
              ))}
              {room.players.length < 4 && (
                <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                  <div className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="font-medium text-xs">Menunggu pemain lain...</div>
                </div>
              )}
            </div>
          </div>

          {effectiveIsHost ? (
            <div className="pt-2 space-y-2.5">
              {room.players.length >= 2 ? (
                <button
                  onClick={handleStartGame}
                  className="w-full py-3.5 rounded-xl bg-[#E195AB] text-white font-black text-base hover:bg-[#d88299] transition-all cursor-pointer shadow-lg"
                >
                  MULAI PERMAINAN
                </button>
              ) : (
                <p className="text-amber-700 dark:text-amber-300 font-bold bg-[#FFF5D7] dark:bg-slate-800 border border-[#FFCCE1] dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs">
                  Minimal 2 pemain untuk memulai permainan.
                </p>
              )}
              <button
                onClick={handleLeaveRoom}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Keluar dari Room
              </button>
            </div>
          ) : (
            <div className="pt-2 space-y-3 text-center">
              <p className="text-slate-600 dark:text-slate-400 font-bold bg-[#FFF5D7] dark:bg-slate-800 border border-[#FFCCE1] dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs animate-pulse">
                Menunggu host memulai permainan...
              </p>
              <button
                onClick={handleLeaveRoom}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Keluar dari Room
              </button>
            </div>
          )}
        </div>
      )}
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
    <section className="pt-28 sm:pt-32 pb-12 sm:pb-16 min-h-screen flex flex-col justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Snakes & <span className="text-[#E195AB]">Ladders</span>
          </h2>
        </motion.div>
        
        {!room?.isStarted ? (
          !room && !isConnecting ? renderLobbyMenu() : renderCreateRoom()
        ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 items-start max-w-6xl mx-auto">
          {/* Game Board */}
          <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-2.5 sm:p-6 lg:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-2xl border-2 sm:border-4 border-[#FFCCE1] dark:border-slate-800 relative">
            <div 
              ref={boardRef}
              className="aspect-square relative rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-4 border-slate-800 bg-[#FFF5D7] bg-[length:100%_100%] bg-no-repeat"
              style={{ backgroundImage: "url('/board.jpg')" }}
            >
              <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
                {cells.map((cellNum) => {
                  const { row, col } = getCellCoords(cellNum);
                  const isEven = (row + col) % 2 === 0;
                  return (
                    <div 
                      key={cellNum}
                      className="relative flex items-center justify-center"
                    >
                      
                    </div>
                  );
                })}
              </div>

              {/* Render Players */}
              {room.players.map((p, idx) => {
                const pos = getCellPercent(p.position);
                const offset = (idx * 3) - ((room.players.length * 3) / 2);
                
                return (
                  <motion.div
                    key={p.id}
                    className="absolute w-6 h-6 sm:w-8 md:w-10 sm:h-8 md:h-10 -ml-3 -mt-3 sm:-ml-4 sm:-mt-4 md:-ml-5 md:-mt-5 rounded-full flex items-center justify-center text-white shadow-lg border-1.5 sm:border-2 border-white z-20"
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
                    <User className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Controls & Log */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 lg:p-8 border-2 border-[#FFCCE1] dark:border-slate-800 shadow-xl relative overflow-hidden">
              <div className="text-center mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-[#FFF5D7] dark:bg-slate-800 flex items-center justify-center mb-4 sm:mb-6 shadow-inner border-2 border-[#FFCCE1] dark:border-slate-700 relative">
                  {diceValue ? (
                    <motion.div
                      key={diceValue}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-3xl sm:text-4xl font-black text-[#E195AB] dark:text-[#FFCCE1]"
                    >
                      {diceValue}
                    </motion.div>
                  ) : (
                    <Dices className={`w-8 h-8 sm:w-10 sm:h-10 text-[#E195AB] dark:text-[#FFCCE1] ${isRolling ? 'animate-spin' : ''}`} />
                  )}
                </div>
                
                <button
                  onClick={handleRoll}
                  disabled={isRolling || winner !== null || !isMyTurn}
                  className="w-full py-3.5 sm:py-4 rounded-xl bg-[#E195AB] text-white font-extrabold text-base sm:text-lg hover:bg-[#d88299] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all shadow-md relative overflow-hidden group cursor-pointer"
                >
                  <span className="relative z-10">
                    {isRolling ? 'Rolling...' : isMyTurn ? 'Roll Dice!' : `Waiting for ${currentPlayer?.name}...`}
                  </span>
                </button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Players ({room.players.length})</h4>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-transparent dark:border-slate-700">Room: {room.roomId}</div>
                </div>
                {room.players.map((p, idx) => (
                  <div 
                    key={p.id}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border-2 transition-all ${
                      idx === room.currentPlayerIndex 
                        ? 'border-[#E195AB] bg-[#FFF5D7] dark:bg-slate-800' 
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: p.color }}>
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
                        <span className="truncate">{p.name} {p.id === myId && '(You)'}</span>
                        {isDeveloperName(p.name) && <DeveloperBadge />}{!isDeveloperName(p.name) && isAdminName(p.name) && <AdminBadge />}
                      </div>
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                      Cell {p.position}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button
                onClick={handleLeaveRoom}
                className="w-full py-3 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Leave Game
            </button>
          </div>
        </div>
        )}
      </div>

      {typeof document !== 'undefined' && createPortal(
        <VictoryModal
          isOpen={!!winner}
          winnerName={winner?.name || ''}
          winnerColor={winner?.color || '#E195AB'}
          subtitle={room && room.players.length === 1 ? 'Menang karena semua pemain lain keluar ruangan!' : 'Berhasil melewati tangga dan mencapai petak 100!'}
          gameTitle="Ular Tangga Multiplayer"
          isHost={isHost}
          onPlayAgain={handleResetGame}
          onLeave={handleLeaveRoom}
          playAgainText="Main Lagi"
          leaveText="Keluar dari Room"
        />,
        document.body
      )}
    </section>
  );
};
