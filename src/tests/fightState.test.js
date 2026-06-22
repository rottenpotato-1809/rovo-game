import { CONFIG } from '../config.js';
import { FightState } from '../states/fightState.js';
import { assert, assertEqual, summarize, test } from './testHarness.js';

test('combat log action labels never expose snake case', () => {
  const state = new FightState({});
  const text = state.describeEvent({
    actorName: 'Nightshade',
    action: 'apply_poison',
    targetName: 'Tidecaller',
    value: 0,
  });
  assert(!text.includes('_'), 'Visible combat actions must not contain underscores');
  assert(text.includes('apply poison'));
});

test('ability cooldown starts on special use and decreases on basic attacks', () => {
  const state = new FightState({});
  const dragon = { cooldownCurrent: 0, cooldownMax: CONFIG.ABILITY_COOLDOWN };
  state.updateAbilityCooldown(dragon, { action: 'ability' });
  assertEqual(dragon.cooldownCurrent, CONFIG.ABILITY_COOLDOWN);
  state.updateAbilityCooldown(dragon, { action: 'basic_attack' });
  assertEqual(dragon.cooldownCurrent, CONFIG.ABILITY_COOLDOWN - 1);
});

test('combat log scrolling clamps to available history', () => {
  const state = new FightState({});
  state.combatLog = Array(CONFIG.COMBAT_LOG_MAX_LINES + 3).fill('event');
  state.scrollCombatLog(99);
  assertEqual(state.logScrollOffset, 3);
  state.scrollCombatLog(-99);
  assertEqual(state.logScrollOffset, 0);
});

test('combat log hit testing is limited to the upper-right panel', () => {
  const state = new FightState({});
  assert(state.isPointInCombatLog({ x: CONFIG.ARENA_LOG_PANEL_X + 1, y: CONFIG.ARENA_LOG_PANEL_Y + 1 }));
  assert(!state.isPointInCombatLog({ x: CONFIG.ARENA_RESULT_PANEL_X, y: CONFIG.ARENA_RESULT_PANEL_Y }));
});

test('completed fights continue from any canvas position', () => {
  let completed = false;
  const state = new FightState({});
  state.events = [];
  state.eventIndex = 0;
  state.result = { outcome: 'win' };
  state.onComplete = () => { completed = true; };
  state.handlePointerDown({ x: 0, y: CONFIG.CANVAS_HEIGHT });
  assert(completed, 'Any click must continue after playback finishes');
});

test('completed fights reserve combat-log drags instead of continuing', () => {
  let completed = false;
  const state = new FightState({});
  state.events = [];
  state.eventIndex = 0;
  state.result = { outcome: 'win' };
  state.onComplete = () => { completed = true; };
  state.combatLog = Array(CONFIG.COMBAT_LOG_MAX_LINES + 3).fill('event');
  const point = { x: CONFIG.ARENA_LOG_PANEL_X + 10, y: CONFIG.ARENA_LOG_PANEL_Y + 10 };
  state.handlePointerDown(point);
  state.handlePointerMove({ ...point, y: point.y + CONFIG.ARENA_LOG_LINE_HEIGHT + 1 });
  state.handlePointerUp();
  assertEqual(completed, false);
  assertEqual(state.logScrollOffset, 1);
});

summarize();
