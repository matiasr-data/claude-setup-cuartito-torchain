#!/usr/bin/env bash
# Renderiza un .ass como capa transparente (ProRes 4444 con alfa) para superponer en CapCut.
# Uso: subtitulos_capa.sh <subtitulos.ass> <duracion_s> <salida.mov> [1920x1080] [30] [carpeta_fuentes]
set -euo pipefail
SUBS="${1:?Falta el .ass}"; DUR="${2:?Falta la duración}"; SALIDA="${3:?Falta la salida}"
TAM="${4:-1920x1080}"; FPS="${5:-30}"; FUENTES="${6:-}"
FILTRO="subtitles=${SUBS}:alpha=1"; [ -n "$FUENTES" ] && FILTRO="${FILTRO}:fontsdir=${FUENTES}"
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "color=c=black@0.0:s=${TAM}:r=${FPS}:d=${DUR},format=rgba" \
  -vf "$FILTRO" -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le "$SALIDA"
echo "Capa de subtítulos con alfa: $SALIDA"
