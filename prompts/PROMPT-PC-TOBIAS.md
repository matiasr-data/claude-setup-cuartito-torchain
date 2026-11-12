# Prompt para Claude Code en la computadora de Tobías

Pegar todo lo que está dentro del bloque en Claude Code.

````
# PROYECTO: IA en redes sociales y automatizaciones para El Cuartito y la Fundación Torchain
# (Setup de la computadora + auditoría + implementación)

## Contexto
Esta es la computadora de Tobías Perona, dueño de El Cuartito (empresa y productora de eventos, música en vivo y boliches) y de la Fundación Torchain (jóvenes, educación e impacto social). Trabajo desde su oficina, con su cuenta de Claude Code Pro y con su autorización. Soy [TU NOMBRE], estudiante de Ciencia de Datos, community manager y desarrollador web.

Objetivo del dueño: que la IA haga con mejor calidad el trabajo que hoy hacen personas en redes sociales y en procesos repetitivos, y llevar las dos organizaciones a mayor escala. Aprobó invertir en plataformas y APIs. El ahorro es una consecuencia a largo plazo.

La fundación hoy se enfoca en que los jóvenes de San Juan se eduquen, sueñen en grande y aporten a la provincia desde la minería, en alianza con Joaquín Conca (@joacoconca_) y el Ministerio de Minería. Una persona encargada maneja el Instagram; Joaquín y Tobías toman las decisiones y ponen la cara.

**Alcance de la fase 1: redes sociales y automatizaciones**, más tres quick wins web de la fundación (ver Fase E). El resto de la web y el diseño se evalúan después de las reuniones 1 y 2.

Si existe PLAN-INICIAL.md (versión 3) en la carpeta del proyecto, leelo primero: tiene el diagnóstico, el proceso de auditoría, las oportunidades (sección 6) y el plan de crecimiento de la fundación para 2026 y 2027 (sección 11). Es un borrador: validalo con el dueño y corregilo con datos reales.

## Reglas generales
- Escribí en español rioplatense (voseo: "podés", "elegí", "mostrame"), claro y directo. Explicá lo técnico en simple.
- No uses voces de IA (locución, voiceover, clonación o síntesis de voz) ni propongas instalarlas. Tampoco clones ni avatares de Tobías o Joaquín sin su autorización expresa. Si más adelante se quieren, te aviso yo.
- Esta computadora y estas cuentas son de otra persona. Antes de instalar software, conectar una cuenta o ejecutar una acción con efecto externo (publicar, enviar mensajes, comprar plataformas o créditos, tocar cuentas de Meta, publicar sitios), mostrame qué vas a hacer y pedime confirmación.
- Trabajá solo dentro de la carpeta del proyecto. No borres ni modifiques archivos personales, de clientes o de producción del dueño.
- Credenciales: nunca en archivos, notas ni capturas. Las cargo yo desde variables de entorno o el gestor de secretos; el dueño inicia sesión con su 2FA. Usar Meta Business Suite con roles, sin contraseñas compartidas.
- No inventes datos ni métricas: preguntá o marcá el supuesto.
- Todo contenido de boliches con alcohol o con jóvenes pasa por aprobación humana antes de publicarse. Revisá la normativa local y las políticas de Meta (público 18+).
- Separación de marcas: la fundación no promociona alcohol y El Cuartito no usa a la fundación como publicidad. Si algo mezcla ambas, avisame antes.
- Datos de jóvenes: pedí consentimiento para imágenes y datos, no los subas a servicios externos sin avisarme y tené presente la Ley 25.326 de Protección de Datos Personales (la revisión final la hace un abogado).
- No tomes decisiones sobre personas: la auditoría es por tarea, no por persona. Cualquier decisión laboral la toma el dueño con su abogado y contador.
- Claude Code Pro tiene límites de uso: trabajá por etapas cortas, resumí lo hecho en notas y avisame antes de tareas que consuman mucho.
- Preferí soluciones simples y baratas; decime el costo estimado de cada plataforma o API antes de proponerla.
- Todo lo que instales se registra en INSTALACIONES.md (qué, para qué, versión, cómo desinstalarlo).
- Si una skill o plugin no está en esta computadora, no asumas que existe: buscá un equivalente y revisá que la fuente sea confiable.

## FASE A – Reconocimiento (solo lectura)
Detectá sistema operativo, espacio, permisos y qué hay instalado (Node, Git, Python, Obsidian, navegadores, Claude Desktop, Canva, editores de video). Listá los plugins, skills y conectores ya disponibles. Mostrame qué falta. No instales nada todavía.

## FASE B – Instalación (con mi OK por bloques)
1. Base técnica: Node.js LTS, Git y Python, solo si faltan.
2. Carpeta del proyecto con la estructura de abajo y un CLAUDE.md con el contexto y las reglas de este prompt.
3. Vault de Obsidian NUEVO del proyecto (no mi vault personal) con una nota por organización, una Bitácora de decisiones y el registro de instalaciones.
4. Skills: descargá el repositorio privado `claude-setup-cuartito-torchain` de mi GitHub (cuenta matiasr-data). Yo inicio sesión en el navegador cuando Git lo pida; no guardes mis credenciales y, al terminar, borralas del administrador de credenciales de Windows. Ejecutá `.\instalar.ps1 -Listar`, mostrame los packs y, con mi OK, instalá primero `proyecto` y `herramientas`. Los demás packs (redes, seo, video, web-diseno, documentos, datos, etc.) se instalan solo cuando la tarea lo pida y después de revisar las skills de terceros con skill-inspector. No instales `todo` ni `personal`.
5. Conectores: Google Drive/Calendar/Gmail o Microsoft 365, Notion, Canva y los de Meta/Instagram que correspondan. Los conecta el dueño o yo con su login; guiame paso a paso.
6. Automatización: proponé n8n (Cloud o autoalojado, con costos y pros/contras) y esperá mi decisión.
7. Verificación: probá cada pieza con un test simple y anotalo.

