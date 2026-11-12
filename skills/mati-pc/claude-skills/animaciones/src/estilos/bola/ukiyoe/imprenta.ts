import {clamp, mix, rng, ruido} from '../../../comun/curvas';

// LA IMPRENTA DEL GRABADO JAPONÉS (adaptada de un motor de muestra
// con licencia MIT, ver AVISOS.md, y pasada aquí a TypeScript).
// Una estampa de madera se imprime por planchas: una por cada tinta plana y encima la plancha de líneas (la «llave», en negro sumi).
// Aquí cada plancha es un lienzo:
//   · color: las tintas planas, cada grupo con su REGISTRO un pelo desplazado (como cuando el papel no cae justo en su sitio);
//   · línea: el contorno negro; cada tinta que se pone delante BORRA las líneas de lo que queda detrás (así la plancha de líneas
//     solo lleva lo que se ve, como una plancha tallada de verdad);
//   · máscara: dónde hay algo (para poner papel limpio debajo de lo que se mueve).
// Al estampar, las tintas reciben la veta de la madera, el frotado del baren y las motas (goma-zuri), y por encima de todo asoma
// la fibra del papel washi. El blanco es siempre el papel: lo que va «en papel» (la bola, la nieve, la niebla) no lleva tinta.

export const W = 1080;
export const H = 1920;
export type P = [number, number];

// los pigmentos (pocos, planos, cada uno de su plancha)
export const TINTA = {
  papel: '#efe3c8', monte: '#b8a37c',
  prusia: '#1d3a66', prusiaO: '#13284a', prusiaL: '#4d6f98', prusiaP: '#8db0c6', prusiaPP: '#c3d5d8',
  sumi: '#231f1c', sumiL: '#4a4540', gris: '#8b8a80', grisL: '#b3b0a2',
  beni: '#b8412f', beniO: '#8a2a1d', beniL: '#e3a08a', beniP: '#efc4a8', bermellon: '#cc4a2e',
  ocre: '#cf9f4a', ocreL: '#e2c27e', paja: '#c9a45c',
  verde: '#8aa152', verdeO: '#50703c', pino: '#3e5a3a', verdeL: '#b5c07a', celadon: '#93ae98',
  carne: '#f2c49b', carneO: '#d99b6c',
  amarillo: '#e9b43a', amarilloO: '#c48f25',
  madera: '#8a6a48', maderaO: '#5e4631', maderaL: '#b08d63', maderaP: '#c9a77c',
  yeso: '#e8d8b5', yesoO: '#d9c59c', yesoL: '#efe3c6',
  tatami: '#cdbb7a', tatami2: '#c6b170', tatami3: '#d3c185', tatamiO: '#a69552',
  pelo: '#4b2f1c', pantalon: '#22375a',
} as const;

// cada grupo de tintas es una plancha distinta, con su desplazamiento fijo respecto a la de líneas (en px de la estampa)
export type Bloque = 'azul' | 'verde' | 'rojo' | 'carne' | 'ocre' | 'gris';
export const REGISTRO: Record<Bloque, P> = {
  azul: [2.8, -2.0], verde: [-2.4, 2.3], rojo: [2.2, 2.8], carne: [-1.8, -2.3], ocre: [-2.6, 1.5], gris: [1.4, -1.2],
};

export const lienzo = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};
const hex = (s: string) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
export const rgba = (s: string, a = 1) => {
  const [r, g, b] = hex(s);
  return `rgba(${r},${g},${b},${a})`;
};
export const mezcla = (a: string, b: string, k: number) => {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(mix(v, B[i], k)).toString(16).padStart(2, '0')).join('');
};

