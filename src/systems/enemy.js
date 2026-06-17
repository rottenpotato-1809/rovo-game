import { CONFIG } from '../config.js';
import { getAllDragonIds, getDragon } from '../data/dragons.js';
import { createBattleInstance } from './battle.js';

// Generate an enemy team for a round using all dragon types and configured tier scaling.
export function generateEnemyTeam(roundNumber, random = Math.random) {
  const scaling = CONFIG.ENEMY_SCALING[roundNumber - 1] || CONFIG.ENEMY_SCALING[CONFIG.ENEMY_SCALING.length - 1];
  const powerScale = getEnemyPowerScale(roundNumber);
  const tiers = [];
  scaling.forEach((count, index) => {
    for (let amount = 0; amount < count; amount++) tiers.push(index + 1);
  });
  const allIds = getAllDragonIds();
  return tiers.map((tier, index) => {
    const id = allIds[Math.floor(random() * allIds.length)];
    return scaleEnemyStats(createBattleInstance(getDragon(id), tier, 'enemy', index), powerScale);
  });
}

// Return the configured enemy power multiplier for a round.
export function getEnemyPowerScale(roundNumber) {
  return CONFIG.ENEMY_POWER_SCALE[roundNumber - 1] || CONFIG.ENEMY_POWER_SCALE[CONFIG.ENEMY_POWER_SCALE.length - 1];
}

// Apply round power scaling to enemy combat stats.
export function scaleEnemyStats(enemy, powerScale) {
  enemy.atk = Math.max(CONFIG.ENEMY_MIN_STAT, Math.round(enemy.atk * powerScale));
  enemy.hp = Math.max(CONFIG.ENEMY_MIN_STAT, Math.round(enemy.hp * powerScale));
  enemy.maxHp = enemy.hp;
  return enemy;
}
