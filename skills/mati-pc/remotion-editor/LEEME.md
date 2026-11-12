# Skillz

32 skills de terceros para mejorar editor-video. No se editan aquí: se actualizan desde sus repositorios.

| Grupo | Skills | Origen |
|---|---|---|
| Remotion oficial | remotion-* (12) | github.com/remotion-dev/skills |
| Motion graphics HyperFrames | motion-graphics + hyperframes, hyperframes-animation, -creative, -core, -registry, -cli, media-use (dependencias) | github.com/heygen-com/hyperframes |
| Fundamentos de motion design | animation-principles, motion-art-direction, shot-composition, color-motion, logo-animation, motion-background, beat-sync-editing, after-effects, remotion-video | github.com/iart-ai/motion-design-skills |
| Remotion motion graphics | remotion-motion-graphics | github.com/haidrrrry/claude-remotion-skill |
| Corte | cut-video | github.com/louisedesadeleer/cut-video |
| Edición completa | video-use | github.com/browser-use/video-use |

Cambios hechos al instalar:
- cut-video y video-use llevan `disable-model-invocation: true`: no se activan solas (competirían con editor-video). Se usan escribiendo /cut-video o /video-use.
- Se borraron vídeos y GIF de demostración que no usan las skills.

Avisos:
- media-use (HyperFrames) envía estadísticas de uso anónimas. Para desactivarlo: `export DO_NOT_TRACK=1` en tu terminal.
- video-use necesita una clave de ElevenLabs para transcribir.
- Las funciones de voz de media-use usan APIs de HeyGen o Gemini solo si les das clave.
