import { CONFIG } from '../src/config.js';
import { getDragon } from '../src/data/dragons.js';
import { simulateBattle } from '../src/systems/battle.js';
import { executeMerge } from '../src/systems/merge.js';
import { applyWin, createPlayerBattleTeam, createRoundEnemyTeam, createRunState } from '../src/systems/run.js';
import { buyDragon, rerollShop } from '../src/systems/shop.js';

const DEFAULT_RUNS = 1000;
const MAX_REROLLS_PER_ROUND = 2;
const MIN_GOLD_AFTER_REROLL = CONFIG.DRAGON_BUY_COST;
const TIER_SCORE_WEIGHT = 1000;
const HP_SCORE_WEIGHT = 0.2;
const SUPPORT_SCORE_BONUS = 20;
const TANK_SCORE_BONUS = 15;

CONFIG.LOG_BATTLE = false;
CONFIG.LOG_SHOP = false;
CONFIG.LOG_MERGE = false;
CONFIG.LOG_STATE = false;

// Run a repeatable approximation of a competent, duplicate-focused player.
export function simulateRun(seed) {
  const random = createSeededRandom(seed);
  let run = createRunState(CONFIG.DEFAULT_SAVE.unlockedDragons, random);

  while (run.round <= CONFIG.TOTAL_ROUNDS) {
    run = draftRound(run, random);
    const playerTeam = createPlayerBattleTeam(run.team);
    const enemyTeam = createRoundEnemyTeam(run.round, random);
    const outcome = withSeededMathRandom(random, () => simulateBattle(playerTeam, enemyTeam).outcome);
    if (outcome !== 'win') return run.round;
    run = applyWin(run, random);
  }

  return CONFIG.TOTAL_ROUNDS + 1;
}

// Report where runs end; boss reach rate is the primary campaign-health metric.
export function simulateCampaign(runCount = DEFAULT_RUNS) {
  const lossesByRound = Array(CONFIG.TOTAL_ROUNDS + 1).fill(0);
  for (let index = 0; index < runCount; index++) {
    const resultRound = simulateRun(index + 1);
    lossesByRound[resultRound > CONFIG.TOTAL_ROUNDS ? 0 : resultRound]++;
  }
  const roundLossCounts = lossesByRound.slice(1);
  let remainingRuns = runCount;
  const conditionalLossRates = roundLossCounts.map(losses => {
    const rate = remainingRuns > 0 ? losses / remainingRuns : 0;
    remainingRuns -= losses;
    return rate;
  });
  const earlyLosses = roundLossCounts.slice(0, 6).reduce((total, losses) => total + losses, 0);
  const midLosses = roundLossCounts.slice(6, 8).reduce((total, losses) => total + losses, 0);
  return {
    runCount,
    bossReached: lossesByRound[0],
    bossReachRate: lossesByRound[0] / runCount,
    lossesByRound: roundLossCounts,
    conditionalLossRates,
    earlyLossRate: earlyLosses / runCount,
    midLossRate: midLosses / (runCount - earlyLosses),
  };
}

// Spend with intent: establish a full team, then concentrate copies and merge.
function draftRound(initialRun, random) {
  let run = organizeTeam(mergeAll(initialRun));
  let rerolls = 0;

  while (run.gold >= CONFIG.DRAGON_BUY_COST) {
    const shopIndex = choosePurchase(run);
    if (shopIndex >= 0) {
      const purchase = buyDragon(run, shopIndex);
      if (!purchase.success) break;
      run = organizeTeam(mergeAll(purchase.state));
      continue;
    }
    if (rerolls >= MAX_REROLLS_PER_ROUND || run.gold < CONFIG.REROLL_COST + MIN_GOLD_AFTER_REROLL) break;
    const reroll = rerollShop(run, random);
    if (!reroll.success) break;
    run = reroll.state;
    rerolls++;
  }

  return organizeTeam(mergeAll(run));
}

// Prefer copies already owned; fill empty team slots before narrowing the build.
function choosePurchase(run) {
  if (!run.bench.includes(null)) return -1;
  const owned = [...run.team, ...run.bench].filter(Boolean);
  const counts = countOwnedIds(owned);
  const needsTeam = owned.length < CONFIG.TEAM_SIZE;
  let bestIndex = -1;
  let bestScore = -Infinity;

  run.shop.forEach((id, index) => {
    if (!id) return;
    const duplicateCount = counts.get(id) || 0;
    if (!needsTeam && duplicateCount === 0) return;
    const score = (duplicateCount * TIER_SCORE_WEIGHT) + getDragonScore(id, 1);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
}

// Execute every available merge, including chained Tier 2 to Tier 3 upgrades.
function mergeAll(initialRun) {
  let run = initialRun;
  while (true) {
    const result = executeMerge(run);
    if (!result.success) return run;
    run = result.state;
  }
}

// Put the three highest-value owned dragons on the active team.
function organizeTeam(run) {
  const owned = [...run.team, ...run.bench].filter(Boolean);
  owned.sort((left, right) => getOwnedScore(right) - getOwnedScore(left));
  return {
    ...run,
    team: Array.from({ length: CONFIG.TEAM_SIZE }, (_, index) => owned[index] || null),
    bench: Array.from({ length: CONFIG.BENCH_SIZE }, (_, index) => owned[index + CONFIG.TEAM_SIZE] || null),
  };
}

function getOwnedScore(owned) {
  return getDragonScore(owned.id, owned.tier);
}

function getDragonScore(id, tier) {
  const dragon = getDragon(id);
  const stats = dragon.tiers[tier - 1];
  const roleBonus = dragon.role === 'Support' ? SUPPORT_SCORE_BONUS : dragon.role === 'Tank' ? TANK_SCORE_BONUS : 0;
  return (tier * TIER_SCORE_WEIGHT) + stats.atk + (stats.hp * HP_SCORE_WEIGHT) + stats.spd + roleBonus;
}

function countOwnedIds(owned) {
  const counts = new Map();
  owned.forEach(dragon => counts.set(dragon.id, (counts.get(dragon.id) || 0) + 1));
  return counts;
}

function withSeededMathRandom(random, callback) {
  const originalRandom = Math.random;
  Math.random = random;
  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
}

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

if (typeof process !== 'undefined' && process.argv?.[1]?.replaceAll('\\', '/').endsWith('/scripts/balance-sim.mjs')) {
  const requestedRuns = Number(process.argv[2]);
  const report = simulateCampaign(Number.isInteger(requestedRuns) && requestedRuns > 0 ? requestedRuns : DEFAULT_RUNS);
  console.log(`Runs: ${report.runCount}`);
  console.log(`Boss reached: ${report.bossReached} (${(report.bossReachRate * 100).toFixed(1)}%)`);
  console.log(`Losses by round: ${report.lossesByRound.map((count, index) => `R${index + 1}=${count}`).join(', ')}`);
  console.log(`Conditional loss rates: ${report.conditionalLossRates.map((rate, index) => `R${index + 1}=${(rate * 100).toFixed(1)}%`).join(', ')}`);
  console.log(`Phase loss rates: R1-6=${(report.earlyLossRate * 100).toFixed(1)}%, R7-8=${(report.midLossRate * 100).toFixed(1)}%`);
}
