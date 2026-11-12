---
name: motion-graphics-claude
description: "Crea motion graphics en código desde Claude Code y entrega MP4 a 60 fps. Cinco familias: 3D con three.js (logo extruido, mascota de Claude, cámara de cine, bokeh, desenfoque de movimiento), 2D y textos animados (tipografía cinética, contadores, gráficas), cámara y transiciones (zoom a través, órbita, recorrido), explicar servicios, webs o edición de vídeo (interfaz animada, flujo, editor con línea de tiempo) y reels con una persona hablando (palabras clave, tarjetas, PiP, lista y CTA sincronizados a la voz sin tapar la cara; capas para editar-reels-claude). 8 estilos de color. Entrevista corta, comprueba el equipo e instala solo con permiso, previa y render final. Úsala cuando pidan una animación, motion graphic, intro, logo animado, escena 3D, lower third, gráfica, texto animado, transición, «explica mi web/app/servicio en vídeo» o «anima mi reel», aunque no nombren la skill. Kit gratuito de Viegas Estudio."
---

# motion-graphics-claude · animaciones en código con Claude Code

Cada animación es una **página HTML** que se dibuja fotograma a fotograma (`window.seek(t)`). Chrome sin ventana la
fotografía y ffmpeg la convierte en **MP4**. El resultado es exacto y repetible, y el HTML se queda como plantilla editable.

Todas las rutas de este documento son **relativas a la carpeta de la skill** (`<skill>` = la carpeta donde está este
SKILL.md, normalmente `~/.claude/skills/motion-graphics-claude`). En Windows usa `python`; en Mac, `python3`.

## 0. La primera vez: comprobar el equipo (siempre antes de nada)
1. Ejecuta `python <skill>/scripts/preparar.py --json`.
2. Si `listo` es `false`, enseña **la lista de lo que falta en lenguaje claro** (Node.js, ffmpeg, Playwright, Chrome…)
   y **pide permiso** antes de instalar. Solo con un «sí»: `python <skill>/scripts/preparar.py --instalar --prueba`.
   Instala con winget (Windows) o Homebrew (Mac), y Playwright con npm en la carpeta de trabajo
   (`Documentos/Motion Graphics`). Al final renderiza una prueba de 2 s.
3. **Nunca instales nada sin permiso.** Lo opcional (GPU NVIDIA, yt-dlp, OpenCV) no bloquea: solo di qué mejora.
4. Los proyectos se crean **dentro de la carpeta de trabajo** (`Documentos/Motion Graphics/<proyecto>`): ahí está Playwright.

## 1. Entrevista corta (un solo mensaje, máx. 4 preguntas)
Pregunta solo lo que cambia el resultado y propón una opción por defecto en cada una:
1. **¿Qué quieres animar?** (un intro, tu logo, una frase, una lista, unas cifras, tu web/app, un proceso…) y para qué
   (Reel, YouTube, anuncio, presentación). ¿Duración? ¿Va con voz? (si va con voz, los tiempos de las frases).
2. **Formato:** 9:16 vertical (1080×1920, Reels/TikTok/Shorts) · 16:9 horizontal (1920×1080, YouTube) · 1:1 (1080×1080)
   · 4:5 (1080×1350, carrusel).
3. **Familia y estilo:** enséñale las 5 familias de la tabla de abajo (MP4 en `muestras/`) y los 8 estilos de color (sección 2b,
   hoja `muestras/estilos-8-temas-flujo-nodos.jpg`). Por defecto: Viegas oscuro.
4. **Recursos:** ¿tienes logo (SVG o PNG), capturas, vídeos, colores o fuente de tu marca? ¿Hay una **referencia**
   (vídeo o enlace) que quieras imitar? Si no tiene nada, usa los del kit.

## 2. Las 5 familias de estilo y sus ejemplos (`ejemplos/escenas/`)
Parte **siempre** del ejemplo que más se parezca y cambia solo textos, colores, parámetros y tiempos. Los marcados con ★
tienen render de muestra en `muestras/`.

