import {rng} from '../comun/curvas';
import type {P} from './formas';

// La geometría del 3 · PAPEL RECORTADO (gato/Papel.tsx): pasar cada forma a un polígono y «cortarlo a tijera» (el borde en tramos rectos
// con un temblor de mano y alguna muesca), y las formas propias del estilo (hojas de planta, nubes, corazones, banderines).

export const RAD = Math.PI / 180;
const f1 = (n: number) => n.toFixed(1);

export const circuloPts = (c: P, r: number, n = 36): P[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * 2 * Math.PI;
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)] as P;
  });

// la envolvente convexa (cadena monótona): con ella, dos círculos dan la cápsula exacta
export const envolvente = (pts: P[]): P[] => {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cruz = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const abajo: P[] = [], arriba: P[] = [];
  for (const q of s) {
    while (abajo.length >= 2 && cruz(abajo[abajo.length - 2], abajo[abajo.length - 1], q) <= 0) abajo.pop();
    abajo.push(q);
  }
  for (let i = s.length - 1; i >= 0; i--) {
    const q = s[i];
    while (arriba.length >= 2 && cruz(arriba[arriba.length - 2], arriba[arriba.length - 1], q) <= 0) arriba.pop();
    arriba.push(q);
  }
  abajo.pop();
  arriba.pop();
  return abajo.concat(arriba);
};

export const capsulaPts = (a: P, b: P, ra: number, rb: number): P[] => envolvente([...circuloPts(a, ra, 32), ...circuloPts(b, rb, 32)]);

// una tira de papel con las puntas rectas (patas, varillas, agujas)
export const tiraPts = (a: P, b: P, w: number): P[] => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const d = Math.hypot(dx, dy) || 1;
  const nx = (-dy / d) * (w / 2), ny = (dx / d) * (w / 2);
  return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]];
};

export const rectPts = (x: number, y: number, w: number, h: number, r = 0): P[] => {
  const rr = Math.min(r, w / 2, h / 2);
  if (rr <= 0.5) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const out: P[] = [];
  const esquinas: [number, number, number][] = [[x + w - rr, y + rr, -90], [x + w - rr, y + h - rr, 0], [x + rr, y + h - rr, 90], [x + rr, y + rr, 180]];
  for (const [cx, cy, a0] of esquinas) for (let k = 0; k <= 3; k++) {
    const a = (a0 + k * 30) * RAD;
    out.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return out;
};

// EL CORTE A TIJERA: se recorre el contorno a pasos iguales (las esquinas se respetan) y cada punto se aparta un poco de su sitio
// hacia fuera o hacia dentro; de vez en cuando, una muesca. La semilla es de la pieza: el mismo recorte en todos los cuadros.
export const recorte = (pts: P[], semilla: number, amp = 1.6, paso = 16): string => {
  const n = pts.length;
  if (n < 3) return '';
  const r = rng(semilla);
  const largos = pts.map((a, i) => {
    const b = pts[(i + 1) % n];
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  });
  const per = largos.reduce((s, l) => s + l, 0);
  const m = Math.max(9, Math.round(per / paso));
  const p2 = per / m;
  const esquina = pts.map((q, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const ux = q[0] - a[0], uy = q[1] - a[1], vx = b[0] - q[0], vy = b[1] - q[1];
    const lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy);
    return lu > 0.01 && lv > 0.01 && (ux * vx + uy * vy) / (lu * lv) < 0.77;
  });
  const out: string[] = [];
  const pon = (x: number, y: number, nx: number, ny: number, f: number) => {
    let o = (r() - 0.5) * 2 * amp * f;
    if (r() < 0.06) o += (r() < 0.5 ? -1 : 1) * amp * 1.3; // una muesca de la tijera
    out.push(`${f1(x + nx * o)} ${f1(y + ny * o)}`);
  };
  let acc = 0, sig = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], L = largos[i];
    if (L <= 0.01) continue;
    const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    if (esquina[i]) {
      pon(a[0], a[1], nx, ny, 0.35);
      sig = Math.max(sig, acc + p2 * 0.45);
    }
    while (sig < acc + L) {
      const s = sig - acc;
      if (!(esquina[(i + 1) % n] && L - s < p2 * 0.45)) pon(a[0] + ((b[0] - a[0]) * s) / L, a[1] + ((b[1] - a[1]) * s) / L, nx, ny, 1);
      sig += p2;
    }
    acc += L;
  }
  return 'M ' + out.join(' L ') + ' Z';
};

