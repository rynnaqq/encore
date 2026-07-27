const fs = require('fs');
let code = fs.readFileSync('src/components/ChessGameSection.tsx', 'utf8');

// The block to extract
const blockToExtract = `  useEffect(() => {
    if (gameResult) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      const timer = setTimeout(() => {
        alert(gameResult);
        
        // Auto exit and finish
        if (gameMode === 'online') {
          if (supabaseHandlerRef.current) {
            supabaseHandlerRef.current.leaveRoom();
            supabaseHandlerRef.current = null;
          }
          if (socket && activeRoom) {
            socket.emit('leave_room', { roomId: activeRoom.roomId });
          }
          setActiveRoom(null);
          setYourSide(null);
        }
        resetGame();
        setGameResult(null);
      }, 750);
      
      return () => clearTimeout(timer);
    } else if (activeRoom?.drawOffer && activeRoom.drawOffer !== yourSide) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [gameResult, activeRoom?.drawOffer, yourSide, gameMode, socket, activeRoom?.roomId, resetGame]);

`;

// Find it and remove it
const index = code.indexOf(blockToExtract);
if (index === -1) {
  console.log('Block not found');
  process.exit(1);
}

code = code.substring(0, index) + code.substring(index + blockToExtract.length);

// Insert it after `resetGame`
const resetGameDecl = `  const resetGame = useCallback(() => {`;
const endOfResetGameStr = `  }, [timeControl, playerColor, gameMode]);`;

const insertIndex = code.indexOf(endOfResetGameStr) + endOfResetGameStr.length;
if (insertIndex === -1 + endOfResetGameStr.length) {
  console.log('resetGame not found');
  process.exit(1);
}

code = code.substring(0, insertIndex) + '\n\n' + blockToExtract.trim() + '\n' + code.substring(insertIndex);

fs.writeFileSync('src/components/ChessGameSection.tsx', code);
console.log('Fixed ChessGameSection.tsx');
