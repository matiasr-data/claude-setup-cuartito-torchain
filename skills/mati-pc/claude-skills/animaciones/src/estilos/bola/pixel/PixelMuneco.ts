import {ALTO, MUNECO, PLACA, SILLA, STUD, SUELO, escalaEn, esqueleto, giroRaiz, proyecta, type Cara, type Pose, type V3} from '../escena';
import {C, ESC, Lienzo, T, bayer, contorno, volcar} from './PixelMotor';

// PIXEL ART · EL MUÑECO Y SU SILLA: el protagonista como un sprite grande de 16 bits (de los de lucha, ~95 px de
// alto), sacado del esqueleto de ../escena.ts en cada postura: pelo marrón con sus puntas, camisa amarilla con el cuello blanco y la
// corbata roja, pantalón azul marino y zapatos negros, en tres tonos con la luz arriba a la izquierda, cada pieza con su raya oscura y
// toda la silueta con su contorno de tinta. La cabeza es un cilindro: la cara está donde mira (los ojos, las cejas y la boca de cada
// cara de escena.ts, a píxeles) y por detrás se ve el pelo y la oreja. La silla de oficina azul cielo gira con él.

const M = MUNECO;
const CAPA = new Lienzo();
const P = (v: V3): [number, number] => {
  const [a, b] = proyecta(v);
  return [a / ESC, b / ESC];
};
const tam = (v: number, z: number) => (v * M.escala * escalaEn(z)) / ESC; // una medida del muñeco, en px del lienzo

// las rampas: [borde, sombra, medio, luz]
const CAMISA = [C.amar0, C.amar1, C.amar2, C.amar3];
const PANTALON = [C.azul0, C.azul1, C.azul2, C.azul3];
const PIEL = [C.piel0, C.piel1, C.piel2, C.piel3];
const PELO = [C.pelo0, C.pelo1, C.pelo2, C.pelo3];
const ZAPATO = [C.tinta, C.tinta, C.gris4, C.gris3];
// lo de detrás (el brazo y la pierna del lado lejano), un escalón más oscuro: así se separa del cuerpo
const CAMISA_LEJOS = [C.amar0, C.amar0, C.amar1, C.amar2];
const PANTALON_LEJOS = [C.azul0, C.azul0, C.azul1, C.azul2];

// un trozo redondeado (brazo, pierna) de a a b, con su sombreado de cilindro
const capsula = (l: Lienzo, a: [number, number], b: [number, number], r: number, rampa: number[], rb = r) => {
  const ab: [number, number] = [b[0] - a[0], b[1] - a[1]];
  const L2 = ab[0] * ab[0] + ab[1] * ab[1] || 1;
  const R = Math.max(r, rb);
  l.region(Math.min(a[0], b[0]) - R - 1, Math.min(a[1], b[1]) - R - 1, Math.max(a[0], b[0]) + R + 1, Math.max(a[1], b[1]) + R + 1, (x, y) => {
    const px = x + 0.5 - a[0], py = y + 0.5 - a[1];
    const k = Math.max(0, Math.min(1, (px * ab[0] + py * ab[1]) / L2));
    const ox = px - ab[0] * k, oy = py - ab[1] * k;
    const rr = r + (rb - r) * k;
    const d = Math.hypot(ox, oy);
    if (d > rr) return T;
    if (d > rr - 1) return rampa[0];
    const lum = (-0.6 * ox - 0.8 * oy) / rr;
    return lum > 0.32 ? rampa[3] : lum < -0.42 ? rampa[1] : rampa[2];
  });
};
const disco = (l: Lienzo, c: [number, number], r: number, rampa: number[]) => capsula(l, c, [c[0] + 0.01, c[1]], r, rampa);

