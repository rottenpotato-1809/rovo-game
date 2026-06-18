import { CONFIG } from '../config.js';
import { getDragon } from '../data/dragons.js';
import { save } from '../persistence/save.js';
import { calculateXP, checkUnlocks } from '../systems/progression.js';
import { createRunState } from '../systems/run.js';
import { getFullResultButtons, pointInRect } from '../ui/layout.js';
import { clear, drawArenaBackdrop, drawButton, drawFitText, drawText } from '../ui/renderer.js';

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
    });
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
    drawArenaBackdrop(ctx);
    drawText(ctx, this.summary.reachedBoss ? 'RUN COMPLETE' : 'RUN OVER', CONFIG.CANVAS_WIDTH / 2, CONFIG.RESULT_TITLE_Y, CONFIG.FONT_SIZE_TITLE, CONFIG.GOLD_COLOR);
    const lines = [
      `ROUNDS SURVIVED ${this.summary.roundsSurvived}`,
      this.summary.reachedBoss ? `BOSS DAMAGE ${this.summary.bossDamage}` : 'BOSS NOT REACHED',
      `XP EARNED +${this.summary.earnedXP}`,
      `TOTAL XP ${this.summary.totalXP}`,
      `HIGH SCORE ${this.game.saveData.highScore}${this.summary.newHighScore ? ' NEW!' : ''}`,
    ];
    lines.forEach((line, index) => drawText(ctx, line, CONFIG.CANVAS_WIDTH / 2, CONFIG.RESULT_LINE_START_Y + (index * CONFIG.RESULT_LINE_GAP), CONFIG.FONT_SIZE_BODY));
    const notice = this.getNotice();
    drawFitText(ctx, notice, CONFIG.CANVAS_WIDTH / 2, CONFIG.RESULT_NOTICE_Y, CONFIG.FONT_SIZE_HEADER, CONFIG.MENU_XP_BAR_WIDTH, CONFIG.FONT_SIZE_CARD_TITLE_MIN, CONFIG.TEXT_SECONDARY);
    drawButton(ctx, this.buttons.playAgain, 'PLAY AGAIN', CONFIG.ACCENT_PRIMARY);
    drawButton(ctx, this.buttons.menu, 'MAIN MENU', CONFIG.ACCENT_SECONDARY);
  }

  // Return the highest-priority progression notification.
  getNotice() {
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
