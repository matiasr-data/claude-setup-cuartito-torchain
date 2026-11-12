import {clamp} from '../../../comun/curvas';
import {D, SILLA, SUELO, esqueleto, giroRaiz, proyecta, type Cara, type Pose, type V3} from '../escena';
import {G, TINTA, afMul, afRot, afTras, ap, apl, arco, cinta, elipse, envolvente, manguera, poliRedondo, porMedio, quad, rr, spline, type Af, type Lienzo, type P} from './tinta';
import {boca, ceja, gota, guante, ojo, zapato, type TipoBoca, type TipoCeja, type TipoOjo} from './partes';

// EL MUÑECO EN DIBUJO DE LOS AÑOS 30 Y SU SILLA. Es el mismo muñeco de los bloques (su esqueleto sale de
// escena.ts: las mismas posturas, la cabeza que sigue la bola y las caras de cada momento), dibujado como un personaje de los 30:
// la cabeza blanca de ladrillo redondo vuelta un «frijol», con sus orejas, la nariz negra y los ojos de pastel cortado; el mismo pelo
// (la placa plana con su flequillo) en tinta con un brillo; la camisa gris clara con el cuello blanco y la corbata negra de lunares;
// el pantalón negro con sus dos botones, los brazos y las piernas de manguera (sin codos ni rodillas: una sola curva que pasa por
// donde estaría el codo), los guantes blancos y los zapatones. Todo respira al compás (latido: −1..1).

const pr = (v: V3): P => proyecta(v);
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
const nor = (a: P): P => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};

const LW = 9; // la tinta del muñeco (en la tarjeta de 505 px queda en ~4 px)
const CAMISA = '#E9E6DD';
const CAMISA_SOMBRA = '#B3B0A8';

// ---------------------------------------------------------------- la silla (gira con él, como la de los bloques)
export const dibujaSilla = (L: Lienzo, pose: Pose, latido: number) => {
  const th = giroRaiz(pose);
  const c = Math.cos(th), s = Math.sin(th);
  const en = (lx: number, yUp: number, lz: number): P => pr([SILLA.x + lx * c + lz * s, SUELO - yUp, SILLA.z - lx * s + lz * c]);
  // la base de cinco patas con sus ruedas (de atrás adelante)
  const patas = [0, 1, 2, 3, 4].map((k) => {
    const a = (k / 5) * Math.PI * 2 + 0.3;
    const z = SILLA.z + 134 * Math.cos(a);
    return {a, z, fin: pr([SILLA.x + 134 * Math.sin(a), SUELO - 16, z]), rueda: pr([SILLA.x + 134 * Math.sin(a), SUELO - 12, z])};
  }).sort((p, q) => p.z - q.z);
  const eje = pr([SILLA.x, SUELO - 30, SILLA.z]);
  for (const p of patas) {
    L.forma(300 + p.a, cinta([eje, p.fin], 22, 18), {relleno: G.oscuro, lw: 7});
    L.forma(310 + p.a, elipse(p.rueda[0], p.rueda[1] + 4, 15, 13), {relleno: TINTA, lw: 6});
  }
  L.forma(320, elipse(eje[0], eje[1], 34, 14), {relleno: G.oscuro, lw: 7});
  // el poste (un muelle de los 30: se aplasta con el latido)
  const asiento = SUELO - SILLA.asiento;
  const a0 = pr([SILLA.x, SUELO - 30, SILLA.z]), a1 = pr([SILLA.x, SUELO - (asiento - 36), SILLA.z]);
  L.forma(330, cinta([a0, a1], 26, 22), {relleno: G.claro, lw: 7, sombra: {col: G.medio, dx: 8, dy: 0}});
  // el respaldo (detrás de él) y el asiento: cajas proyectadas de verdad, con las esquinas redondas
  const caja = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
    const esq: P[] = [];
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) esq.push(en(x, y, z));
    return envolvente(esq);
  };
  const sube = -latido * 3;
  L.forma(340, poliRedondo(caja(-90, 90, asiento - 6, asiento + 168 + sube, -136, -74), 30), {relleno: G.oscuroMedio, lw: LW});
  const frenteRes = [en(-82, asiento + 8, -74), en(82, asiento + 8, -74), en(82, asiento + 158 + sube, -74), en(-82, asiento + 158 + sube, -74)];
  L.forma(341, poliRedondo(frenteRes, 26), {relleno: G.medio, lw: 6, sombra: {col: G.oscuroMedio, dx: 10, dy: 6}});
  // dos costuras de capitoné en el respaldo
  const mR = en(0, asiento + 84 + sube / 2, -72);
  L.punto(mR[0] - 22, mR[1], 5, TINTA);
  L.punto(mR[0] + 22, mR[1], 5, TINTA);
  L.forma(342, poliRedondo(caja(-96, 96, asiento - 40, asiento - 2, -104, 92), 22), {relleno: G.oscuroMedio, lw: LW});
  const topeA = [en(-92, asiento - 2, -100), en(92, asiento - 2, -100), en(92, asiento - 2, 88), en(-92, asiento - 2, 88)];
  L.forma(343, poliRedondo(topeA, 24), {relleno: G.medio, lw: 6});
};

