# 18 · Cine mudo
**En una frase:** una comedia muda de época proyectada: la escena, pintada en grises, se entinta como un grabado y pasa a copia de cine vieja (grano de plata, rayas, polvo, parpadeo, la imagen que baila), con la acción a manivela, un rótulo art déco en cada golpe y el iris que se cierra al final.

## La piel (igual en cualquier escena)
- **La técnica (lo que lo hace todo): se pinta en grises y la película hace el resto.**
  - Se pinta en 2D con `gris(v)` (0–1 → gris) en tres lienzos de 1080 × 1920: `escena` (el fondo), `frente` (lo de delante: su silueta le dice al dibujo que va limpio, sin rayado y con contorno grueso; después se pega encima del fondo) y `capa` (lo que no se entinta: el objeto protagonista, el iris y el rótulo).
  - `proyector().proyecta(escena, frente, capa, dibujo, copia)` lo pasa por dos pasos en WebGL2. **El dibujo:** tinta en el lado oscuro de cada borde (la diferencia de dos desenfoques, σ 1,5 y 2,4), el gris en 5 aguadas (de 0,15 a 0,97) y, en las sombras, rayado a 45° (desde 0,7 de oscuridad), cruzado a −45° (0,8) y casi horizontal (0,9), cada 8,5 px, con pulso de mano y trazos cortados.
  - **La copia:** la capa mezclada dentro (así tiene el mismo grano y parpadeo), un pelo blanda, el halo de los blancos, la curva en S (contraste 1,45), negro 0,02 y blanco 0,95, densidad desigual, 5 rayas verticales (claras de emulsión rascada y oscuras de suciedad), bordes quemados, viñeta, grano en dos tamaños (2,6 y 5,5 px), sepia al 0,14 y la ventanilla con las esquinas redondas (46 px). Encima, en 2D, `polvo()`.
  - Por eso, para pintar cualquier escena basta con decir lo claro u oscuro que es cada cosa.
- **Colores** (casi todo es gris de pintura):
  - Lo de delante, claro: cara de maquillaje 0,88, manos 0,86, puños 0,8, camisa 0,62, pantalón 0,5, silla 0,48, zapatos 0,2, pelo 0,1.
  - El fondo, oscuro: papel pintado 0,36 (sus dibujos a 0,26), zócalo 0,28, la otra pared 0,24, tablones 0,38–0,43 con juntas a 0,14. Lo claro del fondo (el cielo de la ventana, 0,64–0,76) nunca llega a blanco.
  - Lo único blanco del todo: el objeto protagonista (1), con el contorno `#050404`.
  - La cara: tinta `#0b0908`, blanco de los ojos `#f4f1ea`, kohl `rgba(30,24,22,0.62)`, párpado a media asta `#7d7672`; la camisa `#e4e2dc` y la corbata `#121010`.
  - La copia: plata `(0.985, 0.99, 1)` y sepia de `(0.08, 0.055, 0.04)` a `(0.62, 0.52, 0.40)` y `(0.97, 0.93, 0.85)`. El rótulo: tarjeta `#070605`, letra y marco `#efe9dc`. El polvo: claro `rgba(240,234,220)`, oscuro `rgba(10,8,6)`.
- **La luz:** `LUZ`, arriba a la izquierda y por delante (`[-0.45, -0.72, 0.55]`); `luz(n)` = 0,56 + 0,5 · max(0, n · LUZ) − 0,08 · max(0, n[1]) (lo que mira abajo, más oscuro) da el gris de cada cara de una caja y de cada lado de un cilindro. Más el charco de una bombilla en la pared (blanco al 0,24) y en el suelo (0,16), los rincones que se apagan hasta 0,5–0,6 y el suelo que se oscurece hacia delante (0,55).
- **Letras:** Playfair Display Black (900), solo en el rótulo, cargada de `public/fuentes/PlayfairDisplay-Black.ttf` con `FontFace` como `FUENTE_ROTULO` (de repuesto, Georgia). En MAYÚSCULAS y con sus signos («¡…!», «¿…?»).
- **El trazo y el material:** la pintura es tonal, sin líneas tuyas (las pone el dibujo): `caja` pinta cada cara visible con su gris y un filo al 0,5 del tono (2,4 px), `cilindro` lleva un degradado que sigue a la luz, `esfera` y `sombra` (un óvalo blando en el suelo). Lo de delante sale con un contorno grueso alrededor de su silueta (`bordeF`, 4 px a cada lado). El objeto protagonista, como `bolaPapel`: blanco con degradado a 0,9, contorno negro por fuera de `max(7, r · 0,3)` px y halo blanco al 0,5 hasta 2,1 radios.
- **El fondo y el escenario:** un interior de época, oscuro y liso: papel pintado art déco apenas marcado (rayas dobles cada 128 px y abanicos de 18 px al tresbolillo), zócalo de madera con moldura y plafones, la otra pared en sombra, suelo de tablones en perspectiva con su veta, una ventana con tejados y chimeneas y una lámpara que cuelga con su cono de luz.
- **Los rótulos y adornos fijos:**
  - El rótulo, en la capa, centrado en (540, 206) (ocupa de y 108 a 304): tarjeta negra de `max(430, ancho + 156)` × 196 con su sombra corrida 10/12, una raya de 3 px a 10 por dentro, otra de 5 px con las esquinas en escalón (`escalon`) a 24, un rombo de 8 px en cada esquina, un abanico de 24 px arriba y otro abajo, cada uno con una raya a cada lado, y la letra a 78 px (si pasa de 690 px de ancho, se encoge).
  - El iris abierto (`irisAbierto`: centro 540, 1010; 720 × 1120; borde blando 0,24) solo oscurece las esquinas.
  - El polvo de cada cuadro (de 3 a 12 motas por la fuerza, un 40 % claras), un pelo en la ventanilla (unos 10 cuadros, el 30 % de las veces) y, rara vez, una mancha clara de un cuadro.
