const fs = require('fs');
const file = 'src/components/ChessGameSection.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  const handleUpdateProfile = useCallback((p: PlayerInfo) => {
    setPlayerProfile(p);
    try {
      localStorage.setItem('chess_player_profile', JSON.stringify(p));
    } catch {}
    if (socket && isConnected) {
      socket.emit('update_profile', p);
    }
  }, [socket, isConnected]);`;

const replace = `  const handleUpdateProfile = useCallback((name: string, country: string) => {
    const p: PlayerInfo = { ...playerProfile, name, country };
    setPlayerProfile(p);
    try {
      localStorage.setItem('chess_player_profile', JSON.stringify(p));
    } catch {}
    if (socket && isConnected) {
      socket.emit('update_profile', p);
    }
  }, [playerProfile, socket, isConnected]);`;

content = content.replace(target, replace);
fs.writeFileSync(file, content);
