const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_BYTES = 30 * 1024 * 1024;

/**
 * Carga local con URL temporal; ningún archivo del estudiante sale de su navegador.
 * También carga las imágenes de muestra relativas al repositorio de GitHub Pages.
 */
export async function loadSbsImage(source) {
  const isFile = source instanceof File;
  if (isFile) {
    if (!SUPPORTED_TYPES.has(source.type) && !/\.(jpe?g|png|webp|avif)$/i.test(source.name)) {
      throw new Error('Selecciona una imagen JPG, PNG, WebP o AVIF.');
    }
    if (source.size > MAX_BYTES) throw new Error('La fotografía supera el límite de 30 MB.');
  }
  const url = isFile ? URL.createObjectURL(source) : source;
  const image = new Image();
  image.decoding = 'async';
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('No se pudo abrir la imagen. Comprueba el formato o archivo.'));
      image.src = url;
    });
    if (image.naturalWidth < 4 || image.naturalHeight < 2) {
      throw new Error('La resolución de la imagen es demasiado pequeña.');
    }
    return { image, name: isFile ? source.name : decodeURIComponent(source.split('/').pop()) };
  } finally {
    // El elemento Image conserva los píxeles decodificados tras revocar la URL.
    if (isFile) URL.revokeObjectURL(url);
  }
}

/**
 * Adivina si la imagen es SBS: en una foto estéreo las dos mitades son casi iguales
 * (solo cambian unos píxeles por la paralaje). En una foto normal son muy distintas.
 * Devuelve la diferencia media (0–255) entre mitades, tolerando un pequeño desplazamiento.
 */
export function halvesDifference(image) {
  const W = 64, H = 32, HALF = W / 2;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, W, H);
  const data = ctx.getImageData(0, 0, W, H).data;
  const gray = (x, y) => { const i = (y * W + x) * 4; return 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2]; };
  let best = Infinity;
  for (let shift = -4; shift <= 4; shift++) {
    let sum = 0, count = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 4; x < HALF - 4; x++) { sum += Math.abs(gray(x, y) - gray(HALF + x + shift, y)); count++; }
    }
    best = Math.min(best, sum / count);
  }
  return best;
}

export function looksLikeSbs(image) {
  // Una SBS siempre es más ancha que alta; una foto vertical nunca lo es.
  if (image.naturalWidth < image.naturalHeight * 1.2) return false;
  return halvesDifference(image) < 18;
}
