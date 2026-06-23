import { CONFIG } from '../config.js';
import { DRAGONS, getDragon } from '../data/dragons.js';
import { createBattleInstance, simulateBattle, simulateBossFight } from '../systems/battle.js';
import { calculateRoundGold } from '../systems/economy.js';
import { generateEnemyTeam } from '../systems/enemy.js';
import { executeMerge } from '../systems/merge.js';
import { buyDragon, generateShop } from '../systems/shop.js';
import { calculateXP } from '../systems/progression.js';

const DEFAULT_RUNS = 2000;
const GOOD_TEAM = [
  { id: 'zephyr', tier: 3 },
  { id: 'crystalwing', tier: 2 },
  { id: 'solflare', tier: 2 },
];
const PERFECT_TEAM = [
  { id: 'zephyr', tier: 3 },
  { id: 'crystalwing', tier: 3 },
  { id: 'crystalwing', tier: 3 },
];

CONFIG.LOG_BATTLE = false;
CONFIG.LOG_SHOP = false;
CONFIG.LOG_MERGE = false;
CONFIG.LOG_STATE = false;
CONFIG.LOG_SAVE = false;

export function runBalanceSimulation(runCount = DEFAULT_RUNS, seedBase = 1) {
  const summary = createSummary(runCount);
  for (let index = 0; index < runCount; index += 1) {
    const result = simulateRandomRun(seedBase + index);
    collectRun(summary, result);
  }

  finalizeSummary(summary);
  return summary;
}

export function simulateRandomRun(seed) {
  const random = createSeededRandom(seed);
  let run = createHarnessRun(random);
  const result = {
    roundsSurvived: 0,
    reachedBoss: false,
    bossDamage: 0,
    bossTurns: 0,
    goldSpent: 0,
    purchasesByRound: Array(CONFIG.TOTAL_ROUNDS).fill(0),
    highestTierByRound: Array(CONFIG.TOTAL_ROUNDS).fill(0),
    fightResults: [],
  };

  while (run.round <= CONFIG.TOTAL_ROUNDS) {
    run = randomDraftRound(run, random, result);
    const playerTeam = createTeamInstances(run.team, 'player');
    const enemyTeam = generateEnemyTeam(run.round, random);
    const battle = withSeededMathRandom(random, () => simulateBattle(playerTeam, enemyTeam));
    const teamSnapshot = run.team.filter(Boolean).map(dragon => ({ id: dragon.id, tier: dragon.tier }));
    result.fightResults.push({
      round: run.round,
      outcome: battle.outcome,
      totalTurns: battle.totalTurns,
      team: teamSnapshot,
    });

    if (battle.outcome !== 'win') {
      result.roundsSurvived = run.round - 1;
      return result;
    }

    result.roundsSurvived = run.round;
    run.gold += calculateRoundGold(run.round);
    run.round += 1;
    run.team = run.team.map(refreshOwnedDragon);
    run.bench = run.bench.map(refreshOwnedDragon);
    run.shop = generateShop(run.unlockedDragonIds, random, [...run.team, ...run.bench]);
  }

  result.reachedBoss = true;
  const bossTeam = createTeamInstances(run.team, 'player');
  const boss = withSeededMathRandom(random, () => simulateBossFight(bossTeam));
  result.bossDamage = boss.totalDamage;
  result.bossTurns = boss.totalTurns;
  return result;
}

