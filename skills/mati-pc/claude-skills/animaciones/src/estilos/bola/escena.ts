import {E, clamp, mix} from '../../comun/curvas';

// LA ESCENA DE LA BOLA DE PAPEL. Un muñeco de bloques, sentado en su
// silla de oficina junto a su mesa (a la izquierda), acaba de lanzar una bola de papel arrugado a la papelera (en el centro, abajo).
// Cada estilo es un lanzamiento distinto: falla 9 veces y el 10 entra. Él sigue la bola con la cabeza y reacciona al final.
//   0 rebota en el borde y sale · 1 se queda corta · 2 se pasa, pega en la pared y cae detrás · 3 da vueltas en el borde y cae fuera
//   4 entra y sale de un bote · 5 pega en el borde y vuelve hacia él · 6 bota en el suelo y pasa por el lado · 7 choca con la lámpara
//   8 se queda quieta en el borde un instante… y cae fuera · 9 ¡DENTRO!
// Aquí vive lo que pasa, en piezas y sin estilo; cada estilo las pinta a su manera. Todo sale del tiempo t (el mismo segundo da
// siempre el mismo cuadro) y de una física de verdad: parábolas con su gravedad, botes que pierden energía contra cada superficie
// (el suelo, el borde de la papelera como un aro, su pared, la pared de la derecha), la bola que rueda por el borde (3) y la que se
// queda en equilibrio sobre él y se vuelca como un péndulo invertido (8). Se calcula una vez, al cargar, con pasos de 1/2400 s.
// COORDENADAS: las de la pantalla de 1080 × 1920 en el plano de la papelera (z = 0), con la y hacia abajo, y z hacia la cámara.
// Lo que está en z ≠ 0 sale en pantalla con proyecta() (la cámara mira de frente desde la altura CAM_Y, como la plastilina del gato).
// El lanzamiento dura DUR (2 s) y en el vídeo se ve de 0,2 a 1,8 s: la bola ya viene en el aire, toca el borde hacia
// 0,6–0,8 s y el muñeco reacciona al final.

export type P = [number, number];
export type V3 = [number, number, number];

export const DUR = 2.0;
export const VENTANA = {desde: 0.2, hasta: 1.8};
export const N_INTENTOS = 10;

// ---------------------------------------------------------------- la cámara
export const FOV = 30;
export const D = 960 / Math.tan(((FOV / 2) * Math.PI) / 180); // de la cámara al plano z = 0
export const CAM_Y = 300; // a qué altura de la pantalla está (mira un poco desde arriba: se ve la boca de la papelera)
export const CAMARA: V3 = [540, CAM_Y, D];
export const escalaEn = (z: number) => D / (D - z);
export const proyecta = ([x, y, z]: V3): P => {
  const s = escalaEn(z);
  return [540 + (x - 540) * s, CAM_Y + (y - CAM_Y) * s];
};

// ---------------------------------------------------------------- las medidas (en px del plano z = 0)
export const STUD = 64; // de un tetón al siguiente
export const ALTO = 1.2 * STUD; // un ladrillo
export const PLACA = 0.4 * STUD; // una placa
export const SUELO = 1570;
export const Z_PARED = -420; // la pared del fondo
export const MURO_X = 1060; // la pared de la derecha (la del fallo 2)
export const R_BOLA = 44;
export const G = 5600; // px/s²: más lenta que la de verdad a esta escala, para que se lea

export const PAPELERA = {
  x: 650, z: 0,
  yBorde: SUELO - 5 * ALTO, // el centro del aro de arriba (5 ladrillos de alto)
  rBorde: 140, // el radio del aro
  rBase: 116,
  tubo: 14, // el grueso del aro (para los choques)
  pared: 9, // medio grueso de la pared
  yPila: SUELO - 5 * ALTO + 125, // dentro hay papeles de otros días: aquí está su superficie
};
const PB = PAPELERA;

// la lámpara que cuelga del techo (la del fallo 7): el gancho, lo que mide hasta el centro de la pantalla y la pantalla
export const LAMPARA = {x: 470, yGancho: -80, largo: 560, rAbajo: 92, rArriba: 24, alto: 96};
export const centroLampara = (ang: number): P => [LAMPARA.x + LAMPARA.largo * Math.sin(ang), LAMPARA.yGancho + LAMPARA.largo * Math.cos(ang)];

export const MESA = {x0: -60, x1: 250, z0: -250, z1: -30, alto: 4.5 * ALTO}; // la mesa, a su izquierda y un poco detrás
export const SILLA = {x: 225, z: 40, asiento: SUELO - 3 * ALTO};

// el muñeco (en px; sus piezas son de ladrillo: el cuerpo, un bloque de 2 × 2; la cabeza, un ladrillo redondo con su pelo)
export const MUNECO = {
  escala: 1.18, // el muñeco es el protagonista: un pelo más grande que el resto de piezas (todas sus medidas, por esto)
  asiento: [SILLA.x, SILLA.asiento, SILLA.z] as V3,
  cadera: PLACA,
  torso: {an: 126, fondo: 100, alto: 1.5 * ALTO},
  cuello: 14,
  cabeza: {r: 62, alto: 96},
  pelo: PLACA,
  hombro: {x: 88, abajo: 22}, // desde arriba del cuerpo
  brazo: [76, 72] as [number, number], // brazo y antebrazo
  rMano: 22,
  pierna: {x: 32, muslo: 120, espinilla: 130},
};

// ---------------------------------------------------------------- utilidades
const sum = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const res = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const esc = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const pto = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const lar = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const nor = (a: V3): V3 => esc(a, 1 / Math.max(1e-9, lar(a)));
const mixV = (a: V3, b: V3, k: number): V3 => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];

// ---------------------------------------------------------------- la física de la bola
export type TipoGolpe = 'borde' | 'suelo' | 'muro' | 'pared' | 'papelera' | 'pila' | 'lampara';
export type Golpe = {t: number; tipo: TipoGolpe; fuerza: number; n: V3; p: V3};
type Estado = {x: number; y: number; z: number; vx: number; vy: number; vz: number; w: number; wv: number; giro: number; vuelco: number};
type Muestra = {c: V3; giro: number; vuelco: number};
type Op = {eBorde: number; agarreBorde: number; ePila: number; agarrePila?: number; nPila?: V3; pila: boolean; ePapelera?: number; eSuelo?: number; agarreSuelo?: number};
const OP_BASE: Op = {eBorde: 0.5, agarreBorde: 0.6, ePila: 0.2, pila: true};

