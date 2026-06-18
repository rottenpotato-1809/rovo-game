# Wyrmpit — Technical Design Document (TDD)

> Companion to `gdd.md`. This document covers architecture, conventions, formulas, and configuration. No game-design rationale lives here — see the GDD for "why."

---

## Architecture Overview

Single-page HTML shell (`index.html`) containing one `<canvas>` element. ALL rendering, UI elements, event handlers, and game logic execute inside the Canvas via JavaScript modules. The HTML file is a dumb container — no DOM-based UI, no inline styles, no logic.
index.html              ← bare shell: <canvas> + <script type="module">
src/
config.js             ← single source of truth for ALL tunables
main.js              ← entry point: boots game, starts loop
engine/
loop.js            ← requestAnimationFrame loop, delta time
input.js           ← unified mouse/touch handler, hit-testing
audio.js           ← Web Audio API synth (optional, last priority)
states/
stateManager.js    ← finite state machine, transitions
menuState.js       ← main menu screen
prepState.js       ← shop / team / bench management
fightState.js      ← auto-battle playback
bossState.js       ← boss fight (variant of fightState)
resultState.js     ← end-of-run summary
codexState.js      ← collection viewer
systems/
battle.js          ← combat simulation (pure logic, no rendering)
shop.js            ← shop generation, buy/sell/reroll logic
merge.js           ← merge detection and tier-up logic
economy.js         ← gold calculations
progression.js     ← XP, unlocks, codex registration
enemy.js           ← enemy team generator per round
boss.js            ← Eternal Wyrm behavior
data/
dragons.js         ← dragon definitions (reads from config.js)
ui/
renderer.js        ← canvas draw utilities (circles, bars, text, cards)
animations.js      ← tweens, shakes, floating numbers
assets.js          ← centralized bitmap registry and preload cache
pointer.js         ← shared pointer state for canvas control motion
layout.js          ← screen region coordinates (reads from config.js)
persistence/
save.js            ← localStorage read/write
tests/
battle.test.js     ← combat simulation tests
merge.test.js      ← merge logic tests
economy.test.js    ← gold/xp formula tests
shop.test.js       ← shop generation tests
progression.test.js← unlock threshold tests

---

Milestone 3 runtime owns one shared `game.saveData` object loaded at boot. Results calculate XP, high score, and unlocks once, then persist immediately. A new run copies `saveData.unlockedDragons` into its draft state so rerolls remain deterministic and save-backed.

## Code Conventions

| Rule | Detail |
|------|--------|
| Language | ES Modules (`import`/`export`), no bundler needed for prototype |
| Naming | camelCase for variables/functions, PascalCase for classes/states, UPPER_SNAKE for config keys |
| No magic numbers | Every numeric literal lives in `config.js`. Source files import what they need. |
| Comments | Every function gets a one-line comment explaining WHAT it does (not how). Complex blocks get inline comments aimed at non-coders. |
| Logging | `console.log` with prefixed tags: `[BATTLE]`, `[SHOP]`, `[MERGE]`, `[STATE]`, `[SAVE]`, `[INPUT]`. Logs at: state transitions, ability triggers, merges, purchases, damage events, save/load. |
| Commits | Conventional commits after every completed feature/fix. Format: `feat: add shop reroll` / `fix: dragon targeting ignoring taunt` / `test: add merge tier-up cases`. Only commit if build passes. |
| Build check | Before reporting done: confirm `index.html` loads in browser with zero console errors. If dev server can't run in sandbox, flag it explicitly. |

Bitmap assets preload before the game loop starts. Menu, prep, and fight render dedicated 16:9 backgrounds over the full logical canvas. Dragon IDs map centrally to element sprite files; Tier 1 uses T1 artwork, while Tier 2 and Tier 3 use T2 artwork. The renderer adds Tier 3 aura motion at draw time so no third bitmap set is required. Button hover/press animation reads the shared logical pointer snapshot, keeping every state consistent without duplicating interaction timing.

---

## State Machine
MENU → PREP → FIGHT → (win?) → PREP (next round)
→ (lose?) → RESULT → MENU
(round 10 won?) → BOSS → RESULT → MENU
MENU → CODEX → MENU

