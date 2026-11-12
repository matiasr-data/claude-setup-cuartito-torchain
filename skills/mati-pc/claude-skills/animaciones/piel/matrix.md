# 8 · Matrix (arte ASCII)
**En una frase:** la escena entera hecha de letras verdes de una pantalla de tubo vieja, en una retícula fija de 90 × 96 letras: no se dibuja letra a letra, se pinta en negativos escondidos y un motor decide qué letra va en cada celda.

## La piel (igual en cualquier escena)
- **Colores** (en el código van en `rgb()`; aquí, en hex):
  - El fósforo, `VERDE`, una rampa por brillo: 0 `#041A0C`, 0,3 `#107030`, 0,6 `#26CC5C`, 0,85 `#5CFF8E`, 1,05 `#B2FFC8`, 1,35 `#E8FFEE`, 1,7 `#FFFFFF`. Por encima de ~1 la letra se quema a blanco: eso se guarda para lo que importa.
  - `AMBAR`, el único otro color (`tinte` 1): de `#220C00` a `#8C3804`, `#F57610`, `#FF9626`, `#FFCC80` y `#FFFAEB`. Solo una cosa de la escena va en ámbar (aquí, el café).
  - El cristal apagado: de `#05170b` en el centro a `#010402` en los bordes (el lienzo, `#010402`). La letra en vídeo inverso, `#031208` sobre su bloque encendido.
  - El tubo: banda de refresco `rgba(60,255,120,0.035)`, líneas de barrido `rgba(0,0,0,0.32)`, viñeta hasta `rgba(0,0,0,0.72)`, reflejo `rgba(210,255,225,0.05)` arriba a la izquierda y marco `#010201` con un filo `rgba(120,255,160,0.07)`.
