import React from 'react';
import {clamp, rng} from '../../../comun/curvas';
import {ALTO, LAMPARA, MESA, MURO_X, PAPELERA, PLACA, R_BOLA, STUD, SUELO, Z_PARED, escalaEn, proyecta, type Bola, type V3} from '../escena';
import {
  C, REG, TINTA, aro, caja, cajaDe, capsula, circulo, curva, dentroDe, elipse, envolvente, f1, poli, pr, suave01, trama, type P,
} from './ComicTrama';

// CÓMIC, EL DECORADO: la oficina de la escena dibujada como la viñeta de un tebeo. Cada cosa en su sitio de los
// bloques (la misma cámara: todo pasa por proyecta), con su contorno de tinta negra y sus tintas planas: la pared cian con su trama
// de puntos que se apiña en los bordes, la ventana con el cielo y los árboles, el póster de la diana, la balda con los libros, la
// lámpara naranja con su luz de puntos amarillos, el suelo de tablas ocre con sus puntos naranjas y las sombras de puntos oscuros,
// la mesa con el monitor, la papelera roja (atrás y delante, para que la bola pueda caer dentro) y la bola de papel arrugado.

// ---------------------------------------------------------------- una forma impresa: el color (corrido por el registro) y la tinta
export const Forma: React.FC<{d: string; fill: string; tinta?: number; puntos?: string; colorPuntos?: string; extra?: React.ReactNode}> = ({
  d, fill, tinta = 7, puntos, colorPuntos, extra,
}) => (
  <g>
    <g transform={`translate(${REG[0]} ${REG[1]})`}>
      <path d={d} fill={fill} />
      {puntos ? <path d={puntos} fill={colorPuntos ?? TINTA} /> : null}
      {extra}
    </g>
    {tinta > 0 ? <path d={d} fill="none" stroke={TINTA} strokeWidth={tinta} strokeLinejoin="round" strokeLinecap="round" /> : null}
  </g>
);
// una caja en perspectiva: cada cara que se ve, con su color de luz o de sombra (y la sombra con sus puntos)
export const Caja: React.FC<{c: V3; a: V3; b: V3; d: V3; luz: string; sombra: string; puntos?: string; tinta?: number; paso?: number; tope?: string}> = ({
  c, a, b, d, luz, sombra, puntos, tinta = 6, paso = 12, tope,
}) => {
  const caras = caja(c, a, b, d);
  const todo = envolvente(caras.flatMap((q) => q.pts));
  return (
    <g>
      {caras.map((q, k) => {
        const arriba = q.n[1] < -0.6;
        const enSombra = q.luz < 0.12 && !arriba;
        const col = arriba && tope ? tope : enSombra ? sombra : luz;
        const pts = enSombra && puntos ? trama(cajaDe(q.pts), paso, 75, () => 0.62, dentroDe(q.pts)) : undefined;
        return <Forma key={k} d={poli(q.pts)} fill={col} tinta={tinta * 0.55} puntos={pts} colorPuntos={puntos} />;
      })}
      <path d={poli(todo)} fill="none" stroke={TINTA} strokeWidth={tinta} strokeLinejoin="round" />
    </g>
  );
};

// ---------------------------------------------------------------- medidas de la pared y el suelo en la pantalla
const S_PARED = escalaEn(Z_PARED);
export const Y_ZOCALO = 300 + (SUELO - 300) * S_PARED; // donde la pared del fondo toca el suelo
export const X_ESQUINA = 540 + (MURO_X - 540) * S_PARED; // la esquina con la pared de la derecha
const Y_ESQ_BORDE = 300 + (SUELO - 300) * (540 / (MURO_X - 540)); // donde la esquina del suelo sale por la derecha
const enPared = (x: number, y: number, z = Z_PARED): P => pr([x, y, z]);
const filaY = (k: number) => SUELO - (k + 1) * ALTO;