export function createBalanceReport(summary) {
  const date = new Date().toISOString().slice(0, 10);
  const rows = [
    ['Round 1-2 survival', '~95%', formatPercent(summary.roundBands.r1to2.survival), status(summary.roundBands.r1to2.survival, 0.90, 0.99)],
    ['Round 3-4 survival', '~80%', formatPercent(summary.roundBands.r3to4.survival), status(summary.roundBands.r3to4.survival, 0.70, 0.90)],
    ['Round 5-6 survival', '~60%', formatPercent(summary.roundBands.r5to6.survival), status(summary.roundBands.r5to6.survival, 0.50, 0.70)],
    ['Round 7-8 survival', '~40%', formatPercent(summary.roundBands.r7to8.survival), status(summary.roundBands.r7to8.survival, 0.30, 0.50)],
    ['Round 9-10 survival', '~25%', formatPercent(summary.roundBands.r9to10.survival), status(summary.roundBands.r9to10.survival, 0.18, 0.35)],
    ['Full clear rate', '15-20%', formatPercent(summary.fullClearRate), status(summary.fullClearRate, 0.15, 0.20)],
    ['Avg fight length', '8-15 turns', `${summary.averageFightTurns.toFixed(1)} turns`, status(summary.averageFightTurns, 8, 15)],
    ['Tank mirror length', '<30 turns', `${summary.scenarios.tankMirror.totalTurns} turns`, summary.scenarios.tankMirror.totalTurns < 30 ? 'OK' : 'MISS'],
    ['DPS mirror length', '4-8 turns', `${summary.scenarios.dpsMirror.totalTurns} turns`, status(summary.scenarios.dpsMirror.totalTurns, 4, 8)],
    ['Healer mirror timeout', 'Rare/none', summary.scenarios.healerMirror.outcome, summary.scenarios.healerMirror.outcome === 'timeout' ? 'MISS' : 'OK'],
    ['Avg boss score', '800-1500', `${Math.round(summary.averageBossScore)}`, status(summary.averageBossScore, 800, 1500)],
    ['Good boss score', '2000-4000', `${summary.scenarios.goodBoss.totalDamage}`, status(summary.scenarios.goodBoss.totalDamage, 2000, 4000)],
    ['Perfect boss score', '5000-8000', `${summary.scenarios.perfectBoss.totalDamage}`, status(summary.scenarios.perfectBoss.totalDamage, 5000, 8000)],
    ['Good boss duration', '5-12 turns', `${summary.scenarios.goodBoss.totalTurns} turns`, status(summary.scenarios.goodBoss.totalTurns, 5, 12)],
    ['Perfect boss duration', '5-12 turns', `${summary.scenarios.perfectBoss.totalTurns} turns`, status(summary.scenarios.perfectBoss.totalTurns, 5, 12)],
    ['Avg XP per run', 'floor check', `${summary.averageXP.toFixed(1)}`, 'INFO'],
  ];

  DRAGONS.forEach(dragon => {
    const stats = summary.dragonWinRates[dragon.id];
    if (!stats || stats.fights === 0) {
      rows.push([`${dragon.name} win rate`, '45-55%', 'N/A in starter random pool', 'INFO']);
      return;
    }
    rows.push([`${dragon.name} win rate`, '45-55%', formatPercent(stats.winRate), status(stats.winRate, 0.45, 0.55)]);
  });

  return [
    `# Balance Report - ${date}`,
    '',
    `Simulation: ${summary.runCount} random-floor runs`,
    '',
    '| Metric | Target | Actual | Status |',
    '| --- | --- | --- | --- |',
    ...rows.map(row => `| ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]} |`),
    '',
    '## Economy Pacing',
    '',
    `- Average run length: ${summary.averageRunLength.toFixed(2)} rounds survived.`,
    `- Average gold spent: ${summary.averageGoldSpent.toFixed(1)}g.`,
    `- Average purchases by round 3: ${summary.pacing.averagePurchasesByRound[2].toFixed(1)} dragons.`,
    `- Runs with at least one T2 by round 6: ${formatPercent(summary.pacing.t2ByRound6Rate)}.`,
    `- Runs with at least one T3 by round 10: ${formatPercent(summary.pacing.t3ByRound10Rate)}.`,
    '',
    '## Composition Notes',
    '',
    `- Mixed-role fight win rate: ${formatPercent(summary.mixedWinRate)}.`,
    `- Mono-family fight win rate: ${formatPercent(summary.monoWinRate)}.`,
    `- Perfect boss benchmark uses the highest-damage observed T3 family mix; its score is healthy, but duration highlights Crystalwing shield-stall risk.`,
    `- The no-reroll random-floor clear target conflicts with the newer GDD competent-player target, so campaign tuning should keep both reports visible before changing enemy scaling.`,
    '',
    '## Progression Estimate',
    '',
    ...summary.progression.map(item => `- ${item.label}: about ${item.runs} random-floor runs at current average XP.`),
  ].join('\n');
}

function createHarnessRun(random) {
  const unlockedDragonIds = [...CONFIG.DEFAULT_SAVE.unlockedDragons];
  return {
    round: 1,
    gold: CONFIG.STARTING_GOLD,
    team: Array(CONFIG.TEAM_SIZE).fill(null),
    bench: Array(CONFIG.BENCH_SIZE).fill(null),
    shop: generateShop(unlockedDragonIds, random),
    unlockedDragonIds,
  };
}

