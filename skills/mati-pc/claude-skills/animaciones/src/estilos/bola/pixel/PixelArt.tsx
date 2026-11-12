import React, {useLayoutEffect, useRef, useState} from 'react';
import {clamp, rng} from '../../../comun/curvas';
import {DUR, PAPELERA, R_BOLA, T_PRIMERO, _trayecto, bola, lanzamiento, proyecta, type Cara, type V3} from '../escena';
import {copiarFondo, cursor, nubes} from './PixelDecorado';
import {ancho, rotulo, texto} from './PixelFuente';
import {C, CLARO, ESC, LUT, Lienzo, OSCURO, T, W, bayer, blanquea, contorno, presentar, volcar} from './PixelMotor';
import {pintarMuneco, type Cabeza} from './PixelMuneco';
import {PAPELERA_PX, pintarBola, pintarEstela, pintarEstrella, pintarHalo, pintarLampara, pintarPapelera, pintarPolvo, pintarSombraBola} from './PixelPiezas';

// LA BOLA DE PAPEL EN PIXEL ART (la escena en ../escena.ts; en el vídeo es el estilo 1 y enseña el lanzamiento 0,
// «rebota en el borde y sale»). Un juego de consola de los 90, de 16 bits: la escena se pinta en un lienzo escondido de 180 × 320 con
// una paleta limitada y viva, tramado de Bayer y contornos de tinta, y se enseña a 6 × sin suavizar (./PixelMotor.ts). El cuarto es
// un nivel (./PixelDecorado.ts), el muñeco un sprite grande (./PixelMuneco.ts), y la bola, la papelera y la lámpara, sus piezas
// (./PixelPiezas.ts). Va a pasos como un juego: el muñeco, la papelera y la lámpara a 12 posturas por segundo (encajadas en el primer
// toque de cada lanzamiento, como los bloques); la bola, fluida, pero siempre en un píxel entero y girando por fotogramas de 45°.
// Lo que lo hace juego: el marcador de arriba («TIRO 1/10», los 10 tiros con su bola, su X roja o su estrella, y los PUNTOS); la
// estela de la bola y su sombra; en cada golpe, la estrella del choque, la sacudida de pantalla en píxeles enteros y un destello de
// paleta; el polvo en el suelo; los globos de emoción encima de él (la gota de sudor, «!», «…», el garabato del fastidio, el corazón);
// y el rótulo de recreativa «¡FALLO!» sobre su franja, o «¡DENTRO!» con los colores corriendo, estrellas, confeti y +100.

const PASOS = 12; // el muñeco, la papelera, la lámpara y los globos
const PB = PAPELERA;
const FRAME = new Lienzo();
const sc = (p: V3): [number, number] => {
  const [a, b] = proyecta(p);
  return [a / ESC, b / ESC];
};

// ---------------------------------------------------------------- lo que pasa en cada lanzamiento (se calcula una vez)
type Resultado = {tFin: number; dentro: boolean; caras: Cara[]; fase: number};
const RES: Resultado[] = [];
const NEGATIVAS: Cara[] = ['ay', 'meh', 'susto', 'fastidio', 'serio'];
const resultado = (i: number): Resultado => {
  if (RES[i]) return RES[i];
  const T1 = T_PRIMERO[i];
  const fase = T1 - Math.floor(T1 * PASOS) / PASOS;
  const caras: Cara[] = [];
  for (let p = 0; p <= Math.ceil(DUR * PASOS) + 1; p++) caras.push(lanzamiento(i, Math.max(0, p / PASOS + fase)).muneco.cara);
  const golpes = _trayecto(i).golpes;
  const pila = golpes.find((g) => g.tipo === 'pila' && g.fuerza > 1500);
  let tFin = DUR;
  let dentro = false;
  if (i === 9 && pila) {
    tFin = pila.t + 0.02;
    dentro = true;
  } else {
    // el fallo se da por hecho cuando la bola ya está fuera y por debajo del aro (o en el suelo)… y él ya lo sabe (su primera cara mala)
    let tFuera = DUR;
    for (let t = T1 + 0.05; t < DUR; t += 1 / 120) {
      const c = bola(i, t).c;
      const rho = Math.hypot(c[0] - PB.x, c[2] - PB.z);
      if ((rho > PB.rBorde + PB.tubo + R_BOLA * 0.6 && c[1] > PB.yBorde + 20) || c[1] > 1520) {
        tFuera = t;
        break;
      }
    }
    let tCara = DUR;
    for (let t = T1; t < DUR; t += 1 / 120) {
      if (NEGATIVAS.includes(lanzamiento(i, t).muneco.cara)) {
        tCara = t;
        break;
      }
    }
    tFin = Math.max(tFuera, tCara) + 0.04;
  }
  RES[i] = {tFin, dentro, caras, fase};
  return RES[i];
};

