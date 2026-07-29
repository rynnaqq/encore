const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

const oldPlayCard = `  const handlePlayCard = (card: Card, chosenColor?: Color) => {
    if (!channel || !gameState) return;
    if (gameState.currentTurn !== gameState.players.findIndex(p => p.id === localPlayerId)) return;

    if (card.color === 'Wild' && !chosenColor) {
      setColorPickerVisible({ cardId: card.id });
      return;
    }

    setColorPickerVisible(null);
    channel.send({
      type: 'broadcast',
      event: 'PLAYER_ACTION',
      payload: { playerId: localPlayerId, action: 'PLAY_CARD', cardId: card.id, chosenColor }
    });
  };`;

const newPlayCard = `  const handlePlayCard = (card: Card, chosenColor?: Color) => {
    if (!channel || !gameState) return;
    if (gameState.currentTurn !== gameState.players.findIndex(p => p.id === localPlayerId)) return;

    if (card.color === 'Wild' && !chosenColor) {
      setColorPickerVisible({ cardId: card.id });
      return;
    }

    setColorPickerVisible(null);
    const payload = { playerId: localPlayerId, action: 'PLAY_CARD', cardId: card.id, chosenColor };
    
    if (isHost) {
      processAction(payload);
    } else {
      channel.send({
        type: 'broadcast',
        event: 'PLAYER_ACTION',
        payload
      });
    }
  };`;

const oldDrawCard = `  const handleDrawCard = () => {
    if (!channel || !gameState) return;
    if (gameState.currentTurn !== gameState.players.findIndex(p => p.id === localPlayerId)) return;
    channel.send({
      type: 'broadcast',
      event: 'PLAYER_ACTION',
      payload: { playerId: localPlayerId, action: 'DRAW_CARD' }
    });
  };`;

const newDrawCard = `  const handleDrawCard = () => {
    if (!channel || !gameState) return;
    if (gameState.currentTurn !== gameState.players.findIndex(p => p.id === localPlayerId)) return;
    
    const payload = { playerId: localPlayerId, action: 'DRAW_CARD' };
    if (isHost) {
      processAction(payload);
    } else {
      channel.send({
        type: 'broadcast',
        event: 'PLAYER_ACTION',
        payload
      });
    }
  };`;

code = code.replace(oldPlayCard, newPlayCard);
code = code.replace(oldDrawCard, newDrawCard);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
