/**
 * ═══════════════════════════════════════════════════════════════
 * WYRMPIT — Dragon Definitions (src/data/dragons.js)
 * ═══════════════════════════════════════════════════════════════
 * 
 * All dragon stats, abilities, and metadata live here.
 * To add a new dragon: copy any block, change the values.
 * To tweak balance: adjust the numbers in the tiers array.
 * 
 * STRUCTURE:
 *   id         → unique key used internally (never shown to player)
 *   name       → display name
 *   role       → DPS | Tank | Assassin | Support | Debuffer | Glass Cannon
 *   element    → must match a key in CONFIG.ELEMENT_COLORS
 *   emoji      → visual placeholder for rendering
 *   unlocked   → true = available from the start; false = requires XP
 *   unlockCost → cumulative XP needed (only matters if unlocked = false)
 *   tiers      → array of 3 objects [T1, T2, T3] with stats + ability info
 * 
 * ABILITY FIELDS:
 *   abilityName   → short display name for combat log
 *   abilityDesc   → one-line description shown in codex/tooltips
 *   abilityType   → targeting keyword used by battle.js (see legend below)
 *   abilityPower  → multiplier relative to ATK (1.0 = 100% of ATK)
 *   abilityExtra  → object for special effects (heal%, shield%, dot, stun, etc.)
 * 
 * ABILITY TYPES (targeting keywords):
 *   "hit_lowest_hp"    → targets enemy with lowest current HP
 *   "hit_highest_spd"  → targets enemy with highest SPD (backline)
 *   "hit_all_enemies"  → AoE damage to all enemies
 *   "hit_one_bounce"   → hits one target, then bounces to another at reduced power
 *   "heal_lowest_ally" → heals ally with lowest HP
 *   "heal_all_allies"  → heals all allies
 *   "shield_all"       → grants shield to all allies
 *   "self_taunt"       → forces enemies to attack this dragon
 *   "dot_all_enemies"  → applies damage-over-time to all enemies
 *   "charge_hit_one"   → charges 1 turn, then hits one target hard
 * ═══════════════════════════════════════════════════════════════
 */

