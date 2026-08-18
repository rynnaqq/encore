import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { GameState, Card, Player, Color, generateDeck, isValidPlay } from '../lib/unoLogic';
import { Copy, Play, UserPlus, Users, ArrowRight, MessageSquare, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminBadge, isAdminName, DeveloperBadge, isDeveloperName } from './AdminBadge';
import { VictoryModal } from './VictoryModal';

export const UnoGameSection: React.FC = () => {
  const { currentUser, openLoginModal } = useAuth();
  const [supabase] = useState(() => getSupabaseClient());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  
  const [playerName, setPlayerName] = useState(() => {
    if (currentUser?.username) return currentUser.username;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('username') || '';
    }
    return '';
  });

  useEffect(() => {
    if (currentUser?.username) {
      setPlayerName(currentUser.username);
    }
  }, [currentUser]);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [localPlayerId] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('uno_player_id');
      if (saved) return saved;
      const newId = `p-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('uno_player_id', newId);
      return newId;
    }
    return `p-${Math.random().toString(36).substr(2, 9)}`;
  });
  
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  const [colorPickerVisible, setColorPickerVisible] = useState<{cardId: string} | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Developer PIN state
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('uno_unlocked') === 'true';
    }
    return false;
  });
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Host Only Ref to always have latest state in callbacks
  const stateRef = useRef<GameState | null>(null);
  const leaveTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    stateRef.current = gameState;
    if (gameState && typeof window !== 'undefined') {
      sessionStorage.setItem('uno_saved_state_' + gameState.roomId, JSON.stringify(gameState));
    }
  }, [gameState]);

  // Interactive UNO Button State & Timers
  const unoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [unoButton, setUnoButton] = useState<{
    top: number;
    left: number;
    key: number;
  } | null>(null);
  const [unoToast, setUnoToast] = useState<{ message: string; type: 'success' | 'penalty' } | null>(null);

  useEffect(() => {
    return () => {
      if (unoTimerRef.current) {
        clearTimeout(unoTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (channel) supabase?.removeChannel(channel);
    };
  }, [channel, supabase]);

  const broadcastState = (state: GameState, ch?: RealtimeChannel) => {
    const c = ch || channel;
    if (c) {
      c.send({
        type: 'broadcast',
        event: 'SYNC_STATE',
        payload: { state }
      });
    }
  };

  const handlePlayerLeave = (leavingPlayerId: string, activeChannel?: RealtimeChannel | null) => {
    const currentState = stateRef.current;
    if (!currentState) return;

    const leavingIndex = currentState.players.findIndex(p => p.id === leavingPlayerId);
    if (leavingIndex === -1) return; // Already removed

    const remainingPlayers = currentState.players.filter(p => p.id !== leavingPlayerId);
    if (remainingPlayers.length === 0) return;

    const newHostId = currentState.hostId === leavingPlayerId ? remainingPlayers[0].id : currentState.hostId;
    const iAmNewHost = localPlayerId === newHostId;

    if (iAmNewHost) {
      setIsHost(true);
      const state = JSON.parse(JSON.stringify(currentState)) as GameState;
      const pIndex = state.players.findIndex(p => p.id === leavingPlayerId);
      if (pIndex === -1) return;

      const leavingPlayerName = state.players[pIndex].name;
      state.players.splice(pIndex, 1);

      state.hostId = newHostId;
      state.players.forEach(p => {
        p.isHost = (p.id === newHostId);
      });

      if (state.status === 'playing') {
        if (state.players.length <= 1) {
          // Automatic win if only 1 player remains
          state.status = 'finished';
          state.winnerId = state.players[0]?.id || null;
          if (!state.logs) state.logs = [];
          state.logs.push(`${leavingPlayerName} meninggalkan permainan. ${state.players[0]?.name || 'Pemain'} menang otomatis!`);
        } else {
          // Adjust turn for remaining players
          if (pIndex < state.currentTurn) {
            state.currentTurn = (state.currentTurn - 1 + state.players.length) % state.players.length;
          } else if (pIndex === state.currentTurn) {
            state.currentTurn = state.currentTurn % state.players.length;
          } else {
            state.currentTurn = state.currentTurn % state.players.length;
          }
          if (!state.logs) state.logs = [];
          state.logs.push(`${leavingPlayerName} meninggalkan permainan.`);
        }
      } else if (state.status === 'waiting') {
        if (!state.logs) state.logs = [];
        state.logs.push(`${leavingPlayerName} keluar dari room.`);
      }

      setGameState(state);
      stateRef.current = state;
      broadcastState(state, activeChannel || channel || undefined);
    }
  };

  const handleLeaveRoom = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('uno_active_session');
      if (gameState) sessionStorage.removeItem('uno_saved_state_' + gameState.roomId);
    }
    if (channel && gameState) {
      channel.send({
        type: 'broadcast',
        event: 'LEAVE_REQUEST',
        payload: { playerId: localPlayerId }
      });
      supabase?.removeChannel(channel);
    }
    setChannel(null);
    setGameState(null);
    setIsHost(false);
  };

  const handleCreateRoom = () => {
    if (!currentUser) {
      openLoginModal();
      return;
    }
    if (!supabase) return setErrorMsg('Supabase not configured');
    if (!playerName.trim()) return setErrorMsg('Name required');
    
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setIsHost(true);
    
    const initialState: GameState = {
      roomId: newRoomId,
      status: 'waiting',
      players: [{ id: localPlayerId, name: playerName, hand: [], isHost: true }],
      currentTurn: 0,
      direction: 1,
      topCard: null,
      currentColor: null,
      deck: [],
      logs: ['Room created by ' + playerName],
      winnerId: null,
      hostId: localPlayerId
    };
    setGameState(initialState);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('uno_active_session', JSON.stringify({ roomId: newRoomId, isHost: true }));
    }
    joinChannel(newRoomId, initialState);
  };

  const handleJoinRoom = () => {
    if (!currentUser) {
      openLoginModal();
      return;
    }
    if (!supabase) return setErrorMsg('Supabase not configured');
    if (!playerName.trim() || !joinRoomId.trim()) return setErrorMsg('Name and Room ID required');
    setIsHost(false);
    const targetRoomId = joinRoomId.toUpperCase();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('uno_active_session', JSON.stringify({ roomId: targetRoomId, isHost: false }));
    }
    joinChannel(targetRoomId);
  };

  const joinChannel = (roomId: string, initialHostState?: GameState) => {
    if (channel) supabase?.removeChannel(channel);
    const newChannel = supabase!.channel(`uno-${roomId}`, {
      config: { 
        broadcast: { self: true },
        presence: { key: localPlayerId }
      }
    });

    newChannel.on('broadcast', { event: 'SYNC_STATE' }, ({ payload }) => {
      setGameState(payload.state);
    });

    newChannel.on('broadcast', { event: 'JOIN_REQUEST' }, ({ payload }) => {
      if (stateRef.current && stateRef.current.hostId === localPlayerId) {
        const state = JSON.parse(JSON.stringify(stateRef.current));
        const existingPlayer = state.players.find((p: Player) => p.id === payload.id);
        if (existingPlayer) {
          // Reconnecting player!
          existingPlayer.name = payload.name;
          setGameState(state);
          stateRef.current = state;
          broadcastState(state, newChannel);
        } else if (state.status === 'waiting' && state.players.length < 4) {
          state.players.push({ id: payload.id, name: payload.name, hand: [], isHost: false });
          setGameState(state);
          stateRef.current = state;
          broadcastState(state, newChannel);
        } else {
          // Send state to reconnecting/spectating client
          broadcastState(state, newChannel);
        }
      }
    });

    newChannel.on('broadcast', { event: 'PLAYER_ACTION' }, ({ payload }) => {
      if (stateRef.current && stateRef.current.hostId === localPlayerId) {
        processAction(payload, newChannel);
      }
    });

    newChannel.on('broadcast', { event: 'LEAVE_REQUEST' }, ({ payload }) => {
      if (payload.playerId) {
        if (leaveTimersRef.current[payload.playerId]) {
          clearTimeout(leaveTimersRef.current[payload.playerId]);
          delete leaveTimersRef.current[payload.playerId];
        }
        handlePlayerLeave(payload.playerId, newChannel);
      }
    });

    newChannel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach((presence: any) => {
        const id = presence.id || presence.key;
        if (id && id !== localPlayerId) {
          if (leaveTimersRef.current[id]) clearTimeout(leaveTimersRef.current[id]);
          leaveTimersRef.current[id] = setTimeout(() => {
            handlePlayerLeave(id, newChannel);
            delete leaveTimersRef.current[id];
          }, 10000);
        }
      });
    });

    newChannel.on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach((presence: any) => {
        const id = presence.id || presence.key;
        if (id && leaveTimersRef.current[id]) {
          clearTimeout(leaveTimersRef.current[id]);
          delete leaveTimersRef.current[id];
        }
      });
    });

    newChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await newChannel.track({ id: localPlayerId, name: playerName });
        if (!initialHostState) {
          // I am a client joining or reconnecting
          newChannel.send({
            type: 'broadcast',
            event: 'JOIN_REQUEST',
            payload: { id: localPlayerId, name: playerName }
          });
        } else {
          // I am host restoring or creating room, broadcast state
          broadcastState(initialHostState, newChannel);
        }
      }
    });

    setChannel(newChannel);
  };

  // Auto-reconnect on mount if session saved
  const unoReconnectRef = useRef(false);
  useEffect(() => {
    if (unoReconnectRef.current) return;
    unoReconnectRef.current = true;

    if (typeof window !== 'undefined' && supabase) {
      const savedSessionStr = sessionStorage.getItem('uno_active_session');
      if (savedSessionStr) {
        try {
          const session = JSON.parse(savedSessionStr);
          if (session && session.roomId) {
            setIsHost(session.isHost);
            let savedState: GameState | undefined = undefined;
            if (session.isHost) {
              const savedStateStr = sessionStorage.getItem('uno_saved_state_' + session.roomId);
              if (savedStateStr) {
                savedState = JSON.parse(savedStateStr);
                setGameState(savedState);
              }
            }
            joinChannel(session.roomId, savedState);
          }
        } catch (e) {
          console.error("Failed to restore UNO session", e);
        }
      }
    }
  }, [supabase]);

  const processAction = (payload: any, activeChannel = channel) => {
    let state = JSON.parse(JSON.stringify(stateRef.current!));
    if (state.status !== 'playing' || state.winnerId) return;

    const playerIndex = state.players.findIndex(p => p.id === payload.playerId);
    if (playerIndex === -1) return;
    if (payload.action !== 'UNO_PENALTY' && playerIndex !== state.currentTurn) return; // Not their turn
    
    const player = state.players[playerIndex];

    if (payload.action === 'PLAY_CARD') {
      const cardIndex = player.hand.findIndex(c => c.id === payload.cardId);
      if (cardIndex === -1) return;
      const card = player.hand[cardIndex];

      if (!isValidPlay(card, state.topCard!, state.currentColor)) return;

      // Play the card
      player.hand.splice(cardIndex, 1);
      state.topCard = card;
      state.currentColor = card.color !== 'Wild' ? card.color : payload.chosenColor;
      

      // Win check
      if (player.hand.length === 0) {
        state.status = 'finished';
        state.winnerId = player.id;
        
      } else {
        // Apply effects
        let skipNext = false;
        if (card.value === 'Skip') {
          skipNext = true;
          
        } else if (card.value === 'Reverse') {
          state.direction *= -1;
          
          if (state.players.length === 2) skipNext = true; // In 2-player, reverse acts as skip
        } else if (card.value === 'DrawTwo') {
          const nextIndex = (state.currentTurn + state.direction + state.players.length) % state.players.length;
          drawCards(state, nextIndex, 2);
          skipNext = true;
          
        } else if (card.value === 'WildDrawFour') {
          const nextIndex = (state.currentTurn + state.direction + state.players.length) % state.players.length;
          drawCards(state, nextIndex, 4);
          skipNext = true;
          
        }

        // Advance turn
        let steps = skipNext ? 2 : 1;
        state.currentTurn = (state.currentTurn + (state.direction * steps) + (state.players.length * 2)) % state.players.length;
      }
    } else if (payload.action === 'DRAW_CARD') {
      drawCards(state, state.currentTurn, 1);
      
      state.currentTurn = (state.currentTurn + state.direction + state.players.length) % state.players.length;
    } else if (payload.action === 'UNO_PENALTY') {
      drawCards(state, playerIndex, 1);
      if (!state.logs) state.logs = [];
      state.logs.push(`${player.name} terlambat memencet UNO (+1 kartu).`);
    }

    setGameState(state);
    stateRef.current = state;
    broadcastState(state, activeChannel);
  };

  const drawCards = (state: GameState, pIndex: number, count: number) => {
    for (let i = 0; i < count; i++) {
      if (state.deck.length === 0) {
        state.deck = generateDeck(); // Reshuffle
        
      }
      state.players[pIndex].hand.push(state.deck.pop()!);
    }
  };

  const triggerUnoButton = () => {
    if (unoTimerRef.current) {
      clearTimeout(unoTimerRef.current);
    }

    // Random position on screen (top: 25% - 75%, left: 20% - 75%)
    const randomTop = Math.floor(Math.random() * 50) + 25;
    const randomLeft = Math.floor(Math.random() * 55) + 20;

    setUnoButton({
      top: randomTop,
      left: randomLeft,
      key: Date.now(),
    });

    // 1 second timer before shrinking away and penalizing
    unoTimerRef.current = setTimeout(() => {
      handleUnoTimeout();
    }, 1000);
  };

  const handleUnoClick = () => {
    if (unoTimerRef.current) {
      clearTimeout(unoTimerRef.current);
      unoTimerRef.current = null;
    }
    setUnoButton(null);
    setUnoToast({
      message: '🎉 TERIAK UNO! Kamu berhasil memencet tombol tepat waktu!',
      type: 'success',
    });
    setTimeout(() => {
      setUnoToast(null);
    }, 3000);
  };

  const handleUnoTimeout = () => {
    if (unoTimerRef.current) {
      clearTimeout(unoTimerRef.current);
      unoTimerRef.current = null;
    }
    setUnoButton(null);
    setUnoToast({
      message: '⚠️ TERLAMBAT MEMENCET UNO! Kamu mendapat hukuman +1 kartu!',
      type: 'penalty',
    });
    setTimeout(() => {
      setUnoToast(null);
    }, 4000);

    const payload = { playerId: localPlayerId, action: 'UNO_PENALTY' };
    if (isHost) {
      processAction(payload);
    } else if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'PLAYER_ACTION',
        payload
      });
    }
  };

  const handleStartGame = () => {
    if (!isHost || !stateRef.current) return;
    const state = JSON.parse(JSON.stringify(stateRef.current));
    state.deck = generateDeck();
    
    // Deal 7 cards to each
    state.players.forEach(p => {
      p.hand = [];
      for (let i = 0; i < 7; i++) {
        p.hand.push(state.deck.pop()!);
      }
    });

    // Flip top card
    let initialTop = state.deck.pop()!;
    while (initialTop.color === 'Wild' || initialTop.value === 'Skip' || initialTop.value === 'Reverse' || initialTop.value === 'DrawTwo') {
      state.deck.unshift(initialTop);
      initialTop = state.deck.pop()!;
    }
    
    state.topCard = initialTop;
    state.currentColor = initialTop.color;
    state.status = 'playing';
    state.currentTurn = 0;
    state.direction = 1;
    
    state.winnerId = null;

    setGameState(state);
    stateRef.current = state;
    broadcastState(state);
  };

  const handlePlayCard = (card: Card, chosenColor?: Color) => {
    if (!channel || !gameState) return;
    if (gameState.currentTurn !== gameState.players.findIndex(p => p.id === localPlayerId)) return;

    if (card.color === 'Wild' && !chosenColor) {
      setColorPickerVisible({ cardId: card.id });
      return;
    }

    setColorPickerVisible(null);

    // If player currently has 2 cards, playing this card reduces count to 1 -> Trigger shrinking UNO button!
    const myPlayer = gameState.players.find(p => p.id === localPlayerId);
    if (myPlayer && myPlayer.hand.length === 2) {
      triggerUnoButton();
    }

    const payload = { playerId: localPlayerId, action: 'PLAY_CARD', cardId: card.id, chosenColor };
    
    if (isHost) {
      processAction(payload);
    } else {
      channel.send({
        type: 'broadcast',
        event: 'PLAYER_ACTION',
        payload
      });
    }
  };

  const handleDrawCard = () => {
    if (!channel || !gameState) return;
    if (gameState.currentTurn !== gameState.players.findIndex(p => p.id === localPlayerId)) return;
    
    const payload = { playerId: localPlayerId, action: 'DRAW_CARD' };
    if (isHost) {
      processAction(payload);
    } else {
      channel.send({
        type: 'broadcast',
        event: 'PLAYER_ACTION',
        payload
      });
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '010309') { // Developer PIN
      setIsUnlocked(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('uno_unlocked', 'true');
      }
    } else {
      setPinError('Invalid PIN');
    }
  };

  if (!isUnlocked) {
    return (
      <div id="uno" className="min-h-screen pt-28 sm:pt-32 pb-12 sm:pb-16 flex flex-col justify-center items-center px-4 max-w-6xl mx-auto">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-[#FFCCE1] dark:border-slate-800 p-8 rounded-3xl shadow-xl max-w-md w-full mx-auto text-center">
          <ShieldAlert className="w-14 h-14 text-[#E195AB] mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Akses Pengembang Required</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Game ini masih dalam akses terbatas. Masukkan PIN pengembang untuk melanjutkan.</p>
          <form onSubmit={handleUnlock}>
            <input
              type="password"
              placeholder="Masukkan PIN Pengembang"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(''); }}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-[#E195AB] focus:ring-4 focus:ring-[#E195AB]/20 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100 mb-4 outline-none text-center"
            />
            {pinError && <p className="text-rose-500 text-xs font-bold mb-4">{pinError}</p>}
            <button
              type="submit"
              className="w-full bg-[#E195AB] hover:bg-[#d88299] text-white font-bold py-3.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Buka Game
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div id="uno" className="min-h-screen pt-28 sm:pt-32 pb-12 sm:pb-16 flex flex-col justify-center items-center px-4 max-w-6xl mx-auto">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-[#FFCCE1] dark:border-slate-800 p-8 rounded-3xl shadow-xl max-w-md w-full mx-auto text-center">
          {/* Authentic UNO Badge */}
          <div className="w-20 h-20 bg-[#E195AB] rounded-2xl flex items-center justify-center mx-auto mb-5 transform -rotate-6 border-4 border-[#FFF5D7] dark:border-slate-800 shadow-lg">
            <span className="text-[#FFF5D7] font-black text-3xl tracking-tighter drop-shadow">UNO</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">UNO Multiplayer</h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs mb-6">Bermain kartu UNO bersama teman secara real-time</p>
          
          {errorMsg && (
             <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-bold mb-4">
               {errorMsg}
             </div>
          )}
          
          <div className="mb-4 text-left">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Nama Pemain</label>
            <input
              type="text"
              value={playerName}
              disabled
              readOnly
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400 cursor-not-allowed outline-none text-sm"
            />
          </div>

          <button
            onClick={handleCreateRoom}
            className="w-full bg-[#E195AB] hover:bg-[#d88299] text-white font-bold py-3.5 rounded-xl mb-4 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Buat Room Baru</span>
          </button>
          
          <div className="relative flex items-center py-2 mb-4">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 font-bold text-xs uppercase tracking-wider">atau</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Kode Room"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-slate-800 dark:text-slate-100 uppercase outline-none focus:border-[#E195AB] text-sm"
              maxLength={6}
            />
            <button
              onClick={handleJoinRoom}
              className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold px-6 rounded-xl transition-all cursor-pointer text-sm shadow-sm"
            >
              Masuk
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderCard = (card: Card, isPlayable = false, onClick?: () => void, isMyTurn = false) => {
    let cardBg = 'bg-slate-900 border-slate-700';
    let textColor = 'text-white';
    let ovalBg = 'bg-white dark:bg-slate-900';
    let centerTextColor = 'text-slate-900';

    if (card.color === 'Red') {
      cardBg = 'bg-rose-600 border-rose-400';
      textColor = 'text-white';
      centerTextColor = 'text-rose-600';
    } else if (card.color === 'Blue') {
      cardBg = 'bg-blue-600 border-blue-400';
      textColor = 'text-white';
      centerTextColor = 'text-blue-600';
    } else if (card.color === 'Green') {
      cardBg = 'bg-emerald-600 border-emerald-400';
      textColor = 'text-white';
      centerTextColor = 'text-emerald-600';
    } else if (card.color === 'Yellow') {
      cardBg = 'bg-amber-400 border-amber-200';
      textColor = 'text-slate-950';
      centerTextColor = 'text-amber-500';
    } else if (card.color === 'Wild') {
      cardBg = 'bg-slate-900 border-slate-700';
      textColor = 'text-white';
      centerTextColor = 'text-slate-900';
    }

    let displayValue: string = card.value;
    if (card.value === 'Reverse') displayValue = '⇌';
    if (card.value === 'Skip') displayValue = '⊘';
    if (card.value === 'DrawTwo') displayValue = '+2';
    if (card.value === 'Wild') displayValue = 'W';
    if (card.value === 'WildDrawFour') displayValue = '+4';

    const handleClick = () => {
      if (isPlayable && onClick) {
        onClick();
      } else if (isMyTurn && !isPlayable) {
        setErrorMsg('Kartu tidak cocok! Pilih kartu dengan warna atau angka yang sama.');
        setTimeout(() => setErrorMsg(''), 3000);
      }
    };

    return (
      <div
        key={card.id}
        onClick={handleClick}
        className={`relative w-16 h-24 md:w-24 md:h-36 rounded-xl md:rounded-2xl border-2 md:border-[3px] border-white shadow-lg flex flex-col justify-between p-1.5 md:p-2.5 flex-shrink-0 select-none transition-all duration-200 ${cardBg} ${
          isPlayable
            ? 'cursor-pointer hover:-translate-y-3 hover:shadow-2xl ring-2 ring-yellow-300/80 z-20'
            : isMyTurn
            ? 'cursor-pointer opacity-80 hover:opacity-100'
            : 'opacity-90'
        }`}
      >
        {/* Corner Value Top-Left */}
        <div className={`font-black text-xs md:text-base leading-none tracking-tight ${textColor} drop-shadow-sm`}>
          {displayValue}
        </div>

        {/* Center Oval Emblem */}
        <div className="self-center w-10 h-14 md:w-14 md:h-20 bg-white dark:bg-slate-900 rounded-[50%] flex items-center justify-center transform -rotate-[24deg] shadow-md border border-black/10">
          {card.color === 'Wild' ? (
            <div className="grid grid-cols-2 gap-0.5 w-6 h-6 md:w-9 md:h-9 rotate-[24deg]">
              <div className="bg-rose-500 rounded-tl" />
              <div className="bg-blue-500 rounded-tr" />
              <div className="bg-amber-400 rounded-bl" />
              <div className="bg-emerald-500 rounded-br" />
            </div>
          ) : (
            <span className={`font-black text-lg md:text-3xl rotate-[24deg] ${centerTextColor}`}>
              {displayValue}
            </span>
          )}
        </div>

        {/* Corner Value Bottom-Right */}
        <div className={`font-black text-xs md:text-base leading-none tracking-tight self-end rotate-180 ${textColor} drop-shadow-sm`}>
          {displayValue}
        </div>
      </div>
    );
  };

  const localPlayerIndex = gameState.players.findIndex(p => p.id === localPlayerId);
  const localPlayer = gameState.players[localPlayerIndex];
  const isMyTurn = gameState.status === 'playing' && gameState.currentTurn === localPlayerIndex;

  return (
    <div id="uno" className="max-w-7xl mx-auto p-2 md:p-4 pt-24 sm:pt-28 md:pt-32 pb-4 md:pb-8 flex flex-col min-h-screen">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border-2 border-[#FFCCE1] dark:border-slate-800 flex flex-col flex-1">
        
        {/* Header */}
        <div className="bg-[#FFF5D7] dark:bg-slate-800 p-3 md:p-4 px-4 md:px-6 flex items-center justify-between border-b border-[#FFCCE1] dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#E195AB] rounded-xl flex items-center justify-center transform -rotate-3 border-2 border-white shadow-sm">
              <span className="text-[#FFF5D7] font-black text-xs">UNO</span>
            </div>
            <div>
              <h2 className="text-slate-800 dark:text-slate-100 font-extrabold text-base md:text-lg leading-tight">UNO Multiplayer</h2>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-medium">
                <span>Kode Room:</span>
                <span className="bg-white dark:bg-slate-900 border border-[#FFCCE1] dark:border-slate-700 px-2 py-0.5 rounded font-mono text-[#E195AB] dark:text-[#FFCCE1] font-bold select-all shadow-2xs">{gameState.roomId}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={handleLeaveRoom} className="px-3.5 py-1.5 bg-[#E195AB]/10 hover:bg-[#E195AB]/20 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#E195AB] dark:text-[#FFCCE1] rounded-lg font-bold text-xs border border-[#FFCCE1] dark:border-slate-700 transition-colors cursor-pointer">
               Keluar
             </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Main Felt Board */}
          <div className="flex-1 p-3 md:p-6 flex flex-col justify-between relative bg-[#FFF5D7]/30 dark:bg-slate-950/50 border-b lg:border-b-0 border-[#FFCCE1] dark:border-slate-800 overflow-y-auto lg:overflow-hidden min-h-[500px] lg:min-h-0 shadow-inner">
            {/* Status Overlay */}
            {gameState.status === 'waiting' && (
              <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center">
                <Users className="w-12 h-12 text-[#E195AB] dark:text-[#FFCCE1] mb-3" />
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">Menunggu Pemain Lain</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 font-medium">{gameState.players.length} / 4 Pemain Terhubung</p>
                
                <div className="flex flex-wrap justify-center gap-3 mb-8 max-w-md">
                  {gameState.players.map((p, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 border-2 border-[#FFCCE1] dark:border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-slate-800 dark:text-slate-100 font-bold text-sm flex items-center gap-1.5">
                        <span>{p.name} {p.id === localPlayerId ? '(Anda)' : ''}</span>
                        {isDeveloperName(p.name) && <DeveloperBadge />}{!isDeveloperName(p.name) && isAdminName(p.name) && <AdminBadge />}
                      </span>
                    </div>
                  ))}
                </div>

                {isHost && gameState.players.length >= 2 && (
                  <button onClick={handleStartGame} className="bg-[#E195AB] hover:bg-[#d88299] text-white px-8 py-3.5 rounded-xl font-black text-base transition-all shadow-lg cursor-pointer">
                    MULAI PERMAINAN
                  </button>
                )}
                {isHost && gameState.players.length < 2 && (
                  <p className="text-amber-700 dark:text-amber-300 font-bold bg-[#FFF5D7] dark:bg-slate-800 border border-[#FFCCE1] dark:border-slate-700 px-4 py-2 rounded-xl text-xs">Minimal 2 pemain untuk memulai permainan.</p>
                )}
                {!isHost && (
                  <p className="text-slate-600 dark:text-slate-400 font-bold bg-[#FFF5D7] dark:bg-slate-800 border border-[#FFCCE1] dark:border-slate-700 px-4 py-2 rounded-xl text-xs">Menunggu host memulai permainan...</p>
                )}
              </div>
            )}

            {gameState.status === 'finished' && (
              <VictoryModal
                isOpen={true}
                winnerName={gameState.players.find(p => p.id === gameState.winnerId)?.name || 'Player'}
                winnerColor="#E195AB"
                subtitle="Telah berhasil menghabiskan seluruh kartu & menjadi Juara UNO!"
                gameTitle="UNO Multiplayer"
                isHost={isHost}
                onPlayAgain={handleStartGame}
                onLeave={handleLeaveRoom}
                playAgainText="Main Lagi"
                leaveText="Keluar dari Room"
              />
            )}

            {/* Play Area */}
            {gameState.status === 'playing' && (
              <>
                {/* Opponents Hands (Top) */}
                <div className="flex flex-wrap justify-center gap-2.5 sm:gap-4 md:gap-8 shrink-0 py-1">
                  {gameState.players.map((p, i) => {
                    if (p.id === localPlayerId) return null;
                    const isTurn = gameState.currentTurn === i;
                    return (
                      <div key={p.id} className={`flex flex-col items-center transition-all ${isTurn ? 'scale-105 opacity-100' : 'scale-90 opacity-75'}`}>
                        <div className={`font-bold mb-1 px-2.5 sm:px-3 py-0.5 rounded-full text-[10px] sm:text-xs flex items-center gap-1.5 border ${
                          isTurn 
                            ? 'bg-[#E195AB] text-white border-[#E195AB] font-black shadow-md' 
                            : 'bg-white dark:bg-slate-900 border-[#FFCCE1] dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          <span className="truncate max-w-[80px] sm:max-w-[120px]">{p.name}</span>
                          {isDeveloperName(p.name) && <DeveloperBadge />}{!isDeveloperName(p.name) && isAdminName(p.name) && <AdminBadge />}
                        </div>
                        <div className="flex -space-x-4 xs:-space-x-5 md:-space-x-7">
                          {p.hand.map((_, idx) => (
                            <div key={idx} className="w-7 h-10 xs:w-8 xs:h-12 md:w-11 md:h-18 bg-[#E195AB] border-1.5 sm:border-2 border-white rounded-lg shadow-md flex items-center justify-center">
                              <span className="text-[#FFF5D7] font-black text-[8px] xs:text-[9px] md:text-xs tracking-tighter transform -rotate-12 select-none">UNO</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-0.5 sm:mt-1 text-slate-600 dark:text-slate-400 font-bold text-[9px] sm:text-[10px] md:text-xs">{p.hand.length} kartu</div>
                      </div>
                    );
                  })}
                </div>

                {/* Center Deck & Top Card */}
                <div className="flex flex-col items-center justify-center gap-3 md:gap-4 my-2 md:my-auto shrink-0">
                  {/* Current Active Color Indicator */}
                  {gameState.currentColor && (
                    <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 border-2 border-[#FFCCE1] dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm">
                      <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Warna Aktif:</span>
                      <div className="flex items-center gap-1.5 font-black">
                        <div className={`w-3.5 h-3.5 rounded-full ${
                          gameState.currentColor === 'Red' ? 'bg-rose-500' :
                          gameState.currentColor === 'Blue' ? 'bg-blue-500' :
                          gameState.currentColor === 'Green' ? 'bg-emerald-500' :
                          gameState.currentColor === 'Yellow' ? 'bg-amber-400' : 'bg-slate-400'
                        }`} />
                        <span className="text-slate-800 dark:text-slate-100">{
                          gameState.currentColor === 'Red' ? 'Merah' :
                          gameState.currentColor === 'Blue' ? 'Biru' :
                          gameState.currentColor === 'Green' ? 'Hijau' :
                          gameState.currentColor === 'Yellow' ? 'Kuning' : gameState.currentColor
                        }</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-6 lg:gap-12 w-full max-w-sm relative">
                    {/* Draw Pile (Face Down Deck) */}
                    <div className="flex flex-col items-center gap-1">
                      <div 
                        onClick={isMyTurn ? handleDrawCard : undefined}
                        className={`w-16 h-24 md:w-24 md:h-36 bg-[#E195AB] border-2 md:border-3 border-white rounded-xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                          isMyTurn ? 'cursor-pointer hover:-translate-y-1 hover:ring-4 hover:ring-[#E195AB]/50' : 'opacity-80'
                        }`}
                      >
                        <div className="w-10 h-16 md:w-14 md:h-22 bg-white/20 dark:bg-slate-900/20 rounded-[50%] flex items-center justify-center transform -rotate-12 border border-white/40">
                          <span className="text-[#FFF5D7] font-black text-sm md:text-xl transform -rotate-12 tracking-tighter drop-shadow select-none">UNO</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Dek Ambil</span>
                    </div>

                    {/* Discard Pile (Top Card) */}
                    <div className="flex flex-col items-center gap-1">
                      {gameState.topCard && (
                        <div className="transform scale-100 lg:scale-105">
                          {renderCard(gameState.topCard)}
                        </div>
                      )}
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Kartu Buang</span>
                    </div>
                  </div>
                  
                  {/* Turn Direction */}
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-1 rounded-full border border-[#FFCCE1] dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
                    <span>Arah Putaran:</span>
                    <ArrowRight className={`w-3.5 h-3.5 text-[#E195AB] transform transition-transform duration-500 ${gameState.direction === -1 ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Local Player Hand Bar */}
                <div className="shrink-0 flex flex-col items-center w-full mt-auto pt-2 pb-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border-2 border-[#FFCCE1] dark:border-slate-800 shadow-xl sticky bottom-0 z-20">
                  <div className="mb-1.5">
                    <h4 className={`font-black text-xs px-4 py-1 rounded-full border transition-all ${
                      isMyTurn 
                        ? 'bg-[#E195AB] text-white border-[#E195AB] shadow-sm animate-pulse' 
                        : 'bg-[#FFF5D7] dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-[#FFCCE1] dark:border-slate-700'
                    }`}>
                      {isMyTurn ? '⚡ GILIRAN ANDA!' : 'Menunggu giliran pemain lain...'}
                    </h4>
                  </div>
                  
                  <div className="w-full max-w-full overflow-x-auto pb-3 pt-1 px-2 scroll-smooth">
                    <div className="flex flex-row justify-start md:justify-center w-max min-w-full gap-2 md:gap-3 px-4 mx-auto">
                    {localPlayer?.hand.map((card) => {
                      const isValid = isMyTurn && isValidPlay(card, gameState.topCard!, gameState.currentColor);
                      return (
                        <div key={card.id} className="relative z-10">
                          {renderCard(card, isValid, () => handlePlayCard(card), isMyTurn)}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>

                {/* Wild Card Color Selection Modal */}
                {colorPickerVisible && localPlayer?.hand.find(c => c.id === colorPickerVisible.cardId) && (
                  <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                    onClick={() => setColorPickerVisible(null)}
                  >
                    <div 
                      className="bg-white dark:bg-slate-900 border-2 border-[#FFCCE1] dark:border-slate-800 p-6 rounded-3xl shadow-2xl max-w-xs w-full text-center flex flex-col items-center gap-3 animate-in zoom-in-95 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5 text-[#E195AB] font-bold text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        Pilih Warna Kartu
                      </div>
                      <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Kartu Wild / Bebas</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">Pilih warna untuk giliran berikutnya</p>

                      <div className="grid grid-cols-2 gap-2.5 w-full mt-1">
                        {(['Red', 'Blue', 'Green', 'Yellow'] as Color[]).map((c) => {
                          const bgMap = {
                            Red: 'bg-rose-500 hover:bg-rose-600 text-white',
                            Blue: 'bg-blue-500 hover:bg-blue-600 text-white',
                            Green: 'bg-emerald-500 hover:bg-emerald-600 text-white',
                            Yellow: 'bg-amber-400 hover:bg-amber-500 text-slate-900',
                          };
                          const colorLabels = {
                            Red: 'Merah',
                            Blue: 'Biru',
                            Green: 'Hijau',
                            Yellow: 'Kuning',
                          };
                          const targetCard = localPlayer.hand.find(card => card.id === colorPickerVisible.cardId)!;
                          return (
                            <button
                              key={c}
                              onClick={() => handlePlayCard(targetCard, c)}
                              className={`${bgMap[c]} font-black py-3 rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all text-xs tracking-wide cursor-pointer`}
                            >
                              <div className="w-3 h-3 rounded-full bg-white/40 dark:bg-slate-900/40 border border-white/60" />
                              {colorLabels[c]}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setColorPickerVisible(null)}
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 text-xs font-bold pt-1 cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-72 bg-[#FFF5D7]/40 dark:bg-slate-900/60 border-t lg:border-t-0 lg:border-l border-[#FFCCE1] dark:border-slate-800 flex flex-col shrink-0">
            {/* Players List Sidebar */}
            <div className="p-4 overflow-y-auto max-h-40 lg:max-h-none">
              <h4 className="text-[11px] font-black text-[#E195AB] uppercase tracking-wider mb-3">Daftar Pemain</h4>
              <div className="space-y-2">
                {gameState.players.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-[#FFCCE1] dark:border-slate-800 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${gameState.currentTurn === i && gameState.status === 'playing' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                      <span className={`font-bold text-xs ${p.id === localPlayerId ? 'text-[#E195AB] font-extrabold' : 'text-slate-700 dark:text-slate-300'} flex items-center gap-1.5`}>
                        <span>{p.name} {p.id === localPlayerId ? '(Anda)' : ''}</span>
                        {isDeveloperName(p.name) && <DeveloperBadge />}{!isDeveloperName(p.name) && isAdminName(p.name) && <AdminBadge />}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-[#FFF5D7] dark:bg-slate-800 border border-[#FFCCE1] dark:border-slate-700 px-2 py-0.5 rounded-md">{p.hand.length} 🃏</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Shrinking Circular UNO Button */}
      <AnimatePresence>
        {unoButton && (
          <motion.div
            key={unoButton.key}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            style={{
              position: 'fixed',
              top: `${unoButton.top}%`,
              left: `${unoButton.left}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="z-[99999] pointer-events-auto flex items-center justify-center"
          >
            {/* Shrinking Ring Circle */}
            <motion.div
              initial={{ scale: 1.8, opacity: 1 }}
              animate={{ scale: 0, opacity: 0 }}
              transition={{ duration: 1, ease: 'linear' }}
              className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-[#FFCCE1] dark:border-slate-800 bg-[#FFF5D7]/50 pointer-events-none"
            />

            {/* Simple Circular UNO Button */}
            <button
              onClick={handleUnoClick}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#E195AB] hover:bg-[#d88299] text-white font-black text-2xl sm:text-3xl shadow-2xl border-4 border-white flex items-center justify-center cursor-pointer active:scale-90 transition-transform select-none"
            >
              <span className="drop-shadow-md tracking-wider -rotate-6">UNO!</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UNO Status Toast */}
      <AnimatePresence>
        {unoToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none px-4"
          >
            <div
              className={`px-6 py-3 rounded-2xl font-black text-sm sm:text-base shadow-2xl border-2 flex items-center gap-2 backdrop-blur-md ${
                unoToast.type === 'success'
                  ? 'bg-emerald-600/95 text-white border-emerald-300 shadow-emerald-500/30'
                  : 'bg-rose-600/95 text-white border-rose-300 shadow-rose-500/30'
              }`}
            >
              <span>{unoToast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
