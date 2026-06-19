import { CONFIG } from '../config.js';
import { getBackgroundImage, getDragonImage, getGameTitleImage } from './assets.js';
import { getPointerState } from './pointer.js';

const buttonMotion = new Map();

// Clear the full canvas to the configured background color.
export function clear(ctx) {
  ctx.fillStyle = CONFIG.BG_COLOR;
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
}

// Fill the logical canvas with one phase-specific bitmap background.
export function drawPhaseBackground(ctx, phase) {
  const image = getBackgroundImage(phase);
  if (!image || !image.complete || !image.naturalWidth) {
    return;
  }
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(image, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
  ctx.restore();
}

// Draw the shared Wyrmpit title artwork inside a configured rectangle.
export function drawGameTitle(ctx, rect) {
  const image = getGameTitleImage();
  if (!image || !image.complete || !image.naturalWidth) return;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
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
  ctx.strokeStyle = CONFIG.ARENA_LINE_COLOR;
  ctx.lineWidth = CONFIG.ARENA_LINE_WIDTH;
  ctx.beginPath();
  ctx.moveTo(0, CONFIG.ARENA_GROUND_Y);
  ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.ARENA_GROUND_Y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(
    CONFIG.CANVAS_WIDTH / 2,
    CONFIG.ARENA_CENTER_RING_Y,
    CONFIG.ARENA_CENTER_RING_RADIUS,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
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
  ctx.font = `${size}px ${CONFIG.FONT_FAMILY}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = CONFIG.TEXT_OUTLINE_COLOR;
  ctx.lineWidth = CONFIG.TEXT_OUTLINE_WIDTH;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
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

// Draw dragon identity, combat stats, and ability details in one hover panel.
export function drawDragonInspector(ctx, rect, dragon, tierData) {
  drawRect(ctx, rect, CONFIG.UI_PANEL_COLOR, CONFIG.GOLD_COLOR);
  const left = rect.x + CONFIG.DRAGON_INSPECTOR_PADDING;
  const right = rect.x + rect.width - CONFIG.DRAGON_INSPECTOR_PADDING;
  const firstLine = rect.y + CONFIG.DRAGON_INSPECTOR_PADDING;
  drawFitText(ctx, `${dragon.name} T${tierData.tier}`, left, firstLine, CONFIG.FONT_SIZE_HEADER, rect.width - (CONFIG.DRAGON_INSPECTOR_PADDING * 2), CONFIG.FONT_SIZE_CARD_TITLE_MIN, CONFIG.TEXT_PRIMARY, 'left');
  drawText(ctx, `ATK ${tierData.atk}  HP ${tierData.hp}  SPD ${tierData.spd}`, left, firstLine + CONFIG.DRAGON_INSPECTOR_LINE_GAP, CONFIG.FONT_SIZE_STATS, CONFIG.TEXT_SECONDARY, 'left');
  drawFitText(ctx, tierData.abilityName, right, firstLine + CONFIG.DRAGON_INSPECTOR_LINE_GAP, CONFIG.FONT_SIZE_DRAGON_NAME, rect.width / 2, CONFIG.FONT_SIZE_CARD_META_MIN, CONFIG.GOLD_COLOR, 'right');
  drawFitText(ctx, tierData.abilityDesc, left, firstLine + (CONFIG.DRAGON_INSPECTOR_LINE_GAP * 2), CONFIG.FONT_SIZE_STATS, rect.width - (CONFIG.DRAGON_INSPECTOR_PADDING * 2), CONFIG.FONT_SIZE_SMALL, CONFIG.TEXT_PRIMARY, 'left');
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
export function drawButton(ctx, rect, label, fill = CONFIG.ACCENT_PRIMARY, fontSize = CONFIG.FONT_SIZE_BUTTON) {
  const pointer = getPointerState();
  const hovered = pointInRect(pointer, rect);
  const targetScale = pointer.pressed && hovered
    ? CONFIG.BUTTON_PRESS_SCALE
    : hovered
      ? CONFIG.BUTTON_HOVER_SCALE
      : CONFIG.ARENA_ALIVE_ALPHA;
  const key = `${rect.x}:${rect.y}:${rect.width}:${rect.height}`;
  const now = globalThis.performance ? globalThis.performance.now() : Date.now();
  const motion = buttonMotion.get(key) || { scale: CONFIG.ARENA_ALIVE_ALPHA, time: now };
  const elapsed = Math.max(0, now - motion.time);
  const progress = Math.min(CONFIG.ARENA_ALIVE_ALPHA, elapsed / CONFIG.BUTTON_MOTION_DURATION_MS);
  motion.scale += (targetScale - motion.scale) * progress;
  motion.time = now;
  buttonMotion.set(key, motion);
  const centerX = rect.x + (rect.width / 2);
  const centerY = rect.y + (rect.height / 2);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(motion.scale, motion.scale);
  ctx.translate(-centerX, -centerY);
  ctx.shadowColor = hovered ? fill : CONFIG.BUTTON_SHADOW_COLOR;
  ctx.shadowBlur = hovered ? CONFIG.BUTTON_GLOW_BLUR : 0;
  ctx.shadowOffsetY = pointer.pressed && hovered ? 0 : CONFIG.BUTTON_SHADOW_OFFSET_Y;
  drawRect(ctx, rect, fill, CONFIG.TEXT_PRIMARY);
  ctx.shadowColor = 'transparent';
  drawText(
    ctx,
    label,
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    fontSize,
  );
  ctx.restore();
}

// Draw an animated command button over its illustrated-scene hotspot.
export function drawMenuHotspot(ctx, labelRect, label) {
  drawButton(ctx, labelRect, label, CONFIG.UI_PANEL_COLOR);
}

// Draw one dragon's bitmap artwork with a distinct animated Tier 3 aura.
export function drawDragonSprite(
  ctx,
  dragon,
  x,
  y,
  radius,
  alpha = CONFIG.ARENA_ALIVE_ALPHA,
  scale = CONFIG.ARENA_ALIVE_ALPHA,
  mirrored = false,
) {
  const image = getDragonImage(dragon.id, dragon.tier);
  const tierScale = getDragonTierScale(dragon.tier);
  const spriteSize = radius * CONFIG.DRAGON_SPRITE_SCALE * scale * tierScale;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (dragon.tier >= CONFIG.MAX_TIER) drawTierThreeAura(ctx, x, y, radius * scale * tierScale);
  if (image && image.complete && image.naturalWidth) {
    ctx.imageSmoothingEnabled = true;
    ctx.translate(x, y);
    ctx.scale(mirrored ? -1 : 1, 1);
    ctx.drawImage(image, -(spriteSize / 2), -(spriteSize / 2), spriteSize, spriteSize);
  } else {
    const color = CONFIG.ELEMENT_COLORS[dragon.element] || CONFIG.ACCENT_SECONDARY;
    drawCircle(ctx, x, y, radius, color, alpha, CONFIG.TEXT_PRIMARY);
  }
  ctx.restore();
}

// Keep baby forms smaller while Tier 2 and Tier 3 use the adult silhouette scale.
export function getDragonTierScale(tier) {
  if (tier >= CONFIG.MAX_TIER) return CONFIG.DRAGON_TIER_THREE_SCALE;
  if (tier >= 2) return CONFIG.DRAGON_TIER_TWO_SCALE;
  return CONFIG.DRAGON_TIER_ONE_SCALE;
}

// Draw a dragon portrait, name, and HP bar for battle playback.
export function drawDragon(ctx, dragon, view) {
  const hpRatio = dragon.maxHp > 0 ? dragon.hp / dragon.maxHp : 0;
  const hpColor = hpRatio < CONFIG.ARENA_HP_LOW_THRESHOLD
    ? CONFIG.HP_BAR_LOW
    : hpRatio < CONFIG.ARENA_HP_HIGH_THRESHOLD
      ? CONFIG.HP_BAR_MID
      : CONFIG.HP_BAR_FULL;
  const isPlayer = dragon.team === 'player';
  const infoX = view.x + (CONFIG.ARENA_INFO_OFFSET_X * (isPlayer ? -1 : 1));
  const infoAlign = isPlayer ? 'right' : 'left';
  const barX = isPlayer ? infoX - CONFIG.HP_BAR_WIDTH_TEAM : infoX;
  if (view.hitFlash > 0) {
    drawCircle(ctx, view.x, view.y, CONFIG.DRAGON_RADIUS_FIGHT * CONFIG.ARENA_ABILITY_GLOW_RADIUS_MULTIPLIER, CONFIG.HP_BAR_LOW, view.hitFlash);
  }
  drawDragonSprite(
    ctx,
    dragon,
    view.x,
    view.y,
    CONFIG.DRAGON_RADIUS_FIGHT,
    view.alpha,
    view.scale || CONFIG.ARENA_ALIVE_ALPHA,
    isPlayer,
  );
  drawFitText(
    ctx,
    dragon.name,
    infoX,
    view.y + CONFIG.ARENA_INFO_NAME_OFFSET_Y,
    CONFIG.FONT_SIZE_DRAGON_NAME,
    CONFIG.HP_BAR_WIDTH_TEAM,
    CONFIG.FONT_SIZE_CARD_META_MIN,
    CONFIG.TEXT_PRIMARY,
    infoAlign,
  );
  drawBar(
    ctx,
    barX,
    view.y + CONFIG.ARENA_INFO_HP_OFFSET_Y,
    CONFIG.HP_BAR_WIDTH_TEAM,
    CONFIG.HP_BAR_HEIGHT,
    hpRatio,
    hpColor,
  );
}

// Draw a pulsing ring and orbiting motes around Tier 3 artwork.
function drawTierThreeAura(ctx, x, y, radius) {
  ctx.save();
  const now = globalThis.performance ? globalThis.performance.now() : Date.now();
  const cycle = (now % CONFIG.TIER_THREE_AURA_PULSE_MS) / CONFIG.TIER_THREE_AURA_PULSE_MS;
  const pulse = Math.sin(cycle * Math.PI * 2);
  const auraRadius = radius * CONFIG.TIER_THREE_AURA_RADIUS_MULTIPLIER * (CONFIG.ARENA_ALIVE_ALPHA + (pulse * 0.06));
  ctx.strokeStyle = CONFIG.GOLD_COLOR;
  ctx.lineWidth = CONFIG.TIER_THREE_AURA_LINE_WIDTH;
  ctx.globalAlpha *= 0.55 + ((pulse + CONFIG.ARENA_ALIVE_ALPHA) * 0.18);
  ctx.beginPath();
  ctx.arc(x, y, auraRadius, 0, Math.PI * 2);
  ctx.stroke();
  for (let index = 0; index < CONFIG.TIER_THREE_ORB_COUNT; index += 1) {
    const angle = (cycle * Math.PI * 2) + ((Math.PI * 2 * index) / CONFIG.TIER_THREE_ORB_COUNT);
    ctx.beginPath();
    ctx.arc(
      x + (Math.cos(angle) * auraRadius),
      y + (Math.sin(angle) * auraRadius),
      CONFIG.TIER_THREE_ORB_RADIUS,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = CONFIG.GOLD_COLOR;
    ctx.fill();
  }
  ctx.restore();
}

// Check pointer containment without coupling renderer code to layout helpers.
function pointInRect(point, rect) {
  return point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height;
}
