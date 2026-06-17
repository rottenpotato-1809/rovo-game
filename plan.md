# Wyrmpit — Build Plan

## Reasoning for the Split

This game has THREE distinct functional layers that each build on the previous:

1. **The Arena** — Can I watch 3 dragons fight 3 dragons and feel something? If the auto-battle isn't satisfying to watch, nothing else matters. This milestone renders the Canvas, plays back a full battle with animations, and proves the visual core. You can "play" it by clicking Fight and watching. No decisions yet — just spectating.

2. **The Draft** — Can I make interesting decisions in the prep phase? This is the ACTUAL game — buying, selling, merging, building a team across 10 rounds. Without this, it's a screensaver. This milestone adds the shop, bench, merge system, gold economy, and round loop. You can now play a full 10-round run with real choices.

3. **The Score** — Does "one more run" feel compelling? The boss fight scoring, codex progression, XP unlocks, and persistent save turn a single run into a replayable loop. This milestone also deploys to GitHub Pages so friends can play via link.

Each milestone ends in something you can physically interact with and judge. No milestone is "polish" — each adds a real gameplay layer.

---

## Milestone 1 — THE ARENA
**"Watch 3 dragons fight 3 dragons and feel it"**

### Scope
Scaffold the full project structure per tdd.md. All files exist, config.js is the single source of truth, Canvas renders at correct aspect ratio. The prep phase is a placeholder (just a FIGHT button that launches a hardcoded 3v3 battle). The battle plays back turn-by-turn on Canvas with: dragon circles colored by element, HP bars, floating damage numbers, attack lunge animations, death fade-outs, and a scrolling combat log. Abilities are visually distinguishable from basic attacks (glow on cast). When the fight ends, a simple "WIN" or "LOSE" text appears.

### End-User Test Checklist
- [ ] Opening `index.html` in browser shows a landscape Canvas at correct 16:9 aspect ratio
- [ ] Clicking "FIGHT" starts a brisk animated 3v3 battle (no manual team selection yet)
- [ ] Each dragon is a colored circle with its emoji, name, and HP bar
- [ ] Fastest dragon visibly acts first each turn
- [ ] Basic attacks show a lunge-forward animation toward the target
- [ ] Abilities show a distinct glow/flash on the caster before the hit
- [ ] Floating damage numbers appear in red, rise upward, and fade out
- [ ] When a dragon dies, it fades out and stops acting
- [ ] Battle ends with "WIN" or "LOSE" displayed on screen
- [ ] Combat log at the bottom scrolls with one line per action
- [ ] Opening DevTools console shows `[BATTLE]` logs with every action
- [ ] Running `test.html` shows all battle.test.js tests passing (0 failures)
- [ ] No hardcoded numbers anywhere except config.js

### Coding Agent Prompt
You are building Milestone 1 of "Wyrmpit" — a 3v3 dragon auto-battler prototype.

- READ THESE FILES FIRST (they are your spec):

- gdd.md (game design)

- tdd.md (technical architecture, conventions, file structure)

- src/config.js (all constants — import from here, ZERO magic numbers)

- src/data/dragons.js (dragon definitions)

- src/systems/battle.js (combat simulation — already complete)

- src/tests/battle.test.js (test suite — must pass)

YOUR TASK — Milestone 1: The Arena
Build the visual foundation. When done, a user can click "FIGHT" and watch a full animated 3v3 auto-battle on Canvas.

WHAT TO BUILD (in order):

1. index.html — bare shell with a single <canvas> element and a <script type="module"> entry point. NO DOM UI. NO logic in HTML.

2. src/main.js — boots the game, initializes Canvas, starts the game loop.

3. src/engine/loop.js — requestAnimationFrame loop with delta time.

4. src/engine/input.js — unified mouse/touch click handler with Canvas hit-testing.

5. src/states/stateManager.js — finite state machine (enter/update/render/exit per state).

6. src/ui/renderer.js — Canvas draw utilities (circles, rects, text, bars, cards).

7. src/ui/layout.js — screen region coordinates (all values from CONFIG).

8. src/ui/animations.js — tween system for lunges, floats, shakes, fades.

9. src/states/fightState.js — THE KEY FILE. Takes a battle log (from simulateBattle) and plays it back visually, one event at a time with TURN_DELAY_MS pacing. Shows: dragon positions, HP bars, attack animations, floating damage numbers, death fades, combat log text.

10. A temporary "start screen" that just shows a FIGHT button. When clicked, generate 2 hardcoded teams (Ember+Stonescale+Zephyr vs Tidecaller+Ember+Stonescale), run simulateBattle(), pass the log to fightState.

CRITICAL RULES (from tdd.md):

