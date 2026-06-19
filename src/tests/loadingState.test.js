import { LoadingState } from '../states/loadingState.js';
import { assertEqual, summarize, test } from './testHarness.js';

test('loading progress accepts normalized asset completion', () => {
  const state = new LoadingState();
  state.setProgress(0.5);
  assertEqual(state.progress, 0.5);
});

test('loading progress clamps outside the normalized range', () => {
  const state = new LoadingState();
  state.setProgress(2);
  assertEqual(state.progress, 1);
  state.setProgress(-1);
  assertEqual(state.progress, 0);
});

summarize();
