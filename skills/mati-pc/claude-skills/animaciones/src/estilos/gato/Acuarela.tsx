import React from 'react';
import {loadFont as cargarCaveat} from '@remotion/google-fonts/Caveat';
import {E, clamp, mix, rng, temblor} from '../../comun/curvas';
import {capsula} from '../formas';
import {
  BORDE, DUR, IMPACTO, MESA_G, MESA_Y, SUELO, TRANSFORMA_GATO, T_SUELO, arcoElipse, bigote, cafe, cinta,
  cuerpoTrazos, curva, elipse, gato, oreja, pataTrazos, piezasTaza, poli, resta, rot, suma, taza, trozos, vapor,
  type Elipse, type Gato, type P, type Pata, type Taza,
} from './escena';

// EL GATO EN 9 · ACUARELA. Cada cosa es una
// aguada con el borde roto (dos ruidos, uno fijo y otro que «hierve» cada 6 cuadros), manchas claras y oscuras dentro, el pigmento
// acumulado en el borde y el lápiz suelto un poco desplazado del color; el papel cálido con su grano, el borde rasgado y la firma.
// La cocina: la ventana con el cielo y un limonero, el reloj, la repisa con los botes y el potos, los cazos colgados, el cuadro del
// pez, los azulejos sueltos detrás de la mesa de madera, el comedero vacío, el ovillo y el suelo de baldosas frías (para que el café
// y los trozos rojos resalten). El gato, atigrado naranja con el pecho, el hocico y los calcetines crema; cada parte es una aguada
// anclada a su sitio (la textura viaja con ella) y su filtro saca el borde de pigmento y el lápiz del contorno, corrido.
// EL MOMENTO: la taza roja cae soltando el café como una aguada marrón que se abre; al romperse, el café florece en el suelo como
// una mancha mojada (blanda y clara al principio, con el borde oscuro al secarse), se corre en regueros, salpica gotas por el suelo
// y la pared, y los trozos quedan con su borde oscuro de pigmento. Encima, a lápiz, las rayas del golpe y un «¡cras!».

const {fontFamily: MANO} = cargarCaveat('normal', {weights: ['500', '700'], subsets: ['latin']});

const PAPEL = '#F8F3E8';
const BAJO_HOJA = '#D3C4A8';
const GRAFITO = '#433B35';
// el gato
const NARANJA = '#EC9F55';
const NARANJA_OSC = '#D9823F';
const LEJOS = '#D27B3C';
const RAYA = '#B4561F';
const CREMA = '#F8ECD8';
const CREMA_LEJOS = '#EAD8BE';
const ROSA = '#EDA3A2';
const NARIZ = '#DA727A';
const IRIS = '#BAC655';
// la taza y el café
const ROJO = '#C9433A';
const CAFE = '#6A3F24';
const CAFE_CLARO = '#A0703F';
const TONOS_TROZO = ['#C9433A', '#BD3A34', '#D0503F', '#C4403A', '#CC4A3E', '#B83732'];
const DESPLIEGA: P[] = [[1.5, -20], [1.45, 26], [1.4, 34], [1.5, -24], [1.7, 14], [1.35, -8]]; // [cuánto más se abren a lo ancho, en profundidad]

// ---------------------------------------------------------------- ayudas
const f1 = (n: number) => n.toFixed(1);
const ruta = (pts: P[], cerrar = false) => 'M ' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L ') + (cerrar ? ' Z' : '');
const rectD = (x: number, y: number, w: number, h: number) => `M ${f1(x)} ${f1(y)} H ${f1(x + w)} V ${f1(y + h)} H ${f1(x)} Z`;
const circD = (c: P, r: number) =>
  `M ${f1(c[0] - r)} ${f1(c[1])} A ${f1(r)} ${f1(r)} 0 1 0 ${f1(c[0] + r)} ${f1(c[1])} A ${f1(r)} ${f1(r)} 0 1 0 ${f1(c[0] - r)} ${f1(c[1])} Z`;
const elipD = (c: P, rx: number, ry: number, ang = 0) => elipse({c, rx, ry, ang});
const lerp = (a: P, b: P, k: number): P => [mix(a[0], b[0], k), mix(a[1], b[1], k)];
const esc = (a: P, k: number): P => [a[0] * k, a[1] * k];
const unit = (a: P): P => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
const suave = (q: P[]) =>
  q.map((_, i) => {
    let x = 0, y = 0, n = 0;
    for (let k = -2; k <= 2; k++) {
      const j = i + k;
      if (j < 0 || j >= q.length) continue;
      x += q[j][0];
      y += q[j][1];
      n++;
    }
    return [x / n, y / n] as P;
  });
const grados = (r: number) => ((r * 180) / Math.PI).toFixed(2);
const enE = (e: Elipse, u: number, v: number): P => suma(e.c, rot([u * e.rx, v * e.ry], e.ang));

// el pigmento acumulado: más oscuro y más saturado (una curva gamma, no un gris encima)
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const pigmento = (h: string, g = 1.8, k = 0.9) => `rgb(${rgb(h).map((v) => Math.round(255 * k * (v / 255) ** g)).join(',')})`;

// los ids de los filtros, únicos por copia (en la cortinilla se pintan dos estilos a la vez)
const useIds = () => {
  const base = 'acg' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  return React.useMemo(() => (s: string) => `${base}-${s}`, [base]);
};

// ---------------------------------------------------------------- el lápiz
// Líneas sueltas: se pasan un poco de la esquina, se curvan un pelo y nunca coinciden del todo con la mancha.
const rayaLapiz = (a: P, b: P, r: () => number, sobra = 7) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  const s0 = sobra * (0.2 + r()), s1 = sobra * (0.2 + r());
  const A: P = [a[0] - ux * s0 + (r() - 0.5) * 1.6, a[1] - uy * s0 + (r() - 0.5) * 1.6];
  const B: P = [b[0] + ux * s1 + (r() - 0.5) * 1.6, b[1] + uy * s1 + (r() - 0.5) * 1.6];
  const comba = (r() - 0.5) * Math.min(5, d * 0.025);
  const C: P = [(A[0] + B[0]) / 2 - uy * comba, (A[1] + B[1]) / 2 + ux * comba];
  return `M ${f1(A[0])} ${f1(A[1])} Q ${f1(C[0])} ${f1(C[1])} ${f1(B[0])} ${f1(B[1])}`;
};
const lineaLapiz = (pts: P[], r: () => number, cerrar = true, sobra = 6) => {
  const out: string[] = [];
  const m = cerrar ? pts.length : pts.length - 1;
  for (let i = 0; i < m; i++) out.push(rayaLapiz(pts[i], pts[(i + 1) % pts.length], r, sobra));
  return out.join(' ');
};
const aroLapiz = (c: P, rr: number, r: () => number) => {
  const n = Math.max(26, Math.round(rr * 0.45));
  const a0 = r() * Math.PI * 2, extra = 0.1 + r() * 0.12, fase = r() * 6;
  const pts: P[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (i / n) * Math.PI * 2 * (1 + extra);
    const q = rr * (1 + 0.02 * Math.sin(a * 2 + fase)) + (i / n) * 3;
    pts.push([c[0] + Math.cos(a) * q, c[1] + Math.sin(a) * q]);
  }
  return ruta(pts);
};