- ALL rendering inside Canvas. HTML is a dumb container.

- ALL numbers from config.js. Zero magic numbers.

- Logging with [STATE], [BATTLE] prefixes at all key events.

- Comments for non-coders on every function.

- requestAnimationFrame for animations, not setInterval.

- ES Modules (import/export). No bundler.

- After completing: run test.html, confirm 0 test failures, then git commit with conventional message.

WHEN DONE — tell the user to run through this test checklist:

[ ] index.html loads with landscape Canvas at 16:9 ratio

[ ] Clicking FIGHT starts an animated 3v3 battle

[ ] Each dragon shows: colored circle, emoji, name, HP bar

[ ] Fastest dragon acts first

[ ] Basic attacks → lunge animation

[ ] Abilities → glow/flash on caster

[ ] Floating red damage numbers rise and fade

[ ] Dead dragons fade out

[ ] "WIN" or "LOSE" shows at the end

[ ] Combat log scrolls at the bottom

[ ] Console shows [BATTLE] logs

[ ] test.html passes all tests

[ ] No hardcoded numbers outside config.js

---

## Milestone 2 — THE DRAFT
**"Make interesting decisions that change the fight outcome"**

### Scope
Build the full prep phase: shop (3 dragon cards), buy/sell, reroll, bench (5 slots), team placement (3 slots), merge system (3 identical → tier up), and gold economy. Wire the 10-round game loop — after each fight win, return to prep with new gold. Enemy teams scale per ENEMY_SCALING config. Losing ends the run immediately with a simple results screen showing rounds survived. Merging triggers a visible tier-up animation and logs the new discovery. The game is now PLAYABLE end-to-end for 10 rounds (boss fight comes in M3).

### End-User Test Checklist
- [ ] After clicking NEW RUN, the prep phase screen appears with: round counter, gold display, 3 empty team slots, 5 empty bench slots, and a shop with 3 dragon cards
- [ ] Clicking/tapping a shop card buys it (gold decreases by 3, dragon appears on bench)
- [ ] Cannot buy when gold is insufficient (button/card greys out or does nothing)
- [ ] Dragging (or tap-tap) moves dragons between bench and team slots
- [ ] Dragging to sell zone (or long-press on mobile) sells the dragon for correct gold amount
- [ ] When 3 identical T1 dragons exist (bench+team), a MERGE indicator appears
- [ ] Triggering merge: 3 dragons become 1 T2 dragon with visibly higher stats
- [ ] T2 → T3 merge also works (if you can afford 9 dragons)
- [ ] Clicking REROLL refreshes the shop (costs 1 gold, new dragons appear)
- [ ] FIGHT button only works when at least 1 dragon is in a team slot
- [ ] After winning a fight, prep phase returns with correct gold (3 + round number)
- [ ] Enemy teams get harder each round (T1 early, T2/T3 later)
- [ ] Losing a fight shows results: "Defeated at Round X", rounds survived, XP earned placeholder
- [ ] Playing through rounds 1–10 is possible with good play
- [ ] Shop only offers dragons from the unlocked pool (4 starters)
- [ ] Enemy teams use ALL 8 dragons (including locked ones like Voltfang, Nightshade)
- [ ] Console shows [SHOP], [MERGE], [STATE] logs at appropriate moments
- [ ] All previous battle tests still pass
- [ ] New tests exist for: shop generation, merge logic, economy math

### Coding Agent Prompt
You are building Milestone 2 of "Wyrmpit" — adding the draft/prep phase and full round loop.

READ THESE FILES FIRST:

- gdd.md, tdd.md (your spec)

- src/config.js (all constants)

- src/data/dragons.js (dragon data)

- Everything built in Milestone 1 (states/fightState.js, ui/, engine/)

YOUR TASK — Milestone 2: The Draft
The player can now BUY, SELL, MERGE, and ARRANGE dragons across a 10-round run. This is the core gameplay.

WHAT TO BUILD (in order):

1. src/systems/shop.js — generates a random shop of SHOP_SIZE dragons from the player's unlocked pool. Functions: generateShop(), buyDragon(), sellDragon(), rerollShop().

2. src/systems/merge.js — detects when MERGE_COUNT identical same-tier dragons exist. Functions: checkMergeAvailable(), executeMerge(). Returns the new higher-tier dragon.

3. src/systems/economy.js — tracks gold. Functions: calculateRoundGold(roundNumber), canAfford(cost), spend(amount), earn(amount).

4. src/systems/enemy.js — generates enemy teams per round based on ENEMY_SCALING config. Picks from ALL 8 dragon types at appropriate tiers.

5. src/states/prepState.js — THE KEY FILE. Full prep phase UI rendered on Canvas:

