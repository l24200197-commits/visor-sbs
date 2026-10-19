# StereoLab — Visor estereoscópico SBS

Proyecto educativo para la materia **Desarrollo de Soluciones en Ambientes Virtuales**. Es una aplicación web estática, responsiva, construida con **HTML, CSS, Bootstrap 5, Three.js (ES Modules) y lil-gui**. Visualiza fotografías estereoscópicas lado a lado (Side by Side, SBS) en gafas para teléfono tipo Google Cardboard.

## 1. Estructura del proyecto

```text
visor-sbs/
├── index.html                 # Interfaz principal y dependencias CDN
├── manifest.webmanifest       # App instalable (nombre, iconos, pantalla completa)
├── sw.js                      # Service worker: uso sin Internet
├── css/
│   └── styles.css             # Diseño responsivo y modo inmersivo
├── js/
│   ├── main.js                # Inicialización y eventos
│   ├── scene.js               # WebGLRenderer, cámaras y dos vistas
│   ├── viewer.js              # Mapeo UV SBS y calibración de planos
│   ├── controls.js            # Panel lil-gui
│   ├── wizard.js              # Asistente de calibración con las gafas puestas
│   ├── gestures.js            # Pellizcar (zoom), arrastrar (mover), doble toque (centrar)
│   ├── exporter.js            # Descarga la imagen SBS con la calibración aplicada
│   ├── fileLoader.js          # Lectura de archivos locales
│   └── ui.js                  # Pantalla completa, Cardboard y avisos
├── assets/
│   ├── images/
│   │   ├── demo-sbs-1.jpg     # Muestra: montaña y bote
│   │   └── demo-sbs-2.jpg     # Muestra: galería y cubo
│   └── icons/
│       └── cardboard.svg
└── README.md
```

## 2. Cómo iniciar la aplicación

No hace falta Node.js, npm, framework de servidor ni clave API. Las bibliotecas se descargan de jsDelivr al abrir la página, por lo que **se requiere Internet** al menos para cargar los CDN.

**En VS Code:** abre la carpeta `visor-sbs` y ejecuta `index.html` con la extensión **Live Server** (opción *Open with Live Server*).

**Alternativa con Python:** en una terminal situada en la carpeta `visor-sbs`, ejecuta:

```bash
python -m http.server 5500
```

Abre `http://localhost:5500/`. **No abras `index.html` con doble clic y `file://`**: los módulos ES y otras funcionalidades requieren un servidor HTTP/HTTPS.

## 3. Cómo usar el visor

