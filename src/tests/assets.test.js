import { DRAGONS } from '../data/dragons.js';
import { getBossSpriteDescriptor, getDragonSpriteDescriptor } from '../ui/assets.js';
import { assert, assertEqual, summarize, test } from './testHarness.js';

test('all eight dragons have artwork mappings for every tier', () => {
  DRAGONS.forEach(dragon => {
    assert(getDragonSpriteDescriptor(dragon.id, 1), `${dragon.id} needs Tier 1 artwork`);
    assert(getDragonSpriteDescriptor(dragon.id, 2), `${dragon.id} needs Tier 2 artwork`);
    assert(getDragonSpriteDescriptor(dragon.id, 3), `${dragon.id} needs Tier 3 artwork`);
  });
});

test('Tier 3 resolves to dedicated elder artwork', () => {
  DRAGONS.forEach(dragon => {
    assertEqual(getDragonSpriteDescriptor(dragon.id, 3).artworkTier, 3);
  });
});

test('unknown dragons do not resolve to unrelated artwork', () => {
  assertEqual(getDragonSpriteDescriptor('unknown', 1), null);
});

test('boss encounter has a standalone sprite mapping', () => {
  assertEqual(getBossSpriteDescriptor().file, 'boss.webp');
});

summarize();
