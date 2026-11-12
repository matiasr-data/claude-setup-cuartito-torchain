import {clamp, mix, rng} from '../../../comun/curvas';

// EL PINCEL DE LA TINTA CHINA. Pasado a TypeScript de un motor de tinta
// con licencia MIT (ver AVISOS.md), con lo que pide esta escena.
// Un trazo = una línea central + un perfil de presión + unas cuantas «cerdas». El cuerpo de la tinta mojada va a la capa MOJADA (el
// papel la corre y le acumula el pigmento en el borde, en ./papel.ts); las cerdas del pincel seco van a la capa SECA y se rompen
// según la tinta que les queda (el «blanco volante», 飞白). Las capas son lienzos de solo alfa: tinta negra multiplicada en el papel.
// El rojo del sello va aparte, en la capa COLOR.
// Todo es determinista: cada trazo lleva su semilla y las roturas de las cerdas se miden en una longitud fija (gapLen), así no
// «reptan» de un dibujo al siguiente; lo único que hierve es un pelo del ancho (boil).

export type Q = [number, number] | [number, number, number]; // x, y y la presión (1 si no va)
export type Capas = {mojada: CanvasRenderingContext2D; seca: CanvasRenderingContext2D; color: CanvasRenderingContext2D};

// los cinco tonos de la tinta (焦浓重淡清: quemada, espesa, pesada, clara y transparente)
export const TONO = {jiao: 0.96, nong: 0.82, zhong: 0.6, dan: 0.34, qing: 0.16};
export const BERMELLON: [number, number, number] = [176, 46, 34]; // #B02E22, el único color

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const vruido = (x: number) => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return mix(hash(i), hash(i + 1), u);
};

// Catmull-Rom para densificar y después remuestrear a pasos iguales
const densifica = (P: Q[], por = 10): [number, number, number][] => {
  const z = (q: Q) => (q.length > 2 ? (q[2] as number) : 1);
  if (P.length < 3) {
    const a = P[0], b = P[P.length - 1];
    const out: [number, number, number][] = [];
    for (let i = 0; i <= por; i++) {
      const t = i / por;
      out.push([mix(a[0], b[0], t), mix(a[1], b[1], t), mix(z(a), z(b), t)]);
    }
    return out;
  }
  const out: [number, number, number][] = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < por; k++) {
      const t = k / por, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1]), mix(z(p1), z(p2), t)]);
    }
  }
  const l = P[P.length - 1];
  out.push([l[0], l[1], z(l)]);
  return out;
};
const remuestrea = (D: [number, number, number][], ds: number) => {
  const acc = [0];
  for (let i = 1; i < D.length; i++) acc.push(acc[i - 1] + Math.hypot(D[i][0] - D[i - 1][0], D[i][1] - D[i - 1][1]));
  const L = acc[acc.length - 1] || 1e-6;
  const n = Math.max(2, Math.min(600, Math.ceil(L / ds) + 1));
  const out: [number, number, number][] = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const s = (L * i) / (n - 1);
    while (j < D.length - 2 && acc[j + 1] < s) j++;
    const u = clamp((s - acc[j]) / (acc[j + 1] - acc[j] || 1e-6));
    out.push([mix(D[j][0], D[j + 1][0], u), mix(D[j][1], D[j + 1][1], u), mix(D[j][2], D[j + 1][2], u)]);
  }
  return {pts: out, len: L};
};

// los perfiles de presión (de 0, donde entra el pincel, a 1, donde sale)
export const PERFIL = {
  pincel: (s: number) => Math.min(1, 0.45 + (s / 0.1) * 0.55) * Math.pow(1 - s * 0.9, 0.45), // apoya, se para y se afina
  parejo: (s: number) => Math.min(1, 0.55 + (s / 0.05) * 0.45) * Math.min(1, 0.5 + ((1 - s) / 0.06) * 0.5),
  punta: (s: number) => Math.pow(Math.sin(Math.PI * clamp(s * 0.96 + 0.02)), 0.6), // en punta por los dos lados
  lente: (s: number) => Math.pow(Math.sin(Math.PI * clamp(s)), 0.75),
  clavo: (s: number) => Math.pow(1 - s, 0.7) * Math.min(1, 0.7 + s * 6), // entra fuerte y sale en punta
  sube: (s: number) => Math.min(1, 0.12 + (s / 0.14) * 0.88) * Math.min(1, ((1 - s) / 0.08) * 0.7 + 0.3),
  crece: (s: number) => 0.08 + 0.92 * Math.pow(s, 0.9), // de la nada a todo (el rastro de la bola: grueso donde está ella)
  tunica: (s: number) => (0.75 + 0.25 * s) * Math.min(1, (s / 0.05) * 0.5 + 0.5) * Math.min(1, ((1 - s) / 0.08) * 0.7 + 0.3),
  punto: (s: number) => Math.pow(Math.sin(Math.PI * clamp(s * 0.9 + 0.05)), 0.45),
};
export type Perfil = keyof typeof PERFIL;

