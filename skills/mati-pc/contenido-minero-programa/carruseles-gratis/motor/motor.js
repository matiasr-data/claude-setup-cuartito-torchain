// MOTOR · Carrusel Animado · Viegas Academy
// La base de cada slide: un lienzo de 1080×1350 que se dibuja en función del tiempo.
// Reglas: nada de relojes ni Math.random. window.seek(t) es el playhead; el render lo llama en cualquier orden.
// Expone window.MOTOR (alias M).
(function () {
  'use strict';
  const M = (window.MOTOR = window.M = {});
  M.W = 1080; M.H = 1350; M.FPS = 30; M.TIEMPO = 0.5; // 120 BPM: un tiempo cada 0,5 s, un compás cada 2 s

  // ---------- marca (el slide la ajusta con M.marca({...})) ----------
  M.MARCA = { usuario: '@usuario', lema: '' };
  M.marca = (o) => Object.assign(M.MARCA, o || {});

  // ---------- azar con semilla (xorshift32): mismo número, misma secuencia ----------
  M.azar = (semilla) => {
    let x = (semilla * 2654435761) >>> 0 || 0x9e3779b9;
    return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  };

  // ---------- elementos ----------
  M.el = (padre, tag, clase, texto, estilo) => {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    if (estilo) Object.assign(e.style, estilo);
    padre.appendChild(e);
    return e;
  };

  // distancia desde el borde superior del elemento hasta su línea de base (un marcador invisible en la base)
  M.base = (e) => {
    let m = e.querySelector(':scope > b.__base');
    if (!m) { m = document.createElement('b'); m.className = '__base'; m.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'; e.appendChild(m); }
    return m.offsetTop;
  };
  // coloca un bloque de una línea por su línea de base: { x | cx (centro) | rx (borde derecho), base, fs, color }
  M.coloca = (e, o) => {
    if (o.fs != null) e.style.fontSize = o.fs + 'px';
    if (o.color) e.style.color = o.color;
    const w = e.offsetWidth;
    const x = o.cx != null ? o.cx - w / 2 : o.rx != null ? o.rx - w : o.x;
    e.style.left = x.toFixed(2) + 'px'; e.style.top = '0px';
    e.style.top = (o.base - M.base(e)).toFixed(2) + 'px';
    return { x, w };
  };
  // ajusta el cuerpo de letra para que el texto quepa en maxW (búsqueda binaria, nunca pasa del margen)
  M.encaja = (e, maxW = M.W - 144, minPx = 40) => {
    const ws = e.style.whiteSpace; e.style.whiteSpace = 'nowrap';
    let hi = parseFloat(getComputedStyle(e).fontSize), lo = minPx;
    if (e.offsetWidth > maxW) {
      for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; e.style.fontSize = mid + 'px'; if (e.offsetWidth > maxW) hi = mid; else lo = mid; }
      e.style.fontSize = Math.floor(lo) + 'px';
    }
    e.style.whiteSpace = ws || '';
    return parseFloat(e.style.fontSize || hi);
  };

  // ---------- textura: grano fino con semilla, encima del fondo ----------
  M.grano = (host, fuerza = 0.05, semilla = 1) => {
    const c = document.createElement('canvas'); c.width = M.W; c.height = M.H; c.className = 'capa';
    const g = c.getContext('2d'), img = g.createImageData(M.W, M.H), d = img.data, r = M.azar(semilla);
    for (let i = 0; i < d.length; i += 4) { const v = r() > 0.5 ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = (r() * 255 * fuerza) | 0; }
    g.putImageData(img, 0, 0); host.appendChild(c); return c;
  };

  // ---------- pie: usuario a la izquierda, lema alineado con la columna derecha (lejos del icono de sonido) ----------
  M.pie = (q, color, izq, der) => {
    const a = M.el(q, 'div', 'pie', izq || M.MARCA.usuario), b = M.el(q, 'div', 'pie', der || M.MARCA.lema);
    M.coloca(a, { x: 72, base: 1278, color }); M.coloca(b, { x: 676, base: 1278, color });
    return [a, b];
  };

  // ---------- curvas y tiempo (todo puro en t) ----------
  M.limita = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  M.seg = (t, a, b) => M.limita((t - a) / (b - a));
  M.lerp = (a, b, u) => a + (b - a) * u;
  M.inQ = (u) => u * u;
  M.outQ = (u) => u * (2 - u);
  M.inOutQ = (u) => (u < 0.5 ? 2 * u * u : -1 + (4 - 2 * u) * u);
  M.inC = (u) => u * u * u;
  M.outC = (u) => { const v = u - 1; return v * v * v + 1; };
  M.inOutC = (u) => (u < 0.5 ? 4 * u * u * u : (u - 1) * (2 * u - 2) * (2 * u - 2) + 1);
  // campana: 0 → 1 → 0 con derivada nula en los extremos (y cero exacto: el reposo es reposo)
  M.campana = (u) => { const v = Math.sin(Math.PI * M.limita(u)); const w = v * v; return w < 1e-9 ? 0 : w; };
  // muelle amortiguado que llega a cero exacto en `dur` (sin residuo en la costura del loop)
  M.muelle = (tau, dur, f) => (tau < 0 || tau >= dur ? 0 : (1 - tau / dur) * (1 - tau / dur) * Math.cos(2 * Math.PI * f * tau));
  // peso: estira o aplasta conservando el volumen (más ancho = más bajo)
  M.volumen = (a) => ({ sx: 1 / (1 + a), sy: 1 + a });
  M.aplasta = (t, t0, fuerza = 0.14, dur = 0.45, f = 2.4) => M.volumen(-fuerza * M.muelle(t - t0, dur, f));
  M.latido = (t, t0, fuerza = 0.1, dur = 0.4, f = 2.6) => 1 + fuerza * M.muelle(t - t0, dur, f);
  // cuántas letras se ven en t al escribir n letras desde t0, una cada `paso` segundos
  M.teclea = (t, t0, n, paso = 0.5) => M.limita(Math.floor((t - t0) / paso) + 1, 0, n);

  // ---------- listo para fotografiar ----------
  // espera fuentes, monta el slide, espera imágenes, deja el frame 0 dibujado y avisa al render con window.__listo
  M.listo = async (montar, fuentes = []) => {
    for (const f of fuentes) { try { await document.fonts.load(f); } catch (e) {} }
    await document.fonts.ready;
    if (montar) await montar();
    await Promise.all([...document.images].map((i) => (i.complete ? i.decode().catch(() => {}) : new Promise((ok) => { i.onload = () => i.decode().then(ok, ok); i.onerror = ok; }))));
    if (!window.seek) window.seek = () => true;
    if (!window.__slide) M.slide({});
    window.seek(0);
    window.__listo = true;
    const q = location.search;
    if (q.includes('play')) { const t0 = performance.now(); const loop = () => { window.seek((performance.now() - t0) / 1000); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
    const m = q.match(/[?&]t=([\d.]+)/); if (m) window.seek(parseFloat(m[1]));
  };
  // registra el slide: duración en segundos (4, 6 u 8 = compases enteros) y los golpes de sonido [{ t, tipo, que, ganancia }]
  M.slide = ({ indice = 1, duracion = 6, golpes = [] } = {}) => {
    window.__slide = { indice, duracion, compases: duracion / 2, golpes };
    const dibuja = window.seek || (() => true);
    window.seek = (t) => dibuja(((t % duracion) + duracion) % duracion);
  };
})();
