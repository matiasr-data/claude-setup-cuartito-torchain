# Cómo analizar un vídeo de referencia

Objetivo: entender **la lógica** de la edición de un vídeo, no su contenido ni su estética. Se analiza para aplicar el porqué ("mete un zoom porque la frase anterior ha cerrado una idea y hay que reenganchar"), no para calcar el qué ("mete un zoom aquí").

El análisis tiene dos piezas: **medir** (los scripts cuentan, no opinan) y **leer** (el prompt de abajo convierte las cifras en una receta aplicable).

## El prompt de análisis
Úsalo como guía de todo el análisis:

```
Analiza la EDICIÓN de este vídeo, no su contenido. Actúa como editor con 20 años de
experiencia analizando vídeos virales de YouTube. Lo que retiene en este vídeo no es lo
que cuenta, porque eso lo cuentan muchos, sino cómo está editado.

Material: <vídeo> + <transcript con marcas de tiempo>.

Quiero la LÓGICA, no el proceso ni la estética:
· por qué cae un corte donde cae, no cuántos cortes hay
· por qué ese sonido en ese instante, y por qué los demás cortes van mudos
· por qué ese gráfico y no otro, y qué palabra del guion lo dispara
· qué problema de atención resuelve cada decisión

NO quiero colores, fuentes ni nombres de efectos, salvo como dato de apoyo.

Mide antes de opinar. Para cada apartado, di si el dato sale de medir el archivo o de
mirarlo: cortes y su cadencia · zoom (dirección y %) · golpes de sonido con su nivel
respecto a la voz y si caen sobre un corte · texto en pantalla (cuándo y cuánto) · tipos
de plano y su alternancia · estructura en capítulos.

Cruza cada evento con el transcript: qué se estaba diciendo en ese momento.

Al final, tres listas:
1. Lo que SÍ hace, en forma de receta aplicable.
2. Lo que NO hace, que es igual de importante.
3. Lo que no has podido medir y por qué. No rellenes huecos con impresiones
   que suenen bien.
```

Tres frases sostienen este prompt; no las pierdas al adaptarlo: "no es por lo que cuenta sino por la edición" (separa forma de contenido), "no colores, no fuentes" (pide el porqué, no la paleta) y "la lógica, no el proceso".

## Proceso

**1. Material.** El vídeo en `referencias/<nombre>/` y su transcript con marcas de tiempo (si no lo hay, transcríbelo por palabra). Si el vídeo es una grabación de pantalla de un reproductor, recorta a la zona del vídeo: la interfaz del navegador no es edición.

**2. Medir.**
```bash
scripts/extraer_frames.sh referencias/<nombre>/video.mp4 referencias/<nombre>/datos
scripts/medir_ritmo.py referencias/<nombre>/datos
scripts/medir_sonido.py referencias/<nombre>/video.mp4 referencias/<nombre>/datos
```
Obtienes: cortes y cadencia (ritmo.json), un primer y último fotograma de cada plano (para el zoom), frames a intervalos, y los golpes de sonido con su nivel respecto a la voz, su color (grave = impacto, agudo = aire/whoosh) y si caen en un corte (sonido.json).

**3. Excluir lo que no es edición del autor.** Anuncios insertados, interrupciones, intros de otra gente. Inflan los cortes y los golpes. Vuelve a medir con `--excluir` y dilo en la ficha.

**4. Verificar a ojo lo que el medidor no puede afirmar.** La detección de cortes puede marcar de más con movimientos fuertes: revisa los fotogramas de `cortes/` si una cifra parece rara. El zoom se mide comparando el primer y el último fotograma de cada plano (`planos/`): dirección y porcentaje aproximado. Desconfía de cualquier zoom aparente por encima del ~15 %: suele ser un cambio de contenido, no un zoom.

**5. Clasificar los tipos de plano.** A mano, muestreando fotogramas repartidos por todo el vídeo: cara, pantalla, b-roll de metáfora, b-roll real, cortinilla, gráfico a pantalla completa… y cómo se alternan. Es el hallazgo más valioso y ningún medidor lo da.

**6. Cruzar con el transcript.** Para cada evento relevante (corte, golpe, gráfico, texto, zoom), qué se estaba diciendo. Ahí aparecen los disparadores y la lógica.

**7. Escribir.**
- `ANALISIS.md`: la línea de tiempo detallada, tramo a tramo.
- `ficha-estilo.md`: con `templates/ficha-estilo.md`, en ese orden. Los apartados "Lo que NO hace" y "Qué no he podido medir" son los que más valen y los primeros que se caen si se escribe deprisa: las ausencias son decisiones, y sin lo no medido la ficha miente por omisión.

**8. Registrar.** Añade una línea a `referencias/indice.md` (nombre, fecha, tipo de vídeo, tesis en una frase).

## Varias referencias: cuidado con las copias
Que un patrón se repita en varios vídeos no lo confirma si esos vídeos se han copiado entre sí (mismo guion, mismos trucos en el mismo orden, el mismo vídeo doblado). Antes de tratar un patrón como principio, comprueba que las fuentes son independientes.

## Límites
- El reparto exacto de tiempo por tipo de plano se estima muestreando.
- Con voz y música en la misma pista, el nivel absoluto de la música es aproximado.
- El detector de golpes puede confundir el arranque de una frase con un golpe: verifica escuchando los que importen.
- El zoom por encima del ~15 % no es fiable sin mirarlo.