export type OpTrazo = {
  w: number; // el ancho
  tono?: number; // de 0 a 1 (TONO)
  seca?: number; // de 0 (mojado y lleno) a 1 (solo las cerdas, blanco volante)
  mojada?: number; // cuánto del cuerpo va a la capa mojada (la que se corre)
  perfil?: Perfil | ((s: number) => number);
  aspero?: number; // lo que tiembla el ancho
  pulso?: number; // lo que se hincha y se afina a lo largo (pocas veces por trazo): el pulso de la mano en un trazo maestro
  cerdas?: number;
  semilla: number;
  ds?: number;
  apaga?: number; // cuánto pierde la tinta a lo largo
  cuerpo?: number; // multiplica el cuerpo
  cerda?: number; // multiplica las cerdas
  lado?: number; // las cerdas, más oscuras de un lado (el trazo cargado: su borde oscuro ES el contorno)
  oscuro?: [number, number]; // decide el lado oscuro solo: el que mira hacia aquí
  cerdasMojadas?: boolean;
  solido?: boolean;
  hueco?: number; // la longitud fija con la que se miden las roturas de las cerdas
  hierve?: number; // un pelo distinto en cada dibujo (0, 1, 2…)
  color?: [number, number, number];
};

type Cerda = {off: number; bw: number; a: number; ph: number; carga: number; gs: number; fin: number};
export type Trazo = {
  P: [number, number, number][]; n: number; len: number; ws: number[]; nx: number[]; ny: number[]; w: number; tono: number; seca: number;
  mojada: number; cerdas: Cerda[]; apaga: number; cuerpo: number; cerda: number; color: [number, number, number] | null; lado: number;
  cerdasMojadas: boolean; solido: boolean; hueco: number | null;
};

// arma un trazo
export const trazo = (pts: Q[], o: OpTrazo): Trazo => {
  const w = o.w;
  const ds = o.ds ?? Math.max(0.25, w * 0.18);
  const {pts: P, len} = remuestrea(densifica(pts, 10), ds);
  const n = P.length;
  const prof = typeof o.perfil === 'function' ? o.perfil : PERFIL[o.perfil ?? 'pincel'];
  const aspero = o.aspero ?? 0.12;
  const ws: number[] = [], nx: number[] = [], ny: number[] = [];
  const sem = o.semilla;
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1);
    const rr = vruido(sem * 0.013 + (o.hierve ?? 0) * 0.35 + (s * (o.hueco ?? len)) / (w * 1.3 + 1)) * 2 - 1;
    const pul = 1 + (o.pulso ?? 0) * (vruido(sem * 0.71 + s * 2.4 + 3.3) * 2 - 1);
    ws.push(Math.max(w * 0.04, w * prof(s) * P[i][2] * (1 + aspero * rr) * pul));
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    nx.push(-dy / L);
    ny.push(dx / L);
  }
  const seca = o.seca ?? 0.25;
  let lado = o.lado ?? 0;
  if (o.oscuro) {
    let ax = 0, ay = 0;
    for (let i = 0; i < n; i++) { ax += nx[i]; ay += ny[i]; }
    lado = Math.abs(o.lado ?? 0.85) * Math.sign(ax * o.oscuro[0] + ay * o.oscuro[1] || 1);
  }
  const nb = o.cerdas ?? Math.round(clamp(w * 1.1, 4, 56));
  const R = rng(sem * 9973 + 17);
  const cerdas: Cerda[] = [];
  for (let j = 0; j < nb; j++) {
    const off = (j + 0.5) / nb - 0.5 + ((R() - 0.5) * 0.6) / nb;
    const borde = Math.abs(off) * 2;
    cerdas.push({
      off, bw: (w / nb) * (1.0 + R() * 1.1), a: 0.55 + R() * 0.45, ph: R() * 1000,
      carga: 1 - seca * (0.15 + 0.85 * borde) * (0.5 + R() * 0.7), // las del borde llevan menos tinta
      gs: 0.5 + R() * 1.6, fin: 1 - R() * seca * 0.35,
    });
  }
  return {
    P, n, len, ws, nx, ny, w, tono: o.tono ?? TONO.nong, seca, mojada: o.mojada ?? 0, cerdas, apaga: o.apaga ?? seca * 0.55, cuerpo: o.cuerpo ?? 1,
    cerda: o.cerda ?? 1, color: o.color ?? null, lado, cerdasMojadas: !!o.cerdasMojadas, solido: !!o.solido, hueco: o.hueco ?? null,
  };
};

