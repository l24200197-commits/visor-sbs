/**
 * Gestos sobre el visor: pellizcar = zoom, arrastrar = mover, doble toque = centrar.
 * En computadora: rueda del ratón = zoom, arrastrar = mover, doble clic = centrar.
 */
export const ZOOM_MIN = 40;
export const ZOOM_MAX = 300;
const PAN_X = 400;
const PAN_Y = 300;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function attachGestures(stage, config, { onChange, onReset, isEnabled, allowDoubleTap }) {
  const pointers = new Map();
  let pinch = null;
  let lastTap = { time: 0, x: 0, y: 0 };
  let moved = false;

  const distance = ([a, b]) => Math.hypot(a.x - b.x, a.y - b.y);
  const midpoint = ([a, b]) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  function startPinch() {
    const pts = [...pointers.values()];
    pinch = { dist: distance(pts) || 1, scale: config.scale, mid: midpoint(pts) };
  }

  function move(dx, dy) {
    config.panX = Math.round(clamp(config.panX + dx, -PAN_X, PAN_X));
    config.panY = Math.round(clamp(config.panY + dy, -PAN_Y, PAN_Y));
  }

  stage.addEventListener('pointerdown', event => {
    if (!isEnabled() || (event.pointerType === 'mouse' && event.button !== 0)) return;
    stage.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY });
    moved = false;
    if (pointers.size === 2) startPinch();
  });

  stage.addEventListener('pointermove', event => {
    const point = pointers.get(event.pointerId);
    if (!point || !isEnabled()) return;
    const dx = event.clientX - point.x;
    const dy = event.clientY - point.y;
    point.x = event.clientX;
    point.y = event.clientY;
    if (Math.hypot(event.clientX - point.startX, event.clientY - point.startY) > 8) moved = true;

    if (pointers.size >= 2 && pinch) {
      const pts = [...pointers.values()].slice(0, 2);
      const mid = midpoint(pts);
      config.scale = Math.round(clamp(pinch.scale * distance(pts) / pinch.dist, ZOOM_MIN, ZOOM_MAX));
      move(mid.x - pinch.mid.x, mid.y - pinch.mid.y);
      pinch.mid = mid;
      onChange();
    } else if (pointers.size === 1 && moved) {
      move(dx, dy);
      onChange();
    }
  });

  function release(event) {
    if (!pointers.has(event.pointerId)) return;
    const wasSingleTap = pointers.size === 1 && !moved && !pinch;
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!wasSingleTap || !allowDoubleTap()) return;
    const now = Date.now();
    const near = Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 40;
    if (now - lastTap.time < 320 && near) { lastTap.time = 0; onReset(); }
    else lastTap = { time: now, x: event.clientX, y: event.clientY };
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  stage.addEventListener('wheel', event => {
    if (!isEnabled()) return;
    event.preventDefault();
    config.scale = Math.round(clamp(config.scale * Math.exp(-event.deltaY * 0.0015), ZOOM_MIN, ZOOM_MAX));
    onChange();
  }, { passive: false });
}
