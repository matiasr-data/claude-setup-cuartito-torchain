import {CAM_Y, D, MESA, MURO_X, PAPELERA, SILLA, STUD, SUELO, Z_PARED, escalaEn, proyecta, type V3} from '../escena';
import {C, CLARO, ESC, H, Lienzo, OSCURO, T, W, bayer, dentroPoli, hash} from './PixelMotor';
import {bolaQuieta} from './PixelPiezas';

// PIXEL ART · EL DECORADO: la oficina como un nivel de juego de 16 bits, en el mismo sitio que la de los bloques
// (todo sale de proyectar las medidas de ../escena.ts y dividir entre 6). Detrás, una pared de ladrillos azules con su bisel (luz arriba
// a la izquierda, sombra abajo a la derecha), más oscura arriba y en la esquina; el zócalo; la ventana de marco blanco con el cielo
// tramado, los árboles y la maceta; el póster de la diana; la balda con los libros; la pared de la derecha en perspectiva; el suelo de
// tablas de madera clara que se van haciendo más altas hacia la cámara; la mesa de nogal con el monitor encendido, los papeles y dos
// bolas de otros días; y las sombras del suelo, tramadas. Se pinta UNA vez (con un margen para el temblor) y cada cuadro se copia.
// Lo que se mueve (las nubes, el cursor del monitor) va aparte, encima.

export const MARGEN = 4;
// de la escena (px de 1080 × 1920, con su z) al lienzo de 180 × 320
export const pr = (x: number, y: number, z: number): [number, number] => {
  const [a, b] = proyecta([x, y, z]);
  return [a / ESC, b / ESC];
};
export const PF = [540 / ESC, CAM_Y / ESC] as const; // el punto de fuga (hacia donde se juntan las líneas del suelo y la pared)
export const Y_FONDO = Math.round(pr(0, SUELO, Z_PARED)[1]); // donde la pared toca el suelo (240)
export const X_ESQUINA = Math.round(pr(MURO_X, 0, Z_PARED)[0]); // la esquina con la pared de la derecha (168)
const FILA = 12; // un ladrillo: 24 × 12, cada fila desplazada medio ladrillo
const LARGO = 24;

// la ventana, el póster y la balda (en px del lienzo, cuadrados con las filas de ladrillos)
export const VENTANA = {x0: 8, x1: 68, y0: 45, y1: 111, cruzX: 37, cruzY: 75};
const POSTER = {x0: 110, x1: 150, y0: 40, y1: 94};
const BALDA = {x0: 105, x1: 161, y: 128};

// la x de la escena que cae en la columna x del lienzo a la altura (escala) s
const xEscena = (x: number, s: number) => 540 + ((x + 0.5) * ESC - 540) / s;
// la escala (y la z) del suelo en la fila y del lienzo
const sSuelo = (y: number) => ((y + 0.5) * ESC - CAM_Y) / (SUELO - CAM_Y);
const zSuelo = (y: number) => D * (1 - 1 / sSuelo(y));
// el borde del suelo con la pared de la derecha: la y del lienzo en la columna x
const yBordeDerecho = (x: number) => {
  // en la pared de la derecha, x = 540 + (MURO_X − 540)·s ⇒ s; y la y del suelo con esa s
  const s = ((x + 0.5) * ESC - 540) / (MURO_X - 540);
  return (CAM_Y + (SUELO - CAM_Y) * s) / ESC;
};