| Familia | Ejemplos (nombre = `--plantilla`) | Qué hacen |
|---|---|---|
| **1 · 3D con three.js** | ★`3d-asterisco` · ★`3d-mascota-salto` · `3d-titular` · `producto-3d` · `3d-barras` · `3d-telefono` · `logo-3d` | logo de Claude extruido que se arma en piezas · la mascota de Claude Code saltando y saludando · titular 3D letra a letra · dispositivo 3D con vídeo · columnas de cristal · teléfono con tu reel · tu logo en 3D. Luces de estudio, bokeh, profundidad de campo y desenfoque de movimiento reales |
| **2 · 2D y textos animados** | ★`estadistica-gigante` · `frase-cinetica` · `donut-grafico` · `lista-escalonada` · `rejilla-estilos` | contador gigante + gráfica de barras/línea · tipografía cinética palabra a palabra · gráfica de donut con leyenda · lista que entra fila a fila · rejilla de tarjetas |
| **3 · Cámara y transiciones** | ★`3d-cubo-transicion` · `texto-tunel` · `3d-red-globo` · `carrusel-ovalado` · `cierre-titulo` | transición «zoom a través» girando un prisma con desenfoque · recorrido de cámara por un túnel de texto · órbita alrededor de un globo con logos conectados · carrusel 3D · cierre con título que avanza a cámara |
| **4 · Explicar servicios, webs y edición de vídeo** | ★`pantalla-3d` (interfaz `editor-video`) · `cursor-demo` · `flujo-nodos` · `pantalla-3d-reel` (interfaz `terminal-claude`) · `chat-claude` · `proceso-pasos` | demo de editor de vídeo con línea de tiempo, en 3D, con la cámara sobrevolándola · app con cursor que hace clic y publica · flujo de un servicio en nodos con ✓ · terminal de Claude Code en vertical · chat con Claude · proceso en 4 pasos |
| **5 · Reels con persona hablando** (9:16, 60 fps) | ★`reel-palabra-clave` · ★`reel-tarjetas-lado` · ★`reel-pip-escena` · ★`reel-lista-pasos` · ★`reel-cta-final` | palabras clave con icono al decirlas · tarjetas 3D al lado al nombrar una herramienta · la persona pasa a PiP y entra una escena a pantalla completa (zoom a través) · lista de pasos que se marca con ✓ · CTA «Comenta X» animado. Todo anclado a las palabras de la toma y sin tapar la cara (sección 3b) |

Parámetros: muchos ejemplos tienen un bloque `<script id="params">` (JSON) al principio. En los `3d-*` también se puede
cambiar por la dirección (`?titular=Hola`) y el formato con `#9x16` · `#16x9` · `#1x1` · `#4x5`.

## 2b. Los 8 estilos (los de la guía) · `motor/temas/`
Cada estilo cambia colores, tipografía, esquinas, trama del fondo y la **curva por defecto** de todo lo que entra (`--curva`;
«lujo» además va un 30 % más lento). Se aplican a **cualquier ejemplo** sin tocar el HTML:
- al renderizar: `node scripts/render.mjs video <escena> --tema editorial` (la salida lleva `-editorial`);
- para todo un proyecto: `"tema": "editorial"` en su `estilo.json`;
- en la vista previa del navegador: `escenas/<escena>.html?ver&tema=editorial`.