// ---------------------------------------------------------------- el ruido (una rejilla suavizada, con su semilla)
const campo = (w: number, h: number, celda: number, semilla: number) => {
  const r = rng(semilla);
  const gw = Math.ceil(w / celda) + 2, gh = Math.ceil(h / celda) + 2;
  const g = new Float32Array(gw * gh);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const f = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = y / celda, iy = fy | 0, ty = fy - iy, sy = ty * ty * (3 - 2 * ty);
    for (let x = 0; x < w; x++) {
      const fx = x / celda, ix = fx | 0, tx = fx - ix, sx = tx * tx * (3 - 2 * tx), o = iy * gw + ix;
      const a = g[o], b = g[o + 1], c = g[o + gw], d = g[o + gw + 1];
      const arriba = a + (b - a) * sx;
      f[y * w + x] = arriba + (c + (d - c) * sx - arriba) * sy;
    }
  }
  return f;
};
const fbm = (w: number, h: number, celdas: number[], semilla: number, pesos?: number[]) => {
  const out = new Float32Array(w * h);
  let tot = 0;
  celdas.forEach((c, i) => {
    const p = pesos ? pesos[i] : 1 / (i + 1);
    tot += p;
    const f = campo(w, h, c, semilla + i * 101);
    for (let k = 0; k < out.length; k++) out[k] += f[k] * p;
  });
  for (let k = 0; k < out.length; k++) out[k] /= tot;
  return out;
};

// ---------------------------------------------------------------- las texturas (se hacen una vez por pestaña del navegador)
type Texturas = {papel: HTMLCanvasElement; fibra: HTMLCanvasElement; motas: HTMLCanvasElement; veta: HTMLCanvasElement; baren: HTMLCanvasElement};
let TX: Texturas | null = null;

// fibras de papel: trazos cortos y retorcidos
const fibras = (x: CanvasRenderingContext2D, n: number, col: string, a: number, ancho: number, semilla: number, largo = 60) => {
  const r = rng(semilla);
  x.strokeStyle = col;
  x.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    let px = r() * W, py = r() * H, ang = r() * Math.PI * 2;
    const L = largo * (0.3 + r());
    x.globalAlpha = a * (0.4 + r() * 0.6);
    x.lineWidth = ancho * (0.5 + r());
    x.beginPath();
    x.moveTo(px, py);
    for (let s = 0; s < 5; s++) {
      ang += (r() - 0.5) * 0.9;
      px += (Math.cos(ang) * L) / 5;
      py += (Math.sin(ang) * L) / 5;
      x.lineTo(px, py);
    }
    x.stroke();
  }
  x.globalAlpha = 1;
};

