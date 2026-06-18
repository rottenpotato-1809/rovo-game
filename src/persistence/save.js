import { CONFIG } from '../config.js';

// Create a detached default save object.
export function createDefaultSave() {
  return {
    ...CONFIG.DEFAULT_SAVE,
    version: CONFIG.SAVE_VERSION,
    unlockedDragons: [...CONFIG.DEFAULT_SAVE.unlockedDragons],
    codex: { ...CONFIG.DEFAULT_SAVE.codex },
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
  };
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
