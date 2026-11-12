# Pipeline de edición de reels con IA — cómo se consiguió el resultado

**Para:** quien quiera entender el método a fondo, y para agentes de IA (Claude Code, Antigravity…)
**Caso real:** «Reel - edición automática con Claude Code - toma 9» (19-10-2026)
**Resultado:** reel vertical 4K (2160×3840, 30 fps, 38,3 s) con cortes, recorte del sujeto, subtítulos sincronizados, motion graphics en cristal líquido, escena a pantalla completa, efectos de sonido, música con ducking y máster a −14 LUFS.

Este documento explica **qué se hizo, en qué orden, con qué parámetros y por qué**. El objetivo es que un agente autónomo pueda reproducir la misma calidad. Los scripts reales están en la carpeta `pipeline/`, junto a este archivo.

---

## 0. Por qué esta vez salió bien (los principios)

Un editor autónomo suele fallar por intentar «editar el vídeo» de una vez. Aquí funcionó por estas reglas:

1. **Todo es código y todo es determinista.** ffmpeg y Python para vídeo y audio; HTML/CSS/GSAP renderizado fotograma a fotograma (HyperFrames) para los gráficos. El mismo input produce siempre el mismo fotograma. Nada se hace «a ojo».
2. **Pasadas separadas, con un archivo de salida en cada una.** Transcribir → cortar → recortar al sujeto → subtítulos → gráficos → sonido. Cada pasada lee los archivos de la anterior (`words.json`, `matte-4k30.mp4`, `captions.json`…). Cambiar una pasada no rompe las demás.
3. **Un único reloj: `words.json`.** Cortes, subtítulos, gráficos y efectos se sincronizan con las palabras y sus tiempos. Un gráfico se dispara «en su palabra», no en un segundo inventado.
4. **Medir en vez de suponer.** ffprobe para el formato, `silencedetect` y RMS por ventanas de 50 ms para los cortes, `ebur128` para el volumen, capturas de fotogramas concretos para revisar el diseño. Cada decisión tiene un número detrás.
5. **Revisión visual antes de cada render largo.** Se sacan 5–9 fotogramas en los momentos críticos, se montan en una hoja de contactos y se revisan: caras tapadas, textos cortados, zonas seguras, solapes. Solo después se renderiza en 4K.
6. **Un humano aprueba en puntos fijos.** Tras cada pasada hay una vista previa y se espera el «siguiente». Las notas del humano se convierten en **reglas** que se aplican al resto del vídeo (ver § 10).
7. **Contenido real, no inventado.** Logos oficiales en SVG, capturas reales (de la guía, hechas con Chrome sin interfaz), iconos reales de Premiere, After Effects y CapCut. Los gráficos genéricos delatan a la IA.
8. **Una guía de estilo con valores medibles.** Colores en HEX, tamaños en px, tiempos en segundos y dB. Nada de «que quede bonito».

---

## 1. Entorno y herramientas

| Pieza | Versión / detalle | Para qué |
|---|---|---|
| GPU | NVIDIA RTX 5090 (32 GB) | Whisper, recorte RVM y codificación NVENC |
| ffmpeg | 8.0.1 (con `h264_nvenc`, `hevc_nvenc`) | Todo el vídeo y el audio |
| Python 3.11 | torch 2.7.1+cu128, openai-whisper 20250625 | Transcripción y recorte en GPU |
| Python 3.14 | numpy, Pillow | Mezcla de audio, composiciones de prueba |
| HyperFrames CLI | 0.8.174 (`npx hyperframes`) | Render de gráficos HTML/GSAP fotograma a fotograma, en 4K y con transparencia |
| RobustVideoMatting | `rvm_resnet50_fp32.torchscript` (release v1.0.0) | Recorte del sujeto en vídeo |
| Chrome + puppeteer-core | Chrome estable | Capturas reales y render offline de la música |
| Efectos de sonido | En el reel original, la biblioteca de la skill media-use de HyperFrames. En esta skill, SynthFlow (`scripts/synthflow_render.cjs sfx`) | Golpe, whoosh, riser, clic, glitch, braaam |
| SynthFlow Studio | `procedural_audio_sfx_studio.html` (copia corregida) | Música de fondo por síntesis (Web Audio) |