- **El movimiento:** dos relojes.
  - La acción, a 18 posturas por segundo (`FPS_ACCION`) y un 12 % acelerada (`ACELERA`, 1,12), con una postura justo en el primer toque (`tiempoAccion`): a saltos, a manivela.
  - La película, a 24 cuadros (`FPS_PELICULA`): el grano, las rayas, el polvo, el parpadeo (`parpadeoEn`, ±6 % y dos ondas) y el baile de la imagen en la ventanilla (`bailaEn`, unos px, con un salto de perforación de `7 × fuerza` px de vez en cuando). El rayado se redibuja cada 2 posturas (`paso: Math.floor(k / 2)`): hierve, como dibujado a mano.
  - Lo que va rápido deja dos fantasmas del obturador (al 0,32 y al 0,16); la lámpara que se balancea, dos copias (0,22 y 0,11).
- **El momento:**
  - En el primer toque, la acción se congela 2 posturas (`PARADA`, 1/9 s) con el objeto aplastado (0,55) contra lo que toca; la imagen salta 46 px (se ve la raya negra entre fotogramas) con un destello (×1,62 de exposición), y al cuadro siguiente −10 px y ×1,1. Los otros golpes fuertes (fuerza > 1700): 16 px y ×1,18.
  - Después, el sobresalto de comedia: el personaje da un bote de 34 px en la silla y echa la cabeza atrás (0,22) en 0,32 s. Si lo que se golpea cuelga, arranca ya en la pausa, se balancea un 60 % más y la bombilla parpadea como en un cortocircuito.
  - El rótulo entra de un corte justo después (0,06–0,1 s), con un pelo de rebote (de 0,9 a 1 con `E.outBack` en 3 cuadros), la letra tiembla ±2,5 px en cada cuadro y se queda 0,55–0,75 s.
  - Al final, el iris se cierra un 85 % (desde 1,46 s y en 0,28 s, `IRIS_CIERRA` e `IRIS_DURA`) sobre la cara del personaje y donde quedó el objeto (`irisFin`).

## Dónde está en el código
- **Piel (se reutiliza tal cual):**
  - `src/estilos/bola/cinemudo/pelicula.ts` entero: `Proyector` y `proyector()` (los dos pasos, con `OpcionesDibujo` y `OpcionesCopia`), `azar`, `bailaEn`, `parpadeoEn` y `polvo`.
  - `src/estilos/bola/cinemudo/rotulo.ts` entero: `FUENTE_ROTULO`, `Iris`, `irisAbierto`, `mezclaIris`, `pintaIris`, `Rotulo` y `pintaRotulo` (con `escalon` y `abanico`).
  - `src/estilos/bola/cinemudo/geometria.ts` entero: `gris`, `LUZ`, `luz`, `seVe`, `caja`, `cilindro`, `esfera`, `sombra`, `camino`, `poli`, `envolvente`, las cuentas (`sum`, `res`, `esc`, `pto`, `cruz`, `lar`, `nor`) y los giros (`mm`, `ap`, `rx`, `ry`, `rz`, `vuelta`, `Marco`, `enMarco`, `ejeMarco`).
  - `src/estilos/bola/cinemudo/CineMudo.tsx`: `FPS_ACCION`, `ACELERA`, `FPS_PELICULA`, `PARADA`, `IRIS_CIERRA`, `IRIS_DURA`, `tiempoAccion`, `aTarjeta`, `cargaFuente`, `lienzos` y el orden de `dibuja` (pintura → capa con objeto, iris y rótulo → salto y destello → `proyecta` → `polvo`).
  - `src/estilos/bola/cinemudo/pintura.ts`: `bolaPapel` (el objeto protagonista; con `limpia = false`, uno viejo en gris y sin halo) y los tres lienzos de `pintaEscena`. `src/estilos/bola/cinemudo/muneco.ts`: `lienzoCara` (la cara de cine mudo: kohl, ojos grandes con lápiz, cejas gruesas y nueve gestos) e `imagenEn` (pega una textura en un cuadrilátero; no se exporta).
  - Ayudas: `E`, `clamp`, `mix` y `rng` de `src/comun/curvas.ts`.
