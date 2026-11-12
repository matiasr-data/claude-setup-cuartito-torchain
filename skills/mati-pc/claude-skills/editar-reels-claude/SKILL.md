---
name: editar-reels-claude
description: Edita un reel vertical de cabeza parlante como un editor profesional. Empieza con una entrevista corta (qué toma, calidad, estilo, música, cuántos gráficos), comprueba el equipo y edita en 5 pasadas con vista previa: corte de silencios y tomas falsas, recorte del sujeto (texto detrás de la cabeza), subtítulos con palabra clave, motion graphics de cristal líquido con rebote, zooms suaves, efectos y música generados por síntesis y máster a −14 LUFS. Úsala cuando el usuario pida editar un reel, un short o un TikTok a partir de una toma suya, quiera preparar su carpeta de reels o su guía de estilo, o mencione la guía «Reels paso a paso» de Viegas Estudio.
---

# Editar reels con Claude (método Viegas Estudio)

La persona que te habla puede estar usando Claude por primera vez. **Háblale claro y sin jerga**, explica en una frase qué vas a hacer antes de cada paso y no le pidas que escriba comandos: los ejecutas tú.

Trabajas **como un editor que recibe notas**: todo en código (ffmpeg, Python, HTML/GSAP con HyperFrames), **una pasada cada vez**; cada pasada deja un archivo y enseñas una vista previa.

**Rutas.** `{SKILL}` es la carpeta de esta skill (la que contiene este `SKILL.md`; normalmente `~/.claude/skills/editar-reels-claude`). Los scripts están en `{SKILL}/scripts/`. Referencia técnica: `{SKILL}/docs/PIPELINE-edicion-reels-IA.md`. Reel terminado de ejemplo: `{SKILL}/ejemplo-toma9/`.

## Paso A · Comprobar el equipo (la primera vez, y si algo falla)
```bash
python "{SKILL}/scripts/check_env.py"
```
- Si falta algo, **explica qué es, para qué sirve y pide permiso** antes de instalarlo (el informe trae el comando para su sistema). Después de instalar ffmpeg o Node, puede hacer falta abrir una sesión nueva para que se vean.
- Si hay varios Python, usa el que tenga `torch` (en Windows, `py -0p` los lista). Guarda cuál en `proyecto.json`.
- El modelo de recorte se descarga con `python "{SKILL}/scripts/check_env.py" --descargar-modelo` (~100 MB, licencia GPL-3.0). Pide permiso.
- Apunta el **perfil** (rápido / medio / lento) y la **resolución recomendada**: los usarás en la entrevista.

## Paso B · La carpeta de reels (solo la primera vez)
Si el usuario no tiene una carpeta «Reels con Claude», pregúntale dónde crearla (recomienda Documentos) y créala:
```bash
python "{SKILL}/scripts/crear_carpeta.py" --dest "<Documentos>/Reels con Claude"
```
```
Reels con Claude/
  Mi estilo/   Reglas-de-estilo.md · referencias/ · tipografias/ · logos/
  Tomas/       sus vídeos grabados (nunca se modifican)
  Música/      opcional
  Reels/       un proyecto por reel: trabajo/, graficos/ y FINAL
```
Dile que guarde sus tomas en `Tomas/` y sus referencias, fuentes y logos en `Mi estilo/`, y que **abra Claude en esa carpeta** a partir de ahora.

## Paso C · La entrevista (antes de cada reel)
Haz las preguntas **con la herramienta de preguntas con opciones** (AskUserQuestion), en dos tandas de como máximo 4, con tu recomendación como primera opción. **No preguntes lo que ya sabes** (mira `Tomas/`, `Mi estilo/` y el último `proyecto.json`).

**Tanda 1**
1. **¿Qué toma editamos?** Ofrece los vídeos más recientes de `Tomas/` (o que arrastre o pegue la ruta).
2. **Calidad**: 4K (recomendado con tarjeta NVIDIA) o 1080p (mucho más rápido en Mac o sin tarjeta gráfica). Recomienda lo que dijo `check_env.py`.
3. **Estilo**: si existe `Mi estilo/Reglas-de-estilo.md`, úsalo sin preguntar. Si no: crearlo con mis referencias (recomendado si ha dejado capturas en `referencias/`) · crearlo desde cero con preguntas · usar el estilo de ejemplo de Viegas Estudio (`{SKILL}/docs/guia-de-estilo-ejemplo.md`).
4. **Revisión**: guiada (vista previa al final de cada pasada) · rápida (solo te pregunto la transcripción, las palabras clave y el plan de gráficos).

