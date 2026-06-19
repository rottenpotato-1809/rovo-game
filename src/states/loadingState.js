import { CONFIG } from '../config.js';
import { clear, drawBar, drawGameTitle, drawPhaseBackground, drawText } from '../ui/renderer.js';

// Present asset preload progress before entering the interactive menu.
export class LoadingState {
  constructor() {
    this.progress = 0;
  }

  // Reset progress when a fresh boot begins.
  enter() {
    this.progress = 0;
  }

  // Loading progress is driven by completed image requests.
  update() {}

  // Draw the loading artwork, title, progress label, and bar.
  render(ctx) {
    clear(ctx);
    drawPhaseBackground(ctx, 'loading');
    drawGameTitle(ctx, {
      x: CONFIG.LOADING_TITLE_X,
      y: CONFIG.LOADING_TITLE_Y,
      width: CONFIG.LOADING_TITLE_WIDTH,
      height: CONFIG.LOADING_TITLE_HEIGHT,
    });
    drawText(
      ctx,
      `LOADING ${Math.round(this.progress * CONFIG.PERCENT_MULTIPLIER)}%`,
      CONFIG.CANVAS_WIDTH / 2,
      CONFIG.LOADING_LABEL_Y,
      CONFIG.FONT_SIZE_HEADER,
    );
    drawBar(
      ctx,
      CONFIG.LOADING_BAR_X,
      CONFIG.LOADING_BAR_Y,
      CONFIG.LOADING_BAR_WIDTH,
      CONFIG.LOADING_BAR_HEIGHT,
      this.progress,
      CONFIG.LOADING_BAR_COLOR,
    );
  }

  // Store normalized progress reported by the shared asset loader.
  setProgress(progress) {
    this.progress = Math.max(0, Math.min(CONFIG.ARENA_ALIVE_ALPHA, progress));
  }
}
