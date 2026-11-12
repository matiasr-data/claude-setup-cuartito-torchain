import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Bangers';
import {rng} from '../../../comun/curvas';
import {CAMARA, proyecta, type V3} from '../escena';

// CÓMIC, LO QUE COMPARTEN TODAS LAS PIEZAS: las tintas, la trama de puntos, el registro de la imprenta, la
// letra de los rótulos y las formas (cápsulas, estallidos, cajas en perspectiva). Como en una página impresa: una tinta negra para
// todos los contornos, cuatro o cinco tintas planas y vivas, y las sombras y los degradados hechos con puntos (la trama Ben-Day), con
// la rejilla fija a la página como en la imprenta (los puntos no viajan con lo que se mueve).

export type P = [number, number];

// ---------------------------------------------------------------- las tintas
export const TINTA = '#17121F';
export const C = {
  papel: '#F3E4BE', // el papel del cómic, amarillento (el margen de la viñeta)
  crema: '#FFF7E2', // el «blanco» impreso
  amarillo: '#FFD21F',
  amarilloSombra: '#F6A21C',
  naranja: '#FF8A1E',
  rojo: '#E8262F',
  rojoSombra: '#A8121D',
  rojoHondo: '#4A0910',
  azul: '#2160D8',
  azulSombra: '#123C93',
  azulClaro: '#6A9BF4',
  cian: '#3EC4EA',
  cianClaro: '#C8EEF6',
  cianPared: '#9EDCEF',
  cianPuntos: '#4DB6E2',
  piel: '#FFD5B2',
  pielPuntos: '#F0786A',
  marino: '#26388A',
  marinoSombra: '#131E56',
  marron: '#7C3F1C',
  marronClaro: '#C06A2E',
  verde: '#35B54B',
  verdeSombra: '#1B7A31',
  suelo: '#F7C35E',
  sueloPuntos: '#E07A2C',
  sombraSuelo: '#4A210C',
  madera: '#9C4E22',
  maderaClara: '#CF7636',
  gris: '#9497AE',
  grisOscuro: '#4B4D60',
  sudor: '#8FDDF7',
};
// el registro de la imprenta: las tintas de color van corridas un pelo respecto a la negra
export const REG: P = [4.5, 3.5];
// la luz: de la ventana, arriba a la izquierda y un poco de delante (en coordenadas de la pantalla, con la y hacia abajo)
export const LUZ: V3 = (() => {
  const v: V3 = [-0.55, -0.7, 0.45];
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
})();

// ---------------------------------------------------------------- la letra de los rótulos (Bangers, la de los cómics)
const fuente = loadFont('normal', {weights: ['400'], subsets: ['latin']});
export const LETRA = fuente.fontFamily;
let LISTA = false;
const PROMESA = fuente.waitUntilDone().then(() => {
  LISTA = true;
});
// los anchos de cada letra se miden con la fuente ya cargada: este gancho espera a la fuente (y retiene el cuadro hasta entonces)
export const useLetra = () => {
  const [lista, setLista] = useState(LISTA);
  const [h] = useState(() => (LISTA ? null : delayRender('La letra del cómic (Bangers)')));
  useEffect(() => {
    let vivo = true;
    PROMESA.then(() => {
      if (vivo) setLista(true);
      if (h !== null) continueRender(h);
    });
    return () => {
      vivo = false;
    };
  }, [h]);
  return lista;
};
let ctx: CanvasRenderingContext2D | null = null;
const ANCHOS = new Map<string, number>();
// el avance de una letra, en «em»
export const anchoLetra = (c: string): number => {
  const k = ANCHOS.get(c);
  if (k !== undefined) return k;
  if (!LISTA || typeof document === 'undefined') return 0.5;
  ctx ??= document.createElement('canvas').getContext('2d');
  if (!ctx) return 0.5;
  ctx.font = `100px ${LETRA}`;
  const w = ctx.measureText(c).width / 100;
  ANCHOS.set(c, w);
  return w;
};

