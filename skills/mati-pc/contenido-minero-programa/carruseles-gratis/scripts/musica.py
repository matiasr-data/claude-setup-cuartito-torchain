"""musica.py · Carrusel Animado · Viegas Academy

Sintetiza con numpy la música y los efectos de cada slide. Se ejecuta desde la carpeta del proyecto, después de
`node scripts/render.mjs golpes`. Lee audio/golpes.json y escribe:
  audio/slide-NN.wav   un loop perfecto por slide, a -14 LUFS (lo que pide Instagram)
  audio/cancion.wav    todos seguidos, para escuchar la canción entera
  audio/sonoridad.json la medición de cada slide

  python scripts/musica.py             → estilo «synthwave»: el modo Synthwave 80s de SynthFlow (semilla #8492), a 120 BPM
  python scripts/musica.py noche       → estilo «noche»: pad cálido, arpegio pulsado y percusión suave
Una sola canción: cada slide toma los compases siguientes; las colas que pasan del final vuelven al principio (loop perfecto).
Golpes que entiende: barrido · brillo · campana · clic · tecla · golpe · suave (con `ganancia` opcional).
"""
import json, pathlib, re, subprocess, tempfile
import sys
try: sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8')
except Exception: pass
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.io import wavfile

RAIZ = pathlib.Path.cwd(); AUD = RAIZ / 'audio'
SR, BPM = 48000, 120
TP = 60 / BPM; COMPAS = 4 * TP
LUFS_META, TECHO_DB = -14.0, -1.5
azar = np.random.default_rng(1971)

def f(midi): return 440.0 * 2 ** ((midi - 69) / 12)
def t_(d): return np.arange(int(d * SR)) / SR
def filtro(x, tipo, fc, orden=2):
    fc = np.atleast_1d(fc) / (SR / 2)
    return sosfilt(butter(orden, fc if len(fc) > 1 else fc[0], tipo, output='sos'), x)

# acordes: (bajo, notas) en MIDI · Am9 · Fmaj7 · Cmaj7 · G6
ACORDES = {'Am9': (33, [57, 60, 64, 67, 71]), 'Fmaj7': (29, [53, 57, 60, 64]), 'Cmaj7': (36, [55, 60, 64, 71]), 'G6': (31, [55, 59, 62, 64])}
CAMINO = {4: ['Am9', 'Fmaj7', 'Cmaj7', 'G6'], 3: ['Am9', 'Fmaj7', 'G6'], 2: ['Am9', 'G6'], 1: ['Am9']}

# ---------- instrumentos ----------
def pad(notas, dur):
    t = t_(dur + 1.2); x = np.zeros_like(t)
    for m in notas:
        for desaf in (-0.08, 0.0, 0.07):
            fr = f(m) * 2 ** (desaf / 12)
            for k in range(1, 9): x += np.sin(2 * np.pi * fr * k * t + k * desaf) / k * (0.9 ** k)
    x = filtro(x, 'low', 1500)
    env = np.clip(t / 0.45, 0, 1) * np.clip(1 - (t - dur) / 1.0, 0, 1)
    return 0.010 * x * env
def pulso(m, dur=0.32, vel=1.0):
    t = t_(dur + 0.4); fr = f(m)
    x = np.sin(2 * np.pi * fr * t) + 0.35 * np.sin(2 * np.pi * 2 * fr * t) * np.exp(-t / 0.08) + 0.12 * np.sin(2 * np.pi * 3 * fr * t) * np.exp(-t / 0.05)
    return 0.09 * vel * x * np.exp(-t / 0.22) * np.clip(t / 0.003, 0, 1)
def sub(m, dur, vel=1.0):
    t = t_(dur + 0.2); fr = f(m) * 2
    x = np.tanh(1.4 * (np.sin(2 * np.pi * fr * t) + 0.3 * np.sin(2 * np.pi * 2 * fr * t))) / np.tanh(1.4)
    env = np.clip(t / 0.01, 0, 1) * np.where(t < dur, np.exp(-t / 1.2), np.exp(-dur / 1.2) * np.exp(-(t - dur) / 0.05))
    return 0.26 * vel * x * env
def bombo(vel=1.0):
    t = t_(0.5); fr = 46 + 90 * np.exp(-t / 0.04)
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.25)
    golpe = filtro(azar.standard_normal(len(t)), 'band', [900, 4000]) * np.exp(-t / 0.008) * 0.25
    return 0.40 * vel * (np.tanh(2.2 * x) / np.tanh(2.2) + golpe)
