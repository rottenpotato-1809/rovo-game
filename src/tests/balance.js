import { CONFIG } from '../config.js';
import { DRAGONS, getDragon } from '../data/dragons.js';
import { createBattleInstance, simulateBattle, simulateBossFight } from '../systems/battle.js';
import { calculateInterest, calculateRoundGold } from '../systems/economy.js';
import { generateEnemyTeam } from '../systems/enemy.js';
import { executeMerge } from '../systems/merge.js';
import { buyDragon, generateShop, rerollShop, sellDragon } from '../systems/shop.js';
import { calculateXP } from '../systems/progression.js';

const DEFAULT_RUNS = 2000;
const PROFILE_RANDOM = 'RANDOM';
const PROFILE_COMPETENT = 'COMPETENT';
const PROFILE_PERFECT = 'PERFECT';
const PROFILES = [PROFILE_RANDOM, PROFILE_COMPETENT, PROFILE_PERFECT];
const COMPETENT_MAX_REROLLS = 2;
const COMPETENT_REROLL_GOLD_FLOOR = 5;
const PERFECT_MAX_REROLLS = 12;
const PERFECT_REROLL_GOLD_FLOOR = CONFIG.DRAGON_BUY_COST;
const TIER_SCORE_WEIGHT = 1200;
const HP_SCORE_WEIGHT = 0.22;
const TEAM_ROLE_BONUS = 180;
const MERGE_THIRD_COPY_BONUS = 900;
const MERGE_SECOND_COPY_BONUS = 360;
const PERFECT_THIRD_T1_BONUS = 2200;
const PERFECT_SECOND_T1_BONUS = 760;
const PERFECT_T3_PATH_BONUS = 1400;
const DEAD_END_SELL_MAX_COPIES = 1;
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

export function runProfileSimulations(runCount = DEFAULT_RUNS, seedBase = 1) {
  return Object.fromEntries(PROFILES.map((profile, index) => [
    profile,
    runProfileSimulation(profile, runCount, seedBase + (index * runCount * 17)),
  ]));
}

export function runProfileSimulation(profile = PROFILE_RANDOM, runCount = DEFAULT_RUNS, seedBase = 1) {
  const summary = createSummary(runCount, profile);
  for (let index = 0; index < runCount; index += 1) {
    const result = simulateProfileRun(profile, seedBase + index);
    collectRun(summary, result);
  }

  finalizeSummary(summary);
  return summary;
}

// Compatibility alias for older callers: the default report is the RANDOM floor.
export function runBalanceSimulation(runCount = DEFAULT_RUNS, seedBase = 1) {
  return runProfileSimulation(PROFILE_RANDOM, runCount, seedBase);
}

export function simulateProfileRun(profile, seed) {
  const random = createSeededRandom(seed);
  let run = createHarnessRun(random);
  const result = createRunResult(profile);

  while (run.round <= CONFIG.TOTAL_ROUNDS) {
    run = draftRoundForProfile(profile, run, random, result);
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
    run = applySimulationInterest(run);
    run.shop = generateShop(run.unlockedDragonIds, random, [...run.team, ...run.bench]);
  }

  result.reachedBoss = true;
  const bossTeam = createTeamInstances(run.team, 'player');
  const boss = withSeededMathRandom(random, () => simulateBossFight(bossTeam));
  result.bossDamage = boss.totalDamage;
  result.bossTurns = boss.totalTurns;
  return result;
}

