# Hoja de edición: video-02oct (intro «Editar vídeos con Claude y CapCut»)

## Resumen
- **Formato y mood:** intro de un vídeo `largo` (tutorial), editada entera a densidad de `gancho` porque así lo pidió el creador (impacto cada ~1,5 s). Mood: enérgico, tecnológico, directo.
- **Duración:** bruto 5:16 → montaje **3:52,8** (6978 fotogramas a 29,97 fps).
- **Lo más potente del bruto (lo que vende el gancho):** «Todo lo que estás viendo en pantalla —los cortes, los sonidos, las transiciones, los motion graphics— lo ha creado Claude». La edición lo demuestra literalmente: cada cosa que se nombra ocurre en pantalla en ese instante.

## Referencias aplicadas
- Ninguna activa en el perfil. Se aplican las reglas base de la skill, salvo donde el creador pidió otra cosa (ver «Conflictos resueltos»).

## Cortes del bruto
| Bruto | Qué se quita | Por qué |
|---|---|---|
| 0:00–0:11,6 | Primera toma del gancho (se salta «los cortes») | Toma repetida: se queda la última buena |
| 0:19–0:24, 0:28–0:35, 1:23–1:30, 1:56–2:01, 2:29–2:34, 3:17–3:20, 3:43–3:53, 4:18–4:25 | Pausas largas mirando el guion | Aire muerto |
| 3:03,0–3:06,1 | «…transiciones, ya lo he repetido» | Tropiezo |
| 3:53–4:03,5 | «Llevo literalmente una semana dedicándome… Así que si estás viendo este vídeo,» | Arranque fallido: se contradice con «llevo 12 días» que dice justo después (se queda la última) |
| 5:13,4–5:16 | Silencio final | — |
| 17 huecos de 0,5–0,8 s dentro de frase | Se recortan a ~0,15 s | Micro-huecos que frenan; cada unión cambia de escala para tapar el salto |

27 tramos. Las pausas de menos de 0,5 s se conservan (respiración natural). El transcript de lo conservado se lee como discurso continuo (`trabajo/cortes.json`, `scripts/cortes.py`).

