const fs = require('fs');
const file = 'src/components/ChessGameSection.tsx';
let content = fs.readFileSync(file, 'utf8');

const hookStr = `  // Publish active room to global lobby for Supabase Serverless
  useEffect(() => {
    const supaCreds = getSupabaseCredentials();
    if (!supaCreds.isConfigured) return;

    if (activeRoom && !activeRoom.isGameOver) {
      publishRoomToGlobalLobby({
        roomId: activeRoom.roomId,
        roomName: activeRoom.roomName,
        timeControl: activeRoom.timeControl,
        playersCount: (activeRoom.whitePlayer ? 1 : 0) + (activeRoom.blackPlayer ? 1 : 0),
        spectatorsCount: activeRoom.spectators.length,
        isStarted: activeRoom.isStarted,
        isGameOver: activeRoom.isGameOver,
        whitePlayer: activeRoom.whitePlayer ? { name: activeRoom.whitePlayer.name, country: activeRoom.whitePlayer.country, flag: activeRoom.whitePlayer.flag } : null,
        blackPlayer: activeRoom.blackPlayer ? { name: activeRoom.blackPlayer.name, country: activeRoom.blackPlayer.country, flag: activeRoom.blackPlayer.flag } : null,
      });
    } else {
      publishRoomToGlobalLobby(null);
    }
  }, [activeRoom]);
`;

content = content.replace('const [activeRoom, setActiveRoom] = useState<RoomState | null>(null);', 'const [activeRoom, setActiveRoom] = useState<RoomState | null>(null);\n' + hookStr);
fs.writeFileSync(file, content);
