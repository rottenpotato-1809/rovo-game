import { CONFIG } from '../config.js';
import { getDragon, getDragonTier } from '../data/dragons.js';
import { simulateBattle } from '../systems/battle.js';
import { calculateRoundGold } from '../systems/economy.js';
import { checkMergeAvailable, executeMerge } from '../systems/merge.js';
import { applyWin, createPlayerBattleTeam, createRoundEnemyTeam, createRunState } from '../systems/run.js';
import { buyDragon, cloneDraftState, rerollShop, sellDragon } from '../systems/shop.js';
import { getBenchSlots, getPrepButtons, getSellZone, getShopCards, getTeamSlots, pointInRect } from '../ui/layout.js';
import { clear, drawArenaBackdrop, drawButton, drawCircle, drawFitText, drawRect, drawText } from '../ui/renderer.js';

// Render and operate the draft/prep phase for Milestone 2.
export class PrepState {
  constructor(stateManager, game) {
    this.stateManager = stateManager;
    this.game = game;
    this.selectedSource = null;
    this.dragSource = null;
    this.dragPoint = null;
    this.message = '';
  }

  // Ensure a run exists before showing prep.
  enter() {
    if (!this.game.run) this.game.run = createRunState();
    this.selectedSource = null;
    this.dragSource = null;
    this.dragPoint = null;
  }

  // Keep prep state static between pointer interactions.
  update() {}

  // Draw the prep screen.
  render(ctx) {
    clear(ctx);
    drawArenaBackdrop(ctx);
    this.renderHeader(ctx);
    this.renderSlots(ctx, 'team', getTeamSlots(), this.game.run.team, 'YOUR TEAM');
    this.renderSlots(ctx, 'bench', getBenchSlots(), this.game.run.bench, 'BENCH');
    this.renderShop(ctx);
    this.renderCommands(ctx);
    this.renderDragPreview(ctx);
    drawText(ctx, this.message, CONFIG.CANVAS_WIDTH / 2, CONFIG.PREP_MESSAGE_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.GOLD_COLOR);
  }

