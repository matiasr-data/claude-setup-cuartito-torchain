import {mix, rng} from '../../../comun/curvas';
import {CAMARA, proyecta, type V3} from '../escena';
import {Plancha, TINTA, mueve, poli, recta, suave, talla, tiembla, type Bloque, type P} from './imprenta';

// LO QUE COMPARTEN EL DECORADO Y LO QUE SE MUEVE (grabado japonés): pasar las piezas de la escena (en 3D, las medidas de
// escena.ts) a formas planas de estampa. Una caja se proyecta con la cámara de la escena y se pinta cara a cara con tintas planas
// (arriba, la clara; de frente, la del color; de lado, la oscura), como los planos de la arquitectura en un grabado: sin sombras.

export const pr = (x: number, y: number, z: number): P => proyecta([x, y, z]);

// girar alrededor de un eje vertical (el mismo giro que usa three.js en y)
export const giraY = (q: V3, piv: V3, a: number): V3 => {
  const dx = q[0] - piv[0], dz = q[2] - piv[2];
  const c = Math.cos(a), s = Math.sin(a);
  return [piv[0] + dx * c + dz * s, q[1], piv[2] - dx * s + dz * c];
};

export type CaraCaja = {pts: P[]; tipo: 'arriba' | 'abajo' | 'frente' | 'lado'; z: number};
const CARAS: {i: number[]; n: V3}[] = [
  {i: [0, 1, 3, 2], n: [-1, 0, 0]}, {i: [4, 6, 7, 5], n: [1, 0, 0]},
  {i: [0, 4, 5, 1], n: [0, -1, 0]}, {i: [2, 3, 7, 6], n: [0, 1, 0]},
  {i: [0, 2, 6, 4], n: [0, 0, -1]}, {i: [1, 5, 7, 3], n: [0, 0, 1]},
];
// las caras que se ven de una caja (centro, medidas [ancho x, alto y, fondo z], giro alrededor de un pivote)
export const caja = (c: V3, dim: V3, giro = 0, piv: V3 = c): CaraCaja[] => {
  const esq: V3[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    esq.push(giraY([c[0] + (sx * dim[0]) / 2, c[1] + (sy * dim[1]) / 2, c[2] + (sz * dim[2]) / 2], piv, giro));
  }
  const out: CaraCaja[] = [];
  for (const f of CARAS) {
    const n = giraY(f.n, [0, 0, 0], giro);
    const q = f.i.map((k) => esq[k]);
    const cc: V3 = [0, 1, 2].map((j) => q.reduce((s, v) => s + v[j], 0) / 4) as V3;
    const aCam = [CAMARA[0] - cc[0], CAMARA[1] - cc[1], CAMARA[2] - cc[2]];
    if (n[0] * aCam[0] + n[1] * aCam[1] + n[2] * aCam[2] <= 0) continue;
    const tipo = n[1] < -0.5 ? 'arriba' : n[1] > 0.5 ? 'abajo' : n[2] > 0.55 ? 'frente' : 'lado';
    out.push({pts: q.map((v) => proyecta(v)), tipo, z: cc[2]});
  }
  return out;
};
// una caja pintada: cada cara con su tinta, y el contorno tallado
export const pintaCaja = (pl: Plancha, c: V3, dim: V3, tintas: {arriba: string; frente: string; lado: string}, bloque: Bloque,
  o: {giro?: number; piv?: V3; linea?: number; negro?: boolean; semilla?: number; motivo?: (cara: CaraCaja) => void} = {}) => {
  const caras = caja(c, dim, o.giro ?? 0, o.piv ?? c);
  const s = o.semilla ?? 1;
  for (const f of caras) {
    const col = f.tipo === 'arriba' ? tintas.arriba : f.tipo === 'frente' ? tintas.frente : f.tipo === 'lado' ? tintas.lado : tintas.lado;
    const p = poli(f.pts);
    if (o.negro) pl.negro(p, col, 1, true);
    else pl.tinta(p, col, bloque);
  }
  if (o.motivo) for (const f of caras) o.motivo(f);
  const ancho = o.linea ?? 3.2;
  if (ancho > 0) for (const f of caras) pl.raya(poli(tiembla(f.pts.flatMap((q, k) => recta(q, f.pts[(k + 1) % f.pts.length], 3).slice(0, 3)), 0.7, s)), ancho);
  return caras;
};
// un círculo horizontal (en el plano del suelo a la altura y) en la pantalla
export const circulo = (cx: number, y: number, cz: number, r: number, n = 40, desde = 0, hasta = Math.PI * 2): P[] =>
  Array.from({length: n + 1}, (_, k) => {
    const a = mix(desde, hasta, k / n);
    return pr(cx + r * Math.cos(a), y, cz + r * Math.sin(a));
  });

