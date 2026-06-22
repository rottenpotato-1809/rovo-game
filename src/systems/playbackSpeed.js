import { CONFIG } from '../config.js';

// Create a fresh battle clock that begins at true 1x AUTO speed.
export function createPlaybackSpeedState() {
  return { mode: 'auto', autoElapsedSeconds: 0 };
}

// Advance AUTO acceleration without changing fixed player-selected modes.
export function updatePlaybackSpeed(state, dt) {
  if (state.mode !== 'auto') return state;
  const elapsed = Math.min(Math.max(0, dt), CONFIG.BATTLE_AUTO_MAX_FRAME_DELTA_SECONDS);
  return { ...state, autoElapsedSeconds: state.autoElapsedSeconds + elapsed };
}

// Switch modes while preserving AUTO progress for the current fight.
export function setPlaybackSpeedMode(state, mode) {
  if (!CONFIG.BATTLE_SPEED_MODES.includes(mode)) return state;
  return { ...state, mode };
}

// Resolve the effective speed multiplier for event pacing.
export function getPlaybackMultiplier(state) {
  if (state.mode !== 'auto') return state.mode;
  return Math.min(
    CONFIG.BATTLE_AUTO_SPEED_CAP,
    CONFIG.BATTLE_AUTO_SPEED_START + (state.autoElapsedSeconds * CONFIG.BATTLE_AUTO_SPEED_RAMP_PER_SECOND),
  );
}

// Convert the base readable interval into the current mode's event interval.
export function getPlaybackEventDelay(state) {
  return CONFIG.TURN_DELAY_MS / getPlaybackMultiplier(state);
}
