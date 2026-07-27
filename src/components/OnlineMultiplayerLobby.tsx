import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import {
  Globe,
  Users,
  Plus,
  Play,
  Key,
  Copy,
  Check,
  Send,
  MessageSquare,
  Sparkles,
  Zap,
  RefreshCw,
  Clock,
  Flag,
  Trophy,
  Smile,
  Shield,
  ArrowRight,
  Settings,
  Database,
  Cloud,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { COUNTRIES, CountryOption } from '../data/countries';
import { getSupabaseCredentials, saveSupabaseCredentials } from '../lib/supabaseClient';

export interface PlayerInfo {
  id?: string;
  name: string;
  country: string;
  flag: string;
  rating: number;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderSide?: 'w' | 'b' | 'spectator';
  text: string;
  timestamp: number;
  isSystem?: boolean;
  country?: string;
}

export interface RoomState {
  roomId: string;
  roomName: string;
  timeControl: number;
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
  }>;
  whiteTime: number;
  blackTime: number;
  turn: 'w' | 'b';
  isStarted: boolean;
  isGameOver: boolean;
  gameResult: string | null;
  winner: 'w' | 'b' | 'draw' | null;
  drawOffer: 'w' | 'b' | null;
  rematchRequests: string[];
  messages: ChatMessage[];
}

interface LobbyRoomSummary {
  roomId: string;
  roomName: string;
  timeControl: number;
  playersCount: number;
  spectatorsCount: number;
  isStarted: boolean;
  isGameOver: boolean;
  whitePlayer: { name: string; country: string; flag: string } | null;
  blackPlayer: { name: string; country: string; flag: string } | null;
}

interface OnlineMultiplayerLobbyProps {
  socket: Socket | null;
  isConnected: boolean;
  activeRoom: RoomState | null;
  yourSide: 'w' | 'b' | 'spectator' | null;
  playerProfile: PlayerInfo;
  onUpdateProfile: (p: PlayerInfo) => void;
  onCreateRoom: (options: { roomName: string; timeControl: number; preferredSide: 'w' | 'b' | 'random' }) => void;
  onJoinRoom: (roomId: string) => void;
  onQuickMatch: () => void;
  onLeaveRoom: () => void;
  onSendChat: (text: string) => void;
}