export const texturas = (): Texturas => {
  if (TX) return TX;
  // 1. el washi: un tono cálido con nubes suaves, fibras claras y oscuras, alguna manchita y los bordes un poco tostados
  const papel = lienzo(W, H);
  {
    const x = papel.getContext('2d')!;
    const w = 270, h = 480, m = fbm(w, h, [70, 24, 8, 3], 11);
    const peq = lienzo(w, h), px = peq.getContext('2d')!, id = px.createImageData(w, h);
    const [r, g, b] = hex(TINTA.papel);
    for (let i = 0; i < w * h; i++) {
      const v = (m[i] - 0.5) * 24;
      id.data[i * 4] = r + v;
      id.data[i * 4 + 1] = g + v * 0.95;
      id.data[i * 4 + 2] = b + v * 0.8;
      id.data[i * 4 + 3] = 255;
    }
    px.putImageData(id, 0, 0);
    x.imageSmoothingQuality = 'high';
    x.drawImage(peq, 0, 0, W, H);
    fibras(x, 5600, '#fbf6e9', 0.3, 1, 7);
    fibras(x, 1600, '#c7b893', 0.16, 0.8, 8);
    fibras(x, 170, '#f9f3e3', 0.35, 1.6, 9, 140);
    const r2 = rng(5);
    for (let i = 0; i < 80; i++) {
      x.fillStyle = `rgba(150,110,60,${0.03 + r2() * 0.06})`;
      x.beginPath();
      x.arc(r2() * W, r2() * H, 0.6 + r2() * 2.2, 0, Math.PI * 2);
      x.fill();
    }
    const gr = x.createRadialGradient(W / 2, H / 2, 560, W / 2, H / 2, 1200);
    gr.addColorStop(0, 'rgba(160,120,60,0)');
    gr.addColorStop(1, 'rgba(150,108,55,0.2)');
    x.fillStyle = gr;
    x.fillRect(0, 0, W, H);
  }
  // 2. la fibra que asoma por encima de la tinta
  const fibra = lienzo(W, H);
  {
    const x = fibra.getContext('2d')!;
    fibras(x, 3200, '#f4ead4', 0.1, 0.8, 21);
    fibras(x, 100, '#f4ead4', 0.14, 1.3, 22, 160);
  }
  // 3. las motas del goma-zuri (se usan para quitar tinta: el papel asoma en puntitos)
  const motas = lienzo(540, 960);
  {
    const w = 540, h = 960, m = fbm(w, h, [60, 16], 31), r = rng(32);
    const x = motas.getContext('2d')!, id = x.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const p = 0.02 + 0.32 * Math.pow(m[i], 3.5);
      id.data[i * 4 + 3] = r() < p ? 90 + r() * 140 : 0;
    }
    x.putImageData(id, 0, 0);
  }
  // 4. la veta de la plancha de cerezo: las curvas de nivel de un campo estirado a lo largo (vetas largas, casi paralelas, que
  //    ondulan despacio), con algún nudo, y bandas anchas de tinta más cargada
  const veta = lienzo(W, H);
  {
    const wq = Math.ceil(W / 8) + 2, hq = Math.ceil(H / 2) + 2, m = fbm(wq, hq, [60, 22, 8], 41, [1, 0.45, 0.2]);
    const x = veta.getContext('2d')!, id = x.createImageData(W, H);
    const nudos: P[] = [[260, 330], [820, 900], [380, 1500], [900, 1700], [140, 1100]];
    for (let y = 0; y < H; y++) {
      for (let X = 0; X < W; X++) {
        const i = y * W + X, mv = m[(y >> 1) * wq + (X >> 3)];
        let u = y * 0.034 + mv * 4.2 + Math.sin(X * 0.0021) * 0.8;
        for (const [kx, ky] of nudos) {
          const d2 = ((X - kx) * 0.35) ** 2 + (y - ky) ** 2;
          u += 1.6 * Math.exp(-d2 / 3000);
        }
        const fr = u - Math.floor(u), d = Math.abs(fr - 0.5) * 2;
        const linea = d > 0.84 ? Math.pow((d - 0.84) / 0.16, 1.6) : 0, banda = 0.5 + 0.5 * Math.sin(u * 0.37);
        id.data[i * 4] = 24;
        id.data[i * 4 + 1] = 20;
        id.data[i * 4 + 2] = 30;
        id.data[i * 4 + 3] = (linea * 0.7 + banda * 0.3) * 255;
      }
    }
    x.putImageData(id, 0, 0);
  }
  // 5. el baren (la almohadilla con la que se frota el papel): arcos y zigzags borrosos que dejan la tinta desigual
  const baren = lienzo(W, H);
  {
    const x = baren.getContext('2d')!, r = rng(61);
    x.filter = 'blur(7px)';
    x.lineCap = 'round';
    for (let i = 0; i < 300; i++) {
      const cx = r() * W, cy = r() * H, rad = 40 + r() * 170, a0 = r() * Math.PI * 2;
      x.strokeStyle = `rgba(0,0,0,${0.05 + r() * 0.12})`;
      x.lineWidth = 14 + r() * 40;
      x.beginPath();
      x.arc(cx, cy, rad, a0, a0 + 1 + r() * 3.5);
      x.stroke();
    }
    for (let i = 0; i < 80; i++) {
      let px = r() * W, py = r() * H;
      x.strokeStyle = `rgba(0,0,0,${0.04 + r() * 0.08})`;
      x.lineWidth = 20 + r() * 30;
      x.beginPath();
      x.moveTo(px, py);
      for (let k = 0; k < 6; k++) {
        px += 60 + r() * 80;
        py += (k % 2 ? 1 : -1) * (30 + r() * 50);
        x.lineTo(px, py);
      }
      x.stroke();
    }
    x.filter = 'none';
  }
  TX = {papel, fibra, motas, veta, baren};
  return TX;
};