const PASO = 1 / 2400;
const MUESTRAS = 600; // muestras por segundo que se guardan
const CADA = 2400 / MUESTRAS;

// el radio de dentro de la pared a la altura y
const rPared = (y: number) => mix(PB.rBorde, PB.rBase, clamp((y - PB.yBorde) / (SUELO - 6 - PB.yBorde)));

type Choque = {n: V3; pen: number; tipo: TipoGolpe};
const choques = (q: V3, op: Op): Choque[] => {
  const out: Choque[] = [];
  const r = R_BOLA;
  // el suelo
  if (q[1] + r > SUELO) out.push({n: [0, -1, 0], pen: q[1] + r - SUELO, tipo: 'suelo'});
  // la pared de la derecha y la del fondo
  if (q[0] + r > MURO_X) out.push({n: [-1, 0, 0], pen: q[0] + r - MURO_X, tipo: 'muro'});
  if (q[2] - r < Z_PARED) out.push({n: [0, 0, 1], pen: Z_PARED - (q[2] - r), tipo: 'pared'});
  // la papelera: el aro de arriba (un toro) y su pared (un cono hueco), vistos en el semiplano (radio, y) donde está la bola
  const dx = q[0] - PB.x, dz = q[2] - PB.z;
  const rho = Math.hypot(dx, dz);
  if (rho < PB.rBorde + PB.tubo + r + 4 && q[1] > PB.yBorde - PB.tubo - r - 4) {
    const u: [number, number] = rho > 1e-6 ? [dx / rho, dz / rho] : [1, 0];
    // el aro
    const k: V3 = [PB.x + PB.rBorde * u[0], PB.yBorde, PB.z + PB.rBorde * u[1]];
    const d = res(q, k);
    const dl = lar(d);
    if (dl < r + PB.tubo) out.push({n: esc(d, 1 / dl), pen: r + PB.tubo - dl, tipo: 'borde'});
    // la pared (de debajo del aro hasta el suelo)
    const A: P = [PB.rBorde, PB.yBorde + PB.tubo], B: P = [PB.rBase, SUELO - 6];
    const ab: P = [B[0] - A[0], B[1] - A[1]];
    const s = clamp(((rho - A[0]) * ab[0] + (q[1] - A[1]) * ab[1]) / (ab[0] * ab[0] + ab[1] * ab[1]));
    const cp: P = [A[0] + ab[0] * s, A[1] + ab[1] * s];
    const dd: P = [rho - cp[0], q[1] - cp[1]];
    const dn = Math.hypot(dd[0], dd[1]);
    if (dn < r + PB.pared && dn > 1e-6) {
      out.push({n: [(dd[0] / dn) * u[0], dd[1] / dn, (dd[0] / dn) * u[1]], pen: r + PB.pared - dn, tipo: 'papelera'});
    }
    // los papeles de dentro
    if (op.pila && rho < rPared(PB.yPila) - PB.pared - r * 0.4 && q[1] + r > PB.yPila && q[1] < PB.yPila + 30) {
      out.push({n: op.nPila ?? [0, -1, 0], pen: q[1] + r - PB.yPila, tipo: 'pila'});
    }
  }
  return out;
};

const REST: Record<TipoGolpe, number> = {suelo: 0.42, muro: 0.32, pared: 0.3, papelera: 0.35, borde: 0.5, pila: 0.2, lampara: 0.4};
const AGARRE: Record<TipoGolpe, number> = {suelo: 0.72, muro: 0.6, pared: 0.6, papelera: 0.6, borde: 0.6, pila: 0.5, lampara: 0.6};

// avanza la bola de n0 a n1 pasos, con sus choques; guarda las muestras y los golpes
const simula = (s: Estado, n0: number, n1: number, op: Op, golpes: Golpe[], out: Muestra[]) => {
  for (let n = n0; n < n1; n++) {
    const t = n * PASO;
    s.vy += G * PASO;
    s.x += s.vx * PASO;
    s.y += s.vy * PASO;
    s.z += s.vz * PASO;
    let enSuelo = false;
    for (const c of choques([s.x, s.y, s.z], op)) {
      const v: V3 = [s.vx, s.vy, s.vz];
      const vn = pto(v, c.n);
      if (vn < 0) {
        const vt = res(v, esc(c.n, vn));
        const e = c.tipo === 'borde' ? op.eBorde : c.tipo === 'pila' ? op.ePila : c.tipo === 'papelera' ? (op.ePapelera ?? REST.papelera)
          : c.tipo === 'suelo' ? (op.eSuelo ?? REST.suelo) : REST[c.tipo];
        const ag = c.tipo === 'borde' ? op.agarreBorde : c.tipo === 'pila' ? (op.agarrePila ?? AGARRE.pila) : c.tipo === 'suelo' ? (op.agarreSuelo ?? AGARRE.suelo) : AGARRE[c.tipo];
        const nv = sum(esc(vt, ag), esc(c.n, -vn * e));
        [s.vx, s.vy, s.vz] = nv;
        if (-vn > 140) golpes.push({t, tipo: c.tipo, fuerza: -vn, n: c.n, p: [s.x - c.n[0] * R_BOLA, s.y - c.n[1] * R_BOLA, s.z - c.n[2] * R_BOLA]});
        // el giro: una bola de papel agarra y gira según lo que resbala
        s.w = mix(s.w, (vt[0] * -c.n[1] + vt[1] * c.n[0]) / R_BOLA, 0.7);
        s.wv = mix(s.wv, vt[2] / R_BOLA, 0.7);
      }
      s.x += c.n[0] * c.pen;
      s.y += c.n[1] * c.pen;
      s.z += c.n[2] * c.pen;
      if (c.tipo === 'suelo') enSuelo = true;
    }
    // en el suelo y casi sin bote: rueda y se para (un papel arrugado frena pronto)
    if (enSuelo && Math.abs(s.vy) < 110) {
      s.vy = 0;
      s.y = SUELO - R_BOLA;
      const v = Math.hypot(s.vx, s.vz);
      const k = v > 1e-6 ? Math.max(0, v - 760 * PASO) / v : 0;
      s.vx *= k;
      s.vz *= k;
      s.w = s.vx / R_BOLA;
      s.wv = s.vz / R_BOLA;
    }
    s.giro += s.w * PASO;
    s.vuelco += s.wv * PASO;
    if (n % CADA === 0) out[n / CADA] = {c: [s.x, s.y, s.z], giro: s.giro, vuelco: s.vuelco};
  }
};

