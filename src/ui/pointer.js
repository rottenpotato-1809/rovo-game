const pointer = {
  x: Number.NEGATIVE_INFINITY,
  y: Number.NEGATIVE_INFINITY,
  pressed: false,
};

// Update the shared logical pointer position used by canvas control animation.
export function setPointerPosition(point) {
  pointer.x = point.x;
  pointer.y = point.y;
}

// Update whether the primary pointer is currently held down.
export function setPointerPressed(pressed) {
  pointer.pressed = pressed;
}

// Read the current pointer snapshot without exposing mutation.
export function getPointerState() {
  return { ...pointer };
}
