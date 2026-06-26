import { isFullscreenSupported, setupFullscreenButton } from '../ui/fullscreen.js';
import { assertEqual, summarize, test } from './testHarness.js';

test('fullscreen support requires both request and exit methods', () => {
  assertEqual(isFullscreenSupported({ requestFullscreen() {} }, { exitFullscreen() {} }), true);
  assertEqual(isFullscreenSupported({}, { exitFullscreen() {} }), false);
  assertEqual(isFullscreenSupported({ requestFullscreen() {} }, {}), false);
});

test('webkit fullscreen methods are accepted on mobile browsers', () => {
  assertEqual(isFullscreenSupported({ webkitRequestFullscreen() {} }, { webkitExitFullscreen() {} }), true);
});

test('fullscreen button hides while fullscreen is active', () => {
  const listeners = {};
  const button = {
    hidden: true,
    setAttribute(name, value) {
      this[name] = value;
    },
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
  };
  const target = { requestFullscreen() {} };
  const documentRef = {
    fullscreenElement: null,
    exitFullscreen() {},
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
  };

  setupFullscreenButton(button, target, documentRef);
  assertEqual(button.hidden, false);
  documentRef.fullscreenElement = target;
  listeners.fullscreenchange();
  assertEqual(button.hidden, true);
});

summarize();
