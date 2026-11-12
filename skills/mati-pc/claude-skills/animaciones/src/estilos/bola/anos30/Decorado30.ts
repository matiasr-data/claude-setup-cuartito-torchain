import {clamp, mix} from '../../../comun/curvas';
import {LAMPARA, MESA, MURO_X, PAPELERA, SUELO, Z_PARED, centroLampara, proyecta, type V3} from '../escena';
import {G, TINTA, afMul, afEsc, afRot, afTras, ap, apl, arco, elipse, quad, rect, rr, spline, type Af, type Lienzo, type P} from './tinta';
import {boca, nota, ojo, type TipoBoca, type TipoOjo} from './partes';

// EL DECORADO EN DIBUJO DE LOS AÑOS 30. La misma oficina que la de los bloques, cada cosa en su sitio (la
// ventana arriba a la izquierda, el cuadro de la diana arriba a la derecha con la balda de libros debajo, la mesa a la izquierda, la
// lámpara colgando y la papelera en el centro), pintada como un fondo de los 30: la pared en gris medio con papel de rayas y
// rombitos, el zócalo de paneles, el suelo de damero en perspectiva, y el telón del fondo quieto (los fondos no hierven). Lo que
// vive va aparte y respira al compás: las cortinas, el cuadro que se mece, los libros que bailan, la radio que canta (con sus notas),
// la lámpara con sus ojos y la papelera, que tiene cara y mira la bola.

const pr = (v: V3): P => proyecta(v);
const LF = '#2A2927'; // la línea de los fondos: más fina y más gris que la de los personajes
const LWF = 4.5;
const PB = PAPELERA;

// ---------------------------------------------------------------- el telón de fondo (quieto: se pinta una vez)
// la pared del fondo está en z = Z_PARED; aquí, la altura del mundo de cada cosa
const Y_MOLDURA = 1250; // la moldura del zócalo
const Y_RODAPIE = 1535; // arriba del rodapié
const enPared = (x: number, y: number): P => pr([x, y, Z_PARED]);
const enMuro = (y: number, z: number): P => pr([MURO_X, y, z]);

