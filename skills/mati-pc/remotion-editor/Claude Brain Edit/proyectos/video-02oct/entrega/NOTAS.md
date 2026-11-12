# Notas de entrega — video-02oct (intro «Editar vídeos con Claude y CapCut»)

`revision.mp4` es el vídeo ya montado (corte + zooms + transiciones + gráficos + subtítulos de énfasis + voz + SFX). Se puede usar tal cual; le faltan solo **música y LUT**, que se ponen en CapCut. El resto de la carpeta es el mismo vídeo separado por capas, por si quieres mover, alargar o quitar algo.

## 0. Versión 2 — zooms rehechos (2 de octubre, noche)
Solo ha cambiado la cámara. Los 57 gráficos, los textos, los 135 sonidos, los colores y las 8 transiciones son los mismos archivos de antes (`2_GRAFICOS/` y `3_SFX/` no se han tocado). Han cambiado `revision.mp4` y `1_VIDEO/`.

| | Antes | Ahora |
|---|---|---|
| Saltos de escala dentro de un plano | 63 cortes secos + 77 zooms de 5–7 fotogramas | **ninguno** |
| Mayor cambio de un fotograma al siguiente | 29 % | 0,97 % |
| Cómo es un zoom in | 15–36 % en 0,17 s | 7–12 % en ~0,6 s, con arranque y frenada, aterrizando en la palabra clave |
| Cómo es un zoom out | 10–38 % en 0,23 s | ~10 % en ~1,3 s |
| Cambio de escala en las 26 uniones reales del corte | hasta 26 % | ~8 % (hace falta: tapa el salto del metraje cortado) |
| Paneles a la izquierda | la cara saltaba al tercio derecho | la cámara viaja hasta allí en 0,7 s |

Detalle fotograma a fotograma: `trabajo/revision/ANALISIS_ZOOM.md` y la gráfica `trabajo/revision/zoom_antes_despues.png`. La versión anterior está guardada en `trabajo/revision/revision_v1_zooms_antiguos.mp4` por si quieres comparar.

## 1. Cómo montarlo en CapCut
1. Proyecto nuevo a **1920×1080 · 29,97 fps**.
2. Pista principal: `1_VIDEO/V01_00m00s00f_video_con_zooms_y_voz.mp4` desde 0:00 (ya lleva el corte, los zooms, las transiciones y la voz final).
3. Encima, los gráficos de `2_GRAFICOS/` (ProRes 4444 con transparencia): cada uno en el segundo que dice su nombre. Caben en **2 pistas** de superposición (`COLOCACION.md` dice cuál). No los escales: van a pantalla completa, posición 0,0.
4. Debajo, el audio: o bien `3_SFX/_pista_completa_sfx.wav` desde 0:00 (lo más rápido), o los efectos sueltos uno a uno.
5. Añade música y LUT (abajo) y exporta.

Si un gráfico saliera con fondo negro: `ffmpeg -i grafico.mov -c:v qtrle grafico_qtrle.mov`.

## 2. Color
- No hay LUT en `branding/luts/`. La imagen es de noche, con luz ámbar interior y azul de atardecer fuera: aguanta un LUT de contraste suave con negros un poco levantados.
- Empieza a **la mitad de intensidad (40–50 %)**. Si se nota, está fuerte. Cuidado con la camiseta blanca: es lo primero que se quema.
- Los gráficos van en lima `#D6FF3F` y lavanda `#8E9BFF` sobre oscuro: aplica el LUT **solo a la pista principal**, no a las superposiciones.

## 3. Música por bloques
Sin letra en todo el vídeo. Volumen de partida **12–15 % bajo la voz** (el gancho puede ir al 18 %). Toda con licencia.

| TC | Bloque | Energía | Qué hace la música | Términos de búsqueda |
|---|---|---|---|---|
| 0:00 | Gancho | Alta | Arranca ya en el golpe, sin intro. **Corte en seco en 0:06,5** (antes de «Claude») y vuelve con el impacto en 0:07 | electrónica con pulso, 120–128 BPM, «tech upbeat», «driving synth» |
| 0:11 | Sinceridad / la trampa | Media-baja | Baja y deja espacio; tensión sostenida hasta el sello «TRAMPA» (0:19,7), ahí un silencio de medio segundo | «tension underscore», «minimal pulse», 100–110 BPM |
| 0:37 | Promesa («editar vídeos con Claude») | Sube | Subida hasta 0:42,5 | misma pista del gancho, sección de subida |
| 0:57 | Editores / dinero | Media | Groove constante; acento en «$500» (1:14) | «confident corporate beat», 110–120 BPM |
| 1:22 | 3 razones | Media | Neutra y estable: es explicación | «light electronic bed», sin melodía protagonista |
| 1:50 | «El mejor vídeo de 2026» | Alta | Sube; pico en «CLAUDE + CAPCUT» (2:05) | sección alta de la pista principal |
| 2:27 | Horas y horas / 12 días | Media, emotiva | Baja un punto: es el esfuerzo personal | «inspiring minimal», piano + pulso suave |
| 3:04 | Quién soy | Baja-cálida | Suave y cercana | «warm lo-fi bed», 85–95 BPM |
| 3:41 | Suscríbete | Sube | Última subida; termina en el golpe de 3:52,9 para entrar al tutorial | cierre de la pista principal |

Si la pista es más corta que el vídeo, repite ciclos enteros de compases, sin fundido en la unión.

## 4. Capítulos (descripción de YouTube)
Esto es solo la intro. El primer capítulo sería `0:00 Todo esto lo ha editado Claude`; el resto depende del tutorial que va detrás.

## 5. Sonido
- Voz: corte de graves a 75 Hz + compresión suave, **−14,2 LUFS / −1,2 dBTP**. No lleva reductor de ruido (el margen voz/ruido medido es de ~35 dB: no hacía falta y mete artefactos). A/B al mismo volumen en `trabajo/audio/voz_final.wav` y `voz_sin_limpiar_mismo_volumen.wav`.
- SFX: 135 efectos de un pack de 19 sonidos **sintetizados** (sin samples ajenos, sin licencias que pedir), guardados en `recursos/sfx/`. Van claramente por debajo de la voz; solo los impactos de titular suben al nivel de la voz.
- Mezcla final: −14,1 LUFS / −1,0 dBTP.

## 6. Pendientes (decisiones tuyas)
1. **Escúchalo.** Yo mido el sonido pero no lo oigo: revisa sobre todo los cortes dentro de frase y si algún efecto te chirría (se quita o se cambia en un minuto).
2. **Estilo de marca:** he usado la opción **B · Eléctrico**. Si prefieres A o C, es cambiar `motion/src/tokens.ts` y volver a renderizar.
3. **«Llevo una semana…»** está cortado porque justo después dices «llevo 12 días». Si querías las dos frases, se recupera.
4. **«nivel de excelencia 200»** no está en pantalla (¿era «200 %»?).
5. **Logos reales** de Claude y CapCut: ahora van como texto. Si me dejas los PNG en `recursos/logos/`, los pongo.
6. **Miniaturas del bloque «trampa»:** son inventadas y genéricas (sin canales reales).
7. El último gráfico cubre hasta el final: no hay pantalla final porque detrás va el tutorial.
