# Wyrmpit — Prototype GDD

## Pitch

A casual 3v3 auto-battler where you draft dragons from a shop, merge duplicates to evolve them, and survive 10 rounds of escalating fights. Beat all 10? You face an invincible boss — your score is how much damage you deal before your team dies. Collect every dragon evolution in your permanent codex. One more run. Always one more run.

---

## Design Pillars

1. **Watch & Cheer** — Battles play out automatically. The fun is in the anticipation: "Did I build the right team?" not "Can I execute the right combo?"
2. **Draft & Discover** — Every shop roll is a decision. Merge 3 of the same to discover a new evolution. The codex rewards curiosity, not grinding.
3. **Score Chase** — The boss can't die. You can only delay the inevitable. The leaderboard question is always: "How much can I squeeze out before the wipe?"

---

## Visual Identity

**Chibi Dark Fantasy Tavern:** deep warm-dark backgrounds, vivid element-colored dragons, gold-accented stone UI, and subtle tavern/arena atmosphere. Buttons use dark stone fills with gold borders, evolved dragons gain element-colored glow, and combat feedback favors readable outlined text over clutter.

---

## Core Mechanic

**Merge-to-evolve auto-combat.** Players buy dragons from a randomized shop, place 3 on the field, and watch them fight an AI team. Combining 3 identical dragons creates a stronger evolved form. Evolved forms are permanently logged in a codex.

---

## Core Loop

BUY dragons → PLACE your best 3 → WATCH them fight → WIN to advance → REPEAT
                                                       ↓ (after round 10)
                                                   BOSS FIGHT → SCORE → RESTART

Between runs: XP accumulates → unlocks new dragons in the shop pool → more team options → higher scores.

---

## Rules

### Dragons
- Each dragon has a **role** (DPS, Tank, Assassin, or Support), an **element**, and one **ability**.
- Abilities fire automatically during combat when ready.
- Every dragon uses bespoke Tier 1 and Tier 2 character artwork. Tier 3 keeps its Tier 2 form and is distinguished by an animated golden aura and orbiting evolution motes.
- Tier 1 baby artwork renders substantially smaller than the Tier 2/Tier 3 adult silhouette so evolution is immediately readable even when source art has different transparent padding.

### Team
- Exactly **3 dragons** fight per round. No more, no fewer.
- A **bench** holds up to **5** reserve dragons (for merge planning).
- If the player has fewer than 3 dragons, empty slots fight with nothing (disadvantage).
- Dragon HP is round-based: every owned dragon starts each new round at full health, even if it died in the previous winning fight.

### Shop & Economy
- The shop displays **4 random dragons** each round from the player's unlocked pool. A dragon family is removed from the roll pool while the player owns its Tier 3 evolution; if every unlocked family is maxed, unavailable shop slots remain empty.
- All dragons cost **3 gold** to buy.
- Buying a shop dragon consumes that shop slot until the next reroll or round refresh. New purchases auto-equip into the first empty Team slot; Bench is used only when all 3 Team slots are full.
- Selling returns **2 gold** (Tier 1), **4 gold** (Tier 2), or **8 gold** (Tier 3).
- Rerolling the shop costs **1 gold** and can be done unlimited times.
- Starting gold: **6** so round 1 can field two dragons. At the start of each prep phase, before the shop is shown, saved gold earns interest: **+1 gold per 5 gold held**, capped at **+3 gold**. Gold earned per round won: **4 + current round number** (e.g., winning round 4 gives 8 gold).

### Merging
- Place 3 identical dragons together → they fuse into 1 dragon of the next tier.
- A newly merged dragon occupies the first available Team slot, falling back to Bench only when the active team is full.
- Tier 1 → Tier 2 → Tier 3. No tier beyond 3.
- Merged dragons gain new stats and an upgraded ability.
- First time a player creates a Tier 2 or Tier 3 dragon, it registers in the codex.

### Combat
- Turn-based. All 6 dragons (3v3) are sorted by Speed each turn. Fastest acts first.
- On their turn, a dragon uses its **ability** if ready, otherwise performs a **basic attack** (100% ATK to one target).
- Abilities go on a **3-turn cooldown** after use (Tier 3 dragons: 2-turn cooldown).
- Default basic attack target: enemy with highest ATK.
- If a Taunt is active, all basic attacks must hit the taunter (assassin abilities ignore taunt).
- A round ends when all 3 dragons on one side are dead.
- Maximum **50 turns** per round. If exceeded, the player loses that round.