- **Letras:** solo IBM Plex Mono, peso 600, 20 px (`@remotion/google-fonts/IBMPlexMono`, la constante `PLEX`), centrada en celdas de 12 × 20 px (`CW`, `CH`). Todo es texto, hasta el personaje.
- **El trazo / la luz / el material:** cada celda guarda una letra (`ch`), un brillo (`br`, de 0 a 1,8 en 36 escalones), un `tinte` (0 verde, 1 ámbar) y si va en vídeo inverso (`inv`).
  - **La técnica, los negativos escondidos:**
    1. `negativo(nombre)` da un lienzo escondido de 270 × 384 (3 × 4 muestras por celda) en el que pintas en píxeles normales de 1080 × 1920.
    2. Cada pieza se pinta con `tinta(tono, brillo, mat)`: el rojo es el `tono` (separa las piezas: dos tonos distintos = un borde entre ellas; por debajo de 0,1 no hay borde), el verde el brillo (hasta `BR` = 1,6, así la luz se hace con degradados) y el azul el material (`mat` de 1 a 15, de 16 en 16).
    3. `leerCeldas` lo reduce a cada celda: cuánto la cubre (`cob`), su tono, su brillo y el material que más hay.
    4. `bordes(tono, umbral)` pasa Sobel: donde salta el tono pone la letra que sigue el borde (`-` `/` `|` `\`), una sola por borde y del lado claro.
    5. El relleno lo decides por material: densidad por brillo con `RAMPA` (`' .:;+*o#%@'`) más un tramado con `hash`, una letra fija (`=` en la mesa, `o` en los pies) o la de su dirección (`segmentoCercano`, para colas y patas). Umbrales: borde con `cob` ≥ 0,22, relleno con ≥ 0,45.
  - Lo fino, a mano encima: `poner`, `escribir`, `trazar` (una línea con la letra de su dirección) y `caja` (`+ - |`). La cara: el blanco de los ojos en vídeo inverso con la pupila como hueco o rendija, la nariz `v`, la boca `w`, bigotes `-` y `=`. El humo, `(` `)` que arriba se deshacen en `' . ~`.
  - Brillos de la casa: decorado 0,2–0,5; bordes del personaje ≥ 0,74; texto 0,6–1; ojos 1,12; el golpe hasta 1,7.
  - Encima de todo, `pintarTubo`: las letras con la curvatura del cristal (`CURVA` 0,035), el brillo del fósforo (dos copias pequeñas y borrosas sumadas con `lighter`), la banda de refresco, las líneas de barrido cada 4 px, la viñeta, el reflejo y el marco con esquinas de 70 px.
- **El fondo y el escenario:** casi negro. Lo fijo se pinta una vez (`cocina()` lo guarda en `COCINA`) y con poco brillo: lo sólido por negativo (mesa `=`, faldón `:`, patas `|`); lo recto con `caja` (ventana y pecera en `+ - |`, un cristal casi vacío con algún `.` y reflejos `\`); el suelo, una fila de `_` y puntos `.` `,` más juntos al fondo. Detalles vivos en ASCII puro: el pez `><(((º>` y sus burbujas `o` `°`.
- **Los rótulos y adornos fijos:** una terminal con márgenes `IZQ` = 4 y `DER` = `COLS - 5` (48 px).
  - Arriba (filas 3–9): el prompt `nombre@lugar:~$ ` a 0,62; la orden que se teclea sola (`teclas`: desigual, con pausas largas en los espacios); el cursor, un bloque inverso; y el registro `[ OK ] …` con cifras en vivo y coma decimal (`coma`), donde la cifra que cambia brilla un momento.
  - Abajo: `-- ESTADO --` en mayúsculas, `cuadro 000/360`, un aviso inverso a la derecha (`!! AVISO: …`) y la barra de progreso de `=` y `-`.
  - Las filas 2–10 y las cuatro de abajo se borran en cada cuadro: el texto se lee sobre la escena.
- **El movimiento:** todo sale de `t` en segundos; el contador cuenta 60 cuadros por segundo. El fósforo tiembla siempre (`global` = 1 + 0,012·sen(2π·7,3·t) + 0,008·sen(2π·2,1·t)), la banda de refresco baja cada 3 s, el cursor cambia cada 0,53 s, el registro sale a una letra cada 0,006 s, el spinner `*` gira a 30 por segundo y el aviso parpadea un segundo y se queda.
- **El momento:**
  - Lo que se mueve deja rastro: los bordes de sus 9 instantes anteriores (cada 0,014 s, más tenues) y dos fantasmas del fósforo (la pieza 0,05 s antes a 0,24 y 0,025 s antes a 0,44), solo en celdas vacías.
  - El golpe: un destello de todo el tubo (0,5·e^(−dS/0,07)), la sacudida (`temblor(t, T_SUELO, 0.32, 9, 3)`), filas que se corren una celda durante 0,1 s (`rasga`), un bloque inverso donde pega, un estallido de rayas dobles `- / | \` y 30 chispas `*` → `+` → `.` que caen.
  - El texto lo cuenta: el registro mide en vivo hasta el instante, el aviso parpadea en inverso y el personaje contesta con otra orden.

## Dónde está en el código
- **Piel (se reutiliza tal cual):**
  - `src/estilos/gato/AsciiMotor.ts`, entero: medidas (`W`, `H`, `CW`, `CH`, `COLS`, `FILAS`, `N`, `SX`, `SY`, `COD`, `BR`), colores (`VERDE`, `AMBAR`, `color`), la retícula (`Reticula`, `nueva`, `copia`, `dentro`, `poner`, `borrar`, `escribir`, `enCelda`, `hash`), las letras de dirección (`letraDireccion`, `letraSegmento`), `bordes`, `trazar`, los negativos (`negativo`, `tinta`, `leerCeldas`, `Celdas`) y el tubo (`Tubo`, `pintarTubo`).
  - De `src/estilos/gato/Ascii.tsx`: la letra (`PLEX`, `waitUntilDone`), `RAMPA`, `RAMPA_CARA`, `caja`, `dentroPoli`, `dentroElipse`, `coma`, `segmentoCercano`, `teclas`, `pintar` (destello, temblor, `rasga`, sacudida) y el componente con su `<canvas>`, `delayRender` y `dpr`.
- **Lo del gato y la taza (se rehace):** `cocina` (`MF`, `VENTANA`, `PECERA`), `pecera`, `pintarGato` (`MG`, `TG`), `escribirGato`, `pintarOjo` (`OJO_X`, `OJO_Y`), `pintarCara`, `pintarTaza` y `escribirTaza` (`MT`), `CHISPAS`, los textos (`PROMPT`, `ORDEN`, `ORDEN2`, `estado`, `distancia`, `T_CERO`) y el orden de `componer`; y de `src/estilos/gato/escena.ts`, `gato`, `taza`, `cafe`, `trozos` y `vapor`.

## Pintar tu escena en este estilo
1. Deja `AsciiMotor.ts` sin tocar. Copia `Ascii.tsx` en un archivo nuevo y quédate con la letra, `RAMPA`, `caja`, `segmentoCercano`, `teclas`, `pintar` y el componente (con otro nombre).
2. Tu fondo, como `cocina()`: un `negativo('fondo')`, cada cosa con `fillRect` o `fill(new Path2D(...))` y `tinta(tono, brillo, mat)` (un `tono` y un `mat` distintos por pieza), `leerCeldas`, `bordes(f.tono, 0.14)` y una letra por material. Lo recto, con `caja`. Guárdalo para hacerlo una sola vez.
3. Lo que se mueve, en cada cuadro y con su propio negativo (`negativo('perro')`, `negativo('pelota')`), así cada uno tiene su borde; léelo con `leerCeldas` antes de volver a pedir ese nombre, que lo borra. Los trazos, con `poli`, `elipse` y `cinta` (`src/estilos/gato/escena.ts`) o `capsula` (`src/estilos/formas.ts`); la luz, con `createRadialGradient` entre dos `tinta` del mismo tono. Escríbelo como `escribirGato`: borde, relleno con `RAMPA` y una celda de aire alrededor; la cara, a mano encima.
4. `componer(t)`: `copia(fondo, RET)` → lo vivo del fondo → de lo de detrás a lo de delante → lo único en ámbar → el golpe → `terminal` y `barra` con tus textos. Los tiempos, con `E`, `p` y `temblor` (`src/comun/curvas.ts`).
5. Tu momento: el rastro y los fantasmas para lo que cae o vuela, y en `pintar` el destello, `rasga` y la sacudida en el segundo del golpe.

**Errores fáciles:**
- Dos piezas con el mismo `tono` en un negativo se funden (sin borde entre ellas); un `mat` mayor de 15 se sale del canal azul.
- Escribir en la retícula guardada del fondo en vez de en `RET`: se ensucia para todos los cuadros. Siempre `copia` primero.
- Llamar a `setTransform` en un negativo borra la escala a celdas: para agrandar algo, `transform`, como hace `pintarGato`.
- Pintar antes de que cargue la letra (sin `delayRender` ni `waitUntilDone`) o dibujar letras fuera de `pintarTubo`: salen con otra letra, sin brillo y sin barrido.
