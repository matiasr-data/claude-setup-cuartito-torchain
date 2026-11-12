import {clamp} from '../../../comun/curvas';
import {G, TINTA, afMul, afRot, afEsc, afTras, apl, arco, cinta, elipse, quad, spline, type Af, type Lienzo, type P} from './tinta';

// LAS PIEZAS DE LOS DIBUJOS DE LOS 30, adaptadas de código con licencia MIT (ver AVISOS.md): los ojos de «pastel
// cortado» (la pupila negra con una cuña blanca recortada arriba a la derecha), las cejas, las bocas, los guantes blancos de cuatro
// dedos con sus tres costuras y los zapatones negros con su brillo. Cada pieza recibe su semilla (para hervir siempre igual) y se
// dibuja ya en la pantalla, con su transformación aplicada a los puntos.

const D2R = Math.PI / 180;

export type TipoOjo = 'abierto' | 'grande' | 'feliz' | 'cerrado' | 'aprieta' | 'espiral' | 'medio';
export type OjoOp = {lx?: number; ly?: number; tipo?: TipoOjo; parpado?: number; colParpado?: string; lw?: number; lado?: 1 | -1; giro?: number};

// el ojo: blanco, con la pupila de pastel cortado; mira a (lx, ly) de −1 a 1
export const ojo = (L: Lienzo, s: number, cx: number, cy: number, rx: number, ry: number, o: OjoOp = {}) => {
  const tipo = o.tipo ?? 'abierto';
  const lw = o.lw ?? 6;
  if (tipo === 'feliz') {
    L.trazo(s, arco(cx, cy + ry * 0.35, rx * 0.95, ry * 0.55, Math.PI * 1.08, Math.PI * 1.92, 14), lw * 1.35);
    return;
  }
  if (tipo === 'cerrado') {
    L.trazo(s, arco(cx, cy - ry * 0.15, rx * 0.95, ry * 0.4, Math.PI * 0.1, Math.PI * 0.9, 12), lw * 1.3);
    return;
  }
  if (tipo === 'aprieta') {
    const k = o.lado ?? 1;
    L.trazo(s, [[cx - rx * k, cy - ry * 0.6], [cx + rx * 0.8 * k, cy], [cx - rx * k, cy + ry * 0.6]], lw * 1.4);
    return;
  }
  if (tipo === 'espiral') {
    // mareado: el ojo blanco con una espiral que gira
    L.forma(s, elipse(cx, cy, rx, ry), {relleno: G.blanco, lw});
    const pts: P[] = [];
    for (let i = 0; i <= 40; i++) {
      const a = (o.giro ?? 0) + (i / 40) * Math.PI * 4.5;
      const r = (i / 40) * 0.85;
      pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
    }
    L.trazo(s + 0.5, pts, lw * 0.8);
    return;
  }
  const big = tipo === 'grande' ? 1.14 : 1;
  const eR = rx * big, eY = ry * big;
  const lx = clamp(o.lx ?? 0, -1, 1), ly = clamp(o.ly ?? 0, -1, 1);
  const pr = tipo === 'grande' ? 0.46 : 0.64, pry = tipo === 'grande' ? 0.52 : 0.74;
  const pcx = cx + lx * eR * (1 - pr) * 0.95, pcy = cy + ly * eY * (1 - pry) * 0.9 + eY * 0.05;
  const parpado = o.parpado ?? (tipo === 'medio' ? 0.48 : 0);
  L.forma(s, elipse(cx, cy, eR, eY), {
    relleno: G.blanco, lw,
    dentro: (D) => {
      // la pupila: un óvalo negro al que le falta una cuña hacia arriba a la derecha
      const w0 = -100 * D2R, w1 = -40 * D2R, prx = eR * pr, pry2 = eY * pry, pts: P[] = [];
      const apx = pcx + Math.cos((w0 + w1) / 2) * prx * 0.16, apy = pcy + Math.sin((w0 + w1) / 2) * pry2 * 0.16;
      for (let i = 0; i <= 28; i++) {
        const a = w1 + (i / 28) * (Math.PI * 2 - (w1 - w0));
        pts.push([pcx + Math.cos(a) * prx, pcy + Math.sin(a) * pry2]);
      }
      pts.push([apx, apy]);
      D.forma(s + 0.3, pts, {relleno: TINTA, linea: null, hierve: 0.4});
      if (parpado > 0) {
        const yl = cy - eY + parpado * 2 * eY;
        D.forma(s + 0.6, [[cx - eR * 1.3, cy - eY * 1.4], [cx + eR * 1.3, cy - eY * 1.4], [cx + eR * 1.3, yl], [cx - eR * 1.3, yl]], {relleno: o.colParpado ?? G.blanco, linea: null, hierve: 0});
      }
    },
  });
  if (parpado > 0) {
    const yl = cy - eY + parpado * 2 * eY;
    const hw = Math.sqrt(Math.max(0, 1 - ((yl - cy) / eY) ** 2)) * eR;
    if (hw > 2) L.trazo(s + 0.9, [[cx - hw, yl], [cx + hw, yl]], lw * 1.1);
  }
};