// ---------------------------------------------------------------- una caja girada (la silla): sus caras a la vista
const caja = (l: Lienzo, c: V3, an: number, al: number, fo: number, giro: number, col: {arriba: number; luz: number; sombra: number; borde: number}) => {
  const cg = Math.cos(giro), sg = Math.sin(giro);
  const esq = (sx: number, sy: number, sz: number): [number, number] => {
    const lx = (sx * an) / 2, lz = (sz * fo) / 2;
    return P([c[0] + lx * cg + lz * sg, c[1] + (sy * al) / 2, c[2] - lx * sg + lz * cg]);
  };
  // las cuatro caras de lado: su normal (en x, z) y sus esquinas
  const caras: {n: [number, number]; q: [number, number][]}[] = [
    {n: [sg, cg], q: [esq(-1, -1, 1), esq(1, -1, 1), esq(1, 1, 1), esq(-1, 1, 1)]},
    {n: [-sg, -cg], q: [esq(1, -1, -1), esq(-1, -1, -1), esq(-1, 1, -1), esq(1, 1, -1)]},
    {n: [cg, -sg], q: [esq(1, -1, 1), esq(1, -1, -1), esq(1, 1, -1), esq(1, 1, 1)]},
    {n: [-cg, sg], q: [esq(-1, -1, -1), esq(-1, -1, 1), esq(-1, 1, 1), esq(-1, 1, -1)]},
  ];
  for (const f of caras) {
    if (f.n[1] < 0.04) continue;
    l.poligono(f.q, f.n[0] < 0 ? col.luz : col.sombra);
    for (let i = 0; i < 4; i++) l.linea(...f.q[i], ...f.q[(i + 1) % 4], col.borde);
  }
  const arriba = [esq(-1, -1, -1), esq(1, -1, -1), esq(1, -1, 1), esq(-1, -1, 1)];
  l.poligono(arriba, col.arriba);
  for (let i = 0; i < 4; i++) l.linea(...arriba[i], ...arriba[(i + 1) % 4], col.borde);
};

const silla = (l: Lienzo, pose: Pose) => {
  const yAs = SUELO - SILLA.asiento; // el alto del asiento sobre el suelo
  const cx = SILLA.x, cz = SILLA.z;
  // la base de cinco patas con sus ruedas (las de detrás primero)
  const patas = [0, 1, 2, 3, 4].map((k) => (k / 5) * Math.PI * 2 + 0.3).sort((a, b) => Math.cos(a) - Math.cos(b));
  const centro = P([cx, SUELO - 34, cz]);
  for (const a of patas) {
    const fin = P([cx + Math.sin(a) * STUD * 1.95, SUELO - 22, cz + Math.cos(a) * STUD * 1.95]);
    capsula(l, centro, fin, 1.7, [C.tinta, C.tinta, C.gris4, C.gris4]);
    const rueda = P([cx + Math.sin(a) * STUD * 2.1, SUELO - 8, cz + Math.cos(a) * STUD * 2.1]);
    disco(l, rueda, 1.9, [C.tinta, C.gris4, C.gris3, C.gris2]);
  }
  // el poste
  const arribaPoste = P([cx, SILLA.asiento + PLACA * 1.5, cz]);
  capsula(l, centro, arribaPoste, 1.6, [C.gris4, C.gris3, C.gris2, C.gris1]);
  disco(l, centro, 3.2, [C.tinta, C.tinta, C.gris4, C.gris3]);
  // el respaldo y el asiento, que giran con él
  const g = giroRaiz(pose);
  const col = {arriba: C.silla3, luz: C.silla2, sombra: C.silla1, borde: C.silla0};
  const off = (lz: number): [number, number] => [lz * Math.sin(g), lz * Math.cos(g)];
  const [rx, rz] = off(-STUD * 1.5 - 4);
  caja(l, [cx + rx, SUELO - (yAs - 4) - (ALTO * 2.1) / 2, cz + rz], 3 * STUD, ALTO * 2.1, STUD, g, col);
  const [sx, sz] = off(-6);
  caja(l, [cx + sx, SUELO - yAs + (PLACA * 1.5) / 2, cz + sz], 3 * STUD, PLACA * 1.5, 3 * STUD, g, col);
};

// ---------------------------------------------------------------- la cara (a píxeles)
type Ojo = 'normal' | 'grande' | 'susto' | 'cerrado' | 'feliz' | 'medio';
type Boca = 'linea' | 'sonrisa' | 'dientes' | 'o' | 'triste' | 'lado' | 'grande' | 'ondas';
const CARAS: Record<Cara, {ojo: Ojo; ceja: [number, number, number]; boca: Boca; rubor?: boolean}> = {
  atento: {ojo: 'normal', ceja: [0, 0, 1], boca: 'linea'},
  ilusion: {ojo: 'grande', ceja: [0, -1, -1], boca: 'sonrisa', rubor: true},
  tension: {ojo: 'grande', ceja: [1, 0, -1], boca: 'dientes'},
  ay: {ojo: 'grande', ceja: [0, -1, -2], boca: 'o'},
  fastidio: {ojo: 'cerrado', ceja: [-1, 0, 1], boca: 'triste'},
  meh: {ojo: 'medio', ceja: [0, 0, 0], boca: 'lado'},
  susto: {ojo: 'susto', ceja: [-1, -2, -2], boca: 'ondas'},
  feliz: {ojo: 'feliz', ceja: [0, -1, -1], boca: 'grande', rubor: true},
  serio: {ojo: 'medio', ceja: [0, 0, 0], boca: 'linea'},
};
const BOCAS: Record<Boca, string[]> = {
  // . nada · t tinta · b blanco · r rojo
  linea: ['ttt'],
  sonrisa: ['t...t', '.ttt.'],
  dientes: ['ttttt', 'tbbbt', 'ttttt'],
  o: ['.t.', 'trt', 'trt', '.t.'],
  triste: ['.ttt.', 't...t'],
  lado: ['...t', '.tt.', 't...'],
  grande: ['ttttt', 'tbbbt', 'trrrt', '.ttt.'],
  ondas: ['.t.t.', 't.t.t'],
};

