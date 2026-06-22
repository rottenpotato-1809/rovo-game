import { CONFIG } from '../config.js';
import { getMusicTrackForState, MusicManager } from '../systems/music.js';
import { assertEqual, summarize, test } from './testHarness.js';

function createFakeAudio() {
  return {
    currentTime: 7,
    loop: false,
    pauseCalls: 0,
    playCalls: 0,
    preload: '',
    volume: 1,
    pause() { this.pauseCalls++; },
    play() { this.playCalls++; return Promise.resolve(); },
  };
}

test('game states map to their intended soundtrack families', () => {
  assertEqual(getMusicTrackForState('menu'), 'menu');
  assertEqual(getMusicTrackForState('codex'), 'menu');
  assertEqual(getMusicTrackForState('prep'), 'prep');
  assertEqual(getMusicTrackForState('fight'), 'fight');
  assertEqual(getMusicTrackForState('boss'), 'boss');
  assertEqual(getMusicTrackForState('result'), 'boss');
});

test('music waits for input unlock and then follows state changes', () => {
  const audios = [];
  const manager = new MusicManager(() => {
    const audio = createFakeAudio();
    audios.push(audio);
    return audio;
  });
  manager.setState('menu');
  assertEqual(audios.reduce((total, audio) => total + audio.playCalls, 0), 0);
  manager.unlock();
  assertEqual(manager.currentTrack, 'menu');
  assertEqual(manager.tracks.get('menu').playCalls, 1);
  manager.setState('prep');
  assertEqual(manager.tracks.get('menu').pauseCalls, 1);
  assertEqual(manager.tracks.get('prep').playCalls, 1);
  assertEqual(manager.tracks.get('prep').volume, CONFIG.MUSIC_VOLUME);
  assertEqual(manager.tracks.get('prep').loop, true);
  assertEqual(manager.tracks.get('prep').preload, 'metadata');
});

test('music volume updates every soundtrack immediately', () => {
  const manager = new MusicManager(() => createFakeAudio());
  manager.setVolume(0.25);
  assertEqual(manager.volume, 0.25);
  assertEqual([...manager.tracks.values()].every(audio => audio.volume === 0.25), true);
});

summarize();
