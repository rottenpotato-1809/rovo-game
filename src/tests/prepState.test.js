import { PrepState } from '../states/prepState.js';
import { assertEqual, summarize, test } from './testHarness.js';

test('sell hint shows guidance until a dragon is dragged', () => {
  const state = new PrepState({}, { run: { team: [], bench: [] } });
  assertEqual(state.getSellHint(), 'DRAG HERE TO SELL');
});

test('sell hint shows the dragged dragon tier value', () => {
  const state = new PrepState({}, { run: { team: [{ tier: 2 }], bench: [] } });
  state.dragSource = { zone: 'team', index: 0 };
  assertEqual(state.getSellHint(), 'DROP TO SELL FOR 4G');
});

summarize();
