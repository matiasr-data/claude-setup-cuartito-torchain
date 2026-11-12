// Carrusel 1 · "Tu primer carrusel animado con Claude Code" · 9 slides · Viegas Estudio.
// Portada y slide 2 propios; los pasos, el giro y el CTA usan los tipos de slide del motor (slides.js).
(function () {
  const M = window.MOTOR, V = window.V, S = window.S;
  const { tf, pone, linea, gigante } = V;

  // ---------- 01 · portada: la palabra se enfoca letra a letra y la cruza un brillo; el cabezal recorre la línea de tiempo ----------
  function portada(q) {
    const c = V.fondo(q, 'noche', 11); c.tema = 'noche'; V.cab(q, c, M.MARCA.cabecera, 'GUÍA · CLAUDE CODE');
    const P = {};
    P.l1 = linea(q, 'raj', 'Haz tu primer carrusel', { x: 72, base: 400, fs: 80 }, { color: c.tx });
    P.big = gigante(q, 'ant', 'ANIMADO', 560, 820, { x: 66, base: 760 }, { color: c.acento });
    const ch = V.cap(parseFloat(P.big.style.fontSize)), w = P.big.offsetWidth;
    M.coloca(P.l1, { x: 72, base: 760 - ch - 60 });
    P.cursor = M.el(q, 'div', 'abs', null, { left: (66 + w + 22) + 'px', top: (760 - ch + 8) + 'px', width: '14px', height: (ch - 8) + 'px', borderRadius: '3px', background: c.tx });
    P.l3 = linea(q, 'raj', 'con Claude Code, sin timeline', { x: 72, base: 862, fs: 80 }, { color: c.tx });
    M.el(q, 'div', 'abs', null, { left: '72px', top: '952px', width: '936px', height: '2px', background: 'rgba(241,238,251,.22)' });
    P.ticks = [];
    for (let i = 0; i < 16; i++) P.ticks.push(M.el(q, 'div', 'abs', null, { left: (72 + i * 936 / 15 - 1) + 'px', top: (i % 4 ? 946 : 940) + 'px', width: '2px', height: (i % 4 ? 14 : 26) + 'px', background: 'rgba(241,238,251,.32)' }));
    P.cabezal = M.el(q, 'div', 'abs', null, { left: '72px', top: '932px', width: '6px', height: '42px', borderRadius: '3px', background: c.acento });
    let x = 72; P.trio = [];
    ['5 PASOS', '1 CARPETA', '0 KEYFRAMES'].forEach((s, i) => {
      if (i) { P.trio.push(linea(q, 'mono', '·', { x, base: 1062 }, { fontSize: '26px', color: c.acento, fontWeight: 700 })); x += 40; }
      const e = linea(q, 'mono', s, { x, base: 1062 }, { fontSize: '26px', color: c.tx, fontWeight: 700 }); e._clave = true; P.trio.push(e); x += e.offsetWidth + 24;
    });
    const esc = V.escena(q, { tema: 'noche', dur: 8, semilla: 1, bokeh: 9,
      fondo: [{ t: 'clips', w: 500, x: 520, y: 190, blur: 5, prof: 0.5, a: 0.5 }, { t: 'diamantes', n: 5, x: 640, y: 320, blur: 2.5, prof: 0.8, a: 0.7 }, { t: 'cursor', k: 1.3, x: 900, y: 360, blur: 1.5, prof: 1 }],
      frente: [{ t: 'rayo', size: 380, x: 820, y: 1030, blur: 26, prof: 1.3, a: 0.6 }, { t: 'punto', r: 80, blur: 30, col: 'rgba(192,132,252,.35)', x: -70, y: 560, prof: 1.2 }],
      halos: [{ t: 1.9, dur: 1.8, x: 66 + w / 2, y: 760 - ch / 2, r: 560, col: '242,200,75', a: 0.22 }] });
    const brillo = V.brillo(P.big, 'rgba(255,255,255,.9)');
    P.w1 = V.partir(P.l1, 'word'); P.ch = V.partir(P.big, 'char'); P.w3 = V.partir(P.l3, 'word');
    esc.alFrente();
    window.seek = (t) => {
      esc.dibuja(t);
      V.revela(P.w1, t, { a: 0.5, paso: 0.07, estilo: 'sube', blur: 14, y: 26 });
      V.revela(P.ch, t, { a: 0.85, paso: 0.06, dur: 1.1, estilo: 'sube', blur: 22, y: 60 });
      brillo.at(t, 2.0, 1.2);
      pone(P.cursor, 'visibility', (t >= 0.32 && t < 1.9) || (t >= 1.9 && t < 7 && Math.floor(t / 0.5) % 2 === 1) ? 'hidden' : 'visible');
      V.revela(P.w3, t, { a: 1.4, paso: 0.06, estilo: 'sube', blur: 12, y: 22 });
      V.revela(P.trio, t, { a: 1.9, paso: 0.08, estilo: 'enfoque', blur: 18 });
      let u = 0; // el cabezal recorre la pista (2,5 → 4,5) y rebobina (5,0 → 5,5)
      if (t >= 2.5 && t < 4.5) u = M.inOutC(M.seg(t, 2.5, 4.5)); else if (t >= 4.5 && t < 5) u = 1; else if (t >= 5 && t < 5.5) u = 1 - M.inOutC(M.seg(t, 5, 5.5));
      tf(P.cabezal, '', { x: 930 * u });
      P.ticks.forEach((k, i) => pone(k, 'background', u > 0 && i / 15 <= u ? 'rgba(242,200,75,.95)' : 'rgba(241,238,251,.32)'));
      P.trio.filter((e) => e._clave).forEach((e, i) => pone(e, 'color', t >= 5.5 + i * 0.5 && t < 5.95 + i * 0.5 ? c.acento : c.tx));
      return true;
    };
    M.slide({ indice: 1, duracion: 8, golpes: [
      { t: 0.5, tipo: 'barrido', que: 'entra el texto' }, { t: 1.0, tipo: 'barrido', que: 'entra la palabra' }, { t: 2.0, tipo: 'brillo', que: 'brillo en ANIMADO' },
      { t: 2.5, tipo: 'barrido', que: 'el cabezal recorre la pista', ganancia: 0.7 }, { t: 5.0, tipo: 'barrido', que: 'rebobina', ganancia: 0.5 },
      { t: 5.5, tipo: 'clic', que: '5 pasos', ganancia: 0.6 }, { t: 6.0, tipo: 'clic', que: '1 carpeta', ganancia: 0.6 }, { t: 6.5, tipo: 'clic', que: '0 keyframes', ganancia: 0.6 },
    ] });
  }

  // ---------- 02 · slide 2 (lavanda): VIDEO se enfoca, se tacha y se ilumina por detrás ----------
  function slide2(q) {
    const c = V.fondo(q, 'lavanda', 12); c.tema = 'lavanda'; V.cab(q, c);
    const P = {};
    P.top = linea(q, 'raj', 'Todo editor cree que esto es un', { cx: 540, base: 290, fs: 62 }, { color: c.tx });
    P.vw = M.el(q, 'div', 'abs', null, { left: '0', top: '0', width: '1080px', height: '1350px' });
    P.video = gigante(P.vw, 'ant', 'VIDEO', 380, 700, { cx: 540, base: 640 }, { color: c.tx });
    const vw = P.video.offsetWidth, fs = parseFloat(P.video.style.fontSize);
    // el tachado, girado dentro de un SVG: se dibuja cambiando el ancho del rect, nunca con transform CSS
    const tx0 = 540 - vw / 2 - 44, ty0 = 640 - V.cap(fs) * 0.55 - 19, tw = vw + 88;
    const tsv = M.el(P.vw, 'div', 'abs', null, { left: '0', top: '0', width: '1080px', height: '1350px' });
    tsv.innerHTML = `<svg width="1080" height="1350" style="display:block"><rect x="${tx0}" y="${ty0}" width="${tw}" height="38" rx="6" fill="${c.acento}" transform="rotate(-5 ${tx0} ${ty0 + 19})"/></svg>`;
    P.tacha = tsv.querySelector('rect'); P.tachaW = tw;
    P.mid = linea(q, 'raj', 'y es una página que se mueve sola', { cx: 540, base: 730, fs: 52 }, { color: c.tx });
    M.el(q, 'div', 'abs', null, { left: '280px', top: '768px', width: '520px', height: '2px', background: c.fio });
    P.body = V.bloque(q, 'raj6', 'Claude Code no abre After Effects. Escribe una página que se mueve y la fotografía 30 veces por segundo.', 100, 792, 880, { textAlign: 'center', color: c.tx, fontSize: '35px' });
    const nombres = ['Las reglas', 'El guion', 'El código', 'El render', 'La revisión'];
    P.pills = nombres.map((n, i) => {
      const col = i < 4 ? i % 2 : 0.5, fila = Math.floor(i / 2);
      const e = M.el(q, 'div', 'abs', null, { left: (195 + col * 360) + 'px', top: (918 + fila * 90) + 'px', width: '330px', height: '72px', display: 'flex', background: V.C.noche, borderRadius: '14px', overflow: 'hidden' });
      M.el(e, 'div', null, String(i + 1), { width: '72px', display: 'grid', placeItems: 'center', background: c.acento, color: c.acentoTx, font: '400 38px/1 Anton, sans-serif' });
      M.el(e, 'div', null, n, { display: 'flex', alignItems: 'center', paddingLeft: '22px', color: V.C.claro, font: '700 34px/1 Rajdhani, sans-serif' });
      return e;
    });
    P.fecho = linea(q, 'raj', 'El render es lo último, no lo primero.', { cx: 540, base: 1252, fs: 46 }, { color: c.tx });
    const esc = V.escena(q, { tema: 'lavanda', dur: 6, semilla: 2, bokeh: 7,
      fondo: [{ t: 'frames', x: 690, y: 160, blur: 4, prof: 0.6, a: 0.4 }, { t: 'onda', n: 40, x: 70, y: 1190, blur: 3, prof: 0.4, a: 0.35 }],
      frente: [{ t: 'punto', r: 110, blur: 30, col: 'rgba(124,58,237,.30)', x: -90, y: 300, prof: 1.2 }, { t: 'punto', r: 60, blur: 22, col: 'rgba(242,200,75,.45)', x: 1010, y: 860, prof: 1.3 }],
      halos: [{ t: 2.2, dur: 1.8, x: 540, y: 560, r: 420, col: '124,58,237', a: 0.26 }] });
    P.wTop = V.partir(P.top, 'word'); P.vch = V.partir(P.video, 'char'); P.wMid = V.partir(P.mid, 'word'); P.wBody = V.partir(P.body, 'word'); P.wFin = V.partir(P.fecho, 'word');
    esc.alFrente();
    window.seek = (t) => {
      esc.dibuja(t);
      V.revela(P.wTop, t, { a: 0.5, paso: 0.045, estilo: 'sube', blur: 12, y: 22 });
      V.revela(P.vch, t, { a: 0.8, paso: 0.07, dur: 1.1, estilo: 'enfoque', blur: 26 });
      let s = 1; // el tachado se retira con la salida y se vuelve a dibujar en 2,0
      if (t >= 0.12 && t < 0.32) s = 1 - M.inOutC(M.seg(t, 0.12, 0.32)); else if (t >= 0.32 && t < 2.0) s = 0; else if (t >= 2.0 && t < 2.5) s = V.E.out(M.seg(t, 2.0, 2.5));
      const tw2 = s === 1 ? String(P.tachaW) : (P.tachaW * s).toFixed(2); if (P.tacha.getAttribute('width') !== tw2) P.tacha.setAttribute('width', tw2);
      V.revela(P.wMid, t, { a: 2.6, paso: 0.045, estilo: 'sube', blur: 12, y: 20 });
      V.revela(P.wBody, t, { a: 2.9, clave: (p) => p._linea, paso: 0.16, dur: 0.9, estilo: 'enfoque', blur: 18 });
      V.revela(P.pills, t, { a: 3.3, paso: 0.1, dur: 0.9, estilo: 'sube', blur: 12, y: 26 });
      V.revela(P.wFin, t, { a: 4.1, paso: 0.04, estilo: 'sube', blur: 12, y: 18 });
      return true;
    };
    M.slide({ indice: 2, duracion: 6, golpes: [
      { t: 0.5, tipo: 'barrido', que: 'entra el texto' }, { t: 1.0, tipo: 'barrido', que: 'VIDEO se enfoca' },
      { t: 2.0, tipo: 'barrido', que: 'se dibuja el tachado' }, { t: 2.5, tipo: 'campana', que: 'luz detrás de VIDEO', ganancia: 0.7 },
      { t: 3.5, tipo: 'clic', que: 'entran los pasos', ganancia: 0.5 }, { t: 4.5, tipo: 'clic', que: 'cierre', ganancia: 0.5 },
    ] });
  }

  // ---------- 03-07 · los cinco pasos: cada uno entra distinto y tiene su propio gesto ----------
  const PASOS = {
    3: { tema: 'noche', numero: 1, estilo: 'sube', gesto: 'brillo', et: 'ANTES DEL PRIMER PEDIDO', pill: 'PASO 1', palabra: 'reglas', def: 'un CLAUDE.md en la carpeta',
      cuerpo: 'Sin reglas sale bien, con defectos de siempre. Con el archivo en la raíz, Claude lo lee en cada pedido.',
      mal: ['CRUDO', 'pedido sin reglas', 'carrusel — zsh', 'haz un carrusel sobre edición barata', '4 slides · todo entra con fade · el loop salta'],
      bien: ['CON REGLAS', 'CLAUDE.md en la raíz', 'carrusel — CLAUDE.md', 'haz un carrusel sobre edición barata', '120 BPM · frame 0 = portada · esquinas libres'],
      fecho: 'Cada regla borra un defecto del primer intento.' },
    4: { tema: 'lavanda', numero: 2, estilo: 'enfoque', gesto: 'halo', et: 'ANTES DEL CÓDIGO', pill: 'PASO 2', palabra: 'guion', def: 'el storyboard, tiempo por tiempo',
      cuerpo: 'Una línea por tiempo: el momento, lo que se mueve y el sonido. Como un guion de edición, pero en texto.',
      mal: ['A CIEGAS', 'directo al render', 'carrusel — zsh', 'renderiza los 6 slides', '40 min después: no era eso. otra vez.'],
      bien: ['APROBADO', 'primero el STORYBOARD.md', 'carrusel — zsh', 'escribe el STORYBOARD.md y espera mi OK', '4,0 s · entra la palabra · brillo'],
      fecho: 'Corregir una línea cuesta segundos. Un render, minutos.' },
    5: { tema: 'noche', numero: 3, estilo: 'pista', gesto: 'subrayado', et: 'CADA SLIDE ES UNA PÁGINA', pill: 'PASO 3', palabra: 'código', def: 'una función del tiempo',
      cuerpo: 'Un HTML por slide con window.seek(t). Es tu playhead: le das un segundo y dibuja ese frame.',
      mal: ['CON TIMERS', 'setTimeout y requestAnimationFrame', 'slide-03.html — editor', 'setTimeout(entra, 500)', 'frame 37 ≠ frame 37 · el loop salta'],
      bien: ['CON SEEK(T)', 'como mover el playhead', 'slide-03.html — editor', 'window.seek(1.5)', 'mismo t, mismo frame. siempre.'],
      fecho: 'Mismo t, mismo frame. Por eso el loop cierra.' },
    6: { tema: 'lavanda', numero: 4, estilo: 'sube', gesto: 'foco', et: 'DE PÁGINA A MP4', pill: 'PASO 4', palabra: 'render', def: 'Playwright fotografía, ffmpeg une',
      cuerpo: 'Chrome sin ventana saca un PNG por frame. ffmpeg los une a 30 fps, H.264, con su propio sonido.',
      mal: ['GRABAR PANTALLA', 'captura en tiempo real', 'carrusel — zsh', 'grabar pantalla 6 s', 'tirones · 24 fps · texto borroso'],
      bien: ['FRAME A FRAME', 'un PNG por frame', 'carrusel — zsh', 'node scripts/render.mjs video', '180 frames · H.264 · -14 LUFS'],
      fecho: 'Un MP4 por slide. Nunca uno solo.' },
    7: { tema: 'noche', numero: 5, estilo: 'enfoque', gesto: 'brillo', et: 'ANTES DE PUBLICAR', pill: 'PASO 5', palabra: 'revisión', def: 'notas de 1 a 10, hasta llegar a 8',
      cuerpo: 'Hoja de contactos, prueba de loop y una nota por criterio. Corrige los 3 peores y repite.',
      mal: ['A OJO', 'mirar el primer slide y ya', 'carrusel — zsh', 'está listo, publícalo', 'el loop salta en el slide 4. nadie lo vio.'],
      bien: ['CON NOTAS', 'hoja + loop + tabla', 'resultados — zsh', 'pon nota a cada slide y corrige', 'loop 6 → 9 · ritmo 7 → 8 · listo'],
      fecho: 'Lo que no se revisa, se publica con defectos.' },
  };

  window.CARRUSEL = {
    monta: S.monta({
      1: portada, 2: slide2,
      3: (q) => S.regla(q, 3, PASOS[3]), 4: (q) => S.regla(q, 4, PASOS[4]), 5: (q) => S.regla(q, 5, PASOS[5]),
      6: (q) => S.regla(q, 6, PASOS[6]), 7: (q) => S.regla(q, 7, PASOS[7]),
      8: (q) => S.giro(q, { indice: 8, palabras: ['REGLAS', 'GUION', 'CÓDIGO', 'RENDER', 'REVISIÓN'], l1: 'No necesitas saber', l2: 'programar.', l3: 'Necesitas saber', grande: 'dirigir.', cuerpo: ['Los cinco pasos eran de editor.', 'Ninguno era de programador.'] }),
      9: (q) => S.cta(q, { indice: 9, kw: 'CARRUSEL', pre: 'y te mando todo esto:', items: [
        { ic: 'md', titulo: 'CLAUDE.md', sub: 'las reglas, listas para pegar' },
        { ic: 'escalera', titulo: 'Los 7 prompts', sub: 'del pedido crudo al acervo' },
        { ic: 'seek', titulo: 'Plantilla seek(t)', sub: 'un slide que se anima solo' },
        { ic: 'guia', titulo: 'La guía completa', sub: 'paso a paso, con ejemplos' },
      ] }),
    }),
  };
})();
