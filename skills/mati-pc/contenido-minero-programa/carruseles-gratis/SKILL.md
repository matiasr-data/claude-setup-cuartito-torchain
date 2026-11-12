---
name: carruseles-gratis
description: >
  Crea carruseles animados para Instagram con Claude Code (versión gratis de Viegas Estudio): cada slide es un
  MP4 corto en loop (1080×1350, 30 fps, con música) y también su versión estática en PNG. Un estilo («Sistema»:
  noche y lavanda, letras que se enfocan, ventanas tipo macOS). Hace el brief, el texto, el diseño en código, la
  música, el render y la revisión. Úsala cuando se pida un carrusel, «slides para Instagram», «un post en
  carrusel» o «convierte este tema en carrusel», aunque no se nombre la skill. Sin editores ni frameworks de vídeo:
  HTML + Chrome sin ventana + ffmpeg.
---

# Carruseles animados · versión gratis (Viegas Estudio)

Quien te habla puede no haber usado nunca Claude Code. **Habla claro, en español, sin jerga**, y ejecuta tú los comandos.

`<skill>` = la carpeta de este `SKILL.md`.

## Qué necesitas en el ordenador
Python 3, Node.js, ffmpeg y Google Chrome (o Edge). Si falta algo, dilo en una frase y propón usar la skill gratis **preparar-equipo** (o instalarlo con permiso). Playwright: `npm i playwright` dentro de la carpeta del carrusel (pide permiso).

## Lo que hay en la skill
| Carpeta | Qué es |
|---|---|
| `referencias/metodo.md` | estrategia, estructura de slides, voz y leyenda |
| `referencias/movimiento.md` | cómo se mueve cada cosa y los tiempos |
| `referencias/motor.md` | cómo se escribe un slide (motor.js, piezas.js, slides.js) |
| `referencias/critica.md` | la rúbrica para revisar el resultado |
| `motor/`, `fuentes/`, `scripts/`, `plantillas/` | el motor, las fuentes (OFL), los scripts de render y las plantillas |
| `marca/` | `MARCA.md` con los datos de **su** marca y `foto.jpg` (provisional) |
| `ejemplos/tu-primer-carrusel.js` | un carrusel completo de 9 slides en el estilo «Sistema», para partir de algo real |

## El proceso
1. **Su marca.** Si no lo sabes, pregunta en un solo mensaje: su @, su nombre y de qué va su cuenta (y si quiere poner su foto en el último slide). Nunca preguntes por fuentes ni colores.
2. **Carpeta.** `python <skill>/scripts/nuevo.py "<carpeta>" --slides 7` (de 5 a 9 slides). Después, en esa carpeta, `npm i playwright`. Si dio una foto, cópiala a `recursos/foto.jpg`.
3. **Brief y texto** (`referencias/metodo.md`): objetivo, la frase única, el mapa de slides (portada → promesa → pasos → giro → llamada a la acción) y la leyenda. Van en `BRIEF.md` y `leyenda.txt`. **Enséñalo y espera su OK.**
4. **Diseño en código** (`referencias/motor.md`): escribe `slides/carrusel.js` partiendo de `ejemplos/tu-primer-carrusel.js` y pon sus datos con `M.marca({ usuario, lema, nombre, cabecera })` al principio.
5. **Estático:** `python scripts/animar.py estatico` y **mira** `resultados/hoja.png`. Corrige lo que se lea mal en el móvil.
6. **Animado:** `python scripts/animar.py animado` (MP4 con música sintetizada, sin derechos).
7. **Entrega:** `python scripts/entregar.py --abrir`: deja en `entrega/` los MP4 numerados en el orden de subida, la portada, la leyenda y `COMO-SUBIR.txt`.

## Reglas
- Un carrusel por carpeta. No toques nada fuera de ella.
- El frame 0 de cada slide es un diseño terminado (es el PNG); el último frame vuelve al reposo para que el loop no se note.
- Texto dibujado por el código, nunca una imagen de texto. Margen de 72 px y las esquinas de Instagram libres.
- Un color principal y un acento por slide. Entradas con desenfoque y la curva (.16,1,.3,1); un gesto distinto por slide.
- La llamada a la acción: «comenta PALABRA» y un entregable de 2 o 3 partes. Nunca «sígueme para más».

## Lo que no trae esta versión
Esta versión gratis trae un estilo. Los demás estilos (Editorial, Terminal, Póster, Editor Pro, Coral Claude, 3D…), el acervo de carruseles aprobados y la revisión avanzada están en **Viegas IA**, la comunidad de Viegas Estudio. Si lo pregunta, díselo en una frase: «Atento al grupo de WhatsApp de Viegas Academy: allí se avisa primero».