// ---------------------------------------------------------------- un «lienzo» para pintar una cosa: aguadas + lápiz
type Pintada = {agua: React.ReactNode[]; lapiz: string};
const lienzo = (semilla: number) => {
  const agua: React.ReactNode[] = [];
  const lapiz: string[] = [];
  const r = rng(semilla);
  let n = 0;
  const mancha = (d: string, color: string, op = 0.95, borde = 5, extra: React.SVGProps<SVGPathElement> = {}) =>
    agua.push(
      <path key={n++} d={d} fill={color} fillOpacity={op} stroke={borde ? (color.startsWith('#') ? pigmento(color) : '#6F93BC') : 'none'}
        strokeWidth={borde} strokeOpacity={0.5} strokeLinejoin="round" {...extra} />,
    );
  const raya = (d: string, color: string, w: number, op = 1) =>
    agua.push(<path key={n++} d={d} fill="none" stroke={color} strokeWidth={w} strokeOpacity={op} strokeLinecap="round" strokeLinejoin="round" />);
  const linea = (pts: P[], cerrar = true, sobra = 6) => lapiz.push(lineaLapiz(pts, r, cerrar, sobra));
  const caja = (x: number, y: number, w: number, h: number) =>
    linea([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true, Math.min(9, Math.min(w, h) * 0.3));
  const aro = (c: P, rr: number) => lapiz.push(aroLapiz(c, rr, r));
  const fin = (): Pintada => ({agua, lapiz: lapiz.join(' ')});
  return {agua, lapiz, r, mancha, raya, linea, caja, aro, fin, clave: () => n++};
};

// ---------------------------------------------------------------- la cocina (quieta: se pinta una vez por copia)
const VEN = {x: 300, y: 170, w: 460, h: 470};
const RELOJ: P = [170, 238];
const R_RELOJ = 62;
// el suelo en perspectiva: las filas de baldosas y el punto de fuga. La pared acaba más arriba que FONDO_SUELO: así, bajo la mesa,
// en vez de una banda de pared vacía hay suelo, con la cama del gato y el comedero detrás de las patas.
const PARED_FIN = 1332;
const FUGA: P = [540, 700];
const FILAS = [PARED_FIN, 1368, 1412, 1466, 1532, 1612, 1708, 1830];
const xEnFila = (X: number, y: number) => FUGA[0] + ((X - FUGA[0]) * (y - FUGA[1])) / (FILAS[0] - FUGA[1]);

type Cocina = {pared: Pintada; suelo: Pintada; mesa: Pintada};
const cocinas = new Map<string, Cocina>();
const cocina = (id: (s: string) => string): Cocina => {
  const clave = id('cocina');
  const hecha = cocinas.get(clave);
  if (hecha) return hecha;

  // ---- la pared: ventana, reloj, repisa, cazos, cuadro, azulejos y zócalo
  const L = lienzo(4242);
  const {x, y, w, h} = VEN;
  L.mancha(rectD(x - 22, y - 22, w + 44, h + 44), '#F4ECDC', 1, 4);
  L.mancha(rectD(x, y, w, h), `url(#${id('cielo')})`, 1, 6);
  // nubes: papel sin pintar, levantado del cielo
  const nube = (cx: number, cy: number, s: number) => {
    const d = [[-1, 0.15, 0.55], [-0.35, -0.25, 0.75], [0.35, -0.1, 0.65], [0.95, 0.2, 0.45], [0, 0.3, 0.6]]
      .map(([dx, dy, rr]) => circD([cx + dx * s, cy + dy * s], rr * s)).join(' ');
    L.mancha(d, '#FAF6EE', 0.95, 0);
  };
  nube(x + 118, y + 92, 44);
  nube(x + 350, y + 150, 32);
  // las colinas y el limonero
  L.mancha(`M ${x} ${y + h - 70} Q ${x + 120} ${y + h - 118} ${x + 240} ${y + h - 86} T ${x + w} ${y + h - 100} V ${y + h} H ${x} Z`, '#A6C2AC', 0.95, 3);
  ([[690, 586, 50], [732, 552, 26], [646, 608, 30], [700, 528, 34]] as [number, number, number][]).forEach(([cx, cy, rr]) =>
    L.mancha(circD([cx, cy], rr), '#7FA66A', 0.95, 4));
  ([[672, 566], [714, 598], [650, 596], [722, 540], [694, 620]] as P[]).forEach((c) => L.mancha(elipD(c, 8, 6.5, 0.4), '#EDCB45', 1, 2));
  // los barrotes y el alféizar
  L.mancha(rectD(x + w / 2 - 8, y, 16, h), '#F4ECDC', 1, 3);
  L.mancha(rectD(x, y + 206, w, 16), '#F4ECDC', 1, 3);
  L.mancha(rectD(x - 40, y + h + 22, w + 80, 22), '#E8D9BF', 1, 5);
  L.caja(x - 22, y - 22, w + 44, h + 44);
  L.caja(x, y, w, h);
  L.caja(x + w / 2 - 8, y, 16, h);
  L.caja(x, y + 206, w, 16);
  L.caja(x - 40, y + h + 22, w + 80, 22);

  // el reloj (las agujas van aparte: se mueven)
  L.mancha(circD(RELOJ, R_RELOJ - 3), '#F7F1E3', 1, 3);
  L.agua.push(<path key="reloj1" d={circD(RELOJ, R_RELOJ)} fill="none" stroke="#4F8E8C" strokeWidth={11} strokeOpacity={0.9} />);
  L.agua.push(<path key="reloj2" d={circD(RELOJ, R_RELOJ + 5)} fill="none" stroke={pigmento('#4F8E8C')} strokeWidth={3} strokeOpacity={0.5} />);
  L.aro(RELOJ, R_RELOJ + 4);
  L.aro(RELOJ, R_RELOJ - 8);
  for (let i = 0; i < 12; i += 3) {
    const a = (i / 12) * Math.PI * 2;
    const u: P = [Math.cos(a), Math.sin(a)];
    L.lapiz.push(rayaLapiz(suma(RELOJ, esc(u, R_RELOJ - 19)), suma(RELOJ, esc(u, R_RELOJ - 12)), L.r, 1));
  }

  // la repisa con los botes y el potos que cuelga
  L.mancha(rectD(54, 468, 222, 15), '#B98C5E', 1, 4);
  L.mancha(ruta([[74, 483], [100, 483], [74, 512]], true), '#A57A50', 1, 3);
  L.mancha(ruta([[230, 483], [256, 483], [256, 512]], true), '#A57A50', 1, 3);
  L.caja(54, 468, 222, 15);
  L.mancha(rectD(70, 388, 58, 80), '#CFDCDC', 0.8, 4);
  L.mancha(rectD(74, 420, 50, 46), '#DDB86C', 0.92, 0);
  L.mancha(rectD(66, 376, 66, 14), '#8B6A4C', 1, 3);
  L.caja(70, 388, 58, 80);
  L.mancha(rectD(140, 406, 46, 62), '#CFDCDC', 0.8, 4);
  L.mancha(rectD(144, 432, 38, 34), '#7C5236', 0.9, 0);
  L.mancha(rectD(137, 396, 52, 12), '#6E8F85', 1, 3);
  L.caja(140, 406, 46, 62);
  const maceta: P[] = [[206, 422], [262, 422], [255, 468], [213, 468]];
  L.mancha(ruta(maceta, true), '#C47852', 0.97, 5);
  L.mancha(rectD(202, 414, 64, 11), '#B5683F', 1, 3);
  L.linea(maceta);
  const tallos: [P, P, P][] = [
    [[248, 424], [300, 470], [292, 590]],
    [[222, 424], [196, 500], [214, 560]],
    [[236, 418], [248, 380], [226, 350]],
  ];
  tallos.forEach(([a, c, b], i) => {
    L.raya(`M ${a[0]} ${a[1]} Q ${c[0]} ${c[1]} ${b[0]} ${b[1]}`, '#557F4B', 3);
    for (let s = 0.14; s <= 1.001; s += i === 2 ? 0.3 : 0.15) {
      const q: P = [(1 - s) ** 2 * a[0] + 2 * (1 - s) * s * c[0] + s * s * b[0], (1 - s) ** 2 * a[1] + 2 * (1 - s) * s * c[1] + s * s * b[1]];
      const lado = Math.round(s * 7 + i) % 2 ? 1 : -1;
      L.mancha(elipD(suma(q, [lado * 10, 0]), 13, 8, lado * 0.6 + 0.3), lado > 0 ? '#6E9E5E' : '#5F9154', 0.95, 3);
    }
  });

  // los cazos colgados
  L.raya('M 796 226 H 1014', '#6A5E54', 7);
  L.mancha(circD([792, 226], 9), '#6A5E54', 1, 2);
  L.mancha(circD([1018, 226], 9), '#6A5E54', 1, 2);
  L.linea([[790, 226], [1018, 226]], false);
  L.mancha(capsula([864, 236], [864, 318], 7, 9), '#7A5A44', 1, 3);
  L.mancha(circD([864, 396], 80), '#C98F63', 0.97, 6);
  L.mancha(circD([864, 396], 63), '#DCA77B', 0.9, 0);
  L.raya('M 812 368 A 58 58 0 0 1 846 338', '#F6E1C6', 7, 0.8);
  L.aro([864, 396], 80);
  L.linea([[864, 232], [864, 318]], false, 3);
  L.raya('M 946 232 L 946 402', '#9AA4A9', 7);
  L.mancha(elipD([946, 428], 30, 24), '#AEB8BC', 0.97, 4);
  L.linea([[946, 232], [946, 404]], false, 3);
  L.aro([946, 428], 28);
  L.raya('M 994 232 L 994 372', '#C49A66', 8);
  L.mancha(elipD([994, 398], 16, 28), '#CFA571', 0.97, 4);
  L.linea([[994, 232], [994, 372]], false, 3);

  // el cuadro del pez
  L.mancha(rectD(824, 548, 176, 140), '#9C7451', 1, 5);
  L.mancha(rectD(838, 562, 148, 112), '#EFE8D7', 1, 3);
  L.mancha(rectD(838, 628, 148, 46), '#BCD3E1', 0.9, 0);
  L.mancha(elipD([904, 616], 42, 19), '#6F95BC', 0.97, 4);
  L.mancha(ruta([[942, 616], [968, 597], [966, 636]], true), '#6F95BC', 0.97, 3);
  L.caja(824, 548, 176, 140);
  L.caja(838, 562, 148, 112);
  L.lapiz.push(circD([882, 611], 2.6));
  L.aro([872, 588], 4);
  L.aro([864, 572], 2.5);

  // los azulejos sueltos detrás de la mesa: azul y blanco, más sueltos hacia los lados
  const ra = rng(616);
  for (let fila = 0; fila < 3; fila++) {
    for (let col = 0; col < 14; col++) {
      const cx = 56 + col * 69 + 33, cy = 800 + fila * 69 + 33;
      const lado = Math.min(col, 13 - col);
      const falta = lado === 0 ? 0.55 : lado === 1 ? 0.28 : 0.07 + (fila === 0 ? 0.1 : 0);
      const tira = ra();
      const giro = (ra() - 0.5) * 0.06, dx = (ra() - 0.5) * 4;
      if (tira < falta) continue;
      const c: P = [cx + dx, cy];
      const q = ([[-31, -31], [31, -31], [31, 31], [-31, 31]] as P[]).map((v) => suma(c, rot(v, giro)));
      L.mancha(ruta(q, true), '#F3F2EA', 0.96, 4);
      L.raya(ruta(q.map((v) => lerp(v, c, 0.13)), true), '#6E93C2', 3, 0.7);
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2 + Math.PI / 4 + giro;
        L.mancha(elipD(suma(c, [Math.cos(a) * 12, Math.sin(a) * 12]), 10, 5.5, a), '#4F78AE', 0.9, 0);
      }
      L.mancha(circD(c, 4.5), '#D8A440', 1, 0);
    }
  }
  // el zócalo
  L.mancha(rectD(52, PARED_FIN - 28, 976, 30), '#E5D5B9', 1, 4);
  L.linea([[52, PARED_FIN - 28], [1028, PARED_FIN - 28]], false);

  // ---- el suelo: baldosas frías en perspectiva (una sí, una no)
  const S = lienzo(717);
  for (let i = 0; i < FILAS.length - 1; i++) {
    for (let j = -6; j < 6; j++) {
      if ((i + j + 100) % 2) continue;
      const X0 = 540 + j * 118, X1 = X0 + 118;
      const y0 = FILAS[i], y1 = FILAS[i + 1];
      S.mancha(ruta([[xEnFila(X0, y0), y0], [xEnFila(X1, y0), y0], [xEnFila(X1, y1), y1], [xEnFila(X0, y1), y1]], true), '#AEBDC2', 0.5, 3);
    }
  }
  [FILAS[2], FILAS[4], FILAS[6]].forEach((yy) => S.linea([[60, yy], [1020, yy]], false, 2));

  // ---- la cama del gato y el comedero vacío (detrás de las patas), la mesa de madera y el ovillo
  const M = lienzo(919);
  M.mancha(elipD([300, 1432], 124, 44), '#C9A46E', 0.97, 6);
  M.raya('M 196 1444 Q 300 1478 404 1444 M 190 1428 Q 300 1462 410 1428', '#A9834F', 2.6, 0.55);
  M.mancha(elipD([300, 1414], 100, 28), '#9DBDAC', 0.97, 5);
  M.mancha(elipD([268, 1408], 46, 13, -0.1), '#B6D0C0', 0.8, 0);
  M.linea([[176, 1432], [192, 1460], [240, 1474], [300, 1477], [360, 1474], [408, 1460], [424, 1432]], false, 3);
  M.linea([[200, 1414], [232, 1396], [300, 1386], [368, 1396], [400, 1414]], false, 3);
  const cuenco: P[] = [[468, 1470], [584, 1470], [574, 1506], [478, 1506]];
  M.mancha(ruta(cuenco, true), '#6F8FB8', 0.97, 5);
  M.mancha(elipD([526, 1470], 58, 8), '#A9C0DA', 1, 3);
  M.linea(cuenco);
  M.mancha(rectD(98, MESA_Y + MESA_G, 594, 32), '#B5824F', 0.97, 5);
  const patas: P[][] = [
    [[106, MESA_Y + MESA_G], [140, MESA_Y + MESA_G], [136, SUELO], [112, SUELO]],
    [[648, MESA_Y + MESA_G], [682, MESA_Y + MESA_G], [678, SUELO], [654, SUELO]],
  ];
  patas.forEach((q) => {
    M.mancha(ruta(q, true), '#BC8A57', 0.97, 5);
    M.raya(`M ${q[0][0] + 12} ${q[0][1] + 40} L ${q[3][0] + 9} ${SUELO - 30}`, '#9C6D3E', 2.2, 0.45);
    M.linea(q);
  });
  M.mancha(rectD(42, MESA_Y, BORDE - 42, MESA_G), '#C8955D', 0.97, 7);
  M.mancha(rectD(48, MESA_Y + 2, BORDE - 54, 5), '#E4C08B', 0.9, 0);
  M.raya(`M 70 ${MESA_Y + 18} Q 300 ${MESA_Y + 14} 540 ${MESA_Y + 21} T 700 ${MESA_Y + 17}`, '#A9763F', 2.4, 0.45);
  M.raya(`M 160 ${MESA_Y + 28} Q 360 ${MESA_Y + 25} 470 ${MESA_Y + 29}`, '#A9763F', 2, 0.35);
  M.caja(42, MESA_Y, BORDE - 42, MESA_G);
  M.caja(98, MESA_Y + MESA_G, 594, 32);
  // el ovillo, con su hilo suelto
  M.mancha(circD([182, 1712], 36), '#5E93A6', 0.97, 6);
  M.raya('M 156 1690 Q 184 1700 206 1684 M 150 1712 Q 182 1726 216 1706 M 160 1736 Q 190 1740 212 1728', '#3F6F82', 3, 0.7);
  M.raya('M 214 1734 Q 270 1770 330 1752 T 420 1770', '#5E93A6', 3.5, 0.9);
  M.aro([182, 1712], 36);

  const hecha2 = {pared: L.fin(), suelo: S.fin(), mesa: M.fin()};
  cocinas.set(clave, hecha2);
  return hecha2;
};