| id | Estilo | Colores y esquinas | Tipografía (incluida, OFL) | Curva | Prompt para pedirlo |
|---|---|---|---|---|---|
| `viegas-oscuro` | Viegas oscuro | fondo #0D0C0F · acento #D97757 / #E78F72 · esquinas 14px | Bricolage Grotesque + Figtree (la guía dice «SF Compact / Bricolage»: aquí se usa Bricolage Grotesque, libre) | `rebote` | «Usa el estilo Viegas oscuro: fondo #0D0C0F con rejilla y halo coral, acento #D97757, tarjetas de cristal y rebote en las entradas.» |
| `claro-minimal` | Claro minimal | fondo #F5F4F0 · acento #2F5BFF / #2F5BFF · esquinas 18px | Sora | `salidaQuint` | «Versión claro minimal: fondo #F5F4F0 sin rejilla, tarjetas blancas con sombra suave, acento #2F5BFF, tipografía Sora y curvas salidaQuint en vez de rebote.» |
| `editorial` | Editorial | fondo #EFE9DF · acento #B4361F / #B4361F · esquinas 2px | Fraunces + Figtree | `entradaSalidaQuint` | «Estilo editorial: fondo papel #EFE9DF, títulos en Fraunces, acento rojo #B4361F, esquinas casi rectas, sin sombras fuertes y movimientos lentos con curva Apple.» |
| `neon` | Neón | fondo #07060F · acento #00F0FF / #FF2BD6 · esquinas 10px | Syne | `atras` | «Estilo neón: fondo #07060F con rejilla violeta, acentos #00F0FF y #FF2BD6 con resplandor, bordes que brillan y entradas con curva atras.» |
| `pastel` | Pastel | fondo #FFF4EC · acento #FF8FAB / #7C6CF2 · esquinas 28px | Nunito | `reboteFuerte` | «Estilo pastel: fondo #FFF4EC con puntos, rosa #FF8FAB y lila #7C6CF2, esquinas de 28 px, tipografía Nunito y reboteFuerte en todo lo que entra.» |
| `corporativo` | Corporativo | fondo #0B1B33 · acento #3FA9F5 / #7FD1FF · esquinas 8px | Sora | `salidaCubica` | «Estilo corporativo: fondo azul #0B1B33, acento #3FA9F5, esquinas de 8 px, tipografía Sora y movimientos sobrios con salidaCubica, sin rebote.» |
| `brutalista` | Brutalista | fondo #F2EE1E · acento #111111 / #FF3B1F · esquinas 0px | Archivo Black | `pasos` | «Estilo brutalista: fondo amarillo #F2EE1E, negro #111 y rojo #FF3B1F, bordes de 3 px, sombra dura sin desenfoque, Archivo Black y movimientos a saltos sin suavizado.» |
| `lujo` | Lujo | fondo #0E0C0A · acento #C9A86A / #E6CF9C · esquinas 4px | Cormorant Garamond | `entradaSalidaQuint` | «Estilo lujo: fondo #0E0C0A, dorado #C9A86A, títulos en Cormorant Garamond, bordes dorados finos, sin rebote y todo un 30 % más lento.» |

La guía nombra «SF Compact» en el estilo Viegas oscuro: es una fuente de Apple que no se puede repartir, así que aquí se usa
**Bricolage Grotesque** (títulos) + Figtree (texto), libres. Los valores de cada estilo están también en `motor/temas/estilos.json`.
Algunos ejemplos traen sus propios colores en el bloque `params` (`"fondo"`, `"acento"`…): si los rellenas, mandan sobre el estilo.

## 3. Flujo paso a paso
1. **Proyecto** (dentro de la carpeta de trabajo):
   `python <skill>/scripts/nuevo.py "<carpeta de trabajo>/<proyecto>" --plantilla <ejemplo|2d|3d> [--ancho 1080 --alto 1920]`.
   Deja `escenas/` (el HTML), `motor/`, `scripts/`, `recursos/`, `resultados/`, `BRIEF.md` y `STORYBOARD.md`.
   Si hace falta más de una escena, crea un HTML por escena en `escenas/`.
2. **Recursos:** lo que dé la persona va a `recursos/` (o junto a la escena). Logos de marcas ajenas: solo los
   imprescindibles y para referirse a esa marca (`motor/logos/LICENCIAS.txt`). Si falta algo:
   `python scripts/recursos.py icono|logo|fuente|imagen|video "<búsqueda>"` (apunta la licencia en `recursos/LICENCIAS.md`).
   Fuentes: solo libres (OFL / Google Fonts). Nunca fuentes de Apple (SF Pro, SF Compact…) ni de pago.
