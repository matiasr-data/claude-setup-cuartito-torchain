import {ALTO, LAMPARA, MESA, MUNECO, PAPELERA, PLACA, SILLA, STUD, SUELO, esqueleto, giroRaiz, proyecta, type Cara, type P, type Pose, type V3} from '../escena';
import {clamp} from '../../../comun/curvas';
import {aro3, cruz, envolvente, esc, nor, pto, res, sum, vista} from './tiza';

// PIZARRA DE TIZA, LAS FORMAS: de la escena en 3D (escena.ts) a lo que se dibuja en la pizarra, en px de la
// pantalla. Cada cosa sale como la ve la cámara de los bloques (proyecta), así que todo queda en su sitio al pasar de un estilo a
// otro: la caja da su silueta y las aristas de las caras que se ven; el cilindro, su silueta y su tapa; la cara del muñeco se pega a
// su cabeza redonda (los ojos se van de lado cuando gira). Aquí no hay color ni tiza: solo geometría.

// ---------------------------------------------------------------- una caja y un cilindro vistos por la cámara
export type Caja = {silueta: P[]; aristas: [P, P][]; caras: {n: V3; pts: P[]}[]};
// c: el centro; ejes: los tres medios lados (vectores)
export const caja = (c: V3, ejes: [V3, V3, V3]): Caja => {
  const esq: V3[] = [];
  for (let b = 0; b < 8; b++) {
    let q = c;
    for (let a = 0; a < 3; a++) q = sum(q, esc(ejes[a], b & (1 << a) ? 1 : -1));
    esq.push(q);
  }
  const p2 = esq.map(proyecta);
  const v = vista(c);
  const ve = (a: number, s: number) => pto(esc(nor(ejes[a]), s), v) > 0.03;
  const aristas: [P, P][] = [];
  for (let a = 0; a < 3; a++) {
    const [b1, b2] = [0, 1, 2].filter((k) => k !== a);
    for (let i = 0; i < 8; i++) {
      if (i & (1 << a)) continue;
      const s1 = i & (1 << b1) ? 1 : -1, s2 = i & (1 << b2) ? 1 : -1;
      if (ve(b1, s1) && ve(b2, s2)) aristas.push([p2[i], p2[i | (1 << a)]]);
    }
  }
  const caras: {n: V3; pts: P[]}[] = [];
  for (let a = 0; a < 3; a++) {
    const [b1, b2] = [0, 1, 2].filter((k) => k !== a);
    for (const s of [-1, 1]) {
      if (!ve(a, s)) continue;
      const base = s > 0 ? 1 << a : 0;
      const orden = [0, 1 << b1, (1 << b1) | (1 << b2), 1 << b2].map((m) => p2[base | m]);
      caras.push({n: esc(nor(ejes[a]), s), pts: orden});
    }
  }
  return {silueta: envolvente(p2), aristas, caras};
};

