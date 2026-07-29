const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

code = code.replace(
  `const processAction = (payload: any) => {`,
  `const processAction = (payload: any, activeChannel = channel) => {`
);

code = code.replace(
  `newChannel.on('broadcast', { event: 'PLAYER_ACTION' }, ({ payload }) => {
      if (stateRef.current && stateRef.current.hostId === localPlayerId) {
        processAction(payload);
      }
    });`,
  `newChannel.on('broadcast', { event: 'PLAYER_ACTION' }, ({ payload }) => {
      if (stateRef.current && stateRef.current.hostId === localPlayerId) {
        processAction(payload, newChannel);
      }
    });`
);

const firstBroadcastState = `stateRef.current = state;
    broadcastState(state);
  };`;
const replacementBroadcastState = `stateRef.current = state;
    broadcastState(state, activeChannel);
  };`;
code = code.replace(firstBroadcastState, replacementBroadcastState);

code = code.replace(
  `<div key={card.id} className="relative">`,
  `<div key={card.id} className={\`relative \${colorPickerVisible?.cardId === card.id ? 'z-50' : 'z-10'}\`}>`
);

code = code.replace(
  `className="flex flex-col lg:flex-row h-[850px] lg:h-[700px] overflow-hidden"`,
  `className="flex flex-col lg:flex-row min-h-[600px] h-[calc(100vh-150px)] lg:h-[calc(100vh-100px)] overflow-hidden"`
);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