const pintarOjo = (l: Lienzo, ex: number, ey: number, ojo: Ojo, mira: [number, number], izquierdo: boolean, estrecho: boolean) => {
  const x = Math.round(ex), y = Math.round(ey);
  const dx = mira[0] > 0.35 ? 1 : mira[0] < -0.35 ? -1 : 0;
  const dy = mira[1] > 0.4 ? 1 : mira[1] < -0.4 ? -1 : 0;
  if (ojo === 'normal') {
    l.rect(x, y, estrecho ? 1 : 2, 3, C.tinta);
    if (!estrecho) l.px(x + (dx > 0 ? 1 : 0), y + (dy > 0 ? 1 : 0), C.blanco);
  } else if (ojo === 'grande') {
    const w = estrecho ? 2 : 3;
    l.rect(x - (estrecho ? 0 : 1), y - 1, w, 4, C.blanco);
    l.rect(x - (estrecho ? 0 : 1), y - 2, w, 1, C.tinta);
    const pxx = estrecho ? x : x - 1 + (dx > 0 ? 1 : 0);
    l.rect(pxx, y + (dy < 0 ? -1 : 0), estrecho ? 1 : 2, 3, C.tinta);
  } else if (ojo === 'susto') {
    l.rect(x - 1, y - 2, 4, 5, C.tinta);
    l.rect(x, y - 1, 2, 3, C.blanco);
    l.px(x + (dx > 0 ? 1 : 0), y, C.tinta);
  } else if (ojo === 'cerrado') {
    // >  < : los ojos apretados
    const s = izquierdo ? 1 : -1;
    l.px(x + (s > 0 ? 0 : 2), y - 1, C.tinta);
    l.px(x + 1, y, C.tinta);
    l.px(x + (s > 0 ? 2 : 0), y, C.tinta);
    l.px(x + (s > 0 ? 0 : 2), y + 1, C.tinta);
  } else if (ojo === 'feliz') {
    l.px(x - 1, y + 1, C.tinta);
    l.px(x, y, C.tinta);
    l.px(x + 1, y, C.tinta);
    l.px(x + 2, y + 1, C.tinta);
  } else {
    // a media asta: el párpado y la pupila debajo
    l.rect(x - 1, y, 3, 1, C.tinta);
    l.rect(x + (dx > 0 ? 0 : -1) + (estrecho ? 1 : 0), y + 1, estrecho ? 1 : 2, 2, C.tinta);
  }
};

export type Cabeza = {cx: number; cy: number; r: number; hh: number; detras: number}; // detras: el lado del pelo (−1 izquierda, 1 derecha)

