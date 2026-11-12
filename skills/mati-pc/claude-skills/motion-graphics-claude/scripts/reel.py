"""reel.py · motion-graphics-claude · reels con una persona hablando a cámara

Se ejecuta desde la carpeta del proyecto (la que crea nuevo.py).

  python scripts/reel.py preparar <tu-video.mp4> [--srt subtitulos.srt | --palabras words.json] [--desde 0 --hasta 20] [--modelo small]
      → recursos/toma.mp4 (1080×1920, la toma tal cual, con su audio), recursos/toma.json (duración, fps),
        recursos/palabras.json (cada palabra con su segundo) y recursos/cara.json (dónde está la cara).
        Transcripción: si ya la tienes (words.json de editar-reels-claude o palabras.json), --palabras; si no, Whisper local (faster-whisper) si está instalado; si no, el .srt que le pases (--srt).
        Cara: con OpenCV si está instalado; si no, una zona centrada arriba (cámbiala en cara.json si hace falta).
  python scripts/reel.py componer <escena> [--calidad hd|final]
      → resultados/<escena>-reel.mp4: monta los gráficos encima de la toma con el AUDIO ORIGINAL intacto (sin recomprimir)
        y comprueba que tiene todos los fotogramas (duración × 60).
        Si existe resultados/<escena>-1080p.mov (render con --transparente), lo pone encima de la toma original.
        Si no, usa resultados/<escena>-1080p.mp4 (escenas que ya llevan la persona dentro, como el PiP) y solo le pone el audio.
  python scripts/reel.py capas <escena> [--calidad hd|final]
      → resultados/capas/<escena>/detras.mov y delante.mov (ProRes 4444 con alfa, 60 fps, misma duración que la toma)
        + plan.json (cada gráfico con su capa y sus segundos, anclados a las palabras). Para montarlas con editar-reels-claude:
        detras.mov va en su make_base (--behind) y delante.mov encima del reel, en su capa de delante.
  python scripts/reel.py palabras [buscar]     → lista las palabras con su segundo (para elegir cuándo entra cada gráfico)
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

RAIZ = os.getcwd()
REC = os.path.join(RAIZ, 'recursos')


def sonda(f):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration',
                        '-of', 'json', f], capture_output=True, text=True)
    j = json.loads(r.stdout or '{}')
    v = next((s for s in j.get('streams', []) if s.get('codec_type') == 'video'), {})
    a = any(s.get('codec_type') == 'audio' for s in j.get('streams', []))
    n, d = (v.get('r_frame_rate') or '30/1').split('/')
    return {'w': v.get('width'), 'h': v.get('height'), 'fps': round(int(n) / max(1, int(d)), 3), 'dur': float(j.get('format', {}).get('duration', 0)), 'audio': a}


def fotogramas(f):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries', 'stream=nb_read_packets',
                        '-of', 'csv=p=0', f], capture_output=True, text=True)
    try:
        return int(r.stdout.strip())
    except ValueError:
        return -1


def srt_a_palabras(ruta):
    """Un .srt no trae tiempos por palabra: se reparten las palabras de cada subtítulo a lo largo de su tramo."""
    txt = open(ruta, encoding='utf-8-sig').read()
    out = []
    for bloque in re.split(r'\n\s*\n', txt.strip()):
        m = re.search(r'(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)', bloque)
        if not m:
            continue
        g = [int(x) for x in m.groups()]
        a = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000
        b = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000
        texto = ' '.join(bloque.split('\n')[2:]) if bloque.split('\n')[0].strip().isdigit() else ' '.join(bloque.split('\n')[1:])
        pals = [p for p in re.sub(r'<[^>]+>', '', texto).split() if p.strip()]
        if not pals:
            continue
        paso = (b - a) / len(pals)
        out += [{'p': p, 'i': round(a + k * paso, 3), 'f': round(a + (k + 1) * paso, 3)} for k, p in enumerate(pals)]
    return out


def importar_palabras(ruta, dur):
    """palabras.json de esta skill ([{p,i,f}]) o words.json de editar-reels-claude ({words:[{w,start,end}], segments}).
    Si trae «segments» (los tramos que se quedaron al cortar) y el vídeo es el ya cortado, pasa los tiempos al vídeo cortado."""
    j = json.load(open(ruta, encoding='utf-8'))
    if isinstance(j, list):
        return [{'p': w.get('p') or w.get('w') or w.get('word', ''), 'i': w.get('i', w.get('start')), 'f': w.get('f', w.get('end'))} for w in j]
    pal = [{'p': w.get('w') or w.get('word', ''), 'i': w['start'], 'f': w['end']} for w in j.get('words', [])]
    segs = j.get('segments') or []
    total = sum(b - a for a, b in segs)
    if segs and abs(total - dur) < 1.0 and abs(j.get('duration', dur) - dur) > 1.0:
        out, base = [], 0.0
        for a, b in segs:
            out += [{'p': w['p'], 'i': round(w['i'] - a + base, 3), 'f': round(min(w['f'], b) - a + base, 3)} for w in pal if a <= w['i'] < b]
            base += b - a
        print('· words.json con tramos de corte: tiempos pasados al vídeo cortado')
        return out
    return pal


def whisper_palabras(audio, modelo):
    from faster_whisper import WhisperModel   # pip install faster-whisper (la primera vez descarga el modelo)
    # el audio se pasa ya leído (WAV 16 kHz mono): así no depende de la versión de PyAV
    import wave
    import numpy as np
    with wave.open(audio, 'rb') as w:
        datos = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    for dispositivo, tipo in (('cuda', 'float16'), ('cpu', 'int8')):   # tarjeta NVIDIA si funciona; si no, procesador
        try:
            m = WhisperModel(modelo, device=dispositivo, compute_type=tipo)
            segs, _ = m.transcribe(datos, language='es', word_timestamps=True, vad_filter=True)
            return [{'p': w.word.strip(), 'i': round(w.start, 3), 'f': round(w.end, 3)} for s in segs for w in (s.words or []) if w.word.strip()]
        except ImportError:
            raise
        except Exception as e:
            if dispositivo == 'cpu':
                raise
            print(f'· Whisper en la GPU no va ({type(e).__name__}); lo hago con el procesador.')


def detectar_cara(video, dur):
    """Rectángulo que cubre la cara (con pelo y barbilla) en toda la toma, en coordenadas de 1080×1920."""
    try:
        import cv2
    except ImportError:
        return None
    cas = cv2.CascadeClassifier(os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml'))
    cap = cv2.VideoCapture(video)
    cajas = []
    for k in range(12):
        cap.set(cv2.CAP_PROP_POS_MSEC, 1000 * dur * (k + 0.5) / 12)
        ok, img = cap.read()
        if not ok:
            continue
        h, w = img.shape[:2]
        gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        caras = cas.detectMultiScale(gris, 1.1, 6, minSize=(w // 8, w // 8))
        if len(caras):
            x, y, cw, ch = max(caras, key=lambda c: c[2] * c[3])
            cajas.append((x * 1080 / w, y * 1920 / h, (x + cw) * 1080 / w, (y + ch) * 1920 / h))
    cap.release()
    if not cajas:
        return None
    med = lambda i: sorted(c[i] for c in cajas)[len(cajas) // 2]   # la mediana: una detección falsa no estira la caja
    x0, y0, x1, y1 = med(0), med(1), med(2), med(3)
    mx, my = (x1 - x0) * 0.22, (y1 - y0) * 0.25          # margen: pelo arriba, barbilla abajo
    x0, x1, y0, y1 = max(0, x0 - mx), min(1080, x1 + mx), max(0, y0 - my * 1.4), min(1920, y1 + my)
    return {'x': round(x0), 'y': round(y0), 'w': round(x1 - x0), 'h': round(y1 - y0)}


def preparar(a):
    os.makedirs(REC, exist_ok=True)
    origen = os.path.abspath(a.video)
    if not os.path.isfile(origen):
        sys.exit(f'No encuentro el vídeo: {origen}')
    info = sonda(origen)
    if not info['audio']:
        print('· Aviso: la toma no tiene audio.')
    dst = os.path.join(REC, 'toma.mp4')
    corte = (['-ss', str(a.desde)] if a.desde else []) + (['-to', str(a.hasta)] if a.hasta else [])
    vertical = info['w'] == 1080 and info['h'] == 1920
    if vertical and not corte:
        shutil.copy(origen, dst)
    else:
        # se encuadra a 1080×1920 (recorte centrado si viene en horizontal) y se corta; el audio se copia tal cual
        vf = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', *corte, '-i', origen, '-vf', vf, '-c:v', 'libx264', '-crf', '14', '-preset', 'medium',
                        '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', dst], check=True)
    info = sonda(dst)
    json.dump({'dur': round(info['dur'], 3), 'fps': info['fps']}, open(os.path.join(REC, 'toma.json'), 'w'))
    print(f'✓ recursos/toma.mp4 · {info["w"]}×{info["h"]} · {info["dur"]:.2f} s · {info["fps"]} fps')

    pal = None
    if a.palabras:
        pal = importar_palabras(a.palabras, info['dur']); fuente = os.path.basename(a.palabras)
    elif a.srt:
        pal = srt_a_palabras(a.srt); fuente = 'el .srt'
    else:
        try:
            wav = os.path.join(REC, '.audio16k.wav')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', dst, '-ac', '1', '-ar', '16000', wav], check=True)
            pal = whisper_palabras(wav, a.modelo); fuente = f'Whisper ({a.modelo})'
            os.remove(wav)
        except Exception as e:
            print(f'· Whisper no funcionó ({type(e).__name__}: {e}).')
            print('· No hay Whisper local (faster-whisper). Pide permiso e instálalo con: pip install faster-whisper\n'
                  '  o pásame los subtítulos con tiempos: python scripts/reel.py preparar <vídeo> --srt subtitulos.srt')
    if pal is not None:
        json.dump(pal, open(os.path.join(REC, 'palabras.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
        print(f'✓ recursos/palabras.json · {len(pal)} palabras con su segundo ({fuente})')

    cara = detectar_cara(dst, info['dur'])
    if cara is None:
        cara = {'x': 250, 'y': 300, 'w': 580, 'h': 720}
        print('· No pude medir la cara (sin OpenCV o no se ve): uso una zona centrada arriba. Revísala en recursos/cara.json.')
    else:
        print(f'✓ recursos/cara.json · cara en x={cara["x"]} y={cara["y"]} {cara["w"]}×{cara["h"]} (nada se pondrá encima)')
    json.dump(cara, open(os.path.join(REC, 'cara.json'), 'w'))
    print(f'  Para comprobar las escenas: node scripts/render.mjs comprobar <escena> --zona reel --cara {cara["x"]},{cara["y"]},{cara["w"]},{cara["h"]}')


def componer(a):
    toma = os.path.join(REC, 'toma.mp4')
    suf = '-1080p' if a.calidad == 'hd' else ''
    mov = os.path.join(RAIZ, 'resultados', f'{a.escena}{suf}.mov')
    mp4 = os.path.join(RAIZ, 'resultados', f'{a.escena}{suf}.mp4')
    salida = os.path.join(RAIZ, 'resultados', f'{a.escena}-reel.mp4')
    info = sonda(toma)
    fps = 60
    lado = 1080 if a.calidad == 'hd' else 2160
    alto = 1920 if a.calidad == 'hd' else 3840
    enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p']
    audio = ['-map', '0:a?', '-c:a', 'copy']   # el audio de la toma, sin tocar
    if os.path.isfile(mov):
        print(f'▶ capa con alfa {os.path.basename(mov)} encima de la toma original')
        fc = f'[0:v]scale={lado}:{alto}:flags=lanczos,fps={fps}[base];[1:v]scale={lado}:{alto},format=yuva444p10le[capa];[base][capa]overlay=0:0:shortest=0:eof_action=pass,format=yuv420p[v]'
        cmd = ['ffmpeg', '-v', 'error', '-y', '-i', toma, '-i', mov, '-filter_complex', fc, '-map', '[v]', *audio, *enc, '-t', str(info['dur']), '-movflags', '+faststart', salida]
    elif os.path.isfile(mp4):
        print(f'▶ escena con la persona dentro {os.path.basename(mp4)}: se le pone el audio original')
        cmd = ['ffmpeg', '-v', 'error', '-y', '-i', toma, '-i', mp4, '-map', '1:v', *audio, '-c:v', 'copy', '-t', str(info['dur']), '-movflags', '+faststart', salida]
    else:
        sys.exit(f'No encuentro resultados/{a.escena}{suf}.mov ni .mp4. Renderiza antes: node scripts/render.mjs video {a.escena} --calidad {a.calidad} [--transparente]')
    subprocess.run(cmd, check=True)
    esperados = round(info['dur'] * fps)
    n = fotogramas(salida)
    if abs(n - esperados) > 1:
        malo = salida.replace('.mp4', '.INCOMPLETO.mp4'); os.replace(salida, malo)
        sys.exit(f'✗ {os.path.basename(malo)} tiene {n} fotogramas y debería tener {esperados}. Vuelve a renderizar la escena.')
    print(f'✓ resultados/{os.path.basename(salida)} · {n} fotogramas ({info["dur"]:.2f} s a {fps} fps) · audio original')


def capas(a):
    """Renderiza la escena en dos capas transparentes (detrás / delante de la persona) + plan.json."""
    esc = a.escena
    cfg = os.path.join(RAIZ, 'escenas.json')
    lista = json.load(open(cfg, encoding='utf-8')) if os.path.isfile(cfg) else []
    for parte in ('detras', 'delante'):
        n = f'{esc}-{parte}'
        if not any(e.get('nombre') == n for e in lista):
            lista.append({'nombre': n, 'archivo': f'escenas/{esc}.html', 'hash': '#' + parte})
    json.dump(lista, open(cfg, 'w', encoding='utf-8'), indent=1)
    dst = os.path.join(RAIZ, 'resultados', 'capas', esc); os.makedirs(dst, exist_ok=True)
    nodo = ['node', os.path.join('scripts', 'render.mjs')]
    subprocess.run([*nodo, 'video', f'{esc}-detras,{esc}-delante', '--calidad', a.calidad, '--transparente'], check=True)
    subprocess.run([*nodo, 'plan', f'{esc}-delante', os.path.join(dst, 'plan.json')], check=True)
    suf = '-1080p' if a.calidad == 'hd' else ''
    dur = json.load(open(os.path.join(REC, 'toma.json')))['dur']
    for parte in ('detras', 'delante'):
        f = os.path.join(RAIZ, 'resultados', f'{esc}-{parte}{suf}.mov')
        os.replace(f, os.path.join(dst, f'{parte}.mov'))
        n = fotogramas(os.path.join(dst, f'{parte}.mov'))
        print(f'✓ resultados/capas/{esc}/{parte}.mov · {n} fotogramas (toma: {dur:.2f} s × 60 = {round(dur * 60)})')
    print(f'✓ resultados/capas/{esc}/plan.json')


def palabras(a):
    pal = json.load(open(os.path.join(REC, 'palabras.json'), encoding='utf-8'))
    for w in pal:
        if not a.buscar or a.buscar.lower() in w['p'].lower():
            print(f'{w["i"]:7.2f}  {w["p"]}')


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='modo', required=True)
    p = sub.add_parser('preparar'); p.add_argument('video'); p.add_argument('--srt'); p.add_argument('--palabras'); p.add_argument('--desde', type=float, default=0)
    p.add_argument('--hasta', type=float, default=0); p.add_argument('--modelo', default='small')
    c = sub.add_parser('componer'); c.add_argument('escena'); c.add_argument('--calidad', default='hd', choices=['hd', 'final'])
    k = sub.add_parser('capas'); k.add_argument('escena'); k.add_argument('--calidad', default='hd', choices=['hd', 'final'])
    w = sub.add_parser('palabras'); w.add_argument('buscar', nargs='?')
    a = ap.parse_args()
    {'preparar': preparar, 'componer': componer, 'capas': capas, 'palabras': palabras}[a.modo](a)


if __name__ == '__main__':
    main()
