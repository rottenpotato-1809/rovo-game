import { CONFIG } from '../config.js';

// Calculate the gold reward for winning a round.
export function calculateRoundGold(roundNumber) {
  return CONFIG.GOLD_PER_WIN_BASE + (roundNumber * CONFIG.GOLD_PER_WIN_SCALING);
}

// Calculate start-of-prep interest from saved gold.
export function calculateInterest(currentGold) {
  const ticks = Math.floor(currentGold / CONFIG.INTEREST_THRESHOLD) * CONFIG.INTEREST_PER_THRESHOLD;
  return Math.min(ticks, CONFIG.INTEREST_CAP);
}

// Return the configured sell value for a dragon tier.
export function getSellPrice(tier) {
  if (tier === 1) return CONFIG.SELL_PRICE_T1;
  if (tier === 2) return CONFIG.SELL_PRICE_T2;
  return CONFIG.SELL_PRICE_T3;
}

// Check if a wallet has enough gold for a cost.
export function canAfford(gold, cost) {
  return gold >= cost;
}

// Spend gold without allowing the wallet to go negative.
export function spend(gold, amount) {
  if (!canAfford(gold, amount)) return { gold, success: false };
  return { gold: gold - amount, success: true };
}

// Add gold to a wallet.
export function earn(gold, amount) {
  return gold + amount;
}