export const pintaFondo = (L: Lienzo) => {
  const op = {lw: LWF, linea: LF, hierve: 0};
  const sueloY = enPared(0, SUELO)[1];
  // la pared: gris medio con rayas un pelo más claras y rombitos
  L.forma(1, rect(-20, -20, 1120, sueloY + 20), {relleno: '#8C8981', linea: null, hierve: 0});
  for (let x = 6; x < 1080; x += 72) L.forma(2 + x, rect(x, -20, 26, sueloY), {relleno: '#96938B', linea: null, hierve: 0});
  for (let x = 42, f = 0; x < 1080; x += 72, f++) {
    for (let y = 40 + (f % 2) * 55; y < enPared(0, Y_MOLDURA)[1] - 20; y += 110) {
      L.forma(3 + x * 0.1 + y, [[x, y - 9], [x + 7, y], [x, y + 9], [x - 7, y]], {relleno: '#73706A', linea: null, hierve: 0});
    }
  }
  // el zócalo: la moldura, los paneles y el rodapié
  const yM = enPared(0, Y_MOLDURA)[1], yR = enPared(0, Y_RODAPIE)[1];
  L.forma(10, rect(-20, yM, 1120, yR - yM), {relleno: '#77746D', ...op});
  for (let x = -40; x < 1080; x += 190) {
    L.forma(11 + x, rr(x + 18, yM + 34, 154, yR - yM - 66, 6), {relleno: '#827F78', lw: 3.5, linea: LF, hierve: 0});
    L.trazo(12 + x, [[x + 26, yR - 30], [x + 164, yR - 30], [x + 164, yM + 42]], 3, {linea: '#5D5B56', hierve: 0});
  }
  L.forma(13, rect(-20, yM - 14, 1120, 24), {relleno: '#A9A69E', ...op});
  L.forma(14, rect(-20, yR, 1120, sueloY - yR), {relleno: '#4F4D48', ...op});

  // la pared de la derecha (la del fallo 2), en sombra, con su zócalo
  const zLejos = Z_PARED, zCerca = 900;
  const muro = [enMuro(-200, zLejos), enMuro(-200, zCerca), enMuro(SUELO, zCerca), enMuro(SUELO, zLejos)];
  L.forma(20, muro, {relleno: '#6E6B65', linea: null, hierve: 0});
  for (let z = zLejos + 40; z < zCerca; z += 90) {
    L.forma(21 + z, [enMuro(-200, z), enMuro(-200, z + 30), enMuro(Y_MOLDURA, z + 30), enMuro(Y_MOLDURA, z)], {relleno: '#76736C', linea: null, hierve: 0});
  }
  L.forma(22, [enMuro(Y_MOLDURA, zLejos), enMuro(Y_MOLDURA, zCerca), enMuro(Y_RODAPIE, zCerca), enMuro(Y_RODAPIE, zLejos)], {relleno: '#62605A', ...op});
  L.forma(23, [enMuro(Y_MOLDURA - 16, zLejos), enMuro(Y_MOLDURA - 16, zCerca), enMuro(Y_MOLDURA + 10, zCerca), enMuro(Y_MOLDURA + 10, zLejos)], {relleno: '#8E8B84', ...op});
  L.forma(24, [enMuro(Y_RODAPIE, zLejos), enMuro(Y_RODAPIE, zCerca), enMuro(SUELO, zCerca), enMuro(SUELO, zLejos)], {relleno: '#43413D', ...op});
  L.trazo(25, [enMuro(-200, zLejos), enMuro(SUELO, zLejos)], LWF, {linea: LF, hierve: 0});

  // el suelo: un damero en perspectiva (centrado bajo la papelera)
  const T = 140;
  for (let z = Z_PARED, f = 0; z < 820; z += T, f++) {
    for (let x = PB.x - T / 2 - 6 * T, c = 0; x < MURO_X; x += T, c++) {
      const x1 = Math.min(x + T, MURO_X), z1 = Math.min(z + T, 820);
      const q = [pr([x, SUELO, z]), pr([x1, SUELO, z]), pr([x1, SUELO, z1]), pr([x, SUELO, z1])];
      L.forma(30 + f * 31 + c, q, {relleno: (f + c) % 2 ? '#6F6C66' : '#B9B6AE', linea: null, hierve: 0});
    }
  }
  L.trazo(29, [pr([-300, SUELO, Z_PARED]), pr([MURO_X, SUELO, Z_PARED]), pr([MURO_X, SUELO, 820])], LWF, {linea: LF, hierve: 0});

  // la ventana (arriba a la izquierda): el marco, el cielo con sus nubes, los tejados con chimeneas, el parteluz y el alféizar
  L.forma(40, rr(34, 236, 360, 452, 8), {relleno: G.claro, ...op});
  L.forma(41, rect(58, 260, 312, 404), {relleno: '#D3D0C7', ...op});
  L.forma(42, spline([[90, 330], [108, 306], [140, 300], [166, 312], [190, 306], [214, 322], [206, 342], [100, 344]], true, 5), {relleno: '#ECE9E1', lw: 3, linea: '#77746D', hierve: 0});
  L.forma(43, spline([[250, 390], [270, 368], [304, 366], [330, 380], [352, 392], [340, 408], [256, 408]], true, 5), {relleno: '#ECE9E1', lw: 3, linea: '#77746D', hierve: 0});
  const tejados: P[] = [[58, 664], [58, 560], [100, 560], [100, 520], [118, 520], [118, 560], [150, 560], [150, 586], [214, 586], [214, 540], [262, 540], [262, 506], [280, 506], [280, 540], [318, 540], [318, 572], [370, 572], [370, 664]];
  L.forma(44, tejados, {relleno: '#9A978F', lw: 3, linea: '#5D5B56', hierve: 0});
  for (const [x, y] of [[166, 600], [186, 600], [230, 560], [300, 590], [334, 600]] as P[]) L.forma(45 + x, rect(x, y, 10, 14), {relleno: '#E6E3DA', linea: null, hierve: 0});
  L.forma(46, rect(206, 260, 16, 404), {relleno: G.claro, ...op});
  L.forma(47, rect(58, 452, 312, 16), {relleno: G.claro, ...op});
  L.forma(48, rr(14, 680, 400, 28, 6), {relleno: '#A9A69E', ...op});

  // la mesa (a la izquierda, un poco detrás): la tapa, el canto, el cajonero con sus cajones y las patas
  const yTapa = SUELO - MESA.alto, grueso = 38;
  const M = (x: number, y: number, z: number) => pr([x, y, z]);
  for (const [x, z] of [[MESA.x0 + 30, MESA.z0 + 30], [MESA.x0 + 30, MESA.z1 - 30]] as P[]) {
    L.forma(60 + z, [M(x - 22, yTapa + grueso, z), M(x + 22, yTapa + grueso, z), M(x + 22, SUELO, z), M(x - 22, SUELO, z)], {relleno: '#55534E', ...op});
  }
  const cx0 = 110, cx1 = MESA.x1 - 8;
  L.forma(62, [M(cx1, yTapa + grueso, MESA.z1 - 6), M(cx1, yTapa + grueso, MESA.z0 + 20), M(cx1, SUELO, MESA.z0 + 20), M(cx1, SUELO, MESA.z1 - 6)], {relleno: '#4F4D48', ...op});
  L.forma(63, [M(cx0, yTapa + grueso, MESA.z1 - 6), M(cx1, yTapa + grueso, MESA.z1 - 6), M(cx1, SUELO, MESA.z1 - 6), M(cx0, SUELO, MESA.z1 - 6)], {relleno: '#6B6963', ...op});
  for (let k = 0; k < 3; k++) {
    const y0 = yTapa + grueso + 14 + k * 92, y1 = y0 + 78;
    L.forma(64 + k, [M(cx0 + 12, y0, MESA.z1 - 4), M(cx1 - 12, y0, MESA.z1 - 4), M(cx1 - 12, y1, MESA.z1 - 4), M(cx0 + 12, y1, MESA.z1 - 4)], {relleno: '#77746D', lw: 3.5, linea: LF, hierve: 0});
    const p = M((cx0 + cx1) / 2, (y0 + y1) / 2, MESA.z1 - 2);
    L.forma(67 + k, elipse(p[0], p[1], 9, 7), {relleno: G.claro, lw: 3, linea: LF, hierve: 0});
  }
  L.forma(70, [M(MESA.x0, yTapa, MESA.z0), M(MESA.x1, yTapa, MESA.z0), M(MESA.x1, yTapa, MESA.z1), M(MESA.x0, yTapa, MESA.z1)], {relleno: '#9A978F', ...op});
  for (const z of [-200, -150, -100]) L.trazo(71 + z, [M(MESA.x0, yTapa, z), M(MESA.x1 - 30, yTapa, z + 8)], 2.5, {linea: '#77746D', hierve: 0});
  L.forma(72, [M(MESA.x0, yTapa, MESA.z1), M(MESA.x1, yTapa, MESA.z1), M(MESA.x1, yTapa + grueso, MESA.z1), M(MESA.x0, yTapa + grueso, MESA.z1)], {relleno: '#6B6963', ...op});
  L.forma(73, [M(MESA.x1, yTapa, MESA.z1), M(MESA.x1, yTapa, MESA.z0), M(MESA.x1, yTapa + grueso, MESA.z0), M(MESA.x1, yTapa + grueso, MESA.z1)], {relleno: '#55534E', ...op});
  // los papeles apilados y una bola de papel de otro día
  for (let k = 0; k < 3; k++) {
    const y = yTapa - 4 - k * 6;
    L.forma(74 + k, [M(150 + k * 3, y, -200), M(236 + k * 3, y, -196), M(234 + k * 3, y, -120), M(148 + k * 3, y, -124)], {relleno: k === 2 ? '#ECE9E1' : G.palido, lw: 3.5, linea: LF, hierve: 0});
  }
  const bv = M(214, yTapa - 26, -78);
  L.forma(78, elipse(bv[0], bv[1], 24, 22), {relleno: '#ECE9E1', lw: 4, linea: LF, hierve: 0});
  L.trazo(79, [[bv[0] - 12, bv[1] - 6], [bv[0] - 2, bv[1] + 2], [bv[0] + 8, bv[1] - 8]], 3, {linea: LF, hierve: 0});
  // la sombra de la mesa en el suelo
  L.forma(80, [M(MESA.x0, SUELO, MESA.z0), M(MESA.x1 + 40, SUELO, MESA.z0), M(MESA.x1 + 40, SUELO, MESA.z1 + 30), M(MESA.x0, SUELO, MESA.z1 + 30)], {relleno: TINTA, linea: null, alfa: 0.22, hierve: 0});
};