// un cilindro: centro, eje (hacia arriba en la pantalla = y negativa), radio y alto. La tapa que se ve es la de arriba o la de abajo.
export const cilindro = (c: V3, eje: V3, r: number, h: number, n = 44) => {
  const u = nor(eje);
  const e1 = nor(cruz(u, Math.abs(u[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]));
  const e2 = cruz(u, e1);
  const arriba = aro3(sum(c, esc(u, h / 2)), e1, e2, r, n);
  const abajo = aro3(sum(c, esc(u, -h / 2)), e1, e2, r, n);
  const tapaArriba = pto(u, vista(c)) > 0;
  return {silueta: envolvente([...arriba, ...abajo]), tapa: tapaArriba ? arriba : abajo, tapaArriba, arriba, abajo};
};

// ---------------------------------------------------------------- el muñeco
// El cuerpo, rehecho desde el esqueleto de la escena: los hombros dan el lado (L), del pecho al cuello sale lo de arriba (U), y el
// frente es U × L. La cabeza: su frente viene en el esqueleto; su arriba, el del cuerpo enderezado contra ese frente.
const E = MUNECO.escala;
export type PiezaMuneco =
  | {tipo: 'torso'; z: number; caja: Caja; cuello: P[]; corbata: P[]; ve: boolean}
  | {tipo: 'brazo'; z: number; lado: 1 | -1; pts: P[]; mano: P; rMano: number}
  | {tipo: 'pierna'; z: number; lado: 1 | -1; muslo: P[]; espinilla: P[]; pie: P[]}
  | {tipo: 'cabeza'; z: number; silueta: P[]; tapa: P[]; pelo: P[]; flequillo: P[][]; cara: Rasgo[]; centro: P; arriba: P};
// un rasgo de la cara: una línea, una mancha rellena o un óvalo, ya en la pantalla
export type Rasgo = {d: P[]; relleno?: boolean; cerrado?: boolean; w?: number};

const sub2 = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
// la cara se pega a la cabeza un poco más plana de lo que es (si no, al girar se va toda al canto y no se lee)
const ABRE = 0.7;
const GIRO_CARA = 0.36;
// y un pelo más grande que la de los bloques: en la tarjeta del vídeo se veía a medio tamaño
const CARA = 1.42;

export const muneco = (pose: Pose) => {
  const es = esqueleto(pose);
  const [hd, hi] = es.hombro;
  const L = nor(res(hi, hd));
  const U = nor(res(es.cuello, es.pecho));
  const F = cruz(U, L);
  const T = MUNECO.torso;
  const piezas: PiezaMuneco[] = [];

  // el cuerpo: una caja; delante, el cuello de la camisa y la corbata (si se ve el frente)
  const cTorso = es.pecho;
  const torso = caja(cTorso, [esc(L, (T.an / 2) * E), esc(U, (T.alto / 2) * E), esc(F, (T.fondo / 2) * E)]);
  const frente = sum(cTorso, esc(F, (T.fondo / 2) * E));
  const enFrente = (u: number, v: number) => proyecta(sum(frente, sum(esc(L, u * E), esc(U, -v * E))));
  const alto2 = (T.alto / 2);
  const cuello = [enFrente(-30, -alto2), enFrente(0, -alto2 + 26), enFrente(30, -alto2)];
  const corbata = [enFrente(-8, -alto2 + 12), enFrente(8, -alto2 + 12), enFrente(12, alto2 - 22), enFrente(0, alto2 - 8), enFrente(-12, alto2 - 22)];
  piezas.push({tipo: 'torso', z: cTorso[2], caja: torso, cuello, corbata, ve: pto(F, vista(cTorso)) > 0.15});

  // los brazos: hombro, codo y mano
  for (const [k, lado] of [[0, -1], [1, 1]] as const) {
    const pts = [es.hombro[k], es.codo[k], es.mano[k]];
    piezas.push({tipo: 'brazo', z: (pts[0][2] + pts[1][2] + 2 * pts[2][2]) / 4, lado, pts: pts.map(proyecta), mano: proyecta(es.mano[k]), rMano: MUNECO.rMano * E * 1.1});
  }

  // las piernas: la cadera de cada lado (desde la rodilla, hacia atrás, lo que mide el muslo), la rodilla, el pie y la puntera
  const rodMedia = esc(sum(es.rodilla[0], es.rodilla[1]), 0.5);
  const adelante = nor([rodMedia[0] - es.cadera[0], 0, rodMedia[2] - es.cadera[2]]);
  for (const [k, lado] of [[0, -1], [1, 1]] as const) {
    const rod = es.rodilla[k], pie = es.pie[k];
    const cad = sum(rod, esc(adelante, -(MUNECO.pierna.muslo - 8) * E * 0.82));
    const punta = sum(pie, esc(adelante, 46));
    piezas.push({tipo: 'pierna', z: (cad[2] + rod[2] + pie[2]) / 3, lado, muslo: [cad, rod].map(proyecta), espinilla: [rod, pie].map(proyecta), pie: [pie, punta].map(proyecta)});
  }

  // la cabeza: un cilindro, su pelo encima (un poco más ancho) y la cara pegada a él
  // la cara mira a donde mira él, pero como mucho a GIRO_CARA de la cámara: así nunca se va al canto de la cabeza (en una pizarra,
  // como en un dibujo, la cara se pone de tres cuartos aunque el cuerpo esté de lado)
  const fr0 = es.frente;
  const arriba = nor(res(U, esc(fr0, pto(U, fr0))));
  const vv = vista(es.cabeza);
  const vh = nor(res(vv, esc(arriba, pto(vv, arriba))));
  const fh = nor(res(fr0, esc(arriba, pto(fr0, arriba))));
  const alfa = clamp(Math.atan2(pto(cruz(vh, fh), arriba), pto(vh, fh)), -GIRO_CARA, GIRO_CARA);
  const fr = nor(sum(sum(esc(vh, Math.cos(alfa)), esc(cruz(arriba, vh), Math.sin(alfa))), esc(arriba, pto(fr0, arriba))));
  const izq = cruz(fr, arriba);
  const r = MUNECO.cabeza.r * E, h = MUNECO.cabeza.alto * E;
  const cab = cilindro(es.cabeza, arriba, r, h);
  const topeC = sum(es.cabeza, esc(arriba, h / 2));
  const pelo = cilindro(sum(topeC, esc(arriba, (MUNECO.pelo * E) / 2 - 3)), arriba, r + 5, MUNECO.pelo * E + 6);
  // u, v: en px sobre la cara (u a la derecha de quien mira, v hacia abajo, 0 en el centro de la cabeza)
  const enCara = (u: number, v: number): V3 => {
    const a = (u / r) * ABRE;
    return sum(sum(es.cabeza, esc(arriba, -v)), esc(sum(esc(fr, Math.cos(a)), esc(izq, Math.sin(a))), r));
  };
  const seVe = (u: number) => {
    const a = (u / r) * ABRE;
    const n = sum(esc(fr, Math.cos(a)), esc(izq, Math.sin(a)));
    return pto(n, vista(es.cabeza)) > 0.12;
  };
  const cara = rasgos(pose.cara, pose.ojos, (u, v) => proyecta(enCara(u * CARA, v * CARA)), (u) => seVe(u * CARA));
  // el flequillo: una onda suave por delante del pelo, sobre la frente (sigue a la cara cuando gira)
  const flequillo: P[][] = [Array.from({length: 9}, (_, j) => [-46 + j * 11.5, -h / 2 + 2 + (j % 2 ? 9 : 0)] as [number, number])
    .filter(([u]) => seVe(u)).map(([u, v]) => proyecta(enCara(u, v)))].filter((f) => f.length > 1);
  piezas.push({
    tipo: 'cabeza', z: es.cabeza[2], silueta: cab.silueta, tapa: cab.tapaArriba ? cab.arriba : [], pelo: pelo.silueta, flequillo, cara,
    centro: proyecta(es.cabeza), arriba: sub2(proyecta(topeC), proyecta(es.cabeza)),
  });
  return {piezas: piezas.sort((a, b) => a.z - b.z), cabeza: proyecta(es.cabeza), r};
};

// los ojos, las cejas y la boca de cada cara (las mismas caras que los bloques, en trazos de tiza)
const rasgos = (cara: Cara, ojos: P, en: (u: number, v: number) => P, seVe: (u: number) => boolean): Rasgo[] => {
  const out: Rasgo[] = [];
  const sep = 28, ojoV = -8, bocaV = 30, cejaV = -40;
  const px = ojos[0] * 6, py = ojos[1] * 4;
  const ovalo = (cu: number, cv: number, ru: number, rv: number): P[] => Array.from({length: 18}, (_, j) => {
    const a = (j / 18) * Math.PI * 2;
    return en(cu + Math.cos(a) * ru, cv + Math.sin(a) * rv);
  });
  const linea = (pts: [number, number][], w = 6) => ({d: pts.map(([u, v]) => en(u, v)), w});
  const ojo = (lado: number, forma: 'normal' | 'grande' | 'cerrado' | 'feliz' | 'medio' | 'susto') => {
    const cu = lado * sep;
    if (!seVe(cu)) return;
    if (forma === 'cerrado') {
      out.push(linea([[cu - 13, ojoV + (lado > 0 ? 3 : -1)], [cu, ojoV - 5], [cu + 13, ojoV + (lado > 0 ? -1 : 3)]], 6));
      return;
    }
    if (forma === 'feliz') {
      out.push(linea([[cu - 12, ojoV + 4], [cu - 6, ojoV - 5], [cu + 6, ojoV - 5], [cu + 12, ojoV + 4]], 6));
      return;
    }
    if (forma === 'susto') {
      out.push({d: ovalo(cu, ojoV, 13, 16), cerrado: true, w: 4.5});
      out.push({d: ovalo(cu + px * 0.8, ojoV + py * 0.8, 4, 4), relleno: true});
      return;
    }
    const ru = forma === 'grande' ? 9.5 : 8, rv = forma === 'grande' ? 14 : 12;
    out.push({d: ovalo(cu + px, ojoV + py, ru, rv), relleno: true});
    if (forma === 'medio') out.push(linea([[cu - 13, ojoV - 3], [cu + 13, ojoV - 3]], 5));
  };
  const cejas = (inc: number, alto: number) => {
    for (const lado of [-1, 1]) {
      const cu = lado * sep;
      if (!seVe(cu)) continue;
      const v0 = cejaV - alto;
      out.push(linea([[cu - lado * 12, v0 + inc * 7], [cu, v0 - 2], [cu + lado * 12, v0 - inc * 7]], 5));
    }
  };
  const boca = (forma: 'linea' | 'sonrisa' | 'o' | 'dientes' | 'triste' | 'grande' | 'ondas' | 'lado') => {
    if (!seVe(0)) return;
    const b = bocaV;
    if (forma === 'linea') out.push(linea([[-13, b], [13, b]]));
    else if (forma === 'lado') out.push(linea([[-14, b + 3], [0, b + 1], [15, b - 4]]));
    else if (forma === 'sonrisa') out.push(linea([[-17, b - 5], [-9, b + 4], [0, b + 6], [9, b + 4], [17, b - 5]]));
    else if (forma === 'triste') out.push(linea([[-16, b + 6], [-8, b - 1], [0, b - 3], [8, b - 1], [16, b + 6]]));
    else if (forma === 'o') out.push({d: ovalo(0, b + 2, 8, 11), cerrado: true, w: 5.5});
    else if (forma === 'dientes') {
      out.push({d: [en(-19, b - 8), en(19, b - 8), en(19, b + 8), en(-19, b + 8)], cerrado: true, w: 4.5});
      out.push(linea([[-19, b], [19, b]], 3.5));
      for (const du of [-7, 7]) out.push(linea([[du, b - 8], [du, b + 8]], 3.5));
    } else if (forma === 'grande') {
      out.push({d: [en(-24, b - 9), en(-12, b + 10), en(0, b + 15), en(12, b + 10), en(24, b - 9), en(0, b - 7)], cerrado: true, w: 5});
      out.push(linea([[-18, b - 4], [18, b - 4]], 3.5));
    } else if (forma === 'ondas') out.push(linea([[-18, b], [-12, b - 5], [-6, b + 5], [0, b - 5], [6, b + 5], [12, b - 5], [18, b]], 4.5));
  };
  switch (cara) {
    case 'atento': cejas(0.35, -2); ojo(-1, 'normal'); ojo(1, 'normal'); boca('linea'); break;
    case 'ilusion': cejas(-0.3, 4); ojo(-1, 'grande'); ojo(1, 'grande'); boca('sonrisa'); break;
    case 'tension': cejas(-0.5, 2); ojo(-1, 'grande'); ojo(1, 'grande'); boca('dientes'); break;
    case 'ay': cejas(-0.8, 8); ojo(-1, 'grande'); ojo(1, 'grande'); boca('o'); break;
    case 'fastidio': cejas(0.9, -3); ojo(-1, 'cerrado'); ojo(1, 'cerrado'); boca('triste'); break;
    case 'meh': cejas(0, 2); ojo(-1, 'medio'); ojo(1, 'medio'); boca('lado'); break;
    case 'susto': cejas(-0.6, 10); ojo(-1, 'susto'); ojo(1, 'susto'); boca('ondas'); break;
    case 'feliz': cejas(-0.4, 7); ojo(-1, 'feliz'); ojo(1, 'feliz'); boca('grande'); break;
    case 'serio': cejas(0.1, -1); ojo(-1, 'medio'); ojo(1, 'medio'); boca('linea'); break;
  }
  return out;
};

// ---------------------------------------------------------------- la silla de oficina (el asiento y el respaldo giran con él)
const enSilla = (pose: Pose, lx: number, h: number, lz: number): V3 => {
  const a = giroRaiz(pose);
  return [SILLA.x + lx * Math.cos(a) + lz * Math.sin(a), SUELO - h, SILLA.z - lx * Math.sin(a) + lz * Math.cos(a)];
};
export const silla = (pose: Pose) => {
  const a = giroRaiz(pose);
  const ejeX: V3 = [Math.cos(a), 0, -Math.sin(a)], ejeZ: V3 = [Math.sin(a), 0, Math.cos(a)], ejeY: V3 = [0, -1, 0];
  const yAs = SUELO - SILLA.asiento;
  const asiento = caja(enSilla(pose, 0, yAs - PLACA * 0.75, -6), [esc(ejeX, 1.5 * STUD), esc(ejeY, PLACA * 0.75), esc(ejeZ, 1.5 * STUD)]);
  const hR = ALTO * 2.1;
  const respaldo = caja(enSilla(pose, 0, yAs - 4 + hR / 2, -STUD * 1.5 - 4), [esc(ejeX, 1.5 * STUD), esc(ejeY, hR / 2), esc(ejeZ, STUD / 2)]);
  // la base: cinco patas con su rueda, el poste y su pie
  const centro: V3 = [SILLA.x, SUELO - 26, SILLA.z];
  const patas = [0, 1, 2, 3, 4].map((k) => {
    const b = (k / 5) * Math.PI * 2 + 0.3;
    const d: V3 = [Math.sin(b), 0, Math.cos(b)];
    return {de: proyecta(centro), a: proyecta(sum(centro, esc(d, STUD * 2.05))), rueda: proyecta(sum([SILLA.x, SUELO - 12, SILLA.z], esc(d, STUD * 2.1))), z: d[2]};
  });
  const poste: [P, P] = [proyecta([SILLA.x, SUELO - 40, SILLA.z]), proyecta([SILLA.x, SUELO - (yAs - PLACA * 1.5), SILLA.z])];
  return {asiento, respaldo, patas, poste};
};

// ---------------------------------------------------------------- la mesa y lo que tiene encima
export const mesa = () => {
  const top = SUELO - MESA.alto;
  const g = PLACA * 1.5;
  const cx = (MESA.x0 + MESA.x1) / 2, cz = (MESA.z0 + MESA.z1) / 2;
  const tablero = caja([cx, top + g / 2, cz], [[(MESA.x1 - MESA.x0) / 2, 0, 0], [0, -g / 2, 0], [0, 0, (MESA.z1 - MESA.z0) / 2]]);
  const patas = [MESA.x0 + 30, MESA.x1 - 30].flatMap((x) => [MESA.z0 + 30, MESA.z1 - 30].map((z) =>
    caja([x, (top + g + SUELO) / 2, z], [[STUD / 2.6, 0, 0], [0, -(SUELO - top - g) / 2, 0], [0, 0, STUD / 2.6]])));
  // el monitor, girado hacia él
  const a = 0.45;
  const ex: V3 = [Math.cos(a), 0, -Math.sin(a)], ez: V3 = [Math.sin(a), 0, Math.cos(a)];
  const base: V3 = [40, top, -170];
  const hP = PLACA + ALTO * 1.05 + 1.5 * ALTO;
  const pantalla = caja(sum(base, sum([0, -hP, 0], esc(ez, 12))), [esc(ex, 2 * STUD), [0, -1.5 * ALTO, 0], esc(ez, 15)]);
  const pie = caja(sum(base, [0, -(PLACA + ALTO * 1.1) / 2, 0]), [esc(ex, STUD / 2), [0, -(PLACA + ALTO * 1.1) / 2, 0], esc(ez, STUD / 2)]);
  const vidrio = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) =>
    proyecta(sum(sum(base, sum([0, -hP, 0], esc(ez, 28))), sum(esc(ex, u * (2 * STUD - 16)), [0, v * (1.5 * ALTO - 14), 0]))));
  // la taza, los papeles y dos bolas de otros días
  const taza = cilindro([205, top - (ALTO * 0.95) / 2, -80], [0, -1, 0], 28, ALTO * 0.95);
  const asa = aro3([236, top - ALTO * 0.5, -80], [1, 0, 0], [0, 1, 0], 16, 16);
  const papeles = caja([150, top - 14, -190], [[75, 0, 0], [0, -12, 0], [0, 0, 55]]);
  const bolas: {c: P; r: number}[] = [[-10, top - 42, -90], [60, top - 40, -60]].map((q) => ({c: proyecta(q as V3), r: 31}));
  return {tablero, patas, pantalla, pie, vidrio, taza, asa, papeles, bolas};
};

