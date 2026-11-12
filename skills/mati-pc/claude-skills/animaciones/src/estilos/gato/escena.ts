import {E, clamp, mix, p, rng, ruido} from '../../comun/curvas';
import {capsula} from '../formas';

// LA ESCENA DEL GATO QUE TIRA LA TAZA. Vista de
// lado: una mesa con una taza de café humeante cerca del borde y un gato sentado al lado, grande. Mira la taza, mira a cámara («lo
// voy a hacer»), la empuja a toquecitos y, MIRANDO A CÁMARA, la saca por el borde: a los 2,7 s cae girando con el café en arco, a los
// 3,1 s se rompe en el suelo, el gato se asoma, vuelve a mirar a cámara satisfecho y se lame la pata. La cola, siempre viva.
// Aquí vive lo que pasa, en piezas y sin estilo; cada estilo las pinta a su manera. Todo sale del tiempo t (el mismo segundo da
// siempre el mismo cuadro). Lienzo de 1080 × 1920.

export const DUR = 6;
export const T_CAE = 2.7; // el momento: la taza se va por el borde
export const T_SUELO = 3.1; // llega al suelo y se rompe

export type P = [number, number];
export type Elipse = {c: P; rx: number; ry: number; ang: number}; // ang en radianes

// ---------------------------------------------------------------- la sala
export const MESA_Y = 1010; // la cara de arriba de la mesa
export const MESA_G = 36; // el grosor del tablero
export const BORDE = 720; // el borde derecho de la mesa, por donde se va la taza
export const SUELO = 1600; // donde apoyan la mesa y la taza rota
export const FONDO_SUELO = 1540; // donde el suelo se junta con la pared (para los estilos con suelo en perspectiva)
export const PX_M = (SUELO - MESA_Y) / 0.75; // la mesa mide 0,75 m
export const T_REAL = Math.sqrt((2 * 0.75) / 9.81); // 0,39 s: lo que tarda de verdad en caer 0,75 m

const RAD = Math.PI / 180;
export const rot = ([x, y]: P, a: number): P => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
export const suma = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
export const resta = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const por = (a: P, k: number): P => [a[0] * k, a[1] * k];
const mixP = (a: P, b: P, k: number): P => [mix(a[0], b[0], k), mix(a[1], b[1], k)];
const giraEn = (q: P, c: P, a: number): P => suma(c, rot(resta(q, c), a));
const largo = (a: P) => Math.hypot(a[0], a[1]);

// fotogramas clave suaves: [t, valor, curva con la que se llega]; por defecto, entrar y salir despacio
type Curva = (x: number) => number;
type Clave = [number, number, Curva?];
const kv = (t: number, claves: Clave[], def: Curva = E.inOutCubic) => {
  if (t <= claves[0][0]) return claves[0][1];
  for (let i = 1; i < claves.length; i++) {
    const [t1, v1, e] = claves[i];
    const [t0, v0] = claves[i - 1];
    if (t <= t1) return mix(v0, v1, (e || def)(p(t, t0, t1 - t0)));
  }
  return claves[claves.length - 1][1];
};
// un pulso que sube y vuelve: 0 → 1 → 0
const pulso = (t: number, t0: number, sube: number, baja: number) =>
  t < t0 ? 0 : t < t0 + sube ? E.outCubic((t - t0) / sube) : 1 - E.inOutCubic(clamp((t - t0 - sube) / baja));

// ---------------------------------------------------------------- la taza
export const TAZA_W = 104;
export const TAZA_H = 118;
const TAZA_Y0 = MESA_Y - TAZA_H / 2;

// dónde está su centro mientras sigue en la mesa: dos toquecitos y el empujón final, lento y sin parar
const tazaX = (t: number) => kv(t, [
  [0, 600], [1.31, 600], [1.43, 622, E.outCubic], [1.67, 622], [1.81, 648, E.outCubic], [2.38, 648], [T_CAE, 726, E.lin],
]);

// la caída: primero gira sobre el borde (y así no roza la mesa), después vuela girando hasta el suelo
const T_PIV = 0.12;
const PIV: P = [BORDE, MESA_Y];
const C0: P = [726, TAZA_Y0];
const A_PIV = 0.9; // lo que gira sobre el borde
const C1 = giraEn(C0, PIV, A_PIV);
const V1: P = [220, 300];
const W_CAE = 9; // rad/s en el aire (el mismo con el que acaba de girar sobre el borde)
const T_AIRE = T_SUELO - T_CAE - T_PIV;
export const G = (2 * (SUELO - 50 - C1[1] - V1[1] * T_AIRE)) / (T_AIRE * T_AIRE); // px/s²: llega justo a los 3,1 s

