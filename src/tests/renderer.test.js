import { CONFIG } from '../config.js';
import { getCodexCell, getMenuButtons } from '../ui/layout.js';
import { drawText, getDragonTierScale } from '../ui/renderer.js';
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

test('battle information sits outside each dragon column', () => {
  const spriteHalfWidth = (CONFIG.DRAGON_RADIUS_FIGHT * CONFIG.DRAGON_SPRITE_SCALE) / 2;
  const playerBarRight = CONFIG.FIGHT_PLAYER_X - CONFIG.ARENA_INFO_OFFSET_X;
  const enemyBarLeft = CONFIG.FIGHT_ENEMY_X + CONFIG.ARENA_INFO_OFFSET_X;
  assert(playerBarRight <= CONFIG.FIGHT_PLAYER_X - spriteHalfWidth, 'Player information must stay left of player artwork');
  assert(enemyBarLeft >= CONFIG.FIGHT_ENEMY_X + spriteHalfWidth, 'Enemy information must stay right of enemy artwork');
});

test('all combatants stand inside the brown battlefield region', () => {
  const spriteHalfHeight = (CONFIG.DRAGON_RADIUS_FIGHT * CONFIG.DRAGON_SPRITE_SCALE) / 2;
  assert(CONFIG.FIGHT_Y_POSITIONS[0] - spriteHalfHeight >= CONFIG.ARENA_BATTLEFIELD_TOP_Y);
  assert(CONFIG.FIGHT_Y_POSITIONS[CONFIG.FIGHT_Y_POSITIONS.length - 1] + spriteHalfHeight <= CONFIG.CANVAS_HEIGHT);
});

test('combat log and result panels remain above the battlefield without overlap', () => {
  const logBottom = CONFIG.ARENA_LOG_PANEL_Y + CONFIG.ARENA_LOG_PANEL_HEIGHT;
  const resultBottom = CONFIG.ARENA_RESULT_PANEL_Y + CONFIG.ARENA_RESULT_PANEL_HEIGHT;
  const resultRight = CONFIG.ARENA_RESULT_PANEL_X + CONFIG.ARENA_RESULT_PANEL_WIDTH;
  assert(logBottom < CONFIG.ARENA_BATTLEFIELD_TOP_Y);
  assert(resultBottom < CONFIG.ARENA_BATTLEFIELD_TOP_Y);
  assert(resultRight < CONFIG.ARENA_LOG_PANEL_X);
});

test('prep dragon name and stats have separate baselines', () => {
  const minimumGap = (CONFIG.FONT_SIZE_DRAGON_NAME + CONFIG.FONT_SIZE_STATS) / 2;
  const actualGap = CONFIG.PREP_DRAGON_NAME_BOTTOM_OFFSET - CONFIG.PREP_DRAGON_STATS_BOTTOM_OFFSET;
  assert(actualGap >= minimumGap, 'Owned dragon name and stat text must not overlap');
  assert(CONFIG.PREP_DRAGON_STATS_BOTTOM_OFFSET > 0, 'Stats must remain inside the slot');
});

test('team and bench portraits stay above their labels', () => {
  const teamPortraitBottom = CONFIG.PREP_TEAM_DRAGON_Y_OFFSET + CONFIG.DRAGON_RADIUS_TEAM;
  const teamNameTop = CONFIG.TEAM_SLOT_HEIGHT - CONFIG.PREP_DRAGON_NAME_BOTTOM_OFFSET - (CONFIG.FONT_SIZE_DRAGON_NAME / 2);
  const benchPortraitBottom = CONFIG.PREP_BENCH_DRAGON_Y_OFFSET + CONFIG.DRAGON_RADIUS_BENCH;
  const benchNameTop = CONFIG.BENCH_SLOT_HEIGHT - CONFIG.PREP_DRAGON_NAME_BOTTOM_OFFSET - (CONFIG.FONT_SIZE_DRAGON_NAME / 2);
  assert(teamPortraitBottom < teamNameTop, 'Team portrait and name must not overlap');
  assert(benchPortraitBottom < benchNameTop, 'Bench portrait and name must not overlap');
});

test('adult dragon artwork is larger than baby artwork', () => {
  assert(getDragonTierScale(2) > getDragonTierScale(1), 'Tier 2 must visually read as larger than Tier 1');
  assertEqual(getDragonTierScale(3), getDragonTierScale(2), 'Tier 3 reuses the adult silhouette scale');
});