// ---------------------------------------------------------------- el papel (quieto)
const Papel = React.memo(() => {
  const id = useIds();
  const r = rng(77);
  const fibras: string[] = [];
  for (let i = 0; i < 260; i++) {
    const x = r() * 1080, y = r() * 1920, a = r() * Math.PI, l = 8 + r() * 22, cv = (r() - 0.5) * 8;
    const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l;
    fibras.push(`M ${f1(x)} ${f1(y)} Q ${f1((x + ex) / 2 - Math.sin(a) * cv)} ${f1((y + ey) / 2 + Math.cos(a) * cv)} ${f1(ex)} ${f1(ey)}`);
  }
  return (
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <defs>
        <filter id={id('pliegues')} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.0026 0.0034" numOctaves={4} seed={5} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.66  0 0 0 0 0.56  0 0 0 0 0.42  0 0 0 1.5 -0.66" />
        </filter>
      </defs>
      <rect width={1080} height={1920} fill={PAPEL} />
      <rect width={1080} height={1920} filter={`url(#${id('pliegues')})`} opacity={0.4} />
      <path d={fibras.join(' ')} fill="none" stroke="#C9B99E" strokeWidth={0.9} strokeOpacity={0.3} />
    </svg>
  );
});

// el grano del papel, por encima de todo y multiplicando: la pintura se queda en los huecos del papel
const Grano = React.memo(() => {
  const id = useIds();
  return (
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply'}}>
      <defs>
        <filter id={id('grano')} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.36" numOctaves={2} seed={8} result="fino" />
          <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves={2} seed={3} result="grueso" />
          <feComposite in="fino" in2="grueso" operator="arithmetic" k2={0.6} k3={0.4} />
          <feColorMatrix type="matrix" values="1.3 0 0 0 0.25  1.3 0 0 0 0.23  1.3 0 0 0 0.19  0 0 0 0 1" />
        </filter>
      </defs>
      <rect width={1080} height={1920} filter={`url(#${id('grano')})`} opacity={0.34} />
    </svg>
  );
});

// el borde de la hoja, rasgado, sobre la mesa de dibujo
const ANCHO_PAPEL = 14;
const Borde = React.memo(() => {
  const id = useIds();
  const marco = `M -60 -60 H 1140 V 1980 H -60 Z M ${ANCHO_PAPEL} ${ANCHO_PAPEL} V ${1920 - ANCHO_PAPEL} H ${1080 - ANCHO_PAPEL} V ${ANCHO_PAPEL} Z`;
  return (
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <defs>
        <filter id={id('rasgado')} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={3} seed={21} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={13} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={id('sombra')} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={3} seed={21} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={13} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation={3} />
        </filter>
      </defs>
      <path d={marco} fillRule="evenodd" fill="#7A6A52" opacity={0.35} filter={`url(#${id('sombra')})`} transform="translate(3 4)" />
      <path d={marco} fillRule="evenodd" fill={BAJO_HOJA} filter={`url(#${id('rasgado')})`} />
    </svg>
  );
});

// ---------------------------------------------------------------- los filtros
// Un material (el gato): el borde roto que hierve, manchas claras y oscuras, el pigmento del borde y el lápiz del contorno, corrido.
const filtroMaterial = (id: string, semilla: number, escala: number, anillo: number, corrido: P) => (
  <filter id={id} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={3} seed={semilla} result="n" />
    <feTurbulence type="fractalNoise" baseFrequency="0.024" numOctaves={2} seed={41} result="nf" />
    <feDisplacementMap in="SourceGraphic" in2="n" scale={escala} xChannelSelector="R" yChannelSelector="G" result="d" />
    <feComposite in="nf" in2="n" operator="arithmetic" k2={0.55} k3={0.45} result="nm" />
    <feComponentTransfer in="d" result="claro">
      <feFuncR type="linear" slope={0.74} intercept={0.27} />
      <feFuncG type="linear" slope={0.74} intercept={0.27} />
      <feFuncB type="linear" slope={0.74} intercept={0.26} />
    </feComponentTransfer>
    <feColorMatrix in="nm" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 2.6 0 -1.12" result="mc" />
    <feComposite in="claro" in2="mc" operator="in" result="claros" />
    <feComponentTransfer in="d" result="osc">
      <feFuncR type="gamma" amplitude={0.94} exponent={1.4} offset={0} />
      <feFuncG type="gamma" amplitude={0.93} exponent={1.4} offset={0} />
      <feFuncB type="gamma" amplitude={0.93} exponent={1.4} offset={0} />
    </feComponentTransfer>
    <feColorMatrix in="nm" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -1.25" result="mo" />
    <feComposite in="osc" in2="mo" operator="in" result="oscuros" />
    <feMerge result="c0">
      <feMergeNode in="d" />
      <feMergeNode in="claros" />
      <feMergeNode in="oscuros" />
    </feMerge>
    <feGaussianBlur in="c0" stdDeviation={0.9} result="c" />
    <feGaussianBlur in="d" stdDeviation={6} result="b" />
    <feComposite in="d" in2="b" operator="arithmetic" k2={1} k3={-1} result="r" />
    <feComponentTransfer in="r" result="borde">
      <feFuncR type="gamma" amplitude={0.9} exponent={2} offset={0} />
      <feFuncG type="gamma" amplitude={0.88} exponent={2} offset={0} />
      <feFuncB type="gamma" amplitude={0.86} exponent={2} offset={0} />
      <feFuncA type="linear" slope={2.1} />
    </feComponentTransfer>
    <feMorphology in="SourceAlpha" operator="dilate" radius={anillo} result="dil" />
    <feComposite in="dil" in2="SourceAlpha" operator="out" result="anillo" />
    <feOffset in="anillo" dx={corrido[0]} dy={corrido[1]} result="anilloO" />
    <feFlood floodColor={GRAFITO} floodOpacity={0.72} />
    <feComposite in2="anilloO" operator="in" result="lapiz" />
    <feMerge>
      <feMergeNode in="c" />
      <feMergeNode in="borde" />
      <feMergeNode in="lapiz" />
    </feMerge>
  </filter>
);

