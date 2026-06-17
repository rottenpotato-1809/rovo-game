import { CONFIG } from '../config.js';
import { getAllDragonIds, getDragon } from '../data/dragons.js';
import { createBattleInstance } from './battle.js';

// Generate an enemy team for a round using all dragon types and configured tier scaling.
export function generateEnemyTeam(roundNumber, random = Math.random) {
  const scaling = CONFIG.ENEMY_SCALING[roundNumber - 1] || CONFIG.ENEMY_SCALING[CONFIG.ENEMY_SCALING.length - 1];
  const tiers = [];
  scaling.forEach((count, index) => {
    for (let amount = 0; amount < count; amount++) tiers.push(index + 1);
  });
  const allIds = getAllDragonIds();
  return tiers.map((tier, index) => {
    const id = allIds[Math.floor(random() * allIds.length)];
    return createBattleInstance(getDragon(id), tier, 'enemy', index);
  });
}