// ---------------------------------------------------------------- los caminos
export const poli = (pts: P[], cerrado = true) => {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  if (cerrado) p.closePath();
  return p;
};
// una curva suave que pasa por los puntos medios (como smooth() de la muestra)
export const suave = (pts: P[], cerrado = false) => {
  const p = new Path2D();
  const n = pts.length;
  if (n < 2) return p;
  if (!cerrado) {
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) p.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    p.lineTo(pts[n - 1][0], pts[n - 1][1]);
    return p;
  }
  const m = (i: number): P => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  const s = m(n - 1);
  p.moveTo(s[0], s[1]);
  for (let i = 0; i < n; i++) {
    const e = m(i);
    p.quadraticCurveTo(pts[i][0], pts[i][1], e[0], e[1]);
  }
  p.closePath();
  return p;
};
export const elipse = (cx: number, cy: number, rx: number, ry: number, rot = 0) => {
  const p = new Path2D();
  p.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
  return p;
};
export const rect = (x0: number, y0: number, x1: number, y1: number) => poli([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
// un camino movido, girado y escalado
export const mueve = (p: Path2D, m: DOMMatrix) => {
  const q = new Path2D();
  q.addPath(p, m);
  return q;
};
// Catmull-Rom: más puntos por el mismo sitio
export const denso = (p: P[], per = 8, cerrado = false): P[] => {
  const n = p.length, out: P[] = [], N = cerrado ? n : n - 1;
  const Q = (i: number) => (cerrado ? p[(i + n) % n] : p[clamp(i, 0, n - 1)]);
  for (let i = 0; i < N; i++) {
    const a = Q(i - 1), b = Q(i), c = Q(i + 1), d = Q(i + 2);
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3),
        0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3),
      ]);
    }
  }
  if (!cerrado) out.push(p[n - 1]);
  return out;
};
// LA LÍNEA TALLADA: un trazo de ancho variable (afinado en las puntas y con un temblor lento del ancho), como el que deja la gubia
export const talla = (pts: P[], ancho: number, o: {afina?: [number, number]; semilla?: number; temblor?: number; cerrado?: boolean; per?: number} = {}) => {
  const {afina = [0.25, 0.25], semilla = 1, temblor = 0.22, cerrado = false, per = 6} = o;
  const p = denso(pts, per, cerrado), n = p.length;
  const out = new Path2D();
  if (n < 2) return out;
  const L = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  const tot = L[n - 1] || 1, izq: P[] = [], der: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    const u = L[i] / tot;
    let perfil = 1;
    if (!cerrado) {
      if (afina[0] > 0 && u < afina[0]) perfil = Math.sin(((u / afina[0]) * Math.PI) / 2);
      if (afina[1] > 0 && u > 1 - afina[1]) perfil = Math.min(perfil, Math.sin((((1 - u) / afina[1]) * Math.PI) / 2));
    }
    const ww = ancho * 0.5 * (0.22 + 0.78 * perfil) * (1 + temblor * ruido(L[i] * 0.035 + semilla * 13.1, 7));
    izq.push([p[i][0] - dy * ww, p[i][1] + dx * ww]);
    der.push([p[i][0] + dy * ww, p[i][1] - dx * ww]);
  }
  out.moveTo(izq[0][0], izq[0][1]);
  for (let i = 1; i < n; i++) out.lineTo(izq[i][0], izq[i][1]);
  for (let i = n - 1; i >= 0; i--) out.lineTo(der[i][0], der[i][1]);
  out.closePath();
  return out;
};
// un temblor de mano en los puntos (la plancha está tallada a mano: nada es recto del todo)
export const tiembla = (pts: P[], amp = 1.5, semilla = 1, f = 0.02): P[] =>
  pts.map(([a, b]) => [a + ruido(a * f + b * f * 0.7 + semilla * 7.3, 3) * amp, b + ruido(b * f + a * f * 0.6 + semilla * 3.1 + 50, 5) * amp]);
