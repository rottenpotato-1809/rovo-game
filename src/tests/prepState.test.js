import { PrepState } from '../states/prepState.js';
import { CONFIG } from '../config.js';
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

test('winning round ten returns to a final boss prep phase', () => {
  globalThis.localStorage = createStorage();
  const transitions = [];
  const game = { run: createRunState(['ember'], () => 0), saveData: createDefaultSave() };
  game.run.round = CONFIG.TOTAL_ROUNDS;
  const state = new PrepState({ change: (name, payload) => transitions.push({ name, payload }) }, game);
  state.finishFight({ outcome: 'win' });
  assertEqual(game.run.round, CONFIG.TOTAL_ROUNDS + 1);
  assertEqual(state.isBossPrep(), true);
  assertEqual(transitions[0].name, 'prep');
});

test('fight from boss prep transitions directly to the boss', () => {
  globalThis.localStorage = createStorage();
  const transitions = [];
  const game = { run: createRunState(['ember'], () => 0), saveData: createDefaultSave() };
  game.run.round = CONFIG.TOTAL_ROUNDS + 1;
  game.run.team[0] = { uid: 'ember_t1', id: 'ember', tier: 1, hp: 80, maxHp: 80 };
  game.saveData.tutorialComplete = true;
  const state = new PrepState({ change: (name, payload) => transitions.push({ name, payload }) }, game);
  state.startFight();
  assertEqual(transitions[0].name, 'boss');
});

summarize();
