# 2 · Neón cyberpunk
**En una frase:** una escena de noche hecha de siluetas oscuras recortadas con luz de borde, tubos de neón rosa y cian que se encienden a golpes y zumban, y un suelo mojado que lo refleja todo.

## La piel (igual en cualquier escena)
- **Colores:**
  - `NOCHE` `#07020F`: el fondo. `SILUETA` `#0A0614`: los objetos oscuros.
  - `ROSA` `#FF2BD6` (alma `NUCLEO_ROSA` `#FFE3FA`): el neón principal y la luz de borde de atrás. `CIAN` `#2BF0FF` (alma `NUCLEO_CIAN` `#E6FEFF`): el segundo neón y la luz de delante. `VIOLETA` `#8E5BFF`: los filetes finos.
  - Un color propio solo para lo que tiene que destacar: `OJO` `#D4FF3F` (con `NUCLEO_OJO` `#FBFFE2`) para los ojos, y `AMBAR` `#FF9A3C` (con `NUCLEO_AMBAR` `#FFE5C2` y `#C25A12`) para el café.
  - Los degradados: pared de `#220938` a `#1A0838`, techo de `#0A0318` a `#34104E`, suelo de `#150828` a `#07020F` y un cuerpo oscuro de `#2E0F44` a `#0B2440` (más morado detrás, más azul delante).
  - La luz de borde usa `#FF4FDF` y `#5CF6FF`; la lluvia, `#E4D6FF` y `#D9C8FF`; la viñeta, negro al 0,78.
- **Letras:** `NEON` (Tilt Neon 400), solo en letreros que están dentro del mundo. Los letreros grandes van dos veces: un halo (trazo de 16–20 px al 0,2) y encima el relleno del alma con un trazo de su color de 3,5–4,5 px.
- **El trazo / la luz / el material:**
  - Toda línea de luz es un `Tubo` de tres trazos: el halo (`w × 3,4`, al 0,16), el color (`w`, al 0,95) y el alma blanca (`w × 0,38`). Las puntas son redondas.
  - Un objeto sólido es un relleno oscuro con un `Tubo` en su contorno, o va bajo `filter={url('borde')}` (`FiltrosBorde`). Ese filtro le pone un filo fino y una banda ancha rosa arriba y detrás y cian delante, más un halo por fuera. `borde-lejos` es lo mismo más apagado, para lo que queda detrás.
  - Detrás de cada neón, una mancha de su luz en la pared (`poza-rosa` y `poza-cian`) con la misma opacidad que el neón.
  - Sobre todo, el `bloom`: solo lo que pasa de cierta luz se desenfoca (18 y 5) y se suma a la imagen.
  - Lo mojado lo refleja todo. La sala se repite invertida (`matrix(1 0 0 -1 0 2F)`) con `reflejo` y `mascara-suelo`. Lo que apoya en el suelo se refleja desde `SUELO` (`reflejo-obj`) y lo de la encimera desde `MESA_Y` (`reflejo-mesa`). Cada neón deja además una `Raya` en el suelo, partida y temblona.
  - Los ojos (`OjoNeon`) llevan un halo radial, el relleno `ojo`, la pupila oscura, un brillo blanco y un contorno del alma. Brillan más cuando miran a cámara (`kOjo`) y sueltan un destello en cruz.
- **El fondo y el escenario:**
  - Un techo con vigas en perspectiva (`vigas`) y un tubo rosa grande delante. La pared lleva el azulejo (`azulejo`, 96 × 48), un lavado rosa desde arriba (`lavado`), la bruma de la sala (`bruma-sala`) y la niebla cian (`niebla`) junto al suelo.
  - El suelo, oscuro y con juntas en perspectiva (`juntas`).
  - Lluvia tenue dentro (`LLUVIA_DENTRO`) y brumas rosa y cian que van y vienen (`deriva`). La viñeta, encima de todo.
- **Los rótulos y adornos fijos:** no hay pantalla de datos encima. Lo que se lee son letreros de neón dentro de la escena: el icono, una palabra rosa que zumba y otra cian que parpadea de verdad. Y adornos que viven solos: luces de antena y pilotos que parpadean, coches que cruzan y lluvia.
- **El movimiento:**
  - Fluido: todo sale de `t` en segundos.
  - Al empezar, cada neón se enciende a golpes con `enciende(t, t0, dur, semilla)`: apagado (0,06), 8 golpes al azar entre 0,1 y 0,92 y fijo. Los neones arrancan escalonados entre 0 y 0,32 s y la sala sube de 0,3 a 1 en 0,55 s (`amb`).
  - Después, `zumbido(t, semilla, ráfagas)`: dentro de cada ráfaga el neón cambia 30 veces por segundo entre 0,08, 0,5 y 1.
  - Los pilotos cambian 1,5–2 veces por segundo (`Math.floor(t * 2)`, `t * 1.5`). La lluvia y el tráfico dan vueltas enteras en `DUR`, así el vídeo se repite sin costura.