// ---------------------------------------------------------------- lo que vive en la pared
// las cortinas y la cenefa de la ventana (se mecen con el latido)
export const dibujaCortinas = (L: Lienzo, latido: number) => {
  const m = latido * 7;
  for (const lado of [-1, 1]) {
    const x0 = lado < 0 ? -6 : 334, x1 = lado < 0 ? 96 : 436;
    const ata = lado < 0 ? x1 - 24 : x0 + 24; // dónde está el lazo
    const pts: P[] = lado < 0
      ? [[x0, 220], [x1, 220], [ata + 6, 470], [x1 + 4 + m, 700], [x0, 712]]
      : [[x0, 220], [x1, 220], [x1, 712], [x0 - 4 - m, 700], [ata - 6, 470]];
    L.forma(100 + lado, spline(pts, true, 5), {relleno: G.claro, lw: 6, sombra: {col: G.medio, dx: lado * -12, dy: 0}});
    // los pliegues
    for (let k = 0; k < 3; k++) {
      const xa = mix(x0, x1, 0.28 + k * 0.22);
      L.trazo(102 + lado + k * 0.1, quad([xa, 236], [mix(xa, ata, 0.6), 470], [xa + (lado < 0 ? m : -m) * 0.6, 690]), 4);
    }
    L.forma(104 + lado, rr(ata - 16, 456, 32, 24, 10), {relleno: G.oscuroMedio, lw: 5});
  }
  // la cenefa de festones
  const fest: P[] = [[-10, 196], [446, 196], [446, 236]];
  for (let k = 6; k >= 0; k--) {
    const xa = -10 + ((k + 1) / 7) * 456, xb = -10 + (k / 7) * 456;
    fest.push(...quad([xa, 236], [(xa + xb) / 2, 266 + latido * 3], [xb, 236], 8).slice(1));
  }
  L.forma(106, fest, {relleno: G.oscuroMedio, lw: 6, sombra: {col: G.oscuro, dx: 0, dy: 10}});
  L.forma(107, rr(-14, 188, 464, 16, 8), {relleno: G.oscuro, lw: 6});
};

