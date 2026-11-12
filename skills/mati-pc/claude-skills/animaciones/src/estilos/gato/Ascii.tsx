import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {loadFont} from '@remotion/google-fonts/IBMPlexMono';
import {E, clamp, p, rng, temblor} from '../../comun/curvas';
import {
  BORDE, DUR, ESCALA_GATO, FONDO_SUELO, IMPACTO, MESA_G, MESA_Y, PX_M, SUELO, T_CAE, T_SUELO, arcoElipse, cafe, cinta, cuerpoTrazos,
  elipse, enMundo, gato, oreja, pataTrazos, piezasTaza, poli, resta, rot, suma, taza, trozos, vapor,
  type Elipse, type Gato, type Ojo, type P,
} from './escena';
import {
  CH, COLS, CW, FILAS, N, borrar, bordes, copia, dentro, enCelda, escribir, hash, leerCeldas, letraSegmento, negativo, nueva,
  pintarTubo, poner, tinta, trazar, type Celdas, type Reticula,
} from './AsciiMotor';

// EL GATO EN 8 · MATRIX (arte ASCII), con su motor en ./AsciiMotor.ts.
// Todo son letras de verdad en la retícula de 90 × 96, en verde fósforo. La cocina se pinta una vez; el gato y la taza, cada cuadro,
// en sus negativos escondidos (así cada uno tiene su borde). El gato va sombreado por densidad (lo iluminado @ % #, la sombra . :),
// la cola y las patas con trazos que siguen su curva, los ojos en vídeo inverso (el blanco encendido y la pupila un hueco o una
// rendija), los bigotes con - y =, la nariz «v» y la boca «w». Arriba, la orden que se escribe sola y el registro, que mide la taza
// hasta el borde; abajo, la barra de estado.
// El momento: la taza se va dejando un rastro de letras y, al caer, el café sale en el ÚNICO color que no es verde (ámbar), que ya se
// queda en el suelo. Al romperse: un destello del tubo, el golpe, un estallido de - | / \, chispas * + . y los trozos que saltan, y
// la barra avisa «!! AVISO: taza_rota». El gato lo da por bueno: «[ OK ] taza_rota» y, después, «echo "yo no fui"».

const {fontFamily: PLEX, waitUntilDone} = loadFont('normal', {weights: ['600'], subsets: ['latin']});

