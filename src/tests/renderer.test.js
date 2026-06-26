import { CONFIG } from '../config.js';
import { getBattleSpeedButtons, getBenchSlots, getCodexCell, getMenuButtons, getMenuConfirmButtons, getMenuContinueButton, getPrepBackButton, getPrepButtons, getShopCards, getTeamSlots } from '../ui/layout.js';
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

test('battle speed controls stay centered and clear of the combat log', () => {
  const buttons = getBattleSpeedButtons();
  const controlLeft = buttons[0].x;
  const controlRight = buttons[buttons.length - 1].x + buttons[buttons.length - 1].width;
  assert(controlLeft >= CONFIG.ARENA_RESULT_PANEL_X, 'Speed controls must stay in the center UI region');
  assert(controlRight < CONFIG.ARENA_LOG_PANEL_X, 'Speed controls must not overlap the combat log');
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
  assert(getDragonTierScale(3) > getDragonTierScale(2), 'Tier 3 must visually read as the strongest evolution');
});

test('bench row fills the lower-left prep staging area', () => {
  const benchBottom = CONFIG.BENCH_ZONE_Y + CONFIG.BENCH_SLOT_HEIGHT;
  assert(CONFIG.BENCH_ZONE_Y > CONFIG.TEAM_ZONE_Y + CONFIG.TEAM_SLOT_HEIGHT, 'Bench must sit below the active team');
  assert(benchBottom < CONFIG.PREP_MESSAGE_Y, 'Bench must leave room for feedback text');
  assert(CONFIG.BENCH_SLOT_HEIGHT < CONFIG.TEAM_SLOT_HEIGHT, 'Active team cards must remain visually dominant');
});

test('prep regions fit the landscape staging screen without overlap', () => {
  const team = getTeamSlots();
  const bench = getBenchSlots();
  const shop = getShopCards();
  const buttons = getPrepButtons();
  const finalBench = bench[bench.length - 1];
  const finalShop = shop[shop.length - 1];
  assert(team[team.length - 1].x + CONFIG.TEAM_SLOT_WIDTH < shop[0].x, 'Team and shop columns must remain separate');
  assert(finalBench.x + finalBench.width < buttons.merge.x, 'Bench must clear the command column');
  assert(finalShop.x + finalShop.width <= CONFIG.CANVAS_WIDTH, 'Shop must fit the canvas width');
  assert(buttons.fight.x + buttons.fight.width <= CONFIG.CANVAS_WIDTH, 'Fight button must fit the canvas width');
  assert(buttons.fight.y + buttons.fight.height < CONFIG.PREP_MESSAGE_Y, 'Fight button must clear prep feedback');
});

test('result summary rows and buttons remain inside the framed panel', () => {
  const lastRowY = CONFIG.RESULT_LINE_START_Y + (CONFIG.RESULT_LINE_GAP * 4);
  const panelRight = CONFIG.RESULT_PANEL_X + CONFIG.RESULT_PANEL_WIDTH;
  const panelBottom = CONFIG.RESULT_PANEL_Y + CONFIG.RESULT_PANEL_HEIGHT;
  assert(CONFIG.RESULT_ROW_DIVIDER_LEFT > CONFIG.RESULT_PANEL_X, 'Result rows must start inside the panel');
  assert(CONFIG.RESULT_ROW_DIVIDER_RIGHT < panelRight, 'Result rows must end inside the panel');
  assert(lastRowY + CONFIG.RESULT_ROW_DIVIDER_OFFSET_Y < CONFIG.RESULT_NOTICE_Y, 'Result rows must clear the notice');
  assert(CONFIG.RESULT_BUTTON_Y_FULL + CONFIG.BUTTON_HEIGHT < panelBottom, 'Result buttons must remain inside the panel');
});

test('team heading clears the fixed header', () => {
  const headingBaseline = CONFIG.TEAM_ZONE_Y - CONFIG.PREP_SECTION_LABEL_OFFSET_Y;
  const headingTop = headingBaseline - (CONFIG.FONT_SIZE_HEADER / 2);
  assert(headingTop > CONFIG.HEADER_HEIGHT, 'Team heading must not spill into the header');
});

test('completed fight messaging stays inside its result panel', () => {
  const panelCenterX = CONFIG.ARENA_RESULT_PANEL_X + (CONFIG.ARENA_RESULT_PANEL_WIDTH / 2);
  assertEqual(panelCenterX, CONFIG.CANVAS_WIDTH / 2, 'Fight result panel must be horizontally centered');
  assert(CONFIG.FONT_SIZE_FIGHT_RESULT < CONFIG.ARENA_RESULT_PANEL_HEIGHT, 'Fight result text must fit inside its compact panel');
});

