// PIXEL ART · EL MOTOR (la escena en ../escena.ts). Un lienzo pequeño escondido de 180 × 320 píxeles que guarda
// ÍNDICES de una paleta limitada (como la memoria de color de una consola de 16 bits), y una tabla que pasa cada índice a su color: así
// un destello o un oscurecido cambian la tabla entera de golpe, nunca con transparencias. Se enseña a 6 × (1080 × 1920) con el vecino
// más cercano, sin suavizar. Sigue el modelo de un motor con licencia MIT (ver AVISOS.md): el lienzo de
// índices, el tramado de Bayer de 4 × 4, la luz como «subir un escalón» en la rampa de cada color. La técnica de pintar en un lienzo
// escondido y pasarlo a otra cosa, la del Matrix del gato (../../gato/Ascii.tsx).

export const W = 180, H = 320, ESC = 6; // el lienzo y cuántos píxeles de la pantalla de 1080 × 1920 mide cada uno
export const T = 255; // transparente

// ---------------------------------------------------------------- la paleta (viva, de 16 bits, con sus rampas de oscuro a claro)
const PALETA = [
  ['tinta', '#140c1c'],
  // la pared de ladrillos (azul, como la de los bloques)
  ['pared0', '#161d3f'], ['pared1', '#222e62'], ['pared2', '#2e4083'], ['pared3', '#3d58a4'], ['pared4', '#5174c0'], ['pared5', '#7395da'], ['pared6', '#a3bdf0'],
  // el suelo de tablas (madera clara)
  ['madera0', '#3c2018'], ['madera1', '#6a3c28'], ['madera2', '#99613a'], ['madera3', '#c28a52'], ['madera4', '#deae70'], ['madera5', '#f4d39a'],
  // la mesa (nogal)
  ['nogal0', '#2c140e'], ['nogal1', '#55291a'], ['nogal2', '#824426'], ['nogal3', '#ad6434'],
  // la piel
  ['piel0', '#7c3a2a'], ['piel1', '#cd7656'], ['piel2', '#f0a77c'], ['piel3', '#ffd3a8'],
  // el pelo marrón
  ['pelo0', '#2e140a'], ['pelo1', '#5f2e14'], ['pelo2', '#91501f'], ['pelo3', '#c27a34'],
  // la camisa amarilla
  ['amar0', '#7e400c'], ['amar1', '#cf8612'], ['amar2', '#f7bf26'], ['amar3', '#ffe45e'], ['amar4', '#fff7b8'],
  // el rojo (la corbata, la papelera, la taza)
  ['rojo0', '#4e0a20'], ['rojo1', '#9a1428'], ['rojo2', '#de2c2c'], ['rojo3', '#ff6248'], ['rojo4', '#ffa58a'],
  // el pantalón azul marino
  ['azul0', '#0b0f38'], ['azul1', '#17226c'], ['azul2', '#2639a4'], ['azul3', '#4566d6'],
  // la silla (azul cielo, para que no se confunda con el pantalón)
  ['silla0', '#0b3557'], ['silla1', '#135f98'], ['silla2', '#228fd2'], ['silla3', '#62c4f4'],
  // blancos y grises (la bola, el aro, los marcos)
  ['gris4', '#3a4260'], ['gris3', '#68749a'], ['gris2', '#a2aecb'], ['gris1', '#d6deef'], ['blanco', '#ffffff'],
  // el naranja (la lámpara, la maceta, un libro)
  ['nar0', '#6e260e'], ['nar1', '#c0521a'], ['nar2', '#f28a26'], ['nar3', '#ffbe58'],
  // la luz de la bombilla
  ['luz1', '#ffe17a'], ['luz2', '#fff6cc'],
  // el cielo de la ventana
  ['cielo0', '#2f8fe6'], ['cielo1', '#58b8f6'], ['cielo2', '#9ddcff'], ['cielo3', '#d6f4ff'],
  // los verdes
  ['verde0', '#0e3a1c'], ['verde1', '#1b722c'], ['verde2', '#37ad44'], ['verde3', '#8ae25a'],
  // el monitor
  ['pant0', '#0d3f52'], ['pant1', '#1d8aa0'], ['pant2', '#4fdcef'], ['pant3', '#b2fff9'],
  // el panel del marcador (azul de juego)
  ['hud0', '#0a0e30'], ['hud1', '#16247a'], ['hud2', '#2440b8'],
  // sueltos
  ['rosa', '#ff86a6'], ['oro', '#ffd23a'], ['oro0', '#b26a08'],
] as const;
type Nombre = (typeof PALETA)[number][0];
export const C = Object.fromEntries(PALETA.map(([n], i) => [n, i])) as Record<Nombre, number>;
export const NPAL = PALETA.length;
const rgb = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const RGB = PALETA.map(([, h]) => rgb(h));
const empaca = ([r, g, b]: number[]) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;

