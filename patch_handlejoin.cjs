const fs = require('fs');
const file = 'src/components/ChessGameSection.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldSig = 'const handleJoinSupabaseRoom = useCallback(\n    (code: string, isJoining: boolean = false) => {';
const newSig = 'const handleJoinSupabaseRoom = useCallback(\n    (code: string, isJoining: boolean = false, opts?: { roomName: string; timeControl: number; isPublic: boolean }) => {';
content = content.replace(oldSig, newSig);

const oldSub = `      const handler = subscribeSupabaseChessRoom({
        roomId: code,
        playerProfile,
        onRoomUpdate: handleSupabaseRoomUpdate,`;
const newSub = `      const handler = subscribeSupabaseChessRoom({
        roomId: code,
        playerProfile,
        opts,
        onRoomUpdate: handleSupabaseRoomUpdate,`;
content = content.replace(oldSub, newSub);

// Now change the call site in onCreateRoom
const oldCreateRoom = `            onCreateRoom={(opts) => {
              const code = generateRoomCode();
              const supaCreds = getSupabaseCredentials();
              if (supaCreds.isConfigured) {
                handleJoinSupabaseRoom(code);
              }`;
const newCreateRoom = `            onCreateRoom={(opts) => {
              const code = generateRoomCode();
              const supaCreds = getSupabaseCredentials();
              if (supaCreds.isConfigured) {
                handleJoinSupabaseRoom(code, false, opts);
              }`;
content = content.replace(oldCreateRoom, newCreateRoom);

fs.writeFileSync(file, content);