3. **Referencia (opcional):** `python scripts/referencia.py "<archivo o enlace>"` mide curvas, ritmo, cámara y paleta.
   Lee `referencia/analisis.md` y reprodúcelo con las mismas curvas y tiempos.
4. **STORYBOARD.md:** una línea por momento: segundo, qué entra, curva, duración, dirección y cámara. Si el encargo es
   largo, **enséñalo y espera el OK**.
5. **Código** en `escenas/<nombre>.html` siguiendo `referencias/estilo.md`, `referencias/curvas.md` y
   `referencias/motor.md` (en 3D, también `referencias/tres-d.md`; interfaz en 3D, `referencias/pantalla-3d.md`).
   - **Interfaz en 3D (familia 4):** primero la interfaz en fotogramas: `node scripts/render.mjs pantalla editor-video`
     (o `terminal-claude`, o tu HTML en `interfaces/`, o una web `https://…`). Después la escena.
   - Colores siempre con los tokens (`var(--acento)`, `var(--fondo)`…). Para la marca de la persona cambia
     `motor/estilo.css` o crea un tema en `motor/temas/` y renderiza con `--tema <nombre>`.
6. **Comprobar:** `node scripts/render.mjs comprobar <nombre>` hasta **0 errores** (en vertical añade `--zona reel`).
7. **Hoja de fotogramas:** `node scripts/render.mjs hoja <nombre>` → **mira** `resultados/hojas/<nombre>.jpg` (con la
   herramienta de leer imágenes). Corrige lo que se corte, se cruce, tape o aparezca de golpe.
8. **Vista previa rápida:** `node scripts/render.mjs video <nombre> --calidad previa` (1080p a 30 fps). Enséñasela y
   **espera el OK**. Para revisar ritmo y curvas: `python scripts/revisar.py`.
9. **Render final (60 fps):** `node scripts/render.mjs video <nombre> --calidad hd` (1080p60, para redes) o
   `--calidad final` (4K60). Con fondo transparente para montar encima de otro vídeo: `--transparente` (ProRes 4444 .mov).
   Entrega **un MP4 por animación** en `resultados/` y guarda el HTML.

## 3b. Reels con una persona hablando · «pásame tu reel y te lo animo»
Para un reel vertical en el que la persona habla a cámara. Esta skill **no corta ni subtitula**: pone los gráficos encima
(cortar y subtitular lo hace editar-reels-claude, sección 3c). La toma puede venir ya cortada.
1. Proyecto: `python <skill>/scripts/nuevo.py "<trabajo>/<reel>" --plantilla reel-palabra-clave` (y copia en `escenas/` los
   demás `reel-*.html` de `ejemplos/escenas/` que quieras usar).
2. Toma: `python scripts/reel.py preparar "<su-video.mp4>"` → `recursos/toma.mp4` (encuadrada a 1080×1920, audio intacto),
   `palabras.json` (cada palabra con su segundo), `cara.json` (dónde está la cara) y `toma.json`.
   - Transcripción: Whisper local (`faster-whisper`, con la tarjeta NVIDIA o el procesador). Si no lo tiene, **pide permiso**
     para `pip install faster-whisper`, o pídele un `.srt` (`--srt subtitulos.srt`), o usa el `words.json` de editar-reels-claude
     (`--palabras <proyecto>/trabajo/words.json`; si trae los tramos del corte, pasa los tiempos al vídeo cortado).
   - Cara: con OpenCV (opcional). Mira un fotograma con la caja; si no cuadra, corrige `recursos/cara.json`.
   - `python scripts/reel.py palabras` lista lo que dice con su segundo: con eso eliges qué palabra dispara cada gráfico.
3. En cada escena cambia el bloque `params` (palabras que disparan, textos, iconos, logos). Los tiempos salen solos de
   `REEL.t('palabra')` (`motor/reel.js`): cada gráfico entra 0,1–0,15 s antes de la palabra. Si una palabra no está en la toma, ese gráfico se salta.
