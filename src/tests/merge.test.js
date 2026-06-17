import { CONFIG } from '../config.js';
import { checkMergeAvailable, executeMerge } from '../systems/merge.js';
import { createOwnedDragon } from '../systems/shop.js';
import { assert, assertEqual, test, summarize } from './testHarness.js';

console.log('Merge System Test Suite');

test('three same id and tier can merge', () => {
  const team = [createOwnedDragon('ember'), null, null];
  const bench = [createOwnedDragon('ember'), createOwnedDragon('ember'), null, null, null];
  assert(checkMergeAvailable(team, bench));
});

test('different tiers cannot merge together', () => {
  const team = [createOwnedDragon('ember', 1), null, null];
  const bench = [createOwnedDragon('ember', 2), createOwnedDragon('ember', 1), null, null, null];
  assertEqual(checkMergeAvailable(team, bench), null);
});

test('merge consumes three dragons and creates next tier', () => {
  const state = {
    gold: 0,
    team: [createOwnedDragon('ember'), null, null],
    bench: [createOwnedDragon('ember'), createOwnedDragon('ember'), null, null, null],
    shop: [],
    unlockedDragonIds: ['ember'],
  };
  const result = executeMerge(state);
  const occupied = [...result.state.team, ...result.state.bench].filter(Boolean);
  assertEqual(result.success, true);
  assertEqual(occupied.length, CONFIG.MERGE_COUNT - 2);
  assertEqual(occupied[0].tier, 2);
  assertEqual(result.discovery.id, 'ember');
});

summarize();
