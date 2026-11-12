import {CAM_Y, D, LAMPARA, PAPELERA, R_BOLA, SUELO, escalaEn, proyecta, type Bola, type V3} from '../escena';
import {C, CLARO, ESC, Lienzo, OSCURO, T, bayer, contorno, hash} from './PixelMotor';

// PIXEL ART · LAS PIEZAS QUE SE MUEVEN: la bola (un sprite blanco con sus pliegues, que gira por fotogramas de
// 45° y se aplasta en cada golpe), su estela de fantasmas tramados y su sombra en el suelo; la papelera roja en dos pasadas (lo de
// detrás y lo de delante, para que la bola pueda caer DENTRO); la lámpara que se balancea con su bombilla y su halo (la luz como
// escalones de la paleta, tramada); y los efectos de juego de cada golpe: la estrella del choque y el polvo del suelo.

const sc = (p: V3): [number, number] => {
  const [a, b] = proyecta(p);
  return [a / ESC, b / ESC];
};

// ---------------------------------------------------------------- un sprite pequeño (su propio lienzo, con su contorno)
const SPR = new Lienzo(48, 48);
const sprite = (x0: number, y0: number) => {
  SPR.limpiar();
  SPR.ox = -x0;
  SPR.oy = -y0;
  return SPR;
};
const pegar = (l: Lienzo, x0: number, y0: number) => {
  for (let j = 0; j < SPR.h; j++) for (let i = 0; i < SPR.w; i++) {
    const c = SPR.d[j * SPR.w + i];
    if (c !== T) l.px(x0 + i, y0 + j, c);
  }
};

// ---------------------------------------------------------------- la bola de papel
const GRISES = [C.gris3, C.gris2, C.gris1, C.blanco];
const VIEJO = [C.madera3, C.madera4, C.madera5, C.amar4]; // las de otros días: papel amarillento (así la blanca es la de ahora)
// los pliegues, en el sistema de la bola (giran con ella): una recta a·u = b
const PLIEGUES: [number, number, number][] = [[0.3, 0.12, 0.85], [2.2, -0.18, 0.8], [4.1, 0.36, 0.7], [5.3, -0.5, 0.55]];
const pintaBola = (l: Lienzo, cx: number, cy: number, r: number, rot: number, ap: {k: number; n: [number, number]}, tonos = GRISES) => {
  const X0 = Math.round(cx) - 24, Y0 = Math.round(cy) - 24;
  const s = sprite(X0, Y0);
  const k = ap.k;
  const nn = Math.hypot(ap.n[0], ap.n[1]) || 1;
  const n: [number, number] = [ap.n[0] / nn, ap.n[1] / nn];
  const kA = 1 - 0.3 * k, kP = 1 + 0.18 * k; // aplastada a lo largo de la normal del golpe, ensanchada de lado
  s.region(cx - r - 3, cy - r - 3, cx + r + 3, cy + r + 3, (x, y) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    const a = (dx * n[0] + dy * n[1]) / kA, p = (-dx * n[1] + dy * n[0]) / kP;
    const qx = a * n[0] - p * n[1], qy = a * n[1] + p * n[0];
    // en el sistema de la bola
    const ux = (qx * Math.cos(-rot) - qy * Math.sin(-rot)) / r, uy = (qx * Math.sin(-rot) + qy * Math.cos(-rot)) / r;
    const th = Math.atan2(uy, ux);
    const borde = 1 + 0.08 * (0.6 * Math.sin(3 * th + 1.3) + 0.4 * Math.sin(5 * th + 0.4));
    const d = Math.hypot(ux, uy);
    if (d > borde) return T;
    // la luz: arriba a la izquierda (no gira con la bola)
    const nx = qx / r, ny = qy / r, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    const lum = -0.45 * nx - 0.6 * ny + 0.66 * nz;
    let nivel = Math.max(0, Math.min(3, Math.floor(lum * 3.3 + 0.9 + (bayer(x - X0, y - Y0) - 0.5) * 0.9)));
    // los pliegues: una raya un tono más oscura y, del lado de la luz, una más clara
    for (const [ang, b, largo] of PLIEGUES) {
      const v = ux * Math.cos(ang) + uy * Math.sin(ang) - b;
      const w = -ux * Math.sin(ang) + uy * Math.cos(ang);
      if (Math.abs(w) > largo) continue;
      if (Math.abs(v) < 0.75 / r) nivel = Math.max(0, nivel - 2);
      else if (v > 0 && v < 1.8 / r && nivel < 3) nivel++;
    }
    return tonos[nivel];
  });
  contorno(s, C.tinta);
  pegar(l, X0, Y0);
};
export const bolaQuieta = (l: Lienzo, cx: number, cy: number, r: number, giro: number) =>
  pintaBola(l, cx, cy, r, giro, {k: 0, n: [0, -1]}, VIEJO);