// las cejas: arriba (sorpresa), triste (baja por fuera), enfado (baja por dentro), plana. lado: −1 ojo izquierdo de la pantalla, +1 derecho
export type TipoCeja = 'arriba' | 'triste' | 'enfado' | 'plana';
export const ceja = (L: Lienzo, s: number, cx: number, cy: number, w: number, tipo: TipoCeja, lado: 1 | -1, lw = 9) => {
  // la punta de dentro es la que queda hacia la nariz
  const ix = cx - lado * w * 0.5, ox = cx + lado * w * 0.5;
  if (tipo === 'arriba') L.trazo(s, arco(cx, cy + w * 0.5, w * 0.55, w * 0.42, Math.PI * 1.15, Math.PI * 1.85, 10), lw);
  else if (tipo === 'triste') L.trazo(s, quad([ix, cy - w * 0.36], [cx, cy - w * 0.14], [ox, cy + w * 0.08]), lw);
  else if (tipo === 'enfado') L.trazo(s, quad([ix, cy + w * 0.16], [cx, cy - w * 0.06], [ox, cy - w * 0.32]), lw);
  else L.trazo(s, [[cx - w * 0.45, cy], [cx + w * 0.45, cy]], lw);
};

export type TipoBoca = 'sonrisa' | 'triste' | 'plana' | 'lado' | 'ondas' | 'o' | 'lengua' | 'abierta' | 'risa' | 'grande' | 'dientes';
// la boca: centrada en (cx, cy), de ancho w
export const boca = (L: Lienzo, s: number, cx: number, cy: number, w: number, tipo: TipoBoca, abre = 0.6, lw = 7) => {
  const h = w * abre;
  if (tipo === 'sonrisa') {
    L.trazo(s, quad([cx - w / 2, cy - w * 0.08], [cx, cy + w * 0.34], [cx + w / 2, cy - w * 0.08]), lw * 1.1);
    L.trazo(s + 0.2, arco(cx - w / 2 - 2, cy - w * 0.08, w * 0.09, w * 0.09, Math.PI * 0.6, Math.PI * 1.4, 6), lw * 0.8);
    L.trazo(s + 0.4, arco(cx + w / 2 + 2, cy - w * 0.08, w * 0.09, w * 0.09, -Math.PI * 0.4, Math.PI * 0.4, 6), lw * 0.8);
    return;
  }
  if (tipo === 'triste') {
    L.trazo(s, quad([cx - w / 2, cy + w * 0.14], [cx, cy - w * 0.24], [cx + w / 2, cy + w * 0.14]), lw * 1.1);
    return;
  }
  if (tipo === 'plana') {
    L.trazo(s, [[cx - w * 0.4, cy], [cx + w * 0.4, cy + 2]], lw * 1.1);
    return;
  }
  if (tipo === 'lado') {
    L.trazo(s, quad([cx - w * 0.42, cy + w * 0.06], [cx, cy + w * 0.05], [cx + w * 0.46, cy - w * 0.14]), lw * 1.1);
    return;
  }
  if (tipo === 'ondas') {
    const top: P[] = [], bot: P[] = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12, x = cx - w / 2 + u * w;
      top.push([x, cy - h * 0.25 + Math.sin(u * Math.PI * 4) * w * 0.05]);
      bot.push([x, cy + h * 0.35 + Math.sin(u * Math.PI * 4 + 1) * w * 0.05]);
    }
    L.forma(s, [...top, ...bot.reverse()], {relleno: TINTA, lw});
    return;
  }
  if (tipo === 'o') {
    const r = w * 0.24;
    L.forma(s, elipse(cx, cy + r * 0.2, r, r * 1.3 * abre * 1.6), {
      relleno: TINTA, lw,
      dentro: (D) => D.forma(s + 0.5, elipse(cx, cy + r * 1.3, r * 0.75, r * 0.55), {relleno: G.oscuroMedio, linea: null}),
    });
    return;
  }
  if (tipo === 'dientes') {
    // los dientes apretados (la tensión): una barra blanca con sus rayas
    const pts = spline([[cx - w * 0.5, cy - h * 0.2], [cx, cy - h * 0.32], [cx + w * 0.5, cy - h * 0.2], [cx + w * 0.46, cy + h * 0.32], [cx, cy + h * 0.42], [cx - w * 0.46, cy + h * 0.32]], true, 5);
    L.forma(s, pts, {
      relleno: G.blanco, lw,
      dentro: (D) => {
        D.trazo(s + 0.2, [[cx - w * 0.55, cy + h * 0.06], [cx + w * 0.55, cy + h * 0.06]], lw * 0.7);
        for (const dx of [-0.26, 0, 0.26]) D.trazo(s + 0.3 + dx, [[cx + dx * w, cy - h * 0.5], [cx + dx * w, cy + h * 0.6]], lw * 0.6);
      },
    });
    return;
  }
  if (tipo === 'lengua') {
    // la burla: la boca abierta y la lengua fuera
    boca(L, s, cx, cy, w, 'abierta', 0.42, lw);
    L.forma(s + 0.7, spline([[cx - w * 0.16, cy + w * 0.12], [cx - w * 0.22, cy + w * 0.46], [cx, cy + w * 0.64], [cx + w * 0.22, cy + w * 0.46], [cx + w * 0.16, cy + w * 0.12]], true, 6),
      {relleno: G.medio, lw: lw * 0.9});
    L.trazo(s + 0.8, [[cx, cy + w * 0.2], [cx, cy + w * 0.44]], lw * 0.6);
    return;
  }
  // abierta / risa / grande: el borde de arriba un poco curvo y el de abajo una U grande
  const up = tipo === 'grande' ? 0.1 : tipo === 'risa' ? 0.04 : -0.02;
  const pts = [
    ...quad([cx - w / 2, cy - w * up], [cx, cy + w * up * 0.6], [cx + w / 2, cy - w * up], 10),
    ...quad([cx + w / 2, cy - w * up], [cx, cy + h * 1.55], [cx - w / 2, cy - w * up], 14).slice(1),
  ];
  L.forma(s, pts, {
    relleno: TINTA, lw,
    dentro: (D) => {
      D.forma(s + 0.4, elipse(cx, cy + h * 0.95, w * 0.26, h * 0.42), {relleno: G.oscuroMedio, linea: null});
      if (tipo === 'risa' || tipo === 'grande') D.forma(s + 0.5, [[cx - w / 2, cy - w * up - 20], [cx + w / 2, cy - w * up - 20], [cx + w / 2, cy + h * 0.2], [cx - w / 2, cy + h * 0.2]], {relleno: G.blanco, linea: null});
    },
  });
  if (tipo === 'risa' || tipo === 'grande') {
    L.trazo(s + 0.8, arco(cx - w / 2 - 3, cy - w * up, w * 0.08, w * 0.1, Math.PI * 0.5, Math.PI * 1.5, 6), lw * 0.8);
    L.trazo(s + 0.9, arco(cx + w / 2 + 3, cy - w * up, w * 0.08, w * 0.1, -Math.PI * 0.5, Math.PI * 0.5, 6), lw * 0.8);
  }
};

