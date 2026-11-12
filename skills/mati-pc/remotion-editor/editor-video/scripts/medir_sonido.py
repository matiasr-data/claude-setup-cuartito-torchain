#!/usr/bin/env python3
"""Detecta golpes de sonido (SFX) y los cruza con los cortes. Aproximado: verificar escuchando.

Uso: medir_sonido.py <video> <carpeta_datos> [--excluir "245-269"] [--salto-db 9]
Necesita cortes.txt en la carpeta (de extraer_frames.sh) y numpy.
Para cada golpe da: tiempo, nivel respecto a la voz (dB), color (grave/medio/agudo) y si cae en un corte.
Escribe sonido.json.
"""
import argparse
import json
import subprocess
from pathlib import Path

import numpy as np

SR = 22050
HOP = int(SR * 0.01)  # ventanas de 10 ms


def cargar_audio(video):
    cmd = ["ffmpeg", "-v", "error", "-i", str(video), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    datos = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(datos, dtype=np.float32)


def energia_db(x):
    n = len(x) // HOP
    marcos = x[: n * HOP].reshape(n, HOP)
    rms = np.sqrt(np.mean(marcos ** 2, axis=1) + 1e-12)
    return 20 * np.log10(rms + 1e-9)


def centroide(x, t):
    i = int(t * SR)
    trozo = x[i : i + int(0.05 * SR)]
    if len(trozo) < 256:
        return 0.0
    espectro = np.abs(np.fft.rfft(trozo * np.hanning(len(trozo))))
    freqs = np.fft.rfftfreq(len(trozo), 1 / SR)
    return float(np.sum(freqs * espectro) / (np.sum(espectro) + 1e-9))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("video")
    p.add_argument("carpeta")
    p.add_argument("--excluir", default="")
    p.add_argument("--salto-db", type=float, default=9.0, help="subida mínima de energía para contar como golpe")
    p.add_argument("--ventana-corte", type=float, default=0.5, help="segundos tras un corte en que un golpe cuenta como 'en el corte'")
    a = p.parse_args()

    d = Path(a.carpeta)
    excl = [tuple(map(float, t.split("-"))) for t in filter(None, a.excluir.split(","))]
    fuera = lambda t: any(x <= t <= y for x, y in excl)
    cortes = [float(c) for c in (d / "cortes.txt").read_text().split() if c] if (d / "cortes.txt").exists() else []
    cortes = [c for c in cortes if not fuera(c)]

    x = cargar_audio(a.video)
    db = energia_db(x)
    activos = db[db > -50]
    voz_db = float(np.percentile(activos, 70)) if len(activos) else -20.0

    golpes, ultimo = [], -1.0
    for i in range(5, len(db) - 10):
        t = i * HOP / SR
        if fuera(t) or t - ultimo < 0.25:
            continue
        subida = db[i] - np.min(db[i - 5 : i])
        if subida >= a.salto_db and db[i] > voz_db - 20:
            pico = float(np.max(db[i : i + 10]))
            c = centroide(x, t)
            color = "grave" if c < 350 else "agudo" if c > 3500 else "medio"
            en_corte = any(0 <= t - k <= a.ventana_corte or 0 <= k - t <= 0.15 for k in cortes)
            # el arranque de una frase suele ser "medio": se marca como dudoso
            golpes.append({
                "t": round(t, 2),
                "nivel_vs_voz_db": round(pico - voz_db, 1),
                "color": color,
                "en_corte": en_corte,
                "dudoso_voz": color == "medio",
            })
            ultimo = t

    claros = [g for g in golpes if not g["dudoso_voz"]]
    cortes_con_golpe = sum(
        any(0 <= g["t"] - k <= a.ventana_corte or 0 <= k - g["t"] <= 0.15 for g in claros) for k in cortes
    )
    resumen = {
        "nivel_voz_db": round(voz_db, 1),
        "golpes_claros": len(claros),
        "golpes_dudosos": len(golpes) - len(claros),
        "cortes": len(cortes),
        "pct_cortes_con_golpe": round(100 * cortes_con_golpe / len(cortes)) if cortes else None,
        "colores": {k: sum(g["color"] == k for g in claros) for k in ("grave", "agudo")},
        "aviso": "Aproximado. 'dudoso_voz' suele ser el arranque de una frase. Verifica escuchando los que importen.",
    }
    salida = {"resumen": resumen, "golpes": golpes}
    (d / "sonido.json").write_text(json.dumps(salida, indent=2, ensure_ascii=False))
    print(json.dumps(resumen, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
