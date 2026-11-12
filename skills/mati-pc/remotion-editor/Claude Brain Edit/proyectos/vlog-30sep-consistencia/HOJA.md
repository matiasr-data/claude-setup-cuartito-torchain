# Hoja de edición: vlog-30sep-consistencia

> **Punto de control.** Nada de esto está aplicado en la entrega todavía. Corrige aquí o en el chat y lo ejecuto. Para ver el corte propuesto: `trabajo/previa_corte.mp4` (540p, solo corte + voz, sin gráficos).
> Los tiempos (TC) son del **montaje propuesto**, no del bruto. [MEDIDO] = sale de un script; [MIRADO] = sale de ver fotogramas.

## Resumen
- **Formato y mood:** `vlog` — tramo de reflexión a cámara en plano fijo («seguimos con el vlog»). Mood sincero y cansado que sube a motivador en «consistencia» y «visión a un año».
- **Duración:** bruto 7:12 → montaje **6:18** [MEDIDO] (se quitan 53 s).
- **Lo más potente del bruto:** la confesión («hoy he dormido como el culo y estoy destrozado… y esto no lo comparte nadie en redes») y su giro («ha sido el día más productivo de las últimas 2-3 semanas» → «lo importante no es no tener esos días, es hacer lo que tienes que hacer pese a tenerlos»).
- **Aviso del formato:** la skill rinde mejor en vídeo educativo a cámara; en vlog el criterio depende más de la imagen, así que conviene que revises más de cerca. Además el bruto es un único plano fijo sin b-roll: la variedad sale de reencuadres (el 4K lo permite) y de gráficos, no de cortes que no existen.

## Referencias aplicadas
- Ninguna activa. Se aplican las reglas base + valores de partida del formato `vlog` + el perfil (borrador).

## Cortes del bruto
10 cortes, 11 tramos. Detalle en `trabajo/cortes.json`. El transcript de lo conservado se lee como discurso continuo [MEDIDO: re-transcrito tras el corte → `TRANSCRIPT.md`].

| # | Bruto | Qué se quita | Por qué |
|---|---|---|---|
| 1 | 0:00–0:23 | Preparación, falsa toma («Ok, estamos ahora mismo… esto lo voy a quitar») y 6,8 s de silencio | Última toma buena |
| 2 | 1:09–1:10 | 1,2 s de titubeo entre «que parece que» y «tienes tortícolis» | Tropezón |
| 3 | 1:16–1:22 | «o sea, tenía ganas de, literalmente, irme, o sea…» (5,3 s) | Frase repetida tres veces; queda la buena |
| 4 | 1:47–1:48 | Arranque fallido «Y que, joder,» | Falso arranque |
| 5 | 2:14 | Pausa de 1,2 s → 0,4 s | Aire muerto |
| 6 | 3:58 | Pausa de 1,25 s → 0,4 s | Aire muerto |
| 7 | 5:38–5:40 | «desde hace un año, en septiembre del año pasado» (2,5 s) | Titubeo; queda «a 30 de septiembre del año pasado» |
| 8 | 6:19–6:22 | Primera despedida («Así que nada, seguimos con el vlog, espero que te esté gustando») | Se repite al final; queda la última |
| 9 | 6:35 y 6:39 | Dos pausas mirando el móvil (1,8 s y 1,6 s) → 0,4 s | Aire muerto |
| 10 | 6:45–6:54 y cola | 9 s tecleando y murmurando («aquí son muy majos») + 4 s tras el «Chao» | No se entiende; cola muerta |

**Lo que NO he cortado a propósito:** las muletillas («o sea», «tío», «literalmente»), las pausas de menos de 1,2 s y dos autocorrecciones en frase seguida («tenemos ahora mismo, cuando grabo esto…», «en un departamento, bueno, una persona de recursos humanos»). Cortarlas obligaría a tijera en mitad de sílaba y el tono es de vlog, no de anuncio.

