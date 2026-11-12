"""entregar.py · Carrusel Animado · Viegas Academy
Deja el carrusel listo para subir: los MP4 en orden, la portada, la leyenda y un .zip, en una carpeta que puedes
sincronizar con el móvil (Google Drive, iCloud, Dropbox) o abrir para subir desde el ordenador.

  python scripts/entregar.py                                 → entrega/<proyecto>/ y entrega/<proyecto>.zip
  python scripts/entregar.py --destino "G:\\Mi unidad\\Carruseles"  → además lo copia ahí (p. ej. tu Google Drive)
  python scripts/entregar.py --abrir                         → abre la carpeta al terminar

Dentro: 01.mp4 … NN.mp4 (el orden en que se suben), portada.png, leyenda.txt y COMO-SUBIR.txt
"""
import argparse, glob, os, shutil, subprocess, sys, json
try: sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8')
except Exception: pass
ap = argparse.ArgumentParser(); ap.add_argument('--destino'); ap.add_argument('--abrir', action='store_true'); a = ap.parse_args()
nombre = os.path.basename(os.getcwd())
mp4s = sorted(glob.glob('resultados/slide-*.mp4'))
if not mp4s: sys.exit('No hay MP4: ejecuta antes python scripts/animar.py')
pr = 'resultados/pruebas.json'
if os.path.exists(pr):
    malos = [k for k, v in json.load(open(pr, encoding='utf-8')).items() if not v.get('ok')]
    if malos: print(f'aviso: las pruebas marcan para revisar los slides {", ".join(malos)} (resultados/pruebas.json)')
out = os.path.join('entrega', nombre); shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
for i, m in enumerate(mp4s, 1): shutil.copy(m, os.path.join(out, f'{i:02d}.mp4'))
if os.path.exists('resultados/estatico/slide-01.png'): shutil.copy('resultados/estatico/slide-01.png', os.path.join(out, 'portada.png'))
if os.path.exists('leyenda.txt'): shutil.copy('leyenda.txt', os.path.join(out, 'leyenda.txt'))
open(os.path.join(out, 'COMO-SUBIR.txt'), 'w', encoding='utf-8').write(f"""CÓMO SUBIR ESTE CARRUSEL ({len(mp4s)} videos)

1. Pasa la carpeta al móvil sin comprimir: Google Drive, iCloud, Dropbox o AirDrop.
   (WhatsApp comprime los videos: si lo usas, mándalos como «Documento».)
   También puedes subirlo desde el ordenador en instagram.com o programarlo en Meta Business Suite.
2. En Instagram: Crear → Publicación → elige los videos en orden, del 01 al {len(mp4s):02d}.
3. No añadas música de Instagram: el sonido ya va dentro de cada video y suena como una sola canción.
4. Pega el texto de leyenda.txt. La portada del carrusel es el primer frame del 01.
5. Revisa en el móvil que nada importante quede bajo el contador (arriba a la derecha) ni bajo el icono de sonido (abajo a la derecha).
""")
zipf = shutil.make_archive(os.path.join('entrega', nombre), 'zip', root_dir='entrega', base_dir=nombre)
print(f'✓ {out}/ · {len(mp4s)} videos · portada · leyenda · COMO-SUBIR.txt')
print(f'✓ {zipf}')
if a.destino:
    dst = os.path.join(a.destino, nombre); shutil.rmtree(dst, ignore_errors=True); shutil.copytree(out, dst)
    print(f'✓ copiado a {dst}')
if a.abrir:
    ruta = os.path.abspath(os.path.join(a.destino, nombre) if a.destino else out)
    if sys.platform.startswith('win'): os.startfile(ruta)
    else: subprocess.run(['open' if sys.platform == 'darwin' else 'xdg-open', ruta])