// la parábola que sale de a en t = 0 y llega a b en t1
const velocidadPara = (a: V3, b: V3, t1: number): V3 => [(b[0] - a[0]) / t1, (b[1] - a[1]) / t1 - 0.5 * G * t1, (b[2] - a[2]) / t1];

// ---------------------------------------------------------------- los diez lanzamientos
// Cada uno: a dónde y cuándo toca primero (el lanzamiento sale de la mano en t = 0) y cómo rebota. Desde ahí, la física. Los
// especiales llevan su tramo hecho a mano con su física: las vueltas por el aro (3), la lámpara (7) y el equilibrio (8).
export type Plan = {
  nombre: string;
  primero: V3; // dónde está el centro de la bola cuando toca por primera vez
  t1: number; // cuándo
  op?: Partial<Op>;
  especial?: 'vueltas' | 'equilibrio' | 'lampara';
  vueltas?: {phi0: number; w0: number; frena: number; dur: number; cae: number};
  lampara?: {n: V3; z: number};
  equilibrio?: {bote: number; alto: number; vuelca: number; th0: number};
};
// un punto encima del aro: phi, alrededor de la papelera (0 = a la derecha, 90 = hacia la cámara, 180 = el lado del muñeco); el, lo
// alto de la normal en ese punto (90 = justo encima; 0 = hacia fuera; 180 = hacia dentro). En grados.
export const enAro = (phi: number, el: number): V3 => {
  const f = (phi * Math.PI) / 180, e = (el * Math.PI) / 180;
  const d = R_BOLA + PB.tubo;
  const u: V3 = [Math.cos(f), 0, Math.sin(f)];
  return [PB.x + PB.rBorde * u[0] + d * Math.cos(e) * u[0], PB.yBorde - d * Math.sin(e), PB.z + PB.rBorde * u[2] + d * Math.cos(e) * u[2]];
};

// de dónde sale: la mano derecha del muñeco en su postura «lanza» (se calcula más abajo, antes de los trayectos)
export let SUELTA: V3 = [384, 1042, 121];

export const PLANES: Plan[] = [
  {nombre: 'Rebota en el borde y sale', primero: enAro(60, 85), t1: 0.64, op: {eBorde: 0.55, agarreBorde: 0.3}},
  {nombre: 'Se queda corta', primero: [430, SUELO - R_BOLA, 70], t1: 0.6},
  {nombre: 'Se pasa, pega en la pared y cae detrás', primero: [MURO_X - R_BOLA, SUELO - 470, 0], t1: 0.74},
  {nombre: 'Da vueltas en el borde… y cae fuera', primero: [0, 0, 0], t1: 0.56, especial: 'vueltas',
    vueltas: {phi0: Math.PI - 0.62, w0: 12.5, frena: 9.5, dur: 0.7, cae: 0.16}},
  {nombre: 'Entra… y sale de un bote', primero: [615, PB.yPila - R_BOLA, 0], t1: 0.72, op: {ePila: 0.7, agarrePila: 0.25, nPila: nor([0.2, -1, 0])}},
  {nombre: 'Pega en el borde y vuelve hacia él', primero: enAro(160, 80), t1: 0.66, op: {eBorde: 0.5, agarreBorde: 0.15, eSuelo: 0.32}},
  {nombre: 'Bota en el suelo y pasa por el lado', primero: [560, SUELO - R_BOLA, 180], t1: 0.5, op: {eSuelo: 0.58, agarreSuelo: 0.92}},
  {nombre: 'Choca con la lámpara y cae', primero: [0, 0, 0], t1: 0.44, especial: 'lampara', lampara: {n: nor([-0.35, 0.94, 0]), z: 90}},
  {nombre: 'Se queda quieta en el borde… y cae fuera', primero: [PB.x + PB.rBorde + 3, PB.yBorde - R_BOLA - PB.tubo, 0], t1: 0.7,
    especial: 'equilibrio', equilibrio: {bote: 0.1, alto: 15, vuelca: 0.18, th0: 0.035}},
  {nombre: '¡DENTRO!', primero: [640, PB.yPila - R_BOLA, 0], t1: 0.8, op: {ePila: 0.12}},
];
export const NOMBRES = PLANES.map((p) => p.nombre);
export const T_PRIMERO = PLANES.map((p) => p.t1); // cuándo toca por primera vez cada uno (el momento del golpe)

// 7 · la lámpara: la toca por debajo; el radio con el que choca la pantalla (vista de lado) y su péndulo
const LAMP_R = 74;
const LAMP_C0: V3 = [...centroLampara(0), 0] as V3;
const LAMP_W = Math.sqrt(G / LAMPARA.largo);

type Trayecto = {muestras: Muestra[]; golpes: Golpe[]};

