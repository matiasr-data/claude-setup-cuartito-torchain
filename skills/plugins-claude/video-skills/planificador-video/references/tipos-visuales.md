# Del tipo de frase al tipo de visual

Para cada frase elegida, hazte la pregunta del editor: **¿qué tiene que ver el espectador para entenderlo aunque no estuviera escuchando?** La respuesta es el visual.

## Correspondencia

| Tipo de frase | Qué hace el visual | Ejemplos de animación | Posición habitual |
|---|---|---|---|
| Concepto nuevo | **Presentarlo**: darle un nombre y una forma que se pueda reconocer después | Nombre grande con una definición de pocas palabras; icono o símbolo que lo represente desde entonces | Pantalla completa la primera vez |
| Explicación / mecanismo | **Representarlo**: hacer visible cómo funciona | Diagrama, flujo de nodos, causa → efecto, interfaz dibujada | Pantalla completa |
| Dato o prueba | **Mostrarlo** con magnitud | Cifra que sube, gráfico, comparación de barras, captura del resultado real | Superpuesto si la cara aporta; completa si el dato es el protagonista |
| Pasos o lista | **Ordenarlo** | Lista que entra en cascada, pasos conectados, contador de paso ("2 de 5") | Pantalla completa o lateral |
| Comparación | **Enfrentarlo** | Antes/después, dos columnas, tachado del mito | Pantalla completa |
| Metáfora | **Hacerla literal** | La imagen de la comparación ("un cubo con agujeros") | Pantalla completa o superpuesto |
| Promesa o gancho | **Fijarla** | Texto grande con las mismas palabras del título | Superpuesto |
| Remate | **Subrayarlo** | Subtítulo de énfasis, palabra realzada | Superpuesto |
| Nombre de persona, marca o herramienta | **Identificarlo** | Rótulo, logo real | Superpuesto |
| Cambio de tema | **Situar** al espectador | Cortinilla de capítulo con el progreso ("2 de 6") | Pantalla completa |
| Frase que es el mensaje en sí | **Fijarla por escrito** junto a lo que la ilustra | Cita + ventana | Pantalla completa (lienzo) |
| Dato de apoyo con la persona como protagonista | **Acompañar** sin quitar la cara | Tarjeta en el hueco del encuadre | Superpuesto |
| Referencia a otro vídeo, un antes o un ejemplo grabado | **Traerlo** a la pantalla | Vídeo dentro del vídeo | Superpuesto |
| Cantidad ("hay muchos…", "todo el mundo…") | **Abrumar** con ejemplos | Mosaico de ventanas | Pantalla completa (lienzo) |
| Cómo se hace algo en una herramienta | **Enseñarlo de verdad** | El proceso real, anotado | Pantalla completa |

## Recursos de composición
Además del tipo de animación, cada visual se coloca con uno de estos recursos. Cómo se hace bien cada uno está en `editor-video/references/motion-graphics.md` (si esa skill está instalada):

| Recurso | Para qué sirve | Señal en el guion |
|---|---|---|
| **Lienzo** | Quitar la cara unos segundos para que la idea ocupe toda la pantalla: concepto a un lado, ventana al otro | Explicación de una idea clave, concepto nuevo, proceso |
| **Cita + ventana** | Que la frase se lea mientras se ve lo que la demuestra | Frase de nota alta en memoria; opiniones fuertes; algo que dijo otra persona |
| **Tarjeta en el hueco** | Apoyar con un dato sin perder la presencia de la persona | Dato o progresión dentro de un tramo personal |
| **Vídeo dentro del vídeo** | Traer otro material en movimiento | "En este vídeo…", "antes hacía…", "mirad lo que hizo…" |
| **Mosaico** | Transmitir cantidad o variedad, no un ejemplo concreto | "Hay muchísimos…", "todo el mundo está…" |
| **Proceso real anotado** | Demostrar que es real y enseñar dónde mirar | Tutoriales, "así se hace", "fíjate en…" |

Reglas al elegir:
- **El recurso más ligero que funcione.** Si la cara puede quedarse, tarjeta antes que lienzo.
- **Variedad:** el mismo recurso no más de dos veces seguidas, y nunca dos lienzos seguidos sin la cara en medio.
- **Lo real gana a lo dibujado:** si hay material real (captura, vídeo, interfaz) para la frase, el proceso anotado o la ventana van antes que una animación abstracta.

## Si el creador tiene un estilo de motion
Si el perfil indica `Estilo de motion:` y `editor-video` tiene ese estilo en `references/estilos/`, elige la pieza concreta de su **catálogo de componentes** y escríbela en la columna "Plantilla" del plan (por ejemplo, "lista con foco" o "widget de dato"). Si ninguna encaja, márcala como plantilla nueva que necesita aprobación y describe cómo sería con las reglas del estilo.

## Superpuesto o pantalla completa
- Cuando **la persona** es el contenido (opinión, emoción, historia, cierre), el visual acompaña y la cara manda: superpuesto.
- Cuando **la idea** es el contenido (concepto, proceso, cifra), el visual sustituye a la cara: pantalla completa.

## Reglas de cada animación
- **Una idea por animación.** Si una frase tiene dos ideas, son dos animaciones o se elige una.
- **El texto sale de la frase.** De 2 a 7 palabras, con las palabras que se dicen, para que el espectador lea lo que oye. Escríbelo literal en el plan.
- **Entra con la palabra clave**, no antes: si aparece antes de decirse, revienta el momento.
- **Usa las plantillas del creador** de `motion/` y su branding del perfil. Si ninguna plantilla encaja, propón una nueva y márcala como **plantilla nueva** en el plan: amplía el branding y debe aprobarla el creador.
- **Sistemas visuales:** lo que se repite en el vídeo se representa siempre igual. Si la idea clave 2 tiene un icono, ese icono vuelve cada vez que se habla de ella. Los pasos 1, 2 y 3 usan la misma plantilla. La repetición crea lenguaje y hace que el vídeo parezca una sola pieza.
- **Recursos del creador primero:** si en `recursos/` hay una captura o un b-roll real que muestra lo que se dice, suele ser mejor que una animación.
