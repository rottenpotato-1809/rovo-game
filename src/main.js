import { CONFIG } from './config.js';
import { GameLoop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { StateManager } from './states/stateManager.js';
import { ArenaState } from './states/arenaState.js';
import { FightState } from './states/fightState.js';

// Boot the canvas application and start the animation loop.
function main() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = CONFIG.CANVAS_WIDTH;
  canvas.height = CONFIG.CANVAS_HEIGHT;

  const stateManager = new StateManager();
  stateManager.register('arena', new ArenaState(stateManager));
  stateManager.register('fight', new FightState(stateManager));
  stateManager.change('arena');

  new Input(canvas, stateManager);
  const loop = new GameLoop(
    dt => stateManager.update(dt),
    () => stateManager.render(ctx),
  );
  loop.start();
}

main();
