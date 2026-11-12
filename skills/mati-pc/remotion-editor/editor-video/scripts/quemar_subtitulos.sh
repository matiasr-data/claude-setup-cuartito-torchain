#!/usr/bin/env bash
# Quema un .ass en el vídeo (para entrega en vídeo único).
# Uso: quemar_subtitulos.sh <video> <subtitulos.ass> <salida.mp4> [carpeta_fuentes]
# Evita espacios, comas y dos puntos en las rutas: el filtro de FFmpeg es sensible a ellos.
set -euo pipefail
VIDEO="${1:?Falta el vídeo}"; SUBS="${2:?Falta el .ass}"; SALIDA="${3:?Falta la salida}"; FUENTES="${4:-}"
FILTRO="subtitles=${SUBS}"; [ -n "$FUENTES" ] && FILTRO="${FILTRO}:fontsdir=${FUENTES}"
ffmpeg -hide_banner -loglevel error -y -i "$VIDEO" -vf "$FILTRO" -c:v libx264 -crf 18 -preset medium -c:a copy "$SALIDA"
echo "Subtítulos quemados: $SALIDA"
