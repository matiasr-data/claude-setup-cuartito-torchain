# 9 · Acuarela
**En una frase:** una lámina de acuarela sobre papel cálido. Cada cosa es una aguada de borde roto que «hierve», con el pigmento oscuro acumulado en el borde y un lápiz suelto que nunca coincide del todo con el color.

## La piel (igual en cualquier escena)
- **Colores:**
  - `PAPEL` `#F8F3E8` (la hoja), `BAJO_HOJA` `#D3C4A8` (la mesa de dibujo que asoma por el borde rasgado), `GRAFITO` `#433B35` (todo el lápiz).
  - Fibras del papel `#C9B99E`; sombra del borde de la hoja `#7A6A52`.
  - Las dos aguadas grandes, en degradado vertical: pared `#EED7AD` → `#F1E0C1` → `#F3E8D3`; suelo `#CDD6D5` → `#E0E4DE`.
  - Sombras frías, nunca negras: `#7F8C93`, `#6F7C83`, `#5F6C73`, `#56636A` (difuminadas); bajo lo que apoya en madera, `#7E5A38`.
  - El borde de cada mancha no es otro color: es el suyo pasado por `pigmento()` (más oscuro y más saturado, con una curva gamma).
  - Lo protagonista, en un color fuerte sobre un suelo frío para que resalte (aquí, la taza `#C9433A` y el café `#6A3F24`).
- **Letras:** solo Caveat (`MANO`, de `@remotion/google-fonts/Caveat`, pesos 500 y 700). La palabra del golpe en 700 a 98 px; una nota abajo a la izquierda (36 px, `GRAFITO` al 55 %, girada −2°) y una firma abajo a la derecha (40 px, al 62 %, girada −3°).
- **El trazo:**
  - Cada cosa se pinta con `mancha()`: relleno al 95 % y un trazo de 5 px de su `pigmento()` al 50 %. Por capas: la aguada base y encima manchas más oscuras (sombras al 40–55 %), claras y las marcas (rayas al 80–85 %), recortadas a la forma con `clipPath`.
  - El lápiz va aparte y encima, en `GRAFITO`: líneas que se pasan de las esquinas y se curvan un pelo (`rayaLapiz`, con `sobra`) y aros que dan más de una vuelta (`aroLapiz`). 2,1 px al 70 % en los objetos (al 35 % en el suelo); 1,4–4 px en las caras.
  - Color y lápiz, siempre corridos: la aguada se mueve (−4, 3) en `Cosa`; el lápiz de los personajes, (2, −1,5); en `filtroMaterial` el contorno sale de `feMorphology` (radio `anillo`) desplazado `corrido`.
  - Los filtros SVG hacen la acuarela: borde roto con dos `feDisplacementMap` (uno fijo y otro que hierve), manchas claras y oscuras de ruido, el borde de pigmento (la forma menos su desenfoque) y un desenfoque final de 0,9–1,3 px. Tres familias: `fondo` (las aguadas grandes, desplazamiento 34 + 6), `cosa` (lo quieto, 10 + 5) y `filtroMaterial` (lo que se mueve, con su lápiz dentro).
  - Lo del otro lado, más apagado: la pata lejana va en `LEJOS` y `CREMA_LEJOS`, con las rayas al 70 %.
  - Humo o vapor: un trazo `#A7B0C3` de 22 px al 50 % y otro `#FFFDF6` de 8 px al 60 %, bajo el filtro `vapor`.
- **El fondo y el escenario:** la hoja `PAPEL` con pliegues de ruido (`pliegues`, al 40 %) y 260 fibras; pared y suelo, dos grandes aguadas bajo `fondo`; los objetos de la pared en un lienzo y los del suelo en otro; suelo en perspectiva con `FUGA`, `FILAS` y `xEnFila`. Todo recortado a la hoja (`clipPath` `hoja`: 20, 20, 1040 × 1880). Encima de todo, el grano (`Grano`, en `multiply` al 34 %) y el borde rasgado (`Borde`, `ANCHO_PAPEL` = 14 px, con su sombra corrida 3, 4).
- **Los rótulos y adornos fijos:** la nota y la firma en Caveat, el borde rasgado y el grano. Escribe ahí tu propio texto.
- **El movimiento:** 60 cuadros por segundo y movimiento continuo. Lo que hierve es el borde: las semillas de los filtros cambian con `paso`, 10 veces por segundo (cada 6 cuadros), en un ciclo de 60. El lápiz no hierve (semillas fijas). La hoja entera tiembla en el golpe con `temblor(t, T_SUELO, 0.3, 7, 5)`, aplicado a la mitad. Sin parpadeos.
- **El momento:** el líquido es aguada. El chorro, una cinta con degradado de `#946239` al 20 % a `CAFE` al 92 % que se ensancha al alejarse (filtro `chorro`). Al golpe: una corona de 13 puntas (`Corona`: sube en 0,1 s y cae en 0,35 s); la mancha florece (`radioMancha`: se abre en 0,45 s y sigue corriéndose 2,4 s), primero mojada (borde blando y difuso) y seca en 1,5 s (borde nítido y oscuro: `seco` en `filtroCafe`), con regueros, «flores» claras de borde oscuro, gotas gordas en parábola y 52 salpicaduras alargadas que entran con `E.outBack`. Los trozos, cada uno su aguada con el filtro `taza`. A lápiz: 7 rayas del golpe que crecen en 0,09 s y se apagan, y un «¡cras!» en Caveat 700 color café que entra con `E.outBack`.

