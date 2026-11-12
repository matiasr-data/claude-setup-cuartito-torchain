# Skill «editar-reels-claude» · Viegas Estudio · versión 2 (noviembre de 2026)

Con esta skill, Claude edita tus reels como un editor profesional. Corta silencios y tomas falsas. Te recorta del fondo para poner texto detrás de tu cabeza. Añade subtítulos con palabra clave, motion graphics de cristal líquido con rebote y zooms suaves. Pone efectos de sonido y música. Deja el volumen a −14 LUFS, el que piden Instagram y TikTok.

Empieza con unas preguntas sencillas. Después trabaja **por pasadas** y te enseña una vista previa en cada una.

Acompaña a la guía «Reels paso a paso» de Viegas Estudio. La skill se descarga gratis en Viegas Academy FREE.

## Lo que necesitas
- Una cuenta de Claude con el plan **Pro** (20 $/mes) o superior. Claude Code no está en el plan gratuito.
- **Claude Code** en la app de escritorio de Claude (pestaña Code) o en la terminal, en Windows o Mac.
- Un ordenador con unos 10 GB libres. Con tarjeta NVIDIA va en 4K y rápido; en un Mac o sin tarjeta gráfica, mejor en 1080p.

## 1 · Instalarla (la forma fácil)
Abre Claude Code y escríbele, con la ruta de tu descarga:

> Instala la skill que hay en este zip: «C:\Users\yo\Downloads\editar-reels-claude.zip». Descomprímela en mi carpeta de skills de Claude Code y comprueba que se ve el SKILL.md.

Después abre una sesión nueva para que la cargue.

**A mano:** descomprime el zip y copia la carpeta `editar-reels-claude` en:
- Windows: `C:\Users\<tu usuario>\.claude\skills\`
- Mac: `~/.claude/skills/`

Tiene que quedar `.claude/skills/editar-reels-claude/SKILL.md`. La carpeta `.claude` está oculta. En Windows, actívala con Vista → Mostrar → Elementos ocultos. En Mac, pulsa Cmd + Mayús + punto.

## 2 · Preparar el equipo (una sola vez)
Escríbele a Claude:

> Comprueba que tengo todo lo que necesita la skill editar-reels-claude y ayúdame a instalar lo que falte.

Claude ejecuta `scripts/check_env.py`, te dice qué falta y te pide permiso antes de instalar cada cosa:

| Programa | Para qué |
|---|---|
| ffmpeg | vídeo y audio |
| Python 3.10+ con PyTorch y Whisper | transcribir y recortar |
| Node.js 18+ (`npm install` en `scripts/`) | música, efectos y gráficos |
| Chrome o Edge | música y efectos (SynthFlow) |
| Modelo de recorte RVM (~100 MB) | poner texto detrás de tu cabeza |

## 3 · Tu carpeta de reels
La primera vez, Claude te crea esta carpeta (normalmente en Documentos):

```
Reels con Claude/
  Mi estilo/   tu guía de estilo, referencias, tipografías y logos
  Tomas/       tus vídeos grabados
  Música/      opcional
  Reels/       un proyecto por reel, con el vídeo FINAL
```

Abre Claude siempre en esa carpeta.

## 4 · Editar un reel
Deja tu vídeo en `Tomas/` y escribe:

> Usa la skill editar-reels-claude para editar mi última toma.

Claude te hará unas preguntas: qué toma, la calidad, tu estilo, la música y cuántos gráficos quieres. Después irá pasada a pasada.

Si aún no tienes guía de estilo, la crea contigo, a partir de tus referencias o desde cero.

## Novedades de la versión 2
- Funciona junto a la skill **motion-graphics-claude**: si la tienes instalada, Claude le pide las escenas 3D, a pantalla completa y las tarjetas como capas (`detras.mov`, `delante.mov` y `plan.json`) y las monta en tu reel. Sin ella, todo funciona como antes.

## Qué incluye
- `SKILL.md`: las instrucciones que sigue Claude.
- `scripts/`: comprobar el equipo, crear la carpeta, preparar, transcribir, analizar, cortar, recortar, subtítulos, base, mezcla y SynthFlow sin interfaz.
- `synthflow/synthflow.html`: el generador de música (Lo-Fi y Synthwave 80s) y efectos. Ábrelo en Chrome para usarlo a mano.
- `templates/hyperframes/`: el estilo de cristal líquido y el rebote estilo Apple.
- `ejemplo-toma9/`: un reel real terminado.
- `docs/`: el documento técnico, los prompts de la guía y una guía de estilo de ejemplo.
- `fonts/`: Anton, Rajdhani y Cascadia Mono (licencia SIL OFL, libres).

## Licencias y avisos
- Scripts, plantillas y SynthFlow: © Viegas Estudio. Puedes usarlos en tus vídeos; no los revendas.
- Las fuentes incluidas tienen licencia SIL Open Font License.
- El modelo RobustVideoMatting tiene licencia GPL-3.0 y se descarga aparte, de su página oficial.
- Los logos de terceros (Claude, Adobe, CapCut…) del ejemplo pertenecen a sus dueños.
- SF Compact Display (Apple) no se incluye: si la quieres en los subtítulos, usa la tuya.
