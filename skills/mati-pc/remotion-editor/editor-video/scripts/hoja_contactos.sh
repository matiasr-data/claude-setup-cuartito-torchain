#!/usr/bin/env bash
# Hoja de contactos: junta en una imagen un fotograma de cada vídeo o imagen de una carpeta.
# Sirve para revisar TODOS los gráficos de un vistazo (y también fotogramas de referencias).
# Uso: hoja_contactos.sh <carpeta> <salida.png> [segundo=0.6] [columnas=4]
# Las viñetas son pequeñas: revisa además a tamaño real lo que tenga texto pequeño.
set -euo pipefail
DIR="${1:?Falta la carpeta}"; SALIDA="${2:?Falta la salida}"
SEG="${3:-0.6}"; COLS="${4:-4}"
TMP=$(mktemp -d); i=0
shopt -s nullglob
for f in "$DIR"/*.{mov,mp4,webm,png,jpg,jpeg}; do
  i=$((i+1)); n=$(printf "%04d" "$i")
  nombre=$(basename "$f" | cut -c1-40 | sed "s/[':]/ /g")
  case "$f" in
    *.mov|*.mp4|*.webm) EXTRA=(-ss "$SEG") ;;
    *) EXTRA=() ;;
  esac
  # fondo gris: si un gráfico con alfa sale negro aquí, su transparencia no es real
  ffmpeg -hide_banner -loglevel error -y "${EXTRA[@]}" -i "$f" -frames:v 1 \
    -filter_complex "color=c=gray:s=480x270[bg];[0:v]scale=480:270:force_original_aspect_ratio=decrease,format=rgba[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,drawtext=text='${nombre}':x=6:y=6:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.6" \
    "$TMP/$n.png" || echo "No se pudo leer: $f"
done
[ "$i" -eq 0 ] && { echo "No hay archivos en $DIR"; exit 1; }
FILAS=$(( (i + COLS - 1) / COLS ))
ffmpeg -hide_banner -loglevel error -y -framerate 1 -i "$TMP/%04d.png" \
  -vf "tile=${COLS}x${FILAS}:padding=6:color=black" -frames:v 1 "$SALIDA"
rm -rf "$TMP"
echo "Hoja de contactos con $i elementos: $SALIDA"
