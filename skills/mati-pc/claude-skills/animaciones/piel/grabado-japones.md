# 17 · Grabado japonés
**En una frase:** una estampa japonesa de madera impresa plancha a plancha: tintas planas un pelo fuera de registro sobre papel washi con su fibra, el contorno negro tallado a gubia, degradados frotados a mano y cada postura impresa de nuevo, 12 veces por segundo.

## La piel (igual en cualquier escena)
- **La técnica (lo que lo hace todo): se imprime, no se pinta.**
  - Todo va en un `<canvas>` 2D, no en SVG. Lo que se mueve va en una `Plancha` con tres lienzos: `color` (las tintas planas), `linea` (la plancha de líneas, en sumi) y `mascara` (dónde hay algo).
  - Cada `pl.tinta()` cae en su plancha con su desplazamiento de registro y **borra de la plancha de líneas lo que tapa** (`tapa`): se pinta de atrás adelante y cada contorno después de su tinta, así la línea solo lleva lo que se ve, como una plancha tallada.
  - Al final, `estampa()` pone la plancha sobre el papel con la veta del cerezo, el frotado del baren y las motas (el papel asoma en puntitos), y encima de todo va la fibra del washi.
- **Colores** (`TINTA`, pocos y planos):
  - Papel `#efe3c8` (lo blanco no lleva tinta: es el papel) y paspartú `monte` `#b8a37c`. Sumi `#231f1c` (toda la línea) y `sumiL` `#4a4540`; grises `#8b8a80` y `#b3b0a2`.
  - Azul de Prusia: `prusia` `#1d3a66`, `prusiaO` `#13284a`, `prusiaL` `#4d6f98`, `prusiaP` `#8db0c6`, `prusiaPP` `#c3d5d8`.
  - Bermellón: `beni` `#b8412f`, `beniO` `#8a2a1d`, `beniL` `#e3a08a`, `beniP` `#efc4a8`, `bermellon` `#cc4a2e`. Ocres `#cf9f4a` y `#e2c27e`, paja `#c9a45c`, amarillo `#e9b43a` / `#c48f25`.
  - Verdes: `verde` `#8aa152`, `verdeO` `#50703c`, `pino` `#3e5a3a`, `verdeL` `#b5c07a`, `celadon` `#93ae98`. Carne `#f2c49b` / `#d99b6c` y pelo `#4b2f1c`.
  - Madera `#8a6a48` `#5e4631` `#b08d63` `#c9a77c`; yeso `#e8d8b5` `#d9c59c` `#efe3c6`; tatami `#cdbb7a` `#c6b170` `#d3c185` con su trama `#a69552`.
  - Sueltos: la cartela `#f3e6c3`, el rubor `rgba(224,120,110,0.55)`, los pelos finos `#120c08` y el halo de una luz `rgba(247,214,120,0.42)` que se apaga.
- **El registro:** cada familia de tintas es una plancha (`Bloque`) con su desplazamiento fijo en px (`REGISTRO`): azul 2,8/−2 · verde −2,4/2,3 · rojo 2,2/2,8 · carne −1,8/−2,3 · ocre −2,6/1,5 · gris 1,4/−1,2. La línea no se mueve: el color asoma por fuera del contorno.
- **Letras:** Yuji Syuku (`@remotion/google-fonts/YujiSyuku`, peso 400, `FUENTE`), en la cartela, los sellos y los caracteres del decorado.
- **El trazo y el material:**
  - La línea es tallada: `talla(pts, ancho, {afina, temblor, semilla})` da un trazo de ancho variable, afinado en las puntas (hasta el 22 % del ancho) y con un temblor lento del grosor (0,22). `tiembla(pts, amp, semilla)` le da el pulso de la mano a cualquier forma y `recta(a, b, n)` le pone puntos para que tiemble: nada es recto.
  - Grosores: 3–4,6 px en los objetos, 5,4 en el personaje (6 en el torso), 1,2–2,6 en los detalles. Lo negro de verdad (pelo, laca, ribetes, pliegues) es una forma rellena con `pl.negro()`.
  - Lo blanco, en papel: `pl.papel()` (la bola, la nieve, la niebla, los ojos) y `pl.papelTrazo()` (la espuma, las crestas de las olas). Los degradados, siempre `bokashi()` (frotado a mano: el borde de arriba vaga columna a columna, `rugoso` 6–26 px), con `pl.degradado()`. Los motivos (lunares, rombos, olas) se recortan con `pl.recorte = camino`.
  - Al estampar lo que se mueve: veta 0,13, baren 0,26, motas 0,26 y 0,1 en la línea (el decorado: 0,15 · 0,32 · 0,3 · 0,12).
