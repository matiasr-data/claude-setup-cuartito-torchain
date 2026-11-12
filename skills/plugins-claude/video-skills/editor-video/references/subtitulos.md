# Subtítulos

## Decide primero si van
[El creador lo decidió el 2026-10-07 para sus vídeos a cámara: **sin subtítulos continuos**; solo texto quemado en lo importante, y el `.srt` aparte para YouTube.]
Los subtítulos quemados sirven para **enfatizar**, no para acompañar. Si están siempre, dejan de significar algo y el ojo los descarta como mobiliario. Si aparecen solo en los remates, su aparición misma es el énfasis.

[MEDIDO] La referencia viral analizada no llevaba subtítulos permanentes: texto grande solo en el gancho y en remates concretos. El resto iba limpio.

Lo decide el formato:
- **VSL en landing**: subtítulos en todo el vídeo, porque suele arrancar sin sonido.
- **Público (largo, medio)**: solo gancho y remates.
- **Vlog**: mínimos.

El perfil del creador puede cambiarlo. Siempre se entrega además el `.srt` completo para subirlo a YouTube (SEO, accesibilidad y cubre el resto del vídeo).

## Qué es un remate
La frase que cierra una idea, la promesa del gancho, una cifra que sorprende, una frase que el espectador debería recordar. Propón la lista de remates en el plan de edición; la elección final es del creador.

## Palabra a palabra, al segundo exacto
Cada palabra entra cuando se pronuncia, usando las marcas de tiempo del transcript. El texto que aparece de golpe se lee antes de que se diga y revienta el remate; al ritmo de la voz, el texto es la voz. Animación de partida: cada palabra entra un poco más grande y apagada y se asienta en ~0,16 s.

## Un realce, bien hecho
- Solo una palabra o frase realzada por plano. Si todo está resaltado, nada lo está.
- **El realce es una marca que se traza sobre la palabra, no un bloque de color detrás.** Se dibuja de izquierda a derecha, como cuando alguien selecciona texto en el móvil o lo subraya con un rotulador: empieza un par de fotogramas después de pronunciarse la palabra y tarda ~8 en completarse. Un bloque de color tapa la palabra, parece una pegatina y no cuenta nada; la marca que se traza *señala*, que es lo que el realce tiene que hacer. [Pedido por el creador el 2026-10-06 con referencias de selección de iPhone y subrayados de rotulador.]
- Tres marcas, con significado fijo para que el espectador las aprenda: **selección** (la palabra clave, por defecto), **subrayado** (un matiz; en color semántico, lo que está mal) y **círculo** (una vez por vídeo como mucho: la cifra o la palabra que hay que recordar). Los colores salen del perfil.
- La marca va **por línea**, no por frase: un trazo por cada línea que ocupe la frase clave; una barra única cruzaría palabras que no tocan. Si la frase ocupa dos palabras seguidas, la selección es continua (un solo tirador al principio y otro al final).
- **La palabra realzada necesita al menos 0,4 s de subtítulo por delante**: si es la última de la página y la siguiente página entra enseguida, la marca se corta a medio trazar. Realza una palabra anterior o alarga la página; el `timeline.py` avisa cuando pasa.
- Sobre un lienzo o una tarjeta clara, el texto va en tinta oscura sin contorno y la marca en su versión suave (`papel`).
- **El titular manda.** Un titular necesita al menos 1,2 s en pantalla; el subtítulo que venga detrás espera a que el titular se vaya (sus primeras palabras aparecen ya escritas). Si no, el titular se queda en medio segundo y parece un error.

## Corrección antes de quemar
El reconocedor falla justo en nombres de producto, marcas y anglicismos, que es donde mira el espectador experto. Revisa cada frase quemada contra los términos propios del perfil. Un error en un subtítulo quemado obliga a volver a renderizar.

## Legibilidad (valores de partida)
2-4 palabras por línea, sin puntos finales, contraste con sombra o contorno, permanencia mínima de 1 s por cada 3 palabras, por encima de la zona de la barra de progreso y nunca sobre la boca ni los ojos. Fuente y colores, del perfil (rol "subtítulos" y rol "acento" para la palabra activa).

## Formato técnico
Genera un `.ass` con los estilos del perfil. Para el kit de CapCut se entrega como capa transparente (`scripts/subtitulos_capa.sh`); para un vídeo único se quema (`scripts/quemar_subtitulos.sh`). Si los subtítulos de énfasis llevan animaciones más complejas que las del `.ass`, créalos como gráfico en el motor.