// ---------------------------------------------------------------- las caras de los 30, una por cada cara de la escena
type CaraDibujo = {ojo: TipoOjo; ceja: TipoCeja; boca: TipoBoca; abre?: number; parpado?: number};
const CARAS: Record<Cara, CaraDibujo> = {
  atento: {ojo: 'abierto', ceja: 'plana', boca: 'sonrisa'},
  ilusion: {ojo: 'abierto', ceja: 'arriba', boca: 'risa', abre: 0.5},
  tension: {ojo: 'abierto', ceja: 'triste', boca: 'dientes', abre: 0.55},
  ay: {ojo: 'grande', ceja: 'arriba', boca: 'o', abre: 0.75},
  fastidio: {ojo: 'aprieta', ceja: 'enfado', boca: 'triste'},
  meh: {ojo: 'medio', ceja: 'plana', boca: 'lado', parpado: 0.5},
  susto: {ojo: 'grande', ceja: 'arriba', boca: 'ondas', abre: 0.7},
  feliz: {ojo: 'feliz', ceja: 'arriba', boca: 'grande', abre: 0.62},
  serio: {ojo: 'medio', ceja: 'plana', boca: 'plana', parpado: 0.55},
};

export type Muneco2D = {cabeza: P; R: number; manos: P[]; pecho: P};