const FILA_MESA = Math.floor(MESA_Y / CH); // la fila del tablero: por debajo, el aire alrededor del gato no corta la mesa
const RAMPA = ' .:;+*o#%@'; // de menos tinta a más (sin - ni =, que rayan el pelo)
const RAMPA_CARA = ' .:;+'; // la cara, más clara: así se leen los ojos, la nariz y los bigotes
const dentroPoli = (q: P, pts: P[]) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > q[1]) !== (yj > q[1]) && q[0] < ((xj - xi) * (q[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const dentroElipse = (q: P, e: Elipse) => {
  const u = rot(resta(q, e.c), -e.ang);
  return (u[0] / e.rx) ** 2 + (u[1] / e.ry) ** 2 <= 1;
};
const coma = (n: number, d = 2) => n.toFixed(d).replace('.', ',');

// ---------------------------------------------------------------- la cocina: se hace una vez
// la mesa, el radiador y el comedero salen de un negativo; la ventana y la pecera, que son líneas
// rectas, se trazan letra a letra (+ - | =), que en una terminal es como se dibuja una caja
const MF = {mesa: 1, faldon: 2, pataMesa: 3, radiador: 4, aleta: 5, comedero: 6} as const;
const VENTANA = {i0: 5, j0: 14, i1: 31, j1: 31}; // en celdas: x 60–384, y 280–640 (a la izquierda del gato, no detrás de su cara)
const PECERA = {i0: 68, j0: 16, i1: 84, j1: 22}; // x 816–1020, y 320–460
const caja = (g: Reticula, i0: number, j0: number, i1: number, j1: number, br: number, esquina = '+') => {
  for (let i = i0 + 1; i < i1; i++) { poner(g, i, j0, '-', br); poner(g, i, j1, '-', br); }
  for (let j = j0 + 1; j < j1; j++) { poner(g, i0, j, '|', br); poner(g, i1, j, '|', br); }
  for (const [i, j] of [[i0, j0], [i1, j0], [i0, j1], [i1, j1]]) poner(g, i, j, esquina, br);
};
let COCINA: Reticula | null = null;
const cocina = (): Reticula => {
  if (COCINA) return COCINA;
  const g = nueva();
  const A = negativo('cocina');
  const rect = (x: number, y: number, w: number, h: number, tono: number, brillo: number, mat: number) => {
    A.fillStyle = tinta(tono, brillo, mat);
    A.fillRect(x, y, w, h);
  };
  // la mesa
  rect(-20, MESA_Y, BORDE + 20, MESA_G, 0.8, 0.52, MF.mesa);
  rect(136, MESA_Y + MESA_G, 516, 36, 0.58, 0.36, MF.faldon);
  rect(110, MESA_Y + MESA_G, 26, SUELO - MESA_Y - MESA_G, 0.66, 0.4, MF.pataMesa);
  rect(652, MESA_Y + MESA_G, 26, SUELO - MESA_Y - MESA_G, 0.66, 0.4, MF.pataMesa);
  // el radiador, debajo
  rect(160, 1236, 270, 232, 0.28, 0.26, MF.radiador);
  for (let i = 0; i < 8; i++) rect(176 + i * 32, 1250, 18, 204, 0.44, 0.34, MF.aleta);
  // el comedero
  A.fillStyle = tinta(0.55, 0.44, MF.comedero);
  A.fill(new Path2D(`M 428 ${SUELO} L 440 ${SUELO - 38} L 552 ${SUELO - 38} L 564 ${SUELO} Z`));

  const f = leerCeldas(A);
  const bo = bordes(f.tono, 0.14);
  for (let j = 0; j < FILAS; j++) {
    for (let i = 0; i < COLS; i++) {
      const k = j * COLS + i;
      const m = f.mat[k], cob = f.cob[k];
      if (!m || cob < 0.2) continue;
      const br = f.brillo[k] * (0.8 + 0.2 * Math.min(1, cob * 1.4));
      if (bo[k]) { g.ch[k] = bo[k]; g.br[k] = br * 1.1; continue; }
      if (cob < 0.5) continue;
      const ch = m === MF.mesa ? '=' : m === MF.faldon ? ':' : m === MF.pataMesa ? '|' : m === MF.aleta ? (i % 2 ? '|' : ':') : m === MF.comedero ? '=' : ' ';
      if (ch === ' ') continue;
      g.ch[k] = ch.charCodeAt(0); g.br[k] = br;
    }
  }
  // la ventana: el marco, la cruz, el alféizar, el cristal casi vacío y tres reflejos cortos (en la otra diagonal que la cola)
  const V = VENTANA, vi = (V.i0 + V.i1) >> 1, vj = (V.j0 + V.j1) >> 1;
  caja(g, V.i0, V.j0, V.i1, V.j1, 0.36);
  for (let j = V.j0 + 1; j < V.j1; j++) poner(g, vi, j, '|', 0.32);
  for (let i = V.i0 + 1; i < V.i1; i++) poner(g, i, vj, '-', 0.32);
  for (const [i, j] of [[vi, V.j0], [vi, V.j1], [V.i0, vj], [V.i1, vj], [vi, vj]]) poner(g, i, j, '+', 0.36);
  for (let i = V.i0 - 1; i <= V.i1 + 1; i++) poner(g, i, V.j1 + 1, '=', 0.4);
  for (let j = V.j0 + 1; j < V.j1; j++) {
    for (let i = V.i0 + 1; i < V.i1; i++) if (i !== vi && j !== vj && hash(i * 3, j) < 0.035) poner(g, i, j, '.', 0.24);
  }
  for (const [i, j, n] of [[V.i0 + 3, V.j0 + 2, 3], [V.i0 + 5, V.j0 + 2, 2], [vi + 3, V.j0 + 2, 3], [V.i0 + 3, vj + 2, 2]]) {
    for (let s = 0; s < n; s++) poner(g, i + s, j + s, '\\', 0.26);
  }
  // la pecera en su balda (el agua y el pez van en cada cuadro)
  const Pc = PECERA;
  caja(g, Pc.i0, Pc.j0, Pc.i1, Pc.j1, 0.4);
  poner(g, Pc.i0, Pc.j0, '.', 0.4); poner(g, Pc.i1, Pc.j0, '.', 0.4);
  poner(g, Pc.i0, Pc.j1, "'", 0.4); poner(g, Pc.i1, Pc.j1, "'", 0.4);
  for (let i = Pc.i0 - 2; i <= Pc.i1 + 1; i++) poner(g, i, Pc.j1 + 1, '=', 0.42);
  for (const i of [Pc.i0, Pc.i1 - 1]) poner(g, i, Pc.j1 + 2, '|', 0.3);
  // el nombre en el comedero
  const [ci, cj] = enCelda([496, SUELO - 12]);
  escribir(g, 'GATO', ci - 2, cj, 0.5);
  // el zócalo y el suelo: unos puntos, más juntos al fondo
  const filaZocalo = Math.floor(FONDO_SUELO / CH);
  for (let i = 0; i < COLS; i++) {
    const k = filaZocalo * COLS + i;
    if (!g.ch[k]) { g.ch[k] = '_'.charCodeAt(0); g.br[k] = 0.3; }
  }
  for (let j = filaZocalo + 1; j < FILAS; j++) {
    const lejos = 1 - (j - filaZocalo) / (FILAS - filaZocalo);
    for (let i = 0; i < COLS; i++) {
      const k = j * COLS + i;
      if (g.ch[k]) continue;
      const h = hash(i, j * 13);
      if (h < 0.035 + 0.04 * lejos) { g.ch[k] = (h < 0.015 ? ',' : '.').charCodeAt(0); g.br[k] = 0.2 + 0.14 * lejos; }
    }
  }
  COCINA = g;
  return g;
};

// el pez de la pecera: va y viene, suelta burbujas y, cuando la taza se rompe, da un salto y mira hacia el golpe
const pecera = (g: Reticula, t: number) => {
  const i0 = PECERA.i0 + 1, i1 = PECERA.i1 - 1, j0 = PECERA.j0 + 1, j1 = PECERA.j1 - 1;
  for (let i = i0; i <= i1; i++) poner(g, i, j0, '~', 0.36); // el agua
  const susto = t >= T_SUELO && t < T_SUELO + 0.7;
  const fase = (2 * Math.PI * t) / DUR;
  const derecha = Math.cos(fase) > 0 && !susto;
  const pez = derecha ? '><(((º>' : '<º)))><';
  const libre = i1 - i0 + 1 - pez.length;
  const ii = i0 + Math.round((libre / 2) * (1 + Math.sin(fase)));
  const fila = susto ? j0 + 1 : j0 + 3;
  escribir(g, pez, ii, fila, susto ? 0.9 : 0.52);
  // las burbujas suben desde la boca
  for (let b = 0; b < 2; b++) {
    const edad = (t + b * 1.3) % 2.6;
    const sube = Math.floor(edad / 0.4);
    const jb = fila - 1 - sube;
    if (jb <= j0) continue;
    const ib = derecha ? ii + pez.length : ii - 1;
    poner(g, Math.min(i1, Math.max(i0, ib + (sube % 2))), jb, sube < 1 ? 'o' : '°', 0.4);
  }
};

// ---------------------------------------------------------------- el gato (negativo B)
const MG = {cuerpo: 1, cabeza: 2, dentro: 3, hocico: 4, cola: 5, pataC: 6, pieC: 7, pataL: 8, pieL: 9} as const;
// el rojo separa las piezas (y ordena quién va delante): así cada una tiene su borde
const TG = {pataL: 0.22, cola: 0.36, cuerpo: 0.52, cabeza: 0.7, pataC: 0.9};

const pintarGato = (gt: Gato, lame: boolean): Celdas => {
  const A = negativo('gato');
  const o = enMundo([0, 0]);
  A.transform(ESCALA_GATO, 0, 0, ESCALA_GATO, o[0], o[1]); // el gato se pinta en sus medidas, 1,14 veces más grande
  const pinta = (d: string, f: string | CanvasGradient) => { A.fillStyle = f; A.fill(new Path2D(d)); };
  const luz = (c: P, r: number, tono: number, b0: number, b1: number, mat: number) => {
    const gr = A.createRadialGradient(c[0], c[1], 6, c[0], c[1], r);
    gr.addColorStop(0, tinta(tono, b0, mat));
    gr.addColorStop(1, tinta(tono, b1, mat));
    return gr;
  };
  // la otra pata, detrás
  const pl = pataTrazos(gt.pataLejos);
  pinta(pl[0], tinta(TG.pataL, 0.4, MG.pataL));
  pinta(pl[1], tinta(TG.pataL, 0.4, MG.pataL));
  pinta(pl[2], tinta(TG.pataL, 0.44, MG.pieL));
  // la cola: más clara hacia la punta (la luz de la ventana)
  const cp = gt.cola.pts;
  const gc = A.createLinearGradient(cp[0][0], cp[0][1], cp[cp.length - 1][0], cp[cp.length - 1][1]);
  gc.addColorStop(0, tinta(TG.cola, 0.6, MG.cola));
  gc.addColorStop(1, tinta(TG.cola, 0.86, MG.cola));
  pinta(cinta(cp, gt.cola.r), gc);
  // las orejas y la cabeza: la luz cae en la cara
  const gCab = luz(suma(gt.cabeza.c, rot([-10, 8], gt.inclina)), 170, TG.cabeza, 0.98, 0.5, MG.cabeza);
  for (const or of [gt.orejaLejos, gt.orejaCerca]) {
    pinta(oreja(or), gCab);
    pinta(poli(or.dentro), tinta(TG.cabeza, 0.62, MG.dentro));
  }
  // el cuerpo, de una pieza, iluminado en el pecho
  const gCu = luz(suma(gt.pecho.c, [-70, -60]), 340, TG.cuerpo, 0.92, 0.34, MG.cuerpo);
  for (const d of cuerpoTrazos(gt)) pinta(d, gCu);
  const pataCerca = () => {
    const pc = pataTrazos(gt.pataCerca);
    pinta(pc[0], tinta(TG.pataC, 0.9, MG.pataC));
    pinta(pc[1], tinta(TG.pataC, 0.94, MG.pataC));
    pinta(pc[2], tinta(TG.pataC, 1.0, MG.pieC));
  };
  if (!lame) pataCerca();
  pinta(elipse(gt.cabeza), gCab);
  pinta(elipse(gt.hocico), tinta(TG.cabeza, 0.8, MG.hocico));
  if (lame) pataCerca(); // al lamerse, la pata va delante de la cara
  return leerCeldas(A);
};

// la letra que sigue la pieza: la del segmento más cercano (la cola, las patas)
const segmentoCercano = (q: P, pts: P[]) => {
  let mejor = Infinity, letra = '|';
  for (let s = 1; s < pts.length; s++) {
    const a = pts[s - 1], b = pts[s];
    const ab = resta(b, a), aq = resta(q, a);
    const l2 = ab[0] * ab[0] + ab[1] * ab[1] || 1;
    const u = clamp((aq[0] * ab[0] + aq[1] * ab[1]) / l2);
    const d = Math.hypot(q[0] - a[0] - ab[0] * u, q[1] - a[1] - ab[1] * u);
    if (d < mejor) { mejor = d; letra = letraSegmento(a, b); }
  }
  return letra;
};

// escribe el gato en la retícula. Devuelve qué celdas son relleno suyo (para dejar aire alrededor de los ojos)
const escribirGato = (g: Reticula, c: Celdas, gt: Gato) => {
  const bo = bordes(c.tono, 0.085);
  const relleno = new Uint8Array(N);
  // una celda de aire a cada lado de su silueta (encima de la mesa): así se lee aunque pase por delante de la ventana o la taza
  for (let k = 0; k < N; k++) {
    if (c.cob[k] >= 0.22) continue;
    const i = k % COLS, j = (k - i) / COLS;
    if (j >= FILA_MESA) continue;
    if ((i > 0 && c.cob[k - 1] >= 0.22) || (i < COLS - 1 && c.cob[k + 1] >= 0.22)) borrar(g, k);
  }
  const cola = gt.cola.pts.map((q) => enMundo(q));
  const pataC = [gt.pataCerca.hombro, gt.pataCerca.codo, gt.pataCerca.mano].map((q) => enMundo(q));
  const pataL = [gt.pataLejos.hombro, gt.pataLejos.codo, gt.pataLejos.mano].map((q) => enMundo(q));
  for (let k = 0; k < N; k++) {
    const cob = c.cob[k];
    if (cob < 0.22) continue;
    const m = c.mat[k];
    const borde = bo[k];
    if (!borde && cob < 0.45) continue;
    const i = k % COLS, j = (k - i) / COLS;
    const b = c.brillo[k];
    const detras = m === MG.pataL || m === MG.pieL;
    if (borde) {
      g.ch[k] = borde; g.br[k] = Math.max(b, detras ? 0.42 : 0.74) + 0.12; g.tinte[k] = 0; g.inv[k] = 0;
      continue;
    }
    const q: P = [(i + 0.5) * CW, (j + 0.5) * CH];
    const tramado = (hash(i * 7, j * 3) - 0.5) * 1.4;
    let ch = ' ';
    let br = b;
    switch (m) {
      case MG.cuerpo: ch = RAMPA[clamp(Math.round(clamp((b - 0.3) / 0.72) * 9 + tramado), 1, 9)]; break;
      case MG.cabeza: ch = RAMPA_CARA[clamp(Math.round(clamp((b - 0.5) / 0.5) * 4 + tramado * 0.8), 1, 4)]; br = b * 0.8; break;
      case MG.dentro: ch = ':'; break;
      case MG.hocico: ch = ' '; break;
      case MG.cola: ch = segmentoCercano(q, cola); break;
      case MG.pataC: ch = segmentoCercano(q, pataC); break;
      case MG.pataL: ch = segmentoCercano(q, pataL); br = b * 0.9; break;
      case MG.pieC: ch = 'o'; break;
      case MG.pieL: ch = 'o'; br = b * 0.9; break;
      default: ch = '+';
    }
    if (ch === ' ') { borrar(g, k); relleno[k] = 1; continue; }
    g.ch[k] = ch.charCodeAt(0); g.br[k] = br; g.tinte[k] = 0; g.inv[k] = 0;
    relleno[k] = 1;
  }
  return relleno;
};

const OJO_X = 1.1, OJO_Y = 1.35;
// un ojo: el blanco en vídeo inverso; la pupila, una rendija oscura (al tramar) o un hueco redondo (al ver caer la taza)
const pintarOjo = (g: Reticula, o: Ojo, relleno: Uint8Array) => {
  // los ojos, algo más grandes que en el dibujo (más altos que anchos): con letras de 12 × 20, así caben la rendija y el párpado
  const agranda = (q: P): P => {
    const u = rot(resta(q, o.c), -o.ang);
    return enMundo(suma(o.c, rot([u[0] * OJO_X, u[1] * OJO_Y], o.ang)));
  };
  if (o.cerrado) {
    // cerrado: el arco ∩, con una fila de aire encima y debajo para que no se pierda en el pelo (ni detrás de la pata al lamerse)
    const arco = o.arco.map(agranda);
    const marca = new Uint8Array(N);
    for (let s = 1; s < arco.length; s++) trazar(g, arco[s - 1], arco[s], 1.3, {marca});
    for (let k = 0; k < N; k++) {
      if (!marca[k]) continue;
      for (const k2 of [k - COLS, k + COLS]) if (k2 >= 0 && k2 < N && !marca[k2] && relleno[k2]) borrar(g, k2);
    }
    return;
  }
  const vis = o.visible.map(agranda);
  if (vis.length < 3) return;
  const S = ESCALA_GATO;
  const pup: Elipse = {c: agranda(o.pupila.c), rx: o.pupila.rx * S * OJO_X, ry: o.pupila.ry * S * OJO_Y, ang: o.pupila.ang};
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of vis) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const i0 = Math.floor(x0 / CW) - 1, i1 = Math.floor(x1 / CW) + 1, j0 = Math.floor(y0 / CH) - 1, j1 = Math.floor(y1 / CH) + 1;
  const rendija = pup.rx * 2 < CW * 1.25;
  const US = 4, VS = 5;
  type C = {i: number; j: number; e: number; p: number; nx: number; ny: number};
  const celdas: C[] = [];
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      let e = 0, pp = 0, sx = 0, sy = 0;
      for (let v = 0; v < VS; v++) {
        for (let u = 0; u < US; u++) {
          const q: P = [(i + (u + 0.5) / US) * CW, (j + (v + 0.5) / VS) * CH];
          if (!dentroPoli(q, vis)) continue;
          e++; sx += q[0]; sy += q[1];
          if (dentroElipse(q, pup)) pp++;
        }
      }
      celdas.push({i, j, e: e / (US * VS), p: e ? pp / e : 0, nx: e ? sx / e - (i + 0.5) * CW : 0, ny: e ? sy / e - (j + 0.5) * CH : 0});
    }
  }
  // aire alrededor: el pelo de la cara no se pega al ojo
  for (const c of celdas) {
    if (c.e >= 0.06 || !dentro(c.i, c.j)) continue;
    const k = c.j * COLS + c.i;
    if (relleno[k]) borrar(g, k);
  }
  let hueco = false;
  for (const c of celdas) {
    if (!dentro(c.i, c.j)) continue;
    if (c.e >= 0.45) {
      if (rendija) {
        const yc = (c.j + 0.5) * CH;
        const cx = pup.c[0] - Math.tan(pup.ang) * (yc - pup.c[1]);
        const enRendija = Math.floor(cx / CW) === c.i && Math.abs(yc - pup.c[1]) <= pup.ry + CH * 0.35;
        if (enRendija) poner(g, c.i, c.j, ' ', 0); // la rendija: una columna apagada que parte el blanco
        else poner(g, c.i, c.j, ' ', 1.12, 0, 1);
      } else if (c.p >= 0.42) {
        poner(g, c.i, c.j, ' ', 0);
        hueco = true;
      } else {
        poner(g, c.i, c.j, ' ', 1.12, 0, 1);
      }
    } else if (c.e >= 0.06) {
      const ax = c.nx / CW, ay = c.ny / CH;
      let ch: string;
      if (Math.abs(ax) > 1.4 * Math.abs(ay)) ch = ax > 0 ? '(' : ')';
      else if (Math.abs(ay) > 1.4 * Math.abs(ax)) ch = ay > 0 ? '_' : '-';
      else ch = (ax > 0) === (ay > 0) ? '/' : '\\';
      poner(g, c.i, c.j, ch, 1.02);
    }
  }
  // el brillo, en la pupila redonda
  if (hueco) {
    const [bi, bj] = enCelda(agranda(o.brillo));
    if (dentro(bi, bj)) {
      const k = bj * COLS + bi;
      if (!g.inv[k]) poner(g, bi, bj, "'", 1.5);
    }
  }
};