// ---------------------------------------------------------------- la sacudida y el destello de cada golpe
const SACUDIDA: [number, number][] = [[0, -2], [1, 2], [-1, -1], [1, 1], [0, 0]];
const sacudida = (golpes: ReturnType<typeof _trayecto>['golpes'], t: number, dentro: number | null): [number, number] => {
  let mejor: [number, number] = [0, 0];
  for (const g of golpes) {
    const u = t - g.t;
    if (u < 0 || u >= 5 / 30) continue;
    const fuerte = ['borde', 'muro', 'lampara', 'papelera'].includes(g.tipo) ? g.fuerza : g.tipo === 'suelo' && g.fuerza > 2000 ? g.fuerza * 0.6 : 0;
    if (fuerte < 500) continue;
    const [x, y] = SACUDIDA[Math.floor(u * 30)];
    const k = fuerte > 1300 ? 1 : 0.5;
    mejor = [Math.round(x * k), Math.round(y * k)];
  }
  if (dentro !== null && t >= dentro && t < dentro + 5 / 30) mejor = SACUDIDA[Math.floor((t - dentro) * 30)];
  return mejor;
};

// ---------------------------------------------------------------- los globos de emoción
const globo = (l: Lienzo, x: number, y: number, k: number, dentro: (c: Lienzo, cx: number, cy: number) => void, oscuro = false) => {
  // k: el fotograma desde que aparece (0 pequeño, 1 se pasa, 2… quieto)
  const w = k === 0 ? 9 : 17, h = k === 0 ? 8 : 14;
  const x0 = Math.round(x - w / 2), y0 = Math.round(y - h / 2) - (k === 1 ? 1 : 0);
  const capa = new Lienzo();
  capa.ox = l.ox;
  capa.oy = l.oy;
  const fondo = oscuro ? C.gris4 : C.blanco;
  capa.region(x0, y0, x0 + w - 1, y0 + h - 1, (px, py) => {
    const esquina = (px === x0 || px === x0 + w - 1) && (py === y0 || py === y0 + h - 1);
    return esquina ? T : fondo;
  });
  // la cola, hacia abajo a la izquierda (hacia su cabeza)
  capa.rect(x0 + 3, y0 + h, 3, 1, fondo);
  capa.rect(x0 + 2, y0 + h + 1, 2, 1, fondo);
  capa.px(x0 + 1, y0 + h + 2, fondo);
  if (k > 0) dentro(capa, x0 + Math.floor(w / 2), y0 + Math.floor(h / 2));
  contorno(capa, C.tinta);
  volcar(capa, l);
};
const pintarEmocion = (l: Lienzo, cara: Cara, cab: Cabeza, desde: number, t: number) => {
  const k = Math.floor((t - desde) * 15);
  const bota = k > 2 && Math.floor(t * 4) % 2 ? -1 : 0;
  const lado = -cab.detras; // del lado de la cara
  const gx = cab.cx + lado * 7 + 5, gy = cab.cy - cab.hh - 18 + bota;
  if (cara === 'tension') {
    // la gota de sudor, en la sien, que resbala
    const bajada = Math.floor((t - desde) * 6) % 3;
    const sx = Math.round(cab.cx + cab.detras * (cab.r - 1.5)), sy = Math.round(cab.cy - cab.hh + 2 + bajada);
    const capa = new Lienzo();
    capa.ox = l.ox;
    capa.oy = l.oy;
    capa.px(sx + 1, sy, C.cielo3);
    capa.rect(sx, sy + 1, 3, 2, C.cielo2);
    capa.px(sx + 1, sy + 3, C.cielo1);
    capa.px(sx, sy + 1, C.blanco);
    contorno(capa, C.tinta);
    volcar(capa, l);
    return;
  }
  if (cara === 'ilusion') {
    const on = Math.floor(t * 8) % 2;
    for (const [dx, dy, g] of [[lado * (cab.r + 4), -cab.hh - 2, on], [lado * (cab.r + 9), -cab.hh + 5, 1 - on]] as [number, number, number][]) {
      const x = Math.round(cab.cx + dx), y = Math.round(cab.cy + dy);
      const capa = new Lienzo();
      capa.ox = l.ox;
      capa.oy = l.oy;
      const r = g ? 3 : 2;
      for (let q = -r; q <= r; q++) { capa.px(x + q, y, C.luz1); capa.px(x, y + q, C.luz1); }
      capa.px(x, y, C.blanco);
      contorno(capa, C.tinta);
      volcar(capa, l);
    }
    return;
  }
  if (cara === 'ay') {
    globo(l, gx, gy, k, (c, cx, cy) => {
      c.rect(cx - 1, cy - 5, 3, 7, C.rojo2);
      c.rect(cx - 1, cy + 3, 3, 2, C.rojo2);
    });
  } else if (cara === 'susto') {
    globo(l, gx, gy, k, (c, cx, cy) => {
      for (const dx of [-4, 1]) {
        c.rect(cx + dx, cy - 5, 3, 7, C.rojo2);
        c.rect(cx + dx, cy + 3, 3, 2, C.rojo2);
      }
    });
  } else if (cara === 'meh' || cara === 'serio') {
    globo(l, gx, gy, k, (c, cx, cy) => {
      for (let d = -6; d <= 4; d += 5) c.rect(cx + d, cy + 1, 3, 3, C.tinta);
    });
  } else if (cara === 'fastidio') {
    // el garabato del fastidio, en un globo oscuro
    globo(l, gx, gy, k, (c, cx, cy) => {
      const pts: [number, number][] = [[-6, 2], [-4, -4], [-1, 3], [1, -4], [4, 3], [6, -3]];
      for (let s = 1; s < pts.length; s++) {
        c.linea(cx + pts[s - 1][0], cy + pts[s - 1][1], cx + pts[s][0], cy + pts[s][1], C.rojo3);
        c.linea(cx + pts[s - 1][0] + 1, cy + pts[s - 1][1], cx + pts[s][0] + 1, cy + pts[s][1], C.rojo3);
      }
    }, true);
  } else if (cara === 'feliz') {
    globo(l, gx, gy, k, (c, cx, cy) => {
      const corazon = ['.###.###.', '#########', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'];
      corazon.forEach((f, j) => {
        for (let q = 0; q < f.length; q++) if (f[q] === '#') c.px(cx - 4 + q, cy - 4 + j, j < 3 && q > 0 && q < 3 ? C.rojo4 : C.rojo2);
      });
    });
  }
};

// ---------------------------------------------------------------- el marcador de arriba
const panel = (l: Lienzo, x0: number, y0: number, x1: number, y1: number) => {
  l.region(x0, y0, x1, y1, (x, y) => {
    const ex = Math.min(x - x0, x1 - x), ey = Math.min(y - y0, y1 - y);
    if (ex + ey < 1) return T; // las esquinas, redondeadas
    if (ex === 0 || ey === 0 || (ex === 1 && ey === 1)) return C.tinta;
    if (ex === 1 || ey === 1 || (ex === 2 && ey === 2)) return C.blanco;
    if (ex === 2 || ey === 2) return C.gris2;
    const k = (y - y0) / (y1 - y0);
    return bayer(x, y) < k * 1.4 - 0.2 ? C.hud1 : C.hud2;
  });
};
type Icono = 'futuro' | 'actual' | 'fallo' | 'dentro';
const iconoTiro = (l: Lienzo, cx: number, cy: number, tipo: Icono, t: number, grande = false) => {
  const capa = new Lienzo();
  capa.ox = l.ox;
  capa.oy = l.oy;
  if (tipo === 'fallo') {
    // la X roja (más grande al aparecer)
    const r = grande ? 4 : 3;
    for (let d = -r; d <= r; d++) {
      for (const s of [-1, 1]) {
        capa.px(cx + d, cy + s * d, C.rojo2);
        capa.px(cx + d + 1, cy + s * d, d < 0 ? C.rojo3 : C.rojo2);
      }
    }
  } else if (tipo === 'dentro') {
    const estrella = ['....#....', '...###...', '#########', '.#######.', '..#####..', '.###.###.', '##.....##'];
    estrella.forEach((f, j) => {
      for (let q = 0; q < f.length; q++) if (f[q] === '#') capa.px(cx - 4 + q, cy - 3 + j, j < 2 ? C.luz2 : j < 4 ? C.oro : C.amar1);
    });
  } else {
    // la bola de cada tiro: las que quedan, pequeñas y apagadas; la de ahora, grande, blanca y con su aro que parpadea
    const r = tipo === 'actual' ? 4 : 2.5;
    const [c0, c1] = tipo === 'futuro' ? [C.gris4, C.gris3] : [C.gris1, C.blanco];
    capa.region(cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1, (x, y) => {
      const dx = x + 0.5 - cx - 0.5, dy = y + 0.5 - cy - 0.5;
      if (Math.hypot(dx, dy) > r + 0.1) return T;
      return dx + dy < -1.5 ? c1 : c0;
    });
  }
  contorno(capa, C.tinta);
  if (tipo === 'actual' && Math.floor(t * 6) % 2 === 0) contorno(capa, C.amar3);
  volcar(capa, l);
};
const marcador = (l: Lienzo, i: number, t: number, res: Resultado) => {
  const fin = t >= res.tFin;
  // dentro de la zona segura (x 60–1020 de la pantalla = 10–170 del lienzo)
  panel(l, 10, 5, W - 10, 35);
  texto(l, `TIRO ${i + 1}/10`, 15, 10, C.blanco, C.hud0);
  // los puntos: 0 en cada fallo; en el bueno, cuentan hasta 100
  const pts = res.dentro && fin ? Math.min(100, Math.floor((t - res.tFin) * 15) * 10) : 0;
  const s = `PUNTOS ${String(pts).padStart(4, '0')}`;
  texto(l, s, W - 15 - ancho(s), 10, res.dentro && fin && Math.floor(t * 8) % 2 ? C.oro : C.blanco, C.hud0);
  // los diez tiros
  for (let k = 0; k < 10; k++) {
    const cx = Math.round(20 + k * 15.5), cy = 25;
    let tipo: Icono = 'futuro';
    let grande = false;
    if (k < i) tipo = 'fallo';
    else if (k === i) {
      if (fin) {
        tipo = res.dentro ? 'dentro' : 'fallo';
        grande = Math.floor((t - res.tFin) * 15) < 3;
      } else tipo = 'actual';
    }
    iconoTiro(l, cx, cy, tipo, t, grande);
  }
};

// ---------------------------------------------------------------- el rótulo: «¡FALLO!» o «¡DENTRO!» sobre su franja
const FALLO_COL = [C.amar4, C.amar3, C.amar2, C.nar3, C.nar2, C.rojo3, C.rojo2];
const CICLO = [C.oro, C.amar3, C.luz2, C.verde3, C.cielo2, C.blanco, C.rosa, C.amar3];
const LETRAS = [C.amar2, C.verde2, C.cielo1, C.rosa, C.nar2, C.silla3, C.verde3, C.oro];
const Y_ROTULO = 101;
const pintarRotulo = (l: Lienzo, t: number, res: Resultado) => {
  const u = t - res.tFin;
  if (u < 0) return;
  const k = Math.floor(u * 15);
  // la franja: se abre desde el centro en 4 fotogramas (oscurece la pared dos escalones, tramado)
  const media = Math.min(W / 2 + 2, ((k + 1) * (W / 2 + 2)) / 4);
  const y0 = Y_ROTULO - 6, y1 = Y_ROTULO + 27;
  l.tabla(W / 2 - media, y0, W / 2 + media, y1, OSCURO, () => true);
  l.tabla(W / 2 - media, y0, W / 2 + media, y1, OSCURO, () => true);
  l.tabla(W / 2 - media, y0, W / 2 + media, y1, OSCURO, (x, y) => (x + y) % 2 === 0);
  const linea = res.dentro ? C.oro : C.rojo2;
  l.hline(W / 2 - media, W / 2 + media, y0 - 1, linea);
  l.hline(W / 2 - media, W / 2 + media, y1 + 1, linea);
  l.hline(W / 2 - media, W / 2 + media, y0 - 2, C.tinta);
  l.hline(W / 2 - media, W / 2 + media, y1 + 2, C.tinta);
  if (k < 1) return;
  // las letras caen y botan (en píxeles enteros), y después ondean un píxel
  const cae = [0, -16, -5, 2, 0][Math.min(4, k)];
  const onda = (q: number) => (k >= 4 ? Math.round(Math.sin(k * 0.9 + q * 0.85)) : 0);
  if (res.dentro) {
    // cada letra de un color que va corriendo (arriba, un escalón más clara)
    rotulo(l, '¡DENTRO!', W / 2, Y_ROTULO + cae, 3, (f, q) => {
      const c = LETRAS[(q + 800 - Math.floor(k / 2)) % LETRAS.length];
      return f < 2 ? CLARO[c] : c;
    }, (q) => onda(q) - (k >= 4 && (k + q) % 4 === 0 ? 1 : 0), C.tinta);
  } else {
    rotulo(l, '¡FALLO!', W / 2, Y_ROTULO + cae, 3, (f) => FALLO_COL[f], onda, null);
  }
};

// ---------------------------------------------------------------- ¡DENTRO!: estrellas que saltan de la papelera, confeti y +100
const CHISPAS = (() => {
  const r = rng(909);
  return Array.from({length: 9}, (_, k) => ({a: Math.PI * (0.12 + (0.76 * k) / 8) + (r() - 0.5) * 0.15, v: 80 + r() * 55, col: k % 4}));
})();
const CONFETI = (() => {
  const r = rng(77);
  const cols = [C.rojo2, C.amar3, C.verde3, C.cielo2, C.rosa, C.silla3, C.oro];
  return Array.from({length: 54}, () => ({x: 8 + r() * 164, y0: -10 - r() * 110, v: 70 + r() * 50, f: r() * 6, col: cols[Math.floor(r() * cols.length)], ancho: r() < 0.5 ? 3 : 2}));
})();
const fiesta = (l: Lienzo, t: number, td: number) => {
  const u = t - td;
  if (u < 0) return;
  const k = Math.floor(u * 15), uq = k / 15;
  // las estrellas
  const [ox, oy] = [PAPELERA_PX.cx, PAPELERA_PX.yAro - 3];
  for (const s of CHISPAS) {
    if (uq > 1.1) break;
    const x = ox + Math.cos(s.a) * s.v * uq, y = oy - Math.sin(s.a) * s.v * uq + 0.5 * 140 * uq * uq;
    const capa = new Lienzo();
    capa.ox = l.ox;
    capa.oy = l.oy;
    const c = CICLO[(s.col + k) % CICLO.length];
    const X = Math.round(x), Y = Math.round(y);
    capa.rect(X - 1, Y - 1, 3, 3, C.blanco);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const r of [2, 3]) capa.px(X + dx * r, Y + dy * r, c);
    if (k % 2 === 0) for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) capa.px(X + dx * 2, Y + dy * 2, c);
    contorno(capa, C.tinta);
    volcar(capa, l);
  }
  // el confeti, cayendo de arriba con su vaivén
  for (const p of CONFETI) {
    const y = p.y0 + p.v * uq;
    if (y < 36 || y > 300) continue;
    const x = p.x + Math.round(Math.sin(uq * 6 + p.f) * 3);
    const gira = (k + Math.floor(p.f * 3)) % 3;
    // cada papelito da vueltas: de cara (ancho), de canto (fino) y de cara otra vez
    l.rect(x, y, gira === 1 ? 1 : p.ancho, 2, p.col);
  }
  // +100, que sube desde la papelera
  if (uq < 1.4 && !(uq > 1.05 && k % 2)) {
    const y = Math.round(PAPELERA_PX.yAro - 34 - Math.min(14, uq * 30));
    rotulo(l, '+100', PAPELERA_PX.cx + 14, y, 2, (f) => (f < 2 ? C.luz2 : f < 5 ? C.oro : C.amar1), () => 0, null);
  }
};

