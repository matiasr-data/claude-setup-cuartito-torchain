# Perfil del creador

> Lo que pongas aquí manda sobre todo lo demás. **Estado: BORRADOR.** Lo marcado como *(propuesto)* lo he deducido del bruto `DJI_20260930202212_0041_D.MP4` y de la conversación; lo marcado como *(pendiente)* solo lo puedes decidir tú. Corrige encima sin miedo.

## Canal
- Nombre: *(pendiente)* — en el vídeo el protagonista se llama **Mario**
- Temática: *(propuesto)* el día a día de una agencia de lanzamientos (directos con clientes, equipo de ~70 comerciales), emprendimiento y marca personal, documentado en formato vlog
- Público: *(propuesto)* emprendedores y gente del sector (agencias, lanzamientos, ventas)
- Tono: *(propuesto)* cercano, sincero y coloquial (tacos incluidos), sin postureo; sobrio antes que enérgico
- Título y miniatura del vídeo actual: *(pendiente — si los tienes, el arranque los repetirá con las mismas palabras)*

## Formatos que hago
| Formato | Corte cada | Gráfico cada | Música | Subtítulos quemados |
|---|---|---|---|---|
| vlog — reflexión a cámara en plano fijo *(propuesto)* | reencuadre cada 15–25 s en cambio de idea (no hay b-roll: la variedad sale de reencuadres y gráficos) | 15–30 s | 20 % bajo la voz | Mínimos: solo remates (≈6 en este vídeo) + `.srt` completo |
| tutorial / intro de retención (Pablo, 2026-10-02) — **pedido por el creador** | zoom in/out constante pero **progresivo**: empujes de ~0,6 s sobre la palabra clave y aperturas lentas, nunca saltos de escala dentro de un plano; solo las uniones del corte cambian de escala (~10 %) | 3–6 s; texto quemado en todo lo importante | 12–15 % bajo la voz | Énfasis frecuente (≈25 frases en 4 min) + `.srt` completo |

## Cómo grabo
- ¿Grabo el bruto como montaje final y no quiero cortes?: **no** *(propuesto: el bruto trae falsa toma al principio y despedida repetida)*
- ¿Quitar muletillas?: **solo las que tropiezan** *(propuesto: se quitan tomas repetidas, arranques fallidos y huecos de más de ~1,2 s; los «o sea», «tío», «literalmente» se quedan porque son tu forma de hablar)*
- Tipos de plano que uso: cara en plano fijo de escritorio (4K, 29,97 fps, cámara DJI). Sin pantalla, sin b-roll en este bruto.
- Nota de imagen [MEDIDO mirando fotogramas]: la exposición y el color cambian solos durante la toma (ámbar ↔ magenta/azul por la luz del monitor). Se nota en los saltos; se compensa con el LUT suave, no se corrige aquí.

## Términos propios
<!-- lo que oye el transcriptor → lo correcto -->
- blog → vlog
- Dona y Tor / Don Aitor → don Aitor *(confirmar: ¿el cliente es Aitor?)*
- Cloud → Claude
- focus, dashboard, reel, recap, poke (se escriben así)
- CapCat → CapCut
- USL → VSL
- Valid → Bali
- En los vídeos de tutoriales habla **Pablo** (socio de Mario y de Miguel); en los vlogs, Mario.

## Diseño (roles) — **en uso: opción B · Eléctrico** *(elegida por Claude para `video-02oct` porque el creador pidió edición de retención; pendiente de que la confirmes o elijas A/C — los tokens viven en `motion/src/tokens.ts`)*
Colores (hex):
- Fondo: #0A0A14
- Texto: #FFFFFF
- Método (datos, pasos, rótulos): #8E9BFF
- Acento (palabra clave, cifra, CTA): #D6FF3F — siempre como **fondo** con texto #0A0A14 encima (sobre camiseta blanca el lima no contrasta como texto)
- Semántico (errores, tachados): #FF4D5E

Fuentes:
- Display (titulares): DIN Condensed Bold, en mayúsculas
- Subtítulos: Helvetica Neue Bold, con contorno oscuro
- Tarjetas: Helvetica Neue Medium
- Toque premium (opcional, máx. 1 vez por minuto): ninguno

Logo: *(pendiente — no hay `branding/logo.png`)*
Iconos (estilo): *(propuesto)* trazo fino, sin relleno, un solo color (rol Método)