// el cuadro de la diana (lo que él quiere y no le sale), que se mece colgado de su clavo
export const dibujaCuadro = (L: Lienzo, latido: number, tGolpeMuro: number) => {
  // se mece al compás y, si la bola pega en la pared, se tuerce de golpe
  const golpe = tGolpeMuro >= 0 ? 0.16 * Math.exp(-4 * tGolpeMuro) * Math.cos(11 * tGolpeMuro) : 0;
  const m: Af = afRot(0.025 * latido + golpe, 780, 212);
  L.trazo(110, apl(m, [[684, 252], [780, 212], [876, 252]]), 4);
  L.forma(111, apl(m, rr(672, 244, 216, 288, 6)), {relleno: '#4F4D48', lw: 7});
  L.forma(112, apl(m, rect(690, 262, 180, 252)), {relleno: G.palido, lw: 5});
  const c = ap(m, [780, 366]);
  const anillos: [number, string][] = [[76, G.oscuro], [58, G.palido], [40, G.oscuro], [22, G.palido], [9, G.oscuro]];
  anillos.forEach(([r, col], k) => L.forma(113 + k, elipse(c[0], c[1], r, r), {relleno: col, lw: 4}));
  // la flecha, clavada fuera del centro
  L.trazo(119, apl(m, [[806, 344], [856, 296]]), 6);
  L.forma(120, apl(m, [[852, 286], [872, 278], [866, 300]]), {relleno: G.blanco, lw: 4});
  L.forma(121, apl(m, rect(724, 470, 112, 12)), {relleno: G.oscuro, linea: null});
  L.forma(122, apl(m, rect(744, 490, 72, 9)), {relleno: G.oscuroMedio, linea: null});
  L.punto(ap(m, [780, 212])[0], ap(m, [780, 212])[1], 6, TINTA);
};

