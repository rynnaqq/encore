import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Hash, Trophy, Copy, Check, User, Activity, AlertCircle, Database, Cloud } from 'lucide-react';
import { getSupabaseCredentials } from '../lib/supabaseClient';
import { subscribeToGlobalLobby } from "../lib/supabaseChess";
import { createPortal } from 'react-dom';

export interface PlayerInfo {
  name: string;
  country: string;
  flag: string;
  rating?: number;
  id?: string;
  joinedAt?: number;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  country?: string;
}

export interface LobbyRoomSummary {
  isPublic?: boolean;
  roomId: string;
  roomName: string;
  timeControl: number;
  playersCount: number;
  spectatorsCount: number;
  isStarted: boolean;
  isGameOver: boolean;
  whitePlayer: PlayerInfo | null;
  blackPlayer: PlayerInfo | null;
}

export interface RoomState {
  isPublic?: boolean;
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
  messages: ChatMessage[];
  rematchRequests?: Record<string, boolean>;
}

interface OnlineMultiplayerLobbyProps {
  socket: any;
  isConnected: boolean;
  activeRoom: RoomState | null;
  yourSide: 'w' | 'b' | 'spectator' | null;
  playerProfile: PlayerInfo;
  onUpdateProfile: (name: string, country: string) => void;
  onCreateRoom: (opts: { roomName: string; timeControl: number; isPublic: boolean }) => void;
  onJoinRoom: (code: string) => void;
  onQuickMatch: () => void;
  onLeaveRoom: () => void;
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
}) => {
  const [roomsList, setRoomsList] = useState<LobbyRoomSummary[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [customName, setCustomName] = useState(playerProfile.name);
  const [customCountry, setCustomCountry] = useState(playerProfile.country);
  const [joinCode, setJoinCode] = useState('');
  const [copiedCodeOnly, setCopiedCodeOnly] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [timeControl, setTimeControl] = useState(10);
  const [isPublic, setIsPublic] = useState(true);

  const supabaseCreds = getSupabaseCredentials();

  useEffect(() => {
    const supaCreds = getSupabaseCredentials();
    
    if (supaCreds.isConfigured) {
      const channel = subscribeToGlobalLobby((list) => {
        setRoomsList(list);
      });
      return () => {
        if (channel) {
          channel.untrack();
          channel.unsubscribe();
        }
      };
    } else {
      if (!socket) return;
      socket.emit('get_lobby_rooms');
      const handleLobbyRooms = (list: LobbyRoomSummary[]) => setRoomsList(list);
      const handleLobbyUpdate = () => socket.emit('get_lobby_rooms');
      socket.on('lobby_rooms_list', handleLobbyRooms);
      socket.on('lobby_room_updated', handleLobbyUpdate);
      const interval = setInterval(() => {
        if (socket.connected) socket.emit('get_lobby_rooms');
      }, 3000);
      return () => {
        socket.off('lobby_rooms_list', handleLobbyRooms);
        socket.off('lobby_room_updated', handleLobbyUpdate);
        clearInterval(interval);
      };
    }
  }, [socket, supabaseCreds.isConfigured]);

  const handleSaveProfile = () => {
    onUpdateProfile(customName || 'Player', customCountry);
    setShowProfileModal(false);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom({ roomName: newRoomName || 'New Room', timeControl, isPublic });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) onJoinRoom(joinCode.trim());
  };

  return (
    <div className="w-full mb-6 font-sans">
      <div className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-[#FFCCE1] shadow-sm flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#FFF5D7] border border-[#FFCCE1]">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-emerald-500'}`} />
            <span className="text-[11px] font-mono font-bold text-slate-700">
              {supabaseCreds.isConfigured ? 'Serverless' : (isConnected ? 'Online' : 'Offline')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF5D7] border border-[#FFCCE1] hover:border-[#E195AB] transition-all cursor-pointer shadow-sm group"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">{playerProfile.flag}</span>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>{playerProfile.name || 'Player'}</span>
                <Trophy className="w-3 h-3 text-amber-500" />
              </div>
              <div className="text-[10px] font-mono text-[#E195AB] font-bold">Rating: {playerProfile.rating}</div>
            </div>
          </button>
        </div>
      </div>

      {activeRoom ? (
        <div className="bg-white/80 p-5 rounded-3xl border border-[#FFCCE1]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E195AB]" /> {activeRoom.roomName}
            </h3>
            <div className="flex items-center gap-2 bg-[#FFF5D7] px-3 py-1.5 rounded-xl border border-[#FFCCE1]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Room Code</span>
              <span className="text-sm font-mono font-bold text-slate-800">{activeRoom.roomId}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + window.location.pathname + '?room=' + activeRoom.roomId);
                  setCopiedCodeOnly(true);
                  setTimeout(() => setCopiedCodeOnly(false), 2000);
                }}
                className="p-1 hover:bg-[#FFCCE1]/50 rounded-lg transition-colors cursor-pointer text-[#E195AB]"
                title="Copy Invite Link"
              >
                {copiedCodeOnly ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg">{activeRoom.whitePlayer?.flag || '⚪'}</div>
                 <div>
                   <div className="font-bold text-xs text-slate-800">{activeRoom.whitePlayer?.name || 'Waiting...'}</div>
                   <div className="text-[10px] text-slate-500">White • {activeRoom.timeControl} min</div>
                 </div>
               </div>
            </div>
            
            <div className="flex items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">VS</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg">{activeRoom.blackPlayer?.flag || '⚫'}</div>
                 <div>
                   <div className="font-bold text-xs text-white">{activeRoom.blackPlayer?.name || 'Waiting...'}</div>
                   <div className="text-[10px] text-slate-400">Black • {activeRoom.timeControl} min</div>
                 </div>
               </div>
            </div>
          </div>
          
          <div className="mt-5 flex justify-end">
            <button onClick={onLeaveRoom} className="px-4 py-2 bg-rose-50 text-rose-600 font-bold text-xs rounded-xl hover:bg-rose-100">
              Leave Room
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/80 p-5 rounded-3xl border border-[#FFCCE1]">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-[#E195AB]" /> Create Room</h3>
            <form onSubmit={handleCreateRoom} className="space-y-3">
              <input type="text" placeholder="Room Name" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
              <div className="flex gap-2">
                <select value={timeControl} onChange={e => setTimeControl(Number(e.target.value))} className="px-3 py-2 border rounded-xl text-xs w-1/2">
                  <option value={3}>3 min</option>
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={30}>30 min</option>
                </select>
                <select value={isPublic ? 'public' : 'private'} onChange={e => setIsPublic(e.target.value === 'public')} className="px-3 py-2 border rounded-xl text-xs w-1/2">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-[#E195AB] text-white font-bold text-xs rounded-xl hover:bg-[#d88299]">Create Room</button>
            </form>

            <h3 className="text-sm font-bold text-slate-800 mt-6 mb-4 flex items-center gap-2"><Hash className="w-4 h-4 text-[#E195AB]" /> Join by Code</h3>
            <form onSubmit={handleJoin} className="flex gap-2">
              <input type="text" placeholder="Room Code" value={joinCode} onChange={e => setJoinCode(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs uppercase" />
              <button type="submit" className="px-4 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-700">Join</button>
            </form>
          </div>

          <div className="bg-white/80 p-5 rounded-3xl border border-[#FFCCE1]">
             <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-[#E195AB]" /> Public Rooms</span>
                <span className="text-xs font-mono bg-[#FFF5D7] px-2 py-1 rounded-full">{roomsList.length} Active</span>
             </h3>
             <div className="space-y-2 h-64 overflow-y-auto pr-1">
                {roomsList.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">No public rooms available</div>
                ) : (
                  roomsList.filter(r => r.isPublic !== false).map(r => (
                    <div key={r.roomId} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-[#FFCCE1] transition-all">
                      <div>
                        <div className="font-bold text-xs text-slate-800">{r.roomName || 'Unnamed Room'}</div>
                        <div className="text-[10px] text-slate-500">{r.timeControl} min • {r.playersCount}/2 Players</div>
                      </div>
                      <button onClick={() => onJoinRoom(r.roomId)} disabled={r.playersCount >= 2} className="px-3 py-1.5 bg-[#FFF5D7] text-[#d88299] font-bold text-[10px] rounded-lg disabled:opacity-50">
                        {r.playersCount >= 2 ? 'Full' : 'Join'}
                      </button>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      )}

      {/* PROFILE CONFIG MODAL */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showProfileModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm p-5 rounded-3xl bg-white shadow-2xl border-2 border-[#FFCCE1]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-[#E195AB]" />
                  <h3 className="text-sm font-bold text-slate-800">Your Chess Identity</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
                    <input type="text" maxLength={15} value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#E195AB]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                    <select value={customCountry} onChange={(e) => setCustomCountry(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#E195AB] appearance-none">
                      <option value="ID">🇮🇩 Indonesia</option>
                      <option value="US">🇺🇸 United States</option>
                      <option value="GB">🇬🇧 United Kingdom</option>
                      <option value="JP">🇯🇵 Japan</option>
                      <option value="KR">🇰🇷 South Korea</option>
                      <option value="FR">🇫🇷 France</option>
                      <option value="DE">🇩🇪 Germany</option>
                      <option value="IN">🇮🇳 India</option>
                      <option value="BR">🇧🇷 Brazil</option>
                      <option value="RU">🇷🇺 Russia</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowProfileModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 cursor-pointer">Cancel</button>
                    <button type="button" onClick={handleSaveProfile} className="px-5 py-2 rounded-xl bg-[#E195AB] hover:bg-[#d88299] text-white text-xs font-bold shadow-md cursor-pointer">Save Profile</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
