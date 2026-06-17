import { CONFIG } from '../config.js';
import { getAllDragonIds } from '../data/dragons.js';
import { generateEnemyTeam } from '../systems/enemy.js';
import { assert, assertEqual, test, summarize } from './testHarness.js';

console.log('Enemy System Test Suite');

test('enemy team size matches configured team size', () => {
  const team = generateEnemyTeam(1, () => 0);
  assertEqual(team.length, CONFIG.TEAM_SIZE);
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
