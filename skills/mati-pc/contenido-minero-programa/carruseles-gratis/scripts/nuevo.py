"""nuevo.py · Carrusel Animado · Viegas Academy
Crea la carpeta de un carrusel nuevo con el motor, las fuentes, los scripts, la marca y las plantillas.

  python <skill>/scripts/nuevo.py <carpeta> --slides 8 [--marca otra/MARCA.md]

Quedan: MARCA.md · CLAUDE.md · BRIEF.md · STORYBOARD.md · leyenda.txt · motor/ · fuentes/ · recursos/ · scripts/
        slides/slide-01.html … slide-NN.html + slides/carrusel.js · audio/ · resultados/ · package.json
Después: escribir slides/carrusel.js → python scripts/animar.py
"""
import argparse, json, os, shutil, sys
try: sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8')
except Exception: pass
SK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument('carpeta'); ap.add_argument('--slides', type=int, default=8); ap.add_argument('--marca')
a = ap.parse_args()
dst = os.path.abspath(a.carpeta)
if os.path.exists(dst) and os.listdir(dst): sys.exit(f'{dst} ya existe y no está vacía: elige otra carpeta')
for d in ['motor', 'fuentes', 'recursos', 'scripts', 'slides', 'audio', 'resultados/estatico', 'resultados/frames', 'resultados/hojas']:
    os.makedirs(os.path.join(dst, d), exist_ok=True)
copia = lambda de, a_: shutil.copy(os.path.join(SK, de), os.path.join(dst, a_))
for f in os.listdir(os.path.join(SK, 'motor')): copia(f'motor/{f}', f'motor/{f}')
for f in os.listdir(os.path.join(SK, 'fuentes')): copia(f'fuentes/{f}', f'fuentes/{f}')
for f in os.listdir(os.path.join(SK, 'marca')):
    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')): copia(f'marca/{f}', f'recursos/{f}')
for f in ['render.mjs', 'musica.py', 'revisar.py', 'vista.py', 'animar.py', 'entregar.py']: copia(f'scripts/{f}', f'scripts/{f}')
for f in ['CLAUDE.md', 'BRIEF.md', 'STORYBOARD.md']: copia(f'plantillas/{f}', f)
shutil.copy(a.marca if a.marca else os.path.join(SK, 'marca', 'MARCA.md'), os.path.join(dst, 'MARCA.md'))
copia('plantillas/carrusel.js', 'slides/carrusel.js')
html = open(os.path.join(SK, 'plantillas', 'slide.html'), encoding='utf-8').read()
for n in range(1, a.slides + 1):
    open(os.path.join(dst, 'slides', f'slide-{n:02d}.html'), 'w', encoding='utf-8').write(html.replace('{{N}}', str(n)).replace('{{NN}}', f'{n:02d}'))
open(os.path.join(dst, 'leyenda.txt'), 'w', encoding='utf-8').write('')
json.dump({'name': os.path.basename(dst), 'private': True, 'type': 'module'}, open(os.path.join(dst, 'package.json'), 'w'), indent=2)
print(f'✓ carrusel nuevo en {dst} · {a.slides} slides')
print('  siguiente: BRIEF.md → STORYBOARD.md → slides/carrusel.js → python scripts/animar.py')
print('  Playwright: npm i playwright (en esta carpeta o en una superior)')