export function createBalanceReport(reports) {
  const profileReports = reports.profile ? { [reports.profile]: reports } : reports;
  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    `# Balance Report - ${date}`,
    '',
    `Simulation: ${Object.values(profileReports)[0]?.runCount || 0} runs per profile`,
    '',
    '| Player Profile | Boss Reach Target | Boss Reach Actual | Avg Run Length Target | Avg Run Length Actual | Status |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  PROFILES.forEach(profile => {
    const report = profileReports[profile];
    if (!report) return;
    const target = getProfileTarget(profile);
    const reachStatus = status(report.fullClearRate, target.bossMin, target.bossMax);
    lines.push(`| ${profile} | ${formatPercent(target.bossMin)}-${formatPercent(target.bossMax)} | ${formatPercent(report.fullClearRate)} | ${target.runLengthLabel} | ${report.averageRunLength.toFixed(2)} | ${reachStatus} |`);
  });

  lines.push('', '## Round Survival Bands', '');
  PROFILES.forEach(profile => {
    const report = profileReports[profile];
    if (!report) return;
    lines.push(`### ${profile}`);
    lines.push('');
    lines.push('| Band | Target | Actual | Status |');
    lines.push('| --- | --- | --- | --- |');
    getRoundBandRows(profile, report).forEach(row => {
      lines.push(`| ${row.band} | ${row.target} | ${row.actual} | ${row.status} |`);
    });
    lines.push('');
  });

  lines.push('## Combat And Economy', '');
  PROFILES.forEach(profile => {
    const report = profileReports[profile];
    if (!report) return;
    lines.push(`- ${profile}: fight length ${report.averageFightTurns.toFixed(1)} turns, gold spent ${report.averageGoldSpent.toFixed(1)}g, purchases by round 3 ${report.pacing.averagePurchasesByRound[2].toFixed(1)}, T2 by round 6 ${formatPercent(report.pacing.t2ByRound6Rate)}, T3 by round 10 ${formatPercent(report.pacing.t3ByRound10Rate)}.`);
  });

  const referenceReport = profileReports[PROFILE_COMPETENT] || profileReports[PROFILE_RANDOM] || Object.values(profileReports)[0];
  if (referenceReport) {
    lines.push('', '## Boss And Role Checks', '');
    lines.push(`- Avg boss score among boss-reaching ${referenceReport.profile}: ${Math.round(referenceReport.averageBossScore)}.`);
    lines.push(`- Good T2/T3 boss benchmark: ${referenceReport.scenarios.goodBoss.totalDamage} damage in ${referenceReport.scenarios.goodBoss.totalTurns} turns.`);
    lines.push(`- Perfect shield T3 boss benchmark: ${referenceReport.scenarios.perfectBoss.totalDamage} damage in ${referenceReport.scenarios.perfectBoss.totalTurns} turns.`);
    lines.push(`- Tank mirror: ${referenceReport.scenarios.tankMirror.totalTurns} turns; DPS mirror: ${referenceReport.scenarios.dpsMirror.totalTurns} turns; healer mirror: ${referenceReport.scenarios.healerMirror.outcome}.`);
    lines.push(`- Mixed-role fight win rate: ${formatPercent(referenceReport.mixedWinRate)}; mono-family fight win rate: ${formatPercent(referenceReport.monoWinRate)}.`);
  }

  lines.push('', '## Tuning Read', '');
  lines.push(...getTuningRead(profileReports));
  return lines.join('\n');
}

function draftRoundForProfile(profile, run, random, result) {
  if (profile === PROFILE_PERFECT) return perfectDraftRound(run, random, result);
  if (profile === PROFILE_COMPETENT) return competentDraftRound(run, random, result);
  return randomDraftRound(run, result);
}

function randomDraftRound(initialRun, result) {
  let run = mergeAll(initialRun);
  while (run.gold >= CONFIG.DRAGON_BUY_COST && hasOpenStorage(run)) {
    const shopIndex = run.shop.findIndex(Boolean);
    if (shopIndex < 0) break;
    const purchase = buyDragon(run, shopIndex);
    if (!purchase.success) break;
    run = mergeAll(purchase.state);
    recordPurchase(result, run.round);
  }

  recordHighestTier(result, run);
  return run;
}

function competentDraftRound(initialRun, random, result) {
  let run = organizeTeam(mergeAll(initialRun), 'competent');
  let rerolls = 0;

  while (run.gold >= CONFIG.DRAGON_BUY_COST) {
    const shopIndex = chooseCompetentPurchase(run);
    if (shopIndex >= 0) {
      const purchase = buyDragon(run, shopIndex);
      if (!purchase.success) break;
      run = organizeTeam(mergeAll(purchase.state), 'competent');
      recordPurchase(result, run.round);
      continue;
    }

    if (
      rerolls >= COMPETENT_MAX_REROLLS
      || run.gold <= COMPETENT_REROLL_GOLD_FLOOR
      || !shouldCompetentReroll(run)
    ) break;

    const reroll = rerollShop(run, random);
    if (!reroll.success) break;
    run = reroll.state;
    result.rerolls += 1;
    rerolls += 1;
  }

  run = sellDeadEndsIfBenchFull(run);
  run = organizeTeam(mergeAll(run), 'competent');
  recordHighestTier(result, run);
  return run;
}

