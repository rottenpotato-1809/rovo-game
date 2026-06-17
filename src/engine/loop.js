// Drive update and render callbacks from requestAnimationFrame.
export class GameLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.lastTimestamp = 0;
    this.running = false;
  }

  // Start the frame loop.
  start() {
    this.running = true;
    requestAnimationFrame(timestamp => this.tick(timestamp));
  }

  // Stop the frame loop.
  stop() {
    this.running = false;
  }

  // Advance one frame using elapsed seconds.
  tick(timestamp) {
    if (!this.running) return;
    const dt = this.lastTimestamp ? (timestamp - this.lastTimestamp) / 1000 : 0;
    this.lastTimestamp = timestamp;
    this.update(dt);
    this.render();
    requestAnimationFrame(nextTimestamp => this.tick(nextTimestamp));
  }
}