export const DRAGONS = [

  // ─────────────────────────────────────────────────────────────
  // 1. EMBER DRAKE — Starter DPS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ember',
    name: 'Ember Drake',
    role: 'DPS',
    element: 'fire',
    emoji: '🔥',
    unlocked: true,
    unlockCost: 0,
    tiers: [
      {
        tier: 1,
        hp: 80,
        atk: 25,
        spd: 12,
        abilityName: 'Fireball',
        abilityDesc: 'Hurls a fireball at the weakest enemy for 150% ATK damage.',
        abilityType: 'hit_lowest_hp',
        abilityPower: 1.5,
        abilityExtra: null,
      },
      {
        tier: 2,
        hp: 160,
        atk: 50,
        spd: 14,
        abilityName: 'Inferno',
        abilityDesc: 'Blasts the weakest enemy and one adjacent for 150% ATK each.',
        abilityType: 'hit_lowest_hp',
        abilityPower: 1.5,
        abilityExtra: { splash: 1 }, // hits 1 additional adjacent target
      },
      {
        tier: 3,
        hp: 320,
        atk: 100,
        spd: 16,
        abilityName: 'Meteor',
        abilityDesc: 'Rains fire on ALL enemies for 120% ATK damage.',
        abilityType: 'hit_all_enemies',
        abilityPower: 1.2,
        abilityExtra: null,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. STONESCALE — Starter Tank
  // ─────────────────────────────────────────────────────────────
  {
    id: 'stonescale',
    name: 'Stonescale',
    role: 'Tank',
    element: 'earth',
    emoji: '🪨',
    unlocked: true,
    unlockCost: 0,
    tiers: [
      {
        tier: 1,
        hp: 150,
        atk: 10,
        spd: 6,
        abilityName: 'Stone Shield',
        abilityDesc: 'Taunts all enemies and reduces incoming damage by 50% for 2 turns.',
        abilityType: 'self_taunt',
        abilityPower: 0,
        abilityExtra: { damageReduction: 0.5, duration: 2 },
      },
      {
        tier: 2,
        hp: 300,
        atk: 20,
        spd: 7,
        abilityName: 'Stone Shield+',
        abilityDesc: 'Taunts and blocks 50% damage for 2 turns. Reflects 20% of blocked damage back.',
        abilityType: 'self_taunt',
        abilityPower: 0,
        abilityExtra: { damageReduction: 0.5, duration: 2, reflect: 0.2 },
      },
      {
        tier: 3,
        hp: 600,
        atk: 40,
        spd: 8,
        abilityName: 'Earthquake',
        abilityDesc: 'Taunts, blocks 50% for 2 turns, reflects 20%, and stuns ALL enemies for 1 turn.',
        abilityType: 'self_taunt',
        abilityPower: 0,
        abilityExtra: { damageReduction: 0.5, duration: 2, reflect: 0.2, stunAll: 1 },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. ZEPHYR WHELP — Starter Assassin
  // ─────────────────────────────────────────────────────────────
  {
    id: 'zephyr',
    name: 'Zephyr Whelp',
    role: 'Assassin',
    element: 'wind',
    emoji: '💨',
    unlocked: true,
    unlockCost: 0,
    tiers: [
      {
        tier: 1,
        hp: 60,
        atk: 22,
        spd: 18,
        abilityName: 'Gale Strike',
        abilityDesc: 'Strikes the fastest enemy (backline), ignoring taunt. 130% ATK.',
        abilityType: 'hit_highest_spd',
        abilityPower: 1.3,
        abilityExtra: { ignoreTaunt: true },
      },
      {
        tier: 2,
        hp: 120,
        atk: 44,
        spd: 20,
        abilityName: 'Gale Strike+',
        abilityDesc: 'Strikes backline for 130% ATK, then gains 30% dodge for 1 turn.',
        abilityType: 'hit_highest_spd',
        abilityPower: 1.3,
        abilityExtra: { ignoreTaunt: true, dodgeChance: 0.3, dodgeDuration: 1 },
      },
      {
        tier: 3,
        hp: 240,
        atk: 88,
        spd: 22,
        abilityName: 'Tornado Slash',
        abilityDesc: 'Hits the backline TWICE for 130% ATK each. Ignores taunt.',
        abilityType: 'hit_highest_spd',
        abilityPower: 1.3,
        abilityExtra: { ignoreTaunt: true, hits: 2 },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. TIDECALLER — Starter Support
  // ─────────────────────────────────────────────────────────────
  {
    id: 'tidecaller',
    name: 'Tidecaller',
    role: 'Support',
    element: 'water',
    emoji: '💧',
    unlocked: true,
    unlockCost: 0,
    tiers: [
      {
        tier: 1,
        hp: 100,
        atk: 12,
        spd: 10,
        abilityName: 'Healing Wave',
        abilityDesc: 'Heals the most injured ally for 30% of Tidecaller\'s max HP.',
        abilityType: 'heal_lowest_ally',
        abilityPower: 0,
        abilityExtra: { healPercent: 0.3 }, // percent of caster's max HP
      },
      {
        tier: 2,
        hp: 200,
        atk: 24,
        spd: 11,
        abilityName: 'Healing Wave+',
        abilityDesc: 'Heals most injured ally for 30% max HP and removes debuffs.',
        abilityType: 'heal_lowest_ally',
        abilityPower: 0,
        abilityExtra: { healPercent: 0.3, cleanse: true },
      },
      {
        tier: 3,
        hp: 400,
        atk: 48,
        spd: 12,
        abilityName: 'Tsunami',
        abilityDesc: 'Heals ALL allies for 20% max HP AND deals 50% ATK to all enemies.',
        abilityType: 'heal_all_allies',
        abilityPower: 0.5, // damage component
        abilityExtra: { healPercent: 0.2, damageAll: true },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 5. VOLTFANG — Locked DPS/Assassin hybrid (unlock: 100 XP)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'voltfang',
    name: 'Voltfang',
    role: 'DPS',
    element: 'lightning',
    emoji: '⚡',
    unlocked: false,
    unlockCost: 100,
    tiers: [
      {
        tier: 1,
        hp: 70,
        atk: 28,
        spd: 15,
        abilityName: 'Chain Lightning',
        abilityDesc: 'Zaps one enemy for 120% ATK, then bounces to another for 60% ATK.',
        abilityType: 'hit_one_bounce',
        abilityPower: 1.2,
        abilityExtra: { bounceCount: 1, bounceFalloff: 0.5 },
      },
      {
        tier: 2,
        hp: 140,
        atk: 56,
        spd: 17,
        abilityName: 'Chain Lightning+',
        abilityDesc: 'Zaps one for 120% ATK, bounces to TWO others at 60% each.',
        abilityType: 'hit_one_bounce',
        abilityPower: 1.2,
        abilityExtra: { bounceCount: 2, bounceFalloff: 0.5 },
      },
      {
        tier: 3,
        hp: 280,
        atk: 112,
        spd: 19,
        abilityName: 'Thunder Storm',
        abilityDesc: 'Hits ALL enemies for 100% ATK. 25% chance to stun each for 1 turn.',
        abilityType: 'hit_all_enemies',
        abilityPower: 1.0,
        abilityExtra: { stunChance: 0.25, stunDuration: 1 },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 6. NIGHTSHADE — Locked Debuffer (unlock: 200 XP)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'nightshade',
    name: 'Nightshade',
    role: 'Debuffer',
    element: 'shadow',
    emoji: '☠️',
    unlocked: false,
    unlockCost: 200,
    tiers: [
      {
        tier: 1,
        hp: 90,
        atk: 18,
        spd: 13,
        abilityName: 'Venom Mist',
        abilityDesc: 'Poisons all enemies — they take 10% of Nightshade\'s ATK per turn for 3 turns.',
        abilityType: 'dot_all_enemies',
        abilityPower: 0.1, // damage per tick as % of caster ATK
        abilityExtra: { dotDuration: 3 },
      },
      {
        tier: 2,
        hp: 180,
        atk: 36,
        spd: 14,
        abilityName: 'Plague Cloud',
        abilityDesc: 'Poisons all enemies (10% ATK/turn, 3 turns) and reduces their ATK by 20% for 2 turns.',
        abilityType: 'dot_all_enemies',
        abilityPower: 0.1,
        abilityExtra: { dotDuration: 3, atkDebuff: 0.2, debuffDuration: 2 },
      },
      {
        tier: 3,
        hp: 360,
        atk: 72,
        spd: 15,
        abilityName: 'Death Fog',
        abilityDesc: 'Poisons all (15% ATK/turn, 3 turns), debuffs ATK 20%, and heals self for total poison damage dealt.',
        abilityType: 'dot_all_enemies',
        abilityPower: 0.15,
        abilityExtra: { dotDuration: 3, atkDebuff: 0.2, debuffDuration: 2, lifesteal: true },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 7. CRYSTALWING — Locked Tank/Support hybrid (unlock: 350 XP)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'crystalwing',
    name: 'Crystalwing',
    role: 'Support',
    element: 'ice',
    emoji: '❄️',
    unlocked: false,
    unlockCost: 350,
    tiers: [
      {
        tier: 1,
        hp: 130,
        atk: 14,
        spd: 8,
        abilityName: 'Frost Barrier',
        abilityDesc: 'Grants all allies a shield equal to 15% of Crystalwing\'s max HP.',
        abilityType: 'shield_all',
        abilityPower: 0,
        abilityExtra: { shieldPercent: 0.15 }, // percent of caster's max HP
      },
      {
        tier: 2,
        hp: 260,
        atk: 28,
        spd: 9,
        abilityName: 'Ice Wall',
        abilityDesc: 'Shields all allies (15% max HP) and slows all enemies (SPD -3) for 2 turns.',
        abilityType: 'shield_all',
        abilityPower: 0,
        abilityExtra: { shieldPercent: 0.15, spdDebuff: 3, debuffDuration: 2 },
      },
      {
        tier: 3,
        hp: 520,
        atk: 56,
        spd: 10,
        abilityName: 'Absolute Zero',
        abilityDesc: 'Shields all allies (20% max HP), slows all enemies (SPD -3, 2 turns), and freezes the lowest-HP enemy for 1 turn.',
        abilityType: 'shield_all',
        abilityPower: 0,
        abilityExtra: { shieldPercent: 0.2, spdDebuff: 3, debuffDuration: 2, freezeLowest: 1 },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 8. SOLFLARE — Locked Glass Cannon (unlock: 500 XP)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'solflare',
    name: 'Solflare',
    role: 'Glass Cannon',
    element: 'light',
    emoji: '☀️',
    unlocked: false,
    unlockCost: 500,
    tiers: [
      {
        tier: 1,
        hp: 50,
        atk: 35,
        spd: 9,
        abilityName: 'Solar Beam',
        abilityDesc: 'Charges for 1 turn, then fires for 300% ATK to one enemy.',
        abilityType: 'charge_hit_one',
        abilityPower: 3.0,
        abilityExtra: { chargeTurns: 1 },
      },
      {
        tier: 2,
        hp: 100,
        atk: 70,
        spd: 10,
        abilityName: 'Solar Cannon',
        abilityDesc: 'Charges 1 turn, fires 300% ATK. If the target dies, excess damage hits another enemy.',
        abilityType: 'charge_hit_one',
        abilityPower: 3.0,
        abilityExtra: { chargeTurns: 1, overkillSplash: true },
      },
      {
        tier: 3,
        hp: 200,
        atk: 140,
        spd: 11,
        abilityName: 'Supernova',
        abilityDesc: 'Charges 1 turn, then deals 250% ATK to ALL enemies. Self-destructs (dies after firing).',
        abilityType: 'charge_hit_one', // battle.js overrides to AoE when T3
        abilityPower: 2.5,
        abilityExtra: { chargeTurns: 1, hitAll: true, selfDestruct: true },
      },
    ],
  },

];

// ─────────────────────────────────────────────────────────────
// HELPER — Get a dragon definition by ID
// Usage: getDragon('ember') → returns the full dragon object
// ─────────────────────────────────────────────────────────────
export function getDragon(id) {
  return DRAGONS.find(d => d.id === id);
}

// ─────────────────────────────────────────────────────────────
// HELPER — Get stats for a specific dragon at a specific tier
// Usage: getDragonTier('ember', 2) → returns the T2 stats object
// ─────────────────────────────────────────────────────────────
export function getDragonTier(id, tier) {
  const dragon = getDragon(id);
  if (!dragon) return null;
  return dragon.tiers[tier - 1] || null;
}

// ─────────────────────────────────────────────────────────────
// HELPER — Get all unlocked dragon IDs (for shop generation)
// Pass in the player's save data to check XP-based unlocks
// ─────────────────────────────────────────────────────────────
export function getUnlockedDragonIds(playerUnlocks) {
  // playerUnlocks = array of dragon IDs the player has unlocked
  // Falls back to the default unlocked set if not provided
  if (playerUnlocks && playerUnlocks.length > 0) {
    return playerUnlocks;
  }
  return DRAGONS.filter(d => d.unlocked).map(d => d.id);
}

// ─────────────────────────────────────────────────────────────
// HELPER — Get all dragon IDs (for enemy team generation)
// Enemies can use ALL dragons regardless of player progression
// ─────────────────────────────────────────────────────────────
export function getAllDragonIds() {
  return DRAGONS.map(d => d.id);
}

// ─────────────────────────────────────────────────────────────
// HELPER — Get unlock order (sorted by cost ascending)
// Used by progression.js to determine what unlocks next
// ─────────────────────────────────────────────────────────────
export function getLockedDragonsInOrder() {
  return DRAGONS
    .filter(d => !d.unlocked)
    .sort((a, b) => a.unlockCost - b.unlockCost);
}