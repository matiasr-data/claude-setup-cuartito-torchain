---
name: planificador-video
description: Planifica estratégicamente la edición de un vídeo antes de tocarlo. Lee el transcript, encuentra la tesis y las ideas clave, puntúa cada frase para decidir cuáles necesitan apoyo visual y de qué tipo, y produce un plan por fases (cortes, zooms, motion graphics, subtítulos, efectos de sonido y música) con el porqué de cada decisión, listo para ejecutar fase a fase. Úsala siempre como primer paso al editar un vídeo (también cuando la llame editor-video), y cuando el usuario pida planificar una edición, decidir qué frases animar o qué motion graphics poner, preguntar "dónde meto gráficos", o revisar o corregir el plan de un vídeo.
---

# Planificador de vídeo

Lo que aparece en pantalla hace dos trabajos: **explicar** (el espectador entiende un concepto mucho mejor si lo ve que si solo lo oye) y **retener** (lo visual mantiene el vídeo fresco). Por eso un buen editor no decide las animaciones mirando la línea de tiempo: las decide leyendo el guion, antes de tocar nada.

Esta skill es ese editor. Su trabajo termina en un plan, no en un render. Planificar sobre el papel es barato y se corrige en segundos; un render equivocado cuesta minutos u horas.

## Entradas

- **Transcript con marcas de tiempo por palabra.** Si no existe, transcribe primero. Corrige nombres propios, marcas y anglicismos antes de planificar: el texto de las animaciones sale de aquí.
- **Formato del vídeo** (gancho, VSL, largo, medio, vlog). Si no se deduce, pregunta en una línea.
- **Si existen en el proyecto:** `perfil-creador.md` (preferencias y branding), las plantillas de `motion/`, las referencias activas, el título y la miniatura, y `planificacion/ejemplos.md` (las correcciones anteriores del creador). Léelos antes de puntuar: son el criterio del creador.

## Proceso

### Paso 0. Mapa de valor: entender el vídeo antes que las frases
Lee el transcript entero de principio a fin, sin marcar nada todavía, y escribe:
- **La tesis** en una frase: qué se lleva el espectador si solo recuerda una cosa.
- **Las ideas clave**, de 3 a 7, en el orden en que aparecen. Son la ruta del espectador por el vídeo.
- **La promesa** del título y la miniatura, y dónde se cumple.
- **El momento de más valor** del vídeo.

Sin este paso, cada frase se juzga aislada y acabas animando cosas llamativas pero secundarias. Con él, cada animación tiene que apoyar una idea clave.

### Paso 1. Analizar: puntuar las frases
Divide el transcript en frases y, para cada una que pueda importar, pregúntate lo mismo que un editor: **¿es crucial para que el espectador entienda o recuerde esto?** Conviértelo en una nota con `references/puntuacion.md`: tres ejes del 0 al 3 (comprensión, peso y memoria) y un tipo de frase. Solo las frases con nota suficiente pasan al paso siguiente.

### Paso 2. Planificar el apoyo visual de cada frase elegida
El tipo de frase decide el tipo de visual: un concepto nuevo se **presenta**, una explicación se **representa**, un dato se **muestra**, unos pasos se **ordenan**, una comparación se **enfrenta**. Detalle en `references/tipos-visuales.md`. Para cada frase decide también si va superpuesta a la cara o a pantalla completa, qué plantilla del creador usa y qué texto exacto lleva.

### Paso 3. Presupuesto y ritmo
El formato marca cuántas animaciones caben. Si hay más candidatas que hueco, se quedan las de más nota, repartidas, y cada idea clave con al menos un apoyo visual. Reglas en `references/presupuesto.md`.

### Paso 4. Planificar el resto de fases
Con el mapa de valor y las frases elegidas, deriva el plan de cada fase: qué se corta, dónde van los zooms, qué subtítulos de énfasis van, qué efectos de sonido y cómo se comporta la música. Todo sale de la misma lectura del guion, por eso se planifica junto. Reglas en `references/fases.md`.

### Paso 5. Autorrevisión
Antes de enseñar el plan, compruébalo como si fuera de otro:
- [ ] Cada idea clave del mapa de valor tiene al menos un apoyo visual.
- [ ] Ninguna frase secundaria está animada mientras una idea clave se queda sin nada.
- [ ] Ningún tramo de más de 30-60 s sin un cambio visual.
- [ ] No hay dos animaciones a pantalla completa seguidas ni animaciones amontonadas.
- [ ] Cada animación tiene texto literal sacado de la frase, plantilla asignada y su porqué.
- [ ] Ninguna frase con nota alta está en la lista de cortes.
- [ ] El gancho repite las palabras de la promesa del título.
- [ ] Respeta las correcciones de `planificacion/ejemplos.md`.

### Paso 6. Escribir el plan
Usa `templates/plan.md` y guárdalo en `proyectos/<nombre>/PLAN.md` (o junto al vídeo si no hay estructura de proyecto).

**Ancla todo a frases, no solo a segundos.** Cada decisión lleva el texto literal de la frase y su marca de tiempo. Los cortes mueven todos los tiempos; con el texto se vuelven a calcular sin perder nada.

## Punto de control
El plan se enseña al creador antes de ejecutar nada. Preséntalo así: un resumen de cinco líneas, el mapa de valor, las cifras (cuántos cortes, zooms, animaciones y efectos) y las dos o tres decisiones de las que menos seguro estás. Cada corrección del creador se guarda como ejemplo de calibración (`references/calibracion.md`): así el siguiente plan se parece más a lo que él habría hecho.

## Ejecución por fases
Si trabajas junto a `editor-video`, la ejecución la lleva esa skill. Si no, este es el orden, y el motivo de cada posición:

1. **Cortes.** Primero, porque mueven todos los tiempos.
2. **Voz.** Limpieza y normalización sobre el audio ya cortado.
3. **Zooms y movimiento.** Sobre el plano ya definitivo.
4. **Motion graphics.** Encima de los planos y zooms, ya en su sitio.
5. **Subtítulos de énfasis.** Sin tapar los gráficos.
6. **Efectos de sonido.** Al final, porque suenan sobre lo que ya existe.
7. **Notas de música.** Por bloques del mapa de valor.
8. **Revisión.**

En cada fase: recalcula los tiempos a partir del texto de las frases, ejecuta solo lo que dice el plan, apunta en `ESTADO.md` una línea con lo hecho y pasa a la siguiente sin esperar. Para solo si algo no se puede hacer como dice el plan, o en el primer elemento de cada serie de gráficos para que el creador lo apruebe antes de hacer el resto.

## Qué leer y cuándo

| Archivo | Cuándo |
|---|---|
| `references/puntuacion.md` | Paso 1 |
| `references/tipos-visuales.md` | Paso 2 |
| `references/presupuesto.md` | Paso 3 |
| `references/fases.md` | Paso 4 |
| `references/calibracion.md` | Antes del paso 1 y cuando el creador corrija un plan |
| `templates/plan.md` | Paso 6 |
