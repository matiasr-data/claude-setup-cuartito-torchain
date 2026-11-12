"""revisar.py · Carrusel Animado · Viegas Academy

Lo que hay que mirar antes de publicar. Se ejecuta desde la carpeta del proyecto.
  python scripts/revisar.py estatico   → resultados/hoja.png (todos los slides) y resultados/miniatura.png (feed a 390 px y perfil a 128 px)
  python scripts/revisar.py animado    → resultados/hojas/slide-NN.jpg (un frame por tiempo) y resultados/pruebas.json:
                                          frame 0 = PNG estático · último frame = frame 0 (loop) · costura del sonido · formato del MP4
Umbral del loop: la diferencia se acepta si no pasa de 20/255 (invisible a simple vista).
"""
import glob, json, os, subprocess, sys
try: sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8')
except Exception: pass
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.io import wavfile

R = os.path.join(os.getcwd(), 'resultados')
def fuente(px):
    for p in ['C:/Windows/Fonts/segoeui.ttf', '/System/Library/Fonts/Supplemental/Arial.ttf', '/Library/Fonts/Arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if os.path.exists(p): return ImageFont.truetype(p, px)
    return ImageFont.load_default()
FONDO, TEXTO = (14, 9, 24), (241, 238, 251)

def hoja_estatica():
    fs = sorted(glob.glob(os.path.join(R, 'estatico', 'slide-*.png')))
    if not fs: sys.exit('No hay PNG: ejecuta node scripts/render.mjs fotos')
    ims = [Image.open(p).convert('RGB') for p in fs]
    cols, w, h, m, et = 5, 324, 405, 16, 34
    filas = (len(ims) + cols - 1) // cols
    hoja = Image.new('RGB', (cols * (w + m) + m, filas * (h + et + m) + m), FONDO); d = ImageDraw.Draw(hoja)
    for i, im in enumerate(ims):
        x, y = m + (i % cols) * (w + m), m + (i // cols) * (h + et + m)
        d.text((x, y + 4), f'{i + 1:02d}', fill=TEXTO, font=fuente(22)); hoja.paste(im.resize((w, h), Image.LANCZOS), (x, y + et))
    hoja.save(os.path.join(R, 'hoja.png'))
    # miniatura: así se ve en el feed (390 px) y en la grilla del perfil (recorte 1:1 a 128 px)
    fw, fh = 390, int(390 * 1350 / 1080)
    mini = Image.new('RGB', (3 * fw + 80, fh + 260), FONDO); d = ImageDraw.Draw(mini)
    d.text((20, 14), 'FEED · 390 px: portada, slide 2 y giro', fill=TEXTO, font=fuente(22))
    for k, idx in enumerate([0, 1, max(0, len(ims) - 2)]): mini.paste(ims[idx].resize((fw, fh), Image.LANCZOS), (20 + k * (fw + 20), 50))
    d.text((20, fh + 70), 'PERFIL · 128 px: ¿el ojo se detiene en la portada?', fill=TEXTO, font=fuente(22))
    cuad = ims[0].crop((0, 135, 1080, 1215)).resize((128, 128), Image.LANCZOS)
    for k in range(6): mini.paste(cuad if k == 0 else Image.new('RGB', (128, 128), (40, 34, 56)), (20 + k * 132, fh + 106))
    mini.save(os.path.join(R, 'miniatura.png'))
    print(f'✓ resultados/hoja.png · resultados/miniatura.png · {len(ims)} slides')

def lee(p): return np.asarray(Image.open(p).convert('RGB')).astype(int)
def frame_mp4(mp4, n):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'select=eq(n\\,{n}),scale=in_color_matrix=bt709:in_range=tv,format=rgb24', '-vframes', '1', '-f', 'rawvideo', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(1350, 1080, 3).astype(int)

def animado():
    os.makedirs(os.path.join(R, 'hojas'), exist_ok=True)
    golpes = json.load(open(os.path.join(os.getcwd(), 'audio', 'golpes.json'), encoding='utf-8'))
    res, bien = {}, True
    for sl in golpes['slides']:
        n = f"{sl['slide']:02d}"; total = int(round(sl['duracion_s'] * 30))
        carpeta = os.path.join(R, 'frames', f'slide-{n}')
        fs = sorted(glob.glob(os.path.join(carpeta, '*.png')))
        faltan = [p for p in [os.path.join(carpeta, '0000.png'), os.path.join(R, 'estatico', f'slide-{n}.png'), os.path.join(R, f'slide-{n}.mp4')] if not os.path.exists(p)]
        if not fs or faltan:
            print(f'{n} · aún sin renderizar (falta {os.path.basename(faltan[0]) if faltan else "frames"}): se salta'); continue
        # hoja por tiempo
        w, h = 216, 270; cols = 8; ims = [Image.open(p).convert('RGB').resize((w, h), Image.LANCZOS) for p in fs]
        hoja = Image.new('RGB', (cols * w, ((len(ims) + cols - 1) // cols) * (h + 26)), FONDO); d = ImageDraw.Draw(hoja)
        for i, (p, im) in enumerate(zip(fs, ims)):
            x, y = (i % cols) * w, (i // cols) * (h + 26); hoja.paste(im, (x, y + 26))
            d.text((x + 6, y + 4), f'{int(os.path.basename(p)[:4]) / 30:.1f} s', fill=TEXTO, font=fuente(16))
        hoja.save(os.path.join(R, 'hojas', f'slide-{n}.jpg'), quality=85)
        # pruebas
        f0, ult, png = lee(os.path.join(carpeta, '0000.png')), lee(os.path.join(carpeta, f'{total - 1:04d}.png')), lee(os.path.join(R, 'estatico', f'slide-{n}.png'))
        d0, dl = np.abs(f0 - png).max(2), np.abs(ult - f0).max(2)
        mp4 = os.path.join(R, f'slide-{n}.mp4')
        mse = ((frame_mp4(mp4, 0) - png) ** 2).mean(); psnr = 99.0 if mse == 0 else 10 * np.log10(255 ** 2 / mse)
        sr, wv = wavfile.read(os.path.join(os.getcwd(), 'audio', f'slide-{n}.wav')); wv = (wv[:, 0] if wv.ndim > 1 else wv).astype(float) / 32768
        doble = np.concatenate([wv, wv]); L = len(wv); mitad = int(2.0 * sr)
        r = {'frame0_igual_png': int((d0 > 0).sum()) == 0, 'loop_pixeles': int((dl > 0).sum()), 'loop_dif_max': int(dl.max()),
             'mp4_frame0_psnr_db': round(float(psnr), 1), 'sonido_salto_costura': round(float(abs(doble[L] - doble[L - 1])), 4), 'sonido_salto_interno': round(float(abs(doble[mitad] - doble[mitad - 1])), 4)}
        r['ok'] = r['frame0_igual_png'] and r['loop_dif_max'] <= 20
        bien &= r['ok']; res[n] = r
        print(f"{n} · frame 0 = PNG: {'sí' if r['frame0_igual_png'] else 'NO'} · loop: {r['loop_pixeles']} px (máx {r['loop_dif_max']}/255) · PSNR {r['mp4_frame0_psnr_db']} dB · {'✓' if r['ok'] else 'REVISAR'}")
    json.dump(res, open(os.path.join(R, 'pruebas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('✓ todo cierra' if bien else '× hay slides para revisar')

if __name__ == '__main__':
    modo = sys.argv[1] if len(sys.argv) > 1 else 'estatico'
    hoja_estatica() if modo == 'estatico' else animado()
