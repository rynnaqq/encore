const fs = require('fs');
const file = 'src/components/ChessGameSection.tsx';
let content = fs.readFileSync(file, 'utf8');

const hookStr = `    setMoveHistory(historyItems);
    if (historyItems.length > 0) {
      const last = historyItems[historyItems.length - 1];
      setLastMove({ from: last.from, to: last.to });
    } else {
      setLastMove(null);
    }
  }, [playAudioEffect]);`;

content = content.replace('    setMoveHistory(historyItems);\n  }, [playAudioEffect]);', hookStr);
fs.writeFileSync(file, content);
