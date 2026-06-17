import { CONFIG } from './config.js';
import { GameLoop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { StateManager } from './states/stateManager.js';
import { ArenaState } from './states/arenaState.js';
import { FightState } from './states/fightState.js';
import { PrepState } from './states/prepState.js';
import { ResultState } from './states/resultState.js';

// Boot the canvas application and start the animation loop.
function main() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = CONFIG.CANVAS_WIDTH;
  canvas.height = CONFIG.CANVAS_HEIGHT;

  const stateManager = new StateManager();
  const game = { run: null };
  stateManager.register('arena', new ArenaState(stateManager));
  stateManager.register('fight', new FightState(stateManager));
  stateManager.register('prep', new PrepState(stateManager, game));
  stateManager.register('result', new ResultState(stateManager, game));
  stateManager.change('prep');

  new Input(canvas, stateManager);
  const loop = new GameLoop(
    dt => stateManager.update(dt),
    () => stateManager.render(ctx),
  );
  loop.start();
}

main();
