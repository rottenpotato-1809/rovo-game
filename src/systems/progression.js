import { CONFIG } from '../config.js';
import { getLockedDragonsInOrder } from '../data/dragons.js';

// Calculate XP earned from completed rounds and optional boss damage.
export function calculateXP(roundsSurvived, bossDamage = 0) {
  return (roundsSurvived * CONFIG.XP_PER_ROUND_SURVIVED)
    + Math.floor(bossDamage / CONFIG.XP_BOSS_DAMAGE_DIVISOR);
}

// Return every dragon id unlocked at the supplied cumulative XP total.
export function checkUnlocks(totalXP) {
  const unlocked = [...CONFIG.DEFAULT_SAVE.unlockedDragons];
  getLockedDragonsInOrder().forEach(dragon => {
    if (totalXP >= dragon.unlockCost) unlocked.push(dragon.id);
  });
  return [...new Set(unlocked)];
}

// Register a codex key without mutating the existing codex object.
export function registerCodexEntry(codex, dragonId, tier) {
  const key = `${dragonId}_${tier}`;
  const isNew = !codex[key];
  return {
    codex: { ...codex, [key]: true },
    isNew,
    key,
  };
}

// Describe progress toward the next locked dragon.
export function getNextUnlockInfo(totalXP) {
  const next = getLockedDragonsInOrder().find(dragon => totalXP < dragon.unlockCost);
  if (!next) return null;
  const previousThresholds = getLockedDragonsInOrder()
    .filter(dragon => dragon.unlockCost < next.unlockCost)
    .map(dragon => dragon.unlockCost);
  const floor = previousThresholds.length > 0 ? Math.max(...previousThresholds) : 0;
  return {
    id: next.id,
    name: next.name,
    threshold: next.unlockCost,
    current: Math.max(0, totalXP - floor),
    required: next.unlockCost - floor,
  };
}
