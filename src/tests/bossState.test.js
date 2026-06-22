import { BossState } from '../states/bossState.js';
import { createOwnedDragon } from '../systems/shop.js';
import { assertEqual, summarize, test } from './testHarness.js';

test('boss playback converges on the simulated damage score', () => {
  const transitions = [];
  const stateManager = {
    change: (name, payload) => transitions.push({ name, payload }),
  };
  const state = new BossState(stateManager, { saveData: { highScore: 0 } });
  const run = {
    team: [createOwnedDragon('ember'), createOwnedDragon('stonescale'), null],
    lastDiscoveries: [],
    roundsSurvived: 10,
  };
  state.enter({ run });
  for (let frame = 0; frame < 1000 && state.phase !== 'complete'; frame++) state.update(0.1);
  assertEqual(state.score, state.result.totalDamage);
  assertEqual(state.revealScore, state.result.totalDamage);
  assertEqual(state.newRecord, true);
  state.handlePointerDown();
  assertEqual(transitions[0].name, 'result');
  assertEqual(transitions[0].payload.bossDamage, state.result.totalDamage);
});

test('boss intro blocks score continuation until the cinematic completes', () => {
  const transitions = [];
  const state = new BossState({ change: name => transitions.push(name) }, { saveData: { highScore: 999999 } });
  state.enter({
    run: {
      team: [createOwnedDragon('ember'), null, null],
      lastDiscoveries: [],
      roundsSurvived: 10,
    },
  });
  state.handlePointerDown();
  assertEqual(state.phase, 'intro');
  assertEqual(transitions.length, 0);
  assertEqual(state.newRecord, false);
});

summarize();