// una recta con puntos intermedios (para que tiemble)
export const recta = (a: P, b: P, n = 6): P[] => Array.from({length: n + 1}, (_, i) => [mix(a[0], b[0], i / n), mix(a[1], b[1], i / n)] as P);

// ---------------------------------------------------------------- el bokashi: el degradado frotado a mano, píxel a píxel
// De arriba (y0, color a con alfa a0) a abajo (y1, color b con alfa a1); el borde de arriba vaga columna a columna (± rugoso),
// sin costuras. Se hace a la resolución de la estampa y se guarda (es fijo).
const BOKASHI = new Map<string, HTMLCanvasElement>();
export const bokashi = (x0: number, y0: number, x1: number, y1: number, a: string, b: string, a0: number, a1: number,
  o: {rugoso?: number; semilla?: number; curva?: number} = {}) => {
  const {rugoso = 22, semilla = 3, curva = 1} = o;
  const k = [x0, y0, x1, y1, a, b, a0, a1, rugoso, semilla, curva].join('|');
  const ya = BOKASHI.get(k);
  if (ya) return {lienzo: ya, x: Math.floor(x0), y: Math.floor(Math.min(y0, y1) - rugoso * 1.4)};
  const X0 = Math.floor(x0), X1 = Math.ceil(x1);
  const Y0 = Math.floor(Math.min(y0, y1) - rugoso * 1.4), Y1 = Math.ceil(Math.max(y0, y1) + rugoso * 1.4);
  const w = X1 - X0, h = Y1 - Y0;
  const c = lienzo(w, h), cx = c.getContext('2d')!, id = cx.createImageData(w, h), d = id.data;
  const A = hex(a), B = hex(b);
  for (let i = 0; i < w; i++) {
    const X = X0 + i;
    const off = ruido(X * 0.006 + semilla, 11) * rugoso + ruido(X * 0.03 + semilla * 5, 13) * rugoso * 0.35;
    for (let j = 0; j < h; j++) {
      const Y = Y0 + j;
      let u = clamp((Y - (y0 + off)) / (y1 - y0));
      if (curva !== 1) u = Math.pow(u, curva);
      const al = a0 + (a1 - a0) * u, q = (j * w + i) * 4;
      d[q] = A[0] + (B[0] - A[0]) * u;
      d[q + 1] = A[1] + (B[1] - A[1]) * u;
      d[q + 2] = A[2] + (B[2] - A[2]) * u;
      d[q + 3] = al * 255;
    }
  }
  cx.putImageData(id, 0, 0);
  BOKASHI.set(k, c);
  return {lienzo: c, x: X0, y: Y0};
};