**Lección:** el removedor de fondo genérico de HyperFrames solo funcionaba en CPU con un modelo de 320 px (u2net). A 4K deja bordes temblorosos. Para vídeo hay que usar un modelo **temporal** (RVM) en GPU.

---

## 2. Entrada: inspeccionar antes de editar

```bash
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of default=nw=1 toma.mp4
```

- La toma era **3840×2160 HEVC 60 fps, 56,8 s**, pero estaba **grabada de lado**. El JSON de la app de grabación (`*-linea.json`) decía `"giro": 90`.
- Se rota sin pérdida: `transpose=1` (90° en sentido horario) da **2160×3840 nativo**. No hay que recortar ni escalar. Siempre hay que leer los metadatos de la grabación antes de reencuadrar.
- **Otro proceso (la app de Viegas) renombraba los archivos de la toma mientras trabajábamos.** Solución: copiar la fuente a una carpeta de trabajo propia antes de nada (`work/source-camara.mp4`) y no volver a tocar la carpeta original hasta la entrega.
- Se trabaja a **30 fps** (la toma es de 60): reels estándar y la mitad de tiempo de render en 4K.

```bash
ffmpeg -hwaccel cuda -i source.mp4 -vf "transpose=1,fps=30" -c:v h264_nvenc -preset p6 -tune hq -rc vbr -cq 17 -b:v 0 -an vertical-4k30.mp4
ffmpeg -i source.mp4 -vn -ac 1 -ar 16000 audio16k.wav     # para Whisper
ffmpeg -i source.mp4 -vn -c:a pcm_s24le -ar 48000 audio48k.wav   # para la mezcla final
```

---

## 3. Pasada 1 · Transcribir y cortar (`transcribe.py`, `analyze.py`, `cut.py`)

### 3.1 Transcripción palabra a palabra
- Whisper **`turbo`** en CUDA, `language="es"`, `word_timestamps=True`, `condition_on_previous_text=False`.
- **`initial_prompt` con el vocabulario del vídeo:** «Claude, Claude Code, Claude Opus 5.5, reel, motion graphics, subtítulos, falsas tomas, skills, prompts». Sin esto, Whisper escribía «CloudCode» o «rail».
- Salida `words-raw.json`: `{w, start, end, p}` (p = probabilidad; menos de 0,6 marca la palabra para revisarla).

### 3.2 Detectar qué cortar (tres fuentes que se cruzan)
1. **Huecos entre palabras de más de 0,4 s** (según Whisper).
2. **Repeticiones:** n-gramas iguales seguidos (por ejemplo «comenta … [4 s] … comenta Claude» = toma falsa; se queda la segunda).
3. **Silencios reales del audio:** `silencedetect=noise=-38dB:d=0.35`.

**Trampa importante:** Whisper **estira palabras sobre los silencios** (por ejemplo, «si» duraba 3,5 s porque se tragaba una pausa). Los puntos de corte no se pueden sacar solo de Whisper: hay que afinarlos con la energía del audio (RMS cada 50 ms alrededor de cada corte).

```bash
ffmpeg -ss 44.9 -to 46.4 -i audio48k.wav -af "astats=metadata=1:reset=1:length=0.05,ametadata=print:key=lavfi.astats.Overall.RMS_level" -f null -
```

### 3.3 Cortar
- Tramos `KEEP` escritos a mano tras el análisis, con **~0,1 s de respiración** a cada lado y **ajustados a la rejilla de 1/30 s**.
- Fundidos de audio de **12 ms** en cada empalme (evitan los chasquidos).
- Un único `filter_complex` con `trim/atrim + concat` para el máster 4K y otro para la vista previa a 1080×1920.
- Resultado: 56,8 s → **38,3 s**.

