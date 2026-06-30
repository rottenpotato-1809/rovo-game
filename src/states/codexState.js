import { CONFIG } from '../config.js';
import { DRAGONS } from '../data/dragons.js';
import { getCodexBackButton, getCodexCell, pointInRect } from '../ui/layout.js';
import { clear, drawButton, drawCircle, drawDragonInspector, drawDragonSprite, drawFitText, drawPhaseBackground, drawRect, drawText } from '../ui/renderer.js';

function colorWithAlpha(hexColor, alpha) {
  const hex = hexColor.replace('#', '');
  const value = Number.parseInt(hex, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

// Display the persistent 8-by-3 dragon discovery collection.
export class CodexState {
  constructor(stateManager, game) {
    this.stateManager = stateManager;
    this.game = game;
    this.backButton = getCodexBackButton();
    this.hoveredEntry = null;
    this.hoverPoint = null;
  }

  // Keep the codex stateless between visits.
  enter() {
    this.hoveredEntry = null;
    this.hoverPoint = null;
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
      drawDragonInspector(ctx, this.getTooltipRect(), this.hoveredEntry.dragon, this.hoveredEntry.tierData);
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
    const elementColor = CONFIG.ELEMENT_COLORS[dragon.element] || CONFIG.GOLD_COLOR;
    const borderColor = unlocked
      ? colorWithAlpha(elementColor, CONFIG.CODEX_CARD_BORDER_ALPHA)
      : CONFIG.CODEX_LOCKED_BORDER_COLOR;
    ctx.save();
    ctx.lineWidth = 1.5;
    drawRect(ctx, rect, CONFIG.CODEX_CARD_BG_COLOR, borderColor, CONFIG.CODEX_LAYOUT.CARD_CORNER_RADIUS);
    ctx.restore();
    const centerX = rect.x + rect.width / 2;
    const portraitY = rect.y + (rect.height * 0.32);
    const nameY = rect.y + (rect.height * 0.72);
    const tierY = rect.y + (rect.height * 0.91);
    if (unlocked) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(rect.x + 2, rect.y + 2, rect.width - 4, rect.height - 4, CONFIG.CODEX_LAYOUT.CARD_CORNER_RADIUS);
      ctx.clip();
      drawDragonSprite(ctx, { ...dragon, tier: tier.tier }, centerX, portraitY, CONFIG.CODEX_DRAGON_RADIUS, CONFIG.ARENA_ALIVE_ALPHA, CONFIG.ARENA_ALIVE_ALPHA, true);
      ctx.restore();
    } else {
      drawCircle(ctx, centerX, portraitY, CONFIG.CODEX_DRAGON_RADIUS, CONFIG.TEXT_MUTED, CONFIG.ARENA_ALIVE_ALPHA, CONFIG.TEXT_PRIMARY);
      drawText(ctx, '?', centerX, portraitY, CONFIG.FONT_SIZE_HEADER);
    }
    drawFitText(ctx, unlocked ? dragon.name : '???', centerX, nameY, CONFIG.FONT_SIZE_DRAGON_NAME, rect.width - CONFIG.PREP_CARD_TEXT_LEFT_PAD, CONFIG.FONT_SIZE_CARD_META_MIN);
    drawText(ctx, unlocked ? `T${tier.tier}` : 'LOCKED', centerX, tierY, CONFIG.FONT_SIZE_STATS, CONFIG.TEXT_SECONDARY);
  }

  // Keep hover details near the pointer without letting the panel leave the canvas.
  getTooltipRect() {
    const point = this.hoverPoint || { x: CONFIG.CANVAS_WIDTH / 2, y: CONFIG.CANVAS_HEIGHT / 2 };
    const offset = CONFIG.CODEX_TOOLTIP_OFFSET;
    let x = point.x + offset;
    let y = point.y + offset;
    if (x + CONFIG.CODEX_INSPECTOR_WIDTH > CONFIG.CANVAS_WIDTH - offset) {
      x = point.x - CONFIG.CODEX_INSPECTOR_WIDTH - offset;
    }
    if (y + CONFIG.CODEX_INSPECTOR_HEIGHT > CONFIG.CANVAS_HEIGHT - offset) {
      y = point.y - CONFIG.CODEX_INSPECTOR_HEIGHT - offset;
    }
    return {
      x: Math.max(offset, Math.min(x, CONFIG.CANVAS_WIDTH - CONFIG.CODEX_INSPECTOR_WIDTH - offset)),
      y: Math.max(offset, Math.min(y, CONFIG.CANVAS_HEIGHT - CONFIG.CODEX_INSPECTOR_HEIGHT - offset)),
      width: CONFIG.CODEX_INSPECTOR_WIDTH,
      height: CONFIG.CODEX_INSPECTOR_HEIGHT,
    };
  }

  // Return to the main menu.
  handlePointerDown(point) {
    if (pointInRect(point, this.backButton)) this.stateManager.change('menu');
  }

  // Show details only for a discovered codex entry under the pointer.
  handlePointerMove(point) {
    this.hoveredEntry = null;
    this.hoverPoint = null;
    DRAGONS.forEach((dragon, column) => {
      dragon.tiers.forEach((tierData, row) => {
        if (!pointInRect(point, getCodexCell(column, row))) return;
        if (this.game.saveData.codex[`${dragon.id}_${tierData.tier}`]) {
          this.hoveredEntry = { dragon, tierData };
          this.hoverPoint = point;
        }
      });
    });
  }
}