- Header: round number + gold

- Team zone: 3 slots (drag targets)

- Bench zone: 5 slots

- Shop: 3 dragon cards with stats + buy interaction

- Sell zone (trash/sell drop area)

- Reroll button + Fight button

- Merge indicator (glow/badge when 3 identical exist)

- Input: click-to-buy, drag-to-place, drag-to-sell (desktop), tap-tap-to-place (mobile fallback)

6. src/states/resultState.js — simple defeat screen: rounds survived, XP placeholder, PLAY AGAIN button.

7. Update src/states/stateManager.js — full round loop: PREP → FIGHT → (win?) → PREP next round → ... → (lose?) → RESULT.

8. Wire game state to track: current round, current gold, player bench, player team, across round transitions.

9. src/tests/shop.test.js — tests: shop size, only unlocked dragons appear, reroll changes offerings.

10. src/tests/merge.test.js — tests: 3 same = merge, can't merge across tiers, result is next tier.

11. src/tests/economy.test.js — tests: gold formula per round, sell prices per tier, can't go negative.

CRITICAL RULES:

- ALL UI on Canvas. No DOM elements except the container.

- ALL numbers from config.js.

- Dragon cards in shop must show: name, element color, role, ATK/HP/SPD, cost.

- Team slots clearly labeled. Empty slots show dashed border.

- Merge detection runs automatically after every buy/move. Highlight mergeable dragons.

- Merge only executes on explicit player action (merge button or drag).

