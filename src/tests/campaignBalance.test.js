import { CONFIG } from '../config.js';
import { runProfileSimulations } from './balance.js';
import { assert, test, summarize } from './testHarness.js';

const BALANCE_SAMPLE_RUNS = 1000;

const reports = runProfileSimulations(BALANCE_SAMPLE_RUNS);

test('profile simulation keeps the intended skill ordering', () => {
  assert(reports.RANDOM.fullClearRate < reports.COMPETENT.fullClearRate, 'Competent drafting should outperform random drafting');
  assert(reports.COMPETENT.fullClearRate < reports.PERFECT.fullClearRate, 'Perfect drafting should outperform competent drafting');
});

test('interest and shop size raise the perfect profile into the target ceiling', () => {
  assert(reports.PERFECT.fullClearRate >= 0.80, `Perfect boss reach ${(reports.PERFECT.fullClearRate * 100).toFixed(1)}% is below target`);
  assert(reports.PERFECT.fullClearRate <= 0.90, `Perfect boss reach ${(reports.PERFECT.fullClearRate * 100).toFixed(1)}% is above target`);
});

test('round ten remains stronger than round nine after tier scaling', () => {
  const weightedTierPower = scaling => scaling.reduce((total, count, tierIndex) => total + (count * (2 ** tierIndex)), 0);
  const roundNinePower = weightedTierPower(CONFIG.ENEMY_SCALING[8]) * CONFIG.ENEMY_POWER_SCALE[8];
  const roundTenPower = weightedTierPower(CONFIG.ENEMY_SCALING[9]) * CONFIG.ENEMY_POWER_SCALE[9];
  assert(roundTenPower > roundNinePower, 'The final pre-boss round should be the strongest campaign fight');
});

summarize();
