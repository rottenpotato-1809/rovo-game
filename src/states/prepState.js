import { CONFIG } from '../config.js';
import { playBuy, playMerge, playSell } from '../engine/audio.js';
import { getDragon, getDragonTier } from '../data/dragons.js';
import { save } from '../persistence/save.js';
import { simulateBattle } from '../systems/battle.js';
import { getSellPrice } from '../systems/economy.js';
import { checkMergeAvailable, executeMerge } from '../systems/merge.js';
import { registerCodexEntry } from '../systems/progression.js';
import { applyWin, createPlayerBattleTeam, createRoundEnemyTeam, createRunState } from '../systems/run.js';
import { buyDragon, cloneDraftState, rerollShop, sellDragon } from '../systems/shop.js';
import { getBenchSlots, getPrepBackButton, getPrepButtons, getSellZone, getShopCards, getTeamSlots, pointInRect } from '../ui/layout.js';
import {
  clear,
  colorWithAlpha,
  createAmbientParticles,
  drawAmbientDust,
  drawButton,
  drawDragonInspector,
  drawDragonSprite,
  drawFitText,
  drawPhaseBackground,
  drawRect,
  drawText,
  updateAmbientParticles,
} from '../ui/renderer.js';

// Render and operate the draft/prep phase for Milestone 2.
export class PrepState {
  constructor(stateManager, game) {
    this.stateManager = stateManager;
    this.game = game;
    this.selectedSource = null;
    this.dragSource = null;
    this.dragPoint = null;
    this.message = '';
    this.hoveredDragon = null;
    this.hoverPoint = null;
    this.interestFlashText = '';
    this.interestFlashMs = 0;
    this.lastGold = null;
    this.goldFlashMs = 0;
    this.dustParticles = createAmbientParticles(CONFIG.AMBIENT_DUST_COUNT);
    this.backButton = getPrepBackButton();
  }

  // Ensure a run exists before showing prep.
  enter() {
    if (!this.game.run) this.game.run = createRunState(this.game.saveData.unlockedDragons);
    this.selectedSource = null;
    this.dragSource = null;
    this.dragPoint = null;
    this.hoveredDragon = null;
    this.hoverPoint = null;
    this.lastGold = this.game.run.gold;
    this.goldFlashMs = 0;
    if (!Number.isInteger(this.game.run.tutorialStep)) this.game.run.tutorialStep = 0;
    this.interestFlashText = this.game.run.lastInterestEarned > 0 ? `+${this.game.run.lastInterestEarned}G INTEREST` : '';
    this.interestFlashMs = this.interestFlashText ? CONFIG.PREP_INTEREST_FLASH_MS : 0;
    this.persistRun();
  }

  // Keep prep state static between pointer interactions.
  update(dt) {
    if (this.game.run && this.lastGold !== null && this.game.run.gold !== this.lastGold) {
      this.goldFlashMs = CONFIG.GOLD_FLASH_DURATION;
      this.lastGold = this.game.run.gold;
    }
    if (this.goldFlashMs > 0) {
      this.goldFlashMs = Math.max(0, this.goldFlashMs - (dt * 1000));
    }
    if (this.interestFlashMs > 0) {
      this.interestFlashMs = Math.max(0, this.interestFlashMs - (dt * 1000));
    }
    updateAmbientParticles(this.dustParticles, dt, CONFIG.AMBIENT_DUST_SPEED);
  }

  // Draw the prep screen.
  render(ctx) {
    clear(ctx);
    drawPhaseBackground(ctx, 'prep');
    drawAmbientDust(ctx, this.dustParticles);
    ctx.lineWidth = CONFIG.PREP_FRAME_LINE_WIDTH;
    this.renderHeader(ctx);
    drawButton(ctx, this.backButton, 'BACK', CONFIG.ACCENT_SECONDARY);
    this.renderSlots(ctx, 'team', getTeamSlots(), this.game.run.team, 'YOUR TEAM');
    this.renderSlots(ctx, 'bench', getBenchSlots(), this.game.run.bench, 'BENCH');
    this.renderShop(ctx);
    this.renderCommands(ctx);
    this.renderHoverDetails(ctx);
    this.renderTutorial(ctx);
    this.renderDragPreview(ctx);
    drawText(ctx, this.message, CONFIG.CANVAS_WIDTH / 2, CONFIG.PREP_MESSAGE_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.GOLD_COLOR);
  }