export type Taza = {c: P; ang: number; estado: 'mesa' | 'cae' | 'suelo'};
export const taza = (t: number): Taza => {
  if (t < T_CAE) return {c: [tazaX(t), TAZA_Y0], ang: 0, estado: 'mesa'};
  const tau = t - T_CAE;
  if (tau < T_PIV) {
    const a = A_PIV * (tau / T_PIV) ** 1.2;
    return {c: giraEn(C0, PIV, a), ang: a, estado: 'cae'};
  }
  const s = Math.min(tau - T_PIV, T_AIRE);
  const c: P = [C1[0] + V1[0] * s, C1[1] + V1[1] * s + 0.5 * G * s * s];
  return {c, ang: A_PIV + W_CAE * s, estado: t < T_SUELO ? 'cae' : 'suelo'};
};
export const IMPACTO = taza(T_SUELO - 1e-6).c;
export const ANG_IMPACTO = taza(T_SUELO - 1e-6).ang;
const vTaza = (t: number): P => {
  const a = taza(t - 0.004).c, b = taza(t + 0.004).c;
  return [(b[0] - a[0]) / 0.008, (b[1] - a[1]) / 0.008];
};

// sus piezas en coordenadas de la taza (centro en 0, y hacia abajo)
const esquina = (c: P, r: number, a0: number, a1: number): P[] =>
  [0, 1, 2, 3].map((i) => suma(c, [Math.cos(mix(a0, a1, i / 3)) * r, Math.sin(mix(a0, a1, i / 3)) * r]));
const CUERPO_TAZA: P[] = [
  [-52, -59], [52, -59], [52, 45], ...esquina([38, 45], 14, 0, Math.PI / 2), ...esquina([-38, 45], 14, Math.PI / 2, Math.PI), [-52, 45],
];
const ASA_FUERA: P[] = [[50, -38], [76, -37], [89, -22], [91, 4], [83, 24], [64, 31], [50, 30]];
const ASA_DENTRO: P[] = [[50, 16], [64, 17], [74, 10], [77, -6], [72, -20], [62, -25], [50, -24]];
export type PiezasTaza = {cuerpo: P[]; asa: P[]; asaFuera: P[]; asaDentro: P[]; cafe: [P, P]; borde: [P, P]; eje: [P, P]; boca: P};
export const piezasTaza = (tz: {c: P; ang: number}): PiezasTaza => {
  const w = (q: P) => suma(tz.c, rot(q, tz.ang));
  return {
    cuerpo: CUERPO_TAZA.map(w),
    asa: [...ASA_FUERA, ...ASA_DENTRO].map(w),
    asaFuera: ASA_FUERA.map(w),
    asaDentro: ASA_DENTRO.map(w),
    cafe: [w([-47, -45]), w([47, -45])],
    borde: [w([-52, -59]), w([52, -59])],
    eje: [w([0, -95]), w([0, 85])],
    boca: w([0, -56]),
  };
};

// ---------------------------------------------------------------- la taza rota: seis trozos que saltan, rebotan y se quedan
const TROZOS_LOCAL: P[][] = [
  [[-52, -59], [-6, -59], [-15, -20], [-52, -8]],
  [[-6, -59], [52, -59], [52, -22], [18, -12], [-15, -20]],
  [[-52, -8], [-15, -20], [0, 18], [-52, 30]],
  [[-15, -20], [18, -12], [52, -22], [52, 26], [0, 18]],
  [[-52, 30], [0, 18], [52, 26], [52, 45], [38, 59], [-38, 59], [-52, 45]],
  [...ASA_FUERA, ...ASA_DENTRO],
];
const centroide = (pts: P[]): P => por(pts.reduce((a, b) => suma(a, b), [0, 0] as P), 1 / pts.length);
const GS = 7000; // los trozos, más ligeros que la taza para que su salto se lea

type TrozoFisica = {p0: P; v0: P; w: number; ang0: number; suelo: number; forma: P[]; centro: P; n: number};
const TROZOS_FISICA: TrozoFisica[] = (() => {
  const r = rng(41);
  // a dónde sale cada uno (para que se repartan a los dos lados y no se vayan de la hoja)
  const salidas: [number, number][] = [[-330, 820], [200, 1000], [-520, 560], [300, 700], [-160, 420], [380, 900]];
  return TROZOS_LOCAL.map((forma, i) => {
    const cl = centroide(forma);
    const p0 = suma(IMPACTO, rot(cl, ANG_IMPACTO));
    const prof = -6 + r() * 26;
    const [vx, vy] = salidas[i];
    return {
      p0: [p0[0], Math.min(p0[1], SUELO + prof - 14)], v0: [vx + (r() - 0.5) * 80, -vy], w: (r() < 0.5 ? -1 : 1) * (7 + r() * 8),
      ang0: ANG_IMPACTO, suelo: SUELO + prof - 8, forma: forma.map((q) => resta(q, cl)), centro: cl, n: i + 1,
    };
  });
})();

