---
name: nutrir-editor
description: Analiza transcripts y fichas de vídeos nuevos y actualiza la skill editor-video con la lógica de edición aprendida. Úsala cuando el usuario diga "nutre el editor", "procesa los transcripts nuevos", "aprende de estos vídeos" o añada archivos a transcripts/nuevos/.
---

# Nutrir el editor

Skill privada del creador: mejora la skill pública `editor-video` sin meter dentro los transcripts (pesan mucho y pueden ser contenido de otros). Solo entra en la skill lo aprendido, nunca texto literal.

1. Lee cada archivo de `transcripts/nuevos/` (y su ficha si existe).
2. Extrae la **lógica** de edición, no el proceso ni la estética: por qué cae un corte, por qué ese sonido, qué dispara un gráfico, qué problema de atención resuelve. Formato: regla → por qué funciona → ejemplo genérico. Marca cada dato como [MEDIDO] o [MIRADO].
3. **Comprueba que las fuentes son independientes.** Si varios vídeos comparten guion, trucos en el mismo orden o son el mismo vídeo doblado, cuentan como una sola fuente. Un truco copiado tres veces no pesa más que una regla dicha una vez.
4. Compara con `~/skills-repo/editor-video/references/` y clasifica cada hallazgo:
   - **Nuevo**: no hay regla parecida.
   - **Refuerzo**: confirma una regla (no se toca; se anota).
   - **Contradicción**: choca con una regla existente.
5. Muestra al usuario un resumen y el diff propuesto. No apliques nada sin confirmación; las contradicciones las decide siempre el usuario.
6. Aplica lo aprobado en el archivo de `references/` que corresponda, respetando su estructura. Nunca añadas colores, fuentes, sonidos ni momentos concretos.
7. Añade una entrada en `~/skills-repo/editor-video/CHANGELOG.md` y sube la versión.
8. Mueve lo procesado a `transcripts/procesados/`.
