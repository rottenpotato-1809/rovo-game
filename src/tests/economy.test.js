import { CONFIG } from '../config.js';
import { calculateInterest, calculateRoundGold, canAfford, earn, getSellPrice, spend } from '../systems/economy.js';
import { assertEqual, test, summarize } from './testHarness.js';

console.log('Economy System Test Suite');

test('round gold follows configured formula', () => {
  assertEqual(calculateRoundGold(4), CONFIG.GOLD_PER_WIN_BASE + (4 * CONFIG.GOLD_PER_WIN_SCALING));
});

test('interest rewards saved gold up to the cap', () => {
  assertEqual(calculateInterest(0), 0);
  assertEqual(calculateInterest(CONFIG.INTEREST_THRESHOLD - 1), 0);
  assertEqual(calculateInterest(CONFIG.INTEREST_THRESHOLD), CONFIG.INTEREST_PER_THRESHOLD);
  assertEqual(calculateInterest(CONFIG.INTEREST_THRESHOLD * 2), CONFIG.INTEREST_PER_THRESHOLD * 2);
  assertEqual(calculateInterest(CONFIG.INTEREST_THRESHOLD * 4), CONFIG.INTEREST_CAP);
});

test('sell prices match tier config', () => {
  assertEqual(getSellPrice(1), CONFIG.SELL_PRICE_T1);
  assertEqual(getSellPrice(2), CONFIG.SELL_PRICE_T2);
  assertEqual(getSellPrice(3), CONFIG.SELL_PRICE_T3);
});

test('spending cannot go negative', () => {
  const result = spend(0, CONFIG.DRAGON_BUY_COST);
  assertEqual(result.success, false);
  assertEqual(result.gold, 0);
});

test('afford and earn update gold predictably', () => {
  assertEqual(canAfford(CONFIG.DRAGON_BUY_COST, CONFIG.DRAGON_BUY_COST), true);
  assertEqual(earn(1, 2), 3);
});

summarize();