// la tabla de colores: índice → color (ABGR, como lo quiere ImageData en un Mac)
export const LUT = (() => {
  const L = new Uint32Array(256);
  for (let i = 0; i < NPAL; i++) L[i] = empaca(RGB[i]);
  return L;
})();
// el destello: toda la tabla hacia el blanco, en escalones de un cuarto (nunca con transparencia)
export const blanquea = (L: Uint32Array, f: number) => {
  const q = Math.round(f * 4) / 4;
  if (q <= 0) return L;
  const O = new Uint32Array(256);
  for (let i = 0; i < NPAL; i++) {
    const [r, g, b] = RGB[i];
    O[i] = empaca([r + (255 - r) * q, g + (255 - g) * q, b + (255 - b) * q].map((v) => v | 0));
  }
  return O;
};

// la luz y la sombra: un escalón arriba o abajo en la rampa de cada color
const RAMPAS: Nombre[][] = [
  ['pared0', 'pared1', 'pared2', 'pared3', 'pared4', 'pared5', 'pared6'],
  ['madera0', 'madera1', 'madera2', 'madera3', 'madera4', 'madera5'],
  ['nogal0', 'nogal1', 'nogal2', 'nogal3', 'madera4'],
  ['piel0', 'piel1', 'piel2', 'piel3'],
  ['pelo0', 'pelo1', 'pelo2', 'pelo3'],
  ['amar0', 'amar1', 'amar2', 'amar3', 'amar4'],
  ['rojo0', 'rojo1', 'rojo2', 'rojo3', 'rojo4'],
  ['azul0', 'azul1', 'azul2', 'azul3'],
  ['silla0', 'silla1', 'silla2', 'silla3'],
  ['tinta', 'gris4', 'gris3', 'gris2', 'gris1', 'blanco'],
  ['nar0', 'nar1', 'nar2', 'nar3', 'luz1', 'luz2'],
  ['cielo0', 'cielo1', 'cielo2', 'cielo3'],
  ['verde0', 'verde1', 'verde2', 'verde3'],
  ['pant0', 'pant1', 'pant2', 'pant3'],
  ['hud0', 'hud1', 'hud2'],
];
export const CLARO = new Uint8Array(256).map((_, i) => i);
export const OSCURO = new Uint8Array(256).map((_, i) => i);
for (const r of RAMPAS) {
  r.forEach((n, k) => {
    CLARO[C[n]] = C[r[Math.min(r.length - 1, k + 1)]];
    OSCURO[C[n]] = k > 0 ? C[r[k - 1]] : C.tinta;
  });
}
CLARO[T] = T;
OSCURO[T] = T;

