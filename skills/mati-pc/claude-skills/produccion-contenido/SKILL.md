---
name: produccion-contenido
description: Método para planificar, producir, verificar y entregar piezas de contenido (reels, carruseles, historias, videos explicativos, series) sin errores de datos ni de sonido. Plan previo con hoja de datos fijos, coherencia visual y de voz en toda la serie, subtítulos sacados del audio final, verificación medida del archivo terminado (silencios, negros, volumen −14 LUFS, duración, formato) y revisión letra por letra de cifras y textos en pantalla. Úsala antes y después de editar cualquier pieza, cuando pidan "hacé un reel/carrusel sobre X", "prepará la serie", "revisá antes de publicar", o al combinar varias piezas que deben coincidir en datos y estilo. Complementa a editar-reels-claude y motion-graphics-claude (ellas editan; esta planifica y verifica).
---

# Producción de contenido

Adaptada de las skills `production` y `edited-film` de WanGP (deepbeepmeep, WanGP Community License, uso propio) para trabajar con las herramientas de este equipo: ffmpeg, Python, Remotion/HyperFrames, editar-reels-claude y motion-graphics-claude.

El usuario describe el resultado; el método es tuyo. Aplicalo sin que te lo pidan.

**Rutas.** `{SKILL}` es la carpeta de esta skill (normalmente `~/.claude/skills/produccion-contenido`). Script de medición: `{SKILL}/scripts/verificar_video.py`.

## 0. Leé las reglas del proyecto

Antes de nada, leé el `CLAUDE.md` del proyecto (por ejemplo `contenido-minero/CLAUDE.md`): ahí están el tono, la estructura de carpetas, los nombres de archivo y las **reglas de datos**. Mandan sobre esta skill cuando chocan.

## 1. Planificar primero

Antes de generar o editar, escribí un plan corto en el archivo de producción de la pieza (en contenido-minero: `produccion/reel-NN-tema.md`):

- **Entregables**: qué archivos salen (MP4 vertical 1080×1920, PDF para LinkedIn, PNG de historias, leyenda) y dónde quedan.
- **Hoja de datos fijos**: cada cifra, nombre, fecha, porcentaje y unidad que va a aparecer, **con su fuente y fecha**, y si es dato real o simulado. Todo lo que se dice o se muestra sale de esta hoja; nada se escribe de memoria.
- **Lista de tomas o láminas**: para cada una, duración, qué se ve, qué se escucha y qué texto va en pantalla. Un inserto va justo donde la voz nombra lo que muestra.
- **Lo que se hace una vez y se reutiliza**: tipografía, paleta, logo, voz del narrador, música, plantilla de portada.
- **Ritmo según el formato**: en reels de 30 a 40 s el plano cambia cada 2 a 4 s. Un plano largo tiene que valer la pena mirarlo ese tiempo.

Si algo cambia, actualizá el plan primero y después la pieza.

## 2. Producir con coherencia

- **Una tipografía y una paleta por serie**, iguales en todas las piezas y en portada, láminas y cierres. Si el proyecto tiene guía de estilo, usala.
- **Una voz por narrador** en toda la serie. Si es voz sintética, generá una muestra una vez y usá siempre esa misma; describirla de nuevo en cada línea da otra voz.
- **Texto en pantalla dibujado**, no generado por IA: títulos, cifras, rótulos y gráficas se hacen en código (Remotion, HyperFrames, SVG, Pillow). Los modelos de imagen y video escriben mal letras y números.
- **Cifras con contexto**: unidad, período y alcance a la vista (por ejemplo "mina completa" o "parte de Barrick, 50%"). Los datos simulados llevan el rótulo "datos simulados".
- **Sonido bajo todo el video**: música o ambiente de principio a fin, salvo que se pida silencio. La música baja (ducking) cuando hay voz. Un tramo mudo medido es un defecto que hay que corregir, no una pregunta para el usuario.
- **Música al menos tan larga como el corte final**. Si se agregan tomas, revisá que siga alcanzando.
- **Subtítulos tomados del audio final**, nunca estimados: transcribí el MP4 terminado (por ejemplo con `editar-reels-claude/scripts/transcribe.py`) y corregí la ortografía de los nombres según el guion sin mover los tiempos. Para Instagram van integrados en el video; si la plataforma acepta pista de subtítulos (YouTube, LinkedIn), mejor un SRT aparte.
- **Láminas a pantalla completa** (portada, cierre, capítulo) no deben tapar una frase: compará sus tiempos con los de los subtítulos.

## 3. Verificar antes de entregar

Medí el archivo terminado:

```bash
python "{SKILL}/scripts/verificar_video.py" "<ruta al MP4>" --duracion 30-40 --formato 1080x1920
```

El informe da duración, resolución, fps, volumen integrado (objetivo −14 LUFS ±1 para redes), pico verdadero (≤ −1 dBTP), tramos en silencio y tramos en negro. Las mediciones mandan sobre la impresión: corregí lo que falle o explicá por qué es intencional.

Después revisá a mano:

1. **Cifras y textos letra por letra**: extraé fotogramas al inicio, medio y final de cada texto en pantalla (`ffmpeg -ss <t> -i video.mp4 -frames:v 1 f.png`), hacé zoom y compará carácter por carácter con la hoja de datos. Lo que el usuario dictó (título, eslogan, palabra del CTA, nombres) se copia literal de su mensaje.
2. **Guion contra audio**: la transcripción del final dice lo mismo que el guion, sin frases cortadas.
3. **Coherencia de serie**: misma tipografía, paleta, logo, voz y estilo de portada que las piezas anteriores.
4. **Leyenda del posteo**: sigue el orden del proyecto (gancho, resumen, CTA, hashtags) y el CTA coincide con la palabra del video y con el recurso que se envía.
5. **Datos vigentes**: si la pieza usa datos periódicos (trimestrales, mensuales), revisá si salió un informe más nuevo antes de publicar.
6. **Hecho, inferencia o supuesto**: marcá cada afirmación del guion, la leyenda y los textos en pantalla según la tabla de `{SKILL}/references/hechos-y-supuestos.md`. Un hecho necesita fuente primaria y fecha. Una inferencia se dice como tal ("coincide con", "probablemente"). Un supuesto no se publica. Dejá la tabla en el archivo de producción.
7. **Que no suene a IA**: pasá guion, leyenda y textos por la lista de `{SKILL}/references/anti-texto-ia.md` y reescribí lo que falle, en español rioplatense y sin cambiar ninguna cifra.

Un cambio puede romper una verificación anterior: después de cada cambio, verificá todo de nuevo (agregar tomas deja la música corta; mover una toma deja una lámina tapando una frase).

Si algo falla dos veces por la misma causa, cambiá de enfoque en vez de repetir: plano más corto, otra plantilla, otro recurso visual o reportar el límite. Anotá cada intento y su resultado en el plan.

## 4. Entregar

- **Un pedido, una entrega**: hacé todos los cambios, verificá y exportá una sola vez. No exportes versiones de prueba a la carpeta final.
- Informá: entregables con su ruta, cómo se hizo cada uno, **qué se verificó con los valores medidos** (por ejemplo "−14,2 LUFS, 36,4 s, sin silencios") y cualquier límite que quede. Decí solo lo que comprobaste.
- Llamá "pedido" solo a lo que pidió el usuario; tus decisiones y los valores por defecto se nombran como tales.