const calculaPlan = (plan: Plan): Trayecto => {
  const op: Op = {...OP_BASE, ...(plan.op ?? {})};
  const muestras: Muestra[] = [];
  const golpes: Golpe[] = [];
  const NT = Math.round(DUR * 2400);
  const s: Estado = {x: SUELTA[0], y: SUELTA[1], z: SUELTA[2], vx: 0, vy: 0, vz: 0, w: -9, wv: 1.5, giro: 0, vuelco: 0};
  const vuela = (b: V3, t1: number) => {
    [s.vx, s.vy, s.vz] = velocidadPara(SUELTA, b, t1);
  };
  // un tramo a mano: de n0 a n1, la función da dónde está y cuánto ha girado
  const aMano = (n0: number, n1: number, f: (t: number) => {c: V3; giro: number}) => {
    for (let n = n0; n < n1; n++) {
      if (n % CADA !== 0) continue;
      const q = f(n * PASO);
      muestras[n / CADA] = {c: q.c, giro: q.giro, vuelco: s.vuelco};
    }
  };
  // el golpe del primer toque, si la física no lo apuntó ya
  const apunta = (t: number, fuerza: number, c: V3) => {
    if (!golpes.some((g) => Math.abs(g.t - t) < 0.02)) golpes.push({t, tipo: 'borde', fuerza, n: [0, -1, 0], p: sum(c, [0, R_BOLA, 0])});
  };
  if (!plan.especial) {
    vuela(plan.primero, plan.t1);
    simula(s, 0, NT + CADA, op, golpes, muestras);
    return {muestras, golpes};
  }
  if (plan.especial === 'lampara') {
    const L = plan.lampara!;
    const c: V3 = sum(sum(LAMP_C0, esc(L.n, LAMP_R + R_BOLA)), [0, 0, L.z]);
    vuela(c, plan.t1);
    const n1 = Math.round(plan.t1 * 2400);
    simula(s, 0, n1, {...op, pila: false}, golpes, muestras);
    // el choque con la pantalla
    const v: V3 = [s.vx, s.vy, s.vz];
    const vn = pto(v, L.n);
    const vt = res(v, esc(L.n, vn));
    [s.vx, s.vy, s.vz] = sum(esc(vt, AGARRE.lampara), esc(L.n, -Math.min(vn, -300) * REST.lampara));
    golpes.push({t: plan.t1, tipo: 'lampara', fuerza: Math.max(300, -vn), n: L.n, p: sum(c, esc(L.n, -R_BOLA))});
    s.w = 14;
    simula(s, n1, NT + CADA, op, golpes, muestras);
    return {muestras, golpes};
  }
  if (plan.especial === 'vueltas') {
    // cae en el aro delante a la izquierda y lo recorre por delante, la derecha, detrás y la izquierda hasta volver delante, cada vez
    // más despacio, un poco echada hacia dentro; al final se va resbalando por fuera del aro, hacia la cámara
    const V = plan.vueltas!;
    const d = R_BOLA + PB.tubo;
    const dentro = 12;
    const sitio = (phi: number, tau: number): V3 => {
      // el ángulo de la normal: un pelo hacia dentro mientras corre; al final, resbala hacia fuera (de 103° a 25°)
      const fin = clamp((tau - (V.dur - V.cae)) / V.cae);
      const el = mix(90 + (Math.asin(dentro / d) * 180) / Math.PI, 55, fin * fin);
      const e = (el * Math.PI) / 180;
      const tetones = 3.5 * Math.abs(Math.sin(9 * phi)) * (1 - fin); // bota un poco sobre los tetones del aro
      const u: V3 = [Math.cos(phi), 0, Math.sin(phi)];
      return [PB.x + (PB.rBorde + d * Math.cos(e)) * u[0], PB.yBorde - d * Math.sin(e) - tetones, PB.z + (PB.rBorde + d * Math.cos(e)) * u[2]];
    };
    const c0 = sitio(V.phi0, 0);
    vuela(c0, plan.t1);
    const n1 = Math.round(plan.t1 * 2400);
    simula(s, 0, n1, op, golpes, muestras);
    apunta(plan.t1, 900, c0);
    const g0 = s.giro;
    const phi = (tau: number) => V.phi0 - (V.w0 * tau - 0.5 * V.frena * tau * tau);
    const n2 = Math.round((plan.t1 + V.dur) * 2400);
    aMano(n1, n2, (t) => {
      const tau = t - plan.t1;
      return {c: sitio(phi(tau), tau), giro: g0 + ((V.phi0 - phi(tau)) * PB.rBorde) / R_BOLA};
    });
    // se va: con lo que corría por el aro, un poco hacia fuera y hacia abajo
    const pf = phi(V.dur), wf = V.w0 - V.frena * V.dur;
    const c = sitio(pf, V.dur);
    s.x = c[0]; s.y = c[1]; s.z = c[2];
    s.vx = wf * PB.rBorde * Math.sin(pf) + 220 * Math.cos(pf);
    s.vz = -wf * PB.rBorde * Math.cos(pf) + 220 * Math.sin(pf);
    s.vy = 120;
    s.giro = g0 + ((V.phi0 - phi(V.dur)) * PB.rBorde) / R_BOLA;
    s.w = Math.hypot(s.vx, s.vz) / R_BOLA;
    simula(s, n2, NT + CADA, op, golpes, muestras);
    return {muestras, golpes};
  }
  // el equilibrio: bota un pelo, se queda quieta (con un balanceo que se apaga) y se vuelca hacia fuera como un péndulo invertido
  const Q = plan.equilibrio!;
  const c0 = plan.primero;
  vuela(c0, plan.t1);
  const n1 = Math.round(plan.t1 * 2400);
  simula(s, 0, n1, op, golpes, muestras);
  apunta(plan.t1, 700, c0);
  const centro: V3 = [PB.x + PB.rBorde, PB.yBorde, 0];
  const d = R_BOLA + PB.tubo;
  const th00 = Math.asin(clamp((c0[0] - centro[0]) / d, -1, 1));
  const g0 = s.giro;
  // el vuelco: θ'' = (5g / 7d) sen θ (una bola que rueda sobre un cilindro); se separa cuando cos θ = 10/17
  const k = (5 * G) / (7 * d);
  const tVuelca = plan.t1 + Q.vuelca;
  const vuelco: {t: number; th: number; w: number}[] = [];
  {
    let th = Q.th0, w = 0, t = tVuelca;
    while (Math.cos(th) > 10 / 17 && t < DUR + 0.5) {
      w += k * Math.sin(th) * PASO;
      th += w * PASO;
      t += PASO;
      vuelco.push({t, th, w});
    }
  }
  const tSepara = vuelco[vuelco.length - 1].t;
  const enTubo = (th: number): V3 => [centro[0] + d * Math.sin(th), centro[1] - d * Math.cos(th), 0];
  const n2 = Math.round(tSepara * 2400);
  aMano(n1, n2, (t) => {
    const tau = t - plan.t1;
    if (tau < Q.bote) {
      // un botecito y se asienta encima
      const k2 = tau / Q.bote;
      const th = mix(th00, 0.006, E.outCubic(k2));
      const q = enTubo(th);
      return {c: [q[0], q[1] - Q.alto * Math.sin(Math.PI * k2), 0], giro: g0 + 0.5 * k2};
    }
    if (t < tVuelca) {
      // quieta, con un balanceo que se apaga y llega justo a donde empieza a volcarse
      const u = tau - Q.bote;
      const lleva = clamp(u / Math.max(0.01, Q.vuelca - Q.bote));
      const th = 0.06 * Math.exp(-7 * u) * Math.sin(26 * u) + mix(0.006, Q.th0, E.inCubic(lleva));
      return {c: enTubo(th), giro: g0 + 0.5 + (th * d) / R_BOLA};
    }
    const j = Math.min(vuelco.length - 1, Math.max(0, Math.round((t - tVuelca) / PASO) - 1));
    const th = vuelco[j].th;
    return {c: enTubo(th), giro: g0 + 0.5 + (th * d) / R_BOLA};
  });
  const ult = vuelco[vuelco.length - 1];
  const c = enTubo(ult.th);
  s.x = c[0]; s.y = c[1]; s.z = 0;
  s.vx = d * ult.w * Math.cos(ult.th);
  s.vy = d * ult.w * Math.sin(ult.th);
  s.vz = 25;
  s.giro = g0 + 0.5 + (ult.th * d) / R_BOLA;
  s.w = (d * ult.w) / R_BOLA;
  simula(s, n2, NT + CADA, op, golpes, muestras);
  return {muestras, golpes};
};
const calcula = (i: number) => calculaPlan(PLANES[i]);
// para probar planes sin tocar los de verdad (herramienta de ajuste)
export const _pruebaPlan = (plan: Plan) => calculaPlan(plan);