def palma(vel=1.0):
    t = t_(0.3); r = azar.standard_normal(len(t))
    env = sum(np.exp(-np.clip(t - d, 0, None) / 0.012) * (t >= d) for d in (0, 0.011, 0.022)) * np.exp(-t / 0.09)
    return 0.12 * vel * filtro(r, 'band', [900, 5000]) * env
def charles(vel=1.0):
    t = t_(0.09); return 0.05 * vel * filtro(azar.standard_normal(len(t)), 'high', 7000) * np.exp(-t / 0.025)

# ---------- efectos ----------
def fx_barrido(g=1.0, dur=0.55):
    n = int(dur * SR); t = np.arange(n) / SR; u = t / dur; r = azar.standard_normal(n); out = np.zeros(n); B = 512
    for i in range(0, n, B):
        fc = 450 * (6.5 ** min(1, (i / n) / 0.7)); lo, hi = max(120, fc * 0.6), min(SR / 2 - 200, fc * 1.6)
        out[i:i + B] = filtro(r[max(0, i - 1024):i + B], 'band', [lo, hi])[-len(r[i:i + B]):]
    return 0.20 * g * out * np.sin(np.pi * u) ** 1.5
def fx_brillo(g=1.0):
    t = t_(1.3); x = np.zeros_like(t)
    for k, fr in enumerate([2349, 2793, 3136, 3729, 4699, 5588]):
        x += np.sin(2 * np.pi * fr * t + k) * np.exp(-np.clip(t - k * 0.045, 0, None) / 0.35) * (t >= k * 0.045)
    aire = filtro(azar.standard_normal(len(t)), 'high', 6000) * np.exp(-t / 0.2) * 0.3
    return 0.035 * g * (x + aire) * np.clip(t / 0.01, 0, 1)
def fx_campana(g=1.0, m=81):
    t = t_(1.8); fr = f(m); I = 2.2 * np.exp(-t / 0.5)
    return 0.07 * g * np.sin(2 * np.pi * fr * t + I * np.sin(2 * np.pi * fr * 1.4 * t)) * np.exp(-t / 0.7) * np.clip(t / 0.004, 0, 1)
def fx_clic(g=1.0, fr=2200):
    t = t_(0.08); return 0.10 * g * (np.sin(2 * np.pi * fr * t) * np.exp(-t / 0.008) + 0.4 * filtro(azar.standard_normal(len(t)), 'high', 3000) * np.exp(-t / 0.003))
def fx_tecla(g=1.0):
    a = fx_clic(0.8 * g, 1500); b = np.zeros(int(0.03 * SR)); return np.concatenate([a, b]) + np.concatenate([b, 0.5 * a])
def fx_golpe(g=1.0):
    t = t_(0.6); fr = 40 + 50 * np.exp(-t / 0.06)
    return 0.45 * g * (np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.22)) + 0.3 * filtro(azar.standard_normal(len(t)), 'band', [300, 1500]) * np.exp(-t / 0.04))
EFECTOS = {'barrido': fx_barrido, 'brillo': fx_brillo, 'campana': fx_campana, 'clic': fx_clic, 'tecla': fx_tecla, 'golpe': fx_golpe, 'suave': lambda g=1.0: fx_golpe(0.5 * g)}

# ---------- un slide ----------
def compone(k, n_slides, dur, golpes):
    n = int(round(dur * SR)); buf = np.zeros(n + 4 * SR)
    def pon(x, t): i = int(round(t * SR)); buf[i:i + len(x)] += x[:len(buf) - i]
    comps = max(1, int(round(dur / COMPAS))); camino = CAMINO[min(comps, 4)]
    portada = k == 0
    for c in range(comps):
        nombre = camino[c % len(camino)] if comps <= 4 else CAMINO[4][c % 4]
        bajo, notas = ACORDES[nombre]; t0 = c * COMPAS
        pon(pad(notas, COMPAS), t0)
        arp = notas + [notas[1] + 12]
        for i in range(8):  # arpegio en corcheas
            pon(pulso(arp[(i * 3 + c) % len(arp)] + 12, vel=0.9 if i % 2 == 0 else 0.6), t0 + i * TP / 2)
        pon(sub(bajo, 1.5 * TP), t0); pon(sub(bajo, 0.9 * TP, 0.8), t0 + 2 * TP); pon(sub(bajo + 7, 0.4 * TP, 0.6), t0 + 3.5 * TP)
        for b in (0, 2): pon(bombo(0.7 if portada else 1.0), t0 + b * TP)
        if not portada:
            for b in (1, 3): pon(palma(), t0 + b * TP)
        for b in range(8): pon(charles(1.0 if b % 2 else 0.5), t0 + b * TP / 2)
    for gp in golpes:
        fx = EFECTOS.get(gp.get('tipo'), fx_clic); pon(fx(gp.get('ganancia', 1.0)), gp['t'])
    x = buf[:n].copy(); cola = buf[n:]
    for j in range(0, len(cola), n): x[:len(cola[j:j + n])] += cola[j:j + n]  # lo que se pasa del final vuelve al principio: loop perfecto
    return x

