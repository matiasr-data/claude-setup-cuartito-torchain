# 7 · Anime
**En una frase:** un capítulo de serie japonesa de tele: cada cosa es un cel (contorno oscuro, colores planos y una sombra de borde duro del lado contrario a la ventana) sobre un decorado pintado de tarde, y el golpe se cuenta con trucos de tele: la cámara que se mete a la cara, un fotograma de impacto rojo y una onomatopeya.

## La piel (igual en cualquier escena)
- **Colores:**
  - La luz de la tarde: fondo `#F3DDBB`; encima de todo, el degradado `tarde` (`#FFC67A` al 22 %, desde arriba a la derecha) y la `vineta` (`#4A2410` al 28 % en los bordes).
  - Contornos: `LINEA` `#2B2446` en el personaje, las rayitas y los toques; cada objeto lleva en `linea` el casi negro de su color (taza `#43121E`, madera `#4A2A1A`).
  - Cada material es una `Tinta` {luz, sombra, brillo, linea}: pelo `#BBBADD` / `#7577AD` / `#FFE2C2`; taza `#F2554B` / `#B7304A` / `#FFA48A`; `MADERA` `#CD8C55` / `#985B33` / `#F0B47C`. La sombra tira a frío, el brillo a cálido.
  - Ojos: iris `#FFC93A`, sombra del párpado `#E58A1E`, luz de abajo `#FFF0A0`, pupila `#22142C`, dos brillos `#FFFFFF`. Rubor `#FF8DA6` con rayitas `#E8607E`. Manchas blancas `#FFFDF7` / `#CACAE7`.
  - Efectos: `Destello` `#FFE7A0` más blanco; líneas de velocidad `#2A1626` (alguna blanca); estrella del golpe `#FFE04A` con borde `#3A1420`; impacto `#FF4A34` con siluetas `#1E0F24`; «¡CRASH!» `#FFDD3C`; «!?» `#F23B30`; gota de sudor `#A9DCFF` / `#24527F`.
- **Letras:** solo Mochiy Pop One (`@remotion/google-fonts/MochiyPopOne`, peso 400, la constante `POP`) y solo en onomatopeyas: «¡CRASH!» a 150 px girado −9° y «!?» a 118 px. Siempre con `paintOrder="stroke"` (el borde detrás del relleno); el «¡CRASH!» lleva dos bordes: 30 px `#E0303A` y 12 px `#2A0E18`.
- **El trazo / la luz / el material:**
  - Todo cuerpo es un `Cel`, en este orden: el contorno detrás (la forma con un trazo de `grosor × 2`), la sombra plana, la luz encima corrida `s` px hacia `LUZ` y recortada a la forma (lo que queda sin tapar es la sombra, de borde duro) y, si hay `brillo`, un filo de `h` px en el lado de la luz.
  - `LUZ = [0.6, -0.8]`: la luz entra de arriba a la derecha. Medidas: personaje `grosor` 3, `s` de 7 (patas, cola) a 16 (cuerpo), `h` 3–5; taza `grosor` 2,8, `s` 11, `h` 4; decorado `grosor` 1,3–2, `s` 4–12.
  - Las piezas de una sola silueta van juntas en el mismo `ds`: un solo contorno por fuera. Las manchas de otro color (hocico, pecho, calcetines) con `Mancha`: su sombra sigue a la de la forma madre.
  - Lo fino, en `LINEA`: bigotes de 2 px al 75 %, el párpado como una raya de 6 px; las rayas del pelo `#4E4F8A` al 38–50 %, recortadas dentro de la forma.
  - Ojos grandes (×1,12), el iris en capas y dos brillos. El brillo duro de un objeto, un trazo blanco de 7 px al 90 %.
  - Solo `clipPath`, nunca máscaras. Filtros, dos: el desenfoque de 1,4 de las nubes (`suave`) y `sil` (feFlood + feComposite: todo en silueta plana).
- **El fondo y el escenario:** un decorado pintado, donde los degradados sí valen: pared de `#E8C496` a `#F8E7CC`, cielo de atardecer de `#6A9DE0` a `#FFB07A`, suelo de `#E4AE74` a `#C2864E`, tablas en perspectiva (`FUGA`). Los objetos, en `Cel`. Ventana a la derecha con el sol (`SOL`), nubes en cel, ciudad lila `#D9C6EC` / `#B9A5DF` y los rayos (`Rayos`): una franja por cristal hacia abajo a la izquierda (`D = [-620, 900]`), `#FFF4D4` del 60 % a 0, con `mixBlendMode: 'screen'` y polvo que brilla.
- **Los rótulos y adornos fijos:** no hay textos en pantalla, solo onomatopeyas. El vocabulario de la tele: `Destello` (estrella de 4 puntas), líneas de velocidad, estela y líneas de movimiento tras lo que cae, tres rayitas de toque, estrella dentada (`estrellaGolpe`), gota de sudor, rubor, «!?» y nota musical (`nota`).
- **El movimiento:** el componente recibe `t` en segundos y todo sale de ahí, suave. Lo dibujado a mano tiembla: las líneas de velocidad y de caída se redibujan 15 veces por segundo (`rng(… Math.floor(t * 15))`); el «¡CRASH!», las rayitas del susto y la pupila saltan ±1,5–2,5 px 30 veces por segundo. El impacto dura `T_IMP` = 0,066 s (dos cuadros a 30). El decorado respira: nubes que avanzan, rayos que laten cada 3 s, polvo, un trapo que se mece, el segundero que salta.
- **El momento:**
  1. Antes, un destello en el ojo: «lo voy a hacer».
  2. Al actuar, la cámara se mete de golpe a la cara: ×1,8 (`Z_ESC` 0,8) en 0,09 s, con un fogonazo blanco al 60 % y líneas de velocidad pegadas a la pantalla, detrás del personaje. A los 0,5 s ya ha vuelto.
  3. Lo que cae deja estela blanca y líneas de movimiento.
  4. El golpe: el fotograma de impacto (fondo rojo plano, 44 rayos blancos, todo en silueta salvo los ojos como platos, «¡CRASH!» blanco); después la onda blanca en el suelo, la estrella amarilla, 11 rayas, polvo, `temblor(t, T_SUELO, 0.45, 20, 5)` y un empujón de zoom del 7 %; el «¡CRASH!» entra con rebote (`E.outBack`).
  5. La reacción: ojos como platos, gota de sudor, cola erizada y «!?»; al final, destellos y una nota.