export type Trozo = {pts: P[]; c: P; ang: number; n: number; quieto: number /* 0 vuela … 1 en reposo */};
export const trozos = (t: number): Trozo[] => {
  if (t < T_SUELO) return [];
  const tau = t - T_SUELO;
  return TROZOS_FISICA.map((f) => {
    // vuelo 1: hasta tocar el suelo
    const t1 = (-f.v0[1] + Math.sqrt(f.v0[1] ** 2 + 2 * GS * (f.suelo - f.p0[1]))) / GS;
    let c: P;
    let ang: number;
    let quieto = 0;
    if (tau < t1) {
      c = [f.p0[0] + f.v0[0] * tau, f.p0[1] + f.v0[1] * tau + 0.5 * GS * tau * tau];
      ang = f.ang0 + f.w * tau;
    } else {
      const x1 = f.p0[0] + f.v0[0] * t1;
      const vy1 = -0.32 * (f.v0[1] + GS * t1);
      const vx1 = f.v0[0] * 0.5;
      const t2 = (-2 * vy1) / GS; // el rebote
      const a1 = f.ang0 + f.w * t1;
      const s = tau - t1;
      if (s < t2) {
        c = [x1 + vx1 * s, f.suelo + vy1 * s + 0.5 * GS * s * s];
        ang = a1 + f.w * 0.45 * s;
      } else {
        const x2 = x1 + vx1 * t2;
        const a2 = a1 + f.w * 0.45 * t2;
        const u = Math.min(s - t2, 0.16); // y se arrastra hasta pararse
        c = [x2 + vx1 * 0.6 * u * (1 - u / 0.32), f.suelo];
        ang = a2 + f.w * 0.15 * u * (1 - u / 0.32);
        quieto = clamp((s - t2) / 0.16);
      }
    }
    return {pts: f.forma.map((q) => suma(c, rot(q, ang))), c, ang, n: f.n, quieto};
  });
};

// ---------------------------------------------------------------- el café: el arco que sale de la taza, el charco y las manchas
export type Gota = {c: P; r: number; i: number};
export type Mancha = {c: P; rx: number; ry: number; t0: number; i: number};
type GotaFisica = {t0: number; p0: P; v: P; r: number; suelo: number; g: number; i: number};
const GOTAS: GotaFisica[] = (() => {
  const r = rng(77);
  const out: GotaFisica[] = [];
  // el chorro: sale por la boca mientras la taza gira y cae más despacio que ella (dibujo, no física), así se queda atrás en arco
  const N = 38;
  for (let i = 0; i < N; i++) {
    const t0 = 2.76 + 0.27 * (i / (N - 1)) ** 0.9 + r() * 0.008;
    if (t0 >= T_SUELO - 0.005) { r(); r(); r(); r(); continue; }
    const tz = taza(t0);
    const boca = suma(tz.c, rot([(r() - 0.5) * 70, -54], tz.ang));
    const sale = rot([0, -1], tz.ang);
    const lado = rot([1, 0], tz.ang);
    const v = suma(suma(por(vTaza(t0), 0.75), por(sale, 200 + r() * 160)), por(lado, (r() - 0.5) * 120));
    out.push({t0, p0: boca, v, r: mix(16, 7, i / N) + r() * 4, suelo: SUELO - 6 + r() * 26, g: G * 0.42, i});
  }
  // la salpicadura al romperse: una corona que sube y cae
  for (let i = 0; i < 18; i++) {
    const lado = i % 2 === 0 ? -1 : 1;
    const v: P = [lado * (lado < 0 ? 120 + r() * 380 : 60 + r() * 220), -(520 + r() * 900)];
    out.push({t0: T_SUELO + r() * 0.05, p0: [IMPACTO[0] + lado * r() * 30, SUELO - 22], v, r: 6 + r() * 8, suelo: SUELO - 8 + r() * 30, g: GS * 0.85, i: 100 + i});
  }
  return out;
})();
const aterriza = (g: GotaFisica) => (-g.v[1] + Math.sqrt(g.v[1] ** 2 + 2 * g.g * (g.suelo - g.p0[1]))) / g.g;

export const CHARCO_T = T_SUELO;
export type Cafe = {gotas: Gota[]; manchas: Mancha[]; charco: Elipse | null};
export const cafe = (t: number): Cafe => {
  const gotas: Gota[] = [];
  const manchas: Mancha[] = [];
  for (const g of GOTAS) {
    if (t < g.t0) continue;
    const tl = aterriza(g);
    const s = t - g.t0;
    if (s < tl) {
      gotas.push({c: [g.p0[0] + g.v[0] * s, g.p0[1] + g.v[1] * s + 0.5 * g.g * s * s], r: g.r, i: g.i});
    } else {
      const x = g.p0[0] + g.v[0] * tl;
      const k = E.outCubic(clamp((s - tl) / 0.12));
      manchas.push({c: [x, g.suelo], rx: g.r * (1 + 1.4 * k), ry: g.r * 0.42 * (0.6 + 0.4 * k), t0: g.t0 + tl, i: g.i});
    }
  }
  const k = p(t, T_SUELO, 0.5);
  const charco = k > 0 ? {c: [IMPACTO[0] + 4, SUELO + 6] as P, rx: 40 + 120 * E.outCubic(k), ry: 8 + 10 * E.outCubic(k), ang: 0} : null;
  return {gotas, manchas, charco};
};

