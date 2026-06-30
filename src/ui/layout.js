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

// Return stable rectangles for the arena playback-speed segmented control.
export function getBattleSpeedButtons() {
  return CONFIG.BATTLE_SPEED_MODES.map((mode, index) => ({
    mode,
    x: CONFIG.BATTLE_SPEED_CONTROL_X + (index * (CONFIG.BATTLE_SPEED_BUTTON_WIDTH + CONFIG.BATTLE_SPEED_BUTTON_GAP)),
    y: CONFIG.BATTLE_SPEED_CONTROL_Y,
    width: CONFIG.BATTLE_SPEED_BUTTON_WIDTH,
    height: CONFIG.BATTLE_SPEED_BUTTON_HEIGHT,
  }));
}

// Return the loading-screen confirmation button rectangle.
export function getLoadingContinueButton() {
  return {
    x: CONFIG.LOADING_CONTINUE_X,
    y: CONFIG.LOADING_CONTINUE_Y,
    width: CONFIG.LOADING_CONTINUE_WIDTH,
    height: CONFIG.LOADING_CONTINUE_HEIGHT,
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
      x: CONFIG.PREP_FIGHT_BUTTON_X,
      y: CONFIG.PREP_FIGHT_BUTTON_Y,
      width: CONFIG.PREP_FIGHT_BUTTON_WIDTH,
      height: CONFIG.PREP_FIGHT_BUTTON_HEIGHT,
    },
    merge: {
      x: CONFIG.PREP_RIGHT_PANEL_X,
      y: CONFIG.PREP_MERGE_BUTTON_Y,
      width: CONFIG.PREP_BUTTON_WIDTH,
      height: CONFIG.BUTTON_HEIGHT,
    },
  };
}