// ---------------------------------------------------------------- la pared del fondo
const pared = (x: number, y: number): number => {
  const desde = Y_FONDO - 1 - y; // 0 = la fila de abajo
  const fila = Math.floor(desde / FILA);
  const yIn = desde - fila * FILA; // 0 = la junta de abajo, 11 = el borde de arriba del ladrillo
  const xs = x + 600 + (fila % 2) * (LARGO / 2);
  const col = Math.floor(xs / LARGO);
  const xIn = xs - col * LARGO;
  const h = hash(col, fila, 7);
  let c: number;
  if (yIn === 0 || xIn === LARGO - 1) c = C.pared1; // la junta
  else if (yIn === FILA - 1 || xIn === 0) c = C.pared5; // el bisel con luz
  else if (yIn === 1 || xIn === LARGO - 2) c = C.pared2; // el bisel en sombra
  else {
    c = h < 0.18 ? C.pared4 : h > 0.9 ? C.pared2 : C.pared3;
    // unas motas y, en algún ladrillo, una grieta
    const m = hash(x, y, 3);
    if (m < 0.05) c = OSCURO[c];
    else if (m > 0.975) c = CLARO[c];
    if (h > 0.955 && Math.abs(xIn - 6 - (yIn * 3) / 4) < 0.6) c = C.pared1;
  }
  // más oscura arriba (la sombra del techo), en la esquina de la derecha y abajo, junto al suelo
  const b = bayer(x, y);
  if (y < 70 && b < ((70 - y) / 70) * 0.75) c = OSCURO[c];
  if (y < 26 && b < ((26 - y) / 26) * 0.7) c = OSCURO[c];
  if (x > 148 && b < ((x - 148) / 20) * 0.55) c = OSCURO[c];
  return c;
};

// la pared de la derecha: más oscura, con las juntas en perspectiva (cada una apunta al punto de fuga)
const paredDerecha = (x: number, y: number): number => {
  const k = (x + 0.5 - PF[0]) / (X_ESQUINA - PF[0]); // cuánto se abre respecto a la esquina
  const yEsq = PF[1] + (y + 0.5 - PF[1]) / k; // esta y, llevada a la esquina
  const desde = Y_FONDO - yEsq;
  const fila = Math.floor(desde / FILA);
  const yIn = desde - fila * FILA;
  let c = yIn < 1 / k + 0.15 ? C.pared0 : yIn > FILA - 1 / k - 0.1 ? C.pared3 : C.pared2;
  if (c === C.pared2 && bayer(x, y) < 0.4) c = C.pared1;
  if (x === X_ESQUINA) c = C.pared1;
  return c;
};

// ---------------------------------------------------------------- el suelo de tablas
const PROF = 92; // lo hondo de cada tabla (en z)
const TABLA = 360; // lo largo
const suelo = (x: number, y: number): number => {
  const z = zSuelo(y), s = sSuelo(y);
  const fila = Math.floor((z - Z_PARED) / PROF);
  const filaArriba = Math.floor((zSuelo(y - 1) - Z_PARED) / PROF);
  const desf = (fila * 137) % TABLA;
  const xs = xEscena(x, s) + desf + 2000;
  const tabla = Math.floor(xs / TABLA);
  const tablaIzq = Math.floor((xEscena(x - 1, s) + desf + 2000) / TABLA);
  const h = hash(tabla, fila, 11);
  let c = h < 0.2 ? C.madera2 : h > 0.86 ? C.madera4 : C.madera3;
  if (fila !== filaArriba) c = C.madera1; // la junta entre filas
  else if (Math.floor((zSuelo(y - 2) - Z_PARED) / PROF) !== filaArriba) c = h > 0.86 ? C.madera5 : C.madera4; // el canto con luz
  else if (tabla !== tablaIzq) c = C.madera1; // la junta entre tablas
  else {
    // la veta: rayitas largas
    const v = hash(Math.floor(xs / 17), fila, y);
    if (v < 0.08) c = OSCURO[c];
  }
  // la sombra junto a la pared y un poco de oscuro hacia la cámara
  const b = bayer(x, y);
  if (y < Y_FONDO + 8 && b < ((Y_FONDO + 8 - y) / 8) * 0.7) c = OSCURO[c];
  if (y > 300 && b < ((y - 300) / 20) * 0.5) c = OSCURO[c];
  return c;
};

