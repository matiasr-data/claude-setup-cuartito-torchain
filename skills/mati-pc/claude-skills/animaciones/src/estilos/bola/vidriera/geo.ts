import {rng} from '../../../comun/curvas';
import {proyecta, type P, type V3} from '../escena';

// VIDRIERA, LA GEOMETRÍA: lo que hace falta para cortar los vidrios. Cada vidrio es un polígono en px de la
// pantalla (o en las medidas de su pieza, si se mueve: así su textura viaja con él). Los cortes son suaves (Catmull-Rom:
// nada de esquinas hundidas) y un pelo irregulares, como cortados a mano con su semilla fija.

export const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

// ---------------------------------------------------------------- vectores
export const s3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const r3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const e3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const p3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const n3 = (a: V3): V3 => e3(a, 1 / Math.max(1e-9, Math.hypot(a[0], a[1], a[2])));
// el producto vectorial en las coordenadas del mundo (y hacia arriba) para vectores de la pantalla (y hacia abajo)
export const cruz = (a: V3, b: V3): V3 => {
  const A: V3 = [a[0], -a[1], a[2]], B: V3 = [b[0], -b[1], b[2]];
  return [A[1] * B[2] - A[2] * B[1], -(A[2] * B[0] - A[0] * B[2]), A[0] * B[1] - A[1] * B[0]];
};
export const pr = (q: V3): P => proyecta(q);
export const s2 = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
export const r2 = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
export const e2 = (a: P, k: number): P => [a[0] * k, a[1] * k];
export const l2 = (a: P) => Math.hypot(a[0], a[1]);
export const mix2 = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
export const rota2 = (a: P, ang: number): P => [a[0] * Math.cos(ang) - a[1] * Math.sin(ang), a[0] * Math.sin(ang) + a[1] * Math.cos(ang)];

// ---------------------------------------------------------------- caminos
export const recto = (pts: P[], cerrado = true) =>
  pts.length ? 'M ' + pts.map((q) => `${f1(q[0])} ${f1(q[1])}`).join(' L ') + (cerrado ? ' Z' : '') : '';