// ---------------------------------------------------------------- el muñeco: la postura y su esqueleto
// Ángulos en radianes. gira: hacia dónde mira el cuerpo (0 = a la papelera, +x; π/2 = a la cámara). inclina: el cuerpo hacia
// delante (+) o atrás. ladea: de lado. Los brazos: alza (0 = colgando, π/2 = al frente, π = arriba), abre (hacia fuera, de lado),
// codo (dobla el antebrazo hacia delante) y giro (el brazo sobre su eje). La cabeza, respecto al cuerpo: gira (+ hacia su izquierda),
// cabecea (+ mira abajo) y ladea.
export type Brazo = {alza: number; abre: number; codo: number; giro: number};
export type Cara = 'atento' | 'ilusion' | 'tension' | 'ay' | 'fastidio' | 'meh' | 'susto' | 'feliz' | 'serio';
export type Pose = {
  base: V3; gira: number; inclina: number; ladea: number; salto: number;
  cabeza: {gira: number; cabecea: number; ladea: number};
  der: Brazo; izq: Brazo; patada: number;
  cara: Cara;
  ojos: P; // hacia dónde miran las pupilas, de −1 a 1 (x: + hacia su izquierda; y: + hacia abajo)
  mira: V3; // el punto que mira
};

type PoseNum = {
  gira: number; inclina: number; ladea: number; salto: number; hg: number; hp: number; hl: number;
  sigue: number; // 1 = la cabeza sigue la bola; 0 = la de la postura
  camara: number; // 1 = mira a la cámara
  der: Brazo; izq: Brazo; patada: number;
};
const B = (alza: number, abre: number, codo: number, giro = 0): Brazo => ({alza, abre, codo, giro});
const base = (o: Partial<PoseNum>): PoseNum => ({
  gira: 0.5, inclina: 0.1, ladea: 0, salto: 0, hg: 0, hp: 0, hl: 0, sigue: 1, camara: 0,
  der: B(0.5, 0.2, 1.0), izq: B(0.5, 0.2, 1.0), patada: 0, ...o,
});
export const POSES = {
  lanza: base({gira: 0.1, inclina: 0.24, ladea: -0.05, der: B(2.25, -0.08, 0.12), izq: B(0.6, 0.35, 1.1), patada: 0.35}),
  mira: base({gira: 0.45, inclina: 0.16, der: B(0.75, 0.22, 1.1), izq: B(0.55, 0.22, 1.2), patada: 0.12}),
  espera: base({gira: 0.52, inclina: 0.42, der: B(1.2, -0.42, 1.95, 0.2), izq: B(1.2, -0.42, 1.95, 0.2)}),
  manoCara: base({gira: 1.1, inclina: 0.12, hg: 0.1, hp: -0.12, hl: -0.12, sigue: 0, der: B(2.42, -0.65, 0.2, 0), izq: B(0.3, 0.2, 0.7)}),
  hombros: base({gira: 1.3, inclina: -0.04, hl: 0.3, sigue: 0, camara: 1, der: B(0.45, 0.85, 1.45, -1.1), izq: B(0.45, 0.85, 1.45, -1.1)}),
  cabeza: base({gira: 1.15, inclina: -0.2, hp: -0.2, sigue: 0, der: B(2.73, 0.56, 1.47, -0.91), izq: B(2.73, 0.56, 1.47, -0.91)}),
  cubre: base({gira: 0.75, inclina: -0.3, hp: 0.25, sigue: 0, der: B(1.63, -0.83, 0.87, 0.87), izq: B(1.63, -0.83, 0.87, 0.87), patada: 0.7}),
  celebra: base({gira: 1.1, inclina: -0.12, hp: -0.15, sigue: 0, camara: 1, der: B(2.95, 0.5, 0.25), izq: B(2.95, 0.5, 0.25), patada: 0.8}),
  camara: base({gira: 1.3, inclina: 0.05, sigue: 0, camara: 1, der: B(0.4, 0.18, 0.9), izq: B(0.4, 0.18, 0.9)}),
  hunde: base({gira: 0.9, inclina: -0.22, hp: 0.28, sigue: 0, der: B(0.05, 0.28, 0.1), izq: B(0.05, 0.28, 0.1)}),
};
type NombrePose = keyof typeof POSES;
// la línea de tiempo de cada intento: [t, postura, cara (la cara cambia de golpe, como las caras de recambio del stop motion)]
type Clave = [number, NombrePose, Cara];
const GUION: Clave[][] = [
  // 0 · rebota en el borde y sale
  [[0, 'lanza', 'atento'], [0.3, 'mira', 'ilusion'], [0.56, 'espera', 'tension'], [0.7, 'espera', 'ay'], [0.95, 'mira', 'ay'], [1.22, 'manoCara', 'fastidio']],
  // 1 · se queda corta
  [[0, 'lanza', 'atento'], [0.3, 'mira', 'ilusion'], [0.55, 'espera', 'tension'], [0.68, 'mira', 'meh'], [1.05, 'hombros', 'meh']],
  // 2 · se pasa, pega en la pared y cae detrás
  [[0, 'lanza', 'atento'], [0.3, 'mira', 'ilusion'], [0.6, 'mira', 'tension'], [0.78, 'mira', 'ay'], [1.06, 'cabeza', 'ay']],
  // 3 · da vueltas en el borde y cae fuera
  [[0, 'lanza', 'atento'], [0.3, 'mira', 'ilusion'], [0.58, 'espera', 'tension'], [1.0, 'espera', 'ilusion'], [1.4, 'espera', 'ay'], [1.58, 'manoCara', 'fastidio']],
  // 4 · entra… y sale de un bote
  [[0, 'lanza', 'atento'], [0.3, 'mira', 'ilusion'], [0.6, 'espera', 'tension'], [0.82, 'celebra', 'feliz'], [0.98, 'cubre', 'ay'], [1.3, 'camara', 'serio']],
  // 5 · pega en el borde y vuelve hacia él
  [[0, 'lanza', 'atento'], [0.3, 'mira', 'ilusion'], [0.55, 'espera', 'tension'], [0.72, 'mira', 'susto'], [0.84, 'cubre', 'susto'], [1.3, 'hombros', 'meh']],
  // 6 · bota en el suelo y pasa por el lado
  [[0, 'lanza', 'atento'], [0.3, 'mira', 'ilusion'], [0.6, 'espera', 'tension'], [0.92, 'mira', 'ay'], [1.18, 'manoCara', 'fastidio']],
  // 7 · choca con la lámpara y cae
  [[0, 'lanza', 'atento'], [0.3, 'mira', 'ilusion'], [0.46, 'mira', 'susto'], [0.56, 'cubre', 'susto'], [1.0, 'mira', 'meh'], [1.3, 'camara', 'serio']],
  // 8 · se queda quieta en el borde… y cae fuera
  [[0, 'lanza', 'atento'], [0.3, 'mira', 'ilusion'], [0.6, 'espera', 'tension'], [0.86, 'espera', 'ilusion'], [1.18, 'espera', 'tension'], [1.42, 'espera', 'ay'], [1.56, 'cabeza', 'ay']],
  // 9 · ¡DENTRO!
  [[0, 'lanza', 'atento'], [0.3, 'mira', 'ilusion'], [0.6, 'espera', 'tension'], [0.86, 'celebra', 'feliz']],
];

