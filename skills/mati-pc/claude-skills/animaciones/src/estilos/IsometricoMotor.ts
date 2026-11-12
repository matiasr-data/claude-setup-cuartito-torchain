import type {P} from './formas';

// LA CÁMARA ISOMÉTRICA del estilo 4 (gato/Isometrico.tsx). Isometría de verdad: los tres ejes a 120° y con el mismo largo en pantalla,
// sin perspectiva. El mundo va en px de la escena (483 el metro):
//   a = adelante (en pantalla, hacia abajo a la derecha);
//   l = de lado, + hacia la cámara (el «cerca» del perfil); la pared queda en − ;
//   z = arriba.
// Lo más cerca de la cámara es lo que tiene a + l + z mayor: con eso se ordena qué tapa a qué.

export type V3 = [number, number, number];
export const K = 0.86; // px de pantalla por px de mundo a lo largo de cada eje
export const K3 = K * Math.sqrt(1.5); // lo que mide en pantalla un largo perpendicular a la vista (el radio de una esfera, un grosor)
const CX = Math.cos(Math.PI / 6) * K;
const CY = 0.5 * K;
export const ORIGEN: P = [486, 1540]; // donde pisa él: la cámara le sigue, así que no se mueve de aquí

export const pr = (q: V3): P => [ORIGEN[0] + (q[0] - q[1]) * CX, ORIGEN[1] + (q[0] + q[1]) * CY - q[2] * K];
export const hondo = (q: V3) => q[0] + q[1] + q[2];
export const mas = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
export const prod = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const f1 = (n: number) => n.toFixed(1);
export const ruta = (pts: P[], cerrar = true) => 'M ' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L ') + (cerrar ? ' Z' : '');
export const ruta3 = (pts: V3[], cerrar = true) => ruta(pts.map(pr), cerrar);

// Un plano del mundo como transformación de SVG, para dibujar en 2D encima (pantallas, cuadros, el reloj, las baldosas):
// el origen es el punto q, u avanza por el primer eje y v por el segundo.
const mat = (a: number, b: number, c: number, d: number, o: P) =>
  `matrix(${a.toFixed(4)} ${b.toFixed(4)} ${c.toFixed(4)} ${d.toFixed(4)} ${f1(o[0])} ${f1(o[1])})`;
export const plano = {
  pared: (q: V3) => mat(CX, CY, 0, K, pr(q)), // de cara a la cámara (+l): u hacia +a, v hacia abajo
  suelo: (q: V3) => mat(CX, CY, -CX, CY, pr(q)), // u hacia +a, v hacia +l
  frente: (q: V3) => mat(CX, -CY, 0, K, pr(q)), // la cara +a: u hacia −l, v hacia abajo
};
const lin = (v: V3): P => [(v[0] - v[1]) * CX, (v[0] + v[1]) * CY - v[2] * K];
// un plano cualquiera: origen o, y u y v sus dos ejes (cuánto mundo es una unidad de dibujo)
export const planoDe = (o: V3, u: V3, v: V3) => {
  const a = lin(u), b = lin(v);
  return mat(a[0], a[1], b[0], b[1], pr(o));
};

// las tres caras que se ven de una caja: la de arriba, la que mira a la cámara por la izquierda (+l) y la de la derecha (+a)
export const caras = (o: V3, d: V3) => {
  const [a0, l0, z0] = o;
  const a1 = a0 + d[0], l1 = l0 + d[1], z1 = z0 + d[2];
  return {
    arriba: ruta3([[a0, l0, z1], [a1, l0, z1], [a1, l1, z1], [a0, l1, z1]]),
    izq: ruta3([[a0, l1, z0], [a1, l1, z0], [a1, l1, z1], [a0, l1, z1]]),
    der: ruta3([[a1, l0, z0], [a1, l1, z0], [a1, l1, z1], [a1, l0, z1]]),
  };
};
export const esquinas = (o: V3, d: V3): V3[] => {
  const out: V3[] = [];
  for (const i of [0, 1]) for (const j of [0, 1]) for (const k of [0, 1]) out.push([o[0] + i * d[0], o[1] + j * d[1], o[2] + k * d[2]]);
  return out;
};

// la envolvente convexa (cadena monótona), para siluetas y sombras
export const casco = (pts: P[]): P[] => {
  const s = [...pts].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  if (s.length < 3) return s;
  const cruz = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const abajo: P[] = [];
  for (const q of s) {
    while (abajo.length >= 2 && cruz(abajo[abajo.length - 2], abajo[abajo.length - 1], q) <= 0) abajo.pop();
    abajo.push(q);
  }
  const arriba: P[] = [];
  for (let i = s.length - 1; i >= 0; i--) {
    const q = s[i];
    while (arriba.length >= 2 && cruz(arriba[arriba.length - 2], arriba[arriba.length - 1], q) <= 0) arriba.pop();
    arriba.push(q);
  }
  return abajo.slice(0, -1).concat(arriba.slice(0, -1));
};

// una circunferencia en el mundo: centro c y sus dos semiejes u y v
export const elipse = (c: V3, u: V3, v: V3, n = 36): V3[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return mas(mas(c, u, Math.cos(a)), v, Math.sin(a));
  });

// la sombra: la luz viene de arriba a la izquierda y cada punto cae al suelo hacia delante y un poco hacia la pared
export const SA = 0.34;
export const SL = -0.2;
export const sombra = (q: V3): V3 => [q[0] + q[2] * SA, q[1] + q[2] * SL, 0];

// el color: cada material en tres tonos (arriba, la cara de la izquierda y la de la derecha, la más oscura)
const rgb = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mezcla = (c1: string, c2: string, k: number) => {
  const a = rgb(c1), b = rgb(c2);
  return '#' + a.map((x, i) => Math.round(x + (b[i] - x) * k).toString(16).padStart(2, '0')).join('');
};
export type Tri = {arriba: string; izq: string; der: string};
export const tri = (base: string, luz = 0.45, osc = 0.17): Tri => ({
  arriba: mezcla(base, '#FFFFFF', luz), izq: base, der: mezcla(base, '#3B2F6E', osc),
});
