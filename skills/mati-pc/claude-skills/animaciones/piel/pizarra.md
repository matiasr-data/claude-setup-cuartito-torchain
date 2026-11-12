# 13 · Pizarra de tiza
**En una frase:** una pizarra verde de aula con su marco de madera, donde todo es tiza que se dibuja sola y se redibuja a pasos (12 por segundo, con el borrón del dibujo anterior), y un profe que lo anota todo: la trayectoria en puntos, flechas, medidas y el «¡FALLO!» del final.

## La piel (igual en cualquier escena)
- **Colores:**
  - Las cuatro tizas, `TIZA`: blanco `#F4F2EA` (todos los contornos y lo escrito), amarillo `#FFE070` (lo que señala el profe: la trayectoria, las notas, las flechas), rosa `#FF92BC` (el error: «¡FALLO!», lo que se tacha, el palote nuevo) y azul `#92D4FF` (las medidas: cotas y Δ). En los objetos, una tiza de color por objeto (la camisa amarilla, el pantalón y la silla azules, la papelera rosa).
  - La pizarra: `PIZARRA` `#213a2f` (el fondo), `OCULTA` `#22392f` (el relleno que tapa lo de detrás), `#1b3027` detrás de todo y `#16261f` para un hueco oscuro (la boca de la papelera).
  - La madera, que no es tiza: el listón `pz-marco` `#a8703f` → `#8a5527` → `#5e3615`, los lados `pz-marcoV` `#6a3e1a` / `#93602f`, la repisa `pz-repisa` `#b47b48` → `#9a6534` → `#4d2b10`, las juntas `#3d220b`; en la repisa, tizas `#f1efe6` `#f6dc78` `#f3a1bb` `#a6d8f2` y el borrador (madera `#b9824a`, fieltro `#7d7d78`).
  - La luz, `pz-luz`: un radial (centro en 0,32 / 0,28) blanco al 0,07 que se apaga a la mitad y oscurece los bordes (negro al 0,12 y al 0,34).
- **Letras:** `MANO` (Kalam 700, con `@remotion/google-fonts`) para todo, escrita letra a letra con `Escrito` (`k` de 0 a 1) y girada de −2° a −8°. Con `ancla` al centro el texto se mide entero: se escribe en su sitio, sin moverse. Kalam no tiene «Δ»: va dibujada como un triángulo de tiza (`Cota` y la nota `delta`).
- **El trazo:**
  - La tiza es un trazo normal que pasa por un filtro (`Defs`): un ruido lento (`baseFrequency` 0,032) le tuerce el borde (el pulso de la mano: escala 5 en `pz-quieta` y 6,5 en `pz-viva`), un ruido fino (0,62) le arranca granos (el diente de la pizarra, siempre el mismo) y un halo de polvo (desenfoque 2,6 al 0,26).
  - `pz-viva` cambia de semilla en cada dibujo (`(paso * 7 + 3) % 997`): lo que se mueve tiembla. `pz-quieta` la tiene fija (7): el cuarto y lo escrito no tiemblan.
  - Cuatro gruesos, `W = {gordo: 9, cuarto: 6.5, detalle: 5.5, fino: 4}`: el contorno de lo que se mueve, el cuarto, los detalles y lo fino. Puntas redondas. Las rectas se pasan un pelo de las esquinas, como raya la tiza (`raya(a, b, pasa = 7)`, `rectMano`).
  - Los rellenos van «de canto», como la tiza tumbada (`Forma`): primero tapa con `OCULTA`, después su tiza al 0,52 (`tinte`), encima rayas `pz-trama-<color>` (cada 10 px a −34°, al 0,9) y el contorno blanco. Lo blanco, con `pz-trama-suave` (cada 16 px, `tinte` 0,07–0,2); el pelo, con `pz-trama-densa` (cada 7 px, a 52°). Lo alargado (brazos, patas), con `Capsula`, que hace lo mismo a lo largo de una línea. Las sombras del suelo son elipses rayadas con `pz-trama-suave` (al 0,25–0,65).
- **El fondo y el escenario:** la pizarra (`Fondo`): verde con manchas lentas (`pz-manchas` al 0,55), cuatro pasadas anchas del borrador de otros días (`pz-pasadas`, al 0,3), los restos de una lección borrada («3 × 4 = 12», «a + b», al 0,075) y el polvillo (`pz-polvillo` al 0,5). Encima de todo, `LuzPizarra` y `Marco`: el marco deja la pizarra de x 22 a 1058 y de y 30 a 1846 (`BORDE`), y abajo va la repisa con sus tizas, su polvo y el borrador. El escenario es de tiza y se traza solo al empezar, línea a línea y en perspectiva (`proyecta`): el suelo de tablas, la esquina, la ventana con su sol, la diana, la mesa con su monitor.
- **Los rótulos y adornos fijos:**
  - Arriba a la izquierda, la cabecera (`Cabecera`): «Tiro nº N» a 74 px en (64, 150), subrayada. Arriba a la derecha, la puntuación (`Marcador`): «Fallos» y «Dentro» a 54 px en x 636, una raya entre los dos, palotes de cinco en cinco (cuatro de pie y el quinto tachando: `PALO`, `paloD`) y el «0» de dentro.
  - El final, abajo en el centro: «¡FALLO!» en rosa a 118 px en (560, 1786), girado −4°, con dos subrayados (`W.gordo` y `W.cuarto`).
  - El polvo de tiza (`Polvo`): granos blancos de 3 a 7 px que saltan, frenan en el aire y caen despacio, en nubes (`Nube`) al trazarse el cuarto, al terminar cada nota y en cada golpe fuerte.
