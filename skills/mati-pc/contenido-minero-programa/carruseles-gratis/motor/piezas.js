// PIEZAS · Carrusel Animado · Viegas Academy. La marca y el movimiento encima de motor.js.
// Fondos con la rejilla de la marca, cabecera con el rayo, pie, y las piezas de movimiento que comparten los dos carruseles.
// Todo es determinista: nada de Math.random ni relojes.
(function () {
  const M = window.MOTOR;
  const V = (window.V = {});
  M.marca({ usuario: '@tucuenta', lema: 'tu tema · tu estilo', nombre: 'Tu Nombre', cabecera: 'TU MARCA' }); // cámbialo en slides/carrusel.js con M.marca({ … })

  V.FUENTES = ['400 100px Anton', '600 100px Rajdhani', '700 100px Rajdhani', '500 20px "JetBrains Mono"', '700 20px "JetBrains Mono"'];
  V.C = { noche: '#0B0614', violeta: '#7C3AED', lavanda: '#EFE9FA', tinta: '#150A24', oro: '#F2C84B', claro: '#F1EEFB', lila: '#B8A8D0' };
  // colores por tema: una cor principal + un acento por slide (oro sobre oscuro, violeta sobre claro)
  V.tema = (t) => ({
    noche:   { fondo: V.C.noche, tx: V.C.claro, mudo: 'rgba(241,238,251,.66)', acento: V.C.oro, acentoTx: V.C.tinta, carta: V.C.claro, cartaTx: V.C.tinta, banda: '#DCD2EE', cartaMudo: 'rgba(21,10,36,.6)', fio: 'rgba(241,238,251,.22)' },
    lavanda: { fondo: V.C.lavanda, tx: V.C.tinta, mudo: 'rgba(21,10,36,.62)', acento: V.C.violeta, acentoTx: V.C.claro, carta: V.C.noche, cartaTx: V.C.claro, banda: '#221839', cartaMudo: 'rgba(241,238,251,.62)', fio: 'rgba(21,10,36,.22)' },
    violeta: { fondo: V.C.violeta, tx: V.C.claro, mudo: 'rgba(241,238,251,.8)', acento: V.C.oro, acentoTx: V.C.tinta, carta: V.C.noche, cartaTx: V.C.claro, banda: '#221839', cartaMudo: 'rgba(241,238,251,.62)', fio: 'rgba(241,238,251,.3)' },
  })[t];

  // ---------- fondo: color plano + la rejilla de 60 px de la marca + grano con semilla ----------
  V.fondo = function (q, t, semilla = 3) {
    const c = V.tema(t);
    q.classList.add(t);
    const cv = document.createElement('canvas'); cv.width = M.W; cv.height = M.H; cv.className = 'capa';
    const g = cv.getContext('2d');
    g.fillStyle = c.fondo; g.fillRect(0, 0, M.W, M.H);
    if (t === 'noche') { // la luz violeta de la marca, contenida, en una esquina
      const r = g.createRadialGradient(930, 90, 0, 930, 90, 760); r.addColorStop(0, 'rgba(124,58,237,.30)'); r.addColorStop(1, 'rgba(124,58,237,0)');
      g.fillStyle = r; g.fillRect(0, 0, M.W, M.H);
    }
    g.fillStyle = t === 'lavanda' ? 'rgba(124,58,237,.075)' : t === 'violeta' ? 'rgba(255,255,255,.075)' : 'rgba(168,85,247,.09)';
    for (let x = 0; x <= M.W; x += 60) g.fillRect(x, 0, 1, M.H);
    for (let y = 15; y <= M.H; y += 60) g.fillRect(0, y, M.W, 1);
    if (t !== 'lavanda') { // viñeta de las presentaciones: los bordes caen a negro, el centro respira
      const v = g.createRadialGradient(540, 620, 280, 540, 675, 1000); v.addColorStop(0, 'rgba(4,2,10,0)'); v.addColorStop(1, `rgba(4,2,10,${t === 'violeta' ? 0.42 : 0.6})`);
      g.fillStyle = v; g.fillRect(0, 0, M.W, M.H);
    }
    q.prepend(cv);
    M.grano(q, t === 'lavanda' ? 0.035 : 0.05, semilla);
    return c;
  };

  // ---------- el rayo (la marca, plano: sin brillo) ----------
  V.rayo = (parent, size, color, style) => {
    const d = M.el(parent, 'div', 'abs', null, Object.assign({ width: size + 'px', height: size + 'px' }, style || {}));
    d.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="M13.6 1.5 3.4 14h7.3l-1.6 8.5L20.6 9.6h-7.4l.4-8.1z" fill="${color}"/></svg>`;
    return d;
  };
  // cabecera: rayo + el nombre de tu marca a la izquierda (la esquina derecha queda libre para el contador)
  V.cab = (q, c, txt = M.MARCA.cabecera, extra) => {
    V.rayo(q, 30, c.acento, { left: '66px', top: '55px' });
    const e = V.linea(q, 'mono', txt, { x: 104, base: 81 }, { fontSize: '19px', color: c.tx, letterSpacing: '.16em', fontWeight: 700 });
    if (extra) V.linea(q, 'mono', extra, { x: 104 + e.offsetWidth + 26, base: 81 }, { fontSize: '19px', color: c.mudo, letterSpacing: '.12em' });
  };
  V.pie = (q, c) => M.pie(q, c.mudo);


  // píldora girada dibujada en canvas: el canvas nunca se transforma; cada frame se repinta con su giro y su escala.
  // (un giro CSS animado hace que Chrome rasterice distinto en reposo y el loop no cierra al píxel)
  V.pildora = (q, txt, x, y, bg, fg, rot = -4) => {
    const fnt = '700 26px "JetBrains Mono"', ls = 26 * 0.08, h = 58, m = 40;
    const g0 = document.createElement('canvas').getContext('2d'); g0.font = fnt; g0.letterSpacing = ls + 'px';
    const w = Math.ceil(g0.measureText(txt).width + 44);
    const cv = M.el(q, 'canvas', 'abs', null, { left: (x - m) + 'px', top: (y - m) + 'px' }); cv.width = w + 2 * m; cv.height = h + 2 * m;
    const g = cv.getContext('2d'); let ultimo = '';
    const dibuja = ({ r = 0, sx = 1, sy = 1, y: dy = 0, x: dx = 0, a = 1, b = 0 } = {}) => {
      const k = [r, sx, sy, dy, dx, a, b].map((v) => v.toFixed(4)).join(); if (k === ultimo) return; ultimo = k;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
      if (a <= 0.001) return;
      g.globalAlpha = a; g.filter = b > 0.02 ? `blur(${b.toFixed(2)}px)` : 'none';
      g.translate(m + w / 2 + dx, m + h / 2 + dy); g.rotate(((rot + r) * Math.PI) / 180); g.scale(sx, sy); g.translate(-w / 2, -h / 2);
      g.beginPath(); g.roundRect(0, 0, w, h, 10); g.fillStyle = bg; g.fill();
      g.font = fnt; g.letterSpacing = ls + 'px'; g.fillStyle = fg; g.textBaseline = 'alphabetic'; g.fillText(txt, 22, h / 2 + 9);
      g.globalAlpha = 1; g.filter = 'none';
    };
    dibuja();
    return { el: cv, dibuja };
  };

  // ---------- texto ----------
  // altura real de las mayúsculas (Anton es alta: no adivinar con un factor)
  V.cap = (fs, font = 'Anton', w = 400, ch = 'H') => { const g = document.createElement('canvas').getContext('2d'); g.font = `${w} ${fs}px ${font}`; return g.measureText(ch).actualBoundingBoxAscent; };
  V.linea = (q, cls, txt, o, st) => { const e = M.el(q, 'div', 'abs ' + (cls || ''), txt, st); M.coloca(e, o); return e; };
  V.gigante = (q, cls, txt, fs, maxW, o, st) => { const e = M.el(q, 'div', 'abs ' + cls, txt, st); e.style.fontSize = fs + 'px'; M.encaja(e, maxW); M.coloca(e, o); return e; };
  V.bloque = (q, cls, txt, x, top, w, st) => M.el(q, 'div', 'abs ' + cls, txt, Object.assign({ left: x + 'px', top: top + 'px', width: w + 'px' }, st || {}));

  // ---------- movimiento ----------
  V.pone = (e, p, v) => { if (e.style[p] !== v) e.style[p] = v; };
  // transform con reposo exacto: si todo es neutro vuelve al string de reposo (el frame 0 = el PNG)
  V.tf = (e, reposo, { x = 0, y = 0, r = 0, sx = 1, sy = 1 } = {}) => {
    const neutro = Math.abs(x) < 1e-4 && Math.abs(y) < 1e-4 && Math.abs(r) < 1e-4 && Math.abs(sx - 1) < 1e-5 && Math.abs(sy - 1) < 1e-5;
    V.pone(e, 'transform', neutro ? reposo : `${reposo} translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${sx.toFixed(4)},${sy.toFixed(4)})`.trim());
  };
  // salto con peso: anticipa (aplasta), sube estirado, cae estirado y aterriza en t1 con sello
  V.salto = (t, t0, t1, alto = 60, forca = 0.15) => {
    const m = (t0 + t1) / 2;
    if (t >= t0 - 0.25 && t < t0) { const u = M.campana(M.seg(t, t0 - 0.25, t0) / 2); return { y: 0, ...M.volumen(-0.07 * u) }; }
    if (t >= t0 && t < m) { const u = M.seg(t, t0, m); return { y: -alto * M.outC(u), ...M.volumen(0.1 * (1 - u)) }; }
    if (t >= m && t < t1) { const u = M.seg(t, m, t1); return { y: -alto * (1 - M.inC(u)), ...M.volumen(0.12 * M.inC(u)) }; }
    return { y: 0, ...M.aplasta(t, t1, forca) };
  };
  // sello: sube girando y golpea en t1
  V.sello = (t, t0, t1, rot = -6, crece = 0.14, forca = 0.16) => {
    if (t >= t0 && t < t1) { const u = M.outC(M.seg(t, t0, t1)); return { r: rot * u, sx: 1 + crece * u, sy: 1 + crece * u, y: -10 * u }; }
    return M.aplasta(t, t1, forca);
  };
  // máscara horizontal: se oculta hacia la izquierda (a→b) y se revela desde la izquierda (c→d)
  V.barre = (e, t, a, b, c, d) => {
    let v = '';
    if (t >= a && t < b) v = `inset(0 ${(100 * M.inOutC(M.seg(t, a, b))).toFixed(2)}% 0 0)`;
    else if (t >= b && t < c) v = 'inset(0 100% 0 0)';
    else if (t >= c && t < d) v = `inset(0 ${(100 * (1 - M.outC(M.seg(t, c, d)))).toFixed(2)}% 0 0)`;
    V.pone(e, 'clipPath', v);
  };
  // máscara vertical: baja y se esconde bajo su línea (a→b) y vuelve a subir (c→d)
  V.sube = (e, t, a, b, c, d, h = 60) => {
    let y = 0, clip = '';
    if (t >= a && t < b) y = h * M.inC(M.seg(t, a, b)); else if (t >= b && t < c) y = h; else if (t >= c && t < d) y = h * (1 - M.outC(M.seg(t, c, d)));
    if (y > 0) clip = `inset(0 0 ${y.toFixed(2)}px 0)`;
    V.pone(e, 'clipPath', clip); V.tf(e, '', { y });
  };
  V.icono = (q, ok, x, y, c) => M.el(q, 'div', 'abs', ok ? '✓' : '×', {
    left: x + 'px', top: y + 'px', width: '40px', height: '40px', borderRadius: '50%', display: 'grid', placeItems: 'center',
    font: `700 ${ok ? 26 : 32}px/1 Rajdhani, sans-serif`, transformOrigin: '50% 50%',
    background: ok ? c.acento : 'transparent', color: ok ? c.acentoTx : c.tx, border: ok ? 'none' : `3px solid ${c.tx}`,
  });

  // ================================================================================================
  // EL MOVIMIENTO DE DIEGO · sacado de las presentaciones de Viegas Academy (deck.css, clase2.js):
  //   --out (.16,1,.3,1) para entrar · --spring (.34,1.56,.64,1) para letras con rebote · desenfoque 14-18 px → 0
  //   letras que suben y se enfocan una a una · palabras a 45 ms · salidas hacia arriba con desenfoque de 7 px
  //   orbes que flotan, viñeta, ondas de impacto (0,4 → 4,2) y aterrizaje aplastado (1,18 × 0,82)
  // Todo es función pura de t: el reposo devuelve los estilos vacíos y el frame 0 sigue siendo el PNG.
  // ================================================================================================
  V.bez = (x1, y1, x2, y2) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (s) => ((ax * s + bx) * s + cx) * s, Y = (s) => ((ay * s + by) * s + cy) * s, dX = (s) => (3 * ax * s + 2 * bx) * s + cx;
    return (u) => {
      if (u <= 0) return 0; if (u >= 1) return 1;
      let s = u; for (let i = 0; i < 10; i++) { const e = X(s) - u, d = dX(s); if (Math.abs(e) < 1e-7 || Math.abs(d) < 1e-7) break; s -= e / d; }
      return Y(Math.min(1, Math.max(0, s)));
    };
  };
  V.E = { out: V.bez(0.16, 1, 0.3, 1), resorte: V.bez(0.34, 1.56, 0.64, 1), io: V.bez(0.65, 0, 0.35, 1), entra: V.bez(0.7, 0, 0.84, 0) };
  // elastic scale de TextFlow: 0 → 1,2 → 0,92 → 1,04 → 1
  V.elastico = (u) => { const K_ = [0, 0.42, 0.62, 0.8, 1], S = [0, 1.2, 0.92, 1.04, 1]; for (let i = 1; i < K_.length; i++) if (u <= K_[i]) return M.lerp(S[i - 1], S[i], M.inOutQ(M.seg(u, K_[i - 1], K_[i]))); return 1; };

  // parte un texto en caracteres, palabras o líneas (spans inline-block; los espacios quedan como texto)
  V.partir = (el, modo = 'word') => {
    const fs = parseFloat(getComputedStyle(el).fontSize) || 40;
    const txt = el.textContent; el.textContent = '';
    const piezas = [];
    const tokens = modo === 'char' ? [...txt] : txt.split(/(\s+)/);
    for (const tk of tokens) {
      if (!tk) continue;
      if (/^\s+$/.test(tk)) { el.appendChild(document.createTextNode(tk)); continue; }
      const s = document.createElement('span'); s.textContent = tk;
      s.style.display = 'inline-block'; s.style.whiteSpace = 'pre'; s.style.transformOrigin = '50% 85%';
      el.appendChild(s); piezas.push(s);
    }
    // líneas: cada palabra sabe en qué renglón quedó; tracking: cuánto se separa del centro
    const tops = [...new Set(piezas.map((p) => Math.round(p.offsetTop)))].sort((a, b) => a - b);
    const ancho = el.offsetWidth || 1;
    piezas.forEach((p) => {
      p._linea = tops.indexOf(Math.round(p.offsetTop));
      p._dx = (((p.offsetLeft + p.offsetWidth / 2) / ancho) * 2 - 1) * fs * 0.9;
    });
    return piezas;
  };

  // la entrada: cada pieza se enfoca y llega a su sitio. salida = [a, b] (todas se van juntas, hacia arriba y desenfocadas)
  //   estilo: 'sube' (slide up + blur) · 'resorte' (letras que suben girando con rebote) · 'elastico' · 'enfoque' (blur fade) · 'pista' (tracking)
  V.revela = (piezas, t, o) => {
    const { a, paso = 0.045, total, dur = 0.8, estilo = 'sube', blur = 14, y = 36, rot = 0, salida = [0.12, 0.32], clave } = o;
    const n = piezas.length;
    piezas.forEach((p, i) => {
      const k = clave ? clave(p, i) : i;
      const t0 = a + (total != null ? (n > 1 ? k / (n - 1) : 0) * total : k * paso);
      let op = 1, b = 0, dx = 0, dy = 0, s = 1, r = 0;
      if (salida && t >= salida[0] && t < salida[1]) { const u = M.inQ(M.seg(t, salida[0], salida[1])); op = 1 - u; b = 7 * u; dy = -16 * u; }
      else if (salida && t >= salida[1] && t < t0) { op = 0; }
      else if (t >= t0 && t < t0 + dur) {
        const u = M.seg(t, t0, t0 + dur);
        op = M.outQ(M.seg(t, t0, t0 + dur * 0.55));
        b = blur * (1 - M.outQ(M.seg(t, t0, t0 + dur * 0.7)));
        if (estilo === 'sube') dy = y * (1 - V.E.out(u));
        else if (estilo === 'resorte') { const e = V.E.resorte(u); dy = y * (1 - e); r = rot * (1 - e); }
        else if (estilo === 'elastico') { s = V.elastico(u); op = M.outQ(M.seg(t, t0, t0 + dur * 0.35)); }
        else if (estilo === 'enfoque') s = 1.12 - 0.12 * V.E.out(u);
        else if (estilo === 'pista') dx = (p._dx || 0) * (1 - V.E.out(u));
        else if (estilo === 'ventana') { const e = V.E.out(u); dy = y * (1 - e); s = 0.965 + 0.035 * e; }
        else if (estilo === 'lado') dx = -(o.x ?? 40) * (1 - V.E.out(u));
      }
      const quieto = Math.abs(dx) < 1e-3 && Math.abs(dy) < 1e-3 && Math.abs(r) < 1e-3 && Math.abs(s - 1) < 1e-4;
      V.pone(p, 'opacity', op >= 0.9999 ? '' : op.toFixed(3));
      V.pone(p, 'filter', b > 0.02 ? `blur(${b.toFixed(2)}px)` : '');
      V.pone(p, 'transform', quieto ? '' : `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})`);
    });
  };

  // la misma entrada que revela, pero devuelve los números (para lo que se pinta en canvas)
  V.entrada = (t, t0, dur = 0.9, { x = 0, y = 0, blur = 10, salida = [0.12, 0.32] } = {}) => {
    if (salida && t >= salida[0] && t < salida[1]) { const u = M.inQ(M.seg(t, salida[0], salida[1])); return { a: 1 - u, b: 7 * u, y: -12 * u, x: 0 }; }
    if (salida && t >= salida[1] && t < t0) return { a: 0, b: blur, x, y };
    if (t >= t0 && t < t0 + dur) { const u = M.seg(t, t0, t0 + dur), e = V.E.out(u); return { a: M.outQ(M.seg(t, t0, t0 + dur * 0.55)), b: blur * (1 - M.outQ(M.seg(t, t0, t0 + dur * 0.7))), x: x * (1 - e), y: y * (1 - e) }; }
    return { a: 1, b: 0, x: 0, y: 0 };
  };

  // texto que se escribe a mano: vacío tras la salida, letra a letra con cursor, completo en reposo
  V.escribe = (el, full, t, t0, cps = 26, salida = [0.12, 0.32]) => {
    let tx = full; const fin = t0 + full.length / cps;
    if (salida && t >= salida[1] && t < t0) tx = '';
    else if (t >= t0 && t < fin) tx = full.slice(0, Math.floor((t - t0) * cps)) + '▍';
    if (el.textContent !== tx) el.textContent = tx;
    return fin;
  };

  // brillo: una banda de luz que cruza las letras (clon del texto con el degradado recortado a las letras)
  V.brillo = (el, col = 'rgba(255,255,255,.85)') => {
    const c = el.cloneNode(true);
    Object.assign(c.style, { color: 'transparent', backgroundImage: `linear-gradient(105deg, transparent 40%, ${col} 50%, transparent 60%)`, backgroundSize: '300% 100%',
      backgroundRepeat: 'no-repeat', backgroundPosition: '100% 0', webkitBackgroundClip: 'text', backgroundClip: 'text', pointerEvents: 'none', transform: '', filter: '' });
    el.after(c);
    return { at(t, t0, dur = 1.0) { const p = t >= t0 && t < t0 + dur ? 92 - 84 * V.E.io(M.seg(t, t0, t0 + dur)) : 100; V.pone(c, 'backgroundPosition', p === 100 ? '100% 0' : `${p.toFixed(2)}% 0`); } };
  };

  // subrayado que se dibuja de izquierda a derecha, se queda un momento y se retira hacia la derecha
  V.subrayado = (q, el, col, grosor = 8, dy = 22) => {
    const x0 = el.offsetLeft, w = el.offsetWidth, top = el.offsetTop + M.base(el) + dy;
    const b = M.el(q, 'div', 'abs', null, { left: x0 + 'px', top: top + 'px', width: '0px', height: grosor + 'px', borderRadius: grosor + 'px', background: col, display: 'none' });
    return { at(t, t0, dibujo = 0.55, quieto = 0.7, retiro = 0.5) {
      let a = 0, z = 0; // a = borde izquierdo, z = borde derecho (0..1)
      if (t >= t0 && t < t0 + dibujo) { z = V.E.out(M.seg(t, t0, t0 + dibujo)); }
      else if (t >= t0 + dibujo && t < t0 + dibujo + quieto) z = 1;
      else if (t >= t0 + dibujo + quieto && t < t0 + dibujo + quieto + retiro) { z = 1; a = V.E.io(M.seg(t, t0 + dibujo + quieto, t0 + dibujo + quieto + retiro)); }
      const vis = z - a > 0.001;
      V.pone(b, 'display', vis ? 'block' : 'none');
      if (vis) { V.pone(b, 'left', (x0 + a * w).toFixed(2) + 'px'); V.pone(b, 'width', ((z - a) * w).toFixed(2) + 'px'); }
    } };
  };

  // ventana estilo macOS: semáforo, título centrado, bordes de 16 px, sombra suave. Oscura sobre noche, clara sobre lavanda.
  V.ventana = (q, { x, y, w, h, titulo, tema }) => {
    const osc = tema !== 'lavanda';
    const C = osc
      ? { bg: '#1A1328', barra: '#221A33', borde: 'rgba(255,255,255,.10)', tx: '#F1EEFB', mudo: 'rgba(241,238,251,.52)', sombra: '0 34px 70px -24px rgba(0,0,0,.9)' }
      : { bg: '#FFFFFF', barra: '#F5F2FB', borde: 'rgba(21,10,36,.10)', tx: '#150A24', mudo: 'rgba(21,10,36,.5)', sombra: '0 30px 60px -26px rgba(76,29,149,.42)' };
    const el = M.el(q, 'div', 'abs', null, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', borderRadius: '16px', background: C.bg, border: `1px solid ${C.borde}`, boxShadow: C.sombra, overflow: 'hidden', transformOrigin: '50% 60%' });
    const bar = M.el(el, 'div', null, null, { height: '40px', background: C.barra, borderBottom: `1px solid ${C.borde}`, position: 'relative' });
    ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => M.el(bar, 'div', null, null, { position: 'absolute', left: (18 + i * 22) + 'px', top: '13px', width: '13px', height: '13px', borderRadius: '50%', background: col }));
    M.el(bar, 'div', null, titulo, { position: 'absolute', left: '0', right: '0', top: '0', textAlign: 'center', font: '600 18px/40px Rajdhani, sans-serif', color: C.mudo, letterSpacing: '.01em' });
    const body = M.el(el, 'div', null, null, { position: 'relative', padding: '16px 24px 0' });
    return { el, body, C };
  };

  // aterrizaje (como en las presentaciones de Viegas Academy): 1,18 × 0,82 → 0,95 × 1,06 → 1
  V.aterriza = (t, t0, dur = 0.42, k = 1) => {
    if (t < t0 || t >= t0 + dur) return { sx: 1, sy: 1 };
    const u = M.seg(t, t0, t0 + dur);
    const sx = u < 0.6 ? M.lerp(1 + 0.18 * k, 1 - 0.05 * k, M.outQ(u / 0.6)) : M.lerp(1 - 0.05 * k, 1, M.inOutQ((u - 0.6) / 0.4));
    const sy = u < 0.6 ? M.lerp(1 - 0.18 * k, 1 + 0.06 * k, M.outQ(u / 0.6)) : M.lerp(1 + 0.06 * k, 1, M.inOutQ((u - 0.6) / 0.4));
    return { sx, sy };
  };

  // ---------- la escena: profundidad de campo ----------
  // dos lienzos: uno detrás del contenido (orbes, bokeh, recursos desenfocados) y otro delante (lo que está muy cerca de la cámara).
  // Cada recurso se pinta una vez, ya desenfocado, y en cada frame solo se coloca: rápido y determinista.
  V.escena = (q, { tema, dur, semilla = 1, orbes = 3, bokeh = 8, fondo = [], frente = [], ondas = [], halos = [], focos = [] }) => {
    const r = M.azar(semilla * 131 + 7);
    const PAL = tema === 'lavanda' ? { v: '124,58,237', l: '167,139,250', o: '214,160,30', tx: '21,10,36', av: 0.16 }
      : tema === 'violeta' ? { v: '76,29,149', l: '216,180,254', o: '242,200,75', tx: '241,238,251', av: 0.32 }
      : { v: '124,58,237', l: '192,132,252', o: '242,200,75', tx: '241,238,251', av: 0.34 };
    const mk = () => { const cv = document.createElement('canvas'); cv.width = M.W; cv.height = M.H; cv.className = 'abs'; cv.style.cssText = 'left:0;top:0;pointer-events:none'; return cv; };
    const cvF = mk(), cvR = mk();
    q.insertBefore(cvF, q.firstChild ? q.firstChild.nextSibling : null);
    const sprite = (w, h, blur, draw) => {
      const pad = Math.ceil(blur * 2.6) + 4, cv = document.createElement('canvas');
      cv.width = Math.ceil(w + 2 * pad); cv.height = Math.ceil(h + 2 * pad);
      const g = cv.getContext('2d'); if (blur > 0) g.filter = `blur(${blur}px)`; g.translate(pad, pad); draw(g); return { cv, pad };
    };
    const RAYO = new Path2D('M13.6 1.5 3.4 14h7.3l-1.6 8.5L20.6 9.6h-7.4l.4-8.1z');
    const rr = (g, x, y, w, h, rad) => { g.beginPath(); g.roundRect(x, y, w, h, rad); };
    const DIB = {
      numero: (p) => { const g0 = document.createElement('canvas').getContext('2d'); g0.font = `400 ${p.fs}px Anton`; const w = g0.measureText(p.txt).width;
        return sprite(w, p.fs, p.blur, (g) => { g.font = `400 ${p.fs}px Anton`; g.lineWidth = p.lw || 3; g.strokeStyle = `rgba(${PAL.tx},${p.a ?? 0.14})`; g.strokeText(p.txt, 0, p.fs * 0.88); }); },
      rayo: (p) => sprite(p.size, p.size, p.blur, (g) => { g.scale(p.size / 24, p.size / 24); g.fillStyle = p.col || `rgba(${PAL.o},${p.a ?? 0.9})`; g.fill(RAYO); }),
      clips: (p) => sprite(p.w, 70, p.blur, (g) => { const ws = [0.22, 0.12, 0.3, 0.16, 0.2]; let x = 0;
        ws.forEach((f, i) => { const w = p.w * f - 8; rr(g, x, 8, w, 54, 10); g.fillStyle = `rgba(${i % 2 ? PAL.l : PAL.v},${p.a ?? 0.55})`; g.fill(); x += w + 8; });
        g.fillStyle = `rgba(${PAL.o},.95)`; g.fillRect(p.w * 0.38, 0, 5, 70); }),
      diamantes: (p) => sprite(p.n * 70, 40, p.blur, (g) => { g.strokeStyle = `rgba(${PAL.tx},${(p.a ?? 0.5) * 0.5})`; g.lineWidth = 2; g.beginPath(); g.moveTo(10, 20); g.lineTo(p.n * 70 - 30, 20); g.stroke();
        for (let i = 0; i < p.n; i++) { g.save(); g.translate(10 + i * 70, 20); g.rotate(Math.PI / 4); g.fillStyle = i === p.n - 1 ? `rgba(${PAL.o},.95)` : `rgba(${PAL.l},${p.a ?? 0.7})`; g.fillRect(-11, -11, 22, 22); g.restore(); } }),
      ventana: (p) => sprite(p.w, p.h, p.blur, (g) => { rr(g, 0, 0, p.w, p.h, 18); g.fillStyle = `rgba(${PAL.tx},.06)`; g.fill(); g.strokeStyle = `rgba(${PAL.tx},.2)`; g.lineWidth = 2; g.stroke();
        [0, 1, 2].forEach((i) => { g.fillStyle = `rgba(${i === 0 ? PAL.o : PAL.l},.7)`; g.beginPath(); g.arc(24 + i * 22, 22, 6, 0, 7); g.fill(); });
        [0.7, 0.45, 0.6, 0.3].forEach((f, i) => { g.fillStyle = `rgba(${PAL.tx},${0.18 - i * 0.02})`; g.fillRect(24, 58 + i * 34, (p.w - 48) * f, 12); }); }),
      cursor: (p) => sprite(40 * p.k, 56 * p.k, p.blur, (g) => { g.scale(p.k, p.k); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 44); g.lineTo(11, 33); g.lineTo(19, 52); g.lineTo(27, 48); g.lineTo(19, 30); g.lineTo(34, 30); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#150A24'; g.stroke(); }),
      onda: (p) => sprite(p.n * 11, 120, p.blur, (g) => { for (let i = 0; i < p.n; i++) { const h = 14 + 96 * Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.21)); g.fillStyle = `rgba(${PAL.l},${p.a ?? 0.5})`; rr(g, i * 11, 60 - h / 2, 6, h, 3); g.fill(); } }),
      frames: (p) => sprite(330, 190, p.blur, (g) => { [-7, 0, 7].forEach((rot, i) => { g.save(); g.translate(55 + i * 110, 95); g.rotate((rot * Math.PI) / 180); rr(g, -45, -56, 90, 112, 8); g.fillStyle = `rgba(${i === 1 ? PAL.o : PAL.v},${p.a ?? 0.5})`; g.fill(); g.fillStyle = `rgba(${PAL.tx},.35)`; g.fillRect(-32, 20, 50, 8); g.restore(); }); }),
      punto: (p) => sprite(p.r * 2, p.r * 2, p.blur, (g) => { g.fillStyle = p.col; g.beginPath(); g.arc(p.r, p.r, p.r, 0, 7); g.fill(); }),
    };
    const items = [];
    const pon = (p, capa) => { const s = DIB[p.t](p); items.push({ s, capa, x: p.x, y: p.y, prof: p.prof ?? 0.6, dir: p.dir || [(r() - 0.5) * 2, -0.6 - r() * 0.4] }); };
    // orbes: la luz de las presentaciones (gradiente radial, se mueven despacio)
    const orbs = [];
    for (let i = 0; i < orbes; i++) orbs.push({ x: 120 + r() * 840, y: 100 + r() * 1150, rad: 300 + r() * 220, col: i % 3 === 2 ? PAL.o : i % 2 ? PAL.l : PAL.v, a: (i % 3 === 2 ? 0.45 : 1) * PAL.av, dir: [(r() - 0.5) * 160, (r() - 0.5) * 120] });
    for (let i = 0; i < bokeh; i++) {
      const rad = 10 + r() * 60, blur = 6 + r() * 20, col = [PAL.v, PAL.l, PAL.o][Math.floor(r() * 3)];
      pon({ t: 'punto', r: rad, blur, col: `rgba(${col},${(0.25 + r() * 0.35).toFixed(2)})`, x: r() * 1080, y: r() * 1350, prof: 0.4 + r() * 0.8 }, 'fondo');
    }
    fondo.forEach((p) => pon(p, 'fondo')); frente.forEach((p) => pon(p, 'frente'));
    let ultimo = null;
    const esc = {
      fondoCv: cvF, frenteCv: cvR,
      alFrente: () => q.appendChild(cvR),
      dibuja(t) {
        const activo = (o, d) => (t >= o.t && t < o.t + d ? t.toFixed(3) : 0);
        const u = M.campana(M.seg(t, 0.2, dur - 0.65)), key = u.toFixed(5) + '|' + ondas.map((o) => activo(o, 0.7)).join() + '|' + halos.map((o) => activo(o, o.dur || 1.4)).join() + '|' + focos.map((o) => activo(o, o.dur || 1.6)).join();
        if (key === ultimo) return; ultimo = key;
        const gF = cvF.getContext('2d'), gR = cvR.getContext('2d');
        gF.clearRect(0, 0, M.W, M.H); gR.clearRect(0, 0, M.W, M.H);
        for (const o of orbs) {
          const x = o.x + o.dir[0] * u, y = o.y + o.dir[1] * u, rad = o.rad * (1 + 0.08 * u);
          const gr = gF.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${o.col},${o.a})`); gr.addColorStop(1, `rgba(${o.col},0)`);
          gF.fillStyle = gr; gF.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        }
        for (const o of halos) { // halo: una luz suave que crece detrás de algo y se apaga
          const d = o.dur || 1.4; if (t < o.t || t >= o.t + d) continue;
          const v = M.campana(M.seg(t, o.t, o.t + d)), rad = o.r * (0.85 + 0.25 * M.seg(t, o.t, o.t + d));
          const gr = gF.createRadialGradient(o.x, o.y, 0, o.x, o.y, rad); gr.addColorStop(0, `rgba(${o.col || PAL.o},${((o.a ?? 0.45) * v).toFixed(3)})`); gr.addColorStop(1, `rgba(${o.col || PAL.o},0)`);
          gF.fillStyle = gr; gF.fillRect(o.x - rad, o.y - rad, rad * 2, rad * 2);
        }
        let fb = 0; // foco de cámara: el fondo se desenfoca un poco más y vuelve (rack focus)
        for (const o of focos) { const d = o.dur || 1.6; if (t >= o.t && t < o.t + d) fb = Math.max(fb, (o.b || 10) * M.campana(M.seg(t, o.t, o.t + d))); }
        V.pone(cvF, 'filter', fb > 0.05 ? `blur(${fb.toFixed(2)}px)` : '');
        for (const it of items) {
          const g = it.capa === 'frente' ? gR : gF, m = (it.capa === 'frente' ? 70 : 34) * it.prof * u;
          g.drawImage(it.s.cv, it.x - it.s.pad + it.dir[0] * m, it.y - it.s.pad + it.dir[1] * m);
        }
        for (const o of ondas) { // ondas de impacto
          if (t < o.t || t >= o.t + 0.7) continue;
          const v = M.seg(t, o.t, o.t + 0.7), rad = o.r * (0.4 + 3.8 * M.outC(v));
          gR.strokeStyle = `rgba(${o.col || PAL.o},${(0.85 * (1 - v)).toFixed(3)})`; gR.lineWidth = 6 * (1 - v) + 1;
          gR.beginPath(); gR.arc(o.x, o.y, rad, 0, Math.PI * 2); gR.stroke();
        }
      },
    };
    return esc;
  };
})();
