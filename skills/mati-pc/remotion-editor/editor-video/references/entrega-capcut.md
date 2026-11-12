# Entrega para CapCut

Por defecto se entrega un **kit por capas**, no un vídeo único: así el creador puede mover, alargar o quitar cualquier pieza en CapCut sin volver a renderizar, y añadir allí el LUT y la banda sonora. Si el perfil pide `entrega: video-unico`, renderiza todo junto y entrega también las notas.

## Estructura
```
proyectos/<nombre>/entrega/
├── 1_VIDEO/        clips en orden, uno por tramo, con la voz final dentro
├── 2_GRAFICOS/     un .mov ProRes 4444 con alfa por gráfico (y la capa de subtítulos)
├── 3_SFX/          un .wav 48 kHz / 24 bit por efecto, ya a su nivel
├── COLOCACION.md   qué archivo va en qué pista y en qué segundo (+ .csv)
├── NOTAS.md        LUT, música por bloques, capítulos para la descripción
├── subtitulos.srt  para subir a YouTube
└── revision.mp4    todo montado, solo para ver el resultado
```

- El **nombre de cada archivo lleva su posición** (ej. `G012_00m42s15f_contador.mov`), así que aunque se pierda `COLOCACION.md` el nombre dice dónde va.
- **Pistas en CapCut:** principal = los clips de `1_VIDEO` seguidos sin huecos; superposiciones (encima) = gráficos, en capas distintas si se solapan; audio (debajo) = SFX. Música y LUT los añade el creador.
- `revision.mp4` sirve para ver cómo queda; el trabajo final se monta con las capas.

## NOTAS.md
1. **Cómo montarlo** en CapCut, en 4-5 pasos.
2. **Color:** qué LUT del perfil aplicar y a qué intensidad de partida. Recuerda: si se nota, está fuerte; empieza alrededor de la mitad.
3. **Música por bloques:** tabla con marca de tiempo, bloque, energía, volumen sugerido y si sube, baja o corta (ver `musica.md`).
4. **Capítulos** para la descripción de YouTube (si es un vídeo público).
5. **Pendientes**, si queda algo por decidir.

## Antes de anunciar la entrega
Pasa la checklist de `revision-y-calidad.md`, comprueba con `ffprobe` que cada archivo se abre y está completo, y comunica la ruta exacta. Guárdala en la carpeta de entrega que indique el perfil.