- **Lo de la bola y el muñeco (se rehace):** en `CineMudo.tsx`, `ROTULOS`, `PATADA_LAMPARA`, `anguloLampara`, `irisFin`, el sobresalto, la bombilla y los fantasmas; en `muneco.ts`, `marcos`, `sillaPiezas`, `munecoPiezas`, `lienzoCamisa`, `T`, `sombraSilla` y `sombraMuneco`; todo `decorado.ts` (`pared`, `paredDerecha`, `suelo`, `mesa`, `lampara`, `posBombilla`, `conoDeLuz`, `conPapelera`, `sombraPapelera`, `papeleraFondo`, `papeleraFrente`); `sombraBola` y lo de dentro de `pintaEscena`; y lo de `src/estilos/bola/escena.ts` (`lanzamiento`, `bola`, `_trayecto`, `temblor`, `esqueleto`, `T_PRIMERO`, `PLANES`, `LAMPARA`, `DUR` y la cámara: `CAMARA`, `proyecta`, `escalaEn`).

## Pintar tu escena en este estilo
1. Copia la carpeta `src/estilos/bola/cinemudo/` a `src/estilos/<tu-escena>/cinemudo/` y pon tu `escena.ts` en `src/estilos/<tu-escena>/`. Deja enteros `pelicula.ts`, `rotulo.ts` y `geometria.ts` (este importa `CAMARA` y `proyecta` de `../escena`: cópialos de la bola a tu escena). Comprueba que está `public/fuentes/PlayfairDisplay-Black.ttf`.
2. Tu fondo, en `escena`, con `gris()`: oscuro y liso (0,2–0,45), con su luz (`caja`, `cilindro`, `sombra` y un charco claro). Lo que actúa (personas, máquinas, lo que está cerca), claro (0,5–0,9) y en `frente`. Tu objeto protagonista, en la capa como `bolaPapel`: blanco, con su contorno negro grueso y su halo.
3. Tu personaje: piezas (`caja`, `cilindro`) en una lista con su z, que se pintan de atrás adelante como en `munecoPiezas`, y su cara con `lienzoCara(gesto, ojoX, ojoY)` pegada con `imagenEn`.
4. Tu tiempo: pon el segundo de tu momento donde está `T_PRIMERO[i]` (en `tiempoAccion` y en `aTarjeta`); la acción sale de `tq` y la película de `cuadro`. Deja la pausa, el salto de 46 px y el destello en tu primer toque.
5. Tus rótulos: `ROTULOS` lleva uno por lanzamiento (`{texto, desde, hasta}`, en segundos del `t` que recibe el componente) y `dibuja` toma `ROTULOS[i]`. Para tu escena, uno por momento: `{texto: '¡NUEVA VENTA!', desde: momento + 0.08, hasta: momento + 0.75}`. En mayúsculas, con «¡!» y corto: hasta unas 14 letras salen a 78 px; más largo, se encoge. Si hay varios momentos, que no se pisen.
6. Tu final: cambia en `irisFin` los dos puntos que abraza (la cara de tu personaje y dónde queda tu objeto). Y no pongas nada importante arriba (y 108–304) mientras se ve el rótulo, ni en las esquinas, que se come el iris.

**Errores fáciles:**
- Pintar en colores: el dibujo solo mira la luminancia (0,30 · R + 0,59 · G + 0,11 · B), así que un rojo y un verde parecidos se funden. Pinta con `gris()` y separa cada cosa de lo que tiene detrás por lo claro u oscuro.
- Tu protagonista en el fondo: le cae rayado y se pierde. El fondo en `frente`: se queda sin rayado y sin profundidad. Algo más del cuadro en blanco (un papel, un cielo por encima de 0,8): le roba la vista al objeto.
- Usar `t` para la acción o un azar sin `cuadro`: sale fluido y se pierde la manivela. Nunca `Math.random()`: `azar(cuadro * k)`.
- Sin WebGL2 no sale («este navegador no tiene WebGL2»): va con `--gl=angle`, que ya está en `remotion.config.ts`. Y los lienzos y el `Proyector` miden 1080 × 1920 fijo: si cambias el tamaño, cámbialo en `lienzos`, `proyector`, los `clearRect` y `polvo`.
