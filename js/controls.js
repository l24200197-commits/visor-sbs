import GUI from 'lil-gui';

/**
 * Panel lil-gui embebido en una columna Bootstrap: NO flota sobre las gafas.
 * La configuración se comparte por referencia con viewer.js.
 */
export function createCalibrationGUI(host, config, onChange) {
  const gui = new GUI({ container: host, width: 330, title: 'Ajustes SBS' });
  const controllers = [];
  const add = (parent, key, ...options) => {
    const controller = parent.add(config, key, ...options).onChange(onChange);
    controllers.push(controller);
    return controller;
  };

  const stereo = gui.addFolder('Separación y zoom');
  add(stereo, 'parallax', -300, 300, 1).name('Separación (px)');
  add(stereo, 'scale', 40, 300, 1).name('Zoom (%)');
  stereo.open();

  const alignment = gui.addFolder('Alineación');
  add(alignment, 'panX', -400, 400, 1).name('Mover X (px)');
  add(alignment, 'panY', -300, 300, 1).name('Mover Y (px)');
  add(alignment, 'vertical', -50, 50, 1).name('Desnivel L/R (px)');
  alignment.open();

  const source = gui.addFolder('Tipo de foto');
  add(source, 'format', { 'Completo (Full-SBS)': 'full', 'Comprimido (Half-SBS)': 'half', 'Foto normal (2D)': 'mono' }).name('Formato');
  add(source, 'swap').name('Intercambiar L/R');
  source.open();

  return {
    gui,
    refresh() { controllers.forEach(controller => controller.updateDisplay()); },
    dispose() { gui.destroy(); },
  };
}
