import {clamp} from '../../../comun/curvas';
import {CAMARA, proyecta, type P, type V3} from '../escena';

// CINE MUDO, LA GEOMETRÍA: cajas, cilindros y esferas de la escena pintados en 2D con su perspectiva (la de
// escena.ts: proyecta()), cada cara con su gris según la luz. Es una «pintura tonal»: solo valores de gris, con
// degradados suaves y una línea fina de separación; el paso de dibujo (pelicula.ts) los entinta como un grabado.
// Coordenadas de la pantalla (y hacia abajo) y z hacia la cámara, como en escena.ts.

export const sum = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const res = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const esc = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const pto = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const lar = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const nor = (a: V3): V3 => esc(a, 1 / Math.max(1e-9, lar(a)));

// ---- las matrices (las mismas que escena.ts, que no las exporta: el mundo 3D es (x, −y, z) de la pantalla)
export type M3 = number[];
export const mm = (a: M3, b: M3): M3 => {
  const o: number[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]);
  return o;
};
export const ap = (m: M3, v: V3): V3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
export const rx = (a: number): M3 => [1, 0, 0, 0, Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a)];
export const ry = (a: number): M3 => [Math.cos(a), 0, Math.sin(a), 0, 1, 0, -Math.sin(a), 0, Math.cos(a)];
export const rz = (a: number): M3 => [Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a), 0, 0, 0, 1];
export const vuelta = (q: V3): V3 => [q[0], -q[1], q[2]]; // del mundo a la pantalla (y al revés)

// un marco: origen (en el mundo) y giro; da puntos y ejes ya en la pantalla
export type Marco = {o: V3; m: M3; s: number};
export const enMarco = (k: Marco, local: V3): V3 => vuelta(sum(k.o, ap(k.m, esc(local, k.s))));
export const ejeMarco = (k: Marco, local: V3): V3 => nor(vuelta(ap(k.m, local)));

// ---- la luz: arriba a la izquierda y por delante (la ventana y la lámpara)
export const LUZ: V3 = nor([-0.45, -0.72, 0.55]);
export const luz = (n: V3) => 0.56 + 0.5 * Math.max(0, pto(n, LUZ)) - 0.08 * Math.max(0, n[1]);
export const gris = (v: number, a = 1) => {
  const n = Math.round(clamp(v) * 255);
  return a >= 1 ? `rgb(${n},${n},${n})` : `rgba(${n},${n},${n},${a})`;
};
export const seVe = (n: V3, punto: V3) => pto(n, res(CAMARA, punto)) > 0;

export const camino = (ctx: CanvasRenderingContext2D, pts: P[], cerrar = true) => {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  if (cerrar) ctx.closePath();
};
export const poli = (ctx: CanvasRenderingContext2D, pts: P[], relleno: string, borde?: string, grueso = 2) => {
  camino(ctx, pts);
  ctx.fillStyle = relleno;
  ctx.fill();
  if (borde) {
    ctx.strokeStyle = borde;
    ctx.lineWidth = grueso;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
};

// la envolvente convexa de unos puntos (para el contorno de un cilindro)
export const envolvente = (pts: P[]): P[] => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const x = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const abajo: P[] = [];
  for (const q of p) {
    while (abajo.length >= 2 && x(abajo[abajo.length - 2], abajo[abajo.length - 1], q) <= 0) abajo.pop();
    abajo.push(q);
  }
  const arriba: P[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (arriba.length >= 2 && x(arriba[arriba.length - 2], arriba[arriba.length - 1], q) <= 0) arriba.pop();
    arriba.push(q);
  }
  return [...abajo.slice(0, -1), ...arriba.slice(0, -1)];
};

// ---------------------------------------------------------------- una caja: centro, sus tres ejes (unitarios) y medio tamaño en cada uno
export type OpCaja = {borde?: number; grueso?: number; cara?: (eje: number, signo: number, esquinas: P[]) => void; tonoCara?: (eje: number, signo: number) => number};
export const caja = (ctx: CanvasRenderingContext2D, c: V3, ejes: [V3, V3, V3], m: [number, number, number], base: number, op: OpCaja = {}) => {
  const caras: {n: V3; pts: P[]; eje: number; signo: number}[] = [];
  for (let e = 0; e < 3; e++) {
    for (const s of [1, -1]) {
      const n = esc(ejes[e], s);
      const cc = sum(c, esc(ejes[e], s * m[e]));
      if (!seVe(n, cc)) continue;
      const a = (e + 1) % 3, b = (e + 2) % 3;
      const pts: P[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => proyecta(sum(sum(cc, esc(ejes[a], u * m[a])), esc(ejes[b], v * m[b]))));
      caras.push({n, pts, eje: e, signo: s});
    }
  }
  for (const k of caras) {
    const t = (op.tonoCara ? op.tonoCara(k.eje, k.signo) : base) * luz(k.n);
    poli(ctx, k.pts, gris(t), gris(t), 1.2);
    op.cara?.(k.eje, k.signo, k.pts);
  }
  if ((op.borde ?? 0.5) > 0) {
    ctx.lineJoin = 'round';
    for (const k of caras) {
      camino(ctx, k.pts);
      ctx.strokeStyle = gris(base * (op.borde ?? 0.5));
      ctx.lineWidth = op.grueso ?? 2.4;
      ctx.stroke();
    }
  }
};

