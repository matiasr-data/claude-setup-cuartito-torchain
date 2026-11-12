# 4 · Isométrico
**En una frase:** una maqueta en isometría de verdad (tres ejes a 120°, sin perspectiva), en pastel, con cada sólido en tres tonos y sin contorno, sombras difusas en el suelo y tarjetitas que flotan encima.

## La piel (igual en cualquier escena)
- **Colores:**
  - El aire: degradado vertical `#EEEAFA` → `#F4EEF9` (al 55 %) → `#FCE9E2`.
  - La sala: pared del fondo `#DCD4F2`, pared izquierda `#CBC1EA` (hasta z 380, un 5 % más oscuras), zócalo `#C4B9E6`, moldura `tri('#E9E4F8', 0.6, 0.1)`; suelo a cuadros `#EEEAF8` y `#DFD8F2` con juntas `#D6CEEC`; el canto de la maqueta coral `#F1937D` (el lado derecho, un 16 % más oscuro) con un filo `#F8B7A6`.
  - El oscuro de todo: `#3B2F6E` (caras de la derecha, bases de las tarjetas, huecos). La sombra: `#5A4A97`. La tinta (ojos, letras): `#2E2A5E`.
  - Acentos: lila `#9E8CF0`, coral `#F48C78`, menta `#6FD2B0`, amarillo `#F6C95E`, rosa `#FF6F8B`, rojo `#F2525C`.
  - Materiales, cada uno en tres tonos con `tri`: mesa `#E6E0F5`, madera `#CABFEC`, soporte `#A79ECF`, nevera `#B4BEF3`, maceta `#EE8D6E`, asiento `#74D2B2`, hojas `#7FD5B3`, loza `#FFF7EC`. Ventana: marco `#FBFAFF`, cielo `#C8E0FA` → `#F3EAFB`, sol `#FFE7A3`, colinas `#A9E2CB` y `#86D3B5`; cortinas de cuadros `#FBD3C8` con coral al 55 %.
  - Del gato y la taza (cámbialos): pelo `#F49A55`, rayas `#D46F35`, crema `#FFF0E0`, iris `#C3E06A` / `#86B53C`, oreja `#F7A9B4`, nariz `#F0899A`, bigotes `#5B4A78`, café `#7A4A36` / `#A86A4C`.
- **Letras:** Poppins (`POPPINS`, pesos 600 y 700), solo en la etiqueta: 700, 40 px, espaciado 1, en `#2E2A5E`.
- **El material:**
  - Isometría pura: `pr([a, l, z])` pasa un punto del mundo a la pantalla. +a va abajo a la derecha, +l abajo a la izquierda (hacia la cámara), +z arriba; cada eje mide `K = 0.86` px de pantalla por px de mundo. Lo lejos mide igual que lo cerca.
  - Sin contorno. Una caja enseña tres caras (`caras`): arriba, la más clara; la izquierda (+l), el color base; la derecha (+a), la más oscura. `tri(base, luz = 0.45, osc = 0.17)` las saca mezclando con blanco y con `#3B2F6E`. Cada cara lleva un trazo de 0,8 px de SU color (`cara`) para tapar rendijas.
  - Lo redondo, con luz de arriba a la izquierda: esferas y elipsoides con degradado radial (`luz`: centro a −0,4 r y −0,46 r, radio 1,75 r); cilindros con degradado de izquierda a derecha (`degradadoX`); tubos, de lado a lado (`tubo`). Un sólido de caras planas, cada cara con su tono según hacia dónde mira (`tonoN`).
  - Lo plano (un dibujo, una pantalla, un imán, un salvamanteles) se dibuja en 2D dentro de `plano.pared(q)`, `plano.suelo(q)`, `plano.frente(q)` o `planoDe(o, u, v)`.
  - Sombras: la luz las tira hacia +a y un poco hacia la pared (`sombra(q)`, `SA = 0.34`, `SL = -0.2`). La de cada caja es la envolvente (`casco`) de sus esquinas proyectadas (`sombraCaja`), en `#5A4A97` al 15 %, difuminada 10 (`isog-difusa`) y recortada al suelo; sobre un mueble, al 20 %. Lo que flota: `isog-flota` (cae 16 px, difuminado 10, 22 %). El vapor: trazos blancos de 13 con `isog-vaho`.
