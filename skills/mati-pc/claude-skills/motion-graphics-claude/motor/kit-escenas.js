// kit-escenas.js · ayudas compartidas para las escenas HTML de motion-graphics-claude.
//
// No depende de nada: se carga con <script src="kit-escenas.js"></script> y todo vive en window.VK.
//
//   VK.conector(a, b, {forma, desde, hasta, color, ancho, padre})  línea entre dos nodos MEDIDA EN CADA FOTOGRAMA:
//        con.pinta(x)   dibuja el 0–1 de la línea; sale del borde real de «a» y llega al borde real de «b» aunque los
//                       nodos se muevan, reboten o cambien de tamaño. Nunca escribas coordenadas fijas de líneas.
//        con.punto(u)   punto {x, y} al u (0–1) del recorrido, en las coordenadas del padre (para pulsos que viajan).
//   VK.juntos(n, t0, paso)        instantes de entrada de un diagrama: todos sus nodos entran JUNTOS (≤ 0,5 s en total).
//   VK.icono(nombre, tam, color)  SVG dibujado (play, pausa, check, cruz, flecha…): no depende de que la fuente tenga «▶».
//   VK.simbolos(el)               cambia ▶ ✓ ✕ → … del texto de «el» por esos SVG.
//   VK.pildora({etiqueta, texto, tono, icono, padre})        píldora diseñada: etiqueta «TIP» / «PASO 1» + texto.
//   VK.tarjetaVideo({miniatura, titulo, etiqueta, ancho, padre})  tarjeta de «vídeo anterior» con botón de play dibujado.
//   VK.duracion(T, porDefecto)    duración desde el plan (tiempos.js); si falta, lo apunta y la comprobación da ERROR.
//   VK.comprobar(o) · VK.comprobarEscena(o) · VK.resumen(m)   autocomprobación (la usan comprobar_escena.mjs y render.mjs comprobar):
//        líneas sueltas, línea hacia un nodo que no se ve, texto sobre la cara o fuera de la zona segura, texto cortado,
//        textos solapados, glifos vacíos (tofu «□»), fuentes que no están instaladas, nodos de un diagrama que salen de uno en uno.
(function () {
  'use strict';
  if (window.VK && window.VK.__version) return;   // ya cargado (p. ej. inyectado dos veces)
  const SVGNS = 'http://www.w3.org/2000/svg';
  const cl = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const VK = (window.VK = { __version: '2026-10-27.2', conectores: [], avisos: [] });

  // ------------------------------------------------------------------ estilos de las piezas (una sola vez)
  function estilos() {
    if (document.getElementById('vk-estilos')) return;
    const s = document.createElement('style'); s.id = 'vk-estilos';
    s.textContent = `
    .vk-lineas { position:absolute; left:0; top:0; width:10px; height:10px; overflow:visible; pointer-events:none; }
    .vk-ico { display:inline-block; vertical-align:-0.12em; flex:none; }
    .vk-pildora { display:inline-flex; align-items:center; gap:16px; padding:12px 28px 12px 12px; border-radius:999px; white-space:nowrap;
      font-family:var(--fuente, 'Inter','Segoe UI',sans-serif); font-size:30px; font-weight:650; letter-spacing:-.01em; color:#F4F2EE;
      background:linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.05)); border:1.5px solid rgba(255,255,255,.18);
      box-shadow:0 18px 50px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.14); }
    .vk-pildora.vk-sin-etq { padding-left:28px; }
    .vk-pildora .vk-etq { padding:8px 14px 7px; border-radius:999px; background:var(--acento, #D97757); color:#120a06; font-size:.6em; font-weight:850;
      letter-spacing:.16em; text-transform:uppercase; line-height:1; }
    .vk-pildora .vk-ic { width:1.45em; height:1.45em; border-radius:50%; display:flex; align-items:center; justify-content:center;
      background:var(--acento, #D97757); color:#120a06; flex:none; }
    .vk-pildora.vk-oscuro { background:linear-gradient(180deg, rgba(20,18,23,.92), rgba(13,12,15,.92)); }
    .vk-pildora.vk-coral { background:var(--acento, #D97757); color:#120a06; border-color:transparent; box-shadow:0 18px 44px rgba(217,119,87,.42); }
    .vk-pildora.vk-coral .vk-etq, .vk-pildora.vk-coral .vk-ic { background:#120a06; color:var(--acento, #D97757); }
    .vk-pildora .vk-txt em { font-style:normal; color:var(--acento2, #E78F72); }
    .vk-tv { position:relative; border-radius:22px; overflow:hidden; background:#18171B;
      box-shadow:0 34px 80px rgba(0,0,0,.6), 0 0 0 1.5px rgba(255,255,255,.12); font-family:var(--fuente, 'Inter','Segoe UI',sans-serif); }
    .vk-tv .vk-mini { position:relative; width:100%; aspect-ratio:16/9; background:#222 center/cover no-repeat; }
    .vk-tv .vk-play { position:absolute; left:16px; bottom:16px; width:13%; aspect-ratio:1; border-radius:50%;   /* en la esquina: no tapa la cara ni el título de la miniatura */
      background:var(--acento, #D97757); display:flex; align-items:center; justify-content:center; color:#120a06; box-shadow:0 10px 26px rgba(0,0,0,.5); }
    .vk-tv .vk-info { padding:18px 24px 24px; }
    .vk-tv .vk-etq { display:inline-block; padding:8px 14px 7px; border-radius:999px; background:rgba(217,119,87,.16); border:1px solid rgba(217,119,87,.55);
      color:var(--acento2, #E78F72); font-size:15px; font-weight:850; letter-spacing:.16em; text-transform:uppercase; line-height:1; }
    .vk-tv .vk-tit { margin-top:12px; font-size:30px; font-weight:750; line-height:1.15; color:#F4F2EE; letter-spacing:-.01em; }
    #vk-marcas { position:fixed; inset:0; z-index:2147483647; pointer-events:none; }
    #vk-marcas div { position:absolute; border:3px solid #FF2D55; border-radius:6px; box-shadow:0 0 0 2px rgba(0,0,0,.6); }
    #vk-marcas span { position:absolute; left:0; top:-30px; background:#FF2D55; color:#fff; font:700 15px/1 Consolas,monospace; padding:6px 8px; border-radius:4px; white-space:nowrap; }`;
    (document.head || document.documentElement).appendChild(s);
  }

  // ------------------------------------------------------------------ fuentes del kit (todas con licencia libre OFL)
  // Inter (texto), Inter Tight (titulares), Bricolage Grotesque (titulares con carácter) y JetBrains Mono (código).
  // Están en motor/fuentes/ (licencias en motor/fuentes/licencias/). Se cargan desde la carpeta de este archivo,
  // así funcionan igual en Windows y en Mac sin instalar nada. Para no tocarlas: window.VK_SIN_FUENTES = true.
  const BASE_FUENTES = (() => { try { return new URL('fuentes/', (document.currentScript && document.currentScript.src) || location.href).href; } catch { return 'fuentes/'; } })();
  const FUENTES = [['Inter', 400, 'inter-400.woff2'], ['Inter', 500, 'inter-500.woff2'], ['Inter', 600, 'inter-600.woff2'],
    ['Inter', '700 900', 'inter-700.woff2'], ['Inter Tight', '700 900', 'InterTight-700.ttf'], ['Bricolage Grotesque', '700 900', 'bricolage-700.ttf'],
    ['JetBrains Mono', '400 500', 'jetbrainsmono-500.woff'], ['JetBrains Mono', '600 900', 'jetbrainsmono-700.woff']];
  VK.fuentes = () => {
    if (window.VK_SIN_FUENTES || document.getElementById('vk-fuentes')) return Promise.resolve();
    const s = document.createElement('style'); s.id = 'vk-fuentes';
    s.textContent = FUENTES.map(([f, w, a]) => `@font-face{font-family:'${f}';font-weight:${w};font-display:block;src:url('${BASE_FUENTES}${a}');}`).join(' ');
    (document.head || document.documentElement).appendChild(s);
    // se piden YA todos los pesos (así están cargados antes de window.__listo)
    return Promise.all(FUENTES.map(([f, w]) => document.fonts.load(`${String(w).split(' ')[0]} 40px "${f}"`).catch(() => null)));
  };
  VK.fuentesListas = VK.fuentes();

  // ------------------------------------------------------------------ utilidades de geometría y visibilidad
  let nid = 0;
  const idDe = (el) => { if (!el.dataset) return '?'; if (!el.dataset.vkId) el.dataset.vkId = String(++nid); return el.dataset.vkId; };
  function nombreDe(el) {
    if (!el) return '?';
    if (el.id) return '#' + el.id;
    const tx = (el.textContent || '').replace(/\s+/g, ' ').trim();
    const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return `${el.tagName.toLowerCase()}${cls}${tx ? ` «${tx.slice(0, 32)}${tx.length > 32 ? '…' : ''}»` : ''}`;
  }
  // opacidad que se ve de verdad: la del elemento por la de todos sus padres
  function opacidad(el) {
    let o = 1;
    for (let e = el; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentNode) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
      o *= parseFloat(cs.opacity); if (o <= 0.001) return 0;
    }
    return o;
  }
  const corta = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const area = (r) => Math.max(0, r.right - r.left) * Math.max(0, r.bottom - r.top);
  const distRect = (x, y, r) => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
  const rectDe = (x, y, w, h) => ({ left: x, top: y, right: x + w, bottom: y + h, width: w, height: h });

  // caja de un elemento en las coordenadas de una capa SVG (sigue las transformaciones de la cámara)
  function cajaEn(el, svg) {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    const m = svg.getScreenCTM();
    if (!m) return null;
    const inv = m.inverse();
    const p = [[r.left, r.top], [r.right, r.top], [r.left, r.bottom], [r.right, r.bottom]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(inv));
    const xs = p.map((q) => q.x), ys = p.map((q) => q.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }

  // ------------------------------------------------------------------ conectores medidos en cada fotograma
  function capa(padre) {
    if (padre._vkSvg && padre._vkSvg.isConnected) return padre._vkSvg;
    estilos();
    const s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('class', 'vk-lineas'); s.setAttribute('width', 10); s.setAttribute('height', 10);
    padre.insertBefore(s, padre.firstChild);   // la primera: queda DEBAJO de los nodos, así el extremo redondo se esconde bajo el borde
    padre._vkSvg = s; return s;
  }
  const NORMAL = { derecha: [1, 0], izquierda: [-1, 0], abajo: [0, 1], arriba: [0, -1] };
  function lado(A, B, eje) {   // el lado de A que mira hacia B
    if (eje === 'h') return B.cx >= A.cx ? 'derecha' : 'izquierda';
    return B.cy >= A.cy ? 'abajo' : 'arriba';
  }
  function puntoLado(C, s, dentro, frac) {
    if (frac) return { x: C.x0 + frac[0] * C.w, y: C.y0 + frac[1] * C.h };
    if (s === 'derecha') return { x: C.x1 - dentro, y: C.cy };
    if (s === 'izquierda') return { x: C.x0 + dentro, y: C.cy };
    if (s === 'abajo') return { x: C.cx, y: C.y1 - dentro };
    return { x: C.cx, y: C.y0 + dentro };
  }
  // a, b: elementos (nodos). o: forma 'curva'|'recta'|'codo' · desde/hasta 'auto'|'derecha'|'izquierda'|'arriba'|'abajo'
  //   · puntoA/puntoB [fx, fy] (fracción de la caja, p. ej. [.5, 1] = centro de abajo) · color · ancho · curvatura (0–1)
  //   · padre (dónde va la capa SVG: por defecto, el padre de «a») · conNodos (true: la línea se ve solo si se ven sus nodos)
  VK.conector = function (a, b, o = {}) {
    if (!a || !b) throw new Error('VK.conector: falta un nodo (a o b es null)');
    const svg = o.svg || capa(o.padre || a.parentNode);
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('fill', 'none'); p.style.stroke = o.color || 'var(--acento, #D97757)';
    p.setAttribute('stroke-width', o.ancho || 3); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
    p.style.opacity = 0; svg.appendChild(p);
    const con = { a, b, camino: p, svg, o, x: 0, L: 1 };
    con.pinta = (x = 1) => {
      x = cl(x); con.x = x;
      const A = cajaEn(a, svg), B = cajaEn(b, svg);
      if (!A || !B) { p.style.opacity = 0; return con; }
      const hx = Math.max(B.x0 - A.x1, A.x0 - B.x1), hy = Math.max(B.y0 - A.y1, A.y0 - B.y1);
      const eje = hx >= hy ? 'h' : 'v';
      const sa = o.desde && o.desde !== 'auto' ? o.desde : lado(A, B, eje);
      const sb = o.hasta && o.hasta !== 'auto' ? o.hasta : lado(B, A, eje);
      const dentro = o.dentro ?? 1;   // 1 px por dentro del borde: el trazo nunca deja hueco
      const p0 = puntoLado(A, sa, dentro, o.puntoA), p1 = puntoLado(B, sb, dentro, o.puntoB);
      let d;
      const forma = o.forma || 'curva';
      if (forma === 'recta') d = `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}`;
      else if (forma === 'codo') {
        if (sa === 'derecha' || sa === 'izquierda') { const xm = (p0.x + p1.x) / 2; d = `M ${p0.x} ${p0.y} H ${xm} V ${p1.y} H ${p1.x}`; }
        else { const ym = (p0.y + p1.y) / 2; d = `M ${p0.x} ${p0.y} V ${ym} H ${p1.x} V ${p1.y}`; }
      } else {
        const ka = NORMAL[sa], kb = NORMAL[sb], dist = Math.hypot(p1.x - p0.x, p1.y - p0.y), c = Math.max(24, dist * (o.curvatura ?? 0.45));
        d = `M ${p0.x} ${p0.y} C ${p0.x + ka[0] * c} ${p0.y + ka[1] * c}, ${p1.x + kb[0] * c} ${p1.y + kb[1] * c}, ${p1.x} ${p1.y}`;
      }
      p.setAttribute('d', d);
      const L = p.getTotalLength() || 1; con.L = L;
      p.style.strokeDasharray = `${L} ${L}`; p.style.strokeDashoffset = String(L * (1 - x));
      let op = x > 0 ? 1 : 0;
      if (op && o.conNodos !== false) op *= Math.min(1, opacidad(a) * 1.25, x >= 0.999 ? opacidad(b) * 1.25 : 1);
      p.style.opacity = op;
      return con;
    };
    con.punto = (u) => { const q = p.getPointAtLength(cl(u) * con.L); return { x: q.x, y: q.y }; };
    con.pinta(0);
    VK.conectores.push(con);
    return con;
  };

  // instantes de entrada de un diagrama: entran juntos, con un escalonado corto (el total nunca pasa de «max» s)
  VK.juntos = (n, t0 = 0, paso = 0.08, max = 0.5) => { const s = n > 1 ? Math.min(paso, max / (n - 1)) : 0; return Array.from({ length: n }, (_, i) => t0 + i * s); };

  // ------------------------------------------------------------------ iconos dibujados (no dependen de la fuente)
  const ICONOS = {
    play: (c) => `<path d="M8 5.6v12.8a1.1 1.1 0 0 0 1.7.93l10-6.4a1.1 1.1 0 0 0 0-1.86l-10-6.4A1.1 1.1 0 0 0 8 5.6z" fill="${c}"/>`,
    pausa: (c) => `<rect x="6" y="5" width="4.2" height="14" rx="1.3" fill="${c}"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.3" fill="${c}"/>`,
    check: (c) => `<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    cruz: (c) => `<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round"/>`,
    flecha: (c) => `<path d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    izquierda: (c) => `<path d="M19.5 12h-14M11 6.5L5.5 12l5.5 5.5" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    abajo: (c) => `<path d="M12 4.5v14M6.5 13l5.5 5.5 5.5-5.5" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    arriba: (c) => `<path d="M12 19.5v-14M6.5 11L12 5.5l5.5 5.5" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    mas: (c) => `<path d="M12 5v14M5 12h14" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round"/>`,
    menos: (c) => `<path d="M5 12h14" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round"/>`,
    punto: (c) => `<circle cx="12" cy="12" r="5.5" fill="${c}"/>`,
    estrella: (c) => `<path d="M12 3.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z" fill="${c}"/>`,
  };
  VK.ICONOS = Object.keys(ICONOS);
  VK.icono = (nombre, tam = 24, color = 'currentColor') => {
    const f = ICONOS[nombre]; if (!f) throw new Error(`VK.icono: no existe «${nombre}». Hay: ${VK.ICONOS.join(', ')}`);
    return `<svg class="vk-ico" width="${tam}" height="${tam}" viewBox="0 0 24 24" aria-hidden="true">${f(color)}</svg>`;
  };
  // símbolos de texto que se cambian por iconos dibujados (VK.simbolos)
  VK.SIMBOLOS = { '▶': 'play', '►': 'play', '⏵': 'play', '⏸': 'pausa', '✓': 'check', '✔': 'check', '✕': 'cruz', '✗': 'cruz', '✖': 'cruz',
    '→': 'flecha', '←': 'izquierda', '↓': 'abajo', '↑': 'arriba', '●': 'punto', '★': 'estrella' };
  VK.simbolos = (raiz = document.body) => {
    const re = new RegExp(`[${Object.keys(VK.SIMBOLOS).join('')}]\\uFE0F?`, 'g');
    const hay = new RegExp(re.source);   // sin «g»: re.test() con «g» recuerda dónde se quedó y se saltaba el texto siguiente
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), nodos = [];
    while (w.nextNode()) {
      const n = w.currentNode;
      if (n.parentElement && n.parentElement.closest('script,style,textarea,title,noscript')) continue;   // el código de la escena no se toca
      if (hay.test(n.nodeValue)) nodos.push(n);
    }
    nodos.forEach((n) => {
      const span = document.createElement('span');
      span.innerHTML = n.nodeValue.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(re, (m) => VK.icono(VK.SIMBOLOS[m[0]], '0.9em'));
      n.replaceWith(...span.childNodes);
    });
    return nodos.length;
  };

  // ------------------------------------------------------------------ piezas diseñadas
  const html = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild; };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // píldora: etiqueta corta en mayúsculas (TIP, PASO 1, GRATIS, NUEVO) + texto; *palabra* = palabra clave en coral claro
  VK.pildora = (o = {}) => {
    estilos();
    const txt = esc(o.texto).replace(/\*([^*]+)\*/g, '<em>$1</em>');
    const ic = o.icono ? `<span class="vk-ic">${VK.icono(o.icono, '0.8em')}</span>` : '';
    const el = html(`<div class="vk-pildora ${o.tono ? 'vk-' + o.tono : ''} ${o.etiqueta || ic ? '' : 'vk-sin-etq'}">${ic}${o.etiqueta ? `<span class="vk-etq">${esc(o.etiqueta)}</span>` : ''}<span class="vk-txt">${txt}</span></div>`);
    el.style.position = 'absolute'; el.style.left = '0'; el.style.top = '0';
    if (o.padre) o.padre.appendChild(el);
    return el;
  };
  // tarjeta de otro vídeo (CTA «vídeo anterior»): miniatura 16:9, botón de play DIBUJADO y título legible
  VK.tarjetaVideo = (o = {}) => {
    estilos();
    const etq = o.etiqueta === '' ? '' : `<span class="vk-etq">${esc(o.etiqueta || 'Vídeo anterior')}</span>`;
    const el = html(`<div class="vk-tv" style="width:${o.ancho || 620}px"><div class="vk-mini" style="background-image:url('${esc(o.miniatura)}')"><span class="vk-play">${VK.icono('play', '52%', '#120a06')}</span></div>${etq || o.titulo ? `<div class="vk-info">${etq}${o.titulo ? `<div class="vk-tit">${esc(o.titulo)}</div>` : ''}</div>` : ''}</div>`);
    el.style.position = 'absolute'; el.style.left = '0'; el.style.top = '0';
    if (o.padre) o.padre.appendChild(el);
    return el;
  };

  // duración de la escena desde el plan: si falta, se apunta y la comprobación lo da como ERROR (nada de duraciones por defecto calladas)
  VK.duracion = (T, porDefecto, nombre) => {
    if (T && Number.isFinite(T.dur) && T.dur > 0) return T.dur;
    VK.avisos.push({ tipo: 'duracion-por-defecto', gravedad: window.TT ? 'error' : 'aviso',
      msg: `La escena ${nombre || location.hash || ''} no tiene «dur» en el plan (tiempos.js): usa ${porDefecto} s por defecto. Pon la duración real del tramo.` });
    return porDefecto;
  };

  // ------------------------------------------------------------------ autocomprobación
  const lienzo = document.createElement('canvas'); lienzo.width = 64; lienzo.height = 64;
  let ctx = null;
  const C2 = () => ctx || (ctx = lienzo.getContext('2d', { willReadFrequently: true }));
  const NOTDEF = String.fromCodePoint(0xF0001);   // carácter de uso privado que ninguna fuente dibuja → su forma es la del «□»
  const glifos = new Map(), fuentes = new Map();
  const INVISIBLES = /[\s​-‍⁠︎️­]/;
  function pixeles(fuente, ch) { const c = C2(); c.clearRect(0, 0, 64, 64); c.font = fuente; c.textBaseline = 'middle'; c.fillStyle = '#000'; c.fillText(ch, 6, 32); return c.getImageData(0, 0, 64, 64).data; }
  function glifoMal(fuente, ch) {   // 'tofu' si se dibuja igual que el carácter que no existe; 'vacio' si no se dibuja nada
    const clave = fuente + '|' + ch;
    if (glifos.has(clave)) return glifos.get(clave);
    const a = pixeles(fuente, ch), b = pixeles(fuente, NOTDEF);
    let igual = true, vacio = true;
    for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) igual = false; if (i % 4 === 3 && a[i]) vacio = false; }
    const r = vacio ? 'vacio' : igual ? 'tofu' : null; glifos.set(clave, r); return r;
  }
  const GENERICAS = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|emoji|math|fangsong|ui-serif|ui-sans-serif|ui-monospace|ui-rounded|-apple-system|blinkmacsystemfont)$/i;
  function instalada(fam) {
    if (GENERICAS.test(fam)) return true;
    if (fuentes.has(fam)) return fuentes.get(fam);
    const c = C2(), s = 'mmmmmmmmmmlli WQ@#ñ0123';
    let ok = false;
    for (const base of ['monospace', 'serif', 'sans-serif']) {
      c.font = `72px ${base}`; const w0 = c.measureText(s).width; c.font = `72px "${fam}", ${base}`;
      if (c.measureText(s).width !== w0) { ok = true; break; }
    }
    if (!ok && document.fonts) for (const ff of document.fonts) if (ff.family.replace(/["']/g, '') === fam && ff.status === 'loaded') { ok = true; break; }
    fuentes.set(fam, ok); return ok;
  }
  const familias = (ff) => ff.split(',').map((f) => f.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  function tieneCaja(el, cs) {
    if (/^(IMG|VIDEO|CANVAS)$/.test(el.tagName)) return true;
    if (el.tagName.toLowerCase() === 'svg' && !el.classList.contains('vk-lineas') && !el.classList.contains('lineas')) return true;
    const bg = cs.backgroundColor;
    if (bg && bg !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(bg)) return true;
    if (cs.backgroundImage && cs.backgroundImage !== 'none') return true;
    if (parseFloat(cs.borderTopWidth) > 0 && !/rgba\([^)]*,\s*0\)$/.test(cs.borderTopColor) && cs.borderTopStyle !== 'none') return true;
    if (cs.boxShadow && cs.boxShadow !== 'none') return true;
    return false;
  }
  function trozosTexto() {   // [{el, rect, texto, fuente, familias}] de cada texto visible (agrupado por su elemento)
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), por = new Map(), rg = document.createRange();
    while (w.nextNode()) {
      const n = w.currentNode, v = n.nodeValue;
      if (!v || !v.trim()) continue;
      const el = n.parentElement; if (!el || el.closest('script,style,noscript,title,defs,#vk-marcas')) continue;
      rg.selectNodeContents(n); const r = rg.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
      const g = por.get(el) || { el, rect: null, texto: '' };
      g.rect = g.rect ? { left: Math.min(g.rect.left, r.left), top: Math.min(g.rect.top, r.top), right: Math.max(g.rect.right, r.right), bottom: Math.max(g.rect.bottom, r.bottom) } : { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      g.texto += v; por.set(el, g);
    }
    // lo que esconde un padre con overflow:hidden (un chat que sube, una tira) no se ve: se recorta y, si no queda nada, no cuenta
    const grupos = [...por.values()];
    for (const g of grupos) {
      for (let e = g.el.parentElement; e && e !== document.body; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.overflow === 'visible' && cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        const r = e.getBoundingClientRect();
        g.rect = { left: Math.max(g.rect.left, r.left), top: Math.max(g.rect.top, r.top), right: Math.min(g.rect.right, r.right), bottom: Math.min(g.rect.bottom, r.bottom) };
      }
    }
    return grupos.filter((g) => g.rect.right - g.rect.left > 1 && g.rect.bottom - g.rect.top > 1);
  }

  // o: { zonas: [{x, y, w, h, nombre, tipo: 'cara'|'segura'}], tolerancia (px), selectorNodos, ancho, alto }
  VK.comprobar = (o = {}) => {
    const W = o.ancho || window.__ancho || innerWidth, H = o.alto || window.__alto || innerHeight, tol = o.tolerancia ?? 6;
    const vista = rectDe(0, 0, W, H), P = [];
    const zonas = [...(o.zonas || []), ...(window.__zonas || [])];
    // --- cajas candidatas (nodos, tarjetas, imágenes) donde puede apoyarse una línea
    const cajas = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (el.closest('defs,#vk-marcas') || (el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg')) continue;
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || area(r) > 0.9 * W * H) continue;
      const caja = tieneCaja(el, cs);
      if (!caja && !(el.childNodes.length && [...el.childNodes].some((c) => c.nodeType === 3 && c.nodeValue.trim()))) continue;
      cajas.push({ el, r, op: opacidad(el), caja });
    }
    // --- 1) líneas: cada extremo visible tiene que tocar un nodo (o empalmar con otra línea)
    const caminos = [];
    for (const p of document.querySelectorAll('svg path, svg line, svg polyline')) {
      if (p.closest('defs,[data-libre],#vk-marcas,clipPath,mask,pattern')) continue;
      const due = p.ownerSVGElement;   // los iconos (svg con viewBox: VK.icono, logos) no son conectores
      if (due && (due.classList.contains('vk-ico') || (due.hasAttribute('viewBox') && !due.matches('.lineas,.vk-lineas,[data-conectores]')))) continue;
      const cs = getComputedStyle(p);
      if (cs.stroke === 'none' || parseFloat(cs.strokeWidth) < 1) continue;
      if (cs.fill !== 'none' && !/rgba\([^)]*,\s*0\)$/.test(cs.fill)) continue;   // formas rellenas (iconos, cursores): no son conectores
      const op = opacidad(p); if (op < 0.15) continue;
      let L = 0; try { L = p.getTotalLength(); } catch { continue; }
      if (L < 10) continue;
      const da = cs.strokeDasharray, off = parseFloat(cs.strokeDashoffset) || 0;
      let f = 1;
      if (da && da !== 'none') { const d0 = parseFloat(da); if (d0 >= L * 0.97) f = cl(1 - off / L); }
      if (f < 0.03) continue;
      const m = p.getScreenCTM(); if (!m) continue;
      const pt = (s) => { const q = p.getPointAtLength(s); return new DOMPoint(q.x, q.y).matrixTransform(m); };
      const muestras = Array.from({ length: 25 }, (_, i) => pt((L * f * i) / 24));
      caminos.push({ p, op, f, L, ini: muestras[0], fin: muestras[24], muestras });
    }
    const con = new Map(VK.conectores.map((c) => [c.camino, c]));
    for (const c of caminos) {
      const reg = con.get(c.p);
      const extremos = [['inicio', c.ini, reg && reg.a]];
      if (c.f >= 0.98) extremos.push(['final', c.fin, reg && reg.b]);
      for (const [cual, q, nodo] of extremos) {
        if (q.x < -20 || q.y < -20 || q.x > W + 20 || q.y > H + 20) continue;   // fuera de plano: no se ve
        const id = 'linea:' + idDe(c.p), queL = nombreDe(c.p.parentNode) + ' › trazo ' + idDe(c.p);
        if (nodo) {   // conector registrado: sabemos a qué nodo tiene que llegar
          const r = nodo.getBoundingClientRect(), d = distRect(q.x, q.y, r), op = opacidad(nodo);
          if (d > tol) P.push({ tipo: 'linea-suelta', gravedad: 'error', id, que: queL, punto: { x: q.x, y: q.y }, msg: `el ${cual} de la línea está a ${Math.round(d)} px de su nodo (${nombreDe(nodo)}).` });
          else if (op < 0.35 && c.op > 0.35) P.push({ tipo: 'linea-a-nodo-invisible', gravedad: 'error', id, que: nombreDe(nodo), punto: { x: q.x, y: q.y },
            msg: `la línea ya se ve pero su nodo (${nombreDe(nodo)}) todavía no (opacidad ${op.toFixed(2)}): dibuja la línea cuando los dos nodos ya están.` });
          continue;
        }
        // línea suelta (sin registrar): vale si toca un nodo VISIBLE o empalma con otra línea visible (tronco que se reparte en ramas)
        let ok = false, dvis = Infinity, invisible = null;
        for (const k of cajas) {
          if (k.r.width > W * 0.95 && k.r.height > H * 0.95) continue;
          const d = distRect(q.x, q.y, k.r);
          if (k.op >= 0.35) { if (d < dvis) dvis = d; if (d <= tol) { ok = true; break; } } else if (d <= tol && !invisible) invisible = k;
        }
        if (!ok) for (const o2 of caminos) { if (o2 === c || o2.op < 0.35) continue; if (o2.muestras.some((s) => Math.hypot(s.x - q.x, s.y - q.y) <= tol * 2.5)) { ok = true; break; } }
        if (!ok) P.push({ tipo: 'linea-suelta', gravedad: 'error', id, que: queL, punto: { x: q.x, y: q.y },
          msg: `el ${cual} de la línea no toca ningún nodo visible (el más cercano está a ${Number.isFinite(dvis) ? Math.round(dvis) : '—'} px${invisible ? `; solo toca ${nombreDe(invisible.el)}, que aún no se ve` : ''}). Usa VK.conector(a, b): mide los nodos en cada fotograma.` });
      }
    }
    // --- 2) textos: zonas prohibidas (cara), zona segura, cortados, solapados, glifos y fuentes
    const textos = trozosTexto().map((g) => ({ ...g, op: opacidad(g.el) })).filter((g) => g.op >= 0.35 && corta(g.rect, vista) > 0);
    for (const g of textos) {
      const r = g.rect, a = area(r) || 1, id = 'texto:' + idDe(g.el), que = nombreDe(g.el);
      for (const z of zonas) {
        const zr = rectDe(z.x, z.y, z.w, z.h);
        if ((z.tipo || 'cara') === 'cara') { const c = corta(r, zr); if (c / a > 0.02) P.push({ tipo: 'texto-sobre-' + (z.nombre || 'cara'), gravedad: 'error', id, que, caja: r, msg: `el texto tapa ${z.nombre || 'la cara'} (${Math.round((100 * c) / a)} % del texto encima).` }); }
        else if (corta(r, zr) < a * 0.98 && g.op > 0.8) P.push({ tipo: 'fuera-de-zona-segura', gravedad: 'aviso', id, que, caja: r, msg: `el texto se sale de la zona segura «${z.nombre || 'segura'}».` });
      }
      if (g.op > 0.8 && (r.left < -2 || r.top < -2 || r.right > W + 2 || r.bottom > H + 2)) P.push({ tipo: 'texto-cortado', gravedad: 'aviso', id, que, caja: r, msg: 'el texto se sale del encuadre.' });
      const cs = getComputedStyle(g.el), fuente = `${cs.fontStyle} ${cs.fontWeight} 40px ${cs.fontFamily}`;
      for (const ch of new Set([...g.texto])) {
        if (INVISIBLES.test(ch)) continue;
        const mal = glifoMal(fuente, ch);
        if (mal) P.push({ tipo: 'glifo-' + mal, gravedad: 'error', id: 'glifo:' + ch.codePointAt(0).toString(16), que, caja: r,
          msg: `«${ch}» (U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}) sale ${mal === 'tofu' ? 'como un cuadrado vacío (□)' : 'invisible'}: ninguna fuente lo tiene. Dibújalo con VK.icono() o cambia de fuente.` });
      }
      const fams = familias(cs.fontFamily), prim = fams.find((f) => !GENERICAS.test(f));
      if (prim && !instalada(prim)) { const usa = fams.find((f) => instalada(f)) || 'la del sistema';
        P.push({ tipo: 'fuente-no-instalada', gravedad: 'aviso', id: 'fuente:' + prim, que, msg: `la fuente «${prim}» no está instalada: el texto sale con «${usa}».` }); }
    }
    for (let i = 0; i < textos.length; i++) for (let j = i + 1; j < textos.length; j++) {
      const A = textos[i], B = textos[j];
      if (A.op < 0.6 || B.op < 0.6 || A.el.contains(B.el) || B.el.contains(A.el)) continue;
      const c = corta(A.rect, B.rect), m = Math.min(area(A.rect), area(B.rect)) || 1;
      if (c / m > 0.35) P.push({ tipo: 'texto-solapado', gravedad: 'aviso', id: 'solape:' + idDe(A.el) + '-' + idDe(B.el), que: `${nombreDe(A.el)} y ${nombreDe(B.el)}`,
        caja: { left: Math.max(A.rect.left, B.rect.left), top: Math.max(A.rect.top, B.rect.top), right: Math.min(A.rect.right, B.rect.right), bottom: Math.min(A.rect.bottom, B.rect.bottom) },
        msg: `dos textos se pisan (${Math.round((100 * c) / m)} %).` });
    }
    // --- cajas (tarjetas, nodos, ventanas) cortadas por el borde del encuadre
    const cortadas = cajas.filter((kx) => kx.caja && kx.op >= 0.8 && area(kx.r) <= 0.4 * W * H && !kx.el.closest('.vk-lineas')).map((kx) => ({ kx, fuera: 1 - corta(kx.r, vista) / (area(kx.r) || 1) }))
      .filter((c) => c.fuera > 0.04 && c.fuera < 0.96);
    for (const { kx, fuera } of cortadas) {
      if (cortadas.some((o) => o.kx !== kx && o.kx.el.contains(kx.el))) continue;   // solo la caja de fuera (no la tarjeta Y su vídeo)
      P.push({ tipo: 'caja-cortada', gravedad: 'aviso', id: 'cortada:' + idDe(kx.el), que: nombreDe(kx.el), caja: kx.r,
        msg: `se queda cortada por el borde del encuadre (${Math.round(100 * fuera)} % fuera) sin moverse. Recolócala o haz más pequeña la escena.` });
    }
    // --- 3) cajas grandes (tarjetas, títulos) sobre la cara
    for (const z of zonas) {
      if ((z.tipo || 'cara') !== 'cara') continue;
      const zr = rectDe(z.x, z.y, z.w, z.h), za = area(zr) || 1;
      for (const k of cajas) { if (!k.caja || k.op < 0.5 || k.el.closest('.vk-lineas')) continue; const c = corta(k.r, zr);   // el texto suelto ya lo mira el paso 2
        if (c / za > 0.12) P.push({ tipo: 'tapa-' + (z.nombre || 'cara'), gravedad: 'error', id: 'caja:' + idDe(k.el), que: nombreDe(k.el), caja: k.r, msg: `${nombreDe(k.el)} tapa el ${Math.round((100 * c) / za)} % de ${z.nombre || 'la cara'}.` }); }
    }
    // nodos de diagrama visibles en este instante (para saber si un diagrama sale de uno en uno)
    const nodos = new Set(VK.conectores.flatMap((c) => [c.a, c.b]));
    document.querySelectorAll(o.selectorNodos || '.nodo, .fn, .vk-nodo, [data-nodo]').forEach((n) => nodos.add(n));
    const visibles = [...nodos].filter((n) => opacidad(n) >= 0.5 && corta(n.getBoundingClientRect(), vista) > 0).map((n) => ({ id: idDe(n), que: nombreDe(n) }));
    return { problemas: P, nodos: visibles };
  };

  // recorre la escena entera (window.seek) y resume: o.cada (s entre muestras, 0,2 por defecto) + las opciones de VK.comprobar
  VK.comprobarEscena = async (o = {}) => {
    const dur = window.__duracion || 0, cada = o.cada || 0.2, ts = [];
    for (let t = 0; t < dur - 1e-6; t += cada) ts.push(+t.toFixed(4));
    ts.push(Math.max(0, +(dur - 1 / 60).toFixed(4)));
    const muestras = [];
    for (const t of ts) { await window.seek(t); const r = VK.comprobar(o); muestras.push({ t, ...r }); }
    return VK.resumen(muestras, o);
  };
  // agrupa los problemas repetidos y descarta los de un solo instante que son normales en una entrada (texto que llega desde fuera)
  VK.resumen = (muestras, o = {}) => {
    const cada = muestras.length > 1 ? muestras[1].t - muestras[0].t : 0.2, grupos = new Map();
    muestras.forEach((m, i) => m.problemas.forEach((p) => {
      const key = p.tipo + '|' + p.id; let g = grupos.get(key);
      if (!g) { g = { ...p, tramos: [], veces: 0, mov: 0 }; grupos.set(key, g); }
      if (p.caja && g.caja) g.mov = Math.max(g.mov, Math.abs(p.caja.left - g.caja.left), Math.abs(p.caja.top - g.caja.top));   // ¿se está moviendo?
      const ult = g.tramos[g.tramos.length - 1];
      if (ult && ult.i === i) return;   // el mismo problema dos veces en el mismo instante (p. ej. varios textos con la misma fuente)
      if (ult && ult.i === i - 1) { ult.hasta = m.t; ult.i = i; ult.n++; } else g.tramos.push({ desde: m.t, hasta: m.t, i, n: 1 });
      g.veces++;
    }));
    const salida = [];
    for (const g of grupos.values()) {
      const larga = Math.max(...g.tramos.map((x) => x.n));
      if ((g.tipo === 'texto-cortado' || g.tipo === 'texto-solapado' || g.tipo === 'fuera-de-zona-segura' || g.tipo === 'caja-cortada') && larga < 3) continue;   // entradas y salidas
      if ((g.tipo === 'texto-cortado' || g.tipo === 'caja-cortada') && g.mov > 40) continue;   // se está moviendo (cámara que recorre, tira que avanza): es a propósito
      let grav = g.gravedad;
      // un solo instante (≤ 0,2 s): una línea que se apaga o un nodo que llega un pelo tarde → aviso; si dura más, ERROR
      if ((g.tipo === 'linea-suelta' || g.tipo === 'linea-a-nodo-invisible') && larga < 2) grav = 'aviso';
      salida.push({ tipo: g.tipo, gravedad: grav, msg: g.msg, que: g.que, id: g.id, veces: g.veces,
        tramos: g.tramos.map((x) => [x.desde, x.hasta]), primero: g.tramos[0].desde, punto: g.punto, caja: g.caja });
    }
    // diagrama: ¿los nodos aparecen juntos?
    const aparece = new Map();
    muestras.forEach((m) => m.nodos.forEach((n) => { if (!aparece.has(n.id)) aparece.set(n.id, { t: m.t, que: n.que }); }));
    const ts = [...aparece.values()].sort((a, b) => a.t - b.t);
    if (ts.length >= 3) {
      const extension = ts[ts.length - 1].t - ts[0].t, lim = o.diagramaMax ?? 1.2;
      if (extension > lim) salida.push({ tipo: 'diagrama-uno-a-uno', gravedad: 'aviso', id: 'diagrama', que: `${ts.length} nodos`, primero: ts[0].t, tramos: [[ts[0].t, ts[ts.length - 1].t]], veces: 1,
        msg: `los nodos del diagrama tardan ${extension.toFixed(1)} s en aparecer (${ts.map((x) => x.t.toFixed(1)).join(' · ')} s). Que entren JUNTOS (VK.juntos, ≤ 0,5 s) y destaca cada uno al nombrarlo.` });
    }
    VK.avisos.forEach((a) => salida.push({ ...a, id: a.tipo, que: location.hash || '', primero: 0, tramos: [], veces: 1 }));
    // vídeos que no cargan (archivo que falta, ruta mal escrita, códec que Chrome no lee): la tarjeta saldría negra
    const faltan = new Set([...(window.__videosQueFaltan || [])]);
    document.querySelectorAll('video').forEach((v) => { if (v.error || v.networkState === 3 || (v.readyState === 0 && (v.currentSrc || v.src))) faltan.add(v.currentSrc || v.src); });
    if (faltan.size) {
      const lista = [...faltan].map((s) => decodeURI(String(s)).split('/').slice(-2).join('/'));
      salida.push({ tipo: 'video-no-carga', gravedad: 'error', id: 'videos', que: `${faltan.size} vídeo(s)`, primero: 0, tramos: [], veces: 1,
        msg: `no cargan (no existen o el códec no vale) y sus tarjetas saldrían vacías: ${lista.slice(0, 6).join(', ')}${lista.length > 6 ? ` y ${lista.length - 6} más` : ''}. Primera ruta completa: ${decodeURI(String([...faltan][0]))}` });
    }
    salida.sort((a, b) => (a.gravedad === b.gravedad ? a.primero - b.primero : a.gravedad === 'error' ? -1 : 1));
    return { duracion: window.__duracion, muestras: muestras.length, cada, problemas: salida,
      errores: salida.filter((p) => p.gravedad === 'error').length, avisos: salida.filter((p) => p.gravedad !== 'error').length };
  };

  // marca en rojo lo que falla (para la captura de comprobar_escena.mjs)
  VK.marcar = (problemas) => {
    estilos(); VK.desmarcar();
    const d = document.createElement('div'); d.id = 'vk-marcas';
    problemas.forEach((p) => {
      const r = p.caja || (p.punto ? { left: p.punto.x - 14, top: p.punto.y - 14, right: p.punto.x + 14, bottom: p.punto.y + 14 } : null); if (!r) return;
      const b = document.createElement('div'); b.style.left = r.left - 4 + 'px'; b.style.top = r.top - 4 + 'px'; b.style.width = r.right - r.left + 8 + 'px'; b.style.height = r.bottom - r.top + 8 + 'px';
      const s = document.createElement('span'); s.textContent = p.tipo; b.appendChild(s); d.appendChild(b);
    });
    document.body.appendChild(d);
  };
  VK.desmarcar = () => { const d = document.getElementById('vk-marcas'); if (d) d.remove(); };
})();
