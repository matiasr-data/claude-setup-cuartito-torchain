import {E, clamp, mix, rng} from '../../../comun/curvas';
import {LAMPARA, PAPELERA, PLANES, R_BOLA, SUELO, bola, centroLampara, lanzamiento, proyecta, type Golpe, type P, type V3} from '../escena';
import {ARO_MAX, N_ARO, N_ONDAS, datosAro} from './CristalEstudio';

// CRISTAL, LA LUZ QUE CUENTA LA HISTORIA. En vidrio, lo que pasa se cuenta con luz:
//   · el aro de la papelera es una guía de luz: donde lo toca la bola se enciende (y la luz se queda un instante, como una estela),
//     cada golpe lanza dos cometas que corren por dentro del aro hacia los dos lados y se cruzan al otro lado; si la bola se queda
//     quieta encima (el 9), el arco encendido crece mientras aguanta, como si se cargara… y se apaga cuando cae.
//   · cuando entra (el 10), el aro se llena entero desde donde entró y la papelera se enciende por dentro; si entra y sale (el 5), se
//     empieza a llenar y se vacía de golpe al salir.
//   · cada golpe deja destellos (estrellas de cuatro puntas) y un tintineo de destellos pequeños a lo largo del borde; cada bote en el
//     suelo, un anillo de luz que se abre; y los golpes fuertes pasan el barrido de luz por todo el estudio.
// Todo sale de lanzamiento(i, t) y de la bola en los instantes de antes: el mismo t da siempre la misma luz.

const PB = PAPELERA;
const TAU = Math.PI * 2;
const envuelve = (a: number) => a - TAU * Math.round(a / TAU);
const anguloAro = (x: number, z: number) => Math.atan2(z - PB.z, x - PB.x);
// lo lejos que está la bola del tubo del aro (0 = lo toca)
const distAro = (c: V3) => Math.hypot(Math.hypot(c[0] - PB.x, c[2] - PB.z) - PB.rBorde, c[1] - PB.yBorde) - (R_BOLA + PB.tubo);
const tocaAro = (c: V3) => distAro(c) < 5;
// un punto del aro en la pantalla (un pelo por encima del centro del tubo: lo que brilla es su lomo)
export const puntoAro = (phi: number, alto = 0.55): P => proyecta([PB.x + PB.rBorde * Math.cos(phi), PB.yBorde - PB.tubo * alto, PB.z + PB.rBorde * Math.sin(phi)]);

// ---------------------------------------------------------------- dentro: ¿se llena la papelera?
// Desde el primer bote en los papeles de dentro, el llenado crece; si la bola sale de la papelera, se vacía en un momento.
export const llenado = (i: number, t: number): {k: number; desde: number; phi: number} => {
  const g = lanzamiento(i, t).golpes.find((q) => q.tipo === 'pila');
  if (!g) return {k: 0, desde: -1, phi: 0};
  const u = t - g.t;
  let sale = -1;
  for (let s = g.t + 0.04; s <= t; s += 1 / 120) {
    const c = bola(i, s).c;
    const dentro = Math.hypot(c[0] - PB.x, c[2] - PB.z) < PB.rBorde - 6 && c[1] > PB.yBorde - 6;
    if (!dentro) {
      sale = s;
      break;
    }
  }
  const sube = (v: number) => E.outCubic(clamp(v / 0.42));
  const k = sale < 0 ? sube(u) : sube(sale - g.t) * Math.exp(-(t - sale) / 0.09);
  return {k, desde: g.t, phi: anguloAro(g.p[0], g.p[2])};
};

// ---------------------------------------------------------------- el aro: la textura de luz (N_ARO muestras alrededor)
const I = new Float32Array(N_ARO);
const suma = (phi: number, amp: number, sigma: number) => {
  if (amp < 1e-3) return;
  const s2 = 2 * sigma * sigma;
  for (let k = 0; k < N_ARO; k++) {
    const d = envuelve((k / N_ARO) * TAU - phi);
    I[k] += amp * Math.exp(-(d * d) / s2);
  }
};
// un cometa: cabeza estrecha y cola detrás (dir = hacia dónde corre)
const cometa = (cabeza: number, dir: number, amp: number) => {
  if (amp < 1e-3) return;
  for (let k = 0; k < N_ARO; k++) {
    const a = envuelve((k / N_ARO) * TAU - cabeza) * dir;
    const c = Math.exp(-(a * a) / (2 * 0.06 * 0.06));
    const cola = a < 0 ? 0.55 * Math.exp(a / 0.5) : 0;
    I[k] += amp * Math.max(c, cola);
  }
};

