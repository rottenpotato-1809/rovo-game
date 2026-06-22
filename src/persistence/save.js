import { CONFIG } from '../config.js';

// Create a detached default save object.
export function createDefaultSave() {
  return {
    ...CONFIG.DEFAULT_SAVE,
    version: CONFIG.SAVE_VERSION,
    unlockedDragons: [...CONFIG.DEFAULT_SAVE.unlockedDragons],
    codex: { ...CONFIG.DEFAULT_SAVE.codex },
    activeRun: CONFIG.DEFAULT_SAVE.activeRun,
    tutorialComplete: CONFIG.DEFAULT_SAVE.tutorialComplete,
    playerName: CONFIG.DEFAULT_SAVE.playerName,
    musicVolume: CONFIG.DEFAULT_SAVE.musicVolume,
    soundVolume: CONFIG.DEFAULT_SAVE.soundVolume,
  };
}

// Persist validated progression data to localStorage.
export function save(data, storage = globalThis.localStorage) {
  const normalized = normalizeSave(data);
  storage.setItem(CONFIG.SAVE_KEY, JSON.stringify(normalized));
  if (CONFIG.LOG_ENABLED && CONFIG.LOG_SAVE) console.log('[SAVE] progression saved');
  return normalized;
}

// Load progression data and recover silently from missing or corrupt saves.
export function load(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(CONFIG.SAVE_KEY);
    if (!raw) return createDefaultSave();
    const parsed = JSON.parse(raw);
    if (!isValidSave(parsed)) throw new Error('Invalid save schema');
    const normalized = normalizeSave(parsed);
    if (CONFIG.LOG_ENABLED && CONFIG.LOG_SAVE) console.log('[SAVE] progression loaded');
    return normalized;
  } catch (error) {
    if (CONFIG.LOG_ENABLED && CONFIG.LOG_SAVE) console.log('[SAVE] corrupt save reset');
    return createDefaultSave();
  }
}

// Remove stored progression and return a fresh default save.
export function reset(storage = globalThis.localStorage) {
  storage.removeItem(CONFIG.SAVE_KEY);
  if (CONFIG.LOG_ENABLED && CONFIG.LOG_SAVE) console.log('[SAVE] progression reset');
  return createDefaultSave();
}

// Normalize optional fields and clone nested save collections.
function normalizeSave(data) {
  return {
    version: CONFIG.SAVE_VERSION,
    totalXP: data.totalXP,
    highScore: data.highScore,
    unlockedDragons: [...data.unlockedDragons],
    codex: { ...data.codex },
    activeRun: cloneActiveRun(data.activeRun),
    tutorialComplete: Boolean(data.tutorialComplete),
    playerName: normalizePlayerName(data.playerName),
    musicVolume: normalizeVolume(data.musicVolume, CONFIG.DEFAULT_SAVE.musicVolume),
    soundVolume: normalizeVolume(data.soundVolume, CONFIG.DEFAULT_SAVE.soundVolume),
  };
}

// Keep player names compact and safe for the fixed canvas layout.
function normalizePlayerName(playerName) {
  if (typeof playerName !== 'string') return CONFIG.DEFAULT_SAVE.playerName;
  const trimmed = playerName.trim().slice(0, CONFIG.PLAYER_NAME_MAX_LENGTH);
  return trimmed || CONFIG.DEFAULT_SAVE.playerName;
}

// Clamp optional audio settings while preserving older saves.
function normalizeVolume(volume, fallback) {
  if (!Number.isFinite(volume)) return fallback;
  return Math.max(0, Math.min(CONFIG.ARENA_ALIVE_ALPHA, volume));
}

// Clone a valid active-run snapshot or discard malformed optional data.
function cloneActiveRun(activeRun) {
  if (!isValidActiveRun(activeRun)) return null;
  return {
    ...activeRun,
    team: activeRun.team.map(cloneOwnedDragon),
    bench: activeRun.bench.map(cloneOwnedDragon),
    shop: [...activeRun.shop],
    unlockedDragonIds: [...activeRun.unlockedDragonIds],
    lastDiscoveries: activeRun.lastDiscoveries.map(discovery => ({ ...discovery })),
  };
}

// Clone one nullable owned-dragon record in a run snapshot.
function cloneOwnedDragon(owned) {
  return owned ? { ...owned } : null;
}

// Check the fields required to resume safely from a prep checkpoint.
function isValidActiveRun(activeRun) {
  if (activeRun === null || activeRun === undefined) return false;
  return Number.isInteger(activeRun.round)
    && activeRun.round >= 1
    && Number.isFinite(activeRun.gold)
    && activeRun.gold >= 0
    && Array.isArray(activeRun.team)
    && activeRun.team.length === CONFIG.TEAM_SIZE
    && Array.isArray(activeRun.bench)
    && activeRun.bench.length === CONFIG.BENCH_SIZE
    && Array.isArray(activeRun.shop)
    && Array.isArray(activeRun.unlockedDragonIds)
    && Array.isArray(activeRun.lastDiscoveries);
}

// Check the minimum schema needed to safely restore progression.
function isValidSave(data) {
  return data
    && data.version === CONFIG.SAVE_VERSION
    && Number.isFinite(data.totalXP)
    && data.totalXP >= 0
    && Number.isFinite(data.highScore)
    && data.highScore >= 0
    && Array.isArray(data.unlockedDragons)
    && data.unlockedDragons.every(id => typeof id === 'string')
    && data.codex
    && typeof data.codex === 'object'
    && !Array.isArray(data.codex);
}
