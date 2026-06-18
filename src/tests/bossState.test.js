import { BossState } from '../states/bossState.js';
import { createOwnedDragon } from '../systems/shop.js';
import { assertEqual, summarize, test } from './testHarness.js';

test('boss playback converges on the simulated damage score', () => {
  const transitions = [];
  const stateManager = {
    change: (name, payload) => transitions.push({ name, payload }),
  };
  const state = new BossState(stateManager, {});
  const run = {
    team: [createOwnedDragon('ember'), createOwnedDragon('stonescale'), null],
    lastDiscoveries: [],
    roundsSurvived: 10,
  };
  state.enter({ run });
  const eventCount = state.events.length;
  for (let index = 0; index <= eventCount; index++) state.update(1);
  assertEqual(state.score, state.result.totalDamage);
  state.handlePointerDown();
  assertEqual(transitions[0].name, 'result');
  assertEqual(transitions[0].payload.bossDamage, state.result.totalDamage);
});

summarize();
