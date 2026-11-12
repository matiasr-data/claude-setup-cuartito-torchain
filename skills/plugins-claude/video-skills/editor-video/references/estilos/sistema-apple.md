# Estilo de motion: sistema Apple

Léelo cuando el perfil del creador indique `Estilo de motion: sistema-apple`. Es un lenguaje completo de motion graphics destilado del estudio de 53 referencias (interfaces de iOS y macOS, WWDC, widgets, microinteracciones medidas fotograma a fotograma). Los colores y las fuentes concretas siguen saliendo del perfil; este archivo dice cómo se usan, cómo se construyen los componentes y cómo se mueven.

## La idea
Explica las ideas **con la interfaz de un iPhone y un Mac**. En lugar de inventar gráficos, toma objetos que todo el mundo ya sabe leer (una selección de texto, una notificación, un interruptor, una ventana, un botón, un widget) y conviértelos en metáforas: la palabra clave se selecciona, el dato vive en un widget, el cambio es un interruptor que se activa. Lo que lo hace sentir Apple es la contención: superficies limpias, un solo acento que aparece cuando algo se activa, tipografía grotesca enorme y un movimiento que siempre es un cambio de estado medido seguido de quietud. **No decora: responde.**

## Superficies

| Objeto | Radio de esquina (respecto al lado corto) |
|---|---|
| Píldora (botón, etiqueta, selector) | 50 % |
| Tarjeta o widget | 10–14 % |
| Icono de app | ~22 %, forma squircle (superelipse), nunca un círculo recortado |
| Ventana de macOS | 4–6 % realista; hasta 12 % estilizada |

- **Sombras:** siempre hacia abajo, nunca a los lados; desenfoque entre la mitad y el doble de la altura del objeto; opacidad 10–20 %, teñida del color del fondo. Sobre fondo oscuro, la sombra se sustituye por un **brillo del color del objeto**.
- **Borde de luz:** 1–2 px más claro que la superficie, más visible arriba. Separa el objeto del fondo sin dibujar una línea.
- **Materiales** (no más de dos por pieza):
  1. *Plano de sistema:* blanco o gris de interfaz con sombra suave.
  2. *Vidrio:* translúcido, borde de luz, lo de detrás desenfocado (el Liquid Glass actual de Apple).
  3. *Táctil:* degradado vertical sutil, bisel y reflejo, como un botón físico.
  4. *Luz de color:* degradado malla con grano fino dentro de un marco oscuro.
- **Fondos del lienzo:** casi lisos. Gris claro de Apple, blanco roto cálido o casi negro. Permitido: degradado radial muy suave, viñeta, rejilla finísima que se desvanece en los bordes, grano fino, sombras de ventana desenfocadas como luz natural.
- **Superficies oscuras:** #1E1E1E–#242424, nunca negro puro en un objeto.

## Color
Usa los roles del perfil con estas reglas:
- **Un solo acento por pieza.** Las únicas excepciones son los objetos que traen sus propios colores (semáforo de ventana, iconos de apps reales).
- **El color se gana.** La pieza es neutra hasta que algo se activa, se selecciona o sube; ese momento es cuando aparece el acento.
- **Cifras con la parte secundaria atenuada:** en "4.566,00 €" los decimales (o los miles en cifras redondas) van en gris.
- **Degradados solo para luz** (radial, del color al fondo) **o material** (malla con grano dentro de una tarjeta). Nunca en texto ni como fondo completo.
- **La luz viene de arriba:** brillos en el borde superior, sombras abajo, reflejos en la mitad superior de los botones.
- Valores de partida si el perfil no los fija: azul de sistema #007AFF para lo activo; resalte de selección #C8DCF8; semáforo #FF5F57 · #FEBC2E · #28C840.

## Tipografía
- **Una sola familia grotesca neutra** hace casi todo (SF Pro o equivalente: Inter, Neue Haas, Söhne; la que diga el perfil).
- **Titulares:** negrita, enormes, tracking apretado, interlineado ~0,9, frases cortas con punto final. El tono de un anuncio de Apple.
- **Cifras grandes:** peso regular o ligero; la escala ya las hace protagonistas.
- **Etiquetas:** pequeñas, gris medio, en caja normal encima o debajo del dato. Mayúsculas solo en etiquetas de sistema muy cortas.
- **Un contraste de familia, una vez por pieza:** una palabra en serif o serif cursiva dentro de una frase grotesca, en lugar de cambiarle el color.
- **Escritura a mano encima:** subrayados, círculos y ondas trazados a mano sobre un titular perfecto, para los matices.

## Iconos y objetos
- **Iconos reales de apps** (squircle) cuando se nombra una herramienta o marca.
- **Iconos de sistema** de trazo medio y esquinas redondeadas dentro de píldoras y botones.
- **Cursores de macOS** (flecha y mano) como personajes que señalan y pulsan.
- **Objetos de sistema como stickers:** ventanas con semáforo, notificaciones, burbujas de iMessage, carpetas, documentos, interruptores, menús de copiar y pegar.

