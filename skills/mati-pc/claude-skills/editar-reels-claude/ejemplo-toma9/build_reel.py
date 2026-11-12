"""Pasada 4B (v2): genera las composiciones del reel.
  python build_reel.py behind  -> index.html solo con la capa «detrás de Diego» (fondo transparente)
  python build_reel.py final   -> index.html con base.mp4 + zooms suaves + subtítulos + gráficos + escena a pantalla completa

Movimiento: el rebote de la Clase 02 (rebote-al-llegar.txt):
    valor + vel · fuerza · sin(rebotes · t · 2π) / e^(frenado · t)
Los keyframes llegan con velocidad (curva u²) y el rebote hace el final. Fuerza 12 %, Rebotes 2,5, Frenado 5.
Todo el JS se genera aquí con selectores literales (el bundler no admite selectores con plantillas).
"""
import html, json, re, sys

MODE = sys.argv[1] if len(sys.argv) > 1 else "final"
DUR = json.load(open("words.json", encoding="utf-8"))["duration"]
caps = json.load(open("captions.json", encoding="utf-8"))
CLAUDE = re.search(r'd="([^"]+)"', open("reel/assets/logos/claude.svg", encoding="utf-8").read()).group(1)
CODE = re.search(r'd="([^"]+)"', open("reel/assets/logos/claude-code.svg", encoding="utf-8").read()).group(1)
NL = "\n"


def spark(cls=""):
    return f'<svg class="logo-claude {cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill="#D97757" d="{CLAUDE}"/></svg>'


def mascot(cls="", id_=""):
    idattr = f' id="{id_}"' if id_ else ""
    return f'<svg{idattr} class="logo-code {cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill="#D97757" fill-rule="evenodd" clip-rule="evenodd" d="{CODE}"/></svg>'


def js(line):
    return "        " + line + NL


FONTS = """
        @font-face { font-family: "Anton"; src: url("assets/fonts/anton-400.woff2") format("woff2"); font-weight: 400; }
        @font-face { font-family: "Rajdhani"; src: url("assets/fonts/rajdhani-700.woff2") format("woff2"); font-weight: 700; }
        @font-face { font-family: "Rajdhani"; src: url("assets/fonts/rajdhani-600.woff2") format("woff2"); font-weight: 600; }
        @font-face { font-family: "Cascadia Mono"; src: url("assets/fonts/cascadia-mono.ttf") format("truetype"); font-weight: 400; }
        @font-face { font-family: "SF Compact Display"; src: url("assets/fonts/sf-compact-display-medium.otf") format("opentype"); font-weight: 500; }"""

# El rebote de Diego como ease de GSAP. Dura «llegada + 0,8 s»: con 2,5 rebotes/s el seno vuelve a 0 justo al final.
SPRING = """        const rb = (vel, fuerza, rebotes, frenado, t) => vel * fuerza * Math.sin(rebotes * t * 2 * Math.PI) / Math.exp(frenado * t);
        const VB = (fuerza = 0.12, llegada = 0.3) => (p) => { const tot = llegada + 0.8, t = p * tot; if (t < llegada) { const u = t / llegada; return u * u; } return 1 + rb(2 / llegada, fuerza, 2.5, 5, t - llegada); };
"""
IN = "duration: 1.1, ease: VB(0.07)"
IN_SOFT = "duration: 1.1, ease: VB(0.045)"

# ───────────────────────── Capa «detrás de Diego» ─────────────────────────
BEHIND = [
    ("b100", 1.66, 2.55, '<div class="big" style="font-size:800px">100%</div>', "{ opacity: 0, scale: 1.25, y: 70 }", IN),
    ("bopus", 2.45, 4.62, f'<div class="logo-wrap">{spark("huge")}</div>', "{ opacity: 0, scale: 0.4, rotation: -60 }", IN_SOFT),
    ("bauto", 18.74, 20.25, '<div class="big" style="font-size:460px">AUTOMÁTICA</div>', "{ opacity: 0, scale: 1.25, y: 70 }", IN),
    ("bclaude", 35.60, DUR, '<div class="big" style="font-size:640px">CLAUDE</div>', "{ opacity: 0, scale: 1.25, y: 70 }", IN),
]
behind_html = NL.join(
    f'        <div id="{i}" class="bh clip" data-start="{s:.3f}" data-duration="{e - s:.3f}" data-track-index="1"><div class="in">{c}</div></div>'
    for i, s, e, c, _, _ in BEHIND)
BJS = ""
for i, s, e, c, frm, ease in BEHIND:
    BJS += js(f'btl.fromTo("#{i} .in", {frm}, {{ opacity: 1, scale: 1, y: 0, rotation: 0, {ease} }}, {s});')
    if e < DUR - 0.05:
        BJS += js(f'btl.to("#{i} .in", {{ opacity: 0, scale: .96, duration: 0.2, ease: "power2.in" }}, {e - 0.2:.2f});')
BJS += js('btl.fromTo("#bopus .huge", { rotation: 0 }, { rotation: 30, duration: 2.17, ease: "sine.inOut" }, 2.45);')

behind = f"""<!doctype html>
<html lang="es"><head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <style>{FONTS}
        #behind-root {{ position: absolute; inset: 0; }}
        #behind-root .bh {{ position: absolute; left: 0; right: 0; top: 380px; height: 1000px; display: flex; align-items: center; justify-content: center; }}
        #behind-root .in {{ display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }}
        #behind-root .big {{ font-family: "Anton", sans-serif; line-height: .9; letter-spacing: .01em; white-space: nowrap;
              background: linear-gradient(180deg, #fff2c4 0%, #f6cf5c 50%, #e0a52a 100%); -webkit-background-clip: text; background-clip: text; color: transparent;
              filter: drop-shadow(0 0 60px rgba(242,200,75,.45)) drop-shadow(0 24px 40px rgba(9,4,15,.55)); }}
        #behind-root .logo-wrap {{ width: 1700px; height: 1700px; display: block; }}
        #behind-root .huge {{ width: 100%; height: 100%; display: block; filter: drop-shadow(0 0 90px rgba(217,119,87,.75)) drop-shadow(0 0 30px rgba(255,180,140,.55)); }}
      </style>
      <div id="behind-root" data-composition-id="behind" data-width="2160" data-height="3840" data-duration="{DUR}">
{behind_html}
      </div>
      <script>
{SPRING}        const btl = gsap.timeline({{ paused: true }});
{BJS}        window.__timelines["behind"] = btl;
      </script>
    </template>
  </body>
</html>
"""
open("reel/compositions/behind.html", "w", encoding="utf-8", newline="\n").write(behind)

