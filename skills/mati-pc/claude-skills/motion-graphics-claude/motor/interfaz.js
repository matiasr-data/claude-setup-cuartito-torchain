// interfaz.js · motion-graphics-claude · lo que siempre pasa encima de una interfaz, descrito como una lista de «momentos»
// Para las interfaces (interfaces/*.html), sobre motor.js. Sirve igual sobre una captura (plantilla interfaz-captura)
// que sobre una interfaz diseñada en HTML (plantilla interfaz-diseno). Todo depende solo de t: render exacto.
//
//   <script src="../motor/motor.js"></script><script src="../motor/interfaz.js"></script>
//   escena({ duracion: 8, ancho: 1920, alto: 1080 }, (MG) => {
//     const pinta = UI.momentos(MG, [
//       { t: 0.3, tipo: 'cursor', a: [1240, 980] },                          // el cursor aparece y va a cada punto
//       { t: 1.0, tipo: 'cursor', a: [880, 410], clic: true },              // … y hace clic al llegar (onda coral)
//       { t: 1.2, tipo: 'escribe', en: [600, 300], texto: 'Hola, Claude', d: 1.2, estilo: 'font-size:26px' },
//       { t: 2.4, tipo: 'resalta', caja: [560, 380, 420, 90], texto: 'Aquí está la clave', hasta: 4.5 },
//       { t: 3.0, tipo: 'aparece', el: miElemento },                         // cualquier elemento entra con rebote
//       { t: 3.6, tipo: 'etiqueta', en: [1500, 200], texto: 'PASO 2' },
//       { t: 5.0, tipo: 'zoom', caja: [400, 200, 800, 450], d: 0.8, hasta: 6.5 },   // acerca la interfaz a esa zona
//     ]);
//     return (t) => { pinta(t); };
//   });
// Coordenadas en px de la interfaz (las mismas que luego usa la escena 3D para apuntar la cámara y el actor).
(function () {
  'use strict';
  const FLECHA = '<svg width="36" height="42" viewBox="0 0 24 28" style="filter:drop-shadow(0 4px 8px rgba(0,0,0,.55))"><path d="M2 2 L2 22 L7.5 17 L11 25 L14.5 23.5 L11 15.5 L18.5 15.5 Z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>';

  function momentos(MG, lista, o = {}) {
    const capa = MG.el(`<div class="mg-abs" style="left:0;top:0;width:${MG.ANCHO}px;height:${MG.ALTO}px;pointer-events:none"></div>`, o.padre);
    const cv = MG.curvas, k = MG.k, L = MG.lerp, pintores = [];
    const ordenados = [...lista].sort((a, b) => a.t - b.t);

    // cursor: un solo cursor que va de punto en punto (curva «Apple»), con clic opcional al llegar
    const pasos = ordenados.filter((m) => m.tipo === 'cursor');
    if (pasos.length) {
      const c = MG.el(`<div class="mg-abs">${FLECHA}</div>`, capa), ondas = [];
      for (const p of pasos.filter((p) => p.clic)) ondas.push({ t: p.t, x: p.a[0], y: p.a[1], el: MG.el('<div class="mg-abs" style="width:80px;height:80px;margin:-40px 0 0 -40px;border-radius:50%;border:4px solid var(--acento);opacity:0"></div>', capa) });
      pintores.push((t) => {
        let i = 0; while (i < pasos.length - 1 && t >= pasos[i + 1].t) i++;
        const a = pasos[i], b = pasos[i + 1], ini = pasos[0];
        let x = a.a[0], y = a.a[1];
        if (b && t > b.t - (b.d ?? 0.7)) { const u = cv.afterEffects75(k(t, b.t - (b.d ?? 0.7), b.t)); x = L(a.a[0], b.a[0], u); y = L(a.a[1], b.a[1], u); }
        const aparece = cv.salidaCubica(k(t, ini.t - 0.25, ini.t)), pulsa = Math.max(0, ...ondas.map((on) => Math.sin(Math.PI * k(t, on.t, on.t + 0.16))));
        c.style.opacity = aparece * (o.ocultarCursor != null && t > o.ocultarCursor ? 0 : 1);
        MG.pon(c, x - 4, y - 3, 1 - 0.14 * pulsa);
        for (const on of ondas) { const p = k(t, on.t, on.t + 0.55); on.el.style.opacity = p > 0 && p < 1 ? (1 - p) : 0; MG.pon(on.el, on.x, on.y, 0.3 + 1.2 * cv.salidaCubica(p)); }
      });
    }
    for (const m of ordenados) {
      if (m.tipo === 'escribe') {                     // texto que se escribe letra a letra, con cursor de texto
        const el = m.el || MG.el(`<div class="mg-abs" style="left:${m.en[0]}px;top:${m.en[1]}px;white-space:pre;${m.estilo || 'font-size:24px;font-weight:600'}"></div>`, capa);
        pintores.push((t) => { const n = Math.round(m.texto.length * cv.suave(k(t, m.t, m.t + (m.d ?? 1.2))));
          el.textContent = m.texto.slice(0, n) + (t > m.t && t < m.t + (m.d ?? 1.2) + 0.2 && Math.floor(t * 4) % 2 ? '|' : ''); el.style.opacity = t >= m.t - 0.01 ? 1 : 0; });
      } else if (m.tipo === 'resalta') {              // marco coral con brillo (y etiqueta opcional) sobre una zona
        const [x, y, w, h] = m.caja, r = m.radio ?? 14;
        const marco = MG.el(`<div class="mg-abs" style="left:${x - 6}px;top:${y - 6}px;width:${w + 12}px;height:${h + 12}px;border-radius:${r}px;border:3px solid var(--acento);box-shadow:0 0 0 1px rgba(0,0,0,.35),0 0 40px rgba(var(--halo),.55);opacity:0"></div>`, capa);
        const eti = m.texto ? MG.el(`<div class="mg-abs mg-chip" style="left:${x}px;top:${y - 58}px;font-size:20px">${m.texto}</div>`, capa) : null;
        pintores.push((t) => { const e = MG.entra(marco, t, m.t, { dy: 0, escala0: 1.06, d: 0.5, desenfoque: false }); marco.style.transform = `scale(${e.s})`; marco.style.transformOrigin = 'center';
          const fuera = m.hasta != null ? 1 - k(t, m.hasta, m.hasta + 0.3) : 1; marco.style.opacity = Math.min(1, e.p * 1.8) * fuera;
          if (eti) { const f = MG.entra(eti, t, m.t + 0.12, { dy: 18, d: 0.45 }); MG.pon(eti, 0, f.y, f.s); eti.style.opacity = Math.min(1, f.p * 1.8) * fuera; } });
      } else if (m.tipo === 'aparece') {              // un elemento tuyo entra con rebote (y desenfoque de movimiento)
        const el = m.el; const x0 = parseFloat(el.style.left) || 0, y0 = parseFloat(el.style.top) || 0;
        pintores.push((t) => { const e = MG.entra(el, t, m.t, { dy: m.dy ?? 30, dx: m.dx ?? 0, d: m.d ?? 0.55 }); el.style.transform = `translate(${e.x}px,${e.y}px) scale(${e.s})`; void x0; void y0; });
      } else if (m.tipo === 'etiqueta') {             // pastilla de marca («PASO 1», «NUEVO»…)
        const el = MG.el(`<div class="mg-abs mg-chip" style="left:${m.en[0]}px;top:${m.en[1]}px;font-size:${m.tam ?? 22}px">${m.texto}</div>`, capa);
        pintores.push((t) => { const e = MG.entra(el, t, m.t, { dy: 24, d: 0.5 }); MG.pon(el, 0, e.y, e.s); if (m.hasta != null) el.style.opacity = Math.min(+el.style.opacity, 1 - k(t, m.hasta, m.hasta + 0.3)); });
      }
    }
    // zoom: toda la interfaz se acerca a una zona y vuelve (dentro de la propia interfaz, antes del 3D)
    const zooms = ordenados.filter((m) => m.tipo === 'zoom');
    if (zooms.length) pintores.push((t) => {
      let s = 1, ox = MG.ANCHO / 2, oy = MG.ALTO / 2;
      for (const z of zooms) { const [x, y, w, h] = z.caja, p = cv.entradaSalidaQuint(k(t, z.t, z.t + (z.d ?? 0.8))) * (z.hasta != null ? 1 - cv.entradaSalidaQuint(k(t, z.hasta, z.hasta + (z.d ?? 0.8))) : 1);
        if (p > 0) { s = L(1, Math.min(MG.ANCHO / w, MG.ALTO / h), p); ox = x + w / 2; oy = y + h / 2; } }
      MG.mundo.style.transformOrigin = `${ox}px ${oy}px`; MG.mundo.style.transform = s !== 1 ? `scale(${s})` : '';
    });
    return (t) => { for (const f of pintores) f(t); };
  }

  // varias capturas que se suceden (fundido cruzado): [{ src, desde }] · ajuste 'contain' (entera) o 'cover' (llena)
  function capturas(MG, lista, o = {}) {
    const els = lista.map((c) => MG.el(`<img class="mg-abs" src="${c.src}" style="left:0;top:0;width:${MG.ANCHO}px;height:${MG.ALTO}px;object-fit:${c.ajuste || o.ajuste || 'contain'};background:${o.fondo || '#0B0A0D'};opacity:0">`, o.padre));
    return (t) => els.forEach((el, i) => { const a = lista[i].desde ?? 0, b = lista[i + 1]?.desde ?? 1e9;
      el.style.opacity = Math.min(MG.curvas.suave(MG.k(t, a - 0.01, a + (i ? 0.35 : 0.01))), 1 - (i < lista.length - 1 ? MG.curvas.suave(MG.k(t, b, b + 0.35)) : 0)); });
  }

  window.UI = { momentos, capturas };
})();