test('bench row fills the lower-left prep staging area', () => {
  const benchBottom = CONFIG.BENCH_ZONE_Y + CONFIG.BENCH_SLOT_HEIGHT;
  assert(CONFIG.BENCH_ZONE_Y > CONFIG.TEAM_ZONE_Y + CONFIG.TEAM_SLOT_HEIGHT, 'Bench must sit below the active team');
  assert(benchBottom < CONFIG.PREP_MESSAGE_Y, 'Bench must leave room for feedback text');
  assert(CONFIG.BENCH_SLOT_HEIGHT > CONFIG.TEAM_SLOT_HEIGHT, 'Reserve staging should use the available lower field');
});

test('team heading clears the fixed header', () => {
  const headingBaseline = CONFIG.TEAM_ZONE_Y - CONFIG.PREP_SECTION_LABEL_OFFSET_Y;
  const headingTop = headingBaseline - (CONFIG.FONT_SIZE_HEADER / 2);
  assert(headingTop > CONFIG.HEADER_HEIGHT, 'Team heading must not spill into the header');
});

test('completed fight messaging stays inside its result panel', () => {
  const continueY = CONFIG.ARENA_RESULT_Y + CONFIG.BUTTON_HEIGHT;
  assert(continueY < CONFIG.ARENA_RESULT_PANEL_Y + CONFIG.ARENA_RESULT_PANEL_HEIGHT, 'Continue prompt must remain inside the result panel');
});

test('main menu regions stay aligned to the illustrated scene', () => {
  const buttons = getMenuButtons();
  const statsRight = CONFIG.MENU_STATS_PANEL_X + CONFIG.MENU_STATS_PANEL_WIDTH;
  const statsBottom = CONFIG.MENU_STATS_PANEL_Y + CONFIG.MENU_STATS_PANEL_HEIGHT;
  const newRunLabelRight = CONFIG.MENU_NEW_RUN_LABEL_X + CONFIG.MENU_HOTSPOT_LABEL_WIDTH;
  const newRunLabelBottom = CONFIG.MENU_NEW_RUN_LABEL_Y + CONFIG.MENU_HOTSPOT_LABEL_HEIGHT;
  const codexLabelRight = CONFIG.MENU_CODEX_LABEL_X + CONFIG.MENU_HOTSPOT_LABEL_WIDTH;
  const codexLabelBottom = CONFIG.MENU_CODEX_LABEL_Y + CONFIG.MENU_HOTSPOT_LABEL_HEIGHT;

  assert(statsRight <= CONFIG.CANVAS_WIDTH && statsBottom <= CONFIG.CANVAS_HEIGHT, 'Progression panel must fit the canvas');
  assert(CONFIG.MENU_NEW_RUN_LABEL_X >= buttons.newRun.x && newRunLabelRight <= buttons.newRun.x + buttons.newRun.width, 'New Run label must stay on the tower');
  assert(CONFIG.MENU_NEW_RUN_LABEL_Y >= buttons.newRun.y && newRunLabelBottom <= buttons.newRun.y + buttons.newRun.height, 'New Run label must stay inside the tower hotspot');
  assert(CONFIG.MENU_CODEX_LABEL_X >= buttons.codex.x && codexLabelRight <= buttons.codex.x + buttons.codex.width, 'Codex label must stay with the ground dragons');
  assert(CONFIG.MENU_CODEX_LABEL_Y >= buttons.codex.y && codexLabelBottom <= buttons.codex.y + buttons.codex.height, 'Codex label must stay inside the dragon hotspot');
});

test('codex grid stays inside the illustrated book pages', () => {
  const finalCell = getCodexCell(7, 2);
  assert(finalCell.x + finalCell.width <= CONFIG.CODEX_BOOK_CONTENT_RIGHT, 'Codex columns must fit the parchment width');
  assert(finalCell.y + finalCell.height <= CONFIG.CODEX_BOOK_CONTENT_BOTTOM, 'Codex rows must fit above the book footer');
  assert(CONFIG.CODEX_FOOTER_Y < CONFIG.CODEX_BACK_Y, 'Discovery count must remain above the back button');
});

summarize();
