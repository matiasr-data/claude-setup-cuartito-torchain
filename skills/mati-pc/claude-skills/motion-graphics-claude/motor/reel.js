// reel.js · motion-graphics-claude · ayudas para REELS con una persona hablando a cámara (1080×1920)
// Se carga después de motor.js:  <script src="../motor/reel.js"></script>
// Lee lo que deja «python scripts/reel.py preparar» en recursos/:
//   toma.mp4 (la toma de la persona) · palabras.json ([{p, i, f}] palabra, inicio y fin en s) · cara.json ({x, y, w, h}) · toma.json ({dur, fps})
//   (opcional, avanzado) toma-mascara.mp4: la persona en blanco sobre negro, para texto detrás de la cabeza.
//
//   REEL.dur                 duración de la toma (la escena dura lo mismo)
//   REEL.t('aplicaciones')   segundo en que se DICE esa palabra (sin tildes ni mayúsculas; acepta el principio de la palabra)
//                            REEL.t('palabra', 2) = la 2.ª vez. Si no se dice, devuelve null (y la escena lo salta).
//   REEL.cara                rectángulo de la cara {x, y, w, h}: NADA se pone encima
//   REEL.zonaLibre(alto)     y donde cabe un bloque de ese alto sin tocar la cara ni salir de la zona segura (260–1480)
//   REEL.persona(MG)         la toma a pantalla completa, colocada fotograma a fotograma (devuelve su caja, para el PiP).
//                            Con «render.mjs --transparente» no se pinta: sale solo la capa de gráficos y reel.py la monta encima
//                            de la toma original (calidad intacta).
//   REEL.recorte(MG)         (avanzado) la persona recortada encima del texto, para «texto detrás de la cabeza».
//                            Solo si existe recursos/toma-mascara.mp4; si no, devuelve null y la escena sigue sin romperse.
(function () {
  'use strict';
  const BASE = '../recursos/';
  const leer = (f, def) => { try { const x = new XMLHttpRequest(); x.open('GET', BASE + f, false); x.send(); return x.status === 200 ? JSON.parse(x.responseText) : def; } catch (e) { return def; } };
  const existe = (f) => { try { const x = new XMLHttpRequest(); x.open('HEAD', BASE + f, false); x.send(); return x.status === 200; } catch (e) { return false; } };
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');
  const toma = leer('toma.json', { dur: 10, fps: 30 });
  const palabras = leer('palabras.json', []);
  const cara = leer('cara.json', { x: 290, y: 330, w: 500, h: 620 });
  const capa = !!window.__alfa;
  // capas para editar-reels-claude: escena.html#detras (solo lo que va detrás de la persona) · #delante (todo lo demás)
  const modo = /detras/.test(location.hash) ? 'detras' : /delante/.test(location.hash) ? 'delante' : null;
  const plan = []; window.__plan = plan;

  function t(palabra, n = 1) {
    const partes = String(palabra).split(/\s+/).map(norm).filter(Boolean);
    let vistas = 0;
    for (let i = 0; i < palabras.length; i++) {
      const ok = partes.every((p, j) => palabras[i + j] && norm(palabras[i + j].p).startsWith(p));
      if (ok && ++vistas === n) return palabras[i].i;
    }
    return null;
  }

  function zonaLibre(alto, prefer = 'abajo') {
    const arriba = 260, abajo = 1480, margen = 40;
    const huecoArriba = cara.y - margen - arriba, huecoAbajo = abajo - (cara.y + cara.h + margen);
    const cabeAbajo = huecoAbajo >= alto, cabeArriba = huecoArriba >= alto;
    if (prefer === 'abajo' && cabeAbajo) return cara.y + cara.h + margen;
    if (cabeArriba) return cara.y - margen - alto;
    if (cabeAbajo) return cara.y + cara.h + margen;
    return Math.max(cara.y + cara.h + margen, abajo - alto);   // sin hueco en la zona segura: debajo de la cara, aunque salga un poco
  }

  function persona(MG, o = {}) {
    if (capa) return null;
    const caja = MG.el(`<div class="mg-abs reel-persona" style="width:1080px;height:1920px;overflow:hidden;transform-origin:0 0"></div>`, o.padre || document.body);
    if (!o.padre) { const vista = document.querySelector('.mg-vista'); if (vista) document.body.insertBefore(caja, vista); }   // debajo de los gráficos
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = BASE + 'toma.mp4';
    v.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block'; caja.appendChild(v);
    MG.registrar(v, { t0: 0, off: 0, bucle: false });
    return caja;
  }

  function recorte(MG) {
    if (capa || !existe('toma-mascara.mp4')) return null;
    const lienzo = MG.el(`<canvas class="mg-abs" width="1080" height="1920" style="width:1080px;height:1920px;z-index:5;pointer-events:none"></canvas>`, document.body);
    const c = lienzo.getContext('2d', { willReadFrequently: true });
    const v = MG.video(BASE + 'toma.mp4', 0, { desde: 0, bucle: false }), m = MG.video(BASE + 'toma-mascara.mp4', 0, { desde: 0, bucle: false });
    const aux = document.createElement('canvas'); aux.width = 1080; aux.height = 1920; const a = aux.getContext('2d', { willReadFrequently: true });
    MG.despues(() => {
      a.drawImage(m, 0, 0, 1080, 1920); const img = a.getImageData(0, 0, 1080, 1920), d = img.data;
      for (let i = 0; i < d.length; i += 4) { d[i + 3] = d[i]; d[i] = d[i + 1] = d[i + 2] = 255; }
      c.clearRect(0, 0, 1080, 1920); c.putImageData(img, 0, 0);
      c.globalCompositeOperation = 'source-in'; c.drawImage(v, 0, 0, 1080, 1920); c.globalCompositeOperation = 'source-over';
    });
    return lienzo;
  }

  // salida inversa a la entrada: arranca suave y acelera (entradaCubica), con desenfoque según la velocidad
  function sale(MG, el, t, t1, o = {}) {
    const d = o.d ?? 0.35, cv = MG.curvas[o.curva || 'entradaCubica'];
    const p = cv(MG.k(t, t1, t1 + d)), q = cv(MG.k(t - MG.DT, t1, t1 + d)), v = (p - q) / MG.DT;
    const dy = o.dy ?? -80, dx = o.dx ?? 0;
    if (p > 0) MG.desenfoca(el, Math.abs(dx * v) * 0.05, Math.abs(dy * v) * 0.05 + p * 6);
    return { x: dx * p, y: dy * p, s: 1 - (o.escala ?? 0.08) * p, op: 1 - p, p };
  }
  // estilos comunes de los gráficos de reel (usan los tokens del tema: cambian con --tema)
  const css = document.createElement('style');
  css.textContent = `
  .reel-clave { display:flex; align-items:center; gap:26px; padding:22px 40px 22px 22px; border-radius:999px; white-space:nowrap;
    background:rgba(var(--fondo-rgb), .72); backdrop-filter:blur(18px); border:1.5px solid rgba(255,255,255,.14);
    box-shadow:0 24px 60px rgba(0,0,0,.45); font:800 84px/1 var(--fuente-titulo, var(--fuente)); letter-spacing:-.03em; color:var(--texto); }
  .reel-clave em { font-style:normal; color:var(--acento); }
  .reel-ico { width:96px; height:96px; border-radius:50%; background:var(--acento); color:var(--tinta); display:grid; place-items:center; flex:none; }
  .reel-tarjeta { width:440px; padding:26px 28px; border-radius:calc(var(--radio) * 1.6); background:rgba(var(--fondo-rgb), .78); backdrop-filter:blur(20px);
    border:1.5px solid rgba(255,255,255,.14); box-shadow:0 30px 70px rgba(0,0,0,.5); color:var(--texto); font-family:var(--fuente); }
  .reel-tarjeta .cab { display:flex; align-items:center; gap:18px; font:800 40px/1.1 var(--fuente-titulo, var(--fuente)); letter-spacing:-.02em; }
  .reel-tarjeta .cab img, .reel-tarjeta .cab .reel-ico { width:64px; height:64px; border-radius:16px; }
  .reel-tarjeta .sub { margin-top:12px; font:600 28px/1.25 var(--fuente); color:var(--mute); }
  `;
  (document.head || document.documentElement).appendChild(css);
  if (modo === 'detras') css.textContent += '.mg-mundo > :not(.reel-detras){visibility:hidden !important}';
  if (modo === 'delante') css.textContent += '.reel-detras{display:none !important}';
  // apunta un gráfico en el plan (resultados/capas/plan.json): qué es, en qué capa y de qué segundo a qué segundo
  const apunta = (o) => plan.push({ capa: 'delante', ...o, desde: +(+o.desde).toFixed(3), hasta: +(+o.hasta).toFixed(3) });

  window.REEL = { modo, apunta, sale, dur: toma.dur, fps: toma.fps, palabras, cara, capa, t, zonaLibre, persona, recorte, norm };
})();
