# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Estudiante (y compañeros de clase) de *Desarrollo de Soluciones en Ambientes Virtuales* que usa principalmente su **teléfono** para ver fotografías estereoscópicas dentro de unas gafas tipo Google Cardboard / VR box, y la computadora para presentarlo.

## Product Purpose
StereoLab es un visor web de fotos estereoscópicas lado a lado (SBS). Permite cargar una foto, calibrarla para los lentes de las gafas (separación, tamaño, altura) y verla en modo Cardboard. Éxito: ver la foto nítida y fusionada en las gafas sin pelear con los controles.

## Operating Context
- Se usa con el teléfono en horizontal dentro de las gafas; la pantalla queda inaccesible o solo se toca por los lados.
- Calibración con el asistente dentro de las gafas (tercios de pantalla: −, siguiente, +).
- Se publica en GitHub Pages; se demuestra en clase.

## Capabilities and Constraints
- Sitio estático: HTML, CSS, Three.js (ES Modules), lil-gui y Bootstrap 5 por CDN. Sin build ni servidor propio.
- Formatos: SBS completo, Half-SBS y foto normal (2D, detectada automáticamente).
- Las fotos nunca salen del navegador.
- lil-gui es requisito del proyecto académico y debe seguir presente.

## Evidence on Hand
- Demos: `assets/images/demo-sbs-1.jpg`, `assets/images/demo-sbs-2.jpg`.
- Icono: `assets/icons/cardboard.svg`.

## Product Principles
1. La foto es la protagonista; la interfaz se aparta.
2. Todo se puede hacer con el pulgar en el teléfono.
3. Calibrar debe ser posible sin quitarse las gafas.
4. Nada se sube a un servidor.