function randomDraftRound(initialRun, random, result) {
  let run = mergeAll(initialRun);
  while (run.gold >= CONFIG.DRAGON_BUY_COST && hasOpenStorage(run)) {
    const options = run.shop
      .map((id, index) => ({ id, index }))
      .filter(option => option.id);
    if (options.length === 0) break;
    const option = options[Math.floor(random() * options.length)];
    const purchase = buyDragon(run, option.index);
    if (!purchase.success) break;
    run = mergeAll(purchase.state);
    result.goldSpent += CONFIG.DRAGON_BUY_COST;
    result.purchasesByRound[run.round - 1] += 1;
  }

  run = randomizeSlots(mergeAll(run), random);
  const owned = [...run.team, ...run.bench].filter(Boolean);
  result.highestTierByRound[run.round - 1] = owned.reduce((max, dragon) => Math.max(max, dragon.tier), 0);
  return run;
}

function mergeAll(initialRun) {
  let run = initialRun;
  while (true) {
    const result = executeMerge(run);
    if (!result.success) return run;
    run = result.state;
  }
}

function randomizeSlots(run, random) {
  const owned = shuffle([...run.team, ...run.bench].filter(Boolean), random);
  return {
    ...run,
    team: Array.from({ length: CONFIG.TEAM_SIZE }, (_, index) => owned[index] || null),
    bench: Array.from({ length: CONFIG.BENCH_SIZE }, (_, index) => owned[index + CONFIG.TEAM_SIZE] || null),
  };
}

function createTeamInstances(ownedTeam, team) {
  return ownedTeam
    .filter(Boolean)
    .map((owned, index) => {
      const instance = createBattleInstance(getDragon(owned.id), owned.tier, team, index);
      instance.uid = owned.uid;
      return instance;
    });
}

function refreshOwnedDragon(owned) {
  if (!owned) return null;
  const tier = getDragon(owned.id).tiers[owned.tier - 1];
  return { ...owned, hp: tier.hp, maxHp: tier.hp };
}

function hasOpenStorage(run) {
  return run.team.some(slot => slot === null) || run.bench.some(slot => slot === null);
}

function createSummary(runCount) {
  return {
    runCount,
    roundEntrants: Array(CONFIG.TOTAL_ROUNDS).fill(0),
    roundWins: Array(CONFIG.TOTAL_ROUNDS).fill(0),
    fightTurns: [],
    bossScores: [],
    bossTurns: [],
    runLengths: [],
    goldSpent: [],
    xpEarned: [],
    purchasesByRoundTotals: Array(CONFIG.TOTAL_ROUNDS).fill(0),
    t2ByRound6: 0,
    t3ByRound10: 0,
    dragonStats: Object.fromEntries(DRAGONS.map(dragon => [dragon.id, { wins: 0, fights: 0 }])),
    mixed: { wins: 0, fights: 0 },
    mono: { wins: 0, fights: 0 },
  };
}

function collectRun(summary, result) {
  summary.runLengths.push(result.roundsSurvived);
  summary.goldSpent.push(result.goldSpent);
  summary.xpEarned.push(calculateXP(result.roundsSurvived, result.bossDamage));
  result.purchasesByRound.forEach((count, index) => {
    summary.purchasesByRoundTotals[index] += count;
  });
  if (Math.max(...result.highestTierByRound.slice(0, 6)) >= 2) summary.t2ByRound6 += 1;
  if (Math.max(...result.highestTierByRound) >= 3) summary.t3ByRound10 += 1;

  result.fightResults.forEach(fight => {
    const roundIndex = fight.round - 1;
    const won = fight.outcome === 'win';
    summary.roundEntrants[roundIndex] += 1;
    if (won) summary.roundWins[roundIndex] += 1;
    summary.fightTurns.push(fight.totalTurns);
    collectComposition(summary, fight.team, won);
  });

  if (result.reachedBoss) {
    summary.bossScores.push(result.bossDamage);
    summary.bossTurns.push(result.bossTurns);
  }
}

function collectComposition(summary, team, won) {
  const uniqueIds = [...new Set(team.map(dragon => dragon.id))];
  uniqueIds.forEach(id => {
    summary.dragonStats[id].fights += 1;
    if (won) summary.dragonStats[id].wins += 1;
  });

  const roles = new Set(team.map(dragon => getDragon(dragon.id).role));
  if (roles.size >= 3) {
    summary.mixed.fights += 1;
    if (won) summary.mixed.wins += 1;
  }
  if (uniqueIds.length === 1 && team.length === CONFIG.TEAM_SIZE) {
    summary.mono.fights += 1;
    if (won) summary.mono.wins += 1;
  }
}