- **El fondo y el escenario:** una esquina de habitación hecha maqueta: dos paredes de 1500 de alto (fondo en l = −660, izquierda en a = −1000), suelo de baldosas de 180 hasta a = 1000 y l = 470, y ahí el canto coral de 72 de grueso, como una pieza sobre la mesa. Detrás, el degradado del aire.
- **Los rótulos y adornos fijos:**
  - Tarjetitas de icono (`Tarjeta`): 100 × 100, esquinas de 24, color de acento, su base 8 px más abajo (el color mezclado con `#3B2F6E` al 28 %), un brillo blanco al 13 % y el icono en blanco. Suben y bajan 16 cada 2 s, cada una con su `fase`.
  - La etiqueta que sigue al protagonista: píldora blanca de 80 de alto, un punto de color (r 15) y el estado en mayúsculas; al cambiar, crece un 8 % un instante.
  - El bocadillo «!» rojo (124 × 118, esquinas de 40, con su pico).
  - Marcas en el suelo: el blanco discontinuo coral con su cruz, la línea de puntos coral (5 de ancho, `4 13`) y las ondas rosas.
- **El movimiento:** continuo, cuadro a cuadro (sin pasos). La cámara: `translate(540, 960) scale(Z) translate(−CC)`; se acerca despacio (Z de 1,17 a 1,24) y se reencuadra con `E.inOutCubic`. Lo que aparece entra con `E.outBack`; las ondas, con `E.outCubic`. Al golpe, `temblor(t, T_SUELO, 0.38, 13, 4)`. Lo que se empuja se menea con un seno que se apaga: `0.075 · e^(−9 s) · sin(34 s)`.
- **El momento:** se anuncia antes y se marca en el suelo:
  - 0,4 s antes de caer, la ruta se dibuja sola (puntos coral) y el blanco salta con rebote donde va a tocar; la tarjetita que tiene que ver se sacude al irse el objeto (gira 14° · sin(60 t) y crece un 12 %).
  - Mientras cae, su sombra crece y se oscurece (radio 60 × 0,35 → 1,05; opacidad 0,08 → 0,38).
  - Al tocar: se va el blanco (0,08 s), un chispazo (disco blanco y diez rayas coral, 0,32 s), dos ondas rosas de 60 a 480 (0,75 s), la cámara tiembla, el «!» salta con rebote y late un 7 %, y la etiqueta cambia de estado y de color (de rojo a menta).
  - Lo roto son prismas de loza de 18 de grueso (canto `LOZA`, cara del color de la pieza) que se tumban al pararse.

## Dónde está en el código
- **Piel (se reutiliza tal cual):**
  - `src/estilos/IsometricoMotor.ts`: `V3`, `K`, `K3`, `ORIGEN`, `pr`, `hondo` (a + l + z: más, más cerca), `mas`, `prod`, `ruta`, `ruta3`, `plano` (`pared`, `suelo`, `frente`), `planoDe`, `caras`, `esquinas`, `casco`, `elipse` (una circunferencia en el mundo), `SA` / `SL` / `sombra`, `mezcla`, `tri` / `Tri`.
  - `src/estilos/gato/Isometrico.tsx`: `COL`; los materiales `MESA`, `MADERA`, `SOPORTE`, `NEVERA`, `MACETA`, `ASIENTO`, `LOZA`; `Ctx` y `cx.id`; `cara`, `caja`, `sombraCaja`, `degradadoX`, `luz`, `cilindro`, `tubo`; `Elip3`, `silueta`, `enSuperficie`, `bola`; `tonoN`; los vectores `lin`, `por3`, `menos3`, `dot`, `cruz`, `uni`, `mix3`, `VISTA`; `pulso`, `kv`; `Tarjeta`, `ICONO`, `TARJETAS`. Y dentro de `Isometrico`: los `<defs>` fijos, la cámara (`Z`, `CC`, `camara`, `cam`), paredes, suelo y canto, las sombras recortadas al suelo, el blanco, la ruta, la onda, el chispazo, el bocadillo y la etiqueta.
  - `src/estilos/formas.ts`: `capsula` (la silueta de un tubo) y `corazon`. `src/comun/curvas.ts`: `E`, `clamp`, `mix`, `p`, `rng`, `temblor`.