function perfectDraftRound(initialRun, random, result) {
  let run = organizeTeam(mergeAll(initialRun), 'perfect');
  let rerolls = 0;

  if (
    getOwned(run).length >= CONFIG.TEAM_SIZE
    && run.gold >= 8
    && !hasMergePressure(run)
    && (run.perfectBankRounds || 0) < 2
  ) {
    recordHighestTier(result, run);
    return { ...run, perfectBankRounds: (run.perfectBankRounds || 0) + 1 };
  }

  while (run.gold >= CONFIG.DRAGON_BUY_COST || run.gold >= CONFIG.REROLL_COST) {
    run = sellPerfectDeadEnds(run);
    const shopIndex = choosePerfectPurchase(run);
    if (shopIndex >= 0 && run.gold >= CONFIG.DRAGON_BUY_COST) {
      const purchase = buyDragon(run, shopIndex);
      if (!purchase.success) break;
      run = organizeTeam(mergeAll(purchase.state), 'perfect');
      run.perfectBankRounds = 0;
      recordPurchase(result, run.round);
      continue;
    }

    if (
      rerolls >= PERFECT_MAX_REROLLS
      || run.gold < CONFIG.REROLL_COST + PERFECT_REROLL_GOLD_FLOOR
      || !shouldPerfectReroll(run)
    ) break;

    const reroll = rerollShop(run, random);
    if (!reroll.success) break;
    run = reroll.state;
    run.perfectBankRounds = 0;
    result.rerolls += 1;
    rerolls += 1;
  }

  run = organizeTeam(mergeAll(run), 'perfect');
  recordHighestTier(result, run);
  return run;
}

function chooseCompetentPurchase(run) {
  const owned = getOwned(run);
  const counts = countOwnedIds(owned);
  const needsTeam = owned.length < CONFIG.TEAM_SIZE;
  const hasTankOrSupport = owned.some(dragon => isTankOrSupport(dragon.id));
  return chooseBestShopIndex(run, id => {
    const count = counts.get(id) || 0;
    if (!needsTeam && count === 0 && hasTankOrSupport) return -Infinity;
    return getDraftScore(id, 1, count, 'competent', hasTankOrSupport);
  });
}

function choosePerfectPurchase(run) {
  const owned = getOwned(run);
  const tierCounts = countOwnedByIdAndTier(owned);
  const maxed = new Set(owned.filter(dragon => dragon.tier >= CONFIG.MAX_TIER).map(dragon => dragon.id));
  const needsTeam = owned.length < CONFIG.TEAM_SIZE;
  return chooseBestShopIndex(run, id => {
    if (maxed.has(id)) return -Infinity;
    const t1Count = tierCounts.get(`${id}_1`) || 0;
    const t2Count = tierCounts.get(`${id}_2`) || 0;
    if (!needsTeam && t1Count === 0 && t2Count === 0) return -Infinity;
    return getPerfectDraftScore(id, t1Count, t2Count, hasIdealCore(owned));
  });
}

