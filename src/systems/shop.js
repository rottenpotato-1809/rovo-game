import { CONFIG } from '../config.js';
import { getDragon } from '../data/dragons.js';
import { canAfford, getSellPrice, spend } from './economy.js';

// Generate a random shop, excluding dragon families already owned at max tier.
export function generateShop(unlockedDragonIds, random = Math.random, ownedDragons = []) {
  const maxedDragonIds = new Set(
    ownedDragons.filter(dragon => dragon?.tier >= CONFIG.MAX_TIER).map(dragon => dragon.id),
  );
  const pool = unlockedDragonIds.filter(id => getDragon(id) && !maxedDragonIds.has(id));
  const shop = [];
  for (let index = 0; index < CONFIG.SHOP_SIZE; index++) {
    const dragonId = pool.length > 0 ? pool[Math.floor(random() * pool.length)] : null;
    shop.push(dragonId);
  }
  if (CONFIG.LOG_ENABLED && CONFIG.LOG_SHOP) {
    console.log(`[SHOP] generated ${shop.join(', ')}`);
  }
  return shop;
}

// Buy a dragon into the active team first, then use the bench as overflow.
export function buyDragon(state, shopIndex) {
  const dragonId = state.shop[shopIndex];
  if (!dragonId || !canAfford(state.gold, CONFIG.DRAGON_BUY_COST)) {
    return { state, success: false };
  }
  const teamIndex = state.team.findIndex(slot => slot === null);
  const benchIndex = state.bench.findIndex(slot => slot === null);
  if (teamIndex === -1 && benchIndex === -1) return { state, success: false };
  const paid = spend(state.gold, CONFIG.DRAGON_BUY_COST);
  const nextState = cloneDraftState(state);
  nextState.gold = paid.gold;
  const target = teamIndex >= 0 ? { zone: 'team', index: teamIndex } : { zone: 'bench', index: benchIndex };
  nextState[target.zone][target.index] = createOwnedDragon(dragonId);
  nextState.shop[shopIndex] = null;
  if (CONFIG.LOG_ENABLED && CONFIG.LOG_SHOP) {
    console.log(`[SHOP] bought ${dragonId}`);
  }
  return { state: nextState, success: true, target };
}

// Sell a dragon from a team or bench slot.
export function sellDragon(state, source) {
  const nextState = cloneDraftState(state);
  const list = source.zone === 'team' ? nextState.team : nextState.bench;
  const dragon = list[source.index];
  if (!dragon) return { state, success: false };
  list[source.index] = null;
  nextState.gold += getSellPrice(dragon.tier);
  if (CONFIG.LOG_ENABLED && CONFIG.LOG_SHOP) {
    console.log(`[SHOP] sold ${dragon.id} T${dragon.tier}`);
  }
  return { state: nextState, success: true };
}

// Spend reroll gold and replace shop offerings.
export function rerollShop(state, random = Math.random) {
  const paid = spend(state.gold, CONFIG.REROLL_COST);
  if (!paid.success) return { state, success: false };
  const nextState = cloneDraftState(state);
  nextState.gold = paid.gold;
  nextState.shop = generateShop(nextState.unlockedDragonIds, random, [...nextState.team, ...nextState.bench]);
  if (CONFIG.LOG_ENABLED && CONFIG.LOG_SHOP) console.log('[SHOP] rerolled');
  return { state: nextState, success: true };
}

// Create an owned dragon record for draft storage.
export function createOwnedDragon(id, tier = 1) {
  const dragon = getDragon(id);
  const tierData = dragon.tiers[tier - 1];
  return {
    uid: `${id}_${tier}_${Date.now()}_${Math.random()}`,
    id,
    tier,
    hp: tierData.hp,
    maxHp: tierData.hp,
  };
}

// Clone the mutable draft state without sharing slot arrays.
export function cloneDraftState(state) {
  return {
    ...state,
    team: state.team.map(dragon => dragon ? { ...dragon } : null),
    bench: state.bench.map(dragon => dragon ? { ...dragon } : null),
    shop: [...state.shop],
    unlockedDragonIds: [...state.unlockedDragonIds],
  };
}
