import { CONFIG } from '../config.js';
import { simulateCampaign } from '../../scripts/balance-sim.mjs';
import { assert, test, summarize } from './testHarness.js';

const BALANCE_SAMPLE_RUNS = 5000;
const MIN_BOSS_REACH_RATE = 0.58;
const MAX_BOSS_REACH_RATE = 0.64;

const report = simulateCampaign(BALANCE_SAMPLE_RUNS);

test('competent drafting reaches the boss at the target campaign rate', () => {
  assert(report.bossReachRate >= MIN_BOSS_REACH_RATE, `Boss reach rate ${(report.bossReachRate * 100).toFixed(1)}% is below target`);
  assert(report.bossReachRate <= MAX_BOSS_REACH_RATE, `Boss reach rate ${(report.bossReachRate * 100).toFixed(1)}% leaves too little pre-boss pressure`);
});

test('campaign losses follow the intended phase funnel', () => {
  assert(report.earlyLossRate >= 0.02 && report.earlyLossRate <= 0.045, `Round 1-6 loss rate ${(report.earlyLossRate * 100).toFixed(1)}% is outside target`);
  assert(report.midLossRate >= 0.04 && report.midLossRate <= 0.08, `Round 7-8 loss rate ${(report.midLossRate * 100).toFixed(1)}% is outside target`);
  assert(report.conditionalLossRates[8] >= 0.08 && report.conditionalLossRates[8] <= 0.13, `Round 9 loss rate ${(report.conditionalLossRates[8] * 100).toFixed(1)}% is outside target`);
  assert(report.conditionalLossRates[9] >= 0.22 && report.conditionalLossRates[9] <= 0.28, `Round 10 loss rate ${(report.conditionalLossRates[9] * 100).toFixed(1)}% is outside target`);
});

test('round ten remains stronger than round nine after tier scaling', () => {
  const weightedTierPower = scaling => scaling.reduce((total, count, tierIndex) => total + (count * (2 ** tierIndex)), 0);
  const roundNinePower = weightedTierPower(CONFIG.ENEMY_SCALING[8]) * CONFIG.ENEMY_POWER_SCALE[8];
  const roundTenPower = weightedTierPower(CONFIG.ENEMY_SCALING[9]) * CONFIG.ENEMY_POWER_SCALE[9];
  assert(roundTenPower > roundNinePower, 'The final pre-boss round should be the strongest campaign fight');
});

summarize();