test('boss status UI stays above the boss artwork', () => {
  const bossSpriteTop = CONFIG.FIGHT_BOSS_Y - (CONFIG.BOSS_SPRITE_SIZE / 2);
  const statusBottom = CONFIG.BOSS_STATUS_Y + (CONFIG.FONT_SIZE_DRAGON_NAME / 2);
  assert(CONFIG.BOSS_NAME_Y < CONFIG.BOSS_HP_BAR_Y, 'Boss name must sit above the HP bar');
  assert(CONFIG.BOSS_HP_BAR_Y + CONFIG.BOSS_HP_BAR_HEIGHT < CONFIG.BOSS_STATUS_Y, 'Boss HP bar must clear the status text');
  assert(statusBottom < bossSpriteTop, 'Boss status UI must not overlap the boss artwork');
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
  assert(CONFIG.MENU_TITLE_X + CONFIG.MENU_TITLE_WIDTH <= CONFIG.CANVAS_WIDTH, 'Title artwork must fit the menu width');
  assert(CONFIG.MENU_TITLE_Y + CONFIG.MENU_TITLE_HEIGHT <= CONFIG.MENU_STATS_PANEL_Y, 'Title artwork must clear the progression panel');
});

test('resume, confirmation, and prep navigation controls fit their screens', () => {
  const continueButton = getMenuContinueButton();
  const confirmButtons = getMenuConfirmButtons();
  const backButton = getPrepBackButton();
  assert(continueButton.x + continueButton.width <= CONFIG.CANVAS_WIDTH, 'Continue must fit the menu');
  assert(confirmButtons.confirm.x + confirmButtons.confirm.width < CONFIG.MENU_CONFIRM_PANEL_X + CONFIG.MENU_CONFIRM_PANEL_WIDTH, 'Confirmation actions must fit their panel');
  assert(backButton.x > CONFIG.PREP_HEADER_PANEL_MARGIN + CONFIG.PREP_HEADER_PANEL_WIDTH, 'Prep Back must clear the round panel');
});

test('dragon inspectors fit between their surrounding UI regions', () => {
  const finalCodexCell = getCodexCell(7, 2);
  assert(CONFIG.PREP_INSPECTOR_Y >= CONFIG.TEAM_ZONE_Y + CONFIG.TEAM_SLOT_HEIGHT, 'Prep inspector must clear team cards');
  assert(CONFIG.PREP_INSPECTOR_Y + CONFIG.PREP_INSPECTOR_HEIGHT <= CONFIG.BENCH_ZONE_Y, 'Prep inspector must clear bench cards');
  assert(CONFIG.CODEX_INSPECTOR_Y >= finalCodexCell.y + finalCodexCell.height, 'Codex inspector must follow the grid');
  assert(CONFIG.CODEX_INSPECTOR_Y + CONFIG.CODEX_INSPECTOR_HEIGHT < CONFIG.CODEX_BACK_Y, 'Codex inspector must clear Back');
});

test('loading artwork and progress bar stay inside the canvas', () => {
  assert(CONFIG.LOADING_TITLE_X >= 0 && CONFIG.LOADING_TITLE_X + CONFIG.LOADING_TITLE_WIDTH <= CONFIG.CANVAS_WIDTH, 'Loading title must fit horizontally');
  assert(CONFIG.LOADING_TITLE_Y >= 0 && CONFIG.LOADING_TITLE_Y + CONFIG.LOADING_TITLE_HEIGHT <= CONFIG.CANVAS_HEIGHT, 'Loading title must fit vertically');
  assert(CONFIG.LOADING_BAR_X >= 0 && CONFIG.LOADING_BAR_X + CONFIG.LOADING_BAR_WIDTH <= CONFIG.CANVAS_WIDTH, 'Loading bar must fit horizontally');
  assert(CONFIG.LOADING_BAR_Y + CONFIG.LOADING_BAR_HEIGHT <= CONFIG.CANVAS_HEIGHT, 'Loading bar must fit vertically');
});

test('codex grid stays inside the illustrated book pages', () => {
  const finalCell = getCodexCell(7, 2);
  assert(finalCell.x + finalCell.width <= CONFIG.CODEX_BOOK_CONTENT_RIGHT, 'Codex columns must fit the parchment width');
  assert(finalCell.y + finalCell.height <= CONFIG.CODEX_BOOK_CONTENT_BOTTOM, 'Codex rows must fit above the book footer');
  assert(CONFIG.CODEX_FOOTER_Y < CONFIG.CODEX_BACK_Y, 'Discovery count must remain above the back button');
});

summarize();
