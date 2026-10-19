/**
 * Genera un JPG SBS con la calibración aplicada (separación, zoom, posición, altura),
 * a la resolución original de la foto. Se dibuja con Canvas 2D, sin tocar el WebGL.
 */
const MAX_WIDTH = 8192; // límite seguro de canvas en móviles

export function renderCalibratedSbs(image, config, stageSize) {
  const imgW = image.naturalWidth;
  const imgH = image.naturalHeight;
  const mono = config.format === 'mono';
  // Tamaño de UNA vista ya corregida (Half-SBS se expande al doble de ancho).
  const eyeW = config.format === 'full' ? imgW / 2 : imgW;
  const eyeAspect = eyeW / imgH;

  // Misma escala de ajuste que viewer.js para convertir px de pantalla en px de la foto.
  const { width, height } = stageSize;
  const fit = width && height ? Math.min(1, ((width / 2) / height) / eyeAspect) : 1;
  const pxToImage = width && height ? imgH / (height * fit) : 1;

  const shrink = Math.min(1, MAX_WIDTH / (eyeW * 2));
  const outEyeW = Math.round(eyeW * shrink);
  const outH = Math.round(imgH * shrink);
  const k = pxToImage * shrink;

  const canvas = document.createElement('canvas');
  canvas.width = outEyeW * 2;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = 'high';

  const s = config.scale / 100;
  const eyes = [
    { side: config.swap ? 'right' : 'left', dx: config.panX - config.parallax / 2, dy: config.panY - config.vertical / 2 },
    { side: config.swap ? 'left' : 'right', dx: config.panX + config.parallax / 2, dy: config.panY + config.vertical / 2 },
  ];
  eyes.forEach((eye, i) => {
    const sx = mono || eye.side === 'left' ? 0 : imgW / 2;
    const sw = mono ? imgW : imgW / 2;
    const dw = outEyeW * s;
    const dh = outH * s;
    const cx = outEyeW / 2 + eye.dx * k;
    const cy = outH / 2 + eye.dy * k;
    ctx.save();
    ctx.translate(i * outEyeW, 0);
    ctx.beginPath();
    ctx.rect(0, 0, outEyeW, outH);
    ctx.clip();
    ctx.drawImage(image, sx, 0, sw, imgH, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen.'))), 'image/jpeg', 0.92);
  });
}

/** En el teléfono abre el menú «Compartir» (permite «Guardar imagen»); si no, descarga. */
export async function saveImage(blob, fileName) {
  const file = new File([blob], fileName, { type: 'image/jpeg' });
  const touch = window.matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
      return 'shared';
    } catch (error) {
      if (error.name === 'AbortError') return 'cancelled';
      // Si compartir falla, seguimos con la descarga normal.
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return 'downloaded';
}
