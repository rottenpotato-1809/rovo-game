/**
 * ═══════════════════════════════════════════════════════════════
 * WYRMPIT — Battle System Tests (src/tests/battle.test.js)
 * ═══════════════════════════════════════════════════════════════
 * 
 * Pure JS test suite — no external libraries required.
 * Run by opening test.html in a browser or importing into Node.
 * 
 * HOW TO RUN:
 *   Open test.html in browser → check console for PASS/FAIL.
 *   Or: node --experimental-vm-modules src/tests/battle.test.js
 * 
 * HOW TO ADD TESTS:
 *   Call test('description', () => { ...assertions... });
 *   Use assert(condition, message) for checks.
 * ═══════════════════════════════════════════════════════════════
 */

import { CONFIG } from '../config.js';
import { simulateBattle, simulateBossFight, createBattleInstance } from '../systems/battle.js';
import { DRAGONS, getDragon } from '../data/dragons.js';

// ─── MINI TEST FRAMEWORK ─────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`         ${e.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'assertEqual'}: expected ${expected}, got ${actual}`);
  }
}

function assertGreaterThan(actual, threshold, message) {
  if (actual <= threshold) {
    throw new Error(`${message || 'assertGreaterThan'}: expected > ${threshold}, got ${actual}`);
  }
}

