# ESTADO — video-02oct

Bruto: `/Users/pablolluch/Desktop/DJI_20261002184020_0013_D.MP4` (4K, 29,97 fps, HEVC, 5:16). No se modifica ni se ha copiado a `brutos/` (2,5 GB; el disco estaba al 94 %).
Antes de cualquier comando: `source .herramientas/entorno.sh`.

## Paso actual
**Paso 8 — Revisión, segunda vuelta. PUNTO DE CONTROL: el creador revisa `entrega/revision.mp4` (v2, cámara progresiva).** Solo el creador cierra este paso.

**Primera revisión del creador (2026-10-02):** todo «de 10» (los 57 gráficos, textos, sonidos, colores, transiciones) **menos los zooms**: «saltos muy grandes y a trompicones, nada progresivos». Se rehízo solo la cámara (`scripts/camara.py`); gráficos, SFX, transiciones y fondos son idénticos a la v1 (comprobado comparando `timeline.json` con `timeline_v1.json`). Medición antes/después en `trabajo/revision/ANALISIS_ZOOM.md` y `zoom_antes_despues.png`.
Los puntos de control de la hoja (paso 2) y del primer gráfico de cada serie (paso 5) no se pararon: el creador pidió expresamente la edición completa de una vez. Las decisiones tomadas por él están en `HOJA.md` → «Preguntas para el creador» y en `entrega/NOTAS.md` → «Pendientes».

**Segunda revisión (2026-10-02, noche):** «al descargarlo se ve a trompicones, peor que antes». No eran los zooms: `empaquetar.sh` pasaba el render por `.h264` crudo para ir de 30 a 29,97 fps y dejaba las marcas de presentación en orden de decodificación (pts == dts con fotogramas B). El visor de la app lo toleraba; QuickTime mostraba solo el 26 % de los fotogramas en su sitio (medido con `avconvert`). Afectaba a `revision.mp4` y a `1_VIDEO/` desde la primera entrega. Reparados sin recodificar con `scripts/reparar_tiempos.py` (100 % en su sitio) y `empaquetar.sh` corregido (`-itsscale`, con autocomprobación).

## Hecho
- [x] 1. Ingesta: `trabajo/transcript_whisper_raw.json`, `palabras_raw.json`; correcciones en `trabajo/correcciones.json` (CapCut, vlogs, VSL, Bali, sí).
- [x] 2. Formato (intro de tutorial a densidad de gancho) y `HOJA.md`.
- [x] 3. Corte: `scripts/cortes.py` → `cortes.json` (27 tramos, 3:53,5) y `palabras_montaje.json`.
- [x] 4. Voz: `scripts/voz.py` → `audio/voz_final.wav` (−14,2 LUFS / −1,2 dBTP) + A/B.
- [x] 5. Gráficos: 57 (25 subtítulos de énfasis) en Remotion, dirigidos por `trabajo/timeline.json`.
- [x] 6. Subtítulos: de énfasis dentro de los gráficos; `entrega/subtitulos.srt` completo.
- [x] 7. Sonido: 135 SFX (`scripts/sfx_sintesis.py` → `recursos/sfx/`, `scripts/mezcla.py`).
- [x] 8. Revisión propia: hoja de contactos de todos los gráficos y tiras de fotogramas de las transiciones. Falta la del creador.
- [x] 9. Entrega: `entrega/` (ver `NOTAS.md` y `COLOCACION.md`).

## Decisiones
- Manda la petición del creador sobre las reglas base: texto quemado frecuente, SFX en gráficos y transiciones, zoom in/out constante.
- **Cámara v2:** la escala es una curva suave por fotograma (interpolación cúbica monótona entre fotogramas clave). Dentro de un plano no hay ningún cambio instantáneo (máx. 0,97 % por fotograma); 60 empujes de ~0,66 s (+8 % de media, +12 % en los titulares con golpe) que aterrizan en la palabra clave, 53 aperturas de ~1,3 s y acercamiento lento de fondo. La escala solo cambia de golpe en las 26 uniones reales del corte (~8 %), para tapar el salto del metraje. Los paneles a la izquierda ya no hacen saltar la cara: la cámara viaja 20 fotogramas hasta el tercio derecho. Las sacudidas de los golpes bajan al 45 %. La v1 (lista de eventos `camara`) sigue en `timeline.json` como intención; `curva` es lo que se renderiza.
- Estilo B · Eléctrico (`motion/src/tokens.ts`). El acento lima va siempre como fondo con texto oscuro.
- Inicio de palabra = marca DTW − 0,08 s (medido); la última palabra de cada tramo se adelanta para no pegarse al corte.
- Corte: voz por encima de −35 dB; huecos ≥ 0,5 s se recortan; las colas se siguen hasta −44 dB. «CapCut» de 2:52,9 está dicho muy bajo: ajuste manual en `cortes.py`.
- La composición de Remotion va a 30 fps exactos sobre un intermedio re-etiquetado (`motion/public/video-02oct/base30.mp4`, 2880×1620); al empaquetar se devuelve a 29,97. Así el fotograma n del montaje es el n del render.
- Render con 4 hilos (con 6 falló por tiempo de espera del vídeo).
- Sin reductor de ruido en la voz (margen voz/ruido ~35 dB).

## Pendientes / riesgos
- Nadie ha **escuchado** el resultado: cortes dentro de frase y SFX sintetizados están medidos, no oídos.
- Música y LUT (CapCut). Logos reales de Claude y CapCut.
- `motion/public/video-02oct/base30.mp4` pesa 1,5 GB: se puede borrar al cerrar el vídeo (se regenera con `scripts/base.py` + re-etiquetado a 30 fps).

## Cómo aplicar cambios
1. Corte → `scripts/cortes.py` (bloques y umbrales) → regenerar `base30.mp4`, `voz.py`, y seguir.
2. Cualquier gráfico, texto o sonido → `scripts/timeline.py` (todo va anclado al índice de palabra) → `python3 scripts/timeline.py proyectos/video-02oct`, y después **siempre** `python3 scripts/camara.py proyectos/video-02oct` (timeline.py borra `curva`).
2b. Solo zooms → parámetros y decisiones a mano al principio de `scripts/camara.py` (amplitudes, `MANUAL`, `BLOQUES`, `PREFERENTES`, `ZONA`) → `python3 scripts/camara.py proyectos/video-02oct --ver`.
3. Sonido → `python3 scripts/mezcla.py proyectos/video-02oct --kit` y `python3 scripts/entrega.py proyectos/video-02oct`.
4. Imagen → `cd motion && node render.mjs video Video02oct <salida> --hilos 4` (tramo: `--frames a-b`), y empaquetar con `scripts/empaquetar.sh`.