# ───────────────────────── Subtítulos ─────────────────────────
FS_IN, FS_OUT = 11.40, 18.74   # escena a pantalla completa «Así edita Claude Code»
SKIP = [(1.66, 2.38), (8.45, 9.09), (FS_IN, FS_OUT), (25.55, 31.10), (35.07, DUR + 1)]


def hidden(c):
    return any(a - 0.01 <= c["start"] < b - 0.01 for a, b in SKIP)


clips, CJS = [], ""
# Entradas de texto suaves y variadas (sin rebote): según la frase, por caracteres, por palabras o la línea entera.
MODES = ["chars", "words", "line", "words", "chars", "words", "line", "chars", "line", "chars", "words", "line", "words"]
SOFT_W = '{ opacity: 0, y: 28, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.38, ease: "power3.out" }'
SOFT_C = '{ opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", stagger: 0.022 }'
SOFT_L = '{ opacity: 0, y: 36, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.42, ease: "power3.out" }'
KEY_W = '{ opacity: 0, scale: 1.12, filter: "blur(14px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.45, ease: "power3.out" }'
KEY_C = '{ opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 0.34, ease: "power3.out", stagger: 0.035 }'
for i, c in enumerate(caps):
    if hidden(c):
        continue
    d = round(c["end"] - c["start"], 3)
    mode = MODES[c["phrase"]]
    spans = ""
    for k, w in enumerate(c["words"]):
        wid = f"w{i}-{k}"
        if mode == "chars":
            inner = "".join(f'<span class="ch">{html.escape(ch)}</span>' if ch != " " else " " for ch in w["w"])
        else:
            inner = html.escape(w["w"])
        spans += f'<span id="{wid}" class="w">{inner}</span>'
        if mode == "chars":
            CJS += js(f'ctl.fromTo("#{wid} .ch", {KEY_C if c["key"] else SOFT_C}, {w["t"]:.3f});')
        elif mode == "words":
            CJS += js(f'ctl.fromTo("#{wid}", {KEY_W if c["key"] else SOFT_W}, {w["t"]:.3f});')
    if mode == "line":
        CJS += js(f'ctl.fromTo("#cap-{i} .line", {KEY_W if c["key"] else SOFT_L}, {c["start"]:.3f});')
    clips.append(f'        <div id="cap-{i}" class="{"cap key" if c["key"] else "cap"} clip" data-start="{c["start"]:.3f}" data-duration="{d}" data-track-index="1"><div class="line">{spans}</div></div>')

captions = f"""<!doctype html>
<html lang="es"><head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <style>{FONTS}
        #captions-root {{ position: absolute; inset: 0; }}
        #captions-root .cap {{ position: absolute; left: 160px; right: 300px; top: 2520px; height: 520px; display: flex; align-items: center; justify-content: center; text-align: center; }}
        #captions-root .ch {{ display: inline-block; }}
        #captions-root .line {{ display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 0 34px; max-width: 100%; }}
        #captions-root .w {{ display: inline-block; font-family: "SF Compact Display", "Rajdhani", sans-serif; font-weight: 500; font-size: 120px; line-height: 1.08; letter-spacing: -.005em; color: #fff;
              text-shadow: 0 6px 26px rgba(9,4,15,.75), 0 2px 4px rgba(9,4,15,.9); }}
        #captions-root .key .w {{ font-family: "Anton", sans-serif; font-weight: 400; font-size: 330px; line-height: .95; text-transform: uppercase; color: #f2c84b;
              text-shadow: 0 0 70px rgba(242,200,75,.55), 0 12px 34px rgba(9,4,15,.8); }}
        #captions-root .key .line {{ gap: 0 48px; }}
      </style>
      <div id="captions-root" data-composition-id="captions" data-width="2160" data-height="3840" data-duration="{DUR}">
{NL.join(clips)}
      </div>
      <script>
{SPRING}        const ctl = gsap.timeline({{ paused: true }});
{CJS}        window.__timelines["captions"] = ctl;
      </script>
    </template>
  </body>
</html>
"""
open("reel/compositions/captions.html", "w", encoding="utf-8", newline="\n").write(captions)

# ───────────────────────── Gráficos de cristal líquido ─────────────────────────
G = []


def card(id_, s, e, inner, cls="g"):
    G.append((id_, s, e, f'        <div id="{id_}" class="{cls} clip" data-start="{s:.3f}" data-duration="{e - s:.3f}" data-track-index="1"><div class="in">{inner}</div></div>'))


card("g-model", 2.38, 4.62, f'<div class="glass pill"><span class="sweep"></span>{spark("ic")}<div class="pill-txt"><b>Claude</b><span class="gold-t">Opus 5.5</span></div><span class="ok">✓</span></div>')
card("g-term", 6.05, 9.72, f'<span id="term-badge" class="badge">{mascot("badge-ic")}</span><div id="g-term-win" class="glass term"><span class="sweep"></span>'
     f'<div class="term-bar"><i></i><i></i><i></i>{mascot("ic-s")}<b>Claude Code</b><span class="chip">Opus 5.5</span></div>'
     '<div class="term-body"><div class="tl"><span class="pr">&gt;</span> <span id="term-typed" class="typed"></span><span class="caret">▌</span></div>'
     '<div id="term-d1" class="tl"><span class="ck">✓</span> silencios · falsas tomas</div>'
     '<div id="term-d2" class="tl"><span class="ck">✓</span> subtítulos · motion graphics</div></div></div>')
card("g-apps", 10.30, 11.40, '<div class="apps">'
     '<div id="app0" class="glass app"><img src="assets/logos/premiere.webp" alt=""><span id="x0" class="x"></span></div>'
     '<div id="app1" class="glass app"><img src="assets/logos/aftereffects.webp" alt=""><span id="x1" class="x"></span></div>'
     '<div id="app2" class="glass app"><img src="assets/logos/capcut.png" alt=""><span id="x2" class="x"></span></div></div>')