// ---- las matrices (como las de three.js; y hacia arriba: el mundo 3D es (x, −y, z) de la pantalla)
type M3 = number[];
const mm = (a: M3, b: M3): M3 => {
  const o: number[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]);
  return o;
};
const ap = (m: M3, v: V3): V3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const apT = (m: M3, v: V3): V3 => [m[0] * v[0] + m[3] * v[1] + m[6] * v[2], m[1] * v[0] + m[4] * v[1] + m[7] * v[2], m[2] * v[0] + m[5] * v[1] + m[8] * v[2]];
const rx = (a: number): M3 => [1, 0, 0, 0, Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a)];
const ry = (a: number): M3 => [Math.cos(a), 0, Math.sin(a), 0, 1, 0, -Math.sin(a), 0, Math.cos(a)];
const rz = (a: number): M3 => [Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a), 0, 0, 0, 1];
const aMundo = (q: V3): V3 => [q[0], -q[1], q[2]];
const aPantalla = (q: V3): V3 => [q[0], -q[1], q[2]];

// Los giros, tal cual los usa el estilo 3D en sus grupos (three.js): la raíz gira en y (π/2 − gira); el cuerpo, en orden XYZ
// (inclina, 0, ladea); la cabeza, en orden YXZ (cabecea, gira, ladea); el hombro, en orden XZY (−alza, ±abre, ±giro); el codo, en x
// (−codo); el muslo, en x (−π/2) y la rodilla, en x (π/2 − patada). +x local = su izquierda, +z local = delante.
export const giroRaiz = (pose: Pose) => Math.PI / 2 - pose.gira;
const mRaiz = (pose: Pose) => ry(giroRaiz(pose));
const mCuerpo = (pose: Pose) => mm(mRaiz(pose), mm(rx(pose.inclina), rz(pose.ladea)));
const mCabeza = (pose: Pose) => mm(mCuerpo(pose), mm(ry(pose.cabeza.gira), mm(rx(pose.cabeza.cabecea), rz(pose.cabeza.ladea))));
const mHombro = (pose: Pose, lado: 1 | -1) => {
  const b = lado > 0 ? pose.izq : pose.der;
  return mm(mCuerpo(pose), mm(rx(-b.alza), mm(rz(lado * b.abre), ry(lado * b.giro))));
};
const raiz = (pose: Pose): V3 => sum(aMundo(pose.base), [0, pose.salto, 0]);
const S = (v: V3): V3 => esc(v, MUNECO.escala);
const pivoteCuerpo = (pose: Pose): V3 => sum(raiz(pose), ap(mRaiz(pose), S([0, MUNECO.cadera, 0])));
const centroCabeza = (pose: Pose): V3 =>
  sum(sum(pivoteCuerpo(pose), ap(mCuerpo(pose), S([0, MUNECO.torso.alto + MUNECO.cuello, 0]))), ap(mCabeza(pose), S([0, MUNECO.cabeza.alto / 2, 0])));

