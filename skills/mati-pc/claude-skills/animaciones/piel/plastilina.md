# 10 · Plastilina
**En una frase:** stop motion de plastilina en 3D (Three.js con `@remotion/three`): figuras gordas y mates con huellas de dedo, luz cálida de estudio con sombras suaves, desenfoque de objetivo macro y todo animado «a dos», a 12 posturas por segundo, temblando un pelo distinto en cada una.

## La piel (igual en cualquier escena)
- **Colores:**
  - Luces: cielo `#FFF1DE` con suelo `#A5704B` (`hemisphereLight`, 1,2); la principal `#FFE2BD` (2,5, con sombra); relleno `#FFF3E2` (0,75); contraluz `#FFE7C9` (1,1); en el plano nítido, una baja por detrás `#FFF0DA` (1,2) y una débil desde la cámara `#FFFFFF` (0,35).
  - Sombras: la de contacto `#2a1206` (al 45–55 %), la que recoge el suelo `#4A240E` al 42 %; la viñeta, `rgba(60,30,10,0.34)` en los bordes.
  - El brillo ceroso de cada color (`sheenColor`): su mismo color mezclado al 55 % con `#fff4e6`.
  - Los colores de la escena, cálidos y saturados, agrupados por objeto (`COL_GATO`, `COL_COCINA`, `COL_TAZA`): haz igual con los tuyos.
- **Letras:** ninguna. No hay texto en pantalla.
- **El material:**
  - `arcilla('#hex', {rough, brillo, bump, emite, fuerza})` da un `MeshPhysicalMaterial` mate y ceroso: `roughness` 0,62, `metalness` 0, `sheen` 0,45 (`sheenRoughness` 0,6), `clearcoat` 0,06 (`brillo`), `clearcoatRoughness` 0,5, `specularIntensity` 0,55 y el relieve con `bumpScale` = 3,2 (`RELIEVE_BASE`) × dpr × `bump`.
  - `relieve()`: una textura gris de 1024 px sin costura, toda en código: bultos suaves, presiones de pulgar con su reborde, huellas de dedo, rayitas de la herramienta de modelar y grano con poros. `TESELA` = 300 px del mundo por tesela: la huella mide lo mismo en un dedo que en un pecho.
  - Ninguna forma es perfecta: `abolla` le mete ondas y hoyos de dedo, distintos según su `semilla`.
  - Lo que brilla (ojos, líquidos, esmalte) baja `rough` y sube `brillo` (el iris: 0,16 y 1) y entra en una lista `brillantes…()`, para que `Entorno` le dé los reflejos de un estudio blanco (`RoomEnvironment`); la plastilina mate no los lleva. Un líquido es plastilina con barniz: `cafeMat` (`roughness` 0,1, `clearcoat` 1, sin `sheen`).
  - La luz principal llega desde `LLAVE` [−0,45, 1, 0,55] (arriba a la izquierda y por delante) con sombra suave (`shadows="percentage"`, `shadow-radius` 7, 16 muestras); tono `NeutralToneMapping` a exposición 1.
  - Proporciones de muñeco: gordo y redondo, la cabeza 1,15 veces más grande (`CABEZA`).
- **El fondo y el escenario:** tres `ThreeCanvas` apilados, como un objetivo macro: la pared (en `Z_PARED`, −400) desenfocada 11 px (`DESENFOQUE`, con el lienzo 48 px más grande por lado, `MARGEN`, para que el desenfoque no oscurezca los bordes), el suelo desenfocado 3 px (`DESENFOQUE_SUELO`) y, nítido, el plano z = 0 donde pasa todo, con un plano `shadowMaterial` que recoge las sombras en el suelo. Cada lienzo, con sus `Luces` apuntando a lo suyo. La cámara (`Camara`) mira de frente desde la altura `CAM_Y` (560) con el objetivo descentrado (`setViewOffset`): el plano z = 0 sale 1:1 en el lienzo de 1080 × 1920 (`D` y `FOV` = 30). La pared es un plano mate con el mismo relieve; una ventana o una bombilla, un plano o una bola con `emissive`.
- **Los rótulos y adornos fijos:** no hay rótulos. Lo fijo es la viñeta cálida y una sombra de contacto (`mancha()`) bajo todo lo que apoya.
- **El movimiento:** «a dos»: `PASOS` = 12 posturas por segundo. El tiempo de todo lo que se anima salta a `tq` (múltiplos de 1/12 s, con `FASE` para que una postura caiga justo en el golpe). En cada postura, cada pieza tiembla distinto con `tiembla(paso, i, amp)` (±1,5 px y un pelo de giro); lo quieto (el decorado, la taza mientras no se mueve) no tiembla. La luz parpadea ±1,75 % entre foto y foto (`parpadeo`). La cámara va «a unos», con `t` continuo. Las caras cambian por piezas, como en el stop motion (la boca de recambio en «o»).
- **El momento:** la taza cae girando a saltos, también sobre su eje (el asa viene hacia la cámara), y su sombra crece en el suelo. En la primera postura del golpe se aplasta entera (escala 1,28 × 0,64 × 1,2); en la siguiente salta en 6 trozos gordos (rojos por fuera, crema por dentro) que suben ~250 px girando, botan dos veces como plastilina, resbalan y se quedan tumbados sobre un lado largo (`salto`), con 20 migas. El café: tubos lisos que adelgazan, gotas estiradas según su velocidad, la corona y un charco que se extiende, todo con barniz. La cámara tiembla (`temblor(t, T_SUELO, 0.36, 10, 5)`) con un empujón de zoom del 2 %, y el gato echa las orejas atrás.

