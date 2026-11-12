# Motion graphics

Un gráfico existe porque explica algo mejor que la imagen. No es decoración.

## Cada gráfico lo activa un disparador del guion
Esto convierte "¿qué pongo aquí?" en una búsqueda en una tabla, y garantiza que el gráfico explica algo en vez de rellenar. Recorre el transcript buscando disparadores:

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

La densidad la marca el formato (`formatos.md`): si hay más disparadores que hueco, quédate con los que más explican.

## Persona → overlay; concepto → pantalla completa
Cuando la persona es el contenido (intro, opinión, cierre), el gráfico acompaña y la cara manda. Cuando la idea es el contenido (un concepto, un proceso, una cifra), el gráfico sustituye a la cara, que estorba. Elegir mal cuesta en los dos sentidos: taparse a uno mismo cuando tocaba la cara, o dejar la cara cuando hacía falta un esquema entero. Motion graphics de principio a fin es otro formato (faceless), no un estilo.

Decide overlay o pantalla completa para cada tramo en la hoja de edición.

## Coreografía
- **Primero el envase, después el contenido, nunca a la vez.** La tarjeta llega y *entonces* entra el texto. Cada elemento que entra es un punto de atención: si entran dos juntos se gasta uno. Secuenciar multiplica los momentos sin añadir elementos.
- **En cascada, nunca en bloque.** Los ítems de una lista entran escalonados (~4 fotogramas entre uno y otro a 30 fps). Además deja tiempo para leer cada uno.
- **La entrada es más lenta que la salida.** Entrada de 6-8 fotogramas con desaceleración (ease-out); salida de 4-5 con aceleración (ease-in), o corte seco con el plano. Entrar es presentar; salir es quitar y no necesita ceremonia.
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

## Elementos importados
Lo que se trae de fuera (stickers, iconos, imágenes) se tiñe con la paleta del perfil para que no delate que está pegado. Clasifica los elementos de `recursos/` en cuatro estados y respétalos:
- **Listo**: se usa tal cual.
- **Recolorear**: se adapta a la paleta.
- **Recrear**: se rehace sin marcas ajenas.
- **Solo referencia**: inspira pero no se publica nunca (marcas de agua, logos ajenos, material sin licencia).

Usa siempre versiones con fondo transparente real: un JPG con el damero de transparencia "pintado" se nota.