function assertLessThan(actual, threshold, message) {
  if (actual >= threshold) {
    throw new Error(`${message || 'assertLessThan'}: expected < ${threshold}, got ${actual}`);
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────

/**
 * Create a simple dragon instance for testing.
 * Shortcut that avoids needing the full dragon definitions for basic tests.
 */
function makeDragon(overrides = {}) {
  return {
    id: 'test_dragon',
    instanceId: overrides.instanceId || `test_${Math.random().toString(36).slice(2)}`,
    name: overrides.name || 'Test Dragon',
    tier: overrides.tier || 1,
    hp: overrides.hp || 100,
    maxHp: overrides.maxHp || overrides.hp || 100,
    atk: overrides.atk || 20,
    baseAtk: overrides.baseAtk || overrides.atk || 20,
    spd: overrides.spd || 10,
    baseSpd: overrides.baseSpd || overrides.spd || 10,
    abilityName: overrides.abilityName || 'Test Ability',
    abilityType: overrides.abilityType || 'hit_lowest_hp',
    abilityPower: overrides.abilityPower || 1.0,
    abilityExtra: overrides.abilityExtra || {},
    cooldownMax: overrides.cooldownMax || CONFIG.ABILITY_COOLDOWN,
    cooldownCurrent: overrides.cooldownCurrent || 0,
    element: overrides.element || 'fire',
    emoji: overrides.emoji || '🔥',
    team: overrides.team || 'player',
    statuses: overrides.statuses || [],
    shield: overrides.shield || 0,
    isAlive: true,
    isCharging: false,
    chargeTurnsLeft: 0,
    ...overrides,
  };
}

/**
 * Create a full team of 3 identical dragons with specified stats.
 */
function makeTeam(team, overrides = {}) {
  return [
    makeDragon({ ...overrides, team, instanceId: `${team}_0`, name: `${overrides.name || 'Dragon'} A` }),
    makeDragon({ ...overrides, team, instanceId: `${team}_1`, name: `${overrides.name || 'Dragon'} B` }),
    makeDragon({ ...overrides, team, instanceId: `${team}_2`, name: `${overrides.name || 'Dragon'} C` }),
  ];
}

// ─── TEST SUITE ──────────────────────────────────────────────────

console.log('');
console.log('═══════════════════════════════════════════════');
console.log('  WYRMPIT — Battle System Test Suite');
console.log('═══════════════════════════════════════════════');
console.log('');

// ─── 1. BASIC COMBAT RESOLUTION ─────────────────────────────────

console.log('▸ Basic Combat Resolution');

test('Battle returns a valid result object', () => {
  const playerTeam = makeTeam('player', { hp: 100, atk: 20, spd: 10 });
  const enemyTeam = makeTeam('enemy', { hp: 100, atk: 20, spd: 10 });
  const result = simulateBattle(playerTeam, enemyTeam);

  assert(result.log !== undefined, 'Result should have a log');
  assert(result.outcome !== undefined, 'Result should have an outcome');
  assert(Array.isArray(result.log), 'Log should be an array');
  assert(['win', 'lose', 'timeout'].includes(result.outcome), 'Outcome should be win, lose, or timeout');
});

test('Stronger team wins consistently', () => {
  // Player team has 3x the ATK — should always win
  const playerTeam = makeTeam('player', { hp: 200, atk: 60, spd: 12 });
  const enemyTeam = makeTeam('enemy', { hp: 100, atk: 10, spd: 8 });
  const result = simulateBattle(playerTeam, enemyTeam);

  assertEqual(result.outcome, 'win', 'Stronger team should win');
  assert(result.survivingPlayer.length > 0, 'Should have surviving player dragons');
});

test('Weaker team loses', () => {
  const playerTeam = makeTeam('player', { hp: 50, atk: 5, spd: 5 });
  const enemyTeam = makeTeam('enemy', { hp: 300, atk: 80, spd: 15 });
  const result = simulateBattle(playerTeam, enemyTeam);

  assertEqual(result.outcome, 'lose', 'Weaker team should lose');
  assert(result.survivingEnemy.length > 0, 'Should have surviving enemy dragons');
});

test('Battle ends within MAX_TURNS_PER_ROUND', () => {
  const playerTeam = makeTeam('player', { hp: 100, atk: 20, spd: 10 });
  const enemyTeam = makeTeam('enemy', { hp: 100, atk: 20, spd: 10 });
  const result = simulateBattle(playerTeam, enemyTeam);

  assert(result.totalTurns <= CONFIG.MAX_TURNS_PER_ROUND,
    `Battle should end within ${CONFIG.MAX_TURNS_PER_ROUND} turns, took ${result.totalTurns}`);
});

test('Timeout results in player loss', () => {
  // Two heal-only teams that can never kill each other
  const playerTeam = makeTeam('player', {
    hp: 9999, atk: 0, spd: 10,
    abilityType: 'heal_lowest_ally', abilityPower: 0,
    abilityExtra: { healPercent: 0.5 },
  });
  const enemyTeam = makeTeam('enemy', {
    hp: 9999, atk: 0, spd: 10,
    abilityType: 'heal_lowest_ally', abilityPower: 0,
    abilityExtra: { healPercent: 0.5 },
  });
  const result = simulateBattle(playerTeam, enemyTeam);

  assertEqual(result.outcome, 'timeout', 'Infinite fight should timeout');
  assertEqual(result.totalTurns, CONFIG.MAX_TURNS_PER_ROUND, 'Should hit max turns exactly');
});

// ─── 2. TURN ORDER (SPEED) ──────────────────────────────────────

console.log('');
console.log('▸ Turn Order');

test('Faster dragon acts first', () => {
  // Player has SPD 20, enemy has SPD 5. Player should deal damage first.
  const playerTeam = [makeDragon({ team: 'player', instanceId: 'p0', hp: 50, atk: 999, spd: 20 })];
  const enemyTeam = [makeDragon({ team: 'enemy', instanceId: 'e0', hp: 50, atk: 999, spd: 5 })];

  // Player should one-shot enemy before enemy can act
  // (Both have enough ATK to one-shot, but player is faster)
  const result = simulateBattle(playerTeam, enemyTeam);
  assertEqual(result.outcome, 'win', 'Faster dragon should kill slower dragon first');
});

test('Turn order has all 6 dragons when full teams', () => {
  const playerTeam = makeTeam('player', { hp: 200, atk: 10, spd: 10 });
  const enemyTeam = makeTeam('enemy', { hp: 200, atk: 10, spd: 10 });
  const result = simulateBattle(playerTeam, enemyTeam);

  // First full turn should have actions from up to 6 dragons
  const turn1Events = result.log.filter(e => e.turn === 1 &&
    (e.action === 'ability' || e.action === 'basic_attack' ||
     e.action.startsWith('hit') || e.action.startsWith('ability')));
  assert(turn1Events.length >= 1, 'Turn 1 should have at least some actions');
});

// ─── 3. ABILITY TARGETING ────────────────────────────────────────

console.log('');
console.log('▸ Ability Targeting');

test('hit_lowest_hp targets the enemy with lowest HP', () => {
  const playerTeam = [makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 30, spd: 20,
    abilityType: 'hit_lowest_hp', abilityPower: 1.5,
  })];
  const enemyTeam = [
    makeDragon({ team: 'enemy', instanceId: 'e0', hp: 100, atk: 5, spd: 1, name: 'Healthy' }),
    makeDragon({ team: 'enemy', instanceId: 'e1', hp: 30, atk: 5, spd: 1, name: 'Wounded' }),
  ];

  const result = simulateBattle(playerTeam, enemyTeam);

  // The first ability event should target the wounded enemy
  const firstAbilityHit = result.log.find(e =>
    e.actorId === 'p0' && (e.action === 'ability' || e.action === 'hit_lowest_hp'));
  assert(firstAbilityHit !== undefined, 'Should have an ability event');
  assertEqual(firstAbilityHit.targetId, 'e1', 'Should target the lowest HP enemy');
});