4. Comprueba: `node scripts/render.mjs comprobar <escena> --zona reel --cara x,y,w,h` (lo imprime `reel.py preparar`) y
   `node scripts/render.mjs hoja <escena>` → míralo: **nada encima de la cara**, nada cortado. (En `reel-pip-escena` comprueba
   sin `--cara`: la persona se mueve a propósito.)
5. Render y montaje (modo simple, sin editar-reels-claude):
   - gráficos encima de la persona (palabra-clave, tarjetas-lado, lista-pasos, cta-final):
     `node scripts/render.mjs video <escena> --calidad hd --transparente` → `python scripts/reel.py componer <escena>`
   - `reel-pip-escena` lleva la persona dentro: `node scripts/render.mjs video reel-pip-escena --calidad hd` → `python scripts/reel.py componer reel-pip-escena`
   - Resultado: `resultados/<escena>-reel.mp4`, 1080×1920 a 60 fps con el **audio original sin tocar**; `componer` cuenta los
     fotogramas (duración × 60) y, si faltan, lo deja como `.INCOMPLETO.mp4`.
   - Para varios gráficos en el mismo reel, junta los `params` en una escena o monta las capas una encima de otra.
6. Avanzado · texto detrás de la cabeza (`"detras"` en `reel-palabra-clave`): solo si la persona tiene su recorte
   (`recursos/toma-mascara.mp4`, la persona en blanco sobre negro; p. ej. el `matte.mp4` de editar-reels-claude). Si no está,
   esa palabra se salta y la escena funciona igual. La cabeza debe tapar ≈ 20 % de la palabra.

## 3c. Junto a editar-reels-claude
Si la persona tiene también la skill gratuita **editar-reels-claude**, se reparten el trabajo así:
1. **editar-reels-claude** corta silencios y falsos inicios (`trabajo/cut.mp4`), recorta a la persona (`trabajo/matte.mp4`) y prepara los subtítulos.
2. **motion-graphics-claude** crea las escenas y las capas:
   `python scripts/reel.py preparar "<proyecto>/trabajo/cut.mp4" --palabras "<proyecto>/trabajo/words.json"` → ajusta las
   escenas `reel-*` → `python scripts/reel.py capas <escena>` → `resultados/capas/<escena>/detras.mov` y `delante.mov`
   (ProRes 4444 con alfa, 60 fps, misma duración que la toma) + `plan.json` (cada gráfico con su capa y sus segundos,
   anclados a las palabras). Las escenas a pantalla completa (`reel-pip-escena` o cualquier ejemplo 2D/3D) van como MP4.
3. **editar-reels-claude** monta: `detras.mov` en su `make_base.py --behind` (queda detrás de la persona recortada),
   `delante.mov` encima en su capa de delante, y después zooms, subtítulos, música y máster a −14 LUFS. Con `plan.json`
   evita poner un subtítulo o una tarjeta suya encima de un gráfico que ya dice lo mismo.

## 4. Comprobaciones antes de entregar (no se entrega nada sin esto)
- **Fotogramas completos:** `render.mjs` cuenta los fotogramas del MP4 (duración × fps). Si faltan, deja
  `<nombre>.INCOMPLETO.mp4` y da error: vuelve a renderizar (con `--hilos 2` si va justo de memoria). Nunca entregues el incompleto.
- **Nada cortado ni fuera de cuadro:** mira la hoja de fotogramas; en vertical, lo importante entre y=260 y y=1480
  (zona segura de Reels, `--zona reel`).
- **Símbolos dibujados, no de fuente:** ▶ ✓ ✕ → con `VK.icono('play'|'check'|'cruz'|'flecha')`. `comprobar` da error
  si algún carácter sale como «□».
- **Sin pantallas negras:** si una escena con `obj.pantalla` no tiene su interfaz en fotogramas, `comprobar` lo dice.
- Revisa al menos el primer, el del medio y el último fotograma del MP4 final.

