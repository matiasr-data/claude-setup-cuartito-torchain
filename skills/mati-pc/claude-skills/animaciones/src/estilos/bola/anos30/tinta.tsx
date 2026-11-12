import React from 'react';
import {clamp, mix, ruido} from '../../../comun/curvas';

// LA TINTA DE LOS AÑOS 30 (adaptada de un motor con licencia MIT, ver AVISOS.md, y pasada
// de canvas a SVG). Todo se dibuja ya en coordenadas de la pantalla (las transformaciones se aplican a los puntos
// antes de entintar), así el trazo tiene siempre el mismo grueso aunque la pieza se estire. El contorno «hierve»: se remuestrea cada
// ~8 px y cada punto se mueve un pelo a lo largo de su normal con un ruido que cambia en cada dibujo (a dos: 12 por segundo, y se
// repiten 3 dibujos). Relleno plano, una sola banda de sombra de borde duro (lejos de la luz, que viene de arriba a la izquierda) y la
// tinta encima.

export type P = [number, number];

// la escala de grises (papel cálido, como la del demo): seis grises y el blanco de los personajes
export const G = {
  blanco: '#FCFBF7', papel: '#F1EEE6', palido: '#E2DFD6', claro: '#C8C5BC', medio: '#9A978F', oscuroMedio: '#6B6963',
  oscuro: '#3B3A37', tinta: '#0E0D0C',
};
export const TINTA = G.tinta;

// ---------------------------------------------------------------- transformaciones afines [a b c d e f]: x' = a x + c y + e
export type Af = [number, number, number, number, number, number];
export const AF: Af = [1, 0, 0, 1, 0, 0];
export const afMul = (m: Af, n: Af): Af => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
export const afTras = (x: number, y: number): Af => [1, 0, 0, 1, x, y];
// gira a (radianes; + = en el sentido del reloj en la pantalla) alrededor de (cx, cy)
export const afRot = (a: number, cx = 0, cy = 0): Af => {
  const c = Math.cos(a), s = Math.sin(a);
  return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy];
};
export const afEsc = (sx: number, sy: number, cx = 0, cy = 0): Af => [sx, 0, 0, sy, cx - sx * cx, cy - sy * cy];
// estira k a lo largo de la dirección (ux, uy) y 1/k de través (sin perder área), alrededor de c
export const afEstira = (ux: number, uy: number, k: number, kPerp: number, c: P): Af => {
  const r = afRot(Math.atan2(uy, ux), c[0], c[1]);
  const ri = afRot(-Math.atan2(uy, ux), c[0], c[1]);
  return afMul(r, afMul(afEsc(k, kPerp, c[0], c[1]), ri));
};
export const ap = (m: Af, p: P): P => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
export const apl = (m: Af, pts: P[]): P[] => pts.map((p) => ap(m, p));

// ---------------------------------------------------------------- formas (puntos)
const TAU = Math.PI * 2;
export const elipse = (cx: number, cy: number, rx: number, ry: number, n = 0, a0 = 0): P[] => {
  const k = n || clamp(Math.round((rx + ry) * 0.3), 16, 90);
  return Array.from({length: k}, (_, i) => {
    const a = a0 + (i / k) * TAU;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as P;
  });
};
export const arco = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 20): P[] =>
  Array.from({length: n + 1}, (_, i) => {
    const a = mix(a0, a1, i / n);
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as P;
  });
export const quad = (a: P, c: P, b: P, n = 16): P[] =>
  Array.from({length: n + 1}, (_, i) => {
    const t = i / n, u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]] as P;
  });