// un corte suave por los puntos (Catmull-Rom cerrado; tension 0 = recto, 1 = muy redondo)
export const suave = (pts: P[], tension = 0.5): string => {
  const n = pts.length;
  if (n < 3) return recto(pts);
  const k = tension / 6;
  let d = `M ${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1: P = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: P = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += ` C ${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + ' Z';
};

// lo mismo, abierto (una línea de plomo o un trazo de grisalla)
export const suaveAbierto = (pts: P[], tension = 0.5): string => {
  const n = pts.length;
  if (n < 3) return recto(pts, false);
  const k = tension / 6;
  let d = `M ${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const c1: P = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: P = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += ` C ${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d;
};

// ---------------------------------------------------------------- formas
export const elipse = (c: P, rx: number, ry: number, n = 28, giro = 0): P[] =>
  Array.from({length: n}, (_, i) => {
    const a = Math.PI + (i / n) * Math.PI * 2;
    return s2(c, rota2([rx * Math.cos(a), ry * Math.sin(a)], giro));
  });

// una cápsula de a (radio ra) a b (radio rb), en px de la pantalla
export const capsula = (a: P, b: P, ra: number, rb = ra, n = 9): P[] => {
  const d = r2(b, a);
  const L = Math.max(1e-3, l2(d));
  const ang = Math.atan2(d[1], d[0]);
  const s = Math.max(-0.95, Math.min(0.95, (ra - rb) / L));
  const t = Math.acos(s);
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const u = t + (i / n) * (2 * Math.PI - 2 * t);
    out.push(s2(a, rota2([ra * Math.cos(u), ra * Math.sin(u)], ang)));
  }
  for (let i = 0; i <= n; i++) {
    const u = -t + (i / n) * 2 * t;
    out.push(s2(b, rota2([rb * Math.cos(u), rb * Math.sin(u)], ang)));
  }
  return out;
};

// un ladrillo plano de a a b, de ancho w, con las esquinas un poco redondas
export const barra = (a: P, b: P, w: number, w2 = w): P[] => {
  const d = r2(b, a);
  const L = Math.max(1e-3, l2(d));
  const u: P = [d[0] / L, d[1] / L], v: P = [-u[1], u[0]];
  return [s2(a, e2(v, w / 2)), s2(b, e2(v, w2 / 2)), s2(b, e2(v, -w2 / 2)), s2(a, e2(v, -w / 2))];
};

// la envolvente convexa (monotone chain)
export const casco = (pts: P[]): P[] => {
  const q = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (q.length < 3) return q;
  const x = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P[] = [], hi: P[] = [];
  for (const p of q) {
    while (lo.length >= 2 && x(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  for (let i = q.length - 1; i >= 0; i--) {
    const p = q[i];
    while (hi.length >= 2 && x(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop();
    hi.push(p);
  }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
};

// cortado a mano: cada vértice se aparta un pelo, siempre igual (la semilla es de la pieza)
export const aMano = (pts: P[], semilla: number, amp = 2.5): P[] => {
  const r = rng(semilla);
  return pts.map((q) => [q[0] + (r() - 0.5) * 2 * amp, q[1] + (r() - 0.5) * 2 * amp] as P);
};

// el centro (de los vértices)
export const centro = (pts: P[]): P => {
  let x = 0, y = 0;
  for (const q of pts) {
    x += q[0];
    y += q[1];
  }
  return [x / Math.max(1, pts.length), y / Math.max(1, pts.length)];
};

// ---------------------------------------------------------------- una caja en 3D, vista: sus caras de cara a la cámara, ya proyectadas
// c: el centro; ejes: tres vectores unitarios (en coordenadas de la pantalla); m: la mitad de cada lado
export type Cara3 = {pts: P[]; n: V3; z: number; eje: 0 | 1 | 2; signo: 1 | -1};
const CAM: V3 = [540, 300, 3582.8];
export const caja3 = (c: V3, ejes: [V3, V3, V3], m: [number, number, number]): Cara3[] => {
  const out: Cara3[] = [];
  for (const eje of [0, 1, 2] as const) {
    for (const signo of [1, -1] as const) {
      const n = e3(ejes[eje], signo);
      const fc = s3(c, e3(n, m[eje]));
      if (p3(n, r3(CAM, fc)) <= 0) continue;
      const [a, b] = ([0, 1, 2] as const).filter((k) => k !== eje);
      const esq: V3[] = [
        s3(s3(fc, e3(ejes[a], m[a])), e3(ejes[b], m[b])),
        s3(s3(fc, e3(ejes[a], -m[a])), e3(ejes[b], m[b])),
        s3(s3(fc, e3(ejes[a], -m[a])), e3(ejes[b], -m[b])),
        s3(s3(fc, e3(ejes[a], m[a])), e3(ejes[b], -m[b])),
      ];
      out.push({pts: esq.map(pr), n, z: fc[2], eje, signo});
    }
  }
  return out;
};

// un punto dentro de una cara de caja3 (u, v de −1 a 1 sobre sus dos ejes): para pintar o emplomar encima
export const enCara = (c: V3, ejes: [V3, V3, V3], m: [number, number, number], eje: 0 | 1 | 2, signo: 1 | -1, u: number, v: number): P => {
  const [a, b] = ([0, 1, 2] as const).filter((k) => k !== eje);
  const q = s3(s3(s3(c, e3(ejes[eje], signo * m[eje])), e3(ejes[a], u * m[a])), e3(ejes[b], v * m[b]));
  return pr(q);
};

// un cilindro (su eje de abajo arriba), su silueta proyectada
export const cilindro3 = (abajo: V3, eje: V3, alto: number, r: number, n = 26): P[] => {
  const e = n3(eje);
  // dos vectores perpendiculares al eje
  const t0 = Math.abs(e[1]) < 0.9 ? n3(cruz(e, [0, -1, 0])) : n3(cruz(e, [1, 0, 0]));
  const t1 = n3(cruz(e, t0));
  const pts: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const d = s3(e3(t0, r * Math.cos(a)), e3(t1, r * Math.sin(a)));
    pts.push(pr(s3(abajo, d)), pr(s3(s3(abajo, e3(e, alto)), d)));
  }
  return casco(pts);
};