Opciones preparadas (tableros sobre fotogramas reales de tu vídeo, fuentes del sistema, sin descargas):
- **A · Cálido sobrio** — `branding/opciones/estilo_A.png` — #111113 / #F7F3EA / #C8B48A / #FFB627 / #E5484D · Avenir Next + Didot cursiva
- **B · Eléctrico** — `branding/opciones/estilo_B.png` — #0A0A14 / #FFFFFF / #8E9BFF / #D6FF3F / #FF4D5E · DIN Condensed + Helvetica Neue
- **C · Editorial claro** — `branding/opciones/estilo_C.png` — #F3EEE4 / #151515 / #1F4B3F / #FF5B2E / #C62828 · Futura + Baskerville cursiva

## Subtítulos
- Palabras por línea: 2–4 *(valor de partida)*
- Posición: centrados abajo, por encima de la zona de la barra (130 px), nunca sobre la boca
- Mayúsculas: no *(propuesto; la opción B las usa en titulares)*
- Animación de la palabra activa: entra un poco más grande y apagada y se asienta en ~0,16 s; una sola palabra realzada por plano con el color Acento como fondo

## Sonido
- Carpeta de SFX: recursos/sfx/ — pack de 19 sonidos **sintetizados** el 2026-10-02 (`proyectos/video-02oct/trabajo/scripts/sfx_sintesis.py`); sin samples ajenos. Si tienes tu pack, sustituye los `.wav` con el mismo nombre.
- Nivel de los efectos: claramente por debajo de la voz; solo el impacto de titular sube al nivel de la voz
- Mapa de sonidos por tipo de gráfico:
  - Cortinilla de capítulo → (no hay capítulos en este formato)
  - Titular grande → `impacto` (con `riser` un segundo antes en los dos o tres más importantes) · titular menor → `golpe_suave`
  - Contador / cifra → `tic` por paso, `caja` o `ding` al llegar
  - Lista (cada ítem) → `bloop` (razones) o `tic` (checklist); chips → `pop` / `pop_agudo` alternos
  - Tachado / error → `error`
  - Aparición de texto (subtítulo) → sin sonido, salvo remate: `ding` bajo
  - Interfaz dibujada / clic → `teclas` al escribir, `clic` al pulsar, `exito` o `notificacion` al completar
  - Transición marcada → `whoosh` (barrido), `whoosh_grave` (zoom de bloque), `glitch` (flash)
  - Zoom rápido en palabra clave → `swish` (solo en algunos: si suena en todos deja de marcar)

## Música (se añade en CapCut)
- Estilo por mood: *(propuesto)* reflexivo/íntimo → sube a motivador en el tramo de «consistencia» y «visión a un año»
- Biblioteca o fuente con licencia: *(pendiente)*

## Color (se añade en CapCut)
- LUT: *(pendiente — no hay nada en `branding/luts/`)*
- Intensidad habitual: empezar a la mitad

## Motor de gráficos
- Motor: **remotion** (v4.0.532, Node 24) — decidido por el creador
- Proyecto: motion/
- Plantillas que ya tengo: `Prueba`, `TableroEstilo`, y las del montaje dirigido por datos (`motion/src/video/Montaje.tsx` + `timeline.json`): `Subtitulo`, `Titular`, `Chips`, `Lista`, `Cifra`, `Terminal`, `Miniaturas`, `AntesDespues`, `BarraFinal`, `Flujo`, `Rotulo`, `Ventana`, `Suscribir`, `Grafica`. Render: `node motion/render.mjs` (stills / video / capas).
- Licencia: Remotion es gratis para particulares y empresas de hasta 3 personas; una empresa mayor necesita licencia de empresa (remotion.dev/license).

## Entrega
- Tipo: **kit** (por capas) *(valor por defecto)*
- Carpeta donde dejar la entrega: `proyectos/<nombre>/entrega/`
- Resolución y fps: *(propuesto)* **1920×1080 a 29,97 fps** — el bruto es 4K, así que a 1080p se puede reencuadrar hasta el 200 % sin perder calidad. Si quieres 4K, los reencuadres se limitan al ~115 %.

## Referencias activas
- (ninguna — si tienes un vídeo que te guste cómo está editado, mételo en `referencias/<nombre>/` y lo analizo)

## Nunca quiero
- *(pendiente)*

## Herramientas (instaladas en local, dentro del proyecto)
- `source .herramientas/entorno.sh` pone en el PATH FFmpeg 6.0 + ffprobe y define Whisper (whisper.cpp 1.7.2, modelo large-v3-turbo).
- En este Mac no hay FFmpeg de sistema ni Homebrew; todo vive en `.herramientas/` y `motion/node_modules/`.
