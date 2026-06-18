# Wyrmpit — Prototype GDD

## Pitch

A casual 3v3 auto-battler where you draft dragons from a shop, merge duplicates to evolve them, and survive 10 rounds of escalating fights. Beat all 10? You face an invincible boss — your score is how much damage you deal before your team dies. Collect every dragon evolution in your permanent codex. One more run. Always one more run.

---

## Design Pillars

1. **Watch & Cheer** — Battles play out automatically. The fun is in the anticipation: "Did I build the right team?" not "Can I execute the right combo?"
2. **Draft & Discover** — Every shop roll is a decision. Merge 3 of the same to discover a new evolution. The codex rewards curiosity, not grinding.
3. **Score Chase** — The boss can't die. You can only delay the inevitable. The leaderboard question is always: "How much can I squeeze out before the wipe?"

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

### Team
- Exactly **3 dragons** fight per round. No more, no fewer.
- A **bench** holds up to **5** reserve dragons (for merge planning).
- If the player has fewer than 3 dragons, empty slots fight with nothing (disadvantage).
- Dragon HP is round-based: every owned dragon starts each new round at full health, even if it died in the previous winning fight.

### Shop & Economy
- The shop displays **3 random dragons** each round from the player's unlocked pool.
- All dragons cost **3 gold** to buy.
- Buying a shop dragon consumes that shop slot until the next reroll or round refresh.
- Selling returns **2 gold** (Tier 1), **4 gold** (Tier 2), or **8 gold** (Tier 3).
- Rerolling the shop costs **1 gold** and can be done unlimited times.
- Starting gold: **6** so round 1 can field two dragons. Gold earned per round won: **3 + current round number** (e.g., winning round 4 gives 7 gold).

### Merging
- Place 3 identical dragons together → they fuse into 1 dragon of the next tier.
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
- Difficulty escalates by team size, tier, and power scale: round 1 has one weakened Tier 1 enemy, round 2 has two weakened Tier 1 enemies, round 3 begins weakened full enemy teams, and later rounds ramp toward stronger Tier 2 and Tier 3 enemies.

### Boss Fight (Eternal Wyrm)
- Only reached by winning all 10 rounds.
- The Wyrm has **99,999 HP** (functionally invincible).
- It attacks **all 3 player dragons every turn** with escalating damage (starts moderate, grows each turn).
- It always acts last each turn (lowest speed).
- Fight ends when all player dragons die. Total damage dealt to the Wyrm = the player's **SCORE**.

### Win / Lose
- **Win condition (run):** Survive all 10 rounds to reach the boss.
- **Lose condition (run):** All 3 dragons die during any round (run ends immediately).
- **Score:** Only generated if the player reaches the boss. Score = damage dealt to Eternal Wyrm.
- **XP earned:** Rounds survived × 5, plus boss damage ÷ 10 (if reached). Earned on every run, win or lose.
- XP unlocks new Tier 1 dragons at fixed thresholds (100 / 200 / 350 / 500 XP).

### Codex
- A permanent collection log saved between runs.
- 8 dragons × 3 tiers = **24 entries** total.
- An entry unlocks when the player **personally fields or merges** that dragon at that tier.
- Locked entries appear as silhouettes (players see the shape but not the details).

---

## Controls

### Desktop
- **Click** a shop dragon to buy it (goes to bench).
- **Drag** dragons between bench and team slots to arrange.
- **Drag** a dragon to the sell zone (or right-click → sell) to sell.
- **Click "Reroll"** to refresh the shop.
- **Click "Fight"** to start the round.
- During battle: no input. Click "Continue" when it ends.

### Mobile
- **Tap** a shop dragon to buy.
- **Tap** a bench dragon, then **tap** a team slot to place (or swap).
- **Long-press** a dragon to sell (confirmation prompt).
- **Tap "Reroll"** / **Tap "Fight"** buttons.
- During battle: no input. Tap "Continue" when it ends.

---

## UI Layout

### Prep Phase Screen (top → bottom)
- **Header bar:** Round number (left), Gold count (right).
- **Team zone:** 3 large slots in a row (the active fighters). Clearly labelled "YOUR TEAM."
- **Bench zone:** 5 smaller slots below the team. Labelled "BENCH."
- **Shop zone:** 3 dragon cards side by side + Reroll button + Fight button. Positioned at the bottom.
- **Sell zone:** Visible drop target (trash icon or "SELL" label) near bench.

### Fight Phase Screen
- **Landscape arena:** combat uses a 16:9 battlefield view instead of the earlier mobile portrait layout.
- **Left side:** 3 player dragons staged as a compact column on the left half.
- **Right side:** 3 enemy dragons staged as a compact column on the right half.
- **Above each dragon:** HP bar + name.
- **Center:** Floating damage/heal numbers animate on hit.
- **Bottom strip:** Scrolling combat log (one line per action).
- **After battle ends:** "CONTINUE" button overlays the center.
- **Pacing:** battle playback should be brisk by default so a full 3v3 fight resolves quickly while attacks and ability flashes remain readable.

### Boss Fight Screen
- Same as fight phase, but enemies replaced by one large Wyrm sprite center-right.
- **Prominent damage counter** top-center: "DAMAGE: X" updating in real time.

### Results Screen
- Centered card showing: Rounds survived, Boss damage (or "—"), XP earned, Total XP, High Score.
- Any new codex discoveries listed with fanfare text.
- Two buttons: "PLAY AGAIN" / "MAIN MENU."

### Codex Screen
- Grid: 8 columns (one per dragon) × 3 rows (T1, T2, T3).
- Unlocked cells show colored icon + name. Locked cells show dark silhouette + "???".
- Footer: "Discovered: X / 24."

### Main Menu
- Title: "WYRMPIT"
- High Score display.
- XP progress bar toward next unlock.
- Buttons: "NEW RUN" / "CODEX."

---

## UX Flow
MAIN MENU → [New Run] → PREP PHASE (round 1) → [Fight] → FIGHT PHASE → [Continue] → PREP PHASE (round 2) → ... repeat until lose or clear round 10 ...
→ IF LOSE → RESULTS SCREEN → [Play Again] or [Main Menu]
→ IF WIN ROUND 10 → BOSS FIGHT → team dies → RESULTS SCREEN
MAIN MENU → [Codex] → CODEX SCREEN → [Back] → MAIN MENU

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
- Sound design (nice-to-have, not required).
- Monetization or IAP.
- Balancing beyond "feels roughly fair."
- Localization.