## Movimiento
Cada animación es un **cambio de estado** (algo se selecciona, se abre, se activa, se envía, sube) y dura lo justo para entenderlo. Después, quietud.

| Gesto | Duración (a 30 fps) | Curva | Remotion |
|---|---|---|---|
| Aparecer, expandirse | 0,27 s (8 fotogramas) | ease-out: la mitad del recorrido en el primer tercio | `Easing.out(Easing.quad)` |
| Desaparecer, recogerse | 0,18 s (5–6 fotogramas) | ease-in | `Easing.in(Easing.quad)` |
| Moverse de A a B | 0,48 s (14–15 fotogramas) | ease-in-out, curva en S | `Easing.inOut(Easing.sin)` |
| Fundido con desenfoque (cambiar un contenido por otro) | 0,2–0,28 s | ease-out | opacidad + `blur` de ~12 px a 0 |
| Texto pequeño que aparece | ~0,3 s | fundido + desenfoque | |
| Gesto completo de un objeto (abrir, plegar, voltear) | 0,9–1,3 s, en fases de ~0,5 s | ease-in-out por fase | |
| Objeto físico que cae o se pulsa | lo que dure el gesto | rebote corto y amortiguado | `spring({damping: 14, stiffness: 180})` |

Reglas:
1. **Entrar dura 1,5 veces lo que salir.**
2. **Cada tipo de gesto tiene su curva** (tabla). Nunca lineal, salvo rotaciones continuas y contadores.
3. **Acción y reposo:** tras cada acción, al menos el doble de tiempo quieto. En vídeo, además, el reposo nunca es menor que el tiempo de lectura (`diseno-visual.md`).
4. **Un cambio de estado mueve varias propiedades a la vez** (posición, color, icono y texto en el mismo gesto). Se lee como una sola cosa que se transforma.
5. **Transformar antes que sustituir:** un círculo se estira en píldora, un mensaje se pliega en sobre, un trazo se convierte en espiral. Casi nunca desaparece una cosa para que aparezca otra.
6. **El desenfoque acompaña a la opacidad:** lo que aparece llega de desenfocado a nítido; lo que se va, al revés.
7. **Desenfoque de movimiento** solo en lo muy rápido: dígitos que ruedan, hojas que caen, zooms largos.
8. **Fondos vivos lentísimos:** manchas de color o líquido en ciclos de muchos segundos. Si se nota que se mueve, va demasiado rápido.

## Catálogo de componentes
Construye cada uno una vez como plantilla parametrizable en `motion/` y reutilízalo. El planificador elige el tipo de frase; esta tabla dice qué componente lo resuelve en este estilo.

| Componente | Cómo es y cómo se mueve | Para qué frase |
|---|---|---|
| **Selección de texto** | Resalte azul claro sobre la palabra clave con los dos tiradores de iOS (bolita arriba a la izquierda y abajo a la derecha). Los tiradores aparecen en la primera letra y el resalte crece de izquierda a derecha durante lo que dura la palabra (0,25–0,35 s). | La palabra clave de una frase. Es el realce de marca |
| **Menú contextual** | Píldora oscura con flecha sobre la selección y 1–3 opciones separadas por líneas finas. Aparece 0,15 s después de la selección con escala de 0,9 a 1 y ease-out. | "Lo que hay que hacer es…", dos caminos, la acción sobre un concepto |
| **Titular de anuncio** | Grotesca negrita enorme, 1–3 líneas con punto final, centrado y con mucho aire. Entra por palabras o líneas con fundido y desenfoque. | Tesis, promesa, remate |
| **Anotación a mano** | Subrayado, círculo u onda en trazo fino de color que se dibuja en 0,3–0,5 s sobre el titular. | Matices, contrastes dentro de una frase |
| **Rueda de palabras** | Frase fija y, a su lado, una columna de píldoras que rota en vertical como un selector de iOS: la central nítida, las vecinas más pequeñas, desenfocadas y apagadas. Cada cambio es un movimiento de A a B. | Enumeraciones que comparten una frase |
| **Lista con foco** | Filas en píldora apiladas y solapadas; la activa crece, se vuelve opaca y gana sombra; las demás se encogen y se apagan hacia los extremos. El foco viaja con la palabra. | Varias opciones o pasos, uno destaca |
| **Paso a paso** | Nodos unidos por una línea; la línea se rellena hasta el siguiente nodo y el anillo de foco viaja con él; el anterior queda en gris "hecho". | Procesos, secuencias, "primero… luego…" |
| **Ramas y nodos** | Líneas finas con codos redondeados y nodos circulares de vidrio con punto blanco; se dibujan con un punto en la cabeza. | Caminos que se separan o se juntan |
| **Convergencia** | Varias líneas de un color que se curvan hasta juntarse en una de otro color terminada en un punto. | "Todo esto lleva a…", del caos al foco |
| **Un trazo que se transforma** | Una sola línea fina con un punto en la cabeza que dibuja una forma y, sin cortarse, se convierte en la siguiente. | Hilo conductor entre varias ideas seguidas |
| **Widget de dato** | Tarjeta (clara o oscura) con etiqueta gris, cifra grande con la parte secundaria atenuada, y una barra, línea o gráfico que se llena en el momento en que se dice la cifra. | Dinero, métricas, resultados |
| **Donut o gráfico con luz** | Anillo grueso con extremo redondeado que se llena; etiquetas en pastillas de esquinas redondeadas; o disco claro con un núcleo de luz de color. | Porcentajes, repartos |
| **Contador** | Dígitos que ruedan con desenfoque vertical, o un calendario que pasa hojas acelerando y frenando. | Crecimiento, fechas, plazos |
| **Morph de botón** | Un control cambia de estado en un solo gesto: círculo que se estira en píldora, micrófono que viaja y se vuelve stop, carga que termina en check. | Empezar, terminar, conseguirlo |
| **Botón de llamada a la acción** | Píldora táctil (negra brillante o del color de acento con brillo) con flecha o icono en un círculo; se pulsa: se hunde un poco y suelta. | "Reserva", "comenta", "link en la descripción" |
| **Interruptor de dos estados** | Control segmentado o interruptor de iOS que pasa de un estado a otro con un movimiento de A a B. | Antes / después, normal / pro, sí / no |
| **Notificación y burbujas** | Notificación de iOS que baja desde arriba con ease-out; burbujas de iMessage que entran una a una desde abajo. | Mensajes, avisos, lo que dice un cliente |
| **Ventana** | Ventana de macOS, navegador o Finder con semáforo, con el contenido real dentro; o terminal con texto que se escribe con cursor de bloque. | Herramientas, webs, capturas, código |
| **Constelación de apps** | Icono central y, alrededor, iconos reales a varias escalas: los cercanos grandes y desenfocados, los lejanos pequeños y nítidos, flotando muy despacio. | Ecosistemas, "todas estas herramientas" |
| **Objetos-metáfora** | Cartera con tarjetas (dinero), sobre que se pliega y sale volando (enviar), carpeta que guarda un documento (organizar), zoom desde la Tierra hasta un lugar (dónde). | La frase que nombra la acción |