// la carga: si la bola se queda encima del aro, la papelera se va encendiendo mientras aguanta (y se apaga chisporroteando si cae)
export const carga = (i: number, t: number): {k: number; phi: number} => {
  const PASO = 1 / 240;
  let pegada = 0, fin = -1, finPegada = 0, phi = 0;
  for (let s = Math.max(0, t - 1.4); s <= t + 1e-6; s += PASO) {
    const c = bola(i, s).c;
    if (tocaAro(c)) {
      pegada += PASO;
      phi = anguloAro(c[0], c[2]);
      fin = -1;
    } else {
      if (pegada > 0) {
        fin = s;
        finPegada = pegada;
      }
      pegada = 0;
    }
  }
  const sube = (p: number) => E.inOutCubic(clamp((p - 0.1) / 0.62));
  if (pegada > 0) return {k: sube(pegada), phi};
  if (fin < 0) return {k: 0, phi};
  const u = t - fin;
  return {k: sube(finPegada) * Math.exp(-u / 0.11) * (0.55 + 0.45 * Math.cos(u * 75)), phi};
};

export const luzAro = (i: number, t: number): {media: number; carga: number} => {
  I.fill(0);
  // lo que brilla siempre: un hilo muy débil que dibuja el aro en lo oscuro
  for (let k = 0; k < N_ARO; k++) I[k] = 0.07;
  // 1 · la estela de donde la toca
  const PASO = 1 / 240;
  for (let s = Math.max(0, t - 0.5); s <= t + 1e-6; s += PASO) {
    const c = bola(i, s).c;
    if (!tocaAro(c)) continue;
    const u = t - s;
    const peso = (PASO / 0.13) * Math.exp(-u / 0.13);
    suma(anguloAro(c[0], c[2]), peso * 2.4, 0.09);
  }
  // … y la carga: un arco que se abre desde donde está la bola hacia los dos lados mientras aguanta, latiendo, sin llegar a cerrarse
  const cg = carga(i, t);
  if (cg.k > 0.002) {
    const abre = Math.PI * 0.9 * cg.k;
    const late = 1 + 0.3 * Math.sin(t * 2 * Math.PI * 4.2) * cg.k;
    for (let k = 0; k < N_ARO; k++) {
      const d = Math.abs(envuelve((k / N_ARO) * TAU - cg.phi));
      const dentroArco = clamp((abre - d) / 0.3);
      I[k] += cg.k * late * (1.1 * dentroArco + 1.6 * Math.exp(-Math.pow((d - abre) / 0.1, 2)));
    }
    suma(cg.phi, 1.5 * cg.k, 0.12);
  }
  // 2 · los golpes en el borde: un fogonazo donde pega y dos cometas que se van por dentro del aro
  for (const g of lanzamiento(i, t).golpes) {
    if (g.tipo !== 'borde') continue;
    const u = t - g.t;
    if (u < 0 || u > 1.2) continue;
    const f = clamp(g.fuerza / 1700, 0.35, 1.2);
    const phi = anguloAro(g.p[0], g.p[2]);
    suma(phi, 3.2 * f * Math.exp(-u / 0.07), 0.16);
    const lleva = 3.3 * (1 - Math.exp(-u / 0.32)); // se frenan al llegar al otro lado
    const amp = 2.2 * f * Math.exp(-u / 0.45);
    cometa(phi + lleva, 1, amp);
    cometa(phi - lleva, -1, amp);
    // donde se cruzan, al otro lado, un destello
    suma(phi + Math.PI, 1.6 * f * Math.exp(-Math.pow((u - 0.62) / 0.08, 2)), 0.2);
  }
  // 3 · se llena (entra) o se empieza a llenar y se vacía (entra y sale)
  const ll = llenado(i, t);
  if (ll.k > 0) {
    const u = t - ll.desde;
    const abre = Math.PI * E.outCubic(clamp(u / 0.36));
    const late = 1 + 0.14 * Math.sin(u * 13);
    for (let k = 0; k < N_ARO; k++) {
      const d = Math.abs(envuelve((k / N_ARO) * TAU - ll.phi));
      const borde = clamp((abre - d) / 0.25);
      I[k] += ll.k * (1.5 * borde * late + 2.4 * Math.exp(-Math.pow((d - abre) / 0.12, 2)) * (1 - clamp(u / 0.5)));
    }
  }
  for (let k = 0; k < N_ARO; k++) {
    const v = Math.round(clamp(I[k] / ARO_MAX) * 255);
    datosAro[k * 4] = v;
    datosAro[k * 4 + 1] = v;
    datosAro[k * 4 + 2] = v;
    datosAro[k * 4 + 3] = 255;
  }
  let total = 0;
  for (let k = 0; k < N_ARO; k++) total += I[k];
  return {media: total / N_ARO, carga: cg.k}; // lo encendido que va el aro de media (para el brillo del vidrio y las cáusticas)
};

