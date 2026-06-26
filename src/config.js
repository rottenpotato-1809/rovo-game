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

  STARTING_GOLD: 6,
  // Gold the player begins with on round 1.
  // Recommended range: 3-6. Higher = lets round 1 field more than one dragon.

  GOLD_PER_WIN_BASE: 4,
  // Flat gold earned for winning any round (before scaling).
  // Recommended range: 2–4.

  GOLD_PER_WIN_SCALING: 1,
  // Additional gold per round number. Formula: base + (round × scaling).
  // Round 1 win = 4 + (1×1) = 5g. Round 7 win = 4 + (7×1) = 11g.
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

  INTEREST_PER_THRESHOLD: 1,
  // Gold earned for each saved-gold threshold at the start of prep.

  INTEREST_THRESHOLD: 5,
  // Held gold required per interest tick.

  INTEREST_CAP: 3,
  // Maximum interest gold awarded per prep phase.

  SHOP_SIZE: 4,
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
    // Rows may start below TEAM_SIZE for onboarding, then grow into full teams.
    // Difficulty ramps from all-T1 to mostly-T3.
    [1, 0, 0],  // Round 1  — one-dragon intro
    [2, 0, 0],  // Round 2  — two-dragon warmup
    [3, 0, 0],  // Round 3  — first full enemy team
    [2, 1, 0],  // Round 4  — same
    [1, 2, 0],  // Round 5  — mid-game spike
    [1, 2, 0],  // Round 6  — same
    [0, 3, 0],  // Round 7  — all T2, pressure ramps
    [0, 3, 0],  // Round 8  — same
    [0, 2, 1],  // Round 9  — first T3 appears
    [0, 1, 2],  // Round 10 — finale, mostly T3
  ],

  ENEMY_POWER_SCALE: [
    0.40, // Round 1  — onboarding, not a run-ending check
    0.44, // Round 2  — complete the starting team
    0.50, // Round 3  — first full enemy team
    0.59, // Round 4  — first meaningful composition check
    0.65, // Round 5
    0.70, // Round 6
    0.68, // Round 7  — controlled late-run pressure
    0.73, // Round 8
    0.56, // Round 9  — T3 introduction raises effective power
    0.61, // Round 10 — final pre-boss exam
  ],
  // Per-round ATK/HP multiplier for generated enemies.

  ENEMY_MIN_STAT: 1,
  // Lowest allowed enemy ATK/HP after round power scaling.

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

  BOSS_ATTACK_INTERVAL_TURNS: 3,
  // Boss gathers power each turn and releases one team-wide blast on this cadence.

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
  // Order matches: Voltfang (100), Nightshade (200), Metalwing (350), Solflare (500).
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

  CANVAS_WIDTH: 960,
  // Logical canvas width in pixels. CSS scales this to fit the viewport.
  // Recommended: 960 (landscape-friendly aspect ratio).

  CANVAS_HEIGHT: 540,
  // Logical canvas height in pixels.
  // Combined with width, gives a 16:9 landscape aspect ratio.

  PIXEL_RATIO: 1,
  // Fallback device pixel ratio when browser pixel ratio is unavailable.

  CANVAS_MAX_PIXEL_RATIO: 2,
  // Maximum backing-store pixel ratio for sharp scaled rendering without huge canvases.

  PERCENT_MULTIPLIER: 100,
  // Convert normalized progress values into whole display percentages.

  LOADING_MIN_DURATION_MS: 900,
  // Minimum boot-screen visibility so cached assets do not skip the transition.

  // ─── RENDERING — COLORS ───────────────────────────────────────
  // All color values used in the game. Change these to retheme instantly.

  BG_COLOR: '#0d0d1a',
  // Main background color (deep void).

  HEADER_BG_COLOR: '#16213e',
  // Top header bar background.

  CARD_BG_COLOR: 'rgba(14, 17, 42, 0.9)',
  // Shop card and UI card background.

  CARD_HOVER_BG: 'rgba(30, 31, 66, 0.94)',
  // Shop card hover background.

  CARD_BORDER_ALPHA: 0.4,
  // Resting alpha for element-colored card borders.

  CARD_AFFORDABLE_PULSE: true,
  // Pulse shop-card borders when the dragon can be bought.

  CARD_DISABLED_OVERLAY: 'rgba(6, 8, 18, 0.55)',
  // Dim overlay for shop cards the player cannot afford.

  CARD_STATS_OVERLAY: 'rgba(8, 10, 24, 0.72)',
  // Dark lower information plate inside shop cards.

  CARD_TEXTURE_ALPHA: 0.07,
  // Subtle cross-hatch grain on stone/parchment panels.

  ACCENT_PRIMARY: '#e94560',
  // Primary accent — team slot borders, fight button, highlights.

  ACCENT_SECONDARY: '#0f3460',
  // Secondary accent — subtle borders, dividers.

  GOLD_COLOR: '#f5c842',
  // Currency display, shop card borders, gold-related UI.

  GOLD_FLASH_SCALE: 1.3,
  // Gold counter bump scale when the amount changes.

  GOLD_FLASH_DURATION: 200,
  // Gold counter bump duration in milliseconds.

  LOADING_BAR_COLOR: '#b94cff',
  // Loading progress fill over the illustrated boot screen.

  TEXT_PRIMARY: '#ffffff',
  // Main text color.

  TEXT_SECONDARY: '#e3e8ef',
  // Subdued text (stat labels, descriptions).

  TEXT_MUTED: '#aeb8c6',
  // Very faint text (empty slot labels, annotations).

  HP_BAR_FULL: '#2fd27a',
  // Health bar color when HP is above 50%.

  HP_BAR_LOW: '#e94560',
  // Health bar color when HP is below 25%.

  HP_BAR_MID: '#FF9800',
  // Health bar color when HP is between 25-50%.

  HP_BAR_BG: '#171923',
  // Health bar background (empty portion).

  TEXT_OUTLINE_COLOR: '#101522',
  // Dark outline behind canvas text so labels remain legible over the arena.

  TEXT_OUTLINE_WIDTH: 3,
  // Canvas stroke width used for readable text edges.

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
    fire: '#d84a2f',
    earth: '#9a741f',
    wind: '#4f9f73',
    water: '#1d8ea5',
    lightning: '#f5c842',
    shadow: '#8f3bcc',
    ice: '#B3E5FC',
    metal: '#9aa3ad',
    light: '#e8b957',
  },
  // Element-to-color mapping. Used for dragon circles and ability effects.

  // ─── RENDERING — SIZES ────────────────────────────────────────
  // Dimensions of game objects on screen

  DRAGON_RADIUS_TEAM: 28,
  // Radius of dragon circles in team slots (px).

  DRAGON_RADIUS_BENCH: 24,
  // Radius of dragon circles on the bench (px).

  DRAGON_RADIUS_FIGHT: 34,
  // Radius of dragon circles during battle view (px).

  DRAGON_SPRITE_SCALE: 2.8,
  // Sprite width/height relative to the legacy dragon-token radius.

  DRAGON_SHADOW_COLOR: 'rgba(0, 0, 0, 0.38)',
  // Soft oval shadow beneath dragon sprites in battle.

  DRAGON_SHADOW_WIDTH_BY_TIER: {
    1: 1.1,
    2: 1.34,
    3: 1.58,
  },
  // Shadow width relative to the legacy dragon-token radius for each tier.

  DRAGON_SHADOW_HEIGHT_BY_TIER: {
    1: 0.22,
    2: 0.28,
    3: 0.34,
  },
  // Shadow height relative to the legacy dragon-token radius for each tier.

  DRAGON_SHADOW_OFFSET_BY_TIER: {
    1: 22,
    2: 27,
    3: 32,
  },
  // Shadow baseline offset below the dragon sprite center for each tier.

  TIER_SCALE_T1: 1.0,
  // Tier 1 dragon render scale.

  TIER_SCALE_T2: 1.18,
  // Tier 2 dragon render scale.

  TIER_SCALE_T3: 1.38,
  // Tier 3 dragon render scale.

  TIER_GLOW_T2_ALPHA: 0.2,
  // Soft element glow opacity for Tier 2 dragons.

  TIER_GLOW_T3_ALPHA: 0.4,
  // Stronger element glow opacity for Tier 3 dragons.

  TIER_GLOW_SPREAD: 4,
  // Number of layered glow circles around evolved dragons.

  DRAGON_TIER_ONE_SCALE: 0.86,
  // Baby-dragon artwork scale relative to its slot or battle radius.

  DRAGON_TIER_TWO_SCALE: 1.35,
  // Adult-dragon artwork scale so evolved forms read larger than babies.

  DRAGON_TIER_THREE_SCALE: 1.35,
  // Tier 3 keeps the adult silhouette and adds evolution effects.

  SHOP_DRAGON_SPRITE_SIZE: 86,
  // Dragon artwork size inside one shop card.

  TIER_THREE_AURA_RADIUS_MULTIPLIER: 1.45,
  // Tier 3 aura radius relative to the dragon token radius.

  TIER_THREE_AURA_LINE_WIDTH: 3,
  // Stroke width of the animated Tier 3 aura.

  TIER_THREE_AURA_PULSE_MS: 900,
  // Duration of one Tier 3 aura pulse.

  TIER_THREE_ORB_COUNT: 4,
  // Number of motes orbiting Tier 3 artwork.

  TIER_THREE_ORB_RADIUS: 2.5,
  // Radius of each Tier 3 aura mote.

  BOSS_RADIUS: 60,
  // Radius of the boss circle in boss fight (px). Bigger = more intimidating.

  BOSS_SPRITE_SIZE: 250,
  // Square draw size for the transparent boss crystal sprite.

  BOSS_SPRITE_PULSE_SCALE: 0.06,
  // Maximum extra scale while the boss charges its next blast.

  BOSS_SPRITE_PULSE_SPEED_MS: 420,
  // Crystal pulse period during boss playback.

  HP_BAR_HEIGHT: 6,
  // Height of HP bars above dragons (px).

  HP_BAR_BORDER_COLOR: 'rgba(227, 232, 239, 0.5)',
  // Thin frame around health bars so they read over busy art.

  HP_BAR_LOW_PULSE_MS: 520,
  // Pulse speed for critical HP bars.

  HP_BAR_WIDTH_TEAM: 96,
  // Width of HP bars in team/fight view (px).

  SHOP_CARD_WIDTH: 92,
  // Width of each shop card (px).

  SHOP_CARD_HEIGHT: 192,
  // Height of each shop card (px).

  BUTTON_HEIGHT: 45,
  // Height of action buttons (Fight, Reroll) (px).

  BUTTON_BORDER_RADIUS: 8,
  // Corner rounding on buttons and cards (px).

  BUTTON_HOVER_SCALE: 1.04,
  // Button scale while hovered.

  BUTTON_PRESS_SCALE: 0.96,
  // Button scale while held down.

  BUTTON_FILL_COLOR: '#232437',
  // Dark stone button fill.

  BUTTON_FILL_HOVER: '#2f3046',
  // Slightly lighter stone fill while hovered.

  BUTTON_FILL_DISABLED: '#252732',
  // Desaturated fill for disabled buttons.

  BUTTON_BORDER_COLOR: '#f5c842',
  // Gold button border.

  BUTTON_BORDER_DISABLED: '#777b86',
  // Grey disabled button border.

  BUTTON_TEXT_DISABLED: '#8f95a1',
  // Grey disabled button text.

  BUTTON_BORDER_REST_ALPHA: 0.4,
  // Resting gold-border opacity.

  BUTTON_BORDER_HOVER_ALPHA: 1,
  // Hovered gold-border opacity.

  BUTTON_BORDER_WIDTH: 1,
  // Thin stone-and-gold button border.

  BUTTON_PRESS_BORDER_WIDTH: 2,
  // Slight border flash while pressed.

  BUTTON_MOTION_DURATION_MS: 110,
  // Time for button hover and press motion to settle.

  BUTTON_GLOW_BLUR: 14,
  // Hover glow softness around interactive buttons.

  BUTTON_SHADOW_OFFSET_Y: 2,
  // Resting button shadow distance.

  BUTTON_SHADOW_COLOR: 'rgba(8, 10, 24, 0.55)',
  // Shadow color shared by canvas buttons.

  BUTTON_PRESS_SHADOW_OFFSET_Y: 1,
  // Compressed button shadow distance while pressed.

  UI_PANEL_COLOR: 'rgba(14, 18, 45, 0.82)',
  // Translucent panel color that preserves background visibility.

  UI_PANEL_SOFT_COLOR: 'rgba(14, 18, 45, 0.62)',
  // Lighter panel treatment for labels and stat regions.

  // ─── RENDERING — LAYOUT REGIONS ───────────────────────────────
  // Y-positions and dimensions for each screen zone (Prep Phase)
  // These define where things sit vertically on the canvas.

  HEADER_HEIGHT: 50,
  // Height of the top bar showing round + gold.

  TEAM_ZONE_Y: 112,
  // Top edge of the team slots area.

  TEAM_SLOT_WIDTH: 136,
  // Width of each team slot box.

  TEAM_SLOT_HEIGHT: 178,
  // Height of each team slot box.

  TEAM_SLOT_GAP: 12,
  // Horizontal gap between team slots.

  BENCH_ZONE_Y: 376,
  // Top edge of the bench area.

  BENCH_SLOT_WIDTH: 94,
  // Width of each bench slot.

  BENCH_SLOT_HEIGHT: 128,
  // Height of each bench slot.

  BENCH_SLOT_GAP: 10,
  // Horizontal gap between bench slots.

  SELL_ZONE_Y: 332,
  // Top edge of the sell/trash drop zone.

  SELL_ZONE_WIDTH: 180,
  // Width of sell zone.

  SELL_ZONE_HEIGHT: 48,
  // Height of sell zone.

  SHOP_ZONE_Y: 116,
  // Top edge of the shop cards area.

  SHOP_CARD_GAP: 7,
  // Horizontal gap between shop cards.

  BUTTON_ZONE_Y: 450,
  // Top edge of action buttons row.

  // ─── RENDERING — FIGHT LAYOUT ────────────────────────────────
  // Positions for the 3v3 battle screen

  FIGHT_PLAYER_X: 340,
  // X position for center of player dragons column.

  FIGHT_ENEMY_X: 620,
  // X position for center of enemy dragons column.

  FIGHT_Y_POSITIONS: [280, 355, 430],
  // Y positions for the 3 dragon slots (top, middle, bottom) during fight.

  ARENA_BATTLEFIELD_TOP_Y: 214,
  // Top edge of the brown floor reserved for combatants.

  FIGHT_BOSS_X: 700,
  // X position for the boss during boss fight.

  FIGHT_BOSS_Y: 338,
  // Y position for the boss.

  COMBAT_LOG_Y: 50,
  // Baseline of the first scrolling combat-log line.

  COMBAT_LOG_MAX_LINES: 4,
  // How many lines of combat log to show at once.

  COMBAT_LOG_SCROLL_STEP: 1,
  // Number of combat-log lines moved by one wheel or touch-scroll step.

  // ─── ANIMATION — TIMING ──────────────────────────────────────
  // All animation durations and speeds

  TURN_DELAY_MS: 520,
  // Base event interval at 1x playback speed.

  BATTLE_SPEED_MODES: ['auto', 1, 2, 3],
  // Player-selectable playback modes shown as a segmented arena control.

  BATTLE_AUTO_SPEED_START: 1,
  // AUTO always opens at normal speed.

  BATTLE_AUTO_SPEED_CAP: 2.5,
  // Maximum AUTO multiplier so late playback stays readable.

  BATTLE_AUTO_SPEED_RAMP_PER_SECOND: 0.08,
  // Linear AUTO acceleration; reaches the cap after roughly 19 seconds.

  BATTLE_AUTO_MAX_FRAME_DELTA_SECONDS: 0.25,
  // Prevent background-tab frame gaps from jumping AUTO straight to its cap.

  MUSIC_VOLUME: 0.32,

  MASTER_VOLUME: 0.3,
  // Master gain applied to synthesized sound effects.

  SFX_ENABLED: true,
  // Sound effects are still gated behind the first user interaction.

  SOUND_VOLUME: 0.65,
  // Default sound-effect volume reserved for current and future effects.
  // Shared background-music volume. Browser playback begins after first input.

  SFX_MIN_GAIN: 0.0001,
  // Web Audio exponential ramps need a positive floor.

  SFX_STOP_PADDING_SECONDS: 0.03,
  // Extra time before disconnecting a finished sound source.

  SFX_DEFAULT_ATTACK_SECONDS: 0.01,
  // Default envelope attack for clean oscillator pings.

  SFX_NOISE_ATTACK_SECONDS: 0.005,
  // Shorter attack for noise bursts.

  SFX_BUY_FREQUENCY: 800,
  SFX_BUY_DURATION_SECONDS: 0.08,
  SFX_BUY_GAIN: 0.42,

  SFX_SELL_FREQUENCIES: [600, 800, 1000],
  SFX_SELL_DURATION_SECONDS: 0.08,
  SFX_SELL_GAIN: 0.32,
  SFX_SELL_STAGGER_SECONDS: 0.04,

  SFX_MERGE_START_FREQUENCY: 400,
  SFX_MERGE_END_FREQUENCY: 1200,
  SFX_MERGE_DURATION_SECONDS: 0.3,
  SFX_MERGE_GAIN: 0.5,
  SFX_MERGE_ATTACK_SECONDS: 0.08,
  SFX_MERGE_PING_FREQUENCY: 1600,
  SFX_MERGE_PING_DURATION_SECONDS: 0.11,
  SFX_MERGE_PING_GAIN: 0.55,

  SFX_HIT_FREQUENCY: 150,
  SFX_HIT_DURATION_SECONDS: 0.06,
  SFX_HIT_GAIN: 0.32,

  SFX_FIRE_NOISE_DURATION_SECONDS: 0.1,
  SFX_FIRE_NOISE_GAIN: 0.22,
  SFX_FIRE_CRACKLE_FREQUENCY: 300,
  SFX_FIRE_CRACKLE_DURATION_SECONDS: 0.08,
  SFX_FIRE_CRACKLE_GAIN: 0.2,
  SFX_FIRE_CRACKLE_DELAY_SECONDS: 0.03,

  SFX_ABILITY_DURATION_SECONDS: 0.14,
  SFX_ABILITY_GAIN: 0.34,
  SFX_ABILITY_VOICES: {
    earth: { frequency: 180, type: 'triangle' },
    wind: { frequency: 720, type: 'sine' },
    water: { frequency: 520, type: 'sine' },
    lightning: { frequency: 980, type: 'square' },
    shadow: { frequency: 140, type: 'sawtooth' },
    ice: { frequency: 1040, type: 'triangle' },
    metal: { frequency: 360, type: 'square' },
    light: { frequency: 880, type: 'sine' },
    default: { frequency: 640, type: 'sine' },
  },

  SFX_DEATH_START_FREQUENCY: 800,
  SFX_DEATH_END_FREQUENCY: 200,
  SFX_DEATH_DURATION_SECONDS: 0.25,
  SFX_DEATH_GAIN: 0.34,
  SFX_DEATH_ATTACK_SECONDS: 0.02,

  SFX_VICTORY_FREQUENCIES: [523, 659, 784],
  SFX_VICTORY_DURATION_SECONDS: 0.16,
  SFX_VICTORY_GAIN: 0.38,
  SFX_VICTORY_STAGGER_SECONDS: 0.12,

  SFX_DEFEAT_FREQUENCIES: [392, 330],
  SFX_DEFEAT_DURATION_SECONDS: 0.24,
  SFX_DEFEAT_GAIN: 0.32,
  SFX_DEFEAT_STAGGER_SECONDS: 0.2,

  SFX_BOSS_RUMBLE_FREQUENCY: 80,
  SFX_BOSS_RUMBLE_DURATION_SECONDS: 0.6,
  SFX_BOSS_RUMBLE_GAIN: 0.36,
  SFX_BOSS_PULSE_FREQUENCY: 120,
  SFX_BOSS_PULSE_DURATION_SECONDS: 0.08,
  SFX_BOSS_PULSE_GAIN: 0.22,
  SFX_BOSS_PULSE_DELAYS_SECONDS: [0, 0.18, 0.36],

  ATTACK_LUNGE_DIST: 36,
  // Pixels a dragon moves toward its target during an attack animation.

  ATTACK_LUNGE_DURATION: 95,
  // Duration of the lunge forward (ms).

  ATTACK_RETURN_DURATION: 75,
  // Duration of the return to original position (ms).

  DAMAGE_FLOAT_SPEED: 64,
  // Pixels per second that floating damage numbers rise.

  DAMAGE_FLOAT_DURATION: 520,
  // Milliseconds before floating numbers fully fade out.

  DAMAGE_FLOAT_FONT_SIZE: 16,
  // Legacy fallback font size for floating damage numbers (px).

  DAMAGE_FONT_BASIC: 14,
  // Floating text size for basic attacks.

  DAMAGE_FONT_ABILITY: 16,
  // Floating text size for special abilities.

  DAMAGE_FONT_CRIT: 22,
  // Floating text size for critical hits.

  DAMAGE_FONT_SHIELD: 12,
  // Floating text size for shield absorbs.

  DAMAGE_CRIT_THRESHOLD: 0.5,
  // Damage above this fraction of target max HP counts as critical.

  DAMAGE_AOE_STAGGER_MS: 50,
  // Offset between floating damage numbers from the same area ability.

  SHAKE_INTENSITY: 4,
  // Pixels of random offset during screen/dragon shake.

  SHAKE_DURATION: 200,
  // Milliseconds the shake effect lasts.

  HIT_RECOIL_DISTANCE: 12,
  // Distance a struck dragon recoils away from the attacker.

  HIT_RECOIL_DURATION: 130,
  // Duration of the target recoil animation.

  HIT_FLASH_DURATION: 170,
  // Duration of the damage flash behind a struck dragon.

  ABILITY_CAST_SCALE: 1.16,
  // Peak caster scale when a special ability activates.

  ABILITY_GLOW_DURATION: 180,
  // Milliseconds the ability-cast glow effect lasts on the caster.

  HEAL_PULSE_DURATION: 400,
  // Milliseconds for the green heal pulse animation.

  AMBIENT_DUST_COUNT: 8,
  // Slow prep-screen tavern dust motes.

  AMBIENT_DUST_SPEED: 15,
  // Pixels per second dust drifts upward.

  AMBIENT_DUST_ALPHA: 0.15,
  // Base dust mote alpha.

  AMBIENT_EMBER_COUNT: 4,
  // Fight-screen ember count.

  AMBIENT_EMBER_SPEED: 25,
  // Pixels per second embers drift upward.

  AMBIENT_FOG_ALPHA_MIN: 0.1,
  // Lowest boss fog opacity.

  AMBIENT_FOG_ALPHA_MAX: 0.2,
  // Highest boss fog opacity.

  AMBIENT_FOG_HEIGHT_RATIO: 0.2,
  // Bottom-screen share covered by boss fog.

  AMBIENT_FOG_PULSE_MS: 900,
  // Boss fog alpha oscillation period.

  AMBIENT_PARTICLE_MIN_RADIUS: 1,
  // Smallest ambient particle radius.

  AMBIENT_PARTICLE_RADIUS_RANGE: 2,
  // Extra random radius for ambient particles.

  AMBIENT_PARTICLE_DRIFT_X: 6,
  // Horizontal wobble range for ambient particles.

  BUTTON_INNER_GLOW_INSET: 3,
  // Inset for the hover inner-glow rectangle.

  BUTTON_INNER_GLOW_ALPHA: 0.16,
  // Opacity of the button hover inner glow.

  BUTTON_TEXTURE_ALPHA: 0.08,
  // Subtle stone grain drawn inside command buttons.

  DEATH_FADE_DURATION: 320,
  // Milliseconds for a defeated dragon to fade out.

  DEATH_FALL_ROTATION: -1.18,
  // Final rotation in radians for defeated dragons falling backward.

  DEATH_FALL_OFFSET_Y: 12,
  // Extra drop as a defeated dragon tips over.

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

  FONT_SIZE_TITLE: 36,
  // Game title on main menu (px).

  FONT_SIZE_HEADER: 16,
  // Round number, gold display (px).

  FONT_SIZE_CARD_TITLE_MIN: 10,
  // Smallest shop-card title size allowed before text is clipped.

  FONT_SIZE_CARD_META_MIN: 7,
  // Smallest shop-card metadata size allowed before text is clipped.

  FONT_SIZE_DRAGON_NAME: 12,
  // Dragon name below its circle (px).

  FONT_SIZE_STATS: 8,
  // ATK/HP/SPD stat line (px).

  FONT_SIZE_BUTTON: 16,
  // Button label text (px).

  FONT_SIZE_COMBAT_LOG: 13,
  // Combat log text (px).

  FONT_SIZE_SCORE: 32,
  // Boss damage score display (px).

  FONT_SIZE_FIGHT_RESULT: 56,
  // Large WIN/LOSE label shown after combat playback.

  FONT_SIZE_BOSS_REVEAL_SCORE: 72,
  // Final boss score size during the cinematic count-up.

  FONT_SIZE_BODY: 16,
  // General body copy and arena status text (px).

  FONT_SIZE_EMOJI: 26,
  // Emoji glyph size rendered inside dragon circles (px).

  FONT_SIZE_SMALL: 6,
  // Tiny helper labels in compact arena areas (px).

  // ─── MILESTONE 1 ARENA UI ─────────────────────────────────────
  // Temporary spectator-only screen and fight playback measurements

  ARENA_TITLE_Y: 96,
  // Y position of the temporary arena title.

  ARENA_SUBTITLE_Y: 138,
  // Y position of the temporary arena subtitle.

  ARENA_FIGHT_BUTTON_X: 380,
  // X position of the temporary Fight button.

  ARENA_FIGHT_BUTTON_Y: 336,
  // Y position of the temporary Fight button.

  ARENA_FIGHT_BUTTON_WIDTH: 200,
  // Width of the temporary Fight button.

  ARENA_STATUS_Y: 404,
  // Y position for small temporary arena hints.

  ARENA_TEAM_LABEL_Y: 246,
  // Y position for fight-side team labels.

  ARENA_INFO_OFFSET_X: 48,
  // Horizontal gap between a battle portrait and its name/HP information.

  ARENA_INFO_NAME_OFFSET_Y: -10,
  // Vertical offset for the battle name beside a portrait.

  ARENA_INFO_HP_OFFSET_Y: 8,
  // Vertical offset for the battle HP bar beside a portrait.

  ARENA_ABILITY_TIMER_OFFSET_Y: 27,
  // Vertical offset for the special-ability cooldown label beside a portrait.

  ARENA_ABILITY_TIMER_WIDTH: 96,
  // Maximum width for the special-ability cooldown label.

  ARENA_RESULT_Y: 44,
  // Y position for WIN/LOSE result text after combat.

  ARENA_RESULT_PANEL_X: 320,
  // Left edge of the compact completed-fight panel.

  ARENA_RESULT_PANEL_Y: 4,
  // Top edge of the compact completed-fight panel.

  ARENA_RESULT_PANEL_WIDTH: 320,
  // Width of the compact completed-fight panel.

  ARENA_RESULT_PANEL_HEIGHT: 104,
  // Height of the completed-fight panel.

  ARENA_RESULT_CONTINUE_Y: 82,
  // Continue prompt baseline inside the completed-fight panel.

  PREP_SELL_TITLE_OFFSET_Y: -8,
  // Vertical offset for the main Sell label.

  PREP_SELL_HINT_OFFSET_Y: 11,
  // Vertical offset for drag guidance and the active sell value.

  ARENA_LOG_PANEL_X: 642,
  // Left edge of the combat-log panel in the upper-right UI space.

  ARENA_LOG_PANEL_Y: 12,
  // Top edge of the combat-log panel.

  ARENA_LOG_PANEL_WIDTH: 286,
  // Width of the combat-log panel.

  ARENA_LOG_PANEL_HEIGHT: 124,
  // Height of the combat-log panel.

  ARENA_LOG_PANEL_PADDING: 12,
  // Inner padding for combat-log text.

  ARENA_LOG_HEADER_Y: 28,
  // Battle-log heading baseline.

  ARENA_LOG_X: 654,
  // Left edge of combat-log text.

  ARENA_LOG_LINE_HEIGHT: 18,
  // Vertical spacing between combat log lines.

  ARENA_LOG_SCROLLBAR_MARGIN: 10,
  // Right margin for the combat-log scrollbar.

  ARENA_LOG_SCROLLBAR_WIDTH: 5,
  // Width of the combat-log scrollbar.

  ARENA_LOG_SCROLLBAR_MIN_HEIGHT: 14,
  // Minimum scrollbar thumb height.

  ARENA_LOG_SCROLLBAR_TRACK_COLOR: '#2e3a55',
  // Combat-log scrollbar track color.

  ARENA_LOG_SCROLLBAR_THUMB_COLOR: '#d7dee8',
  // Combat-log scrollbar thumb color.

  ARENA_HP_HIGH_THRESHOLD: 0.5,
  // HP ratio at or above this uses healthy green.

  ARENA_HP_LOW_THRESHOLD: 0.25,
  // HP ratio below this uses low-health red.

  ARENA_DEAD_ALPHA: 0.2,
  // Final opacity after a dragon death fade completes.

  ARENA_ALIVE_ALPHA: 1,
  // Full opacity for living dragons.

  ARENA_ABILITY_GLOW_RADIUS_MULTIPLIER: 1.45,
  // Ability flash radius relative to dragon radius.

  ARENA_ABILITY_GLOW_ALPHA: 0.45,
  // Ability flash opacity at cast start.

  ARENA_FLOAT_ALPHA: 1,
  // Starting opacity for floating damage and heal numbers.

  ARENA_FLOAT_OFFSET_X: 12,
  // Horizontal nudge for floating numbers so they do not cover HP bars.

  ARENA_FLOAT_OFFSET_Y: -28,
  // Vertical starting offset for floating numbers.

  ARENA_LUNGE_DIRECTION_RIGHT: 1,
  // Direction multiplier when the player lunges toward enemies.

  ARENA_LUNGE_DIRECTION_LEFT: -1,
  // Direction multiplier when enemies lunge toward players.

  ARENA_SKY_COLOR: '#cbd3d0',
  // Pale neutral sky above the arena wall.

  ARENA_HORIZON_COLOR: '#a5afaa',
  // Distant stone band behind the battlefield.

  ARENA_HILL_COLOR: '#7c8983',
  // Muted lower wall color.

  ARENA_GROUND_COLOR: '#74836d',
  // Main moss-toned arena floor.

  ARENA_GROUND_DARK_COLOR: '#3c4944',
  // Dark neutral foreground strip.

  ARENA_LINE_COLOR: '#5e6c66',
  // Boundary and center-ring color on the neutral arena floor.

  ARENA_LINE_WIDTH: 3,
  // Width of arena boundary lines and center ring.

  ARENA_CENTER_RING_Y: 340,
  // Vertical center of the arena floor marking.

  ARENA_CENTER_RING_RADIUS: 88,
  // Radius of the neutral arena center marking.

  ARENA_SKY_HEIGHT: 190,
  // Height of the sky band.

  ARENA_HILL_Y: 170,
  // Y position where the hills begin.

  ARENA_GROUND_Y: 245,
  // Y position where the fightable ground begins.

  ARENA_FOREGROUND_Y: 470,
  // Y position of the darker foreground strip.

  ARENA_BACKDROP_SUN_X: 480,
  // Center X for the arena glow.

  ARENA_BACKDROP_SUN_Y: 245,
  // Center Y for the arena glow.

  ARENA_BACKDROP_SUN_RADIUS: 82,
  // Radius for the center glow in the battlefield.

  PREP_LEFT_PANEL_X: 36,
  // Left edge for team and bench management.

  PREP_RIGHT_PANEL_X: 560,
  // Left edge for shop and command buttons.

  PREP_SECTION_LABEL_OFFSET_Y: 24,
  // Vertical offset from a region top to its label.

  PREP_SLOT_LABEL_OFFSET_Y: 18,
  // Vertical offset for empty slot labels.

  PREP_CARD_TEXT_LEFT_PAD: 7,
  // Left text padding inside shop cards.

  PREP_CARD_SPRITE_Y_OFFSET: 48,
  // Dragon sprite center offset from the shop card top.

  PREP_CARD_NAME_Y_OFFSET: 100,
  // Name text offset from card top.

  PREP_CARD_ROLE_Y_OFFSET: 123,
  // Role text offset from card top.

  PREP_CARD_STAT_Y_OFFSET: 148,
  // Stat text offset from card top.

  PREP_CARD_COST_Y_OFFSET: 176,
  // Cost text offset from card top.

  PREP_TEAM_DRAGON_Y_OFFSET: 72,
  // Dragon circle vertical offset inside a team slot.

  PREP_BENCH_DRAGON_Y_OFFSET: 48,
  // Smaller dragon circle vertical offset inside a bench slot.

  PREP_DRAGON_NAME_BOTTOM_OFFSET: 28,
  // Distance from a prep slot bottom to the dragon name baseline.

  PREP_DRAGON_STATS_BOTTOM_OFFSET: 10,
  // Distance from a prep slot bottom to the tier and HP baseline.

  PREP_BUTTON_WIDTH: 180,
  // Width of prep buttons.

  PREP_BUTTON_GAP: 16,
  // Horizontal gap between prep buttons.

  PREP_MERGE_BUTTON_Y: 392,
  // Y position for the explicit merge button.

  PREP_MESSAGE_Y: 522,
  // Y position for temporary prep feedback text.

  PREP_INTEREST_FLASH_Y: 78,
  // Y position for the short interest-earned flash below the gold header.

  PREP_INTEREST_FLASH_MS: 1800,
  // Duration of the interest-earned flash at the start of prep.

  PREP_DRAG_PREVIEW_ALPHA: 0.8,
  // Opacity for the floating dragon preview while dragging.

  PREP_SECTION_LABEL_WIDTH: 176,
  // Width of framed Team, Bench, and Shop headings.

  PREP_SECTION_LABEL_HEIGHT: 30,
  // Height of framed prep-section headings.

  PREP_FRAME_LINE_WIDTH: 3,
  // Border thickness for prominent prep cards and headings.

  PREP_HEADER_PANEL_MARGIN: 12,
  // Horizontal inset for the round and gold header panels.

  PREP_HEADER_PANEL_WIDTH: 210,
  // Width of each compact prep header panel.

  PREP_HEADER_PANEL_HEIGHT: 40,
  // Height of each compact prep header panel.

  PREP_FIGHT_BUTTON_X: 790,
  // Left edge of the large Fight call to action.

  PREP_FIGHT_BUTTON_Y: 392,
  // Top edge of the large Fight call to action.

  PREP_FIGHT_BUTTON_WIDTH: 144,
  // Width of the large Fight call to action.

  PREP_FIGHT_BUTTON_HEIGHT: 103,
  // Height of the large Fight call to action.

  FONT_SIZE_PREP_FIGHT: 28,
  // Smaller label size keeps the longer final-prep command inside the Fight CTA.
  FONT_SIZE_PREP_BOSS_FIGHT: 20,
  // Label size for the large prep Fight button.

  RESULT_BUTTON_X: 380,
  // X position for result screen replay button.

  RESULT_BUTTON_Y: 360,
  // Y position for result screen replay button.

  MENU_TITLE_X: 550,
  // Left edge of the title artwork in the upper-right sky.

  MENU_TITLE_Y: 22,
  // Top edge of the title artwork.

  MENU_TITLE_WIDTH: 360,
  // Width of the title artwork on the main menu.

  MENU_TITLE_HEIGHT: 120,
  // Height of the title artwork on the main menu.

  LOADING_TITLE_X: 250,
  // Left edge of the title artwork on the loading screen.

  LOADING_TITLE_Y: 24,
  // Top edge of the title artwork on the loading screen.

  LOADING_TITLE_WIDTH: 460,
  // Width of the loading-screen title artwork.

  LOADING_TITLE_HEIGHT: 153,
  // Height of the loading-screen title artwork.

  LOADING_LABEL_Y: 458,
  // Loading percentage baseline above the progress bar.

  LOADING_BAR_X: 220,
  // Loading bar left edge.

  LOADING_BAR_Y: 478,
  // Loading bar top edge.

  LOADING_BAR_WIDTH: 520,
  // Loading bar width.

  LOADING_BAR_HEIGHT: 18,
  // Loading bar height.

  LOADING_CONTINUE_X: 370,
  // Left edge of the ready-state confirmation button.

  LOADING_CONTINUE_Y: 448,
  // Top edge of the ready-state confirmation button.

  LOADING_CONTINUE_WIDTH: 220,
  // Width of the ready-state confirmation button.

  LOADING_CONTINUE_HEIGHT: 48,
  // Height of the ready-state confirmation button.

  MENU_STATS_PANEL_X: 650,
  // Left edge of the progression panel over the lower-right sea.

  MENU_STATS_PANEL_Y: 360,
  // Top edge of the progression panel.

  MENU_STATS_PANEL_WIDTH: 276,
  // Width of the progression panel.

  MENU_STATS_PANEL_HEIGHT: 150,
  // Height of the progression panel.

  MENU_SCORE_Y: 390,
  // Main menu high-score baseline.

  MENU_XP_LABEL_Y: 432,
  // Main menu progression label baseline.

  MENU_XP_BAR_X: 674,
  // Main menu XP bar left edge.

  MENU_XP_BAR_Y: 456,
  // Main menu XP bar top edge.

  MENU_XP_BAR_WIDTH: 228,
  // Main menu XP bar width.

  MENU_XP_BAR_HEIGHT: 16,
  // Main menu XP bar height.

  MENU_BUTTON_X: 380,
  // Main menu button left edge.

  MENU_NEW_RUN_Y: 290,
  // New-run button top edge.

  MENU_CODEX_Y: 352,
  // Codex button top edge.

  MENU_BUTTON_WIDTH: 200,
  // Main menu button width.

  MENU_NEW_RUN_HOTSPOT_X: 650,
  // New Run command hotspot left edge.

  MENU_NEW_RUN_HOTSPOT_Y: 174,
  // New Run command hotspot top edge.

  MENU_NEW_RUN_HOTSPOT_WIDTH: 276,
  // New Run command hotspot width.

  MENU_NEW_RUN_HOTSPOT_HEIGHT: 40,
  // New Run command hotspot height.

  MENU_NEW_RUN_LABEL_X: 650,
  // New Run label left edge.

  MENU_NEW_RUN_LABEL_Y: 174,
  // New Run label top edge.

  MENU_CODEX_HOTSPOT_X: 650,
  // Codex command hotspot left edge.

  MENU_CODEX_HOTSPOT_Y: 286,
  // Codex command hotspot top edge.

  MENU_CODEX_HOTSPOT_WIDTH: 276,
  // Codex command hotspot width.

  MENU_CODEX_HOTSPOT_HEIGHT: 40,
  // Codex command hotspot height.

  MENU_CODEX_LABEL_X: 650,
  // Codex label left edge.

  MENU_CODEX_LABEL_Y: 286,
  // Codex label top edge.

  MENU_HOTSPOT_LABEL_WIDTH: 276,
  // Shared command-label width on image hotspots.

  MENU_HOTSPOT_LABEL_HEIGHT: 40,
  // Shared command-label height on image hotspots.

  MENU_CONTINUE_X: 650,
  // Left edge of Continue Run when a saved run exists.

  MENU_CONTINUE_Y: 230,
  // Top edge of Continue Run below the tower entrance.

  MENU_CONFIRM_PANEL_X: 300,
  // Left edge of the overwrite-run confirmation panel.

  MENU_CONFIRM_PANEL_Y: 178,
  // Top edge of the overwrite-run confirmation panel.

  MENU_CONFIRM_PANEL_WIDTH: 360,
  // Width of the overwrite-run confirmation panel.

  MENU_CONFIRM_PANEL_HEIGHT: 184,
  // Height of the overwrite-run confirmation panel.

  MENU_CONFIRM_TITLE_Y: 220,
  // Confirmation title baseline.

  MENU_CONFIRM_BODY_Y: 258,
  // Confirmation explanation baseline.

  MENU_CONFIRM_BUTTON_Y: 300,
  // Top edge of confirmation actions.

  MENU_CONFIRM_BUTTON_WIDTH: 128,
  // Width of each confirmation action.

  MENU_CONFIRM_BUTTON_GAP: 20,
  // Gap between confirmation actions.

  MENU_SETTINGS_BUTTON_X: 16,
  // Left edge of the compact settings icon.

  MENU_SETTINGS_BUTTON_Y: 482,
  // Top edge of the compact settings icon.

  MENU_SETTINGS_BUTTON_SIZE: 42,
  // Shared width and height of the settings icon.

  SETTINGS_PANEL_X: 270,
  // Left edge of the settings panel.

  SETTINGS_PANEL_Y: 92,
  // Top edge of the settings panel.

  SETTINGS_PANEL_WIDTH: 420,
  // Width of the settings panel.

  SETTINGS_PANEL_HEIGHT: 356,
  // Height of the settings panel.

  SETTINGS_TITLE_Y: 130,
  // Settings heading baseline.

  SETTINGS_LABEL_X: 320,
  // Left-aligned label position inside settings.

  SETTINGS_NAME_Y: 180,
  // Player-name control top edge.

  SETTINGS_CONTROL_X: 420,
  // Left edge of settings value controls.

  SETTINGS_CONTROL_WIDTH: 220,
  // Width of name and slider controls.

  SETTINGS_CONTROL_HEIGHT: 42,
  // Height of the name control.

  SETTINGS_MUSIC_Y: 260,
  // Music slider center line.

  SETTINGS_SOUND_Y: 320,
  // Sound slider center line.

  SETTINGS_SLIDER_HEIGHT: 10,
  // Thickness of settings slider tracks.

  SETTINGS_SLIDER_KNOB_RADIUS: 12,
  // Radius of settings slider handles.

  SETTINGS_CLOSE_X: 370,
  // Left edge of the settings close action.

  SETTINGS_CLOSE_Y: 376,
  // Top edge of the settings close action.

  SETTINGS_CLOSE_WIDTH: 220,
  // Width of the settings close action.

  PLAYER_NAME_MAX_LENGTH: 16,
  // Maximum saved player-name length.

  PREP_BACK_BUTTON_X: 244,
  // Left edge of the prep Back button in the header.

  PREP_BACK_BUTTON_Y: 8,
  // Top edge of the prep Back button in the header.

  PREP_BACK_BUTTON_WIDTH: 92,
  // Width of the prep Back button.

  PREP_BACK_BUTTON_HEIGHT: 34,
  // Height of the prep Back button.

  PREP_INSPECTOR_X: 228,
  // Left edge of the prep dragon inspector.

  PREP_INSPECTOR_Y: 296,
  // Top edge of the prep dragon inspector between staging rows.

  PREP_INSPECTOR_WIDTH: 330,
  // Width of the prep dragon inspector.

  PREP_INSPECTOR_HEIGHT: 72,
  // Height of the prep dragon inspector.

  DRAGON_INSPECTOR_PADDING: 10,
  // Shared inner padding for dragon detail panels.

  DRAGON_INSPECTOR_CONTENT_OFFSET_Y: 16,
  // First text baseline so inspector content sits vertically inside its frame.

  DRAGON_INSPECTOR_LINE_GAP: 17,
  // Vertical spacing between inspector text rows.

  TUTORIAL_PANEL_X: 228,
  // Left edge of the first-run tutorial panel.

  TUTORIAL_PANEL_Y: 298,
  // Top edge of the first-run tutorial panel.

  TUTORIAL_PANEL_WIDTH: 330,
  // Width of the first-run tutorial panel.

  TUTORIAL_PANEL_HEIGHT: 66,
  // Height of the first-run tutorial panel.

  TUTORIAL_TITLE_OFFSET_Y: 18,
  // Tutorial step-label baseline from the panel top.

  TUTORIAL_BODY_OFFSET_Y: 43,
  // Tutorial instruction baseline from the panel top.

  TUTORIAL_HIGHLIGHT_LINE_WIDTH: 4,
  // Border thickness around the current tutorial target.

  TUTORIAL_HIGHLIGHT_FILL: 'rgba(245, 200, 66, 0.08)',
  // Subtle fill over the current tutorial target.

  PREP_MERGE_TOOLTIP_X: 228,
  // Left edge of the Merge hover tooltip.

  PREP_MERGE_TOOLTIP_Y: 330,
  // Top edge of the Merge hover tooltip.

  PREP_MERGE_TOOLTIP_WIDTH: 330,
  // Width of the Merge hover tooltip.

  PREP_MERGE_TOOLTIP_HEIGHT: 36,
  // Height of the Merge hover tooltip.

  CODEX_LEFT_PAGE_X: 100,
  // Codex grid left edge on the left book page.

  CODEX_RIGHT_PAGE_X: 506,
  // Codex grid left edge on the right book page.

  CODEX_COLUMNS_PER_PAGE: 4,
  // Number of dragon columns shown on each open-book page.

  CODEX_START_Y: 96,
  // Codex grid top edge.

  CODEX_CELL_WIDTH: 82,
  // Codex cell width.

  CODEX_CELL_HEIGHT: 100,
  // Codex cell height.

  CODEX_COLUMN_GAP: 8,
  // Horizontal gap between codex columns.

  CODEX_ROW_GAP: 6,
  // Vertical gap between codex rows.

  CODEX_DRAGON_RADIUS: 19,
  // Portrait radius inside an unlocked codex cell.

  CODEX_PORTRAIT_Y_OFFSET: 28,
  // Portrait offset inside a codex cell.

  CODEX_NAME_Y_OFFSET: 66,
  // Name offset inside a codex cell.

  CODEX_TIER_Y_OFFSET: 86,
  // Tier label offset inside a codex cell.

  CODEX_FOOTER_Y: 464,
  // Discovery count baseline.

  CODEX_BOOK_CONTENT_RIGHT: 864,
  // Right edge of the writable parchment area.

  CODEX_BOOK_GUTTER_LEFT: 466,
  // Left edge of the book gutter that codex cells should avoid.

  CODEX_BOOK_GUTTER_RIGHT: 494,
  // Right edge of the book gutter that codex cells should avoid.

  CODEX_BOOK_CONTENT_BOTTOM: 410,
  // Bottom edge of the writable parchment area.

  CODEX_INSPECTOR_X: 250,
  // Left edge of the codex hover inspector.

  CODEX_INSPECTOR_Y: 414,
  // Top edge of the codex hover inspector below the collection grid.

  CODEX_INSPECTOR_WIDTH: 460,
  // Width of the codex hover inspector.

  CODEX_INSPECTOR_HEIGHT: 68,
  // Height of the codex hover inspector.

  CODEX_BACK_Y: 486,
  // Codex back-button top edge.

  BOSS_SCORE_Y: 62,
  // Live boss damage-counter baseline.

  BOSS_NAME_Y: 42,
  // Eternal Wyrm name baseline.

  BOSS_STATUS_Y: 76,
  // Boss power and blast countdown baseline.

  BOSS_HP_BAR_X: 590,
  // Boss HP bar left edge.

  BOSS_HP_BAR_Y: 56,
  // Boss HP bar top edge.

  BOSS_HP_BAR_WIDTH: 220,
  // Boss HP bar width.

  BOSS_HP_BAR_HEIGHT: 12,
  // Boss HP bar height.

  BOSS_RESULT_Y: 228,
  // Final score reveal baseline.

  BOSS_CONTINUE_Y: 278,
  // Boss result continue prompt baseline.

  BOSS_RESULT_PANEL_Y: 112,
  // Boss score-reveal panel top edge.

  BOSS_RESULT_PANEL_HEIGHT: 190,
  // Boss score-reveal panel height.

  BOSS_INTRO_DURATION_MS: 1000,
  // Dramatic pause before the boss montage begins.

  BOSS_INTRO_START_SCALE: 0.68,
  // Initial boss sprite scale during its entrance.

  BOSS_INTRO_TITLE_Y: 104,
  // Eternal Wyrm entrance title baseline.

  BOSS_MONTAGE_START_DELAY_MS: 480,
  // Readable delay between early boss montage events.

  BOSS_MONTAGE_END_DELAY_MS: 150,
  // Fastest delay between late boss montage events.

  BOSS_FLASH_DURATION_MS: 420,
  // White wipe duration between the team defeat and score reveal.

  BOSS_REVEAL_DURATION_MS: 1300,
  // Duration of the final score count-up.

  BOSS_REVEAL_LABEL_Y: 190,
  // Final Score label baseline.

  BOSS_REVEAL_SCORE_Y: 278,
  // Animated final score baseline.

  BOSS_REVEAL_RECORD_Y: 342,
  // New Record notice baseline.

  BOSS_REVEAL_CONTINUE_Y: 430,
  // Continue prompt baseline after score count-up.

  BOSS_REVEAL_OVERLAY_COLOR: 'rgba(10, 14, 35, 0.84)',
  // Arena dimmer behind the score reveal.

  BOSS_FLASH_COLOR: '#ffffff',
  // Full-screen wipe color after the team is defeated.

  BATTLE_SPEED_CONTROL_X: 328,
  // Left edge of the arena playback-speed segmented control.

  BATTLE_SPEED_CONTROL_Y: 12,
  // Top edge of the arena playback-speed segmented control.

  BATTLE_SPEED_BUTTON_WIDTH: 72,
  // Stable width of each playback-speed segment.

  BATTLE_SPEED_BUTTON_HEIGHT: 36,
  // Stable height of each playback-speed segment.

  BATTLE_SPEED_BUTTON_GAP: 6,
  // Horizontal gap between playback-speed segments.

  BATTLE_SPEED_READOUT_Y: 62,
  // AUTO's live multiplier readout below the segmented control.

  RESULT_TITLE_Y: 84,
  // Full results title baseline.

  RESULT_PANEL_X: 240,
  // Left edge of the result readability panel.

  RESULT_PANEL_Y: 34,
  // Top edge of the result readability panel.

  RESULT_PANEL_WIDTH: 480,
  // Width of the result readability panel.

  RESULT_PANEL_HEIGHT: 472,
  // Height of the result readability panel.

  RESULT_LINE_START_Y: 154,
  // First results statistic baseline.

  RESULT_LINE_GAP: 42,
  // Vertical gap between results statistics.

  RESULT_NOTICE_Y: 382,
  // Discovery or unlock notification baseline.

  RESULT_BUTTON_Y_FULL: 430,
  // Full results button row top edge.

  RESULT_BUTTON_WIDTH: 196,
  // Full results button width.

  RESULT_BUTTON_GAP: 20,
  // Gap between full results buttons.

  RESULT_PANEL_INSET: 8,
  // Inner border inset for the run-over panel.

  RESULT_PANEL_LINE_WIDTH: 3,
  // Gold frame thickness around the run-over panel.

  RESULT_ROW_BADGE_X: 292,
  // Horizontal center of result-row badges.

  RESULT_ROW_BADGE_RADIUS: 14,
  // Radius of each result-row badge.

  RESULT_ROW_LABEL_X: 322,
  // Left-aligned statistic label column.

  RESULT_ROW_VALUE_X: 664,
  // Right-aligned statistic value column.

  RESULT_ROW_DIVIDER_LEFT: 280,
  // Left edge of result-row separators.

  RESULT_ROW_DIVIDER_RIGHT: 680,
  // Right edge of result-row separators.

  RESULT_ROW_DIVIDER_OFFSET_Y: 21,
  // Vertical offset from each row baseline to its separator.

  RESULT_ROW_DIVIDER_COLOR: 'rgba(255, 255, 255, 0.18)',
  // Subtle separator color between result statistics.

  FONT_SIZE_RESULT_TITLE: 46,
  // Large title size for the run-over panel.

  RESULT_NOTICE_MAX_WIDTH: 390,
  // Maximum width of the result progression notice.

  // ─── PERSISTENCE ──────────────────────────────────────────────
  // LocalStorage configuration

  SAVE_KEY: 'wyrmpit_save',
  // localStorage key name. Change this to reset all player data.

  SAVE_VERSION: 1,
  // Schema version. If you restructure the save format, bump this to force a reset.

  DEFAULT_SAVE: {
    playerName: 'PLAYER',
    musicVolume: 0.32,
    soundVolume: 0.65,
    totalXP: 0,
    highScore: 0,
    unlockedDragons: ['ember', 'stonescale', 'zephyr', 'tidecaller'],
    codex: {},
    activeRun: null,
    tutorialComplete: false,
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

  LOG_ECONOMY: true,
  // Log economy rewards such as interest gold.

  LOG_MERGE: true,
  // Log merge detections and tier-ups.

  LOG_STATE: true,
  // Log game state transitions (menu → prep → fight → etc).

  LOG_SAVE: true,
  // Log save/load operations.

  LOG_INPUT: false,
  // Log every pointer event (very noisy — enable only for input debugging).

};