Each state exposes: `enter()`, `update(dt)`, `render(ctx)`, `exit()`. StateManager calls these. No state directly references another — transitions go through the manager.

---

## Configuration File (`src/config.js`)

Every tunable constant lives here. Grouped by system. Format:

```js
export const CONFIG = {

  // ─── TEAM & BENCH ────────────────────────────────────────
  TEAM_SIZE: 3,              // dragons on the field per fight
  BENCH_SIZE: 5,             // reserve slots for merge planning
  
  // ─── ECONOMY ─────────────────────────────────────────────
  STARTING_GOLD: 6,          // gold at the start of round 1; enough for two dragons
  GOLD_PER_WIN_BASE: 3,      // flat gold for winning any round
  GOLD_PER_WIN_SCALING: 1,   // multiplied by round number and added to base (round 4 win = 3 + 4×1 = 7)
  DRAGON_BUY_COST: 3,        // cost to purchase any dragon from shop
  SELL_PRICE_T1: 2,          // gold received when selling a Tier 1 dragon
  SELL_PRICE_T2: 4,          // gold received when selling a Tier 2
  SELL_PRICE_T3: 8,          // gold received when selling a Tier 3
  REROLL_COST: 1,            // gold to refresh the shop
  SHOP_SIZE: 3,              // number of dragons offered per shop roll

  // ─── COMBAT ───────────────────────────────────────────────
  MAX_TURNS_PER_ROUND: 50,   // if exceeded, player loses (anti-infinite-loop)
  ABILITY_COOLDOWN: 3,       // turns after ability use before it's ready again
  ABILITY_COOLDOWN_T3: 2,    // T3 dragons get a shorter cooldown
  BASIC_ATK_MULTIPLIER: 1.0, // basic attack = ATK × this value

  // ─── MERGING ──────────────────────────────────────────────
  MERGE_COUNT: 3,            // identical dragons needed to merge up one tier
  MAX_TIER: 3,               // highest evolution tier

  // ─── ROUNDS ───────────────────────────────────────────────
  TOTAL_ROUNDS: 10,          // rounds to survive before boss
  ENEMY_SCALING: [           // per-round enemy composition [T1 count, T2 count, T3 count]
    [1, 0, 0],  // round 1
    [2, 0, 0],  // round 2
    [3, 0, 0],  // round 3
    [2, 1, 0],  // round 4
    [1, 2, 0],  // round 5
    [1, 2, 0],  // round 6
    [0, 3, 0],  // round 7
    [0, 3, 0],  // round 8
    [0, 2, 1],  // round 9
    [0, 1, 2],  // round 10
  ],
  ENEMY_POWER_SCALE: [0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1.0, 1.1, 1.2, 1.3],

  // ─── BOSS ─────────────────────────────────────────────────
  BOSS_HP: 99999,            // effectively invincible
  BOSS_ATK_START: 20,        // boss damage on turn 1
  BOSS_ATK_ESCALATION: 15,   // added to boss ATK each turn
  BOSS_SPEED: 5,             // lowest speed = always acts last

  // ─── PROGRESSION ──────────────────────────────────────────
  XP_PER_ROUND_SURVIVED: 5,  // xp = rounds × this
  XP_BOSS_DAMAGE_DIVISOR: 10, // xp from boss = damage ÷ this
  UNLOCK_THRESHOLDS: [100, 200, 350, 500], // cumulative XP to unlock each locked dragon (in order)

  // ─── DRAGON DEFINITIONS ───────────────────────────────────
  // Each dragon: id, name, role, element, color, tiers[1-3]{hp, atk, spd, abilityName, abilityDesc}
  // (Full dragon table here — too long to repeat; see data/dragons.js which imports and structures these)

  // ─── RENDERING ────────────────────────────────────────────
  CANVAS_WIDTH: 960,         // logical width (CSS scales to viewport)
  CANVAS_HEIGHT: 540,        // logical height
  BG_COLOR: '#1a1a2e',       // main background
  HEADER_COLOR: '#16213e',   // top bar background
  CARD_COLOR: '#1a1a4e',     // shop card fill
  ACCENT_COLOR: '#e94560',   // primary accent (borders, highlights)
  GOLD_COLOR: '#f5c842',     // gold/currency color
  HEALTH_BAR_HEIGHT: 6,      // pixel height of HP bars above dragons
  DRAGON_RADIUS_TEAM: 25,    // circle radius for dragons in team slots
  DRAGON_RADIUS_BENCH: 16,   // circle radius for bench dragons
  DAMAGE_FLOAT_SPEED: 64,    // pixels per second for floating damage numbers
  DAMAGE_FLOAT_DURATION: 520,// milliseconds before damage number fades
  ATTACK_LUNGE_DIST: 36,     // pixels a dragon lunges forward on basic attack
  ATTACK_LUNGE_DURATION: 95, // ms for lunge animation

  // ─── ELEMENT COLORS ───────────────────────────────────────
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

  // ─── LAYOUT REGIONS (y-offsets for screen zones) ──────────
  HEADER_HEIGHT: 50,
  TEAM_ZONE_Y: 90,
  TEAM_SLOT_WIDTH: 100,
  TEAM_SLOT_HEIGHT: 120,
  BENCH_ZONE_Y: 255,
  BENCH_SLOT_WIDTH: 64,
  BENCH_SLOT_HEIGHT: 80,
  SELL_ZONE_Y: 355,
  SHOP_ZONE_Y: 455,
  SHOP_CARD_WIDTH: 110,
  SHOP_CARD_HEIGHT: 140,
  BUTTON_ZONE_Y: 615,
};

Key Formulas (Plain Language)
What : Formula

Gold earned on win : GOLD_PER_WIN_BASE + (current_round × GOLD_PER_WIN_SCALING)

XP earned per run : (rounds_survived × XP_PER_ROUND_SURVIVED) + (boss_damage ÷ XP_BOSS_DAMAGE_DIVISOR) — rounded down

Boss ATK on turn N : BOSS_ATK_START + (N × BOSS_ATK_ESCALATION)

Turn order : All 6 dragons sorted by SPD descending. Ties broken randomly.

Merge condition : Bench + team contains ≥ MERGE_COUNT dragons with same id and same tier
Systems — Guidance Notes
Battle (systems/battle.js)
- Pure function: takes two teams (arrays of dragon objects) → returns a combat log (array of events) + outcome.

- NO rendering in this file. The fight state reads the log and animates it.

- Each event: { turn, actor, action, target, damage, healing, statusApplied }.

- Taunt logic: if any enemy has taunt active, all basic attacks redirect to that enemy. Assassin ABILITIES bypass taunt (not basic attacks).

- Abilities activate on the dragon's first turn and every N turns after (based on cooldown config).

Shop (systems/shop.js)
- Draws from the player's unlocked pool only.

- Weighted random is NOT needed for prototype — pure uniform random from unlocked list.

- Returns an array of dragon IDs. The prep state renders them as cards.

- Buying a dragon sets that shop slot to null. Null shop slots render as sold and cannot be bought again until reroll or next round.

Merge (systems/merge.js)
- Scans bench + team for groups of MERGE_COUNT same-id, same-tier dragons.

- When triggered: consume the extras, upgrade one to next tier, log codex entry if new.

- Can auto-detect merges (highlight when 3 exist) but only execute on player action (button or drag).

Enemy (systems/enemy.js)
- Reads ENEMY_SCALING[roundIndex] to know how many of each tier to generate.

- Early ENEMY_SCALING rows may contain fewer than TEAM_SIZE dragons for onboarding difficulty.

- Applies ENEMY_POWER_SCALE[roundIndex] to generated enemy ATK/HP so early rounds are intentionally weaker than equivalent player dragons.

- Picks from ALL 8 dragon types (including locked ones) — this is the player's preview of what they can unlock.

- Randomly assigns tier upgrades to picked dragons based on the round's tier distribution.

Persistence (persistence/save.js)
- Key: "wyrmpit_save"

- Structure: { totalXP, highScore, unlockedDragons[], codex{} }

- Save after every run ends. Load on game boot.

- If corrupted or missing, reset to defaults silently.

Input Handling (engine/input.js)
- Single unified handler for both mouse and touch.

- On pointer down: run hit-test against current state's interactive regions (returned by each state's getHitZones() method).

- Drag-and-drop: track pointer down → move → up with pointer capture and a visible drag preview. States define valid drag sources and drop targets.

- No keyboard controls needed for prototype.

Rendering (ui/renderer.js)
- Utility functions: drawCircle, drawRect, drawText, drawBar, drawCard.

- All coordinates and sizes pulled from CONFIG layout constants.

- Canvas text is filled over a configurable dark outline for contrast. Fight layout reserves the upper-center result panel and upper-right scrolling log panel above `ARENA_BATTLEFIELD_TOP_Y`. All combat rows sit below that boundary. Player sprites are mirrored toward the center with their name/HP/cooldown column outside on the left; enemy artwork faces left with information outside on the right.

- Main-menu controls use image-aligned rectangular hotspots configured in `config.js`: the tower opens a new run and the ground-dragon group opens the codex. Hover rendering highlights the complete scene region while compact labels remain inside their associated artwork. The title and progression panel occupy dedicated right-side negative space.

- Owned-dragon portraits, names, and stats render directly on one slot background. Team and bench use separate configurable portrait sizes and offsets, while text baselines anchor from the slot bottom. Prep section offsets reserve clearance from the header, and the arena backdrop uses configurable neutral wall, floor, and line colors.

- Dragon artwork applies centralized per-tier scale multipliers: Tier 1 is smaller, while Tier 2 and Tier 3 share the larger adult silhouette. Prep, shop, drag-preview, and codex rendering mirror sprites to face left. The prep bench row uses the lower-left staging floor with taller reserve slots.

- Canvas scales to the largest 16:9 size that fits the viewport via CSS: `width: min(100vw, calc(100vh * 16 / 9)); aspect-ratio: 16/9`.

- Game coordinates stay fixed at CANVAS_WIDTH × CANVAS_HEIGHT, but the backing canvas is resized to displayed CSS pixels times device pixel ratio, capped by CANVAS_MAX_PIXEL_RATIO, to avoid blurry scaled rendering.

Run Health
- Owned dragon HP is round-based. Battle instances start each fight at full tier HP, and winning a fight returns all owned team/bench dragons to full HP for the next prep phase.

- Battle playback is landscape-first and brisk by default; tune TURN_DELAY_MS and animation durations in config.js rather than per-state literals.

- Fight playback reconstructs ability cooldowns from combat events. The upper-right canvas combat log owns a clamped history offset, accepts wheel and pointer-drag input, and formats internal snake_case action names for display. Completed fights only continue from the compact result-panel hit area, leaving log interaction independent.

Animation (ui/animations.js)
- Tween system: array of active tweens, each with { target, property, from, to, duration, elapsed, easing }.

- Updated every frame in the game loop.

- Used for: attack lunges, floating damage numbers, screen shake, fade transitions.

- Easing: linear and ease-out-quad are sufficient.

Testing (src/tests/)
- Framework: plain JS assertions (no external test lib). Run via a test.html that imports test files and logs PASS/FAIL to console.

- Test every system in isolation:

+ battle.test.js — turn order, ability targeting, taunt redirect, cooldowns, max-turn timeout.

+ merge.test.js — 3 same merge, can't merge across tiers, codex registration on first merge.

+ economy.test.js — gold formula per round, sell prices per tier, reroll cost deduction.

+ shop.test.js — only unlocked dragons appear, shop size matches config.

+ progression.test.js — XP formula, unlock thresholds, save/load integrity.

- Tests run before every commit. Commit blocked if any test fails.

Development Workflow (for the coding agent)
1. Start the dev server before any work. A simple npx serve . or Python http.server is fine.

2. After every completed task:

- Run tests (test.html in browser or Node if compatible).

- Verify index.html loads with zero console errors.

- If both pass → git commit with conventional message.

- If either fails → fix first, then commit.

3. If the sandbox cannot run a server/tests, state this explicitly and instruct the user to run locally.

4. Log everything — every state transition, every buy/sell/merge, every ability fired, every damage event should print to console with its tag prefix.

Non-Goals (Technical)
- No bundler, no transpiler, no npm dependencies.

- No WebSocket or backend.

- No sprite sheets; individual bitmap backgrounds and dragon portraits are preloaded through the centralized asset registry.

- No mobile-specific viewport hacks beyond basic CSS scaling.

- No offline service worker.

- No analytics or telemetry.
