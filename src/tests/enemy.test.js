import { CONFIG } from '../config.js';
import { getAllDragonIds, getDragon } from '../data/dragons.js';
import { generateEnemyTeam, getEnemyPowerScale } from '../systems/enemy.js';
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

test('enemy stats use configured round power scale', () => {
  const team = generateEnemyTeam(1, () => 0);
  const expectedAtk = Math.max(CONFIG.ENEMY_MIN_STAT, Math.round(getDragon(team[0].id).tiers[0].atk * getEnemyPowerScale(1)));
  const expectedHp = Math.max(CONFIG.ENEMY_MIN_STAT, Math.round(getDragon(team[0].id).tiers[0].hp * getEnemyPowerScale(1)));
  assertEqual(team[0].atk, expectedAtk);
  assertEqual(team[0].maxHp, expectedHp);
});

test('enemy generation can use locked dragon ids', () => {
  const allIds = getAllDragonIds();
  const team = generateEnemyTeam(1, () => 0.99);
  assert(team.every(dragon => allIds.includes(dragon.id)));
  assert(team.some(dragon => !CONFIG.DEFAULT_SAVE.unlockedDragons.includes(dragon.id)));
});

summarize();