// ---------------------------------------------------------------- el vapor: tres hilos que suben de la taza (y luego del charco)
export type Hilo = {pts: P[]; alfa: number};
export const vapor = (t: number): Hilo[] => {
  const out: Hilo[] = [];
  const hilo = (base: P, fase: number, alto: number, alfa: number, tt: number, ancho = 1) => {
    const pts: P[] = [];
    for (let j = 0; j <= 14; j++) {
      const h = (j / 14) * alto;
      const x = base[0] + Math.sin(h * 0.022 - tt * 2.6 + fase) * (3 + h * 0.09) * ancho + ruido(h * 0.01 + tt * 0.5, fase * 10) * 8;
      pts.push([x, base[1] - h]);
    }
    out.push({pts, alfa});
  };
  if (t < T_CAE + 0.25) {
    // mientras está en la mesa; al caer, el vapor se queda donde estaba y se deshace
    const tq = Math.min(t, T_CAE);
    const tz = taza(tq);
    const va = 1 - p(t, T_CAE, 0.25);
    const sube = Math.max(0, t - T_CAE) * 160;
    [-24, 2, 26].forEach((dx, i) => hilo([tz.c[0] + dx, tz.c[1] - 64 - sube], i * 2.1, 190 + i * 25 - (i === 1 ? -30 : 0), va * (0.9 - i * 0.1), tq, 1));
  }
  if (t > T_SUELO + 0.15) {
    // del charco, que se enfría: hilos que crecen y se van apagando
    const k = E.outCubic(p(t, T_SUELO + 0.15, 0.7));
    const va = k * (1 - p(t, 4.6, 1.4) * 0.65);
    [-90, 0, 95].forEach((dx, i) => hilo([IMPACTO[0] + 4 + dx * 0.8, SUELO - 4], 1 + i * 1.7, (150 + i * 30) * k, va * (0.85 - i * 0.12), t, 1.3));
  }
  return out;
};

// ---------------------------------------------------------------- el gato
export type Oreja = {base: [P, P]; punta: P; dentro: [P, P, P]; bc: P};
export type Ojo = {c: P; rx: number; ry: number; ang: number; visible: P[]; cerrado: boolean; arco: P[]; pupila: Elipse; brillo: P};
export type Pata = {hombro: P; codo: P; mano: P; pie: Elipse};
export type Gato = {
  cadera: Elipse; torso: Elipse; pecho: Elipse; barriga: Elipse; cuello: [P, P]; pieTrasero: Elipse;
  cabeza: Elipse; hocico: Elipse; giro: number; inclina: number;
  orejaLejos: Oreja; orejaCerca: Oreja; ojoLejos: Ojo; ojoCerca: Ojo;
  nariz: P[]; boca: P[]; surco: [P, P]; bigotes: [P, P, P][]; lengua: Elipse | null;
  pataLejos: Pata; pataCerca: Pata;
  cola: {pts: P[]; r: number[]};
  mira: 'taza' | 'camara' | 'abajo' | 'pata'; // a dónde mira (para los rótulos)
  objetivo: P; // el punto que mira, cuando no es la cámara
};

const PIVOTE: P = [300, MESA_Y]; // se inclina desde aquí (donde se sienta)
// El gato se calcula a su tamaño de dibujo y se pinta 1,14 veces más grande desde donde se sienta (cada estilo lo envuelve en
// TRANSFORMA_GATO). Lo que toca el mundo (la taza, la mesa) se pasa a sus medidas con aGato, y sus puntos al mundo con enMundo.
export const ESCALA_GATO = 1.14;
export const TRANSFORMA_GATO = `translate(${PIVOTE[0]} ${PIVOTE[1]}) scale(${ESCALA_GATO}) translate(${-PIVOTE[0]} ${-PIVOTE[1]})`;
export const enMundo = (q: P): P => suma(PIVOTE, por(resta(q, PIVOTE), ESCALA_GATO));
const aGato = (q: P): P => suma(PIVOTE, por(resta(q, PIVOTE), 1 / ESCALA_GATO));