- **Lo del gato y la taza (se rehace con tu escena):** `gato3` y `Partes`, `deElipse`, `W3`, `G3`, `XA`, `S`, `PARPADO`, `PICARDIA`, `SONRISA`, `PELO`, `RAYA`, `CREMA`, `TAZA`, `dibujaTaza`, `ASA`, `trozo3` y `RUMBO` (su forma de dar grosor a una pieza plana sirve para cualquier cosa rota), `aMundo`, `giros`, `IMP`, `PUNTO_IMP`, `M`, `TOP`; la cocina: `ventana`, `estante`, `nevera` / `NV`, `taburete` / `TB`, `planta` / `PL` / `HOJAS`, `frutero` / `FR` / `FRUTAS`, `comedero` / `CO`; los textos de la etiqueta; y `src/estilos/gato/escena.ts` entero.

## Pintar tu escena en este estilo
1. Copia `src/estilos/gato/Isometrico.tsx` con otro nombre. Conserva el motor, `COL`, las ayudas (`cara` … `tonoN`), `Tarjeta`, los `<defs>` fijos, la cámara y el esqueleto del `return` (aire, paredes, suelo, canto, sombras al suelo, tarjetas, etiqueta). Quita `gato3`, `dibujaTaza`, `trozo3` y los muebles.
2. Piensa tu escena en el mundo, en [a, l, z], con el suelo en z = 0 dentro de a −1000…1000 y l −660…470 (o mueve `AP`, `AB`, `LP`, `LB`). Cajas con `caja(key, origen, tamaño, tri('#color'))`, botes y cosas redondas con `cilindro`, patas y brazos con `tubo`, lo blando (cabezas, hojas, frutas) con `bola`.
3. Logos, pantallas y carteles, en 2D dentro de `plano.pared/suelo/frente(q)`.
4. Cada objeto, con su sombra en `sombrasSuelo` (`sombraCaja` de su caja envolvente); lo que va por el aire, un círculo difuminado que crece al bajar.
5. Pinta a mano de atrás adelante: paredes y lo pegado a ellas → suelo → sombras → lo del fondo → lo del medio → lo de delante. Lo que flota (tarjetas, bocadillo, etiqueta), fuera del grupo de la cámara y colocado con `cam(pr(q))`.
6. Tu momento: cambia `ICONO` y `TARJETAS`, los estados de la etiqueta y dónde cae el blanco; deja la secuencia (ruta y blanco antes; chispazo, ondas, temblor y «!» al tocar).

**Errores fáciles:**
- Ponerle borde a un sólido o pintar una cara con un color que no salga de `tri`: deja de leerse como maqueta. El trazo de 0,8 px de `cara` es del color de la cara, no un contorno.
- Ids repetidos: todo degradado o recorte que nace dentro de una ayuda va con `cx.id('nombre')` (lleva el cuadro y un contador). Con un id fijo, en cuanto llamas dos veces a la ayuda todas usan el primer degradado.
- Perder el orden: dentro de `caja` van izquierda, derecha y arriba; entre objetos, el de más `hondo` va después. Y si metes las tarjetas dentro de la cámara, crecen con el zoom.
