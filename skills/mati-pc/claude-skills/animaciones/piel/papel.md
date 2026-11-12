# 3 · Papel recortado
**En una frase:** stop motion de cartulina: cada cosa es una hoja cortada a tijera, con su fibra y una sombra suave sobre lo de detrás, recolocada a mano 12 veces por segundo.

## La piel (igual en cualquier escena)
- **Colores:**
  - Sombras y aire: sombra de todas las piezas `#3A200C` (también la de contacto, `gpp-contacto`, y el rincón suelo-pared al 0,32); bajo un mueble `#2A1606` al 0,34; viñeta `#3A1F0C` (hasta 0,42 en los bordes); luz cálida `#FFF3D9` al 0,24 desde arriba a la derecha; parpadeo `#1E1006`.
  - La fibra: manchas claras `#FFFFFF` y oscuras `#6B4426`, hilos `#FFFFFF` (0,13) y `#5A3A20` (0,07), motas `#4A2E18` (0,1).
  - El latón de los encuadernadores: `#FFF2BE` → `#E3B64C` → `#9C7020`, borde `#7E5717`, brillo `#FFF8E0`, sombrita `#2E1806`.
  - Cartulinas de color (`TINTAS`): coral `#E2553F` / `#BE3F2D`, mostaza `#F0B43C`, menta `#4AA497`, lila `#9A86C9`, azul `#5B8FCB`, crema `#F8EFDD`, verdes `#3E9B51` `#2D7C42` `#63B967` (los de delante, `#2A6B3A` `#1F5631` `#3F8B4A`), terracota `#D36A40` / `#B65632`; tinta de ojos y bocas `#3A2416`.
  - El decorado: base `#ECDDC3` (papel pintado con rayas `#D9C3A0` y un filo blanco), madera `#CB905A` `#A86F3F` `#B57C4A`, tablas del suelo `#C08552` `#C98F5B` `#B77B49` `#CF9A66` sobre juntas `#8C5934`, cuerda `#6E5236`.
  - Del gato y la taza (cámbialos): naranjas `#EE8C3A` `#C65C1C`, pelaje `#FBEBD3`, cobalto `#2F62B5` / `#204A8E`, loza `#FBF4E6`, café `#5A311B` / `#8A5631`.
- **Letras:** Lilita One (`LILITA`), solo en la onomatopeya: 118 px, cada letra girada (`[-8, 5, -4, 7, -6, 9]` grados más un temblor) y a su altura, alternando coral `#E2553F` y cobalto `TINTA_CRAC` (`#2F62B5`), con un borde de papel `#FBF3E2` de 20 px por detrás (`paintOrder="stroke"`) y sombra `s4`.
- **El material:**
  - Nada es una curva limpia: todo es un polígono cortado a tijera con `recorte(pts, semilla, amp, paso)`: tramos rectos cada `paso` px (6–26), cada punto movido hasta `amp` px (0,3–1,6) y un 6 % de muescas.
  - Cada pieza se corta UNA vez con su semilla, en sus propias medidas, y se coloca con `tf(c, ang, sx, sy)`: el borde no cambia nunca y la fibra viaja con la pieza.
  - Nunca color liso: `fill={f('tinta')}` es la cartulina con su fibra (un `pattern` de 300 px; la pared, de 216).
  - Sin contornos (salvo el filo de tinta del ojo y las cuerdas). La profundidad son las sombras, dx/dy/difuminado/opacidad: `s0` 1,6/2,6/1,6/0,30 (pegado plano) · `s1` 3,5/6/4/0,36 (piezas pequeñas) · `s2` 5/8/5/0,40 (piezas normales) · `s3` 6/10/5,5/0,44 (cuerpos grandes) · `s4` 9/15/6/0,42 (mueble, rótulo) · `s5` 11/17/10/0,42 (lo pegado a la cámara) · `sg` 14/18/12/0,30 (el personaje entero).
  - Brillos y pliegues: otra pieza encima, blanca o crema, al 0,22–0,5. Uniones: un encuadernador de latón (`chincheta`). Lo que es aire (vapor, humo): papel de seda, `seda()`, dos cintas blancas al 0,58 y al 0,7.