# Escena a pantalla completa: «Así edita Claude Code» — 4 pasos y la mascota saltando de uno a otro en su palabra.
STEPS = [("Quitar silencios", 12.80, "wave"), ("Quitar falsas tomas", 13.78, "takes"), ("Agregar subtítulos", 14.96, "subs"), ("Motion graphics", 16.20, "mg")]
NODE_Y = [1080, 1550, 2020, 2490]
HEIGHTS = [40, 70, 95, 60, 80, 8, 8, 55, 90, 70, 45, 85, 8, 8, 65, 95, 50, 75]
mini = {
    "wave": '<div class="mini wave">' + "".join(
        f'<i class="{"gap" if k in (5, 6, 12, 13) else "bar"}" style="height:{HEIGHTS[k]}%"></i>' for k in range(18)) + '</div>',
    "takes": '<div class="mini takes"><span id="take-bad" class="take bad">TOMA 1 <b>✕</b></span><span id="take-good" class="take good">TOMA 2 <b>✓</b></span></div>',
    "subs": '<div class="mini subs"><span id="sub0">Tres</span><span id="sub1" class="kw">GRATIS</span><span id="sub2">ya</span></div>',
    "mg": f'<div class="mini mg"><span id="mg-card" class="mg-card">{spark("mg-ic")}</span><span id="ring0" class="ring"></span><span id="ring1" class="ring"></span></div>',
}
nodes = ""
for k, (label, t, kind) in enumerate(STEPS):
    nodes += (f'<div id="node{k}" class="node" style="top:{NODE_Y[k] - 180}px"><span id="ndot{k}" class="ndot"></span>'
              f'<div id="ncard{k}" class="glass ncard"><span class="nnum">0{k + 1}</span><span class="nlabel">{label}</span>{mini[kind]}'
              f'<span id="ncheck{k}" class="ncheck">✓</span></div></div>')
card("g-fs", FS_IN, FS_OUT,
     '<div id="fs-panel" class="fs-panel">'
     '<div class="fs-bg"><span id="orb1" class="orb o1"></span><span id="orb2" class="orb o2"></span><span id="orb3" class="orb o3"></span><span class="fs-grid"></span><span class="fs-vign"></span><span class="fs-grain"></span></div>'
     f'<div id="fs-head" class="fs-head"><span class="fs-kicker">ASÍ EDITA</span><div class="fs-title">{mascot("fs-logo")}<span>CLAUDE CODE</span></div></div>'
     f'<span id="fs-rail" class="fs-rail"></span><span id="fs-rail-fill" class="fs-rail-fill"></span>{nodes}'
     f'<span id="fs-mascot" class="fs-mascot">{mascot("fs-m", "fs-m")}</span>'
     '<div id="fs-auto" class="fs-auto"><span>TODO</span> AUTOMÁTICO</div>'
     '</div>', cls="fs")

card("g-chat", 21.15, 23.95, '<div class="glass chat"><span class="sweep"></span>'
     '<div id="chat-me" class="bubble me">Adelanta el gráfico 3 fotogramas</div>'
     f'<div id="chat-cl" class="cl-row">{spark("ic-av")}<div id="chat-bub" class="bubble cl"><span id="chat-dots" class="dots"><i id="cdot0"></i><i id="cdot1"></i><i id="cdot2"></i></span><span id="chat-done" class="done-t">✓ Hecho</span></div></div></div>')
card("g-guide", 25.55, 31.10, '<div id="guide-card" class="glass guide"><div class="browser"><i></i><i></i><i></i><span>Reels paso a paso · Viegas Estudio</span></div>'
     '<img id="guide-img" src="assets/guia-portada-crop.png" alt=""><span id="chip1" class="gchip c1">12 PROMPTS</span><span id="chip2" class="gchip c2">SKILLS</span></div>')
card("g-pack", 31.95, 35.07, '<div class="glass pack"><span class="sweep"></span><div class="list-h"><span>TE ENVÍO</span></div>'
     '<div id="p0" class="prow"><span class="ck">✓</span>Tutorial completo</div><div id="p1" class="prow"><span class="ck">✓</span>Skills</div><div id="p2" class="prow"><span class="ck">✓</span>Prompts</div></div>')
card("g-cta", 35.07, DUR, f'<div class="cta"><span id="cta-mascot" class="cta-mascot">{mascot("cta-m", "cta-m")}</span><div id="cta-box" class="glass cbox"><img class="av" src="assets/avatar.jpg" alt=""><span class="ctext"><span id="cta-ph" class="ph">Añade un comentario…</span>'
     '<span id="cta-typed"></span><span class="caret2">▌</span></span><span id="cta-send" class="send">➤</span></div><div id="cta-arrow" class="arrow">↓</div></div>')

GJS = ""
for gid, gs, ge, ghtml in G:
    if gid == "g-fs":
        continue
    GJS += js(f'gtl.fromTo("#{gid} > .in", {{ opacity: 0, y: 110, scale: .92, filter: "blur(24px)" }}, {{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", {IN} }}, {gs});')
    if ge < DUR - 0.05:
        GJS += js(f'gtl.to("#{gid} > .in", {{ opacity: 0, y: -50, scale: .96, filter: "blur(16px)", duration: 0.22, ease: "power2.in" }}, {ge - 0.22:.2f});')
    if 'class="sweep"' in ghtml:
        GJS += js(f'gtl.fromTo("#{gid} .sweep", {{ x: -300 }}, {{ x: 2100, duration: 0.9, ease: "power2.inOut" }}, {gs + 0.3:.2f});')
# 1 · check del modelo
GJS += js(f'gtl.fromTo("#g-model .ok", {{ scale: 0 }}, {{ scale: 1, {IN_SOFT} }}, 3.20);')
# 2 · terminal
GJS += js('gtl.call(() => { document.getElementById("term-typed").textContent = ""; }, null, 6.06);')
for n in range(1, len("edita este reel") + 1):
    GJS += js(f'gtl.call(() => {{ document.getElementById("term-typed").textContent = "{"edita este reel"[:n]}"; }}, null, {6.25 + n * 0.05:.2f});')
for k, t in [(1, 7.40), (2, 8.05)]:
    GJS += js(f'gtl.fromTo("#term-d{k}", {{ opacity: 0, x: -50 }}, {{ opacity: 1, x: 0, {IN} }}, {t});')
