import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Hash, Trophy, Copy, Check, User, Activity, RefreshCw, AlertCircle, Database, Cloud } from 'lucide-react';
import { getSupabaseCredentials } from '../lib/supabaseClient';
import { AdminBadge, isAdminName, DeveloperBadge, isDeveloperName } from './AdminBadge';
import { subscribeToGlobalLobby } from "../lib/supabaseChess";
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';

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
  const { currentUser, openLoginModal } = useAuth();
  const [roomsList, setRoomsList] = useState<LobbyRoomSummary[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [customName, setCustomName] = useState(playerProfile.name);
  const [customCountry, setCustomCountry] = useState(playerProfile.country);

  useEffect(() => {
    if (showProfileModal) {
      setCustomName(playerProfile.name);
      setCustomCountry(playerProfile.country);
    }
  }, [showProfileModal, playerProfile]);
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
      }, 10000);

      const handleManualRefresh = () => {
        if (socket.connected) socket.emit('get_lobby_rooms');
      };
      window.addEventListener('manual_refresh_rooms', handleManualRefresh);
      return () => {
        socket.off('lobby_rooms_list', handleLobbyRooms);
        socket.off('lobby_room_updated', handleLobbyUpdate);
        clearInterval(interval);
        window.removeEventListener('manual_refresh_rooms', handleManualRefresh);
      };
    }
  }, [socket, supabaseCreds.isConfigured]);

  const handleSaveProfile = () => {
    onUpdateProfile(customName || 'Player', customCountry);
    setShowProfileModal(false);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openLoginModal();
      return;
    }
    onCreateRoom({ roomName: newRoomName || 'New Room', timeControl, isPublic });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openLoginModal();
      return;
    }
    if (joinCode.trim()) onJoinRoom(joinCode.trim());
  };

  return (
    <div className="w-full mb-6 font-sans">
      <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-[#FFCCE1] dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#FFF5D7] dark:bg-slate-800 border border-[#FFCCE1] dark:border-slate-700">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-emerald-500'}`} />
            <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
              {supabaseCreds.isConfigured ? 'Serverless' : (isConnected ? 'Online' : 'Offline')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF5D7] dark:bg-slate-800 border border-[#FFCCE1] dark:border-slate-700 hover:border-[#E195AB] dark:hover:border-slate-600 transition-all cursor-pointer shadow-sm group"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">{playerProfile.flag}</span>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <span>{playerProfile.name || 'Player'}</span>
                {isDeveloperName(playerProfile.name) && <DeveloperBadge />}{!isDeveloperName(playerProfile.name) && isAdminName(playerProfile.name) && <AdminBadge />}
                <Trophy className="w-3 h-3 text-amber-500" />
              </div>
              <div className="text-[10px] font-mono text-[#E195AB] dark:text-[#FFCCE1] font-bold">Rating: {playerProfile.rating}</div>
            </div>
          </button>
        </div>
      </div>

      {activeRoom ? (
        !activeRoom.isStarted && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-6 rounded-3xl border-2 border-[#FFCCE1] dark:border-slate-800 shadow-xl relative overflow-hidden">
          {/* Background animation if not started */}
          {!activeRoom.isStarted && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-10">
              <div className="w-[400px] h-[400px] bg-[#E195AB] rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            </div>
          )}
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {!activeRoom.isStarted ? (
                  <>
                    <Activity className="w-5 h-5 text-[#E195AB] animate-pulse" /> Mencari Lawan...
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5 text-[#E195AB]" /> {activeRoom.roomName}
                  </>
                )}
              </h3>
              
              {!activeRoom.isStarted && (
                <div className="flex items-center gap-2 bg-[#FFF5D7] dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-[#FFCCE1] dark:border-slate-700 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Room Code</span>
                  <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100">{activeRoom.roomId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + window.location.pathname + '?room=' + activeRoom.roomId);
                      setCopiedCodeOnly(true);
                      setTimeout(() => setCopiedCodeOnly(false), 2000);
                    }}
                    className="p-1 hover:bg-[#FFCCE1]/50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer text-[#E195AB] dark:text-[#FFCCE1]"
                    title="Copy Invite Link"
                  >
                    {copiedCodeOnly ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 my-8">
              {/* White Player */}
              <div className="relative flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-2 border-[#FFCCE1] dark:border-slate-800 flex items-center justify-center text-4xl z-10">
                  {activeRoom.whitePlayer?.flag || '⚪'}
                </div>
                <div className="mt-3 text-center">
                  <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1">
                    <span>{activeRoom.whitePlayer?.name || 'Menunggu...'}</span>
                    {isDeveloperName(activeRoom.whitePlayer?.name) && <DeveloperBadge />}
                    {!isDeveloperName(activeRoom.whitePlayer?.name) && isAdminName(activeRoom.whitePlayer?.name) && <AdminBadge />}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Putih</div>
                </div>
                {!activeRoom.whitePlayer && (
                  <div className="absolute inset-0 rounded-2xl border-4 border-[#E195AB] border-dashed animate-[spin_4s_linear_infinite] opacity-30" />
                )}
              </div>

              {/* VS Badge */}
              <div className="flex items-center justify-center relative">
                <div className="w-12 h-12 rounded-full bg-[#FFF5D7] dark:bg-slate-800 border-2 border-[#FFCCE1] dark:border-slate-700 flex items-center justify-center shadow-inner z-10">
                  <span className="text-xs font-black text-[#E195AB] dark:text-[#FFCCE1]">VS</span>
                </div>
                {!activeRoom.isStarted && (
                  <div className="absolute w-24 h-24 bg-[#FFCCE1]/50 dark:bg-slate-700/50 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                )}
              </div>

              {/* Black Player */}
              <div className="relative flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-900 shadow-lg border-2 border-slate-700 flex items-center justify-center text-4xl z-10">
                  {activeRoom.blackPlayer?.flag || '⚫'}
                </div>
                <div className="mt-3 text-center">
                  <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1">
                    <span>{activeRoom.blackPlayer?.name || 'Menunggu...'}</span>
                    {isDeveloperName(activeRoom.blackPlayer?.name) && <DeveloperBadge />}
                    {!isDeveloperName(activeRoom.blackPlayer?.name) && isAdminName(activeRoom.blackPlayer?.name) && <AdminBadge />}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Hitam</div>
                </div>
                {!activeRoom.blackPlayer && (
                  <div className="absolute inset-0 rounded-2xl border-4 border-slate-400 border-dashed animate-[spin_4s_linear_infinite] opacity-30" />
                )}
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between border-t border-[#FFCCE1] dark:border-slate-800/50 pt-4">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#E195AB]" />
                {activeRoom.isStarted ? 'Pertandingan Berlangsung' : 'Menunggu Lawan...'}
              </div>
              <button onClick={onLeaveRoom} className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold text-xs rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/80 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer">
                Batalkan
              </button>
            </div>
          </div>
        </div>
        )
      ) : (
        <div className="space-y-4">
          {/* Cari Lawan Cepat / Quick Match Banner */}
          <div className="bg-gradient-to-r from-[#E195AB] to-[#d88299] p-4 sm:p-6 rounded-3xl shadow-lg flex flex-col md:flex-row items-center justify-between text-white relative overflow-hidden">
            <div className="relative z-10 text-center md:text-left mb-3 sm:mb-4 md:mb-0">
              <h2 className="text-xl sm:text-2xl font-black mb-1 flex items-center justify-center md:justify-start gap-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" /> Cari Lawan Cepat
              </h2>
              <p className="text-white/80 font-medium text-xs sm:text-sm">Temukan lawan secara instan dari seluruh dunia!</p>
            </div>
            <button 
              onClick={onQuickMatch}
              className="relative z-10 w-full md:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-white dark:bg-slate-900 text-[#E195AB] dark:text-[#FFCCE1] font-extrabold rounded-2xl hover:bg-[#FFF5D7] dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
            >
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              Mulai Matchmaking
            </button>
            {/* Minimalist BG Decoration */}
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
              <Users className="w-48 h-48" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/90 dark:bg-slate-900/90 p-4 sm:p-5 rounded-3xl border border-[#FFCCE1] dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-[#E195AB]" /> Buat Room Baru</h3>
            <form onSubmit={handleCreateRoom} className="space-y-3">
              <input type="text" placeholder="Nama Room (opsional)" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs outline-none focus:border-[#E195AB]" />
              <div className="flex gap-2">
                <select value={timeControl} onChange={e => setTimeControl(Number(e.target.value))} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs w-1/2 outline-none">
                  <option value={3}>3 Menit</option>
                  <option value={5}>5 Menit</option>
                  <option value={10}>10 Menit</option>
                  <option value={30}>30 Menit</option>
                </select>
                <select value={isPublic ? 'public' : 'private'} onChange={e => setIsPublic(e.target.value === 'public')} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs w-1/2 outline-none">
                  <option value="public">Publik</option>
                  <option value="private">Privat</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#E195AB] text-white font-bold text-xs rounded-xl hover:bg-[#d88299] transition-colors cursor-pointer shadow-sm">Buat Room</button>
            </form>

            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-6 mb-4 flex items-center gap-2"><Hash className="w-4 h-4 text-[#E195AB]" /> Masuk dengan Kode</h3>
            <form onSubmit={handleJoin} className="flex gap-2">
              <input type="text" placeholder="Kode Room" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs uppercase font-mono font-bold outline-none focus:border-[#E195AB]" />
              <button type="submit" className="px-5 bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors cursor-pointer shadow-sm">Masuk</button>
            </form>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/90 p-4 sm:p-5 rounded-3xl border border-[#FFCCE1] dark:border-slate-800">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#E195AB]" /> Room Publik
                  <span className="text-xs font-mono bg-[#FFF5D7] dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-[#FFCCE1]/50 dark:border-slate-700 px-2 py-0.5 rounded-full">{roomsList.length} Aktif</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const event = new CustomEvent('manual_refresh_rooms');
                    window.dispatchEvent(event);
                  }}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
                  title="Segarkan Room"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
             </div>
             <div className="space-y-2 h-64 overflow-y-auto pr-1">
                {roomsList.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">Belum ada room publik yang aktif</div>
                ) : (
                  roomsList.filter(r => r.isPublic !== false).map(r => (
                    <div key={r.roomId} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-[#FFCCE1] dark:hover:border-slate-600 transition-all">
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-100">{r.roomName || 'Room Match'}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{r.timeControl} mnt • {r.playersCount}/2 Pemain</div>
                      </div>
                      <button onClick={() => onJoinRoom(r.roomId)} className="px-3 py-1.5 bg-[#FFF5D7] dark:bg-slate-700 text-[#d88299] dark:text-[#FFCCE1] font-bold text-[10px] rounded-lg hover:bg-[#ffe3ea] dark:hover:bg-slate-600 transition-colors cursor-pointer">
                        {r.playersCount >= 2 ? 'Tonton' : 'Masuk'}
                      </button>
                    </div>
                  ))
                )}
             </div>
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
                className="w-full max-w-sm p-5 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border-2 border-[#FFCCE1] dark:border-slate-800"
              >
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-[#E195AB]" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Your Chess Identity</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Display Name (Terkunci)</label>
                    <input type="text" value={customName} disabled readOnly className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                    <p className="text-[10px] text-slate-400 mt-1">Username disamakan dengan akun login Anda.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                    <select value={customCountry} onChange={(e) => setCustomCountry(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#E195AB] appearance-none">
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
                    <button type="button" onClick={() => setShowProfileModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 cursor-pointer">Cancel</button>
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
