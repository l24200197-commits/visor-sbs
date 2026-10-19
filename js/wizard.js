/**
 * Asistente de calibración que se usa CON las gafas puestas.
 * Dibuja una mira en cada ojo (línea vertical a la izquierda, horizontal a la derecha):
 * cuando ambas vistas están bien alineadas, el cerebro las fusiona en una sola cruz «+».
 * Pantalla dividida en tercios: izquierda = −, centro = siguiente, derecha = +.
 */
const STEPS = [
  { key: 'parallax', title: 'Separación', hint: 'Junta las líneas en una sola cruz +', step: 2, min: -300, max: 300, unit: 'px' },
  { key: 'scale', title: 'Tamaño', hint: 'Reduce hasta ver cómodos los 4 bordes de la foto', step: 2, min: 40, max: 300, unit: '%' },
  { key: 'vertical', title: 'Altura', hint: 'Si la cruz se ve escalonada, nivélala', step: 1, min: -50, max: 50, unit: 'px' },
];
const HOLD_DELAY = 420;   // ms antes de repetir al mantener pulsado
const REPEAT_EVERY = 60;  // ms entre repeticiones
const LONG_PRESS = 650;   // ms para abrir el asistente desde el modo Cardboard

export function createCalibrationWizard(stage, config, { onChange, onFinish }) {
  const eyes = ['left', 'right'].map(side => {
    const el = document.createElement('div');
    el.className = `calib-eye calib-eye-${side}`;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="calib-anchor">
        <div class="calib-target"><span class="calib-ring"></span><span class="calib-line"></span></div>
        <div class="calib-card">
          <div class="calib-step"></div>
          <div class="calib-value"></div>
          <div class="calib-hint"></div>
          <div class="calib-zones"><span>◀ −</span><span class="calib-next"></span><span>+ ▶</span></div>
        </div>
      </div>`;
    stage.append(el);
    return el;
  });

  let active = false;
  let index = 0;
  let holdTimer;
  let repeatTimer;
  let longPressTimer;
  let pressStart = null;

  function layout() {
    if (!active) return;
    const { width, height } = stage.getBoundingClientRect();
    // Mismo cálculo que viewer.js: centro de cada vista en px CSS dentro de su mitad.
    const half = width / 2;
    const centers = [
      [half / 2 + config.panX - config.parallax / 2, height / 2 + config.panY - config.vertical / 2],
      [half / 2 + config.panX + config.parallax / 2, height / 2 + config.panY + config.vertical / 2],
    ];
    eyes.forEach((el, i) => {
      el.style.setProperty('--cx', `${centers[i][0]}px`);
      el.style.setProperty('--cy', `${centers[i][1]}px`);
    });
  }

  function render() {
    const step = STEPS[index];
    const value = config[step.key];
    const sign = step.unit === 'px' && value > 0 ? '+' : '';
    eyes.forEach(el => {
      el.querySelector('.calib-step').textContent = `Paso ${index + 1} de ${STEPS.length} · ${step.title}`;
      el.querySelector('.calib-value').textContent = `${sign}${value} ${step.unit}`;
      el.querySelector('.calib-hint').textContent = step.hint;
      el.querySelector('.calib-next').textContent = index === STEPS.length - 1 ? '● Terminar' : '● Siguiente';
    });
    layout();
  }

  // Vibración corta: confirma el toque aunque no veas la pantalla (Android).
  const buzz = ms => { try { navigator.vibrate?.(ms); } catch { /* opcional */ } };

  function nudge(direction) {
    const step = STEPS[index];
    const next = Math.min(step.max, Math.max(step.min, config[step.key] + direction * step.step));
    if (next === config[step.key]) return;
    config[step.key] = next;
    buzz(6);
    onChange();
    render();
  }

  function next() {
    buzz(index < STEPS.length - 1 ? 25 : [25, 60, 25]);
    if (index < STEPS.length - 1) { index++; render(); }
    else { stop(); onFinish(); }
  }

  function stopHold() {
    clearTimeout(holdTimer);
    clearInterval(repeatTimer);
    clearTimeout(longPressTimer);
  }

  function keydown(event) {
    const actions = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };
    if (event.key in actions) { event.preventDefault(); nudge(actions[event.key]); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); next(); }
  }

  function start() {
    stopHold();
    active = true;
    index = 0;
    stage.classList.add('calibrating');
    document.addEventListener('keydown', keydown);
    render();
  }

  function stop() {
    stopHold();
    active = false;
    stage.classList.remove('calibrating');
    document.removeEventListener('keydown', keydown);
  }

  /** Devuelve true si el asistente consumió el toque (no debe contar como doble toque). */
  function pointerDown(event) {
    if (!active) {
      // Mantener pulsado (con un dedo y sin moverlo) dentro del modo Cardboard abre el asistente.
      clearTimeout(longPressTimer);
      if (event.isPrimary) {
        pressStart = { x: event.clientX, y: event.clientY };
        longPressTimer = setTimeout(start, LONG_PRESS);
      }
      return false;
    }
    event.preventDefault();
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    if (x > 1 / 3 && x < 2 / 3) { next(); return true; }
    const direction = x <= 1 / 3 ? -1 : 1;
    nudge(direction);
    holdTimer = setTimeout(() => { repeatTimer = setInterval(() => nudge(direction), REPEAT_EVERY); }, HOLD_DELAY);
    return true;
  }

  window.addEventListener('pointermove', event => {
    // Arrastrar o pellizcar no debe abrir el asistente.
    if (pressStart && Math.hypot(event.clientX - pressStart.x, event.clientY - pressStart.y) > 10) {
      clearTimeout(longPressTimer);
      pressStart = null;
    }
  });
  window.addEventListener('pointerup', stopHold);
  window.addEventListener('pointercancel', stopHold);
  new ResizeObserver(layout).observe(stage);

  return {
    start,
    stop,
    layout,
    pointerDown,
    isActive: () => active,
  };
}
