"""animar.py · Carrusel Animado · Viegas Academy
Todo el proceso, en orden, desde la carpeta del proyecto (Windows, Mac o Linux):

  python scripts/animar.py              → estático + animado completos
  python scripts/animar.py estatico     → solo los PNG, la hoja y la miniatura (para aprobar el diseño)
  python scripts/animar.py animado 02,05 → vuelve a animar solo esos slides (la música se regenera entera)
  python scripts/animar.py sonido [noche] → solo la música: la regenera y la vuelve a meter en los MP4 sin renderizar imágenes

Pasos: fotos (PNG) → hoja y miniatura → golpes → música → video (MP4) → hojas por tiempo y pruebas → vista.html
"""
import os, subprocess, sys
modo = sys.argv[1] if len(sys.argv) > 1 else 'todo'
cuales = sys.argv[2] if len(sys.argv) > 2 else 'todos'
os.environ.setdefault('PYTHONUTF8', '1')
def corre(*cmd):
    print('→', ' '.join(cmd)); r = subprocess.run(cmd)
    if r.returncode: sys.exit(f'falló: {" ".join(cmd)}')
py = sys.executable
if modo in ('todo', 'estatico'):
    corre('node', 'scripts/render.mjs', 'fotos', 'todos')
    corre(py, 'scripts/revisar.py', 'estatico')
if modo in ('todo', 'animado'):
    corre('node', 'scripts/render.mjs', 'golpes')
    corre(py, 'scripts/musica.py')
    corre('node', 'scripts/render.mjs', 'video', cuales)
    corre(py, 'scripts/revisar.py', 'animado')
if modo == 'sonido':
    import glob
    corre('node', 'scripts/render.mjs', 'golpes')
    corre(py, 'scripts/musica.py', *(sys.argv[2:3]))
    for mp4 in sorted(glob.glob('resultados/slide-*.mp4')):
        wav = 'audio/' + os.path.basename(mp4).replace('.mp4', '.wav'); tmp = mp4 + '.tmp.mp4'
        corre('ffmpeg', '-y', '-loglevel', 'error', '-i', mp4, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', tmp)
        os.replace(tmp, mp4)
    corre(py, 'scripts/revisar.py', 'animado')
corre(py, 'scripts/vista.py')
print('✓ listo: resultados/ · vista.html')