// ---------------------------------------------------------------- la plancha
export class Plancha {
  color: HTMLCanvasElement;
  linea: HTMLCanvasElement;
  mascara: HTMLCanvasElement;
  cC: CanvasRenderingContext2D;
  cL: CanvasRenderingContext2D;
  cM: CanvasRenderingContext2D;
  // un temblor del registro en cada paso (cada cuadro, una impresión un pelo distinta)
  extra: P = [0, 0];
  recorte: Path2D | null = null;
  constructor(public dpr: number) {
    this.color = lienzo(W * dpr, H * dpr);
    this.linea = lienzo(W * dpr, H * dpr);
    this.mascara = lienzo(W * dpr, H * dpr);
    this.cC = this.color.getContext('2d')!;
    this.cL = this.linea.getContext('2d')!;
    this.cM = this.mascara.getContext('2d')!;
  }
  limpia() {
    for (const c of [this.cC, this.cL, this.cM]) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
      c.clearRect(0, 0, W * this.dpr, H * this.dpr);
    }
  }
  private pon(c: CanvasRenderingContext2D, dx = 0, dy = 0) {
    c.setTransform(this.dpr, 0, 0, this.dpr, dx * this.dpr, dy * this.dpr);
  }
  private conRecorte(c: CanvasRenderingContext2D, dx: number, dy: number, f: () => void) {
    c.save();
    if (this.recorte) {
      this.pon(c);
      c.clip(this.recorte);
    }
    this.pon(c, dx, dy);
    f();
    c.restore();
  }
  // quitar de la plancha de líneas lo que queda tapado
  tapa(p: Path2D) {
    this.conRecorte(this.cL, 0, 0, () => {
      this.cL.globalCompositeOperation = 'destination-out';
      this.cL.fill(p);
    });
    this.conRecorte(this.cM, 0, 0, () => {
      this.cM.fillStyle = '#000';
      this.cM.fill(p);
    });
  }
  // una tinta plana (o un degradado del canvas) en su plancha, con su registro
  tinta(p: Path2D, relleno: string | CanvasGradient, bloque: Bloque, alfa = 1) {
    const [rx, ry] = REGISTRO[bloque];
    this.conRecorte(this.cC, rx + this.extra[0], ry + this.extra[1], () => {
      this.cC.globalAlpha = alfa;
      this.cC.fillStyle = relleno;
      this.cC.fill(p);
    });
    this.tapa(p);
  }
  // un bokashi (hecho con bokashi()) dentro de un camino
  degradado(p: Path2D, b: {lienzo: HTMLCanvasElement; x: number; y: number}, bloque: Bloque, tapa = true) {
    const [rx, ry] = REGISTRO[bloque];
    this.conRecorte(this.cC, rx + this.extra[0], ry + this.extra[1], () => {
      this.cC.clip(p);
      this.cC.drawImage(b.lienzo, b.x, b.y);
    });
    if (tapa) this.tapa(p);
  }
  // un toque de tinta que no tapa nada (un brillo, un rubor)
  tinte(p: Path2D, relleno: string | CanvasGradient, bloque: Bloque, alfa = 1) {
    const [rx, ry] = REGISTRO[bloque];
    this.conRecorte(this.cC, rx + this.extra[0], ry + this.extra[1], () => {
      this.cC.globalAlpha = alfa;
      this.cC.fillStyle = relleno;
      this.cC.fill(p);
    });
  }
  // un trazo de tinta de color (las rayas del tatami, el lomo de un libro)
  trazoTinta(p: Path2D, ancho: number, color: string, bloque: Bloque, alfa = 1) {
    const [rx, ry] = REGISTRO[bloque];
    this.conRecorte(this.cC, rx + this.extra[0], ry + this.extra[1], () => {
      this.cC.globalAlpha = alfa;
      this.cC.strokeStyle = color;
      this.cC.lineWidth = ancho;
      this.cC.lineCap = 'round';
      this.cC.lineJoin = 'round';
      this.cC.stroke(p);
    });
  }
  // EN PAPEL: aquí no va tinta (lo blanco es el papel sin imprimir)
  papel(p: Path2D) {
    this.conRecorte(this.cC, 0, 0, () => {
      this.cC.globalCompositeOperation = 'destination-out';
      this.cC.fill(p);
    });
    this.tapa(p);
  }
  // una raya en papel (la espuma, la cresta de una ola)
  papelTrazo(p: Path2D, ancho: number) {
    this.conRecorte(this.cC, 0, 0, () => {
      this.cC.globalCompositeOperation = 'destination-out';
      this.cC.lineWidth = ancho;
      this.cC.lineCap = 'round';
      this.cC.lineJoin = 'round';
      this.cC.stroke(p);
    });
  }
  // la plancha de líneas: un contorno de ancho fijo…
  raya(p: Path2D, ancho: number, color: string = TINTA.sumi, alfa = 1) {
    this.conRecorte(this.cL, 0, 0, () => {
      this.cL.globalAlpha = alfa;
      this.cL.strokeStyle = color;
      this.cL.lineWidth = ancho;
      this.cL.lineCap = 'round';
      this.cL.lineJoin = 'round';
      this.cL.stroke(p);
    });
  }
  // …o una forma tallada rellena (las líneas de ancho variable, y lo que es negro de verdad: el pelo, la laca, los ribetes)
  negro(p: Path2D, color: string = TINTA.sumi, alfa = 1, tapa = false) {
    if (tapa) this.tapa(p);
    this.conRecorte(this.cL, 0, 0, () => {
      this.cL.globalAlpha = alfa;
      this.cL.fillStyle = color;
      this.cL.fill(p);
    });
    if (!tapa) {
      this.conRecorte(this.cM, 0, 0, () => {
        this.cM.fillStyle = '#000';
        this.cM.fill(p);
      });
    }
  }
  // un carácter en la plancha de líneas (la caligrafía del rollo), en sumi
  letraNegra(s: string, x: number, y: number, fuente: string) {
    this.conRecorte(this.cL, 0, 0, () => {
      this.cL.font = fuente;
      this.cL.fillStyle = TINTA.sumi;
      this.cL.textAlign = 'center';
      this.cL.textBaseline = 'middle';
      this.cL.fillText(s, x, y);
    });
  }
  // texto impreso en una plancha de color (el carácter del farol)
  texto(s: string, x: number, y: number, fuente: string, color: string, bloque: Bloque, m?: DOMMatrix) {
    const [rx, ry] = REGISTRO[bloque];
    this.conRecorte(this.cC, rx + this.extra[0], ry + this.extra[1], () => {
      if (m) this.cC.transform(m.a, m.b, m.c, m.d, m.e, m.f);
      this.cC.font = fuente;
      this.cC.fillStyle = color;
      this.cC.textAlign = 'center';
      this.cC.textBaseline = 'middle';
      this.cC.fillText(s, x, y);
    });
  }
}

