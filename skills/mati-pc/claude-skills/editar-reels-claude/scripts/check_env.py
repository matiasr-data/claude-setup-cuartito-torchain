"""Comprueba todo lo que necesita la skill y recomienda la calidad según el equipo. No instala nada.

  python check_env.py                      → informe legible
  python check_env.py --json               → lo mismo en JSON (para Claude)
  python check_env.py --descargar-modelo   → además descarga el modelo de recorte a models/ (~100 MB)

Solo usa la biblioteca estándar, así que funciona aunque falten las dependencias.
"""
import argparse, importlib.util, json, os, platform, shutil, subprocess, sys, urllib.request

try:
    sys.stdout.reconfigure(encoding="utf-8")   # emojis en la consola de Windows
except Exception:
    pass
SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(SKILL, "scripts")
MODEL = os.path.join(SKILL, "models", "rvm_resnet50_fp32.torchscript")
MODEL_URL = "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_resnet50_fp32.torchscript"
OS = {"Windows": "windows", "Darwin": "mac"}.get(platform.system(), "linux")

ap = argparse.ArgumentParser()
ap.add_argument("--json", action="store_true")
ap.add_argument("--descargar-modelo", action="store_true")
a = ap.parse_args()


def run(cmd, timeout=30):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, shell=(OS == "windows" and cmd[0] in ("npm", "npx")))
        return r.returncode, (r.stdout or r.stderr).strip()
    except Exception as e:
        return -1, str(e)


HOW = {
    "ffmpeg": {"windows": "winget install Gyan.FFmpeg  (y cierra y abre la terminal)", "mac": "brew install ffmpeg", "linux": "sudo apt install ffmpeg"},
    "python": {"windows": "winget install Python.Python.3.11", "mac": "brew install python@3.11", "linux": "sudo apt install python3 python3-pip"},
    "torch_cuda": {"windows": "pip install torch --index-url https://download.pytorch.org/whl/cu128", "linux": "pip install torch --index-url https://download.pytorch.org/whl/cu128"},
    "torch": {"windows": "pip install torch", "mac": "pip install torch", "linux": "pip install torch"},
    "pip": {"windows": f'pip install -r "{os.path.join(SKILL, "requirements.txt")}"', "mac": f'pip install -r "{os.path.join(SKILL, "requirements.txt")}"', "linux": f'pip install -r "{os.path.join(SKILL, "requirements.txt")}"'},
    "node": {"windows": "winget install OpenJS.NodeJS.LTS", "mac": "brew install node", "linux": "sudo apt install nodejs npm"},
    "npm": {"windows": f'cd "{SCRIPTS}" && npm install', "mac": f'cd "{SCRIPTS}" && npm install', "linux": f'cd "{SCRIPTS}" && npm install'},
    "chrome": {"windows": "winget install Google.Chrome", "mac": "brew install --cask google-chrome", "linux": "sudo apt install chromium"},
    "model": {k: "python check_env.py --descargar-modelo" for k in ("windows", "mac", "linux")},
}
items = []


def add(key, ok, detail, fix=None, needed_for=""):
    items.append({"item": key, "ok": bool(ok), "detail": detail, "fix": None if ok else (HOW.get(fix or key, {}).get(OS) or fix), "para": needed_for})


# ffmpeg y codificadores
code, out = run(["ffmpeg", "-version"])
add("ffmpeg", code == 0, out.splitlines()[0] if code == 0 else "no está en el PATH", needed_for="todo el vídeo y el audio")
add("ffprobe", shutil.which("ffprobe") is not None, shutil.which("ffprobe") or "no está en el PATH", fix="ffmpeg", needed_for="leer los vídeos")
encoder = "cpu"
if code == 0:
    sys.path.insert(0, SCRIPTS)
    from comun import pick_encoder
    encoder = pick_encoder()

# tarjeta gráfica
gpu = ""
c, o = run(["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"])
if c == 0 and o:
    gpu = "NVIDIA " + o.splitlines()[0].replace("NVIDIA ", "")
elif OS == "mac":
    c, o = run(["sysctl", "-n", "machdep.cpu.brand_string"])
    gpu = o if c == 0 else "Mac"

# Python y paquetes
add("python", sys.version_info >= (3, 10), f"Python {platform.python_version()} ({sys.executable})", needed_for="los scripts")
torch_dev = None
if importlib.util.find_spec("torch"):
    import torch
    torch_dev = "cuda" if torch.cuda.is_available() else ("mps" if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available() else "cpu")
    detail = f"torch {torch.__version__} · {torch_dev}"
    if gpu.startswith("NVIDIA") and torch_dev != "cuda":
        add("torch", False, detail + " · tienes NVIDIA pero PyTorch no la usa (versión sin CUDA)", fix="torch_cuda", needed_for="transcribir y recortar rápido")
    else:
        add("torch", True, detail, needed_for="transcribir y recortar")
