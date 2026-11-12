"""Pasada 3 · Subtítulos: trozos de 1-3 palabras escritos a mano, con una palabra clave por frase.

  python captions.py --words trabajo/words.json --phrases trabajo/frases.txt --out trabajo/captions.json

frases.txt: una frase por línea, trozos separados con | y la palabra clave entre asteriscos.
  Este reel está | siendo editado al | *100 %* | por Claude | Opus 5.5
  No tienes que | abrir ningún | *editor* | de vídeos
Las palabras deben coincidir, en orden, con words.json (sin contar mayúsculas ni puntuación).
Reglas: cada trozo dura hasta que empieza el siguiente (máx. +0,35 s de cola) y nunca menos de 0,4 s.
"""
import argparse, json, re
import comun  # consola UTF-8 en Windows

ap = argparse.ArgumentParser()
ap.add_argument("--words", required=True)
ap.add_argument("--phrases", required=True)
ap.add_argument("--out", default="captions.json")
a = ap.parse_args()

D = json.load(open(a.words, encoding="utf-8"))
W = D["words"]
PHRASES = [l.strip() for l in open(a.phrases, encoding="utf-8") if l.strip() and not l.startswith("#")]
clean = lambda s: re.sub(r"[^\wáéíóúñü%.]", "", s.lower()).strip(".")

caps, i = [], 0
for p, phrase in enumerate(PHRASES):
    for chunk in [c.strip() for c in phrase.split("|")]:
        key = chunk.startswith("*")
        toks = chunk.strip("*").split()
        grp = W[i:i + len(toks)]
        if [clean(x["w"]) for x in grp] != [clean(t) for t in toks]:
            raise SystemExit(f"No coincide «{chunk}» con las palabras {[x['w'] for x in grp]} (posición {i}). Revisa frases.txt.")
        caps.append({"text": chunk.strip("*"), "key": key, "phrase": p, "start": grp[0]["start"], "end": grp[-1]["end"],
                     "words": [{"w": t, "t": x["start"]} for t, x in zip(toks, grp)]})
        i += len(toks)
if i != len(W):
    raise SystemExit(f"Sobran palabras: frases.txt cubre {i} de {len(W)}.")

for x, y in zip(caps, caps[1:]):
    x["end"] = min(y["start"], x["end"] + 0.35)
caps[-1]["end"] = min(D["duration"], caps[-1]["end"] + 0.6)
for x, y in zip(caps, caps[1:]):
    if x["end"] - x["start"] < 0.4:
        x["end"] = x["start"] + 0.4
        if y["start"] < x["end"]:
            y["start"] = x["end"]
            for w in y["words"]:
                w["t"] = max(w["t"], y["start"])
for c in caps:
    c["start"], c["end"] = round(c["start"], 3), round(c["end"], 3)
json.dump(caps, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for p in range(len(PHRASES)):
    print(f"{p + 1:2d}. " + " · ".join(("**" + c["text"].upper() + "**") if c["key"] else c["text"] for c in caps if c["phrase"] == p))
print(f"{len(caps)} subtítulos · mínimo {min(c['end'] - c['start'] for c in caps):.2f} s → {a.out}")
