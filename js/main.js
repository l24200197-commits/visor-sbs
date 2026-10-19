import { createStereoViewer, DEFAULT_CONFIG } from './viewer.js';
import { createCalibrationGUI } from './controls.js';
import { loadSbsImage, looksLikeSbs } from './fileLoader.js';
import { createImmersiveMode, showToast } from './ui.js';
import { createCalibrationWizard } from './wizard.js';
import { attachGestures } from './gestures.js';
import { renderCalibratedSbs, saveImage } from './exporter.js';

// La calibración se recuerda en este navegador para no repetirla en cada visita.
const STORAGE_KEY = 'stereolab-calibracion';

function loadSaved() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const values = {};
    for (const key of Object.keys(DEFAULT_CONFIG)) {
      if (typeof data?.calibracion?.[key] === typeof DEFAULT_CONFIG[key]) values[key] = data.calibracion[key];
    }
    if (values.format && !['full', 'half'].includes(values.format)) delete values.format;
    return { values, wizardDone: data?.asistenteCompletado === true };
  } catch {
    return { values: {}, wizardDone: false };
  }
}

const saved = loadSaved();
let wizardDone = saved.wizardDone;
const config = { ...DEFAULT_CONFIG, ...saved.values };

function saveCalibration() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ calibracion: config, asistenteCompletado: wizardDone }));
  } catch { /* Almacenamiento no disponible (modo privado): solo se pierde el recuerdo. */ }
}
const stage = document.getElementById('viewerStage');
const info = document.getElementById('imageStatus');
const dimensions = document.getElementById('imageDimensions');
const emptyState = document.getElementById('emptyState');
const fileInput = document.getElementById('fileInput');
const demoButtons = [document.getElementById('demoOneBtn'), document.getElementById('demoTwoBtn')];
let requestCounter = 0;
let viewer;

try {
  viewer = createStereoViewer(stage, config);
} catch (error) {
  emptyState.hidden = false;
  emptyState.querySelector('strong').textContent = 'No se pudo iniciar WebGL';
  emptyState.querySelector('span').textContent = 'Prueba Chrome o Safari actualizado con aceleración gráfica activada.';
  info.textContent = `Error: ${error.message}`;
  throw error;
}

function applyChanges() {
  viewer.update();
  wizard.layout();
  saveCalibration();
}

const calibration = createCalibrationGUI(document.getElementById('guiHost'), config, applyChanges);
const wizard = createCalibrationWizard(stage, config, {
  onChange() { calibration.refresh(); applyChanges(); },
  onFinish() {
    wizardDone = true;
    saveCalibration();
    showToast('Calibración guardada. Mantén pulsado para recalibrar · doble toque para salir.');
  },
});
// Pellizcar / arrastrar / doble toque sobre el visor.
const gestureHint = document.getElementById('gestureHint');
function hideGestureHint() {
  gestureHint.classList.add('is-hidden');
  try { localStorage.setItem('stereolab-gestos-vistos', '1'); } catch { /* opcional */ }
}
try { if (localStorage.getItem('stereolab-gestos-vistos')) gestureHint.classList.add('is-hidden'); } catch { /* opcional */ }
setTimeout(() => gestureHint.classList.add('is-hidden'), 9000);

attachGestures(stage, config, {
  isEnabled: () => !wizard.isActive(),
  allowDoubleTap: () => !document.body.classList.contains('cardboard-mode'),
  onChange() { hideGestureHint(); calibration.refresh(); applyChanges(); },
  onReset() {
    Object.assign(config, { scale: DEFAULT_CONFIG.scale, panX: 0, panY: 0 });
    calibration.refresh();
    applyChanges();
    showToast('Imagen centrada.');
  },
});

const immersive = createImmersiveMode(() => viewer.resize(), {
  // La primera vez que se usan las gafas, el asistente arranca solo.
  onEnter() { if (!wizardDone) wizard.start(); },
  onExit() { wizard.stop(); },
  onPointerDown: event => wizard.pointerDown(event),
});

function resetCalibration() {
  Object.assign(config, DEFAULT_CONFIG);
  wizardDone = false;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* opcional */ }
  calibration.refresh();
  viewer.update();
  wizard.layout();
  showToast('Calibración restablecida.');
}

