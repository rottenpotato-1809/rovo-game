import { CONFIG } from '../config.js';
import { createDefaultSave, load, save } from '../persistence/save.js';
import { calculateXP, checkUnlocks, getNextUnlockInfo, registerCodexEntry } from '../systems/progression.js';
import { createRunState } from '../systems/run.js';
import { assert, assertEqual, summarize, test } from './testHarness.js';

function createStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

test('XP combines survived rounds and floored boss damage', () => {
  const actual = calculateXP(10, 99);
  assertEqual(actual, (10 * CONFIG.XP_PER_ROUND_SURVIVED) + 9);
});

test('unlock thresholds add locked dragons in order', () => {
  assert(!checkUnlocks(CONFIG.UNLOCK_THRESHOLDS[0] - 1).includes('voltfang'));
  assert(checkUnlocks(CONFIG.UNLOCK_THRESHOLDS[0]).includes('voltfang'));
});

test('new runs generate shops from the save-backed unlock pool', () => {
  const run = createRunState(['voltfang'], () => 0);
  assert(run.shop.every(id => id === 'voltfang'));
});

test('codex registration reports only the first discovery', () => {
  const first = registerCodexEntry({}, 'ember', 2);
  const second = registerCodexEntry(first.codex, 'ember', 2);
  assert(first.isNew);
  assert(!second.isNew);
});

test('next unlock progress uses the current threshold band', () => {
  const info = getNextUnlockInfo(150);
  assertEqual(info.id, 'nightshade');
  assertEqual(info.current, 50);
  assertEqual(info.required, 100);
});

test('save and load preserve progression data', () => {
  const storage = createStorage();
  const data = createDefaultSave();
  data.totalXP = 125;
  data.codex.ember_2 = true;
  save(data, storage);
  const loaded = load(storage);
  assertEqual(loaded.totalXP, 125);
  assert(loaded.codex.ember_2);
});

test('corrupt saves recover to defaults', () => {
  const storage = createStorage();
  storage.setItem(CONFIG.SAVE_KEY, '{broken');
  const recovered = load(storage);
  assertEqual(recovered.totalXP, CONFIG.DEFAULT_SAVE.totalXP);
  assertEqual(recovered.unlockedDragons.length, CONFIG.DEFAULT_SAVE.unlockedDragons.length);
});

summarize();
