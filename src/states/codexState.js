import { CONFIG } from '../config.js';
import { DRAGONS } from '../data/dragons.js';
import { getCodexBackButton, getCodexCell, pointInRect } from '../ui/layout.js';
import { clear, drawButton, drawCircle, drawDragonInspector, drawDragonSprite, drawFitText, drawPhaseBackground, drawRect, drawText } from '../ui/renderer.js';

// Display the persistent 8-by-3 dragon discovery collection.
export class CodexState {
  constructor(stateManager, game) {
    this.stateManager = stateManager;
    this.game = game;
    this.backButton = getCodexBackButton();
    this.hoveredEntry = null;
  }

  // Keep the codex stateless between visits.
  enter() {
    this.hoveredEntry = null;
  }

  // Keep the codex static.
  update() {}

  // Draw every dragon tier as discovered details or a locked silhouette.
  render(ctx) {
    clear(ctx);
    drawPhaseBackground(ctx, 'codex');
    DRAGONS.forEach((dragon, column) => {
      dragon.tiers.forEach((tier, row) => this.renderCell(ctx, dragon, tier, column, row));
    });
    if (this.hoveredEntry) {
      drawDragonInspector(ctx, {
        x: CONFIG.CODEX_INSPECTOR_X,
        y: CONFIG.CODEX_INSPECTOR_Y,
        width: CONFIG.CODEX_INSPECTOR_WIDTH,
        height: CONFIG.CODEX_INSPECTOR_HEIGHT,
      }, this.hoveredEntry.dragon, this.hoveredEntry.tierData);
    } else {
      const discovered = Object.values(this.game.saveData.codex).filter(Boolean).length;
      drawText(ctx, `DISCOVERED ${discovered}/${DRAGONS.length * CONFIG.MAX_TIER}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CODEX_FOOTER_Y, CONFIG.FONT_SIZE_HEADER);
    }
    drawButton(ctx, this.backButton, 'BACK', CONFIG.ACCENT_SECONDARY);
  }

  // Draw one codex entry.
  renderCell(ctx, dragon, tier, column, row) {
    const rect = getCodexCell(column, row);
    const unlocked = Boolean(this.game.saveData.codex[`${dragon.id}_${tier.tier}`]);
    drawRect(ctx, rect, CONFIG.CARD_BG_COLOR, unlocked ? CONFIG.ELEMENT_COLORS[dragon.element] : CONFIG.BENCH_EMPTY_BORDER);
    const centerX = rect.x + rect.width / 2;
    const portraitY = rect.y + CONFIG.CODEX_PORTRAIT_Y_OFFSET;
    if (unlocked) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(rect.x + 2, rect.y + 2, rect.width - 4, rect.height - 4, CONFIG.BUTTON_BORDER_RADIUS);
      ctx.clip();
      drawDragonSprite(ctx, { ...dragon, tier: tier.tier }, centerX, portraitY, CONFIG.CODEX_DRAGON_RADIUS, CONFIG.ARENA_ALIVE_ALPHA, CONFIG.ARENA_ALIVE_ALPHA, true);
      ctx.restore();
    } else {
      drawCircle(ctx, centerX, portraitY, CONFIG.CODEX_DRAGON_RADIUS, CONFIG.TEXT_MUTED, CONFIG.ARENA_ALIVE_ALPHA, CONFIG.TEXT_PRIMARY);
      drawText(ctx, '?', centerX, portraitY, CONFIG.FONT_SIZE_HEADER);
    }
    drawFitText(ctx, unlocked ? dragon.name : '???', centerX, rect.y + CONFIG.CODEX_NAME_Y_OFFSET, CONFIG.FONT_SIZE_DRAGON_NAME, rect.width - CONFIG.PREP_CARD_TEXT_LEFT_PAD, CONFIG.FONT_SIZE_CARD_META_MIN);
    drawText(ctx, unlocked ? `T${tier.tier}` : 'LOCKED', centerX, rect.y + CONFIG.CODEX_TIER_Y_OFFSET, CONFIG.FONT_SIZE_STATS, CONFIG.TEXT_SECONDARY);
  }

  // Return to the main menu.
  handlePointerDown(point) {
    if (pointInRect(point, this.backButton)) this.stateManager.change('menu');
  }

  // Show details only for a discovered codex entry under the pointer.
  handlePointerMove(point) {
    this.hoveredEntry = null;
    DRAGONS.forEach((dragon, column) => {
      dragon.tiers.forEach((tierData, row) => {
        if (!pointInRect(point, getCodexCell(column, row))) return;
        if (this.game.saveData.codex[`${dragon.id}_${tierData.tier}`]) {
          this.hoveredEntry = { dragon, tierData };
        }
      });
    });
  }
}