// la balda con sus libros, que bailan al compás (cada uno un pelo detrás del anterior: una ola)
const LIBROS: [number, number, number, string][] = [[648, 38, 150, G.oscuro], [690, 34, 126, G.medio], [728, 44, 166, G.oscuroMedio], [776, 34, 138, G.claro], [814, 40, 152, '#4F4D48'], [858, 38, 130, G.medio]];
export const dibujaBalda = (L: Lienzo, beat: number) => {
  const yB = 772;
  LIBROS.forEach(([x, w, h, col], k) => {
    const ola = Math.cos(2 * Math.PI * beat - k * 0.55);
    const sy = 1 + 0.07 * ola, sx = 1 - 0.045 * ola;
    const ladea = k === 5 ? 0.22 : 0;
    const m: Af = afMul(afRot(ladea, x + w, yB), afEsc(sx, sy, x + w / 2, yB));
    L.forma(130 + k, apl(m, rr(x, yB - h, w, h, 5)), {relleno: col, lw: 6, sombra: {col: G.oscuro, dx: 8, dy: 0}});
    L.trazo(137 + k, apl(m, [[x + 4, yB - h + 18], [x + w - 4, yB - h + 18]]), 4, {linea: col === G.oscuro ? G.claro : TINTA});
    L.trazo(144 + k, apl(m, [[x + 4, yB - 22], [x + w - 4, yB - 22]]), 4, {linea: col === G.oscuro ? G.claro : TINTA});
    L.forma(151 + k, apl(m, rect(x + w * 0.25, yB - h * 0.62, w * 0.5, h * 0.2)), {relleno: col === G.claro ? G.oscuroMedio : G.palido, lw: 3});
  });
  // un jarrón chato al final
  const ola = Math.cos(2 * Math.PI * beat - 6 * 0.55);
  const mv: Af = afEsc(1 - 0.05 * ola, 1 + 0.08 * ola, 930, yB);
  L.forma(158, apl(mv, spline([[904, yB], [900, yB - 40], [916, yB - 74], [912, yB - 96], [948, yB - 96], [944, yB - 74], [960, yB - 40], [956, yB]], true, 5)), {relleno: G.claro, lw: 6, sombra: {col: G.medio, dx: 10, dy: 0}});
  L.forma(159, rr(622, yB, 356, 22, 5), {relleno: '#6B6963', lw: 6});
  for (const x of [668, 930]) L.forma(160 + x, [[x - 10, yB + 22], [x + 10, yB + 22], [x - 10, yB + 70]], {relleno: '#55534E', lw: 5});
};

