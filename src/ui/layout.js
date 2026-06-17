import { CONFIG } from '../config.js';

// Return the temporary Fight button rectangle.
export function getArenaFightButton() {
  return {
    x: CONFIG.ARENA_FIGHT_BUTTON_X,
    y: CONFIG.ARENA_FIGHT_BUTTON_Y,
    width: CONFIG.ARENA_FIGHT_BUTTON_WIDTH,
    height: CONFIG.BUTTON_HEIGHT,
  };
}

// Return the fixed fight-screen point for a dragon side and slot.
export function getFightPoint(team, index) {
  return {
    x: team === 'player' ? CONFIG.FIGHT_PLAYER_X : CONFIG.FIGHT_ENEMY_X,
    y: CONFIG.FIGHT_Y_POSITIONS[index],
  };
}

// Check whether a point is inside a rectangular hit area.
export function pointInRect(point, rect) {
  return point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height;
}