// la cara: los ojos, los bigotes, la nariz, la boca, la lengua y el muslo
const pintarCara = (g: Reticula, gt: Gato, relleno: Uint8Array, c: Celdas) => {
  // el muslo, una línea sobre el cuerpo
  const muslo = arcoElipse(gt.cadera, -2.2, -0.4, 10).map((q) => enMundo(q));
  for (let s = 1; s < muslo.length; s++) trazar(g, muslo[s - 1], muslo[s], 0.95, {deja: (k) => c.mat[k] === MG.cuerpo && relleno[k] === 1});
  // los bigotes: de la mitad hacia fuera, - y = donde se juntan dos
  const marca = new Uint8Array(N);
  gt.bigotes.forEach((b, w) => {
    const [s, m, e] = b;
    let antes: P | null = null;
    for (let k = 0.3; k <= 1.0001; k += 0.03) {
      const q = enMundo([
        (1 - k) ** 2 * s[0] + 2 * k * (1 - k) * m[0] + k * k * e[0],
        (1 - k) ** 2 * s[1] + 2 * k * (1 - k) * m[1] + k * k * e[1],
      ]);
      if (antes) {
        const [i, j] = enCelda(q);
        if (dentro(i, j)) {
          const kk = j * COLS + i;
          if (!g.inv[kk]) {
            // el bigote del medio de cada lado (el 2 y el 3), doble: =; los otros, -
            const letra = letraSegmento(antes, q);
            const ch = (marca[kk] && marca[kk] !== w + 1) || (letra === '-' && (w === 2 || w === 3)) ? '=' : letra;
            poner(g, i, j, ch, 0.98);
            marca[kk] = w + 1;
          }
        }
      }
      antes = q;
    }
  });
  for (const o of [gt.ojoLejos, gt.ojoCerca]) pintarOjo(g, o, relleno);
  // la nariz y la boca
  const nz = enMundo([(gt.nariz[0][0] + gt.nariz[1][0] + gt.nariz[2][0]) / 3, (gt.nariz[0][1] + gt.nariz[1][1] + gt.nariz[2][1]) / 3]);
  const [ni, nj] = enCelda(nz);
  poner(g, ni, nj, 'v', 1.3);
  const bc = enMundo([(gt.boca[1][0] + gt.boca[3][0]) / 2, (gt.boca[1][1] + gt.boca[3][1]) / 2]);
  let [bi, bj] = enCelda(bc);
  if (bi === ni && bj === nj) bj++;
  poner(g, bi, bj, 'w', 1.15);
  if (gt.lengua) {
    const [li, lj] = enCelda(enMundo(gt.lengua.c));
    poner(g, li, lj === bj && li === bi ? lj + 1 : lj, 'U', 1.25);
  }
};