### 3.4 Recalcular `words.json` al corte (aquí suele fallar todo)
- **No uses el punto medio de la palabra** para decidir a qué tramo pertenece: se pierden palabras.
- Regla que funciona: cada palabra va al **tramo con el que más se solapa**, siempre que ese solape sea de al menos `min(0,15 s, 50 % de la duración de la palabra)`. Así no se pierden palabras cortas como «lo» o «de», ni se duplican las que cruzan un corte.
- Correcciones de texto en un diccionario (`5` + `.5.` → `5.5`, `éste` → `este`).
- Hay que verificarlo: el texto reconstruido debe ser idéntico a la transcripción, con **120 de 120 palabras**.

**Punto de control humano:** tabla de palabras + lista de cortes + vista previa → «siguiente».

---

## 4. Pasada 2 · Recortar al sujeto (`matte.py`, `matte_test.py`)

- RVM ResNet50 TorchScript, `torch.jit.freeze`, **`downsample_ratio=0.25` a 4K** (RVM recomienda entre 0,125 y 0,25). Los estados recurrentes `rec` pasan de un fotograma al siguiente: eso da la **estabilidad temporal** que no tienen los modelos de imagen fija.
- E/S por tuberías: `ffmpeg → rawvideo rgb24 → torch → alpha uint8 → ffmpeg gray → h264_nvenc cq 10`. No hace falta cv2.
- Rendimiento: **1149 fotogramas 4K en 184 s** (unos 6 fps en la 5090).
- Pruebas obligatorias: sobre **tablero de ajedrez** (se ven los agujeros), sobre **fondo oscuro con una palabra detrás de la cabeza**, y el **contorno blanco** como ejemplo de lo que hay que evitar.

**Decisión clave:** el **micrófono** salía semitransparente, porque el modelo duda si es sujeto o fondo. En vez de pelearse con eso:
- **Se mantiene el fondo real del estudio.**
- El mate se usa **solo para poner texto o logos DETRÁS de la cabeza**.
- Como el fondo y el sujeto salen del mismo metraje, los bordes imperfectos no se notan.

Composición: `base = toma + capa_detrás + (toma × mate)`.

---

## 5. Pasada 3 · Subtítulos (`captions.py` y la sección de subtítulos de `build_reel.py`)

### 5.1 Trocear
- **Cortes escritos a mano por frase**, con la palabra clave marcada entre asteriscos. Esto lee mucho mejor que agrupar automáticamente cada 3 palabras:
  `"No tienes que | abrir ningún | *editor* | de vídeos"`.
- Una palabra clave por frase (13 frases, 55 trozos).
- Tiempos: cada trozo dura hasta que empieza el siguiente, como mucho +0,35 s de cola, y **nunca menos de 0,4 s**.
- El humano aprueba la lista de palabras clave antes de renderizar.

### 5.2 Diseño (4K)
- Zona segura de Instagram a 4K: **440 px arriba, 760 px abajo, 280 px a la derecha**.
- Caja de subtítulos: `left 160, right 300, top 2520, height 520` (a la altura del pecho; **nunca sobre la cara**).
- Texto: **SF Compact Display Medium, 120 px**, blanco con sombra suave.
- Palabra clave: **Anton 330 px, oro #F2C84B**, con resplandor.

### 5.3 Animación del texto (la nota del humano: «el rebote en los textos no me gusta»)
- **Sin rebote en los textos.** Entradas suaves (`power3.out`, 0,3–0,45 s, con un ligero desenfoque que se aclara).
- **Variedad por frase:** algunas por **caracteres** (stagger de 0,022 s), otras por **palabras** (cada una en su tiempo) y otras por **línea entera**.
- Las palabras clave entran con un ligero escalado (1,12 → 1) y desenfoque, o letra a letra.
- **Huecos:** los subtítulos se ocultan cuando un gráfico ya dice lo mismo (la palabra detrás de la cabeza, la escena a pantalla completa, la guía, la llamada a comentar). Una idea en pantalla cada vez.

---

## 6. Pasada 4 · Motion graphics (`build_reel.py`, `make_base.sh`)

### 6.1 Primero el plan, después construir
Antes de tocar código, una tabla con 11 filas: **lo que dice · tiempo · qué aparece · por qué**. El humano la aprueba o la cambia (ver `plan-graficos.md`). Cambiar una fila cuesta una frase; cambiar un render cuesta una pasada.

