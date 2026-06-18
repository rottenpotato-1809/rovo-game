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

summarize();