// ---------------------------------------------------------------- la taza (negativo C) y sus trozos
const MT = {taza: 1, trozo: 2} as const;
const pintarTaza = (nombre: string, t: number): Celdas => {
  const A = negativo(nombre);
  const tz = taza(t);
  if (tz.estado !== 'suelo') {
    const pz = piezasTaza(tz);
    A.fillStyle = tinta(0.8, 0.84, MT.taza);
    A.fill(new Path2D(poli(pz.asa)));
    A.fill(new Path2D(poli(pz.cuerpo)));
  } else {
    for (const q of trozos(t)) {
      A.fillStyle = tinta(0.62 + 0.06 * (q.n % 3), 0.9, MT.trozo); // tonos distintos: cada trozo con su borde
      A.fill(new Path2D(poli(q.pts)));
    }
  }
  return leerCeldas(A);
};
const escribirTaza = (g: Reticula, c: Celdas, brBorde: number, conRelleno: boolean, soloVacias: boolean) => {
  const bo = bordes(c.tono, 0.12);
  if (conRelleno && !soloVacias) {
    for (let k = 0; k < N; k++) {
      if (c.cob[k] >= 0.22) continue;
      const i = k % COLS, j = (k - i) / COLS;
      if (j >= FILA_MESA) continue;
      if ((i > 0 && c.cob[k - 1] >= 0.22) || (i < COLS - 1 && c.cob[k + 1] >= 0.22)) borrar(g, k);
    }
  }
  for (let k = 0; k < N; k++) {
    if (c.cob[k] < 0.22) continue;
    if (soloVacias && g.ch[k]) continue;
    if (bo[k]) { g.ch[k] = bo[k]; g.br[k] = brBorde; g.tinte[k] = 0; g.inv[k] = 0; continue; }
    if (!conRelleno || c.cob[k] < 0.45) continue;
    g.ch[k] = (c.mat[k] === MT.trozo ? '*' : '#').charCodeAt(0); g.br[k] = brBorde * 0.72; g.tinte[k] = 0; g.inv[k] = 0;
  }
};