# =====================================================================================================
# ESTILO «synthwave» · el modo Synthwave 80s de SynthFlow (el estudio procedural de Viegas Estudio),
# portado a numpy: misma semilla (#8492), mismo generador mulberry32, misma bolsa de acordes en La menor,
# bajo sierra octavado en semicorcheas, acordes de sierra desafinada, arpegio brillante, caja con reverb
# y bombo four-on-the-floor. A 120 BPM (SynthFlow lo trae a 118) para que cada golpe caiga en los tiempos del motor.
# =====================================================================================================
SEMILLA = 8492
def mulberry32(a):
    s = [a & 0xFFFFFFFF]
    imul = lambda x, y: (x * y) & 0xFFFFFFFF
    def r():
        s[0] = (s[0] + 0x6D2B79F5) & 0xFFFFFFFF; t = s[0]
        t = imul(t ^ (t >> 15), t | 1)
        t = (t ^ ((t + imul(t ^ (t >> 7), t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return r
def patron_synthwave(semilla=SEMILLA):
    r = mulberry32(semilla)
    bolsa = [('Am', [57, 60, 64, 69], 33), ('Fmaj7', [53, 57, 60, 64], 29), ('C', [60, 64, 67, 72], 36),
             ('G', [55, 59, 62, 67], 31), ('Dm7', [50, 57, 60, 65], 38), ('Em7', [52, 59, 62, 67], 40)]
    prog = [bolsa[int(r() * len(bolsa))] for _ in range(4)]
    arp_escala = [69, 72, 76, 79, 81, 84, 88]
    arp = [arp_escala[int(r() * len(arp_escala))] for _ in range(16)]
    bombo_p = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1 if r() > 0.5 else 0, 0]
    return {'prog': prog, 'arp': arp, 'bombo': bombo_p, 'caja': [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]}

def rampa_exp(v0, v1, d, n):  # como exponentialRampToValueAtTime
    t = np.arange(n) / SR; return v0 * (v1 / v0) ** np.clip(t / d, 0, 1)
def env_ataque_caida(n, pico, ataque, dur):  # sube lineal en `ataque` y cae exponencial hasta 0,001 en `dur`
    t = np.arange(n) / SR
    sube = np.clip(t / max(ataque, 1e-4), 0, 1) * pico
    cae = pico * (0.001 / pico) ** np.clip((t - ataque) / max(dur - ataque, 1e-4), 0, 1)
    return np.where(t < ataque, sube, cae) * (t < dur)
def osc(frecs, tipo):
    fase = np.cumsum(frecs) / SR
    if tipo == 'sierra': return 2 * (fase % 1.0) - 1
    if tipo == 'triangulo': return 2 * np.abs(2 * (fase % 1.0) - 1) - 1
    return np.sin(2 * np.pi * fase)
def paso_bajo_variable(x, fc):  # 12 dB/oct con corte que cambia en el tiempo (dos polos de un paso)
    a = 1 - np.exp(-2 * np.pi * np.asarray(fc) / SR); y1 = y2 = 0.0; out = np.empty_like(x)
    for i in range(len(x)):
        y1 += a[i] * (x[i] - y1); y2 += a[i] * (y1 - y2); out[i] = y2
    return out
RUIDO = np.random.default_rng(84920).uniform(-1, 1, SR * 3)
def sw_bombo():
    d = 0.32; n = int(d * SR); t = np.arange(n) / SR
    f_ = np.where(t < 0.08, rampa_exp(160, 42, 0.08, n), 42 * (30 / 42) ** np.clip((t - 0.08) / (d - 0.08), 0, 1))
    return osc(f_, 'seno') * rampa_exp(0.85, 0.001, d, n)
def sw_caja():
    n = int(0.34 * SR)
    cuerpo = osc(rampa_exp(210, 95, 0.1, n), 'triangulo') * rampa_exp(0.4, 0.001, 0.14, n) * (np.arange(n) < 0.15 * SR)
    hilos = filtro(RUIDO[:n], 'band', [1500, 2200]) * 3 * rampa_exp(0.55, 0.001, 0.34, n)
    return cuerpo + hilos, hilos  # (seco, a la reverb)
def sw_charles(abierto=False):
    d = 0.16 if abierto else 0.045; n = int(d * SR)
    return filtro(RUIDO[SR:SR + n], 'high', 7500) * rampa_exp(0.18, 0.001, d, n)
def sw_bajo(m, d):
    n = int(d * SR); fr = f(m)
    x = osc(np.full(n, fr), 'sierra') + osc(np.full(n, fr * 0.5), 'seno')
    x = paso_bajo_variable(x, rampa_exp(950, 190, d * 0.85, n))
    return x * env_ataque_caida(n, 0.34, 0.015, d)
def sw_acorde(notas, d):
    n = int(d * SR); x = np.zeros(n)
    for i, m in enumerate(notas):
        fr = f(m); v = osc(np.full(n, fr), 'sierra') + osc(np.full(n, fr * 1.006), 'sierra')
        x += v * env_ataque_caida(n, 0.055, 0.04 + i * 0.015, d)
    return x
def sw_arpegio(m, d):
    n = int(d * SR); return osc(np.full(n, f(m)), 'sierra') * env_ataque_caida(n, 0.11, 0.015, d)
# efectos de SynthFlow
def sf_whoosh(g=1.0):
    d = 0.85; n = int(d * SR); t = np.arange(n) / SR
    fc = np.where(t < d * 0.45, rampa_exp(160, 3400, d * 0.45, n), 3400 * (180 / 3400) ** np.clip((t - d * 0.45) / (d * 0.55), 0, 1))
    out = np.zeros(n); B = 256
    for i in range(0, n, B):
        c = fc[min(i + B // 2, n - 1)]; bw = c / 3.2
        out[i:i + B] = filtro(RUIDO[2 * SR + max(0, i - 1024):2 * SR + i + B], 'band', [max(40, c - bw / 2), min(SR / 2 - 100, c + bw / 2)])[-len(out[i:i + B]):]
    env = np.where(t < d * 0.45, 0.75 * t / (d * 0.45), 0.75 * (0.001 / 0.75) ** np.clip((t - d * 0.45) / (d * 0.55), 0, 1))
    return 0.35 * g * out * env
def sf_uiclick(g=1.0):
    n = int(0.09 * SR); x = np.zeros(n)
    for off, base in ((0, 1450), (0.045, 2180)):
        i = int(off * SR); m = int(0.045 * SR)
        x[i:i + m] += osc(rampa_exp(base, base * 0.5, 0.035, m), 'seno') * rampa_exp(0.45, 0.001, 0.04, m)
    return 0.35 * g * x
def sf_impacto(g=1.0):
    d = 1.2; n = int(d * SR); t = np.arange(n) / SR
    fr = np.where(t < 0.22, rampa_exp(145, 32, 0.22, n), 32 * (22 / 32) ** np.clip((t - 0.22) / (d - 0.22), 0, 1))
    return 0.5 * g * (osc(fr, 'seno') * rampa_exp(1.0, 0.001, d, n) + 0.4 * filtro(RUIDO[:n], 'low', 900) * rampa_exp(0.8, 0.001, 0.9, n))
EFECTOS_SW = {'barrido': sf_whoosh, 'clic': sf_uiclick, 'tecla': lambda g=1.0: sf_uiclick(0.55 * g), 'golpe': sf_impacto,
              'suave': lambda g=1.0: sf_impacto(0.4 * g), 'brillo': lambda g=1.0: fx_brillo(g), 'campana': lambda g=1.0: fx_campana(g)}

def compone_synthwave(compas0, dur, golpes, pat):
    n = int(round(dur * SR)); seco = np.zeros(n + 4 * SR); humedo = np.zeros_like(seco)
    def pon(buf, x, t): i = int(round(t * SR)); buf[i:i + len(x)] += x[:len(buf) - i]
    paso = TP / 4
    for c in range(max(1, int(round(dur / COMPAS)))):
        nombre, notas, bajo = pat['prog'][(compas0 + c) % 4]; t0 = c * COMPAS
        ac = sw_acorde(notas, paso * 15); pon(seco, ac, t0); pon(humedo, ac, t0)
        for s in range(16):
            t = t0 + s * paso
            if pat['bombo'][s]: pon(seco, sw_bombo(), t)
            if pat['caja'][s]: cj, cola = sw_caja(); pon(seco, cj, t); pon(humedo, cola, t)
            pon(seco, sw_charles(s == 14), t)
            pon(seco, sw_bajo(bajo + (12 if s % 2 else 0), paso * 0.9), t)
            ar = sw_arpegio(pat['arp'][s], paso * 0.85); pon(seco, ar, t); pon(humedo, ar, t)
    for gp in golpes:
        fx = EFECTOS_SW.get(gp.get('tipo'), sf_uiclick)(gp.get('ganancia', 1.0)); pon(seco, fx, gp['t']); pon(humedo, 0.5 * fx, gp['t'])
    def vuelta(buf):
        x = buf[:n].copy(); cola = buf[n:]
        for j in range(0, len(cola), n): x[:len(cola[j:j + n])] += cola[j:j + n]
        return x
    x, h = vuelta(seco), vuelta(humedo)
    # reverb: impulso sintético de 2,4 s (ruido con caída ^2,8) aplicado en círculo; mezcla al 35 %, como en SynthFlow
    L = int(2.4 * SR); imp = np.random.default_rng(2400).uniform(-1, 1, L) * (1 - np.arange(L) / L) ** 2.8
    imp /= np.sqrt((imp ** 2).sum())
    from scipy.signal import fftconvolve
    reverb = circular(lambda y: fftconvolve(y, imp)[:len(y)], h)
    x = filtro(x + 0.35 * reverb, 'low', 8500)
    # compresor del máster (umbral -14 dB, ratio 6)
    env = np.sqrt(uniform_filter1d(np.tile(x, 3) ** 2, int(0.01 * SR), mode='wrap'))[len(x):2 * len(x)] + 1e-9
    db = 20 * np.log10(env); red = np.where(db > -14, (-14 + (db - -14) / 6) - db, 0.0)
    red = uniform_filter1d(red, int(0.005 * SR), mode='wrap')
    return x * 10 ** (red / 20)

def circular(fn, x):  # procesa como si el audio diera la vuelta: la costura no tiene escalón
    return fn(np.tile(x, 3))[len(x):2 * len(x)]
def ecualiza(x):
    x = filtro(x, 'high', 32)
    graves = filtro(x, 'low', 140); agudos = filtro(x, 'high', 3500)
    return x - 0.35 * graves + 0.45 * agudos  # menos barro en el grave, más aire: se oye mejor en el móvil
def limita(x, techo_db=TECHO_DB):
    techo = 10 ** (techo_db / 20)
    picos = np.abs(np.interp(np.arange(len(x) * 4) / 4, np.arange(len(x)), x)).reshape(-1, 4).max(1)
    g = np.minimum(1.0, techo / np.maximum(picos, 1e-9)); w = int(0.003 * SR)
    g = uniform_filter1d(minimum_filter1d(g, 2 * w + 1, mode='wrap'), w, mode='wrap')
    return x * np.minimum(g, 1.0)
def mide(x):
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp: ruta = tmp.name
    graba(ruta, np.tile(x, 2))
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', ruta, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    pathlib.Path(ruta).unlink(missing_ok=True)
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]), float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1])
def graba(ruta, x):
    wavfile.write(str(ruta), SR, (np.clip(np.stack([x, x], 1), -1, 1) * 32767).astype(np.int16))

if __name__ == '__main__':
    import sys
    ESTILO = sys.argv[1] if len(sys.argv) > 1 else 'synthwave'   # 'synthwave' (SynthFlow · Synthwave 80s) o 'noche'
    G = json.load(open(AUD / 'golpes.json', encoding='utf-8'))
    pat = patron_synthwave()
    todo, informe = [], {}
    print(f'estilo: {ESTILO}' + (f' · semilla #{SEMILLA} · ' + ' · '.join(c[0] for c in pat['prog']) if ESTILO == 'synthwave' else ''))
    for k, sl in enumerate(G['slides']):
        n = f"{sl['slide']:02d}"
        if ESTILO == 'synthwave': x = compone_synthwave(sl.get('desde_compas', 1) - 1, sl['duracion_s'], sl['golpes'], pat)
        else: x = circular(ecualiza, compone(k, len(G['slides']), sl['duracion_s'], sl['golpes']))
        ganancia = 1.0
        for _ in range(4):
            y = circular(limita, x * ganancia); lufs, pico = mide(y); ganancia *= 10 ** ((LUFS_META - lufs) / 20)
        y = circular(limita, x * ganancia); lufs, pico = mide(y)
        graba(AUD / f'slide-{n}.wav', y); todo.append(y)
        informe[n] = {'duracion_s': sl['duracion_s'], 'lufs': round(lufs, 2), 'pico_dbtp': round(pico, 2)}
        print(f'✓ audio/slide-{n}.wav · {sl["duracion_s"]} s · {lufs:.1f} LUFS · pico {pico:.1f} dBTP')
    graba(AUD / 'cancion.wav', np.concatenate(todo))
    json.dump(informe, open(AUD / 'sonoridad.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