// ---------------------------------------------------------------- el barrido: la tira de luz que cruza el estudio en cada golpe fuerte
export const barrido = (i: number, t: number): {b: number; x: number} => {
  let best = {b: 0, x: 0};
  for (const g of lanzamiento(i, t + 0.06).golpes) {
    if (!['borde', 'muro', 'lampara', 'pila'].includes(g.tipo) || g.fuerza < 500) continue;
    const u = t - (g.t - 0.06);
    if (u < 0 || u > 0.62) continue;
    const k = u / 0.62;
    const b = Math.sin(Math.PI * k) * clamp(g.fuerza / 1400, 0.5, 1.2);
    if (b > best.b) best = {b, x: mix(-1, 1, E.inOutCubic(k))};
  }
  return best;
};

// ---------------------------------------------------------------- los anillos de luz en el suelo
export type Onda = {x: number; z: number; r: number; w: number; col: [number, number, number]};
export const ondas = (i: number, t: number): Onda[] => {
  const out: Onda[] = [];
  const golpes = lanzamiento(i, t).golpes;
  for (const g of golpes) {
    const u = t - g.t;
    if (u < 0) continue;
    if (g.tipo === 'suelo' && g.fuerza > 250 && u < 0.85) {
      const k = u / 0.85;
      out.push({x: g.p[0], z: g.p[2], r: 20 + 330 * E.outCubic(k), w: clamp(g.fuerza / 2400) * 0.75 * (1 - k) ** 2, col: [1, 0.93, 0.85]});
    }
    if (g.tipo === 'borde' && u < 0.9) {
      // la luz del aro cae: un anillo rojo que se abre desde la base de la papelera
      const k = u / 0.9;
      out.push({x: PB.x, z: PB.z, r: PB.rBase + 40 + 300 * E.outCubic(k), w: clamp(g.fuerza / 2000) * 0.2 * (1 - k) ** 2, col: [1, 0.3, 0.24]});
    }
  }
  const ll = llenado(i, t);
  if (ll.k > 0) {
    for (let n = 0; n < 3; n++) {
      const u = t - ll.desde - n * 0.16;
      if (u < 0 || u > 1.0) continue;
      const k = u / 1.0;
      out.push({x: PB.x, z: PB.z, r: PB.rBase + 30 + 520 * E.outCubic(k), w: ll.k * 0.75 * (1 - k) ** 1.6, col: [1, 0.36, 0.26]});
    }
  }
  return out.sort((a, b) => b.w - a.w).slice(0, N_ONDAS);
};

// ---------------------------------------------------------------- los destellos (en la pantalla)
export type Destello = {x: number; y: number; tam: number; giro: number; a: number; col: string};
const COL_GOLPE: Record<string, string> = {borde: '#ffd9cf', papelera: '#ffd2c8', pila: '#ffe0d0', lampara: '#fff0cf', muro: '#e8f2ff', suelo: '#fff6ea', pared: '#ffffff'};
// la vida de un destello: crece muy rápido y se apaga más despacio
const vida = (u: number, dur: number) => (u < 0 || u > dur ? 0 : u < dur * 0.18 ? E.outCubic(u / (dur * 0.18)) : Math.pow(1 - (u - dur * 0.18) / (dur * 0.82), 1.6));