// ---------------------------------------------------------------- las chispas del golpe
const CHISPAS = (() => {
  const r = rng(4242);
  return Array.from({length: 30}, () => {
    const a = -Math.PI / 2 + (r() - 0.5) * 2.7;
    const v = 520 + r() * 950;
    return {t0: T_SUELO + r() * 0.04, x0: IMPACTO[0] + (r() - 0.5) * 50, y0: SUELO - 26 - r() * 20, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0.32 + r() * 0.5};
  });
})();

// ---------------------------------------------------------------- la terminal
const PROMPT = 'gato@cocina:~$ ';
const ORDEN = './empujar --taza';
const ORDEN2 = 'echo "yo no fui"';
// teclea a mano: desigual, con alguna pausa (la del espacio, más larga), de t0 a t1
const teclas = (txt: string, t0: number, t1: number, semilla: number) => {
  const r = rng(semilla);
  const d = txt.split('').map((ch) => 0.6 + r() + (ch === ' ' ? 1.6 : 0) + (r() < 0.12 ? 1.1 : 0));
  const total = d.reduce((a, b) => a + b, 0);
  let s = t0;
  return d.map((x) => (s += (x / total) * (t1 - t0)));
};
const TECLAS1 = teclas(ORDEN, 0.3, 1.06, 808);
const T_ENTER1 = 1.14; // y el gato da el primer toquecito
const TECLAS2 = teclas(ORDEN2, 4.32, 4.88, 909);
const T_ENTER2 = 4.96;
const IZQ = 4, DER = COLS - 5; // los márgenes de la terminal (48 px a cada lado)
const distancia = (t: number) => Math.max(0, (BORDE - taza(Math.min(t, T_CAE)).c[0]) / PX_M);
const T_CERO = (() => { let t = 2.3; while (t < T_CAE && distancia(t) >= 0.005) t += 0.001; return t; })();