**Tanda 2**
1. **Gráficos**: equilibrado (recomendado: subtítulos, 4-6 tarjetas y logos) · pocos (subtítulos y 2-3 tarjetas) · muchos (también una escena a pantalla completa).
2. **Texto detrás de la cabeza**: sí (necesita el recorte; con perfil lento, avisa del tiempo) · no (más rápido).
3. **Música**: Synthwave 80s · Lo-Fi · la mía (`Música/`) · sin música.
4. **Red**: Instagram Reels · TikTok · YouTube Shorts · todas (cambia poco: zona segura y duración).

Crea el proyecto `Reels/AAAA-MM-DD · <tema corto>/` y guarda las respuestas en `proyecto.json` (toma, resolución, estilo, revisión, gráficos, detrás, música, red, python, perfil). Si la sesión se corta, retoma desde ese archivo y desde los archivos que ya existan.

**Guía de estilo** (si hay que crearla): usa los prompts «Guía de estilo · con referencias» o «desde cero» de `{SKILL}/docs/prompts.md`. Mira las capturas y vídeos de `referencias/` (extrae fotogramas con ffmpeg). Toda decisión visual sale de esa guía, **con valores medibles (HEX, px, s, dB)**. Guárdala en `Mi estilo/Reglas-de-estilo.md`.

## Pasada 0 · Preparar
```bash
python "{SKILL}/scripts/prepare.py" --src "<toma>" --work "<proyecto>/trabajo" --res 4k|1080
```
- Si el vídeo es **horizontal**, el script se para y guarda `trabajo/fotograma.jpg`. **Míralo tú**: si la persona sale tumbada (cámara de lado) → `--rotate 90` (o 270); si sale derecha → `--crop 0.5` (ajusta 0-1 para que quede centrada; comprueba el resultado con otro fotograma).
- El codificador (NVIDIA / Mac / CPU) se elige solo.

## Pasada 1 · Transcribir y cortar
```bash
python "{SKILL}/scripts/transcribe.py" --audio trabajo/audio16k.wav --out trabajo/words-raw.json --lang es --vocab "<nombres y marcas>"
python "{SKILL}/scripts/analyze.py" --words trabajo/words-raw.json --audio trabajo/audio48k.wav [--rms inicio:fin]
```
1. Enseña la transcripción y la lista de pausas de más de 0,4 s y de tomas repetidas. **Pregunta si hay palabras mal escritas y qué quitar.**
2. Escribe `trabajo/keep.json` (tramos que se quedan, con ~0,1 s de respiración; afina con la energía del audio, porque Whisper alarga palabras sobre los silencios) y las correcciones. Ejemplo: `{SKILL}/ejemplo-toma9/keep.json`.
3. `python "{SKILL}/scripts/cut.py" --work trabajo --keep trabajo/keep.json` → `cut.mp4`, `preview.mp4`, `words.json`.
4. Comprueba que no se pierde ninguna palabra en `words.json`. En revisión guiada, enseña `preview.mp4` y espera «siguiente».

## Pasada 2 · Recortar al sujeto (solo si quiere texto detrás de la cabeza)
```bash
python "{SKILL}/scripts/matte.py" --src trabajo/cut.mp4 --out trabajo/matte.mp4 --model "{SKILL}/models/rvm_resnet50_fp32.torchscript"
```
El script avisa del tiempo que queda; si es mucho, ofrece seguir sin texto detrás de la cabeza. Haz las dos pruebas con un fotograma (sobre tablero y con una palabra grande detrás). **Mantén el fondo real**: el mate solo sirve para poner texto o logos detrás de la cabeza.

## Pasada 3 · Subtítulos
1. Escribe `trabajo/frases.txt`: una frase por línea, trozos de 1-3 palabras separados con `|` y **una palabra clave por frase** entre `*asteriscos*` (ejemplo: `{SKILL}/ejemplo-toma9/frases.txt`).
2. **Enseña las palabras clave y espera el OK** (también en revisión rápida).
3. `python "{SKILL}/scripts/captions.py" --words trabajo/words.json --phrases trabajo/frases.txt --out trabajo/captions.json`
4. Diseño: caja a la altura del pecho, nunca sobre la cara (en 4K: `top 2520`, alto 520, `left 160`, `right 300`). Palabra clave grande con la fuente de impacto de la guía. **Textos sin rebote**: entradas suaves de 0,3-0,45 s, variadas (por caracteres, por palabras o la línea entera).

## Pasada 4 · Motion graphics
1. **Primero el plan**, sin construir: tabla con lo que dice, el tiempo, qué aparece y por qué (ejemplo: `{SKILL}/ejemplo-toma9/plan-graficos.md`). La cantidad sale de la respuesta «Gráficos». **Espera la aprobación** (también en revisión rápida).
2. Construye con HyperFrames (`npx hyperframes`) en `<proyecto>/graficos/`, **en dos etapas** (ver `{SKILL}/ejemplo-toma9/build_reel.py` y `compositions/`):
   - capa **detrás** (palabras gigantes, logos) → `npx hyperframes render . --format mov -o ../trabajo/behind.mov`
   - `python "{SKILL}/scripts/make_base.py" --plate trabajo/cut.mp4 --matte trabajo/matte.mp4 --behind trabajo/behind.mov --out graficos/assets/base.mp4`
   - capa **delante**: `base.mp4` dentro de un `#zoom` animado + tarjetas de cristal + subtítulos → `npx hyperframes render . -o ../trabajo/reel-video.mp4`
   - Sin recorte: salta la capa detrás y usa `cut.mp4` como base.