// Return the prep header Back button rectangle.
export function getPrepBackButton() {
  return {
    x: CONFIG.PREP_BACK_BUTTON_X,
    y: CONFIG.PREP_BACK_BUTTON_Y,
    width: CONFIG.PREP_BACK_BUTTON_WIDTH,
    height: CONFIG.PREP_BACK_BUTTON_HEIGHT,
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

// Return main-menu command rectangles.
export function getMenuButtons() {
  return {
    newRun: {
      x: CONFIG.MENU_NEW_RUN_HOTSPOT_X,
      y: CONFIG.MENU_NEW_RUN_HOTSPOT_Y,
      width: CONFIG.MENU_NEW_RUN_HOTSPOT_WIDTH,
      height: CONFIG.MENU_NEW_RUN_HOTSPOT_HEIGHT,
    },
    codex: {
      x: CONFIG.MENU_CODEX_HOTSPOT_X,
      y: CONFIG.MENU_CODEX_HOTSPOT_Y,
      width: CONFIG.MENU_CODEX_HOTSPOT_WIDTH,
      height: CONFIG.MENU_CODEX_HOTSPOT_HEIGHT,
    },
  };
}

// Return the conditional Continue Run button rectangle.
export function getMenuContinueButton() {
  return {
    x: CONFIG.MENU_CONTINUE_X,
    y: CONFIG.MENU_CONTINUE_Y,
    width: CONFIG.MENU_HOTSPOT_LABEL_WIDTH,
    height: CONFIG.MENU_HOTSPOT_LABEL_HEIGHT,
  };
}

// Return confirmation actions for replacing an active run.
export function getMenuConfirmButtons() {
  const totalWidth = (CONFIG.MENU_CONFIRM_BUTTON_WIDTH * 2) + CONFIG.MENU_CONFIRM_BUTTON_GAP;
  const startX = (CONFIG.CANVAS_WIDTH - totalWidth) / 2;
  return {
    cancel: {
      x: startX,
      y: CONFIG.MENU_CONFIRM_BUTTON_Y,
      width: CONFIG.MENU_CONFIRM_BUTTON_WIDTH,
      height: CONFIG.BUTTON_HEIGHT,
    },
    confirm: {
      x: startX + CONFIG.MENU_CONFIRM_BUTTON_WIDTH + CONFIG.MENU_CONFIRM_BUTTON_GAP,
      y: CONFIG.MENU_CONFIRM_BUTTON_Y,
      width: CONFIG.MENU_CONFIRM_BUTTON_WIDTH,
      height: CONFIG.BUTTON_HEIGHT,
    },
  };
}

// Return the menu settings icon and panel controls.
export function getMenuSettingsControls() {
  return {
    icon: {
      x: CONFIG.MENU_SETTINGS_BUTTON_X,
      y: CONFIG.MENU_SETTINGS_BUTTON_Y,
      width: CONFIG.MENU_SETTINGS_BUTTON_SIZE,
      height: CONFIG.MENU_SETTINGS_BUTTON_SIZE,
    },
    name: {
      x: CONFIG.SETTINGS_CONTROL_X,
      y: CONFIG.SETTINGS_NAME_Y,
      width: CONFIG.SETTINGS_CONTROL_WIDTH,
      height: CONFIG.SETTINGS_CONTROL_HEIGHT,
    },
    music: {
      x: CONFIG.SETTINGS_CONTROL_X,
      y: CONFIG.SETTINGS_MUSIC_Y - CONFIG.SETTINGS_SLIDER_KNOB_RADIUS,
      width: CONFIG.SETTINGS_CONTROL_WIDTH,
      height: CONFIG.SETTINGS_SLIDER_KNOB_RADIUS * 2,
    },
    sound: {
      x: CONFIG.SETTINGS_CONTROL_X,
      y: CONFIG.SETTINGS_SOUND_Y - CONFIG.SETTINGS_SLIDER_KNOB_RADIUS,
      width: CONFIG.SETTINGS_CONTROL_WIDTH,
      height: CONFIG.SETTINGS_SLIDER_KNOB_RADIUS * 2,
    },
    close: {
      x: CONFIG.SETTINGS_CLOSE_X,
      y: CONFIG.SETTINGS_CLOSE_Y,
      width: CONFIG.SETTINGS_CLOSE_WIDTH,
      height: CONFIG.BUTTON_HEIGHT,
    },
  };
}

// Return the codex back-button rectangle.
export function getCodexBackButton() {
  return {
    x: CONFIG.MENU_BUTTON_X,
    y: CONFIG.CODEX_BACK_Y,
    width: CONFIG.MENU_BUTTON_WIDTH,
    height: CONFIG.BUTTON_HEIGHT,
  };
}

// Return the two full-results command rectangles.
export function getFullResultButtons() {
  const totalWidth = (CONFIG.RESULT_BUTTON_WIDTH * 2) + CONFIG.RESULT_BUTTON_GAP;
  const startX = (CONFIG.CANVAS_WIDTH - totalWidth) / 2;
  return {
    playAgain: {
      x: startX,
      y: CONFIG.RESULT_BUTTON_Y_FULL,
      width: CONFIG.RESULT_BUTTON_WIDTH,
      height: CONFIG.BUTTON_HEIGHT,
    },
    menu: {
      x: startX + CONFIG.RESULT_BUTTON_WIDTH + CONFIG.RESULT_BUTTON_GAP,
      y: CONFIG.RESULT_BUTTON_Y_FULL,
      width: CONFIG.RESULT_BUTTON_WIDTH,
      height: CONFIG.BUTTON_HEIGHT,
    },
  };
}

// Return a codex cell rectangle by dragon column and tier row.
export function calculateCodexGrid(canvasWidth = CONFIG.CANVAS_WIDTH, canvasHeight = CONFIG.CANVAS_HEIGHT) {
  const layout = CONFIG.CODEX_LAYOUT;
  const pageHeight = (layout.BOTTOM_Y - layout.TOP_Y) * canvasHeight;
  const gapX = layout.CARD_GAP_X * canvasWidth;
  const gapY = layout.CARD_GAP_Y * canvasHeight;
  const makePageCards = (pageXPercent, pageWidthPercent, page, elementOffset) => {
    const pageX = pageXPercent * canvasWidth;
    const pageY = layout.TOP_Y * canvasHeight;
    const pageWidth = pageWidthPercent * canvasWidth;
    const cardWidth = (pageWidth - ((layout.COLS_PER_PAGE - 1) * gapX)) / layout.COLS_PER_PAGE;
    const cardHeight = (pageHeight - ((layout.ROWS_PER_PAGE - 1) * gapY)) / layout.ROWS_PER_PAGE;
    const cards = [];
    for (let row = 0; row < layout.ROWS_PER_PAGE; row += 1) {
      for (let col = 0; col < layout.COLS_PER_PAGE; col += 1) {
        cards.push({
          x: pageX + (col * (cardWidth + gapX)),
          y: pageY + (row * (cardHeight + gapY)),
          width: cardWidth,
          height: cardHeight,
          page,
          element: elementOffset + col,
          tier: row + 1,
        });
      }
    }
    return { cards, cardWidth, cardHeight };
  };
  const left = makePageCards(layout.LEFT_X, layout.LEFT_WIDTH, 'left', 0);
  const right = makePageCards(layout.RIGHT_X, layout.RIGHT_WIDTH, 'right', layout.COLS_PER_PAGE);
  return {
    cards: [...left.cards, ...right.cards],
    cardWidth: left.cardWidth,
    cardHeight: left.cardHeight,
  };
}

// Return a codex cell rectangle by dragon column and tier row.
export function getCodexCell(column, row) {
  const layout = CONFIG.CODEX_LAYOUT;
  const pageColumn = column % layout.COLS_PER_PAGE;
  const grid = calculateCodexGrid();
  const index = column < layout.COLS_PER_PAGE
    ? (row * layout.COLS_PER_PAGE) + pageColumn
    : (layout.COLS_PER_PAGE * layout.ROWS_PER_PAGE) + (row * layout.COLS_PER_PAGE) + pageColumn;
  const rect = grid.cards[index];
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
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
