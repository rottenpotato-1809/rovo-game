import { PrepState } from '../states/prepState.js';
import { createDefaultSave } from '../persistence/save.js';
import { createRunState } from '../systems/run.js';
import { getShopCards } from '../ui/layout.js';
import { assertEqual, summarize, test } from './testHarness.js';

function createStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

test('sell hint shows guidance until a dragon is dragged', () => {
  const state = new PrepState({}, { run: { team: [], bench: [] } });
  assertEqual(state.getSellHint(), 'DRAG HERE TO SELL');
});

test('sell hint shows the dragged dragon tier value', () => {
  const state = new PrepState({}, { run: { team: [{ tier: 2 }], bench: [] } });
  state.dragSource = { zone: 'team', index: 0 };
  assertEqual(state.getSellHint(), 'DROP TO SELL FOR 4G');
});

test('tutorial advances monotonically and persists its run checkpoint', () => {
  globalThis.localStorage = createStorage();
  const game = { run: createRunState(['ember'], () => 0), saveData: createDefaultSave() };
  const state = new PrepState({}, game);
  state.advanceTutorial(1);
  state.advanceTutorial(1);
  assertEqual(game.run.tutorialStep, 1);
  assertEqual(game.saveData.activeRun.tutorialStep, 1);
});

test('shop hover resolves Tier 1 stats for the inspector', () => {
  const game = { run: createRunState(['ember'], () => 0), saveData: createDefaultSave() };
  const state = new PrepState({}, game);
  const card = getShopCards()[0];
  const hovered = state.getHoveredDragon({ x: card.x + 1, y: card.y + 1 });
  assertEqual(hovered.dragon.id, 'ember');
  assertEqual(hovered.tierData.tier, 1);
});

summarize();
