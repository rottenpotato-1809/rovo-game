import { CONFIG } from '../config.js';

let context = null;
let unlocked = false;
let soundVolume = CONFIG.SOUND_VOLUME;

// Defer Web Audio startup until a player gesture satisfies browser autoplay policy.
export function bindAudioUnlock(element) {
  if (!element?.addEventListener) return;
  element.addEventListener('pointerdown', unlockAudio, { once: true });
}

// Apply the saved normalized sound-effect level.
export function setSoundVolume(volume) {
  soundVolume = Math.max(0, Math.min(CONFIG.ARENA_ALIVE_ALPHA, volume));
}

export function playBuy() {
  playTone({
    frequency: CONFIG.SFX_BUY_FREQUENCY,
    duration: CONFIG.SFX_BUY_DURATION_SECONDS,
    type: 'sine',
    gain: CONFIG.SFX_BUY_GAIN,
  });
}

export function playSell() {
  CONFIG.SFX_SELL_FREQUENCIES.forEach((frequency, index) => {
    playTone({
      frequency,
      duration: CONFIG.SFX_SELL_DURATION_SECONDS,
      type: 'sine',
      gain: CONFIG.SFX_SELL_GAIN,
      delay: index * CONFIG.SFX_SELL_STAGGER_SECONDS,
    });
  });
}

export function playMerge() {
  if (!CONFIG.SFX_ENABLED || !unlocked) return;
  const now = getNow();
  const oscillator = createOscillator('sine');
  const gain = createGain();
  if (!oscillator || !gain) return;
  oscillator.frequency.setValueAtTime(CONFIG.SFX_MERGE_START_FREQUENCY, now);
  oscillator.frequency.exponentialRampToValueAtTime(CONFIG.SFX_MERGE_END_FREQUENCY, now + CONFIG.SFX_MERGE_DURATION_SECONDS);
  connectAndEnvelope(oscillator, gain, now, CONFIG.SFX_MERGE_DURATION_SECONDS, CONFIG.SFX_MERGE_ATTACK_SECONDS, CONFIG.SFX_MERGE_GAIN);
  playTone({
    frequency: CONFIG.SFX_MERGE_PING_FREQUENCY,
    duration: CONFIG.SFX_MERGE_PING_DURATION_SECONDS,
    type: 'triangle',
    gain: CONFIG.SFX_MERGE_PING_GAIN,
    delay: CONFIG.SFX_MERGE_DURATION_SECONDS,
  });
}

export function playHit() {
  playTone({
    frequency: CONFIG.SFX_HIT_FREQUENCY,
    duration: CONFIG.SFX_HIT_DURATION_SECONDS,
    type: 'square',
    gain: CONFIG.SFX_HIT_GAIN,
  });
}

export function playAbility(element = 'fire') {
  if (element === 'fire') {
    playNoise({ duration: CONFIG.SFX_FIRE_NOISE_DURATION_SECONDS, gain: CONFIG.SFX_FIRE_NOISE_GAIN });
    playTone({
      frequency: CONFIG.SFX_FIRE_CRACKLE_FREQUENCY,
      duration: CONFIG.SFX_FIRE_CRACKLE_DURATION_SECONDS,
      type: 'square',
      gain: CONFIG.SFX_FIRE_CRACKLE_GAIN,
      delay: CONFIG.SFX_FIRE_CRACKLE_DELAY_SECONDS,
    });
    return;
  }
  const voice = CONFIG.SFX_ABILITY_VOICES[element] || CONFIG.SFX_ABILITY_VOICES.default;
  playTone({ ...voice, duration: CONFIG.SFX_ABILITY_DURATION_SECONDS, gain: CONFIG.SFX_ABILITY_GAIN });
}

export function playDeath() {
  if (!CONFIG.SFX_ENABLED || !unlocked) return;
  const now = getNow();
  const oscillator = createOscillator('sine');
  const gain = createGain();
  if (!oscillator || !gain) return;
  oscillator.frequency.setValueAtTime(CONFIG.SFX_DEATH_START_FREQUENCY, now);
  oscillator.frequency.exponentialRampToValueAtTime(CONFIG.SFX_DEATH_END_FREQUENCY, now + CONFIG.SFX_DEATH_DURATION_SECONDS);
  connectAndEnvelope(oscillator, gain, now, CONFIG.SFX_DEATH_DURATION_SECONDS, CONFIG.SFX_DEATH_ATTACK_SECONDS, CONFIG.SFX_DEATH_GAIN);
}

