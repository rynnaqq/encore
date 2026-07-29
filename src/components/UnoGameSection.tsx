import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { GameState, Card, Player, Color, generateDeck, isValidPlay } from '../lib/unoLogic';
import { Copy, Play, UserPlus, Users, ArrowRight, MessageSquare, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminBadge, isAdminName } from './AdminBadge';

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
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

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
    joinChannel(joinRoomId.toUpperCase());
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
      if (stateRef.current && stateRef.current.players.find(p => p.isHost)?.id === localPlayerId) {
        const state = JSON.parse(JSON.stringify(stateRef.current));
        if (state.status === 'waiting' && state.players.length < 4) {
          if (!state.players.find(p => p.id === payload.id)) {
            state.players.push({ id: payload.id, name: payload.name, hand: [], isHost: false });
            
            setGameState(state);
            stateRef.current = state;
            broadcastState(state, newChannel);
          }
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
        handlePlayerLeave(payload.playerId, newChannel);
      }
    });

    newChannel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach((presence: any) => {
        if (presence.id) {
          handlePlayerLeave(presence.id, newChannel);
        }
      });
    });

    newChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await newChannel.track({ id: localPlayerId, name: playerName });
        if (!initialHostState) {
          // I am a client joining
          newChannel.send({
            type: 'broadcast',
            event: 'JOIN_REQUEST',
            payload: { id: localPlayerId, name: playerName }
          });
        }
      }
    });

    setChannel(newChannel);
  };

  const processAction = (payload: any, activeChannel = channel) => {
    let state = JSON.parse(JSON.stringify(stateRef.current!));
    if (state.status !== 'playing' || state.winnerId) return;

    const playerIndex = state.players.findIndex(p => p.id === payload.playerId);
    if (playerIndex !== state.currentTurn) return; // Not their turn
    
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
        <div className="bg-white/80 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-xl max-w-md w-full mx-auto text-center">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-6">Developer Access Required</h2>
          <p className="text-slate-600 mb-6">This game is currently in beta. Please enter the developer PIN to access.</p>
          <form onSubmit={handleUnlock}>
            <input
              type="password"
              placeholder="Enter Developer PIN"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(''); }}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 mb-4 font-bold text-slate-700 outline-none text-center"
            />
            {pinError && <p className="text-rose-500 text-sm font-bold mb-4">{pinError}</p>}
            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2"
            >
              Unlock Game
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div id="uno" className="min-h-screen pt-28 sm:pt-32 pb-12 sm:pb-16 flex flex-col justify-center items-center px-4 max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-xl max-w-md w-full mx-auto text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-12 shadow-lg border-4 border-white">
            <span className="text-white font-black text-2xl -rotate-12">UNO</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-6">Play UNO Online</h2>
          
          {errorMsg && (
             <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-bold mb-4">
               {errorMsg}
             </div>
          )}
          
          <div className="mb-4 text-left">
            <label className="block text-xs font-bold text-slate-500 mb-1">Your Nickname (Terkunci)</label>
            <input
              type="text"
              value={playerName}
              disabled
              readOnly
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-100 font-bold text-slate-500 cursor-not-allowed outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">Username disamakan dengan akun login Anda.</p>
          </div>
          <button
            onClick={handleCreateRoom}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mb-6 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" /> Create Room
          </button>
          
          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 font-bold text-sm">OR</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Room Code"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 font-bold text-slate-700 uppercase outline-none"
              maxLength={6}
            />
            <button
              onClick={handleJoinRoom}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderCard = (card: Card, isPlayable = false, onClick?: () => void, isMyTurn = false) => {
    let bg = 'bg-slate-800';
    if (card.color === 'Red') bg = 'bg-red-500';
    if (card.color === 'Blue') bg = 'bg-blue-500';
    if (card.color === 'Green') bg = 'bg-green-500';
    if (card.color === 'Yellow') bg = 'bg-yellow-400';
    
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
        setErrorMsg('Invalid card! Must match color or number. Draw a card if you have no playable cards.');
        setTimeout(() => setErrorMsg(''), 3000);
      }
    };

    return (
      <div 
        key={card.id}
        onClick={handleClick}
        className={`relative w-16 h-24 md:w-24 md:h-36 rounded-lg md:rounded-xl border-2 md:border-4 border-white shadow-xl flex flex-col justify-between p-1.5 md:p-2 flex-shrink-0 select-none ${bg} ${isPlayable ? 'cursor-pointer transition-transform' : 'cursor-pointer opacity-90 hover:opacity-100'}`}
      >
        <div className="text-white font-bold text-xs md:text-lg leading-none drop-shadow-md">{displayValue}</div>
        <div className="text-white font-black text-xl md:text-4xl self-center bg-white/20 rounded-full w-9 h-9 md:w-16 md:h-16 flex items-center justify-center transform -rotate-12 drop-shadow-lg shadow-inner">
          {displayValue}
        </div>
        <div className="text-white font-bold text-xs md:text-lg leading-none self-end transform rotate-180 drop-shadow-md">{displayValue}</div>
      </div>
    );
  };

  const localPlayerIndex = gameState.players.findIndex(p => p.id === localPlayerId);
  const localPlayer = gameState.players[localPlayerIndex];
  const isMyTurn = gameState.status === 'playing' && gameState.currentTurn === localPlayerIndex;

  return (
    <div id="uno" className="max-w-7xl mx-auto p-2 md:p-4 pt-24 sm:pt-28 md:pt-32 pb-4 md:pb-8 flex flex-col min-h-screen">
      <div className="bg-slate-900 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col flex-1">
        
        {/* Header */}
        <div className="bg-slate-800 p-3 md:p-4 px-4 md:px-6 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 rounded-xl flex items-center justify-center transform rotate-12 shadow-lg border-2 border-white/20">
              <span className="text-white font-black text-xs -rotate-12">UNO</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">UNO Multiplayer</h2>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <span>Room Code:</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded font-mono text-white select-all">{gameState.roomId}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={handleLeaveRoom} className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg font-bold text-sm hover:bg-rose-500/30">
               Leave
             </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Main Board */}
          <div className="flex-1 p-2 md:p-4 flex flex-col justify-between relative bg-emerald-900/40 overflow-y-auto lg:overflow-hidden min-h-[500px] lg:min-h-0">
            {/* Status Overlay */}
            {gameState.status === 'waiting' && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                <Users className="w-16 h-16 text-indigo-400 mb-4" />
                <h3 className="text-3xl font-black text-white mb-2">Waiting for Players</h3>
                <p className="text-slate-300 mb-8 font-medium">{gameState.players.length} / 4 Players Joined</p>
                
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {gameState.players.map((p, i) => (
                    <div key={i} className="bg-slate-800 border border-slate-700 px-6 py-3 rounded-xl flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-white font-bold flex items-center gap-1.5">
                        <span>{p.name} {p.id === localPlayerId ? '(You)' : ''}</span>
                        {isAdminName(p.name) && <AdminBadge />}
                      </span>
                    </div>
                  ))}
                </div>

                {isHost && gameState.players.length >= 2 && (
                  <button onClick={handleStartGame} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-lg shadow-indigo-600/30 transform hover:scale-105 transition-all">
                    START GAME
                  </button>
                )}
                {isHost && gameState.players.length < 2 && (
                  <p className="text-indigo-400 font-bold bg-indigo-900/50 px-4 py-2 rounded-lg">Need at least 2 players to start.</p>
                )}
                {!isHost && (
                  <p className="text-slate-400 font-bold bg-slate-800 px-4 py-2 rounded-lg">Waiting for host to start...</p>
                )}
              </div>
            )}

            {gameState.status === 'finished' && (
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
                <div className="text-8xl mb-6 animate-bounce">🏆</div>
                <h3 className="text-4xl font-black text-white mb-2">
                  {gameState.players.find(p => p.id === gameState.winnerId)?.name} WINS!
                </h3>
                {isHost && (
                  <button onClick={handleStartGame} className="mt-8 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-600/30">
                    PLAY AGAIN
                  </button>
                )}
              </div>
            )}

            {/* Play Area */}
            {gameState.status === 'playing' && (
              <>
                {/* Opponents Hands (Top) */}
                <div className="flex justify-center gap-4 md:gap-8 opacity-80 shrink-0 py-1">
                  {gameState.players.map((p, i) => {
                    if (p.id === localPlayerId) return null;
                    const isTurn = gameState.currentTurn === i;
                    return (
                      <div key={p.id} className={`flex flex-col items-center ${isTurn ? 'scale-105' : 'scale-90'} transition-transform`}>
                        <div className={`text-white font-bold mb-1 px-2.5 py-0.5 rounded-full text-xs md:text-sm ${isTurn ? 'bg-indigo-500' : 'bg-slate-800'} flex items-center gap-1.5`}>
                          <span>{p.name}</span>
                          {isAdminName(p.name) && <AdminBadge />}
                        </div>
                        <div className="flex -space-x-6 md:-space-x-8">
                          {p.hand.map((_, idx) => (
                            <div key={idx} className="w-8 h-12 md:w-12 md:h-20 bg-slate-800 border-2 border-slate-600 rounded-md md:rounded-lg shadow-md flex items-center justify-center">
                              <span className="text-slate-600 font-black text-[9px] md:text-xs">UNO</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-1 text-slate-300 font-bold text-[10px] md:text-xs">{p.hand.length} cards</div>
                      </div>
                    );
                  })}
                </div>

                {/* Center Deck & Top Card */}
                <div className="flex flex-col items-center justify-center gap-2 md:gap-4 my-2 md:my-auto shrink-0">
                  {/* Current Color Indicator (For Wilds) */}
                  <div className={`px-4 md:px-6 py-1 md:py-2 rounded-full font-black text-white text-xs md:text-lg tracking-wider uppercase border-2 border-white/20 shadow-xl ${
                    gameState.currentColor === 'Red' ? 'bg-red-500' :
                    gameState.currentColor === 'Blue' ? 'bg-blue-500' :
                    gameState.currentColor === 'Green' ? 'bg-green-500' :
                    gameState.currentColor === 'Yellow' ? 'bg-yellow-500' : 'opacity-0'
                  }`}>
                    {gameState.currentColor || 'None'}
                  </div>

                  <div className="flex items-center justify-center gap-4 lg:gap-12 w-full max-w-sm relative">
                    {/* Draw Pile */}
                    <div 
                      onClick={isMyTurn ? handleDrawCard : undefined}
                      className={`w-16 h-24 md:w-24 md:h-36 bg-slate-800 border-2 md:border-4 border-slate-700 rounded-lg md:rounded-xl shadow-2xl flex items-center justify-center ${isMyTurn ? 'cursor-pointer hover:border-indigo-400 hover:-translate-y-1 transition-all' : 'opacity-50'}`}
                    >
                      <span className="text-slate-600 font-black text-sm md:text-2xl -rotate-12">UNO</span>
                    </div>

                    {/* Top Card */}
                    {gameState.topCard && (
                      <div className="transform scale-100 lg:scale-110">
                        {renderCard(gameState.topCard)}
                      </div>
                    )}
                  </div>
                  
                  {/* Turn Indicator */}
                  <div className="flex items-center gap-1.5 md:gap-2 bg-slate-800/80 backdrop-blur-sm px-3 py-1 md:px-4 md:py-2 rounded-full border border-slate-700">
                    <span className="text-slate-300 font-bold text-xs md:text-sm">Direction:</span>
                    <ArrowRight className={`w-4 h-4 md:w-5 md:h-5 text-indigo-400 transform transition-transform duration-500 ${gameState.direction === -1 ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Local Player Hand */}
                <div className="shrink-0 flex flex-col items-center w-full mt-auto pt-2 bg-slate-950/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl sticky bottom-0 z-20">
                  <div className="mb-1 md:mb-2">
                    <h4 className={`font-black text-xs md:text-sm px-4 py-1 rounded-full shadow-lg border ${isMyTurn ? 'bg-indigo-600 text-white border-indigo-400 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {isMyTurn ? 'YOUR TURN!' : 'Wait for your turn...'}
                    </h4>
                  </div>
                  
                  <div className="w-full max-w-full overflow-x-auto pb-3 pt-2 px-2 scroll-smooth">
                    <div className="flex flex-row justify-start md:justify-center w-max min-w-full gap-2 md:gap-4 px-4 mx-auto">
                    {localPlayer?.hand.map((card) => {
                      const isValid = isMyTurn && isValidPlay(card, gameState.topCard!, gameState.currentColor);
                      return (
                        <div key={card.id} className={`relative transition-transform duration-200 ${isMyTurn && isValid ? 'hover:-translate-y-2' : ''} z-10`}>
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
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
                    onClick={() => setColorPickerVisible(null)}
                  >
                    <div 
                      className="bg-slate-900 border-2 border-indigo-500/50 p-6 rounded-3xl shadow-2xl max-w-xs w-full text-center flex flex-col items-center gap-4 animate-in zoom-in-95 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        Pilih Warna
                      </div>
                      <h3 className="text-xl font-black text-white">Warna Kartu Wild</h3>
                      <p className="text-slate-400 text-xs">Pilih warna untuk melanjutkan giliran</p>

                      <div className="grid grid-cols-2 gap-3 w-full mt-2">
                        {(['Red', 'Blue', 'Green', 'Yellow'] as Color[]).map((c) => {
                          const bgMap = {
                            Red: 'bg-red-500 hover:bg-red-400 border-red-300 text-white',
                            Blue: 'bg-blue-500 hover:bg-blue-400 border-blue-300 text-white',
                            Green: 'bg-green-500 hover:bg-green-400 border-green-300 text-white',
                            Yellow: 'bg-yellow-400 hover:bg-yellow-300 border-yellow-200 text-slate-900',
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
                              className={`${bgMap[c]} border-2 font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all text-sm tracking-wide`}
                            >
                              <div className="w-3.5 h-3.5 rounded-full bg-white/40 border border-white/60" />
                              {colorLabels[c]}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setColorPickerVisible(null)}
                        className="text-slate-400 hover:text-white text-xs font-bold pt-1 underline"
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
          <div className="w-full lg:w-80 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0">
            {/* Players List Sidebar */}
            <div className="p-3 md:p-4 overflow-y-auto bg-slate-900/50 max-h-36 lg:max-h-none">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Players</h4>
              <div className="space-y-2">
                {gameState.players.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${gameState.currentTurn === i && gameState.status === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                      <span className={`font-bold text-sm ${p.id === localPlayerId ? 'text-indigo-400' : 'text-slate-300'} flex items-center gap-1.5`}>
                        <span>{p.name}</span>
                        {isAdminName(p.name) && <AdminBadge />}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">{p.hand.length} 🃏</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