## Dónde está en el código
- **Piel (se reutiliza tal cual):**
  - `src/estilos/PlastilinaArcilla.ts`: `V3`, `TESELA`, `relieve`, `arcilla`, `RELIEVE_BASE`, `ajustaRelieve` (el relieve a la resolución de cada cuadro), las formas `geoCapsula`, `geoBola`, `geoCaja`, `geoFigura`, `geoCorazon`, `geoAro`, `orienta` (gira una cápsula para que vaya de a a b) y `mancha` (la textura de la sombra de contacto).
  - `src/estilos/camara3d.ts`: `D` y `FOV`.
  - `src/estilos/gato/Plastilina.tsx`: `PASOS`, `FASE`, `MARGEN`, `DESENFOQUE`, `DESENFOQUE_SUELO`, `LLAVE`, `Camara`, `Tono`, `Entorno`, `Luces` y el armazón de `Plastilina` (`paso` y `tq`, `parpadeo`, el temblor, los tres lienzos y la viñeta).
  - `src/estilos/gato/PlastilinaGato.tsx`: `tiembla`, `Cap` y `Bola` (exportados), `Tira`, `anillo`, `diana`, `tramo`, `Ovoide`.
  - `src/estilos/gato/PlastilinaCocina.tsx`: `CAM_Y`, `Capa` (pone algo a la profundidad z sin que cambie de sitio en pantalla), `zSuelo`, `geoPlano`, `Caja`, `Palo`.
  - Recetas que viven en la taza y sirven para cualquier escena (`src/estilos/gato/PlastilinaTaza.tsx`): `geoTorno` (vasijas), `cafeMat` (líquidos), `algodon` y `Vapor3D` (humo de algodón), `salto` (algo que cae, bota y se queda de lado).
- **Lo del gato y la taza (se rehace):** `COL_GATO`, `PARPADO`, `PICARDIA`, `SONRISA`, `Ojo`, `Oreja`, `Bigotes`, `Cabeza`, `PataArcilla`, `matsGato`, `brillantesGato`, `GatoArcilla`; `COL_COCINA`, `Z_PARED`, `Pared`, `Suelo`, `Mesa`; `COL_TAZA`, `Taza3D`, `FORMAS`, `FIS`, `Trozos3D`, `MIGAS`, `Migas`, `geoCharco`, `Cafe3D`, `CapCafe`, `matsTaza`, `brillantesTaza`, `TazaArcilla`. Lo que pasa sale de `src/estilos/gato/escena.ts`.

## Pintar tu escena en este estilo
1. Copia `src/estilos/gato/Plastilina.tsx` a `src/estilos/<tu-escena>/Plastilina.tsx` y conserva la cámara, las luces, el tono, el entorno, los tres lienzos, `PASOS`, `FASE` y la viñeta. Cambia `T_SUELO` (en `FASE` y en el temblor) por el instante de tu golpe.
2. Tu decorado: copia `PlastilinaCocina.tsx` y rehaz `Pared`, `Suelo` y lo del plano nítido con `Caja` (un rectángulo de pantalla hecho caja redondeada), `Palo` y `geoBola`. Lo de detrás, dentro de `<Capa z={…}>`, que conserva su sitio en pantalla; lo que apoya en el suelo a una altura de pantalla y, en `zSuelo(y)`.
3. **Una figura nueva**, en px de pantalla con la y dada la vuelta (`[x, -y, z]`, z hacia la cámara; el plano z = 0 sale 1:1):
   - Un material por color con `arcilla` (se guardan por color y opciones: llamarla en cada cuadro no crea otro).
   - Volúmenes: ovoides con `geoBola(100, semilla)` escalada a `[rx/100, ry/100, rz/100]` (como `Ovoide`); brazos, patas, colas y cuellos con `Cap` (de `a` a `b`, radios `ra` y `rb`); bloques con `Caja` o `geoCaja(w, h, d, r)`; piezas planas con grosor con `geoFigura(pts, hondo, canto, clave)` (su contorno en px de pantalla); aros con `geoAro`; un casquete con `geoBola(r, semilla, amp, Math.PI / 2)`.
   - Marcas apretadas encima (rayas, costuras): `Tira`, una cadena de `Cap` finas, gordas en medio y sin sombra. Un ojo: una bola brillante y una bolita blanca con `emite`.
   - Cada pieza con su propia `semilla` (sus abolladuras y su trozo de textura) y su `amp` (cuánto se abolla; 0 = liso, como un bigote).
   - Debajo de lo que apoya, su sombra: un plano con `map={mancha()}`, color `#2a1206`, `transparent`, `depthWrite={false}`, `toneMapped={false}`, `renderOrder={2}` y un pelo por encima de la superficie (+0,6 a +0,8).
   - Lo que brilla, a tu lista `brillantes…()`, y esa lista a `Entorno`.
4. Anima «a dos»: todo lo que se mueve se calcula con `tq`, nunca con `t`, y cada pieza suelta lleva `tiembla(paso, i)` con su `i`. La cámara (temblor y zoom), con `t`.
5. Deja `ajustaRelieve(dpr)` en cada cuadro (ya va en el armazón) y saca el vídeo con `--gl=angle` (ya va en la configuración).

**Errores fáciles:**
- Animar algo con `t`: se mueve suave a 60 cuadros y rompe el stop motion. Y el mismo `i` en `tiembla` para todas las piezas: tiemblan juntas, como una sola.
- Repetir una `clave` de `geoFigura` con otro contorno: las formas se guardan por clave, `hondo` y `canto`, y te devuelve la primera. Y la misma `semilla` en todas las piezas las deja con las mismas abolladuras.
- Poner el fondo en el lienzo nítido sin `Capa`, o lo de delante en el lienzo de la pared: sale en otro sitio, o borroso. Si tu escena ocupa más, agranda la `caja` de `Luces`, o las sombras se cortan.
