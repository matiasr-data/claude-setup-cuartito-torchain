# Revisión y calidad

La revisión es un paso con nombre, no buena voluntad. Los fallos que se ven a simple vista (un texto que se sale de su caja, un recuadro señalando la zona equivocada) los tienes que detectar tú antes que el creador. Aprende de cada corrección que te haga: si te señala un tipo de fallo, revisa ese tipo de fallo en todo el vídeo, no solo donde te lo señaló.

## El plan es un objeto revisable
El plan de edición (`PLAN.md`, del planificador) y la colocación (`timeline.json`) viven en archivos, no solo en la conversación. Así se pueden auditar, retomar y corregir.

## Aprobar por tramos, no en bloque
En cada serie de elementos parecidos (16 cortinillas, 30 ventanas de captura), haz el primero, que el creador lo apruebe, y entonces haz el resto. Un error de sincronía o de diseño repetido 16 veces se habría visto en el primero. Lo mismo con la revisión final: por tramos del vídeo.

## Hoja de contactos de TODOS los gráficos
Antes de cada punto de control y antes de entregar, genera una hoja de contactos con un fotograma de **todos** los gráficos (`scripts/hoja_contactos.sh`), no solo de los que has tocado. Revisar solo lo modificado deja pasar fallos obvios.

## Y el detalle a tamaño real
En una hoja de contactos cada viñeta es pequeña: desaparecen las tildes y no se ven solapes de pocos píxeles. Revisa además a tamaño real los gráficos con texto pequeño o dudoso. No des nada por perdido o por correcto solo por la miniatura.

## Vuelve a la referencia
Si hay referencias activas, consulta su ficha durante el montaje, no solo al principio. Compara cada tramo terminado con lo que la ficha dice que hace y lo que dice que no hace.

## Checklist antes de entregar
- [ ] El transcript de lo conservado se lee como un discurso continuo.
- [ ] Ningún término propio mal escrito en pantalla.
- [ ] Nunca dos planos seguidos del mismo tipo; ningún tramo de más de 30-60 s sin cambio visual.
- [ ] Todos los gráficos sincronizados con su palabra disparadora.
- [ ] Hoja de contactos completa revisada, y texto pequeño a tamaño real.
- [ ] Nada dentro de las zonas seguras ni en la pantalla final.
- [ ] Voz en −14 LUFS / −1 dBTP.
- [ ] Los gráficos tienen transparencia real (en la hoja de contactos se ve el fondo gris, no negro).
- [ ] Cada archivo de la entrega se abre y dura lo que debe (`ffprobe`); ningún archivo a medio escribir.
- [ ] Ruta exacta de la entrega comunicada al creador.