const pintarCabeza = (l: Lienzo, pose: Pose, c: [number, number], z: number, frente: V3): Cabeza => {
  const r = tam(M.cabeza.r, z), hh = tam(M.cabeza.alto / 2, z);
  const [cx, cy] = c;
  const phi = Math.atan2(frente[0], frente[2]); // hacia dónde mira la cara, alrededor del cilindro (0 = a la cámara)
  const dyF = Math.round(frente[1] * 3.2); // si mira arriba, la cara sube
  const detras = Math.sin(phi) >= 0 ? -1 : 1;
  // la forma: un cilindro visto casi de frente (un cuadrado muy redondeado)
  const forma = (dx: number, dy: number, ex = 0) => Math.abs(dx / (r + ex)) ** 2.4 + Math.abs(dy / (hh + ex)) ** 2.4 <= 1;
  // el ángulo de cada columna respecto a la cara: < 0 es la nuca
  const haciaCara = (dx: number) => Math.cos(Math.asin(Math.max(-1, Math.min(1, dx / r))) - phi);
  const yPelo = -hh + 4.5;
  // el pelo: el casco de arriba (un pelo más grande que la cabeza), la nuca (del lado de atrás, hasta media oreja) y el flequillo
  // en dientes de sierra sobre la frente
  const pelo = (dx: number, dy: number) => {
    if (!forma(dx, dy, 1.1)) return false;
    if (dy < yPelo) return true;
    const h = haciaCara(dx);
    if (h < 0.1 && dy < hh * 0.42) return true;
    if (h > 0.55 && dy < yPelo + 2.4 - (Math.floor(dx + 40) % 3) * 0.9) return true;
    return false;
  };
  l.region(cx - r - 3, cy - hh - 6, cx + r + 3, cy + hh + 2, (x, y) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    const u = dx / r;
    if (pelo(dx, dy)) {
      // su borde: por fuera, el más oscuro; donde toca la piel, uno menos
      if (!forma(dx, dy, 0.1)) return PELO[0];
      if (!pelo(dx, dy + 1) && forma(dx, dy + 1)) return PELO[1];
      if (dy < -hh + 1.8 && u < 0.15 && u > -0.7) return PELO[3]; // el brillo
      const lum = -0.75 * u - 0.45 * (dy / hh);
      return lum > 0.55 ? PELO[3] : lum < -0.15 ? PELO[1] : PELO[2];
    }
    if (!forma(dx, dy)) return T;
    if (!forma(dx, dy, -1)) return PIEL[0];
    const lum = -0.8 * u - 0.35 * (dy / hh);
    if (dy > hh - 2.2 && lum < 0.4) return PIEL[1]; // la sombra de la barbilla
    return lum > 0.42 ? PIEL[3] : lum < -0.38 ? PIEL[1] : PIEL[2];
  });
  // las puntas del pelo (tres, peinadas hacia atrás)
  const peine = detras * 1.2;
  for (const [ox, al] of [[-6, 3], [-0.5, 4], [5.5, 3]] as [number, number][]) {
    const bx = cx + ox + Math.sin(phi) * 2, by = cy - hh - 0.5;
    l.region(bx - 3, by - al - 1, bx + 3, by + 1, (x, y) => {
      const k = (by - (y + 0.5)) / al; // 0 abajo, 1 en la punta
      if (k < 0 || k > 1) return T;
      const mitad = 2.6 * (1 - k);
      const d = x + 0.5 - (bx + peine * k);
      if (Math.abs(d) > mitad) return T;
      return Math.abs(d) > mitad - 0.9 ? PELO[0] : d < 0 ? PELO[3] : PELO[2];
    });
  }
  // la oreja, del lado que se ve (en la raya del pelo)
  const aOreja = phi + (detras > 0 ? Math.PI / 2 : -Math.PI / 2);
  if (Math.cos(aOreja) > 0.2) {
    const ox = Math.round(cx + r * Math.sin(aOreja) * 0.9), oy = Math.round(cy + dyF * 0.5);
    l.rect(ox - 1, oy - 1, 3, 4, PIEL[0]);
    l.rect(ox, oy, 1, 2, PIEL[2]);
  }
  // la nariz: de perfil asoma por el borde; de frente, una sombra
  const sn = Math.sin(phi);
  if (Math.abs(sn) > 0.62 && Math.cos(phi) > -0.2) {
    const lado = Math.sign(sn);
    const nx = Math.round(cx + lado * (r + 0.2)) - (lado < 0 ? 1 : 0), ny = Math.round(cy + 1.5 + dyF);
    l.rect(nx, ny, 1, 2, PIEL[2]);
    l.px(nx - lado, ny + 1, PIEL[1]);
  } else if (Math.cos(phi) > 0.2) {
    l.px(Math.round(cx + (r - 1) * sn), Math.round(cy + 1.5 + dyF), PIEL[1]);
  }
  // la cara
  const cara = CARAS[pose.cara];
  const ojos = [phi + 0.36, phi - 0.36]; // [el de la derecha de la pantalla, el de la izquierda]
  const ey = cy - 1.5 + dyF;
  for (let k = 0; k < 2; k++) {
    const a = ojos[k];
    if (Math.cos(a) < 0.16) continue;
    const s = Math.sin(a);
    const estrecho = Math.abs(s) > 0.84;
    const ex = cx + (r - 1) * s - (estrecho ? 0 : 0.5);
    pintarOjo(l, ex, ey, cara.ojo, pose.ojos, k === 1, estrecho);
    // la ceja: [fuera, medio, dentro]; dentro es hacia el centro de la cara
    const izq = k === 1;
    const [cf, cm, cd] = cara.ceja;
    const by = Math.round(ey) - (cara.ojo === 'grande' || cara.ojo === 'susto' ? 4 : 3);
    const bx = Math.round(ex) - 1;
    const ys = izq ? [cf, cm, cd] : [cd, cm, cf];
    for (let i = 0; i < (estrecho ? 2 : 3); i++) l.px(bx + i + (estrecho && !izq ? 1 : 0), by + ys[i], C.pelo1);
    if (cara.rubor && !estrecho) l.rect(Math.round(ex) - (izq ? 2 : 0), Math.round(ey) + 3, 2, 1, C.rosa);
  }
  const ms = Math.sin(phi);
  if (Math.cos(phi) > -0.1) {
    const forma = BOCAS[cara.boca];
    const mx = Math.round(cx + (r - 1.5) * ms * 0.94 - forma[0].length / 2 + 0.5), my = Math.round(cy + 4 + dyF);
    forma.forEach((fila, j) => {
      for (let i = 0; i < fila.length; i++) {
        const ch = fila[i];
        if (ch === '.') continue;
        l.px(mx + i, my + j, ch === 't' ? C.tinta : ch === 'b' ? C.blanco : C.rojo3);
      }
    });
  }
  return {cx, cy, r, hh, detras};
};

