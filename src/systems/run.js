import { CONFIG } from '../config.js';
import { getDragon } from '../data/dragons.js';
import { createBattleInstance } from './battle.js';
import { calculateRoundGold } from './economy.js';
import { generateEnemyTeam } from './enemy.js';
import { generateShop } from './shop.js';

// Create the initial draft state for a new run.
export function createRunState(unlockedDragonIds = CONFIG.DEFAULT_SAVE.unlockedDragons, random = Math.random) {
  if (typeof unlockedDragonIds === 'function') {
    random = unlockedDragonIds;
    unlockedDragonIds = CONFIG.DEFAULT_SAVE.unlockedDragons;
  }
  const availableDragonIds = [...unlockedDragonIds];
  return {
    round: 1,
    gold: CONFIG.STARTING_GOLD,
    roundsSurvived: 0,
    team: Array(CONFIG.TEAM_SIZE).fill(null),
    bench: Array(CONFIG.BENCH_SIZE).fill(null),
    shop: generateShop(availableDragonIds, random),
    unlockedDragonIds: availableDragonIds,
    lastDiscoveries: [],
  };
}

// Convert owned team slots to fresh battle instances for this round.
export function createPlayerBattleTeam(team) {
  return team
    .filter(Boolean)
    .map((owned, index) => {
      const instance = createBattleInstance(getDragon(owned.id), owned.tier, 'player', index);
      instance.uid = owned.uid;
      return instance;
    });
}

// Create the enemy team for the current run round.
export function createRoundEnemyTeam(round, random = Math.random) {
  return generateEnemyTeam(round, random);
}

// Apply a winning battle result to the persistent run state.
export function applyWin(runState, random = Math.random) {
  const nextState = {
    ...runState,
    team: runState.team.map(refreshOwnedDragonHealth),
    bench: runState.bench.map(refreshOwnedDragonHealth),
    shop: [...runState.shop],
    unlockedDragonIds: [...runState.unlockedDragonIds],
    roundsSurvived: runState.round,
  };
  nextState.gold += calculateRoundGold(runState.round);
  nextState.round += 1;
  nextState.shop = generateShop(nextState.unlockedDragonIds, random);
  if (CONFIG.LOG_ENABLED && CONFIG.LOG_STATE) {
    console.log(`[STATE] advanced to round ${nextState.round}`);
  }
  return nextState;
}

// Reset an owned dragon to full health for the next prep/fight round.
export function refreshOwnedDragonHealth(owned) {
  if (!owned) return null;
  const tierData = getDragon(owned.id).tiers[owned.tier - 1];
  return { ...owned, hp: tierData.hp, maxHp: tierData.hp };
}

// Return whether a run should end after a battle outcome.
export function isRunDefeat(outcome) {
  return outcome !== 'win';
}
