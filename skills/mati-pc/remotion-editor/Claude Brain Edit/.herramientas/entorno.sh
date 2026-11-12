# Herramientas locales de la skill editor-video (no hay FFmpeg en el sistema).
# Uso: source .herramientas/entorno.sh   (desde la raíz del proyecto)
_R="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
export PATH="$_R/bin:$PATH"
export FONTCONFIG_FILE="$_R/fonts.conf"
export WHISPER_BIN="$_R/whisper/whisper-main"
export WHISPER_MODEL="$_R/whisper/ggml-large-v3-turbo.bin"