// ---------------------------------------------------------------- la pared (fija: se calcula una vez)
const VENT = {x0: 0, x1: 6 * STUD, y0: filaY(16), y1: filaY(10)};
type Pared = {
  fondo: string; derecha: string; puntosFondo: string; puntosDerecha: string; ladrillos: string;
  marco: string; cristal: P[]; cielo: string; puntosCielo: string; barras: string[]; alfeizar: {cara: P[]; frente: P[]};
  poster: P[]; posterPuntos: string; balda: {tope: P[]; frente: P[]}; libros: {pts: P[]; col: string; raya: string}[];
};
let PARED: Pared | null = null;
const pared = (): Pared => {
  if (PARED) return PARED;
  const fondoPts: P[] = [[-20, -20], [X_ESQUINA, -20], [X_ESQUINA, Y_ZOCALO], [-20, Y_ZOCALO]];
  const derPts: P[] = [[X_ESQUINA, -20], [1100, -20], [1100, Y_ESQ_BORDE + 22], [X_ESQUINA, Y_ZOCALO]];
  // los puntos se apiñan en los bordes de la viñeta y en la esquina; el centro, donde pasa todo, queda limpio
  const densFondo = (x: number, y: number) => {
    const borde = Math.min(x + 20, y + 20, X_ESQUINA - x);
    const e = clamp(1 - borde / 230) ** 1.4;
    const arriba = clamp(1 - y / 520) * 0.45;
    return Math.max(e * 0.95, arriba);
  };
  const puntosFondo = trama([-20, -20, X_ESQUINA, Y_ZOCALO], 21, 15, densFondo);
  const puntosDerecha = trama([X_ESQUINA, -20, 1090, Y_ESQ_BORDE], 21, 15, (x, y) => 0.55 + 0.35 * clamp(y / 1500), dentroDe(derPts));
  // unos ladrillos sueltos, a la manera de los tebeos: tres racimos
  const lad: string[] = [];
  const racimo = (k0: number, k1: number, x0: number, x1: number, sem: number) => {
    const r = rng(sem);
    for (let k = k0; k <= k1; k++) {
      const y = filaY(k);
      let x = x0 + (k % 2 ? -2 * STUD : 0) + Math.floor(r() * 2) * STUD;
      while (x < x1) {
        const largo = 4 * STUD;
        if (r() < 0.72) lad.push(poli([enPared(x + 5, y + 5), enPared(x + largo - 5, y + 5), enPared(x + largo - 5, y + ALTO - 5), enPared(x + 5, y + ALTO - 5)]));
        x += largo;
      }
    }
  };
  racimo(17, 19, 480, 1000, 3);
  racimo(5, 6, 560, 1000, 8);
  racimo(1, 3, -200, 160, 11);
  // la ventana: el marco, el cristal, el parteluz, el travesaño y el alféizar
  const m = 20;
  const marco = poli([enPared(VENT.x0 - m, VENT.y0 - 38), enPared(VENT.x1 + m, VENT.y0 - 38), enPared(VENT.x1 + m, VENT.y1 + 4), enPared(VENT.x0 - m, VENT.y1 + 4)]);
  const cristal: P[] = [enPared(VENT.x0 + 16, VENT.y0 + 4), enPared(VENT.x1 - 16, VENT.y0 + 4), enPared(VENT.x1 - 16, VENT.y1 - 6), enPared(VENT.x0 + 16, VENT.y1 - 6)];
  const cajaC = cajaDe(cristal);
  const cielo = poli(cristal);
  const puntosCielo = trama(cajaC, 16, 0, (x, y) => 0.15 + 0.6 * ((y - cajaC[1]) / (cajaC[3] - cajaC[1])) ** 1.6, dentroDe(cristal));
  const xm = (VENT.x0 + VENT.x1) / 2, ym = VENT.y0 + (VENT.y1 - VENT.y0) * 0.45;
  const barras = [
    poli([enPared(xm - 10, VENT.y0), enPared(xm + 10, VENT.y0), enPared(xm + 10, VENT.y1), enPared(xm - 10, VENT.y1)]),
    poli([enPared(VENT.x0, ym - 10), enPared(VENT.x1, ym - 10), enPared(VENT.x1, ym + 10), enPared(VENT.x0, ym + 10)]),
  ];
  // el alféizar sale de la pared hacia la cámara
  const za = Z_PARED, zb = Z_PARED + 105;
  const yA = VENT.y1 + 2, yB = VENT.y1 + 34;
  const alfeizar = {
    cara: [pr([VENT.x0 - 36, yA, za]), pr([VENT.x1 + 36, yA, za]), pr([VENT.x1 + 36, yA, zb]), pr([VENT.x0 - 36, yA, zb])] as P[],
    frente: [pr([VENT.x0 - 36, yA, zb]), pr([VENT.x1 + 36, yA, zb]), pr([VENT.x1 + 36, yB, zb]), pr([VENT.x0 - 36, yB, zb])] as P[],
  };
  // el póster de la diana
  const zP = Z_PARED + 6;
  const poster: P[] = [pr([808 - 135, 412 - 180, zP]), pr([808 + 135, 412 - 180, zP]), pr([808 + 135, 412 + 180, zP]), pr([808 - 135, 412 + 180, zP])];
  const pc = pr([808, 380, zP]);
  const posterPuntos = trama(cajaDe(poster), 13, 75, (x, y) => clamp(Math.hypot(x - pc[0], y - pc[1]) / 190) ** 1.5 * 0.75, dentroDe(poster));
  // la balda y sus libros
  const zb0 = Z_PARED + 6, zb1 = Z_PARED + 134;
  const yT = 830 - PLACA, yF = 830;
  const balda = {
    tope: [pr([628, yT, zb0]), pr([1012, yT, zb0]), pr([1012, yT, zb1]), pr([628, yT, zb1])] as P[],
    frente: [pr([628, yT, zb1]), pr([1012, yT, zb1]), pr([1012, yF, zb1]), pr([628, yF, zb1])] as P[],
  };
  const COLS = [C.rojo, C.amarillo, C.verde, C.azul, C.naranja];
  const libros = COLS.map((col, k) => {
    const cx = 680 + k * 60, h = ALTO * (1.6 + (k % 3) * 0.3);
    const z = Z_PARED + 120;
    const ang = k === 4 ? 0.35 : 0;
    // inclinado (el último): gira desde su esquina de abajo a la derecha
    const g = (dx: number, dy: number): V3 => {
      const ox = cx + 26, oy = yT;
      const x = cx + dx - ox, y = yT - dy - oy;
      return [ox + x * Math.cos(ang) - y * Math.sin(ang), oy + x * Math.sin(ang) + y * Math.cos(ang), z];
    };
    const pts: P[] = [g(-26, 0), g(26, 0), g(26, h), g(-26, h)].map(pr);
    const raya = poli([g(-26, h * 0.78), g(26, h * 0.78)].map(pr), false) + ' ' + poli([g(-26, h * 0.7), g(26, h * 0.7)].map(pr), false);
    return {pts, col, raya};
  });
  PARED = {
    fondo: poli(fondoPts), derecha: poli(derPts), puntosFondo, puntosDerecha, ladrillos: lad.join(' '),
    marco, cristal, cielo, puntosCielo, barras, alfeizar, poster, posterPuntos, balda, libros,
  };
  return PARED;
};