// ---------------------------------------------------------------- la bola de papel arrugado (la de la escena y las de la mesa)
// Papel sin imprimir (el blanco de la estampa) con su contorno quebrado, los pliegues tallados y trocitos de las rayas azules
// del cuaderno. Gira con la bola; en cada golpe se aplasta a lo largo de la normal.
const FORMAS = new Map<number, {borde: P[]; pliegues: P[][]; rayas: [P, P][]}>();
const forma = (semilla: number) => {
  let f = FORMAS.get(semilla);
  if (f) return f;
  const r = rng(semilla);
  const n = 13;
  const borde: P[] = Array.from({length: n}, (_, k) => {
    const a = (k / n) * Math.PI * 2 + (r() - 0.5) * 0.3;
    const d = 0.86 + r() * 0.2 - (k % 3 === 0 ? 0.06 : 0);
    return [Math.cos(a) * d, Math.sin(a) * d];
  });
  // los pliegues: quebradas cortas que salen de dentro hacia el borde
  const pliegues: P[][] = [];
  for (let k = 0; k < 6; k++) {
    const a = r() * Math.PI * 2, d0 = r() * 0.35;
    const p0: P = [Math.cos(a) * d0, Math.sin(a) * d0];
    const a1 = a + (r() - 0.5) * 1.2, a2 = a1 + (r() - 0.5) * 1.4;
    const p1: P = [p0[0] + Math.cos(a1) * 0.32, p0[1] + Math.sin(a1) * 0.32];
    const p2: P = [p1[0] + Math.cos(a2) * 0.28, p1[1] + Math.sin(a2) * 0.28];
    pliegues.push([p0, p1, p2]);
  }
  const rayas: [P, P][] = [];
  for (let k = 0; k < 4; k++) {
    const y = -0.5 + k * 0.3 + (r() - 0.5) * 0.1, x0 = -0.7 + r() * 0.4, x1 = x0 + 0.35 + r() * 0.5, g = (r() - 0.5) * 0.5;
    rayas.push([[x0, y], [x1, y + g * 0.3]]);
  }
  f = {borde, pliegues, rayas};
  FORMAS.set(semilla, f);
  return f;
};
export const bolaPapel = (pl: Plancha, c: P, radio: number, giro: number, semilla: number,
  aplasta: {k: number; n: P} = {k: 0, n: [0, -1]}, linea = 4.6) => {
  const f = forma(semilla);
  // la matriz: girar con la bola y aplastar a lo largo de la normal
  const an = Math.atan2(aplasta.n[1], aplasta.n[0]);
  const m = new DOMMatrix()
    .translate(c[0], c[1])
    .rotate((an * 180) / Math.PI)
    .scale(1 - 0.26 * aplasta.k, 1 + 0.16 * aplasta.k)
    .rotate((-an * 180) / Math.PI)
    .rotate((giro * 180) / Math.PI)
    .scale(radio, radio);
  const borde = mueve(suave(f.borde.map(([x, y]) => [x * 1.02, y * 1.02] as P), true), m);
  // el contorno quebrado (con picos: la bola es de papel arrugado, no una pelota)
  const quebrado = mueve(poli(f.borde), m);
  pl.papel(borde);
  pl.papel(quebrado);
  pl.recorte = quebrado;
  for (const [a, b] of f.rayas) {
    const q = [a, b].map(([x, y]) => {
      const v = new DOMPoint(x, y).matrixTransform(m);
      return [v.x, v.y] as P;
    });
    pl.trazoTinta(poli(q, false), Math.max(1.4, radio * 0.05), TINTA.prusiaP, 'azul', 0.9);
  }
  pl.recorte = null;
  for (const [k, q] of f.pliegues.entries()) {
    const pts = q.map(([x, y]) => {
      const v = new DOMPoint(x, y).matrixTransform(m);
      return [v.x, v.y] as P;
    });
    pl.negro(talla(pts, Math.max(1.6, radio * 0.07), {afina: [0.3, 0.5], semilla: semilla + k, per: 3}));
  }
  pl.raya(quebrado, linea);
};

// el contorno tallado de un camino cerrado, en puntos (para las piezas que no son cajas)
export const contorno = (pl: Plancha, pts: P[], ancho: number, semilla = 1, amp = 0.8) =>
  pl.raya(suave(tiembla(pts, amp, semilla), true), ancho);
