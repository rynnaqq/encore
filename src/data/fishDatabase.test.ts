import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateRarityRates, FISH_DATABASE, getRandomFish } from './fishDatabase.ts';
import { RODS_DATABASE, BAITS_DATABASE } from './equipmentDatabase.ts';

describe('fishDatabase & odds logic', () => {
  it('should contain all required rarity categories', () => {
    const rarities = new Set(FISH_DATABASE.map(f => f.rarity));
    assert.ok(rarities.has('Biasa'));
    assert.ok(rarities.has('Langka'));
    assert.ok(rarities.has('Sangat Langka'));
    assert.ok(rarities.has('Legendaris'));
    assert.ok(rarities.has('Mitos'));
  });

  it('should ensure all fish have valid weights and positive coin values', () => {
    FISH_DATABASE.forEach(fish => {
      assert.ok(fish.minWeight > 0, `Fish ${fish.name} minWeight must be > 0`);
      assert.ok(fish.maxWeight >= fish.minWeight, `Fish ${fish.name} maxWeight must be >= minWeight`);
      assert.ok(fish.coins > 0, `Fish ${fish.name} coins must be > 0`);
      assert.ok(fish.points > 0, `Fish ${fish.name} points must be > 0`);
    });
  });

  it('should calculate proper base rates with standard starter equipment', () => {
    const rates = calculateRarityRates('bamboo', 'worm', 'cerah');
    assert.ok(rates.common > 0.4);
    assert.ok(rates.rare > 0.1);
    assert.ok(rates.epic > 0.05);
    assert.ok(rates.legendary > 0.01);
    assert.ok(rates.mythic > 0.001);
  });

  it('should boost mythic and rare odds with top-tier equipment and weather', () => {
    const baseRates = calculateRarityRates('bamboo', 'worm', 'cerah');
    const boostedRates = calculateRarityRates('cosmic', 'nectar', 'kabut_mistis');

    assert.ok(boostedRates.mythic > baseRates.mythic, 'Cosmic rod + nectar should increase mythic rate');
    assert.ok(boostedRates.rare > baseRates.rare, 'Cosmic rod + nectar should increase rare rate');
  });

  it('should strictly respect admin odds override when enabled', () => {
    const adminOdds = {
      enabled: true,
      mythic: 0.8,
      legendary: 0.1,
      epic: 0.05,
      rare: 0.03,
      common: 0.02,
    };

    const rates = calculateRarityRates('bamboo', 'worm', 'cerah', adminOdds);
    assert.equal(rates.mythic, 0.8);
    assert.equal(rates.legendary, 0.1);
    assert.equal(rates.common, 0.02);
  });

  it('should generate a valid fish object on getRandomFish', () => {
    const fish = getRandomFish('bamboo', 'worm', 'cerah');
    assert.ok(fish);
    assert.ok(fish.id);
    assert.ok(fish.name);
    assert.ok(fish.rarity);
  });
});
