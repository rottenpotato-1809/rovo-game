import { CONFIG } from '../config.js';
import { buyDragon, generateShop, rerollShop } from '../systems/shop.js';
import { assert, assertEqual, test, summarize } from './testHarness.js';

console.log('Shop System Test Suite');

test('shop size matches config', () => {
  const shop = generateShop(['ember'], () => 0);
  assertEqual(shop.length, CONFIG.SHOP_SIZE);
});

test('shop only contains unlocked dragons', () => {
  const shop = generateShop(['ember', 'stonescale'], () => 0.75);
  assert(shop.every(id => ['ember', 'stonescale'].includes(id)));
});

test('shop excludes dragon families already owned at Tier 3', () => {
  const owned = [{ id: 'ember', tier: CONFIG.MAX_TIER }];
  const shop = generateShop(['ember', 'stonescale'], () => 0, owned);
  assert(shop.every(id => id === 'stonescale'));
});

test('shop returns empty slots when every unlocked family is Tier 3', () => {
  const owned = [{ id: 'ember', tier: CONFIG.MAX_TIER }];
  const shop = generateShop(['ember'], () => 0, owned);
  assert(shop.every(id => id === null));
});

test('buying spends gold and fills the team before the bench', () => {
  const state = {
    gold: CONFIG.DRAGON_BUY_COST,
    team: Array(CONFIG.TEAM_SIZE).fill(null),
    bench: Array(CONFIG.BENCH_SIZE).fill(null),
    shop: ['ember'],
    unlockedDragonIds: ['ember'],
  };
  const result = buyDragon(state, 0);
  assertEqual(result.success, true);
  assertEqual(result.state.gold, 0);
  assertEqual(result.state.team[0].id, 'ember');
  assertEqual(result.target.zone, 'team');
  assertEqual(result.state.shop[0], null);
});

test('bought shop slot cannot be bought again', () => {
  const state = {
    gold: CONFIG.DRAGON_BUY_COST * 2,
    team: Array(CONFIG.TEAM_SIZE).fill(null),
    bench: Array(CONFIG.BENCH_SIZE).fill(null),
    shop: ['ember'],
    unlockedDragonIds: ['ember'],
  };
  const firstBuy = buyDragon(state, 0);
  const secondBuy = buyDragon(firstBuy.state, 0);
  assertEqual(firstBuy.success, true);
  assertEqual(secondBuy.success, false);
  assertEqual([...secondBuy.state.team, ...secondBuy.state.bench].filter(Boolean).length, 1);
});

test('starting gold buys two round one dragons', () => {
  const expectedOpeningBuys = CONFIG.STARTING_GOLD / CONFIG.DRAGON_BUY_COST;
  const state = {
    gold: CONFIG.STARTING_GOLD,
    team: Array(CONFIG.TEAM_SIZE).fill(null),
    bench: Array(CONFIG.BENCH_SIZE).fill(null),
    shop: ['ember', 'stonescale'],
    unlockedDragonIds: ['ember', 'stonescale'],
  };
  const firstBuy = buyDragon(state, 0);
  const secondBuy = buyDragon(firstBuy.state, 1);
  assertEqual(firstBuy.success, true);
  assertEqual(secondBuy.success, true);
  assertEqual(secondBuy.state.gold, CONFIG.STARTING_GOLD - (CONFIG.DRAGON_BUY_COST * expectedOpeningBuys));
  assertEqual(secondBuy.state.team.filter(Boolean).length, expectedOpeningBuys);
});

test('buying uses the bench only after the team is full', () => {
  const state = {
    gold: CONFIG.DRAGON_BUY_COST,
    team: ['ember', 'ember', 'ember'].map(id => ({ id })),
    bench: Array(CONFIG.BENCH_SIZE).fill(null),
    shop: ['stonescale'],
    unlockedDragonIds: ['ember', 'stonescale'],
  };
  const result = buyDragon(state, 0);
  assertEqual(result.success, true);
  assertEqual(result.state.bench[0].id, 'stonescale');
  assertEqual(result.target.zone, 'bench');
});

test('reroll spends gold and refreshes offerings', () => {
  const state = {
    gold: CONFIG.REROLL_COST,
    team: Array(CONFIG.TEAM_SIZE).fill(null),
    bench: Array(CONFIG.BENCH_SIZE).fill(null),
    shop: ['ember', 'ember', 'ember'],
    unlockedDragonIds: ['ember', 'stonescale'],
  };
  const result = rerollShop(state, () => 0.99);
  assertEqual(result.success, true);
  assertEqual(result.state.gold, 0);
  assert(result.state.shop.every(id => id === 'stonescale'));
});

summarize();
