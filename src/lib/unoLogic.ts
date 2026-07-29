export type Color = 'Red' | 'Yellow' | 'Green' | 'Blue' | 'Wild';
export type Value = '0'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'Skip'|'Reverse'|'DrawTwo'|'Wild'|'WildDrawFour';

export interface Card {
  id: string;
  color: Color;
  value: Value;
}

export interface Player {
  id: string; // Socket or Supabase presence ID
  name: string;
  hand: Card[];
  isHost: boolean;
  unoCalled?: boolean;
}

export interface GameState {
  roomId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  currentTurn: number;
  direction: number; // 1 or -1
  topCard: Card | null;
  currentColor: Color | null;
  deck: Card[];
  logs: string[];
  winnerId: string | null;
  hostId: string;
}

export const generateDeck = (): Card[] => {
  const deck: Card[] = [];
  let idCounter = 0;
  const colors: Color[] = ['Red', 'Yellow', 'Green', 'Blue'];
  const values: Value[] = ['1','2','3','4','5','6','7','8','9','Skip','Reverse','DrawTwo'];
  
  for (const color of colors) {
    deck.push({ id: `c-${idCounter++}`, color, value: '0' });
    for (const value of values) {
      deck.push({ id: `c-${idCounter++}`, color, value });
      deck.push({ id: `c-${idCounter++}`, color, value });
    }
  }
  
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c-${idCounter++}`, color: 'Wild', value: 'Wild' });
    deck.push({ id: `c-${idCounter++}`, color: 'Wild', value: 'WildDrawFour' });
  }
  
  return deck.sort(() => Math.random() - 0.5);
};

export const isValidPlay = (card: Card, topCard: Card, currentColor: Color | null): boolean => {
  if (card.color === 'Wild') return true;
  if (currentColor && card.color === currentColor) return true;
  if (card.value === topCard.value) return true;
  return false;
};