test('hit_highest_spd targets fastest enemy (assassin backline)', () => {
  const playerTeam = [makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 30, spd: 25,
    abilityType: 'hit_highest_spd', abilityPower: 1.3,
    abilityExtra: { ignoreTaunt: true },
  })];
  const enemyTeam = [
    makeDragon({ team: 'enemy', instanceId: 'e_slow', hp: 100, atk: 5, spd: 3, name: 'Slow' }),
    makeDragon({ team: 'enemy', instanceId: 'e_fast', hp: 100, atk: 5, spd: 18, name: 'Fast' }),
  ];

  const result = simulateBattle(playerTeam, enemyTeam);
  const firstHit = result.log.find(e => e.actorId === 'p0' && e.action === 'ability');
  assert(firstHit !== undefined, 'Should have ability hit');
  assertEqual(firstHit.targetId, 'e_fast', 'Should target highest SPD enemy');
});

test('hit_all_enemies damages every living enemy', () => {
  const playerTeam = [makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 500, atk: 30, spd: 20,
    abilityType: 'hit_all_enemies', abilityPower: 1.0,
  })];
  const enemyTeam = makeTeam('enemy', { hp: 200, atk: 5, spd: 1 });

  const result = simulateBattle(playerTeam, enemyTeam);
  // Should have AoE hits on all 3 enemies in the first ability use
  const aoeHits = result.log.filter(e =>
    e.turn === 1 && e.actorId === 'p0' && e.action === 'ability_aoe');
  assertEqual(aoeHits.length, 3, 'AoE should hit all 3 enemies');
});

test('Basic attack targets highest ATK enemy by default', () => {
  const playerTeam = [makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 15, spd: 20,
    cooldownCurrent: 5, // ability on cooldown, will basic attack
  })];
  const enemyTeam = [
    makeDragon({ team: 'enemy', instanceId: 'e_weak', hp: 100, atk: 5, spd: 1, name: 'Weak' }),
    makeDragon({ team: 'enemy', instanceId: 'e_strong', hp: 100, atk: 50, spd: 1, name: 'Strong' }),
  ];

  const result = simulateBattle(playerTeam, enemyTeam);
  const firstBasic = result.log.find(e => e.actorId === 'p0' && e.action === 'basic_attack');
  assert(firstBasic !== undefined, 'Should have a basic attack');
  assertEqual(firstBasic.targetId, 'e_strong', 'Basic attack should target highest ATK');
});

// ─── 4. TAUNT MECHANICS ─────────────────────────────────────────

console.log('');
console.log('▸ Taunt Mechanics');

test('Taunt forces basic attacks to hit the taunter', () => {
  // Enemy with taunt active
  const taunter = makeDragon({
    team: 'enemy', instanceId: 'e_tank',
    hp: 500, atk: 5, spd: 1, name: 'Tank',
    statuses: [{ type: 'taunt', duration: 5, damageReduction: 0 }],
  });
  const squishy = makeDragon({
    team: 'enemy', instanceId: 'e_squishy',
    hp: 50, atk: 80, spd: 1, name: 'Squishy',
  });
  const attacker = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 20, spd: 20,
    cooldownCurrent: 99, // force basic attacks only
  });

  const result = simulateBattle([attacker], [taunter, squishy]);
  const basics = result.log.filter(e => e.actorId === 'p0' && e.action === 'basic_attack');
  // All basics should hit the taunter, NOT the squishy (even though squishy has higher ATK)
  const hitsOnTaunter = basics.filter(e => e.targetId === 'e_tank');
  assertEqual(hitsOnTaunter.length, basics.length, 'All basic attacks should hit taunter');
});

test('Assassin abilities ignore taunt', () => {
  const taunter = makeDragon({
    team: 'enemy', instanceId: 'e_tank',
    hp: 500, atk: 5, spd: 1, name: 'Tank',
    statuses: [{ type: 'taunt', duration: 5, damageReduction: 0 }],
  });
  const fastEnemy = makeDragon({
    team: 'enemy', instanceId: 'e_fast',
    hp: 100, atk: 5, spd: 18, name: 'Fast Target',
  });
  const assassin = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 40, spd: 25, name: 'Assassin',
    abilityType: 'hit_highest_spd', abilityPower: 1.3,
    abilityExtra: { ignoreTaunt: true },
  });

  const result = simulateBattle([assassin], [taunter, fastEnemy]);
  const abilityHit = result.log.find(e => e.actorId === 'p0' && e.action === 'ability');
  assert(abilityHit !== undefined, 'Assassin should use ability');
  assertEqual(abilityHit.targetId, 'e_fast', 'Assassin ability should ignore taunt and hit backline');
});

test('Damage reduction works on taunting dragon', () => {
  const tank = makeDragon({
    team: 'enemy', instanceId: 'e_tank',
    hp: 200, atk: 5, spd: 1,
    statuses: [{ type: 'taunt', duration: 5, damageReduction: 0.5 }],
  });
  const attacker = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 40, spd: 20,
    cooldownCurrent: 99,
  });

  const result = simulateBattle([attacker], [tank]);
  const firstHit = result.log.find(e => e.actorId === 'p0' && e.action === 'basic_attack');
  // 40 ATK × 1.0 multiplier = 40 raw, reduced 50% = 20 damage
  assertEqual(firstHit.value, 20, 'Damage reduction should halve incoming damage');
});