- **El fondo y el escenario:** la estampa entera dentro de `MARCO` (22, 22 → 1058, 1898) con un filete doble en sumi (5 px y, 9 px por fuera, 1,6). Un interior de madera, yeso y tatami: la pared con un bokashi oscuro bajo la viga; arriba, un panel de olas en escamas (seigaiha) en papel sobre `prusiaL`; una ventana con un monte nevado en bokashi de `prusia` a `prusiaPP` y melocotón, bandas de niebla en papel con un velo azul al 0,35 y el mar a bandas; un rollo colgado con un círculo de un trazo; el tatami con ribetes negros, más oscuro hacia delante; y en el primer plano, cortados por el marco, un abanico y la esquina de un cojín. Se imprime una vez y se guarda (`decorado(dpr, fuente)`).
- **Los rótulos y adornos fijos** (encima de la estampa, nítidos):
  - Arriba a la derecha (x 898–1014, y 60–545), la cartela vertical: papel `#f3e6c3`, la pestaña en `beniL` con «INTENTO» letra a letra (31 px cada 34) y el número debajo (92 px; con dos cifras, una encima de otra a 64).
  - Debajo, el sello cuadrado de 62 px en `beni` con 紙球 en blanco: «bola de papel» (紙, papel; 球, bola), girado −0,04 y en `multiply` al 0,94.
  - En el decorado: el farol lleva 球 («bola») a 78 px, y el rollo, en columna, 七転八起 («cae siete veces, se levanta ocho») con su sellito rojo.
- **El movimiento:** a pasos, una impresión por postura. El personaje, la papelera y el farol, a 12 posturas por segundo (`PASOS`); la bola, a 24 (`PASOS_BOLA`). La fase se ajusta para que una postura caiga justo en el primer toque. En cada paso el registro se corre ±0,45 px (`pl.extra`) y cada pieza del personaje ±1,1 px (`jit`). La lámina no se mueve: solo da un respingo en los golpes fuertes (`temblor` × 0,6) y asoma el paspartú. Lo que vuela rápido deja tres rayas de viento en sumi (`estela`).
- **El momento:** se cuenta con el agua de un grabado antiguo.
  - En cada golpe (fuerza > 330), en el mismo paso, revientan las garras de espuma (`salpica`): 4 (6 si es fuerte) en `prusia` con una capa `prusiaP` corrida detrás, la línea de espuma en papel y tres dedos que se rizan cada vez más; gotas en racimo con su cola, que vuelan y caen. En el suelo, además, dos anillos de agua que se abren. Duran 0,5 s.
  - Si entra: un sello ovalado `¡DENTRO!` (175 px de alto, 2,2 de ancho) se estampa en (516, 868), girado −0,12, de 1,4 a su tamaño en 0,16 s (`E.outCubic`).

## Dónde está en el código
- **Piel (se reutiliza tal cual):**
  - `src/estilos/bola/ukiyoe/imprenta.ts` entero: `W`, `H`, `TINTA`, `Bloque`, `REGISTRO`, `lienzo`, `rgba`, `mezcla`, `texturas`, `poli`, `suave`, `elipse`, `rect`, `mueve`, `denso`, `talla`, `tiembla`, `recta`, `bokashi`, `Plancha` (`tinta`, `degradado`, `tinte`, `trazoTinta`, `papel`, `papelTrazo`, `raya`, `negro`, `letraNegra`, `texto`, `limpia`, `extra`, `recorte`), `estampa` y `sello`.
  - `src/estilos/bola/ukiyoe/geometria.ts`: `pr`, `giraY`, `caja` y `pintaCaja` (una caja en perspectiva: arriba la tinta clara, de frente la del color, de lado la oscura), `circulo`, `contorno` y `bolaPapel`.
  - `src/estilos/bola/ukiyoe/figuras.ts`: `estela`, `salpica` y `golpesVisibles`; y, sin exportar (cópialas), `capsula`, `envolvente`, `cilindro` y la cara de estampa (`enCabeza`, `cara`, `cabeza`, con nueve gestos y el rubor).
  - `src/estilos/bola/ukiyoe/GrabadoJapones.tsx`: la letra (`loadFont`, `FUENTE` y la espera con `delayRender`), `PASOS`, `PASOS_BOLA`, el paso (`fase`, `paso`, `tq`, `tb`), `cartela`, el sello del final y el orden de `pintar`.
  - `src/estilos/bola/ukiyoe/fondo.ts`: `MARCO`, `rectT` (un rectángulo a pulso), el `decorado` guardado y motivos para reciclar: las olas en escamas de `arriba`, la niebla (`kasumi`), el monte y el mar de `paisaje` y la trama de `suelo`.
  - Ayudas: `E`, `clamp`, `mix`, `rng` y `ruido` de `src/comun/curvas.ts`.