// ---------------------------------------------------------------- caminos
export const f1 = (n: number) => n.toFixed(1);
export const poli = (pts: P[], cerrar = true) => 'M ' + pts.map((q) => `${f1(q[0])} ${f1(q[1])}`).join(' L ') + (cerrar ? ' Z' : '');
// una curva suave que pasa por los puntos (Catmull-Rom)
export const curva = (pts: P[], cerrar = false) => {
  const n = pts.length;
  if (n < 3) return poli(pts, cerrar);
  const q = (i: number) => (cerrar ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M ${f1(pts[0][0])} ${f1(pts[0][1])}`;
  const fin = cerrar ? n : n - 1;
  for (let i = 0; i < fin; i++) {
    const p0 = q(i - 1), p1 = q(i), p2 = q(i + 1), p3 = q(i + 2);
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + (cerrar ? ' Z' : '');
};
// una cápsula de a (radio ra) a b (radio rb): brazos, piernas, la estela
export const capsula = (a: P, b: P, ra: number, rb: number) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const d = Math.max(1e-3, Math.hypot(dx, dy));
  if (d <= Math.abs(ra - rb)) {
    const r = Math.max(ra, rb), c = ra >= rb ? a : b;
    return `M ${f1(c[0] - r)} ${f1(c[1])} a ${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0 a ${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0 Z`;
  }
  const th = Math.atan2(dy, dx);
  const fi = Math.acos(Math.max(-1, Math.min(1, (ra - rb) / d)));
  const en = (c: P, r: number, ang: number): P => [c[0] + r * Math.cos(ang), c[1] + r * Math.sin(ang)];
  const A1 = en(a, ra, th + fi), B1 = en(b, rb, th + fi), B2 = en(b, rb, th - fi), A2 = en(a, ra, th - fi);
  const gb = 2 * fi > Math.PI ? 1 : 0, ga = 2 * Math.PI - 2 * fi > Math.PI ? 1 : 0;
  return `M ${f1(A1[0])} ${f1(A1[1])} L ${f1(B1[0])} ${f1(B1[1])} A ${f1(rb)} ${f1(rb)} 0 ${gb} 0 ${f1(B2[0])} ${f1(B2[1])} L ${f1(A2[0])} ${f1(A2[1])} A ${f1(ra)} ${f1(ra)} 0 ${ga} 0 ${f1(A1[0])} ${f1(A1[1])} Z`;
};
export const circulo = (c: P, r: number) => `M ${f1(c[0] - r)} ${f1(c[1])} a ${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0 a ${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0 Z`;
export const elipse = (c: P, rx: number, ry: number, n = 40, giro = 0): P[] => {
  const out: P[] = [];
  const cg = Math.cos(giro), sg = Math.sin(giro);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const x = rx * Math.cos(a), y = ry * Math.sin(a);
    out.push([c[0] + x * cg - y * sg, c[1] + x * sg + y * cg]);
  }
  return out;
};
// el estallido: la forma de las onomatopeyas grandes y de los gritos (puntas irregulares, con su semilla)
export const estallido = (cx: number, cy: number, rx: number, ry: number, puntas: number, semilla: number, hondo = 0.68, giro = 0): P[] => {
  const r = rng(semilla);
  const out: P[] = [];
  for (let k = 0; k < 2 * puntas; k++) {
    const a = (k / (2 * puntas)) * Math.PI * 2 + giro + (r() - 0.5) * (Math.PI / puntas) * 0.5;
    const R = k % 2 === 0 ? 0.9 + r() * 0.28 : hondo * (0.9 + r() * 0.16);
    out.push([cx + Math.cos(a) * rx * R, cy + Math.sin(a) * ry * R]);
  }
  return out;
};
// una estrella de n puntas
export const estrella = (c: P, r: number, n = 5, hondo = 0.45, giro = -Math.PI / 2): P[] => {
  const out: P[] = [];
  for (let k = 0; k < 2 * n; k++) {
    const a = giro + (k / (2 * n)) * Math.PI * 2;
    const R = k % 2 === 0 ? r : r * hondo;
    out.push([c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R]);
  }
  return out;
};

// ---------------------------------------------------------------- la trama de puntos
// Una rejilla girada (ang, en grados) de paso «paso», fija a la página. Cada punto, del radio que pide la densidad (0 = nada; hacia
// 1 los puntos se tocan y se vuelven tinta plena). «dentro» recorta a una forma (por el centro del punto: el contorno tapa el resto).
export const trama = (
  caja: [number, number, number, number],
  paso: number,
  ang: number,
  dens: (x: number, y: number) => number,
  dentro?: (x: number, y: number) => boolean,
  k = 0.68,
): string => {
  const [x0, y0, x1, y1] = caja;
  const a = (ang * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a);
  const aIJ = (x: number, y: number): P => [(x * ux + y * uy) / paso, (-x * uy + y * ux) / paso];
  const esq = [aIJ(x0, y0), aIJ(x1, y0), aIJ(x0, y1), aIJ(x1, y1)];
  const i0 = Math.floor(Math.min(...esq.map((e) => e[0]))), i1 = Math.ceil(Math.max(...esq.map((e) => e[0])));
  const j0 = Math.floor(Math.min(...esq.map((e) => e[1]))), j1 = Math.ceil(Math.max(...esq.map((e) => e[1])));
  const out: string[] = [];
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const x = (i * ux - j * uy) * paso, y = (i * uy + j * ux) * paso;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      if (dentro && !dentro(x, y)) continue;
      const d = dens(x, y);
      if (d <= 0.03) continue;
      const r = Math.min(d, 1.2) * paso * k;
      if (r < 0.7) continue;
      out.push(`M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0`);
    }
  }
  return out.join('');
};
// ¿está el punto dentro del polígono?
export const dentroDe = (pts: P[]) => (x: number, y: number) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi) c = !c;
  }
  return c;
};
export const cajaDe = (pts: P[], m = 0): [number, number, number, number] => [
  Math.min(...pts.map((q) => q[0])) - m, Math.min(...pts.map((q) => q[1])) - m, Math.max(...pts.map((q) => q[0])) + m, Math.max(...pts.map((q) => q[1])) + m,
];
export const suave01 = (a: number, b: number, x: number) => {
  const k = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

// ---------------------------------------------------------------- vectores y cajas en perspectiva
export const suma = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const resta = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const por = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const punto = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const unit = (a: V3): V3 => por(a, 1 / Math.max(1e-9, Math.hypot(a[0], a[1], a[2])));
export const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const pr = (v: V3): P => proyecta(v);

export type CaraCaja = {pts: P[]; n: V3; luz: number};
// las caras que se ven de una caja (centro c y sus tres semiejes), ya en la pantalla, con lo que les da la luz
export const caja = (c: V3, a: V3, b: V3, d: V3): CaraCaja[] => {
  const out: CaraCaja[] = [];
  const ejes: [V3, V3, V3][] = [[a, b, d], [b, d, a], [d, a, b]];
  for (const [n, u, v] of ejes) {
    for (const s of [1, -1]) {
      const cn = suma(c, por(n, s));
      const nn = unit(por(n, s));
      if (punto(nn, resta(CAMARA, cn)) <= 0) continue;
      const esq: V3[] = [suma(suma(cn, u), v), suma(suma(cn, u), por(v, -1)), suma(suma(cn, por(u, -1)), por(v, -1)), suma(suma(cn, por(u, -1)), v)];
      out.push({pts: esq.map(pr), n: nn, luz: punto(nn, LUZ)});
    }
  }
  return out;
};
// la envolvente (para el contorno grueso de fuera de una caja)
export const envolvente = (pts: P[]): P[] => {
  const s = [...pts].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const x = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P[] = [], hi: P[] = [];
  for (const q of s) {
    while (lo.length >= 2 && x(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (const q of [...s].reverse()) {
    while (hi.length >= 2 && x(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
    hi.push(q);
  }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};
// un aro horizontal (a la altura y, de radio r, alrededor de cx, cz), en la pantalla; de fi0 a fi1 (radianes; 0 = a la derecha,
// π/2 = hacia la cámara)
export const aro = (cx: number, y: number, cz: number, r: number, fi0 = 0, fi1 = Math.PI * 2, n = 48): P[] => {
  const out: P[] = [];
  for (let k = 0; k <= n; k++) {
    const f = fi0 + ((fi1 - fi0) * k) / n;
    out.push(pr([cx + r * Math.cos(f), y, cz + r * Math.sin(f)]));
  }
  return out;
};
