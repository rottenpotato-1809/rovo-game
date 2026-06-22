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
music.js           ← phase soundtrack routing and browser playback unlock
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

The game loop starts in `LoadingState`, which renders dedicated loading artwork and receives normalized progress from the centralized bitmap preloader. The preloader resolves the loading background and shared title first, then fetches the remaining runtime images in parallel. After every registered image and the minimum presentation time complete, LoadingState exposes a canvas confirmation button; only that gesture enters Menu and unlocks browser audio. Menu, prep, and fight render dedicated 16:9 backgrounds over the full logical canvas, and loading/menu share one transparent title bitmap. Dragon IDs map centrally to element sprite files; Tier 1 uses T1 artwork, while Tier 2 and Tier 3 use enlarged T2 artwork. The renderer adds Tier 3 aura motion at draw time so no third bitmap set is required. Button hover/press animation reads the shared logical pointer snapshot, including the compact menu command buttons, without highlighting their larger illustrated hotspots.

`BossState` owns an explicit intro -> montage -> flash -> reveal -> complete cinematic state machine. The montage derives event delay from normalized playback progress so tempo accelerates deterministically, while the reveal counts to the simulated score before accepting input. `ResultState` remains the only owner of XP/high-score persistence and suppresses its optional notice when progression has no remaining dragon unlock.

---

## State Machine
LOADING → MENU → PREP → FIGHT → (win?) → PREP (next round)
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
  GOLD_PER_WIN_BASE: 4,      // flat gold for winning any round
  GOLD_PER_WIN_SCALING: 1,   // multiplied by round number and added to base (round 4 win = 4 + 4×1 = 8)
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
  ENEMY_POWER_SCALE: [0.40, 0.44, 0.50, 0.59, 0.65, 0.70, 0.68, 0.73, 0.56, 0.61],

  // ─── BOSS ─────────────────────────────────────────────────
  BOSS_HP: 99999,            // effectively invincible
  BOSS_ATK_START: 20,        // boss damage on turn 1
  BOSS_ATK_ESCALATION: 15,   // added to stored boss power each turn
  BOSS_ATTACK_INTERVAL_TURNS: 3, // release one team-wide blast after charging
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

Boss power on turn N : BOSS_ATK_START + (N × BOSS_ATK_ESCALATION); apply it as AoE when N is divisible by BOSS_ATTACK_INTERVAL_TURNS

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
- Excludes any dragon family currently owned at `MAX_TIER`; rerolls and automatic round refreshes both derive this exclusion from Team + Bench. If all unlocked families are maxed, the shop returns null slots.

- Weighted random is NOT needed for prototype — pure uniform random from unlocked list.

- Returns an array of dragon IDs. The prep state renders them as cards.

- Buying a dragon sets that shop slot to null. Null shop slots render as sold and cannot be bought again until reroll or next round.

- Purchases fill the first empty Team slot before Bench. Merge removal happens first, then the upgraded dragon fills the first empty Team slot; it remains on Bench only if Team is full.

Merge (systems/merge.js)
- Scans bench + team for groups of MERGE_COUNT same-id, same-tier dragons.

- When triggered: consume the extras, upgrade one to next tier, log codex entry if new.

- Can auto-detect merges (highlight when 3 exist) but only execute on player action (button or drag).

Enemy (systems/enemy.js)
- Reads ENEMY_SCALING[roundIndex] to know how many of each tier to generate.

- Early ENEMY_SCALING rows may contain fewer than TEAM_SIZE dragons for onboarding difficulty.

- Applies ENEMY_POWER_SCALE[roundIndex] to generated enemy ATK/HP so early rounds are intentionally weaker than equivalent player dragons.

- Tier transitions use lower raw multipliers to offset the tier's doubled base stats. `scripts/balance-sim.mjs` runs a seeded duplicate-focused draft policy and reports conditional loss rates. The target funnel is 58-64% boss reach, 2-4.5% aggregate losses in Rounds 1-6, 4-8% aggregate losses in Rounds 7-8, 8-13% on Round 9, and 22-28% on Round 10.

- Picks from ALL 8 dragon types (including locked ones) — this is the player's preview of what they can unlock.

- Randomly assigns tier upgrades to picked dragons based on the round's tier distribution.

Persistence (persistence/save.js)
- Key: "wyrmpit_save"

- Structure: { playerName, musicVolume, soundVolume, totalXP, highScore, unlockedDragons[], codex{}, activeRun, tutorialComplete }

- Optional settings fields normalize to defaults so existing version-1 saves migrate without losing progression. Music volume is applied live to every soundtrack; sound volume is retained for effects playback.

- Save progression after every run ends. Save an active prep checkpoint after every successful draft mutation, tutorial step, round win, and Prep Back action.

- `activeRun` stores the complete serializable draft state and is cleared when the result screen is reached. Browser refresh resumes this checkpoint through the menu Continue Run action.

- `tutorialComplete` permanently suppresses onboarding after its first successful Buy -> Place -> Fight sequence; the current tutorial step remains part of `activeRun`.

- If corrupted or missing, reset to defaults silently.

Input Handling (engine/input.js)
- Single unified handler for both mouse and touch.

- On pointer down: run hit-test against current state's interactive regions (returned by each state's getHitZones() method).

- Drag-and-drop: track pointer down → move → up with pointer capture and a visible drag preview. States define valid drag sources and drop targets.

- No keyboard controls needed for prototype.

Rendering (ui/renderer.js)
- Utility functions: drawCircle, drawRect, drawText, drawBar, drawCard.

- All coordinates and sizes pulled from CONFIG layout constants.

