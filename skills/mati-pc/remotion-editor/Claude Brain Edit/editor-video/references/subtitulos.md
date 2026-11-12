# Subtítulos

## Decide primero si van
Los subtítulos quemados sirven para **enfatizar**, no para acompañar. Si están siempre, dejan de significar algo y el ojo los descarta como mobiliario. Si aparecen solo en los remates, su aparición misma es el énfasis.

[MEDIDO] La referencia viral analizada no llevaba subtítulos permanentes: texto grande solo en el gancho y en remates concretos. El resto iba limpio.

Lo decide el formato:
- **VSL en landing**: subtítulos en todo el vídeo, porque suele arrancar sin sonido.
- **Público (largo, medio)**: solo gancho y remates.
- **Vlog**: mínimos.

El perfil del creador puede cambiarlo. Siempre se entrega además el `.srt` completo para subirlo a YouTube (SEO, accesibilidad y cubre el resto del vídeo).

## Qué es un remate
La frase que cierra una idea, la promesa del gancho, una cifra que sorprende, una frase que el espectador debería recordar. Propón la lista de remates en la hoja de edición; la elección final es del creador.

## Palabra a palabra, al segundo exacto
Cada palabra entra cuando se pronuncia, usando las marcas de tiempo del transcript. El texto que aparece de golpe se lee antes de que se diga y revienta el remate; al ritmo de la voz, el texto es la voz. Animación de partida: cada palabra entra un poco más grande y apagada y se asienta en ~0,16 s.

## Un realce, bien hecho
- Solo una palabra o frase realzada por plano. Si todo está resaltado, nada lo está.
- El subrayado va **por línea**, no por frase: un trazo por cada línea que ocupe la frase clave. Una barra única cruzaría palabras que no tocan. Agrupa las palabras por línea con unos píxeles de tolerancia para que diferencias mínimas de altura no partan una línea en dos.

## Corrección antes de quemar
El reconocedor falla justo en nombres de producto, marcas y anglicismos, que es donde mira el espectador experto. Revisa cada frase quemada contra los términos propios del perfil. Un error en un subtítulo quemado obliga a volver a renderizar.

## Legibilidad (valores de partida)
2-4 palabras por línea, sin puntos finales, contraste con sombra o contorno, permanencia mínima de 1 s por cada 3 palabras, por encima de la zona de la barra de progreso y nunca sobre la boca ni los ojos. Fuente y colores, del perfil (rol "subtítulos" y rol "acento" para la palabra activa).

## Formato técnico
Genera un `.ass` con los estilos del perfil. Para el kit de CapCut se entrega como capa transparente (`scripts/subtitulos_capa.sh`); para un vídeo único se quema (`scripts/quemar_subtitulos.sh`). Si los subtítulos de énfasis llevan animaciones más complejas que las del `.ass`, créalos como gráfico en el motor.