GJS += js('gtl.set("#term-badge", { opacity: 0 }, 6.05);')
GJS += js(f'gtl.fromTo("#term-badge", {{ opacity: 0, scale: 0.3, rotation: -25, y: 60 }}, {{ opacity: 1, scale: 1, rotation: 0, y: 0, {IN_SOFT} }}, 8.45);')
GJS += js('gtl.fromTo("#g-term-win", { boxShadow: "0 0 0px 0px rgba(217,119,87,0)" }, { boxShadow: "0 0 140px 10px rgba(217,119,87,.55)", duration: 0.4, ease: "power2.out" }, 8.45);')
# 3 · editores
for k in range(3):
    GJS += js(f'gtl.fromTo("#app{k}", {{ y: 80, opacity: 0 }}, {{ y: 0, opacity: 1, {IN} }}, {10.30 + k * 0.06:.2f});')
    GJS += js(f'gtl.fromTo("#x{k}", {{ "--k": 0 }}, {{ "--k": 1, duration: 0.24, ease: "power3.out" }}, {10.50 + k * 0.07:.2f});')
# 4 · escena a pantalla completa
GJS += js(f'gtl.fromTo("#fs-panel", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.12, ease: "none" }}, {FS_IN});')
GJS += js(f'gtl.fromTo("#fs-panel", {{ clipPath: "inset(46% 8% 40% 8% round 120px)" }}, {{ clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.1, ease: VB(0.03, 0.34) }}, {FS_IN});')
GJS += js(f'gtl.fromTo("#fs-head", {{ opacity: 0, y: 80 }}, {{ opacity: 1, y: 0, {IN} }}, {FS_IN + 0.15:.2f});')
GJS += js(f'gtl.fromTo("#fs-rail", {{ scaleY: 0 }}, {{ scaleY: 1, duration: 0.8, ease: "power3.inOut" }}, {FS_IN + 0.2:.2f});')
GJS += js('gtl.fromTo("#orb1", { x: -120, y: 0 }, { x: 260, y: 220, duration: 7.4, ease: "sine.inOut" }, 11.4);')
GJS += js('gtl.fromTo("#orb2", { x: 160, y: 0 }, { x: -220, y: -260, duration: 7.4, ease: "sine.inOut" }, 11.4);')
GJS += js('gtl.fromTo("#orb3", { scale: 1 }, { scale: 1.25, duration: 7.4, ease: "sine.inOut" }, 11.4);')
for k, (label, t, kind) in enumerate(STEPS):
    GJS += js(f'gtl.fromTo("#node{k}", {{ opacity: 0, x: 120 }}, {{ opacity: .38, x: 0, {IN} }}, {FS_IN + 0.3 + k * 0.1:.2f});')
    GJS += js(f'gtl.to("#node{k}", {{ opacity: 1, duration: 0.15 }}, {t - 0.15:.2f});')
    GJS += js(f'gtl.fromTo("#ncard{k}", {{ scale: .94 }}, {{ scale: 1, {IN} }}, {t - 0.15:.2f});')
    GJS += js(f'gtl.to("#ncard{k}", {{ borderColor: "rgba(242,200,75,.85)", boxShadow: "0 0 90px -10px rgba(242,200,75,.55), inset 0 3px 0 rgba(255,255,255,.16)", duration: 0.2 }}, {t - 0.1:.2f});')
    GJS += js(f'gtl.to("#ndot{k}", {{ background: "#f2c84b", boxShadow: "0 0 50px rgba(242,200,75,.9)", duration: 0.2 }}, {t:.2f});')
    GJS += js(f'gtl.fromTo("#ncheck{k}", {{ scale: 0, opacity: 0 }}, {{ scale: 1, opacity: 1, {IN_SOFT} }}, {t + 0.35:.2f});')
    if k < 3:
        GJS += js(f'gtl.to("#ncard{k}", {{ borderColor: "rgba(37,211,102,.55)", boxShadow: "0 0 0 0 rgba(0,0,0,0), inset 0 3px 0 rgba(255,255,255,.16)", duration: 0.3 }}, {STEPS[k + 1][1] - 0.2:.2f});')
GJS += js('gtl.to("#node0 .gap", { scaleY: 0, opacity: 0, duration: 0.45, ease: "power3.inOut", stagger: 0.05 }, 12.85);')
GJS += js('gtl.to("#take-bad", { opacity: .3, duration: 0.25 }, 13.80);')
GJS += js(f'gtl.fromTo("#take-good", {{ scale: .8 }}, {{ scale: 1, {IN} }}, 13.95);')
for k in range(3):
    GJS += js(f'gtl.fromTo("#sub{k}", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, {IN} }}, {14.90 + k * 0.14:.2f});')
GJS += js(f'gtl.fromTo("#mg-card", {{ scale: 0.3, rotation: -30 }}, {{ scale: 1, rotation: 0, {IN_SOFT} }}, 16.15);')
for k in range(2):
    GJS += js(f'gtl.fromTo("#ring{k}", {{ scale: 0.4, opacity: .9 }}, {{ scale: 1.6, opacity: 0, duration: 0.9, ease: "power2.out" }}, {16.25 + k * 0.15:.2f});')
# la mascota: cae en el paso 1 y salta al siguiente en cada palabra (con aplastamiento al aterrizar)
GJS += js(f'gtl.set("#fs-mascot", {{ y: {NODE_Y[0] - 900}, opacity: 0 }}, 11.4);')
GJS += js('gtl.to("#fs-mascot", { opacity: 1, duration: 0.1 }, 12.25);')
GJS += js(f'gtl.to("#fs-mascot", {{ y: {NODE_Y[0]}, duration: 1.15, ease: VB(0.05, 0.35) }}, 12.25);')
for k in range(1, 4):
    t = STEPS[k][1]
    GJS += js(f'gtl.to("#fs-mascot", {{ y: {NODE_Y[k]}, duration: 1.12, ease: VB(0.04, 0.32) }}, {t - 0.32:.2f});')
    GJS += js(f'gtl.to("#fs-m", {{ scaleY: 1.18, scaleX: .86, duration: 0.14, ease: "power2.out" }}, {t - 0.32:.2f});')
    GJS += js(f'gtl.to("#fs-m", {{ scaleY: 1, scaleX: 1, duration: 0.92, ease: VB(0.12, 0.12) }}, {t - 0.04:.2f});')
    GJS += js(f'gtl.fromTo("#fs-rail-fill", {{ scaleY: {(k - 1) / 3:.3f} }}, {{ scaleY: {k / 3:.3f}, duration: 0.45, ease: "power3.inOut" }}, {t - 0.3:.2f});')