export type Esqueleto = {
  cadera: V3; pecho: V3; cuello: V3; cabeza: V3; frente: V3; // frente: hacia dónde mira la cara (vector unitario, en pantalla)
  hombro: [V3, V3]; codo: [V3, V3]; mano: [V3, V3]; rodilla: [V3, V3]; pie: [V3, V3]; // [derecho, izquierdo]
};
// el esqueleto en coordenadas de la pantalla (x, y, z), para los estilos planos
export const esqueleto = (pose: Pose): Esqueleto => {
  const M = MUNECO;
  const R0 = raiz(pose), MR = mRaiz(pose), MC = mCuerpo(pose), MH = mCabeza(pose);
  const pc = pivoteCuerpo(pose);
  const brazo = (lado: 1 | -1) => {
    const h = sum(pc, ap(MC, S([lado * M.hombro.x, M.torso.alto - M.hombro.abajo, 0])));
    const ms = mHombro(pose, lado);
    const c = sum(h, ap(ms, S([0, -M.brazo[0], 0])));
    const b = lado > 0 ? pose.izq : pose.der;
    const mc = mm(ms, rx(-b.codo));
    const m = sum(c, ap(mc, S([0, -M.brazo[1] - 9, 0])));
    return [h, c, m].map(aPantalla) as [V3, V3, V3];
  };
  const pierna = (lado: 1 | -1) => {
    const cad = sum(R0, ap(MR, S([lado * M.pierna.x, M.cadera * 0.5, 0])));
    const ml = mm(MR, rx(-Math.PI / 2));
    const rod = sum(cad, ap(ml, S([0, -M.pierna.muslo + 8, 0])));
    const mk = mm(ml, rx(Math.PI / 2 - pose.patada));
    const pie = sum(rod, ap(mk, S([0, -M.pierna.espinilla, 0])));
    return [rod, pie].map(aPantalla) as [V3, V3];
  };
  const [hd, cd, md] = brazo(-1), [hi, ci, mi] = brazo(1);
  const [rd, pd] = pierna(-1), [ri, pi] = pierna(1);
  const f = ap(MH, [0, 0, 1]);
  return {
    cadera: aPantalla(sum(R0, ap(MR, S([0, M.cadera / 2, 0])))),
    pecho: aPantalla(sum(pc, ap(MC, S([0, M.torso.alto / 2, 0])))),
    cuello: aPantalla(sum(pc, ap(MC, S([0, M.torso.alto + M.cuello / 2, 0])))),
    cabeza: aPantalla(centroCabeza(pose)),
    frente: [f[0], -f[1], f[2]],
    hombro: [hd, hi], codo: [cd, ci], mano: [md, mi], rodilla: [rd, ri], pie: [pd, pi],
  };
};

// los ángulos de la cabeza (respecto al cuerpo) para mirar un punto de la pantalla
const apuntar = (pose: Pose, punto: V3): {gira: number; cabecea: number} => {
  const h = centroCabeza({...pose, cabeza: {gira: 0, cabecea: 0, ladea: 0}});
  const d = apT(mCuerpo(pose), res(aMundo(punto), h));
  return {
    gira: clamp(Math.atan2(d[0], d[2]), -1.45, 1.45),
    cabecea: clamp(Math.atan2(-d[1], Math.hypot(d[0], d[2])), -0.75, 0.85),
  };
};

const mezclaBrazo = (a: Brazo, b: Brazo, k: number): Brazo => ({alza: mix(a.alza, b.alza, k), abre: mix(a.abre, b.abre, k), codo: mix(a.codo, b.codo, k), giro: mix(a.giro, b.giro, k)});
const mezclaPose = (a: PoseNum, b: PoseNum, k: number): PoseNum => ({
  gira: mix(a.gira, b.gira, k), inclina: mix(a.inclina, b.inclina, k), ladea: mix(a.ladea, b.ladea, k), salto: mix(a.salto, b.salto, k),
  hg: mix(a.hg, b.hg, k), hp: mix(a.hp, b.hp, k), hl: mix(a.hl, b.hl, k), sigue: mix(a.sigue, b.sigue, k), camara: mix(a.camara, b.camara, k),
  der: mezclaBrazo(a.der, b.der, k), izq: mezclaBrazo(a.izq, b.izq, k), patada: mix(a.patada, b.patada, k),
});

// ---------------------------------------------------------------- lo que pasa en cada instante
export type Bola = {c: V3; giro: number; vuelco: number; aplasta: {k: number; n: V3}; dentro: boolean};
export type Instante = {
  t: number; intento: number;
  bola: Bola;
  papelera: {inclina: number}; // radianes, + = se va a la derecha (gira en el sentido del reloj en la pantalla), desde su base
  lampara: {ang: number}; // + = la pantalla se va a la derecha
  muneco: Pose;
  golpes: Golpe[]; // los que ya pasaron
  temblor: P; // un empujón de cámara que se apaga (en px), para los golpes fuertes
};

const TRAYECTOS: Trayecto[] = [];
const trayecto = (i: number) => (TRAYECTOS[i] ??= calcula(i));

export const bola = (i: number, t: number): Bola => {
  const tr = trayecto(i);
  const f = clamp(t, 0, DUR) * MUESTRAS;
  const j = Math.min(Math.floor(f), tr.muestras.length - 2);
  const a = tr.muestras[j], b = tr.muestras[j + 1] ?? a;
  const k = f - j;
  const c = mixV(a.c, b.c, k);
  // se aplasta un momento en cada golpe, a lo largo de la normal
  let ap0 = {k: 0, n: [0, -1, 0] as V3};
  for (const g of tr.golpes) {
    const u = t - g.t;
    if (u < 0 || u > 0.09) continue;
    const kk = clamp(g.fuerza / 2200) * Math.sin(Math.PI * Math.min(1, u / 0.09 + 0.15));
    if (kk > ap0.k) ap0 = {k: kk, n: g.n};
  }
  const rho = Math.hypot(c[0] - PB.x, c[2] - PB.z);
  return {c, giro: mix(a.giro, b.giro, k), vuelco: mix(a.vuelco, b.vuelco, k), aplasta: ap0, dentro: rho < PB.rBorde - 10 && c[1] > PB.yBorde};
};

