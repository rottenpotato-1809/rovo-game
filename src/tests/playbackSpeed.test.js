import { CONFIG } from '../config.js';
import { createPlaybackSpeedState, getPlaybackEventDelay, getPlaybackMultiplier, setPlaybackSpeedMode, updatePlaybackSpeed } from '../systems/playbackSpeed.js';
import { assertEqual, summarize, test } from './testHarness.js';

test('AUTO playback starts at true 1x speed', () => {
  const state = createPlaybackSpeedState();
  assertEqual(getPlaybackMultiplier(state), CONFIG.BATTLE_AUTO_SPEED_START);
  assertEqual(getPlaybackEventDelay(state), CONFIG.TURN_DELAY_MS);
});

test('AUTO playback accelerates gradually and stops at its cap', () => {
  let state = createPlaybackSpeedState();
  for (let frame = 0; frame < 40; frame++) state = updatePlaybackSpeed(state, 0.25);
  assertEqual(getPlaybackMultiplier(state), 1.8);
  for (let frame = 0; frame < 100; frame++) state = updatePlaybackSpeed(state, 0.25);
  assertEqual(getPlaybackMultiplier(state), CONFIG.BATTLE_AUTO_SPEED_CAP);
});

test('AUTO ignores oversized background-tab frame gaps', () => {
  const state = updatePlaybackSpeed(createPlaybackSpeedState(), 30);
  assertEqual(state.autoElapsedSeconds, CONFIG.BATTLE_AUTO_MAX_FRAME_DELTA_SECONDS);
});

test('fixed playback modes override AUTO acceleration', () => {
  let state = updatePlaybackSpeed(createPlaybackSpeedState(), 10);
  state = setPlaybackSpeedMode(state, 2);
  assertEqual(getPlaybackMultiplier(state), 2);
  assertEqual(getPlaybackEventDelay(state), CONFIG.TURN_DELAY_MS / 2);
});

summarize();