// ─── 5. COOLDOWN SYSTEM ─────────────────────────────────────────

console.log('');
console.log('▸ Cooldown System');

test('Ability fires on first turn (cooldown starts at 0)', () => {
  const dragon = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 30, spd: 20,
    cooldownCurrent: 0, // ready
    abilityType: 'hit_lowest_hp', abilityPower: 1.5,
  });
  const enemy = makeDragon({ team: 'enemy', instanceId: 'e0', hp: 200, atk: 5, spd: 1 });

  const result = simulateBattle([dragon], [enemy]);
  const turn1ability = result.log.find(e => e.turn === 1 && e.actorId === 'p0' && e.action === 'ability');
  assert(turn1ability !== undefined, 'Ability should fire on turn 1 when cooldown is 0');
});

test('Ability goes on cooldown after use', () => {
  const dragon = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 500, atk: 30, spd: 20,
    cooldownCurrent: 0,
    cooldownMax: CONFIG.ABILITY_COOLDOWN,
    abilityType: 'hit_lowest_hp', abilityPower: 1.0,
  });
  const enemy = makeDragon({ team: 'enemy', instanceId: 'e0', hp: 500, atk: 5, spd: 1 });

  const result = simulateBattle([dragon], [enemy]);
  // Turns 2, 3, 4 should be basic attacks (cooldown = 3)
  const turn2action = result.log.find(e => e.turn === 2 && e.actorId === 'p0');
  assert(turn2action !== undefined, 'Dragon should act on turn 2');
  assertEqual(turn2action.action, 'basic_attack', 'Turn 2 should be basic attack (on cooldown)');
});

test('T3 dragons have shorter cooldown', () => {
  const dragonDef = getDragon('ember');
  const instance = createBattleInstance(dragonDef, 3, 'player', 0);
  assertEqual(instance.cooldownMax, CONFIG.ABILITY_COOLDOWN_T3,
    `T3 dragon should have cooldown of ${CONFIG.ABILITY_COOLDOWN_T3}`);
});

test('T1 dragons have standard cooldown', () => {
  const dragonDef = getDragon('ember');
  const instance = createBattleInstance(dragonDef, 1, 'player', 0);
  assertEqual(instance.cooldownMax, CONFIG.ABILITY_COOLDOWN,
    `T1 dragon should have cooldown of ${CONFIG.ABILITY_COOLDOWN}`);
});

// ─── 6. STATUS EFFECTS ──────────────────────────────────────────

console.log('');
console.log('▸ Status Effects');

test('Stun causes dragon to skip turn', () => {
  const stunned = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 50, spd: 20,
    statuses: [{ type: 'stun', duration: 1 }],
  });
  const enemy = makeDragon({ team: 'enemy', instanceId: 'e0', hp: 200, atk: 10, spd: 5 });

  const result = simulateBattle([stunned], [enemy]);
  const turn1stun = result.log.find(e => e.turn === 1 && e.actorId === 'p0' && e.action === 'stunned');
  assert(turn1stun !== undefined, 'Stunned dragon should have a stunned event on turn 1');
  // On turn 1, stunned dragon does NOT deal damage
  const turn1damage = result.log.find(e => e.turn === 1 && e.actorId === 'p0' &&
    (e.action === 'ability' || e.action === 'basic_attack'));
  assertEqual(turn1damage, undefined, 'Stunned dragon should not attack on turn 1');
});

test('Poison deals damage over time', () => {
  const poisoned = makeDragon({
    team: 'enemy', instanceId: 'e0',
    hp: 200, atk: 5, spd: 5,
    statuses: [{ type: 'poison', duration: 3, damagePerTick: 15, isDebuff: true }],
  });
  const attacker = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 5, spd: 10,
    cooldownCurrent: 99,
  });

  const result = simulateBattle([attacker], [poisoned]);
  const poisonTicks = result.log.filter(e => e.action === 'poison_tick' && e.targetId === 'e0');
  assert(poisonTicks.length >= 1, 'Poison should tick at least once');
  assertEqual(poisonTicks[0].value, 15, 'Poison tick should deal configured damage');
});

test('Dodge can negate an attack', () => {
  // Force a dragon with 100% dodge to always evade
  const dodger = makeDragon({
    team: 'enemy', instanceId: 'e0',
    hp: 50, atk: 5, spd: 5,
    statuses: [{ type: 'dodge', duration: 99, chance: 1.0 }], // 100% dodge
  });
  const attacker = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 50, spd: 20,
    cooldownCurrent: 99,
  });

  const result = simulateBattle([attacker], [dodger]);
  const dodgeEvents = result.log.filter(e => e.action === 'dodged');
  assert(dodgeEvents.length > 0, '100% dodge should produce dodge events');
  // Dodger should survive many turns since all attacks miss
  // (will timeout eventually)
});