## Voz [MEDIDO]
- Bruto: −28,2 LUFS, pico real −2,3 dBTP, sin saturación (0 muestras recortadas). Doble mono.
- Ruido: plano en todas las bandas (suelo ≈ −55 dBFS). Margen voz/ruido: 33 dB en 300–1000 Hz, 23 dB en 1–4 kHz, 11 dB en 4–8 kHz. Por debajo de 75 Hz no hay voz (margen 2 dB).
- Cadena aplicada en la previa: corte de graves a 75 Hz → reducción espectral suave (10 dB; la justifica el margen bajo en 4–8 kHz) → compresión 3:1 → ganancia fija + limitador. Sin control automático de volumen (lo probé y bombeaba el ruido en las pausas).
- Resultado: **−14,1 LUFS / −1,3 dBTP**. Margen voz/ruido tras el proceso: 27,1 dB frente a 25,4 dB sin limpiar al mismo volumen. La mejora es pequeña (1,7 dB): la compresión se come casi todo lo que gana la reducción de ruido. El soplido de fondo seguirá ahí en las pausas; la música al 20 % lo tapa.
- **A/B al mismo volumen:** `trabajo/audio/voz_final.wav` frente a `trabajo/audio/voz_sin_limpiar_mismo_volumen.wav`. No los he podido escuchar: compáralos tú, sobre todo las «s» (si suenan a agua, bajo la reducción).

## Línea de tiempo
G = gráfico (Remotion, ProRes 4444 con alfa) · S = subtítulo de énfasis palabra a palabra. Los colores y fuentes salen de la opción de estilo que elijas.

