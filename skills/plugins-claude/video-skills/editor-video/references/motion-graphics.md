# Motion graphics

Un gráfico existe porque explica algo mejor que la imagen. No es decoración.

## Estilo de motion: léelo antes que nada
El perfil del creador dice qué estilo de motion usa (`Estilo de motion:`). Si nombra uno de `references/estilos/`, lee ese archivo antes de diseñar o animar cualquier gráfico:

| Estilo | Archivo | En una línea |
|---|---|---|
| `sistema-apple` | `estilos/sistema-apple.md` | Interfaz real de Apple: materiales claros, un solo acento, sombras suaves, movimiento medido y tranquilo |

Cómo manda el estilo:
- Este archivo decide **qué** frase lleva gráfico y **qué tipo** de gráfico; el estilo decide **cómo se ve y cómo se mueve**.
- Si el catálogo de componentes del estilo tiene una pieza para el disparador, úsala en lugar de la opción genérica de la tabla de abajo.
- Si no la tiene, crea una nueva con el método "Crear un componente nuevo" del estilo; nunca improvises fuera de sus tokens (radios, sombras, colores, curvas, duraciones).
- Los valores concretos de marca (color de acento, fuentes, logo) vienen del branding del creador y pisan los valores por defecto del estilo.
- Sin estilo en el perfil: usa las reglas genéricas de este archivo y `diseno-visual.md`.

## Cada gráfico lo activa un disparador del guion
Primero importa, después la forma: qué frases merecen un gráfico lo decide el planificador (`planificador-video`) por su importancia en el vídeo, no por contener una palabra concreta. Un disparador por sí solo no justifica una animación. Una vez elegida la frase, esta tabla ayuda a convertir "¿qué pongo aquí?" en una búsqueda, y garantiza que el gráfico explica algo en vez de rellenar:

| Se dice… | Gráfico |
|---|---|
| Una cifra, un precio, un dato | Contador o cifra grande |
| Una enumeración, pasos | Lista que entra en cascada |
| "La mayoría cree que…", un mito, un error | Tachado / antes-después |
| Una comparación ("es como…") | Metáfora visual literal |
| Un lugar | Pin / mapa |
| El nombre de una persona o marca | Rótulo (lower third) o logo real |
| Una herramienta, menú, botón | Ventana de captura con cursor |
| Un cambio de tema | Cortinilla de capítulo |
| Una fecha o plazo | Calendario / cuenta atrás |
| Un enlace | "Link en la descripción" con flecha abajo |
| La promesa del título | Texto grande con las mismas palabras |
| Categorías, etiquetas, "cosas que lleva" | Píldoras (etiquetas redondas con icono) en cascada |
| Estados o resultados ("hecho", "pendiente", "falló") | Píldoras de estado, cada una con su color |
| Una secuencia ("primero… luego… al final") | Pasos conectados por una línea que se va rellenando |
| Un proceso o una cadena ("esto pasa a esto") | Flujo de nodos unidos por líneas que se trazan |
| "Tengo varias cosas" y las va nombrando | Lista apilada con foco: la que se nombra sube al centro |
| Un aviso, un mensaje, "te llega" | Notificación como la del móvil |
| Un cambio de idea o un concepto que hay que leer con calma | El lienzo (ver abajo) con el texto encima |
| Una explicación que necesita la pantalla entera | El lienzo con un concepto y una ventana |
| La frase misma es el mensaje (una idea fuerte, una opinión, algo que alguien dijo) | Cita + ventana |
| Un dato de apoyo mientras la persona sigue siendo lo importante | Tarjeta en el hueco del encuadre |
| Se menciona otro vídeo, un antes, un ejemplo grabado | Vídeo dentro del vídeo |
| "Hay muchos…", "todo el mundo hace…", varios ejemplos a la vez | Mosaico de ventanas |
| Cómo se hace algo en una herramienta, un proceso que se puede enseñar de verdad | El proceso real, anotado |

La densidad la marca el formato (`formatos.md`): si hay más disparadores que hueco, quédate con los que más explican.

