import { CONFIG } from '../config.js';

const MUSIC_SOURCES = {
  menu: new URL('../music/Dragon-Menu-Drift.ogg', import.meta.url).href,
  prep: new URL('../music/Ember-Draft.ogg', import.meta.url).href,
  fight: new URL('../music/Dragon-Clash.ogg', import.meta.url).href,
  boss: new URL('../music/Dragon-Ascension.ogg', import.meta.url).href,
};

const STATE_TRACKS = {
  menu: 'menu',
  codex: 'menu',
  prep: 'prep',
  arena: 'fight',
  fight: 'fight',
  boss: 'boss',
  result: 'boss',
};

// Return the soundtrack key associated with a game state.
export function getMusicTrackForState(stateName) {
  return STATE_TRACKS[stateName] || null;
}

// Own looping phase music and defer playback until browser input unlocks audio.
export class MusicManager {
  constructor(audioFactory = source => new Audio(source), volume = CONFIG.MUSIC_VOLUME) {
    this.volume = volume;
    this.tracks = new Map(Object.entries(MUSIC_SOURCES).map(([key, source]) => {
      const audio = audioFactory(source);
      audio.loop = true;
      audio.preload = 'metadata';
      audio.volume = this.volume;
      return [key, audio];
    }));
    this.desiredTrack = null;
    this.currentTrack = null;
    this.unlocked = false;
  }

  // Apply a normalized music level to every phase track.
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(CONFIG.ARENA_ALIVE_ALPHA, volume));
    this.tracks.forEach(audio => { audio.volume = this.volume; });
  }

  // Register the first player gesture that browsers require for media playback.
  bindUnlock(element) {
    element.addEventListener('pointerdown', () => this.unlock(), { once: true });
  }

  // Follow state transitions, switching immediately once audio is unlocked.
  setState(stateName) {
    this.desiredTrack = getMusicTrackForState(stateName);
    this.sync();
  }

  // Mark media as user-authorized and start the currently requested phase track.
  unlock() {
    this.unlocked = true;
    this.sync();
  }

  // Pause the previous loop and start the desired one from its beginning.
  sync() {
    if (!this.unlocked || !this.desiredTrack || this.currentTrack === this.desiredTrack) return;
    if (this.currentTrack) this.tracks.get(this.currentTrack)?.pause();
    const audio = this.tracks.get(this.desiredTrack);
    if (!audio) return;
    audio.currentTime = 0;
    this.currentTrack = this.desiredTrack;
    const playResult = audio.play();
    if (playResult?.catch) playResult.catch(() => {});
  }
}