1. La app carga **DEMO 01** automáticamente. Comprueba el efecto estereoscópico o abre **DEMO 02**.
2. Haz clic en **Cargar SBS** y selecciona una fotografía SBS (`.jpg`, `.png`, `.webp`, `.avif`, hasta 30 MB). También puedes arrastrarla al visor en computadora.
3. La fotografía debe incluir **la vista izquierda en la mitad izquierda y la derecha en la mitad derecha**. Si están invertidas, utiliza la opción **Intercambiar L/R**.
4. **Recomendado:** pulsa **Calibrar con gafas** y coloca el teléfono en el visor. Cada ojo ve una línea (vertical en el izquierdo, horizontal en el derecho) dentro de un círculo. Toca el **tercio izquierdo** de la pantalla para restar, el **derecho** para sumar (mantén pulsado para avanzar rápido) y el **centro** para pasar al siguiente paso: *Separación → Tamaño → Altura*. La calibración es correcta cuando ves **una sola cruz «+» centrada**. Los ajustes se guardan automáticamente en el navegador; la primera vez que entras en modo Cardboard el asistente aparece solo. Dentro del visor, **mantén pulsado** para recalibrar. En computadora puedes usar las flechas y Enter.
5. También puedes ajustar parámetros con **lil-gui**. Es preferible comenzar con *Paralaje 0 px, Escala 100%, Alineación 0 px*.
6. Pulsa **Entrar en modo Cardboard**. En móviles compatibles, el navegador solicitará pantalla completa y orientación horizontal; algunas versiones de iOS Safari no permiten estas funciones para elementos HTML arbitrarios. En ese caso el proyecto usa un modo inmersivo CSS y hay que girar manualmente el teléfono.
7. Coloca el teléfono horizontal en las gafas. **Para salir**, pulsa `Esc` en computadora; en el teléfono, toca dos veces rápidamente la pantalla o usa el botón/gesto del sistema para salir de pantalla completa. Puedes sacar primero el teléfono de las gafas para acceder a la pantalla.
8. **Zoom con los dedos:** pellizca sobre el visor para acercar o alejar, arrastra con un dedo para mover y toca dos veces para centrar. En computadora: rueda del ratón, arrastrar y doble clic.
9. **Descargar:** genera un JPG SBS a la resolución original con la separación, zoom y posición aplicados. En el teléfono abre el menú *Compartir* (elige *Guardar imagen*); en computadora se descarga.
10. Si la imagen resulta incómoda, retira el visor y reduce la escala o el paralaje. No fuerces la fusión de fotografías con disparidad excesiva.
11. **Ajustes JSON** descarga un archivo con los valores elegidos y metadatos de la fotografía (sin incluir sus píxeles). Restablecer calibración regresa a los valores iniciales y borra la calibración guardada.

### Calibración lil-gui

| Control | Descripción | Valor inicial |
|---|---|---|
| Separación (px) | Separa (+) o acerca (−) las dos vistas para que coincidan con el centro de cada lente | 0 |
| Zoom (%) | Cambia el tamaño de ambas imágenes sin distorsionar su proporción (40–300 %, también con pellizco) | 100 |
| Mover X (px) | Desplazamiento horizontal común de las dos vistas | 0 |
| Mover Y (px) | Desplazamiento vertical común de las dos vistas | 0 |
| Desnivel L/R (px) | Corrige la diferencia vertical relativa entre ojos | 0 |
| Tipo de SBS | **Completo:** imágenes de ancho no comprimido. **Half-SBS:** cada mitad comprimida horizontalmente. **Foto normal (2D):** la imagen completa en ambos ojos. Se elige automáticamente al cargar | Completo |
| Intercambiar L/R | Corrige una fotografía cuyo orden de perspectivas está invertido | No |

La calibración digital del paralaje **no cambia la distancia interpupilar física** ni repara una fotografía con disparidades o geometría estéreo erróneas. Las lentes Cardboard pueden requerir calibración óptica/distorsión específica no implementada en este visor introductorio.

### En el teléfono

- **Instálala como app:** en Android, botón **?** → *Instalar StereoLab* (o menú de Chrome → *Instalar app*). En iPhone, Safari → *Compartir* → *Agregar a inicio*. Instalada se abre a pantalla completa, sin barras del navegador (en iPhone es la única forma de quitarlas) y funciona sin Internet.
- En modo gafas **la pantalla no se apaga** (Wake Lock) y, si el teléfono está vertical, aparece un aviso para girarlo.
- Durante la calibración el teléfono **vibra** con cada toque (Android) para confirmar que se registró.

## 4. Arquitectura técnica

- `Texture` carga el archivo de imagen en GPU.
- Dos geometrías `PlaneGeometry` recortan las regiones izquierda (`U=0…0.5`) y derecha (`U=0.5…1`) mediante coordenadas UV, sin cortar ni alterar el archivo original.
- Cada plano se dibuja en una escena independiente, con una cámara `OrthographicCamera` compartida y un único `WebGLRenderer`, mediante `setViewport()` y `setScissor()`.
- `viewer.js` calcula la escala de ajuste que conserva el aspecto natural de la imagen en la mitad de la pantalla, y aplica los desplazamientos en píxeles CSS.
- `lil-gui` modifica un objeto compartido de configuración y actualiza las transformaciones inmediatamente.
- Las fotos locales se procesan **únicamente en el navegador**. No se suben a servidores.

