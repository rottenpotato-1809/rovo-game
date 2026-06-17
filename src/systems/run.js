import { CONFIG } from '../config.js';
import { getDragon } from '../data/dragons.js';
import { createBattleInstance } from './battle.js';
import { calculateRoundGold } from './economy.js';
import { generateEnemyTeam } from './enemy.js';
import { generateShop } from './shop.js';

// Create the initial draft state for a new run.
export function createRunState(random = Math.random) {
  const unlockedDragonIds = [...CONFIG.DEFAULT_SAVE.unlockedDragons];
  return {
    round: 1,
    gold: CONFIG.STARTING_GOLD,
    roundsSurvived: 0,
    team: Array(CONFIG.TEAM_SIZE).fill(null),
    bench: Array(CONFIG.BENCH_SIZE).fill(null),
    shop: generateShop(unlockedDragonIds, random),
    unlockedDragonIds,
    lastDiscoveries: [],
  };
}

// Convert owned team slots to battle instances while preserving current HP.
export function createPlayerBattleTeam(team) {
  return team
    .filter(Boolean)
    .map((owned, index) => {
      const instance = createBattleInstance(getDragon(owned.id), owned.tier, 'player', index);
      instance.uid = owned.uid;
      instance.hp = owned.hp;
      instance.maxHp = owned.maxHp;
      return instance;
    });
}

// Create the enemy team for the current run round.
export function createRoundEnemyTeam(round, random = Math.random) {
  return generateEnemyTeam(round, random);
}

// Apply a winning battle result to the persistent run state.
export function applyWin(runState, survivingPlayer, random = Math.random) {
  const survivorsByUid = new Map(survivingPlayer.map(dragon => [dragon.uid, dragon]));
  const nextState = {
    ...runState,
    team: runState.team.map(owned => {
      if (!owned) return null;
      const survivor = survivorsByUid.get(owned.uid);
      if (!survivor) return null;
      return { ...owned, hp: survivor.hp, maxHp: survivor.maxHp };
    }),
    bench: runState.bench.map(owned => owned ? { ...owned } : null),
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

// Return whether a run should end after a battle outcome.
export function isRunDefeat(outcome) {
  return outcome !== 'win';
}
