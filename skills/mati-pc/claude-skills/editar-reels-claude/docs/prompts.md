# Prompts de la guía «Reels paso a paso» · Viegas Estudio

Con la skill instalada solo necesitas los de la primera parte. Los de «Por dentro» son el modo manual: lo que hace la skill en cada pasada.

## Con la skill

### 1. Instalar la skill
*Paso 4 · con el zip descargado*

```text
Instala la skill que hay en este zip: «ruta del zip, por ejemplo Descargas\editar-reels-claude.zip». Descomprímela en mi carpeta de skills de Claude Code (.claude/skills), comprueba que queda editar-reels-claude/SKILL.md y avísame cuando esté lista.
```

### 2. Comprobar mi equipo
*Paso 4 · en una sesión nueva*

```text
Usa la skill editar-reels-claude para comprobar mi equipo. Dime qué me falta y para qué sirve cada cosa, y ayúdame a instalarlo paso a paso. Pídeme permiso antes de instalar nada.
```

### 3. Crear mi carpeta de reels
*Paso 5 · una sola vez*

```text
Usa la skill editar-reels-claude para crear mi carpeta de reels en Documentos.
```

### 4. Editar mi reel
*Paso 7 · cada vez que grabes*

```text
Usa la skill editar-reels-claude para editar mi última toma de la carpeta Tomas.
```

### 5. Revisión final antes de publicar
*Paso 9 · antes de publicar*

```text
Revisión final antes de publicar. Comprueba cada punto y dame un informe con ✓ o ✗:
1. Ningún texto ni gráfico importante dentro de los 220 px de arriba, los 380 px de abajo o los 140 px de la derecha.
2. Ningún subtítulo dura menos de 0,4 s.
3. Nada tapa mi cara en ningún fotograma.
4. Todo cumple mi guía de estilo: fuentes, colores y movimiento.
5. Volumen: −14 LUFS integrados y pico real por debajo de −1 dB (mídelos).
6. La portada tiene una palabra grande, legible en miniatura.
Arregla lo que falle, vuelve a exportar y dime qué has cambiado.
```

### 6. Arreglar un error
*Ayuda · cuando algo falle*

```text
Ha fallado esto: «pega aquí el error o describe qué ha pasado». Usa la skill editar-reels-claude para averiguar la causa, explícamela en sencillo y arréglalo. Pídeme permiso antes de instalar o borrar nada.
```

## Por dentro · modo manual

### 7. Guía de estilo · con referencias
*Por dentro · subiendo capturas y vídeos*

```text
Antes de editar, vamos a crear mi guía de estilo para reels. Te adjunto referencias: capturas de mis vídeos o de mi marca, vídeos que me gustan y, si los tengo, mi logo, mis colores y mis fuentes.

1. Analiza todo lo que te subo:
- Capturas: saca la paleta exacta en HEX, el tipo de letra (o la fuente de Google Fonts más parecida), el tamaño y la posición de los textos y cómo son los subtítulos.
- Vídeos: mide con ffmpeg el ritmo (cortes por minuto y duración media de cada plano). Si hay algo que no puedes ver en un vídeo, dímelo y te paso capturas o te lo describo.
- Enséñame en una tabla qué has detectado en cada referencia.

2. Después hazme las preguntas que falten, de 3 en 3 y con opciones para elegir. Cubre: público y tono, colores, tipografía, subtítulos, motion graphics, ritmo de edición, música y efectos de sonido, logo y marcas, y lo que nunca debe aparecer.

3. Cuando lo tengas, escribe la guía completa en un archivo Reglas-de-estilo.md con estas secciones: Marca y tono, Lienzo y zona segura, Tipografía, Color, Subtítulos, Motion graphics, Ritmo y cortes, Sonido, Marcas y logos, Prohibido. Cada regla tiene que ser concreta y medible (tamaños en px, tiempos en segundos, colores en HEX), sin frases vagas.

4. Renderiza un fotograma de muestra de 1080×1920 aplicando la guía (con subtítulo y palabra clave) para que lo vea.

Empieza confirmando qué te he subido.
```

