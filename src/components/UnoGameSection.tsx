import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { GameState, Card, Player, Color, generateDeck, isValidPlay } from '../lib/unoLogic';
import { Copy, Play, UserPlus, Users, ArrowRight, MessageSquare, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

export const UnoGameSection: React.FC = () => {
  const [supabase] = useState(() => getSupabaseClient());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('username') || '';
    }
    return '';
  });
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

  const handleCreateRoom = () => {
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
    if (!supabase) return setErrorMsg('Supabase not configured');
    if (!playerName.trim() || !joinRoomId.trim()) return setErrorMsg('Name and Room ID required');
    setIsHost(false);
    joinChannel(joinRoomId.toUpperCase());
  };

  const joinChannel = (roomId: string, initialHostState?: GameState) => {
    if (channel) supabase?.removeChannel(channel);
    const newChannel = supabase!.channel(`uno-${roomId}`, {
      config: { broadcast: { self: true } }
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

    newChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
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
      <div id="uno" className="max-w-6xl mx-auto p-4 py-12 lg:py-24">
        <div className="bg-white/80 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-xl max-w-md mx-auto text-center">
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
      <div id="uno" className="max-w-6xl mx-auto p-4 py-12 lg:py-24">
        <div className="bg-white/80 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-xl max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-12 shadow-lg border-4 border-white">
            <span className="text-white font-black text-2xl -rotate-12">UNO</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-6">Play UNO Online</h2>
          
          {errorMsg && (
             <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-bold mb-4">
               {errorMsg}
             </div>
          )}
          
          <input
            type="text"
            placeholder="Your Nickname"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 mb-4 font-bold text-slate-700 outline-none"
          />
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
        className={`relative w-20 h-32 md:w-24 md:h-36 rounded-xl border-4 border-white shadow-xl flex flex-col justify-between p-2 flex-shrink-0 select-none ${bg} ${isPlayable ? 'cursor-pointer transition-transform' : 'cursor-pointer opacity-90 hover:opacity-100'}`}
      >
        <div className="text-white font-bold text-sm md:text-lg leading-none drop-shadow-md">{displayValue}</div>
        <div className="text-white font-black text-3xl md:text-4xl self-center bg-white/20 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center transform -rotate-12 drop-shadow-lg shadow-inner">
          {displayValue}
        </div>
        <div className="text-white font-bold text-sm md:text-lg leading-none self-end transform rotate-180 drop-shadow-md">{displayValue}</div>
      </div>
    );
  };

  const localPlayerIndex = gameState.players.findIndex(p => p.id === localPlayerId);
  const localPlayer = gameState.players[localPlayerIndex];
  const isMyTurn = gameState.status === 'playing' && gameState.currentTurn === localPlayerIndex;

  return (
    <div id="uno" className="max-w-7xl mx-auto p-2 md:p-4 pt-24 md:pt-28 pb-4 md:pb-8 flex flex-col h-[100dvh]">
      <div className="bg-slate-900 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col flex-1">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 px-6 flex items-center justify-between border-b border-slate-700">
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
             <button onClick={() => { setGameState(null); supabase?.removeChannel(channel!); setChannel(null); }} className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg font-bold text-sm hover:bg-rose-500/30">
               Leave
             </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Main Board */}
          <div className="flex-1 p-2 md:p-4 flex flex-col relative bg-emerald-900/40 overflow-hidden">
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
                      <span className="text-white font-bold">{p.name} {p.id === localPlayerId ? '(You)' : ''}</span>
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
                <div className="flex justify-center gap-8 mb-auto opacity-80">
                  {gameState.players.map((p, i) => {
                    if (p.id === localPlayerId) return null;
                    const isTurn = gameState.currentTurn === i;
                    return (
                      <div key={p.id} className={`flex flex-col items-center ${isTurn ? 'scale-110' : 'scale-90'} transition-transform`}>
                        <div className={`text-white font-bold mb-2 px-3 py-1 rounded-full text-sm ${isTurn ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                          {p.name}
                        </div>
                        <div className="flex -space-x-8">
                          {p.hand.map((_, idx) => (
                            <div key={idx} className="w-12 h-20 bg-slate-800 border-2 border-slate-600 rounded-lg shadow-md flex items-center justify-center">
                              <span className="text-slate-700 font-black text-xs">UNO</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-slate-300 font-bold text-xs">{p.hand.length} cards</div>
                      </div>
                    );
                  })}
                </div>

                {/* Center Deck & Top Card */}
                <div className="flex flex-col items-center justify-center gap-4 my-auto py-4">
                  {/* Current Color Indicator (For Wilds) */}
                  <div className={`px-6 py-2 rounded-full font-black text-white text-lg tracking-wider uppercase border-2 border-white/20 shadow-xl ${
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
                      className={`w-20 h-32 md:w-24 md:h-36 bg-slate-800 border-4 border-slate-700 rounded-xl shadow-2xl flex items-center justify-center ${isMyTurn ? 'cursor-pointer hover:border-indigo-400 hover:-translate-y-2 transition-all' : 'opacity-50'}`}
                    >
                      <span className="text-slate-600 font-black text-xl md:text-2xl -rotate-12">UNO</span>
                    </div>

                    {/* Top Card */}
                    {gameState.topCard && (
                      <div className="transform scale-100 lg:scale-110">
                        {renderCard(gameState.topCard)}
                      </div>
                    )}
                  </div>
                  
                  {/* Turn Indicator */}
                  <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700">
                    <span className="text-slate-300 font-bold text-sm">Direction:</span>
                    <ArrowRight className={`w-5 h-5 text-indigo-400 transform transition-transform duration-500 ${gameState.direction === -1 ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Local Player Hand */}
                <div className="mt-auto flex flex-col items-center w-full overflow-hidden">
                  <div className="mb-2 md:mb-4">
                    <h4 className={`font-black text-lg md:text-xl px-6 py-2 rounded-full shadow-lg border-2 ${isMyTurn ? 'bg-indigo-600 text-white border-indigo-400 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {isMyTurn ? 'YOUR TURN!' : 'Wait for your turn...'}
                    </h4>
                  </div>
                  
                  <div className="w-full max-w-full overflow-x-auto pb-4 pt-4 px-2 scroll-smooth">
                    <div className="flex flex-row justify-start w-max min-w-full gap-2 md:gap-4 px-4 pb-4 mx-auto">
                    {localPlayer?.hand.map((card) => {
                      const isValid = isMyTurn && isValidPlay(card, gameState.topCard!, gameState.currentColor);
                      return (
                        <div key={card.id} className={`relative transition-transform duration-200 ${isMyTurn && isValid ? 'hover:-translate-y-2' : ''} ${colorPickerVisible?.cardId === card.id ? 'z-[50]' : 'z-10'}`}>
                          {renderCard(card, isValid, () => handlePlayCard(card), isMyTurn)}
                          
                          {/* Color Picker for Wilds */}
                          {colorPickerVisible?.cardId === card.id && (
                            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-800 p-2 rounded-xl shadow-2xl border border-slate-700 flex gap-2 z-50">
                              {['Red', 'Blue', 'Green', 'Yellow'].map(c => (
                                <button
                                  key={c}
                                  onClick={(e) => { e.stopPropagation(); handlePlayCard(card, c as Color); }}
                                  className={`w-8 h-8 rounded-full border-2 border-white hover:scale-125 transition-transform ${
                                    c === 'Red' ? 'bg-red-500' :
                                    c === 'Blue' ? 'bg-blue-500' :
                                    c === 'Green' ? 'bg-green-500' : 'bg-yellow-400'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 bg-slate-950 border-l border-slate-800 flex flex-col">
            {/* Players List Sidebar */}
            <div className="p-4 flex-1 overflow-y-auto bg-slate-900/50">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Players</h4>
              <div className="space-y-2">
                {gameState.players.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${gameState.currentTurn === i && gameState.status === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                      <span className={`font-bold text-sm ${p.id === localPlayerId ? 'text-indigo-400' : 'text-slate-300'}`}>{p.name}</span>
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
