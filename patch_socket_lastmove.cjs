const fs = require('fs');
const file = 'src/components/ChessGameSection.tsx';
let content = fs.readFileSync(file, 'utf8');

const hookStr = `      setMoveHistory(historyItems);
      if (historyItems.length > 0) {
        const last = historyItems[historyItems.length - 1];
        setLastMove({ from: last.from, to: last.to });
      } else {
        setLastMove(null);
      }
    });`;

// Fix room_joined
content = content.replace(/      setMoveHistory\(historyItems\);\n    \}\);\n\n    newSocket\.on\('room_updated'/g, hookStr + "\n\n    newSocket.on('room_updated'");

// Fix room_updated
content = content.replace(/      setMoveHistory\(historyItems\);\n    \}\);\n\n    newSocket\.on\('move_made'/g, hookStr + "\n\n    newSocket.on('move_made'");

fs.writeFileSync(file, content);