- **El movimiento:**
  - A pasos: `PASOS` = 12 dibujos por segundo. Todo lo que se mueve sale de `tq`, con su fase: un dibujo cae justo en el primer golpe.
  - Cada dibujo deja el borrón del anterior: lo mismo pintado en `tq − 1/12` con `pz-borron` (desenfoque 7) al 0,2.
  - El cuarto, la cabecera y la puntuación se trazan solos con `Trazo` (`pathLength` 1): cada línea con su `t0` y su `dur`, con `E.outCubic` y `VEL` = 1,4 veces más deprisa (a los 0,42 s está entero). Las notas se escriben letra a letra; las flechas trazan el cuerpo (75 %) y después las dos rayas de la punta.
  - La cámara va a unos (`t`): el empujón de cada golpe y un acercamiento lento del 2,5 % (`scale(1 + 0.025 * t / DUR)`, desde 60 % 58 %).
- **El momento:** el profe lo explica todo.
  - Antes: la trayectoria en puntos amarillos (radio 6,5, uno cada 32 px del camino en pantalla) se va quedando detrás de la bola.
  - En el golpe: un estallido de 8 rayas (6 en el suelo) alrededor del sitio, abierto hacia donde rebota y con una de cada tres amarilla, que crece y se va en 0,34 s (`Golpes`); la bola se aplasta contra lo que toca; la cámara se sacude; 30 granos de polvo con `fuerza` 1,8; y la nota del golpe sale de una vez («¡PAM!», amarillo, 90 px, `dur` 0,04).
  - Después: la medida (una `Cota` azul, «Δ = 29 cm» de la papelera a la pared, sacada de las medidas de la escena), el «¡FALLO!» rosa con sus subrayados y un palote nuevo, rosa y más grueso. Si sale bien: un óvalo amarillo a mano alrededor, «¡DENTRO!» a 128 px, tres estrellas de las tres tizas y el «0» tachado y cambiado por un «1» con su ✓.
  - Lo que siente el personaje, dibujado alrededor de la cabeza (`Gestos`): rayas de sorpresa, una gota azul, estrellas amarillas, una nube de garabato o tres puntos.

## Dónde está en el código
- **Piel (se reutiliza tal cual):**
  - `src/estilos/bola/pizarra/tiza.tsx`: `MANO`, `TIZA`, `Color`, `PIZARRA`, `OCULTA`, `W`; las cuentas `sum`, `res`, `esc`, `pto`, `cruz`, `lar`, `nor` y `vista`; los caminos `poli`, `curva`, `envolvente`, `raya`, `rectMano` y `aro3`; `Defs` (los filtros, las tramas y los degradados); las piezas `Trazo`, `Forma`, `Capsula`, `Escrito`, `Flecha` y `Cota`; `Nube` y `Polvo`.
  - `src/estilos/bola/pizarra/Cuarto.tsx`: `BORDE`, `Fondo`, `LuzPizarra`, `Marco`, `VEL`, `FIN_CUARTO`, `Cabecera` y la receta del cuarto que se traza solo (`TrazoCuarto`, `{d, t0, dur, w, c, op}`, y `kDe`).
  - `src/estilos/bola/pizarra/Notas.tsx`: los tipos de nota (`Nota`: texto, flecha, cota, delta, tacha, ovalo, estrella), `DUR`, `UnaNota`, `estrellaPts`, `Notas` (con el «¡FALLO!»), `Marcador` (`PALO`, `paloD`) y `nubesNotas`.
  - `src/estilos/bola/pizarra/cuerpos.ts`: `caja` y `cilindro` (de una forma en 3D, su silueta y las aristas que se ven) y la cara pegada a una cabeza que gira (`rasgos`, `ABRE`, `GIRO_CARA`, `CARA`).
  - `src/estilos/bola/pizarra/Actores.tsx`: `CajaTiza`, `Gestos`, `Golpes` y `SombraBola` (la sombra rayada que crece al bajar).
  - `src/estilos/bola/pizarra/Pizarra.tsx`: `PASOS`, la fase, `paso` y `tq`, el borrón, la trayectoria en puntos (`puntos`, `Rastro`), las nubes (`nubes`), el orden de las capas y la cámara.