// la bola de la escena: centrada en un píxel entero, girando a fotogramas de 45°
export const radioBola = (z: number) => (R_BOLA * escalaEn(z)) / ESC;
export const pintarBola = (l: Lienzo, b: Bola) => {
  const [cx, cy] = sc(b.c);
  const rot = Math.floor(b.giro / (Math.PI / 4) + 0.5) * (Math.PI / 4) + Math.floor(b.vuelco / (Math.PI / 2)) * 0.6;
  pintaBola(l, Math.round(cx) + 0.5, Math.round(cy) + 0.5, radioBola(b.c[2]), rot, {k: b.aplasta.k, n: [b.aplasta.n[0], b.aplasta.n[1]]});
};
// la estela: fantasmas tramados de donde estuvo (más ralos cuanto más atrás)
export const pintarEstela = (l: Lienzo, c: V3, nivel: number) => {
  const [cx, cy] = sc(c);
  const r = radioBola(c[2]) - 1;
  const X = Math.round(cx) + 0.5, Y = Math.round(cy) + 0.5;
  l.region(X - r - 1, Y - r - 1, X + r + 1, Y + r + 1, (x, y) => {
    const d = Math.hypot(x + 0.5 - X, y + 0.5 - Y);
    if (d > r) return T;
    const ok = nivel === 0 ? (x + y) % 2 === 0 : x % 2 === 0 && y % 2 === 0;
    return ok ? (d < r * 0.6 ? C.blanco : C.gris1) : T;
  });
};
// su sombra en el suelo: más pequeña y más floja cuanto más alta va
export const pintarSombraBola = (l: Lienzo, c: V3) => {
  const alto = SUELO - R_BOLA - c[1];
  if (alto > 900) return;
  const [cx, cy] = sc([c[0], SUELO, c[2]]);
  const k = Math.max(0, 1 - alto / 900);
  const rx = radioBola(c[2]) * (0.6 + 0.5 * k), ry = rx * 0.32;
  l.tabla(cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1, OSCURO, (x, y) => {
    const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry);
    return d < 1 && bayer(x, y) < k * 0.95 * (1 - d * d * 0.6);
  });
};

// ---------------------------------------------------------------- la papelera (roja, con su aro blanco), en dos pasadas
const PB = PAPELERA;
const elipseEn = (y: number, R: number) => {
  // un círculo horizontal a la altura y de la escena, proyectado (casi una elipse): su centro, su radio de lado y el de fondo
  const yf = CAM_Y + ((y - CAM_Y) * D) / (D - R), yb = CAM_Y + ((y - CAM_Y) * D) / (D + R);
  return {yc: (yf + yb) / 2 / ESC, rx: (R * 1.012) / ESC, ry: (yf - yb) / 2 / ESC};
};
const CX = PB.x / ESC;
const ARO_F = elipseEn(PB.yBorde, PB.rBorde + PB.tubo);
const ARO_D = elipseEn(PB.yBorde, PB.rBorde - PB.tubo);
const BASE = elipseEn(SUELO, PB.rBase + PB.pared);
const LABIO = 2; // lo grueso del aro visto de frente
const PIVOTE: [number, number] = [CX, BASE.yc];
export const PAPELERA_PX = {cx: CX, yAro: ARO_F.yc, ryAro: ARO_F.ry, rxAro: ARO_F.rx};