const estado = (t: number) =>
  t < 0.6 ? 'OBSERVANDO' : t < 1.12 ? 'TRAMANDO' : t < T_CAE ? 'EMPUJANDO' : t < T_SUELO ? 'CAÍDA LIBRE' : t < 4.2 ? 'ASOMÁNDOSE' : t < 5.1 ? 'INOCENTE' : 'ASEÁNDOSE';

const terminal = (g: Reticula, t: number) => {
  for (let fila = 2; fila <= 10; fila++) for (let i = 0; i < COLS; i++) borrar(g, fila * COLS + i);
  for (let fila = FILAS - 8; fila <= FILAS - 5; fila++) for (let i = 0; i < COLS; i++) borrar(g, fila * COLS + i);
  const parpadeo = Math.floor(t / 0.53) % 2 === 0;
  const cursor = (i: number, j: number, fijo: boolean) => { if (fijo || parpadeo) poner(g, i, j, ' ', 0.95, 0, 1); };

  // 1 · la orden
  const n1 = TECLAS1.filter((x) => x <= t).length;
  escribir(g, PROMPT, IZQ, 3, 0.62);
  escribir(g, ORDEN.slice(0, n1), IZQ + PROMPT.length, 3, 0.98);
  if (t < T_ENTER1) { cursor(IZQ + PROMPT.length + n1, 3, t >= 0.3); return; }

  // 2 · lo que mide: la taza hasta el borde, en vivo
  const d = distancia(t);
  const log1 = `[ OK ] taza a ${coma(d)} m del borde`;
  const sale1 = Math.min(log1.length, Math.floor((t - T_ENTER1) / 0.006));
  escribir(g, log1.slice(0, sale1), IZQ, 4, 0.68);
  if (sale1 >= 6) escribir(g, '[ OK ]', IZQ, 4, 0.95);
  if (sale1 >= log1.length) {
    // la cifra que acaba de cambiar, más brillante un momento; en 0,00, en vídeo inverso
    const fresca = Math.abs(distancia(t) - distancia(t - 0.1)) > 0.004;
    const cero = t >= T_CERO;
    escribir(g, coma(d), IZQ + 14, 4, cero ? 1.1 : fresca ? 1.3 : 0.95, cero && t < T_SUELO && Math.floor(t * 12) % 2 === 0 ? 1 : 0);
  }
  if (t < T_CAE) { cursor(IZQ, 5, false); return; }

  // 3 · la caída, con su cronómetro
  const tc = Math.min(t, T_SUELO) - T_CAE;
  const gira = ['*   ', ' *  ', '  * ', '   *', '  * ', ' *  '][Math.floor(t * 30) % 6];
  const log2 = `[${t < T_SUELO ? gira : ' OK '}] caída libre  t=${coma(tc)} s`;
  escribir(g, log2.slice(0, Math.floor((t - T_CAE) / 0.006)), IZQ, 5, 0.72);
  if (t - T_CAE > 0.04) escribir(g, coma(tc), IZQ + log2.length - 6, 5, t < T_SUELO ? 1.15 : 0.9);
  if (t < T_SUELO) return;

  // 4 · rota: para el gato, todo en orden
  const log3 = '[ OK ] taza_rota  trozos=6';
  const sale3 = Math.min(log3.length, Math.floor((t - T_SUELO) / 0.008));
  escribir(g, log3.slice(0, sale3), IZQ, 6, 0.72);
  if (sale3 >= 6) escribir(g, '[ OK ]', IZQ, 6, 0.95);
  if (sale3 >= 16) escribir(g, 'taza_rota', IZQ + 7, 6, t - T_SUELO < 0.5 ? 1.35 : 1.05);
  if (t < T_SUELO + 0.45) return;

  // 5 · y se lava las manos
  const n2 = TECLAS2.filter((x) => x <= t).length;
  escribir(g, PROMPT, IZQ, 7, 0.62);
  escribir(g, ORDEN2.slice(0, n2), IZQ + PROMPT.length, 7, 0.98);
  if (t < T_ENTER2) { cursor(IZQ + PROMPT.length + n2, 7, t >= TECLAS2[0] - 0.05); return; }
  const sale4 = Math.min(9, Math.floor((t - T_ENTER2) / 0.03));
  escribir(g, 'yo no fui'.slice(0, sale4), IZQ, 8, 1.05);
  escribir(g, PROMPT, IZQ, 9, 0.62);
  cursor(IZQ + PROMPT.length, 9, false);
};

