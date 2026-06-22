import { isFullscreenSupported } from '../ui/fullscreen.js';
import { assertEqual, summarize, test } from './testHarness.js';

test('fullscreen support requires both request and exit methods', () => {
  assertEqual(isFullscreenSupported({ requestFullscreen() {} }, { exitFullscreen() {} }), true);
  assertEqual(isFullscreenSupported({}, { exitFullscreen() {} }), false);
  assertEqual(isFullscreenSupported({ requestFullscreen() {} }, {}), false);
});

test('webkit fullscreen methods are accepted on mobile browsers', () => {
  assertEqual(isFullscreenSupported({ webkitRequestFullscreen() {} }, { webkitExitFullscreen() {} }), true);
});

summarize();
