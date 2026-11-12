# Motor · cómo se escribe un slide

Cada `slides/slide-NN.html` carga `motor/viegas.css`, `motor.js`, `piezas.js`, `slides.js` y `slides/carrusel.js`, y llama a `CARRUSEL.monta(N)`.
`carrusel.js` define una tabla `{ número: (lienzo) => montaje }`. Un montaje coloca los elementos, define `window.seek(t)` y registra el slide.

## motor.js (`M`)
| Función | Qué hace |
|---|---|
| `M.el(padre, tag, clase, texto, estilo)` | crea un elemento |
| `M.coloca(el, { x \| cx \| rx, base, fs, color })` | coloca una línea por su línea de base (izquierda, centro o derecha) |
| `M.encaja(el, maxW)` | reduce el cuerpo de letra hasta que quepa |
| `M.azar(semilla)` | números al azar con semilla (nunca `Math.random`) |
| `M.slide({ indice, duracion, golpes })` | registra la duración (4/6/8) y los golpes de sonido `{ t, tipo, que, ganancia }` |
| `M.listo(montar, fuentes)` | espera fuentes e imágenes, monta, dibuja el frame 0 y avisa al render |
| `M.seg`, `M.lerp`, `M.outC`, `M.inOutC`, `M.campana`, `M.muelle`… | curvas y tiempos puros en t |

## piezas.js (`V`)
| Función | Qué hace |
|---|---|
| `V.fondo(lienzo, 'noche' \| 'lavanda' \| 'violeta', semilla)` | fondo de marca con rejilla, viñeta y grano; devuelve los colores del tema |
| `V.cab(lienzo, colores, 'VIEGAS ESTUDIO', etiqueta)` · `V.pie(lienzo, colores)` | cabecera con el rayo y pie con el @ |
| `V.linea`, `V.gigante`, `V.bloque` | texto de una línea, palabra gigante ajustada y bloque de varias líneas |
| `V.partir(el, 'char' \| 'word')` | parte en letras o palabras (cada pieza sabe su línea: `_linea`) |
| `V.revela(piezas, t, { a, paso, dur, estilo, blur, y, clave })` | la entrada: `sube` · `enfoque` · `pista` · `ventana` · `lado` · `resorte` |
| `V.entrada(t, t0, dur, { x, y, blur })` | la misma entrada en números, para lo que se pinta en canvas |
| `V.escribe(el, texto, t, t0, letrasPorSegundo)` | escribe letra a letra con cursor |
| `V.brillo(el)` · `V.subrayado(lienzo, el, color)` | gestos sobre una palabra (crearlos antes de `V.partir`) |
| `V.ventana(lienzo, { x, y, w, h, titulo, tema })` | ventana estilo macOS; devuelve `{ el, body, C }` |
| `V.pildora(lienzo, texto, x, y, fondo, color, giro)` | píldora girada pintada en canvas (`.dibuja(V.entrada(…))`) |
| `V.escena(lienzo, { tema, dur, semilla, bokeh, fondo, frente, halos, focos })` | la profundidad de campo; `esc.dibuja(t)` en cada frame y `esc.alFrente()` al terminar de montar |

Recursos de escena (`fondo` y `frente`): `numero`, `rayo`, `clips`, `diamantes`, `ventana`, `cursor`, `onda`, `frames`, `punto`, con `{ x, y, blur, prof, a }`.

## interfaz.js (`UI`): el mundo de la edición, dibujado
| Función | Qué hace |
|---|---|
| `UI.icono(q, glifo, { x, y, size, grad })` | icono de app (squircle con degradado). Glifos: carrusel, subtitulos, miniatura, musica, guion, capas, color, timeline, camara, luz, play, skill, voz, corte, texto. Degradados: coral, violeta, azul, verde, rosa, ambar, grafito, noche, turquesa |
| `UI.iconoClaude(q, { x, y, size })` · `UI.chispa(size)` | el destello naranja que evoca a Claude (no es su logotipo) |
| `UI.foto(q, { x, y, w, h, src, pos:[x,y], zoom })` | foto recortada a su caja; tras `await UI.listas()`, `f.ajusta()` y `f.mapa` |
| `UI.reproductor(q, { x, y, w, h, src, pos, dur })` | reproductor con la foto; `.dibuja({ p })` pinta play, progreso y tiempo |
| `UI.timeline(q, { x, y, w, h, dur, pistas })` | pistas `video·texto·audio·musica·fx·color` con clips `{ a, b, txt, img, kf, duck }`; `.dibuja({ cab, resalta, ap(i,k), vol })` |
| `UI.visor(q, { ajustes, formato })` | interfaz de cámara; `.dibuja({ fr, rec, foco:[x,y,w,h], focoOk, rejilla, hist })` |
| `UI.histograma(img)` · `UI.cebra(q, foto, umbral)` | histograma de la foto y cebras sobre lo que pasa del umbral; `.dibuja({ off, a })` |
| `UI.ciclo(t, a, b, vuelta)` | 0 en reposo, sube de a a b y rebobina: para cabezales, códigos de tiempo y barras de progreso (el loop cierra) |

Un montaje con fotos es `async`: crea las fotos, `await UI.listas()` y después mide. Los ejemplos usan su propio `monta` que espera el montaje.

## slides.js (`S`): tipos de slide listos
- `S.regla(lienzo, n, { tema, numero, estilo, gesto, et, pill, palabra, def, cuerpo, mal:[…], bien:[…], fecho })`: paso con dos terminales ✗/✓.
- `S.lista(lienzo, n, { tema, num, nombre, sub, titulo, frases:[3], barra, demo(g, t, p), estilo, gesto }, paleta)`: pieza con ventana-demo y tres frases.
- `S.giro(lienzo, { indice, palabras, l1, l2, l3, grande, cuerpo:[2] })`: solo frase, en violeta.
- `S.cta(lienzo, { indice, kw, pre, items:[3] })`: la foto, «comenta PALABRA» y el entregable.
- `S.monta(tabla)`: lo que devuelve `CARRUSEL.monta`.

## Reglas del contrato
- `window.seek(t)` dibuja el frame de cualquier t sin depender del anterior.
- En reposo, los estilos vuelven a vacío: así el frame 0 es exactamente el PNG.
- Lo girado se pinta en canvas o SVG (un giro CSS animado se rasteriza distinto al volver al reposo).
