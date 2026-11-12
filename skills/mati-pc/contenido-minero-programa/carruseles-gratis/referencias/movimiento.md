# Movimiento · el lenguaje de la marca

Sale de las presentaciones de Viegas Academy (clases 1, 2 y 3): el texto no aparece, se enfoca. Natural antes que llamativo.

## Los tiempos
- 120 BPM: un tiempo cada 0,5 s, un compás cada 2 s. Slides de 4, 6 u 8 s (portada y llamada de 8 s; el resto, de 6 s).
- Cada golpe de sonido cae en un tiempo. Algo nuevo pasa cada 2 a 4 s. En los últimos 0,8 s, todo en reposo.
- **Salida (0,12 → 0,32 s):** el texto del slide sube un poco y se desenfoca (7 px) para volver a entrar. El frame 0 sigue siendo la portada.

## Las entradas (`V.revela`)
| Estilo | Qué hace | Para qué |
|---|---|---|
| `sube` | sube 20-60 px y pasa de desenfoque 12-22 px a nítido, curva (.16,1,.3,1) | lo normal: palabras, letras, frases |
| `enfoque` | escala 1,12 → 1 con desenfoque fuerte (blur fade) | cuerpos de texto línea a línea, palabras grandes que «aparecen» |
| `pista` | las letras llegan desde fuera hacia el centro (tracking) | nombres de una palabra, una vez por carrusel |
| `ventana` | sube 30 px, escala 0,965 → 1 y se enfoca | ventanas, tarjetas, filas |
| `lado` | entra desde la izquierda con desenfoque | barras de cierre, píldoras |
| `resorte` | sube girando con rebote (.34,1.56,.64,1) | **como mucho una vez por carrusel** y donde signifique algo |

Unidades: letras cada 40-70 ms · palabras cada 45-70 ms · líneas cada 160 ms.

## Los gestos (uno por slide, nunca dos seguidos iguales)
| Gesto | Qué hace | Sonido |
|---|---|---|
| `brillo` | una banda de luz cruza las letras de la palabra grande | brillo |
| `subrayado` | una línea de acento se dibuja bajo la palabra, se queda y se retira | barrido |
| `halo` | una luz suave crece detrás del elemento y se apaga | campana |
| `foco` | el fondo se desenfoca un poco más y vuelve: rack focus | barrido |
Las ondas de impacto y los sellos no se usan como recurso fijo: cansan.

## Ventanas y terminales
Estilo macOS: semáforo (#FF5F57, #FEBC2E, #28C840), título centrado, esquinas de 16 px, borde finísimo, sombra larga y suave.
Oscuras sobre noche, blancas sobre lavanda. Coreografía: entra la ventana (`ventana`, 1 s) → se escribe el comando (`V.escribe`, unas 34 letras por segundo, con cursor) → la salida aparece con `enfoque`. La ✓ entra un tiempo después que la ✗.

## Profundidad de campo (`V.escena`)
- Detrás: orbes de luz violeta y oro que flotan, bokeh, recursos del tema desenfocados (timeline, keyframes, cursor, números fantasma, ondas de audio).
- Delante: una o dos cosas muy desenfocadas en los bordes (el rayo, un bokeh grande), lejos del texto.
- Todo se desplaza con parallax según su distancia y vuelve a su sitio antes del final.

## Plantilla de tiempos para un slide de 6 s
| t | qué |
|---|---|
| 0,12-0,32 | salida |
| 0,5 | etiqueta o píldora (`lado`) |
| 0,6-1,6 | palabra grande, letra a letra |
| 1,5-2,0 | el gesto del slide |
| 1,0-2,2 | definición (palabras) y cuerpo (líneas) |
| 1,8-3,8 | prueba: ventanas, demo o filas |
| 4,3-5,2 | barra de cierre (`lado`) |
| 5,2-6,0 | reposo |