### 8. Guía de estilo · desde cero
*Por dentro · sin referencias ni marca*

```text
No tengo guía de estilo ni referencias. Créala conmigo desde cero.

1. Hazme 6 preguntas, de una en una y con opciones para elegir: de qué trata mi contenido, para quién es, qué sensación quiero transmitir (por ejemplo: premium, cercana, enérgica o técnica), qué creadores o marcas me gustan, si ya tengo algún color o logo, y en qué red publico más.

2. Con mis respuestas, propón 3 estilos distintos. Para cada uno: un nombre, una paleta de 4 colores en HEX, 2 fuentes de Google Fonts, cómo son los subtítulos, cómo se mueven los gráficos, el ritmo de cortes y el tipo de sonido. Renderiza un fotograma de muestra de 1080×1920 de cada estilo.

3. Cuando elija uno (o mezcle dos), escribe la guía completa en un archivo Reglas-de-estilo.md con estas secciones: Marca y tono, Lienzo y zona segura, Tipografía, Color, Subtítulos, Motion graphics, Ritmo y cortes, Sonido, Marcas y logos, Prohibido. Cada regla tiene que ser concreta y medible (tamaños en px, tiempos en segundos, colores en HEX).

Empieza con la primera pregunta.
```

### 9. Configurar a Claude como editor
*Por dentro · con el vídeo subido*

```text
Eres mi editor de reels. Vamos a editar el vídeo que te acabo de subir en 5 pasadas, siempre en este orden:
1) transcribir y ajustar el corte
2) recortarme del fondo
3) subtítulos
4) motion graphics
5) sonido

Al terminar cada pasada, renderiza una vista previa en MP4 y espera mis notas. No pases a la siguiente pasada hasta que te escriba «siguiente».

CÓMO TRABAJAR
- Todo en código: Python y ffmpeg para el vídeo y el audio; HTML/CSS/JS para los gráficos, renderizados fotograma a fotograma.
- Crea una carpeta de proyecto con cada pieza por separado (transcripción, recorte, capas y renders), para que cambiar una pasada no rompa las demás.
- Si algo no está claro, pregúntame antes de seguir.

FORMATO DE SALIDA
- 1080×1920, 30 fps, H.264, audio a −14 LUFS.
- Zona segura de Instagram: nada importante en los 220 px de arriba, los 380 px de abajo ni los 140 px de la derecha.

ESTILO
- Sigue al pie de la letra mi guía Reglas-de-estilo.md (la que hemos creado en este chat o la que te he adjuntado).
- Si una instrucción mía choca con la guía, pregúntame cuál manda.

Si lo has entendido, resúmeme el plan en 5 líneas y espera mi primera instrucción.
```

### 10. Pasada 1A · Transcribir
*Por dentro · sin cortar todavía*

```text
Pasada 1, parte A. Sin cortar nada todavía:
1. Transcribe el vídeo palabra a palabra con Whisper (tiempos por palabra) y guárdalo como words.json, con el inicio y el fin de cada palabra en segundos.
2. Enséñame la transcripción en una tabla (número, palabra, inicio, fin) para que corrija marcas, nombres y términos técnicos.
3. Lístame todas las pausas de más de 0,4 s y cada tartamudeo o toma repetida, con su inicio y su fin.
Espera mis correcciones.
```

### 11. Pasada 1B · Cortar
*Por dentro · después de revisar la tabla*

```text
Correcciones (si no hay, borra esta línea): [palabra mal → palabra bien]
Aplica las correcciones en words.json. Después corta todas las pausas de más de 0,4 s y las tomas repetidas (quédate con la última toma buena). Deja ~0,1 s de respiración a cada lado de cada corte. Recalcula words.json para el vídeo cortado, renderiza una vista previa y dime cuánto dura antes y después.
```

### 12. Pasada 2 · Recortarte del fondo
*Por dentro*

