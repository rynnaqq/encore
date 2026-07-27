import React, { useState, useEffect } from 'react';
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
  Share2,
  Trophy,
  Smile,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { COUNTRIES, CountryOption } from '../data/countries';

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

  // Chat input
  const [chatInput, setChatInput] = useState('');

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
      name: editName.trim() || 'Grandmaster',
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

  const copyRoomLink = () => {
    if (!activeRoom) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${activeRoom.roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const quickEmojis = ['👋', '👍', '🔥', '👏', '🧠', '👑', '😭', '🎯', '🤔', '☕'];

  return (
    <div className="w-full mb-6 font-sans">
      {/* Network Status & Profile Header Bar */}
      <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xl border-2 border-[#FFCCE1] shadow-lg flex flex-wrap items-center justify-between gap-4">
        {/* Left: Global Connection Indicator */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E195AB] to-[#FFCCE1] text-white flex items-center justify-center shadow-md">
              <Globe className="w-5 h-5 animate-spin-slow" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                isConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
              }`}
            />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>Global Online Multiplayer</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                  isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {isConnected ? 'Live Connected' : 'Connecting...'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Play real-time chess with players across 30+ countries!
            </p>
          </div>
        </div>

        {/* Right: Player Profile Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF5D7] border border-[#FFCCE1] hover:border-[#E195AB] transition-all cursor-pointer shadow-sm group"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">{playerProfile.flag}</span>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>{playerProfile.name}</span>
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
              className="px-4 py-2 rounded-xl bg-[#E195AB] hover:bg-[#d88299] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Quick Match</span>
            </button>
          ) : (
            <button
              onClick={onLeaveRoom}
              className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
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
                  <h3 className="font-bold text-slate-800 text-sm">Host a Custom Game</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#E195AB] bg-[#FFCCE1]/40 px-2 py-0.5 rounded-full">
                  Instant Link
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Create a custom chess room with your choice of timer and side, then send the 6-digit room code or link to any opponent in the world.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full py-2.5 rounded-xl bg-[#E195AB] hover:bg-[#d88299] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Room</span>
              </button>
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
                <h3 className="font-bold text-slate-800 text-sm">Live Global Matches</h3>
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
                  <span>Create Global Room</span>
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
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-[#FFF5D7] border border-[#FFCCE1] text-xs font-mono font-bold text-slate-800 flex items-center gap-2">
                <span className="text-slate-500">Room Code:</span>
                <span className="text-[#E195AB] text-sm tracking-wider">{activeRoom.roomId}</span>
              </div>

              <button
                onClick={copyRoomLink}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Link Copied!' : 'Share Room Link'}</span>
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
                  <div className="text-[10px] text-slate-400 font-mono">White</div>
                </div>
              </div>

              <span className="text-xs text-slate-400 font-mono font-bold">VS</span>

              <div className="flex items-center gap-2">
                <span className="text-base">{activeRoom.blackPlayer?.flag || '⚫'}</span>
                <div>
                  <div className="text-[11px] leading-tight">
                    {activeRoom.blackPlayer?.name || 'Waiting for player...'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Black</div>
                </div>
              </div>
            </div>
          </div>

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
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white shadow-2xl border-2 border-[#FFCCE1]"
            >
              <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#E195AB]" />
                <span>Host Global Room</span>
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
      </AnimatePresence>

      {/* EDIT PLAYER PROFILE & COUNTRY MODAL */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
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
      </AnimatePresence>
    </div>
  );
};