- **El fondo y el escenario:** un diorama de capas: pared, suelo de tablas en perspectiva (filas de 38 a 88 px que crecen hacia la cámara), muebles con su sombra de contacto y una planta grande cortada por la esquina de abajo a la izquierda (`frente`). Encima de todo, fuera de la sacudida: la luz (`gpp-luz`), la viñeta (`gpp-vineta`) y el parpadeo.
- **Los rótulos y adornos fijos:** la guirnalda de 13 banderines (coral, mostaza, menta, crema, lila, verde, azul) en una cuerda en comba (`guirnalda(n)`), la planta de delante (`frente(n)`) y la onomatopeya de letras pegadas en el golpe.
- **El movimiento:**
  - 12 pasos por segundo (`PASOS`): `n = Math.floor(t * PASOS + 1e-6)`, `tq = n / PASOS`, y todo se calcula con `tq`: va a saltitos.
  - En cada paso cada grupo se recoloca un pelo con `toque(r, ancla, a, g)`: hasta ±1,3 px y ±0,55° sobre su articulación. Un objeto quieto, ±0,7 px; los banderines, ±1,6°; la planta de delante, ±0,45°. El azar, `rng(semilla + n * k)`: mismo paso, mismo temblor.
  - La luz parpadea: un velo `#1E1006` al 0,012 más hasta 0,035 distinto en cada paso.
  - Lo que vuela rápido lleva rayas de velocidad: tres tiras crema con `s1` detrás.
- **El momento:** el golpe se cuenta en pasos, no en curvas (`T_GOLPE`, el primer paso tras el impacto):
  - Todo el decorado se sacude 3 pasos: `[9, -7]`, `[-6, 4]`, `[3, -2]`.
  - Una estrella desplegable de tres cartulinas (mostaza, crema, coral; `ESTRELLA`) salta del suelo detrás del objeto como un pop-up: alto por pasos `[1.22, 0.9, 1.05, 1]` y, ~0,4 s después, se pliega en `[1, 0.62, 0.22, 0]`.
  - La onomatopeya entra igual (`[1.28, 0.9, 1.05, 1]`) y se va en dos pasos (`[0.6, 0]`) ~0,75 s después.
  - Y lo que se rompe: trozos con `s2`, astillas que rebotan una vez, un charco que crece a saltos y papel de seda que sube.

## Dónde está en el código
- **Piel (se reutiliza tal cual):**
  - `src/estilos/gato/PapelTintas.tsx`: `TINTAS` y `Tinta` (las cartulinas); `f(t)` (la cartulina como relleno); `DEFS` (la fibra `grano`, los `pattern`, los degradados `gpp-claro`, `gpp-oscuro`, `gpp-contacto`, `gpp-laton`, `gpp-luz`, `gpp-vineta`, `gpp-rincon`, `gpp-bajomesa` y las sombras `s0`–`s5` y `sg`); `chincheta(c, r, lejos, key)`.
  - `src/estilos/PapelGeo.ts`: `recorte` (el corte a tijera) y formas en puntos: `circuloPts`, `rectPts`, `tiraPts`, `capsulaPts`, `envolvente`, `corazonPts`, `hojaPts`, `nubePts`, `banda` (una franja que se repite sin costura).
  - `src/estilos/gato/PapelCorte.ts`: `corte` (a tijera con un número FIJO de puntos, para piezas que cambian de forma), `tf`, `elipsePts`, `capsulaLocal`, `trazo` (una tira que sigue una línea), `cuadratica`, `manchaPts`.
  - `src/estilos/gato/PapelCocina.tsx`: `pz` (cortar + cartulina + sombra en una línea; no se exporta, cópiala), `hojasPlanta`, `planta`, `guirnalda(n)`, `frente(n)`.
  - `src/estilos/gato/Papel.tsx`: `PASOS` y el paso `n`/`tq`, `LILITA`, `seda`, `estrellaMedia` / `ESTRELLA` / `subeEstrella`, `LETRAS` / `CRAC` / `TINTA_CRAC`, la sacudida `sac`, el `parpadeo` y el orden de capas del `return`.
  - `src/estilos/gato/PapelGato.tsx`: `toque` (el recolocado a mano) y `elip` (una elipse cortada, colocada y estirada).
  - `src/comun/curvas.ts`: `rng` (azar con semilla), `clamp`, `mix`.
