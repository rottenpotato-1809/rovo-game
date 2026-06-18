import { CONFIG } from '../config.js';
import { getNextUnlockInfo } from '../systems/progression.js';
import { createRunState } from '../systems/run.js';
import { getMenuButtons, pointInRect } from '../ui/layout.js';
import { clear, drawBar, drawDisplayTitle, drawMenuHotspot, drawPhaseBackground, drawRect, drawText } from '../ui/renderer.js';

// Present persistent progression and entry points into a run or codex.
export class MenuState {
  constructor(stateManager, game) {
    this.stateManager = stateManager;
    this.game = game;
    this.buttons = getMenuButtons();
  }

  // Keep the menu stateless between visits.
  enter() {}

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
    drawDisplayTitle(ctx, 'WYRMPIT', CONFIG.MENU_TITLE_X, CONFIG.MENU_TITLE_Y);
    drawText(ctx, `HIGH SCORE ${this.game.saveData.highScore}`, CONFIG.MENU_STATS_PANEL_X + (CONFIG.MENU_STATS_PANEL_WIDTH / 2), CONFIG.MENU_SCORE_Y, CONFIG.FONT_SIZE_HEADER);
    const nextUnlock = getNextUnlockInfo(this.game.saveData.totalXP);
    const label = nextUnlock
      ? `XP ${this.game.saveData.totalXP} - NEXT: ${nextUnlock.name}`
      : `XP ${this.game.saveData.totalXP} - ALL DRAGONS UNLOCKED`;
    const ratio = nextUnlock ? nextUnlock.current / nextUnlock.required : 1;
    drawText(ctx, label, CONFIG.MENU_STATS_PANEL_X + (CONFIG.MENU_STATS_PANEL_WIDTH / 2), CONFIG.MENU_XP_LABEL_Y, CONFIG.FONT_SIZE_HEADER);
    drawBar(ctx, CONFIG.MENU_XP_BAR_X, CONFIG.MENU_XP_BAR_Y, CONFIG.MENU_XP_BAR_WIDTH, CONFIG.MENU_XP_BAR_HEIGHT, ratio, CONFIG.GOLD_COLOR);
    drawMenuHotspot(ctx, this.buttons.newRun, this.getNewRunLabel(), 'NEW RUN', CONFIG.ACCENT_PRIMARY);
    drawMenuHotspot(ctx, this.buttons.codex, this.getCodexLabel(), 'CODEX', CONFIG.ACCENT_SECONDARY);
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
    if (pointInRect(point, this.buttons.newRun)) {
      this.game.run = createRunState(this.game.saveData.unlockedDragons);
      this.stateManager.change('prep');
      return;
    }
    if (pointInRect(point, this.buttons.codex)) this.stateManager.change('codex');
  }
}
