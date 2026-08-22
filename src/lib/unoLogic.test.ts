import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateDeck, isValidPlay, type Card } from './unoLogic.ts';

describe('unoLogic', () => {
  it('should generate a full 108-card Uno deck', () => {
    const deck = generateDeck();
    assert.equal(deck.length, 108);

    const wildCount = deck.filter(c => c.color === 'Wild').length;
    assert.equal(wildCount, 8); // 4 Wild + 4 WildDrawFour

    const zeroCount = deck.filter(c => c.value === '0').length;
    assert.equal(zeroCount, 4); // 1 for each color
  });

  it('should allow valid play matching current color', () => {
    const handCard: Card = { id: '1', color: 'Red', value: '5' };
    const topCard: Card = { id: '2', color: 'Red', value: '9' };
    assert.equal(isValidPlay(handCard, topCard, 'Red'), true);
  });

  it('should allow valid play matching top card value with different color', () => {
    const handCard: Card = { id: '1', color: 'Blue', value: '7' };
    const topCard: Card = { id: '2', color: 'Green', value: '7' };
    assert.equal(isValidPlay(handCard, topCard, 'Green'), true);
  });

  it('should always allow Wild and WildDrawFour cards regardless of current color', () => {
    const wildCard: Card = { id: 'w1', color: 'Wild', value: 'Wild' };
    const wildDrawFour: Card = { id: 'w2', color: 'Wild', value: 'WildDrawFour' };
    const topCard: Card = { id: '2', color: 'Yellow', value: '3' };

    assert.equal(isValidPlay(wildCard, topCard, 'Yellow'), true);
    assert.equal(isValidPlay(wildDrawFour, topCard, 'Yellow'), true);
  });

  it('should reject invalid plays where neither color nor value matches', () => {
    const handCard: Card = { id: '1', color: 'Blue', value: '2' };
    const topCard: Card = { id: '2', color: 'Red', value: '8' };
    assert.equal(isValidPlay(handCard, topCard, 'Red'), false);
  });
});
