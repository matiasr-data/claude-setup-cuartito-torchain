// SLIDES · Carrusel Animado · Viegas Academy
// Los tipos de slide que se repiten entre carruseles: regla (con dos terminales), lista (tarjeta + frases), giro y CTA.
// Movimiento natural: entradas con desenfoque y la curva (.16,1,.3,1), sin rebotes forzados.
// Cada slide tiene UN gesto propio para no repetirse: 'brillo' · 'subrayado' · 'halo' · 'foco'.
(function () {
  const M = window.MOTOR, V = window.V;
  const S = (window.S = {});
  const { tf, pone, linea, gigante } = V;
  S.centro = (e) => ({ x: e.offsetLeft + e.offsetWidth / 2, y: e.offsetTop + e.offsetHeight * 0.6 });

  // el gesto de énfasis de un slide, sobre un elemento ya colocado (antes de partirlo en letras)
  S.gesto = (q, tipo, el, c, esc) => {
    if (tipo === 'brillo') { const b = V.brillo(el, c.tema === 'lavanda' ? 'rgba(167,139,250,.95)' : 'rgba(255,255,255,.9)'); return (t, t0) => b.at(t, t0, 1.1); }
    if (tipo === 'subrayado') { const s = V.subrayado(q, el, c.acento, 7, 9); return (t, t0) => s.at(t, t0, 0.6, 0.9, 0.55); }
    return () => {}; // 'halo' y 'foco' se pintan en la escena (ver S.escenaGesto)
  };
  S.escenaGesto = (tipo, t0, el, c) => {
    const p = S.centro(el);
    if (tipo === 'halo') return { halos: [{ t: t0, dur: 1.6, x: p.x, y: p.y, r: Math.max(260, el.offsetWidth * 0.55), col: c.tema === 'lavanda' ? '124,58,237' : '242,200,75', a: c.tema === 'lavanda' ? 0.28 : 0.4 }] };
    if (tipo === 'foco') return { focos: [{ t: t0, dur: 1.8, b: 12 }] };
    return {};
  };
  const sonidoGesto = { brillo: 'brillo', subrayado: 'barrido', halo: 'campana', foco: 'barrido' };

  // ---------- regla: píldora · palabra · definición · cuerpo · dos terminales (✗ y ✓) · barra de cierre ----------
  // d = { tema, et, pill, palabra, def, cuerpo, mal:[rótulo, nota, título, comando, salida], bien:[...], fecho, numero, estilo, gesto }
  S.regla = (q, n, d) => {
    const c = V.fondo(q, d.tema, n); c.tema = d.tema; V.cab(q, c, M.MARCA.cabecera, d.et);
    const P = {};
    P.pill = V.pildora(q, d.pill, 72, 150, c.acento, c.acentoTx, -4);
    P.palabra = gigante(q, 'ant', d.palabra, 270, 936, { x: 68, base: 478 }, { color: c.tx });
    P.def = linea(q, 'raj', d.def, { x: 72, base: 546, fs: 50 }, { color: c.mudo });
    P.cuerpo = V.bloque(q, 'raj6', d.cuerpo, 72, 566, 936, { color: c.tx, fontSize: '35px' });
    const terminal = (lado, base, ok) => {
      const ic = V.icono(q, ok, 72, base - 33, c);
      const r = linea(q, 'raj', lado[0], { x: 126, base, fs: 36 }, { color: c.tx });
      const nota = linea(q, 'raj', lado[1], { x: 126 + r.offsetWidth + 16, base, fs: 34 }, { color: c.mudo, fontWeight: 600 });
      const v = V.ventana(q, { x: 72, y: base + 16, w: 936, h: 152, titulo: lado[2], tema: d.tema });
      const l1 = M.el(v.body, 'div', null, null, { font: '500 25px/1 "JetBrains Mono", monospace', whiteSpace: 'nowrap', color: v.C.tx });
      M.el(l1, 'span', null, '❯ ', { color: v.C.mudo });
      const cmd = M.el(l1, 'span', null, lado[3]);
      const out = M.el(v.body, 'div', null, lado[4], { font: '500 22px/1 "JetBrains Mono", monospace', padding: '16px 0 0', whiteSpace: 'nowrap', color: v.C.mudo });
      return { ic, r, nota, v, cmd, out, texto: lado[3] };
    };
    P.mal = terminal(d.mal, 718, false);
    P.bien = terminal(d.bien, 930, true);
    P.fecho = M.el(q, 'div', 'barra', d.fecho, { top: '1124px', background: c.acento, color: c.acentoTx });
    V.pie(q, c);
    const g0 = 1.6; // el gesto, cuando la palabra ya llegó
    const extra = S.escenaGesto(d.gesto, g0, P.palabra, c);
    const esc = V.escena(q, Object.assign({ tema: d.tema, dur: 6, semilla: n * 3, bokeh: 7,
      fondo: [{ t: 'numero', txt: String(d.numero).padStart(2, '0'), fs: 560, x: 600, y: 96, blur: 1.5, prof: 0.4, a: d.tema === 'noche' ? 0.13 : 0.16, lw: 4 }],
      frente: [{ t: 'punto', r: 90, blur: 30, col: d.tema === 'noche' ? 'rgba(192,132,252,.32)' : 'rgba(124,58,237,.26)', x: 1000, y: 620, prof: 1.2 },
        { t: 'rayo', size: 170, x: 1000, y: 1215, blur: 20, prof: 1.1, a: 0.55 }] }, extra));
    const gesto = S.gesto(q, d.gesto, P.palabra, c, esc);
    P.pch = V.partir(P.palabra, 'char'); P.wDef = V.partir(P.def, 'word'); P.wCuerpo = V.partir(P.cuerpo, 'word');
    P.rot1 = [P.mal.ic, P.mal.r, P.mal.nota]; P.rot2 = [P.bien.ic, P.bien.r, P.bien.nota];
    esc.alFrente();
    window.seek = (t) => {
      esc.dibuja(t);
      P.pill.dibuja(V.entrada(t, 0.5, 0.9, { x: -34, blur: 10 }));
      V.revela(P.pch, t, { a: 0.6, paso: 0.045, dur: 1.0, estilo: d.estilo || 'sube', blur: 18, y: 44 });
      gesto(t, g0);
      V.revela(P.wDef, t, { a: 1.05, paso: 0.05, estilo: 'sube', blur: 12, y: 20 });
      V.revela(P.wCuerpo, t, { a: 1.3, clave: (p) => p._linea, paso: 0.16, dur: 0.9, estilo: 'enfoque', blur: 16 });
      // las terminales: la ventana entra, se escribe el comando, aparece la salida
      V.revela(P.rot1, t, { a: 1.8, paso: 0.06, estilo: 'sube', blur: 10, y: 16 });
      V.revela([P.mal.v.el], t, { a: 1.85, dur: 1.0, estilo: 'ventana', blur: 12, y: 30 });
      const f1 = V.escribe(P.mal.cmd, P.mal.texto, t, 2.25, 34);
      V.revela([P.mal.out], t, { a: f1 + 0.1, dur: 0.8, estilo: 'enfoque', blur: 10 });
      V.revela(P.rot2, t, { a: 2.8, paso: 0.06, estilo: 'sube', blur: 10, y: 16 });
      V.revela([P.bien.v.el], t, { a: 2.85, dur: 1.0, estilo: 'ventana', blur: 12, y: 30 });
      const f2 = V.escribe(P.bien.cmd, P.bien.texto, t, 3.25, 34);
      V.revela([P.bien.out], t, { a: f2 + 0.1, dur: 0.8, estilo: 'enfoque', blur: 10 });
      V.revela([P.fecho], t, { a: 4.35, dur: 0.9, estilo: 'lado', x: 46, blur: 12 });
      return true;
    };
    M.slide({ indice: n, duracion: 6, golpes: [
      { t: 0.5, tipo: 'barrido', que: 'entra la píldora', ganancia: 0.6 }, { t: 1.0, tipo: 'barrido', que: 'entra la palabra' },
      { t: 2.0, tipo: sonidoGesto[d.gesto] || 'brillo', que: 'gesto de énfasis', ganancia: 0.8 },
      { t: 2.5, tipo: 'tecla', que: 'escribe' }, { t: 3.5, tipo: 'tecla', que: 'escribe' }, { t: 4.5, tipo: 'clic', que: 'entra la barra' },
    ] });
  };

  // ---------- lista: círculo · nombre · ventana con demo · tres frases · barra ----------
  // d = { tema, num, nombre, sub, frases[3], barra, titulo, demo(g, t, p), estilo, gesto }
  S.lista = (q, n, d, paleta) => {
    const c = V.fondo(q, d.tema, 30 + n); c.tema = d.tema; V.cab(q, c, M.MARCA.cabecera, 'FUNDAMENTO ' + d.num);
    const P = {};
    P.circ = M.el(q, 'div', 'circulo', null, { background: c.acento, top: '140px' });
    M.el(P.circ, 'span', null, d.num, { color: c.acentoTx });
    P.nombre = gigante(q, 'ant', d.nombre, 128, 738, { x: 270, base: 248 }, { color: c.tx });
    P.sub = linea(q, 'raj', d.sub, { x: 272, base: 302, fs: 40 }, { color: c.mudo, fontWeight: 600 });
    const p = paleta(d.tema);
    const win = V.ventana(q, { x: 72, y: 352, w: 560, h: 700, titulo: d.titulo, tema: d.tema });
    win.body.style.padding = '0';
    const cv = M.el(win.body, 'canvas', null, null, { display: 'block' }); cv.width = 560; cv.height = 658; const g = cv.getContext('2d');
    const col = M.el(q, 'div', 'frases', null, { color: c.tx });
    const frasesEl = d.frases.map((f, i) => { if (i) M.el(col, 'div', 'fio', null, { background: c.fio }); return M.el(col, 'div', 'frase', f); });
    col.style.top = (352 + (700 - col.offsetHeight) / 2) + 'px';
    P.barra = M.el(q, 'div', 'barra', d.barra, { top: '1092px', background: c.acento, color: c.acentoTx });
    V.pie(q, c);
    const g0 = 1.5;
    const extra = S.escenaGesto(d.gesto, g0, P.nombre, c);
    const esc = V.escena(q, Object.assign({ tema: d.tema, dur: 6, semilla: 40 + n, bokeh: 7,
      fondo: [{ t: 'diamantes', n: 4, x: 760, y: 1140, blur: 2, prof: 0.6, a: 0.6 }],
      frente: [{ t: 'punto', r: 90, blur: 30, col: d.tema === 'noche' ? 'rgba(192,132,252,.32)' : 'rgba(124,58,237,.26)', x: 1010, y: 360, prof: 1.2 },
        { t: 'rayo', size: 170, x: 1000, y: 1215, blur: 20, prof: 1.1, a: 0.55 }] }, extra));
    const gesto = S.gesto(q, d.gesto, P.nombre, c, esc);
    P.nch = V.partir(P.nombre, 'char'); P.wSub = V.partir(P.sub, 'word');
    P.frases = frasesEl.map((f) => V.partir(f, 'word'));
    esc.alFrente();
    window.seek = (t) => {
      esc.dibuja(t);
      V.revela([P.circ], t, { a: 0.45, dur: 1.0, estilo: 'enfoque', blur: 14 });
      V.revela(P.nch, t, { a: 0.55, paso: 0.04, dur: 1.0, estilo: d.estilo || 'sube', blur: 16, y: 40 });
      gesto(t, g0);
      V.revela(P.wSub, t, { a: 1.0, paso: 0.05, estilo: 'sube', blur: 12, y: 20 });
      V.revela([win.el], t, { a: 1.1, dur: 1.1, estilo: 'ventana', blur: 14, y: 36 });
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 560, 658); g.fillStyle = p.bg; g.fillRect(0, 0, 560, 658);
      g.setTransform(0.94, 0, 0, 0.94, 16.8, -16); d.demo(g, t, p);
      P.frases.forEach((ws, i) => V.revela(ws, t, { a: 3.0 + i * 0.5, paso: 0.035, dur: 0.8, estilo: 'sube', blur: 12, y: 22, salida: [2.6, 2.85] }));
      V.revela([P.barra], t, { a: 4.35, dur: 0.9, estilo: 'lado', x: 46, blur: 12 });
      return true;
    };
    M.slide({ indice: n, duracion: 6, golpes: [
      { t: 0.5, tipo: 'barrido', que: 'entra el nombre' }, { t: 1.5, tipo: 'clic', que: 'entra la ventana', ganancia: 0.6 },
      { t: 2.0, tipo: sonidoGesto[d.gesto] || 'brillo', que: 'gesto de énfasis', ganancia: 0.8 },
      ...(d.golpes || []),
      { t: 3.0, tipo: 'clic', que: 'frase 1', ganancia: 0.5 }, { t: 3.5, tipo: 'clic', que: 'frase 2', ganancia: 0.5 }, { t: 4.0, tipo: 'clic', que: 'frase 3', ganancia: 0.5 },
      { t: 4.5, tipo: 'barrido', que: 'entra la barra', ganancia: 0.6 },
    ].filter((e, i, arr) => arr.findIndex((o) => o.t === e.t) === i) });
  };

  // ---------- giro (violeta, solo frase): la palabra grande se enfoca y la cruza un brillo ----------
  S.giro = (q, { indice, palabras, l1, l2, l3, grande, cuerpo }) => {
    const c = V.fondo(q, 'violeta', 8); c.tema = 'violeta'; V.cab(q, c);
    const P = {};
    P.et = M.el(q, 'div', 'abs mono', null, { fontSize: '22px', color: c.tx, display: 'flex', fontWeight: 700 });
    P.spans = [];
    palabras.forEach((p, i) => { if (i) M.el(P.et, 'span', null, '·', { padding: '4px 4px' }); P.spans.push(M.el(P.et, 'span', null, p, { padding: '4px 8px', borderRadius: '6px', display: 'inline-block' })); });
    M.coloca(P.et, { x: 64, base: 400 });
    P.l1 = linea(q, 'raj', l1, { x: 72, base: 540, fs: 92 }, { color: c.tx, fontWeight: 600 });
    P.l2 = linea(q, 'raj', l2, { x: 72, base: 632, fs: 92 }, { color: c.mudo, fontWeight: 600 });
    P.l3 = linea(q, 'raj', l3, { x: 72, base: 766, fs: 92 }, { color: c.tx });
    P.big = gigante(q, 'ant', grande, 300, 936, { x: 66, base: 1100 }, { color: c.acento });
    P.b1 = linea(q, 'raj6', cuerpo[0], { x: 72, base: 1186, fs: 38 }, { color: c.tx });
    P.b2 = linea(q, 'raj6', cuerpo[1], { x: 72, base: 1232, fs: 38 }, { color: c.tx });
    const esc = V.escena(q, { tema: 'violeta', dur: 6, semilla: indice * 5, bokeh: 8,
      fondo: [{ t: 'rayo', size: 820, x: 470, y: 120, blur: 6, prof: 0.3, col: 'rgba(241,238,251,.09)' }],
      frente: [{ t: 'rayo', size: 260, x: 900, y: 470, blur: 26, prof: 1.3, a: 0.6 }, { t: 'punto', r: 80, blur: 28, col: 'rgba(242,200,75,.35)', x: -60, y: 860, prof: 1.2 }],
      focos: [{ t: 1.4, dur: 1.6, b: 10 }] });
    const brillo = V.brillo(P.big, 'rgba(255,255,255,.9)');
    P.w1 = V.partir(P.l1, 'word'); P.w2 = V.partir(P.l2, 'word'); P.w3 = V.partir(P.l3, 'word'); P.gch = V.partir(P.big, 'char');
    P.wb = [...V.partir(P.b1, 'word').map((p) => ((p._g = 0), p)), ...V.partir(P.b2, 'word').map((p) => ((p._g = 1), p))];
    esc.alFrente();
    window.seek = (t) => {
      esc.dibuja(t);
      V.revela(P.spans, t, { a: 0.5, paso: 0.07, estilo: 'enfoque', blur: 14 });
      V.revela(P.w1, t, { a: 0.8, paso: 0.05, estilo: 'sube', blur: 14, y: 26 });
      V.revela(P.w2, t, { a: 1.05, paso: 0.05, estilo: 'sube', blur: 14, y: 26 });
      V.revela(P.w3, t, { a: 1.45, paso: 0.05, estilo: 'sube', blur: 14, y: 26 });
      V.revela(P.gch, t, { a: 1.7, paso: 0.05, dur: 1.2, estilo: 'enfoque', blur: 26 });
      brillo.at(t, 3.0, 1.2);
      V.revela(P.wb, t, { a: 3.2, clave: (p) => p._g, paso: 0.18, dur: 0.9, estilo: 'enfoque', blur: 16 });
      P.spans.forEach((s, i) => { const on = t >= 3.5 + i * 0.4 && t < 3.85 + i * 0.4; pone(s, 'background', on ? c.acento : 'transparent'); pone(s, 'color', on ? c.acentoTx : c.tx); });
      return true;
    };
    M.slide({ indice, duracion: 6, golpes: [
      { t: 0.5, tipo: 'barrido', que: 'entra el texto' }, { t: 1.5, tipo: 'barrido', que: 'entra la palabra' }, { t: 3.0, tipo: 'brillo', que: 'brillo en la palabra' },
      { t: 3.5, tipo: 'clic', que: 'recorre las palabras', ganancia: 0.5 }, { t: 4.0, tipo: 'clic', que: 'recorre las palabras', ganancia: 0.5 },
    ] });
  };

  // ---------- iconos de los entregables (SVG propios, trazo claro + acento) ----------
  const ICONOS = {
    // archivo .md con un destello naranja (evoca a Claude sin copiar su logotipo)
    md: (a) => `<path d="M15 6h22l13 13v37a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z" fill="rgba(255,255,255,.06)" stroke="#F1EEFB" stroke-width="3" stroke-linejoin="round"/><path d="M37 6v13h13" fill="none" stroke="#F1EEFB" stroke-width="3" stroke-linejoin="round"/>` +
      [0, 45, 90, 135].map((g) => `<line x1="31" y1="31" x2="31" y2="53" transform="rotate(${g} 31 42)" stroke="#E07A4F" stroke-width="4.5" stroke-linecap="round"/>`).join('') +
      `<text x="17" y="24" font-family="JetBrains Mono" font-weight="700" font-size="10" fill="${a}">.md</text>`,
    escalera: (a) => [0, 1, 2, 3, 4, 5, 6].map((k) => `<rect x="${7 + k * 7.3}" y="${54 - (k + 1) * 6.4}" width="5.6" height="${(k + 1) * 6.4}" rx="1.6" fill="${a}" opacity="${(0.35 + k * 0.1).toFixed(2)}"/>`).join('') +
      `<line x1="6" y1="56" x2="58" y2="56" stroke="#F1EEFB" stroke-width="3" stroke-linecap="round"/>`,
    seek: (a) => `<path d="M20 12 9 22l11 10M44 12l11 10-11 10M36 9l-8 26" fill="none" stroke="#F1EEFB" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<line x1="7" y1="50" x2="57" y2="50" stroke="#F1EEFB" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>` +
      [12, 22, 32, 42, 52].map((x) => `<line x1="${x}" y1="46" x2="${x}" y2="54" stroke="#F1EEFB" stroke-opacity=".45" stroke-width="2"/>`).join('') +
      `<line x1="27" y1="40" x2="27" y2="60" stroke="${a}" stroke-width="3.4" stroke-linecap="round"/><path d="M21 38h12l-6 6z" fill="${a}"/>`,
    guia: (a) => `<rect x="6" y="10" width="52" height="44" rx="7" fill="rgba(255,255,255,.06)" stroke="#F1EEFB" stroke-width="3"/><line x1="6" y1="21" x2="58" y2="21" stroke="#F1EEFB" stroke-width="3"/>` +
      `<circle cx="13" cy="15.5" r="2" fill="#FF5F57"/><circle cx="19.5" cy="15.5" r="2" fill="#FEBC2E"/><circle cx="26" cy="15.5" r="2" fill="#28C840"/><path d="M27 29v17l14-8.5z" fill="${a}"/>`,
    checklist: (a) => `<rect x="12" y="8" width="40" height="50" rx="6" fill="rgba(255,255,255,.06)" stroke="#F1EEFB" stroke-width="3"/>` +
      [20, 32, 44].map((y) => `<path d="M19 ${y}l4 4 7-8" fill="none" stroke="${a}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><line x1="35" y1="${y + 1}" x2="45" y2="${y + 1}" stroke="#F1EEFB" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>`).join(''),
    reel: (a) => `<rect x="10" y="8" width="44" height="48" rx="6" fill="rgba(255,255,255,.06)" stroke="#F1EEFB" stroke-width="3"/>` +
      [16, 28, 40].map((y) => `<rect x="14" y="${y}" width="4" height="6" rx="1" fill="#F1EEFB" opacity=".5"/><rect x="46" y="${y}" width="4" height="6" rx="1" fill="#F1EEFB" opacity=".5"/>`).join('') +
      `<path d="M25 24l14 14M39 24 25 38" stroke="${a}" stroke-width="4" stroke-linecap="round"/>`,
    diamante: (a) => `<path d="M18 10h28l10 14-24 30L8 24z" fill="rgba(242,200,75,.14)" stroke="${a}" stroke-width="3" stroke-linejoin="round"/><path d="M8 24h48M24 10l8 44 8-44M18 10l6 14m22-14-6 14" fill="none" stroke="${a}" stroke-width="2.4" stroke-linejoin="round"/>`,
  };
  S.ICONOS = ICONOS;

  // ---------- CTA (noche + tu foto en recursos/foto.jpg): «comenta PALABRA» y los entregables en tarjetas con icono ----------
  // items: [{ ic: 'md' | 'escalera' | 'seek' | 'guia' | 'checklist' | 'reel' | 'diamante', titulo, sub }] (2 a 4)
  // pal (opcional): otra paleta para el CTA de un estilo propio. { fondo, tx, mudo, acento, carta, borde, cajaIcono, icono, fotoTx, halo, claro }
  S.cta = (q, { kw, pre, items, indice, foto = '../recursos/foto.jpg', nombre = M.MARCA.nombre, pal }) => {
    let c;
    if (pal) {
      c = Object.assign(V.tema('noche'), pal); q.classList.add(pal.claro ? 'lavanda' : 'noche');
      const cv = M.el(q, 'canvas', 'capa'); cv.width = M.W; cv.height = M.H; const g0 = cv.getContext('2d'); g0.fillStyle = pal.fondo; g0.fillRect(0, 0, M.W, M.H);
      q.prepend(cv); M.grano(q, pal.claro ? 0.03 : 0.05, 19);
    } else c = V.fondo(q, 'noche', 19);
    c.tema = 'noche';
    const fotoTx = (pal && pal.fotoTx) || c.tx;
    const P = {};
    // la foto entera, de borde a borde: solo se funde por abajo (sin bordes laterales)
    const fotoBox = M.el(q, 'div', 'abs', null, { left: '0', top: '0', width: '1080px', height: '740px', overflow: 'hidden',
      WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 70%, transparent 100%)', maskImage: 'linear-gradient(to bottom, #000 0%, #000 70%, transparent 100%)' });
    P.foto = M.el(fotoBox, 'img', null, null, { position: 'absolute', left: '0', top: '-40px', width: '1080px', height: '1080px', display: 'block', transformOrigin: '55% 40%' });
    P.foto.src = foto;
    // sombra suave detrás del nombre: un degradado radial, sin líneas rectas
    const sombra = M.el(q, 'canvas', 'abs', null, { left: '0', top: '0' }); sombra.width = 1080; sombra.height = 740;
    const gs = sombra.getContext('2d'), gr = gs.createRadialGradient(150, 150, 0, 150, 150, 560);
    gr.addColorStop(0, 'rgba(11,6,20,.62)'); gr.addColorStop(1, 'rgba(11,6,20,0)'); gs.fillStyle = gr; gs.fillRect(0, 0, 1080, 740);
    P.me = linea(q, 'raj', 'Me llamo', { x: 72, base: 128, fs: 38 }, { color: fotoTx, fontWeight: 600 });
    P.nom = linea(q, 'ant', nombre, { x: 72, base: 192, fs: 60 }, { color: fotoTx });
    P.com = linea(q, 'raj', 'comenta', { cx: 540, base: 700, fs: 66 }, { color: c.tx });
    const KB = 902;
    P.kw = M.el(q, 'div', 'abs ant', null, { color: c.acento, fontSize: '230px' });
    P.letras = kw.split('').map((ch) => M.el(P.kw, 'span', null, ch, { position: 'relative' }));
    M.encaja(P.kw, 860); M.coloca(P.kw, { cx: 540, base: KB });
    const ch = V.cap(parseFloat(P.kw.style.fontSize));
    P.sel = M.el(q, 'div', 'abs', null, { left: (P.kw.offsetLeft - 18) + 'px', top: (KB - ch - 16) + 'px', width: (P.kw.offsetWidth + 36) + 'px', height: (ch + 32) + 'px', background: c.tx, borderRadius: '10px', visibility: 'hidden' });
    q.appendChild(P.kw);
    P.caret = M.el(q, 'div', 'abs', null, { width: '14px', height: ch + 'px', top: (KB - ch) + 'px', borderRadius: '3px', background: c.tx, visibility: 'hidden' });
    P.xs = P.letras.map((l) => P.kw.offsetLeft + l.offsetLeft);
    P.pre = linea(q, 'raj', pre, { cx: 540, base: 962, fs: 40 }, { color: c.tx });
    // las tarjetas de entregables: 2 columnas
    P.cards = items.map((it, i) => {
      const x = 72 + (i % 2) * 480, y = 990 + Math.floor(i / 2) * 120;
      const card = M.el(q, 'div', 'abs', null, { left: x + 'px', top: y + 'px', width: '456px', height: '108px', borderRadius: '18px', background: (pal && pal.carta) || 'rgba(255,255,255,.05)', border: '1px solid ' + ((pal && pal.borde) || 'rgba(255,255,255,.11)'), boxShadow: pal && pal.claro ? '0 20px 40px -26px rgba(29,29,31,.35)' : '0 20px 40px -24px rgba(0,0,0,.9)', transformOrigin: '50% 60%' });
      const caja = M.el(card, 'div', null, null, { position: 'absolute', left: '16px', top: '16px', width: '76px', height: '76px', borderRadius: '16px', background: (pal && pal.cajaIcono) || 'rgba(242,200,75,.10)', border: '1px solid ' + ((pal && pal.cajaBorde) || 'rgba(242,200,75,.22)') });
      caja.innerHTML = `<svg viewBox="0 0 64 64" width="56" height="56" style="position:absolute;left:9px;top:9px">${(ICONOS[it.ic] || ICONOS.checklist)(c.acento).replaceAll('#F1EEFB', (pal && pal.icono) || '#F1EEFB')}</svg>`;
      M.el(card, 'div', 'raj', it.titulo, { position: 'absolute', left: '112px', top: '22px', fontSize: '32px', color: c.tx });
      M.el(card, 'div', 'raj6', it.sub, { position: 'absolute', left: '112px', top: '62px', fontSize: '24px', color: c.mudo, whiteSpace: 'nowrap' });
      return card;
    });
    P.seg = linea(q, 'mono', 'TIENES QUE SEGUIRME PARA RECIBIRLO', { x: 72, base: 1282 }, { fontSize: '18px', color: c.mudo });
    const L = kw.length; const paso = L > 5 ? 0.25 : 0.5; const fin = Math.ceil((1.5 + (L - 1) * paso + 0.25) / 0.5) * 0.5;
    const esc = V.escena(q, pal ? { tema: 'noche', dur: 8, semilla: indice * 7, orbes: 0, bokeh: 0, halos: [{ t: fin - 0.2, dur: 1.8, x: 540, y: 830, r: 460, col: pal.halo || '242,200,75', a: 0.2 }] }
      : { tema: 'noche', dur: 8, semilla: indice * 7, orbes: 2, bokeh: 6,
      frente: [{ t: 'punto', r: 70, blur: 26, col: 'rgba(242,200,75,.40)', x: 990, y: 560, prof: 1.3 }, { t: 'punto', r: 110, blur: 34, col: 'rgba(124,58,237,.35)', x: 980, y: 1230, prof: 1.1 }],
      halos: [{ t: fin - 0.2, dur: 1.8, x: 540, y: 830, r: 460, col: '242,200,75', a: 0.22 }] });
    const brillo = V.brillo(P.kw, 'rgba(255,255,255,.9)');
    P.wMe = V.partir(P.me, 'word'); P.nch = V.partir(P.nom, 'char'); P.wCom = V.partir(P.com, 'word'); P.wPre = V.partir(P.pre, 'word');
    P.wSeg = V.partir(P.seg, 'word');
    esc.alFrente();
    window.seek = (t) => {
      esc.dibuja(t);
      const u = M.campana(M.seg(t, 0.3, 7.4)); tf(P.foto, '', { sx: 1 + 0.05 * u, sy: 1 + 0.05 * u, x: -12 * u }); // la cámara empuja y vuelve
      V.revela(P.wMe, t, { a: 0.5, paso: 0.06, estilo: 'sube', blur: 12, y: 20 });
      V.revela(P.nch, t, { a: 0.65, paso: 0.035, dur: 0.9, estilo: 'sube', blur: 14, y: 30 });
      V.revela(P.wCom, t, { a: 0.9, estilo: 'enfoque', blur: 18 });
      const sel = t >= 0.5 && t < 1.0;
      pone(P.sel, 'visibility', sel ? 'visible' : 'hidden'); pone(P.kw, 'color', sel ? ((pal && pal.fondo) || V.C.noche) : c.acento);
      const n = t < 1.0 || t >= fin ? L : (t >= 1.5 ? M.teclea(t, 1.5, L, paso) : 0);
      P.letras.forEach((l, i) => pone(l, 'visibility', i < n ? 'visible' : 'hidden'));
      const conCaret = t >= 1.0 && t < fin && Math.floor(t / 0.25) % 2 === 0;
      pone(P.caret, 'visibility', conCaret ? 'visible' : 'hidden');
      if (conCaret) pone(P.caret, 'left', (n < L ? P.xs[n] : P.kw.offsetLeft + P.kw.offsetWidth + 8) + 'px');
      brillo.at(t, fin, 1.2);
      V.revela(P.wPre, t, { a: fin + 0.2, paso: 0.04, estilo: 'sube', blur: 12, y: 20 });
      V.revela(P.cards, t, { a: fin + 0.5, paso: 0.5, dur: 1.0, estilo: 'ventana', blur: 12, y: 26 });
      V.revela(P.wSeg, t, { a: fin + 0.5 + items.length * 0.5, paso: 0.03, estilo: 'enfoque', blur: 10 });
      return true;
    };
    M.slide({ indice, duracion: 8, golpes: [
      { t: 0.5, tipo: 'clic', que: 'selecciona' }, { t: 1.0, tipo: 'barrido', que: 'borra la palabra', ganancia: 0.6 },
      ...kw.split('').map((_, i) => ({ t: 1.5 + i * paso, tipo: 'tecla', que: 'letra' })),
      { t: fin, tipo: 'brillo', que: 'brillo en la palabra' },
      ...items.map((_, i) => ({ t: fin + 0.5 + i * 0.5, tipo: 'clic', que: 'entra la tarjeta ' + (i + 1), ganancia: 0.5 })),
    ] });
  };

  // calentamiento: se anima una vez y vuelve al reposo antes de fotografiar el frame 0,
  // así el frame 0 y el último salen del mismo estado del navegador (loop limpio).
  S.calienta = async () => { for (const t of [0.35, 1.2, 2.6, 3.6, 4.3, 0]) { window.seek(t); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); } };
  // monta el slide n de un carrusel: tabla = { n: (q) => ... } (el montaje puede ser async: espera fotos antes de medir)
  S.monta = (tabla) => (n) => M.listo(async () => { await tabla[n](document.getElementById('lienzo')); await S.calienta(); }, V.FUENTES);
})();
