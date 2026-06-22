import { CONFIG } from '../config.js';
import { getDragon } from '../data/dragons.js';
import { cloneDraftState, createOwnedDragon } from './shop.js';

// Find the first available merge across team and bench slots.
export function checkMergeAvailable(team, bench) {
  const entries = collectEntries(team, bench);
  const groups = new Map();
  entries.forEach(entry => {
    if (entry.dragon.tier >= CONFIG.MAX_TIER) return;
    const key = `${entry.dragon.id}_${entry.dragon.tier}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  });
  for (const group of groups.values()) {
    if (group.length >= CONFIG.MERGE_COUNT) return group.slice(0, CONFIG.MERGE_COUNT);
  }
  return null;
}

// Execute the first available merge and return the updated draft state.
export function executeMerge(state) {
  const mergeGroup = checkMergeAvailable(state.team, state.bench);
  if (!mergeGroup) return { state, success: false, discovery: null };
  const nextState = cloneDraftState(state);
  const sourceDragon = nextState[mergeGroup[0].zone][mergeGroup[0].index];
  const nextTier = sourceDragon.tier + 1;
  const mergedDragon = createOwnedDragon(sourceDragon.id, nextTier);
  mergeGroup.forEach(entry => {
    nextState[entry.zone][entry.index] = null;
  });
  const teamIndex = nextState.team.findIndex(slot => slot === null);
  if (teamIndex >= 0) nextState.team[teamIndex] = mergedDragon;
  else nextState.bench[mergeGroup[0].index] = mergedDragon;
  const discovery = { id: mergedDragon.id, tier: mergedDragon.tier, name: getDragon(mergedDragon.id).name };
  if (CONFIG.LOG_ENABLED && CONFIG.LOG_MERGE) {
    console.log(`[MERGE] ${mergedDragon.id} reached T${mergedDragon.tier}`);
  }
  return { state: nextState, success: true, discovery };
}

// Collect occupied team and bench slots with their source locations.
function collectEntries(team, bench) {
  return [
    ...team.map((dragon, index) => ({ zone: 'team', index, dragon })),
    ...bench.map((dragon, index) => ({ zone: 'bench', index, dragon })),
  ].filter(entry => entry.dragon);
}