// el guante blanco: la muñeca en (x, y), los dedos hacia «ang»; tipo abierta / puño / señala. espejo: el pulgar al otro lado
export type TipoMano = 'abierta' | 'puno' | 'senala';
export const guante = (L: Lienzo, s: number, x: number, y: number, ang: number, tipo: TipoMano, k = 1, espejo = false, lw = 7) => {
  const m: Af = afMul(afTras(x, y), afMul(afRot(ang), afEsc(k, espejo ? -k : k)));
  const fw = 13.5;
  const partes: P[][] = [];
  const dedo = (a: number, largo: number, w = fw, curva = 0) => {
    const b: P = [22 + Math.cos(a * D2R) * largo, Math.sin(a * D2R) * largo];
    const c: P = [22 + Math.cos(a * D2R) * largo * 0.55 + Math.cos((a + 90) * D2R) * curva, Math.sin(a * D2R) * largo * 0.55 + Math.sin((a + 90) * D2R) * curva];
    partes.push(apl(m, cinta(quad([22, 0], c, b, 8), w, w * 0.96)));
  };
  if (tipo === 'abierta') {
    dedo(-34, 30);
    dedo(-4, 33);
    dedo(27, 29);
    dedo(-88, 22, fw * 1.05);
  } else if (tipo === 'senala') {
    dedo(-6, 44, fw * 0.95);
    dedo(-95, 18, fw * 1.05);
  } else dedo(-90, 14, fw * 1.1);
  const palma = tipo === 'abierta' ? 17 : 19;
  partes.push(apl(m, elipse(22, 0, palma, palma * 0.95, 26)));
  partes.push(apl(m, spline([[-6, -12], [4, -20], [11, -15], [11, 15], [4, 20], [-6, 12], [-8, 0]], true, 5)));
  L.union(s, partes, G.blanco, lw);
  // las tres costuras del dorso y el doblez del puño
  const lwc = lw * 0.6;
  if (tipo === 'abierta') {
    for (const dy of [-6, 0, 6]) L.trazo(s + 1 + dy, apl(m, [[14, dy * 1.1], [25, dy * 1.4]]), lwc, {hierve: 0.5});
  } else {
    L.trazo(s + 2, apl(m, arco(30, 0, 9, 13, -1.2, 1.2, 8)), lwc);
    L.trazo(s + 3, apl(m, [[31, -6], [38, -7]]), lwc);
    L.trazo(s + 4, apl(m, [[31, 6], [38, 7]]), lwc);
  }
  L.trazo(s + 5, apl(m, quad([2, -16], [6, 0], [2, 16])), lwc);
};

