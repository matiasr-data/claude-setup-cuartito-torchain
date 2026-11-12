import type {P} from './escena';

// EL MOTOR DEL MATRIX (arte ASCII):
// una retícula de 90 × 96 celdas de IBM Plex Mono (12 × 20 px), negativos escondidos alineados con la retícula (varias muestras
// por celda; el rojo separa las piezas, el verde es el brillo y el azul el material), Sobel para los bordes con la letra que sigue
// su dirección, y encima el tubo: el brillo del fósforo, la banda de refresco, las líneas de barrido, la curvatura, la viñeta y el
// marco. Aquí vive lo que no depende de la escena; la escena está en ./Ascii.tsx.

export const W = 1080, H = 1920;
export const CW = 12, CH = 20; // la celda (la letra, 20 px de Plex Mono: 12 de ancho)
export const COLS = W / CW, FILAS = H / CH, N = COLS * FILAS;
export const SX = 3, SY = 4, NW = COLS * SX, NH = FILAS * SY, MUESTRAS = SX * SY; // muestras por celda en los negativos
export const COD = 16; // el material va en el canal azul, de 16 en 16 (hasta 15)
export const BR = 1.6; // el brillo va en el verde, dividido por esto (para poder pasarse de 1)

// ---------------------------------------------------------------- el color del fósforo (y el ámbar del café, el único otro)
type RGB = [number, number, number];
const rampa = (paradas: [number, RGB][]) => (b: number): string => {
  const x = Math.max(0, b);
  let k = 0;
  while (k < paradas.length - 2 && x > paradas[k + 1][0]) k++;
  const [b0, c0] = paradas[k], [b1, c1] = paradas[k + 1];
  const f = Math.min(1, Math.max(0, (x - b0) / (b1 - b0)));
  const c = c0.map((v, i) => Math.round(v + (c1[i] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
const VERDE = rampa([[0, [4, 26, 12]], [0.3, [16, 112, 48]], [0.6, [38, 204, 92]], [0.85, [92, 255, 142]], [1.05, [178, 255, 200]], [1.35, [232, 255, 238]], [1.7, [255, 255, 255]]]);
const AMBAR = rampa([[0, [34, 12, 0]], [0.35, [140, 56, 4]], [0.7, [245, 118, 16]], [0.95, [255, 150, 38]], [1.25, [255, 204, 128]], [1.7, [255, 250, 235]]]);
const PASOS = 36; // brillo de 0 a 1,8 en 36 escalones
const COLOR = [VERDE, AMBAR].map((f) => Array.from({length: PASOS + 1}, (_, i) => f((i / PASOS) * 1.8)));
export const color = (b: number, tinte: number) => COLOR[tinte][Math.max(0, Math.min(PASOS, Math.round((b / 1.8) * PASOS)))];

// ---------------------------------------------------------------- la retícula
export type Reticula = {ch: Uint16Array; br: Float32Array; tinte: Uint8Array; inv: Uint8Array};
export const nueva = (): Reticula => ({ch: new Uint16Array(N), br: new Float32Array(N), tinte: new Uint8Array(N), inv: new Uint8Array(N)});
export const copia = (de: Reticula, a: Reticula) => { a.ch.set(de.ch); a.br.set(de.br); a.tinte.set(de.tinte); a.inv.set(de.inv); };
export const dentro = (i: number, j: number) => i >= 0 && j >= 0 && i < COLS && j < FILAS;
export const poner = (g: Reticula, i: number, j: number, ch: string, br: number, tinte = 0, inv = 0) => {
  if (!dentro(i, j)) return;
  const k = j * COLS + i;
  g.ch[k] = ch.charCodeAt(0); g.br[k] = br; g.tinte[k] = tinte; g.inv[k] = inv;
};
export const borrar = (g: Reticula, k: number) => { g.ch[k] = 0; g.inv[k] = 0; };
export const escribir = (g: Reticula, txt: string, i: number, j: number, br: number, inv = 0) => {
  for (let n = 0; n < txt.length; n++) poner(g, i + n, j, txt[n], br, 0, inv);
};
export const enCelda = (q: P): [number, number] => [Math.floor(q[0] / CW), Math.floor(q[1] / CH)];

export const hash = (a: number, b: number) => {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// la letra de un borde o de un trazo según su dirección en la pantalla (α en grados, con la y hacia arriba)
export const letraDireccion = (a: number) => {
  const x = ((a % 180) + 180) % 180;
  if (x < 27 || x >= 153) return '-';
  if (x < 70) return '/';
  if (x < 110) return '|';
  return '\\';
};
// la de un segmento de la pantalla (y hacia abajo)
export const letraSegmento = (a: P, b: P) => letraDireccion((Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180) / Math.PI);

// Sobel sobre la señal de cada celda: el borde, su dirección y si la celda está del lado claro. Como en Canny, solo se queda la
// celda donde el salto es mayor (si el borde cae entre dos filas, no salen dos rayas) y siempre la del lado claro.
export const bordes = (S: Float32Array, umbral: number) => {
  const letra = new Uint16Array(N);
  const mag = new Float32Array(N), gxs = new Float32Array(N), gys = new Float32Array(N);
  const v = (i: number, j: number) => (i < 0 || j < 0 || i >= COLS || j >= FILAS ? 0 : S[j * COLS + i]);
  for (let j = 0; j < FILAS; j++) {
    for (let i = 0; i < COLS; i++) {
      const a = v(i - 1, j - 1), b = v(i, j - 1), c = v(i + 1, j - 1);
      const d = v(i - 1, j), f = v(i + 1, j);
      const g = v(i - 1, j + 1), h = v(i, j + 1), k = v(i + 1, j + 1);
      const gx = (c + 2 * f + k - a - 2 * d - g) / 4;
      const gy = (g + 2 * h + k - a - 2 * b - c) / 4;
      const q = j * COLS + i;
      gxs[q] = gx; gys[q] = gy; mag[q] = Math.hypot(gx, gy);
    }
  }
  const cand = new Uint8Array(N);
  for (let j = 0; j < FILAS; j++) {
    for (let i = 0; i < COLS; i++) {
      const q = j * COLS + i;
      const s = S[q];
      if (s < 0.1 || mag[q] < umbral) continue;
      let media = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) media += v(i + di, j + dj);
      if (s >= media / 9 - 0.01) cand[q] = 1;
    }
  }
  const gana = (i: number, j: number, mq: number) =>
    i >= 0 && j >= 0 && i < COLS && j < FILAS && cand[j * COLS + i] === 1 && mag[j * COLS + i] > mq + 0.02;
  for (let j = 0; j < FILAS; j++) {
    for (let i = 0; i < COLS; i++) {
      const q = j * COLS + i;
      if (!cand[q]) continue;
      const ang = Math.atan2(gys[q], gxs[q]);
      const di = Math.round(Math.cos(ang)), dj = Math.round(Math.sin(ang));
      if (gana(i + di, j + dj, mag[q]) || gana(i - di, j - dj, mag[q])) continue;
      const nx = gxs[q] / CW, ny = gys[q] / CH; // la normal, en píxeles
      letra[q] = letraDireccion((Math.atan2(nx, ny) * 180) / Math.PI).charCodeAt(0);
    }
  }
  return letra;
};

// una línea suelta, letra a letra (ch fija la letra; si no, la de su dirección)
export const trazar = (
  g: Reticula, a: P, b: P, br: number,
  op: {deja?: (k: number) => boolean; tinte?: number; ch?: string; marca?: Uint8Array} = {},
) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const ch = op.ch ?? letraSegmento(a, b);
  const n = Math.ceil(Math.max(Math.abs(dx) / CW, Math.abs(dy) / CH) * 2) + 1;
  for (let s = 0; s <= n; s++) {
    const x = a[0] + (dx * s) / n, y = a[1] + (dy * s) / n;
    const i = Math.floor(x / CW), j = Math.floor(y / CH);
    if (!dentro(i, j)) continue;
    const k = j * COLS + i;
    if (op.deja && !op.deja(k)) continue;
    poner(g, i, j, ch, br, op.tinte ?? 0);
    if (op.marca) op.marca[k] = 1;
  }
};

// ---------------------------------------------------------------- los negativos
const lienzos: Record<string, HTMLCanvasElement> = {};
export const negativo = (nombre: string): CanvasRenderingContext2D => {
  let c = lienzos[nombre];
  if (!c) { c = document.createElement('canvas'); c.width = NW; c.height = NH; lienzos[nombre] = c; }
  const ctx = c.getContext('2d', {willReadFrequently: true})!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, NW, NH);
  ctx.setTransform(SX / CW, 0, 0, SY / CH, 0, 0); // se pinta en píxeles de la pantalla
  return ctx;
};
// el color con el que se pinta una pieza: separa (rojo), brillo (verde) y material (azul)
export const tinta = (tono: number, brillo: number, mat: number) =>
  `rgb(${Math.round(tono * 255)},${Math.round((Math.min(BR, brillo) / BR) * 255)},${mat * COD})`;

export type Celdas = {tono: Float32Array; brillo: Float32Array; cob: Float32Array; mat: Uint8Array};
// cada celda: cuánto la cubre (el alfa), su tono (premultiplicado), su brillo y el material que más hay
export const leerCeldas = (ctx: CanvasRenderingContext2D): Celdas => {
  const d = ctx.getImageData(0, 0, NW, NH).data;
  const tono = new Float32Array(N), brillo = new Float32Array(N), cob = new Float32Array(N), mat = new Uint8Array(N);
  const hist = new Uint8Array(16);
  for (let j = 0; j < FILAS; j++) {
    for (let i = 0; i < COLS; i++) {
      let sa = 0, st = 0, sb = 0, n = 0;
      hist.fill(0);
      for (let v = 0; v < SY; v++) {
        let o = ((j * SY + v) * NW + i * SX) * 4;
        for (let u = 0; u < SX; u++, o += 4) {
          const al = d[o + 3];
          if (!al) continue;
          const m = Math.round(d[o + 2] / COD);
          sa += al; st += d[o] * al; sb += d[o + 1] * al;
          if (al > 127 && m < 16) { hist[m]++; n++; }
        }
      }
      const k = j * COLS + i;
      cob[k] = sa / (MUESTRAS * 255);
      tono[k] = st / (MUESTRAS * 255 * 255);
      brillo[k] = sa ? (sb / (sa * 255)) * BR : 0;
      let mejor = 0;
      for (let m = 1; m < 16; m++) if (hist[m] > hist[mejor] || (mejor === 0 && hist[m] > 0)) mejor = m;
      mat[k] = n ? mejor : 0;
    }
  }
  return {tono, brillo, cob, mat};
};

// ---------------------------------------------------------------- el tubo
// la curvatura del cristal: cada letra se corre un pelo hacia el centro cuanto más lejos está
const CURVA = 0.035;
const POS = (() => {
  const x = new Float32Array(N), y = new Float32Array(N);
  const R = Math.hypot(W / 2, H / 2);
  for (let j = 0; j < FILAS; j++) {
    for (let i = 0; i < COLS; i++) {
      const u = ((i + 0.5) * CW - W / 2) / R, v = ((j + 0.5) * CH - H / 2) / R;
      const f = 1 - CURVA * (u * u + v * v);
      x[j * COLS + i] = W / 2 + u * f * R;
      y[j * COLS + i] = H / 2 + v * f * R;
    }
  }
  return {x, y};
})();

const capas: Record<string, HTMLCanvasElement> = {};
const capa = (nombre: string, w: number, h: number) => {
  let c = capas[nombre];
  if (!c) { c = document.createElement('canvas'); capas[nombre] = c; }
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return c;
};

export type Tubo = {
  t: number; dpr: number; fuente: string;
  global: number; // el brillo de todo (el temblor del fósforo y los destellos)
  sacudida: [number, number]; // el golpe: todo el cuadro se mueve unos píxeles
  rasga?: (j: number) => number; // y algunas filas se corren (en celdas)
};

export const pintarTubo = (lienzo: HTMLCanvasElement, g: Reticula, o: Tubo) => {
  const {dpr} = o;
  const ancho = lienzo.width, alto = lienzo.height;

  // 1 · las letras, en su capa
  const L = capa('letras', ancho, alto);
  const lx = L.getContext('2d')!;
  lx.setTransform(1, 0, 0, 1, 0, 0);
  lx.clearRect(0, 0, ancho, alto);
  lx.setTransform(dpr, 0, 0, dpr, o.sacudida[0] * dpr, o.sacudida[1] * dpr);
  lx.font = `600 20px "${o.fuente}", monospace`;
  lx.textAlign = 'center';
  lx.textBaseline = 'middle';
  let ultimo = '';
  for (let k = 0; k < N; k++) {
    const code = g.ch[k];
    if (!code && !g.inv[k]) continue;
    const col = color(g.br[k] * o.global, g.tinte[k]);
    const j = Math.floor(k / COLS);
    const x = POS.x[k] + (o.rasga ? o.rasga(j) * CW : 0), y = POS.y[k];
    if (g.inv[k]) {
      lx.fillStyle = col; ultimo = col;
      lx.fillRect(x - CW / 2, y - CH / 2 + 1, CW, CH - 2);
      if (code && code !== 32) { lx.fillStyle = '#031208'; ultimo = '#031208'; lx.fillText(String.fromCharCode(code), x, y + 1); }
      continue;
    }
    if (col !== ultimo) { lx.fillStyle = col; ultimo = col; }
    lx.fillText(String.fromCharCode(code), x, y + 1);
  }

  // 2 · el brillo del fósforo: dos copias pequeñas y borrosas, sumadas
  const b1 = capa('brillo1', Math.max(8, Math.round(ancho / 4)), Math.max(8, Math.round(alto / 4)));
  const b2 = capa('brillo2', Math.max(4, Math.round(ancho / 14)), Math.max(4, Math.round(alto / 14)));
  const c1 = b1.getContext('2d')!, c2 = b2.getContext('2d')!;
  c1.clearRect(0, 0, b1.width, b1.height);
  c1.filter = `blur(${Math.max(1, 2.2 * dpr)}px)`;
  c1.drawImage(L, 0, 0, b1.width, b1.height);
  c1.filter = 'none';
  c2.clearRect(0, 0, b2.width, b2.height);
  c2.filter = `blur(${Math.max(1, 1.6 * dpr)}px)`;
  c2.drawImage(b1, 0, 0, b2.width, b2.height);
  c2.filter = 'none';

  const ctx = lienzo.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  // el cristal apagado: casi negro, con el centro un pelo encendido
  const fondo = ctx.createRadialGradient(W * 0.46, H * 0.5, 80, W * 0.5, H * 0.5, H * 0.62);
  fondo.addColorStop(0, '#05170b');
  fondo.addColorStop(0.6, '#030c06');
  fondo.addColorStop(1, '#010402');
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.95;
  ctx.drawImage(b2, 0, 0, W, H);
  ctx.globalAlpha = 0.65;
  ctx.drawImage(b1, 0, 0, W, H);
  ctx.globalAlpha = 1;
  ctx.drawImage(L, 0, 0, W, H);

  // 3 · la banda de refresco que baja despacio
  const yb = ((o.t / 3) % 1) * (H + 400) - 200;
  const banda = ctx.createLinearGradient(0, yb - 160, 0, yb + 160);
  banda.addColorStop(0, 'rgba(60,255,120,0)');
  banda.addColorStop(0.5, 'rgba(60,255,120,0.035)');
  banda.addColorStop(1, 'rgba(60,255,120,0)');
  ctx.fillStyle = banda;
  ctx.fillRect(0, yb - 160, W, 320);
  ctx.globalCompositeOperation = 'source-over';

  // 4 · las líneas de barrido
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y + 2.4, W, 1.6);

  // 5 · la viñeta y el reflejo del cristal
  const vineta = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.62);
  vineta.addColorStop(0, 'rgba(0,0,0,0)');
  vineta.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = vineta;
  ctx.fillRect(0, 0, W, H);
  const reflejo = ctx.createRadialGradient(W * 0.22, H * 0.12, 10, W * 0.22, H * 0.12, H * 0.42);
  reflejo.addColorStop(0, 'rgba(210,255,225,0.05)');
  reflejo.addColorStop(1, 'rgba(210,255,225,0)');
  ctx.fillStyle = reflejo;
  ctx.fillRect(0, 0, W, H);

  // 6 · el marco del tubo: esquinas redondas y una sombra hacia dentro
  const I = 14, RAD = 70;
  ctx.fillStyle = '#010201';
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.roundRect(I, I, W - 2 * I, H - 2 * I, RAD);
  ctx.fill('evenodd');
  for (let s = 0; s < 6; s++) {
    ctx.strokeStyle = `rgba(0,0,0,${0.3 - s * 0.045})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(I + 3 + s * 6, I + 3 + s * 6, W - 2 * (I + 3 + s * 6), H - 2 * (I + 3 + s * 6), RAD - s * 4);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(120,255,160,0.07)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(I, I, W - 2 * I, H - 2 * I, RAD);
  ctx.stroke();
};