- **Lo de la bola y el muñeco (se rehace):** en `fondo.ts`, las medidas y piezas de este cuarto (`PISO`, `ESQ`, `VIGA`, `VENT`, `TOKO`, `POSTE`, `tokonoma`, `primerPlano`, `mesa`, `pintaDecorado`); en `figuras.ts`, `farol`, `silla`, `muneco`, `papeleraDetras`, `papeleraDelante`, `capaBola` y `bolaEscena`; el «INTENTO» de `cartela` y el `if (i === 9)`; y lo de `src/estilos/bola/escena.ts` (`lanzamiento`, `bola`, `temblor`, `T_PRIMERO`, `DUR`, `PAPELERA`, `LAMPARA`, `MUNECO`, `SILLA`, `MESA`, `SUELO`, `Z_PARED`, `MURO_X` y la cámara: `CAMARA`, `proyecta`, `escalaEn`).

## Pintar tu escena en este estilo
1. Copia la carpeta `src/estilos/bola/ukiyoe/` a `src/estilos/<tu-escena>/ukiyoe/` y pon tu `escena.ts` en `src/estilos/<tu-escena>/` (así los imports `../escena` y de `curvas` siguen valiendo). Tu `escena.ts` exporta la cámara (`CAMARA`, `proyecta`, `escalaEn`: cópialas de la bola; si tu escena es plana, `proyecta` puede devolver `[x, y]` tal cual) y el segundo de tu momento, que hace el papel de `T_PRIMERO[i]`.
2. El decorado, en `pintaDecorado` de `fondo.ts`: tu sitio con las mismas reglas (paredes y suelos en tinta plana con un `bokashi` que oscurece bajo el techo o hacia delante, motivos recortados con `pl.recorte`, lo blanco en papel, cada cosa con `pl.raya` a pulso). Se imprime una vez.
3. Lo que se mueve, en `pintar`, sobre la plancha: `pl.tinta(camino, TINTA.x, 'bloque')` y después `pl.raya(camino, 3–5)`; los detalles con `pl.negro(talla(...))`; muebles y cajas con `pintaCaja`; una persona con `cabeza(pl, c, R, frente, gesto, ojos)`. El bloque va por familia (lo azul en `'azul'`, la piel en `'carne'`…) para que se desregistre igual que lo demás.
4. Tus letras: cambia `palabra` y el número en `cartela` (o quítala), los caracteres de `sello(['紙', '球'], 62, FUENTE, …)` (cada elemento es una línea) y los del decorado. Si son japoneses: busca su código (`'猫'.codePointAt(0).toString(16)`) en `getInfo().unicodeRanges` de `@remotion/google-fonts/YujiSyuku`, añade ese trozo (`'[n]'`) a `subsets` y los caracteres a `document.fonts.load(...)`. Las letras latinas ya están (`'latin'`).
5. Tu momento: en el paso del golpe, `salpica(pl, golpe, tq - golpe.t, semilla, 1)` con `golpe = {t, tipo, fuerza, n, p}` (cuándo, `'suelo'` si quieres los anillos, fuerza de 330 a 2400, la normal de lo que se toca y el punto en 3D); y, si hay un final, tu palabra en un sello grande: `sello(['¡VENDIDO!'], 175, FUENTE, {semilla: 9, redondo: true, tam: 0.62, ancho: 2.2})`, de 1,4 a 1 en 0,16 s.
6. El orden de `pintar`: paspartú → `decorado` (con el respingo) → `pl.limpia()` → lo de atrás → lo de delante → `estampa(..., {papelDebajo: true})` recortado a `MARCO` → `fibra` → filete, cartela y sellos.

**Errores fáciles:**
- El contorno antes que su tinta, o una pieza de atrás después de una de delante: cada `tinta` borra las líneas que tapa, así que se pierden líneas o se cuelan las de detrás. Y si olvidas `pl.recorte = null`, todo lo que viene después sale recortado.
- Lo blanco con una tinta blanca: queda plano y sin fibra; es `pl.papel()`. Y con `papelDebajo: false` en lo que se mueve, por las motas asoma el decorado.
- Usar `t` en vez de `tq` / `tb`, o un `rng` sin `paso` en su semilla: sale fluido y se pierde la impresión postura a postura. Y no redibujes el decorado ni las texturas en cada cuadro: van guardados (la veta se calcula píxel a píxel).
- Pintar antes de que cargue la letra: `cartela` y `sello` se guardan en caché y se quedan con la letra de repuesto. Por eso `pintar` espera a `listo`.