## Dónde está en el código
Todo en `src/estilos/gato/Acuarela.tsx`; las ayudas en `src/comun/curvas.ts` (`E`, `clamp`, `mix`, `rng`, `temblor`) y `capsula` en `src/estilos/formas.ts`.
- **Piel (se reutiliza tal cual):**
  - Colores y letra: `PAPEL`, `BAJO_HOJA`, `GRAFITO`, `MANO`.
  - Geometría: `f1`, `ruta`, `rectD`, `circD`, `elipD`, `lerp`, `esc`, `unit`, `suave`, `grados`, `enE`.
  - `pigmento` (el borde de pigmento de un color) y `useIds` (ids únicos por copia del estilo).
  - El lápiz: `rayaLapiz`, `lineaLapiz`, `aroLapiz`.
  - `lienzo(semilla)` → `Pintada`: pinta una cosa con `mancha`, `raya`, `linea`, `caja`, `aro` y `fin`.
  - La hoja: `Papel`, `Grano`, `Borde`.
  - Los filtros: `filtroMaterial`, `filtroCafe` y `Filtros` (`fondo`, `cosa`, `gato`, `cara`, `taza`, `cafe`, `chorro`, `vapor`, `b3`, `b8`, `b14`).
  - `Anclado` (el ruido del filtro viaja y gira con la cosa) y `Cosa` (la aguada corrida con su lápiz).
  - El armazón de `Acuarela`: `paso`, el temblor, el orden de capas y los degradados `pared`, `suelo` y `sombra-mesa`. El suelo en perspectiva (`FUGA`, `FILAS`, `xEnFila`, `PARED_FIN`), ajustando sus números.
- **Lo del gato y la taza (se rehace):** `cocina` (con `VEN`, `RELOJ`, `R_RELOJ`), los colores del gato y la taza (`NARANJA` … `IRIS`, `ROJO`, `CAFE`, `CAFE_CLARO`, `TONOS_TROZO`, `DESPLIEGA`), `rayaCruzada`, `rayasCuerpo`, `rayasPata`, `Pata1`, `dedos`, `GatoAcuarela`, `enTaza`, `SILUETA_TAZA`, `TazaAcuarela`; el café en el suelo (`SC`, `PERSP`, `ANCHO`, `FASES`, `radioMancha`, `contorno`, `enSuelo`, `formaMancha`, `REGUEROS`, `FLORES`, `G_GOTA`, `GOTAS_GORDAS`, `gotaGorda`, `SALPICAS`, `ManchaCafe`, `PUNTAS`, `Corona`, que sirven de modelo para cualquier líquido) y, dentro de `Acuarela`, el chorro, el golpe, el «¡cras!», la sombra de la taza y las agujas del reloj. Lo que pasa sale de `src/estilos/gato/escena.ts`.

## Pintar tu escena en este estilo
1. Copia `src/estilos/gato/Acuarela.tsx` a `src/estilos/<tu-escena>/Acuarela.tsx` y deja entera la piel de arriba.
2. Cambia `cocina()` por tu decorado: un `lienzo(semilla)` por capa (pared, suelo, delante). En cada cosa, primero las aguadas con `mancha(d, '#hex', op, borde)` (la base y después claros y oscuros) y luego el lápiz con `linea`, `caja` o `aro`. Guárdalo en el mismo `Map` con la clave `id('…')`, para pintarlo una vez, y píntalo con `<Cosa pt={…} filtro={id('cosa')} />`.
3. Lo que se mueve (tu personaje, tu producto): cada parte dentro de `<Anclado c={su centro} ang={su giro} filtro={id('…')}>`, con su color base y, recortadas con `clipPath`, sus sombras y marcas. Los detalles finos (ojos, boca, letras pequeñas) a lápiz, fuera del `Anclado` y corridos (2, −1,5). Para un material nuevo, añade a `Filtros` un `filtroMaterial(id('mio'), semilla + paso, escala, anillo, corrido)`.
4. Respeta el orden: `BAJO_HOJA` → `Papel` → dentro de la hoja: aguadas `fondo` → `Cosa` de la pared → `Cosa` del suelo → sombras (`b14`) → lo que se derrama → muebles de delante → sombras de contacto (`b3`) → personajes → lo que vuela → lápiz del golpe → nota y firma; fuera del `svg`, `Grano` y `Borde`.
5. Tu momento: lo que se derrama o explota como aguada que florece (`filtroCafe` con su `seco` de 0 a 1 en 1,5 s), salpicaduras con `E.outBack`, rayas a lápiz, una palabra en Caveat 700 y `temblor` en el instante del golpe.
6. Escribe tu nota y tu firma, y registra tu componente `({t}) => …` como una composición más en `src/Root.tsx` (1080 × 1920, 60 fps).

**Errores fáciles:**
- Escribir un id a mano (`url(#cosa)`) o repetir el de un `clipPath` dentro de un bucle: usa siempre `id('…')` y súmale el índice (`id('ojo' + i)`). Si se pintan dos copias del estilo a la vez, los ids repetidos se cruzan.
- Mover algo sin `Anclado`: el ruido del filtro se queda quieto en la pantalla y la textura resbala por encima de la forma.
- Darle a `mancha` un color que no sea `#RRGGBB`: `pigmento` solo lee ese formato (con un `url(#…)` el borde sale azul, `#6F93BC`).
- Meter el cuadro en las semillas en vez de `paso`: el borde herviría 60 veces por segundo.
