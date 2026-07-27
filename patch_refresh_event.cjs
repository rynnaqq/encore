const fs = require('fs');
const file = 'src/components/OnlineMultiplayerLobby.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `      const interval = setInterval(() => {
        if (socket.connected) socket.emit('get_lobby_rooms');
      }, 10000);`;

const replace = `      const interval = setInterval(() => {
        if (socket.connected) socket.emit('get_lobby_rooms');
      }, 10000);

      const handleManualRefresh = () => {
        if (socket.connected) socket.emit('get_lobby_rooms');
      };
      window.addEventListener('manual_refresh_rooms', handleManualRefresh);`;

content = content.replace(target, replace);

const cleanupTarget = `      return () => {
        socket.off('lobby_rooms_list', handleLobbyRooms);
        socket.off('lobby_room_updated', handleLobbyUpdate);
        clearInterval(interval);
      };`;

const cleanupReplace = `      return () => {
        socket.off('lobby_rooms_list', handleLobbyRooms);
        socket.off('lobby_room_updated', handleLobbyUpdate);
        clearInterval(interval);
        window.removeEventListener('manual_refresh_rooms', handleManualRefresh);
      };`;

content = content.replace(cleanupTarget, cleanupReplace);
fs.writeFileSync(file, content);