// ---------------------------------------------------------------- estampar: la plancha sobre el papel, con su textura
export type Acabado = {veta: number; baren: number; motas: number; motasLinea: number; papelDebajo: boolean};
let TMP: HTMLCanvasElement | null = null;
export const estampa = (dst: CanvasRenderingContext2D, pl: Plancha, a: Acabado) => {
  const tx = texturas();
  const w = W * pl.dpr, h = H * pl.dpr;
  if (a.papelDebajo) {
    // papel limpio debajo de lo que se mueve (si no, por las motas asomaría lo de detrás)
    if (!TMP || TMP.width !== w || TMP.height !== h) TMP = lienzo(w, h);
    const t = TMP.getContext('2d')!;
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.globalCompositeOperation = 'copy';
    t.globalAlpha = 1;
    t.drawImage(tx.papel, 0, 0, w, h);
    t.globalCompositeOperation = 'destination-in';
    t.drawImage(pl.mascara, 0, 0);
    t.globalCompositeOperation = 'source-over';
    dst.drawImage(TMP, 0, 0);
  }
  const c = pl.cC;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-atop';
  c.globalAlpha = a.veta;
  c.drawImage(tx.veta, 0, 0, w, h);
  c.globalCompositeOperation = 'destination-out';
  c.globalAlpha = a.baren;
  c.drawImage(tx.baren, 0, 0, w, h);
  c.globalAlpha = a.motas;
  c.drawImage(tx.motas, 0, 0, w, h);
  c.restore();
  dst.drawImage(pl.color, 0, 0);
  const l = pl.cL;
  l.save();
  l.setTransform(1, 0, 0, 1, 0, 0);
  l.globalCompositeOperation = 'destination-out';
  l.globalAlpha = a.motasLinea;
  l.drawImage(tx.motas, 0, 0, w, h);
  l.restore();
  dst.drawImage(pl.linea, 0, 0);
};