export const papelera = (i: number, t: number) => {
  let ang = 0;
  for (const g of trayecto(i).golpes) {
    if (g.t > t || !['borde', 'papelera', 'pila'].includes(g.tipo)) continue;
    const u = t - g.t;
    const F: P = [-g.n[0] * g.fuerza, -g.n[1] * g.fuerza];
    const r: P = [g.p[0] - PB.x, g.p[1] - SUELO];
    const torque = r[0] * F[1] - r[1] * F[0];
    ang += clamp(torque / 9e6, -0.07, 0.07) * Math.exp(-5.5 * u) * Math.sin(24 * u + 0.3) * (g.tipo === 'pila' ? 0.4 : 1);
  }
  return {inclina: ang};
};

export const lampara = (i: number, t: number) => {
  if (PLANES[i].especial !== 'lampara' || t < PLANES[i].t1) return {ang: 0};
  const u = t - PLANES[i].t1;
  return {ang: 0.3 * Math.exp(-0.9 * u) * Math.sin(LAMP_W * u)};
};

export const temblor = (i: number, t: number): P => {
  let x = 0, y = 0;
  for (const g of trayecto(i).golpes) {
    const u = t - g.t;
    if (u < 0 || u > 0.3 || !['borde', 'muro', 'lampara', 'pila'].includes(g.tipo)) continue;
    const a = clamp(g.fuerza / 2500) * 7 * (1 - u / 0.3) ** 2;
    x += a * Math.sin(u * 95 + g.t * 10);
    y += a * Math.cos(u * 83 + g.t * 7);
  }
  return [x, y];
};

// la postura en t: cada clave arranca desde donde iba la anterior y llega a la suya en LLEGA segundos
const LLEGA = 0.22;
const poseEn = (guion: Clave[], j: number, t: number): PoseNum => {
  if (j <= 0) return POSES[guion[0][1]];
  const desde = poseEn(guion, j - 1, guion[j][0]);
  return mezclaPose(desde, POSES[guion[j][1]], E.inOutCubic(clamp((t - guion[j][0]) / LLEGA)));
};

export const muneco = (i: number, t: number): Pose => {
  const guion = GUION[i];
  let j = 0;
  while (j < guion.length - 1 && t >= guion[j + 1][0]) j++;
  const pn = poseEn(guion, j, t);
  const cara = guion[j][2];
  // lo vivo: respira y, en la celebración, bota en la silla con los brazos arriba
  const vivo = 0.012 * Math.sin(2 * Math.PI * 1.3 * t);
  let salto = pn.salto;
  let der = pn.der, izq = pn.izq;
  if (i === 9 && t > 0.86) {
    const u = t - 0.86;
    salto += 34 * Math.abs(Math.sin(Math.PI * 3.2 * u)) * clamp(u / 0.12);
    const bombea = 0.22 * Math.sin(2 * Math.PI * 3.2 * u);
    der = {...der, alza: der.alza + bombea, abre: der.abre + 0.1 * bombea};
    izq = {...izq, alza: izq.alza - bombea, abre: izq.abre - 0.1 * bombea};
  }
  // en la del borde que vuelve hacia él (5) y en la lámpara (7), se encoge un pelo
  const pose: Pose = {
    base: MUNECO.asiento, gira: pn.gira, inclina: pn.inclina + vivo, ladea: pn.ladea, salto,
    cabeza: {gira: pn.hg, cabecea: pn.hp, ladea: pn.hl},
    der, izq, patada: pn.patada * (0.6 + 0.4 * Math.sin(2 * Math.PI * 2.2 * t)),
    cara, ojos: [0, 0], mira: CAMARA,
  };
  // la cabeza: sigue la bola (con un pelo de retraso), o mira a cámara, o se queda en su postura
  const b = bola(i, Math.max(0, t - 0.06)).c;
  const aBola = apuntar(pose, b);
  const aCam = apuntar(pose, CAMARA);
  const sigue = clamp(pn.sigue), cam = clamp(pn.camara);
  // la cara no se pone nunca de perfil del todo (se leería mal en pequeño): lo que falta para mirar la bola lo hacen las pupilas
  pose.cabeza.gira = Math.min(mix(mix(pn.hg, aBola.gira, sigue), aCam.gira, cam), pose.gira - 0.5);
  pose.cabeza.cabecea = mix(mix(pn.hp, aBola.cabecea, sigue), aCam.cabecea + pn.hp * 0.5, cam);
  pose.mira = sigue >= cam ? b : CAMARA;
  // las pupilas: lo que le falta a la cabeza para mirar del todo
  const d = apT(mCabeza(pose), res(aMundo(pose.mira), centroCabeza(pose)));
  pose.ojos = [clamp(Math.atan2(d[0], d[2]) / 0.7, -1, 1), clamp(Math.atan2(-d[1], Math.hypot(d[0], d[2])) / 0.6, -1, 1)];
  if (cam > 0.6) pose.ojos = [pose.ojos[0] * 0.3, pose.ojos[1] * 0.3];
  return pose;
};

// la mano derecha en la postura de lanzar: de ahí sale la bola (se calcula antes que los trayectos)
{
  const p0: Pose = {
    base: MUNECO.asiento, gira: POSES.lanza.gira, inclina: POSES.lanza.inclina, ladea: POSES.lanza.ladea, salto: 0,
    cabeza: {gira: 0, cabecea: 0, ladea: 0}, der: POSES.lanza.der, izq: POSES.lanza.izq, patada: 0, cara: 'atento', ojos: [0, 0], mira: CAMARA,
  };
  const m = esqueleto(p0).mano[0];
  SUELTA = [m[0] + 14, m[1] - 18, m[2]];
}

export const lanzamiento = (intento: number, t: number): Instante => {
  const i = clamp(Math.round(intento), 0, N_INTENTOS - 1);
  const tt = clamp(t, 0, DUR);
  return {
    t: tt, intento: i,
    bola: bola(i, tt),
    papelera: papelera(i, tt),
    lampara: lampara(i, tt),
    muneco: muneco(i, tt),
    golpes: trayecto(i).golpes.filter((g) => g.t <= tt),
    temblor: temblor(i, t),
  };
};

// para revisar la física sin pintar nada (herramienta de prueba)
export const _trayecto = (i: number) => trayecto(i);
