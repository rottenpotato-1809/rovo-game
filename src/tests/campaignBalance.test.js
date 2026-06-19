import { CONFIG } from '../config.js';
import { simulateCampaign } from '../../scripts/balance-sim.mjs';
import { assert, test, summarize } from './testHarness.js';

const BALANCE_SAMPLE_RUNS = 1000;
const MIN_BOSS_REACH_RATE = 0.65;
const MAX_BOSS_REACH_RATE = 0.85;
const EARLY_GAME_ROUNDS = 6;
const MAX_EARLY_LOSS_RATE = 0.01;

const report = simulateCampaign(BALANCE_SAMPLE_RUNS);

test('competent drafting reaches the boss at the target campaign rate', () => {
  assert(report.bossReachRate >= MIN_BOSS_REACH_RATE, `Boss reach rate ${(report.bossReachRate * 100).toFixed(1)}% is below target`);
  assert(report.bossReachRate <= MAX_BOSS_REACH_RATE, `Boss reach rate ${(report.bossReachRate * 100).toFixed(1)}% leaves too little pre-boss pressure`);
});

test('build-up rounds rarely end a competent run', () => {
  const earlyLosses = report.lossesByRound.slice(0, EARLY_GAME_ROUNDS).reduce((total, losses) => total + losses, 0);
  assert(earlyLosses / BALANCE_SAMPLE_RUNS <= MAX_EARLY_LOSS_RATE, `Early loss rate ${((earlyLosses / BALANCE_SAMPLE_RUNS) * 100).toFixed(1)}% is too high`);
});

test('round ten remains stronger than round nine after tier scaling', () => {
  const weightedTierPower = scaling => scaling.reduce((total, count, tierIndex) => total + (count * (2 ** tierIndex)), 0);
  const roundNinePower = weightedTierPower(CONFIG.ENEMY_SCALING[8]) * CONFIG.ENEMY_POWER_SCALE[8];
  const roundTenPower = weightedTierPower(CONFIG.ENEMY_SCALING[9]) * CONFIG.ENEMY_POWER_SCALE[9];
  assert(roundTenPower > roundNinePower, 'The final pre-boss round should be the strongest campaign fight');
});

summarize();
