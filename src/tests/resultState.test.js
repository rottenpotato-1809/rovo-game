import { ResultState } from '../states/resultState.js';
import { CONFIG } from '../config.js';
import { assertEqual, summarize, test } from './testHarness.js';

// Build a result state without invoking persistence side effects.
function createResultState(reachedBoss) {
  const state = new ResultState(null, { saveData: { highScore: 120 } });
  state.summary = {
    roundsSurvived: 5,
    bossDamage: 80,
    reachedBoss,
    earnedXP: 25,
    totalXP: 65,
    newHighScore: false,
    newlyUnlocked: [],
    discoveries: [],
  };
  return state;
}

test('result rows separate labels from their values', () => {
  const rows = createResultState(true).getSummaryRows();
  assertEqual(rows.length, 5);
  assertEqual(rows[0].label, 'ROUNDS SURVIVED');
  assertEqual(rows[0].value, '5');
  assertEqual(rows[1].value, '80');
});

test('result rows explain when the boss was not reached', () => {
  const rows = createResultState(false).getSummaryRows();
  assertEqual(rows[1].value, 'NOT REACHED');
});

test('result notice disappears after every dragon is unlocked', () => {
  const state = createResultState(true);
  state.summary.totalXP = Math.max(...CONFIG.UNLOCK_THRESHOLDS);
  state.summary.discoveries = [{ name: 'Solflare', tier: 1 }];
  assertEqual(state.getNotice(), '');
});

summarize();