## 5. Publicar con GitHub Pages

1. Crea un repositorio GitHub, por ejemplo `visor-sbs`.
2. Sube **todo el contenido** de esta carpeta, manteniendo `index.html` en la raíz del repositorio.
3. En el repositorio entra en **Settings → Pages → Build and deployment**.
4. Selecciona **Deploy from a branch**, rama `main` y carpeta `/(root)`. Guarda.
5. Abre la dirección que muestre GitHub Pages, que habitualmente tiene el formato `https://USUARIO.github.io/visor-sbs/`.
6. Desde el navegador del teléfono, visita esa dirección, carga una imagen SBS y utiliza **Modo Cardboard**.

Para crear el repositorio con Git local:

```bash
git init
git add .
git commit -m "Visor SBS con Three.js y lil-gui"
git branch -M main
git remote add origin https://github.com/USUARIO/visor-sbs.git
git push -u origin main
```

Reemplaza `USUARIO` por tu cuenta, y crea primero el repositorio vacío en GitHub. No se incluyen rutas absolutas, así que se puede publicar como *project page* sin reescribir las rutas.

## 6. Evidencias sugeridas

- Captura de la estructura del repositorio en VS Code (HTML, CSS y módulos JS separados).
- Captura del visor con una fotografía propia cargada y sus dos perspectivas visibles.
- Capturas de los controles con valores de calibración antes y después de los ajustes.
- Foto del móvil en las gafas Cardboard y prueba presencial del efecto de profundidad.
- Enlace público de GitHub Pages y archivo `calibracion-sbs.json` descargado.
- Conclusiones técnicas: diferencia entre separación física de lentes, paralaje/desplazamiento digital y formato Half-SBS.

## 7. Resolución de problemas

- **Pantalla negra o panel vacío:** comprueba acceso a Internet para Three.js y lil-gui desde jsDelivr; abre la consola del navegador. Puede estar bloqueado un CDN en la red institucional.
- **No funciona al abrir con doble clic:** usa Live Server o `python -m http.server 5500`.
- **La imagen sale deformada horizontalmente:** verifica la opción *Tipo de SBS*. Half-SBS requiere descomprimir horizontalmente cada ojo.
- **Las vistas están cruzadas:** prueba *Intercambiar L/R*; revisa el archivo original si el problema persiste.
- **Aparece imagen doble:** ajusta primero la escala y luego el paralaje en incrementos pequeños. Si la fotografía tiene un desplazamiento extremo, corrígela en el editor estereoscópico original.
- **El teléfono se mantiene vertical:** activa orientación horizontal manualmente; `screen.orientation.lock()` y pantalla completa no están admitidos en todos los dispositivos.
- **Bordes negros:** el visor preserva la relación de aspecto; esto es intencional para evitar estiramientos.
- **Cargué una foto normal del teléfono:** el visor la detecta (foto vertical o mitades muy distintas) y la muestra completa en ambos ojos, sin profundidad. Para verla en 3D necesitas dos tomas: una foto, desplaza el teléfono ~6.5 cm a la derecha sin girarlo y toma otra; luego únelas lado a lado (izquierda | derecha).
- **No hay 3D visible:** comprueba que la fotografía contenga dos perspectivas realmente distintas y no dos copias idénticas.

## 8. Referencias

- Three.js — https://threejs.org/docs/
- Instalación por CDN e import map — https://threejs.org/manual/#en/installation
- lil-gui — https://lil-gui.georgealways.com/
- Bootstrap — https://getbootstrap.com/
- GitHub Pages — https://docs.github.com/en/pages

**Licencia educativa:** El código de esta muestra se entrega para ser adaptado y utilizado en clase. Las imágenes de demostración fueron generadas para este proyecto.