// la inclinación del cuerpo, en grados: hacia la taza al empujar, MUCHO al asomarse, y se recoge para lamerse
const LEAN: Clave[] = [
  [0, 0], [1.1, 0], [1.3, 4], [1.42, 6], [1.56, 4], [1.67, 5], [1.81, 7], [1.96, 5], [2.3, 6], [2.7, 10], [2.84, 11], [3.15, 7],
  [3.28, 8], [3.66, 27, E.outBack], [4.08, 27], [4.42, 0], [4.98, -2], [5.2, -4],
];
// de lado (0) o de frente, a cámara (1)
const GIRO: Clave[] = [
  [0, 0], [0.4, 0], [0.6, 1], [1.0, 1], [1.18, 0], [2.16, 0], [2.34, 1], [2.8, 1], [2.96, 0], [4.08, 0], [4.3, 1], [4.98, 1], [5.16, 0.32],
];
// la cabeza en el plano, en grados (+ = hacia abajo, hacia delante)
const INCLINA: Clave[] = [
  [0, 14], [0.4, 14], [0.6, -2], [0.78, -9], [1.0, -9], [1.18, 17], [2.16, 17], [2.34, 0], [2.48, -9], [2.8, -9], [2.96, 27],
  [3.12, 31], [3.28, 31], [3.66, 44], [3.84, 33], [4.0, 40], [4.1, 40], [4.3, -2], [4.46, -11], [4.98, -11], [5.16, 24],
];
const PARPADO: Clave[] = [
  [0, 0.1], [0.58, 0.1], [0.76, 0.5], [1.0, 0.5], [1.14, 0.06], [1.56, 0.06], [1.6, 1, E.lin], [1.67, 0.06, E.lin], [2.2, 0.06],
  [2.4, 0.52], [2.74, 0.52], [2.79, 0, E.lin], [4.18, 0.04], [4.36, 0.55], [4.58, 0.55], [4.72, 1], [4.86, 1], [5.0, 0.55],
  [5.12, 0.97],
];
const PICARDIA: Clave[] = [[0, 0], [0.58, 0], [0.76, 1], [1.0, 1], [1.14, 0], [2.2, 0], [2.4, 1], [2.76, 1], [2.8, 0, E.lin], [4.18, 0], [4.36, 0.5]];
const DILATA: Clave[] = [
  [0, 0.35], [0.6, 0.35], [0.76, 0.08], [1.0, 0.08], [1.2, 0.55], [2.2, 0.55], [2.38, 0.06], [2.74, 0.06], [2.82, 0.75, E.outCubic],
  [3.12, 1], [3.8, 0.85], [4.18, 0.85], [4.4, 0.18],
];
const MIRA_X: Clave[] = [
  [0, 0.6], [0.4, 0.6], [0.54, 0], [1.04, 0], [1.16, 0.6], [2.18, 0.6], [2.3, 0], [2.74, 0], [2.79, 0.25, E.outCubic], [3.0, 0.15],
  [4.1, 0.15], [4.24, 0], [5.0, 0], [5.12, 0.3],
];
const MIRA_Y: Clave[] = [
  [0, 0.3], [0.4, 0.3], [0.54, 0], [1.04, 0], [1.16, 0.45], [2.18, 0.45], [2.3, 0], [2.74, 0], [2.79, 0.95, E.outCubic], [3.0, 0.8],
  [3.2, 0.7], [4.1, 0.7], [4.24, 0], [5.0, 0], [5.12, 0.6],
];
const SONRISA: Clave[] = [[0, 0], [0.7, 0], [0.82, 1], [1.0, 1], [1.12, 0], [2.36, 0], [2.5, 1], [2.78, 1], [2.86, 0], [4.3, 0], [4.46, 1], [4.98, 1], [5.1, 0.4]];

// la pata de este lado: dos toquecitos, el empujón mirando a cámara, se queda en el aire, se asoma y se la lame
const PATA_X: Clave[] = [
  [0, 482], [1.12, 482], [1.22, 506], [1.31, 529], [1.43, 551, E.outCubic], [1.56, 512], [1.67, 551], [1.81, 577, E.outCubic],
  [1.96, 540], [2.28, 545], [2.38, 577], [T_CAE, 655, E.lin], [2.84, 690, E.outCubic], [3.16, 688], [3.42, 612], [4.12, 612],
  [4.34, 482], [6, 482],
];
const PATA_Y: Clave[] = [
  [0, 990], [1.12, 990], [1.22, 916], [1.31, 944], [1.43, 944], [1.56, 918], [1.67, 944], [1.81, 944], [1.96, 916], [2.28, 920],
  [2.38, 946], [T_CAE, 946, E.lin], [2.84, 962, E.outCubic], [3.16, 940], [3.3, 930], [3.42, 990], [4.12, 990], [4.22, 950],
  [4.34, 990], [6, 990],
];
// la otra pata solo da un paso para asomarse y otro para volver
const pasoOtra = (t: number): P => {
  const x = kv(t, [[0, 452], [3.3, 452], [3.5, 600], [4.18, 600], [4.38, 452]]);
  const alza = 28 * Math.sin(Math.PI * p(t, 3.3, 0.2)) + 28 * Math.sin(Math.PI * p(t, 4.18, 0.2));
  return [x, 990 - alza];
};

const L1 = 102, L2 = 96; // casi recta al estar sentado, como la de un gato
const pata = (hombro: P, mano0: P): Pata => {
  let d = resta(mano0, hombro);
  const dist = largo(d);
  if (dist > L1 + L2 - 1) d = por(d, (L1 + L2 - 1) / dist);
  const mano = suma(hombro, d);
  const dd = clamp(largo(d), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5);
  const a = Math.acos(clamp((L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd), -1, 1));
  const base = Math.atan2(d[1], d[0]);
  const k1: P = [hombro[0] + L1 * Math.cos(base - a), hombro[1] + L1 * Math.sin(base - a)];
  const k2: P = [hombro[0] + L1 * Math.cos(base + a), hombro[1] + L1 * Math.sin(base + a)];
  const codo = k1[0] < k2[0] ? k1 : k2; // el codo, hacia atrás
  const u = resta(mano, codo);
  const angPie = Math.atan2(u[1], u[0]) - Math.PI / 2;
  return {hombro, codo, mano, pie: {c: suma(mano, rot([9, 4], angPie)), rx: 31, ry: 15, ang: angPie}};
};