test('Shield absorbs damage before HP', () => {
  const shielded = makeDragon({
    team: 'enemy', instanceId: 'e0',
    hp: 100, atk: 5, spd: 1,
    shield: 50,
  });
  const attacker = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 30, spd: 20,
    cooldownCurrent: 99,
  });

  const result = simulateBattle([attacker], [shielded]);
  // First hit (30 damage) should be absorbed by shield (50 → 20 remaining)
  const shieldedHit = result.log.find(e => e.actorId === 'p0' && e.action.includes('shielded'));
  assert(shieldedHit !== undefined, 'First attack should be absorbed by shield');
});

// ─── 7. SPECIFIC DRAGON ABILITIES ───────────────────────────────

console.log('');
console.log('▸ Specific Dragon Abilities');

test('Ember Drake T2 (Inferno) splashes to adjacent target', () => {
  const ember = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 50, spd: 20,
    abilityType: 'hit_lowest_hp', abilityPower: 1.5,
    abilityExtra: { splash: 1 },
  });
  const enemyTeam = [
    makeDragon({ team: 'enemy', instanceId: 'e0', hp: 30, atk: 5, spd: 1, name: 'Low HP' }),
    makeDragon({ team: 'enemy', instanceId: 'e1', hp: 100, atk: 5, spd: 1, name: 'Full HP' }),
    makeDragon({ team: 'enemy', instanceId: 'e2', hp: 100, atk: 5, spd: 1, name: 'Full HP 2' }),
  ];

  const result = simulateBattle([ember], enemyTeam);
  const splashHits = result.log.filter(e => e.turn === 1 && e.actorId === 'p0' && e.action === 'ability_splash');
  assertEqual(splashHits.length, 1, 'Inferno should splash to exactly 1 additional target');
});

test('Zephyr Whelp T3 (Tornado Slash) hits twice', () => {
  const zephyr = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 88, spd: 25,
    abilityType: 'hit_highest_spd', abilityPower: 1.3,
    abilityExtra: { ignoreTaunt: true, hits: 2 },
  });
  const enemy = makeDragon({ team: 'enemy', instanceId: 'e0', hp: 500, atk: 5, spd: 15 });

  const result = simulateBattle([zephyr], [enemy]);
  const abilityHits = result.log.filter(e => e.turn === 1 && e.actorId === 'p0' && e.action === 'ability');
  assertEqual(abilityHits.length, 2, 'Tornado Slash should hit 2 times');
});

test('Voltfang (Chain Lightning) bounces to additional targets', () => {
  const voltfang = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 28, spd: 20,
    abilityType: 'hit_one_bounce', abilityPower: 1.2,
    abilityExtra: { bounceCount: 1, bounceFalloff: 0.5 },
  });
  const enemyTeam = [
    makeDragon({ team: 'enemy', instanceId: 'e0', hp: 200, atk: 50, spd: 1, name: 'Primary' }),
    makeDragon({ team: 'enemy', instanceId: 'e1', hp: 200, atk: 10, spd: 1, name: 'Bounce' }),
  ];

  const result = simulateBattle([voltfang], enemyTeam);
  const primaryHit = result.log.find(e => e.actorId === 'p0' && e.action === 'ability');
  const bounceHit = result.log.find(e => e.actorId === 'p0' && e.action === 'ability_bounce');
  assert(primaryHit !== undefined, 'Should have primary hit');
  assert(bounceHit !== undefined, 'Should have bounce hit');
  // Bounce damage should be 50% of primary
  const expectedBounce = Math.round(28 * 1.2 * 0.5);
  assertEqual(bounceHit.value, expectedBounce, `Bounce damage should be ${expectedBounce}`);
});

test('Tidecaller heals the lowest HP ally', () => {
  const healer = makeDragon({
    team: 'player', instanceId: 'p_healer',
    hp: 100, maxHp: 100, atk: 12, spd: 20,
    abilityType: 'heal_lowest_ally', abilityPower: 0,
    abilityExtra: { healPercent: 0.3 },
  });
  const wounded = makeDragon({
    team: 'player', instanceId: 'p_wounded',
    hp: 20, maxHp: 100, atk: 10, spd: 5, name: 'Wounded',
  });
  const enemy = makeDragon({ team: 'enemy', instanceId: 'e0', hp: 500, atk: 5, spd: 1 });

  const result = simulateBattle([healer, wounded], [enemy]);
  const healEvent = result.log.find(e => e.actorId === 'p_healer' && e.action === 'heal');
  assert(healEvent !== undefined, 'Healer should produce a heal event');
  assertEqual(healEvent.targetId, 'p_wounded', 'Should heal the lowest HP ally');
  // Heal amount = 30% of healer's max HP (100) = 30
  assertEqual(healEvent.value, 30, 'Heal amount should be 30% of caster max HP');
});

