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

// Return team slot rectangles for the landscape prep screen.
export function getTeamSlots() {
  return Array.from({ length: CONFIG.TEAM_SIZE }, (_, index) => ({
    x: CONFIG.PREP_LEFT_PANEL_X + (index * (CONFIG.TEAM_SLOT_WIDTH + CONFIG.TEAM_SLOT_GAP)),
    y: CONFIG.TEAM_ZONE_Y,
    width: CONFIG.TEAM_SLOT_WIDTH,
    height: CONFIG.TEAM_SLOT_HEIGHT,
  }));
}

// Return bench slot rectangles for the landscape prep screen.
export function getBenchSlots() {
  return Array.from({ length: CONFIG.BENCH_SIZE }, (_, index) => ({
    x: CONFIG.PREP_LEFT_PANEL_X + (index * (CONFIG.BENCH_SLOT_WIDTH + CONFIG.BENCH_SLOT_GAP)),
    y: CONFIG.BENCH_ZONE_Y,
    width: CONFIG.BENCH_SLOT_WIDTH,
    height: CONFIG.BENCH_SLOT_HEIGHT,
  }));
}

// Return shop card rectangles for the landscape prep screen.
export function getShopCards() {
  return Array.from({ length: CONFIG.SHOP_SIZE }, (_, index) => ({
    x: CONFIG.PREP_RIGHT_PANEL_X + (index * (CONFIG.SHOP_CARD_WIDTH + CONFIG.SHOP_CARD_GAP)),
    y: CONFIG.SHOP_ZONE_Y,
    width: CONFIG.SHOP_CARD_WIDTH,
    height: CONFIG.SHOP_CARD_HEIGHT,
  }));
}

// Return the sell zone rectangle.
export function getSellZone() {
  return {
    x: CONFIG.PREP_RIGHT_PANEL_X,
    y: CONFIG.SELL_ZONE_Y,
    width: CONFIG.SELL_ZONE_WIDTH,
    height: CONFIG.SELL_ZONE_HEIGHT,
  };
}

// Return prep command button rectangles.
export function getPrepButtons() {
  return {
    reroll: {
      x: CONFIG.PREP_RIGHT_PANEL_X,
      y: CONFIG.BUTTON_ZONE_Y,
      width: CONFIG.PREP_BUTTON_WIDTH,
      height: CONFIG.BUTTON_HEIGHT,
    },
    fight: {
      x: CONFIG.PREP_RIGHT_PANEL_X + CONFIG.PREP_BUTTON_WIDTH + CONFIG.PREP_BUTTON_GAP,
      y: CONFIG.BUTTON_ZONE_Y,
      width: CONFIG.PREP_BUTTON_WIDTH,
      height: CONFIG.BUTTON_HEIGHT,
    },
    merge: {
      x: CONFIG.PREP_RIGHT_PANEL_X,
      y: CONFIG.PREP_MERGE_BUTTON_Y,
      width: CONFIG.PREP_BUTTON_WIDTH,
      height: CONFIG.BUTTON_HEIGHT,
    },
  };
}

// Return the result screen replay button rectangle.
export function getResultButton() {
  return {
    x: CONFIG.RESULT_BUTTON_X,
    y: CONFIG.RESULT_BUTTON_Y,
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