// ---------------------------------------------------------------- una caja de la escena (girada sobre y), proyectada
export const cajaGirada = (c: V3, an: number, al: number, fo: number, giro: number) => {
  const esq = (sx: number, sy: number, sz: number): [number, number] => {
    const lx = (sx * an) / 2, lz = (sz * fo) / 2;
    const x = lx * Math.cos(giro) + lz * Math.sin(giro), z = -lx * Math.sin(giro) + lz * Math.cos(giro);
    return pr(c[0] + x, c[1] + (sy * al) / 2, c[2] + z);
  };
  return {
    frente: [esq(-1, -1, 1), esq(1, -1, 1), esq(1, 1, 1), esq(-1, 1, 1)] as [number, number][],
    lado: [esq(1, -1, 1), esq(1, -1, -1), esq(1, 1, -1), esq(1, 1, 1)] as [number, number][],
    arriba: [esq(-1, -1, -1), esq(1, -1, -1), esq(1, -1, 1), esq(-1, -1, 1)] as [number, number][],
  };
};

// ---------------------------------------------------------------- el fondo entero (una vez)
let FONDO: Lienzo | null = null;
let CIELO: Uint8Array | null = null; // 1 donde se ve el cielo (ahí pasan las nubes)

const pintarFondo = () => {
  const f = new Lienzo(W + 2 * MARGEN, H + 2 * MARGEN);
  f.ox = MARGEN;
  f.oy = MARGEN;
  const cielo = new Uint8Array(f.d.length);
  // la pared, la de la derecha y el suelo
  f.region(-MARGEN, -MARGEN, W + MARGEN - 1, H + MARGEN - 1, (x, y) => {
    if (x >= X_ESQUINA && y < yBordeDerecho(x)) return paredDerecha(x, y);
    if (y < Y_FONDO) return pared(x, y);
    return suelo(x, y);
  });
  // el zócalo
  for (let x = -MARGEN; x < X_ESQUINA; x++) {
    f.px(x, Y_FONDO - 4, C.madera3);
    f.px(x, Y_FONDO - 3, C.nogal2);
    f.px(x, Y_FONDO - 2, C.nogal2);
    f.px(x, Y_FONDO - 1, C.nogal1);
  }
  for (let x = X_ESQUINA; x < W + MARGEN; x++) {
    const yb = Math.round(yBordeDerecho(x));
    for (let k = 1; k <= 4; k++) f.px(x, yb - k, k === 4 ? C.nogal2 : C.nogal1);
  }

  // ---- la ventana: el cielo tramado (más claro abajo), un monte lejano, los árboles, el marco con su cruz y el alféizar
  const V = VENTANA;
  f.region(V.x0 + 3, V.y0 + 3, V.x1 - 3, V.y1 - 3, (x, y) => {
    const k = (y - V.y0) / (V.y1 - V.y0);
    const g = k * 3;
    const b = Math.min(2, Math.floor(g));
    const cols = [C.cielo0, C.cielo1, C.cielo2, C.cielo3];
    return bayer(x, y) < g - b ? cols[b + 1] : cols[b];
  });
  // el monte, los árboles (copas redondas con su sombra abajo a la derecha) y su contorno
  const arboles: [number, number, number][] = [[16, 98, 9], [29, 93, 11], [47, 97, 9], [60, 92, 10]];
  f.region(V.x0 + 3, 84, V.x1 - 3, V.y1 - 3, (x, y) => {
    const monte = 101 + 3 * Math.sin(x * 0.11) + 2 * Math.sin(x * 0.29);
    let c = T;
    if (y > monte) c = bayer(x, y) < 0.5 ? C.verde1 : C.verde2;
    for (const [cx, cy, r] of arboles) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const d = Math.hypot(dx, dy);
      if (d > r) continue;
      const luz = (-dx - dy) / r; // la luz, arriba a la izquierda
      c = d > r - 1 ? C.verde0 : luz > 0.55 ? C.verde3 : luz > -0.35 ? C.verde2 : C.verde1;
      if (c === C.verde2 && hash(x, y, 5) < 0.12) c = C.verde3;
    }
    return c;
  });
  // lo que sigue siendo cielo, para las nubes
  for (let y = V.y0 + 3; y <= V.y1 - 3; y++) {
    for (let x = V.x0 + 3; x <= V.x1 - 3; x++) {
      const v = f.get(x, y);
      if (v === C.cielo0 || v === C.cielo1 || v === C.cielo2 || v === C.cielo3) cielo[(y + MARGEN) * f.w + x + MARGEN] = 1;
    }
  }
  // el marco blanco con su bisel, la cruz y el alféizar (con su sombra en la pared)
  const marco = (x0: number, y0: number, x1: number, y1: number) => {
    f.region(x0, y0, x1, y1, (x, y) => (x === x0 || y === y0 ? C.blanco : x === x1 || y === y1 ? C.gris2 : C.gris1));
  };
  marco(V.x0, V.y0, V.x1, V.y0 + 2);
  marco(V.x0, V.y0, V.x0 + 2, V.y1);
  marco(V.x1 - 2, V.y0, V.x1, V.y1);
  marco(V.cruzX - 1, V.y0, V.cruzX + 1, V.y1);
  marco(V.x0, V.cruzY - 1, V.x1, V.cruzY + 1);
  f.rect(V.x0 + 3, V.y0 + 3, V.x1 - V.x0 - 5, 1, C.gris3); // la sombra del marco en el cristal
  f.rect(V.x0 + 3, V.y0 + 3, 1, V.y1 - V.y0 - 5, C.gris3);
  marco(V.x0 - 4, V.y1 - 1, V.x1 + 4, V.y1 + 3);
  f.tabla(V.x0 - 3, V.y1 + 4, V.x1 + 5, V.y1 + 6, OSCURO, (x, y) => y === V.y1 + 4 || bayer(x, y) < 0.5);
  f.tabla(V.x1 + 1, V.y0 + 1, V.x1 + 2, V.y1 - 2, OSCURO, () => true);
  // la maceta naranja con sus hojas, en el alféizar
  f.region(48, 92, 60, V.y1 - 2, (x, y) => {
    const dx = x + 0.5 - 54;
    if (y >= 104) {
      const ancho = 4 - (y - 104) * 0.25;
      if (Math.abs(dx) > ancho + 0.5) return T;
      if (y === 104) return C.nar3;
      return Math.abs(dx) > ancho - 0.6 ? C.nar0 : dx < -1 ? C.nar3 : dx > 1.5 ? C.nar1 : C.nar2;
    }
    // tres hojas en abanico
    for (const [a, l] of [[-0.55, 10], [0, 12], [0.6, 9]] as [number, number][]) {
      const ux = Math.sin(a), uy = -Math.cos(a);
      const px = dx, py = y + 0.5 - 104;
      const t = px * ux + py * uy;
      if (t < 0 || t > l) continue;
      const lado = Math.abs(px * -uy + py * ux);
      const grosor = 2.2 * Math.sin((Math.PI * t) / l) + 0.3;
      if (lado < grosor) return lado > grosor - 0.9 ? C.verde0 : px * -uy + py * ux < 0 ? C.verde3 : C.verde2;
    }
    return T;
  });

  // ---- el póster: la diana con la flecha fuera del centro (lo que él quiere y no le sale)
  const P = POSTER;
  f.tabla(P.x0 + 2, P.y0 + 2, P.x1 + 2, P.y1 + 2, OSCURO, () => true); // su sombra
  f.region(P.x0, P.y0, P.x1, P.y1, (x, y) => {
    if (x === P.x0 || y === P.y0) return C.blanco;
    if (x === P.x1 || y === P.y1) return C.gris2;
    if (x === P.x0 + 1 || y === P.y0 + 1 || x === P.x1 - 1 || y === P.y1 - 1) return C.gris1;
    const k = (x - P.x0 + y - P.y0) / 80;
    return bayer(x, y) < 0.35 - k * 0.6 ? C.amar3 : C.amar2;
  });
  const dc = [130, 64];
  f.region(dc[0] - 16, dc[1] - 16, dc[0] + 16, dc[1] + 16, (x, y) => {
    const d = Math.hypot(x + 0.5 - dc[0], y + 0.5 - dc[1]);
    if (d > 15) return T;
    if (d > 14) return C.rojo0;
    const anillo = Math.floor(d / 3);
    const rojo = anillo % 2 === 0;
    const luz = (x + 0.5 - dc[0] + y + 0.5 - dc[1]) / 15;
    return rojo ? (luz < -0.6 ? C.rojo3 : luz > 0.7 ? C.rojo1 : C.rojo2) : luz > 0.7 ? C.gris1 : C.blanco;
  });
  f.linea(137, 57, 146, 47, C.tinta); // la flecha, clavada fuera del centro
  f.linea(138, 57, 147, 47, C.gris4);
  f.rect(145, 45, 3, 2, C.silla2);
  f.rect(147, 46, 2, 3, C.silla1);
  f.rect(118, 83, 24, 2, C.tinta); // las letras de abajo
  f.rect(122, 87, 16, 2, C.tinta);

  // ---- la balda con los libros
  const B = BALDA;
  const libros: [number, number, number, number][] = [[107, 9, 22, C.rojo2], [117, 8, 19, C.amar2], [126, 9, 25, C.verde2], [136, 8, 18, C.silla2], [145, 9, 20, C.nar2]];
  for (const [x0, an, al, col] of libros) {
    const inclina = x0 === 145 ? 0.32 : 0;
    f.region(x0 - 6, B.y - al - 2, x0 + an + 4, B.y - 1, (x, y) => {
      const u = y + 0.5 - B.y; // hacia arriba, negativo
      const xx = x + 0.5 - x0 + u * inclina; // el último, apoyado de lado
      if (xx < 0 || xx > an || -u > al) return T;
      if (xx < 1 || xx > an - 1 || -u > al - 1) return OSCURO[OSCURO[col]];
      if (-u > al - 5 && -u < al - 3) return C.amar4; // la franja del lomo
      return xx < 3 ? CLARO[col] : xx > an - 3 ? OSCURO[col] : col;
    });
  }
  f.tabla(B.x0, B.y + 3, B.x1 + 2, B.y + 5, OSCURO, (x, y) => y === B.y + 3 || bayer(x, y) < 0.5);
  f.region(B.x0, B.y, B.x1, B.y + 2, (x, y) => (y === B.y ? C.blanco : y === B.y + 2 ? C.gris3 : x === B.x1 ? C.gris2 : C.gris1));

  // ---- las sombras del suelo: la de la papelera, la de la silla y la de debajo de la mesa (escalones tramados)
  const sombra = (cx: number, cy: number, rx: number, ry: number, fuerza: number) => {
    f.tabla(cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1, OSCURO, (x, y) => {
      const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry);
      return d < 1 && bayer(x, y) < (1 - d * d) * fuerza + 0.25;
    });
  };
  const PB = PAPELERA;
  const pb = pr(PB.x + 40, SUELO, PB.z - 10);
  sombra(pb[0] + 2, pb[1], 30, 8, 0.9);
  const ps = pr(SILLA.x + 10, SUELO, SILLA.z);
  sombra(ps[0], ps[1] + 1, 27, 7, 0.8);
  const debajo: [number, number][] = [pr(MESA.x0, SUELO, MESA.z0), pr(MESA.x1 + 20, SUELO, MESA.z0), pr(MESA.x1 + 20, SUELO, MESA.z1 + 30), pr(MESA.x0, SUELO, MESA.z1 + 30)];
  f.tabla(-MARGEN, Y_FONDO, 60, 280, OSCURO, (x, y) => {
    if (!dentroPoli(x + 0.5, y + 0.5, debajo)) return false;
    return bayer(x, y) < 0.55;
  });

  // ---- la mesa de nogal: las patas, el tablero (arriba más claro; el canto de delante y el lado), el monitor, los papeles,
  // la taza y dos bolas de otros días
  const top = SUELO - MESA.alto;
  const grueso = 38;
  const gris = (q: [number, number][]) => f.poligono(q, (x) => (x % 3 === 0 ? C.gris2 : C.gris3));
  for (const [x, z] of [[MESA.x0 + 30, MESA.z0 + 30], [MESA.x1 - 30, MESA.z0 + 30], [MESA.x0 + 30, MESA.z1 - 30], [MESA.x1 - 30, MESA.z1 - 30]]) {
    const c = cajaGirada([x, (top + grueso + SUELO) / 2, z], STUD * 0.9, SUELO - top - grueso, STUD * 0.9, 0);
    gris(c.lado);
    f.poligono(c.frente, (xx, yy) => (bayer(xx, yy) < 0.3 ? C.gris2 : C.gris3));
  }
  const tab = cajaGirada([(MESA.x0 + MESA.x1) / 2, top + grueso / 2, (MESA.z0 + MESA.z1) / 2], MESA.x1 - MESA.x0, grueso, MESA.z1 - MESA.z0, 0);
  f.poligono(tab.arriba, (x, y) => (hash(x, y, 9) < 0.08 ? C.nogal2 : C.nogal3));
  f.poligono(tab.frente, (x, y) => (y === Math.round(tab.frente[0][1]) ? C.madera3 : bayer(x, y) < 0.25 ? C.nogal1 : C.nogal2));
  f.poligono(tab.lado, C.nogal1);
  // el contorno del tablero
  for (const q of [tab.arriba, tab.frente, tab.lado]) for (let i = 0; i < 4; i++) f.linea(...q[i], ...q[(i + 1) % 4], C.nogal0);
  // el monitor (girado hacia él): el pie, el cuello, la caja y la pantalla encendida
  const mon = cajaGirada([40, top - 221, -170], 4 * STUD, 3 * 76.8, 30, 0.45);
  const pie = cajaGirada([40, top - 12, -170], 2 * STUD, 24, 2 * STUD, 0.45);
  const cuello = cajaGirada([40, top - 66, -170], 34, 110, 30, 0.45);
  for (const p of [pie, cuello]) {
    f.poligono(p.arriba, C.gris4);
    f.poligono(p.frente, C.tinta);
    f.poligono(p.lado, C.tinta);
  }
  f.poligono(mon.lado, C.gris4);
  f.poligono(mon.frente, C.tinta);
  PANTALLA = cajaGirada([40, top - 221, -155], 4 * STUD - 34, 3 * 76.8 - 34, 2, 0.45).frente;
  f.poligono(PANTALLA, (x, y) => {
    const fila = y - Math.floor(PANTALLA![0][1]);
    if (y < PANTALLA![0][1] + 2) return C.pant3;
    if (fila % 4 === 2 && hash(Math.floor(x / 3), fila) < 0.75 && x < 4 + (fila * 7) % 19) return C.pant1; // las líneas de código
    return bayer(x, y) < 0.2 ? C.pant3 : C.pant2;
  });
  // los papeles apilados
  const papel = cajaGirada([153, top - 18, -186], 150, 22, 110, 0.06);
  f.poligono(papel.frente, (x, y) => (y % 2 ? C.gris2 : C.gris1));
  f.poligono(papel.arriba, C.blanco);
  // la taza roja con su asa
  const [tx, ty] = pr(205, top, -80);
  f.region(tx - 6, ty - 13, tx + 7, ty, (x, y) => {
    const dx = x + 0.5 - tx, dy = y + 0.5 - ty;
    if (dx > 4.5 && dx < 7 && dy > -10 && dy < -4 && !(dx < 6 && dy > -9 && dy < -5)) return C.rojo1; // el asa
    if (Math.abs(dx) > 4.6 || dy < -12) return T;
    if (Math.abs(dx) > 3.8 || dy > -1) return C.rojo0;
    if (dy < -11) return C.rojo1;
    return dx < -2 ? C.rojo3 : dx > 2 ? C.rojo1 : C.rojo2;
  });
  // dos bolas de papel de otros días
  for (const [x, y, z, r, g] of [[-10, top - 42, -90, 34, 2.2], [60, top - 40, -60, 32, 4.1]]) {
    const [bx, by] = pr(x, y, z);
    bolaQuieta(f, bx, by, (r * escalaEn(z)) / ESC, g);
  }

  // en el suelo de delante, en las esquinas (donde los bloques tienen sus piezas sueltas), bolas de papel de otros intentos
  for (const [x, z, r, g] of [[150, 600, 38, 1.1], [262, 700, 34, 3.3], [1010, 560, 38, 5.2]]) {
    const [bx, by] = pr(x, SUELO - r * 0.85, z);
    const rr = (r * escalaEn(z)) / ESC;
    sombra(bx + 2, pr(x, SUELO, z)[1], rr * 1.3, rr * 0.45, 0.9);
    bolaQuieta(f, bx, by, rr, g);
  }

  FONDO = f;
  CIELO = cielo;
};
let PANTALLA: [number, number][] | null = null;

