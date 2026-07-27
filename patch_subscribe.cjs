const fs = require('fs');
const file = 'src/lib/supabaseChess.ts';
let content = fs.readFileSync(file, 'utf8');

const oldSig = `export function subscribeSupabaseChessRoom({
  roomId,
  playerProfile,
  onRoomUpdate,
  onChatMessage,
  onYourSideAssigned,
  onError,
  isJoining = false,
}: {
  roomId: string;
  playerProfile: PlayerInfo;
  onRoomUpdate: (room: RoomState) => void;
  onChatMessage: (msg: ChatMessage) => void;
  onYourSideAssigned: (side: 'w' | 'b' | 'spectator') => void;
  onError: (msg: string) => void;
  isJoining?: boolean;
}): SupabaseRoomHandler | null {`;

const newSig = `export function subscribeSupabaseChessRoom({
  roomId,
  playerProfile,
  opts,
  onRoomUpdate,
  onChatMessage,
  onYourSideAssigned,
  onError,
  isJoining = false,
}: {
  roomId: string;
  playerProfile: PlayerInfo;
  opts?: { roomName: string; timeControl: number; isPublic: boolean };
  onRoomUpdate: (room: RoomState) => void;
  onChatMessage: (msg: ChatMessage) => void;
  onYourSideAssigned: (side: 'w' | 'b' | 'spectator') => void;
  onError: (msg: string) => void;
  isJoining?: boolean;
}): SupabaseRoomHandler | null {`;

content = content.replace(oldSig, newSig);

const oldInitial = `  let currentRoomState: RoomState = {
    roomId,
    roomName: \`Match #\${roomId}\`,
    timeControl: 300,`;

const newInitial = `  let currentRoomState: RoomState = {
    roomId,
    roomName: opts?.roomName || \`Match #\${roomId}\`,
    timeControl: opts?.timeControl || 10,
    isPublic: opts?.isPublic !== false,`;

content = content.replace(oldInitial, newInitial);

fs.writeFileSync(file, content);