// pinta un trazo; p = hasta dónde (0..1), am = la opacidad de todo
export const pinta = (L: Capas, s: Trazo, p = 1, am = 1) => {
  if (p <= 0 || am <= 0) return;
  p = clamp(p);
  const {P, n, ws, nx, ny} = s;
  const m = (n - 1) * p, k = Math.floor(m), f = m - k;
  const cnt = f > 0.001 && k < n - 1 ? k + 2 : k + 1;
  const X = (i: number) => (i <= k ? P[i][0] : mix(P[k][0], P[k + 1][0], f));
  const Y = (i: number) => (i <= k ? P[i][1] : mix(P[k][1], P[k + 1][1], f));
  const CC = s.color ? s.color.join(',') : '0,0,0';
  const WW = (i: number) => ws[Math.min(i, n - 1)] * (p < 1 && i >= cnt - 2 ? 0.75 : 1);
  // el cuerpo de la tinta
  const aCuerpo = s.tono * Math.pow(1 - s.seca, 1.6) * s.cuerpo * am;
  if (aCuerpo > 0.004) {
    const path = new Path2D();
    for (let i = 0; i < cnt; i++) {
      const j = Math.min(i, n - 1), hw = WW(i) / 2;
      const x = X(i) + nx[j] * hw, y = Y(i) + ny[j] * hw;
      if (i) path.lineTo(x, y);
      else path.moveTo(x, y);
    }
    for (let i = cnt - 1; i >= 0; i--) {
      const j = Math.min(i, n - 1), hw = WW(i) / 2;
      path.lineTo(X(i) - nx[j] * hw, Y(i) - ny[j] * hw);
    }
    path.closePath();
    // la tinta se acaba a lo largo del trazo
    const g = (c: CanvasRenderingContext2D, a: number) => {
      if (a <= 0.003) return;
      const gr = c.createLinearGradient(P[0][0], P[0][1], P[n - 1][0], P[n - 1][1]);
      gr.addColorStop(0, `rgba(${CC},${clamp(a)})`);
      gr.addColorStop(1, `rgba(${CC},${clamp(a * (1 - s.apaga))})`);
      c.fillStyle = gr;
      c.fill(path);
    };
    if (s.color) g(L.color, aCuerpo);
    else if (s.solido) {
      g(L.seca, aCuerpo * 0.92);
      if (s.mojada > 0) g(L.mojada, aCuerpo * s.mojada);
    } else {
      if (s.mojada > 0) g(L.mojada, aCuerpo * s.mojada);
      if (s.mojada < 1) g(L.seca, aCuerpo * (1 - s.mojada) * 0.8);
    }
  }
  // las cerdas (el blanco volante)
  const c = s.color ? L.color : s.cerdasMojadas ? L.mojada : L.seca;
  if (s.cerda <= 0) return;
  const aCerda = s.tono * am * s.cerda * (s.cerdasMojadas ? 1 : s.mojada > 0.6 ? 0.12 : 1);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = `rgb(${CC})`;
  const dsl = (s.hueco ?? s.len) / (n - 1);
  for (const b of s.cerdas) {
    const e = Math.min(m, (n - 1) * b.fin), kk = Math.floor(e);
    if (kk < 1) continue;
    const lat = s.lado ? mix(1 - Math.abs(s.lado), 1, clamp(b.off * Math.sign(s.lado) * 1.6 + 0.5)) : 1;
    c.globalAlpha = clamp(aCerda * b.a * lat);
    c.lineWidth = b.bw;
    c.beginPath();
    let on = false;
    const gsc = Math.max(6, s.w * 1.4) * b.gs;
    for (let i = 0; i <= kk; i++) {
      const u = i / (n - 1), sl = i * dsl;
      // la tinta que le queda: baja a lo largo del trazo (más rápido si el pincel va seco); el ruido decide dónde se rompe
      const tinta = b.carga - s.seca * (0.08 + 1.15 * Math.pow(u, 1.25));
      const v = tinta + (vruido(b.ph + sl / gsc) - 0.5) * 0.9 * s.seca + (vruido(b.ph * 1.7 + sl / (gsc * 0.18)) - 0.5) * 0.25 * s.seca;
      if (v > 0.42 * s.seca + 0.02) {
        const hw = ws[i] * (b.off + (vruido(b.ph * 3 + sl / (gsc * 2)) - 0.5) * 0.07);
        const x = P[i][0] + nx[i] * hw, y = P[i][1] + ny[i] * hw;
        if (on) c.lineTo(x, y);
        else c.moveTo(x, y);
        on = true;
      } else on = false;
    }
    c.stroke();
  }
  c.globalAlpha = 1;
};