// ---------------------------------------------------------------- el cuerpo: una caja amarilla con la camisa (el lado con luz y el
// frente con el cuello y la corbata), la cadera azul debajo
const pintarTorso = (l: Lienzo, pose: Pose, pecho: [number, number], cuello: [number, number], z: number) => {
  const g = pose.gira;
  const an = tam(M.torso.an, z), fo = tam(M.torso.fondo, z), h = tam(M.torso.alto, z);
  // el eje del cuerpo en pantalla (de abajo arriba)
  let ax = cuello[0] - pecho[0], ay = cuello[1] - pecho[1];
  const n = Math.hypot(ax, ay) || 1;
  ax /= n; ay /= n;
  const px = -ay, py = ax; // de lado (hacia la derecha si el eje va hacia arriba)
  const sx = Math.abs(Math.sin(g)), cxg = Math.abs(Math.cos(g));
  const xl = -(sx * an) / 2 - (cxg * fo) / 2, xc = -(sx * an) / 2 + (cxg * fo) / 2, xr = (sx * an) / 2 + (cxg * fo) / 2;
  const base: [number, number] = [pecho[0] - (ax * h) / 2, pecho[1] - (ay * h) / 2];
  const fc = (xc + xr) / 2, fw = xr - xc;
  const corbata = Math.max(0.7, 1.5 * sx);
  const R = Math.max(an, fo) + 6;
  l.region(pecho[0] - R, pecho[1] - R, pecho[0] + R, pecho[1] + R, (x, y) => {
    const vx = x + 0.5 - base[0], vy = y + 0.5 - base[1];
    const a = vx * ax + vy * ay; // a lo largo (0 abajo, h arriba)
    const s = vx * px + vy * py; // de lado
    if (a < -3.2 || a > h || s < xl || s > xr) return T;
    // las esquinas de arriba, redondeadas
    if (a > h - 1.6 && (s < xl + 1.4 || s > xr - 1.4)) return T;
    if (a < 0) return a < -2.2 || s < xl + 1 || s > xr - 1 ? C.azul0 : s < xc ? C.azul2 : C.azul1; // la cadera
    if (s < xl + 1 || s > xr - 1 || a > h - 1 || a < 1) return a < 1 ? C.nogal0 : C.amar0;
    const b = bayer(x, y);
    if (s < xc) {
      // el lado con luz
      if (a > h - 2) return C.amar4;
      return a < h * 0.35 && b < (h * 0.35 - a) / (h * 0.35) ? C.amar2 : C.amar3;
    }
    // el frente: el cuello blanco, la corbata y la sombra hacia la derecha
    const d = s - fc;
    if (fw >= 2) {
      if (Math.abs(d) < corbata && a > h * 0.14 && a < h - 2.5) {
        const punta = a < h * 0.14 + 1.2 && Math.abs(d) > corbata * 0.4;
        if (punta) return C.amar1;
        return Math.abs(d) > corbata - 0.6 ? C.rojo1 : d < 0 ? C.rojo3 : C.rojo2;
      }
      if (a >= h - 2.5 && Math.abs(d) < corbata * 0.9) return C.rojo1; // el nudo
      if (a > h - 4.2 && Math.abs(d) < fw * 0.42 && Math.abs(d) > (h - a) * 0.55 * Math.max(0.5, sx)) return a > h - 1.8 ? C.blanco : C.gris1;
    }
    if (a > h - 2) return C.amar3;
    const u = (s - xc) / Math.max(1, fw);
    return u > 0.75 ? C.amar1 : u > 0.45 && b < (u - 0.45) * 2.5 ? C.amar1 : C.amar2;
  });
};