// la radio de la mesa: canta (la rejilla es su boca), tiene ojos y le salen notas
export const dibujaRadio = (L: Lienzo, beat: number, t: number, feliz: boolean) => {
  const base = pr([96, SUELO - MESA.alto, -165]);
  const lat = Math.cos(2 * Math.PI * beat);
  const m: Af = afMul(afTras(base[0], base[1]), afEsc(1 - 0.05 * lat, 1 + 0.08 * lat));
  const cuerpo = [...arco(0, -146, 76, 80, Math.PI, Math.PI * 2, 18), [76, -6], [70, 0], [-70, 0], [-76, -6]] as P[];
  L.forma(170, apl(m, cuerpo), {relleno: '#6B6963', lw: 7, sombra: {col: '#4F4D48', dx: 12, dy: 0}});
  L.forma(171, apl(m, [...arco(0, -146, 60, 64, Math.PI, Math.PI * 2, 16), [60, -30], [-60, -30]] as P[]), {relleno: '#827F78', lw: 5});
  // los ojos, arriba en el arco
  for (const lado of [-1, 1]) {
    const c = ap(m, [lado * 24, -160]);
    ojo(L, 172 + lado, c[0], c[1], 13, 18, {tipo: feliz ? 'feliz' : 'abierto', lx: 0.5, ly: 0.3, lw: 5});
  }
  // la boca: la rejilla, que se abre y se cierra con el compás
  const abre = 22 + 14 * Math.max(0, lat);
  const bocaR = rr(-40, -118, 80, abre + 30, 14);
  L.forma(175, apl(m, bocaR), {
    relleno: G.oscuro, lw: 5,
    dentro: (D) => {
      for (const dx of [-24, -8, 8, 24]) D.trazo(176 + dx, apl(m, [[dx, -124], [dx, -118 + abre + 36]]), 4, {linea: G.medio});
    },
  });
  // las perillas
  for (const lado of [-1, 1]) {
    const c = ap(m, [lado * 36, -16]);
    L.forma(178 + lado, elipse(c[0], c[1], 10, 10), {relleno: TINTA, lw: 4});
  }
  // las notas que salen y suben (tres a la vez, a dos)
  const n = feliz ? 4 : 3;
  for (let k = 0; k < n; k++) {
    const f = ((t * 0.9 + k / n) % 1 + 1) % 1;
    const p0 = ap(m, [40, -220]);
    const x = p0[0] + 30 + f * 70 + Math.sin(f * 7 + k) * 18, y = p0[1] - f * 180;
    nota(L, 180 + k, x, y, 0.9 + 0.3 * Math.sin(f * Math.PI), 0.25 * Math.sin(f * 9 + k), k % 2 === 1);
  }
};