## Persona → overlay; concepto → pantalla completa
Cuando la persona es el contenido (intro, opinión, cierre), el gráfico acompaña y la cara manda. Cuando la idea es el contenido (un concepto, un proceso, una cifra), el gráfico sustituye a la cara, que estorba. Elegir mal cuesta en los dos sentidos: taparse a uno mismo cuando tocaba la cara, o dejar la cara cuando hacía falta un esquema entero. Motion graphics de principio a fin es otro formato (faceless), no un estilo.

Decide overlay o pantalla completa para cada tramo en el plan de edición.

## Coreografía
- **Primero el envase, después el contenido, nunca a la vez.** La tarjeta llega y *entonces* entra el texto. Cada elemento que entra es un punto de atención: si entran dos juntos se gasta uno. Secuenciar multiplica los momentos sin añadir elementos.
- **En cascada, nunca en bloque.** Los ítems de una lista entran escalonados (~4 fotogramas entre uno y otro a 30 fps). Además deja tiempo para leer cada uno.
- **La entrada es más lenta que la salida.** Entrada de 6-8 fotogramas con desaceleración (ease-out); salida de 4-5 con aceleración (ease-in), o corte seco con el plano. Entrar es presentar; salir es quitar y no necesita ceremonia.
- **Cada gesto tiene su curva.** Aparecer: desaceleración (ease-out). Desaparecer: aceleración (ease-in). Ir de A a B dentro del plano: suave en los dos extremos (ease-in-out). Una curva lineal solo para cosas que no paran (un contador, una barra que se llena).
- **Acción y reposo se alternan.** Tras cada gesto, un reposo al menos igual de largo para que el ojo lea el resultado antes del siguiente. Un objeto que no para nunca no se lee.
- **Lo rápido parece barato.** Si una animación queda nerviosa, alarga la entrada antes de tocar la curva. Las velocidades por defecto de cualquier herramienta están pensadas para que el efecto se note, no para que se sienta bien.
- **Nada quieto del todo:** movimiento residual leve mientras el gráfico está en pantalla.
- Sincroniza la aparición con la palabra que lo dispara, usando las marcas de tiempo del transcript.

## Capturas e interfaces
- **La imagen llena el cuadro, con el mismo marco siempre.** Ventana a ~88 % del ancho, esquinas redondeadas, borde fino y sombra larga. Si la captura no es 16:9, recorta centrando la zona de la que se habla. Un recuadro pequeño obliga a entrecerrar los ojos; un marco que cambia cada vez impide reconocer "esto es una pantalla".
- **Un cursor que viaja y hace clic.** Arranca y frena suave, se hunde un poco al pulsar y suelta una onda. El cursor le dice al espectador dónde mirar; sin él, la captura es un texto que hay que leer entero.
- **Las coordenadas se leen de cada captura.** Nunca reutilices las de otra parecida: la ventana estará en otro sitio y la flecha señalará al vacío. Usa `scripts/rejilla.sh` para leer posiciones.
- **La anotación va pegada a la imagen, no al marco**, para que al recortar o mover la imagen siga señalando lo mismo.
- **Cuando la captura no se lee, se dibuja la interfaz.** Una captura ampliada mucho se ve sucia; redibujada se lee nítida y se puede animar (el menú que se despliega, el interruptor que cambia). Criterio: captura grande y legible → ventana flotante; detalle pequeño → reconstruirlo como gráfico; sin captura → interfaz dibujada.
- **Excepción: los logos de marca se usan reales** (PNG con fondo transparente). El espectador reconoce el original y una aproximación dibujada se lee como falsa.

## Un realce por plano
Si todo está resaltado, nada lo está.