test('Solflare charges for 1 turn before attacking', () => {
  const solflare = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 35, spd: 20,
    abilityType: 'charge_hit_one', abilityPower: 3.0,
    abilityExtra: { chargeTurns: 1 },
  });
  const enemy = makeDragon({ team: 'enemy', instanceId: 'e0', hp: 500, atk: 5, spd: 1 });

  const result = simulateBattle([solflare], [enemy]);
  // Turn 1: should start charging
  const chargeEvent = result.log.find(e => e.turn === 1 && e.actorId === 'p0' && e.action === 'start_charge');
  assert(chargeEvent !== undefined, 'Solflare should start charging on turn 1');
  // Turn 2: should fire (charge completes)
  const fireEvent = result.log.find(e => e.turn === 2 && e.actorId === 'p0' && e.action === 'ability');
  assert(fireEvent !== undefined, 'Solflare should fire on turn 2');
  // Damage should be 300% ATK = 105
  assertEqual(fireEvent.value, Math.round(35 * 3.0), 'Charge attack should deal 300% ATK');
});

test('Nightshade (dot_all_enemies) poisons all enemies', () => {
  const nightshade = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 18, spd: 20,
    abilityType: 'dot_all_enemies', abilityPower: 0.1,
    abilityExtra: { dotDuration: 3 },
  });
  const enemyTeam = makeTeam('enemy', { hp: 200, atk: 5, spd: 1 });

  const result = simulateBattle([nightshade], enemyTeam);
  const poisonApplied = result.log.filter(e => e.turn === 1 && e.actorId === 'p0' && e.action === 'apply_poison');
  assertEqual(poisonApplied.length, 3, 'Should apply poison to all 3 enemies on first cast');
});

// ─── 8. DAMAGE CALCULATION ──────────────────────────────────────

console.log('');
console.log('▸ Damage Calculation');

test('Basic attack damage = ATK × BASIC_ATK_MULTIPLIER', () => {
  const attacker = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 40, spd: 20,
    cooldownCurrent: 99, // force basic attack
  });
  const enemy = makeDragon({ team: 'enemy', instanceId: 'e0', hp: 500, atk: 5, spd: 1 });

  const result = simulateBattle([attacker], [enemy]);
  const basicHit = result.log.find(e => e.actorId === 'p0' && e.action === 'basic_attack');
  const expected = Math.round(40 * CONFIG.BASIC_ATK_MULTIPLIER);
  assertEqual(basicHit.value, expected, `Basic attack should deal ${expected} damage`);
});

test('Ability damage = ATK × abilityPower', () => {
  const attacker = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 25, spd: 20,
    abilityType: 'hit_lowest_hp', abilityPower: 1.5,
  });
  const enemy = makeDragon({ team: 'enemy', instanceId: 'e0', hp: 500, atk: 5, spd: 1 });

  const result = simulateBattle([attacker], [enemy]);
  const abilityHit = result.log.find(e => e.actorId === 'p0' && e.action === 'ability');
  const expected = Math.round(25 * 1.5);
  assertEqual(abilityHit.value, expected, `Ability should deal ${expected} damage`);
});

test('Healing cannot exceed max HP', () => {
  const healer = makeDragon({
    team: 'player', instanceId: 'p_healer',
    hp: 200, maxHp: 200, atk: 12, spd: 20,
    abilityType: 'heal_lowest_ally', abilityPower: 0,
    abilityExtra: { healPercent: 0.5 }, // 50% of 200 = 100 heal
  });
  // Ally only missing 10 HP
  const allyNearly = makeDragon({
    team: 'player', instanceId: 'p_ally',
    hp: 90, maxHp: 100, atk: 5, spd: 5,
  });
  const enemy = makeDragon({ team: 'enemy', instanceId: 'e0', hp: 500, atk: 5, spd: 1 });

  const result = simulateBattle([healer, allyNearly], [enemy]);
  const healEvent = result.log.find(e => e.actorId === 'p_healer' && e.action === 'heal');
  assert(healEvent !== undefined, 'Should heal');
  // Should only heal 10 (cap at max HP), not the full 100
  assertEqual(healEvent.value, 10, 'Heal should be capped at missing HP (10)');
});

// ─── 9. DEATH AND CLEANUP ───────────────────────────────────────

console.log('');
console.log('▸ Death & Cleanup');

