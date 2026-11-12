#!/usr/bin/env bash
# Superpone una rejilla de décimas numerada sobre una captura para leer coordenadas
# (dónde poner un recuadro, una flecha o una parada del cursor). Hazlo en CADA captura.
# Uso: rejilla.sh <captura.png> <salida.png>
set -euo pipefail
IN="${1:?Falta la captura}"; OUT="${2:?Falta la salida}"
FILTRO="drawgrid=w=iw/10:h=ih/10:t=2:c=red@0.7"
for k in 1 2 3 4 5 6 7 8 9; do
  FILTRO="$FILTRO,drawtext=text='0.$k':x=w*0.$k+4:y=4:fontsize=h/28:fontcolor=red:box=1:boxcolor=white@0.7"
  FILTRO="$FILTRO,drawtext=text='0.$k':x=4:y=h*0.$k+4:fontsize=h/28:fontcolor=red:box=1:boxcolor=white@0.7"
done
ffmpeg -hide_banner -loglevel error -y -i "$IN" -vf "$FILTRO" "$OUT"
echo "Rejilla: $OUT (coordenadas en fracciones del ancho y alto)"
