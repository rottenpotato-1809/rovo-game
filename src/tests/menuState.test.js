import { createDefaultSave } from '../persistence/save.js';
import { createRunState } from '../systems/run.js';
import { MenuState } from '../states/menuState.js';
import { getMenuButtons, getMenuContinueButton, getMenuSettingsControls } from '../ui/layout.js';
import { assert, assertEqual, summarize, test } from './testHarness.js';

function createStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

function center(rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

test('continue enters prep only when an active run exists', () => {
  const transitions = [];
  const game = { run: createRunState(['ember'], () => 0), saveData: createDefaultSave() };
  const state = new MenuState({ change: name => transitions.push(name) }, game);
  state.handlePointerDown(center(getMenuContinueButton()));
  assertEqual(transitions[0], 'prep');
});

test('new run asks before replacing an active run', () => {
  const game = { run: createRunState(['ember'], () => 0), saveData: createDefaultSave() };
  const state = new MenuState({ change: () => {} }, game);
  state.handlePointerDown(center(getMenuButtons().newRun));
  assert(state.confirmingNewRun);
});

test('new run without progress starts and saves immediately', () => {
  globalThis.localStorage = createStorage();
  const transitions = [];
  const game = { run: null, saveData: createDefaultSave() };
  const state = new MenuState({ change: name => transitions.push(name) }, game);
  state.handlePointerDown(center(getMenuButtons().newRun));
  assert(game.run);
  assert(game.saveData.activeRun);
  assertEqual(transitions[0], 'prep');
});

test('settings update player name and live music volume', () => {
  globalThis.localStorage = createStorage();
  const volumes = [];
  const game = {
    run: null,
    saveData: createDefaultSave(),
    music: { setVolume: value => volumes.push(value) },
    requestPlayerName: () => 'Sky Rider',
  };
  const state = new MenuState({ change: () => {} }, game);
  const controls = getMenuSettingsControls();
  state.handlePointerDown(center(controls.icon));
  state.handlePointerDown(center(controls.name));
  state.handlePointerDown({ x: controls.music.x + controls.music.width, y: center(controls.music).y });
  state.handlePointerUp();
  assertEqual(game.saveData.playerName, 'Sky Rider');
  assertEqual(game.saveData.musicVolume, 1);
  assertEqual(volumes[0], 1);
});

test('settings sound slider clamps to its track', () => {
  globalThis.localStorage = createStorage();
  const game = { run: null, saveData: createDefaultSave() };
  const state = new MenuState({ change: () => {} }, game);
  const controls = getMenuSettingsControls();
  state.handlePointerDown(center(controls.icon));
  state.handlePointerDown(center(controls.sound));
  state.handlePointerMove({ x: controls.sound.x - controls.sound.width, y: center(controls.sound).y });
  state.handlePointerUp();
  assertEqual(game.saveData.soundVolume, 0);
});

summarize();
