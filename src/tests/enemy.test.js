import { CONFIG } from '../config.js';
import { getAllDragonIds } from '../data/dragons.js';
import { generateEnemyTeam } from '../systems/enemy.js';
import { assert, assertEqual, test, summarize } from './testHarness.js';

console.log('Enemy System Test Suite');

test('enemy team size matches configured round scaling', () => {
  const team = generateEnemyTeam(1, () => 0);
  const expectedSize = CONFIG.ENEMY_SCALING[0].reduce((total, count) => total + count, 0);
  assertEqual(team.length, expectedSize);
});

test('early enemy teams ramp from one to two dragons', () => {
  assertEqual(generateEnemyTeam(1, () => 0).length, CONFIG.ENEMY_SCALING[0][0]);
  assertEqual(generateEnemyTeam(2, () => 0).length, CONFIG.ENEMY_SCALING[1][0]);
});

test('enemy tier mix follows round scaling', () => {
  const team = generateEnemyTeam(10, () => 0);
  const tierCounts = team.reduce((counts, dragon) => {
    counts[dragon.tier] = (counts[dragon.tier] || 0) + 1;
    return counts;
  }, {});
  assertEqual(tierCounts[2], CONFIG.ENEMY_SCALING[9][1]);
  assertEqual(tierCounts[3], CONFIG.ENEMY_SCALING[9][2]);
});

test('enemy generation can use locked dragon ids', () => {
  const allIds = getAllDragonIds();
  const team = generateEnemyTeam(1, () => 0.99);
  assert(team.every(dragon => allIds.includes(dragon.id)));
  assert(team.some(dragon => !CONFIG.DEFAULT_SAVE.unlockedDragons.includes(dragon.id)));
});

summarize();
