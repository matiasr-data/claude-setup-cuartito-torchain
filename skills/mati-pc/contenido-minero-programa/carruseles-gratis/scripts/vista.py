"""vista.py · Carrusel Animado · Viegas Academy
Genera vista.html en la carpeta del proyecto: los slides en orden, estáticos y animados, con un botón para oírlos con sonido.
Ábrelo con un servidor local (python -m http.server) para que los MP4 se reproduzcan."""
import glob, html, os
import sys
try: sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8')
except Exception: pass
pngs = sorted(glob.glob('resultados/estatico/slide-*.png')); mp4s = sorted(glob.glob('resultados/slide-*.mp4'))
leyenda = open('leyenda.txt', encoding='utf-8').read().strip() if os.path.exists('leyenda.txt') else ''
fila = lambda xs, tag: ''.join(f'<figure>{tag(p)}<figcaption>{i + 1:02d}</figcaption></figure>' for i, p in enumerate(xs))
pagina = f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>{html.escape(os.path.basename(os.getcwd()))} · vista</title>
<style>body{{margin:0;padding:28px;background:#0B0614;color:#F1EEFB;font:16px/1.5 system-ui,sans-serif}}
h2{{font:600 13px/1 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#B8A8D0;margin:26px 0 12px}}
.fila{{display:flex;gap:12px;overflow-x:auto;padding-bottom:10px}}figure{{margin:0;flex:none}}
img,video{{width:360px;aspect-ratio:4/5;display:block;border-radius:12px;background:#1A1328}}figcaption{{color:#8676A6;font:12px ui-monospace,monospace;margin-top:6px}}
button{{background:#F2C84B;color:#150A24;border:0;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer}}pre{{white-space:pre-wrap;max-width:760px;color:#D8D0EC}}</style></head>
<body><h1 style="font-size:20px;margin:0">{html.escape(os.path.basename(os.getcwd()))}</h1>
<h2>Estático</h2><div class="fila">{fila(pngs, lambda p: f'<img src="{p}">')}</div>
<h2>Animado</h2><div class="fila">{fila(mp4s, lambda p: f'<video src="{p}" muted loop playsinline controls preload="metadata"></video>')}</div>
<p><button onclick="document.querySelectorAll('video').forEach(v=>{{v.muted=false;v.currentTime=0;v.play()}})">Reproducir todos con sonido</button></p>
{'<h2>Leyenda</h2><pre>' + html.escape(leyenda) + '</pre>' if leyenda else ''}</body></html>"""
open('vista.html', 'w', encoding='utf-8').write(pagina)
print(f'✓ vista.html · {len(pngs)} estáticos · {len(mp4s)} animados')
