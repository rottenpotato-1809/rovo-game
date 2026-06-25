import { CONFIG } from '../config.js';
import { getBackgroundImage, getBossImage, getDragonImage, getGameTitleImage } from './assets.js';
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

// Draw the animated crystal core used by the Eternal Wyrm boss encounter.
export function drawBossSprite(ctx, x, y, scale = CONFIG.ARENA_ALIVE_ALPHA) {
  const image = getBossImage();
  const size = CONFIG.BOSS_SPRITE_SIZE * scale;
  if (!image || !image.complete || !image.naturalWidth) {
    drawCircle(ctx, x, y, CONFIG.BOSS_RADIUS * scale, CONFIG.BOSS_HP_COLOR, CONFIG.ARENA_ALIVE_ALPHA, CONFIG.TEXT_PRIMARY);
    return;
  }
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate(x, y);
  ctx.drawImage(image, -(size / 2), -(size / 2), size, size);
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
  const elementColor = CONFIG.ELEMENT_COLORS[dragon.element] || CONFIG.GOLD_COLOR;
  drawRect(ctx, rect, CONFIG.UI_PANEL_COLOR, elementColor);
  const left = rect.x + CONFIG.DRAGON_INSPECTOR_PADDING;
  const right = rect.x + rect.width - CONFIG.DRAGON_INSPECTOR_PADDING;
  const firstLine = rect.y + CONFIG.DRAGON_INSPECTOR_CONTENT_OFFSET_Y;
  drawFitText(ctx, `${dragon.name} T${tierData.tier}`, left, firstLine, CONFIG.FONT_SIZE_HEADER, rect.width - (CONFIG.DRAGON_INSPECTOR_PADDING * 2), CONFIG.FONT_SIZE_CARD_TITLE_MIN, CONFIG.TEXT_PRIMARY, 'left');
  drawText(ctx, `ATK ${tierData.atk}  HP ${tierData.hp}  SPD ${tierData.spd}`, left, firstLine + CONFIG.DRAGON_INSPECTOR_LINE_GAP, CONFIG.FONT_SIZE_STATS, CONFIG.TEXT_SECONDARY, 'left');
  drawFitText(ctx, tierData.abilityName, right, firstLine + CONFIG.DRAGON_INSPECTOR_LINE_GAP, CONFIG.FONT_SIZE_DRAGON_NAME, rect.width / 2, CONFIG.FONT_SIZE_CARD_META_MIN, elementColor, 'right');
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
export function drawButton(ctx, rect, label, accent = CONFIG.GOLD_COLOR, fontSize = CONFIG.FONT_SIZE_BUTTON, options = {}) {
  const pointer = getPointerState();
  const disabled = options.disabled || false;
  const hovered = !disabled && pointInRect(pointer, rect);
  const pressed = pointer.pressed && hovered;
  const targetScale = pressed
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
  const yOffset = pressed ? 1 : hovered ? -1 : 0;
  const buttonRect = { ...rect, y: rect.y + yOffset };
  const borderAlpha = hovered ? CONFIG.BUTTON_BORDER_HOVER_ALPHA : CONFIG.BUTTON_BORDER_REST_ALPHA;
  const borderColor = disabled
    ? CONFIG.BUTTON_BORDER_DISABLED
    : colorWithAlpha(CONFIG.BUTTON_BORDER_COLOR, pressed ? CONFIG.BUTTON_BORDER_HOVER_ALPHA : borderAlpha);
  const fill = disabled
    ? CONFIG.BUTTON_FILL_DISABLED
    : hovered
      ? CONFIG.BUTTON_FILL_HOVER
      : CONFIG.BUTTON_FILL_COLOR;
  const textColor = disabled ? CONFIG.BUTTON_TEXT_DISABLED : CONFIG.TEXT_PRIMARY;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(motion.scale, motion.scale);
  ctx.translate(-centerX, -centerY);
  ctx.shadowColor = hovered ? colorWithAlpha(accent, CONFIG.BUTTON_BORDER_HOVER_ALPHA) : CONFIG.BUTTON_SHADOW_COLOR;
  ctx.shadowBlur = hovered ? CONFIG.BUTTON_GLOW_BLUR : 0;
  ctx.shadowOffsetY = pressed ? CONFIG.BUTTON_PRESS_SHADOW_OFFSET_Y : CONFIG.BUTTON_SHADOW_OFFSET_Y;
  ctx.lineWidth = pressed ? CONFIG.BUTTON_PRESS_BORDER_WIDTH : CONFIG.BUTTON_BORDER_WIDTH;
  drawRect(ctx, buttonRect, fill, borderColor);
  ctx.shadowColor = 'transparent';
  if (hovered) {
    ctx.globalAlpha = CONFIG.BUTTON_INNER_GLOW_ALPHA;
    drawRect(ctx, {
      x: buttonRect.x + CONFIG.BUTTON_INNER_GLOW_INSET,
      y: buttonRect.y + CONFIG.BUTTON_INNER_GLOW_INSET,
      width: buttonRect.width - (CONFIG.BUTTON_INNER_GLOW_INSET * 2),
      height: Math.max(1, buttonRect.height - (CONFIG.BUTTON_INNER_GLOW_INSET * 2)),
    }, colorWithAlpha(accent, CONFIG.BUTTON_BORDER_HOVER_ALPHA));
    ctx.globalAlpha = CONFIG.ARENA_ALIVE_ALPHA;
  }
  drawText(
    ctx,
    label,
    buttonRect.x + buttonRect.width / 2,
    buttonRect.y + buttonRect.height / 2,
    fontSize,
    textColor,
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
  const glowRadius = radius * scale * tierScale;
  const elementColor = CONFIG.ELEMENT_COLORS[dragon.element] || CONFIG.ACCENT_SECONDARY;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (dragon.tier >= 2) drawTierGlow(ctx, x, y, glowRadius, elementColor, dragon.tier);
  if (dragon.tier >= CONFIG.MAX_TIER) drawTierThreeAura(ctx, x, y, glowRadius, elementColor);
  if (image && image.complete && image.naturalWidth) {
    ctx.imageSmoothingEnabled = true;
    ctx.translate(x, y);
    ctx.scale(mirrored ? -1 : 1, 1);
    ctx.drawImage(image, -(spriteSize / 2), -(spriteSize / 2), spriteSize, spriteSize);
  } else {
    drawCircle(ctx, x, y, radius * tierScale, elementColor, alpha, CONFIG.TEXT_PRIMARY);
  }
  ctx.restore();
}

// Keep baby forms smaller while Tier 2 and Tier 3 use the adult silhouette scale.
export function getDragonTierScale(tier) {
  if (tier >= CONFIG.MAX_TIER) return CONFIG.TIER_SCALE_T3;
  if (tier >= 2) return CONFIG.TIER_SCALE_T2;
  return CONFIG.TIER_SCALE_T1;
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

// Draw a soft evolved-dragon element glow using cheap layered circles.
function drawTierGlow(ctx, x, y, radius, color, tier) {
  ctx.save();
  const alpha = tier >= CONFIG.MAX_TIER ? CONFIG.TIER_GLOW_T3_ALPHA : CONFIG.TIER_GLOW_T2_ALPHA;
  for (let index = CONFIG.TIER_GLOW_SPREAD; index > 0; index -= 1) {
    ctx.globalAlpha *= alpha / (index + 1);
    ctx.beginPath();
    ctx.arc(x, y, radius + (index * CONFIG.TIER_GLOW_SPREAD), 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

// Draw a pulsing ring and orbiting motes around Tier 3 artwork.
function drawTierThreeAura(ctx, x, y, radius, color) {
  ctx.save();
  const now = globalThis.performance ? globalThis.performance.now() : Date.now();
  const cycle = (now % CONFIG.TIER_THREE_AURA_PULSE_MS) / CONFIG.TIER_THREE_AURA_PULSE_MS;
  const pulse = Math.sin(cycle * Math.PI * 2);
  const auraRadius = radius * CONFIG.TIER_THREE_AURA_RADIUS_MULTIPLIER * (CONFIG.ARENA_ALIVE_ALPHA + (pulse * 0.06));
  ctx.strokeStyle = color;
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
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

// Create a small stable field of ambient particles for one screen.
export function createAmbientParticles(count) {
  return Array.from({ length: count }, (_, index) => ({
    x: ((index + Math.random()) / count) * CONFIG.CANVAS_WIDTH,
    y: Math.random() * CONFIG.CANVAS_HEIGHT,
    radius: CONFIG.AMBIENT_PARTICLE_MIN_RADIUS + (Math.random() * CONFIG.AMBIENT_PARTICLE_RADIUS_RANGE),
    phase: Math.random() * Math.PI * 2,
    alpha: CONFIG.ARENA_HP_HIGH_THRESHOLD + (Math.random() * CONFIG.ARENA_HP_HIGH_THRESHOLD),
  }));
}

// Update ambient particles and wrap them when they drift past the top.
export function updateAmbientParticles(particles, dt, speed) {
  particles.forEach(particle => {
    particle.y -= speed * dt;
    particle.phase += dt;
    if (particle.y < -particle.radius) {
      particle.y = CONFIG.CANVAS_HEIGHT + particle.radius;
      particle.x = Math.random() * CONFIG.CANVAS_WIDTH;
    }
  });
}

// Draw tavern dust over the prep screen.
export function drawAmbientDust(ctx, particles) {
  drawAmbientParticles(ctx, particles, CONFIG.TEXT_PRIMARY, CONFIG.AMBIENT_DUST_ALPHA);
}

// Draw slow lava embers over the fight arena.
export function drawAmbientEmbers(ctx, particles) {
  drawAmbientParticles(ctx, particles, CONFIG.HP_BAR_MID, CONFIG.ARENA_HP_HIGH_THRESHOLD);
}

// Draw pulsing void fog across the bottom of the boss arena.
export function drawBossFog(ctx) {
  const now = globalThis.performance ? globalThis.performance.now() : Date.now();
  const wave = (Math.sin(now / CONFIG.AMBIENT_FOG_PULSE_MS) + 1) / 2;
  const alpha = CONFIG.AMBIENT_FOG_ALPHA_MIN
    + ((CONFIG.AMBIENT_FOG_ALPHA_MAX - CONFIG.AMBIENT_FOG_ALPHA_MIN) * wave);
  const fogHeight = CONFIG.CANVAS_HEIGHT * CONFIG.AMBIENT_FOG_HEIGHT_RATIO;
  const gradient = ctx.createLinearGradient(0, CONFIG.CANVAS_HEIGHT - fogHeight, 0, CONFIG.CANVAS_HEIGHT);
  gradient.addColorStop(0, colorWithAlpha(CONFIG.BOSS_HP_COLOR, 0));
  gradient.addColorStop(1, colorWithAlpha(CONFIG.BOSS_HP_COLOR, alpha));
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, CONFIG.CANVAS_HEIGHT - fogHeight, CONFIG.CANVAS_WIDTH, fogHeight);
  ctx.restore();
}

function drawAmbientParticles(ctx, particles, color, baseAlpha) {
  ctx.save();
  particles.forEach(particle => {
    ctx.globalAlpha = baseAlpha * particle.alpha;
    ctx.beginPath();
    ctx.arc(
      particle.x + (Math.sin(particle.phase) * CONFIG.AMBIENT_PARTICLE_DRIFT_X),
      particle.y,
      particle.radius,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = color;
    ctx.fill();
  });
  ctx.restore();
}

export function colorWithAlpha(color, alpha) {
  if (!color || !color.startsWith('#')) return color;
  const hex = color.slice(1);
  const value = Number.parseInt(hex.length === 3
    ? hex.split('').map(character => character + character).join('')
    : hex, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

// Check pointer containment without coupling renderer code to layout helpers.
function pointInRect(point, rect) {
  return point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height;
}