// una banda horizontal que se repite cada `periodo` px (cubre de -periodo a 1080 + 2·periodo), con los bordes cortados a tijera
// y el mismo ruido en cada periodo: así casa sin costura cuando la capa se desplaza
export const banda = (y0: number, y1: number, periodo: number, semilla: number, amp = 2, abajo = true): string => {
  const N = Math.max(6, Math.round(periodo / 17));
  const r = rng(semilla);
  const ra = Array.from({length: N}, () => (r() - 0.5) * 2 * amp);
  const rb = Array.from({length: N}, () => (r() - 0.5) * 2 * amp);
  const paso = periodo / N;
  const i0 = -N, i1 = Math.ceil((1080 + 2 * periodo) / paso);
  const sup: string[] = [], inf: string[] = [];
  for (let i = i0; i <= i1; i++) sup.push(`${f1(i * paso)} ${f1(y0 + ra[((i % N) + N) % N])}`);
  for (let i = i1; i >= i0; i--) inf.push(`${f1(i * paso)} ${f1(y1 + (abajo ? rb[((i % N) + N) % N] : 0))}`);
  return 'M ' + sup.join(' L ') + ' L ' + inf.join(' L ') + ' Z';
};

// el corazón de escena.ts, en puntos (las dos curvas)
export const corazonPts = (s: number): P[] => {
  const bez = (c: P[], u: number): P => {
    const v = 1 - u;
    return [
      v * v * v * c[0][0] + 3 * v * v * u * c[1][0] + 3 * v * u * u * c[2][0] + u * u * u * c[3][0],
      v * v * v * c[0][1] + 3 * v * v * u * c[1][1] + 3 * v * u * u * c[2][1] + u * u * u * c[3][1],
    ];
  };
  const A: P[] = [[0, 0.35 * s], [-0.9 * s, -0.25 * s], [-0.45 * s, -0.95 * s], [0, -0.45 * s]];
  const B: P[] = [[0, -0.45 * s], [0.45 * s, -0.95 * s], [0.9 * s, -0.25 * s], [0, 0.35 * s]];
  const out: P[] = [];
  for (const C of [A, B]) for (let i = 0; i < 14; i++) out.push(bez(C, i / 14));
  return out;
};

// una hoja de planta: una espina que se curva y un ancho que sale fino, se abre y acaba en punta. `mitad` es solo el lado izquierdo
// (hasta la espina), para el pliegue: media hoja de un verde más claro encima de la hoja entera
export const hojaPts = (base: P, ang: number, largo: number, ancho: number, curva: number, mitad = false): P[] => {
  const N = 9;
  const esp: P[] = [];
  const dir: number[] = [];
  let x = base[0], y = base[1];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const a = ang + curva * u * u;
    esp.push([x, y]);
    dir.push(a);
    x += (Math.cos(a) * largo) / N;
    y += (Math.sin(a) * largo) / N;
  }
  const izq: P[] = [], der: P[] = [];
  esp.forEach(([px, py], i) => {
    const u = i / N;
    const w = (ancho / 2) * Math.pow(Math.max(0, Math.sin(Math.PI * (0.12 + 0.88 * u))), 0.8) * (1 - 0.15 * u);
    const nx = -Math.sin(dir[i]), ny = Math.cos(dir[i]);
    izq.push([px + nx * w, py + ny * w]);
    der.push([px - nx * w, py - ny * w]);
  });
  if (mitad) return [...izq, ...esp.slice(1, -1).reverse()];
  return [...izq, ...der.slice(0, -1).reverse()];
};

// una nube de papel: la línea de arriba son los bultos y la de abajo, recta
export const nubePts = (cx: number, cy: number, e: number): P[] => {
  const bultos = [[-40, -4, 26], [-4, -24, 34], [34, -10, 26], [60, 4, 16], [-62, 6, 16]].map(([x, y, r]) => [cx + x * e, cy + y * e, r * e]);
  const x0 = cx - 77 * e, x1 = cx + 75 * e, base = cy + 18 * e;
  const top: P[] = [];
  for (let i = 0; i <= 30; i++) {
    const x = x0 + ((x1 - x0) * i) / 30;
    let yMin = base;
    for (const [bx, by, br] of bultos) {
      const dx = x - bx;
      if (Math.abs(dx) < br) yMin = Math.min(yMin, by - Math.sqrt(br * br - dx * dx));
    }
    top.push([x, yMin]);
  }
  return [...top, [x1, base], [x0, base]];
};
