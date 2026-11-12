"""Pasada 4 · Etapa 1b: base = toma + capa «detrás» (texto/logos detrás de la cabeza) + sujeto recortado encima.

  python make_base.py --plate trabajo/cut.mp4 --matte trabajo/matte.mp4 --behind trabajo/behind.mov --out reel/assets/base.mp4 [--enc auto]

behind.mov es la capa transparente que renderiza HyperFrames (--format mov = ProRes 4444 con alfa).
"""
import argparse, subprocess
from comun import add_enc_args, enc_mode, probe, venc

ap = argparse.ArgumentParser()
ap.add_argument("--plate", required=True)
ap.add_argument("--matte", required=True)
ap.add_argument("--behind", required=True)
ap.add_argument("--out", required=True)
add_enc_args(ap)
a = ap.parse_args()

fc = ("[0:v]format=rgba,split[pl][pl2];[2:v]format=rgba[bh];[pl][bh]overlay=format=auto:shortest=1[pb];"
      "[1:v]format=gray[m];[pl2][m]alphamerge[fg];[pb][fg]overlay=format=auto:shortest=1,format=yuv420p[out]")
W, H, FPS = probe(a.plate)
venc = venc("hq", enc_mode(a), W, H, FPS)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.plate, "-i", a.matte, "-i", a.behind, "-filter_complex", fc,
                "-map", "[out]", "-map", "0:a?", *venc, "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", a.out], check=True)
print("ok →", a.out)