// la silueta de un trazo (para reservarle el papel antes de pintarlo), con un margen
export const contorno = (s: Trazo, margen = 0): [number, number][] => {
  const ida: [number, number][] = [], vuelta: [number, number][] = [];
  for (let i = 0; i < s.n; i++) {
    const hw = s.ws[i] / 2 + margen;
    ida.push([s.P[i][0] + s.nx[i] * hw, s.P[i][1] + s.ny[i] * hw]);
    vuelta.push([s.P[i][0] - s.nx[i] * hw, s.P[i][1] - s.ny[i] * hw]);
  }
  // las puntas, redondas
  const tapa = (i: number, sentido: number): [number, number][] => {
    const hw = s.ws[i] / 2 + margen, out: [number, number][] = [];
    const tx = s.ny[i], ty = -s.nx[i]; // hacia delante del trazo
    for (let k = 1; k < 6; k++) {
      const a = (k / 6) * Math.PI;
      out.push([s.P[i][0] + (s.nx[i] * Math.cos(a) + tx * Math.sin(a)) * hw * sentido, s.P[i][1] + (s.ny[i] * Math.cos(a) + ty * Math.sin(a)) * hw * sentido]);
    }
    return out;
  };
  return [...ida, ...tapa(s.n - 1, 1), ...vuelta.reverse(), ...tapa(0, -1)];
};

// una gota de tinta (los puntos de musgo, las salpicaduras): una mancha aplastada con el borde irregular
export const gota = (c: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, giro = 0, aplasta = 1, semilla = 0, color = '0,0,0') => {
  if (a <= 0.003 || r <= 0.05) return;
  c.save();
  c.translate(x, y);
  c.rotate(giro);
  c.scale(1, aplasta);
  c.globalAlpha = clamp(a);
  c.fillStyle = `rgb(${color})`;
  c.beginPath();
  const N = 18, ph = semilla * 7.13 + x * 0.01;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    const rr = r * (0.78 + 0.44 * vruido(ph + i * 0.9) + 0.12 * Math.sin(t * 3 + ph));
    if (i) c.lineTo(Math.cos(t) * rr, Math.sin(t) * rr);
    else c.moveTo(Math.cos(t) * rr, Math.sin(t) * rr);
  }
  c.fill();
  c.restore();
  c.globalAlpha = 1;
};

// el borde de un polígono, partido y movido con ruido (para las masas: nunca un relleno plano)
export const borroso = (poly: [number, number][], jit: number, semilla: number): [number, number][] => {
  const pts: [number, number][] = [];
  const N = poly.length;
  for (let i = 0; i < N; i++) {
    const p = poly[i], q = poly[(i + 1) % N];
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const k = jit ? Math.max(1, Math.min(24, Math.round(L / Math.max(2, jit * 2.5)))) : 1;
    const nx = -(q[1] - p[1]) / (L || 1), ny = (q[0] - p[0]) / (L || 1);
    for (let j = 0; j < k; j++) {
      const u = j / k;
      const d = jit ? (vruido(semilla * 3.1 + i * 5.3 + u * k * 0.8) - 0.5) * jit * 2 : 0;
      pts.push([mix(p[0], q[0], u) + nx * d, mix(p[1], q[1], u) + ny * d]);
    }
  }
  return pts;
};