- **Lo del gato y la taza (se rehace con tu escena):** `GatoPapel`, `PataPapel`, `OjoPapel`, `R`, `CORTE`, `cuna`, `RAYAS_TORSO`, `RAYAS_CADERA`, `orejaPts`, `dentroPts` (PapelGato.tsx); `TAZA`, `TROZOS_LOCAL`, `LUNAR_TROZO`, `ASTILLAS`, `astilla`, `GOTA`, `CHARCO`, `MANCHAS`, `suave`, `cintaPts`, las `rayas` y el chorro (Papel.tsx); `FONDO`, `MESA` y sus piezas `repisa`, `cuadro`, `ventana`, `cortina`, `cenefa`, `azulejos`, `suelo` (PapelCocina.tsx); las tintas del gato, la taza y el café; y `src/estilos/gato/escena.ts` entero (`gato`, `taza`, `cafe`, `trozos`, `vapor`, `T_CAE`, `T_SUELO`, `IMPACTO`…).

## Pintar tu escena en este estilo
1. Copia `src/estilos/gato/Papel.tsx` con otro nombre y conserva el esqueleto: `<svg viewBox="0 0 1080 1920">`, `{DEFS}`, el paso `n`/`tq`, el grupo de la sacudida y, al final, luz, viñeta y parpadeo. Quita la taza, el café y el gato.
2. Añade tus colores a `TINTAS` (cada uno se vuelve cartulina con fibra solo) y pinta siempre con `f('tuColor')`.
3. Dibuja cada cosa en sus medidas, centrada en 0,0 (`rectPts`, `circuloPts`, `elipsePts`, `capsulaLocal`, `hojaPts`…), córtala UNA vez fuera del componente con `recorte(pts, semillaÚnica, amp, paso)` y colócala en cada paso con `transform={tf(c, ang)}` y su sombra (`filter="url(#gpp-s2)"`).
4. Lo que se articula, una pieza por parte: cada grupo con `toque(r, articulación)` y un `chincheta` en la unión. Si una pieza cambia de forma, `corte(pts, semilla, amp, m)` con `m` fijo.
5. Respeta el orden de capas: fondo → guirnalda → estrella del golpe → mueble → sombras de contacto → papel de seda → tus objetos → protagonista → onomatopeya → `frente(n)` → luz, viñeta y parpadeo (estos tres, fuera de la sacudida).
6. Tu momento: cambia `LETRAS` (cada letra con su ancho) y `CRAC.c` (dónde va), calcula `T_GOLPE` con tu instante de impacto y deja tal cual las listas de pasos de la estrella, las letras y la sacudida.

**Errores fáciles:**
- Cortar dentro del render, o con una semilla que cambia: el borde «hierve» en cada paso. Y si metes la posición en los puntos en vez de usar `tf`, la pieza resbala sobre su fibra.
- Usar `t` en vez de `tq`, o un `rng` cuya semilla no lleve `n`: sale un movimiento suave y se pierde el stop motion.
- Ids: los de `DEFS` llevan `gpp-` y son siempre iguales (dos copias del mismo estilo no chocan), pero si cambias los colores y pintas dos versiones a la vez, cambia el prefijo en `f` y en `DEFS`. Los `clipPath` de cada personaje llevan su `uid` (`React.useId()`): nunca a mano.
