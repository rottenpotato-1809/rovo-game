import { CONFIG } from '../config.js';
import { drawText } from '../ui/renderer.js';
import { assert, assertEqual, summarize, test } from './testHarness.js';

function createTextContext(calls) {
  return {
    fillStyle: '',
    font: '',
    lineJoin: '',
    lineWidth: 0,
    strokeStyle: '',
    textAlign: '',
    textBaseline: '',
    strokeText: (...args) => calls.push({ type: 'stroke', args }),
    fillText: (...args) => calls.push({ type: 'fill', args }),
  };
}

test('canvas text draws a contrast outline before its fill', () => {
  const calls = [];
  const ctx = createTextContext(calls);
  drawText(ctx, 'WYRMPIT', 100, 50, CONFIG.FONT_SIZE_HEADER);

  assertEqual(calls[0].type, 'stroke');
  assertEqual(calls[1].type, 'fill');
  assertEqual(ctx.strokeStyle, CONFIG.TEXT_OUTLINE_COLOR);
  assertEqual(ctx.lineWidth, CONFIG.TEXT_OUTLINE_WIDTH);
});

test('battle information columns leave clear center space', () => {
  const playerInfoRight = CONFIG.FIGHT_PLAYER_X + CONFIG.ARENA_INFO_OFFSET_X + CONFIG.HP_BAR_WIDTH_TEAM;
  const enemyInfoLeft = CONFIG.FIGHT_ENEMY_X - CONFIG.ARENA_INFO_OFFSET_X - CONFIG.HP_BAR_WIDTH_TEAM;
  assert(playerInfoRight < enemyInfoLeft, 'Player and enemy information columns must not overlap');
});

test('prep dragon name and stats have separate baselines', () => {
  const minimumGap = (CONFIG.FONT_SIZE_DRAGON_NAME + CONFIG.FONT_SIZE_STATS) / 2;
  const actualGap = CONFIG.PREP_DRAGON_STATS_Y_OFFSET - CONFIG.PREP_DRAGON_NAME_Y_OFFSET;
  assert(actualGap >= minimumGap, 'Owned dragon name and stat text must not overlap');
  assert(CONFIG.PREP_DRAGON_STATS_Y_OFFSET < CONFIG.TEAM_SLOT_HEIGHT, 'Stats must remain inside the team slot');
});

test('completed fight messaging stays inside its result panel', () => {
  const continueY = CONFIG.ARENA_RESULT_Y + CONFIG.BUTTON_HEIGHT;
  assert(continueY < CONFIG.ARENA_RESULT_PANEL_HEIGHT, 'Continue prompt must remain inside the result panel');
});

summarize();