async function displaySource(source, selectedDemo = -1) {
  const requestId = ++requestCounter;
  info.textContent = 'Cargando fotografía…';
  try {
    const { image, name } = await loadSbsImage(source);
    if (requestId !== requestCounter) return; // Ignorar resultado de una carga anterior.
    // Elegimos el formato solo: una foto normal partida a la mitad no se puede fusionar.
    const isSbs = looksLikeSbs(image);
    if (!isSbs) config.format = 'mono';
    else if (config.format === 'mono') config.format = 'full';
    calibration.refresh();
    saveCalibration();
    const { width, height } = viewer.setImage(image, name);
    emptyState.hidden = true;
    info.textContent = name;
    dimensions.textContent = `${width} × ${height} px`;
    demoButtons.forEach((button, index) => button.classList.toggle('active', selectedDemo === index));
    if (!isSbs) showToast('Es una foto normal (no SBS): se muestra completa en ambos ojos, sin profundidad 3D.');
    else if (width % 2 !== 0) showToast('Imagen cargada. Se recomienda un ancho par para SBS.');
    else showToast(`Imagen cargada: ${name}`);
  } catch (error) {
    if (requestId !== requestCounter) return;
    info.textContent = viewer.getImageInfo()?.name || 'Sin imagen';
    showToast(error.message || 'Ocurrió un problema al cargar la fotografía.');
    if (!viewer.getImageInfo()) emptyState.hidden = false;
  }
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) displaySource(file);
  fileInput.value = ''; // Permite cargar dos veces el mismo archivo.
});

demoButtons[0].addEventListener('click', () => displaySource('./assets/images/demo-sbs-1.jpg', 0));
demoButtons[1].addEventListener('click', () => displaySource('./assets/images/demo-sbs-2.jpg', 1));
document.getElementById('resetBtn').addEventListener('click', resetCalibration);
document.getElementById('openBtn').addEventListener('click', () => fileInput.click());

// Panel de ajustes: hoja inferior en el teléfono, columna fija en escritorio.
const app = document.getElementById('appShell');
const settingsBtn = document.getElementById('settingsBtn');
function setPanel(open) {
  app.classList.toggle('panel-open', open);
  settingsBtn.setAttribute('aria-expanded', String(open));
}
settingsBtn.addEventListener('click', () => setPanel(!app.classList.contains('panel-open')));
document.getElementById('settingsClose').addEventListener('click', () => setPanel(false));

const helpDialog = document.getElementById('helpDialog');
document.getElementById('helpBtn').addEventListener('click', () => helpDialog.showModal());
helpDialog.addEventListener('click', event => { if (event.target === helpDialog) helpDialog.close(); });

// Descargar la imagen con la calibración aplicada.
const downloadBtn = document.getElementById('downloadBtn');
downloadBtn.addEventListener('click', async () => {
  const image = viewer.getImage();
  if (!image) { showToast('Primero abre una foto.'); return; }
  downloadBtn.disabled = true;
  try {
    const { width, height } = stage.getBoundingClientRect();
    const blob = await renderCalibratedSbs(image, config, { width, height });
    const base = (viewer.getImageInfo()?.name || 'foto').replace(/\.[^.]+$/, '');
    const result = await saveImage(blob, `${base}-sbs.jpg`);
    if (result !== 'cancelled') showToast('Imagen SBS lista, con tu calibración aplicada.');
  } catch (error) {
    showToast(error.message || 'No se pudo descargar la imagen.');
  } finally {
    downloadBtn.disabled = false;
  }
});
document.getElementById('calibrateBtn').addEventListener('click', async () => {
  await immersive.enterCardboard();
  if (!wizard.isActive()) wizard.start();
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const payload = {
    proyecto: 'StereoLab / Three.js',
    imagen: viewer.getImageInfo(),
    calibracion: { ...config },
    fecha: new Date().toISOString(),
    nota: 'Estos ajustes no modifican el archivo de imagen original.',
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = 'calibracion-sbs.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Ajustes descargados como JSON.');
});

// Arrastrar y soltar imágenes desde la computadora.
function dragOver(event) { event.preventDefault(); stage.classList.add('drag-over'); }
function dragLeave() { stage.classList.remove('drag-over'); }
stage.addEventListener('dragover', dragOver);
stage.addEventListener('dragleave', dragLeave);
stage.addEventListener('drop', (event) => {
  event.preventDefault();
  dragLeave();
  const file = event.dataTransfer?.files?.[0];
  if (file) displaySource(file);
});

// Se precarga una foto para que la primera visita no muestre un área vacía.
displaySource('./assets/images/demo-sbs-1.jpg', 0);

// App instalable: funciona sin Internet y abre a pantalla completa desde el inicio.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
const installBox = document.getElementById('installBox');
const installBtn = document.getElementById('installBtn');
const installed = window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let installPrompt = null;
if (installed) installBox.hidden = true;
else if (isIos) document.getElementById('installIos').hidden = false;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  installPrompt = null;
  installBtn.hidden = true;
  if (outcome === 'accepted') { installBox.hidden = true; showToast('StereoLab se instaló en tu teléfono.'); }
});