function finalizeSummary(summary) {
  summary.fullClearRate = summary.bossScores.length / summary.runCount;
  summary.averageRunLength = average(summary.runLengths);
  summary.averageFightTurns = average(summary.fightTurns);
  summary.averageBossScore = average(summary.bossScores);
  summary.averageGoldSpent = average(summary.goldSpent);
  summary.averageXP = average(summary.xpEarned);
  summary.roundSurvival = summary.roundEntrants.map((entrants, index) => entrants > 0 ? summary.roundWins[index] / entrants : 0);
  summary.roundBands = getRoundBands(summary);
  summary.pacing = {
    averagePurchasesByRound: cumulativeAverage(summary.purchasesByRoundTotals, summary.runCount),
    t2ByRound6Rate: summary.t2ByRound6 / summary.runCount,
    t3ByRound10Rate: summary.t3ByRound10 / summary.runCount,
  };
  summary.dragonWinRates = Object.fromEntries(Object.entries(summary.dragonStats).map(([id, stats]) => [
    id,
    { fights: stats.fights, winRate: stats.fights > 0 ? stats.wins / stats.fights : 0 },
  ]));
  summary.mixedWinRate = summary.mixed.fights > 0 ? summary.mixed.wins / summary.mixed.fights : 0;
  summary.monoWinRate = summary.mono.fights > 0 ? summary.mono.wins / summary.mono.fights : 0;
  summary.scenarios = runScenarioChecks();
  summary.progression = getProgressionEstimate(summary.averageXP);
}

function getRoundBands(summary) {
  return {
    r1to2: band(summary, 0, 2),
    r3to4: band(summary, 2, 4),
    r5to6: band(summary, 4, 6),
    r7to8: band(summary, 6, 8),
    r9to10: band(summary, 8, 10),
  };
}

function band(summary, startInclusive, endExclusive) {
  const entrants = summary.roundEntrants.slice(startInclusive, endExclusive).reduce((total, count) => total + count, 0);
  const wins = summary.roundWins.slice(startInclusive, endExclusive).reduce((total, count) => total + count, 0);
  return { entrants, wins, survival: entrants > 0 ? wins / entrants : 0 };
}

function runScenarioChecks() {
  return {
    tankMirror: runMirror(['stonescale', 'stonescale', 'stonescale']),
    dpsMirror: runMirror(['ember', 'zephyr', 'ember']),
    healerMirror: runMirror(['tidecaller', 'tidecaller', 'tidecaller']),
    goodBoss: simulateBossScenario(GOOD_TEAM),
    perfectBoss: simulateBossScenario(PERFECT_TEAM),
  };
}

function runMirror(ids) {
  const player = ids.map((id, index) => createBattleInstance(getDragon(id), 1, 'player', index));
  const enemy = ids.map((id, index) => createBattleInstance(getDragon(id), 1, 'enemy', index));
  return withSeededMathRandom(createSeededRandom(9000 + ids.length), () => simulateBattle(player, enemy));
}

function simulateBossScenario(team) {
  const instances = team.map((dragon, index) => createBattleInstance(getDragon(dragon.id), dragon.tier, 'player', index));
  return withSeededMathRandom(createSeededRandom(12000 + team.length), () => simulateBossFight(instances));
}

function getProgressionEstimate(averageXP) {
  return CONFIG.UNLOCK_THRESHOLDS.map((threshold, index) => ({
    label: `Unlock ${index + 1} (${threshold} XP)`,
    runs: averageXP > 0 ? Math.ceil(threshold / averageXP) : Infinity,
  }));
}

function cumulativeAverage(values, divisor) {
  let total = 0;
  return values.map(value => {
    total += value;
    return total / divisor;
  });
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function shuffle(items, random) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
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

function formatPercent(value) {
  return `${(value * CONFIG.PERCENT_MULTIPLIER).toFixed(1)}%`;
}

function status(value, min, max) {
  return value >= min && value <= max ? 'OK' : 'MISS';
}

if (isDirectRun()) {
  const requestedRuns = Number(process.argv[2]);
  const runCount = Number.isInteger(requestedRuns) && requestedRuns > 0 ? requestedRuns : DEFAULT_RUNS;
  const summary = runBalanceSimulation(runCount);
  console.log(createBalanceReport(summary));
}

function isDirectRun() {
  return typeof process !== 'undefined'
    && process.argv?.[1]?.replaceAll('\\', '/').endsWith('/src/tests/balance.js');
}
