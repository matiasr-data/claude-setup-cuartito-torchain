# Sonido y efectos (SFX)

## La mayoría de los cortes van mudos
Si cada corte lleva un golpe, el golpe deja de marcar nada. El silencio es lo que da valor al sonido siguiente.

[MEDIDO] En la referencia viral analizada solo el 19 % de los cortes llevaba un golpe encima; casi todos los golpes caían en cambios de capítulo.

Pon SFX solo en transiciones que significan algo y en apariciones de gráficos, salvo que el creador pida más.

## El golpe entra después de la palabra
El golpe de un cambio de capítulo entra 0,4-1,2 s **después** de nombrar el capítulo, sobre la entrada de la cortinilla. El sonido no subraya la palabra, subraya el cambio visual que la palabra anuncia. Encima de la palabra pisa la voz y se pierden las dos cosas. ([MEDIDO] 86 % de las transiciones de capítulo de la referencia lo hacían así.)

En apariciones de gráficos, el SFX se adelanta unas centésimas (~0,06 s) a la imagen para que se perciban juntos.

## El sonido se elige por el tipo de gráfico
Cada tipo de gráfico tiene su sonido en el mapa de sonidos del perfil (contador → dígitos, lista → pop por ítem, tachado → error, cortinilla → golpe…). Así el sonido se convierte en lenguaje: el espectador aprende qué significa cada uno. No elijas por gusto en cada momento.

## El nivel lo decide la función
- **SFX de gráficos y transiciones normales**: claramente por debajo de la voz, que se escuchen levemente.
- **Golpe de cambio de capítulo**: puede subir hasta el nivel de la voz, porque ahí el golpe *es* la información.
- Si el creador pide otra cosa, manda el creador.

## Cada capa de audio tiene que ser legible por separado
Prueba de calidad: escucha los SFX solos, la música sola y la voz sola. Si los SFX solos no cuentan la escena, son adorno; si la música sola no tiene forma, es relleno.

## La voz
- **Mide el ruido por bandas antes de filtrar.** Nunca apliques un "mejorador de voz" genérico: suena a IA de podcast. Si todo el ruido es retumbe grave, un corte de graves (~75 Hz, pendiente fuerte) lo resuelve sin tocar la voz; un reductor espectral solo si el margen señal/ruido en la zona de la voz (1-8 kHz) es bajo, porque mete artefactos.
- Compresión suave y normalización a **−14 LUFS / −1 dBTP** (estándar de YouTube) en dos pasadas, con limitador final.
- Micro-fundidos de unos milisegundos en cada corte de voz para que no haya chasquidos.
- Si has tocado la voz, entrega un A/B al mismo volumen para que el creador compare.
- Si la normalización no llega al objetivo, revisa la fuente (saturación, ruido) antes de forzarla.