## Línea de tiempo (por bloques)
| TC | Bloque | Lo que se dice | Gráfico (texto exacto) | Overlay / completa | Zoom / transición | SFX | Por qué |
|---|---|---|---|---|---|---|---|
| 0:00 | Gancho | «Todo lo que estás viendo en pantalla, los cortes, los sonidos, las transiciones, los motion graphics, los ha creado Claude» | Subtítulo «**todo** lo que estás viendo en pantalla» · chips CORTES / SONIDOS / TRANSICIONES / MOTION GRAPHICS · titular «LOS HA CREADO **CLAUDE**» | overlay | abre de 150 % a 112 %; doble corte en «cortes»; barrido en «transiciones»; punch + sacudida en «Claude» | tijera, notificación, whoosh, pop, riser + impacto | Demostración literal de la promesa: lo que se nombra, pasa |
| 0:07 | Skill | «Yo solo he instalado una skill una vez y me he olvidado para siempre» | Terminal dibujada «› instalar skill editor-video» → «✓ Skill instalada · 1 SOLA VEZ» · subtítulo «y me he olvidado **para siempre**» | overlay (cara al tercio derecho) | corte de escala; punch en «una vez» | teclas, éxito | Herramienta → interfaz dibujada |
| 0:11 | Sinceridad | «Te voy a ser totalmente sincero. Todos los vídeos… en YouTube… tienen una pequeña trampa» | Subtítulo «te voy a ser **totalmente sincero**» · pantalla de resultados dibujada con 6 miniaturas + sello «TRAMPA» | **completa** (fondo desenfocado) | barrido de entrada; acercamiento lento | whoosh, pops en cascada, teclas, riser + impacto + error | Bucle abierto; cambio de tipo de plano |
| 0:20 | — | «no son totalmente autónomos. Y eso es una realidad» | Titular «100% AUTÓNOMOS» tachado | overlay | corte a primer plano en «autónomos» | pop, error | Mito → tachado |
| 0:25 | — | «la IA no está para sustituirte, sino para que te apalanques de ella, ahorres tiempo y dinero» | Antes/después «SUSTITUIRTE» (tachado) → «**APALANCARTE**» · chips TIEMPO / DINERO (vuelven a latir cuando lo repite) | overlay | punch en «no»; apertura en «sino» | pop, error, éxito, caja | Comparación → antes/después |
| 0:37 | Promesa | «aprendas una habilidad muy valiosa, que es editar vídeos con Claude» | Subtítulo «una habilidad **muy valiosa**» · titular «EDITAR VÍDEOS CON **CLAUDE**» | overlay | punch + sacudida en «Claude» | riser + impacto | La promesa del título con las mismas palabras |
| 0:45 | — | «con tu criterio creativo, que eso Claude no lo puede clonar… esta skill que te voy a dejar al final del vídeo… tus ideas en vídeos… en cuestión de minutos» | Subtítulos «con tu **criterio creativo**», «…no lo puede **clonar**» · barra de vídeo con «SKILL · AL FINAL DEL VÍDEO» · flujo «TUS IDEAS → **VÍDEOS**» · subtítulo «en cuestión de **minutos**» | overlay | impactos cada ~1,4 s | pop, ding, swish | Bucle abierto que retiene hasta el final |
| 0:57 | Editores | «pagar algún editor… vlogs, vídeos, VSL… lo bueno se paga… 100, 200, 300 hasta 500 dólares en editores… con tu ordenador… ofrecerlo como servicio» | Chips VLOGS / VÍDEOS / VSL · titular «LO BUENO **SE PAGA**» · cifra «$100 → $200 → $300 → **$500** EN EDITORES» tachada · subtítulos «con **tu ordenador**», «como **servicio**» | cifra a pantalla **completa**; resto overlay | zoom de bloque; un corte de escala por ítem | pops, caja, tics, error | Cifra → contador grande |
| 1:22 | 3 razones | «Si has entrado hasta aquí es por tres razones… creas contenido… tu negocio necesita de las redes… trabajes con algún creador u editor» | Titular «**3** RAZONES» · lista numerada (panel izquierdo, ítem activo en acento) · subtítulos «más **eficiente**», «de manera **escalable**», «sin **vaciarte el bolsillo**» | overlay (cara al tercio derecho 28 s) | barrido de bloque | riser + impacto, bloop por ítem | Enumeración → lista en cascada; el panel hace de barra de progreso |
| 1:50 | Mejor vídeo | «el mejor vídeo… en 2026… septiembre, octubre, noviembre y diciembre… Claude y CapCut… acabado 100% profesional» | Subtítulo «seas el **perfil** que seas» · titular «ESTE ES EL **MEJOR** VÍDEO» · cifra «2026» + SEP OCT NOV DIC · titular «**CLAUDE** + CAPCUT» · titular «**100%** PROFESIONAL» | overlay | zoom de bloque; punch + sacudida | impacto, tics, ding | Fecha → calendario; promesa del título |
| 2:12 | Reparto | «Claude lo que va a hacer es ahorrarte… cortes, transiciones, sonidos, música, textos. Y tú… ese toque tuyo… en CapCut… en cuestión de horas» | Checklist «CLAUDE: Cortes ✓ Transiciones ✓ Sonidos ✓ Música ✓ Textos ✓» + fila «TÚ: el toque final» · subtítulos «ahorrarte todo el **tiempo**», «en cuestión de **horas**» | overlay (panel izquierdo) | un escalón de zoom por ítem | tic por ítem, éxito | Enumeración → lista |
| 2:27 | Esfuerzo | «horas y horas y horas consumiendo tutoriales… sencilla, explicada… paso a paso» | Titular «HORAS HORAS **HORAS**» · chips TUTORIALES, SENCILLA / EXPLICADA · «PASO A PASO 1→2→3» · subtítulos | overlay | tres punch seguidos (114 → 128 → 144 %) | golpes + impacto, bloops | Repetición → acumulación |
| 2:50 | 12 días | «Llevo 12 días pegado a la pantalla día y noche… Ya me he encargado yo… tranquilo» | Cifra «**12** DÍAS» (cuenta 1→12) + chips DÍA / NOCHE · subtítulos «ya me he **encargado yo**», «así que **tranquilo**» | overlay (panel izquierdo) | flash de bloque; apertura lenta en «tranquilo» | glitch, teclas, ding | Cifra → contador |
| 3:04 | Quién soy | «mi nombre es Pablo… casi dos años… ventas… parte creativa… marketing… vídeos de Mario, mi socio… en el canal… Bali… Miguel y Mario» | Rótulo «PABLO · Negocios online · casi 2 años» · chips VENTAS / PARTE CREATIVA / MARKETING · ventana con fotograma real de Mario «MARIO · mi socio · marca personal» · chips «MÁS VÍDEOS COMO ESTE», «MI DÍA A DÍA EMPRENDIENDO» · rótulo con pin «BALI · con mis socios, Miguel y Mario» | overlay | barrido de bloque | pops, whoosh | Nombre → rótulo; lugar → pin; b-roll real como prueba |
| 3:41 | CTA | «te invito a que te suscribas… no te cuesta absolutamente nada… este canal dispare… muchísima más gente» | Botón «Suscribirme» con cursor → «Suscrito» + campana · subtítulo «no te cuesta **absolutamente nada**» · gráfica que se dispara «ESTE CANAL» · subtítulo «muchísima **más gente**» | overlay | punch + sacudida final | clic, notificación, riser, impacto | CTA con interfaz dibujada |