const enE = (x: number, y: number, e: {yc: number; rx: number; ry: number}, dy = 0) => ((x - CX) / e.rx) ** 2 + ((y - e.yc - dy) / e.ry) ** 2 <= 1;
const ancho = (y: number) => ARO_F.rx + ((BASE.rx - ARO_F.rx) * (y - ARO_F.yc)) / (BASE.yc - ARO_F.yc);
type Zona = 'nada' | 'hueco' | 'aro' | 'labio' | 'cuerpo';
const zona = (x: number, y: number): Zona => {
  if (enE(x, y, ARO_D)) return 'hueco';
  if (enE(x, y, ARO_F)) return 'aro';
  if (y > ARO_F.yc && enE(x, y, ARO_F, LABIO)) return 'labio';
  if (y >= ARO_F.yc && Math.abs(x - CX) <= ancho(y)) {
    const u = (x - CX) / BASE.rx;
    if (Math.abs(u) <= 1 && y <= BASE.yc + BASE.ry * Math.sqrt(1 - u * u)) return 'cuerpo';
    if (y <= BASE.yc) return 'cuerpo';
  }
  return 'nada';
};
// las costillas de fuera: 9 a la vista (de 18), como las de los bloques
const COSTILLAS = Array.from({length: 9}, (_, k) => -Math.cos((Math.PI * (k + 0.5)) / 9));

const colorPapelera = (x: number, y: number, z: Zona, xi: number, yi: number): number => {
  if (z === 'hueco') {
    // el fondo de dentro: la pared de detrás, de rojo oscuro (con luz arriba) a casi negro junto al aro de delante
    const v = (y - (ARO_D.yc - ARO_D.ry)) / (2 * ARO_D.ry);
    const b = bayer(xi, yi);
    if (v < 0.28) return b < 0.5 ? C.rojo1 : C.rojo0;
    if (v < 0.6) return b < (0.6 - v) * 1.4 ? C.rojo1 : C.rojo0;
    return b < (v - 0.6) * 1.8 ? C.tinta : C.rojo0;
  }
  if (z === 'aro') {
    // el aro blanco: más claro arriba a la izquierda; el canto de dentro, gris
    const borde = !enE(x, y, {yc: ARO_D.yc, rx: ARO_D.rx + 1.3, ry: ARO_D.ry + 1.1});
    const u = (x - CX) / ARO_F.rx;
    if (!borde) return y < ARO_F.yc ? C.gris2 : C.gris1;
    return u < -0.3 ? C.blanco : u > 0.55 ? C.gris1 : bayer(xi, yi) < 0.5 ? C.blanco : C.gris1;
  }
  if (z === 'labio') {
    const u = (x - CX) / ARO_F.rx;
    return u < -0.4 ? C.gris1 : u > 0.5 ? C.gris3 : C.gris2;
  }
  // el cuerpo: un cilindro rojo con luz por la izquierda, su brillo de plástico y las costillas
  const w = ancho(Math.min(y, BASE.yc));
  const u = (x - CX) / w;
  const b = bayer(xi, yi);
  let c: number;
  if (u < -0.62) c = C.rojo3;
  else if (u < -0.25) c = b < (u + 0.62) / 0.37 ? C.rojo2 : C.rojo3;
  else if (u < 0.3) c = C.rojo2;
  else if (u < 0.7) c = b < (u - 0.3) / 0.4 ? C.rojo1 : C.rojo2;
  else c = u > 0.9 ? C.rojo0 : C.rojo1;
  if (Math.abs(u + 0.5) * w < 0.6) c = C.rojo4; // el brillo
  for (const uk of COSTILLAS) if (Math.abs(u - uk) * w < 0.5 && Math.abs(u + 0.5) * w >= 0.6) c = OSCURO[c];
  // la sombra del aro sobre el cuerpo, justo debajo del labio
  if (y < ARO_F.yc + ARO_F.ry * Math.sqrt(Math.max(0, 1 - u * u)) + LABIO + 2) c = OSCURO[c];
  return c;
};

