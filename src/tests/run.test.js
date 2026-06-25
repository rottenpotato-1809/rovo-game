import { CONFIG } from '../config.js';
import { getDragon } from '../data/dragons.js';
import { applyPrepInterest, applyWin, createPlayerBattleTeam, createRunState } from '../systems/run.js';
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

test('new runs apply round one interest before the shop appears', () => {
  const run = createRunState(['ember'], () => 0);
  const expectedInterest = Math.min(Math.floor(CONFIG.STARTING_GOLD / CONFIG.INTEREST_THRESHOLD), CONFIG.INTEREST_CAP);
  assertEqual(run.gold, CONFIG.STARTING_GOLD + expectedInterest);
  assertEqual(run.lastInterestEarned, expectedInterest);
  assertEqual(run.interestAppliedRound, 1);
});

test('prep interest is only applied once per round', () => {
  const run = {
    round: 3,
    gold: 10,
    interestAppliedRound: null,
  };
  const first = applyPrepInterest(run);
  const second = applyPrepInterest(first);
  assertEqual(first.gold, 12);
  assertEqual(second.gold, first.gold);
  assertEqual(second.interestAppliedRound, 3);
});

summarize();