else:
    add("torch", False, "no instalado", fix="torch_cuda" if gpu.startswith("NVIDIA") else "torch", needed_for="transcribir y recortar")
for mod, name in (("whisper", "openai-whisper"), ("numpy", "numpy"), ("PIL", "pillow")):
    ok = importlib.util.find_spec(mod) is not None
    add(name, ok, "instalado" if ok else "no instalado", fix="pip", needed_for="transcribir" if mod == "whisper" else "los scripts")

# Node, puppeteer y navegador
c, o = run(["node", "--version"])
major = int(o.lstrip("v").split(".")[0]) if c == 0 and o.startswith("v") else 0
add("node", major >= 18, o if c == 0 else "no instalado", needed_for="música, efectos y gráficos (HyperFrames)")
pp = os.path.isdir(os.path.join(SCRIPTS, "node_modules", "puppeteer-core"))
add("npm install", pp, "puppeteer-core instalado" if pp else "falta npm install en scripts/", fix="npm", needed_for="música y efectos")
browsers = [os.environ.get("CHROME_PATH"),
            "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
            os.environ.get("LOCALAPPDATA") and os.path.join(os.environ["LOCALAPPDATA"], "Google/Chrome/Application/chrome.exe"),
            "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
            "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"]
br = next((b for b in browsers if b and os.path.exists(b)), None)
add("chrome", br, br or "no encuentro Chrome ni Edge", needed_for="música y efectos (SynthFlow)")

# Modelo de recorte
if a.descargar_modelo and not os.path.exists(MODEL):
    os.makedirs(os.path.dirname(MODEL), exist_ok=True)
    print("descargando el modelo de recorte (~100 MB)…", flush=True)
    urllib.request.urlretrieve(MODEL_URL, MODEL + ".part")
    os.replace(MODEL + ".part", MODEL)
size = os.path.getsize(MODEL) / 1e6 if os.path.exists(MODEL) else 0
add("modelo RVM", size > 50, f"{MODEL} · {size:.0f} MB" if size else f"falta {MODEL}", fix="model", needed_for="texto detrás de la cabeza")

# Espacio en disco (un reel 4K de 40 s usa ~3 GB de archivos intermedios)
free = shutil.disk_usage(os.getcwd()).free / 1e9
add("espacio en disco", free > 10, f"{free:.0f} GB libres", fix="libera espacio (un reel 4K usa ~3 GB de archivos de trabajo)", needed_for="archivos de trabajo")

# Recomendación según el equipo
if gpu.startswith("NVIDIA") and encoder == "nvenc":
    perfil, res, nota = "rápido", "4k", "Tarjeta NVIDIA: todo en 4K. Un reel de 40 s tarda unos minutos por pasada."
    if torch_dev != "cuda":
        nota += " (Antes instala PyTorch con CUDA en este Python, o usa el Python que ya lo tiene.)"
elif torch_dev == "mps" or encoder == "videotoolbox":
    perfil, res, nota = "medio", "1080", "Mac: 1080p recomendado. El recorte va más lento; 4K es posible si no tienes prisa."
else:
    perfil, res, nota = "lento", "1080", "Sin tarjeta gráfica: usa 1080p. El recorte por CPU tarda entre 10 y 40 min por minuto de vídeo según el procesador; puedes saltarlo (sin texto detrás de la cabeza)."

osname = f"{platform.system()} {platform.release()}"
if OS == "windows" and int(platform.version().split(".")[-1] or 0) >= 22000:
    osname = "Windows 11"
elif OS == "mac":
    osname = f"macOS {platform.mac_ver()[0]}"
report = {"sistema": f"{osname} · {platform.machine()}", "grafica": gpu or "no detectada", "cpus": os.cpu_count(),
          "codificador": encoder, "torch": torch_dev, "perfil": perfil, "resolucion_recomendada": res, "nota": nota,
          "skill": SKILL, "listo": all(i["ok"] for i in items), "faltan": [i["item"] for i in items if not i["ok"]], "items": items}
if a.json:
    print(json.dumps(report, ensure_ascii=False, indent=1))
else:
    print(f"\nEquipo: {report['sistema']} · {report['grafica']} · {report['cpus']} hilos")
    for i in items:
        print(f"  {'✅' if i['ok'] else '❌'} {i['item']:<17} {i['detail']}" + (f"\n       → {i['fix']}" if not i["ok"] and i["fix"] else ""))
    print(f"\nPerfil {perfil.upper()} · codificador {encoder} · PyTorch en {torch_dev or '—'} · recomiendo {res}\n{nota}")
    print("\nTodo listo ✅" if report["listo"] else f"\nFalta: {', '.join(report['faltan'])}")