export const OnlineMultiplayerLobby: React.FC<OnlineMultiplayerLobbyProps> = ({
  socket,
  isConnected,
  activeRoom,
  yourSide,
  playerProfile,
  onUpdateProfile,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  onLeaveRoom,
  onSendChat,
}) => {
  // Lobby state
  const [roomsList, setRoomsList] = useState<LobbyRoomSummary[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // New room parameters
  const [newRoomName, setNewRoomName] = useState('');
  const [newTimeControl, setNewTimeControl] = useState<number>(300);
  const [newPreferredSide, setNewPreferredSide] = useState<'w' | 'b' | 'random'>('random');

  // Profile editing
  const [editName, setEditName] = useState(playerProfile.name);
  const [editCountry, setEditCountry] = useState<CountryOption>(
    COUNTRIES.find((c) => c.code === playerProfile.country) || COUNTRIES[0]
  );

  // Chat input state
  const [chatInput, setChatInput] = useState('');

  // Supabase state
  const [supabaseCreds, setSupabaseCreds] = useState(getSupabaseCredentials());
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [customSupaUrl, setCustomSupaUrl] = useState(supabaseCreds.url);
  const [customSupaKey, setCustomSupaKey] = useState(supabaseCreds.key);

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(customSupaUrl.trim(), customSupaKey.trim());
    setSupabaseCreds(getSupabaseCredentials());
    setShowSupabaseModal(false);
  };

  // Fetch lobby rooms when socket connects / refreshes
  useEffect(() => {
    if (!socket) return;

    socket.emit('get_lobby_rooms');

    const handleLobbyRooms = (list: LobbyRoomSummary[]) => {
      setRoomsList(list);
    };

    const handleLobbyUpdate = () => {
      socket.emit('get_lobby_rooms');
    };

    socket.on('lobby_rooms_list', handleLobbyRooms);
    socket.on('lobby_room_updated', handleLobbyUpdate);

    return () => {
      socket.off('lobby_rooms_list', handleLobbyRooms);
      socket.off('lobby_room_updated', handleLobbyUpdate);
    };
  }, [socket]);

  // Handle URL room code auto join on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && isConnected && !activeRoom) {
      onJoinRoom(roomParam);
    }
  }, [isConnected, activeRoom, onJoinRoom]);

  const handleSaveProfile = () => {
    onUpdateProfile({
      ...playerProfile,
      name: editName.trim() || 'Player 1',
      country: editCountry.code,
      flag: editCountry.flag,
    });
    setShowProfileModal(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom({
      roomName: newRoomName.trim() || `${editName}'s Game`,
      timeControl: newTimeControl,
      preferredSide: newPreferredSide,
    });
    setShowCreateModal(false);
  };

  const [copiedCodeOnly, setCopiedCodeOnly] = useState(false);

  const copyRoomLink = () => {
    if (!activeRoom) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${activeRoom.roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyRoomCode = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.roomId);
    setCopiedCodeOnly(true);
    setTimeout(() => setCopiedCodeOnly(false), 2000);
  };

  const quickEmojis = ['👋', '👍', '🔥', '👏', '🧠', '👑', '😭', '🎯', '🤔', '☕'];

  return (
    <div className="w-full mb-6 font-sans">
      {/* Sleek Online Controls Bar (No Global Online Multiplayer Card) */}
      <div className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-[#FFCCE1] shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Connection Status & Supabase Cloud */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#FFF5D7] border border-[#FFCCE1]">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
              }`}
            />
            <span className="text-[11px] font-mono font-bold text-slate-700">
              {isConnected ? 'Online' : 'Serverless'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowSupabaseModal(true)}
            className={`text-[11px] font-mono px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              supabaseCreds.isConfigured
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#E195AB]" />
            <span>{supabaseCreds.isConfigured ? 'Cloud Connected' : 'Cloud Setup'}</span>
          </button>
        </div>

        {/* Right: Player Profile Badge & Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF5D7] border border-[#FFCCE1] hover:border-[#E195AB] transition-all cursor-pointer shadow-sm group"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">{playerProfile.flag}</span>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>{playerProfile.name || 'Player 1'}</span>
                <Trophy className="w-3 h-3 text-amber-500" />
              </div>
              <div className="text-[10px] font-mono text-[#E195AB] font-bold">
                Rating: {playerProfile.rating}
              </div>
            </div>
          </button>

          {!activeRoom ? (
            <button
              onClick={onQuickMatch}
              className="px-3.5 py-1.5 rounded-xl bg-[#E195AB] hover:bg-[#d88299] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Quick Match</span>
            </button>
          ) : (
            <button
              onClick={onLeaveRoom}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Leave Room
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Either Active Room View or Lobby View */}
      {!activeRoom ? (
        /* LOBBY VIEW */
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Action Cards (Quick Join, Create, Join Code) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Quick Create Room Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-white/95 to-[#FFF5D7]/80 border-2 border-[#FFCCE1] shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#E195AB]" />
                  <h3 className="font-bold text-slate-800 text-sm">Host a Game with Friend</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#E195AB] bg-[#FFCCE1]/40 px-2 py-0.5 rounded-full">
                  Instant Room
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Create a multiplayer room and send the 6-digit room code directly to your friend to play in real-time.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onCreateRoom({
                      roomName: `${playerProfile.name}'s Match`,
                      timeControl: 300,
                      preferredSide: 'random',
                    })
                  }
                  className="py-2.5 px-3 rounded-xl bg-[#E195AB] hover:bg-[#d88299] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>1-Click Host</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="py-2.5 px-3 rounded-xl bg-[#FFF5D7] hover:bg-[#FFCCE1] border border-[#FFCCE1] text-[#E195AB] font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#E195AB]" />
                  <span>Custom Settings</span>
                </button>
              </div>
            </div>

            {/* Join Code Card */}
            <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#FFCCE1] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-[#E195AB]" />
                <h3 className="font-bold text-slate-800 text-sm">Join by Room Code</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Got a 6-digit room code from a friend or streamer? Enter it below:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 782910"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#FFF5D7]/60 border border-[#FFCCE1] text-xs font-mono font-bold text-slate-800 tracking-widest uppercase focus:outline-none focus:border-[#E195AB]"
                />
                <button
                  disabled={joinCodeInput.length !== 6}
                  onClick={() => {
                    if (joinCodeInput.length === 6) {
                      onJoinRoom(joinCodeInput);
                      setJoinCodeInput('');
                    }
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                    joinCodeInput.length === 6
                      ? 'bg-[#E195AB] text-white shadow-md hover:bg-[#d88299]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Live Public Rooms Feed */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-white/90 backdrop-blur-md border-2 border-[#FFCCE1] shadow-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#FFCCE1]/60">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#E195AB]" />
                <h3 className="font-bold text-slate-800 text-sm">Live Matches</h3>
                <span className="text-[11px] font-mono font-bold bg-[#FFF5D7] text-[#E195AB] px-2 py-0.5 rounded-lg border border-[#FFCCE1]">
                  {roomsList.length} Active
                </span>
              </div>
              <button
                onClick={() => socket?.emit('get_lobby_rooms')}
                className="p-1.5 rounded-lg text-[#E195AB] hover:bg-[#FFF5D7] transition-colors cursor-pointer"
                title="Refresh Room List"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {roomsList.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Globe className="w-10 h-10 mx-auto mb-2 opacity-40 text-[#E195AB]" />
                <p className="text-xs font-bold text-slate-600 mb-1">No public rooms waiting right now</p>
                <p className="text-[11px] text-slate-400 mb-4">Be the first to host a game or use Quick Match!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#FFF5D7] text-[#E195AB] border border-[#FFCCE1] hover:bg-[#FFCCE1] text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Room</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {roomsList.map((r) => (
                  <div
                    key={r.roomId}
                    className="p-3.5 rounded-xl bg-[#FFF5D7]/40 border border-[#FFCCE1] hover:border-[#E195AB] hover:bg-[#FFF5D7]/80 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs text-slate-800">{r.roomName}</span>
                        <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-[#FFCCE1] text-slate-600 font-bold">
                          #{r.roomId}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#E195AB]" />
                          {r.timeControl === 0 ? '∞' : `${r.timeControl / 60}m`}
                        </span>
                      </div>

                      {/* Players */}
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{r.whitePlayer?.flag || '⏳'}</span>
                          <span className="font-bold text-[11px]">
                            {r.whitePlayer?.name || 'Waiting...'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">vs</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{r.blackPlayer?.flag || '⏳'}</span>
                          <span className="font-bold text-[11px]">
                            {r.blackPlayer?.name || 'Waiting...'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onJoinRoom(r.roomId)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                          r.playersCount < 2
                            ? 'bg-[#E195AB] text-white shadow-sm hover:bg-[#d88299]'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {r.playersCount < 2 ? (
                          <>
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Play</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-3.5 h-3.5" />
                            <span>Watch</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ACTIVE ONLINE ROOM BANNER & CHAT DRAWER */
        <div className="mt-4 space-y-4">
          {/* Room Control Bar */}
          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border-2 border-[#FFCCE1] shadow-md flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="px-3 py-1.5 rounded-xl bg-[#FFF5D7] border border-[#FFCCE1] text-xs font-mono font-bold text-slate-800 flex items-center gap-2">
                <span className="text-slate-500 font-sans font-medium">Room Code:</span>
                <span className="text-[#E195AB] text-base font-extrabold tracking-widest">{activeRoom.roomId}</span>
              </div>

              <button
                onClick={copyRoomCode}
                className="px-3 py-1.5 rounded-xl bg-[#E195AB] hover:bg-[#d88299] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copiedCodeOnly ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeOnly ? 'Code Copied!' : 'Copy Room Code'}</span>
              </button>

              <button
                onClick={onLeaveRoom}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave Room</span>
              </button>
            </div>

            {/* Players Status Bar */}
            <div className="flex items-center gap-6 text-xs font-bold text-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-base">{activeRoom.whitePlayer?.flag || '⚪'}</span>
                <div>
                  <div className="text-[11px] leading-tight">
                    {activeRoom.whitePlayer?.name || 'Waiting for player...'}
                  </div>
                  <div className="text-[10px] text-[#E195AB] font-mono font-bold">White ♔</div>
                </div>
              </div>

              <span className="text-xs text-slate-400 font-mono font-bold">VS</span>

              <div className="flex items-center gap-2">
                <span className="text-base">{activeRoom.blackPlayer?.flag || '⚫'}</span>
                <div>
                  <div className="text-[11px] leading-tight">
                    {activeRoom.blackPlayer?.name || 'Waiting for player...'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono font-bold">Black ♚</div>
                </div>
              </div>
            </div>
          </div>

          {/* Room Match Connection Banner */}
          {!activeRoom.whitePlayer || !activeRoom.blackPlayer ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-[#FFF5D7] border border-amber-300 text-amber-900 text-xs font-medium flex flex-wrap items-center justify-between gap-3 shadow-sm animate-pulse">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⏳</span>
                <div>
                  <div className="font-bold text-amber-950 text-xs">Waiting for your friend or opponent to join...</div>
                  <div className="text-[11px] text-amber-800">
                    Send them <strong>Room Code: {activeRoom.roomId}</strong> to join!
                  </div>
                </div>
              </div>
              <button
                onClick={copyRoomCode}
                className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Copy Code
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-sm">
              <span className="text-lg">🎮</span>
              <span>
                Opponent Connected! Match is live — <strong>{activeRoom.whitePlayer.name}</strong> (White) vs <strong>{activeRoom.blackPlayer.name}</strong> (Black).
              </span>
            </div>
          )}

          {/* Real-time Global Chat & Quick Emoji Drawer */}
          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-[#FFCCE1] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#FFCCE1]/60 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <MessageSquare className="w-4 h-4 text-[#E195AB]" />
                <span>Live Game Chat & Reactions</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-bold">
                Global Stream
              </span>
            </div>

            {/* Messages Feed */}
            <div className="h-28 overflow-y-auto space-y-1.5 pr-2 font-sans text-xs">
              {activeRoom.messages.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No messages yet. Send a greeting or emoji!</p>
              ) : (
                activeRoom.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-1.5 rounded-lg text-[11px] leading-tight ${
                      m.isSystem
                        ? 'bg-[#FFF5D7] text-slate-700 font-semibold border border-[#FFCCE1]'
                        : 'bg-slate-50 text-slate-800'
                    }`}
                  >
                    {!m.isSystem && (
                      <span className="font-bold text-[#E195AB] mr-1.5">
                        {m.country ? COUNTRIES.find((c) => c.code === m.country)?.flag + ' ' : ''}
                        {m.senderName}:
                      </span>
                    )}
                    <span>{m.text}</span>
                  </div>
                ))
              )}
            </div>

            {/* Quick Emoji Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-[#FFCCE1]/40">
              <span className="text-[10px] text-slate-400 font-bold mr-1">React:</span>
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSendChat(emoji)}
                  className="px-2 py-1 rounded-lg bg-[#FFF5D7] hover:bg-[#FFCCE1] text-xs transition-transform hover:scale-110 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Message Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (chatInput.trim()) {
                  onSendChat(chatInput);
                  setChatInput('');
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-[#FFCCE1] text-xs font-sans text-slate-800 focus:outline-none focus:border-[#E195AB]"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-[#E195AB] hover:bg-[#d88299] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ROOM MODAL */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md p-6 rounded-3xl bg-white shadow-2xl border-2 border-[#FFCCE1]"
              >
                <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#E195AB]" />
                  <span>Host Room</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Configure your room parameters and invite players from around the world.
                </p>

                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Room Name</label>
                    <input
                      type="text"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder={`${playerProfile.name}'s Match`}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FFF5D7]/50 border border-[#FFCCE1] text-xs font-bold text-slate-800 focus:outline-none focus:border-[#E195AB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Timer Format</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { val: 0, label: '∞ Unlimited' },
                        { val: 180, label: '3m Blitz' },
                        { val: 300, label: '5m Rapid' },
                        { val: 600, label: '10m Classical' },
                      ].map((tc) => (
                        <button
                          type="button"
                          key={tc.val}
                          onClick={() => setNewTimeControl(tc.val)}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            newTimeControl === tc.val
                              ? 'bg-[#E195AB] text-white border-[#E195AB] shadow-sm'
                              : 'bg-[#FFF5D7]/60 text-slate-700 border-[#FFCCE1]'
                          }`}
                        >
                          {tc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Side Preference</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: 'random', label: '🎲 Random' },
                        { val: 'w', label: '♔ White' },
                        { val: 'b', label: '♚ Black' },
                      ].map((side) => (
                        <button
                          type="button"
                          key={side.val}
                          onClick={() => setNewPreferredSide(side.val as 'w' | 'b' | 'random')}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            newPreferredSide === side.val
                              ? 'bg-[#E195AB] text-white border-[#E195AB] shadow-sm'
                              : 'bg-[#FFF5D7]/60 text-slate-700 border-[#FFCCE1]'
                          }`}
                        >
                          {side.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#E195AB] hover:bg-[#d88299] text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      Create & Host
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* EDIT PLAYER PROFILE & COUNTRY MODAL */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showProfileModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md p-6 rounded-3xl bg-white shadow-2xl border-2 border-[#FFCCE1]"
              >
                <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#E195AB]" />
                  <span>Player Profile & Country Flag</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Select your name and country flag to represent your nation in online matches.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Player Display Name</label>
                    <input
                      type="text"
                      maxLength={20}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FFF5D7]/60 border border-[#FFCCE1] text-xs font-bold text-slate-800 focus:outline-none focus:border-[#E195AB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Country</label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {COUNTRIES.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setEditCountry(c)}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer text-left ${
                            editCountry.code === c.code
                              ? 'bg-[#E195AB] text-white border-[#E195AB] shadow-sm'
                              : 'bg-[#FFF5D7]/40 text-slate-700 border-[#FFCCE1] hover:bg-[#FFCCE1]/50'
                          }`}
                        >
                          <span className="text-lg">{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="px-5 py-2 rounded-xl bg-[#E195AB] hover:bg-[#d88299] text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      Save Profile
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* SUPABASE CLOUD MULTIPLAYER CONFIG MODAL */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showSupabaseModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg p-6 rounded-3xl bg-white shadow-2xl border-2 border-[#FFCCE1]"
              >
                <div className="flex items-center justify-between mb-3 border-b border-[#FFCCE1] pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-6 h-6 text-[#E195AB]" />
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Supabase Realtime Cloud Settings</h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Powers serverless chess multiplayer on Vercel & custom domain
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-[#FFF5D7] text-[#E195AB] border border-[#FFCCE1] px-2.5 py-1 rounded-full">
                    {supabaseCreds.isConfigured ? 'Connected' : 'Not Configured'}
                  </span>
                </div>

                <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-amber-600" />
                    <span>Why use Supabase on Vercel?</span>
                  </div>
                  <p>
                    Vercel static deployments don't support traditional Node Socket.io connections. By connecting Supabase Realtime, chess rooms work <strong>100% serverlessly</strong> across all browsers without crashing on refresh!
                  </p>
                </div>

                <form onSubmit={handleSaveSupabase} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Supabase Project URL</label>
                    <input
                      type="url"
                      placeholder="https://your-project.supabase.co"
                      value={customSupaUrl}
                      onChange={(e) => setCustomSupaUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FFF5D7]/40 border border-[#FFCCE1] text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#E195AB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Supabase Anon Key</label>
                    <input
                      type="text"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={customSupaKey}
                      onChange={(e) => setCustomSupaKey(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FFF5D7]/40 border border-[#FFCCE1] text-xs font-mono text-slate-800 focus:outline-none focus:border-[#E195AB]"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800">💡 Quick Setup for Vercel Deployment:</p>
                    <p>In your Vercel Dashboard → Project Settings → Environment Variables, add:</p>
                    <div className="font-mono text-[10px] bg-slate-200/70 p-2 rounded-xl space-y-0.5">
                      <div>VITE_SUPABASE_URL = https://your-project.supabase.co</div>
                      <div>VITE_SUPABASE_ANON_KEY = your-anon-key</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        saveSupabaseCredentials('', '');
                        setCustomSupaUrl('');
                        setCustomSupaKey('');
                        setSupabaseCreds(getSupabaseCredentials());
                      }}
                      className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Clear Credentials
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowSupabaseModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#E195AB] hover:bg-[#d88299] text-white text-xs font-bold shadow-md cursor-pointer"
                      >
                        Save & Connect
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
};