### 6.2 Arquitectura de render en dos etapas (lo más importante)

```
ETAPA 1 (capa detrás, sin vídeo)   HyperFrames → behind.mov (ProRes 4444 con alfa, transparente)
ETAPA 1b (composición)             ffmpeg: base.mp4 = toma + behind.mov + (toma alphamerge mate)
ETAPA 2 (todo lo de delante)       HyperFrames: base.mp4 dentro de un #zoom animado + gráficos + subtítulos → MP4 4K
ETAPA 3 (audio)                    mezcla + máster → mux con el vídeo de la etapa 2 (-c:v copy)
```

**Por qué dos etapas:**
- El **cristal líquido** (`backdrop-filter: blur(46px) saturate(1.45)`) necesita el vídeo **dentro del mismo render** para desenfocarlo. En una capa transparente aparte no hay nada que desenfocar.
- El **texto detrás de la cabeza** necesita el mate, y eso es más fiable en ffmpeg (`alphamerge`) que en el navegador.
- Los **zooms** van en el wrapper `#zoom` de la etapa 2, así que se mueven la toma, la capa de detrás y el recorte a la vez, y **los gráficos no se escalan**.

```bash
ffmpeg -i cut-4k30.mp4 -i matte-4k30.mp4 -i behind.mov -filter_complex "
[0:v]format=rgba,split[pl][pl2];[2:v]format=rgba[bh];
[pl][bh]overlay=format=auto[pb];[1:v]format=gray[m];
[pl2][m]alphamerge[fg];[pb][fg]overlay=format=auto,format=yuv420p[out]" \
-map "[out]" -map 0:a -c:v h264_nvenc -preset p6 -rc vbr -cq 16 -b:v 0 -c:a copy base.mp4
```

### 6.3 El rebote «estilo Apple»: la expresión de la Clase 02 convertida en ease de GSAP

```
valor + vel · fuerza · sin(rebotes · t · 2π) / e^(frenado · t)
```

Los keyframes **llegan con velocidad** (curva u²) y el rebote hace el final:

```js
const rb = (vel, fuerza, rebotes, frenado, t) => vel * fuerza * Math.sin(rebotes * t * 2 * Math.PI) / Math.exp(frenado * t);
const VB = (fuerza = 0.12, llegada = 0.3) => (p) => {
  const tot = llegada + 0.8, t = p * tot;               // con 2,5 rebotes/s el seno vuelve a 0 justo al final
  if (t < llegada) { const u = t / llegada; return u * u; }
  return 1 + rb(2 / llegada, fuerza, 2.5, 5, t - llegada);
};
gtl.fromTo("#tarjeta", { opacity: 0, y: 110, scale: .92 }, { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: VB(0.07) }, 2.38);
```

- **Tarjetas:** fuerza 0,07. **Recorridos grandes** (escalas desde 0,3): 0,045. **Textos: sin rebote** (§ 5.3).
- La primera versión, con fuerza 0,12 en todo, resultó demasiado rebotona: el humano la rechazó para los textos.

### 6.4 Zooms: nunca cortes, siempre curvas
Acercar con `power2.inOut` hacia la idea, mantener y alejar después. Máximo de **5–10 %**, con `transform-origin: 50% 30%` (la cara):

| Tiempo | Movimiento |
|---|---|
| 0,0 s | 1,08 → 1,00 en 1,6 s, `power3.out` (el gancho se asienta) |
| 2,3 s | 1,00 → 1,035 en 2,6 s, `sine.inOut` (deriva lenta) |
| 7,0 s | → 1,05 en 1,6 s (empuje hacia «Claude Code»); se aleja a las 9,3 |
| 20,9 s | → 1,045 en 2,4 s (empuje hacia «y lo hace»); se aleja a las 24,0 |
| 35,3 s | 1,04 → 1,10 en 2,6 s (empuje final hacia la llamada a comentar) |

**Ojo:** el zoom mueve la cara hacia abajo. Las tarjetas tienen que tener margen para la cara **con el zoom máximo**, no con el reposo (§ 6.5).