// ---------------------------------------------------------------- un cilindro: el centro de la base, su eje (unitario), radio y alto
// El costado, con un degradado que sigue a la luz; las tapas que se vean, planas; el contorno, una línea más oscura.
const perpendicular = (eje: V3): [V3, V3] => {
  const h: V3 = Math.abs(eje[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const a = nor(cruz(eje, h));
  return [a, cruz(eje, a)];
};
export type OpCil = {n?: number; tapa?: number; tapaAbajo?: boolean; borde?: number; grueso?: number};
export const cilindro = (ctx: CanvasRenderingContext2D, base: V3, eje: V3, r: number, h: number, tono: number, op: OpCil = {}) => {
  const N = op.n ?? 28;
  const [a, b] = perpendicular(eje);
  const top = sum(base, esc(eje, h));
  const anillo = (c: V3) => Array.from({length: N}, (_, k) => {
    const th = (k / N) * Math.PI * 2;
    return sum(c, sum(esc(a, r * Math.cos(th)), esc(b, r * Math.sin(th))));
  });
  const ab = anillo(base), ar = anillo(top);
  const pAb = ab.map(proyecta), pAr = ar.map(proyecta);
  const contorno = envolvente([...pAb, ...pAr]);
  // el degradado del costado: el gris de cada generatriz visible, puesto a lo ancho de la silueta
  const p0 = proyecta(base), p1 = proyecta(top);
  let dx = p1[0] - p0[0], dy = p1[1] - p0[1];
  const dl = Math.hypot(dx, dy) || 1;
  [dx, dy] = [-dy / dl, dx / dl];
  const proy = (q: P) => (q[0] - p0[0]) * dx + (q[1] - p0[1]) * dy;
  const vis: {s: number; t: number}[] = [];
  for (let k = 0; k < N; k++) {
    const th = (k / N) * Math.PI * 2;
    const n = sum(esc(a, Math.cos(th)), esc(b, Math.sin(th)));
    const mid = sum(sum(base, esc(n, r)), esc(eje, h / 2));
    if (pto(n, res(CAMARA, mid)) < -0.02 * lar(res(CAMARA, mid))) continue;
    vis.push({s: proy(pAb[k]), t: tono * luz(n)});
  }
  let relleno: string | CanvasGradient = gris(tono * 0.8);
  if (vis.length >= 2) {
    vis.sort((x, y) => x.s - y.s);
    const s0 = vis[0].s, s1 = vis[vis.length - 1].s;
    const g = ctx.createLinearGradient(p0[0] + dx * s0, p0[1] + dy * s0, p0[0] + dx * s1, p0[1] + dy * s1);
    for (const v of vis) g.addColorStop(clamp((v.s - s0) / Math.max(1e-6, s1 - s0)), gris(v.t));
    relleno = g;
  }
  camino(ctx, contorno);
  ctx.fillStyle = relleno;
  ctx.fill();
  // las tapas
  const tapa = (c: V3, pts: P[], n: V3, t: number) => {
    if (!seVe(n, c)) return;
    poli(ctx, pts, gris(t * luz(n)), gris(t * (op.borde ?? 0.55)), (op.grueso ?? 2.2) * 0.8);
  };
  tapa(top, pAr, eje, op.tapa ?? tono);
  if (op.tapaAbajo) tapa(base, pAb, esc(eje, -1), tono);
  if ((op.borde ?? 0.55) > 0) {
    camino(ctx, contorno);
    ctx.strokeStyle = gris(tono * (op.borde ?? 0.55));
    ctx.lineWidth = op.grueso ?? 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  return {contorno, pAb, pAr};
};

// una esfera (un círculo con su luz)
export const esfera = (ctx: CanvasRenderingContext2D, c: V3, r: number, tono: number, borde = 0.5) => {
  const p = proyecta(c);
  const s = r * (proyecta([c[0] + r, c[1], c[2]])[0] - p[0]) / r;
  const g = ctx.createRadialGradient(p[0] - s * 0.35, p[1] - s * 0.4, s * 0.1, p[0], p[1], s);
  g.addColorStop(0, gris(Math.min(1, tono * 1.08)));
  g.addColorStop(0.7, gris(tono * 0.86));
  g.addColorStop(1, gris(tono * 0.66));
  ctx.beginPath();
  ctx.arc(p[0], p[1], s, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  if (borde > 0) {
    ctx.strokeStyle = gris(tono * borde);
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }
};

// una mancha de sombra en el suelo (o en lo que sea): un óvalo blando
export const sombra = (ctx: CanvasRenderingContext2D, c: P, rx: number, ry: number, fuerza: number) => {
  if (fuerza <= 0.002 || rx < 1 || ry < 1) return;
  ctx.save();
  ctx.translate(c[0], c[1]);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(0,0,0,${fuerza})`);
  g.addColorStop(0.55, `rgba(0,0,0,${fuerza * 0.7})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};
