// INTERFAZ · Carrusel Animado · Viegas Academy
// Piezas visuales para recrear el mundo de la edición dentro de un slide, todas propias y dibujadas en código:
//   UI.icono      icono de app (squircle con degradado) con un glifo: skills, herramientas, conceptos
//   UI.chispa     el destello naranja que evoca a Claude (no es su logotipo)
//   UI.foto       una foto recortada a su caja (object-fit: cover) con el mapa de recorte para dibujar encima
//   UI.reproductor un reproductor con la foto, barra de progreso, tiempo y botón de play
//   UI.timeline   línea de tiempo con pistas (video, texto, audio, música, fx), miniaturas, ondas, keyframes y cabezal
//   UI.visor      la interfaz de una cámara encima de la foto: REC, código de tiempo, cuadrícula, foco, histograma, ajustes
//   UI.ciclo      un valor que avanza durante el slide y rebobina antes del final (el loop cierra al píxel)
// Todo es función pura del estado que se le pasa: cada pieza se repinta solo si su estado cambió.
(function () {
  const M = window.MOTOR;
  const UI = (window.UI = {});
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  UI.rr = rr;
  const lienzo = (q, x, y, w, h) => { const cv = M.el(q, 'canvas', 'abs', null, { left: x + 'px', top: y + 'px' }); cv.width = w; cv.height = h; return { cv, g: cv.getContext('2d') }; };
  UI.lienzo = lienzo;
  const cache = (fn) => { let k0 = null; return (estado) => { const k = JSON.stringify(estado); if (k === k0) return; k0 = k; fn(estado); }; };

  // ---------- el valor que avanza y rebobina: 0 en reposo, sube de a → b, vuelve a 0 entre b y b + vuelta ----------
  UI.ciclo = (t, a, b, vuelta = 0.5) => (t >= a && t < b ? M.seg(t, a, b) : t >= b && t < b + vuelta ? 1 - V.E.io(M.seg(t, b, b + vuelta)) : 0);
  const V = window.V;

  // ---------- el destello (evoca a Claude sin copiar su logotipo) ----------
  UI.chispa = (size, col = '#E07A4F') => {
    let p = '';
    for (let i = 0; i < 12; i++) {
      const a = ((i * 30 + (i % 3) * 4 - 4) * Math.PI) / 180, l = i % 2 ? 0.78 : 1, w = 0.11;
      const x = 12 + Math.cos(a) * 11 * l, y = 12 + Math.sin(a) * 11 * l, nx = Math.cos(a + Math.PI / 2) * w * 11, ny = Math.sin(a + Math.PI / 2) * w * 11;
      p += `M${(12 + nx).toFixed(2)} ${(12 + ny).toFixed(2)}L${x.toFixed(2)} ${y.toFixed(2)}L${(12 - nx).toFixed(2)} ${(12 - ny).toFixed(2)}Z`;
    }
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="${p}" fill="${col}" stroke="${col}" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
  };

  // ---------- glifos de 64×64 (trazo) ----------
  UI.GLIFOS = {
    carrusel: '<rect x="21" y="11" width="29" height="36" rx="6"/><path d="M14 18v24a7 7 0 0 0 7 7"/><circle cx="26" cy="56" r="2.4" fill="currentColor" stroke="none"/><circle cx="34" cy="56" r="2.4" fill="currentColor" stroke="none" opacity=".45"/><circle cx="42" cy="56" r="2.4" fill="currentColor" stroke="none" opacity=".45"/>',
    subtitulos: '<rect x="9" y="15" width="46" height="34" rx="7"/><path d="M17 33h10M32 33h15M17 41h20M42 41h5"/>',
    miniatura: '<rect x="9" y="13" width="46" height="38" rx="7"/><path d="M14 45l12-13 8 8 6-6 11 11"/><circle cx="42" cy="24" r="4"/>',
    musica: '<path d="M12 28v8M20 20v24M28 13v38M36 22v20M44 17v30M52 27v10"/>',
    guion: '<rect x="13" y="9" width="32" height="46" rx="6"/><path d="M21 21h16M21 29h16M21 37h9"/><path d="M38 52l13-13 4 4-13 13h-4z" fill="currentColor" stroke-width="2.4"/>',
    capas: '<path d="M32 10l21 11-21 11-21-11z"/><path d="M11 32l21 11 21-11"/><path d="M11 42l21 11 21-11"/>',
    color: '<circle cx="32" cy="32" r="21"/><circle cx="39" cy="26" r="5" fill="currentColor" stroke="none"/><path d="M32 11v6M32 47v6M11 32h6M47 32h6"/>',
    timeline: '<rect x="8" y="16" width="20" height="10" rx="3"/><rect x="31" y="16" width="25" height="10" rx="3"/><rect x="8" y="31" width="30" height="10" rx="3"/><rect x="41" y="31" width="15" height="10" rx="3"/><path d="M8 50h48"/><path d="M34 9v47" stroke-width="3"/>',
    camara: '<rect x="8" y="19" width="34" height="27" rx="6"/><path d="M42 28l14-7v23l-14-7z"/><circle cx="16" cy="26" r="1.8" fill="currentColor" stroke="none"/>',
    luz: '<rect x="15" y="9" width="34" height="24" rx="4"/><path d="M32 33v20M23 55h18M21 16h22"/>',
    play: '<path d="M22 14l28 18-28 18z" fill="currentColor"/>',
    skill: '<path d="M32 8l5 13 13 5-13 5-5 13-5-13-13-5 13-5z"/><path d="M50 40l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="currentColor" stroke-width="1.6"/>',
    voz: '<rect x="23" y="8" width="18" height="30" rx="9"/><path d="M14 30a18 18 0 0 0 36 0M32 48v8M24 56h16"/>',
    corte: '<circle cx="18" cy="46" r="7"/><circle cx="46" cy="46" r="7"/><path d="M23 41L44 12M41 41L20 12"/>',
    texto: '<path d="M14 16h36M32 16v36M24 52h16"/>',
  };
  UI.DEGRADADOS = {
    coral: ['#FF9466', '#E8613C'], violeta: ['#B69CFF', '#7C3AED'], azul: ['#8FD3FF', '#3B7BF6'], verde: ['#7EEBC0', '#10B981'],
    rosa: ['#FFB1D8', '#EC4899'], ambar: ['#FFD86B', '#F59E0B'], grafito: ['#55555F', '#1D1D1F'], noche: ['#2E1F52', '#0B0614'], turquesa: ['#7DF0DD', '#14B8A6'],
  };
  // icono de app: squircle con degradado, brillo arriba, sombra del color y el glifo en blanco
  UI.icono = (q, nombre, { x, y, size = 180, grad = 'coral', trazo = '#FFFFFF', glifo } = {}) => {
    const [c1, c2] = Array.isArray(grad) ? grad : UI.DEGRADADOS[grad];
    const el = M.el(q, 'div', 'abs', null, { left: x + 'px', top: y + 'px', width: size + 'px', height: size + 'px', borderRadius: (size * 0.235).toFixed(1) + 'px',
      background: `linear-gradient(160deg, ${c1}, ${c2})`, boxShadow: `0 ${size * 0.14}px ${size * 0.3}px -${size * 0.1}px ${c2}99, inset 0 2px 0 rgba(255,255,255,.35), inset 0 -2px 0 rgba(0,0,0,.12)`, transformOrigin: '50% 60%' });
    const s = size * 0.58, o = (size - s) / 2;
    el.innerHTML = glifo || `<svg viewBox="0 0 64 64" width="${s}" height="${s}" style="position:absolute;left:${o}px;top:${o}px;color:${trazo}" fill="none" stroke="${trazo}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round">${UI.GLIFOS[nombre] || ''}</svg>`;
    return el;
  };
  UI.iconoClaude = (q, { x, y, size = 180, fondo = '#F5EFE6' } = {}) => {
    const el = M.el(q, 'div', 'abs', null, { left: x + 'px', top: y + 'px', width: size + 'px', height: size + 'px', borderRadius: (size * 0.235).toFixed(1) + 'px', background: fondo,
      boxShadow: `0 ${size * 0.14}px ${size * 0.3}px -${size * 0.1}px rgba(224,122,79,.45), inset 0 2px 0 rgba(255,255,255,.7)`, transformOrigin: '50% 60%' });
    const s = size * 0.62; el.innerHTML = `<div style="position:absolute;left:${(size - s) / 2}px;top:${(size - s) / 2}px">${UI.chispa(s)}</div>`;
    return el;
  };

  // ---------- foto recortada a su caja ----------
  // pos = [0..1, 0..1] punto de la foto que manda (como object-position); zoom > 1 acerca
  UI.foto = (q, { x, y, w, h, src, pos = [0.5, 0.5], zoom = 1, radio = 0 }) => {
    const box = M.el(q, 'div', 'abs', null, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', overflow: 'hidden', borderRadius: radio + 'px' });
    const img = M.el(box, 'img', null, null, { position: 'absolute', left: '0', top: '0', transformOrigin: '50% 50%', display: 'block' });
    img.src = src;
    const f = { box, img, w, h, x, y,
      // coloca la imagen (cuando ya cargó) y devuelve el mapa foto → caja
      ajusta() { const iw = img.naturalWidth, ih = img.naturalHeight, s = Math.max(w / iw, h / ih) * zoom; const dw = iw * s, dh = ih * s, dx = (w - dw) * pos[0], dy = (h - dh) * pos[1];
        Object.assign(img.style, { width: dw + 'px', height: dh + 'px', left: dx + 'px', top: dy + 'px' }); f.mapa = { s, dx, dy, iw, ih }; return f.mapa; },
    };
    if (img.complete && img.naturalWidth) f.ajusta(); else img.addEventListener('load', () => f.ajusta());
    return f;
  };
  UI.listas = () => Promise.all([...document.images].map((i) => (i.complete && i.naturalWidth ? Promise.resolve() : new Promise((ok) => { i.onload = ok; i.onerror = ok; }))));

  // ---------- reproductor ----------
  UI.reproductor = (q, { x, y, w, h, src, pos, zoom, radio = 22, dur = '0:30', tema = 'oscuro' }) => {
    const box = M.el(q, 'div', 'abs', null, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', borderRadius: radio + 'px', overflow: 'hidden', background: '#000',
      boxShadow: tema === 'claro' ? '0 40px 80px -36px rgba(29,29,31,.45)' : '0 40px 80px -30px rgba(0,0,0,.9)' });
    const f = UI.foto(box, { x: 0, y: 0, w, h, src, pos, zoom });
    const { cv, g } = lienzo(box, 0, 0, w, h);
    const total = dur.split(':').reduce((a, b) => a * 60 + +b, 0);
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const dibuja = cache(({ p = 0.3, a = 1 }) => {
      g.clearRect(0, 0, w, h); if (a <= 0.001) return; g.globalAlpha = a;
      const gr = g.createLinearGradient(0, h - 150, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = gr; g.fillRect(0, h - 150, w, 150);
      const by = h - 46, bx = 96, bw = w - bx - 150;
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(38, by - 14); g.lineTo(62, by); g.lineTo(38, by + 14); g.closePath(); g.fill();
      rr(g, bx, by - 3, bw, 6, 3); g.fillStyle = 'rgba(255,255,255,.3)'; g.fill();
      rr(g, bx, by - 3, bw * p, 6, 3); g.fillStyle = '#fff'; g.fill();
      g.beginPath(); g.arc(bx + bw * p, by, 9, 0, 7); g.fill();
      g.font = '600 22px "JetBrains Mono"'; g.textAlign = 'right'; g.fillText(`${fmt(total * p)} / ${dur}`, w - 26, by + 8); g.textAlign = 'left';
      g.globalAlpha = 1;
    });
    return { el: box, foto: f, dibuja };
  };

  // ---------- línea de tiempo ----------
  // pistas: [{ nombre, tipo: 'video'|'texto'|'audio'|'musica'|'fx'|'color', clips: [{ a, b, txt, img, kf: [t…], duck: [[t0, t1]…] }] }]
  UI.COLORES_CLIP = { video: '#5B7CFA', texto: '#2DD4BF', audio: '#34D399', musica: '#A78BFA', fx: '#F5A524', color: '#F472B6' };
  UI.timeline = (q, { x, y, w, h, pistas, dur = 10, tema = {}, cabecera = 150, regla = 40, gap = 10 }) => {
    const T = Object.assign({ bg: '#16161B', panel: '#1E1E25', linea: 'rgba(255,255,255,.07)', tx: '#ECECF1', mudo: '#8B8B99', cab: '#FF5A5F', radio: 18 }, tema);
    const box = M.el(q, 'div', 'abs', null, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', borderRadius: T.radio + 'px', overflow: 'hidden', background: T.bg, border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 40px 80px -36px rgba(0,0,0,.85)' });
    const { g } = lienzo(box, 0, 0, w, h);
    const X0 = cabecera, AW = w - cabecera - 18, alto = (h - regla - 14 - gap * (pistas.length - 1)) / pistas.length;
    const tx = (s) => X0 + (AW * s) / dur, py = (i) => regla + 8 + i * (alto + gap);
    const ondas = pistas.map((p, i) => { const r = M.azar(97 + i * 13); return Array.from({ length: 400 }, (_, k) => (p.tipo === 'musica' ? 0.35 + 0.25 * Math.abs(Math.sin(k * 0.21)) + r() * 0.15 : Math.max(0.06, Math.abs(Math.sin(k * 0.13) * Math.sin(k * 0.031)) * (0.4 + r() * 0.6)))); });
    const geo = { tx, py, alto, X0, AW };
    // el estado se resume en números (la función ap se evalúa aquí) para que la caché sepa cuándo repintar
    const dibuja = (st = {}) => pinta({ cab: st.cab == null ? null : +st.cab.toFixed(3), resalta: st.resalta ?? -1, vol: st.vol == null ? null : +st.vol.toFixed(4),
      apv: pistas.map((p, i) => p.clips.map((c, k) => (st.ap ? +Math.max(0, Math.min(1, st.ap(i, k))).toFixed(4) : 1))) });
    const pinta = cache(({ cab, resalta, vol, apv }) => {
      g.clearRect(0, 0, w, h); g.fillStyle = T.bg; g.fillRect(0, 0, w, h);
      g.fillStyle = T.panel; g.fillRect(0, 0, w, regla); g.fillRect(0, 0, X0 - 6, h);
      // regla de tiempo
      g.font = '500 17px "JetBrains Mono"'; g.fillStyle = T.mudo;
      for (let s = 0; s <= dur; s++) { const xx = tx(s); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(xx, regla - (s % 5 ? 8 : 14), 1.5, s % 5 ? 8 : 14); if (s % 5 === 0 && s < dur) { g.fillStyle = T.mudo; g.fillText(`00:${String(s).padStart(2, '0')}`, xx + 6, 25); } }
      pistas.forEach((p, i) => {
        const y0 = py(i), dim = resalta >= 0 && resalta !== i;
        g.globalAlpha = dim ? 0.32 : 1;
        if (resalta === i) { g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(X0 - 6, y0 - 4, w, alto + 8); g.fillStyle = UI.COLORES_CLIP[p.tipo]; rr(g, 0, y0 - 4, 5, alto + 8, 2); g.fill(); }
        // cabecera de la pista
        g.fillStyle = UI.COLORES_CLIP[p.tipo]; rr(g, 18, y0 + alto / 2 - 7, 14, 14, 4); g.fill();
        g.font = '700 19px "JetBrains Mono"'; g.fillStyle = T.tx; g.fillText(p.nombre, 42, y0 + alto / 2 + 7);
        p.clips.forEach((c, k) => {
          const u = apv[i][k]; if (u <= 0.001) return;
          const x0 = tx(c.a) + 2, cw = (tx(c.b) - tx(c.a) - 4) * u, col = UI.COLORES_CLIP[p.tipo];
          g.save(); rr(g, x0, y0, cw, alto, 9); g.clip();
          g.fillStyle = col + '40'; g.fillRect(x0, y0, cw, alto);
          if (c.img && c.img.naturalWidth) { // miniaturas de la foto a lo largo del clip
            const th = alto - 8, tw = th * (c.img.naturalWidth / c.img.naturalHeight);
            for (let xx = x0 + 4; xx < x0 + cw; xx += tw + 3) g.drawImage(c.img, xx, y0 + 4, tw, th);
            g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x0, y0, cw, alto);
          }
          if (p.tipo === 'audio' || p.tipo === 'musica') {
            g.fillStyle = col; const n = Math.floor(cw / 5);
            for (let b = 0; b < n; b++) { const v = ondas[i][(b + k * 37) % 400] * (alto - 18); g.fillRect(x0 + 3 + b * 5, y0 + alto / 2 - v / 2, 3, v); }
          }
          g.restore();
          g.strokeStyle = col; g.lineWidth = 2.5; rr(g, x0, y0, cw, alto, 9); g.stroke();
          g.fillStyle = col; rr(g, x0, y0, cw, 6, [9, 9, 0, 0]); g.fill();
          if (c.txt && cw > 60) { g.font = '700 19px Rajdhani'; g.fillStyle = '#fff'; g.save(); rr(g, x0, y0, cw, alto, 9); g.clip(); g.fillText(c.txt, x0 + 12, y0 + 28); g.restore(); }
          (c.kf || []).forEach((kt) => { const kx = tx(kt); if (kx > x0 + cw) return; g.save(); g.translate(kx, y0 + alto - 14); g.rotate(Math.PI / 4); g.fillStyle = '#F5A524'; g.fillRect(-6, -6, 12, 12); g.strokeStyle = '#16161B'; g.lineWidth = 2; g.strokeRect(-6, -6, 12, 12); g.restore(); });
          if (c.duck && vol) { // la línea de volumen: baja bajo la voz
            g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath();
            for (let s = c.a; s <= c.b + 1e-6; s += dur / 300) { const d = c.duck.reduce((m, [a0, b0]) => Math.max(m, s >= a0 - 0.4 && s <= b0 + 0.4 ? Math.min(1, Math.min(s - (a0 - 0.4), (b0 + 0.4) - s) / 0.4) : 0), 0) * vol;
              const yy = y0 + 12 + d * (alto * 0.55); s === c.a ? g.moveTo(tx(s), yy) : g.lineTo(tx(s), yy); }
            g.stroke();
          }
        });
        g.globalAlpha = 1;
      });
      if (cab != null) { const cx = tx(cab); g.fillStyle = T.cab; g.fillRect(cx - 1.5, 4, 3, h - 8); g.beginPath(); g.moveTo(cx - 11, 4); g.lineTo(cx + 11, 4); g.lineTo(cx + 11, 16); g.lineTo(cx, 26); g.lineTo(cx - 11, 16); g.closePath(); g.fill(); }
    });
    return { el: box, dibuja, geo };
  };

  // ---------- visor de cámara (encima de una foto a sangre) ----------
  UI.visor = (q, { x = 0, y = 0, w = 1080, h = 1350, margen = 60, ajustes = 'ISO 800   1/50   f/2.8   5600K', formato = '4K · 25p' } = {}) => {
    const { cv, g } = lienzo(q, x, y, w, h);
    const tc = (fr) => { const f = fr % 25, s = Math.floor(fr / 25); return `00:00:${String(s % 60).padStart(2, '0')}:${String(f).padStart(2, '0')}`; };
    const dibuja = cache(({ fr = 87, rec = true, a = 1, rejilla = 0.28, foco = null, focoOk = true, hist = null, ajustesA = 1 } = {}) => {
      g.clearRect(0, 0, w, h); if (a <= 0.001) return; g.globalAlpha = a;
      g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 8;
      const m = margen, L = 64; g.strokeStyle = 'rgba(255,255,255,.92)'; g.lineWidth = 4;
      [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(([cx, cy, sx, sy]) => { g.beginPath(); g.moveTo(cx, cy + sy * L); g.lineTo(cx, cy); g.lineTo(cx + sx * L, cy); g.stroke(); });
      if (rejilla > 0) { g.shadowBlur = 0; g.strokeStyle = `rgba(255,255,255,${rejilla})`; g.lineWidth = 2; [1, 2].forEach((k) => { g.beginPath(); g.moveTo((w * k) / 3, m + 90); g.lineTo((w * k) / 3, h - m - 120); g.moveTo(m + 30, (h * k) / 3); g.lineTo(w - m - 30, (h * k) / 3); g.stroke(); }); g.shadowBlur = 8; }
      if (rec) { g.fillStyle = '#FF3B30'; g.beginPath(); g.arc(m + 34, m + 46, 12, 0, 7); g.fill(); }
      g.fillStyle = '#fff'; g.font = '700 28px "JetBrains Mono"'; g.fillText('REC', m + 56, m + 56);
      g.font = '600 30px "JetBrains Mono"'; g.textAlign = 'center'; g.fillText(tc(fr), w / 2, m + 56); g.textAlign = 'left';
      g.font = '700 22px "JetBrains Mono"'; g.fillText(formato, m + 34, m + 100);
      if (foco) { // corchetes de enfoque: se cierran y se vuelven ámbar al fijar
        const [fx, fy, fw, fh] = foco, l = 34; g.strokeStyle = focoOk ? '#FFC53D' : '#fff'; g.lineWidth = 4;
        [[fx, fy, 1, 1], [fx + fw, fy, -1, 1], [fx, fy + fh, 1, -1], [fx + fw, fy + fh, -1, -1]].forEach(([cx, cy, sx, sy]) => { g.beginPath(); g.moveTo(cx, cy + sy * l); g.lineTo(cx, cy); g.lineTo(cx + sx * l, cy); g.stroke(); });
      }
      g.globalAlpha = a * ajustesA; g.font = '600 24px "JetBrains Mono"'; g.fillStyle = '#fff'; g.fillText(ajustes, m + 34, h - m - 30);
      if (hist) { // histograma (lista de 0..1)
        const hx = m + 34, hy = h - m - 168, hw = 260, hh = 96; g.shadowBlur = 0;
        rr(g, hx, hy, hw, hh, 10); g.fillStyle = 'rgba(0,0,0,.42)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(hx + 8, hy + hh - 8);
        hist.forEach((v, i) => g.lineTo(hx + 8 + (i * (hw - 16)) / (hist.length - 1), hy + hh - 8 - v * (hh - 20))); g.lineTo(hx + hw - 8, hy + hh - 8); g.closePath(); g.fill();
      }
      g.shadowBlur = 0; g.globalAlpha = 1;
    });
    return { el: cv, dibuja, tc };
  };
  // histograma de la luminancia de una foto (64 barras normalizadas), para el visor
  UI.histograma = (img, n = 64) => {
    const c = document.createElement('canvas'); c.width = 160; c.height = 160; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 160, 160);
    const d = g.getImageData(0, 0, 160, 160).data, hh = new Array(n).fill(0);
    for (let i = 0; i < d.length; i += 4) hh[Math.min(n - 1, Math.floor(((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 256) * n))]++;
    const sm = hh.map((_, i) => (hh[Math.max(0, i - 1)] + 2 * hh[i] + hh[Math.min(n - 1, i + 1)]) / 4), mx = Math.max(...sm);
    return sm.map((v) => +(v / mx).toFixed(3));
  };
  // cebra: rayas diagonales donde la foto pasa de un umbral de luz (se dibuja encima de UI.foto ya ajustada)
  UI.cebra = (q, f, umbral = 0.8) => {
    const { cv, g } = lienzo(q, f.x, f.y, f.w, f.h); const { s, dx, dy, iw, ih } = f.mapa || f.ajusta();
    const m = document.createElement('canvas'); m.width = f.w; m.height = f.h; const mg = m.getContext('2d');
    mg.drawImage(f.img, dx, dy, iw * s, ih * s); const d = mg.getImageData(0, 0, f.w, f.h), px = d.data;
    for (let i = 0; i < px.length; i += 4) { const l = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255; px[i] = px[i + 1] = px[i + 2] = 255; px[i + 3] = l > umbral ? 255 : 0; }
    mg.putImageData(d, 0, 0);
    const dibuja = cache(({ off = 0, a = 1 }) => {
      g.clearRect(0, 0, f.w, f.h); if (a <= 0.001) return;
      g.save(); g.globalAlpha = a; g.drawImage(m, 0, 0); g.globalCompositeOperation = 'destination-in';
      g.beginPath(); for (let k = -f.h; k < f.w + f.h; k += 22) { g.moveTo(k + off, 0); g.lineTo(k + off + 8, 0); g.lineTo(k + off + 8 - f.h, f.h); g.lineTo(k + off - f.h, f.h); } g.fill(); g.restore();
    });
    return { el: cv, dibuja };
  };
})();