function chooseBestShopIndex(run, getScore) {
  if (!hasOpenStorage(run)) return -1;
  let bestIndex = -1;
  let bestScore = -Infinity;
  run.shop.forEach((id, index) => {
    if (!id) return;
    const score = getScore(id);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestScore === -Infinity ? -1 : bestIndex;
}

function getDraftScore(id, tier, ownedCount, profile, hasCore) {
  const dragon = getDragon(id);
  let score = getDragonScore(id, tier);
  if (ownedCount >= 2) score += MERGE_THIRD_COPY_BONUS;
  else if (ownedCount === 1) score += MERGE_SECOND_COPY_BONUS;
  if (!hasCore && isTankOrSupport(id)) score += TEAM_ROLE_BONUS;
  if (profile === 'perfect' && ['ember', 'zephyr', 'tidecaller', 'stonescale'].includes(id)) score += 80;
  if (profile === 'perfect' && dragon.role === 'Support') score += 40;
  return score;
}

function getPerfectDraftScore(id, t1Count, t2Count, hasCore) {
  let score = getDragonScore(id, 1);
  if (t1Count >= 2) score += PERFECT_THIRD_T1_BONUS;
  else if (t1Count === 1) score += PERFECT_SECOND_T1_BONUS;
  if (t2Count >= 2) score += PERFECT_T3_PATH_BONUS * 2;
  else if (t2Count === 1) score += PERFECT_T3_PATH_BONUS;
  if (!hasCore && isTankOrSupport(id)) score += TEAM_ROLE_BONUS;
  if (hasCarryRole(id)) score += 120;
  return score;
}

function shouldCompetentReroll(run) {
  const counts = countOwnedIds(getOwned(run));
  return [...counts.values()].some(count => count >= 2);
}

function shouldPerfectReroll(run) {
  const owned = getOwned(run);
  const tierCounts = countOwnedByIdAndTier(owned);
  if (owned.length < CONFIG.TEAM_SIZE) return true;
  return hasMergePressure(run) || !hasIdealCore(owned);
}

function sellDeadEndsIfBenchFull(run) {
  if (run.bench.some(slot => slot === null)) return run;
  const counts = countOwnedIds(getOwned(run));
  const sellIndex = run.bench.findIndex(dragon => dragon && dragon.tier === 1 && (counts.get(dragon.id) || 0) <= DEAD_END_SELL_MAX_COPIES);
  if (sellIndex < 0) return run;
  const result = sellDragon(run, { zone: 'bench', index: sellIndex });
  return result.success ? result.state : run;
}

function sellPerfectDeadEnds(run) {
  if (run.bench.some(slot => slot === null) && run.gold >= CONFIG.DRAGON_BUY_COST) return run;
  const owned = getOwned(run);
  const counts = countOwnedIds(owned);
  const candidates = run.bench
    .map((dragon, index) => ({ dragon, index }))
    .filter(entry => entry.dragon && entry.dragon.tier === 1 && (counts.get(entry.dragon.id) || 0) <= DEAD_END_SELL_MAX_COPIES)
    .sort((left, right) => getOwnedScore(left.dragon) - getOwnedScore(right.dragon));
  if (candidates.length === 0) return run;
  const result = sellDragon(run, { zone: 'bench', index: candidates[0].index });
  return result.success ? result.state : run;
}

function mergeAll(initialRun) {
  let run = initialRun;
  while (true) {
    const result = executeMerge(run);
    if (!result.success) return run;
    run = result.state;
  }
}

function organizeTeam(run, profile) {
  const owned = getOwned(run);
  owned.sort((left, right) => getOwnedScore(right, profile) - getOwnedScore(left, profile));
  const team = pickTeam(owned, profile);
  const teamUids = new Set(team.map(dragon => dragon.uid));
  const bench = owned.filter(dragon => !teamUids.has(dragon.uid));
  return {
    ...run,
    team: Array.from({ length: CONFIG.TEAM_SIZE }, (_, index) => team[index] || null),
    bench: Array.from({ length: CONFIG.BENCH_SIZE }, (_, index) => bench[index] || null),
  };
}

function pickTeam(owned, profile) {
  if (owned.length <= CONFIG.TEAM_SIZE || profile === PROFILE_RANDOM) return owned.slice(0, CONFIG.TEAM_SIZE);
  const sorted = [...owned].sort((left, right) => getOwnedScore(right, profile) - getOwnedScore(left, profile));
  const team = [];
  const addBest = predicate => {
    const pick = sorted.find(dragon => !team.includes(dragon) && predicate(dragon));
    if (pick) team.push(pick);
  };

  if (profile === 'perfect') {
    addBest(dragon => getDragon(dragon.id).role === 'DPS' || getDragon(dragon.id).role === 'Assassin');
    addBest(dragon => getDragon(dragon.id).role === 'Tank');
    addBest(dragon => getDragon(dragon.id).role === 'Support');
  } else {
    addBest(dragon => isTankOrSupport(dragon.id));
    addBest(dragon => getDragon(dragon.id).role === 'DPS' || getDragon(dragon.id).role === 'Assassin');
  }

  sorted.forEach(dragon => {
    if (team.length < CONFIG.TEAM_SIZE && !team.includes(dragon)) team.push(dragon);
  });
  return team.slice(0, CONFIG.TEAM_SIZE);
}

function createHarnessRun(random) {
  const unlockedDragonIds = [...CONFIG.DEFAULT_SAVE.unlockedDragons];
  const run = applySimulationInterest({
    round: 1,
    gold: CONFIG.STARTING_GOLD,
    team: Array(CONFIG.TEAM_SIZE).fill(null),
    bench: Array(CONFIG.BENCH_SIZE).fill(null),
    shop: [],
    unlockedDragonIds,
  });
  return {
    ...run,
    shop: generateShop(unlockedDragonIds, random, [...run.team, ...run.bench]),
  };
}

function createRunResult(profile) {
  return {
    profile,
    roundsSurvived: 0,
    reachedBoss: false,
    bossDamage: 0,
    bossTurns: 0,
    goldSpent: 0,
    rerolls: 0,
    purchasesByRound: Array(CONFIG.TOTAL_ROUNDS).fill(0),
    highestTierByRound: Array(CONFIG.TOTAL_ROUNDS).fill(0),
    fightResults: [],
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

function getOwned(run) {
  return [...run.team, ...run.bench].filter(Boolean);
}

function recordPurchase(result, round) {
  result.goldSpent += CONFIG.DRAGON_BUY_COST;
  result.purchasesByRound[round - 1] += 1;
}

function recordHighestTier(result, run) {
  const owned = getOwned(run);
  result.highestTierByRound[run.round - 1] = owned.reduce((max, dragon) => Math.max(max, dragon.tier), 0);
}

function createSummary(runCount, profile) {
  return {
    profile,
    runCount,
    roundEntrants: Array(CONFIG.TOTAL_ROUNDS).fill(0),
    roundWins: Array(CONFIG.TOTAL_ROUNDS).fill(0),
    fightTurns: [],
    bossScores: [],
    bossTurns: [],
    runLengths: [],
    goldSpent: [],
    rerolls: [],
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
  summary.rerolls.push(result.rerolls);
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
  summary.averageBossTurns = average(summary.bossTurns);
  summary.averageGoldSpent = average(summary.goldSpent);
  summary.averageRerolls = average(summary.rerolls);
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

function getProfileTarget(profile) {
  if (profile === PROFILE_PERFECT) return { bossMin: 0.80, bossMax: 0.90, runLengthLabel: 'almost always clears' };
  if (profile === PROFILE_COMPETENT) return { bossMin: 0.50, bossMax: 0.60, runLengthLabel: 'dies round 7-8' };
  return { bossMin: 0.15, bossMax: 0.20, runLengthLabel: 'dies round 5-6' };
}

function getRoundBandRows(profile, report) {
  const target = profile === PROFILE_RANDOM
    ? [
      ['Round 1-2', 0.90, 0.99, '~95%', report.roundBands.r1to2.survival],
      ['Round 3-4', 0.70, 0.90, '~80%', report.roundBands.r3to4.survival],
      ['Round 5-6', 0.50, 0.70, '~60%', report.roundBands.r5to6.survival],
      ['Round 7-8', 0.30, 0.50, '~40%', report.roundBands.r7to8.survival],
      ['Round 9-10', 0.18, 0.35, '~25%', report.roundBands.r9to10.survival],
    ]
    : [
      ['Round 1-2', 0.97, 1.00, '~99%', report.roundBands.r1to2.survival],
      ['Round 3-4', 0.85, 0.95, '~90%', report.roundBands.r3to4.survival],
      ['Round 5-6', 0.68, 0.82, '~75%', report.roundBands.r5to6.survival],
      ['Round 7-8', 0.58, 0.72, '~65%', report.roundBands.r7to8.survival],
      ['Round 9-10', 0.48, 0.62, '~55%', report.roundBands.r9to10.survival],
    ];

  return target.map(([bandName, min, max, label, value]) => ({
    band: bandName,
    target: label,
    actual: formatPercent(value),
    status: status(value, min, max),
  }));
}

function getTuningRead(reports) {
  const lines = [];
  const random = reports[PROFILE_RANDOM];
  const competent = reports[PROFILE_COMPETENT];
  const perfect = reports[PROFILE_PERFECT];
  if (random) {
    if (random.fullClearRate > 0.25) lines.push('- RANDOM reaches boss above 25%: nerf economy or buff enemies.');
    else if (random.fullClearRate < 0.10) lines.push('- RANDOM reaches boss below 10%: investigate early-round enemy pressure and no-reroll bench saturation.');
    else lines.push('- RANDOM boss reach sits in the playable tuning window.');
  }
  if (competent) {
    if (competent.fullClearRate > 0.70) lines.push('- COMPETENT reaches boss above 70%: buff round 7-10 enemies.');
    else if (competent.fullClearRate < 0.40) lines.push('- COMPETENT reaches boss below 40%: merges arrive too late; buff gold or reduce costs.');
    else lines.push('- COMPETENT boss reach is inside the tuning guardrails.');
  }
  if (perfect) {
    if (perfect.fullClearRate < 0.70) lines.push('- PERFECT reaches boss below 70%: game is too RNG; increase shop size or reduce reroll cost.');
    else if (perfect.fullClearRate > 0.95) lines.push('- PERFECT reaches boss above 95%: skilled play lacks pressure; buff round 9-10 enemies.');
    else lines.push('- PERFECT boss reach is inside the tuning guardrails.');
  }
  return lines;
}

function getOwnedScore(owned, profile = 'competent') {
  return getDragonScore(owned.id, owned.tier) + (profile === 'perfect' && hasCarryRole(owned.id) ? 90 : 0);
}

function getDragonScore(id, tier) {
  const dragon = getDragon(id);
  const stats = dragon.tiers[tier - 1];
  const roleBonus = dragon.role === 'Support' ? 45 : dragon.role === 'Tank' ? 35 : dragon.role === 'DPS' ? 30 : 20;
  return (tier * TIER_SCORE_WEIGHT) + stats.atk + (stats.hp * HP_SCORE_WEIGHT) + stats.spd + roleBonus;
}

function countOwnedIds(owned) {
  const counts = new Map();
  owned.forEach(dragon => counts.set(dragon.id, (counts.get(dragon.id) || 0) + 1));
  return counts;
}

function countOwnedByIdAndTier(owned) {
  const counts = new Map();
  owned.forEach(dragon => {
    const key = `${dragon.id}_${dragon.tier}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

function hasMergePressure(run) {
  return [...countOwnedByIdAndTier(getOwned(run)).values()].some(count => count >= CONFIG.MERGE_COUNT - 1);
}

function applySimulationInterest(run) {
  const interest = calculateInterest(run.gold);
  return {
    ...run,
    gold: run.gold + interest,
    lastInterestEarned: interest,
    lastInterestHeldGold: run.gold,
    interestAppliedRound: run.round,
  };
}

function isTankOrSupport(id) {
  const role = getDragon(id).role;
  return role === 'Tank' || role === 'Support';
}

function hasCarryRole(id) {
  const role = getDragon(id).role;
  return role === 'DPS' || role === 'Assassin' || role === 'Glass Cannon';
}

function hasIdealCore(owned) {
  const roles = new Set(owned.map(dragon => getDragon(dragon.id).role));
  const hasDamage = roles.has('DPS') || roles.has('Assassin') || roles.has('Glass Cannon');
  const hasTank = roles.has('Tank');
  const hasSupport = roles.has('Support');
  return hasDamage && (hasTank || hasSupport);
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
  console.log(createBalanceReport(runProfileSimulations(runCount)));
}

function isDirectRun() {
  return typeof process !== 'undefined'
    && process.argv?.[1]?.replaceAll('\\', '/').endsWith('/src/tests/balance.js');
}