- **Ayudas:** `E`, `clamp`, `p` y `rng` de `src/comun/curvas.ts`; `proyecta`, `escalaEn`, `CAMARA`, `temblor`, `lanzamiento`, `T_PRIMERO` y `DUR` de `src/estilos/bola/escena.ts`.
- **Lo de la bola y el muñeco (se rehace):** en `cuerpos.ts`, `muneco`, `silla`, `mesa`, `papelera` y `lampara`; en `Actores.tsx`, `Pieza`, `MunecoTiza`, `PapeleraAtras`, `PapeleraDelante`, `giroPapelera`, `LamparaTiza`, `bolaPts`, `BolaTiza` y `bolaDetras`; en `Cuarto.tsx`, las líneas de `lineasCuarto` (el suelo, la esquina, la ventana, la diana), la mesa y `grafico`; en `Notas.tsx`, `GUIONES` (las notas de cada tiro, colocadas a mano), `PX_CM` y `cm`. Lo que pasa sale de `src/estilos/bola/escena.ts`: `bola`, `_trayecto`, `esqueleto`, `giroRaiz` y las medidas (`SUELO`, `PAPELERA`, `MURO_X`, `Z_PARED`…).

## Pintar tu escena en este estilo
1. Copia `src/estilos/bola/pizarra/` a `src/estilos/<tu-escena>/pizarra/` (los imports de `../escena`, a tu escena; los de `src/comun/curvas.ts`, con la profundidad que toque). `tiza.tsx` va tal cual. Tu escena, en un `escena.ts` aparte que sale solo de `t`; si es plana, en z = 0, donde `proyecta` la deja tal cual (1:1 en 1080 × 1920).
2. En `Pizarra.tsx` deja `PASOS`, la fase (con `T1` = el instante de tu golpe), `Defs` con `prefijo="pz"`, el borrón (tu dibujo en `tq − 1/PASOS`) y este orden: `Fondo` → `pz-quieta` (cuarto, cabecera, puntuación) → borrón → `pz-viva` (lo que se mueve) → `pz-quieta` (las notas) → `Polvo` → `LuzPizarra` → `Marco`. La cámara, con `t`.
3. Tu cuarto: rehaz `lineasCuarto` con tus trazos (`raya`, `rectMano`, `curva`), cada uno con su `t0` y su `dur`. Esos tiempos se dividen por `VEL`: lo importante primero y nada que termine después de 0,6 (el cuarto queda entero a los 0,43 s). Cambia el texto de la `Cabecera` y las palabras del `Marcador`.
4. **Una cosa nueva:** su silueta con `Forma` (contorno blanco a `W.gordo` y una tiza de color por objeto); lo alargado, con `Capsula` y su radio; una caja o un cilindro en 3D, con `caja` o `cilindro` de `cuerpos.ts` y `CajaTiza`; los detalles, con `Trazo` a `W.detalle` o `W.fino`; una cara, como `rasgos` (ojos rellenos, cejas y boca en trazos de 5–6 px). Pinta de atrás adelante: `Forma` ya tapa lo de detrás con `OCULTA`.
5. El profe: tus notas en una lista como `GUIONES` (qué, cuándo y dónde, colocadas a mano donde no pisan nada), la trayectoria en puntos de lo que se mueve (`puntos`, con su posición) y el final («¡FALLO!» o tu palabra). Tu golpe, como el de la bola: `Golpes` con su sitio `p` y su normal `n`, el `temblor` de `src/comun/curvas.ts` en ese instante, una `Nube` con `fuerza` 1,8 y la nota del golpe con `dur` 0,04.
6. Primero una foto en el golpe; si se está escribiendo una nota, 0,3 s después de que termine.

**Errores fáciles:**
- Cambiar el `prefijo` de `Defs`: `Forma`, `Capsula`, `Fondo` y el `Marco` piden los ids `pz-…` por su nombre, y los rellenos se quedan sin rayas. Para dos pizarras en la misma página, cambia el prefijo en todos esos sitios.
- Mover algo con `t` en vez de `tq`: va suave a 60 y deja de parecer tiza redibujada. Y lo que se mueve dentro de `pz-quieta` no tiembla; lo quieto dentro de `pz-viva`, hierve.
- Rellenar con un color opaco o sin la tapa `OCULTA`: deja de ser tiza o se ve lo de detrás. Cada tiza dice algo: el rosa, solo para el error.
- Pisar los sitios ocupados: la cabecera (arriba a la izquierda, hasta y ≈ 180), la puntuación (x 624–1012, hasta y ≈ 225), el «¡FALLO!» (abajo, y ≈ 1690–1830) y el marco por los cuatro lados.
- Hacer que el cuarto dependa del tiempo: sus líneas y la mesa se calculan una vez al cargar (`LINEAS`, `MESA`) y solo avanza su trazo. Lo que cambia de sitio va con lo que se mueve, en `pz-viva`.