// recorta un polígono por debajo de una recta (lo que tapa el párpado)
const recorta = (pts: P[], por: (q: P) => number): P[] => {
  const out: P[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const fa = por(a), fb = por(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) {
      const k = fa / (fa - fb);
      out.push(mixP(a, b, k));
    }
  }
  return out;
};

export const gato = (t: number): Gato => {
  const lam = kv(t, LEAN) * RAD + 0.007 * Math.sin((2 * Math.PI * t) / 1.6);
  const resp = 1 + 0.013 * Math.sin((2 * Math.PI * t) / 1.6); // respira
  const g = clamp(kv(t, GIRO));
  // el lametón: tres pasadas de lengua, con la cabeza que acompaña
  const uL = (t - 5.2) / 0.3;
  const lame = t > 5.2 && uL < 3 ? Math.sin(Math.PI * (uL % 1)) ** 2 : 0;
  const th = (kv(t, INCLINA) + 7 * lame) * RAD;

  const cadera: Elipse = {c: giraEn([300, 905], PIVOTE, lam * 0.2), rx: 122, ry: 103, ang: -0.12 + lam * 0.2};
  const torso: Elipse = {c: giraEn([368, 802], PIVOTE, lam * 0.62), rx: 95, ry: 168 * resp, ang: 0.42 + lam * 0.62};
  const pecho: Elipse = {c: giraEn([448, 794], PIVOTE, lam), rx: 74 * resp, ry: 112, ang: 0.16 + lam};
  const pieTrasero: Elipse = {c: giraEn([394, 992], PIVOTE, lam * 0.05), rx: 54, ry: 17, ang: 0};
  const barriga: Elipse = {c: giraEn([402, 948], PIVOTE, lam * 0.4), rx: 74, ry: 48, ang: 0.1 + lam * 0.4};

  // la cabeza: sigue al cuerpo y tiembla un poco (está viva)
  const H = suma(giraEn([492, 588], PIVOTE, lam), [3 * ruido(t * 0.9, 3) + 6 * lame, 2.5 * ruido(t * 0.8, 5) + 10 * lame]);
  const cabeza: Elipse = {c: H, rx: mix(110, 116, g), ry: 96, ang: th};
  const enCab = (q: P): P => suma(H, rot(q, th));
  const L = (a: P, b: P): P => enCab(mixP(a, b, g)); // de lado → de frente
  const topePecho = suma(pecho.c, rot([4, -pecho.ry * 0.78], pecho.ang));
  const cuello: [P, P] = [topePecho, suma(H, [-6, 30])];

  // las orejas: de lado y de frente, con sus tics (uno al tramar, las dos hacia atrás al romperse, otro al lamerse)
  const tic = (t0: number) => pulso(t, t0, 0.06, 0.22);
  const atras = pulso(t, T_SUELO, 0.07, 0.35);
  const oreja = (bc34: P, pt34: P, bcF: P, ptF: P, hw34: number, giroExtra: number): Oreja => {
    const bcL = mixP(bc34, bcF, g);
    const ptL = suma(bcL, rot(resta(mixP(pt34, ptF, g), bcL), giroExtra));
    const hw = mix(hw34, 40, g);
    const ax = resta(ptL, bcL);
    const n = por([-ax[1], ax[0]], 1 / Math.max(1, largo(ax)));
    const b1L = suma(bcL, por(n, hw)), b2L = suma(bcL, por(n, -hw));
    return {
      base: [enCab(b1L), enCab(b2L)], punta: enCab(ptL), bc: enCab(bcL),
      dentro: [enCab(mixP(mixP(b1L, ptL, 0.12), bcL, 0.4)), enCab(mixP(bcL, ptL, 0.8)), enCab(mixP(mixP(b2L, ptL, 0.12), bcL, 0.4))],
    };
  };
  const orejaCerca = oreja([-50, -66], [-80, -170], [-62, -62], [-98, -160], 40, -0.32 * tic(0.84) - 0.55 * atras - 0.25 * tic(5.55));
  const orejaLejos = oreja([40, -80], [60, -172], [62, -62], [98, -160], 30, 0.5 * atras + 0.3 * tic(1.62));

  // los ojos: rendija o redondos, el párpado de «lo voy a hacer» (con su inclinación) y la mirada que va delante de la cabeza
  const parpado = kv(t, PARPADO);
  const pic = kv(t, PICARDIA);
  const dil = clamp(kv(t, DILATA));
  const mx = kv(t, MIRA_X), my = kv(t, MIRA_Y);
  const ojo = (c34: P, cF: P, rx34: number, rxF: number, lado: number): Ojo => {
    const rx = mix(rx34, rxF, g), ry = mix(30, 31, g);
    const cl = mixP(c34, cF, g);
    const c = enCab(cl);
    const borde: P[] = Array.from({length: 28}, (_, i) => {
      const a = (i / 28) * Math.PI * 2;
      return [Math.cos(a) * rx, Math.sin(a) * ry] as P;
    });
    const linea = (q: P) => q[1] - (-ry + 2 * ry * Math.min(parpado, 0.92) + lado * pic * 0.42 * ry * (q[0] / rx));
    const visible = recorta(borde, linea).map((q) => suma(c, rot(q, th)));
    const cerrado = parpado > 0.93;
    const arco: P[] = [-1, -0.5, 0, 0.5, 1].map((k) => suma(c, rot([k * rx, ry * (0.12 - 0.42 * (1 - k * k))], th)));
    const pc: P = [mx * 0.36 * rx, my * 0.3 * ry];
    const prx = mix(3.6, rx * 0.64, dil), pry = ry * 0.8;
    return {
      c, rx, ry, ang: th, visible, cerrado, arco,
      pupila: {c: suma(c, rot(pc, th)), rx: prx, ry: pry, ang: th},
      brillo: suma(c, rot(suma(pc, [-0.3 * prx - 3, -0.42 * pry]), th)),
    };
  };
  const ojoCerca = ojo([18, -10], [-40, -10], 27, 29, 1);
  const ojoLejos = ojo([84, -14], [40, -10], 17, 29, -1);

  const hocico: Elipse = {c: L([80, 30], [0, 33]), rx: mix(40, 50, g), ry: 30, ang: th};
  const nariz = ([[[104, 10], [-11, 14]], [[119, 12], [11, 14]], [[113, 23], [0, 25]]] as [P, P][]).map(([a, b]) => L(a, b));
  const sm = kv(t, SONRISA);
  const boca: P[] = ([
    [[86, 40 - 8 * sm], [-26, 42 - 8 * sm]], [[97, 46 - 3 * sm], [-12, 49 - 3 * sm]], [[109, 36], [0, 37]],
    [[114, 44], [12, 49 - 3 * sm]], [[118, 41], [26, 42 - 8 * sm]],
  ] as [P, P][]).map(([a, b]) => L(a, b));
  const surco: [P, P] = [L([113, 23], [0, 25]), L([109, 36], [0, 37])];
  const bigotes: [P, P, P][] = [];
  for (let j = 0; j < 3; j++) {
    const s34R: P = [104, 29 + 6 * j], e34R: P = [228, 8 + 26 * j], sFR: P = [34, 30 + 7 * j], eFR: P = [168, 4 + 28 * j];
    const s34L: P = [68, 35 + 6 * j], e34L: P = [180, 40 + 28 * j], sFL: P = [-34, 30 + 7 * j], eFL: P = [-168, 4 + 28 * j];
    const vib = 2 * Math.sin(t * 7 + j); // se mueven con el hocico
    for (const [s0, s1, e0, e1] of [[s34R, sFR, e34R, eFR], [s34L, sFL, e34L, eFL]] as [P, P, P, P][]) {
      const s = mixP(s0, s1, g), e = suma(mixP(e0, e1, g), [0, vib]);
      const m = suma(mixP(s, e, 0.5), [0, -7]);
      bigotes.push([L(s, s), L(m, m), L(e, e)]);
    }
  }
  const lengua = lame > 0.05 ? {c: L([104, 50 + 6 * lame], [0, 52 + 6 * lame]), rx: 11, ry: 5 + 9 * lame, ang: th + 0.3} : null;

  // las patas de delante
  const hombroCerca = giraEn([458, 806], PIVOTE, lam);
  const hombroLejos = giraEn([430, 798], PIVOTE, lam);
  let mano: P = aGato([kv(t, PATA_X), kv(t, PATA_Y)]);
  if (t > 1.96 && t < 2.28) mano = suma(mano, [0, 5 * Math.sin((t - 1.96) * 2 * Math.PI * 4)]); // «pruebo, pruebo»
  const wLame = kv(t, [[4.95, 0], [5.15, 1]]);
  if (wLame > 0) mano = mixP(mano, suma(hocico.c, suma(rot([-10, 46], th), [0, -10 * lame])), wLame);
  const pataCerca = pata(hombroCerca, mano);
  const pataLejos = pata(hombroLejos, aGato(pasoOtra(t)));

  // la cola: sube por detrás y hace el gancho de interrogación; ola continua, tic nervioso al tramar y vaivén feliz al final
  const base = giraEn([232, 978], PIVOTE, lam * 0.2);
  const nervio = Math.max(pulso(t, 0.66, 0.1, 0.4), kv(t, [[2.2, 0], [2.36, 1], [2.72, 1], [2.9, 0]]));
  const feliz = kv(t, [[0, 1], [3.3, 1], [3.8, 1.5], [6, 1.5]]);
  const N = 16, LS = 27;
  const pts: P[] = [base];
  const r: number[] = [];
  let a = Math.PI + 1.22 + 0.13 * Math.sin(2 * Math.PI * 0.42 * t) - 0.06 * lam;
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1);
    const curva = i < 6 ? 0.06 : 0.085;
    const ola = (0.025 + 0.085 * s) * Math.sin(2 * Math.PI * 0.72 * t - 0.5 * i) * feliz;
    const ticCola = s > 0.55 ? 0.22 * ((s - 0.55) / 0.45) * Math.sin(2 * Math.PI * 3.4 * t) * nervio : 0;
    a += curva + ola + ticCola;
    pts.push(suma(pts[i], [Math.cos(a) * LS, Math.sin(a) * LS]));
  }
  for (let i = 0; i <= N; i++) r.push(mix(22, 12, i / N));

  const mira: Gato['mira'] = wLame > 0.5 ? 'pata' : g > 0.5 ? 'camara' : t > T_CAE + 0.1 ? 'abajo' : 'taza';
  const objetivo: P = t < T_CAE + 0.1 ? taza(t).c : t < T_SUELO ? taza(t).c : [IMPACTO[0] + 10, SUELO - 10];

  return {
    cadera, torso, pecho, barriga, cuello, pieTrasero, cabeza, hocico, giro: g, inclina: th, orejaLejos, orejaCerca, ojoLejos, ojoCerca,
    nariz, boca, surco, bigotes, lengua, pataLejos, pataCerca, cola: {pts, r}, mira, objetivo,
  };
};