Detalle fotograma a fotograma: `trabajo/timeline.json` (lo genera `trabajo/scripts/timeline.py`; ahí se cambia todo).

## Subtítulos de énfasis
25 frases, palabra a palabra, con un solo realce (fondo Acento). Lista completa en `timeline.json` (tipo `Subtitulo`). El `.srt` completo va aparte para YouTube.

## Música (se añade en CapCut)
Ver `entrega/NOTAS.md`.

## Elementos a preparar
- **Logos reales** de Claude y CapCut (PNG con fondo transparente) → `recursos/logos/`. Ahora van como texto: la regla es no redibujar logos de marca.
- **Música con licencia** (`recursos/musica/` está vacía).
- **LUT** (`branding/luts/` está vacía).

## Capítulos y pantalla final
Es la intro del vídeo: no lleva pantalla final. El primer capítulo de YouTube («0:00 Intro») cubre este tramo.

## Conflictos resueltos
- **Reglas base (≈80 % de cortes secos, zoom lento, subtítulos mínimos, SFX solo en transiciones con significado) vs petición del creador (zoom in/out constantes cada 1,5 s, texto quemado en lo importante, transiciones y sonidos)** → manda el creador. Se conserva de las reglas base lo que no choca: un realce por plano, el golpe entra con el gráfico y no encima de la palabra, cada gráfico responde a un disparador del guion, nada quieto del todo.
- **Zooms de la v1 (cortes secos de escala, «punch» de 5 fotogramas) vs revisión del creador** → rechazados por bruscos. La v2 hace lo que decían las reglas base desde el principio («el movimiento lento se lee como caro»): movimientos progresivos y continuos; el cambio seco de escala queda solo para las uniones reales del corte. La columna «Zoom / transición» de la tabla describe la intención (en qué palabra cae el acento); la forma es la de `scripts/camara.py`.
- **Perfil (formato `vlog`, tono sobrio) vs este vídeo** → el perfil estaba escrito para los vlogs de Mario; este vídeo es un tutorial de Pablo. Se añade el formato al perfil.
- **Estilo sin elegir en el perfil (A/B/C)** → se usa **B · Eléctrico** (el más acorde a una edición de retención). Cambiarlo es editar `motion/src/tokens.ts` y volver a renderizar.

## Preguntas para el creador
1. **Estilo:** ¿te vale B · Eléctrico (lima + azul lavanda, DIN Condensed) o prefieres A o C?
2. **«Llevo una semana…» vs «llevo 12 días»:** he quitado la primera. ¿Correcto?
3. **«nivel de excelencia 200»:** no lo he puesto en pantalla porque no sé si es «200 %». ¿Lo quemo?
4. **Miniaturas inventadas** (EDITA CON CLAUDE, 100% AUTOMÁTICO, SIN TOCAR NADA…): son genéricas, sin canales reales. ¿Te valen o prefieres capturas reales?
5. **Título y miniatura del vídeo:** si me los das, el titular del gancho repite las mismas palabras.