### 6.5 Regla de la cara (nota del humano: «el gráfico está encima de mi barbilla»)
- La barbilla queda en y ≈ 1.800–1.900 a 4K. **Todas las tarjetas empiezan en `top: 2130px`** y son compactas: 1.400–1.640 px de ancho y unos 300–560 px de alto.
- Los subtítulos bajan a `top: 2520`.
- Con las tarjetas más grandes (terminal, chat) se redujo el zoom simultáneo.
- **Comprobación obligatoria:** capturas en los momentos de zoom máximo.

### 6.6 Inventario de gráficos (cada uno disparado en su palabra)
1. **«100 %» detrás de la cabeza** (1,66 s). Anton 800 px con degradado oro. Sustituye al subtítulo.
2. **Chispa de Claude (logo oficial) detrás de la cabeza** + **píldora de cristal «Claude · Opus 5.5 ✓»** (2,38 s).
3. **Terminal de Claude Code** (6,05 s). Escribe `> edita este reel` letra a letra (`gtl.call` por carácter, determinista), marca tareas con ✓ y en «Claude Code» (8,45 s) aparece una **insignia con la mascota**.
4. **Iconos reales de Premiere, After Effects y CapCut tachados** (10,3 s).
5. **Escena a pantalla completa «Así edita Claude Code»** (11,4–18,7 s):
   - Fondo limpio #09040F con orbes de degradado que se mueven, cuadrícula sutil con máscara radial, viñeta y grano.
   - Se abre como una tarjeta que crece: `clipPath: inset(46% 8% 40% 8% round 120px)` → `inset(0)` con el rebote.
   - 4 pasos que se encienden en su palabra («silencios», «falsas tomas», «subtítulos», «motion graphics»), cada uno con su mini animación.
   - **La mascota salta de un paso al siguiente** con aplastamiento al aterrizar (`scaleY 1.18 / scaleX .86` y vuelta con rebote).
   - Remate con «TODO AUTOMÁTICO» y cierre hacia el plano de Diego.
6. **«AUTOMÁTICA» detrás de la cabeza** (18,74 s).
7. **Chat:** «Adelanta el gráfico 3 fotogramas», puntos de escritura y «✓ Hecho» (21,1–23,9 s).
8. **Captura real de la guía «Reels paso a paso»** (Chrome sin interfaz) con chips «12 PROMPTS» y «SKILLS» (25,5 s).
9. **«Te envío»:** Tutorial, Skills y Prompts entran cuando los nombra (31,9 s).
10. **«CLAUDE» detrás de la cabeza + caja de comentario de Instagram** que escribe «Claude», con la mascota que llega saltando y una flecha (35,1 s).

### 6.7 Estilo «cristal líquido» (de las presentaciones de Viegas)

```css
background: linear-gradient(160deg, rgba(42,26,69,.52), rgba(21,10,36,.58));
border: 3px solid rgba(168,85,247,.38); border-radius: 64px;
backdrop-filter: blur(46px) saturate(1.45);
box-shadow: 0 70px 150px -50px rgba(0,0,0,.8), inset 0 3px 0 rgba(255,255,255,.16), 0 0 80px -20px rgba(124,58,237,.55);
/* filo de luz arriba */ ::before { height: 3px; background: linear-gradient(90deg, transparent, rgba(220,190,255,.9), transparent); }
/* barrido de luz */ .sweep { skewX(-18deg); gradiente oro 22 %; recorre la tarjeta 0,3 s después de entrar }
```

Paleta 60-30-10: fondo #09040F · violeta #7C3AED / #A855F7 / #C084FC · oro #F2C84B. Rojo #FF5470 solo para alertas. Fuentes: Anton (impacto), Rajdhani 700 (tarjetas), SF Compact Display Medium (subtítulos) y Cascadia Mono (terminal). **Todas las fuentes van como archivos locales con `@font-face`**, nunca desde una red al renderizar.

