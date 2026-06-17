import { CONFIG } from '../config.js';
import { getDragon } from '../data/dragons.js';
import { applyWin, createPlayerBattleTeam } from '../systems/run.js';
import { createOwnedDragon } from '../systems/shop.js';
import { assertEqual, test, summarize } from './testHarness.js';

console.log('Run System Test Suite');

test('player battle team starts each round at full health', () => {
  const owned = createOwnedDragon('ember');
  owned.hp = 0;
  const team = createPlayerBattleTeam([owned]);
  assertEqual(team[0].hp, getDragon('ember').tiers[0].hp);
});

test('winning keeps defeated dragons and refreshes their health', () => {
  const owned = createOwnedDragon('ember');
  owned.hp = 0;
  const runState = {
    round: 1,
    gold: 0,
    roundsSurvived: 0,
    team: [owned, ...Array(CONFIG.TEAM_SIZE - 1).fill(null)],
    bench: Array(CONFIG.BENCH_SIZE).fill(null),
    shop: ['ember'],
    unlockedDragonIds: ['ember'],
    lastDiscoveries: [],
  };
  const nextState = applyWin(runState, () => 0);
  assertEqual(nextState.team[0].id, 'ember');
  assertEqual(nextState.team[0].hp, getDragon('ember').tiers[0].hp);
});

summarize();
