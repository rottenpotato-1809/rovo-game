import {
  bindAudioUnlock,
  playAbility,
  playBossAppear,
  playBuy,
  playDeath,
  playDefeat,
  playHit,
  playMerge,
  playSell,
  playVictory,
  setSoundVolume,
} from '../engine/audio.js';
import { assert, summarize, test } from './testHarness.js';

test('sound effects are safe before browser audio unlock', () => {
  setSoundVolume(2);
  playBuy();
  playSell();
  playMerge();
  playHit();
  playAbility('fire');
  playDeath();
  playVictory();
  playDefeat();
  playBossAppear();
  assert(true, 'SFX calls should be no-ops before unlock');
});

test('audio unlock binding accepts browser-like elements', () => {
  const listeners = [];
  bindAudioUnlock({
    addEventListener(type, handler, options) {
      listeners.push({ type, handler, options });
    },
  });
  assert(listeners.length === 1, 'One pointer listener should be registered');
  assert(listeners[0].type === 'pointerdown', 'Audio unlock should wait for a pointer gesture');
  assert(listeners[0].options.once === true, 'Audio unlock should only happen once');
});

summarize();
