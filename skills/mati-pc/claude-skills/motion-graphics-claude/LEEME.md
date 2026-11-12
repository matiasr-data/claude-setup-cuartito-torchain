# motion-graphics-claude · instalación

Skill gratuita de **Viegas Estudio** para crear motion graphics (2D y 3D) con Claude Code y exportarlos a MP4.

## 1. Instalar la skill
**Opción A: copiar la carpeta**
1. Descomprime el `.zip`. Tendrás la carpeta `motion-graphics-claude` (dentro está `SKILL.md`).
2. Cópiala en tu carpeta de skills de Claude Code:
   - **Windows:** `C:\Users\TU_USUARIO\.claude\skills\motion-graphics-claude`
     (escribe `%USERPROFILE%\.claude\skills` en la barra del Explorador; si no existe la carpeta `skills`, créala).
   - **Mac:** `~/.claude/skills/motion-graphics-claude`
     (en Finder, Cmd+Mayús+G y escribe `~/.claude/skills`; la carpeta `.claude` está oculta: Cmd+Mayús+. para verla).
3. Comprueba que queda así: `.claude/skills/motion-graphics-claude/SKILL.md` (sin una carpeta repetida dentro).

**Opción B: que lo haga Claude Code.** Abre Claude Code en la carpeta donde descargaste el `.zip` y escribe:
> Descomprime motion-graphics-claude.zip y copia la carpeta motion-graphics-claude en mi carpeta ~/.claude/skills

## 2. Preparar el equipo (una sola vez)
Abre Claude Code (cerrándolo y abriéndolo de nuevo si ya estaba abierto) y escribe:
> Usa la skill motion-graphics-claude y comprueba si mi equipo tiene todo lo necesario.

Claude ejecuta `scripts/preparar.py`, te dice qué falta (Node.js, ffmpeg, Playwright/Chrome) y **te pide permiso**
antes de instalar nada. Al final hace un vídeo de prueba de 2 segundos en `Documentos/Motion Graphics/prueba-del-kit`.

Necesitas: Claude Code, Python 3.9+, Node.js, ffmpeg y Google Chrome (o el navegador de Playwright).
Opcional: tarjeta NVIDIA (exporta más rápido), yt-dlp y OpenCV (para analizar vídeos de referencia).

## 3. Pedir tu primera animación
Ejemplos de frases:
- «Usa motion-graphics-claude: el logo de Claude en 3D que se arma en piezas, titular "Mi canal", 9:16.» (`3d-asterisco`)
- «Un contador gigante de 0 a 2,6M visualizaciones con gráfica, formato Reel.» (`estadistica-gigante`)
- «Una transición tipo cubo 3D que pase de mi clip a una tarjeta con el texto "Capítulo 2".» (`3d-cubo-transicion`)
- «Explica cómo funciona mi servicio: una interfaz de editor de vídeo en 3D con la cámara sobrevolándola, 16:9.» (`pantalla-3d`)
- «Una frase con tipografía cinética: "Tu idea merece brillar hoy mismo".» (`frase-cinetica`)

- «Pon mi animación con el estilo editorial.» (los 8 estilos: viegas-oscuro, claro-minimal, editorial, neon, pastel, corporativo, brutalista, lujo)

## 4. «Pásame tu reel y te lo animo» (reels con una persona hablando)
1. Graba tu reel en vertical (o usa uno ya cortado) y escribe en Claude Code:
   > Usa motion-graphics-claude: anima mi reel «C:uta\mi-reel.mp4» con palabras clave, tarjetas al lado y un CTA «Comenta GUIA» al final.
2. Claude prepara la toma (`scripts/reel.py preparar`): saca qué dices y en qué segundo (Whisper en tu ordenador; si no lo
   tienes, te pide permiso para instalarlo o te pide un archivo .srt) y mide dónde está tu cara para no taparla nunca.
3. Te enseña una hoja de fotogramas y, con tu OK, el reel a 1080×1920 y 60 fps con tu audio original.
4. Ejemplos: `reel-palabra-clave`, `reel-tarjetas-lado`, `reel-pip-escena`, `reel-lista-pasos`, `reel-cta-final` (MP4 en `muestras/`).
El kit no trae ninguna toma: los ejemplos funcionan con la tuya. Si además usas la skill **editar-reels-claude** (cortes,
subtítulos, música), Claude le entrega capas `detras.mov` y `delante.mov` + `plan.json` para que las monte (SKILL.md, sección 3c).

Claude te hará unas pocas preguntas (qué animar, formato, estilo, logos), te enseñará una vista previa rápida y,
cuando le des el OK, el MP4 final a 60 fps.

En `muestras/` tienes un MP4 de cada familia de estilo para ver lo que se puede hacer.

## Licencias
Todo lo que trae la skill es libre o tiene su nota de uso: ver `LICENCIAS.md`.