export const ParedComic: React.FC<{pre: string}> = ({pre}) => {
  const W = pared();
  const cc = cajaDe(W.cristal);
  const pc = pr([808, 380, Z_PARED + 6]);
  const anillos = [96, 78, 60, 42, 24];
  return (
    <g>
      <defs>
        <clipPath id={pre + 'cristal'}><path d={W.cielo} /></clipPath>
      </defs>
      <path d={W.fondo} fill={C.cianClaro} />
      <path d={W.puntosFondo} fill={C.cianPuntos} />
      <path d={W.derecha} fill={C.cianPared} />
      <path d={W.puntosDerecha} fill={C.azul} opacity={0.55} />
      <path d={W.ladrillos} fill="none" stroke={C.cianPuntos} strokeWidth={4} strokeLinejoin="round" />
      {/* la esquina y el zócalo */}
      <path d={`M ${f1(X_ESQUINA)} -20 L ${f1(X_ESQUINA)} ${f1(Y_ZOCALO)}`} stroke={TINTA} strokeWidth={5} />
      {/* la ventana */}
      <Forma d={W.marco} fill={C.crema} tinta={7} />
      <g clipPath={`url(#${pre}cristal)`}>
        <path d={W.cielo} fill={C.cian} />
        <path d={W.puntosCielo} fill={C.crema} />
        {/* dos nubes: los bultos juntos (primero todo el contorno, encima todo el relleno) */}
        {[[cc[0] + 95, cc[1] + 70, 1], [cc[0] + 268, cc[1] + 46, 0.8]].map(([x, y, s], k) => {
          const d = [[-50, 10, 30], [-18, -8, 38], [22, -4, 34], [52, 10, 26], [0, 16, 30]].map(([bx, by, br]) => circulo([x + bx * s, y + by * s], br * s)).join(' ');
          return (
            <g key={k}>
              <path d={d} fill={TINTA} stroke={TINTA} strokeWidth={10} />
              <path d={d} fill={C.crema} transform={`translate(${REG[0] * 0.5} ${REG[1] * 0.5})`} />
            </g>
          );
        })}
        {/* los árboles de fuera */}
        {[[cc[0] + 30, cc[3] - 40, 72], [cc[0] + 140, cc[3] - 70, 92], [cc[0] + 262, cc[3] - 52, 80], [cc[0] + 345, cc[3] - 28, 62]].map(([x, y, r], k) => {
          const d = circulo([x, y], r);
          const pts = trama([x - r, y - r, x + r, y + r], 12, 45, (px, py) => clamp(((px - x) * 0.6 + (py - y) * 0.8) / r + 0.15), (px, py) => Math.hypot(px - x, py - y) < r - 2);
          return <Forma key={k} d={d} fill={k % 2 ? C.verde : '#48C25A'} tinta={5} puntos={pts} colorPuntos={C.verdeSombra} />;
        })}
        {/* el brillo del cristal */}
        <path d={`M ${f1(cc[0] + 236)} ${f1(cc[1] + 120)} L ${f1(cc[0] + 286)} ${f1(cc[1] + 64)} M ${f1(cc[0] + 256)} ${f1(cc[1] + 140)} L ${f1(cc[0] + 300)} ${f1(cc[1] + 92)}`}
          stroke={C.crema} strokeWidth={9} strokeLinecap="round" />
      </g>
      {W.barras.map((d, k) => <Forma key={k} d={d} fill={C.crema} tinta={5} />)}
      <path d={W.cielo} fill="none" stroke={TINTA} strokeWidth={6} strokeLinejoin="round" />
      <Forma d={poli(W.alfeizar.cara)} fill={C.crema} tinta={5} />
      <Forma d={poli(W.alfeizar.frente)} fill="#E9D9B4" tinta={6} />
      {/* la maceta del alféizar */}
      {(() => {
        const m = pr([300, VENT.y1 + 2, Z_PARED + 50]);
        const hojas = [[-0.45, 66], [0, 86], [0.42, 62]].map(([a, l], k) => {
          const tip: P = [m[0] + Math.sin(a) * l, m[1] - 50 - Math.cos(a) * l];
          return <Forma key={k} d={capsula([m[0], m[1] - 46], tip, 12, 7)} fill={C.verde} tinta={5} />;
        });
        return (
          <g>
            {hojas}
            <Forma d={poli([[m[0] - 30, m[1] - 50], [m[0] + 30, m[1] - 50], [m[0] + 23, m[1]], [m[0] - 23, m[1]]])} fill={C.naranja} tinta={6} />
          </g>
        );
      })()}
      {/* el póster */}
      <Forma d={poli(W.poster)} fill={C.amarillo} tinta={7} puntos={W.posterPuntos} colorPuntos={C.amarilloSombra} />
      {anillos.map((r, k) => <Forma key={k} d={circulo(pc, r * 0.9)} fill={k % 2 ? C.crema : C.rojo} tinta={4} />)}
      {/* la flecha clavada fuera del centro */}
      <path d={`M ${f1(pc[0] + 30)} ${f1(pc[1] - 26)} L ${f1(pc[0] + 92)} ${f1(pc[1] - 84)}`} stroke={TINTA} strokeWidth={8} strokeLinecap="round" />
      <Forma d={poli([[pc[0] + 88, pc[1] - 80], [pc[0] + 118, pc[1] - 104], [pc[0] + 104, pc[1] - 70]])} fill={C.azul} tinta={4} />
      <Forma d={poli([[pc[0] - 82, pc[1] + 120], [pc[0] + 82, pc[1] + 120], [pc[0] + 82, pc[1] + 136], [pc[0] - 82, pc[1] + 136]])} fill={TINTA} tinta={0} />
      <Forma d={poli([[pc[0] - 56, pc[1] + 146], [pc[0] + 56, pc[1] + 146], [pc[0] + 56, pc[1] + 158], [pc[0] - 56, pc[1] + 158]])} fill={TINTA} tinta={0} />
      {/* la balda con sus libros */}
      {W.libros.map((l, k) => (
        <g key={k}>
          <Forma d={poli(l.pts)} fill={l.col} tinta={6} />
          <path d={l.raya} stroke={TINTA} strokeWidth={3.5} />
        </g>
      ))}
      <Forma d={poli(W.balda.tope)} fill={C.crema} tinta={4} />
      <Forma d={poli(W.balda.frente)} fill="#E9D9B4" tinta={6} />
    </g>
  );
};