// el café: mojado (borde muy corrido y blando, sin borde oscuro) → seco (nítido, con el pigmento acumulado en el borde)
const filtroCafe = (id: string, semilla: number, seco: number, desplaza: number) => (
  <filter id={id} x="-30%" y="-60%" width="160%" height="220%" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={3} seed={semilla} result="n" />
    <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={77} result="nf" />
    <feDisplacementMap in="SourceGraphic" in2="nf" scale={desplaza * mix(1.6, 1, seco)} xChannelSelector="R" yChannelSelector="G" result="d0" />
    <feDisplacementMap in="d0" in2="n" scale={mix(9, 4, seco)} xChannelSelector="G" yChannelSelector="B" result="d" />
    <feGaussianBlur in="d" stdDeviation={mix(4.5, 0.9, seco)} result="s" />
    <feColorMatrix in="nf" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1.5 0 0.18" result="m" />
    <feComposite in="s" in2="m" operator="in" result="c" />
    <feGaussianBlur in="d" stdDeviation={5} result="b" />
    <feComposite in="d" in2="b" operator="arithmetic" k2={1} k3={-1} result="r" />
    <feComponentTransfer in="r" result="borde">
      <feFuncR type="gamma" amplitude={0.8} exponent={1.9} offset={0} />
      <feFuncG type="gamma" amplitude={0.76} exponent={1.9} offset={0} />
      <feFuncB type="gamma" amplitude={0.76} exponent={1.9} offset={0} />
      <feFuncA type="linear" slope={mix(0.5, 2.8, seco)} />
    </feComponentTransfer>
    <feMerge>
      <feMergeNode in="c" />
      <feMergeNode in="borde" />
    </feMerge>
  </filter>
);

const Filtros: React.FC<{id: (s: string) => string; paso: number; seco: number}> = ({id, paso, seco}) => (
  <>
    {/* las dos aguadas grandes (la pared y el suelo): borde muy roto, manchas de agua y un borde de pigmento */}
    <filter id={id('fondo')} x="-6%" y="-6%" width="112%" height="112%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves={4} seed={3} result="n1" />
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={200 + paso} result="n2" />
      <feDisplacementMap in="SourceGraphic" in2="n1" scale={34} xChannelSelector="R" yChannelSelector="G" result="d1" />
      <feDisplacementMap in="d1" in2="n2" scale={6} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feComposite in="n1" in2="n2" operator="arithmetic" k2={0.8} k3={0.2} result="nm" />
      <feColorMatrix in="nm" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1.2 0 0.3" result="m" />
      <feComposite in="d" in2="m" operator="in" result="cuerpo" />
      <feComponentTransfer in="d" result="osc">
        <feFuncR type="gamma" amplitude={0.97} exponent={1.3} offset={0} />
        <feFuncG type="gamma" amplitude={0.96} exponent={1.3} offset={0} />
        <feFuncB type="gamma" amplitude={0.94} exponent={1.3} offset={0} />
      </feComponentTransfer>
      <feColorMatrix in="n1" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -1.25" result="mk" />
      <feComposite in="osc" in2="mk" operator="in" result="manchas0" />
      <feGaussianBlur in="manchas0" stdDeviation={8} result="manchas" />
      <feGaussianBlur in="d" stdDeviation={10} result="b" />
      <feComposite in="d" in2="b" operator="arithmetic" k2={1} k3={-1} result="r" />
      <feComponentTransfer in="r" result="borde">
        <feFuncR type="gamma" amplitude={0.95} exponent={1.55} offset={0} />
        <feFuncG type="gamma" amplitude={0.93} exponent={1.55} offset={0} />
        <feFuncB type="gamma" amplitude={0.9} exponent={1.55} offset={0} />
        <feFuncA type="linear" slope={1.15} />
      </feComponentTransfer>
      <feMerge result="todo">
        <feMergeNode in="cuerpo" />
        <feMergeNode in="manchas" />
        <feMergeNode in="borde" />
      </feMerge>
      <feGaussianBlur in="todo" stdDeviation={1.3} />
    </filter>
    {/* cada cosa de la cocina: borde roto fijo + el que hierve, manchas de agua */}
    <filter id={id('cosa')} x="-14%" y="-14%" width="128%" height="128%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={3} seed={12} result="n1" />
      <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves={2} seed={60 + paso} result="n2" />
      <feDisplacementMap in="SourceGraphic" in2="n1" scale={10} xChannelSelector="R" yChannelSelector="G" result="d1" />
      <feDisplacementMap in="d1" in2="n2" scale={5} xChannelSelector="G" yChannelSelector="B" result="d" />
      <feComposite in="n1" in2="n2" operator="arithmetic" k2={0.7} k3={0.3} result="nm" />
      <feComponentTransfer in="d" result="claro">
        <feFuncR type="linear" slope={0.72} intercept={0.29} />
        <feFuncG type="linear" slope={0.72} intercept={0.28} />
        <feFuncB type="linear" slope={0.72} intercept={0.25} />
      </feComponentTransfer>
      <feColorMatrix in="nm" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 2.6 0 -1.12" result="mc" />
      <feComposite in="claro" in2="mc" operator="in" result="claros" />
      <feComponentTransfer in="d" result="osc">
        <feFuncR type="gamma" amplitude={0.95} exponent={1.45} offset={0} />
        <feFuncG type="gamma" amplitude={0.93} exponent={1.45} offset={0} />
        <feFuncB type="gamma" amplitude={0.92} exponent={1.45} offset={0} />
      </feComponentTransfer>
      <feColorMatrix in="nm" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -1.25" result="mo" />
      <feComposite in="osc" in2="mo" operator="in" result="oscuros" />
      <feMerge result="c">
        <feMergeNode in="d" />
        <feMergeNode in="claros" />
        <feMergeNode in="oscuros" />
      </feMerge>
      <feGaussianBlur in="c" stdDeviation={1.1} />
    </filter>
    {filtroMaterial(id('gato'), 40 + paso, 8, 2.1, [4, -3])}
    {filtroMaterial(id('cara'), 140 + paso, 4.5, 1.9, [3, -2.5])}
    {filtroMaterial(id('taza'), 90 + paso, 6, 2, [3.5, -2.5])}
    {filtroCafe(id('cafe'), 300 + paso, seco, 16)}
    {filtroCafe(id('chorro'), 400 + paso, 0.6, 4)}
    <filter id={id('vapor')} x="-40%" y="-20%" width="180%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={9 + paso} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={14} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feGaussianBlur in="d" stdDeviation={4.5} />
    </filter>
    {[3, 8, 14].map((s) => (
      <filter key={s} id={id('b' + s)} x="-30%" y="-60%" width="160%" height="220%">
        <feGaussianBlur stdDeviation={s} />
      </filter>
    ))}
  </>
);

// una aguada anclada a su cosa: el ruido del filtro viaja (y gira) con ella, así la textura no resbala
const Anclado: React.FC<{c: P; ang?: number; filtro: string; children: React.ReactNode}> = ({c, ang = 0, filtro, children}) => (
  <g transform={`translate(${f1(c[0])} ${f1(c[1])}) rotate(${grados(ang)})`}>
    <g filter={`url(#${filtro})`}>
      <g transform={`rotate(${grados(-ang)}) translate(${f1(-c[0])} ${f1(-c[1])})`}>{children}</g>
    </g>
  </g>
);

const Cosa: React.FC<{pt: Pintada; filtro: string; op?: number}> = ({pt, filtro, op = 0.7}) => (
  <g>
    <g transform="translate(-4 3)" filter={`url(#${filtro})`}>{pt.agua}</g>
    <path d={pt.lapiz} fill="none" stroke={GRAFITO} strokeWidth={2.1} strokeOpacity={op} strokeLinecap="round" />
  </g>
);

