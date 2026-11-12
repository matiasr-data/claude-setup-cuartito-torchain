# Ejemplo real · toma 9 («Este reel está siendo editado al 100 % por Claude Opus 5.5…»)

Referencia de un reel terminado con esta skill. Úsalo para ver **cómo se escriben** los archivos de cada pasada:

- `keep.json`: los tramos que se quedaron tras cortar silencios y la toma falsa (pasada 1)
- `words.json`: las 120 palabras con sus tiempos en el vídeo ya cortado (el reloj de todo)
- `frases.txt` → `captions.json`: 13 frases, 55 subtítulos y una palabra clave por frase (pasada 3)
- `plan-graficos.md`: el plan de motion graphics aprobado antes de construir (pasada 4)
- `build_reel.py` + `compositions/`: el generador de las composiciones HyperFrames (capa detrás, gráficos de cristal, escena a pantalla completa, subtítulos y zooms)
- `sfx-ejemplo.json`: formato de la lista de efectos para `scripts/mix.py` (pasada 5)

No incluye los vídeos, la foto, los logos ni la captura de la guía del proyecto original (`assets/`): el ejemplo sirve para leerlo y adaptarlo, no para renderizarlo tal cual.