3. Estilo: `{SKILL}/templates/hyperframes/estilo-cristal.css`. Movimiento: `{SKILL}/templates/hyperframes/rebote.js` (tarjetas con rebote suave; zooms con curva, nunca cortes, máximo 5-10 %). Fuentes: `Mi estilo/tipografias/` y, si no hay, `{SKILL}/fonts/`.
4. **En 1080p** la composición es de 1080×1920: divide entre 2 todas las medidas en px de esta skill y de la plantilla.
5. Reglas: un gráfico por idea, disparado en su palabra; **logos y capturas reales** (`Mi estilo/logos/`); las tarjetas empiezan **por debajo de la barbilla también con el zoom máximo** (en 4K, `top ≥ 2130`); oculta el subtítulo cuando un gráfico ya dice lo mismo; la escena a pantalla completa lleva fondo limpio (degradados que se mueven, cuadrícula sutil).
6. Trampas de HyperFrames: subcomposiciones con todo dentro de `<template>`; **nunca selectores con plantillas** (`` `#${id}` ``), así que genera el JS con selectores literales; no animes `margin` ni `width`; `@font-face` con fuentes locales; `npx hyperframes check` antes de cada render.
7. **Con motion-graphics-claude** (otra skill gratuita de Viegas Estudio): si está instalada, úsala para escenas 3D, escenas a pantalla completa, tarjetas y textos animados. Pásale `trabajo/cut.mp4` y `trabajo/words.json` y pídele las **capas** de cada escena: `detras.mov` y `delante.mov` (ProRes 4444 con alfa, 60 fps, misma duración que `cut.mp4`) + `plan.json` con los tiempos anclados a las palabras.
   - `detras.mov` entra como `--behind` en `make_base.py`; `delante.mov` va encima en la capa de delante; las escenas a pantalla completa (MP4) se insertan en su tramo. Con `plan.json`, no dupliques con subtítulos o tarjetas lo que ya dice un gráfico.
   - Si no está instalada, sigue con HyperFrames como arriba.
8. **Revisión visual antes del render final**: `npx hyperframes snapshot . --at <tiempos críticos> --no-end` y revisa: cara y barbilla libres, zona segura, textos sin cortar, una idea a la vez. En revisión guiada, envía una vista previa ligera y espera «siguiente».

## Pasada 5 · Sonido
```bash
cd "{SKILL}/scripts" && node synthflow_render.cjs sfx "<proyecto>/trabajo/sfx"
cd "{SKILL}/scripts" && node synthflow_render.cjs music synthwave <duración+2> "<proyecto>/trabajo/musica.wav"   # o lofi
python "{SKILL}/scripts/mix.py" --work trabajo --sfx trabajo/sfx.json --music trabajo/musica.wav --video trabajo/reel-video.mp4 --out "FINAL - <tema>.mp4"
```
- `trabajo/sfx.json`: un efecto por evento visual (golpe en el gancho, whoosh en los cambios de escena, clic en los checks, riser antes de un momento grande), 20-40 ms antes del visual. Ejemplo: `{SKILL}/ejemplo-toma9/sfx-ejemplo.json`.
- **Efectos entre 20 y 25 dB por debajo de la voz. Música 12 dB por debajo, con ducking de 7 dB.** Máster a −14 LUFS y pico real por debajo de −1 dB, verificado sobre el MP4 final. Con «la mía», usa el archivo de `Música/`; con «sin música», no pases `--music`.
- Entrega `FINAL - <tema>.mp4` y `portada.png` (un fotograma con una palabra grande) en la carpeta del proyecto y di dónde están.

## Al terminar
- Pídele que lo vea dos veces en el móvil, con sonido y sin sonido, y que nada importante quede bajo los botones de la red social.
- Dile que puede borrar `trabajo/` cuando lo publique (ocupa varios GB).
- Ofrece guardar en `Mi estilo/Reglas-de-estilo.md` lo que haya aprendido de sus notas.

## Cómo tratar las notas del usuario
Cada nota es una **regla para todo el vídeo**, no solo para ese momento («tapa mi barbilla» → revisa todas las tarjetas con el zoom máximo). Si pide rehacer un tramo, rehaz solo ese tramo y deja el resto igual. Si la nota sirve para futuros reels, ofrece añadirla a su guía de estilo.