- Surviving player dragons CARRY OVER between rounds (with current HP — they don't heal automatically).

- Log [SHOP] on buy/sell/reroll, [MERGE] on merge, [STATE] on round transitions.

- After completing: run ALL test files (battle, shop, merge, economy). Confirm 0 failures. Git commit.

WHEN DONE — tell the user to run through this test checklist:

[ ] Prep screen shows round counter, gold, team slots, bench, shop, buttons

[ ] Can buy dragons from shop (gold decreases)

[ ] Can't buy with insufficient gold

[ ] Can move dragons between bench and team

[ ] Can sell dragons for correct gold

[ ] 3 identical dragons trigger merge indicator

[ ] Merge creates a T2 dragon with upgraded stats/ability

[ ] Reroll costs 1 gold and refreshes shop

[ ] FIGHT requires at least 1 dragon on team

[ ] Winning advances to next round with correct gold reward

[ ] Enemies get harder each round

[ ] Losing shows defeat screen with rounds survived

[ ] Can play through all 10 rounds with good drafting

[ ] Shop only shows unlocked dragons; enemies use all 8

[ ] Console logs [SHOP], [MERGE], [STATE] events

[ ] All tests pass (battle + shop + merge + economy)

---

## Milestone 3 — THE SCORE
**"One more run — because this time I'll beat my high score"**

### Scope
Add the boss fight (Eternal Wyrm — invincible, escalating damage, score = total damage dealt), codex system (persistent collection of discovered dragons), XP progression (unlocks 4 new dragons at thresholds), localStorage save/load, main menu with high score display, and GitHub Pages deployment. The game is now a complete loop: menu → run → score → unlock → menu → harder run → higher score.

### End-User Test Checklist
- [ ] Main menu shows: title "WYRMPIT", high score, XP progress bar, NEW RUN button, CODEX button
- [ ] After winning round 10, boss fight starts automatically — NOT a prep phase
- [ ] Boss is visually large and distinct (bigger circle, ominous color)
- [ ] Boss hits ALL player dragons every turn (damage numbers on all 3)
- [ ] Boss damage visibly increases each turn (numbers get bigger)
- [ ] Running damage counter shows total damage dealt, updating in real time
- [ ] When all player dragons die, boss fight ends with dramatic score reveal
- [ ] Results screen shows: rounds survived (10), boss damage score, XP earned, high score update
- [ ] XP formula works: (rounds × 5) + (boss_damage ÷ 10)
- [ ] Losing before round 10 still earns XP (rounds × 5, no boss bonus)
- [ ] After earning 100+ total XP, Voltfang appears in the shop on next run
- [ ] Codex screen shows 8×3 grid: unlocked dragons colored, locked ones as "???" silhouettes
- [ ] First time merging a T2 dragon shows "NEW DISCOVERY" text on results screen
- [ ] Closing and reopening the browser preserves: high score, total XP, unlocks, codex entries
- [ ] Clearing localStorage resets everything to default (4 starters, 0 XP)
- [ ] Game is deployed and playable via a GitHub Pages URL
- [ ] All tests pass (battle + shop + merge + economy + progression)

### Coding Agent Prompt
You are building Milestone 3 of "Wyrmpit" — the boss fight, progression, and deployment.

READ THESE FILES FIRST:

- gdd.md, tdd.md (your spec)

- src/config.js (all constants — BOSS_HP, BOSS_ATK_START, BOSS_ATK_ESCALATION, UNLOCK_THRESHOLDS, XP formulas)

- src/systems/battle.js — already has simulateBossFight() implemented

- Everything from Milestones 1 & 2

YOUR TASK — Milestone 3: The Score
Add the endgame scoring loop, persistent progression, and deploy.

WHAT TO BUILD (in order):

1. src/states/bossState.js — Boss fight screen. Uses simulateBossFight() from battle.js, plays back the log visually. Boss rendered as a LARGE circle (BOSS_RADIUS from config) with dark purple color. Key UI: real-time DAMAGE COUNTER (large font, top center), boss HP bar (barely moves — sells the "invincible" feel), escalating hit numbers on player dragons. Dramatic ending: screen shakes, "YOUR SCORE: X" fades in large.

2. src/systems/progression.js — XP calculation, unlock checks, codex registration. Functions: calculateXP(roundsSurvived, bossDamage), checkUnlocks(totalXP), registerCodexEntry(dragonId, tier), getNextUnlockInfo().

3. src/persistence/save.js — localStorage save/load using SAVE_KEY from config. Functions: save(data), load(), reset(). Schema matches DEFAULT_SAVE in config. Handles corruption gracefully (resets to default).

4. src/states/menuState.js — Main menu rendered on Canvas: title "WYRMPIT" (large), high score display, XP progress bar showing progress toward next unlock, NEW RUN button, CODEX button.

5. src/states/codexState.js — Codex grid: 8 columns × 3 rows. Unlocked entries show colored circle + emoji + name + tier stars. Locked entries show dark silhouette + "???". Footer: "Discovered X / 24". Back button returns to menu.

6. Update src/states/resultState.js — Full results: rounds survived, boss damage (or "Did not reach boss"), XP earned this run, total XP, high score (with "NEW!" badge if beaten), new codex discoveries listed. Buttons: PLAY AGAIN, MAIN MENU.

7. Update game flow: MENU → PREP loop → (round 10 win) → BOSS → RESULT → MENU. Losing early: PREP → FIGHT → RESULT → MENU.

8. Update src/systems/shop.js — shop now pulls from save data's unlockedDragons (not hardcoded 4).

9. src/tests/progression.test.js — tests: XP formula, unlock thresholds, codex registration, save/load integrity, corruption recovery.

10. Deploy: add instructions or script for GitHub Pages (just push the repo — index.html at root works).

CRITICAL RULES:

- Boss fight must feel EPIC. Large boss, big numbers, screen shake on hits, dramatic score reveal.

- Damage counter updates in real time during boss playback (not just at the end).

- XP and codex save IMMEDIATELY after results screen (not on menu return).

- Unlocking a new dragon: show a brief "UNLOCKED: [name]" notification on results screen.

- Codex entries register on first merge/use — NOT just on seeing enemies use them.

- Save after every run. Load on game boot. If save is corrupted, reset silently.

- All numbers from config.js. Log [SAVE] on save/load operations.

- After completing: run ALL test files. Confirm 0 failures. Git commit. Deploy.

WHEN DONE — tell the user to run through this test checklist:

[ ] Main menu shows title, high score, XP bar, NEW RUN and CODEX buttons

[ ] Winning round 10 transitions to boss fight (not prep)

[ ] Boss is large and visually distinct

[ ] Boss hits all player dragons every turn

[ ] Boss damage escalates each turn

[ ] Damage counter updates in real time during boss fight

[ ] Boss fight ends when player team dies → score reveal

[ ] Results screen shows all stats + XP earned

[ ] XP formula correct: (rounds × 5) + (boss_damage ÷ 10)

[ ] Losing early still earns XP

[ ] After 100+ XP total, Voltfang appears in shop

[ ] Codex shows unlocked/locked dragons correctly

[ ] First T2 merge shows "NEW DISCOVERY" on results

[ ] Progress persists after browser refresh

[ ] localStorage clear resets everything

[ ] Game is live on GitHub Pages

[ ] All tests pass

---

## Summary

| # | Milestone | Proves |
|---|-----------|--------|
| 1 | THE ARENA | "Is it fun to watch?" |
| 2 | THE DRAFT | "Is it fun to decide?" |
| 3 | THE SCORE | "Is it fun to replay?" |

If the answer to #1 is "no," stop and redesign the visual feedback. If #2 is "no," the economy needs rebalancing. If #3 is "no," the unlock pacing is off. Each milestone is a checkpoint where you can pivot before investing more time.
