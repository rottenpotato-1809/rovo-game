import { CONFIG } from '../config.js';

// Clear the full canvas to the configured background color.
export function clear(ctx) {
  ctx.fillStyle = CONFIG.BG_COLOR;
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
}

// Paint a simple landscape battlefield behind the combat UI.
export function drawArenaBackdrop(ctx) {
  ctx.fillStyle = CONFIG.ARENA_SKY_COLOR;
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.ARENA_SKY_HEIGHT);
  ctx.fillStyle = CONFIG.ARENA_HORIZON_COLOR;
  ctx.fillRect(0, CONFIG.ARENA_HILL_Y, CONFIG.CANVAS_WIDTH, CONFIG.ARENA_GROUND_Y - CONFIG.ARENA_HILL_Y);
  ctx.fillStyle = CONFIG.ARENA_HILL_COLOR;
  ctx.fillRect(0, CONFIG.ARENA_HILL_Y, CONFIG.CANVAS_WIDTH, CONFIG.ARENA_GROUND_Y - CONFIG.ARENA_HILL_Y);
  ctx.fillStyle = CONFIG.ARENA_GROUND_COLOR;
  ctx.fillRect(0, CONFIG.ARENA_GROUND_Y, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT - CONFIG.ARENA_GROUND_Y);
  ctx.fillStyle = CONFIG.ARENA_GROUND_DARK_COLOR;
  ctx.fillRect(0, CONFIG.ARENA_FOREGROUND_Y, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT - CONFIG.ARENA_FOREGROUND_Y);
  drawCircle(
    ctx,
    CONFIG.ARENA_BACKDROP_SUN_X,
    CONFIG.ARENA_BACKDROP_SUN_Y,
    CONFIG.ARENA_BACKDROP_SUN_RADIUS,
    CONFIG.GOLD_COLOR,
    CONFIG.ARENA_ABILITY_GLOW_ALPHA,
  );
}

// Draw a filled rectangle with an optional border.
export function drawRect(ctx, rect, fill, stroke = null, radius = CONFIG.BUTTON_BORDER_RADIUS) {
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

// Draw a filled circle with optional alpha and outline.
export function drawCircle(ctx, x, y, radius, fill, alpha = CONFIG.ARENA_ALIVE_ALPHA, stroke = null) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
  ctx.restore();
}

// Draw centered or left-aligned text using canvas fonts.
export function drawText(ctx, text, x, y, size, color = CONFIG.TEXT_PRIMARY, align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${size}px ${CONFIG.FONT_FAMILY}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

// Draw text that shrinks to stay within a fixed max width.
export function drawFitText(ctx, text, x, y, size, maxWidth, minSize, color = CONFIG.TEXT_PRIMARY, align = 'center') {
  let fittedSize = size;
  ctx.font = `${fittedSize}px ${CONFIG.FONT_FAMILY}`;
  while (ctx.measureText(text).width > maxWidth && fittedSize > minSize) {
    fittedSize -= 1;
    ctx.font = `${fittedSize}px ${CONFIG.FONT_FAMILY}`;
  }
  drawText(ctx, text, x, y, fittedSize, color, align);
}

// Draw a horizontal value bar for HP and shields.
export function drawBar(ctx, x, y, width, height, ratio, fill) {
  const clamped = Math.max(0, Math.min(CONFIG.ARENA_ALIVE_ALPHA, ratio));
  ctx.fillStyle = CONFIG.HP_BAR_BG;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width * clamped, height);
}

// Draw a button-shaped card with centered text.
export function drawButton(ctx, rect, label, fill = CONFIG.ACCENT_PRIMARY) {
  drawRect(ctx, rect, fill, CONFIG.TEXT_PRIMARY);
  drawText(
    ctx,
    label,
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    CONFIG.FONT_SIZE_BUTTON,
  );
}

// Draw a dragon portrait, name, and HP bar for battle playback.
export function drawDragon(ctx, dragon, view) {
  const hpRatio = dragon.maxHp > 0 ? dragon.hp / dragon.maxHp : 0;
  const hpColor = hpRatio < CONFIG.ARENA_HP_LOW_THRESHOLD
    ? CONFIG.HP_BAR_LOW
    : hpRatio < CONFIG.ARENA_HP_HIGH_THRESHOLD
      ? CONFIG.HP_BAR_MID
      : CONFIG.HP_BAR_FULL;
  const color = CONFIG.ELEMENT_COLORS[dragon.element] || CONFIG.ACCENT_SECONDARY;
  drawCircle(ctx, view.x, view.y, CONFIG.DRAGON_RADIUS_FIGHT, color, view.alpha, CONFIG.TEXT_PRIMARY);
  drawText(ctx, dragon.emoji || '?', view.x, view.y, CONFIG.FONT_SIZE_EMOJI, CONFIG.TEXT_PRIMARY);
  drawText(ctx, dragon.name, view.x, view.y + CONFIG.ARENA_NAME_OFFSET_Y, CONFIG.FONT_SIZE_DRAGON_NAME);
  drawBar(
    ctx,
    view.x - CONFIG.HP_BAR_WIDTH_TEAM / 2,
    view.y - CONFIG.ARENA_HP_OFFSET_Y,
    CONFIG.HP_BAR_WIDTH_TEAM,
    CONFIG.HP_BAR_HEIGHT,
    hpRatio,
    hpColor,
  );
}
