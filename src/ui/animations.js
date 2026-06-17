import { CONFIG } from '../config.js';

// Interpolate numeric object properties for simple canvas animation.
export class TweenSystem {
  constructor() {
    this.tweens = [];
  }

  // Add a tween for one object property.
  add(target, property, from, to, durationMs, easing = CONFIG.DEFAULT_EASE, onDone = null) {
    target[property] = from;
    this.tweens.push({ target, property, from, to, durationMs, easing, elapsedMs: 0, onDone });
  }

  // Advance active tweens and remove completed ones.
  update(dt) {
    const elapsedFrameMs = dt * 1000;
    this.tweens = this.tweens.filter(tween => {
      tween.elapsedMs += elapsedFrameMs;
      const progress = Math.min(CONFIG.ARENA_ALIVE_ALPHA, tween.elapsedMs / tween.durationMs);
      const eased = ease(progress, tween.easing);
      tween.target[tween.property] = tween.from + ((tween.to - tween.from) * eased);
      if (progress >= CONFIG.ARENA_ALIVE_ALPHA) {
        if (tween.onDone) tween.onDone();
        return false;
      }
      return true;
    });
  }
}

// Convert a linear progress value into the configured easing shape.
export function ease(progress, type) {
  if (type === 'linear') return progress;
  if (type === 'ease_in_quad') return progress * progress;
  if (type === 'ease_in_out_quad') {
    return progress < CONFIG.ARENA_HP_HIGH_THRESHOLD
      ? (progress * progress) / CONFIG.ARENA_HP_HIGH_THRESHOLD
      : CONFIG.ARENA_ALIVE_ALPHA - (((CONFIG.ARENA_ALIVE_ALPHA - progress) * (CONFIG.ARENA_ALIVE_ALPHA - progress)) / CONFIG.ARENA_HP_HIGH_THRESHOLD);
  }
  return progress * (CONFIG.ARENA_ALIVE_ALPHA + CONFIG.ARENA_ALIVE_ALPHA - progress);
}

// Build a floating combat number that rises and fades.
export function createFloatingNumber(text, x, y, color) {
  return {
    text,
    x: x + CONFIG.ARENA_FLOAT_OFFSET_X,
    y: y + CONFIG.ARENA_FLOAT_OFFSET_Y,
    alpha: CONFIG.ARENA_FLOAT_ALPHA,
    color,
    ageMs: 0,
  };
}

// Update floating combat text lifetimes and positions.
export function updateFloatingNumbers(numbers, dt) {
  const elapsedFrameMs = dt * 1000;
  numbers.forEach(number => {
    number.ageMs += elapsedFrameMs;
    number.y -= CONFIG.DAMAGE_FLOAT_SPEED * dt;
    number.alpha = CONFIG.ARENA_FLOAT_ALPHA - Math.min(CONFIG.ARENA_FLOAT_ALPHA, number.ageMs / CONFIG.DAMAGE_FLOAT_DURATION);
  });
  return numbers.filter(number => number.ageMs < CONFIG.DAMAGE_FLOAT_DURATION);
}
