"""videos_muestra.py · motion-graphics-claude
Genera los vídeos de muestra de los ejemplos (ejemplos/escenas/vid/): degradados animados con un número, hechos con
ffmpeg (sin derechos de nadie). Sustitúyelos por tus clips: mismo nombre o cambia la ruta en la escena.

  python videos_muestra.py [carpeta_destino]
"""
import os, subprocess, sys
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(SKILL, 'ejemplos', 'escenas', 'vid')
PALETAS = [('0x D97757', '0x2A1A3A'), ('0x3B6FE0', '0x0D1630'), ('0x1FA37A', '0x0B241D'), ('0xE0B23B', '0x2B1E08'),
           ('0xB04FD9', '0x1A0D26'), ('0x29B6D9', '0x07202A'), ('0xE04F6A', '0x2A0A12'), ('0x7AD94F', '0x132508'),
           ('0xF08A3C', '0x2A1405'), ('0x8C9BFF', '0x10142E')]


def clip(nombre, i, ancho=320, alto=400, dur=4, texto=None):
    out = os.path.join(DST, nombre + '.mp4')
    if os.path.exists(out):
        return
    c0, c1 = (c.replace(' ', '') for c in PALETAS[i % len(PALETAS)])
    texto = texto or nombre.split('-')[0]
    tam = int(min(ancho, alto) * .32)
    vf = (f"drawbox=x=iw*0.1:y=ih*0.72:w=iw*0.8:h=ih*0.035:color=white@0.35:t=fill,"
          f"drawbox=x=iw*0.1:y=ih*0.79:w=iw*0.55:h=ih*0.035:color=white@0.22:t=fill,"
          f"drawtext=fontfile=InterTight-700.ttf:text='{texto}':fontcolor=white:fontsize={tam}:x=(w-text_w)/2:y=h*0.3")
    cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i',
           f'gradients=s={ancho}x{alto}:c0={c0}:c1={c1}:x0=0:y0=0:x1={ancho}:y1={alto}:speed=0.04:d={dur}:r=30,format=yuv420p',
           '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out]
    subprocess.run(cmd, check=True, cwd=os.path.join(SKILL, 'motor', 'fuentes'))


def main():
    os.makedirs(DST, exist_ok=True)
    for e in range(1, 11):
        for n in range(1, 6):
            clip(f'{e:02d}-{n}', e - 1 + n)
    for n in range(1, 11):
        clip(f'mc-{n}', n + 3, texto=str(n))
    clip('reel-muestra', 0, 540, 960, 6, 'REEL')
    print('✓ vídeos de muestra en', DST)


if __name__ == '__main__':
    main()