### 6.8 Trampas de HyperFrames que costaron tiempo
- Un proyecto tiene **un solo `index.html` raíz**. El resto son subcomposiciones en `compositions/*.html`, con todo (estilo, marcado y script) **dentro de `<template>`**.
- **Prohibidos los selectores con plantillas** (`` `#${id}` ``): rompen el bundler. Todo el JS de animación **se genera desde Python con selectores literales**.
- No combines un `transform` inicial en CSS con un tween de GSAP sobre la misma propiedad. Usa `fromTo`.
- No animes `margin` ni `width` (el lint lo marca como movimiento que salta al píxel). Usa `scale`, `x`, `y` y `opacity`.
- Un timeline pausado por composición, registrado en `window.__timelines["id"]` con el mismo id que `data-composition-id`.
- Para «escribir» texto, `gtl.call(() => el.textContent = "…", null, t)` por carácter. Es determinista al saltar de fotograma.
- `npx hyperframes check` antes de cada render. Los avisos de densidad son aceptables; los errores no.
- Las capturas del panel del navegador **llegan con retraso respecto a la animación**: al revisar, desactiva las animaciones de entrada o espera antes de capturar. Si no, parecerá que algo no se ve cuando sí se ve.
- Windows: los parches con `heredoc` y saltos CRLF rompieron un script de Python. Mejor escribir archivos completos o parches como archivo `.py`.

---

## 7. Pasada 5 · Sonido (`mix.py`, `render_music.cjs`)

### 7.1 Voz
Se reconstruye **desde el WAV original** con los mismos tramos (fundidos de 12 ms), no desde el AAC del vídeo. Cadena:

```
highpass=f=80, afftdn=nf=-30:nr=8, acompressor=threshold=-20dB:ratio=2.5:attack=8:release=140:makeup=2
```

### 7.2 Efectos (40, cada uno en su evento visual, unos 20–40 ms antes del visual)
- Golpe en el primer fotograma.
- Whoosh en cada tarjeta y al abrir y cerrar la escena a pantalla completa.
- Pop en los pasos y los chips; clic en los checks y los tachados.
- Tecleo en la terminal y en el comentario; ping en «✓ Hecho»; sparkle en «TODO AUTOMÁTICO».
- Golpe grave en «CLAUDE»; chime al cierre.

**Nivel final** (después de la nota «muy fuertes», bajados un 50 %): entre **−15 y −25 dB** respecto a su pico original. **Regla para el editor autónomo:** los efectos van **20–25 dB por debajo de la voz**. Que acompañen, que no tapen.

### 7.3 Música de fondo (SynthFlow Studio, modo Synthwave 80s, 118 BPM)
- Se ejecuta el HTML del estudio en **Chrome sin interfaz (puppeteer-core)**, se llama a `selectGenre('synthwave')` y a `renderProceduralTrackOffline(40, 48000)`, y se codifica con `encodeAudioBufferToWAV` (base64 → disco). Es un render offline, más rápido que el tiempo real.
- **El HTML original tenía 3 errores** que impedían que cargara (corregidos en una copia, nunca en el original):
  1. faltaba la cabecera de `toggleRecording()` y el script entero fallaba con «Unexpected token '}'»;
  2. faltaban `generatePatternFromSeed()` y `updateVinylLevel()`; se reconstruyeron (Synthwave: La m – Fa – Do – Sol, bombo en negras, caja en 2 y 4, hi-hats en corcheas, melodía pentatónica con semilla);
  3. `playProceduralChord/Bass/Lead` estaban **definidas dos veces**, y la segunda (solo en directo) pisaba a la que acepta un contexto offline.
- **Mezcla:** la música queda 12 dB por debajo de la voz (medido en LUFS) con **ducking** de 7 dB más mientras hay voz. Detector RMS de 20 ms con umbral de −38 dBFS, ataque de 40 ms, relajación de 450 ms. Entrada de 0,6 s y fundido final de 1,5 s.

### 7.4 Máster
`loudnorm` en **dos pasadas** (medir y aplicar con `linear=true`) a `I=-14 : TP=-1.5 : LRA=11`. Se verifica sobre el **MP4 final** (después del AAC a 320 kbps): **−14,0 LUFS y pico −1,5 dB**.

---

## 8. Bucle de calidad (lo que hace un editor autónomo «bueno»)