// ---------------------------------------------------------------- el sello bermellón (los caracteres en blanco, con el borde mellado)
const SELLOS = new Map<string, HTMLCanvasElement>();
export const sello = (texto: string[], lado: number, fuente: string, o: {semilla?: number; redondo?: boolean; color?: string; tam?: number; ancho?: number} = {}) => {
  const {semilla = 1, redondo = false, color = TINTA.beni, tam = 0.78, ancho = 1} = o;
  const k = [texto.join('/'), lado, fuente, semilla, redondo, color, tam, ancho].join('|');
  const ya = SELLOS.get(k);
  if (ya) return ya;
  // «ancho» > 1: un sello ovalado y apaisado (para una palabra)
  const lw = lado * ancho;
  const pad = 8, c = lienzo(lw + pad * 2, lado + pad * 2), x = c.getContext('2d')!, r = rng(semilla);
  x.fillStyle = color;
  if (redondo) {
    x.beginPath();
    x.ellipse(pad + lw / 2, pad + lado / 2, lw / 2, lado / 2, 0, 0, Math.PI * 2);
    x.fill();
    // el filete de dentro, en blanco
    x.globalCompositeOperation = 'destination-out';
    x.lineWidth = Math.max(2, lado * 0.035);
    x.beginPath();
    x.ellipse(pad + lw / 2, pad + lado / 2, lw / 2 - lado * 0.08, lado / 2 - lado * 0.08, 0, 0, Math.PI * 2);
    x.stroke();
    x.globalCompositeOperation = 'source-over';
  } else {
    const q: P[] = [[pad + r() * 3, pad + r() * 3], [pad + lado - r() * 3, pad + r() * 3.5], [pad + lado - r() * 3, pad + lado - r() * 3], [pad + r() * 3.5, pad + lado - r() * 3]];
    x.beginPath();
    q.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
    x.closePath();
    x.fill();
  }
  // los caracteres, en blanco (se quitan del rojo)
  x.globalCompositeOperation = 'destination-out';
  x.fillStyle = '#000';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const n = texto.length;
  const t = (lado * tam) / Math.max(1, n);
  texto.forEach((s, i) => {
    // la letra, lo más grande que quepa (se mide)
    x.font = `400 ${t}px ${fuente}`;
    const mide = x.measureText(s).width || 1;
    const cabe = (redondo ? 0.72 : 0.86) * lw;
    const tt = Math.min(t, (t * cabe) / mide);
    x.font = `400 ${tt}px ${fuente}`;
    x.fillText(s, pad + lw / 2, pad + lado / 2 + (i - (n - 1) / 2) * t * 1.02 + tt * 0.04);
  });
  // el bermellón no carga parejo: el borde mellado y poros por dentro
  for (let i = 0; i < lado * 1.8; i++) {
    x.globalAlpha = 0.2 + r() * 0.6;
    x.beginPath();
    const borde = r() < 0.5;
    let px: number, py: number;
    if (redondo) {
      const a = r() * Math.PI * 2, d = 1 - (r() * 4) / (lado / 2);
      px = pad + lw / 2 + Math.cos(a) * (lw / 2) * d;
      py = pad + lado / 2 + Math.sin(a) * (lado / 2) * d;
    } else {
      px = borde ? pad + (r() < 0.5 ? r() * 4 : lado - r() * 4) : pad + r() * lado;
      py = borde ? pad + r() * lado : pad + (r() < 0.5 ? r() * 4 : lado - r() * 4);
    }
    x.arc(px, py, 0.6 + r() * 2.2, 0, Math.PI * 2);
    x.fill();
  }
  for (let i = 0; i < lado * 2.2 * ancho; i++) {
    x.globalAlpha = 0.12 + r() * 0.3;
    x.beginPath();
    x.arc(pad + r() * lw, pad + r() * lado, 0.5 + r() * 1.3, 0, Math.PI * 2);
    x.fill();
  }
  x.globalAlpha = 1;
  x.globalCompositeOperation = 'source-over';
  SELLOS.set(k, c);
  return c;
};