  // Draw round and gold information.
  renderHeader(ctx) {
    ctx.fillStyle = CONFIG.HEADER_BG_COLOR;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.HEADER_HEIGHT);
    drawText(ctx, `ROUND ${this.game.run.round}/${CONFIG.TOTAL_ROUNDS}`, CONFIG.PREP_LEFT_PANEL_X, CONFIG.HEADER_HEIGHT / 2, CONFIG.FONT_SIZE_HEADER, CONFIG.TEXT_PRIMARY, 'left');
    drawText(ctx, `GOLD ${this.game.run.gold}`, CONFIG.CANVAS_WIDTH - CONFIG.PREP_LEFT_PANEL_X, CONFIG.HEADER_HEIGHT / 2, CONFIG.FONT_SIZE_HEADER, CONFIG.GOLD_COLOR, 'right');
  }

  // Draw a row of team or bench slots.
  renderSlots(ctx, zone, rects, dragons, label) {
    drawText(ctx, label, rects[0].x, rects[0].y - CONFIG.PREP_SECTION_LABEL_OFFSET_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.TEXT_PRIMARY, 'left');
    rects.forEach((rect, index) => {
      const isSelected = this.selectedSource && this.selectedSource.zone === zone && this.selectedSource.index === index;
      const isDragged = this.dragSource && this.dragSource.zone === zone && this.dragSource.index === index;
      drawRect(ctx, rect, CONFIG.CARD_BG_COLOR, isSelected || isDragged ? CONFIG.GOLD_COLOR : CONFIG.BENCH_EMPTY_BORDER);
      const dragon = dragons[index];
      if (dragon && !isDragged) this.renderOwnedDragon(ctx, dragon, rect);
      else if (!dragon) drawText(ctx, 'EMPTY', rect.x + rect.width / 2, rect.y + CONFIG.PREP_SLOT_LABEL_OFFSET_Y, CONFIG.FONT_SIZE_STATS, CONFIG.TEXT_MUTED);
    });
  }

  // Draw a stored dragon inside a slot.
  renderOwnedDragon(ctx, owned, rect) {
    const dragon = getDragon(owned.id);
    const color = CONFIG.ELEMENT_COLORS[dragon.element];
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + CONFIG.PREP_DRAGON_Y_OFFSET;
    this.renderDragonToken(ctx, owned, centerX, centerY, CONFIG.ARENA_ALIVE_ALPHA);
    drawFitText(ctx, dragon.name, centerX, rect.y + CONFIG.PREP_DRAGON_TIER_Y_OFFSET, CONFIG.FONT_SIZE_DRAGON_NAME, rect.width - CONFIG.PREP_CARD_TEXT_LEFT_PAD, CONFIG.FONT_SIZE_CARD_META_MIN);
    drawText(ctx, `T${owned.tier} HP ${owned.hp}/${owned.maxHp}`, centerX, rect.y + rect.height - CONFIG.PREP_SLOT_LABEL_OFFSET_Y, CONFIG.FONT_SIZE_STATS, CONFIG.TEXT_SECONDARY);
  }

  // Draw a compact dragon token for slots and drag previews.
  renderDragonToken(ctx, owned, centerX, centerY, alpha) {
    const dragon = getDragon(owned.id);
    const color = CONFIG.ELEMENT_COLORS[dragon.element];
    drawCircle(ctx, centerX, centerY, CONFIG.DRAGON_RADIUS_TEAM, color, alpha, CONFIG.TEXT_PRIMARY);
    drawText(ctx, dragon.emoji || '?', centerX, centerY, CONFIG.FONT_SIZE_EMOJI);
  }

  // Draw shop cards.
  renderShop(ctx) {
    drawText(ctx, 'SHOP', CONFIG.PREP_RIGHT_PANEL_X, CONFIG.SHOP_ZONE_Y - CONFIG.PREP_SECTION_LABEL_OFFSET_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.TEXT_PRIMARY, 'left');
    getShopCards().forEach((rect, index) => {
      const id = this.game.run.shop[index];
      const dragon = getDragon(id);
      const tier = getDragonTier(id, 1);
      drawRect(ctx, rect, CONFIG.CARD_BG_COLOR, CONFIG.ELEMENT_COLORS[dragon.element]);
      const textWidth = rect.width - (CONFIG.PREP_CARD_TEXT_LEFT_PAD * 2);
      drawFitText(ctx, dragon.name, rect.x + CONFIG.PREP_CARD_TEXT_LEFT_PAD, rect.y + CONFIG.PREP_CARD_NAME_Y_OFFSET, CONFIG.FONT_SIZE_HEADER, textWidth, CONFIG.FONT_SIZE_CARD_TITLE_MIN, CONFIG.TEXT_PRIMARY, 'left');
      drawFitText(ctx, `${dragon.role} / ${dragon.element}`, rect.x + CONFIG.PREP_CARD_TEXT_LEFT_PAD, rect.y + CONFIG.PREP_CARD_ROLE_Y_OFFSET, CONFIG.FONT_SIZE_DRAGON_NAME, textWidth, CONFIG.FONT_SIZE_CARD_META_MIN, CONFIG.TEXT_SECONDARY, 'left');
      drawFitText(ctx, `ATK ${tier.atk} HP ${tier.hp} SPD ${tier.spd}`, rect.x + CONFIG.PREP_CARD_TEXT_LEFT_PAD, rect.y + CONFIG.PREP_CARD_STAT_Y_OFFSET, CONFIG.FONT_SIZE_STATS, textWidth, CONFIG.FONT_SIZE_CARD_META_MIN, CONFIG.TEXT_PRIMARY, 'left');
      drawText(ctx, `BUY ${CONFIG.DRAGON_BUY_COST}G`, rect.x + CONFIG.PREP_CARD_TEXT_LEFT_PAD, rect.y + CONFIG.PREP_CARD_COST_Y_OFFSET, CONFIG.FONT_SIZE_BUTTON, CONFIG.GOLD_COLOR, 'left');
    });
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
    drawText(ctx, 'SELL', sellZone.x + sellZone.width / 2, sellZone.y + sellZone.height / 2, CONFIG.FONT_SIZE_BUTTON);
    const mergeAvailable = checkMergeAvailable(this.game.run.team, this.game.run.bench);
    drawButton(ctx, buttons.merge, mergeAvailable ? 'MERGE' : 'NO MERGE', mergeAvailable ? CONFIG.GOLD_COLOR : CONFIG.ACCENT_SECONDARY);
    drawButton(ctx, buttons.reroll, `REROLL ${CONFIG.REROLL_COST}G`, CONFIG.ACCENT_SECONDARY);
    drawButton(ctx, buttons.fight, 'FIGHT', CONFIG.ACCENT_PRIMARY);
  }

  // Handle direct clicks on shop, buttons, or slots.
  handlePointerDown(point) {
    this.message = '';
    const shopIndex = getShopCards().findIndex(rect => pointInRect(point, rect));
    if (shopIndex !== -1) {
      this.applyDraftResult(buyDragon(this.game.run, shopIndex), 'Bought dragon', 'Cannot buy');
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
    const target = this.getSlotTarget(point);
    if (target && this.selectedSource) {
      this.moveDragon(this.selectedSource, target);
      return;
    }
    const source = this.getSlotSource(point);
    if (!source) return;
    this.selectedSource = source;
    this.dragSource = source;
    this.dragPoint = point;
  }

  // Track pointer movement for future drag previews.
  handlePointerMove(point) {
    if (!this.dragSource) return;
    this.dragPoint = point;
  }

  // Drop selected dragons onto slots or sell zone.
  handlePointerUp(point) {
    if (!this.dragSource) return;
    if (pointInRect(point, getSellZone())) {
      this.applyDraftResult(sellDragon(this.game.run, this.dragSource), 'Sold dragon', 'Nothing to sell');
      this.dragSource = null;
      this.selectedSource = null;
      this.dragPoint = null;
      return;
    }
    const target = this.getSlotTarget(point);
    if (target && !this.sameSource(this.dragSource, target)) this.moveDragon(this.dragSource, target);
    this.dragSource = null;
    this.dragPoint = null;
  }

  // Apply a shop/economy state change result.
  applyDraftResult(result, successMessage, failureMessage) {
    if (result.success) {
      this.game.run = result.state;
      this.message = successMessage;
    } else {
      this.message = failureMessage;
    }
  }

  // Execute a merge if available.
  applyMerge() {
    const result = executeMerge(this.game.run);
    if (!result.success) {
      this.message = 'Need three matching dragons';
      return;
    }
    this.game.run = result.state;
    this.game.run.lastDiscoveries = [...this.game.run.lastDiscoveries, result.discovery];
    this.message = `Merged ${result.discovery.name} T${result.discovery.tier}`;
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
    this.selectedSource = target;
    this.message = 'Moved dragon';
  }

  // Start combat against a generated enemy team.
  startFight() {
    if (!this.game.run.team.some(Boolean)) {
      this.message = 'Place at least one dragon';
      return;
    }
    const playerBattleTeam = createPlayerBattleTeam(this.game.run.team);
    const enemyBattleTeam = createRoundEnemyTeam(this.game.run.round);
    const displayPlayerTeam = playerBattleTeam.map(dragon => ({ ...dragon, statuses: [] }));
    const displayEnemyTeam = enemyBattleTeam.map(dragon => ({ ...dragon, statuses: [] }));
    const result = simulateBattle(playerBattleTeam, enemyBattleTeam);
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
      this.game.run = applyWin(this.game.run, result.survivingPlayer);
      this.stateManager.change('result', { victory: true, run: this.game.run });
      return;
    }
    this.game.run = applyWin(this.game.run, result.survivingPlayer);
    this.stateManager.change('prep');
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
}
