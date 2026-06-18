import { CONFIG } from './config.js';
import { GameLoop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { StateManager } from './states/stateManager.js';
import { ArenaState } from './states/arenaState.js';
import { BossState } from './states/bossState.js';
import { CodexState } from './states/codexState.js';
import { FightState } from './states/fightState.js';
import { MenuState } from './states/menuState.js';
import { PrepState } from './states/prepState.js';
import { ResultState } from './states/resultState.js';
import { load } from './persistence/save.js';
import { preloadAssets } from './ui/assets.js';

// Boot the canvas application and start the animation loop.
async function main() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  preloadAssets()
    .then(() => console.log('[ASSET] runtime images ready'))
    .catch(error => console.warn('[ASSET] preload incomplete', error));
  const stateManager = new StateManager();
  const game = { run: null, saveData: load() };
  stateManager.register('arena', new ArenaState(stateManager));
  stateManager.register('menu', new MenuState(stateManager, game));
  stateManager.register('codex', new CodexState(stateManager, game));
  stateManager.register('fight', new FightState(stateManager));
  stateManager.register('boss', new BossState(stateManager, game));
  stateManager.register('prep', new PrepState(stateManager, game));
  stateManager.register('result', new ResultState(stateManager, game));
  stateManager.change('menu');

  new Input(canvas, stateManager);
  const loop = new GameLoop(
    dt => stateManager.update(dt),
    () => {
      syncCanvasResolution(canvas, ctx);
      stateManager.render(ctx);
    },
  );
  loop.start();
}

// Match the canvas backing store to its displayed size for crisp scaled rendering.
function syncCanvasResolution(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || CONFIG.PIXEL_RATIO, CONFIG.CANVAS_MAX_PIXEL_RATIO);
  const width = Math.round(rect.width * ratio);
  const height = Math.round(rect.height * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(canvas.width / CONFIG.CANVAS_WIDTH, 0, 0, canvas.height / CONFIG.CANVAS_HEIGHT, 0, 0);
}

main().catch(error => console.error('[STATE] boot failed', error));