| TC | Bloque | Lo que se dice | Plano | Gráfico (tipo + texto exacto) | Overlay / completa | Zoom / transición | SFX | Música | Por qué |
|---|---|---|---|---|---|---|---|---|---|
| 0:00 | Situación | «son ahora mismo las 8 y 20, estamos a miércoles 30 de septiembre» | cara 100 % | **G01** sello fecha/hora: `MIÉ 30 SEP · 20:20` | overlay, esquina sup. izq. | acercamiento lento 100→106 % | aparición de texto | arranca suave | Una fecha dispara calendario; sitúa el día del vlog |
| 0:07 | Situación | «en apenas 4 o 5 horas directo con un cliente» | cara | **G02** cuenta atrás: `Directo con cliente · en 4–5 h` | overlay izq. | — | contador | — | Un plazo dispara cuenta atrás; abre el bucle del lanzamiento |
| 0:13 | Situación | «lanzamiento de 3 directos, lunes, martes, miércoles, vamos por el tercero» | cara | **G03** lista en cascada: `Lunes ✓ · Martes ✓ · Miércoles ← hoy` | overlay izq. | — | pop por ítem | — | Enumeración → lista; muestra progreso (2 de 3) |
| 0:28 | Confesión | «esto no lo comparte nadie en redes sociales» | cara | **S1** `esto no lo comparte nadie` (realce: *nadie*) | subtítulo | corte seco a 112 % | — | baja un punto | Remate: es la promesa del tramo |
| 0:38 | Confesión | «hoy he dormido como el culo y estoy destrozado» | cara 125 % | **S2** `hoy he dormido como el culo y estoy destrozado` (realce: *destrozado*) | subtítulo | punch a 125 % en «destrozado» | — | — | La frase más humana del bruto; primer plano para la confesión |
| 0:45–1:12 | El bajón | tortícolis, ganas de irse a dormir, media hora tumbado | cara, alterna 100/112 % | — | — | reencuadre en cada cambio de idea | — | — | Tramo de historia: manda la cara, sin gráficos |
| 1:12 | Giro | «una empresa de 50, 60… cerca de los 70 comerciales» | cara | **G04** contador `50 → 60 → 70 comerciales` | overlay izq. | — | contador | — | Cifra → contador; da escala a «no puede ser» |
| 1:25 | Giro | «el día más productivo que he tenido en las últimas 2-3 semanas» | cara 112 % | **S3** `el día más productivo` (realce: *más productivo*) | subtítulo | corte seco | — | sube | Remate del giro: contradice la confesión |
| 1:32 | Cómo | «el dashboard… centraliza todas las tareas de toda la agencia» | **pantalla** | **G05** ventana de captura del dashboard con cursor (ver «Elementos a preparar») | completa (ventana al 88 %) | entra con el corte | clic | — | Herramienta → captura. Primer cambio de tipo de plano en 1:30 |
| 1:58 | Excusas | «mil excusas: estoy cansado, tendré mala cara, me ha salido un grano» | cara | **G06** lista que se tacha: `Estoy cansado · Tendré mala cara · Me ha salido un grano` → se tachan en «Da igual, lo he hecho» (2:05) | overlay izq. | — | pop por ítem + tachado | — | Enumeración + error → lista tachada (color semántico) |
| 2:23 | **Tesis** | «lo importante no es no tener esos días, es hacer lo que tienes que hacer pese a tener esos días» | **gráfico** | **G07** antes/después: `No tener días malos` (tachado) → `Hacer lo que toca pese a ellos` | completa | corte seco | tachado | corte en seco antes de la frase | La idea es el contenido → la cara estorba. Es la frase a recordar |
| 2:44 | Tesis | «y es la consistencia» | **gráfico** | **G08** palabra: `la consistencia` (toque premium) | completa, 2 s | corte seco | golpe suave | vuelve con más energía | Palabra clave del vídeo; única vez con la fuente premium en este minuto |
| 2:46 | Tesis | «un mes a tope… dos, tres meses… dos, tres, cuatro, cinco años» | cara 100 % | **G09** línea de tiempo: `1 mes → 3 meses → 5 años` (se van apagando los dos primeros) | overlay inferior | acercamiento lento | — | — | Comparación de plazos → escala visual |
| 3:22 | Estado | «tenemos ocho clientes activos» | cara | **G10** cifra `8 clientes activos` | overlay izq. | — | contador | — | Cifra → contador |
| 3:38 | Estado | «si pasas de tener tres clientes a tener diez» | cara | **G11** `3 → 10 clientes` | overlay izq. | — | — | — | Cifra; un solo realce (el 10) |
| 3:50 | Estado | «es una cuestión de delegar bien» | cara 112 % | **S4** `delegar bien` | subtítulo | corte seco | — | — | Remate del bloque |
| 3:56 | Equipo | «doy gracias a Pablo» | cara | **G12** rótulo: `Pablo · parte creativa` | overlay inferior izq. | — | — | — | Nombre de persona → rótulo (confirmar cargo) |
| 4:03 | Equipo | «la parte más metodológica, de procesos, de organización» | cara | **G13** lista en cascada: `Método · Procesos · Organización` | overlay izq. | — | pop por ítem | — | Enumeración → lista |
| 4:29 | Equipo | «mi tarea de mayor retorno» | cara 112 % | **S5** `mi tarea de mayor retorno` | subtítulo | corte seco | — | — | Remate |
| 5:03 | Visión | «mirar a un año vista… a 30 de septiembre del año pasado… hace dos, hace tres… de aquí a un año» | **gráfico** → cara | **G14** calendario: `30 SEP 2025 → 30 SEP 2026 → 30 SEP 2027` (el foco viaja de fecha en fecha) | completa 5 s, luego overlay inferior | corte seco | contador | sube | Fechas → calendario; cambio visual tras 30 s de cara |
| 5:29 | Visión | «hace un año esta empresa no existía. Existía el conocimiento, pero no la empresa» | cara 125 % | **S6** `hace un año esta empresa no existía` (realce: *no existía*) | subtítulo | punch a 125 % | — | corte en seco antes | Remate final del argumento |
| 5:43 | Visión | «ve a YouTube y lo ves» | cara | **G15** logo de YouTube (real, PNG) | overlay pequeño | — | — | — | Marca → logo real. Opcional |
| 5:57 | Humano | el poke: «25 minutos le quedan» | cara (mira el móvil) | **G16** notificación de reparto: `Tu pedido · 25 min` | overlay sup. der. | cortes secos rápidos | pop | baja | Cifra + gag; respiro tras 5 min de discurso |
| 6:04 | Cierre | «día de quedarnos hasta tarde… seguimos con el vlog. Chao» | cara 100 % | — | — | acercamiento lento | — | sube y enlaza con el siguiente tramo | Cierre limpio; sin pantalla final porque el vlog sigue |

**Recuento:** 16 gráficos + 6 subtítulos en 378 s → un evento visual cada ~17 s (el formato pide 15–30 s). Tres tramos a pantalla completa (G05, G07+G08, G14) para romper el plano fijo. Ningún tramo de más de 35 s sin cambio visual.

