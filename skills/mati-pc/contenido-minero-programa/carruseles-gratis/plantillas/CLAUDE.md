# Carrusel animado · las reglas de la casa

## Qué hacemos
- Un carrusel de Instagram en el que cada slide es un MP4 corto en loop: 1080×1350 (4:5), 30 fps, con su propio sonido. Un archivo por slide, nunca uno solo.
- Cada slide dura 4, 6 u 8 segundos: compases enteros a 120 BPM. La música sigue de un slide al siguiente, como una sola canción.

## Cómo se construye
- Con la skill **carruseles-gratis** y su motor: `motor/` (motor.js, piezas.js, slides.js, viegas.css) y `scripts/`.
- Cada slide es un HTML que dibuja el frame que se le pide con `window.seek(t)`. Es el playhead: mismo t, mismo frame. Nada de timers ni de `Math.random` (el azar va con semilla): el render pide los frames en cualquier orden.
- Todo se renderiza con `python scripts/animar.py`: fotos → música → MP4 → pruebas → vista.html. Sin frameworks de video, sin editores, sin capturas de pantalla.

## El frame 0
- Es la portada del slide y lo primero que se ve al deslizar: un diseño terminado y legible sin moverse. El PNG estático y el frame 0 del MP4 son la misma imagen.
- El último frame vuelve al reposo y empalma con el frame 0. Ningún golpe ni movimiento nuevo en los últimos 0,8 s.

## Instagram
- Margen de 72 px en todos los bordes. Nada importante arriba a la derecha (contador «1/9») ni abajo a la derecha (icono de sonido).

## El movimiento (nuestro lenguaje)
- **Natural antes que llamativo.** El texto entra por letras, palabras o líneas: sube un poco y pasa de desenfocado (14-22 px) a nítido, con la curva (.16,1,.3,1). Nada aparece de golpe ni solo con fade.
- **Sin rebotes forzados.** Nada de sellos ni «clics» que caen en cada slide. Si un carrusel necesita un rebote, uno solo y donde signifique algo.
- **Un gesto por slide, y que no se repita seguido:** brillo que cruza la palabra · subrayado que se dibuja · halo de luz detrás · foco de cámara (el fondo se desenfoca y vuelve).
- **Ventanas y terminales estilo macOS:** semáforo, título centrado, esquinas de 16 px, sombra suave. Entran con fade, suben y se enfocan; después se escribe el comando y aparece la salida.
- **Profundidad de campo:** orbes y bokeh desenfocados detrás, recursos del tema a media distancia (timeline, keyframes, números fantasma) y algo muy desenfocado delante, en los bordes.
- **Ritmo:** cada golpe cae en un tiempo (cada 0,5 s) y algo nuevo pasa cada 2 a 4 segundos.

## Visual
- La marca está en `MARCA.md`: colores, fuentes, @, foto y anatomía. Un color principal y un acento por slide.
- Texto en color de acento solo por encima de 90 px. Sin texto en degradado, sin neón, sin brillos de interfaz.
- El texto es texto de verdad, dibujado por el código. Nunca una imagen de texto.

## Sonido
- `scripts/musica.py` sintetiza la música en el modo Synthwave 80s de SynthFlow (semilla #8492, a 120 BPM) y los efectos (whoosh, clic, brillo, campana), a -14 LUFS y en loop perfecto. `python scripts/musica.py noche` cambia a un estilo más tranquilo.
- Si te doy una música propia, se mide su tempo y cada slide toma sus compases.

## Antes de mostrarme nada
1. `BRIEF.md`: estrategia, estructura y copy. Espera mi OK.
2. `STORYBOARD.md`: una línea por tiempo con lo que se mueve, cómo entra y el sonido. Espera mi OK.
3. `python scripts/animar.py estatico`: mira `resultados/hoja.png` y `resultados/miniatura.png` y pon nota con la rúbrica de la skill (los 4 fundamentos, portada y lectura en el móvil). Corrige los tres peores puntos hasta que todo llegue a 8.
4. `python scripts/animar.py animado`: mira las hojas por tiempo y `resultados/pruebas.json` (frame 0 = PNG, loop, sonido).
5. Entrega: `python scripts/entregar.py` (los MP4 numerados en orden de subida, portada, leyenda, cómo subirlo y un .zip en `entrega/`). Si te digo una carpeta, `--destino "esa carpeta"`.