GJS += js(f'gtl.fromTo("#fs-auto", {{ opacity: 0, scale: .6, y: 60 }}, {{ opacity: 1, scale: 1, y: 0, {IN_SOFT} }}, 16.85);')
GJS += js('gtl.fromTo("#fs-m", { rotation: 0 }, { rotation: 10, duration: 0.18, yoyo: true, repeat: 5, ease: "sine.inOut" }, 17.2);')
GJS += js(f'gtl.to("#fs-panel", {{ clipPath: "inset(30% 8% 30% 8% round 140px)", opacity: 0, scale: .94, duration: 0.42, ease: "power3.in" }}, {FS_OUT - 0.42:.2f});')
# 5 · chat
GJS += js(f'gtl.fromTo("#chat-me", {{ opacity: 0, y: 50, scale: .9 }}, {{ opacity: 1, y: 0, scale: 1, {IN} }}, 21.62);')
GJS += js('gtl.fromTo("#chat-cl", { opacity: 0 }, { opacity: 1, duration: 0.2 }, 22.30);')
for k in range(3):
    GJS += js(f'gtl.fromTo("#cdot{k}", {{ y: 0 }}, {{ y: -18, duration: 0.18, yoyo: true, repeat: 3, ease: "sine.inOut" }}, {22.35 + k * 0.08:.2f});')
GJS += js('gtl.to("#chat-dots", { opacity: 0, duration: 0.1 }, 23.00);')
GJS += js('gtl.to("#chat-bub", { minWidth: 460, duration: 0.25, ease: "power3.out" }, 23.0);')
GJS += js(f'gtl.fromTo("#chat-done", {{ opacity: 0, scale: 1.4 }}, {{ opacity: 1, scale: 1, {IN} }}, 23.05);')
# 6 · guía
GJS += js('gtl.fromTo("#guide-card", { rotationX: 22, transformPerspective: 2400 }, { rotationX: 0, duration: 1.1, ease: VB(0.08) }, 25.55);')
GJS += js(f'gtl.fromTo("#chip1", {{ opacity: 0, scale: .4 }}, {{ opacity: 1, scale: 1, {IN_SOFT} }}, 27.63);')
GJS += js(f'gtl.fromTo("#chip2", {{ opacity: 0, scale: .4 }}, {{ opacity: 1, scale: 1, {IN_SOFT} }}, 28.37);')
GJS += js('gtl.fromTo("#guide-img", { y: 0 }, { y: -24, duration: 5, ease: "sine.inOut" }, 25.9);')
# 7 · te envío
for k, t in [(0, 32.21), (1, 33.49), (2, 34.25)]:
    GJS += js(f'gtl.fromTo("#p{k}", {{ opacity: 0, x: -70 }}, {{ opacity: 1, x: 0, {IN} }}, {t});')
# 8 · comentario + mascota que llega saltando
GJS += js('gtl.to("#cta-ph", { opacity: 0, duration: 0.1 }, 35.62);')
GJS += js('gtl.call(() => { document.getElementById("cta-typed").textContent = ""; }, null, 35.08);')
for n in range(1, len("Claude") + 1):
    GJS += js(f'gtl.call(() => {{ document.getElementById("cta-typed").textContent = "{"Claude"[:n]}"; }}, null, {35.65 + n * 0.07:.2f});')
GJS += js('gtl.fromTo("#cta-arrow", { y: 0 }, { y: 44, duration: 0.4, yoyo: true, repeat: 5, ease: "sine.inOut" }, 35.5);')
GJS += js('gtl.fromTo("#cta-mascot", { x: 900, y: -500, opacity: 0, rotation: 30 }, { x: 0, y: 0, opacity: 1, rotation: 0, duration: 1.15, ease: VB(0.05, 0.35) }, 36.0);')
GJS += js('gtl.fromTo("#cta-m", { y: 0 }, { y: -60, duration: 0.22, yoyo: true, repeat: 3, ease: "power2.out" }, 37.2);')
GJS += js('gtl.fromTo("#cta-send", { scale: 1 }, { scale: 1.35, duration: 0.15, yoyo: true, repeat: 1 }, 37.5);')