## Dónde está en el código
- **Piel (se reutiliza tal cual):**
  - `src/estilos/AnimeCel.tsx`: `LUZ`, `mueve` (corre una forma hacia la luz), `girar` (gira un vector, como la luz), `Tinta`, `Cel`, `estrella` y `Destello`.
  - `src/estilos/gato/Anime.tsx`: `POP`, `Velocidad`, `estrellaGolpe`, `nota`, los degradados `tarde` y `vineta`, el filtro `sil`, la cámara (`camara`, `deshaz`, `golpe`), el bloque del fotograma de impacto y el del «¡CRASH!».
  - `src/estilos/gato/AnimeGato.tsx`: `LINEA`, la paleta (`PELO`, `BLANCO`, `ROSA`, `IRIS`…) y tres recetas sin exportar que se copian: `Mancha`, `OjoAnime` (el ojo) y `mechon`.
  - `src/estilos/gato/AnimeCocina.tsx`: `MADERA` y las demás `Tinta`, `Rayos` y los `defs` de `Cocina` (pared, cielo, sol, suelo).
- **Lo del gato y la taza (se rehace):** `GatoAnime`, `PataAnime`, `OrejaAnime`, `colaErizada`, `cadenaArriba`, `sonrisa`, `gesto`, `TazaAnime`, `LineasCaida`, `Estela` y `Toque` (siguen a `taza(t)`), el café en arco, `Cocina` y sus piezas (`Ventana`, `Reloj`, `Balda`, `Suelo`, `Alfombra`, `Saco`, `Trapo`, `Cuenco`, `Mesa`), los tiempos `Z0`, `Z1`, `H0`, `M_CARA`, `SUSTO`; y de `src/estilos/gato/escena.ts`, `gato`, `taza`, `cafe`, `trozos`, `vapor` y `TRANSFORMA_GATO`.

## Pintar tu escena en este estilo
1. Copia `src/estilos/gato/Anime.tsx` en un archivo nuevo y deja el esqueleto: `<svg viewBox="0 0 1080 1920">`, `pre` con `useId`, el fondo `#F3DDBB`, los `defs` y este orden de capas: decorado → `Velocidad` → personajes y objetos → efectos → fogonazo → fotograma de impacto → `tarde` y `vineta`, encima de todo.
2. Tu decorado, copiando `Cocina`: degradados para pared y cielo, cada objeto en `Cel` con su `Tinta` (cuatro tonos de un color: luz, sombra más fría, brillo cálido y línea casi negra) y `Rayos` si hay ventana.
3. Tus cosas: `<Cel id={pre + 'algo'} ds={[...]} tinta={...} grosor={3} s={8} h={4} />`. Los trazos, con `poli`, `elipse`, `curva` y `cinta` (`src/estilos/gato/escena.ts`) o `capsula` y `corazon` (`src/estilos/formas.ts`); los tiempos, con `E`, `p`, `mix`, `kf` y `temblor` (`src/comun/curvas.ts`). Un personaje sigue el orden de `GatoAnime`: lo de detrás, el cuerpo, las manchas, la cabeza, los ojos (`OjoAnime`), la boca.
4. Tu momento (tus segundos en lugar de `T_CAE` y `T_SUELO`) con las mismas piezas: la entrada a la cara (`Z0`, `Z_IDA`, `Z1`, `Z_VUELTA`, `Z_ESC`, `H0`, `M_CARA`), el impacto (`escena(true)` bajo el filtro `sil`) y una onomatopeya con `POP`.
5. Los adornos (`Destello`, rayitas, gota, «!?») van dentro de `camara`, en el mundo; las líneas de velocidad, dentro de `deshaz`, pegadas a la pantalla.

**Errores fáciles:**
- Ids repetidos: cada `Cel` crea su `clipPath` con su `id`. Ponles `pre` delante y un número en los bucles; y al repintar la escena para el impacto, otro prefijo (`pre + 'x'`), o los recortes se cruzan.
- Romper la luz: todo usa `LUZ` (arriba a la derecha). Si pones la ventana o el sol a la izquierda sin cambiarla, las sombras caen del lado de la luz.
- Partir una silueta: un brazo en otro `Cel` encima corta el cuerpo con su contorno. Lo que es una sola forma va en el mismo `ds`, y lo de detrás se pinta antes.