// ---------------------------------------------------------------- el cuadro entero
type Capa = 'detras' | 'medio' | 'delante';
const capaBola = (c: V3): Capa => {
  const rho = Math.hypot(c[0] - PB.x, c[2] - PB.z);
  if (rho < PB.rBorde) return 'medio';
  if (c[2] < PB.z) return rho <= PB.rBorde + PB.tubo + R_BOLA ? 'medio' : 'detras';
  return 'delante';
};

const componer = (i: number, t: number) => {
  const res = resultado(i);
  const paso = Math.floor((t - res.fase) * PASOS + 1e-6);
  const tq = Math.max(0, paso / PASOS + res.fase);
  const e = lanzamiento(i, tq);
  const b = bola(i, t);
  const golpes = _trayecto(i).golpes.filter((g) => g.t <= t);
  const td = res.dentro ? res.tFin : null;
  const l = FRAME;
  [l.ox, l.oy] = sacudida(golpes, t, td);

  copiarFondo(l);
  nubes(l, t);
  cursor(l, t);
  pintarHalo(l, e.lampara.ang, paso); // primero el halo en la pared; la lámpara, encima y limpia
  pintarLampara(l, e.lampara.ang);
  if (!b.dentro) pintarSombraBola(l, b.c);

  // la bola y su estela, cada una en su capa (detrás de la papelera, dentro o delante)
  const estela: {c: V3; n: number}[] = [];
  let prev = sc(b.c);
  for (let n = 1; n <= 2; n++) {
    const c = bola(i, Math.max(0, t - n / 30)).c;
    const p = sc(c);
    if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) > 3.5) estela.push({c, n: n - 1});
    prev = p;
  }
  const capaB = capaBola(b.c);
  const bolaEn = (capa: Capa) => {
    for (const s of [...estela].reverse()) if (capaBola(s.c) === capa) pintarEstela(l, s.c, s.n);
    if (capaB === capa && !(b.dentro && b.c[1] > PB.yBorde + 40)) pintarBola(l, b);
  };

  bolaEn('detras');
  const cab = pintarMuneco(l, e.muneco);
  pintarPapelera(l, e.papelera.inclina, 'detras');
  bolaEn('medio');
  pintarPapelera(l, e.papelera.inclina, 'delante');
  bolaEn('delante');

  // los efectos de cada golpe
  for (const g of golpes) {
    const u = t - g.t;
    const [gx, gy] = sc(g.p);
    if (['borde', 'muro', 'lampara', 'papelera'].includes(g.tipo) && g.fuerza > 450) pintarEstrella(l, gx, gy, Math.floor(u * 20), clamp(g.fuerza / 1800, 0.7, 1.25));
    if (g.tipo === 'suelo' && g.fuerza > 350) pintarPolvo(l, gx, gy, Math.floor(u * 15), g.fuerza);
  }

  // el globo de lo que siente (desde que puso esa cara)
  const pq = clamp(paso, 0, res.caras.length - 1);
  const cara = res.caras[pq];
  let desde = pq;
  while (desde > 0 && res.caras[desde - 1] === cara) desde--;
  pintarEmocion(l, cara, cab, desde / PASOS + res.fase, t);

  if (td !== null) fiesta(l, t, td);
  pintarRotulo(l, t, res);

  // el marcador no tiembla
  l.ox = 0;
  l.oy = 0;
  marcador(l, i, t, res);

  // el destello de paleta: en los golpes fuertes contra algo duro y, más grande, al entrar
  let flash = 0;
  for (const g of golpes) if (['borde', 'muro', 'lampara'].includes(g.tipo) && g.fuerza > 1400 && t - g.t < 1 / 30) flash = 0.25;
  if (td !== null && t >= td && t - td < 0.1) flash = t - td < 1 / 30 ? 0.5 : 0.25;
  return {l, lut: blanquea(LUT, flash)};
};

export const PixelArt: React.FC<{intento: number; t: number}> = ({intento, t: tt}) => {
  const i = clamp(Math.round(intento), 0, 9);
  const t = clamp(tt, 0, DUR);
  const ref = useRef<HTMLCanvasElement>(null);
  const [dpr] = useState(() => Math.min(2, Math.max(0.25, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1)));
  useLayoutEffect(() => {
    if (!ref.current) return;
    const {l, lut} = componer(i, t);
    presentar(l, lut, ref.current);
  }, [i, t, dpr]);
  return (
    <canvas ref={ref} width={Math.round(1080 * dpr)} height={Math.round(1920 * dpr)}
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#140c1c', imageRendering: 'pixelated'}} />
  );
};