**Reencuadres:** además de los de la tabla, en los dos tramos largos sin corte (1:43–3:26 y 3:26–5:05) un reencuadre 100 ↔ 112 % cada 15–25 s, siempre en cambio de idea. Acercamientos lentos (≈6 % en todo el plano), ningún empujón brusco salvo los dos punch de S2 y S6.

## Subtítulos de énfasis propuestos
- 0:28 — «esto no lo comparte nadie» — la promesa del tramo
- 0:38 — «hoy he dormido como el culo y estoy destrozado» — la confesión
- 1:25 — «el día más productivo» — el giro
- 3:50 — «delegar bien» — remate del bloque de clientes
- 4:29 — «mi tarea de mayor retorno» — remate del bloque de equipo
- 5:29 — «hace un año esta empresa no existía» — remate final

El resto va limpio. Se entrega además `subtitulos.srt` completo para YouTube.

## Música
| TC | Bloque | Género / búsqueda | BPM aprox. | Volumen | Movimiento |
|---|---|---|---|---|---|
| 0:00 | Situación + confesión | lo-fi / ambient cálido, sin voces («chill reflective vlog», «warm lofi instrumental») | 70–85 | 15–20 % | arranca suave |
| 1:12 | Giro | misma pista, entra el ritmo | 85–95 | 20 % | sube en «el día más productivo» |
| 2:20 | Tesis | — | — | 0 % | **corte en seco** 1 s antes de «lo importante no es no tener esos días» |
| 2:44 | Consistencia | motivacional contenida («uplifting minimal piano», «inspiring build») | 95–110 | 20 % | entra en «consistencia» |
| 5:03 | Visión | misma pista, clímax | — | 20–25 % | sube |
| 5:55 | Poke + cierre | vuelve la pista inicial | 70–85 | 20 % | baja; enlaza con el siguiente tramo |

Toda con licencia (YouTube detecta la música). Nunca títulos concretos.

## Elementos a preparar
- **Captura del dashboard de tareas** (G05). Si no se puede enseñar, dibujo una interfaz genérica de tablero de tareas.
- **Logo de YouTube** en PNG transparente (G15) → `recursos/`. Si no, quito G15.
- **Efectos de sonido** en `recursos/sfx/` (la carpeta está vacía).
- **Fuentes / logo** propios si no eliges una de las opciones A/B/C.

## B-roll a grabar (si hace falta)
No imprescindible. Ganaría mucho con 3–4 planos de 3 s: la pantalla con el dashboard, el café, el equipo trabajando, la llegada del poke.

## Capítulos y pantalla final
No aplica: es un tramo dentro de un vlog más largo (sin pantalla final ni capítulos propios). Si se publica suelto, lo añado.

## Conflictos resueltos
- Formato `vlog` (corte cada 1–3 s) vs. bruto en plano fijo sin b-roll → gana la regla base «la variedad sale del cambio de tipo de plano, no de la tijera»: reencuadres cada 15–25 s y tres gráficos a pantalla completa en vez de cortes rápidos.
- Limpieza de muletillas (regla base) vs. tono de vlog → se conservan las muletillas que no tropiezan.
- «Hueco sin voz en vlog es material» vs. 9 s tecleando en el móvil → se quita: no hay imagen que lo sostenga [MIRADO].

## Preguntas para el creador
1. **Estilo:** ¿A, B o C (`branding/opciones/`), o me pasas tu marca?
2. **Arranque:** ¿orden natural (fecha y hora) o empiezo en frío con «esto no lo comparte nadie en redes… hoy he dormido como el culo y estoy destrozado» y luego la fecha?
3. **El poke (5:55–6:04):** ¿se queda recortado como momento humano (lo que propongo) o fuera?
4. **Frases que no oigo claras** (salen en pantalla y en el `.srt`): «con don Aitor» · «ocho clientes activos, ¿uno o dos? más por confirmar» · «doy gracias a Pablo… se le da extremadamente mejor que a mí» · «que lo queremos a Aitor nosotros».
5. **Rótulo de Pablo:** ¿nombre y cargo exactos, o lo quito?
6. **Sonidos:** ¿tu pack en `recursos/sfx/` o genero 5 neutros (pop, contador, tachado, clic, golpe suave)?
7. **Resolución de entrega:** 1080p (recomendado, permite los reencuadres) o 4K.
8. **Nombre del canal** y, si existe, título y miniatura del vlog.