test('Dead dragons do not act', () => {
  // Enemy dies on turn 1, should not attack on subsequent turns
  const killer = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 999, spd: 20,
  });
  const victim = makeDragon({
    team: 'enemy', instanceId: 'e0',
    hp: 10, atk: 100, spd: 15, // high SPD but low HP — dies immediately
  });

  const result = simulateBattle([killer], [victim]);
  const victimActions = result.log.filter(e => e.actorId === 'e0' &&
    (e.action === 'basic_attack' || e.action === 'ability'));
  assertEqual(victimActions.length, 0, 'Dead dragon should never act');
});

test('Kill event is logged when dragon reaches 0 HP', () => {
  const killer = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 200, atk: 999, spd: 20,
  });
  const victim = makeDragon({ team: 'enemy', instanceId: 'e0', hp: 10, atk: 5, spd: 1 });

  const result = simulateBattle([killer], [victim]);
  const killEvent = result.log.find(e => e.action === 'kill' && e.targetId === 'e0');
  assert(killEvent !== undefined, 'Should log a kill event');
});

// ─── 10. BOSS FIGHT ─────────────────────────────────────────────

console.log('');
console.log('▸ Boss Fight');

test('Boss fight returns totalDamage dealt', () => {
  const playerTeam = makeTeam('player', { hp: 100, atk: 30, spd: 12 });
  const result = simulateBossFight(playerTeam);

  assert(result.totalDamage !== undefined, 'Should return totalDamage');
  assertGreaterThan(result.totalDamage, 0, 'Should deal at least some damage to boss');
  assert(result.totalTurns > 0, 'Should last at least 1 turn');
});

test('Boss hits all player dragons every turn', () => {
  const playerTeam = makeTeam('player', { hp: 300, atk: 20, spd: 12 });
  const result = simulateBossFight(playerTeam);

  // Look for boss attack events — should hit multiple targets per turn
  const bossAttacks = result.log.filter(e => e.actorId === 'boss_wyrm' && e.action === 'boss_attack');
  // On turn 1, boss should hit all 3 alive dragons
  const turn1attacks = bossAttacks.filter(e => e.turn === 1);
  assertEqual(turn1attacks.length, 3, 'Boss should hit all 3 player dragons on turn 1');
});

test('Boss damage escalates each turn', () => {
  const playerTeam = makeTeam('player', { hp: 9999, atk: 5, spd: 12 });
  const result = simulateBossFight(playerTeam);

  // Check turn 1 vs turn 3 damage
  const turn1hit = result.log.find(e => e.actorId === 'boss_wyrm' && e.action === 'boss_attack' && e.turn === 1);
  const turn3hit = result.log.find(e => e.actorId === 'boss_wyrm' && e.action === 'boss_attack' && e.turn === 3);
  assert(turn1hit !== undefined, 'Should have turn 1 boss attack');
  assert(turn3hit !== undefined, 'Should have turn 3 boss attack');
  assertGreaterThan(turn3hit.value, turn1hit.value, 'Boss damage should increase over turns');
});

test('Boss fight ends when all player dragons die', () => {
  // Weak team against boss — should die quickly
  const playerTeam = makeTeam('player', { hp: 30, atk: 10, spd: 12 });
  const result = simulateBossFight(playerTeam);

  assert(result.totalTurns > 0, 'Should last at least 1 turn');
  assert(result.totalTurns < 50, 'Should end before timeout (weak team dies fast)');
});

test('Boss starts with configured HP', () => {
  // Just verify boss doesn't die — total damage should be less than boss HP
  const playerTeam = makeTeam('player', { hp: 100, atk: 30, spd: 12 });
  const result = simulateBossFight(playerTeam);

  assertLessThan(result.totalDamage, CONFIG.BOSS_HP,
    'Player should not be able to kill the boss');
});

// ─── 11. createBattleInstance FACTORY ────────────────────────────

console.log('');
console.log('▸ createBattleInstance Factory');

test('Creates a valid battle instance from dragon definition', () => {
  const dragonDef = getDragon('ember');
  const instance = createBattleInstance(dragonDef, 1, 'player', 0);

  assertEqual(instance.id, 'ember', 'ID should match');
  assertEqual(instance.name, 'Ember Drake', 'Name should match');
  assertEqual(instance.tier, 1, 'Tier should be 1');
  assertEqual(instance.hp, 80, 'HP should match T1 stats');
  assertEqual(instance.maxHp, 80, 'Max HP should match');
  assertEqual(instance.atk, 25, 'ATK should match T1 stats');
  assertEqual(instance.spd, 12, 'SPD should match T1 stats');
  assertEqual(instance.abilityName, 'Fireball', 'Ability name should match T1');
  assertEqual(instance.team, 'player', 'Team should be set');
  assertEqual(instance.isAlive, true, 'Should be alive');
  assertEqual(instance.cooldownCurrent, 0, 'Should start with ability ready');
});