// ---------------------------------------------------------------- todo junto
export const pintarMuneco = (l: Lienzo, pose: Pose): Cabeza => {
  CAPA.limpiar();
  CAPA.ox = l.ox;
  CAPA.oy = l.oy;
  silla(CAPA, pose);
  const e = esqueleto(pose);
  const g = pose.gira;
  const zc = e.pecho[2];
  // las caderas (donde salen las piernas): a cada lado de la cadera
  const lado: V3 = [Math.sin(g), 0, -Math.cos(g)]; // hacia su izquierda
  const cad = (s: number): V3 => [e.cadera[0] + s * lado[0] * M.pierna.x * M.escala, e.cadera[1], e.cadera[2] + s * lado[2] * M.pierna.x * M.escala];
  const frente: V3 = [Math.cos(g), 0, Math.sin(g)];
  const piezas: {z: number; pinta: () => void}[] = [];
  // las piernas: el muslo, la espinilla y el zapato
  for (const [k, s] of [[0, -1], [1, 1]] as [0 | 1, number][]) {
    const h = cad(s), rod = e.rodilla[k], pie = e.pie[k];
    piezas.push({
      z: rod[2] - 4,
      pinta: () => {
        const zapA = P([pie[0] - frente[0] * 10, pie[1] - 4, pie[2] - frente[2] * 10]), zapB = P([pie[0] + frente[0] * 58, pie[1] + 2, pie[2] + frente[2] * 58]);
        const pant = k === 1 ? PANTALON_LEJOS : PANTALON;
        capsula(CAPA, P(rod), P(pie), tam(30, pie[2]) * 0.92, pant, tam(27, pie[2]) * 0.92);
        capsula(CAPA, zapA, zapB, tam(17, pie[2]), ZAPATO);
        capsula(CAPA, P(h), P(rod), tam(33, rod[2]), pant);
      },
    });
  }
  // el cuerpo y el cuello
  piezas.push({
    z: zc,
    pinta: () => {
      capsula(CAPA, P(e.cuello), P([e.cuello[0], e.cuello[1] + 10, e.cuello[2]]), tam(17, zc), PIEL);
      pintarTorso(CAPA, pose, P(e.pecho), P(e.cuello), zc);
    },
  });
  // los brazos: la manga amarilla y la mano
  for (const k of [0, 1] as const) {
    const h = e.hombro[k], c = e.codo[k], m = e.mano[k];
    piezas.push({
      z: (c[2] + m[2]) / 2 + 2,
      pinta: () => {
        const manga = k === 1 ? CAMISA_LEJOS : CAMISA;
        capsula(CAPA, P(h), P(c), tam(24, c[2]) * 0.95, manga);
        const pm = P(m), pc = P(c);
        const dir = [pm[0] - pc[0], pm[1] - pc[1]], dl = Math.hypot(dir[0], dir[1]) || 1;
        const rm = tam(M.rMano, m[2]) * 0.85;
        capsula(CAPA, pc, [pm[0] - (dir[0] / dl) * rm * 0.7, pm[1] - (dir[1] / dl) * rm * 0.7], tam(22, m[2]) * 0.95, manga);
        disco(CAPA, pm, rm, PIEL);
      },
    });
  }
  // la cabeza, siempre delante del cuerpo
  let cab: Cabeza = {cx: 0, cy: 0, r: 0, hh: 0, detras: 1};
  piezas.push({z: Math.max(e.cabeza[2], zc + 1), pinta: () => (cab = pintarCabeza(CAPA, pose, P(e.cabeza), e.cabeza[2], e.frente))});
  piezas.sort((a, b) => a.z - b.z);
  for (const p of piezas) p.pinta();
  contorno(CAPA, C.tinta);
  volcar(CAPA, l);
  return cab;
};
