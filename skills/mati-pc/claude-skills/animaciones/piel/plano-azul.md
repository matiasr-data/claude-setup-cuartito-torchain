# 5 · Plano azul
**En una frase:** un plano técnico de cianotipia: líneas claras sobre papel azul que se dibujan solas y documentan la escena muy en serio, con cotas, globos y medidas que cambian en vivo.

## La piel (igual en cualquier escena)
- **Colores:**
  - `LINEA` `#E7F0F9`: todo lo que se dibuja: trazos, letras, flechas, rellenos pequeños (la nariz, la pupila) y las rayas de las tramas.
  - `PAPEL` `#1F4590`: el relleno de cada objeto, que tapa lo de detrás, y el fondo de globos, bisagras y cajas.
  - `#18336B`: la hoja, debajo de las texturas. `#CFE0F5`: el brillo del borde (`pa-borde`, de 0 a 0,14).
  - `SELLO` `#E0483E`: el único color que no es azul. Sale una vez, en el sello del final.
- **Letras:** `MANO` (Architects Daughter, letra de delineante) para todo lo escrito a mano: títulos, notas, cotas, globos y rótulos. `TECNICA` (B612, 400 y 700) para lo impreso: la cartela, «NOTAS GENERALES», el rótulo del medidor y el sello. Las dos, con `@remotion/google-fonts`.
- **El trazo / la luz / el material:**
  - Cuatro grosores, `W = {contorno: 3.4, detalle: 2.1, fina: 1.35, pelo: 1}`: la silueta, lo de dentro, lo secundario y lo oculto, y las cotas, guías y ejes. Puntas y uniones redondas.
  - Tres tipos de línea: `EJE` `'28 7 5 7'` (raya y punto, ejes), `OCULTA` `'10 7'` (lo que queda detrás) y `FANTASMA` `'30 7 6 7 6 7'` (trayectorias y líneas de mira).
  - Cada objeto es línea más papel: contorno en `LINEA` y relleno `PAPEL`, nunca blanco. Si son varias formas que se pisan, `Union`: primero todas con el trazo al doble y después el papel encima, y se lee UNA silueta sin costuras.
  - Rayados: `pa-trama` (45°, cada 12 px) para lo cortado en sección, `pa-liquido` (−45°, cada 9 px) para líquidos y `pa-tierra` (45°, cada 16 px) para el suelo.
  - Todo el dibujo va dentro de `pa-tinta`: un ruido lo desplaza (escala 1,6) y lo desenfoca 0,35, como tinta que se corre un poco.
- **El fondo y el escenario:** la hoja (`#18336B`, más grande que el lienzo: de −20 a 1120 × 1960) con tres ruidos encima (`pa-manchas` al 0,55, `pa-vetas` al 0,18 y `pa-motas` al 0,25), la cuadrícula `pa-cuadros` (`LINEA` al 0,07 cada 40 px y al 0,17 cada 200 px), el brillo `pa-borde` y un doble marco (a 36 px con `detalle` y a 48 px con `pelo`). Lo del escenario que queda detrás va solo en `OCULTA` y con su nombre («… (DETRÁS)»).
- **Los rótulos y adornos fijos:**
  - La cabecera: `FIG. 05` a 46 px, el título a 29 y una raya `fina` debajo.
  - `Globo` (r 24) con letra o número, unido a su pieza con una línea `pelo`.
  - `Cota`: flechas y la medida escrita a mano, que cambia en vivo (`m()` da dos decimales con coma).
  - `Bisagra` (círculo con cruz) en las articulaciones, como si fuera un mecanismo. `Fuera` (⊙, un vector que sale del plano) para «mira a cámara».
  - El medidor `Intencion`: una esfera de 140° con 11 marcas, aguja, «0» y «MÁX», y su estado escrito debajo.
  - Abajo, la caja de NOTAS GENERALES (en 72, 1676) y la cartela (en 560, 1676) con PROYECTO, PLANO, ESCALA, HOJA, DIBUJÓ y ESTADO.
- **El movimiento:**
  - Fluido, cuadro a cuadro: no va a pasos. Todo sale de `t` en segundos.
  - Al empezar, todo se dibuja solo con `T` (el trazo avanza con `pathLength` 1): la mesa desde 0,02 s, el gato desde 0,08, la taza desde 0,18, el fondo desde 0,3 y las cotas desde 0,55, con `E.outCubic`. Los detalles salen después del contorno (`kD`) y las bisagras, al terminar.
  - Los textos se escriben letra a letra con `escribe()` (de 0,15 a 0,5 s).
  - La tinta no hierve: la hoja entera solo se sacude en los golpes (`temblor`). La aguja del medidor va con `kf` y `E.outBack` (se pasa y vuelve) más un poco de `ruido`.
