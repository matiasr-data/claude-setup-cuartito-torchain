#!/usr/bin/env bash
# Extrae datos objetivos de un vídeo para el analizador:
#   duracion.txt  duración en segundos
#   cortes.txt    marca de tiempo (s) de cada cambio de plano detectado
#   cortes/       un fotograma en cada cambio de plano
#   planos/       primer (_a) y último (_b) fotograma de cada plano, para medir el zoom
#   frames/       un fotograma cada N segundos
# Uso: extraer_frames.sh <video> <carpeta_salida> [umbral_escena=0.3] [intervalo_s=1]
set -euo pipefail

VIDEO="${1:?Falta el vídeo}"
OUT="${2:?Falta la carpeta de salida}"
UMBRAL="${3:-0.3}"     # 0.2 = más sensible, 0.4 = solo cambios claros
INTERVALO="${4:-1}"

mkdir -p "$OUT/cortes" "$OUT/frames" "$OUT/planos"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")
echo "$DUR" > "$OUT/duracion.txt"

# Cambios de plano
ffmpeg -hide_banner -loglevel info -i "$VIDEO" \
  -vf "select='gt(scene,${UMBRAL})',showinfo,scale=640:-2" -vsync vfr \
  "$OUT/cortes/%04d.jpg" 2> "$OUT/.escenas.log"
grep -o 'pts_time:[0-9.]*' "$OUT/.escenas.log" | cut -d: -f2 > "$OUT/cortes.txt" || true
rm -f "$OUT/.escenas.log"

# Primer y último fotograma de cada plano
{ echo 0; cat "$OUT/cortes.txt"; echo "$DUR"; } > "$OUT/.limites"
i=0; prev=""
while read -r t; do
  if [ -n "$prev" ]; then
    i=$((i+1)); n=$(printf "%03d" "$i")
    a=$(awk -v p="$prev" 'BEGIN{print p+0.05}')
    b=$(awk -v t="$t" -v p="$prev" 'BEGIN{x=t-0.1; if(x<p) x=p; print x}')
    ffmpeg -hide_banner -loglevel error -y -ss "$a" -i "$VIDEO" -frames:v 1 -vf scale=640:-2 "$OUT/planos/${n}_a.jpg" || true
    ffmpeg -hide_banner -loglevel error -y -ss "$b" -i "$VIDEO" -frames:v 1 -vf scale=640:-2 "$OUT/planos/${n}_b.jpg" || true
  fi
  prev="$t"
done < "$OUT/.limites"
rm -f "$OUT/.limites"

# Fotogramas a intervalos regulares
ffmpeg -hide_banner -loglevel error -i "$VIDEO" \
  -vf "fps=1/${INTERVALO},scale=640:-2" "$OUT/frames/%05d.jpg"

echo "Duración: $DUR s"
echo "Cortes detectados: $(wc -l < "$OUT/cortes.txt")"
echo "Planos: $i (primer y último fotograma en planos/)"
echo "Fotogramas de intervalo: $(ls "$OUT/frames" | wc -l)"
