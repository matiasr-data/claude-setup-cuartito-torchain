# Motor de gráficos

La arquitectura que funciona tiene tres capas: un cerebro que decide (Claude con esta skill), un transcriptor con marcas de tiempo por palabra, y un motor que convierte código en vídeo. El motor puede ser **Remotion** (React) o **HyperFrames** (HTML + GSAP); el perfil indica cuál. Los principios son los mismos.

## Principios
- **Plantillas parametrizables.** Cada tipo de gráfico (contador, lista, tachado, rótulo, cortinilla, ventana de captura…) es una plantilla con variables (texto, cifra, imagen, duración). Se crean una vez en `motion/` y se reutilizan; así todos los vídeos mantienen coherencia y cada gráfico nuevo es rápido.
- **Solo tokens del perfil.** Colores, fuentes y tamaños vienen de un archivo de tokens generado desde `perfil-creador.md`. Nunca valores escritos a mano en un gráfico, ni los valores por defecto del motor.
- **Un gráfico, una composición**, con la duración exacta del tramo del transcript.
- **Las plantillas se versionan por estilo.** Cuando el creador cambia de estilo, se crea un juego nuevo de plantillas (en Remotion, `motion/src/plantillas/<estilo>/`) y un motor de montaje nuevo que las use; las anteriores quedan congeladas con sus propios tokens (`TB`, `TC`…) para que un vídeo ya entregado se vuelva a renderizar exactamente igual. Nunca se restyla una plantilla antigua "por encima".
- **Capas del montaje con silueta y hoja.** El motor dibuja, de abajo arriba: vídeo con cámara → gráficos «detrás» (en el espacio del vídeo, se mueven con la cámara) → persona recortada (clips con alfa, solo en los tramos que lo usan, con halo en los golpes) → gráficos encima → lienzos a pantalla completa con sus gráficos (en el código del estilo D se llaman «hoja»: `zona: "hoja"`). La silueta se recorta con el motor de visión del Mac (`silueta.swift`) y los subtítulos que caen dentro de un lienzo llevan `papel: true`.
- **El texto se ajusta midiéndolo, nunca contando letras.** El ancho de una palabra no depende de cuántas letras tiene. Mide el ancho real renderizado y reduce el tamaño en pasos pequeños hasta que quepa (en Remotion: `fitText` / `measureText` de `@remotion/layout-utils`; en HTML: comparar `scrollWidth` con el ancho de la caja).

## Animación determinista
El render va fotograma a fotograma, así que toda animación tiene que depender del número de fotograma:
- **Remotion:** usa `useCurrentFrame()` con `interpolate()` o `spring()`. Nunca animaciones ni transiciones CSS: no avanzan con el render y salen congeladas.
- **HyperFrames:** toda animación en una única línea de tiempo de GSAP en pausa, publicada en `window.__timelines["main"]`, y el script termina con `tl.seek(0)`. Las animaciones CSS también salen congeladas, incluidos los fondos animados.

## Transparencia
Los gráficos se renderizan con canal alfa para superponerlos:
- **Formato:** `.mov` ProRes 4444 con alfa, que es el que CapCut importa bien.
- **Remotion:** `npx remotion render <Composicion> salida.mov --codec=prores --prores-profile=4444 --image-format=png --pixel-format=yuva444p10le`
- **Si un gráfico aparece con fondo negro en CapCut**, vuelve a exportarlo como QuickTime Animation: `ffmpeg -i grafico.mov -c:v qtrle grafico_qtrle.mov`.

## Colocación
Guarda la colocación de todos los elementos (gráficos, subtítulos, SFX) en un único `proyectos/<nombre>/trabajo/timeline.json` con pista, capa, inicio y duración. Es la fuente de verdad: la vista previa, la entrega y las notas se generan desde ahí. Dos gráficos que se solapan en el tiempo van en capas distintas.

## Revisión barata antes del render
Antes de renderizar un gráfico completo, renderiza un solo fotograma en el momento de máxima información (Remotion: `npx remotion still`) y revísalo. Un fotograma tarda segundos; un render, minutos.