// ---------------------------------------------------------------- el gato
// una raya del pelaje que cruza un segmento (las patas, la cola)
const rayaCruzada = (a: P, b: P, k: number, ancho: number, grosor: number) => {
  const c = lerp(a, b, k);
  const u = unit(resta(b, a));
  const n: P = [-u[1], u[0]];
  return cinta([suma(c, esc(n, -ancho)), suma(suma(c, esc(u, ancho * 0.22)), esc(n, 0)), suma(c, esc(n, ancho))], [grosor * 0.35, grosor, grosor * 0.35]);
};
const rayasCuerpo = (g: Gato): string[] => {
  const T = g.torso, C = g.cadera;
  const out: string[] = [];
  [-0.64, -0.34, -0.04, 0.26].forEach((v, i) => {
    out.push(cinta([enE(T, -1.12, v - 0.04), enE(T, -0.76, v), enE(T, -0.44, v + 0.05), enE(T, -0.16, v + 0.12)], [2, 10 - i * 0.6, 7, 1.5]));
  });
  [0.5, 0.74, 0.98].forEach((s, i) => {
    const e: Elipse = {c: enE(C, 0.12, 0.18), rx: C.rx * s, ry: C.ry * s, ang: C.ang};
    out.push(cinta(arcoElipse(e, 3.3 + i * 0.05, 4.4 - i * 0.08, 5), [1.5, 6, 8.5, 8, 5, 1.5]));
  });
  return out;
};
const rayasPata = (pt: Pata, k: number) => [
  rayaCruzada(pt.hombro, pt.codo, 0.42, 36, 6.5 * k),
  rayaCruzada(pt.hombro, pt.codo, 0.76, 30, 6 * k),
  rayaCruzada(pt.codo, pt.mano, 0.3, 26, 5.5 * k),
];
const Pata1: React.FC<{pt: Pata; filtro: string; clip: string; color: string; crema: string; k: number}> = ({pt, filtro, clip, color, crema, k}) => {
  const ds = pataTrazos(pt);
  return (
    <Anclado c={pt.hombro} filtro={filtro}>
      <defs>
        <clipPath id={clip}>{ds.slice(0, 2).map((d, i) => <path key={i} d={d} />)}</clipPath>
      </defs>
      {ds.slice(0, 2).map((d, i) => <path key={i} d={d} fill={color} />)}
      <g clipPath={`url(#${clip})`}>
        {rayasPata(pt, k).map((d, i) => <path key={i} d={d} fill={RAYA} fillOpacity={0.8 * k} />)}
      </g>
      {/* el calcetín y la mano, crema */}
      <path d={capsula(lerp(pt.codo, pt.mano, 0.64), pt.mano, 21, 18.5)} fill={crema} />
      <path d={elipse(pt.pie)} fill={crema} />
    </Anclado>
  );
};
const dedos = (pt: Pata) => {
  const {c, rx, ang} = pt.pie;
  return [0.38, 0.7].map((s) => {
    const a = suma(c, rot([rx * s, -5], ang)), b = suma(c, rot([rx * s, 8], ang));
    return `M ${f1(a[0])} ${f1(a[1])} L ${f1(b[0])} ${f1(b[1])}`;
  }).join(' ');
};

const GatoAcuarela: React.FC<{g: Gato; t: number; id: (s: string) => string}> = ({g, t, id}) => {
  const lame = t > 4.95;
  const lam = g.pecho.ang - 0.16;
  const cuerpo = cuerpoTrazos(g);
  const fG = id('gato'), fC = id('cara');
  const H = g.cabeza.c, th = g.cabeza.ang;
  const L = (lado: P, frente: P): P => suma(H, rot(lerp(lado, frente, g.giro), th));
  const rl = rng(31);

  // la cola: aros oscuros y la punta
  const cola = cinta(g.cola.pts, g.cola.r);
  const cp = g.cola.pts, cr = g.cola.r;
  const aros = [4, 7, 10, 12, 14].map((i) => rayaCruzada(cp[i - 1], cp[i + 1], 0.5, cr[i] * 1.4, 4 + i * 0.25));
  const punta = cinta(cp.slice(-3), cr.slice(-3).map((q) => q * 1.15));

  // la cabeza: las rayas de la frente (la «M») y de los mofletes, de lado y de frente
  const raya3 = (a: [P, P], b: [P, P], c: [P, P], w: number) => cinta([L(...a), L(...b), L(...c)], [w * 0.3, w, w * 0.3]);
  const rayasCara = [
    raya3([[44, -70], [0, -70]], [[45, -56], [0, -56]], [[46, -40], [0, -40]], 5),
    raya3([[24, -64], [-24, -64]], [[27, -51], [-19, -51]], [[30, -38], [-14, -38]], 4.2),
    raya3([[64, -64], [24, -64]], [[63, -52], [19, -51]], [[62, -40], [14, -38]], 4.2),
    raya3([[-62, 2], [-110, 4]], [[-46, 6], [-95, 8]], [[-30, 10], [-80, 12]], 5),
    raya3([[-58, 22], [-106, 24]], [[-43, 24], [-92, 26]], [[-28, 27], [-78, 28]], 4.6),
    raya3([[-26, -74], [-56, -58]], [[-20, -60], [-50, -48]], [[-14, -46], [-44, -38]], 4.2),
  ];
  const lejosCara = [
    raya3([[124, 2], [110, 4]], [[120, 6], [95, 8]], [[116, 10], [80, 12]], 5 * g.giro),
    raya3([[122, 22], [106, 24]], [[118, 24], [92, 26]], [[114, 27], [78, 28]], 4.6 * g.giro),
  ];

  const pataCerca = (
    <g>
      <Pata1 pt={g.pataCerca} filtro={fG} clip={id('clip-pc')} color={NARANJA} crema={CREMA} k={1} />
      <path d={dedos(g.pataCerca)} fill="none" stroke={GRAFITO} strokeWidth={2} strokeOpacity={0.65} strokeLinecap="round" transform="translate(2 -1.5)" />
    </g>
  );

  return (
    <g>
      {/* lo de detrás: la otra pata y la cola */}
      <Pata1 pt={g.pataLejos} filtro={fG} clip={id('clip-pl')} color={LEJOS} crema={CREMA_LEJOS} k={0.7} />
      <Anclado c={cp[0]} filtro={fG}>
        <defs>
          <clipPath id={id('clip-cola')}><path d={cola} /></clipPath>
        </defs>
        <path d={cola} fill="#E5934B" />
        <g clipPath={`url(#${id('clip-cola')})`}>
          {aros.map((d, i) => <path key={i} d={d} fill={RAYA} fillOpacity={0.85} />)}
          <path d={punta} fill={RAYA} fillOpacity={0.9} />
        </g>
      </Anclado>

      {/* el cuerpo, de una pieza: naranja, la sombra de la espalda, el pecho crema y las rayas */}
      <Anclado c={[300, MESA_Y]} ang={lam * 0.6} filtro={fG}>
        <defs>
          <clipPath id={id('clip-cuerpo')}>{cuerpo.map((d, i) => <path key={i} d={d} />)}</clipPath>
        </defs>
        {cuerpo.map((d, i) => <path key={i} d={d} fill={NARANJA} />)}
        <g clipPath={`url(#${id('clip-cuerpo')})`}>
          <path d={elipse({c: enE(g.cadera, -0.42, 0.38), rx: g.cadera.rx * 0.85, ry: g.cadera.ry * 0.78, ang: g.cadera.ang})} fill={NARANJA_OSC} fillOpacity={0.55} />
          <path d={elipse({c: enE(g.torso, -0.75, 0.1), rx: g.torso.rx * 0.5, ry: g.torso.ry * 0.9, ang: g.torso.ang})} fill={NARANJA_OSC} fillOpacity={0.4} />
          <path d={elipse({c: enE(g.pecho, 0.32, 0.1), rx: g.pecho.rx * 0.72, ry: g.pecho.ry * 0.84, ang: g.pecho.ang})} fill={CREMA} />
          <path d={elipse({c: suma(lerp(g.cuello[0], g.cuello[1], 0.45), [26, 0]), rx: 36, ry: 62, ang: 0.3})} fill={CREMA} />
          <path d={elipse({c: enE(g.barriga, 0.22, 0.35), rx: g.barriga.rx * 0.76, ry: g.barriga.ry * 0.6, ang: g.barriga.ang})} fill={CREMA} />
          {rayasCuerpo(g).map((d, i) => <path key={i} d={d} fill={RAYA} fillOpacity={0.82} />)}
        </g>
      </Anclado>
      <path d={curva(arcoElipse(g.cadera, -2.2, -0.35))} fill="none" stroke={GRAFITO} strokeWidth={2} strokeOpacity={0.5} strokeLinecap="round" transform="translate(3 -2)" />

      {!lame && pataCerca}

      {/* la cabeza: orejas, cabeza, rayas, hocico, el color de los ojos y la nariz */}
      <Anclado c={H} ang={th} filtro={fC}>
        <defs>
          <clipPath id={id('clip-cabeza')}><path d={elipse(g.cabeza)} /></clipPath>
        </defs>
        <path d={oreja(g.orejaLejos)} fill={NARANJA_OSC} />
        <path d={poli(g.orejaLejos.dentro)} fill={ROSA} />
        <path d={oreja(g.orejaCerca)} fill={NARANJA} />
        <path d={poli(g.orejaCerca.dentro)} fill={ROSA} />
        <path d={elipse(g.cabeza)} fill={NARANJA} />
        <g clipPath={`url(#${id('clip-cabeza')})`}>
          <path d={elipse({c: L([-52, 44], [0, 74]), rx: 84, ry: 44, ang: th})} fill={NARANJA_OSC} fillOpacity={0.45} />
          {rayasCara.map((d, i) => <path key={i} d={d} fill={RAYA} fillOpacity={0.85} />)}
          {g.giro > 0.05 && lejosCara.map((d, i) => <path key={'l' + i} d={d} fill={RAYA} fillOpacity={0.85} />)}
        </g>
        <path d={elipse(g.hocico)} fill={CREMA} />
        <path d={elipse({c: L([70, 60], [0, 60]), rx: 30, ry: 15, ang: th})} fill={CREMA} />
        {[g.ojoLejos, g.ojoCerca].map((o, i) => (!o.cerrado && o.visible.length > 2 ? <path key={i} d={poli(o.visible)} fill={IRIS} /> : null))}
        <path d={poli(g.nariz)} fill={NARIZ} />
      </Anclado>

      {/* la cara a lápiz: los ojos, la nariz, la boca, los bigotes (un poco corridos) */}
      {[g.ojoLejos, g.ojoCerca].map((o, i) =>
        o.cerrado ? (
          <path key={i} d={curva(o.arco)} fill="none" stroke={GRAFITO} strokeWidth={4} strokeLinecap="round" />
        ) : o.visible.length > 2 ? (
          <g key={i}>
            <clipPath id={id('ojo' + i)}><path d={poli(o.visible)} /></clipPath>
            <g clipPath={`url(#${id('ojo' + i)})`}>
              <path d={elipse({c: suma(o.c, rot([0, -o.ry * 0.85], o.ang)), rx: o.rx * 1.2, ry: o.ry * 0.5, ang: o.ang})} fill="#8FA23E" fillOpacity={0.55} />
              <path d={elipse(o.pupila)} fill="#2A2420" fillOpacity={0.93} />
              <circle cx={o.brillo[0]} cy={o.brillo[1]} r={6} fill="#FFFDF5" />
              <circle cx={o.brillo[0] + 9} cy={o.brillo[1] + 11} r={2.6} fill="#FFFDF5" fillOpacity={0.8} />
            </g>
            <path d={poli(o.visible)} fill="none" stroke={GRAFITO} strokeWidth={3} strokeLinejoin="round" transform="translate(1.5 -1)" />
          </g>
        ) : null,
      )}
      <g transform="translate(2 -1.5)" fill="none" stroke={GRAFITO} strokeLinecap="round" strokeLinejoin="round">
        <path d={poli(g.nariz)} strokeWidth={2} strokeOpacity={0.8} />
        <path d={`M ${f1(g.surco[0][0])} ${f1(g.surco[0][1])} L ${f1(g.surco[1][0])} ${f1(g.surco[1][1])}`} strokeWidth={2} strokeOpacity={0.8} />
        <path d={curva(g.boca)} strokeWidth={2.6} strokeOpacity={0.85} />
        {g.bigotes.map((b, i) => <path key={i} d={bigote(b)} strokeWidth={1.7} strokeOpacity={0.7} />)}
        {[g.orejaLejos, g.orejaCerca].map((o, i) => {
          const m = lerp(o.base[0], o.base[1], 0.5);
          return (
            <path key={'o' + i} strokeWidth={1.4} strokeOpacity={0.5}
              d={`${rayaLapiz(lerp(lerp(m, o.base[0], 0.4), o.punta, 0.18), lerp(o.bc, o.punta, 0.55), rl, 2)} ${rayaLapiz(lerp(lerp(m, o.base[1], 0.4), o.punta, 0.18), lerp(o.bc, o.punta, 0.5), rl, 2)}`} />
          );
        })}
      </g>

      {lame && pataCerca}
      {g.lengua && <path d={elipse(g.lengua)} fill="#E27D83" stroke={GRAFITO} strokeWidth={1.6} strokeOpacity={0.6} />}
    </g>
  );
};