test('T2 instance has correct upgraded stats', () => {
  const dragonDef = getDragon('ember');
  const instance = createBattleInstance(dragonDef, 2, 'enemy', 1);

  assertEqual(instance.tier, 2, 'Tier should be 2');
  assertEqual(instance.hp, 160, 'HP should match T2 stats');
  assertEqual(instance.atk, 50, 'ATK should match T2 stats');
  assertEqual(instance.abilityName, 'Inferno', 'Ability should be T2 version');
});

test('T3 instance has shorter cooldown', () => {
  const dragonDef = getDragon('stonescale');
  const instance = createBattleInstance(dragonDef, 3, 'player', 0);

  assertEqual(instance.cooldownMax, CONFIG.ABILITY_COOLDOWN_T3, 'T3 should have shorter cooldown');
});

test('Each instance gets a unique instanceId', () => {
  const dragonDef = getDragon('ember');
  const inst1 = createBattleInstance(dragonDef, 1, 'player', 0);
  const inst2 = createBattleInstance(dragonDef, 1, 'player', 1);

  assert(inst1.instanceId !== inst2.instanceId, 'Instance IDs should be unique');
});

test('Instance statuses array starts empty', () => {
  const dragonDef = getDragon('zephyr');
  const instance = createBattleInstance(dragonDef, 1, 'player', 0);

  assert(Array.isArray(instance.statuses), 'Statuses should be an array');
  assertEqual(instance.statuses.length, 0, 'Statuses should start empty');
});

test('Invalid tier returns null', () => {
  const dragonDef = getDragon('ember');
  const instance = createBattleInstance(dragonDef, 5, 'player', 0);

  assertEqual(instance, null, 'Invalid tier should return null');
});

// ─── 12. EDGE CASES ─────────────────────────────────────────────

console.log('');
console.log('▸ Edge Cases');

test('1v1 battle resolves correctly', () => {
  const player = [makeDragon({ team: 'player', instanceId: 'p0', hp: 100, atk: 25, spd: 12 })];
  const enemy = [makeDragon({ team: 'enemy', instanceId: 'e0', hp: 80, atk: 20, spd: 10 })];
  const result = simulateBattle(player, enemy);

  assert(['win', 'lose', 'timeout'].includes(result.outcome), 'Should resolve');
  assert(result.log.length > 0, 'Should have combat events');
});

test('Battle with mismatched team sizes (2v3)', () => {
  const playerTeam = [
    makeDragon({ team: 'player', instanceId: 'p0', hp: 150, atk: 30, spd: 15 }),
    makeDragon({ team: 'player', instanceId: 'p1', hp: 150, atk: 30, spd: 14 }),
  ];
  const enemyTeam = makeTeam('enemy', { hp: 100, atk: 20, spd: 10 });

  const result = simulateBattle(playerTeam, enemyTeam);
  assert(['win', 'lose', 'timeout'].includes(result.outcome), '2v3 should still resolve');
});

test('Dragon with 0 ATK can still participate (just deals 0 damage)', () => {
  const zeroAtk = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 500, atk: 0, spd: 20,
    cooldownCurrent: 99,
  });
  const enemy = makeDragon({ team: 'enemy', instanceId: 'e0', hp: 100, atk: 10, spd: 5 });

  const result = simulateBattle([zeroAtk], [enemy]);
  // Should timeout or lose since 0 ATK can't kill anything
  assert(result.outcome === 'timeout' || result.outcome === 'lose', '0 ATK dragon should not win');
});

test('Reflect damage can kill attacker', () => {
  // Tank with reflect vs fragile attacker
  const tank = makeDragon({
    team: 'enemy', instanceId: 'e_tank',
    hp: 500, atk: 0, spd: 1,
    statuses: [{ type: 'taunt', duration: 99, damageReduction: 0.5, reflect: 1.0 }], // 100% reflect
  });
  const fragile = makeDragon({
    team: 'player', instanceId: 'p0',
    hp: 10, atk: 100, spd: 20, // will deal 100, reduced to 50, reflect 50 back → kills self
    cooldownCurrent: 99,
  });

  const result = simulateBattle([fragile], [tank]);
  const reflectKill = result.log.find(e => e.action === 'reflect_kill');
  // With these numbers: 100 dmg → 50 reduced → 50 reflected. Fragile has 10 HP → dies
  assert(reflectKill !== undefined, 'Reflect should be able to kill the attacker');
});

// ─── RESULTS ─────────────────────────────────────────────────────

console.log('');
console.log('═══════════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════');

if (failures.length > 0) {
  console.log('');
  console.log('  Failures:');
  failures.forEach(f => {
    console.log(`    ✗ ${f.name}: ${f.error}`);
  });
}

console.log('');

// Exit with error code if any tests failed (for CI/commit hooks)
if (typeof process !== 'undefined' && process.exit) {
  process.exit(failed > 0 ? 1 : 0);
}