## Crear un componente nuevo
La mayoría de las frases no tendrán un componente exacto. Créalo así:
1. **Busca el objeto de sistema que ya significa eso.** ¿Qué elemento de un iPhone o un Mac representa la idea: un interruptor, una notificación, un selector, una barra de progreso, un menú, un semáforo? El espectador ya sabe leerlo.
2. **Haz que el objeto haga su gesto natural** en el momento de la palabra clave: el interruptor se activa, la barra se llena, el sobre se cierra.
3. **Amplíalo hasta que sea protagonista.** Un botón de 40 px escalado a media pantalla deja de ser interfaz y se convierte en símbolo.
4. **Aplica el vocabulario:** material, radio, sombra, un solo acento, su curva y su duración.
5. **Comprueba que se entiende sin sonido.**
6. **Guárdalo como plantilla** y márcalo en el plan como plantilla nueva para que el creador lo apruebe.

## Adaptarlo a vídeo
Estas referencias son, sobre todo, interfaces. Para que funcionen en un vídeo de YouTube:
- **Escala:** todo es 2–3 veces más grande que en una interfaz real. En 1920×1080, un titular ocupa al menos la mitad del ancho, y una píldora, como mínimo 80 px de alto.
- **Velocidad del gesto, sí; duración en pantalla, no:** el gesto dura lo que dice la tabla, pero el componente se queda el tiempo de lectura y sincronizado con la frase que lo dispara.
- **Sobre la persona:** material de vidrio o de sistema con sombra suave, colocado en el hueco del encuadre. Sobre un plano oscuro, versión oscura con borde de luz.
- **A pantalla completa:** el lienzo usa uno de los fondos del estilo, y los componentes se componen con mucho aire.
- **Un componente protagonista a la vez.** Si entra uno nuevo, el anterior se va o pasa a segundo plano (más pequeño, desenfocado, apagado), como en la lista con foco.

## Lo que este estilo no hace nunca
- Transiciones de plantilla: cubos 3D, cortinillas con formas, barridos de colores.
- Texto con efectos: contornos gruesos, sombras duras, degradados dentro de las letras, texto 3D.
- Rebotes elásticos que se pasan de largo varias veces, o saltos de escala bruscos.
- Movimiento constante sin motivo.
- Varios acentos de color a la vez.
- Iconos dibujados a mano o de estilos mezclados.
- Negro puro en objetos, sombras grises sin teñir, esquinas rectas en objetos de interfaz.
- Fondos cargados: fotos de stock detrás de un gráfico, texturas fuertes.
- Todo entrando a la vez.

## Checklist antes de dar un gráfico por bueno
- [ ] Usa un objeto de sistema reconocible, o un componente del catálogo.
- [ ] Un solo acento de color, y aparece cuando algo se activa.
- [ ] Radios, sombras y bordes de luz según la tabla de superficies.
- [ ] Cada gesto con su duración y su curva; la entrada más lenta que la salida.
- [ ] Después de cada gesto hay reposo, y el texto se puede leer.
- [ ] Se entiende sin sonido.
- [ ] Ninguna de las prohibiciones.