## El lienzo: el panel a pantalla completa
Cada cierto tiempo el plano de la persona desaparece unos segundos y la pantalla pasa a un lienzo limpio donde viven los gráficos de ese tramo. Da aire al vídeo, rompe la monotonía del busto parlante y convierte el gráfico en protagonista sin competir con la cara. Cómo es la superficie del lienzo (color, textura, si es una hoja, un fondo liso o un degradado), cómo entra y sale, y si el texto aparece escrito letra a letra o de golpe lo fija el perfil del creador: aquí está solo la lógica.
- **Cuándo:** cuando la idea es el contenido (una explicación, una enumeración, un proceso, una frase que hay que leer), y como ritmo, cada 20–40 s intercalado con los gráficos superpuestos. Dura 2–6 s: lo que tarde en decirse el tramo. Un lienzo por idea, no por frase; dos lienzos seguidos en menos de 10 s cansan (salvo en formato faceless).
- **Entrada y salida:** sincronizadas con la primera palabra del tramo y con la primera del siguiente. La entrada más lenta que la salida (unos 9–10 fotogramas con desaceleración al entrar, 6–7 con aceleración al salir).
- **Nada quieto:** mientras está, el lienzo deriva despacio (unos píxeles y un 2 % de escala). Los gráficos encima derivan la mitad: eso da profundidad.
- **Composición en dos zonas.** La forma más clara de un lienzo es asimétrica: a un lado el concepto (una palabra, una cita, un gráfico pequeño) y al otro una ventana grande con el material (captura, vídeo, interfaz). Mucho espacio vacío alrededor: el vacío es lo que hace que se vea caro. Nunca más de dos o tres elementos a la vez.
- **Ventanas siempre con el mismo marco** (las reglas de *Capturas e interfaces*): esquinas redondeadas, sombra suave, misma proporción. El espectador aprende que "un rectángulo así es material real".
- **Un lienzo con solo texto es aburrido.** Cada lienzo lleva al menos un gráfico que se mueve *con lo que se dice*: una cuadrícula que se multiplica («cada vez hay más…»), una gráfica que sube («a medio y largo plazo»), pasos que se encienden, cruces que se acumulan. El movimiento empieza en la palabra que lo dispara y sigue vivo mientras el lienzo está. [Feedback de Mario, 2026-10-07: «el panel es bastante aburrido, crea motion graphics dentro del propio panel».]
- Al volver, la persona vuelve con el encuadre que tocaba por la curva de cámara: el lienzo no reinicia nada.

## Recursos de composición
Seis formas de poner material en pantalla, cada una con su trabajo. El planificador elige cuál según el tipo de frase (`planificador-video/references/tipos-visuales.md`); aquí está cómo se hace bien cada una.

### Cita + ventana
La frase clave escrita entre comillas, grande, a un lado del lienzo, y al otro una ventana con lo que la ilustra.
- **Cuándo:** la frase en sí es el mensaje (una opinión fuerte, una afirmación que se va a discutir, algo que dijo otra persona) y además hay algo que enseñar.
- **Cómo:** el texto es la frase literal recortada a lo esencial (de 5 a 12 palabras, con puntos suspensivos si se corta). Las palabras aparecen al ritmo de la voz; la ventana entra justo después de la primera palabra: primero el envase, después el contenido. Alineada a la izquierda, interlineado apretado, comillas grandes que forman parte del diseño.
- **Cuándo no:** si la frase no tiene fuerza por sí sola, o si ya hay un subtítulo de énfasis diciendo lo mismo.

### Tarjeta en el hueco del encuadre
Un dato o un gráfico pequeño en una tarjeta colocada en el espacio vacío del plano, mientras la persona sigue hablando a cámara.
- **Cuándo:** un dato o una progresión que apoya lo que se dice pero no merece quitar la cara (la persona es el contenido; el dato, el apoyo).
- **Cómo:** busca el hueco real del encuadre (normalmente el lado contrario a la cara o la parte de arriba) con `scripts/rejilla.sh` sobre un fotograma; la tarjeta nunca toca la cara, los ojos ni las manos que gesticulan. Un solo dato o gráfico por tarjeta, con un título corto. El gráfico de dentro se mueve con lo que se dice (las barras suben cuando se nombran las cifras). Si el plano tiene zoom, la tarjeta va pegada a la pantalla, no a la escena.
- **Cuándo no:** si el encuadre no tiene hueco (plano muy cerrado): entonces va al lienzo.