// ---------------------------------------------------------------- la taza
const enTaza = (tz: {c: P; ang: number}, q: P): P => suma(tz.c, rot(q, tz.ang));
const SILUETA_TAZA: P[] = [[-52, -59], [52, -59], [52, 45], [38, 59], [-38, 59], [-52, 45]];
const TazaAcuarela: React.FC<{tz: Taza; id: (s: string) => string}> = ({tz, id}) => {
  const pz = piezasTaza(tz);
  const r = rng(5);
  const lado = (x0: number, y0: number, x1: number, y1: number) => ruta(([[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as P[]).map((q) => enTaza(tz, q)), true);
  return (
    <g>
      <Anclado c={tz.c} ang={tz.ang} filtro={id('taza')}>
        <path d={poli(pz.asa)} fill={ROJO} />
        <path d={poli(pz.cuerpo)} fill={ROJO} />
        <path d={lado(22, -50, 50, 44)} fill="#9E2C2A" fillOpacity={0.4} />
        <path d={lado(-38, -46, -26, 36)} fill="#FBF3E6" fillOpacity={0.55} />
        <path d={lado(-52, -59, 52, -49)} fill="#F4E5CF" />
      </Anclado>
      <path d={`${lineaLapiz(SILUETA_TAZA.map((q) => enTaza(tz, q)), r, true, 4)} ${lineaLapiz(pz.asaFuera, r, false, 2)} ${lineaLapiz([enTaza(tz, [-52, -49]), enTaza(tz, [52, -49])], r, false, 2)}`}
        fill="none" stroke={GRAFITO} strokeWidth={2.2} strokeOpacity={0.75} strokeLinecap="round" transform="translate(3 -2)" />
    </g>
  );
};

// ---------------------------------------------------------------- el café en el suelo: la mancha que florece
const SC: P = [IMPACTO[0] - 50, SUELO + 14]; // su centro
const PERSP = 0.42; // el suelo, en perspectiva
const ANCHO = 0.95;
const FASES = (() => {
  const r = rng(313);
  return Array.from({length: 5}, () => r() * Math.PI * 2);
})();
// se abre deprisa al chocar (medio segundo, para que se VEA abrirse) y después se sigue corriendo despacio
const radioMancha = (s: number) => 24 + 150 * E.outCubic(clamp(s / 0.45)) + 34 * E.outCubic(clamp((s - 0.4) / 2.4));
const contorno = (a: number, lobulos = 1) =>
  1 - 0.1 * Math.cos(a) + lobulos * (0.11 * Math.sin(2 * a + FASES[0]) + 0.09 * Math.sin(5 * a + FASES[1]) + 0.06 * Math.sin(9 * a + FASES[2])
    + 0.04 * Math.sin(14 * a + FASES[3]) + 0.2 * Math.exp(-(((a - 2.75) / 0.13) ** 2)) + 0.15 * Math.exp(-(((a - 1.0) / 0.11) ** 2)));
const enSuelo = (a: number, d: number, c: P = SC): P => [c[0] + Math.cos(a) * d * ANCHO, c[1] + Math.sin(a) * d * PERSP];
const formaMancha = (R: number, lobulos = 1, c: P = SC): P[] =>
  Array.from({length: 72}, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    return enSuelo(a, R * contorno(a, lobulos), c);
  });
// los regueros: el café que se corre por el suelo
const REGUEROS = [
  {a: 2.95, l: 70, w: 10}, {a: 0.25, l: 46, w: 9}, {a: 1.75, l: 50, w: 9}, {a: 2.3, l: 58, w: 8}, {a: -2.6, l: 40, w: 7}, {a: 1.15, l: 44, w: 8},
];
// las flores (las «coliflores»): agua que vuelve hacia dentro y empuja el pigmento a su borde
const FLORES = [
  {a: 0.55, f: 0.62, r: 32, t0: 0.4}, {a: 3.3, f: 0.6, r: 28, t0: 0.65}, {a: 1.55, f: 0.3, r: 36, t0: 0.9}, {a: -1.4, f: 0.5, r: 24, t0: 1.2},
  {a: 2.4, f: 0.72, r: 22, t0: 1.5},
];
// las gotas gordas que salen volando al romperse (cada una cae a su profundidad del suelo y deja su mancha)
const G_GOTA = 4200;
const GOTAS_GORDAS = (() => {
  const r = rng(4321);
  return Array.from({length: 10}, (_, i) => {
    const lado = i % 2 ? 1 : -1;
    const v: P = [lado * (220 + r() * 560), -(560 + r() * 600)];
    const suelo = SUELO + 4 + (r() - 0.3) * 120;
    const p0: P = [IMPACTO[0] - 6 + lado * 22, SUELO - 16];
    const tl = (-v[1] + Math.sqrt(v[1] * v[1] + 2 * G_GOTA * (suelo - p0[1]))) / G_GOTA;
    return {p0, v, r: 8 + r() * 7, suelo, tl, cae: [p0[0] + v[0] * tl, suelo] as P};
  }).filter((g) => g.cae[0] > 90 && g.cae[0] < 1000);
})();
const gotaGorda = (g: (typeof GOTAS_GORDAS)[number], t: number) => {
  const s = t - T_SUELO;
  if (s < 0 || s >= g.tl) return null;
  const c: P = [g.p0[0] + g.v[0] * s, g.p0[1] + g.v[1] * s + 0.5 * G_GOTA * s * s];
  return {c, ang: Math.atan2(g.v[1] + G_GOTA * s, g.v[0])};
};
// las salpicaduras: gotas que llegan al suelo, alargadas en la dirección en la que salieron
type Salpica = {c: P; r: number; ang: number; t0: number};
const SALPICAS: Salpica[] = (() => {
  const r = rng(909);
  const out: Salpica[] = GOTAS_GORDAS.map((g) => ({c: g.cae, r: g.r * 0.95, ang: g.v[0] > 0 ? 0 : Math.PI, t0: T_SUELO + g.tl}));
  for (let i = 0; i < 52; i++) {
    const a = r() * Math.PI * 2;
    const d = 200 * (1.05 + r() ** 0.8 * 0.95);
    const c = enSuelo(a, d);
    const s = (2.4 + r() * 6.5) * (1.3 - (d - 210) / 380);
    const ang = Math.atan2(Math.sin(a) * PERSP, Math.cos(a) * ANCHO);
    if (c[0] > 1010 || c[0] < 70 || c[1] < PARED_FIN + 12 || c[1] > 1826) continue;
    out.push({c, r: s, ang, t0: T_SUELO + 0.03 + d / 2400});
  }
  return out;
})();

const ManchaCafe: React.FC<{t: number; manchas: ReturnType<typeof cafe>['manchas']; id: (s: string) => string; seco: number}> = ({t, manchas, id, seco}) => {
  const s = t - T_SUELO;
  if (s < 0) return null;
  const R = radioMancha(s);
  return (
    <g>
      {/* el agua, que se abre antes que el color y se va secando */}
      <path d={ruta(formaMancha(R * 1.2 + 18, 0.7), true)} fill={CAFE_CLARO} fillOpacity={0.24 * (1 - 0.55 * seco)} filter={`url(#${id('b8')})`} />
      <g filter={`url(#${id('cafe')})`}>
        <path d={ruta(formaMancha(R), true)} fill="#7C4B29" fillOpacity={mix(0.8, 0.7, seco)} />
        {/* donde cayó, más pigmento */}
        <path d={ruta(formaMancha(R * 0.42, 1.3, [SC[0] + 20, SC[1] - 4]), true)} fill={CAFE} fillOpacity={0.5} />
        {REGUEROS.map((rg, i) => {
          const k = E.outCubic(clamp((s - 0.25 - i * 0.07) / 1.8));
          if (k < 0.03) return null;
          const R0 = R * contorno(rg.a) * 0.9;
          const pts = [0, 0.35, 0.7, 1].map((f) => enSuelo(rg.a + Math.sin(f * 5 + i) * 0.05 * f, R0 + f * rg.l * k));
          return <path key={i} d={cinta(pts, [rg.w, rg.w * 0.8, rg.w * 0.6, rg.w * 0.4].map((q) => q * mix(0.6, 1, k)))} fill="#7C4B29" fillOpacity={0.85} />;
        })}
        {manchas.map((m) => (
          <path key={m.i} d={elipD(m.c, m.rx * 1.2, m.ry * 1.4)} fill={CAFE} fillOpacity={0.85} />
        ))}
        {SALPICAS.map((sp, i) => {
          const k = E.outBack(clamp((t - sp.t0) / 0.09));
          if (k <= 0.01) return null;
          const cola = suma(sp.c, rot([-sp.r * 2.6, 0], sp.ang));
          return (
            <g key={'s' + i}>
              <path d={elipD(sp.c, sp.r * 1.6 * k, sp.r * 0.85 * k, sp.ang)} fill={CAFE} fillOpacity={0.9} />
              {sp.r > 4 && <path d={circD(cola, sp.r * 0.35 * k)} fill={CAFE} fillOpacity={0.85} />}
            </g>
          );
        })}
        {/* las flores, más claras, con su borde oscuro */}
        {FLORES.map((fl, i) => {
          const k = E.outCubic(clamp((s - fl.t0) / 1.3));
          if (k < 0.04) return null;
          const c = enSuelo(fl.a, R * fl.f);
          const rr = fl.r * k;
          const pts = Array.from({length: 24}, (_, j) => {
            const a = (j / 24) * Math.PI * 2;
            return enSuelo(a, rr * (1 + 0.22 * Math.sin(5 * a + i * 2) + 0.12 * Math.sin(11 * a + i)), c);
          });
          return <path key={'f' + i} d={ruta(pts, true)} fill={CAFE_CLARO} fillOpacity={0.7} stroke={pigmento(CAFE)} strokeWidth={2.4} strokeOpacity={0.7} />;
        })}
      </g>
    </g>
  );
};

// la corona del golpe: una salpicadura con puntas que sube, se abre y vuelve a caer en gotas
const PUNTAS = (() => {
  const r = rng(1201);
  return Array.from({length: 13}, (_, i) => ({a: ((196 + (i / 12) * 148 + (r() - 0.5) * 10) * Math.PI) / 180, l: 80 + r() * 80, w: 11 + r() * 7}));
})();
const Corona: React.FC<{t: number}> = ({t}) => {
  const s = t - T_SUELO;
  if (s < 0 || s > 0.45) return null;
  const sube = E.outCubic(clamp(s / 0.1));
  const cae = clamp((s - 0.1) / 0.35);
  const base: P = [IMPACTO[0] - 6, SUELO - 6];
  const rx = 56 + 56 * sube, ry = 18;
  return (
    <g>
      <path d={elipD(base, rx, ry * (1 - 0.6 * cae))} fill={CAFE} fillOpacity={0.85 * (1 - cae)} />
      {PUNTAS.map((pt, i) => {
        const u: P = [Math.cos(pt.a), Math.sin(pt.a)];
        const raiz: P = [base[0] + u[0] * rx * 0.85, base[1] + u[1] * ry * 0.6];
        const largoP = pt.l * sube * (1 - cae ** 0.7);
        const punta: P = [raiz[0] + u[0] * largoP, raiz[1] + u[1] * largoP];
        // la gota de la punta se suelta y cae
        const gota: P = [raiz[0] + u[0] * pt.l * (0.9 + 0.5 * cae), raiz[1] + u[1] * pt.l * (0.9 + 0.2 * cae) + 520 * cae * cae];
        return (
          <g key={i}>
            {largoP > 3 && <path d={cinta([raiz, lerp(raiz, punta, 0.55), punta], [pt.w * 0.5, pt.w * 0.32, pt.w * 0.18])} fill={CAFE} fillOpacity={0.9} />}
            {sube > 0.6 && gota[1] < SUELO + 8 && <circle cx={cae > 0.05 ? gota[0] : punta[0]} cy={cae > 0.05 ? gota[1] : punta[1]} r={pt.w * 0.42} fill={CAFE} fillOpacity={0.9} />}
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- la escena
export const Acuarela: React.FC<{t: number}> = ({t: tt}) => {
  const id = useIds();
  const t = clamp(tt, 0, DUR);
  const paso = Math.floor(t * 10 + 1e-6) % 60; // las aguadas cambian cada 6 cuadros (a 60 fps)
  const g = gato(t);
  const tz = taza(t);
  const cf = cafe(t);
  const tr = trozos(t);
  const vp = vapor(t);
  const coc = cocina(id);
  const seco = E.outCubic(clamp((t - T_SUELO - 0.12) / 1.5));
  const [sx, sy] = temblor(t, T_SUELO, 0.3, 7, 5);

  // el chorro: las gotas de la boca de la taza, unidas en tramos; se abren (más anchas) según se alejan
  // (rota la taza, lo que queda en el aire se va al charco enseguida: así no queda una columna de gotas colgando)
  const chorro = cf.gotas
    .filter((d) => d.i < 100)
    .map((d) => (t > T_SUELO ? {...d, c: [d.c[0], d.c[1] + 3200 * (t - T_SUELO) ** 2] as P} : d))
    .filter((d) => d.c[1] < SUELO + 6);
  const tramos: {c: P; r: number; edad: number}[][] = [];
  chorro.forEach((d, i) => {
    const edad = Math.max(0, t - (2.76 + 0.27 * (d.i / 37) ** 0.9));
    const q = {c: d.c, r: d.r, edad};
    if (i === 0 || Math.hypot(d.c[0] - chorro[i - 1].c[0], d.c[1] - chorro[i - 1].c[1]) > 80) tramos.push([]);
    tramos[tramos.length - 1].push(q);
  });

  // el golpe a lápiz y el «¡cras!»
  const fueraChorro = 1 - clamp((t - T_SUELO) / 0.08);
  const kGolpe = clamp((t - T_SUELO) / 0.09);
  const fueraGolpe = 1 - clamp((t - T_SUELO - 0.25) / 0.4);
  const kCras = E.outBack(clamp((t - T_SUELO - 0.07) / 0.18));
  // la sombra de la taza en el suelo, que crece según se acerca
  const kSombra = tz.estado === 'cae' ? clamp((tz.c[1] - 1150) / 400) : 0;

  // las agujas del reloj
  const aSeg = ((t + 31) / 60) * Math.PI * 2 - Math.PI / 2;
  const aMin = ((10 + t / 60) / 60) * Math.PI * 2 - Math.PI / 2;
  const aHora = ((8 + 10 / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  const aguja = (a: number, l: number) => `M ${f1(RELOJ[0])} ${f1(RELOJ[1])} L ${f1(RELOJ[0] + Math.cos(a) * l)} ${f1(RELOJ[1] + Math.sin(a) * l)}`;

  return (
    <div style={{position: 'absolute', inset: 0, background: BAJO_HOJA, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${(sx / 2).toFixed(2)}px, ${(sy / 2).toFixed(2)}px)`}}>
        <Papel />
        <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
          <defs>
            <Filtros id={id} paso={paso} seco={seco} />
            <linearGradient id={id('pared')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#EED7AD" />
              <stop offset="0.5" stopColor="#F1E0C1" />
              <stop offset="1" stopColor="#F3E8D3" />
            </linearGradient>
            <linearGradient id={id('suelo')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#CDD6D5" />
              <stop offset="1" stopColor="#E0E4DE" />
            </linearGradient>
            <linearGradient id={id('cielo')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7FA7D0" />
              <stop offset="0.55" stopColor="#A9C6E0" />
              <stop offset="1" stopColor="#D3E1E9" />
            </linearGradient>
            <linearGradient id={id('sombra-mesa')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8F7A5E" stopOpacity={0.5} />
              <stop offset="1" stopColor="#8F7A5E" stopOpacity={0} />
            </linearGradient>
            <clipPath id={id('hoja')}>
              <rect x={20} y={20} width={1040} height={1880} />
            </clipPath>
          </defs>

          <g clipPath={`url(#${id('hoja')})`}>
            {/* la pared y el suelo: dos aguadas, con el zócalo entre las dos */}
            <g filter={`url(#${id('fondo')})`}>
              <rect x={52} y={92} width={976} height={PARED_FIN + 8 - 92} fill={`url(#${id('pared')})`} />
              <rect x={40} y={PARED_FIN - 6} width={1000} height={1836 - PARED_FIN + 6} fill={`url(#${id('suelo')})`} />
            </g>

            {/* la pared: ventana, reloj, repisa, cazos, cuadro y azulejos */}
            <Cosa pt={coc.pared} filtro={id('cosa')} />
            <path d={`${aguja(aHora, 30)} ${aguja(aMin, 44)}`} stroke={GRAFITO} strokeWidth={5} strokeOpacity={0.85} strokeLinecap="round" />
            <path d={aguja(aSeg, 48)} stroke="#B4473C" strokeWidth={2} strokeOpacity={0.8} strokeLinecap="round" />

            {/* el suelo */}
            <Cosa pt={coc.suelo} filtro={id('cosa')} op={0.35} />

            {/* la sombra de la mesa en la pared y en el suelo */}
            <g filter={`url(#${id('b14')})`}>
              <rect x={100} y={1078} width={590} height={170} fill={`url(#${id('sombra-mesa')})`} />
              <ellipse cx={395} cy={1470} rx={300} ry={110} fill="#7F8C93" fillOpacity={0.16} />
              <ellipse cx={300} cy={1462} rx={130} ry={22} fill="#6F7C83" fillOpacity={0.3} />
              <ellipse cx={124} cy={1602} rx={34} ry={8} fill="#5F6C73" fillOpacity={0.45} />
              <ellipse cx={666} cy={1602} rx={34} ry={8} fill="#5F6C73" fillOpacity={0.45} />
              <ellipse cx={186} cy={1748} rx={46} ry={10} fill="#5F6C73" fillOpacity={0.4} />
              {kSombra > 0 && <ellipse cx={tz.c[0] + 10} cy={SUELO + 6} rx={26 + 34 * kSombra} ry={7 + 5 * kSombra} fill="#56636A" fillOpacity={0.45 * kSombra} />}
            </g>

            {/* el café en el suelo (detrás de las patas de la mesa) */}
            <ManchaCafe t={t} manchas={cf.manchas} id={id} seco={seco} />

            {/* la mesa, el comedero y el ovillo */}
            <Cosa pt={coc.mesa} filtro={id('cosa')} />
            <g filter={`url(#${id('b3')})`}>
              <ellipse cx={330} cy={MESA_Y + 4} rx={200} ry={6} fill="#7E5A38" fillOpacity={0.35} />
              {tz.estado === 'mesa' && <ellipse cx={tz.c[0] + 6} cy={MESA_Y + 3} rx={52} ry={5} fill="#7E5A38" fillOpacity={0.4} />}
            </g>

            {/* el vapor: lavados suaves que suben */}
            <g filter={`url(#${id('vapor')})`}>
              {vp.map((h, i) => (
                <g key={i} opacity={h.alfa * (t > T_SUELO ? 0.55 : 1)}>
                  <path d={curva(h.pts)} fill="none" stroke="#A7B0C3" strokeWidth={22} strokeOpacity={0.5} strokeLinecap="round" />
                  <path d={curva(h.pts.slice(0, 11))} fill="none" stroke="#FFFDF6" strokeWidth={8} strokeOpacity={0.6} strokeLinecap="round" />
                </g>
              ))}
            </g>

            {/* la taza, entera mientras no llega al suelo */}
            {tz.estado !== 'suelo' && <TazaAcuarela tz={tz} id={id} />}

            {/* EL GATO */}
            <g transform={TRANSFORMA_GATO}>
              <GatoAcuarela g={g} t={t} id={id} />
            </g>

            {/* el café en el aire: una aguada marrón que se abre */}
            <g filter={`url(#${id('chorro')})`}>
              {fueraChorro > 0 && tramos.filter((q) => q.length > 2).map((q, i) => {
                // una lengua de café pegada a la boca que, según se aleja, se abre en una aguada clara y se rompe en gotas
                const pts = suave(suave(q.map((d) => d.c)));
                const a = pts[0], b = pts[pts.length - 1];
                return (
                  <g key={i} opacity={fueraChorro}>
                    <defs>
                      <linearGradient id={id('chg' + i)} gradientUnits="userSpaceOnUse" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}>
                        <stop offset="0" stopColor="#946239" stopOpacity={0.2} />
                        <stop offset="0.5" stopColor="#8A5A33" stopOpacity={0.62} />
                        <stop offset="1" stopColor={CAFE} stopOpacity={0.92} />
                      </linearGradient>
                    </defs>
                    <path d={cinta(pts, q.map((d) => d.r * (1 + 3.6 * d.edad)))} fill={`url(#${id('chg' + i)})`} />
                    <path d={cinta(pts, q.map((d) => 0.5 + d.r * 0.55 * (1 - clamp(d.edad / 0.2))))} fill={CAFE} fillOpacity={0.85} />
                  </g>
                );
              })}
              {chorro.filter((d) => t > T_SUELO || t - (2.76 + 0.27 * (d.i / 37) ** 0.9) > 0.1).map((d) => (
                <circle key={d.i} cx={d.c[0]} cy={d.c[1]} r={d.r * 0.42} fill={CAFE} fillOpacity={0.85} />
              ))}
              {cf.gotas.filter((d) => d.i >= 100).map((d) => (
                <circle key={d.i} cx={d.c[0]} cy={d.c[1]} r={d.r * 0.95} fill={CAFE} fillOpacity={0.92} />
              ))}
              {GOTAS_GORDAS.map((g, i) => {
                const q = gotaGorda(g, t);
                return q ? <path key={'gg' + i} d={elipD(q.c, g.r * 1.35, g.r * 0.8, q.ang)} fill={CAFE} fillOpacity={0.92} /> : null;
              })}
              <Corona t={t} />
            </g>

            {/* los trozos de la taza, con su borde oscuro */}
            {tr.map((q) => {
              // cada trozo, su aguada con su borde oscuro y su lápiz; un pelo más pequeños para que se lean las grietas, y más
              // repartidos por el suelo (a lo ancho y en profundidad) para que no se amontonen en dos manchas
              const [ex, ey] = DESPLIEGA[q.n - 1];
              const mueve: P = [(q.c[0] - IMPACTO[0]) * (ex - 1), ey * E.outCubic(clamp((t - T_SUELO) / 0.35))];
              const c = suma(q.c, mueve);
              const pts = q.pts.map((v) => lerp(c, suma(v, mueve), 0.86));
              return (
                <Anclado key={q.n} c={c} ang={q.ang} filtro={id('taza')}>
                  <path d={poli(pts)} fill={TONOS_TROZO[q.n - 1]} />
                  <path d={poli(pts.map((v) => lerp(v, suma(c, [-8, -10]), 0.45)))} fill="#E46A55" fillOpacity={0.35} />
                </Anclado>
              );
            })}

            {/* el golpe, a lápiz */}
            {kGolpe > 0 && fueraGolpe > 0 && (
              <g opacity={fueraGolpe} stroke={GRAFITO} strokeWidth={3.2} strokeLinecap="round" fill="none">
                {[198, 222, 246, 270, 294, 318, 342].map((a, i) => {
                  const u: P = [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)];
                  const r0 = 92 + (i % 2) * 18, r1 = r0 + 54 * kGolpe;
                  return <path key={i} d={`M ${f1(IMPACTO[0] + u[0] * r0)} ${f1(SUELO - 20 + u[1] * r0 * 0.8)} L ${f1(IMPACTO[0] + u[0] * r1)} ${f1(SUELO - 20 + u[1] * r1 * 0.8)}`} />;
                })}
              </g>
            )}
            {kCras > 0 && (
              <g transform={`translate(900 1286) rotate(-9) scale(${f1(Math.max(0.01, kCras))})`}>
                <text x={0} y={0} fontFamily={MANO} fontWeight={700} fontSize={98} textAnchor="middle" fill={CAFE} fillOpacity={0.92}>¡cras!</text>
              </g>
            )}

            {/* la nota y la firma */}
            <text x={70} y={1880} fontFamily={MANO} fontSize={36} fill={GRAFITO} fillOpacity={0.55} transform="rotate(-2 70 1880)">la cocina, 8 nov</text>
            <text x={1010} y={1884} fontFamily={MANO} fontSize={40} fill={GRAFITO} fillOpacity={0.62} textAnchor="end" transform="rotate(-3 1010 1884)">Claude</text>
          </g>
        </svg>
        <Grano />
        <Borde />
      </div>
    </div>
  );
};