// una masa de tinta mojada (el cuerpo de la papelera, una montaña, una sombra): el polígono con su borde roto y, si va, un
// degradado g = [x0, y0, x1, y1, a0, a1]
export const masa = (c: CanvasRenderingContext2D, poly: [number, number][], a: number, jit = 0, semilla = 0, g: number[] | null = null, color = '0,0,0') => {
  if (a <= 0.003) return;
  const pts = borroso(poly, jit, semilla);
  c.globalAlpha = 1;
  if (g) {
    const gr = c.createLinearGradient(g[0], g[1], g[2], g[3]);
    gr.addColorStop(0, `rgba(${color},${clamp(a * g[4])})`);
    gr.addColorStop(1, `rgba(${color},${clamp(a * g[5])})`);
    c.fillStyle = gr;
  } else c.fillStyle = `rgba(${color},${clamp(a)})`;
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
  c.closePath();
  c.fill();
};

// borra la tinta debajo de una forma (el papel en blanco que deja el pintor para lo que va delante)
export const reserva = (L: Capas, poly: [number, number][], k = 1, jit = 0, semilla = 0, color = true) => {
  const pts = jit ? borroso(poly, jit, semilla) : poly;
  const path = new Path2D();
  pts.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])));
  path.closePath();
  for (const c of color ? [L.mojada, L.seca, L.color] : [L.mojada, L.seca]) {
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.globalAlpha = clamp(k);
    c.fillStyle = '#000';
    c.fill(path);
    c.restore();
  }
};

// puntos de una curva cuadrática (con su presión)
export const curvaQ = (a: [number, number], ctl: [number, number], b: [number, number], n = 8, p0 = 1, p1 = 1): Q[] => {
  const out: Q[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * ctl[0] + t * t * b[0], u * u * a[1] + 2 * u * t * ctl[1] + t * t * b[1], mix(p0, p1, t)]);
  }
  return out;
};

// el sello de bermellón, en 白文 (las líneas talladas salen en blanco): un cuadrado un pelo irregular con 中 («dar en el blanco»)
export const sello = (c: CanvasRenderingContext2D, x: number, y: number, S: number, semilla = 3) => {
  c.save();
  c.translate(x, y);
  const jit = S * 0.02;
  c.beginPath();
  const N = 32;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * 4, lado = Math.floor(t), u = t - lado;
    let px: number, py: number;
    if (lado === 0) { px = u * S; py = 0; } else if (lado === 1) { px = S; py = u * S; } else if (lado === 2) { px = S - u * S; py = S; } else { px = 0; py = S - u * S; }
    px += (vruido(semilla + i * 1.3) - 0.5) * jit * 2;
    py += (vruido(semilla + 40 + i * 1.3) - 0.5) * jit * 2;
    if (i) c.lineTo(px, py);
    else c.moveTo(px, py);
  }
  c.closePath();
  c.fillStyle = `rgba(${BERMELLON.join(',')},0.97)`;
  c.fill();
  // lo tallado: 中, la caja (口) y el palo que la atraviesa, con el trazo de piedra un pelo temblón
  c.globalCompositeOperation = 'destination-out';
  c.strokeStyle = '#000';
  c.fillStyle = '#000';
  c.lineCap = 'square';
  c.lineJoin = 'miter';
  c.lineWidth = S * 0.1;
  const linea = (pts: [number, number][]) => {
    c.beginPath();
    pts.forEach(([a, b], i) => {
      const X = a * S + (vruido(semilla + i * 2.1 + a * 9) - 0.5) * jit, Y = b * S + (vruido(semilla + 7 + i * 2.1 + b * 9) - 0.5) * jit;
      if (i) c.lineTo(X, Y);
      else c.moveTo(X, Y);
    });
    c.stroke();
  };
  linea([[0.2, 0.33], [0.8, 0.33], [0.8, 0.66], [0.2, 0.66], [0.2, 0.33]]);
  linea([[0.5, 0.13], [0.5, 0.87]]);
  // la pasta del sello no agarra pareja: puntitos blancos
  for (let i = 0; i < 80; i++) {
    const a = vruido(semilla + i * 3.7), b = vruido(semilla + 91 + i * 2.9);
    c.globalAlpha = 0.45 + 0.55 * vruido(i * 1.1);
    c.beginPath();
    c.arc(a * S, b * S, S * (0.004 + 0.013 * vruido(i * 5.3)), 0, 7);
    c.fill();
  }
  c.restore();
};