En cada pasada:
1. **Generar** (script determinista).
2. **Validar técnicamente:** `hyperframes check`, ffprobe (resolución, fps, duración, audio presente) y `ebur128`.
3. **Revisar visualmente:** capturas en los instantes críticos (la entrada de cada gráfico, el zoom máximo, los cambios de escena) en hoja de contactos. Lista de comprobación:
   - [ ] ¿Algo toca la cara o la barbilla, también con el zoom máximo?
   - [ ] ¿Todo está dentro de la zona segura (440 / 760 / 280 px a 4K)?
   - [ ] ¿Hay texto cortado por los bordes? (Las palabras grandes detrás de la cabeza deben caber en 2.000 px de ancho.)
   - [ ] ¿Solo hay una idea en pantalla? ¿El subtítulo duplica un gráfico?
   - [ ] ¿Los logos y las capturas son reales?
4. **Corregir y repetir** antes del render 4K (de 5 a 7 minutos cada uno).
5. **Vista previa ligera** (1080×1920, menos de 30 MB) para el humano.

---

## 9. Estructura de archivos del proyecto

```
work/
  source-camara.mp4        copia de la toma (nunca se edita el original)
  vertical-4k30.mp4        rotada 2160×3840 a 30 fps
  audio16k.wav / audio48k.wav
  words-raw.json           Whisper sin tocar
  words.json               palabras ya en la línea de tiempo cortada (el reloj de todo)
  cut-4k30.mp4             pasada 1
  matte-4k30.mp4           pasada 2 (alfa en gris)
  captions.json            pasada 3 (trozos, palabras clave y tiempos por palabra)
  plan-graficos.md         pasada 4A (plan aprobado)
  behind.mov               capa detrás (ProRes 4444 con alfa)
  reel/                    proyecto HyperFrames
    index.html             toma base + #zoom + subcomposiciones
    compositions/behind.html · graphics.html · captions.html
    assets/base.mp4 · fonts/ · logos/ · guia-portada-crop.png · avatar.jpg
  voz.wav · musica-synth.wav · mezcla.wav · master.wav
  reel-final-video.mp4 → reel-final-4k.mp4 (con el audio masterizado)
```

---

## 10. Las notas del humano convertidas en reglas (meter esto en el «cerebro» del editor)

| Nota de Diego | Regla resultante |
|---|---|
| «Está en horizontal, pásalo a vertical en 4K» | Lee los metadatos de grabación (`giro`) y rota en nativo antes de nada |
| «Quiero logos originales, que se vea llamativo» | Usa los SVG oficiales (chispa de Claude, mascota de Claude Code) en grande, con brillo; nunca recreados |
| «Estilo cristal líquido como la presentación» | Estilo `.glass` (§ 6.7) con desenfoque real del vídeo, que obliga al render en dos etapas |
| «Zooms suaves, nada de cortes duros» | Solo tweens con curva (`power2/3.inOut`), máximo 5–10 %, acercar y alejar |
| «Rebote natural estilo Apple» (Clase 02) | Ease `VB(fuerza)` con la expresión de After Effects (§ 6.3) |
| «Ese rebote en los textos no me gusta» | Textos sin rebote: entradas suaves, variadas por caracteres, palabras o línea |
| «No tapes mi cara; el gráfico está en mi barbilla» | Tarjetas desde y = 2130 (4K), compactas; comprobar con el zoom máximo |
| «Mete la mascota» | La mascota de Claude Code como personaje: insignia, saltos entre pasos y llegada a la llamada final |
| «Una escena a pantalla completa con fondo limpio» | Escena de proceso con degradados animados, cuadrícula sutil y apertura desde una tarjeta |
| «Subtítulos en SF Compact Display Medium» | Fuente local con `@font-face` (OTF del sistema copiado al proyecto) |
| «Baja los SFX un 50 %, están muy fuertes» | Efectos 20–25 dB bajo la voz por defecto |
| «Añade música con este código, Synth 80s» | Música procedural offline + ducking automático |

---

## 11. Si construyes tu propio editor autónomo con IA

