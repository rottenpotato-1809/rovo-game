import { CONFIG } from '../config.js';
import { save } from '../persistence/save.js';
import { getNextUnlockInfo } from '../systems/progression.js';
import { createRunState } from '../systems/run.js';
import { getMenuButtons, getMenuConfirmButtons, getMenuContinueButton, pointInRect } from '../ui/layout.js';
import { clear, drawBar, drawButton, drawFitText, drawGameTitle, drawMenuHotspot, drawPhaseBackground, drawRect, drawText } from '../ui/renderer.js';

// Present persistent progression and entry points into a run or codex.
export class MenuState {
  constructor(stateManager, game) {
    this.stateManager = stateManager;
    this.game = game;
    this.buttons = getMenuButtons();
    this.continueButton = getMenuContinueButton();
    this.confirmButtons = getMenuConfirmButtons();
    this.confirmingNewRun = false;
  }

  // Keep the menu stateless between visits.
  enter() {
    this.confirmingNewRun = false;
  }

  // Keep the menu static.
  update() {}

  // Draw title, score, XP progress, and menu commands.
  render(ctx) {
    clear(ctx);
    drawPhaseBackground(ctx, 'menu');
    drawRect(ctx, {
      x: CONFIG.MENU_STATS_PANEL_X,
      y: CONFIG.MENU_STATS_PANEL_Y,
      width: CONFIG.MENU_STATS_PANEL_WIDTH,
      height: CONFIG.MENU_STATS_PANEL_HEIGHT,
    }, CONFIG.UI_PANEL_SOFT_COLOR, CONFIG.TEXT_SECONDARY);
    drawGameTitle(ctx, {
      x: CONFIG.MENU_TITLE_X,
      y: CONFIG.MENU_TITLE_Y,
      width: CONFIG.MENU_TITLE_WIDTH,
      height: CONFIG.MENU_TITLE_HEIGHT,
    });
    drawText(ctx, `HIGH SCORE ${this.game.saveData.highScore}`, CONFIG.MENU_STATS_PANEL_X + (CONFIG.MENU_STATS_PANEL_WIDTH / 2), CONFIG.MENU_SCORE_Y, CONFIG.FONT_SIZE_HEADER);
    const nextUnlock = getNextUnlockInfo(this.game.saveData.totalXP);
    const label = nextUnlock
      ? `XP ${this.game.saveData.totalXP} - NEXT: ${nextUnlock.name}`
      : `XP ${this.game.saveData.totalXP} - ALL DRAGONS UNLOCKED`;
    const ratio = nextUnlock ? nextUnlock.current / nextUnlock.required : 1;
    drawText(ctx, label, CONFIG.MENU_STATS_PANEL_X + (CONFIG.MENU_STATS_PANEL_WIDTH / 2), CONFIG.MENU_XP_LABEL_Y, CONFIG.FONT_SIZE_HEADER);
    drawBar(ctx, CONFIG.MENU_XP_BAR_X, CONFIG.MENU_XP_BAR_Y, CONFIG.MENU_XP_BAR_WIDTH, CONFIG.MENU_XP_BAR_HEIGHT, ratio, CONFIG.GOLD_COLOR);
    drawMenuHotspot(ctx, this.getNewRunLabel(), 'NEW RUN');
    if (this.game.run) drawButton(ctx, this.continueButton, 'CONTINUE', CONFIG.GOLD_COLOR);
    drawMenuHotspot(ctx, this.getCodexLabel(), 'CODEX');
    if (this.confirmingNewRun) this.renderNewRunConfirmation(ctx);
  }

  // Draw a blocking confirmation before replacing a saved run.
  renderNewRunConfirmation(ctx) {
    const panel = {
      x: CONFIG.MENU_CONFIRM_PANEL_X,
      y: CONFIG.MENU_CONFIRM_PANEL_Y,
      width: CONFIG.MENU_CONFIRM_PANEL_WIDTH,
      height: CONFIG.MENU_CONFIRM_PANEL_HEIGHT,
    };
    drawRect(ctx, panel, CONFIG.UI_PANEL_COLOR, CONFIG.GOLD_COLOR);
    drawText(ctx, 'START A NEW RUN?', CONFIG.CANVAS_WIDTH / 2, CONFIG.MENU_CONFIRM_TITLE_Y, CONFIG.FONT_SIZE_TITLE, CONFIG.GOLD_COLOR);
    drawFitText(ctx, 'Your current run will be replaced.', CONFIG.CANVAS_WIDTH / 2, CONFIG.MENU_CONFIRM_BODY_Y, CONFIG.FONT_SIZE_HEADER, panel.width - (CONFIG.PREP_CARD_TEXT_LEFT_PAD * 2), CONFIG.FONT_SIZE_CARD_TITLE_MIN, CONFIG.TEXT_PRIMARY);
    drawButton(ctx, this.confirmButtons.cancel, 'CANCEL', CONFIG.ACCENT_SECONDARY);
    drawButton(ctx, this.confirmButtons.confirm, 'NEW RUN', CONFIG.ACCENT_PRIMARY);
  }

  // Return the compact New Run label over the tower entrance.
  getNewRunLabel() {
    return {
      x: CONFIG.MENU_NEW_RUN_LABEL_X,
      y: CONFIG.MENU_NEW_RUN_LABEL_Y,
      width: CONFIG.MENU_HOTSPOT_LABEL_WIDTH,
      height: CONFIG.MENU_HOTSPOT_LABEL_HEIGHT,
    };
  }

  // Return the compact Codex label over the ground-dragon group.
  getCodexLabel() {
    return {
      x: CONFIG.MENU_CODEX_LABEL_X,
      y: CONFIG.MENU_CODEX_LABEL_Y,
      width: CONFIG.MENU_HOTSPOT_LABEL_WIDTH,
      height: CONFIG.MENU_HOTSPOT_LABEL_HEIGHT,
    };
  }

  // Start a run or open the persistent codex.
  handlePointerDown(point) {
    if (this.confirmingNewRun) {
      if (pointInRect(point, this.confirmButtons.cancel)) this.confirmingNewRun = false;
      if (pointInRect(point, this.confirmButtons.confirm)) this.startNewRun();
      return;
    }
    if (this.game.run && pointInRect(point, this.continueButton)) {
      this.stateManager.change('prep');
      return;
    }
    if (pointInRect(point, this.buttons.newRun)) {
      if (this.game.run) this.confirmingNewRun = true;
      else this.startNewRun();
      return;
    }
    if (pointInRect(point, this.buttons.codex)) this.stateManager.change('codex');
  }

  // Replace any previous run, persist it, and enter prep.
  startNewRun() {
    this.game.run = createRunState(this.game.saveData.unlockedDragons);
    this.game.saveData = save({ ...this.game.saveData, activeRun: this.game.run });
    this.confirmingNewRun = false;
    this.stateManager.change('prep');
  }
}