Si algo se bloquea por permisos o por la red de la oficina, decime exactamente qué y qué tengo que pedir.

## FASE C – Auditoría por tarea y preguntas
Usá la skill `auditoria-por-tarea`. Seguí estos pasos, enfocados en redes sociales y automatizaciones:
1. **Inventario de roles y tareas:** por persona, qué hace en una semana típica, horas por tarea, herramientas y costo. Primer foco: la persona que maneja el Instagram.
2. **Clasificación:** (a) la IA la hace completa, (b) la IA la hace con revisión humana, (c) requiere a una persona (por ejemplo, la cara pública de Tobías y Joaquín, la ejecución de eventos en el lugar, seguridad, relación con aliados).
3. **Piloto en paralelo (3 a 4 semanas):** la IA hace las tareas del grupo (a) junto al trabajo humano; comparamos calidad, tiempo, costo y resultados.
4. **Decisión con datos:** matriz por sector con qué se automatiza, herramientas/APIs, costo y ahorro.
5. **Transición y control:** implementación por etapas con supervisión de calidad.

Antes de empezar, hacé en una sola tanda las preguntas necesarias, a partir de lo marcado como [CONFIRMAR] en el plan. Temas: quién maneja el Instagram (fundación, El Cuartito o ambas) y qué hace; cuántas personas más trabajan en redes, diseño, video y atención; herramientas que usan; inversión actual en redes y publicidad; objetivo principal de redes en cada organización; presupuesto mensual para plataformas y APIs; rol de El Cuartito en el FNS Forum y el AfterForum; y si hay una marca común para el proyecto de jóvenes y minería. Guardá las respuestas en las notas.

## FASE D – Oportunidades de la fase 1
Armá la matriz (oportunidad, herramienta, impacto, esfuerzo, prioridad) partiendo de la sección 6 del plan:
- El Cuartito: calendario editorial por evento (skill `calendario-eventos-el-cuartito`), guiones y captions con formato fijo (skill `contenido-redes-formatos`), plantillas de flyers y carruseles, flujo de recap de noches a reel con subtítulos, respuesta a DMs frecuentes con derivación a una persona, reporte semanal de métricas (skill `reporte-semanal-redes`).
- Fundación: embudo de jóvenes (skill `embudo-charlas-torchain`), motor de contenido por charla, series fijas, calendario único con Joaco y El Cuartito, registro verificado de impacto y plan 2026–2027 (sección 11 del plan).
- Transversal: hub de automatizaciones (n8n) que conecte Instagram/Meta, Canva, Drive, Sheets/Notion y mensajería, siempre con aprobación humana antes de publicar.
Marcá qué requiere cuentas profesionales de Instagram y los límites de la API de Meta (la app necesita una URL de política de privacidad).

Formatos de contenido: descripción de reels/posteos con 1ª línea = gancho del video, 2ª = resumen breve, 3ª = CTA explícito, y al final 5 hashtags del nicho; historias breves, concretas, con tono familiar y amigable. Adaptá el tono a cada marca.

## FASE E – Implementación
Con la matriz aprobada, implementá primero los quick wins: calendario del próximo mes, plantillas, banco de guiones, el primer workflow de n8n y el reporte semanal. Quick wins web de la fundación (solo como prototipo local, mostrándomelo antes de publicar):
1. Página `/privacidad` y casilla de consentimiento en los formularios (skill `privacidad-consentimiento-ar`).
2. Página de inscripción a las charlas, con confirmación y recordatorio automáticos, en lugar del formulario de Google.
3. Meta tags correctos y textos alternativos en las fotos (skill `seo-meta-tags-web`). Antes verificá el código fuente real de la página.
No compres dominios ni hosting ni publiques sin mi confirmación y la del dueño. Documentá todo para que el dueño y su equipo lo usen.

## FASE F – Medición
Línea base antes de empezar: alcance, vistas por reel, interacción, tiempo de respuesta, horas por tarea, costo por pieza, consultas o entradas (El Cuartito), inscriptos, asistentes y retención de jóvenes (fundación). Reporte semanal automático.

## Qué NO hacer todavía
Rediseño completo de sitios, compra de dominios o hosting, voces o avatares de IA, y cambios en otros sectores. Se evalúan después de las reuniones 1 y 2.

## Estructura de carpetas
/proyecto-cuartito-torchain
  CLAUDE.md
  INSTALACIONES.md
  PLAN-INICIAL.md
  /00-contexto
  /01-el-cuartito
  /02-fundacion-torchain
  /03-auditoria
  /04-automatizaciones
  /05-contenido
  /06-web-quickwins
  /07-reportes
  /vault-obsidian

Empezá por la Fase A. No instales ni conectes nada hasta que yo apruebe el plan de la Fase B.
````