## 5. Reglas de estilo (detalle en `referencias/estilo.md` y `referencias/curvas.md`)
1. **Curvas variadas, cada elemento la suya:** entradas **rápidas con frenada suave** (salidaQuint, rebote natural);
   salidas **al revés** (arrancan suave y aceleran: entradaCubica). Nunca la misma curva para todo.
2. **Nada aparece de golpe:** todo entra escalonado (0,05–0,3 s) con **desenfoque de movimiento** según la velocidad.
3. **La cámara nunca se para:** zoom lento continuo (1,00 → 1,08–1,12), órbita o recorrido. Transiciones con
   **«zoom a través»** (la cámara entra en el objeto y sale en la escena siguiente), sin cortes secos.
4. **Nada se cruza ni tapa lo importante.** Jerarquía: etiqueta pequeña, título grande, palabra clave en el acento.
   Una idea por escena.
5. **Si se habla de algo que se mueve, se enseña moviéndose** (tarjetas con vídeo, interfaces animadas).
6. **Con voz:** cada elemento entra 0,1–0,3 s antes de la palabra que lo nombra.
7. **Editable siempre:** se entrega el MP4 y se guarda el HTML.

## 6. Si algo falla
- **Escena negra o que no carga:** `node scripts/render.mjs frame <nombre> 1 prueba.png` y lee los «error en la página».
- **«Falta Playwright»:** el proyecto no está dentro de la carpeta de trabajo, o no se ha preparado el equipo (paso 0).
- **Un vídeo de tarjeta no carga:** ponlo en `escenas/vid/` con el mismo nombre (los de muestra se regeneran con
  `python <skill>/scripts/videos_muestra.py escenas/vid`).
- **Render lento:** baja `--hilos`; con tarjeta NVIDIA se usa NVENC solo.
- **Instagram/TikTok no descarga la referencia:** pide el archivo de vídeo.

## Lo que hay en la skill
| Carpeta | Qué es |
|---|---|
| `motor/motor.js` · `kit-escenas.js` | motor 2D (curvas, `entra()` con desenfoque, cámara, textos, contadores, líneas) y ayudas (conectores medidos, iconos dibujados, autocomprobación) |
| `motor/motor3d.js` · `piezas3d.js` · `lente3d.js` · `mascota3d.js` · `svg3d.js` · `logo3d.js` · `pantalla3d.js` · `interfaz.js` | 3D con three.js: objetos, materiales, luces, rigs de cámara, lente de cine (bokeh + desenfoque de movimiento), mascota de Claude, logos SVG extruidos, interfaz en 3D |
| `motor/vendor/` | three.js r170 empaquetado (MIT) |
| `motor/fuentes/` | Inter, Inter Tight, Bricolage Grotesque, Figtree, Sora, Fraunces, Syne, Nunito, Archivo Black, Cormorant Garamond, JetBrains Mono, Instrument Serif (OFL, con licencias) |
| `motor/temas/` | los 8 estilos de la guía (`viegas-oscuro`, `claro-minimal`, `editorial`, `neon`, `pastel`, `corporativo`, `brutalista`, `lujo`) + `claro` y `noche-azul` (el fondo de las piezas 3D) |
| `motor/reel.js` · `scripts/reel.py` | reels con persona: palabras con su segundo, cara, toma de fondo, capas detrás/delante, plan y montaje con el audio original |
| `scripts/` | `preparar.py` (equipo), `nuevo.py` (proyecto), `render.mjs` (comprobar, hoja, previa, final, pantalla), `revisar.py`, `referencia.py`, `recursos.py`, `glifos.py`, `videos_muestra.py` |
| `plantillas/` | escena 2D y 3D en blanco, BRIEF, STORYBOARD, estilo.json |
| `ejemplos/` | las escenas de las 4 familias e interfaces de muestra |
| `muestras/` | MP4 de muestra de cada familia (los de reels se hicieron con una toma real que no se incluye) y la hoja de los 8 estilos |
| `referencias/` | estilo, curvas, motor (API), 3D, pantalla en 3D, reels |