const barra = (g: Reticula, t: number) => {
  const filaEstado = FILAS - 7, filaBarra = FILAS - 6;
  escribir(g, `-- ${estado(t)} --`, IZQ, filaEstado, 0.74);
  escribir(g, `cuadro ${String(Math.floor(t * 60)).padStart(3, '0')}/${Math.round(DUR * 60)}`, IZQ + 22, filaEstado, 0.5);
  if (t >= T_SUELO) {
    const aviso = ' !! AVISO: taza_rota ';
    const desde = t - T_SUELO;
    const visible = desde > 1.1 || Math.floor(desde * 60 + 1e-6) % 12 < 9; // parpadea un segundo y se queda
    if (visible) escribir(g, aviso, DER - aviso.length + 1, filaEstado, desde < 0.15 ? 1.4 : 1, 1);
  }
  const hecho = Math.round(((DER - IZQ + 1) * t) / DUR);
  for (let i = IZQ; i <= DER; i++) poner(g, i, filaBarra, i - IZQ < hecho ? '=' : '-', i - IZQ < hecho ? 0.48 : 0.16);
};

// ---------------------------------------------------------------- un cuadro entero, en letras
const RET = nueva();
const componer = (t: number): Reticula => {
  const g = RET;
  copia(cocina(), g);
  pecera(g, t);
  const vacia = (k: number) => !g.ch[k] && !g.inv[k];

  // ---- el vapor: hilos de ( ) que suben y se deshacen en ' . ~
  for (const h of vapor(t)) {
    if (h.alfa < 0.05) continue;
    const eje = h.pts[0][0];
    const delCharco = h.pts[0][1] > MESA_Y + 200; // el del charco, más tenue: si no, parecen palitos
    const alto = Math.max(1, h.pts[0][1] - h.pts[h.pts.length - 1][1]);
    const vistas = new Set<number>();
    for (let s = 1; s < h.pts.length; s++) {
      const a = h.pts[s - 1], b = h.pts[s];
      for (let u = 0; u < 1; u += 0.25) {
        const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
        const [i, j] = enCelda([x, y]);
        if (!dentro(i, j)) continue;
        const k = j * COLS + i;
        if (vistas.has(k)) continue;
        vistas.add(k);
        const sube = (h.pts[0][1] - y) / alto;
        const ch = sube > 0.55 ? "'.~"[Math.floor(hash(i, j) * 3)] : x < eje ? '(' : ')';
        if (sube > 0.55 ? hash(i * 5, j) < 0.45 : hash(i * 5, j) < (delCharco ? 0.4 : 0.15)) continue;
        poner(g, i, j, ch, h.alfa * (0.6 - 0.32 * sube) * (delCharco ? 0.6 : 1));
      }
    }
  }

  // ---- el café en el suelo (ámbar): el charco y las manchas, detrás de los trozos
  const cf = cafe(t);
  if (cf.charco) {
    const {c, rx, ry} = cf.charco;
    const [ia, j0] = enCelda([c[0] - rx, c[1]]);
    const [ib] = enCelda([c[0] + rx, c[1]]);
    for (let i = ia; i <= ib; i++) poner(g, i, j0, i === ia || i === ib ? '.' : '~', 0.85, 1);
    if (ry > 12) {
      const [ic, j1] = enCelda([c[0] - rx * 0.62, c[1] + 16]);
      const [id] = enCelda([c[0] + rx * 0.62, c[1] + 16]);
      for (let i = ic; i <= id; i++) poner(g, i, j1, '-', 0.55, 1);
    }
  }
  for (const s of cf.manchas) {
    const [ia, j] = enCelda([s.c[0] - s.rx * 0.8, s.c[1]]);
    const [ib] = enCelda([s.c[0] + s.rx * 0.8, s.c[1]]);
    for (let i = ia; i <= ib; i++) poner(g, i, j, ib > ia && i > ia && i < ib ? '~' : ',', 0.7, 1);
  }

  // ---- la taza: al caer, su rastro (estela y dos fantasmas del fósforo); rota, los trozos
  const tz = taza(t);
  if (tz.estado === 'cae') {
    for (let s = 1; s <= 9; s++) {
      const ta = t - s * 0.014, tb = t - (s - 1) * 0.014;
      if (ta < T_CAE) break;
      const pa = piezasTaza(taza(ta)), pb = piezasTaza(taza(tb));
      for (const sel of [(q: typeof pa) => q.borde[0], (q: typeof pa) => q.borde[1], (q: typeof pa) => q.eje[1]]) {
        trazar(g, sel(pa), sel(pb), 0.55 * (1 - s / 10), {deja: vacia});
      }
    }
    for (const [dt, br] of [[0.05, 0.24], [0.025, 0.44]] as const) {
      if (t - dt > T_CAE) escribirTaza(g, pintarTaza('fantasma', t - dt), br, false, true);
    }
  }
  const enVuelo = t >= T_SUELO && t < T_SUELO + 0.6;
  if (enVuelo) escribirTaza(g, pintarTaza('fantasma', t - 0.03), 0.34, false, true);
  const celdasTaza = pintarTaza('taza', t);
  escribirTaza(g, celdasTaza, tz.estado === 'suelo' ? 1.0 : 1.06, true, false);
  if (tz.estado === 'suelo') {
    // que ningún trozo se quede sin letra
    for (const q of trozos(t)) {
      const [i, j] = enCelda(q.c);
      if (dentro(i, j) && vacia(j * COLS + i)) poner(g, i, j, '*', 1);
    }
  }

  // ---- el gato
  const gt = gato(t);
  const lame = !!gt.lengua || gt.mira === 'pata';
  const celdasGato = pintarGato(gt, lame);
  const relleno = escribirGato(g, celdasGato, gt);
  pintarCara(g, gt, relleno, celdasGato);

  // ---- el café que sale (ámbar, el único color que no es verde): el chorro en arco y la corona al romperse
  const chorro = cf.gotas.filter((d) => d.i < 100).sort((a, b) => a.i - b.i);
  for (let s = 1; s < chorro.length; s++) {
    const a = chorro[s - 1].c, b = chorro[s].c;
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 80) trazar(g, a, b, 0.7, {tinte: 1});
  }
  for (const d of cf.gotas) {
    const [i, j] = enCelda(d.c);
    if (d.i < 100) poner(g, i, j, d.r >= 11 ? 'o' : '.', 0.95, 1);
    else poner(g, i, j, "',.`"[d.i % 4], 0.92, 1);
  }

  // ---- el golpe: un estallido de rayas y las chispas
  const dS = t - T_SUELO;
  if (dS >= 0 && dS < 0.32) {
    const sale = E.outCubic(p(t, T_SUELO, 0.12));
    const r0 = 26 + 150 * E.outCubic(p(t, T_SUELO, 0.26));
    const r1 = 50 + 250 * sale;
    const br = 1.7 * (1 - p(t, T_SUELO + 0.05, 0.25));
    const c: P = [IMPACTO[0], SUELO - 16];
    if (r1 > r0) {
      // las rayas, dobles (dos letras de grueso) para que se lean pequeñas
      for (const a0 of [0, 24, 52, 90, 128, 156, 180]) {
        for (const da of [-2.5, 2.5]) {
          const a = ((a0 + da) * Math.PI) / 180;
          const u: P = [Math.cos(a), -Math.sin(a)];
          trazar(g, [c[0] + u[0] * r0, c[1] + u[1] * r0 * 0.8], [c[0] + u[0] * r1, c[1] + u[1] * r1 * 0.8], br);
        }
      }
    }
    if (dS < 0.1) {
      // el fogonazo: un bloque encendido donde pega
      const [i, j] = enCelda(c);
      const ancho = dS < 0.05 ? 3 : 1;
      for (let di = -ancho; di <= ancho; di++) poner(g, i + di, j, di === 0 ? '*' : ' ', 1.6, 0, 1);
      if (dS < 0.05) { poner(g, i, j - 1, ' ', 1.4, 0, 1); poner(g, i, j + 1, ' ', 1.2, 0, 1); }
    }
  }
  for (const s of CHISPAS) {
    const e = t - s.t0;
    if (e < 0 || e > s.vida) continue;
    const f = e / s.vida;
    let x = s.x0 + s.vx * e * (1 - 0.35 * f), y = s.y0 + s.vy * e + 0.5 * 2600 * e * e;
    if (y > SUELO + 6) { y = SUELO + 6; x = s.x0 + s.vx * e * 0.6; }
    const [i, j] = enCelda([x, y]);
    poner(g, i, j, f < 0.35 ? '*' : f < 0.7 ? '+' : '.', 0.3 + 1.3 * (1 - f));
  }

  // ---- la terminal
  terminal(g, t);
  barra(g, t);
  return g;
};

