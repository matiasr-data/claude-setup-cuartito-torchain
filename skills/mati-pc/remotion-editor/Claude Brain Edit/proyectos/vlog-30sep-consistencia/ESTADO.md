# ESTADO — vlog-30sep-consistencia

Bruto: `brutos/DJI_20260930202212_0041_D.MP4` (4K, 29,97 fps, HEVC, 7:12). No se modifica.
Antes de cualquier comando: `source .herramientas/entorno.sh` (FFmpeg, ffprobe y Whisper locales).

## Paso actual
**Paso 2 — Hoja de edición. PUNTO DE CONTROL: esperando al creador** (`HOJA.md`, 8 preguntas al final).
El modo Configuración también está abierto: `perfil-creador.md` es un borrador con valores propuestos y pendientes.

## Hecho
- [x] Configuración: skill instalada en `.claude/skills/editor-video/`, carpetas creadas, motor Remotion en `motion/` con render de prueba con alfa verificado (ProRes 4444, fondo gris visible).
- [x] 1. Ingesta: transcript por palabra del bruto (`trabajo/transcript_whisper_raw.json`, `trabajo/palabras_raw.json`) y del montaje (`trabajo/transcript_montaje_raw.json`, `trabajo/palabras_montaje_raw.json`). Corregido en `TRANSCRIPT.md`; 4 frases con duda.
- [x] 2. Formato (`vlog`) y hoja de edición (`HOJA.md`).
- [~] 3. Corte: PROPUESTO en `trabajo/cortes.json`, montado solo como vista previa (`trabajo/previa_corte.mp4`, 540p). Sin aprobar.
- [~] 4. Voz: cadena aplicada en la previa (`trabajo/scripts/voz.sh` + `montar.py`). A/B en `trabajo/audio/`. Sin aprobar; nadie lo ha escuchado.
- [ ] 5. Gráficos — bloqueado por la elección de estilo (`branding/opciones/estilo_A|B|C.png`).
- [ ] 6. Subtítulos (`.srt` + 6 de énfasis)
- [ ] 7. Sonido — `recursos/sfx/` vacío
- [ ] 8. Revisión
- [ ] 9. Entrega (kit CapCut)

## Decisiones
- Motor de gráficos: Remotion (lo indicó el creador).
- Inicio de palabra = marca DTW de Whisper (los tiempos de token normales se desvían hasta 7 s en silencios largos). Los puntos de corte se eligen sobre la envolvente de energía, no sobre la marca de la palabra.
- Volumen medido siempre en estéreo (doble mono): en mono la lectura sale 3 dB más baja y se sobrecomprime.
- Normalización con ganancia fija + limitador; el modo dinámico de `loudnorm` bombeaba el ruido.
- Reencuadre centrado en (0,565, 0,40) del cuadro; zoom alterno 100 / 112 % en cada unión.

## Pendientes / riesgos
- Las 8 preguntas de `HOJA.md`.
- El A/B de voz no está escuchado.
- La exposición y el color del bruto cambian solos (luz del monitor): los saltos de corte lo delatan; anotar en NOTAS.md para el LUT.
- Al aprobar el corte: volver a montar `1_VIDEO` a resolución de entrega (la previa es 540p) y regenerar `palabras_montaje_raw.json` si cambian los cortes.
- `drawtext` de FFmpeg necesita `FONTCONFIG_FILE` (lo pone `entorno.sh`); sin él, `hoja_contactos.sh` y `rejilla.sh` avisan de fontconfig.

## Cómo retomar
1. Volcar las respuestas al perfil (roles de diseño → `motion/src/tokens.ts`).
2. Ajustar `trabajo/cortes.json` → `python3 trabajo/scripts/montar.py <proyecto> <salida> 1080 --ab`.
3. Paso 5: primer gráfico de cada serie → aprobación → resto.
