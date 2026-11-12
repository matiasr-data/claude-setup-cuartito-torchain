"""Mide un video terminado antes de publicarlo.

Uso:
  python verificar_video.py video.mp4 [--duracion 30-40] [--formato 1080x1920]
         [--lufs -14] [--silencio-db -45] [--silencio-min 0.6] [--negro-min 0.3]

Informa duración, resolución, fps, volumen integrado (LUFS), pico verdadero,
tramos en silencio y tramos en negro. Sale con código 1 si algo no cumple.
Requiere ffmpeg y ffprobe en el PATH.
"""
import argparse
import json
import re
import subprocess
import sys


def correr(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return r.stdout, r.stderr


def info(path):
    out, _ = correr(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", path])
    d = json.loads(out or "{}")
    v = next((s for s in d.get("streams", []) if s.get("codec_type") == "video"), None)
    a = next((s for s in d.get("streams", []) if s.get("codec_type") == "audio"), None)
    dur = float(d.get("format", {}).get("duration", 0) or 0)
    fps = None
    if v and v.get("avg_frame_rate", "0/0") != "0/0":
        n, m = v["avg_frame_rate"].split("/")
        fps = round(float(n) / float(m), 2) if float(m) else None
    return dur, v, a, fps


def loudness(path, objetivo):
    _, err = correr(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af",
                     f"loudnorm=I={objetivo}:TP=-1:LRA=11:print_format=json", "-f", "null", "-"])
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", err, re.S)
    if not m:
        return None, None
    j = json.loads(m.group(0))
    return float(j["input_i"]), float(j["input_tp"])


def silencios(path, db, minimo):
    _, err = correr(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af",
                     f"silencedetect=noise={db}dB:d={minimo}", "-f", "null", "-"])
    inicios = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    fines = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    return list(zip(inicios, fines + [None] * (len(inicios) - len(fines))))


def negros(path, minimo):
    _, err = correr(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-vf",
                     f"blackdetect=d={minimo}:pix_th=0.10", "-an", "-f", "null", "-"])
    return [(float(a), float(b)) for a, b in re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", err)]


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    p = argparse.ArgumentParser()
    p.add_argument("video")
    p.add_argument("--duracion", help="rango en segundos, ej. 30-40")
    p.add_argument("--formato", help="ancho x alto, ej. 1080x1920")
    p.add_argument("--lufs", type=float, default=-14.0)
    p.add_argument("--silencio-db", type=float, default=-45.0)
    p.add_argument("--silencio-min", type=float, default=0.6)
    p.add_argument("--negro-min", type=float, default=0.3)
    a = p.parse_args()

    fallas = []
    dur, v, au, fps = info(a.video)
    print(f"Archivo: {a.video}")
    print(f"Duración: {dur:.2f} s")
    if a.duracion:
        lo, hi = (float(x) for x in a.duracion.split("-"))
        if not lo <= dur <= hi:
            fallas.append(f"duración {dur:.1f} s fuera de {a.duracion} s")

    if v:
        res = f"{v['width']}x{v['height']}"
        print(f"Video: {res}, {fps} fps, {v.get('codec_name')}")
        if a.formato and res != a.formato:
            fallas.append(f"resolución {res}, se esperaba {a.formato}")
    else:
        fallas.append("no tiene pista de video")

    if au:
        print(f"Audio: {au.get('codec_name')}, {au.get('sample_rate')} Hz, {au.get('channels')} canales")
        i, tp = loudness(a.video, a.lufs)
        if i is not None:
            print(f"Volumen integrado: {i:.1f} LUFS (objetivo {a.lufs:.0f} ±1)  |  pico verdadero: {tp:.1f} dBTP")
            if abs(i - a.lufs) > 1:
                fallas.append(f"volumen {i:.1f} LUFS, objetivo {a.lufs:.0f}")
            if tp > -1.0:
                fallas.append(f"pico verdadero {tp:.1f} dBTP (> -1)")
        sil = silencios(a.video, a.silencio_db, a.silencio_min)
        if sil:
            txt = ", ".join(f"{s:.1f}–{(e if e is not None else dur):.1f} s" for s, e in sil)
            print(f"Silencios (≥{a.silencio_min} s bajo {a.silencio_db:.0f} dB): {txt}")
            fallas.append(f"{len(sil)} tramo(s) en silencio")
        else:
            print("Silencios: ninguno")
    else:
        fallas.append("no tiene pista de audio")

    neg = negros(a.video, a.negro_min)
    if neg:
        print("Negros: " + ", ".join(f"{s:.1f}–{e:.1f} s" for s, e in neg))
        fallas.append(f"{len(neg)} tramo(s) en negro")
    else:
        print("Negros: ninguno")

    print()
    if fallas:
        print("REVISAR:")
        for f in fallas:
            print(f"  - {f}")
        sys.exit(1)
    print("OK: todas las mediciones cumplen.")


if __name__ == "__main__":
    main()
