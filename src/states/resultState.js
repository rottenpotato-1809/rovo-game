import { CONFIG } from '../config.js';
import { getDragon } from '../data/dragons.js';
import { save } from '../persistence/save.js';
import { calculateXP, checkUnlocks, getNextUnlockInfo } from '../systems/progression.js';
import { createRunState } from '../systems/run.js';
import { getFullResultButtons, pointInRect } from '../ui/layout.js';
import { clear, drawButton, drawCircle, drawFitText, drawPhaseBackground, drawRect, drawText } from '../ui/renderer.js';

// Summarize a run and immediately persist its score and progression rewards.
export class ResultState {
  constructor(stateManager, game) {
    this.stateManager = stateManager;
    this.game = game;
    this.summary = null;
    this.buttons = getFullResultButtons();
  }

  // Calculate rewards once and save them immediately.
  enter(payload) {
    const bossDamage = payload.bossDamage || 0;
    const roundsSurvived = payload.run.roundsSurvived;
    const earnedXP = calculateXP(roundsSurvived, bossDamage);
    const previousUnlocked = [...this.game.saveData.unlockedDragons];
    const totalXP = this.game.saveData.totalXP + earnedXP;
    const unlockedDragons = checkUnlocks(totalXP);
    const newlyUnlocked = unlockedDragons.filter(id => !previousUnlocked.includes(id));
    const newHighScore = bossDamage > this.game.saveData.highScore;
    this.game.saveData = save({
      ...this.game.saveData,
      totalXP,
      highScore: Math.max(this.game.saveData.highScore, bossDamage),
      unlockedDragons,
      activeRun: null,
    });
    this.game.run = null;
    this.summary = {
      roundsSurvived,
      bossDamage,
      reachedBoss: Boolean(payload.reachedBoss),
      earnedXP,
      totalXP,
      newHighScore,
      newlyUnlocked,
      discoveries: [...payload.run.lastDiscoveries],
    };
  }

  // Keep results static.
  update() {}

  // Draw complete run rewards and navigation commands.
  render(ctx) {
    clear(ctx);
    drawPhaseBackground(ctx, 'menu');
    const panel = {
      x: CONFIG.RESULT_PANEL_X,
      y: CONFIG.RESULT_PANEL_Y,
      width: CONFIG.RESULT_PANEL_WIDTH,
      height: CONFIG.RESULT_PANEL_HEIGHT,
    };
    ctx.lineWidth = CONFIG.RESULT_PANEL_LINE_WIDTH;
    drawRect(ctx, panel, CONFIG.UI_PANEL_COLOR, CONFIG.GOLD_COLOR);
    drawRect(ctx, {
      x: panel.x + CONFIG.RESULT_PANEL_INSET,
      y: panel.y + CONFIG.RESULT_PANEL_INSET,
      width: panel.width - (CONFIG.RESULT_PANEL_INSET * 2),
      height: panel.height - (CONFIG.RESULT_PANEL_INSET * 2),
    }, CONFIG.UI_PANEL_SOFT_COLOR, CONFIG.TEXT_SECONDARY);
    drawText(ctx, this.summary.reachedBoss ? 'RUN COMPLETE' : 'RUN OVER', CONFIG.CANVAS_WIDTH / 2, CONFIG.RESULT_TITLE_Y, CONFIG.FONT_SIZE_RESULT_TITLE, CONFIG.GOLD_COLOR);
    this.getSummaryRows().forEach((row, index) => this.renderSummaryRow(ctx, row, index));
    const notice = this.getNotice();
    if (notice) drawFitText(ctx, notice, CONFIG.CANVAS_WIDTH / 2, CONFIG.RESULT_NOTICE_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.RESULT_NOTICE_MAX_WIDTH, CONFIG.FONT_SIZE_CARD_TITLE_MIN, CONFIG.GOLD_COLOR);
    drawButton(ctx, this.buttons.playAgain, 'PLAY AGAIN', CONFIG.ACCENT_PRIMARY);
    drawButton(ctx, this.buttons.menu, 'MAIN MENU', CONFIG.ACCENT_SECONDARY);
  }

