import {rng} from '../../comun/curvas';
import type {P} from './escena';

// La geometría del gato en PAPEL RECORTADO (gato/Papel.tsx). Lo de ../PapelGeo.ts sirve para las piezas que no cambian de forma;
// aquí, lo que hace falta para las que SÍ cambian un poco de un paso a otro (las orejas al girar la cabeza, el cuello, los segmentos
// de la cola, el chorro de café): el corte a tijera con un número FIJO de puntos, así su borde no salta de un cuadro a otro.

const f1 = (n: number) => n.toFixed(1);
export const RAD = Math.PI / 180;

// el corte a tijera con m puntos fijos: se recorre el contorno a pasos iguales y cada punto se aparta un poco hacia fuera o hacia
// dentro (con alguna muesca); la semilla es de la pieza, así cada pieza tiene SU borde en todos los cuadros
export const corte = (pts: P[], semilla: number, amp = 1.5, m = 40): string => {
  const n = pts.length;
  if (n < 3) return '';
  const r = rng(semilla);
  const largos = pts.map((a, i) => {
    const b = pts[(i + 1) % n];
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  });
  const per = largos.reduce((s, l) => s + l, 0);
  const paso = per / m;
  const out: string[] = [];
  let acc = 0, sig = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], L = largos[i];
    if (L <= 0.01) continue;
    const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    while (sig < acc + L && out.length < m) {
      const s = sig - acc;
      let o = (r() - 0.5) * 2 * amp;
      if (r() < 0.06) o += (r() < 0.5 ? -1 : 1) * amp * 1.3;
      out.push(`${f1(a[0] + ((b[0] - a[0]) * s) / L + nx * o)} ${f1(a[1] + ((b[1] - a[1]) * s) / L + ny * o)}`);
      sig += paso;
    }
    acc += L;
  }
  return 'M ' + out.join(' L ') + ' Z';
};

export const elipsePts = (rx: number, ry: number, n = 40, c: P = [0, 0]): P[] =>
  Array.from({length: n}, (_, i) => {
    const a = Math.PI + (i / n) * 2 * Math.PI; // empieza por la izquierda, siempre en el mismo punto
    return [c[0] + rx * Math.cos(a), c[1] + ry * Math.sin(a)] as P;
  });

// una cápsula tumbada: de [0, 0] (radio ra) a [L, 0] (radio rb), empezando siempre por el mismo punto
export const capsulaLocal = (L: number, ra: number, rb: number, n = 18): P[] => {
  const s = Math.max(-0.99, Math.min(0.99, (ra - rb) / Math.max(1e-3, L)));
  const a = Math.acos(s); // el ángulo donde la recta toca los círculos
  const out: P[] = [];
  // la punta de atrás: de +a a 2π − a pasando por π
  for (let i = 0; i <= n; i++) {
    const t = a + (i / n) * (2 * Math.PI - 2 * a);
    out.push([ra * Math.cos(t), ra * Math.sin(t)]);
  }
  // la de delante: de −a a +a pasando por 0
  for (let i = 0; i <= n; i++) {
    const t = -a + (i / n) * 2 * a;
    out.push([L + rb * Math.cos(t), rb * Math.sin(t)]);
  }
  return out;
};

// una tira que sigue una línea (los bigotes, la boca, el ojo cerrado, el chorro), de ancho w0 a w1, con las puntas rectas
export const trazo = (pts: P[], w0: number, w1 = w0): P[] => {
  const izq: P[] = [], der: P[] = [];
  const n = pts.length;
  pts.forEach((q, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const ux = b[0] - a[0], uy = b[1] - a[1];
    const d = Math.hypot(ux, uy) || 1;
    const w = (w0 + ((w1 - w0) * i) / Math.max(1, n - 1)) / 2;
    izq.push([q[0] - (uy / d) * w, q[1] + (ux / d) * w]);
    der.push([q[0] + (uy / d) * w, q[1] - (ux / d) * w]);
  });
  return [...izq, ...der.reverse()];
};

// una curva cuadrática en puntos
export const cuadratica = (a: P, c: P, b: P, n = 8): P[] =>
  Array.from({length: n + 1}, (_, i) => {
    const u = i / n, v = 1 - u;
    return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]] as P;
  });

// una mancha de papel: una elipse con lóbulos (para el café derramado)
export const manchaPts = (rx: number, ry: number, semilla: number, n = 36, lobulos = 0.22): P[] => {
  const r = rng(semilla);
  const fases = [r() * 6.28, r() * 6.28, r() * 6.28];
  return Array.from({length: n}, (_, i) => {
    const a = Math.PI + (i / n) * 2 * Math.PI;
    const k = 1 + lobulos * (0.55 * Math.sin(3 * a + fases[0]) + 0.3 * Math.sin(5 * a + fases[1]) + 0.25 * Math.sin(8 * a + fases[2]));
    return [rx * k * Math.cos(a), ry * k * Math.sin(a)] as P;
  });
};

// de pieza local a su sitio: trasladar, girar (en radianes) y escalar
export const tf = (c: P, ang = 0, sx = 1, sy = 1) =>
  `translate(${f1(c[0])} ${f1(c[1])}) rotate(${(ang / RAD).toFixed(2)})${sx !== 1 || sy !== 1 ? ` scale(${sx.toFixed(4)} ${sy.toFixed(4)})` : ''}`;
