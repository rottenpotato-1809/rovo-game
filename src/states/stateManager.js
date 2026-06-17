import { CONFIG } from '../config.js';

// Own the active state and route lifecycle calls through a small finite state machine.
export class StateManager {
  constructor() {
    this.states = new Map();
    this.current = null;
    this.currentName = '';
  }

  // Register a state object by name.
  register(name, state) {
    this.states.set(name, state);
  }

  // Transition to another registered state.
  change(name, payload = {}) {
    if (this.current && this.current.exit) this.current.exit();
    this.current = this.states.get(name);
    this.currentName = name;
    if (CONFIG.LOG_ENABLED && CONFIG.LOG_STATE) {
      console.log(`[STATE] transition to ${name}`);
    }
    if (this.current && this.current.enter) this.current.enter(payload);
  }

  // Update the active state.
  update(dt) {
    if (this.current && this.current.update) this.current.update(dt);
  }

  // Render the active state.
  render(ctx) {
    if (this.current && this.current.render) this.current.render(ctx);
  }

  // Route pointer presses to the active state.
  handlePointerDown(point) {
    if (this.current && this.current.handlePointerDown) {
      this.current.handlePointerDown(point);
    }
  }

  // Route pointer movement to the active state.
  handlePointerMove(point) {
    if (this.current && this.current.handlePointerMove) {
      this.current.handlePointerMove(point);
    }
  }

  // Route pointer release to the active state.
  handlePointerUp(point) {
    if (this.current && this.current.handlePointerUp) {
      this.current.handlePointerUp(point);
    }
  }
}
