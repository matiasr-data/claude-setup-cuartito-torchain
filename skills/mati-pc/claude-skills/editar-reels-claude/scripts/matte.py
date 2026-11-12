"""Pasada 2 · Recorte del sujeto fotograma a fotograma con RobustVideoMatting (NVIDIA → Mac MPS → CPU).

  python matte.py --src trabajo/cut.mp4 --out trabajo/matte.mp4 --model models/rvm_resnet50_fp32.torchscript

El modelo (licencia GPL-3.0) NO va dentro de la skill. Descárgalo una vez de su página oficial:
  https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_resnet50_fp32.torchscript
Salida: vídeo en escala de grises (blanco = sujeto). Se reutiliza en las pasadas 3-5.
Sin tarjeta gráfica es lento: el script mide la velocidad tras 30 fotogramas y avisa del tiempo que queda.
"""
import argparse, json, subprocess, time
import torch
from comun import torch_device

ap = argparse.ArgumentParser()
ap.add_argument("--src", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--model", required=True)
ap.add_argument("--down", type=float, default=0, help="downsample_ratio (0 = automático: 0,25 en 4K, 0,4 en 1080p)")
ap.add_argument("--fps", default="30")
ap.add_argument("--device", default="auto", choices=["auto", "cuda", "mps", "cpu"])
a = ap.parse_args()

st = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", a.src],
                               capture_output=True, text=True, check=True).stdout)["streams"][0]
W, H = st["width"], st["height"]
DOWN = a.down or (0.25 if max(W, H) >= 3000 else 0.4)
FRAME = W * H * 3
FPS = float(a.fps)
TOTAL = int(float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.src],
                                 capture_output=True, text=True, check=True).stdout) * FPS)


def load(dev):
    m = torch.jit.freeze(torch.jit.load(a.model, map_location="cpu").to(dev).eval())
    with torch.no_grad():   # prueba con un fotograma: si MPS falla con este modelo, se pasa a la CPU
        m(torch.zeros(1, 3, H, W, device=dev), *([None] * 4), DOWN)
    return m


dev = torch_device() if a.device == "auto" else a.device
try:
    model = load(dev)
except Exception as e:
    if dev == "cpu":
        raise
    print(f"{dev} no funciona con este modelo ({type(e).__name__}); uso la CPU.")
    dev = "cpu"
    model = load(dev)

rd = subprocess.Popen(["ffmpeg", "-v", "error", "-i", a.src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE, bufsize=FRAME * 2)
wr = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", a.fps, "-i", "-",
                       "-c:v", "libx264", "-preset", "fast", "-crf", "10", "-pix_fmt", "yuv420p", a.out], stdin=subprocess.PIPE)
rec, n, t0 = [None] * 4, 0, time.time()
with torch.no_grad():
    while True:
        buf = rd.stdout.read(FRAME)
        if len(buf) < FRAME:
            break
        src = torch.frombuffer(bytearray(buf), dtype=torch.uint8).to(dev).view(H, W, 3).permute(2, 0, 1)[None].float().div_(255)
        fgr, pha, *rec = model(src, *rec, DOWN)   # los estados recurrentes dan estabilidad entre fotogramas
        wr.stdin.write(pha[0, 0].mul(255).round().clamp(0, 255).to(torch.uint8).cpu().numpy().tobytes())
        n += 1
        if n == 30 or n % 150 == 0:
            v = n / (time.time() - t0)
            print(f"{n}/{TOTAL} fotogramas · {v:.1f} fps · quedan ~{(TOTAL - n) / v / 60:.1f} min", flush=True)
wr.stdin.close(); wr.wait(); rd.wait()
print(f"listo: {n} fotogramas en {time.time() - t0:.0f} s ({dev}, downsample {DOWN}) → {a.out}")