// ---------------------------------------------------------------- el tramado de Bayer de 4 × 4 (los degradados, sin mezclas)
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x: number, y: number) => (B4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;
// el azar de cada píxel, siempre el mismo
export const hash = (x: number, y = 0, z = 0) => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// ---------------------------------------------------------------- el lienzo de índices
export class Lienzo {
  w: number;
  h: number;
  d: Uint8Array;
  ox = 0; // el desplazamiento de la cámara (el temblor de los golpes), en píxeles enteros
  oy = 0;
  constructor(w = W, h = H) {
    this.w = w;
    this.h = h;
    this.d = new Uint8Array(w * h).fill(T);
  }
  limpiar(c = T) {
    this.d.fill(c);
  }
  px(x: number, y: number, c: number) {
    if (c === T) return;
    const X = Math.floor(x) + this.ox, Y = Math.floor(y) + this.oy;
    if (X < 0 || Y < 0 || X >= this.w || Y >= this.h) return;
    this.d[Y * this.w + X] = c;
  }
  get(x: number, y: number) {
    const X = Math.floor(x) + this.ox, Y = Math.floor(y) + this.oy;
    if (X < 0 || Y < 0 || X >= this.w || Y >= this.h) return T;
    return this.d[Y * this.w + X];
  }
  rect(x: number, y: number, w: number, h: number, c: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }
  hline(x0: number, x1: number, y: number, c: number) {
    for (let x = Math.round(x0); x <= Math.round(x1); x++) this.px(x, y, c);
  }
  vline(x: number, y0: number, y1: number, c: number) {
    for (let y = Math.round(y0); y <= Math.round(y1); y++) this.px(x, y, c);
  }
  linea(x0: number, y0: number, x1: number, y1: number, c: number) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  }
  // pinta cada píxel de una caja según f (el centro del píxel; f devuelve el índice o T)
  region(x0: number, y0: number, x1: number, y1: number, f: (x: number, y: number) => number) {
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) this.px(x, y, f(x, y));
  }
  disco(cx: number, cy: number, r: number, c: number) {
    this.region(cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1, (x, y) => ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r ? c : T));
  }
  elipse(cx: number, cy: number, rx: number, ry: number, c: number) {
    this.region(cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1, (x, y) => (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1 ? c : T));
  }
  poligono(pts: [number, number][], c: number | ((x: number, y: number) => number)) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    this.region(x0 - 1, y0 - 1, x1 + 1, y1 + 1, (x, y) => (dentroPoli(x + 0.5, y + 0.5, pts) ? (typeof c === 'number' ? c : c(x, y)) : T));
  }
  // cambia los píxeles de una caja por su vecino de una tabla (la luz y la sombra como escalones)
  tabla(x0: number, y0: number, x1: number, y1: number, t: Uint8Array, f: (x: number, y: number) => boolean) {
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
        if (!f(x, y)) continue;
        const c = this.get(x, y);
        if (c !== T) this.px(x, y, t[c]);
      }
    }
  }
}

export const dentroPoli = (x: number, y: number, pts: [number, number][]) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

// el contorno de un sprite: cada píxel vacío que toca uno lleno (arriba, abajo o a los lados) se pinta de tinta
export const contorno = (capa: Lienzo, c = C.tinta) => {
  const {w, h, d} = capa;
  const marca: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = y * w + x;
      if (d[k] !== T) continue;
      if ((x > 0 && d[k - 1] !== T) || (x < w - 1 && d[k + 1] !== T) || (y > 0 && d[k - w] !== T) || (y < h - 1 && d[k + w] !== T)) marca.push(k);
    }
  }
  for (const k of marca) d[k] = c;
};
// pega una capa encima de otra (lo transparente no tapa)
export const volcar = (capa: Lienzo, en: Lienzo) => {
  const a = capa.d, b = en.d;
  for (let k = 0; k < a.length; k++) if (a[k] !== T) b[k] = a[k];
};

// ---------------------------------------------------------------- enseñarlo: del lienzo de índices a la pantalla, sin suavizar
let PEQ: HTMLCanvasElement | null = null;
export const presentar = (l: Lienzo, lut: Uint32Array, destino: HTMLCanvasElement) => {
  PEQ ??= document.createElement('canvas');
  PEQ.width = l.w;
  PEQ.height = l.h;
  const cp = PEQ.getContext('2d')!;
  const img = cp.createImageData(l.w, l.h);
  const u = new Uint32Array(img.data.buffer);
  for (let k = 0; k < l.d.length; k++) u[k] = lut[l.d[k] === T ? C.tinta : l.d[k]];
  cp.putImageData(img, 0, 0);
  const cd = destino.getContext('2d')!;
  cd.imageSmoothingEnabled = false;
  cd.drawImage(PEQ, 0, 0, destino.width, destino.height);
};
