/**
 * ═══════════════════════════════════════════════════════════════
 * WYRMPIT — Master Configuration (src/config.js)
 * ═══════════════════════════════════════════════════════════════
 * 
 * SINGLE SOURCE OF TRUTH for all game constants.
 * Every number that affects gameplay, visuals, or timing lives here.
 * No magic numbers anywhere else in the codebase.
 * 
 * HOW TO USE:
 *   import { CONFIG } from './config.js';
 *   Then reference: CONFIG.TEAM_SIZE, CONFIG.STARTING_GOLD, etc.
 * 
 * HOW TO TWEAK:
 *   Change any value here → save → refresh browser → see the result.
 *   No need to touch any other file.
 * 
 * COMMENTS:
 *   Every key has a description and recommended range where applicable.
 * ═══════════════════════════════════════════════════════════════
 */

export const CONFIG = {

  // ─── TEAM & BENCH ────────────────────────────────────────────
  // How many dragons the player fields and stores

  TEAM_SIZE: 3,
  // Number of dragons on the battlefield per side.
  // Recommended: 3 (core design). Changing this affects balance heavily.

  BENCH_SIZE: 5,
  // Reserve slots for storing dragons between rounds (for merge planning).
  // Recommended range: 4–6. Lower = harder decisions. Higher = easier merges.

  // ─── ECONOMY ─────────────────────────────────────────────────
  // Gold flow controls how fast players can buy and upgrade

  STARTING_GOLD: 3,
  // Gold the player begins with on round 1.
  // Recommended range: 2–5. Lower = tighter early game.

  GOLD_PER_WIN_BASE: 3,
  // Flat gold earned for winning any round (before scaling).
  // Recommended range: 2–4.

  GOLD_PER_WIN_SCALING: 1,
  // Additional gold per round number. Formula: base + (round × scaling).
  // Round 1 win = 3 + (1×1) = 4g. Round 7 win = 3 + (7×1) = 10g.
  // Recommended range: 0.5–2. Higher = snowballier.

  DRAGON_BUY_COST: 3,
  // Cost to purchase any dragon from the shop (all same price for prototype).
  // Recommended range: 2–4.

  SELL_PRICE_T1: 2,
  // Gold received when selling a Tier 1 dragon.
  // Should be less than buy cost (otherwise infinite gold loop).

  SELL_PRICE_T2: 4,
  // Gold received when selling a Tier 2 dragon.
  // Represents value of 3 T1s merged (spent 9g to buy, get 4g back).

  SELL_PRICE_T3: 8,
  // Gold received when selling a Tier 3 dragon.
  // Represents value of 9 T1s merged.

  REROLL_COST: 1,
  // Gold to refresh the shop offerings.
  // Recommended range: 1–2. Lower = more flexibility. Higher = more commitment.

  SHOP_SIZE: 3,
  // Number of dragon cards offered in the shop each round/reroll.
  // Recommended range: 3–5. More = easier to find what you want.

  // ─── COMBAT ───────────────────────────────────────────────────
  // Battle pacing and ability tuning

  MAX_TURNS_PER_ROUND: 50,
  // Safety valve: if a fight lasts this many turns, the player loses.
  // Prevents infinite healer-vs-healer loops.
  // Recommended range: 30–100.

  ABILITY_COOLDOWN: 3,
  // Turns after using an ability before it's ready again (T1 and T2 dragons).
  // Recommended range: 2–4. Lower = more ability spam. Higher = more basic attacks.

  ABILITY_COOLDOWN_T3: 2,
  // Shortened cooldown for Tier 3 dragons (reward for merging).
  // Must be less than ABILITY_COOLDOWN to feel like an upgrade.

  BASIC_ATK_MULTIPLIER: 1.0,
  // Basic attack damage = dragon's ATK × this multiplier.
  // Recommended: 1.0. Increase to make basic attacks matter more vs abilities.

  BASIC_ATK_TARGET: 'highest_atk',
  // Who basic attacks target by default. Options: 'highest_atk', 'lowest_hp', 'random'.
  // 'highest_atk' = kill the threat. 'lowest_hp' = finish off wounded.

  // ─── MERGING ──────────────────────────────────────────────────
  // Rules for combining dragons into higher tiers

  MERGE_COUNT: 3,
  // Number of identical dragons needed to merge into the next tier.
  // Recommended: 3 (industry standard from SAP/TFT).

  MAX_TIER: 3,
  // Maximum evolution tier. Dragons at this tier cannot merge further.
  // Recommended: 3. Going higher requires exponentially more content.

  // ─── ROUNDS ───────────────────────────────────────────────────
  // Run structure and enemy difficulty curve

  TOTAL_ROUNDS: 10,
  // Number of rounds to survive before reaching the boss.
  // Recommended range: 7–12. Fewer = shorter sessions. More = more shop time.

  ENEMY_SCALING: [
    // Each entry = [T1 count, T2 count, T3 count] for that round's enemy team.
    // Total per row must equal TEAM_SIZE (3).
    // Difficulty ramps from all-T1 to mostly-T3.
    [3, 0, 0],  // Round 1  — easy intro
    [3, 0, 0],  // Round 2  — still easy
    [2, 1, 0],  // Round 3  — first T2 appears
    [2, 1, 0],  // Round 4  — same
    [1, 2, 0],  // Round 5  — mid-game spike
    [1, 2, 0],  // Round 6  — same
    [0, 3, 0],  // Round 7  — all T2, pressure ramps
    [0, 3, 0],  // Round 8  — same
    [0, 2, 1],  // Round 9  — first T3 appears
    [0, 1, 2],  // Round 10 — finale, mostly T3
  ],

  // ─── BOSS: ETERNAL WYRM ───────────────────────────────────────
  // Invincible boss fight — the scoring mechanism

  BOSS_HP: 99999,
  // Boss health pool. Effectively invincible — players can never kill it.
  // The displayed number should feel epic in screenshots.

  BOSS_ATK_START: 20,
  // Damage the boss deals to ALL player dragons on turn 1.
  // Recommended range: 15–30. Lower = longer fights = higher scores.

  BOSS_ATK_ESCALATION: 15,
  // Additional damage added to boss ATK every turn.
  // Turn N damage = BOSS_ATK_START + (N × BOSS_ATK_ESCALATION).
  // Recommended range: 10–25. Higher = faster wipe = lower scores.

  BOSS_SPEED: 5,
  // Boss SPD value — intentionally lowest so boss always acts last each turn.
  // This gives player dragons one round of damage before taking hits.
  // Must be lower than any dragon's base SPD (lowest is Stonescale at 6).

  // ─── PROGRESSION ──────────────────────────────────────────────
  // XP and unlock pacing between runs

  XP_PER_ROUND_SURVIVED: 5,
  // XP earned per round survived (win or lose).
  // A full 10-round win = 50 XP from this alone.
  // Recommended range: 3–8.

  XP_BOSS_DAMAGE_DIVISOR: 10,
  // XP from boss fight = total damage dealt ÷ this number (rounded down).
  // Lower divisor = more XP from boss = rewards skilled play more.
  // Recommended range: 5–20.

  UNLOCK_THRESHOLDS: [100, 200, 350, 500],
  // Cumulative XP needed to unlock each locked dragon (in order).
  // Order matches: Voltfang (100), Nightshade (200), Crystalwing (350), Solflare (500).
  // These are TOTAL XP, not incremental. A new player unlocking everything needs 500 XP total.

  // ─── STATUS EFFECTS ───────────────────────────────────────────
  // Duration and power of buffs/debuffs applied during combat

  TAUNT_DEFAULT_DURATION: 2,
  // Turns that taunt remains active after being cast.
  // Recommended range: 1–3.

  POISON_TICK_TIMING: 'start_of_turn',
  // When poison damage is applied. Options: 'start_of_turn', 'end_of_turn'.
  // 'start_of_turn' = more dangerous (can kill before acting).

  SHIELD_ABSORB_PRIORITY: 'before_hp',
  // Shields absorb damage before HP is reduced.
  // Only option for now. Here for clarity.

  STUN_SKIPS_TURN: true,
  // A stunned dragon loses its next turn entirely (no basic attack either).
  // Set to false if stun should only prevent ability use but allow basics.

  DODGE_NEGATES_FULL_HIT: true,
  // When dodge triggers, the entire attack is negated (no partial damage).
  // Set to false for partial dodge (e.g., 50% damage reduction instead).

  CHARGE_VULNERABLE: false,
  // Can a charging dragon (Solflare) be interrupted by stun?
  // false = charge continues through stun. true = stun resets the charge.

  // ─── RENDERING — CANVAS ───────────────────────────────────────
  // Visual dimensions, colors, and layout coordinates

  CANVAS_WIDTH: 400,
  // Logical canvas width in pixels. CSS scales this to fit the viewport.
  // Recommended: 400 (mobile-friendly aspect ratio).

  CANVAS_HEIGHT: 700,
  // Logical canvas height in pixels.
  // Combined with width, gives a 4:7 portrait aspect ratio.

  PIXEL_RATIO: 1,
  // Multiply canvas internal resolution for sharper rendering on retina screens.
  // 1 = standard. 2 = retina. Auto-detect with window.devicePixelRatio if desired.

  // ─── RENDERING — COLORS ───────────────────────────────────────
  // All color values used in the game. Change these to retheme instantly.

  BG_COLOR: '#1a1a2e',
  // Main background color (dark blue-black).

  HEADER_BG_COLOR: '#16213e',
  // Top header bar background.

  CARD_BG_COLOR: '#1a1a4e',
  // Shop card and UI card background.

  ACCENT_PRIMARY: '#e94560',
  // Primary accent — team slot borders, fight button, highlights.

  ACCENT_SECONDARY: '#0f3460',
  // Secondary accent — subtle borders, dividers.

  GOLD_COLOR: '#f5c842',
  // Currency display, shop card borders, gold-related UI.

  TEXT_PRIMARY: '#ffffff',
  // Main text color.

  TEXT_SECONDARY: '#aaaaaa',
  // Subdued text (stat labels, descriptions).

  TEXT_MUTED: '#555555',
  // Very faint text (empty slot labels, annotations).

  HP_BAR_FULL: '#4CAF50',
  // Health bar color when HP is above 50%.

  HP_BAR_LOW: '#e94560',
  // Health bar color when HP is below 25%.

  HP_BAR_MID: '#FF9800',
  // Health bar color when HP is between 25-50%.

  HP_BAR_BG: '#333333',
  // Health bar background (empty portion).

  SHIELD_COLOR: '#B3E5FC',
  // Shield bar overlay color.

  DAMAGE_NUMBER_COLOR: '#ff4444',
  // Floating damage text color.

  HEAL_NUMBER_COLOR: '#44ff44',
  // Floating heal text color.

  BOSS_HP_COLOR: '#9C27B0',
  // Boss health bar color (purple, feels ominous).

  SELL_ZONE_COLOR: '#2d0a0a',
  // Sell zone background.

  BENCH_EMPTY_BORDER: '#555555',
  // Dashed border for empty bench slots.

  ELEMENT_COLORS: {
    fire: '#e94560',
    earth: '#8B6914',
    wind: '#4CAF50',
    water: '#2196F3',
    lightning: '#f5c842',
    shadow: '#9C27B0',
    ice: '#B3E5FC',
    light: '#FF9800',
  },
  // Element-to-color mapping. Used for dragon circles and ability effects.

  // ─── RENDERING — SIZES ────────────────────────────────────────
  // Dimensions of game objects on screen

  DRAGON_RADIUS_TEAM: 25,
  // Radius of dragon circles in team slots (px).

  DRAGON_RADIUS_BENCH: 16,
  // Radius of dragon circles on the bench (px).

  DRAGON_RADIUS_FIGHT: 30,
  // Radius of dragon circles during battle view (px).

  BOSS_RADIUS: 60,
  // Radius of the boss circle in boss fight (px). Bigger = more intimidating.

  HP_BAR_HEIGHT: 6,
  // Height of HP bars above dragons (px).

  HP_BAR_WIDTH_TEAM: 50,
  // Width of HP bars in team/fight view (px).

  SHOP_CARD_WIDTH: 110,
  // Width of each shop card (px).

  SHOP_CARD_HEIGHT: 140,
  // Height of each shop card (px).

  BUTTON_HEIGHT: 45,
  // Height of action buttons (Fight, Reroll) (px).

  BUTTON_BORDER_RADIUS: 8,
  // Corner rounding on buttons and cards (px).

  // ─── RENDERING — LAYOUT REGIONS ───────────────────────────────
  // Y-positions and dimensions for each screen zone (Prep Phase)
  // These define where things sit vertically on the canvas.

  HEADER_HEIGHT: 50,
  // Height of the top bar showing round + gold.

  TEAM_ZONE_Y: 90,
  // Top edge of the team slots area.

  TEAM_SLOT_WIDTH: 100,
  // Width of each team slot box.

  TEAM_SLOT_HEIGHT: 120,
  // Height of each team slot box.

  TEAM_SLOT_GAP: 20,
  // Horizontal gap between team slots.

  BENCH_ZONE_Y: 255,
  // Top edge of the bench area.

  BENCH_SLOT_WIDTH: 64,
  // Width of each bench slot.

  BENCH_SLOT_HEIGHT: 80,
  // Height of each bench slot.

  BENCH_SLOT_GAP: 10,
  // Horizontal gap between bench slots.

  SELL_ZONE_Y: 355,
  // Top edge of the sell/trash drop zone.

  SELL_ZONE_WIDTH: 120,
  // Width of sell zone.

  SELL_ZONE_HEIGHT: 40,
  // Height of sell zone.

  SHOP_ZONE_Y: 455,
  // Top edge of the shop cards area.

  SHOP_CARD_GAP: 15,
  // Horizontal gap between shop cards.

  BUTTON_ZONE_Y: 615,
  // Top edge of action buttons row.

  // ─── RENDERING — FIGHT LAYOUT ────────────────────────────────
  // Positions for the 3v3 battle screen

  FIGHT_PLAYER_X: 80,
  // X position for center of player dragons column.

  FIGHT_ENEMY_X: 320,
  // X position for center of enemy dragons column.

  FIGHT_Y_POSITIONS: [150, 300, 450],
  // Y positions for the 3 dragon slots (top, middle, bottom) during fight.

  FIGHT_BOSS_X: 280,
  // X position for the boss during boss fight.

  FIGHT_BOSS_Y: 300,
  // Y position for the boss.

  COMBAT_LOG_Y: 620,
  // Y position for the scrolling combat log text.

  COMBAT_LOG_MAX_LINES: 4,
  // How many lines of combat log to show at once.

  // ─── ANIMATION — TIMING ──────────────────────────────────────
  // All animation durations and speeds

  TURN_DELAY_MS: 800,
  // Milliseconds to wait between each combat turn (pacing for readability).
  // Recommended range: 400–1200. Lower = faster battles. Higher = more dramatic.

  ATTACK_LUNGE_DIST: 20,
  // Pixels a dragon moves toward its target during an attack animation.

  ATTACK_LUNGE_DURATION: 150,
  // Duration of the lunge forward (ms).

  ATTACK_RETURN_DURATION: 100,
  // Duration of the return to original position (ms).

  DAMAGE_FLOAT_SPEED: 40,
  // Pixels per second that floating damage numbers rise.

  DAMAGE_FLOAT_DURATION: 800,
  // Milliseconds before floating numbers fully fade out.

  DAMAGE_FLOAT_FONT_SIZE: 16,
  // Font size for floating damage numbers (px).

  SHAKE_INTENSITY: 4,
  // Pixels of random offset during screen/dragon shake.

  SHAKE_DURATION: 200,
  // Milliseconds the shake effect lasts.

  ABILITY_GLOW_DURATION: 300,
  // Milliseconds the ability-cast glow effect lasts on the caster.

  HEAL_PULSE_DURATION: 400,
  // Milliseconds for the green heal pulse animation.

  DEATH_FADE_DURATION: 500,
  // Milliseconds for a defeated dragon to fade out.

  ROUND_TRANSITION_DURATION: 1000,
  // Milliseconds for "Round X" text to display between rounds.

  BOSS_SCORE_TICK_SPEED: 50,
  // Milliseconds between each number increment in the score counter animation.

  // ─── ANIMATION — EASING ──────────────────────────────────────
  // Easing function names used by the tween system

  DEFAULT_EASE: 'ease_out_quad',
  // Options: 'linear', 'ease_out_quad', 'ease_in_quad', 'ease_in_out_quad'.
  // 'ease_out_quad' feels snappy for attacks. 'linear' for floating numbers.

  // ─── FONTS ────────────────────────────────────────────────────
  // Typography (all rendered on Canvas, no CSS fonts needed)

  FONT_FAMILY: 'monospace',
  // Base font family. Monospace ensures consistent widths.

  FONT_SIZE_TITLE: 28,
  // Game title on main menu (px).

  FONT_SIZE_HEADER: 14,
  // Round number, gold display (px).

  FONT_SIZE_DRAGON_NAME: 9,
  // Dragon name below its circle (px).

  FONT_SIZE_STATS: 8,
  // ATK/HP/SPD stat line (px).

  FONT_SIZE_BUTTON: 12,
  // Button label text (px).

  FONT_SIZE_COMBAT_LOG: 10,
  // Combat log text (px).

  FONT_SIZE_SCORE: 32,
  // Boss damage score display (px).

  // ─── PERSISTENCE ──────────────────────────────────────────────
  // LocalStorage configuration

  SAVE_KEY: 'wyrmpit_save',
  // localStorage key name. Change this to reset all player data.

  SAVE_VERSION: 1,
  // Schema version. If you restructure the save format, bump this to force a reset.

  DEFAULT_SAVE: {
    totalXP: 0,
    highScore: 0,
    unlockedDragons: ['ember', 'stonescale', 'zephyr', 'tidecaller'],
    codex: {},
    // codex entries will be added as: { 'ember_1': true, 'ember_2': true, ... }
  },
  // Initial save state for new players. Also used as fallback if save is corrupted.

  // ─── LOGGING ──────────────────────────────────────────────────
  // Debug output control

  LOG_ENABLED: true,
  // Master switch for all console.log output. Set to false for "production."

  LOG_BATTLE: true,
  // Log every combat action (damage, heal, ability, death).

  LOG_SHOP: true,
  // Log shop generation, purchases, sells, rerolls.

  LOG_MERGE: true,
  // Log merge detections and tier-ups.

  LOG_STATE: true,
  // Log game state transitions (menu → prep → fight → etc).

  LOG_SAVE: true,
  // Log save/load operations.

  LOG_INPUT: false,
  // Log every pointer event (very noisy — enable only for input debugging).

};