```text
Pasada 2. Sepárame del fondo en cada fotograma:
- Usa un modelo de recorte de vídeo (RobustVideoMatting o similar) y guarda el mate como una secuencia aparte para reutilizarlo en las demás pasadas.
- Bordes suaves con una luz de borde ligera. Sin contorno blanco ni brillo.
- Sin agujeros en el cuerpo ni en las manos, y conservando el detalle del pelo.
Antes de seguir, renderiza dos pruebas de 3 segundos: yo sobre un tablero de ajedrez, y yo sobre el fondo de mi guía de estilo con la palabra «PRUEBA» en grande detrás de mi cabeza.
```

### 13. Pasada 3 · Subtítulos
*Por dentro*

```text
Pasada 3. Subtítulos a partir de words.json y con el estilo de mi guía:
- De 1 a 3 palabras a la vez; cada palabra aparece justo cuando la digo.
- Una palabra clave por frase, en grande con mi estilo de palabra clave; el resto, pequeño.
- Cada subtítulo, mínimo 0,4 s en pantalla.
- Nunca encima de mi cara: a la altura del pecho, dentro de la zona segura.
Antes de renderizar, enséñame la lista de palabras clave elegidas (una por frase) y espera mi OK.
```

### 14. Pasada 4A · Plan de gráficos
*Por dentro · sin construir nada*

```text
Pasada 4, parte A: el plan. Lee la transcripción y propón los motion graphics en una tabla con 4 columnas: lo que digo, el tiempo exacto, qué aparece en pantalla y por qué.
Reglas: un gráfico por idea, disparado en su palabra; contenido real (capturas, demos, logos oficiales) antes que inventado; cifras siempre con fuente; nada encima de mi cara; todo con el estilo de mi guía.
No construyas nada todavía. Espera a que apruebe o cambie filas.
```

### 15. Pasada 4B · Construir los gráficos
*Por dentro · con el plan aprobado*

```text
Plan aprobado. Pasada 4, parte B: constrúyelo con el estilo de mi guía.
- Cada escena en HTML/CSS/JS, renderizada fotograma a fotograma y disparada en su palabra de words.json.
- Compón cada gráfico con mi recorte, detrás o delante de mí según el plan.
- Una sola idea en pantalla: entrada de 0,2 a 0,35 s con frenado suave, se mantiene y sale limpia.
- Títulos, pasos y enseñanzas clave a pantalla completa con fondo limpio.
- Zooms: corte seco para enfatizar, lento para crear tensión y rápido con desenfoque de movimiento para dar energía. Punch-in de 6 % como mucho. Cada zoom necesita una razón.
Renderiza una vista previa.
```

### 16. Pasada 5 · Sonido y exportación
*Por dentro*

```text
Pasada 5: sonido, con las reglas de sonido de mi guía.
- Efectos según el plan: un golpe en el gancho, un tap en cada clic, un whoosh en cada cambio de escena y un chime al cierre.
- Efectos discretos: entre 20 y 25 dB por debajo de mi voz. Que acompañen, que no tapen.
- Mi voz siempre encima. Si hay música, bájala automáticamente mientras hablo (ducking).
- Limpia la voz: quita graves de fondo y siseo.
- Masteriza a −14 LUFS integrados con el pico real por debajo de −1 dB.
- Exporta el MP4 final a 1080×1920 y un fotograma de portada en PNG.
Dime los valores finales de LUFS y de pico.
```

### 17. Pasada 5 · Música de fondo con SynthFlow
*Por dentro · adjuntando synthflow.html*

```text
Te adjunto synthflow.html, mi generador de música y efectos por síntesis. Úsalo para la música de fondo:
1. Ábrelo en Chrome sin interfaz (Puppeteer), elige el género «Synthwave 80s» con selectGenre('synthwave') y llama a renderProceduralTrackOffline(duración del vídeo + 2 s, 48000). Guarda el resultado como WAV con encodeAudioBufferToWAV.
2. Si alguna función no carga, revisa los errores de la consola y arréglalos en una copia, nunca en mi archivo.
3. Mézclala 12 dB por debajo de mi voz y con ducking: que baje 7 dB más mientras hablo (ataque 40 ms, relajación 450 ms), con entrada de 0,6 s y fundido final de 1,5 s.
4. Vuelve a masterizar a −14 LUFS con el pico por debajo de −1 dB y dime los valores.
```