graphics = f"""<!doctype html>
<html lang="es"><head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <style>{FONTS}
        #gfx-root {{ position: absolute; inset: 0; font-family: "Rajdhani", sans-serif; color: #eef1ff; }}
        #gfx-root .g {{ position: absolute; left: 0; right: 0; top: 2130px; display: flex; justify-content: center; }}
        #gfx-root .fs {{ position: absolute; inset: 0; }}
        #gfx-root .in {{ display: block; }}
        #g-fs > .in {{ position: absolute; inset: 0; }}
        #gfx-root .glass {{ position: relative; overflow: hidden; border-radius: 64px;
              background: linear-gradient(160deg, rgba(42,26,69,.52), rgba(21,10,36,.58));
              border: 3px solid rgba(168,85,247,.38);
              backdrop-filter: blur(46px) saturate(1.45); -webkit-backdrop-filter: blur(46px) saturate(1.45);
              box-shadow: 0 70px 150px -50px rgba(0,0,0,.8), inset 0 3px 0 rgba(255,255,255,.16), 0 0 80px -20px rgba(124,58,237,.55); }}
        #gfx-root .glass::before {{ content: ""; position: absolute; top: 0; left: 12%; right: 12%; height: 3px;
              background: linear-gradient(90deg, transparent, rgba(220,190,255,.9), transparent); }}
        #gfx-root .sweep {{ position: absolute; top: -10%; bottom: -10%; left: 0; width: 220px; transform: skewX(-18deg);
              background: linear-gradient(100deg, transparent, rgba(255,236,178,.22), transparent); pointer-events: none; }}
        #gfx-root .gold-t {{ color: #f2c84b; }}
        #gfx-root .pill {{ display: flex; align-items: center; gap: 36px; padding: 30px 60px 30px 44px; }}
        #gfx-root .ic {{ width: 150px; height: 150px; filter: drop-shadow(0 0 40px rgba(217,119,87,.7)); }}
        #gfx-root .pill-txt {{ display: flex; flex-direction: column; line-height: .95; }}
        #gfx-root .pill-txt b {{ font-size: 116px; font-weight: 700; color: #fff; }}
        #gfx-root .pill-txt span {{ font-family: "Anton", sans-serif; font-size: 130px; letter-spacing: .02em; }}
        #gfx-root .ok {{ width: 104px; height: 104px; border-radius: 50%; display: grid; place-items: center; font-size: 80px; font-weight: 700;
              color: #03200f; background: linear-gradient(135deg, #1a9e4f, #25d366); box-shadow: 0 0 50px rgba(37,211,102,.6); margin-left: 20px; }}
        #g-term > .in {{ position: relative; }}
        #gfx-root .badge {{ position: absolute; right: 30px; top: -170px; width: 300px; height: 300px; border-radius: 76px; display: grid; place-items: center; z-index: 2;
              background: linear-gradient(160deg, rgba(70,40,30,.75), rgba(21,10,36,.8)); border: 4px solid rgba(217,119,87,.7);
              backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); box-shadow: 0 0 120px rgba(217,119,87,.6), inset 0 3px 0 rgba(255,255,255,.18); }}
        #gfx-root .badge-ic {{ width: 220px; height: 220px; filter: drop-shadow(0 0 40px rgba(217,119,87,.9)); }}
        #gfx-root .term {{ width: 1640px; border-color: rgba(217,119,87,.55); }}
        #gfx-root .term-bar {{ display: flex; align-items: center; gap: 20px; padding: 22px 40px; border-bottom: 3px solid rgba(255,255,255,.08); background: rgba(9,4,15,.35); }}
        #gfx-root .term-bar i {{ width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,.22); }}
        #gfx-root .ic-s {{ width: 84px; height: 84px; margin-left: 14px; filter: drop-shadow(0 0 20px rgba(217,119,87,.6)); }}
        #gfx-root .term-bar b {{ font-family: "Cascadia Mono", monospace; font-weight: 400; font-size: 58px; color: #fff; }}
        #gfx-root .chip {{ margin-left: auto; font-family: "Cascadia Mono", monospace; font-size: 40px; color: #f2c84b; padding: 10px 26px; border-radius: 999px;
              border: 3px solid rgba(242,200,75,.6); background: rgba(242,200,75,.1); }}
        #gfx-root .term-body {{ padding: 24px 50px 32px; font-family: "Cascadia Mono", monospace; font-size: 62px; line-height: 1.36; color: #eef1ff; }}
        #gfx-root .pr, #gfx-root .caret {{ color: #d97757; }}
        #gfx-root .ck {{ color: #25d366; }}
        #gfx-root .apps {{ display: flex; gap: 70px; }}
        #gfx-root .app {{ width: 300px; height: 300px; display: grid; place-items: center; border-radius: 64px; }}
        #gfx-root .app img {{ width: 190px; height: 190px; object-fit: contain; }}
        #gfx-root .x {{ position: absolute; inset: 0; }}
        #gfx-root .x::before, #gfx-root .x::after {{ content: ""; position: absolute; left: 50%; top: 50%; width: 350px; height: 24px; border-radius: 12px;
              background: #ff5470; box-shadow: 0 0 40px rgba(255,84,112,.8); transform-origin: center; }}
        #gfx-root .x::before {{ transform: translate(-50%,-50%) rotate(45deg) scaleX(var(--k,0)); }}
        #gfx-root .x::after {{ transform: translate(-50%,-50%) rotate(-45deg) scaleX(var(--k,0)); }}

        /* Escena a pantalla completa: fondo limpio, degradados que se mueven, cuadrícula sutil, viñeta y grano */
        #gfx-root .fs-panel {{ position: absolute; inset: 0; overflow: hidden; background: #09040f; transform-origin: 50% 50%; }}
        #gfx-root .fs-bg {{ position: absolute; inset: 0; }}
        #gfx-root .orb {{ position: absolute; border-radius: 50%; display: block; }}
        #gfx-root .o1 {{ width: 2600px; height: 2200px; left: -1100px; top: -500px; background: radial-gradient(circle, rgba(28,50,118,.75), transparent 64%); }}
        #gfx-root .o2 {{ width: 2500px; height: 2300px; right: -1100px; top: 800px; background: radial-gradient(circle, rgba(172,114,244,.5), transparent 64%); }}
        #gfx-root .o3 {{ width: 2200px; height: 1500px; left: 0; bottom: -700px; background: radial-gradient(circle, rgba(242,200,75,.14), transparent 70%); }}
        #gfx-root .fs-grid {{ position: absolute; inset: 0; display: block;
              background-image: linear-gradient(rgba(168,85,247,.09) 2px, transparent 2px), linear-gradient(90deg, rgba(168,85,247,.09) 2px, transparent 2px); background-size: 120px 120px;
              -webkit-mask-image: radial-gradient(ellipse 85% 70% at 50% 45%, #000 35%, transparent 100%); mask-image: radial-gradient(ellipse 85% 70% at 50% 45%, #000 35%, transparent 100%); }}
        #gfx-root .fs-vign {{ position: absolute; inset: 0; display: block; background: radial-gradient(140% 110% at 50% 0%, transparent 45%, rgba(4,2,10,.9) 100%); }}
        #gfx-root .fs-grain {{ position: absolute; inset: 0; display: block; opacity: .05; background-size: 400px;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }}
        #gfx-root .fs-head {{ position: absolute; left: 180px; right: 300px; top: 470px; display: flex; flex-direction: column; gap: 10px; }}
        #gfx-root .fs-kicker {{ font-family: "Cascadia Mono", monospace; font-size: 64px; letter-spacing: .3em; color: #c084fc; }}
        #gfx-root .fs-title {{ display: flex; align-items: center; gap: 40px; font-family: "Anton", sans-serif; font-size: 250px; line-height: .9; color: #fff; }}
        #gfx-root .fs-title span {{ background: linear-gradient(180deg, #fff 30%, #d7c5f5 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }}
        #gfx-root .fs-logo {{ width: 240px; height: 240px; flex: none; filter: drop-shadow(0 0 50px rgba(217,119,87,.8)); }}
        #gfx-root .fs-rail {{ position: absolute; left: 330px; top: {NODE_Y[0]}px; height: {NODE_Y[3] - NODE_Y[0]}px; width: 8px; border-radius: 4px; background: rgba(168,85,247,.28); transform-origin: top; display: block; }}
        #gfx-root .fs-rail-fill {{ position: absolute; left: 330px; top: {NODE_Y[0]}px; height: {NODE_Y[3] - NODE_Y[0]}px; width: 8px; border-radius: 4px; background: linear-gradient(180deg, #c084fc, #f2c84b);
              box-shadow: 0 0 30px rgba(242,200,75,.7); transform-origin: top; transform: scaleY(0); display: block; }}
        #gfx-root .node {{ position: absolute; left: 0; right: 0; height: 360px; opacity: 0; }}
        #gfx-root .ndot {{ position: absolute; left: 310px; top: 156px; width: 48px; height: 48px; border-radius: 50%; background: #2a1d45; border: 6px solid #c084fc; display: block; }}
        #gfx-root .ncard {{ position: absolute; left: 470px; right: 280px; top: 0; height: 380px; display: flex; align-items: center; gap: 40px; padding: 0 60px; border-radius: 56px; overflow: visible; }}
        #gfx-root .nnum {{ font-family: "Anton", sans-serif; font-size: 140px; color: #f2c84b; line-height: 1; }}
        #gfx-root .nlabel {{ font-size: 120px; font-weight: 700; color: #fff; line-height: .95; width: 520px; }}
        #gfx-root .mini {{ margin-left: auto; width: 340px; height: 220px; display: flex; align-items: center; justify-content: center; position: relative; }}
        #gfx-root .wave {{ gap: 6px; }}
        #gfx-root .wave i {{ width: 10px; border-radius: 5px; background: linear-gradient(180deg, #dcc8ff, #a855f7); display: block; }}
        #gfx-root .wave i.gap {{ background: #ff5470; }}
        #gfx-root .takes {{ flex-direction: column; gap: 20px; }}
        #gfx-root .take {{ font-family: "Cascadia Mono", monospace; font-size: 54px; padding: 12px 26px; border-radius: 18px; white-space: nowrap; display: block; }}
        #gfx-root .take.bad {{ background: rgba(255,84,112,.18); border: 3px solid rgba(255,84,112,.6); color: #ff8fa3; }}
        #gfx-root .take.good {{ background: rgba(37,211,102,.16); border: 3px solid rgba(37,211,102,.6); color: #7dffa9; }}
        #gfx-root .subs {{ gap: 16px; flex-wrap: wrap; }}
        #gfx-root .subs span {{ font-size: 66px; font-weight: 700; color: #fff; display: block; }}
        #gfx-root .subs .kw {{ font-family: "Anton", sans-serif; font-size: 96px; color: #f2c84b; font-weight: 400; }}
        #gfx-root .mg-card {{ width: 160px; height: 160px; border-radius: 40px; display: grid; place-items: center; background: linear-gradient(160deg, rgba(70,52,20,.7), rgba(24,14,30,.85)); border: 3px solid rgba(242,200,75,.7); position: relative; z-index: 1; }}
        #gfx-root .mg-ic {{ width: 110px; height: 110px; }}
        #gfx-root .ring {{ position: absolute; left: 50%; top: 50%; width: 200px; height: 200px; margin: -100px 0 0 -100px; border-radius: 50%; border: 5px solid #f2c84b; display: block; opacity: 0; }}
        #gfx-root .ncheck {{ position: absolute; right: -40px; top: -40px; width: 120px; height: 120px; border-radius: 50%; display: grid; place-items: center; font-size: 76px; font-weight: 700;
              color: #03200f; background: linear-gradient(135deg, #1a9e4f, #25d366); box-shadow: 0 0 50px rgba(37,211,102,.7); opacity: 0; }}
        #gfx-root .fs-mascot {{ position: absolute; left: 214px; top: -140px; width: 240px; height: 240px; display: block; z-index: 3; }}
        #gfx-root .fs-m {{ width: 240px; height: 240px; display: block; transform-origin: 50% 100%; filter: drop-shadow(0 0 40px rgba(217,119,87,.9)) drop-shadow(0 20px 30px rgba(0,0,0,.6)); }}
        #gfx-root .fs-auto {{ position: absolute; left: 0; right: 280px; top: 2800px; margin: 0 auto; width: max-content; font-family: "Anton", sans-serif; font-size: 200px; letter-spacing: .02em;
              padding: 20px 80px; border-radius: 999px; color: #2a1a00; background: linear-gradient(135deg, #d9a828, #f2c84b); box-shadow: 0 0 120px rgba(242,200,75,.6), 0 40px 80px -30px rgba(0,0,0,.8); }}
        #gfx-root .fs-auto span {{ color: #fff; text-shadow: 0 4px 0 rgba(42,26,0,.35); }}

        #gfx-root .chat {{ width: 1560px; padding: 30px 44px; display: flex; flex-direction: column; gap: 20px; }}
        #gfx-root .bubble {{ font-size: 76px; font-weight: 700; line-height: 1.12; padding: 20px 38px; border-radius: 54px; }}
        #gfx-root .bubble.me {{ align-self: flex-end; color: #fff; background: linear-gradient(135deg, #7c3aed, #a855f7); border-bottom-right-radius: 14px; box-shadow: 0 20px 50px -20px rgba(124,58,237,.8); }}
        #gfx-root .cl-row {{ display: flex; align-items: center; gap: 26px; }}
        #gfx-root .ic-av {{ width: 110px; height: 110px; filter: drop-shadow(0 0 24px rgba(217,119,87,.6)); }}
        #gfx-root .bubble.cl {{ position: relative; background: rgba(42,26,69,.9); border: 3px solid rgba(168,85,247,.35); border-bottom-left-radius: 14px; min-width: 220px; min-height: 124px; display: flex; align-items: center; }}
        #gfx-root .dots {{ display: flex; gap: 18px; }}
        #gfx-root .dots i {{ width: 26px; height: 26px; border-radius: 50%; background: #c084fc; display: block; }}
        #gfx-root .done-t {{ position: absolute; left: 38px; top: 20px; color: #f2c84b; white-space: nowrap; opacity: 0; }}
        #gfx-root .guide {{ width: 1400px; border-radius: 44px; }}
        #gfx-root .browser {{ display: flex; align-items: center; gap: 18px; padding: 22px 36px; background: rgba(9,4,15,.6); font-family: "Cascadia Mono", monospace; font-size: 36px; color: #b8a8d0; }}
        #gfx-root .browser i {{ width: 22px; height: 22px; border-radius: 50%; background: rgba(255,255,255,.25); }}
        #gfx-root .browser span {{ margin-left: 20px; }}
        #gfx-root .guide img {{ display: block; width: 100%; height: auto; }}
        #gfx-root .gchip {{ position: absolute; font-family: "Anton", sans-serif; font-size: 110px; letter-spacing: .03em; color: #2a1a00; padding: 16px 50px; border-radius: 999px;
              background: linear-gradient(135deg, #d9a828, #f2c84b); box-shadow: 0 0 60px rgba(242,200,75,.6), 0 30px 60px -20px rgba(0,0,0,.7); }}
        #gfx-root .gchip.c1 {{ right: 60px; bottom: 210px; }}
        #gfx-root .gchip.c2 {{ right: 60px; bottom: 60px; background: linear-gradient(135deg, #7c3aed, #c084fc); color: #fff; box-shadow: 0 0 60px rgba(168,85,247,.7); }}
        #gfx-root .pack {{ width: 1560px; padding: 34px 60px 40px; }}
        #gfx-root .list-h {{ display: flex; align-items: center; gap: 20px; font-family: "Cascadia Mono", monospace; font-size: 46px; letter-spacing: .18em; color: #f2c84b; margin-bottom: 14px; }}
        #gfx-root .prow {{ display: flex; align-items: center; gap: 30px; font-size: 86px; font-weight: 700; color: #fff; padding: 8px 0; opacity: 0; }}
        #gfx-root .prow .ck {{ width: 86px; height: 86px; border-radius: 50%; display: grid; place-items: center; font-size: 64px; color: #03200f; background: linear-gradient(135deg, #1a9e4f, #25d366); }}
        #g-cta {{ top: 2560px; }}
        #gfx-root .cta {{ display: flex; flex-direction: column; align-items: center; gap: 30px; position: relative; }}
        #gfx-root .cta-mascot {{ position: absolute; right: 120px; top: -230px; width: 250px; height: 250px; display: block; z-index: 2; }}
        #gfx-root .cta-m {{ width: 250px; height: 250px; display: block; filter: drop-shadow(0 0 40px rgba(217,119,87,.9)) drop-shadow(0 20px 30px rgba(0,0,0,.6)); }}
        #gfx-root .cbox {{ width: 1780px; height: 230px; border-radius: 999px; display: flex; align-items: center; gap: 40px; padding: 0 44px; border-color: rgba(242,200,75,.6); box-shadow: 0 0 90px -10px rgba(242,200,75,.45), 0 70px 150px -50px rgba(0,0,0,.8); }}
        #gfx-root .av {{ width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 5px solid #f2c84b; }}
        #gfx-root .ctext {{ flex: 1; position: relative; font-size: 104px; font-weight: 700; color: #fff; white-space: nowrap; }}
        #gfx-root .ph {{ position: absolute; left: 0; top: 50%; transform: translateY(-50%); color: rgba(238,241,255,.45); font-weight: 600; }}
        #gfx-root .caret2 {{ color: #f2c84b; }}
        #gfx-root .send {{ font-size: 100px; color: #f2c84b; display: block; }}
        #gfx-root .arrow {{ font-family: "Anton", sans-serif; font-size: 220px; line-height: 1; color: #f2c84b; text-shadow: 0 0 60px rgba(242,200,75,.7); display: block; }}
      </style>
      <div id="gfx-root" data-composition-id="graphics" data-width="2160" data-height="3840" data-duration="{DUR}">
{NL.join(x[3] for x in G)}
      </div>
      <script>
{SPRING}        const gtl = gsap.timeline({{ paused: true }});
{GJS}        window.__timelines["graphics"] = gtl;
      </script>
    </template>
  </body>
</html>
"""
open("reel/compositions/graphics.html", "w", encoding="utf-8", newline="\n").write(graphics)


