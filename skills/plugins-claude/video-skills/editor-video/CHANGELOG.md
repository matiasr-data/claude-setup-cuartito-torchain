# Changelog

## v1.0
- Lógica de edición destilada del proyecto original: ritmo por tipo de plano, formatos, gancho y estructura, transiciones y zoom, subtítulos de énfasis, sonido con significado, música, motion graphics por disparador, diseño por roles, revisión y entrega por capas para CapCut.
- Analizador de referencias con el prompt original y scripts de medición (ritmo, sonido, planos).
- Plantillas de perfil, ficha de estilo y hoja de edición.

## v1.1 (2026-10-06)
- Realce de subtítulos como marca trazada (selección tipo iPhone, subrayado de rotulador, círculo), nunca bloque de color; regla de los 0,4 s para la palabra realzada.
- La hoja: panel a pantalla completa que sustituye al plano de la persona unos segundos, con el texto escrito letra a letra; cuándo, cuánto y cómo entra y sale.
- Conexiones entre puntos (líneas que se trazan con pulso) como movimiento de marca; nuevos disparadores: píldoras, estados, pasos, flujo de nodos, lista apilada, notificaciones.
- Roles nuevos en diseño visual: Tinta, Detalle y Papel; regla de las dos superficies y de las dos fuentes de marca.
- Motor: plantillas versionadas por estilo y capas del montaje con silueta y hoja.


## v1.2 (2026-10-08)
- La skill vive en ~/Skillz (fuera de iCloud) y el proyecto la usa mediante enlaces.
- Sección "Skills de apoyo": cuándo usar las skills de Remotion, motion design (iart-ai), HyperFrames y claude-remotion-skill, y reglas de convivencia (manda esta skill, el motor es Remotion, nada de APIs de pago sin permiso).
- Incorporadas ideas de cut-video y video-use al corte: solo en silencios, risas ≠ silencios, trim + concat.

## v1.3 (2026-10-08)
- Nueva skill compañera `planificador-video`: mapa de valor, puntuación de frases (comprensión, peso, memoria), tipo de frase → tipo de visual, presupuesto por formato y plan por fases.
- Flujo de edición reordenado: ingesta → plan (punto de control) → cortes → voz → zooms → motion graphics → subtítulos → sonido → revisión → entrega, ejecutado fase a fase sin parar.
- La hoja de edición pasa a ser el plan de edición (`PLAN.md`).
- Analizador: nueva salida `frases-animadas.md` para calibrar el planificador con lo que animan los mejores editores.
- Calibración con las correcciones del creador en `planificacion/ejemplos.md`.

## v1.4 (2026-10-08)
- Seis recursos de composición nuevos en `motion-graphics.md`, sacados de referencias de editores con IA: el lienzo (pantalla completa en dos zonas), cita + ventana, tarjeta en el hueco del encuadre, vídeo dentro del vídeo, mosaico de ventanas y el proceso real anotado. Con cuándo, cómo y cuándo no de cada uno.
- "La hoja" pasa a ser "el lienzo" y pierde la estética del estilo D (hoja cuadriculada, texto escrito letra a letra, tinta): eso lo decide ahora el perfil, porque el branding de Mario se va a sustituir. Se conserva toda la lógica y el feedback.
- El planificador elige el recurso según el tipo de frase (`planificador-video/references/tipos-visuales.md`).


## v1.5 (2026-10-08)
- Estilos de motion seleccionables desde el perfil (`Estilo de motion:`). Primer estilo: `references/estilos/sistema-apple.md`, sacado del estudio de las 53 piezas de branding Mario: superficies y radios, sombras, materiales, color (un acento), tipografía, iconos, movimiento medido fotograma a fotograma, catálogo de 20 componentes, método para crear componentes nuevos, prohibiciones y checklist.
- Coreografía: curva por gesto (aparecer ease-out, desaparecer ease-in, mover ease-in-out) y alternancia acción-reposo.
- El planificador elige la pieza del catálogo del estilo activo para cada animación.