// pinta la parte de detrás (el hueco, la mitad de atrás del aro) o la de delante (el cuerpo, la mitad de delante del aro)
export const pintarPapelera = (l: Lienzo, inclina: number, parte: 'detras' | 'delante') => {
  const ca = Math.cos(inclina), sa = Math.sin(inclina);
  const local = (x: number, y: number): [number, number] => {
    const dx = x + 0.5 - PIVOTE[0], dy = y + 0.5 - PIVOTE[1];
    return [PIVOTE[0] + dx * ca + dy * sa, PIVOTE[1] - dx * sa + dy * ca];
  };
  const dentro = (x: number, y: number) => {
    const [a, b] = local(x, y);
    return zona(a, b) !== 'nada';
  };
  const x0 = CX - ARO_F.rx - 6, x1 = CX + ARO_F.rx + 6, y0 = ARO_F.yc - ARO_F.ry - 6, y1 = BASE.yc + BASE.ry + 3;
  l.region(x0, y0, x1, y1, (x, y) => {
    const [a, b] = local(x, y);
    const z = zona(a, b);
    const delante = b >= ARO_F.yc;
    if (z === 'nada') return T;
    // el contorno: el de fuera, en tinta; el de la boca, en rojo muy oscuro
    const fuera = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
    let c: number;
    if (fuera) c = C.tinta;
    else if (z === 'aro' && enE(a, b, {yc: ARO_D.yc, rx: ARO_D.rx + 0.6, ry: ARO_D.ry + 0.5})) c = C.tinta;
    else c = colorPapelera(a, b, z, x, y);
    if (parte === 'detras') return z === 'hueco' || !delante ? c : T;
    return z !== 'hueco' && delante ? c : T;
  });
};

// ---------------------------------------------------------------- la lámpara que cuelga, su bombilla y su halo
const L = LAMPARA;
const GANCHO: [number, number] = [L.x / ESC, L.yGancho / ESC];
const S_TAPA = (L.largo - L.alto / 2 - 26) / ESC, S_ARRIBA = (L.largo - L.alto / 2) / ESC, S_ABAJO = (L.largo + L.alto / 2) / ESC;
const S_BOMBILLA = (L.largo + L.alto / 2 + 14) / ESC;
export const bombillaPx = (ang: number): [number, number] => [GANCHO[0] + S_BOMBILLA * Math.sin(ang), GANCHO[1] + S_BOMBILLA * Math.cos(ang)];

export const pintarLampara = (l: Lienzo, ang: number) => {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  // el cable, de tinta
  const fin: [number, number] = [GANCHO[0] + S_TAPA * sa, GANCHO[1] + S_TAPA * ca];
  l.linea(GANCHO[0], GANCHO[1], fin[0], fin[1], C.tinta);
  const rA = L.rArriba / ESC, rB = L.rAbajo / ESC;
  const [bx, by] = bombillaPx(ang);
  const rb = 26 / ESC;
  l.region(GANCHO[0] - 20, GANCHO[1] + S_TAPA - 4, GANCHO[0] + 20, by + rb + 2, (x, y) => {
    const dx = x + 0.5 - GANCHO[0], dy = y + 0.5 - GANCHO[1];
    const s = dx * sa + dy * ca, w = dx * ca - dy * sa; // a lo largo del cable y de lado
    // la bombilla: amarilla, encendida, con su brillo
    const db = Math.hypot(x + 0.5 - bx, y + 0.5 - by);
    if (db < rb && s > S_ABAJO - 0.5) return db > rb - 0.9 ? C.luz1 : x + 0.5 - bx < -1 && y + 0.5 - by < -0.5 ? C.blanco : C.luz2;
    if (s >= S_TAPA && s < S_ARRIBA && Math.abs(w) < 3.6) return Math.abs(w) > 2.8 ? C.nar0 : w < -0.8 ? C.nar2 : C.nar1;
    if (s >= S_ARRIBA && s <= S_ABAJO) {
      const r = rA + ((rB - rA) * (s - S_ARRIBA)) / (S_ABAJO - S_ARRIBA);
      if (Math.abs(w) > r) return T;
      if (Math.abs(w) > r - 1 || s > S_ABAJO - 1) return C.nar0;
      const u = w / r;
      if (s > S_ABAJO - 2.2) return u < -0.3 ? C.nar2 : C.nar1; // el canto de abajo
      const b = bayer(x, y);
      return u < -0.55 ? C.nar3 : u < -0.1 ? (b < 0.5 ? C.nar3 : C.nar2) : u < 0.5 ? C.nar2 : b < 0.5 ? C.nar1 : C.nar2;
    }
    return T;
  });
};
// el halo: los píxeles de alrededor suben uno o dos escalones de su rampa, tramados (la luz de una consola)
export const pintarHalo = (l: Lienzo, ang: number, paso: number) => {
  const [bx, by] = bombillaPx(ang);
  const R = 30 + (hash(paso, 3) - 0.5) * 2;
  l.tabla(bx - R, by - R * 0.8, bx + R, by + R, CLARO, (x, y) => {
    const d = Math.hypot(x + 0.5 - bx, (y + 0.5 - by) * 1.1);
    return d < R && bayer(x, y) < (1 - d / R) * 1.15 - 0.05;
  });
  l.tabla(bx - 13, by - 10, bx + 13, by + 13, CLARO, (x, y) => {
    const d = Math.hypot(x + 0.5 - bx, y + 0.5 - by);
    return d < 12 && bayer(x, y) < (1 - d / 12) * 1.2;
  });
};

