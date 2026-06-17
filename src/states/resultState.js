import { CONFIG } from '../config.js';
import { createRunState } from '../systems/run.js';
import { getResultButton, pointInRect } from '../ui/layout.js';
import { clear, drawArenaBackdrop, drawButton, drawText } from '../ui/renderer.js';

// Show a simple end-of-run summary for Milestone 2.
export class ResultState {
  constructor(stateManager, game) {
    this.stateManager = stateManager;
    this.game = game;
    this.payload = null;
    this.button = getResultButton();
  }

  // Store result payload.
  enter(payload) {
    this.payload = payload;
  }

  // Keep result screen static.
  update() {}

  // Draw the result summary.
  render(ctx) {
    clear(ctx);
    drawArenaBackdrop(ctx);
    const run = this.payload.run;
    const title = this.payload.victory ? 'RUN CLEARED' : `DEFEATED AT ROUND ${run.round}`;
    drawText(ctx, title, CONFIG.CANVAS_WIDTH / 2, CONFIG.ARENA_TITLE_Y, CONFIG.FONT_SIZE_TITLE);
    drawText(ctx, `Rounds survived: ${run.roundsSurvived}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.ARENA_SUBTITLE_Y, CONFIG.FONT_SIZE_BODY);
    drawText(ctx, `XP earned placeholder: ${run.roundsSurvived * CONFIG.XP_PER_ROUND_SURVIVED}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.ARENA_SUBTITLE_Y + CONFIG.BUTTON_HEIGHT, CONFIG.FONT_SIZE_BODY, CONFIG.TEXT_SECONDARY);
    drawButton(ctx, this.button, 'PLAY AGAIN');
  }

  // Restart the run when Play Again is clicked.
  handlePointerDown(point) {
    if (!pointInRect(point, this.button)) return;
    this.game.run = createRunState();
    this.stateManager.change('prep');
  }
}
