# 1 · Holograma
**En una frase:** todo es alambre de luz cian sobre un escenario casi negro, como un modelo de CAD proyectado, con rótulos de visor en placas oscuras y el blanco reservado para lo que está activo.

## La piel (igual en cualquier escena)
- **Colores:**
  - `ESCENARIO` `#01070B`: el fondo. `TONO` `#3FE0FF`: el cian de toda la luz; `rgba(a)` es ese cian con opacidad.
  - `LINEA` `#8FF1FF`: el contorno de cada pieza. `CALOR` `#E6FCFF` (y `blanco(a)`): lo activo o «caliente».
  - `ACENTO` `#FF9A3C`: el naranja, **una sola vez** (la cifra del contador que se fija). `PUPILA` `#03161E`: lo oscuro dentro de lo blanco.
  - Placas: `rgba(1, 10, 16, 0.8)`. La luz del centro va de `#0A3A4C` a `#041722`; la viñeta, negro al 0,85. El punto de REC, `#FF4D4D`.
- **Letras:** `RAJDHANI` (Rajdhani 500/600) para el título de cada placa (29–38 px, peso 600, espaciado 3–4, `CALOR`). `MONO` (Share Tech Mono) para los datos (18–24 px, espaciado 1,5–2, `rgba(0.45–0.75)`) y para el contador (62 px). Todo en MAYÚSCULAS.
- **El trazo / la luz / el material:**
  - Una cosa sólida se pinta en blanco (`fill="#fff"`) dentro de `<g filter={u('sil')}>`. `FiltroSilueta` saca de su forma tres capas: un relleno casi transparente (`aRelleno`), el borde por dentro más brillante (fresnel: erosión de 11 y desenfoque de 6) y el contorno de fuera (`grueso` px).
  - Hay tres variantes: `sil` (normal: 1 / 0,42 / 0,07, grueso 2,3), `silL` (lo de atrás: 0,55 / 0,24 / 0,04, grueso 2) y `silC` (lo activo: contorno `#FFFFFF`, 1 / 0,9 / 0,16, grueso 2,8). `silC` se pone encima con la opacidad de lo activo que está.
  - El volumen, con mallas de 1,2 px a `rgba(0.36–0.4)` recortadas a la pieza: `mallaElipse` (anillos y meridianos), `mallaCabeza` (los meridianos se deslizan con el giro) y `tubo` (un eje y anillos de lado a lado).
  - El decorado, solo líneas: 1–2 px a `rgba(0.14–0.75)`, rellenos de 0,02–0,07 y lo que queda oculto en raya (`8 8`), todo bajo el filtro `suave`.
  - Lo que se mueve va bajo `brillo`, dos desenfoques (9 y 2,5) sumados al original. Al gato, encima, `parpadeo` (0,94 + 0,06 · `ruido(t * 14, 2)`): la luz no es del todo estable.
- **El fondo y el escenario:**
  - Debajo de todo, `ESCENARIO`, la luz radial `luz` y la rejilla `puntos` (un punto cada 48 px, que deriva despacio).
  - El suelo, líneas que se van al fondo, con 21 verticales cada 150 px y 8 horizontales.
  - La plataforma del proyector (`PC`, `PR`, `PK`, `enPad`): 48 marcas que giran a 16°/s, 12 rayos y un aro de raya que corre. Encima sube el haz (`haz`, hasta `HAZ_ARRIBA`) con 34 motas de `polvo`.
  - Por delante de la escena: la banda `barrido`, que la cruza cada 2,4 s, las rayas de línea `rayas` (6 px) y la `vineta`.
  - Al empezar, el plano de escaneo (`scan`) sube de y 1700 a 150 en 0,6 s y va descubriendo la escena.
- **Los rótulos y adornos fijos:**
  - Van delante y quietos, fuera del grupo que tiembla: escuadras en las cuatro esquinas (46 px) y reglas a los lados (x 54 y 1026) que se deslizan.
  - Cada dato va en una `Placa`: caja oscura, borde de 1,2 px y escuadras (`esquinas`, 14 px). Entra en 0,2 s (`aparece`) desde 1,06 de tamaño y se enciende en blanco tres cuadros (`destello`).
  - De la placa a lo que señala va una guía que se traza (`parcial`), con un aro de 7 px en la punta.
  - El cerco que se fija en algo: escuadras que giran de 45° a 0° y pasan de 1,7 a 1 de tamaño.
  - Cabecera, REC que parpadea una vez por segundo, telemetría (`T+…  ·  60 FPS  ·  CAPA 2/3`) y un medidor de 10 celdas.
- **El movimiento:**
  - Fluido: todo sale de `t` en segundos, sin pasos. Lo que cuenta en cuadros va a 60 por segundo (`F3 = 3/60`, `Math.floor(t * 60)`).
  - Lo «caliente» parpadea cambiando 10–20 veces por segundo (`Math.floor(t * 10) % 2`, `t * 12`, `t * 20`).
  - Al golpe, `temblor(t, T_SUELO, 0.32, 9, 4)`.