// ---------------------------------------------------------------- el componente
const pintar = (lienzo: HTMLCanvasElement, t: number, dpr: number) => {
  const g = componer(t);
  const dS = t - T_SUELO, dC = t - T_CAE;
  const destello = (dS >= 0 && dS < 0.5 ? 0.5 * Math.exp(-dS / 0.07) : 0) + (dC >= 0 && dC < 0.3 ? 0.06 * Math.exp(-dC / 0.05) : 0);
  const global = 1 + destello + 0.012 * Math.sin(t * 2 * Math.PI * 7.3) + 0.008 * Math.sin(t * 2 * Math.PI * 2.1);
  const cuadro = Math.floor(t * 60);
  const rasga = dS >= 0 && dS < 0.1
    ? (j: number) => (j > 12 && j < FILAS - 9 && hash(j >> 1, cuadro) < 0.14 ? (hash(j, cuadro + 7) < 0.5 ? -1 : 1) : 0)
    : undefined;
  pintarTubo(lienzo, g, {t, dpr, fuente: PLEX, global, sacudida: temblor(t, T_SUELO, 0.32, 9, 3), rasga});
};

export const Ascii: React.FC<{t: number}> = ({t: tt}) => {
  const t = clamp(tt, 0, DUR);
  const ref = useRef<HTMLCanvasElement>(null);
  const [dpr] = useState(() => Math.min(2, Math.max(0.25, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1)));
  const [espera] = useState(() => delayRender('Terminal ASCII del gato: la letra monoespaciada'));
  const suelta = useRef(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vivo = true;
    waitUntilDone()
      .then(() => document.fonts.load(`600 20px "${PLEX}"`))
      .catch(() => undefined)
      .then(() => { if (vivo) setListo(true); });
    return () => {
      vivo = false;
      if (!suelta.current) { suelta.current = true; continueRender(espera); }
    };
  }, [espera]);

  useLayoutEffect(() => {
    if (!listo || !ref.current) return;
    pintar(ref.current, t, dpr);
    if (!suelta.current) { suelta.current = true; continueRender(espera); }
  }, [t, listo, dpr, espera]);

  return (
    <canvas ref={ref} width={Math.round(1080 * dpr)} height={Math.round(1920 * dpr)}
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#010402'}} />
  );
};
