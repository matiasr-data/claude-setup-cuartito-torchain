import {clamp} from '../comun/curvas';

// Dos formas que usan varios estilos: la cápsula (un trazo de grosor variable con las puntas redondas: patas, colas, brazos) y el
// corazón. Los puntos son [x, y] en el lienzo de 1080 × 1920.
export type P = [number, number];

const f1 = (n: number) => n.toFixed(1);
// una cápsula de grosor variable: los dos lados tangentes y un arco en cada punta
export const capsula = (a: P, b: P, ra: number, rb: number) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const d = Math.max(1e-3, Math.hypot(dx, dy));
  const ux = dx / d, uy = dy / d;
  const s = clamp((ra - rb) / d, -0.99, 0.99);
  const c = Math.sqrt(1 - s * s);
  // la normal de cada lado, inclinada por la diferencia de radios
  const n1: P = [-uy * c + ux * s, ux * c + uy * s];
  const n2: P = [uy * c + ux * s, -ux * c + uy * s];
  const a1: P = [a[0] + n1[0] * ra, a[1] + n1[1] * ra], b1: P = [b[0] + n1[0] * rb, b[1] + n1[1] * rb];
  const a2: P = [a[0] + n2[0] * ra, a[1] + n2[1] * ra], b2: P = [b[0] + n2[0] * rb, b[1] + n2[1] * rb];
  // el arco de la punta pequeña abarca menos de media vuelta y el de la grande, más
  return `M ${f1(a1[0])} ${f1(a1[1])} L ${f1(b1[0])} ${f1(b1[1])} A ${f1(rb)} ${f1(rb)} 0 ${s > 0 ? 0 : 1} 0 ${f1(b2[0])} ${f1(b2[1])}`
    + ` L ${f1(a2[0])} ${f1(a2[1])} A ${f1(ra)} ${f1(ra)} 0 ${s > 0 ? 1 : 0} 0 ${f1(a1[0])} ${f1(a1[1])} Z`;
};
export const corazon = (s: number) =>
  `M 0 ${0.35 * s} C ${-0.9 * s} ${-0.25 * s} ${-0.45 * s} ${-0.95 * s} 0 ${-0.45 * s} C ${0.45 * s} ${-0.95 * s} ${0.9 * s} ${-0.25 * s} 0 ${0.35 * s} Z`;