  // Return structured result rows for separate labels and values.
  getSummaryRows() {
    return [
      { badge: 'R', label: 'ROUNDS SURVIVED', value: `${this.summary.roundsSurvived}`, color: CONFIG.ACCENT_SECONDARY, valueColor: CONFIG.TEXT_PRIMARY },
      { badge: 'B', label: 'BOSS DAMAGE', value: this.summary.reachedBoss ? `${this.summary.bossDamage}` : 'NOT REACHED', color: CONFIG.ACCENT_PRIMARY, valueColor: CONFIG.ACCENT_PRIMARY },
      { badge: 'XP', label: 'XP EARNED', value: `+${this.summary.earnedXP}`, color: CONFIG.ELEMENT_COLORS.water, valueColor: CONFIG.ELEMENT_COLORS.water },
      { badge: 'XP', label: 'TOTAL XP', value: `${this.summary.totalXP}`, color: CONFIG.GOLD_COLOR, valueColor: CONFIG.GOLD_COLOR },
      { badge: 'HS', label: 'HIGH SCORE', value: `${this.game.saveData.highScore}${this.summary.newHighScore ? ' NEW!' : ''}`, color: CONFIG.ELEMENT_COLORS.shadow, valueColor: CONFIG.GOLD_COLOR },
    ];
  }

  // Draw one badge, label, value, and divider in the result panel.
  renderSummaryRow(ctx, row, index) {
    const y = CONFIG.RESULT_LINE_START_Y + (index * CONFIG.RESULT_LINE_GAP);
    drawCircle(ctx, CONFIG.RESULT_ROW_BADGE_X, y, CONFIG.RESULT_ROW_BADGE_RADIUS, row.color, CONFIG.ARENA_ALIVE_ALPHA, CONFIG.TEXT_PRIMARY);
    drawText(ctx, row.badge, CONFIG.RESULT_ROW_BADGE_X, y, CONFIG.FONT_SIZE_STATS);
    drawText(ctx, row.label, CONFIG.RESULT_ROW_LABEL_X, y, CONFIG.FONT_SIZE_BODY, CONFIG.TEXT_PRIMARY, 'left');
    drawFitText(ctx, row.value, CONFIG.RESULT_ROW_VALUE_X, y, CONFIG.FONT_SIZE_BODY, CONFIG.RESULT_ROW_VALUE_X - CONFIG.RESULT_ROW_LABEL_X, CONFIG.FONT_SIZE_CARD_TITLE_MIN, row.valueColor, 'right');
    ctx.strokeStyle = CONFIG.RESULT_ROW_DIVIDER_COLOR;
    ctx.lineWidth = CONFIG.ARENA_LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(CONFIG.RESULT_ROW_DIVIDER_LEFT, y + CONFIG.RESULT_ROW_DIVIDER_OFFSET_Y);
    ctx.lineTo(CONFIG.RESULT_ROW_DIVIDER_RIGHT, y + CONFIG.RESULT_ROW_DIVIDER_OFFSET_Y);
    ctx.stroke();
  }

  // Return the highest-priority progression notification.
  getNotice() {
    if (!getNextUnlockInfo(this.summary.totalXP)) return '';
    if (this.summary.newlyUnlocked.length > 0) {
      return `UNLOCKED: ${this.summary.newlyUnlocked.map(id => getDragon(id).name).join(', ')}`;
    }
    if (this.summary.discoveries.length > 0) {
      const discovery = this.summary.discoveries[0];
      return `NEW DISCOVERY: ${discovery.name} T${discovery.tier}`;
    }
    return 'Draft again. Climb higher.';
  }

  // Start another run or return to the persistent menu.
  handlePointerDown(point) {
    if (pointInRect(point, this.buttons.playAgain)) {
      this.game.run = createRunState(this.game.saveData.unlockedDragons);
      this.stateManager.change('prep');
      return;
    }
    if (pointInRect(point, this.buttons.menu)) {
      this.game.run = null;
      this.stateManager.change('menu');
    }
  }
}