// ---------------------------------------------------------------- de pieza a trazo SVG
const f1 = (n: number) => n.toFixed(1);
export const poli = (pts: P[], cerrar = true) => 'M ' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L ') + (cerrar ? ' Z' : '');
export const elipse = (e: Elipse) => {
  const a = suma(e.c, rot([-e.rx, 0], e.ang)), b = suma(e.c, rot([e.rx, 0], e.ang));
  const g = (e.ang / RAD).toFixed(2);
  return `M ${f1(a[0])} ${f1(a[1])} A ${f1(e.rx)} ${f1(e.ry)} ${g} 1 0 ${f1(b[0])} ${f1(b[1])} A ${f1(e.rx)} ${f1(e.ry)} ${g} 1 0 ${f1(a[0])} ${f1(a[1])} Z`;
};
// un trozo de elipse (de a0 a a1, en radianes del propio dibujo de la elipse)
export const arcoElipse = (e: Elipse, a0: number, a1: number, n = 16): P[] =>
  Array.from({length: n + 1}, (_, i) => {
    const a = mix(a0, a1, i / n);
    return suma(e.c, rot([Math.cos(a) * e.rx, Math.sin(a) * e.ry], e.ang));
  });
// una curva suave que pasa por los puntos
export const curva = (pts: P[], cerrar = false) => {
  if (pts.length < 3) return poli(pts, cerrar);
  const n = pts.length;
  const at = (i: number) => (cerrar ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  let d = `M ${f1(pts[0][0])} ${f1(pts[0][1])}`;
  const fin = cerrar ? n : n - 1;
  for (let i = 0; i < fin; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + (cerrar ? ' Z' : '');
};
// la cola: una cinta que adelgaza, con la punta redonda
export const cinta = (pts: P[], r: number[]) => {
  const izq: P[] = [], der: P[] = [];
  pts.forEach((q, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const u = resta(b, a);
    const n = por([-u[1], u[0]], 1 / Math.max(1e-3, largo(u)));
    izq.push(suma(q, por(n, r[i])));
    der.push(suma(q, por(n, -r[i])));
  });
  const fin = pts[pts.length - 1], rf = r[r.length - 1];
  const ultimo = resta(fin, pts[pts.length - 2]);
  const punta = suma(fin, por(ultimo, rf / Math.max(1e-3, largo(ultimo))));
  return curva([...izq, punta, ...der.reverse()], true);
};
export const oreja = (o: Oreja) => {
  const [b1, b2] = o.base;
  const ax = resta(o.punta, o.bc);
  const n = por([-ax[1], ax[0]], 1 / Math.max(1, largo(ax)));
  const c1 = suma(mixP(b1, o.punta, 0.55), por(n, 10));
  const c2 = suma(mixP(b2, o.punta, 0.55), por(n, -10));
  return `M ${f1(b1[0])} ${f1(b1[1])} Q ${f1(c1[0])} ${f1(c1[1])} ${f1(o.punta[0])} ${f1(o.punta[1])} Q ${f1(c2[0])} ${f1(c2[1])} ${f1(b2[0])} ${f1(b2[1])} Z`;
};
export const pataTrazos = (pt: Pata): string[] => [
  capsula(pt.hombro, pt.codo, 32, 23),
  capsula(pt.codo, pt.mano, 23, 18),
  elipse(pt.pie),
];
// la silueta del cuerpo (sin cabeza): se pintan juntas para que se lea una sola forma
export const cuerpoTrazos = (g: Gato): string[] => [
  elipse(g.cadera), elipse(g.torso), elipse(g.pecho), elipse(g.barriga), capsula(g.cuello[0], g.cuello[1], 62, 58), elipse(g.pieTrasero),
];
export const cabezaTrazos = (g: Gato): string[] => [elipse(g.cabeza), elipse(g.hocico)];
export const ojoTrazo = (o: Ojo) => poli(o.visible);
export const bigote = (b: [P, P, P]) => `M ${f1(b[0][0])} ${f1(b[0][1])} Q ${f1(b[1][0])} ${f1(b[1][1])} ${f1(b[2][0])} ${f1(b[2][1])}`;