### Enemies
- Enemy teams are pre-generated per round from ALL 8 dragon types (including ones the player hasn't unlocked).
- Difficulty escalates by team size, tier, and power scale. Rounds 1-6 are build-up fights, rounds 7-9 validate the developing composition, and round 10 is the strongest pre-boss exam. Enemy tier upgrades use compensating power scales so a new tier is a controlled step rather than a doubled-stat wall.
- Balance is measured across three draft profiles with `src/tests/balance.js`: **Random** buys left-to-right, never rerolls, and keeps purchase order; target boss reach **15-20%** with most deaths around rounds 5-6. **Competent** prioritizes duplicates, rerolls lightly when close to a merge, and builds around damage plus Tank/Support; target boss reach **50-60%** with most deaths around rounds 7-8. **Perfect** optimizes merge paths, rerolls aggressively, sells dead ends, and fields ideal comps; target boss reach **80-90%**.

### Boss Fight (Eternal Wyrm)
- Only reached by winning all 10 rounds.
- The Wyrm has **99,999 HP** (functionally invincible).
- Its crystal core visibly gathers power every turn. Every **3 turns**, it releases an escalating attack against all living player dragons.
- It always acts last each turn (lowest speed).
- Fight ends when all player dragons die. Total damage dealt to the Wyrm = the player's **SCORE**.

### Win / Lose
- **Win condition (run):** Survive all 10 rounds to reach the boss.
- Winning Round 10 opens one final **Boss Prep** phase. The player may spend the last reward, reroll, merge, sell, and rearrange the team before choosing **Fight Boss**.
- **Lose condition (run):** All 3 dragons die during any round (run ends immediately).
- **Score:** Only generated if the player reaches the boss. Score = damage dealt to Eternal Wyrm.
- **XP earned:** Rounds survived × 5, plus boss damage ÷ 10 (if reached). Earned on every run, win or lose.
- XP unlocks new Tier 1 dragons at fixed thresholds (100 / 200 / 350 / 500 XP).

### Codex
- A permanent collection log saved between runs.
- 8 dragons × 3 tiers = **24 entries** total.
- An entry unlocks when the player **personally fields or merges** that dragon at that tier.
- Locked entries appear as silhouettes (players see the shape but not the details).
- Hovering an unlocked entry shows its tier stats, ability name, and ability description.

---

## Controls

### Desktop
- **Click** a shop dragon to buy it (goes to bench).
- **Drag** dragons between bench and team slots to arrange.
- **Drag** a dragon to the sell zone (or right-click → sell) to sell.
- **Click "Reroll"** to refresh the shop.
- **Click "Fight"** to start the round.
- **Hover** an owned or shop dragon to inspect its stats and ability.
- Inspector content sits within one element-colored frame matching the hovered dragon's card.
- During battle, use AUTO / 1x / 2x / 3x to control playback. AUTO begins at 1x and gradually accelerates to a 2.5x cap.
- The battle log supports wheel and hold-drag scrolling after the match. Gestures beginning inside the log do not continue; click elsewhere to advance.

### Mobile
- **Tap** a shop dragon to buy.
- **Tap** a bench dragon, then **tap** a team slot to place (or swap).
- **Long-press** a dragon to sell (confirmation prompt).
- **Tap "Reroll"** / **Tap "Fight"** buttons.
- During battle, tap AUTO / 1x / 2x / 3x to control playback. Hold-drag the battle log after the match, or tap outside it to continue.
- A compact fullscreen control requests landscape fullscreen so browser chrome does not crop the 16:9 game canvas.

### Audio
- Phase music loops after the player's first browser gesture: `Dragon-Menu-Drift` for Menu/Codex, `Ember-Draft` for Prep, `Dragon-Clash` for normal battles, and `Dragon-Ascension` for Boss/Results.
- The main-menu Settings panel saves the player name plus independent Music and Sound volume levels. Music changes apply immediately; Sound controls opt-in synthesized effects for buying, selling, merging, hits, abilities, deaths, boss entrance, and run outcomes.

---

## UI Layout

### Prep Phase Screen (top → bottom)
- **Header bar:** Round number in a framed panel on the left, Gold count in a matching panel on the right.
- **Team zone:** 3 tall, visually dominant slots across the upper-left under a framed "YOUR TEAM" heading.
- **Bench zone:** 5 shorter reserve slots across the lower-left under a framed "BENCH" heading.
- The bench occupies the lower-left staging floor instead of crowding the active team row. Prep and codex portraits consistently face left.
- **Shop zone:** 4 compact dragon cards side by side in the upper-right, with portrait, identity, stats, and price arranged vertically.
- **Command zone:** Sell, Merge, and Reroll stack below the shop while Fight is a larger standalone call to action.
- **Sell zone:** Visible drop target (trash icon or "SELL" label) beside the bench.
- The Sell zone includes a drag instruction and changes to the held dragon's exact sell value while dragging.
- Hovering Merge explains that three matching dragons must be bought or owned to merge.
- A Back button saves the current prep checkpoint and returns to the main menu.
- First-time players receive a three-step tutorial that highlights buying a dragon, dragging it into a team slot, and pressing Fight.

### Fight Phase Screen
- **Landscape arena:** combat uses a 16:9 battlefield view instead of the earlier mobile portrait layout.
- The arena uses the dedicated full-screen fight background, while menu and prep each use their own full-screen illustrated scene.
- **Brown floor:** all 6 combatants stand entirely on the lower arena floor in two compact columns.
- **Facing:** player dragons are mirrored to face right; enemy dragons face left.
- **Outer information:** player names, HP, and cooldowns sit left of player artwork; enemy information sits right of enemy artwork.
- **Center:** The two teams stand in close opposing columns without a separate VS label. Floating damage/heal numbers animate on hit.
- **Upper-right panel:** scrolling combat log, separated from the battlefield.
- Each combatant shows whether its special ability is ready or how many actions remain on cooldown. The combat log supports wheel and touch-drag history scrolling, and action labels are displayed as readable words.
- **After battle ends:** A large WIN/LOSE label occupies one compact centered upper panel without redundant instruction copy. The log remains draggable; clicking outside it advances.
- **Pacing:** playback starts at readable 1x speed. AUTO gradually accelerates to a 2.5x cap, while fixed 1x, 2x, and 3x modes remain selectable.
- Combatants lunge, recoil, flash on impact, pulse when casting abilities, and fade on defeat. Buttons scale and glow on hover and compress while pressed.

### Boss Fight Screen
- Same as fight phase, but enemies replaced by one large Wyrm sprite center-right.
- **Prominent damage counter** top-center: "DAMAGE: X" updating in real time.
- The boss enters with a one-second dramatic reveal, followed by an accelerating damage montage where the score climbs and player dragons fall one by one. A full-screen flash bridges into a counting Final Score reveal, with `NEW RECORD!` when applicable. Clicking after the count-up opens the normal Run Complete summary.

### Results Screen
- A large gold-framed central panel over the island background shows Rounds Survived, Boss Damage (or Not Reached), XP Earned, Total XP, and High Score as separate label/value rows with badges and dividers.
- Any new codex discoveries listed with fanfare text.
- Progression notices are omitted once every dragon family is unlocked, leaving the completed summary uncluttered.
- Two equally weighted bottom buttons: "PLAY AGAIN" / "MAIN MENU."

### Codex Screen
- Uses the dedicated illustrated open-book background; its built-in CODEX heading replaces the former canvas title.
- Grid: 8 columns (one per dragon) × 3 rows (T1, T2, T3).
- Unlocked cells show colored icon + name. Locked cells show dark silhouette + "???".
- Footer: "Discovered: X / 24."

### Main Menu
- The dedicated Wyrmpit logo artwork occupies the open upper-right sky without covering the illustrated landmarks.
- High Score and the XP progress bar share a compact lower-right panel over the sea.
- The tower is the full New Run interaction region; only its entrance button animates on hover/press, without tinting the tower artwork.
- The ground-dragon group is the full Codex interaction region; only its compact button animates, without highlighting the whole scene.
- Continue Run appears only while a saved run is active and resumes its latest prep checkpoint.
- Starting New Run while a run is active requires confirmation before replacing it.
- A compact gear icon opens Settings for player-name editing and Music/Sound sliders. On mobile, the separate fullscreen icon remains available above the canvas.

### Loading Screen
- First boot shows dedicated full-screen loading artwork, the Wyrmpit logo, and live image-preload progress. At 100%, a `Click to Continue` button waits for an intentional gesture before opening the menu and audio.

---

## UX Flow
MAIN MENU → [New Run] → PREP PHASE (round 1) → [Fight] → FIGHT PHASE → [Continue] → PREP PHASE (round 2) → ... repeat until lose or clear round 10 ...
→ IF LOSE → RESULTS SCREEN → [Play Again] or [Main Menu]
→ IF WIN ROUND 10 → BOSS FIGHT → team dies → RESULTS SCREEN
MAIN MENU → [Codex] → CODEX SCREEN → [Back] → MAIN MENU
PREP PHASE → [Back] → MAIN MENU → [Continue Run] → PREP PHASE

---

## In-Scope (Vertical Slice)

- 4 playable dragons (unlocked from start) with 3 tiers each.
- 4 additional dragons visible on enemy teams and unlockable via XP.
- Full 10-round run + boss fight.
- Working shop, merge, bench, and team placement.
- Codex with persistent save (local).
- XP progression with 4 unlock thresholds.
- Score tracking (high score saved locally).
- Basic visual feedback: HP bars, damage numbers, attack animations.
- Cohesive art-direction pass: dark tavern palette, stone/gold buttons, tier glow scaling, styled damage numbers, prep dust motes, fight embers, boss fog, and opt-in SFX.
- Arena labels use high-contrast outlined text, with dragon names and HP placed beside portraits so combat rows never overlap.
- The arena uses a subdued neutral stone-and-moss backdrop so elemental dragons and combat text remain the visual focus.
- Voltfang is a fast multi-target DPS whose total early-tier ability damage is spread across targets rather than exceeding starter DPS output.
- Owned-dragon slots present the portrait, name, and HP as one unified card without a separate name plate.
- Desktop and mobile touch input.
- Persistent meta loop: main menu, boss score chase, XP unlocks, 24-entry codex, and local save data.

---

## Non-Goals

- Online multiplayer or real-time PvP.
- Backend/server infrastructure.
- Items or equipment.
- Multiple merge recipes or branching evolutions.
- Narrative, dialogue, or lore.
- Monetization or IAP.
- Balancing beyond "feels roughly fair."
- Localization.
