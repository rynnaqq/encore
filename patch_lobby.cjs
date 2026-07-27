const fs = require('fs');
const file = 'src/components/OnlineMultiplayerLobby.tsx';
let content = fs.readFileSync(file, 'utf8');

const hookStr = `  // Fetch lobby rooms when socket connects / refreshes or Supabase is used
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

      const handleLobbyRooms = (list: LobbyRoomSummary[]) => {
        setRoomsList(list);
      };

      const handleLobbyUpdate = () => {
        socket.emit('get_lobby_rooms');
      };

      socket.on('lobby_rooms_list', handleLobbyRooms);
      socket.on('lobby_room_updated', handleLobbyUpdate);

      const interval = setInterval(() => {
        if (socket.connected) {
          socket.emit('get_lobby_rooms');
        }
      }, 3000);

      return () => {
        socket.off('lobby_rooms_list', handleLobbyRooms);
        socket.off('lobby_room_updated', handleLobbyUpdate);
        clearInterval(interval);
      };
    }
  }, [socket, supabaseCreds.isConfigured]);
`;

content = content.replace(/  \/\/ Fetch lobby rooms when socket connects \/ refreshes[\s\S]*?  \}, \[socket\]\);\n/, hookStr);
fs.writeFileSync(file, content);
