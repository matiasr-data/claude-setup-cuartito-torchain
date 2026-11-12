import {MUNECO, esqueleto, giroRaiz, proyecta, type Pose, type V3} from '../escena';

// LA GEOMETRÍA QUE NECESITA LA TINTA. escena.ts da el esqueleto del muñeco en puntos; para pintarlo como
// un volumen (el bloque del cuerpo, la cabeza redonda con la cara que gira con ella) hacen falta sus ejes. Aquí se rehacen con las
// MISMAS cuentas que escena.ts (sin tocarla): la raíz gira en y, el cuerpo en XYZ (inclina, 0, ladea) y la cabeza en YXZ.
// Mundo: y hacia arriba (y = −la de la pantalla). Lo que sale para pintar ya está en la pantalla (proyectado).

export type P2 = [number, number];
type M3 = number[];
const mm = (a: M3, b: M3): M3 => {
  const o: number[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]);
  return o;
};
const ap = (m: M3, v: V3): V3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const rx = (a: number): M3 => [1, 0, 0, 0, Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a)];
const ry = (a: number): M3 => [Math.cos(a), 0, Math.sin(a), 0, 1, 0, -Math.sin(a), 0, Math.cos(a)];
const rz = (a: number): M3 => [Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a), 0, 0, 0, 1];
export const suma = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const resta = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const por = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const aMundo = (q: V3): V3 => [q[0], -q[1], q[2]];
const aPantalla = (q: V3): V3 => [q[0], -q[1], q[2]];

// de un punto del mundo (y arriba) a la pantalla
export const pm = (q: V3): P2 => proyecta(aPantalla(q));
// de un punto de la pantalla en 3D (y abajo) a la pantalla
export const pp = (q: V3): P2 => proyecta(q);

// el giro de un eje: vuelve un punto alrededor de un eje vertical (mundo)
export const ejeY = (a: number) => ry(a);
export const aplica = ap;

export type Cuerpo = {
  MC: M3; MH: M3; MR: M3;
  raiz: V3; // donde se sienta (la base de la cadera), en el mundo
  base: V3; // el pivote del cuerpo (arriba de la cadera), en el mundo
  cabezaBase: V3; // el centro de abajo de la cabeza (donde nace el cuello), en el mundo
  s: number; // la escala del muñeco
};
export const cuerpo = (pose: Pose): Cuerpo => {
  const s = MUNECO.escala;
  const MR = ry(giroRaiz(pose));
  const MC = mm(MR, mm(rx(pose.inclina), rz(pose.ladea)));
  const MH = mm(MC, mm(ry(pose.cabeza.gira), mm(rx(pose.cabeza.cabecea), rz(pose.cabeza.ladea))));
  const raiz = suma(aMundo(pose.base), [0, pose.salto, 0]);
  const base = suma(raiz, ap(MR, [0, MUNECO.cadera * s, 0]));
  const cabezaBase = suma(base, ap(MC, [0, (MUNECO.torso.alto + MUNECO.cuello) * s, 0]));
  return {MC, MH, MR, raiz, base, cabezaBase, s};
};
// un punto en el marco de la raíz / del cuerpo / de la cabeza (en unidades del muñeco, sin escalar) → mundo
export const enRaiz = (c: Cuerpo, v: V3): V3 => suma(c.raiz, ap(c.MR, por(v, c.s)));
export const enCuerpo = (c: Cuerpo, v: V3): V3 => suma(c.base, ap(c.MC, por(v, c.s)));
export const enCabeza = (c: Cuerpo, v: V3): V3 => suma(c.cabezaBase, ap(c.MH, por(v, c.s)));
export const ejeDe = (m: M3, k: 0 | 1 | 2): V3 => [m[k], m[3 + k], m[6 + k]];

// el esqueleto ya proyectado (y su z, para ordenar lo que va delante)
export type Hueso = {p: P2; z: number};
export const huesos = (pose: Pose) => {
  const e = esqueleto(pose);
  const h = (q: V3): Hueso => ({p: proyecta(q), z: q[2]});
  return {
    e,
    cadera: h(e.cadera), pecho: h(e.pecho), cuello: h(e.cuello), cabeza: h(e.cabeza),
    hombro: [h(e.hombro[0]), h(e.hombro[1])], codo: [h(e.codo[0]), h(e.codo[1])], mano: [h(e.mano[0]), h(e.mano[1])],
    rodilla: [h(e.rodilla[0]), h(e.rodilla[1])], pie: [h(e.pie[0]), h(e.pie[1])],
  };
};

// la envolvente convexa (para la silueta de un bloque o de un cilindro)
export const envolvente = (pts: P2[]): P2[] => {
  const q = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (q.length < 3) return q;
  const cruz = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [], hi: P2[] = [];
  for (const p of q) {
    while (lo.length >= 2 && cruz(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  for (let i = q.length - 1; i >= 0; i--) {
    const p = q[i];
    while (hi.length >= 2 && cruz(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop();
    hi.push(p);
  }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
};

// los 8 vértices de una caja en un marco (centro abajo en v0, medidas an × alto × fondo)
export const cajaPts = (f: (v: V3) => V3, an: number, alto: number, fondo: number, y0 = 0): V3[] => {
  const out: V3[] = [];
  for (const x of [-an / 2, an / 2]) for (const y of [y0, y0 + alto]) for (const z of [-fondo / 2, fondo / 2]) out.push(f([x, y, z]));
  return out;
};
// un cilindro vertical en un marco: los aros de abajo y de arriba
export const cilindroPts = (f: (v: V3) => V3, r: number, y0: number, y1: number, n = 28): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(f([r * Math.sin(a), y0, r * Math.cos(a)]), f([r * Math.sin(a), y1, r * Math.cos(a)]));
  }
  return out;
};