- **El momento:**
  - Antes de que pase, el visor lo **predice**: la trayectoria en raya (`PREVISTA`, trazada con `parcial`), la diana que late en el suelo y una cuenta atrás en la placa (`IMPACTO EN x s`).
  - Durante la caída queda el rastro escaneado (`rastro` con marcas cada 0,05 s), cuatro `fantasmas` y un cerco que la sigue.
  - En el golpe, el fallo de imagen dura tres cuadros: todo se corre y tres bandas se repiten desplazadas con `<use href=#…-escena>`. Además, un velo cian al 0,13, el destello `golpe`, dos ondas en la plataforma, la plataforma encendida y los trozos al rojo blanco que se enfrían al cian.
  - Y el único naranja: el `Contador` gira las cifras y las fija de derecha a izquierda.

## Dónde está en el código
- **Piel (se reutiliza tal cual)**, en `src/estilos/gato/Holograma.tsx`:
  - `TONO`, `CALOR`, `ACENTO`, `ESCENARIO`, `PUPILA`, `LINEA`, `rgba`, `blanco`, `F3`, `pulso` (sube y baja), `ventana` (encendido entre dos tiempos), `coma` y `f`.
  - `mallaElipse`, `mallaCabeza` y `tubo` (el volumen de alambre). `parcial` (una línea trazada hasta una fracción) y `esquinas` (las escuadras).
  - `FiltroSilueta` (contorno, fresnel y relleno de una forma) y `Placa` (el rótulo con escuadras y su entrada).
  - `Contador` (cifras que giran y se fijan) y la plataforma: `PC`, `PR`, `PK`, `enPad`, `HAZ_ARRIBA` y `anchoHaz`.
  - En el `<defs>` de `Holograma`: `luz`, `vineta`, `haz`, `barrido`, `escaneo`, `golpe`, `puntos`, `rayas`, `brillo`, `suave`, `brilloT`, `sil`, `silL`, `silC`, `scan` y `banda0–2`.
  - El orden de capas del `return`: fondo, grupo `…-escena` (tiembla y se repite en el fallo), viñeta, rótulos y fallo.
- **Ayudas:**
  - De `src/comun/curvas.ts`: `E`, `clamp`, `mix`, `p`, `kf`, `rng`, `ruido` y `temblor`.
  - Para trazar: `poli`, `curva`, `elipse`, `cinta` y `oreja` (en `src/estilos/gato/escena.ts`) y `capsula` (en `src/estilos/formas.ts`).
- **Lo del gato y la taza (lo que se rehace con tu escena):**
  - `GatoHolo`, `tazaHolo`, `TAZA_BOCA`, `TAZA_BASE`, `TAZA_CAFE`, `TAZA_RAYAS`, `PREVISTA`, `LEJOS` (ventana, balda y radiador), `MESA` y `TAZAS_BALDA`.
  - El guion del visor: `estado`, `intencion`, `MIRADAS`, `TOQUES`, `PASO_CONTADOR` y `T_FIJA`.
  - Dentro de `Holograma`: los textos de las placas, `rastro`, `fantasmas`, `cerco`, `cercoTaza` y `orejaAncla`.
  - Todo `src/estilos/gato/escena.ts` (`gato`, `taza`, `cafe`, `trozos`, `vapor`, `T_CAE`, `T_SUELO`, `IMPACTO`…).

## Pintar tu escena en este estilo
1. Copia `src/estilos/gato/Holograma.tsx` a un archivo nuevo. Conserva todo lo de «Piel» y el orden de capas del `return`, y borra lo del gato y la taza.
2. Escribe tu escena como en `escena.ts`: piezas que salen de `t` y una constante con el segundo del momento, que hace el papel de `T_SUELO`.
3. Cada cosa sólida, en blanco dentro de `<g filter={u('sil')}>`, con sus mallas encima (`mallaElipse` y `tubo`, recortadas con un `clipPath` de su forma). Lo que está detrás va con `silL`. Lo que actúa, con `silC` encima y la opacidad de `pulso` o `ventana`. El decorado, en líneas bajo `suave`.
4. Cada dato va en una `Placa`, con su título en `RAJDHANI`, su línea en `MONO` y su guía con `parcial` hasta un aro. La placa va fuera del grupo `…-escena`.
5. Tu momento: antes, la predicción (raya y diana); durante, el rastro; en el golpe, el fallo de tres cuadros, `temblor`, una onda y **un** dato en `ACENTO`.

**Errores fáciles:**
- Pintar cada parte de una cosa con su propio filtro: salen costuras entre ellas. Todas las formas de una pieza van en **el mismo** `<g filter>`, así sale un solo contorno.
- Ids fijos: todo `id` lleva el prefijo de `useId` (`id`/`u()`). El fallo usa `<use href={`#${id}-escena`}>`: si cambias el id del grupo, cámbialo también ahí.
- Meter los rótulos dentro de `…-escena`: temblarían y saldrían repetidos en el fallo. Gastar el naranja en más de una cosa le quita la fuerza al momento.