// ---------------------------------------------------------------- la lámpara que cuelga, con su cono de luz y su cara
export type EstadoLampara = {ang: number; ojos: TipoOjo; mira: P; giro: number};
export const dibujaLuz = (L: Lienzo, ang: number) => {
  // el cono de luz, que se mece con ella (blanco muy suave, sin tinta)
  const c = centroLampara(ang);
  const m: Af = afRot(-ang, c[0], c[1]);
  L.forma(190, apl(m, [[c[0] - 86, c[1] + 50], [c[0] + 86, c[1] + 50], [c[0] + 420, SUELO - 60], [c[0] - 420, SUELO - 60]]), {relleno: G.blanco, linea: null, alfa: 0.11, hierve: 0.3});
  L.forma(192, apl(m, [[c[0] - 70, c[1] + 50], [c[0] + 70, c[1] + 50], [c[0] + 250, SUELO - 200], [c[0] - 250, SUELO - 200]]), {relleno: G.blanco, linea: null, alfa: 0.07, hierve: 0.3});
  const piso = pr([c[0] + Math.sin(ang) * 900, SUELO, 60]);
  L.forma(191, elipse(piso[0], piso[1], 300, 60), {relleno: G.blanco, linea: null, alfa: 0.07, hierve: 0.3});
};
export const dibujaLampara = (L: Lienzo, e: EstadoLampara, beat: number) => {
  const c = centroLampara(e.ang);
  const m: Af = afRot(-e.ang, c[0], c[1]);
  const lat = Math.cos(2 * Math.PI * beat);
  // el cable desde arriba
  L.trazo(200, [[LAMPARA.x, LAMPARA.yGancho], ap(m, [c[0], c[1] - 48])], 6);
  // la pantalla: un cono negro con una franja blanca y su brillo (respira un pelo)
  const ms: Af = afMul(m, afEsc(1 - 0.03 * lat, 1 + 0.05 * lat, c[0], c[1] - 48));
  const S = (x: number, y: number): P => ap(ms, [c[0] + x, c[1] + y]);
  const pantalla: P[] = [S(-26, -50), S(26, -50), ...arco(0, 0, 1, 1, 0, Math.PI, 18).map(([cx, cy]) => S(cx * 94, 46 + cy * 16)), S(-94, 46)];
  L.forma(201, pantalla, {relleno: TINTA, lw: 7});
  L.forma(202, [S(-78, 22), S(78, 22), ...arco(0, 0, 1, 1, 0, Math.PI, 16).map(([cx, cy]) => S(cx * 88, 36 + cy * 14))], {relleno: G.blanco, lw: 5});
  L.trazo(203, [S(-46, -24), S(-64, 10)], 7, {linea: G.oscuroMedio});
  L.forma(204, [S(-26, -50), S(26, -50), S(26, -62), S(-26, -62)], {relleno: G.oscuro, lw: 6});
  // la bombilla y sus rayitos (a dos, cambian de largo)
  const b = S(0, 76);
  // el resplandor de la bombilla (dos aros blancos suaves, sin tinta)
  L.forma(214, elipse(b[0], b[1], 74, 70), {relleno: G.blanco, linea: null, alfa: 0.12, hierve: 0.6});
  L.forma(215, elipse(b[0], b[1], 48, 46), {relleno: G.blanco, linea: null, alfa: 0.2, hierve: 0.6});
  L.forma(205, elipse(b[0], b[1], 26, 24), {relleno: G.blanco, lw: 6});
  const largo = Math.floor(beat * 4) % 2 ? 26 : 16;
  for (let k = 0; k < 5; k++) {
    const a = Math.PI * (0.15 + k * 0.175) - e.ang;
    L.trazo(206 + k, [[b[0] + Math.cos(a) * 38, b[1] + Math.sin(a) * 36], [b[0] + Math.cos(a) * (38 + largo), b[1] + Math.sin(a) * (36 + largo)]], 5);
  }
  // los ojos en la pantalla, mirando la bola
  const d: P = [e.mira[0] - c[0], e.mira[1] - c[1]];
  const dl = Math.hypot(d[0], d[1]) || 1;
  for (const lado of [-1, 1]) {
    const q = S(lado * 22, -6);
    ojo(L, 212 + lado, q[0], q[1], 12, 16, {tipo: e.ojos, lx: (d[0] / dl) * 0.9, ly: (d[1] / dl) * 0.9, lado: lado === -1 ? 1 : -1, lw: 5, giro: e.giro});
  }
};

// ---------------------------------------------------------------- la papelera (con cara): detrás de la bola y delante de la bola
export type EstadoPapelera = {inclina: number; sx: number; sy: number; ojos: TipoOjo; boca: TipoBoca; abre: number; mira: P; cejasAlto: number; cejasInc: number};
const tfPapelera = (e: EstadoPapelera): Af => afMul(afRot(e.inclina, PB.x, SUELO), afEsc(e.sx, e.sy, PB.x, SUELO));
const aro = (r: number, y: number, a0: number, a1: number, n = 40): P[] =>
  Array.from({length: n + 1}, (_, i) => {
    const a = mix(a0, a1, i / n);
    return pr([PB.x + r * Math.cos(a), y, PB.z + r * Math.sin(a)]);
  });
const R_FUERA = PB.rBorde + PB.tubo + 4, R_DENTRO = PB.rBorde - PB.tubo;

