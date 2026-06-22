import { LoadingState } from '../states/loadingState.js';
import { getLoadingContinueButton } from '../ui/layout.js';
import { assertEqual, summarize, test } from './testHarness.js';

function center(rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

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

test('loading waits for a ready-state confirmation click', () => {
  let continued = 0;
  const state = new LoadingState(() => { continued++; });
  state.handlePointerDown(center(getLoadingContinueButton()));
  assertEqual(continued, 0);
  state.markReady();
  state.handlePointerDown(center(getLoadingContinueButton()));
  assertEqual(continued, 1);
});

summarize();