// ---------------------------------------------------------------- la papelera (en z = 0: sale en la pantalla casi tal cual)
const PB = PAPELERA;
export const papelera = () => {
  const ex: V3 = [1, 0, 0], ez: V3 = [0, 0, 1];
  const aro = (y: number, r: number, a0 = 0, a1 = Math.PI * 2, n = 56) => aro3([PB.x, y, PB.z], ex, ez, r, n, a0, a1);
  const rTop = PB.rBorde + PB.pared, rBase = PB.rBase + PB.pared;
  const yTop = PB.yBorde + PB.tubo;
  // el frente del cuerpo: la mitad de delante del borde de arriba (de la derecha a la izquierda, por delante) y la de la base de vuelta
  const cuerpo: P[] = [...aro(yTop, rTop, 0, Math.PI), ...aro(SUELO, rBase, Math.PI, 0)];
  const costillas = Array.from({length: 18}, (_, k) => (k + 0.5) / 18 * Math.PI * 2)
    .filter((a) => Math.sin(a) > 0.12)
    .map((a) => [proyecta([PB.x + Math.cos(a) * (rTop - 1), yTop + 10, Math.sin(a) * (rTop - 1)]), proyecta([PB.x + Math.cos(a) * (rBase - 1), SUELO - 8, Math.sin(a) * (rBase - 1)])] as [P, P]);
  return {
    boca: aro(PB.yBorde, PB.rBorde - PB.tubo * 0.6),
    aroAtras: aro(PB.yBorde, PB.rBorde, Math.PI, Math.PI * 2),
    aroDelante: aro(PB.yBorde, PB.rBorde, 0, Math.PI),
    aroDentro: aro(PB.yBorde, PB.rBorde - PB.tubo, 0, Math.PI * 2),
    cuerpo,
    costillas,
    base: aro(SUELO, rBase, 0, Math.PI),
    pila: proyecta([PB.x, PB.yPila, 0]),
  };
};

// ---------------------------------------------------------------- la lámpara (gira desde su gancho)
export const lampara = (ang: number) => {
  const L = LAMPARA;
  const d: P = [Math.sin(ang), Math.cos(ang)];
  const per: P = [Math.cos(ang), -Math.sin(ang)];
  const en = (l: number, s = 0): P => [L.x + d[0] * l + per[0] * s, L.yGancho + d[1] * l + per[1] * s];
  const lTop = L.largo - L.alto / 2, lBot = L.largo + L.alto / 2;
  // la pantalla: de arriba (estrecha) a abajo (ancha), con el borde de abajo curvo (se ve un poco desde arriba)
  const borde: P[] = Array.from({length: 13}, (_, j) => {
    const s = -L.rAbajo + (2 * L.rAbajo * j) / 12;
    const comba = 13 * (1 - (s / L.rAbajo) ** 2);
    return en(lBot + comba, s);
  });
  const pantalla: P[] = [en(lTop, -L.rArriba), en(lTop, L.rArriba), ...borde.reverse()];
  return {gancho: en(0), cuello: en(lTop), pantalla, bombilla: en(lBot + 14), rBombilla: 26, dir: d};
};