// lo de atrás: el aro entero y la boca oscura (la bola que está dentro o detrás va después de esto)
export const papeleraDetras = (L: Lienzo, e: EstadoPapelera) => {
  const m = tfPapelera(e);
  L.forma(250, apl(m, aro(R_FUERA, PB.yBorde, 0, Math.PI * 2, 48)), {relleno: G.blanco, lw: 8});
  L.forma(251, apl(m, aro(R_DENTRO, PB.yBorde, 0, Math.PI * 2, 48)), {
    relleno: '#2B2A27', lw: 6,
    dentro: (D) => {
      // la pared de dentro, del fondo, un poco más clara
      D.forma(252, apl(m, [...aro(R_DENTRO - 4, PB.yBorde + 2, Math.PI, Math.PI * 2, 24), ...aro(R_DENTRO - 12, PB.yBorde + 60, Math.PI * 2, Math.PI, 24)]), {relleno: G.oscuroMedio, linea: null});
    },
  });
};

// lo de delante: el cuerpo con sus costillas, su cara y la mitad de delante del aro
export const papeleraDelante = (L: Lienzo, e: EstadoPapelera) => {
  const m = tfPapelera(e);
  const yT = PB.yBorde + PB.tubo - 2;
  const rT = PB.rBorde + PB.pared + 2, rB = PB.rBase + PB.pared;
  const cuerpo = [...aro(rB, SUELO, 0, Math.PI, 30), ...aro(rT, yT, Math.PI, 0, 30)];
  L.forma(260, apl(m, cuerpo), {
    relleno: G.claro, lw: 9, sombra: {col: G.medio, dx: 30, dy: 0},
    dentro: (D) => {
      // las costillas de chapa, solo a los lados (la cara va en medio)
      for (const a of [0.18, 0.42, 0.66, Math.PI - 0.66, Math.PI - 0.42, Math.PI - 0.18]) {
        D.trazo(261 + a, apl(m, [pr([PB.x + rT * Math.cos(a), yT + 10, rT * Math.sin(a)]), pr([PB.x + rB * Math.cos(a), SUELO - 8, rB * Math.sin(a)])]), 5);
      }
      // el aro de abajo
      D.trazo(268, apl(m, aro(rB + 2, SUELO - 34, 0.02, Math.PI - 0.02, 24)), 5);
    },
  });
  // la cara: ojos grandes, cejas y boca (mira la bola)
  const cx = PB.x, ey = PB.yBorde + 122;
  const d: P = [e.mira[0] - cx, e.mira[1] - ey];
  const dl = Math.hypot(d[0], d[1]) || 1;
  const kk = clamp(dl / 160, 0, 1);
  for (const lado of [-1, 1] as const) {
    const q = ap(m, [cx + lado * 46, ey]);
    ojo(L, 270 + lado, q[0], q[1], 25, 33, {tipo: e.ojos, lx: (d[0] / dl) * kk, ly: (d[1] / dl) * kk, lado: lado === -1 ? 1 : -1, lw: 7});
    // las cejas: suben (alto) y se inclinan (inc > 0: la punta de dentro baja, burlona; < 0: sube, de dolor o de susto)
    const cq = ap(m, [cx + lado * 46, ey - 52 - e.cejasAlto * 12]);
    const dentro = cq[0] - lado * 22, fuera = cq[0] + lado * 22;
    L.trazo(274 + lado, quad([dentro, cq[1] + e.cejasInc * 9], [cq[0], cq[1] - 6], [fuera, cq[1] - e.cejasInc * 9]), 9);
  }
  const bq = ap(m, [cx, PB.yBorde + 236]);
  boca(L, 278, bq[0], bq[1], 74, e.boca, e.abre, 8);
  // la mitad de delante del aro (encima de todo)
  const frente = [...aro(R_FUERA, PB.yBorde, 0, Math.PI, 30), ...aro(R_DENTRO, PB.yBorde, Math.PI, 0, 30)];
  L.forma(280, apl(m, frente), {relleno: G.blanco, lw: 8, sombra: {col: G.palido, dx: 0, dy: 10}});
};

// la sombra plana de la papelera en el suelo
export const sombraPapelera = (L: Lienzo, e: EstadoPapelera) => {
  const c = pr([PB.x + 30 + e.inclina * 300, SUELO, PB.z + 10]);
  L.forma(240, elipse(c[0], c[1], 168 * e.sx, 40), {relleno: TINTA, linea: null, alfa: 0.32, hierve: 0.5});
};