// cada cuadro: el fondo copiado con el temblor (en píxeles enteros), las nubes que pasan y el cursor del monitor
export const copiarFondo = (l: Lienzo) => {
  if (!FONDO) pintarFondo();
  const f = FONDO!;
  for (let y = 0; y < H; y++) {
    const fy = y + MARGEN - l.oy;
    const base = fy * f.w + MARGEN - l.ox;
    l.d.set(f.d.subarray(base, base + W), y * W);
  }
};

const NUBES: [number, number, number][] = [[0, 56, 1], [34, 64, 0.8]]; // x de salida, y, tamaño
export const nubes = (l: Lienzo, t: number) => {
  if (!FONDO) pintarFondo();
  const f = FONDO!, cielo = CIELO!;
  const V = VENTANA;
  const ancho = V.x1 - V.x0 + 30;
  const paso = Math.floor(t * 8); // a 8 por segundo: se mueven a saltos de un píxel, como en un juego
  for (const [x0, cy, s] of NUBES) {
    const cx = V.x0 - 12 + ((x0 + paso) % ancho);
    const bolas: [number, number, number][] = [[-7, 1, 4.5], [-2, -2, 6], [5, 0, 5], [10, 2, 3.5]];
    l.region(cx - 16, cy - 10, cx + 16, cy + 6, (x, y) => {
      if (!cielo[(y + MARGEN) * f.w + x + MARGEN]) return T;
      let dentro = false, abajo = false;
      for (const [dx, dy, r] of bolas) {
        const d = Math.hypot(x + 0.5 - cx - dx * s, y + 0.5 - cy - dy * s);
        if (d < r * s) dentro = true;
      }
      if (!dentro) return T;
      abajo = y + 0.5 > cy + 1.5 * s;
      return abajo ? (bayer(x, y) < 0.5 ? C.gris1 : C.cielo3) : C.blanco;
    });
  }
};

export const cursor = (l: Lienzo, t: number) => {
  if (!PANTALLA) return;
  if (Math.floor(t * 3) % 2) return; // parpadea a 3 por segundo
  const [x, y] = PANTALLA[2]; // abajo a la derecha de la pantalla (la izquierda se sale del cuadro)
  l.rect(Math.round(x) - 9, Math.round(y) - 6, 3, 2, C.pant0);
};