- Prep layout uses separate left staging and right commerce columns: tall team cards, compact bench cards, tall shop cards, stacked utility commands, and an independently sized Fight CTA.
- `run.round === TOTAL_ROUNDS + 1` represents the final Boss Prep checkpoint. It renders `BOSS PREP` / `FIGHT BOSS`; pressing the CTA transitions directly to `bossState`, while refresh and Continue restore the saved prep state.

- Result rendering consumes structured summary rows so badges, labels, values, and dividers stay aligned independently of progression values.

- Canvas text is filled over a configurable dark outline for contrast. Fight layout reserves the upper-center result panel and upper-right scrolling log panel above `ARENA_BATTLEFIELD_TOP_Y`. All combat rows sit below that boundary. Player sprites are mirrored toward the center with their name/HP/cooldown column outside on the left; enemy artwork faces left with information outside on the right.

- Main-menu controls use image-aligned rectangular hotspots configured in `config.js`: the tower opens a new run and the ground-dragon group opens the codex. Compact labels remain static inside their artwork without hover tint or glow. The title and progression panel occupy dedicated right-side negative space.

- The codex uses its own full-screen open-book bitmap. Its 8-by-3 grid is constrained to configurable parchment bounds, while the artwork supplies the screen title and the canvas only renders collection cells, discovery progress, and Back.

- Prep and Codex share `drawDragonInspector`, which renders vertically centered tier stats and ability details in a border derived from the dragon's element color. Prep also renders centralized tutorial highlights and a Merge hover tooltip.

- Owned-dragon portraits, names, and stats render directly on one slot background. Team and bench use separate configurable portrait sizes and offsets, while text baselines anchor from the slot bottom. Prep section offsets reserve clearance from the header, and the arena backdrop uses configurable neutral wall, floor, and line colors.

- Dragon artwork applies centralized per-tier scale multipliers: Tier 1 is smaller, while Tier 2 and Tier 3 share the larger adult silhouette. Prep, shop, drag-preview, and codex rendering mirror sprites to face left. The prep bench row uses the lower-left staging floor with taller reserve slots.

- Canvas scales to the largest 16:9 size that fits the viewport via CSS: `width: min(100vw, calc(100vh * 16 / 9)); aspect-ratio: 16/9`.

- Game coordinates stay fixed at CANVAS_WIDTH × CANVAS_HEIGHT, but the backing canvas is resized to displayed CSS pixels times device pixel ratio, capped by CANVAS_MAX_PIXEL_RATIO, to avoid blurry scaled rendering.

- `ui/fullscreen.js` owns the mobile fullscreen control and vendor-prefixed feature detection. The 16:9 shell uses dynamic viewport height and requests landscape orientation after a user tap when supported.

- Menu conditionally renders Continue Run when `game.run` is present. New Run opens a two-action confirmation overlay before replacing that run, while Prep Back persists and returns to Menu.

Run Health
- Owned dragon HP is round-based. Battle instances start each fight at full tier HP, and winning a fight returns all owned team/bench dragons to full HP for the next prep phase.

- Battle playback is landscape-first and readable at 1x. `systems/playbackSpeed.js` owns AUTO acceleration and fixed modes; `TURN_DELAY_MS` is the 1x event interval, AUTO ramps from 1x to a 2.5x cap, and FightState renders AUTO/1x/2x/3x as a segmented control.

- Fight playback reconstructs ability cooldowns from combat events. The upper-right canvas combat log owns a clamped history offset, accepts wheel and pointer-drag input, and formats internal snake_case action names for display. Pointer-down inside the log is consumed before completed-fight continuation, so hold-drag remains available after the match; presses outside the log continue.

- `systems/music.js` owns looping phase music. StateManager reports transitions to MusicManager; playback is deferred until the first canvas pointer gesture to satisfy browser autoplay policy. Tracks preload metadata rather than full audio payloads, use centralized `MUSIC_VOLUME`, and the local static server serves `.ogg` as `audio/ogg`.

Animation (ui/animations.js)
- Tween system: array of active tweens, each with { target, property, from, to, duration, elapsed, easing }.

- Updated every frame in the game loop.

- Used for: attack lunges, floating damage numbers, screen shake, fade transitions.

- Runtime art uses WebP backgrounds and sprites to reduce download size without changing canvas dimensions. Boss rendering preloads `sprites/boss.webp`; its pulse amplitude follows the current blast charge while `boss_buff` events update the visible power/countdown.

- Easing: linear and ease-out-quad are sufficient.

Testing (src/tests/)
- Framework: plain JS assertions (no external test lib). Run via a test.html that imports test files and logs PASS/FAIL to console.

- Test every system in isolation:

+ battle.test.js — turn order, ability targeting, taunt redirect, cooldowns, max-turn timeout.

+ merge.test.js — 3 same merge, can't merge across tiers, codex registration on first merge.

+ economy.test.js — gold formula per round, sell prices per tier, reroll cost deduction.

+ shop.test.js — only unlocked dragons appear, shop size matches config.

+ progression.test.js — XP formula, unlock thresholds, save/load integrity.

+ campaignBalance.test.js — seeded boss-reach target, early-run safety, and final-round difficulty ordering.

- Tests run before every commit. Commit blocked if any test fails.

Development Workflow (for the coding agent)
1. Start the dependency-free concurrent dev server with `node scripts/dev-server.mjs 5176` before browser work.

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

- Asset preloading is non-blocking. The state machine and render loop start immediately with renderer fallbacks, then automatically show bitmap assets as each cached image becomes available.
- Missing phase bitmaps leave the configured dark clear color visible; they never draw the legacy neutral arena fallback, preventing a gray first-load flash.

- No mobile-specific viewport hacks beyond basic CSS scaling.

- No offline service worker.

- No analytics or telemetry.