  // Draw round and gold information.
  renderHeader(ctx) {
    ctx.fillStyle = CONFIG.HEADER_BG_COLOR;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.HEADER_HEIGHT);
    const leftPanel = {
      x: CONFIG.PREP_HEADER_PANEL_MARGIN,
      y: (CONFIG.HEADER_HEIGHT - CONFIG.PREP_HEADER_PANEL_HEIGHT) / 2,
      width: CONFIG.PREP_HEADER_PANEL_WIDTH,
      height: CONFIG.PREP_HEADER_PANEL_HEIGHT,
    };
    const rightPanel = {
      ...leftPanel,
      x: CONFIG.CANVAS_WIDTH - CONFIG.PREP_HEADER_PANEL_MARGIN - CONFIG.PREP_HEADER_PANEL_WIDTH,
    };
    drawRect(ctx, leftPanel, CONFIG.UI_PANEL_COLOR, CONFIG.TEXT_SECONDARY);
    drawRect(ctx, rightPanel, CONFIG.UI_PANEL_COLOR, CONFIG.GOLD_COLOR);
    const phaseLabel = this.isBossPrep() ? 'BOSS PREP' : `ROUND ${this.game.run.round}/${CONFIG.TOTAL_ROUNDS}`;
    drawText(ctx, phaseLabel, leftPanel.x + leftPanel.width / 2, CONFIG.HEADER_HEIGHT / 2, CONFIG.FONT_SIZE_HEADER);
    this.renderGoldCounter(ctx, rightPanel);
    this.renderInterestFlash(ctx, rightPanel.x + rightPanel.width / 2);
  }

  // Draw the gold counter with a short bump when the amount changes.
  renderGoldCounter(ctx, panel) {
    const centerX = panel.x + panel.width / 2;
    const centerY = CONFIG.HEADER_HEIGHT / 2;
    const progress = CONFIG.GOLD_FLASH_DURATION > 0 ? this.goldFlashMs / CONFIG.GOLD_FLASH_DURATION : 0;
    const scale = CONFIG.ARENA_ALIVE_ALPHA + ((CONFIG.GOLD_FLASH_SCALE - CONFIG.ARENA_ALIVE_ALPHA) * progress);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    drawText(ctx, `GOLD ${this.game.run.gold}`, 0, 0, CONFIG.FONT_SIZE_HEADER, CONFIG.GOLD_COLOR);
    ctx.restore();
  }

  // Briefly show the start-of-prep interest payout.
  renderInterestFlash(ctx, centerX) {
    if (!this.interestFlashText || this.interestFlashMs <= 0) return;
    const alpha = Math.min(CONFIG.ARENA_ALIVE_ALPHA, this.interestFlashMs / CONFIG.PREP_INTEREST_FLASH_MS);
    ctx.save();
    ctx.globalAlpha = alpha;
    drawText(ctx, this.interestFlashText, centerX, CONFIG.PREP_INTEREST_FLASH_Y, CONFIG.FONT_SIZE_DRAGON_NAME, CONFIG.GOLD_COLOR);
    ctx.restore();
  }

  // Draw a row of team or bench slots.
  renderSlots(ctx, zone, rects, dragons, label) {
    this.renderSectionLabel(ctx, label, rects[0].x, rects[0].y - CONFIG.PREP_SECTION_LABEL_OFFSET_Y);
    rects.forEach((rect, index) => {
      const isSelected = this.selectedSource && this.selectedSource.zone === zone && this.selectedSource.index === index;
      const isDragged = this.dragSource && this.dragSource.zone === zone && this.dragSource.index === index;
      drawRect(ctx, rect, CONFIG.CARD_BG_COLOR, isSelected || isDragged ? CONFIG.GOLD_COLOR : CONFIG.BENCH_EMPTY_BORDER);
      const dragon = dragons[index];
      if (dragon && !isDragged) this.renderOwnedDragon(ctx, dragon, rect, zone);
      else if (!dragon) drawText(ctx, 'EMPTY', rect.x + rect.width / 2, rect.y + CONFIG.PREP_SLOT_LABEL_OFFSET_Y, CONFIG.FONT_SIZE_STATS, CONFIG.TEXT_MUTED);
    });
  }

  // Draw a stored dragon inside a slot.
  renderOwnedDragon(ctx, owned, rect, zone) {
    const dragon = getDragon(owned.id);
    const centerX = rect.x + rect.width / 2;
    const isTeam = zone === 'team';
    const centerY = rect.y + (isTeam ? CONFIG.PREP_TEAM_DRAGON_Y_OFFSET : CONFIG.PREP_BENCH_DRAGON_Y_OFFSET);
    const radius = isTeam ? CONFIG.DRAGON_RADIUS_TEAM : CONFIG.DRAGON_RADIUS_BENCH;
    this.renderDragonToken(ctx, owned, centerX, centerY, CONFIG.ARENA_ALIVE_ALPHA, radius);
    drawFitText(ctx, dragon.name, centerX, rect.y + rect.height - CONFIG.PREP_DRAGON_NAME_BOTTOM_OFFSET, CONFIG.FONT_SIZE_DRAGON_NAME, rect.width - CONFIG.PREP_CARD_TEXT_LEFT_PAD, CONFIG.FONT_SIZE_CARD_META_MIN);
    drawText(ctx, `T${owned.tier} HP ${owned.hp}/${owned.maxHp}`, centerX, rect.y + rect.height - CONFIG.PREP_DRAGON_STATS_BOTTOM_OFFSET, CONFIG.FONT_SIZE_STATS, CONFIG.TEXT_SECONDARY);
  }

  // Draw a compact dragon token for slots and drag previews.
  renderDragonToken(ctx, owned, centerX, centerY, alpha, radius = CONFIG.DRAGON_RADIUS_TEAM) {
    const dragon = getDragon(owned.id);
    drawDragonSprite(ctx, { ...dragon, tier: owned.tier }, centerX, centerY, radius, alpha, CONFIG.ARENA_ALIVE_ALPHA, true);
  }

  // Draw shop cards.
  renderShop(ctx) {
    const cards = getShopCards();
    const cardsWidth = (CONFIG.SHOP_CARD_WIDTH * CONFIG.SHOP_SIZE) + (CONFIG.SHOP_CARD_GAP * (CONFIG.SHOP_SIZE - 1));
    const headingX = CONFIG.PREP_RIGHT_PANEL_X + ((cardsWidth - CONFIG.PREP_SECTION_LABEL_WIDTH) / 2);
    this.renderSectionLabel(ctx, 'SHOP', headingX, CONFIG.SHOP_ZONE_Y - CONFIG.PREP_SECTION_LABEL_OFFSET_Y);
    cards.forEach((rect, index) => {
      const id = this.game.run.shop[index];
      if (!id) {
        drawRect(ctx, rect, CONFIG.ACCENT_SECONDARY, CONFIG.BENCH_EMPTY_BORDER);
        drawText(ctx, 'SOLD', rect.x + rect.width / 2, rect.y + rect.height / 2, CONFIG.FONT_SIZE_BUTTON, CONFIG.TEXT_MUTED);
        return;
      }
      const dragon = getDragon(id);
      const tier = getDragonTier(id, 1);
      const elementColor = CONFIG.ELEMENT_COLORS[dragon.element];
      const hovered = this.hoverPoint && pointInRect(this.hoverPoint, rect);
      const canAfford = this.game.run.gold >= CONFIG.DRAGON_BUY_COST;
      const pulse = CONFIG.CARD_AFFORDABLE_PULSE && canAfford
        ? (Math.sin((globalThis.performance?.now?.() || Date.now()) / CONFIG.TIER_THREE_AURA_PULSE_MS) + CONFIG.ARENA_ALIVE_ALPHA) / 2
        : 0;
      const borderAlpha = hovered
        ? CONFIG.ARENA_ALIVE_ALPHA
        : CONFIG.CARD_BORDER_ALPHA + (pulse * CONFIG.CARD_BORDER_ALPHA);
      drawRect(ctx, rect, hovered ? CONFIG.CARD_HOVER_BG : CONFIG.CARD_BG_COLOR, colorWithAlpha(elementColor, borderAlpha));
      const textWidth = rect.width - (CONFIG.PREP_CARD_TEXT_LEFT_PAD * 2);
      drawDragonSprite(
        ctx,
        { ...dragon, tier: 1 },
        rect.x + (rect.width / 2),
        rect.y + CONFIG.PREP_CARD_SPRITE_Y_OFFSET,
        CONFIG.SHOP_DRAGON_SPRITE_SIZE / CONFIG.DRAGON_SPRITE_SCALE,
        CONFIG.ARENA_ALIVE_ALPHA,
        CONFIG.ARENA_ALIVE_ALPHA,
        true,
      );
      drawFitText(ctx, dragon.name, rect.x + CONFIG.PREP_CARD_TEXT_LEFT_PAD, rect.y + CONFIG.PREP_CARD_NAME_Y_OFFSET, CONFIG.FONT_SIZE_HEADER, textWidth, CONFIG.FONT_SIZE_CARD_TITLE_MIN, CONFIG.TEXT_PRIMARY, 'left');
      drawFitText(ctx, `${dragon.role} / ${dragon.element}`, rect.x + CONFIG.PREP_CARD_TEXT_LEFT_PAD, rect.y + CONFIG.PREP_CARD_ROLE_Y_OFFSET, CONFIG.FONT_SIZE_DRAGON_NAME, textWidth, CONFIG.FONT_SIZE_CARD_META_MIN, CONFIG.TEXT_SECONDARY, 'left');
      drawFitText(ctx, `ATK ${tier.atk} HP ${tier.hp} SPD ${tier.spd}`, rect.x + CONFIG.PREP_CARD_TEXT_LEFT_PAD, rect.y + CONFIG.PREP_CARD_STAT_Y_OFFSET, CONFIG.FONT_SIZE_STATS, textWidth, CONFIG.FONT_SIZE_CARD_META_MIN, CONFIG.TEXT_PRIMARY, 'left');
      drawText(ctx, `BUY ${CONFIG.DRAGON_BUY_COST}G`, rect.x + CONFIG.PREP_CARD_TEXT_LEFT_PAD, rect.y + CONFIG.PREP_CARD_COST_Y_OFFSET, CONFIG.FONT_SIZE_BUTTON, CONFIG.GOLD_COLOR, 'left');
    });
  }

  // Draw a compact framed heading above a prep region.
  renderSectionLabel(ctx, label, x, centerY) {
    const rect = {
      x,
      y: centerY - (CONFIG.PREP_SECTION_LABEL_HEIGHT / 2),
      width: CONFIG.PREP_SECTION_LABEL_WIDTH,
      height: CONFIG.PREP_SECTION_LABEL_HEIGHT,
    };
    drawRect(ctx, rect, CONFIG.UI_PANEL_COLOR, CONFIG.GOLD_COLOR);
    drawText(ctx, label, rect.x + rect.width / 2, centerY, CONFIG.FONT_SIZE_HEADER);
  }

  // Draw the floating dragon while the pointer is dragging it.
  renderDragPreview(ctx) {
    if (!this.dragSource || !this.dragPoint) return;
    const list = this.dragSource.zone === 'team' ? this.game.run.team : this.game.run.bench;
    const owned = list[this.dragSource.index];
    if (!owned) return;
    this.renderDragonToken(ctx, owned, this.dragPoint.x, this.dragPoint.y, CONFIG.PREP_DRAG_PREVIEW_ALPHA);
  }

  // Draw sell, merge, reroll, and fight controls.
  renderCommands(ctx) {
    const sellZone = getSellZone();
    const buttons = getPrepButtons();
    drawRect(ctx, sellZone, CONFIG.SELL_ZONE_COLOR, CONFIG.HP_BAR_LOW);
    const centerX = sellZone.x + sellZone.width / 2;
    const centerY = sellZone.y + sellZone.height / 2;
    drawText(ctx, 'SELL', centerX, centerY + CONFIG.PREP_SELL_TITLE_OFFSET_Y, CONFIG.FONT_SIZE_BUTTON);
    drawFitText(ctx, this.getSellHint(), centerX, centerY + CONFIG.PREP_SELL_HINT_OFFSET_Y, CONFIG.FONT_SIZE_STATS, sellZone.width - (CONFIG.PREP_CARD_TEXT_LEFT_PAD * 2), CONFIG.FONT_SIZE_SMALL, CONFIG.TEXT_SECONDARY);
    const mergeAvailable = checkMergeAvailable(this.game.run.team, this.game.run.bench);
    drawButton(ctx, buttons.merge, mergeAvailable ? 'MERGE' : 'NO MERGE', CONFIG.GOLD_COLOR, CONFIG.FONT_SIZE_BUTTON, { disabled: !mergeAvailable });
    drawButton(ctx, buttons.reroll, `REROLL ${CONFIG.REROLL_COST}G`, CONFIG.ACCENT_SECONDARY);
    const fightFontSize = this.isBossPrep() ? CONFIG.FONT_SIZE_PREP_BOSS_FIGHT : CONFIG.FONT_SIZE_PREP_FIGHT;
    drawButton(ctx, buttons.fight, this.isBossPrep() ? 'FIGHT BOSS' : 'FIGHT', CONFIG.ACCENT_PRIMARY, fightFontSize);
    if (this.hoverPoint && pointInRect(this.hoverPoint, buttons.merge)) this.renderMergeTooltip(ctx);
  }

  // Draw contextual dragon stats and skill details while hovering.
  renderHoverDetails(ctx) {
    if (!this.hoveredDragon || this.isTutorialActive()) return;
    drawDragonInspector(ctx, {
      x: CONFIG.PREP_INSPECTOR_X,
      y: CONFIG.PREP_INSPECTOR_Y,
      width: CONFIG.PREP_INSPECTOR_WIDTH,
      height: CONFIG.PREP_INSPECTOR_HEIGHT,
    }, this.hoveredDragon.dragon, this.hoveredDragon.tierData);
  }

  // Explain the merge requirement when its command is hovered.
  renderMergeTooltip(ctx) {
    const rect = {
      x: CONFIG.PREP_MERGE_TOOLTIP_X,
      y: CONFIG.PREP_MERGE_TOOLTIP_Y,
      width: CONFIG.PREP_MERGE_TOOLTIP_WIDTH,
      height: CONFIG.PREP_MERGE_TOOLTIP_HEIGHT,
    };
    drawRect(ctx, rect, CONFIG.UI_PANEL_COLOR, CONFIG.GOLD_COLOR);
    drawFitText(ctx, 'BUY 3 MATCHING DRAGONS', rect.x + rect.width / 2, rect.y + rect.height / 2, CONFIG.FONT_SIZE_DRAGON_NAME, rect.width - (CONFIG.PREP_CARD_TEXT_LEFT_PAD * 2), CONFIG.FONT_SIZE_STATS, CONFIG.TEXT_PRIMARY);
  }

  // Guide a first-time player through buy, place, and fight actions.
  renderTutorial(ctx) {
    if (!this.isTutorialActive()) return;
    const rect = {
      x: CONFIG.TUTORIAL_PANEL_X,
      y: CONFIG.TUTORIAL_PANEL_Y,
      width: CONFIG.TUTORIAL_PANEL_WIDTH,
      height: CONFIG.TUTORIAL_PANEL_HEIGHT,
    };
    drawRect(ctx, rect, CONFIG.UI_PANEL_COLOR, CONFIG.GOLD_COLOR);
    drawText(ctx, `TUTORIAL ${this.game.run.tutorialStep + 1}/3`, rect.x + rect.width / 2, rect.y + CONFIG.TUTORIAL_TITLE_OFFSET_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.GOLD_COLOR);
    drawFitText(ctx, this.getTutorialPrompt(), rect.x + rect.width / 2, rect.y + CONFIG.TUTORIAL_BODY_OFFSET_Y, CONFIG.FONT_SIZE_DRAGON_NAME, rect.width - (CONFIG.PREP_CARD_TEXT_LEFT_PAD * 2), CONFIG.FONT_SIZE_CARD_META_MIN);
    ctx.lineWidth = CONFIG.TUTORIAL_HIGHLIGHT_LINE_WIDTH;
    this.getTutorialTargets().forEach(target => drawRect(ctx, target, CONFIG.TUTORIAL_HIGHLIGHT_FILL, CONFIG.GOLD_COLOR));
    ctx.lineWidth = CONFIG.PREP_FRAME_LINE_WIDTH;
  }

  // Return the current first-run instruction.
  getTutorialPrompt() {
    if (this.game.run.tutorialStep === 0) return 'BUY A DRAGON FROM THE SHOP';
    if (this.game.run.tutorialStep === 1) return 'AUTO-EQUIPPED - DRAG TO REARRANGE';
    return 'PRESS FIGHT TO START THE BATTLE';
  }

  // Return the regions highlighted by the current tutorial step.
  getTutorialTargets() {
    if (this.game.run.tutorialStep === 0) return getShopCards();
    if (this.game.run.tutorialStep === 1) {
      return getTeamSlots();
    }
    return [getPrepButtons().fight];
  }

  // Return whether the first-run guide still owns the center panel.
  isTutorialActive() {
    return !this.game.saveData.tutorialComplete && this.game.run.tutorialStep < 3;
  }

  // Show drag guidance or the exact value of the dragon currently held.
  getSellHint() {
    if (!this.dragSource) return 'DRAG HERE TO SELL';
    const list = this.dragSource.zone === 'team' ? this.game.run.team : this.game.run.bench;
    const owned = list[this.dragSource.index];
    return owned ? `DROP TO SELL FOR ${getSellPrice(owned.tier)}G` : 'DRAG HERE TO SELL';
  }

  // Handle direct clicks on shop, buttons, or slots.
  handlePointerDown(point) {
    this.message = '';
    if (pointInRect(point, this.backButton)) {
      this.persistRun();
      this.stateManager.change('menu');
      return;
    }
    const shopIndex = getShopCards().findIndex(rect => pointInRect(point, rect));
    if (shopIndex !== -1) {
      const result = buyDragon(this.game.run, shopIndex);
      this.applyDraftResult(result, 'Bought dragon', 'Cannot buy');
      if (result.success) playBuy();
      if (result.success) this.advanceTutorial(1);
      return;
    }
    const buttons = getPrepButtons();
    if (pointInRect(point, buttons.reroll)) {
      this.applyDraftResult(rerollShop(this.game.run), 'Shop rerolled', 'Need more gold');
      return;
    }
    if (pointInRect(point, buttons.merge)) {
      this.applyMerge();
      return;
    }
    if (pointInRect(point, buttons.fight)) {
      this.startFight();
      return;
    }
    const source = this.getSlotSource(point);
    if (source) {
      this.selectedSource = source;
      this.dragSource = source;
      this.dragPoint = point;
      return;
    }
    const target = this.getSlotTarget(point);
    if (target && this.selectedSource) this.moveDragon(this.selectedSource, target);
  }

  // Track pointer movement for future drag previews.
  handlePointerMove(point) {
    this.hoverPoint = point;
    this.hoveredDragon = this.dragSource ? null : this.getHoveredDragon(point);
    if (this.dragSource) this.dragPoint = point;
  }

  // Drop selected dragons onto slots or sell zone.
  handlePointerUp(point) {
    if (!this.dragSource) return;
    if (pointInRect(point, getSellZone())) {
      this.applyDraftResult(sellDragon(this.game.run, this.dragSource), 'Sold dragon', 'Nothing to sell');
      if (this.message === 'Sold dragon') playSell();
      this.dragSource = null;
      this.selectedSource = null;
      this.dragPoint = null;
      return;
    }
    const target = this.getSlotTarget(point);
    if (target && !this.sameSource(this.dragSource, target)) this.moveDragon(this.dragSource, target);
    this.dragSource = null;
    this.dragPoint = null;
    this.selectedSource = null;
  }

  // Apply a shop/economy state change result.
  applyDraftResult(result, successMessage, failureMessage) {
    if (result.success) {
      this.game.run = result.state;
      this.message = successMessage;
    } else {
      this.message = failureMessage;
    }
    this.persistRun();
  }

  // Execute a merge if available.
  applyMerge() {
    const result = executeMerge(this.game.run);
    if (!result.success) {
      this.message = 'Need three matching dragons';
      return;
    }
    this.game.run = result.state;
    this.registerOwnedDiscovery(result.discovery);
    this.message = `Merged ${result.discovery.name} T${result.discovery.tier}`;
    playMerge();
    this.persistRun();
  }

  // Move or swap dragons between two slots.
  moveDragon(source, target) {
    const nextState = cloneDraftState(this.game.run);
    const sourceList = source.zone === 'team' ? nextState.team : nextState.bench;
    const targetList = target.zone === 'team' ? nextState.team : nextState.bench;
    const moving = sourceList[source.index];
    if (!moving) return;
    sourceList[source.index] = targetList[target.index];
    targetList[target.index] = moving;
    this.game.run = nextState;
    this.selectedSource = null;
    this.message = 'Moved dragon';
    if (target.zone === 'team') this.advanceTutorial(2);
    this.persistRun();
  }

  // Start combat against a generated enemy team.
  startFight() {
    if (!this.game.run.team.some(Boolean)) {
      this.message = 'Place at least one dragon';
      return;
    }
    if (this.game.run.tutorialStep === 2 && !this.game.saveData.tutorialComplete) {
      this.game.run.tutorialStep = 3;
      this.game.saveData.tutorialComplete = true;
    }
    this.game.run.team.filter(Boolean).forEach(owned => this.registerOwnedDiscovery({
      id: owned.id,
      tier: owned.tier,
      name: getDragon(owned.id).name,
    }));
    if (this.isBossPrep()) {
      this.persistRun();
      this.stateManager.change('boss', { run: this.game.run });
      return;
    }
    const playerBattleTeam = createPlayerBattleTeam(this.game.run.team);
    const enemyBattleTeam = createRoundEnemyTeam(this.game.run.round);
    const displayPlayerTeam = playerBattleTeam.map(dragon => ({ ...dragon, statuses: [] }));
    const displayEnemyTeam = enemyBattleTeam.map(dragon => ({ ...dragon, statuses: [] }));
    const result = simulateBattle(playerBattleTeam, enemyBattleTeam);
    this.persistRun();
    this.stateManager.change('fight', {
      result,
      playerTeam: displayPlayerTeam,
      enemyTeam: displayEnemyTeam,
      onComplete: fightResult => this.finishFight(fightResult),
    });
  }

  // Continue the run or show results after a fight.
  finishFight(result) {
    if (result.outcome !== 'win') {
      this.stateManager.change('result', { victory: false, run: this.game.run });
      return;
    }
    if (this.game.run.round >= CONFIG.TOTAL_ROUNDS) {
      this.game.run = applyWin(this.game.run);
      this.persistRun();
      this.stateManager.change('prep');
      return;
    }
    this.game.run = applyWin(this.game.run);
    this.persistRun();
    this.stateManager.change('prep');
  }

  // Round TOTAL_ROUNDS + 1 is a final draft checkpoint, not another enemy round.
  isBossPrep() {
    return this.game.run.round > CONFIG.TOTAL_ROUNDS;
  }

  // Resolve the dragon and tier currently under the pointer.
  getHoveredDragon(point) {
    const ownedTarget = this.getSlotTarget(point);
    if (ownedTarget) {
      const list = ownedTarget.zone === 'team' ? this.game.run.team : this.game.run.bench;
      const owned = list[ownedTarget.index];
      if (owned) return { dragon: getDragon(owned.id), tierData: getDragonTier(owned.id, owned.tier) };
    }
    const shopIndex = getShopCards().findIndex(rect => pointInRect(point, rect));
    const shopId = shopIndex >= 0 ? this.game.run.shop[shopIndex] : null;
    return shopId ? { dragon: getDragon(shopId), tierData: getDragonTier(shopId, 1) } : null;
  }

  // Advance the tutorial monotonically and save its checkpoint.
  advanceTutorial(step) {
    if (this.game.saveData.tutorialComplete || this.game.run.tutorialStep >= step) return;
    this.game.run.tutorialStep = step;
    this.persistRun();
  }

  // Persist the latest safe prep checkpoint and tutorial state.
  persistRun() {
    this.game.saveData = save({
      ...this.game.saveData,
      activeRun: this.game.run,
      tutorialComplete: this.game.saveData.tutorialComplete,
    });
  }

  // Find an occupied source slot at a point.
  getSlotSource(point) {
    const target = this.getSlotTarget(point);
    if (!target) return null;
    const list = target.zone === 'team' ? this.game.run.team : this.game.run.bench;
    return list[target.index] ? target : null;
  }

  // Find any slot at a point.
  getSlotTarget(point) {
    const teamIndex = getTeamSlots().findIndex(rect => pointInRect(point, rect));
    if (teamIndex !== -1) return { zone: 'team', index: teamIndex };
    const benchIndex = getBenchSlots().findIndex(rect => pointInRect(point, rect));
    if (benchIndex !== -1) return { zone: 'bench', index: benchIndex };
    return null;
  }

  // Check if two slot references point to the same place.
  sameSource(left, right) {
    return left.zone === right.zone && left.index === right.index;
  }

  // Register a personally owned tier and remember first-time discoveries for results.
  registerOwnedDiscovery(discovery) {
    const registration = registerCodexEntry(this.game.saveData.codex, discovery.id, discovery.tier);
    this.game.saveData.codex = registration.codex;
    if (registration.isNew) {
      this.game.run.lastDiscoveries = [...this.game.run.lastDiscoveries, discovery];
    }
  }
}
