"""Pasada 1A · Transcripción palabra a palabra con Whisper → words-raw.json

  python transcribe.py --audio trabajo/audio16k.wav --out trabajo/words-raw.json --lang es \
      --vocab "Claude, Claude Code, Opus, reel, motion graphics, subtítulos, prompts"

--vocab: nombres propios y términos del vídeo. Sin esto, Whisper escribe «CloudCode» o «rail».
Usa la GPU si hay CUDA; si no, la CPU (más lento: en un Mac o sin NVIDIA, prueba --model small si tarda mucho).
Whisper no es fiable con MPS (Mac), así que en Mac usa la CPU.
"""
import argparse, json
import comun  # consola UTF-8 en Windows
import torch, whisper

ap = argparse.ArgumentParser()
ap.add_argument("--audio", required=True)
ap.add_argument("--out", default="words-raw.json")
ap.add_argument("--lang", default="es")
ap.add_argument("--model", default="turbo")
ap.add_argument("--vocab", default="")
a = ap.parse_args()

dev = "cuda" if torch.cuda.is_available() else "cpu"
model = whisper.load_model(a.model, device=dev)
res = model.transcribe(a.audio, language=a.lang, word_timestamps=True, condition_on_previous_text=False,
                       initial_prompt=a.vocab or None, fp16=(dev == "cuda"))
words = [{"w": w["word"].strip(), "start": round(w["start"], 3), "end": round(w["end"], 3), "p": round(w.get("probability", 0), 3)}
         for seg in res["segments"] for w in seg.get("words", [])]
json.dump({"text": res["text"].strip(), "words": words}, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(res["text"].strip())
print(f"{len(words)} palabras · {dev} → {a.out}")
