import { CONFIG } from '../config.js';

// Convert mouse and touch events into logical canvas pointer events.
export class Input {
  constructor(canvas, stateManager) {
    this.canvas = canvas;
    this.stateManager = stateManager;
    this.canvas.addEventListener('pointerdown', event => this.onPointerDown(event));
  }

  // Send a pointer press to the active state after hit-test coordinate conversion.
  onPointerDown(event) {
    event.preventDefault();
    const point = this.toCanvasPoint(event);
    if (CONFIG.LOG_ENABLED && CONFIG.LOG_INPUT) {
      console.log(`[INPUT] pointer down at ${point.x}, ${point.y}`);
    }
    this.stateManager.handlePointerDown(point);
  }

  // Translate browser pixels into the fixed logical canvas resolution.
  toCanvasPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CONFIG.CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CONFIG.CANVAS_HEIGHT,
    };
  }
}