- **El momento:** el ingeniero lo mide todo, antes, durante y después.
  - Antes: la cota «AL BORDE» que va bajando y la TRAYECTORIA PREVISTA, trazada en `FANTASMA` antes de que caiga.
  - Mientras cae: `g = 9,81 m/s²` y el tiempo de caída en vivo, el ángulo `θ` con su arco y la estroboscopia (la taza cada 0,1 s, en `OCULTA`, con «CADA 0,1 s»).
  - En el golpe: 9 rayas de impacto en `contorno` que salen y se apagan en 0,3 s, y la hoja tiembla 7 px.
  - Después: los trozos numerados uno a uno con globos y el detalle «FIG. 2 · LA TAZA, ANTES».
  - El remate: el sello `ROTA` en `SELLO` a `T_SELLO` (`T_SUELO + 0.28`), que cae de 1,6 a 1 en 0,12 s, girado −9°, gastado por `pa-sello` y con otra sacudida de 5 px. El color se guarda para ese único instante.

## Dónde está en el código
- **Piel (se reutiliza tal cual)**, en `src/estilos/gato/PlanoAzul.tsx`:
  - `LINEA`, `PAPEL`, `SELLO`, `W`, `EJE`, `OCULTA`, `FANTASMA`, `MANO` y `TECNICA`: colores, grosores, líneas y letras.
  - `m(n)`: un número con dos decimales y coma. `escribe(txt, t, t0, dur)`: el texto letra a letra.
  - `T`: un trazo que se dibuja solo (`k` de 0 a 1) y, terminado, toma su tipo de línea; con `fill`, el relleno aparece a la vez.
  - `Union` (varias formas, una silueta), `Cota` (horizontal, `vertical` o `abajo`), `Bisagra`, `Globo` y `Fuera`.
  - `Intencion`: el medidor de aguja. La esfera es piel; sus claves de `kf` y sus estados son de la escena.
  - En el `<defs>`: `pa-manchas`, `pa-vetas` y `pa-motas` (el papel), `pa-tinta`, `pa-sello`, `pa-borde`, `pa-cuadros`, `pa-trama`, `pa-liquido` y `pa-tierra`.
  - En el `return`: la hoja (fondo, texturas y doble marco), la cabecera, las dos cajas de abajo y el sello.
- **Ayudas:** `E`, `clamp`, `kf`, `p`, `ruido` y `temblor` de `src/comun/curvas.ts`; `poli`, `curva`, `elipse`, `arcoElipse`, `cinta`, `rot` y `suma` de `src/estilos/gato/escena.ts`; `capsula` de `src/estilos/formas.ts`.
- **Lo del gato y la taza (lo que se rehace con tu escena):** `DibujoTaza`, `Pie` y `DibujoGato`; en `PlanoAzul`, la ventana y el radiador, la mesa, el suelo, el comedero, `prevista`, `fantasmas`, `tCaida`, `angGrados`, `notas`, `alBorde`, el café, las rayas del golpe en `IMPACTO`, el despiece de `trozos`, la FIG. 2 y los textos de globos, notas y cartela. Y lo que viene de `src/estilos/gato/escena.ts`: `gato`, `taza`, `piezasTaza`, `cafe`, `trozos`, `vapor`, `TRANSFORMA_GATO`, `enMundo` y las medidas de la sala (`MESA_Y`, `BORDE`, `SUELO`…).

## Pintar tu escena en este estilo
1. Copia `src/estilos/gato/PlanoAzul.tsx` a `src/estilos/<tu-escena>/PlanoAzul.tsx` (los imports, como dice `SKILL.md`) y deja entera la piel: constantes, `T`, `Union`, `Cota`, `Bisagra`, `Globo`, `Fuera`, el `<defs>`, la hoja, la cabecera, las cajas de abajo y el sello.
2. Escribe tu escena como `src/estilos/gato/escena.ts`: piezas (puntos y formas) que salen solo de `t`, sin color. Quita las piezas del gato y la taza.
3. Dibuja cada cosa así: contorno con `T` a `W.contorno` y `fill={PAPEL}`; si se pisan varias formas, `Union`; los detalles a `W.detalle` o `W.fina`, un poco después (como `kD`); lo de detrás en `OCULTA`, los ejes en `EJE`, las trayectorias en `FANTASMA`; lo cortado, con `url(#pa-trama)`.
4. Documéntala: un `Globo` con letra para cada protagonista, una `Cota` con una medida que cambie en vivo, la cabecera `FIG. NN` con tu título y tus textos en NOTAS GENERALES y la cartela (con `escribe()`).
5. Tu momento, con la misma receta: la medida de antes (lo «previsto»), el golpe con rayas y `temblor`, el despiece numerado y un solo sello en `SELLO` con tu palabra.
6. Respeta el orden de capas: la hoja → `<g filter="url(#pa-tinta)">` con todo el dibujo (lo de detrás primero, tus objetos, los rótulos encima) → el sello, fuera de la tinta. Todo, dentro del `<g>` que lleva el `temblor`.

**Errores fáciles:**
- Un sello con una palabra más larga que «ROTA» tapa la cartela: encógelo a lo que mida tu palabra.
- Rellenar con blanco o con otro color, o usar el rojo dos veces: deja de parecer un plano. Relleno, siempre `PAPEL`; `SELLO`, una vez.
- Olvidar `fill={PAPEL}` o `Union`: se ve lo que hay detrás a través del objeto y las costuras dentro de la silueta.
- Repetir ids: los `pa-*` y el `clipPath` `pa-ojo${i}` valen para toda la página; con dos copias a la vez, cambia el prefijo. Y si encoges el rectángulo de la hoja (de −20 a 1120 × 1960), al temblar se le ven los bordes.