// el zapatón negro: el talón en (x, y), la punta hacia dir (±1)
export const zapato = (L: Lienzo, s: number, x: number, y: number, dir: number, k = 1, ang = 0, lw = 7) => {
  const m: Af = afMul(afTras(x, y), afMul(afRot(ang), afEsc(dir * k, k)));
  L.forma(s, apl(m, spline([[-15, 0], [-17, -12], [-6, -19], [10, -21], [27, -18], [37, -8], [34, 3], [12, 5], [-8, 4]], true, 6)), {relleno: TINTA, lw});
  L.forma(s + 0.5, apl(m, elipse(22, -12, 7, 3.6, 12)), {relleno: G.blanco, linea: null, hierve: 0.3});
};

// una nota musical (las que salen de la radio): la cabeza, el palo y la bandera
export const nota = (L: Lienzo, s: number, x: number, y: number, k: number, ang: number, doble: boolean) => {
  const m: Af = afMul(afTras(x, y), afMul(afRot(ang), afEsc(k, k)));
  L.forma(s, apl(m, elipse(0, 0, 13, 9.5, 18, -0.4)), {relleno: TINTA, lw: 4});
  L.trazo(s + 0.2, apl(m, [[11, -2], [11, -46]]), 5);
  if (doble) {
    L.forma(s + 0.4, apl(m, elipse(30, -8, 13, 9.5, 18, -0.4)), {relleno: TINTA, lw: 4});
    L.trazo(s + 0.5, apl(m, [[41, -10], [41, -54]]), 5);
    L.forma(s + 0.6, apl(m, [[11, -46], [41, -54], [41, -44], [11, -36]]), {relleno: TINTA, lw: 3});
  } else L.forma(s + 0.6, apl(m, spline([[11, -46], [24, -36], [28, -22], [22, -14], [24, -26], [11, -32]], false, 5)), {relleno: TINTA, lw: 4});
};

// una gota de sudor
export const gota = (L: Lienzo, s: number, x: number, y: number, k: number, ang: number) => {
  const m: Af = afMul(afTras(x, y), afMul(afRot(ang), afEsc(k, k)));
  L.forma(s, apl(m, spline([[0, -16], [8, -2], [9, 7], [0, 13], [-9, 7], [-8, -2]], true, 5)), {relleno: G.blanco, lw: 5});
};