1. **No pidas al modelo «edita el vídeo».** Pídele **una pasada cada vez**, con su archivo de salida y su comprobación. Encadena las pasadas como un pipeline con estados (`pending → generated → validated → approved`).
2. **El modelo decide y el código ejecuta.** El LLM escribe el plan (tabla de gráficos, palabras clave, cortes) en JSON. Scripts deterministas lo convierten en fotogramas. Nunca dejes que el modelo «improvise» el render.
3. **Añade un paso «crítico» con visión:** después de generar, saca 6–9 fotogramas en los tiempos críticos y pásaselos al modelo con la lista de comprobación del § 8. Así detectó esta edición la barbilla tapada, las palabras cortadas, el subtítulo chocando con la terminal y los iconos invisibles.
4. **Mide siempre:** cortes con energía del audio, no solo con el ASR; volumen con `ebur128`; formato con ffprobe.
5. **Copia la fuente** antes de editar; otros procesos pueden tocar la carpeta.
6. **Parámetros por defecto** (punto de partida para la configuración del editor):

```json
{
  "canvas": { "w": 2160, "h": 3840, "fps": 30 },
  "safe_zone_px_4k": { "top": 440, "bottom": 760, "right": 280 },
  "cuts": { "pause_min_s": 0.4, "breath_s": 0.1, "audio_fade_ms": 12, "silence_db": -38, "silence_min_s": 0.35 },
  "asr": { "model": "whisper-turbo", "language": "es", "word_timestamps": true, "initial_prompt": "<vocabulario del vídeo>" },
  "matte": { "model": "RVM resnet50", "downsample_ratio_4k": 0.25 },
  "captions": { "words_per_chunk": [1, 3], "min_s": 0.4, "tail_s": 0.35, "box_top": 2520, "font": "SF Compact Display Medium 120px", "keyword_font": "Anton 330px #F2C84B", "text_bounce": false },
  "cards": { "top_px": 2130, "max_width_px": 1640, "enter": "VB(0.07) 1.1s", "exit": "power2.in 0.22s" },
  "spring": { "fuerza": 0.12, "rebotes_por_s": 2.5, "frenado": 5, "llegada_s": 0.3 },
  "zoom": { "max": 1.10, "ease": "power2.inOut", "origin": "50% 30%", "hard_cuts": false },
  "sfx": { "db_under_voice": [-25, -20] },
  "music": { "db_under_voice": 12, "duck_db": 7, "attack_ms": 40, "release_ms": 450, "fade_in_s": 0.6, "fade_out_s": 1.5 },
  "master": { "lufs": -14, "true_peak_db": -1.5 }
}
```

7. **Puntos de control humano** (aunque sea autónomo, ofrécelos): después del corte, después del plan de gráficos y antes del render final. Son baratos y evitan horas de renders inútiles.

---

## 12. Scripts incluidos (`pipeline/`)

| Archivo | Pasada | Qué hace |
|---|---|---|
| `transcribe.py` | 1 | Whisper turbo en GPU → `words-raw.json` |
| `analyze.py` | 1 | Tabla de palabras, pausas, repeticiones y silencios |
| `cut.py` | 1 | Corte (tramos `KEEP`) + `words.json` recalculado + vista previa |
| `matte.py` | 2 | RVM 4K en GPU → `matte-4k30.mp4` |
| `matte_test.py`, `guide_photos.py` | 2 | Pruebas de tablero, palabra detrás y contorno |
| `captions.py` | 3 | Trozos escritos a mano → `captions.json` |
| `build_reel.py` | 3-4 | Genera las composiciones HyperFrames (`behind` / `final`) |
| `make_base.sh` | 4 | Composición ffmpeg de la base con el mate |
| `render_music.cjs` + `synth/studio.html` | 5 | Música procedural offline (copia corregida de SynthFlow) |
| `mix.py` | 5 | Voz limpia + 40 efectos + música con ducking + máster a −14 LUFS |
| `plan-graficos.md`, `BRIEF.md` | — | Plan aprobado y resumen del encargo |

Orden de ejecución: `transcribe → analyze → cut → matte → captions → build_reel behind → hyperframes render (mov) → make_base → build_reel final → hyperframes render → render_music → mix → mux`.