### Vídeo dentro del vídeo
Otro vídeo reproduciéndose en una ventana enmarcada sobre el plano de la persona.
- **Cuándo:** se menciona otro vídeo, un "antes" grabado, un ejemplo en movimiento o lo que alguien hizo.
- **Cómo:** la ventana va en el hueco del encuadre, como la tarjeta, y el vídeo de dentro empieza en su momento más reconocible, no en su segundo cero. Sin su audio salvo que se pida. Borde fino del color de acento del perfil para separarla del fondo.
- **Cuándo no:** para material sin movimiento (eso es una captura) o si hay que leer detalles pequeños (eso va a pantalla completa).

### Mosaico de ventanas
Varias ventanas a la vez en un lienzo, de tamaños distintos, ligeramente desordenadas.
- **Cuándo:** "hay muchos…", "todo el mundo está haciendo…", una galería de ejemplos. El mensaje es la cantidad, no ningún ejemplo concreto.
- **Cómo:** de 3 a 6 ventanas que entran en cascada, sin que ninguna tape del todo a otra; el espectador no tiene que leerlas. Ligero movimiento independiente en cada una. Si una importa más, se agranda al final y las demás se desenfocan.
- **Cuándo no:** si el espectador debería entender cada ejemplo: entonces van de uno en uno.

### El proceso real, anotado
En vez de un icono abstracto, se enseña el material real del proceso (la interfaz de la herramienta, la línea de tiempo, la forma de onda, el documento) y se anota encima lo que se explica.
- **Cuándo:** tutoriales y explicaciones de "cómo se hace". Es el recurso más convincente que hay: el espectador ve que es real.
- **Cómo:** el material va en una ventana con el marco de siempre, y encima se dibujan las anotaciones que dicen la frase: recuadros, marcas, flechas, zonas resaltadas. Si se habla de quitar algo, se marca en el color semántico del perfil (el de "error / lo que sobra") antes de quitarlo. Se puede bajar la saturación del material para que las anotaciones destaquen. Cada anotación entra con la palabra que la nombra y se lee de las coordenadas de esa captura concreta.
- **Cuándo no:** si el material real no se lee ni ampliado: entonces se dibuja la interfaz.

### Combinarlos
Un vídeo bien editado alterna estos recursos con el plano de la persona y con los gráficos simples: cara → tarjeta en el hueco → cara → lienzo con cita + ventana → cara → proceso anotado… Nunca dos lienzos seguidos ni el mismo recurso tres veces seguidas.

## Conexiones entre puntos
Las líneas que se trazan entre puntos, con un pulso que viaja por ellas, son el movimiento que une los gráficos del perfil: pasos, flujos, relaciones y la red de fondo del lienzo.
- La línea se dibuja **después de que exista el origen y antes de que aparezca el destino** (unos 10 fotogramas antes de la palabra que nombra el destino): el ojo llega al nodo nuevo guiado por la línea.
- El pulso recorre la línea mientras los dos extremos están activos (un ciclo cada ~1,3–1,8 s). Es el "nada quieto del todo" de estos gráficos.
- Úsalas cuando el guion una dos cosas: "de A a B", "primero… luego…", "esto genera esto". No para decorar un texto que no conecta nada: ahí va la red de fondo, que es decoración declarada, a baja intensidad.

## Elementos importados
Lo que se trae de fuera (stickers, iconos, imágenes) se tiñe con la paleta del perfil para que no delate que está pegado. Clasifica los elementos de `recursos/` en cuatro estados y respétalos:
- **Listo**: se usa tal cual.
- **Recolorear**: se adapta a la paleta.
- **Recrear**: se rehace sin marcas ajenas.
- **Solo referencia**: inspira pero no se publica nunca (marcas de agua, logos ajenos, material sin licencia).

Usa siempre versiones con fondo transparente real: un JPG con el damero de transparencia "pintado" se nota.
