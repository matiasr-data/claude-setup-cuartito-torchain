"""Pasada 5 · Sonido: voz limpia + efectos en sus eventos + música con ducking + máster a −14 LUFS.

  python mix.py --work trabajo --sfx trabajo/sfx.json --music trabajo/musica.wav --video trabajo/reel-video.mp4 --out trabajo/reel-final.mp4

sfx.json (lo escribe Claude a partir del plan de gráficos; dB respecto al pico del archivo):
[
  {"file": "sfx/impact.wav",  "t": 0.00, "db": -16},     ← golpe del gancho
  {"file": "sfx/whoosh.wav",  "t": 2.26, "db": -21},     ← entra una tarjeta (20-40 ms antes del visual)
  {"file": "sfx/uiclick.wav", "t": 3.20, "db": -22, "max": 0.3}
]
Regla: los efectos van 20-25 dB por debajo de la voz. Que acompañen, que no tapen.
Música: 12 dB bajo la voz y 7 dB más abajo mientras se habla (ataque 40 ms, relajación 450 ms).
"""
import argparse, json, os, re, subprocess
import comun  # consola UTF-8 en Windows
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("--work", default="trabajo")
ap.add_argument("--sfx", default="")
ap.add_argument("--music", default="")
ap.add_argument("--music-under", type=float, default=12)
ap.add_argument("--duck", type=float, default=7)
ap.add_argument("--video", default="", help="vídeo final sin audio masterizado: si se indica, se crea --out con el máster")
ap.add_argument("--out", default="")
ap.add_argument("--lufs", type=float, default=-14)
ap.add_argument("--tp", type=float, default=-1.5)
a = ap.parse_args()
P = lambda f: os.path.join(a.work, f)
SR = 48000
words = json.load(open(P("words.json"), encoding="utf-8"))
KEEP, DUR = words["segments"], words["duration"]


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=True)


def load(path, maxdur=None):
    cmd = ["ffmpeg", "-v", "error", "-i", path] + (["-t", str(maxdur)] if maxdur else []) + ["-f", "f32le", "-ac", "2", "-ar", str(SR), "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()


def lufs(x):
    x.astype(np.float32).tofile(P("_tmp.f32"))
    r = run(["ffmpeg", "-hide_banner", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", P("_tmp.f32"), "-af", "ebur128", "-f", "null", "-"]).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1])


# 1 · Voz: desde el WAV original con los mismos tramos, limpia
parts, labels = [], ""
for i, (s, e) in enumerate(KEEP):
    parts.append(f"[0:a]atrim={s}:{e},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={e - s - 0.012:.3f}:d=0.012[a{i}]")
    labels += f"[a{i}]"
parts.append(f"{labels}concat=n={len(KEEP)}:v=0:a=1,highpass=f=80,afftdn=nf=-30:nr=8,"
             "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=140:makeup=2,aformat=channel_layouts=stereo[v]")
run(["ffmpeg", "-v", "error", "-y", "-i", P("audio48k.wav"), "-filter_complex", ";".join(parts), "-map", "[v]", "-ar", str(SR), "-c:a", "pcm_f32le", P("voz.wav")])
voz = load(P("voz.wav"))
n = int(DUR * SR) + SR
mix = np.zeros((n, 2), np.float32); mix[:min(n, len(voz))] = voz[:n]

# 2 · Efectos
if a.sfx:
    for ev in json.load(open(a.sfx, encoding="utf-8")):
        s = load(ev["file"] if os.path.isabs(ev["file"]) else os.path.join(os.path.dirname(a.sfx), ev["file"]), ev.get("max"))
        if ev.get("max"):
            f = int(0.04 * SR); s[-f:] *= np.linspace(1, 0, f)[:, None]
        i = int(round(ev["t"] * SR)); j = min(n, i + len(s))
        mix[i:j] += s[:j - i] * (10 ** (ev["db"] / 20))
    print(f"efectos: {len(json.load(open(a.sfx, encoding='utf-8')))}")

# 3 · Música con ducking bajo la voz
if a.music:
    mus = load(a.music)[:n]; mus = np.pad(mus, ((0, n - len(mus)), (0, 0)))
    win = int(0.02 * SR)
    env = np.sqrt(np.convolve(voz[:, 0] ** 2, np.ones(win) / win, mode="same"))
    act = np.zeros(n, np.float32); act[:len(env)] = (env > 10 ** (-38 / 20))
    at, rl = np.exp(-1 / (0.04 * SR)), np.exp(-1 / (0.45 * SR))
    duck = np.empty_like(act); g = 0.0
    for k in range(n):
        c = at if act[k] > g else rl
        g = c * g + (1 - c) * act[k]; duck[k] = g
    base = lufs(voz) - a.music_under - lufs(mus)
    t = np.arange(n) / SR
    gain = 10 ** (base / 20) * 10 ** (-a.duck * duck / 20) * np.clip(t / 0.6, 0, 1) * np.clip((DUR - t) / 1.5, 0, 1)
    mix += mus * gain[:, None]
    print(f"música: {base:+.1f} dB de base · ducking {a.duck} dB")

# 4 · Máster (loudnorm en dos pasadas)
mix[:int(DUR * SR)].astype(np.float32).tofile(P("_mezcla.f32"))
run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", P("_mezcla.f32"), "-c:a", "pcm_f32le", P("mezcla.wav")])
m = run(["ffmpeg", "-hide_banner", "-i", P("mezcla.wav"), "-af", f"loudnorm=I={a.lufs}:TP={a.tp}:LRA=11:print_format=json", "-f", "null", "-"]).stderr
j = json.loads(m[m.rindex("{"):m.rindex("}") + 1])
af = (f"loudnorm=I={a.lufs}:TP={a.tp}:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:"
      f"measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000")
run(["ffmpeg", "-v", "error", "-y", "-i", P("mezcla.wav"), "-af", af, "-c:a", "pcm_s24le", P("master.wav")])
for f in ("_tmp.f32", "_mezcla.f32"):
    if os.path.exists(P(f)): os.remove(P(f))

final = P("master.wav")
if a.video and a.out:
    run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-i", P("master.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k",
         "-shortest", "-movflags", "+faststart", a.out])
    final = a.out
r = run(["ffmpeg", "-hide_banner", "-i", final, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
lufs = re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]
peak = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1]
print(f"máster: {lufs} LUFS · pico {peak} dBTP → {final}")