export const destellos = (i: number, t: number, inclina: number): Destello[] => {
  const out: Destello[] = [];
  const e = lanzamiento(i, t);
  e.golpes.forEach((g: Golpe, n: number) => {
    const u = t - g.t;
    if (u < 0 || u > 0.7) return;
    if (g.tipo === 'suelo' && g.fuerza < 900) return;
    const f = clamp(g.fuerza / 1800, 0.4, 1.15);
    const col = COL_GOLPE[g.tipo] ?? '#ffffff';
    // la estrella del golpe, donde toca
    const p = proyecta(g.p);
    const v = vida(u, 0.42);
    if (v > 0) out.push({x: p[0], y: p[1], tam: (g.tipo === 'suelo' ? 70 : 120) * f * (0.5 + 0.5 * v), giro: 8 + u * 40, a: v, col});
    // el tintineo: destellos pequeños que se encienden uno tras otro alrededor
    const R = rng(i * 1009 + n * 97 + 13);
    const cuantos = g.tipo === 'suelo' ? 3 : g.tipo === 'pila' ? 0 : 7;
    for (let k = 0; k < cuantos; k++) {
      const retraso = 0.05 + k * 0.055 + R() * 0.04;
      const w = vida(u - retraso, 0.2);
      const lado = k % 2 ? 1 : -1;
      let q: P;
      if (g.tipo === 'borde' || g.tipo === 'papelera') {
        q = puntoAro(anguloAro(g.p[0], g.p[2]) + lado * (0.25 + 0.32 * Math.floor(k / 2) + R() * 0.12), R() * 1.2);
      } else if (g.tipo === 'lampara') {
        const c = centroLampara(lanzamiento(i, t).lampara.ang);
        const a = (k / cuantos) * TAU + R();
        q = [c[0] + Math.cos(a) * LAMPARA.rAbajo * (0.6 + 0.4 * R()), c[1] + 30 + Math.sin(a) * 18];
      } else {
        q = [p[0] + (R() - 0.5) * 150, p[1] + (R() - 0.5) * 110];
      }
      if (w > 0) out.push({x: q[0], y: q[1], tam: (26 + R() * 30) * (0.5 + 0.5 * w), giro: R() * 45, a: w, col});
    }
  });
  // si la bola se queda encima del aro: chispas pequeñas debajo de ella, cada vez más seguidas mientras aguanta
  let pegada = 0;
  for (let s = Math.max(0, t - 1.2); s <= t; s += 1 / 120) pegada = tocaAro(bola(i, s).c) ? pegada + 1 / 120 : 0;
  if (pegada > 0.12) {
    const c = e.bola.c;
    const phi = anguloAro(c[0], c[2]);
    const cada = 0.11;
    const ultimo = Math.floor(pegada / cada);
    for (let k = Math.max(0, ultimo - 2); k <= ultimo; k++) {
      const R = rng(i * 733 + k * 31 + 5);
      const u = pegada - k * cada;
      const w = vida(u, 0.22);
      const q = puntoAro(phi + (R() - 0.5) * 0.7, 0.2 + R());
      if (w > 0) out.push({x: q[0], y: q[1], tam: (22 + R() * 26) * (0.6 + 0.4 * w), giro: R() * 40, a: w * 0.9, col: '#ffd6cc'});
    }
  }
  // ¡dentro!: una lluvia de destellos que sube de la boca de la papelera y le da la vuelta al aro
  const ll = llenado(i, t);
  if (ll.k > 0.05 && PLANES[i].nombre.startsWith('¡')) {
    const R0 = rng(4242);
    for (let k = 0; k < 16; k++) {
      const retraso = R0() * 0.5;
      const u = t - ll.desde - retraso;
      const w = vida(u, 0.34);
      if (w <= 0) continue;
      const phi = R0() * TAU;
      const sube = 40 + R0() * 230;
      const q = puntoAro(phi, 0.5);
      out.push({x: q[0] + (R0() - 0.5) * 40, y: q[1] - sube * E.outCubic(clamp(u / 0.34)), tam: (30 + R0() * 50) * (0.5 + 0.5 * w), giro: R0() * 45, a: w, col: k % 3 ? '#ffd2c2' : '#fff4e6'});
    }
  }
  // la papelera se ladea un poco en sus golpes: los destellos de su aro van con ella (sobre su base)
  if (Math.abs(inclina) > 1e-4) {
    const base = proyecta([PB.x, SUELO, PB.z]);
    const c = Math.cos(inclina), s = Math.sin(inclina);
    for (const d of out) {
      if (d.y > base[1]) continue;
      const dx = d.x - base[0], dy = d.y - base[1];
      d.x = base[0] + dx * c - dy * s;
      d.y = base[1] + dx * s + dy * c;
    }
  }
  return out;
};