// la luz de la bombilla en la pared: puntos amarillos que se apiñan cerca de ella
const BRILLOS = new Map<number, string>();
export const brilloBombilla = (ang: number): string => {
  const k = Math.round(ang * 200);
  const hay = BRILLOS.get(k);
  if (hay) return hay;
  const b = bombilla(ang);
  const R = 300;
  const d = trama([b[0] - R, b[1] - R, b[0] + R, b[1] + R], 18, 0, (x, y) => (1 - clamp(Math.hypot(x - b[0], (y - b[1]) * 1.1) / R)) ** 1.3 * 1.05);
  if (BRILLOS.size > 400) BRILLOS.clear();
  BRILLOS.set(k, d);
  return d;
};

// ---------------------------------------------------------------- la lámpara que cuelga
export const bombilla = (ang: number): P => {
  const L = LAMPARA;
  const d = L.largo + L.alto / 2 + 14;
  return [L.x + d * Math.sin(ang), L.yGancho + d * Math.cos(ang)];
};
export const LamparaComic: React.FC<{ang: number}> = ({ang}) => {
  const L = LAMPARA;
  const yC = L.yGancho + L.largo; // el centro de la pantalla
  const y0 = yC - L.alto / 2, y1 = yC + L.alto / 2;
  const pantalla: P[] = [[L.x - L.rArriba, y0], [L.x + L.rArriba, y0], [L.x + L.rAbajo, y1 - 4], [L.x + L.rAbajo - 6, y1 + 4], [L.x - L.rAbajo + 6, y1 + 4], [L.x - L.rAbajo, y1 - 4]];
  const sombra = trama(cajaDe(pantalla), 11, 75, (x) => suave01(L.x - 10, L.x + L.rAbajo, x) * 0.9, dentroDe(pantalla));
  const bx = L.x, by = y1 + 14;
  return (
    <g transform={`rotate(${((-ang * 180) / Math.PI).toFixed(2)} ${L.x} ${L.yGancho})`}>
      <path d={`M ${L.x} ${L.yGancho} L ${L.x} ${y0 - 18}`} stroke={TINTA} strokeWidth={6} />
      <Forma d={poli([[L.x - 22, y0 - 20], [L.x + 22, y0 - 20], [L.x + 22, y0 + 2], [L.x - 22, y0 + 2]])} fill={C.naranja} tinta={5} />
      {/* los rayitos de luz */}
      {[-150, -120, -90, -60, -30].map((a) => {
        const r = (a * Math.PI) / 180;
        return <path key={a} d={`M ${f1(bx + Math.cos(r) * 46)} ${f1(by - Math.sin(r) * 46)} L ${f1(bx + Math.cos(r) * 74)} ${f1(by - Math.sin(r) * 74)}`} stroke={TINTA} strokeWidth={5} strokeLinecap="round" />;
      })}
      <Forma d={circulo([bx, by], 25)} fill={C.crema} tinta={5} />
      <Forma d={poli(pantalla)} fill={C.naranja} tinta={7} puntos={sombra} colorPuntos={C.rojo} />
      <path d={`M ${f1(L.x - L.rArriba - 18)} ${f1(y0 + 30)} L ${f1(L.x - L.rArriba - 44)} ${f1(y1 - 16)}`} stroke={C.crema} strokeWidth={8} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------- el suelo (fijo)
type Suelo = {pts: P[]; puntos: string; tablas: string; sombras: string};
let SUELO_C: Suelo | null = null;
const suelo = (): Suelo => {
  if (SUELO_C) return SUELO_C;
  const pts: P[] = [[-20, Y_ZOCALO], [X_ESQUINA, Y_ZOCALO], [1100, Y_ESQ_BORDE + 22], [1100, 1940], [-20, 1940]];
  const VP: P = [540, 300];
  const sFin = (1940 - 300) / (SUELO - 300);
  const tablas: string[] = [];
  for (let xw = -600; xw <= MURO_X; xw += 96) {
    const a: P = [540 + (xw - 540) * S_PARED, Y_ZOCALO];
    const b: P = [540 + (xw - 540) * sFin, 1940];
    tablas.push(`M ${f1(a[0])} ${f1(a[1])} L ${f1(b[0])} ${f1(b[1])}`);
    // las juntas de cada tabla, al tresbolillo
    const r = rng(Math.round(xw) + 999);
    for (let z = Z_PARED + 120 + r() * 200; z < 1100; z += 380 + r() * 160) {
      const p0 = pr([xw, SUELO, z]), p1 = pr([xw + 96, SUELO, z]);
      tablas.push(`M ${f1(p0[0])} ${f1(p0[1])} L ${f1(p1[0])} ${f1(p1[1])}`);
    }
  }
  void VP;
  const dens = (x: number, y: number) => {
    const fondo = clamp((y - Y_ZOCALO) / (1920 - Y_ZOCALO));
    const lado = clamp(1 - Math.min(x + 20, 1080 - x) / 260);
    return Math.max(0.12 + 0.55 * fondo ** 1.6, lado * 0.85);
  };
  const puntos = trama([-20, Y_ZOCALO, 1100, 1940], 19, 75, dens, dentroDe(pts));
  // las sombras: la papelera, la silla y la mesa (la luz viene de arriba a la izquierda: caen hacia la derecha y atrás)
  const manchas: [P, number, number, number][] = [
    [pr([PAPELERA.x + 130, SUELO, PAPELERA.z - 40]), 230, 52, 0.95],
    [pr([300, SUELO, 10]), 210, 46, 0.85],
    [pr([120, SUELO, -150]), 230, 40, 0.6],
  ];
  const sombras = manchas
    .map(([c, rx, ry, k]) =>
      trama([c[0] - rx, c[1] - ry, c[0] + rx, c[1] + ry], 12, 45, (x, y) => {
        const u = ((x - c[0]) / rx) ** 2 + ((y - c[1]) / ry) ** 2;
        return u >= 1 ? 0 : k * (1 - u) ** 0.45;
      }),
    )
    .join('');
  SUELO_C = {pts, puntos, tablas: tablas.join(' '), sombras};
  return SUELO_C;
};
export const SueloComic: React.FC = () => {
  const S = suelo();
  return (
    <g>
      <path d={poli(S.pts)} fill={C.suelo} />
      <path d={S.puntos} fill={C.sueloPuntos} />
      <path d={S.tablas} stroke={C.marronClaro} strokeWidth={4} strokeLinecap="round" />
      <path d={S.sombras} fill={C.sombraSuelo} />
      {/* el zócalo y la esquina del suelo con la pared de la derecha */}
      <path d={`M -20 ${f1(Y_ZOCALO)} L ${f1(X_ESQUINA)} ${f1(Y_ZOCALO)} L 1100 ${f1(Y_ESQ_BORDE + 22)}`} fill="none" stroke={TINTA} strokeWidth={7} strokeLinejoin="round" />
    </g>
  );
};

// ---------------------------------------------------------------- la mesa, el monitor y lo de encima (fijo)
const TOPE = SUELO - MESA.alto;
const GRUESO = PLACA * 1.5;
export const MesaComic: React.FC = () => {
  const cx = (MESA.x0 + MESA.x1) / 2, cz = (MESA.z0 + MESA.z1) / 2;
  const patas: V3[] = [];
  for (const x of [MESA.x0 + 30, MESA.x1 - 30]) for (const z of [MESA.z0 + 30, MESA.z1 - 30]) patas.push([x, (TOPE + GRUESO + SUELO) / 2, z]);
  // el monitor, girado 0,45 hacia la papelera
  const g = 0.45;
  const ancho: V3 = [Math.cos(g), 0, -Math.sin(g)], frente: V3 = [Math.sin(g), 0, Math.cos(g)];
  const base: V3 = [40, TOPE - PLACA / 2, -170];
  const pantallaC: V3 = [40 + frente[0] * 12, TOPE - (PLACA + ALTO * 1.05 + 1.5 * ALTO), -170 + frente[2] * 12];
  const vidrio: V3[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [
    pantallaC[0] + ancho[0] * 113 * u + frente[0] * 16, pantallaC[1] + 102 * v, pantallaC[2] + ancho[2] * 113 * u + frente[2] * 16,
  ] as V3);
  const vid = vidrio.map(pr);
  const vb = cajaDe(vid);
  // la taza y las dos bolas de otros días
  const taza = pr([205, TOPE - 36, -80]);
  return (
    <g>
      {patas.map((c, k) => <Caja key={k} c={c} a={[22, 0, 0]} b={[0, (SUELO - TOPE - GRUESO) / 2, 0]} d={[0, 0, 22]} luz={C.gris} sombra={C.grisOscuro} tinta={5} />)}
      <Caja c={[cx, TOPE + GRUESO / 2, cz]} a={[160, 0, 0]} b={[0, GRUESO / 2, 0]} d={[0, 0, 96]} luz={C.maderaClara} sombra={C.madera} tope={C.maderaClara} puntos={C.marron} tinta={7} />
      {/* los papeles */}
      {[0, 1, 2].map((k) => {
        const y = TOPE - 4 - k * 6;
        const q: P[] = [pr([78 + k * 3, y, -245 + k * 4]), pr([228 + k * 3, y, -245 + k * 4]), pr([228 + k * 3, y, -135 + k * 4]), pr([78 + k * 3, y, -135 + k * 4])];
        return <Forma key={k} d={poli(q)} fill={C.crema} tinta={4} />;
      })}
      <Forma d={capsula([taza[0], taza[1] - 26], [taza[0], taza[1] + 30], 27, 27)} fill={C.rojo} tinta={6} />
      {/* el monitor: el pie, el cuello y la pantalla encendida */}
      <Caja c={base} a={[48, 0, 0]} b={[0, PLACA / 2, 0]} d={[0, 0, 48]} luz="#33354A" sombra={TINTA} tinta={5} />
      <Caja c={[40, TOPE - PLACA - ALTO * 0.55, -170]} a={[16, 0, 0]} b={[0, ALTO * 0.55, 0]} d={[0, 0, 16]} luz="#33354A" sombra={TINTA} tinta={5} />
      <Caja c={pantallaC} a={[ancho[0] * 128, 0, ancho[2] * 128]} b={[0, 115, 0]} d={[frente[0] * 15, 0, frente[2] * 15]} luz="#2A2C3D" sombra={TINTA} tinta={7} />
      <Forma d={poli(vid)} fill="#8DE6F4" tinta={4}
        puntos={trama(vb, 12, 15, (x, y) => 0.15 + 0.5 * clamp((y - vb[1]) / (vb[3] - vb[1])), dentroDe(vid))} colorPuntos={C.cian} />
      <path d={`M ${f1(vb[0] + 30)} ${f1(vb[1] + 90)} L ${f1(vb[0] + 90)} ${f1(vb[1] + 24)} M ${f1(vb[0] + 46)} ${f1(vb[1] + 120)} L ${f1(vb[0] + 120)} ${f1(vb[1] + 40)}`}
        stroke={C.crema} strokeWidth={8} strokeLinecap="round" />
      <BolaVieja c={pr([-10, TOPE - 34, -90])} r={30} semilla={21} />
      <BolaVieja c={pr([60, TOPE - 32, -60])} r={29} semilla={34} />
    </g>
  );
};

// ---------------------------------------------------------------- la bola de papel arrugado
const contornoBola = (semilla: number, n = 14): P[] => {
  const r = rng(semilla);
  return Array.from({length: n}, (_, k) => {
    const a = (k / n) * Math.PI * 2;
    const R = 0.9 + r() * 0.17;
    return [Math.cos(a) * R, Math.sin(a) * R] as P;
  });
};
// los pliegues: una grieta larga en zigzag y dos cortas en el borde (con dos ojos y una boca, se leía una carita)
const PLIEGUES: P[][] = [
  [[-0.82, 0.08], [-0.42, 0.26], [-0.02, -0.06], [0.36, 0.14], [0.7, -0.08]],
  [[-0.3, -0.8], [-0.12, -0.42]],
  [[0.3, 0.52], [0.52, 0.8]],
];
const BolaVieja: React.FC<{c: P; r: number; semilla: number}> = ({c, r, semilla}) => {
  const pts = contornoBola(semilla, 12).map(([x, y]) => [c[0] + x * r, c[1] + y * r] as P);
  return (
    <g>
      <Forma d={curva(pts, true)} fill={C.crema} tinta={5}
        puntos={trama(cajaDe(pts), 9, 15, (x, y) => clamp(((x - c[0]) * 0.6 + (y - c[1]) * 0.8) / r + 0.2), dentroDe(pts))} colorPuntos={C.cianPuntos} />
      <path d={PLIEGUES.map((l) => curva(l.map(([x, y]) => [c[0] + x * r, c[1] + y * r] as P))).join(' ')} fill="none" stroke={TINTA} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};
const BORDE_BOLA = contornoBola(7);
export const BolaComic: React.FC<{b: Bola}> = ({b}) => {
  const c = proyecta(b.c);
  const R = R_BOLA * escalaEn(b.c[2]) * 1.05;
  const g = (b.giro * 180) / Math.PI;
  const ang = (Math.atan2(b.aplasta.n[1], b.aplasta.n[0]) * 180) / Math.PI;
  const k = b.aplasta.k;
  const forma = BORDE_BOLA.map(([x, y]) => [x * R, y * R] as P);
  // la sombra de puntos va en la pantalla (abajo a la derecha), no gira con la bola
  const sombra = trama([c[0] - R, c[1] - R, c[0] + R, c[1] + R], 9, 15, (x, y) => clamp(((x - c[0]) * 0.6 + (y - c[1]) * 0.8) / R * 0.95 + 0.18),
    (x, y) => Math.hypot(x - c[0], y - c[1]) < R * 0.92);
  const aplasta = `rotate(${ang.toFixed(1)}) scale(${(1 - 0.28 * k).toFixed(3)} ${(1 + 0.18 * k).toFixed(3)}) rotate(${(-ang).toFixed(1)})`;
  return (
    <g>
      <g transform={`translate(${f1(c[0])} ${f1(c[1])}) ${aplasta}`}>
        <g transform={`translate(${REG[0]} ${REG[1]})`}>
          <path d={curva(forma, true)} fill={C.crema} transform={`rotate(${g.toFixed(1)})`} />
          <path d={sombra} fill={C.cianPuntos} transform={`translate(${f1(-c[0])} ${f1(-c[1])})`} />
        </g>
        <g transform={`rotate(${g.toFixed(1)})`}>
          <path d={curva(forma, true)} fill="none" stroke={TINTA} strokeWidth={6.5} strokeLinejoin="round" />
          <path d={PLIEGUES.map((l) => curva(l.map(([x, y]) => [x * R, y * R] as P))).join(' ')} fill="none" stroke={TINTA} strokeWidth={3.8} strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
};
// la sombra de la bola en el suelo: puntos oscuros que se juntan cuanto más baja
export const SombraBola: React.FC<{b: Bola}> = ({b}) => {
  if (b.dentro) return null;
  const alto = SUELO - R_BOLA - b.c[1];
  if (alto > 520 || b.c[2] < Z_PARED) return null;
  const c = pr([b.c[0] + 10, SUELO, b.c[2]]);
  const k = 1 - alto / 520;
  const rx = 58 * (0.6 + 0.4 * k), ry = 13 * (0.6 + 0.4 * k);
  return <path d={poli(elipse(c, rx, ry, 28))} fill={C.sombraSuelo} opacity={0.25 + 0.6 * k} />;
};

// ---------------------------------------------------------------- la papelera: lo de atrás (la boca) y lo de delante (el cuerpo y el aro)
const PB = PAPELERA;
const R_FUERA = PB.rBorde + PB.tubo, R_DENTRO = PB.rBorde - PB.tubo;
const R_CUERPO_ARRIBA = PB.rBorde + PB.pared, R_CUERPO_ABAJO = PB.rBase + PB.pared;
type Papelera = {boca: P[]; fondo: string; cuerpo: P[]; puntos: string; costillas: string; juntas: string; brillo: string; aroDelante: P[]; aroTodo: P[]};
let PAP: Papelera | null = null;
const papeleraFija = (): Papelera => {
  if (PAP) return PAP;
  const yA = PB.yBorde;
  const aroTodo = aro(PB.x, yA, PB.z, R_FUERA, 0, Math.PI * 2, 64);
  const boca = aro(PB.x, yA, PB.z, R_DENTRO, 0, Math.PI * 2, 64);
  // lo hondo de la boca: la pared de dentro del fondo, más clara arriba
  const hondo = aro(PB.x, yA + 70, PB.z, R_DENTRO - 6, 0, Math.PI * 2, 64);
  const arriba = aro(PB.x, yA + PB.tubo, PB.z, R_CUERPO_ARRIBA, 0, Math.PI, 32);
  const abajo = aro(PB.x, SUELO - 2, PB.z, R_CUERPO_ABAJO, 0, Math.PI, 32);
  const cuerpo = [...arriba, ...abajo.reverse()];
  const caj = cajaDe(cuerpo);
  // la sombra de puntos del lado derecho (la luz entra por la izquierda) y un poco en el borde izquierdo
  const puntos = trama(caj, 13, 75, (x) => Math.max(suave01(PB.x - 30, PB.x + R_CUERPO_ARRIBA - 4, x) * 1.05, 0.5 * (1 - suave01(PB.x - R_CUERPO_ARRIBA, PB.x - R_CUERPO_ARRIBA + 34, x))),
    (x, y) => dentroDe(cuerpo)(x, y) && x < PB.x + R_CUERPO_ABAJO + (R_CUERPO_ARRIBA - R_CUERPO_ABAJO) * clamp((SUELO - y) / (SUELO - yA)) - 14);
  const costillas: string[] = [];
  for (let k = 0; k < 18; k++) {
    const f = ((k + 0.5) / 18) * Math.PI * 2;
    if (Math.sin(f) < 0.12) continue;
    const a = pr([PB.x + R_CUERPO_ARRIBA * Math.cos(f), yA + PB.tubo + 4, PB.z + R_CUERPO_ARRIBA * Math.sin(f)]);
    const b = pr([PB.x + R_CUERPO_ABAJO * Math.cos(f), SUELO - 6, PB.z + R_CUERPO_ABAJO * Math.sin(f)]);
    costillas.push(`M ${f1(a[0])} ${f1(a[1])} L ${f1(b[0])} ${f1(b[1])}`);
  }
  const juntas: string[] = [];
  for (let k = 1; k < 5; k++) {
    const y = SUELO - k * ALTO;
    const r = R_CUERPO_ABAJO + (R_CUERPO_ARRIBA - R_CUERPO_ABAJO) * ((SUELO - y) / (SUELO - yA - PB.tubo));
    juntas.push(curva(aro(PB.x, y, PB.z, r, 0.06, Math.PI - 0.06, 24)));
  }
  // el brillo: dos franjas claras delante a la izquierda
  const franja = (f0: number, f1_: number) => {
    const a = aro(PB.x, yA + PB.tubo + 10, PB.z, R_CUERPO_ARRIBA, f0, f1_, 6);
    const b = aro(PB.x, SUELO - 14, PB.z, R_CUERPO_ABAJO, f0, f1_, 6).reverse();
    return poli([...a, ...b]);
  };
  const brillo = franja(2.02, 2.16) + ' ' + franja(2.3, 2.35);
  const aroDelante = [...aro(PB.x, yA, PB.z, R_FUERA, 0, Math.PI, 40), ...aro(PB.x, yA, PB.z, R_DENTRO, 0, Math.PI, 40).reverse()];
  PAP = {boca, fondo: poli(hondo), cuerpo, puntos, costillas: costillas.join(' '), juntas: juntas.join(' '), brillo, aroDelante, aroTodo};
  return PAP;
};
const giroPapelera = (inclina: number) => `rotate(${((inclina * 180) / Math.PI).toFixed(3)} ${PB.x} ${SUELO})`;
export const PapeleraAtras: React.FC<{inclina: number}> = ({inclina}) => {
  const P_ = papeleraFija();
  return (
    <g transform={giroPapelera(inclina)}>
      <Forma d={poli(P_.aroTodo)} fill={C.crema} tinta={7} />
      <g transform={`translate(${REG[0]} ${REG[1]})`}>
        <path d={poli(P_.boca)} fill={C.rojoSombra} />
        <path d={P_.fondo} fill={C.rojoHondo} />
      </g>
      <path d={poli(P_.boca)} fill="none" stroke={TINTA} strokeWidth={5} />
    </g>
  );
};
export const PapeleraDelante: React.FC<{inclina: number}> = ({inclina}) => {
  const P_ = papeleraFija();
  return (
    <g transform={giroPapelera(inclina)}>
      <Forma d={poli(P_.cuerpo)} fill={C.rojo} tinta={0} puntos={P_.puntos} colorPuntos={C.rojoSombra}
        extra={<path d={P_.brillo} fill={C.crema} />} />
      <path d={P_.juntas} fill="none" stroke={C.rojoSombra} strokeWidth={3.5} />
      <path d={P_.costillas} fill="none" stroke={TINTA} strokeWidth={3} strokeLinecap="round" />
      <path d={poli(P_.cuerpo)} fill="none" stroke={TINTA} strokeWidth={8} strokeLinejoin="round" />
      <Forma d={poli(P_.aroDelante)} fill={C.crema} tinta={6} />
    </g>
  );
};
// ¿va la bola dentro de la papelera o detrás de su aro? (entonces se pinta entre lo de atrás y lo de delante)
export const bolaEntrePapelera = (b: Bola) => {
  if (b.dentro) return true;
  const rho = Math.hypot(b.c[0] - PB.x, b.c[2] - PB.z);
  return b.c[2] < PB.z && rho < PB.rBorde + PB.tubo + R_BOLA + 10 && b.c[1] > PB.yBorde - 2.2 * R_BOLA;
};
// la boca, en la pantalla (para los efectos)
export const BOCA: P = pr([PB.x, PB.yBorde, PB.z]);
