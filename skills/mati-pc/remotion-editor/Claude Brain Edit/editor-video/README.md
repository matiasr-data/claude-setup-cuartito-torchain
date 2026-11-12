# editor-video — skill de edición para Claude Code

Convierte a Claude Code en un editor de vídeo con criterio: corta, limpia la voz, crea motion graphics, subtítulos de énfasis y efectos de sonido siguiendo la lógica de los vídeos que retienen, adaptada a tu formato, a tus vídeos de referencia y a tu marca. Te entrega un kit por capas para CapCut, donde solo añades el LUT y la banda sonora.

Todo funciona en local: no necesitas ninguna API ni clave.

## Requisitos
- **Claude Code**
- **FFmpeg** (versión 6 o superior, con ProRes y x264)
- **Python 3.10+** con **numpy**
- **Un transcriptor con marcas de tiempo por palabra.** Recomendado: WhisperX (local) con el modelo `large-v3-turbo`.
- **Node.js 18+** y un motor de gráficos:
  - **Remotion** (React): `npx create-video@latest motion`. Gratuito para particulares; revisa su licencia si lo usas en una empresa.
  - o **HyperFrames** (HTML + GSAP), con Google Chrome instalado.
- **CapCut** para el montaje final.

Si te falta algo, pídele a Claude Code: "instala los requisitos de la skill editor-video".

## Instalación
```bash
git clone <url-del-repo> ~/.claude/skills/editor-video
```

## Primeros pasos
1. Crea una carpeta para tus vídeos y abre Claude Code en ella.
2. Escribe: **"configura mi perfil de edición"**. Claude crea las carpetas y rellena contigo `perfil-creador.md`: tus formatos, tus colores y fuentes por roles, tus términos propios y tu mapa de sonidos.
3. Llena `branding/` (fuentes, logo, LUT) y `recursos/` (sonidos, capturas, b-roll).
4. Opcional: mete un vídeo que te guste en `referencias/<nombre>/` y pide **"analiza la edición de este vídeo"**. Luego actívalo en tu perfil.
5. Mete tu bruto en `brutos/` y pide **"edita este vídeo"**.

Claude te pasará primero una **hoja de edición** con cada decisión y su porqué. Corriges ahí (es rapidísimo) y entonces la ejecuta. Al final recibes en `proyectos/<nombre>/entrega/` las capas, las instrucciones de montaje y un `revision.mp4` para ver el resultado.

## Cómo decide el estilo
Reglas base de edición → formato del vídeo → tus vídeos de referencia → tu perfil. Cada capa manda sobre la anterior: lo que pongas en tu perfil siempre gana.