// ---------------------------------------------------------------- los efectos de juego
// la estrella del choque: 5 fotogramas a 20 por segundo (pequeña, grande, rayos sueltos, chispas, puntos)
export const pintarEstrella = (l: Lienzo, x: number, y: number, k: number, grande = 1) => {
  const X = Math.round(x), Y = Math.round(y);
  const s = sprite(X - 24, Y - 24);
  const rayo = (dx: number, dy: number, r0: number, r1: number, c0: number, c1: number) => {
    for (let r = r0; r <= r1; r++) s.px(X + Math.round(dx * r), Y + Math.round(dy * r), r < (r0 + r1) / 2 ? c0 : c1);
  };
  const g = grande;
  const rectos: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const diag: [number, number][] = [[0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071]];
  if (k === 0) {
    s.rect(X - 1, Y - 1, 3, 3, C.blanco);
    for (const [dx, dy] of rectos) rayo(dx, dy, 2, 3, C.luz2, C.luz1);
  } else if (k === 1) {
    s.rect(X - 2, Y - 2, 5, 5, C.blanco);
    for (const [dx, dy] of rectos) { rayo(dx, dy, 3, Math.round(8 * g), C.luz2, C.oro); rayo(dx + dy * 0.12, dy + dx * 0.12, 3, Math.round(5 * g), C.luz2, C.luz1); }
    for (const [dx, dy] of diag) rayo(dx, dy, 3, Math.round(5 * g), C.luz1, C.nar2);
  } else if (k === 2) {
    s.px(X, Y, C.blanco);
    for (const [dx, dy] of rectos) rayo(dx, dy, Math.round(5 * g), Math.round(10 * g), C.blanco, C.luz1);
    for (const [dx, dy] of diag) rayo(dx, dy, Math.round(5 * g), Math.round(7 * g), C.luz1, C.nar2);
  } else if (k === 3) {
    for (const [dx, dy] of diag) {
      const cx = X + Math.round(dx * 10 * g), cy = Y + Math.round(dy * 10 * g);
      s.px(cx, cy, C.blanco); s.px(cx + 1, cy, C.luz1); s.px(cx - 1, cy, C.luz1); s.px(cx, cy + 1, C.luz1); s.px(cx, cy - 1, C.luz1);
    }
  } else if (k === 4) {
    for (const [dx, dy] of diag) s.px(X + Math.round(dx * 12 * g), Y + Math.round(dy * 12 * g), C.luz1);
  } else return;
  contorno(s, C.tinta);
  pegar(l, X - 24, Y - 24);
};
// el polvo del suelo: dos bolitas que salen a los lados y se deshacen (4 fotogramas a 15 por segundo)
export const pintarPolvo = (l: Lienzo, x: number, y: number, k: number, fuerza: number) => {
  if (k < 0 || k > 3) return;
  const g = Math.min(1.3, 0.6 + fuerza / 3000);
  const r = [1.6, 2.6, 3, 2.6][k] * g;
  for (const lado of [-1, 1]) {
    const cx = x + lado * (2 + 2.6 * k) * g, cy = y - 1.5 - k * 0.8;
    l.region(cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1, (px, py) => {
      const d = Math.hypot(px + 0.5 - cx, py + 0.5 - cy);
      if (d > r) return T;
      if (k >= 2 && (px + py) % 2) return T;
      return py + 0.5 < cy - r * 0.3 ? C.blanco : C.gris1;
    });
  }
};
