// Return whether this browser exposes a usable fullscreen request/exit pair.
export function isFullscreenSupported(target, documentRef = globalThis.document) {
  if (!target || !documentRef) return false;
  const request = target.requestFullscreen || target.webkitRequestFullscreen;
  const exit = documentRef.exitFullscreen || documentRef.webkitExitFullscreen;
  return typeof request === 'function' && typeof exit === 'function';
}

// Wire the mobile fullscreen control without coupling it to canvas input.
export function setupFullscreenButton(button, target, documentRef = globalThis.document) {
  if (!button || !isFullscreenSupported(target, documentRef)) {
    if (button) button.hidden = true;
    return;
  }

  const getFullscreenElement = () => documentRef.fullscreenElement || documentRef.webkitFullscreenElement;
  const syncLabel = () => {
    const active = Boolean(getFullscreenElement());
    button.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
    button.title = active ? 'Exit fullscreen' : 'Enter fullscreen';
  };

  button.hidden = false;
  button.addEventListener('click', async event => {
    event.preventDefault();
    event.stopPropagation();
    try {
      if (getFullscreenElement()) {
        const exit = documentRef.exitFullscreen || documentRef.webkitExitFullscreen;
        await exit.call(documentRef);
      } else {
        const request = target.requestFullscreen || target.webkitRequestFullscreen;
        await request.call(target);
        if (globalThis.screen?.orientation?.lock) {
          await globalThis.screen.orientation.lock('landscape').catch(() => {});
        }
      }
    } catch {
      // Browsers may deny fullscreen outside an eligible top-level mobile tab.
    }
    syncLabel();
  });
  documentRef.addEventListener('fullscreenchange', syncLabel);
  documentRef.addEventListener('webkitfullscreenchange', syncLabel);
  syncLabel();
}
