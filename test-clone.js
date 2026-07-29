const state = { a: 1, players: [{ hand: [1, 2] }] };
const newState = JSON.parse(JSON.stringify(state));
newState.players[0].hand.push(3);
console.log(state, newState);