- **El momento:**
  - Lo que cae deja una estela de larga exposición (`estela`): 4 puntos de su borde dejan tiras de 16 tramos que engordan (3 + 15·k²) con el alma blanca, y detrás van 2 `TazaFantasma`. El suelo se ilumina antes de que llegue (`luzTaza`).
  - En el golpe, la `oleada`: todos los tubos y el `bloom` suben de tensión en 0,04 s y se calman en 0,75 s.
  - A la vez, el fogonazo (`flash`, 0,4 s): `destello`, un aro cian en el suelo, una `Raya` ancha y un velo `#FFD6F7`.
  - Saltan 44 `CHISPAS` que rebotan bajito y corren por el suelo mojado, hay 3 `RAYOS` de cortocircuito durante 0,14 s y `temblor(t, T_SUELO, 0.34, 10, 5)`.
  - Los letreros se van un momento (sus ráfagas de `zumbido` caen justo ahí). Los trozos son oscuros con filo de neón y se apagan un 35 % al quedarse quietos.

## Dónde está en el código
- **Piel (se reutiliza tal cual)**, en `src/estilos/gato/Neon.tsx`:
  - Los colores (`ROSA`, `CIAN`, `VIOLETA`, `NOCHE`, `SILUETA`, los `NUCLEO_*`, `OJO`, `AMBAR`…).
  - `enciende` y `zumbido` (cómo vive un neón). `Tubo` (la línea de luz), `recta` y `f1`.
  - `FiltrosBorde` (la luz de borde), `Raya` (el reflejo partido en el suelo) y `OjoNeon` (unos ojos que brillan).
  - `CHISPAS`, `G_CHISPA`, `enChispa` y `RAYOS`, que se recalculan desde tu punto de golpe.
  - En el `<defs>` de `Neon`: `bloom`, `reflejo`, `reflejo-obj`, `reflejo-mesa`, `mascara-suelo`, `mascara-obj` y todos los degradados (`pared`, `techo`, `suelo`, `poza-*`, `bruma-*`, `destello`, `vineta`…). Además, los grupos `sala`, `mueble`, `objetos` y `gato`: se pintan una vez y se reutilizan con `<use>` en los reflejos.
  - En el cuerpo de `Neon`: `vigas`, `juntas`, `gotasDentro`, `deriva`, `oleada`, `flash`, `chispas` y `rayos`, y el orden de capas del `return`.
- **Ayudas:**
  - De `src/comun/curvas.ts`: `E`, `clamp`, `mix`, `p`, `rng`, `ruido` y `temblor`.
  - Para trazar: `poli`, `curva`, `elipse`, `cinta` y `oreja` (en `src/estilos/gato/escena.ts`) y `capsula` (en `src/estilos/formas.ts`).
- **Lo del gato y la taza (lo que se rehace con tu escena):**
  - `GatoNeon` (silueta, collar y cara), `TazaNeon`, `TazaFantasma` y `enTaza`.
  - La ventana y su ciudad: `VX`… `CRUZ_Y`, `CIUDAD`, `LUCES`, `LLUVIA_FUERA` y `COCHES`.
  - El letrero (`SX`, «CAFÉ», «24/7», «MIAU», «HOTEL»), la balda, `TUBO_X` y el mueble (`TOPE`, `LABIO`, `CAJON`, `PUERTAS`, `TIRADORES`, cafetera y comedero).
  - En `objetos`: `estela`, `luzTaza`, `vaporLuz`, el chorro, el charco y la corona.
  - Todo `src/estilos/gato/escena.ts`.

## Pintar tu escena en este estilo
1. Copia `src/estilos/gato/Neon.tsx`. Conserva lo de «Piel», el `<defs>` y el orden de capas: techo, sala y su reflejo, suelo, rayas, tubo del techo, bruma, mueble y su reflejo, objetos, personaje, fogonazo y lluvia, todo dentro de `bloom`.
2. Cambia lo de dentro de `sala` (conserva pared, azulejo, lavado y pozas), `mueble`, `objetos` y el grupo `gato` por lo tuyo. Déjalos como `<g id>` en el `<defs>` para que los reflejos se sigan haciendo solos.
3. Dibuja cada línea de luz con `<Tubo d color w k sube={oleada} />`. Cada cosa sólida, oscura, con su contorno en `Tubo` o bajo `url('borde')`. Detrás de cada neón, su `poza`, y en el suelo, su `Raya` en la misma x.
4. Dale a cada neón su `k = enciende(t, t0, dur, semilla) * zumbido(t, semilla, ráfagas)`, con los encendidos escalonados al empezar y las ráfagas en tus momentos.
5. Tu momento: `oleada` y `flash` en tu segundo, chispas desde tu punto de golpe, `temblor` y estela para lo que se mueve rápido. Mantén rosa y cian; cada color de más, para una sola cosa.

**Errores fáciles:**
- Las regiones de los filtros son fijas: `FiltrosBorde` va de x −60, y 120, con 1160 × 1000, y `reflejo-mesa` y `reflejo-obj` también tienen la suya. Lo que dibujes fuera de esa caja sale cortado o sin luz: agrándala.
- Pintar zonas grandes claras: el `bloom` las hace brillar enteras. Lo claro, solo en las almas de los tubos.
- Ids sin `id()`/`url()`, o mover `F`/`SUELO`/`MESA_Y` a mano: los reflejos y las máscaras salen de esas constantes. Y la lluvia necesita su `n` entero para dar la vuelta sin salto en `DUR`.