// la curva que pasa por m en su mitad (para las mangueras: el codo o la rodilla)
export const porMedio = (a: P, m: P, b: P): P => [2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2];
// Catmull-Rom
export const spline = (c: P[], cerrada = true, k = 8): P[] => {
  const n = c.length;
  const Q = (i: number) => (cerrada ? c[(i + n) % n] : c[clamp(i, 0, n - 1)]);
  const out: P[] = [];
  const m = cerrada ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = Q(i - 1), p1 = Q(i), p2 = Q(i + 1), p3 = Q(i + 2);
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)) as P);
    }
  }
  if (!cerrada) out.push(c[n - 1]);
  return out;
};
export const rr = (x: number, y: number, w: number, h: number, r: number): P[] => {
  const q = Math.min(r, w / 2, h / 2);
  const p: P[] = [];
  const esq: [number, number, number][] = [[x + w - q, y + q, -Math.PI / 2], [x + w - q, y + h - q, 0], [x + q, y + h - q, Math.PI / 2], [x + q, y + q, Math.PI]];
  for (const [cx, cy, a] of esq) for (let i = 0; i <= 6; i++) {
    const b = a + (i / 6) * (Math.PI / 2);
    p.push([cx + Math.cos(b) * q, cy + Math.sin(b) * q]);
  }
  return p;
};
export const rect = (x: number, y: number, w: number, h: number): P[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
// un polígono convexo con las esquinas redondeadas
export const poliRedondo = (pts: P[], r: number): P[] => {
  const n = pts.length, out: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
    const la = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, lc = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1;
    const ra = Math.min(r, la * 0.45), rc = Math.min(r, lc * 0.45);
    const p0: P = [b[0] + ((a[0] - b[0]) / la) * ra, b[1] + ((a[1] - b[1]) / la) * ra];
    const p1: P = [b[0] + ((c[0] - b[0]) / lc) * rc, b[1] + ((c[1] - b[1]) / lc) * rc];
    out.push(...quad(p0, b, p1, 5));
  }
  return out;
};
// la envolvente convexa (para las cajas proyectadas)
export const envolvente = (ps: P[]): P[] => {
  const p = ps.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P[] = [], up: P[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (const q of p.slice().reverse()) {
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
// una cinta de ancho w0 → w1 a lo largo de una línea (el vapor, los dedos, las mangueras), con las puntas redondas
export const cinta = (c: P[], w0: number, w1 = w0, puntas = true): P[] => {
  const n = c.length, L: P[] = [], R: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    const w = mix(w0, w1, i / (n - 1)) / 2;
    L.push([c[i][0] - dy * w, c[i][1] + dx * w]);
    R.push([c[i][0] + dy * w, c[i][1] - dx * w]);
  }
  if (!puntas) return [...L, ...R.reverse()];
  const e = c[n - 1], e2 = c[n - 2], s0 = c[0], s1 = c[1];
  const aE = Math.atan2(e[1] - e2[1], e[0] - e2[0]), aS = Math.atan2(s1[1] - s0[1], s1[0] - s0[0]);
  return [
    ...L, ...arco(e[0], e[1], w1 / 2, w1 / 2, aE + Math.PI / 2, aE - Math.PI / 2, 7),
    ...R.reverse(), ...arco(s0[0], s0[1], w0 / 2, w0 / 2, aS - Math.PI / 2, aS - Math.PI * 1.5, 7),
  ];
};
// la manguera: de a a b pasando por m (sin codo: una sola curva), del mismo ancho
export const manguera = (a: P, m: P, b: P, w0: number, w1 = w0): P[] => cinta(quad(a, porMedio(a, m, b), b, 16), w0, w1);
// una estrella de n puntas
export const estrella = (cx: number, cy: number, R: number, r: number, n: number, giro = 0): P[] =>
  Array.from({length: n * 2}, (_, i) => {
    const a = giro + (i / (n * 2)) * TAU - Math.PI / 2;
    const q = i % 2 ? r : R;
    return [cx + Math.cos(a) * q, cy + Math.sin(a) * q] as P;
  });

// ---------------------------------------------------------------- el hervor y el trazo
const remuestrea = (pts: P[], cerrada: boolean, paso = 8): P[] => {
  if (pts.length < 2) return pts;
  const out: P[] = [pts[0]];
  const n = cerrada ? pts.length : pts.length - 1;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let pos = paso - acc;
    while (pos < d) {
      const u = pos / d;
      out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
      pos += paso;
    }
    acc = d - (pos - paso);
  }
  if (!cerrada) out.push(pts[pts.length - 1]);
  return out;
};
const hierve = (s: P[], cerrada: boolean, amp: number, semilla: number): P[] => {
  if (amp <= 0 || s.length < 3) return s;
  const n = s.length, out: P[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const ia = cerrada ? s[(i - 1 + n) % n] : s[Math.max(0, i - 1)];
    const ib = cerrada ? s[(i + 1) % n] : s[Math.min(n - 1, i + 1)];
    let nx = -(ib[1] - ia[1]), ny = ib[0] - ia[0];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    const x = (i * 8) / 38;
    let v = ruido(x + semilla, 7);
    // en las cerradas, el final se funde con el principio (si no, sale un escalón)
    if (cerrada) v = mix(v, ruido(x - (n * 8) / 38 + semilla, 7), i / n);
    const v2 = ruido(x * 2.3 + semilla * 1.7 + 50, 11);
    const d = (v * 0.8 + v2 * 0.35) * amp;
    out[i] = [s[i][0] + nx * d, s[i][1] + ny * d];
  }
  return out;
};
const camino = (s: P[], cerrada: boolean) => {
  let d = `M${s[0][0].toFixed(1)} ${s[0][1].toFixed(1)}`;
  for (let i = 1; i < s.length; i++) d += `L${s[i][0].toFixed(1)} ${s[i][1].toFixed(1)}`;
  return cerrada ? d + 'Z' : d;
};

export type Op = {
  relleno?: string;
  lw?: number; // el grueso de la tinta
  linea?: string | null; // null: sin tinta
  sombra?: {col: string; dx: number; dy: number}; // la banda de sombra: lo que queda al mover el relleno (dx, dy) hacia la luz
  dentro?: (L: Lienzo) => void; // lo que se pinta recortado dentro de la forma (antes de la tinta)
  hierve?: number; // 0 = quieto (los fondos), 1 = normal
  abierta?: boolean;
  alfa?: number;
};

// El lienzo de un cuadro: junta los elementos en orden y les da sus ids de recorte
export class Lienzo {
  els: React.ReactNode[] = [];
  private n = 0;
  constructor(public pre: string, public dibujo: number, public amp = 1.5) {}
  // el número de dibujo (de 3 que se repiten) entra en la semilla: así cada pieza hierve a su manera
  private semilla(s: number) {
    return s * 13.37 + (((this.dibujo % 3) + 3) % 3) * 23.7;
  }
  d(pts: P[], cerrada: boolean, semilla: number, hierveK = 1) {
    const s = remuestrea(pts, cerrada);
    return camino(hierve(s, cerrada, hierveK * this.amp, this.semilla(semilla)), cerrada);
  }
  push(el: React.ReactElement) {
    this.els.push(React.cloneElement(el, {key: `k${this.n++}`}));
  }
  forma(semilla: number, pts: P[], op: Op = {}) {
    if (pts.length < 2) return;
    const cerrada = !op.abierta;
    const D = this.d(pts, cerrada, semilla, op.hierve ?? 1);
    const lw = op.lw ?? 8;
    const linea = op.linea === undefined ? TINTA : op.linea;
    const k = this.n++;
    const tinta = linea ? <path d={D} fill="none" stroke={linea} strokeWidth={lw} strokeLinejoin="round" strokeLinecap="round" /> : null;
    if (cerrada && (op.sombra || op.dentro) && op.relleno) {
      const id = `${this.pre}c${k}`;
      let dentro: React.ReactNode = null;
      if (op.dentro) {
        const sub = new Lienzo(`${this.pre}s${k}`, this.dibujo, this.amp);
        op.dentro(sub);
        dentro = sub.els;
      }
      this.els.push(
        <g key={`k${k}`} opacity={op.alfa}>
          <clipPath id={id}><path d={D} /></clipPath>
          <g clipPath={`url(#${id})`}>
            {op.sombra ? (
              <>
                <path d={D} fill={op.sombra.col} />
                <path d={D} fill={op.relleno} transform={`translate(${-op.sombra.dx} ${-op.sombra.dy})`} />
              </>
            ) : <path d={D} fill={op.relleno} />}
            {dentro}
          </g>
          {tinta}
        </g>,
      );
      return;
    }
    this.els.push(
      <path key={`k${k}`} d={D} fill={cerrada ? op.relleno ?? 'none' : 'none'} stroke={linea ?? 'none'} strokeWidth={linea ? lw : 0}
        strokeLinejoin="round" strokeLinecap="round" opacity={op.alfa} />,
    );
  }
  // una raya de tinta (abierta)
  trazo(semilla: number, pts: P[], lw = 6, op: Op = {}) {
    this.forma(semilla, pts, {...op, abierta: true, lw});
  }
  // varias piezas con un solo contorno por fuera (los guantes): primero todas en tinta gruesa, después todas rellenas
  union(semilla: number, partes: P[][], relleno: string, lw = 8) {
    const ds = partes.map((p, i) => this.d(p, true, semilla + i * 0.71));
    const k = this.n++;
    this.els.push(
      <g key={`k${k}`}>
        {ds.map((d, i) => <path key={`a${i}`} d={d} fill={TINTA} stroke={TINTA} strokeWidth={lw * 2} strokeLinejoin="round" />)}
        {ds.map((d, i) => <path key={`b${i}`} d={d} fill={relleno} />)}
      </g>,
    );
  }
  punto(x: number, y: number, r: number, col = TINTA) {
    this.els.push(<circle key={`k${this.n++}`} cx={x} cy={y} r={r} fill={col} />);
  }
}