# ───────────────────────── index.html según el modo ─────────────────────────
def host(cid, src, track, kind=""):
    return (f'      <div id="{cid}-host" class="layer" data-composition-id="{cid}" data-composition-src="compositions/{src}"{kind} '
            f'data-start="0" data-duration="{DUR}" data-track-index="{track}" data-width="2160" data-height="3840"></div>')


if MODE == "behind":
    body, bg, mjs = host("behind", "behind.html", 1), "transparent", ""
else:
    body = (f'      <div id="zoom"><video id="base" class="clip" src="assets/base.mp4" playsinline data-has-audio="true" data-start="0" data-duration="{DUR}" data-track-index="0"></video></div>' + NL
            + host("graphics", "graphics.html", 2) + NL + host("captions", "captions.html", 3, ' data-track-kind="captions"'))
    bg = "#09040f"
    # Zooms suaves, nunca cortes: se acerca con curva de velocidad hacia la idea y se aleja después (máx. ~7-10 %).
    Z = [
        ('{ scale: 1.08 }', '{ scale: 1, duration: 1.6, ease: "power3.out" }', 0.0),
        ('{ scale: 1 }', '{ scale: 1.035, duration: 2.6, ease: "sine.inOut" }', 2.3),
        ('{ scale: 1.035 }', '{ scale: 1.05, duration: 1.6, ease: "power2.inOut" }', 7.0),
        ('{ scale: 1.05 }', '{ scale: 1, duration: 1.4, ease: "power2.inOut" }', 9.3),
        ('{ scale: 1.05 }', '{ scale: 1, duration: 1.3, ease: "power3.out" }', 18.74),
        ('{ scale: 1 }', '{ scale: 1.045, duration: 2.4, ease: "power2.inOut" }', 20.9),
        ('{ scale: 1.045 }', '{ scale: 1, duration: 1.5, ease: "power2.inOut" }', 24.0),
        ('{ scale: 1 }', '{ scale: 1.04, duration: 3.6, ease: "sine.inOut" }', 31.2),
        ('{ scale: 1.04 }', '{ scale: 1.1, duration: 2.6, ease: "power2.inOut" }', 35.3),
    ]
    mjs = (NL + "      ").join(f'tl.fromTo("#zoom", {a}, {b}, {t});' for a, b, t in Z)
index = f"""<!doctype html>
<html lang="es" data-resolution="portrait-4k">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=2160, height=3840" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 2160px; height: 3840px; overflow: hidden; background: {bg}; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; }}
      #zoom {{ position: absolute; inset: 0; transform-origin: 50% 30%; }}
      #base {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }}
      .layer {{ position: absolute; inset: 0; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="2160" data-height="3840">
{body}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      {mjs}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""
open("reel/index.html", "w", encoding="utf-8", newline="\n").write(index)
print("modo", MODE, "·", len(clips), "subtítulos visibles ·", len(G), "gráficos ·", len(BEHIND), "detrás")
