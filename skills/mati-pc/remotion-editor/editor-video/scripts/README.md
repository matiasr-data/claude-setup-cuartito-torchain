# Scripts

Partes mecánicas del flujo. Requieren FFmpeg; los `.py` requieren Python 3 (y `medir_sonido.py`, numpy). Ninguno modifica los archivos originales.

| Script | Para qué | Uso |
|---|---|---|
| `extraer_frames.sh` | Analizador: cortes, primer/último fotograma de cada plano, fotogramas por intervalo | `extraer_frames.sh video.mp4 referencias/<n>/datos [umbral] [intervalo]` |
| `medir_ritmo.py` | Analizador: media, mediana, cortes por minuto (gancho y cuerpo) | `medir_ritmo.py referencias/<n>/datos [--gancho 30] [--excluir "245-269"]` |
| `medir_sonido.py` | Analizador: golpes de sonido, nivel respecto a la voz, color, % de cortes con golpe | `medir_sonido.py video.mp4 referencias/<n>/datos [--excluir …]` |
| `hoja_contactos.sh` | Revisión: un fotograma de TODOS los gráficos en una imagen | `hoja_contactos.sh proyectos/<n>/entrega/2_GRAFICOS hoja.png [segundo] [columnas]` |
| `rejilla.sh` | Gráficos: rejilla de décimas sobre una captura para leer coordenadas | `rejilla.sh captura.png captura_rejilla.png` |
| `subtitulos_capa.sh` | Entrega kit: subtítulos `.ass` como capa ProRes 4444 con alfa | `subtitulos_capa.sh subs.ass <duración> subs.mov [1920x1080] [30] [fuentes]` |
| `quemar_subtitulos.sh` | Entrega vídeo único: quemar el `.ass` | `quemar_subtitulos.sh in.mp4 subs.ass out.mp4 [fuentes]` |

Notas:
- La detección de cortes es aproximada: con movimiento fuerte o zooms puede marcar de más. Ajusta el umbral (0,2 más sensible, 0,4 menos) y revisa `cortes/` si una cifra parece rara.
- `medir_sonido.py` puede confundir el arranque de una frase con un golpe (los marca como `dudoso_voz`). Verifica escuchando los golpes que importen.
- En las rutas que se pasan a filtros de FFmpeg (subtítulos), evita espacios, comas y dos puntos.
- El resto del flujo (transcripción, corte, limpieza de voz, render de gráficos, vista previa, exportación del kit) lo construye Claude con FFmpeg, el transcriptor y el motor de gráficos siguiendo las referencias.