export function playVictory() {
  CONFIG.SFX_VICTORY_FREQUENCIES.forEach((frequency, index) => {
    playTone({
      frequency,
      duration: CONFIG.SFX_VICTORY_DURATION_SECONDS,
      type: 'triangle',
      gain: CONFIG.SFX_VICTORY_GAIN,
      delay: index * CONFIG.SFX_VICTORY_STAGGER_SECONDS,
    });
  });
}

export function playDefeat() {
  CONFIG.SFX_DEFEAT_FREQUENCIES.forEach((frequency, index) => {
    playTone({
      frequency,
      duration: CONFIG.SFX_DEFEAT_DURATION_SECONDS,
      type: 'sine',
      gain: CONFIG.SFX_DEFEAT_GAIN,
      delay: index * CONFIG.SFX_DEFEAT_STAGGER_SECONDS,
    });
  });
}

export function playBossAppear() {
  playTone({
    frequency: CONFIG.SFX_BOSS_RUMBLE_FREQUENCY,
    duration: CONFIG.SFX_BOSS_RUMBLE_DURATION_SECONDS,
    type: 'sawtooth',
    gain: CONFIG.SFX_BOSS_RUMBLE_GAIN,
  });
  CONFIG.SFX_BOSS_PULSE_DELAYS_SECONDS.forEach(delay => {
    playTone({
      frequency: CONFIG.SFX_BOSS_PULSE_FREQUENCY,
      duration: CONFIG.SFX_BOSS_PULSE_DURATION_SECONDS,
      type: 'square',
      gain: CONFIG.SFX_BOSS_PULSE_GAIN,
      delay,
    });
  });
}

function unlockAudio() {
  const audio = getContext();
  if (!audio) return;
  unlocked = true;
  if (audio.state === 'suspended') audio.resume().catch(() => {});
}

function playTone({ frequency, duration, type = 'sine', gain = 0.3, delay = 0 }) {
  if (!CONFIG.SFX_ENABLED || !unlocked) return;
  const now = getNow() + delay;
  const oscillator = createOscillator(type);
  const gainNode = createGain();
  if (!oscillator || !gainNode) return;
  oscillator.frequency.setValueAtTime(frequency, now);
  connectAndEnvelope(oscillator, gainNode, now, duration, CONFIG.SFX_DEFAULT_ATTACK_SECONDS, gain);
}

function playNoise({ duration, gain = 0.2, delay = 0 }) {
  if (!CONFIG.SFX_ENABLED || !unlocked) return;
  const audio = getContext();
  if (!canPlay(audio)) return;
  const bufferSize = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < bufferSize; index += 1) {
    channel[index] = (Math.random() * 2) - 1;
  }
  const source = audio.createBufferSource();
  const gainNode = createGain();
  if (!gainNode) return;
  source.buffer = buffer;
  const now = audio.currentTime + delay;
  connectAndEnvelope(source, gainNode, now, duration, CONFIG.SFX_NOISE_ATTACK_SECONDS, gain);
}

function connectAndEnvelope(source, gainNode, startTime, duration, attack, gain) {
  const audio = getContext();
  if (!canPlay(audio)) return;
  const peak = gain * CONFIG.MASTER_VOLUME * soundVolume;
  if (peak <= 0) return;
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(peak, startTime + attack);
  gainNode.gain.exponentialRampToValueAtTime(CONFIG.SFX_MIN_GAIN, startTime + duration);
  source.connect(gainNode);
  gainNode.connect(audio.destination);
  source.start(startTime);
  source.stop(startTime + duration + CONFIG.SFX_STOP_PADDING_SECONDS);
  source.addEventListener?.('ended', () => {
    source.disconnect();
    gainNode.disconnect();
  }, { once: true });
}

function createOscillator(type) {
  const audio = getContext();
  if (!canPlay(audio)) return null;
  const oscillator = audio.createOscillator();
  oscillator.type = type;
  return oscillator;
}

function createGain() {
  const audio = getContext();
  if (!canPlay(audio)) return null;
  return audio.createGain();
}

function getNow() {
  return context?.currentTime || getContext()?.currentTime || 0;
}

function canPlay(audio) {
  return CONFIG.SFX_ENABLED && unlocked && audio;
}

function getContext() {
  if (context) return context;
  const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContextClass) return null;
  context = new AudioContextClass();
  return context;
}