// ---------------------------------------------------------------- el muñeco
export const dibujaMuneco = (L: Lienzo, pose: Pose, latido: number, t: number): Muneco2D => {
  const sk = esqueleto(pose);
  const cad = pr(sk.cadera), cue = pr(sk.cuello), cab = pr(sk.cabeza), pecho = pr(sk.pecho);
  const fb = Math.cos(pose.gira); // hacia dónde mira el cuerpo en la pantalla (+ = a la derecha)
  const cara = CARAS[pose.cara];

  // ---- el tronco: un «frijol» de la cadera al cuello, que respira
  const ejeT = sub(cue, cad);
  const largoT = Math.hypot(ejeT[0], ejeT[1]) * (1 + 0.035 * latido);
  const u = nor(ejeT); // hacia arriba
  const n: P = [-u[1], u[0]]; // hacia su derecha en la pantalla
  const anchoK = 1 - 0.025 * latido;
  const T = (v: number, w: number): P => add(add(cad, mul(u, v * largoT)), mul(n, w * anchoK));
  const perfil: [number, number][] = [[-0.2, 54], [0.08, 72], [0.36, 74], [0.66, 64], [0.9, 52], [1.02, 34]];
  const lados: P[] = [T(-0.28, 0), ...perfil.map(([v, w]) => T(v, w)), T(1.08, 0), ...perfil.slice().reverse().map(([v, w]) => T(v, -w))];
  const tronco = spline(lados, true, 6);
  const centroF = (v: number) => T(v, fb * 0.36 * 64); // la línea de delante (la corbata, los botones)

  // ---- las piernas: una manguera de la cadera al pie pasando por la rodilla, y sus zapatones
  const rods = [pr(sk.rodilla[0]), pr(sk.rodilla[1])];
  const rodMedia = mul(add(rods[0], rods[1]), 0.5);
  const piernas = [0, 1].map((k) => ({
    k, z: sk.pie[k][2], cadera: add(T(0.02, 0), mul(sub(rods[k], rodMedia), 0.7)), rod: rods[k], pie: pr(sk.pie[k]),
  })).sort((a, b) => a.z - b.z);

  // ---- los brazos: del hombro a la mano pasando por el codo; los que van detrás del cuerpo, antes
  const brazos = [0, 1].map((k) => {
    const h = pr(sk.hombro[k]), c = pr(sk.codo[k]), m = pr(sk.mano[k]);
    const ctrl = porMedio(h, c, m);
    const delante = sk.mano[k][2] > sk.pecho[2] - 6;
    const b = k === 0 ? pose.der : pose.izq;
    return {k, h, c, m, ctrl, delante, z: sk.mano[k][2], b};
  });
  const brazo = (br: (typeof brazos)[number]) => {
    const {k, h, c, m} = br;
    L.forma(400 + k * 10, manguera(h, c, m, 21, 19), {relleno: TINTA, lw: 6});
    // la manga corta de la camisa, que sigue la manguera
    const fin = quad(h, br.ctrl, m, 16);
    L.forma(401 + k * 10, cinta(fin.slice(0, 6), 34, 30), {relleno: CAMISA, lw: 7, sombra: {col: CAMISA_SOMBRA, dx: 6, dy: 6}});
    // el guante, hacia donde sale la manguera
    const dir = sub(fin[16], fin[13]);
    const ang = Math.atan2(dir[1], dir[0]);
    const tipo = br.b.codo > 1.6 ? 'puno' : 'abierta';
    guante(L, 402 + k * 10, m[0] - Math.cos(ang) * 8, m[1] - Math.sin(ang) * 8, ang, tipo, 1.42, Math.cos(ang) < 0, 7);
  };

  for (const br of brazos) if (!br.delante) brazo(br);
  for (const p of piernas) {
    L.forma(500 + p.k * 10, manguera(p.cadera, p.rod, p.pie, 24, 22), {relleno: TINTA, lw: 6});
    const dir = fb > 0.2 ? 1 : fb < -0.2 ? -1 : p.k === 0 ? -1 : 1;
    zapato(L, 501 + p.k * 10, p.pie[0] - dir * 12, p.pie[1] + 10, dir, 1.75, 0, 7);
  }

  // ---- el tronco: la camisa, el pantalón con sus botones, el cuello y la corbata
  L.forma(600, tronco, {
    relleno: CAMISA, lw: LW, sombra: {col: CAMISA_SOMBRA, dx: 16, dy: 6},
    dentro: (Dn) => {
      // el pantalón negro (sentado, solo asoma la cintura) con su cinturón
      Dn.forma(601, [T(-0.6, -200), T(-0.6, 200), T(0.1, 200), T(0.1, -200)], {relleno: TINTA, linea: null, hierve: 0.5});
      const hebilla = centroF(0.07);
      Dn.forma(602, rr(hebilla[0] - 13, hebilla[1] - 10, 26, 20, 4), {relleno: G.blanco, lw: 4});
    },
  });
  // la corbata: el nudo y la pala (negra con lunares blancos)
  const nudo = centroF(0.93);
  const corbata = [add(nudo, mul(n, -13)), add(nudo, mul(n, 13)), add(centroF(0.3), mul(n, 23)), centroF(0.2), add(centroF(0.3), mul(n, -23))];
  L.forma(610, poliRedondo(corbata, 6), {
    relleno: TINTA, lw: 6,
    dentro: (Dn) => {
      for (const [v, w] of [[0.76, -4], [0.6, 8], [0.44, -7], [0.32, 6]] as [number, number][]) {
        const q = add(centroF(v), mul(n, w));
        Dn.punto(q[0], q[1], 6.5, G.blanco);
      }
    },
  });
  L.forma(611, elipse(nudo[0], nudo[1], 17, 14), {relleno: TINTA, lw: 6});
  // el cuello de la camisa: dos alas blancas a los lados del nudo
  for (const lado of [-1, 1]) {
    const ala = [add(centroF(1.02), mul(n, lado * 6)), add(centroF(1.04), mul(n, lado * 44)), add(centroF(0.82), mul(n, lado * 22))];
    L.forma(612 + lado, poliRedondo(ala, 5), {relleno: G.blanco, lw: 7});
  }

  // ---- la cabeza
  const R = 80, RY = 90;
  const dc = sub(cab, cue);
  const thH = clamp(Math.atan2(dc[0], -dc[1]), -0.5, 0.5);
  const Mh: Af = afMul(afTras(cab[0], cab[1]), afRot(thH));
  const H = (p: P) => ap(Mh, p);
  const fx = clamp(sk.frente[0], -0.95, 0.95), fy = clamp(sk.frente[1], -0.8, 0.8);
  const fo: P = [fx * R * 0.42, 8 + fy * R * 0.28]; // dónde está la cara en la cabeza (el centro de los ojos)
  // la cabeza: un cilindro blando (el ladrillo redondo de los bloques), algo más estrecho en la mandíbula
  const forma = (rx: number, ry: number, y0 = 0): P[] => Array.from({length: 48}, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const r = (Math.abs(ca) ** 2.6 + Math.abs(sa) ** 2.6) ** (-1 / 2.6);
    const jaw = sa > 0 ? 1 - 0.1 * sa : 1;
    return [ca * r * rx * jaw, y0 + sa * r * ry] as P;
  });
  // las orejas, detrás
  for (const lado of [-1, 1]) {
    const lejos = Math.sign(fx) === lado && Math.abs(fx) > 0.2;
    const k = lejos ? 0.82 : 1;
    const c = H([lado * R * 0.98 - fx * R * 0.14, 6]);
    L.forma(700 + lado, elipse(c[0], c[1], 22 * k, 26 * k), {relleno: G.blanco, lw: 7});
    L.trazo(702 + lado, apl(Mh, arco(lado * R * 0.98 - fx * R * 0.14 + lado * 3, 6, 10 * k, 13 * k, lado > 0 ? -1.3 : Math.PI - 1.3, lado > 0 ? 1.3 : Math.PI + 1.3, 8)), 5);
  }
  L.forma(710, apl(Mh, forma(R, RY)), {relleno: G.blanco, lw: LW, sombra: {col: G.palido, dx: 14, dy: 8}});
  // el pelo: la placa plana encima con su flequillo hacia donde mira (de punta en el susto)
  const susto = pose.cara === 'susto';
  const alza = susto ? -26 : 0;
  const pelo: P[] = [];
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI + 0.18 + (i / 18) * (Math.PI - 0.36);
    const ca = Math.cos(a), sa = Math.sin(a);
    const r = (Math.abs(ca) ** 2.6 + Math.abs(sa) ** 2.6) ** (-1 / 2.6);
    pelo.push([ca * r * R * 1.07, Math.max(-RY * 1.08, sa * r * RY * 1.07) + alza]);
  }
  const fl = fo[0];
  // la línea del pelo, con el flequillo que cae hacia donde mira (por encima de las cejas)
  pelo.push([R * 0.99, -RY * 0.4 + alza * 0.3], [R * 0.66 + fl * 0.15, -RY * 0.6], [fl + R * 0.46, -RY * 0.5], [fl + R * 0.26, -RY * 0.64],
    [fl - R * 0.12, -RY * 0.72], [-R * 0.5, -RY * 0.68], [-R * 0.99, -RY * 0.42 + alza * 0.3]);
  L.forma(720, apl(Mh, spline(pelo, true, 4)), {relleno: TINTA, lw: 7});
  if (susto) {
    for (const k of [-1, 0, 1]) L.forma(721 + k, apl(Mh, [[k * 34 - 14, -RY * 1.02 + alza], [k * 40 + k * 8, -RY * 1.5 + alza], [k * 34 + 14, -RY * 1.02 + alza]]), {relleno: TINTA, lw: 6});
  }
  // el brillo del pelo (la luz viene de arriba a la izquierda)
  L.trazo(725, apl(Mh, arco(-R * 0.1, -RY * 0.55 + alza, R * 0.62, RY * 0.32, Math.PI * 1.18, Math.PI * 1.5, 10)), 7, {linea: G.blanco});

  // la cara: los ojos (el de lejos, más estrecho), las cejas, la nariz y la boca
  const sep = 27 * (1 - 0.12 * Math.abs(fx));
  // las pupilas miran lo que mira él: la bola, o a nosotros (al centro)
  let lx = 0, ly = 0;
  if (pose.mira[2] < D * 0.5) {
    const m = pr(pose.mira);
    const dd = sub(m, cab);
    const loc = [Math.cos(-thH) * dd[0] - Math.sin(-thH) * dd[1], Math.sin(-thH) * dd[0] + Math.cos(-thH) * dd[1]];
    lx = clamp(loc[0] / 220, -1, 1);
    ly = clamp(loc[1] / 220, -1, 1);
  }
  for (const lado of [-1, 1] as const) {
    const lejos = Math.sign(fx) === lado;
    const ex = fo[0] + lado * sep + (lejos ? lado * -2 : 0);
    const c = H([ex, fo[1]]);
    const kx = lejos ? 1 - 0.24 * Math.abs(fx) : 1;
    ojo(L, 730 + lado, c[0], c[1], 17 * kx, 23, {lx, ly, tipo: cara.ojo, parpado: cara.parpado, lado: lado === -1 ? 1 : -1, lw: 6});
    const cc = H([ex, fo[1] - 33 - (cara.ceja === 'arriba' ? 7 : 0)]);
    ceja(L, 734 + lado, cc[0], cc[1], 30 * kx, cara.ceja, lado, 8);
  }
  const nariz = H([fo[0] + fx * 18, fo[1] + 27]);
  L.forma(740, elipse(nariz[0], nariz[1], 14, 11), {relleno: TINTA, lw: 5});
  L.forma(741, elipse(nariz[0] - 5, nariz[1] - 4, 4.5, 3, 10), {relleno: G.blanco, linea: null, hierve: 0.3});
  const bc = H([fo[0] + fx * 10, fo[1] + 50]);
  boca(L, 742, bc[0], bc[1], 52, cara.boca, cara.abre ?? 0.6, 7);

  // los brazos de delante (encima de todo: el que se tapa la cara, el que se cubre)
  for (const br of brazos.filter((b) => b.delante).sort((a, b) => a.z - b.z)) brazo(br);

  // ---- los gestos de los 30 alrededor de la cabeza
  const top = H([0, -RY - 10]);
  const ciclo = Math.floor(t * 12);
  if (pose.cara === 'tension' || (pose.cara === 'ilusion' && pose.der.codo > 1.6)) {
    // las gotas de sudor que saltan de la frente hacia fuera (la punta mira a la cabeza)
    for (let k = 0; k < 3; k++) {
      const f = ((ciclo + k * 2) % 6) / 6;
      const a = -Math.PI / 2 + (k - 1) * 0.95 + (k === 1 ? -Math.sign(fx || 1) * 0.5 : 0);
      const dd = R * 1.18 + f * 50;
      const g0 = H([Math.cos(a) * dd, -14 + Math.sin(a) * dd * 1.05]);
      const haciaCab = sub(cab, g0);
      gota(L, 760 + k, g0[0], g0[1] + f * f * 30, 1.05 - 0.3 * f, Math.atan2(haciaCab[0], -haciaCab[1]));
    }
  }
  if (pose.cara === 'ay' || pose.cara === 'susto') {
    // las rayas de la sorpresa, alrededor de la cabeza
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k - 2) * 0.42;
      const r0 = R * 1.25 + (ciclo % 2) * 6, r1 = r0 + 34;
      L.trazo(770 + k, [H([Math.cos(a) * r0, -12 + Math.sin(a) * r0 * 1.05]), H([Math.cos(a) * r1, -12 + Math.sin(a) * r1 * 1.05])], 7);
    }
  }
  if (pose.cara === 'fastidio') {
    // la nubecita negra con su rayo, encima
    const c = add(top, [6, -70 + (ciclo % 2) * 3]);
    const nube = spline([[c[0] - 70, c[1] + 18], [c[0] - 74, c[1] - 6], [c[0] - 46, c[1] - 30], [c[0] - 14, c[1] - 40], [c[0] + 22, c[1] - 34], [c[0] + 52, c[1] - 24],
      [c[0] + 74, c[1]], [c[0] + 62, c[1] + 22], [c[0] + 20, c[1] + 26], [c[0] - 26, c[1] + 26]], true, 5);
    L.forma(780, nube, {relleno: G.oscuro, lw: 7});
    L.forma(781, [[c[0] - 4, c[1] + 24], [c[0] + 16, c[1] + 24], [c[0] + 4, c[1] + 44], [c[0] + 20, c[1] + 44], [c[0] - 12, c[1] + 82], [c[0] - 2, c[1] + 52], [c[0] - 16, c[1] + 52]], {relleno: G.blanco, lw: 5});
  }
  if (pose.cara === 'meh' || pose.cara === 'serio') {
    // la gota del «¿en serio?» en la sien
    const g0 = H([-Math.sign(fx || 1) * R * 0.78, -RY * 0.3]);
    gota(L, 790, g0[0], g0[1] + (ciclo % 2) * 3, 1.3, 0);
  }
  if (pose.cara === 'feliz') {
    // estrellitas que saltan alrededor
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + (ciclo % 4) * 0.4;
      const r = R * 1.7 + ((ciclo + k) % 3) * 10;
      const c = H([Math.cos(a) * r, -20 + Math.sin(a) * r * 0.8]);
      const q = 15 + ((ciclo + k) % 2) * 5;
      L.forma(795 + k, [[c[0], c[1] - q], [c[0] + q * 0.3, c[1] - q * 0.3], [c[0] + q, c[1]], [c[0] + q * 0.3, c[1] + q * 0.3], [c[0], c[1] + q], [c[0] - q * 0.3, c[1] + q * 0.3], [c[0] - q, c[1]], [c[0] - q * 0.3, c[1] - q * 0.3]],
        {relleno: G.blanco, lw: 5});
    }
  }
  return {cabeza: cab, R, manos: brazos.map((b) => b.m), pecho};
};

// la sombra del muñeco y su silla en el suelo (una mancha plana, como en los dibujos de entonces)
export const sombraSilla = (L: Lienzo) => {
  const c = pr([SILLA.x + 20, SUELO, SILLA.z]);
  L.forma(290, elipse(c[0], c[1], 190, 44), {relleno: TINTA, linea: null, alfa: 0.32, hierve: 0.5});
};

